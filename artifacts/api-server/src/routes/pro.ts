import { Router } from "express";
import type { ProUnlockResponse } from "@adrift/shared";
import { db, userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const proRouter = Router();

// Stub: flips the Pro flag with no real payment processor behind it yet.
// A real integration (Stripe, App Store IAP, etc.) is deferred.
proRouter.post("/pro/unlock", requireAuth, async (req, res) => {
  await db
    .update(userTable)
    .set({ isPro: true })
    .where(eq(userTable.id, req.user!.id));
  res.json({ isPro: true } satisfies ProUnlockResponse);
});
