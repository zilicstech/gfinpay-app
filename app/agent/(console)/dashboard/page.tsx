"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, CreditCard, Landmark, UserRound, Wallet, Zap } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { AccentTile } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { useDeskServices } from "@/features/desk/DeskServices";
import type { DeskOverview } from "@/features/desk/types";
import { filterQuickTiles } from "@/features/desk/retailer-services";
import { OverviewMetrics, n, type OverviewSnapshot } from "@/features/console/OverviewMetrics";

type RetailerOverview = DeskOverview & OverviewSnapshot;

const TILE_ICONS: Record<string, typeof ArrowLeftRight> = {
  DMT: ArrowLeftRight,
  BBPS: Zap,
  UPI_CASHOUT: Landmark,
  AEPS: Landmark,
  LEAD_GEN: CreditCard,
  FD_MODULE: CreditCard,
};

export default function AgentDashboard() {
  const token = useSession((s) => s.token);
  const { codes, fdProviders } = useDeskServices();
  const flash = useFlash();
  const [data, setData] = useState<RetailerOverview | null>(null);

  useEffect(() => {
    if (!token) return;
    api<RetailerOverview>("/api/v1/desk/overview", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load overview"));
  }, [token]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((i) => <div key={i} className="card h-28 animate-pulse bg-[#f5f5f5]" />)}</div>
        <Flash message={flash.message} error={flash.error} />
      </div>
    );
  }

  const tiles = filterQuickTiles(codes, fdProviders);
  const network = data.network;

  return (
    <>
      <Flash message={flash.message} error={flash.error} />
      <OverviewMetrics
        title="Overview"
        description="Customers at your outlet, sales started and activated, and commission you have earned."
        snapshot={data}
        earningsMode="you"
        lead={
          tiles.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {tiles.map((a) => {
                const Icon = TILE_ICONS[a.code] ?? ArrowLeftRight;
                return (
                  <Link key={`${a.code}-${a.href}`} href={a.href} className="card hover:border-navy-900/20">
                    <AccentTile>
                      <Icon className="h-5 w-5" />
                    </AccentTile>
                    <p className="mt-3 text-sm font-semibold text-navy-950">{a.label}</p>
                    <p className="mt-0.5 text-xs text-navy-600">{a.hint}</p>
                  </Link>
                );
              })}
            </div>
          ) : null
        }
        network={[
          { label: "Customers", value: String(n(network?.customers ?? data.customerCount)), hint: "On your books", icon: <UserRound className="h-5 w-5" /> },
          { label: "Wallet", value: inr(data.walletAvailable), hint: data.walletStatus ?? "Available", icon: <Wallet className="h-5 w-5" /> },
          { label: "On hold", value: inr(data.walletHold), hint: "Sends in progress" },
          { label: "Sales all-time", value: String(n(data.sales?.created_all)), hint: `${n(data.sales?.activated_all)} activated`, icon: <CreditCard className="h-5 w-5" /> },
        ]}
        fourth={{
          label: "Your earnings all-time",
          value: inr(data.you?.all_time ?? data.commissionEarned),
          hint: `${inr(data.you?.month ?? data.commissionMonth)} this month`,
        }}
        earningsCaption="retailer + distributor + platform"
      />
    </>
  );
}
