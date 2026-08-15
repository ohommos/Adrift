import { Router } from "express";
import type { CityShoreLetter } from "@adrift/shared";
import { prisma } from "../lib/prisma";
import { serializeCity } from "../lib/serialize";

export const citiesRouter = Router();

const ACTIVE_STATES = ["drifting", "nearing", "opened"] as const;

citiesRouter.get("/cities", async (_req, res) => {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
  const counts = await prisma.bottle.groupBy({
    by: ["targetCityId"],
    where: { state: { in: [...ACTIVE_STATES] }, targetCityId: { not: null } },
    _count: { _all: true },
  });
  const countByCity = new Map(counts.map((c) => [c.targetCityId as string, c._count._all]));

  res.json(cities.map((c) => serializeCity(c, countByCity.get(c.id) ?? 0)));
});

citiesRouter.get("/cities/:id/shore", async (req, res) => {
  const city = await prisma.city.findUnique({ where: { id: req.params.id } });
  if (!city) return res.status(404).json({ error: "Not found" });

  const bottles = await prisma.bottle.findMany({
    where: {
      state: { in: [...ACTIVE_STATES] },
      OR: [
        { scope: "city", targetCityId: city.id },
        { scope: "global", author: { homeCityId: city.id } },
      ],
    },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const letters: CityShoreLetter[] = bottles.map((b) => ({
    nickname: b.author.nickname,
    passOnCount: b.passOnCount,
    text: b.text,
  }));

  res.json({ city: serializeCity(city), letters });
});
