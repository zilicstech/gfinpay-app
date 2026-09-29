"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";

type Entry = { id: number; direction: string; amount: number; narration: string; account_type: string };

export default function WalletPage() {
  const token = useSession((s) => s.token);
  const [wallet, setWallet] = useState<{ availableBalance: number; holdBalance: number } | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => {
    if (!token) return;
    api<{ availableBalance: number; holdBalance: number }>("/api/v1/wallet", { token }).then(setWallet);
    api<Entry[]>("/api/v1/wallet/statement", { token }).then(setRows);
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Available is money you can use. On hold is money locked in a transaction."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Available" value={inr(wallet?.availableBalance)} />
        <StatCard label="Hold" value={inr(wallet?.holdBalance)} />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No entries yet" body="Wallet movement will appear here." />
      ) : (
        <DataTable
          columns={["Narration", "Account", "Direction", "Amount"]}
          rows={rows.map((r) => [r.narration, r.account_type, <StatusPill key={r.id} value={r.direction} />, inr(r.amount)])}
        />
      )}
    </div>
  );
}
