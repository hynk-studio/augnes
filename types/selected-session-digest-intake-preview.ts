/**
 * Selected Session Digest Intake Preview v0.1.
 *
 * Read-only preview for manually supplied selected session/project-history
 * digest material. This contract does not create durable ingest records,
 * write DB rows, mutate memory, mutate Perspective/CWP state, mutate handoff
 * context, call providers/GitHub/Codex, or run autonomous actions.
 */

export const SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION =
  "selected_session_digest_intake_preview.v0.1" as const;

export type SelectedSessionDigestSourceKind =
  | "chatgpt_session_digest"
  | "codex_session_digest"
  | "project_history_digest"
  | "research_note_digest"
  | "manual_operator_digest"
  | "unknown";

export type SelectedSessionDigestIntakePreviewStatus =
  | "no_digest"
  | "insufficient_data"
  | "malformed"
  | "unsafe"
  | "candidate_material_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type SelectedSessionDigestIntakeRecommendedNextAction =
  | "supply_selected_session_digest"
  | "supply_source_ref"
  | "supply_operator_ref"
  | "resolve_unsafe_refs"
  | "review_intake_candidate"
  | "prepare_separate_digest_ingest_contract_preview"
  | "keep_preview_only"
  | "reject_digest_candidate";

export type SelectedSessionDigestIntakeCandidateKind =
  | "session_summary"
  | "user_goal"
  | "decision"
  | "open_question"
  | "next_action"
  | "evidence_ref"
  | "source_ref"
  | "risk_or_blocker"
  | "reusable_context"
  | "rejected_or_review_only";

export type SelectedSessionDigestIntakeCandidateConfidence =
  | "explicit"
  | "inferred_heuristic"
  | "unknown";

export interface SelectedSessionDigestIntakePreviewInput {
  digest?: unknown;
  raw_text?: string;
  source_kind?: SelectedSessionDigestSourceKind;
  source_ref?: string;
  operator_ref?: string;
  session_ref?: string;
  project_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export interface SelectedSessionDigestIntakePreview {
  preview_version: typeof SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  intake_preview_status: SelectedSessionDigestIntakePreviewStatus;
  recommended_next_action: SelectedSessionDigestIntakeRecommendedNextAction;
  input_summary: SelectedSessionDigestIntakeInputSummary;
  source_status: SelectedSessionDigestIntakeSourceStatus;
  candidate_material: SelectedSessionDigestIntakeCandidateMaterial;
  extracted_preview: SelectedSessionDigestExtractedPreview;
  future_ingest_contract_preview: SelectedSessionDigestFutureIngestContractPreview;
  readiness: SelectedSessionDigestIntakeReadiness;
  evidence_summary: SelectedSessionDigestIntakeEvidenceSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  unsafe_ref_reasons: string[];
  privacy_review_notes: string[];
  operator_review_checklist: string[];
  would_not_ingest: string[];
  non_goals: string[];
  authority_boundary: SelectedSessionDigestIntakeAuthorityBoundary;
}

export interface SelectedSessionDigestIntakeInputSummary {
  has_digest: boolean;
  has_raw_text: boolean;
  source_kind: SelectedSessionDigestSourceKind | "missing";
  source_ref_supplied: boolean;
  operator_ref_supplied: boolean;
  session_ref_supplied: boolean;
  project_ref_supplied: boolean;
  raw_text_length: number;
  raw_text_line_count: number;
  candidate_count: number;
  source_ref_count: number;
  evidence_ref_count: number;
  unsafe_ref_count: number;
  missing_reason_count: number;
  blocked_reason_count: number;
}

export interface SelectedSessionDigestIntakeSourceStatus {
  digest: "supplied" | "missing" | "malformed";
  raw_text: "supplied" | "missing" | "too_large" | "unsafe";
  source_kind: "known" | "unknown" | "missing";
  source_ref: "supplied" | "missing" | "unsafe";
  operator_ref: "supplied" | "missing" | "unsafe";
  authority_boundary: "valid_read_only" | "invalid" | "missing";
}

export interface SelectedSessionDigestIntakeCandidateMaterial {
  session_summary_candidates: SelectedSessionDigestIntakeCandidate[];
  user_goal_candidates: SelectedSessionDigestIntakeCandidate[];
  decision_candidates: SelectedSessionDigestIntakeCandidate[];
  open_question_candidates: SelectedSessionDigestIntakeCandidate[];
  next_action_candidates: SelectedSessionDigestIntakeCandidate[];
  evidence_ref_candidates: SelectedSessionDigestIntakeCandidate[];
  source_ref_candidates: SelectedSessionDigestIntakeCandidate[];
  risk_or_blocker_candidates: SelectedSessionDigestIntakeCandidate[];
  reusable_context_candidates: SelectedSessionDigestIntakeCandidate[];
  rejected_or_review_only_candidates: SelectedSessionDigestIntakeCandidate[];
}

export interface SelectedSessionDigestIntakeCandidate {
  candidate_id: string;
  candidate_kind: SelectedSessionDigestIntakeCandidateKind;
  label: string;
  summary: string;
  raw_excerpt?: string;
  source_kind: SelectedSessionDigestSourceKind;
  source_ref: string;
  session_ref?: string;
  project_ref?: string;
  operator_ref?: string;
  evidence_refs: string[];
  source_refs: string[];
  confidence: SelectedSessionDigestIntakeCandidateConfidence;
  review_required: true;
  ingest_preview_only: true;
  would_write_memory: false;
  would_mutate_perspective: false;
  would_mutate_cwp: false;
  would_create_handoff: false;
}

export interface SelectedSessionDigestExtractedPreview {
  heading_lines: string[];
  checklist_lines: string[];
  explicit_ref_like_tokens: string[];
  possible_dates: string[];
  quoted_identifiers: string[];
  review_notes: string[];
}

export interface SelectedSessionDigestFutureIngestContractPreview {
  proposed_record_kind: "selected_session_digest_ingest_candidate.v0.1";
  required_operator_review: string[];
  required_source_kind: string[];
  required_source_ref: string[];
  required_operator_ref: string[];
  required_session_or_project_ref: string[];
  required_evidence_refs: string[];
  required_idempotency_key: string[];
  required_privacy_review: string[];
  required_no_side_effects_receipt: string[];
  required_refusal_checks: string[];
}

export interface SelectedSessionDigestIntakeReadiness {
  ready_for_operator_review: boolean;
  ready_for_future_ingest_contract_preview: boolean;
  requires_digest_or_raw_text: boolean;
  requires_known_source_kind: boolean;
  requires_source_ref: boolean;
  requires_operator_ref: boolean;
  requires_public_safe_refs: boolean;
  requires_candidate_material: boolean;
  requires_privacy_review: true;
  requires_no_blockers: boolean;
  current_blockers: string[];
  current_insufficient_data: string[];
  current_unsafe_refs: string[];
}

export interface SelectedSessionDigestIntakeEvidenceSummary {
  has_digest_or_raw_text: boolean;
  has_candidate_material: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_operator_ref: boolean;
  has_session_or_project_ref: boolean;
  has_unsafe_refs: boolean;
  has_missing_evidence: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  unsafe_refs: string[];
}

export interface SelectedSessionDigestIntakeAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_record: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
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
