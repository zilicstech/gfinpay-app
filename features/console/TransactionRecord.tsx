"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { EntityHero, RecordFacts } from "@/features/console/EntityChrome";
import { inr, when } from "@/lib/format";
import type { TxnRow } from "@/features/admin/types";

export type TxnRecord = TxnRow & {
  partner_code?: string;
  agent_user_id?: string;
  updated_at?: string;
};

import { CheckCircle2, Clock, Copy, Printer, XCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { StatusPill } from "@/components/ui/primitives";

export function TransactionRecord({
  backHref,
  backLabel,
  txn,
  extraFacts,
  flash,
}: {
  backHref: string;
  backLabel: string;
  txn: TxnRecord;
  extraFacts?: { label: string; value: ReactNode }[];
  flash?: ReactNode;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const isSuccess = txn.state === "SUCCESS" || txn.state === "COMPLETED";
  const isFailed = txn.state === "FAILED" || txn.state === "REJECTED";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <button
          onClick={() => window.print()}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <Printer className="h-4 w-4 text-slate-500" />
          Print Receipt
        </button>
      </div>

      {flash}

      {/* Main Luxury Receipt Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 sm:px-10 sm:py-10 text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {txn.txn_type.replaceAll("_", " ")}
                </span>
                <StatusPill value={txn.state} />
              </div>
              <p className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
                {inr(txn.amount)}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>Fee: {inr(txn.fee)}</span>
                <span>•</span>
                <span>Created {when(txn.created_at)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md min-w-[14rem]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transaction ID</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-emerald-300 font-semibold">{txn.id.slice(0, 16)}...</span>
                <button
                  type="button"
                  onClick={() => copy(txn.id, "txnId")}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Copy ID"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {copied === "txnId" && <p className="text-[10px] text-emerald-400 mt-1">Copied to clipboard!</p>}
              
              {txn.partner_ref && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Partner Ref / UTR</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-white">{txn.partner_ref}</span>
                    <button
                      type="button"
                      onClick={() => copy(txn.partner_ref!, "partnerRef")}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Copy Partner Ref"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {copied === "partnerRef" && <p className="text-[10px] text-emerald-400 mt-1">Copied!</p>}
                </div>
              )}
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  ✓
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Initiated</p>
                  <p className="text-[10px] text-slate-400 truncate">{when(txn.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  isSuccess ? "bg-emerald-500/20 text-emerald-400" : isFailed ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"
                }`}>
                  {isSuccess ? "✓" : isFailed ? "✕" : "•••"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Bank Switch</p>
                  <p className="text-[10px] text-slate-400 truncate">{txn.partner_code ?? "Settlement Rail"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  isSuccess ? "bg-emerald-400 text-black" : isFailed ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-400"
                }`}>
                  {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : isFailed ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Status</p>
                  <p className="text-[10px] text-slate-400 truncate">{txn.state}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {txn.failure_reason && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-4 sm:px-10 text-rose-900 text-sm flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold">Transaction Declined / Failed</p>
              <p className="text-xs mt-0.5 text-rose-700">{txn.failure_reason}</p>
            </div>
          </div>
        )}

        {/* Detailed Facts Grid */}
        <div className="p-6 sm:p-10 space-y-6">
          <h3 className="font-display text-lg font-bold text-navy-950">Settlement Breakdown</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Principal Amount</p>
              <p className="mt-1 font-display text-xl font-bold text-navy-950">{inr(txn.amount)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Fee</p>
              <p className="mt-1 font-display text-xl font-bold text-navy-950">{inr(txn.fee)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Settlement</p>
              <p className="mt-1 font-display text-xl font-bold text-emerald-700">{inr(Number(txn.amount) + Number(txn.fee || 0))}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70">
              <span className="text-xs font-semibold text-slate-500">Retailer / Counter</span>
              <span className="text-sm font-bold text-navy-950">{txn.agent_name ?? "Direct Outlet"}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-white">
              <span className="text-xs font-semibold text-slate-500">Transaction Reference</span>
              <span className="font-mono text-xs font-medium text-slate-800">{txn.id}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70">
              <span className="text-xs font-semibold text-slate-500">Rail Partner</span>
              <span className="text-sm font-medium text-navy-900">{txn.partner_code ?? "GFINPAY Switch"}</span>
            </div>
            {txn.partner_ref && (
              <div className="flex items-center justify-between px-5 py-3.5 bg-white">
                <span className="text-xs font-semibold text-slate-500">Bank RRN / UTR</span>
                <span className="font-mono text-xs font-medium text-slate-800">{txn.partner_ref}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70">
              <span className="text-xs font-semibold text-slate-500">Timestamp</span>
              <span className="text-sm text-navy-900">{txn.created_at ? new Date(txn.created_at).toLocaleString("en-IN") : "—"}</span>
            </div>
            {extraFacts?.map((fact) => (
              <div key={fact.label} className="flex items-center justify-between px-5 py-3.5 bg-white">
                <span className="text-xs font-semibold text-slate-500">{fact.label}</span>
                <span className="text-sm font-semibold text-navy-950">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
