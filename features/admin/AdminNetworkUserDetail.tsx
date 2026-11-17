"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BadgeCheck,
  RefreshCw,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Fingerprint,
  KeyRound,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Store,
  Unlock,
  User,
  UserPlus,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { BankEkycSummary } from "@/features/ekyc/BankEkycSummary";
import { AgentEkycModal, AgentEkycStatusModal, agentEkycLinkOpened, agentEkycVerified, agentKycStatus } from "@/features/admin/AgentEkycModal";
import { api, apiBlob, formatApiError, openDetails } from "@/lib/api-client";
import { inr, maskMobile, when, createdByLabel } from "@/lib/format";
import { useSession, isSuperAdminOrPlatformAdmin } from "@/stores/session.store";
import { ActivityHistory } from "@/features/admin/ActivityHistory";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { RetailerBankingAdminTab } from "@/features/admin/ProviderOnboardingAdminCard";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import { retailerLocationFromKyc, retailerLocationLine } from "@/features/admin/retailer-location";
import { AgreementAdminCard } from "@/features/admin/AgreementAdminCard";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
import { ActivationRequestModal } from "@/features/finance/ActivationRequestModal";
import { RetailerRequestsPanel } from "@/features/finance/RetailerRequestsPanel";
import type { Hub, UserDetail, UserRow } from "@/features/admin/types";

type RetailerCustomer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  ekyc_status?: string;
  created_at?: string;
  retailer_name?: string;
  created_by?: string;
  created_by_code?: string;
};

const primaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-200";

type BankAccountDetail = {
  id: string;
  account_name?: string;
  account_number?: string;
  ifsc?: string;
  bank_name?: string;
  active?: boolean;
  verification_status?: string;
  verified_name?: string;
  name_match_score?: number;
  provider_ref?: string;
  verified_at?: string;
  created_at?: string;
};

type VerificationEventRow = {
  step: string;
  latitude?: number | string;
  longitude?: number | string;
  provider_ref?: string | null;
  created_at?: string;
};

type DigilockerVaultDoc = {
  id: string;
  source?: string;
  docType: string;
  fileType: string;
  fileId: string;
  name?: string | null;
  issuer?: string | null;
  description?: string | null;
  mimeType?: string | null;
  mandatory?: boolean;
  sizeBytes?: number | null;
  fetchStatus: "PENDING" | "STORED" | "FAILED" | string;
  fetchError?: string | null;
  fetchedAt?: string | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
};

type SignatoryAdminDetail = {
  id: string;
  cin: string;
  directorName: string;
  din?: string | null;
  isSelf: boolean;
  status: string;
  currentStep?: string | null;
  maskedMobile?: string | null;
  verifiedName?: string | null;
  nameMatchScore?: number | null;
  aadhaarLast4?: string | null;
  panLast4?: string | null;
  aadhaarPanLinked?: boolean;
  faceReviewStatus?: string | null;
  faceReviewedBy?: string | null;
  faceReviewedByName?: string | null;
  faceReviewedAt?: string | null;
  faceReviewNote?: string | null;
  selfieUrl?: string | null;
  signatoryUrl?: string | null;
  expiresAt?: string | null;
  completedAt?: string | null;
  identity?: Record<string, unknown>;
};

type AdminVerificationDetail = {
  personalIdentityVerified?: boolean;
  businessVerified?: boolean;
  aadhaarPanLinked?: boolean;
  identityStatus?: string;
  identityVerifiedAt?: string | null;
  bankVerificationStatus?: string;
  personalStatus?: string;
  businessStatus?: string;
  businessType?: "INDIVIDUAL" | "COMPANY" | string | null;
  workLocation?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    source?: string | null;
  };
  workAddress?: Record<string, unknown> | null;
  signatory?: SignatoryAdminDetail | null;
  signatoryDocuments?: DigilockerVaultDoc[];
  agreementStatus?: string;
  aadhaarLast4?: string | null;
  aadhaarVerifiedAt?: string | null;
  panLast4?: string | null;
  panVerifiedAt?: string | null;
  livenessScore?: number | null;
  livenessPassedAt?: string | null;
  faceReviewStatus?: string | null;
  faceReview?: {
    status?: string;
    reviewedBy?: string | null;
    reviewedByName?: string | null;
    reviewedAt?: string | null;
    note?: string | null;
  };
  shopName?: string | null;
  shopAddress?: Record<string, unknown> | null;
  gstin?: string | null;
  selfieUrl?: string | null;
  businessReviewedBy?: string | null;
  businessReviewedAt?: string | null;
  businessReviewNote?: string | null;
  identity?: Record<string, unknown>;
  personal?: Record<string, unknown>;
  business?: Record<string, unknown>;
  agreement?: Record<string, unknown>;
  digilockerSummary?: {
    aadhaarPdfStored?: boolean;
    panPdfStored?: boolean;
    aadhaarPhotoStored?: boolean;
    storedCount?: number;
    totalCount?: number;
  };
  digilockerDocuments?: DigilockerVaultDoc[];
  banks?: BankAccountDetail[];
  documents?: {
    id: string;
    doc_type: string;
    filename?: string;
    content_type?: string;
    created_at?: string;
    url?: string;
  }[];
  events?: VerificationEventRow[];
};

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function InfoField({
  label,
  value,
  mono = false,
  subtext,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  subtext?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 space-y-1">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={`text-sm font-semibold text-navy-950 break-words ${mono ? "font-mono text-xs" : ""}`}>
        {value || <span className="text-slate-400 font-normal">Not provided</span>}
      </dd>
      {subtext && <div className="text-[11px] text-slate-500 pt-0.5">{subtext}</div>}
    </div>
  );
}

function PartnerInfoTab({
  section,
  user,
  userId,
  token,
  refreshKey,
  onChanged,
  onDone,
  onFail,
}: {
  section: "personal" | "business";
  user: UserDetail;
  userId: string;
  token: string | null;
  refreshKey?: number;
  onChanged: () => void;
  onDone: (msg: string) => void;
  onFail: (err: unknown, fallback: string) => void;
}) {
  const [data, setData] = useState<AdminVerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [faceNote, setFaceNote] = useState("");
  const [sigFaceNote, setSigFaceNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [aadhaarPhotoUrl, setAadhaarPhotoUrl] = useState<string | null>(null);
  const [sigAadhaarPhotoUrl, setSigAadhaarPhotoUrl] = useState<string | null>(null);

  // Decrypted DigiLocker document modal viewer state
  const [viewerDoc, setViewerDoc] = useState<DigilockerVaultDoc | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerXmlText, setViewerXmlText] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerReviewNote, setViewerReviewNote] = useState("");
  const [docActionBusyId, setDocActionBusyId] = useState<string | null>(null);
  const [faceConfirmAction, setFaceConfirmAction] = useState<"MATCHED" | "MISMATCH" | null>(null);

  async function refresh() {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const res = await api<AdminVerificationDetail>(`/api/v1/verification/users/${userId}`, { token });
      setData(res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token, userId, refreshKey]);

  const digilockerDocs = (data?.digilockerDocuments ?? []).filter((d) => {
    const docType = (d.docType || "").toUpperCase();
    const fileType = (d.fileType || "").toLowerCase();
    const fileId = (d.fileId || "").toLowerCase();
    return (
      (docType === "ADHAR" && fileType === "pdf") ||
      docType === "AADHAAR_PHOTO" ||
      fileId === "aadhaar_photo" ||
      (docType === "PANCR" && fileType !== "xml")
    );
  });
  const storedDigilockerDocsCount = digilockerDocs.filter((d) => d.fetchStatus === "STORED").length;
  const aadhaarPhotoDoc = digilockerDocs.find(
    (d) =>
      (d.docType.toUpperCase() === "AADHAAR_PHOTO" || d.fileId.toLowerCase() === "aadhaar_photo") &&
      d.fetchStatus === "STORED",
  );
  const aadhaarPdfDoc = digilockerDocs.find(
    (d) => d.docType.toUpperCase() === "ADHAR" && d.fileType.toLowerCase() === "pdf" && d.fetchStatus === "STORED",
  );
  const signatoryDocs = (data?.signatoryDocuments ?? []).filter((d) => {
    const docType = (d.docType || "").toUpperCase();
    const fileType = (d.fileType || "").toLowerCase();
    const fileId = (d.fileId || "").toLowerCase();
    return (
      (docType === "ADHAR" && fileType === "pdf") ||
      docType === "AADHAAR_PHOTO" ||
      fileId === "aadhaar_photo" ||
      (docType === "PANCR" && fileType !== "xml")
    );
  });
  const sigAadhaarPhotoDoc = signatoryDocs.find(
    (d) =>
      (d.docType.toUpperCase() === "AADHAAR_PHOTO" || d.fileId.toLowerCase() === "aadhaar_photo") &&
      d.fetchStatus === "STORED",
  );

  // Load Signatory Aadhaar photo thumbnail from encrypted vault when signatory is another director
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!token || !userId || !sigAadhaarPhotoDoc?.id) {
      setSigAadhaarPhotoUrl(null);
      return;
    }
    apiBlob(`/api/v1/verification/users/${userId}/digilocker-documents/${sigAadhaarPhotoDoc.id}/file`, { token })
      .then(({ blob }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSigAadhaarPhotoUrl(objectUrl);
      })
      .catch(() => {
        if (active) setSigAadhaarPhotoUrl(null);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, userId, sigAadhaarPhotoDoc?.id]);

  // Load Aadhaar photo thumbnail from encrypted vault for side-by-side manual face review
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!token || !userId || !aadhaarPhotoDoc?.id) {
      setAadhaarPhotoUrl(null);
      return;
    }
    apiBlob(`/api/v1/verification/users/${userId}/digilocker-documents/${aadhaarPhotoDoc.id}/file`, { token })
      .then(({ blob }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setAadhaarPhotoUrl(objectUrl);
      })
      .catch(() => {
        if (active) setAadhaarPhotoUrl(null);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, userId, aadhaarPhotoDoc?.id]);

  function closeViewer() {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerDoc(null);
    setViewerUrl(null);
    setViewerXmlText(null);
    setViewerError(null);
    setViewerLoading(false);
  }

  async function openDigilockerDoc(doc: DigilockerVaultDoc) {
    if (!token) return;
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerDoc(doc);
    setViewerUrl(null);
    setViewerXmlText(null);
    setViewerError(null);
    setViewerReviewNote(doc.reviewNote || "");
    setViewerLoading(true);
    try {
      const { blob, contentType } = await apiBlob(
        `/api/v1/verification/users/${userId}/digilocker-documents/${doc.id}/file`,
        { token },
      );
      if (doc.fileType.toLowerCase() === "xml" || contentType.includes("xml")) {
        const text = await blob.text();
        setViewerXmlText(text);
      } else {
        const url = URL.createObjectURL(blob);
        setViewerUrl(url);
      }
    } catch (e) {
      setViewerError(formatApiError(e, "Could not load decrypted document from vault"));
    } finally {
      setViewerLoading(false);
    }
  }

  async function submitFaceReview(matched: boolean) {
    if (!matched && !faceNote.trim()) {
      onFail(new Error("Please provide a review note explaining why the face did not match."), "Review note required");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/verification/users/${userId}/face-review`, {
        token,
        method: "POST",
        body: JSON.stringify({ matched, note: faceNote }),
      });
      setFaceNote("");
      setFaceConfirmAction(null);
      await refresh();
      onChanged();
      onDone(
        matched
          ? "Manual face comparison marked as MATCHED against Aadhaar document photo."
          : "Face marked as MISMATCH. Partner sessions revoked and flagged for mandatory re-verification.",
      );
    } catch (e) {
      onFail(e, "Could not submit manual face review");
    } finally {
      setBusy(false);
    }
  }

  async function submitSignatoryFaceReview(matched: boolean) {
    if (!matched && !sigFaceNote.trim()) {
      onFail(new Error("Please provide a review note explaining why the signatory's selfie did not match."), "Review note required");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/verification/users/${userId}/signatory/face-review`, {
        token,
        method: "POST",
        body: JSON.stringify({ matched, note: sigFaceNote }),
      });
      setSigFaceNote("");
      await refresh();
      onChanged();
      onDone(
        matched
          ? "Authorized signatory face comparison marked as MATCHED."
          : "Authorized signatory face comparison marked as MISMATCH.",
      );
    } catch (e) {
      onFail(e, "Could not submit signatory face review");
    } finally {
      setBusy(false);
    }
  }

  async function submitDocReview(doc: DigilockerVaultDoc, approve: boolean, noteText?: string) {
    setDocActionBusyId(doc.id);
    try {
      const reviewNoteToSend =
        noteText !== undefined
          ? noteText
          : !approve
            ? window.prompt("Provide a reason for rejecting this DigiLocker document:", doc.reviewNote || "") ?? ""
            : "";
      if (!approve && !reviewNoteToSend.trim()) {
        setDocActionBusyId(null);
        return;
      }
      await api(`/api/v1/verification/users/${userId}/digilocker-documents/${doc.id}/review`, {
        token,
        method: "POST",
        body: JSON.stringify({ approve, note: reviewNoteToSend }),
      });
      await refresh();
      onDone(
        approve
          ? `${doc.name || doc.docType} (${doc.fileType.toUpperCase()}) marked as APPROVED.`
          : `${doc.name || doc.docType} (${doc.fileType.toUpperCase()}) marked as REJECTED.`,
      );
      if (viewerDoc?.id === doc.id) {
        setViewerDoc((prev) =>
          prev ? { ...prev, reviewStatus: approve ? "APPROVED" : "REJECTED", reviewNote: reviewNoteToSend } : null,
        );
      }
    } catch (e) {
      onFail(e, "Could not review DigiLocker document");
    } finally {
      setDocActionBusyId(null);
    }
  }

  async function refetchDigilockerDocs() {
    setBusy(true);
    try {
      await api(`/api/v1/verification/users/${userId}/digilocker-documents/refetch`, {
        token,
        method: "POST",
        body: "{}",
      });
      await refresh();
      onDone("DigiLocker documents re-fetched and stored in encrypted vault.");
    } catch (e) {
      onFail(e, "Could not re-fetch DigiLocker documents");
    } finally {
      setBusy(false);
    }
  }

  async function reviewPersonal(approve: boolean) {
    setBusy(true);
    try {
      await api(`/api/v1/verification/users/${userId}/personal-review`, {
        token,
        method: "POST",
        body: JSON.stringify({ approve, note: personalNote }),
      });
      setPersonalNote("");
      await refresh();
      onChanged();
      onDone(
        approve
          ? "Personal identity verification approved (Personal Identity Verified)."
          : "Personal identity verification rejected. Partner must re-verify.",
      );
    } catch (e) {
      onFail(e, "Could not submit personal identity review");
    } finally {
      setBusy(false);
    }
  }

  async function reviewBusiness(approve: boolean) {
    setBusy(true);
    try {
      await api(`/api/v1/verification/users/${userId}/business-review`, {
        token,
        method: "POST",
        body: JSON.stringify({ approve, note }),
      });
      setNote("");
      await refresh();
      onChanged();
      onDone(approve ? "Business registration & location approved (BUSINESS_VERIFIED)." : "Business registration rejected.");
    } catch (e) {
      onFail(e, "Could not submit business review");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return <div className="card h-64 animate-pulse bg-slate-100 rounded-[2rem]" />;
  }

  const identity = data?.identity ?? {};
  const personal = data?.personal ?? {};
  const biz = data?.business ?? {};
  const agreement = data?.agreement ?? {};
  const registry = (biz.registry as Record<string, Record<string, unknown>> | undefined) ?? {};
  const events = data?.events ?? [];
  const banks = data?.banks ?? [];
  const documents = data?.documents ?? [];
  const dlSummary = data?.digilockerSummary;

  const identityStatus = data?.identityStatus || user.kyc?.identity_status || user.kyc?.personal_status || "NOT_VERIFIED";
  const faceReviewStatus = data?.faceReviewStatus || data?.faceReview?.status || "PENDING";
  const bankStatus = data?.bankVerificationStatus || user.kyc?.bank_verification_status || "NOT_VERIFIED";
  const businessStatus = data?.businessStatus || user.kyc?.business_status || "NOT_VERIFIED";
  const agreementStatus = data?.agreementStatus || user.kyc?.agreement_status || "NOT_SIGNED";
  const isRetailer = user.user_type === "RETAILER";

  const personalIdentityVerified = Boolean(
    data?.personalIdentityVerified ??
      user.kyc?.personal_identity_verified ??
      user.personal_identity_verified,
  );
  const businessVerified = Boolean(
    data?.businessVerified ??
      user.kyc?.business_verified ??
      user.business_verified ??
      businessStatus === "BUSINESS_VERIFIED",
  );
  const aadhaarPanLinked = Boolean(
    data?.aadhaarPanLinked ??
      identity.aadhaarPanLinked ??
      identity.aadhaarLinked ??
      user.kyc?.aadhaar_pan_linked ??
      user.aadhaar_pan_linked,
  );
  const panSource = String(identity.panSource || personal.panSource || "DIGILOCKER");
  const approvedDigilockerDocsCount = digilockerDocs.filter(
    (d) => d.reviewStatus === "APPROVED",
  ).length;
  const allDigilockerDocsApproved =
    digilockerDocs.length > 0 && approvedDigilockerDocsCount === digilockerDocs.length;

  const aadhaarLast4 =
    data?.aadhaarLast4 ||
    (identity.aadhaarLast4 as string | undefined) ||
    (personal.aadhaarLast4 as string | undefined) ||
    user.kyc?.aadhaar_last4;
  const panLast4 =
    data?.panLast4 ||
    (identity.panLast4 as string | undefined) ||
    user.kyc?.pan_last4;

  const panMatchScore = identity.panNameMatchScore != null ? Number(identity.panNameMatchScore) : null;

  const permAddrObj =
    ((personal.permanentAddress || identity.permanentAddress) as Record<string, unknown> | undefined) ?? {};

  const personalAddress =
    (permAddrObj.fullAddress ? String(permAddrObj.fullAddress) : null) ||
    [
      identity.address || personal.address,
      identity.city || user.city || user.retailer_city || user.kyc?.city,
      identity.state || user.state || user.retailer_state || user.kyc?.state,
      identity.pincode || user.pincode || user.retailer_pincode || user.kyc?.pincode,
    ]
      .filter(Boolean)
      .map(String)
      .join(", ") ||
    null;

  const shopAddrObj =
    (data?.workAddress && Object.keys(data.workAddress).length > 0
      ? data.workAddress
      : data?.shopAddress && Object.keys(data.shopAddress).length > 0
        ? data.shopAddress
        : (biz.address as Record<string, unknown> | undefined) ??
          (biz.shopAddress as Record<string, unknown> | undefined)) ?? {};

  const businessAddressFormatted =
    (shopAddrObj.fullAddress ? String(shopAddrObj.fullAddress) : null) ||
    (typeof biz.addressText === "string" && biz.addressText ? biz.addressText : null) ||
    (typeof biz.address === "string" ? biz.address : null);

  const sameAsPersonal = Boolean(shopAddrObj.sameAsPersonal ?? biz.sameAsPersonal);
  const businessType =
    data?.businessType ||
    (typeof biz.businessType === "string" ? biz.businessType : null) ||
    (biz.entityType === "INDIVIDUAL" ? "INDIVIDUAL" : biz.cin ? "COMPANY" : null);
  const workLat = data?.workLocation?.latitude ?? biz.workLatitude ?? null;
  const workLng = data?.workLocation?.longitude ?? biz.workLongitude ?? null;
  const workLocSource = data?.workLocation?.source ?? (biz.workLocationSource as string | undefined) ?? null;
  const signatory = data?.signatory ?? null;
  const companyDetails = (biz.company as Record<string, unknown> | undefined) ?? null;
  const companyDirectors =
    (companyDetails?.directors as {
      name: string;
      din: string;
      startDate?: string;
      active?: boolean;
      selected?: boolean;
    }[]) ?? [];

  const findEvent = (...steps: string[]) =>
    events.find((ev) => steps.includes(ev.step.toUpperCase())) ||
    (user.kyc?.locations ?? []).find((loc) => steps.includes(loc.step.toUpperCase()));

  const identityEvent = findEvent("IDENTITY", "PERSONAL", "SELFIE");
  const businessEvent = findEvent("BUSINESS");
  const agreementEvent = findEvent("AGREEMENT");

  const canReviewBusiness =
    !businessVerified &&
    (businessStatus === "UNDER_REVIEW" ||
      businessStatus === "AWAITING_SIGNATORY_KYC" ||
      businessStatus === "DETAILS_CAPTURED" ||
      businessStatus === "REJECTED" ||
      businessStatus === "NOT_VERIFIED");

  const faceMatched = faceReviewStatus === "MATCHED";
  const mandatoryDocsReady =
    digilockerDocs.length === 0 || Boolean(dlSummary?.aadhaarPdfStored && dlSummary?.panPdfStored);
  const signatoryReadyForApproval =
    !signatory ||
    signatory.isSelf ||
    (signatory.status === "KYC_COMPLETED" && signatory.faceReviewStatus === "MATCHED");

  return (
    <div className="space-y-6">
      {section === "personal" && (
        <>
          {/* 1. Personal Identity Verification Overview & Flag Control */}
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-lg font-bold text-navy-950">
                    Personal Identity Verification
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                      personalIdentityVerified
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-amber-50 border-amber-300 text-amber-800"
                    }`}
                  >
                    <Fingerprint className="h-3.5 w-3.5" />
                    Personal Identity Verified: {personalIdentityVerified ? "YES" : "PENDING"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                      aadhaarPanLinked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-rose-50 border-rose-300 text-rose-800"
                    }`}
                  >
                    Aadhaar-PAN Linked: {aadhaarPanLinked ? "YES" : "NO"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Individual KYC verification covering Aadhaar DigiLocker, PAN verification, live selfie face comparison, and encrypted DigiLocker documents.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Personal Identity Flag
                  </span>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={personalIdentityVerified ? "VERIFIED" : "PENDING"} />
                </div>
                <p className="text-[11px] text-slate-500">
                  {personalIdentityVerified
                    ? "Face matched & all mandatory KYC docs approved"
                    : "Requires Face Match + 3 DigiLocker docs approved"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Aadhaar &amp; PAN e-KYC
                  </span>
                  <Fingerprint className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={identityStatus} />
                </div>
                <p className="text-[11px] text-slate-500">
                  {data?.identityVerifiedAt
                    ? `Verified ${when(data.identityVerifiedAt)}`
                    : "Surepass DigiLocker Aadhaar & PAN"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Manual Face Match
                  </span>
                  <Camera className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={faceReviewStatus} />
                </div>
                <p className="text-[11px] text-slate-500">
                  {faceMatched
                    ? "Live selfie matched with Aadhaar photo"
                    : "Compare live selfie vs Aadhaar photo"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    DigiLocker Vault Docs
                  </span>
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    value={
                      allDigilockerDocsApproved
                        ? "APPROVED"
                        : digilockerDocs.some((d) => d.reviewStatus === "REJECTED")
                          ? "REJECTED"
                          : "PENDING"
                    }
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {digilockerDocs.length > 0
                    ? `${approvedDigilockerDocsCount} of ${digilockerDocs.length} approved (${storedDigilockerDocsCount} stored)`
                    : "Aadhaar PDF, Aadhaar Photo & PAN PDF"}
                </p>
              </div>
            </div>

            {!personalIdentityVerified ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Action Required · Personal Identity Verification
                    </p>
                    <p className="text-xs text-slate-700 mt-0.5">
                      Personal Identity is automatically marked <strong>Verified</strong> once you mark Face Verification as <strong>MATCHED</strong> and approve all 3 DigiLocker documents (Aadhaar PDF, Aadhaar Photo, PAN PDF), or you can approve/reject Personal Identity directly below once face match is completed.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`px-2.5 py-1 rounded-full border ${
                        faceMatched
                          ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                          : "bg-amber-100 border-amber-300 text-amber-900"
                      }`}
                    >
                      Face Review: {faceReviewStatus}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border ${
                        allDigilockerDocsApproved
                          ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                          : "bg-amber-100 border-amber-300 text-amber-900"
                      }`}
                    >
                      Vault Docs Approved: {approvedDigilockerDocsCount} / {digilockerDocs.length}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    className="field text-xs bg-white flex-1 min-w-[16rem]"
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    placeholder="Admin review note (required when rejecting personal identity)"
                  />
                  <button
                    type="button"
                    disabled={busy || !faceMatched}
                    onClick={() => reviewPersonal(true)}
                    className="btn-primary text-xs"
                    title={!faceMatched ? "Mark Face Matched first before approving Personal Identity" : undefined}
                  >
                    Approve Personal Identity
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reviewPersonal(false)}
                    className="btn-secondary text-xs text-rose-600"
                  >
                    Reject Personal Identity
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-3.5 text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Personal Identity Verified:</strong> Individual e-KYC, live selfie face match, and DigiLocker documents have been verified and locked.
                  </span>
                </div>
                <StatusPill value="VERIFIED" />
              </div>
            )}
          </section>

      {/* 2. Personal & Identity Details + Manual Face Verification Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-navy-950">Personal & Identity Details</h3>
                <p className="text-xs text-slate-500">Demographics, Aadhaar DigiLocker, PAN verification, and permanent address</p>
              </div>
            </div>
            <StatusPill value={identityStatus} />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoField
              label="Full Name (Account)"
              value={user.full_name}
              subtext={user.code ? `Partner Code: ${user.code}` : undefined}
            />
            <InfoField
              label="Verified Name (Aadhaar / KYC)"
              value={String(identity.fullName || personal.fullName || user.full_name || "")}
            />
            <InfoField
              label="Date of Birth & Gender"
              value={
                [identity.dob || personal.dob, identity.gender || personal.gender]
                  .filter(Boolean)
                  .map(String)
                  .join(" · ") || null
              }
            />
            <InfoField
              label="Mobile Number"
              value={user.mobile}
              mono
              subtext="OTP Verified Login Mobile"
            />
            <InfoField
              label="Email Address"
              value={user.email || String(personal.email || "") || null}
            />
            <InfoField
              label="Territory / Hub"
              value={[user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ") || null}
              subtext={user.parent_name ? `Distributor: ${user.parent_name}` : undefined}
            />
            <InfoField
              label="Aadhaar (DigiLocker)"
              value={
                aadhaarLast4
                  ? String(identity.maskedAadhaar || `XXXX-XXXX-${aadhaarLast4}`)
                  : null
              }
              mono
              subtext={
                <>
                  {Boolean(identity.digilockerRef || personal.providerRef) && (
                    <span className="block truncate">
                      Ref: {String(identity.digilockerRef || personal.providerRef)}
                    </span>
                  )}
                  {(data?.aadhaarVerifiedAt || data?.identityVerifiedAt) && (
                    <span className="block text-emerald-700 font-medium">
                      Verified {when(data.aadhaarVerifiedAt || data.identityVerifiedAt || "")}
                    </span>
                  )}
                </>
              }
            />
            <InfoField
              label="PAN Verification"
              value={panLast4 ? `••••••${panLast4}` : String(personal.pan || "") || null}
              mono
              subtext={
                <>
                  {Boolean(identity.panName) && (
                    <span className="block truncate">Holder: {String(identity.panName)}</span>
                  )}
                  {panMatchScore != null && (
                    <span className="block text-emerald-700 font-medium">
                      Name Match: {panMatchScore}% · Source: {panSource === "MANUAL_UPLOAD" ? "Manual Upload" : "DigiLocker"}
                    </span>
                  )}
                  <span
                    className={`block font-semibold ${
                      aadhaarPanLinked ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    Aadhaar Linked to PAN: {aadhaarPanLinked ? "Yes (Last 4 Matched)" : "No"}
                  </span>
                </>
              }
            />
            <InfoField
              label="Verification Geo-Location"
              value={
                identityEvent?.latitude != null && identityEvent?.longitude != null
                  ? `${identityEvent.latitude}, ${identityEvent.longitude}`
                  : null
              }
              mono
              subtext={
                identityEvent?.latitude != null && identityEvent?.longitude != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${identityEvent.latitude},${identityEvent.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> Open in Maps
                  </a>
                ) : undefined
              }
            />
          </dl>

          {/* Structured Permanent Address (Extracted from Aadhaar DigiLocker) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Permanent Residential Address (Extracted from Aadhaar DigiLocker)
              </span>
              {Boolean(permAddrObj.source) && (
                <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {String(permAddrObj.source)}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-navy-950">
              {personalAddress || <span className="text-slate-400 font-normal">Permanent address not captured yet</span>}
            </p>
            {(Boolean(permAddrObj.careOf) ||
              Boolean(permAddrObj.house) ||
              Boolean(permAddrObj.street) ||
              Boolean(permAddrObj.locality) ||
              Boolean(permAddrObj.vtc) ||
              Boolean(permAddrObj.postOffice) ||
              Boolean(permAddrObj.district) ||
              Boolean(permAddrObj.state) ||
              Boolean(permAddrObj.pincode)) && (
              <div className="grid gap-2 sm:grid-cols-3 pt-1 border-t border-slate-200/60 text-xs text-slate-600">
                {Boolean(permAddrObj.careOf) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Care Of</span>
                    <span className="font-semibold text-navy-950">{String(permAddrObj.careOf)}</span>
                  </div>
                )}
                {(Boolean(permAddrObj.house) || Boolean(permAddrObj.street) || Boolean(permAddrObj.landmark)) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">House / Street / Landmark</span>
                    <span className="font-semibold text-navy-950">
                      {[permAddrObj.house, permAddrObj.street, permAddrObj.landmark].filter(Boolean).map(String).join(", ")}
                    </span>
                  </div>
                )}
                {(Boolean(permAddrObj.locality) || Boolean(permAddrObj.vtc) || Boolean(permAddrObj.postOffice)) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Locality / VTC / PO</span>
                    <span className="font-semibold text-navy-950">
                      {[permAddrObj.locality, permAddrObj.vtc, permAddrObj.postOffice].filter(Boolean).map(String).join(", ")}
                    </span>
                  </div>
                )}
                {(Boolean(permAddrObj.district) || Boolean(permAddrObj.subDistrict)) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sub-District / District</span>
                    <span className="font-semibold text-navy-950">
                      {[permAddrObj.subDistrict, permAddrObj.district].filter(Boolean).map(String).join(", ")}
                    </span>
                  </div>
                )}
                {Boolean(permAddrObj.state) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">State</span>
                    <span className="font-semibold text-navy-950">{String(permAddrObj.state)}</span>
                  </div>
                )}
                {Boolean(permAddrObj.pincode) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">PIN Code</span>
                    <span className="font-mono font-semibold text-navy-950">{String(permAddrObj.pincode)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Live Selfie & Manual Admin Face Comparison Card */}
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-navy-950">Manual Face Verification</h3>
                  <p className="text-xs text-slate-500">Compare live selfie vs Aadhaar photo</p>
                </div>
              </div>
              <StatusPill value={faceReviewStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Left: Live Camera Selfie */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  1. Live Camera Selfie
                </span>
                {data?.selfieUrl ? (
                  <div className="space-y-1.5">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 aspect-square">
                      <img
                        src={data.selfieUrl}
                        alt={`${user.full_name} live selfie`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <a
                      href={data.selfieUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Full resolution <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 aspect-square p-3 text-center">
                    <div className="space-y-1">
                      <Camera className="h-5 w-5 text-slate-400 mx-auto" />
                      <p className="text-[11px] font-semibold text-slate-500">No Live Selfie</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Aadhaar Card Photograph */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Aadhaar Photo (KYC)
                </span>
                {aadhaarPhotoUrl ? (
                  <div className="space-y-1.5">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 aspect-square">
                      <img
                        src={aadhaarPhotoUrl}
                        alt={`${user.full_name} Aadhaar photograph`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {aadhaarPdfDoc && (
                      <button
                        type="button"
                        onClick={() => openDigilockerDoc(aadhaarPdfDoc)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Open Aadhaar PDF <FileText className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 aspect-square p-3 text-center">
                    <div className="space-y-1.5">
                      <User className="h-5 w-5 text-slate-400 mx-auto" />
                      <p className="text-[11px] font-semibold text-slate-500">
                        {aadhaarPdfDoc ? "Compare with Aadhaar PDF" : "No Aadhaar Photo"}
                      </p>
                      {aadhaarPdfDoc && (
                        <button
                          type="button"
                          onClick={() => openDigilockerDoc(aadhaarPdfDoc)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] font-semibold text-navy-950 hover:border-emerald-400"
                        >
                          Open Aadhaar PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {data?.faceReview?.reviewedAt && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 space-y-0.5">
                <p>
                  Reviewed by{" "}
                  <strong className="text-navy-950">
                    {data.faceReview.reviewedByName || "Platform Admin"}
                  </strong>{" "}
                  · {when(data.faceReview.reviewedAt)}
                </p>
                {data.faceReview.note && (
                  <p className="text-slate-700">Note: {data.faceReview.note}</p>
                )}
              </div>
            )}
          </div>

          {/* Admin Face Review Decision Controls */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {faceReviewStatus === "PENDING" ? (
              <>
                <input
                  className="field text-xs"
                  value={faceNote}
                  onChange={(e) => setFaceNote(e.target.value)}
                  placeholder="Review note (required when marking mismatch)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy || !data?.selfieUrl}
                    onClick={() => setFaceConfirmAction("MATCHED")}
                    className="btn-primary text-xs py-2 justify-center"
                  >
                    Mark Face Matched
                  </button>
                  <button
                    type="button"
                    disabled={busy || !data?.selfieUrl}
                    onClick={() => setFaceConfirmAction("MISMATCH")}
                    className="btn-secondary text-xs py-2 text-rose-600 justify-center"
                  >
                    Face Mismatch
                  </button>
                </div>
              </>
            ) : (
              <div
                className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                  faceReviewStatus === "MATCHED"
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                    : "border-rose-200 bg-rose-50/80 text-rose-900"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {faceReviewStatus === "MATCHED"
                    ? "Face Match Approved (Decision Locked)"
                    : "Face Mismatch Recorded (Decision Locked)"}
                </span>
                <StatusPill value={faceReviewStatus} />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 3. Encrypted DigiLocker Documents Vault */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-navy-950">
                DigiLocker Verified Documents Vault
              </h3>
              <p className="text-xs text-slate-500">
                AES-256-GCM encrypted Aadhaar &amp; PAN documents fetched from Surepass DigiLocker (audited admin access)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {digilockerDocs.length > 0 && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {storedDigilockerDocsCount} / {digilockerDocs.length} Stored
              </span>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={refetchDigilockerDocs}
              className="btn-secondary inline-flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry / Re-fetch Vault
            </button>
          </div>
        </div>

        {/* Mandatory Documents Checklist Bar */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs">
            <span className="font-semibold text-navy-950">Aadhaar Card PDF (ADHAR)</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                dlSummary?.aadhaarPdfStored
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {dlSummary?.aadhaarPdfStored ? "Stored" : "Missing"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs">
            <span className="font-semibold text-navy-950">PAN Verification Record PDF (PANCR)</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                dlSummary?.panPdfStored
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {dlSummary?.panPdfStored ? "Stored" : "Missing"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs">
            <span className="font-semibold text-navy-950">Aadhaar Profile Photo</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                dlSummary?.aadhaarPhotoStored
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {dlSummary?.aadhaarPhotoStored ? "Stored" : "Not Stored"}
            </span>
          </div>
        </div>

        {digilockerDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-xs text-slate-500">
            No DigiLocker documents recorded in the vault for this partner yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {digilockerDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="space-y-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-navy-950 text-white">
                        {doc.docType} · {doc.fileType.toUpperCase()}
                      </span>
                      {doc.mandatory && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-navy-950 mt-1.5">
                      {doc.name || doc.description || doc.docType}
                    </p>
                    {doc.issuer && (
                      <p className="text-[11px] text-slate-500 truncate">{doc.issuer}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span>
                      Vault:{" "}
                      <strong
                        className={
                          doc.fetchStatus === "STORED"
                            ? "text-emerald-700"
                            : doc.fetchStatus === "FAILED"
                              ? "text-rose-600"
                              : "text-amber-700"
                        }
                      >
                        {doc.fetchStatus}
                      </strong>
                    </span>
                    <span>Size: {formatFileSize(doc.sizeBytes)}</span>
                    {doc.fetchedAt && <span>Updated {when(doc.fetchedAt)}</span>}
                  </div>

                  {doc.fetchError && (
                    <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
                      Fetch error: {doc.fetchError}
                    </p>
                  )}

                  {doc.reviewedAt && (
                    <p className="text-[11px] text-slate-600 border-t border-slate-200/70 pt-1.5">
                      Reviewed by <strong>{doc.reviewedByName || "Admin"}</strong> · {when(doc.reviewedAt)}
                      {doc.reviewNote ? ` · "${doc.reviewNote}"` : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                  {doc.fetchStatus === "STORED" ? (
                    <button
                      type="button"
                      onClick={() => openDigilockerDoc(doc)}
                      className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                    >
                      View Decrypted <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Not in vault yet</span>
                  )}
                  <StatusPill value={doc.reviewStatus || "PENDING"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}

      {section === "business" && (
        <>
          {/* 1. Business Verification Summary & Flag Control */}
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-lg font-bold text-navy-950">
                    Business Verification &amp; Compliance
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                      businessVerified
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-amber-50 border-amber-300 text-amber-800"
                    }`}
                  >
                    <Store className="h-3.5 w-3.5" />
                    Business Verified: {businessVerified ? "YES" : "PENDING"}
                  </span>
                  {businessType && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-bold text-navy-950">
                      {businessType === "COMPANY" ? "Registered as: Company / LLP" : "Registered as: Individual"}
                    </span>
                  )}
                  {Boolean(biz.can_update) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800">
                      <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      {Boolean(biz.locationUpdatePending)
                        ? "Location Update Submitted · Awaiting Approval"
                        : "Location Update Allowed (can_update: true)"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Individual work location &amp; address or MCA Company CIN &amp; Authorized Signatory KYC verification.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Business Verified Flag
                  </span>
                  <Store className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={businessVerified ? "BUSINESS_VERIFIED" : businessStatus} />
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {businessType === "COMPANY"
                    ? `Company · ${String(biz.legalName || companyDetails?.companyName || "")}`
                    : businessType === "INDIVIDUAL"
                      ? `Individual · ${String(biz.tradeName || biz.legalName || user.full_name)}`
                      : "Business registration status"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Authorized Signatory
                  </span>
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill
                    value={
                      signatory
                        ? signatory.isSelf
                          ? "VERIFIED"
                          : signatory.status === "KYC_COMPLETED" && signatory.faceReviewStatus === "MATCHED"
                            ? "VERIFIED"
                            : signatory.status
                        : personalIdentityVerified
                          ? "VERIFIED"
                          : "PENDING"
                    }
                  />
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {signatory
                    ? `${signatory.directorName} (${signatory.isSelf ? "Self" : "Director"})`
                    : `${String(biz.signatoryName || user.full_name)} (Self)`}
                </p>
              </div>

              {isRetailer ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Master Agreement
                    </span>
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill value={agreementStatus} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {agreementStatus === "SIGNED"
                      ? "Master Service Agreement executed"
                      : "Aadhaar eSign or compliance upload"}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Settlement Bank
                    </span>
                    <Landmark className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill value={bankStatus} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {banks.length > 0
                      ? `${banks.filter((b) => b.verification_status === "VERIFIED").length} of ${banks.length} account(s) penny-drop verified`
                      : "Penny-drop & holder name match"}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Personal Identity Prereq
                  </span>
                  <Fingerprint className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={personalIdentityVerified ? "VERIFIED" : "PENDING"} />
                </div>
                <p className="text-[11px] text-slate-500">
                  Face: {faceReviewStatus} · Vault PDFs: {mandatoryDocsReady ? "Stored" : "Pending"}
                </p>
              </div>
            </div>

            {canReviewBusiness ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      {biz.locationUpdatePending
                        ? `Action Required · Retailer Business Location Update Review (${businessStatus})`
                        : `Action Required · Business Verification Review (${businessStatus})`}
                    </p>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {biz.locationUpdatePending
                        ? "The retailer has updated their business location / operating address from their profile. Review the updated coordinates and address below and click Approve to unlock or retry provider onboarding."
                        : "Review the business registration details, work coordinates, and authorized signatory verification below before marking as Business Verified."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`px-2.5 py-1 rounded-full border ${
                        personalIdentityVerified
                          ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                          : "bg-amber-100 border-amber-300 text-amber-900"
                      }`}
                    >
                      Personal Identity: {personalIdentityVerified ? "Verified" : "Pending"}
                    </span>
                    {signatory && !signatory.isSelf && (
                      <>
                        <span
                          className={`px-2.5 py-1 rounded-full border ${
                            signatory.status === "KYC_COMPLETED"
                              ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                              : "bg-amber-100 border-amber-300 text-amber-900"
                          }`}
                        >
                          Signatory KYC: {signatory.status}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full border ${
                            signatory.faceReviewStatus === "MATCHED"
                              ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                              : "bg-amber-100 border-amber-300 text-amber-900"
                          }`}
                        >
                          Signatory Face: {signatory.faceReviewStatus || "PENDING"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    className="field text-xs bg-white flex-1 min-w-[16rem]"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Admin review note (required when rejecting)"
                  />
                  <button
                    type="button"
                    disabled={busy || !signatoryReadyForApproval}
                    onClick={() => reviewBusiness(true)}
                    className="btn-primary text-xs"
                  >
                    Approve Business
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => reviewBusiness(false)}
                    className="btn-secondary text-xs text-rose-600"
                  >
                    Reject Business
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-3.5 text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Business Verified:</strong> Business registration and authorized signatory compliance checks have been approved.
                    {data?.businessReviewNote ? ` · Note: "${data.businessReviewNote}"` : ""}
                  </span>
                </div>
                <StatusPill value="BUSINESS_VERIFIED" />
              </div>
            )}
          </section>

          {/* Company Registration Card (MCA Details + Directors + Authorized Signatory KYC) */}
          {businessType === "COMPANY" && (
            <>
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-navy-950">
                        MCA Company Master Data &amp; Board of Directors
                      </h3>
                      <p className="text-xs text-slate-500">
                        Verified via Surepass Corporate Company Details API from CIN / LLPIN
                      </p>
                    </div>
                  </div>
                  <StatusPill value={String(companyDetails?.status || "ACTIVE")} />
                </div>

                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField
                    label="Company Name"
                    value={String(companyDetails?.companyName || biz.legalName || "") || null}
                  />
                  <InfoField
                    label="CIN / LLPIN"
                    value={String(companyDetails?.cin || biz.cin || "") || null}
                    mono
                  />
                  <InfoField
                    label="Class / RoC"
                    value={
                      [companyDetails?.classOfCompany, companyDetails?.rocCode].filter(Boolean).map(String).join(" · ") ||
                      null
                    }
                  />
                  <InfoField
                    label="Date of Incorporation"
                    value={String(companyDetails?.dateOfIncorporation || "") || null}
                  />
                  <InfoField
                    label="Surepass Provider Ref"
                    value={String(companyDetails?.providerRef || "") || null}
                    mono
                  />
                  <InfoField
                    label="Work Coordinates"
                    value={
                      workLat != null && workLng != null
                        ? `${workLat}, ${workLng}`
                        : businessEvent?.latitude != null && businessEvent?.longitude != null
                          ? `${businessEvent.latitude}, ${businessEvent.longitude}`
                          : null
                    }
                    mono
                    subtext={
                      (workLat != null && workLng != null) ||
                      (businessEvent?.latitude != null && businessEvent?.longitude != null) ? (
                        <a
                          href={`https://www.google.com/maps?q=${workLat ?? businessEvent?.latitude},${workLng ?? businessEvent?.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> Open in Maps
                        </a>
                      ) : undefined
                    }
                  />
                </dl>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    MCA Registered Office Address
                  </span>
                  <p className="text-sm font-medium text-navy-950">
                    {String(companyDetails?.registeredAddress || businessAddressFormatted || "—")}
                  </p>
                </div>

                {companyDirectors.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Active Board of Directors ({companyDirectors.length})
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {companyDirectors.map((dir) => {
                        const isSelected = Boolean(dir.selected || (signatory && signatory.din === dir.din));
                        return (
                          <div
                            key={dir.din}
                            className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                              isSelected
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-slate-200 bg-slate-50/60"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-bold text-navy-950">{dir.name}</p>
                              <p className="font-mono text-xs text-slate-500">
                                DIN: {dir.din}
                                {dir.startDate ? ` · Appointed: ${dir.startDate}` : ""}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Authorized Signatory
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* Authorized Signatory KYC Review Card */}
              {signatory && (
                <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Fingerprint className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-navy-950">
                          Authorized Signatory KYC Verification — {signatory.directorName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {signatory.isSelf
                            ? "Selected director is the logged-in partner (verified via Personal Identity KYC)"
                            : "Separate director KYC verification via DigiLocker Aadhaar, PAN Comprehensive, and Live Selfie"}
                        </p>
                      </div>
                    </div>
                    <StatusPill value={signatory.status} />
                  </div>

                  {signatory.isSelf ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center justify-between gap-3 text-xs text-emerald-950">
                      <div>
                        <p className="font-bold">
                          {signatory.directorName} (DIN: {signatory.din || "—"}) is the primary account holder
                        </p>
                        <p className="text-emerald-800 mt-0.5">
                          Name Match Score against Partner Personal KYC: <strong>{signatory.nameMatchScore ?? 100}%</strong>. Their verified Personal Identity KYC serves as the Authorized Signatory KYC.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 font-bold text-emerald-800 shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Self · KYC Verified
                      </span>
                    </div>
                  ) : (
                    <>
                      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoField label="MCA Director Name" value={signatory.directorName} subtext={signatory.din ? `DIN: ${signatory.din}` : undefined} />
                        <InfoField
                          label="Verified Aadhaar / PAN Name"
                          value={signatory.verifiedName || null}
                          subtext={
                            signatory.nameMatchScore != null ? (
                              <span className={signatory.nameMatchScore >= 80 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                                Director Name Match: {signatory.nameMatchScore}%
                              </span>
                            ) : undefined
                          }
                        />
                        <InfoField
                          label="Aadhaar / PAN Last 4"
                          value={
                            signatory.aadhaarLast4 || signatory.panLast4
                              ? `Aadhaar: •••• ${signatory.aadhaarLast4 || "—"} · PAN: ••••${signatory.panLast4 || "—"}`
                              : null
                          }
                          mono
                          subtext={
                            signatory.status === "KYC_COMPLETED" ? (
                              <span className={signatory.aadhaarPanLinked ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                                Aadhaar-PAN Linked: {signatory.aadhaarPanLinked ? "YES" : "NO"}
                              </span>
                            ) : undefined
                          }
                        />
                        <InfoField
                          label="Signatory Mobile & Status"
                          value={signatory.maskedMobile || "—"}
                          mono
                          subtext={`Step: ${signatory.currentStep || signatory.status}`}
                        />
                      </dl>

                      {signatory.status === "KYC_COMPLETED" && (
                        <>
                          {/* Side-by-Side Signatory Live Selfie vs Aadhaar Photo */}
                          <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950">
                                  Signatory Face Verification (Live Selfie vs Aadhaar Photo)
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Compare the authorized signatory&apos;s live camera selfie with their DigiLocker Aadhaar photo.
                                </p>
                              </div>
                              <StatusPill value={signatory.faceReviewStatus || "PENDING"} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  Signatory Live Camera Selfie
                                </span>
                                {signatory.selfieUrl ? (
                                  <img
                                    src={signatory.selfieUrl}
                                    alt="Signatory Live Selfie"
                                    className="mx-auto h-44 w-44 rounded-2xl object-cover border border-slate-200 shadow-xs"
                                  />
                                ) : (
                                  <div className="mx-auto grid h-44 w-44 place-items-center rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                                    No selfie uploaded
                                  </div>
                                )}
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  Signatory Aadhaar Photo (DigiLocker Vault)
                                </span>
                                {sigAadhaarPhotoUrl ? (
                                  <img
                                    src={sigAadhaarPhotoUrl}
                                    alt="Signatory Aadhaar Photo"
                                    className="mx-auto h-44 w-44 rounded-2xl object-cover border border-slate-200 shadow-xs"
                                  />
                                ) : (
                                  <div className="mx-auto grid h-44 w-44 place-items-center rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                                    No Aadhaar photo in vault
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                              <input
                                className="field text-xs flex-1 min-w-[14rem]"
                                value={sigFaceNote}
                                onChange={(e) => setSigFaceNote(e.target.value)}
                                placeholder="Signatory face review note (required when marking Mismatch)"
                              />
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => submitSignatoryFaceReview(true)}
                                className="btn-primary text-xs"
                              >
                                Mark Signatory Face Matched
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => submitSignatoryFaceReview(false)}
                                className="btn-secondary text-xs text-rose-600"
                              >
                                Mark Face Mismatch
                              </button>
                            </div>
                          </div>

                          {/* Signatory DigiLocker Documents */}
                          {signatoryDocs.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Signatory DigiLocker Vault Documents ({signatoryDocs.length})
                              </h4>
                              <div className="grid gap-3 sm:grid-cols-3">
                                {signatoryDocs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-3"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-navy-950 text-white">
                                          {doc.docType} · {doc.fileType.toUpperCase()}
                                        </span>
                                        <StatusPill value={doc.reviewStatus || "PENDING"} />
                                      </div>
                                      <p className="text-xs font-bold text-navy-950 mt-2">{doc.name || doc.docType}</p>
                                      <p className="text-[11px] text-slate-500">{doc.issuer || "DigiLocker"}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                                      {doc.fetchStatus === "STORED" ? (
                                        <button
                                          type="button"
                                          onClick={() => openDigilockerDoc(doc)}
                                          className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                                        >
                                          View Decrypted <ExternalLink className="h-3 w-3" />
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">Not in vault</span>
                                      )}
                                      <span className="text-[11px] font-mono text-slate-400">
                                        {formatFileSize(doc.sizeBytes)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </section>
              )}
            </>
          )}

      {/* 4. Business Registration & Work Location Details */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-navy-950">Business Registration & Work Location Details</h3>
              <p className="text-xs text-slate-500">
                Registration mode, work coordinates, work address, authorized signatory, and statutory details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {businessType && (
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy-950">
                {businessType}
              </span>
            )}
            <StatusPill value={businessVerified ? "BUSINESS_VERIFIED" : businessStatus} />
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField
            label="Business Registration Mode"
            value={
              businessType
                ? businessType === "COMPANY"
                  ? "Company (MCA CIN / LLPIN)"
                  : "Individual"
                : biz.entityType
                  ? String(biz.entityType).replaceAll("_", " ")
                  : user.kyc?.entity_type || null
            }
          />
          <InfoField
            label="Legal / Registered Name"
            value={String(biz.legalName || companyDetails?.companyName || "") || null}
          />
          <InfoField
            label="Trade / Shop Name"
            value={String(biz.tradeName || data?.shopName || user.kyc?.shop_name || "") || null}
          />
          <InfoField
            label="Authorized Signatory"
            value={String(signatory?.directorName || biz.signatoryName || agreement.signatoryName || "") || null}
            subtext={
              signatory?.isSelf || biz.isSelfSignatory ? (
                <span className="text-emerald-700 font-semibold">Self (Partner Personal KYC Verified)</span>
              ) : signatory ? (
                <span className="text-sky-700 font-semibold">Director ({signatory.status})</span>
              ) : undefined
            }
          />
          <InfoField
            label="Work Geo-Location (Lat, Lng)"
            value={
              workLat != null && workLng != null
                ? `${workLat}, ${workLng}`
                : businessEvent?.latitude != null && businessEvent?.longitude != null
                  ? `${businessEvent.latitude}, ${businessEvent.longitude}`
                  : null
            }
            mono
            subtext={
              (workLat != null && workLng != null) ||
              (businessEvent?.latitude != null && businessEvent?.longitude != null) ? (
                <span className="inline-flex flex-wrap items-center gap-2">
                  {workLocSource && (
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {workLocSource === "KYC_LOCATION" ? "Same as Personal KYC GPS" : "Live Work GPS"}
                    </span>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${workLat ?? businessEvent?.latitude},${workLng ?? businessEvent?.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> Open in Maps
                  </a>
                </span>
              ) : undefined
            }
          />
          <InfoField
            label="Admin Business Review"
            value={
              data?.businessReviewedAt
                ? `Reviewed ${when(data.businessReviewedAt)}`
                : businessStatus === "BUSINESS_VERIFIED"
                  ? "Approved"
                  : null
            }
            subtext={data?.businessReviewNote ? `Note: ${data.businessReviewNote}` : undefined}
          />
          {(biz.gstin || data?.gstin || user.kyc?.gstin) && (
            <InfoField
              label="GSTIN"
              value={String(biz.gstin || data?.gstin || user.kyc?.gstin || "") || null}
              mono
              subtext={
                registry.gstin ? (
                  <span className="text-emerald-700 font-medium">
                    Verified ({String(registry.gstin.status || "ACTIVE")}) · {String(registry.gstin.legalName || "")}
                  </span>
                ) : undefined
              }
            />
          )}
          {Boolean(biz.udyam) && (
            <InfoField
              label="Udyam Registration"
              value={String(biz.udyam || "") || null}
              mono
              subtext={
                registry.udyam ? (
                  <span className="text-emerald-700 font-medium">
                    Verified · {String(registry.udyam.enterpriseName || "")}
                  </span>
                ) : undefined
              }
            />
          )}
          {Boolean(biz.cin || companyDetails?.cin) && (
            <InfoField
              label="Company CIN / LLPIN"
              value={String(companyDetails?.cin || biz.cin || "") || null}
              mono
              subtext={
                registry.cin ? (
                  <span className="text-emerald-700 font-medium">
                    Verified ({String(registry.cin.status || "ACTIVE")}) · {String(registry.cin.companyName || "")}
                  </span>
                ) : undefined
              }
            />
          )}
        </dl>

        {/* Work / Business Operating Address */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Work / Business Operating Address
            </span>
            {businessAddressFormatted && (
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  sameAsPersonal
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-sky-50 border-sky-200 text-sky-800"
                }`}
              >
                {sameAsPersonal ? "Same as Aadhaar Permanent Address" : "Custom Work / Business Premises Address"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-navy-950">
            {businessAddressFormatted || (
              <span className="text-slate-400 font-normal">Work / business address not submitted yet</span>
            )}
          </p>
          {(Boolean(shopAddrObj.line1) ||
            Boolean(shopAddrObj.line2) ||
            Boolean(shopAddrObj.landmark) ||
            Boolean(shopAddrObj.city) ||
            Boolean(shopAddrObj.district) ||
            Boolean(shopAddrObj.state) ||
            Boolean(shopAddrObj.pincode)) && (
            <div className="grid gap-2 sm:grid-cols-3 pt-1 border-t border-slate-200/60 text-xs text-slate-600">
              {(Boolean(shopAddrObj.line1) || Boolean(shopAddrObj.line2)) && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Premises / Street</span>
                  <span className="font-semibold text-navy-950">
                    {[shopAddrObj.line1, shopAddrObj.line2].filter(Boolean).map(String).join(", ")}
                  </span>
                </div>
              )}
              {Boolean(shopAddrObj.landmark) && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Landmark</span>
                  <span className="font-semibold text-navy-950">{String(shopAddrObj.landmark)}</span>
                </div>
              )}
              {(Boolean(shopAddrObj.city) || Boolean(shopAddrObj.district)) && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">City / District</span>
                  <span className="font-semibold text-navy-950">
                    {[shopAddrObj.city, shopAddrObj.district].filter(Boolean).map(String).join(" · ")}
                  </span>
                </div>
              )}
              {Boolean(shopAddrObj.state) && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">State</span>
                  <span className="font-semibold text-navy-950">{String(shopAddrObj.state)}</span>
                </div>
              )}
              {Boolean(shopAddrObj.pincode) && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">PIN Code</span>
                  <span className="font-mono font-semibold text-navy-950">{String(shopAddrObj.pincode)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Uploaded Shop Photo & Business Documents */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Shop Photo & Uploaded Business Documents ({documents.length})
            </h4>
          </div>
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center text-xs text-slate-500">
              No shop photo or business documents uploaded yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5"
                >
                  {doc.doc_type === "SHOP_PHOTO" && doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-slate-200 bg-white p-1"
                    >
                      <img
                        src={doc.url}
                        alt="Shop photo"
                        className="h-36 w-full rounded-lg object-cover"
                      />
                    </a>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-navy-950 truncate">
                        {doc.doc_type.replaceAll("_", " ")}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {doc.filename || "Document"} {doc.created_at ? `· ${when(doc.created_at)}` : ""}
                      </p>
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Agreement Details (Retailers & Distributors) + Settlement Bank Accounts (Distributors Only) */}
      {isRetailer ? (
        <AgreementAdminCard
          userId={userId}
          userRole={user.user_type}
          token={token}
          businessVerified={businessVerified}
          businessStatus={businessStatus}
          refreshKey={refreshKey}
          onChanged={() => {
            refresh();
            onChanged();
          }}
          onDone={onDone}
          onFail={onFail}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Partner Master Service Agreement Card */}
          <AgreementAdminCard
            userId={userId}
            userRole={user.user_type}
            token={token}
            businessVerified={businessVerified}
            businessStatus={businessStatus}
            refreshKey={refreshKey}
            onChanged={() => {
              refresh();
              onChanged();
            }}
            onDone={onDone}
            onFail={onFail}
          />

          {/* Settlement Bank Accounts Card (Distributors only — Retailers have a dedicated Banking tab) */}
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-navy-950">Settlement Bank Accounts</h3>
                  <p className="text-xs text-slate-500">Penny-drop verified bank accounts for wallet &amp; payouts</p>
                </div>
              </div>
              <StatusPill value={bankStatus} />
            </div>

            {banks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-xs text-slate-500">
                No settlement bank accounts registered by this partner yet.
              </div>
            ) : (
              <div className="space-y-3">
                {banks.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-navy-950">
                          {b.bank_name || "Bank Account"}{" "}
                          {b.ifsc && <span className="font-mono text-xs font-normal text-slate-500">({b.ifsc})</span>}
                        </p>
                        <p className="font-mono text-xs text-slate-700 mt-0.5">
                          A/C: {b.account_number || "—"} · Holder: {b.account_name || "—"}
                        </p>
                      </div>
                      <StatusPill value={b.verification_status || "NOT_VERIFIED"} />
                    </div>
                    {(b.verified_name || b.name_match_score != null || b.provider_ref) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 border-t border-slate-200/70 pt-2">
                        {b.verified_name && (
                          <span>
                            Bank Verified Name: <strong className="text-navy-950">{b.verified_name}</strong>
                          </span>
                        )}
                        {b.name_match_score != null && (
                          <span>
                            Name Match: <strong className="text-emerald-700">{b.name_match_score}%</strong>
                          </span>
                        )}
                        {b.provider_ref && <span className="font-mono text-slate-400">Ref: {b.provider_ref}</span>}
                        {b.verified_at && <span>Verified {when(b.verified_at)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
        </>
      )}

      {/* Decrypted DigiLocker Document Modal Viewer */}
      {viewerDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/75 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-navy-950 text-white">
                    {viewerDoc.docType} · {viewerDoc.fileType.toUpperCase()}
                  </span>
                  <h3 className="font-display text-base font-bold text-navy-950">
                    {viewerDoc.name || viewerDoc.docType}
                  </h3>
                  <StatusPill value={viewerDoc.reviewStatus || "PENDING"} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Decrypted on-the-fly from AES-256-GCM vault · Access logged in audit trail
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewer}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Close Viewer
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-4 min-h-[420px] flex items-center justify-center">
              {viewerLoading ? (
                <div className="text-center space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Decrypting document from vault…</p>
                </div>
              ) : viewerError ? (
                <Alert tone="error">{viewerError}</Alert>
              ) : viewerXmlText !== null ? (
                <pre className="w-full max-h-[60vh] overflow-auto rounded-2xl bg-navy-950 p-4 font-mono text-xs text-emerald-200 whitespace-pre-wrap break-all">
                  {viewerXmlText}
                </pre>
              ) : viewerUrl ? (
                viewerDoc.fileType.toLowerCase() === "pdf" ||
                (viewerDoc.mimeType && viewerDoc.mimeType.includes("pdf")) ? (
                  <iframe
                    src={viewerUrl}
                    title={viewerDoc.name || viewerDoc.docType}
                    className="h-[65vh] w-full rounded-xl border border-slate-300 bg-white"
                  />
                ) : (
                  <img
                    src={viewerUrl}
                    alt={viewerDoc.name || viewerDoc.docType}
                    className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-md"
                  />
                )
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
              {!viewerDoc.reviewStatus || viewerDoc.reviewStatus === "PENDING" ? (
                <>
                  <input
                    className="field text-xs flex-1 min-w-[16rem]"
                    value={viewerReviewNote}
                    onChange={(e) => setViewerReviewNote(e.target.value)}
                    placeholder="Admin review note (required when rejecting)"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={docActionBusyId === viewerDoc.id}
                      onClick={() => submitDocReview(viewerDoc, true, viewerReviewNote)}
                      className="btn-primary text-xs"
                    >
                      Approve Document
                    </button>
                    <button
                      type="button"
                      disabled={docActionBusyId === viewerDoc.id}
                      onClick={() => submitDocReview(viewerDoc, false, viewerReviewNote)}
                      className="btn-secondary text-xs text-rose-600"
                    >
                      Reject Document
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>
                      This document has already been{" "}
                      <strong className="text-navy-950">{viewerDoc.reviewStatus.toLowerCase()}</strong>
                      {viewerDoc.reviewedByName ? ` by ${viewerDoc.reviewedByName}` : ""}
                      {viewerDoc.reviewedAt ? ` on ${when(viewerDoc.reviewedAt)}` : ""}
                      {viewerDoc.reviewNote ? ` · Note: "${viewerDoc.reviewNote}"` : ""}. Further approval or rejection is locked.
                    </span>
                  </div>
                  <StatusPill value={viewerDoc.reviewStatus} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Face Verification Confirmation Modal */}
      {faceConfirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                  faceConfirmAction === "MATCHED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-navy-950">
                  {faceConfirmAction === "MATCHED"
                    ? "Confirm Face Match Approval"
                    : "Confirm Face Mismatch & Re-verification"}
                </h3>
                <p className="text-xs text-slate-500">Final one-time compliance decision</p>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-3.5 text-xs space-y-1.5 ${
                faceConfirmAction === "MATCHED"
                  ? "border-amber-200 bg-amber-50/90 text-amber-950"
                  : "border-rose-200 bg-rose-50/90 text-rose-950"
              }`}
            >
              <p className="font-bold">Please confirm carefully before proceeding:</p>
              <p>
                {faceConfirmAction === "MATCHED"
                  ? "Once you approve this face match, the decision is locked and you will not be able to approve or reject face verification again for this selfie."
                  : "Marking a face mismatch will immediately lock this decision, revoke the partner's active sessions, and require them to complete full re-verification (/reverify)."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {faceConfirmAction === "MISMATCH"
                  ? "Mismatch Reason (Required)"
                  : "Admin Review Note (Optional)"}
              </label>
              <input
                className="field text-xs"
                value={faceNote}
                onChange={(e) => setFaceNote(e.target.value)}
                placeholder={
                  faceConfirmAction === "MISMATCH"
                    ? "Enter reason why live selfie does not match Aadhaar photo"
                    : "Optional note for compliance audit log"
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => setFaceConfirmAction(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || (faceConfirmAction === "MISMATCH" && !faceNote.trim())}
                onClick={() => submitFaceReview(faceConfirmAction === "MATCHED")}
                className={
                  faceConfirmAction === "MATCHED"
                    ? "btn-primary text-xs px-4 py-2"
                    : "btn-secondary text-xs px-4 py-2 border-rose-300 bg-rose-600 text-white hover:bg-rose-700"
                }
              >
                {busy
                  ? "Submitting…"
                  : faceConfirmAction === "MATCHED"
                    ? "Confirm & Lock Approval"
                    : "Confirm Mismatch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type DistributorModal = "hub" | "password" | "adjust" | "freeze" | "inactivate" | "retailer" | "reverify" | null;

type RetailerModal = "transfer" | "password" | "adjust" | "freeze" | "inactivate" | "reactivate" | "activation" | "redo-bank2" | "redo-bank6" | "reverify" | "request-location" | null;

export function AdminDistributorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useSession((s) => s.token);
  const platformAdmin = isSuperAdminOrPlatformAdmin(useSession((s) => s.user?.userType));
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [hubId, setHubId] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("CREDIT");
  const [narration, setNarration] = useState("");
  const [retailerDraft, setRetailerDraft] = useState<RetailerDraft>(emptyRetailerDraft);
  const [modal, setModal] = useState<DistributorModal>(null);
  const [tab, setTab] = useState<"personal" | "business" | "retailers" | "customers" | "transactions" | "audit">("personal");
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);
  const [reverifyTick, setReverifyTick] = useState(0);

  async function load() {
    const [u, h] = await Promise.all([
      api<UserDetail>(`/api/v1/admin/users/${id}`, { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
    ]);
    setUser(u);
    setHubs(h);
    setHubId(u.hub_id ?? "");
  }

  useEffect(() => {
    if (token && id) {
      load().catch((e) => setLoadError(formatApiError(e, "Failed to load distributor")));
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || tab !== "customers") return;
    setCustomersLoading(true);
    setCustomersError(null);
    api<RetailerCustomer[]>(`/api/v1/customers?distributorId=${id}`, { token })
      .then(setCustomers)
      .catch((e) => setCustomersError(formatApiError(e, "Could not load customers")))
      .finally(() => setCustomersLoading(false));
  }, [token, id, tab]);

  async function patchStatus(status: string) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/status`, { token, method: "PATCH", body: JSON.stringify({ status }) }));
      setModal(null);
      flash.ok(`Distributor is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function saveHub(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/hub`, { token, method: "PATCH", body: JSON.stringify({ hubId }) }));
      setModal(null);
      flash.ok("Hub assignment updated. Downline outlets moved with them.");
    } catch (e) {
      flash.fail(e, "Could not move hub");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, { token, method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setModal(null);
      flash.ok("Password reset. Share it out of band.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  async function adjust(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/adjust`, {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), direction, narration }),
      }));
      setAmount("");
      setNarration("");
      setModal(null);
      flash.ok("Wallet adjustment posted to the ledger.");
    } catch (e) {
      flash.fail(e, "Adjustment failed");
    }
  }

  async function createRetailer(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<{ id: string }>("/api/v1/admin/users/retailers", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: retailerDraft.fullName.trim(),
          mobile: retailerDraft.mobile,
          email: retailerDraft.email.trim(),
          password: retailerDraft.password,
          distributorId: id,
          city: retailerDraft.city.trim(),
          state: retailerDraft.state,
          pincode: retailerDraft.pincode,
        }),
      });
      openDetails(`/admin/retailers/${created.id}`, (href) => router.push(href));
    } catch (e) {
      flash.fail(e, "Could not create retailer");
    }
  }

  async function freeze(frozen: boolean) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/freeze`, { token, method: "PATCH", body: JSON.stringify({ frozen }) }));
      setModal(null);
      flash.ok(frozen ? "Wallet frozen." : "Wallet unfrozen.");
    } catch (e) {
      flash.fail(e, "Could not change wallet");
    }
  }

  async function requireReverification(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/require-reverification`, {
        token,
        method: "POST",
        body: "{}",
      });
      setModal(null);
      setReverifyTick((n) => n + 1);
      await load();
      flash.ok("Partner flagged for mandatory re-verification. Their services are locked until they complete /reverify.");
    } catch (err) {
      flash.fail(err, "Could not require re-verification");
    }
  }

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function copyCode() {
    if (!user?.code) return;
    await navigator.clipboard.writeText(user.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const hubLine = [user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ");
  const isFrozen = user.wallet?.status === "FROZEN";
  const manageActions: ManageAction[] = [
    {
      label: "New Retailer",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => setModal("retailer"),
    },
    ...(user.status !== "ACTIVE"
      ? [
        {
          label: "Activate distributor",
          icon: <BadgeCheck className="h-4 w-4" />,
          onClick: () => patchStatus("ACTIVE"),
        },
      ]
      : []),
    {
      label: "Change hub",
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => setModal("hub"),
    },
    {
      label: "Adjust wallet",
      icon: <Wallet className="h-4 w-4" />,
      onClick: () => setModal("adjust"),
    },
    {
      label: isFrozen ? "Unfreeze wallet" : "Freeze wallet",
      icon: isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
      onClick: () => setModal("freeze"),
    },
    ...(user.status === "ACTIVE"
      ? [
        {
          label: "Inactivate",
          icon: <UserX className="h-4 w-4" />,
          onClick: () => setModal("inactivate"),
          tone: "danger" as const,
        },
      ]
      : []),
    {
      label: "Reset password",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => setModal("password"),
    },
    {
      label: "Require re-verification",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => setModal("reverify"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/distributors"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Distributors
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Simplified Profile Card with Manage Button on the Top Right */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Master Distributor
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  Boolean(user.kyc?.personal_identity_verified ?? user.personal_identity_verified)
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Fingerprint className="h-3 w-3" />
                Personal: {Boolean(user.kyc?.personal_identity_verified ?? user.personal_identity_verified) ? "Verified" : "Pending"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  Boolean(
                    user.kyc?.business_verified ??
                      user.business_verified ??
                      (user.kyc?.business_status || user.business_status) === "BUSINESS_VERIFIED",
                  )
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Store className="h-3 w-3" />
                Business: {Boolean(
                  user.kyc?.business_verified ??
                    user.business_verified ??
                    (user.kyc?.business_status || user.business_status) === "BUSINESS_VERIFIED",
                ) ? "Verified" : "Pending"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  (user.kyc?.bank_verification_status || user.bank_verification_status) === "VERIFIED"
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Landmark className="h-3 w-3" />
                Bank: {(user.kyc?.bank_verification_status || user.bank_verification_status) === "VERIFIED" ? "Verified" : "Pending"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  (user.kyc?.agreement_status || user.agreement_status) === "SIGNED"
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <FileText className="h-3 w-3" />
                Agreement: {(user.kyc?.agreement_status || user.agreement_status) === "SIGNED" ? "Signed" : "Pending"}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {user.full_name}
              </h1>
            </div>

            {/* Hub Territory Row */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">{hubLine || "Unassigned Hub"}</span>
            </div>

            {/* Row 1: GFINCODE & PHONE with copy */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{user.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy GFIN Code"
                    onClick={copyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{maskMobile(user.mobile)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Mobile"
                  onClick={copyMobile}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>

              {user.wallet && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Wallet className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>
                    Float: <strong className="text-white">{inr(user.wallet.availableBalance)}</strong>
                  </span>
                </span>
              )}
            </div>

            {/* Row 2: Time and User who created it */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{when(user.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-white">
                    {user.created_by_name || user.created_by || "Platform Admin"}
                  </span>
                  {user.created_by_code && (
                    <span className="font-mono text-[10px] text-slate-400 ml-1">({user.created_by_code})</span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>

      {/* Tabs & Content */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
          {(["personal", "business", "retailers", "customers", "transactions", ...(platformAdmin ? ["audit"] as const : [])] as const).map((key) => {
            const isActive = tab === key;
            const count =
              key === "retailers"
                ? user.retailers?.length ?? 0
                : key === "customers"
                  ? customers.length
                  : key === "transactions"
                    ? user.recentTransactions?.length ?? 0
                    : 0;
            const label =
              key === "personal"
                ? "Personal"
                : key === "business"
                  ? "Business"
                  : key === "retailers"
                    ? "Retailers"
                    : key === "customers"
                      ? "Customers"
                      : key === "audit"
                        ? "Audit"
                        : "Transactions";
            return (
              <button
                key={key}
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${isActive
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                  }`}
                onClick={() => setTab(key)}
              >
                {label}
                {isActive && key !== "audit" && key !== "personal" && key !== "business" && ` (${count})`}
              </button>
            );
          })}
        </div>

        {(tab === "personal" || tab === "business") && id ? (
          <PartnerInfoTab
            section={tab}
            user={user}
            userId={id}
            token={token}
            refreshKey={reverifyTick}
            onChanged={() => load().catch(() => undefined)}
            onDone={(m) => flash.ok(m)}
            onFail={(e, f) => flash.fail(e, f)}
          />
        ) : tab === "audit" && platformAdmin && id ? (
          <ActivityHistory token={token} userId={id} />
        ) : tab === "retailers" ? (
          !user.retailers?.length ? (
            <EmptyState title="No retailers yet" body="Add a retailer to place under this distributor." />
          ) : (
            <DataTable
              columns={["Retailer", "Code", "Location", "Mobile", "eKYC", "Status", "Action"]}
              rows={user.retailers.map((r) => [
                <span key={`${r.id}-name`} className="font-semibold text-navy-950">{r.full_name}</span>,
                <span key={`${r.id}-code`} className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {r.code ?? "—"}
                </span>,
                retailerLocationLine({
                  city: r.city ?? r.retailer_city,
                  state: r.state ?? r.retailer_state,
                  pincode: r.pincode ?? r.retailer_pincode,
                }) || "—",
                maskMobile(r.mobile),
                <EkycBadge key={`${r.id}-kyc`} status={r.kyc_status} />,
                <StatusPill key={r.id} value={r.status} />,
                <ViewLink key={`${r.id}-v`} href={`/admin/retailers/${r.id}`} />,
              ])}
            />
          )
        ) : tab === "customers" ? (
          customersError ? (
            <Alert tone="error">{customersError}</Alert>
          ) : customersLoading ? (
            <div className="card h-32 animate-pulse bg-slate-100" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" body="Customers appear when this distributor or their retailers add them at the desk." />
          ) : (
            <DataTable
              columns={["Customer", "Mobile", "Location", "Retailer", "Created By", "eKYC", "Created On"]}
              rows={customers.map((c) => [
                <span key={`${c.id}-name`} className="font-semibold text-navy-950">{c.full_name}</span>,
                maskMobile(c.mobile),
                [c.city, c.state].filter(Boolean).join(", ") || "—",
                c.retailer_name ?? "—",
                c.created_by ?? "—",
                <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
                c.created_at ? when(c.created_at) : "—",
              ])}
            />
          )
        ) : !user.recentTransactions?.length ? (
          <EmptyState title="No transactions yet" body="Ledger activity for this distributor appears here." />
        ) : (
          <DataTable
            columns={["When", "Type", "Status", "Amount", "Action"]}
            rows={user.recentTransactions.map((t) => [
              when(t.created_at),
              t.txn_type.replaceAll("_", " "),
              <StatusPill key={t.id} value={t.state} />,
              inr(t.amount),
              <ViewLink key={`${t.id}-v`} href={`/admin/transactions/${t.id}`} />,
            ])}
          />
        )}
      </section>

      {id && (
        <AgentEkycModal
          open={ekycOpen}
          userId={id}
          userName={user.full_name}
          userType={user.user_type}
          email={user.email}
          token={token}
          onClose={() => setEkycOpen(false)}
          onVerified={() => { load().catch(() => undefined); }}
        />
      )}

      <DistributorModals
        user={user}
        modal={modal}
        setModal={setModal}
        hubs={hubs}
        hubId={hubId}
        setHubId={setHubId}
        password={password}
        setPassword={setPassword}
        amount={amount}
        setAmount={setAmount}
        direction={direction}
        setDirection={setDirection}
        narration={narration}
        setNarration={setNarration}
        retailerDraft={retailerDraft}
        setRetailerDraft={setRetailerDraft}
        saveHub={saveHub}
        resetPassword={resetPassword}
        adjust={adjust}
        createRetailer={createRetailer}
        freeze={freeze}
        patchStatus={patchStatus}
        requireReverification={requireReverification}
      />
    </div>
  );
}

function DistributorModals(props: {
  user: UserDetail;
  modal: DistributorModal;
  setModal: (m: DistributorModal) => void;
  hubs: Hub[];
  hubId: string;
  setHubId: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  direction: string;
  setDirection: (v: string) => void;
  narration: string;
  setNarration: (v: string) => void;
  retailerDraft: RetailerDraft;
  setRetailerDraft: (v: RetailerDraft) => void;
  saveHub: (e: FormEvent) => void;
  resetPassword: (e: FormEvent) => void;
  adjust: (e: FormEvent) => void;
  createRetailer: (e: FormEvent) => void;
  freeze: (frozen: boolean) => void;
  patchStatus: (status: string) => void;
  requireReverification: (e: FormEvent) => void;
}) {
  const { user, modal, setModal } = props;
  return (
    <>
      <FormModal
        open={modal === "retailer"}
        title="Add retailer"
        description={`The outlet will sit under ${user.full_name} and inherit ${user.hub_name ?? "their hub"}.`}
        onClose={() => setModal(null)}
        onSubmit={props.createRetailer}
        submitLabel="Create retailer"
        submitDisabled={!retailerDraftReady(props.retailerDraft)}
      >
        <RetailerOnboardFields value={props.retailerDraft} onChange={props.setRetailerDraft} />
      </FormModal>
      <FormModal open={modal === "hub"} title="Change hub" description="Outlets follow the distributor." onClose={() => setModal(null)} onSubmit={props.saveHub} submitLabel="Save hub">
        <SelectField label="Hub" required value={props.hubId} onChange={props.setHubId} options={props.hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))} />
      </FormModal>
      <FormModal open={modal === "password"} title="Reset password" onClose={() => setModal(null)} onSubmit={props.resetPassword} submitLabel="Reset password">
        <TextField label="New password" required type="password" value={props.password} onChange={props.setPassword} />
      </FormModal>
      <FormModal open={modal === "adjust"} title="Adjust wallet" description="Posts an ADJUSTMENT to the immutable ledger." onClose={() => setModal(null)} onSubmit={props.adjust} submitLabel="Post adjustment">
        <SelectField label="Direction" required value={props.direction} onChange={props.setDirection} options={[{ value: "CREDIT", label: "Credit (add float)" }, { value: "DEBIT", label: "Debit (remove float)" }]} />
        <TextField label="Amount" required inputMode="numeric" value={props.amount} onChange={props.setAmount} />
        <TextField label="Narration" value={props.narration} onChange={props.setNarration} />
      </FormModal>
      <FormModal
        open={modal === "freeze"}
        title={user.wallet?.status === "FROZEN" ? "Unfreeze wallet" : "Freeze wallet"}
        description="Freeze stops new spends. Existing holds stay until they settle."
        onClose={() => setModal(null)}
        onSubmit={(e) => {
          e.preventDefault();
          props.freeze(user.wallet?.status !== "FROZEN");
        }}
        submitLabel={user.wallet?.status === "FROZEN" ? "Unfreeze" : "Freeze"}
      >
        <p className="text-sm text-navy-600">Confirm this wallet control for {user.full_name}.</p>
      </FormModal>
      <FormModal open={modal === "inactivate"} title="Inactivate distributor" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); props.patchStatus("SUSPENDED"); }} submitLabel="Inactivate">
        <p className="text-sm text-navy-600">They will not be able to sign in until you reactivate them from user administration.</p>
      </FormModal>
      <FormModal
        open={modal === "reverify"}
        title="Require identity re-verification"
        description="Please confirm if you want to re-initiate identity verification for this user."
        onClose={() => setModal(null)}
        onSubmit={props.requireReverification}
        submitLabel="Confirm & Re-initiate Verification"
      >
        <div className="space-y-2 text-sm text-navy-600">
          <p>
            Are you sure you want to re-initiate identity verification for{" "}
            <strong className="text-navy-950">{user.full_name}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            This will reset their Personal Identity Verified status, revoke active sessions, and require them to complete DigiLocker, PAN, and live selfie verification again at <code className="font-mono text-navy-900">/reverify</code> before accessing platform services.
          </p>
        </div>
      </FormModal>
    </>
  );
}

export function AdminRetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const platformAdmin = isSuperAdminOrPlatformAdmin(useSession((s) => s.user?.userType));
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [distributors, setDistributors] = useState<UserRow[]>([]);
  const [distributorId, setDistributorId] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("CREDIT");
  const [narration, setNarration] = useState("");
  const [modal, setModal] = useState<RetailerModal>(null);
  const [tab, setTab] = useState<"personal" | "business" | "banking" | "sales" | "customers" | "transactions" | "requests" | "audit">("personal");
  const [requestCount, setRequestCount] = useState(0);
  const [requestTick, setRequestTick] = useState(0);
  const [sales, setSales] = useState<SalesLead[]>([]);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);
  const [reverifyTick, setReverifyTick] = useState(0);
  const [statusOpen, setStatusOpen] = useState(false);

  async function load() {
    const [u, d] = await Promise.all([
      api<UserDetail>(`/api/v1/admin/users/${id}`, { token }),
      api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }),
    ]);
    setUser(u);
    setDistributors(d);
    setDistributorId(u.parent_id ?? "");
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("tab");
    if (
      param === "personal" ||
      param === "business" ||
      param === "banking" ||
      param === "sales" ||
      param === "customers" ||
      param === "transactions" ||
      param === "requests" ||
      param === "audit"
    ) {
      setTab(param);
    }
  }, []);

  useEffect(() => {
    if (token && id) {
      load().catch((e) => setLoadError(formatApiError(e, "Failed to load retailer")));
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || tab !== "sales") return;
    setSalesLoading(true);
    setSalesError(null);
    api<SalesLead[]>(`/api/v1/sales?retailerId=${id}`, { token })
      .then(setSales)
      .catch((e) => setSalesError(formatApiError(e, "Could not load sales")))
      .finally(() => setSalesLoading(false));
  }, [token, id, tab]);

  useEffect(() => {
    if (!token || !id || tab !== "customers") return;
    setCustomersLoading(true);
    setCustomersError(null);
    api<RetailerCustomer[]>(`/api/v1/customers?retailerId=${id}`, { token })
      .then(setCustomers)
      .catch((e) => setCustomersError(formatApiError(e, "Could not load customers")))
      .finally(() => setCustomersLoading(false));
  }, [token, id, tab]);

  async function patchStatus(status: string) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/status`, { token, method: "PATCH", body: JSON.stringify({ status }) }));
      setModal(null);
      flash.ok(`Retailer is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function transfer(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/distributor`, { token, method: "PATCH", body: JSON.stringify({ distributorId }) }));
      setModal(null);
      flash.ok("Outlet moved to the new distributor and hub.");
    } catch (e) {
      flash.fail(e, "Transfer failed");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, { token, method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setModal(null);
      flash.ok("Password reset.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  async function adjust(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/adjust`, {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), direction, narration }),
      }));
      setAmount("");
      setNarration("");
      setModal(null);
      flash.ok("Wallet adjustment posted.");
    } catch (e) {
      flash.fail(e, "Adjustment failed");
    }
  }

  async function freeze(frozen: boolean) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/freeze`, { token, method: "PATCH", body: JSON.stringify({ frozen }) }));
      setModal(null);
      flash.ok(frozen ? "Till frozen." : "Till unfrozen.");
    } catch (e) {
      flash.fail(e, "Could not change wallet");
    }
  }

  async function redoEkyc(bank: "bank2" | "bank6") {
    try {
      await api(`/api/v1/admin/users/${id}/ekyc/${bank}/redo`, { token, method: "POST" });
      setModal(null);
      await load();
      flash.ok(bank === "bank6"
        ? "Cash out eKYC is open again. The retailer can scan on the KYC page."
        : "Money transfer eKYC is open again. The retailer can scan on the KYC page.");
    } catch (e) {
      flash.fail(e, "Could not reopen this eKYC");
    }
  }

  async function requireReverification(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/require-reverification`, {
        token,
        method: "POST",
        body: "{}",
      });
      setModal(null);
      setReverifyTick((n) => n + 1);
      setRequestTick((n) => n + 1);
      await load();
      flash.ok("Partner flagged for mandatory re-verification. Their services are locked until they complete /reverify.");
    } catch (err) {
      flash.fail(err, "Could not require re-verification");
    }
  }

  async function requestLocationUpdate(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/request-location-update`, {
        token,
        method: "POST",
        body: "{}",
      });
      setModal(null);
      setReverifyTick((n) => n + 1);
      await load();
      flash.ok("Location update enabled for this retailer (can_update = true). They can now update their business location from their profile.");
    } catch (err) {
      flash.fail(err, "Could not request location update");
    }
  }

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function copyCode() {
    if (!user?.code) return;
    await navigator.clipboard.writeText(user.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const location = retailerLocationFromKyc(user.kyc) ?? {
    city: user.retailer_city,
    state: user.retailer_state,
    pincode: user.retailer_pincode,
  };
  const shopLine = retailerLocationLine(location);
  const isFrozen = user.wallet?.status === "FROZEN";
  const manageActions: ManageAction[] = [
    {
      label: "Transfer distributor",
      icon: <ArrowLeftRight className="h-4 w-4" />,
      onClick: () => setModal("transfer"),
    },
    {
      label: "Adjust wallet",
      icon: <Wallet className="h-4 w-4" />,
      onClick: () => setModal("adjust"),
    },
    {
      label: isFrozen ? "Unfreeze wallet" : "Freeze wallet",
      icon: isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
      onClick: () => setModal("freeze"),
    },
    ...(user.status === "PENDING" || user.status === "REJECTED"
      ? [
        {
          label: "Request Activation",
          icon: <Send className="h-4 w-4" />,
          onClick: () => setModal("activation"),
        },
      ]
      : []),
    ...(user.status === "ACTIVE"
      ? [
        {
          label: "Inactivate",
          icon: <UserX className="h-4 w-4" />,
          onClick: () => setModal("inactivate"),
          tone: "danger" as const,
        },
      ]
      : []),
    ...(user.status === "INACTIVE" || user.status === "SUSPENDED"
      ? [
        {
          label: "Activate retailer",
          icon: <BadgeCheck className="h-4 w-4" />,
          onClick: () => setModal("reactivate"),
        },
      ]
      : []),
    ...(user.status === "APPROVED"
      ? [
        {
          label: "Activate retailer",
          icon: <BadgeCheck className="h-4 w-4" />,
          onClick: () => {
            api(`/api/v1/finance/retailers/${id}/activate`, { token, method: "POST", body: "{}" })
              .then(() => load())
              .then(() => flash.ok("Retailer is now active."))
              .catch((e) => flash.fail(e, "Could not activate retailer"));
          },
        },
      ]
      : []),
    {
      label: "Reset password",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => setModal("password"),
    },
    {
      label: "Request to update location",
      icon: <MapPin className="h-4 w-4" />,
      onClick: () => setModal("request-location"),
    },
    {
      label: "Require re-verification",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => setModal("reverify"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/retailers"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Retailers
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Simplified Profile Card with Manage Button on the Top Right */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Retailer Outlet
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  Boolean(user.kyc?.personal_identity_verified ?? user.personal_identity_verified)
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Fingerprint className="h-3 w-3" />
                Personal: {Boolean(user.kyc?.personal_identity_verified ?? user.personal_identity_verified) ? "Verified" : "Pending"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  Boolean(
                    user.kyc?.business_verified ??
                      user.business_verified ??
                      (user.kyc?.business_status || user.business_status) === "BUSINESS_VERIFIED",
                  )
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Store className="h-3 w-3" />
                Business: {Boolean(
                  user.kyc?.business_verified ??
                    user.business_verified ??
                    (user.kyc?.business_status || user.business_status) === "BUSINESS_VERIFIED",
                ) ? "Verified" : "Pending"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  (user.kyc?.bank_verification_status || user.bank_verification_status) === "VERIFIED"
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Landmark className="h-3 w-3" />
                Bank: {(user.kyc?.bank_verification_status || user.bank_verification_status) === "VERIFIED" ? "Verified" : "Pending"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  (user.kyc?.agreement_status || user.agreement_status) === "SIGNED"
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <FileText className="h-3 w-3" />
                Agreement: {(user.kyc?.agreement_status || user.agreement_status) === "SIGNED" ? "Signed" : "Pending"}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {user.full_name}
              </h1>
            </div>

            {/* 1st Row: Location of the retailer only */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">{shopLine || "Location not specified"}</span>
            </div>

            {/* 2nd Row: Distributor & Hub (without links) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Distributor:{" "}
                  <span className="font-medium text-slate-200">
                    {user.parent_name || "Direct Outlet (No Distributor)"}
                  </span>
                </span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-200">
                  {[user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ") || "Unassigned Hub"}
                </span>
              </div>
            </div>

            {/* 3rd Row: GFINCODE & PHONE with copy */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{user.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy GFIN Code"
                    onClick={copyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{maskMobile(user.mobile)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Mobile"
                  onClick={copyMobile}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>

              {user.wallet && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Wallet className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>
                    Float: <strong className="text-white">{inr(user.wallet.availableBalance)}</strong>
                  </span>
                </span>
              )}
            </div>

            {/* 4th Row: Creation details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{when(user.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-white">
                    {user.created_by_name || user.created_by || "Platform Admin"}
                  </span>
                  {user.created_by_code && (
                    <span className="font-mono text-[10px] text-slate-400 ml-1">({user.created_by_code})</span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>

      {/* Tabs & Content */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
          {(["personal", "business", "banking", "sales", "customers", "transactions", "requests", ...(platformAdmin ? ["audit"] as const : [])] as const).map((key) => {
            const isActive = tab === key;
            const count =
              key === "sales"
                ? sales.length
                : key === "customers"
                  ? customers.length
                  : key === "requests"
                    ? requestCount
                    : key === "transactions"
                      ? user.recentTransactions?.length ?? 0
                      : 0;
            const label =
              key === "personal"
                ? "Personal"
                : key === "business"
                  ? "Business"
                  : key === "banking"
                    ? "Banking"
                    : key === "sales"
                      ? "Sales"
                      : key === "customers"
                        ? "Customers"
                        : key === "requests"
                          ? "Requests"
                          : key === "audit"
                            ? "Audit"
                            : "Transactions";
            return (
              <button
                key={key}
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${isActive
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                  }`}
                onClick={() => setTab(key)}
              >
                {label}
                {isActive &&
                  key !== "audit" &&
                  key !== "personal" &&
                  key !== "business" &&
                  key !== "banking" &&
                  ` (${count})`}
              </button>
            );
          })}
        </div>

        {(tab === "personal" || tab === "business") && id ? (
          <PartnerInfoTab
            section={tab}
            user={user}
            userId={id}
            token={token}
            refreshKey={reverifyTick}
            onChanged={() => load().catch(() => undefined)}
            onDone={(m) => flash.ok(m)}
            onFail={(e, f) => flash.fail(e, f)}
          />
        ) : tab === "banking" && id ? (
          <RetailerBankingAdminTab
            userId={id}
            token={token}
            refreshKey={reverifyTick}
            onChanged={() => load().catch(() => undefined)}
            onDone={(m) => flash.ok(m)}
            onFail={(e, f) => flash.fail(e, f)}
          />
        ) : tab === "audit" && platformAdmin && id ? (
          <ActivityHistory token={token} userId={id} />
        ) : tab === "sales" ? (
          salesError ? (
            <Alert tone="error">{salesError}</Alert>
          ) : salesLoading ? (
            <div className="card h-32 animate-pulse bg-slate-100" />
          ) : sales.length === 0 ? (
            <EmptyState title="No sales leads yet" body="Leads generated by this retailer will appear here." />
          ) : (
            <SalesTable rows={sales} detailBase="/admin/sales" hideRetailer showChannel={false} />
          )
        ) : tab === "customers" ? (
          customersError ? (
            <Alert tone="error">{customersError}</Alert>
          ) : customersLoading ? (
            <div className="card h-32 animate-pulse bg-slate-100" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" body="Customers appear here when this retailer adds them at the desk." />
          ) : (
            <DataTable
              columns={["Customer", "Mobile", "Location", "Created By", "Code", "eKYC", "Created On"]}
              rows={customers.map((c) => [
                <span key={`${c.id}-name`} className="font-semibold text-navy-950">{c.full_name}</span>,
                maskMobile(c.mobile),
                [c.city, c.state].filter(Boolean).join(", ") || "—",
                c.created_by ?? "—",
                c.created_by_code ? (
                  <span key={`${c.id}-code`} className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {c.created_by_code}
                  </span>
                ) : (
                  "—"
                ),
                <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
                c.created_at ? when(c.created_at) : "—",
              ])}
            />
          )
        ) : tab === "requests" && id ? (
          <RetailerRequestsPanel
            token={token}
            retailerId={id}
            refreshKey={requestTick}
            onCount={setRequestCount}
          />
        ) : !user.recentTransactions?.length ? (
          <EmptyState title="No transactions yet" body="Outlet desk activity appears here." />
        ) : (
          <DataTable
            columns={["When", "Type", "Status", "Amount", "Action"]}
            rows={user.recentTransactions.map((t) => [
              when(t.created_at),
              t.txn_type.replaceAll("_", " "),
              <StatusPill key={t.id} value={t.state} />,
              inr(t.amount),
              <ViewLink key={`${t.id}-v`} href={`/admin/transactions/${t.id}`} />,
            ])}
          />
        )}
      </section>

      {id && (
        <>
          <AgentEkycModal
            open={ekycOpen}
            userId={id}
            userName={user.full_name}
            userType={user.user_type}
            email={user.email}
            token={token}
            onClose={() => setEkycOpen(false)}
            onVerified={() => { load().catch(() => undefined); }}
          />
          <AgentEkycStatusModal
            open={statusOpen}
            userId={id}
            userName={user.full_name}
            token={token}
            onClose={() => setStatusOpen(false)}
            onVerified={() => { load().catch(() => undefined); }}
          />
        </>
      )}

      <FormModal open={modal === "transfer"} title="Transfer distributor" description="Moves the outlet and its hub." onClose={() => setModal(null)} onSubmit={transfer} submitLabel="Transfer">
        <SelectField label="Distributor" required value={distributorId} onChange={setDistributorId} options={distributors.map((d) => ({ value: d.id, label: `${d.full_name}${d.hub_name ? ` · ${d.hub_name}` : ""}` }))} />
      </FormModal>
      <FormModal open={modal === "password"} title="Reset password" onClose={() => setModal(null)} onSubmit={resetPassword} submitLabel="Reset password">
        <TextField label="New password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
      <FormModal
        open={modal === "redo-bank2"}
        title="Redo money transfer eKYC"
        description="Onboarding stays complete. The retailer will see the money transfer scan again on the KYC page."
        onClose={() => setModal(null)}
        onSubmit={(e) => { e.preventDefault(); redoEkyc("bank2"); }}
        submitLabel="Ask for a new scan"
      >
        <p className="text-sm text-navy-600">The next scan sends CASA as on for bank 2.</p>
      </FormModal>
      <FormModal
        open={modal === "redo-bank6"}
        title="Redo cash out eKYC"
        description="Onboarding stays complete. The retailer will see the cash out scan again on the KYC page."
        onClose={() => setModal(null)}
        onSubmit={(e) => { e.preventDefault(); redoEkyc("bank6"); }}
        submitLabel="Ask for a new scan"
      >
        <p className="text-sm text-navy-600">The next scan sends CASA as on for bank 6. Cash out stays closed until that scan succeeds.</p>
      </FormModal>
      <FormModal open={modal === "adjust"} title="Adjust wallet" onClose={() => setModal(null)} onSubmit={adjust} submitLabel="Post adjustment">
        <SelectField label="Direction" required value={direction} onChange={setDirection} options={[{ value: "CREDIT", label: "Credit" }, { value: "DEBIT", label: "Debit" }]} />
        <TextField label="Amount" required inputMode="numeric" value={amount} onChange={setAmount} />
        <TextField label="Narration" value={narration} onChange={setNarration} />
      </FormModal>
      <FormModal open={modal === "freeze"} title={user.wallet?.status === "FROZEN" ? "Unfreeze wallet" : "Freeze wallet"} onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); freeze(user.wallet?.status !== "FROZEN"); }} submitLabel={user.wallet?.status === "FROZEN" ? "Unfreeze" : "Freeze"}>
        <p className="text-sm text-navy-600">Confirm wallet control for {user.full_name}.</p>
      </FormModal>
      <FormModal open={modal === "inactivate"} title="Inactivate retailer" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); patchStatus("SUSPENDED"); }} submitLabel="Inactivate">
        <p className="text-sm text-navy-600">The outlet desk will not accept new transactions until reactivated.</p>
      </FormModal>
      <FormModal open={modal === "reactivate"} title="Activate retailer" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); patchStatus("ACTIVE"); }} submitLabel="Activate">
        <p className="text-sm text-navy-600">This outlet can sign in and use the desk again.</p>
      </FormModal>
      <FormModal
        open={modal === "request-location"}
        title="Request to update business location"
        description="Allow this retailer to update their business location and operating address from their profile page."
        onClose={() => setModal(null)}
        onSubmit={requestLocationUpdate}
        submitLabel="Allow Location Update"
      >
        <div className="space-y-2 text-sm text-navy-600">
          <p>
            Enable business location update (<code className="font-mono text-navy-900">can_update = true</code>) for{" "}
            <strong className="text-navy-950">{user.full_name}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Once enabled, the retailer will be allowed to submit a new business location from their Business profile tab. When you approve the updated location, <code className="font-mono text-navy-900">can_update</code> is automatically turned off again so they cannot keep changing it randomly.
          </p>
        </div>
      </FormModal>
      <FormModal
        open={modal === "reverify"}
        title="Require identity re-verification"
        description="Please confirm if you want to re-initiate identity verification for this user."
        onClose={() => setModal(null)}
        onSubmit={requireReverification}
        submitLabel="Confirm & Re-initiate Verification"
      >
        <div className="space-y-2 text-sm text-navy-600">
          <p>
            Are you sure you want to re-initiate identity verification for{" "}
            <strong className="text-navy-950">{user.full_name}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            This will reset their Personal Identity Verified status, revoke active sessions, and require them to complete DigiLocker, PAN, and live selfie verification again at <code className="font-mono text-navy-900">/reverify</code> before accessing platform services.
          </p>
        </div>
      </FormModal>
      {id && (
        <ActivationRequestModal
          open={modal === "activation"}
          token={token}
          retailerId={id}
          onClose={() => setModal(null)}
          onSubmitted={() => {
            setModal(null);
            setTab("requests");
            setRequestTick((n) => n + 1);
            load().then(() => flash.ok("Activation request submitted.")).catch(() => undefined);
          }}
          onError={(err) => flash.fail(err, "Could not submit the activation request")}
        />
      )}
    </div>
  );
}
