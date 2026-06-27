// Contract-only Empirical Calibration Dataset v0.1 shape.
// This file defines offline diagnostic dataset contracts only. It does not
// execute training, automatic learning, rule/prompt/parser/ranking/surfacing
// mutation, telemetry ingestion, provider calls, retrieval/RAG, DB activity,
// routes/UI, proof/evidence writes, promotion, durable state mutation,
// Formation Receipt writes, Git/GitHub/Codex execution, export/import runtime,
// product-write, or product ID allocation.

export const EmpiricalCalibrationDatasetContractVersion =
  "empirical_calibration_dataset.v0.1" as const;
export const EmpiricalCalibrationDatasetRowVersion =
  "empirical_calibration_dataset_row.v0.1" as const;
export const EmpiricalCalibrationDatasetBundleVersion =
  "empirical_calibration_dataset_bundle.v0.1" as const;
export const EmpiricalCalibrationDatasetValidationFindingVersion =
  "empirical_calibration_dataset_validation_finding.v0.1" as const;
export const EmpiricalCalibrationDatasetScope = "project:augnes" as const;

export const EmpiricalCalibrationDatasetStatuses = [
  "contract_only",
  "fixture_only",
  "offline_diagnostic_only",
  "ready_for_future_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type EmpiricalCalibrationDatasetStatus =
  (typeof EmpiricalCalibrationDatasetStatuses)[number];

export const EmpiricalCalibrationCandidateFamilies = [
  "manual_note_candidate",
  "provider_extraction_candidate",
  "retrieval_context_candidate",
  "feedback_to_rule_candidate",
  "codex_result_candidate",
  "temporal_handoff_candidate",
  "crpf_variant_candidate",
  "unknown",
] as const;
export type EmpiricalCalibrationCandidateFamily =
  (typeof EmpiricalCalibrationCandidateFamilies)[number];

export const EmpiricalCalibrationReadinessLabels = [
  "low",
  "medium",
  "high",
  "needs_operator_review",
  "blocked",
  "unknown",
] as const;
export type EmpiricalCalibrationReadinessLabel =
  (typeof EmpiricalCalibrationReadinessLabels)[number];

export const EmpiricalCalibrationHandoffOutcomes = [
  "improved_missing_file_detection",
  "improved_missing_check_detection",
  "preserved_unresolved_tension",
  "reduced_overclaim",
  "no_observed_change",
  "worsened_handoff_quality",
  "inconclusive",
  "not_used",
] as const;
export type EmpiricalCalibrationHandoffOutcome =
  (typeof EmpiricalCalibrationHandoffOutcomes)[number];

export const EmpiricalCalibrationCodexReviewOutcomes = [
  "accepted_as_review_cue",
  "requested_changes",
  "rejected_as_overclaim",
  "missing_validation",
  "missing_expected_files",
  "authority_boundary_issue",
  "privacy_boundary_issue",
  "inconclusive",
] as const;
export type EmpiricalCalibrationCodexReviewOutcome =
  (typeof EmpiricalCalibrationCodexReviewOutcomes)[number];

export const EmpiricalCalibrationNotDoneClassifications = [
  "correctly_preserved",
  "incorrectly_claimed_done",
  "missing_from_report",
  "ambiguous",
  "not_applicable",
] as const;
export type EmpiricalCalibrationNotDoneClassification =
  (typeof EmpiricalCalibrationNotDoneClassifications)[number];

export const EmpiricalCalibrationLaterReviewOutcomes = [
  "later_confirmed_useful",
  "later_corrected",
  "later_rejected",
  "later_superseded",
  "later_deferred",
  "later_needs_more_evidence",
  "unknown",
] as const;
export type EmpiricalCalibrationLaterReviewOutcome =
  (typeof EmpiricalCalibrationLaterReviewOutcomes)[number];

export const EmpiricalCalibrationReasonCodes = [
  "empirical_calibration_dataset_only",
  "offline_diagnostic_only",
  "calibration_training_disabled_by_default",
  "training_not_executed",
  "learning_not_executed",
  "rule_mutation_not_executed",
  "feedback_not_truth",
  "readiness_label_not_truth",
  "diagnostic_reason_code_not_truth",
  "validation_pass_not_truth",
  "validation_failure_not_rejection",
  "codex_result_not_proof",
  "handoff_outcome_not_approval",
  "later_review_outcome_not_truth",
  "candidate_not_fact",
  "candidate_not_proof",
  "candidate_not_accepted_evidence",
  "source_refs_required",
  "privacy_guard_required",
  "temporal_handoff_experiment_ref_present",
  "deterministic_crpf_variant_ref_present",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "db_write_not_executed",
  "telemetry_not_ingested",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "codex_not_executed",
  "git_github_not_executed",
  "local_export_not_executed",
  "product_id_allocation_not_executed",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
] as const;
export type EmpiricalCalibrationReasonCode =
  (typeof EmpiricalCalibrationReasonCodes)[number];

export interface EmpiricalCalibrationAuthorityBoundary {
  empirical_calibration_dataset_contract_now: true;
  contract_only: true;
  fixture_only: true;
  offline_diagnostic_only: true;
  calibration_training_allowed_default_false: true;
  caller_provided_fixture_only: true;
  training_runtime_now: false;
  automatic_learning_now: false;
  rule_mutation_now: false;
  prompt_mutation_now: false;
  parser_mutation_now: false;
  ranking_mutation_now: false;
  surfacing_mutation_now: false;
  telemetry_ingestion_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  product_write_authority: false;
  readiness_label_is_truth: false;
  diagnostic_reason_code_is_truth: false;
  validation_pass_is_truth: false;
  validation_failure_is_rejection: false;
  codex_result_is_proof: false;
  handoff_outcome_is_approval: false;
  later_review_outcome_is_truth: false;
  dataset_row_is_training_data: false;
  dataset_row_is_proof: false;
  dataset_row_is_accepted_evidence: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface EmpiricalCalibrationDatasetRow {
  row_version: typeof EmpiricalCalibrationDatasetRowVersion;
  dataset_version: typeof EmpiricalCalibrationDatasetContractVersion;
  scope: typeof EmpiricalCalibrationDatasetScope;
  row_id: string;
  candidate_ref: string;
  candidate_family: EmpiricalCalibrationCandidateFamily;
  initial_readiness_label: EmpiricalCalibrationReadinessLabel;
  diagnostic_reason_codes: EmpiricalCalibrationReasonCode[];
  lifecycle_status_ref: string;
  feedback_event_refs: string[];
  handoff_used: boolean;
  handoff_profile_ref: string;
  handoff_outcome: EmpiricalCalibrationHandoffOutcome;
  codex_result_report_ref: string;
  codex_review_outcome: EmpiricalCalibrationCodexReviewOutcome;
  not_done_classification: EmpiricalCalibrationNotDoneClassification;
  validation_command_refs: string[];
  validation_skipped_refs: string[];
  validation_warning_refs: string[];
  validation_failure_refs: string[];
  validation_pass_refs: string[];
  later_review_outcome: EmpiricalCalibrationLaterReviewOutcome;
  later_review_reason_codes: EmpiricalCalibrationReasonCode[];
  expected_observed_delta_refs: string[];
  temporal_handoff_experiment_refs: string[];
  deterministic_crpf_variant_refs: string[];
  source_refs: string[];
  privacy_report: {
    status: "passed" | "redacted_with_warnings" | "reference_only";
    report_ref: string;
    original_value_included: false;
  };
  calibration_training_allowed: false;
  boundary_notes: string[];
  reason_codes: EmpiricalCalibrationReasonCode[];
  authority_boundary: EmpiricalCalibrationAuthorityBoundary;
}

export interface EmpiricalCalibrationDatasetBundle {
  bundle_version: typeof EmpiricalCalibrationDatasetBundleVersion;
  contract_version: typeof EmpiricalCalibrationDatasetContractVersion;
  row_version: typeof EmpiricalCalibrationDatasetRowVersion;
  scope: typeof EmpiricalCalibrationDatasetScope;
  status: EmpiricalCalibrationDatasetStatus;
  dataset_id: string;
  dataset_title: string;
  created_by_ref: string;
  created_at_ref: string;
  rows: EmpiricalCalibrationDatasetRow[];
  row_count: number;
  candidate_families_covered: EmpiricalCalibrationCandidateFamily[];
  calibration_training_allowed_default: false;
  dataset_fingerprint: string;
  boundary_notes: string[];
  reason_codes: EmpiricalCalibrationReasonCode[];
  authority_boundary: EmpiricalCalibrationAuthorityBoundary;
}

export interface EmpiricalCalibrationValidationFinding {
  finding_version: typeof EmpiricalCalibrationDatasetValidationFindingVersion;
  scope: typeof EmpiricalCalibrationDatasetScope;
  finding_id: string;
  path: string;
  finding_kind:
    | "private_or_raw_payload"
    | "forbidden_authority"
    | "training_enabled"
    | "invalid_fixture"
    | "missing_source_refs";
  severity: "info" | "warning" | "critical";
  action: "blocked" | "reference_only" | "allowed";
  reason_codes: EmpiricalCalibrationReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}
