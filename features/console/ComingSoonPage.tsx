"use client";

import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";

export function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-navy-900/15 bg-white px-6 py-16 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black text-emerald-300">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="mt-4 font-semibold text-navy-950">Feature coming soon</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
          This service is not live yet. You will be able to use it here once it is integrated.
        </p>
      </div>
    </div>
  );
}
