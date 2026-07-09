import type {
  AutohuntHandoffCopyExportPreview,
  AutohuntHandoffCopyExportPreviewStatus,
} from "@/types/autohunt-handoff-copy-export-preview";
import type {
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
  AutohuntHandoffPlanOperatorReviewDecisionStatus,
} from "@/types/autohunt-handoff-plan-operator-review-decision";
import type { AutohuntHandoffPlanPreviewReadback } from "@/types/autohunt-handoff-plan-preview";
import type { AutohuntWorkbenchReadbackSpine } from "@/types/autohunt-workbench-readback-spine";

export const AUTOHUNT_EXECUTION_READINESS_GATE_KIND =
  "autohunt_execution_readiness_gate" as const;

export const AUTOHUNT_EXECUTION_READINESS_GATE_VERSION =
  "autohunt_execution_readiness_gate.v0.1" as const;

export const AUTOHUNT_EXECUTION_READINESS_GATE_STATUSES = [
  "ready_for_future_supervised_execution_design",
  "blocked",
  "insufficient_data",
  "missing_active_grant",
  "missing_queued_candidate",
  "missing_ready_preflight",
  "missing_ready_workbench_spine",
  "missing_ready_handoff_plan",
  "missing_accepted_operator_decision",
  "missing_copy_export_preview",
  "copy_export_preview_not_ready",
  "dogfood_seed_not_verified",
  "authority_boundary_not_clear",
  "unsafe_material_detected",
] as const;

export const AUTOHUNT_EXECUTION_READINESS_FUTURE_DESIGN_REQUIREMENTS = [
  "explicit_user_reconfirmation_required",
  "fresh_grant_required",
  "fresh_preflight_required",
  "fresh_operator_approval_required",
  "manual_stop_condition_required",
  "budget_limit_required",
  "max_pr_limit_required",
  "branch_pr_creation_must_be_separate_authority",
  "merge_deploy_must_remain_forbidden",
  "external_calls_must_remain_forbidden_unless_separately_approved",
  "result_intake_required",
  "expected_observed_delta_required",
  "reuse_outcome_required",
  "residual_diagnostic_required",
] as const;

export const AUTOHUNT_EXECUTION_READINESS_ALLOWED_NEXT_DESIGN_OUTPUTS = [
  "supervised_runner_design_prompt",
  "execution_contract_design",
  "launch_guard_design",
  "result_intake_design",
] as const;

export const AUTOHUNT_EXECUTION_READINESS_FORBIDDEN_CURRENT_OUTPUTS = [
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

export const AUTOHUNT_EXECUTION_READINESS_AUTHORITY_FLAG_NAMES = [
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

export type AutohuntExecutionReadinessGateStatus =
  (typeof AUTOHUNT_EXECUTION_READINESS_GATE_STATUSES)[number];

export type AutohuntExecutionReadinessGateScope = "project:augnes";

export type AutohuntExecutionReadinessFutureDesignRequirement =
  (typeof AUTOHUNT_EXECUTION_READINESS_FUTURE_DESIGN_REQUIREMENTS)[number];

export type AutohuntExecutionReadinessAllowedNextDesignOutput =
  (typeof AUTOHUNT_EXECUTION_READINESS_ALLOWED_NEXT_DESIGN_OUTPUTS)[number];

export type AutohuntExecutionReadinessForbiddenCurrentOutput =
  (typeof AUTOHUNT_EXECUTION_READINESS_FORBIDDEN_CURRENT_OUTPUTS)[number];

export type AutohuntExecutionReadinessAuthorityFlagName =
  (typeof AUTOHUNT_EXECUTION_READINESS_AUTHORITY_FLAG_NAMES)[number];

export type AutohuntExecutionReadinessAuthorityBoundary = Record<
  AutohuntExecutionReadinessAuthorityFlagName,
  false
>;

export interface AutohuntExecutionReadinessSourceChainSummary {
  active_grant_id: string | null;
  active_grant_fingerprint: string | null;
  queued_candidate_count: number;
  latest_queued_candidate_id: string | null;
  latest_queued_candidate_fingerprint: string | null;
  ready_preflight_packet_id: string | null;
  ready_preflight_packet_fingerprint: string | null;
  workbench_spine_fingerprint: string | null;
  workbench_spine_status: string | null;
  handoff_plan_id: string | null;
  handoff_plan_fingerprint: string | null;
  operator_decision_id: string | null;
  operator_decision_fingerprint: string | null;
  operator_decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
  copy_export_preview_fingerprint: string | null;
  copy_export_preview_status: AutohuntHandoffCopyExportPreviewStatus | null;
}

export interface AutohuntExecutionReadinessChecks {
  active_grant_present: boolean;
  queued_candidate_present: boolean;
  ready_preflight_present: boolean;
  workbench_spine_ready: boolean;
  handoff_plan_ready: boolean;
  operator_decision_accepted: boolean;
  operator_decision_scope_limited: boolean;
  copy_export_preview_ready: boolean;
  source_chain_bindings_present: boolean;
  dogfood_seed_report_present: boolean;
  dogfood_seed_report_ready: boolean;
  authority_boundaries_all_false: boolean;
  export_boundary_passive: boolean;
  raw_material_absent: boolean;
  checks_passed: boolean;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntExecutionReadinessMaterialBoundary {
  raw_material_persisted: false;
  raw_prompt_text_persisted: false;
  raw_copy_text_persisted: false;
  raw_pr_body_persisted: false;
  raw_operator_note_persisted: false;
  raw_source_payload_persisted: false;
  secret_or_token_persisted: false;
  url_or_env_value_persisted: false;
}

export interface AutohuntExecutionReadinessGate {
  readiness_gate_kind: typeof AUTOHUNT_EXECUTION_READINESS_GATE_KIND;
  readiness_gate_version: typeof AUTOHUNT_EXECUTION_READINESS_GATE_VERSION;
  scope: AutohuntExecutionReadinessGateScope;
  as_of: string;
  readiness_status: AutohuntExecutionReadinessGateStatus;
  source_chain_summary: AutohuntExecutionReadinessSourceChainSummary;
  readiness_checks: AutohuntExecutionReadinessChecks;
  future_execution_design_requirements: AutohuntExecutionReadinessFutureDesignRequirement[];
  allowed_next_design_outputs: AutohuntExecutionReadinessAllowedNextDesignOutput[];
  forbidden_current_outputs: AutohuntExecutionReadinessForbiddenCurrentOutput[];
  authority_boundary: AutohuntExecutionReadinessAuthorityBoundary;
  material_boundary: AutohuntExecutionReadinessMaterialBoundary;
  gate_fingerprint: string;
}

export interface AutohuntExecutionReadinessDogfoodSeedReport {
  ok?: boolean;
  selected_statuses?: {
    grant?: string | null;
    queue_candidate?: string | null;
    preflight_packet?: string | null;
    workbench_spine?: string | null;
    handoff_plan?: string | null;
    operator_decision?: string | null;
    approval_scope?: string | null;
  } | null;
  readback_selections?: Record<string, boolean> | null;
  no_run_no_execution_boundary?: Record<string, boolean> | null;
  raw_material_persisted_any?: boolean | null;
  no_external_or_execution_authority?: boolean | null;
}

export interface AutohuntExecutionReadinessGateInput {
  workbench_spine: AutohuntWorkbenchReadbackSpine | null | undefined;
  handoff_plan_readback: AutohuntHandoffPlanPreviewReadback | null | undefined;
  operator_decision_readback:
    | AutohuntHandoffPlanOperatorReviewDecisionReadback
    | null
    | undefined;
  copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
  local_dogfood_seed_report?: AutohuntExecutionReadinessDogfoodSeedReport | null;
  as_of?: string;
  raw_material_probe?: unknown;
}
