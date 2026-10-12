"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Building2, Store, UserMinus, UserX } from "lucide-react";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { DetailGrid, Flash, FormModal, SelectField, TextField, useFlash } from "@/features/admin/AdminChrome";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";

export type PartnerInquiry = {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  city: string;
  message?: string | null;
  status: string;
  hub_id?: string | null;
  hub_name?: string | null;
  assigned_hub_admin?: string | null;
  hub_admin_name?: string | null;
  assigned_distributor?: string | null;
  distributor_name?: string | null;
  distributor_code?: string | null;
  converted_user_id?: string | null;
  converted_role?: string | null;
  converted_name?: string | null;
  converted_code?: string | null;
  created_at?: string;
};

type Person = { id: string; full_name: string; code?: string; hub_name?: string };
type Hub = { id: string; name: string; code?: string };

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  WITH_HUB: "With hub admin",
  WITH_DISTRIBUTOR: "With distributor",
  RETIRED: "Retired",
  NOT_INTERESTED: "Not interested",
  CONVERTED: "Converted",
};

function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

function closed(status: string) {
  return status === "RETIRED" || status === "NOT_INTERESTED" || status === "CONVERTED";
}

export function InquiryList({ scope }: { scope: "admin" | "desk" }) {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const [rows, setRows] = useState<PartnerInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("ALL");
  const base = scope === "desk" ? "/distributor/inquiries" : "/admin/inquiries";
  const path = scope === "desk" ? "/api/v1/desk/inquiries" : "/api/v1/admin/inquiries";

  useEffect(() => {
    if (!token) return;
    api<PartnerInquiry[]>(path, { token })
      .then(setRows)
      .catch((e) => setError(formatApiError(e, "Could not load inquiries")));
  }, [token, path]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!rows) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const visible = rows.filter((row) => {
    if (tab === "ALL") return true;
    if (tab === "CLOSED") return row.status === "RETIRED" || row.status === "NOT_INTERESTED";
    return row.status === tab;
  });

  const tabs = scope === "desk"
    ? [["ALL", "All"], ["WITH_DISTRIBUTOR", "Open"], ["CONVERTED", "Converted"]]
    : [["ALL", "All"], ["OPEN", "Open"], ["WITH_HUB", "With hub"], ["WITH_DISTRIBUTOR", "With distributor"], ["CONVERTED", "Converted"], ["CLOSED", "Closed"]];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-950">Inquiries</h1>
        <p className="mt-1 text-sm text-navy-600">
          {scope === "desk"
            ? "Partner enquiries assigned to you. Create a retailer when you are ready."
            : "Partner enquiries from the website."}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${tab === key ? "bg-navy-950 text-white" : "text-slate-600"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No inquiries" body="New partner enquiries will show up here." />
      ) : (
        <DataTable
          columns={["Name", "Mobile", "City", "Status", "When", ""]}
          rows={visible.map((row) => [
            <span key={`${row.id}-n`} className="font-semibold text-navy-950">{row.full_name}</span>,
            row.mobile,
            row.city,
            <StatusPill key={`${row.id}-s`} value={row.status} label={statusLabel(row.status)} />,
            when(row.created_at),
            <button
              key={`${row.id}-v`}
              type="button"
              className="text-sm font-semibold text-brand-700 hover:underline"
              onClick={() => openDetails(`${base}/${row.id}`, (href) => router.push(href))}
            >
              View
            </button>,
          ])}
        />
      )}
    </div>
  );
}

export function InquiryDetail({ scope }: { scope: "admin" | "desk" }) {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const userType = useSession((s) => s.user?.userType);
  const router = useRouter();
  const flash = useFlash();
  const [row, setRow] = useState<PartnerInquiry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [hubAdmins, setHubAdmins] = useState<Person[]>([]);
  const [distributors, setDistributors] = useState<Person[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [hubAdminId, setHubAdminId] = useState("");
  const [distributorId, setDistributorId] = useState("");
  const [hubId, setHubId] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const platform = userType === "SUPER_ADMIN" || userType === "ADMIN";
  const hubAdmin = userType === "HUBADMIN";
  const basePath = scope === "desk" ? "/api/v1/desk/inquiries" : "/api/v1/admin/inquiries";
  const listHref = scope === "desk" ? "/distributor/inquiries" : "/admin/inquiries";

  async function load() {
    const data = await api<PartnerInquiry>(`${basePath}/${id}`, { token });
    setRow(data);
    setHubId(data.hub_id ?? "");
    const parts = (data.city ?? "").split(",").map((part) => part.trim()).filter(Boolean);
    setCity(parts[0] ?? data.city ?? "");
    setState(parts[1] ?? "");
  }

  useEffect(() => {
    if (!token || !id) return;
    load().catch((e) => setError(formatApiError(e, "Could not load inquiry")));
  }, [token, id]);

  useEffect(() => {
    if (!token || scope !== "admin") return;
    if (modal === "hub" && platform) {
      api<Person[]>("/api/v1/admin/users?type=HUBADMIN", { token }).then(setHubAdmins).catch(() => setHubAdmins([]));
    }
    if (modal === "distributor") {
      api<Person[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }).then(setDistributors).catch(() => setDistributors([]));
    }
    if (modal === "convert-distributor") {
      api<Hub[]>("/api/v1/admin/hubs", { token }).then(setHubs).catch(() => setHubs([]));
    }
  }, [modal, token, scope, platform]);

  async function post(path: string, body?: unknown) {
    const updated = await api<PartnerInquiry>(path, {
      token,
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
    setRow(updated);
    setModal(null);
    setPassword("");
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!row) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const done = closed(row.status);
  const actions: ManageAction[] = [];
  if (!done && scope === "admin" && platform) {
    actions.push(
      { label: "Assign hub admin", icon: <Building2 className="h-4 w-4" />, onClick: () => setModal("hub") },
      { label: "Mark not interested", icon: <UserX className="h-4 w-4" />, onClick: () => setModal("not-interested"), tone: "danger" },
      { label: "Mark retired", icon: <UserMinus className="h-4 w-4" />, onClick: () => setModal("retire"), tone: "danger" },
    );
  }
  if (!done && scope === "admin" && (hubAdmin || platform) && (row.status === "WITH_HUB" || row.status === "WITH_DISTRIBUTOR")) {
    actions.push(
      { label: "Assign distributor", icon: <Store className="h-4 w-4" />, onClick: () => setModal("distributor") },
    );
  }
  if (!done && scope === "admin" && (hubAdmin || platform) && row.status === "WITH_HUB") {
    actions.push(
      { label: "Create distributor", icon: <Building2 className="h-4 w-4" />, onClick: () => setModal("convert-distributor") },
    );
  }
  if (!done && scope === "desk" && row.status === "WITH_DISTRIBUTOR") {
    actions.push(
      { label: "Create retailer", icon: <Store className="h-4 w-4" />, onClick: () => setModal("convert-retailer") },
    );
  }

  const convertedHref = row.converted_user_id
    ? scope === "desk"
      ? `/distributor/agents/${row.converted_user_id}`
      : row.converted_role === "RETAILER"
        ? `/admin/retailers/${row.converted_user_id}`
        : `/admin/distributors/${row.converted_user_id}`
    : null;

  return (
    <div className="space-y-6">
      <Link href={listHref} className="inline-flex text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950">
        ← Back to Inquiries
      </Link>
      <Flash message={flash.message} error={flash.error} />
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-[2rem] bg-navy-950 p-6 text-white">
        <div className="space-y-2">
          <StatusPill value={row.status} label={statusLabel(row.status)} />
          <h1 className="font-display text-3xl font-bold">{row.full_name}</h1>
          <p className="text-sm text-slate-300">{row.city}</p>
        </div>
        {actions.length > 0 && <ManageMenu actions={actions} variant="onDark" />}
      </section>
      <DetailGrid
        items={[
          { label: "Mobile", value: row.mobile },
          { label: "Email", value: row.email },
          { label: "City", value: row.city },
          { label: "Hub", value: row.hub_name || "—" },
          { label: "Hub admin", value: row.hub_admin_name || "—" },
          { label: "Distributor", value: row.distributor_name ? `${row.distributor_name}${row.distributor_code ? ` (${row.distributor_code})` : ""}` : "—" },
          { label: "Received", value: when(row.created_at) },
          {
            label: "Converted to",
            value: row.converted_name && convertedHref ? (
              <Link href={convertedHref} className="text-brand-700 hover:underline">
                {row.converted_name}{row.converted_code ? ` · ${row.converted_code}` : ""} ({row.converted_role === "RETAILER" ? "Retailer" : "Distributor"})
              </Link>
            ) : "—",
          },
        ]}
      />
      {row.message && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Message</p>
          <p className="mt-2 text-sm text-navy-800 whitespace-pre-wrap">{row.message}</p>
        </section>
      )}

      <FormModal open={modal === "retire"} title="Mark retired" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); post(`${basePath}/${id}/retire`).then(() => flash.ok("Inquiry marked retired.")).catch((err) => flash.fail(err, "Could not update inquiry")); }} submitLabel="Mark retired">
        <p className="text-sm text-navy-600">This closes the inquiry. It will not be assigned or converted.</p>
      </FormModal>
      <FormModal open={modal === "not-interested"} title="Not interested" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); post(`${basePath}/${id}/not-interested`).then(() => flash.ok("Inquiry marked not interested.")).catch((err) => flash.fail(err, "Could not update inquiry")); }} submitLabel="Mark not interested">
        <p className="text-sm text-navy-600">This closes the inquiry as not interested.</p>
      </FormModal>
      <FormModal open={modal === "hub"} title="Assign hub admin" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); post(`${basePath}/${id}/assign-hub`, { hubAdminId }).then(() => flash.ok("Assigned to the hub admin.")).catch((err) => flash.fail(err, "Could not assign")); }} submitLabel="Assign" submitDisabled={!hubAdminId}>
        <SelectField label="Hub admin" required value={hubAdminId} onChange={setHubAdminId} options={hubAdmins.map((person) => ({ value: person.id, label: person.full_name }))} />
      </FormModal>
      <FormModal open={modal === "distributor"} title="Assign distributor" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); post(`${basePath}/${id}/assign-distributor`, { distributorId }).then(() => flash.ok("Assigned to the distributor.")).catch((err) => flash.fail(err, "Could not assign")); }} submitLabel="Assign" submitDisabled={!distributorId}>
        <SelectField label="Distributor" required value={distributorId} onChange={setDistributorId} options={distributors.map((person) => ({ value: person.id, label: `${person.full_name}${person.hub_name ? ` · ${person.hub_name}` : ""}` }))} />
      </FormModal>
      <FormModal open={modal === "convert-distributor"} title="Create distributor" description="Uses the name, mobile, and email from this inquiry." onClose={() => setModal(null)} onSubmit={(e: FormEvent) => { e.preventDefault(); post(`${basePath}/${id}/convert-distributor`, { password, hubId }).then(() => { flash.ok("Distributor created. Inquiry marked converted."); router.refresh(); }).catch((err) => flash.fail(err, "Could not create distributor")); }} submitLabel="Create distributor" submitDisabled={password.length < 8 || !hubId}>
        <SelectField label="Hub" required value={hubId} onChange={setHubId} options={hubs.map((hub) => ({ value: hub.id, label: hub.name }))} />
        <TextField label="Password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
      <FormModal open={modal === "convert-retailer"} title="Create retailer" description="Uses the name, mobile, and email from this inquiry." onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); post(`${basePath}/${id}/convert-retailer`, { password, city, state, pincode }).then(() => flash.ok("Retailer created. Inquiry marked converted.")).catch((err) => flash.fail(err, "Could not create retailer")); }} submitLabel="Create retailer" submitDisabled={password.length < 8 || !city || !state || pincode.length !== 6}>
        <TextField label="City" required value={city} onChange={setCity} />
        <TextField label="State" required value={state} onChange={setState} />
        <TextField label="Pincode" required value={pincode} onChange={setPincode} />
        <TextField label="Password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
    </div>
  );
}
