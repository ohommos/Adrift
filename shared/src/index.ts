// Shared domain types between the API server and the app.

/**
 * Where a bottle is aimed.
 *  - "shore" — addressed to one country's shore; only people who live there
 *    can find it.
 *  - "ocean" — cast into the open sea; it drifts, and whoever is near it when
 *    it passes can fish it out.
 */
export type BottleScope = "shore" | "ocean";

export type BottleState = "sealed" | "drifting" | "nearing" | "opened" | "lost";

export type NotificationKind =
  | "opened"
  | "passed"
  | "country"
  | "shore"
  | "lost"
  | "reply";

/**
 * A shore is a country. It is the only place concept in Adrift: you live on
 * one, you can always write to it for free, and every distance in the app is
 * measured between two of them.
 */
export interface Shore {
  id: string;
  /** ISO 3166-1 alpha-2 — stable identity, safe to key on. */
  code: string;
  name: string;
  flag: string;
  /** UN subregion, e.g. "Western Europe". Not currently shown to users. */
  region: string;
  lat: number;
  lon: number;
  /** Bottles currently addressed to this shore. */
  bottleCount: number;
}

export interface Identity {
  id: string;
  nickname: string;
  flag: string;
  /** Best-effort, from the signup IP. Never used for anything the user pays
   *  for or is gated by — homeShore is the authority on where someone is. */
  homeCountry: string;
  /** The shore the user calls home. Null only on accounts made before shores
   *  existed; the app must make them pick before anything else. */
  homeShoreId: string | null;
  /** Resolved for convenience, so a screen does not have to fetch all shores. */
  homeShore: Shore | null;
  isPro: boolean;
  credits: number;
  usedFreeReply: boolean;
}

export interface IdentityCreateRequest {
  deviceId: string;
  nickname: string;
  /** Required. Nobody exists in Adrift without a shore. */
  homeShoreId: string;
}

export interface SetHomeShoreRequest {
  shoreId: string;
}

/** How long a chosen shore is fixed before it can be changed again. */
export const HOME_SHORE_COOLDOWN_DAYS = 30;

export interface IdentityCreateResponse {
  token: string;
  identity: Identity;
}

export interface BottleSummary {
  id: string;
  scope: BottleScope;
  state: BottleState;
  region: string;
  progress: number;
  passOnCount: number;
  countries: string[];
  text: string;
  createdAt: string;
  // Where the bottle is now. Only ever returned for bottles the caller owns
  // or has already opened, so this reveals nothing about anyone else.
  currentLat: number;
  currentLon: number;
}

export interface BottleDetail extends BottleSummary {
  originLat: number;
  originLon: number;
  targetShore: Shore | null;
}

export interface InboxItem {
  id: string;
  scope: BottleScope;
  passOnCount: number;
  opened: boolean;
  text: string | null;
  authorNickname: string | null;
  authorFlag: string | null;
  authorCountry: string | null;
  createdAt: string;
}

export interface CreateBottleRequest {
  text: string;
  scope: BottleScope;
  /** Required when scope is "shore". */
  targetShoreId?: string;
}

export type ReaderActionKind = "break" | "pass";

export interface ReaderActionResponse {
  kind: ReaderActionKind;
  credits: number;
}

export interface ReplyRequest {
  text: string;
}

export interface ReplyResponse {
  credits: number;
  usedFreeReply: boolean;
}

export interface Reply {
  id: string;
  bottleId: string;
  fromMe: boolean;
  text: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Correspondence — a private channel opened when someone answers a bottle.
// ---------------------------------------------------------------------------

export interface Letter {
  id: string;
  fromMe: boolean;
  /** Null while the letter is still crossing and is not yours. */
  text: string | null;
  sentAt: string;
  /** True once it has landed. Your own letters show as crossing until then. */
  arrived: boolean;
}

export interface CorrespondenceSummary {
  id: string;
  bottleId: string;
  /** The other person's sea-name and flag. Never more than that. */
  withNickname: string;
  withFlag: string;
  /** Opening line of the bottle that started it. */
  bottleText: string;
  lastAt: string;
  unread: number;
  /** A letter of yours is still crossing. */
  awaitingArrival: boolean;
}

export interface CorrespondenceDetail extends CorrespondenceSummary {
  letters: Letter[];
  /** False until the channel has been paid open. */
  channelOpen: boolean;
  /** Credits the next letter will cost — 0 when free. */
  writeCost: number;
  canWrite: boolean;
}

export interface WriteLetterResponse {
  credits: number;
  channelOpen: boolean;
  /** Minutes this letter will spend crossing. Never surfaced as an ETA. */
  crossingMinutes: number;
}

/** Same shore still takes a moment; the far side of the planet takes this. */
export const CROSSING_MIN_MINUTES = 2;
export const CROSSING_MAX_MINUTES = 24;
/** Used when either side has not set a home shore. */
export const CROSSING_DEFAULT_MINUTES = 12;

export interface ShoreLetter {
  nickname: string;
  passOnCount: number;
  text: string;
}

export interface ShoreView {
  shore: Shore;
  letters: ShoreLetter[];
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  bottleId: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ProUnlockResponse {
  isPro: boolean;
}

export const CREDITS_PER_REPLY = 3;
export const PRO_PRICE_USD = 5;
export const MAX_BOTTLE_LENGTH = 500;

export const STATE_LABEL: Record<BottleState, string> = {
  sealed: "Sealed",
  drifting: "Drifting",
  nearing: "Nearing a shore",
  opened: "Opened",
  lost: "Lost at sea",
};
