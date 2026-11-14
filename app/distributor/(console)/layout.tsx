"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { DeskServicesProvider, useDeskServices } from "@/features/desk/DeskServices";
import { partnerAwaitingActivation, partnerNeedsReverification, useSession } from "@/stores/session.store";
import { FALLBACK_DISTRIBUTOR_NAV, buildDistributorNav } from "@/features/desk/retailer-services";

const PENDING_DISTRIBUTOR_NAV = [{ href: "/distributor/activate", label: "Activation" }];

function PendingDistributorActivationGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const allowed = pathname === "/distributor/activate" || pathname === "/distributor/profile";

  useEffect(() => {
    if (!allowed) router.replace("/distributor/activate");
  }, [allowed, router]);

  return (
    <AppShell title="Distributor" allowedTypes={["MASTER_DISTRIBUTOR"]} nav={PENDING_DISTRIBUTOR_NAV}>
      {allowed ? children : <div className="card h-48 animate-pulse bg-[#f5f5f5]" />}
    </AppShell>
  );
}

function DistributorConsoleNav({ children }: { children: ReactNode }) {
  const { ready, codes, fdProviders } = useDeskServices();
  const nav = useMemo(
    () => (ready ? buildDistributorNav(codes, fdProviders) : FALLBACK_DISTRIBUTOR_NAV),
    [codes, fdProviders, ready],
  );

  return (
    <AppShell title="Distributor" allowedTypes={["MASTER_DISTRIBUTOR"]} nav={nav}>
      {children}
    </AppShell>
  );
}

export default function DistributorLayout({ children }: { children: ReactNode }) {
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

  if (partnerAwaitingActivation("MASTER_DISTRIBUTOR", user?.status)) {
    return <PendingDistributorActivationGate>{children}</PendingDistributorActivationGate>;
  }

  return (
    <DeskServicesProvider>
      <DistributorConsoleNav>{children}</DistributorConsoleNav>
    </DeskServicesProvider>
  );
}
