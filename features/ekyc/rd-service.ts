const FIRST_PORT = 11100;
const LAST_PORT = 11120;

export class RdError extends Error {
  constructor(
    readonly reason: "no_rd_service" | "cors_blocked" | "device_info_failed" | "capture_failed",
    message: string,
    readonly errCode = "",
    readonly errInfo = "",
    readonly shape = "",
  ) {
    super(message);
  }
}

export type DeviceInfo = {
  port: number;
  serial: string;
  model: string;
  dpId: string;
  rdsId: string;
};

export type CaptureResult = DeviceInfo & {
  pidData: string;
  qScore: string;
  tookMs: number;
  shape: string;
};

function log(stage: string, fields: Record<string, string | number | boolean>) {
  const extra = Object.entries(fields).map(([key, value]) => `${key}=${value}`).join(" ");
  console.info(`MERCHANT_EKYC device stage=${stage} ${extra}`);
}

export type RdService = {
  port: number;
  rootUrl: string;
  infoUrl: string;
  captureUrl: string;
};

async function callUrl(url: string, method: string, body?: string) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "text/xml" } : undefined,
    body,
  });
  return response.text();
}

function attr(xml: string, name: string) {
  const match = xml.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match?.[1] ?? "";
}

function unique(values: string[]) {
  return [...new Set(values)];
}

/** Android Mantra publishes /rd/info and /rd/capture. Windows often answers on /. */
function interfaceUrl(xml: string, id: string, rootUrl: string) {
  const blocks = xml.match(/<Interface\b[^>]*>/gi) ?? [];
  for (const block of blocks) {
    if (attr(block, "id").toUpperCase() !== id) continue;
    const path = attr(block, "path").trim();
    if (!path) return rootUrl;
    if (/^https?:\/\//i.test(path)) {
      try {
        const url = new URL(path);
        if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return url.toString();
      } catch {
        return rootUrl;
      }
      return rootUrl;
    }
    const suffix = path.startsWith("/") ? path : `/${path}`;
    return `${rootUrl.replace(/\/$/, "")}${suffix}`;
  }
  return rootUrl;
}

export async function discover(): Promise<RdService> {
  let cors = false;
  for (let port = FIRST_PORT; port <= LAST_PORT; port += 1) {
    for (const protocol of ["http", "https"] as const) {
      const rootUrl = `${protocol}://127.0.0.1:${port}/`;
      try {
        const xml = await callUrl(rootUrl, "RDSERVICE");
        if (!xml.includes("RDService") && !xml.includes("rdservice")) continue;
        const status = attr(xml, "status").toUpperCase();
        if (status === "NOTREADY") {
          throw new RdError(
            "no_rd_service",
            "The scanner service is running, but the device is not connected. Plug it in and try again.",
          );
        }
        if (status === "USED") {
          throw new RdError(
            "no_rd_service",
            "The scanner is in use by another app. Close that app and try again.",
          );
        }
        const service: RdService = {
          port,
          rootUrl,
          infoUrl: interfaceUrl(xml, "DEVICEINFO", rootUrl),
          captureUrl: interfaceUrl(xml, "CAPTURE", rootUrl),
        };
        log("DISCOVER", { ok: true, port, info: service.infoUrl, capture: service.captureUrl });
        return service;
      } catch (error) {
        if (error instanceof RdError) throw error;
        if (error instanceof TypeError) cors = true;
      }
    }
  }
  log("DISCOVER", { ok: false, ports_tried: LAST_PORT - FIRST_PORT + 1, reason: cors ? "cors_blocked" : "no_rd_service" });
  if (cors) {
    throw new RdError(
      "cors_blocked",
      "The scanner is running but it is blocking this page. Allow this website in the scanner service, then try again.",
    );
  }
  throw new RdError(
    "no_rd_service",
    "The fingerprint scanner service is not running. Start the RD service for this scanner, then try again.",
  );
}

export async function deviceInfo(service: RdService): Promise<DeviceInfo> {
  for (const url of unique([service.infoUrl, service.rootUrl])) {
    try {
      const xml = await callUrl(url, "DEVICEINFO");
      const model = attr(xml, "mi");
      if (!model && !xml.toLowerCase().includes("deviceinfo")) continue;
      const info: DeviceInfo = {
        port: service.port,
        serial: attr(xml, "srno") || attr(xml, "srNo"),
        model,
        dpId: attr(xml, "dpId"),
        rdsId: attr(xml, "rdsId"),
      };
      log("DEVICE_INFO", { ok: true, port: service.port, model: info.model, serial: info.serial });
      return info;
    } catch {
      // The published path can be absent on Windows, which answers on the root URL.
    }
  }
  log("DEVICE_INFO", { ok: false, port: service.port, reason: "device_info_failed" });
  throw new RdError(
    "device_info_failed",
    "The scanner was found, but its details could not be read. Reconnect it and try again.",
  );
}

/** Drivers reject the capture XML before reading a finger. A later shape is tried only for those rejections. */
const XML_REJECTED = new Set([
  "100", "110", "120", "130", "140", "150", "170", "180", "190", "200", "210", "220", "760", "-1524",
]);

function xmlAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function pidShapes(env: string, wadh: string, device: DeviceInfo) {
  const e = xmlAttr(env);
  const w = xmlAttr(wadh);
  const eko = `<PidOptions ver="1.0"><Opts fCount="1" fType="2" format="0" pidVer="2.0" timeout="10000" otp="" wadh="${w}" posh="UNKNOWN" env="${e}"/></PidOptions>`;
  const mantra = `<PidOptions ver="1.0"><Opts env="${e}" fCount="1" fType="2" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" wadh="${w}"/></PidOptions>`;
  const full = `<PidOptions ver="1.0"><Opts fCount="1" fType="2" iCount="0" iType="0" pCount="0" pType="0" format="0" pidVer="2.0" timeout="10000" otp="" wadh="${w}" posh="UNKNOWN" env="${e}"/></PidOptions>`;
  const spec = `<PidOptions ver="1.0" env="${e}"><Opts fCount="1" fType="2" format="0" pidVer="2.0" timeout="10000" otp="" wadh="${w}" posh="UNKNOWN"/></PidOptions>`;
  const id = `${device.rdsId} ${device.dpId} ${device.model}`.toLowerCase();
  const morpho = id.includes("idemia") || id.includes("morpho") || id.includes("cbme") || id.includes("smartchip");
  return morpho
    ? [
        { name: "eko", xml: eko },
        { name: "full", xml: full },
        { name: "spec", xml: spec },
        { name: "mantra", xml: mantra },
      ]
    : [
        { name: "mantra", xml: mantra },
        { name: "eko", xml: eko },
        { name: "full", xml: full },
        { name: "spec", xml: spec },
      ];
}

async function captureXml(service: RdService, body: string) {
  let last = "";
  for (const url of unique([service.captureUrl, service.rootUrl])) {
    try {
      const xml = await callUrl(url, "CAPTURE", body);
      if (xml.includes("PidData") || xml.includes("errCode") || xml.includes("Resp")) return xml;
      last = xml;
    } catch {
      // Try the root URL when the published path does not answer.
    }
  }
  return last;
}

export async function capture(service: RdService, env: string, wadh: string, device: DeviceInfo): Promise<CaptureResult> {
  const started = Date.now();
  const tried: string[] = [];
  let lastCode = "";
  let lastInfo = "";
  for (const shape of pidShapes(env, wadh, device)) {
    const xml = await captureXml(service, shape.xml);
    const errCode = attr(xml, "errCode");
    const errInfo = attr(xml, "errInfo");
    const tookMs = Date.now() - started;
    if (!errCode || errCode === "0") {
      if (!xml.includes("PidData")) {
        log("CAPTURE", { ok: false, shape: shape.name, errCode: errCode || "empty", errInfo, pid_length: xml.length });
        throw new RdError("capture_failed", "The scanner did not return a fingerprint. Scan again.", errCode, errInfo, shape.name);
      }
      const qScore = attr(xml, "qScore");
      log("CAPTURE", { ok: true, shape: shape.name, serial: device.serial, qScore, pid_length: xml.length, took_ms: tookMs });
      return { ...device, pidData: xml, qScore, tookMs, shape: shape.name };
    }
    tried.push(`${shape.name}:${errCode}`);
    lastCode = errCode;
    lastInfo = errInfo;
    log("CAPTURE", { ok: false, shape: shape.name, errCode, errInfo, model: device.model, took_ms: tookMs });
    if (!XML_REJECTED.has(errCode)) break;
  }
  throw new RdError(
    "capture_failed",
    lastInfo || "The scanner could not read the finger. Try again.",
    lastCode,
    lastInfo,
    tried.join(","),
  );
}

export function readLocation(): Promise<{ latitude: string; longitude: string }> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(new Error("This browser shares location only on https or localhost. Enter the latitude and longitude instead."));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error("This browser cannot share location. Enter the latitude and longitude instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
      }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Allow location so cash out eKYC can continue."));
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(new Error("Location took too long. Try Allow location again."));
          return;
        }
        reject(new Error("This computer could not read its location. Try again."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
