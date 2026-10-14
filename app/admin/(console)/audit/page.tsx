"use client";

import { ActivityHistory } from "@/features/admin/ActivityHistory";
import { useSession } from "@/stores/session.store";

export default function AdminAuditPage() {
  const token = useSession((s) => s.token);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">Audit</h1>
        <p className="mt-1 text-sm text-slate-500">Your own actions for the day you pick. Today is shown first.</p>
      </div>
      <ActivityHistory
        token={token}
        title="My audit history"
        body="Change the date to see another day."
      />
    </div>
  );
}
