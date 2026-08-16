import React, { createContext, useContext, useState } from 'react';

interface ComposeContextValue {
  text: string;
  setText: (text: string) => void;
  clearText: () => void;
}

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState('');
  return (
    <ComposeContext.Provider value={{ text, setText, clearText: () => setText('') }}>
      {children}
    </ComposeContext.Provider>
  );
}

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) throw new Error('useCompose must be used inside ComposeProvider');
  return ctx;
}
