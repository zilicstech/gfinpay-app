"use client";

import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { Alert, Modal } from "@/components/ui/primitives";

type ProofFile = {
  url: string;
  filename?: string;
  contentType?: string;
};

export function ProofViewerModal({
  open,
  token,
  requestId,
  filename,
  onClose,
}: {
  open: boolean;
  token: string | null;
  requestId?: string | null;
  filename?: string | null;
  onClose: () => void;
}) {
  const [file, setFile] = useState<ProofFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token || !requestId) return;
    let cancelled = false;
    setFile(null);
    setError(null);
    api<ProofFile>(`/api/v1/finance/requests/${requestId}/proof`, { token })
      .then((proof) => {
        if (!cancelled) setFile(proof);
      })
      .catch((err) => {
        if (!cancelled) setError(formatApiError(err, "Could not open payment proof"));
      });
    return () => {
      cancelled = true;
    };
  }, [open, token, requestId]);

  const name = file?.filename || filename || "Payment proof";
  const type = (file?.contentType || "").toLowerCase();
  const image = type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);

  return (
    <Modal open={open} title="Payment proof" description={name} onClose={onClose} wide>
      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : !file?.url ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : image ? (
        <img src={file.url} alt={name} className="mx-auto max-h-[70vh] w-full rounded-2xl bg-slate-50 object-contain" />
      ) : (
        <iframe
          title={name}
          src={file.url}
          className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-slate-50"
        />
      )}
    </Modal>
  );
}
