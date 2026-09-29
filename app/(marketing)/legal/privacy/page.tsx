import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Privacy policy",
  description: `Privacy policy for ${SITE.name} websites and agent console, operated by ${SITE.legalName}.`,
  path: "/legal/privacy",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 text-navy-700 lg:px-8 lg:py-20">
      <h1 className="font-display text-4xl text-navy-950">Privacy policy</h1>
      <p className="mt-3 text-sm text-navy-500">
        {SITE.legalName} · CIN {SITE.cin}
      </p>
      <div className="mt-8 space-y-4 leading-relaxed">
        <p>
          {SITE.name} is operated by {SITE.legalName} (CIN {SITE.cin}). We process retailer, distributor, and customer
          descriptors solely to operate assisted transactions.
        </p>
        <p>
          Aadhaar numbers are not stored in raw form. PAN is encrypted. Console API responses are never placed in a PWA
          cache. We keep only what is needed to complete a send, cash-out, wallet top-up, or card lead, and to match
          the day-end file with the bank.
        </p>
        <p>
          Contact {SITE.email} for data requests addressed to {SITE.legalName}.
        </p>
      </div>
    </article>
  );
}
