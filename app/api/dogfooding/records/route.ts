import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createDogfoodingIngestionAuthorityBoundaryV01,
  ingestDogfoodingRecordV01,
  validateDogfoodingIngestionInputV01,
  type DogfoodingIngestionInput,
  type DogfoodingIngestionResult,
} from "../../../../lib/dogfooding/dogfooding-ingestion-runtime";
import {
  createDogfoodingRecordV01,
  dogfoodingRecordStoreSchemaExistsV01,
  ensureDogfoodingRecordStoreSchemaV01,
  listDogfoodingRecordsV01,
  readDogfoodingRecordV01,
  type DogfoodingRecordStoreResult,
} from "../../../../lib/dogfooding/dogfooding-record-store";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "dogfooding_ingestion_records_route.v0.1" as const;
const safeRouteDbPathPrefixes = [
  "tmp/dogfooding-records/",
  ".tmp/dogfooding-records/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeDogfoodingRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyDogfoodingDbV01(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!dogfoodingRecordStoreSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }

    const recordId = url.searchParams.get("record_id");
    if (recordId) {
      const result = readDogfoodingRecordV01(recordId, db);
      return jsonResponse(storeResponse(result), storeStatus(result));
    }

    const result = listDogfoodingRecordsV01(
      {
        status: url.searchParams.get("status") || undefined,
        operator_actor_ref: url.searchParams.get("operator_actor_ref") || undefined,
        include_blocked:
          url.searchParams.get("include_blocked") === "1" ||
          url.searchParams.get("include_blocked") === "true",
      },
      db,
    );
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
  if (requestBody.action !== undefined && requestBody.action !== "ingest") {
    return jsonResponse(errorResponse("invalid_action"), 400);
  }
  if (!isSafeDogfoodingRouteDbPathV01(requestBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }
  if (!requestBody.input || typeof requestBody.input !== "object" || Array.isArray(requestBody.input)) {
    return jsonResponse(errorResponse("invalid_input"), 400);
  }

  const validation = validateDogfoodingIngestionInputV01(requestBody.input);
  if (!validation.passed) {
    const result = ingestDogfoodingRecordV01(requestBody.input as DogfoodingIngestionInput);
    return jsonResponse(ingestionResponse(result), ingestionStatus(result));
  }

  const result = ingestDogfoodingRecordV01(requestBody.input as DogfoodingIngestionInput);
  if (result.status !== "ingested" || !result.record) {
    return jsonResponse(ingestionResponse(result), ingestionStatus(result));
  }

  const db = openWriteDogfoodingDbV01(requestBody.db_path);
  try {
    const storeResult = createDogfoodingRecordV01(result.record, db);
    if (!storeResult.ok) {
      return jsonResponse(storeResponse(storeResult, result), storeStatus(storeResult));
    }
    return jsonResponse(storeResponse(storeResult, result), 201);
  } finally {
    db.close();
  }
}

export function isSafeDogfoodingRouteDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeRouteDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  return !hasPrivateMarker(value);
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
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

function openReadOnlyDogfoodingDbV01(dbPath: string):
  | { db: Database.Database }
  | { errorCode: "db_missing"; status: 404 } {
  const resolvedPath = resolve(process.cwd(), dbPath);
  if (!existsSync(resolvedPath)) return { errorCode: "db_missing", status: 404 };
  try {
    return { db: new Database(resolvedPath, { readonly: true, fileMustExist: true }) };
  } catch {
    return { errorCode: "db_missing", status: 404 };
  }
}

function openWriteDogfoodingDbV01(dbPath: string): Database.Database {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  const db = new Database(resolvedPath);
  ensureDogfoodingRecordStoreSchemaV01(db);
  return db;
}

function ingestionStatus(result: DogfoodingIngestionResult): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return 200;
}

function storeStatus(result: DogfoodingRecordStoreResult): number {
  if (result.status === "not_found") return 404;
  if (result.status === "duplicate_record") return 409;
  if (result.status === "schema_missing") return 404;
  if (result.status.startsWith("blocked")) return 400;
  return 200;
}

function ingestionResponse(result: DogfoodingIngestionResult) {
  const isBlocked = result.status.startsWith("blocked");
  return {
    route_version: routeVersion,
    scope,
    status: isBlocked ? "error" : "ok",
    error_code: isBlocked ? result.status : null,
    result,
    durable_state_mutated: false,
    candidate_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDogfoodingIngestionAuthorityBoundaryV01(),
  };
}

function storeResponse(
  storeResult: DogfoodingRecordStoreResult,
  ingestionResult?: DogfoodingIngestionResult,
) {
  const isError = !storeResult.ok;
  return {
    route_version: routeVersion,
    scope,
    status: isError ? "error" : "ok",
    error_code: isError ? storeResult.error_code : null,
    result: ingestionResult ?? null,
    store_result: storeResult,
    records: storeResult.records,
    durable_state_mutated: false,
    candidate_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDogfoodingIngestionAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    durable_state_mutated: false,
    candidate_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDogfoodingIngestionAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function hasPrivateMarker(value: string): boolean {
  return [
    "/Users/",
    "/home/",
    "file://",
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
  ].some((marker) => value.includes(marker));
}
