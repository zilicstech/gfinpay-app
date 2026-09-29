import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: `About ${SITE.name}`,
  description: `${SITE.name} helps kirana retailers send money, give cash, and help customers take an FD card. Banks keep the deposits.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-20">
      <p className="text-sm font-medium text-navy-500">About</p>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-navy-950 sm:text-4xl">
        Built for the retailer people already trust.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-navy-700">
        {SITE.name} exists because most of India still pays in cash, at a retailer they know. We give that retailer a simple phone app — not a public consumer app — so the owner can send money, pay bills, recharge a phone, give cash, and help with cards without holding the customer’s deposit.
      </p>
      <div className="mt-10 space-y-6 leading-relaxed text-navy-700">
        <p>Admin appoints distributors. Distributors add retailers. Retailers add money to a wallet, then serve customers. Every rupee is written in a passbook that cannot be edited.</p>
        <p>Customers do not get a {SITE.name} account. Their money stays in their own bank.</p>
        <p className="text-sm text-navy-500">
          {SITE.name} is operated by {SITE.legalName}. CIN {SITE.cin}.
        </p>
      </div>
    </article>
  );
}
