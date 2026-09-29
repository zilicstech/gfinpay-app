"use client";

import { useEffect, useState } from "react";
import { Percent, TrendingUp } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { VolumeBars } from "@/features/desk/DeskChrome";
import type { DeskEarnings, DeskOverview } from "@/features/desk/types";

export default function AgentReportsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DeskEarnings | null>(null);
  const [overview, setOverview] = useState<DeskOverview | null>(null);

  useEffect(() => {
    if (!token) return;
    api<DeskEarnings>("/api/v1/desk/earnings", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load reports"));
    api<DeskOverview>("/api/v1/desk/overview", { token }).then(setOverview).catch(() => undefined);
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your earning"
        description="Commission from completed sales this month."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Earned this month" value={inr(data?.earnedMonth)} hint="Your split" icon={<Percent className="h-5 w-5" />} />
        <StatCard label="All-time commission" value={inr(data?.earned)} />
        <StatCard label="GMV this month" value={inr(overview?.gmvMonth)} hint={`${overview?.successRateMonth ?? 0}% success`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>
      {overview && <VolumeBars points={overview.gmvByDay} />}
      {!data?.byRole?.length ? (
        <EmptyState title="No earnings yet" body="Commission from completed sales will show here." />
      ) : (
        <DataTable columns={["Role", "Amount"]} rows={data.byRole.map((r) => [r.role_in_split, inr(r.amount)])} />
      )}
      <Flash message={flash.message} error={flash.error} />
    </div>
  );
}
