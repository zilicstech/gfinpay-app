"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export type CollectionAccount = {
  id: string;
  account_name: string;
  account_number: string;
  ifsc: string;
  bank_name: string;
  upi_id?: string | null;
  qr_url?: string | null;
  active?: boolean;
};

export function CollectionAccounts({ token, compact = false }: { token: string | null; compact?: boolean }) {
  const [rows, setRows] = useState<CollectionAccount[]>([]);

  useEffect(() => {
    if (!token) return;
    api<CollectionAccount[]>("/api/v1/finance/collection-accounts", { token })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, [token]);

  if (!rows.length) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3 sm:col-span-2"}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Transfer to one of these accounts</p>
      <div className="space-y-2">
        {rows.map((bank) => (
          <div key={bank.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-navy-950">{bank.bank_name}</p>
                <p className="text-xs text-slate-600">{bank.account_name}</p>
                <p className="font-mono text-sm text-navy-950">{bank.account_number}</p>
                <p className="font-mono text-xs text-slate-600">IFSC {bank.ifsc}</p>
                {bank.upi_id && <p className="text-xs text-navy-800">UPI {bank.upi_id}</p>}
              </div>
              {bank.qr_url && (
                <img src={bank.qr_url} alt={`${bank.bank_name} payment QR`} className="h-24 w-24 rounded-lg bg-white object-contain ring-1 ring-slate-200" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
