"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCode({ value, size = 176 }: { value: string; size?: number }) {
  if (!value) return null;
  return (
    <div className="inline-block rounded-xl bg-white p-3 ring-1 ring-navy-900/10">
      <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
    </div>
  );
}
