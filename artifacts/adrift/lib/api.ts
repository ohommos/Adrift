import { useQuery } from '@tanstack/react-query';

function getBase() {
  return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Types come from @adrift/shared — the same definitions the server serialises
// against — so a drift between client and server is a compile error rather
// than an `undefined` on screen. Imported as types only: the declarations are
// erased at build time, so Metro never has to resolve the workspace package.
import type {
  AppNotification,
  CorrespondenceDetail,
  CorrespondenceSummary,
  WriteLetterResponse,
  BottleDetail,
  BottleSummary,
  Identity,
  IdentityCreateResponse,
  InboxItem,
  ReaderActionResponse,
  Reply,
  ReplyResponse,
  ProUnlockResponse,
  Shore,
  ShoreView,
} from '@adrift/shared';

export type {
  AppNotification,
  CorrespondenceDetail,
  CorrespondenceSummary,
  BottleDetail,
  BottleSummary,
  Identity,
  InboxItem,
  ReaderActionResponse,
  Reply,
  ReplyResponse,
  Shore,
  ShoreView,
};

/** Kept as an alias so existing call sites keep reading naturally. */
export type SerializedIdentity = Identity;

// ─── Fetch helper ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** True only when the server actively rejected the credentials. */
export function isAuthError(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 401 || e.status === 403);
}

// No request may hang indefinitely — the cold-start path waits on one before
// it can decide whether to show onboarding or the app.
const REQUEST_TIMEOUT_MS = 12_000;

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string | null }
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${getBase()}/api${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    throw new ApiError(
      0,
      controller.signal.aborted
        ? 'The sea is quiet — the request timed out.'
        : e instanceof Error
          ? e.message
          : 'Could not reach the sea.'
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string; message?: string }).error
      ?? (body as { message?: string }).message
      ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const api = {
  // homeShoreId is required by the server: nobody exists in Adrift without a
  // shore, so onboarding cannot complete without one.
  createIdentity: (deviceId: string, nickname: string, homeShoreId: string) =>
    apiFetch<IdentityCreateResponse>('/identity', {
      method: 'POST',
      body: JSON.stringify({ deviceId, nickname, homeShoreId }),
    }),

  setHomeShore: (token: string, shoreId: string) =>
    apiFetch<Identity>('/identity/home', {
      method: 'POST',
      token,
      body: JSON.stringify({ shoreId }),
    }),

  getMe: (token: string) => apiFetch<Identity>('/identity/me', { token }),

  checkNickname: (nickname: string) =>
    apiFetch<{ available: boolean; reason?: string }>(
      `/identity/available?nickname=${encodeURIComponent(nickname)}`
    ),

  getShores: (token?: string | null) => apiFetch<Shore[]>('/shores', { token }),

  /** A guess at the caller's shore from their IP — only ever a pre-selection. */
  suggestShore: () => apiFetch<{ shore: Shore | null }>('/shores/suggest'),

  getShore: (shoreId: string, token?: string | null) =>
    apiFetch<ShoreView>(`/shores/${shoreId}`, { token }),

  getMyBottles: (token: string) => apiFetch<BottleSummary[]>('/bottles/mine', { token }),

  // `scope` is required by the server and has no default — omitting it makes
  // every cast fail with 400.
  createBottle: (token: string, text: string, targetShoreId?: string) =>
    apiFetch<BottleSummary>('/bottles', {
      method: 'POST',
      token,
      body: JSON.stringify(
        targetShoreId
          ? { text, scope: 'shore', targetShoreId }
          : { text, scope: 'ocean' }
      ),
    }),

  getInbox: (token: string) => apiFetch<InboxItem[]>('/inbox', { token }),

  getBottle: (token: string, bottleId: string) =>
    apiFetch<BottleDetail>(`/bottles/${bottleId}`, { token }),

  // Returns the revealed item itself — there is no wrapper object.
  openBottle: (token: string, bottleId: string) =>
    apiFetch<InboxItem>(`/bottles/${bottleId}/open`, {
      method: 'POST',
      token,
    }),

  breakBottle: (token: string, bottleId: string) =>
    apiFetch<ReaderActionResponse>(`/bottles/${bottleId}/break`, { method: 'POST', token }),

  passBottle: (token: string, bottleId: string) =>
    apiFetch<ReaderActionResponse>(`/bottles/${bottleId}/pass`, { method: 'POST', token }),

  replyToBottle: (token: string, bottleId: string, text: string) =>
    apiFetch<ReplyResponse>(`/bottles/${bottleId}/reply`, {
      method: 'POST',
      token,
      body: JSON.stringify({ text }),
    }),

  getCorrespondences: (token: string) =>
    apiFetch<CorrespondenceSummary[]>('/correspondences', { token }),

  getCorrespondence: (token: string, id: string) =>
    apiFetch<CorrespondenceDetail>(`/correspondences/${id}`, { token }),

  /** Answer a bottle — opens the correspondence if there isn't one yet. */
  answerBottle: (token: string, bottleId: string, text: string) =>
    apiFetch<WriteLetterResponse>(`/bottles/${bottleId}/answer`, {
      method: 'POST',
      token,
      body: JSON.stringify({ text }),
    }),

  writeLetter: (token: string, correspondenceId: string, text: string) =>
    apiFetch<WriteLetterResponse>(`/correspondences/${correspondenceId}/letters`, {
      method: 'POST',
      token,
      body: JSON.stringify({ text }),
    }),

  getReplies: (token: string, bottleId: string) =>
    apiFetch<Reply[]>(`/bottles/${bottleId}/replies`, { token }),

  unlockPro: (token: string) =>
    apiFetch<ProUnlockResponse>('/pro/unlock', { method: 'POST', token }),

  getNotifications: (token: string) =>
    apiFetch<AppNotification[]>('/notifications', { token }),

  markRead: (token: string, notifId: string) =>
    apiFetch<AppNotification>(`/notifications/${notifId}/read`, { method: 'POST', token }),
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useShores(token?: string | null) {
  return useQuery({
    queryKey: ['shores'],
    queryFn: () => api.getShores(token),
    staleTime: 60_000,
  });
}

/** One IP lookup, cached for the session. Never blocks anything. */
export function useSuggestedShore(enabled = true) {
  return useQuery({
    queryKey: ['shores', 'suggest'],
    queryFn: () => api.suggestShore(),
    enabled,
    staleTime: Infinity,
    retry: false,
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

export function useShore(token: string | null | undefined, shoreId: string) {
  return useQuery({
    queryKey: ['shore', shoreId],
    queryFn: () => api.getShore(shoreId, token),
    enabled: !!shoreId,
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

export function useCorrespondences(token: string | null) {
  return useQuery({
    queryKey: ['correspondences'],
    queryFn: () => api.getCorrespondences(token!),
    enabled: !!token,
    refetchInterval: 15_000,
  });
}

export function useCorrespondence(token: string | null, id: string) {
  return useQuery({
    queryKey: ['correspondence', id],
    queryFn: () => api.getCorrespondence(token!, id),
    enabled: !!token && !!id,
    // A letter in transit lands on its own; keep the thread fresh so the
    // arrival shows up without the reader doing anything.
    refetchInterval: 10_000,
  });
}

export function useReplies(token: string | null, bottleId: string) {
  return useQuery({
    queryKey: ['replies', bottleId],
    queryFn: () => api.getReplies(token!, bottleId),
    enabled: !!token && !!bottleId,
  });
}
