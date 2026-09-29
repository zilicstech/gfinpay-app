"use client";

import { ComingSoonPage } from "@/features/console/ComingSoonPage";
import { RequireDeskService } from "@/features/desk/DeskServices";

export default function AgentDmtPage() {
  return (
    <RequireDeskService anyOf={["DMT"]} fallbackHref="/agent/dashboard">
      <ComingSoonPage title="Send money" description="Domestic money transfer from your counter." />
    </RequireDeskService>
  );
}
