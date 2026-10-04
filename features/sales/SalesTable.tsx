"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Shield, Store, Users } from "lucide-react";
import { DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { partnerStatusLabel } from "@/lib/partner-status";
import { when } from "@/lib/format";

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
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-500/25">
        <Briefcase className="h-3 w-3 text-amber-600" />
        Vendor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800 ring-1 ring-indigo-500/25">
      <Store className="h-3 w-3 text-indigo-600" />
      Network
    </span>
  );
}

export function SalesTable({
  rows,
  detailBase,
  hideRetailer = false,
  showChannel = true,
}: {
  rows: SalesLead[];
  detailBase: string;
  hideRetailer?: boolean;
  showChannel?: boolean;
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
          <tr>
            {showChannel && <th className="px-6 py-4">Channel</th>}
            <th className="px-6 py-4">Product & Provider</th>
            <th className="px-6 py-4">Customer</th>
            <th className="px-6 py-4">Distributor</th>
            {!hideRetailer && <th className="px-6 py-4">Retailer</th>}
            <th className="px-6 py-4">Funnel Step</th>
            <th className="px-6 py-4">State</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-slate-50/60 group">
              {showChannel && (
                <td className="px-6 py-4">
                  {channelBadge(row.sale_channel)}
                </td>
              )}
              <td className="px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy-950 text-sm">
                      {row.item_name ?? row.product_code ?? "Financial Product"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {row.product_code ?? "—"}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{row.sale_provider ?? "Bank"}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {row.customer_name ? (
                  <div>
                    <p className="font-medium text-navy-950 text-xs sm:text-sm">{row.customer_name}</p>
                    {row.customer_mobile && (
                      <p className="font-mono text-[11px] text-slate-500 mt-0.5">+91 {row.customer_mobile}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-xs font-medium text-navy-900">
                {row.distributor_name ? (
                  <div>
                    <p>{row.distributor_name}</p>
                    {row.hub_name && <span className="text-[10px] text-slate-400">{row.hub_name}</span>}
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              {!hideRetailer && (
                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                  {row.retailer_name ?? "—"}
                </td>
              )}
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {partnerStatusLabel(row.partner_status)}
                </span>
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
