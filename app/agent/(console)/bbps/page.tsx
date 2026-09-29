"use client";

import { ComingSoonPage } from "@/features/console/ComingSoonPage";
import { RequireDeskService } from "@/features/desk/DeskServices";

export default function BbpsPage() {
  return (
    <RequireDeskService anyOf={["BBPS"]} fallbackHref="/agent/dashboard">
      <ComingSoonPage title="Pay a bill" description="Electricity, water, gas, broadband, and other BBPS bills." />
    </RequireDeskService>
  );
}
