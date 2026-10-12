"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api-client";

export type SessionUser = {
  id?: string;
  fullName: string;
  userType: "SUPER_ADMIN" | "ADMIN" | "HUBADMIN" | "MASTER_DISTRIBUTOR" | "RETAILER" | "AUDITOR" | string;
  code?: string;
  mobile?: string;
  email?: string | null;
  shopName?: string | null;
  kycStatus?: string | null;
  status?: string;
  permissions: string[];
};

export type MeProfile = {
  id?: string;
  fullName?: string;
  full_name?: string;
  userType?: string;
  user_type?: string;
  code?: string;
  mobile?: string;
  email?: string | null;
  shopName?: string | null;
  shop_name?: string | null;
  kycStatus?: string | null;
  kyc_status?: string | null;
  status?: string;
  permissions?: string[];
};

type SessionState = {
  token: string | null;
  role: string | null;
  expiresAt: string | null;
  user: SessionUser | null;
  profileLoaded: boolean;
  /** True once the silent refresh on page load has settled. Guards must wait for this. */
  bootstrapped: boolean;
  setAuth: (token: string, role: string, expiresAt: string) => void;
  setToken: (token: string, role: string, expiresAt: string) => void;
  setBootstrapped: () => void;
  setProfile: (user: SessionUser) => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  loadProfile: () => Promise<SessionUser>;
  clear: () => void;
};

export function mapMeProfile(profile: MeProfile): SessionUser {
  return {
    id: profile.id,
    fullName: profile.fullName ?? profile.full_name ?? "",
    userType: profile.userType ?? profile.user_type ?? "",
    code: profile.code ?? "",
    mobile: profile.mobile,
    email: profile.email ?? null,
    shopName: profile.shopName ?? profile.shop_name ?? null,
    kycStatus: profile.kycStatus ?? profile.kyc_status ?? null,
    status: profile.status,
    permissions: profile.permissions ?? [],
  };
}

let sessionStorageHydrated = typeof window === "undefined";
const sessionHydrationWaiters = new Set<() => void>();

function markSessionHydrated() {
  if (sessionStorageHydrated) return;
  sessionStorageHydrated = true;
  sessionHydrationWaiters.forEach((fn) => fn());
  sessionHydrationWaiters.clear();
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      expiresAt: null,
      user: null,
      profileLoaded: false,
      bootstrapped: false,
      setAuth: (token, role, expiresAt) =>
        set({
          token,
          role,
          expiresAt,
          user: { fullName: "", userType: role, permissions: [] },
          profileLoaded: false,
          bootstrapped: true,
        }),
      // Token rotation only: keeps the loaded profile so a refresh never blanks the shell.
      setToken: (token, role, expiresAt) =>
        set((s) => ({
          token,
          role,
          expiresAt,
          user: s.user ? { ...s.user, userType: role || s.user.userType } : { fullName: "", userType: role, permissions: [] },
          bootstrapped: true,
        })),
      setBootstrapped: () => set({ bootstrapped: true }),
      setProfile: (user) => set({ user, role: user.userType, profileLoaded: true }),
      updateUser: (patch) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...patch } : null,
          role: patch.userType ?? s.role,
        })),
      loadProfile: async () => {
        const token = get().token;
        if (!token) {
          throw new Error("Not signed in");
        }
        const profile = await api<MeProfile>("/api/v1/me", { token });
        const user = mapMeProfile(profile);
        set({ user, role: user.userType || get().role, profileLoaded: true });
        return user;
      },
      clear: () =>
        set({ token: null, role: null, expiresAt: null, user: null, profileLoaded: false, bootstrapped: true }),
    }),
    {
      name: "fintech-session",
      version: 4,
      // The access token is deliberately absent: it lives in memory only and is
      // restored on page load from the httpOnly refresh cookie.
      partialize: (s) => ({ role: s.role, user: s.user }),
      onRehydrateStorage: () => () => {
        markSessionHydrated();
      },
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as {
          role?: string | null;
          user?: SessionUser & { id?: string };
        };
        let user = state.user;
        if (version < 2 && user && "id" in user) {
          const { id: _id, ...rest } = user;
          user = rest;
        }
        // Any token persisted by v3 or earlier is dropped on purpose.
        return {
          role: state.role ?? user?.userType ?? null,
          user: user ?? null,
        };
      },
    },
  ),
);

const AWAITING_ACTIVATION = new Set([
  "PENDING",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PENDING_ACTIVATION",
  "PENDING_KYC",
]);

export function retailerAwaitingActivation(userType?: string, status?: string) {
  return userType === "RETAILER" && !!status && AWAITING_ACTIVATION.has(status);
}

export function homeFor(userType?: string, status?: string): string {
  if (userType === "SUPER_ADMIN" || userType === "ADMIN" || userType === "HUBADMIN") return "/admin/analytics";
  if (userType === "MASTER_DISTRIBUTOR") return "/distributor/overview";
  if (userType === "AUDITOR") return "/auditor/overview";
  if (retailerAwaitingActivation(userType, status)) return "/agent/activate";
  return "/agent/dashboard";
}

/** Where a signed-out user lands: the public marketing home page. */
export const HOME_PATH = "/";

export function homePathFor(reason?: "idle"): string {
  return reason ? `${HOME_PATH}?signedOut=${reason}` : HOME_PATH;
}

/**
 * True when this browser looks like it had a session before. Used to decide whether a
 * silent refresh is worth attempting, so anonymous marketing traffic makes no API call.
 */
export function hasSessionHint(): boolean {
  const { token, user, role } = useSession.getState();
  return Boolean(token || user || role);
}

export function profilePathFor(userType?: string): string {
  if (userType === "SUPER_ADMIN" || userType === "ADMIN" || userType === "HUBADMIN") return "/admin/profile";
  if (userType === "MASTER_DISTRIBUTOR") return "/distributor/profile";
  if (userType === "AUDITOR") return "/auditor/profile";
  return "/agent/profile";
}

export function roleLabel(userType?: string): string {
  if (userType === "SUPER_ADMIN") return "Super Admin";
  if (userType === "ADMIN") return "Platform Admin";
  if (userType === "HUBADMIN") return "Hub Admin";
  if (userType === "MASTER_DISTRIBUTOR") return "Distributor";
  if (userType === "RETAILER") return "Retailer";
  if (userType === "AUDITOR") return "Auditor";
  return userType?.replaceAll("_", " ") ?? "";
}

export function isSuperAdmin(userType?: string): boolean {
  return userType === "SUPER_ADMIN";
}

export function isPlatformAdmin(userType?: string): boolean {
  return userType === "ADMIN";
}

export function isSuperAdminOrPlatformAdmin(userType?: string): boolean {
  return isSuperAdmin(userType) || isPlatformAdmin(userType);
}

export function isHubAdmin(userType?: string): boolean {
  return userType === "HUBADMIN";
}

export function isSessionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const ms = Date.parse(expiresAt);
  return Number.isFinite(ms) && Date.now() >= ms;
}

export function useSessionHydrated() {
  const [hydrated, setHydrated] = useState(sessionStorageHydrated);
  useEffect(() => {
    if (sessionStorageHydrated) {
      setHydrated(true);
      return;
    }
    const done = () => setHydrated(true);
    sessionHydrationWaiters.add(done);
    const persistApi = (useSession as typeof useSession & {
      persist?: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
    }).persist;
    if (!persistApi) {
      markSessionHydrated();
      setHydrated(true);
      sessionHydrationWaiters.delete(done);
      return () => sessionHydrationWaiters.delete(done);
    }
    if (persistApi.hasHydrated()) {
      markSessionHydrated();
      setHydrated(true);
      sessionHydrationWaiters.delete(done);
      return () => sessionHydrationWaiters.delete(done);
    }
    const unsubPersist = persistApi?.onFinishHydration(() => {
      markSessionHydrated();
      setHydrated(true);
    });
    return () => {
      sessionHydrationWaiters.delete(done);
      unsubPersist?.();
    };
  }, []);
  return hydrated;
}
