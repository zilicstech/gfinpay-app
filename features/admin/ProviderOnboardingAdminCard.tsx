"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Fingerprint,
  Landmark,
  Power,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { api, apiBlob, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { Alert, StatusPill } from "@/components/ui/primitives";

type DossierSummary = {
  bcAgentId?: string;
  fullName?: string;
  companyName?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  hasPan?: boolean;
  panMasked?: string;
  hasFullAadhaar?: boolean;
  aadhaarMasked?: string;
  gstin?: string;
  shopAddress?: string;
  shopArea?: string;
  shopCity?: string;
  shopDistrict?: string;
  shopState?: string;
  shopPincode?: string;
  latitude?: string;
  longitude?: string;
  bankAccountId?: string | null;
  bankName?: string;
  ifsc?: string;
  accountType?: string;
  accountNumberMasked?: string;
  bankVerificationStatus?: string;
  personalVerified?: boolean;
  businessVerified?: boolean;
  agreementSigned?: boolean;
  readyForEmerald?: boolean;
  missingFields?: string[];
};

type AdminBankIfscDetails = {
  ifsc?: string;
  micr?: string;
  bank?: string;
  bankCode?: string;
  bankName?: string;
  branch?: string;
  centre?: string;
  district?: string;
  state?: string;
  city?: string;
  address?: string;
  imps?: boolean;
  rtgs?: boolean;
  neft?: boolean;
  upi?: boolean;
};

type AdminBankAccountRow = {
  id: string;
  account_name?: string;
  account_number?: string;
  ifsc?: string;
  bank_name?: string;
  account_type?: "SAVINGS" | "CURRENT" | string;
  branch_name?: string | null;
  imps_ref_no?: string | null;
  verification_remarks?: string | null;
  ifsc_details?: AdminBankIfscDetails | null;
  active?: boolean;
  verification_status?: string;
  verified_name?: string | null;
  name_match_score?: number | null;
  provider_ref?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
};

type ProviderChannelRow = {
  channel_id: string;
  channel_key: string;
  provider_code: string;
  pipe_code: string;
  display_label: string;
  platform_channel_active: boolean;
  supports_upi_cashout?: boolean;
  supports_aeps?: boolean;
  supports_payout?: boolean;
  biometric_required?: boolean;
  priority_order?: number;
  onboarded: boolean;
  activation_id?: string | null;
  outlet_code?: string | null;
  merchant_status?: string | null;
  pipe_outlet_code?: string | null;
  onboarding_status: string;
  kyc_status: string;
  biometric_verified_at?: string | null;
  bank_sync_status: string;
  synced_bank_account_id?: string | null;
  bank_sync_remarks?: string | null;
  enabled_for_retailer: boolean;
  last_error?: string | null;
  last_synced_at?: string | null;
};

type ProviderActivationRow = {
  id: string;
  channel_id: string;
  channel_key: string;
  provider_code: string;
  pipe_code: string;
  display_label: string;
  platform_channel_active: boolean;
  outlet_code: string;
  pipe_outlet_code?: string | null;
  onboarding_status: string;
  kyc_status: string;
  biometric_verified_at?: string | null;
  bank_sync_status: string;
  synced_bank_account_id?: string | null;
  bank_sync_remarks?: string | null;
  enabled_for_retailer: boolean;
  last_error?: string | null;
  last_synced_at?: string | null;
};

type BiometricSessionRow = {
  id: string;
  provider_code: string;
  pipe_code: string;
  external_ref: string;
  status: string;
  rd_rds_id?: string | null;
  rd_mi?: string | null;
  rd_srno?: string | null;
  q_score?: number | null;
  nm_points?: number | null;
  provider_status_code?: string | null;
  provider_message?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
};

type EmeraldApiLogRow = {
  id: string;
  callId: string;
  requestId?: string | null;
  direction: "OUTBOUND" | "INBOUND_WEBHOOK" | string;
  flow: string;
  httpMethod: string;
  url: string;
  endpointPath: string;
  userId?: string | null;
  outletCode?: string | null;
  externalRef?: string | null;
  providerTxnId?: string | null;
  requestHeaders?: Record<string, unknown>;
  requestBody?: string | null;
  httpStatus?: number | null;
  providerCode?: string | null;
  providerMessage?: string | null;
  responseHeaders?: Record<string, unknown>;
  responseBody?: string | null;
  errorMessage?: string | null;
  latencyMs?: number | null;
  createdAt?: string | null;
};

function prettyBody(raw?: string | null): string {
  if (!raw) return "(empty)";
  const trimmed = raw.trim();
  if (!trimmed) return "(empty)";
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return raw;
  }
}

function buildEmeraldSupportTrace(log: EmeraldApiLogRow): string {
  const lines = [
    "=== EMERALD API REQUEST & RESPONSE TRACE ===",
    `Call ID: ${log.callId}`,
    `X-Request-Id: ${log.requestId || "N/A"}`,
    `Timestamp: ${log.createdAt || "N/A"}`,
    `Direction / Flow: ${log.direction} / ${log.flow}`,
    `Endpoint: ${log.httpMethod} ${log.url || log.endpointPath}`,
    `Outlet Code: ${log.outletCode || "N/A"}`,
    `External Ref: ${log.externalRef || "N/A"}`,
    `Provider Txn ID: ${log.providerTxnId || "N/A"}`,
    `HTTP Status: ${log.httpStatus ?? "NETWORK_ERROR"} | Provider Code: ${log.providerCode || "N/A"} | Latency: ${log.latencyMs ?? 0} ms`,
  ];
  if (log.errorMessage) {
    lines.push(`Error: ${log.errorMessage}`);
  }
  lines.push(
    "",
    "--- REQUEST HEADERS ---",
    JSON.stringify(log.requestHeaders ?? {}, null, 2),
    "",
    "--- REQUEST BODY ---",
    prettyBody(log.requestBody),
    "",
    "--- RESPONSE HEADERS ---",
    JSON.stringify(log.responseHeaders ?? {}, null, 2),
    "",
    "--- RESPONSE BODY ---",
    prettyBody(log.responseBody),
  );
  return lines.join("\n");
}

type RetailerProvidersResponse = {
  emeraldConfigured: boolean;
  defaultPipe: string;
  entityCode: string;
  bankVerificationStatus?: string;
  banks?: AdminBankAccountRow[];
  dossier: DossierSummary;
  merchantAccounts: {
    id: string;
    provider_code: string;
    entity_code: string;
    outlet_code: string;
    status: string;
    onboarded_at?: string | null;
    last_synced_at?: string | null;
  }[];
  providerChannels?: ProviderChannelRow[];
  activations: ProviderActivationRow[];
  biometricSessions: BiometricSessionRow[];
  bankSyncStatus?: string;
  bankSyncRemarks?: string | null;
};

export function RetailerBankingAdminTab({
  userId,
  token,
  refreshKey,
  onChanged,
  onDone,
  onFail,
}: {
  userId: string;
  token: string | null;
  refreshKey?: number;
  onChanged?: () => void;
  onDone?: (msg: string) => void;
  onFail?: (err: unknown, fallback: string) => void;
}) {
  const [data, setData] = useState<RetailerProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  // Admin inline backfill inputs for legacy retailers missing 12-digit Aadhaar or email
  const [aadhaarOverride, setAadhaarOverride] = useState("");
  const [emailOverride, setEmailOverride] = useState("");

  // Emerald API request/response trace logs for troubleshooting & sharing with Emerald team
  const [emeraldLogs, setEmeraldLogs] = useState<EmeraldApiLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [logDirectionFilter, setLogDirectionFilter] = useState<"ALL" | "OUTBOUND" | "INBOUND_WEBHOOK">("ALL");
  const [logSearch, setLogSearch] = useState("");

  const loadEmeraldLogs = useCallback(async () => {
    if (!token || !userId) return;
    setLogsLoading(true);
    try {
      const rows = await api<EmeraldApiLogRow[]>(
        `/api/v1/admin/users/${userId}/providers/emerald/logs?limit=50`,
        { token },
      );
      setEmeraldLogs(Array.isArray(rows) ? rows : []);
    } catch {
      // Non-blocking if logs endpoint is unavailable
    } finally {
      setLogsLoading(false);
    }
  }, [token, userId]);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const [res] = await Promise.all([
        api<RetailerProvidersResponse>(`/api/v1/admin/users/${userId}/providers`, { token }),
        loadEmeraldLogs(),
      ]);
      setData(res);
    } catch (e) {
      setLocalErr(formatApiError(e, "Could not load banking & provider state"));
    } finally {
      setLoading(false);
    }
  }, [token, userId, loadEmeraldLogs]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function notifyOk(msg: string) {
    setLocalErr(null);
    setLocalMsg(msg);
    onDone?.(msg);
  }

  function notifyErr(err: unknown, fallback: string) {
    setLocalMsg(null);
    setLocalErr(formatApiError(err, fallback));
    onFail?.(err, fallback);
  }

  async function handleVerifyBank(bank: AdminBankAccountRow) {
    if (!token) return;
    setBusyAction(`verify-bank-${bank.id}`);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/banks/${bank.id}/verify`,
        {
          token,
          method: "POST",
          body: "{}",
        },
      );
      setData(res);
      onChanged?.();
      const updated = (res.banks ?? []).find((b) => b.id === bank.id);
      notifyOk(
        `Bank account verified! Holder: ${updated?.verified_name || updated?.account_name || "Verified"} (${updated?.bank_name || bank.bank_name || "Bank"}).`,
      );
    } catch (err) {
      notifyErr(err, "Bank account verification check failed");
      await load().catch(() => undefined);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleBankActive(bank: AdminBankAccountRow) {
    if (!token) return;
    const nextActive = !bank.active;
    setBusyAction(`active-bank-${bank.id}`);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/banks/${bank.id}/active`,
        {
          token,
          method: "POST",
          body: JSON.stringify({ active: nextActive }),
        },
      );
      setData(res);
      onChanged?.();
      notifyOk(`Bank account marked as ${nextActive ? "ACTIVE" : "INACTIVE"}.`);
    } catch (err) {
      notifyErr(err, "Could not update bank account active status");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleOnboardProvider(providerCode: string, pipeCode: string) {
    if (!token) return;
    const key = `onboard-${providerCode}-${pipeCode}`;
    setBusyAction(key);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/providers/${encodeURIComponent(providerCode.toLowerCase())}/onboard`,
        {
          token,
          method: "POST",
          body: JSON.stringify({
            pipeCode: pipeCode || "INSTANTPAY",
            aadhaarNumber: aadhaarOverride.replace(/\D/g, "") || undefined,
            email: emailOverride.trim() || undefined,
          }),
        },
      );
      setData(res);
      setAadhaarOverride("");
      setEmailOverride("");
      onChanged?.();
      notifyOk(
        `Retailer onboarded to ${providerCode} (Pipe: ${pipeCode || "INSTANTPAY"}). Retailer can now complete Biometric KYC.`,
      );
    } catch (err) {
      notifyErr(err, `${providerCode} onboarding failed`);
    } finally {
      setBusyAction(null);
      loadEmeraldLogs().catch(() => undefined);
    }
  }

  async function handleSyncProviderBank(providerCode: string, pipeCode: string) {
    if (!token) return;
    const key = `sync-bank-${providerCode}-${pipeCode}`;
    setBusyAction(key);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/providers/${encodeURIComponent(providerCode.toLowerCase())}/sync-bank`,
        {
          token,
          method: "POST",
          body: JSON.stringify({ pipeCode }),
        },
      );
      setData(res);
      const ok = res.bankSyncStatus === "SYNCED";
      if (ok) {
        notifyOk(`Settlement bank account synced to ${providerCode} (${pipeCode}).`);
      } else {
        setLocalErr(res.bankSyncRemarks || `Bank sync returned a failure remark from ${providerCode}.`);
      }
    } catch (err) {
      notifyErr(err, `Could not sync settlement bank to ${providerCode}`);
    } finally {
      setBusyAction(null);
      loadEmeraldLogs().catch(() => undefined);
    }
  }

  async function handleRefreshProviderStatus(providerCode: string, channelId?: string) {
    if (!token) return;
    const key = channelId ? `refresh-${channelId}` : `refresh-${providerCode}`;
    setBusyAction(key);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/providers/${encodeURIComponent(providerCode.toLowerCase())}/refresh`,
        {
          token,
          method: "POST",
          body: "{}",
        },
      );
      setData(res);
      notifyOk(`Checked live outlet, KYC & bank sync status from ${providerCode}.`);
    } catch (err) {
      notifyErr(err, `Could not check live status from ${providerCode}`);
    } finally {
      setBusyAction(null);
      loadEmeraldLogs().catch(() => undefined);
    }
  }

  async function handleToggleChannel(
    channelId: string,
    providerLabel: string,
    enabled: boolean,
    reopenBiometric = false,
  ) {
    if (!token) return;
    setBusyAction(`channel-${channelId}`);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/providers/channels/${channelId}`,
        {
          token,
          method: "PATCH",
          body: JSON.stringify({
            enabledForRetailer: enabled,
            reopenBiometric,
          }),
        },
      );
      setData(res);
      onChanged?.();
      notifyOk(
        reopenBiometric
          ? `Biometric KYC reopened for ${providerLabel}.`
          : `${providerLabel} ${enabled ? "enabled" : "disabled"} for this retailer.`,
      );
    } catch (err) {
      notifyErr(err, "Could not update provider channel");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadCsv() {
    if (!token) return;
    setBusyAction("csv");
    setLocalErr(null);
    try {
      const { blob } = await apiBlob(`/api/v1/admin/users/${userId}/providers/export-csv`, { token });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retailer_onboarding_${userId.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyErr(err, "Could not download 24-column onboarding CSV");
    } finally {
      setBusyAction(null);
    }
  }

  if (loading && !data) {
    return <div className="card h-64 animate-pulse bg-slate-100 rounded-[2rem]" />;
  }
  if (!data) {
    return localErr ? <Alert tone="error">{localErr}</Alert> : null;
  }

  const d = data.dossier || {};
  const banks = data.banks ?? [];
  const bankStatus = data.bankVerificationStatus || d.bankVerificationStatus || "NOT_VERIFIED";
  const sessions = data.biometricSessions || [];
  const activations = data.activations || [];

  // Build unified per-provider channel list from platform providerChannels (falling back to activations if needed)
  const channels: ProviderChannelRow[] =
    data.providerChannels && data.providerChannels.length > 0
      ? data.providerChannels
      : activations.map((a) => ({
          channel_id: a.channel_id,
          channel_key: a.channel_key,
          provider_code: a.provider_code,
          pipe_code: a.pipe_code,
          display_label: a.display_label,
          platform_channel_active: a.platform_channel_active,
          onboarded: true,
          activation_id: a.id,
          outlet_code: a.outlet_code,
          pipe_outlet_code: a.pipe_outlet_code,
          onboarding_status: a.onboarding_status,
          kyc_status: a.kyc_status,
          biometric_verified_at: a.biometric_verified_at,
          bank_sync_status: a.bank_sync_status,
          synced_bank_account_id: a.synced_bank_account_id,
          bank_sync_remarks: a.bank_sync_remarks,
          enabled_for_retailer: a.enabled_for_retailer,
          last_error: a.last_error,
          last_synced_at: a.last_synced_at,
        }));

  const onboardedChannels = channels.filter((c) => c.onboarded);
  const fullKycChannels = onboardedChannels.filter((c) => c.kyc_status === "FULL_KYC");
  const routableChannels = onboardedChannels.filter(
    (c) => c.enabled_for_retailer && c.platform_channel_active && c.kyc_status === "FULL_KYC",
  );
  const syncedBankIds = new Set(
    onboardedChannels
      .filter((c) => c.bank_sync_status === "SYNCED" && c.synced_bank_account_id)
      .map((c) => String(c.synced_bank_account_id)),
  );

  const missing = d.missingFields ?? [];
  const needsAadhaarBackfill = !d.hasFullAadhaar;
  const needsEmailBackfill = !d.email;
  const hasUnonboardedChannel = channels.some((c) => !c.onboarded) || channels.length === 0;

  return (
    <div className="space-y-6">
      {localErr && <Alert tone="error">{localErr}</Alert>}
      {localMsg && <Alert tone="success">{localMsg}</Alert>}

      {/* 1. Top Banking & Provider Switch Summary Strip */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-lg font-bold text-navy-950">
                Retailer Banking &amp; Provider Switch Operations
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  bankStatus === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-amber-50 border-amber-300 text-amber-800"
                }`}
              >
                <Landmark className="h-3.5 w-3.5" />
                Bank Verified: {bankStatus === "VERIFIED" ? "YES" : bankStatus}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  routableChannels.length > 0
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-slate-100 border-slate-300 text-slate-700"
                }`}
              >
                <Server className="h-3.5 w-3.5" />
                Active Providers: {routableChannels.length} / {Math.max(channels.length, 1)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify settlement bank accounts, onboard upstream banking switches, toggle per-provider access, and check live provider status.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                ? `${banks.filter((b) => b.verification_status === "VERIFIED").length} of ${banks.length} account(s) verified`
                : "No bank account added yet"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Provider Onboarding
              </span>
              <Server className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <StatusPill value={onboardedChannels.length > 0 ? "ONBOARDED" : "NOT_ONBOARDED"} />
            </div>
            <p className="text-[11px] text-slate-500">
              {onboardedChannels.length} of {Math.max(channels.length, 1)} provider channel(s) onboarded
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Biometric KYC
              </span>
              <Fingerprint className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <StatusPill
                value={
                  fullKycChannels.length > 0
                    ? "FULL_KYC"
                    : onboardedChannels.length > 0
                      ? "PENDING_BIOMETRIC"
                      : "NOT_STARTED"
                }
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {fullKycChannels.length > 0
                ? `${fullKycChannels.length} channel(s) Biometric Full KYC`
                : onboardedChannels.length > 0
                  ? "Awaiting retailer L1 RD fingerprint scan"
                  : "Onboard a provider to initiate biometric"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Service Router Status
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <StatusPill value={routableChannels.length > 0 ? "ACTIVE" : "PENDING"} />
            </div>
            <p className="text-[11px] text-slate-500">
              {routableChannels.length > 0
                ? `${routableChannels.length} channel(s) routing Cashout, AePS & Payout`
                : "Requires Onboarded + Enabled + Full KYC"}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Settlement Bank Accounts & Admin Verification Check */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-navy-950">
                Settlement Bank Accounts ({banks.length})
              </h3>
              <p className="text-xs text-slate-500">
                Check bank account details, holder name match, IFSC rails, and re-verify via Surepass bank verification
              </p>
            </div>
          </div>
          <StatusPill value={bankStatus} />
        </div>

        {banks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-xs text-slate-500">
            No settlement bank accounts registered by this retailer yet. Once the retailer adds a bank account in{" "}
            <span className="font-semibold text-navy-950">My Profile → Bank</span>, it will appear here for inspection and verification.
          </div>
        ) : (
          <div className="space-y-3">
            {banks.map((b) => {
              const details = b.ifsc_details || {};
              const branchLine = [b.branch_name || details.branch, details.city, details.district, details.state]
                .filter(Boolean)
                .filter((val, idx, arr) => arr.indexOf(val) === idx)
                .join(", ");
              const rails = (
                [
                  details.imps ? "IMPS" : null,
                  details.neft ? "NEFT" : null,
                  details.rtgs ? "RTGS" : null,
                  details.upi ? "UPI" : null,
                ].filter(Boolean) as string[]
              );
              const isSyncedToSwitch = syncedBankIds.has(String(b.id));
              const verifyBusy = busyAction === `verify-bank-${b.id}`;
              const activeBusy = busyAction === `active-bank-${b.id}`;

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-navy-950">
                          {b.bank_name || "Bank Account"}
                        </p>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          {b.account_type === "CURRENT" ? "CURRENT" : "SAVINGS"}
                        </span>
                        <StatusPill value={b.active ? "ACTIVE" : "INACTIVE"} />
                        <StatusPill value={b.verification_status || "NOT_VERIFIED"} />
                        {isSyncedToSwitch && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Synced to Switch
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs font-semibold text-navy-950">
                        A/C: {b.account_number || "—"} · IFSC: {b.ifsc || "—"} · Holder: {b.account_name || "—"}
                      </p>
                      {branchLine && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Branch: {branchLine}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() => handleVerifyBank(b)}
                        className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {verifyBusy
                          ? "Checking Bank…"
                          : b.verification_status === "VERIFIED"
                            ? "Re-check Bank Account"
                            : "Check & Verify Bank"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 text-[11px] text-slate-600">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {b.verified_name && (
                        <span>
                          Bank Verified Holder: <strong className="text-navy-950">{b.verified_name}</strong>
                        </span>
                      )}
                      {b.name_match_score != null && (
                        <span>
                          Name Match:{" "}
                          <strong className={Number(b.name_match_score) >= 70 ? "text-emerald-700" : "text-rose-700"}>
                            {b.name_match_score}%
                          </strong>
                        </span>
                      )}
                      {b.imps_ref_no && <span className="font-mono text-slate-500">IMPS Ref: #{b.imps_ref_no}</span>}
                      {b.provider_ref && <span className="font-mono text-slate-400">Ref: {b.provider_ref}</span>}
                      {b.verified_at && <span>Verified {when(b.verified_at)}</span>}
                      {b.verification_remarks && (
                        <span className="text-amber-800">Remarks: {b.verification_remarks}</span>
                      )}
                    </div>

                    {rails.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        {rails.map((rail) => (
                          <span
                            key={rail}
                            className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800"
                          >
                            {rail}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Per-Provider Switch Onboarding, Enable/Disable & Live Status Checks */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-navy-950">
                Banking Switch Providers &amp; Per-Provider Controls
              </h3>
              <p className="text-xs text-slate-500">
                Onboard providers, enable or disable per-provider routing, sync settlement banks, and verify live status at per-provider level. Retailers never see upstream provider names.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={handleDownloadCsv}
              className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {busyAction === "csv" ? "Exporting…" : "24-Col Vendor CSV"}
            </button>
          </div>
        </div>

        {/* Unified Multi-Provider Dossier Readiness */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Provider Onboarding Dossier Readiness
            </span>
            {d.readyForEmerald ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dossier Complete ({data.entityCode})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5" />
                Missing {missing.length} Required Field{missing.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">PAN / Aadhaar</span>
              <span className="font-mono font-semibold text-navy-950 block mt-0.5">
                {d.panMasked || "Missing PAN"} · {d.hasFullAadhaar ? d.aadhaarMasked || "12-digit Verified" : "12-digit Missing"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Email &amp; Mobile</span>
              <span className="font-semibold text-navy-950 block mt-0.5 truncate">
                {d.email || "Missing Email"} · {d.mobile || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Shop &amp; Geo-Coordinates</span>
              <span className="font-semibold text-navy-950 block mt-0.5 truncate">
                {d.shopName || "—"} ({d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : "No GPS"})
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Primary Settlement Bank</span>
              <span className="font-semibold text-navy-950 block mt-0.5 truncate">
                {d.bankName
                  ? `${d.bankName} (${d.accountType || "SAVINGS"}) · ${d.accountNumberMasked || ""}`
                  : "No Active Bank"}
              </span>
            </div>
          </div>

          {missing.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-950">
              <strong>Missing fields before provider onboarding:</strong> {missing.join(", ")}
            </div>
          )}

          {/* Inline backfill inputs if legacy retailer lacks 12-digit Aadhaar or Email */}
          {(needsAadhaarBackfill || needsEmailBackfill) && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-200/80">
              {needsAadhaarBackfill && (
                <label className="text-xs font-medium text-slate-700">
                  12-Digit Aadhaar Number
                  <input
                    className="field mt-1 font-mono bg-white"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder={d.aadhaarMasked ? `Ends with ${d.aadhaarMasked.slice(-4)}` : "12-digit Aadhaar"}
                    value={aadhaarOverride}
                    onChange={(e) => setAadhaarOverride(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  />
                </label>
              )}
              {needsEmailBackfill && (
                <label className="text-xs font-medium text-slate-700">
                  Backfill Partner Email Address
                  <input
                    type="email"
                    className="field mt-1 bg-white"
                    placeholder="partner@example.com"
                    value={emailOverride}
                    onChange={(e) => setEmailOverride(e.target.value)}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Per-Provider Channel Cards */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Per-Provider Channels ({channels.length})
          </h4>

          {channels.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-bold text-navy-950">
                  EMERALD · {data.defaultPipe || "INSTANTPAY"}
                </p>
                <p className="text-xs text-slate-500">
                  Onboard this retailer under entity <span className="font-mono font-semibold">{data.entityCode}</span> with default pipe{" "}
                  <span className="font-mono font-semibold">{data.defaultPipe || "INSTANTPAY"}</span>.
                </p>
              </div>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleOnboardProvider("EMERALD", data.defaultPipe || "INSTANTPAY")}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                {busyAction === `onboard-EMERALD-${data.defaultPipe || "INSTANTPAY"}`
                  ? "Onboarding…"
                  : `Onboard EMERALD (${data.defaultPipe || "INSTANTPAY"})`}
              </button>
            </div>
          ) : (
            channels.map((ch) => {
              const providerLabel = `${ch.provider_code} · ${ch.pipe_code}`;
              const isFullKyc = ch.kyc_status === "FULL_KYC";
              const bankSynced = ch.bank_sync_status === "SYNCED";
              const onboardBusy = busyAction === `onboard-${ch.provider_code}-${ch.pipe_code}`;
              const refreshBusy = busyAction === `refresh-${ch.channel_id}`;
              const syncBankBusy = busyAction === `sync-bank-${ch.provider_code}-${ch.pipe_code}`;
              const toggleBusy = busyAction === `channel-${ch.channel_id}`;

              const capabilities = [
                ch.supports_upi_cashout !== false ? "UPI Cashout" : null,
                ch.supports_aeps !== false ? "AePS" : null,
                ch.supports_payout !== false ? "Payout" : null,
              ].filter(Boolean) as string[];

              return (
                <div
                  key={ch.channel_id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-navy-950 text-white px-2.5 py-1 rounded-lg">
                          {providerLabel}
                        </span>
                        <StatusPill value={ch.onboarded ? ch.onboarding_status : "NOT_ONBOARDED"} />
                        {ch.onboarded && (
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              ch.enabled_for_retailer
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-700"
                            }`}
                          >
                            {ch.enabled_for_retailer ? "Enabled for Retailer" : "Disabled for Retailer"}
                          </span>
                        )}
                        {!ch.platform_channel_active && (
                          <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                            Platform Paused
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          Opaque Key: <span className="font-mono font-semibold text-slate-700">{ch.channel_key}</span>
                        </span>
                        {ch.outlet_code && (
                          <>
                            <span>·</span>
                            <span className="font-mono font-semibold text-emerald-800">
                              Outlet: {ch.outlet_code}
                            </span>
                          </>
                        )}
                        {ch.pipe_outlet_code && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600">Pipe ID: {ch.pipe_outlet_code}</span>
                          </>
                        )}
                        {ch.last_synced_at && (
                          <>
                            <span>·</span>
                            <span>Checked {when(ch.last_synced_at)}</span>
                          </>
                        )}
                      </div>

                      {capabilities.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Per-Provider Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {!ch.onboarded ? (
                        <button
                          type="button"
                          disabled={busyAction !== null}
                          onClick={() => handleOnboardProvider(ch.provider_code, ch.pipe_code)}
                          className="btn-primary !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {onboardBusy ? "Onboarding…" : `Onboard ${ch.provider_code}`}
                        </button>
                      ) : (
                        <>
                          {(!bankSynced || ch.onboarding_status === "FAILED" || !ch.pipe_outlet_code) && (
                            <button
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() => handleOnboardProvider(ch.provider_code, ch.pipe_code)}
                              className={
                                ch.onboarding_status === "FAILED" || !ch.pipe_outlet_code
                                  ? "btn-primary !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1.5"
                                  : "btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                              }
                              title="Retry onboarding with the retailer's approved business location and dossier details"
                            >
                              <RotateCcw className={`h-3.5 w-3.5 ${onboardBusy ? "animate-spin" : ""}`} />
                              {onboardBusy ? "Retrying…" : "Retry Onboarding"}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() => handleRefreshProviderStatus(ch.provider_code, ch.channel_id)}
                            className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                            title="Query live outlet, biometric KYC & bank sync status from provider"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshBusy ? "animate-spin" : ""}`} />
                            {refreshBusy ? "Checking…" : "Check Status"}
                          </button>

                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() => handleSyncProviderBank(ch.provider_code, ch.pipe_code)}
                            className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                            title="Sync primary active settlement bank account to this provider"
                          >
                            <Landmark className="h-3.5 w-3.5" />
                            {syncBankBusy ? "Syncing…" : "Sync Bank"}
                          </button>

                          {isFullKyc && (
                            <button
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() =>
                                handleToggleChannel(ch.channel_id, providerLabel, ch.enabled_for_retailer, true)
                              }
                              className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                              title="Allow retailer to re-run biometric KYC on this provider"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reopen Biometric
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() =>
                              handleToggleChannel(ch.channel_id, providerLabel, !ch.enabled_for_retailer, false)
                            }
                            className={
                              ch.enabled_for_retailer
                                ? "btn-secondary !py-1.5 !px-3 text-xs text-rose-700 inline-flex items-center gap-1.5"
                                : "btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                            }
                          >
                            <Power className="h-3.5 w-3.5" />
                            {toggleBusy
                              ? "Updating…"
                              : ch.enabled_for_retailer
                                ? "Disable Provider"
                                : "Enable Provider"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Per-Provider Live Status Grid */}
                  <div className="grid gap-3 sm:grid-cols-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Onboarding Status
                      </span>
                      <span className="mt-0.5 block font-bold text-navy-950">
                        {ch.onboarded ? ch.onboarding_status : "NOT_ONBOARDED"}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {ch.outlet_code ? `Entity ${data.entityCode}` : "Ready for onboarding"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Biometric KYC Status
                      </span>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1 font-bold ${
                          isFullKyc
                            ? "text-emerald-700"
                            : ch.onboarded
                              ? "text-amber-700"
                              : "text-slate-500"
                        }`}
                      >
                        {isFullKyc ? (
                          <BadgeCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Fingerprint className="h-3.5 w-3.5" />
                        )}
                        {ch.kyc_status}
                      </span>
                      {ch.biometric_verified_at && (
                        <span className="block text-[11px] text-slate-500">
                          {when(ch.biometric_verified_at)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Provider Bank Sync
                      </span>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1 font-bold ${
                          bankSynced
                            ? "text-emerald-700"
                            : ch.bank_sync_status === "FAILED"
                              ? "text-rose-700"
                              : "text-amber-700"
                        }`}
                      >
                        {ch.bank_sync_status}
                      </span>
                      {ch.bank_sync_remarks && (
                        <span
                          className="block text-[11px] text-slate-500 truncate"
                          title={ch.bank_sync_remarks}
                        >
                          {ch.bank_sync_remarks}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Routing Eligibility
                      </span>
                      <span className="mt-0.5 block font-semibold text-navy-950">
                        {!ch.onboarded
                          ? "Not Onboarded"
                          : ch.enabled_for_retailer && ch.platform_channel_active && isFullKyc
                            ? "Active in Router"
                            : !ch.enabled_for_retailer
                              ? "Disabled for Retailer"
                              : !isFullKyc
                                ? "Awaiting Biometric"
                                : "Platform Channel Paused"}
                      </span>
                    </div>
                  </div>

                  {ch.last_error && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      <strong>Last Provider Error:</strong> {ch.last_error}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Recent Biometric KYC Attempts */}
        {sessions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Biometric KYC Sessions ({sessions.length})
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Ref / Provider</th>
                    <th className="px-3.5 py-2.5">RD Scanner</th>
                    <th className="px-3.5 py-2.5">Quality</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Upstream Message</th>
                    <th className="px-3.5 py-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3.5 py-2.5 font-mono">
                        <span className="font-semibold text-navy-950 block">{s.external_ref}</span>
                        <span className="text-[10px] text-slate-500">
                          {s.provider_code} · {s.pipe_code}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {s.rd_mi || s.rd_rds_id ? (
                          <div>
                            <span className="font-semibold text-navy-950 block">{s.rd_mi || s.rd_rds_id}</span>
                            {s.rd_srno && <span className="font-mono text-[10px] text-slate-500">SN: {s.rd_srno}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">Not submitted</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">
                        {s.q_score != null ? `Q:${s.q_score}` : "—"}
                        {s.nm_points != null ? ` / NM:${s.nm_points}` : ""}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <StatusPill value={s.status} />
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate" title={s.provider_message || ""}>
                        {s.provider_status_code ? `[${s.provider_status_code}] ` : ""}
                        {s.provider_message || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                        {when(s.submitted_at || s.created_at || undefined)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: EMERALD API REQUEST & RESPONSE TRACE LOGS */}
      <section className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold text-navy-950">
                  Emerald API Request &amp; Response Trace Logs
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                  {emeraldLogs.length} captured
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full outbound HTTP requests, responses, headers, and inbound webhook callbacks for Emerald onboarding,
                Biometric KYC, UPI Cashout, AEPS, and Payouts — ready to copy and share with the Emerald support team.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {emeraldLogs.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  const filtered = emeraldLogs.filter((l) => {
                    if (logDirectionFilter !== "ALL" && l.direction !== logDirectionFilter) return false;
                    if (!logSearch.trim()) return true;
                    const q = logSearch.trim().toLowerCase();
                    return (
                      (l.flow || "").toLowerCase().includes(q) ||
                      (l.endpointPath || "").toLowerCase().includes(q) ||
                      (l.externalRef || "").toLowerCase().includes(q) ||
                      (l.providerTxnId || "").toLowerCase().includes(q) ||
                      (l.providerCode || "").toLowerCase().includes(q) ||
                      (l.callId || "").toLowerCase().includes(q)
                    );
                  });
                  const bundle = filtered.map(buildEmeraldSupportTrace).join("\n\n" + "=".repeat(60) + "\n\n");
                  await navigator.clipboard.writeText(bundle);
                  setCopiedKey("all");
                  setTimeout(() => setCopiedKey((prev) => (prev === "all" ? null : prev)), 2000);
                }}
                className="btn-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
              >
                {copiedKey === "all" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied Bundle!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Filtered Logs
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => loadEmeraldLogs()}
              disabled={logsLoading}
              className="btn-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
              {logsLoading ? "Refreshing…" : "Refresh Logs"}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {(
              [
                { id: "ALL", label: "All Traces" },
                { id: "OUTBOUND", label: "Outbound API" },
                { id: "INBOUND_WEBHOOK", label: "Inbound Webhooks" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLogDirectionFilter(tab.id)}
                className={`rounded-lg px-3 py-1 transition ${
                  logDirectionFilter === tab.id
                    ? "bg-white text-navy-950 shadow-sm"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Filter by flow, endpoint, externalRef, txnId, status code…"
            className="field !py-1.5 !px-3 !text-xs w-full sm:w-80"
          />
        </div>

        {(() => {
          const filteredLogs = emeraldLogs.filter((l) => {
            if (logDirectionFilter !== "ALL" && l.direction !== logDirectionFilter) return false;
            if (!logSearch.trim()) return true;
            const q = logSearch.trim().toLowerCase();
            return (
              (l.flow || "").toLowerCase().includes(q) ||
              (l.endpointPath || "").toLowerCase().includes(q) ||
              (l.externalRef || "").toLowerCase().includes(q) ||
              (l.providerTxnId || "").toLowerCase().includes(q) ||
              (l.providerCode || "").toLowerCase().includes(q) ||
              (l.callId || "").toLowerCase().includes(q)
            );
          });

          if (filteredLogs.length === 0) {
            return (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                {emeraldLogs.length === 0
                  ? "No Emerald API calls or webhooks have been recorded for this retailer yet."
                  : "No trace entries match the current filter."}
              </div>
            );
          }

          return (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const httpOk = log.httpStatus != null && log.httpStatus >= 200 && log.httpStatus < 300 && !log.errorMessage;
                const isWebhook = log.direction === "INBOUND_WEBHOOK";

                return (
                  <div
                    key={log.id}
                    className={`rounded-2xl border transition-all ${
                      httpOk
                        ? "border-slate-200 bg-white"
                        : "border-rose-200 bg-rose-50/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isWebhook
                              ? "bg-purple-100 text-purple-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {isWebhook ? "WEBHOOK" : "OUTBOUND"}
                        </span>

                        <span
                          className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                            httpOk
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {log.httpStatus != null ? `HTTP ${log.httpStatus}` : "NET ERR"}
                          {log.providerCode ? ` · ${log.providerCode}` : ""}
                        </span>

                        <span className="font-bold text-navy-950">{log.flow}</span>

                        <span className="font-mono text-[11px] text-slate-600 truncate max-w-md" title={log.url}>
                          {log.httpMethod} {log.endpointPath}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">
                          {log.latencyMs ?? 0}ms
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {when(log.createdAt || undefined)}
                        </span>

                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(buildEmeraldSupportTrace(log));
                            setCopiedKey(log.id);
                            setTimeout(() => setCopiedKey((prev) => (prev === log.id ? null : prev)), 2000);
                          }}
                          className="btn-secondary !py-1 !px-2.5 !text-[11px] inline-flex items-center gap-1"
                          title="Copy formatted Request + Response trace for Emerald support"
                        >
                          {copiedKey === log.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy Req + Res
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="btn-secondary !py-1 !px-2.5 !text-[11px] inline-flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Hide <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              Payload <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Metadata subtitle */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-3.5 py-2 text-[11px] text-slate-500">
                      <span>
                        Call ID: <strong className="font-mono text-slate-700">{log.callId}</strong>
                      </span>
                      {log.outletCode && (
                        <span>
                          Outlet: <strong className="font-mono text-slate-700">{log.outletCode}</strong>
                        </span>
                      )}
                      {log.externalRef && (
                        <span>
                          Ref: <strong className="font-mono text-slate-700">{log.externalRef}</strong>
                        </span>
                      )}
                      {log.providerTxnId && (
                        <span>
                          Provider Txn: <strong className="font-mono text-slate-700">{log.providerTxnId}</strong>
                        </span>
                      )}
                      {log.providerMessage && (
                        <span className="text-slate-600 truncate max-w-md" title={log.providerMessage}>
                          Msg: <strong>{log.providerMessage}</strong>
                        </span>
                      )}
                      {log.errorMessage && (
                        <span className="text-rose-700 font-semibold">
                          Error: {log.errorMessage}
                        </span>
                      )}
                    </div>

                    {/* Expandable Full Request + Response Inspector */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-950 text-slate-100 rounded-b-2xl p-4 space-y-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                          <span>
                            {log.httpMethod} {log.url || log.endpointPath}
                          </span>
                          {log.requestId && <span>X-Request-Id: {log.requestId}</span>}
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="space-y-2 min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                              Request Headers &amp; Body
                            </div>
                            <pre className="overflow-x-auto rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-slate-300 max-h-40">
                              {JSON.stringify(log.requestHeaders ?? {}, null, 2)}
                            </pre>
                            <pre className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-emerald-200 max-h-80">
                              {prettyBody(log.requestBody)}
                            </pre>
                          </div>

                          <div className="space-y-2 min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                              Response Headers &amp; Body (HTTP {log.httpStatus ?? "ERR"})
                            </div>
                            <pre className="overflow-x-auto rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-slate-300 max-h-40">
                              {JSON.stringify(log.responseHeaders ?? {}, null, 2)}
                            </pre>
                            <pre className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-amber-100 max-h-80">
                              {prettyBody(log.responseBody)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

export const ProviderOnboardingAdminCard = RetailerBankingAdminTab;
