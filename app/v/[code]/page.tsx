"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Hash,
  Lock,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  UserPlus,
  Wifi,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { browserApiPath } from "@/lib/api-base";
import { Modal } from "@/components/ui/primitives";

type Product = { id: string; name: string; product_key?: string; code?: string };
type VendorPublic = {
  code: string;
  full_name: string;
  hub_name?: string;
  products?: Product[];
};
type DeskResult = {
  apply_url: string;
  employee_name: string;
  employee_code: string;
  employee_gfin_code?: string;
};

const PRODUCT_CARDS: Record<
  string,
  {
    name: string;
    fullName: string;
    gradient: string;
    glow: string;
    badge: string;
    badgeColor: string;
    blurb: string;
    last4: string;
  }
> = {
  SBM: {
    name: "SBM Bank",
    fullName: "State Bank of Mauritius",
    gradient: "from-slate-950 via-navy-900 to-indigo-950",
    glow: "from-indigo-500/20",
    badge: "100% Approval",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    blurb: "Secured card backed by customer's own fixed deposit. Limit follows the deposit.",
    last4: "8824",
  },
  IOB: {
    name: "IOB",
    fullName: "Indian Overseas Bank",
    gradient: "from-emerald-950 via-teal-950 to-slate-950",
    glow: "from-emerald-500/20",
    badge: "High Interest FD",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    blurb: "Secured IOB card. Customer funds the FD digitally from their own bank account.",
    last4: "4190",
  },
  DCB: {
    name: "DCB Bank",
    fullName: "DCB Bank Limited",
    gradient: "from-slate-950 via-cyan-950 to-slate-900",
    glow: "from-cyan-500/20",
    badge: "Instant Issuance",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    blurb: "Instant digital card backed by paperless fixed deposit.",
    last4: "6712",
  },
};

const STEPS = [
  {
    num: "01",
    title: "Onboard Each Field Staff",
    body: "Enter their name and internal staff code. We generate a persistent personal desk URL.",
  },
  {
    num: "02",
    title: "Share the Link Once",
    body: "Send on WhatsApp. The employee keeps it bookmarked — same code always returns the same desk.",
  },
  {
    num: "03",
    title: "Staff Generates Customer Links",
    body: "They input customer details, select an FD card, and send an instant application link.",
  },
  {
    num: "04",
    title: "Customer Completes On Phone",
    body: "KYC and fixed deposit happen directly with the bank. You never handle customer cash.",
  },
];

function whatsappHref(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function employeeDeskShareText(vendorName: string, employeeName: string, url: string) {
  return [
    `Dear ${employeeName},`,
    ``,
    `The Gfinpay Team has shared your field desk link for ${vendorName}. Use this page to enter customer details, select an FD credit card, and generate instant application links for your customers:`,
    ``,
    url,
    ``,
    `Please bookmark this link on your phone. If you need any assistance, please reply to this message.`,
    ``,
    `Kind regards,`,
    `Gfinpay Team`,
  ].join("\n");
}

export default function VendorConsolePage() {
  const { code } = useParams<{ code: string }>();
  const [vendor, setVendor] = useState<VendorPublic | null>(null);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [desk, setDesk] = useState<DeskResult | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    fetch(browserApiPath(`/api/v1/public/vendors/${encodeURIComponent(code)}`), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error.message ?? "Vendor not found");
          return;
        }
        setVendor(json.data);
      })
      .catch(() => setError("Could not load vendor"));
  }, [code]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setDesk(null);
    setSubmitting(true);
    try {
      const res = await fetch(browserApiPath(`/api/v1/public/vendors/${encodeURIComponent(code)}/affiliates`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName: employeeName.trim(), employeeCode: employeeCode.trim() }),
      });
      const json = await res.json();
      if (json.error || !json.data?.apply_url) {
        setError(json.error?.message ?? "Could not generate link");
        return;
      }
      setDesk(json.data as DeskResult);
    } catch {
      setError("Could not generate link");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyDeskUrl() {
    if (!desk?.apply_url) return;
    await navigator.clipboard.writeText(desk.apply_url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1600);
  }

  async function copyVendorCode() {
    if (!vendor?.code) return;
    await navigator.clipboard.writeText(vendor.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1600);
  }

  function openShare() {
    if (!vendor || !desk) return;
    setShareText(employeeDeskShareText(vendor.full_name, desk.employee_name, desk.apply_url));
    setShareCopied(false);
    setShareOpen(true);
  }

  async function copyShareMessage() {
    await navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1600);
  }

  if (error && !vendor) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-md text-center space-y-5 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl">
          <Logo compact />
          <div className="inline-flex rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold text-rose-700">
            Console Unavailable
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">Vendor Profile Not Found</h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link href="/" className="btn-secondary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="text-center space-y-4">
          <Logo compact />
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Loading Vendor Console…</span>
          </div>
        </div>
      </main>
    );
  }

  const products = vendor.products?.length
    ? vendor.products
    : [
        { id: "sbm", name: "SBM secured card", product_key: "SBM" },
        { id: "iob", name: "IOB secured card", product_key: "IOB" },
      ];

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-12 overflow-hidden">
      {/* Left Column: Vendor Profile & Product Rail Showcase */}
      <aside className="lg:col-span-6 xl:col-span-5 bg-gradient-to-b from-navy-950 via-slate-900 to-navy-950 text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden flex flex-col justify-between">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Logo light compact />
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vendor Partner Console</span>
            </div>
          </div>

          {/* Vendor Profile Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Onboarded Corporate Partner</p>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-black text-white">{vendor.full_name}</h1>
              </div>
              {vendor.hub_name && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                  <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{vendor.hub_name} Hub</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">Partner Code:</span>
              <button
                type="button"
                onClick={copyVendorCode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
              >
                <span>{vendor.code}</span>
                {codeCopied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3 text-emerald-300/70" />}
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Equip your field employees and store sales staff with personal application desks to issue secured credit cards with zero cash collection risk.
            </p>
          </div>

          {/* Partner Products / Credit Cards Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Card Rails</h2>
              <span className="text-[11px] font-semibold text-emerald-400">Direct Bank APIs</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {products.map((product) => {
                const key = (product.product_key ?? "").toUpperCase();
                const card = PRODUCT_CARDS[key] ?? {
                  name: product.name,
                  fullName: "Secured Credit Card",
                  gradient: "from-slate-950 via-slate-900 to-navy-950",
                  glow: "from-emerald-500/20",
                  badge: "100% Approval",
                  badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  blurb: "Guaranteed FD card issued digitally.",
                  last4: "9000",
                };

                return (
                  <div
                    key={product.id}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-tr ${card.gradient} p-4 border border-white/10 shadow-lg`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-black tracking-wide text-white">{card.name}</p>
                        <p className="text-[10px] text-slate-400">{card.fullName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${card.badgeColor}`}>
                          {card.badge}
                        </span>
                        <Wifi className="h-3 w-3 text-white/50 rotate-90" />
                      </div>
                    </div>

                    <div className="my-3 flex items-center justify-between">
                      {/* EMV Chip graphic */}
                      <div className="h-6 w-8 rounded bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-0.5 border border-amber-600/40">
                        <div className="h-full w-full rounded border border-amber-700/30 opacity-60 grid grid-cols-2" />
                      </div>
                      <span className="font-mono text-[10px] tracking-wider text-slate-400">•••• {card.last4}</span>
                      <span className="font-bold text-xs italic text-white/90">RuPay</span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">{card.blurb}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">How Field Desk Works</h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {STEPS.map((step) => (
                <div key={step.num} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-400/20 font-mono text-[11px] font-black text-emerald-300">
                    {step.num}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">{step.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 border-t border-white/10 pt-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>100% Cashless Flow · Regulated Banks</span>
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Lock className="h-3 w-3 text-emerald-400" /> 256-bit TLS Security
          </span>
        </div>
      </aside>

      {/* Right Column: Desk Generator & Result Desk */}
      <section className="lg:col-span-6 xl:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-lg space-y-7">
          {/* Card: Staff Onboarding Generator */}
          <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
            <div className="space-y-1.5">
              <span className="d2c-badge">
                <UserPlus className="h-3.5 w-3.5 text-brand-600" />
                <span>Field Team Desk Link</span>
              </span>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
                Generate Field Staff Link
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Enter your staff name and internal ID. We generate their personal desk URL to issue FD cards from any phone.
              </p>
            </div>

            <form className="space-y-4" onSubmit={generate}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Staff Full Name</span>
                </label>
                <input
                  className="field"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Staff Code / Internal ID</span>
                </label>
                <input
                  className="field tracking-wider"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. RAHUL01 or EMP102"
                  autoComplete="off"
                />
                <span className="mt-1.5 block text-[11px] text-slate-500">
                  Your internal ID code. Using the same code always retrieves the same persistent desk link.
                </span>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              {/* RENAME TO GENERATE LINK AS EXPLICITLY REQUESTED */}
              <button
                type="submit"
                className="btn-primary w-full shadow-lg shadow-emerald-500/25 !py-3.5 font-bold text-sm"
                disabled={submitting || !employeeName.trim() || !employeeCode.trim()}
              >
                {submitting ? "Generating Link…" : "Generate Link"}
              </button>
            </form>
          </div>

          {/* Card: Generated Desk Result Card */}
          {desk ? (
            <div className="space-y-5 rounded-3xl border border-emerald-500/30 bg-emerald-50/60 p-6 sm:p-7 shadow-xl shadow-emerald-500/5 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Personal Desk Ready</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-navy-950">{desk.employee_name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-navy-800">Staff Code: {desk.employee_code}</span>
                    {desk.employee_gfin_code && (
                      <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-mono font-bold text-emerald-700">
                        GFIN: {desk.employee_gfin_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Personal Staff Application Link
                </p>
                <p className="break-all font-mono text-xs sm:text-sm text-navy-900 select-all font-medium">
                  {desk.apply_url}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  className="btn-secondary !py-2.5 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                  onClick={copyDeskUrl}
                >
                  {urlCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  onClick={openShare}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share on WhatsApp</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed border-t border-emerald-200/60 pt-3">
                Send this link to the employee once. They keep it bookmarked to open on their phone and generate customer application links.
              </p>
            </div>
          ) : null}

          {/* Quick Help Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex items-center justify-between text-xs text-slate-600 shadow-xs">
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Works instantly on any mobile browser without downloading an APK.</span>
            </span>
            <Link href="/" className="font-bold text-emerald-700 hover:text-emerald-800 transition shrink-0 ml-2">
              Homepage →
            </Link>
          </div>
        </div>
      </section>

      {/* WhatsApp Share Modal */}
      <Modal
        open={shareOpen}
        title="Share Employee Desk"
        description="Send this ready message directly to your staff member via WhatsApp."
      >
        <div className="space-y-4 pt-2">
          <textarea
            className="min-h-52 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs sm:text-sm font-mono leading-relaxed text-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            aria-label="Message to share with employee"
          />
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              className="btn-secondary !py-2.5 !px-4 text-xs font-bold"
              onClick={() => setShareOpen(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-secondary !py-2.5 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
              onClick={copyShareMessage}
            >
              {shareCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
            <a
              className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              href={whatsappHref(shareText)}
              target="_blank"
              rel="noreferrer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>
      </Modal>
    </main>
  );
}
