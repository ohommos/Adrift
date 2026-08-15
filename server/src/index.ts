import express from "express";
import cors from "cors";
import { identityRouter } from "./routes/identity";
import { bottlesRouter } from "./routes/bottles";
import { citiesRouter } from "./routes/cities";
import { notificationsRouter } from "./routes/notifications";
import { proRouter } from "./routes/pro";
import { startEngine } from "./engine";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(identityRouter);
app.use(bottlesRouter);
app.use(citiesRouter);
app.use(notificationsRouter);
app.use(proRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`[adrift] server listening on :${port}`);
  startEngine();
});
