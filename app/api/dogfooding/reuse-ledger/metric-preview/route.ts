import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01,
} from "@/lib/dogfooding/dogfood-metric-candidate-preview";
import {
  handoffReuseOutcomeLedgerStoreSchemaExistsV01,
  type HandoffReuseOutcomeLedgerDbLike,
} from "@/lib/dogfooding/handoff-reuse-outcome-ledger";
import {
  DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
  type DogfoodMetricCandidatePreview,
} from "@/types/dogfood-metric-candidate-preview";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  type HandoffReuseOutcomeLedgerRecord,
} from "@/types/handoff-reuse-outcome-ledger";

export const runtime = "nodejs";

const routeVersion = "dogfood_metric_candidate_preview_route.v0.1" as const;
const safeLedgerDbPathPrefixes = [
  "tmp/dogfood-reuse-ledger/",
  ".tmp/dogfood-reuse-ledger/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  const metricWindow = {
    since: url.searchParams.get("since"),
    until: url.searchParams.get("until"),
    limit: parseRouteLimit(url.searchParams.get("limit")) ?? null,
    filtered_by_result_report_ref:
      url.searchParams.get("result_report_ref") || null,
    filtered_by_operator_ref: url.searchParams.get("operator_ref") || null,
  };

  if (!isSafeMetricPreviewLedgerDbPathV01(dbPath)) {
    return jsonResponse(
      previewResponse({
        status: "error",
        errorCode: "invalid_db_path",
        preview: emptyPreview(["invalid_db_path"], metricWindow),
      }),
      400,
    );
  }

  const opened = openReadOnlyLedgerDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(
      previewResponse({
        status: "error",
        errorCode: opened.errorCode,
        preview: emptyPreview([opened.errorCode], metricWindow),
      }),
      opened.status,
    );
  }

  const db = opened.db;
  try {
    if (!handoffReuseOutcomeLedgerStoreSchemaExistsV01(db)) {
      return jsonResponse(
        previewResponse({
          status: "error",
          errorCode: "schema_missing",
          preview: emptyPreview(["ledger_schema_missing"], metricWindow),
        }),
        404,
      );
    }

    const ledgerRecords = readMetricPreviewLedgerRecordsV01(db, metricWindow);
    const preview = buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
      records: ledgerRecords,
      as_of: new Date(0).toISOString(),
      ledger_store_ref: "handoff_reuse_outcome_ledger_store:local_read",
      metric_window: metricWindow,
      insufficient_data_reasons:
        ledgerRecords.length === 0 ? ["empty_ledger_read"] : [],
      source_refs: [
        routeVersion,
        DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
      ],
    });
    return jsonResponse(
      previewResponse({
        status: "ok",
        errorCode: null,
        preview,
      }),
      200,
    );
  } finally {
    db.close();
  }
}

function readMetricPreviewLedgerRecordsV01(
  db: HandoffReuseOutcomeLedgerDbLike,
  metricWindow: DogfoodMetricCandidatePreview["metric_window"],
): HandoffReuseOutcomeLedgerRecord[] {
  const clauses = ["scope = ?", "record_version = ?"];
  const params: unknown[] = [
    HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  ];
  if (metricWindow.filtered_by_result_report_ref) {
    clauses.push("result_report_ref = ?");
    params.push(metricWindow.filtered_by_result_report_ref);
  }
  if (isFiniteIsoDate(metricWindow.since)) {
    clauses.push("created_at >= ?");
    params.push(metricWindow.since);
  }
  if (isFiniteIsoDate(metricWindow.until)) {
    clauses.push("created_at <= ?");
    params.push(metricWindow.until);
  }
  const finalLimit = Math.max(1, Math.min(metricWindow.limit ?? 50, 500));
  const queryLimit = metricWindow.filtered_by_operator_ref
    ? 500
    : finalLimit;
  const rows = db
    .prepare(
      `SELECT record_json FROM handoff_reuse_outcome_ledger_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at ASC, record_id ASC
       LIMIT ?`,
    )
    .all(...params, queryLimit) as { record_json: string }[];
  return rows
    .map((row) => safeParseLedgerRecord(row.record_json))
    .filter((record): record is HandoffReuseOutcomeLedgerRecord => {
      if (!record) return false;
      const operatorRef = metricWindow.filtered_by_operator_ref;
      return (
        !operatorRef ||
        record.operator_approval.approved_by === operatorRef ||
        record.operator_approval.operator_ref === operatorRef
      );
    })
    .slice(0, finalLimit);
}

function openReadOnlyLedgerDb(
  dbPath: string,
):
  | { db: Database.Database & HandoffReuseOutcomeLedgerDbLike }
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

function safeParseLedgerRecord(
  value: string,
): HandoffReuseOutcomeLedgerRecord | null {
  try {
    const parsed = JSON.parse(value) as HandoffReuseOutcomeLedgerRecord;
    return parsed?.record_version === HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function isFiniteIsoDate(value: string | null): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isSafeMetricPreviewLedgerDbPathV01(value: unknown): value is string {
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
  if (!safeLedgerDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
  return !hasPrivateMarker(value);
}

function hasPrivateMarker(value: string): boolean {
  const normalized = value.toLowerCase();
  return [
    "/users/",
    "/home/",
    "file://",
    "sk-",
    "ghp_",
    "openai_api_key",
    "github_token",
    "password:",
    "secret:",
  ].some((marker) => normalized.includes(marker));
}

function emptyPreview(
  insufficientDataReasons: string[],
  metricWindow: DogfoodMetricCandidatePreview["metric_window"],
): DogfoodMetricCandidatePreview {
  return buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
    records: [],
    as_of: new Date(0).toISOString(),
    metric_window: metricWindow,
    insufficient_data_reasons: insufficientDataReasons,
    source_refs: [routeVersion, DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION],
  });
}

function previewResponse({
  status,
  errorCode,
  preview,
}: {
  status: "ok" | "error";
  errorCode: string | null;
  preview: DogfoodMetricCandidatePreview;
}) {
  return {
    route_version: routeVersion,
    scope: HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    status,
    error_code: errorCode,
    preview,
    dogfood_metric_candidate_preview: preview,
    dogfood_metric_candidate_preview_written: false,
    no_metric_write: true,
    no_metric_update: true,
    no_memory_mutation: true,
    no_perspective_apply: true,
    no_provider_call: true,
    no_github_call: true,
    no_codex_execution: true,
    no_handoff_send: true,
    no_formation_receipt: true,
    no_promotion_decision: true,
    no_graph_vector_rag_crawler_observer: true,
    no_autonomous_action: true,
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function parseRouteLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
