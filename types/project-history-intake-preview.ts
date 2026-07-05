import type {
  CandidateIngressNormalizedCandidate,
  CandidateIngressSourceKind,
} from "./candidate-ingress-normalizer";

export const PROJECT_HISTORY_INTAKE_PREVIEW_VERSION =
  "project_history_intake_preview.v0.1" as const;

export interface ProjectHistoryIntakePreviewInput {
  digest?: unknown;
  raw_text?: string;
  source_ref?: string;
  operator_ref?: string;
  project_ref?: string;
  work_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type ProjectHistoryIntakePreviewStatus =
  | "no_history"
  | "insufficient_data"
  | "malformed"
  | "unsafe"
  | "candidate_material_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type ProjectHistoryIntakeRecommendedNextAction =
  | "supply_project_history_digest"
  | "supply_source_ref"
  | "supply_operator_ref"
  | "supply_project_ref"
  | "resolve_unsafe_refs"
  | "review_project_history_candidates"
  | "prepare_project_history_candidate_ingest"
  | "keep_preview_only"
  | "reject_project_history_candidate";

export interface ProjectHistoryIntakeInputSummary {
  has_digest: boolean;
  has_raw_text: boolean;
  source_ref_supplied: boolean;
  operator_ref_supplied: boolean;
  project_ref_supplied: boolean;
  work_ref_supplied: boolean;
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

export interface ProjectHistoryIntakeSourceStatus {
  digest: "supplied" | "missing" | "malformed";
  raw_text: "supplied" | "missing" | "too_large" | "unsafe";
  source_kind: "known";
  source_ref: "supplied" | "missing" | "unsafe";
  operator_ref: "supplied" | "missing" | "unsafe";
  project_ref: "supplied" | "missing" | "unsafe";
  work_ref: "supplied" | "missing" | "unsafe";
  authority_boundary: "valid_read_only" | "invalid" | "missing";
}

export interface ProjectHistoryCandidateMaterial {
  timeline_event_candidates: CandidateIngressNormalizedCandidate[];
  project_state_summary_candidates: CandidateIngressNormalizedCandidate[];
  decision_candidates: CandidateIngressNormalizedCandidate[];
  requirement_candidates: CandidateIngressNormalizedCandidate[];
  changed_artifact_candidates: CandidateIngressNormalizedCandidate[];
  open_question_candidates: CandidateIngressNormalizedCandidate[];
  risk_or_blocker_candidates: CandidateIngressNormalizedCandidate[];
  next_action_candidates: CandidateIngressNormalizedCandidate[];
  evidence_ref_candidates: CandidateIngressNormalizedCandidate[];
  source_ref_candidates: CandidateIngressNormalizedCandidate[];
  reusable_context_candidates: CandidateIngressNormalizedCandidate[];
  expected_observed_signal_candidates: CandidateIngressNormalizedCandidate[];
  review_only_candidates: CandidateIngressNormalizedCandidate[];
}

export interface ProjectHistoryExtractedPreview {
  heading_lines: string[];
  checklist_lines: string[];
  pr_like_refs: string[];
  commit_like_refs: string[];
  explicit_ref_like_tokens: string[];
  possible_dates: string[];
  next_action_lines: string[];
  risk_or_blocker_lines: string[];
  review_notes: string[];
}

export interface ProjectHistoryIntakeReadiness {
  ready_for_operator_review: boolean;
  ready_for_candidate_ingest_record: boolean;
  requires_digest_or_raw_text: boolean;
  requires_source_ref: boolean;
  requires_operator_ref: boolean;
  requires_project_ref: boolean;
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

export interface ProjectHistoryIntakeEvidenceSummary {
  has_history_material: boolean;
  has_candidate_material: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_operator_ref: boolean;
  has_project_ref: boolean;
  has_unsafe_refs: boolean;
  has_missing_evidence: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  unsafe_refs: string[];
}

export interface ProjectHistoryIntakeAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_record: false;
  can_create_ingest_receipt: false;
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
  can_write_dogfood_metrics: false;
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

export interface ProjectHistoryIntakePreview {
  preview_version: typeof PROJECT_HISTORY_INTAKE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  source_kind: CandidateIngressSourceKind;
  intake_preview_status: ProjectHistoryIntakePreviewStatus;
  recommended_next_action: ProjectHistoryIntakeRecommendedNextAction;
  input_summary: ProjectHistoryIntakeInputSummary;
  source_status: ProjectHistoryIntakeSourceStatus;
  candidate_material: ProjectHistoryCandidateMaterial;
  extracted_preview: ProjectHistoryExtractedPreview;
  readiness: ProjectHistoryIntakeReadiness;
  evidence_summary: ProjectHistoryIntakeEvidenceSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  unsafe_ref_reasons: string[];
  privacy_review_notes: string[];
  operator_review_checklist: string[];
  would_not_ingest: string[];
  non_goals: string[];
  authority_boundary: ProjectHistoryIntakeAuthorityBoundary;
}
