"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, FileSignature, Fingerprint, ShieldCheck, XCircle } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";

type MockSessionInfo = {
  clientId: string;
  agreementId: string;
  agreementNo: string;
  reason?: string;
  redirectUrl: string;
  signerName?: string;
  signerMobile?: string;
  signerEmail?: string;
  status: string;
};

type MockActionResponse = {
  clientId: string;
  status: string;
  redirectUrl: string;
};

export default function MockEsignPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId ?? "";
  const [info, setInfo] = useState<MockSessionInfo | null>(null);
  const [signerName, setSignerName] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("4821");
  const [otp, setOtp] = useState("123456");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    api<MockSessionInfo>(`/api/v1/public/esign/mock/${encodeURIComponent(clientId)}`)
      .then((res) => {
        setInfo(res);
        setSignerName(res.signerName || "");
      })
      .catch((e) => setError(formatApiError(e, "Could not load mock eSign session")))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function submitAction(action: "complete" | "fail") {
    if (!clientId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<MockActionResponse>(
        `/api/v1/public/esign/mock/${encodeURIComponent(clientId)}/action`,
        {
          method: "POST",
          body: JSON.stringify({
            action,
            signerName: signerName.trim() || info?.signerName || "Authorized Signatory",
          }),
        },
      );
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
      }
    } catch (e) {
      setError(formatApiError(e, "Could not complete mock eSign action"));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-white p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-900">
                Local Dev Simulator · Surepass Aadhaar eSign
              </span>
              <h1 className="font-display text-lg font-bold text-navy-950 mt-0.5">
                Aadhaar Electronic Signature (ESP)
              </h1>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-xs text-slate-500 py-8 text-center">Loading signing session...</div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {!loading && info && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Agreement Reference:</span>
                <span className="font-mono font-bold text-navy-950">{info.agreementNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-mono text-slate-700">{info.clientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Signatory:</span>
                <span className="font-semibold text-navy-950">{info.signerName || "—"}</span>
              </div>
              {info.signerMobile && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono text-slate-700">{info.signerMobile}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Signer Name on Aadhaar (Name Match Check)
                </label>
                <input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="field text-xs"
                  placeholder="Authorized Signatory Full Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Simulated Aadhaar Last 4
                  </label>
                  <input
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value)}
                    maxLength={4}
                    className="field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Simulated Aadhaar OTP
                  </label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="field text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => submitAction("complete")}
                className="btn-primary text-xs inline-flex items-center gap-1.5 flex-1 justify-center"
              >
                <BadgeCheck className="h-4 w-4" />
                {busy ? "Applying Digital Signature..." : "Verify OTP & Complete Aadhaar eSign"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => submitAction("fail")}
                className="btn-secondary text-xs text-rose-600 inline-flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Simulate Failure
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

