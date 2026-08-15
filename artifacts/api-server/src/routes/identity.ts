import { randomBytes } from "crypto";
import { Router } from "express";
import type { IdentityCreateRequest, IdentityCreateResponse } from "@adrift/shared";
import { db, userTable, cityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { serializeIdentity } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { randomUUID } from "crypto";

export const identityRouter = Router();

identityRouter.post("/identity", async (req, res) => {
  const body = req.body as Partial<IdentityCreateRequest>;
  const { deviceId, nickname, flag, homeCityId } = body;

  if (!deviceId || !nickname || !flag || !homeCityId) {
    return res
      .status(400)
      .json({ error: "deviceId, nickname, flag, and homeCityId are required" });
  }

  const [homeCity] = await db
    .select()
    .from(cityTable)
    .where(eq(cityTable.id, homeCityId))
    .limit(1);
  if (!homeCity) {
    return res.status(400).json({ error: "Unknown homeCityId" });
  }

  // Return existing identity for this device
  const [existing] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.deviceId, deviceId))
    .limit(1);

  if (existing) {
    const response: IdentityCreateResponse = {
      token: existing.token,
      identity: await serializeIdentity(existing, homeCity),
    };
    return res.json(response);
  }

  const [user] = await db
    .insert(userTable)
    .values({
      id: randomUUID(),
      deviceId,
      token: randomBytes(24).toString("hex"),
      nickname: nickname.slice(0, 24),
      flag,
      homeCityId,
    })
    .returning();

  const response: IdentityCreateResponse = {
    token: user.token,
    identity: await serializeIdentity(user, homeCity),
  };
  res.status(201).json(response);
});

identityRouter.get("/identity/me", requireAuth, async (req, res) => {
  const user = req.user!;
  const [homeCity] = await db
    .select()
    .from(cityTable)
    .where(eq(cityTable.id, user.homeCityId))
    .limit(1);
  if (!homeCity) return res.status(500).json({ error: "Home city not found" });
  res.json(await serializeIdentity(user, homeCity));
});
