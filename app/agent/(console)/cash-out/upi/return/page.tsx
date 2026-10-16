"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DONE_MESSAGE = "ps-upi-cashout-done";

/** PaySprint sends the cash-out window here. Tell the desk, then close. */
export default function UpiCashoutReturnPage() {
  const router = useRouter();

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(DONE_MESSAGE, window.location.origin);
      window.close();
      return;
    }
    router.replace("/agent/cash-out/upi");
  }, [router]);

  return (
    <p className="p-8 text-sm text-slate-600">Finishing up…</p>
  );
}
