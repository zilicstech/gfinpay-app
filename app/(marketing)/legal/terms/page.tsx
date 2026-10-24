import Link from "next/link";
import { ArrowLeft, FileText, Mail, Phone } from "lucide-react";
import { CompanyIdentity } from "@/features/legal/CompanyIdentity";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Terms of Use",
  description: `Terms of use for the ${SITE.name} website and partner platform, operated by ${SITE.legalName}.`,
  path: "/legal/terms",
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
          <FileText className="h-3.5 w-3.5 text-brand-600" />
          <span>Legal &amp; Regulatory Governance</span>
        </span>
        <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-navy-950 sm:text-5xl">
          Terms of Use
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
          <h2 className="font-display text-xl font-bold text-navy-950">1. Acceptance of these terms</h2>
          <p>
            These terms govern access to the {SITE.name} website, partner applications, and payment services operated by{" "}
            <strong className="text-navy-950">{SITE.legalName}</strong> (CIN {SITE.cin}), a company incorporated in India on{" "}
            {SITE.incorporatedOn} and registered with {SITE.roc} under registration number {SITE.registrationNumber}.
            The registered office is {SITE.registeredAddress}.
          </p>
          <p>
            By visiting the website, creating a partner account, or using any payment, wallet, or assisted-banking
            service, you accept these terms. If you do not agree, do not use the platform.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">2. Services</h2>
          <p>
            {SITE.name} provides a technology platform for appointed retailers, distributors, and administrators to
            offer assisted financial services. Those services may include domestic money transfer, bill payments,
            mobile and DTH recharge, FASTag top-up, insurance premium collection, Aadhaar-enabled cash-out, UPI
            cash-out, retailer wallets, and assistance with bank-issued FD cards.
          </p>
          <p>
            Licensed Indian banks, NBFCs, and NPCI switches settle the underlying payment. {SITE.legalName} supplies
            the interface, routing, wallet ledger, and partner network. We are not a bank and do not take public
            deposits.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">3. Who may use the platform</h2>
          <p>
            Transactional desks are open only to onboarded and verified partners. There is no open public signup for
            a retailer or distributor desk. Partners must complete KYC, keep shop and identity details current, and
            follow RBI, UIDAI, NPCI, and sponsor-bank rules that apply to the service they use.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Keep login credentials, OTPs, and session keys confidential. Do not share a till or scanner login.</li>
            <li>Observe statutory limits, including the RBI domestic money-transfer ceiling that applies to the sender.</li>
            <li>Do not pool customer cash to fund deposits, investments, or cards in your own name.</li>
            <li>Use the platform only for lawful payments and only for customers you have identified as required.</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">4. Wallets, fees, and settlement</h2>
          <p>
            Retailer wallets are pre-funded. Money moves on an append-only double-entry ledger with hold-then-capture
            settlement. If a partner bank or switch fails, held funds are released by a compensating entry. Fees and
            commissions are shown before you confirm a transaction. Settlement to your wallet or bank follows the
            schedule agreed with your distributor or with us.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">5. Refunds, reversals, and disputes</h2>
          <p>
            A payment that the switch accepts is treated as complete. Failed or timed-out requests are reversed to
            the wallet or source as the bank or NPCI reports them. Chargebacks, beneficiary disputes, and customer
            refunds follow the rules of the sponsor bank or biller. We will help investigate with the reference
            number from the receipt.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">6. Prohibited use</h2>
          <p>
            You may not use {SITE.name} for money laundering, terrorist financing, gambling that is illegal in India,
            sale of prohibited goods, identity fraud, or any activity that a sponsor bank or regulator has barred.
            We may freeze a wallet, hold a settlement, or close an account where we reasonably suspect such use.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">7. Liability and indemnity</h2>
          <p>
            The platform is provided on a commercially reasonable basis. We are not liable for bank, NPCI, UIDAI, or
            telecom outages, or for loss caused by your credentials, your scanner, or information you entered. Our
            aggregate liability for a claim is limited to the fees we earned on the disputed transaction in the
            thirty days before the claim. You will indemnify {SITE.legalName} against claims that arise from your
            breach of these terms or from a transaction you submitted.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">8. Suspension and termination</h2>
          <p>
            We may suspend or close access if KYC is incomplete, a regulator or sponsor bank so directs, these terms
            are breached, or the service is withdrawn. You may stop using the platform at any time. Amounts already
            settled stay subject to the ledger and to any open investigation.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">9. Governing law</h2>
          <p>
            These terms are governed by the laws of India. Courts at Kolkata, West Bengal, have exclusive
            jurisdiction, subject to any mandatory consumer or payment-system forum that applies.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-950">10. Partner grievance</h2>
          <p>
            Partners who have a complaint about onboarding, settlement, a transaction, or these terms can call or
            write to the partner grievance desk. We aim to acknowledge within two working days and to close the
            complaint within fifteen working days where the facts are with us.
          </p>
          <div className="space-y-2 pt-2 text-sm font-semibold text-emerald-700">
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4" />
              <a className="hover:underline" href={SITE.phoneHref}>
                {SITE.phone}
              </a>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <a className="hover:underline" href={`mailto:${SITE.partnerEmail}`}>
                {SITE.partnerEmail}
              </a>
            </p>
            <p className="font-normal text-slate-600">
              Registered office: {SITE.registeredAddress}
            </p>
            <p className="font-normal text-slate-600">
              General enquiries:{" "}
              <a className="font-semibold text-emerald-700 hover:underline" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
