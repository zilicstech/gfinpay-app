"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DONE_MESSAGE = "ps-dmt-ao-done";

/** PaySprint sends the customer here after account opening. Tell the desk, then close. */
export default function DmtAccountOpeningReturnPage() {
  const router = useRouter();

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(DONE_MESSAGE, window.location.origin);
      window.close();
      return;
    }
    router.replace("/agent/dmt");
  }, [router]);

  return <p className="p-8 text-sm text-slate-600">Account opening is finished. You can close this page.</p>;
}
