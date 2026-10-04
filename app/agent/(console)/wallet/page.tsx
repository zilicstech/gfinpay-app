"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Download, 
  History, 
  IndianRupee, 
  Plus, 
  Search, 
  ShieldCheck, 
  Wallet, 
  Zap 
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Field, Modal, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

type Entry = {
  id: number;
  direction: "CREDIT" | "DEBIT" | string;
  amount: number;
  narration: string;
  account_type: string;
  created_at?: string;
};

export default function WalletPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [wallet, setWallet] = useState<{ availableBalance: number; holdBalance: number } | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [query, setQuery] = useState("");

  // Top Up Modal
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [topupBusy, setTopupBusy] = useState(false);

  // Settlement Modal
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleBusy, setSettleBusy] = useState(false);

  async function loadData() {
    if (!token) return;
    try {
      const [w, st] = await Promise.all([
        api<{ availableBalance: number; holdBalance: number }>("/api/v1/wallet", { token }),
        api<Entry[]>("/api/v1/wallet/statement", { token }),
      ]);
      setWallet(w);
      setRows(st);
    } catch (e) {
      flash.fail(e, "Failed to load wallet statement");
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  async function handleTopup(e: FormEvent) {
    e.preventDefault();
    if (!topupAmount || Number(topupAmount) <= 0) return;

    setTopupBusy(true);
    try {
      await api("/api/v1/wallet/topups", {
        token,
        method: "POST",
        body: JSON.stringify({
          amount: Number(topupAmount),
          reference: utrNumber || undefined,
        }),
      });
      flash.ok("Float top-up request submitted to your distributor.");
      setTopupOpen(false);
      setTopupAmount("");
      setUtrNumber("");
      loadData();
    } catch (err) {
      flash.fail(err, "Float top-up request failed");
    } finally {
      setTopupBusy(false);
    }
  }

  async function handleSettle(e: FormEvent) {
    e.preventDefault();
    if (!settleAmount || Number(settleAmount) <= 0) return;

    setSettleBusy(true);
    try {
      await api("/api/v1/wallet/settle", {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(settleAmount) }),
      });
      flash.ok("Settlement dispatched to your registered bank account.");
      setSettleOpen(false);
      setSettleAmount("");
      loadData();
    } catch (err) {
      flash.fail(err, "Settlement request failed");
    } finally {
      setSettleBusy(false);
    }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterType !== "ALL" && r.direction !== filterType) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.narration.toLowerCase().includes(q) ||
          r.account_type.toLowerCase().includes(q) ||
          String(r.amount).includes(q)
        );
      }
      return true;
    });
  }, [rows, filterType, query]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Wallet className="h-4 w-4" />
              Counter Float & Ledger
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Agent Wallet
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Real-time settlement ledger for AePS, DMT, BBPS bill payments, and commissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTopupOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-navy-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Top Up Float
            </button>
            <button
              type="button"
              onClick={() => setSettleOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              Payout to Bank
            </button>
          </div>
        </div>

        {/* Floating Balance Pods */}
        <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Float</span>
            <p className="mt-2 font-display text-3xl font-extrabold text-white">
              {wallet ? inr(wallet.availableBalance) : "—"}
            </p>
            <p className="mt-1 text-xs text-emerald-400">Ready for DMT & counter sends</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Locked on Hold</span>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-300">
              {wallet ? inr(wallet.holdBalance) : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Reserved for in-flight transactions</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ledger Status</span>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="font-display text-xl font-bold text-emerald-300">Double-Entry Active</p>
            </div>
            <p className="mt-1 text-xs text-slate-400">Immediate reconciliation on completion</p>
          </div>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Statement Section */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-navy-950">Transaction Statement</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of all credits, debits, and retail margins.</p>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["ALL", "CREDIT", "DEBIT"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    filterType === t
                      ? "bg-navy-950 text-white shadow-xs"
                      : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {t === "ALL" ? "All Entries" : t === "CREDIT" ? "Credits (+)" : "Debits (-)"}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search statement..."
                className="field !py-1.5 !pl-9 text-xs w-48"
              />
            </div>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="No ledger entries found"
            body={query || filterType !== "ALL" ? "Try clearing search filters." : "Wallet movement will appear here as transactions settle."}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">Narration / Event</th>
                  <th className="px-6 py-3.5">Account Type</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r) => {
                  const isCredit = r.direction === "CREDIT";
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                            isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}>
                            {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-xs sm:text-sm">{r.narration}</p>
                            {r.created_at && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{when(r.created_at)}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono font-medium text-slate-700">
                          {r.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill value={r.direction} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono text-sm font-bold ${
                          isCredit ? "text-emerald-700" : "text-slate-900"
                        }`}>
                          {isCredit ? "+" : "-"}{inr(r.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topup Modal */}
      <Modal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        title="Request Float Top-Up"
        description="Top up your outlet wallet float through your master distributor."
      >
        <form onSubmit={handleTopup} className="space-y-4 pt-2">
          <Field label="Amount to Add (₹)">
            <input
              type="number"
              min={100}
              required
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="field font-bold text-lg"
            />
          </Field>
          <Field label="Bank Transfer UTR / Reference (Optional)">
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 423984729384"
              className="field font-mono"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setTopupOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={topupBusy || !topupAmount}
              className="btn-primary"
            >
              {topupBusy ? "Submitting..." : "Submit Top-Up Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settlement Modal */}
      <Modal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        title="Instant Payout to Bank"
        description="Withdraw earnings and available float directly into your verified bank account."
      >
        <form onSubmit={handleSettle} className="space-y-4 pt-2">
          <Field label="Withdrawal Amount (₹)">
            <input
              type="number"
              min={100}
              max={wallet?.availableBalance ?? 100000}
              required
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="field font-bold text-lg"
            />
          </Field>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            Funds will be transferred via IMPS to your default outlet settlement bank account.
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSettleOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={settleBusy || !settleAmount || (wallet !== null && Number(settleAmount) > wallet.availableBalance)}
              className="btn-primary"
            >
              {settleBusy ? "Processing..." : "Transfer to Bank"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
