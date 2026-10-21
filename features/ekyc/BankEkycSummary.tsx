type BankRow = { bank_name?: string; status?: string; last_message?: string; is_dmt_active?: boolean };

export function BankEkycSummary({
  kyc,
}: {
  kyc?: { bank_status?: string; banks?: BankRow[] } | null;
}) {
  if (!kyc?.bank_status && !kyc?.banks?.length) return null;
  const dmtOn = kyc.banks?.some((bank) => bank.is_dmt_active) ?? false;
  return (
    <div className="mt-3 space-y-1 text-sm text-slate-200">
      <p>Bank eKYC: {kyc.bank_status === "VERIFIED" ? "Verified" : "Pending"}</p>
      {kyc.banks?.length ? <p>DMT: {dmtOn ? "Active" : "Inactive"}</p> : null}
      {kyc.banks?.map((bank) => (
        <p key={bank.bank_name} className="text-xs text-slate-400">
          {bank.bank_name === "bank6" ? "Cash out" : "Money transfer"}: {bank.status === "SUCCESS" ? "Done" : bank.status || "Pending"}
          {bank.last_message ? ` — ${bank.last_message}` : ""}
        </p>
      ))}
    </div>
  );
}
