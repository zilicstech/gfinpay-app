"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, Field, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { formatFinanceKind } from "@/features/finance/FinanceRequestCard";
import { financeStatusTone, formatFinanceStatus } from "@/features/finance/types";
import type { FinanceKind, FinanceRequest } from "@/features/finance/types";

export default function DistributorFinancePage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<FinanceRequest[]>([]);
  const [kind, setKind] = useState<"ALL" | FinanceKind>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (kind !== "ALL") params.set("kind", kind);
    setLoading(true);
    api<FinanceRequest[]>(`/api/v1/finance/requests?${params}`, { token })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => flash.fail(e, "Failed to load finance requests"))
      .finally(() => setLoading(false));
  }, [token, kind]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.retailer_name, r.retailer_code, r.utr].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-200/80 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
          Finance
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-950">
          Activation & wallet requests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit proofs from a retailer profile. After the auditor marks payment received, activate the outlet from that page.
        </p>
      </div>
      <Flash message={flash.message} error={flash.error} />
      <RewardsCard token={token} onDone={(message) => flash.ok(message)} onFail={(err, fallback) => flash.fail(err, fallback)} />
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["ALL", "ACTIVATION", "WALLET_TOPUP", "EARNINGS_WITHDRAW"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${kind === k ? "bg-navy-950 text-white" : "text-slate-600"}`}
              >
                {k === "ALL" ? "All" : formatFinanceKind(k)}
              </button>
            ))}
          </div>
          <div className="relative min-w-[16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="field !pl-10 !py-2 text-xs w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
            />
          </div>
        </div>
        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No requests" body="Open a retailer to submit an activation or wallet proof." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4 text-right">Outlet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{r.retailer_name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{r.retailer_code}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{formatFinanceKind(r.kind)}</td>
                    <td className="px-6 py-4 font-mono font-bold">{inr(r.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusPill value={financeStatusTone(r.kind, r.status)} label={formatFinanceStatus(r.kind, r.status)} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.created_at ? when(r.created_at) : "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/distributor/agents/${r.retailer_user_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl"
                      >
                        Open <ArrowRight className="h-3 w-3" />
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

function RewardsCard({
  token,
  onDone,
  onFail,
}: {
  token: string | null;
  onDone: (message: string) => void;
  onFail: (err: unknown, fallback: string) => void;
}) {
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [banks, setBanks] = useState<{ id: string; bank_name: string; account_number: string; ifsc: string; active?: boolean }[]>([]);
  const [payoutId, setPayoutId] = useState("");

  async function load() {
    if (!token) return;
    const [wallet, mine] = await Promise.all([
      api<{ rewardsBalance: number }>("/api/v1/wallet", { token }),
      api<{ id: string; bank_name: string; account_number: string; ifsc: string; active?: boolean }[]>("/api/v1/wallet/banks", { token }),
    ]);
    setBalance(wallet.rewardsBalance);
    const rows = Array.isArray(mine) ? mine.filter((row) => row.active !== false) : [];
    setBanks(rows);
    setPayoutId((current) => current || rows[0]?.id || "");
  }

  useEffect(() => {
    load().catch((err) => onFail(err, "Could not load rewards"));
  }, [token]);

  async function transfer(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      const next = await api<{ rewardsBalance: number }>("/api/v1/wallet/rewards/transfer", {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setBalance(next.rewardsBalance);
      setAmount("");
      onDone("Rewards moved into the wallet.");
    } catch (err) {
      onFail(err, "Could not move rewards");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(e: FormEvent) {
    e.preventDefault();
    if (!amount || !payoutId) return;
    setBusy(true);
    try {
      await api("/api/v1/wallet/settle", {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), payoutAccountId: payoutId }),
      });
      setWithdrawOpen(false);
      setAmount("");
      onDone("Withdrawal request submitted. An auditor will review it.");
    } catch (err) {
      onFail(err, "Could not request withdrawal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-navy-950">Rewards wallet</h2>
        <p className="text-xs text-slate-500 mt-0.5">Commission from completed services. Move it into the operating wallet or request a withdrawal.</p>
      </div>
      <p className="font-display text-3xl font-bold text-navy-950">{balance == null ? "—" : inr(balance)}</p>
      <form onSubmit={transfer} className="flex flex-wrap items-end gap-2">
        <Field label="Amount (₹)">
          <input className="field" type="number" min={1} max={balance ?? undefined} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <button type="submit" className="btn-primary" disabled={busy || !amount}>Move to wallet</button>
        <button type="button" className="btn-secondary" disabled={busy || !amount} onClick={() => setWithdrawOpen(true)}>Request withdrawal</button>
      </form>
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw rewards" description="An auditor transfers this from the rewards wallet to the bank you choose.">
        {banks.length === 0 ? (
          <p className="text-sm text-slate-600">Add a bank account before requesting a withdrawal.</p>
        ) : (
          <form onSubmit={withdraw} className="space-y-3">
            <Field label="Pay to">
              <select className="field" value={payoutId} onChange={(e) => setPayoutId(e.target.value)}>
                {banks.map((row) => (
                  <option key={row.id} value={row.id}>{row.bank_name} · {row.account_number} · {row.ifsc}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setWithdrawOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy || !payoutId}>Submit withdrawal</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
