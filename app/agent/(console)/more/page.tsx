"use client";

import Link from "next/link";
import { useMemo } from "react";
import { 
  Building2, 
  ChevronRight, 
  CreditCard, 
  Landmark, 
  PieChart, 
  Receipt, 
  ShieldCheck, 
  Sparkles, 
  UserRound, 
  Users, 
  Zap,
  ArrowRight
} from "lucide-react";
import { useDeskServices } from "@/features/desk/DeskServices";
import { buildMoreItems } from "@/features/desk/retailer-services";
import { useSession } from "@/stores/session.store";

const ICONS: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  "/agent/bbps": { icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  "/agent/cash-out/upi": { icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-50" },
  "/agent/aeps": { icon: Landmark, color: "text-blue-500", bg: "bg-blue-50" },
  "/agent/customers": { icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
  "/agent/catalog": { icon: CreditCard, color: "text-rose-500", bg: "bg-rose-50" },
  "/agent/sales": { icon: Sparkles, color: "text-teal-500", bg: "bg-teal-50" },
  "/agent/transactions": { icon: Receipt, color: "text-indigo-500", bg: "bg-indigo-50" },
  "/agent/reports": { icon: PieChart, color: "text-cyan-500", bg: "bg-cyan-50" },
  "/agent/profile": { icon: UserRound, color: "text-slate-600", bg: "bg-slate-100" },
  "/agent/settings": { icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
};

export default function AgentMorePage() {
  const user = useSession((s) => s.user);
  const { codes, fdProviders } = useDeskServices();
  const items = useMemo(() => buildMoreItems(codes, fdProviders), [codes, fdProviders]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Mini Profile Hub Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Retail Desk</span>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">{user?.fullName ?? "Outlet Manager"}</h1>
            <p className="mt-0.5 text-xs text-slate-300 font-mono">{user?.code ?? "RETAIL-DESK"}</p>
          </div>
          <Link
            href="/agent/profile"
            className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/20 transition-colors"
          >
            Manage Profile
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Desk Utilities & Portals</p>
        <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          {items.map((item) => {
            const meta = ICONS[item.href] ?? { icon: Receipt, color: "text-slate-700", bg: "bg-slate-50" };
            const Icon = meta.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.bg} ${meta.color} transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-navy-950 group-hover:text-navy-900">{item.label}</span>
                    <span className="block text-xs text-slate-500">{item.hint}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-navy-950" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
