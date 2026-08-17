import { randomBytes, randomUUID } from "crypto";
import { Router } from "express";
import type {
  IdentityCreateRequest,
  IdentityCreateResponse,
  SetHomeShoreRequest,
} from "@adrift/shared";
import { HOME_SHORE_COOLDOWN_DAYS } from "@adrift/shared";
import { bottleTable, db, userTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { serializeIdentity } from "../lib/serialize";
import { getShore } from "../lib/shores";
import { requireAuth } from "../middleware/auth";
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

  // A shore is not optional. Everyone in Adrift lives somewhere: it decides
  // what reaches them, what they can write to for free, and how long their
  // letters spend at sea.
  const homeShoreId = typeof body.homeShoreId === "string" ? body.homeShoreId : null;
  if (!homeShoreId) {
    res.status(400).json({ error: "homeShoreId is required — pick your shore" });
    return;
  }
  const shore = await getShore(homeShoreId);
  if (!shore) {
    res.status(400).json({ error: "Unknown homeShoreId" });
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
      identity: await serializeIdentity(existing),
    };
    res.json(response);
    return;
  }

  if (await findByNickname(nickname)) {
    res.status(409).json({ error: "That name is already taken — try another" });
    return;
  }

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
        homeCountry: shore.name,
        homeShoreId: shore.id,
        homeShoreChangedAt: new Date(),
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

  const response: IdentityCreateResponse = {
    token: user!.token,
    identity: await serializeIdentity(user!),
  };
  res.status(201).json(response);
});

identityRouter.get("/identity/me", requireAuth, async (req, res) => {
  res.json(await serializeIdentity(req.user!));
});

/**
 * Move your home shore. Writing there is free, so an unlimited change would
 * make the Pro feature meaningless — hop, send, hop again. A cooldown keeps
 * it an occasional move rather than a workaround.
 */
identityRouter.post("/identity/home", requireAuth, async (req, res) => {
  const user = req.user!;
  const body = req.body as Partial<SetHomeShoreRequest>;
  const shoreId = typeof body.shoreId === "string" ? body.shoreId : null;

  if (!shoreId) {
    res.status(400).json({ error: "shoreId is required" });
    return;
  }
  const shore = await getShore(shoreId);
  if (!shore) {
    res.status(400).json({ error: "Unknown shoreId" });
    return;
  }
  if (shore.id === user.homeShoreId) {
    res.json(await serializeIdentity(user));
    return;
  }

  // The cooldown exists to stop shore-hopping being a way around Pro: pick a
  // shore, write there free, pick the next one. So it only starts once the
  // shore has actually been used that way. Until then — a mistyped pick at
  // onboarding, a wrong guess from the IP, second thoughts — correcting it is
  // free, and an account that never had a shore is arriving rather than
  // moving at all.
  const [{ used }] = await db
    .select({ used: sql<number>`count(*)::int` })
    .from(bottleTable)
    .where(and(eq(bottleTable.authorId, user.id), eq(bottleTable.scope, "shore")));

  const cooldownMs = HOME_SHORE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const changedAt = user.homeShoreChangedAt?.getTime() ?? 0;
  const readyAt = changedAt + cooldownMs;
  if (user.homeShoreId && used > 0 && changedAt && Date.now() < readyAt) {
    const days = Math.ceil((readyAt - Date.now()) / (24 * 60 * 60 * 1000));
    res.status(429).json({
      error: `You moved shores recently. You can move again in ${days} ${days === 1 ? "day" : "days"}.`,
    });
    return;
  }

  const [updated] = await db
    .update(userTable)
    .set({
      homeShoreId: shore.id,
      homeShoreChangedAt: new Date(),
      homeCountry: shore.name,
    })
    .where(eq(userTable.id, user.id))
    .returning();
  res.json(await serializeIdentity(updated!));
});
