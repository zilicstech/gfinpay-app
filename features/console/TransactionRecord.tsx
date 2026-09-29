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
  return (
    <div className="space-y-5">
      <Link href={backHref} className="text-sm font-semibold text-navy-700 underline">
        {backLabel}
      </Link>
      {flash}
      <EntityHero
        title={txn.txn_type.replaceAll("_", " ")}
        status={txn.state}
        lines={[
          <p key="id" className="font-mono text-sm tracking-widest text-white/80">{txn.id.slice(0, 8)}</p>,
          <p key="meta" className="text-xs text-white/50">Created {when(txn.created_at)}</p>,
        ]}
        stats={[
          { label: "Amount", value: inr(txn.amount) },
          { label: "Fee", value: inr(txn.fee) },
          { label: "Partner ref", value: txn.partner_ref ?? "—" },
        ]}
      />
      {txn.failure_reason && <p className="text-sm text-rose-800">{txn.failure_reason}</p>}
      <RecordFacts
        rows={[
          { label: "Transaction id", value: txn.id },
          { label: "Type", value: txn.txn_type.replaceAll("_", " ") },
          { label: "State", value: txn.state },
          { label: "Amount", value: inr(txn.amount) },
          { label: "Fee", value: inr(txn.fee) },
          { label: "Partner", value: txn.partner_code ?? "—" },
          { label: "Partner ref", value: txn.partner_ref ?? "—" },
          { label: "Agent", value: txn.agent_name ?? "—" },
          { label: "Created", value: when(txn.created_at) },
          ...(txn.updated_at ? [{ label: "Updated", value: when(txn.updated_at) }] : []),
          ...(extraFacts ?? []),
        ]}
      />
    </div>
  );
}
