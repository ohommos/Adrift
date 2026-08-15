import React, { createContext, useContext, useState } from "react";
import type { BottleScope, City } from "@adrift/shared";

interface ComposeState {
  text: string;
  setText: (t: string) => void;
  scope: BottleScope;
  setScope: (s: BottleScope) => void;
  targetCity: City | null;
  setTargetCity: (c: City | null) => void;
  reset: () => void;
}

const ComposeContext = createContext<ComposeState | null>(null);

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState("");
  const [scope, setScope] = useState<BottleScope>("global");
  const [targetCity, setTargetCity] = useState<City | null>(null);

  const reset = () => {
    setText("");
    setScope("global");
    setTargetCity(null);
  };

  return (
    <ComposeContext.Provider value={{ text, setText, scope, setScope, targetCity, setTargetCity, reset }}>
      {children}
    </ComposeContext.Provider>
  );
}

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) throw new Error("useCompose must be used within ComposeProvider");
  return ctx;
}
