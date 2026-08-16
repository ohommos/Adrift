import type { BottleState } from '@adrift/shared';

// The shared package declares this too, but importing it would be a runtime
// import of a workspace package Metro is not configured to resolve. Declaring
// it against the shared BottleState keeps it honest: if the server grows a
// new state, this stops compiling.
export const STATE_LABEL: Record<BottleState, string> = {
  sealed: 'Sealed',
  drifting: 'Drifting',
  nearing: 'Nearing a shore',
  opened: 'Opened',
  lost: 'Lost at sea',
};
