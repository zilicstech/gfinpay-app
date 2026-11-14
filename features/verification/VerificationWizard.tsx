"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, MapPin } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import {
  BusinessRegistration,
  VerificationState,
  extractPermanentAddress,
} from "./BusinessRegistration";
import { AgreementPanel } from "@/features/agreement/AgreementPanel";
import { RetailerBanksDesk } from "@/features/finance/RetailerBanksDesk";

export function VerificationWizard() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const [state, setState] = useState<VerificationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVerification = useCallback(
    (silent = false) => {
      if (!token) return;
      api<VerificationState>("/api/v1/verification", { token, silent })
        .then((row) => setState(row))
        .catch((e) => {
          if (!silent) setError(formatApiError(e, "Could not load verification"));
        });
    },
    [token],
  );

  const handleSignedChange = useCallback(() => {
    loadVerification(true);
  }, [loadVerification]);

  useEffect(() => {
    loadVerification(false);
  }, [loadVerification]);

  const personalDone = state?.identityStatus === "VERIFIED" || state?.personalStatus === "PERSONAL_VERIFIED";
  const businessDone = state?.businessStatus === "BUSINESS_VERIFIED" || Boolean(state?.businessVerified);
  const agreementSigned = state?.agreementStatus === "SIGNED";
  const servicesUnlocked = Boolean(state?.servicesUnlocked || (businessDone && agreementSigned));
  const identityData = (state?.identity ?? state?.personal ?? {}) as Record<string, unknown>;
  const permAddr = extractPermanentAddress(state);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-950">Verification &amp; Partner Agreement</h1>
        <p className="mt-1 text-sm text-slate-500">
          Identity KYC unlocks FD Card, BBPS, and Hospi Cash. Business Verified + Signed Master Service Agreement + Bank Verified unlocks Cash-out, DMT, Payout, and Withdrawals.
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {servicesUnlocked ? (
        <Alert tone="success">
          Business Verified &amp; Master Service Agreement Signed. All counter and settlement services are unlocked.
        </Alert>
      ) : businessDone ? (
        <Alert tone="info">
          Business Registration is verified. Please sign your Master Service Agreement below to activate UPI, AEPS, DMT, and Payout services.
        </Alert>
      ) : null}

      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
              Verified Identity KYC
              {personalDone && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
            </h2>
            <p className="text-xs text-slate-500">
              Verified via Surepass DigiBoost DigiLocker (Aadhaar &amp; PAN), PAN Comprehensive, and Live Camera Selfie.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Full Name</span>
            <span className="font-semibold text-navy-950 mt-0.5 block">
              {String(identityData.fullName || user?.fullName || "—")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Masked Aadhaar</span>
            <span className="font-mono font-semibold text-navy-950 mt-0.5 block">
              {state?.aadhaarLast4 || identityData.aadhaarLast4
                ? `•••• ${String(state?.aadhaarLast4 || identityData.aadhaarLast4)}`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">PAN Last 4</span>
            <span className="font-mono font-semibold text-navy-950 mt-0.5 block">
              {state?.panLast4 || identityData.panLast4
                ? `••••••${String(state?.panLast4 || identityData.panLast4)}`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Face Verification</span>
            <span className="font-semibold text-navy-950 mt-0.5 block">
              {state?.faceReviewStatus === "MATCHED"
                ? "Verified by Admin"
                : state?.faceReviewStatus === "MISMATCH"
                  ? "Mismatch — Re-verify"
                  : "Pending Admin Review"}
            </span>
          </div>
        </div>

        {permAddr.fullAddress && (
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-800 text-[10px]">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Permanent Address (Verified from Aadhaar DigiLocker)
            </div>
            <p className="text-slate-800 font-medium">{permAddr.fullAddress}</p>
            <p className="text-slate-500 text-[11px]">
              {[permAddr.vtc || permAddr.district, permAddr.state, permAddr.pincode].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
      </div>

      <BusinessRegistration state={state} onUpdated={setState} />

      <AgreementPanel
        businessStatus={state?.businessStatus}
        onSignedChange={handleSignedChange}
      />

      <div className="card p-6">
        <RetailerBanksDesk embedded />
      </div>
    </div>
  );
}
