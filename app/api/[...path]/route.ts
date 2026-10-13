import { NextRequest, NextResponse } from "next/server";
import { proxyRequestHeaders, proxyResponse } from "@/lib/upstream-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

function proxyTarget() {
  const configured = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return "http://localhost:8090";
  return "";
}

function envelope(status: number, code: string, message: string, retriable: boolean) {
  return NextResponse.json(
    { data: null, error: { code, message, retriable }, meta: null },
    { status },
  );
}

async function proxy(request: NextRequest, path: string[]) {
  const target = proxyTarget();
  if (!target) {
    return envelope(503, "API_PROXY_UNCONFIGURED", "API proxy target is not configured", false);
  }

  const incoming = new URL(request.url);
  const destination = `${target}/api/${path.map(encodeURIComponent).join("/")}${incoming.search}`;

  const headers = proxyRequestHeaders(request);

  const init: RequestInit = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(destination, init);
  } catch {
    return envelope(502, "API_UNAVAILABLE", "Could not reach the API", true);
  }

  return proxyResponse(upstream);
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
