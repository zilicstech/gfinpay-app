"use client";

import { Field } from "@/components/ui/primitives";
import { INDIAN_STATES } from "@/features/sales/customer-form";

export type RetailerDraft = {
  fullName: string;
  mobile: string;
  city: string;
  state: string;
  pincode: string;
  password: string;
};

export const emptyRetailerDraft = (): RetailerDraft => ({
  fullName: "",
  mobile: "",
  city: "",
  state: "",
  pincode: "",
  password: "",
});

export function retailerDraftReady(d: RetailerDraft) {
  return (
    d.fullName.trim().length > 0 &&
    d.mobile.length === 10 &&
    d.city.trim().length > 0 &&
    d.state.length > 0 &&
    d.pincode.length === 6 &&
    d.password.length >= 8
  );
}

export function RetailerOnboardFields({
  value,
  onChange,
  showPassword = true,
}: {
  value: RetailerDraft;
  onChange: (next: RetailerDraft) => void;
  showPassword?: boolean;
}) {
  return (
    <>
      <Field label="Retailer name">
        <input
          className="field"
          required
          autoComplete="name"
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
        />
      </Field>
      <Field label="Mobile">
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
      <Field label="City">
        <input
          className="field"
          required
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
        />
      </Field>
      <Field label="State">
        <select className="field" required value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pincode">
        <input
          className="field tracking-widest"
          required
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit pincode"
          value={value.pincode}
          onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
        />
      </Field>
      {showPassword ? (
        <Field label="Temporary password">
          <input
            className="field"
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={value.password}
            onChange={(e) => onChange({ ...value, password: e.target.value })}
          />
        </Field>
      ) : null}
    </>
  );
}
