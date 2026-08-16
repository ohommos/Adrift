import type {
  BottleScope,
  InboxItem,
  ReaderActionKind,
  ReplyResponse,
} from "@adrift/shared";
import { CREDITS_PER_REPLY, MAX_BOTTLE_LENGTH } from "@adrift/shared";
import {
  db,
  userTable,
  bottleTable,
  bottleInteractionTable,
  bottleOpenTable,
  cityTable,
  replyTable,
} from "@workspace/db";
import { eq, and, or, ne, inArray, notInArray, isNotNull, sql, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { randomOceanPoint } from "../lib/geo";
import { UNKNOWN_COUNTRY } from "../lib/geoip";
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function findUserOrThrow(id: string) {
  const [user] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
  if (!user) throw new HttpError(400, "User not found");
  return user;
}

// ---------------------------------------------------------------------------
// createBottle
// ---------------------------------------------------------------------------
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

  const author = await findUserOrThrow(authorId);
  let targetCityId: string | null = null;
  let origin = randomOceanPoint();

  if (input.scope === "city") {
    if (!input.targetCityId) {
      throw new HttpError(400, "targetCityId is required for city-scoped bottles");
    }
    targetCityId = input.targetCityId;
    const [targetCity] = await db
      .select()
      .from(cityTable)
      .where(eq(cityTable.id, targetCityId))
      .limit(1);
    if (!targetCity) throw new HttpError(400, "Unknown targetCityId");

    // Your own shore is always free; reaching any other port is Pro.
    // Accounts made before the picker existed have no chosen shore, so they
    // fall back to the country resolved at signup rather than losing the
    // free port they already had.
    const isHomeWater = author.homeCityId
      ? author.homeCityId === targetCity.id
      : author.homeCountry !== UNKNOWN_COUNTRY &&
        targetCity.country === author.homeCountry;
    if (!isHomeWater && !author.isPro) {
      throw new HttpError(403, "Sending to another city requires Pro");
    }

    origin = { lat: targetCity.lat, lon: targetCity.lon };
  }

  const [bottle] = await db
    .insert(bottleTable)
    .values({
      id: randomUUID(),
      authorId,
      text,
      scope: input.scope,
      targetCityId,
      state: "drifting",
      originLat: origin.lat,
      originLon: origin.lon,
      currentLat: origin.lat,
      currentLon: origin.lon,
      progress: 0,
      passOnCount: 0,
      breakVotes: 0,
      lastEventAt: new Date(),
    })
    .returning();
  return bottle;
}

// ---------------------------------------------------------------------------
// listInbox
// ---------------------------------------------------------------------------
export async function listInbox(readerId: string): Promise<InboxItem[]> {
  const resolvedRows = await db
    .select({ bottleId: bottleInteractionTable.bottleId })
    .from(bottleInteractionTable)
    .where(
      and(
        eq(bottleInteractionTable.readerId, readerId),
        isNotNull(bottleInteractionTable.action)
      )
    );

  const resolvedIds = resolvedRows.map((r) => r.bottleId);

  const bottleConditions = and(
    ne(bottleTable.authorId, readerId),
    inArray(bottleTable.state, ["drifting", "nearing", "opened"]),
    resolvedIds.length > 0 ? notInArray(bottleTable.id, resolvedIds) : undefined
  );

  const bottles = await db
    .select({
      id: bottleTable.id,
      scope: bottleTable.scope,
      passOnCount: bottleTable.passOnCount,
      text: bottleTable.text,
      createdAt: bottleTable.createdAt,
      authorNickname: userTable.nickname,
      authorFlag: userTable.flag,
      authorCountry: userTable.homeCountry,
    })
    .from(bottleTable)
    .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
    .where(bottleConditions)
    .orderBy(desc(bottleTable.lastEventAt))
    .limit(20);

  const bottleIds = bottles.map((b) => b.id);
  const interactions =
    bottleIds.length > 0
      ? await db
          .select()
          .from(bottleInteractionTable)
          .where(
            and(
              inArray(bottleInteractionTable.bottleId, bottleIds),
              eq(bottleInteractionTable.readerId, readerId)
            )
          )
      : [];
  const interactionByBottleId = new Map(interactions.map((i) => [i.bottleId, i]));

  return bottles.map((b) => {
    const mine = interactionByBottleId.get(b.id);
    const opened = !!mine;
    return {
      id: b.id,
      scope: b.scope as InboxItem["scope"],
      passOnCount: b.passOnCount,
      opened,
      text: opened ? b.text : null,
      authorNickname: opened ? b.authorNickname : null,
      authorFlag: opened ? b.authorFlag : null,
      authorCountry: opened ? b.authorCountry : null,
      createdAt: b.createdAt.toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// openBottle
// ---------------------------------------------------------------------------
export async function openBottle(bottleId: string, readerId: string): Promise<InboxItem> {
  const [bottleRow] = await db
    .select({
      bottle: bottleTable,
      authorNickname: userTable.nickname,
      authorFlag: userTable.flag,
      authorCountry: userTable.homeCountry,
    })
    .from(bottleTable)
    .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
    .where(eq(bottleTable.id, bottleId))
    .limit(1);

  if (!bottleRow) throw new HttpError(404, "Not found");
  const { bottle, authorNickname, authorFlag, authorCountry } = bottleRow;

  if (bottle.authorId === readerId) throw new HttpError(400, "Can't open your own bottle");
  if (bottle.state === "lost") throw new HttpError(410, "This bottle is lost at sea");

  const reader = await findUserOrThrow(readerId);

  const reveal = (): InboxItem => ({
    id: bottle.id,
    scope: bottle.scope as InboxItem["scope"],
    passOnCount: bottle.passOnCount,
    opened: true,
    text: bottle.text,
    authorNickname,
    authorFlag,
    authorCountry,
    createdAt: bottle.createdAt.toISOString(),
  });

  const [existing] = await db
    .select()
    .from(bottleInteractionTable)
    .where(
      and(
        eq(bottleInteractionTable.bottleId, bottleId),
        eq(bottleInteractionTable.readerId, readerId)
      )
    )
    .limit(1);
  if (existing) return reveal();

  const priorOpens = await db
    .select({ country: bottleOpenTable.country })
    .from(bottleOpenTable)
    .where(eq(bottleOpenTable.bottleId, bottleId));

  await db.insert(bottleInteractionTable).values({
    id: randomUUID(),
    bottleId,
    readerId,
  });

  const readerCountry = reader.homeCountry;
  const priorCountries = [...new Set(priorOpens.map((o) => o.country))];
  await db.insert(bottleOpenTable).values({
    id: randomUUID(),
    bottleId,
    readerId,
    country: readerCountry,
  });

  const wasFirstOpen = priorOpens.length === 0;
  if (bottle.state === "drifting" || bottle.state === "nearing") {
    await db
      .update(bottleTable)
      .set({ state: "opened" })
      .where(eq(bottleTable.id, bottleId));
  }

  if (wasFirstOpen) {
    await notify(bottle.authorId, bottle.id, "opened", "Someone opened your bottle.");
  } else if (
    bottle.scope === "global" &&
    // An unresolved country is not a place — telling the author their bottle
    // was "Opened in Unknown." is worse than staying quiet about this open.
    readerCountry !== UNKNOWN_COUNTRY &&
    !priorCountries.includes(readerCountry)
  ) {
    await notify(
      bottle.authorId,
      bottle.id,
      "country",
      `Opened in ${readerCountry}.`
    );
  }

  return reveal();
}

// ---------------------------------------------------------------------------
// resolveFate
// ---------------------------------------------------------------------------
export async function resolveFate(
  bottleId: string,
  readerId: string,
  kind: ReaderActionKind
) {
  const [interaction] = await db
    .select()
    .from(bottleInteractionTable)
    .where(
      and(
        eq(bottleInteractionTable.bottleId, bottleId),
        eq(bottleInteractionTable.readerId, readerId)
      )
    )
    .limit(1);
  if (!interaction) throw new HttpError(400, "Open the bottle before deciding its fate");
  if (interaction.action) throw new HttpError(409, "Already decided");

  await db
    .update(bottleInteractionTable)
    .set({ action: kind, actedAt: new Date() })
    .where(
      and(
        eq(bottleInteractionTable.bottleId, bottleId),
        eq(bottleInteractionTable.readerId, readerId)
      )
    );

  const [updatedReader] = await db
    .update(userTable)
    .set({ credits: sql`${userTable.credits} + 1` })
    .where(eq(userTable.id, readerId))
    .returning();

  const [bottle] = await db
    .select()
    .from(bottleTable)
    .where(eq(bottleTable.id, bottleId))
    .limit(1);
  if (!bottle) throw new HttpError(404, "Bottle not found");

  if (kind === "break") {
    const newBreakVotes = bottle.breakVotes + 1;
    const sunk = newBreakVotes >= DIALS.BREAKAGE_THRESHOLD;
    await db
      .update(bottleTable)
      .set({
        breakVotes: newBreakVotes,
        state: sunk ? "lost" : bottle.state,
        lastEventAt: new Date(),
      })
      .where(eq(bottleTable.id, bottleId));
    if (sunk) {
      await notify(bottle.authorId, bottle.id, "lost", "Lost at sea.");
    }
  } else {
    const point = randomOceanPoint();
    await db
      .update(bottleTable)
      .set({
        passOnCount: sql`${bottleTable.passOnCount} + 1`,
        state: "drifting",
        progress: 0,
        currentLat: point.lat,
        currentLon: point.lon,
        lastEventAt: new Date(),
      })
      .where(eq(bottleTable.id, bottleId));
    await notify(
      bottle.authorId,
      bottle.id,
      "passed",
      `Passed on — now on its ${bottle.passOnCount + 1}${ordinalSuffix(bottle.passOnCount + 1)} shore.`
    );
  }

  return updatedReader!.credits;
}

// ---------------------------------------------------------------------------
// replyToBottle
// ---------------------------------------------------------------------------
export async function replyToBottle(
  bottleId: string,
  readerId: string,
  text: string
): Promise<ReplyResponse> {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length === 0 || trimmed.length > MAX_BOTTLE_LENGTH) {
    throw new HttpError(400, `Text must be 1-${MAX_BOTTLE_LENGTH} characters`);
  }

  const [bottle] = await db
    .select()
    .from(bottleTable)
    .where(eq(bottleTable.id, bottleId))
    .limit(1);
  if (!bottle) throw new HttpError(404, "Not found");

  const [interaction] = await db
    .select()
    .from(bottleInteractionTable)
    .where(
      and(
        eq(bottleInteractionTable.bottleId, bottleId),
        eq(bottleInteractionTable.readerId, readerId)
      )
    )
    .limit(1);
  if (!interaction) throw new HttpError(400, "Open the bottle before replying");

  const user = await findUserOrThrow(readerId);
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

  await db.transaction(async (tx) => {
    await tx.insert(replyTable).values({
      id: randomUUID(),
      bottleId,
      fromUserId: readerId,
      toUserId: bottle.authorId,
      text: trimmed,
    });
    await tx
      .update(userTable)
      .set({ usedFreeReply, credits })
      .where(eq(userTable.id, readerId));
  });

  await notify(bottle.authorId, bottle.id, "reply", `${user.nickname} replied to your bottle.`);

  return { credits, usedFreeReply };
}
