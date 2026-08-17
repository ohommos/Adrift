// Geography helpers. Everything here works on a plain sphere — good enough
// for deciding which shore is near a drifting bottle, which is all it is for.

export const EARTH_RADIUS_KM = 6371;
/** Antipodal distance — the furthest two points on the planet can be. */
export const HALF_CIRCUMFERENCE_KM = Math.PI * EARTH_RADIUS_KM;

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in kilometres. */
export function greatCircleKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const la1 = toRad(aLat);
  const la2 = toRad(bLat);
  const dLa = toRad(bLat - aLat);
  const dLo = toRad(bLon - aLon);
  const h =
    Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Normalise a longitude into [-180, 180). */
export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/**
 * Move `km` from a point along a compass heading, following a great circle.
 * Latitude is clamped short of the poles: the map never shows them, and a
 * bottle that reaches 90° has an undefined longitude.
 */
export function advance(
  lat: number,
  lon: number,
  headingDeg: number,
  km: number
): { lat: number; lon: number } {
  const d = km / EARTH_RADIUS_KM;
  const brg = toRad(headingDeg);
  const la1 = toRad(lat);
  const lo1 = toRad(lon);

  const la2 = Math.asin(
    Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(brg)
  );
  const lo2 =
    lo1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(d) * Math.cos(la1),
      Math.cos(d) - Math.sin(la1) * Math.sin(la2)
    );

  return {
    lat: Math.max(-78, Math.min(78, toDeg(la2))),
    lon: wrapLon(toDeg(lo2)),
  };
}

/**
 * The heading a given bottle drifts along. Derived from its id so it is fixed
 * for the life of the bottle without needing a column: a bottle travels in a
 * line, which is what makes "it drifted past your shore" true rather than a
 * story told over a random walk.
 */
export function driftHeading(bottleId: string): number {
  let h = 2166136261;
  for (let i = 0; i < bottleId.length; i++) {
    h = Math.imul(h ^ bottleId.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 3600) / 10;
}

/**
 * Where a bottle lands when someone casts it from their shore — a little way
 * out, in some direction, so two bottles thrown from the same country do not
 * start on top of each other.
 */
export function offshorePoint(
  lat: number,
  lon: number,
  km: number
): { lat: number; lon: number } {
  return advance(lat, lon, Math.random() * 360, km);
}

// Rough ocean regions, used only to label a bottle's drift for flavour text
// (e.g. "North Atlantic"). Not used for matching logic.
const OCEANS = [
  { name: "North Pacific", lat: 32, lon: -168 },
  { name: "South Pacific", lat: -28, lon: -128 },
  { name: "North Atlantic", lat: 36, lon: -42 },
  { name: "South Atlantic", lat: -26, lon: -18 },
  { name: "Indian Ocean", lat: -18, lon: 76 },
  { name: "Southern Ocean", lat: -58, lon: 30 },
  { name: "Arctic Ocean", lat: 76, lon: -10 },
  { name: "Mediterranean", lat: 36, lon: 16 },
  { name: "Caribbean", lat: 15, lon: -74 },
  { name: "Arabian Sea", lat: 14, lon: 64 },
  { name: "South China Sea", lat: 13, lon: 115 },
  { name: "Coral Sea", lat: -17, lon: 154 },
];

export function nearestOceanName(lat: number, lon: number): string {
  let best = OCEANS[0];
  let bestDist = Infinity;
  for (const o of OCEANS) {
    const d = greatCircleKm(lat, lon, o.lat, o.lon);
    if (d < bestDist) {
      bestDist = d;
      best = o;
    }
  }
  return best.name;
}

/** A point somewhere on the open sea. Used only when there is no shore to cast from. */
export function randomOceanPoint() {
  return { lat: Math.random() * 140 - 70, lon: Math.random() * 360 - 180 };
}
