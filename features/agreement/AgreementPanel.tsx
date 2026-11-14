"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSignature,
  Lock,
  RefreshCw,
  Share2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { api, apiBlob, apiForm, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";

export type PartnerAgreementRecord = {
  id: string;
  agreementNo: string;
  userId: string;
  partnerRole: string;
  agreementType: "RETAILER_MSA" | "DISTRIBUTOR_MSA" | string;
  templateVersion: string;
  status: "RELEASED" | "ESIGN_PENDING" | "UNDER_REVIEW" | "SIGNED" | string;
  signingMode?: "ESIGN" | "UPLOAD" | string | null;
  onboardingFee?: number | null;
  onboardingFeeDisplay?: string | null;
  partyName?: string | null;
  partyKind?: string | null;
  partyAddress?: string | null;
  actingThrough?: string | null;
  signatoryName?: string | null;
  signatoryDesignation?: string | null;
  signatoryMobileMasked?: string | null;
  signatoryEmail?: string | null;
  signatoryIsSelf?: boolean;
  esignMode?: "SIGN" | "SHARE" | string;
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
  releasedAt?: string | null;
  signedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
};

export type PartnerAgreementResponse = {
  available: boolean;
  status: "NOT_RELEASED" | "RELEASED" | "ESIGN_PENDING" | "UNDER_REVIEW" | "SIGNED" | string;
  agreement: PartnerAgreementRecord | null;
};

type EsignStartResponse = {
  mode: "SIGN" | "SHARE";
  signingUrl: string;
  clientId: string;
  expiresAt: string;
  signatoryName: string;
  signatoryMobileMasked: string;
  signatoryIsSelf: boolean;
  agreement: PartnerAgreementResponse | PartnerAgreementRecord | null;
};

function normalizeAgreementResponse(
  raw: PartnerAgreementResponse | PartnerAgreementRecord | null | undefined,
): PartnerAgreementResponse | null {
  if (!raw) return null;
  if ("available" in raw && typeof raw.available === "boolean") {
    return raw as PartnerAgreementResponse;
  }
  const rec = raw as PartnerAgreementRecord;
  if (rec && typeof rec === "object" && "id" in rec) {
    return {
      available: true,
      status: rec.status || "ESIGN_PENDING",
      agreement: rec,
    };
  }
  return null;
}

function writePopupWaitingScreen(popup: Window, agreementNo?: string | null) {
  try {
    popup.document.open();
    popup.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connecting to Aadhaar eSign…</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #060e1e;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      text-align: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(52, 211, 153, 0.25);
      border-radius: 24px;
      padding: 32px 28px;
    }
    .ring {
      width: 44px;
      height: 44px;
      margin: 0 auto 18px;
      border-radius: 9999px;
      border: 3px solid rgba(52, 211, 153, 0.2);
      border-top-color: #34d399;
      animation: spin 0.9s linear infinite;
    }
    h1 { font-size: 18px; margin: 0 0 8px; font-weight: 700; }
    p { font-size: 13px; line-height: 1.55; color: #cbd5e1; margin: 0; }
    .ref { margin-top: 12px; font-family: monospace; font-size: 12px; color: #6ee7b7; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="ring"></div>
    <h1>Preparing Secure Aadhaar eSign</h1>
    <p>Connecting to Surepass Aadhaar eSign portal. Please keep this tab open—you will be redirected automatically in a moment.</p>
    ${agreementNo ? `<div class="ref">${agreementNo}</div>` : ""}
  </div>
</body>
</html>`);
    popup.document.close();
  } catch {
    // Ignore cross-origin / DOM write errors on restricted browsers
  }
}

export function AgreementPanel({
  businessStatus,
  onSignedChange,
}: {
  businessStatus?: string | null;
  onSignedChange?: () => void;
}) {
  const token = useSession((s) => s.token);
  const role = useSession((s) => s.role);
  const [data, setData] = useState<PartnerAgreementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [pendingSigningUrl, setPendingSigningUrl] = useState<string | null>(null);

  // Keep parent callback in a ref so parent re-renders NEVER re-trigger load() in a loop
  const onSignedChangeRef = useRef(onSignedChange);
  useEffect(() => {
    onSignedChangeRef.current = onSignedChange;
  }, [onSignedChange]);

  const notifiedSignedIdRef = useRef<string | null>(null);
  const popupWatchTimerRef = useRef<number | null>(null);
  const inFlightRefreshRef = useRef(false);

  const notifySignedOnce = useCallback((agreementId?: string | null) => {
    const key = agreementId || "signed";
    if (notifiedSignedIdRef.current === key) return;
    notifiedSignedIdRef.current = key;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("gfin-verification-updated"));
    }
    onSignedChangeRef.current?.();
  }, []);

  // Embedded PDF preview modal
  const [pdfModal, setPdfModal] = useState<{
    title: string;
    variant: "unsigned" | "signed";
    url: string | null;
    loading: boolean;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (popupWatchTimerRef.current !== null) {
        window.clearInterval(popupWatchTimerRef.current);
      }
    };
  }, []);

  const applyAgreementResponse = useCallback(
    (res: PartnerAgreementResponse, announceSign = false) => {
      setData(res);
      if (res.agreement?.esignUrl) {
        setPendingSigningUrl(res.agreement.esignUrl);
      }
      if (res.status === "SIGNED") {
        setPopupBlocked(false);
        setPendingSigningUrl(null);
        if (announceSign) {
          setInfo("Agreement digitally signed via Aadhaar eSign! Your services are now unlocked.");
        }
        notifySignedOnce(res.agreement?.id);
      }
    },
    [notifySignedOnce],
  );

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await api<PartnerAgreementResponse>("/api/v1/agreements/me", {
        token,
        silent: true,
      });
      applyAgreementResponse(res, false);
    } catch (e) {
      setErr(formatApiError(e, "Could not load your Master Service Agreement"));
    } finally {
      setLoading(false);
    }
  }, [token, applyAgreementResponse]);

  useEffect(() => {
    load();
  }, [load]);

  const crossVerifyWithSurepass = useCallback(
    async (manual: boolean) => {
      if (!token || inFlightRefreshRef.current) return;
      inFlightRefreshRef.current = true;
      if (manual) {
        setBusy(true);
        setErr(null);
        setInfo(null);
      } else {
        setVerifying(true);
      }
      try {
        const res = await api<PartnerAgreementResponse>("/api/v1/agreements/me/esign/refresh", {
          token,
          method: "POST",
          body: "{}",
          silent: true,
        });
        applyAgreementResponse(res, res.status === "SIGNED");
        if (manual && res.status !== "SIGNED") {
          if (res.agreement?.esignProviderStatus) {
            setInfo(
              `Cross-verified with Surepass — current status: ${res.agreement.esignProviderStatus} (stored in database).`,
            );
          } else {
            setInfo("Signing status cross-verified with Surepass.");
          }
        }
      } catch (e) {
        if (manual) {
          setErr(formatApiError(e, "Could not cross-verify eSign status with Surepass"));
        }
      } finally {
        inFlightRefreshRef.current = false;
        if (manual) {
          setBusy(false);
        } else {
          setVerifying(false);
        }
      }
    },
    [token, applyAgreementResponse],
  );

  // Automatically cross-verify from Surepass whenever status is not SIGNED and an eSign session exists
  const shouldAutoVerify =
    Boolean(token) &&
    data?.status !== "SIGNED" &&
    (data?.status === "ESIGN_PENDING" ||
      (data?.status === "RELEASED" &&
        Boolean(data?.agreement?.esignClientId) &&
        data?.agreement?.esignProviderStatus !== "client_id_not_found" &&
        data?.agreement?.esignProviderStatus !== "expired"));

  useEffect(() => {
    if (!shouldAutoVerify || !token) return;

    const onVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      crossVerifyWithSurepass(false);
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("gfin-esign");
        bc.onmessage = () => {
          crossVerifyWithSurepass(false);
        };
      } catch {
        bc = null;
      }
    }

    // Quiet background poll while ESIGN_PENDING and tab is visible so status updates automatically
    let pollTimer: number | null = null;
    if (data?.status === "ESIGN_PENDING") {
      pollTimer = window.setInterval(() => {
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          crossVerifyWithSurepass(false);
        }
      }, 6000);
    }

    return () => {
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      if (bc) bc.close();
      if (pollTimer !== null) window.clearInterval(pollTimer);
    };
  }, [shouldAutoVerify, data?.status, token, crossVerifyWithSurepass]);

  function watchPopupUntilClosed(popup: Window) {
    if (popupWatchTimerRef.current !== null) {
      window.clearInterval(popupWatchTimerRef.current);
    }
    popupWatchTimerRef.current = window.setInterval(() => {
      if (popup.closed) {
        if (popupWatchTimerRef.current !== null) {
          window.clearInterval(popupWatchTimerRef.current);
          popupWatchTimerRef.current = null;
        }
        crossVerifyWithSurepass(false);
      }
    }, 1500);
  }

  function closePdfModal() {
    if (pdfModal?.url) {
      URL.revokeObjectURL(pdfModal.url);
    }
    setPdfModal(null);
  }

  async function openPdfPreview(variant: "unsigned" | "signed", title: string) {
    if (!token) return;
    if (pdfModal?.url) URL.revokeObjectURL(pdfModal.url);
    setPdfModal({ title, variant, url: null, loading: true, error: null });
    try {
      const { blob } = await apiBlob(`/api/v1/agreements/me/file?variant=${variant}&download=false`, { token });
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
    if (!token || !data?.agreement) return;
    setErr(null);
    try {
      const { blob } = await apiBlob(`/api/v1/agreements/me/file?variant=${variant}&download=true`, { token });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.agreement.agreementNo}${variant === "signed" ? "-signed" : ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setErr(formatApiError(e, "Could not download agreement PDF"));
    }
  }

  async function getBrowserCoords(): Promise<{ latitude?: string; longitude?: string }> {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return {};
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }),
        () => resolve({}),
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 },
      );
    });
  }

  async function startEsign() {
    if (!token) return;
    const isSelfSign = Boolean(data?.agreement?.signatoryIsSelf);

    // Step 1: Take popup access synchronously inside the click gesture BEFORE any async await.
    // Never pass "noopener" in windowFeatures because browsers return `null` even when the tab opens,
    // and NEVER fall back to `window.location.assign(...)` so the current console tab is never lost.
    let popup: Window | null = null;
    if (isSelfSign && typeof window !== "undefined") {
      popup = window.open("about:blank", "_blank");
      if (!popup || popup.closed) {
        popup = null;
        setPopupBlocked(true);
      } else {
        setPopupBlocked(false);
        writePopupWaitingScreen(popup, data?.agreement?.agreementNo);
      }
    }

    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const coords = await getBrowserCoords();
      const res = await api<EsignStartResponse>("/api/v1/agreements/me/esign/start", {
        token,
        method: "POST",
        body: JSON.stringify(coords),
        silent: true,
      });

      const normalized = normalizeAgreementResponse(res.agreement);
      if (normalized) {
        applyAgreementResponse(normalized, normalized.status === "SIGNED");
      }

      if (res.mode === "SIGN" && res.signingUrl) {
        setPendingSigningUrl(res.signingUrl);
        if (popup && !popup.closed) {
          try {
            popup.opener = null;
          } catch {
            // ignore
          }
          popup.location.replace(res.signingUrl);
          try {
            popup.focus();
          } catch {
            // ignore
          }
          watchPopupUntilClosed(popup);
          setInfo(
            "Surepass Aadhaar eSign opened in a new tab. Complete your Aadhaar OTP signature there — this tab stays open and will automatically verify your signed agreement.",
          );
        } else {
          // Popup was blocked: keep original tab intact and prompt user to allow popups or click direct new-tab button
          setPopupBlocked(true);
        }
      } else {
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch {
            // ignore
          }
        }
        setInfo(
          `Signing link generated for Authorized Signatory ${res.signatoryName}. Copy and share the link below so they can complete Aadhaar eSign.`,
        );
      }
    } catch (e) {
      if (popup && !popup.closed) {
        try {
          popup.close();
        } catch {
          // ignore
        }
      }
      const message = formatApiError(e, "Could not initiate Aadhaar eSign");
      // If backend found it was already signed during pre-start sync, reload state cleanly
      if (message.toLowerCase().includes("already signed")) {
        await load();
      } else {
        setErr(message);
      }
    } finally {
      setBusy(false);
    }
  }

  function grantPopupAccessAndOpen() {
    const targetUrl = pendingSigningUrl || data?.agreement?.esignUrl;
    if (targetUrl) {
      const popup = window.open("about:blank", "_blank");
      if (!popup || popup.closed) {
        setPopupBlocked(true);
        setErr(
          "Popup is still blocked by your browser. Click the blocked-popup icon in your browser address bar, choose 'Always allow popups and redirects', or use the 'Open Aadhaar eSign in New Tab' link below.",
        );
        return;
      }
      setPopupBlocked(false);
      setErr(null);
      try {
        popup.opener = null;
      } catch {
        // ignore
      }
      popup.location.replace(targetUrl);
      try {
        popup.focus();
      } catch {
        // ignore
      }
      watchPopupUntilClosed(popup);
      setInfo(
        "Surepass Aadhaar eSign opened in a new tab. Complete your Aadhaar OTP signature there — this tab will automatically update once signed.",
      );
      return;
    }
    void startEsign();
  }

  async function copySigningLink(url: string) {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      if (token) {
        api("/api/v1/agreements/me/esign/copied", {
          token,
          method: "POST",
          body: "{}",
          silent: true,
        }).catch(() => {});
      }
      setInfo("Signing link copied to clipboard. Share it with the Authorized Signatory.");
    } catch {
      setErr("Could not copy signing link to clipboard");
    }
  }

  async function handleUploadSigned(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedFile) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const coords = await getBrowserCoords();
      const form = new FormData();
      form.append("file", selectedFile);
      if (coords.latitude) form.append("latitude", coords.latitude);
      if (coords.longitude) form.append("longitude", coords.longitude);
      const res = await apiForm<PartnerAgreementResponse>("/api/v1/agreements/me/upload-signed", form, { token });
      applyAgreementResponse(res, false);
      setSelectedFile(null);
      setInfo("Signed agreement PDF uploaded and submitted for compliance review.");
      onSignedChangeRef.current?.();
    } catch (ex) {
      setErr(formatApiError(ex, "Could not upload signed agreement PDF"));
    } finally {
      setBusy(false);
    }
  }

  const ag = data?.agreement ?? null;
  const status = data?.status || "NOT_RELEASED";
  const isDistributor = role === "MASTER_DISTRIBUTOR" || ag?.agreementType === "DISTRIBUTOR_MSA";
  const msaTitle = isDistributor
    ? "Master Service Agreement (Distributor)"
    : "Master Service Agreement (Retailer)";
  const bizVerified = businessStatus === "BUSINESS_VERIFIED";
  const activeSignUrl =
    (pendingSigningUrl || ag?.esignUrl || null) &&
    (!ag?.esignExpiresAt || new Date(ag.esignExpiresAt).getTime() > Date.now() + 60_000)
      ? pendingSigningUrl || ag?.esignUrl || null
      : null;
  const canReverifySurepass =
    ag != null && ag.status !== "SIGNED" && (ag.status === "ESIGN_PENDING" || Boolean(ag.esignClientId));

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-navy-950">{msaTitle}</h2>
              {ag?.agreementNo && (
                <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-navy-950">
                  {ag.agreementNo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Sign your Master Service Agreement via Aadhaar eSign or physical upload to activate UPI, AEPS, DMT &amp; Payout services
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (canReverifySurepass ? crossVerifyWithSurepass(true) : load())}
            disabled={loading || busy}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-navy-950"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading || verifying || busy ? "animate-spin" : ""}`} />
            {verifying ? "Syncing…" : "Refresh"}
          </button>
          <StatusPill value={status} />
        </div>
      </div>

      {err && <Alert tone="error">{err}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      {/* Initial loading skeleton (inline, never blocking full viewport) */}
      {loading && !ag && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 flex items-center gap-3 text-xs text-slate-600">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-700 shrink-0" />
          Loading your Master Service Agreement and verifying signing status…
        </div>
      )}

      {/* State 1: Not Released Yet */}
      {!loading && (!data?.available || !ag) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            {bizVerified ? <Clock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-bold text-navy-950">
              {bizVerified
                ? "Master Service Agreement Under Compliance Preparation"
                : "Complete Business Verification First"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {bizVerified
                ? "Your Business Registration and Authorized Signatory are verified. Our compliance team is reviewing and releasing your personalized Master Service Agreement. Once released, it will appear here for Aadhaar eSign or download."
                : "Your Master Service Agreement is generated automatically after your Business Registration and Authorized Signatory KYC are verified by our compliance team."}
            </p>
          </div>
        </div>
      )}

      {/* State 2 / 3 / 4: Released, eSign Pending, Under Review, or Signed */}
      {ag && (
        <div className="space-y-5">
          {/* Previous Rejection Note if any */}
          {ag.reviewNote && ag.status === "RELEASED" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Previous Physical Upload Rejected by Compliance
                </p>
                <p className="text-xs text-rose-800">{ag.reviewNote}</p>
                <p className="text-[11px] text-rose-700">
                  Please re-upload a clearly signed PDF or complete digital Aadhaar eSign below.
                </p>
              </div>
            </div>
          )}

          {/* Agreement Particulars Summary */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Second Party</p>
              <p className="mt-1 text-xs font-bold text-navy-950">{ag.partyName || "—"}</p>
              {ag.partyKind && <p className="text-[11px] text-slate-500 mt-0.5">{ag.partyKind}</p>}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized Signatory</p>
              <p className="mt-1 text-xs font-bold text-navy-950">
                {ag.signatoryName || "—"}
                {ag.signatoryDesignation ? ` (${ag.signatoryDesignation})` : ""}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {ag.signatoryIsSelf ? "Self (You)" : `Director · ${ag.signatoryMobileMasked || ""}`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Onboarding Fee</p>
              <p className="mt-1 text-xs font-bold font-mono text-emerald-700">
                {ag.onboardingFeeDisplay || "NIL"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Template: {ag.templateVersion} ({ag.pageCount ?? "—"} pages)
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agreement Document</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openPdfPreview(
                      ag.status === "SIGNED" && ag.hasSignedPdf ? "signed" : "unsigned",
                      `${ag.agreementNo} (${ag.status === "SIGNED" ? "Signed" : "Released"})`,
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-navy-950 hover:border-emerald-400 hover:text-emerald-700"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadPdf(ag.status === "SIGNED" && ag.hasSignedPdf ? "signed" : "unsigned")}
                  className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-navy-950 hover:border-emerald-400 hover:text-emerald-700"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          </div>

          {/* When RELEASED or ESIGN_PENDING: Show the two signing options */}
          {(ag.status === "RELEASED" || ag.status === "ESIGN_PENDING") && (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Option 1: Digital Aadhaar eSign */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                      <Sparkles className="h-3 w-3" /> Option 1 · Instant Digital Activation
                    </span>
                    {(ag.status === "ESIGN_PENDING" || ag.esignProviderStatus) && (
                      <span className="font-mono text-[11px] font-semibold text-emerald-800">
                        Surepass: {ag.esignProviderStatus || "initiated"}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base font-bold text-navy-950">
                    {ag.signatoryIsSelf
                      ? "Sign Digitally with Aadhaar eSign"
                      : `Share Aadhaar eSign Link with ${ag.signatoryName || "Authorized Signatory"}`}
                  </h3>

                  {ag.signatoryIsSelf ? (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Opens Surepass Aadhaar eSign in a <strong>new tab</strong> so this console stays open. Once you complete Aadhaar OTP signing, your status is cross-verified from Surepass and marked <strong>SIGNED</strong> automatically.
                    </p>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 space-y-1">
                      <p className="font-bold">
                        Only the Authorized Signatory ({ag.signatoryName}, {ag.signatoryMobileMasked || "Director"}) can eSign this agreement.
                      </p>
                      <p className="text-[11px] text-amber-900">
                        Generate the secure Surepass signing link below, copy it, and share it with {ag.signatoryName} to complete Aadhaar OTP eSign.
                      </p>
                    </div>
                  )}

                  {ag.esignLastCheckedAt && (
                    <p className="text-[11px] text-slate-500">
                      Last verified with Surepass: <strong>{when(ag.esignLastCheckedAt)}</strong>
                      {verifying ? " · Checking Surepass…" : ""}
                    </p>
                  )}

                  {/* Popup Access Required Banner (never overwrites current tab) */}
                  {popupBlocked && ag.signatoryIsSelf && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">Allow Popup Access to Open Aadhaar eSign in a New Tab</p>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            Your browser blocked opening a new tab. Allow popups for this site using the icon in your browser&apos;s address bar so your current session isn&apos;t replaced, then click <strong>Grant Popup Access &amp; Open</strong> — or open the eSign link directly in a new tab below.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={grantPopupAccessAndOpen}
                          className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Grant Popup Access &amp; Open
                        </button>
                        {activeSignUrl && (
                          <a
                            href={activeSignUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setPopupBlocked(false)}
                            className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Aadhaar eSign in New Tab
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Self Sign Mode Controls */}
                {ag.signatoryIsSelf ? (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {ag.status === "ESIGN_PENDING" && activeSignUrl ? (
                        <a
                          href={activeSignUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Aadhaar eSign in New Tab
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={startEsign}
                          className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <FileSignature className="h-4 w-4" />
                          {busy
                            ? "Opening Surepass eSign…"
                            : ag.status === "ESIGN_PENDING"
                              ? "Continue / Re-open Aadhaar eSign"
                              : "Sign with Aadhaar eSign"}
                        </button>
                      )}

                      {canReverifySurepass && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => crossVerifyWithSurepass(true)}
                          className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${busy || verifying ? "animate-spin" : ""}`} />
                          Re-verify Status
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Share Link Mode Controls (External Director Signatory) */
                  <div className="space-y-3 pt-2">
                    {ag.esignUrl ? (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Signing Link for {ag.signatoryName}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={ag.esignUrl}
                            className="field text-xs font-mono bg-white flex-1 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => copySigningLink(ag.esignUrl!)}
                            className="btn-primary text-xs inline-flex items-center gap-1.5 shrink-0"
                          >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied" : "Copy Link"}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Hello ${ag.signatoryName || ""}, please review and Aadhaar eSign the Graminuli Pay Master Service Agreement (${ag.agreementNo}) for ${ag.partyName || "our business"}: ${ag.esignUrl}`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                          >
                            <Share2 className="h-3.5 w-3.5" /> Share via WhatsApp
                          </a>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => crossVerifyWithSurepass(true)}
                            className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${busy || verifying ? "animate-spin" : ""}`} />
                            Re-verify Status
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={startEsign}
                          className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <Share2 className="h-4 w-4" />
                          {busy
                            ? "Generating Surepass Link..."
                            : `Generate & Copy eSign Link for ${ag.signatoryName || "Signatory"}`}
                        </button>
                        {canReverifySurepass && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => crossVerifyWithSurepass(true)}
                            className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${busy || verifying ? "animate-spin" : ""}`} />
                            Re-verify Status
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Option 2: Physical Download, Sign & Upload */}
              <form
                onSubmit={handleUploadSigned}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/80 border border-slate-300 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    <Upload className="h-3 w-3" /> Option 2 · Physical Wet-Ink Sign &amp; Upload
                  </span>

                  <h3 className="font-display text-base font-bold text-navy-950">
                    Download, Sign &amp; Upload Scanned PDF
                  </h3>

                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>
                      <button
                        type="button"
                        onClick={() => downloadPdf("unsigned")}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Download the Agreement PDF ({ag.agreementNo}.pdf)
                      </button>
                    </li>
                    <li>
                      Have Authorized Signatory (<strong>{ag.signatoryName}</strong>) sign &amp; stamp on all pages.
                    </li>
                    <li>Scan into a single PDF (max 10 MB) and upload below for compliance verification.</li>
                  </ol>
                </div>

                <div className="space-y-3 pt-2">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-navy-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-navy-900"
                  />
                  <button
                    type="submit"
                    disabled={busy || !selectedFile}
                    className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {busy ? "Uploading Signed PDF..." : "Upload Signed PDF for Review"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* When UNDER_REVIEW */}
          {ag.status === "UNDER_REVIEW" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-sm font-bold text-amber-950">
                    Signed Agreement Under Compliance Review
                  </h3>
                  <p className="text-xs text-slate-700 max-w-2xl">
                    Your uploaded signed PDF for <strong>{ag.agreementNo}</strong> has been received and is being verified by our compliance team. Once approved, your financial services will be activated automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPdfPreview("signed", `Uploaded Signed PDF · ${ag.agreementNo}`)}
                  className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> View Uploaded PDF
                </button>
              </div>
            </div>
          )}

          {/* When SIGNED */}
          {ag.status === "SIGNED" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-emerald-950">
                      Master Service Agreement Signed &amp; Active
                    </h3>
                    <span className="rounded-full bg-white border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      {ag.signingMode === "ESIGN" ? "Aadhaar eSign Verified" : "Physical Signature Verified"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Executed by <strong>{ag.signatoryName || "Authorized Signatory"}</strong> on{" "}
                    <strong>{ag.signedAt ? when(ag.signedAt) : "—"}</strong>.
                  </p>
                  {ag.signedPdfSha256 && (
                    <p className="font-mono text-[11px] text-slate-500 break-all">
                      SHA-256: {ag.signedPdfSha256}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ag.hasSignedPdf && (
                  <>
                    <button
                      type="button"
                      onClick={() => openPdfPreview("signed", `Signed Agreement · ${ag.agreementNo}`)}
                      className="btn-primary text-xs inline-flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Signed Agreement
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPdf("signed")}
                      className="btn-secondary text-xs bg-white inline-flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Signed PDF
                    </button>
                  </>
                )}
              </div>
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
                  {ag?.partyName} · Authorized Signatory: {ag?.signatoryName}
                </p>
              </div>
              <div className="flex items-center gap-2">
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
