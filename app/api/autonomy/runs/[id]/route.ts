import { NextResponse } from "next/server";

import {
  cancelAutonomyRun,
  getAutonomyRun,
  pauseAutonomyRun,
  resumeAutonomyRun,
  tickAutonomyRun,
} from "../../../../../lib/autonomy/runner";
import { buildDefaultRunnerAuthorityBoundary } from "../../../../../lib/autonomy/runner-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "autonomy_runner_run_detail_route.v0.1" as const;
const SCOPE = "project:augnes" as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const local = validateLocalOperatorRequest(request);
  if (!local.ok) return jsonResponse(errorResponse(local.code), local.status);

  const url = new URL(request.url);
  const dbPath = optionalSafeRouteDbPath(url.searchParams.get("db_path"));
  if (dbPath === false) return jsonResponse(errorResponse("invalid_db_path"), 400);
  const { id } = await params;
  const run = getAutonomyRun(decodeURIComponent(id), {
    dbPath: dbPath ?? undefined,
  });
  if (!run) return jsonResponse(errorResponse("not_found"), 404);
  if (run.scope !== SCOPE) return jsonResponse(errorResponse("invalid_scope"), 400);

  return jsonResponse({
    route_version: ROUTE_VERSION,
    runtime: "augnes",
    scope: run.scope,
    status: "ok",
    run,
    authority_boundary: buildDefaultRunnerAuthorityBoundary(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const local = validateLocalOperatorRequest(request, { requireSameOrigin: true });
  if (!local.ok) return jsonResponse(errorResponse(local.code), local.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(errorResponse("invalid_json_body"), 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(errorResponse("invalid_json_object"), 400);
  }

  const { id } = await params;
  const runId = decodeURIComponent(id);
  const inputBody = body as {
    action?: unknown;
    db_path?: unknown;
    now?: unknown;
    reason?: unknown;
  };
  const dbPath = optionalSafeRouteDbPath(inputBody.db_path);
  if (dbPath === false) return jsonResponse(errorResponse("invalid_db_path"), 400);
  const now = typeof inputBody.now === "string" ? inputBody.now : undefined;
  const reason =
    typeof inputBody.reason === "string" ? inputBody.reason : undefined;

  try {
    const common = { run_id: runId, now, reason, dbPath: dbPath ?? undefined };
    const run =
      inputBody.action === "tick"
        ? tickAutonomyRun(common)
        : inputBody.action === "pause"
          ? pauseAutonomyRun(common)
          : inputBody.action === "resume"
            ? resumeAutonomyRun(common)
            : inputBody.action === "cancel"
              ? cancelAutonomyRun(common)
              : null;

    if (!run) return jsonResponse(errorResponse("invalid_action"), 400);
    if (run.scope !== SCOPE) return jsonResponse(errorResponse("invalid_scope"), 400);

    return jsonResponse({
      route_version: ROUTE_VERSION,
      runtime: "augnes",
      scope: run.scope,
      status: "ok",
      action: inputBody.action,
      run,
      provider_openai_call_executed: false,
      github_call_executed: false,
      codex_execution_executed: false,
      memory_mutation_executed: false,
      durable_perspective_apply_executed: false,
      authority_boundary: buildDefaultRunnerAuthorityBoundary(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "run_action_failed";
    return jsonResponse(
      errorResponse(message),
      message.includes("not_found") ? 404 : 400,
    );
  }
}

function validateLocalOperatorRequest(
  request: Request,
  options: { requireSameOrigin?: boolean } = {},
):
  | { ok: true }
  | { ok: false; code: string; status: 400 | 403 } {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host || !isLocalTestHost(host)) {
    return { ok: false, code: "local_operator_host_required", status: 403 };
  }

  if (!options.requireSameOrigin) return { ok: true };

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return { ok: false, code: "same_origin_required", status: 403 };
  }

  const origin = request.headers.get("origin");
  if (!origin) return { ok: true };

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase()
      ? { ok: true }
      : { ok: false, code: "same_origin_required", status: 403 };
  } catch {
    return { ok: false, code: "same_origin_required", status: 403 };
  }
}

function isLocalTestHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(normalized) ||
    /^\[::1\](:\d+)?$/.test(normalized)
  );
}

function optionalSafeRouteDbPath(value: unknown): string | null | false {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!value.startsWith("data/") && !value.startsWith("tmp/")) return false;
  return value;
}

function errorResponse(errorCode: string) {
  return {
    route_version: ROUTE_VERSION,
    runtime: "augnes",
    scope: SCOPE,
    status: "error",
    error_code: errorCode,
    provider_openai_call_executed: false,
    github_call_executed: false,
    codex_execution_executed: false,
    memory_mutation_executed: false,
    durable_perspective_apply_executed: false,
    authority_boundary: buildDefaultRunnerAuthorityBoundary(),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}
