import { DIALS } from "./dials";
import { runTick } from "./tick";
import { runBotTick } from "./bots";

export function startEngine() {
  const driftTimer = setInterval(() => {
    runTick().catch((e) => console.error("[engine] drift tick failed", e));
  }, DIALS.TICK_INTERVAL_MS);

  const botTimer = setInterval(() => {
    runBotTick().catch((e) => console.error("[engine] bot tick failed", e));
  }, DIALS.BOT_ACTION_INTERVAL_MS);

  console.log(
    `[engine] started: drift tick every ${DIALS.TICK_INTERVAL_MS}ms, bot tick every ${DIALS.BOT_ACTION_INTERVAL_MS}ms`
  );

  return () => {
    clearInterval(driftTimer);
    clearInterval(botTimer);
  };
}
