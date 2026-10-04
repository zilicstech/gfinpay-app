import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Flame,
  Layers,
  Lock,
  PhoneCall,
  QrCode,
  Radio,
  Receipt,
  RotateCw,
  Scale,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: `All Banking Services, API Rails & B2B Commission Slabs — ${SITE.name}`,
  description:
    "Enterprise-grade banking rails and retail distribution services for fintech networks, corporate BCs, master distributors, and retail counters. AePS, DMT, BBPS, FD Credit Cards, UPI Cash-Out, and more.",
  path: "/services",
});

interface ServiceB2B {
  id: string;
  href: string;
  imageSrc: string;
  badge: string;
  title: string;
  subtitle: string;
  commissionTag: string;
  lead: string;
  points: { title: string; desc: string }[];
  metrics: { label: string; value: string }[];
  accentColor: string;
  badgeClass: string;
  category: string;
  slaTag: string;
}

const B2B_SERVICES: ServiceB2B[] = [
  {
    id: "dmt",
    href: "/services/domestic-money-transfer",
    imageSrc: "/illustrations/shop_dmt.jpg",
    category: "Instant Remittance Rail",
    badge: "24x7 IMPS Switch",
    slaTag: "Latency < 450ms",
    title: "Domestic Money Transfer (DMT) & Remittance Engine",
    subtitle: "High-Velocity Cash-to-Account Rail with Penny-Drop Beneficiary Validation",
    commissionTag: "Up to 0.50% Margin · Flat ₹25 to ₹75 / Txn",
    lead: "Empower your retail counters to convert unbanked and migrant cash into instant bank deposits across 120+ Indian banks. Engineered with direct multi-bank IMPS switching (SBI, ICICI, HDFC) and real-time penny-drop name verification to ensure zero misrouted transfers and near-zero failure rates.",
    points: [
      {
        title: "Direct Multi-Bank IMPS Routing",
        desc: "Automatic switch failover across top tier-1 sponsor banks ensures 99.98% peak-hour transaction success.",
      },
      {
        title: "Pre-Transfer Penny Drop Validation",
        desc: "Fetches the recipient's verified account holder name from the NPCI switch before debiting retail cash.",
      },
      {
        title: "Intelligent RBI Ceiling Compliance",
        desc: "Automated monthly ₹25,000 unverified limit tracking with instant customer e-KYC upgrade capabilities.",
      },
      {
        title: "Real-Time Reversal Safeguard",
        desc: "Instant auto-refunds on bank network timeouts — merchant wallet funds are never trapped in limbo.",
      },
    ],
    metrics: [
      { label: "Retailer Margin", value: "0.50% (₹25–₹75)" },
      { label: "Settlement Speed", value: "Instant T+0 IMPS" },
      { label: "Bank Coverage", value: "120+ Scheduled Banks" },
      { label: "Switch Availability", value: "99.98% 24x7x365" },
    ],
    accentColor: "emerald",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  {
    id: "aeps",
    href: "/services/aeps",
    imageSrc: "/illustrations/shop_aeps.jpg",
    category: "Micro-ATM Rail",
    badge: "Biometric Banking Point",
    slaTag: "NPCI AePS 2.0 Certified",
    title: "Aadhaar Micro-ATM (AePS) & Cash Withdrawal Switch",
    subtitle: "Interoperable Aadhaar Biometric Banking for Semi-Urban & Rural Footfall",
    commissionTag: "Up to ₹12.50 / Withdrawal + ₹1.50 Mini-Statement",
    lead: "Transform local retailers into full-service doorstep bank branches. Customers withdraw cash, check account balances, and fetch mini-statements using only their 12-digit Aadhaar number and biometric fingerprint. Cash dispensed to customers immediately replenishes digital wallet balances for money transfers.",
    points: [
      {
        title: "Direct NPCI AePS 2.0 Integration",
        desc: "Compliant with 2-factor authentication (2FA) daily merchant biometric login protocols.",
      },
      {
        title: "Full RD-Service Hardware Support",
        desc: "Plug-and-play driver support for Mantra, Morpho, SecuGen, and Startek USB/Bluetooth fingerprint scanners.",
      },
      {
        title: "Comprehensive Micro-Banking Suite",
        desc: "Cash Withdrawal, Balance Enquiry, 10-transaction Mini-Statement, and high-limit Aadhaar Pay.",
      },
      {
        title: "Counter Liquidity Recycling",
        desc: "Dispense physical cash from store sales while receiving equivalent digital wallet credit for remittances.",
      },
    ],
    metrics: [
      { label: "Commission Slab", value: "Flat ₹10–₹12.50 / Txn" },
      { label: "Mini Statement", value: "₹1.50 Extra per Inquiry" },
      { label: "Hardware", value: "All RD Scanners" },
      { label: "Settlement", value: "Real-time Wallet Credit" },
    ],
    accentColor: "indigo",
    badgeClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
  },
  {
    id: "bbps",
    href: "/services/bbps",
    imageSrc: "/illustrations/shop_bbps.jpg",
    category: "Utility Invoicing Engine",
    badge: "20,000+ Verified Billers",
    slaTag: "Sub-Second Bill Fetch",
    title: "Bharat Bill Payment System (BBPS) Collection Engine",
    subtitle: "Recurring Utility Invoicing & Instant NPCI Digital Payment Receipts",
    commissionTag: "₹5 to ₹25 / Bill + Monthly Volume Retainers",
    lead: "Capture recurring monthly footfalls by connecting your network directly to the RBI-conceptualized Bharat BillPay network. Retailers collect electricity, water, municipal tax, piped cooking gas, broadband, and credit card payments with instant consumer name lookup and legitimate digital receipts.",
    points: [
      {
        title: "20,000+ Unified Billers Pan-India",
        desc: "Live coverage for all State Electricity Boards, Municipal Corporations, Gas Distribution, and DTH providers.",
      },
      {
        title: "Instant Consumer Bill Fetching",
        desc: "Enter consumer number to fetch real-time bill amount, due dates, customer name, and late payment penalties.",
      },
      {
        title: "NPCI Compliant Digital Receipts",
        desc: "Generates tamper-proof digital receipts bearing the official BBPS Biller Reference Number and NPCI ID.",
      },
      {
        title: "Standardized Dispute Resolution",
        desc: "Built-in BBPS Complaint Management Unit ensures automatic tracking and quick turnaround for bill adjustments.",
      },
    ],
    metrics: [
      { label: "Earnings per Bill", value: "₹5 to ₹25 + Slabs" },
      { label: "Biller Network", value: "20,000+ Pan-India" },
      { label: "Receipt Validity", value: "100% NPCI Legal Proof" },
      { label: "Compliance", value: "RBI & NPCI Authorized" },
    ],
    accentColor: "amber",
    badgeClass: "bg-amber-500/10 text-amber-800 border-amber-500/30",
  },
  {
    id: "cards",
    href: "/services/fd-credit-cards",
    imageSrc: "/illustrations/shop_cards.jpg",
    category: "Secured Credit Rail",
    badge: "100% Digital Approvals",
    slaTag: "SBM · IOB · DCB Banks",
    title: "FD-Backed Credit Cards & Co-Branded Bank Lending",
    subtitle: "Zero-Custody High-Ticket Financial Products Powered by ZET & NOVU",
    commissionTag: "₹800 to ₹2,900 / Activated Card Referral",
    lead: "Unlock the highest profit margins in retail fintech by issuing fixed-deposit backed credit cards from premier scheduled banks (SBM Bank, Indian Overseas Bank, and DCB Bank). Zero CIBIL score required, zero underwriting rejection, zero paperwork, and zero retailer cash custody risk.",
    points: [
      {
        title: "100% Guaranteed Approval",
        desc: "Credit card limit directly mirrors the customer's own fixed deposit. No income proof or credit score needed.",
      },
      {
        title: "Zero Retailer Cash Handling",
        desc: "Customers fund the fixed deposit digitally from their own phone and bank account. Retailers handle zero cash risk.",
      },
      {
        title: "Official Institutional Rails",
        desc: "Direct partnerships with regulated scheduled commercial banks: SBM Bank, IOB, and DCB Bank.",
      },
      {
        title: "Unmatched High-Ticket Payouts",
        desc: "Earn institutional referral commissions from ₹800 up to ₹2,900 per issued card upon successful activation.",
      },
    ],
    metrics: [
      { label: "Distributor Payout", value: "₹800 – ₹2,900 / Card" },
      { label: "Credit Requirement", value: "Zero (No CIBIL needed)" },
      { label: "Bank Partners", value: "SBM, IOB, DCB Bank" },
      { label: "Turnaround Time", value: "5-Minute Digital Flow" },
    ],
    accentColor: "indigo",
    badgeClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
  },
  {
    id: "recharge",
    href: "/services/recharge",
    imageSrc: "/illustrations/shop_recharge.jpg",
    category: "Telecom & DTH Switch",
    badge: "99.99% Telecom Switch SLA",
    slaTag: "Latency < 600ms",
    title: "High-Margin Mobile & DTH Multi-Operator Recharge Switch",
    subtitle: "Sub-Second Top-Ups Across All Circles with Intelligent R-Offer Discovery",
    commissionTag: "Up to 3.80% Instant Commission Slabs",
    lead: "Equip your retailer network with ultra-fast mobile and satellite TV recharges backed by high-throughput operator switches. Built-in intelligent mobile number portability (MNP) circle detection eliminates failed recharges, while real-time R-Offer plan fetching boosts transaction ticket size.",
    points: [
      {
        title: "All Major Telecom & DTH Operators",
        desc: "Direct switching for Jio, Airtel, Vi, BSNL, Tata Play, Airtel DTH, Sun Direct, and Dish TV.",
      },
      {
        title: "Ported Number Auto-Detection",
        desc: "Auto-identifies MNP ported numbers and active operator circle instantly without asking the customer.",
      },
      {
        title: "Live Personalized R-Offer Engine",
        desc: "Queries the telecom operator's billing switch in real-time to surface exclusive customer plan offers.",
      },
      {
        title: "Unmatched Real-Time Margins",
        desc: "Industry-leading margins up to 3.8% credited instantly to retailer wallets with zero deductions.",
      },
    ],
    metrics: [
      { label: "Operator Margin", value: "Up to 3.80% Instant" },
      { label: "Execution Speed", value: "Sub-Second (< 600ms)" },
      { label: "Plan Engine", value: "Live R-Offer API" },
      { label: "Coverage", value: "All 22 Telecom Circles" },
    ],
    accentColor: "indigo",
    badgeClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
  },
  {
    id: "upi",
    href: "/services/upi-cash-out",
    imageSrc: "/illustrations/shop_upi.jpg",
    category: "Digital Cash Terminal",
    badge: "Zero Hardware Rental",
    slaTag: "Dynamic Fraud-Proof QR",
    title: "UPI Dynamic QR Cash-Out & Cash Disbursement",
    subtitle: "Turn Every Smartphone into a Digital ATM Without POS Machine Costs",
    commissionTag: "0.40% Instant Margin on Dispensed Cash",
    lead: "Capitalize on India's booming UPI adoption. Customers scan a dynamic QR code generated on the retailer's smartphone or PC using PhonePe, Google Pay, or Paytm. Once verified with green-tick audio-visual confirmation, the retailer hands over cash and earns an immediate margin.",
    points: [
      {
        title: "Zero Hardware Machine Capex",
        desc: "No expensive POS terminal rentals, SIM data packs, or thermal paper rolls. Operates entirely in browser.",
      },
      {
        title: "Interoperable with Any UPI App",
        desc: "Accepts payments seamlessly from Google Pay, PhonePe, Paytm, CRED, BHIM, and bank mobile apps.",
      },
      {
        title: "Single-Use Dynamic QR Security",
        desc: "Generates an exact-amount, timestamped dynamic QR code to prevent customer fraud and payment misattribution.",
      },
      {
        title: "Excess Cash Drainage Solution",
        desc: "Provides kiranas and retail stores a safe, profitable channel to offload excess daily sales cash without bank visits.",
      },
    ],
    metrics: [
      { label: "Retailer Margin", value: "0.40% Instant Margin" },
      { label: "Hardware Cost", value: "₹0 (Zero Terminal Capex)" },
      { label: "Payment Apps", value: "GPay, PhonePe, Paytm" },
      { label: "Settlement", value: "Instant Wallet Liquidity" },
    ],
    accentColor: "emerald",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  {
    id: "fastag",
    href: "/services/fastag",
    imageSrc: "/illustrations/shop_fastag.jpg",
    category: "National Tollway Rail",
    badge: "NETC Toll Switch",
    slaTag: "60-Second Blacklist Clear",
    title: "FASTag National Tollway Top-Up & Vehicle Registry",
    subtitle: "Real-Time NETC Switch Integration for Highway Transit Hubs",
    commissionTag: "0.25% to 0.50% Instant Margin",
    lead: "Serve commercial fleet operators, transporters, and private car owners at transit locations. Direct integration with the National Electronic Toll Collection (NETC) switch allows retailers to input vehicle registration numbers, auto-fetch issuing banks and toll balances, and clear toll barrier blacklists in 60 seconds.",
    points: [
      {
        title: "All 34+ NETC Member Banks",
        desc: "Unified recharge rail for FASTags issued by ICICI Bank, SBI, Paytm Payments Bank, HDFC, IDFC First, and Axis.",
      },
      {
        title: "Vehicle Registration Auto-Lookup",
        desc: "Instant search by vehicle registration number retrieves issuing bank, customer name, and tag balance.",
      },
      {
        title: "Rapid Blacklist Clearance",
        desc: "Successful recharges sync with toll plaza lane readers within 60 seconds to prevent highway delays.",
      },
      {
        title: "Fleet Logistics Partnering",
        desc: "Equip highway dhaba and fuel kiosk retailers to handle recurring bulk fleet balance top-ups.",
      },
    ],
    metrics: [
      { label: "Top-up Margin", value: "0.25% – 0.50% Instant" },
      { label: "Barrier Sync", value: "< 60 Seconds Clearance" },
      { label: "Issuing Banks", value: "All 34+ NETC Banks" },
      { label: "Search Mechanism", value: "Instant Vehicle Reg No" },
    ],
    accentColor: "amber",
    badgeClass: "bg-amber-500/10 text-amber-800 border-amber-500/30",
  },
  {
    id: "lic",
    href: "/services/lic",
    imageSrc: "/illustrations/shop_lic.jpg",
    category: "Life Insurance Portal",
    badge: "Official LIC Connectivity",
    slaTag: "Valid Tax 80C Invoicing",
    title: "LIC Policy & Micro-Insurance Premium Collection",
    subtitle: "Direct Life Insurance Corporation Portal Sync with Official Tax Proofs",
    commissionTag: "₹15 to ₹45 / Policy Collected",
    lead: "Capture large-ticket insurance collections for the country's most trusted financial brand. Direct connectivity with Life Insurance Corporation of India (LIC) enables real-time policy verification, installment calculation including late fees, and instantaneous delivery of valid tax-exemption receipts.",
    points: [
      {
        title: "Direct LIC Central Host Access",
        desc: "Live query system checks policy status, pending premium installments, grace periods, and late penalties.",
      },
      {
        title: "Section 80C Tax Exemption Receipts",
        desc: "Generates official, tamper-evident digital receipts acceptable by chartered accountants and tax authorities.",
      },
      {
        title: "High Average Transaction Value",
        desc: "Higher policy ticket sizes (₹3,000–₹25,000) deliver substantial absolute commission earnings per customer.",
      },
      {
        title: "Customer Trust & Loyalty",
        desc: "Positions your retail partner as an authorized neighborhood financial desk, driving high cross-sell retention.",
      },
    ],
    metrics: [
      { label: "Policy Payout", value: "₹15 to ₹45 / Receipt" },
      { label: "Tax Exemption", value: "100% IT Act 80C Compliant" },
      { label: "Integration", value: "Direct LIC Central Host" },
      { label: "Turnaround", value: "Instant Receipt Issuance" },
    ],
    accentColor: "amber",
    badgeClass: "bg-amber-500/10 text-amber-800 border-amber-500/30",
  },
];

export default function ServicesIndex() {
  return (
    <div className="space-y-16 sm:space-y-24 py-10 sm:py-16 bg-slate-50/50">
      {/* Hero Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>B2B Banking Rails & Distribution Network</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-950 leading-tight">
            Enterprise Banking Rails for Retail & Corporate Distribution
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Deploy certified banking, utility, credit, and cash collection APIs with industry-leading commercial slabs,
            sub-second latency, and automated T+0 settlements.
          </p>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch SLA</p>
              <p className="mt-0.5 text-base sm:text-lg font-black text-navy-950">99.98% Uptime</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Multi-Bank Failover</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regulatory</p>
              <p className="mt-0.5 text-base sm:text-lg font-black text-navy-950">NPCI & BBPS</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Certified Host</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settlement</p>
              <p className="mt-0.5 text-base sm:text-lg font-black text-navy-950">Instant T+0</p>
              <p className="text-[11px] text-emerald-600 font-semibold">24x7 IMPS Payouts</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hardware</p>
              <p className="mt-0.5 text-base sm:text-lg font-black text-navy-950">Zero Capex</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Runs on Any Phone</p>
            </div>
          </div>
        </div>

        {/* Quick Nav Anchors */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 pt-2">
          {B2B_SERVICES.map((s) => (
            <a
              key={s.id}
              href={`#service-${s.id}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all shadow-xs"
            >
              {s.badge}
            </a>
          ))}
        </div>
      </section>

      {/* Dedicated Rows for Each Service */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {B2B_SERVICES.map((s, index) => {
          const isReversed = index % 2 !== 0;

          return (
            <article
              key={s.id}
              id={`service-${s.id}`}
              className="scroll-mt-24 group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-card transition-all duration-300 hover:border-emerald-500/40 hover:shadow-card-hover"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Image Showcase Column */}
                <div className={`lg:col-span-5 ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md">
                    {/* Visual Art Aspect Box */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-tr from-slate-100 via-slate-50 to-slate-200">
                      <img
                        src={s.imageSrc}
                        alt={s.title}
                        className="h-full w-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Top Overlay Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-navy-800/40 bg-navy-950/85 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{s.badge}</span>
                      </div>

                      {/* Top Right SLA Pill */}
                      <div className="absolute top-3 right-3 rounded-full border border-white/20 bg-white/90 px-2.5 py-0.5 text-[10px] font-mono font-bold text-navy-950 shadow-sm backdrop-blur-md">
                        {s.slaTag}
                      </div>

                      {/* Floating Bottom Commission Banner */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-white/95 p-2.5 shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700">
                            <Coins className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Commercial Margin</p>
                            <p className="text-xs font-black text-emerald-800">{s.commissionTag}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B2B Content Column */}
                <div className={`lg:col-span-7 space-y-6 ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${s.badgeClass}`}>
                        <Sparkles className="h-3 w-3" />
                        <span>{s.category}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-400">· {s.subtitle}</span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight leading-tight">
                      {s.title}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-1">
                      {s.lead}
                    </p>
                  </div>

                  {/* 4 B2B Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {s.points.map((pt) => (
                      <div
                        key={pt.title}
                        className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3.5 hover:bg-white hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-navy-950">{pt.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{pt.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Commercial Specifications Micro-Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-100/50 p-3 text-left">
                    {s.metrics.map((m) => (
                      <div key={m.label} className="px-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                        <p className="text-xs font-black text-navy-950 truncate mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action CTAs */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      href={s.href}
                      className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <span>Explore Technical Specs & APIs</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <Link
                      href="/contact"
                      className="btn-secondary !py-2.5 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <span>Inquire as Distributor</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Enterprise Infrastructure Advantages (B2B Authority Block) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-card">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="d2c-badge">
              <Server className="h-3.5 w-3.5 text-brand-600" />
              <span>Architected for Scale</span>
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-navy-950">
              Why Corporate Networks & Master Distributors Run on Gfinpay
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Reliability is the single biggest factor in retail retention. We deliver zero-compromise institutional infrastructure.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 space-y-2.5 transition-all duration-300 hover:shadow-lg hover:border-emerald-500/30 hover:bg-white">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-navy-950">Automated Multi-Tier Splitting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Appoint regional distributors and super agents with automatic commission cascading. When a retailer completes a service, margins split instantly down the hierarchy.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 space-y-2.5 transition-all duration-300 hover:shadow-lg hover:border-emerald-500/30 hover:bg-white">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-navy-950">Zero-Drift Double-Entry Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every rupee is tracked across double-entry ledgers. Automatic timeout reconciliation prevents phantom debits and eliminates painful manual reconciliations.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 space-y-2.5 transition-all duration-300 hover:shadow-lg hover:border-emerald-500/30 hover:bg-white">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-navy-950">100% Cashless Zero Custody</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Retailers never touch customer card deposits or lending principal. Direct digital banking rails ensure your business carries zero credit default liability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fast Action B2B Conversion Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3 w-3" />
              <span>Partner as a Master Distributor</span>
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black">
              Ready to Scale Your Regional FinTech Distribution?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Equip hundreds of store counters with certified banking terminals. Enjoy high-volume slabs, white-label options, and dedicated account managers.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
            <Link
              href="/contact"
              className="btn-primary !px-7 !py-3.5 text-sm font-bold shadow-lg shadow-emerald-500/25"
            >
              <span>Contact Sales</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
