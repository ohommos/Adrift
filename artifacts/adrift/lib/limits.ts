import type { BottleScope } from '@adrift/shared';

// Mirrors the shared constants. They cannot be imported at runtime here (the
// workspace package is type-only for Metro), so they are re-declared and kept
// honest by the types they are used with.
export const MAX_BOTTLE_LENGTH = 500;
export const CREDITS_PER_REPLY = 3;

export const SCOPES: Array<{ id: BottleScope; label: string; desc: string }> = [
  {
    id: 'city',
    label: 'Your City',
    desc: 'Only found by people near you. A smaller, closer water.',
  },
  {
    id: 'global',
    label: 'Global',
    desc: "Could reach anyone, anywhere. You'll see which countries open it.",
  },
];
