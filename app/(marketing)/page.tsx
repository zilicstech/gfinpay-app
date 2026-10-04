import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Coins,
  CreditCard,
  Fingerprint,
  HelpCircle,
  Landmark,
  Layers,
  PhoneCall,
  QrCode,
  Radio,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Tv,
  Users,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { HomeFaq } from "@/features/marketing/HomeFaq";
import { ServiceArt } from "@/components/illustrations/HomeArt";
import { SITE } from "@/lib/site";
import { seo } from "@/lib/seo";

export const metadata = seo({
  title: `${SITE.name} — Turn your shop into a digital bank | Digital Banking & Bill Payments for Retailers`,
  description:
    "Turn your store into an assisted banking powerhouse. Offer Domestic Money Transfer, BBPS bill payments, UPI cash-out, and high-commission FD credit cards.",
  path: "/",
});

const VISUAL_SERVICES = [
  {
    href: "/services/domestic-money-transfer",
    kind: "dmt" as const,
    title: "Money Transfer (DMT)",
    commission: "Earnings: 0.50% (₹25 - ₹75 / transfer)",
    badge: "Highest Demand",
    desc: "Customer brings cash. Send money instantly to any bank account over 24x7 IMPS.",
    points: ["All 120+ Indian Banks", "Instant Name Verification"],
    accent: "emerald",
  },
  {
    href: "/services/bbps",
    kind: "bbps" as const,
    title: "BBPS Bill Payments",
    commission: "Earnings: ₹5 to ₹20 per bill",
    badge: "Daily Income",
    desc: "Collect electricity, water, gas, broadband, and municipal bills for your neighborhood.",
    points: ["100+ State Discoms", "Official NPCI Receipt"],
    accent: "amber",
  },
  {
    href: "/services/aeps",
    kind: "aeps" as const,
    title: "Aadhaar ATM (AePS)",
    commission: "Earnings: Flat ₹10 per withdrawal",
    badge: "No ATM Card Needed",
    desc: "Customer scans thumb on biometric scanner to withdraw cash directly from their bank.",
    points: ["Mantra & Morpho Support", "Mini Statement Income"],
    accent: "emerald",
  },
  {
    href: "/services/recharge",
    kind: "recharge" as const,
    title: "Mobile & DTH Recharge",
    commission: "Earnings: Up to 3.5% Instant",
    badge: "High Speed",
    desc: "Prepaid mobile and DTH TV recharges with personalized customer R-offer plans.",
    points: ["Jio, Airtel, Vi, BSNL", "Tata Play & Dish TV"],
    accent: "indigo",
  },
  {
    href: "/services/upi-cash-out",
    kind: "upi" as const,
    title: "UPI to Cash Out",
    commission: "Earnings: 0.40% Instant Margin",
    badge: "No Machine Needed",
    desc: "Customer scans dynamic QR from your phone screen. Hand over cash once confirmed.",
    points: ["PhonePe, GPay, Paytm", "Instant Wallet Settlement"],
    accent: "emerald",
  },
  {
    href: "/services/fd-credit-cards",
    kind: "cards" as const,
    title: "FD Credit Cards & Loans",
    commission: "Earnings: ₹800 to ₹2,900 / card",
    badge: "Highest Profit",
    desc: "Help customers apply for guaranteed FD credit cards and personal loans on their phone.",
    points: ["Zero CIBIL Score Needed", "100% Paperless Approval"],
    accent: "indigo",
  },
  {
    href: "/services/fastag",
    kind: "fastag" as const,
    title: "FASTag Toll Recharge",
    commission: "Earnings: 0.25% - 0.50% Margin",
    badge: "Vehicle Number Based",
    desc: "Type vehicle number, check current toll balance, and recharge in 30 seconds.",
    points: ["All NETC Issuer Banks", "Instant Plaza Clearance"],
    accent: "amber",
  },
  {
    href: "/services/lic",
    kind: "lic" as const,
    title: "LIC Insurance Premium",
    commission: "Earnings: ₹15 to ₹45 per policy",
    badge: "Official Receipt",
    desc: "Enter policy number, fetch exact due amount, and print official LIC tax receipt.",
    points: ["Live Due Date Fetch", "Official Tax Exemption Slip"],
    accent: "amber",
  },
];

const FD_PARTNER_BANKS = [
  {
    name: "SBM Bank",
    fullName: "State Bank of Mauritius",
    code: "SBM / SECURED",
    gradient: "from-slate-950 via-navy-900 to-indigo-950",
    glowColor: "from-indigo-500/20",
    badge: "100% Approval",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    last4: "8824",
    cardholder: "PREMIUM CUSTOMER",
    feature: "Zero CIBIL · Real-time Virtual Issuance",
    earning: "Earn ₹800 - ₹2,900 / card",
  },
  {
    name: "IOB",
    fullName: "Indian Overseas Bank",
    code: "IOB / SECURED",
    gradient: "from-emerald-950 via-teal-950 to-slate-950",
    glowColor: "from-emerald-500/20",
    badge: "High Interest FD",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    last4: "4190",
    cardholder: "COUNTER ASSISTED",
    feature: "Earn up to 7.5% p.a. on FD Deposit",
    earning: "Earn ₹800 - ₹2,500 / card",
  },
  {
    name: "DCB Bank",
    fullName: "Development Credit Bank",
    code: "DCB / SECURED",
    gradient: "from-slate-950 via-purple-950 to-navy-950",
    glowColor: "from-purple-500/20",
    badge: "Instant Active",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    last4: "6532",
    cardholder: "PREFERRED MEMBER",
    feature: "Guaranteed Credit Limit from ₹5,000",
    earning: "Earn ₹800 - ₹2,900 / card",
  },
];

const STEPS = [
  {
    step: "01",
    title: "1. Customer Walks In",
    subtitle: "Customer Walks In",
    desc: "Customer brings cash for a money transfer, an electricity bill, or wants to withdraw cash with thumb.",
    icon: Users,
  },
  {
    step: "02",
    title: "2. Enter on Mobile",
    subtitle: "Enter on Mobile",
    desc: "Type customer phone number, verify recipient name or fetch bill amount on your mobile screen in 30 seconds.",
    icon: Smartphone,
  },
  {
    step: "03",
    title: "3. Instant Profit",
    subtitle: "Instant Profit",
    desc: "Customer gets instant printed or WhatsApp receipt. Your commission is credited to your wallet in 5 seconds.",
    icon: Coins,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-full max-w-7xl bg-gradient-to-b from-emerald-500/12 via-teal-500/6 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="text-left space-y-7 lg:pr-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trusted Banking Platform for Retailers</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-950 leading-[1.15]">
                Turn your shop into a{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                  Digital Bank & ATM
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-lg">
                Money transfers, bill payments, Aadhaar cash withdrawals, mobile recharges, and credit cards.{" "}
                <strong className="text-emerald-700 font-bold">Earn up to ₹35,000+ extra income monthly</strong> without any expensive machine costs.
              </p>

              {/* Visual Chips */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 text-emerald-800">
                  <Coins className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Instant Earning</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-slate-800">
                  <Smartphone className="h-3.5 w-3.5 text-slate-600" />
                  <span>No Machine Needed</span>
                </span>
              </div>

              {/* Counters Card */}
              <div className="pt-4 max-w-sm">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
                  <div className="grid grid-cols-2 divide-x divide-slate-200 text-center">
                    <div className="px-4">
                      <p className="font-display text-3xl font-black tracking-tight text-navy-950">
                        28+
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        States
                      </p>
                    </div>
                    <div className="px-4">
                      <p className="font-display text-3xl font-black tracking-tight text-emerald-600">
                        300+
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Retailers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Collage */}
            <div className="relative w-full max-w-lg lg:max-w-none mx-auto lg:ml-auto mt-12 lg:mt-0">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-12">
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-4 border-white group">
                    <img src="/hero/collage1.jpg" alt="Money Transfer" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-1">
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[10px] sm:text-xs font-bold text-navy-950">DMT</span>
                    </div>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-4 border-white group">
                    <img src="/hero/collage2.jpg" alt="Bill Payments" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-1">
                      <Receipt className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] sm:text-xs font-bold text-navy-950">Bill Payment</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-4 border-white group">
                    <img src="/hero/collage3.jpg" alt="Credit Cards" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-1">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="text-[10px] sm:text-xs font-bold text-navy-950">Credit Card</span>
                    </div>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-4 border-white group">
                    <img src="/hero/collage4.jpg" alt="AePS ATM" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-1">
                      <Fingerprint className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] sm:text-xs font-bold text-navy-950">AePS ATM</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-400/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFICIAL RAIL INTEGRATIONS - FD CARD PARTNERING BANKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-100/80 relative">
          {/* Subtle background ambient light */}
          <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="d2c-badge">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>Official Rail Integrations</span>
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-navy-950">
              FD Card Partnering Banks
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Guaranteed approval credit cards backed by fixed deposits. Customers build credit score while retailers earn up to ₹2,900 per card.
            </p>
          </div>

          {/* 3 Bank Credit Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {FD_PARTNER_BANKS.map((b) => (
              <div
                key={b.name}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-tr ${b.gradient} p-6 sm:p-7 text-white shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald-500/10 border border-white/10`}
              >
                {/* Glow layer */}
                <div className={`absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-bl ${b.glowColor} to-transparent blur-2xl pointer-events-none`} />

                {/* Top: Bank Logo & Contactless */}
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Partner Bank
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white">
                      {b.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">{b.fullName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${b.badgeColor}`}>
                      {b.badge}
                    </span>
                    <Wifi className="h-4 w-4 text-white/50 rotate-90" />
                  </div>
                </div>

                {/* Chip & Bank Code */}
                <div className="relative z-10 my-6 flex items-center justify-between">
                  {/* EMV Metallic Chip Graphic */}
                  <div className="relative h-9 w-12 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 shadow-inner border border-amber-600/40">
                    <div className="h-full w-full rounded border border-amber-700/30 grid grid-cols-2 gap-0.5 opacity-60">
                      <div className="border-r border-b border-amber-800/40" />
                      <div className="border-b border-amber-800/40" />
                      <div className="border-r border-amber-800/40" />
                      <div />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                    {b.code}
                  </span>
                </div>

                {/* Card Number & Holder */}
                <div className="relative z-10 space-y-3">
                  <p className="font-mono text-base sm:text-lg tracking-widest text-slate-200 font-semibold">
                    •••• •••• •••• {b.last4}
                  </p>
                  <div className="flex items-end justify-between text-[11px] text-slate-400 pt-1">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">Cardholder</p>
                      <p className="font-medium text-slate-200 uppercase tracking-wide">{b.cardholder}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm italic tracking-tight text-white/90">RuPay</span>
                    </div>
                  </div>
                </div>

                {/* Feature & Commission Bar */}
                <div className="relative z-10 mt-6 pt-4 border-t border-white/10 space-y-1.5">
                  <p className="text-xs text-slate-300 font-medium">{b.feature}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Retailer Margin:</span>
                    <span className="text-emerald-400 font-bold">{b.earning}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Powered by ZET & NOVU Footer Banner */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/90 p-4 sm:p-5 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Direct Switch Rails:
              </span>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-slate-200">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Powered by</span>
                <span className="font-extrabold text-navy-950">ZET</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-slate-200">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-slate-600">Powered by</span>
                <span className="font-extrabold text-navy-950">NOVU</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Instant Paperless KYC · Automated Wallet Commission</span>
            </div>
          </div>
        </div>
      </section>

      {/* VISUAL SERVICES SHOWCASE - 8 RICH CARDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
          <span className="d2c-badge">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>All 8 Core Services</span>
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-navy-950">
            A service for every customer, profit on every transaction
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Select any service to view commission rates and start transacting on your counter.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {VISUAL_SERVICES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-card-hover"
            >
              {/* Illustration Showcase */}
              <div className="relative overflow-hidden bg-slate-100 min-h-[220px] sm:min-h-[280px] w-full aspect-[16/10] sm:aspect-video">
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <ServiceArt kind={s.kind} />
                </div>
                <span className="absolute top-4 right-4 rounded-full bg-white/95 border border-slate-200/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-xs">
                  {s.badge}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-navy-950 group-hover:text-emerald-700 transition">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>

                {/* Highlighted Commission Tag */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs sm:text-sm font-black text-emerald-800 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{s.commission}</span>
                </div>

                {/* Bullet Points */}
                <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{pt}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
                  <span>Explore Service & Commission Rates</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3-STEP TIMELINE WORKFLOW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="d2c-badge">
            <Zap className="h-3.5 w-3.5 text-brand-600" />
            <span>3 Easy Steps</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Takes only 30 to 60 seconds per walk-in customer. Simple and error-free.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-black text-emerald-500/20">{step.step}</span>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-navy-950">{step.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FREE MARKETING & BRANDING KIT SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-950 p-6 sm:p-10 lg:p-12 text-white relative shadow-2xl">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
              <Store className="h-3.5 w-3.5" />
              <span>Free Store Kit</span>
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Free Banners, Standees, and Marketing Material
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Every onboarded retailer receives free storefront marketing materials: A shop banner, table standee with dynamic QR, and WhatsApp promotional posters to attract local customers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold text-white text-sm">Flex Banner</p>
                <p className="text-xs text-slate-400 mt-1">High footfall attraction for passing customers.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold text-white text-sm">QR Standee</p>
                <p className="text-xs text-slate-400 mt-1">Easy cash-out scan on your counter till.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM PERSONAS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="d2c-badge">
            <Users className="h-3.5 w-3.5 text-brand-600" />
            <span>Tailored for Every Partner</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
            Tailored Consoles for Every Role
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Kirana Retailer */}
          <Link
            href="/login"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Kirana Store Retailer</p>
              <h3 className="mt-1 font-display text-lg font-bold text-navy-950">Retailer App</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Phone on counter, wallet pre-funded. Send money, pay bills, and dispense cash. Zero dead stock.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>Explore Retailer Desk →</span>
            </span>
          </Link>

          {/* Master Distributor */}
          <Link
            href="/contact"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Layers className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Master Distributor</p>
              <h3 className="mt-1 font-display text-lg font-bold text-navy-950">Distributor Network</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Onboard retailers in your city or district. Monitor network volume and earn automated split commission.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <span>Explore Distributor Network →</span>
            </span>
          </Link>

          {/* Corporate & Vendors */}
          <Link
            href="/contact"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-card hover:-translate-y-1 hover:border-slate-400 hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-800 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Corporate & Vendors</p>
              <h3 className="mt-1 font-display text-lg font-bold text-navy-950">Corporate & Vendors</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Connect your card issuing, lending, or DMT rails to a verified physical distribution network.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Explore Corporate & Vendors →</span>
            </span>
          </Link>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="d2c-badge">
            <HelpCircle className="h-3.5 w-3.5 text-brand-600" />
            <span>FAQs</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
            Frequently Asked Questions
          </h2>
        </div>

        <HomeFaq />
      </section>

      {/* FINAL FAST ACTION BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-950 p-6 sm:p-12 text-white relative shadow-2xl">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Start Today
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Transform your shop into a modern digital bank
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Login to your counter terminal or contact our regional onboarding manager to activate services.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login"
                className="btn-primary !px-7 !py-3.5 text-sm font-bold shadow-xl shadow-emerald-500/30"
              >
                <span>Retailer Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20 !px-6 !py-3.5 text-sm font-bold"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Call Us (1800 890 4040)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
