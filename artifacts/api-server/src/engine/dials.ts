// The hidden dials from the spec (section 8). Nothing here is ever exposed
// to the client — the app only ever sees the qualitative state, never these
// numbers.

export const DIALS = {
  // How many independent readers must break a bottle before it sinks.
  BREAKAGE_THRESHOLD: 4,

  // Progress at which a bottle flips from "drifting" to "nearing". Progress
  // is how close the bottle is to the nearest shore, not elapsed time.
  NEARING_THRESHOLD: 0.8,

  // Per-tick probability a bottle drowns (system attrition), applied only to
  // the tail: bottles with several pass-ons or that have sat unopened a long
  // time. Never applied to fresh bottles.
  DROWNING_BASE_CHANCE: 0.015,
  DROWNING_MIN_PASS_ONS: 3,
  DROWNING_MIN_AGE_MS: 1000 * 60 * 60 * 6, // 6 hours

  // How often the engine tick runs.
  TICK_INTERVAL_MS: 15_000,

  // --- Proximity -----------------------------------------------------------
  // How far out to sea a shore can see. A drifting bottle is findable by the
  // people whose shore is within this distance of wherever it currently is,
  // which is what makes drift mean something: a bottle passes by you, and if
  // you are not looking it moves on.
  REACH_KM: 4_000,
  // Half the planet's circumference — the furthest any two points can be.
  REACH_MAX_KM: 20_038,
  // If fewer than this many bottles are within reach, the horizon widens
  // until there are. An empty sea is worse than an imprecise one, and this is
  // what keeps a brand-new shore from being a dead end.
  INBOX_TARGET: 12,
  // Ceiling on what one inbox request will return.
  INBOX_LIMIT: 20,

  // --- Drift ---------------------------------------------------------------
  // How far a bottle moves per tick. Each bottle keeps a fixed heading
  // derived from its id, so it travels in a line rather than jittering in
  // place — over an hour or so it crosses the gap between two shores.
  DRIFT_KM_PER_TICK: 90,
  // How far offshore a bottle is dropped when it is cast into the ocean.
  CAST_OFFSET_KM: 250,

  // How often a bot persona re-evaluates whether to act (open/break/pass/reply).
  BOT_ACTION_INTERVAL_MS: 20_000,
  BOT_ACTION_CHANCE: 0.35,

  // Bot behaviour weights when deciding a fate for an opened bottle.
  BOT_PASS_WEIGHT: 0.75,
  BOT_BREAK_WEIGHT: 0.25,
  BOT_REPLY_CHANCE: 0.12,
} as const;
