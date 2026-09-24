import { NewProjectWorkPreparationErrorV01 } from "@/lib/vnext/runtime/new-project-work-preparation";
import { localClientRequest, equal } from "@/lib/vnext/codex-repository-continuity/companion-local-channel";
import { NextResponse } from "next/server";
import { validateReadonlyApiLocalAccess } from "@/lib/readonly-api/access-guard";
import { loadCodexRepositoryWorkRevisionV01, RepositoryWorkRevisionTransportErrorV01 } from "@/lib/vnext/codex-repository-continuity/codex-repository-work-revision";
import { CODEX_REPOSITORY_WORK_REVISION_MARKER_V01 as MARKER } from "@/types/vnext/codex-repository-work-revision";

import { ProjectWorkRevisionErrorV01 } from "@/lib/vnext/runtime/project-work-revision";
import { InitialProjectWorkContextErrorV01 } from "@/lib/vnext/runtime/initial-project-work-context";
import { SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { PreExecutionProjectWorkRevisionErrorV01 } from "@/lib/vnext/runtime/pre-execution-project-work-revision";
import { VNextLocalOperatorSessionErrorV01 } from "@/lib/vnext/runtime/local-operator-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "x-augnes-local-work-revision": MARKER, "cache-control": "no-store" };

/** Explicitly authorized, narrow Companion task-context mutation channel.
 * The loopback guard is only a transport boundary. The opaque runtime credential
 * and exact instance/generation/repository identity authenticate every action.
 * Neither Browser cookies nor preview seals authenticate this route. */
export async function POST(request: Request) {
  if ([...new URL(request.url).searchParams.keys()].join(",") !== "scope") return refused("invalid_query", 400);
  const local = validateReadonlyApiLocalAccess(request, {
    route_id: "augnes.repository_work_revision.v0.1",
    required_scope: "repository:local",
    required_marker_header: "x-augnes-local-work-revision",
    required_marker_value: MARKER,
    allowed_hosts: ["localhost", "127.0.0.1", "::1"],
    route_family: "codex_repository_work_revision",
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
  try {
    const projection = await loadCodexRepositoryWorkRevisionV01(body, {
      key: process.env.AUGNES_COMPANION_PROXY_TOKEN!,
      instance_id: identity["x-augnes-runtime-instance"],
      generation_id: identity["x-augnes-runtime-generation"],
      repository_fingerprint: identity["x-augnes-runtime-repository"],
    });
    return NextResponse.json(projection, { headers: { ...HEADERS, ...identity } });
  } catch (error) {
    if (error instanceof NewProjectWorkPreparationErrorV01 || error instanceof RepositoryWorkRevisionTransportErrorV01 || error instanceof ProjectWorkRevisionErrorV01 ||
      error instanceof InitialProjectWorkContextErrorV01 || error instanceof SelectedWorkSourceError ||
      error instanceof PreExecutionProjectWorkRevisionErrorV01 || error instanceof VNextLocalOperatorSessionErrorV01) {
      return refused(error.code, error.status);
    }
    return refused("work_revision_unavailable", 503);
  }
}


function refused(code: string, status: number) {
  return NextResponse.json({ error: { code, status } }, { status, headers: HEADERS });
}
