"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { productTitle } from "@/features/sales/CatalogShowcase";

export type SalesLead = {
  id: string;
  customer_name: string;
  customer_mobile: string;
  item_name: string;
  item_code?: string;
  category_name: string;
  state: string;
  retailer_name?: string;
  payment_link_url?: string;
  link_opened_at?: string;
  created_at?: string;
};

export function SalesTable({
  rows,
  detailBase,
  hideRetailer = false,
}: {
  rows: SalesLead[];
  detailBase: string;
  hideRetailer?: boolean;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No sales yet" body="A sale appears here after a retailer generates a link for an eligible product." />;
  }
  const columns = hideRetailer
    ? ["Customer", "Product", "Category", "State", "Opened", ""]
    : ["Customer", "Product", "Category", "Retailer", "State", "Opened", ""];
  return (
    <DataTable
      columns={columns}
      rows={rows.map((row) => {
        const base: ReactNode[] = [
          `${row.customer_name} · ${row.customer_mobile}`,
          productTitle(row.item_code ?? "", row.item_name),
          row.category_name,
        ];
        if (!hideRetailer) {
          base.push(row.retailer_name ?? "—");
        }
        base.push(
          <StatusPill key={`${row.id}-st`} value={row.state} />,
          row.link_opened_at ? "Yes" : "Not yet",
          <Link key={`${row.id}-v`} href={`${detailBase}/${row.id}`} className="text-sm font-semibold text-brand-700">View</Link>,
        );
        return base;
      })}
    />
  );
}
