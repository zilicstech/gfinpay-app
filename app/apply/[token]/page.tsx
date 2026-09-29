import { notFound, redirect } from "next/navigation";
import { ApplyHandoff } from "../ApplyHandoff";
import { ApplyNotice } from "../ApplyNotice";
import { lookupApply, startApply } from "@/lib/apply-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ApplyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) notFound();

  const status = await lookupApply(token);
  if (status.status === 404 || status.body.error?.code === "LINK_NOT_FOUND") {
    notFound();
  }
  if (status.body.data && status.body.data.active === false) {
    return (
      <ApplyNotice
        title="This link is no longer active"
        body="The application has already been completed or closed. You can close this page."
      />
    );
  }
  if (status.body.error) {
    return <ApplyNotice title="Unable to open this link" body={status.body.error.message} />;
  }

  const started = await startApply(token);
  if (started.status === 404 || started.body.error?.code === "LINK_NOT_FOUND") {
    notFound();
  }
  if (started.body.error?.code === "LEAD_CLOSED") {
    return (
      <ApplyNotice
        title="This link is no longer active"
        body="The application has already been completed or closed. You can close this page."
      />
    );
  }
  if (started.body.error || !started.body.data?.url) {
    return (
      <ApplyNotice
        title="Unable to open this link"
        body={started.body.error?.message ?? "The application could not be started. Please ask the retailer for a new link."}
      />
    );
  }

  const payload = started.body.data;
  if (payload.method === "GET" || !payload.encdata) {
    redirect(payload.url);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      <ApplyHandoff url={payload.url} encdata={payload.encdata} method={payload.method} />
    </main>
  );
}
