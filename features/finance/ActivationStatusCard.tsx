"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, Phone } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { Alert } from "@/components/ui/primitives";
import type { FinanceRequest } from "@/features/finance/types";

type Phase = "review" | "received";

export function ActivationStatusCard({
  token,
  retailerId,
  phase,
}: {
  token: string | null;
  retailerId: string;
  phase: Phase;
}) {
  const [latest, setLatest] = useState<FinanceRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams({ kind: "ACTIVATION", retailerId });
    api<FinanceRequest[]>(`/api/v1/finance/requests?${params}`, { token })
      .then((rows) => setLatest(Array.isArray(rows) && rows.length ? rows[0] : null))
      .catch((e) => setError(formatApiError(e, "Could not load activation status")));
  }, [token, retailerId]);

  const received = phase === "received";
  const distributor = latest?.distributor_name?.trim();
  const contact = distributor
    ? `Contact your distributor, ${distributor}, or your hub admin and ask them to activate the outlet.`
    : "Contact your distributor or hub admin and ask them to activate the outlet.";

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-sm">
      <div className={`px-6 py-8 sm:px-8 ${received ? "bg-emerald-50" : "bg-sky-50"}`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${received ? "bg-emerald-600 text-white" : "bg-sky-700 text-white"}`}>
          {received ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
          {received ? "Payment received" : "Payment submitted"}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy-950">
          {received ? "Your activation payment is successful" : "Your activation payment is under review"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          {received
            ? "We have received the payment. The account will be activated within 24–48 hours."
            : "The auditor is checking the payment proof. This page shows the current status. After the payment is marked received, your distributor or hub admin activates the outlet, usually within 24–48 hours."}
        </p>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {error && <Alert tone="error">{error}</Alert>}

        <ol className="space-y-4">
          <Step
            n={1}
            state="done"
            title="Payment submitted"
            body={latest?.created_at ? `Submitted ${when(latest.created_at)}.` : "Your payment proof is on file."}
          />
          <Step
            n={2}
            state={received ? "done" : "current"}
            title={received ? "Payment received" : "Payment review"}
            body={received
              ? latest?.reviewed_at
                ? `Marked received ${when(latest.reviewed_at)}.`
                : "The auditor has confirmed the payment."
              : "Waiting for the auditor to confirm the transfer."}
          />
          <Step
            n={3}
            state={received ? "current" : "waiting"}
            title="Outlet activation"
            body={received
              ? "Waiting on your distributor or hub admin. This usually takes 24–48 hours."
              : "Starts after the payment is received. Your distributor or hub admin turns the outlet on."}
          />
        </ol>

        {latest && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Fact label="Amount" value={inr(latest.amount)} />
            <Fact label="UTR" value={latest.utr} mono />
            <Fact label="Current status" value={received ? "Payment received" : "Under review"} />
          </div>
        )}

        {received && (
          <div className="flex items-start gap-3 rounded-2xl bg-navy-950 px-4 py-4 text-white">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <p className="text-sm text-slate-200">{contact} The desk opens after they activate the account.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Step({ n, state, title, body }: { n: number; state: "done" | "current" | "waiting"; title: string; body: string }) {
  const dot = state === "done"
    ? "bg-emerald-600 text-white"
    : state === "current"
      ? "bg-amber-500 text-white"
      : "bg-slate-200 text-slate-500";
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${dot}`}>
        {state === "done" ? "✓" : n}
      </span>
      <div>
        <p className="text-sm font-bold text-navy-950">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{body}</p>
      </div>
    </li>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-navy-950 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
