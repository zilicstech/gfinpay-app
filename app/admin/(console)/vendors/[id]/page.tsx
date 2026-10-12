"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Building2, 
  CheckCircle2,
  Clock, 
  Copy, 
  ExternalLink, 
  Mail, 
  Phone, 
  Share2, 
  Users,
  UserX
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { partnerStatusLabel } from "@/lib/partner-status";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";

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

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [tab, setTab] = useState<"details" | "employees" | "sales">("details");
  const [urlCopied, setUrlCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [copiedDeskId, setCopiedDeskId] = useState<string | null>(null);

  // WhatsApp Share Modal
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareTarget, setShareTarget] = useState<ShareTarget>({ kind: "vendor", mobile: "" });

  const [shareWaMobileState, setShareWaMobileState] = useState<string | undefined>(undefined);
  const [statusModal, setStatusModal] = useState<"INACTIVATE" | "ACTIVATE" | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (token && id) {
      api<Vendor>(`/api/v1/admin/vendors/${id}`, { token })
        .then(setVendor)
        .catch((e) => flash.fail(e, "Failed to load vendor"));
    }
  }, [token, id]);

  async function handleStatusChange(nextStatus: "ACTIVE" | "INACTIVE") {
    if (!id || !vendor) return;
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      const updated = await api<Vendor>(`/api/v1/admin/vendors/${id}/status`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setVendor(updated);
      setStatusModal(null);
      flash.ok(
        nextStatus === "ACTIVE"
          ? "Vendor agency is now active. All employee links have been restored."
          : "Vendor agency has been inactivated. All employee desk URLs and the public console are now disabled."
      );
    } catch (e) {
      const msg = formatApiError(e, `Failed to ${nextStatus === "ACTIVE" ? "activate" : "inactivate"} vendor`);
      setStatusError(msg);
      flash.fail(e, `Failed to ${nextStatus === "ACTIVE" ? "activate" : "inactivate"} vendor`);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function copyPublicUrl() {
    if (!vendor?.public_url) return;
    await navigator.clipboard.writeText(vendor.public_url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1600);
  }

  async function copyCode() {
    if (!vendor?.code) return;
    await navigator.clipboard.writeText(vendor.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  async function copyMobile() {
    if (!vendor?.mobile) return;
    await navigator.clipboard.writeText(vendor.mobile);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 1600);
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

  if (!vendor) return <div className="card h-48 animate-pulse bg-slate-100" />;

  const isVendorActive = vendor.status === "ACTIVE";

  const manageActions: ManageAction[] = [
    {
      label: "Share console link",
      icon: <Share2 className="h-4 w-4" />,
      onClick: openVendorShare,
    },
    {
      label: "Copy console URL",
      icon: <Copy className="h-4 w-4" />,
      onClick: copyPublicUrl,
    },
    ...(vendor.public_url
      ? [
          {
            label: "Open public console",
            icon: <ExternalLink className="h-4 w-4" />,
            onClick: () => window.open(vendor.public_url, "_blank"),
          },
        ]
      : []),
    isVendorActive
      ? {
          label: "Inactivate agency",
          icon: <UserX className="h-4 w-4" />,
          onClick: () => {
            setStatusError(null);
            setStatusModal("INACTIVATE");
          },
          tone: "danger" as const,
        }
      : {
          label: "Activate agency",
          icon: <CheckCircle2 className="h-4 w-4" />,
          onClick: () => {
            setStatusError(null);
            setStatusModal("ACTIVATE");
          },
        },
  ];

  const shareWaMobile = shareTarget.kind === "vendor" ? shareTarget.mobile : undefined;
  const shareModalTitle =
    shareTarget.kind === "vendor" ? "Share Vendor Console" : "Share Employee Desk Link";
  const shareModalDescription =
    shareTarget.kind === "vendor"
      ? "Send this link and instructions to the vendor agency on WhatsApp. It is signed from the Gfinpay Team."
      : "Send this desk link to the employee on WhatsApp. It is signed from the Gfinpay Team.";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Vendors
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Profile Hero Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            {/* Badges line */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Vendor Agency
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={vendor.status} />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {vendor.full_name}
              </h1>
            </div>

            {/* Hub Territory Row */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">{vendor.hub_name || "Unassigned Hub"}</span>
            </div>

            {/* Code & Phone & Email chips row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {vendor.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{vendor.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy Vendor Code"
                    onClick={copyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{maskMobile(vendor.mobile)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Mobile"
                  onClick={copyMobile}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copiedMobile && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>

              {vendor.email && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[14rem]">{vendor.email}</span>
                </span>
              )}
            </div>

            {/* Time and creation details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{when(vendor.created_at)}</span>
              </span>
            </div>
          </div>

          {/* Top Right Action: ManageMenu */}
          <div className="shrink-0">
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>

      {/* Tabs & Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
          {(["details", "employees", "sales"] as const).map((key) => {
            const isActive = tab === key;
            const count =
              key === "employees"
                ? vendor.affiliates?.length ?? 0
                : key === "sales"
                ? vendor.sales?.length ?? 0
                : undefined;
            const label =
              key === "details"
                ? "Agency Details"
                : key === "employees"
                ? "Employees"
                : "Sales Leads";
            return (
              <button
                key={key}
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
                onClick={() => setTab(key)}
              >
                {label}
                {count !== undefined && ` (${count})`}
              </button>
            );
          })}
        </div>

        {tab === "details" ? (
          /* Agency Details Tab */
          <div className="grid gap-6 md:grid-cols-2">
            {/* Public Console Link Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-navy-950">Public Vendor Console</h3>
                  <p className="text-xs text-slate-500">External onboarding & employee tracking portal</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600">
                Share this secure portal link with the agency leadership. Vendors access this portal to onboard field agents and generate customer banking links.
              </p>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <p className="break-all font-mono text-xs text-navy-950 select-all">
                  {vendor.public_url || "Console URL not assigned"}
                </p>
                {vendor.public_url && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={copyPublicUrl}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-xs hover:bg-slate-50 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      {urlCopied ? <span className="text-emerald-600 font-bold">Copied!</span> : "Copy Link"}
                    </button>
                    <button
                      type="button"
                      onClick={openVendorShare}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-600 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share on WhatsApp
                    </button>
                    <a
                      href={vendor.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-navy-950 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Portal
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-navy-950">Agency Specifications</h3>
                  <p className="text-xs text-slate-500">Regional hub assignment & enrollment facts</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="text-slate-400 font-medium">Agency Code</dt>
                  <dd className="mt-1 font-mono font-bold text-navy-950">{vendor.code}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="text-slate-400 font-medium">Status</dt>
                  <dd className="mt-1">
                    <StatusPill value={vendor.status} />
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="text-slate-400 font-medium">Regional Hub</dt>
                  <dd className="mt-1 font-semibold text-navy-950">{vendor.hub_name ?? "Unassigned Hub"}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="text-slate-400 font-medium">Primary Mobile</dt>
                  <dd className="mt-1 font-mono font-semibold text-navy-950">{maskMobile(vendor.mobile)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="text-slate-400 font-medium">Email</dt>
                  <dd className="mt-1 truncate font-medium text-navy-950">{vendor.email ?? "—"}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="text-slate-400 font-medium">Onboarded On</dt>
                  <dd className="mt-1 text-slate-700">{when(vendor.created_at)}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : tab === "employees" ? (
          !vendor.affiliates?.length ? (
            <EmptyState
              title="No employees yet"
              body="Employees appear here when this vendor agency onboards field representatives on their public console."
            />
          ) : (
            <DataTable
              columns={["Employee", "Code", "GFIN", "Desk Link", "Created On", "Action"]}
              rows={vendor.affiliates.map((a) => {
                const deskUrl = affiliateDeskUrl(vendor, a);
                const isCopied = copiedDeskId === a.id;
                return [
                  <div key={`${a.id}-name`} className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0 ring-1 ring-inset ring-slate-200">
                      {a.employee_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-navy-950">{a.employee_name}</span>
                  </div>,
                  <span key={`${a.id}-code`} className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {a.employee_code}
                  </span>,
                  <span key={`${a.id}-gfin`} className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {a.gfin_code ?? "—"}
                  </span>,
                  deskUrl ? (
                    <div key={`${a.id}-url`} className="max-w-[14rem] truncate font-mono text-xs text-slate-600" title={deskUrl}>
                      {deskUrl}
                    </div>
                  ) : (
                    "—"
                  ),
                  a.created_at ? when(a.created_at) : "—",
                  deskUrl ? (
                    <div key={`${a.id}-act`} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyDeskUrl(a)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-medium transition-colors"
                        title="Copy Desk URL"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {isCopied ? <span className="text-emerald-600 font-bold">Copied!</span> : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEmployeeShare(a)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 text-xs font-bold transition-colors"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </button>
                    </div>
                  ) : (
                    "—"
                  ),
                ];
              })}
            />
          )
        ) : (
          !vendor.sales?.length ? (
            <EmptyState
              title="No sales leads yet"
              body="Customer applications initiated via employee field desk links will populate here in real-time."
            />
          ) : (
            <DataTable
              columns={["Customer", "Mobile", "Employee", "Product", "Partner Status", "Updated"]}
              rows={vendor.sales.map((s, idx) => [
                <span key={`${idx}-name`} className="font-semibold text-navy-950">
                  {s.customer_name ?? "—"}
                </span>,
                <span key={`${idx}-mobile`} className="font-mono text-xs text-slate-600">
                  {s.customer_mobile ? maskMobile(s.customer_mobile) : "—"}
                </span>,
                <div key={`${idx}-emp`} className="text-xs">
                  <p className="font-medium text-navy-950">{s.employee_name ?? "—"}</p>
                  {s.employee_code && (
                    <span className="font-mono text-[10px] text-slate-400">({s.employee_code})</span>
                  )}
                </div>,
                <span key={`${idx}-prod`} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {s.product_key ?? "—"}
                </span>,
                <StatusPill
                  key={`${idx}-status`}
                  value={s.partner_status ?? "PENDING"}
                  label={partnerStatusLabel(s.partner_status)}
                />,
                when(s.updated_at ?? s.first_seen_at),
              ])}
            />
          )
        )}
      </section>

      {/* WhatsApp Share Modal */}
      <Modal open={shareOpen} title={shareModalTitle} description={shareModalDescription}>
        <div className="space-y-4">
          <textarea
            className="min-h-56 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono leading-relaxed text-navy-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all"
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setShareOpen(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5 text-xs"
              onClick={copyShareMessage}
            >
              <Copy className="h-4 w-4" aria-hidden />
              {shareCopied ? "Copied" : "Copy Message"}
            </button>
            <a
              className="btn-primary inline-flex items-center gap-1.5 text-xs"
              href={whatsappHref(shareWaMobile, shareText)}
              target="_blank"
              rel="noreferrer"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </Modal>

      {/* Inactivate / Activate Agency Confirmation Modal */}
      <Modal
        open={statusModal !== null}
        title={statusModal === "INACTIVATE" ? "Inactivate Vendor Agency" : "Activate Vendor Agency"}
        description={
          statusModal === "INACTIVATE"
            ? `Are you sure you want to inactivate ${vendor.full_name}? The public console and all employee field desk URLs generated for this agency will become inactive immediately. Anyone visiting these URLs will see that the link is not active.`
            : `Reactivate ${vendor.full_name}? The public console and all employee field desk URLs will be restored to active status.`
        }
      >
        <div className="space-y-4 pt-2">
          {statusError && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 leading-relaxed font-semibold">
              {statusError}
            </div>
          )}
          {statusModal === "INACTIVATE" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 leading-relaxed">
              <strong>Notice:</strong> All {vendor.affiliates?.length ?? 0} employee personal desks will stop accepting customer card applications while this agency is inactive.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={updatingStatus}
              className="btn-secondary text-xs"
              onClick={() => setStatusModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              className={
                statusModal === "INACTIVATE"
                  ? "btn bg-rose-600 hover:bg-rose-700 text-white text-xs"
                  : "btn-primary text-xs"
              }
              onClick={() => handleStatusChange(statusModal === "INACTIVATE" ? "INACTIVE" : "ACTIVE")}
            >
              {updatingStatus
                ? "Updating..."
                : statusModal === "INACTIVATE"
                ? "Inactivate Agency"
                : "Activate Agency"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
