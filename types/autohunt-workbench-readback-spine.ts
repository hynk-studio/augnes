import type {
  AutonomyDelegationGrantMode,
  AutonomyDelegationGrantScope,
  AutonomyDelegationGrantStatus,
} from "@/types/autonomy-delegation-grant";
import type {
  AutohuntPreflightPacketAggregateBudgetProjection,
  AutohuntPreflightPacketNextAllowedOutput,
  AutohuntPreflightPacketStatus,
} from "@/types/autohunt-preflight-packet";

export const AUTOHUNT_WORKBENCH_READBACK_SPINE_KIND =
  "autohunt_workbench_readback_spine" as const;

export const AUTOHUNT_WORKBENCH_READBACK_SPINE_VERSION =
  "autohunt_workbench_readback_spine.v0.1" as const;

export const AUTOHUNT_WORKBENCH_READBACK_SPINE_STATUSES = [
  "ready_for_supervised_handoff_planning",
  "missing_grant",
  "no_queued_candidates",
  "missing_preflight_packet",
  "blocked",
  "invalid_record_attention",
  "insufficient_data",
] as const;

export const AUTOHUNT_WORKBENCH_READBACK_SPINE_NEXT_ALLOWED_OUTPUTS = [
  "supervised_codex_prompt_plan",
  "draft_pr_plan",
  "operator_review_packet",
  "preflight_report",
] as const;

export const AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS = [
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

export const AUTOHUNT_WORKBENCH_READBACK_SPINE_AUTHORITY_FLAG_NAMES = [
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

export type AutohuntWorkbenchReadbackSpineStatus =
  (typeof AUTOHUNT_WORKBENCH_READBACK_SPINE_STATUSES)[number];

export type AutohuntWorkbenchReadbackSpineScope = AutonomyDelegationGrantScope;

export type AutohuntWorkbenchReadbackSpineBlockedAction =
  (typeof AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS)[number];

export type AutohuntWorkbenchReadbackSpineAuthorityFlagName =
  (typeof AUTOHUNT_WORKBENCH_READBACK_SPINE_AUTHORITY_FLAG_NAMES)[number];

export type AutohuntWorkbenchReadbackSpineAuthorityBoundary = Record<
  AutohuntWorkbenchReadbackSpineAuthorityFlagName,
  false
>;

export interface AutohuntWorkbenchReadbackSpineGrantBudgetSummary {
  time_limit_minutes: number;
  max_iterations: number;
  max_tool_calls: number;
  max_codex_tasks: number;
  max_draft_prs: number;
  max_file_changes: number;
  max_changed_files_per_pr: number;
}

export interface AutohuntWorkbenchReadbackSpineLatestActiveGrantSummary {
  grant_id: string | null;
  grant_fingerprint: string | null;
  grant_status: AutonomyDelegationGrantStatus | null;
  grant_mode: AutonomyDelegationGrantMode | null;
  approval_ref: string | null;
  approval_text_fingerprint: string | null;
  budget_summary: AutohuntWorkbenchReadbackSpineGrantBudgetSummary | null;
  invalid_grant_count: number;
}

export interface AutohuntWorkbenchReadbackSpineQueuedCandidateSummary {
  queued_candidate_count: number;
  latest_candidate_id: string | null;
  latest_candidate_fingerprint: string | null;
  origins: string[];
  work_classes: string[];
  invalid_candidate_count: number;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntWorkbenchReadbackSpineReadyPreflightSummary {
  preflight_packet_id: string | null;
  preflight_packet_fingerprint: string | null;
  preflight_status: AutohuntPreflightPacketStatus | null;
  selected_candidate_count: number;
  aggregate_budget_projection: AutohuntPreflightPacketAggregateBudgetProjection | null;
  blocker_reasons: string[];
  warning_reasons: string[];
  invalid_packet_count: number;
}

export interface AutohuntWorkbenchReadbackSpineChainBinding {
  grant_to_candidates_bound: boolean;
  candidates_to_preflight_bound: boolean;
  grant_fingerprint_matches: boolean;
  candidate_fingerprints_match: boolean;
  selected_candidate_ids: string[];
  selected_candidate_fingerprints: string[];
}

export interface AutohuntWorkbenchReadbackSpine {
  spine_kind: typeof AUTOHUNT_WORKBENCH_READBACK_SPINE_KIND;
  spine_version: typeof AUTOHUNT_WORKBENCH_READBACK_SPINE_VERSION;
  scope: AutohuntWorkbenchReadbackSpineScope;
  as_of: string;
  spine_status: AutohuntWorkbenchReadbackSpineStatus;
  latest_active_grant_summary: AutohuntWorkbenchReadbackSpineLatestActiveGrantSummary;
  queued_candidate_summary: AutohuntWorkbenchReadbackSpineQueuedCandidateSummary;
  ready_preflight_summary: AutohuntWorkbenchReadbackSpineReadyPreflightSummary;
  chain_binding: AutohuntWorkbenchReadbackSpineChainBinding;
  next_allowed_outputs: AutohuntPreflightPacketNextAllowedOutput[];
  blocked_actions: AutohuntWorkbenchReadbackSpineBlockedAction[];
  authority_boundary: AutohuntWorkbenchReadbackSpineAuthorityBoundary;
  raw_material_persisted: false;
  spine_fingerprint: string;
}
