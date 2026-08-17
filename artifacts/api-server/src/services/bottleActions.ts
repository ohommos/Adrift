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
  replyTable,
} from "@workspace/db";
import {
  eq,
  and,
  or,
  gte,
  lte,
  ne,
  inArray,
  notInArray,
  isNotNull,
  sql,
  desc,
} from "drizzle-orm";
import { randomUUID } from "crypto";
import { greatCircleKm, offshorePoint, randomOceanPoint } from "../lib/geo";
import { boundingBox } from "../lib/proximity";
import { getShore } from "../lib/shores";
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
  input: { text: string; scope: BottleScope; targetShoreId?: string | null }
) {
  const text = input.text?.trim();
  if (!text || text.length === 0 || text.length > MAX_BOTTLE_LENGTH) {
    throw new HttpError(400, `Text must be 1-${MAX_BOTTLE_LENGTH} characters`);
  }
  if (input.scope !== "shore" && input.scope !== "ocean") {
    throw new HttpError(400, "scope must be 'shore' or 'ocean'");
  }

  const author = await findUserOrThrow(authorId);
  const home = await getShore(author.homeShoreId);
  if (!home) {
    // Nobody writes from nowhere. Every account picks a shore at onboarding;
    // an account without one has to pick before it can do anything.
    throw new HttpError(409, "Pick your shore before you send anything");
  }

  let targetShoreId: string | null = null;
  // Ocean bottles are cast from the author's own shore and drift from there,
  // which is what makes "it drifted past you" mean anything. Shore-addressed
  // bottles start off the shore they are aimed at.
  let origin = offshorePoint(home.lat, home.lon, DIALS.CAST_OFFSET_KM);

  if (input.scope === "shore") {
    if (!input.targetShoreId) {
      throw new HttpError(400, "targetShoreId is required for shore-scoped bottles");
    }
    const target = await getShore(input.targetShoreId);
    if (!target) throw new HttpError(400, "Unknown targetShoreId");
    targetShoreId = target.id;

    // Your own shore is always free; writing to any other one is Pro.
    if (target.id !== home.id && !author.isPro) {
      throw new HttpError(403, "Writing to another shore requires Pro");
    }

    origin = offshorePoint(target.lat, target.lon, DIALS.CAST_OFFSET_KM);
  }

  const [bottle] = await db
    .insert(bottleTable)
    .values({
      id: randomUUID(),
      authorId,
      text,
      scope: input.scope,
      targetShoreId,
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
/**
 * What has washed up where you are.
 *
 * Two things can reach you:
 *  - a bottle addressed to your shore, which nobody else can find; and
 *  - a bottle drifting in the open ocean that is currently within your
 *    shore's reach.
 *
 * Reach is the whole point of drift: a bottle passes by, and if nobody
 * fishes it out it moves on to somewhere else. But an empty sea is worse
 * than an imprecise one, so when there is little near you the horizon widens
 * until there is something to read. Nothing about any of this is exposed —
 * the client just gets a list.
 */
export async function listInbox(readerId: string): Promise<InboxItem[]> {
  const reader = await findUserOrThrow(readerId);
  const home = await getShore(reader.homeShoreId);

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

  const select = {
    id: bottleTable.id,
    scope: bottleTable.scope,
    passOnCount: bottleTable.passOnCount,
    text: bottleTable.text,
    createdAt: bottleTable.createdAt,
    currentLat: bottleTable.currentLat,
    currentLon: bottleTable.currentLon,
    authorNickname: userTable.nickname,
    authorFlag: userTable.flag,
    authorCountry: userTable.homeCountry,
  };

  /** Everything that is in play for this reader, whatever its distance. */
  const eligible = and(
    ne(bottleTable.authorId, readerId),
    inArray(bottleTable.state, ["drifting", "nearing", "opened"]),
    resolvedIds.length > 0 ? notInArray(bottleTable.id, resolvedIds) : undefined,
    // A bottle addressed to a shore belongs to the people who live there.
    // Anything else is either open ocean or somebody else's mail.
    home
      ? or(eq(bottleTable.scope, "ocean"), eq(bottleTable.targetShoreId, home.id))
      : eq(bottleTable.scope, "ocean")
  );

  const runQuery = (where: ReturnType<typeof and>, limit: number) =>
    db
      .select(select)
      .from(bottleTable)
      .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
      .where(where)
      .orderBy(desc(bottleTable.lastEventAt))
      .limit(limit);

  // Without a shore there is no point to measure from, so fall back to plain
  // recency. Onboarding does not allow this; only accounts that predate
  // shores can land here, and the app makes them pick.
  if (!home) {
    const rows = await runQuery(eligible, DIALS.INBOX_LIMIT);
    return decorate(rows, readerId);
  }

  // Everything addressed to this shore, newest first — always visible, never
  // subject to reach. It was sent here on purpose.
  const addressed = await runQuery(
    and(eligible, eq(bottleTable.targetShoreId, home.id)),
    DIALS.INBOX_LIMIT
  );

  // Drifting bottles currently within reach. The box is a cheap prefilter;
  // the great-circle distance below is what actually decides.
  const box = boundingBox(home.lat, home.lon, DIALS.REACH_KM);
  const inBox = await runQuery(
    and(
      eligible,
      eq(bottleTable.scope, "ocean"),
      gte(bottleTable.currentLat, box.minLat),
      lte(bottleTable.currentLat, box.maxLat),
      or(
        ...box.lonRanges.map(([lo, hi]) =>
          and(gte(bottleTable.currentLon, lo), lte(bottleTable.currentLon, hi))
        )
      )
    ),
    DIALS.INBOX_LIMIT * 4
  );

  const near = inBox
    .map((b) => ({
      row: b,
      km: greatCircleKm(home.lat, home.lon, b.currentLat, b.currentLon),
    }))
    .filter((b) => b.km <= DIALS.REACH_KM)
    .sort((a, b) => a.km - b.km)
    .map((b) => b.row);

  let ocean = near;

  // Nothing much is passing by. Rather than show an empty shore, widen the
  // horizon and take the nearest of whatever else is out there.
  if (addressed.length + ocean.length < DIALS.INBOX_TARGET) {
    const seen = new Set([...addressed, ...ocean].map((b) => b.id));
    const rest = await runQuery(
      and(
        eligible,
        eq(bottleTable.scope, "ocean"),
        seen.size > 0 ? notInArray(bottleTable.id, [...seen]) : undefined
      ),
      DIALS.INBOX_LIMIT * 4
    );
    const widened = rest
      .map((b) => ({
        row: b,
        km: greatCircleKm(home.lat, home.lon, b.currentLat, b.currentLon),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, DIALS.INBOX_TARGET - addressed.length - ocean.length)
      .map((b) => b.row);
    ocean = ocean.concat(widened);
  }

  return decorate([...addressed, ...ocean].slice(0, DIALS.INBOX_LIMIT), readerId);
}

/** Attach each bottle's opened/sealed state for this reader. */
async function decorate(
  rows: Array<{
    id: string;
    scope: string;
    passOnCount: number;
    text: string;
    createdAt: Date;
    authorNickname: string;
    authorFlag: string;
    authorCountry: string;
  }>,
  readerId: string
): Promise<InboxItem[]> {
  const ids = rows.map((b) => b.id);
  const interactions =
    ids.length > 0
      ? await db
          .select()
          .from(bottleInteractionTable)
          .where(
            and(
              inArray(bottleInteractionTable.bottleId, ids),
              eq(bottleInteractionTable.readerId, readerId)
            )
          )
      : [];
  const byBottleId = new Map(interactions.map((i) => [i.bottleId, i]));

  return rows.map((b) => {
    const opened = byBottleId.has(b.id);
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
    bottle.scope === "ocean" &&
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
    // Back into the water from where it was found, not teleported to a random
    // spot on the planet. It keeps its heading and carries on from this shore.
    const reader = await getShore(updatedReader!.homeShoreId);
    const point = reader
      ? offshorePoint(reader.lat, reader.lon, DIALS.CAST_OFFSET_KM)
      : randomOceanPoint();
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
