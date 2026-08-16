import app from "./app";
import { logger } from "./lib/logger";
import { startEngine } from "./engine";
import { ensureSeeded } from "./seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed before the engine starts so the first bot tick has cities and
  // personas to work with. A seed failure must not take the server down —
  // the API is still serviceable without cold-start data.
  ensureSeeded()
    .catch((err) => logger.error({ err }, "[seed] failed"))
    .finally(() => startEngine());
});
