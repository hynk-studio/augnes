import type {
  ResearchCandidateReviewMemoryDbListFiltersV01,
  ResearchCandidateReviewMemoryDbStoreResultV01,
  ResearchCandidateReviewMemoryDbStoreStatus,
} from "./review-memory-db-store";

export const RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01 =
  "research_candidate_review_memory_db_routes.v0.1" as const;

type Scope = "project:augnes";

export type ResearchCandidateReviewMemoryDbRouteStatus = "ok" | "error";

export type ResearchCandidateReviewMemoryDbRouteAction =
  | "create_review_record"
  | "list_review_records"
  | "read_review_record"
  | "list_review_record_activity"
  | "append_review_record_activity"
  | "discard_review_record";

export type ResearchCandidateReviewMemoryDbRouteErrorCode =
  | "same_origin_required"
  | "invalid_json_body"
  | "invalid_json_object"
  | "invalid_route_request"
  | "invalid_db_path"
  | "db_missing"
  | "schema_missing"
  | "invalid_review_record_id"
  | "invalid_activity_input"
  | "invalid_discard_reason"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "conflict_existing_record"
  | "not_found";

export interface ResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01 {
  review_memory_db_routes_now: true;
  same_origin_required: true;
  db_backed_review_memory_routes_now: true;
  explicit_operator_route_action_only: true;
  db_query_or_write_now: true;
  db_schema_ensure_on_write_now: true;
  ui_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  review_memory_is_truth: false;
  review_memory_is_proof: false;
  review_memory_is_accepted_evidence: false;
  review_memory_is_durable_perspective_state: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  source_ref_is_proof: false;
  discard_is_delete: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ResearchCandidateReviewMemoryDbRouteResponseV01 {
  route_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01;
  scope: Scope;
  status: ResearchCandidateReviewMemoryDbRouteStatus;
  action?: ResearchCandidateReviewMemoryDbRouteAction;
  error_code: ResearchCandidateReviewMemoryDbRouteErrorCode | null;
  result?: ResearchCandidateReviewMemoryDbStoreResultV01;
  boundary_notes: string[];
  authority_boundary: ResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01;
}

export interface ResearchCandidateReviewMemoryDbRouteBodyV01 {
  route_version?: unknown;
  scope?: unknown;
  action?: unknown;
  db_path?: unknown;
  input?: unknown;
  reason?: unknown;
}

export interface ResearchCandidateReviewMemoryDbRouteValidationResultV01 {
  passed: boolean;
  failure_codes: ResearchCandidateReviewMemoryDbRouteErrorCode[];
  body?: ResearchCandidateReviewMemoryDbRouteBodyV01;
}

const scope: Scope = "project:augnes";
const safeDbPathPrefixes = [
  "tmp/research-candidate-review-memory/",
  ".tmp/research-candidate-review-memory/",
] as const;

const unsafeStringPatterns = [
  /SAFE_MARKER_/i,
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
  /raw source body/i,
  /raw provider output/i,
  /raw retrieval output/i,
  /raw conversation/i,
  /hidden reasoning/i,
  /raw DB row/i,
  /raw_db_row/i,
  /raw diff/i,
  /telemetry dump/i,
  /browser dump/i,
  /raw browser dump/i,
  /provider thread/i,
  /provider run/i,
  /provider session/i,
  /\bthread_[A-Za-z0-9_-]+/i,
  /\brun_[A-Za-z0-9_-]+/i,
  /\bsession_[A-Za-z0-9_-]+/i,
  /\buploaded[-_ ]?file[-_ ]?id/i,
  /\bconnector[-_ ]?id/i,
  /sk-[A-Za-z0-9]/i,
  /ghp_[A-Za-z0-9]/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /\btoken\b/i,
  /password:/i,
  /secret:/i,
  /\bsecret\b/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
];

export function createResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01():
  ResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01 {
  return {
    review_memory_db_routes_now: true,
    same_origin_required: true,
    db_backed_review_memory_routes_now: true,
    explicit_operator_route_action_only: true,
    db_query_or_write_now: true,
    db_schema_ensure_on_write_now: true,
    ui_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    review_memory_is_truth: false,
    review_memory_is_proof: false,
    review_memory_is_accepted_evidence: false,
    review_memory_is_durable_perspective_state: false,
    candidate_is_fact: false,
    candidate_is_proof: false,
    source_ref_is_proof: false,
    discard_is_delete: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function getResearchCandidateReviewMemoryDbRouteBoundaryNotesV01(): string[] {
  return [
    "Product-write remains parked by #686.",
    "Review memory is not truth, proof, accepted evidence, or durable Perspective state.",
    "Source refs are lineage pointers, not proof.",
    "Candidate refs are review refs, not facts.",
    "Discard is lifecycle transition, not delete.",
  ];
}

export function requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(
  request: Request,
): boolean {
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

export function isSafeResearchCandidateReviewMemoryDbRoutePathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0) return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  const fileName = value.slice(value.lastIndexOf("/") + 1);
  if (fileName.length <= ".db".length) return false;
  return !unsafeStringPatterns.some((pattern) => pattern.test(value));
}

export function isSafeResearchCandidateReviewMemoryDbRouteRefV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 256) return false;
  if (value.includes("/") || value.includes("\\") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  return !unsafeStringPatterns.some((pattern) => pattern.test(value));
}

export function validateResearchCandidateReviewMemoryDbRouteBodyV01(
  value: unknown,
  expectedAction?: ResearchCandidateReviewMemoryDbRouteAction,
): ResearchCandidateReviewMemoryDbRouteValidationResultV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { passed: false, failure_codes: ["invalid_json_object"] };
  }
  const body = value as ResearchCandidateReviewMemoryDbRouteBodyV01;
  const failureCodes: ResearchCandidateReviewMemoryDbRouteErrorCode[] = [];
  if (
    body.route_version !== undefined &&
    body.route_version !== RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01
  ) {
    failureCodes.push("invalid_route_request");
  }
  if (body.scope !== undefined && body.scope !== scope) failureCodes.push("invalid_route_request");
  if (expectedAction && body.action !== undefined && body.action !== expectedAction) {
    failureCodes.push("invalid_route_request");
  }
  if (!isSafeResearchCandidateReviewMemoryDbRoutePathV01(body.db_path)) {
    failureCodes.push("invalid_db_path");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueRouteErrorCodes(failureCodes),
    body: failureCodes.length === 0 ? body : undefined,
  };
}

export function validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01(
  url: URL,
): ResearchCandidateReviewMemoryDbRouteErrorCode | null {
  const routeVersion = url.searchParams.get("route_version");
  const queryScope = url.searchParams.get("scope");
  if (routeVersion && routeVersion !== RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01) {
    return "invalid_route_request";
  }
  if (queryScope && queryScope !== scope) return "invalid_route_request";
  return null;
}

export function parseResearchCandidateReviewMemoryDbRouteListFiltersV01(
  url: URL,
): ResearchCandidateReviewMemoryDbListFiltersV01 {
  const limit = url.searchParams.get("limit");
  return {
    lifecycle_state: (url.searchParams.get("lifecycle_state") || undefined) as
      | ResearchCandidateReviewMemoryDbListFiltersV01["lifecycle_state"]
      | undefined,
    review_decision: (url.searchParams.get("review_decision") || undefined) as
      | ResearchCandidateReviewMemoryDbListFiltersV01["review_decision"]
      | undefined,
    candidate_ref: url.searchParams.get("candidate_ref") || undefined,
    source_ref: url.searchParams.get("source_ref") || undefined,
    include_discarded: url.searchParams.get("include_discarded") === "1",
    ...(limit === null ? {} : { limit: Number(limit) }),
  };
}

export function validateResearchCandidateReviewMemoryDbRouteDiscardReasonV01(
  value: unknown,
): ResearchCandidateReviewMemoryDbRouteErrorCode | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 500) {
    return "invalid_discard_reason";
  }
  if (unsafeStringPatterns.some((pattern) => pattern.test(value))) {
    return "blocked_private_or_raw_payload";
  }
  return null;
}

export function researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(
  result: ResearchCandidateReviewMemoryDbStoreResultV01,
  okStatus = 200,
): number {
  if (result.status === "not_found") return 404;
  if (result.status === "conflict_existing_record") return 409;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked") || result.status === "rejected") return 400;
  return okStatus;
}

export function researchCandidateReviewMemoryDbRouteStoreErrorCodeV01(
  status: ResearchCandidateReviewMemoryDbStoreStatus,
): ResearchCandidateReviewMemoryDbRouteErrorCode | null {
  if (status === "not_found") return "not_found";
  if (status === "conflict_existing_record") return "conflict_existing_record";
  if (status === "blocked_private_or_raw_payload") return "blocked_private_or_raw_payload";
  if (status === "blocked_forbidden_authority") return "blocked_forbidden_authority";
  if (status === "blocked_invalid_input" || status === "rejected") return "blocked_invalid_input";
  return null;
}

export function createResearchCandidateReviewMemoryDbRouteStoreResponseV01(
  action: ResearchCandidateReviewMemoryDbRouteAction,
  result: ResearchCandidateReviewMemoryDbStoreResultV01,
): ResearchCandidateReviewMemoryDbRouteResponseV01 {
  const errorCode = researchCandidateReviewMemoryDbRouteStoreErrorCodeV01(result.status);
  return {
    route_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01,
    scope,
    status: errorCode ? "error" : "ok",
    action,
    error_code: errorCode,
    result,
    boundary_notes: getResearchCandidateReviewMemoryDbRouteBoundaryNotesV01(),
    authority_boundary: createResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01(),
  };
}

export function createResearchCandidateReviewMemoryDbRouteErrorResponseV01(
  errorCode: ResearchCandidateReviewMemoryDbRouteErrorCode,
  action?: ResearchCandidateReviewMemoryDbRouteAction,
): ResearchCandidateReviewMemoryDbRouteResponseV01 {
  return {
    route_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01,
    scope,
    status: "error",
    action,
    error_code: errorCode,
    boundary_notes: getResearchCandidateReviewMemoryDbRouteBoundaryNotesV01(),
    authority_boundary: createResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01(),
  };
}

function isLocalTestHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(normalized) ||
    /^\[::1\](:\d+)?$/.test(normalized)
  );
}

function uniqueRouteErrorCodes(
  values: ResearchCandidateReviewMemoryDbRouteErrorCode[],
): ResearchCandidateReviewMemoryDbRouteErrorCode[] {
  return Array.from(new Set(values));
}
