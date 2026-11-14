"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  Landmark,
  Layers,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const LOAN_PORTAL_URL = "https://loans.gfinpay.com/login";

const LOAN_PRODUCTS = [
  {
    id: "regular-term",
    badge: "Flagship · Working Capital",
    badgeTone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    title: "Regular Term Micro-Loan",
    subtitle: "45-Day Working Capital for Shopkeepers, GeM Vendors & Salaried Borrowers",
    amountRange: "₹5,000 – ₹1,00,000",
    firstCycleNote: "₹30,000 – ₹35,000 cap in Cycle 1",
    tenure: "45 Days",
    tenureNote: "Target Early Closure: Day 43",
    interestRate: "3.0% / month",
    interestNote: "4.5% for full 45-day cycle",
    processingFee: "2.0% upfront",
    repaymentMode: "Bullet or structured installment via UPI, e-NACH, or Loan Portal",
    icon: Store,
    accentBorder: "hover:border-emerald-400",
    highlights: [
      "Designed for inventory restocking, supplier payments, and government/GeM order fulfillment",
      "Close on or before Day 43 with zero penal charges to unlock your next credit limit tier",
      "Transparent Key Fact Statement (KFS) in your preferred regional language before e-Sign",
    ],
  },
  {
    id: "group-loan",
    badge: "Market Clusters & Trade Groups",
    badgeTone: "bg-sky-50 text-sky-800 border-sky-200",
    title: "Micro-Business Group Loan",
    subtitle: "Joint Liability & Market Cluster Lending for High-Footfall Local Traders",
    amountRange: "₹10,000 – ₹50,000",
    firstCycleNote: "Per eligible group member",
    tenure: "30 to 45 Days",
    tenureNote: "Daily or Weekly collection cycle",
    interestRate: "1.0% / day",
    interestNote: "Accrued on active cycle days",
    processingFee: "2.0% upfront",
    repaymentMode: "Daily or weekly digital UPI QR collection or assisted field pickup",
    icon: Users,
    accentBorder: "hover:border-sky-400",
    highlights: [
      "Ideal for kirana, medical, hardware, agri-input, and local market association merchants",
      "Match repayments effortlessly with your daily counter sales and UPI QR collections",
      "Assisted doorstep onboarding and digital BharatQR reconciliation by Gfinpay field officers",
    ],
  },
  {
    id: "payday-bridge",
    badge: "Short-Term Liquidity Bridge",
    badgeTone: "bg-amber-50 text-amber-900 border-amber-200",
    title: "Flexible Pay-Day / Bridge Loan",
    subtitle: "Ultra-Fast 10 to 30 Day Bridge Credit for Daily Retailers & Salaried Staff",
    amountRange: "₹5,000 – ₹35,000",
    firstCycleNote: "Instant short-tenure bridge",
    tenure: "10 to 30 Days",
    tenureNote: "Flexible repayment window",
    interestRate: "1.0% / day",
    interestNote: "Pay only for your chosen tenure",
    processingFee: "2.0% upfront",
    repaymentMode: "Auto-debit on settlement/salary date or 1-tap UPI settlement",
    icon: Zap,
    accentBorder: "hover:border-amber-400",
    highlights: [
      "Bridge mid-month cash crunches, urgent stock purchases, or utility/operational expenses",
      "Fast-track AI cash-flow underwriting with direct IMPS/NEFT disbursement to your bank",
      "Zero prepayment penalty when settling early through daily retail counter inflows",
    ],
  },
] as const;

const CREDIT_LADDER = [
  {
    cycle: "Cycle 1",
    label: "First-Time Borrower",
    limit: "₹5,000 – ₹35,000",
    detail: "Up to ₹30,000 standard starter limit; extendable up to ₹35,000 for verified Gfinpay / GeM merchants with Bureau Score > 750.",
  },
  {
    cycle: "Cycle 2",
    label: "After 1st Day-43 Closure",
    limit: "Up to ₹50,000",
    detail: "Unlocked automatically after completing your first loan cycle on or before Day 43 with zero Days Past Due (0 DPD).",
  },
  {
    cycle: "Cycle 3",
    label: "After 2nd Day-43 Closure",
    limit: "Up to ₹75,000",
    detail: "Higher working capital limit for repeat merchants with consistent UPI settlement velocity and clean repayment history.",
  },
  {
    cycle: "Cycle 4+",
    label: "Seasoned Prime Partner",
    limit: "Up to ₹1,00,000",
    detail: "Maximum credit tier with priority 1-click credit sanction and fast-track bank disbursement.",
  },
] as const;

const AI_SCORING_PILLARS = [
  {
    weight: "30%",
    title: "Income & Bank Cash-Flow Analysis",
    desc: "Evaluates net monthly inflows, Average Monthly Balance (AMB), daily UPI QR settlement credits, and banking health.",
  },
  {
    weight: "25%",
    title: "Credit Bureau & Repayment Track Record",
    desc: "CIBIL / CRIF score ≥ 650 (or New-to-Credit merchants backed by strong Gfinpay counter and UPI cash flows).",
  },
  {
    weight: "25%",
    title: "Existing Obligations & FOIR Check",
    desc: "Ensures comfortable repayment capacity by keeping Fixed Obligation to Income Ratio (FOIR) within safe RBI microfinance norms.",
  },
  {
    weight: "10%",
    title: "Gfinpay & GeM Business Stability",
    desc: "Verified Gfinpay retailers and GeM vendors qualify with just 6 months of operating vintage (vs. 12 months standard).",
  },
  {
    weight: "10%",
    title: "Digital KYC & Shop Geo-Verification",
    desc: "Seamless identity verification, shop license/Udyam/GSTIN check, and quick on-ground field verification.",
  },
] as const;

const ORIGINATION_STEPS = [
  {
    step: "Step 1",
    time: "~3 Mins",
    title: "Log In & Choose Loan Amount",
    desc: "Sign in on the Gfinpay Loan Portal, choose your preferred language (English, Hindi, Assamese, Bengali & regional languages), and select your required amount.",
  },
  {
    step: "Step 2",
    time: "~2 Mins",
    title: "Digital KYC & Bank Statement Connect",
    desc: "Complete real-time KYC verification, capture a live shop selfie, and share 6–12 months bank statement via Account Aggregator or PDF.",
  },
  {
    step: "Step 3",
    time: "Fast-Track",
    title: "AI Eligibility Score & Shop Verification",
    desc: "Our AI Eligibility Engine computes your credit limit based on cash flows and Gfinpay transaction history, paired with quick geo-tagged shop verification.",
  },
  {
    step: "Step 4",
    time: "~5 Mins",
    title: "KFS e-Sign & Direct Bank Disbursement",
    desc: "Review your transparent Key Fact Statement (KFS), set up e-NACH / UPI Autopay, and receive instant IMPS/NEFT transfer directly from our NBFC partner.",
  },
] as const;

export default function AgentLoansPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Retailer Working Capital & Microfinance
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-navy-950">
            Gfinpay Business & Micro-Loans
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Collateral-free short-term working capital from ₹5,000 to ₹1,00,000 for Gfinpay retailers, shopkeepers, GeM vendors, and local businesses.
          </p>
        </div>

        <a
          href={LOAN_PORTAL_URL}
          className="btn-primary text-xs sm:text-sm inline-flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-md shadow-emerald-600/15"
        >
          <Banknote className="h-4 w-4" />
          Apply for Loan
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-navy-950 p-6 sm:p-8 lg:p-10 text-white shadow-xl border border-navy-800">
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-gradient-to-bl from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-500/10 to-transparent blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Driven Underwriting · RBI-Regulated NBFC Co-Lending Partner
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Instant Working Capital Built for Your Retail Counter & Shop Growth
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
              Stop waiting weeks for traditional bank paperwork or paying steep informal interest rates. Gfinpay leverages your active retail counter footprint, daily UPI QR settlements, and cash-flow velocity to deliver fast, transparent working capital loans directly to your bank account.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                ₹5,000 to ₹1,00,000 Limit
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                <CalendarClock className="h-3.5 w-3.5 text-emerald-400" />
                10 to 45 Days Flexible Cycles
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                Direct NBFC-to-Bank Transfer
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Zero Collateral Required
              </span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Dedicated Lending Portal
                </p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  Ready to Apply or Track Your Loan?
                </p>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Complete your 3-step guided application, view your Key Fact Statement (KFS), or repay via 1-tap UPI on the Gfinpay Loan Portal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1st Cycle Cap</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-white">Up to ₹35K</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Repeat Limit</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-emerald-400">Up to ₹1 Lakh</p>
                </div>
              </div>

              <a
                href={LOAN_PORTAL_URL}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-sm py-3.5 px-5 inline-flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Apply for Loan Now
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Product Suite (3 Variants) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-950">
              Loan Product Suite & Pricing Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the credit structure that matches your shop’s inventory turnaround and cash-flow cycle.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            All rates & APR disclosed upfront via RBI-compliant Key Fact Statement (KFS)
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {LOAN_PRODUCTS.map((product) => {
            const Icon = product.icon;
            return (
              <div
                key={product.id}
                className={`flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 ${product.accentBorder} hover:shadow-md`}
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${product.badgeTone}`}
                    >
                      {product.badge}
                    </span>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-navy-950 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-navy-950">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {product.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Loan Amount
                      </p>
                      <p className="mt-0.5 font-display text-base font-bold text-navy-950">
                        {product.amountRange}
                      </p>
                      <p className="text-[11px] text-slate-500">{product.firstCycleNote}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tenure / Cycle
                      </p>
                      <p className="mt-0.5 font-display text-base font-bold text-navy-950">
                        {product.tenure}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">{product.tenureNote}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/70">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Interest Rate
                      </p>
                      <p className="mt-0.5 font-display text-sm font-bold text-navy-950">
                        {product.interestRate}
                      </p>
                      <p className="text-[11px] text-slate-500">{product.interestNote}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/70">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Processing Fee
                      </p>
                      <p className="mt-0.5 font-display text-sm font-bold text-navy-950">
                        {product.processingFee}
                      </p>
                      <p className="text-[11px] text-slate-500">+ GST as applicable</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Key Benefits
                    </p>
                    <ul className="space-y-2">
                      {product.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold text-navy-950">Repayment: </span>
                    {product.repaymentMode}
                  </p>
                  <a
                    href={LOAN_PORTAL_URL}
                    className="w-full btn-secondary text-xs font-bold py-2.5 inline-flex items-center justify-center gap-1.5 hover:border-emerald-500 hover:text-emerald-700"
                  >
                    Apply for {product.title}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Progressive Credit Ladder & Day-43 Closure Benefit */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <TrendingUp className="h-4 w-4" />
              Graduated Credit Limit Ladder
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
              Grow Your Loan Limit Up to ₹1,00,000 with Day-43 On-Time Closure
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
              On our 45-day Regular Term Micro-Loan, closing your loan on or before <strong className="text-navy-950">Day 43</strong> gives you a 48-hour operational settlement buffer, maintains a clean 0-DPD credit bureau record, and automatically upgrades your credit limit for the next cycle.
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200 px-4 py-3 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Day-43 Target Milestone
            </p>
            <p className="mt-0.5 text-xs text-emerald-950 font-medium">
              Zero penal charges on Day 43 & Day 44 · Instant next-tier unlock
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_LADDER.map((tier, idx) => (
            <div
              key={tier.cycle}
              className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-navy-950 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                  {tier.cycle}
                </span>
                <span className="text-xs font-bold text-slate-400">Tier 0{idx + 1}</span>
              </div>
              <p className="font-display text-xl font-bold text-navy-950 pt-1">
                {tier.limit}
              </p>
              <p className="text-xs font-bold text-emerald-700">{tier.label}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{tier.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Eligibility Engine + Retailer Checklist */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: AI Underwriting Pillars */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Layers className="h-4 w-4" />
              Gfinpay AI Eligibility Engine
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
              Why Gfinpay Retailers Get Higher Approval Rates
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Traditional banks reject shopkeepers with thin credit files. Our 1,000-point AI scorecard evaluates your real shop cash flow and Gfinpay transaction history across 5 weighted pillars:
            </p>
          </div>

          <div className="space-y-3">
            {AI_SCORING_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4"
              >
                <div className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-navy-950 font-display text-sm font-bold text-emerald-400">
                  {pillar.weight}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-950">{pillar.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Eligibility & Documents Checklist */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <FileCheck2 className="h-4 w-4" />
                Quick Readiness Guide
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
                Eligibility & Documents Checklist
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Keep these details handy for a smooth 5-minute application on the loan portal:
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-950">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  For Shopkeepers & Gfinpay Retailers
                </div>
                <ul className="space-y-2 text-xs text-slate-600 pt-1">
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>KYC & Shop Proof:</strong> PAN verification, DigiLocker / CKYC, live geo-tagged shop selfie, and Shop License / Udyam Registration / GSTIN / GeM Seller ID.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Bank Statement (6–12 Months):</strong> Instant fetch via Account Aggregator (AA) or PDF upload showing active business credits and UPI QR settlements (15–20+ active days/month).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Monthly Turnover & Vintage:</strong> Minimum ₹40,000/month gross sales (for ₹5k–₹30k loans) and 6+ months operating vintage for verified Gfinpay / GeM partners.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-950">
                  <Users className="h-4 w-4 text-emerald-600" />
                  For Salaried Applicants (Assisted or Self)
                </div>
                <ul className="space-y-2 text-xs text-slate-600 pt-1">
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Income & Employment:</strong> Minimum ₹12,000–₹15,000 net monthly take-home salary, last 3 months salary slips, and Employee ID verification.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Banking & Credit:</strong> Last 3–6 months bank statement showing salary credits and CIBIL / CRIF score ≥ 650.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              100% RBI Digital Lending Compliant
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All disbursements and repayments flow directly between our RBI-registered NBFC partner and your verified bank account, with vernacular support in English, Assamese, Bengali, Hindi, and Northeast languages.
            </p>
          </div>
        </section>
      </div>

      {/* 4-Step Application Journey + Final CTA */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Clock className="h-4 w-4" />
              Fast Digital Origination
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
              How It Works — From Application to Bank Credit
            </h2>
          </div>

          <a
            href={LOAN_PORTAL_URL}
            className="btn-primary text-xs sm:text-sm inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            Apply for Loan on Portal
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ORIGINATION_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {item.step}
                </span>
                <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {item.time}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-navy-950 pt-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
