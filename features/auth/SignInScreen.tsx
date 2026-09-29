"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { homeFor, useSession, useSessionHydrated } from "@/stores/session.store";
import { Logo } from "@/components/brand/Logo";
import { Alert } from "@/components/ui/primitives";

export function SignInScreen({
  title,
  subtitle,
  panelTitle,
  panelBody,
  panel,
}: {
  title: string;
  subtitle: string;
  panelTitle: string;
  panelBody: string;
  panel: ReactNode;
}) {
  const router = useRouter();
  const { user, token, setAuth } = useSession();
  const hydrated = useSessionHydrated();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && token && user?.userType) router.replace(homeFor(user.userType));
  }, [hydrated, router, token, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ token: string; role: string; expiresAt: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setAuth(data.token, data.role, data.expiresAt);
      router.replace(homeFor(data.role));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-neutral-50 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <Logo />
        <div className="mx-auto w-full max-w-lg">
          {panel}
          <h1 className="mt-6 font-display text-3xl text-navy-950">{panelTitle}</h1>
          <p className="mt-3 max-w-md text-navy-700">{panelBody}</p>
        </div>
        <p className="text-xs text-navy-600">GATEWAYLINE FINTECH PRIVATE LIMITED · Appointed users only</p>
      </section>
      <section className="flex items-center justify-center bg-white px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h2 className="font-display text-3xl text-navy-950">{title}</h2>
            <p className="mt-1 text-sm text-navy-600">{subtitle}</p>
          </div>
          <label className="block text-sm font-medium text-navy-800">
            Mobile or user code
            <input
              className="field mt-1.5"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              placeholder="Phone number or GFIN code"
            />
          </label>
          <label className="block text-sm font-medium text-navy-800">
            Password
            <input className="field mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <Alert tone="error">{error}</Alert>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Continue"}</button>
          <p className="text-center text-xs text-navy-500">
            <Link className="text-brand-700" href="/">Back to site</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
