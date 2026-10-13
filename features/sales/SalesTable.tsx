"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  CreditCard,
  Phone,
  Store,
  Users,
} from "lucide-react";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { partnerStatusLabel } from "@/lib/partner-status";
import { when } from "@/lib/format";
import { productTitle } from "@/features/sales/CatalogShowcase";

export function funnelStepLabel(row: {
  partner_status?: string | null;
  link_opened_at?: string | null;
  state?: string | null;
}): string {
  if (row.partner_status && partnerStatusLabel(row.partner_status) !== "—") {
    return partnerStatusLabel(row.partner_status);
  }
  return row.link_opened_at ? "Opened" : "Initiated";
}

export type SalesLead = {
  id: string;
  sale_channel?: string;
  product_code?: string;
  sale_provider?: string;
  sale_type?: string;
  distributor_name?: string;
  distributor_code?: string;
  retailer_name?: string;
  retailer_code?: string;
  hub_name?: string;
  state: string;
  partner_status?: string;
  link_opened_at?: string;
  created_at?: string;
  customer_name?: string;
  customer_mobile?: string;
  item_name?: string;
  item_code?: string;
  category_name?: string;
};

function channelBadge(channel?: string) {
  if (channel === "EXTERNAL") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-500/25 whitespace-nowrap">
        <Briefcase className="h-3 w-3 text-amber-600 shrink-0" />
        Vendor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-500/25 whitespace-nowrap">
      <Store className="h-3 w-3 text-indigo-600 shrink-0" />
      Retailer
    </span>
  );
}

export function SalesTable({
  rows,
  detailBase,
  hideRetailer = false,
  showChannel = true,
  hideDistributor = false,
  hideCustomer = false,
  showHub = false,
}: {
  rows: SalesLead[];
  detailBase: string;
  hideRetailer?: boolean;
  showChannel?: boolean;
  hideDistributor?: boolean;
  hideCustomer?: boolean;
  showHub?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No sales leads yet"
        body="Sales appear here when a link is generated from the network desk or a vendor field team."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            {showChannel && <th className="px-6 py-4">Channel</th>}
            <th className="px-6 py-4">Product</th>
            {showHub && <th className="px-6 py-4">Hub</th>}
            {!hideCustomer && <th className="px-6 py-4">Customer</th>}
            {!hideDistributor && <th className="px-6 py-4">Distributor</th>}
            {!hideRetailer && <th className="px-6 py-4">Retailer</th>}
            <th className="px-6 py-4">Funnel Step</th>
            <th className="px-6 py-4">Created On</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-slate-50/60 group">
              {showChannel && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {channelBadge(row.sale_channel)}
                </td>
              )}
              <td className="px-6 py-4">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/25 shrink-0">
                    <CreditCard className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-navy-950 text-sm">
                      {productTitle(
                        row.item_code ?? row.product_code ?? "",
                        row.item_name ?? row.product_code ?? "Financial Product"
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.sale_provider ?? "Bank Partner"}
                    </p>
                  </div>
                </div>
              </td>
              {showHub && (
                <td className="px-6 py-4">
                  {row.hub_name ? (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-navy-900">
                        {row.hub_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              )}
              {!hideCustomer && (
                <td className="px-6 py-4">
                  {row.customer_name ? (
                    <div>
                      <p className="font-semibold text-navy-950 text-sm">{row.customer_name}</p>
                      {row.customer_mobile && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">+91 {row.customer_mobile}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              )}
              {!hideDistributor && (
                <td className="px-6 py-4">
                  {row.distributor_name ? (
                    <div className="flex items-start gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-navy-900">{row.distributor_name}</p>
                        {row.distributor_code && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">{row.distributor_code}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              )}
              {!hideRetailer && (
                <td className="px-6 py-4">
                  {row.retailer_name ? (
                    <div className="flex items-start gap-1.5">
                      <Store className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-800">{row.retailer_name}</p>
                        {row.retailer_code && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            {row.retailer_code}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              )}
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  {funnelStepLabel(row)}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                {row.created_at ? when(row.created_at) : "—"}
              </td>
              <td className="px-6 py-4">
                <StatusPill value={row.state} />
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`${detailBase}/${row.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  Inspect
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
