"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { inr, txnLabel } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { TxnRow } from "@/features/admin/types";

export default function AgentTransactionsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<TxnRow[]>([]);

  useEffect(() => {
    if (token) api<TxnRow[]>("/api/v1/desk/transactions", { token }).then(setRows).catch((e) => flash.fail(e, "Failed to load transactions"));
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Your outlet’s receipts and history." />
      <StatCard label="Recent" value={String(rows.length)} />
      {rows.length === 0 ? (
        <EmptyState title="No transactions yet" body="Completed sales and wallet movement will show here." />
      ) : (
        <DataTable
          columns={["When", "Type", "State", "Amount", ""]}
          rows={rows.map((t) => [
            t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "—",
            txnLabel(t.txn_type),
            <StatusPill key={t.id} value={t.state} />,
            inr(t.amount),
            <ViewLink key={`${t.id}-v`} href={`/agent/transactions/${t.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
    </div>
  );
}
