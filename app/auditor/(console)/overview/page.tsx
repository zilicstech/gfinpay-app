"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, IndianRupee, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import type { FinanceRequest } from "@/features/finance/types";

export default function AuditorOverviewPage() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const flash = useFlash();
  const [activations, setActivations] = useState<FinanceRequest[] | null>(null);
  const [wallets, setWallets] = useState<FinanceRequest[] | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<FinanceRequest[]>("/api/v1/finance/requests?kind=ACTIVATION&status=PENDING", { token }),
      api<FinanceRequest[]>("/api/v1/finance/requests?kind=WALLET_TOPUP&status=PENDING", { token }),
    ])
      .then(([a, w]) => {
        setActivations(Array.isArray(a) ? a : []);
        setWallets(Array.isArray(w) ? w : []);
      })
      .catch((e) => flash.fail(e, "Failed to load finance overview"));
  }, [token]);

  const loading = activations === null || wallets === null;
  const recentActivations = (activations ?? []).slice(0, 5);
  const recentWallets = (wallets ?? []).slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Flash message={flash.message} error={flash.error} />

      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-emerald-400 font-bold tracking-wider text-xs sm:text-sm mb-1 uppercase">
            Welcome Back
          </p>
          <h1 className="text-3xl sm:text-4xl font-display text-white tracking-tight">
            Hello, {user?.fullName || "Auditor"}
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Review activation and wallet proofs. Confirming a wallet request credits the retailer automatically.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-36 rounded-[2rem] animate-pulse bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Pending activations"
            value={String(activations.length)}
            hint="Awaiting payment verification"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Pending wallet requests"
            value={String(wallets.length)}
            hint="Top-ups waiting to credit"
            icon={<IndianRupee className="h-5 w-5" />}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RequestList
          title="Recent pending activations"
          empty="No activation proofs waiting."
          rows={recentActivations}
          loading={loading}
        />
        <RequestList
          title="Recent wallet requests"
          empty="No wallet proofs waiting."
          rows={recentWallets}
          loading={loading}
        />
      </div>
    </div>
  );
}

function RequestList({
  title,
  empty,
  rows,
  loading,
}: {
  title: string;
  empty: string;
  rows: FinanceRequest[];
  loading: boolean;
}) {
  return (
    <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-navy-950">{title}</h2>
        <Link href="/auditor/requests" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="All clear" body={empty} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/auditor/requests/${r.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50/80 rounded-xl px-1 -mx-1 transition-colors">
                <div className="min-w-0">
                  <p className="font-semibold text-navy-950 truncate">{r.retailer_name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
                    {r.retailer_code ?? "—"} · {r.utr}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="font-mono text-sm font-bold text-navy-950">{inr(r.amount)}</p>
                  <div className="flex items-center justify-end gap-2">
                    <StatusPill value={r.status} />
                    <span className="text-[11px] text-slate-400">{r.created_at ? when(r.created_at) : ""}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
