import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildRebuildableRetrievalIndexV01,
  createRebuildableRetrievalIndexRuntimeBoundaryV01,
  rebuildResearchRetrievalIndexV01,
  RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01,
  type ResearchRetrievalIndexRebuildInputV01,
  type ResearchRetrievalIndexRebuildResultV01,
  validateRebuildableRetrievalIndexBuildInputV01,
} from "@/lib/research-retrieval/rebuild-index";
import {
  createResearchRetrievalIndexAuthorityBoundaryV01,
  createReadOnlyRebuildableRetrievalIndexStoreSnapshotV01,
  ensureResearchRetrievalIndexSchemaV01,
  isSafeResearchRetrievalDbPathV01,
  rebuildableRetrievalIndexRuntimeDerivedStoreV01,
} from "@/lib/research-retrieval/index-store";

export const runtime = "nodejs";

const completionRebuildRouteVersion =
  "rebuildable_retrieval_index_runtime_completion_rebuild_route.v0.1" as const;

export async function POST(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required"), 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(errorResponse("invalid_json_body"), 400);
  }

  if (!isRecord(body)) {
    return jsonResponse(errorResponse("json_object_required"), 400);
  }

  if (isCompletionRebuildRouteBody(body)) {
    return handleCompletionRebuildRoute(body);
  }

  const validation = validateRebuildableRetrievalIndexBuildInputV01(body);
  const report = buildRebuildableRetrievalIndexV01(body as never);
  if (validation.passed && report.index) {
    rebuildableRetrievalIndexRuntimeDerivedStoreV01.saveIndex(report.index);
  }

  return jsonResponse(
    {
      route_version: "rebuildable_retrieval_index_rebuild_route.v0.1",
      scope: "project:augnes",
      status: validation.passed && report.index ? "ok" : "rejected",
      report,
      derived_cache_snapshot: createReadOnlyRebuildableRetrievalIndexStoreSnapshotV01(
        rebuildableRetrievalIndexRuntimeDerivedStoreV01,
      ),
      boundary_notes: [
        "Route accepts caller-provided bounded summaries and symbolic refs only.",
        "Returned index is derived, rebuildable, and non-authoritative.",
        "Process memory cache is derived and ephemeral only.",
      ],
      authority_boundary: createRebuildableRetrievalIndexRuntimeBoundaryV01(),
    },
    validation.passed ? 200 : 400,
  );
}

function handleCompletionRebuildRoute(body: Record<string, unknown>) {
  const inputBody = body as { route_version?: unknown; scope?: unknown; db_path?: unknown; input?: unknown };
  if (
    inputBody.route_version !== completionRebuildRouteVersion ||
    inputBody.scope !== "project:augnes" ||
    !isRecord(inputBody.input)
  ) {
    return jsonResponse(completionErrorResponse("invalid_route_request"), 400);
  }
  if (!isSafeResearchRetrievalDbPathV01(inputBody.db_path)) {
    return jsonResponse(completionErrorResponse("invalid_db_path"), 400);
  }
  const input = {
    ...inputBody.input,
    db_path: inputBody.db_path,
  } as ResearchRetrievalIndexRebuildInputV01;
  if (input.rebuild_version !== RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01) {
    return jsonResponse(completionErrorResponse("invalid_route_request"), 400);
  }

  const db = openWriteCompletionDb(inputBody.db_path);
  try {
    const result = rebuildResearchRetrievalIndexV01(input, db);
    const statusCode = completionRebuildHttpStatus(result);
    return jsonResponse(completionRebuildResponse(result, statusCode), statusCode);
  } finally {
    db.close();
  }
}

function isCompletionRebuildRouteBody(body: Record<string, unknown>): boolean {
  if (body.route_version === completionRebuildRouteVersion) return true;
  return (
    isRecord(body.input) &&
    body.input.rebuild_version === RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01
  );
}

function openWriteCompletionDb(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  ensureResearchRetrievalIndexSchemaV01(db);
  return db;
}

function completionRebuildHttpStatus(result: ResearchRetrievalIndexRebuildResultV01): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status === "rebuilt") return 200;
  return 400;
}

function completionRebuildResponse(
  result: ResearchRetrievalIndexRebuildResultV01,
  statusCode: number,
) {
  return {
    route_version: completionRebuildRouteVersion,
    scope: "project:augnes",
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? result.status : null,
    result,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    live_crawling_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    rag_answer_generated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: result.authority_boundary,
  };
}

function completionErrorResponse(errorCode: string) {
  return {
    route_version: completionRebuildRouteVersion,
    scope: "project:augnes",
    status: "error",
    error_code: errorCode,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    live_crawling_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    rag_answer_generated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: createResearchRetrievalIndexAuthorityBoundaryV01({
      derived_index_write_now: false,
    }),
  };
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return false;
  if (!origin) return isLocalTestHost(host);

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function isLocalTestHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(normalized) ||
    /^\[::1\](:\d+)?$/.test(normalized)
  );
}

function errorResponse(errorCode: string) {
  return {
    route_version: "rebuildable_retrieval_index_rebuild_route.v0.1",
    scope: "project:augnes",
    status: "error",
    error_code: errorCode,
    authority_boundary: createRebuildableRetrievalIndexRuntimeBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
