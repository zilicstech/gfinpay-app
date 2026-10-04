"use client";

import { RequireDeskService } from "@/features/desk/DeskServices";
import { AepsDesk } from "@/features/aeps/AepsDesk";

export default function AgentAepsPage() {
  return (
    <RequireDeskService anyOf={["AEPS"]} fallbackHref="/agent/dashboard">
      <AepsDesk />
    </RequireDeskService>
  );
}
