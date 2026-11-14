"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { DeskServicesProvider, useDeskServices } from "@/features/desk/DeskServices";
import { partnerNeedsReverification, retailerAwaitingActivation, useSession } from "@/stores/session.store";
import {
  FALLBACK_AGENT_NAV,
  buildAgentMobileNav,
  buildAgentNav,
} from "@/features/desk/retailer-services";

const PENDING_NAV = [{ href: "/agent/activate", label: "Activation" }];

function PendingActivationGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const allowed = pathname === "/agent/activate" || pathname === "/agent/profile";

  useEffect(() => {
    if (!allowed) router.replace("/agent/activate");
  }, [allowed, router]);

  return (
    <AppShell title="Retailer" allowedTypes={["RETAILER"]} nav={PENDING_NAV}>
      {allowed ? children : <div className="card h-48 animate-pulse bg-[#f5f5f5]" />}
    </AppShell>
  );
}

function AgentConsoleNav({ children }: { children: ReactNode }) {
  const { ready, codes, fdProviders, access } = useDeskServices();

  const nav = useMemo(
    () => (ready ? buildAgentNav(codes, fdProviders, access) : FALLBACK_AGENT_NAV),
    [codes, fdProviders, access, ready],
  );

  const mobileNav = useMemo(
    () => (ready ? buildAgentMobileNav(codes, fdProviders, access) : buildAgentMobileNav(new Set(), [])),
    [codes, fdProviders, access, ready],
  );

  return (
    <AppShell title="Retailer" allowedTypes={["RETAILER"]} nav={nav} mobileNav={mobileNav}>
      {children}
    </AppShell>
  );
}

export function AgentConsoleShell({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user);
  const router = useRouter();
  const needsReverify = partnerNeedsReverification(user);

  useEffect(() => {
    if (needsReverify) {
      router.replace("/reverify");
    }
  }, [needsReverify, router]);

  if (needsReverify) {
    return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;
  }
  if (retailerAwaitingActivation("RETAILER", user?.status)) {
    return <PendingActivationGate>{children}</PendingActivationGate>;
  }
  return (
    <DeskServicesProvider>
      <AgentConsoleNav>{children}</AgentConsoleNav>
    </DeskServicesProvider>
  );
}
