import { DIALS } from "./dials";
import { runTick } from "./tick";
import { deliverDueLetters } from "../services/correspondence";
import { runBotTick } from "./bots";
import { logger } from "../lib/logger";

export function startEngine() {
  // A second instance running the same engine would double every bottle's
  // drift and act as every bot twice. Also the switch that lets a test drive
  // the world a tick at a time instead of racing it.
  if (process.env["ENGINE_ENABLED"] === "false") {
    logger.info("[engine] disabled by ENGINE_ENABLED=false");
    return () => {};
  }

  const driftTimer = setInterval(() => {
    runTick().catch((e) => logger.error({ err: e }, "[engine] drift tick failed"));
    // Letters land on the same beat as the drift.
    deliverDueLetters().catch((e) =>
      logger.error({ err: e }, "[engine] letter delivery failed")
    );
  }, DIALS.TICK_INTERVAL_MS);

  const botTimer = setInterval(() => {
    runBotTick().catch((e) => logger.error({ err: e }, "[engine] bot tick failed"));
  }, DIALS.BOT_ACTION_INTERVAL_MS);

  logger.info(
    { tickMs: DIALS.TICK_INTERVAL_MS, botMs: DIALS.BOT_ACTION_INTERVAL_MS },
    "[engine] started"
  );

  return () => {
    clearInterval(driftTimer);
    clearInterval(botTimer);
  };
}
