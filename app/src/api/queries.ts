import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppNotification,
  BottleDetail,
  BottleSummary,
  City,
  CityShore,
  CreateBottleRequest,
  IdentityCreateRequest,
  IdentityCreateResponse,
  InboxItem,
  ProUnlockResponse,
  ReaderActionKind,
  ReaderActionResponse,
  Reply,
  ReplyResponse,
} from "@adrift/shared";
import { apiRequest } from "./client";

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: () => apiRequest<City[]>("/cities", { auth: false }),
  });
}

export function useCityShore(cityId: string | null) {
  return useQuery({
    queryKey: ["city-shore", cityId],
    queryFn: () => apiRequest<CityShore>(`/cities/${cityId}/shore`, { auth: false }),
    enabled: !!cityId,
  });
}

export function useMyBottles() {
  return useQuery({
    queryKey: ["bottles", "mine"],
    queryFn: () => apiRequest<BottleSummary[]>("/bottles/mine"),
    refetchInterval: 15_000,
  });
}

export function useBottleDetail(id: string | null) {
  return useQuery({
    queryKey: ["bottles", id],
    queryFn: () => apiRequest<BottleDetail>(`/bottles/${id}`),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: () => apiRequest<InboxItem[]>("/inbox"),
    refetchInterval: 15_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<AppNotification[]>("/notifications"),
    refetchInterval: 20_000,
  });
}

export function useReplies(bottleId: string | null) {
  return useQuery({
    queryKey: ["replies", bottleId],
    queryFn: () => apiRequest<Reply[]>(`/bottles/${bottleId}/replies`),
    enabled: !!bottleId,
  });
}

export function useCreateIdentity() {
  return useMutation({
    mutationFn: (body: IdentityCreateRequest) =>
      apiRequest<IdentityCreateResponse>("/identity", { method: "POST", body, auth: false }),
  });
}

export function useCreateBottle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBottleRequest) =>
      apiRequest<BottleSummary>("/bottles", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bottles", "mine"] });
      qc.invalidateQueries({ queryKey: ["cities"] });
    },
  });
}

export function useOpenBottle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bottleId: string) => apiRequest<InboxItem>(`/bottles/${bottleId}/open`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function useResolveFate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bottleId, kind }: { bottleId: string; kind: ReaderActionKind }) =>
      apiRequest<ReaderActionResponse>(`/bottles/${bottleId}/${kind}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["identity"] });
    },
  });
}

export function useSendReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bottleId, text }: { bottleId: string; text: string }) =>
      apiRequest<ReplyResponse>(`/bottles/${bottleId}/reply`, { method: "POST", body: { text } }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["replies", vars.bottleId] });
      qc.invalidateQueries({ queryKey: ["identity"] });
    },
  });
}

export function useUnlockPro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<ProUnlockResponse>("/pro/unlock", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["identity"] }),
  });
}
