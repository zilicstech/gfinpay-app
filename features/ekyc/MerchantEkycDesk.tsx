"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ArrowLeftRight, BadgeCheck, Banknote, Fingerprint, MapPin } from "lucide-react";
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
  dmtActive?: boolean;
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

  const loaded = state != null;
  const onboardingOpen = loaded && state.kycStatus !== "COMPLETED";
  const neededBanks = state?.banks.filter((bank) => bank.needed) ?? [];
  const doneBanks = neededBanks.filter((bank) => bank.status === "SUCCESS");
  const openBanks = neededBanks.filter((bank) => bank.status !== "SUCCESS");
  const allDone = !onboardingOpen && neededBanks.length > 0 && openBanks.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy-950">KYC</h1>
        <p className="mt-2 text-sm text-slate-500">
          {state == null ? "Checking what is already finished." : headline(onboardingOpen, neededBanks.length, openBanks)}
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {onboardingOpen && state && (
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">To do</p>
          <h2 className="font-display text-xl font-bold text-navy-950">Finish onboarding</h2>
          <p className="text-sm text-slate-600">{state.message || "Open this link to finish onboarding. Bank checks start after that."}</p>
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
      {loaded && !onboardingOpen && (
        <DoneCard
          icon={<BadgeCheck className="h-6 w-6" />}
          title="Onboarding completed"
          detail={openBanks.length === 0
            ? "This outlet is registered with the bank."
            : openBanks.length === 1
              ? "This outlet is registered. Finish the bank check below on this device."
              : "This outlet is registered. Both bank checks below use the scanner on this device."}
        />
      )}
      {loaded && !onboardingOpen && doneBanks.map((bank) => (
        <DoneCard
          key={bank.bankName}
          icon={bank.bankName === "bank6" ? <Banknote className="h-6 w-6" /> : <ArrowLeftRight className="h-6 w-6" />}
          title={bank.bankName === "bank6" ? "UPI to cash activated" : "Money transfer activated"}
          detail={bank.bankName === "bank6"
            ? "Customers can pay by UPI and take cash from this counter."
            : "Customers can send money from this counter."}
        />
      ))}
      {loaded && !onboardingOpen && openBanks.length > 0 && (
        <p className="text-xs text-slate-400">If a scan fails, read this number to support: {requestId}</p>
      )}
      {state && !onboardingOpen && openBanks.map((bank) => (
        <BankCard
          key={bank.bankName}
          bank={bank}
          env={state.rdEnv}
          allowPaste={state.allowPastedPid}
          locked={false}
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
      {allDone && (
        <p className="text-sm text-slate-500">Nothing else is waiting on this page.</p>
      )}
    </div>
  );
}

function headline(onboardingOpen: boolean, neededCount: number, openBanks: Bank[]) {
  if (onboardingOpen) return "Finish onboarding with the link below. Bank checks open after that.";
  if (neededCount > 0 && openBanks.length === 0) return "Onboarding and both bank checks are active.";
  if (openBanks.length === neededCount) return "Onboarding is done. Complete both bank checks below.";
  return `${openBanks.map((bank) => bank.label).join(" and ")} is the only step left.`;
}

function DoneCard({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <section className="flex items-start gap-4 rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completed</p>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{detail}</p>
      </div>
    </section>
  );
}

function BankCard({
  bank, env, allowPaste, locked, token, requestId, onDone, offerDmt = true,
}: {
  bank: Bank;
  env: string;
  allowPaste: boolean;
  locked: boolean;
  token: string | null;
  requestId: string;
  onDone: (message: string, next?: { status: string; bankStatus: string; dmtActive?: boolean }) => void;
  /** Cash-out and money-transfer KYC can also turn DMT on. The DMT page always does. */
  offerDmt?: boolean;
}) {
  const [activateDmt, setActivateDmt] = useState(true);
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
        const service = await discover().catch(async (err: unknown) => {
          const reason = err instanceof RdError ? err.reason : "no_rd_service";
          await report("DISCOVER", false, { reason, portsTried: 21 });
          throw err;
        });
        await report("DISCOVER", true, { port: service.port, reason: service.infoUrl });
        const info = await deviceInfo(service).catch(async (err: unknown) => {
          const reason = err instanceof RdError ? err.reason : "device_info_failed";
          await report("DEVICE_INFO", false, { port: service.port, reason });
          throw err;
        });
        serial = info.serial;
        model = info.model;
        setDevice(`${info.model || "Scanner"} ${info.serial}`.trim());
        await report("DEVICE_INFO", true, { port: service.port, deviceSerial: info.serial, deviceModel: info.model, dpId: info.dpId, rdsId: info.rdsId });
        const captured = await capture(service, env, bank.wadh, info).catch(async (err: unknown) => {
          const code = err instanceof RdError ? err.errCode : "";
          const infoText = err instanceof RdError ? err.errInfo : "";
          const shape = err instanceof RdError ? err.shape : "";
          await report("CAPTURE", false, { port: service.port, errCode: code, errInfo: infoText, deviceModel: model, reason: shape });
          throw err;
        });
        pid = captured.pidData;
        await report("CAPTURE", true, {
          port: service.port,
          deviceSerial: serial,
          deviceModel: model,
          qScore: Number(captured.qScore) || undefined,
          pidLength: pid.length,
          tookMs: captured.tookMs,
          reason: captured.shape,
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
          body: JSON.stringify({ aadhaar, dob, pidData: pid, latitude, longitude, activateDmt: offerDmt ? activateDmt : true }),
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
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Still to do</p>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">{bank.label}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {offerDmt
            ? bank.bankName === "bank6"
              ? "Allow location, then scan a finger. This turns on UPI to cash."
              : "Scan a finger on this device. This turns on money transfer."
            : "Scan a finger on this device. This turns on domestic money transfer."}
        </p>
      </div>
      {offerDmt && (
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-navy-950">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={activateDmt}
            onChange={(e) => setActivateDmt(e.target.checked)}
          />
          <span>
            <span className="font-semibold">Activate DMT</span>
            <span className="mt-0.5 block text-slate-500">Send this scan with CASA on, so domestic money transfer is activated too.</span>
          </span>
        </label>
      )}
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

/** Shown on the DMT desk when this retailer has never been scanned with CASA on. */
export function DmtActivation({ onActivated }: { onActivated: () => void }) {
  const token = useSession((s) => s.token);
  const [state, setState] = useState<EkycState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId] = useState(attemptId);

  useEffect(() => {
    if (!token) return;
    api<EkycState>("/api/v1/me/ekyc", { token })
      .then(setState)
      .catch((err) => setError(formatApiError(err, "Could not load the DMT check")));
  }, [token]);

  const bank = state?.banks.find((item) => item.bankName === "bank2");
  const onboardingOpen = state != null && state.kycStatus !== "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy-950">Activate DMT</h1>
        <p className="mt-2 text-sm text-slate-500">
          Domestic money transfer is off for this outlet. A fingerprint scan turns it on.
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {onboardingOpen && (
        <section className="space-y-3 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-navy-950">Finish onboarding first</h2>
          <p className="text-sm text-slate-600">The DMT scan opens after the onboarding link is complete.</p>
          <a href="/agent/kyc" className="inline-block rounded-xl bg-navy-950 px-4 py-3 text-sm font-semibold text-white">Go to KYC</a>
        </section>
      )}
      {state && !onboardingOpen && bank && (
        <BankCard
          bank={{ ...bank, label: "Activate DMT" }}
          env={state.rdEnv}
          allowPaste={state.allowPastedPid}
          locked={false}
          token={token}
          requestId={requestId}
          offerDmt={false}
          onDone={(_message, next) => {
            if (next?.status === "SUCCESS" && next.dmtActive) onActivated();
          }}
        />
      )}
    </div>
  );
}
