import { createHash } from "node:crypto";

export const RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION =
  "release_postmerge_observer_notes.v0.1" as const;
export const RELEASE_POSTMERGE_OBSERVER_INPUT_VERSION =
  "release_postmerge_observer_input.v0.1" as const;
export const RELEASE_POSTMERGE_OBSERVER_RESULT_VERSION =
  "release_postmerge_observer_result.v0.1" as const;
export const RELEASE_POSTMERGE_OBSERVER_NOTE_VERSION =
  "release_postmerge_observer_note.v0.1" as const;

const scope = "project:augnes" as const;
const blockedObserverId = "release-postmerge-observer-notes:blocked" as const;

export const ReleasePostmergeObserverStatuses = [
  "built",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
] as const;
export type ReleasePostmergeObserverStatus =
  (typeof ReleasePostmergeObserverStatuses)[number];

export const ReleasePostmergeObserverDecisions = [
  "observer_notes_candidate_only",
  "needs_operator_review",
  "blocked",
  "rejected",
] as const;
export type ReleasePostmergeObserverDecision =
  (typeof ReleasePostmergeObserverDecisions)[number];

export const ReleasePostmergeObserverNoteKinds = [
  "freeze_manifest",
  "release_operator_checklist",
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
  "merge_boundary",
  "release_boundary",
  "product_write_boundary",
  "operator_notes",
  "unknown",
] as const;
export type ReleasePostmergeObserverNoteKind =
  (typeof ReleasePostmergeObserverNoteKinds)[number];

export const ReleasePostmergeObserverSeverities = [
  "info",
  "warning",
  "blocking",
  "critical",
  "unknown",
] as const;
export type ReleasePostmergeObserverSeverity =
  (typeof ReleasePostmergeObserverSeverities)[number];

export const requiredReleasePostmergeObserverNoteKindsV01 = [
  "freeze_manifest",
  "release_operator_checklist",
  "release_notes_summary",
  "release_candidate_operator_review",
  "release_readiness",
  "disabled_product_write_harness",
  "product_write_reentry",
  "git_ledger_contract",
  "runtime_audit",
  "verification",
  "privacy",
  "merge_boundary",
  "release_boundary",
  "product_write_boundary",
] as const satisfies readonly ReleasePostmergeObserverNoteKind[];

export const ReleasePostmergeObserverReasonCodes = [
  "release_postmerge_observer_notes_present",
  "observer_notes_are_candidate_only",
  "observer_notes_are_review_only",
  "observer_notes_are_not_truth",
  "observer_notes_are_not_proof",
  "observer_notes_do_not_grant_authority",
  "observer_notes_not_actual_postmerge_observation",
  "merge_not_executed",
  "git_not_executed",
  "github_api_not_called",
  "repository_file_not_written",
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
  "release_candidate_freeze_manifest_ref_present",
  "release_candidate_freeze_manifest_ref_missing",
  "release_operator_checklist_ref_present",
  "release_operator_checklist_ref_missing",
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
  "observer_note_present",
  "observer_note_missing",
  "mandatory_observer_note_missing",
  "operator_review_required",
  "blocking_note_present",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "runtime_audit_is_review_cue_only",
  "git_ledger_packet_is_not_commit",
  "git_ledger_packet_is_not_product_write",
  "disabled_harness_is_not_reentry_approval",
  "release_notes_summary_is_candidate_only",
  "release_operator_checklist_is_candidate_only",
  "freeze_manifest_is_candidate_only",
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
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
] as const;
export type ReleasePostmergeObserverReasonCode =
  (typeof ReleasePostmergeObserverReasonCodes)[number];

export interface ReleasePostmergeObserverAuthorityBoundary {
  release_postmerge_observer_notes_now: true;
  review_only: true;
  actual_postmerge_observation_now: false;
  merge_execution_now: false;
  release_freeze_execution_now: false;
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
  observer_notes_are_truth: false;
  observer_notes_are_proof: false;
  observer_notes_are_authority: false;
  verification_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
  product_write_authority: false;
}

export interface ReleasePostmergeObserverInputNote {
  note_id: string;
  note_kind: ReleasePostmergeObserverNoteKind;
  severity: ReleasePostmergeObserverSeverity;
  included: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  release_candidate_freeze_manifest_refs: string[];
  release_operator_checklist_refs: string[];
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
  reason_codes: ReleasePostmergeObserverReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleasePostmergeObserverInput {
  input_version: typeof RELEASE_POSTMERGE_OBSERVER_INPUT_VERSION;
  observer_version: typeof RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION;
  scope: typeof scope;
  observer_id: string;
  as_of: string;
  release_candidate_freeze_manifest_refs: string[];
  release_operator_checklist_refs: string[];
  release_notes_summary_refs: string[];
  release_candidate_operator_refs: string[];
  release_readiness_refs: string[];
  input_notes: ReleasePostmergeObserverInputNote[];
  boundary_notes: string[];
  reason_codes: ReleasePostmergeObserverReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface ReleasePostmergeObserverNote {
  note_version: typeof RELEASE_POSTMERGE_OBSERVER_NOTE_VERSION;
  scope: typeof scope;
  note_id: string;
  note_kind: ReleasePostmergeObserverNoteKind;
  severity: ReleasePostmergeObserverSeverity;
  included: boolean;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  release_candidate_freeze_manifest_refs: string[];
  release_operator_checklist_refs: string[];
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
  reason_codes: ReleasePostmergeObserverReasonCode[];
  authority_boundary: ReleasePostmergeObserverAuthorityBoundary;
}

export interface ReleasePostmergeObserverResult {
  result_version: typeof RELEASE_POSTMERGE_OBSERVER_RESULT_VERSION;
  observer_version: typeof RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION;
  scope: typeof scope;
  observer_id: string;
  status: ReleasePostmergeObserverStatus;
  decision: ReleasePostmergeObserverDecision;
  as_of: string;
  notes: ReleasePostmergeObserverNote[];
  missing_note_refs: string[];
  blocking_note_refs: string[];
  warnings: string[];
  actual_postmerge_observed: false;
  merge_executed: false;
  release_frozen: false;
  release_executed: false;
  release_artifact_created: false;
  release_notes_published: false;
  release_authority_granted: false;
  release_candidate_approved: false;
  product_write_executed: false;
  product_id_allocated: false;
  product_write_authority_granted: false;
  reason_codes: ReleasePostmergeObserverReasonCode[];
  authority_boundary: ReleasePostmergeObserverAuthorityBoundary;
  observer_fingerprint: string;
}

export interface ReleasePostmergeObserverValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type JsonRecord = Record<string, unknown>;

const forbiddenFalseAuthorityFields = [
  "actual_postmerge_observation_now",
  "merge_execution_now",
  "release_freeze_execution_now",
  "release_execution_now",
  "release_artifact_creation_now",
  "release_notes_publish_now",
  "release_authority_granted_now",
  "release_candidate_approved_now",
  "actual_postmerge_observed",
  "merge_executed",
  "release_frozen",
  "release_executed",
  "release_artifact_created",
  "release_notes_published",
  "release_authority_granted",
  "release_candidate_approved",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_write_target_contract_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "product_write_executed",
  "product_id_allocated",
  "product_write_authority_granted",
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
  "observer_notes_are_truth",
  "observer_notes_are_proof",
  "observer_notes_are_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
] as const;

const requiredTrueAuthorityFields = [
  "release_postmerge_observer_notes_now",
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
  "raw postmerge payload",
  "raw postmerge observer payload",
  "raw product-write payload",
  "raw release payload",
  "raw release notes payload",
  "raw freeze manifest payload",
  "raw checklist payload",
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
  "secret-like postmerge observer input blocked by fixture",
] as const;
const tokenLikePatterns = [/\bsk-[a-z0-9_-]{8,}/i, /\bghp_[a-z0-9_]{8,}/i] as const;

export function createReleasePostmergeObserverAuthorityBoundaryV01():
  ReleasePostmergeObserverAuthorityBoundary {
  return {
    release_postmerge_observer_notes_now: true,
    review_only: true,
    actual_postmerge_observation_now: false,
    merge_execution_now: false,
    release_freeze_execution_now: false,
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
    observer_notes_are_truth: false,
    observer_notes_are_proof: false,
    observer_notes_are_authority: false,
    verification_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
    product_write_authority: false,
  };
}

export function validateReleasePostmergeObserverInputV01(
  input: unknown,
): ReleasePostmergeObserverValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ReleasePostmergeObserverInput>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "input"));
  failures.push(...collectPublicUnsafeFailures(input, "input"));
  failures.push(...collectForbiddenAuthorityObjectFailures(input, "input"));

  if (value.input_version !== RELEASE_POSTMERGE_OBSERVER_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.observer_version !== RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION) {
    failures.push("observer_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.observer_id, "observer_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  for (const key of [
    "release_candidate_freeze_manifest_refs",
    "release_operator_checklist_refs",
    "release_notes_summary_refs",
    "release_candidate_operator_refs",
    "release_readiness_refs",
    "boundary_notes",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.input_notes)) {
    failures.push("input_notes_invalid_array");
  } else {
    failures.push(...duplicateNoteIdFailureCodes(value.input_notes));
    for (const note of value.input_notes) {
      failures.push(...validateReleasePostmergeObserverInputNoteV01(note).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateReleasePostmergeObserverInputNoteV01(
  input: unknown,
): ReleasePostmergeObserverValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["note_invalid_object"] };
  }
  const value = input as Partial<ReleasePostmergeObserverInputNote>;
  const failures: string[] = [];
  failures.push(...collectUnsafeObjectFailures(input, "note"));
  failures.push(...collectPublicUnsafeFailures(input, "note"));
  failures.push(...collectForbiddenAuthorityObjectFailures(input, "note"));

  failures.push(...validateSafeString(value.note_id, "note_id"));
  if (
    !ReleasePostmergeObserverNoteKinds.includes(
      value.note_kind as ReleasePostmergeObserverNoteKind,
    )
  ) {
    failures.push("note_kind_invalid");
  }
  if (
    !ReleasePostmergeObserverSeverities.includes(
      value.severity as ReleasePostmergeObserverSeverity,
    )
  ) {
    failures.push("severity_invalid");
  }
  if (typeof value.included !== "boolean") failures.push("included_invalid_boolean");
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "source_refs",
    "release_candidate_freeze_manifest_refs",
    "release_operator_checklist_refs",
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
  failures.push(...validateReasonCodes(value.reason_codes, "note_reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "note_authority_boundary"));

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildReleasePostmergeObserverNotesV01(
  input: ReleasePostmergeObserverInput,
): ReleasePostmergeObserverResult {
  const validation = validateReleasePostmergeObserverInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      ...defaultBoundaryReasonCodes(),
      "release_postmerge_observer_notes_present",
    ]);
  }

  if (input.input_notes.length === 0) {
    const missingNoteRefs = missingRequiredNoteRefs([]);
    return finalizeResult({
      result_version: RELEASE_POSTMERGE_OBSERVER_RESULT_VERSION,
      observer_version: RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION,
      scope,
      observer_id: input.observer_id,
      status: "empty",
      decision: "blocked",
      as_of: input.as_of,
      notes: [],
      missing_note_refs: missingNoteRefs,
      blocking_note_refs: missingNoteRefs,
      warnings: ["No public-safe release postmerge observer notes notes were supplied."],
      actual_postmerge_observed: false,
      merge_executed: false,
      release_frozen: false,
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
        ...missingRequiredNoteReasonCodes([]),
        ...reasonCodesForDecision("blocked"),
        ...defaultBoundaryReasonCodes(),
        "release_postmerge_observer_notes_present",
        "operator_review_required",
      ]),
      authority_boundary: createReleasePostmergeObserverAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createReleasePostmergeObserverAuthorityBoundaryV01();
  const notes = dedupeNotes(input.input_notes).map(
    (note): ReleasePostmergeObserverNote => ({
      note_version: RELEASE_POSTMERGE_OBSERVER_NOTE_VERSION,
      scope,
      note_id: note.note_id,
      note_kind: note.note_kind,
      severity: note.severity,
      included: note.included,
      bounded_title: note.bounded_title,
      bounded_summary: note.bounded_summary,
      source_refs: uniqueSorted(note.source_refs),
      release_candidate_freeze_manifest_refs: uniqueSorted(
        note.release_candidate_freeze_manifest_refs,
      ),
      release_operator_checklist_refs: uniqueSorted(note.release_operator_checklist_refs),
      release_notes_summary_refs: uniqueSorted(note.release_notes_summary_refs),
      release_candidate_operator_refs: uniqueSorted(note.release_candidate_operator_refs),
      release_readiness_refs: uniqueSorted(note.release_readiness_refs),
      disabled_harness_refs: uniqueSorted(note.disabled_harness_refs),
      product_write_reentry_refs: uniqueSorted(note.product_write_reentry_refs),
      git_ledger_refs: uniqueSorted(note.git_ledger_refs),
      runtime_audit_refs: uniqueSorted(note.runtime_audit_refs),
      dogfooding_refs: uniqueSorted(note.dogfooding_refs),
      feedback_refs: uniqueSorted(note.feedback_refs),
      verification_refs: uniqueSorted(note.verification_refs),
      public_safe: true,
      reason_codes: uniqueSorted([...note.reason_codes, ...reasonCodesForNote(note)]),
      authority_boundary: { ...authorityBoundary },
    }),
  );
  const missingNoteRefs = missingRequiredNoteRefs(notes);
  const blockingNoteRefs = blockingRefsForNotes(notes, missingNoteRefs);
  const decision = decideManifest(
    notes,
    missingNoteRefs,
    blockingNoteRefs,
    hasTopLevelOperatorReviewGapV01(input),
  );

  return finalizeResult({
    result_version: RELEASE_POSTMERGE_OBSERVER_RESULT_VERSION,
    observer_version: RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION,
    scope,
    observer_id: input.observer_id,
    status: "built",
    decision,
    as_of: input.as_of,
    notes,
    missing_note_refs: missingNoteRefs,
    blocking_note_refs: blockingNoteRefs,
    warnings: warningsForDecision(decision),
    actual_postmerge_observed: false,
    merge_executed: false,
    release_frozen: false,
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
      ...missingRequiredNoteReasonCodes(notes),
      ...notes.flatMap((note) => note.reason_codes),
      ...reasonCodesForDecision(decision),
      ...defaultBoundaryReasonCodes(),
      "release_postmerge_observer_notes_present",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createReleasePostmergeObserverFingerprintV01(
  resultWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(resultWithoutFingerprint))
    .digest("hex");
}

function finalizeResult(
  resultWithoutFingerprint: Omit<ReleasePostmergeObserverResult, "observer_fingerprint">,
): ReleasePostmergeObserverResult {
  return {
    ...resultWithoutFingerprint,
    observer_fingerprint:
      createReleasePostmergeObserverFingerprintV01(resultWithoutFingerprint),
  };
}

function blockedResult(
  status: Extract<
    ReleasePostmergeObserverStatus,
    "blocked_private_or_raw_payload" | "blocked_invalid_input"
  >,
  input: unknown,
  reasonCodes: ReleasePostmergeObserverReasonCode[],
): ReleasePostmergeObserverResult {
  const observerId =
    isRecord(input) &&
    typeof input.observer_id === "string" &&
    unsafeStringFailureCodes(input.observer_id, "observer_id").length === 0
      ? input.observer_id
      : blockedObserverId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "1970-01-01T00:00:00.000Z";
  return finalizeResult({
    result_version: RELEASE_POSTMERGE_OBSERVER_RESULT_VERSION,
    observer_version: RELEASE_POSTMERGE_OBSERVER_NOTES_VERSION,
    scope,
    observer_id: observerId,
    status,
    decision: status === "blocked_private_or_raw_payload" ? "blocked" : "rejected",
    as_of: asOf,
    notes: [],
    missing_note_refs: [],
    blocking_note_refs: [],
    warnings: ["Release postmerge observer notes input was blocked."],
    actual_postmerge_observed: false,
    merge_executed: false,
    release_frozen: false,
    release_executed: false,
    release_artifact_created: false,
    release_notes_published: false,
    release_authority_granted: false,
    release_candidate_approved: false,
    product_write_executed: false,
    product_id_allocated: false,
    product_write_authority_granted: false,
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createReleasePostmergeObserverAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<
  ReleasePostmergeObserverStatus,
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
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [];
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
  input: ReleasePostmergeObserverInput,
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [];
  if (input.release_candidate_freeze_manifest_refs.length > 0) {
    reasonCodes.push("release_candidate_freeze_manifest_ref_present");
  } else {
    reasonCodes.push(
      "release_candidate_freeze_manifest_ref_missing",
      "operator_review_required",
    );
  }
  if (input.release_operator_checklist_refs.length > 0) {
    reasonCodes.push("release_operator_checklist_ref_present");
  } else {
    reasonCodes.push("release_operator_checklist_ref_missing", "operator_review_required");
  }
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
  input: ReleasePostmergeObserverInput,
): boolean {
  return (
    input.release_candidate_freeze_manifest_refs.length === 0 ||
    input.release_operator_checklist_refs.length === 0 ||
    input.release_notes_summary_refs.length === 0 ||
    input.release_candidate_operator_refs.length === 0 ||
    input.release_readiness_refs.length === 0
  );
}

function reasonCodesForNote(
  note: ReleasePostmergeObserverInputNote,
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [
    "observer_notes_are_candidate_only",
    "observer_notes_are_review_only",
    "observer_notes_do_not_grant_authority",
    "observer_notes_not_actual_postmerge_observation",
    "source_refs_are_lineage_not_proof",
    "observer_note_present",
  ];
  reasonCodes.push(...presentRefReasonCodesForNoteRefs(note), ...noteKindReasonCodes(note.note_kind));
  if (!note.included) {
    reasonCodes.push("operator_review_required");
    if (note.severity === "blocking" || note.severity === "critical") {
      reasonCodes.push("blocking_note_present");
    }
  }
  return uniqueSorted(reasonCodes);
}

function presentRefReasonCodesForNoteRefs(
  note: ReleasePostmergeObserverInputNote,
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [];
  if (note.release_candidate_freeze_manifest_refs.length > 0) {
    reasonCodes.push(
      "release_candidate_freeze_manifest_ref_present",
      "freeze_manifest_is_candidate_only",
    );
  }
  if (note.release_operator_checklist_refs.length > 0) {
    reasonCodes.push(
      "release_operator_checklist_ref_present",
      "release_operator_checklist_is_candidate_only",
    );
  }
  if (note.release_notes_summary_refs.length > 0) {
    reasonCodes.push("release_notes_summary_ref_present");
  }
  if (note.release_candidate_operator_refs.length > 0) {
    reasonCodes.push("release_candidate_operator_ref_present");
  }
  if (note.release_readiness_refs.length > 0) {
    reasonCodes.push("release_readiness_ref_present");
  }
  if (note.disabled_harness_refs.length > 0) {
    reasonCodes.push("disabled_harness_ref_present", "disabled_harness_is_not_reentry_approval");
  }
  if (note.product_write_reentry_refs.length > 0) {
    reasonCodes.push("product_write_reentry_ref_present");
  }
  if (note.git_ledger_refs.length > 0) {
    reasonCodes.push(
      "git_ledger_contract_ref_present",
      "git_ledger_packet_is_not_commit",
      "git_ledger_packet_is_not_product_write",
    );
  }
  if (note.runtime_audit_refs.length > 0) {
    reasonCodes.push("runtime_audit_ref_present", "runtime_audit_is_review_cue_only");
  }
  if (note.dogfooding_refs.length > 0) reasonCodes.push("dogfooding_ref_present");
  if (note.feedback_refs.length > 0) reasonCodes.push("feedback_ref_present");
  if (note.verification_refs.length > 0) {
    reasonCodes.push("verification_ref_present", "smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  return reasonCodes;
}

function noteKindReasonCodes(
  noteKind: ReleasePostmergeObserverNoteKind,
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [];
  if (noteKind === "freeze_manifest") {
    reasonCodes.push("freeze_manifest_is_candidate_only");
  }
  if (noteKind === "release_operator_checklist") {
    reasonCodes.push("release_operator_checklist_is_candidate_only");
  }
  if (noteKind === "release_notes_summary") {
    reasonCodes.push("release_notes_summary_is_candidate_only");
  }
  if (noteKind === "merge_boundary") {
    reasonCodes.push(
      "observer_notes_not_actual_postmerge_observation",
      "merge_not_executed",
      "git_not_executed",
      "github_api_not_called",
      "repository_file_not_written",
    );
  }
  if (noteKind === "release_boundary") {
    reasonCodes.push(
      "release_notes_not_published",
      "release_not_executed",
      "release_artifact_not_created",
      "release_authority_not_granted",
      "release_candidate_not_approved",
    );
  }
  if (noteKind === "product_write_boundary") {
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
  if (noteKind === "verification") {
    reasonCodes.push("smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  return uniqueSorted(reasonCodes);
}

function missingRequiredNoteRefs(notes: ReleasePostmergeObserverNote[]): string[] {
  const presentKinds = new Set(notes.map((note) => note.note_kind));
  return requiredReleasePostmergeObserverNoteKindsV01
    .filter((kind) => !presentKinds.has(kind))
    .map((kind) => `release-postmerge-observer-note:missing:${kind}`)
    .sort();
}

function missingRequiredNoteReasonCodes(
  notes: ReleasePostmergeObserverNote[],
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [];
  if (missingRequiredNoteRefs(notes).length > 0) {
    reasonCodes.push(
      "observer_note_missing",
      "mandatory_observer_note_missing",
      "operator_review_required",
    );
  }
  return uniqueSorted(reasonCodes);
}

function blockingRefsForNotes(
  notes: ReleasePostmergeObserverNote[],
  missingNoteRefs: string[],
): string[] {
  const unincludedBlockingRefs = notes
    .filter(
      (note) =>
        !note.included &&
        (note.severity === "blocking" || note.severity === "critical"),
    )
    .map((note) => note.note_id);
  return uniqueSorted([...missingNoteRefs, ...unincludedBlockingRefs]);
}

function decideManifest(
  notes: ReleasePostmergeObserverNote[],
  missingNoteRefs: string[],
  blockingNoteRefs: string[],
  hasTopLevelOperatorReviewGap: boolean,
): ReleasePostmergeObserverDecision {
  if (notes.some((note) => note.note_kind === "unknown")) return "rejected";
  if (missingNoteRefs.length > 0 || blockingNoteRefs.length > 0) return "blocked";
  if (hasTopLevelOperatorReviewGap) return "needs_operator_review";
  if (notes.some((note) => !note.included)) return "needs_operator_review";
  return "observer_notes_candidate_only";
}

function reasonCodesForDecision(
  decision: ReleasePostmergeObserverDecision,
): ReleasePostmergeObserverReasonCode[] {
  const reasonCodes: ReleasePostmergeObserverReasonCode[] = [
    "observer_notes_are_candidate_only",
    "observer_notes_are_review_only",
    "observer_notes_do_not_grant_authority",
    "observer_notes_not_actual_postmerge_observation",
    "merge_not_executed",
    "git_not_executed",
    "github_api_not_called",
    "repository_file_not_written",
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
  if (decision === "blocked") reasonCodes.push("blocking_note_present");
  return uniqueSorted(reasonCodes);
}

function defaultBoundaryReasonCodes(): ReleasePostmergeObserverReasonCode[] {
  return [
    "observer_notes_are_candidate_only",
    "observer_notes_are_review_only",
    "observer_notes_are_not_truth",
    "observer_notes_are_not_proof",
    "observer_notes_do_not_grant_authority",
    "observer_notes_not_actual_postmerge_observation",
    "merge_not_executed",
    "git_not_executed",
    "github_api_not_called",
    "repository_file_not_written",
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
    "release_operator_checklist_is_candidate_only",
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
  ];
}

function warningsForDecision(decision: ReleasePostmergeObserverDecision): string[] {
  if (decision === "blocked") {
    return ["Release postmerge observer notes is blocked by missing or blocking notes."];
  }
  if (decision === "needs_operator_review") {
    return ["Release postmerge observer notes still needs future operator review."];
  }
  if (decision === "observer_notes_candidate_only") {
    return ["Observer notes candidate only; no release approval or authority is granted."];
  }
  return ["Release postmerge observer notes was rejected."];
}

function dedupeNotes(
  notes: ReleasePostmergeObserverInputNote[],
): ReleasePostmergeObserverInputNote[] {
  const sorted = notes.slice().sort((left, right) => {
    const kindCompare = left.note_kind.localeCompare(right.note_kind);
    if (kindCompare !== 0) return kindCompare;
    const severityCompare = left.severity.localeCompare(right.severity);
    if (severityCompare !== 0) return severityCompare;
    return left.note_id.localeCompare(right.note_id);
  });
  const seen = new Set<string>();
  const unique: ReleasePostmergeObserverInputNote[] = [];
  for (const note of sorted) {
    if (seen.has(note.note_id)) continue;
    seen.add(note.note_id);
    unique.push(note);
  }
  return unique;
}

function duplicateNoteIdFailureCodes(notes: unknown[]): string[] {
  const seen = new Set<string>();
  for (const note of notes) {
    if (!isRecord(note) || typeof note.note_id !== "string") continue;
    if (seen.has(note.note_id)) return ["duplicate_note_id"];
    seen.add(note.note_id);
  }
  return [];
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (
      !ReleasePostmergeObserverReasonCodes.includes(
        code as ReleasePostmergeObserverReasonCode,
      )
    ) {
      failures.push(`${field}_unknown_reason_code`);
    }
  }
  return failures;
}

function validateStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field}_invalid_array`];
  return value.flatMap((note, index) => validateSafeString(note, `${field}_${index}`));
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
    return value.flatMap((note, index) =>
      collectUnsafeObjectFailures(note, `${label}_${index}`),
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
    return value.flatMap((note, index) =>
      collectPublicUnsafeFailures(note, `${label}_${index}`),
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
    return value.flatMap((note, index) =>
      collectForbiddenAuthorityObjectFailures(note, `${label}_${index}`),
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
    return `[${value.map((note) => canonicalJson(note)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
