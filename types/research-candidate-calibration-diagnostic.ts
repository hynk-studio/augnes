// Type-only contract for Research Candidate Calibration Diagnostic v0.1.
// This diagnostic is explanation-only: not truth, not proof/evidence, not
// Perspective promotion, not durable state, not execution authority, and not
// product write.

export type ResearchCandidateCalibrationDiagnosticVersion =
  "research_candidate_calibration_diagnostic.v0.1";

export type ResearchCandidateCalibrationDiagnosticScope = "project:augnes";

export type ResearchCandidateCalibrationDiagnosticStatus = "diagnostic_only";

export type ResearchCandidateCalibrationCandidateFamily =
  | "claim"
  | "evidence"
  | "tension"
  | "knowledge_gap"
  | "perspective_delta"
  | "follow_up_work";

export type ResearchCandidateCalibrationReadinessLabel =
  | "not_ready"
  | "weak_ready"
  | "ready_with_tensions"
  | "ready"
  | "blocked";

export type ResearchCandidateCalibrationReasonCode =
  | "source_ref_missing"
  | "source_ref_present"
  | "source_coverage_boundary_present"
  | "evidence_missing"
  | "evidence_present"
  | "contradiction_present"
  | "unresolved_tension_present"
  | "knowledge_gap_present"
  | "locator_missing"
  | "locator_present"
  | "lifecycle_blocked"
  | "lifecycle_invalidated"
  | "lifecycle_operator_corrected"
  | "lifecycle_operator_pinned"
  | "lifecycle_operator_dismissed"
  | "operator_invalidation_present"
  | "operator_correction_present"
  | "operator_pin_present"
  | "operator_dismissal_present"
  | "readiness_overclaim_risk"
  | "ready_with_unresolved_tensions"
  | "diagnostic_only_not_promotion";

export type ResearchCandidateCalibrationRiskFlag =
  | "stale_context"
  | "overclaim_risk"
  | "missing_source_ref"
  | "missing_evidence"
  | "missing_locator"
  | "operator_invalidated"
  | "contradiction_or_tension"
  | "knowledge_gap_open";

export interface ResearchCandidateCalibrationAuthorityBoundary {
  diagnostic_only: true;
  empirical_calibration_model: false;
  confidence_is_truth: false;
  readiness_is_promotion: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  provider_openai_authority: false;
  source_fetch_authority: false;
  retrieval_rag_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface ResearchCandidateCalibrationDiagnostic {
  diagnostic_version: ResearchCandidateCalibrationDiagnosticVersion;
  scope: ResearchCandidateCalibrationDiagnosticScope;
  status: ResearchCandidateCalibrationDiagnosticStatus;
  as_of: string;
  candidate_id: string;
  candidate_family: ResearchCandidateCalibrationCandidateFamily;
  source_refs: string[];
  source_coverage_boundary_note?: string;
  current_review_status: string;
  current_epistemic_status?: string;
  lifecycle_status?: string;
  lifecycle_next_review_action?: string;
  support_count: number;
  contradiction_count: number;
  unresolved_tension_count: number;
  knowledge_gap_count: number;
  source_ref_coverage_ratio: number;
  missing_locator_count: number;
  feedback_signal_counts: {
    dismiss_preview: number;
    pin_preview: number;
    correct_preview: number;
    invalidate_preview: number;
  };
  risk_flags: ResearchCandidateCalibrationRiskFlag[];
  readiness_label: ResearchCandidateCalibrationReadinessLabel;
  readiness_reason_codes: ResearchCandidateCalibrationReasonCode[];
  diagnostic_summary: string;
  authority_boundary: ResearchCandidateCalibrationAuthorityBoundary;
}

export interface ResearchCandidateCalibrationDiagnosticReport {
  diagnostic_version: ResearchCandidateCalibrationDiagnosticVersion;
  scope: ResearchCandidateCalibrationDiagnosticScope;
  status: ResearchCandidateCalibrationDiagnosticStatus;
  as_of: string;
  source_fixture_refs: string[];
  diagnostics: ResearchCandidateCalibrationDiagnostic[];
  readiness_counts: Record<ResearchCandidateCalibrationReadinessLabel, number>;
  risk_flag_counts: Record<ResearchCandidateCalibrationRiskFlag, number>;
  diagnostic_queue: {
    blocked: string[];
    overclaim_risk: string[];
    missing_source: string[];
    unresolved_tensions: string[];
    ready_with_tensions: string[];
  };
  boundary_notes: string[];
  diagnostic_fingerprint: string;
  authority_boundary: ResearchCandidateCalibrationAuthorityBoundary;
}

export interface ResearchCandidateCalibrationValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface ResearchCandidateCalibrationFeedbackEvent {
  event_id: string;
  event_type:
    | "dismiss_preview"
    | "pin_preview"
    | "correct_preview"
    | "invalidate_preview"
    | string;
  target_kind?: string;
  target_id: string;
  source_ref_ids?: string[];
  created_at?: string;
}

export interface ResearchCandidateCalibrationCandidateReviewInput {
  claim_candidates?: unknown[];
  evidence_candidates?: unknown[];
  tension_candidates?: unknown[];
  knowledge_gap_candidates?: unknown[];
  perspective_delta_candidates?: unknown[];
  follow_up_work_candidates?: unknown[];
}

export interface ResearchCandidateCalibrationDiagnosticBuilderInput {
  scope: ResearchCandidateCalibrationDiagnosticScope;
  as_of: string;
  source_fixture_refs: string[];
  candidate_review: ResearchCandidateCalibrationCandidateReviewInput;
  lifecycle_read_model?: {
    candidate_summaries?: unknown[];
  };
  feedback_events?: ResearchCandidateCalibrationFeedbackEvent[];
}
