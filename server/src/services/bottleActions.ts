import type {
  BottleScope,
  InboxItem,
  ReaderActionKind,
  ReplyResponse,
} from "@adrift/shared";
import { CREDITS_PER_REPLY, MAX_BOTTLE_LENGTH } from "@adrift/shared";
import { prisma } from "../lib/prisma";
import { randomOceanPoint } from "../lib/geo";
import { DIALS } from "../engine/dials";
import { notify } from "../engine/notify";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function ordinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export async function createBottle(
  authorId: string,
  input: { text: string; scope: BottleScope; targetCityId?: string | null }
) {
  const text = input.text?.trim();
  if (!text || text.length === 0 || text.length > MAX_BOTTLE_LENGTH) {
    throw new HttpError(400, `Text must be 1-${MAX_BOTTLE_LENGTH} characters`);
  }
  if (input.scope !== "city" && input.scope !== "global") {
    throw new HttpError(400, "scope must be 'city' or 'global'");
  }

  const author = await prisma.user.findUniqueOrThrow({ where: { id: authorId } });
  let targetCityId: string | null = null;
  let origin = randomOceanPoint();

  if (input.scope === "city") {
    targetCityId = input.targetCityId ?? author.homeCityId;
    if (targetCityId !== author.homeCityId && !author.isPro) {
      throw new HttpError(403, "Sending to another city requires Pro");
    }
    const targetCity = await prisma.city.findUnique({ where: { id: targetCityId } });
    if (!targetCity) throw new HttpError(400, "Unknown targetCityId");
    origin = { lat: targetCity.lat, lon: targetCity.lon };
  }

  return prisma.bottle.create({
    data: {
      authorId,
      text,
      scope: input.scope,
      targetCityId,
      state: "drifting",
      originLat: origin.lat,
      originLon: origin.lon,
      currentLat: origin.lat,
      currentLon: origin.lon,
    },
  });
}

export async function listInbox(readerId: string): Promise<InboxItem[]> {
  const [resolved, reader] = await Promise.all([
    prisma.bottleInteraction.findMany({
      where: { readerId, action: { not: null } },
      select: { bottleId: true },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: readerId }, select: { homeCityId: true } }),
  ]);
  const resolvedIds = resolved.map((r) => r.bottleId);

  const eligible = await prisma.bottle.findMany({
    where: {
      authorId: { not: readerId },
      state: { in: ["drifting", "nearing", "opened"] },
      id: { notIn: resolvedIds },
      OR: [{ scope: "global" }, { scope: "city", targetCityId: reader.homeCityId }],
    },
    orderBy: { lastEventAt: "desc" },
    take: 20,
    include: {
      author: { include: { homeCity: true } },
      interactions: { where: { readerId } },
    },
  });

  return eligible.map((b) => {
    const mine = b.interactions[0];
    const opened = !!mine;
    return {
      id: b.id,
      scope: b.scope as InboxItem["scope"],
      passOnCount: b.passOnCount,
      opened,
      text: opened ? b.text : null,
      authorNickname: opened ? b.author.nickname : null,
      authorFlag: opened ? b.author.flag : null,
      authorCity: opened ? b.author.homeCity.name : null,
      createdAt: b.createdAt.toISOString(),
    };
  });
}

export async function openBottle(bottleId: string, readerId: string): Promise<InboxItem> {
  const bottle = await prisma.bottle.findUnique({
    where: { id: bottleId },
    include: { author: { include: { homeCity: true } } },
  });
  if (!bottle) throw new HttpError(404, "Not found");
  if (bottle.authorId === readerId) throw new HttpError(400, "Can't open your own bottle");
  if (bottle.state === "lost") throw new HttpError(410, "This bottle is lost at sea");

  const reader = await prisma.user.findUniqueOrThrow({ where: { id: readerId } });
  if (bottle.scope === "city" && bottle.targetCityId !== reader.homeCityId) {
    throw new HttpError(403, "Not in this bottle's water");
  }

  const reveal = (): InboxItem => ({
    id: bottle.id,
    scope: bottle.scope as InboxItem["scope"],
    passOnCount: bottle.passOnCount,
    opened: true,
    text: bottle.text,
    authorNickname: bottle.author.nickname,
    authorFlag: bottle.author.flag,
    authorCity: bottle.author.homeCity.name,
    createdAt: bottle.createdAt.toISOString(),
  });

  const existing = await prisma.bottleInteraction.findUnique({
    where: { bottleId_readerId: { bottleId, readerId } },
  });
  if (existing) return reveal();

  const [, priorOpens, readerCity] = await Promise.all([
    prisma.bottleInteraction.create({ data: { bottleId, readerId } }),
    prisma.bottleOpen.findMany({ where: { bottleId }, select: { country: true } }),
    prisma.city.findUniqueOrThrow({ where: { id: reader.homeCityId } }),
  ]);
  const priorCountries = [...new Set(priorOpens.map((o) => o.country))];

  await prisma.bottleOpen.create({
    data: { bottleId, readerId, country: readerCity.country },
  });

  const wasFirstOpen = priorOpens.length === 0;
  if (bottle.state === "drifting" || bottle.state === "nearing") {
    await prisma.bottle.update({ where: { id: bottleId }, data: { state: "opened" } });
  }

  if (wasFirstOpen) {
    await notify(bottle.authorId, bottle.id, "opened", "Someone opened your bottle.");
  } else if (bottle.scope === "global" && !priorCountries.includes(readerCity.country)) {
    await notify(bottle.authorId, bottle.id, "country", `Opened in ${readerCity.country}.`);
  }

  return reveal();
}

export async function resolveFate(bottleId: string, readerId: string, kind: ReaderActionKind) {
  const interaction = await prisma.bottleInteraction.findUnique({
    where: { bottleId_readerId: { bottleId, readerId } },
  });
  if (!interaction) throw new HttpError(400, "Open the bottle before deciding its fate");
  if (interaction.action) throw new HttpError(409, "Already decided");

  await prisma.bottleInteraction.update({
    where: { bottleId_readerId: { bottleId, readerId } },
    data: { action: kind, actedAt: new Date() },
  });
  const reader = await prisma.user.update({
    where: { id: readerId },
    data: { credits: { increment: 1 } },
  });

  const bottle = await prisma.bottle.findUniqueOrThrow({ where: { id: bottleId } });
  if (kind === "break") {
    const breakVotes = bottle.breakVotes + 1;
    const sunk = breakVotes >= DIALS.BREAKAGE_THRESHOLD;
    await prisma.bottle.update({
      where: { id: bottleId },
      data: { breakVotes, state: sunk ? "lost" : bottle.state, lastEventAt: new Date() },
    });
    if (sunk) {
      await notify(bottle.authorId, bottle.id, "lost", "Lost at sea.");
    }
  } else {
    const point = randomOceanPoint();
    await prisma.bottle.update({
      where: { id: bottleId },
      data: {
        passOnCount: { increment: 1 },
        state: "drifting",
        progress: 0,
        currentLat: point.lat,
        currentLon: point.lon,
        lastEventAt: new Date(),
      },
    });
    await notify(
      bottle.authorId,
      bottle.id,
      "passed",
      `Passed on — now on its ${bottle.passOnCount + 1}${ordinalSuffix(bottle.passOnCount + 1)} shore.`
    );
  }

  return reader.credits;
}

export async function replyToBottle(
  bottleId: string,
  readerId: string,
  text: string
): Promise<ReplyResponse> {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length === 0 || trimmed.length > MAX_BOTTLE_LENGTH) {
    throw new HttpError(400, `Text must be 1-${MAX_BOTTLE_LENGTH} characters`);
  }

  const bottle = await prisma.bottle.findUnique({ where: { id: bottleId } });
  if (!bottle) throw new HttpError(404, "Not found");

  const interaction = await prisma.bottleInteraction.findUnique({
    where: { bottleId_readerId: { bottleId, readerId } },
  });
  if (!interaction) throw new HttpError(400, "Open the bottle before replying");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: readerId } });
  let usedFreeReply = user.usedFreeReply;
  let credits = user.credits;

  if (!user.isPro) {
    if (!user.usedFreeReply) {
      usedFreeReply = true;
    } else if (user.credits >= CREDITS_PER_REPLY) {
      credits -= CREDITS_PER_REPLY;
    } else {
      throw new HttpError(402, "Not enough credits for a reply");
    }
  }

  await prisma.$transaction([
    prisma.reply.create({
      data: { bottleId, fromUserId: readerId, toUserId: bottle.authorId, text: trimmed },
    }),
    prisma.user.update({ where: { id: readerId }, data: { usedFreeReply, credits } }),
  ]);

  await notify(bottle.authorId, bottle.id, "reply", `${user.nickname} replied to your bottle.`);

  return { credits, usedFreeReply };
}
