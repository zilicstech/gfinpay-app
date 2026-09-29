"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { inr, txnLabel } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatusPill } from "@/components/ui/primitives";
import { DateRangePicker } from "@/features/admin/DateRangePicker";
import { Flash, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { TxnRow } from "@/features/admin/types";

type TxnType = { type: string; label: string };

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthStart() {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

const FALLBACK_TYPES: TxnType[] = [
  { type: "WALLET", label: "Wallet Transactions" },
  { type: "DMT", label: "DMT Transactions" },
  { type: "CASHOUT_UPI", label: "UPI to Cash transactions" },
];

export default function TransactionsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [types, setTypes] = useState<TxnType[]>(FALLBACK_TYPES);
  const [txnType, setTxnType] = useState("WALLET");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [rows, setRows] = useState<TxnRow[] | null>(null);

  useEffect(() => {
    if (!token) return;
    api<TxnType[]>("/api/v1/admin/transactions/types", { token })
      .then((list) => {
        if (list.length) {
          setTypes(list);
          setTxnType((cur) => (list.some((t) => t.type === cur) ? cur : list[0].type));
        }
      })
      .catch((e) => flash.fail(e, "Failed to load transaction types"));
  }, [token]);

  async function view(e: FormEvent) {
    e.preventDefault();
    if (!token || !txnType || !from || !to) return;
    try {
      const data = await api<TxnRow[]>(
        `/api/v1/admin/transactions?txnType=${encodeURIComponent(txnType)}&from=${from}&to=${to}`,
        { token },
      );
      setRows(data);
      flash.clear();
    } catch (err) {
      flash.fail(err, "Failed to load transactions");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        description="Choose a transaction type and date range, then view matching platform movements."
      />
      <form className="card flex flex-wrap items-end gap-3" onSubmit={view}>
        <div className="w-[17.5rem]">
          <SelectField
            label="Transaction type"
            required
            value={txnType}
            onChange={setTxnType}
            options={types.map((t) => ({ value: t.type, label: t.label }))}
          />
        </div>
        <DateRangePicker from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
        <button className="btn-primary" type="submit" disabled={!txnType || !from || !to}>
          View transactions
        </button>
      </form>
      <Flash message={flash.message} error={flash.error} />
      {rows === null ? (
        <EmptyState title="No transactions yet" body="Select a type and date range, then view transactions." />
      ) : rows.length === 0 ? (
        <EmptyState title="No transactions" body="Nothing posted for this type in this date range." />
      ) : (
        <DataTable
          columns={["When", "Agent", "Type", "State", "Amount", ""]}
          rows={rows.map((t) => [
            t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "—",
            t.agent_name ?? "—",
            txnLabel(t.txn_type),
            <StatusPill key={t.id} value={t.state} />,
            inr(t.amount),
            <ViewLink key={`${t.id}-v`} href={`/admin/transactions/${t.id}`} />,
          ])}
        />
      )}
    </div>
  );
}
