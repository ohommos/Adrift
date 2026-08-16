import { Router } from "express";
import type { CityShoreLetter } from "@adrift/shared";
import { db, cityTable, bottleTable, userTable } from "@workspace/db";
import { eq, and, or, inArray, isNotNull, desc, sql } from "drizzle-orm";
import { serializeCity } from "../lib/serialize";
import { routeParam } from "../lib/params";

export const citiesRouter = Router();

const ACTIVE_STATES = ["drifting", "nearing", "opened"] as const;

citiesRouter.get("/cities", async (_req, res) => {
  const cities = await db.select().from(cityTable).orderBy(cityTable.name);

  const counts = await db
    .select({
      targetCityId: bottleTable.targetCityId,
      count: sql<number>`count(*)::int`,
    })
    .from(bottleTable)
    .where(
      and(
        inArray(bottleTable.state, [...ACTIVE_STATES]),
        isNotNull(bottleTable.targetCityId)
      )
    )
    .groupBy(bottleTable.targetCityId);

  const countByCity = new Map(
    counts.map((c) => [c.targetCityId as string, c.count])
  );

  res.json(cities.map((c) => serializeCity(c, countByCity.get(c.id) ?? 0)));
});

citiesRouter.get("/cities/:id/shore", async (req, res) => {
  const [city] = await db
    .select()
    .from(cityTable)
    .where(eq(cityTable.id, routeParam(req, "id")))
    .limit(1);
  if (!city) {
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

  // Letters actually addressed to this port come first.
  const targeted = await db
    .select(selectLetter)
    .from(bottleTable)
    .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
    .where(
      and(
        inArray(bottleTable.state, [...ACTIVE_STATES]),
        eq(bottleTable.scope, "city"),
        eq(bottleTable.targetCityId, city.id)
      )
    )
    .orderBy(desc(bottleTable.createdAt))
    .limit(SHORE_LETTERS);

  // Top up from the open ocean. Selecting the same newest few for every port
  // made every shore identical; offsetting by a value derived from the city
  // gives each one a different sample of the same drifting population.
  let letters = [...targeted];
  if (letters.length < SHORE_LETTERS) {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bottleTable)
      .where(
        and(inArray(bottleTable.state, [...ACTIVE_STATES]), eq(bottleTable.scope, "global"))
      );

    const want = SHORE_LETTERS - letters.length;
    if (total > 0) {
      const cityOffset =
        [...city.id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100000, 7) %
        Math.max(1, total);
      const globals = await db
        .select(selectLetter)
        .from(bottleTable)
        .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
        .where(
          and(
            inArray(bottleTable.state, [...ACTIVE_STATES]),
            eq(bottleTable.scope, "global")
          )
        )
        .orderBy(desc(bottleTable.createdAt))
        .limit(want)
        .offset(Math.min(cityOffset, Math.max(0, total - want)));
      const seen = new Set(letters.map((l) => l.id));
      letters = letters.concat(globals.filter((g) => !seen.has(g.id)));
    }
  }

  // Distinct bottles can carry identical text (bot personas draw from a fixed
  // pool), which reads as a rendering bug on a shore. Show each line once.
  const seenText = new Set<string>();
  const payload: CityShoreLetter[] = letters
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

  res.json({ city: serializeCity(city), letters: payload });
});
