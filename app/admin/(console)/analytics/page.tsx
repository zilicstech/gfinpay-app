"use client";

import { useEffect, useState } from "react";
import { Building2, Store, UserRound, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { OverviewMetrics, n, type OverviewSnapshot } from "@/features/console/OverviewMetrics";

export default function AnalyticsPage() {
  const token = useSession((s) => s.token);
  const [data, setData] = useState<OverviewSnapshot | null>(null);

  useEffect(() => {
    if (token) api<OverviewSnapshot>("/api/v1/admin/reports/summary", { token }).then(setData);
  }, [token]);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-[#f5f5f5]" />
        ))}
      </div>
    );
  }

  const network = data.network;
  return (
    <OverviewMetrics
      title="Overview"
      description="Network size, sales started and activated, and commission generated."
      snapshot={data}
      network={[
        { label: "Hubs", value: String(n(network?.hubs)), hint: "Geographies on the platform", icon: <Building2 className="h-5 w-5" /> },
        { label: "Distributors", value: String(n(network?.distributors)), hint: `${n(network?.distributors_active)} active`, icon: <Users className="h-5 w-5" /> },
        { label: "Retailers", value: String(n(network?.retailers)), hint: `${n(network?.retailers_active)} active`, icon: <Store className="h-5 w-5" /> },
        { label: "Customers", value: String(n(network?.customers)), hint: "On retailer books", icon: <UserRound className="h-5 w-5" /> },
      ]}
      fourth={{
        label: "Platform all-time",
        value: inr(data.earnings?.platform),
        hint: `${inr(data.earnings?.all_time)} total paid`,
      }}
      earningsCaption="retailer + distributor + platform"
    />
  );
}
