"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Server, Shuffle, ShieldCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

type ProviderChannelRow = {
  id: string;
  channel_key: string;
  provider_code: string;
  pipe_code: string;
  display_label: string;
  supports_upi_cashout: boolean;
  supports_aeps: boolean;
  supports_dmt?: boolean;
  supports_payout: boolean;
  biometric_required: boolean;
  active: boolean;
  priority_order: number;
  onboarded_count: number;
  full_kyc_count: number;
};

type RoutingPolicyRow = {
  service_code: "UPI_CASHOUT" | "AEPS" | "PAYOUT" | string;
  strategy: "ROUND_ROBIN" | "PRIMARY_FALLBACK" | string;
  rr_counter: number;
  active: boolean;
  updated_at?: string;
};

type PlatformProviderConfig = {
  channels: ProviderChannelRow[];
  policies: RoutingPolicyRow[];
};

const SERVICE_LABELS: Record<string, { title: string; subtitle: string }> = {
  UPI_CASHOUT: {
    title: "UPI Cashpoint (Dynamic UATM QR)",
    subtitle: "Routes QR generation across active channels by retailer priority.",
  },
  AEPS: {
    title: "AePS Banking (CW / BE / MS)",
    subtitle: "Routes Aadhaar fingerprint transactions across active FULL_KYC channels.",
  },
  DMT: {
    title: "Domestic Money Transfer (DMT v2)",
    subtitle: "Routes IMPS / NEFT customer remittances across active FULL_KYC channels by priority.",
  },
  PAYOUT: {
    title: "Merchant Bank Settlement Payouts",
    subtitle: "Routes IMPS / NEFT / RTGS payouts across active FULL_KYC + bank-synced channels.",
  },
};

export function ProviderRoutingConsole() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [config, setConfig] = useState<PlatformProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<PlatformProviderConfig>("/api/v1/admin/providers", { token });
      setConfig(res);
    } catch (e) {
      setError(formatApiError(e, "Could not load provider routing configuration"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePolicy(serviceCode: string, strategy: string, active: boolean) {
    if (!token) return;
    setBusyKey(`policy-${serviceCode}`);
    try {
      const res = await api<PlatformProviderConfig>(`/api/v1/admin/providers/routing/${serviceCode}`, {
        token,
        method: "PUT",
        body: JSON.stringify({ strategy, active }),
      });
      setConfig(res);
      flash.ok(`Updated routing policy for ${serviceCode}.`);
    } catch (e) {
      flash.fail(e, "Could not update routing policy");
    } finally {
      setBusyKey(null);
    }
  }

  async function updateChannel(ch: ProviderChannelRow, active: boolean, priorityOrder: number) {
    if (!token) return;
    setBusyKey(`channel-${ch.id}`);
    try {
      const res = await api<PlatformProviderConfig>(`/api/v1/admin/providers/channels/${ch.id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({
          active,
          priorityOrder,
          displayLabel: ch.display_label,
        }),
      });
      setConfig(res);
      flash.ok(`Updated ${ch.provider_code} (${ch.pipe_code}) channel.`);
    } catch (e) {
      flash.fail(e, "Could not update provider channel");
    } finally {
      setBusyKey(null);
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (loading || !config) return <div className="card h-56 animate-pulse bg-slate-100" />;

  return (
    <div className="space-y-6">
      <Flash message={flash.message} error={flash.error} />

      {/* 1. Service Routing Policies (Round Robin vs Primary Fallback) */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-emerald-600" />
              Dynamic Multi-Provider Routing Policies
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch dynamically between Round-Robin load distribution and Primary-Fallback priority without exposing provider names to retailers.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {config.policies.map((p) => {
            const meta = SERVICE_LABELS[p.service_code] ?? {
              title: p.service_code,
              subtitle: "Service routing configuration",
            };
            const busy = busyKey === `policy-${p.service_code}`;
            return (
              <div
                key={p.service_code}
                className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                      {p.service_code}
                    </span>
                    <StatusPill value={p.active ? "ACTIVE" : "DISABLED"} />
                  </div>
                  <h4 className="font-display text-base font-bold text-navy-950">{meta.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{meta.subtitle}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700">
                    Routing Strategy
                    <select
                      className="field mt-1 bg-white text-xs font-semibold"
                      disabled={busy}
                      value={p.strategy}
                      onChange={(e) => updatePolicy(p.service_code, e.target.value, p.active)}
                    >
                      <option value="ROUND_ROBIN">Round Robin (Even Split)</option>
                      <option value="PRIMARY_FALLBACK">Primary / Priority Fallback</option>
                    </select>
                  </label>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-500">RR Counter: {p.rr_counter}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updatePolicy(p.service_code, p.strategy, !p.active)}
                      className={
                        p.active
                          ? "text-xs font-bold text-rose-700 hover:underline"
                          : "text-xs font-bold text-emerald-700 hover:underline"
                      }
                    >
                      {p.active ? "Pause Rail" : "Resume Rail"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Upstream Provider & Pipe Channels */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-600" />
            Upstream Provider &amp; Banking Pipe Channels
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Enable or pause individual upstream banking pipes globally and set priority order for Primary-Fallback routing.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Provider / Pipe</th>
                <th className="px-5 py-3.5">Opaque Key</th>
                <th className="px-5 py-3.5">Supported Rails</th>
                <th className="px-5 py-3.5">Outlets (Full KYC)</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {config.channels.map((ch) => {
                const busy = busyKey === `channel-${ch.id}`;
                return (
                  <tr key={ch.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-bold text-navy-950">
                        {ch.provider_code} · <span className="font-mono text-emerald-700">{ch.pipe_code}</span>
                      </p>
                      <p className="text-xs text-slate-500">{ch.display_label}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">{ch.channel_key}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {ch.supports_upi_cashout && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            UPI Cashout
                          </span>
                        )}
                        {ch.supports_aeps && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            AePS
                          </span>
                        )}
                        {ch.supports_dmt && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            DMT
                          </span>
                        )}
                        {ch.supports_payout && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Payout
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="font-bold text-navy-950">{ch.full_kyc_count}</span>
                      <span className="text-slate-500"> / {ch.onboarded_count} onboarded</span>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        defaultValue={ch.priority_order}
                        disabled={busy}
                        onBlur={(e) => {
                          const nextVal = Number(e.target.value || ch.priority_order);
                          if (nextVal !== ch.priority_order) {
                            updateChannel(ch, ch.active, nextVal);
                          }
                        }}
                        className="field !w-20 !py-1 !px-2 text-xs font-mono"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={ch.active ? "ACTIVE" : "PAUSED"} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateChannel(ch, !ch.active, ch.priority_order)}
                        className={
                          ch.active
                            ? "btn-secondary !py-1.5 !px-3 text-xs text-rose-700"
                            : "btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                        }
                      >
                        {!ch.active && <ShieldCheck className="h-3.5 w-3.5" />}
                        {ch.active ? "Pause Channel" : "Activate Channel"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

