"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Lock,
  MapPin,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { browserApiPath } from "@/lib/api-base";
import { Modal } from "@/components/ui/primitives";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Product = { id: string; name: string; product_key?: string; code?: string };
type AffiliatePublic = {
  vendor_name: string;
  employee_name: string;
  employee_gfin_code?: string;
  products: Product[];
};

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || "Customer";
}

function customerShareMessage(
  customerName: string,
  productName: string,
  url: string,
  employeeName: string,
  vendorName: string,
) {
  const name = firstName(customerName);
  return [
    `Dear ${name},`,
    ``,
    `Thank you for choosing Gfinpay. Please complete your ${productName} application using the secure link below. You can finish on your phone at your convenience.`,
    ``,
    url,
    ``,
    `If you need any assistance, please reply to this message.`,
    ``,
    `Kind regards,`,
    employeeName,
    vendorName,
  ].join("\n");
}

export default function VendorEmployeeDeskPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AffiliatePublic | null>(null);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [shareText, setShareText] = useState("");
  const [generatedLabel, setGeneratedLabel] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetch(browserApiPath(`/api/v1/public/affiliates/${encodeURIComponent(token)}`), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error.message ?? "Link not valid");
          return;
        }
        setData(json.data);
        const products = json.data?.products as Product[] | undefined;
        if (products?.length === 1) {
          setCatalogItemId(products[0].id);
        }
      })
      .catch(() => setError("Could not open this link"));
  }, [token]);

  async function generateLink(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    setError("");
    setShareModalOpen(false);
    const res = await fetch(browserApiPath(`/api/v1/public/affiliates/${encodeURIComponent(token)}/generate-link`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalogItemId,
        customerName: customerName.trim(),
        mobile: mobile.replace(/\D/g, "").slice(-10),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.replace(/\D/g, "") || undefined,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (json.error || !json.data?.url) {
      setError(json.error?.message ?? "Could not generate link");
      return;
    }
    const url = json.data.url as string;
    const itemName = (json.data.item_name as string) ?? "Card application";
    setGeneratedUrl(url);
    setGeneratedLabel(itemName);
    setShareText(
      customerShareMessage(
        customerName.trim(),
        itemName,
        url,
        data.employee_name,
        data.vendor_name,
      ),
    );
    setCopiedMessage(false);
    setCopiedLink(false);
    setShareModalOpen(true);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      setError("Could not copy — select the text and copy manually");
    }
  }

  async function copyLinkOnly() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setError("Could not copy — select the link and copy manually");
    }
  }

  function shareWhatsApp() {
    if (!shareText) return;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  }

  if (error && !data) {
    const isInactive = error.toLowerCase().includes("not active") || error.toLowerCase().includes("inactive");
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-md text-center space-y-5 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl">
          <Logo compact />
          <div
            className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold ${
              isInactive
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}
          >
            {isInactive ? "Link Inactive" : "Link Unavailable"}
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            {isInactive ? "This URL is not active" : "Link Unavailable"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isInactive
              ? "The vendor agency associated with this field desk has been deactivated. All employee desk URLs for this agency are currently inactive."
              : error}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="btn-secondary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <div className="h-14 w-48 animate-pulse rounded-2xl bg-slate-200" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <Logo compact />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Affiliate Portal</span>
          </span>
        </div>

        {/* Affiliate Info Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Corporate Vendor</p>
              <h1 className="font-display text-xl font-extrabold text-navy-950">{data.vendor_name}</h1>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Field Executive: </span>
              <strong className="text-navy-950">{data.employee_name}</strong>
            </div>
            {data.employee_gfin_code && (
              <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
                {data.employee_gfin_code}
              </span>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-[2.5rem] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-950">Generate Customer Link</h2>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Enter customer details and choose a financial product. We will generate a secure onboarding link you can share directly.
            </p>
          </div>

          <form className="space-y-4" onSubmit={generateLink}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>Customer Full Name</span>
              </label>
              <input
                className="field"
                required
                placeholder="e.g. Ramesh Kumar"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>10-Digit Mobile Number</span>
              </label>
              <input
                className="field tracking-widest font-mono font-medium"
                required
                placeholder="9876543210"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                autoComplete="tel"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>City</span>
                </label>
                <input
                  className="field"
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  <span>State</span>
                </label>
                <input
                  className="field"
                  required
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                <span>Pincode (Optional)</span>
              </label>
              <input
                className="field tracking-widest font-mono"
                placeholder="6-digit pincode"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                <span>Select Banking Product</span>
              </label>
              <CustomSelect
                required
                value={catalogItemId}
                onChange={setCatalogItemId}
                placeholder="Select a banking product"
                options={data.products.map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full shadow-emerald-500/30 !py-3.5 mt-2"
              disabled={submitting || !catalogItemId || mobile.length !== 10}
            >
              {submitting ? "Generating Link…" : "Generate Customer Link"}
            </button>
          </form>

          {error ? (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-center text-xs font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        open={shareModalOpen}
        title="Share with Customer"
        description={generatedLabel ? `${generatedLabel} for ${firstName(customerName)}` : "Copy message or send directly via WhatsApp."}
      >
        <div className="space-y-4">
          <textarea
            className="min-h-48 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono leading-relaxed text-navy-950 focus:outline-none"
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            aria-label="Message to share with customer"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2 !bg-[#25D366] hover:!bg-[#20ba59] shadow-lg shadow-green-500/20"
              onClick={shareWhatsApp}
            >
              <Send className="h-4 w-4" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              type="button"
              className="btn-secondary inline-flex items-center justify-center gap-2"
              onClick={copyLinkOnly}
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => setShareModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
