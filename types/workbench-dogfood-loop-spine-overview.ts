/**
 * Workbench Dogfood Loop Spine Overview v0.1.
 *
 * Read-only overview of the current Augnes-on-Augnes dogfood continuity spine.
 * This contract only consumes already-built Workbench preview objects. It does
 * not rebuild upstream previews, read DB/routes, create schema, write records,
 * mutate memory/CWP/Perspective/handoff state, call providers/GitHub/Codex, or
 * run autonomous actions.
 */

import type { CodexResultFeedbackDraft } from "./codex-result-feedback-draft";
import type { DogfoodMetricCandidatePreview } from "./dogfood-metric-candidate-preview";
import type { DogfoodReuseOperatorDecisionPreview } from "./dogfood-reuse-operator-decision-preview";
import type { DogfoodReuseRecordProposal } from "./dogfood-reuse-record-proposal";
import type { HandoffContextApplyOperatorDecisionPreview } from "./handoff-context-apply-operator-decision-preview";
import type { HandoffContextApplyPreview } from "./handoff-context-apply-preview";
import type { HandoffContextApplyWriteContractPreview } from "./handoff-context-apply-write-contract-preview";
import type { HandoffContextUpdateOperatorDecisionPreview } from "./handoff-context-update-operator-decision-preview";
import type { HandoffContextUpdatePreview } from "./handoff-context-update-preview";
import type { ApprovedHandoffContextUpdateRecordReview } from "./handoff-context-update-record-review";
import type { MetricInformedContinuityRelayAdjustmentPreview } from "./metric-informed-continuity-relay-adjustment-preview";
import type { PerspectiveNextWorkCandidateUpdatePreview } from "./perspective-next-work-candidate-update-preview";
import type { ProjectHistoryIntakeOperatorDecisionPreview } from "./project-history-intake-decision";
import type { ProjectHistoryIntakePreview } from "./project-history-intake-preview";
import type { ProjectHistoryIntakeRecordReview } from "./project-history-intake-record-review";
import type { SelectedSessionDigestIngestContractPreview } from "./selected-session-digest-ingest-contract-preview";
import type { SelectedSessionDigestIngestOperatorDecisionPreview } from "./selected-session-digest-ingest-operator-decision";
import type { SelectedSessionDigestIngestRecordReview } from "./selected-session-digest-ingest-record-review";
import type { SelectedSessionDigestIntakePreview } from "./selected-session-digest-intake-preview";

export const WORKBENCH_DOGFOOD_LOOP_SPINE_OVERVIEW_VERSION =
  "workbench_dogfood_loop_spine_overview.v0.1" as const;

export type WorkbenchDogfoodLoopSpineOverviewStatus =
  | "no_current_material"
  | "insufficient_data"
  | "blocked"
  | "chain_visible"
  | "candidate_material_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction =
  | "supply_selected_session_digest"
  | "supply_selected_session_intake_preview"
  | "resolve_intake_blockers_or_unsafe_refs"
  | "supply_source_ref"
  | "supply_operator_ref"
  | "supply_session_or_project_ref"
  | "supply_evidence_refs"
  | "supply_privacy_review_confirmation"
  | "supply_selected_digest_candidate_refs"
  | "supply_idempotency_key"
  | "review_future_ingest_contract"
  | "prepare_separate_ingest_write_slice"
  | "reject_digest_ingest_candidate"
  | "review_selected_session_digest_ingest_operator_decision"
  | "prepare_operator_approved_selected_session_digest_ingest_decision_record"
  | "resolve_selected_session_digest_ingest_decision_blockers"
  | "write_selected_session_digest_candidate_ingest_record"
  | "review_selected_session_digest_ingest_record"
  | "resolve_selected_session_digest_ingest_record_blockers"
  | "supply_project_history_digest"
  | "review_project_history_intake_candidates"
  | "write_project_history_candidate_ingest_record"
  | "review_project_history_intake_record"
  | "resolve_project_history_intake_blockers"
  | "supply_codex_result_report"
  | "review_intake_candidate"
  | "review_reuse_candidate"
  | "review_metric_candidate"
  | "review_next_work_candidate"
  | "review_relay_adjustment"
  | "review_handoff_context_update_candidate"
  | "review_approved_handoff_context_update_records"
  | "review_handoff_context_apply_preview"
  | "supply_current_handoff_packet_fingerprint"
  | "review_apply_write_contract_preview"
  | "resolve_blockers_or_missing_evidence"
  | "keep_preview_only";

export type WorkbenchDogfoodLoopSpineStepId =
  | "selected_session_intake"
  | "selected_session_digest_ingest_contract"
  | "selected_session_digest_ingest_operator_decision"
  | "selected_session_digest_durable_ingest_record"
  | "project_history_intake"
  | "project_history_candidate_ingest_record"
  | "codex_result_feedback"
  | "dogfood_reuse_proposal"
  | "dogfood_reuse_operator_decision"
  | "dogfood_metric_candidate"
  | "perspective_next_work_candidate"
  | "continuity_relay_adjustment"
  | "handoff_context_update"
  | "handoff_context_update_decision"
  | "approved_handoff_context_update_record_review"
  | "handoff_context_apply_preview"
  | "handoff_context_apply_decision"
  | "handoff_context_apply_write_contract";

export type WorkbenchDogfoodLoopSpineStepStatus =
  | "not_supplied"
  | "no_current_material"
  | "insufficient_data"
  | "blocked"
  | "candidate_material_available"
  | "ready_for_operator_review"
  | "ready_for_future_contract_review"
  | "keep_preview_only";

export interface WorkbenchDogfoodLoopSpineOverviewInput {
  selected_session_digest_intake_preview?: SelectedSessionDigestIntakePreview | null;
  selected_session_digest_ingest_contract_preview?: SelectedSessionDigestIngestContractPreview | null;
  selected_session_digest_ingest_operator_decision_preview?: SelectedSessionDigestIngestOperatorDecisionPreview | null;
  selected_session_digest_ingest_record_review?: SelectedSessionDigestIngestRecordReview | null;
  project_history_intake_preview?: ProjectHistoryIntakePreview | null;
  project_history_intake_operator_decision_preview?: ProjectHistoryIntakeOperatorDecisionPreview | null;
  project_history_intake_record_review?: ProjectHistoryIntakeRecordReview | null;
  codex_result_feedback_draft?: CodexResultFeedbackDraft | null;
  dogfood_reuse_record_proposal?: DogfoodReuseRecordProposal | null;
  dogfood_reuse_operator_decision_preview?: DogfoodReuseOperatorDecisionPreview | null;
  dogfood_metric_candidate_preview?: DogfoodMetricCandidatePreview | null;
  perspective_next_work_candidate_update_preview?: PerspectiveNextWorkCandidateUpdatePreview | null;
  metric_informed_continuity_relay_adjustment_preview?: MetricInformedContinuityRelayAdjustmentPreview | null;
  handoff_context_update_preview?: HandoffContextUpdatePreview | null;
  handoff_context_update_operator_decision_preview?: HandoffContextUpdateOperatorDecisionPreview | null;
  handoff_context_update_record_review?: ApprovedHandoffContextUpdateRecordReview | null;
  handoff_context_apply_preview?: HandoffContextApplyPreview | null;
  handoff_context_apply_operator_decision_preview?: HandoffContextApplyOperatorDecisionPreview | null;
  handoff_context_apply_write_contract_preview?: HandoffContextApplyWriteContractPreview | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface WorkbenchDogfoodLoopSpineOverview {
  preview_version: typeof WORKBENCH_DOGFOOD_LOOP_SPINE_OVERVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  overview_status: WorkbenchDogfoodLoopSpineOverviewStatus;
  recommended_next_operator_action: WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction;
  spine_summary: WorkbenchDogfoodLoopSpineSummary;
  spine_steps: WorkbenchDogfoodLoopSpineStep[];
  top_blockers: string[];
  top_missing_evidence: string[];
  current_material_gaps: string[];
  next_operator_action_rationale: string[];
  review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: WorkbenchDogfoodLoopSpineOverviewAuthorityBoundary;
}

export interface WorkbenchDogfoodLoopSpineSummary {
  step_count: number;
  supplied_step_count: number;
  blocked_step_count: number;
  missing_or_insufficient_step_count: number;
  candidate_material_step_count: number;
  ready_for_operator_review_step_count: number;
  total_material_count: number;
  total_blocker_count: number;
  total_missing_evidence_count: number;
  current_material_gap_count: number;
  summary: string;
}

export interface WorkbenchDogfoodLoopSpineStep {
  step_id: WorkbenchDogfoodLoopSpineStepId;
  label: string;
  status: WorkbenchDogfoodLoopSpineStepStatus;
  source_preview_ref_or_version: string | null;
  material_count: number;
  blocker_count: number;
  missing_evidence_count: number;
  recommended_next_action: WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction;
  evidence_present: boolean;
  read_only: true;
  summary: string;
}

export interface WorkbenchDogfoodLoopSpineOverviewAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_schema: false;
  can_create_route: false;
  can_call_route: false;
  can_create_ingest_decision_record: false;
  can_create_ingest_decision_receipt: false;
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
  can_create_ingest_record: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}
