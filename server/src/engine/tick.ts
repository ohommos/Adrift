import { prisma } from "../lib/prisma";
import { notify } from "./notify";
import { DIALS } from "./dials";

// Advances every drifting/nearing bottle's progress a little, and applies
// tail-weighted drowning attrition. Never touches fresh bottles — drowning
// only reaches bottles that have already been passed on a few times or have
// sat for a long while, per the spec.
export async function runTick() {
  const active = await prisma.bottle.findMany({
    where: { state: { in: ["drifting", "nearing"] } },
  });

  for (const bottle of active) {
    const jitter = 0.6 + Math.random() * 0.8;
    const nextProgress = Math.min(1, bottle.progress + DIALS.PROGRESS_PER_TICK * jitter);
    const nextState = nextProgress >= DIALS.NEARING_THRESHOLD ? "nearing" : bottle.state;

    const age = Date.now() - bottle.createdAt.getTime();
    const tailEligible =
      bottle.passOnCount >= DIALS.DROWNING_MIN_PASS_ONS || age >= DIALS.DROWNING_MIN_AGE_MS;
    const drowned = tailEligible && Math.random() < DIALS.DROWNING_BASE_CHANCE;

    if (drowned) {
      await prisma.bottle.update({ where: { id: bottle.id }, data: { state: "lost" } });
      await notify(bottle.authorId, bottle.id, "lost", "Lost at sea.");
      continue;
    }

    await prisma.bottle.update({
      where: { id: bottle.id },
      data: { progress: nextProgress, state: nextState },
    });
  }
}
