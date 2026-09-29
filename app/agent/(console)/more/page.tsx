"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CreditCard, Landmark, PieChart, Receipt, UserRound, Users, Zap } from "lucide-react";
import { AccentTile } from "@/components/ui/primitives";
import { useDeskServices } from "@/features/desk/DeskServices";
import { buildMoreItems } from "@/features/desk/retailer-services";

const ICONS: Record<string, typeof Zap> = {
  "/agent/bbps": Zap,
  "/agent/cash-out/upi": Landmark,
  "/agent/aeps": Landmark,
  "/agent/customers": Users,
  "/agent/catalog": CreditCard,
  "/agent/sales": Receipt,
  "/agent/transactions": Receipt,
  "/agent/reports": PieChart,
  "/agent/profile": UserRound,
};

export default function AgentMorePage() {
  const { codes, fdProviders } = useDeskServices();
  const items = useMemo(() => buildMoreItems(codes, fdProviders), [codes, fdProviders]);

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <h1 className="font-display text-2xl text-navy-950">More</h1>
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? Receipt;
        return (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-navy-900/10 bg-white px-4 py-3.5">
            <AccentTile>
              <Icon className="h-5 w-5" />
            </AccentTile>
            <span>
              <span className="block text-sm font-semibold text-navy-950">{item.label}</span>
              <span className="block text-xs text-navy-500">{item.hint}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
