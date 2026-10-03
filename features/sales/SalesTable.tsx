"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { partnerStatusLabel } from "@/lib/partner-status";

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

function channelLabel(channel?: string) {
  return channel === "EXTERNAL" ? "Vendor" : "Network";
}

function partyLine(name?: string, code?: string) {
  if (!name && !code) return "—";
  if (name && code) return `${name} (${code})`;
  return name ?? code ?? "—";
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
        title="No sales yet"
        body="Sales appear here when a link is generated from the network desk or a vendor field team."
      />
    );
  }

  const columns: string[] = [];
  if (showChannel) columns.push("Channel");
  columns.push("Product", "Partner", "Distributor / vendor");
  if (!hideRetailer) columns.push("Retailer / employee");
  columns.push("Hub", "Partner step", "State", "Opened", "");

  return (
    <DataTable
      columns={columns}
      rows={rows.map((row) => {
        const cells: ReactNode[] = [];
        if (showChannel) {
          cells.push(
            <span
              key={`${row.id}-ch`}
              className={`text-xs font-bold uppercase tracking-wide ${row.sale_channel === "EXTERNAL" ? "text-amber-800" : "text-navy-700"}`}
            >
              {channelLabel(row.sale_channel)}
            </span>,
          );
        }
        cells.push(
          row.product_code ?? "—",
          row.sale_provider ?? "—",
          partyLine(row.distributor_name, row.distributor_code),
        );
        if (!hideRetailer) {
          cells.push(partyLine(row.retailer_name, row.retailer_code));
        }
        cells.push(
          row.hub_name ?? "—",
          partnerStatusLabel(row.partner_status),
          <StatusPill key={`${row.id}-st`} value={row.state} />,
          row.link_opened_at ? "Yes" : "Not yet",
          <Link key={`${row.id}-v`} href={`${detailBase}/${row.id}`} className="text-sm font-semibold text-brand-700">
            View
          </Link>,
        );
        return cells;
      })}
    />
  );
}
