import { createHash } from "node:crypto";

export const RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION =
  "release_candidate_operator_review.v0.1" as const;
export const RELEASE_CANDIDATE_OPERATOR_INPUT_VERSION =
  "release_candidate_operator_input.v0.1" as const;
export const RELEASE_CANDIDATE_OPERATOR_RESULT_VERSION =
  "release_candidate_operator_result.v0.1" as const;
export const RELEASE_CANDIDATE_OPERATOR_ITEM_VERSION =
  "release_candidate_operator_item.v0.1" as const;

const scope = "project:augnes" as const;
const blockedReviewId = "release-candidate-operator-review:blocked" as const;

export const ReleaseCandidateOperatorReviewStatuses = [
  "reviewed",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
] as const;
export type ReleaseCandidateOperatorReviewStatus =
  (typeof ReleaseCandidateOperatorReviewStatuses)[number];

export const ReleaseCandidateOperatorDecisions = [
  "blocked",
  "needs_operator_review",
  "ready_for_future_operator_review",
  "rejected",
] as const;
export type ReleaseCandidateOperatorDecision =
  (typeof ReleaseCandidateOperatorDecisions)[number];

export const ReleaseCandidateOperatorReviewItemKinds = [
  "release_readiness",
  "disabled_product_write_harness",
  "product_write_reentry",
  "git_ledger_contract",
  "runtime_audit",
  "dogfooding",
  "feedback",
  "verification",
  "privacy",
  "rollback",
  "idempotency",
  "failure_modes",
  "operator_notes",
  "unknown",
] as const;
export type ReleaseCandidateOperatorReviewItemKind =
  (typeof ReleaseCandidateOperatorReviewItemKinds)[number];

export const mandatoryReleaseCandidateOperatorItemKindsV01 = [
  "release_readiness",
  "disabled_product_write_harness",
  "product_write_reentry",
  "git_ledger_contract",
  "runtime_audit",
  "dogfooding",
  "feedback",
  "verification",
  "privacy",
  "rollback",
  "idempotency",
  "failure_modes",
] as const satisfies readonly ReleaseCandidateOperatorReviewItemKind[];

export const ReleaseCandidateOperatorSeverities = [
  "info",
  "warning",
  "blocking",
  "critical",
  "unknown",
] as const;
export type ReleaseCandidateOperatorSeverity =
  (typeof ReleaseCandidateOperatorSeverities)[number];

export const ReleaseCandidateOperatorReasonCodes = [
  "release_candidate_operator_review_present",
  "release_candidate_review_is_review_only",
  "release_candidate_review_is_not_truth",
  "release_candidate_review_is_not_proof",
  "release_candidate_review_does_not_grant_authority",
  "release_candidate_review_not_release",
  "release_not_executed",
  "release_artifact_not_created",
  "release_authority_not_granted",
  "release_candidate_not_approved",
  "product_write_remains_parked",
  "product_write_denied",
  "product_write_not_executed",
  "product_write_authority_not_granted",
  "product_write_runtime_not_implemented",
  "product_write_adapter_not_enabled",
  "product_write_target_contract_not_created",
  "product_id_allocation_not_executed",
  "release_readiness_ref_present",
  "release_readiness_ref_missing",
  "disabled_harness_ref_present",
  "disabled_harness_ref_missing",
  "product_write_reentry_ref_present",
  "product_write_reentry_ref_missing",
  "git_ledger_contract_ref_present",
  "git_ledger_contract_ref_missing",
  "runtime_audit_ref_present",
  "runtime_audit_ref_missing",
  "dogfooding_ref_present",
  "feedback_ref_present",
  "verification_ref_present",
  "operator_review_required",
  "blocking_item_present",
  "mandatory_review_context_missing",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "runtime_audit_is_review_cue_only",
  "git_ledger_packet_is_not_commit",
  "git_ledger_packet_is_not_product_write",
  "disabled_harness_is_not_reentry_approval",
  "disabled_harness_is_not_adapter_runtime",
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
export type ReleaseCandidateOperatorReasonCode =
  (typeof ReleaseCandidateOperatorReasonCodes)[number];

export interface ReleaseCandidateOperatorAuthorityBoundary {
  release_candidate_operator_review_now: true;
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
  release_candidate_review_is_truth: false;
  release_candidate_review_is_proof: false;
  release_candidate_review_is_authority: false;
  verification_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
  product_write_authority: false;
}

export interface ReleaseCandidateOperatorReviewItem {
  item_version: typeof RELEASE_CANDIDATE_OPERATOR_ITEM_VERSION;
  scope: typeof scope;
  item_id: string;
  item_kind: ReleaseCandidateOperatorReviewItemKind;
  severity: ReleaseCandidateOperatorSeverity;
  satisfied: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  release_readiness_refs: string[];
  disabled_harness_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_refs: string[];
  runtime_audit_refs: string[];
  dogfooding_refs: string[];
  feedback_refs: string[];
  verification_refs: string[];
  public_safe: boolean;
  reason_codes: ReleaseCandidateOperatorReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseCandidateOperatorReviewInput {
  input_version: typeof RELEASE_CANDIDATE_OPERATOR_INPUT_VERSION;
  review_version: typeof RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION;
  scope: typeof scope;
  review_id: string;
  as_of: string;
  release_readiness_refs: string[];
  disabled_harness_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_contract_refs: string[];
  runtime_audit_refs: string[];
  operator_review_refs: string[];
  review_items: ReleaseCandidateOperatorReviewItem[];
  boundary_notes: string[];
  reason_codes: ReleaseCandidateOperatorReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseCandidateOperatorReviewResult {
  result_version: typeof RELEASE_CANDIDATE_OPERATOR_RESULT_VERSION;
  review_version: typeof RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION;
  scope: typeof scope;
  review_id: string;
  status: ReleaseCandidateOperatorReviewStatus;
  decision: ReleaseCandidateOperatorDecision;
  as_of: string;
  review_items: ReleaseCandidateOperatorReviewItem[];
  missing_context_refs: string[];
  blocking_item_refs: string[];
  warnings: string[];
  release_executed: false;
  release_artifact_created: false;
  release_authority_granted: false;
  release_candidate_approved: false;
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ReleaseCandidateOperatorReasonCode[];
  authority_boundary: ReleaseCandidateOperatorAuthorityBoundary;
  review_fingerprint: string;
}

export interface ReleaseCandidateOperatorValidationResult {
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
  "release_candidate_review_is_truth",
  "release_candidate_review_is_proof",
  "release_candidate_review_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
] as const;

const requiredTrueAuthorityFields = [
  "release_candidate_operator_review_now",
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
  "raw release candidate payload",
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
  "secret-like release candidate review input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createReleaseCandidateOperatorAuthorityBoundaryV01():
  ReleaseCandidateOperatorAuthorityBoundary {
  return {
    release_candidate_operator_review_now: true,
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
    release_candidate_review_is_truth: false,
    release_candidate_review_is_proof: false,
    release_candidate_review_is_authority: false,
    verification_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
    product_write_authority: false,
  };
}

export function validateReleaseCandidateOperatorReviewInputV01(
  input: unknown,
): ReleaseCandidateOperatorValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ReleaseCandidateOperatorReviewInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));

  if (value.input_version !== RELEASE_CANDIDATE_OPERATOR_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.review_version !== RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION) {
    failures.push("review_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.review_id, "review_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "release_readiness_refs",
    "disabled_harness_refs",
    "product_write_reentry_refs",
    "git_ledger_contract_refs",
    "runtime_audit_refs",
    "operator_review_refs",
    "boundary_notes",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.review_items)) {
    failures.push("review_items_invalid_array");
  } else {
    for (const item of value.review_items) {
      failures.push(...validateReleaseCandidateOperatorReviewItemV01(item).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateReleaseCandidateOperatorReviewItemV01(
  input: unknown,
): ReleaseCandidateOperatorValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["item_invalid_object"] };
  }
  const value = input as Partial<ReleaseCandidateOperatorReviewItem>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "item"));
  failures.push(...collectPublicUnsafeFailures(input, "item"));

  if (value.item_version !== RELEASE_CANDIDATE_OPERATOR_ITEM_VERSION) {
    failures.push("item_version_invalid");
  }
  if (value.scope !== scope) failures.push("item_scope_invalid");
  failures.push(...validateSafeString(value.item_id, "item_id"));
  if (
    !ReleaseCandidateOperatorReviewItemKinds.includes(
      value.item_kind as ReleaseCandidateOperatorReviewItemKind,
    )
  ) {
    failures.push("item_kind_invalid");
  }
  if (
    !ReleaseCandidateOperatorSeverities.includes(
      value.severity as ReleaseCandidateOperatorSeverity,
    )
  ) {
    failures.push("severity_invalid");
  }
  if (typeof value.satisfied !== "boolean") {
    failures.push("satisfied_invalid_boolean");
  }
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "source_refs",
    "release_readiness_refs",
    "disabled_harness_refs",
    "product_write_reentry_refs",
    "git_ledger_refs",
    "runtime_audit_refs",
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

export function buildReleaseCandidateOperatorReviewV01(
  input: ReleaseCandidateOperatorReviewInput,
): ReleaseCandidateOperatorReviewResult {
  const validation = validateReleaseCandidateOperatorReviewInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultBoundaryReasonCodes(),
      "release_candidate_operator_review_present",
    ]);
  }

  if (input.review_items.length === 0) {
    return finalizeResult({
      result_version: RELEASE_CANDIDATE_OPERATOR_RESULT_VERSION,
      review_version: RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION,
      scope,
      review_id: input.review_id,
      status: "empty",
      decision: "blocked",
      as_of: input.as_of,
      review_items: [],
      missing_context_refs: missingContextRefsForInput(input),
      blocking_item_refs: [],
      warnings: ["No release candidate operator review items were supplied."],
      release_executed: false,
      release_artifact_created: false,
      release_authority_granted: false,
      release_candidate_approved: false,
      product_write_executed: false,
      product_id_allocated: false,
      product_write_authority_granted: false,
      reason_codes: uniqueSorted([
        ...input.reason_codes,
        ...inputReasonCodes(input),
        ...missingContextReasonCodesForInput(input),
        ...defaultBoundaryReasonCodes(),
        "release_candidate_operator_review_present",
        "operator_review_required",
        "mandatory_review_context_missing",
      ]),
      authority_boundary: createReleaseCandidateOperatorAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createReleaseCandidateOperatorAuthorityBoundaryV01();
  const reviewItems = dedupeReviewItems(input.review_items).map(
    (item): ReleaseCandidateOperatorReviewItem => ({
      item_version: RELEASE_CANDIDATE_OPERATOR_ITEM_VERSION,
      scope,
      item_id: item.item_id,
      item_kind: item.item_kind,
      severity: item.severity,
      satisfied: item.satisfied,
      bounded_title: item.bounded_title,
      bounded_summary: item.bounded_summary,
      source_refs: uniqueSorted(item.source_refs),
      release_readiness_refs: uniqueSorted(item.release_readiness_refs),
      disabled_harness_refs: uniqueSorted(item.disabled_harness_refs),
      product_write_reentry_refs: uniqueSorted(item.product_write_reentry_refs),
      git_ledger_refs: uniqueSorted(item.git_ledger_refs),
      runtime_audit_refs: uniqueSorted(item.runtime_audit_refs),
      dogfooding_refs: uniqueSorted(item.dogfooding_refs),
      feedback_refs: uniqueSorted(item.feedback_refs),
      verification_refs: uniqueSorted(item.verification_refs),
      public_safe: true,
      reason_codes: uniqueSorted([
        ...item.reason_codes,
        ...reasonCodesForItem(item),
      ]),
      authority_boundary: { ...authorityBoundary },
    }),
  );
  const missingContextRefs = uniqueSorted([
    ...missingContextRefsForInput(input),
    ...missingMandatoryItemKindRefs(reviewItems),
  ]);
  const blockingItemRefs = uniqueSorted([
    ...reviewItems
      .filter((item) => !item.satisfied && isBlockingSeverity(item.severity))
      .map((item) => item.item_id),
    ...missingContextRefs,
  ]);
  const decision = decideReview(input, reviewItems, missingContextRefs);

  return finalizeResult({
    result_version: RELEASE_CANDIDATE_OPERATOR_RESULT_VERSION,
    review_version: RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION,
    scope,
    review_id: input.review_id,
    status: "reviewed",
    decision,
    as_of: input.as_of,
    review_items: reviewItems,
    missing_context_refs: missingContextRefs,
    blocking_item_refs: blockingItemRefs,
    warnings: warningsForDecision(decision),
    release_executed: false,
    release_artifact_created: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...inputReasonCodes(input),
      ...missingContextReasonCodesForInput(input),
      ...missingMandatoryItemKindReasonCodes(reviewItems),
      ...reviewItems.flatMap((item) => item.reason_codes),
      ...reasonCodesForDecision(decision),
      ...defaultBoundaryReasonCodes(),
      "release_candidate_operator_review_present",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createReleaseCandidateOperatorFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<
    ReleaseCandidateOperatorReviewResult,
    "review_fingerprint"
  >,
): ReleaseCandidateOperatorReviewResult {
  return {
    ...resultWithoutFingerprint,
    review_fingerprint:
      createReleaseCandidateOperatorFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    ReleaseCandidateOperatorReviewStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: ReleaseCandidateOperatorReasonCode[],
): ReleaseCandidateOperatorReviewResult {
  const reviewId =
    isRecord(input) &&
    typeof input.review_id === "string" &&
    unsafeStringFailureCodes(input.review_id, "review_id").length === 0
      ? input.review_id
      : blockedReviewId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "1970-01-01T00:00:00.000Z";
  return finalizeResult({
    result_version: RELEASE_CANDIDATE_OPERATOR_RESULT_VERSION,
    review_version: RELEASE_CANDIDATE_OPERATOR_REVIEW_VERSION,
    scope,
    review_id: reviewId,
    status,
    decision: status === "blocked_private_or_raw_payload" ? "blocked" : "rejected",
    as_of: asOf,
    review_items: [],
    missing_context_refs: [],
    blocking_item_refs: [],
    warnings: ["Release candidate operator review input was blocked."],
    release_executed: false,
    release_artifact_created: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createReleaseCandidateOperatorAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  ReleaseCandidateOperatorReviewStatus,
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
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [];
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

function inputReasonCodes(
  input: ReleaseCandidateOperatorReviewInput,
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [];
  if (input.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  } else {
    reasonCodes.push("release_readiness_ref_missing", "mandatory_review_context_missing");
  }
  if (input.disabled_harness_refs.length > 0) {
    reasonCodes.push(
      "disabled_harness_ref_present",
      "disabled_harness_is_not_reentry_approval",
      "disabled_harness_is_not_adapter_runtime",
    );
  } else {
    reasonCodes.push("disabled_harness_ref_missing", "mandatory_review_context_missing");
  }
  if (input.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  } else {
    reasonCodes.push("product_write_reentry_ref_missing", "mandatory_review_context_missing");
  }
  if (input.git_ledger_contract_refs.length > 0) {
    reasonCodes.push(
      "git_ledger_contract_ref_present",
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  } else {
    reasonCodes.push("git_ledger_contract_ref_missing", "mandatory_review_context_missing");
  }
  if (input.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  } else {
    reasonCodes.push("runtime_audit_ref_missing", "mandatory_review_context_missing");
  }
  return uniqueSorted(reasonCodes);
}

function missingContextReasonCodesForInput(
  input: ReleaseCandidateOperatorReviewInput,
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [];
  if (input.release_readiness_refs.length === 0) {
    reasonCodes.push("release_readiness_ref_missing");
  }
  if (input.disabled_harness_refs.length === 0) {
    reasonCodes.push("disabled_harness_ref_missing");
  }
  if (input.product_write_reentry_refs.length === 0) {
    reasonCodes.push("product_write_reentry_ref_missing");
  }
  if (input.git_ledger_contract_refs.length === 0) {
    reasonCodes.push("git_ledger_contract_ref_missing");
  }
  if (input.runtime_audit_refs.length === 0) {
    reasonCodes.push("runtime_audit_ref_missing");
  }
  if (reasonCodes.length > 0) reasonCodes.push("mandatory_review_context_missing");
  return uniqueSorted(reasonCodes);
}

function reasonCodesForItem(
  item: ReleaseCandidateOperatorReviewItem,
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [
    "release_candidate_review_is_review_only",
    "release_candidate_review_does_not_grant_authority",
    "release_candidate_review_not_release",
    "source_refs_are_lineage_not_proof",
  ];
  reasonCodes.push(
    ...presentRefReasonCodesForItemRefs(item),
    ...categoryContextReasonCodes(item),
  );
  if (item.severity === "blocking" || item.severity === "critical") {
    reasonCodes.push("blocking_item_present");
  }
  if (!item.satisfied) reasonCodes.push("operator_review_required");
  if (item.item_kind === "verification") {
    reasonCodes.push("smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  if (item.item_kind === "product_write_reentry") {
    reasonCodes.push(
      "product_write_remains_parked",
      "product_write_denied",
      "product_write_not_executed",
      "product_write_authority_not_granted",
    );
  }
  if (item.item_kind === "disabled_product_write_harness") {
    reasonCodes.push(
      "disabled_harness_is_not_reentry_approval",
      "disabled_harness_is_not_adapter_runtime",
    );
  }
  return uniqueSorted(reasonCodes);
}

function presentRefReasonCodesForItemRefs(
  item: ReleaseCandidateOperatorReviewItem,
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [];
  if (item.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  }
  if (item.disabled_harness_refs.length > 0) {
    reasonCodes.push("disabled_harness_ref_present");
  }
  if (item.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  }
  if (item.git_ledger_refs.length > 0) {
    reasonCodes.push("git_ledger_contract_ref_present");
  }
  if (item.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present");
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
  item: ReleaseCandidateOperatorReviewItem,
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [];
  if (item.item_kind === "runtime_audit") {
    reasonCodes.push("runtime_audit_is_review_cue_only");
  }
  if (item.item_kind === "git_ledger_contract") {
    reasonCodes.push(
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  }
  if (item.item_kind === "verification") {
    reasonCodes.push("smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  return reasonCodes;
}

function missingContextRefsForInput(
  input: ReleaseCandidateOperatorReviewInput,
): string[] {
  const refs: string[] = [];
  if (input.release_readiness_refs.length === 0) {
    refs.push("release-candidate-context:missing:release_readiness_refs");
  }
  if (input.disabled_harness_refs.length === 0) {
    refs.push("release-candidate-context:missing:disabled_harness_refs");
  }
  if (input.product_write_reentry_refs.length === 0) {
    refs.push("release-candidate-context:missing:product_write_reentry_refs");
  }
  if (input.git_ledger_contract_refs.length === 0) {
    refs.push("release-candidate-context:missing:git_ledger_contract_refs");
  }
  if (input.runtime_audit_refs.length === 0) {
    refs.push("release-candidate-context:missing:runtime_audit_refs");
  }
  return uniqueSorted(refs);
}

function missingMandatoryItemKindRefs(
  items: ReleaseCandidateOperatorReviewItem[],
): string[] {
  const presentKinds = new Set(items.map((item) => item.item_kind));
  return mandatoryReleaseCandidateOperatorItemKindsV01
    .filter((kind) => !presentKinds.has(kind))
    .map((kind) => `release-candidate-item-kind:missing:${kind}`)
    .sort();
}

function missingMandatoryItemKindReasonCodes(
  items: ReleaseCandidateOperatorReviewItem[],
): ReleaseCandidateOperatorReasonCode[] {
  return missingMandatoryItemKindRefs(items).length > 0
    ? ["mandatory_review_context_missing"]
    : [];
}

function decideReview(
  input: ReleaseCandidateOperatorReviewInput,
  items: ReleaseCandidateOperatorReviewItem[],
  missingContextRefs: string[],
): ReleaseCandidateOperatorDecision {
  if (items.some((item) => item.item_kind === "unknown")) return "rejected";
  if (
    missingContextRefs.length > 0 ||
    items.some((item) => !item.satisfied && isBlockingSeverity(item.severity))
  ) {
    return "blocked";
  }
  if (items.some((item) => !item.satisfied)) return "needs_operator_review";
  if (!allMandatoryItemKindsSatisfiedV01(items)) return "blocked";
  if (
    input.release_readiness_refs.length === 0 ||
    input.disabled_harness_refs.length === 0 ||
    input.product_write_reentry_refs.length === 0 ||
    input.git_ledger_contract_refs.length === 0 ||
    input.runtime_audit_refs.length === 0
  ) {
    return "blocked";
  }
  return "ready_for_future_operator_review";
}

function allMandatoryItemKindsSatisfiedV01(
  items: ReleaseCandidateOperatorReviewItem[],
): boolean {
  return mandatoryReleaseCandidateOperatorItemKindsV01.every((kind) =>
    items.some((item) => item.item_kind === kind && item.satisfied),
  );
}

function reasonCodesForDecision(
  decision: ReleaseCandidateOperatorDecision,
): ReleaseCandidateOperatorReasonCode[] {
  const reasonCodes: ReleaseCandidateOperatorReasonCode[] = [
    "release_candidate_review_is_review_only",
    "release_candidate_review_does_not_grant_authority",
    "release_candidate_review_not_release",
    "release_not_executed",
    "release_artifact_not_created",
    "release_authority_not_granted",
    "release_candidate_not_approved",
    "product_write_remains_parked",
    "product_write_not_executed",
    "product_write_authority_not_granted",
  ];
  if (decision === "blocked") {
    reasonCodes.push("blocking_item_present", "operator_review_required");
  }
  if (decision === "needs_operator_review") {
    reasonCodes.push("operator_review_required");
  }
  return uniqueSorted(reasonCodes);
}

function defaultBoundaryReasonCodes(): ReleaseCandidateOperatorReasonCode[] {
  return [
    "release_candidate_review_is_review_only",
    "release_candidate_review_is_not_truth",
    "release_candidate_review_is_not_proof",
    "release_candidate_review_does_not_grant_authority",
    "release_candidate_review_not_release",
    "release_not_executed",
    "release_artifact_not_created",
    "release_authority_not_granted",
    "release_candidate_not_approved",
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "product_write_runtime_not_implemented",
    "product_write_adapter_not_enabled",
    "product_write_target_contract_not_created",
    "product_id_allocation_not_executed",
    "disabled_harness_is_not_reentry_approval",
    "disabled_harness_is_not_adapter_runtime",
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
  ];
}

function warningsForDecision(decision: ReleaseCandidateOperatorDecision): string[] {
  if (decision === "blocked") {
    return ["Release candidate operator review is blocked by missing or blocking context."];
  }
  if (decision === "needs_operator_review") {
    return ["Release candidate operator review still needs future human/operator review."];
  }
  if (decision === "ready_for_future_operator_review") {
    return [
      "Ready for future operator review only; no release or product-write authority is granted.",
    ];
  }
  return ["Release candidate operator review was rejected."];
}

function dedupeReviewItems(
  items: ReleaseCandidateOperatorReviewItem[],
): ReleaseCandidateOperatorReviewItem[] {
  const sorted = items.slice().sort((left, right) => {
    const kindCompare = left.item_kind.localeCompare(right.item_kind);
    if (kindCompare !== 0) return kindCompare;
    const severityCompare = left.severity.localeCompare(right.severity);
    if (severityCompare !== 0) return severityCompare;
    return left.item_id.localeCompare(right.item_id);
  });
  const seen = new Set<string>();
  const unique: ReleaseCandidateOperatorReviewItem[] = [];
  for (const item of sorted) {
    if (seen.has(item.item_id)) continue;
    seen.add(item.item_id);
    unique.push(item);
  }
  return unique;
}

function isBlockingSeverity(severity: ReleaseCandidateOperatorSeverity): boolean {
  return severity === "blocking" || severity === "critical";
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (
      !ReleaseCandidateOperatorReasonCodes.includes(
        code as ReleaseCandidateOperatorReasonCode,
      )
    ) {
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
