"use client";

import { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { Flash, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { DeskEarnings } from "@/features/desk/types";

export default function EarningsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DeskEarnings | null>(null);

  useEffect(() => {
    if (token) api<DeskEarnings>("/api/v1/desk/earnings", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load earnings"));
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Your share when a retailer’s sale succeeds."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="This month" value={inr(data?.earnedMonth)} hint="Paid on success" icon={<Percent className="h-5 w-5" />} />
        <StatCard label="All time" value={inr(data?.earned)} hint="Your distributor share" />
      </div>
      {data?.byOutlet && data.byOutlet.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-xl text-navy-950">By retailer</h3>
          <DataTable
            columns={["Retailer", "Your share", ""]}
            rows={data.byOutlet.map((r) => [
              r.full_name,
              inr(r.amount),
              <ViewLink key={`${r.id}-v`} href={`/distributor/agents/${r.id}`} />,
            ])}
          />
        </section>
      )}
      {!data?.byRole?.length ? (
        <EmptyState title="Waiting for volume" body="Commission appears after a downline sale succeeds." />
      ) : (
        <DataTable columns={["Role", "Amount"]} rows={data.byRole.map((r) => [r.role_in_split, inr(r.amount)])} />
      )}
      <Flash message={flash.message} error={flash.error} />
    </div>
  );
}
