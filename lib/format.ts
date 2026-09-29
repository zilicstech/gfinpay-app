export function inr(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 4) return "****";
  return "******" + mobile.slice(-4);
}

export function when(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function pct(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
}

const TXN_LABELS: Record<string, string> = {
  DMT: "Send money",
  BBPS: "Bill pay",
  RECHARGE: "Mobile recharge",
  DTH: "DTH",
  FASTAG: "FASTag",
  LIC: "LIC premium",
  CASHOUT_UPI: "UPI to cash",
  CASHOUT_AEPS: "Aadhaar cash",
  FD_CARD_FEE: "FD card",
  WALLET_TOPUP: "Wallet add",
  COMMISSION_PAYOUT: "Commission",
  REVERSAL: "Reversal",
  ADJUSTMENT: "Adjustment",
};

export function txnLabel(type?: string | null): string {
  if (!type) return "—";
  return TXN_LABELS[type] ?? type.replaceAll("_", " ");
}

export function dayLabel(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(8, 10);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function createdByLabel(name?: string | null, code?: string | null): string {
  const n = name?.trim();
  if (n) return n;
  const c = code?.trim();
  if (c) return c;
  return "—";
}
