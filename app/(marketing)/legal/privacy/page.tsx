import Link from "next/link";
import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { CompanyIdentity } from "@/features/legal/CompanyIdentity";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE.name} websites and partner console, operated by ${SITE.legalName}.`,
  path: "/legal/privacy",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-20 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-4 border-b border-slate-200 pb-8">
        <span className="d2c-badge">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
          <span>Data Protection &amp; Privacy</span>
        </span>
        <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-navy-950 sm:text-5xl">
          Privacy Policy
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-navy-950">{SITE.legalName}</span>
          <span>·</span>
          <span className="font-mono">CIN {SITE.cin}</span>
          <span>·</span>
          <span>Last updated 24 October 2026</span>
        </div>
      </div>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-slate-700">
        <CompanyIdentity />

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">1. Who we are</h2>
          <p>
            This policy covers websites and partner consoles at {SITE.url} operated by{" "}
            <strong className="text-navy-950">{SITE.legalName}</strong> (CIN {SITE.cin}), registered with {SITE.roc}{" "}
            under registration number {SITE.registrationNumber}, incorporated on {SITE.incorporatedOn}. The registered
            office is {SITE.registeredAddress}.
          </p>
          <p>
            We collect only what is needed to run the platform, complete a payment, keep an audit trail, and meet
            Indian law, including the Digital Personal Data Protection Act, 2023.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">2. Information we collect</h2>
          <ul className="list-disc space-y-3 pl-5 text-sm text-slate-600">
            <li>
              <strong>Partner account data:</strong> name, mobile, email, shop details, KYC documents, and the
              retailer or distributor code we assign.
            </li>
            <li>
              <strong>Customer transaction data:</strong> sender or beneficiary name, mobile, account or bill
              reference, amount, and the bank or biller response needed to complete the payment.
            </li>
            <li>
              <strong>Device and security data:</strong> IP address, device identifiers used for fraud control, and
              scanner metadata for a biometric session. We do not keep raw fingerprints.
            </li>
            <li>
              <strong>Website enquiry data:</strong> name, mobile, email, city, and the message you send on the
              contact form.
            </li>
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">3. How we use it</h2>
          <p>
            We use personal data to create and secure partner accounts, route payments, reconcile wallets, prevent
            fraud, answer grievances, and meet requests from RBI, FIU-IND, NPCI, UIDAI, tax authorities, or a
            sponsor bank. We do not sell or rent personal data.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">4. Sensitive data</h2>
          <ul className="list-disc space-y-3 pl-5 text-sm text-slate-600">
            <li>
              <strong>Aadhaar and biometrics:</strong> raw fingerprints and full Aadhaar numbers are not stored on{" "}
              {SITE.name} systems or in the browser. Only masked tokens and partner-bank PID blocks travel on
              encrypted sessions.
            </li>
            <li>
              <strong>PAN:</strong> encrypted at rest and decrypted only for a live bank check.
            </li>
            <li>
              <strong>Wallet balances:</strong> live balances and ledger lines are not written to PWA or browser
              caches.
            </li>
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">5. Sharing</h2>
          <p>
            We share data with sponsor banks, NPCI switches, billers, UIDAI-certified devices, cloud and security
            processors who act on our instructions, and regulators when the law requires it. Sharing is limited to
            what that payment or audit needs.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">6. Retention and security</h2>
          <p>
            Transaction and KYC records are kept for the period Indian payment and tax law requires, then deleted or
            anonymised. We protect data with TLS in transit, access control, and encryption at rest for sensitive
            fields. No method is perfect; we will notify you as required if a breach affects your data.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">7. Your rights</h2>
          <p>
            You may ask for access, correction, or erasure of personal data we hold, or withdraw consent where
            processing is consent-based, subject to records we must keep for a completed payment or for the law.
            Website cookies are used for session security and basic analytics, not for selling advertising profiles.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">8. Grievance and privacy contact</h2>
          <p>
            Partners who have a privacy or service complaint can call or write to the partner grievance desk. Other
            privacy requests may use the general desk. We aim to acknowledge within two working days.
          </p>
          <div className="space-y-2 pt-2 text-sm font-semibold text-emerald-700">
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4" />
              <span>
                Contact and grievance:{" "}
                <a className="hover:underline" href={SITE.phoneHref}>
                  {SITE.phone}
                </a>
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <span>
                Partner grievance:{" "}
                <a className="hover:underline" href={`mailto:${SITE.partnerEmail}`}>
                  {SITE.partnerEmail}
                </a>
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <span>
                Privacy and general:{" "}
                <a className="hover:underline" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </span>
            </p>
            <p className="font-normal text-slate-600">Registered office: {SITE.registeredAddress}</p>
          </div>
        </section>
      </div>
    </article>
  );
}
