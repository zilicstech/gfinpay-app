type BankRow = { bank_name?: string; status?: string; last_message?: string; is_dmt_active?: boolean };

export function BankEkycSummary({
  kyc,
}: {
  kyc?: { bank_status?: string; banks?: BankRow[] } | null;
}) {
  if (!kyc?.bank_status && !kyc?.banks?.length) return null;
  const named = kyc.banks ?? [];
  const bank2 = named.find((bank) => bank.bank_name === "bank2");
  const bank6 = named.find((bank) => bank.bank_name === "bank6");
  const dmtOn = Boolean(bank2?.is_dmt_active) && Boolean(bank6?.is_dmt_active);
  return (
    <div className="mt-3 space-y-1 text-sm text-slate-200">
      <p>Bank eKYC: {kyc.bank_status === "VERIFIED" ? "Verified" : "Pending"}</p>
      {named.length ? <p>DMT: {dmtOn ? "Active on bank 2 and bank 6" : "Inactive"}</p> : null}
      {named.map((bank) => (
        <p key={bank.bank_name} className="text-xs text-slate-400">
          {bank.bank_name === "bank6" ? "Bank 6 cash out" : "Bank 2 money transfer"}: {bank.status === "SUCCESS" ? "Done" : bank.status || "Pending"}
          {bank.is_dmt_active ? " · DMT CASA on" : bank.status === "SUCCESS" ? " · DMT CASA off" : ""}
          {bank.last_message ? ` — ${bank.last_message}` : ""}
        </p>
      ))}
    </div>
  );
}
