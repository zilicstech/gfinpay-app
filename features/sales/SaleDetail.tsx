"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Copy, Share2 } from "lucide-react";
import { when } from "@/lib/format";
import { EntityHero, RecordFacts, entityPrimaryActionClass } from "@/features/console/EntityChrome";
import { productTitle } from "@/features/sales/CatalogShowcase";
import { partnerStatusLabel } from "@/lib/partner-status";
import { QrCode } from "@/components/ui/QrCode";
import { Modal } from "@/components/ui/primitives";

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || "Customer";
}

function whatsappHref(mobile: string, text: string) {
  const digits = mobile.replace(/\D/g, "");
  const phone = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function customerShareText(lead: SaleLead, product: string) {
  const name = firstName(lead.customer_name);
  const signOff = lead.retailer_name?.trim() || "gfinpay";
  return [
    `Dear ${name},`,
    ``,
    `Thank you for choosing gfinpay. Please complete your ${product} application using the secure link below. The process can be finished on your phone at your convenience.`,
    ``,
    lead.payment_link_url ?? "",
    ``,
    `If you need any assistance, please reply to this message.`,
    ``,
    `Kind regards,`,
    signOff,
  ].join("\n");
}

export type SaleLead = {
  id?: string;
  customer_name: string;
  customer_mobile: string;
  customer_email?: string;
  item_name: string;
  item_code?: string;
  product_key?: string;
  category_code?: string;
  category_name: string;
  provider?: string;
  rail?: string;
  external_product?: string;
  state: string;
  partner_status?: string;
  partner_status_at?: string;
  budget?: number;
  provider_refid?: string;
  payment_link_url?: string;
  retailer_name?: string;
  distributor_name?: string;
  created_at?: string;
  updated_at?: string;
  link_opened_at?: string;
};

export function SaleDetail({
  backHref,
  backLabel,
  lead,
  audience = "admin",
  extraActions,
  extraFacts,
}: {
  backHref: string;
  backLabel: string;
  lead: SaleLead;
  /** Retailer/distributor desks hide customer link tools once the sale is closed (e.g. activated). */
  audience?: "desk" | "admin";
  extraActions?: ReactNode;
  extraFacts?: { label: string; value: ReactNode }[];
}) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const title = productTitle(lead.item_code ?? "", lead.item_name);
  const [shareText, setShareText] = useState(() => customerShareText(lead, title));

  async function copyLink() {
    if (!lead.payment_link_url) return;
    await navigator.clipboard.writeText(lead.payment_link_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function openShare() {
    setShareText(customerShareText(lead, title));
    setShareCopied(false);
    setShareOpen(true);
  }

  async function copyShareText() {
    await navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1600);
  }

  const open = !["REJECTED", "EXPIRED", "CONVERTED", "ACTIVATED"].includes(lead.state);
  const paymentLink = lead.payment_link_url ?? "";
  const showCustomerLink = Boolean(paymentLink) && (audience === "admin" || open);

  return (
    <div className="space-y-5">
      <Link href={backHref} className="text-sm font-semibold text-navy-700 underline">{backLabel}</Link>
      <EntityHero
        title={title}
        status={lead.state}
        lines={[
          <p key="customer" className="text-sm text-white/80">{lead.customer_name} · {lead.customer_mobile}</p>,
          <p key="cat" className="text-sm text-white/60">{lead.category_name}{lead.provider ? ` · ${lead.provider}` : ""}</p>,
        ]}
        primaryActions={
          <>
            {showCustomerLink ? (
              <>
                <button type="button" className={entityPrimaryActionClass} onClick={copyLink}>
                  <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
                </button>
                <button type="button" className={entityPrimaryActionClass} onClick={openShare}>
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </>
            ) : null}
            {extraActions}
          </>
        }
        footer={
          showCustomerLink && open ? (
            <div className="flex flex-col items-center gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <QrCode value={paymentLink} size={148} />
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Customer QR</p>
                <p className="mt-1 text-sm text-navy-700">The customer scans this and finishes on their phone.</p>
              </div>
            </div>
          ) : null
        }
      />
      <RecordFacts
        rows={[
          { label: "Lifecycle", value: lead.state.replaceAll("_", " ") },
          { label: "Partner status", value: partnerStatusLabel(lead.partner_status) },
          { label: "Provider", value: lead.provider ?? "—" },
          { label: "Rail", value: lead.rail?.replaceAll("_", " ") ?? "—" },
          { label: "Bank", value: lead.product_key ?? "—" },
          { label: "Category", value: lead.category_name },
          { label: "Product code", value: lead.item_code ?? "—" },
          { label: "External product", value: lead.external_product ?? "—" },
          { label: "Reference", value: lead.provider_refid ?? "—" },
          { label: "Customer", value: lead.customer_name },
          { label: "Mobile", value: lead.customer_mobile },
          { label: "Email", value: lead.customer_email || "—" },
          { label: "Retailer", value: lead.retailer_name ?? "—" },
          { label: "Distributor", value: lead.distributor_name ?? "—" },
          { label: "Created", value: when(lead.created_at) },
          { label: "Opened", value: when(lead.link_opened_at) },
          { label: "Updated", value: when(lead.updated_at) },
          ...(showCustomerLink ? [{ label: "Customer link", value: lead.payment_link_url ?? "—" }] : []),
          ...(extraFacts ?? []),
        ]}
      />
      <Modal
        open={shareOpen}
        title="Share with customer"
        description="Copy this message or send it on WhatsApp."
      >
        <textarea
          className="min-h-56 w-full resize-y rounded-xl border border-navy-900/10 bg-[#f5f5f5] px-3 py-3 text-sm leading-relaxed text-navy-900"
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(false)}>
            Close
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={copyShareText}>
            <Copy className="h-4 w-4" /> {shareCopied ? "Copied" : "Copy message"}
          </button>
          <a
            className="btn-primary inline-flex items-center gap-2"
            href={whatsappHref(lead.customer_mobile, shareText)}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp
          </a>
        </div>
      </Modal>
    </div>
  );
}
