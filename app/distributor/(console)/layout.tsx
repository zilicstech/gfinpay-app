"use client";

import { useMemo, type ReactNode } from "react";
import { AppShell } from "@/features/shell/AppShell";
import { DeskServicesProvider, useDeskServices } from "@/features/desk/DeskServices";
import { FALLBACK_DISTRIBUTOR_NAV, buildDistributorNav } from "@/features/desk/retailer-services";

function DistributorConsoleNav({ children }: { children: ReactNode }) {
  const { ready, codes, fdProviders } = useDeskServices();
  const nav = useMemo(
    () => (ready ? buildDistributorNav(codes, fdProviders) : FALLBACK_DISTRIBUTOR_NAV),
    [codes, fdProviders, ready],
  );

  return (
    <AppShell title="Distributor" allowedTypes={["MASTER_DISTRIBUTOR"]} loginHref="/login" nav={nav}>
      {children}
    </AppShell>
  );
}

export default function DistributorLayout({ children }: { children: ReactNode }) {
  return (
    <DeskServicesProvider>
      <DistributorConsoleNav>{children}</DistributorConsoleNav>
    </DeskServicesProvider>
  );
}
