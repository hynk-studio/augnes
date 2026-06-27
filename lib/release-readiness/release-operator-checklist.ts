import { createHash } from "node:crypto";

export const RELEASE_OPERATOR_CHECKLIST_VERSION =
  "release_operator_checklist.v0.1" as const;
export const RELEASE_OPERATOR_CHECKLIST_INPUT_VERSION =
  "release_operator_checklist_input.v0.1" as const;
export const RELEASE_OPERATOR_CHECKLIST_RESULT_VERSION =
  "release_operator_checklist_result.v0.1" as const;
export const RELEASE_OPERATOR_CHECKLIST_ITEM_VERSION =
  "release_operator_checklist_item.v0.1" as const;

const scope = "project:augnes" as const;
const blockedChecklistId = "release-operator-checklist:blocked" as const;

export const ReleaseOperatorChecklistStatuses = [
  "built",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
] as const;
export type ReleaseOperatorChecklistStatus =
  (typeof ReleaseOperatorChecklistStatuses)[number];

export const ReleaseOperatorChecklistDecisions = [
  "checklist_candidate_only",
  "needs_operator_review",
  "blocked",
  "rejected",
] as const;
export type ReleaseOperatorChecklistDecision =
  (typeof ReleaseOperatorChecklistDecisions)[number];

export const ReleaseOperatorChecklistItemKinds = [
  "release_notes_summary",
  "release_candidate_operator_review",
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
  "release_boundary",
  "product_write_boundary",
  "operator_notes",
  "unknown",
] as const;
export type ReleaseOperatorChecklistItemKind =
  (typeof ReleaseOperatorChecklistItemKinds)[number];

export const ReleaseOperatorChecklistSeverities = [
  "info",
  "warning",
  "blocking",
  "critical",
  "unknown",
] as const;
export type ReleaseOperatorChecklistSeverity =
  (typeof ReleaseOperatorChecklistSeverities)[number];

export const requiredReleaseOperatorChecklistItemKindsV01 = [
  "release_notes_summary",
  "release_candidate_operator_review",
  "release_readiness",
  "disabled_product_write_harness",
  "product_write_reentry",
  "git_ledger_contract",
  "runtime_audit",
  "verification",
  "privacy",
  "release_boundary",
  "product_write_boundary",
] as const satisfies readonly ReleaseOperatorChecklistItemKind[];

export const ReleaseOperatorChecklistReasonCodes = [
  "release_operator_checklist_present",
  "release_operator_checklist_is_candidate_only",
  "release_operator_checklist_is_review_only",
  "release_operator_checklist_is_not_truth",
  "release_operator_checklist_is_not_proof",
  "release_operator_checklist_does_not_grant_authority",
  "release_operator_checklist_not_release_approval",
  "release_not_executed",
  "release_artifact_not_created",
  "release_notes_not_published",
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
  "release_notes_summary_ref_present",
  "release_notes_summary_ref_missing",
  "release_candidate_operator_ref_present",
  "release_candidate_operator_ref_missing",
  "release_readiness_ref_present",
  "release_readiness_ref_missing",
  "disabled_harness_ref_present",
  "product_write_reentry_ref_present",
  "git_ledger_contract_ref_present",
  "runtime_audit_ref_present",
  "dogfooding_ref_present",
  "feedback_ref_present",
  "verification_ref_present",
  "checklist_item_present",
  "checklist_item_missing",
  "mandatory_checklist_item_missing",
  "operator_review_required",
  "blocking_item_present",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "runtime_audit_is_review_cue_only",
  "git_ledger_packet_is_not_commit",
  "git_ledger_packet_is_not_product_write",
  "disabled_harness_is_not_reentry_approval",
  "release_notes_summary_is_candidate_only",
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
export type ReleaseOperatorChecklistReasonCode =
  (typeof ReleaseOperatorChecklistReasonCodes)[number];

export interface ReleaseOperatorChecklistAuthorityBoundary {
  release_operator_checklist_now: true;
  review_only: true;
  release_execution_now: false;
  release_artifact_creation_now: false;
  release_notes_publish_now: false;
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
  release_operator_checklist_is_truth: false;
  release_operator_checklist_is_proof: false;
  release_operator_checklist_is_authority: false;
  verification_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
  product_write_authority: false;
}

export interface ReleaseOperatorChecklistInputItem {
  item_id: string;
  item_kind: ReleaseOperatorChecklistItemKind;
  severity: ReleaseOperatorChecklistSeverity;
  checked: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  release_notes_summary_refs: string[];
  release_candidate_operator_refs: string[];
  release_readiness_refs: string[];
  disabled_harness_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_refs: string[];
  runtime_audit_refs: string[];
  dogfooding_refs: string[];
  feedback_refs: string[];
  verification_refs: string[];
  public_safe: boolean;
  reason_codes: ReleaseOperatorChecklistReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseOperatorChecklistInput {
  input_version: typeof RELEASE_OPERATOR_CHECKLIST_INPUT_VERSION;
  checklist_version: typeof RELEASE_OPERATOR_CHECKLIST_VERSION;
  scope: typeof scope;
  checklist_id: string;
  as_of: string;
  release_notes_summary_refs: string[];
  release_candidate_operator_refs: string[];
  release_readiness_refs: string[];
  input_items: ReleaseOperatorChecklistInputItem[];
  boundary_notes: string[];
  reason_codes: ReleaseOperatorChecklistReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseOperatorChecklistItem {
  item_version: typeof RELEASE_OPERATOR_CHECKLIST_ITEM_VERSION;
  scope: typeof scope;
  item_id: string;
  item_kind: ReleaseOperatorChecklistItemKind;
  severity: ReleaseOperatorChecklistSeverity;
  checked: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  release_notes_summary_refs: string[];
  release_candidate_operator_refs: string[];
  release_readiness_refs: string[];
  disabled_harness_refs: string[];
  product_write_reentry_refs: string[];
  git_ledger_refs: string[];
  runtime_audit_refs: string[];
  dogfooding_refs: string[];
  feedback_refs: string[];
  verification_refs: string[];
  public_safe: true;
  reason_codes: ReleaseOperatorChecklistReasonCode[];
  authority_boundary: ReleaseOperatorChecklistAuthorityBoundary;
}

export interface ReleaseOperatorChecklistResult {
  result_version: typeof RELEASE_OPERATOR_CHECKLIST_RESULT_VERSION;
  checklist_version: typeof RELEASE_OPERATOR_CHECKLIST_VERSION;
  scope: typeof scope;
  checklist_id: string;
  status: ReleaseOperatorChecklistStatus;
  decision: ReleaseOperatorChecklistDecision;
  as_of: string;
  items: ReleaseOperatorChecklistItem[];
  missing_item_refs: string[];
  blocking_item_refs: string[];
  warnings: string[];
  release_executed: false;
  release_artifact_created: false;
  release_notes_published: false;
  release_authority_granted: false;
  release_candidate_approved: false;
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ReleaseOperatorChecklistReasonCode[];
  authority_boundary: ReleaseOperatorChecklistAuthorityBoundary;
  checklist_fingerprint: string;
}

export interface ReleaseOperatorChecklistValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type JsonRecord = Record<string, unknown>;

const forbiddenFalseAuthorityFields = [
  "release_execution_now",
  "release_artifact_creation_now",
  "release_notes_publish_now",
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
  "release_operator_checklist_is_truth",
  "release_operator_checklist_is_proof",
  "release_operator_checklist_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
] as const;

const requiredTrueAuthorityFields = [
  "release_operator_checklist_now",
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
  "raw release notes payload",
  "raw checklist payload",
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
  "secret-like release checklist input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createReleaseOperatorChecklistAuthorityBoundaryV01():
  ReleaseOperatorChecklistAuthorityBoundary {
  return {
    release_operator_checklist_now: true,
    review_only: true,
    release_execution_now: false,
    release_artifact_creation_now: false,
    release_notes_publish_now: false,
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
    release_operator_checklist_is_truth: false,
    release_operator_checklist_is_proof: false,
    release_operator_checklist_is_authority: false,
    verification_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
    product_write_authority: false,
  };
}

export function validateReleaseOperatorChecklistInputV01(
  input: unknown,
): ReleaseOperatorChecklistValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ReleaseOperatorChecklistInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));
  failures.push(...collectForbiddenAuthorityObjectFailures(input, "input"));

  if (value.input_version !== RELEASE_OPERATOR_CHECKLIST_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.checklist_version !== RELEASE_OPERATOR_CHECKLIST_VERSION) {
    failures.push("checklist_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.checklist_id, "checklist_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "release_notes_summary_refs",
    "release_candidate_operator_refs",
    "release_readiness_refs",
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
      failures.push(...validateReleaseOperatorChecklistInputItemV01(item).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateReleaseOperatorChecklistInputItemV01(
  input: unknown,
): ReleaseOperatorChecklistValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["item_invalid_object"] };
  }
  const value = input as Partial<ReleaseOperatorChecklistInputItem>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "item"));
  failures.push(...collectPublicUnsafeFailures(input, "item"));
  failures.push(...collectForbiddenAuthorityObjectFailures(input, "item"));

  failures.push(...validateSafeString(value.item_id, "item_id"));
  if (
    !ReleaseOperatorChecklistItemKinds.includes(
      value.item_kind as ReleaseOperatorChecklistItemKind,
    )
  ) {
    failures.push("item_kind_invalid");
  }
  if (
    !ReleaseOperatorChecklistSeverities.includes(
      value.severity as ReleaseOperatorChecklistSeverity,
    )
  ) {
    failures.push("severity_invalid");
  }
  if (typeof value.checked !== "boolean") failures.push("checked_invalid_boolean");
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "source_refs",
    "release_notes_summary_refs",
    "release_candidate_operator_refs",
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
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "item_authority_boundary"));

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildReleaseOperatorChecklistV01(
  input: ReleaseOperatorChecklistInput,
): ReleaseOperatorChecklistResult {
  const validation = validateReleaseOperatorChecklistInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultBoundaryReasonCodes(),
      "release_operator_checklist_present",
    ]);
  }

  if (input.input_items.length === 0) {
    const missingItemRefs = missingRequiredItemRefs([]);
    return finalizeResult({
      result_version: RELEASE_OPERATOR_CHECKLIST_RESULT_VERSION,
      checklist_version: RELEASE_OPERATOR_CHECKLIST_VERSION,
      scope,
      checklist_id: input.checklist_id,
      status: "empty",
      decision: "blocked",
      as_of: input.as_of,
      items: [],
      missing_item_refs: missingItemRefs,
      blocking_item_refs: missingItemRefs,
      warnings: ["No public-safe release operator checklist items were supplied."],
      release_executed: false,
      release_artifact_created: false,
      release_notes_published: false,
      release_authority_granted: false,
      release_candidate_approved: false,
      product_write_executed: false,
      product_id_allocated: false,
      product_write_authority_granted: false,
      reason_codes: uniqueSorted([
        ...input.reason_codes,
        ...inputReasonCodes(input),
        ...missingRequiredItemReasonCodes([]),
        ...reasonCodesForDecision("blocked"),
        ...defaultBoundaryReasonCodes(),
        "release_operator_checklist_present",
        "operator_review_required",
      ]),
      authority_boundary: createReleaseOperatorChecklistAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createReleaseOperatorChecklistAuthorityBoundaryV01();
  const items = dedupeItems(input.input_items).map(
    (item): ReleaseOperatorChecklistItem => ({
      item_version: RELEASE_OPERATOR_CHECKLIST_ITEM_VERSION,
      scope,
      item_id: item.item_id,
      item_kind: item.item_kind,
      severity: item.severity,
      checked: item.checked,
      bounded_title: item.bounded_title,
      bounded_summary: item.bounded_summary,
      source_refs: uniqueSorted(item.source_refs),
      release_notes_summary_refs: uniqueSorted(item.release_notes_summary_refs),
      release_candidate_operator_refs: uniqueSorted(item.release_candidate_operator_refs),
      release_readiness_refs: uniqueSorted(item.release_readiness_refs),
      disabled_harness_refs: uniqueSorted(item.disabled_harness_refs),
      product_write_reentry_refs: uniqueSorted(item.product_write_reentry_refs),
      git_ledger_refs: uniqueSorted(item.git_ledger_refs),
      runtime_audit_refs: uniqueSorted(item.runtime_audit_refs),
      dogfooding_refs: uniqueSorted(item.dogfooding_refs),
      feedback_refs: uniqueSorted(item.feedback_refs),
      verification_refs: uniqueSorted(item.verification_refs),
      public_safe: true,
      reason_codes: uniqueSorted([...item.reason_codes, ...reasonCodesForItem(item)]),
      authority_boundary: { ...authorityBoundary },
    }),
  );
  const missingItemRefs = missingRequiredItemRefs(items);
  const blockingItemRefs = blockingRefsForItems(items, missingItemRefs);
  const decision = decideChecklist(
    items,
    missingItemRefs,
    blockingItemRefs,
    hasTopLevelOperatorReviewGapV01(input),
  );

  return finalizeResult({
    result_version: RELEASE_OPERATOR_CHECKLIST_RESULT_VERSION,
    checklist_version: RELEASE_OPERATOR_CHECKLIST_VERSION,
    scope,
    checklist_id: input.checklist_id,
    status: "built",
    decision,
    as_of: input.as_of,
    items,
    missing_item_refs: missingItemRefs,
    blocking_item_refs: blockingItemRefs,
    warnings: warningsForDecision(decision),
    release_executed: false,
    release_artifact_created: false,
    release_notes_published: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...inputReasonCodes(input),
      ...missingRequiredItemReasonCodes(items),
      ...items.flatMap((item) => item.reason_codes),
      ...reasonCodesForDecision(decision),
      ...defaultBoundaryReasonCodes(),
      "release_operator_checklist_present",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createReleaseOperatorChecklistFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<ReleaseOperatorChecklistResult, "checklist_fingerprint">,
): ReleaseOperatorChecklistResult {
  return {
    ...resultWithoutFingerprint,
    checklist_fingerprint:
      createReleaseOperatorChecklistFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    ReleaseOperatorChecklistStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: ReleaseOperatorChecklistReasonCode[],
): ReleaseOperatorChecklistResult {
  const checklistId =
    isRecord(input) &&
    typeof input.checklist_id === "string" &&
    unsafeStringFailureCodes(input.checklist_id, "checklist_id").length === 0
      ? input.checklist_id
      : blockedChecklistId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "1970-01-01T00:00:00.000Z";
  return finalizeResult({
    result_version: RELEASE_OPERATOR_CHECKLIST_RESULT_VERSION,
    checklist_version: RELEASE_OPERATOR_CHECKLIST_VERSION,
    scope,
    checklist_id: checklistId,
    status,
    decision: status === "blocked_private_or_raw_payload" ? "blocked" : "rejected",
    as_of: asOf,
    items: [],
    missing_item_refs: [],
    blocking_item_refs: [],
    warnings: ["Release operator checklist input was blocked."],
    release_executed: false,
    release_artifact_created: false,
    release_notes_published: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createReleaseOperatorChecklistAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  ReleaseOperatorChecklistStatus,
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
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [];
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
  input: ReleaseOperatorChecklistInput,
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [];
  if (input.release_notes_summary_refs.length > 0) {
    reasonCodes.push("release_notes_summary_ref_present");
  } else {
    reasonCodes.push("release_notes_summary_ref_missing", "operator_review_required");
  }
  if (input.release_candidate_operator_refs.length > 0) {
    reasonCodes.push("release_candidate_operator_ref_present");
  } else {
    reasonCodes.push("release_candidate_operator_ref_missing", "operator_review_required");
  }
  if (input.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  } else {
    reasonCodes.push("release_readiness_ref_missing", "operator_review_required");
  }
  return uniqueSorted(reasonCodes);
}

export function hasTopLevelOperatorReviewGapV01(
  input: ReleaseOperatorChecklistInput,
): boolean {
  return (
    input.release_notes_summary_refs.length === 0 ||
    input.release_candidate_operator_refs.length === 0 ||
    input.release_readiness_refs.length === 0
  );
}

function reasonCodesForItem(
  item: ReleaseOperatorChecklistInputItem,
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [
    "release_operator_checklist_is_candidate_only",
    "release_operator_checklist_is_review_only",
    "release_operator_checklist_does_not_grant_authority",
    "release_operator_checklist_not_release_approval",
    "source_refs_are_lineage_not_proof",
    "checklist_item_present",
  ];
  reasonCodes.push(...presentRefReasonCodesForItemRefs(item), ...itemKindReasonCodes(item.item_kind));
  if (!item.checked) {
    reasonCodes.push("operator_review_required");
    if (item.severity === "blocking" || item.severity === "critical") {
      reasonCodes.push("blocking_item_present");
    }
  }
  return uniqueSorted(reasonCodes);
}

function presentRefReasonCodesForItemRefs(
  item: ReleaseOperatorChecklistInputItem,
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [];
  if (item.release_notes_summary_refs.length > 0) {
    reasonCodes.push("release_notes_summary_ref_present");
  }
  if (item.release_candidate_operator_refs.length > 0) {
    reasonCodes.push("release_candidate_operator_ref_present");
  }
  if (item.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  }
  if (item.disabled_harness_refs.length > 0) {
    reasonCodes.push("disabled_harness_ref_present", "disabled_harness_is_not_reentry_approval");
  }
  if (item.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  }
  if (item.git_ledger_refs.length > 0) {
    reasonCodes.push(
      "git_ledger_contract_ref_present",
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  }
  if (item.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  }
  if (item.dogfooding_refs.length > 0) reasonCodes.push("dogfooding_ref_present");
  if (item.feedback_refs.length > 0) reasonCodes.push("feedback_ref_present");
  if (item.verification_refs.length > 0) {
    reasonCodes.push("verification_ref_present", "smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  return reasonCodes;
}

function itemKindReasonCodes(
  itemKind: ReleaseOperatorChecklistItemKind,
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [];
  if (itemKind === "release_notes_summary") {
    reasonCodes.push("release_notes_summary_is_candidate_only");
  }
  if (itemKind === "release_boundary") {
    reasonCodes.push(
      "release_notes_not_published",
      "release_not_executed",
      "release_artifact_not_created",
      "release_authority_not_granted",
      "release_candidate_not_approved",
    );
  }
  if (itemKind === "product_write_boundary") {
    reasonCodes.push(
      "product_write_remains_parked",
      "product_write_denied",
      "product_write_not_executed",
      "product_write_authority_not_granted",
      "product_write_runtime_not_implemented",
      "product_write_adapter_not_enabled",
      "product_write_target_contract_not_created",
      "product_id_allocation_not_executed",
    );
  }
  if (itemKind === "verification") {
    reasonCodes.push("smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  return uniqueSorted(reasonCodes);
}

function missingRequiredItemRefs(items: ReleaseOperatorChecklistItem[]): string[] {
  const presentKinds = new Set(items.map((item) => item.item_kind));
  return requiredReleaseOperatorChecklistItemKindsV01
    .filter((kind) => !presentKinds.has(kind))
    .map((kind) => `release-operator-checklist-item:missing:${kind}`)
    .sort();
}

function missingRequiredItemReasonCodes(
  items: ReleaseOperatorChecklistItem[],
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [];
  if (missingRequiredItemRefs(items).length > 0) {
    reasonCodes.push(
      "checklist_item_missing",
      "mandatory_checklist_item_missing",
      "operator_review_required",
    );
  }
  return uniqueSorted(reasonCodes);
}

function blockingRefsForItems(
  items: ReleaseOperatorChecklistItem[],
  missingItemRefs: string[],
): string[] {
  const uncheckedBlockingRefs = items
    .filter(
      (item) =>
        !item.checked &&
        (item.severity === "blocking" || item.severity === "critical"),
    )
    .map((item) => item.item_id);
  return uniqueSorted([...missingItemRefs, ...uncheckedBlockingRefs]);
}

function decideChecklist(
  items: ReleaseOperatorChecklistItem[],
  missingItemRefs: string[],
  blockingItemRefs: string[],
  hasTopLevelOperatorReviewGap: boolean,
): ReleaseOperatorChecklistDecision {
  if (items.some((item) => item.item_kind === "unknown")) return "rejected";
  if (missingItemRefs.length > 0 || blockingItemRefs.length > 0) return "blocked";
  if (hasTopLevelOperatorReviewGap) return "needs_operator_review";
  if (items.some((item) => !item.checked)) return "needs_operator_review";
  return "checklist_candidate_only";
}

function reasonCodesForDecision(
  decision: ReleaseOperatorChecklistDecision,
): ReleaseOperatorChecklistReasonCode[] {
  const reasonCodes: ReleaseOperatorChecklistReasonCode[] = [
    "release_operator_checklist_is_candidate_only",
    "release_operator_checklist_is_review_only",
    "release_operator_checklist_does_not_grant_authority",
    "release_operator_checklist_not_release_approval",
    "release_notes_not_published",
    "release_not_executed",
    "release_artifact_not_created",
    "release_authority_not_granted",
    "release_candidate_not_approved",
    "product_write_remains_parked",
    "product_write_not_executed",
    "product_write_authority_not_granted",
  ];
  if (decision === "blocked" || decision === "needs_operator_review") {
    reasonCodes.push("operator_review_required");
  }
  if (decision === "blocked") reasonCodes.push("blocking_item_present");
  return uniqueSorted(reasonCodes);
}

function defaultBoundaryReasonCodes(): ReleaseOperatorChecklistReasonCode[] {
  return [
    "release_operator_checklist_is_candidate_only",
    "release_operator_checklist_is_review_only",
    "release_operator_checklist_is_not_truth",
    "release_operator_checklist_is_not_proof",
    "release_operator_checklist_does_not_grant_authority",
    "release_operator_checklist_not_release_approval",
    "release_notes_not_published",
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
    "release_notes_summary_is_candidate_only",
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

function warningsForDecision(decision: ReleaseOperatorChecklistDecision): string[] {
  if (decision === "blocked") {
    return ["Release operator checklist is blocked by missing or blocking items."];
  }
  if (decision === "needs_operator_review") {
    return ["Release operator checklist still needs future operator review."];
  }
  if (decision === "checklist_candidate_only") {
    return ["Checklist candidate only; no release approval or authority is granted."];
  }
  return ["Release operator checklist was rejected."];
}

function dedupeItems(
  items: ReleaseOperatorChecklistInputItem[],
): ReleaseOperatorChecklistInputItem[] {
  const sorted = items.slice().sort((left, right) => {
    const kindCompare = left.item_kind.localeCompare(right.item_kind);
    if (kindCompare !== 0) return kindCompare;
    const severityCompare = left.severity.localeCompare(right.severity);
    if (severityCompare !== 0) return severityCompare;
    return left.item_id.localeCompare(right.item_id);
  });
  const seen = new Set<string>();
  const unique: ReleaseOperatorChecklistInputItem[] = [];
  for (const item of sorted) {
    if (seen.has(item.item_id)) continue;
    seen.add(item.item_id);
    unique.push(item);
  }
  return unique;
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (
      !ReleaseOperatorChecklistReasonCodes.includes(
        code as ReleaseOperatorChecklistReasonCode,
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
  if (typeof value === "string") return unsafeStringFailureCodes(value, label);
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

function collectForbiddenAuthorityObjectFailures(value: unknown, label: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectForbiddenAuthorityObjectFailures(item, `${label}_${index}`),
    );
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const failures: string[] = [];
    if (
      forbiddenFalseAuthorityFields.includes(
        key as (typeof forbiddenFalseAuthorityFields)[number],
      ) &&
      nestedValue !== false &&
      nestedValue !== undefined
    ) {
      failures.push(`${label}_${key}_forbidden_authority`);
    }
    if (
      requiredTrueAuthorityFields.includes(
        key as (typeof requiredTrueAuthorityFields)[number],
      ) &&
      nestedValue !== true &&
      nestedValue !== undefined
    ) {
      failures.push(`${label}_${key}_invalid_authority`);
    }
    failures.push(
      ...collectForbiddenAuthorityObjectFailures(nestedValue, `${label}_${key}`),
    );
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
