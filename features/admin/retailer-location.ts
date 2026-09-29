export type RetailerLocation = {
  city?: string;
  state?: string;
  pincode?: string;
};

export function retailerLocationLine(loc?: RetailerLocation | null, fallback = "Location not set") {
  if (!loc) return fallback;
  const place = [loc.city, loc.state].filter(Boolean).join(", ");
  if (!place && !loc.pincode) return fallback;
  return loc.pincode ? `${place}${place ? " · " : ""}${loc.pincode}` : place;
}

export function retailerLocationFromKyc(kyc?: { city?: string; state?: string; pincode?: string; shop_address?: unknown } | null): RetailerLocation | null {
  if (!kyc) return null;
  if (kyc.city || kyc.state || kyc.pincode) {
    return { city: kyc.city, state: kyc.state, pincode: kyc.pincode };
  }
  const raw = kyc.shop_address;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      city: o.city != null ? String(o.city) : undefined,
      state: o.state != null ? String(o.state) : undefined,
      pincode: o.pincode != null ? String(o.pincode) : undefined,
    };
  }
  return null;
}
