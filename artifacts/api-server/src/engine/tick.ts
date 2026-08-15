import { db, bottleTable } from "@workspace/db";
import { inArray, eq } from "drizzle-orm";
import { notify } from "./notify";
import { DIALS } from "./dials";
import { logger } from "../lib/logger";

// Advances every drifting/nearing bottle's progress a little, and applies
// tail-weighted drowning attrition. Never touches fresh bottles — drowning
// only reaches bottles that have already been passed on a few times or have
// sat for a long while, per the spec.
export async function runTick() {
  const active = await db
    .select()
    .from(bottleTable)
    .where(inArray(bottleTable.state, ["drifting", "nearing"]));

  for (const bottle of active) {
    const jitter = 0.6 + Math.random() * 0.8;
    const nextProgress = Math.min(1, bottle.progress + DIALS.PROGRESS_PER_TICK * jitter);
    const nextState = nextProgress >= DIALS.NEARING_THRESHOLD ? "nearing" : bottle.state;

    const age = Date.now() - bottle.createdAt.getTime();
    const tailEligible =
      bottle.passOnCount >= DIALS.DROWNING_MIN_PASS_ONS || age >= DIALS.DROWNING_MIN_AGE_MS;
    const drowned = tailEligible && Math.random() < DIALS.DROWNING_BASE_CHANCE;

    if (drowned) {
      await db
        .update(bottleTable)
        .set({ state: "lost" })
        .where(eq(bottleTable.id, bottle.id));
      await notify(bottle.authorId, bottle.id, "lost", "Lost at sea.");
      continue;
    }

    await db
      .update(bottleTable)
      .set({ progress: nextProgress, state: nextState })
      .where(eq(bottleTable.id, bottle.id));
  }
}
