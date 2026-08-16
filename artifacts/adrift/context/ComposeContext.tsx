import React, { createContext, useContext, useMemo, useState } from 'react';

interface ComposeContextValue {
  text: string;
  setText: (text: string) => void;
  /** Set when the draft was started from a city shore ("throw a bottle into X"). */
  targetCityId: string | null;
  setTargetCityId: (id: string | null) => void;
  clearDraft: () => void;
}

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState('');
  const [targetCityId, setTargetCityId] = useState<string | null>(null);

  const value = useMemo<ComposeContextValue>(
    () => ({
      text,
      setText,
      targetCityId,
      setTargetCityId,
      clearDraft: () => {
        setText('');
        setTargetCityId(null);
      },
    }),
    [text, targetCityId]
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) throw new Error('useCompose must be used inside ComposeProvider');
  return ctx;
}
