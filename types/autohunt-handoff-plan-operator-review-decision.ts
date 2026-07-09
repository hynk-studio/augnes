import type {
  AutohuntHandoffPlanPreview,
  AutohuntHandoffPlanPreviewAuthorityBoundary,
  AutohuntHandoffPlanPreviewBlockedAction,
  AutohuntHandoffPlanPreviewCandidateSummary,
  AutohuntHandoffPlanPreviewForbiddenOutput,
  AutohuntHandoffPlanPreviewReadback,
  AutohuntHandoffPlanPreviewScope,
  AutohuntHandoffPlanPreviewStatus,
} from "@/types/autohunt-handoff-plan-preview";

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND =
  "autohunt_handoff_plan_operator_review_decision" as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION =
  "autohunt_handoff_plan_operator_review_decision.v0.1" as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_KIND =
  "autohunt_handoff_plan_operator_review_decision_readback" as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_VERSION =
  "autohunt_handoff_plan_operator_review_decision_readback.v0.1" as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE =
  "autohunt_handoff_plan_operator_review_decisions" as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_STATUSES = [
  "accepted_for_future_supervised_handoff_copy_export_planning",
  "deferred",
  "rejected",
  "blocked",
  "insufficient_data",
  "source_handoff_plan_missing",
  "source_handoff_plan_not_ready",
  "source_handoff_plan_fingerprint_mismatch",
  "source_chain_mismatch",
  "unsafe_material_refused",
] as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_DECISIONS = [
  "accept_handoff_plan_for_future_supervised_copy_export_planning",
  "defer_handoff_plan_review",
  "reject_handoff_plan_review",
] as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS = [
  "start_runner",
  "schedule_runner",
  "execute_codex",
  "call_github",
  "create_branch_or_pr",
  "merge",
  "deploy",
  "publish_external",
  "call_provider_or_openai",
  "fetch_sources",
  "run_retrieval",
  "write_memory",
  "promote_perspective",
  "mutate_cwp",
  "mutate_work",
  "write_proof_or_evidence",
  "auto_apply_delta",
] as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_NEXT_ALLOWED_OUTPUTS = [
  "operator_review_decision_readback",
  "supervised_handoff_copy_export_preview",
  "handoff_plan_decision_report",
] as const;

export const AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_FORBIDDEN_OUTPUTS = [
  "executed_codex_task",
  "created_branch",
  "opened_pr",
  "merged_pr",
  "deployed_change",
  "external_post",
  "durable_memory_write",
  "proof_or_evidence_record",
  "perspective_promotion",
] as const;

export type AutohuntHandoffPlanOperatorReviewDecisionStatus =
  (typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_STATUSES)[number];

export type AutohuntHandoffPlanOperatorDecision =
  (typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_DECISIONS)[number];

export type AutohuntHandoffPlanOperatorReviewDecisionScope =
  AutohuntHandoffPlanPreviewScope;

export type AutohuntHandoffPlanOperatorReviewDecisionBlockedAction =
  (typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS)[number];

export type AutohuntHandoffPlanOperatorReviewDecisionNextAllowedOutput =
  (typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_NEXT_ALLOWED_OUTPUTS)[number];

export type AutohuntHandoffPlanOperatorReviewDecisionForbiddenOutput =
  (typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_FORBIDDEN_OUTPUTS)[number];

export type AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary =
  AutohuntHandoffPlanPreviewAuthorityBoundary;

export interface AutohuntHandoffPlanOperatorReviewDecisionSourceHandoffPlan {
  handoff_plan_id: string;
  handoff_plan_fingerprint: string;
  handoff_plan_status: AutohuntHandoffPlanPreviewStatus;
  source_grant_id: string;
  source_grant_fingerprint: string;
  source_preflight_packet_id: string;
  source_preflight_packet_fingerprint: string;
  source_workbench_spine_fingerprint: string;
  selected_candidate_ids: string[];
  selected_candidate_fingerprints: string[];
}

export interface AutohuntHandoffPlanOperatorReviewDecisionReviewBasis {
  review_basis_ref: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_basis_fingerprint: string;
  raw_review_note_persisted: false;
}

export interface AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary {
  handoff_plan_id: string;
  handoff_plan_fingerprint: string;
  prompt_plan_id: string;
  review_packet_id: string;
  selected_candidate_count: number;
  required_checks: string[];
  expected_changed_file_globs: string[];
  max_changed_files: number;
  approval_scope: "future_supervised_handoff_copy_export_planning_only";
}

export interface AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary {
  reason_code: string;
  reason_fingerprint: string;
  raw_reason_text_persisted: false;
}

export interface AutohuntHandoffPlanOperatorReviewDecisionSourceChainValidation {
  handoff_plan_ready: boolean;
  handoff_plan_fingerprint_verified: boolean;
  source_grant_binding_present: boolean;
  source_preflight_binding_present: boolean;
  source_workbench_spine_binding_present: boolean;
  selected_candidate_binding_present: boolean;
  operator_decision_present: boolean;
  passed: boolean;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntHandoffPlanOperatorReviewDecisionPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_operator_decision: true;
  persists_raw_review_note: false;
  persists_raw_reason_text: false;
  persists_raw_prompt_text: false;
  persists_raw_pr_body: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntHandoffPlanOperatorReviewDecisionValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  source_chain_validation_passed: boolean;
  review_basis_present: boolean;
  review_basis_safe: boolean;
  accepted_summary_valid: boolean;
  defer_or_reject_summary_valid: boolean;
  required_blocked_actions_present: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
}

export interface AutohuntHandoffPlanOperatorReviewDecisionRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntHandoffPlanOperatorReviewDecisionRowCountObservation[];
}

export interface AutohuntHandoffPlanOperatorReviewDecision {
  decision_kind: typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND;
  decision_version: typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION;
  decision_id: string;
  scope: AutohuntHandoffPlanOperatorReviewDecisionScope;
  created_at: string;
  decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus;
  operator_decision: AutohuntHandoffPlanOperatorDecision;
  source_handoff_plan: AutohuntHandoffPlanOperatorReviewDecisionSourceHandoffPlan;
  review_basis: AutohuntHandoffPlanOperatorReviewDecisionReviewBasis;
  accepted_summary: AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary | null;
  defer_or_reject_summary:
    | AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary
    | null;
  source_chain_validation: AutohuntHandoffPlanOperatorReviewDecisionSourceChainValidation;
  blocked_actions: AutohuntHandoffPlanOperatorReviewDecisionBlockedAction[];
  next_allowed_outputs: AutohuntHandoffPlanOperatorReviewDecisionNextAllowedOutput[];
  forbidden_outputs: AutohuntHandoffPlanOperatorReviewDecisionForbiddenOutput[];
  authority_boundary: AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary;
  persisted_material_boundary: AutohuntHandoffPlanOperatorReviewDecisionPersistedMaterialBoundary;
  validation: AutohuntHandoffPlanOperatorReviewDecisionValidation;
  row_count_write_summary: AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary;
  idempotency_key: string;
  decision_fingerprint: string;
}

export type AutohuntHandoffPlanOperatorReviewDecisionSourceInput =
  | AutohuntHandoffPlanPreview
  | AutohuntHandoffPlanPreviewReadback
  | null
  | undefined;

export interface AutohuntHandoffPlanOperatorReviewDecisionInput {
  scope: AutohuntHandoffPlanOperatorReviewDecisionScope;
  source_handoff_plan: AutohuntHandoffPlanOperatorReviewDecisionSourceInput;
  operator_decision?: AutohuntHandoffPlanOperatorDecision | string | null;
  review_basis?: AutohuntHandoffPlanOperatorReviewDecisionReviewBasis | null;
  accepted_summary?: AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary | null;
  defer_or_reject_summary?:
    | AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary
    | null;
  blocked_actions?: string[];
  raw_material_probe?: unknown;
}

export type AutohuntHandoffPlanOperatorReviewDecisionWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntHandoffPlanOperatorReviewDecisionWriteResult {
  ok: boolean;
  result_status: AutohuntHandoffPlanOperatorReviewDecisionWriteStatus;
  refusal_reasons: string[];
  decision: AutohuntHandoffPlanOperatorReviewDecision | null;
  duplicate_replayed: boolean;
  decision_record_written: boolean;
  row_count_write_summary:
    | AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary
    | null;
  can_start_runner: false;
  can_schedule_runner: false;
  can_execute_codex: false;
  can_call_github: false;
  can_create_branch_or_pr: false;
  can_merge: false;
  can_deploy: false;
  can_publish_external: false;
  can_call_provider_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval: false;
  can_write_memory: false;
  can_promote_perspective: false;
  can_mutate_cwp: false;
  can_mutate_work: false;
  can_write_proof_or_evidence: false;
  can_auto_apply_delta: false;
  raw_material_persisted: false;
}

export type AutohuntHandoffPlanOperatorReviewDecisionSelectionStatus =
  | "selected_latest_accepted_decision"
  | "selected_by_decision_id"
  | "decision_id_not_found"
  | "no_accepted_decision"
  | "no_decisions";

export interface AutohuntHandoffPlanOperatorReviewDecisionSelectedSummary {
  decision_id: string;
  decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus;
  operator_decision: AutohuntHandoffPlanOperatorDecision;
  source_handoff_plan_id: string;
  selected_candidate_count: number;
  accepted_for_future_supervised_copy_export_planning: boolean;
  authority_boundary_all_false: boolean;
}

export interface AutohuntHandoffPlanOperatorReviewDecisionReadback {
  readback_kind: typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_KIND;
  readback_version: typeof AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_VERSION;
  scope: AutohuntHandoffPlanOperatorReviewDecisionScope;
  source_handoff_plan_id_filter: string | null;
  decision_status_filter: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
  operator_decision_filter: AutohuntHandoffPlanOperatorDecision | null;
  decision_id_filter: string | null;
  selection_status: AutohuntHandoffPlanOperatorReviewDecisionSelectionStatus;
  selected_decision: AutohuntHandoffPlanOperatorReviewDecision | null;
  selected_decision_summary: AutohuntHandoffPlanOperatorReviewDecisionSelectedSummary | null;
  latest_accepted_decision: AutohuntHandoffPlanOperatorReviewDecision | null;
  decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  all_decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  accepted_decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  deferred_decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  rejected_decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  blocked_decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  insufficient_data_decisions: AutohuntHandoffPlanOperatorReviewDecision[];
  invalid_record_count: number;
  selected_candidate_summaries: AutohuntHandoffPlanPreviewCandidateSummary[];
  accepted_summary:
    | AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary
    | null;
  defer_or_reject_summary:
    | AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary
    | null;
  no_run_no_execution_boundary: AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary;
  raw_material_persisted: false;
  runner_started: false;
  scheduler_started: false;
  codex_executed: false;
  github_called: false;
  provider_openai_called: false;
  sources_fetched: false;
  retrieval_run: false;
  memory_written: false;
  perspective_promoted: false;
  cwp_mutated: false;
  work_mutated: false;
  proof_or_evidence_written: false;
  product_or_delivery_state_written: false;
}
