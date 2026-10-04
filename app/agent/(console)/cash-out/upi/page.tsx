"use client";

import { RequireDeskService } from "@/features/desk/DeskServices";
import { UpiCashoutDesk } from "@/features/cashout/UpiCashoutDesk";

export default function UpiCashoutPage() {
  return (
    <RequireDeskService anyOf={["UPI_CASHOUT"]} fallbackHref="/agent/dashboard">
      <UpiCashoutDesk />
    </RequireDeskService>
  );
}
