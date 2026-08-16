import { randomBytes, randomUUID } from "crypto";
import { Router } from "express";
import type {
  IdentityCreateRequest,
  IdentityCreateResponse,
  SetHomeCityRequest,
} from "@adrift/shared";
import { HOME_CITY_COOLDOWN_DAYS } from "@adrift/shared";
import { db, userTable, cityTable } from "@workspace/db";
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

async function cityExists(cityId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: cityTable.id })
    .from(cityTable)
    .where(eq(cityTable.id, cityId))
    .limit(1);
  return !!row;
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

  const homeCityId = typeof body.homeCityId === "string" ? body.homeCityId : null;
  if (homeCityId && !(await cityExists(homeCityId))) {
    res.status(400).json({ error: "Unknown homeCityId" });
    return;
  }

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
        homeCityId,
        homeCityChangedAt: homeCityId ? new Date() : null,
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

/**
 * Move your home shore. Sending there is free, so an unlimited change would
 * make the Pro city feature meaningless — hop, send, hop again. A cooldown
 * keeps it an occasional move rather than a workaround.
 */
identityRouter.post("/identity/home", requireAuth, async (req, res) => {
  const user = req.user!;
  const body = req.body as Partial<SetHomeCityRequest>;
  const cityId = typeof body.cityId === "string" ? body.cityId : null;

  if (!cityId) {
    res.status(400).json({ error: "cityId is required" });
    return;
  }
  if (!(await cityExists(cityId))) {
    res.status(400).json({ error: "Unknown cityId" });
    return;
  }
  if (cityId === user.homeCityId) {
    res.json(serializeIdentity(user));
    return;
  }

  const cooldownMs = HOME_CITY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const changedAt = user.homeCityChangedAt?.getTime() ?? 0;
  const readyAt = changedAt + cooldownMs;
  if (changedAt && Date.now() < readyAt) {
    const days = Math.ceil((readyAt - Date.now()) / (24 * 60 * 60 * 1000));
    res.status(429).json({
      error: `You moved shores recently. You can move again in ${days} ${days === 1 ? "day" : "days"}.`,
    });
    return;
  }

  const [updated] = await db
    .update(userTable)
    .set({ homeCityId: cityId, homeCityChangedAt: new Date() })
    .where(eq(userTable.id, user.id))
    .returning();
  res.json(serializeIdentity(updated!));
});
