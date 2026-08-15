import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { serializeNotification } from "../lib/serialize";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications.map(serializeNotification));
});

notificationsRouter.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user!.id) {
    return res.status(404).json({ error: "Not found" });
  }
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true },
  });
  res.json(serializeNotification(updated));
});
