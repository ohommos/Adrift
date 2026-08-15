import { Router } from "express";
import { db, notificationTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { serializeNotification } from "../lib/serialize";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationTable)
    .where(eq(notificationTable.userId, req.user!.id))
    .orderBy(desc(notificationTable.createdAt))
    .limit(50);
  res.json(notifications.map(serializeNotification));
});

notificationsRouter.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const [notification] = await db
    .select()
    .from(notificationTable)
    .where(eq(notificationTable.id, req.params.id))
    .limit(1);

  if (!notification || notification.userId !== req.user!.id) {
    return res.status(404).json({ error: "Not found" });
  }

  const [updated] = await db
    .update(notificationTable)
    .set({ read: true })
    .where(eq(notificationTable.id, notification.id))
    .returning();

  res.json(serializeNotification(updated));
});
