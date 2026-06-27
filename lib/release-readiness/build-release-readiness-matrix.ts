import { createHash } from "node:crypto";

export const RELEASE_READINESS_MATRIX_VERSION =
  "release_readiness_matrix.v0.1" as const;
export const RELEASE_READINESS_INPUT_VERSION =
  "release_readiness_input.v0.1" as const;
export const RELEASE_READINESS_RESULT_VERSION =
  "release_readiness_result.v0.1" as const;
export const RELEASE_READINESS_ITEM_VERSION =
  "release_readiness_item.v0.1" as const;
export const RELEASE_READINESS_CATEGORY_VERSION =
  "release_readiness_category.v0.1" as const;

const scope = "project:augnes" as const;
const blockedMatrixId = "release-readiness:blocked" as const;

export const ReleaseReadinessStatuses = [
  "built",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
] as const;
export type ReleaseReadinessStatus =
  (typeof ReleaseReadinessStatuses)[number];

export const ReleaseReadinessDecisions = [
  "blocked",
  "not_ready",
  "needs_operator_review",
  "ready_for_release_candidate_review",
  "rejected",
] as const;
export type ReleaseReadinessDecision =
  (typeof ReleaseReadinessDecisions)[number];

export const ReleaseReadinessCategories = [
  "runtime_audit",
  "product_write_reentry",
  "git_ledger",
  "dogfooding",
  "feedback",
  "privacy",
  "verification",
  "rollback",
  "idempotency",
  "failure_modes",
  "state_boundaries",
  "external_side_effects",
  "operator_approval",
  "release_scope",
  "unknown",
] as const;
export type ReleaseReadinessCategory =
  (typeof ReleaseReadinessCategories)[number];

export const mandatoryReleaseReadinessCategoriesV01 = [
  "runtime_audit",
  "product_write_reentry",
  "git_ledger",
  "dogfooding",
  "feedback",
  "privacy",
  "verification",
  "rollback",
  "idempotency",
  "failure_modes",
  "state_boundaries",
  "external_side_effects",
  "operator_approval",
  "release_scope",
] as const satisfies readonly ReleaseReadinessCategory[];

export const ReleaseReadinessSeverities = [
  "info",
  "warning",
  "blocking",
  "critical",
  "unknown",
] as const;
export type ReleaseReadinessSeverity =
  (typeof ReleaseReadinessSeverities)[number];

export const ReleaseReadinessReasonCodes = [
  "release_readiness_matrix_present",
  "release_readiness_is_review_only",
  "release_readiness_is_not_truth",
  "release_readiness_is_not_proof",
  "release_readiness_does_not_grant_authority",
  "release_candidate_review_not_release",
  "release_not_executed",
  "release_artifact_not_created",
  "product_write_remains_parked",
  "product_write_denied",
  "product_write_not_executed",
  "product_write_authority_not_granted",
  "product_write_runtime_not_implemented",
  "product_write_adapter_not_enabled",
  "product_id_allocation_not_executed",
  "runtime_audit_ref_present",
  "runtime_audit_ref_missing",
  "product_write_reentry_ref_present",
  "product_write_reentry_ref_missing",
  "git_ledger_contract_ref_present",
  "git_ledger_contract_ref_missing",
  "dogfooding_ref_present",
  "feedback_ref_present",
  "verification_ref_present",
  "verification_ref_missing",
  "rollback_plan_present",
  "rollback_plan_missing",
  "idempotency_plan_present",
  "idempotency_plan_missing",
  "failure_mode_review_present",
  "failure_mode_review_missing",
  "privacy_boundary_review_present",
  "privacy_boundary_review_required",
  "state_mutation_boundary_review_present",
  "state_mutation_boundary_review_required",
  "external_side_effect_boundary_review_present",
  "external_side_effect_boundary_review_required",
  "operator_approval_present",
  "operator_approval_missing",
  "release_scope_present",
  "release_scope_missing",
  "mandatory_category_missing",
  "blocking_item_present",
  "operator_review_required",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "runtime_audit_is_review_cue_only",
  "git_ledger_packet_is_not_commit",
  "git_ledger_packet_is_not_product_write",
  "dogfooding_record_is_review_signal",
  "feedback_is_advisory",
  "source_refs_are_lineage_not_proof",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "git_ledger_export_not_executed",
  "git_write_not_executed",
  "github_api_not_called",
  "repository_file_not_written",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
] as const;
export type ReleaseReadinessReasonCode =
  (typeof ReleaseReadinessReasonCodes)[number];

export interface ReleaseReadinessAuthorityBoundary {
  release_readiness_matrix_now: true;
  review_only: true;
  release_execution_now: false;
  release_artifact_creation_now: false;
  release_authority_granted_now: false;
  release_candidate_approved_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_write_target_contract_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  product_route_now: false;
  product_ui_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  browser_log_ingestion_now: false;
  session_log_ingestion_now: false;
  raw_conversation_ingestion_now: false;
  telemetry_ingestion_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  git_commit_now: false;
  git_branch_now: false;
  git_tag_now: false;
  github_api_call_now: false;
  pull_request_creation_now: false;
  repository_file_write_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  release_readiness_is_truth: false;
  release_readiness_is_proof: false;
  release_readiness_is_authority: false;
  verification_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
  product_write_authority: false;
}

export interface ReleaseReadinessInputItem {
  input_item_id: string;
  category: ReleaseReadinessCategory;
  severity: ReleaseReadinessSeverity;
  satisfied: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  runtime_audit_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_refs: string[];
  dogfooding_refs: string[];
  feedback_refs: string[];
  verification_refs: string[];
  public_safe: boolean;
  reason_codes: ReleaseReadinessReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseReadinessInput {
  input_version: typeof RELEASE_READINESS_INPUT_VERSION;
  matrix_version: typeof RELEASE_READINESS_MATRIX_VERSION;
  scope: typeof scope;
  matrix_id: string;
  as_of: string;
  runtime_audit_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_contract_refs: string[];
  release_scope_refs: string[];
  input_items: ReleaseReadinessInputItem[];
  boundary_notes: string[];
  reason_codes: ReleaseReadinessReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseReadinessMatrixItem {
  item_version: typeof RELEASE_READINESS_ITEM_VERSION;
  scope: typeof scope;
  item_id: string;
  category: ReleaseReadinessCategory;
  severity: ReleaseReadinessSeverity;
  satisfied: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  runtime_audit_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_refs: string[];
  dogfooding_refs: string[];
  feedback_refs: string[];
  verification_refs: string[];
  public_safe: true;
  reason_codes: ReleaseReadinessReasonCode[];
  authority_boundary: ReleaseReadinessAuthorityBoundary;
}

export interface ReleaseReadinessCategorySummary {
  category_version: typeof RELEASE_READINESS_CATEGORY_VERSION;
  scope: typeof scope;
  category: ReleaseReadinessCategory;
  satisfied_count: number;
  unsatisfied_count: number;
  blocking_count: number;
  critical_count: number;
  bounded_summary: string;
  item_refs: string[];
  reason_codes: ReleaseReadinessReasonCode[];
  authority_boundary: ReleaseReadinessAuthorityBoundary;
}

export interface ReleaseReadinessMatrixResult {
  result_version: typeof RELEASE_READINESS_RESULT_VERSION;
  matrix_version: typeof RELEASE_READINESS_MATRIX_VERSION;
  scope: typeof scope;
  matrix_id: string;
  status: ReleaseReadinessStatus;
  decision: ReleaseReadinessDecision;
  as_of: string;
  items: ReleaseReadinessMatrixItem[];
  category_summaries: ReleaseReadinessCategorySummary[];
  missing_category_refs: string[];
  blocking_item_refs: string[];
  warnings: string[];
  release_executed: false;
  release_artifact_created: false;
  release_authority_granted: false;
  release_candidate_approved: false;
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ReleaseReadinessReasonCode[];
  authority_boundary: ReleaseReadinessAuthorityBoundary;
  matrix_fingerprint: string;
}

export interface ReleaseReadinessValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type JsonRecord = Record<string, unknown>;

const forbiddenFalseAuthorityFields = [
  "release_execution_now",
  "release_artifact_creation_now",
  "release_authority_granted_now",
  "release_candidate_approved_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_write_target_contract_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "product_route_now",
  "product_ui_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "browser_log_ingestion_now",
  "session_log_ingestion_now",
  "raw_conversation_ingestion_now",
  "telemetry_ingestion_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "repository_file_write_now",
  "codex_execution_authority",
  "github_automation_authority",
  "release_readiness_is_truth",
  "release_readiness_is_proof",
  "release_readiness_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
] as const;

const requiredTrueAuthorityFields = [
  "release_readiness_matrix_now",
  "review_only",
] as const;

const privateOrRawMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw product-write payload",
  "raw release payload",
  "raw audit payload",
  "raw ledger payload",
  "raw source body",
  "browser dump",
  "raw browser dump",
  "raw DB row",
  "raw_db_row",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
] as const;

const rawConversationMarkers = ["raw conversation"] as const;
const hiddenReasoningMarkers = ["hidden reasoning"] as const;
const telemetryMarkers = ["telemetry dump"] as const;
const privateUrlMarkers = ["http://", "https://"] as const;
const symbolicLocalPathMarkers = ["private-local-path-ref:"] as const;
const secretLikeMarkers = [
  "password:",
  "secret:",
  "private key",
  "secret-like release readiness input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createReleaseReadinessAuthorityBoundaryV01():
  ReleaseReadinessAuthorityBoundary {
  return {
    release_readiness_matrix_now: true,
    review_only: true,
    release_execution_now: false,
    release_artifact_creation_now: false,
    release_authority_granted_now: false,
    release_candidate_approved_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_write_target_contract_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    product_route_now: false,
    product_ui_now: false,
    db_query_or_write_now: false,
    route_now: false,
    ui_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    browser_log_ingestion_now: false,
    session_log_ingestion_now: false,
    raw_conversation_ingestion_now: false,
    telemetry_ingestion_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    git_commit_now: false,
    git_branch_now: false,
    git_tag_now: false,
    github_api_call_now: false,
    pull_request_creation_now: false,
    repository_file_write_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    release_readiness_is_truth: false,
    release_readiness_is_proof: false,
    release_readiness_is_authority: false,
    verification_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
    product_write_authority: false,
  };
}

export function validateReleaseReadinessInputV01(
  input: unknown,
): ReleaseReadinessValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ReleaseReadinessInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));

  if (value.input_version !== RELEASE_READINESS_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.matrix_version !== RELEASE_READINESS_MATRIX_VERSION) {
    failures.push("matrix_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.matrix_id, "matrix_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "runtime_audit_refs",
    "product_write_reentry_refs",
    "git_ledger_contract_refs",
    "release_scope_refs",
    "boundary_notes",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.input_items)) {
    failures.push("input_items_invalid_array");
  } else {
    for (const item of value.input_items) {
      failures.push(...validateReleaseReadinessInputItemV01(item).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateReleaseReadinessInputItemV01(
  input: unknown,
): ReleaseReadinessValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["item_invalid_object"] };
  }
  const value = input as Partial<ReleaseReadinessInputItem>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "item"));
  failures.push(...collectPublicUnsafeFailures(input, "item"));

  failures.push(...validateSafeString(value.input_item_id, "input_item_id"));
  if (!ReleaseReadinessCategories.includes(value.category as ReleaseReadinessCategory)) {
    failures.push("category_invalid");
  }
  if (!ReleaseReadinessSeverities.includes(value.severity as ReleaseReadinessSeverity)) {
    failures.push("severity_invalid");
  }
  if (typeof value.satisfied !== "boolean") {
    failures.push("satisfied_invalid_boolean");
  }
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "source_refs",
    "runtime_audit_refs",
    "product_write_reentry_refs",
    "git_ledger_refs",
    "dogfooding_refs",
    "feedback_refs",
    "verification_refs",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  if (value.public_safe !== true) failures.push("public_safe_not_true");
  failures.push(...validateReasonCodes(value.reason_codes, "item_reason_codes"));
  failures.push(
    ...validateAuthorityBoundary(value.authority_boundary, "item_authority_boundary"),
  );

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildReleaseReadinessMatrixV01(
  input: ReleaseReadinessInput,
): ReleaseReadinessMatrixResult {
  const validation = validateReleaseReadinessInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultBoundaryReasonCodes(),
      "release_readiness_matrix_present",
    ]);
  }

  if (input.input_items.length === 0) {
    return finalizeResult({
      result_version: RELEASE_READINESS_RESULT_VERSION,
      matrix_version: RELEASE_READINESS_MATRIX_VERSION,
      scope,
      matrix_id: input.matrix_id,
      status: "empty",
      decision: "not_ready",
      as_of: input.as_of,
      items: [],
      category_summaries: [],
      missing_category_refs: [],
      blocking_item_refs: [],
      warnings: ["No release readiness items were supplied."],
      release_executed: false,
      release_artifact_created: false,
      release_authority_granted: false,
      release_candidate_approved: false,
      product_write_executed: false,
      product_id_allocated: false,
      product_write_authority_granted: false,
      reason_codes: normalizeNotReadyRequiredRefReasonCodesV01(
        "not_ready",
        [
          ...input.reason_codes,
          ...inputReasonCodes(input),
          ...defaultBoundaryReasonCodes(),
          "release_readiness_matrix_present",
          "operator_review_required",
        ],
        input,
      ),
      authority_boundary: createReleaseReadinessAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createReleaseReadinessAuthorityBoundaryV01();
  const items = dedupeItems(input.input_items).map(
    (item): ReleaseReadinessMatrixItem => ({
      item_version: RELEASE_READINESS_ITEM_VERSION,
      scope,
      item_id: item.input_item_id,
      category: item.category,
      severity: item.severity,
      satisfied: item.satisfied,
      bounded_title: item.bounded_title,
      bounded_summary: item.bounded_summary,
      source_refs: uniqueSorted(item.source_refs),
      runtime_audit_refs: uniqueSorted(item.runtime_audit_refs),
      product_write_reentry_refs: uniqueSorted(item.product_write_reentry_refs),
      git_ledger_refs: uniqueSorted(item.git_ledger_refs),
      dogfooding_refs: uniqueSorted(item.dogfooding_refs),
      feedback_refs: uniqueSorted(item.feedback_refs),
      verification_refs: uniqueSorted(item.verification_refs),
      public_safe: true,
      reason_codes: uniqueSorted([
        ...item.reason_codes,
        ...reasonCodesForItem(item),
      ]),
      authority_boundary: authorityBoundary,
    }),
  );
  const missingCategories = getMissingMandatoryCategoriesV01(items);
  const missingCategoryRefs = missingCategories.map(missingCategoryRefForCategoryV01);
  const missingCategoryReasonCodes = missingReasonCodesForCategoriesV01(missingCategories);
  const unsatisfiedBlockingRefs = items
    .filter((item) => !item.satisfied && isBlockingSeverity(item.severity))
    .map((item) => item.item_id);
  const blockingItemRefs = unsatisfiedBlockingRefs.concat(missingCategoryRefs);
  const decision = decideReadiness(items, input, missingCategories);
  const categorySummaries = buildCategorySummaries(items, authorityBoundary);

  return finalizeResult({
    result_version: RELEASE_READINESS_RESULT_VERSION,
    matrix_version: RELEASE_READINESS_MATRIX_VERSION,
    scope,
    matrix_id: input.matrix_id,
    status: "built",
    decision,
    as_of: input.as_of,
    items,
    category_summaries: categorySummaries,
    missing_category_refs: uniqueSorted(missingCategoryRefs),
    blocking_item_refs: uniqueSorted(blockingItemRefs),
    warnings: warningsForDecision(decision),
    release_executed: false,
    release_artifact_created: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: normalizeNotReadyRequiredRefReasonCodesV01(
      decision,
      [
        ...input.reason_codes,
        ...inputReasonCodes(input),
        ...items.flatMap((item) => item.reason_codes),
        ...categorySummaries.flatMap((summary) => summary.reason_codes),
        ...reasonCodesForDecision(decision, input),
        ...missingCategoryReasonCodes,
        ...defaultBoundaryReasonCodes(),
        "release_readiness_matrix_present",
      ],
      input,
    ),
    authority_boundary: authorityBoundary,
  });
}

export function createReleaseReadinessFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<ReleaseReadinessMatrixResult, "matrix_fingerprint">,
): ReleaseReadinessMatrixResult {
  return {
    ...resultWithoutFingerprint,
    matrix_fingerprint: createReleaseReadinessFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    ReleaseReadinessStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: ReleaseReadinessReasonCode[],
): ReleaseReadinessMatrixResult {
  const matrixId =
    isRecord(input) &&
    typeof input.matrix_id === "string" &&
    unsafeStringFailureCodes(input.matrix_id, "matrix_id").length === 0
      ? input.matrix_id
      : blockedMatrixId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "1970-01-01T00:00:00.000Z";
  return finalizeResult({
    result_version: RELEASE_READINESS_RESULT_VERSION,
    matrix_version: RELEASE_READINESS_MATRIX_VERSION,
    scope,
    matrix_id: matrixId,
    status,
    decision: "rejected",
    as_of: asOf,
    items: [],
    category_summaries: [],
    missing_category_refs: [],
    blocking_item_refs: [],
    warnings: ["Release readiness input was blocked before matrix build."],
    release_executed: false,
    release_artifact_created: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createReleaseReadinessAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  ReleaseReadinessStatus,
  "blocked_private_or_raw_payload" | "blocked_invalid_input"
> {
  if (
    failures.some(
      (failure) =>
        failure.includes("private_or_raw") ||
        failure.includes("raw_conversation") ||
        failure.includes("hidden_reasoning") ||
        failure.includes("telemetry_dump") ||
        failure.includes("secret_like_pattern") ||
        failure.includes("local_path") ||
        failure.includes("private_url"),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function reasonCodesForFailures(
  failures: string[],
): ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [];
  for (const failure of failures) {
    if (failure.includes("raw_conversation")) reasonCodes.push("raw_conversation_blocked");
    if (failure.includes("hidden_reasoning")) reasonCodes.push("hidden_reasoning_blocked");
    if (failure.includes("telemetry_dump")) reasonCodes.push("telemetry_dump_blocked");
    if (failure.includes("secret_like_pattern")) reasonCodes.push("secret_like_pattern_blocked");
    if (failure.includes("local_path")) reasonCodes.push("local_path_blocked");
    if (failure.includes("private_url")) reasonCodes.push("private_url_blocked");
    if (
      failure.includes("private_or_raw") ||
      failure.includes("raw_payload") ||
      failure.includes("secret_like_pattern")
    ) {
      reasonCodes.push("private_or_raw_payload_blocked");
    }
  }
  return uniqueSorted(reasonCodes);
}

function inputReasonCodes(input: ReleaseReadinessInput):
  ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [];
  if (input.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  } else {
    reasonCodes.push("runtime_audit_ref_missing");
  }
  if (input.product_write_reentry_refs.length > 0) {
    reasonCodes.push(
      "product_write_reentry_ref_present",
      "product_write_remains_parked",
      "product_write_authority_not_granted",
    );
  } else {
    reasonCodes.push("product_write_reentry_ref_missing");
  }
  if (input.git_ledger_contract_refs.length > 0) {
    reasonCodes.push(
      "git_ledger_contract_ref_present",
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  } else {
    reasonCodes.push("git_ledger_contract_ref_missing");
  }
  if (input.release_scope_refs.length > 0) {
    reasonCodes.push("release_scope_present");
  } else {
    reasonCodes.push("release_scope_missing");
  }
  return uniqueSorted(reasonCodes);
}

function reasonCodesForItem(
  item: ReleaseReadinessInputItem,
): ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [
    "release_readiness_is_review_only",
    "release_readiness_does_not_grant_authority",
    "source_refs_are_lineage_not_proof",
  ];
  if (!item.satisfied) reasonCodes.push(...missingReasonCodesForCategory(item.category));
  reasonCodes.push(
    ...presentRefReasonCodesForItemRefs(item),
    ...categoryContextReasonCodes(item),
  );
  if (item.severity === "blocking" || item.severity === "critical") {
    reasonCodes.push("blocking_item_present");
  }
  if (item.category === "verification") {
    reasonCodes.push("smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  if (item.category === "product_write_reentry") {
    reasonCodes.push(
      "product_write_remains_parked",
      "product_write_denied",
      "product_write_not_executed",
      "product_write_authority_not_granted",
    );
  }
  return uniqueSorted(reasonCodes);
}

function presentRefReasonCodesForItemRefs(
  item: ReleaseReadinessInputItem,
): ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [];
  if (item.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present");
  }
  if (item.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  }
  if (item.git_ledger_refs.length > 0) {
    reasonCodes.push("git_ledger_contract_ref_present");
  }
  if (item.dogfooding_refs.length > 0) {
    reasonCodes.push("dogfooding_ref_present");
  }
  if (item.feedback_refs.length > 0) {
    reasonCodes.push("feedback_ref_present");
  }
  if (item.verification_refs.length > 0) {
    reasonCodes.push("verification_ref_present");
  }
  return reasonCodes;
}

function categoryContextReasonCodes(
  item: ReleaseReadinessInputItem,
): ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [];
  if (item.runtime_audit_refs.length > 0 || item.category === "runtime_audit") {
    reasonCodes.push("runtime_audit_is_review_cue_only");
  }
  if (item.git_ledger_refs.length > 0 || item.category === "git_ledger") {
    reasonCodes.push(
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  }
  if (item.dogfooding_refs.length > 0 || item.category === "dogfooding") {
    reasonCodes.push("dogfooding_record_is_review_signal");
  }
  if (item.feedback_refs.length > 0 || item.category === "feedback") {
    reasonCodes.push("feedback_is_advisory");
  }
  if (item.category === "privacy") reasonCodes.push("privacy_boundary_review_present");
  if (item.category === "rollback") reasonCodes.push("rollback_plan_present");
  if (item.category === "idempotency") reasonCodes.push("idempotency_plan_present");
  if (item.category === "failure_modes") reasonCodes.push("failure_mode_review_present");
  if (item.category === "state_boundaries") {
    reasonCodes.push("state_mutation_boundary_review_present");
  }
  if (item.category === "external_side_effects") {
    reasonCodes.push("external_side_effect_boundary_review_present");
  }
  if (item.category === "operator_approval") reasonCodes.push("operator_approval_present");
  if (item.category === "release_scope") reasonCodes.push("release_scope_present");
  return reasonCodes;
}

function missingReasonCodesForCategory(
  category: ReleaseReadinessCategory,
): ReleaseReadinessReasonCode[] {
  const map: Partial<Record<ReleaseReadinessCategory, ReleaseReadinessReasonCode[]>> = {
    runtime_audit: ["runtime_audit_ref_missing"],
    product_write_reentry: ["product_write_reentry_ref_missing"],
    git_ledger: ["git_ledger_contract_ref_missing"],
    verification: ["verification_ref_missing"],
    rollback: ["rollback_plan_missing"],
    idempotency: ["idempotency_plan_missing"],
    failure_modes: ["failure_mode_review_missing"],
    privacy: ["privacy_boundary_review_required"],
    state_boundaries: ["state_mutation_boundary_review_required"],
    external_side_effects: ["external_side_effect_boundary_review_required"],
    operator_approval: ["operator_approval_missing"],
    release_scope: ["release_scope_missing"],
  };
  return map[category] ?? [];
}

function getMissingMandatoryCategoriesV01(
  items: ReleaseReadinessMatrixItem[],
): ReleaseReadinessCategory[] {
  const presentCategories = new Set(items.map((item) => item.category));
  return mandatoryReleaseReadinessCategoriesV01
    .filter((category) => !presentCategories.has(category))
    .slice()
    .sort();
}

function missingCategoryRefForCategoryV01(category: ReleaseReadinessCategory): string {
  return `release-readiness-category:missing:${category}`;
}

function missingReasonCodesForCategoriesV01(
  categories: ReleaseReadinessCategory[],
): ReleaseReadinessReasonCode[] {
  return uniqueSorted(
    categories.flatMap((category) => [
      "mandatory_category_missing",
      ...missingReasonCodesForCategory(category),
    ]),
  );
}

function buildCategorySummaries(
  items: ReleaseReadinessMatrixItem[],
  authorityBoundary: ReleaseReadinessAuthorityBoundary,
): ReleaseReadinessCategorySummary[] {
  const categories = uniqueSorted(items.map((item) => item.category));
  return categories.map((category): ReleaseReadinessCategorySummary => {
    const categoryItems = items.filter((item) => item.category === category);
    const satisfiedCount = categoryItems.filter((item) => item.satisfied).length;
    const unsatisfiedCount = categoryItems.length - satisfiedCount;
    const blockingCount = categoryItems.filter(
      (item) => !item.satisfied && item.severity === "blocking",
    ).length;
    const criticalCount = categoryItems.filter(
      (item) => !item.satisfied && item.severity === "critical",
    ).length;
    return {
      category_version: RELEASE_READINESS_CATEGORY_VERSION,
      scope,
      category,
      satisfied_count: satisfiedCount,
      unsatisfied_count: unsatisfiedCount,
      blocking_count: blockingCount,
      critical_count: criticalCount,
      bounded_summary: categorySummary(category, categoryItems),
      item_refs: uniqueSorted(categoryItems.map((item) => item.item_id)),
      reason_codes: uniqueSorted([
        ...categoryItems.flatMap((item) => item.reason_codes),
        ...(unsatisfiedCount > 0 ? missingReasonCodesForCategory(category) : []),
      ]),
      authority_boundary: authorityBoundary,
    };
  });
}

function categorySummary(
  category: ReleaseReadinessCategory,
  items: ReleaseReadinessMatrixItem[],
): string {
  const unsatisfiedCount = items.filter((item) => !item.satisfied).length;
  if (unsatisfiedCount > 0) {
    return `${category} has ${unsatisfiedCount} review item(s) requiring attention.`;
  }
  return `${category} has public-safe review items marked satisfied.`;
}

function decideReadiness(
  items: ReleaseReadinessMatrixItem[],
  input: ReleaseReadinessInput,
  missingCategories: ReleaseReadinessCategory[],
): ReleaseReadinessDecision {
  if (items.some((item) => item.category === "unknown")) return "rejected";
  if (
    missingCategories.length > 0 ||
    items.some((item) => !item.satisfied && isBlockingSeverity(item.severity))
  ) {
    return "blocked";
  }
  if (
    input.runtime_audit_refs.length === 0 ||
    input.product_write_reentry_refs.length === 0 ||
    input.git_ledger_contract_refs.length === 0 ||
    input.release_scope_refs.length === 0
  ) {
    return "not_ready";
  }
  if (!allMandatoryCategoriesSatisfiedV01(items)) return "needs_operator_review";
  return "ready_for_release_candidate_review";
}

function allMandatoryCategoriesSatisfiedV01(
  items: ReleaseReadinessMatrixItem[],
): boolean {
  return mandatoryReleaseReadinessCategoriesV01.every((category) =>
    items.some((item) => item.category === category && item.satisfied === true),
  ) && items.every((item) => item.satisfied === true || item.category === "unknown");
}

function isBlockingSeverity(severity: ReleaseReadinessSeverity): boolean {
  return severity === "blocking" || severity === "critical";
}

function reasonCodesForDecision(
  decision: ReleaseReadinessDecision,
  input: ReleaseReadinessInput,
): ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [
    "release_readiness_is_review_only",
    "release_readiness_does_not_grant_authority",
    "release_candidate_review_not_release",
    "release_not_executed",
    "release_artifact_not_created",
    "product_write_remains_parked",
    "product_write_not_executed",
    "product_write_authority_not_granted",
  ];
  if (decision === "blocked") {
    reasonCodes.push("blocking_item_present", "operator_review_required");
  }
  if (decision === "not_ready") {
    reasonCodes.push(...missingRequiredRefReasonCodesForInputV01(input));
  }
  if (decision === "needs_operator_review") {
    reasonCodes.push("operator_review_required");
  }
  if (decision === "ready_for_release_candidate_review") {
    reasonCodes.push("release_candidate_review_not_release");
  }
  return uniqueSorted(reasonCodes);
}

function missingRequiredRefReasonCodesForInputV01(
  input: ReleaseReadinessInput,
): ReleaseReadinessReasonCode[] {
  const reasonCodes: ReleaseReadinessReasonCode[] = [];
  if (input.runtime_audit_refs.length === 0) {
    reasonCodes.push("runtime_audit_ref_missing");
  }
  if (input.product_write_reentry_refs.length === 0) {
    reasonCodes.push("product_write_reentry_ref_missing");
  }
  if (input.git_ledger_contract_refs.length === 0) {
    reasonCodes.push("git_ledger_contract_ref_missing");
  }
  if (input.release_scope_refs.length === 0) {
    reasonCodes.push("release_scope_missing");
  }
  return reasonCodes;
}

function normalizeNotReadyRequiredRefReasonCodesV01(
  decision: ReleaseReadinessDecision,
  reasonCodes: ReleaseReadinessReasonCode[],
  input: ReleaseReadinessInput,
): ReleaseReadinessReasonCode[] {
  if (decision !== "not_ready") return uniqueSorted(reasonCodes);
  const normalized = new Set(reasonCodes);
  const refPairs: Array<{
    hasRef: boolean;
    present: ReleaseReadinessReasonCode;
    missing: ReleaseReadinessReasonCode;
  }> = [
    {
      hasRef: input.runtime_audit_refs.length > 0,
      present: "runtime_audit_ref_present",
      missing: "runtime_audit_ref_missing",
    },
    {
      hasRef: input.product_write_reentry_refs.length > 0,
      present: "product_write_reentry_ref_present",
      missing: "product_write_reentry_ref_missing",
    },
    {
      hasRef: input.git_ledger_contract_refs.length > 0,
      present: "git_ledger_contract_ref_present",
      missing: "git_ledger_contract_ref_missing",
    },
    {
      hasRef: input.release_scope_refs.length > 0,
      present: "release_scope_present",
      missing: "release_scope_missing",
    },
  ];
  for (const { hasRef, present, missing } of refPairs) {
    if (hasRef) {
      normalized.delete(missing);
      normalized.add(present);
    } else {
      normalized.delete(present);
      normalized.add(missing);
    }
  }
  return uniqueSorted([...normalized]);
}

function warningsForDecision(decision: ReleaseReadinessDecision): string[] {
  const warnings: Record<ReleaseReadinessDecision, string[]> = {
    blocked: ["Release readiness remains blocked by mandatory review gaps."],
    not_ready: ["Release readiness is not ready because required refs are missing."],
    needs_operator_review: ["Release readiness requires operator review."],
    ready_for_release_candidate_review: [
      "Ready for release-candidate review remains non-authoritative in this slice.",
    ],
    rejected: ["Release readiness rejects the supplied review items."],
  };
  return warnings[decision];
}

function defaultBoundaryReasonCodes(): ReleaseReadinessReasonCode[] {
  return [
    "release_readiness_is_review_only",
    "release_readiness_is_not_truth",
    "release_readiness_is_not_proof",
    "release_readiness_does_not_grant_authority",
    "release_candidate_review_not_release",
    "release_not_executed",
    "release_artifact_not_created",
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "product_write_runtime_not_implemented",
    "product_write_adapter_not_enabled",
    "product_id_allocation_not_executed",
    "smoke_pass_is_not_truth",
    "ci_pass_is_not_truth",
    "provider_call_not_executed",
    "prompt_not_sent",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "source_fetch_not_executed",
    "file_read_not_executed",
    "db_write_not_executed",
    "durable_state_not_mutated",
    "formation_receipt_not_written",
    "promotion_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "git_ledger_export_not_executed",
    "git_write_not_executed",
    "github_api_not_called",
    "repository_file_not_written",
  ];
}

function dedupeItems(items: ReleaseReadinessInputItem[]): ReleaseReadinessInputItem[] {
  const sorted = items
    .slice()
    .sort((left, right) =>
      compareTuple(
        [left.category, left.severity, left.input_item_id],
        [right.category, right.severity, right.input_item_id],
      ),
    );
  const seen = new Set<string>();
  const unique: ReleaseReadinessInputItem[] = [];
  for (const item of sorted) {
    if (seen.has(item.input_item_id)) continue;
    seen.add(item.input_item_id);
    unique.push(item);
  }
  return unique;
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (!ReleaseReadinessReasonCodes.includes(code as ReleaseReadinessReasonCode)) {
      failures.push(`${field}_unknown_reason_code`);
    }
  }
  return failures;
}

function validateStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field}_invalid_array`];
  return value.flatMap((item, index) => validateSafeString(item, `${field}_${index}`));
}

function validateSafeString(value: unknown, field: string): string[] {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [`${field}_invalid_string`];
  }
  return unsafeStringFailureCodes(value, field);
}

function collectUnsafeObjectFailures(value: unknown, label: string): string[] {
  if (typeof value === "string") {
    return unsafeStringFailureCodes(value, label);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectUnsafeObjectFailures(item, `${label}_${index}`),
    );
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nestedValue]) => [
      ...unsafeStringFailureCodes(key, `${label}_${key}_key`),
      ...collectUnsafeObjectFailures(nestedValue, `${label}_${key}`),
    ]);
  }
  return [];
}

function collectPublicUnsafeFailures(value: unknown, label: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectPublicUnsafeFailures(item, `${label}_${index}`),
    );
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const failures: string[] = [];
    if (key === "public_safe" && nestedValue !== true) {
      failures.push(`${label}_${key}_not_true`);
    }
    failures.push(...collectPublicUnsafeFailures(nestedValue, `${label}_${key}`));
    return failures;
  });
}

function unsafeStringFailureCodes(value: string, field: string): string[] {
  const normalizedValue = value.toLowerCase();
  const failures: string[] = [];
  if (
    includesPlainMarker(normalizedValue, privateOrRawMarkers) ||
    includesTokenLikeMarker(value)
  ) {
    failures.push(`${field}_private_or_raw_payload`);
  }
  if (includesPlainMarker(normalizedValue, rawConversationMarkers)) {
    failures.push(`${field}_raw_conversation`);
  }
  if (includesPlainMarker(normalizedValue, hiddenReasoningMarkers)) {
    failures.push(`${field}_hidden_reasoning`);
  }
  if (includesPlainMarker(normalizedValue, telemetryMarkers)) {
    failures.push(`${field}_telemetry_dump`);
  }
  if (includesPlainMarker(normalizedValue, privateUrlMarkers)) {
    failures.push(`${field}_private_url`);
  }
  if (includesPlainMarker(normalizedValue, symbolicLocalPathMarkers)) {
    failures.push(`${field}_local_path`);
  }
  if (includesPlainMarker(normalizedValue, secretLikeMarkers)) {
    failures.push(`${field}_secret_like_pattern`);
  }
  return failures;
}

function includesPlainMarker(normalizedValue: string, markers: readonly string[]): boolean {
  return markers.some((marker) => normalizedValue.includes(marker.toLowerCase()));
}

function includesTokenLikeMarker(value: string): boolean {
  return tokenLikePatterns.some((pattern) => pattern.test(value));
}

function validateAuthorityBoundary(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return [`${field}_invalid_object`];
  const failures: string[] = [];
  failures.push(...unsafeStringFailureCodes(canonicalJson(value), field));
  for (const key of forbiddenFalseAuthorityFields) {
    if (value[key] !== undefined && value[key] !== false) {
      failures.push(`${field}_${key}_forbidden_authority`);
    }
  }
  for (const key of requiredTrueAuthorityFields) {
    if (value[key] !== undefined && value[key] !== true) {
      failures.push(`${field}_${key}_invalid_authority`);
    }
  }
  return failures;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function compareTuple(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const result = left[index].localeCompare(right[index]);
    if (result !== 0) return result;
  }
  return left.length - right.length;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
