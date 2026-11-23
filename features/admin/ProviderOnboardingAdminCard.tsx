"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Download,
  Fingerprint,
  Landmark,
  Power,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { api, apiBlob, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { ProviderApiTraceSection, type ProviderApiLogRow } from "@/features/admin/ProviderApiTraceSection";

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
  panSource?: string;
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
  readyForInstantPay?: boolean;
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
  retailer_priority?: number | null;
  payee_vpa?: string | null;
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
  retailer_priority?: number | null;
  payee_vpa?: string | null;
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

type RetailerProvidersResponse = {
  emeraldConfigured: boolean;
  instantPayConfigured?: boolean;
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
  view = "banking",
}: {
  userId: string;
  token: string | null;
  refreshKey?: number;
  onChanged?: () => void;
  onDone?: (msg: string) => void;
  onFail?: (err: unknown, fallback: string) => void;
  view?: "banking" | "providers" | "logs";
}) {
  const [data, setData] = useState<RetailerProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  // Admin inline backfill inputs for legacy retailers missing 12-digit Aadhaar or email
  const [aadhaarOverride, setAadhaarOverride] = useState("");
  const [emailOverride, setEmailOverride] = useState("");

  const [emeraldLogs, setEmeraldLogs] = useState<ProviderApiLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [iserveuLogs, setIserveuLogs] = useState<ProviderApiLogRow[]>([]);
  const [iserveuLogsLoading, setIserveuLogsLoading] = useState(false);
  const [instantPayLogs, setInstantPayLogs] = useState<ProviderApiLogRow[]>([]);
  const [instantPayLogsLoading, setInstantPayLogsLoading] = useState(false);
  const [iserveuOpen, setIserveuOpen] = useState(false);
  const [iserveuPipe, setIserveuPipe] = useState("CASHPOINT");
  const [iserveuAccount, setIserveuAccount] = useState("");
  const [iserveuVpa, setIserveuVpa] = useState("");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [priorityDraft, setPriorityDraft] = useState<Record<string, string>>({});

  const loadEmeraldLogs = useCallback(async () => {
    if (!token || !userId) return;
    setLogsLoading(true);
    try {
      const rows = await api<ProviderApiLogRow[]>(
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

  const loadIserveuLogs = useCallback(async () => {
    if (!token || !userId) return;
    setIserveuLogsLoading(true);
    try {
      const rows = await api<ProviderApiLogRow[]>(
        `/api/v1/admin/users/${userId}/providers/iserveu/logs?limit=50`,
        { token },
      );
      setIserveuLogs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setLocalErr(formatApiError(err, "Could not load iServeU API logs"));
    } finally {
      setIserveuLogsLoading(false);
    }
  }, [token, userId]);

  const loadInstantPayLogs = useCallback(async () => {
    if (!token || !userId) return;
    setInstantPayLogsLoading(true);
    try {
      const rows = await api<ProviderApiLogRow[]>(
        `/api/v1/admin/users/${userId}/providers/instantpay/logs?limit=50`,
        { token },
      );
      setInstantPayLogs(Array.isArray(rows) ? rows : []);
    } catch {
      // Non-blocking if logs endpoint is unavailable
    } finally {
      setInstantPayLogsLoading(false);
    }
  }, [token, userId]);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      if (view === "logs") {
        await Promise.all([loadEmeraldLogs(), loadIserveuLogs(), loadInstantPayLogs()]);
        return;
      }
      const res = await api<RetailerProvidersResponse>(`/api/v1/admin/users/${userId}/providers`, { token });
      setData(res);
    } catch (e) {
      setLocalErr(formatApiError(e, "Could not load banking & provider state"));
    } finally {
      setLoading(false);
    }
  }, [token, userId, view, loadEmeraldLogs, loadIserveuLogs, loadInstantPayLogs]);

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
        providerCode === "INSTANTPAY"
          ? "Retailer onboarded directly to InstantPay and bank sync initiated. Retailer can now complete Biometric KYC."
          : `Retailer onboarded to ${providerCode} (Pipe: ${pipeCode || "INSTANTPAY"}). Retailer can now complete Biometric KYC.`,
      );
    } catch (err) {
      notifyErr(err, `${providerCode} onboarding failed`);
    } finally {
      setBusyAction(null);
      loadEmeraldLogs().catch(() => undefined);
      loadInstantPayLogs().catch(() => undefined);
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
        notifyOk(`Settlement bank account synced to ${providerCode}${pipeCode ? ` (${pipeCode})` : ""}.`);
      } else {
        setLocalErr(res.bankSyncRemarks || `Bank sync returned a failure remark from ${providerCode}.`);
      }
    } catch (err) {
      notifyErr(err, `Could not sync settlement bank to ${providerCode}`);
    } finally {
      setBusyAction(null);
      loadEmeraldLogs().catch(() => undefined);
      loadInstantPayLogs().catch(() => undefined);
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
      loadInstantPayLogs().catch(() => undefined);
    }
  }

  function openIserveuModal(pipeCode: string, account?: string | null, vpa?: string | null) {
    setIserveuPipe(pipeCode || "CASHPOINT");
    setIserveuAccount(account ?? "");
    setIserveuVpa(vpa ?? "");
    setIserveuOpen(true);
  }

  async function handleSaveIserveu() {
    if (!token) return;
    setBusyAction("iserveu-onboard");
    setLocalErr(null);
    setLocalMsg(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/providers/iserveu/onboard`,
        {
          token,
          method: "POST",
          body: JSON.stringify({
            accountNumber: iserveuAccount,
            payeeVpa: iserveuVpa,
            retailerCode: data?.dossier.bcAgentId,
            pipeCode: iserveuPipe,
          }),
        },
      );
      setData(res);
      setIserveuOpen(false);
      onChanged?.();
      notifyOk("iServeU account and VPA saved for this retailer.");
    } catch (err) {
      notifyErr(err, "Could not save the iServeU onboarding details");
    } finally {
      setBusyAction(null);
    }
  }

  function openPriorityModal() {
    const draft: Record<string, string> = {};
    const seen = new Set<string>();
    for (const ch of data?.providerChannels ?? []) {
      if (seen.has(ch.provider_code)) continue;
      seen.add(ch.provider_code);
      const same = (data?.providerChannels ?? []).filter((row) => row.provider_code === ch.provider_code);
      const priority = same.find((row) => row.retailer_priority)?.retailer_priority;
      draft[ch.provider_code] = priority ? String(priority) : "";
    }
    setPriorityDraft(draft);
    setLocalErr(null);
    setPriorityOpen(true);
  }

  async function handleSavePriorities() {
    if (!token || !data) return;
    const chosen = Object.entries(priorityDraft).filter(([, value]) => value);
    const numbers = chosen.map(([, value]) => Number(value));
    if (new Set(numbers).size !== numbers.length) {
      setLocalErr("Two providers cannot use the same priority.");
      return;
    }
    setBusyAction("priorities");
    setLocalErr(null);
    try {
      const res = await api<RetailerProvidersResponse>(
        `/api/v1/admin/users/${userId}/providers/priorities`,
        {
          token,
          method: "PUT",
          body: JSON.stringify(
            chosen.map(([providerCode, priority]) => ({
              providerCode,
              priority: Number(priority),
            })),
          ),
        },
      );
      setData(res);
      setPriorityOpen(false);
      onChanged?.();
      notifyOk("Provider priority saved.");
    } catch (err) {
      notifyErr(err, "Could not save provider priority");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleChannel(
    channelId: string,
    providerLabel: string,
    enabled: boolean,
    reopenBiometric = false,
    retailerPriority?: number | null,
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
            retailerPriority: retailerPriority ?? undefined,
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

  async function handleToggleProvider(channelIds: string[], providerLabel: string, enabled: boolean) {
    if (!token || channelIds.length === 0) return;
    setBusyAction(`channel-${channelIds[0]}`);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      let latest: RetailerProvidersResponse | null = null;
      for (const channelId of channelIds) {
        latest = await api<RetailerProvidersResponse>(
          `/api/v1/admin/users/${userId}/providers/channels/${channelId}`,
          {
            token,
            method: "PATCH",
            body: JSON.stringify({
              enabledForRetailer: enabled,
              reopenBiometric: false,
            }),
          },
        );
      }
      if (latest) setData(latest);
      onChanged?.();
      notifyOk(`${providerLabel} ${enabled ? "enabled" : "disabled"} for this retailer.`);
    } catch (err) {
      notifyErr(err, "Could not update provider");
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

  const apiLogs = [
    ...instantPayLogs.map((row) => ({ ...row, provider: "InstantPay" })),
    ...emeraldLogs.map((row) => ({ ...row, provider: "Emerald" })),
    ...iserveuLogs.map((row) => ({ ...row, provider: "iServeU" })),
  ].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  if (view === "logs") {
    if (loading && apiLogs.length === 0 && !localErr) {
      return <div className="card h-64 animate-pulse bg-slate-100 rounded-[2rem]" />;
    }
    return (
      <div className="space-y-6">
        {localErr && <Alert tone="error">{localErr}</Alert>}
        {localMsg && <Alert tone="success">{localMsg}</Alert>}
        <ProviderApiTraceSection
          brand="Provider"
          description="InstantPay, Emerald, and iServeU outbound calls and inbound webhooks for this retailer. Use the provider filter to inspect a specific switch. Secrets, OTPs, and sensitive identity fields are redacted."
          emptyText="No InstantPay, Emerald, or iServeU API calls have been recorded for this retailer yet."
          logs={apiLogs}
          loading={logsLoading || iserveuLogsLoading || instantPayLogsLoading}
          onRefresh={() => {
            loadInstantPayLogs().catch(() => undefined);
            loadEmeraldLogs().catch(() => undefined);
            loadIserveuLogs().catch(() => undefined);
          }}
        />
      </div>
    );
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

  const iserveuRows = channels.filter((c) => c.provider_code === "ISERVEU");
  const iserveuPrimary = iserveuRows.find((c) => c.pipe_code === "CASHPOINT") ?? iserveuRows[0];
  const iserveuCard: ProviderChannelRow | null = iserveuPrimary
    ? {
        ...iserveuPrimary,
        pipe_code: "",
        onboarded: iserveuRows.some((row) => row.onboarded),
        enabled_for_retailer: iserveuRows.some((row) => row.onboarded && row.enabled_for_retailer),
        platform_channel_active: iserveuRows.some((row) => row.platform_channel_active),
        supports_upi_cashout: iserveuRows.some((row) => row.supports_upi_cashout),
        supports_aeps: iserveuRows.some((row) => row.supports_aeps),
        supports_payout: iserveuRows.some((row) => row.supports_payout),
        payee_vpa: iserveuRows.find((row) => row.payee_vpa)?.payee_vpa ?? iserveuPrimary.payee_vpa,
        pipe_outlet_code:
          iserveuRows.find((row) => row.pipe_outlet_code)?.pipe_outlet_code ?? iserveuPrimary.pipe_outlet_code,
        retailer_priority:
          iserveuRows.find((row) => row.retailer_priority)?.retailer_priority ?? iserveuPrimary.retailer_priority,
      }
    : null;
  const visibleChannels = [
    ...channels.filter(
      (c) => c.provider_code !== "ISERVEU" && (c.onboarded || c.platform_channel_active !== false),
    ),
    ...(iserveuCard && (iserveuCard.onboarded || iserveuCard.platform_channel_active !== false)
      ? [iserveuCard]
      : []),
  ];

  const onboardedChannels = visibleChannels.filter((c) => c.onboarded);
  const fullKycChannels = onboardedChannels.filter((c) => c.kyc_status === "FULL_KYC");
  const routableChannels = onboardedChannels.filter(
    (c) =>
      c.enabled_for_retailer &&
      (c.kyc_status === "FULL_KYC" || (c.provider_code === "ISERVEU" && c.kyc_status === "NOT_REQUIRED")),
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

      {view === "providers" && (
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-lg font-bold text-navy-950">
                Provider operations
              </h2>
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
              Onboard providers, set priority, and enable or disable each provider for this retailer.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
      )}

      {view === "banking" && (
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
      )}

      {view === "providers" && (
      <>
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
                {d.panMasked || "Missing PAN"}
                {d.panSource === "AUTHORIZED_SIGNATORY" ? " (Signatory)" : ""} ·{" "}
                {d.hasFullAadhaar ? d.aadhaarMasked || "12-digit Verified" : "12-digit Missing"}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Providers ({visibleChannels.length})
            </h4>
            <button
              type="button"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
              disabled={busyAction !== null}
              onClick={openPriorityModal}
            >
              Set provider priority
            </button>
          </div>

          {visibleChannels.length === 0 ? (
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
            visibleChannels.map((ch) => {
              const isInstantPay = ch.provider_code === "INSTANTPAY";
              const isIserveu = ch.provider_code === "ISERVEU";
              const providerLabel = isIserveu
                ? "ISERVEU"
                : isInstantPay
                  ? "INSTANTPAY · DIRECT"
                  : `${ch.provider_code} · ${ch.pipe_code}`;
              const isFullKyc = ch.kyc_status === "FULL_KYC" || (isIserveu && ch.kyc_status === "NOT_REQUIRED");
              const bankMismatch =
                Boolean(ch.onboarded) &&
                Boolean(ch.synced_bank_account_id) &&
                Boolean(d.bankAccountId) &&
                String(ch.synced_bank_account_id) !== String(d.bankAccountId);
              const bankSynced = ch.bank_sync_status === "SYNCED" && !bankMismatch;
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
                        {ch.retailer_priority ? (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                            Priority {ch.retailer_priority}
                          </span>
                        ) : null}
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
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {!isIserveu && (
                          <span>
                            Opaque Key: <span className="font-mono font-semibold text-slate-700">{ch.channel_key}</span>
                          </span>
                        )}
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
                            {(!isIserveu || ch.outlet_code) && <span>·</span>}
                            <span className="font-mono text-slate-600">
                              {ch.provider_code === "ISERVEU" ? "iServeU account" : "Pipe ID"}: {ch.pipe_outlet_code}
                            </span>
                          </>
                        )}
                        {ch.payee_vpa && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600">VPA: {ch.payee_vpa}</span>
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
                          onClick={() =>
                            ch.provider_code === "ISERVEU"
                              ? openIserveuModal(ch.pipe_code, ch.pipe_outlet_code, ch.payee_vpa)
                              : handleOnboardProvider(ch.provider_code, ch.pipe_code)
                          }
                          className="btn-primary !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {onboardBusy
                            ? "Onboarding…"
                            : isInstantPay
                              ? "Onboard to InstantPay"
                              : `Onboard ${ch.provider_code}`}
                        </button>
                      ) : (
                        <>
                          {isIserveu ? (
                            <button
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() => openIserveuModal("", ch.pipe_outlet_code, ch.payee_vpa)}
                              className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                            >
                              Update details
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
                            </>
                          )}

                          {ch.kyc_status === "FULL_KYC" && (
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
                              handleToggleProvider(
                                isIserveu
                                  ? iserveuRows.filter((row) => row.onboarded).map((row) => row.channel_id)
                                  : [ch.channel_id],
                                providerLabel,
                                !ch.enabled_for_retailer,
                              )
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
                        {ch.outlet_code
                          ? isInstantPay
                            ? `Direct Outlet #${ch.outlet_code}`
                            : `Entity ${data.entityCode}`
                          : "Ready for onboarding"}
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
                        {bankMismatch ? "RE-SYNC REQUIRED" : ch.bank_sync_status}
                      </span>
                      {(bankMismatch || ch.bank_sync_remarks) && (
                        <span
                          className="block text-[11px] text-slate-500 truncate"
                          title={
                            bankMismatch
                              ? "Primary bank account changed — click Sync Bank to update switch"
                              : ch.bank_sync_remarks || ""
                          }
                        >
                          {bankMismatch
                            ? "Primary bank changed — click Sync Bank"
                            : ch.bank_sync_remarks}
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
                          : ch.enabled_for_retailer && isFullKyc
                            ? "Active in Router"
                            : !ch.enabled_for_retailer
                              ? "Disabled for Retailer"
                              : "Awaiting Biometric"}
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

      {priorityOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-navy-950">Provider priority</h3>
              <p className="mt-1 text-sm text-slate-500">
                Priority 1 is called first. Two providers cannot share the same priority.
              </p>
            </div>
            {localErr && <Alert tone="error">{localErr}</Alert>}
            <div className="space-y-3">
              {Object.keys(priorityDraft).map((providerCode) => {
                const onboarded = (data.providerChannels ?? []).some(
                  (row) => row.provider_code === providerCode && row.onboarded,
                );
                const taken = new Set(
                  Object.entries(priorityDraft)
                    .filter(([code, value]) => code !== providerCode && value)
                    .map(([, value]) => value),
                );
                return (
                  <label key={providerCode} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-navy-950">
                      {providerCode}
                      {!onboarded && <span className="ml-2 text-xs font-normal text-slate-400">Onboard first</span>}
                    </span>
                    <select
                      className="field !py-1.5 !px-2 text-sm w-28"
                      disabled={!onboarded || busyAction !== null}
                      value={priorityDraft[providerCode] ?? ""}
                      onChange={(e) =>
                        setPriorityDraft((current) => ({ ...current, [providerCode]: e.target.value }))
                      }
                    >
                      <option value="">Not set</option>
                      <option value="1" disabled={taken.has("1")}>1</option>
                      <option value="2" disabled={taken.has("2")}>2</option>
                      <option value="3" disabled={taken.has("3")}>3</option>
                    </select>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary text-xs" onClick={() => setPriorityOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                disabled={busyAction !== null}
                onClick={handleSavePriorities}
              >
                {busyAction === "priorities" ? "Saving…" : "Save priority"}
              </button>
            </div>
          </div>
        </div>
      )}

      {iserveuOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-navy-950">Onboard iServeU</h3>
              <p className="mt-1 text-sm text-slate-500">
                Enter the iServeU account number and this retailer&apos;s VPA.
                Retailer code {data?.dossier.bcAgentId || ""}.
              </p>
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              iServeU account number
              <input
                className="field mt-1 w-full font-mono text-sm"
                value={iserveuAccount}
                onChange={(e) => setIserveuAccount(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Retailer VPA
              <input
                className="field mt-1 w-full font-mono text-sm"
                value={iserveuVpa}
                onChange={(e) => setIserveuVpa(e.target.value.trim())}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary text-xs" onClick={() => setIserveuOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                disabled={busyAction !== null}
                onClick={handleSaveIserveu}
              >
                {busyAction === "iserveu-onboard" ? "Saving…" : "Save iServeU details"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

export const ProviderOnboardingAdminCard = RetailerBankingAdminTab;
