import { randomUUID } from "crypto";
import type {
  CorrespondenceDetail,
  CorrespondenceSummary,
  Letter as SharedLetter,
  WriteLetterResponse,
} from "@adrift/shared";
import { CREDITS_PER_REPLY, MAX_BOTTLE_LENGTH } from "@adrift/shared";
import {
  db,
  bottleTable,
  correspondenceTable,
  letterTable,
  userTable,
  type Correspondence,
  type User,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { crossingMinutes } from "../lib/crossing";
import { getShore } from "../lib/shores";
import { notify } from "../engine/notify";
import { HttpError } from "./bottleActions";

/** The home shore of a user, or null on an account that predates shores. */
async function shoreOf(user: Pick<User, "homeShoreId">) {
  return getShore(user.homeShoreId);
}

function otherParty(c: Correspondence, meId: string) {
  return c.authorId === meId ? c.correspondentId : c.authorId;
}

/**
 * What the next letter costs the caller.
 *
 * The bottle's author always writes free — they are answering their own
 * bottle. The stranger gets their first letter free, and pays once to keep
 * the channel open past it; after that the correspondence is free both ways.
 */
export function letterCost(c: Correspondence, me: User, lettersFromMe: number): number {
  if (me.isPro) return 0;
  if (c.authorId === me.id) return 0;
  if (c.channelOpen) return 0;
  return lettersFromMe === 0 ? 0 : CREDITS_PER_REPLY;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------
export async function listCorrespondences(meId: string): Promise<CorrespondenceSummary[]> {
  const rows = await db
    .select({
      c: correspondenceTable,
      bottleText: bottleTable.text,
    })
    .from(correspondenceTable)
    .innerJoin(bottleTable, eq(correspondenceTable.bottleId, bottleTable.id))
    .where(
      or(eq(correspondenceTable.authorId, meId), eq(correspondenceTable.correspondentId, meId))
    )
    .orderBy(desc(correspondenceTable.lastAt));

  if (rows.length === 0) return [];

  const otherIds = [...new Set(rows.map((r) => otherParty(r.c, meId)))];
  const others = await db
    .select({ id: userTable.id, nickname: userTable.nickname, flag: userTable.flag })
    .from(userTable)
    .where(inArray(userTable.id, otherIds));
  const byId = new Map(others.map((o) => [o.id, o]));

  const ids = rows.map((r) => r.c.id);
  const letters = await db
    .select()
    .from(letterTable)
    .where(inArray(letterTable.correspondenceId, ids));

  const now = Date.now();
  return rows.map((r) => {
    const mine = letters.filter((l) => l.correspondenceId === r.c.id);
    const other = byId.get(otherParty(r.c, meId));
    return {
      id: r.c.id,
      bottleId: r.c.bottleId,
      withNickname: other?.nickname ?? "A stranger",
      withFlag: other?.flag ?? "🐚",
      bottleText: r.bottleText,
      lastAt: r.c.lastAt.toISOString(),
      unread: mine.filter(
        (l) => l.fromUserId !== meId && l.deliverAt.getTime() <= now && !l.readAt
      ).length,
      awaitingArrival: mine.some(
        (l) => l.fromUserId === meId && l.deliverAt.getTime() > now
      ),
    };
  });
}

export async function getCorrespondence(
  id: string,
  me: User
): Promise<CorrespondenceDetail> {
  const [row] = await db
    .select({ c: correspondenceTable, bottleText: bottleTable.text })
    .from(correspondenceTable)
    .innerJoin(bottleTable, eq(correspondenceTable.bottleId, bottleTable.id))
    .where(eq(correspondenceTable.id, id))
    .limit(1);
  if (!row) throw new HttpError(404, "Not found");

  const { c } = row;
  if (c.authorId !== me.id && c.correspondentId !== me.id) {
    throw new HttpError(403, "Not yours to read");
  }

  const [other] = await db
    .select({ nickname: userTable.nickname, flag: userTable.flag })
    .from(userTable)
    .where(eq(userTable.id, otherParty(c, me.id)))
    .limit(1);

  const rows = await db
    .select()
    .from(letterTable)
    .where(eq(letterTable.correspondenceId, id))
    .orderBy(asc(letterTable.sentAt));

  const now = Date.now();

  // Reading a thread marks what has landed as read.
  const toMark = rows
    .filter((l) => l.fromUserId !== me.id && l.deliverAt.getTime() <= now && !l.readAt)
    .map((l) => l.id);
  if (toMark.length > 0) {
    await db
      .update(letterTable)
      .set({ readAt: new Date() })
      .where(inArray(letterTable.id, toMark));
  }

  const letters: SharedLetter[] = rows
    // A letter still at sea is invisible to its recipient. The sender sees
    // their own, marked as crossing.
    .filter((l) => l.fromUserId === me.id || l.deliverAt.getTime() <= now)
    .map((l) => ({
      id: l.id,
      fromMe: l.fromUserId === me.id,
      text: l.text,
      sentAt: l.sentAt.toISOString(),
      arrived: l.deliverAt.getTime() <= now,
    }));

  const fromMe = rows.filter((l) => l.fromUserId === me.id).length;
  const cost = letterCost(c, me, fromMe);

  return {
    id: c.id,
    bottleId: c.bottleId,
    withNickname: other?.nickname ?? "A stranger",
    withFlag: other?.flag ?? "🐚",
    bottleText: row.bottleText,
    lastAt: c.lastAt.toISOString(),
    unread: 0,
    awaitingArrival: rows.some(
      (l) => l.fromUserId === me.id && l.deliverAt.getTime() > now
    ),
    letters,
    channelOpen: c.channelOpen,
    writeCost: cost,
    canWrite: cost === 0 || me.credits >= cost,
  };
}

/** Unread letters across every thread — feeds the Inbox tab badge. */
export async function unreadLetterCount(meId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(letterTable)
    .innerJoin(correspondenceTable, eq(letterTable.correspondenceId, correspondenceTable.id))
    .where(
      and(
        ne(letterTable.fromUserId, meId),
        isNull(letterTable.readAt),
        lte(letterTable.deliverAt, new Date()),
        or(
          eq(correspondenceTable.authorId, meId),
          eq(correspondenceTable.correspondentId, meId)
        )
      )
    );
  return row?.n ?? 0;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

/** Answer a bottle. Opens the correspondence if this is the first letter. */
export async function answerBottle(
  bottleId: string,
  me: User,
  text: string
): Promise<WriteLetterResponse> {
  const [bottle] = await db
    .select()
    .from(bottleTable)
    .where(eq(bottleTable.id, bottleId))
    .limit(1);
  if (!bottle) throw new HttpError(404, "Not found");
  if (bottle.authorId === me.id) {
    throw new HttpError(400, "Answer someone else's bottle, not your own");
  }

  const [existing] = await db
    .select()
    .from(correspondenceTable)
    .where(
      and(
        eq(correspondenceTable.bottleId, bottleId),
        eq(correspondenceTable.correspondentId, me.id)
      )
    )
    .limit(1);

  let correspondence = existing;
  if (!correspondence) {
    const [created] = await db
      .insert(correspondenceTable)
      .values({
        id: randomUUID(),
        bottleId,
        authorId: bottle.authorId,
        correspondentId: me.id,
      })
      .returning();
    correspondence = created!;
  }

  return writeLetter(correspondence.id, me, text);
}

/** Add a letter to an existing correspondence, charging if the channel needs opening. */
export async function writeLetter(
  correspondenceId: string,
  me: User,
  text: string
): Promise<WriteLetterResponse> {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length > MAX_BOTTLE_LENGTH) {
    throw new HttpError(400, `Text must be 1-${MAX_BOTTLE_LENGTH} characters`);
  }

  const [c] = await db
    .select()
    .from(correspondenceTable)
    .where(eq(correspondenceTable.id, correspondenceId))
    .limit(1);
  if (!c) throw new HttpError(404, "Not found");
  if (c.authorId !== me.id && c.correspondentId !== me.id) {
    throw new HttpError(403, "Not yours to write to");
  }

  const [{ n: fromMe }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(letterTable)
    .where(
      and(eq(letterTable.correspondenceId, c.id), eq(letterTable.fromUserId, me.id))
    );

  const cost = letterCost(c, me, fromMe);
  if (cost > 0 && me.credits < cost) {
    throw new HttpError(402, `Keeping this channel open costs ${cost} credits`);
  }

  // How far the letter has to travel, from the two home shores.
  const recipientId = otherParty(c, me.id);
  const [recipient] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, recipientId))
    .limit(1);
  const [fromShore, toShore] = await Promise.all([
    shoreOf(me),
    recipient ? shoreOf(recipient) : Promise.resolve(null),
  ]);
  const minutes = crossingMinutes(fromShore, toShore);
  const deliverAt = new Date(Date.now() + minutes * 60_000);

  let credits = me.credits;
  await db.transaction(async (tx) => {
    await tx.insert(letterTable).values({
      id: randomUUID(),
      correspondenceId: c.id,
      fromUserId: me.id,
      text: trimmed,
      deliverAt,
    });
    if (cost > 0) {
      credits -= cost;
      await tx.update(userTable).set({ credits }).where(eq(userTable.id, me.id));
    }
    await tx
      .update(correspondenceTable)
      .set({
        lastAt: new Date(),
        // Paying is what opens the channel; it stays open from then on.
        channelOpen: c.channelOpen || cost > 0,
      })
      .where(eq(correspondenceTable.id, c.id));
  });

  return { credits, channelOpen: c.channelOpen || cost > 0, crossingMinutes: minutes };
}

// ---------------------------------------------------------------------------
// Delivery — run by the engine tick
// ---------------------------------------------------------------------------
export async function deliverDueLetters(): Promise<number> {
  const due = await db
    .select({ letter: letterTable, c: correspondenceTable })
    .from(letterTable)
    .innerJoin(correspondenceTable, eq(letterTable.correspondenceId, correspondenceTable.id))
    .where(and(isNull(letterTable.deliveredAt), lte(letterTable.deliverAt, new Date())))
    .limit(200);

  for (const { letter, c } of due) {
    const recipientId = letter.fromUserId === c.authorId ? c.correspondentId : c.authorId;
    await db
      .update(letterTable)
      .set({ deliveredAt: new Date() })
      .where(eq(letterTable.id, letter.id));
    await notify(recipientId, c.bottleId, "reply", "A letter reached your shore.");
  }
  return due.length;
}
