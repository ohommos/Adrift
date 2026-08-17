import { db, bottleTable, userTable } from "@workspace/db";
import { inArray, eq } from "drizzle-orm";
import { notify } from "./notify";
import { DIALS } from "./dials";
import { advance, driftHeading, greatCircleKm } from "../lib/geo";
import { allShores } from "../lib/shores";
import { logger } from "../lib/logger";

/**
 * Moves every drifting bottle along its heading, recomputes how close it is
 * to land, and applies tail-weighted drowning attrition.
 *
 * "Progress" is not a timer — it is how near the bottle is to somebody's
 * shore. A bottle that has just been cast is far from anywhere and reads as
 * drifting; one that has crossed most of an ocean reads as nearing. That is
 * the same number the reach test in listInbox uses, so what the sender is
 * watching and what a reader can actually find are the same fact.
 *
 * Drowning never reaches fresh bottles: only ones already passed on a few
 * times, or that have sat for a long while, per the spec.
 */
export async function runTick() {
  const active = await db
    .select({ bottle: bottleTable, authorShoreId: userTable.homeShoreId })
    .from(bottleTable)
    .innerJoin(userTable, eq(bottleTable.authorId, userTable.id))
    .where(inArray(bottleTable.state, ["drifting", "nearing"]));
  if (active.length === 0) return;

  const shores = await allShores();

  for (const { bottle, authorShoreId } of active) {
    const age = Date.now() - bottle.createdAt.getTime();
    const tailEligible =
      bottle.passOnCount >= DIALS.DROWNING_MIN_PASS_ONS || age >= DIALS.DROWNING_MIN_AGE_MS;
    if (tailEligible && Math.random() < DIALS.DROWNING_BASE_CHANCE) {
      await db
        .update(bottleTable)
        .set({ state: "lost" })
        .where(eq(bottleTable.id, bottle.id));
      await notify(bottle.authorId, bottle.id, "lost", "Lost at sea.");
      continue;
    }

    // A bottle addressed to a shore is already where it was sent; it bobs
    // about rather than travelling. Only open-ocean bottles cross.
    const jitter = 0.7 + Math.random() * 0.6;
    const next =
      bottle.scope === "ocean"
        ? advance(
            bottle.currentLat,
            bottle.currentLon,
            driftHeading(bottle.id),
            DIALS.DRIFT_KM_PER_TICK * jitter
          )
        : { lat: bottle.currentLat, lon: bottle.currentLon };

    // Distance to the nearest shore that is not the one it was cast from —
    // otherwise every bottle would read as "nearing" the moment it was thrown.
    let nearestKm = Infinity;
    for (const s of shores) {
      if (s.id === authorShoreId) continue;
      const km = greatCircleKm(next.lat, next.lon, s.lat, s.lon);
      if (km < nearestKm) nearestKm = km;
    }

    const progress =
      nearestKm === Infinity
        ? bottle.progress
        : Math.max(0, Math.min(1, 1 - nearestKm / DIALS.REACH_KM));
    const state = progress >= DIALS.NEARING_THRESHOLD ? "nearing" : "drifting";

    await db
      .update(bottleTable)
      .set({
        currentLat: next.lat,
        currentLon: next.lon,
        progress,
        state,
      })
      .where(eq(bottleTable.id, bottle.id));
  }

  logger.debug({ bottles: active.length }, "[tick] drift advanced");
}
