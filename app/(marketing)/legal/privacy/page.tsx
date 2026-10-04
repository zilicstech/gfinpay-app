import Link from "next/link";
import { ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE.name} websites and agent console, operated by ${SITE.legalName}.`,
  path: "/legal/privacy",
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
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
          <span>Data Protection & Privacy Architecture</span>
        </span>

        <h1 className="font-display text-3xl sm:text-5xl font-black text-navy-950 leading-tight tracking-tight">
          Privacy Policy
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
          <h2 className="font-display text-xl font-bold text-navy-950">1. Data Minimization Principles</h2>
          <p>
            {SITE.name} is operated by <strong className="text-navy-950">{SITE.legalName}</strong>. As an assisted financial technology provider, our infrastructure is engineered around strict data minimization: we collect and retain only the exact transactional descriptors required to execute transactions, maintain audit logs, and reconcile day-end files with licensed sponsor banks.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">2. Specific Protections for Sensitive Data</h2>
          <ul className="space-y-3 list-disc pl-5 text-sm text-slate-600">
            <li>
              <strong>Aadhaar Biometric Information:</strong> In strict compliance with UIDAI regulations, raw biometric prints and full 12-digit Aadhaar numbers are never stored on {SITE.name} databases or local browser storage. Only masked tokens and partner bank PID blocks are transmitted over transient encrypted tunnels.
            </li>
            <li>
              <strong>Permanent Account Number (PAN):</strong> PAN records are encrypted at rest using AES-256 and only decrypted during real-time bank verification.
            </li>
            <li>
              <strong>Zero Browser Cache for Balances:</strong> Real-time wallet balances, ledger entries, and transaction feeds are strictly excluded from PWA caches or persistent client-side storage.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">3. Information Sharing & Sponsor Banks</h2>
          <p>
            We do not monetize, sell, or rent user or consumer personal data. Information is shared strictly with regulatory authorities (RBI, FIU-IND), NPCI payment switches, and appointed sponsor banks (e.g. SBM Bank, Indian Overseas Bank, Kotak Mahindra Bank) to complete authorized financial transactions.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="font-display text-xl font-bold text-navy-950">4. Nodal Data Protection Officer</h2>
          <p>
            For data inquiries, access requests, or deletion requests in accordance with the Digital Personal Data Protection (DPDP) Act, 2023:
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
