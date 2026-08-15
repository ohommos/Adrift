import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { Identity } from "@adrift/shared";
import { apiRequest, setToken } from "../api/client";
import { useCreateIdentity } from "../api/queries";

const DEVICE_ID_KEY = "adrift.deviceId";

function randomId() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

async function getOrCreateDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = randomId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}

type Status = "loading" | "onboarding" | "ready";

interface IdentityContextValue {
  status: Status;
  identity: Identity | null;
  createIdentity: (input: { nickname: string; flag: string; homeCityId: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const createIdentityMutation = useCreateIdentity();

  const bootstrap = useCallback(async () => {
    const token = await SecureStore.getItemAsync("adrift.token");
    if (!token) {
      setStatus("onboarding");
      return;
    }
    try {
      const me = await apiRequest<Identity>("/identity/me");
      setIdentity(me);
      setStatus("ready");
    } catch {
      setStatus("onboarding");
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const createIdentity = useCallback(
    async (input: { nickname: string; flag: string; homeCityId: string }) => {
      const deviceId = await getOrCreateDeviceId();
      const result = await createIdentityMutation.mutateAsync({ deviceId, ...input });
      await setToken(result.token);
      setIdentity(result.identity);
      setStatus("ready");
    },
    [createIdentityMutation]
  );

  return (
    <IdentityContext.Provider value={{ status, identity, createIdentity, refresh: bootstrap }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
