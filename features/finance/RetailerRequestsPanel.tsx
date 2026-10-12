"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { ProofViewerModal } from "@/features/finance/ProofViewerModal";
import { financeStatusTone, formatFinanceKind, formatFinanceStatus, formatTransferMode, type FinanceKind, type FinanceRequest, type FinanceStatus } from "@/features/finance/types";

export function RetailerRequestsPanel({
  token,
  retailerId,
  refreshKey = 0,
  kinds,
  statuses,
  onCount,
}: {
  token: string | null;
  retailerId: string;
  refreshKey?: number;
  kinds?: FinanceKind[];
  statuses?: FinanceStatus[];
  onCount?: (count: number) => void;
}) {
  const [rows, setRows] = useState<FinanceRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!token || !retailerId) return;
    let cancelled = false;
    setError(null);
    api<FinanceRequest[]>(`/api/v1/finance/requests?retailerId=${retailerId}`, { token })
      .then((data) => {
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : []).filter((row) => {
          if (kinds?.length && !kinds.includes(row.kind)) return false;
          if (statuses?.length && !statuses.includes(row.status)) return false;
          return true;
        });
        setRows(list);
        onCount?.(list.length);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setError("Could not load requests");
        onCount?.(0);
      });
    return () => {
      cancelled = true;
    };
  }, [token, retailerId, refreshKey, kinds?.join("|"), statuses?.join("|")]);

  return (
    <>
    {error ? (
      <EmptyState title="Requests unavailable" body={error} />
    ) : !rows ? (
      <div className="h-40 rounded-3xl animate-pulse bg-slate-100" />
    ) : !rows.length ? (
      <EmptyState
        title={emptyTitle(kinds, statuses)}
        body={emptyBody(kinds, statuses)}
      />
    ) : (
    <DataTable
      columns={["When", "Type", "Amount", "Mode", "Bank", "UTR", "Status", "Reviewer", "Proof"]}
      rows={rows.map((r) => [
        r.created_at ? when(r.created_at) : "—",
        formatFinanceKind(r.kind),
        inr(r.amount),
        formatTransferMode(r.transfer_mode),
        <span key={`${r.id}-bank`} className="text-xs">
          {bankLabel(r)}
        </span>,
        <span key={`${r.id}-utr`} className="font-mono text-xs">
          {r.kind === "EARNINGS_WITHDRAW" && r.status === "PENDING" ? "—" : r.utr || "—"}
        </span>,
        <StatusPill
          key={`${r.id}-st`}
          value={financeStatusTone(r.kind, r.status)}
          label={formatFinanceStatus(r.kind, r.status)}
        />,
        r.auditor_name || "—",
        r.proof_filename ? (
          <button
            key={`${r.id}-proof`}
            type="button"
            className="text-xs font-semibold text-navy-950 underline"
            onClick={() => setProof({ id: r.id, name: r.proof_filename || "Payment proof" })}
          >
            View
          </button>
        ) : (
          "—"
        ),
      ])}
    />
    )}
    <ProofViewerModal
      open={proof != null}
      token={token}
      requestId={proof?.id}
      filename={proof?.name}
      onClose={() => setProof(null)}
    />
    </>
  );
}

function emptyTitle(kinds?: FinanceKind[], statuses?: FinanceStatus[]) {
  if (statuses?.length === 1 && statuses[0] === "PENDING") return "No pending requests";
  if (statuses?.length === 1 && statuses[0] === "RECEIVED" && kinds?.includes("EARNINGS_WITHDRAW")) {
    return "No completed withdrawals";
  }
  return "No requests yet";
}

function emptyBody(kinds?: FinanceKind[], statuses?: FinanceStatus[]) {
  if (statuses?.length === 1 && statuses[0] === "PENDING") {
    return "Top-ups and withdrawals you raise appear here until an auditor reviews them.";
  }
  if (statuses?.length === 1 && statuses[0] === "RECEIVED" && kinds?.includes("EARNINGS_WITHDRAW")) {
    return "After an auditor marks a withdrawal transferred, the UTR, bank, and payment proof appear here.";
  }
  if (kinds?.length) {
    return "Each top-up and withdrawal stays in this list until an auditor reviews it. You can raise another while one is still pending.";
  }
  return "Activation payments, wallet top-ups, and earnings withdrawals raised for this retailer appear here.";
}

function bankLabel(row: FinanceRequest) {
  if (row.kind === "WALLET_TOPUP" && row.collection_bank_name) {
    return `${row.collection_bank_name} · ${row.collection_account_number ?? ""}`;
  }
  if (row.kind === "EARNINGS_WITHDRAW") {
    const to = row.payout_bank_name
      ? `To ${row.payout_bank_name} · ${row.payout_account_number ?? ""}`
      : "";
    const from = row.collection_bank_name ? `From ${row.collection_bank_name}` : "";
    return [from, to].filter(Boolean).join(" · ") || "—";
  }
  return "—";
}
