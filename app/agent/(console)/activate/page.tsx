"use client";

import { useSession } from "@/stores/session.store";
import { ActivationStatusCard } from "@/features/finance/ActivationStatusCard";
import { FinanceRequestCard } from "@/features/finance/FinanceRequestCard";

export default function AgentActivatePage() {
  const user = useSession((s) => s.user);
  const token = useSession((s) => s.token);
  const loadProfile = useSession((s) => s.loadProfile);

  if (!user) return null;

  if ((user.status === "APPROVED" || user.status === "SUBMITTED") && user.id) {
    return (
      <div className="max-w-3xl mx-auto">
        <ActivationStatusCard
          token={token}
          retailerId={user.id}
          phase={user.status === "APPROVED" ? "received" : "review"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Outlet activation</span>
          <h1 className="mt-2 font-display text-3xl font-bold">Complete your activation</h1>
          <p className="mt-2 text-sm text-slate-300 max-w-xl">
            {user.status === "REJECTED"
              ? "The auditor rejected the last activation request. Submit the payment details and a new proof to try again."
              : "Your profile is created, but the outlet is not live yet. Transfer the activation amount, upload the proof, and wait for the auditor to confirm. After confirmation your distributor or hub admin will activate the desk."}
          </p>
        </div>
      </div>
      <FinanceRequestCard
        token={token}
        kind="ACTIVATION"
        retailerId={user.id}
        retailerStatus={user.status}
        canSubmit={user.status === "PENDING" || user.status === "REJECTED" || user.status === "PENDING_ACTIVATION" || user.status === "PENDING_KYC"}
        defaultAmount={5000}
        onChanged={() => loadProfile().catch(() => undefined)}
      />
    </div>
  );
}
