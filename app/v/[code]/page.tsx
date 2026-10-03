"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  Copy,
  CreditCard,
  Share2,
  ShieldCheck,
  Smartphone,
  UserPlus,
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

const PRODUCT_COPY: Record<string, { bank: string; blurb: string }> = {
  SBM: {
    bank: "SBM Bank",
    blurb: "A secured card backed by the customer’s own fixed deposit. Limit follows the deposit.",
  },
  IOB: {
    bank: "Indian Overseas Bank",
    blurb: "A secured IOB card. The customer funds the FD from their own account — never at your counter.",
  },
};

const STEPS = [
  {
    title: "Onboard each field employee",
    body: "Enter their name and the staff code you already use internally. We issue a GFIN and a personal desk link.",
  },
  {
    title: "Share the desk link",
    body: "Send the link on WhatsApp. The employee keeps it — same staff code always returns the same desk.",
  },
  {
    title: "Employee generates a customer link",
    body: "They enter the customer’s name, mobile, and city, pick a card, and generate an application URL.",
  },
  {
    title: "Customer finishes on their phone",
    body: "KYC and the fixed deposit happen with the bank. You never collect that cash or handle the card.",
  },
];

function whatsappHref(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function employeeDeskShareText(vendorName: string, employeeName: string, url: string) {
  return [
    `Dear ${employeeName},`,
    ``,
    `The Gfinpay Team has shared your field desk link for ${vendorName}. Use this page to enter customer details, select a card, and generate application links for your customers.`,
    ``,
    url,
    ``,
    `If you need any assistance, please reply to this message.`,
    ``,
    `Kind regards,`,
    `Gfinpay Team`,
  ].join("\n");
}

function productMeta(product: Product) {
  const key = (product.product_key ?? "").toUpperCase();
  return PRODUCT_COPY[key] ?? {
    bank: product.name,
    blurb: "Secured credit card. Customer completes the bank journey on their phone.",
  };
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
        setError(json.error?.message ?? "Could not generate desk link");
        return;
      }
      setDesk(json.data as DeskResult);
    } catch {
      setError("Could not generate desk link");
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
      <main className="grid min-h-screen place-items-center bg-[#f5f5f5] px-4">
        <p className="text-navy-700">{error}</p>
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f5f5]">
        <div className="h-12 w-48 animate-pulse rounded bg-white" />
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
    <main className="min-h-screen bg-[#f5f5f5] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <aside className="order-2 bg-black text-white lg:order-1">
        <div className="mx-auto flex max-w-xl flex-col gap-10 px-6 py-10 lg:sticky lg:top-0 lg:min-h-screen lg:px-12 lg:py-12">
          <div>
            <Logo light height={36} />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Vendor partner console
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-tight text-white sm:text-4xl">
              {vendor.full_name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {vendor.hub_name ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">{vendor.hub_name}</span>
              ) : null}
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 font-mono text-emerald-300">{vendor.code}</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              Give each field employee their own desk. They help customers apply for secured credit cards.
              The bank journey stays on the customer’s phone.
            </p>
          </div>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">How it works</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-300 text-xs font-bold text-black">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Products you can offer</h2>
            <ul className="mt-4 space-y-3">
              {products.map((product) => {
                const meta = productMeta(product);
                return (
                  <li
                    key={product.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-emerald-300/15 text-emerald-300">
                        <CreditCard className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{product.name}</p>
                        <p className="text-xs text-emerald-300/90">{meta.bank}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">{meta.blurb}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-auto space-y-3 border-t border-white/10 pt-6">
            <p className="flex items-start gap-2 text-sm text-white/65">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
              Never collect the fixed-deposit amount in cash. The customer pays the bank directly.
            </p>
            <p className="flex items-start gap-2 text-sm text-white/65">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
              Sales show in your Gfinpay report after the customer opens the link and the bank updates status.
            </p>
          </div>
        </div>
      </aside>

      <section className="order-1 flex items-start justify-center px-4 py-10 lg:order-2 lg:px-10 lg:py-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Field team
            </p>
            <h2 className="mt-2 font-display text-2xl text-navy-950">Create an employee desk</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              Use the name and staff code you already assign internally. We create a GFIN desk they can open on any phone.
            </p>
          </div>

          <form className="space-y-4 rounded-3xl border border-navy-900/10 bg-white p-6 shadow-card" onSubmit={generate}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Staff name</span>
              <input
                className="field mt-1.5"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Your staff code</span>
              <input
                className="field mt-1.5"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="e.g. RAHUL or NJ001"
                autoComplete="off"
              />
              <span className="mt-1.5 block text-xs text-navy-500">
                This is your internal code, not the GFIN. The same code always returns the same desk.
              </span>
            </label>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Creating desk…" : "Generate desk link"}
            </button>
          </form>

          {desk ? (
            <div className="space-y-4 rounded-3xl border border-emerald-200 bg-white p-6 shadow-card">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Desk ready</p>
                <p className="mt-1 font-semibold text-navy-950">{desk.employee_name}</p>
                <p className="text-sm text-navy-600">
                  Staff code {desk.employee_code}
                  {desk.employee_gfin_code ? ` · GFIN ${desk.employee_gfin_code}` : ""}
                </p>
              </div>
              <p className="break-all rounded-xl bg-[#f5f5f5] px-3 py-3 text-sm text-navy-900">{desk.apply_url}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary inline-flex items-center gap-1.5 text-xs" onClick={copyDeskUrl}>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {urlCopied ? "Copied" : "Copy link"}
                </button>
                <button type="button" className="btn-primary inline-flex items-center gap-1.5 text-xs" onClick={openShare}>
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                  Share
                </button>
              </div>
              <p className="text-xs leading-relaxed text-navy-500">
                Send this to the employee once. They use it to generate customer application links — not a login.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={shareOpen}
        title="Share employee desk"
        description="Send this message on WhatsApp. It is signed from Gfinpay Team."
      >
        <textarea
          className="min-h-56 w-full resize-y rounded-xl border border-navy-900/10 bg-[#f5f5f5] px-3 py-3 text-sm leading-relaxed text-navy-900"
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          aria-label="Message to share with employee"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(false)}>
            Close
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={copyShareMessage}>
            {shareCopied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {shareCopied ? "Copied" : "Copy message"}
          </button>
          <a
            className="btn-primary inline-flex items-center gap-2"
            href={whatsappHref(shareText)}
            target="_blank"
            rel="noreferrer"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share on WhatsApp
          </a>
        </div>
      </Modal>
    </main>
  );
}
