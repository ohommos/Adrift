import type {
  AppNotification,
  BottleDetail,
  BottleSummary,
  Identity,
  Shore as SharedShore,
} from "@adrift/shared";
import type { Bottle, Notification, Shore, User } from "@workspace/db";
import { nearestOceanName } from "./geo";
import { getShore } from "./shores";
import { UNKNOWN_COUNTRY } from "./geoip";
import { db, bottleOpenTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

export function serializeShore(shore: Shore, bottleCount = 0): SharedShore {
  return {
    id: shore.id,
    code: shore.code,
    name: shore.name,
    flag: shore.flag,
    region: shore.region,
    lat: shore.lat,
    lon: shore.lon,
    bottleCount,
  };
}

export async function serializeIdentity(user: User): Promise<Identity> {
  const home = await getShore(user.homeShoreId);
  return {
    id: user.id,
    nickname: user.nickname,
    flag: user.flag,
    homeCountry: user.homeCountry,
    homeShoreId: user.homeShoreId ?? null,
    homeShore: home ? serializeShore(home) : null,
    isPro: user.isPro,
    credits: user.credits,
    usedFreeReply: user.usedFreeReply,
  };
}

export async function bottleCountries(bottleId: string): Promise<string[]> {
  const opens = await db
    .select({ country: bottleOpenTable.country })
    .from(bottleOpenTable)
    .where(eq(bottleOpenTable.bottleId, bottleId))
    .orderBy(asc(bottleOpenTable.openedAt));

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const o of opens) {
    // Unresolved countries are not places to list on a bottle's journey.
    if (o.country === UNKNOWN_COUNTRY) continue;
    if (!seen.has(o.country)) {
      seen.add(o.country);
      ordered.push(o.country);
    }
  }
  return ordered;
}

export async function serializeBottleSummary(bottle: Bottle): Promise<BottleSummary> {
  const countries = bottle.scope === "ocean" ? await bottleCountries(bottle.id) : [];
  return {
    id: bottle.id,
    scope: bottle.scope as BottleSummary["scope"],
    state: bottle.state as BottleSummary["state"],
    region: nearestOceanName(bottle.currentLat, bottle.currentLon),
    progress: bottle.progress,
    passOnCount: bottle.passOnCount,
    countries,
    text: bottle.text,
    createdAt: bottle.createdAt.toISOString(),
    currentLat: bottle.currentLat,
    currentLon: bottle.currentLon,
  };
}

export async function serializeBottleDetail(bottle: Bottle): Promise<BottleDetail> {
  const summary = await serializeBottleSummary(bottle);
  const target = await getShore(bottle.targetShoreId);
  return {
    ...summary,
    originLat: bottle.originLat,
    originLon: bottle.originLon,
    targetShore: target ? serializeShore(target) : null,
  };
}

export function serializeNotification(n: Notification): AppNotification {
  return {
    id: n.id,
    kind: n.kind as AppNotification["kind"],
    bottleId: n.bottleId ?? null,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}
