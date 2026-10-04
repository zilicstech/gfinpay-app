import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "The Architecture of Zero-Custody Fixed Deposit Credit Cards",
  description:
    "How client-side payment links and RBI AML guidelines allow retail agents to distribute secured credit cards without ever holding the customer deposit.",
  path: "/insights/zero-custody-fd-cards",
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
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 font-bold text-indigo-800">
            Regulatory Engineering
          </span>
          <span className="text-slate-400">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5" /> 8 min read
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Published August 2026</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-black text-navy-950 leading-[1.18] tracking-tight">
          The Architecture of Zero-Custody Fixed Deposit Credit Cards.
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed font-normal">
          How client-side payment links and RBI AML guidelines allow retail agents to distribute secured credit cards without ever handling or pooling customer deposits.
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

      <div className="mt-10 space-y-6 text-base text-slate-700 leading-relaxed">
        <p className="text-lg leading-relaxed text-navy-900 font-medium">
          Under Reserve Bank of India Master Directions for Digital Lending and Business Correspondents, an assisted retailer must never accept cash to fund an investment or deposit on behalf of a third party.
        </p>

        <p>
          Secured credit cards backed by Fixed Deposits (such as those issued by SBM Bank India and Indian Overseas Bank) represent one of the highest margin opportunities for Bharat retailers, generating referral commissions between ₹800 and ₹2,900 per approved applicant.
        </p>

        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 sm:p-8 my-8 space-y-2">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>The Zero-Custody Solution</span>
          </div>
          <p className="text-sm text-indigo-950 leading-relaxed">
            Rather than taking cash from the walk-in customer, the {SITE.name} terminal triggers an encrypted SMS and WhatsApp handover link directly to the customer&apos;s personal smartphone. The customer completes KYC and funds the underlying FD directly from their own savings account via netbanking or UPI intent.
          </p>
        </div>

        <h2 className="font-display text-2xl font-bold text-navy-950 pt-4">
          Three Immutable Guardrails
        </h2>

        <ul className="space-y-3 list-disc pl-5 text-slate-600">
          <li><strong>No Cash Pooling:</strong> The retailer&apos;s till never receives deposit funds, preventing any regulatory commingling violations.</li>
          <li><strong>Real-time Webhook Attestation:</strong> Partner bank webhooks verify the issuance of the lien-marked FD before ledger commission unlocks.</li>
          <li><strong>Automated Split Settlement:</strong> Once the partner bank confirms onboarding, commission splits automatically credit the retailer and distributor passbooks.</li>
        </ul>
      </div>

      <div className="mt-14 border-t border-slate-200 pt-8 flex items-center justify-between">
        <Link
          href="/insights"
          className="btn-secondary !py-2.5 !px-5 text-xs font-bold"
        >
          <span>← Back to all Insights</span>
        </Link>
        <Link
          href="/services/fd-credit-cards"
          className="btn-primary !py-2.5 !px-5 text-xs font-bold"
        >
          <span>View FD Cards Service →</span>
        </Link>
      </div>
    </article>
  );
}
