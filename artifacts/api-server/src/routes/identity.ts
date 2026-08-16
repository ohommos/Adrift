import { randomBytes, randomUUID } from "crypto";
import { Router } from "express";
import type { IdentityCreateRequest, IdentityCreateResponse } from "@adrift/shared";
import { db, userTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { serializeIdentity } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";
import { clientIp, detectCountry, UNKNOWN_COUNTRY } from "../lib/geoip";
import { rateLimit } from "../middleware/rateLimit";

export const identityRouter = Router();

const FLAGS = ["🌊", "🐚", "⚓", "🗺️", "🔭", "🪝", "🌙", "⛵"];

function randomFlag() {
  return FLAGS[Math.floor(Math.random() * FLAGS.length)];
}

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 24;

function validateNickname(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "nickname is required" };
  const trimmed = raw.trim();
  if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
    return { ok: false, error: `nickname must be ${NICKNAME_MIN}–${NICKNAME_MAX} characters` };
  }
  return { ok: true, value: trimmed };
}

/**
 * Case-insensitive exact match. Deliberately not `ilike`: the value is a
 * pattern there, so `%` matches every existing name and `_` matches any
 * single character — the screen's own placeholder suggests a nickname with
 * an underscore in it.
 */
async function findByNickname(nickname: string) {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(sql`lower(${userTable.nickname}) = lower(${nickname})`)
    .limit(1);
  return row ?? null;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

/**
 * Resolve the country in the background and patch the row once it lands.
 * Signup must not wait on a third-party lookup, and must not fail when that
 * lookup is unreachable.
 */
function resolveCountryInBackground(userId: string, ip: string) {
  void detectCountry(ip)
    .then(async (country) => {
      if (country === UNKNOWN_COUNTRY) return;
      await db
        .update(userTable)
        .set({ homeCountry: country })
        .where(eq(userTable.id, userId));
    })
    .catch((err) => logger.debug({ err }, "[identity] country backfill failed"));
}

identityRouter.get("/identity/available", rateLimit({ windowMs: 60_000, max: 90 }), async (req, res) => {
  const raw = req.query["nickname"];
  const check = validateNickname(Array.isArray(raw) ? raw[0] : raw);
  if (!check.ok) {
    res.json({ available: false, reason: check.error });
    return;
  }
  const taken = await findByNickname(check.value);
  res.json({ available: !taken, ...(taken ? { reason: "That name is already taken" } : {}) });
});

// Account creation is unauthenticated and free, so it needs some ceiling.
const createLimiter = rateLimit({ windowMs: 60_000, max: 10 });

identityRouter.post("/identity", createLimiter, async (req, res) => {
  const body = req.body as Partial<IdentityCreateRequest>;
  const { deviceId } = body;

  if (!deviceId) {
    res.status(400).json({ error: "deviceId and nickname are required" });
    return;
  }
  const check = validateNickname(body.nickname);
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }
  const nickname = check.value;

  // Return the existing identity for this device. This is what lets a signup
  // that created the account but failed before the client stored the token be
  // recovered instead of stranding the nickname.
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
    res.json(response);
    return;
  }

  if (await findByNickname(nickname)) {
    res.status(409).json({ error: "That name is already taken — try another" });
    return;
  }

  const ip = clientIp(req.headers as Record<string, unknown>, req.ip);

  let user;
  try {
    [user] = await db
      .insert(userTable)
      .values({
        id: randomUUID(),
        deviceId,
        token: randomBytes(24).toString("hex"),
        nickname,
        flag: randomFlag(),
        homeCountry: UNKNOWN_COUNTRY,
      })
      .returning();
  } catch (err) {
    // Lost the race against a concurrent signup for the same name. The unique
    // index is the authority; the check above is only a friendlier fast path.
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "That name is already taken — try another" });
      return;
    }
    throw err;
  }

  resolveCountryInBackground(user!.id, ip);

  const response: IdentityCreateResponse = {
    token: user!.token,
    identity: serializeIdentity(user!),
  };
  res.status(201).json(response);
});

identityRouter.get("/identity/me", requireAuth, async (req, res) => {
  res.json(serializeIdentity(req.user!));
});
