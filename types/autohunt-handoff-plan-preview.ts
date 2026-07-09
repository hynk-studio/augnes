import type {
  AutonomyDelegationGrantMode,
  AutonomyDelegationGrantScope,
  AutonomyDelegationGrantStatus,
} from "@/types/autonomy-delegation-grant";
import type {
  AutohuntPreflightPacket,
  AutohuntPreflightPacketAggregateBudgetProjection,
  AutohuntPreflightPacketReadback,
} from "@/types/autohunt-preflight-packet";
import type {
  AutohuntWorkQueueCandidateBudgetProjection,
  AutohuntWorkQueueCandidateOrigin,
} from "@/types/autohunt-work-queue-candidate";
import type {
  AutohuntWorkbenchReadbackSpine,
  AutohuntWorkbenchReadbackSpineChainBinding,
  AutohuntWorkbenchReadbackSpineStatus,
} from "@/types/autohunt-workbench-readback-spine";

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND =
  "autohunt_handoff_plan_preview" as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION =
  "autohunt_handoff_plan_preview.v0.1" as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_KIND =
  "autohunt_handoff_plan_preview_readback" as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_VERSION =
  "autohunt_handoff_plan_preview_readback.v0.1" as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE =
  "autohunt_handoff_plan_previews" as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_STATUSES = [
  "ready_for_operator_review",
  "blocked",
  "insufficient_data",
  "missing_ready_preflight_packet",
  "preflight_not_ready",
  "spine_not_ready",
  "source_chain_mismatch",
  "unsafe_material_refused",
] as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS = [
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

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_NEXT_ALLOWED_OUTPUTS = [
  "operator_review_packet",
  "codex_prompt_preview",
  "draft_pr_plan_preview",
  "handoff_plan_report",
] as const;

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_FORBIDDEN_OUTPUTS = [
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

export const AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES = [
  "can_start_runner",
  "can_schedule_runner",
  "can_execute_codex",
  "can_call_github",
  "can_create_branch_or_pr",
  "can_merge",
  "can_deploy",
  "can_publish_external",
  "can_call_provider_or_openai",
  "can_fetch_sources",
  "can_run_retrieval",
  "can_write_memory",
  "can_promote_perspective",
  "can_mutate_cwp",
  "can_mutate_work",
  "can_write_proof_or_evidence",
  "can_auto_apply_delta",
] as const;

export type AutohuntHandoffPlanPreviewStatus =
  (typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_STATUSES)[number];

export type AutohuntHandoffPlanPreviewScope = AutonomyDelegationGrantScope;

export type AutohuntHandoffPlanPreviewBlockedAction =
  (typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS)[number];

export type AutohuntHandoffPlanPreviewNextAllowedOutput =
  (typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_NEXT_ALLOWED_OUTPUTS)[number];

export type AutohuntHandoffPlanPreviewForbiddenOutput =
  (typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_FORBIDDEN_OUTPUTS)[number];

export type AutohuntHandoffPlanPreviewAuthorityFlagName =
  (typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES)[number];

export type AutohuntHandoffPlanPreviewAuthorityBoundary = Record<
  AutohuntHandoffPlanPreviewAuthorityFlagName,
  false
>;

export interface AutohuntHandoffPlanPreviewSourceGrant {
  grant_id: string;
  grant_fingerprint: string;
  grant_status: AutonomyDelegationGrantStatus;
  grant_mode: AutonomyDelegationGrantMode;
}

export interface AutohuntHandoffPlanPreviewSourcePreflight {
  preflight_packet_id: string;
  preflight_packet_fingerprint: string;
  preflight_status: string;
  selected_candidate_ids: string[];
  selected_candidate_fingerprints: string[];
}

export interface AutohuntHandoffPlanPreviewSourceWorkbenchSpine {
  spine_fingerprint: string;
  spine_status: AutohuntWorkbenchReadbackSpineStatus;
  chain_binding_summary: AutohuntWorkbenchReadbackSpineChainBinding;
}

export interface AutohuntHandoffPlanPreviewCandidateSummary {
  candidate_id: string;
  candidate_fingerprint: string;
  candidate_origin: AutohuntWorkQueueCandidateOrigin;
  work_class: string;
  title_summary_fingerprint: string;
  proposed_files_or_globs: string[];
  expected_outputs: string[];
  required_checks: string[];
  budget_projection: AutohuntWorkQueueCandidateBudgetProjection;
}

export interface AutohuntHandoffPlanPreviewSupervisedPromptPlan {
  prompt_plan_id: string;
  prompt_title: string;
  prompt_goal_summary: string;
  required_context_refs: string[];
  selected_source_refs: string[];
  selected_source_fingerprints: string[];
  implementation_constraints: string[];
  acceptance_criteria: string[];
  required_checks: string[];
  expected_result_report_sections: string[];
  prompt_text_fingerprint: string;
  raw_prompt_text_persisted: false;
}

export interface AutohuntHandoffPlanPreviewDraftPrPlan {
  branch_name_preview: string;
  pr_title_preview: string;
  pr_body_sections: string[];
  expected_changed_file_globs: string[];
  max_changed_files: number;
  checks_to_run: string[];
  reviewer_focus: string[];
  raw_pr_body_persisted: false;
}

export interface AutohuntHandoffPlanPreviewOperatorReviewPacket {
  review_packet_id: string;
  review_status: string;
  review_questions: string[];
  approval_required_before_execution: true;
  approval_required_before_branch_or_pr: true;
  approval_required_before_merge: true;
  approval_required_before_external_call: true;
  raw_operator_note_persisted: false;
}

export interface AutohuntHandoffPlanPreviewPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_handoff_plan_policy: true;
  persists_raw_prompt_text: false;
  persists_raw_pr_body: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntHandoffPlanPreviewValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  preflight_ready: boolean;
  preflight_fingerprint_verified: boolean;
  workbench_spine_ready: boolean;
  workbench_spine_fingerprint_verified: boolean;
  chain_binding_passed: boolean;
  selected_candidate_binding_verified: boolean;
  source_grant_binding_verified: boolean;
  aggregate_budget_matches_preflight: boolean;
  required_checks_present: boolean;
  required_blocked_actions_present: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
  handoff_plan_fingerprint?: string | null;
}

export interface AutohuntHandoffPlanPreviewRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutohuntHandoffPlanPreviewRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntHandoffPlanPreviewRowCountObservation[];
}

export interface AutohuntHandoffPlanPreview {
  handoff_plan_kind: typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND;
  handoff_plan_version: typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION;
  handoff_plan_id: string;
  scope: AutohuntHandoffPlanPreviewScope;
  created_at: string;
  handoff_plan_status: AutohuntHandoffPlanPreviewStatus;
  source_grant: AutohuntHandoffPlanPreviewSourceGrant;
  source_preflight: AutohuntHandoffPlanPreviewSourcePreflight;
  source_workbench_spine: AutohuntHandoffPlanPreviewSourceWorkbenchSpine;
  selected_candidate_plan_summaries: AutohuntHandoffPlanPreviewCandidateSummary[];
  supervised_codex_prompt_plan: AutohuntHandoffPlanPreviewSupervisedPromptPlan;
  draft_pr_plan: AutohuntHandoffPlanPreviewDraftPrPlan;
  operator_review_packet: AutohuntHandoffPlanPreviewOperatorReviewPacket;
  aggregate_budget_projection: AutohuntPreflightPacketAggregateBudgetProjection;
  blocked_actions: AutohuntHandoffPlanPreviewBlockedAction[];
  next_allowed_outputs: AutohuntHandoffPlanPreviewNextAllowedOutput[];
  forbidden_outputs: AutohuntHandoffPlanPreviewForbiddenOutput[];
  authority_boundary: AutohuntHandoffPlanPreviewAuthorityBoundary;
  persisted_material_boundary: AutohuntHandoffPlanPreviewPersistedMaterialBoundary;
  validation: AutohuntHandoffPlanPreviewValidation;
  row_count_write_summary: AutohuntHandoffPlanPreviewRowCountWriteSummary;
  idempotency_key: string;
  handoff_plan_fingerprint: string;
}

export type AutohuntHandoffPlanPreviewSourcePreflightInput =
  | AutohuntPreflightPacket
  | AutohuntPreflightPacketReadback
  | null
  | undefined;

export interface AutohuntHandoffPlanPreviewInput {
  scope: AutohuntHandoffPlanPreviewScope;
  source_preflight: AutohuntHandoffPlanPreviewSourcePreflightInput;
  source_workbench_spine?: AutohuntWorkbenchReadbackSpine | null;
  handoff_title?: string;
  handoff_goal_summary?: string;
  required_context_refs?: string[];
  selected_source_refs?: string[];
  implementation_constraints?: string[];
  acceptance_criteria?: string[];
  expected_result_report_sections?: string[];
  pr_body_sections?: string[];
  reviewer_focus?: string[];
  blocked_actions?: string[];
  raw_material_probe?: unknown;
}

export type AutohuntHandoffPlanPreviewWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntHandoffPlanPreviewWriteResult {
  ok: boolean;
  result_status: AutohuntHandoffPlanPreviewWriteStatus;
  refusal_reasons: string[];
  handoff_plan: AutohuntHandoffPlanPreview | null;
  duplicate_replayed: boolean;
  handoff_plan_record_written: boolean;
  row_count_write_summary: AutohuntHandoffPlanPreviewRowCountWriteSummary | null;
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

export type AutohuntHandoffPlanPreviewReadbackSelectionStatus =
  | "selected_latest_ready_handoff_plan"
  | "selected_by_handoff_plan_id"
  | "handoff_plan_id_not_found"
  | "no_ready_handoff_plan"
  | "no_handoff_plans";

export interface AutohuntHandoffPlanPreviewSelectedSummary {
  handoff_plan_id: string;
  handoff_plan_status: AutohuntHandoffPlanPreviewStatus;
  source_grant_id: string;
  source_preflight_packet_id: string;
  selected_candidate_count: number;
  prompt_plan_id: string;
  review_packet_id: string;
  blocker_count: number;
  authority_boundary_all_false: boolean;
}

export interface AutohuntHandoffPlanPreviewReadback {
  readback_kind: typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_KIND;
  readback_version: typeof AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_VERSION;
  scope: AutohuntHandoffPlanPreviewScope;
  source_grant_id_filter: string | null;
  source_preflight_packet_id_filter: string | null;
  handoff_plan_status_filter: AutohuntHandoffPlanPreviewStatus | null;
  handoff_plan_id_filter: string | null;
  selection_status: AutohuntHandoffPlanPreviewReadbackSelectionStatus;
  selected_handoff_plan: AutohuntHandoffPlanPreview | null;
  selected_handoff_plan_summary: AutohuntHandoffPlanPreviewSelectedSummary | null;
  latest_ready_handoff_plan: AutohuntHandoffPlanPreview | null;
  handoff_plans: AutohuntHandoffPlanPreview[];
  all_handoff_plans: AutohuntHandoffPlanPreview[];
  ready_handoff_plans: AutohuntHandoffPlanPreview[];
  blocked_handoff_plans: AutohuntHandoffPlanPreview[];
  insufficient_data_handoff_plans: AutohuntHandoffPlanPreview[];
  invalid_record_count: number;
  selected_candidate_summaries: AutohuntHandoffPlanPreviewCandidateSummary[];
  no_run_no_execution_boundary: AutohuntHandoffPlanPreviewAuthorityBoundary;
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
