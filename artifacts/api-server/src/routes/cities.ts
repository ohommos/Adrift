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

  const bottles = await db
    .select({
      nickname: userTable.nickname,
      passOnCount: bottleTable.passOnCount,
      text: bottleTable.text,
    })
    .from(bottleTable)
    .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
    .where(
      and(
        inArray(bottleTable.state, [...ACTIVE_STATES]),
        or(
          and(eq(bottleTable.scope, "city"), eq(bottleTable.targetCityId, city.id)),
          eq(bottleTable.scope, "global")
        )
      )
    )
    .orderBy(desc(bottleTable.createdAt))
    .limit(3);

  const letters: CityShoreLetter[] = bottles.map((b) => ({
    nickname: b.nickname,
    passOnCount: b.passOnCount,
    text: b.text,
  }));

  res.json({ city: serializeCity(city), letters });
});
