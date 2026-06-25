import type {
  ResearchCandidateReviewMemoryDiscardInput,
  ResearchCandidateReviewMemoryRecord,
  ResearchCandidateReviewMemoryScope,
  ResearchCandidateReviewMemorySupersedeInput,
} from "../../types/research-candidate-review-memory-contract";

export type ReviewMemoryRouteVersion = "research_candidate_review_memory_routes.v0.1";

export type ReviewMemoryRouteStatus = "route_boundary_only";

export type ReviewMemoryRouteAction =
  | "create_empty_snapshot"
  | "upsert_record"
  | "discard_record"
  | "supersede_record";

export interface ReviewMemoryRouteAuthorityBoundary {
  route_boundary_only: true;
  same_origin_required: true;
  local_store_helper_only: true;
  ui_added_now: false;
  db_migration_added_now: false;
  db_query_or_write_now: false;
  provider_openai_call_now: false;
  source_fetch_now: false;
  retrieval_rag_execution_now: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface ReviewMemoryRouteRequest {
  route_version: ReviewMemoryRouteVersion;
  scope: ResearchCandidateReviewMemoryScope;
  action: ReviewMemoryRouteAction;
  store_file_path: string;
  as_of?: string;
  record?: ResearchCandidateReviewMemoryRecord;
  discard?: ResearchCandidateReviewMemoryDiscardInput;
  supersede?: ResearchCandidateReviewMemorySupersedeInput;
}

export interface ReviewMemoryRouteResponse {
  route_version: ReviewMemoryRouteVersion;
  scope: ResearchCandidateReviewMemoryScope;
  status: "ok" | "error";
  action?: ReviewMemoryRouteAction;
  snapshot?: unknown;
  error_code?: string;
  boundary_notes: string[];
  authority_boundary: ReviewMemoryRouteAuthorityBoundary;
}

export interface ReviewMemoryRouteValidationResult {
  passed: boolean;
  failure_codes: string[];
  request?: ReviewMemoryRouteRequest;
}

const routeVersion: ReviewMemoryRouteVersion = "research_candidate_review_memory_routes.v0.1";
const routeScope: ResearchCandidateReviewMemoryScope = "project:augnes";
const routeActions: ReviewMemoryRouteAction[] = [
  "create_empty_snapshot",
  "upsert_record",
  "discard_record",
  "supersede_record",
];

const unsafeStringPatterns = [
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /raw source body/i,
  /raw provider output/i,
  /raw conversation/i,
  /hidden reasoning/i,
  /raw candidate payload/i,
  /raw db row/i,
  /raw_db_row/i,
  /browser dump/i,
  /sk-/i,
  /ghp_/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
  /proof\/evidence/i,
  /perspective promotion/i,
  /work mutation/i,
  /provider call/i,
  /retrieval\/rag/i,
  /github automation/i,
  /codex execution/i,
  /product write/i,
];

const safeErrorCodes = new Set([
  "invalid_json_body",
  "same_origin_required",
  "invalid_route_request",
  "unsafe_store_file_path",
  "store_file_missing",
  "store_validation_failed",
  "store_action_failed",
]);

export function getReviewMemoryRouteAuthorityBoundary(): ReviewMemoryRouteAuthorityBoundary {
  return {
    route_boundary_only: true,
    same_origin_required: true,
    local_store_helper_only: true,
    ui_added_now: false,
    db_migration_added_now: false,
    db_query_or_write_now: false,
    provider_openai_call_now: false,
    source_fetch_now: false,
    retrieval_rag_execution_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function getReviewMemoryRouteBoundaryNotes(): string[] {
  return [
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Review memory route is route-boundary-only.",
  ];
}

export function isReviewMemoryRouteAction(value: unknown): value is ReviewMemoryRouteAction {
  return typeof value === "string" && routeActions.includes(value as ReviewMemoryRouteAction);
}

export function sanitizeReviewMemoryRouteError(error: unknown): string {
  if (typeof error === "string" && safeErrorCodes.has(error)) return error;
  if (error instanceof Error) {
    const message = error.message.split(",")[0] ?? "";
    if (message.startsWith("record_not_found:")) return "store_action_failed";
    if (message.startsWith("older_record_update_rejected:")) return "store_validation_failed";
    if (message.startsWith("self_supersede_rejected:")) return "store_validation_failed";
    if (message.includes("ENOENT")) return "store_file_missing";
  }
  return "store_action_failed";
}

export function validateReviewMemoryRouteRequest(
  value: unknown,
): ReviewMemoryRouteValidationResult {
  const failureCodes: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { passed: false, failure_codes: ["invalid_request_body"] };
  }

  const input = value as Partial<ReviewMemoryRouteRequest>;
  if (input.route_version !== routeVersion) failureCodes.push("invalid_route_version");
  if (input.scope !== routeScope) failureCodes.push("invalid_scope");
  if (!isReviewMemoryRouteAction(input.action)) {
    failureCodes.push(`invalid_action:${String(input.action ?? "missing")}`);
  }
  if (!input.store_file_path) {
    failureCodes.push("missing_store_file_path");
  } else if (!isSafeReviewMemoryRouteStoreFilePath(input.store_file_path)) {
    failureCodes.push("unsafe_store_file_path");
  }

  failureCodes.push(...validateTopLevelStringFields(input));

  if (input.action === "create_empty_snapshot" && !input.as_of) {
    failureCodes.push("missing_as_of");
  }
  if (input.action === "upsert_record" && !input.record) {
    failureCodes.push("missing_record");
  }
  if (input.action === "discard_record" && !input.discard) {
    failureCodes.push("missing_discard");
  }
  if (input.action === "supersede_record" && !input.supersede) {
    failureCodes.push("missing_supersede");
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
    request: failureCodes.length === 0 ? (input as ReviewMemoryRouteRequest) : undefined,
  };
}

export function isSafeReviewMemoryRouteStoreFilePath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0) return false;
  if (value.endsWith("/") || value.endsWith("\\")) return false;
  if (value.includes("\0")) return false;
  if (value.includes("..")) return false;
  return !unsafeStringPatterns.some((pattern) => pattern.test(value));
}

function validateTopLevelStringFields(input: Partial<ReviewMemoryRouteRequest>): string[] {
  const failureCodes: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && unsafeStringPatterns.some((pattern) => pattern.test(value))) {
      failureCodes.push(`unsafe_top_level_field:${key}`);
    }
  }
  return failureCodes;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}
