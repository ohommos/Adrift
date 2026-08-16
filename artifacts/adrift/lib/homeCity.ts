import type { City, Identity } from '@adrift/shared';

/**
 * The caller's home shore. Chosen explicitly at signup; accounts made before
 * the picker existed fall back to the country resolved from their IP, so they
 * keep the free port they already had.
 */
export function findHomeCity(
  cities: City[] | undefined,
  identity: Identity | null
): City | null {
  if (!cities || !identity) return null;
  if (identity.homeCityId) {
    return cities.find((c) => c.id === identity.homeCityId) ?? null;
  }
  if (!identity.homeCountry || identity.homeCountry === 'Unknown') return null;
  return cities.find((c) => c.country === identity.homeCountry) ?? null;
}

/** Home water is free for everyone; any other port is a Pro feature. */
export function canSendToCity(city: City, home: City | null, isPro: boolean): boolean {
  return isPro || (!!home && home.id === city.id);
}
