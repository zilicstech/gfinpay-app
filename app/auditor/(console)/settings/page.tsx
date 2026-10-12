"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BanksDesk } from "@/features/finance/BanksDesk";

export default function AuditorSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"banks">("banks");

  useEffect(() => {
    if (searchParams.get("tab") === "banks") setTab("banks");
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Collection accounts retailers transfer to before they submit payment proof.</p>
      </div>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "banks" ? "bg-navy-950 text-white shadow-sm" : "text-slate-600"}`}
          onClick={() => {
            setTab("banks");
            router.replace("/auditor/settings?tab=banks", { scroll: false });
          }}
        >
          Banks
        </button>
      </div>
      {tab === "banks" && <BanksDesk embedded />}
    </div>
  );
}
