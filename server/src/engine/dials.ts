// The hidden dials from the spec (section 8). Nothing here is ever exposed
// to the client — the app only ever sees the qualitative state, never these
// numbers.

export const DIALS = {
  // How many independent readers must break a bottle before it sinks.
  BREAKAGE_THRESHOLD: 4,

  // How much drift progress a bottle gains per engine tick while "drifting".
  PROGRESS_PER_TICK: 0.05,

  // Progress at which a bottle flips from "drifting" to "nearing".
  NEARING_THRESHOLD: 0.8,

  // Per-tick probability a bottle drowns (system attrition), applied only to
  // the tail: bottles with several pass-ons or that have sat unopened a long
  // time. Never applied to fresh bottles.
  DROWNING_BASE_CHANCE: 0.015,
  DROWNING_MIN_PASS_ONS: 3,
  DROWNING_MIN_AGE_MS: 1000 * 60 * 60 * 6, // 6 hours

  // How often the engine tick runs.
  TICK_INTERVAL_MS: 15_000,

  // How often a bot persona re-evaluates whether to act (open/break/pass/reply).
  BOT_ACTION_INTERVAL_MS: 20_000,
  BOT_ACTION_CHANCE: 0.35,

  // Bot behaviour weights when deciding a fate for an opened bottle.
  BOT_PASS_WEIGHT: 0.75,
  BOT_BREAK_WEIGHT: 0.25,
  BOT_REPLY_CHANCE: 0.12,
} as const;
