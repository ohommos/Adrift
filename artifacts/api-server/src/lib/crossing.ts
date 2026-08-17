import {
  CROSSING_DEFAULT_MINUTES,
  CROSSING_MAX_MINUTES,
  CROSSING_MIN_MINUTES,
} from "@adrift/shared";
import { HALF_CIRCUMFERENCE_KM, greatCircleKm } from "./geo";

export { greatCircleKm };

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
