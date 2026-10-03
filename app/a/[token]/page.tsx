"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { browserApiPath } from "@/lib/api-base";
import { Modal } from "@/components/ui/primitives";

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
    `Thank you for choosing gfinpay. Please complete your ${productName} application using the secure link below. You can finish on your phone at your convenience.`,
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

  if (error && !data) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <p className="text-navy-700">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="h-12 w-48 animate-pulse rounded bg-[#f5f5f5]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <Logo height={32} />
        <div>
          <p className="text-sm text-navy-600">{data.vendor_name}</p>
          <h1 className="font-display text-2xl text-navy-950">Customer application link</h1>
          <p className="text-sm text-navy-600">
            {data.employee_name}
            {data.employee_gfin_code ? ` · ${data.employee_gfin_code}` : ""}
          </p>
          <p className="mt-2 text-xs text-navy-500">
            Enter the customer details, pick a card, then generate a link to share with them on WhatsApp or SMS.
          </p>
        </div>

        <form className="space-y-4" onSubmit={generateLink}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Customer name</span>
            <input
              className="field mt-1"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Mobile</span>
            <input
              className="field mt-1 tracking-widest"
              required
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              autoComplete="tel"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">City</span>
              <input
                className="field mt-1"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">State</span>
              <input
                className="field mt-1"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Pincode (optional)</span>
            <input
              className="field mt-1 tracking-widest"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">Card</span>
            <select
              className="field mt-1"
              required
              value={catalogItemId}
              onChange={(e) => setCatalogItemId(e.target.value)}
            >
              <option value="" disabled>
                Select a card
              </option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting || !catalogItemId}
          >
            {submitting ? "Generating…" : "Generate link"}
          </button>
        </form>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>

      <Modal
        open={shareModalOpen}
        title="Share with customer"
        description={generatedLabel ? `${generatedLabel} · ${firstName(customerName)}` : "Copy the message or link for WhatsApp or SMS."}
      >
        <textarea
          className="min-h-56 w-full resize-y rounded-xl border border-navy-900/10 bg-[#f5f5f5] px-3 py-3 text-sm leading-relaxed text-navy-900"
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          aria-label="Message to share with customer"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setShareModalOpen(false)}>
            Close
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={copyLinkOnly}>
            {copiedLink ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copiedLink ? "Link copied" : "Copy link only"}
          </button>
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={copyMessage}>
            {copiedMessage ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copiedMessage ? "Message copied" : "Copy full message"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
