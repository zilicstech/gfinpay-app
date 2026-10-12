import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ApplyNotice } from "@/app/apply/ApplyNotice";
import { completeEkyc } from "@/lib/apply-api";

export const dynamic = "force-dynamic";

export default async function EkycDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ data?: string }>;
}) {
  const { token } = await params;
  const { data } = await searchParams;
  if (!data) {
    return (
      <ApplyNotice
        title="eKYC is not finished"
        body="PaySprint did not confirm this eKYC yet. Close this page and open the link again."
      />
    );
  }

  const result = await completeEkyc(token, data);
  if (result.body.error) {
    return <ApplyNotice title="eKYC could not be confirmed" body={result.body.error.message} />;
  }
  if (!result.body.data?.completed) {
    return (
      <ApplyNotice
        title="eKYC is not finished"
        body="PaySprint has not marked Bank 2 eKYC as complete. Close this page and open the link again."
      />
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-8 inline-block">
          <Logo />
        </div>
        <div className="panel border border-slate-200/80 bg-white/95 p-8 shadow-2xl sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-navy-950">eKYC completed</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            PaySprint confirmed Bank 2 eKYC. You can close this page.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Gfinpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
