import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import SqliteDatabase from "better-sqlite3";
import { NextResponse } from "next/server";

import { openDatabase } from "@/lib/db";
import {
  FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION,
  createFeedbackEventWriteRuntimeAuthorityBoundaryV01,
  createFeedbackEventWriteRuntimeBlockedResultV01,
  isSafeFeedbackEventWriteRuntimeDbPathV01,
  validateFeedbackEventWriteRuntimeInputV01,
  writeFeedbackEventRuntimeV01,
  type FeedbackEventWriteRuntimeInputV01,
  type FeedbackEventWriteRuntimeResultV01,
} from "@/lib/research-candidate-review/feedback-event-write-runtime";
import {
  buildFeedbackEventStoreEvent,
  getFeedbackEventStoreAuthorityBoundary,
  insertFeedbackEvent,
  listFeedbackEvents,
} from "@/lib/research-candidate-review/feedback-event-store";
import type {
  FeedbackEventStoreAuthorityBoundary,
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreInput,
  FeedbackEventStoreTargetKind,
  FeedbackEventStoreValidationResult,
} from "@/types/feedback-event-store";
import type {
  FeedbackEventWriteRouteAuthorityAcknowledgement,
  FeedbackEventWriteRouteRefusal,
  FeedbackEventWriteRouteRefusalCode,
} from "@/types/feedback-event-write-route-contract";
import type {
  FeedbackEventStoreListRouteAuthorityAcknowledgement,
  FeedbackEventStoreListRouteRefusal,
  FeedbackEventStoreListRouteRefusalCode,
} from "@/types/feedback-event-store-list-route-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type FeedbackEventWriteRouteImplementationRefusalCode =
  | FeedbackEventWriteRouteRefusalCode
  | "invalid_json_body"
  | "request_version_invalid"
  | "feedback_event_store_write_failed";

type FeedbackEventWriteRouteImplementationRefusal = Omit<
  FeedbackEventWriteRouteRefusal,
  "refusal_code"
> & {
  refusal_code: FeedbackEventWriteRouteImplementationRefusalCode;
};

interface FeedbackEventWriteRouteDbStatement {
  get?: (...values: unknown[]) => unknown;
  all?: (...values: unknown[]) => unknown[];
  run?: (...values: unknown[]) => { changes?: number };
}

interface FeedbackEventWriteRouteDb {
  prepare(sql: string): FeedbackEventWriteRouteDbStatement;
  close?: () => void;
}

export interface FeedbackEventWriteRouteImplementationResponse {
  response_version: "feedback_event_write_route_response.v0.1";
  accepted: boolean;
  inserted: boolean;
  duplicate: boolean;
  event_id: string | null;
  idempotency_key: string | null;
  event: FeedbackEventStoreEvent | null;
  validation: FeedbackEventStoreValidationResult;
  authority_boundary: FeedbackEventStoreAuthorityBoundary;
  refusal: FeedbackEventWriteRouteImplementationRefusal | null;
  route_implemented_now: true;
  runtime_write_executed_now: boolean;
  db_open_now: boolean;
  sql_execution_now: boolean;
}

export interface FeedbackEventWriteRouteHandlerInput {
  body: unknown;
  db: FeedbackEventWriteRouteDb | (() => FeedbackEventWriteRouteDb);
}

type FeedbackEventStoreListRouteImplementationRefusalCode =
  | FeedbackEventStoreListRouteRefusalCode
  | "feedback_event_store_list_failed";

type FeedbackEventStoreListRouteImplementationRefusal = Omit<
  FeedbackEventStoreListRouteRefusal,
  "refusal_code"
> & {
  refusal_code: FeedbackEventStoreListRouteImplementationRefusalCode;
};

export interface FeedbackEventStoreListRouteImplementationAuthorityBoundary {
  contract_only: false;
  route_implemented_now: true;
  durable_feedback_event_read_now: boolean;
  durable_feedback_event_written_now: false;
  runtime_read_executed_now: boolean;
  runtime_write_executed_now: false;
  db_open_now: boolean;
  sql_execution_now: boolean;
  server_action_available_now: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface FeedbackEventStoreListRouteImplementationResponse {
  response_version: "feedback_event_store_list_route_response.v0.1";
  accepted: boolean;
  events: FeedbackEventStoreEvent[];
  count: number;
  next_cursor: string | null;
  validation: {
    passed: boolean;
    failure_codes: string[];
  };
  authority_boundary: FeedbackEventStoreListRouteImplementationAuthorityBoundary;
  refusal: FeedbackEventStoreListRouteImplementationRefusal | null;
  route_implemented_now: true;
  runtime_read_executed_now: boolean;
  db_open_now: boolean;
  sql_execution_now: boolean;
}

export interface FeedbackEventStoreListRouteHandlerInput {
  url: string | URL;
  db: FeedbackEventWriteRouteDb | (() => FeedbackEventWriteRouteDb);
}

interface PreparedFeedbackEventStoreListRequest {
  filters: {
    event_type?: FeedbackEventStoreEventType;
    target_kind?: FeedbackEventStoreTargetKind;
    target_id?: string;
  };
  created_after?: string;
  created_before?: string;
  limit: number;
  include_event_json: boolean;
}

const requestVersion = "feedback_event_write_route_request.v0.1";
const responseVersion = "feedback_event_write_route_response.v0.1";
const listRequestVersion = "feedback_event_store_list_route_request.v0.1";
const listResponseVersion = "feedback_event_store_list_route_response.v0.1";

const requiredAuthorityAcknowledgements: FeedbackEventWriteRouteAuthorityAcknowledgement[] = [
  "durable_feedback_event_only",
  "not_proof_or_evidence",
  "not_perspective_promotion",
  "not_work_mutation",
  "not_execution_authority",
  "not_codex_execution",
  "not_github_automation",
  "not_external_handoff",
  "not_provider_openai_call",
  "not_source_fetch",
  "not_retrieval_rag_execution",
  "not_product_write",
  "product_write_lane_parked_by_686",
];

const requiredListAuthorityAcknowledgements: FeedbackEventStoreListRouteAuthorityAcknowledgement[] =
  [
    "read_feedback_events_only",
    "not_proof_or_evidence",
    "not_perspective_promotion",
    "not_work_mutation",
    "not_execution_authority",
    "not_codex_execution",
    "not_github_automation",
    "not_external_handoff",
    "not_provider_openai_call",
    "not_source_fetch",
    "not_retrieval_rag_execution",
    "not_product_write",
    "product_write_lane_parked_by_686",
  ];

const rawSqlOrExternalQueryParamNames = new Set([
  "sql",
  "raw_sql",
  "query_sql",
  "where",
  "raw_where",
  "raw_where_clause",
  "source_fetch_query",
  "retrieval_query",
  "rag_query",
  "retrieval_rag_query",
  "provider_query",
  "openai_query",
  "product_write_query",
  "proof_evidence_query",
  "perspective_promotion_query",
  "work_mutation_query",
]);

const defaultListLimit = 50;
const maxListLimit = 100;

const allowedEventTypes: FeedbackEventStoreEventType[] = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];

const allowedTargetKinds: FeedbackEventStoreTargetKind[] = [
  "agent_perspective_substrate_surfacing_card",
  "agent_perspective_substrate_folded_section",
  "candidate_to_codex_handoff_draft",
  "candidate_to_codex_handoff_draft_review",
  "candidate_to_codex_handoff_operator_decision_preview",
  "research_candidate_review_object",
  "research_candidate_ai_context_packet",
  "perspective_geometry_digest",
];

const forbiddenOperatorNotePatterns = [
  /sk-[A-Za-z0-9_-]{8,}/,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /ghp_[A-Za-z0-9_]+/,
  /password\s*[:=]/i,
  /secret\s*[:=]/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const forbiddenAuthorityKeyGroups: Array<{
  keys: string[];
  refusal_code: FeedbackEventWriteRouteImplementationRefusalCode;
}> = [
  {
    keys: [
      "execute_product_write",
      "product_write",
      "product_write_authority",
      "can_execute_product_write",
      "product_id_allocation",
      "product_id_allocation_authority",
      "product_id_allocation_requested",
      "allocate_product_id",
      "allocate_product_ids",
      "product_id_allocation_now",
      "can_allocate_product_ids",
      "product_write_available",
      "product_write_authorized_now",
      "product_write_allowed_now",
      "product_write_implementation_allowed_now",
      "product_write_authority_granted_now",
      "product_db_write",
      "product_db_write_now",
      "product_db_write_available",
      "product_id_allocation_allowed_now",
      "product_id_allocation_available",
      "product_claim_id_allocation",
      "product_claim_id_allocation_authority",
      "product_claim_id_allocation_allowed_now",
      "product_claim_id_allocation_available",
    ],
    refusal_code: "product_write_authority_requested",
  },
  {
    keys: [
      "run_retrieval",
      "run_rag",
      "retrieval",
      "rag",
      "retrieval_rag",
      "retrieval_rag_authority",
      "retrieval_rag_execution",
      "retrieval_rag_execution_requested",
      "retrieval_executed_now",
      "retrieval_execution_requested",
      "can_run_retrieval_or_rag",
      "performs_retrieval",
      "retrieval_available",
      "rag_available",
      "retrieval_rag_available",
      "retrieval_rag_executed_now",
      "rag_executed_now",
      "retrieval_output",
      "rag_output",
    ],
    refusal_code: "retrieval_rag_execution_requested",
  },
  {
    keys: [
      "call_provider",
      "call_openai",
      "provider_openai_authority",
      "provider_called_now",
      "provider_or_openai_call",
      "provider_or_openai_call_requested",
      "calls_provider",
      "calls_provider_or_openai",
      "can_call_providers_or_openai",
      "provider_or_openai_call_now",
      "provider_openai_call_available",
      "openai_call",
      "openai_called_now",
      "openai_call_requested",
    ],
    refusal_code: "provider_openai_call_requested",
  },
  {
    keys: [
      "fetch_source",
      "source_fetch",
      "source_fetch_authority",
      "source_fetch_executed_now",
      "source_fetch_requested",
      "source_fetch_available",
      "source_fetch_now",
      "can_fetch_sources",
    ],
    refusal_code: "source_fetch_requested",
  },
  {
    keys: [
      "execute_codex",
      "codex_execution",
      "codex_execution_authority",
      "codex_execution_authorized_now",
      "create_branch",
      "create_pr",
      "branch_pr_creation",
      "open_pr",
      "call_github",
      "github_automation",
      "github_automation_authority",
      "github_api_call",
      "can_call_github",
      "can_create_branch",
      "can_open_pr",
      "codex_execution_available",
      "github_automation_available",
      "branch_pr_creation_available",
      "github_api_call_available",
      "merge_authority_granted_now",
    ],
    refusal_code: "codex_or_github_automation_requested",
  },
  {
    keys: [
      "send_external_handoff",
      "external_handoff",
      "external_handoff_authority",
      "external_handoff_sent_now",
      "can_send_external_handoff",
      "promote_perspective",
      "perspective_promotion",
      "can_promote_perspective",
      "create_evidence",
      "create_proof",
      "creates_evidence",
      "creates_proof",
      "proof_or_evidence_record",
      "can_record_proof",
      "can_create_evidence",
      "mutate_work",
      "work_mutation",
      "can_update_work",
      "can_create_work_item",
      "execution_authority",
      "agent_execution_authority",
      "can_execute_agents",
      "can_route_agents",
      "route_action_available",
      "route_or_ui_mutation_available",
      "ui_write_action_available",
      "db_write_available",
      "db_open",
      "db_open_now",
      "can_open_db",
      "sql_execution",
      "sql_execution_now",
      "can_execute_sql",
      "transaction_execution",
      "transaction_execution_now",
      "transaction_commit",
      "transaction_rollback_execution",
      "can_execute_transaction",
      "external_call_available",
      "agent_execution_available",
      "durable_write_authority",
      "durable_write_authority_granted_now",
      "merge_authority",
    ],
    refusal_code: "forbidden_authority_requested",
  },
];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(refusalResponse("invalid_json_body"), { status: 400 });
  }

  if (isFeedbackControlsRuntimeCompletionBody(body)) {
    if (!requestHasSameOriginBoundary(request)) {
      return NextResponse.json(
        feedbackControlsRuntimeCompletionErrorResponse("same_origin_required"),
        { status: 403 },
      );
    }
    const response = handleFeedbackControlsRuntimeCompletionBody(body);
    return NextResponse.json(response, { status: feedbackControlsRuntimeHttpStatus(response) });
  }

  const response = handleFeedbackEventWriteRouteRequest({
    body,
    db: () => openDatabase() as unknown as FeedbackEventWriteRouteDb,
  });
  return NextResponse.json(response, { status: response.accepted ? 200 : 400 });
}

export async function GET(request: Request) {
  const response = handleFeedbackEventStoreListRouteRequest({
    url: request.url,
    db: () => openDatabase() as unknown as FeedbackEventWriteRouteDb,
  });
  return NextResponse.json(response, { status: response.accepted ? 200 : 400 });
}

type FeedbackControlsRuntimeCompletionRouteErrorCode =
  | "same_origin_required"
  | "invalid_json_body"
  | "invalid_json_object"
  | "invalid_route_request"
  | "invalid_db_path"
  | FeedbackEventWriteRuntimeResultV01["status"];

interface FeedbackControlsRuntimeCompletionRouteResponse {
  route_version: typeof FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION;
  scope: "project:augnes";
  status: "ok" | "error";
  error_code: FeedbackControlsRuntimeCompletionRouteErrorCode | null;
  result: FeedbackEventWriteRuntimeResultV01 | null;
  feedback_event_persisted: boolean;
  aggregation_executed: false;
  rule_mutation_executed: false;
  parser_mutation_executed: false;
  prompt_mutation_executed: false;
  ranking_mutation_executed: false;
  surfacing_mutation_executed: false;
  source_suppression_executed: false;
  candidate_deleted: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  authority_boundary: ReturnType<typeof createFeedbackEventWriteRuntimeAuthorityBoundaryV01>;
}

function isFeedbackControlsRuntimeCompletionBody(
  body: unknown,
): body is {
  route_version?: unknown;
  scope?: unknown;
  action?: unknown;
  db_path?: unknown;
  input?: unknown;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const value = body as Record<string, unknown>;
  return (
    value.route_version === FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION ||
    value.action === "create_feedback_event" ||
    (value.input !== undefined &&
      typeof value.input === "object" &&
      value.input !== null &&
      !Array.isArray(value.input) &&
      "event_version" in value.input)
  );
}

function handleFeedbackControlsRuntimeCompletionBody(body: {
  route_version?: unknown;
  scope?: unknown;
  action?: unknown;
  db_path?: unknown;
  input?: unknown;
}): FeedbackControlsRuntimeCompletionRouteResponse {
  if (
    body.route_version !== FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION ||
    body.scope !== "project:augnes" ||
    body.action !== "create_feedback_event" ||
    !body.input ||
    typeof body.input !== "object" ||
    Array.isArray(body.input)
  ) {
    return feedbackControlsRuntimeCompletionErrorResponse("invalid_route_request");
  }

  if (!isSafeFeedbackEventWriteRuntimeDbPathV01(body.db_path)) {
    return feedbackControlsRuntimeCompletionErrorResponse("invalid_db_path");
  }

  const input = body.input as FeedbackEventWriteRuntimeInputV01;
  const validation = validateFeedbackEventWriteRuntimeInputV01(input);
  if (!validation.passed) {
    return feedbackControlsRuntimeCompletionResponse(
      createFeedbackEventWriteRuntimeBlockedResultV01(input, validation.failure_codes),
    );
  }

  const dbPath = body.db_path as string;
  const dbDirectory = dirname(dbPath);
  if (!existsSync(dbDirectory)) {
    mkdirSync(dbDirectory, { recursive: true });
  }

  let db: SqliteDatabase.Database | null = null;
  try {
    db = new SqliteDatabase(dbPath);
    const result = writeFeedbackEventRuntimeV01(
      input,
      db as unknown as Parameters<typeof writeFeedbackEventRuntimeV01>[1],
    );
    return feedbackControlsRuntimeCompletionResponse(result);
  } catch {
    return feedbackControlsRuntimeCompletionErrorResponse("rejected");
  } finally {
    db?.close();
  }
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? null;
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  if (!host) return false;
  if (!origin) return fetchSite ? true : isLocalTestHost(host);

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

function feedbackControlsRuntimeCompletionResponse(
  result: FeedbackEventWriteRuntimeResultV01,
): FeedbackControlsRuntimeCompletionRouteResponse {
  const ok =
    result.status === "feedback_event_created" || result.status === "idempotent_existing";
  return {
    route_version: FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION,
    scope: "project:augnes",
    status: ok ? "ok" : "error",
    error_code: ok ? null : result.status,
    result,
    feedback_event_persisted: result.feedback_event_persisted,
    aggregation_executed: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: result.authority_boundary,
  };
}

function feedbackControlsRuntimeCompletionErrorResponse(
  errorCode: FeedbackControlsRuntimeCompletionRouteErrorCode,
): FeedbackControlsRuntimeCompletionRouteResponse {
  return {
    route_version: FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION,
    scope: "project:augnes",
    status: "error",
    error_code: errorCode,
    result: null,
    feedback_event_persisted: false,
    aggregation_executed: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFeedbackEventWriteRuntimeAuthorityBoundaryV01(),
  };
}

function feedbackControlsRuntimeHttpStatus(
  response: FeedbackControlsRuntimeCompletionRouteResponse,
): number {
  const status = response.result?.status ?? response.error_code;
  if (status === "feedback_event_created") return 201;
  if (status === "idempotent_existing") return 200;
  if (status === "conflict_existing_feedback_event") return 409;
  if (status === "blocked_forbidden_authority" || status === "same_origin_required") {
    return 403;
  }
  return 400;
}

export function handleFeedbackEventWriteRouteRequest({
  body,
  db,
}: FeedbackEventWriteRouteHandlerInput): FeedbackEventWriteRouteImplementationResponse {
  const prepared = prepareFeedbackEventWrite(body);
  if ("refusal_code" in prepared) {
    return refusalResponse(prepared.refusal_code, prepared.idempotency_key);
  }

  let openedDb: FeedbackEventWriteRouteDb | null = null;
  let ownsDb = false;
  try {
    openedDb = typeof db === "function" ? db() : db;
    ownsDb = typeof db === "function";
    const writeResult = insertFeedbackEvent(openedDb, prepared.event);
    const accepted = writeResult.validation.passed;
    return {
      response_version: responseVersion,
      accepted,
      inserted: writeResult.inserted,
      duplicate: writeResult.duplicate,
      event_id: writeResult.event?.event_id ?? null,
      idempotency_key: writeResult.event?.idempotency_key ?? prepared.event.idempotency_key,
      event: writeResult.event,
      validation: writeResult.validation,
      authority_boundary: getFeedbackEventStoreAuthorityBoundary(),
      refusal: accepted ? null : refusalForValidation(writeResult.validation),
      route_implemented_now: true,
      runtime_write_executed_now: true,
      db_open_now: true,
      sql_execution_now: true,
    };
  } catch {
    return refusalResponse("feedback_event_store_write_failed", prepared.event.idempotency_key);
  } finally {
    if (ownsDb) {
      openedDb?.close?.();
    }
  }
}

export function handleFeedbackEventStoreListRouteRequest({
  url,
  db,
}: FeedbackEventStoreListRouteHandlerInput): FeedbackEventStoreListRouteImplementationResponse {
  const prepared = prepareFeedbackEventStoreList(url);
  if ("refusal_code" in prepared) {
    return listRefusalResponse(prepared.refusal_code);
  }

  let openedDb: FeedbackEventWriteRouteDb | null = null;
  let ownsDb = false;
  try {
    openedDb = typeof db === "function" ? db() : db;
    ownsDb = typeof db === "function";
    const listResult = listFeedbackEvents(openedDb, prepared.filters);
    const events = applyListRouteFiltersAndOrder(
      listResult.events,
      prepared,
    );
    return {
      response_version: listResponseVersion,
      accepted: true,
      events: prepared.include_event_json ? events : [],
      count: events.length,
      next_cursor: null,
      validation: {
        passed: true,
        failure_codes: [],
      },
      authority_boundary: getFeedbackEventStoreListRouteAuthorityBoundary({
        readNow: true,
        dbOpenNow: true,
        sqlExecutionNow: true,
      }),
      refusal: null,
      route_implemented_now: true,
      runtime_read_executed_now: true,
      db_open_now: true,
      sql_execution_now: true,
    };
  } catch {
    return listRefusalResponse("feedback_event_store_list_failed");
  } finally {
    if (ownsDb) {
      openedDb?.close?.();
    }
  }
}

function prepareFeedbackEventStoreList(
  url: string | URL,
):
  | PreparedFeedbackEventStoreListRequest
  | { refusal_code: FeedbackEventStoreListRouteImplementationRefusalCode } {
  const parsedUrl = typeof url === "string" ? new URL(url, "http://localhost") : url;
  const searchParams = parsedUrl.searchParams;
  if (normalizeString(searchParams.get("request_version")) !== listRequestVersion) {
    return { refusal_code: "invalid_request_version" };
  }
  if (!listAuthorityAcknowledgementsComplete(searchParams)) {
    return { refusal_code: "missing_authority_acknowledgement" };
  }
  if (hasRawSqlOrExternalQueryParam(searchParams)) {
    return { refusal_code: "raw_sql_filter_forbidden" };
  }
  const forbiddenAuthorityRefusal = findForbiddenAuthorityRefusal(
    searchParamsToRecord(searchParams),
  );
  if (forbiddenAuthorityRefusal) {
    return {
      refusal_code:
        forbiddenAuthorityRefusal as FeedbackEventStoreListRouteImplementationRefusalCode,
    };
  }

  const rawEventType = normalizeString(searchParams.get("event_type"));
  if (
    rawEventType &&
    !allowedEventTypes.includes(rawEventType as FeedbackEventStoreEventType)
  ) {
    return { refusal_code: "invalid_event_type" };
  }
  const rawTargetKind = normalizeString(searchParams.get("target_kind"));
  if (
    rawTargetKind &&
    !allowedTargetKinds.includes(rawTargetKind as FeedbackEventStoreTargetKind)
  ) {
    return { refusal_code: "invalid_target_kind" };
  }
  const rawLimit = normalizeString(searchParams.get("limit"));
  const limit = rawLimit ? Number(rawLimit) : defaultListLimit;
  if (!Number.isInteger(limit) || limit < 1 || limit > maxListLimit) {
    return { refusal_code: "invalid_limit" };
  }
  if (normalizeString(searchParams.get("cursor"))) {
    return { refusal_code: "invalid_cursor" };
  }

  const filters: PreparedFeedbackEventStoreListRequest["filters"] = {};
  if (rawEventType) filters.event_type = rawEventType as FeedbackEventStoreEventType;
  if (rawTargetKind) {
    filters.target_kind = rawTargetKind as FeedbackEventStoreTargetKind;
  }
  const targetId = normalizeString(searchParams.get("target_id"));
  if (targetId) filters.target_id = targetId;

  return {
    filters,
    created_after: normalizeString(searchParams.get("created_after")) || undefined,
    created_before: normalizeString(searchParams.get("created_before")) || undefined,
    limit,
    include_event_json: normalizeBooleanQueryParam(
      searchParams.get("include_event_json"),
      true,
    ),
  };
}

function applyListRouteFiltersAndOrder(
  events: FeedbackEventStoreEvent[],
  request: PreparedFeedbackEventStoreListRequest,
): FeedbackEventStoreEvent[] {
  return events
    .filter((event) => {
      if (request.created_after && event.created_at < request.created_after) {
        return false;
      }
      if (request.created_before && event.created_at > request.created_before) {
        return false;
      }
      return true;
    })
    .sort((left, right) => {
      const createdAtComparison = right.created_at.localeCompare(left.created_at);
      if (createdAtComparison !== 0) return createdAtComparison;
      return right.event_id.localeCompare(left.event_id);
    })
    .slice(0, request.limit);
}

function prepareFeedbackEventWrite(
  body: unknown,
):
  | { event: FeedbackEventStoreEvent }
  | {
      refusal_code: FeedbackEventWriteRouteImplementationRefusalCode;
      idempotency_key: string | null;
    } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { refusal_code: "request_version_invalid", idempotency_key: null };
  }
  const request = body as JsonRecord;
  const rawIdempotencyKey = normalizeString(request.idempotency_key) || null;
  if (normalizeString(request.request_version) !== requestVersion) {
    return {
      refusal_code: "request_version_invalid",
      idempotency_key: rawIdempotencyKey,
    };
  }
  if (!authorityAcknowledgementsComplete(request.authority_acknowledgements)) {
    return {
      refusal_code: "missing_authority_acknowledgement",
      idempotency_key: rawIdempotencyKey,
    };
  }
  const forbiddenAuthorityRefusal = findForbiddenAuthorityRefusal(request);
  if (forbiddenAuthorityRefusal) {
    return {
      refusal_code: forbiddenAuthorityRefusal,
      idempotency_key: rawIdempotencyKey,
    };
  }
  if (!allowedEventTypes.includes(request.event_type as FeedbackEventStoreEventType)) {
    return { refusal_code: "invalid_event_type", idempotency_key: rawIdempotencyKey };
  }
  if (!allowedTargetKinds.includes(request.target_kind as FeedbackEventStoreTargetKind)) {
    return { refusal_code: "invalid_target_kind", idempotency_key: rawIdempotencyKey };
  }
  if (!normalizeString(request.target_id)) {
    return { refusal_code: "missing_target_id", idempotency_key: rawIdempotencyKey };
  }
  const sourceRefIds = normalizeStringArray(request.source_ref_ids);
  if (sourceRefIds.length === 0 && !normalizeString(request.reason)) {
    return {
      refusal_code: "missing_source_refs_without_reason",
      idempotency_key: rawIdempotencyKey,
    };
  }
  if (
    request.event_type === "correct_preview" &&
    !normalizeString(request.correction_text)
  ) {
    return {
      refusal_code: "correction_text_required_for_correct_preview",
      idempotency_key: rawIdempotencyKey,
    };
  }
  if (operatorNoteContainsSecret(request.operator_note)) {
    return {
      refusal_code: "operator_note_secret_like_pattern",
      idempotency_key: rawIdempotencyKey,
    };
  }

  const eventInput: FeedbackEventStoreInput = {
    event_type: request.event_type as FeedbackEventStoreEventType,
    target_kind: request.target_kind as FeedbackEventStoreTargetKind,
    target_id: normalizeString(request.target_id),
    source_ref_ids: sourceRefIds,
  };
  assignOptionalString(eventInput, "target_fingerprint", request.target_fingerprint);
  assignOptionalString(eventInput, "operator_note", request.operator_note);
  assignOptionalString(eventInput, "correction_text", request.correction_text);
  assignOptionalString(eventInput, "reason", request.reason);
  assignOptionalString(eventInput, "idempotency_key", request.idempotency_key);
  return { event: buildFeedbackEventStoreEvent(eventInput) };
}

function authorityAcknowledgementsComplete(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  const acknowledgements = new Set(value.map((item) => normalizeString(item)));
  return requiredAuthorityAcknowledgements.every((acknowledgement) =>
    acknowledgements.has(acknowledgement),
  );
}

function listAuthorityAcknowledgementsComplete(searchParams: URLSearchParams): boolean {
  const acknowledgements = new Set(
    searchParams
      .getAll("authority_acknowledgements")
      .flatMap((value) => value.split(","))
      .map((value) => normalizeString(value))
      .filter((value) => value.length > 0),
  );
  return requiredListAuthorityAcknowledgements.every((acknowledgement) =>
    acknowledgements.has(acknowledgement),
  );
}

function hasRawSqlOrExternalQueryParam(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (rawSqlOrExternalQueryParamNames.has(normalizeAuthorityKey(key))) {
      return true;
    }
  }
  return false;
}

function findForbiddenAuthorityRefusal(
  value: unknown,
): FeedbackEventWriteRouteImplementationRefusalCode | null {
  for (const { keys, refusal_code } of forbiddenAuthorityKeyGroups) {
    if (containsTrueishForbiddenKey(value, new Set(keys))) {
      return refusal_code;
    }
  }
  return null;
}

function containsTrueishForbiddenKey(value: unknown, forbiddenKeys: Set<string>): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsTrueishForbiddenKey(item, forbiddenKeys));
  }
  for (const [key, nestedValue] of Object.entries(value as JsonRecord)) {
    if (forbiddenKeys.has(normalizeAuthorityKey(key)) && isTrueish(nestedValue)) {
      return true;
    }
    if (containsTrueishForbiddenKey(nestedValue, forbiddenKeys)) {
      return true;
    }
  }
  return false;
}

function isTrueish(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value !== 0 && Number.isFinite(value);
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized.length > 0 &&
      !["0", "false", "no", "off", "none", "null", "undefined"].includes(normalized)
    );
  }
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && typeof value === "object" && Object.keys(value).length > 0);
}

function searchParamsToRecord(searchParams: URLSearchParams): JsonRecord {
  const record: JsonRecord = {};
  for (const [key, value] of searchParams.entries()) {
    const parsedValue = parseQueryParamValue(value);
    const existing = record[key];
    if (existing === undefined) {
      record[key] = parsedValue;
    } else if (Array.isArray(existing)) {
      existing.push(parsedValue);
    } else {
      record[key] = [existing, parsedValue];
    }
  }
  return record;
}

function parseQueryParamValue(value: string): unknown {
  const normalized = value.trim();
  if (
    (normalized.startsWith("{") && normalized.endsWith("}")) ||
    (normalized.startsWith("[") && normalized.endsWith("]"))
  ) {
    try {
      return JSON.parse(normalized) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

function normalizeBooleanQueryParam(value: string | null, defaultValue: boolean): boolean {
  const normalized = normalizeString(value).toLowerCase();
  if (!normalized) return defaultValue;
  return !["0", "false", "no", "off"].includes(normalized);
}

function refusalForValidation(
  validation: FeedbackEventStoreValidationResult,
): FeedbackEventWriteRouteImplementationRefusal {
  for (const failureCode of validation.failure_codes) {
    if (failureCode === "event_type_invalid") return refusalForCode("invalid_event_type");
    if (failureCode === "target_kind_invalid") return refusalForCode("invalid_target_kind");
    if (failureCode === "target_id_missing") return refusalForCode("missing_target_id");
    if (
      failureCode === "source_ref_ids_not_array" ||
      failureCode === "source_ref_ids_empty_without_reason"
    ) {
      return refusalForCode("missing_source_refs_without_reason");
    }
    if (failureCode === "correction_text_required_for_correct_preview") {
      return refusalForCode("correction_text_required_for_correct_preview");
    }
    if (failureCode === "operator_note_contains_secret_like_pattern") {
      return refusalForCode("operator_note_secret_like_pattern");
    }
  }
  return refusalForCode("feedback_event_store_write_failed");
}

function refusalResponse(
  refusalCode: FeedbackEventWriteRouteImplementationRefusalCode,
  idempotencyKey: string | null = null,
): FeedbackEventWriteRouteImplementationResponse {
  return {
    response_version: responseVersion,
    accepted: false,
    inserted: false,
    duplicate: false,
    event_id: null,
    idempotency_key: idempotencyKey,
    event: null,
    validation: {
      passed: false,
      failure_codes: [refusalCode],
    },
    authority_boundary: getFeedbackEventStoreAuthorityBoundary(),
    refusal: refusalForCode(refusalCode),
    route_implemented_now: true,
    runtime_write_executed_now: false,
    db_open_now: false,
    sql_execution_now: false,
  };
}

function listRefusalResponse(
  refusalCode: FeedbackEventStoreListRouteImplementationRefusalCode,
): FeedbackEventStoreListRouteImplementationResponse {
  return {
    response_version: listResponseVersion,
    accepted: false,
    events: [],
    count: 0,
    next_cursor: null,
    validation: {
      passed: false,
      failure_codes: [refusalCode],
    },
    authority_boundary: getFeedbackEventStoreListRouteAuthorityBoundary({
      readNow: false,
      dbOpenNow: false,
      sqlExecutionNow: false,
    }),
    refusal: listRefusalForCode(refusalCode),
    route_implemented_now: true,
    runtime_read_executed_now: false,
    db_open_now: false,
    sql_execution_now: false,
  };
}

function getFeedbackEventStoreListRouteAuthorityBoundary({
  readNow,
  dbOpenNow,
  sqlExecutionNow,
}: {
  readNow: boolean;
  dbOpenNow: boolean;
  sqlExecutionNow: boolean;
}): FeedbackEventStoreListRouteImplementationAuthorityBoundary {
  return {
    contract_only: false,
    route_implemented_now: true,
    durable_feedback_event_read_now: readNow,
    durable_feedback_event_written_now: false,
    runtime_read_executed_now: readNow,
    runtime_write_executed_now: false,
    db_open_now: dbOpenNow,
    sql_execution_now: sqlExecutionNow,
    server_action_available_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function listRefusalForCode(
  refusalCode: FeedbackEventStoreListRouteImplementationRefusalCode,
): FeedbackEventStoreListRouteImplementationRefusal {
  return {
    refusal_code: refusalCode,
    message: messageForListRefusalCode(refusalCode),
    retryable: retryableListRefusal(refusalCode),
    authority_boundary_notes: [
      "Feedback Event Store list route implementation reads durable feedback events only; it grants no proof/evidence, Perspective promotion, work mutation, execution, retrieval/RAG, source fetch, provider/OpenAI, GitHub automation, external handoff, product-write, product-ID, or feedback write authority.",
      "Product-write lane remains parked by #686.",
    ],
  };
}

function messageForListRefusalCode(
  refusalCode: FeedbackEventStoreListRouteImplementationRefusalCode,
): string {
  switch (refusalCode) {
    case "route_not_implemented_in_this_slice":
      return "The feedback event list route is implemented in this slice; this refusal is retained only for contract compatibility.";
    case "missing_authority_acknowledgement":
      return "The list request is missing one or more required authority acknowledgements.";
    case "invalid_request_version":
      return "The request_version must be feedback_event_store_list_route_request.v0.1.";
    case "invalid_event_type":
      return "The event_type filter is not allowed by Feedback Event Store v0.1.";
    case "invalid_target_kind":
      return "The target_kind filter is not allowed by Feedback Event Store v0.1.";
    case "invalid_limit":
      return "The limit filter must be an integer from 1 through 100.";
    case "invalid_cursor":
      return "Cursor pagination is not implemented for Feedback Event Store list route v0.1.";
    case "raw_sql_filter_forbidden":
      return "Raw SQL, where clauses, source-fetch, retrieval/RAG, provider/OpenAI, product-write, proof/evidence, Perspective-promotion, and work-mutation query filters are forbidden.";
    case "forbidden_authority_requested":
      return "The list request asks for authority outside durable feedback event read authority.";
    case "product_write_authority_requested":
      return "The list request asks for product-write authority, which remains parked by #686.";
    case "retrieval_rag_execution_requested":
      return "The list request asks for retrieval/RAG execution, which is forbidden.";
    case "provider_openai_call_requested":
      return "The list request asks for provider/OpenAI calls, which are forbidden.";
    case "source_fetch_requested":
      return "The list request asks for source fetch, which is forbidden.";
    case "codex_or_github_automation_requested":
      return "The list request asks for Codex or GitHub automation, which is forbidden.";
    case "feedback_event_store_list_failed":
      return "Feedback events could not be read from the Feedback Event Store.";
  }
}

function retryableListRefusal(
  refusalCode: FeedbackEventStoreListRouteImplementationRefusalCode,
): boolean {
  return [
    "missing_authority_acknowledgement",
    "invalid_request_version",
    "invalid_event_type",
    "invalid_target_kind",
    "invalid_limit",
    "invalid_cursor",
    "feedback_event_store_list_failed",
  ].includes(refusalCode);
}

function refusalForCode(
  refusalCode: FeedbackEventWriteRouteImplementationRefusalCode,
): FeedbackEventWriteRouteImplementationRefusal {
  return {
    refusal_code: refusalCode,
    message: messageForRefusalCode(refusalCode),
    retryable: retryableRefusal(refusalCode),
    authority_boundary_notes: [
      "Feedback Event write route implementation persists durable feedback events only; it grants no proof/evidence, Perspective promotion, work mutation, execution, retrieval/RAG, source fetch, provider/OpenAI, GitHub automation, external handoff, product-write, or product-ID authority.",
      "Product-write lane remains parked by #686.",
    ],
  };
}

function messageForRefusalCode(
  refusalCode: FeedbackEventWriteRouteImplementationRefusalCode,
): string {
  switch (refusalCode) {
    case "invalid_json_body":
      return "The request body must be valid JSON.";
    case "request_version_invalid":
      return "The request_version must be feedback_event_write_route_request.v0.1.";
    case "route_not_implemented_in_this_slice":
      return "The feedback event write route is implemented in this slice; this refusal is retained only for contract compatibility.";
    case "missing_authority_acknowledgement":
      return "The request is missing one or more required authority acknowledgements.";
    case "invalid_event_type":
      return "The request event_type is not allowed by Feedback Event Store v0.1.";
    case "invalid_target_kind":
      return "The request target_kind is not allowed by Feedback Event Store v0.1.";
    case "missing_target_id":
      return "The request target_id is required.";
    case "missing_source_refs_without_reason":
      return "The request must include source_ref_ids or an explicit reason for empty source refs.";
    case "correction_text_required_for_correct_preview":
      return "correct_preview requests must include correction_text.";
    case "operator_note_secret_like_pattern":
      return "The request operator_note appears to contain a secret-like pattern.";
    case "forbidden_authority_requested":
      return "The request asks for authority outside durable feedback event write authority.";
    case "product_write_authority_requested":
      return "The request asks for product-write authority, which remains parked by #686.";
    case "retrieval_rag_execution_requested":
      return "The request asks for retrieval/RAG execution, which is forbidden.";
    case "provider_openai_call_requested":
      return "The request asks for provider/OpenAI calls, which are forbidden.";
    case "source_fetch_requested":
      return "The request asks for source fetch, which is forbidden.";
    case "codex_or_github_automation_requested":
      return "The request asks for Codex or GitHub automation, which is forbidden.";
    case "feedback_event_store_write_failed":
      return "The feedback event could not be written to the Feedback Event Store.";
  }
}

function retryableRefusal(
  refusalCode: FeedbackEventWriteRouteImplementationRefusalCode,
): boolean {
  return [
    "invalid_json_body",
    "request_version_invalid",
    "missing_authority_acknowledgement",
    "invalid_event_type",
    "invalid_target_kind",
    "missing_target_id",
    "missing_source_refs_without_reason",
    "correction_text_required_for_correct_preview",
    "operator_note_secret_like_pattern",
    "feedback_event_store_write_failed",
  ].includes(refusalCode);
}

function operatorNoteContainsSecret(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return forbiddenOperatorNotePatterns.some((pattern) => pattern.test(value));
}

function assignOptionalString<T extends object>(
  target: T,
  key: keyof T,
  value: unknown,
): void {
  const normalized = normalizeString(value);
  if (normalized) {
    (target as Record<string, unknown>)[String(key)] = normalized;
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => normalizeString(item))
        .filter((item) => item.length > 0),
    ),
  ).sort();
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAuthorityKey(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}
