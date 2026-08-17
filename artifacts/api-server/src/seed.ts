import { randomBytes, randomUUID } from "crypto";
import { db, shoreTable, userTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { SHORES, flagOf } from "./data/shores";
import { invalidateShoreCache } from "./lib/shores";
import { logger } from "./lib/logger";

// Cold-start data for the Drizzle/Postgres stack, plus the one-time backfill
// that carries a database seeded under the old city model onto shores.

// (nickname, ISO code) — personas spread across the planet so a lone tester
// always has somebody writing. They are deliberately few: proximity widens
// its own horizon when the sea near a shore is empty, so covering all 196
// shores with bots would be solving a problem that solves itself.
const BOTS: Array<[string, string]> = [
  ["lastbus", "JP"],
  ["kotori", "JP"],
  ["mothlight", "JP"],
  ["farlight", "IN"],
  ["tin_can", "IN"],
  ["driftwood", "BR"],
  ["riogrey", "BR"],
  ["coldwater", "IS"],
  ["lowsun", "IS"],
  ["azulejo", "PT"],
  ["gullwing", "PT"],
  ["eastriver", "US"],
  ["stoop_light", "US"],
  ["hanok_blue", "KR"],
  ["lagos_late", "NG"],
  ["monsoon", "ID"],
  ["thameside", "GB"],
  ["zocalo", "MX"],
  ["harbourhaze", "AU"],
  ["nileflow", "EG"],
  ["porteno", "AR"],
  ["tablemtn", "ZA"],
];

/**
 * Moves a database seeded under the old City model onto Shore. Every
 * statement is idempotent and only touches rows that have not been migrated,
 * so it is safe on every boot and on a database that never had cities.
 *
 * The City and Reply tables are deliberately left in place — dropping them is
 * a separate, deliberate step once every deployment has run this.
 */
async function backfillFromCities(): Promise<void> {
  // The City table may not exist at all on a fresh database.
  const [{ present }] = (await db.execute(
    sql`select to_regclass('public."City"') is not null as present`
  )).rows as Array<{ present: boolean }>;

  if (present) {
    // A user's shore is the country their old home city was in.
    await db.execute(sql`
      update "User" u
         set "homeShoreId" = s.id,
             "homeShoreChangedAt" = coalesce(u."homeCityChangedAt", now())
        from "City" c
        join "Shore" s on s.name = c.country
       where u."homeShoreId" is null
         and u."homeCityId" = c.id
    `);

    // A bottle addressed to a city is now addressed to that city's shore.
    await db.execute(sql`
      update "Bottle" b
         set "targetShoreId" = s.id
        from "City" c
        join "Shore" s on s.name = c.country
       where b."targetShoreId" is null
         and b."targetCityId" = c.id
    `);
  }

  // Anyone whose country was resolved from their IP but who never picked a
  // city still gets a shore, rather than being left placeless.
  await db.execute(sql`
    update "User" u
       set "homeShoreId" = s.id
      from "Shore" s
     where u."homeShoreId" is null
       and s.name = u."homeCountry"
  `);

  // Scope vocabulary: city -> shore, global -> ocean.
  await db.execute(sql`update "Bottle" set scope = 'shore' where scope = 'city'`);
  await db.execute(sql`update "Bottle" set scope = 'ocean' where scope = 'global'`);

  // A bottle addressed to a place that has no shore (a city in a country we
  // do not carry) has nowhere to land. Let it drift instead of stranding it.
  await db.execute(sql`
    update "Bottle"
       set scope = 'ocean', "targetShoreId" = null
     where scope = 'shore' and "targetShoreId" is null
  `);

  // Keep the denormalised country in step with the shore that now owns it.
  await db.execute(sql`
    update "User" u
       set "homeCountry" = s.name
      from "Shore" s
     where u."homeShoreId" = s.id
       and u."homeCountry" <> s.name
  `);
}

/**
 * Idempotent — safe to run on every boot and safe to run concurrently from
 * more than one instance, since the inserts defer to the unique constraints
 * on Shore.code and User.deviceId.
 */
export async function ensureSeeded(): Promise<void> {
  await db
    .insert(shoreTable)
    .values(
      SHORES.map((s) => ({
        id: randomUUID(),
        code: s.code,
        name: s.name,
        region: s.region,
        flag: flagOf(s.code),
        lat: s.lat,
        lon: s.lon,
      }))
    )
    .onConflictDoNothing({ target: shoreTable.code });

  invalidateShoreCache();

  await backfillFromCities();

  const shores = await db.select().from(shoreTable);
  const byCode = new Map(shores.map((s) => [s.code, s]));

  await db
    .insert(userTable)
    .values(
      BOTS.flatMap(([nickname, code]) => {
        const shore = byCode.get(code);
        if (!shore) return [];
        return [
          {
            id: randomUUID(),
            deviceId: `bot:${nickname}`,
            token: randomBytes(24).toString("hex"),
            nickname,
            flag: shore.flag,
            homeCountry: shore.name,
            homeShoreId: shore.id,
            homeShoreChangedAt: new Date(),
            isBot: true,
            // Bots address bottles at shores other than their own, and
            // createBottle gates that behind Pro.
            isPro: true,
          },
        ];
      })
    )
    .onConflictDoNothing({ target: userTable.deviceId });

  // Bots created before shores existed have no home; give them one.
  for (const [nickname, code] of BOTS) {
    const shore = byCode.get(code);
    if (!shore) continue;
    await db
      .update(userTable)
      .set({
        homeShoreId: shore.id,
        homeShoreChangedAt: new Date(),
        homeCountry: shore.name,
        flag: shore.flag,
        isPro: true,
      })
      .where(
        sql`${userTable.deviceId} = ${`bot:${nickname}`} and ${userTable.homeShoreId} is null`
      );
  }

  const [{ bots }] = await db
    .select({ bots: sql<number>`count(*)::int` })
    .from(userTable)
    .where(eq(userTable.isBot, true));
  const [{ placeless }] = await db
    .select({ placeless: sql<number>`count(*)::int` })
    .from(userTable)
    .where(sql`${userTable.homeShoreId} is null`);

  logger.info(
    { shores: shores.length, bots, placeless },
    "[seed] cold-start data ready"
  );
}
