"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/primitives";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { INDIAN_STATES } from "@/features/sales/customer-form";

export type RetailerDraft = {
  fullName: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  pincode: string;
  password: string;
};

export const emptyRetailerDraft = (): RetailerDraft => ({
  fullName: "",
  mobile: "",
  email: "",
  city: "",
  state: "",
  pincode: "",
  password: "",
});

export function retailerDraftReady(d: RetailerDraft) {
  return (
    d.fullName.trim().length > 0 &&
    d.mobile.length === 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) &&
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
  const [showPwd, setShowPwd] = useState(false);

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
      <Field label="Email">
        <input
          className="field"
          required
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="City">
          <input
            className="field"
            required
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
          />
        </Field>
        <Field label="State">
          <CustomSelect
            required
            value={value.state}
            onChange={(s) => onChange({ ...value, state: s })}
            placeholder="Select state"
            options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="relative">
              <input
                className="field !pr-10"
                required
                type={showPwd ? "text" : "password"}
                minLength={8}
                autoComplete="new-password"
                value={value.password}
                onChange={(e) => onChange({ ...value, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        ) : null}
      </div>
    </>
  );
}
