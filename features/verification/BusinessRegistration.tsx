"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Fingerprint,
  MapPin,
  Navigation,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Upload,
  User,
  Users,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type StructuredPermanentAddress = {
  careOf?: string;
  house?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  vtc?: string;
  postOffice?: string;
  subDistrict?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  fullAddress?: string;
};

export type CompanyDirector = {
  name: string;
  din: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  isSelf?: boolean;
  matchScore?: number;
  selected?: boolean;
};

export type CompanyLookupResponse = {
  cin: string;
  companyName: string;
  companyType?: string;
  classOfCompany?: string;
  status: string;
  dateOfIncorporation?: string;
  rocCode?: string;
  registeredAddress: string;
  pincode?: string;
  providerRef?: string;
  partnerVerifiedName?: string;
  suggestedDin?: string | null;
  directors: CompanyDirector[];
};

export type SignatorySummary = {
  id: string;
  cin: string;
  directorName: string;
  din?: string;
  isSelf: boolean;
  status: string;
  currentStep?: string | null;
  maskedMobile?: string | null;
  verifiedName?: string | null;
  nameMatchScore?: number | null;
  aadhaarLast4?: string | null;
  panLast4?: string | null;
  aadhaarPanLinked?: boolean;
  faceReviewStatus?: string;
  signatoryUrl?: string | null;
  expiresAt?: string | null;
  completedAt?: string | null;
};

export type VerificationState = {
  personalIdentityVerified?: boolean;
  businessVerified?: boolean;
  can_update?: boolean;
  aadhaarPanLinked?: boolean;
  identityStatus?: string;
  bankVerificationStatus?: string;
  personalStatus: string;
  businessStatus: string;
  businessType?: "INDIVIDUAL" | "COMPANY" | null;
  workLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    source?: string | null;
  };
  workAddress?: {
    line1?: string;
    line2?: string;
    area?: string;
    landmark?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    fullAddress?: string;
    sameAsPersonal?: boolean;
    latitude?: number;
    longitude?: number;
  };
  signatory?: SignatorySummary | null;
  agreementStatus: string;
  servicesUnlocked?: boolean;
  agreementRecord?: Record<string, unknown> | null;
  faceReviewStatus?: string;
  aadhaarLast4?: string;
  hasFullAadhaar?: boolean;
  panLast4?: string;
  email?: string | null;
  gstin?: string | null;
  selfieUrl?: string | null;
  businessReviewNote?: string | null;
  identity?: Record<string, unknown>;
  personal: Record<string, unknown>;
  business: Record<string, unknown>;
  digilockerSummary?: {
    aadhaarPdfStored?: boolean;
    panPdfStored?: boolean;
    aadhaarPhotoStored?: boolean;
    storedCount?: number;
    totalCount?: number;
  };
  documents: { id: string; doc_type: string; filename?: string; created_at?: string; url?: string }[];
};

type KycLocationResponse = {
  available: boolean;
  latitude?: number;
  longitude?: number;
  capturedAt?: string | null;
};

function locateDevice(): Promise<{ latitude: string; longitude: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Allow location access so your work location can be recorded"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }),
      () => reject(new Error("Allow location access so your work location can be recorded")),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

export function extractPermanentAddress(state: VerificationState | null): StructuredPermanentAddress {
  const personal = (state?.personal ?? state?.identity ?? {}) as Record<string, unknown>;
  const perm = personal.permanentAddress as StructuredPermanentAddress | undefined;
  if (perm && typeof perm === "object") {
    return perm;
  }
  return {
    vtc: String(personal.city || ""),
    district: String(personal.city || ""),
    state: String(personal.state || ""),
    pincode: String(personal.pincode || ""),
    fullAddress: String(personal.address || ""),
  };
}

export function BusinessRegistration({
  state,
  onUpdated,
}: {
  state: VerificationState | null;
  onUpdated: (next: VerificationState) => void;
}) {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);

  const [mode, setMode] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [editingAfterReject, setEditingAfterReject] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [kycLoc, setKycLoc] = useState<KycLocationResponse | null>(null);
  const [locationSource, setLocationSource] = useState<"KYC_LOCATION" | "CURRENT_DEVICE">("KYC_LOCATION");
  const [deviceCoords, setDeviceCoords] = useState<{ latitude: string; longitude: string } | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [capturingGps, setCapturingGps] = useState(false);

  // Individual & shared merchant fields
  const [shopName, setShopName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [gstinInput, setGstinInput] = useState("");
  const [sameAsPersonal, setSameAsPersonal] = useState(true);
  const [customAddr, setCustomAddr] = useState({
    line1: "",
    line2: "",
    area: "",
    landmark: "",
    city: "",
    district: "",
    state: "Karnataka",
    pincode: "",
  });

  // Company fields
  const [cinInput, setCinInput] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyLookupResponse | null>(null);
  const [selectedDin, setSelectedDin] = useState("");
  const [signatoryMobile, setSignatoryMobile] = useState("");
  const [companySameAddr, setCompanySameAddr] = useState(true);
  const [companyAddr, setCompanyAddr] = useState({
    line1: "",
    area: "",
    landmark: "",
    city: "",
    district: "",
    state: "Karnataka",
    pincode: "",
  });

  // Shop Photo (optional upload or camera capture)
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [shopPhotoName, setShopPhotoName] = useState<string | null>(null);
  const [shopPhotoPreviewUrl, setShopPhotoPreviewUrl] = useState<string | null>(null);
  const [shopCameraActive, setShopCameraActive] = useState(false);
  const shopVideoRef = useRef<HTMLVideoElement | null>(null);
  const shopStreamRef = useRef<MediaStream | null>(null);
  const shopFileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback & busy state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const identityData = (state?.identity ?? state?.personal ?? {}) as Record<string, unknown>;
  const verifiedPartnerName = String(identityData.fullName || user?.fullName || "Partner");
  const permAddr = extractPermanentAddress(state);
  const personalDone = state?.identityStatus === "VERIFIED" || state?.personalStatus === "PERSONAL_VERIFIED";
  const businessStatus = state?.businessStatus || "NOT_VERIFIED";
  const existingShopPhoto = state?.documents?.find((d) => d.doc_type === "SHOP_PHOTO") ?? null;

  useEffect(() => {
    return () => {
      stopShopCamera();
      if (shopPhotoPreviewUrl) URL.revokeObjectURL(shopPhotoPreviewUrl);
    };
  }, [shopPhotoPreviewUrl]);

  function stopShopCamera() {
    if (shopStreamRef.current) {
      shopStreamRef.current.getTracks().forEach((t) => t.stop());
      shopStreamRef.current = null;
    }
    setShopCameraActive(false);
  }

  async function startShopCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      shopStreamRef.current = stream;
      setShopCameraActive(true);
      setTimeout(() => {
        if (shopVideoRef.current) {
          shopVideoRef.current.srcObject = stream;
          shopVideoRef.current.play().catch(() => undefined);
        }
      }, 50);
    } catch {
      setError("Camera permission is required to capture your shop photo.");
    }
  }

  function captureShopPhotoSnapshot() {
    const video = shopVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 960;
    const h = video.videoHeight || 600;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (shopPhotoPreviewUrl) URL.revokeObjectURL(shopPhotoPreviewUrl);
        const file = new File([blob], "shop-photo-camera.jpg", { type: "image/jpeg" });
        setShopPhotoFile(file);
        setShopPhotoName("Captured via Camera (shop-photo-camera.jpg)");
        setShopPhotoPreviewUrl(URL.createObjectURL(blob));
        stopShopCamera();
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleShopPhotoPicked(file: File | null) {
    if (!file) return;
    stopShopCamera();
    if (shopPhotoPreviewUrl) {
      URL.revokeObjectURL(shopPhotoPreviewUrl);
      setShopPhotoPreviewUrl(null);
    }
    setShopPhotoFile(file);
    setShopPhotoName(file.name);
    if (file.type.startsWith("image/")) {
      setShopPhotoPreviewUrl(URL.createObjectURL(file));
    }
  }

  function clearShopPhoto() {
    stopShopCamera();
    if (shopPhotoPreviewUrl) {
      URL.revokeObjectURL(shopPhotoPreviewUrl);
      setShopPhotoPreviewUrl(null);
    }
    setShopPhotoFile(null);
    setShopPhotoName(null);
    if (shopFileInputRef.current) {
      shopFileInputRef.current.value = "";
    }
  }

  async function uploadShopPhotoIfPresent() {
    if (!shopPhotoFile || !token) return;
    const fd = new FormData();
    fd.append("file", shopPhotoFile);
    await api<VerificationState>("/api/v1/verification/business/documents?docType=SHOP_PHOTO", {
      token,
      method: "POST",
      body: fd,
    });
  }

  useEffect(() => {
    if (!token) return;
    api<KycLocationResponse>("/api/v1/verification/business/kyc-location", { token })
      .then((res) => {
        setKycLoc(res);
        if (!res.available) {
          setLocationSource("CURRENT_DEVICE");
        }
      })
      .catch(() => setKycLoc({ available: false }));
  }, [token]);

  useEffect(() => {
    if (!state) return;
    if (state.businessType === "COMPANY") {
      setMode("COMPANY");
    } else if (state.businessType === "INDIVIDUAL") {
      setMode("INDIVIDUAL");
    }
    const biz = (state.business || {}) as Record<string, unknown>;
    if (biz.tradeName && typeof biz.tradeName === "string") {
      setShopName(biz.tradeName);
    }
    if (state.email && typeof state.email === "string") {
      setEmailInput((prev) => prev || state.email || "");
    } else if (user?.email) {
      setEmailInput((prev) => prev || user.email || "");
    }
    if (biz.gstin && typeof biz.gstin === "string") {
      setGstinInput((prev) => prev || String(biz.gstin));
    }
    if (biz.cin && typeof biz.cin === "string") {
      setCinInput(biz.cin);
    }
    const savedCompany = biz.company as CompanyLookupResponse | undefined;
    if (savedCompany && savedCompany.companyName && !companyInfo) {
      setCompanyInfo(savedCompany);
      const preselected = savedCompany.directors?.find((d) => d.selected)?.din || savedCompany.suggestedDin || "";
      if (preselected) setSelectedDin(preselected);
    }
  }, [state, user?.email]);

  async function handleCaptureCurrentGps() {
    setCapturingGps(true);
    setError(null);
    try {
      const coords = await locateDevice();
      setDeviceCoords(coords);
      setManualLat(coords.latitude);
      setManualLng(coords.longitude);
      setLocationSource("CURRENT_DEVICE");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not capture GPS location");
    } finally {
      setCapturingGps(false);
    }
  }

  function openUpdateLocationForm() {
    setError(null);
    setOk(null);
    const curLat = state?.workLocation?.latitude != null ? String(state.workLocation.latitude) : "";
    const curLng = state?.workLocation?.longitude != null ? String(state.workLocation.longitude) : "";
    setManualLat(curLat);
    setManualLng(curLng);
    if (curLat && curLng) {
      setDeviceCoords({ latitude: curLat, longitude: curLng });
    }
    setLocationSource("CURRENT_DEVICE");
    const wa = state?.workAddress ?? {};
    const isSame = wa.sameAsPersonal !== undefined ? Boolean(wa.sameAsPersonal) : true;
    setSameAsPersonal(isSame);
    setCustomAddr({
      line1: String(wa.line1 || ""),
      line2: String(wa.line2 || wa.area || ""),
      area: String(wa.area || wa.line2 || ""),
      landmark: String(wa.landmark || ""),
      city: String(wa.city || permAddr.vtc || permAddr.district || ""),
      district: String(wa.district || wa.city || permAddr.district || ""),
      state: String(wa.state || permAddr.state || "Karnataka"),
      pincode: String(wa.pincode || permAddr.pincode || ""),
    });
    setEditingLocation(true);
  }

  async function handleSubmitLocationUpdate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      let lat = manualLat.trim();
      let lng = manualLng.trim();
      if (locationSource === "KYC_LOCATION" && kycLoc?.available && kycLoc.latitude != null && kycLoc.longitude != null) {
        lat = String(kycLoc.latitude);
        lng = String(kycLoc.longitude);
      } else if (!lat || !lng) {
        const coords = deviceCoords ?? (await locateDevice());
        setDeviceCoords(coords);
        lat = coords.latitude;
        lng = coords.longitude;
        setManualLat(lat);
        setManualLng(lng);
      }
      await uploadShopPhotoIfPresent();
      const next = await api<VerificationState>("/api/v1/verification/business/location", {
        token,
        method: "POST",
        body: JSON.stringify({
          locationSource,
          latitude: lat,
          longitude: lng,
          shopName: shopName.trim() || undefined,
          address: sameAsPersonal
            ? { sameAsPersonal: true }
            : {
                sameAsPersonal: false,
                line1: customAddr.line1,
                line2: customAddr.line2 || customAddr.area,
                area: customAddr.area || customAddr.line2,
                landmark: customAddr.landmark,
                city: customAddr.city,
                district: customAddr.district || customAddr.city,
                state: customAddr.state,
                pincode: customAddr.pincode,
              },
        }),
      });
      onUpdated(next);
      setEditingLocation(false);
      setOk("Business location updated and submitted for admin approval.");
    } catch (err) {
      setError(
        err instanceof Error && err.message.startsWith("Allow location")
          ? err.message
          : formatApiError(err, "Could not update business location"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitIndividual(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!shopName.trim()) {
      setError("Shop or trade name is required");
      return;
    }
    if (!emailInput.trim()) {
      setError("Business / partner email address is required");
      return;
    }
    if (!state?.hasFullAadhaar && aadhaarInput.replace(/\D/g, "").length !== 12) {
      setError("12-digit Aadhaar number is required for biometric service activation");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      let coords = deviceCoords;
      if (locationSource === "CURRENT_DEVICE" && !coords) {
        coords = await locateDevice();
        setDeviceCoords(coords);
      }
      await uploadShopPhotoIfPresent();
      const next = await api<VerificationState>("/api/v1/verification/business/individual", {
        token,
        method: "POST",
        body: JSON.stringify({
          locationSource,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          shopName: shopName.trim(),
          email: emailInput.trim(),
          aadhaarNumber: state?.hasFullAadhaar ? undefined : aadhaarInput.replace(/\D/g, ""),
          gstin: gstinInput.trim() ? gstinInput.trim().toUpperCase() : undefined,
          address: sameAsPersonal
            ? { sameAsPersonal: true }
            : {
                sameAsPersonal: false,
                line1: customAddr.line1,
                line2: customAddr.line2 || customAddr.area,
                area: customAddr.area || customAddr.line2,
                landmark: customAddr.landmark,
                city: customAddr.city,
                district: customAddr.district || customAddr.city,
                state: customAddr.state,
                pincode: customAddr.pincode,
              },
        }),
      });
      onUpdated(next);
      setEditingAfterReject(false);
      setOk("Individual business registration submitted for admin review.");
    } catch (err) {
      setError(
        err instanceof Error && err.message.startsWith("Allow location")
          ? err.message
          : formatApiError(err, "Could not submit individual business registration"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLookupCompany() {
    if (!token || !cinInput.trim()) return;
    setLookupBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await api<CompanyLookupResponse>("/api/v1/verification/business/company/lookup", {
        token,
        method: "POST",
        body: JSON.stringify({ cin: cinInput.trim().toUpperCase() }),
      });
      setCompanyInfo(res);
      const defaultDin = res.suggestedDin || res.directors[0]?.din || "";
      setSelectedDin(defaultDin);
      setOk(`Verified ${res.companyName} from MCA records.`);
    } catch (err) {
      setError(formatApiError(err, "Could not fetch company details from CIN/LLPIN"));
    } finally {
      setLookupBusy(false);
    }
  }

  async function handleSubmitCompany(e: FormEvent) {
    e.preventDefault();
    if (!token || !companyInfo) return;
    if (!shopName.trim()) {
      setError("Shop or trade name is required");
      return;
    }
    if (!emailInput.trim()) {
      setError("Business / partner email address is required");
      return;
    }
    if (!state?.hasFullAadhaar && aadhaarInput.replace(/\D/g, "").length !== 12) {
      setError("12-digit Aadhaar number is required for biometric service activation");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const coords = deviceCoords ?? (await locateDevice());
      setDeviceCoords(coords);
      await uploadShopPhotoIfPresent();
      const next = await api<VerificationState>("/api/v1/verification/business/company", {
        token,
        method: "POST",
        body: JSON.stringify({
          cin: companyInfo.cin,
          din: selectedDin,
          shopName: shopName.trim(),
          email: emailInput.trim(),
          aadhaarNumber: state?.hasFullAadhaar ? undefined : aadhaarInput.replace(/\D/g, ""),
          gstin: gstinInput.trim() ? gstinInput.trim().toUpperCase() : undefined,
          signatoryMobile: selectedDirector?.isSelf ? undefined : signatoryMobile.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: companySameAddr
            ? undefined
            : {
                sameAsPersonal: false,
                line1: companyAddr.line1,
                line2: companyAddr.area,
                area: companyAddr.area,
                landmark: companyAddr.landmark,
                city: companyAddr.city,
                district: companyAddr.district || companyAddr.city,
                state: companyAddr.state,
                pincode: companyAddr.pincode,
              },
        }),
      });
      onUpdated(next);
      setEditingAfterReject(false);
      setOk(
        selectedDirector?.isSelf
          ? "Company registration submitted for admin review."
          : "Authorized Signatory KYC link generated and sent via SMS.",
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message.startsWith("Allow location")
          ? err.message
          : formatApiError(err, "Could not submit company registration"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResendSignatory() {
    if (!token) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const next = await api<VerificationState>("/api/v1/verification/business/signatory/resend", {
        token,
        method: "POST",
        body: "{}",
      });
      onUpdated(next);
      setOk("Fresh KYC verification link sent to the authorized signatory.");
    } catch (err) {
      setError(formatApiError(err, "Could not resend signatory KYC link"));
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeSignatory() {
    if (!token) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const next = await api<VerificationState>("/api/v1/verification/business/signatory/change", {
        token,
        method: "POST",
        body: "{}",
      });
      onUpdated(next);
      setOk("You can now select a different authorized signatory.");
    } catch (err) {
      setError(formatApiError(err, "Could not change signatory"));
    } finally {
      setBusy(false);
    }
  }

  async function copySignatoryUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  }

  const selectedDirector = companyInfo?.directors.find((d) => d.din === selectedDin) ?? null;
  const sig = state?.signatory ?? null;
  const bizDetails = (state?.business || {}) as Record<string, unknown>;
  const savedCompany = bizDetails.company as CompanyLookupResponse | undefined;

  function renderRegulatoryFields() {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Merchant Contact &amp; Regulatory Identifiers
          </h3>
          <p className="text-xs text-slate-500">
            Required for merchant banking terminal activation, settlement alerts, and Aadhaar biometric KYC.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-700">
            Business / Partner Email <span className="text-rose-600">*</span>
            <input
              type="email"
              className="field mt-1 bg-white"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="partner@example.com"
              required
            />
          </label>

          {state?.hasFullAadhaar ? (
            <div className="text-xs font-medium text-slate-700">
              <span>12-Digit Aadhaar Number</span>
              <div className="mt-1 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
                <span className="font-mono">XXXX-XXXX-{state.aadhaarLast4 || "••••"}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Encrypted on File
                </span>
              </div>
            </div>
          ) : (
            <label className="text-xs font-medium text-slate-700">
              12-Digit Aadhaar Number <span className="text-rose-600">*</span>
              <input
                className="field mt-1 font-mono bg-white"
                inputMode="numeric"
                maxLength={12}
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder={state?.aadhaarLast4 ? `12 digits ending in ${state.aadhaarLast4}` : "12-digit Aadhaar number"}
                required
              />
              {state?.aadhaarLast4 && (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Must match your verified KYC Aadhaar ending in <strong>{state.aadhaarLast4}</strong> (stored encrypted)
                </span>
              )}
            </label>
          )}

          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            GSTIN <span className="text-slate-400 font-normal">(Optional · 15 characters)</span>
            <input
              className="field mt-1 font-mono uppercase bg-white"
              maxLength={15}
              value={gstinInput}
              onChange={(e) => setGstinInput(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))}
              placeholder="e.g. 29ABCDE1234F1Z5"
            />
          </label>
        </div>
      </div>
    );
  }

  function renderShopPhotoField() {
    const activePreviewUrl = shopPhotoPreviewUrl || existingShopPhoto?.url || null;
    const activeFileName =
      shopPhotoName || (existingShopPhoto ? existingShopPhoto.filename || "Shop Photo on file" : null);

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-navy-950 block">
              Shop / Premises Image <span className="text-slate-400 font-normal">(Optional)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Upload a photo of your shop/office or capture it directly from your camera
            </span>
          </div>
          {shopPhotoFile && (
            <button
              type="button"
              onClick={clearShopPhoto}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={shopFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleShopPhotoPicked(e.target.files?.[0] || null)}
        />

        {shopCameraActive && (
          <div className="space-y-2.5">
            <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-950">
              <video
                ref={shopVideoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={captureShopPhotoSnapshot}
                className="btn-primary flex-1 !py-2 text-xs"
              >
                Capture Shop Photo
              </button>
              <button
                type="button"
                onClick={stopShopCamera}
                className="btn-secondary !py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!shopCameraActive && activePreviewUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
            <img
              src={activePreviewUrl}
              alt="Shop preview"
              className="max-h-48 w-full rounded-lg object-contain"
            />
          </div>
        )}

        {!shopCameraActive && activeFileName && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
            <span className="truncate font-medium">{activeFileName}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          </div>
        )}

        {!shopCameraActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => shopFileInputRef.current?.click()}
              className="btn-secondary inline-flex items-center justify-center gap-1.5 !py-2 text-xs bg-white"
            >
              <Upload className="h-4 w-4" />
              {shopPhotoFile || existingShopPhoto ? "Upload Different Image" : "Upload Shop Image"}
            </button>
            <button
              type="button"
              onClick={startShopCamera}
              className="btn-secondary inline-flex items-center justify-center gap-1.5 !py-2 text-xs bg-white"
            >
              <Camera className="h-4 w-4" />
              {shopPhotoFile || existingShopPhoto ? "Retake with Camera" : "Capture from Camera"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 1. AWAITING_SIGNATORY_KYC View
  if (businessStatus === "AWAITING_SIGNATORY_KYC" && sig && !editingAfterReject) {
    return (
      <div className="card space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Awaiting Authorized Signatory KYC
            </span>
            <h2 className="font-display text-lg font-bold text-navy-950 mt-2">
              {savedCompany?.companyName || String(bizDetails.legalName || sig.cin)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              CIN: <span className="font-mono font-semibold text-slate-700">{sig.cin}</span> · Signatory:{" "}
              <strong className="text-navy-950">{sig.directorName}</strong> (DIN: {sig.din || "—"})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleResendSignatory}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Resend KYC Link
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleChangeSignatory}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              Change Signatory
            </button>
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {ok && <Alert tone="success">{ok}</Alert>}

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Authorized Signatory</span>
              <span className="font-semibold text-navy-950 mt-0.5 block">{sig.directorName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Mobile Number</span>
              <span className="font-mono font-semibold text-navy-950 mt-0.5 block">{sig.maskedMobile || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">KYC Progress</span>
              <span className="font-semibold text-amber-700 mt-0.5 block">
                {sig.currentStep ? sig.currentStep.replaceAll("_", " ") : sig.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>

          {sig.signatoryUrl && (
            <div className="rounded-xl bg-white border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Direct Signatory Verification Link
                </span>
                <p className="font-mono text-xs text-navy-900 truncate mt-0.5">{sig.signatoryUrl}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copySignatoryUrl(sig.signatoryUrl!)}
                  className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
                <a
                  href={sig.signatoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            Once <strong>{sig.directorName}</strong> completes mobile OTP, location, Aadhaar DigiLocker, PAN, and live selfie verification via this link, your business registration will automatically move to Admin Review.
          </p>
        </div>
      </div>
    );
  }

  // 2. UNDER_REVIEW or BUSINESS_VERIFIED Summary Card
  if ((businessStatus === "UNDER_REVIEW" || businessStatus === "BUSINESS_VERIFIED") && !editingAfterReject) {
    const isVerified = businessStatus === "BUSINESS_VERIFIED" || Boolean(state?.businessVerified);
    const locationUpdatePending = Boolean(bizDetails.locationUpdatePending);
    const canUpdateLocation = Boolean(state?.can_update ?? bizDetails.can_update);
    const workAddrText =
      state?.workAddress?.fullAddress ||
      String(bizDetails.addressText || savedCompany?.registeredAddress || permAddr.fullAddress || "—");
    return (
      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                Business Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800">
                <Clock className="h-4 w-4 text-amber-600" />
                {locationUpdatePending
                  ? "Location Update · Pending Admin Approval"
                  : "Submitted · Under Admin Review"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              {state?.businessType === "COMPANY" ? "Company / LLP" : "Individual"}
            </span>
          </div>

          {canUpdateLocation && (
            <button
              type="button"
              onClick={() => (editingLocation ? setEditingLocation(false) : openUpdateLocationForm())}
              className="btn-secondary !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {editingLocation ? "Cancel Location Edit" : "Update Business Location"}
            </button>
          )}
        </div>

        {canUpdateLocation && !locationUpdatePending && !editingLocation && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Action Requested:</strong> Platform Admin has requested you to update your business location and operating address.
            </span>
            <button
              type="button"
              onClick={openUpdateLocationForm}
              className="font-bold text-amber-900 underline hover:text-amber-700"
            >
              Update Now →
            </button>
          </div>
        )}

        {error && <Alert tone="error">{error}</Alert>}
        {ok && <Alert tone="success">{ok}</Alert>}

        {canUpdateLocation && editingLocation && (
          <form
            onSubmit={handleSubmitLocationUpdate}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-navy-950 flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-emerald-600" />
                  Update Business Location &amp; Operating Address
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Submitting an updated business location will send it to the Admin team for approval before provider onboarding.
                </p>
              </div>
              <button
                type="button"
                disabled={capturingGps}
                onClick={handleCaptureCurrentGps}
                className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 bg-white"
              >
                <Navigation className={`h-3.5 w-3.5 text-emerald-600 ${capturingGps ? "animate-spin" : ""}`} />
                {capturingGps ? "Capturing GPS…" : "Capture Live GPS"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-700">
                Work Latitude <span className="text-rose-600">*</span>
                <input
                  className="field mt-1 font-mono text-xs bg-white"
                  value={manualLat}
                  onChange={(e) => {
                    setManualLat(e.target.value);
                    setLocationSource("CURRENT_DEVICE");
                  }}
                  placeholder="e.g. 21.251962"
                  required
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Work Longitude <span className="text-rose-600">*</span>
                <input
                  className="field mt-1 font-mono text-xs bg-white"
                  value={manualLng}
                  onChange={(e) => {
                    setManualLng(e.target.value);
                    setLocationSource("CURRENT_DEVICE");
                  }}
                  placeholder="e.g. 81.673253"
                  required
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Work / Shop Operating Address
                </span>
                <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-navy-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPersonal}
                    onChange={(e) => setSameAsPersonal(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Same as Aadhaar Address
                </label>
              </div>

              {sameAsPersonal ? (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3 text-xs space-y-1">
                  <p className="text-slate-800 font-medium">{permAddr.fullAddress || "Verified Aadhaar Address"}</p>
                  <p className="text-slate-500 text-[11px]">
                    {[permAddr.vtc || permAddr.district, permAddr.state, permAddr.pincode].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                    Shop / Building / Street (Line 1) <span className="text-rose-600">*</span>
                    <input
                      className="field mt-1"
                      value={customAddr.line1}
                      onChange={(e) => setCustomAddr({ ...customAddr, line1: e.target.value })}
                      placeholder="Shop No, Building Name, Street"
                      required
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    Locality / Area <span className="text-rose-600">*</span>
                    <input
                      className="field mt-1"
                      value={customAddr.area || customAddr.line2}
                      onChange={(e) => setCustomAddr({ ...customAddr, area: e.target.value, line2: e.target.value })}
                      placeholder="Locality / Area"
                      required
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    Landmark (Optional)
                    <input
                      className="field mt-1"
                      value={customAddr.landmark}
                      onChange={(e) => setCustomAddr({ ...customAddr, landmark: e.target.value })}
                      placeholder="Near Market / Metro"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    City / Town <span className="text-rose-600">*</span>
                    <input
                      className="field mt-1"
                      value={customAddr.city}
                      onChange={(e) => setCustomAddr({ ...customAddr, city: e.target.value })}
                      required
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    District <span className="text-rose-600">*</span>
                    <input
                      className="field mt-1"
                      value={customAddr.district}
                      onChange={(e) => setCustomAddr({ ...customAddr, district: e.target.value })}
                      required
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    State <span className="text-rose-600">*</span>
                    <select
                      className="field mt-1"
                      value={customAddr.state}
                      onChange={(e) => setCustomAddr({ ...customAddr, state: e.target.value })}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-700">
                    PIN Code <span className="text-rose-600">*</span>
                    <input
                      className="field mt-1 font-mono"
                      inputMode="numeric"
                      maxLength={6}
                      value={customAddr.pincode}
                      onChange={(e) => setCustomAddr({ ...customAddr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      placeholder="6-digit PIN"
                      required
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditingLocation(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary text-xs inline-flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                {busy ? "Submitting…" : "Submit Location Update for Admin Approval"}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-3 sm:grid-cols-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {state?.businessType === "COMPANY" ? "Company Name" : "Business / Trade Name"}
            </span>
            <span className="font-semibold text-navy-950 mt-0.5 block">
              {String(bizDetails.legalName || bizDetails.tradeName || verifiedPartnerName)}
            </span>
            {state?.businessType === "COMPANY" && Boolean(bizDetails.cin) && (
              <span className="font-mono text-[11px] text-slate-500">CIN: {String(bizDetails.cin)}</span>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Authorized Signatory</span>
            <span className="font-semibold text-navy-950 mt-0.5 block">
              {sig?.directorName || String(bizDetails.signatoryName || verifiedPartnerName)}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {sig ? (sig.isSelf ? "Self (Personal KYC Verified)" : "Director KYC Completed") : "Self (Personal KYC Verified)"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Work Coordinates</span>
            <span className="font-mono text-navy-950 font-semibold mt-0.5 block">
              {state?.workLocation?.latitude && state?.workLocation?.longitude
                ? `${state.workLocation.latitude}, ${state.workLocation.longitude}`
                : "Captured"}
            </span>
            {state?.workLocation?.source && (
              <span className="text-[11px] text-slate-500">
                Source: {state.workLocation.source === "KYC_LOCATION" ? "Personal KYC Location" : "Current Device GPS"}
              </span>
            )}
          </div>
          <div className="sm:col-span-3 pt-2 border-t border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Work / Registered Address</span>
            <span className="text-slate-800 font-medium mt-0.5 block">{workAddrText}</span>
          </div>
          {existingShopPhoto?.url && (
            <div className="sm:col-span-3 pt-2 border-t border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Shop / Premises Photo</span>
              <a
                href={existingShopPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 hover:border-emerald-400 transition-colors"
              >
                <img
                  src={existingShopPhoto.url}
                  alt="Shop photo"
                  className="max-h-40 rounded-lg object-contain"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-bold text-navy-950">Business Registration</h2>
        <p className="text-xs text-slate-500">
          Choose how you want to register your business. Once submitted, an administrator will review and mark your business as verified.
        </p>
      </div>

      {businessStatus === "REJECTED" && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-sm text-rose-950">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Business Registration Rejected</p>
            <p className="text-xs text-rose-800 mt-0.5">
              Reason: {state?.businessReviewNote || "Please review and resubmit your business registration details."}
            </p>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}

      {/* Step 1: Choose Individual vs Company */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("INDIVIDUAL")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            mode === "INDIVIDUAL"
              ? "border-navy-950 bg-navy-950 text-white shadow-sm"
              : "border-slate-200 bg-slate-50/70 text-navy-950 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-sm font-bold">
              <User className="h-4 w-4 text-emerald-500" />
              Register as an Individual
            </span>
            {mode === "INDIVIDUAL" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </div>
          <p className={`mt-1.5 text-xs ${mode === "INDIVIDUAL" ? "text-slate-300" : "text-slate-500"}`}>
            Use your verified personal KYC, work location coordinates, and Aadhaar address. You are the authorized signatory by default.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("COMPANY")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            mode === "COMPANY"
              ? "border-navy-950 bg-navy-950 text-white shadow-sm"
              : "border-slate-200 bg-slate-50/70 text-navy-950 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-sm font-bold">
              <Building2 className="h-4 w-4 text-emerald-500" />
              Register as a Company
            </span>
            {mode === "COMPANY" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </div>
          <p className={`mt-1.5 text-xs ${mode === "COMPANY" ? "text-slate-300" : "text-slate-500"}`}>
            Fetch company &amp; board of directors from MCA using your CIN / LLPIN and select the authorized signatory.
          </p>
        </button>
      </div>

      {/* Path A: Individual Registration */}
      {mode === "INDIVIDUAL" ? (
        <form className="space-y-5" onSubmit={handleSubmitIndividual}>
          {/* 1. Work Location Coordinates */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-emerald-600" />
                Work Location Coordinates (Lat / Long)
              </h3>
              <p className="text-xs text-slate-500">
                Choose the geo-location from where you operate your business.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {kycLoc?.available && (
                <label
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                    locationSource === "KYC_LOCATION"
                      ? "border-emerald-600 bg-emerald-50/60"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="locationSource"
                    checked={locationSource === "KYC_LOCATION"}
                    onChange={() => setLocationSource("KYC_LOCATION")}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-navy-950 block">
                      Same location captured during Individual KYC
                    </span>
                    <span className="font-mono text-[11px] text-emerald-800 mt-0.5 block">
                      Lat: {kycLoc.latitude} · Lng: {kycLoc.longitude}
                    </span>
                  </div>
                </label>
              )}

              <label
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  locationSource === "CURRENT_DEVICE"
                    ? "border-emerald-600 bg-emerald-50/60"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="locationSource"
                  checked={locationSource === "CURRENT_DEVICE"}
                  onChange={() => {
                    setLocationSource("CURRENT_DEVICE");
                    if (!deviceCoords) handleCaptureCurrentGps();
                  }}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs flex-1">
                  <span className="font-bold text-navy-950 block">Capture current device location</span>
                  {deviceCoords ? (
                    <span className="font-mono text-[11px] text-emerald-800 mt-0.5 block">
                      Lat: {deviceCoords.latitude} · Lng: {deviceCoords.longitude}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {capturingGps ? "Capturing GPS coordinates…" : "Uses your current GPS coordinates"}
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* 2. Work Address */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Work Address
                </h3>
                <p className="text-xs text-slate-500">
                  Your work address defaults to your verified Aadhaar address, or you can enter a different operating address.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-navy-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPersonal}
                  onChange={(e) => setSameAsPersonal(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Same as Aadhaar Address
              </label>
            </div>

            {sameAsPersonal ? (
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Work Address (Same as Verified Aadhaar Address)
                </span>
                <p className="text-slate-800 font-medium">{permAddr.fullAddress || "Verified Aadhaar Address"}</p>
                <p className="text-slate-500 text-[11px]">
                  {[permAddr.vtc || permAddr.district, permAddr.state, permAddr.pincode].filter(Boolean).join(" · ")}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                  Shop / Building / Street (Line 1)
                  <input
                    className="field mt-1"
                    value={customAddr.line1}
                    onChange={(e) => setCustomAddr({ ...customAddr, line1: e.target.value })}
                    placeholder="Shop No, Building Name, Street"
                    required
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Locality / Area <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1"
                    value={customAddr.area || customAddr.line2}
                    onChange={(e) => setCustomAddr({ ...customAddr, area: e.target.value, line2: e.target.value })}
                    placeholder="Locality / Area"
                    required
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Landmark (Optional)
                  <input
                    className="field mt-1"
                    value={customAddr.landmark}
                    onChange={(e) => setCustomAddr({ ...customAddr, landmark: e.target.value })}
                    placeholder="Near Market / Metro"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  City / Town <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1"
                    value={customAddr.city}
                    onChange={(e) => setCustomAddr({ ...customAddr, city: e.target.value })}
                    required
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  District <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1"
                    value={customAddr.district}
                    onChange={(e) => setCustomAddr({ ...customAddr, district: e.target.value })}
                    required
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  State
                  <select
                    className="field mt-1"
                    value={customAddr.state}
                    onChange={(e) => setCustomAddr({ ...customAddr, state: e.target.value })}
                    required
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-700">
                  6-Digit Pincode
                  <input
                    className="field mt-1 font-mono"
                    inputMode="numeric"
                    maxLength={6}
                    value={customAddr.pincode}
                    onChange={(e) =>
                      setCustomAddr({
                        ...customAddr,
                        pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    placeholder="560001"
                    required
                  />
                </label>
              </div>
            )}

            <label className="text-xs font-medium text-slate-700 block">
              Shop / Trade Name <span className="text-rose-600">*</span>
              <input
                className="field mt-1"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma Fin Care & Telecom"
                required
              />
            </label>

            {renderShopPhotoField()}
          </div>

          {renderRegulatoryFields()}

          {/* 3. Default Authorized Signatory */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Authorized Signatory (Default)
              </span>
              <p className="text-sm font-bold text-navy-950">{verifiedPartnerName}</p>
              <p className="text-xs text-slate-500">
                Your verified personal identity KYC serves as the authorized signatory verification.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Self · KYC Verified
            </span>
          </div>

          <button type="submit" disabled={busy || !personalDone || !shopName.trim()} className="btn-primary">
            {busy ? "Submitting…" : "Submit Business Registration for Admin Review"}
          </button>
        </form>
      ) : (
        /* Path B: Company Registration via CIN */
        <form className="space-y-5" onSubmit={handleSubmitCompany}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Company CIN / LLPIN Number
            </label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                className="field font-mono text-sm uppercase flex-1"
                placeholder="e.g. U62099KA2024PTC183699"
                maxLength={25}
                value={cinInput}
                onChange={(e) => setCinInput(e.target.value.toUpperCase())}
                required
              />
              <button
                type="button"
                disabled={!cinInput.trim() || lookupBusy}
                onClick={handleLookupCompany}
                className="btn-secondary text-xs px-4 py-2.5 font-bold shrink-0"
              >
                {lookupBusy ? "Fetching from MCA…" : "Fetch Company Details"}
              </button>
            </div>
          </div>

          {companyInfo && (
            <>
              {/* Verified Company Master Data Card */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      MCA Verified Company
                    </span>
                    <h3 className="font-display text-base font-bold text-navy-950">
                      {companyInfo.companyName}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {companyInfo.status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">CIN</span>
                    <span className="font-mono font-semibold text-navy-950">{companyInfo.cin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Class / RoC</span>
                    <span className="font-semibold text-navy-950">
                      {[companyInfo.classOfCompany, companyInfo.rocCode].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Incorporation Date</span>
                    <span className="font-semibold text-navy-950">{companyInfo.dateOfIncorporation || "—"}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      MCA Registered Office Address
                    </span>
                    <span className="text-slate-800 font-medium">{companyInfo.registeredAddress}</span>
                  </div>
                </div>
              </div>

              {/* Mandatory Shop / Trade Name + Operating Address + Optional Shop Photo for Company */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                <label className="text-xs font-medium text-slate-700 block">
                  Shop / Trade Name <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={`e.g. ${companyInfo.companyName}`}
                    required
                  />
                </label>

                <div className="space-y-3 border-t border-slate-200/80 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-navy-950 block">Operating / Shop Address</span>
                      <span className="text-[11px] text-slate-500">
                        Use MCA registered office address or specify your operating retail outlet address
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-navy-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={companySameAddr}
                        onChange={(e) => setCompanySameAddr(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Same as MCA Address
                    </label>
                  </div>

                  {!companySameAddr && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                        Shop / Building / Street (Line 1) <span className="text-rose-600">*</span>
                        <input
                          className="field mt-1"
                          value={companyAddr.line1}
                          onChange={(e) => setCompanyAddr({ ...companyAddr, line1: e.target.value })}
                          placeholder="Shop No, Building Name, Street"
                          required
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        Locality / Area <span className="text-rose-600">*</span>
                        <input
                          className="field mt-1"
                          value={companyAddr.area}
                          onChange={(e) => setCompanyAddr({ ...companyAddr, area: e.target.value })}
                          placeholder="Locality / Area"
                          required
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        Landmark (Optional)
                        <input
                          className="field mt-1"
                          value={companyAddr.landmark}
                          onChange={(e) => setCompanyAddr({ ...companyAddr, landmark: e.target.value })}
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        City / Town <span className="text-rose-600">*</span>
                        <input
                          className="field mt-1"
                          value={companyAddr.city}
                          onChange={(e) => setCompanyAddr({ ...companyAddr, city: e.target.value })}
                          required
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        District <span className="text-rose-600">*</span>
                        <input
                          className="field mt-1"
                          value={companyAddr.district}
                          onChange={(e) => setCompanyAddr({ ...companyAddr, district: e.target.value })}
                          required
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        State <span className="text-rose-600">*</span>
                        <select
                          className="field mt-1"
                          value={companyAddr.state}
                          onChange={(e) => setCompanyAddr({ ...companyAddr, state: e.target.value })}
                          required
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        6-Digit Pincode <span className="text-rose-600">*</span>
                        <input
                          className="field mt-1 font-mono"
                          inputMode="numeric"
                          maxLength={6}
                          value={companyAddr.pincode}
                          onChange={(e) =>
                            setCompanyAddr({
                              ...companyAddr,
                              pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                            })
                          }
                          placeholder="560001"
                          required
                        />
                      </label>
                    </div>
                  )}
                </div>

                {renderShopPhotoField()}
              </div>

              {renderRegulatoryFields()}

              {/* Select Authorized Signatory from Active Directors */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Select Authorized Signatory from Board of Directors
                  </h3>
                  <p className="text-xs text-slate-500">
                    If you are one of the active directors, your personal KYC is automatically used. Otherwise, we will generate a KYC verification link for the selected director.
                  </p>
                </div>

                <div className="space-y-2">
                  {companyInfo.directors.map((dir) => {
                    const checked = selectedDin === dir.din;
                    return (
                      <label
                        key={dir.din}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                          checked
                            ? "border-emerald-600 bg-emerald-50/60"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="director"
                            checked={checked}
                            onChange={() => setSelectedDin(dir.din)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="text-sm font-bold text-navy-950 block">{dir.name}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              DIN: {dir.din}
                              {dir.startDate ? ` · Appointed: ${dir.startDate}` : ""}
                            </span>
                          </div>
                        </div>

                        {dir.isSelf ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <Fingerprint className="h-3 w-3" />
                            You · KYC Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            Requires Signatory KYC Link
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {selectedDirector && !selectedDirector.isSelf && (
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-4 space-y-2">
                    <label className="text-xs font-bold text-amber-950 block">
                      Mobile Number for {selectedDirector.name} (to receive KYC verification link)
                      <input
                        className="field mt-1.5 font-mono bg-white"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={signatoryMobile}
                        onChange={(e) => setSignatoryMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        required
                      />
                    </label>
                    <p className="text-[11px] text-amber-800">
                      An SMS with a secure KYC verification link will be sent to {selectedDirector.name}. You will also get a copyable link on the next screen.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={busy || !personalDone || !selectedDin || !shopName.trim()}
                className="btn-primary inline-flex items-center gap-2"
              >
                {selectedDirector?.isSelf ? (
                  <>Submit Company Registration for Admin Review</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {busy ? "Sending KYC Link…" : "Generate & Send Signatory KYC Link"}
                  </>
                )}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
