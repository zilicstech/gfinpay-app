"use client";

import { QRCodeSVG } from "qrcode.react";

export function CashoutQr({ kind, value }: { kind?: string | null; value: string }) {
  if (kind === "PNG_BASE64") {
    return (
      <img
        alt="Cashout QR code"
        src={`data:image/png;base64,${value}`}
        className="h-[220px] w-[220px] object-contain"
      />
    );
  }
  return <QRCodeSVG value={value} size={220} level="M" includeMargin />;
}
