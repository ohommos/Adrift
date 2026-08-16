import type {
  AppNotification,
  BottleDetail,
  BottleSummary,
  Identity,
} from "@adrift/shared";
import type { Bottle, City, Notification, User } from "@workspace/db";
import { nearestOceanName } from "./geo";
import { UNKNOWN_COUNTRY } from "./geoip";
import { db, bottleOpenTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

export function serializeCity(city: City, bottleCount = 0) {
  return {
    id: city.id,
    name: city.name,
    flag: city.flag,
    country: city.country,
    lat: city.lat,
    lon: city.lon,
    bottleCount,
  };
}

export function serializeIdentity(user: User): Identity {
  return {
    id: user.id,
    nickname: user.nickname,
    flag: user.flag,
    homeCountry: user.homeCountry,
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
  const countries = bottle.scope === "global" ? await bottleCountries(bottle.id) : [];
  return {
    id: bottle.id,
    scope: bottle.scope as "city" | "global",
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

export async function serializeBottleDetail(
  bottle: Bottle,
  targetCity: City | null
): Promise<BottleDetail> {
  const summary = await serializeBottleSummary(bottle);
  return {
    ...summary,
    originLat: bottle.originLat,
    originLon: bottle.originLon,
    targetCity: targetCity ? serializeCity(targetCity) : null,
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
