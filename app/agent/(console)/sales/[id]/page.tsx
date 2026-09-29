"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import { SaleDetail, type SaleLead } from "@/features/sales/SaleDetail";

export default function AgentSaleDetailPage() {
  const token = useSession((s) => s.token);
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<SaleLead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && id) api<SaleLead>(`/api/v1/sales/${id}`, { token }).then(setLead).catch((e) => setError(formatApiError(e, "Could not load the lead")));
  }, [token, id]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!lead) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  return <SaleDetail backHref="/agent/sales" backLabel="All sales" lead={lead} audience="desk" />;
}
