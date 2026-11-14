"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import {
  enabledCodes,
  fdCardsEnabled,
  type FdProviderRow,
  type PlatformServiceRow,
  type ServiceAccess,
} from "@/features/desk/retailer-services";

export type OpaqueBiometricChannel = {
  channelKey: string;
  terminalLabel: string;
  biometricVerified: boolean;
  status: "ACTIVE" | "BIOMETRIC_REQUIRED" | string;
  biometricVerifiedAt?: string | null;
  bankReady?: boolean;
};

export type CashActivationState = {
  servicesUnlocked: boolean;
  businessVerified: boolean;
  agreementSigned: boolean;
  terminalProvisioned: boolean;
  biometricRequired: boolean;
  additionalBiometricAvailable: boolean;
  biometricVerified: boolean;
  cashServicesActive: boolean;
  upiCashoutActive: boolean;
  aepsActive: boolean;
  payoutBankReady: boolean;
  hasFullAadhaar: boolean;
  aadhaarLast4?: string;
  pendingChannelKey?: string | null;
  rdEnv?: string;
  allowPastedPid?: boolean;
  channels: OpaqueBiometricChannel[];
};

type DeskServicesState = {
  ready: boolean;
  services: PlatformServiceRow[];
  fdProviders: FdProviderRow[];
  codes: Set<string>;
  access: ServiceAccess;
  cashActivation: CashActivationState | null;
  refreshCashActivation: (liveRefresh?: boolean) => Promise<CashActivationState | null>;
};

const DeskServicesContext = createContext<DeskServicesState | null>(null);

export function DeskServicesProvider({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token);
  const [services, setServices] = useState<PlatformServiceRow[] | null>(null);
  const [fdProviders, setFdProviders] = useState<FdProviderRow[] | null>(null);
  const [cashActivation, setCashActivation] = useState<CashActivationState | null>(null);
  const [access, setAccess] = useState<ServiceAccess>({
    personal: false,
    business: false,
    identity: false,
    bank: false,
  });

  const refreshCashActivation = useCallback(
    async (liveRefresh = true): Promise<CashActivationState | null> => {
      if (!token) return null;
      try {
        const next = await api<CashActivationState>(
          `/api/v1/me/cash-activation?refresh=${liveRefresh ? "true" : "false"}`,
          { token, silent: true },
        );
        setCashActivation(next);
        return next;
      } catch {
        return null;
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      api<PlatformServiceRow[]>("/api/v1/desk/platform-services", { token, silent: true }),
      api<FdProviderRow[]>("/api/v1/desk/fd-providers", { token, silent: true }),
      api<{
        personalStatus?: string;
        identityStatus?: string;
        bankVerificationStatus?: string;
        businessStatus?: string;
        agreementStatus?: string;
        servicesUnlocked?: boolean;
      }>("/api/v1/verification", { token, silent: true }).catch(() => null),
      api<CashActivationState>("/api/v1/me/cash-activation?refresh=true", { token, silent: true }).catch(() => null),
    ])
      .then(([s, fd, verification, activation]) => {
        if (cancelled) return;
        setServices(Array.isArray(s) ? s : []);
        setFdProviders(Array.isArray(fd) ? fd : []);
        if (activation) {
          setCashActivation(activation);
        }
        const identityOk =
          verification?.identityStatus === "VERIFIED" ||
          verification?.personalStatus === "PERSONAL_VERIFIED";
        const businessAndAgreementOk =
          verification?.servicesUnlocked === true ||
          (verification?.businessStatus === "BUSINESS_VERIFIED" &&
            verification?.agreementStatus === "SIGNED");
        setAccess({
          personal: identityOk,
          identity: identityOk,
          bank: verification?.bankVerificationStatus === "VERIFIED",
          business: businessAndAgreementOk,
        });
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

  useEffect(() => {
    function refresh() {
      if (!token) return;
      api<{
        personalStatus?: string;
        identityStatus?: string;
        bankVerificationStatus?: string;
        businessStatus?: string;
        agreementStatus?: string;
        servicesUnlocked?: boolean;
      }>("/api/v1/verification", { token, silent: true })
        .then((verification) => {
          const identityOk =
            verification?.identityStatus === "VERIFIED" ||
            verification?.personalStatus === "PERSONAL_VERIFIED";
          const businessAndAgreementOk =
            verification?.servicesUnlocked === true ||
            (verification?.businessStatus === "BUSINESS_VERIFIED" &&
              verification?.agreementStatus === "SIGNED");
          setAccess({
            personal: identityOk,
            identity: identityOk,
            bank: verification?.bankVerificationStatus === "VERIFIED",
            business: businessAndAgreementOk,
          });
        })
        .catch(() => undefined);
      refreshCashActivation(true).catch(() => undefined);
    }

    function onBiometricUpdated() {
      refreshCashActivation(true).catch(() => undefined);
    }

    window.addEventListener("gfin-verification-updated", refresh);
    window.addEventListener("gfin-biometric-updated", onBiometricUpdated);
    return () => {
      window.removeEventListener("gfin-verification-updated", refresh);
      window.removeEventListener("gfin-biometric-updated", onBiometricUpdated);
    };
  }, [token, refreshCashActivation]);

  const value = useMemo<DeskServicesState>(() => {
    const svc = services ?? [];
    const fd = fdProviders ?? [];
    return {
      ready: services != null && fdProviders != null,
      services: svc,
      fdProviders: fd,
      codes: enabledCodes(svc),
      access,
      cashActivation,
      refreshCashActivation,
    };
  }, [services, fdProviders, access, cashActivation, refreshCashActivation]);

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
    <RequireDeskService
      anyOf={["HOSPI_CASH", "LEAD_GEN", "CREDIT_CARD", "INSTANT_LOAN", "PERSONAL_LOAN", "BUSINESS_LOAN", "SAVINGS"]}
      allowFd
      fallbackHref={fallbackHref}
    >
      {children}
    </RequireDeskService>
  );
}
