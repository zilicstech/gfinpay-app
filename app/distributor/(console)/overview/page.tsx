"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, UserRound, Users, Wallet } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { AttentionList, TopOutletsTable } from "@/features/desk/DeskChrome";
import type { DeskOverview } from "@/features/desk/types";
import { OverviewMetrics, n, type OverviewSnapshot } from "@/features/console/OverviewMetrics";

type DistributorOverview = DeskOverview & OverviewSnapshot;

export default function DistributorOverviewPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DistributorOverview | null>(null);

  useEffect(() => {
    if (token) {
      api<DistributorOverview>("/api/v1/desk/overview", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load overview"));
    }
  }, [token]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="card h-28 animate-pulse bg-[#f5f5f5]" />)}</div>
        <Flash message={flash.message} error={flash.error} />
      </div>
    );
  }

  const network = data.network;

  return (
    <>
      <Flash message={flash.message} error={flash.error} />
      <OverviewMetrics
        title="Overview"
        description="Network size, sales started and activated, and commission generated in your area."
        actions={
          <Link href="/distributor/agents?onboard=1" className="btn-primary">
            Add retailer
          </Link>
        }
        snapshot={data}
        earningsMode="you"
        network={[
          { label: "Retailers", value: String(n(network?.retailers ?? data.outletCount)), hint: `${n(network?.retailers_active ?? data.activeOutlets)} active`, icon: <Store className="h-5 w-5" /> },
          { label: "Customers", value: String(n(network?.customers ?? data.customerCount)), hint: "On retailer books", icon: <UserRound className="h-5 w-5" /> },
          { label: "Wallet at retailers", value: inr(data.walletFloat), hint: "Available + on hold", icon: <Wallet className="h-5 w-5" /> },
          { label: "Needs attention", value: String(data.pendingKyc ?? data.attention?.length ?? 0), hint: "KYC or frozen tills", icon: <Users className="h-5 w-5" /> },
        ]}
        fourth={{
          label: "Your earnings all-time",
          value: inr(data.you?.all_time ?? data.commissionEarned),
          hint: `${inr(data.you?.month ?? data.commissionMonth)} this month`,
        }}
        earningsCaption="retailer + distributor + platform"
      >
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl text-navy-950">Retailer performance</h3>
            <Link href="/distributor/agents" className="text-sm font-semibold text-brand-700">All retailers</Link>
          </div>
          <TopOutletsTable rows={data.topRetailers ?? []} />
        </section>
        <AttentionList rows={data.attention ?? []} />
      </OverviewMetrics>
    </>
  );
}
