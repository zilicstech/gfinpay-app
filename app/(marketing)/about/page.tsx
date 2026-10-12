import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Landmark,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: `About ${SITE.name} — Empowering India's Retailers as Banking Hubs`,
  description:
    "Learn about GATEWAYLINE FINTECH PRIVATE LIMITED. Our mission is to transform neighborhood Kirana stores into institutional-grade assisted banking points.",
  path: "/about",
});

const HUBS = [
  { city: "Kolkata", state: "West Bengal", role: "Registered Headquarters & Regional Operations" },
  { city: "Mumbai", state: "Maharashtra", role: "Financial Rails & Sponsor Bank Integration" },
  { city: "Bengaluru", state: "Karnataka", role: "Technology Platform & Switch Engineering" },
  { city: "Hyderabad", state: "Telangana", role: "Distributor Network & Operations" },
];

const VALUES = [
  {
    icon: Scale,
    title: "Double-Entry Ledger Integrity",
    desc: "Every paisa is tracked with an immutable double-entry journal. We never allow mutations or retroactive adjustments. Either money balanced, or the transaction never happened.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Direct Custody Risk",
    desc: "End-customers never hold balances on Gfinpay. Regulated banks hold deposits, card issuance follows RBI KYC, and the retailer wallet is purely pre-funded operational float.",
  },
  {
    icon: HeartHandshake,
    title: "Empowering Neighbourhood Trust",
    desc: "India still trusts local Kirana shopkeepers more than faceless apps. We arm that trusted merchant with modern digital rails to serve their community with dignity.",
  },
  {
    icon: Users,
    title: "Instant Ledger Equity",
    desc: "No end-of-month waiting or opaque clawbacks. Retailers and distributors benefit from instant, transparent ledger settlements the very second a transaction completes.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-24 sm:space-y-32 py-12 sm:py-16">
      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <span className="d2c-badge">
            <Building2 className="h-3.5 w-3.5 text-brand-600" />
            <span>Company Profile</span>
          </span>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-950 leading-tight">
            Built for the merchant people already trust.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {SITE.name} exists because hundreds of millions of Indian citizens still transact in cash at their local neighborhood store. We empower that Kirana store to become a full-service banking outlet.
          </p>
        </div>
      </section>

      {/* Origin Story & Entity Details */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-14 shadow-xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
                Bridging Cash India and Digital Banking Rails
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Most consumer fintech apps assume the customer has a smartphone, seamless internet, high literacy, and a pre-existing active bank balance. But across Tier 2, Tier 3, and rural India, walk-in customers carry paper currency to pay electricity bills, send family remittances, and fund fixed deposits.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                We built {SITE.name} as an <strong>Assisted Banking / Corporate Business Correspondent (BC) Platform</strong>. We provide retail agents with a streamlined, lightning-fast terminal. The retail agent collects cash, executes the digital transaction on the spot, and hands the customer an official proof of payment.
              </p>
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-xs text-emerald-900 leading-relaxed font-medium">
                <strong>Legal Identity:</strong> {SITE.legalName} is incorporated under the Companies Act, 2013 (CIN: <span className="font-mono font-bold">{SITE.cin}</span>). Operating with strict adherence to RBI Business Correspondent Master Directions.
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-navy-950 p-7 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Our Network Footprint</span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">Target Kirana Partners</p>
                    <p className="font-display text-3xl font-extrabold text-white">500,000+</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Supported Financial Products</p>
                    <p className="font-display text-3xl font-extrabold text-emerald-400">100+ BBPS & Banking Rails</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Settlement Architecture</p>
                    <p className="font-display text-xl font-bold text-white">Real-Time Double-Entry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="d2c-badge">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>Guiding Principles</span>
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-950">
            How we engineer reliability.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-emerald-600 mb-4 ring-1 ring-inset ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                  <Icon className="h-6 w-6 transition-colors duration-300" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-950">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Regional Operations & Hubs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="d2c-badge">
            <MapPin className="h-3.5 w-3.5 text-brand-600" />
            <span>Pan-India Presence</span>
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-950">
            Regional operations hubs.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HUBS.map((hub) => (
            <div
              key={hub.city}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-500/30 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-xl font-bold text-navy-950">{hub.city}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {hub.state}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{hub.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-navy-950 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Partner with GATEWAYLINE FINTECH</h2>
            <p className="mt-2 text-sm text-slate-400">Join our rapidly growing network of master distributors and financial switches.</p>
          </div>
          <Link href="/contact" className="btn-primary !px-7 !py-3.5 shrink-0">
            <span>Speak to Partnerships</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
