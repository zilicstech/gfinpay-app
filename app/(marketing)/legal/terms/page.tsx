import Link from "next/link";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Terms of Use",
  description: `Terms of use for the ${SITE.name} website and agent platform, operated by ${SITE.legalName}.`,
  path: "/legal/terms",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-20 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-4 border-b border-slate-200 pb-8">
        <span className="d2c-badge">
          <FileText className="h-3.5 w-3.5 text-brand-600" />
          <span>Legal & Regulatory Governance</span>
        </span>

        <h1 className="font-display text-3xl sm:text-5xl font-black text-navy-950 leading-tight tracking-tight">
          Terms of Use
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-navy-950">{SITE.legalName}</span>
          <span>·</span>
          <span className="font-mono">CIN {SITE.cin}</span>
          <span>·</span>
          <span>Last updated October 2026</span>
        </div>
      </div>

      <div className="mt-10 space-y-8 text-base text-slate-700 leading-relaxed">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">1. Platform Scope & Purpose</h2>
          <p>
            These terms govern access to the {SITE.name} website, promotional pages, and retailer/distributor desks. The platform is operated by <strong className="text-navy-950">{SITE.legalName}</strong> (Corporate Identity Number: {SITE.cin}), registered under the Companies Act, 2013 in India.
          </p>
          <p>
            Financial services including Domestic Money Transfer, BBPS Bill Payments, AePS cash-out, and Fixed Deposit credit cards are powered by licensed Indian banks, Non-Banking Financial Companies (NBFCs), and NPCI switches. {SITE.name} provides the technical interface, transactional outbox routing, and assisted retail network management under official Business Correspondent arrangements.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">2. Appointed User Obligations</h2>
          <p>
            Access to transactional modules is strictly restricted to onboarded and verified Business Correspondent Retailers, Master Distributors, and corporate vendor administrators. There is no open public signup for retail desks.
          </p>
          <ul className="space-y-2 list-disc pl-5 text-sm text-slate-600">
            <li><strong>Credential Confidentiality:</strong> Users must maintain absolute confidentiality of OTPs, login credentials, and session keys. Sharing credentials or delegating till access is strictly prohibited.</li>
            <li><strong>Regulatory Limits:</strong> Appointed agents must strictly observe statutory limits, including the RBI DMT monthly ceiling of ₹25,000 per sender and biometric verification rules.</li>
            <li><strong>Zero Cash Custody for Deposits:</strong> Agents must never pool or accept cash to directly fund Fixed Deposits or investments on behalf of customers.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">3. Wallet Balances & Settlement</h2>
          <p>
            Retailer wallets are operated on a pre-funded model with an append-only double-entry ledger. All transactions follow hold-then-capture settlement. In the event of partner bank switch failures, held funds are automatically released through compensating entries.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">4. Legal & Grievance Contact</h2>
          <p>
            For legal inquiries, dispute escalations, or compliance audits, please contact our legal desk directly:
          </p>
          <div className="flex items-center gap-3 pt-2 text-sm font-semibold text-emerald-700">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${SITE.email}`} className="hover:underline">{SITE.email}</a>
          </div>
        </div>
      </div>
    </article>
  );
}
