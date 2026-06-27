import { createHash } from "node:crypto";

export const RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION =
  "release_notes_public_safe_summary.v0.1" as const;
export const RELEASE_NOTES_PUBLIC_SAFE_INPUT_VERSION =
  "release_notes_public_safe_input.v0.1" as const;
export const RELEASE_NOTES_PUBLIC_SAFE_RESULT_VERSION =
  "release_notes_public_safe_result.v0.1" as const;
export const RELEASE_NOTES_PUBLIC_SAFE_SECTION_VERSION =
  "release_notes_public_safe_section.v0.1" as const;

const scope = "project:augnes" as const;
const blockedSummaryId = "release-notes-public-safe-summary:blocked" as const;

export const ReleaseNotesPublicSafeStatuses = [
  "built",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
] as const;
export type ReleaseNotesPublicSafeStatus =
  (typeof ReleaseNotesPublicSafeStatuses)[number];

export const ReleaseNotesPublicSafeDecisions = [
  "summary_candidate_only",
  "needs_operator_review",
  "blocked",
  "rejected",
] as const;
export type ReleaseNotesPublicSafeDecision =
  (typeof ReleaseNotesPublicSafeDecisions)[number];

export const ReleaseNotesPublicSafeSectionKinds = [
  "overview",
  "notable_changes",
  "review_context",
  "known_limitations",
  "verification_notes",
  "privacy_notes",
  "product_write_status",
  "release_boundary",
  "deferred_work",
  "unknown",
] as const;
export type ReleaseNotesPublicSafeSectionKind =
  (typeof ReleaseNotesPublicSafeSectionKinds)[number];

export const requiredReleaseNotesPublicSafeSectionKindsV01 = [
  "overview",
  "notable_changes",
  "known_limitations",
  "verification_notes",
  "privacy_notes",
  "product_write_status",
  "release_boundary",
  "deferred_work",
] as const satisfies readonly ReleaseNotesPublicSafeSectionKind[];

export const ReleaseNotesPublicSafeReasonCodes = [
  "release_notes_summary_present",
  "release_notes_summary_is_candidate_only",
  "release_notes_summary_is_review_only",
  "release_notes_summary_is_not_truth",
  "release_notes_summary_is_not_proof",
  "release_notes_summary_does_not_grant_authority",
  "release_notes_not_published",
  "release_artifact_not_created",
  "release_not_executed",
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
  "overview_section_present",
  "overview_section_missing",
  "notable_changes_section_present",
  "known_limitations_section_present",
  "verification_notes_section_present",
  "privacy_notes_section_present",
  "product_write_status_section_present",
  "release_boundary_section_present",
  "deferred_work_section_present",
  "operator_review_required",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "runtime_audit_is_review_cue_only",
  "git_ledger_packet_is_not_commit",
  "git_ledger_packet_is_not_product_write",
  "disabled_harness_is_not_reentry_approval",
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
export type ReleaseNotesPublicSafeReasonCode =
  (typeof ReleaseNotesPublicSafeReasonCodes)[number];

export interface ReleaseNotesPublicSafeAuthorityBoundary {
  release_notes_summary_now: true;
  review_only: true;
  release_notes_publish_now: false;
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
  release_notes_summary_is_truth: false;
  release_notes_summary_is_proof: false;
  release_notes_summary_is_authority: false;
  verification_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
  product_write_authority: false;
}

export interface ReleaseNotesPublicSafeInputSection {
  section_id: string;
  section_kind: ReleaseNotesPublicSafeSectionKind;
  bounded_title: string;
  bounded_summary: string;
  bullet_summaries: string[];
  source_refs: string[];
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
  reason_codes: ReleaseNotesPublicSafeReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseNotesPublicSafeInput {
  input_version: typeof RELEASE_NOTES_PUBLIC_SAFE_INPUT_VERSION;
  summary_version: typeof RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION;
  scope: typeof scope;
  summary_id: string;
  as_of: string;
  release_candidate_operator_refs: string[];
  release_readiness_refs: string[];
  release_scope_refs: string[];
  input_sections: ReleaseNotesPublicSafeInputSection[];
  boundary_notes: string[];
  reason_codes: ReleaseNotesPublicSafeReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleaseNotesPublicSafeSection {
  section_version: typeof RELEASE_NOTES_PUBLIC_SAFE_SECTION_VERSION;
  scope: typeof scope;
  section_id: string;
  section_kind: ReleaseNotesPublicSafeSectionKind;
  bounded_title: string;
  bounded_summary: string;
  bullet_summaries: string[];
  source_refs: string[];
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
  reason_codes: ReleaseNotesPublicSafeReasonCode[];
  authority_boundary: ReleaseNotesPublicSafeAuthorityBoundary;
}

export interface ReleaseNotesPublicSafeResult {
  result_version: typeof RELEASE_NOTES_PUBLIC_SAFE_RESULT_VERSION;
  summary_version: typeof RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION;
  scope: typeof scope;
  summary_id: string;
  status: ReleaseNotesPublicSafeStatus;
  decision: ReleaseNotesPublicSafeDecision;
  as_of: string;
  sections: ReleaseNotesPublicSafeSection[];
  missing_section_refs: string[];
  warnings: string[];
  release_notes_published: false;
  release_executed: false;
  release_artifact_created: false;
  release_authority_granted: false;
  release_candidate_approved: false;
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ReleaseNotesPublicSafeReasonCode[];
  authority_boundary: ReleaseNotesPublicSafeAuthorityBoundary;
  summary_fingerprint: string;
}

export interface ReleaseNotesPublicSafeValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type JsonRecord = Record<string, unknown>;

const forbiddenFalseAuthorityFields = [
  "release_notes_publish_now",
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
  "release_notes_summary_is_truth",
  "release_notes_summary_is_proof",
  "release_notes_summary_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
] as const;

const requiredTrueAuthorityFields = ["release_notes_summary_now", "review_only"] as const;

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
  "secret-like release notes input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createReleaseNotesPublicSafeAuthorityBoundaryV01():
  ReleaseNotesPublicSafeAuthorityBoundary {
  return {
    release_notes_summary_now: true,
    review_only: true,
    release_notes_publish_now: false,
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
    release_notes_summary_is_truth: false,
    release_notes_summary_is_proof: false,
    release_notes_summary_is_authority: false,
    verification_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
    product_write_authority: false,
  };
}

export function validateReleaseNotesPublicSafeInputV01(
  input: unknown,
): ReleaseNotesPublicSafeValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ReleaseNotesPublicSafeInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));
  failures.push(...collectForbiddenAuthorityObjectFailures(input, "input"));

  if (value.input_version !== RELEASE_NOTES_PUBLIC_SAFE_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.summary_version !== RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION) {
    failures.push("summary_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.summary_id, "summary_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "release_candidate_operator_refs",
    "release_readiness_refs",
    "release_scope_refs",
    "boundary_notes",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.input_sections)) {
    failures.push("input_sections_invalid_array");
  } else {
    for (const section of value.input_sections) {
      failures.push(...validateReleaseNotesPublicSafeInputSectionV01(section).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateReleaseNotesPublicSafeInputSectionV01(
  input: unknown,
): ReleaseNotesPublicSafeValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["section_invalid_object"] };
  }
  const value = input as Partial<ReleaseNotesPublicSafeInputSection>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "section"));
  failures.push(...collectPublicUnsafeFailures(input, "section"));
  failures.push(...collectForbiddenAuthorityObjectFailures(input, "section"));

  failures.push(...validateSafeString(value.section_id, "section_id"));
  if (
    !ReleaseNotesPublicSafeSectionKinds.includes(
      value.section_kind as ReleaseNotesPublicSafeSectionKind,
    )
  ) {
    failures.push("section_kind_invalid");
  }
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "bullet_summaries",
    "source_refs",
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
  failures.push(...validateReasonCodes(value.reason_codes, "section_reason_codes"));
  failures.push(
    ...validateAuthorityBoundary(value.authority_boundary, "section_authority_boundary"),
  );

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildReleaseNotesPublicSafeSummaryV01(
  input: ReleaseNotesPublicSafeInput,
): ReleaseNotesPublicSafeResult {
  const validation = validateReleaseNotesPublicSafeInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultBoundaryReasonCodes(),
      "release_notes_summary_present",
    ]);
  }

  if (input.input_sections.length === 0) {
    const missingSectionRefs = missingRequiredSectionRefs([]);

    return finalizeResult({
      result_version: RELEASE_NOTES_PUBLIC_SAFE_RESULT_VERSION,
      summary_version: RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION,
      scope,
      summary_id: input.summary_id,
      status: "empty",
      decision: "blocked",
      as_of: input.as_of,
      sections: [],
      missing_section_refs: missingSectionRefs,
      warnings: ["No public-safe release note sections were supplied."],
      release_notes_published: false,
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
        ...missingRequiredSectionReasonCodes([]),
        ...reasonCodesForDecision("blocked"),
        ...defaultBoundaryReasonCodes(),
        "release_notes_summary_present",
        "operator_review_required",
      ]),
      authority_boundary: createReleaseNotesPublicSafeAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createReleaseNotesPublicSafeAuthorityBoundaryV01();
  const sections = dedupeSections(input.input_sections).map(
    (section): ReleaseNotesPublicSafeSection => ({
      section_version: RELEASE_NOTES_PUBLIC_SAFE_SECTION_VERSION,
      scope,
      section_id: section.section_id,
      section_kind: section.section_kind,
      bounded_title: section.bounded_title,
      bounded_summary: section.bounded_summary,
      bullet_summaries: uniqueSorted(section.bullet_summaries),
      source_refs: uniqueSorted(section.source_refs),
      release_candidate_operator_refs: uniqueSorted(section.release_candidate_operator_refs),
      release_readiness_refs: uniqueSorted(section.release_readiness_refs),
      disabled_harness_refs: uniqueSorted(section.disabled_harness_refs),
      product_write_reentry_refs: uniqueSorted(section.product_write_reentry_refs),
      git_ledger_refs: uniqueSorted(section.git_ledger_refs),
      runtime_audit_refs: uniqueSorted(section.runtime_audit_refs),
      dogfooding_refs: uniqueSorted(section.dogfooding_refs),
      feedback_refs: uniqueSorted(section.feedback_refs),
      verification_refs: uniqueSorted(section.verification_refs),
      public_safe: true,
      reason_codes: uniqueSorted([
        ...section.reason_codes,
        ...reasonCodesForSection(section),
      ]),
      authority_boundary: { ...authorityBoundary },
    }),
  );
  const missingSectionRefs = missingRequiredSectionRefs(sections);
  const decision = decideSummary(
    sections,
    missingSectionRefs,
    hasTopLevelOperatorReviewGapV01(input),
  );

  return finalizeResult({
    result_version: RELEASE_NOTES_PUBLIC_SAFE_RESULT_VERSION,
    summary_version: RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION,
    scope,
    summary_id: input.summary_id,
    status: "built",
    decision,
    as_of: input.as_of,
    sections,
    missing_section_refs: missingSectionRefs,
    warnings: warningsForDecision(decision),
    release_notes_published: false,
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
      ...missingRequiredSectionReasonCodes(sections),
      ...sections.flatMap((section) => section.reason_codes),
      ...reasonCodesForDecision(decision),
      ...defaultBoundaryReasonCodes(),
      "release_notes_summary_present",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createReleaseNotesPublicSafeFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<ReleaseNotesPublicSafeResult, "summary_fingerprint">,
): ReleaseNotesPublicSafeResult {
  return {
    ...resultWithoutFingerprint,
    summary_fingerprint:
      createReleaseNotesPublicSafeFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    ReleaseNotesPublicSafeStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: ReleaseNotesPublicSafeReasonCode[],
): ReleaseNotesPublicSafeResult {
  const summaryId =
    isRecord(input) &&
    typeof input.summary_id === "string" &&
    unsafeStringFailureCodes(input.summary_id, "summary_id").length === 0
      ? input.summary_id
      : blockedSummaryId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "1970-01-01T00:00:00.000Z";
  return finalizeResult({
    result_version: RELEASE_NOTES_PUBLIC_SAFE_RESULT_VERSION,
    summary_version: RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_VERSION,
    scope,
    summary_id: summaryId,
    status,
    decision: status === "blocked_private_or_raw_payload" ? "blocked" : "rejected",
    as_of: asOf,
    sections: [],
    missing_section_refs: [],
    warnings: ["Release notes public-safe summary input was blocked."],
    release_notes_published: false,
    release_executed: false,
    release_artifact_created: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createReleaseNotesPublicSafeAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  ReleaseNotesPublicSafeStatus,
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
): ReleaseNotesPublicSafeReasonCode[] {
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [];
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
  input: ReleaseNotesPublicSafeInput,
): ReleaseNotesPublicSafeReasonCode[] {
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [];
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
  input: ReleaseNotesPublicSafeInput,
): boolean {
  return (
    input.release_candidate_operator_refs.length === 0 ||
    input.release_readiness_refs.length === 0
  );
}

function reasonCodesForSection(
  section: ReleaseNotesPublicSafeInputSection,
): ReleaseNotesPublicSafeReasonCode[] {
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [
    "release_notes_summary_is_candidate_only",
    "release_notes_summary_is_review_only",
    "release_notes_summary_does_not_grant_authority",
    "source_refs_are_lineage_not_proof",
  ];
  reasonCodes.push(
    ...presentRefReasonCodesForSectionRefs(section),
    ...sectionKindReasonCodes(section.section_kind),
  );
  if (section.reason_codes.includes("operator_review_required")) {
    reasonCodes.push("operator_review_required");
  }
  return uniqueSorted(reasonCodes);
}

function presentRefReasonCodesForSectionRefs(
  section: ReleaseNotesPublicSafeInputSection,
): ReleaseNotesPublicSafeReasonCode[] {
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [];
  if (section.release_candidate_operator_refs.length > 0) {
    reasonCodes.push("release_candidate_operator_ref_present");
  }
  if (section.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  }
  if (section.disabled_harness_refs.length > 0) {
    reasonCodes.push(
      "disabled_harness_ref_present",
      "disabled_harness_is_not_reentry_approval",
    );
  }
  if (section.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  }
  if (section.git_ledger_refs.length > 0) {
    reasonCodes.push(
      "git_ledger_contract_ref_present",
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  }
  if (section.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  }
  if (section.dogfooding_refs.length > 0) {
    reasonCodes.push("dogfooding_ref_present");
  }
  if (section.feedback_refs.length > 0) {
    reasonCodes.push("feedback_ref_present");
  }
  if (section.verification_refs.length > 0) {
    reasonCodes.push("verification_ref_present");
  }
  return reasonCodes;
}

function sectionKindReasonCodes(
  sectionKind: ReleaseNotesPublicSafeSectionKind,
): ReleaseNotesPublicSafeReasonCode[] {
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [];
  if (sectionKind === "overview") reasonCodes.push("overview_section_present");
  if (sectionKind === "notable_changes") {
    reasonCodes.push("notable_changes_section_present");
  }
  if (sectionKind === "known_limitations") {
    reasonCodes.push("known_limitations_section_present");
  }
  if (sectionKind === "verification_notes") {
    reasonCodes.push(
      "verification_notes_section_present",
      "smoke_pass_is_not_truth",
      "ci_pass_is_not_truth",
    );
  }
  if (sectionKind === "privacy_notes") {
    reasonCodes.push("privacy_notes_section_present");
  }
  if (sectionKind === "product_write_status") {
    reasonCodes.push(
      "product_write_status_section_present",
      "product_write_remains_parked",
      "product_write_denied",
      "product_write_not_executed",
      "product_write_authority_not_granted",
    );
  }
  if (sectionKind === "release_boundary") {
    reasonCodes.push(
      "release_boundary_section_present",
      "release_notes_not_published",
      "release_not_executed",
      "release_artifact_not_created",
      "release_authority_not_granted",
      "release_candidate_not_approved",
    );
  }
  if (sectionKind === "deferred_work") {
    reasonCodes.push("deferred_work_section_present");
  }
  return uniqueSorted(reasonCodes);
}

function missingRequiredSectionRefs(sections: ReleaseNotesPublicSafeSection[]): string[] {
  const presentKinds = new Set(sections.map((section) => section.section_kind));
  return requiredReleaseNotesPublicSafeSectionKindsV01
    .filter((kind) => !presentKinds.has(kind))
    .map((kind) => `release-notes-section:missing:${kind}`)
    .sort();
}

function missingRequiredSectionReasonCodes(
  sections: ReleaseNotesPublicSafeSection[],
): ReleaseNotesPublicSafeReasonCode[] {
  const presentKinds = new Set(sections.map((section) => section.section_kind));
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [];
  if (!presentKinds.has("overview")) reasonCodes.push("overview_section_missing");
  if (reasonCodes.length > 0 || missingRequiredSectionRefs(sections).length > 0) {
    reasonCodes.push("operator_review_required");
  }
  return uniqueSorted(reasonCodes);
}

function decideSummary(
  sections: ReleaseNotesPublicSafeSection[],
  missingSectionRefs: string[],
  hasTopLevelOperatorReviewGap: boolean,
): ReleaseNotesPublicSafeDecision {
  if (sections.some((section) => section.section_kind === "unknown")) return "rejected";
  if (missingSectionRefs.length > 0) return "blocked";
  if (hasTopLevelOperatorReviewGap) return "needs_operator_review";
  if (
    sections.some((section) =>
      section.reason_codes.includes("operator_review_required"),
    )
  ) {
    return "needs_operator_review";
  }
  return "summary_candidate_only";
}

function reasonCodesForDecision(
  decision: ReleaseNotesPublicSafeDecision,
): ReleaseNotesPublicSafeReasonCode[] {
  const reasonCodes: ReleaseNotesPublicSafeReasonCode[] = [
    "release_notes_summary_is_candidate_only",
    "release_notes_summary_is_review_only",
    "release_notes_summary_does_not_grant_authority",
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
  return uniqueSorted(reasonCodes);
}

function defaultBoundaryReasonCodes(): ReleaseNotesPublicSafeReasonCode[] {
  return [
    "release_notes_summary_is_candidate_only",
    "release_notes_summary_is_review_only",
    "release_notes_summary_is_not_truth",
    "release_notes_summary_is_not_proof",
    "release_notes_summary_does_not_grant_authority",
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

function warningsForDecision(decision: ReleaseNotesPublicSafeDecision): string[] {
  if (decision === "blocked") {
    return ["Release notes public-safe summary is blocked by missing sections."];
  }
  if (decision === "needs_operator_review") {
    return ["Release notes public-safe summary still needs future operator review."];
  }
  if (decision === "summary_candidate_only") {
    return [
      "Summary candidate only; no release notes publication or release authority is granted.",
    ];
  }
  return ["Release notes public-safe summary was rejected."];
}

function dedupeSections(
  sections: ReleaseNotesPublicSafeInputSection[],
): ReleaseNotesPublicSafeInputSection[] {
  const sorted = sections.slice().sort((left, right) => {
    const kindCompare = left.section_kind.localeCompare(right.section_kind);
    if (kindCompare !== 0) return kindCompare;
    return left.section_id.localeCompare(right.section_id);
  });
  const seen = new Set<string>();
  const unique: ReleaseNotesPublicSafeInputSection[] = [];
  for (const section of sorted) {
    if (seen.has(section.section_id)) continue;
    seen.add(section.section_id);
    unique.push(section);
  }
  return unique;
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (
      !ReleaseNotesPublicSafeReasonCodes.includes(
        code as ReleaseNotesPublicSafeReasonCode,
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
