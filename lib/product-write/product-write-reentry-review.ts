import { createHash } from "node:crypto";

export const PRODUCT_WRITE_REENTRY_REVIEW_VERSION =
  "product_write_reentry_review.v0.1" as const;
export const PRODUCT_WRITE_REENTRY_INPUT_VERSION =
  "product_write_reentry_input.v0.1" as const;
export const PRODUCT_WRITE_REENTRY_RESULT_VERSION =
  "product_write_reentry_result.v0.1" as const;
export const PRODUCT_WRITE_REENTRY_GATE_VERSION =
  "product_write_reentry_gate.v0.1" as const;
export const PRODUCT_WRITE_REENTRY_PREREQUISITE_VERSION =
  "product_write_reentry_prerequisite.v0.1" as const;

const scope = "project:augnes" as const;
const blockedReviewId = "product-write-reentry:blocked" as const;

export const ProductWriteReentryStatuses = [
  "reviewed",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
] as const;
export type ProductWriteReentryStatus =
  (typeof ProductWriteReentryStatuses)[number];

export const ProductWriteGateDecisions = [
  "blocked",
  "remains_parked",
  "needs_explicit_reentry_approval",
  "eligible_for_future_reentry_review",
  "rejected",
] as const;
export type ProductWriteGateDecision =
  (typeof ProductWriteGateDecisions)[number];

export const ProductWritePrerequisiteKinds = [
  "runtime_audit_complete",
  "git_ledger_contract_present",
  "release_readiness_matrix_present",
  "disabled_adapter_harness_present",
  "product_write_target_contract_present",
  "operator_approval_present",
  "privacy_boundary_reviewed",
  "rollback_plan_present",
  "idempotency_plan_present",
  "failure_mode_reviewed",
  "proof_boundary_reviewed",
  "evidence_boundary_reviewed",
  "state_mutation_boundary_reviewed",
  "external_side_effect_boundary_reviewed",
  "unknown",
] as const;
export type ProductWritePrerequisiteKind =
  (typeof ProductWritePrerequisiteKinds)[number];

export const mandatoryProductWriteReentryPrerequisiteKindsV01 = [
  "runtime_audit_complete",
  "git_ledger_contract_present",
  "release_readiness_matrix_present",
  "disabled_adapter_harness_present",
  "product_write_target_contract_present",
  "operator_approval_present",
  "privacy_boundary_reviewed",
  "rollback_plan_present",
  "idempotency_plan_present",
  "failure_mode_reviewed",
  "proof_boundary_reviewed",
  "evidence_boundary_reviewed",
  "state_mutation_boundary_reviewed",
  "external_side_effect_boundary_reviewed",
] as const satisfies readonly ProductWritePrerequisiteKind[];

export const ProductWriteReentryReasonCodes = [
  "product_write_reentry_review_present",
  "product_write_remains_parked",
  "product_write_denied",
  "product_write_not_executed",
  "product_write_authority_not_granted",
  "product_write_runtime_not_implemented",
  "product_write_adapter_not_enabled",
  "product_write_target_contract_missing",
  "product_id_allocation_not_executed",
  "explicit_reentry_approval_required",
  "operator_approval_missing",
  "runtime_audit_ref_present",
  "runtime_audit_ref_missing",
  "git_ledger_contract_ref_present",
  "git_ledger_contract_ref_missing",
  "release_readiness_matrix_missing",
  "disabled_adapter_harness_missing",
  "rollback_plan_missing",
  "idempotency_plan_missing",
  "failure_mode_review_missing",
  "privacy_boundary_review_required",
  "proof_boundary_review_required",
  "evidence_boundary_review_required",
  "state_mutation_boundary_review_required",
  "external_side_effect_boundary_review_required",
  "product_write_is_not_truth",
  "product_write_is_not_proof",
  "product_write_is_not_evidence",
  "product_write_is_not_review_signal",
  "review_context_is_not_authority",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "runtime_audit_is_review_cue_only",
  "git_ledger_packet_is_not_commit",
  "git_ledger_packet_is_not_product_write",
  "durable_state_apply_is_not_product_write",
  "formation_receipt_is_not_product_write",
  "promotion_decision_is_not_product_write",
  "dogfooding_record_is_not_product_write",
  "feedback_is_not_product_write",
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
export type ProductWriteReentryReasonCode =
  (typeof ProductWriteReentryReasonCodes)[number];

export interface ProductWriteReentryAuthorityBoundary {
  product_write_reentry_review_now: true;
  review_only: true;
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
  product_write_authority: false;
  review_context_is_authority: false;
  runtime_audit_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ProductWriteReentryPrerequisite {
  prerequisite_version: typeof PRODUCT_WRITE_REENTRY_PREREQUISITE_VERSION;
  scope: typeof scope;
  prerequisite_id: string;
  prerequisite_kind: ProductWritePrerequisiteKind;
  satisfied: boolean;
  bounded_summary: string;
  evidence_refs: string[];
  runtime_audit_refs: string[];
  git_ledger_refs: string[];
  dogfooding_refs: string[];
  feedback_refs: string[];
  reason_codes: ProductWriteReentryReasonCode[];
  authority_boundary: ProductWriteReentryAuthorityBoundary;
}

export interface ProductWriteReentryGate {
  gate_version: typeof PRODUCT_WRITE_REENTRY_GATE_VERSION;
  scope: typeof scope;
  gate_id: string;
  gate_decision: ProductWriteGateDecision;
  bounded_summary: string;
  satisfied_prerequisite_refs: string[];
  missing_prerequisite_refs: string[];
  blocking_prerequisite_refs: string[];
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ProductWriteReentryReasonCode[];
  authority_boundary: ProductWriteReentryAuthorityBoundary;
}

export interface ProductWriteReentryInput {
  input_version: typeof PRODUCT_WRITE_REENTRY_INPUT_VERSION;
  review_version: typeof PRODUCT_WRITE_REENTRY_REVIEW_VERSION;
  scope: typeof scope;
  review_id: string;
  as_of: string;
  runtime_audit_refs: string[];
  git_ledger_contract_refs: string[];
  dogfooding_record_refs: string[];
  feedback_aggregate_refs: string[];
  durable_state_apply_refs: string[];
  formation_receipt_refs: string[];
  promotion_decision_refs: string[];
  requested_prerequisites: ProductWriteReentryPrerequisite[];
  boundary_notes: string[];
  reason_codes: ProductWriteReentryReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ProductWriteReentryResult {
  result_version: typeof PRODUCT_WRITE_REENTRY_RESULT_VERSION;
  review_version: typeof PRODUCT_WRITE_REENTRY_REVIEW_VERSION;
  scope: typeof scope;
  review_id: string;
  status: ProductWriteReentryStatus;
  gate: ProductWriteReentryGate | null;
  prerequisites: ProductWriteReentryPrerequisite[];
  missing_prerequisite_refs: string[];
  blocking_prerequisite_refs: string[];
  warnings: string[];
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ProductWriteReentryReasonCode[];
  authority_boundary: ProductWriteReentryAuthorityBoundary;
  review_fingerprint: string;
}

export interface ProductWriteReentryValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type JsonRecord = Record<string, unknown>;

const forbiddenFalseAuthorityFields = [
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
  "product_write_authority",
  "review_context_is_authority",
  "runtime_audit_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const requiredTrueAuthorityFields = [
  "product_write_reentry_review_now",
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
  "secret-like product-write reentry input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createProductWriteReentryAuthorityBoundaryV01():
  ProductWriteReentryAuthorityBoundary {
  return {
    product_write_reentry_review_now: true,
    review_only: true,
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
    product_write_authority: false,
    review_context_is_authority: false,
    runtime_audit_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateProductWriteReentryInputV01(
  input: unknown,
): ProductWriteReentryValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ProductWriteReentryInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));

  if (value.input_version !== PRODUCT_WRITE_REENTRY_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.review_version !== PRODUCT_WRITE_REENTRY_REVIEW_VERSION) {
    failures.push("review_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.review_id, "review_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "runtime_audit_refs",
    "git_ledger_contract_refs",
    "dogfooding_record_refs",
    "feedback_aggregate_refs",
    "durable_state_apply_refs",
    "formation_receipt_refs",
    "promotion_decision_refs",
    "boundary_notes",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.requested_prerequisites)) {
    failures.push("requested_prerequisites_invalid_array");
  } else {
    for (const prerequisite of value.requested_prerequisites) {
      failures.push(
        ...validateProductWriteReentryPrerequisiteV01(prerequisite).failure_codes,
      );
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateProductWriteReentryPrerequisiteV01(
  input: unknown,
): ProductWriteReentryValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["prerequisite_invalid_object"] };
  }
  const value = input as Partial<ProductWriteReentryPrerequisite>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "prerequisite"));
  failures.push(...collectPublicUnsafeFailures(input, "prerequisite"));

  if (value.prerequisite_version !== PRODUCT_WRITE_REENTRY_PREREQUISITE_VERSION) {
    failures.push("prerequisite_version_invalid");
  }
  if (value.scope !== scope) failures.push("prerequisite_scope_invalid");
  failures.push(...validateSafeString(value.prerequisite_id, "prerequisite_id"));
  if (
    !ProductWritePrerequisiteKinds.includes(
      value.prerequisite_kind as ProductWritePrerequisiteKind,
    )
  ) {
    failures.push("prerequisite_kind_invalid");
  }
  if (typeof value.satisfied !== "boolean") {
    failures.push("prerequisite_satisfied_invalid_boolean");
  }
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "evidence_refs",
    "runtime_audit_refs",
    "git_ledger_refs",
    "dogfooding_refs",
    "feedback_refs",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "prerequisite_reason_codes"));
  failures.push(
    ...validateAuthorityBoundary(value.authority_boundary, "prerequisite_authority_boundary"),
  );

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildProductWriteReentryReviewV01(
  input: ProductWriteReentryInput,
): ProductWriteReentryResult {
  const validation = validateProductWriteReentryInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultDenialReasonCodes(),
      "product_write_reentry_review_present",
    ]);
  }

  if (input.requested_prerequisites.length === 0) {
    return finalizeResult({
      result_version: PRODUCT_WRITE_REENTRY_RESULT_VERSION,
      review_version: PRODUCT_WRITE_REENTRY_REVIEW_VERSION,
      scope,
      review_id: input.review_id,
      status: "empty",
      gate: null,
      prerequisites: [],
      missing_prerequisite_refs: [],
      blocking_prerequisite_refs: [],
      warnings: ["No product-write reentry prerequisites were supplied."],
      product_write_executed: false,
      product_id_allocated: false,
      product_write_authority_granted: false,
      reason_codes: uniqueSorted([
        ...input.reason_codes,
        ...inputReasonCodes(input),
        ...defaultDenialReasonCodes(),
        "product_write_reentry_review_present",
        "product_write_remains_parked",
        "explicit_reentry_approval_required",
      ]),
      authority_boundary: createProductWriteReentryAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createProductWriteReentryAuthorityBoundaryV01();
  const prerequisites = dedupePrerequisites(input.requested_prerequisites).map(
    (prerequisite): ProductWriteReentryPrerequisite => ({
      ...prerequisite,
      evidence_refs: uniqueSorted(prerequisite.evidence_refs),
      runtime_audit_refs: uniqueSorted(prerequisite.runtime_audit_refs),
      git_ledger_refs: uniqueSorted(prerequisite.git_ledger_refs),
      dogfooding_refs: uniqueSorted(prerequisite.dogfooding_refs),
      feedback_refs: uniqueSorted(prerequisite.feedback_refs),
      reason_codes: uniqueSorted([
        ...prerequisite.reason_codes,
        ...reasonCodesForPrerequisite(prerequisite),
      ]),
      authority_boundary: authorityBoundary,
    }),
  );
  const missingMandatoryPrerequisiteKinds =
    getMissingMandatoryPrerequisiteKindsV01(prerequisites);
  const missingMandatoryPrerequisiteRefs = missingMandatoryPrerequisiteKinds.map(
    missingPrerequisiteRefForKindV01,
  );
  const missingMandatoryBlockingRefs = missingMandatoryPrerequisiteRefs;
  const omittedMandatoryReasonCodes =
    missingReasonCodesForOmittedMandatoryKindsV01(missingMandatoryPrerequisiteKinds);
  const satisfiedPrerequisiteRefs = prerequisites
    .filter((prerequisite) => prerequisite.satisfied)
    .map((prerequisite) => prerequisite.prerequisite_id);
  const missingPrerequisiteRefs = prerequisites
    .filter((prerequisite) => !prerequisite.satisfied)
    .map((prerequisite) => prerequisite.prerequisite_id)
    .concat(missingMandatoryPrerequisiteRefs);
  const blockingPrerequisiteRefs = prerequisites
    .filter((prerequisite) => !prerequisite.satisfied && isBlockingPrerequisite(prerequisite))
    .map((prerequisite) => prerequisite.prerequisite_id)
    .concat(missingMandatoryBlockingRefs);
  const gateDecision = decideGate(prerequisites, input, missingMandatoryPrerequisiteKinds);
  const gate: ProductWriteReentryGate = {
    gate_version: PRODUCT_WRITE_REENTRY_GATE_VERSION,
    scope,
    gate_id: `${input.review_id}:gate`,
    gate_decision: gateDecision,
    bounded_summary: gateSummary(gateDecision),
    satisfied_prerequisite_refs: uniqueSorted(satisfiedPrerequisiteRefs),
    missing_prerequisite_refs: uniqueSorted(missingPrerequisiteRefs),
    blocking_prerequisite_refs: uniqueSorted(blockingPrerequisiteRefs),
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted([
      ...defaultDenialReasonCodes(),
      ...reasonCodesForGate(gateDecision, missingMandatoryPrerequisiteKinds),
      ...inputReasonCodes(input),
      ...omittedMandatoryReasonCodes,
    ]),
    authority_boundary: authorityBoundary,
  };

  return finalizeResult({
    result_version: PRODUCT_WRITE_REENTRY_RESULT_VERSION,
    review_version: PRODUCT_WRITE_REENTRY_REVIEW_VERSION,
    scope,
    review_id: input.review_id,
    status: "reviewed",
    gate,
    prerequisites,
    missing_prerequisite_refs: uniqueSorted(missingPrerequisiteRefs),
    blocking_prerequisite_refs: uniqueSorted(blockingPrerequisiteRefs),
    warnings:
      gateDecision === "eligible_for_future_reentry_review"
        ? ["Future reentry review remains non-authoritative in this slice."]
        : ["Product-write remains parked by #686."],
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...inputReasonCodes(input),
      ...prerequisites.flatMap((prerequisite) => prerequisite.reason_codes),
      ...gate.reason_codes,
      ...omittedMandatoryReasonCodes,
      "product_write_reentry_review_present",
      "product_write_remains_parked",
      "product_write_authority_not_granted",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createProductWriteReentryFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<ProductWriteReentryResult, "review_fingerprint">,
): ProductWriteReentryResult {
  return {
    ...resultWithoutFingerprint,
    review_fingerprint: createProductWriteReentryFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    ProductWriteReentryStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: ProductWriteReentryReasonCode[],
): ProductWriteReentryResult {
  const reviewId =
    isRecord(input) &&
    typeof input.review_id === "string" &&
    unsafeStringFailureCodes(input.review_id, "review_id").length === 0
      ? input.review_id
      : blockedReviewId;
  return finalizeResult({
    result_version: PRODUCT_WRITE_REENTRY_RESULT_VERSION,
    review_version: PRODUCT_WRITE_REENTRY_REVIEW_VERSION,
    scope,
    review_id: reviewId,
    status,
    gate: null,
    prerequisites: [],
    missing_prerequisite_refs: [],
    blocking_prerequisite_refs: [],
    warnings: ["Product-write reentry input was blocked before review build."],
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createProductWriteReentryAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  ProductWriteReentryStatus,
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
): ProductWriteReentryReasonCode[] {
  const reasonCodes: ProductWriteReentryReasonCode[] = [];
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

function inputReasonCodes(input: ProductWriteReentryInput):
  ProductWriteReentryReasonCode[] {
  const reasonCodes: ProductWriteReentryReasonCode[] = [];
  if (input.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  } else {
    reasonCodes.push("runtime_audit_ref_missing");
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
  if (input.durable_state_apply_refs.length > 0) {
    reasonCodes.push("durable_state_apply_is_not_product_write");
  }
  if (input.formation_receipt_refs.length > 0) {
    reasonCodes.push("formation_receipt_is_not_product_write");
  }
  if (input.promotion_decision_refs.length > 0) {
    reasonCodes.push("promotion_decision_is_not_product_write");
  }
  if (input.dogfooding_record_refs.length > 0) {
    reasonCodes.push("dogfooding_record_is_not_product_write");
  }
  if (input.feedback_aggregate_refs.length > 0) {
    reasonCodes.push("feedback_is_not_product_write");
  }
  return uniqueSorted(reasonCodes);
}

function reasonCodesForPrerequisite(
  prerequisite: ProductWriteReentryPrerequisite,
): ProductWriteReentryReasonCode[] {
  const reasonCodes: ProductWriteReentryReasonCode[] = [
    "product_write_remains_parked",
    "product_write_authority_not_granted",
    "review_context_is_not_authority",
  ];
  if (!prerequisite.satisfied) {
    reasonCodes.push(...missingReasonCodesForKind(prerequisite.prerequisite_kind));
  }
  if (prerequisite.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  }
  if (prerequisite.git_ledger_refs.length > 0) {
    reasonCodes.push(
      "git_ledger_contract_ref_present",
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  }
  return uniqueSorted(reasonCodes);
}

function missingReasonCodesForKind(
  kind: ProductWritePrerequisiteKind,
): ProductWriteReentryReasonCode[] {
  const map: Partial<Record<ProductWritePrerequisiteKind, ProductWriteReentryReasonCode[]>> = {
    runtime_audit_complete: ["runtime_audit_ref_missing"],
    git_ledger_contract_present: ["git_ledger_contract_ref_missing"],
    release_readiness_matrix_present: ["release_readiness_matrix_missing"],
    disabled_adapter_harness_present: ["disabled_adapter_harness_missing"],
    product_write_target_contract_present: ["product_write_target_contract_missing"],
    operator_approval_present: ["operator_approval_missing"],
    privacy_boundary_reviewed: ["privacy_boundary_review_required"],
    rollback_plan_present: ["rollback_plan_missing"],
    idempotency_plan_present: ["idempotency_plan_missing"],
    failure_mode_reviewed: ["failure_mode_review_missing"],
    proof_boundary_reviewed: ["proof_boundary_review_required"],
    evidence_boundary_reviewed: ["evidence_boundary_review_required"],
    state_mutation_boundary_reviewed: ["state_mutation_boundary_review_required"],
    external_side_effect_boundary_reviewed: [
      "external_side_effect_boundary_review_required",
    ],
  };
  return map[kind] ?? [];
}

function getMissingMandatoryPrerequisiteKindsV01(
  prerequisites: ProductWriteReentryPrerequisite[],
): ProductWritePrerequisiteKind[] {
  const presentKinds = new Set(
    prerequisites.map((prerequisite) => prerequisite.prerequisite_kind),
  );
  return mandatoryProductWriteReentryPrerequisiteKindsV01
    .filter((kind) => !presentKinds.has(kind))
    .slice()
    .sort();
}

function missingPrerequisiteRefForKindV01(
  kind: ProductWritePrerequisiteKind,
): string {
  return `product-write-prereq:missing:${kind}`;
}

function missingReasonCodesForOmittedMandatoryKindsV01(
  kinds: ProductWritePrerequisiteKind[],
): ProductWriteReentryReasonCode[] {
  return uniqueSorted(kinds.flatMap((kind) => missingReasonCodesForKind(kind)));
}

function reasonCodesForGate(
  gateDecision: ProductWriteGateDecision,
  missingMandatoryPrerequisiteKinds: ProductWritePrerequisiteKind[],
): ProductWriteReentryReasonCode[] {
  const reasonCodes: ProductWriteReentryReasonCode[] = [
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "explicit_reentry_approval_required",
    ...missingReasonCodesForOmittedMandatoryKindsV01(missingMandatoryPrerequisiteKinds),
  ];
  if (gateDecision === "rejected") {
    reasonCodes.push("product_write_denied");
  }
  return uniqueSorted(reasonCodes);
}

function defaultDenialReasonCodes(): ProductWriteReentryReasonCode[] {
  return [
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "product_write_runtime_not_implemented",
    "product_write_adapter_not_enabled",
    "product_id_allocation_not_executed",
    "product_write_is_not_truth",
    "product_write_is_not_proof",
    "product_write_is_not_evidence",
    "product_write_is_not_review_signal",
    "review_context_is_not_authority",
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
    "git_write_not_executed",
    "github_api_not_called",
    "repository_file_not_written",
  ];
}

function decideGate(
  prerequisites: ProductWriteReentryPrerequisite[],
  input: ProductWriteReentryInput,
  missingMandatoryPrerequisiteKinds: ProductWritePrerequisiteKind[],
): ProductWriteGateDecision {
  if (prerequisites.some((prerequisite) => prerequisite.prerequisite_kind === "unknown")) {
    return "rejected";
  }
  if (input.runtime_audit_refs.length === 0 || input.git_ledger_contract_refs.length === 0) {
    return "remains_parked";
  }
  if (
    missingMandatoryPrerequisiteKinds.length > 0 ||
    prerequisites.some(
      (prerequisite) => !prerequisite.satisfied && isBlockingPrerequisite(prerequisite),
    )
  ) {
    return "blocked";
  }
  if (allMandatoryPrerequisitesSatisfiedV01(prerequisites)) {
    return "eligible_for_future_reentry_review";
  }
  return "needs_explicit_reentry_approval";
}

function gateSummary(gateDecision: ProductWriteGateDecision): string {
  const summaries: Record<ProductWriteGateDecision, string> = {
    blocked: "Product-write reentry remains blocked by missing blocking prerequisites.",
    remains_parked: "Product-write remains parked by #686 pending required review context.",
    needs_explicit_reentry_approval: "Product-write reentry requires explicit future approval.",
    eligible_for_future_reentry_review:
      "All supplied prerequisites are satisfied, but this review grants no product-write authority.",
    rejected: "Product-write reentry review rejects the supplied prerequisite set.",
  };
  return summaries[gateDecision];
}

function isBlockingPrerequisite(
  prerequisite: ProductWriteReentryPrerequisite,
): boolean {
  return isBlockingPrerequisiteKindV01(prerequisite.prerequisite_kind);
}

function isBlockingPrerequisiteKindV01(
  kind: ProductWritePrerequisiteKind,
): boolean {
  return [
    "release_readiness_matrix_present",
    "disabled_adapter_harness_present",
    "product_write_target_contract_present",
    "operator_approval_present",
    "privacy_boundary_reviewed",
    "rollback_plan_present",
    "idempotency_plan_present",
    "failure_mode_reviewed",
    "proof_boundary_reviewed",
    "evidence_boundary_reviewed",
    "state_mutation_boundary_reviewed",
    "external_side_effect_boundary_reviewed",
  ].includes(kind);
}

function allMandatoryPrerequisitesSatisfiedV01(
  prerequisites: ProductWriteReentryPrerequisite[],
): boolean {
  return mandatoryProductWriteReentryPrerequisiteKindsV01.every((kind) =>
    prerequisites.some(
      (prerequisite) =>
        prerequisite.prerequisite_kind === kind && prerequisite.satisfied === true,
    ),
  );
}

function dedupePrerequisites(
  prerequisites: ProductWriteReentryPrerequisite[],
): ProductWriteReentryPrerequisite[] {
  const sorted = prerequisites
    .slice()
    .sort((left, right) =>
      compareTuple(
        [left.prerequisite_kind, left.prerequisite_id],
        [right.prerequisite_kind, right.prerequisite_id],
      ),
    );
  const seen = new Set<string>();
  const unique: ProductWriteReentryPrerequisite[] = [];
  for (const prerequisite of sorted) {
    if (seen.has(prerequisite.prerequisite_id)) continue;
    seen.add(prerequisite.prerequisite_id);
    unique.push(prerequisite);
  }
  return unique;
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (!ProductWriteReentryReasonCodes.includes(code as ProductWriteReentryReasonCode)) {
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
