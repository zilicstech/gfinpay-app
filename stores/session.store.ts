"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api-client";

export type SessionUser = {
  fullName: string;
  userType: "SUPER_ADMIN" | "ADMIN" | "MASTER_DISTRIBUTOR" | "RETAILER" | string;
  code?: string;
  mobile?: string;
  email?: string | null;
  shopName?: string | null;
  kycStatus?: string | null;
  status?: string;
  permissions: string[];
};

export type MeProfile = {
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
  setAuth: (token: string, role: string, expiresAt: string) => void;
  setProfile: (user: SessionUser) => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  loadProfile: () => Promise<SessionUser>;
  clear: () => void;
};

export function mapMeProfile(profile: MeProfile): SessionUser {
  return {
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
      setAuth: (token, role, expiresAt) =>
        set({
          token,
          role,
          expiresAt,
          user: { fullName: "", userType: role, permissions: [] },
          profileLoaded: false,
        }),
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
      clear: () => set({ token: null, role: null, expiresAt: null, user: null, profileLoaded: false }),
    }),
    {
      name: "fintech-session",
      version: 3,
      partialize: (s) => ({ token: s.token, role: s.role, expiresAt: s.expiresAt, user: s.user }),
      onRehydrateStorage: () => () => {
        markSessionHydrated();
      },
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as {
          token?: string | null;
          role?: string | null;
          expiresAt?: string | null;
          user?: SessionUser & { id?: string };
        };
        let user = state.user;
        if (version < 2 && user && "id" in user) {
          const { id: _id, ...rest } = user;
          user = rest;
        }
        return {
          token: state.token ?? null,
          role: state.role ?? user?.userType ?? null,
          expiresAt: version >= 3 ? (state.expiresAt ?? null) : null,
          user: user ?? null,
        };
      },
    },
  ),
);

export function homeFor(userType?: string): string {
  if (userType === "SUPER_ADMIN") return "/admin/analytics";
  if (userType === "ADMIN") return "/admin/overview";
  if (userType === "MASTER_DISTRIBUTOR") return "/distributor/overview";
  return "/agent/dashboard";
}

export function loginPathFor(_userType?: string): string {
  return "/login";
}

export function profilePathFor(userType?: string): string {
  if (userType === "SUPER_ADMIN" || userType === "ADMIN") return "/admin/profile";
  if (userType === "MASTER_DISTRIBUTOR") return "/distributor/profile";
  return "/agent/profile";
}

export function roleLabel(userType?: string): string {
  if (userType === "SUPER_ADMIN") return "Super admin";
  if (userType === "ADMIN") return "Admin";
  if (userType === "MASTER_DISTRIBUTOR") return "Distributor";
  if (userType === "RETAILER") return "Retailer";
  return userType?.replaceAll("_", " ") ?? "";
}

export function isSuperAdmin(userType?: string): boolean {
  return userType === "SUPER_ADMIN";
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
