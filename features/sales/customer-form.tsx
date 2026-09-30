"use client";

import { Field } from "@/components/ui/primitives";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export type CustomerDraft = {
  mobile: string;
  fullName: string;
  email: string;
  city: string;
  state: string;
  pincode: string;
};

export const emptyCustomerDraft = (): CustomerDraft => ({
  mobile: "",
  fullName: "",
  email: "",
  city: "",
  state: "",
  pincode: "",
});

export function CustomerFields({
  value,
  onChange,
}: {
  value: CustomerDraft;
  onChange: (next: CustomerDraft) => void;
}) {
  return (
    <>
      <Field label="Customer mobile">
        <input
          className="field tracking-widest"
          required
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          placeholder="10-digit mobile"
          value={value.mobile}
          onChange={(e) => onChange({ ...value, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
        />
      </Field>
      <Field label="Customer name">
        <input
          className="field"
          required
          autoComplete="name"
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
        />
      </Field>
      <Field label="Customer email">
        <input
          className="field"
          type="email"
          autoComplete="email"
          placeholder="Needed for credit card, loan, and savings links"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value.trim() })}
        />
      </Field>
      <Field label="City">
        <input
          className="field"
          required
          autoComplete="address-level2"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
        />
      </Field>
      <Field label="State">
        <select
          className="field"
          required
          value={value.state}
          onChange={(e) => onChange({ ...value, state: e.target.value })}
        >
          <option value="">Select state</option>
          {value.state && !INDIAN_STATES.includes(value.state) && <option value={value.state}>{value.state}</option>}
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </Field>
      <Field label="Pincode">
        <input
          className="field tracking-widest"
          required
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="6-digit pincode"
          value={value.pincode}
          onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
        />
      </Field>
    </>
  );
}
