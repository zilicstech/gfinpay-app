"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Share2 } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { partnerStatusLabel } from "@/lib/partner-status";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Modal } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { EntityHero, RecordFacts } from "@/features/console/EntityChrome";

type ShareTarget = { kind: "vendor"; mobile: string } | { kind: "employee" };

function whatsappHref(mobile: string | undefined, text: string) {
  const digits = (mobile ?? "").replace(/\D/g, "");
  const phone = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

type Affiliate = {
  id: string;
  employee_name: string;
  employee_code: string;
  gfin_code?: string;
  apply_token?: string;
  desk_url?: string;
  created_at?: string;
};

function publicAppOrigin(vendor: Vendor): string {
  const fromConsole = vendor.public_url?.replace(/\/v\/[^/]+\/?$/i, "");
  if (fromConsole) return fromConsole.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function affiliateDeskUrl(vendor: Vendor, affiliate: Affiliate): string | undefined {
  if (affiliate.desk_url) return affiliate.desk_url;
  const gfin = affiliate.gfin_code?.trim();
  if (!gfin) return undefined;
  const origin = publicAppOrigin(vendor);
  if (!origin) return undefined;
  return `${origin}/a/${gfin}`;
}
type VendorSale = {
  customer_mobile?: string;
  customer_name?: string;
  product_key?: string;
  partner_status?: string;
  employee_name?: string;
  employee_code?: string;
  first_seen_at?: string;
  updated_at?: string;
};
type Vendor = {
  id: string;
  code: string;
  full_name: string;
  mobile: string;
  email?: string;
  hub_name?: string;
  status: string;
  public_url?: string;
  created_at?: string;
  affiliates?: Affiliate[];
  sales?: VendorSale[];
};

function vendorConsoleShareText(vendor: Vendor) {
  const url = vendor.public_url ?? "";
  return [
    `Dear ${vendor.full_name},`,
    ``,
    `The Gfinpay Team has enabled your vendor console for field teams. Please share the link below with your employees.`,
    ``,
    `On this page, vendors can onboard their employees.`,
    ``,
    url,
    ``,
    `If you need any assistance, please reply to this message.`,
    ``,
    `Kind regards,`,
    `Gfinpay Team`,
  ].join("\n");
}

function employeeDeskShareText(vendor: Vendor, affiliate: Affiliate) {
  const url = affiliateDeskUrl(vendor, affiliate) ?? "";
  return [
    `Dear ${affiliate.employee_name},`,
    ``,
    `The Gfinpay Team has shared your field desk link for ${vendor.full_name}. Use this page to enter customer details, select a card, and generate application links for your customers.`,
    ``,
    url,
    ``,
    `If you need any assistance, please reply to this message.`,
    ``,
    `Kind regards,`,
    `Gfinpay Team`,
  ].join("\n");
}

function LinkActions({
  onCopy,
  onShare,
  copied,
}: {
  onCopy: () => void;
  onShare: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-secondary inline-flex items-center gap-1.5 text-xs" onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" aria-hidden />
        {copied ? "Copied" : "Copy"}
      </button>
      <button type="button" className="btn-primary inline-flex items-center gap-1.5 text-xs" onClick={onShare}>
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        Share
      </button>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [tab, setTab] = useState<"details" | "employees" | "sales">("details");
  const [urlCopied, setUrlCopied] = useState(false);
  const [copiedDeskId, setCopiedDeskId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareTarget, setShareTarget] = useState<ShareTarget>({ kind: "vendor", mobile: "" });

  useEffect(() => {
    if (token && id) {
      api<Vendor>(`/api/v1/admin/vendors/${id}`, { token })
        .then(setVendor)
        .catch((e) => flash.fail(e, "Failed to load vendor"));
    }
  }, [token, id]);

  async function copyPublicUrl() {
    if (!vendor?.public_url) return;
    await navigator.clipboard.writeText(vendor.public_url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1600);
  }

  async function copyDeskUrl(affiliate: Affiliate) {
    const url = vendor ? affiliateDeskUrl(vendor, affiliate) : undefined;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedDeskId(affiliate.id);
    setTimeout(() => setCopiedDeskId(null), 1600);
  }

  function openVendorShare() {
    if (!vendor) return;
    setShareText(vendorConsoleShareText(vendor));
    setShareTarget({ kind: "vendor", mobile: vendor.mobile });
    setShareCopied(false);
    setShareOpen(true);
  }

  function openEmployeeShare(affiliate: Affiliate) {
    if (!vendor) return;
    setShareText(employeeDeskShareText(vendor, affiliate));
    setShareTarget({ kind: "employee" });
    setShareCopied(false);
    setShareOpen(true);
  }

  async function copyShareMessage() {
    await navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1600);
  }

  if (!vendor) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const publicConsoleValue = vendor.public_url ? (
    <div className="space-y-3">
      <p className="break-all font-normal">{vendor.public_url}</p>
      <LinkActions copied={urlCopied} onCopy={copyPublicUrl} onShare={openVendorShare} />
    </div>
  ) : (
    "—"
  );

  const shareWaMobile = shareTarget.kind === "vendor" ? shareTarget.mobile : undefined;
  const shareModalTitle =
    shareTarget.kind === "vendor" ? "Share vendor console" : "Share employee desk link";
  const shareModalDescription =
    shareTarget.kind === "vendor"
      ? "Send this message to the vendor on WhatsApp. It is signed from Gfinpay Team."
      : "Send this message to the employee on WhatsApp. It is signed from Gfinpay Team.";

  return (
    <div className="space-y-5">
      <Link href="/admin/vendors" className="text-sm font-semibold text-navy-700 underline">All vendors</Link>
      <Flash message={flash.message} error={flash.error} />
      <EntityHero
        title={vendor.full_name}
        status={vendor.status}
        code={vendor.code}
        lines={[<p key="hub" className="text-sm text-white/70">{vendor.hub_name}</p>]}
        stats={[
          { label: "Employees", value: vendor.affiliates?.length ?? 0 },
          { label: "Sales leads", value: vendor.sales?.length ?? 0 },
        ]}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["details", "Vendor details"],
              ["employees", "Employees"],
              ["sales", "Sales"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? "bg-black text-emerald-300" : "bg-[#f5f5f5] text-navy-700"}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "details" ? (
          <RecordFacts
            rows={[
              { label: "Code", value: vendor.code },
              { label: "Status", value: vendor.status },
              { label: "Hub", value: vendor.hub_name ?? "—" },
              { label: "Public console", value: publicConsoleValue },
              { label: "Mobile", value: maskMobile(vendor.mobile) },
              { label: "Email", value: vendor.email ?? "—" },
              { label: "Created", value: when(vendor.created_at) },
            ]}
          />
        ) : tab === "employees" ? (
          !vendor.affiliates?.length ? (
            <EmptyState
              title="No employees yet"
              body="Employees appear when the vendor onboards them on the public console."
            />
          ) : (
            <DataTable
              columns={["Employee", "Internal code", "GFIN", "Desk link", "Created"]}
              rows={vendor.affiliates.map((a) => {
                const deskUrl = affiliateDeskUrl(vendor, a);
                return [
                a.employee_name,
                a.employee_code,
                a.gfin_code ?? "—",
                deskUrl ? (
                  <div key={`${a.id}-link`} className="min-w-[14rem] space-y-2">
                    <p className="break-all text-xs font-normal text-navy-800">{deskUrl}</p>
                    <LinkActions
                      copied={copiedDeskId === a.id}
                      onCopy={() => copyDeskUrl(a)}
                      onShare={() => openEmployeeShare(a)}
                    />
                  </div>
                ) : (
                  "—"
                ),
                when(a.created_at),
              ];
              })}
            />
          )
        ) : !vendor.sales?.length ? (
          <EmptyState
            title="No sales yet"
            body="Leads appear here when employees generate customer application links from their field desk."
          />
        ) : (
          <DataTable
            columns={["Customer", "Mobile", "Employee", "Product", "Partner step", "Updated"]}
            rows={vendor.sales.map((s) => [
              s.customer_name ?? "—",
              s.customer_mobile ?? "—",
              `${s.employee_name ?? "—"} (${s.employee_code ?? "—"})`,
              s.product_key ?? "—",
              partnerStatusLabel(s.partner_status),
              when(s.updated_at ?? s.first_seen_at),
            ])}
          />
        )}
      </section>

      <Modal open={shareOpen} title={shareModalTitle} description={shareModalDescription}>
        <textarea
          className="min-h-56 w-full resize-y rounded-xl border border-navy-900/10 bg-[#f5f5f5] px-3 py-3 text-sm leading-relaxed text-navy-900"
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setShareOpen(false)}>
            Close
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={copyShareMessage}>
            <Copy className="h-4 w-4" aria-hidden />
            {shareCopied ? "Copied" : "Copy message"}
          </button>
          <a
            className="btn-primary inline-flex items-center gap-2"
            href={whatsappHref(shareWaMobile, shareText)}
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
