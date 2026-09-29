"use client";

import { ComingSoonPage } from "@/features/console/ComingSoonPage";
import { RequireDeskService } from "@/features/desk/DeskServices";

export default function UpiCashoutPage() {
  return (
    <RequireDeskService anyOf={["UPI_CASHOUT"]} fallbackHref="/agent/dashboard">
      <ComingSoonPage title="UPI to cash" description="Customer pays on UPI. You hand over cash at the counter." />
    </RequireDeskService>
  );
}
