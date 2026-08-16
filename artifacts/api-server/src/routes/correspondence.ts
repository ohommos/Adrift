import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { routeParam } from "../lib/params";
import { HttpError } from "../services/bottleActions";
import {
  answerBottle,
  getCorrespondence,
  listCorrespondences,
  unreadLetterCount,
  writeLetter,
} from "../services/correspondence";

export const correspondenceRouter = Router();

function handle(e: unknown, res: import("express").Response) {
  if (e instanceof HttpError) {
    res.status(e.status).json({ error: e.message });
    return;
  }
  throw e;
}

correspondenceRouter.get("/correspondences", requireAuth, async (req, res) => {
  res.json(await listCorrespondences(req.user!.id));
});

correspondenceRouter.get("/correspondences/unread", requireAuth, async (req, res) => {
  res.json({ unread: await unreadLetterCount(req.user!.id) });
});

correspondenceRouter.get("/correspondences/:id", requireAuth, async (req, res) => {
  try {
    res.json(await getCorrespondence(routeParam(req, "id"), req.user!));
  } catch (e) {
    handle(e, res);
  }
});

correspondenceRouter.post("/correspondences/:id/letters", requireAuth, async (req, res) => {
  try {
    const body = req.body as { text?: string };
    res.status(201).json(await writeLetter(routeParam(req, "id"), req.user!, body.text ?? ""));
  } catch (e) {
    handle(e, res);
  }
});

/** Answering a bottle — opens the correspondence if there isn't one yet. */
correspondenceRouter.post("/bottles/:id/answer", requireAuth, async (req, res) => {
  try {
    const body = req.body as { text?: string };
    res.status(201).json(await answerBottle(routeParam(req, "id"), req.user!, body.text ?? ""));
  } catch (e) {
    handle(e, res);
  }
});
