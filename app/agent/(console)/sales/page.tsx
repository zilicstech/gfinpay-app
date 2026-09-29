"use client";

import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, PageHeader } from "@/components/ui/primitives";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
import { RequireCustomerDesk } from "@/features/desk/DeskServices";

export default function AgentSalesPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<SalesLead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) api<SalesLead[]>("/api/v1/sales", { token }).then(setRows).catch((e) => setError(formatApiError(e, "Could not load sales")));
  }, [token]);

  return (
    <RequireCustomerDesk fallbackHref="/agent/dashboard">
    <div className="space-y-6">
      <PageHeader title="Sales" description="Every service link you have generated, including ones the customer has opened." />
      {error && <Alert tone="error">{error}</Alert>}
      <SalesTable rows={rows} detailBase="/agent/sales" />
    </div>
    </RequireCustomerDesk>
  );
}
