// Type-only contract for Temporal Handoff Diagnostic Sections v0.1.
// This contract is diagnostic-preview-only: not execution approval, not Codex
// execution, not GitHub automation, not proof/evidence, not Perspective
// promotion, not durable state, not work mutation, and not product write.

export type TemporalHandoffDiagnosticSectionsVersion =
  "temporal_handoff_diagnostic_sections.v0.1";

export type TemporalHandoffDiagnosticReportVersion =
  "temporal_handoff_diagnostic_report.v0.1";

export type TemporalHandoffDiagnosticSectionsScope = "project:augnes";

export type TemporalHandoffDiagnosticSectionsStatus = "diagnostic_preview_only";

export type TemporalHandoffTargetKind =
  | "ai_context_packet"
  | "codex_handoff_draft"
  | "human_review_packet"
  | "dogfooding_review_packet"
  | "unknown";

export type ExpectedObservedDeltaKind =
  | "none"
  | "omission"
  | "unexpected_change"
  | "factual_mismatch"
  | "sequence_mismatch"
  | "action_effect_mismatch"
  | "scope_mismatch"
  | "user_preference_shift"
  | "repo_state_shift"
  | "validation_mismatch"
  | "authority_boundary_mismatch";

export type DecisionHoldMode =
  | "none"
  | "reactive_repair"
  | "anticipatory_stop"
  | "bounded_continue"
  | "operator_decision_required";

export type NotDoneClassification =
  | "not_started"
  | "partial"
  | "blocked"
  | "out_of_scope"
  | "needs_review"
  | "complete"
  | "unknown";

export type TemporalHandoffDiagnosticReasonCode =
  | "expected_files_present"
  | "expected_files_missing"
  | "observed_files_present"
  | "observed_files_missing"
  | "expected_checks_present"
  | "expected_checks_missing"
  | "observed_checks_present"
  | "observed_checks_missing"
  | "expected_observed_match"
  | "expected_observed_mismatch"
  | "source_refs_present"
  | "source_refs_missing"
  | "unresolved_tension_present"
  | "knowledge_gap_present"
  | "decision_hold_present"
  | "not_done_classified"
  | "authority_boundary_preserved"
  | "diagnostic_preview_not_execution";

export interface TemporalHandoffDiagnosticAuthorityBoundary {
  diagnostic_preview_only: true;
  execution_approval: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  branch_pr_creation_authority: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  provider_openai_authority: false;
  source_fetch_authority: false;
  retrieval_rag_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface TemporalExpectedObservedDeltaPreview {
  delta_id: string;
  delta_kind: ExpectedObservedDeltaKind;
  expected_refs: string[];
  observed_refs: string[];
  missing_expected_refs: string[];
  unexpected_observed_refs: string[];
  source_refs: string[];
  reliability_preview: "low" | "medium" | "high";
  review_note: string;
}

export interface TemporalDecisionHoldTracePreview {
  hold_id: string;
  hold_mode: DecisionHoldMode;
  trigger_refs: string[];
  source_refs: string[];
  why_now: string;
  review_cue: string;
}

export interface TemporalNotDonePreview {
  classification: NotDoneClassification;
  reason: string;
  expected_remaining_refs: string[];
  blocking_refs: string[];
}

export interface TemporalHandoffDiagnosticSections {
  sections_version: TemporalHandoffDiagnosticSectionsVersion;
  scope: TemporalHandoffDiagnosticSectionsScope;
  status: TemporalHandoffDiagnosticSectionsStatus;
  as_of: string;
  target_kind: TemporalHandoffTargetKind;
  target_ref: string;
  source_fixture_refs: string[];
  expected_files: string[];
  observed_files: string[];
  expected_checks: string[];
  observed_checks: string[];
  source_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  review_cue_refs: string[];
  expected_observed_deltas: TemporalExpectedObservedDeltaPreview[];
  decision_hold_traces: TemporalDecisionHoldTracePreview[];
  not_done: TemporalNotDonePreview;
  reason_codes: TemporalHandoffDiagnosticReasonCode[];
  authority_boundary: TemporalHandoffDiagnosticAuthorityBoundary;
}

export interface TemporalHandoffDiagnosticReport {
  report_version: TemporalHandoffDiagnosticReportVersion;
  scope: TemporalHandoffDiagnosticSectionsScope;
  status: TemporalHandoffDiagnosticSectionsStatus;
  as_of: string;
  sections: TemporalHandoffDiagnosticSections[];
  target_counts: Record<TemporalHandoffTargetKind, number>;
  delta_counts: Record<ExpectedObservedDeltaKind, number>;
  hold_mode_counts: Record<DecisionHoldMode, number>;
  not_done_counts: Record<NotDoneClassification, number>;
  boundary_notes: string[];
  report_fingerprint: string;
  authority_boundary: TemporalHandoffDiagnosticAuthorityBoundary;
}

export interface TemporalHandoffDiagnosticValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface TemporalHandoffPreviewInput {
  target_kind: TemporalHandoffTargetKind | string;
  target_ref: string;
  expected_files?: string[];
  observed_files?: string[];
  expected_checks?: string[];
  observed_checks?: string[];
  source_refs?: string[];
  unresolved_tension_refs?: string[];
  knowledge_gap_refs?: string[];
  review_cue_refs?: string[];
  status_hint?: string;
  operator_note?: string;
  authority_boundary_notes?: string[];
}

export interface TemporalHandoffDiagnosticBuilderInput {
  scope: TemporalHandoffDiagnosticSectionsScope;
  as_of: string;
  source_fixture_refs: string[];
  handoff_previews: TemporalHandoffPreviewInput[];
}
