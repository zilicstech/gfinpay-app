"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NeonSpinner } from "@/components/ui/GlobalLoader";
import { api, apiForm } from "@/lib/api-client";
import { logoutSession } from "@/lib/auth-client";
import {
  homeFor,
  partnerNeedsReverification,
  useSession,
  useSessionHydrated,
} from "@/stores/session.store";
import {
  OnboardingWizardView,
  type OnboardingApiAdapter,
  type OnboardingJourneyState,
} from "@/features/onboarding/OnboardingSteps";

export default function ReverifyPage() {
  const router = useRouter();
  const { token, user, profileLoaded, bootstrapped, clear } = useSession();
  const hydrated = useSessionHydrated();

  useEffect(() => {
    if (hydrated && bootstrapped && !token) {
      router.replace("/login");
      return;
    }
    if (
      hydrated &&
      bootstrapped &&
      token &&
      profileLoaded &&
      user &&
      !partnerNeedsReverification(user)
    ) {
      router.replace(homeFor(user.userType));
    }
  }, [bootstrapped, hydrated, profileLoaded, router, token, user]);

  const adapter = useMemo<OnboardingApiAdapter>(() => {
    const loadState = () =>
      api<OnboardingJourneyState>("/api/v1/reverify/status", { token });

    return {
      loadState,
      sendOtp: () =>
        api<{ maskedMobile?: string; expiresAt?: string; cooldownSeconds?: number }>(
          "/api/v1/reverify/otp",
          {
            token,
            method: "POST",
            body: "{}",
          },
        ),
      verifyOtp: async (otp) => {
        await api("/api/v1/reverify/otp/verify", {
          token,
          method: "POST",
          body: JSON.stringify({ otp }),
        });
        return loadState();
      },
      saveLocation: async (loc) => {
        await api("/api/v1/reverify/location", {
          token,
          method: "POST",
          body: JSON.stringify(loc),
        });
        return loadState();
      },
      startDigilocker: () =>
        api<{
          token: string;
          gateway: string;
          expiresAt: string;
          state: string;
          alreadyCompleted?: boolean;
        }>("/api/v1/reverify/digilocker/start", {
          token,
          method: "POST",
          body: "{}",
        }),
      completeDigilocker: async (payload) => {
        await api("/api/v1/reverify/digilocker/complete", {
          token,
          method: "POST",
          body: JSON.stringify(payload),
        });
        return loadState();
      },
      verifyPan: async (pan, file, aadhaar) => {
        if (file) {
          const form = new FormData();
          form.set("pan", pan);
          if (aadhaar) form.set("aadhaar", aadhaar);
          const filename = file instanceof File && file.name ? file.name : "pan.jpg";
          form.set("file", file, filename);
          await apiForm("/api/v1/reverify/pan", form, { token });
        } else {
          await api("/api/v1/reverify/pan", {
            token,
            method: "POST",
            body: JSON.stringify({ pan, ...(aadhaar ? { aadhaar } : {}) }),
          });
        }
        return loadState();
      },
      verifySelfie: async (blob) => {
        const form = new FormData();
        form.set("file", blob, "selfie.jpg");
        await apiForm("/api/v1/reverify/selfie", form, { token });
        return loadState();
      },
      completeCredentials: async (payload) => {
        const current = await loadState();
        await api("/api/v1/reverify/pin", {
          token,
          method: "POST",
          body: JSON.stringify({
            pin: payload.pin,
            newPassword: payload.password,
          }),
        });
        return {
          ...current,
          status: "COMPLETED",
          journeyStatus: "COMPLETED",
          completed: true,
        };
      },
    };
  }, [token]);

  if (!hydrated || !bootstrapped || !token) {
    return (
      <div className="grid min-h-screen place-items-center bg-black">
        <NeonSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:px-6">
          <Logo compact />
          <button
            type="button"
            onClick={async () => {
              await logoutSession();
              clear();
              router.replace("/login");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-navy-950"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="py-4 sm:py-6">
        <OnboardingWizardView
          adapter={adapter}
          mode="REVERIFY"
          onCompleted={() => {
            clear();
            router.replace("/login");
          }}
        />
      </main>
    </div>
  );
}

