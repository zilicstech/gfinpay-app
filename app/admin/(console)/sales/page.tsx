"use client";

import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, PageHeader } from "@/components/ui/primitives";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";

export default function AdminSalesPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<SalesLead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<SalesLead[]>("/api/v1/sales", { token })
      .then(setRows)
      .catch((e) => setError(formatApiError(e, "Could not load sales")));
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="All service leads — network retailers and vendor field teams — in one list."
      />
      {error && <Alert tone="error">{error}</Alert>}
      <SalesTable rows={rows} detailBase="/admin/sales" showChannel />
    </div>
  );
}
