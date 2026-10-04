import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Why assisted banking still outperforms super-apps in Bharat",
  description:
    "An essay on Business Correspondents, DMT, AePS and why Gfinpay builds agent consoles instead of consumer wallets.",
  path: "/insights/assisted-banking-india",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-20 lg:px-8">
      {/* Back button */}
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
            Market Thesis
          </span>
          <span className="text-slate-400">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5" /> 6 min read
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Published September 2026</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-black text-navy-950 leading-[1.18] tracking-tight">
          Assisted rails beat another consumer wallet in Bharat.
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed font-normal">
          Why hundreds of millions of Indian citizens choose walk-in Kirana counters over direct consumer super-apps for remittances, bill payments, and secured cards.
        </p>

        <div className="flex items-center gap-3 pt-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-navy-950 text-white font-bold text-sm">
            GF
          </div>
          <div>
            <p className="text-xs font-bold text-navy-950">Gatewayline Research Group</p>
            <p className="text-[11px] text-slate-500">Regulatory Infrastructure & Assisted Banking</p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="mt-10 space-y-6 text-base text-slate-700 leading-relaxed">
        <p className="text-lg leading-relaxed text-navy-900 font-medium">
          Payments banks and digital initiatives in India proved that the population will enthusiastically adopt digital financial value — provided the human at the counter is trusted.
        </p>

        <p>
          Consumer super-apps assume that every consumer has high financial literacy, uninterrupted 5G data, comfortable English or regional script reading skills, and the confidence to type their bank account PIN into an unfamiliar payment link when paying a ₹3,500 electricity bill.
        </p>

        {/* Takeaway Box */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 my-8 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>The Assisted Banking Paradox</span>
          </div>
          <p className="text-sm text-emerald-950 leading-relaxed">
            &ldquo;When ₹15,000 of hard-earned cash needs to reach a village in Bihar before sunset, people do not experiment with consumer UPI apps. They walk into the store where they buy rice and wheat, hand over physical notes, watch the retailer verify the account holder&apos;s name over penny-drop, and wait for the paper or WhatsApp receipt.&rdquo;
          </p>
        </div>

        <h2 className="font-display text-2xl font-bold text-navy-950 pt-4">
          Constraints as Core Architectural Features
        </h2>

        <p>
          Domestic Money Transfer still has cash-origin monthly ceilings (₹25,000 per sender). AePS still requires Aadhaar biometric authentication. UPI-to-cash still requires a merchant till with physical liquidity. Fixed Deposit-backed credit cards still mandate that the customer fund the FD directly from their own verified savings bank account.
        </p>

        <p>
          Those constraints are not bugs in modern fintech UI. They are foundational pillars of RBI anti-money laundering (AML) and consumer protection guidelines.
        </p>

        <h2 className="font-display text-2xl font-bold text-navy-950 pt-4">
          Our Mandate: The 5-Inch Phone Terminal
        </h2>

        <p>
          At {SITE.name}, our core engineering focus is singular: to make the retailer&apos;s till unmistakably obvious on a 5-inch smartphone screen, eliminate phantom balances through immutable double-entry ledgering, and guarantee that every single rupee reconciles at day-end with the sponsor bank.
        </p>
      </div>

      {/* Footer Navigation */}
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
          <span>Explore Services Platform →</span>
        </Link>
      </div>
    </article>
  );
}
