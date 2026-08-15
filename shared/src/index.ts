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
  lat: number;
  lon: number;
  bottleCount: number;
}

export interface Identity {
  id: string;
  nickname: string;
  flag: string;
  homeCity: City;
  isPro: boolean;
  credits: number;
  usedFreeReply: boolean;
}

export interface IdentityCreateRequest {
  deviceId: string;
  nickname: string;
  flag: string;
  homeCityId: string;
}

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
}

export interface BottleDetail extends BottleSummary {
  currentLat: number;
  currentLon: number;
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
  authorCity: string | null;
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
