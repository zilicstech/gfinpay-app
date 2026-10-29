"use client";

import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, PageHeader, StatusPill } from "@/components/ui/primitives";
import { SellHospiCashModal } from "@/features/hospi/SellHospiCashModal";

type Sale = {
  id: string;
  gfin_sale_code: string;
  customer_name: string;
  mobile: string;
  state: string;
  activation_status?: string;
  premium_amount: number;
  sale_channel: string;
  created_at?: string;
};

export function HospiCashList({ canSell }: { canSell: boolean }) {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function load() {
    if (!token) return;
    api<Sale[]>("/api/v1/hospi-cash", { token })
      .then(setRows)
      .catch((e) => setError(formatApiError(e, "Could not load Hospi Cash sales")));
  }

  useEffect(() => {
    load();
  }, [token]);

  return (
    <div>
      <PageHeader
        eyebrow="Cards"
        title="Hospi Cash"
        description="Reward is credited only after activation is marked success."
        actions={
          canSell ? (
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
              Sell Hospi Cash
            </button>
          ) : null
        }
      />
      {error && <Alert tone="error">{error}</Alert>}
      {rows.length === 0 ? (
        <EmptyState title="No Hospi Cash cards" body="Sold cards that are still waiting, and activated cards, show up here." />
      ) : (
        <DataTable
          columns={["Sale", "Customer", "Mobile", "Activation", "Premium", "When"]}
          rows={rows.map((row) => [
            row.gfin_sale_code,
            row.customer_name,
            row.mobile,
            <StatusPill
              key={row.id}
              value={row.activation_status || "PENDING"}
              label={row.activation_status === "SUCCESS" ? "Success" : row.activation_status === "FAILED" ? "Failed" : "Pending"}
            />,
            `₹${Number(row.premium_amount).toLocaleString("en-IN")}`,
            when(row.created_at),
          ])}
        />
      )}
      {canSell && (
        <SellHospiCashModal
          open={open}
          onClose={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
