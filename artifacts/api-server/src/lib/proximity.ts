import { EARTH_RADIUS_KM } from "./geo";

export interface Box {
  minLat: number;
  maxLat: number;
  /** One range normally; two when the window crosses the antimeridian. */
  lonRanges: Array<[number, number]>;
}

/**
 * A lat/lon window guaranteed to contain every point within `km` of the
 * centre. Used only as a cheap prefilter — the exact great-circle distance
 * still decides what is actually in reach, so the box being generous is fine.
 */
export function boundingBox(lat: number, lon: number, km: number): Box {
  const dLat = ((km / EARTH_RADIUS_KM) * 180) / Math.PI;
  const minLat = Math.max(-90, lat - dLat);
  const maxLat = Math.min(90, lat + dLat);

  // A degree of longitude is shortest near the poles, so the widest span in
  // degrees is at whichever edge of the band is closest to one.
  const worstLat = Math.max(Math.abs(minLat), Math.abs(maxLat));
  const cos = Math.cos((worstLat * Math.PI) / 180);
  const whole: Box = { minLat, maxLat, lonRanges: [[-180, 180]] };
  if (cos <= 1e-6) return whole;

  const dLon = dLat / cos;
  if (dLon >= 180) return whole;

  const lo = lon - dLon;
  const hi = lon + dLon;
  if (lo < -180) return { minLat, maxLat, lonRanges: [[-180, hi], [lo + 360, 180]] };
  if (hi > 180) return { minLat, maxLat, lonRanges: [[lo, 180], [-180, hi - 360]] };
  return { minLat, maxLat, lonRanges: [[lo, hi]] };
}
