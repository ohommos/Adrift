import { randomBytes, randomUUID } from "crypto";
import { db, cityTable, userTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./lib/logger";

// Cold-start data for the Drizzle/Postgres stack. The original Prisma seed
// (server/prisma/seed.ts) never made the migration, which left a fresh
// deployment with no cities and no bot personas — an empty Chart, an empty
// Haul, and no drift activity for the first real user to find.

const CITIES = [
  { name: "Tokyo", country: "Japan", flag: "🇯🇵", lat: 35.7, lon: 139.7 },
  { name: "Mumbai", country: "India", flag: "🇮🇳", lat: 19.1, lon: 72.9 },
  { name: "São Paulo", country: "Brazil", flag: "🇧🇷", lat: -23.5, lon: -46.6 },
  { name: "New York", country: "United States", flag: "🇺🇸", lat: 40.7, lon: -74.0 },
  { name: "Seoul", country: "South Korea", flag: "🇰🇷", lat: 37.6, lon: 127.0 },
  { name: "Lagos", country: "Nigeria", flag: "🇳🇬", lat: 6.5, lon: 3.4 },
  { name: "Jakarta", country: "Indonesia", flag: "🇮🇩", lat: -6.2, lon: 106.8 },
  { name: "London", country: "United Kingdom", flag: "🇬🇧", lat: 51.5, lon: -0.1 },
  { name: "Mexico City", country: "Mexico", flag: "🇲🇽", lat: 19.4, lon: -99.1 },
  { name: "Sydney", country: "Australia", flag: "🇦🇺", lat: -33.9, lon: 151.2 },
  { name: "Cairo", country: "Egypt", flag: "🇪🇬", lat: 30.0, lon: 31.2 },
  { name: "Buenos Aires", country: "Argentina", flag: "🇦🇷", lat: -34.6, lon: -58.4 },
  { name: "Cape Town", country: "South Africa", flag: "🇿🇦", lat: -33.9, lon: 18.4 },
  { name: "Porto", country: "Portugal", flag: "🇵🇹", lat: 41.1, lon: -8.6 },
  { name: "Reykjavík", country: "Iceland", flag: "🇮🇸", lat: 64.1, lon: -21.9 },
] as const;

// (nickname, home city) — spread across cities so every shore has residents
// reading and writing bottles.
const BOTS: Array<[string, string]> = [
  ["lastbus", "Tokyo"],
  ["kotori", "Tokyo"],
  ["mothlight", "Tokyo"],
  ["farlight", "Mumbai"],
  ["tin_can", "Mumbai"],
  ["driftwood", "São Paulo"],
  ["riogrey", "São Paulo"],
  ["coldwater", "Reykjavík"],
  ["lowsun", "Reykjavík"],
  ["azulejo", "Porto"],
  ["gullwing", "Porto"],
  ["eastriver", "New York"],
  ["stoop_light", "New York"],
  ["hanok_blue", "Seoul"],
  ["lagos_late", "Lagos"],
  ["monsoon", "Jakarta"],
  ["thameside", "London"],
  ["zocalo", "Mexico City"],
  ["harbourhaze", "Sydney"],
  ["nileflow", "Cairo"],
  ["porteno", "Buenos Aires"],
  ["tablemtn", "Cape Town"],
];

/**
 * Idempotent — safe to run on every boot and safe to run concurrently from
 * more than one instance, since both inserts defer to the unique constraints
 * on City.name and User.deviceId.
 */
export async function ensureSeeded(): Promise<void> {
  await db
    .insert(cityTable)
    .values(
      CITIES.map((c) => ({
        id: randomUUID(),
        name: c.name,
        country: c.country,
        flag: c.flag,
        lat: c.lat,
        lon: c.lon,
        isSeedHome: true,
      }))
    )
    .onConflictDoNothing({ target: cityTable.name });

  const cityByName = new Map<string, (typeof CITIES)[number]>(
    CITIES.map((c) => [c.name, c])
  );

  await db
    .insert(userTable)
    .values(
      BOTS.flatMap(([nickname, cityName]) => {
        const city = cityByName.get(cityName);
        if (!city) return [];
        return [
          {
            id: randomUUID(),
            deviceId: `bot:${nickname}`,
            token: randomBytes(24).toString("hex"),
            nickname,
            flag: city.flag,
            homeCountry: city.country,
            isBot: true,
            // Bots cast city-scoped bottles as well as global ones, and
            // createBottle gates city scope behind Pro.
            isPro: true,
          },
        ];
      })
    )
    .onConflictDoNothing({ target: userTable.deviceId });

  const [{ cities }] = await db
    .select({ cities: sql<number>`count(*)::int` })
    .from(cityTable);
  const [{ bots }] = await db
    .select({ bots: sql<number>`count(*)::int` })
    .from(userTable)
    .where(eq(userTable.isBot, true));

  logger.info({ cities, bots }, "[seed] cold-start data ready");
}
