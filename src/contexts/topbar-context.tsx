"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

import { TopBarConfig, TopBarContextValue, defaultTopBarConfig } from "@/types/topbar";

const TopBarContext = createContext<TopBarContextValue | undefined>(undefined);

interface TopBarProviderProps {
  children: ReactNode;
}

export function TopBarProvider({ children }: TopBarProviderProps) {
  const [config, setConfigState] = useState<TopBarConfig>(defaultTopBarConfig);

  const setConfig = useCallback((newConfig: Partial<TopBarConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(defaultTopBarConfig);
  }, []);

  const value: TopBarContextValue = useMemo(
    () => ({
      config,
      setConfig,
      resetConfig,
    }),
    [config, setConfig, resetConfig],
  );

  return <TopBarContext.Provider value={value}>{children}</TopBarContext.Provider>;
}

export function useTopBar() {
  const context = useContext(TopBarContext);
  if (context === undefined) {
    throw new Error("useTopBar must be used within a TopBarProvider");
  }
  return context;
}
