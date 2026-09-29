"use client";

import { useMemo, type ReactNode } from "react";
import { AppShell } from "@/features/shell/AppShell";
import { DeskServicesProvider, useDeskServices } from "@/features/desk/DeskServices";
import {
  FALLBACK_AGENT_NAV,
  buildAgentMobileNav,
  buildAgentNav,
} from "@/features/desk/retailer-services";

function AgentConsoleNav({ children }: { children: ReactNode }) {
  const { ready, codes, fdProviders } = useDeskServices();

  const nav = useMemo(
    () => (ready ? buildAgentNav(codes, fdProviders) : FALLBACK_AGENT_NAV),
    [codes, fdProviders, ready],
  );

  const mobileNav = useMemo(
    () => (ready ? buildAgentMobileNav(codes, fdProviders) : buildAgentMobileNav(new Set(), [])),
    [codes, fdProviders, ready],
  );

  return (
    <AppShell title="Retailer" allowedTypes={["RETAILER"]} loginHref="/login" nav={nav} mobileNav={mobileNav}>
      {children}
    </AppShell>
  );
}

export function AgentConsoleShell({ children }: { children: ReactNode }) {
  return (
    <DeskServicesProvider>
      <AgentConsoleNav>{children}</AgentConsoleNav>
    </DeskServicesProvider>
  );
}
