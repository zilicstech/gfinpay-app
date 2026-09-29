"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { mapMeProfile, useSession, type MeProfile } from "@/stores/session.store";
import { Alert, Field, PageHeader } from "@/components/ui/primitives";

export function ProfileForm() {
  const { token, user, setProfile } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shop, setShop] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.fullName ?? "");
    setEmail(user.email ?? "");
    setShop(user.shopName ?? "");
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const p = await api<MeProfile>("/api/v1/me", {
        token,
        method: "PATCH",
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim() || null,
          shopName: user?.userType === "RETAILER" ? shop : undefined,
        }),
      });
      setProfile(mapMeProfile(p));
      setOk("Profile saved.");
    } catch (err) {
      setError(formatApiError(err, "Could not save profile"));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      await api("/api/v1/me/password", {
        token,
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setOk("Password updated.");
    } catch (err) {
      setError(formatApiError(err, "Could not change password"));
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="card h-40 animate-pulse bg-[#f5f5f5]" />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        title="My profile"
        description="Update your name and password. Mobile number cannot be changed from here."
      />
      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}
      <form className="card space-y-3" onSubmit={saveProfile}>
        <Field label="Full name">
          <input className="field" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Mobile">
          <input className="field bg-[#f5f5f5]" value={user.mobile ?? ""} disabled />
        </Field>
        <Field label="Email">
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
        </Field>
        {user.userType === "RETAILER" && (
          <Field label="Retailer name">
            <input className="field" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Name on the board" />
          </Field>
        )}
        <button className="btn-navy w-full" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </form>
      <form className="card space-y-3" onSubmit={savePassword}>
        <p className="font-display text-xl text-navy-950">Change password</p>
        <Field label="Current password">
          <input className="field" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Field>
        <Field label="New password">
          <input className="field" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <button className="btn-navy w-full" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>
    </div>
  );
}
