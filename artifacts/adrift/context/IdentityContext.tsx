import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, SerializedIdentity, isAuthError } from '@/lib/api';
import { deleteStoredItem, getStoredItem, setStoredItem } from '@/lib/storage';

const TOKEN_KEY = 'adrift.token';
const IDENTITY_KEY = 'adrift.identity';

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

function parseCachedIdentity(raw: string | null): SerializedIdentity | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SerializedIdentity;
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentityState] = useState<SerializedIdentity | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [storedToken, storedIdentity] = await Promise.all([
          getStoredItem(TOKEN_KEY),
          getStoredItem(IDENTITY_KEY),
        ]);
        if (!storedToken) return;

        // Restore from cache first so a launch with no connectivity lands in
        // the app rather than back on onboarding, where the user would be
        // pushed into creating a second account they can never merge.
        const cached = parseCachedIdentity(storedIdentity);
        setToken(storedToken);
        if (cached) setIdentityState(cached);

        try {
          const me = await api.getMe(storedToken);
          setIdentityState(me);
          await setStoredItem(IDENTITY_KEY, JSON.stringify(me)).catch(() => {});
        } catch (e) {
          // Only a token the server actively rejected is worth discarding.
          // Clearing on any failure means one launch on a flaky connection
          // permanently loses the account — there is no recovery path once
          // the token is gone.
          if (isAuthError(e)) {
            await deleteStoredItem(TOKEN_KEY).catch(() => {});
            await deleteStoredItem(IDENTITY_KEY).catch(() => {});
            setToken(null);
            setIdentityState(null);
          }
        }
      } catch {
        // Storage itself is unreadable — start unauthenticated.
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const setIdentity = useCallback(
    async (newIdentity: SerializedIdentity, newToken: string) => {
      await setStoredItem(TOKEN_KEY, newToken);
      await setStoredItem(IDENTITY_KEY, JSON.stringify(newIdentity)).catch(
        () => {}
      );
      setToken(newToken);
      setIdentityState(newIdentity);
    },
    []
  );

  const clearIdentity = useCallback(async () => {
    await deleteStoredItem(TOKEN_KEY).catch(() => {});
    await deleteStoredItem(IDENTITY_KEY).catch(() => {});
    setToken(null);
    setIdentityState(null);
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (!token) return;
    try {
      const me = await api.getMe(token);
      setIdentityState(me);
      await setStoredItem(IDENTITY_KEY, JSON.stringify(me)).catch(() => {});
    } catch {
      // Keep the last known identity — a failed refresh is not a logout.
    }
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
