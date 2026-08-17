import { Router } from "express";
import type { ShoreLetter } from "@adrift/shared";
import { db, bottleTable, userTable } from "@workspace/db";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { serializeShore } from "../lib/serialize";
import { allShores, getShore } from "../lib/shores";
import { clientIp, detectCountryCode } from "../lib/geoip";
import { routeParam } from "../lib/params";
import { rateLimit } from "../middleware/rateLimit";

export const shoresRouter = Router();

const ACTIVE_STATES = ["drifting", "nearing", "opened"] as const;

shoresRouter.get("/shores", async (_req, res) => {
  const shores = await allShores();

  const counts = await db
    .select({
      targetShoreId: bottleTable.targetShoreId,
      count: sql<number>`count(*)::int`,
    })
    .from(bottleTable)
    .where(
      and(
        inArray(bottleTable.state, [...ACTIVE_STATES]),
        isNotNull(bottleTable.targetShoreId)
      )
    )
    .groupBy(bottleTable.targetShoreId);

  const byShore = new Map(counts.map((c) => [c.targetShoreId as string, c.count]));
  res.json(shores.map((s) => serializeShore(s, byShore.get(s.id) ?? 0)));
});

/**
 * A guess at which shore the caller is on, for the onboarding picker to
 * pre-select. Only ever a suggestion: the user's choice is what is stored,
 * and a wrong guess costs one scroll. Declared before /shores/:id so the
 * parameter route does not swallow it.
 */
shoresRouter.get(
  "/shores/suggest",
  rateLimit({ windowMs: 60_000, max: 60 }),
  async (req, res) => {
    const ip = clientIp(req.headers as Record<string, unknown>, req.ip);
    const code = await detectCountryCode(ip);
    if (!code) {
      res.json({ shore: null });
      return;
    }
    const shores = await allShores();
    const match = shores.find((s) => s.code === code);
    res.json({ shore: match ? serializeShore(match) : null });
  }
);

shoresRouter.get("/shores/:id", async (req, res) => {
  const shore = await getShore(routeParam(req, "id"));
  if (!shore) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const SHORE_LETTERS = 3;

  const selectLetter = {
    nickname: userTable.nickname,
    passOnCount: bottleTable.passOnCount,
    text: bottleTable.text,
    id: bottleTable.id,
  };

  // Letters actually addressed here come first.
  const targeted = await db
    .select(selectLetter)
    .from(bottleTable)
    .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
    .where(
      and(
        inArray(bottleTable.state, [...ACTIVE_STATES]),
        eq(bottleTable.scope, "shore"),
        eq(bottleTable.targetShoreId, shore.id)
      )
    )
    .orderBy(desc(bottleTable.createdAt))
    .limit(SHORE_LETTERS);

  // Top up from the open ocean. Selecting the same newest few for every shore
  // made them all identical; offsetting by a value derived from the shore
  // gives each one a different sample of the same drifting population.
  let letters = [...targeted];
  if (letters.length < SHORE_LETTERS) {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bottleTable)
      .where(
        and(inArray(bottleTable.state, [...ACTIVE_STATES]), eq(bottleTable.scope, "ocean"))
      );

    const want = SHORE_LETTERS - letters.length;
    if (total > 0) {
      const offset =
        [...shore.id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100000, 7) %
        Math.max(1, total);
      const globals = await db
        .select(selectLetter)
        .from(bottleTable)
        .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
        .where(
          and(
            inArray(bottleTable.state, [...ACTIVE_STATES]),
            eq(bottleTable.scope, "ocean")
          )
        )
        .orderBy(desc(bottleTable.createdAt))
        .limit(want)
        .offset(Math.min(offset, Math.max(0, total - want)));
      const seen = new Set(letters.map((l) => l.id));
      letters = letters.concat(globals.filter((g) => !seen.has(g.id)));
    }
  }

  // Distinct bottles can carry identical text (bot personas draw from a fixed
  // pool), which reads as a rendering bug on a shore. Show each line once.
  const seenText = new Set<string>();
  const payload: ShoreLetter[] = letters
    .filter((b) => {
      if (seenText.has(b.text)) return false;
      seenText.add(b.text);
      return true;
    })
    .slice(0, SHORE_LETTERS)
    .map((b) => ({
      nickname: b.nickname,
      passOnCount: b.passOnCount,
      text: b.text,
    }));

  res.json({ shore: serializeShore(shore), letters: payload });
});
