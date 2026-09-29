"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Store, Users, UserRound } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession, isSuperAdmin } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { OverviewMetrics, n, type OverviewSnapshot } from "@/features/console/OverviewMetrics";

type HubRow = {
  id: string;
  code: string;
  name: string;
  city?: string;
  state?: string;
  status?: string;
  distributors?: number;
  distributors_active?: number;
  retailers?: number;
  retailers_active?: number;
  customers?: number;
  customers_ekyc?: number;
  wallet_float?: number;
  gmv?: number;
  sales?: number;
};

type Totals = {
  hubs: number;
  distributors: number;
  distributors_active: number;
  retailers: number;
  retailers_active: number;
  customers: number;
  customers_ekyc: number;
};

type Dashboard = OverviewSnapshot & { totals: Totals; hubs: HubRow[] };

export default function HubAdminOverviewPage() {
  const token = useSession((s) => s.token);
  const userType = useSession((s) => s.user?.userType);
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin(userType)) {
      router.replace("/admin/analytics");
      return;
    }
    if (!token || userType !== "ADMIN") return;
    api<Dashboard>("/api/v1/admin/hub-dashboard", { token })
      .then((next) => {
        setData(next);
        setError(null);
      })
      .catch((e) => setError(formatApiError(e, "Could not load your dashboard")));
  }, [router, token, userType]);

  if (!data && !error) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-[#f5f5f5]" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <Alert tone="error">{error}</Alert>;
  }

  const t = data.totals;
  const network = data.network ?? t;

  return (
    <OverviewMetrics
      title="Overview"
      description="Network size, sales started and activated, and commission generated in your hubs."
      snapshot={data}
      network={[
        { label: "Hubs", value: String(n(network.hubs ?? t.hubs)), hint: "Geographies assigned to you", icon: <Building2 className="h-5 w-5" /> },
        { label: "Distributors", value: String(n(network.distributors ?? t.distributors)), hint: `${n(network.distributors_active ?? t.distributors_active)} active`, icon: <Users className="h-5 w-5" /> },
        { label: "Retailers", value: String(n(network.retailers ?? t.retailers)), hint: `${n(network.retailers_active ?? t.retailers_active)} active`, icon: <Store className="h-5 w-5" /> },
        { label: "Customers", value: String(n(network.customers ?? t.customers)), hint: `${n(t.customers_ekyc)} eKYC done`, icon: <UserRound className="h-5 w-5" /> },
      ]}
      fourth={{
        label: "Platform all-time",
        value: inr(data.earnings?.platform),
        hint: `${inr(data.earnings?.all_time)} total paid`,
      }}
      earningsCaption="retailer + distributor + platform"
    >
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl text-navy-950">By hub</h2>
            <p className="mt-1 text-sm text-navy-600">Each assigned hub and the network sitting under it.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/admin/distributors" className="text-brand-700">Distributors</Link>
            <Link href="/admin/retailers" className="text-brand-700">Retailers</Link>
            <Link href="/admin/customers" className="text-brand-700">Customers</Link>
          </div>
        </div>
        {data.hubs.length === 0 ? (
          <EmptyState title="No hubs assigned" body="Ask a super admin to assign you to a hub." />
        ) : (
          <DataTable
            columns={["Hub", "Code", "Place", "Status", "Distributors", "Retailers", "Customers", "Wallet", "GMV"]}
            rows={data.hubs.map((h) => [
              h.name,
              <span key={`${h.id}-code`} className="font-mono text-sm tracking-wide">{h.code}</span>,
              [h.city, h.state].filter(Boolean).join(", ") || "—",
              <StatusPill key={`${h.id}-st`} value={h.status ?? "—"} />,
              `${n(h.distributors)} (${n(h.distributors_active)} active)`,
              `${n(h.retailers)} (${n(h.retailers_active)} active)`,
              `${n(h.customers)} (${n(h.customers_ekyc)} eKYC)`,
              inr(n(h.wallet_float)),
              inr(n(h.gmv)),
            ])}
          />
        )}
      </section>
    </OverviewMetrics>
  );
}
