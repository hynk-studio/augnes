import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildDogfoodingResearchRecordV01,
  createDogfoodingResearchRecordAuthorityBoundaryV01,
  createDogfoodingResearchRecordFromRecordV01,
  dogfoodingResearchRecordStoreSchemaExistsV01,
  ensureDogfoodingResearchRecordStoreSchemaV01,
  listDogfoodingResearchRecordsV01,
  readDogfoodingResearchRecordV01,
  type DogfoodingDbLike,
} from "../../../../lib/dogfooding/dogfooding-record-store";
import {
  DogfoodingResearchRecordRouteVersion,
  DogfoodingResearchRecordScope,
  type DogfoodingResearchRecordStoreResult,
} from "../../../../types/dogfooding-research-record-runtime-contract";

export const runtime = "nodejs";

const safeResearchRecordDbPathPrefixes = [
  "tmp/dogfooding-research-records/",
  ".tmp/dogfooding-research-records/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeDogfoodingResearchRecordRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyDogfoodingResearchDbV01(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!dogfoodingResearchRecordStoreSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }

    const recordId = url.searchParams.get("record_id");
    if (recordId) {
      const result = readDogfoodingResearchRecordV01(recordId, db);
      return jsonResponse(storeResponse(result), storeStatus(result));
    }

    const result = listDogfoodingResearchRecordsV01(
      {
        record_kind: url.searchParams.get("record_kind") || undefined,
        operator_actor_ref: url.searchParams.get("operator_actor_ref") || undefined,
        limit: parseRouteLimit(url.searchParams.get("limit")),
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
  if (requestBody.action !== undefined && requestBody.action !== "create") {
    return jsonResponse(errorResponse("invalid_action"), 400);
  }
  if (!isSafeDogfoodingResearchRecordRouteDbPathV01(requestBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }
  if (!requestBody.input || typeof requestBody.input !== "object" || Array.isArray(requestBody.input)) {
    return jsonResponse(errorResponse("invalid_input"), 400);
  }

  const built = buildDogfoodingResearchRecordV01(requestBody.input);
  if (!built.ok || !built.record) {
    return jsonResponse(storeResponse(built), storeStatus(built));
  }

  const db = openWriteDogfoodingResearchDbV01(requestBody.db_path);
  try {
    const storeResult = createDogfoodingResearchRecordFromRecordV01(built.record, db);
    return jsonResponse(storeResponse(storeResult), storeStatus(storeResult, true));
  } finally {
    db.close();
  }
}

export function isSafeDogfoodingResearchRecordRouteDbPathV01(
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeResearchRecordDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
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

function openReadOnlyDogfoodingResearchDbV01(dbPath: string):
  | { db: Database.Database & DogfoodingDbLike }
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

function openWriteDogfoodingResearchDbV01(
  dbPath: string,
): Database.Database & DogfoodingDbLike {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  const db = new Database(resolvedPath);
  ensureDogfoodingResearchRecordStoreSchemaV01(db);
  return db;
}

function storeStatus(result: DogfoodingResearchRecordStoreResult, fromCreate = false): number {
  if (result.status === "created") return fromCreate ? 201 : 200;
  if (result.status === "duplicate_record") return 200;
  if (result.status === "read" || result.status === "listed") return 200;
  if (result.status === "not_found" || result.status === "schema_missing") return 404;
  if (result.status === "conflicting_record") return 409;
  if (result.status === "blocked_forbidden_authority") return 403;
  return 400;
}

function storeResponse(result: DogfoodingResearchRecordStoreResult) {
  return {
    route_version: DogfoodingResearchRecordRouteVersion,
    scope: DogfoodingResearchRecordScope,
    status: result.ok ? "ok" : "error",
    error_code: result.error_code,
    store_result: result,
    records: result.records,
    durable_state_mutated: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    product_write_executed: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
    authority_boundary: createDogfoodingResearchRecordAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: DogfoodingResearchRecordRouteVersion,
    scope: DogfoodingResearchRecordScope,
    status: "error",
    error_code: errorCode,
    durable_state_mutated: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    product_write_executed: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
    authority_boundary: createDogfoodingResearchRecordAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function parseRouteLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasPrivateMarker(value: string): boolean {
  const normalizedValue = value.toLowerCase();
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
    "private key",
  ].some((marker) => normalizedValue.includes(marker));
}
