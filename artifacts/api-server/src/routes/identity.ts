import { randomBytes } from "crypto";
import { Router } from "express";
import type { IdentityCreateRequest, IdentityCreateResponse } from "@adrift/shared";
import { db, userTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import { serializeIdentity } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { randomUUID } from "crypto";

export const identityRouter = Router();

const FLAGS = ["🌊", "🐚", "⚓", "🗺️", "🔭", "🪝", "🌙", "⛵"];

function randomFlag() {
  return FLAGS[Math.floor(Math.random() * FLAGS.length)];
}

async function detectCountry(ip: string): Promise<string> {
  try {
    // Strip IPv6-mapped IPv4 prefix
    const cleanIp = ip.replace(/^::ffff:/, "");
    if (!cleanIp || cleanIp === "::1" || cleanIp.startsWith("127.") || cleanIp.startsWith("10.") || cleanIp.startsWith("172.") || cleanIp.startsWith("192.168.")) {
      return "Unknown";
    }
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=country,status`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json() as { status: string; country?: string };
    return data.status === "success" && data.country ? data.country : "Unknown";
  } catch {
    return "Unknown";
  }
}

identityRouter.post("/identity", async (req, res) => {
  const body = req.body as Partial<IdentityCreateRequest>;
  const { deviceId, nickname } = body;

  if (!deviceId || !nickname) {
    return res.status(400).json({ error: "deviceId and nickname are required" });
  }
  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 24) {
    return res.status(400).json({ error: "nickname must be 2–24 characters" });
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
      identity: serializeIdentity(existing),
    };
    return res.json(response);
  }

  // Reject if nickname is already taken (case-insensitive)
  const [takenBy] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(ilike(userTable.nickname, trimmed))
    .limit(1);
  if (takenBy) {
    return res.status(409).json({ error: "That name is already taken — try another" });
  }

  // Detect country from the request IP
  const rawIp =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.ip ??
    "";
  const homeCountry = await detectCountry(rawIp);

  const [user] = await db
    .insert(userTable)
    .values({
      id: randomUUID(),
      deviceId,
      token: randomBytes(24).toString("hex"),
      nickname: trimmed,
      flag: randomFlag(),
      homeCountry,
    })
    .returning();

  const response: IdentityCreateResponse = {
    token: user.token,
    identity: serializeIdentity(user),
  };
  res.status(201).json(response);
});

identityRouter.get("/identity/me", requireAuth, async (req, res) => {
  res.json(serializeIdentity(req.user!));
});
