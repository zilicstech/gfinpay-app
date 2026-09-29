"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import {
  enabledCodes,
  fdCardsEnabled,
  type FdProviderRow,
  type PlatformServiceRow,
} from "@/features/desk/retailer-services";

type DeskServicesState = {
  ready: boolean;
  services: PlatformServiceRow[];
  fdProviders: FdProviderRow[];
  codes: Set<string>;
};

const DeskServicesContext = createContext<DeskServicesState | null>(null);

export function DeskServicesProvider({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token);
  const [services, setServices] = useState<PlatformServiceRow[] | null>(null);
  const [fdProviders, setFdProviders] = useState<FdProviderRow[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      api<PlatformServiceRow[]>("/api/v1/desk/platform-services", { token }),
      api<FdProviderRow[]>("/api/v1/desk/fd-providers", { token }),
    ])
      .then(([s, fd]) => {
        if (cancelled) return;
        setServices(Array.isArray(s) ? s : []);
        setFdProviders(Array.isArray(fd) ? fd : []);
      })
      .catch(() => {
        if (cancelled) return;
        setServices([]);
        setFdProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<DeskServicesState>(() => {
    const svc = services ?? [];
    const fd = fdProviders ?? [];
    return {
      ready: services != null && fdProviders != null,
      services: svc,
      fdProviders: fd,
      codes: enabledCodes(svc),
    };
  }, [services, fdProviders]);

  return <DeskServicesContext.Provider value={value}>{children}</DeskServicesContext.Provider>;
}

export function useDeskServices() {
  const ctx = useContext(DeskServicesContext);
  if (!ctx) {
    throw new Error("useDeskServices must be used within DeskServicesProvider");
  }
  return ctx;
}

export function RequireDeskService({
  anyOf,
  allowFd,
  fallbackHref,
  children,
}: {
  anyOf?: string[];
  allowFd?: boolean;
  fallbackHref: string;
  children: ReactNode;
}) {
  const { ready, codes, fdProviders } = useDeskServices();
  const router = useRouter();
  const allowed =
    (anyOf ?? []).some((code) => codes.has(code)) || (allowFd === true && fdCardsEnabled(fdProviders));

  useEffect(() => {
    if (ready && !allowed) router.replace(fallbackHref);
  }, [allowed, fallbackHref, ready, router]);

  if (!ready) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;
  if (!allowed) return null;
  return <>{children}</>;
}

export function RequireCustomerDesk({
  fallbackHref,
  children,
}: {
  fallbackHref: string;
  children: ReactNode;
}) {
  return (
    <RequireDeskService anyOf={["LEAD_GEN"]} allowFd fallbackHref={fallbackHref}>
      {children}
    </RequireDeskService>
  );
}
