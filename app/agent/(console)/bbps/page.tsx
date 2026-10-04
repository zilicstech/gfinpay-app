"use client";

import { RequireDeskService } from "@/features/desk/DeskServices";
import { BillPayDesk } from "@/features/bills/BillPayDesk";

export default function BbpsPage() {
  return (
    <RequireDeskService anyOf={["BBPS"]} fallbackHref="/agent/dashboard">
      <BillPayDesk />
    </RequireDeskService>
  );
}
