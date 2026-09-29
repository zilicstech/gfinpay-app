"use client";

import { useEffect, useRef } from "react";

export function ApplyHandoff({
  url,
  encdata,
  method,
}: {
  url: string;
  encdata: string;
  method?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (method === "GET" || !encdata) {
      window.location.replace(url);
      return;
    }
    formRef.current?.submit();
  }, [url, encdata, method]);

  if (method === "GET" || !encdata) {
    return (
      <ApplyOpening />
    );
  }

  return (
    <>
      <ApplyOpening />
      <form ref={formRef} method="post" action={url} className="hidden">
        <textarea name="encdata" readOnly defaultValue={encdata} />
      </form>
    </>
  );
}

function ApplyOpening() {
  return (
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <p className="mt-4 text-sm text-navy-600">Opening your application…</p>
    </div>
  );
}
