"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Lock } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import { BiometricActivationCard } from "@/features/ekyc/BiometricActivationCard";
import type { CashActivationState } from "@/features/desk/DeskServices";

export default function AgentBiometricKycPage() {
  const token = useSession((s) => s.token);
  const [activation, setActivation] = useState<CashActivationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<CashActivationState>("/api/v1/me/cash-activation?refresh=true", { token })
      .then(setActivation)
      .catch((e) => setError(formatApiError(e, "Could not load biometric verification status")));
  }, [token]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!activation) return <div className="card h-56 animate-pulse bg-[#f5f5f5]" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">
          Merchant Biometric Verification
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Complete one-time Aadhaar fingerprint verification to activate UPI Cashout, AePS, and Settlement Payouts.
        </p>
      </div>

      {!activation.servicesUnlocked ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900 font-bold">
            <Lock className="h-5 w-5 text-amber-700" />
            Complete Business Verification &amp; Master Service Agreement First
          </div>
          <p className="text-xs text-amber-900/80">
            Biometric terminal activation unlocks once your Business Registration is approved and your Partner Agreement is signed.
          </p>
          <Link href="/agent/profile?tab=business" className="btn-primary inline-flex items-center gap-1.5 text-xs">
            Go to Business &amp; Agreement
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : !activation.terminalProvisioned ? (
        <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 space-y-2">
          <div className="flex items-center gap-2.5 text-sky-950 font-bold">
            <Clock className="h-5 w-5 text-sky-700" />
            Merchant Banking Terminal Provisioning in Progress
          </div>
          <p className="text-xs text-sky-900/80">
            Your Business &amp; Agreement are verified. Our compliance team is activating your merchant terminal — once enabled, you can complete your fingerprint scan right here.
          </p>
        </div>
      ) : (
        <>
          <BiometricActivationCard activation={activation} onActivated={setActivation} />
          {activation.cashServicesActive && (
            <div className="flex justify-end">
              <Link href="/agent/cash" className="btn-primary inline-flex items-center gap-2 text-xs">
                Open Cash Desk (UPI Cashout &amp; AePS)
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
