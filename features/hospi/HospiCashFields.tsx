"use client";

export type HospiDraft = {
  gender: string;
  customerName: string;
  dob: string;
  address: string;
  pincode: string;
  mobile: string;
  email: string;
  insuredRelationship: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeDob: string;
  goodHealth: string;
  pedDetails: string;
  pedSince: string;
  pep: string;
  plan: string;
};

export const GOOD_HEALTH = "Yes, I am completely healthy";

export const EMPTY_HOSPI: HospiDraft = {
  gender: "M",
  customerName: "",
  dob: "",
  address: "",
  pincode: "",
  mobile: "",
  email: "",
  insuredRelationship: "Self",
  nomineeName: "",
  nomineeRelation: "",
  nomineeDob: "",
  goodHealth: "",
  pedDetails: "No",
  pedSince: "No",
  pep: "No",
  plan: "Hospi Cash",
};

const NOMINEE_RELATIONS = ["Spouse", "Father", "Mother", "Brother", "Sister", "Grand Father", "Grand Mother"] as const;

export function hospiPayload(draft: HospiDraft): HospiDraft {
  return {
    ...draft,
    gender: draft.gender === "F" ? "F" : "M",
    insuredRelationship: "Self",
    plan: "Hospi Cash",
    goodHealth: draft.goodHealth === GOOD_HEALTH ? GOOD_HEALTH : "",
    pedDetails: "No",
    pedSince: "No",
    pep: "No",
  };
}

export function hospiReady(draft: HospiDraft) {
  return (
    draft.customerName.trim().length > 1 &&
    draft.dob &&
    draft.address.trim().length > 3 &&
    draft.pincode.length === 6 &&
    draft.mobile.length === 10 &&
    draft.email.includes("@") &&
    draft.insuredRelationship.trim() &&
    draft.nomineeName.trim() &&
    draft.nomineeRelation.trim() &&
    draft.nomineeDob &&
    draft.goodHealth === GOOD_HEALTH &&
    draft.plan.trim()
  );
}

function Label({ children }: { children: string }) {
  return <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">{children}</span>;
}

export function HospiCashFields({
  value,
  onChange,
}: {
  value: HospiDraft;
  onChange: (next: HospiDraft) => void;
}) {
  function set<K extends keyof HospiDraft>(key: K, next: HospiDraft[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label>
        <Label>Gender</Label>
        <select className="field" value={value.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </label>
      <label>
        <Label>Customer name</Label>
        <input className="field" value={value.customerName} onChange={(e) => set("customerName", e.target.value)} />
      </label>
      <label>
        <Label>Date of birth</Label>
        <input className="field" type="date" value={value.dob} onChange={(e) => set("dob", e.target.value)} />
      </label>
      <label>
        <Label>Pin code</Label>
        <input
          className="field"
          inputMode="numeric"
          maxLength={6}
          value={value.pincode}
          onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </label>
      <label className="sm:col-span-2">
        <Label>Address</Label>
        <textarea className="field min-h-20" value={value.address} onChange={(e) => set("address", e.target.value)} />
      </label>
      <label>
        <Label>Mobile</Label>
        <input
          className="field"
          inputMode="numeric"
          maxLength={10}
          value={value.mobile}
          onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </label>
      <label>
        <Label>Email</Label>
        <input className="field" type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
      </label>
      <label>
        <Label>Insured relationship</Label>
        <input className="field" value="Self" readOnly />
      </label>
      <label>
        <Label>Nominee name</Label>
        <input className="field" value={value.nomineeName} onChange={(e) => set("nomineeName", e.target.value)} />
      </label>
      <label>
        <Label>Nominee relation</Label>
        <select className="field" value={value.nomineeRelation} onChange={(e) => set("nomineeRelation", e.target.value)}>
          <option value="">Select</option>
          {NOMINEE_RELATIONS.map((relation) => (
            <option key={relation} value={relation}>
              {relation}
            </option>
          ))}
        </select>
      </label>
      <label>
        <Label>Nominee date of birth</Label>
        <input className="field" type="date" value={value.nomineeDob} onChange={(e) => set("nomineeDob", e.target.value)} />
      </label>
    </div>
  );
}

export function HospiHealthCheck({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-navy-950">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>Good health declaration</span>
    </label>
  );
}
