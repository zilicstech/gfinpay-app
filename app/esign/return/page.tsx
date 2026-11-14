"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Clock,
  FileSignature,
  RefreshCw,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Logo } from "@/components/brand/Logo";

type ReturnStatusResponse = {
  agreementId: string;
  agreementNo: string;
  status: string;
  signed: boolean;
  providerStatus?: string | null;
  signatoryName?: string | null;
  signedAt?: string | null;
  label: string;
};

function EsignReturnContent() {
  const search = useSearchParams();
  const agreementId = search.get("a");
  const role = useSession((s) => s.role);
  const [data, setData] = useState<ReturnStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!agreementId) {
      setError("Missing agreement reference in return URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api<ReturnStatusResponse>(
        `/api/v1/public/esign/return-status?a=${encodeURIComponent(agreementId)}`,
        { silent: true },
      );
      setData(res);
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel("gfin-esign");
          bc.postMessage({ agreementId, status: res.status, signed: res.signed });
          bc.close();
        } catch {
          // ignore
        }
      }
    } catch (e) {
      setError(formatApiError(e, "Could not verify eSign status"));
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const consoleHref =
    role === "MASTER_DISTRIBUTOR"
      ? "/distributor/profile?tab=agreement"
      : "/agent/profile?tab=agreement";

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 gap-6">
      <Logo compact />
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl ${
              data?.signed
                ? "bg-emerald-600 text-white"
                : error || data?.status === "RELEASED"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-navy-950 text-emerald-400"
            }`}
          >
            {data?.signed ? (
              <BadgeCheck className="h-6 w-6" />
            ) : error ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <FileSignature className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Graminuli Pay · Aadhaar eSign Verification
            </p>
            <h1 className="font-display text-xl font-bold text-navy-950">
              {loading
                ? "Verifying Aadhaar eSign Status..."
                : data?.signed
                  ? "Agreement Digitally Signed!"
                  : data?.label || "eSign Status Update"}
            </h1>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 flex items-center gap-3">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-700 shrink-0" />
            Synchronizing your signature status and signed PDF from Surepass...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            {error}
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
                data.signed
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                  : "border-amber-200 bg-amber-50/80 text-amber-950"
              }`}
            >
              <p className="font-bold text-sm">{data.label}</p>
              <p className="text-slate-700">
                {data.signed
                  ? "Your Master Service Agreement has been digitally executed and stored. Your financial services (UPI, AEPS, DMT & Payouts) are now unlocked."
                  : "If you just completed the Aadhaar OTP step on Surepass, click Re-check Status below to pull the updated status."}
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Agreement Reference
                </dt>
                <dd className="mt-0.5 font-mono font-bold text-navy-950">{data.agreementNo || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Authorized Signatory
                </dt>
                <dd className="mt-0.5 font-semibold text-navy-950">{data.signatoryName || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Agreement Status
                </dt>
                <dd className="mt-0.5 font-mono font-semibold text-navy-950">{data.status}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Signed Timestamp
                </dt>
                <dd className="mt-0.5 font-semibold text-navy-950">
                  {data.signedAt ? when(data.signedAt) : "Pending"}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {!data?.signed && (
            <button
              type="button"
              disabled={loading}
              onClick={checkStatus}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-check Signing Status
            </button>
          )}
          <Link
            href={consoleHref}
            className="btn-primary text-xs inline-flex items-center gap-1.5 ml-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Partner Console
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function EsignReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 grid place-items-center p-4 text-sm text-slate-500">
          Verifying Aadhaar eSign status...
        </main>
      }
    >
      <EsignReturnContent />
    </Suspense>
  );
}

