import { notFound } from "next/navigation";
import { ApplyHandoff } from "@/app/apply/ApplyHandoff";
import { ApplyNotice } from "@/app/apply/ApplyNotice";
import { lookupEkyc, startEkyc } from "@/lib/apply-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function EkycLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) notFound();

  const status = await lookupEkyc(token);
  if (status.body.error?.code === "LINK_NOT_FOUND") {
    notFound();
  }
  if (status.body.data && status.body.data.active === false) {
    return (
      <ApplyNotice
        title="eKYC is already completed"
        body="This retailer has finished PaySprint eKYC. You can close this page."
      />
    );
  }
  if (status.body.error && status.status !== 404) {
    return <ApplyNotice title="Unable to open this link" body={status.body.error.message} />;
  }

  const started = await startEkyc(token);
  if (started.body.error?.code === "LINK_NOT_FOUND") {
    notFound();
  }
  if (started.body.error?.code === "EKYC_COMPLETED") {
    return (
      <ApplyNotice
        title="eKYC is already completed"
        body="This retailer has finished PaySprint eKYC. You can close this page."
      />
    );
  }
  if (started.body.error || !started.body.data?.url) {
    return (
      <ApplyNotice
        title="Unable to open this link"
        body={started.body.error?.message ?? "PaySprint eKYC could not be started. Ask for a new link."}
      />
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4">
      <ApplyHandoff
        url={started.body.data.url}
        encdata=""
        method="GET"
        title="Connecting to PaySprint eKYC"
        body="Please wait while Gfinpay redirects you to PaySprint to finish retailer eKYC."
        points={[
          "PAN, Aadhaar, and fingerprint are completed on PaySprint",
          "Open this on a computer with a UIDAI fingerprint scanner",
        ]}
      />
    </main>
  );
}
