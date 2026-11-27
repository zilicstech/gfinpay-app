"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileSignature,
  Fingerprint,
  Landmark,
  Lock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import type { CashActivationState } from "@/features/desk/DeskServices";

type VerificationSummary = {
  personalStatus?: string;
  identityStatus?: string;
  faceReviewStatus?: string;
  businessStatus?: string;
  businessVerified?: boolean;
  businessReviewNote?: string | null;
  agreementStatus?: string;
  bankVerificationStatus?: string;
  servicesUnlocked?: boolean;
  agreementRecord?: {
    id?: string;
    agreementNo?: string;
    status?: string;
    signatoryName?: string;
    signatoryMobileMasked?: string;
    signatoryIsSelf?: boolean;
    esignMode?: "SIGN" | "SHARE" | string;
    esignProviderStatus?: string | null;
    reviewNote?: string | null;
  } | null;
};

type ActionCardItem = {
  key: string;
  stepLabel: string;
  title: string;
  description: string;
  badgeText: string;
  tone: "emerald" | "amber" | "sky" | "rose" | "slate";
  icon: typeof Building2;
  href: string;
  ctaLabel: string;
  locked?: boolean;
};

export function PartnerOnboardingActionCards({
  role = "RETAILER",
}: {
  role?: "RETAILER" | "MASTER_DISTRIBUTOR";
}) {
  const token = useSession((s) => s.token);
  const [state, setState] = useState<VerificationSummary | null>(null);
  const [cashActivation, setCashActivation] = useState<CashActivationState | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    Promise.all([
      api<VerificationSummary>("/api/v1/verification", { token, silent: true }).catch(() => null),
      role === "RETAILER"
        ? api<CashActivationState>("/api/v1/me/cash-activation?refresh=false", { token, silent: true }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([res, activation]) => {
        if (res) setState(res);
        if (activation) setCashActivation(activation);
      })
      .finally(() => setLoaded(true));
  }, [token, role]);

  useEffect(() => {
    load();
    window.addEventListener("gfin-verification-updated", load);
    window.addEventListener("gfin-biometric-updated", load);
    return () => {
      window.removeEventListener("gfin-verification-updated", load);
      window.removeEventListener("gfin-biometric-updated", load);
    };
  }, [load]);

  if (!loaded || !state) return null;

  const isDistributor = role === "MASTER_DISTRIBUTOR";
  const profileBase = isDistributor ? "/distributor/profile" : "/agent/profile";
  const businessHref = `${profileBase}?tab=business`;
  const agreementHref = `${profileBase}?tab=agreement`;
  const bankHref = `${profileBase}?tab=banks`;
  const identityHref = `${profileBase}?tab=personal`;

  const identityDone =
    state.identityStatus === "VERIFIED" || state.personalStatus === "PERSONAL_VERIFIED";
  const businessDone =
    state.businessStatus === "BUSINESS_VERIFIED" || state.businessVerified === true;
  const agreementSigned = state.agreementStatus === "SIGNED";
  const bankDone = state.bankVerificationStatus === "VERIFIED";

  const cards: ActionCardItem[] = [];

  // 0. Identity KYC (only if not yet verified or flagged for re-verification)
  if (!identityDone || state.faceReviewStatus === "MISMATCH") {
    cards.push({
      key: "identity",
      stepLabel: "Identity Verification",
      title:
        state.faceReviewStatus === "MISMATCH"
          ? "Re-verify Your Identity KYC"
          : "Complete Identity KYC",
      description:
        state.faceReviewStatus === "MISMATCH"
          ? "Your selfie verification was flagged for re-verification. Complete your identity check to restore access."
          : "Verify your Aadhaar & PAN via DigiLocker and live selfie to unlock FD Card, BBPS, and Hospi Cash.",
      badgeText: state.faceReviewStatus === "MISMATCH" ? "Re-verify Required" : "Action Required",
      tone: state.faceReviewStatus === "MISMATCH" ? "rose" : "amber",
      icon: UserCheck,
      href: identityHref,
      ctaLabel: "Verify Identity",
    });
  }

  // 1. Business Registration Action Card
  if (!businessDone) {
    if (state.businessStatus === "UNDER_REVIEW") {
      cards.push({
        key: "business",
        stepLabel: "Step 1 · Business Verification",
        title: "Business Registration Under Review",
        description:
          "Your business particulars and authorized signatory details have been submitted. Compliance is reviewing them before generating your agreement.",
        badgeText: "Under Admin Review",
        tone: "sky",
        icon: Clock,
        href: businessHref,
        ctaLabel: "View Business Details",
      });
    } else if (state.businessStatus === "REJECTED") {
      cards.push({
        key: "business",
        stepLabel: "Step 1 · Business Verification",
        title: "Update Business Registration",
        description: state.businessReviewNote
          ? `Rejected by Compliance: "${state.businessReviewNote}". Please update your business details and resubmit.`
          : "Your business registration requires corrections. Update your business details and resubmit for review.",
        badgeText: "Rejected · Action Required",
        tone: "rose",
        icon: AlertTriangle,
        href: businessHref,
        ctaLabel: "Update & Resubmit",
      });
    } else {
      cards.push({
        key: "business",
        stepLabel: "Step 1 · Business Verification",
        title: "Complete Business Registration",
        description:
          "Register as Individual (Work GPS & Shop Address) or Company (MCA CIN & Authorized Signatory KYC) so your Master Service Agreement can be generated.",
        badgeText: "Action Required",
        tone: "amber",
        icon: Building2,
        href: businessHref,
        ctaLabel: "Complete Business Registration",
      });
    }
  }

  // 2. Agreement Signing Action Card
  if (!agreementSigned) {
    const ag = state.agreementRecord;
    const agStatus = ag?.status || state.agreementStatus || "NOT_SIGNED";

    if (agStatus === "RELEASED" || agStatus === "ESIGN_PENDING") {
      const isSelf = ag?.signatoryIsSelf !== false;
      const refText = ag?.agreementNo ? ` (${ag.agreementNo})` : "";
      cards.push({
        key: "agreement",
        stepLabel: "Step 2 · Partner Agreement",
        title:
          agStatus === "ESIGN_PENDING"
            ? `Complete Your Agreement${refText}`
            : `Complete Your Agreement${refText}`,
        description: isSelf
          ? "Your Master Service Agreement has been released! Sign it digitally via Aadhaar eSign or download, sign & upload the PDF to activate UPI, AEPS, DMT & Payouts."
          : `Your Master Service Agreement has been released! Copy & share the Aadhaar eSign link with Authorized Signatory ${ag?.signatoryName || "Director"} or upload the physically signed PDF.`,
        badgeText:
          agStatus === "ESIGN_PENDING"
            ? `eSign Pending (${ag?.esignProviderStatus || "in progress"})`
            : "Agreement Released · Sign Now",
        tone: "emerald",
        icon: FileSignature,
        href: agreementHref,
        ctaLabel:
          agStatus === "ESIGN_PENDING"
            ? "Continue / Check Agreement"
            : isSelf
              ? "Complete Agreement Now"
              : "Share eSign Link / Upload",
      });
    } else if (agStatus === "UNDER_REVIEW") {
      cards.push({
        key: "agreement",
        stepLabel: "Step 2 · Partner Agreement",
        title: "Signed Agreement Under Review",
        description:
          "Your uploaded signed Master Service Agreement is being verified by our compliance team. Your services will activate automatically once approved.",
        badgeText: "Under Compliance Review",
        tone: "sky",
        icon: Clock,
        href: agreementHref,
        ctaLabel: "View Uploaded Agreement",
      });
    } else if (businessDone) {
      cards.push({
        key: "agreement",
        stepLabel: "Step 2 · Partner Agreement",
        title: "Master Service Agreement in Preparation",
        description:
          "Your Business Registration is verified! Compliance is generating and releasing your Master Service Agreement. Once released, you can Aadhaar eSign it here.",
        badgeText: "Awaiting Admin Release",
        tone: "sky",
        icon: FileSignature,
        href: agreementHref,
        ctaLabel: "Check Agreement Status",
      });
    } else {
      cards.push({
        key: "agreement",
        stepLabel: "Step 2 · Partner Agreement",
        title: "Sign Master Service Agreement",
        description:
          "Unlocks once your Business Registration is verified and Admin releases your agreement for Aadhaar eSign or physical upload.",
        badgeText: "Unlocks After Business Verified",
        tone: "slate",
        icon: Lock,
        href: agreementHref,
        ctaLabel: "View Agreement Step",
        locked: true,
      });
    }
  }

  // 3. Bank Verification Action Card
  if (!bankDone) {
    cards.push({
      key: "bank",
      stepLabel: "Step 3 · Settlement Bank",
      title: "Complete Bank Verification",
      description:
        "Add and penny-drop verify your settlement bank account to receive wallet withdrawals, commissions, and payout settlements.",
      badgeText:
        state.bankVerificationStatus === "FAILED"
          ? "Verification Failed · Retry"
          : "Action Required",
      tone: state.bankVerificationStatus === "FAILED" ? "rose" : "amber",
      icon: Landmark,
      href: bankHref,
      ctaLabel: "Verify Bank Account",
    });
  }

  // 4. White-Label Biometric KYC Action Card (Retailer only, once terminal is provisioned)
  const needsBiometric =
    cashActivation?.biometricRequired ||
    cashActivation?.upiBiometricRequired ||
    cashActivation?.aepsBiometricRequired;
  if (!isDistributor && needsBiometric) {
    const bioHref =
      cashActivation?.upiServiceEnabled !== false && cashActivation?.upiBiometricRequired
        ? "/agent/cash"
        : cashActivation?.aepsServiceEnabled !== false && cashActivation?.aepsBiometricRequired
          ? "/agent/aeps"
          : "/agent/cash";
    cards.push({
      key: "biometric",
      stepLabel: "Step 4 · Biometric Activation",
      title: "Complete Biometric Verification",
      description:
        "Scan your Aadhaar-linked fingerprint on an L1 RD scanner to activate UPI Cashpoint, AePS Banking, and Bank Settlement Payouts.",
      badgeText: "Biometric Required",
      tone: "emerald",
      icon: Fingerprint,
      href: bioHref,
      ctaLabel: "Complete Biometric Now",
    });
  }

  if (cards.length === 0) return null;

  const toneStyles: Record<
    ActionCardItem["tone"],
    {
      card: string;
      iconWrap: string;
      badge: string;
      button: string;
    }
  > = {
    emerald: {
      card: "border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 shadow-sm ring-1 ring-emerald-500/20",
      iconWrap: "bg-emerald-600 text-white shadow-sm",
      badge: "bg-emerald-100 border-emerald-300 text-emerald-900",
      button:
        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs",
    },
    amber: {
      card: "border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-white shadow-xs",
      iconWrap: "bg-amber-100 text-amber-800",
      badge: "bg-amber-100 border-amber-300 text-amber-900",
      button:
        "bg-navy-950 text-white hover:bg-navy-900",
    },
    sky: {
      card: "border-sky-200/90 bg-gradient-to-br from-sky-50/70 via-white to-white shadow-xs",
      iconWrap: "bg-sky-100 text-sky-800",
      badge: "bg-sky-100 border-sky-300 text-sky-900",
      button:
        "bg-white border border-slate-200 text-navy-950 hover:border-slate-300 hover:bg-slate-50",
    },
    rose: {
      card: "border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-white shadow-xs",
      iconWrap: "bg-rose-100 text-rose-700",
      badge: "bg-rose-100 border-rose-300 text-rose-900",
      button:
        "bg-rose-600 text-white hover:bg-rose-700",
    },
    slate: {
      card: "border-slate-200/90 bg-slate-50/70",
      iconWrap: "bg-slate-200/80 text-slate-600",
      badge: "bg-slate-200/70 border-slate-300 text-slate-700",
      button:
        "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-navy-950",
    },
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-navy-950">
            Account Activation &amp; Pending Actions ({cards.length})
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2
              className={`h-3.5 w-3.5 ${businessDone ? "text-emerald-600" : "text-slate-300"}`}
            />
            Business
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2
              className={`h-3.5 w-3.5 ${agreementSigned ? "text-emerald-600" : "text-slate-300"}`}
            />
            Agreement
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2
              className={`h-3.5 w-3.5 ${bankDone ? "text-emerald-600" : "text-slate-300"}`}
            />
            Bank
          </span>
        </div>
      </div>

      <div
        className={`grid gap-4 ${
          cards.length === 1
            ? "grid-cols-1"
            : cards.length === 2
              ? "md:grid-cols-2"
              : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {cards.map((c) => {
          const Icon = c.icon;
          const styles = toneStyles[c.tone];
          return (
            <div
              key={c.key}
              className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all ${styles.card}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${styles.iconWrap}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {c.stepLabel}
                      </p>
                      <h3 className="font-display text-base font-bold text-navy-950 leading-snug">
                        {c.title}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}
                  >
                    {c.badgeText}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-1">
                <Link
                  href={c.href}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors w-full sm:w-auto ${styles.button}`}
                >
                  {c.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

