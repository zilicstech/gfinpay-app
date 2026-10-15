"use client";

import { FormEvent, useEffect, useState } from "react";
import { Fingerprint, MapPin } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import { RdError, capture, deviceInfo, discover, readLocation } from "@/features/ekyc/rd-service";

type Bank = {
  bankName: string;
  label: string;
  needed: boolean;
  needsLocation: boolean;
  wadh: string;
  status: string;
  message: string;
};

type EkycState = {
  kycStatus: string;
  bankStatus: string;
  onboardingUrl?: string | null;
  canRefresh?: boolean;
  message?: string;
  allowPastedPid: boolean;
  rdEnv: string;
  banks: Bank[];
};

function attemptId() {
  return `ekyc_${Math.random().toString(16).slice(2, 8)}`;
}

export function MerchantEkycDesk() {
  const token = useSession((s) => s.token);
  const [state, setState] = useState<EkycState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestId] = useState(attemptId);

  useEffect(() => {
    if (!token) return;
    api<EkycState>("/api/v1/me/ekyc?prepare=true", { token, headers: { "X-Request-Id": requestId } })
      .then(setState)
      .catch((err) => setError(formatApiError(err, "Could not load eKYC")));
  }, [token, requestId]);

  async function refreshLink() {
    if (!token) return;
    setRefreshing(true);
    setError(null);
    try {
      const refreshed = await api<{ kycStatus: string; onboardingUrl?: string | null; message?: string }>(
        "/api/v1/me/ekyc/onboarding/refresh",
        { token, method: "POST", headers: { "X-Request-Id": requestId } },
      );
      if (refreshed.kycStatus === "COMPLETED") {
        const next = await api<EkycState>("/api/v1/me/ekyc?prepare=true", { token, headers: { "X-Request-Id": requestId } });
        setState(next);
      } else {
        setState((current) => current && ({
          ...current,
          kycStatus: refreshed.kycStatus,
          onboardingUrl: refreshed.onboardingUrl,
          canRefresh: true,
          message: refreshed.message,
        }));
      }
    } catch (err) {
      setError(formatApiError(err, "Could not refresh the onboarding link"));
    } finally {
      setRefreshing(false);
    }
  }

  const onboardingOpen = state != null && state.kycStatus !== "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy-950">KYC</h1>
        <p className="mt-2 text-sm text-slate-500">
          {onboardingOpen
            ? "Finish onboarding with the link below. Bank eKYC opens after that."
            : `Scan a finger on this computer. If something fails, read this number to support: ${requestId}`}
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {onboardingOpen && (
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-navy-950">Onboarding</h2>
          <p className="text-sm text-slate-600">{state.message || "Open this link to finish onboarding."}</p>
          {state.onboardingUrl && (
            <a href={state.onboardingUrl} className="block break-all text-sm font-medium text-navy-950 underline" target="_blank" rel="noreferrer">
              {state.onboardingUrl}
            </a>
          )}
          <div className="flex flex-wrap gap-3">
            {state.onboardingUrl && (
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-navy-950"
                onClick={() => {
                  navigator.clipboard.writeText(state.onboardingUrl || "").then(() => setCopied(true)).catch(() => setCopied(false));
                }}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            )}
            {state.canRefresh && (
              <button type="button" disabled={refreshing} onClick={refreshLink} className="rounded-xl bg-navy-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {refreshing ? "Refreshing…" : "Refresh link"}
              </button>
            )}
          </div>
        </section>
      )}
      {!onboardingOpen && state?.banks.filter((bank) => bank.needed).map((bank) => (
        <BankCard
          key={bank.bankName}
          bank={bank}
          env={state.rdEnv}
          allowPaste={state.allowPastedPid}
          locked={state.kycStatus !== "COMPLETED"}
          token={token}
          requestId={requestId}
          onDone={(message, next) => {
            setState((current) => current && ({
              ...current,
              bankStatus: next?.bankStatus || current.bankStatus,
              banks: current.banks.map((item) => item.bankName === bank.bankName
                ? { ...item, status: next?.status || item.status, message }
                : item),
            }));
          }}
        />
      ))}
    </div>
  );
}

function BankCard({
  bank, env, allowPaste, locked, token, requestId, onDone,
}: {
  bank: Bank;
  env: string;
  allowPaste: boolean;
  locked: boolean;
  token: string | null;
  requestId: string;
  onDone: (message: string, next?: { status: string; bankStatus: string }) => void;
}) {
  const [aadhaar, setAadhaar] = useState("");
  const [dob, setDob] = useState("");
  const [pasted, setPasted] = useState("");
  const [device, setDevice] = useState("Scanner not checked");
  const [point, setPoint] = useState<{ latitude: string; longitude: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(bank.message);
  const [tone, setTone] = useState<"error" | "success" | "info">("info");

  async function report(stage: string, ok: boolean, extra: Record<string, string | number | undefined> = {}) {
    if (!token) return;
    await api("/api/v1/me/ekyc/device-event", {
      token,
      method: "POST",
      headers: { "X-Request-Id": requestId },
      body: JSON.stringify({ stage, pipe: bank.bankName, ok, ...extra }),
    }).catch(() => {});
  }

  const located = !bank.needsLocation || Boolean(point?.latitude && point?.longitude);

  async function allowLocation() {
    setLocating(true);
    setMessage("");
    try {
      const next = await readLocation();
      setPoint(next);
      setTone("success");
      setMessage("Location captured. Scan a finger next.");
      await report("LOCATION", true);
    } catch (err) {
      setTone("error");
      setMessage(err instanceof Error ? err.message : "Allow location so cash out eKYC can continue.");
      await report("LOCATION", false, { reason: "location_unavailable" });
    } finally {
      setLocating(false);
    }
  }

  function setCoord(which: "latitude" | "longitude", value: string) {
    setPoint((current) => ({
      latitude: current?.latitude ?? "",
      longitude: current?.longitude ?? "",
      [which]: value.trim(),
    }));
  }

  async function scan(event: FormEvent) {
    event.preventDefault();
    if (!token || locked) return;
    if (!located) {
      setTone("error");
      setMessage("Allow location so cash out eKYC can continue.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      let pid = pasted.trim();
      let serial = "";
      let model = "";
      if (!pid) {
        const port = await discover().catch(async (err: unknown) => {
          const reason = err instanceof RdError ? err.reason : "no_rd_service";
          await report("DISCOVER", false, { reason, portsTried: 21 });
          throw err;
        });
        await report("DISCOVER", true, { port });
        const info = await deviceInfo(port);
        serial = info.serial;
        model = info.model;
        setDevice(`${info.model || "Scanner"} ${info.serial}`.trim());
        await report("DEVICE_INFO", true, { port, deviceSerial: info.serial, deviceModel: info.model, dpId: info.dpId, rdsId: info.rdsId });
        const captured = await capture(port, env, bank.wadh, info).catch(async (err: unknown) => {
          const code = err instanceof RdError ? err.errCode : "";
          const infoText = err instanceof RdError ? err.errInfo : "";
          await report("CAPTURE", false, { port, errCode: code, errInfo: infoText, deviceModel: model });
          throw err;
        });
        pid = captured.pidData;
        await report("CAPTURE", true, {
          port,
          deviceSerial: serial,
          deviceModel: model,
          qScore: Number(captured.qScore) || undefined,
          pidLength: pid.length,
          tookMs: captured.tookMs,
        });
      }
      const latitude = bank.needsLocation ? point?.latitude ?? "" : "";
      const longitude = bank.needsLocation ? point?.longitude ?? "" : "";
      const result = await api<{ message: string; bankStatus: string; status: string }>(
        `/api/v1/me/ekyc/${bank.bankName}/activate`,
        {
          token,
          method: "POST",
          headers: { "X-Request-Id": requestId },
          body: JSON.stringify({ aadhaar, dob, pidData: pid, latitude, longitude }),
        },
      );
      setTone(result.status === "SUCCESS" ? "success" : "info");
      setMessage(result.message);
      onDone(result.message, { status: result.status, bankStatus: result.bankStatus });
    } catch (err) {
      setTone("error");
      setMessage(err instanceof RdError ? err.message : formatApiError(err, "eKYC could not be completed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={scan} className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-display text-xl font-bold text-navy-950">{bank.label}</h2>
        <p className="text-xs text-slate-400">{bank.bankName}</p>
        <p className="mt-1 text-sm text-slate-500">{bank.status === "SUCCESS" ? "Done" : "Not done yet"}</p>
      </div>
      <label className="block text-sm font-medium text-navy-800">
        Aadhaar number
        <input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} inputMode="numeric" required />
      </label>
      <label className="block text-sm font-medium text-navy-800">
        Date of birth (YYYY/MM/DD)
        <input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="1990/01/31" required />
      </label>
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Fingerprint className="h-4 w-4" /> {device}
      </p>
      {bank.needsLocation && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            {point?.latitude && point?.longitude
              ? `${point.latitude}, ${point.longitude}`
              : "Allow location before the scan"}
          </p>
          <p className="text-sm text-slate-500">
            Cash out uses this browser&apos;s location. A map service is not required.
          </p>
          <button
            type="button"
            disabled={locating || busy || locked}
            onClick={allowLocation}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-navy-950 disabled:opacity-50"
          >
            {locating ? "Reading location…" : "Allow location"}
          </button>
          {allowPaste && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-navy-800">
                Latitude
                <input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2" value={point?.latitude ?? ""} onChange={(e) => setCoord("latitude", e.target.value)} inputMode="decimal" />
              </label>
              <label className="block text-sm font-medium text-navy-800">
                Longitude
                <input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2" value={point?.longitude ?? ""} onChange={(e) => setCoord("longitude", e.target.value)} inputMode="decimal" />
              </label>
            </div>
          )}
        </div>
      )}
      {allowPaste && (
        <label className="block text-sm text-slate-600">
          Paste scanner XML (this computer only)
          <textarea className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs" rows={4} value={pasted} onChange={(e) => setPasted(e.target.value)} />
        </label>
      )}
      {message && <Alert tone={tone}>{message}</Alert>}
      <button type="submit" disabled={busy || locked || !located} className="rounded-xl bg-navy-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Working…" : "Scan finger"}
      </button>
    </form>
  );
}
