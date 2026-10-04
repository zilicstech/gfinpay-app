import Link from "next/link";
import { ArrowLeft, Clock, Layers, Sparkles } from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Why Double-Entry Accounting is Non-Negotiable for Micro-Retailer Float",
  description:
    "Why traditional single-balance wallet systems fail under partner timeouts, and how immutable append-only ledger entries eliminate phantom balance losses.",
  path: "/insights/double-entry-ledger-retailers",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-20 lg:px-8">
      <Link
        href="/insights"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Insights</span>
      </Link>

      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold text-emerald-800">
            Ledger Architecture
          </span>
          <span className="text-slate-400">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5" /> 7 min read
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Published July 2026</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-black text-navy-950 leading-[1.18] tracking-tight">
          Why Double-Entry Accounting is Non-Negotiable for Micro-Retailer Float.
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed font-normal">
          Why traditional single-balance wallet databases fail during network timeouts, and how immutable append-only ledger entries protect retailer capital.
        </p>

        <div className="flex items-center gap-3 pt-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-navy-950 text-white font-bold text-sm">
            GF
          </div>
          <div>
            <p className="text-xs font-bold text-navy-950">Gatewayline Research Group</p>
            <p className="text-[11px] text-slate-500">Core Systems & Transaction Engine</p>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-6 text-base text-slate-700 leading-relaxed">
        <p className="text-lg leading-relaxed text-navy-900 font-medium">
          When a Kirana store retailer maintains a ₹30,000 float balance, that money represents working capital needed to run their grocery store, buy dairy inventory, and pay distributor bills.
        </p>

        <p>
          In a primitive wallet system, when an IMPS transfer is initiated, the database runs `UPDATE wallets SET balance = balance - 5000`. If the sponsor bank gateway times out 10 seconds later, the retailer sees ₹25,000, while the customer claims the recipient never received the cash. Panic ensues.
        </p>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 my-8 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>The Hold-Then-Capture Architecture</span>
          </div>
          <p className="text-sm text-emerald-950 leading-relaxed">
            In {SITE.name}, wallets are never mutated in place. Instead, transactions are written to an append-only ledger. When a transfer begins, a `HOLD` entry moves ₹5,000 from available float to locked escrow. If the bank succeeds, a `CAPTURE` entry finalizes the payout and posts commissions. If the bank rejects or times out, an automated `REVERSAL` entry unlocks the hold immediately.
          </p>
        </div>

        <h2 className="font-display text-2xl font-bold text-navy-950 pt-4">
          Day-End Bank Reconciliation
        </h2>

        <p>
          Every evening at 23:59:59 IST, our batch reconciliation engine compares the aggregate sum of all credits, debits, holds, and commission entries against the sponsor bank&apos;s settlement MIS file.
        </p>

        <p>
          Because every row is immutable and tied to a unique UUID idempotency key, zero transactions are ever lost, double-debited, or phantom-credited.
        </p>
      </div>

      <div className="mt-14 border-t border-slate-200 pt-8 flex items-center justify-between">
        <Link
          href="/insights"
          className="btn-secondary !py-2.5 !px-5 text-xs font-bold"
        >
          <span>← Back to all Insights</span>
        </Link>
        <Link
          href="/services"
          className="btn-primary !py-2.5 !px-5 text-xs font-bold"
        >
          <span>Explore All Services →</span>
        </Link>
      </div>
    </article>
  );
}
