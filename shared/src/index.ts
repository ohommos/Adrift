// Shared domain types between /server and /app. Keep in sync with server/prisma/schema.prisma.

export type BottleScope = "city" | "global";

export type BottleState = "sealed" | "drifting" | "nearing" | "opened" | "lost";

export type NotificationKind =
  | "opened"
  | "passed"
  | "country"
  | "shore"
  | "lost"
  | "reply";

export interface City {
  id: string;
  name: string;
  flag: string;
  /** Used to tell whether this is the caller's home water, which is free. */
  country: string;
  lat: number;
  lon: number;
  bottleCount: number;
}

export interface Identity {
  id: string;
  nickname: string;
  flag: string;
  homeCountry: string;
  /** The shore the user picked. Sending here is free. */
  homeCityId: string | null;
  isPro: boolean;
  credits: number;
  usedFreeReply: boolean;
}

export interface IdentityCreateRequest {
  deviceId: string;
  nickname: string;
  homeCityId?: string;
}

export interface SetHomeCityRequest {
  cityId: string;
}

/** How long a chosen shore is fixed before it can be changed again. */
export const HOME_CITY_COOLDOWN_DAYS = 30;

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
  targetCity: City | null;
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
  targetCityId?: string;
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

export interface CityShoreLetter {
  nickname: string;
  passOnCount: number;
  text: string;
}

export interface CityShore {
  city: City;
  letters: CityShoreLetter[];
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
