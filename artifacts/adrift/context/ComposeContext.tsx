import React, { createContext, useContext, useMemo, useState } from 'react';

interface ComposeContextValue {
  text: string;
  setText: (text: string) => void;
  /** Set when the draft was started from a shore ("throw a bottle into X"). */
  targetShoreId: string | null;
  setTargetShoreId: (id: string | null) => void;
  clearDraft: () => void;
}

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState('');
  const [targetShoreId, setTargetShoreId] = useState<string | null>(null);

  const value = useMemo<ComposeContextValue>(
    () => ({
      text,
      setText,
      targetShoreId,
      setTargetShoreId,
      clearDraft: () => {
        setText('');
        setTargetShoreId(null);
      },
    }),
    [text, targetShoreId]
  );

  return <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>;
}

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) throw new Error('useCompose must be used inside ComposeProvider');
  return ctx;
}
