"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { TransactionRecord, type TxnRecord } from "@/features/console/TransactionRecord";

export default function AgentTxnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [txn, setTxn] = useState<TxnRecord | null>(null);

  useEffect(() => {
    if (token && id) api<TxnRecord>(`/api/v1/desk/transactions/${id}`, { token }).then(setTxn).catch((e) => flash.fail(e, "Failed to load transaction"));
  }, [token, id]);

  if (!txn) {
    return (
      <div className="space-y-5">
        <Flash message={flash.message} error={flash.error} />
        <div className="card h-48 animate-pulse bg-[#f5f5f5]" />
      </div>
    );
  }

  return (
    <>
      <TransactionRecord
        backHref="/agent/transactions"
        backLabel="All transactions"
        txn={txn}
        flash={<Flash message={flash.message} error={flash.error} />}
      />
    </>
  );
}
