import { randomBytes } from "crypto";
import { Router } from "express";
import type { IdentityCreateRequest, IdentityCreateResponse } from "@adrift/shared";
import { prisma } from "../lib/prisma";
import { serializeIdentity } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";

export const identityRouter = Router();

identityRouter.post("/identity", async (req, res) => {
  const body = req.body as Partial<IdentityCreateRequest>;
  const { deviceId, nickname, flag, homeCityId } = body;

  if (!deviceId || !nickname || !flag || !homeCityId) {
    return res.status(400).json({ error: "deviceId, nickname, flag, and homeCityId are required" });
  }

  const homeCity = await prisma.city.findUnique({ where: { id: homeCityId } });
  if (!homeCity) {
    return res.status(400).json({ error: "Unknown homeCityId" });
  }

  const existing = await prisma.user.findUnique({
    where: { deviceId },
    include: { homeCity: true },
  });
  if (existing) {
    const response: IdentityCreateResponse = {
      token: existing.token,
      identity: await serializeIdentity(existing),
    };
    return res.json(response);
  }

  const user = await prisma.user.create({
    data: {
      deviceId,
      token: randomBytes(24).toString("hex"),
      nickname: nickname.slice(0, 24),
      flag,
      homeCityId,
    },
    include: { homeCity: true },
  });

  const response: IdentityCreateResponse = {
    token: user.token,
    identity: await serializeIdentity(user),
  };
  res.status(201).json(response);
});

identityRouter.get("/identity/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    include: { homeCity: true },
  });
  res.json(await serializeIdentity(user));
});
