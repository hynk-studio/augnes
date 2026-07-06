import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  handoffPacketCopyExportWriteSchemaExistsV01,
  listHandoffPacketCopyExportRecordsV01,
  readHandoffPacketCopyExportRecordByExportedArtifactRefV01,
  readHandoffPacketCopyExportRecordByIdV01,
  readHandoffPacketCopyExportRecordByIdempotencyKeyV01,
  readLatestExportedHandoffPacketArtifactV01,
  refuseHandoffPacketCopyExportWriteV01,
  validateHandoffPacketCopyExportWriteInputV01,
  writeHandoffPacketCopyExportRecordV01,
  type HandoffPacketCopyExportWriteDbLike,
} from "@/lib/workplane/handoff-packet-copy-export-write";
import {
  HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
  type HandoffPacketCopyExportStoreResult,
} from "@/types/handoff-packet-copy-export-write";

export const runtime = "nodejs";

const routeVersion = "handoff_packet_copy_export_route.v0.1" as const;
const safeDbPathPrefixes = [
  "tmp/handoff-packet-copy-exports/",
  ".tmp/handoff-packet-copy-exports/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeHandoffPacketCopyExportRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!handoffPacketCopyExportWriteSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }
    const recordId = url.searchParams.get("record_id");
    const idempotencyKey = url.searchParams.get("idempotency_key");
    const exportedArtifactRef = url.searchParams.get("exported_artifact_ref");
    const latestArtifact =
      url.searchParams.get("latest_exported_artifact") === "true";
    const result = recordId
      ? readHandoffPacketCopyExportRecordByIdV01(recordId, { db })
      : idempotencyKey
        ? readHandoffPacketCopyExportRecordByIdempotencyKeyV01(idempotencyKey, {
            db,
          })
        : exportedArtifactRef
          ? readHandoffPacketCopyExportRecordByExportedArtifactRefV01(
              exportedArtifactRef,
              { db },
            )
          : latestArtifact
            ? readLatestExportedHandoffPacketArtifactV01({ db })
            : listHandoffPacketCopyExportRecordsV01({
                db,
                operator_ref: url.searchParams.get("operator_ref") || undefined,
                packet_format: url.searchParams.get("packet_format") || undefined,
                copy_export_target:
                  url.searchParams.get("copy_export_target") || undefined,
                limit: parseRouteLimit(url.searchParams.get("limit")),
              });
    return jsonResponse(storeResponse(result), storeStatus(result));
  } finally {
    db.close();
  }
}

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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(errorResponse("invalid_json_object"), 400);
  }

  const requestBody = body as {
    action?: unknown;
    db_path?: unknown;
    input?: unknown;
  };
  if (requestBody.action !== "write") {
    return jsonResponse(errorResponse("invalid_action"), 400);
  }
  if (!isSafeHandoffPacketCopyExportRouteDbPathV01(requestBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const validation = validateHandoffPacketCopyExportWriteInputV01(
    requestBody.input,
  );
  if (!validation.ok) {
    const result = refuseHandoffPacketCopyExportWriteV01(requestBody.input);
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  }

  const db = openWriteDb(requestBody.db_path);
  try {
    const result = writeHandoffPacketCopyExportRecordV01(requestBody.input, {
      db,
    });
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  } finally {
    db.close();
  }
}

export function isSafeHandoffPacketCopyExportRouteDbPathV01(
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (
    value.includes("\\") ||
    value.includes("//") ||
    value.includes("..") ||
    value.includes("\0")
  ) {
    return false;
  }
  if (!safeDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
  return !hasPrivateMarker(value);
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const effectiveHost = request.headers.get("x-forwarded-host") ?? host;
  if (!effectiveHost) return false;
  if (!origin) return isLocalTestHost(effectiveHost);
  try {
    return new URL(origin).host.toLowerCase() === effectiveHost.toLowerCase();
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

function openReadOnlyDb(
  dbPath: string,
):
  | { db: Database.Database & HandoffPacketCopyExportWriteDbLike }
  | { errorCode: "db_missing"; status: 404 } {
  const resolvedPath = resolve(process.cwd(), dbPath);
  if (!existsSync(resolvedPath)) return { errorCode: "db_missing", status: 404 };
  try {
    return {
      db: new Database(resolvedPath, { readonly: true, fileMustExist: true }),
    };
  } catch {
    return { errorCode: "db_missing", status: 404 };
  }
}

function openWriteDb(
  dbPath: string,
): Database.Database & HandoffPacketCopyExportWriteDbLike {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return new Database(resolvedPath);
}

function storeStatus(
  result: HandoffPacketCopyExportStoreResult,
  fromCreate = false,
): number {
  if (result.status === "written") return fromCreate ? 201 : 200;
  if (result.status === "idempotent_existing") return 200;
  if (result.status === "read" || result.status === "listed") return 200;
  if (result.status === "not_found" || result.status === "schema_missing") {
    return 404;
  }
  return 400;
}

function storeResponse(result: HandoffPacketCopyExportStoreResult) {
  return {
    route_version: routeVersion,
    scope: HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
    status: result.ok ? "ok" : "error",
    error_code: result.error_code,
    store_version: HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION,
    store_result: result,
    record: result.record,
    records: result.records,
    exported_artifact: result.exported_artifact,
    exported_artifacts: result.exported_artifacts,
    receipt: result.receipt,
    handoff_packet_copy_export_record_written: result.status === "written",
    handoff_packet_copy_export_receipt_written: result.status === "written",
    handoff_packet_copy_export_persisted: result.status === "written",
    handoff_packet_exported_artifact_written: result.status === "written",
    handoff_packet_materialized_to_local_artifact:
      result.status === "written",
    handoff_packet_copied_to_clipboard: false,
    handoff_packet_exported_to_file: false,
    handoff_packet_download_created: false,
    clipboard_written: false,
    file_download_created: false,
    arbitrary_file_written: false,
    handoff_packet_file_written: false,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_sent: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_packet_copy_export_contract_record_written: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
    no_side_effects: result.no_side_effects,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope: HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
    status: "error",
    error_code: errorCode,
    store_version: HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION,
  };
}

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-augnes-handoff-packet-copy-export": routeVersion,
    },
  });
}

function parseRouteLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(1, Math.min(Math.trunc(parsed), 100));
}

function hasPrivateMarker(value: string): boolean {
  return /token|secret|password|private|credential|key/i.test(value);
}
