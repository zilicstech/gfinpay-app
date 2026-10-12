"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, IndianRupee, Search, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { financeStatusTone, formatFinanceKind, formatFinanceStatus, formatTransferMode, type FinanceKind, type FinanceRequest as Row } from "@/features/finance/types";

export default function AuditorRequestsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<Row[]>([]);
  const [kind, setKind] = useState<"ALL" | FinanceKind>("ALL");
  const [status, setStatus] = useState<"ALL" | "PENDING" | "RECEIVED" | "REJECTED">("PENDING");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kind !== "ALL") params.set("kind", kind);
      if (status !== "ALL") params.set("status", status);
      const data = await api<Row[]>(`/api/v1/finance/requests?${params}`, { token });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      flash.fail(e, "Failed to load finance requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, kind, status]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.retailer_name, r.retailer_code, r.utr, r.requested_by_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const pendingCount = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-200/80 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
          Finance operations
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
          Payment requests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Verify activation and wallet top-up proofs. Mark a withdrawal transferred once you have paid it out.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="In this view" value={String(filtered.length)} hint="Matching the current filters" icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard label="Pending" value={String(pendingCount)} hint="Awaiting verification" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <Flash message={flash.message} error={flash.error} />

      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            <ChipGroup
              value={kind}
              onChange={setKind}
              options={[
                ["ALL", "All types"],
                ["ACTIVATION", "Activation"],
                ["WALLET_TOPUP", "Wallet"],
                ["EARNINGS_WITHDRAW", "Withdrawal"],
              ]}
            />
            <ChipGroup
              value={status}
              onChange={setStatus}
              options={[
                ["ALL", "All statuses"],
                ["PENDING", "Pending"],
                ["RECEIVED", "Received"],
                ["REJECTED", "Rejected"],
              ]}
            />
          </div>
          <div className="relative min-w-[16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="field !pl-10 !py-2 text-xs w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search retailer, UTR, requester…"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No requests" body="New activation and wallet proofs will land here." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">UTR</th>
                  <th className="px-6 py-4">Bank</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-950">{r.retailer_name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{r.retailer_code}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">{formatFinanceKind(r.kind)}</td>
                    <td className="px-6 py-4 font-mono font-bold">{inr(r.amount)}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {r.kind === "EARNINGS_WITHDRAW" && r.status === "PENDING" ? "—" : r.utr}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {r.kind === "WALLET_TOPUP" && r.collection_bank_name ? (
                        <span>
                          <span className="font-semibold text-navy-950">{r.collection_bank_name}</span>
                          {r.transfer_mode ? <span className="block text-slate-500">{formatTransferMode(r.transfer_mode)}</span> : null}
                        </span>
                      ) : r.kind === "EARNINGS_WITHDRAW" && (r.payout_bank_name || r.collection_bank_name) ? (
                        <span>
                          {r.collection_bank_name && (
                            <span className="block font-semibold text-navy-950">From {r.collection_bank_name}</span>
                          )}
                          {r.payout_bank_name && (
                            <span className="block text-slate-500">To {r.payout_bank_name} · {r.payout_account_number}</span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={financeStatusTone(r.kind, r.status)} label={formatFinanceStatus(r.kind, r.status)} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.created_at ? when(r.created_at) : "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/auditor/requests/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100"
                      >
                        Review <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ChipGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            value === key ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
