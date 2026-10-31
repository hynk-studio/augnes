import { NextResponse } from "next/server";
import { validateReadonlyApiLocalAccess } from "@/lib/readonly-api/access-guard";
import { localClientRequest, equal } from "@/lib/vnext/codex-repository-continuity/companion-local-channel";
import { loadCodexRepositoryResultWorkV01, RepositoryResultWorkTransportErrorV01 } from "@/lib/vnext/codex-repository-continuity/codex-repository-result-work";
import { CODEX_REPOSITORY_RESULT_WORK_MARKER_V01 as MARKER } from "@/types/vnext/codex-repository-result-work";
import { AuthoredSuccessorTaskErrorV01 } from "@/lib/vnext/authored-successor-task";
import { SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { InitialProjectWorkContextErrorV01 } from "@/lib/vnext/runtime/initial-project-work-context";
import { VNextLocalOperatorSessionErrorV01 } from "@/lib/vnext/runtime/local-operator-session";
import { DirectNativeHostRoundTripErrorV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "x-augnes-local-result-work": MARKER, "cache-control": "no-store" };
// Mutation input includes notes, definition changes and exact preview bindings.
// Match the native Browser envelope; canonical selection remains capped at 32,000.
const MAX_RESULT_WORK_REQUEST_BYTES = 64_000;

/** Explicitly authorized, narrow Companion task-context mutation channel.
 * The loopback guard is only a transport boundary. The opaque runtime credential
 * and exact instance/generation/repository identity authenticate every action.
 * Neither Browser cookies nor preview seals authenticate this route. */
export async function POST(request: Request) {
  if ([...new URL(request.url).searchParams.keys()].join(",") !== "scope") return refused("invalid_query", 400);
  const local = validateReadonlyApiLocalAccess(request, {
    route_id: "augnes.repository_result_work.v0.1",
    required_scope: "repository:local",
    required_marker_header: "x-augnes-local-result-work",
    required_marker_value: MARKER,
    allowed_hosts: ["localhost", "127.0.0.1", "::1"],
    route_family: "codex_repository_result_work",
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
  try {
    const text = await readResultWorkBody(request);
    let body;
    try { body = JSON.parse(text); } catch { return refused("invalid_json", 400); }
    const projection = await loadCodexRepositoryResultWorkV01(body, {
      key: process.env.AUGNES_COMPANION_PROXY_TOKEN!,
      instance_id: identity["x-augnes-runtime-instance"],
      generation_id: identity["x-augnes-runtime-generation"],
      repository_fingerprint: identity["x-augnes-runtime-repository"],
    });
    return NextResponse.json(projection, { headers: { ...HEADERS, ...identity } });
  } catch (error) {
    if (error instanceof AuthoredSuccessorTaskErrorV01) return refused(error.code, 409);
    if (error instanceof RepositoryResultWorkTransportErrorV01 || error instanceof SelectedWorkSourceError ||
      error instanceof InitialProjectWorkContextErrorV01 || error instanceof VNextLocalOperatorSessionErrorV01 ||
      error instanceof DirectNativeHostRoundTripErrorV01) return refused(error.code, error.status);
    return refused("result_work_unavailable", 503);
  }
}

// Keep this route's JSON/error contract. The Browser body helper also accepts
// form input and has different refusal codes; neither is part of this channel.
async function readResultWorkBody(request: Request): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, text = "";
  try {
    if (Number(request.headers.get("content-length")) > MAX_RESULT_WORK_REQUEST_BYTES) {
      throw new RepositoryResultWorkTransportErrorV01("request_too_large", 413);
    }
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESULT_WORK_REQUEST_BYTES) throw new RepositoryResultWorkTransportErrorV01("request_too_large", 413);
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally { reader.releaseLock(); }
}

function refused(code: string, status: number) {
  return NextResponse.json({ error: { code, status } }, { status, headers: HEADERS });
}
