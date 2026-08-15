import type { NotificationKind } from "@adrift/shared";
import { db, userTable, notificationTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function notify(
  userId: string,
  bottleId: string | null,
  kind: NotificationKind,
  message: string
) {
  // Bots don't need a notification feed of their own.
  const [user] = await db
    .select({ isBot: userTable.isBot })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  if (user?.isBot) return;

  await db.insert(notificationTable).values({
    id: randomUUID(),
    userId,
    bottleId,
    kind,
    message,
  });
}
