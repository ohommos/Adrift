import { Request, Response, Router } from "express";
import type {
  BottleScope,
  CreateBottleRequest,
  ReaderActionKind,
  ReaderActionResponse,
  ReplyRequest,
} from "@adrift/shared";
import { db, bottleTable, bottleInteractionTable, cityTable, replyTable } from "@workspace/db";
import { eq, and, or, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { serializeBottleDetail, serializeBottleSummary } from "../lib/serialize";
import {
  HttpError,
  createBottle,
  listInbox,
  openBottle,
  replyToBottle,
  resolveFate,
} from "../services/bottleActions";

export const bottlesRouter = Router();

function handleError(e: unknown, res: Response) {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
  throw e;
}

bottlesRouter.post("/bottles", requireAuth, async (req, res) => {
  try {
    const body = req.body as Partial<CreateBottleRequest>;
    const bottle = await createBottle(req.user!.id, {
      text: body.text ?? "",
      scope: body.scope as BottleScope,
      targetCityId: body.targetCityId,
    });
    res.status(201).json(await serializeBottleSummary(bottle));
  } catch (e) {
    handleError(e, res);
  }
});

bottlesRouter.get("/bottles/mine", requireAuth, async (req, res) => {
  const bottles = await db
    .select()
    .from(bottleTable)
    .where(eq(bottleTable.authorId, req.user!.id))
    .orderBy(desc(bottleTable.createdAt));
  res.json(await Promise.all(bottles.map(serializeBottleSummary)));
});

bottlesRouter.get("/inbox", requireAuth, async (req, res) => {
  res.json(await listInbox(req.user!.id));
});

bottlesRouter.get("/bottles/:id", requireAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(bottleTable)
    .where(eq(bottleTable.id, req.params.id))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Not found" });

  const isAuthor = row.authorId === req.user!.id;
  if (!isAuthor) {
    const [interaction] = await db
      .select()
      .from(bottleInteractionTable)
      .where(
        and(
          eq(bottleInteractionTable.bottleId, row.id),
          eq(bottleInteractionTable.readerId, req.user!.id)
        )
      )
      .limit(1);
    if (!interaction) return res.status(403).json({ error: "Not visible to you" });
  }

  let targetCity = null;
  if (row.targetCityId) {
    const [city] = await db
      .select()
      .from(cityTable)
      .where(eq(cityTable.id, row.targetCityId))
      .limit(1);
    targetCity = city ?? null;
  }

  res.json(await serializeBottleDetail(row, targetCity));
});

bottlesRouter.post("/bottles/:id/open", requireAuth, async (req, res) => {
  try {
    res.json(await openBottle(req.params.id, req.user!.id));
  } catch (e) {
    handleError(e, res);
  }
});

async function handleFate(kind: ReaderActionKind, req: Request, res: Response) {
  try {
    const credits = await resolveFate(req.params.id, req.user!.id, kind);
    res.json({ kind, credits } satisfies ReaderActionResponse);
  } catch (e) {
    handleError(e, res);
  }
}

bottlesRouter.post("/bottles/:id/break", requireAuth, (req, res) =>
  handleFate("break", req, res)
);
bottlesRouter.post("/bottles/:id/pass", requireAuth, (req, res) =>
  handleFate("pass", req, res)
);

bottlesRouter.post("/bottles/:id/reply", requireAuth, async (req, res) => {
  try {
    const body = req.body as Partial<ReplyRequest>;
    const result = await replyToBottle(req.params.id, req.user!.id, body.text ?? "");
    res.status(201).json(result);
  } catch (e) {
    handleError(e, res);
  }
});

bottlesRouter.get("/bottles/:id/replies", requireAuth, async (req, res) => {
  const user = req.user!;
  const replies = await db
    .select()
    .from(replyTable)
    .where(
      and(
        eq(replyTable.bottleId, req.params.id),
        or(eq(replyTable.fromUserId, user.id), eq(replyTable.toUserId, user.id))
      )
    )
    .orderBy(desc(replyTable.createdAt));
  res.json(
    replies.map((r) => ({
      id: r.id,
      bottleId: r.bottleId,
      fromMe: r.fromUserId === user.id,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});
