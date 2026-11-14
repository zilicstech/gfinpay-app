"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { api, apiForm } from "@/lib/api-client";
import {
  OnboardingWizardView,
  type OnboardingApiAdapter,
  type OnboardingJourneyState,
} from "@/features/onboarding/OnboardingSteps";

const SESSION_KEY_PREFIX = "gfin-onboard-session:";

function readSessionToken(inviteToken: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(SESSION_KEY_PREFIX + inviteToken);
  } catch {
    return null;
  }
}

function writeSessionToken(inviteToken: string, sessionToken: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (sessionToken) {
      window.sessionStorage.setItem(SESSION_KEY_PREFIX + inviteToken, sessionToken);
    } else {
      window.sessionStorage.removeItem(SESSION_KEY_PREFIX + inviteToken);
    }
  } catch {
    /* ignore */
  }
}

export default function PublicOnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const adapter = useMemo<OnboardingApiAdapter>(() => {
    const sessionHeaders = (): Record<string, string> => {
      const s = readSessionToken(token);
      return s ? { "X-Onboarding-Session": s } : {};
    };

    const loadState = async (): Promise<OnboardingJourneyState> => {
      const raw = await api<OnboardingJourneyState>(`/api/v1/public/onboarding/${token}`);
      const hasLocalSession = Boolean(readSessionToken(token));
      return {
        ...raw,
        requiresSessionOtp: Boolean(raw.identity?.phoneVerified && !hasLocalSession && raw.status !== "COMPLETED"),
      };
    };

    return {
      loadState,
      sendOtp: () =>
        api<{ maskedMobile?: string; expiresAt?: string; cooldownSeconds?: number }>(
          `/api/v1/public/onboarding/${token}/otp`,
          {
            method: "POST",
            body: "{}",
          },
        ),
      verifyOtp: async (otp) => {
        const res = await api<{ sessionToken: string }>(`/api/v1/public/onboarding/${token}/otp/verify`, {
          method: "POST",
          body: JSON.stringify({ otp }),
        });
        writeSessionToken(token, res.sessionToken);
        return loadState();
      },
      saveLocation: async (loc) => {
        await api(`/api/v1/public/onboarding/session/location`, {
          method: "POST",
          headers: sessionHeaders(),
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
        }>(`/api/v1/public/onboarding/session/digilocker/start`, {
          method: "POST",
          headers: sessionHeaders(),
          body: "{}",
        }),
      completeDigilocker: async (payload) => {
        await api(`/api/v1/public/onboarding/session/digilocker/complete`, {
          method: "POST",
          headers: sessionHeaders(),
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
          await apiForm(`/api/v1/public/onboarding/session/pan`, form, {
            headers: sessionHeaders(),
          });
        } else {
          await api(`/api/v1/public/onboarding/session/pan`, {
            method: "POST",
            headers: sessionHeaders(),
            body: JSON.stringify({ pan, ...(aadhaar ? { aadhaar } : {}) }),
          });
        }
        return loadState();
      },
      verifySelfie: async (blob) => {
        const form = new FormData();
        form.set("file", blob, "selfie.jpg");
        await apiForm(`/api/v1/public/onboarding/session/selfie`, form, {
          headers: sessionHeaders(),
        });
        return loadState();
      },
      completeCredentials: async (payload) => {
        const res = await api<{ completed: boolean; code?: string }>(
          `/api/v1/public/onboarding/session/credentials`,
          {
            method: "POST",
            headers: sessionHeaders(),
            body: JSON.stringify({
              password: payload.password,
              pin: payload.pin,
            }),
          },
        );
        writeSessionToken(token, null);
        const finalState = await loadState();
        return {
          ...finalState,
          completed: res.completed,
          userCode: res.code ?? null,
        };
      },
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:px-6">
          <Logo compact />
          <span className="text-xs font-semibold text-slate-500">Partner Onboarding</span>
        </div>
      </header>

      <main className="py-4 sm:py-6">
        <OnboardingWizardView
          adapter={adapter}
          mode="PUBLIC_INVITE"
          onCompleted={() => router.replace("/login")}
        />
      </main>
    </div>
  );
}
