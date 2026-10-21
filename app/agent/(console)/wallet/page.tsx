"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  IndianRupee,
  Plus,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { api, apiForm } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, Field, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { type CollectionAccount } from "@/features/finance/CollectionAccounts";
import { RetailerRequestsPanel } from "@/features/finance/RetailerRequestsPanel";
import { type PayoutAccount } from "@/features/finance/RetailerBanksDesk";

type Entry = {
  id: number;
  direction: "CREDIT" | "DEBIT" | string;
  amount: number;
  narration: string;
  account_type: string;
  created_at?: string;
};

const TOPUP_PRESETS = [2000, 5000, 10000, 25000, 50000];
const TRANSFER_MODES = [
  { value: "IMPS", label: "IMPS" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
  { value: "UPI", label: "UPI" },
  { value: "QR", label: "QR code" },
] as const;

export default function WalletPage() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const flash = useFlash();

  const [wallet, setWallet] = useState<{ availableBalance: number; holdBalance: number; rewardsBalance: number } | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [banks, setBanks] = useState<CollectionAccount[]>([]);
  const [payouts, setPayouts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [query, setQuery] = useState("");

  const [payBank, setPayBank] = useState<CollectionAccount | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [transferMode, setTransferMode] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);
  const [qrBank, setQrBank] = useState<CollectionAccount | null>(null);

  const [requestTick, setRequestTick] = useState(0);
  const [settleOpen, setSettleOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [payoutId, setPayoutId] = useState("");
  const [settleBusy, setSettleBusy] = useState(false);
  const [newBank, setNewBank] = useState({ accountName: "", accountNumber: "", ifsc: "", bankName: "" });

  async function loadData() {
    if (!token) return;
    setLoading(true);
    try {
      const [w, st, collection, mine] = await Promise.all([
        api<{ availableBalance: number; holdBalance: number; rewardsBalance: number }>("/api/v1/wallet", { token }),
        api<Entry[]>("/api/v1/wallet/statement", { token }),
        api<CollectionAccount[]>("/api/v1/finance/collection-accounts", { token }),
        api<PayoutAccount[]>("/api/v1/wallet/banks", { token }),
      ]);
      setWallet(w);
      setRows(Array.isArray(st) ? st : []);
      setBanks(Array.isArray(collection) ? collection : []);
      const accounts = Array.isArray(mine) ? mine : [];
      setPayouts(accounts);
      const active = accounts.filter((row) => row.active !== false);
      setPayoutId((current) => current || active[0]?.id || "");
    } catch (e) {
      flash.fail(e, "Failed to load wallet statement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  function openTopup(bank: CollectionAccount) {
    setPayBank(bank);
    setTopupAmount("");
    setTransferMode("");
    setUtrNumber("");
    setProofFile(null);
  }

  async function handleTopup(e: FormEvent) {
    e.preventDefault();
    if (!payBank || !topupAmount || Number(topupAmount) <= 0 || !transferMode || !proofFile) return;

    setTopupBusy(true);
    try {
      const form = new FormData();
      form.set("amount", topupAmount);
      form.set("utr", utrNumber.trim());
      form.set("collectionAccountId", payBank.id);
      form.set("transferMode", transferMode);
      form.set("proof", proofFile);
      if (user?.id) form.set("retailerId", user.id);
      await apiForm("/api/v1/finance/wallet-requests", form, { token });
      flash.ok("Wallet request submitted. Amount credits after the auditor confirms the payment.");
      setPayBank(null);
      setRequestTick((n) => n + 1);
      loadData();
    } catch (err) {
      flash.fail(err, "Wallet request failed");
    } finally {
      setTopupBusy(false);
    }
  }

  async function handleSettle(e: FormEvent) {
    e.preventDefault();
    if (!settleAmount || Number(settleAmount) <= 0 || !payoutId) return;

    setSettleBusy(true);
    try {
      await api("/api/v1/wallet/settle", {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(settleAmount), payoutAccountId: payoutId }),
      });
      flash.ok("Withdrawal request submitted. An auditor will review it.");
      setSettleOpen(false);
      setSettleAmount("");
      loadData();
    } catch (err) {
      flash.fail(err, "Settlement request failed");
    } finally {
      setSettleBusy(false);
    }
  }

  async function handleTransfer(e: FormEvent) {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) return;
    setTransferBusy(true);
    try {
      const next = await api<{ availableBalance: number; rewardsBalance: number }>("/api/v1/wallet/rewards/transfer", {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(transferAmount) }),
      });
      setWallet((current) => current ? { ...current, availableBalance: next.availableBalance, rewardsBalance: next.rewardsBalance } : current);
      flash.ok("Rewards moved into the wallet.");
      setTransferOpen(false);
      setTransferAmount("");
      loadData();
    } catch (err) {
      flash.fail(err, "Could not move rewards");
    } finally {
      setTransferBusy(false);
    }
  }

  async function addPayout(e: FormEvent) {
    e.preventDefault();
    setSettleBusy(true);
    try {
      const created = await api<PayoutAccount>("/api/v1/wallet/banks", {
        token,
        method: "POST",
        body: JSON.stringify(newBank),
      });
      setPayouts((current) => [created, ...current]);
      setPayoutId(created.id);
      setNewBank({ accountName: "", accountNumber: "", ifsc: "", bankName: "" });
      flash.ok("Bank account added. You can request the withdrawal now.");
    } catch (err) {
      flash.fail(err, "Could not add the bank account");
    } finally {
      setSettleBusy(false);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      flash.ok(`${label} copied`);
    } catch {
      flash.fail(new Error("Copy failed"), "Could not copy");
    }
  }

  const activePayouts = payouts.filter((row) => row.active !== false);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterType !== "ALL" && r.direction !== filterType) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.narration.toLowerCase().includes(q) ||
          r.account_type.toLowerCase().includes(q) ||
          String(r.amount).includes(q) ||
          String(r.id).includes(q)
        );
      }
      return true;
    });
  }, [rows, filterType, query]);

  const creditCount = useMemo(() => rows.filter((r) => r.direction === "CREDIT").length, [rows]);
  const debitCount = useMemo(() => rows.filter((r) => r.direction === "DEBIT").length, [rows]);

  if (loading && !wallet) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-40 rounded-[2.5rem] animate-pulse bg-slate-100" />
        <div className="h-64 rounded-[2.5rem] animate-pulse bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-emerald-400 font-bold tracking-wider text-xs uppercase">Wallet balance</p>
            <p className="mt-2 font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {wallet ? inr(wallet.availableBalance) : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Used to pay for services.</p>
          </div>
          <div>
            <p className="text-emerald-400 font-bold tracking-wider text-xs uppercase">Rewards wallet</p>
            <p className="mt-2 font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {wallet ? inr(wallet.rewardsBalance) : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Commission from completed services.</p>
          </div>
        </div>
      </section>

      <Flash message={flash.message} error={flash.error} />

      <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-950">Available bank details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Transfer to one of these accounts, then submit the payment for that bank.</p>
        </div>
        {banks.length === 0 ? (
          <EmptyState title="No collection accounts" body="An auditor has not published a bank account yet." />
        ) : (
          <div className="grid gap-3">
            {banks.map((bank) => (
              <article key={bank.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-navy-950">{bank.bank_name}</p>
                    <CopyLine label="Account name" value={bank.account_name} onCopy={copyValue} />
                    <CopyLine label="Account number" value={bank.account_number} onCopy={copyValue} />
                    <CopyLine label="IFSC" value={bank.ifsc} onCopy={copyValue} />
                    {bank.upi_id && <CopyLine label="UPI" value={bank.upi_id} onCopy={copyValue} />}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {bank.qr_url && (
                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                        onClick={() => setQrBank(bank)}
                      >
                        <QrCode className="h-4 w-4" /> View QR
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary inline-flex items-center gap-1.5 text-sm"
                      onClick={() => openTopup(bank)}
                    >
                      <Plus className="h-4 w-4" /> Add money
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {user?.id && (
        <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-950">Payment requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Top-ups and withdrawals waiting for an auditor. You can raise another while one is still pending.
            </p>
          </div>
          <RetailerRequestsPanel
            key={requestTick}
            token={token}
            retailerId={user.id}
            refreshKey={requestTick}
            kinds={["WALLET_TOPUP", "EARNINGS_WITHDRAW"]}
            statuses={["PENDING"]}
          />
        </section>
      )}

      {user?.id && (
        <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-950">Completed withdrawals</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Withdrawals an auditor has marked transferred, with the UTR and payment proof.
            </p>
          </div>
          <RetailerRequestsPanel
            token={token}
            retailerId={user.id}
            refreshKey={requestTick}
            kinds={["EARNINGS_WITHDRAW"]}
            statuses={["RECEIVED"]}
          />
        </section>
      )}

      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-950">Transaction statement</h2>
            <p className="text-xs text-slate-500 mt-0.5">Credits and debits on this wallet.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTransferOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-navy-950 hover:bg-slate-50"
            >
              Move rewards to wallet
            </button>
            <button
              type="button"
              onClick={() => setSettleOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-navy-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-900"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw rewards
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                filterType === "ALL" ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950 hover:bg-white/60"
              }`}
            >
              All entries ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("CREDIT")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                filterType === "CREDIT" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-emerald-700 hover:bg-white/60"
              }`}
            >
              Credits (+{creditCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("DEBIT")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                filterType === "DEBIT" ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950 hover:bg-white/60"
              }`}
            >
              Debits (-{debitCount})
            </button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search narration, type, amount..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 py-2 text-xs font-medium text-navy-950 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-950">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="No ledger entries found"
            body={query || filterType !== "ALL" ? "Try adjusting your search query or switching filters." : "Wallet movement will appear here as transactions settle."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">Narration</th>
                  <th className="px-6 py-3.5">Account type</th>
                  <th className="px-6 py-3.5">Direction</th>
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
                          <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${
                            isCredit ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20" : "bg-rose-50 text-rose-600 ring-1 ring-rose-500/20"
                          }`}>
                            {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-xs sm:text-sm">{r.narration}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {r.created_at && <span className="text-[11px] text-slate-400 font-medium">{when(r.created_at)}</span>}
                              <span className="font-mono text-[10px] text-slate-400">ID #{r.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-bold text-slate-700">
                          {r.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4"><StatusPill value={r.direction} /></td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono text-sm sm:text-base font-bold ${isCredit ? "text-emerald-600" : "text-slate-900"}`}>
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

      <Modal
        open={payBank !== null}
        onClose={() => setPayBank(null)}
        title={payBank ? `Add money to ${payBank.bank_name}` : "Add money"}
        description="Enter the amount you transferred, the mode, the UTR, and the payment proof."
      >
        {payBank && (
          <form onSubmit={handleTopup} className="space-y-4 pt-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-bold text-navy-950">{payBank.account_name}</p>
              <p className="font-mono text-navy-950">{payBank.account_number}</p>
              <p className="font-mono text-xs text-slate-600">IFSC {payBank.ifsc}</p>
            </div>
            <Field label="Amount (₹)">
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  required
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="field !pl-10 font-bold text-lg"
                />
              </div>
            </Field>
            <div className="flex flex-wrap items-center gap-1.5">
              {TOPUP_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(String(amt))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-navy-950 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  +{inr(amt)}
                </button>
              ))}
            </div>
            <Field label="Transfer mode">
              <select
                required
                value={transferMode}
                onChange={(e) => setTransferMode(e.target.value)}
                className="field"
              >
                <option value="" disabled>Select mode</option>
                {TRANSFER_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </Field>
            <Field label="UTR / reference">
              <input
                type="text"
                required
                minLength={6}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 423984729384"
                className="field font-mono"
              />
            </Field>
            <Field label="Payment proof">
              <input
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-navy-950 file:px-3.5 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setPayBank(null)}>Cancel</button>
              <button type="submit" disabled={topupBusy || !topupAmount || !transferMode || !proofFile} className="btn-primary">
                {topupBusy ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={qrBank !== null} onClose={() => setQrBank(null)} title={qrBank ? `${qrBank.bank_name} QR` : "QR"}>
        {qrBank?.qr_url && (
          <img src={qrBank.qr_url} alt={`${qrBank.bank_name} payment QR`} className="mx-auto max-h-[70vh] w-full rounded-2xl bg-white object-contain" />
        )}
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Move rewards to wallet"
        description="The amount is added to the wallet you use for services."
      >
        <form onSubmit={handleTransfer} className="space-y-4 pt-2">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rewards balance</span>
            <p className="font-display text-2xl font-bold text-navy-950 mt-0.5">
              {wallet ? inr(wallet.rewardsBalance) : "—"}
            </p>
          </div>
          <Field label="Amount (₹)">
            <input
              type="number"
              min={1}
              max={wallet?.rewardsBalance ?? undefined}
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="field font-bold text-lg"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setTransferOpen(false)}>Cancel</button>
            <button
              type="submit"
              disabled={transferBusy || !transferAmount || (wallet !== null && Number(transferAmount) > wallet.rewardsBalance)}
              className="btn-primary"
            >
              {transferBusy ? "Moving..." : "Move to wallet"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        title="Withdraw rewards"
        description="This comes out of the rewards wallet. Choose the bank account that should receive it."
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rewards balance</span>
            <p className="font-display text-2xl font-bold text-navy-950 mt-0.5">
              {wallet ? inr(wallet.rewardsBalance) : "—"}
            </p>
          </div>

          {activePayouts.length === 0 ? (
            <form onSubmit={addPayout} className="space-y-3">
              <p className="text-sm text-slate-600">
                Add the bank account that should receive this withdrawal. You can manage accounts later in{" "}
                <Link href="/agent/settings" className="font-semibold text-navy-950 underline">Settings</Link>.
              </p>
              <Field label="Account name">
                <input required className="field" value={newBank.accountName} onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })} />
              </Field>
              <Field label="Account number">
                <input required className="field font-mono" value={newBank.accountNumber} onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} />
              </Field>
              <Field label="IFSC">
                <input required className="field font-mono" value={newBank.ifsc} onChange={(e) => setNewBank({ ...newBank, ifsc: e.target.value })} />
              </Field>
              <Field label="Bank">
                <input required className="field" value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })} />
              </Field>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={settleBusy}>
                  {settleBusy ? "Saving..." : "Save bank account"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSettle} className="space-y-4">
              <Field label="Amount (₹)">
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    max={wallet?.rewardsBalance ?? undefined}
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="field !pl-10 font-bold text-lg"
                  />
                </div>
              </Field>
              {wallet && wallet.rewardsBalance > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "25%", val: Math.floor(wallet.rewardsBalance * 0.25) },
                    { label: "50%", val: Math.floor(wallet.rewardsBalance * 0.5) },
                    { label: "All", val: wallet.rewardsBalance },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSettleAmount(String(p.val))}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-navy-950 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      {p.label} ({inr(p.val)})
                    </button>
                  ))}
                </div>
              )}
              <Field label="Pay to">
                <select required className="field" value={payoutId} onChange={(e) => setPayoutId(e.target.value)}>
                  {activePayouts.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.bank_name} · {row.account_number} · {row.ifsc}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-xs text-slate-500">
                Need another account? Add it in{" "}
                <Link href="/agent/settings" className="font-semibold text-navy-950 underline">Settings</Link>.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setSettleOpen(false)}>Cancel</button>
                <button
                  type="submit"
                  disabled={settleBusy || !settleAmount || !payoutId || (wallet !== null && Number(settleAmount) > wallet.rewardsBalance)}
                  className="btn-primary"
                >
                  {settleBusy ? "Submitting..." : "Submit withdrawal"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}

function CopyLine({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <p className="flex items-center gap-2 font-mono text-sm text-navy-950">
      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span>{value}</span>
      <button type="button" className="text-slate-400 hover:text-navy-950" aria-label={`Copy ${label}`} onClick={() => onCopy(value, label)}>
        <Copy className="h-3.5 w-3.5" />
      </button>
    </p>
  );
}
