import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, SerializedIdentity } from '@/lib/api';

const TOKEN_KEY = 'adrift.token';

interface IdentityContextValue {
  identity: SerializedIdentity | null;
  token: string | null;
  isLoading: boolean;
  hasIdentity: boolean;
  setIdentity: (identity: SerializedIdentity, token: string) => Promise<void>;
  clearIdentity: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentityState] = useState<SerializedIdentity | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          const me = await api.getMe(stored);
          setToken(stored);
          setIdentityState(me);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const setIdentity = useCallback(
    async (newIdentity: SerializedIdentity, newToken: string) => {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setToken(newToken);
      setIdentityState(newIdentity);
    },
    []
  );

  const clearIdentity = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setIdentityState(null);
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (!token) return;
    try {
      const me = await api.getMe(token);
      setIdentityState(me);
    } catch {}
  }, [token]);

  return (
    <IdentityContext.Provider
      value={{
        identity,
        token,
        isLoading,
        hasIdentity: !!identity,
        setIdentity,
        clearIdentity,
        refreshIdentity,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used inside IdentityProvider');
  return ctx;
}
