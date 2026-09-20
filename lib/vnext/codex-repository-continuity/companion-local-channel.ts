import { timingSafeEqual } from "node:crypto";

export function localClientRequest(request: Request): boolean {
  // This is deliberately a native-client capability, not a new Browser read.
  // Next supplies loopback forwarding metadata even for direct local requests.
  const url = new URL(request.url);
  if (url.protocol !== "http:" || request.headers.has("origin") || request.headers.has("forwarded") || request.headers.has("x-original-host")) return false;
  if (request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "none") return false;
  for (const header of ["host", "x-forwarded-host"]) {
    const value = request.headers.get(header);
    // NextURL normalizes 127.0.0.1/[::1] to localhost, while preserving the
    // original Host header. Permit only these exact loopback spellings and the
    // same port, never arbitrary hostnames, comma lists or URL credentials.
    if (value !== null) {
      const match = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::([0-9]+))?$/u.exec(value);
      if (!match || (match[1] || "80") !== (url.port || "80")) return false;
    }
  }
  if (request.headers.has("host") && request.headers.has("x-forwarded-host") &&
      request.headers.get("host") !== request.headers.get("x-forwarded-host")) return false;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor !== null && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(forwardedFor)) return false;
  const proto = request.headers.get("x-forwarded-proto");
  const port = request.headers.get("x-forwarded-port");
  return (proto === null || proto === "http") && (port === null || port === (url.port || "80"));
}

export function equal(left: string | null, right: string | undefined): boolean {
  if (!left || !right) return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
