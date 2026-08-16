import {
  CROSSING_DEFAULT_MINUTES,
  CROSSING_MAX_MINUTES,
  CROSSING_MIN_MINUTES,
} from "@adrift/shared";

const EARTH_RADIUS_KM = 6371;
/** Antipodal distance — the furthest two points on the planet can be. */
const HALF_CIRCUMFERENCE_KM = Math.PI * EARTH_RADIUS_KM;

export function greatCircleKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const la1 = toRad(aLat);
  const la2 = toRad(bLat);
  const dLa = toRad(bLat - aLat);
  const dLo = toRad(bLon - aLon);
  const h =
    Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * How long a letter spends at sea, from the distance between the two writers'
 * home shores. The planet is scaled down: the far side of the world is
 * CROSSING_MAX_MINUTES away rather than a day.
 *
 * Never surfaced as an ETA — the spec is explicit that the app promises no
 * arrival times. It only decides when a letter lands.
 */
export function crossingMinutes(
  from: { lat: number; lon: number } | null,
  to: { lat: number; lon: number } | null
): number {
  // Someone has not set a home shore, so there is no route to measure.
  if (!from || !to) return CROSSING_DEFAULT_MINUTES;

  const km = greatCircleKm(from.lat, from.lon, to.lat, to.lon);
  const share = Math.min(1, km / HALF_CIRCUMFERENCE_KM);
  // The floor matters: two people on the same shore would otherwise get an
  // instant delivery, and the waiting is the point.
  return (
    CROSSING_MIN_MINUTES + share * (CROSSING_MAX_MINUTES - CROSSING_MIN_MINUTES)
  );
}
