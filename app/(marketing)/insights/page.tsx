import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Sparkles } from "lucide-react";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: `Fintech & Bharat Banking Insights — ${SITE.name}`,
  description:
    "Engineering and operational research on assisted banking, BC networks, AePS reliability, and last-mile financial inclusion in India.",
  path: "/insights",
});

const ARTICLES = [
  {
    slug: "assisted-banking-india",
    title: "Why assisted banking still outperforms consumer super-apps in Bharat",
    desc: "Why hundreds of millions of Indian citizens choose walk-in Kirana counters over smartphone apps for bill payments, cash remittance, and credit card applications.",
    tag: "Market Thesis",
    readTime: "6 min read",
    date: "Sep 2026",
  },
  {
    slug: "zero-custody-fd-cards",
    title: "The Architecture of Zero-Custody Fixed Deposit Credit Cards",
    desc: "How client-side payment links and RBI AML guidelines allow retail agents to distribute secured credit cards without ever holding the customer's deposit.",
    tag: "Regulatory Engineering",
    readTime: "8 min read",
    date: "Aug 2026",
  },
  {
    slug: "double-entry-ledger-retailers",
    title: "Why Double-Entry Accounting is Non-Negotiable for Micro-Retailer Float",
    desc: "Why traditional single-balance wallet systems fail under partner timeouts, and how immutable append-only ledger entries eliminate phantom balance losses.",
    tag: "Ledger Architecture",
    readTime: "7 min read",
    date: "Jul 2026",
  },
];

export default function InsightsPage() {
  return (
    <div className="space-y-20 py-12 sm:py-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <span className="d2c-badge">
            <BookOpen className="h-3.5 w-3.5 text-brand-600" />
            <span>Research & Architecture Insights</span>
          </span>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-950 leading-tight">
            Engineering the last mile of Bharat fintech.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Deep dives into assisted digital rails, double-entry transactional ledgers, and the socio-economics of Kirana banking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        {ARTICLES.map((art) => (
          <Link
            key={art.slug}
            href={`/insights/${art.slug}`}
            className="group block rounded-[2rem] border border-slate-200/90 bg-white p-8 shadow-card hover:shadow-card-hover hover:border-emerald-500/40 transition-all duration-300"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 font-bold text-emerald-800">
                {art.tag}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {art.readTime}
              </span>
              <span>·</span>
              <span>{art.date}</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-navy-950 group-hover:text-emerald-700 transition">
              {art.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 max-w-3xl">{art.desc}</p>

            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span>Read analysis</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
