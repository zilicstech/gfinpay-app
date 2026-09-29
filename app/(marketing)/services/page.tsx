import Link from "next/link";
import { ServiceArt } from "@/components/illustrations/HomeArt";
import { seo } from "@/lib/seo";

export const metadata = seo({
  title: "Services for retailers",
  description: "Send money, pay BBPS bills, recharge mobile and DTH, FASTag, LIC, give cash, keep a wallet, and help customers take an FD card — from a gfinpay kirana retailer.",
  path: "/services",
});

const items = [
  { href: "/services/domestic-money-transfer", kind: "dmt" as const, label: "Send money", blurb: "Customer gives cash. You send it to any bank account in India." },
  { href: "/services/bbps", kind: "bbps" as const, label: "Bill pay", blurb: "Electricity, water, gas, broadband, LPG, credit card, loan, and civic dues." },
  { href: "/services/recharge", kind: "recharge" as const, label: "Mobile & DTH", blurb: "Prepaid mobile and Tata Play, Dish, Airtel Digital TV, Sun Direct." },
  { href: "/services/fastag", kind: "fastag" as const, label: "FASTag", blurb: "Top up a vehicle tag after an optional bill fetch." },
  { href: "/services/lic", kind: "lic" as const, label: "LIC premium", blurb: "Fetch the premium on the policy number, then pay from the wallet." },
  { href: "/services/aeps", kind: "aeps" as const, label: "Aadhaar cash", blurb: "Thumb print on the machine. You give cash from the retailer counter." },
  { href: "/services/upi-cash-out", kind: "upi" as const, label: "UPI to cash", blurb: "Show a QR. Customer pays. You hand over notes after it is paid." },
  { href: "/services/agent-wallet", kind: "wallet" as const, label: "Retailer wallet", blurb: "Add money first. You cannot send more than the balance." },
  { href: "/services/fd-credit-cards", kind: "cards" as const, label: "FD cards", blurb: "You take the lead. Customer puts money from their own phone." },
  { href: "/services/bc-network", kind: "network" as const, label: "Retailer network", blurb: "Admin, distributor, retailer. Appointed — no public signup." },
];

export default function ServicesIndex() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
      <p className="text-sm font-medium text-brand-700">Services</p>
      <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-navy-950 sm:text-4xl">
        Everything you need to run banking from the retailer counter.
      </h1>
      <p className="mt-4 max-w-2xl text-navy-700">
        Send money, pay bills, recharge, give cash, keep a wallet, help with cards. Balance first. Every rupee is recorded.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {items.map((s) => (
          <Link key={s.href} href={s.href} className="overflow-hidden rounded-3xl border border-navy-900/10 bg-white hover:border-navy-900/20">
            <ServiceArt kind={s.kind} />
            <div className="p-6">
              <h2 className="font-display text-2xl text-navy-950">{s.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">{s.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
