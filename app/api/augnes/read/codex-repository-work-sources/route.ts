import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { validateReadonlyApiLocalAccess } from "@/lib/readonly-api/access-guard";
import { loadCodexRepositoryWorkSourcesV01 } from "@/lib/vnext/codex-repository-continuity/codex-repository-work-sources";
import { CODEX_REPOSITORY_WORK_SOURCES_ROUTE_MARKER_V01 as MARKER } from "@/types/vnext/codex-repository-work-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "x-augnes-local-readonly": MARKER, "cache-control": "no-store" };

/** Private Companion client route. Browser cookies grant no access here. */
export async function POST(request: Request) {
  if ([...new URL(request.url).searchParams.keys()].join(",") !== "scope") return refused("invalid_query", 400);
  const local = validateReadonlyApiLocalAccess(request, {
    route_id: "augnes.read.codex_repository_work_sources.v0.1",
    required_scope: "repository:local",
    required_marker_header: "x-augnes-local-readonly",
    required_marker_value: MARKER,
    allowed_hosts: ["localhost", "127.0.0.1", "::1"],
    route_family: "codex_repository_work_sources",
    allowed_methods: ["POST"],
  });
  if (!local.ok) return refused(local.code, local.status);
  if (!localClientRequest(request) || !equal(
    request.headers.get("x-augnes-companion-proxy"), process.env.AUGNES_COMPANION_PROXY_TOKEN,
  )) return refused("companion_channel_refused", 403);
  if (
    process.env.AUGNES_RECOVERY_MODE === "1" || process.env.AUGNES_RUNTIME_CHILD_ROLE !== "ui" ||
    !process.env.AUGNES_RUNTIME_INSTANCE_ID || !process.env.AUGNES_RUNTIME_GENERATION_ID ||
    !process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT
  ) return refused("companion_unavailable", 503);
  const identity = {
    "x-augnes-runtime-instance": process.env.AUGNES_RUNTIME_INSTANCE_ID,
    "x-augnes-runtime-generation": process.env.AUGNES_RUNTIME_GENERATION_ID,
    "x-augnes-runtime-repository": process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT,
  };
  if (Object.entries(identity).some(([name, value]) => request.headers.get(name) !== value)) {
    return refused("companion_identity_changed", 409);
  }
  if ((request.headers.get("content-type") ?? "").split(";", 1)[0] !== "application/json") {
    return refused("invalid_content_type", 415);
  }
  const text = await request.text();
  // Same bounded request envelope as repository Resume; source limits remain
  // owned by selected-work-source-comparison, with no truncation or new cap.
  if (Buffer.byteLength(text, "utf8") > 16 * 1024) return refused("request_too_large", 413);
  let body;
  try { body = JSON.parse(text); } catch { return refused("invalid_json", 400); }
  if (
    !body || Array.isArray(body) || typeof body !== "object" ||
    Object.keys(body).sort().join(",") !== "expected_snapshot_binding,repository_root" ||
    typeof body.repository_root !== "string" || typeof body.expected_snapshot_binding !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(body.expected_snapshot_binding)
  ) return refused("invalid_repository_input", 400);
  try {
    const projection = await loadCodexRepositoryWorkSourcesV01(body);
    return NextResponse.json(projection, { headers: { ...HEADERS, ...identity } });
  } catch {
    return refused("current_work_sources_unavailable", 503);
  }
}

function localClientRequest(request: Request): boolean {
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

function equal(left: string | null, right: string | undefined): boolean {
  if (!left || !right) return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function refused(code: string, status: number) {
  return NextResponse.json({ error: { code, status } }, { status, headers: HEADERS });
}
