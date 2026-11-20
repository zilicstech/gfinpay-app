"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, RefreshCw, Terminal } from "lucide-react";
import { when } from "@/lib/format";

export type ProviderApiLogRow = {
  id: string;
  callId: string;
  requestId?: string | null;
  direction: "OUTBOUND" | "INBOUND_WEBHOOK" | string;
  flow: string;
  httpMethod: string;
  url: string;
  endpointPath: string;
  userId?: string | null;
  outletCode?: string | null;
  externalRef?: string | null;
  providerTxnId?: string | null;
  requestHeaders?: Record<string, unknown>;
  requestBody?: string | null;
  httpStatus?: number | null;
  providerCode?: string | null;
  providerMessage?: string | null;
  responseHeaders?: Record<string, unknown>;
  responseBody?: string | null;
  errorMessage?: string | null;
  latencyMs?: number | null;
  createdAt?: string | null;
  provider?: string | null;
};

function prettyBody(raw?: string | null): string {
  if (!raw) return "(empty)";
  const trimmed = raw.trim();
  if (!trimmed) return "(empty)";
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return raw;
  }
}

function supportTrace(brand: string, log: ProviderApiLogRow): string {
  const lines = [
    `=== ${(log.provider || brand).toUpperCase()} API REQUEST & RESPONSE TRACE ===`,
    `Call ID: ${log.callId}`,
    `X-Request-Id: ${log.requestId || "N/A"}`,
    `Timestamp: ${log.createdAt || "N/A"}`,
    `Direction / Flow: ${log.direction} / ${log.flow}`,
    `Endpoint: ${log.httpMethod} ${log.url || log.endpointPath}`,
    `Outlet Code: ${log.outletCode || "N/A"}`,
    `External Ref: ${log.externalRef || "N/A"}`,
    `Provider Txn ID: ${log.providerTxnId || "N/A"}`,
    `HTTP Status: ${log.httpStatus ?? "NETWORK_ERROR"} | Provider Code: ${log.providerCode || "N/A"} | Latency: ${log.latencyMs ?? 0} ms`,
  ];
  if (log.errorMessage) {
    lines.push(`Error: ${log.errorMessage}`);
  }
  lines.push(
    "",
    "--- REQUEST HEADERS ---",
    JSON.stringify(log.requestHeaders ?? {}, null, 2),
    "",
    "--- REQUEST BODY ---",
    prettyBody(log.requestBody),
    "",
    "--- RESPONSE HEADERS ---",
    JSON.stringify(log.responseHeaders ?? {}, null, 2),
    "",
    "--- RESPONSE BODY ---",
    prettyBody(log.responseBody),
  );
  return lines.join("\n");
}

export function ProviderApiTraceSection({
  brand,
  description,
  emptyText,
  logs,
  loading,
  onRefresh,
}: {
  brand: string;
  description: string;
  emptyText: string;
  logs: ProviderApiLogRow[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<"ALL" | "OUTBOUND" | "INBOUND_WEBHOOK">("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const providers = Array.from(new Set(logs.map((log) => log.provider).filter((name): name is string => !!name)));

  const filteredLogs = logs.filter((log) => {
    if (direction !== "ALL" && log.direction !== direction) return false;
    if (providerFilter !== "ALL" && log.provider !== providerFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (log.provider || "").toLowerCase().includes(q) ||
      (log.flow || "").toLowerCase().includes(q) ||
      (log.endpointPath || "").toLowerCase().includes(q) ||
      (log.externalRef || "").toLowerCase().includes(q) ||
      (log.providerTxnId || "").toLowerCase().includes(q) ||
      (log.providerCode || "").toLowerCase().includes(q) ||
      (log.callId || "").toLowerCase().includes(q)
    );
  });

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold text-navy-950">
                {brand} API Request &amp; Response Trace Logs
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                {logs.length} captured
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                const bundle = filteredLogs.map((log) => supportTrace(brand, log)).join("\n\n" + "=".repeat(60) + "\n\n");
                await navigator.clipboard.writeText(bundle);
                setCopiedKey("all");
                setTimeout(() => setCopiedKey((prev) => (prev === "all" ? null : prev)), 2000);
              }}
              className="btn-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
            >
              {copiedKey === "all" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied Bundle!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Filtered Logs
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing…" : "Refresh Logs"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
        {providers.length > 1 && (
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {["ALL", ...providers].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setProviderFilter(name)}
                className={`rounded-lg px-3 py-1 transition ${
                  providerFilter === name ? "bg-white text-navy-950 shadow-sm" : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {name === "ALL" ? "All providers" : name}
              </button>
            ))}
          </div>
        )}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {(
            [
              { id: "ALL", label: "All Traces" },
              { id: "OUTBOUND", label: "Outbound API" },
              { id: "INBOUND_WEBHOOK", label: "Inbound Webhooks" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDirection(tab.id)}
              className={`rounded-lg px-3 py-1 transition ${
                direction === tab.id ? "bg-white text-navy-950 shadow-sm" : "text-slate-600 hover:text-navy-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by flow, endpoint, externalRef, txnId, status code…"
          className="field !py-1.5 !px-3 !text-xs w-full sm:w-80"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
          {logs.length === 0 ? emptyText : "No trace entries match the current filter."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const httpOk = log.httpStatus != null && log.httpStatus >= 200 && log.httpStatus < 300 && !log.errorMessage;
            const isWebhook = log.direction === "INBOUND_WEBHOOK";
            return (
              <div
                key={log.id}
                className={`rounded-2xl border transition-all ${
                  httpOk ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/30"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {log.provider && (
                      <span className="rounded-md bg-navy-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        {log.provider}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isWebhook ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {isWebhook ? "WEBHOOK" : "OUTBOUND"}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                        httpOk ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.httpStatus != null ? `HTTP ${log.httpStatus}` : "NET ERR"}
                      {log.providerCode ? ` · ${log.providerCode}` : ""}
                    </span>
                    <span className="font-bold text-navy-950">{log.flow}</span>
                    <span className="font-mono text-[11px] text-slate-600 truncate max-w-md" title={log.url}>
                      {log.httpMethod} {log.endpointPath}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{log.latencyMs ?? 0}ms</span>
                    <span className="text-[11px] text-slate-400">{when(log.createdAt || undefined)}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(supportTrace(brand, log));
                        setCopiedKey(log.id);
                        setTimeout(() => setCopiedKey((prev) => (prev === log.id ? null : prev)), 2000);
                      }}
                      className="btn-secondary !py-1 !px-2.5 !text-[11px] inline-flex items-center gap-1"
                      title={`Copy formatted request and response for ${brand} support`}
                    >
                      {copiedKey === log.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy Req + Res
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="btn-secondary !py-1 !px-2.5 !text-[11px] inline-flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          Hide <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Payload <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-3.5 py-2 text-[11px] text-slate-500">
                  <span>
                    Call ID: <strong className="font-mono text-slate-700">{log.callId}</strong>
                  </span>
                  {log.outletCode && (
                    <span>
                      Outlet: <strong className="font-mono text-slate-700">{log.outletCode}</strong>
                    </span>
                  )}
                  {log.externalRef && (
                    <span>
                      Ref: <strong className="font-mono text-slate-700">{log.externalRef}</strong>
                    </span>
                  )}
                  {log.providerTxnId && (
                    <span>
                      Provider Txn: <strong className="font-mono text-slate-700">{log.providerTxnId}</strong>
                    </span>
                  )}
                  {log.providerMessage && (
                    <span className="text-slate-600 truncate max-w-md" title={log.providerMessage}>
                      Msg: <strong>{log.providerMessage}</strong>
                    </span>
                  )}
                  {log.errorMessage && <span className="text-rose-700 font-semibold">Error: {log.errorMessage}</span>}
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-950 text-slate-100 rounded-b-2xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                      <span>
                        {log.httpMethod} {log.url || log.endpointPath}
                      </span>
                      {log.requestId && <span>X-Request-Id: {log.requestId}</span>}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="space-y-2 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                          Request Headers &amp; Body
                        </div>
                        <pre className="overflow-x-auto rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-slate-300 max-h-40">
                          {JSON.stringify(log.requestHeaders ?? {}, null, 2)}
                        </pre>
                        <pre className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-emerald-200 max-h-80">
                          {prettyBody(log.requestBody)}
                        </pre>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Response Headers &amp; Body (HTTP {log.httpStatus ?? "ERR"})
                        </div>
                        <pre className="overflow-x-auto rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-slate-300 max-h-40">
                          {JSON.stringify(log.responseHeaders ?? {}, null, 2)}
                        </pre>
                        <pre className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] leading-relaxed text-amber-100 max-h-80">
                          {prettyBody(log.responseBody)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
