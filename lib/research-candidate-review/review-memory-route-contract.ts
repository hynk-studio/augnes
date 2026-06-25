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

const allowedStorePathPrefixes = [
  "tmp/research-candidate-review-memory/",
  ".tmp/research-candidate-review-memory/",
] as const;

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

const unsafeNestedPayloadPatterns = [
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
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
  /provider thread/i,
  /provider run/i,
  /provider session/i,
];

const unsafeAuthorityImplicationPatterns = [
  /product[- ]write (execution|enabled|approved|authority granted|implementation)/i,
  /execute product[- ]write/i,
  /write product records/i,
  /proof\/evidence creation/i,
  /proof created/i,
  /evidence record created/i,
  /perspective promotion/i,
  /perspective promoted/i,
  /work mutation/i,
  /mutate work/i,
  /provider call/i,
  /provider called/i,
  /retrieval\/rag execution/i,
  /retrieval execution/i,
  /rag execution/i,
  /github automation/i,
  /github pr created/i,
  /codex execution/i,
  /codex executed/i,
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
    failureCodes.push("invalid_action");
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

  failureCodes.push(...validateActionPayloadShape(input));

  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
    request: failureCodes.length === 0 ? (input as ReviewMemoryRouteRequest) : undefined,
  };
}

export function isSafeReviewMemoryRouteStoreFilePath(value: unknown): value is string {
  return isAllowedReviewMemoryStorePath(value);
}

export function normalizeReviewMemoryRouteStoreFilePath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value;
}

export function isAllowedReviewMemoryStorePath(value: unknown): value is string {
  const normalized = normalizeReviewMemoryRouteStoreFilePath(value);
  if (normalized === undefined) return false;
  if (normalized.length === 0) return false;
  if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) return false;
  if (normalized.includes("\\") || normalized.includes("//")) return false;
  if (normalized.endsWith("/") || normalized.endsWith("\\")) return false;
  if (normalized.includes("\0")) return false;
  if (normalized.includes("..")) return false;
  if (!normalized.endsWith(".json")) return false;
  if (!allowedStorePathPrefixes.some((prefix) => normalized.startsWith(prefix))) return false;

  const fileName = normalized.slice(normalized.lastIndexOf("/") + 1);
  if (fileName.length <= ".json".length) return false;
  return !unsafeStringPatterns.some((pattern) => pattern.test(normalized));
}

function validateTopLevelStringFields(input: Partial<ReviewMemoryRouteRequest>): string[] {
  const failureCodes: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && stringHasUnsafeRoutePayloadMarker(value, key)) {
      failureCodes.push(`unsafe_top_level_field:${key}`);
    }
  }
  return failureCodes;
}

function validateActionPayloadShape(input: Partial<ReviewMemoryRouteRequest>): string[] {
  const failureCodes: string[] = [];
  if (input.record !== undefined) {
    failureCodes.push(...validateNestedPayloadSafety(input.record, "record"));
  }
  if (input.discard !== undefined) {
    failureCodes.push(...validateNestedPayloadSafety(input.discard, "discard"));
  }
  if (input.supersede !== undefined) {
    failureCodes.push(...validateNestedPayloadSafety(input.supersede, "supersede"));
  }
  return failureCodes;
}

function validateNestedPayloadSafety(value: unknown, path: string): string[] {
  if (typeof value === "string") {
    return stringHasUnsafeRoutePayloadMarker(value, path) ? [`unsafe_nested_field:${path}`] : [];
  }
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => validateNestedPayloadSafety(item, path));
  }

  const failureCodes: string[] = [];
  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`;
    failureCodes.push(...validateNestedPayloadSafety(nestedValue, nestedPath));
  }
  return failureCodes;
}

function stringHasUnsafeRoutePayloadMarker(value: string, path: string): boolean {
  if (pathIsAllowedBoundaryNote(path, value)) return false;
  if (unsafeNestedPayloadPatterns.some((pattern) => pattern.test(value))) return true;
  if (isSafeRouteBoundaryDenial(value)) return false;
  return unsafeAuthorityImplicationPatterns.some((pattern) => pattern.test(value));
}

function pathIsAllowedBoundaryNote(path: string, value: string): boolean {
  if (!path.endsWith("boundary_notes") && !path.includes(".boundary_notes")) return false;
  return [
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Review memory route is route-boundary-only.",
  ].includes(value);
}

function isSafeRouteBoundaryDenial(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("product-write remains parked") ||
    normalized.includes("product write remains parked") ||
    normalized.includes("parked by #686") ||
    normalized.includes("product_write_authority false") ||
    normalized.includes("product_write_authority: false") ||
    normalized.includes("no product write") ||
    normalized.includes("not product write") ||
    normalized.includes("does not write product records")
  );
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}
