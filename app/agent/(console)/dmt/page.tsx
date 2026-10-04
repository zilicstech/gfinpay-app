"use client";

import { RequireDeskService } from "@/features/desk/DeskServices";
import { DmtDesk } from "@/features/dmt/DmtDesk";

export default function AgentDmtPage() {
  return (
    <RequireDeskService anyOf={["DMT"]} fallbackHref="/agent/dashboard">
      <DmtDesk />
    </RequireDeskService>
  );
}
