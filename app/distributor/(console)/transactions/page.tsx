"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { TxnRow } from "@/features/admin/types";

export default function DistributorTransactionsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<TxnRow[]>([]);

  useEffect(() => {
    if (token) api<TxnRow[]>("/api/v1/desk/transactions", { token }).then(setRows).catch((e) => flash.fail(e, "Failed to load transactions"));
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Activity from retailers in your network." />
      <StatCard label="Recent" value={String(rows.length)} hint="Last 200 in your downline" />
      {rows.length === 0 ? (
        <EmptyState title="No transactions yet" body="Volume appears after an outlet completes a sale or wallet movement." />
      ) : (
        <DataTable
          columns={["When", "Outlet", "Type", "State", "Amount", ""]}
          rows={rows.map((t) => [
            t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "—",
            t.agent_name ?? "—",
            t.txn_type,
            <StatusPill key={t.id} value={t.state} />,
            inr(t.amount),
            <ViewLink key={`${t.id}-v`} href={`/distributor/transactions/${t.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
    </div>
  );
}
