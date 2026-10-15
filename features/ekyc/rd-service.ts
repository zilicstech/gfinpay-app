const FIRST_PORT = 11100;
const LAST_PORT = 11120;

export class RdError extends Error {
  constructor(
    readonly reason: "no_rd_service" | "cors_blocked" | "capture_failed",
    message: string,
    readonly errCode = "",
    readonly errInfo = "",
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
};

function log(stage: string, fields: Record<string, string | number | boolean>) {
  const extra = Object.entries(fields).map(([key, value]) => `${key}=${value}`).join(" ");
  console.info(`MERCHANT_EKYC device stage=${stage} ${extra}`);
}

async function call(port: number, method: string, body?: string) {
  const response = await fetch(`http://127.0.0.1:${port}/`, {
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

export async function discover(): Promise<number> {
  let cors = false;
  for (let port = FIRST_PORT; port <= LAST_PORT; port += 1) {
    try {
      const xml = await call(port, "RDSERVICE");
      if (xml.includes("RDService") || xml.includes("rdservice")) {
        log("DISCOVER", { ok: true, port });
        return port;
      }
    } catch (error) {
      if (error instanceof TypeError) cors = true;
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

export async function deviceInfo(port: number): Promise<DeviceInfo> {
  const xml = await call(port, "DEVICEINFO");
  const info: DeviceInfo = {
    port,
    serial: attr(xml, "srno") || attr(xml, "srNo"),
    model: attr(xml, "mi"),
    dpId: attr(xml, "dpId"),
    rdsId: attr(xml, "rdsId"),
  };
  log("DEVICE_INFO", { ok: true, port, model: info.model, serial: info.serial });
  return info;
}

/** Idemia checks the UIDAI spec: env belongs on PidOptions. Mantra reads env from Opts. */
function pidOptions(env: string, wadh: string, device: DeviceInfo) {
  const id = `${device.rdsId} ${device.dpId} ${device.model}`.toLowerCase();
  const idemia = id.includes("idemia") || id.includes("morpho") || id.includes("cbme");
  if (idemia) {
    return `<PidOptions ver="1.0" env="${env}"><Opts fCount="1" fType="2" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" wadh="${wadh}"/></PidOptions>`;
  }
  return `<PidOptions ver="1.0"><Opts env="${env}" fCount="1" fType="2" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" wadh="${wadh}"/></PidOptions>`;
}

export async function capture(port: number, env: string, wadh: string, device: DeviceInfo): Promise<CaptureResult> {
  const started = Date.now();
  const options = pidOptions(env, wadh, device);
  const xml = await call(port, "CAPTURE", options);
  const errCode = attr(xml, "errCode");
  const errInfo = attr(xml, "errInfo");
  const tookMs = Date.now() - started;
  if (errCode && errCode !== "0") {
    log("CAPTURE", { ok: false, errCode, errInfo, model: device.model, took_ms: tookMs });
    throw new RdError("capture_failed", errInfo || "The scanner could not read the finger. Try again.", errCode, errInfo);
  }
  if (!xml.includes("PidData")) {
    log("CAPTURE", { ok: false, errCode: errCode || "empty", errInfo, pid_length: xml.length });
    throw new RdError("capture_failed", "The scanner did not return a fingerprint. Scan again.", errCode, errInfo);
  }
  const qScore = attr(xml, "qScore");
  log("CAPTURE", { ok: true, serial: device.serial, qScore, pid_length: xml.length, took_ms: tookMs });
  return { ...device, pidData: xml, qScore, tookMs };
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
