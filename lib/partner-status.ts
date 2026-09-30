/** Human label for ZET (and shared) partner funnel codes from weekly MIS. */
export function partnerStatusLabel(code?: string | null): string {
  if (!code) return "—";
  return code
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
