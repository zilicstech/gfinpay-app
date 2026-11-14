"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSignature,
  FileText,
  History,
  Lock,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { api, apiBlob, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { StatusPill } from "@/components/ui/primitives";

export type AdminAgreementRecord = {
  id: string;
  agreementNo: string;
  userId: string;
  partnerRole: string;
  agreementType: "RETAILER_MSA" | "DISTRIBUTOR_MSA" | string;
  templateVersion: string;
  status: "DRAFT" | "RELEASED" | "ESIGN_PENDING" | "UNDER_REVIEW" | "SIGNED" | "VOID" | string;
  signingMode?: "ESIGN" | "UPLOAD" | string | null;
  onboardingFee?: number | null;
  onboardingFeeDisplay?: string | null;
  partyName?: string | null;
  partyKind?: string | null;
  partyAddress?: string | null;
  actingThrough?: string | null;
  signatoryName?: string | null;
  signatoryDesignation?: string | null;
  signatoryMobile?: string | null;
  signatoryMobileMasked?: string | null;
  signatoryEmail?: string | null;
  signatoryIsSelf?: boolean;
  esignMode?: "SIGN" | "SHARE" | string;
  esignFileId?: string | null;
  esignUploadClientId?: string | null;
  esignClientId?: string | null;
  esignProviderStatus?: string | null;
  esignInitiatedAt?: string | null;
  esignExpiresAt?: string | null;
  esignLastCheckedAt?: string | null;
  esignUrl?: string | null;
  pageCount?: number | null;
  hasUnsignedPdf?: boolean;
  hasSignedPdf?: boolean;
  unsignedPdfSha256?: string | null;
  signedPdfSha256?: string | null;
  generatedAt?: string | null;
  generatedByName?: string | null;
  releasedAt?: string | null;
  releasedByName?: string | null;
  signedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewNote?: string | null;
};

export type AdminAgreementEvent = {
  id: string;
  event_type: string;
  actor_id?: string | null;
  actor_name?: string | null;
  note?: string | null;
  detail?: Record<string, unknown> | null;
  created_at: string;
};

export type AdminAgreementView = {
  userId: string;
  businessStatus: string;
  businessVerified: boolean;
  canGenerate: boolean;
  agreement: AdminAgreementRecord | null;
  events: AdminAgreementEvent[];
};

export function AgreementAdminCard({
  userId,
  userRole,
  token,
  businessVerified,
  businessStatus,
  refreshKey,
  onChanged,
  onDone,
  onFail,
}: {
  userId: string;
  userRole: string;
  token: string | null;
  businessVerified: boolean;
  businessStatus: string;
  refreshKey?: number;
  onChanged: () => void;
  onDone: (msg: string) => void;
  onFail: (err: unknown, fallback: string) => void;
}) {
  const [view, setView] = useState<AdminAgreementView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [onboardingFeeInput, setOnboardingFeeInput] = useState("0");
  const [reviewNote, setReviewNote] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  // Embedded PDF preview modal
  const [pdfModal, setPdfModal] = useState<{
    title: string;
    variant: "unsigned" | "signed";
    url: string | null;
    loading: boolean;
    error: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const res = await api<AdminAgreementView>(`/api/v1/agreements/users/${userId}`, { token });
      setView(res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey, businessVerified, businessStatus]);

  function closePdfModal() {
    if (pdfModal?.url) {
      URL.revokeObjectURL(pdfModal.url);
    }
    setPdfModal(null);
  }

  async function openPdfPreview(variant: "unsigned" | "signed", title: string) {
    if (!token || !view?.agreement?.id) return;
    if (pdfModal?.url) URL.revokeObjectURL(pdfModal.url);
    setPdfModal({ title, variant, url: null, loading: true, error: null });
    try {
      const { blob } = await apiBlob(
        `/api/v1/agreements/${view.agreement.id}/file?variant=${variant}&download=false`,
        { token },
      );
      const url = URL.createObjectURL(blob);
      setPdfModal({ title, variant, url, loading: false, error: null });
    } catch (e) {
      setPdfModal({
        title,
        variant,
        url: null,
        loading: false,
        error: formatApiError(e, "Could not load agreement PDF"),
      });
    }
  }

  async function downloadPdf(variant: "unsigned" | "signed") {
    if (!token || !view?.agreement?.id) return;
    try {
      const { blob } = await apiBlob(
        `/api/v1/agreements/${view.agreement.id}/file?variant=${variant}&download=true`,
        { token },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${view.agreement.agreementNo}${variant === "signed" ? "-signed" : ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      onFail(e, "Could not download agreement PDF");
    }
  }

  async function generateAgreement() {
    if (!token) return;
    setBusy(true);
    try {
      const feeNum = Number(onboardingFeeInput || "0");
      const res = await api<AdminAgreementView>(`/api/v1/agreements/users/${userId}/generate`, {
        token,
        method: "POST",
        body: JSON.stringify({
          onboardingFee: Number.isFinite(feeNum) && feeNum > 0 ? feeNum : 0,
        }),
      });
      setView(res);
      onChanged();
      onDone(
        `Draft ${res.agreement?.agreementType === "DISTRIBUTOR_MSA" ? "Distributor" : "Retailer"} Master Service Agreement (${res.agreement?.agreementNo}) generated. Preview and click Release when ready.`,
      );
    } catch (e) {
      onFail(e, "Could not generate Master Service Agreement");
    } finally {
      setBusy(false);
    }
  }

  async function releaseAgreement() {
    if (!token || !view?.agreement?.id) return;
    setBusy(true);
    try {
      const res = await api<AdminAgreementView>(`/api/v1/agreements/${view.agreement.id}/release`, {
        token,
        method: "POST",
        body: "{}",
      });
      setView(res);
      onChanged();
      onDone(
        `Agreement ${res.agreement?.agreementNo} released and uploaded to Surepass (file_id: ${res.agreement?.esignFileId || "—"}, client_id: ${res.agreement?.esignUploadClientId || res.agreement?.esignFileId || "—"}).`,
      );
    } catch (e) {
      onFail(e, "Could not release agreement");
    } finally {
      setBusy(false);
    }
  }

  async function reviewUploadedAgreement(approve: boolean) {
    if (!token || !view?.agreement?.id) return;
    if (!approve && !reviewNote.trim()) {
      onFail(new Error("Please provide a rejection note explaining what needs to be corrected."), "Review note required");
      return;
    }
    setBusy(true);
    try {
      const res = await api<AdminAgreementView>(`/api/v1/agreements/${view.agreement.id}/review`, {
        token,
        method: "POST",
        body: JSON.stringify({ approve, note: reviewNote.trim() }),
      });
      setView(res);
      setReviewNote("");
      onChanged();
      onDone(
        approve
          ? `Signed agreement ${res.agreement?.agreementNo} approved and marked SIGNED. Partner services are now unlocked.`
          : `Uploaded agreement rejected and returned to RELEASED status so partner can re-upload or eSign.`,
      );
    } catch (e) {
      onFail(e, "Could not submit agreement review");
    } finally {
      setBusy(false);
    }
  }

  async function voidAgreement() {
    if (!token || !view?.agreement?.id) return;
    if (!voidReason.trim()) {
      onFail(new Error("Provide a reason before voiding the agreement."), "Reason required");
      return;
    }
    setBusy(true);
    try {
      const res = await api<AdminAgreementView>(`/api/v1/agreements/${view.agreement.id}/void`, {
        token,
        method: "POST",
        body: JSON.stringify({ reason: voidReason.trim() }),
      });
      setView(res);
      setVoidReason("");
      setShowVoidForm(false);
      onChanged();
      onDone("Agreement voided. You can now generate a fresh draft agreement.");
    } catch (e) {
      onFail(e, "Could not void agreement");
    } finally {
      setBusy(false);
    }
  }

  const ag = view?.agreement ?? null;
  const effectiveBizVerified = Boolean(view?.businessVerified || businessVerified);
  const status = ag?.status || "NOT_GENERATED";
  const isDistributor = userRole === "MASTER_DISTRIBUTOR" || ag?.agreementType === "DISTRIBUTOR_MSA";
  const msaLabel = isDistributor ? "Distributor MSA" : "Retailer MSA";

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <FileSignature className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold text-navy-950">
                Master Service Agreement ({msaLabel})
              </h3>
              {ag?.agreementNo && (
                <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-bold text-navy-950">
                  {ag.agreementNo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Generate after business verification, review &amp; release to partner for Surepass Aadhaar eSign or physical upload
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading || busy}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-navy-950"
            title="Refresh agreement & Surepass eSign status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <StatusPill value={status} />
        </div>
      </div>

      {/* Prerequisite Gate: Business Must Be Verified First */}
      {!effectiveBizVerified && !ag && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Business Verification Required Before Generating Agreement
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              The {msaLabel} can only be generated once the partner&apos;s Business Registration and Authorized Signatory are verified (<code className="font-mono font-bold">BUSINESS_VERIFIED</code>). Current status: <strong className="font-mono">{businessStatus || "PENDING"}</strong>.
            </p>
            <div className="pt-2">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                <Lock className="h-3.5 w-3.5" /> Generate {msaLabel} (Locked until Business Verified)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ready to Generate (Business Verified, No Active Agreement) */}
      {effectiveBizVerified && !ag && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Ready to Generate {msaLabel}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                Business and Authorized Signatory are verified. Click <strong>Generate Agreement</strong> to auto-populate the Second Party particulars, Annexure A, and execution block into a draft PDF for your review before releasing it to the partner.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div className="w-48">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Onboarding Fee (₹ · 0 = NIL)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={onboardingFeeInput}
                onChange={(e) => setOnboardingFeeInput(e.target.value)}
                className="field text-xs bg-white py-1.5"
                placeholder="0 (NIL)"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={generateAgreement}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <FileSignature className="h-3.5 w-3.5" />
              {busy ? "Generating PDF..." : `Generate ${msaLabel}`}
            </button>
          </div>
        </div>
      )}

      {/* Active Agreement Summary & Lifecycle Controls */}
      {ag && (
        <div className="space-y-4">
          {/* Status Action Banner */}
          {ag.status === "DRAFT" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-700" />
                    Draft Generated · Admin Review Required Before Release
                  </p>
                  <p className="text-xs text-slate-700">
                    This draft is hidden from the partner panel. Preview the generated PDF below to verify Second Party name, address, and authorized signatory details, then click <strong>Release to Partner</strong>.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openPdfPreview("unsigned", `Draft ${ag.agreementNo}`)}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview Draft PDF
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={releaseAgreement}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Release to Partner
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={generateAgreement}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                  title="Re-build draft with latest verified business/signatory details"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate Draft
                </button>
              </div>
            </div>
          )}

          {(ag.status === "RELEASED" || ag.status === "ESIGN_PENDING") && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                    <Send className="h-4 w-4 text-sky-700" />
                    {ag.status === "ESIGN_PENDING"
                      ? `Surepass Aadhaar eSign In Progress (${ag.esignProviderStatus || "initiated"})`
                      : "Released to Partner · Awaiting Signature"}
                  </p>
                  <p className="text-xs text-slate-700">
                    {ag.signatoryIsSelf
                      ? `Visible in partner panel. ${ag.signatoryName || "Partner"} (Self) can directly Aadhaar eSign or upload a physically signed PDF.`
                      : `Visible in partner panel. Only Authorized Signatory ${ag.signatoryName || "Director"} (${ag.signatoryMobile || ag.signatoryMobileMasked || ""}) can Aadhaar eSign — partner has a Copy eSign Link option to share with them.`}
                  </p>
                </div>
                {ag.esignMode && (
                  <span className="rounded-full bg-white border border-sky-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-900">
                    eSign Mode: {ag.esignMode === "SIGN" ? "Direct Self Sign" : "Share Link with Signatory"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPdfPreview("unsigned", `Released ${ag.agreementNo}`)}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                >
                  <Eye className="h-3.5 w-3.5" /> View Released PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadPdf("unsigned")}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
                {ag.status === "ESIGN_PENDING" && (
                  <button
                    type="button"
                    disabled={loading || busy}
                    onClick={load}
                    className="btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Pull Surepass eSign Status
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={generateAgreement}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white text-amber-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Supersede &amp; Regenerate Draft
                </button>
              </div>
            </div>
          )}

          {ag.status === "UNDER_REVIEW" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-amber-700" />
                  Action Required · Partner Uploaded Physically Signed Agreement
                </p>
                <p className="text-xs text-slate-700">
                  Inspect the uploaded signed PDF below to verify wet-ink signatures and stamp on all pages before approving.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPdfPreview("signed", `Uploaded Signed PDF · ${ag.agreementNo}`)}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                >
                  <Eye className="h-3.5 w-3.5" /> Inspect Uploaded Signed PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadPdf("signed")}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                >
                  <Download className="h-3.5 w-3.5" /> Download Uploaded PDF
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80">
                <input
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="field text-xs bg-white flex-1 min-w-[14rem]"
                  placeholder="Review note (mandatory if rejecting)"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reviewUploadedAgreement(true)}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Accept &amp; Mark SIGNED
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reviewUploadedAgreement(false)}
                  className="btn-secondary text-xs text-rose-600 bg-white inline-flex items-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject (Request Re-upload)
                </button>
              </div>
            </div>
          )}

          {ag.status === "SIGNED" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-emerald-700" />
                    Master Service Agreement Signed &amp; Active ({ag.signingMode === "ESIGN" ? "Surepass Aadhaar eSign" : "Physical Upload Verified"})
                  </p>
                  <p className="text-xs text-slate-700">
                    Executed on <strong>{ag.signedAt ? when(ag.signedAt) : "—"}</strong> by <strong>{ag.signatoryName || "Authorized Signatory"}</strong>. Partner services (UPI, AEPS, DMT, Payouts) are unlocked.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ag.hasSignedPdf && (
                  <>
                    <button
                      type="button"
                      onClick={() => openPdfPreview("signed", `Signed ${ag.agreementNo}`)}
                      className="btn-primary text-xs inline-flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Signed Agreement PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPdf("signed")}
                      className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Signed PDF
                    </button>
                  </>
                )}
                {ag.hasUnsignedPdf && (
                  <button
                    type="button"
                    onClick={() => openPdfPreview("unsigned", `Original Released ${ag.agreementNo}`)}
                    className="btn-secondary text-xs inline-flex items-center gap-1.5 bg-white"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Original Released PDF
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Second Party & Execution Metadata Grid */}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Second Party (Legal / Trade Name)</dt>
              <dd className="mt-1 text-xs font-semibold text-navy-950">{ag.partyName || "—"}</dd>
              {ag.partyKind && <p className="text-[11px] text-slate-500 mt-0.5">{ag.partyKind}</p>}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized Signatory</dt>
              <dd className="mt-1 text-xs font-semibold text-navy-950">
                {ag.signatoryName || "—"}
                {ag.signatoryDesignation ? ` · ${ag.signatoryDesignation}` : ""}
              </dd>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {ag.signatoryIsSelf ? "Self (Account Holder)" : "External Director (Share eSign Link)"}
                {ag.signatoryMobile ? ` · ${ag.signatoryMobile}` : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered / Principal Place of Business</dt>
              <dd className="mt-1 text-xs font-semibold text-navy-950">{ag.partyAddress || "—"}</dd>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Template &amp; Onboarding Fee</dt>
              <dd className="mt-1 text-xs font-semibold font-mono text-navy-950">
                {ag.templateVersion} · Fee: {ag.onboardingFeeDisplay || "NIL"}
              </dd>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pages: {ag.pageCount ?? "—"} · Generated: {ag.generatedAt ? when(ag.generatedAt) : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Surepass Uploaded Document (file_id)
              </dt>
              <dd className="mt-1 text-xs font-semibold font-mono text-navy-950 break-all">
                {ag.esignFileId || "Not uploaded yet (Release to upload)"}
              </dd>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5 break-all">
                Upload client_id: {ag.esignUploadClientId || ag.esignFileId || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Surepass Signing Session (client_id)
              </dt>
              <dd className="mt-1 text-xs font-semibold font-mono text-navy-950 break-all">
                {ag.esignClientId || (ag.signingMode ? `Mode: ${ag.signingMode}` : "Awaiting partner eSign initiation")}
              </dd>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {ag.signedAt
                  ? `Signed ${when(ag.signedAt)}`
                  : ag.releasedAt
                    ? `Released ${when(ag.releasedAt)}`
                    : "Pending release"}
              </p>
            </div>

            {(ag.signedPdfSha256 || ag.unsignedPdfSha256) && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Document Integrity SHA-256 ({ag.signedPdfSha256 ? "Signed PDF" : "Unsigned PDF"})
                </dt>
                <dd className="mt-1 text-[11px] font-mono text-slate-700 break-all">
                  {ag.signedPdfSha256 || ag.unsignedPdfSha256}
                </dd>
              </div>
            )}
          </dl>

          {/* Footer: Audit Trail & Void Option */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAudit((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-950"
            >
              <History className="h-3.5 w-3.5" />
              {showAudit ? "Hide" : "Show"} Agreement Audit Trail ({view?.events?.length ?? 0})
            </button>

            <button
              type="button"
              onClick={() => setShowVoidForm((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" /> Void Agreement
            </button>
          </div>

          {showVoidForm && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 space-y-2">
              <p className="text-xs font-bold text-rose-900">
                Void Agreement {ag.agreementNo}
              </p>
              <p className="text-[11px] text-rose-800">
                Voiding resets the partner&apos;s agreement status to <code className="font-mono font-bold">NOT_SIGNED</code> so you can generate a fresh agreement.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="field text-xs bg-white flex-1 min-w-[14rem]"
                  placeholder="Reason for voiding this agreement..."
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={voidAgreement}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirm Void
                </button>
                <button
                  type="button"
                  onClick={() => setShowVoidForm(false)}
                  className="btn-secondary text-xs bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showAudit && (view?.events?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 max-h-56 overflow-y-auto">
              {view!.events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2 last:border-0 last:pb-0 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-navy-950 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                        {ev.event_type}
                      </span>
                      <span className="font-semibold text-navy-950">{ev.note || ev.event_type}</span>
                    </div>
                    {ev.actor_name && (
                      <p className="text-[11px] text-slate-500">By {ev.actor_name}</p>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">{when(ev.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Embedded PDF Modal */}
      {pdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-4">
          <div className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h4 className="font-display text-base font-bold text-navy-950">{pdfModal.title}</h4>
                <p className="text-xs text-slate-500">
                  {ag?.partyName} · Signatory: {ag?.signatoryName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {ag?.status === "DRAFT" && pdfModal.variant === "unsigned" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      await releaseAgreement();
                      closePdfModal();
                    }}
                    className="btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Approve &amp; Release to Partner
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadPdf(pdfModal.variant)}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={closePdfModal}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-950"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              {pdfModal.loading ? (
                <div className="grid h-full place-items-center text-sm font-semibold text-slate-500">
                  Loading agreement PDF...
                </div>
              ) : pdfModal.error ? (
                <div className="grid h-full place-items-center p-6 text-center text-sm text-rose-600">
                  {pdfModal.error}
                </div>
              ) : pdfModal.url ? (
                <iframe src={pdfModal.url} title={pdfModal.title} className="h-full w-full border-0" />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

