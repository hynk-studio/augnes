import type {
  CandidateIngressNormalizedCandidate,
  CandidateIngressSourceKind,
} from "./candidate-ingress-normalizer";

export const CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION =
  "codex_result_report_intake_preview.v0.1" as const;

export interface CodexResultReportIntakePreviewInput {
  result_report?: unknown;
  raw_text?: string;
  source_ref?: string;
  operator_ref?: string;
  work_ref?: string;
  result_ref?: string;
  pr_ref?: string;
  commit_ref?: string;
  project_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type CodexResultReportIntakePreviewStatus =
  | "no_result_report"
  | "insufficient_data"
  | "malformed"
  | "unsafe"
  | "candidate_material_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type CodexResultReportIntakeRecommendedNextAction =
  | "supply_codex_result_report"
  | "supply_source_ref"
  | "supply_operator_ref"
  | "supply_work_or_result_ref"
  | "supply_evidence_refs"
  | "resolve_unsafe_refs"
  | "review_codex_result_candidates"
  | "prepare_codex_result_report_candidate_ingest"
  | "keep_preview_only"
  | "reject_codex_result_candidate";

export interface CodexResultReportIntakeInputSummary {
  has_result_report: boolean;
  has_raw_text: boolean;
  source_ref_supplied: boolean;
  operator_ref_supplied: boolean;
  work_ref_supplied: boolean;
  result_ref_supplied: boolean;
  pr_ref_supplied: boolean;
  commit_ref_supplied: boolean;
  project_ref_supplied: boolean;
  raw_text_length: number;
  raw_text_line_count: number;
  candidate_count: number;
  ingestable_candidate_count: number;
  source_ref_count: number;
  evidence_ref_count: number;
  unsafe_ref_count: number;
  missing_reason_count: number;
  blocked_reason_count: number;
}

export interface CodexResultReportIntakeSourceStatus {
  result_report: "supplied" | "missing" | "malformed";
  raw_text: "supplied" | "missing" | "too_large" | "unsafe";
  source_kind: "known";
  source_ref: "supplied" | "missing" | "unsafe";
  operator_ref: "supplied" | "missing" | "unsafe";
  work_ref: "supplied" | "missing" | "unsafe";
  result_ref: "supplied" | "missing" | "unsafe";
  pr_ref: "supplied" | "missing" | "unsafe";
  commit_ref: "supplied" | "missing" | "unsafe";
  project_ref: "supplied" | "missing" | "unsafe";
  authority_boundary: "valid_read_only" | "invalid" | "missing";
}

export interface CodexResultReportCandidateMaterial {
  result_summary_candidates: CandidateIngressNormalizedCandidate[];
  changed_file_candidates: CandidateIngressNormalizedCandidate[];
  check_result_candidates: CandidateIngressNormalizedCandidate[];
  skipped_check_candidates: CandidateIngressNormalizedCandidate[];
  not_done_candidates: CandidateIngressNormalizedCandidate[];
  requirement_progress_candidates: CandidateIngressNormalizedCandidate[];
  expected_observed_signal_candidates: CandidateIngressNormalizedCandidate[];
  context_reuse_signal_candidates: CandidateIngressNormalizedCandidate[];
  risk_or_regression_candidates: CandidateIngressNormalizedCandidate[];
  followup_candidates: CandidateIngressNormalizedCandidate[];
  evidence_ref_candidates: CandidateIngressNormalizedCandidate[];
  source_ref_candidates: CandidateIngressNormalizedCandidate[];
  reusable_context_candidates: CandidateIngressNormalizedCandidate[];
  review_only_candidates: CandidateIngressNormalizedCandidate[];
}

export interface CodexResultReportExtractedPreview {
  heading_lines: string[];
  result_status_lines: string[];
  changed_file_lines: string[];
  check_lines: string[];
  skipped_check_lines: string[];
  not_done_or_followup_lines: string[];
  expected_observed_lines: string[];
  pr_like_refs: string[];
  commit_like_refs: string[];
  explicit_ref_like_tokens: string[];
  possible_dates: string[];
  review_notes: string[];
}

export interface CodexResultReportIntakeReadiness {
  ready_for_operator_review: boolean;
  ready_for_candidate_ingest_record: boolean;
  requires_result_report_or_raw_text: boolean;
  requires_source_ref: boolean;
  requires_operator_ref: boolean;
  requires_work_or_result_ref: boolean;
  requires_candidate_material: boolean;
  requires_evidence_refs: boolean;
  requires_public_safe_refs: boolean;
  requires_privacy_review: boolean;
  requires_no_blockers: boolean;
  current_blockers: string[];
  current_insufficient_data: string[];
  current_unsafe_refs: string[];
  current_missing_evidence: string[];
}

export interface CodexResultReportIntakeEvidenceSummary {
  has_result_report_material: boolean;
  has_candidate_material: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_operator_ref: boolean;
  has_work_or_result_ref: boolean;
  has_unsafe_refs: boolean;
  has_missing_evidence: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  unsafe_refs: string[];
}

export interface CodexResultReportIntakeAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_record: false;
  can_create_ingest_receipt: false;
  can_write_work_episode: false;
  can_write_expected_observed_delta: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_reuse_ledger: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface CodexResultReportIntakePreview {
  preview_version: typeof CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  source_kind: CandidateIngressSourceKind;
  intake_preview_status: CodexResultReportIntakePreviewStatus;
  recommended_next_action: CodexResultReportIntakeRecommendedNextAction;
  input_summary: CodexResultReportIntakeInputSummary;
  source_status: CodexResultReportIntakeSourceStatus;
  candidate_material: CodexResultReportCandidateMaterial;
  extracted_preview: CodexResultReportExtractedPreview;
  readiness: CodexResultReportIntakeReadiness;
  evidence_summary: CodexResultReportIntakeEvidenceSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  unsafe_ref_reasons: string[];
  privacy_review_notes: string[];
  operator_review_checklist: string[];
  would_not_ingest: string[];
  non_goals: string[];
  authority_boundary: CodexResultReportIntakeAuthorityBoundary;
}
