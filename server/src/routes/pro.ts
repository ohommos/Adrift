import { Router } from "express";
import type { ProUnlockResponse } from "@adrift/shared";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const proRouter = Router();

// Stub: flips the Pro flag with no real payment processor behind it yet.
// A real integration (Stripe, App Store IAP, etc.) is deferred.
proRouter.post("/pro/unlock", requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { isPro: true } });
  res.json({ isPro: true } satisfies ProUnlockResponse);
});
