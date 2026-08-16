import type { City, Identity } from '@adrift/shared';

/**
 * The caller's home port, derived from the country resolved at signup. There
 * is one seeded city per country, so this is unambiguous. An unresolved
 * country matches nothing, which correctly means "no free city".
 */
export function findHomeCity(
  cities: City[] | undefined,
  identity: Identity | null
): City | null {
  if (!cities || !identity) return null;
  if (!identity.homeCountry || identity.homeCountry === 'Unknown') return null;
  return cities.find((c) => c.country === identity.homeCountry) ?? null;
}

/** Home water is free for everyone; any other port is a Pro feature. */
export function canSendToCity(city: City, home: City | null, isPro: boolean): boolean {
  return isPro || (!!home && home.id === city.id);
}
