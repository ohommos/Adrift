import type { NotificationKind } from "@adrift/shared";
import { prisma } from "../lib/prisma";

export async function notify(
  userId: string,
  bottleId: string | null,
  kind: NotificationKind,
  message: string
) {
  // Bots don't need a notification feed of their own.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isBot: true } });
  if (user?.isBot) return;

  await prisma.notification.create({
    data: { userId, bottleId, kind, message },
  });
}
