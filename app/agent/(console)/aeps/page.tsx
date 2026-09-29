"use client";

import { ComingSoonPage } from "@/features/console/ComingSoonPage";
import { RequireDeskService } from "@/features/desk/DeskServices";

export default function AgentAepsPage() {
  return (
    <RequireDeskService anyOf={["AEPS"]} fallbackHref="/agent/dashboard">
      <ComingSoonPage title="AePS cash out" description="Aadhaar-enabled withdrawal at your counter." />
    </RequireDeskService>
  );
}
