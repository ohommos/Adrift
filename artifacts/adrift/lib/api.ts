import { useQuery } from '@tanstack/react-query';

function getBase() {
  return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  flag: string;
  lat: number;
  lon: number;
  bottleCount: number;
}

export interface SerializedIdentity {
  id: string;
  token: string;
  nickname: string;
  flag: string;
  homeCityId: string;
  homeCity?: City;
  isPro: boolean;
  credits: number;
  usedFreeReply: boolean;
}

export interface Bottle {
  id: string;
  text: string;
  authorId: string;
  status: string;
  scope: 'global' | 'city';
  targetCityId?: string;
  targetCity?: City;
  currentLat?: number;
  currentLon?: number;
  currentOcean?: string;
  driftDays: number;
  countriesVisited: number;
  openCount: number;
  breakVotes: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  bottleId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  kind: string;
  bottleId?: string;
  fromFlag?: string;
  country?: string;
  read: boolean;
  createdAt: string;
}

export interface CityShore {
  city: City;
  bottles: Bottle[];
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string | null }
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${getBase()}/api${path}`, { ...rest, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const api = {
  createIdentity: (deviceId: string, nickname: string, flag: string, homeCityId: string) =>
    apiFetch<{ token: string; identity: SerializedIdentity }>('/identity', {
      method: 'POST',
      body: JSON.stringify({ deviceId, nickname, flag, homeCityId }),
    }),

  getMe: (token: string) => apiFetch<SerializedIdentity>('/identity/me', { token }),

  getCities: (token?: string | null) => apiFetch<City[]>('/cities', { token }),

  getCityShore: (cityId: string, token?: string | null) =>
    apiFetch<CityShore>(`/cities/${cityId}/shore`, { token }),

  getMyBottles: (token: string) => apiFetch<Bottle[]>('/bottles/mine', { token }),

  createBottle: (token: string, text: string, targetCityId?: string) =>
    apiFetch<Bottle>('/bottles', {
      method: 'POST',
      token,
      body: JSON.stringify({ text, ...(targetCityId ? { targetCityId } : {}) }),
    }),

  getInbox: (token: string) => apiFetch<Bottle[]>('/inbox', { token }),

  getBottle: (token: string, bottleId: string) =>
    apiFetch<Bottle>(`/bottles/${bottleId}`, { token }),

  openBottle: (token: string, bottleId: string) =>
    apiFetch<{ bottle: Bottle; alreadyOpen: boolean }>(`/bottles/${bottleId}/open`, {
      method: 'POST',
      token,
    }),

  breakBottle: (token: string, bottleId: string) =>
    apiFetch<{ fate: string }>(`/bottles/${bottleId}/break`, { method: 'POST', token }),

  passBottle: (token: string, bottleId: string) =>
    apiFetch<{ fate: string }>(`/bottles/${bottleId}/pass`, { method: 'POST', token }),

  replyToBottle: (token: string, bottleId: string, text: string) =>
    apiFetch<{ reply: Reply }>(`/bottles/${bottleId}/reply`, {
      method: 'POST',
      token,
      body: JSON.stringify({ text }),
    }),

  getReplies: (token: string, bottleId: string) =>
    apiFetch<Reply[]>(`/bottles/${bottleId}/replies`, { token }),

  unlockPro: (token: string) =>
    apiFetch<SerializedIdentity>('/pro/unlock', { method: 'POST', token }),

  getNotifications: (token: string) =>
    apiFetch<Notification[]>('/notifications', { token }),

  markRead: (token: string, notifId: string) =>
    apiFetch<Notification>(`/notifications/${notifId}/read`, { method: 'POST', token }),
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCities(token?: string | null) {
  return useQuery({
    queryKey: ['cities'],
    queryFn: () => api.getCities(token),
    staleTime: 60_000,
  });
}

export function useMyBottles(token: string | null) {
  return useQuery({
    queryKey: ['bottles', 'mine'],
    queryFn: () => api.getMyBottles(token!),
    enabled: !!token,
    refetchInterval: 15_000,
  });
}

export function useInbox(token: string | null) {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: () => api.getInbox(token!),
    enabled: !!token,
    refetchInterval: 15_000,
  });
}

export function useBottle(token: string | null, bottleId: string) {
  return useQuery({
    queryKey: ['bottle', bottleId],
    queryFn: () => api.getBottle(token!, bottleId),
    enabled: !!token && !!bottleId,
    refetchInterval: 15_000,
  });
}

export function useCityShore(token: string | null | undefined, cityId: string) {
  return useQuery({
    queryKey: ['city', cityId, 'shore'],
    queryFn: () => api.getCityShore(cityId, token),
    enabled: !!cityId,
  });
}

export function useNotifications(token: string | null) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(token!),
    enabled: !!token,
    refetchInterval: 20_000,
  });
}

export function useReplies(token: string | null, bottleId: string) {
  return useQuery({
    queryKey: ['replies', bottleId],
    queryFn: () => api.getReplies(token!, bottleId),
    enabled: !!token && !!bottleId,
  });
}
