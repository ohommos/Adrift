import type { Identity, Shore } from '@adrift/shared';

/**
 * The shore the user calls home. Picked at onboarding and stored on the
 * identity, so this is a lookup rather than a guess.
 *
 * Returns null only for accounts created before shores existed. Those are
 * sent to the picker before they can do anything else — nobody in Adrift is
 * without a shore.
 */
export function findHomeShore(
  shores: Shore[] | undefined,
  identity: Identity | null
): Shore | null {
  if (!identity) return null;
  // The server sends the resolved shore with the identity; the list is only
  // a fallback for a cached identity from before that field existed.
  if (identity.homeShore) return identity.homeShore;
  if (!shores || !identity.homeShoreId) return null;
  return shores.find((s) => s.id === identity.homeShoreId) ?? null;
}

/** Your own shore is free for everyone; any other one is a Pro feature. */
export function canSendToShore(shore: Shore, home: Shore | null, isPro: boolean): boolean {
  return isPro || (!!home && home.id === shore.id);
}
