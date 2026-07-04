import type { ApprovedHandoffContextUpdateRecordReview } from "./handoff-context-update-record-review";
import type { OperatorApprovedHandoffContextUpdateRecord } from "./handoff-context-update-write";
import type { HandoffContextRelayRationale } from "./handoff-context-relay-rationale";

export const HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION =
  "handoff_context_apply_preview.v0.1" as const;

export type HandoffContextApplyPreviewStatus =
  | "no_records"
  | "insufficient_data"
  | "no_selected_record"
  | "apply_candidates_available"
  | "blocked"
  | "needs_operator_review";

export type HandoffContextApplyPreviewCandidateKind =
  | "selected_ref_add"
  | "selected_ref_reinforce"
  | "warning_add"
  | "warning_strengthen"
  | "context_deprioritize"
  | "context_exclude"
  | "keep_unknown"
  | "expected_return_update"
  | "stop_if_missing_carry_forward"
  | "rejected_or_excluded_review_note";

export interface HandoffContextApplyPreviewInput {
  record_review?: ApprovedHandoffContextUpdateRecordReview | null;
  selected_record?: OperatorApprovedHandoffContextUpdateRecord | null;
  current_handoff_context_rationale?: HandoffContextRelayRationale | null;
  current_selected_refs?: string[];
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export interface HandoffContextApplyPreview {
  preview_version: typeof HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  preview_status: HandoffContextApplyPreviewStatus;
  input_summary: HandoffContextApplyPreviewInputSummary;
  selected_record_ref: string | null;
  current_context_summary: HandoffContextApplyPreviewCurrentContextSummary;
  proposed_apply_delta: HandoffContextApplyPreviewDelta;
  conflict_summary: HandoffContextApplyPreviewConflictSummary;
  evidence_summary: HandoffContextApplyPreviewEvidenceSummary;
  operator_review_checklist: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  non_goals: string[];
  authority_boundary: HandoffContextApplyPreviewAuthorityBoundary;
}

export interface HandoffContextApplyPreviewInputSummary {
  has_record_review: boolean;
  review_status: ApprovedHandoffContextUpdateRecordReview["review_status"] | null;
  selected_record_id: string | null;
  selected_record_found: boolean;
  selected_full_record_supplied: boolean;
  current_handoff_context_supplied: boolean;
  current_selected_ref_count: number;
  approved_record_count: number;
  apply_candidate_count: number;
  blocked_reason_count: number;
  insufficient_data_reason_count: number;
}

export interface HandoffContextApplyPreviewCurrentContextSummary {
  current_selected_ref_count: number;
  current_warning_count: number;
  current_stop_if_missing_count: number;
  current_expected_return_signal_count: number;
  source_refs: string[];
}

export interface HandoffContextApplyPreviewCandidate {
  candidate_id: string;
  candidate_kind: HandoffContextApplyPreviewCandidateKind;
  ref_id: string;
  label: string;
  summary: string;
  source_record_id: string;
  source_candidate_id: string;
  source_bucket: string;
  evidence_refs: string[];
  source_refs: string[];
  existing_handoff_ref_ids: string[];
  apply_preview_only: true;
  would_mutate_live_handoff: false;
  review_note: string;
}

export interface HandoffContextApplyPreviewDelta {
  selected_refs_to_add: HandoffContextApplyPreviewCandidate[];
  selected_refs_to_reinforce: HandoffContextApplyPreviewCandidate[];
  warnings_to_add_or_strengthen: HandoffContextApplyPreviewCandidate[];
  context_refs_to_deprioritize: HandoffContextApplyPreviewCandidate[];
  context_refs_to_exclude: HandoffContextApplyPreviewCandidate[];
  keep_unknown_as_review_only: HandoffContextApplyPreviewCandidate[];
  expected_return_signal_updates: HandoffContextApplyPreviewCandidate[];
  carry_forward_stop_if_missing: HandoffContextApplyPreviewCandidate[];
  rejected_or_excluded_review_notes: HandoffContextApplyPreviewCandidate[];
}

export interface HandoffContextApplyPreviewConflictSummary {
  duplicate_selected_refs: string[];
  unknown_selected_ref_attempts: string[];
  missing_evidence_candidates: string[];
  stale_or_noisy_candidates: string[];
  conflicting_candidate_ids: string[];
  blocked_apply_reasons: string[];
}

export interface HandoffContextApplyPreviewEvidenceSummary {
  has_record_review: boolean;
  has_selected_record: boolean;
  has_full_record_material: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  all_apply_candidates_evidence_backed: boolean;
  no_live_handoff_mutation_confirmed: boolean;
  no_handoff_send_confirmed: boolean;
  no_provider_github_codex_confirmed: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  problem_record_ids: string[];
}

export interface HandoffContextApplyPreviewAuthorityBoundary {
  read_only_apply_preview: true;
  advisory_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_handoff_context_update_record: false;
  can_write_operator_approved_handoff_context_update_record: false;
  can_mutate_live_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_continuity_relay: false;
  can_update_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_dogfood_ledger: false;
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
