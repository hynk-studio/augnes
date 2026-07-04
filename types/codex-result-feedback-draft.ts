/**
 * Type-only Codex Result Feedback Draft v0.1 contract.
 *
 * This contract describes candidate-only comparison material derived from a
 * normalized Codex Result Report and the existing Handoff Context Relay
 * Rationale. It adds no durable memory write, dogfood ledger write, Perspective
 * apply, provider call, GitHub/Codex execution, handoff send, route, store,
 * graph/vector/RAG/crawler, browser observer, or autonomous action.
 */

export const CODEX_RESULT_FEEDBACK_DRAFT_VERSION =
  "codex_result_feedback_draft.v0.1" as const;

export type CodexResultFeedbackDraftCandidateStatus =
  | "candidate_ready_for_review"
  | "needs_operator_review"
  | "insufficient_data";

export type CodexResultFeedbackDraftConfidence =
  | "high"
  | "medium"
  | "low"
  | "insufficient_data";

export type CodexResultFeedbackExpectationStatus =
  | "matched"
  | "missing"
  | "unexpected"
  | "skipped_or_unverified";

export interface CodexResultFeedbackDraft {
  runtime: "augnes";
  draft_version: typeof CODEX_RESULT_FEEDBACK_DRAFT_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  result_report_refs: CodexResultFeedbackResultReportRefs;
  handoff_context_refs: CodexResultFeedbackHandoffContextRefs;
  expected_return_signal: CodexResultFeedbackReturnSignal;
  observed_return_signal: CodexResultFeedbackObservedReturnSignal;
  expected_observed_delta: CodexExpectedObservedDeltaDraft;
  reuse_outcome_draft: CodexReuseOutcomeDraft;
  carry_forward_suggestions: CodexResultCarryForwardSuggestions;
  insufficient_data_reasons: string[];
  stale_or_gap_warnings: string[];
  authority_boundary: CodexResultFeedbackDraftAuthorityBoundary;
  candidate_status: CodexResultFeedbackDraftCandidateStatus;
  source_status: CodexResultFeedbackSourceStatus;
  fallback_reason: CodexResultFeedbackFallbackReason;
  notes: string[];
}

export interface CodexResultFeedbackResultReportRefs {
  result_report_ref: string | null;
  result_report_fingerprint: string | null;
  pr_refs: string[];
  branch_ref: string | null;
  commit_refs: string[];
  source_refs: string[];
}

export interface CodexResultFeedbackHandoffContextRefs {
  context_relay_rationale_ref: string | null;
  context_relay_rationale_version: string | null;
  continuity_relay_ref: string | null;
  handoff_capsule_ref: string | null;
  codex_launch_card_ref: string | null;
  selected_refs: string[];
  selected_source_refs: string[];
}

export interface CodexResultFeedbackReturnSignal {
  signal_version: string | null;
  required_fields: string[];
  context_feedback_fields: string[];
  instructions: string[];
}

export interface CodexResultFeedbackObservedReturnSignal {
  changed_files: string[];
  checks_run: string[];
  skipped_checks: string[];
  requirement_progress: string[];
  context_helpful_or_stale_refs: string[];
  unresolved_gaps: string[];
  next_relay_update_suggestions: string[];
}

export interface CodexExpectedObservedDeltaDraft {
  matched_expectations: CodexResultExpectationItem[];
  missing_expectations: CodexResultExpectationItem[];
  unexpected_observations: CodexResultExpectationItem[];
  skipped_or_unverified_checks: string[];
  changed_files_observed: string[];
  checks_observed: string[];
  requirement_progress_observed: string[];
  not_done_items: string[];
  mismatch_summary: string;
  confidence: CodexResultFeedbackDraftConfidence;
  insufficient_data_reasons: string[];
}

export interface CodexResultExpectationItem {
  field: string;
  status: CodexResultFeedbackExpectationStatus;
  summary: string;
  source_refs: string[];
}

export interface CodexReuseOutcomeDraft {
  helpful_refs: CodexContextReuseRef[];
  stale_refs: CodexContextReuseRef[];
  missing_refs: CodexContextReuseRef[];
  noisy_refs: CodexContextReuseRef[];
  misleading_refs: CodexContextReuseRef[];
  unused_or_unmentioned_refs: CodexContextReuseRef[];
  unknown_refs: CodexContextReuseRef[];
  context_helpfulness_summary: string;
  context_corrections_needed: string[];
  confidence: CodexResultFeedbackDraftConfidence;
  review_needed: boolean;
}

export interface CodexContextReuseRef {
  ref_id: string;
  label: string;
  reason_category: string;
  evidence_refs: string[];
  summary: string;
}

export interface CodexResultCarryForwardSuggestions {
  next_relay_update_suggestions: string[];
  next_handoff_adjustments: string[];
  refs_to_preserve_next_time: string[];
  refs_to_warn_next_time: string[];
  refs_to_drop_or_deprioritize: string[];
  unresolved_gaps: string[];
  next_focus_candidate: string;
}

export interface CodexResultFeedbackSourceStatus {
  handoff_context_rationale: "supplied" | "missing";
  codex_result_report: "supplied" | "missing";
  codex_result_report_status: string;
}

export interface CodexResultFeedbackFallbackReason {
  handoff_context_rationale: string | null;
  codex_result_report: string | null;
}

export interface CodexResultFeedbackDraftAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_write_dogfood_ledger: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_send_handoff: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}
