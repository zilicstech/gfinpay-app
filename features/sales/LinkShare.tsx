"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { QrCode } from "@/components/ui/QrCode";

export function LinkShare({ url, caption }: { url: string; caption?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Continue your application", text: caption ?? "Open this link to continue.", url });
      return;
    }
    await copy();
  }

  return (
    <div className="space-y-4 rounded-2xl bg-[#f5f5f5] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Customer link</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <QrCode value={url} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="break-all text-sm text-navy-800">{url}</p>
          <p className="text-xs text-navy-500">Show the QR. The customer scans it and finishes on their phone.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => copy()}>
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => share().catch(() => undefined)}>
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
