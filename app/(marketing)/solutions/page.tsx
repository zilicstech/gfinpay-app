import Link from "next/link";
import { NAV } from "@/lib/site";
import { seo } from "@/lib/seo";

export const metadata = seo({
  title: "Who gfinpay is for",
  description: "gfinpay is for retailers, distributors, and banks who want banking services at the kirana counter.",
  path: "/solutions",
});

const copy: Record<string, string> = {
  "/solutions/retailers": "A phone on the counter. Send money, pay bills, recharge, give cash, help with cards.",
  "/solutions/distributors": "Look after retailers in your area. See earnings. Do not handle customer cash.",
  "/solutions/enterprises": "Your licence and bank rails. Our retailers and books.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-20">
      <p className="text-sm font-medium text-brand-700">Who it is for</p>
      <h1 className="mt-3 font-display text-3xl text-navy-950 sm:text-4xl">Retailers, distributors, and banks.</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {NAV.solutions.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-3xl border border-navy-900/10 bg-white p-6 hover:border-navy-900/20">
            <h2 className="font-display text-xl text-navy-950">{s.label}</h2>
            <p className="mt-2 text-sm text-navy-700">{copy[s.href]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
