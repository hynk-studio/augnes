/**
 * Supervised Autohunt Preflight Packet v0.1 contract.
 *
 * A preflight packet is a dry-run readiness artifact for future supervised
 * Autohunt handoff planning. It does not start runners, schedule work, execute
 * Codex, call external services, fetch sources, or mutate durable product
 * state outside the packet record.
 */

import type {
  AutonomyDelegationGrant,
  AutonomyDelegationGrantMode,
  AutonomyDelegationGrantReadback,
  AutonomyDelegationGrantScope,
  AutonomyDelegationGrantStatus,
} from "@/types/autonomy-delegation-grant";
import type {
  AutohuntWorkQueueCandidate,
  AutohuntWorkQueueCandidateBudgetProjection,
  AutohuntWorkQueueCandidateGrantFit,
  AutohuntWorkQueueCandidateOrigin,
  AutohuntWorkQueueCandidateReadback,
} from "@/types/autohunt-work-queue-candidate";

export const AUTOHUNT_PREFLIGHT_PACKET_KIND =
  "autohunt_preflight_packet" as const;

export const AUTOHUNT_PREFLIGHT_PACKET_VERSION =
  "autohunt_preflight_packet.v0.1" as const;

export const AUTOHUNT_PREFLIGHT_PACKET_READBACK_KIND =
  "autohunt_preflight_packet_readback" as const;

export const AUTOHUNT_PREFLIGHT_PACKET_READBACK_VERSION =
  "autohunt_preflight_packet_readback.v0.1" as const;

export const AUTOHUNT_PREFLIGHT_PACKET_TABLE =
  "autohunt_preflight_packets" as const;

export const AUTOHUNT_PREFLIGHT_PACKET_STATUSES = [
  "ready_for_supervised_handoff_planning",
  "blocked",
  "insufficient_data",
  "no_queued_candidates",
  "source_grant_inactive",
  "budget_exceeded",
  "forbidden_action_detected",
  "file_scope_blocked",
  "required_check_missing",
  "stop_condition_missing",
  "stale_or_missing_source",
] as const;

export const AUTOHUNT_PREFLIGHT_PACKET_NEXT_ALLOWED_OUTPUTS = [
  "supervised_codex_prompt_plan",
  "draft_pr_plan",
  "operator_review_packet",
  "preflight_report",
] as const;

export const AUTOHUNT_PREFLIGHT_PACKET_FORBIDDEN_OUTPUTS = [
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

export const AUTOHUNT_PREFLIGHT_PACKET_AUTHORITY_FLAG_NAMES = [
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

export const AUTOHUNT_PREFLIGHT_PACKET_REQUIRED_STOP_CONDITIONS = [
  "manual_stop_requested",
  "authority_boundary_unclear",
] as const;

export type AutohuntPreflightPacketStatus =
  (typeof AUTOHUNT_PREFLIGHT_PACKET_STATUSES)[number];

export type AutohuntPreflightPacketScope = AutonomyDelegationGrantScope;

export type AutohuntPreflightPacketNextAllowedOutput =
  (typeof AUTOHUNT_PREFLIGHT_PACKET_NEXT_ALLOWED_OUTPUTS)[number];

export type AutohuntPreflightPacketForbiddenOutput =
  (typeof AUTOHUNT_PREFLIGHT_PACKET_FORBIDDEN_OUTPUTS)[number];

export type AutohuntPreflightPacketAuthorityFlagName =
  (typeof AUTOHUNT_PREFLIGHT_PACKET_AUTHORITY_FLAG_NAMES)[number];

export type AutohuntPreflightPacketAuthorityBoundary = Record<
  AutohuntPreflightPacketAuthorityFlagName,
  false
>;

export interface AutohuntPreflightPacketSourceGrant {
  grant_id: string;
  grant_fingerprint: string;
  grant_status: AutonomyDelegationGrantStatus;
  grant_mode: AutonomyDelegationGrantMode;
}

export interface AutohuntPreflightPacketSourceQueueReadback {
  queued_candidate_count: number;
  selected_candidate_ids: string[];
  selected_candidate_fingerprints: string[];
  invalid_candidate_count: number;
}

export interface AutohuntPreflightPacketSelectedCandidateSummary {
  candidate_id: string;
  candidate_fingerprint: string;
  candidate_origin: AutohuntWorkQueueCandidateOrigin;
  work_class: string;
  title_summary_fingerprint: string;
  source_refs: string[];
  source_fingerprints: string[];
  proposed_files_or_globs: string[];
  expected_outputs: string[];
  required_checks: string[];
  budget_projection: AutohuntWorkQueueCandidateBudgetProjection;
  grant_fit: AutohuntWorkQueueCandidateGrantFit;
}

export interface AutohuntPreflightPacketAggregateBudgetProjection {
  estimated_iterations: number;
  estimated_tool_calls: number;
  estimated_codex_tasks: number;
  estimated_file_changes: number;
  estimated_draft_prs: number;
}

export interface AutohuntPreflightPacketGrantBudgetRemainingProjection {
  remaining_iterations: number;
  remaining_tool_calls: number;
  remaining_codex_tasks: number;
  remaining_file_changes: number;
  remaining_draft_prs: number;
}

export interface AutohuntPreflightPacketChecks {
  source_grant_active: boolean;
  source_grant_fingerprint_verified: boolean;
  candidate_fingerprints_verified: boolean;
  candidate_status_all_queued: boolean;
  work_classes_allowed: boolean;
  file_scope_allowed: boolean;
  forbidden_actions_absent: boolean;
  budget_within_grant: boolean;
  required_checks_present: boolean;
  stop_conditions_present: boolean;
  source_freshness_ok: boolean;
  raw_material_absent: boolean;
  passed: boolean;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntPreflightPacketPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_preflight_policy: true;
  persists_raw_prompt: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntPreflightPacketValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  source_grant_active: boolean;
  source_grant_fingerprint_verified: boolean;
  source_grant_validation_passed: boolean;
  candidate_count_positive: boolean;
  candidate_fingerprints_verified: boolean;
  candidate_status_all_queued: boolean;
  candidate_grant_binding_verified: boolean;
  candidate_grant_fit_passed: boolean;
  candidate_validation_passed: boolean;
  aggregate_budget_within_grant: boolean;
  file_scope_allowed: boolean;
  forbidden_actions_absent: boolean;
  required_checks_present: boolean;
  required_stop_conditions_present: boolean;
  source_freshness_ok: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
  preflight_packet_fingerprint?: string | null;
}

export interface AutohuntPreflightPacketRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutohuntPreflightPacketRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_PREFLIGHT_PACKET_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntPreflightPacketRowCountObservation[];
}

export interface AutohuntPreflightPacket {
  preflight_packet_kind: typeof AUTOHUNT_PREFLIGHT_PACKET_KIND;
  preflight_packet_version: typeof AUTOHUNT_PREFLIGHT_PACKET_VERSION;
  preflight_packet_id: string;
  scope: AutohuntPreflightPacketScope;
  created_at: string;
  preflight_status: AutohuntPreflightPacketStatus;
  source_grant: AutohuntPreflightPacketSourceGrant;
  source_queue_readback: AutohuntPreflightPacketSourceQueueReadback;
  selected_candidates: AutohuntPreflightPacketSelectedCandidateSummary[];
  aggregate_budget_projection: AutohuntPreflightPacketAggregateBudgetProjection;
  grant_budget_remaining_projection: AutohuntPreflightPacketGrantBudgetRemainingProjection;
  preflight_checks: AutohuntPreflightPacketChecks;
  blocked_actions: string[];
  stop_conditions: string[];
  required_checks: string[];
  next_allowed_outputs: AutohuntPreflightPacketNextAllowedOutput[];
  forbidden_outputs: AutohuntPreflightPacketForbiddenOutput[];
  authority_boundary: AutohuntPreflightPacketAuthorityBoundary;
  persisted_material_boundary: AutohuntPreflightPacketPersistedMaterialBoundary;
  validation: AutohuntPreflightPacketValidation;
  row_count_write_summary: AutohuntPreflightPacketRowCountWriteSummary;
  idempotency_key: string;
  preflight_packet_fingerprint: string;
}

export type AutohuntPreflightPacketSourceGrantInput =
  | AutonomyDelegationGrant
  | AutonomyDelegationGrantReadback
  | AutohuntPreflightPacketSourceGrant
  | null
  | undefined;

export type AutohuntPreflightPacketSourceQueueInput =
  | AutohuntWorkQueueCandidateReadback
  | AutohuntWorkQueueCandidate[]
  | null
  | undefined;

export interface AutohuntPreflightPacketInput {
  scope: AutohuntPreflightPacketScope;
  source_grant: AutohuntPreflightPacketSourceGrantInput;
  source_queue?: AutohuntPreflightPacketSourceQueueInput;
  candidates?: AutohuntWorkQueueCandidate[];
  candidate_input?: unknown;
}

export type AutohuntPreflightPacketWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntPreflightPacketWriteResult {
  ok: boolean;
  result_status: AutohuntPreflightPacketWriteStatus;
  refusal_reasons: string[];
  preflight_packet: AutohuntPreflightPacket | null;
  duplicate_replayed: boolean;
  preflight_packet_record_written: boolean;
  row_count_write_summary: AutohuntPreflightPacketRowCountWriteSummary | null;
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

export type AutohuntPreflightPacketReadbackSelectionStatus =
  | "selected_latest_ready_preflight_packet"
  | "selected_by_preflight_packet_id"
  | "preflight_packet_id_not_found"
  | "no_ready_preflight_packet"
  | "no_preflight_packets";

export interface AutohuntPreflightPacketSelectedSummary {
  preflight_packet_id: string;
  preflight_status: AutohuntPreflightPacketStatus;
  source_grant_id: string;
  source_grant_fingerprint: string;
  selected_candidate_count: number;
  aggregate_budget_summary: string;
  blocker_count: number;
  warning_count: number;
  authority_boundary_all_false: boolean;
}

export interface AutohuntPreflightPacketReadback {
  readback_kind: typeof AUTOHUNT_PREFLIGHT_PACKET_READBACK_KIND;
  readback_version: typeof AUTOHUNT_PREFLIGHT_PACKET_READBACK_VERSION;
  scope: AutohuntPreflightPacketScope;
  source_grant_id_filter: string | null;
  candidate_id_filter: string | null;
  preflight_status_filter: AutohuntPreflightPacketStatus | null;
  preflight_packet_id_filter: string | null;
  selection_status: AutohuntPreflightPacketReadbackSelectionStatus;
  selected_preflight_packet: AutohuntPreflightPacket | null;
  selected_preflight_packet_summary: AutohuntPreflightPacketSelectedSummary | null;
  latest_ready_preflight_packet: AutohuntPreflightPacket | null;
  preflight_packets: AutohuntPreflightPacket[];
  all_preflight_packets: AutohuntPreflightPacket[];
  ready_preflight_packets: AutohuntPreflightPacket[];
  blocked_preflight_packets: AutohuntPreflightPacket[];
  insufficient_data_preflight_packets: AutohuntPreflightPacket[];
  no_queued_candidates_preflight_packets: AutohuntPreflightPacket[];
  invalid_record_count: number;
  preflight_blocker_reasons: string[];
  preflight_warning_reasons: string[];
  aggregate_budget_projection: AutohuntPreflightPacketAggregateBudgetProjection | null;
  selected_candidate_summaries: AutohuntPreflightPacketSelectedCandidateSummary[];
  no_run_no_execution_boundary: AutohuntPreflightPacketAuthorityBoundary;
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
