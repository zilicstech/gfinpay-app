import { seo } from "@/lib/seo";

export const metadata = seo({
  title: "Compliance & risk posture",
  description: "How gfinpay implements RBI-aligned DMT limits, AML for FD-backed cards, immutable ledgers and partner reconciliation.",
  path: "/compliance",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-20">
      <p className="text-sm font-medium text-navy-500">Compliance</p>
      <h1 className="mt-3 font-display text-3xl text-navy-950 sm:text-4xl">Rules we follow.</h1>
      <ul className="mt-8 space-y-5 text-navy-700">
        <li><strong className="text-navy-950">No customer deposits with us.</strong> Money stays in the customer’s bank.</li>
        <li><strong className="text-navy-950">Send-money limits.</strong> ₹5,000 per send, ₹25,000 a month per person.</li>
        <li><strong className="text-navy-950">FD cards.</strong> Customer puts FD money from their own phone. The retailer never takes that cash.</li>
        <li><strong className="text-navy-950">Less personal data.</strong> Aadhaar last-4 only. No fingerprint stored.</li>
        <li><strong className="text-navy-950">Passbook cannot be edited.</strong> Mistakes are reversed with a new entry.</li>
        <li><strong className="text-navy-950">Day-end match.</strong> Our file is matched with the bank’s file.</li>
      </ul>
    </article>
  );
}
