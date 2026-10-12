"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { DeskServicesProvider, useDeskServices } from "@/features/desk/DeskServices";
import { retailerAwaitingActivation, useSession } from "@/stores/session.store";
import {
  FALLBACK_AGENT_NAV,
  buildAgentMobileNav,
  buildAgentNav,
} from "@/features/desk/retailer-services";

const PENDING_NAV = [{ href: "/agent/activate", label: "Activation" }];

function PendingActivationGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/agent/activate" && pathname !== "/agent/profile") {
      router.replace("/agent/activate");
    }
  }, [pathname, router]);

  return (
    <AppShell title="Retailer" allowedTypes={["RETAILER"]} nav={PENDING_NAV}>
      {children}
    </AppShell>
  );
}

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
    <AppShell title="Retailer" allowedTypes={["RETAILER"]} nav={nav} mobileNav={mobileNav}>
      {children}
    </AppShell>
  );
}

export function AgentConsoleShell({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.user?.status);
  if (retailerAwaitingActivation("RETAILER", status)) {
    return <PendingActivationGate>{children}</PendingActivationGate>;
  }
  return (
    <DeskServicesProvider>
      <AgentConsoleNav>{children}</AgentConsoleNav>
    </DeskServicesProvider>
  );
}
