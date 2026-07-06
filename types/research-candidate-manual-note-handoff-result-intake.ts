// Type-only, candidate-only preview contract for locally parsing a pasted Codex
// result report that came back from a manual Research Candidate handoff seed.
// This is not durable intake, proof/evidence, work closure, Perspective
// promotion, provider execution, GitHub automation, or Codex execution.

import type { ResearchCandidateManualNoteHandoffSeed } from "@/types/research-candidate-manual-note-handoff-seed";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export type ResearchCandidateManualNoteHandoffResultIntakeKind =
  "research_candidate_manual_note_handoff_result_intake";

export type ResearchCandidateManualNoteHandoffResultIntakeVersion =
  "research_candidate_manual_note_handoff_result_intake.v0.1";

export type ResearchCandidateManualNoteHandoffResultIntakeRecommendationStatus =
  | "ready_for_operator_review"
  | "blocked_missing_result_report"
  | "blocked_missing_required_return_fields";

export type ResearchCandidateManualNoteExpectedObservedDeltaDraftStatus =
  | "ready_for_operator_review"
  | "blocked_missing_observed_outcome"
  | "blocked_missing_expected_observed_delta"
  | "blocked_missing_result_report";

export type ResearchCandidateManualNoteReuseOutcomeLabel =
  | "helpful"
  | "stale"
  | "missing"
  | "noisy"
  | "misleading"
  | "not_reported";

export interface ResearchCandidateManualNoteHandoffResultIntakeSourceMetadata {
  result_source?: "local_paste" | "sample_smoke" | string;
  pasted_at?: string | null;
  operator_note?: string | null;
}

export interface ResearchCandidateManualNoteHandoffResultIntakeInput {
  handoff_seed: ResearchCandidateManualNoteHandoffSeed;
  codex_result_report_text: string;
  source_metadata?: ResearchCandidateManualNoteHandoffResultIntakeSourceMetadata;
}

export interface ResearchCandidateManualNoteParsedResultSummary {
  result_status: string | null;
  pr_url: string | null;
  pr_number: number | null;
  observed_outcome: string | null;
  live_host_observation: string | null;
  proof_evidence_rows_written: boolean | null;
  event_rows_created_or_mutated: boolean | null;
  work_status_changed: boolean | null;
  state_committed_or_rejected: boolean | null;
  expected_vs_observed_delta_summary: string | null;
  selected_candidate_context_outcome: ResearchCandidateManualNoteReuseOutcomeLabel;
  ambiguous_combined_section_lines: string[];
}

export interface ResearchCandidateManualNoteVerificationItem {
  item_text: string;
  command: string | null;
  status: "passed" | "failed" | "skipped" | "reported";
}

export interface ResearchCandidateManualNoteExpectedReturnFieldCoverage {
  field: string;
  present: boolean;
  evidence: string[];
}

export interface ResearchCandidateManualNoteAuthorityBoundaryFindings {
  boundary_statement_present: boolean;
  pr_url_reported: boolean;
  pr_url_is_not_requirement_completion: true;
  verification_is_not_proof_or_evidence: true;
  forbidden_side_effect_claims: string[];
}

export interface ResearchCandidateManualNoteExpectedObservedDeltaDraft {
  draft_kind: "research_candidate_manual_note_expected_observed_delta_draft";
  expected_summary: string;
  observed_summary: string | null;
  mismatch_or_gap_summary: string;
  status: ResearchCandidateManualNoteExpectedObservedDeltaDraftStatus;
  draft_only: true;
  source_of_truth: false;
  creates_record: false;
  creates_proof_or_evidence: false;
  approves_or_commits_state: false;
}

export interface ResearchCandidateManualNoteReuseOutcomeDraft {
  draft_kind: "research_candidate_manual_note_reuse_outcome_draft";
  selected_candidate_context_refs: string[];
  outcome_label: ResearchCandidateManualNoteReuseOutcomeLabel;
  source_line: string | null;
  warning_reasons: string[];
  draft_only: true;
  source_of_truth: false;
  writes_ledger: false;
  updates_salience: false;
  activates_perspective: false;
}

export interface ResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary {
  candidate_only: true;
  preview_only: true;
  local_parse_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_commit_or_reject_state: false;
  can_promote_perspective: false;
  can_create_work_item: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_send_external_handoff: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualNoteHandoffResultIntakeValidation {
  passed: boolean;
  failure_codes: string[];
  result_report_present: boolean;
  deterministic_browser_safe: true;
  raw_result_text_retained: false;
  authority_boundary_safe: boolean;
  required_return_fields_present: boolean;
}

export interface ResearchCandidateManualNoteHandoffResultIntake {
  intake_kind: ResearchCandidateManualNoteHandoffResultIntakeKind;
  intake_version: ResearchCandidateManualNoteHandoffResultIntakeVersion;
  scope: ResearchCandidateReviewScope;
  source_handoff_seed_fingerprint: string;
  source_handoff_seed_ref: string;
  source_preview_session_id: string;
  source_refs: string[];
  result_text_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_text_v0_1";
  source_metadata: ResearchCandidateManualNoteHandoffResultIntakeSourceMetadata;
  parsed_result_summary: ResearchCandidateManualNoteParsedResultSummary;
  changed_files: string[];
  verification_items: ResearchCandidateManualNoteVerificationItem[];
  skipped_checks: string[];
  remaining_friction: string[];
  authority_boundary_findings: ResearchCandidateManualNoteAuthorityBoundaryFindings;
  expected_return_field_coverage: ResearchCandidateManualNoteExpectedReturnFieldCoverage[];
  expected_observed_delta_draft: ResearchCandidateManualNoteExpectedObservedDeltaDraft;
  reuse_outcome_draft: ResearchCandidateManualNoteReuseOutcomeDraft;
  missing_required_return_fields: string[];
  warning_reasons: string[];
  stop_conditions: string[];
  authority_boundary: ResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary;
  validation: ResearchCandidateManualNoteHandoffResultIntakeValidation;
  recommendation_status: ResearchCandidateManualNoteHandoffResultIntakeRecommendationStatus;
  next_recommended_slice: "manual_research_candidate_handoff_result_intake_operator_review_v0_1";
}
