import { db, shoreTable, type Shore } from "@workspace/db";
import { eq } from "drizzle-orm";

// Shores are static once seeded — 196 rows that never change while the
// process is up — so every lookup goes through one cached read rather than a
// query per bottle.
let cache: Shore[] | null = null;
let byId: Map<string, Shore> | null = null;

export async function allShores(): Promise<Shore[]> {
  if (!cache) {
    cache = await db.select().from(shoreTable).orderBy(shoreTable.name);
    byId = new Map(cache.map((s) => [s.id, s]));
  }
  return cache;
}

export async function getShore(id: string | null | undefined): Promise<Shore | null> {
  if (!id) return null;
  await allShores();
  const hit = byId!.get(id);
  if (hit) return hit;
  // A shore added after the cache was warmed (or a stale id from a client).
  const [row] = await db.select().from(shoreTable).where(eq(shoreTable.id, id)).limit(1);
  return row ?? null;
}

export async function shoreExists(id: string): Promise<boolean> {
  return (await getShore(id)) !== null;
}

/** Called after seeding so the first request does not read a half-built table. */
export function invalidateShoreCache() {
  cache = null;
  byId = null;
}
