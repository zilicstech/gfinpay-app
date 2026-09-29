"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api-base";

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [payload, setPayload] = useState<{ url: string; encdata: string; method?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/v1/public/apply/${token}/start`, { method: "POST" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || body.error) throw new Error(body.error?.message ?? "Could not start the application");
        setPayload(body.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"));
  }, [token]);

  useEffect(() => {
    if (!payload) return;
    if (payload.method === "GET" || !payload.encdata) {
      window.location.href = payload.url;
      return;
    }
    if (formRef.current) formRef.current.submit();
  }, [payload]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4">
        <p className="max-w-sm text-center text-sm text-rose-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-white px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-4 text-sm text-navy-600">Opening your application…</p>
      </div>
      {payload && (
        <form ref={formRef} method="post" action={payload.url} className="hidden">
          <textarea name="encdata" readOnly defaultValue={payload.encdata} />
        </form>
      )}
    </div>
  );
}
