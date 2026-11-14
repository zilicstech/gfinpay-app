"use client";

import { Suspense } from "react";
import { RetailerProfile } from "@/features/profile/RetailerProfile";

export default function AgentProfilePage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-slate-50" />}>
      <RetailerProfile />
    </Suspense>
  );
}
