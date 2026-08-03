import { loadCodexRepositoryContinuityV01 } from "@/lib/vnext/codex-repository-continuity/codex-repository-continuity";
import { validateReadonlyApiLocalAccess } from "@/lib/readonly-api/access-guard";
import { CODEX_REPOSITORY_CONTINUITY_ROUTE_MARKER_V01 } from "@/types/vnext/codex-repository-continuity";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADER = "x-augnes-local-readonly";
const RESPONSE_HEADERS = {
  [HEADER]: CODEX_REPOSITORY_CONTINUITY_ROUTE_MARKER_V01,
  "cache-control": "no-store",
} as const;

export async function POST(request: Request) {
  const local = validateReadonlyApiLocalAccess(request, {
    route_id: "augnes.read.codex_repository_continuity.v0.1",
    required_scope: "repository:local",
    required_marker_header: HEADER,
    required_marker_value: CODEX_REPOSITORY_CONTINUITY_ROUTE_MARKER_V01,
    allowed_hosts: ["localhost", "127.0.0.1", "::1"],
    route_family: "codex_repository_continuity",
    allowed_methods: ["POST"],
  });
  if (!local.ok) return routeErrorV01(local.code, local.status);
  if (!liveCompanionIdentityV01()) return routeErrorV01("companion_unavailable", 503);
  if ((request.headers.get("content-type") ?? "").split(";", 1)[0] !== "application/json") {
    return routeErrorV01("invalid_content_type", 415);
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > 16 * 1024) return routeErrorV01("request_too_large", 413);
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    return routeErrorV01("invalid_json", 400);
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof (body as { repository_root?: unknown }).repository_root !== "string"
  ) {
    return routeErrorV01("invalid_repository_input", 400);
  }
  try {
    const projection = await loadCodexRepositoryContinuityV01({
      repository_root: (body as { repository_root: string }).repository_root,
      browser_base_url: new URL(request.url).origin,
    });
    return NextResponse.json(projection, {
      status: 200,
      headers: { ...RESPONSE_HEADERS, ...runtimeIdentityHeadersV01() },
    });
  } catch {
    return routeErrorV01("continuity_unavailable", 503);
  }
}

function liveCompanionIdentityV01(): boolean {
  return process.env.AUGNES_RECOVERY_MODE !== "1" &&
    process.env.AUGNES_RUNTIME_CHILD_ROLE === "ui" &&
    Boolean(process.env.AUGNES_RUNTIME_INSTANCE_ID) &&
    Boolean(process.env.AUGNES_RUNTIME_GENERATION_ID) &&
    Boolean(process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT);
}

function runtimeIdentityHeadersV01(): Record<string, string> {
  return {
    "x-augnes-runtime-instance": process.env.AUGNES_RUNTIME_INSTANCE_ID!,
    "x-augnes-runtime-generation": process.env.AUGNES_RUNTIME_GENERATION_ID!,
    "x-augnes-runtime-repository": process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT!,
  };
}

function routeErrorV01(code: string, status: number) {
  return NextResponse.json({
    response_version: "codex_repository_continuity_route_response.v0.1",
    error: { code, status },
    authority: {
      read_only: true,
      writes_database: false,
      changes_project_selection: false,
      creates_run: false,
      starts_codex_or_native_host: false,
    },
  }, { status, headers: RESPONSE_HEADERS });
}
