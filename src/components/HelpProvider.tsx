"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";

export type HelpTeamMember = {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string | null;
  profile_pic_url: string | null;
  sort_order: number;
};

export type HelpContextValue = {
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  teamMembers: HelpTeamMember[];
  isLoadingTeam: boolean;
};

export const HelpContext = createContext<HelpContextValue | null>(null);

let memoryTeamMembers: HelpTeamMember[] = [];
let isFetchingTeamMembers = false;

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<HelpTeamMember[]>(() => memoryTeamMembers);
  const [isLoadingTeam, setIsLoadingTeam] = useState(() => memoryTeamMembers.length === 0);

  useEffect(() => {
    if (memoryTeamMembers.length > 0) {
      setTeamMembers(memoryTeamMembers);
      setIsLoadingTeam(false);
      return;
    }

    if (isFetchingTeamMembers) return;
    isFetchingTeamMembers = true;

    async function prefetchTeam() {
      try {
        const response = await fetch('/api/team-members', {
          headers: {
            Accept: 'application/json',
          },
        });
        const data = await response.json();
        const members = Array.isArray(data.data) ? data.data : [];
        memoryTeamMembers = members;
        setTeamMembers(members);
      } catch (error) {
        console.error('Error prefetching team members:', error);
      } finally {
        setIsLoadingTeam(false);
        isFetchingTeamMembers = false;
      }
    }

    prefetchTeam();
  }, []);

  const value = useMemo(
    () => ({
      isHelpOpen,
      openHelp: () => setIsHelpOpen(true),
      closeHelp: () => setIsHelpOpen(false),
      toggleHelp: () => setIsHelpOpen((prev) => !prev),
      teamMembers,
      isLoadingTeam,
    }),
    [isHelpOpen, teamMembers, isLoadingTeam]
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

