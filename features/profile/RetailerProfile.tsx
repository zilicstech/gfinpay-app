"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { api, apiForm, formatApiError } from "@/lib/api-client";
import { logoutSession } from "@/lib/auth-client";
import { when } from "@/lib/format";
import { homePathFor, useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import { BusinessRegistration, VerificationState } from "@/features/verification/BusinessRegistration";
import { AgreementPanel } from "@/features/agreement/AgreementPanel";
import { RetailerBanksDesk } from "@/features/finance/RetailerBanksDesk";
import { ChangePinCard } from "@/features/profile/ChangePinCard";

type Tab = "personal" | "banks" | "business" | "documents" | "agreement" | "security";

type VerificationEvent = {
  step: string;
  latitude?: number | string;
  longitude?: number | string;
  provider_ref?: string;
  created_at?: string;
};

type VerificationDoc = {
  id: string;
  doc_type: string;
  filename?: string;
  url?: string;
  created_at?: string;
};

type Verification = VerificationState & {
  identityVerifiedAt?: string;
  faceReview?: {
    status?: string;
    reviewedAt?: string | null;
    note?: string | null;
  };
  shopAddress?: Record<string, unknown> | null;
  businessReviewedAt?: string | null;
  agreement: Record<string, string>;
  documents: VerificationDoc[];
  events: VerificationEvent[];
};

const TABS: { id: Tab; label: string }[] = [
  { id: "personal", label: "Identity KYC" },
  { id: "business", label: "Business" },
  { id: "agreement", label: "Agreement" },
  { id: "banks", label: "Bank" },
  { id: "security", label: "Security" },
];

const ENTITIES = [
  ["INDIVIDUAL", "Individual"],
  ["SOLE_PROPRIETORSHIP", "Sole proprietorship"],
  ["PARTNERSHIP", "Partnership"],
  ["LLP", "LLP"],
  ["OPC", "One person company"],
  ["PRIVATE_LIMITED", "Private limited"],
  ["PUBLIC_LIMITED", "Public limited"],
  ["HUF", "HUF"],
  ["TRUST", "Trust"],
  ["SOCIETY", "Society"],
] as const;

const DOCS: Record<string, string[]> = {
  INDIVIDUAL: ["SHOP_PHOTO", "ADDRESS_PROOF"],
  SOLE_PROPRIETORSHIP: ["SHOP_PHOTO", "ADDRESS_PROOF"],
  PARTNERSHIP: ["PARTNERSHIP_DEED"],
  HUF: ["HUF_DEED"],
  LLP: ["LLP_AGREEMENT", "CERTIFICATE_OF_INCORPORATION"],
  OPC: ["CERTIFICATE_OF_INCORPORATION"],
  PRIVATE_LIMITED: ["CERTIFICATE_OF_INCORPORATION"],
  PUBLIC_LIMITED: ["CERTIFICATE_OF_INCORPORATION"],
  TRUST: ["REGISTRATION_CERTIFICATE"],
  SOCIETY: ["REGISTRATION_CERTIFICATE"],
};

function locate() {
  return new Promise<{ latitude: string; longitude: string }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Allow location so this verification can be recorded"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }),
      () => reject(new Error("Allow location so this verification can be recorded")),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

function labelStatus(value?: string) {
  switch (value) {
    case "VERIFIED":
    case "PERSONAL_VERIFIED":
      return "Verified";
    case "BUSINESS_VERIFIED":
      return "Business Verified";
    case "UNDER_REVIEW":
      return "Under Review";
    case "REJECTED":
      return "Rejected";
    case "FAILED":
      return "Verification Failed";
    case "DETAILS_CAPTURED":
      return "Details Saved";
    case "SIGNED":
      return "Signed";
    case "RELEASED":
      return "Ready to Sign";
    case "ESIGN_PENDING":
      return "eSign Pending";
    case "DRAFT":
      return "In Preparation";
    case "NOT_SIGNED":
      return "Not Signed";
    case "REVERIFY_REQUIRED":
      return "Re-verify Required";
    default:
      return "Not Verified";
  }
}

function entityLabel(code?: string) {
  return ENTITIES.find(([value]) => value === code)?.[1] ?? code ?? "—";
}

function prettyType(value?: string) {
  return (value ?? "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "Document";
}

function isTab(value: string | null): value is Tab {
  return TABS.some((tab) => tab.id === value);
}

function normalizeTab(value: string | null): Tab | null {
  if (!value) return null;
  if (value === "bank") return "banks";
  return isTab(value) ? value : null;
}

export function RetailerProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const initial = normalizeTab(search.get("tab"));
  const [tab, setTab] = useState<Tab>(initial ?? "personal");
  const [state, setState] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lookupBusy, setLookupBusy] = useState<"gstin" | "udyam" | "cin" | null>(null);

  const [business, setBusiness] = useState({
    entityType: "SOLE_PROPRIETORSHIP",
    legalName: "",
    tradeName: "",
    address: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    sameAsPersonal: false,
    signatoryName: user?.fullName ?? "",
    gstin: "",
    udyam: "",
    cin: "",
  });
  const [registryAddressHint, setRegistryAddressHint] = useState<string | null>(null);
  const [docType, setDocType] = useState("SHOP_PHOTO");
  const [file, setFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [aadhaarVaultInput, setAadhaarVaultInput] = useState("");
  const [savingAadhaar, setSavingAadhaar] = useState(false);

  useEffect(() => {
    const next = normalizeTab(search.get("tab"));
    if (next) setTab(next);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    api<Verification>("/api/v1/verification", { token })
      .then((row) => {
        setState(row);
        if (row.business?.legalName || row.business?.entityType) {
          const shopAddr = (row.shopAddress ?? row.business?.shopAddress ?? {}) as Record<string, unknown>;
          setBusiness((current) => ({
            ...current,
            entityType: String(row.business.entityType || current.entityType),
            legalName: String(row.business.legalName || ""),
            tradeName: String(row.business.tradeName || ""),
            address: String(row.business.address || shopAddr.fullAddress || ""),
            line1: String(row.business.line1 || shopAddr.line1 || ""),
            line2: String(row.business.line2 || shopAddr.line2 || ""),
            landmark: String(row.business.landmark || shopAddr.landmark || ""),
            city: String(row.business.city || shopAddr.city || ""),
            district: String(row.business.district || shopAddr.district || ""),
            state: String(row.business.state || shopAddr.state || ""),
            pincode: String(row.business.pincode || shopAddr.pincode || ""),
            sameAsPersonal: Boolean(row.business.sameAsPersonal ?? shopAddr.sameAsPersonal ?? false),
            signatoryName: String(row.business.signatoryName || current.signatoryName),
            gstin: String(row.business.gstin || ""),
            udyam: String(row.business.udyam || ""),
            cin: String(row.business.cin || ""),
          }));
        }
      })
      .catch((e) => setError(formatApiError(e, "Could not load your profile")));
  }, [token]);

  function choose(next: Tab) {
    setTab(next);
    setError(null);
    setOk(null);
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  }

  function apply(next: Verification, message: string) {
    setState(next);
    setOk(message);
    window.dispatchEvent(new Event("gfin-verification-updated"));
  }

  async function lookupGstin() {
    if (!business.gstin.trim()) return;
    setLookupBusy("gstin");
    setError(null);
    try {
      const res = await api<{
        gstin: string;
        legalName: string;
        tradeName: string;
        address: string;
      }>("/api/v1/verification/business/gstin", {
        token,
        method: "POST",
        body: JSON.stringify({ gstin: business.gstin.trim() }),
      });
      setBusiness((cur) => ({
        ...cur,
        gstin: res.gstin,
        legalName: res.legalName || cur.legalName,
        tradeName: res.tradeName || cur.tradeName,
        address: res.address || cur.address,
        line1: cur.line1 || res.address || "",
      }));
      if (res.address) setRegistryAddressHint(res.address);
      setOk("GSTIN verified with Surepass and business details autofilled.");
    } catch (e) {
      setError(formatApiError(e, "Could not verify GSTIN"));
    } finally {
      setLookupBusy(null);
    }
  }

  async function lookupUdyam() {
    if (!business.udyam.trim()) return;
    setLookupBusy("udyam");
    setError(null);
    try {
      const res = await api<{
        udyamNumber: string;
        enterpriseName: string;
        address: string;
      }>("/api/v1/verification/business/udyam", {
        token,
        method: "POST",
        body: JSON.stringify({ udyam: business.udyam.trim() }),
      });
      setBusiness((cur) => ({
        ...cur,
        udyam: res.udyamNumber,
        legalName: cur.legalName || res.enterpriseName,
        tradeName: cur.tradeName || res.enterpriseName,
        address: cur.address || res.address,
        line1: cur.line1 || res.address || "",
      }));
      if (res.address) setRegistryAddressHint(res.address);
      setOk("Udyam registration verified and autofilled.");
    } catch (e) {
      setError(formatApiError(e, "Could not verify Udyam registration"));
    } finally {
      setLookupBusy(null);
    }
  }

  async function lookupCin() {
    if (!business.cin.trim()) return;
    setLookupBusy("cin");
    setError(null);
    try {
      const res = await api<{
        cin: string;
        companyName: string;
        registeredAddress: string;
      }>("/api/v1/verification/business/cin", {
        token,
        method: "POST",
        body: JSON.stringify({ cin: business.cin.trim() }),
      });
      setBusiness((cur) => ({
        ...cur,
        cin: res.cin,
        legalName: res.companyName || cur.legalName,
        tradeName: cur.tradeName || res.companyName,
        address: res.registeredAddress || cur.address,
        line1: cur.line1 || res.registeredAddress || "",
      }));
      if (res.registeredAddress) setRegistryAddressHint(res.registeredAddress);
      setOk("Company CIN/LLPIN verified and autofilled.");
    } catch (e) {
      setError(formatApiError(e, "Could not verify CIN / LLPIN"));
    } finally {
      setLookupBusy(null);
    }
  }

  async function submitBusiness(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const location = await locate();
      const next = await api<Verification>("/api/v1/verification/business", {
        token,
        method: "POST",
        body: JSON.stringify({ ...business, ...location }),
      });
      apply(next, "Business details verified and saved. Upload your entity proof and sign the agreement to submit for review.");
    } catch (e) {
      setError(e instanceof Error && e.message.startsWith("Allow location") ? e.message : formatApiError(e, "Could not save the business"));
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const form = new FormData();
      form.set("docType", docType);
      form.set("file", file);
      const next = await apiForm<Verification>("/api/v1/verification/business/documents", form, { token });
      setFile(null);
      apply(next, "Document added to your vault.");
    } catch (e) {
      setError(formatApiError(e, "Could not upload the proof"));
    } finally {
      setBusy(false);
    }
  }

  async function sign(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const location = await locate();
      const next = await api<Verification>("/api/v1/verification/agreement", {
        token,
        method: "POST",
        body: JSON.stringify({ signatoryName: business.signatoryName, ...location }),
      });
      apply(
        next,
        "Agreement signed! Your business registration is now Under Review. Once approved by an admin, Cash-out, Payout, DMT, and Withdrawals will unlock.",
      );
    } catch (e) {
      setError(e instanceof Error && e.message.startsWith("Allow location") ? e.message : formatApiError(e, "Could not sign the agreement"));
    } finally {
      setBusy(false);
    }
  }

  async function saveFullAadhaarToVault(event: FormEvent) {
    event.preventDefault();
    const digits = aadhaarVaultInput.replace(/\D/g, "");
    if (digits.length !== 12) {
      setError("Enter your complete 12-digit Aadhaar number.");
      return;
    }
    setSavingAadhaar(true);
    setError(null);
    setOk(null);
    try {
      const next = await api<Verification>("/api/v1/verification/aadhaar", {
        token,
        method: "POST",
        body: JSON.stringify({ aadhaarNumber: digits }),
      });
      setAadhaarVaultInput("");
      apply(next, "12-digit Aadhaar verified for banking channel activation.");
    } catch (e) {
      setError(formatApiError(e, "Could not verify Aadhaar number"));
    } finally {
      setSavingAadhaar(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("/api/v1/me/password", {
        token,
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setOk("Password updated. Signing you out so you can sign in with the new password.");
      window.setTimeout(async () => {
        await logoutSession();
        router.replace(homePathFor());
      }, 1400);
    } catch (e) {
      setError(formatApiError(e, "Could not change password"));
    } finally {
      setBusy(false);
    }
  }

  const handleAgreementSignedChange = useCallback(() => {
    if (!token) return;
    api<Verification>("/api/v1/verification", { token, silent: true })
      .then((row) => setState(row))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    window.addEventListener("gfin-verification-updated", handleAgreementSignedChange);
    return () => window.removeEventListener("gfin-verification-updated", handleAgreementSignedChange);
  }, [handleAgreementSignedChange]);

  const personalDone = state?.identityStatus === "VERIFIED" || state?.personalStatus === "PERSONAL_VERIFIED";
  const bankDone = state?.bankVerificationStatus === "VERIFIED";
  const businessSaved =
    state?.businessStatus === "DETAILS_CAPTURED" ||
    state?.businessStatus === "UNDER_REVIEW" ||
    state?.businessStatus === "REJECTED" ||
    state?.businessStatus === "BUSINESS_VERIFIED";
  const businessDone = state?.businessStatus === "BUSINESS_VERIFIED";
  const signed = state?.agreementStatus === "SIGNED";
  const proofs = DOCS[business.entityType] ?? ["ADDRESS_PROOF"];
  const steps = useMemo(() => {
    const events = state?.events ?? [];
    return (step: string) => events.find((event) => event.step === step);
  }, [state?.events]);

  if (!user) return <div className="card h-64 animate-pulse bg-slate-50" />;

  const initials =
    user.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const identityData = (state?.identity ?? state?.personal ?? {}) as Record<string, unknown>;
  const permAddr =
    ((state?.personal?.permanentAddress ?? identityData.permanentAddress) as Record<string, unknown> | undefined) ?? {};
  const permAddressFull = String(permAddr.fullAddress || identityData.address || "—");
  const faceStatus = state?.faceReviewStatus || state?.faceReview?.status || "PENDING";
  const dlSummary = state?.digilockerSummary;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-navy-950 text-white shadow-xl">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-xl font-black text-navy-950">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">My profile</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{user.fullName}</h1>
            <p className="mt-1 text-sm text-slate-300">
              {user.code} · {user.mobile}
              {user.shopName ? ` · ${user.shopName}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <StatusChip
              label="Identity"
              done={personalDone}
              value={labelStatus(state?.identityStatus || state?.personalStatus)}
              onClick={() => choose("personal")}
            />
            <StatusChip
              label="Business"
              done={businessDone}
              value={labelStatus(state?.businessStatus)}
              onClick={() => choose("business")}
            />
            <StatusChip
              label="Agreement"
              done={signed}
              value={labelStatus(state?.agreementStatus)}
              onClick={() => choose("agreement")}
            />
            <StatusChip
              label="Wallet Bank"
              done={bankDone}
              value={labelStatus(state?.bankVerificationStatus)}
              onClick={() => choose("banks")}
            />
          </div>
        </div>
        <ol className="grid gap-px bg-white/10 sm:grid-cols-4">
          <Track step="1" title="Identity KYC" detail={trackDetail(steps("PERSONAL"), personalDone)} />
          <Track step="2" title="Business" detail={trackDetail(steps("BUSINESS"), businessSaved)} />
          <Track step="3" title="Agreement" detail={trackDetail(steps("AGREEMENT"), signed)} />
          <Track step="4" title="Bank" detail={bankDone ? "Verified" : labelStatus(state?.bankVerificationStatus)} />
        </ol>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => choose(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap ${
              tab === item.id ? "bg-navy-950 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}

      {tab === "personal" && (
        <div className="card space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <TabHeading
              icon={<UserRound className="h-5 w-5" />}
              title="Verified Identity KYC"
              body="Verified via Surepass DigiBoost Web SDK (Aadhaar + PAN DigiLocker), PAN Comprehensive, and Live Camera Selfie. FD Card, BBPS, and Hospi Cash are unlocked once your identity is verified."
            />
          </div>

          <Record line={steps("PERSONAL")} />

          {personalDone && state && !state.hasFullAadhaar && (
            <form
              onSubmit={saveFullAadhaarToVault}
              className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-700" />
                    Complete 12-Digit Aadhaar Required for Banking Activation
                  </p>
                  <p className="text-xs text-amber-900/90">
                    DigiLocker only shares a masked Aadhaar. Enter your complete 12-digit Aadhaar ending in{" "}
                    <strong className="font-mono">
                      •••• {String(state.aadhaarLast4 || identityData.aadhaarLast4 || "----")}
                    </strong>{" "}
                    for banking channel activation.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  className="field font-mono tracking-widest sm:max-w-xs bg-white"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  placeholder={`XXXX XXXX ${String(state.aadhaarLast4 || identityData.aadhaarLast4 || "XXXX")}`}
                  value={aadhaarVaultInput
                    .replace(/\D/g, "")
                    .slice(0, 12)
                    .replace(/(\d{4})(?=\d)/g, "$1 ")}
                  onChange={(e) => setAadhaarVaultInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                />
                <button
                  type="submit"
                  disabled={savingAadhaar || aadhaarVaultInput.replace(/\D/g, "").length !== 12}
                  className="btn-primary text-xs whitespace-nowrap"
                >
                  {savingAadhaar ? "Verifying…" : "Verify Aadhaar"}
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm">
              <Info label="Verified Full Name" value={String(identityData.fullName || user.fullName || "—")} />
              <Info label="Date of Birth" value={String(identityData.dob || "—")} />
              <Info label="Gender" value={String(identityData.gender || "—")} />
              <Info label="Verified Mobile" value={user.mobile ? `+91 ${user.mobile}` : "—"} />
              <Info
                label="Masked Aadhaar (DigiLocker)"
                value={
                  state?.aadhaarLast4 || identityData.aadhaarLast4
                    ? `•••• •••• ${String(state?.aadhaarLast4 || identityData.aadhaarLast4)}`
                    : "—"
                }
              />
              <Info
                label="Verified PAN"
                value={
                  state?.panLast4 || identityData.panLast4
                    ? `••••••${String(state?.panLast4 || identityData.panLast4)}`
                    : "—"
                }
              />
              <Info
                label="PAN Name Match Score"
                value={identityData.panNameMatchScore != null ? `${String(identityData.panNameMatchScore)}%` : "—"}
              />
              <Info
                label="Manual Face Review Status"
                value={
                  faceStatus === "MATCHED"
                    ? "Matched with Aadhaar Photo"
                    : faceStatus === "MISMATCH"
                      ? "Mismatch — Re-verification Required"
                      : "Pending Admin Comparison"
                }
              />
              {dlSummary && (
                <div className="sm:col-span-2">
                  <Info
                    label="DigiLocker Verification"
                    value={`Aadhaar e-KYC: ${
                      dlSummary.aadhaarPdfStored ? "Verified" : "Pending"
                    } · PAN Record: ${dlSummary.panPdfStored ? "Verified" : "Pending"}`}
                  />
                </div>
              )}
              <div className="sm:col-span-2 rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Permanent Residential Address (from Aadhaar DigiLocker)
                </span>
                <p className="font-semibold text-navy-950">{permAddressFull}</p>
                {(Boolean(permAddr.careOf) ||
                  Boolean(permAddr.vtc) ||
                  Boolean(permAddr.district) ||
                  Boolean(permAddr.state) ||
                  Boolean(permAddr.pincode)) && (
                  <p className="text-xs text-slate-500">
                    {[
                      permAddr.careOf ? `C/O: ${String(permAddr.careOf)}` : null,
                      permAddr.vtc ? `City/VTC: ${String(permAddr.vtc)}` : null,
                      permAddr.district ? `District: ${String(permAddr.district)}` : null,
                      permAddr.state ? `State: ${String(permAddr.state)}` : null,
                      permAddr.pincode ? `PIN: ${String(permAddr.pincode)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
              {state?.identityVerifiedAt && (
                <div className="sm:col-span-2">
                  <Info label="Verified Timestamp" value={when(state.identityVerifiedAt)} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Selfie on File</span>
              {state?.selfieUrl ? (
                <img
                  src={state.selfieUrl}
                  alt="Verified partner selfie"
                  className="h-44 w-44 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="grid h-36 w-36 place-items-center rounded-2xl bg-slate-200/70 text-slate-500 text-xs px-4">
                  {personalDone ? "Live selfie verified" : "Not captured yet"}
                </div>
              )}
              {personalDone && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <BadgeCheck className="h-4 w-4" /> Identity Verified
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "business" && (
        <div className="space-y-4">
          {businessDone && !signed && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                  Business Verified · Next Step: Sign Master Service Agreement
                </p>
                <p className="text-xs text-slate-700">
                  Open the Agreement tab to review, Aadhaar eSign, or upload your signed Master Service Agreement to unlock all services.
                </p>
              </div>
              <button
                type="button"
                onClick={() => choose("agreement")}
                className="btn-primary text-xs"
              >
                Open Agreement Tab →
              </button>
            </div>
          )}
          <BusinessRegistration
            state={state}
            onUpdated={(next) =>
              setState((prev) => (prev ? { ...prev, ...next } : (next as Verification)))
            }
          />
        </div>
      )}

      {tab === "documents" && (
        <form className="card space-y-5 p-6 sm:p-8" onSubmit={uploadProof}>
          <TabHeading
            icon={<FileText className="h-5 w-5" />}
            title="Document vault"
            body={`Proof for ${entityLabel(business.entityType)}: ${proofs.map(prettyType).join(" or ")}.`}
          />
          {state?.documents?.length ? (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
              {state.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold text-navy-950">{prettyType(doc.doc_type)}</span>
                    <span className="block text-xs text-slate-500">{doc.filename || "Uploaded file"}</span>
                  </span>
                  <span className="text-xs text-slate-500">{when(doc.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No documents yet. Upload the proof for this entity.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Document
              <select className="field mt-1" value={docType} onChange={(e) => setDocType(e.target.value)}>
                {proofs.map((type) => (
                  <option key={type} value={type}>
                    {prettyType(type)}
                  </option>
                ))}
                <option value="GST_CERTIFICATE">GST certificate</option>
                <option value="UDYAM">Udyam</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              File
              <input
                className="field mt-1"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <button className="btn-primary" disabled={busy || !file || !personalDone} type="submit">
            {busy ? "Uploading…" : "Add document"}
          </button>
        </form>
      )}

      {tab === "agreement" && (
        <div className="space-y-4">
          {signed && !bankDone && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                  Agreement Signed · Next Step: Verify Bank Account
                </p>
                <p className="text-xs text-slate-700">
                  Open the Bank tab to verify your settlement bank account via account number and IFSC code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => choose("banks")}
                className="btn-primary text-xs"
              >
                Open Bank Tab →
              </button>
            </div>
          )}
          <AgreementPanel
            businessStatus={state?.businessStatus}
            onSignedChange={handleAgreementSignedChange}
          />
        </div>
      )}

      {tab === "banks" && (
        <div className="card p-6 sm:p-8">
          <RetailerBanksDesk embedded />
        </div>
      )}

      {tab === "security" && (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <form className="rounded-[2rem] border border-slate-200/80 bg-white space-y-5 p-6 sm:p-8 shadow-sm" onSubmit={savePassword}>
            <div className="border-b border-slate-100 pb-4">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy-950">
                <KeyRound className="h-5 w-5 text-amber-500" />
                Account Password
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Changing the password signs this account out of every device.
              </p>
            </div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Password
              <span className="relative mt-1.5 block">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowCurrent((value) => !value)}
                  aria-label="Show current password"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              New Password
              <span className="relative mt-1.5 block">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  type={showNew ? "text" : "password"}
                  minLength={8}
                  placeholder="At least 8 characters (letters + digits)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowNew((value) => !value)}
                  aria-label="Show new password"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <div className="pt-1">
              <button
                className="w-full rounded-2xl bg-navy-950 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-navy-900 transition-colors disabled:opacity-50"
                disabled={busy}
                type="submit"
              >
                {busy ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>

          <ChangePinCard
            onSuccess={(msg) => {
              setError(null);
              setOk(msg);
            }}
            onError={(msg) => {
              setOk(null);
              setError(msg);
            }}
          />
        </div>
      )}
    </div>
  );
}

function trackDetail(event: VerificationEvent | undefined, done: boolean) {
  if (event?.created_at) return when(event.created_at);
  return done ? "Recorded" : "Waiting";
}

function StatusChip({
  label,
  value,
  done,
  onClick,
}: {
  label: string;
  value: string;
  done: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-2 text-center transition-colors ${
        done
          ? "bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
          : "bg-white/10 text-slate-300 hover:bg-white/20"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </button>
  );
}

function Track({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <li className="bg-navy-950 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {step} · {title}
      </p>
      <p className="mt-1 text-sm text-white">{detail}</p>
    </li>
  );
}

function TabHeading({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy-950">
        {icon}
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function Record({ line }: { line?: VerificationEvent }) {
  if (!line) return null;
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Recorded {when(line.created_at)}
        {line.latitude != null && line.longitude != null ? ` · ${line.latitude}, ${line.longitude}` : ""}
        {line.provider_ref ? ` · ${line.provider_ref}` : ""}
      </span>
    </p>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-navy-950 break-all">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  hint,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  inputMode?: "numeric" | "text" | "email";
  maxLength?: number;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className="field mt-1"
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}
