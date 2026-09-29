import { seo } from "@/lib/seo";

export const metadata = seo({
  title: "Why assisted banking still outperforms super-apps in Bharat",
  description: "An essay on Business Correspondents, DMT, AePS and why gfinpay builds agent consoles instead of consumer wallets.",
  path: "/insights/assisted-banking-india",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 lg:px-8 lg:py-20">
      <p className="text-sm font-medium text-navy-500">Insights</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-navy-950 sm:text-5xl">Assisted rails beat another consumer wallet.</h1>
      <div className="mt-8 space-y-4 leading-relaxed text-navy-700">
        <p>Payments banks proved that India will adopt digital value if the human at the counter is trusted. Super-apps skip that human. gfinpay keeps them — and gives them a ledger that would satisfy a sponsor bank.</p>
        <p>DMT still has cash-origin monthly ceilings. AePS still needs biometrics. UPI-to-cash still needs a till. FD-backed cards still need the customer to fund from their own account. Those constraints are features of the regulation, not bugs in the UI.</p>
        <p>Our job is to make the retailer&apos;s till obvious on a 5-inch phone, and to make every rupee reconcilable at EOD.</p>
      </div>
    </article>
  );
}
