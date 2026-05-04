"use client";

import { createContext, useContext, useState, useMemo } from "react";

type HelpContextValue = {
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
};

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const value = useMemo(
    () => ({
      isHelpOpen,
      openHelp: () => setIsHelpOpen(true),
      closeHelp: () => setIsHelpOpen(false),
      toggleHelp: () => setIsHelpOpen((prev) => !prev),
    }),
    [isHelpOpen]
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp(): HelpContextValue {
  const context = useContext(HelpContext);

  if (!context) {
    throw new Error("useHelp must be used within a HelpProvider");
  }

  return context;
}
