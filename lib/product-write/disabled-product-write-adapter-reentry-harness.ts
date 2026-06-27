import { createHash } from "node:crypto";

export const DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION =
  "disabled_product_write_adapter_reentry_harness.v0.1" as const;
export const DISABLED_PRODUCT_WRITE_ADAPTER_INPUT_VERSION =
  "disabled_product_write_adapter_input.v0.1" as const;
export const DISABLED_PRODUCT_WRITE_ADAPTER_RESULT_VERSION =
  "disabled_product_write_adapter_result.v0.1" as const;

const scope = "project:augnes" as const;
const blockedHarnessId = "disabled-product-write-adapter:harness:blocked" as const;

export const DisabledProductWriteAdapterStatuses = [
  "refused_disabled",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
  "empty",
] as const;
export type DisabledProductWriteAdapterStatus =
  (typeof DisabledProductWriteAdapterStatuses)[number];

export const DisabledProductWriteAdapterDecisions = [
  "disabled",
  "refused",
  "blocked",
  "rejected",
] as const;
export type DisabledProductWriteAdapterDecision =
  (typeof DisabledProductWriteAdapterDecisions)[number];

export const DisabledProductWriteAdapterReasonCodes = [
  "disabled_adapter_harness_present",
  "product_write_remains_parked",
  "product_write_denied",
  "product_write_not_executed",
  "product_write_authority_not_granted",
  "product_write_runtime_not_implemented",
  "product_write_adapter_disabled",
  "product_write_target_contract_missing",
  "product_id_allocation_not_executed",
  "product_persistence_not_executed",
  "explicit_reentry_approval_required",
  "release_readiness_ref_present",
  "release_readiness_ref_missing",
  "product_write_reentry_ref_present",
  "product_write_reentry_ref_missing",
  "git_ledger_contract_ref_present",
  "runtime_audit_ref_present",
  "operator_approval_required",
  "disabled_harness_is_not_adapter_runtime",
  "disabled_harness_is_not_product_write",
  "disabled_harness_is_not_authority",
  "disabled_harness_is_not_reentry_approval",
  "invocation_shape_is_preview_only",
  "raw_payload_not_stored",
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
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
] as const;
export type DisabledProductWriteAdapterReasonCode =
  (typeof DisabledProductWriteAdapterReasonCodes)[number];

export interface DisabledProductWriteAdapterAuthorityBoundary {
  disabled_product_write_adapter_harness_now: true;
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
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  git_commit_now: false;
  git_branch_now: false;
  git_tag_now: false;
  github_api_call_now: false;
  pull_request_creation_now: false;
  repository_file_write_now: false;
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
  codex_execution_authority: false;
  github_automation_authority: false;
  disabled_harness_is_authority: false;
  disabled_harness_is_adapter_runtime: false;
  disabled_harness_is_product_write: false;
  disabled_harness_is_reentry_approval: false;
  product_write_authority: false;
  release_readiness_is_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface DisabledProductWriteAdapterInvocationPreview {
  invocation_preview_id: string;
  bounded_title: string;
  bounded_summary: string;
  target_contract_refs: string[];
  release_readiness_refs: string[];
  product_write_reentry_refs: string[];
  runtime_audit_refs: string[];
  git_ledger_refs: string[];
  source_refs: string[];
  public_safe: boolean;
  reason_codes: DisabledProductWriteAdapterReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface DisabledProductWriteAdapterInput {
  input_version: typeof DISABLED_PRODUCT_WRITE_ADAPTER_INPUT_VERSION;
  harness_version: typeof DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION;
  scope: typeof scope;
  harness_id: string;
  as_of: string;
  invocation_previews: DisabledProductWriteAdapterInvocationPreview[];
  release_readiness_refs: string[];
  product_write_reentry_refs: string[];
  operator_approval_refs: string[];
  explicit_reentry_approval_refs: string[];
  product_write_target_contract_refs: string[];
  boundary_notes: string[];
  reason_codes: DisabledProductWriteAdapterReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface DisabledProductWriteAdapterResult {
  result_version: typeof DISABLED_PRODUCT_WRITE_ADAPTER_RESULT_VERSION;
  harness_version: typeof DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION;
  scope: typeof scope;
  harness_id: string;
  status: DisabledProductWriteAdapterStatus;
  decision: DisabledProductWriteAdapterDecision;
  as_of: string;
  invocation_previews: DisabledProductWriteAdapterInvocationPreview[];
  refused_invocation_refs: string[];
  missing_prerequisite_refs: string[];
  warnings: string[];
  product_write_executed: false;
  product_id_allocated: false;
  product_persisted: false;
  product_write_authority_granted: false;
  adapter_enabled: false;
  adapter_runtime_executed: false;
  reason_codes: DisabledProductWriteAdapterReasonCode[];
  authority_boundary: DisabledProductWriteAdapterAuthorityBoundary;
  harness_fingerprint: string;
}

export interface DisabledProductWriteAdapterValidationResult {
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
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "repository_file_write_now",
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
  "codex_execution_authority",
  "github_automation_authority",
  "disabled_harness_is_authority",
  "disabled_harness_is_adapter_runtime",
  "disabled_harness_is_product_write",
  "disabled_harness_is_reentry_approval",
  "product_write_authority",
  "release_readiness_is_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const requiredTrueAuthorityFields = [
  "disabled_product_write_adapter_harness_now",
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
  "secret-like disabled harness input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createDisabledProductWriteAdapterAuthorityBoundaryV01():
  DisabledProductWriteAdapterAuthorityBoundary {
  return {
    disabled_product_write_adapter_harness_now: true,
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
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    git_commit_now: false,
    git_branch_now: false,
    git_tag_now: false,
    github_api_call_now: false,
    pull_request_creation_now: false,
    repository_file_write_now: false,
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
    codex_execution_authority: false,
    github_automation_authority: false,
    disabled_harness_is_authority: false,
    disabled_harness_is_adapter_runtime: false,
    disabled_harness_is_product_write: false,
    disabled_harness_is_reentry_approval: false,
    product_write_authority: false,
    release_readiness_is_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateDisabledProductWriteAdapterInputV01(
  input: unknown,
): DisabledProductWriteAdapterValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<DisabledProductWriteAdapterInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));

  if (value.input_version !== DISABLED_PRODUCT_WRITE_ADAPTER_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.harness_version !== DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION) {
    failures.push("harness_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.harness_id, "harness_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "release_readiness_refs",
    "product_write_reentry_refs",
    "operator_approval_refs",
    "explicit_reentry_approval_refs",
    "product_write_target_contract_refs",
    "boundary_notes",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.invocation_previews)) {
    failures.push("invocation_previews_invalid_array");
  } else {
    for (const preview of value.invocation_previews) {
      failures.push(
        ...validateDisabledProductWriteAdapterInvocationPreviewV01(preview)
          .failure_codes,
      );
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateDisabledProductWriteAdapterInvocationPreviewV01(
  input: unknown,
): DisabledProductWriteAdapterValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["invocation_preview_invalid_object"] };
  }
  const value = input as Partial<DisabledProductWriteAdapterInvocationPreview>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "invocation_preview"));
  failures.push(...collectPublicUnsafeFailures(input, "invocation_preview"));

  failures.push(...validateSafeString(value.invocation_preview_id, "invocation_preview_id"));
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "target_contract_refs",
    "release_readiness_refs",
    "product_write_reentry_refs",
    "runtime_audit_refs",
    "git_ledger_refs",
    "source_refs",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  if (value.public_safe !== true) failures.push("public_safe_not_true");
  failures.push(
    ...validateReasonCodes(value.reason_codes, "invocation_preview_reason_codes"),
  );
  failures.push(
    ...validateAuthorityBoundary(
      value.authority_boundary,
      "invocation_preview_authority_boundary",
    ),
  );

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildDisabledProductWriteAdapterHarnessV01(
  input: DisabledProductWriteAdapterInput,
): DisabledProductWriteAdapterResult {
  const validation = validateDisabledProductWriteAdapterInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultRefusalReasonCodes(),
      "disabled_adapter_harness_present",
    ]);
  }

  if (input.invocation_previews.length === 0) {
    return finalizeResult({
      result_version: DISABLED_PRODUCT_WRITE_ADAPTER_RESULT_VERSION,
      harness_version: DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION,
      scope,
      harness_id: input.harness_id,
      status: "empty",
      decision: "disabled",
      as_of: input.as_of,
      invocation_previews: [],
      refused_invocation_refs: [],
      missing_prerequisite_refs: missingPrerequisiteRefsForInput(input),
      warnings: ["No disabled product-write invocation previews were supplied."],
      product_write_executed: false,
      product_id_allocated: false,
      product_persisted: false,
      product_write_authority_granted: false,
      adapter_enabled: false,
      adapter_runtime_executed: false,
      reason_codes: uniqueSorted([
        ...input.reason_codes,
        ...inputReasonCodes(input),
        ...missingReasonCodesForInput(input),
        ...defaultRefusalReasonCodes(),
        "disabled_adapter_harness_present",
      ]),
      authority_boundary: createDisabledProductWriteAdapterAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createDisabledProductWriteAdapterAuthorityBoundaryV01();
  const invocationPreviews = dedupeInvocationPreviews(input.invocation_previews).map(
    (preview): DisabledProductWriteAdapterInvocationPreview => ({
      ...preview,
      target_contract_refs: uniqueSorted(preview.target_contract_refs),
      release_readiness_refs: uniqueSorted(preview.release_readiness_refs),
      product_write_reentry_refs: uniqueSorted(preview.product_write_reentry_refs),
      runtime_audit_refs: uniqueSorted(preview.runtime_audit_refs),
      git_ledger_refs: uniqueSorted(preview.git_ledger_refs),
      source_refs: uniqueSorted(preview.source_refs),
      public_safe: true,
      reason_codes: uniqueSorted([
        ...preview.reason_codes,
        ...reasonCodesForInvocationPreview(preview),
      ]),
      authority_boundary: { ...authorityBoundary },
    }),
  );
  const missingPrerequisiteRefs = missingPrerequisiteRefsForInput(input);
  const decision = decideHarness(input, missingPrerequisiteRefs);

  return finalizeResult({
    result_version: DISABLED_PRODUCT_WRITE_ADAPTER_RESULT_VERSION,
    harness_version: DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION,
    scope,
    harness_id: input.harness_id,
    status: "refused_disabled",
    decision,
    as_of: input.as_of,
    invocation_previews: invocationPreviews,
    refused_invocation_refs: uniqueSorted(
      invocationPreviews.map((preview) => preview.invocation_preview_id),
    ),
    missing_prerequisite_refs: uniqueSorted(missingPrerequisiteRefs),
    warnings:
      missingPrerequisiteRefs.length > 0
        ? ["Disabled harness refused because future prerequisites are missing."]
        : ["Disabled harness refuses execution because this slice is not reentry approval."],
    product_write_executed: false,
    product_id_allocated: false,
    product_persisted: false,
    product_write_authority_granted: false,
    adapter_enabled: false,
    adapter_runtime_executed: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...inputReasonCodes(input),
      ...missingReasonCodesForInput(input),
      ...invocationPreviews.flatMap((preview) => preview.reason_codes),
      ...reasonCodesForDecision(decision),
      ...defaultRefusalReasonCodes(),
      "disabled_adapter_harness_present",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createDisabledProductWriteAdapterFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<
    DisabledProductWriteAdapterResult,
    "harness_fingerprint"
  >,
): DisabledProductWriteAdapterResult {
  return {
    ...resultWithoutFingerprint,
    harness_fingerprint:
      createDisabledProductWriteAdapterFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    DisabledProductWriteAdapterStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: DisabledProductWriteAdapterReasonCode[],
): DisabledProductWriteAdapterResult {
  const harnessId =
    isRecord(input) &&
    typeof input.harness_id === "string" &&
    unsafeStringFailureCodes(input.harness_id, "harness_id").length === 0
      ? input.harness_id
      : blockedHarnessId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "1970-01-01T00:00:00.000Z";
  return finalizeResult({
    result_version: DISABLED_PRODUCT_WRITE_ADAPTER_RESULT_VERSION,
    harness_version: DISABLED_PRODUCT_WRITE_ADAPTER_HARNESS_VERSION,
    scope,
    harness_id: harnessId,
    status,
    decision: status === "blocked_private_or_raw_payload" ? "blocked" : "rejected",
    as_of: asOf,
    invocation_previews: [],
    refused_invocation_refs: [],
    missing_prerequisite_refs: [],
    warnings: ["Disabled product-write adapter harness input was blocked."],
    product_write_executed: false,
    product_id_allocated: false,
    product_persisted: false,
    product_write_authority_granted: false,
    adapter_enabled: false,
    adapter_runtime_executed: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createDisabledProductWriteAdapterAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  DisabledProductWriteAdapterStatus,
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
): DisabledProductWriteAdapterReasonCode[] {
  const reasonCodes: DisabledProductWriteAdapterReasonCode[] = [];
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

function reasonCodesForInvocationPreview(
  preview: DisabledProductWriteAdapterInvocationPreview,
): DisabledProductWriteAdapterReasonCode[] {
  const reasonCodes: DisabledProductWriteAdapterReasonCode[] = [
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "product_write_adapter_disabled",
    "disabled_harness_is_not_adapter_runtime",
    "disabled_harness_is_not_product_write",
    "disabled_harness_is_not_authority",
    "disabled_harness_is_not_reentry_approval",
    "invocation_shape_is_preview_only",
  ];
  if (preview.target_contract_refs.length === 0) {
    reasonCodes.push("product_write_target_contract_missing");
  }
  if (preview.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  }
  if (preview.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  }
  if (preview.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present");
  }
  if (preview.git_ledger_refs.length > 0) {
    reasonCodes.push("git_ledger_contract_ref_present");
  }
  return uniqueSorted(reasonCodes);
}

function inputReasonCodes(
  input: DisabledProductWriteAdapterInput,
): DisabledProductWriteAdapterReasonCode[] {
  const reasonCodes: DisabledProductWriteAdapterReasonCode[] = [];
  if (input.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  } else {
    reasonCodes.push("release_readiness_ref_missing");
  }
  if (input.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  } else {
    reasonCodes.push("product_write_reentry_ref_missing");
  }
  if (input.product_write_target_contract_refs.length === 0) {
    reasonCodes.push("product_write_target_contract_missing");
  }
  reasonCodes.push("operator_approval_required", "explicit_reentry_approval_required");
  return uniqueSorted(reasonCodes);
}

function missingReasonCodesForInput(
  input: DisabledProductWriteAdapterInput,
): DisabledProductWriteAdapterReasonCode[] {
  const reasonCodes: DisabledProductWriteAdapterReasonCode[] = [];
  if (input.release_readiness_refs.length === 0) {
    reasonCodes.push("release_readiness_ref_missing");
  }
  if (input.product_write_reentry_refs.length === 0) {
    reasonCodes.push("product_write_reentry_ref_missing");
  }
  if (input.product_write_target_contract_refs.length === 0) {
    reasonCodes.push("product_write_target_contract_missing");
  }
  if (input.explicit_reentry_approval_refs.length === 0) {
    reasonCodes.push("explicit_reentry_approval_required");
  }
  return uniqueSorted(reasonCodes);
}

function reasonCodesForDecision(
  decision: DisabledProductWriteAdapterDecision,
): DisabledProductWriteAdapterReasonCode[] {
  const reasonCodes: DisabledProductWriteAdapterReasonCode[] = [
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "product_write_adapter_disabled",
    "disabled_harness_is_not_authority",
    "disabled_harness_is_not_reentry_approval",
  ];
  if (decision === "disabled" || decision === "refused") {
    reasonCodes.push(
      "disabled_harness_is_not_adapter_runtime",
      "disabled_harness_is_not_product_write",
      "explicit_reentry_approval_required",
    );
  }
  if (decision === "blocked" || decision === "rejected") {
    reasonCodes.push("product_write_denied");
  }
  return uniqueSorted(reasonCodes);
}

function defaultRefusalReasonCodes(): DisabledProductWriteAdapterReasonCode[] {
  return [
    "product_write_remains_parked",
    "product_write_denied",
    "product_write_not_executed",
    "product_write_authority_not_granted",
    "product_write_runtime_not_implemented",
    "product_write_adapter_disabled",
    "product_write_target_contract_missing",
    "product_id_allocation_not_executed",
    "product_persistence_not_executed",
    "explicit_reentry_approval_required",
    "operator_approval_required",
    "disabled_harness_is_not_adapter_runtime",
    "disabled_harness_is_not_product_write",
    "disabled_harness_is_not_authority",
    "disabled_harness_is_not_reentry_approval",
    "invocation_shape_is_preview_only",
    "raw_payload_not_stored",
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
    "provider_call_not_executed",
    "prompt_not_sent",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "source_fetch_not_executed",
    "file_read_not_executed",
  ];
}

function missingPrerequisiteRefsForInput(
  input: DisabledProductWriteAdapterInput,
): string[] {
  const refs: string[] = [];
  if (input.release_readiness_refs.length === 0) {
    refs.push("disabled-harness-prereq:missing:release_readiness_refs");
  }
  if (input.product_write_reentry_refs.length === 0) {
    refs.push("disabled-harness-prereq:missing:product_write_reentry_refs");
  }
  if (input.explicit_reentry_approval_refs.length === 0) {
    refs.push("disabled-harness-prereq:missing:explicit_reentry_approval_refs");
  }
  if (input.product_write_target_contract_refs.length === 0) {
    refs.push("disabled-harness-prereq:missing:product_write_target_contract_refs");
  }
  return uniqueSorted(refs);
}

function decideHarness(
  input: DisabledProductWriteAdapterInput,
  missingPrerequisiteRefs: string[],
): DisabledProductWriteAdapterDecision {
  if (
    input.release_readiness_refs.length === 0 ||
    input.product_write_reentry_refs.length === 0
  ) {
    return "disabled";
  }
  if (missingPrerequisiteRefs.length > 0) return "refused";
  return "refused";
}

function dedupeInvocationPreviews(
  previews: DisabledProductWriteAdapterInvocationPreview[],
): DisabledProductWriteAdapterInvocationPreview[] {
  const sorted = previews
    .slice()
    .sort((left, right) =>
      left.invocation_preview_id.localeCompare(right.invocation_preview_id),
    );
  const seen = new Set<string>();
  const unique: DisabledProductWriteAdapterInvocationPreview[] = [];
  for (const preview of sorted) {
    if (seen.has(preview.invocation_preview_id)) continue;
    seen.add(preview.invocation_preview_id);
    unique.push(preview);
  }
  return unique;
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (
      !DisabledProductWriteAdapterReasonCodes.includes(
        code as DisabledProductWriteAdapterReasonCode,
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
