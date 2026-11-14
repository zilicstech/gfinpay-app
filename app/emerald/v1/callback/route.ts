import { NextRequest, NextResponse } from "next/server";
import { proxyRequestHeaders, proxyResponse } from "@/lib/upstream-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function proxyTarget() {
  const configured = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return "http://localhost:8090";
  return "";
}

function errorResponse(status: number, message: string) {
  return NextResponse.json(
    { status: "ERROR", message },
    { status },
  );
}

async function handle(request: NextRequest) {
  const target = proxyTarget();
  if (!target) {
    return errorResponse(503, "API proxy target is not configured");
  }

  const incoming = new URL(request.url);
  const destination = `${target}/emerald/v1/callback${incoming.search}`;
  const headers = proxyRequestHeaders(request);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(destination, init);
  } catch {
    return errorResponse(502, "Could not reach upstream callback service");
  }

  return proxyResponse(upstream);
}

export const POST = handle;
export const GET = handle;

