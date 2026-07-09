/**
 * Autohunt Work Queue Candidate v0.1 contract.
 *
 * Queue candidates are future supervised-preflight input only. They do not
 * start runners, schedule work, execute Codex, call external services, fetch
 * sources, or mutate Perspective/work/memory/proof/evidence/product state.
 */

import type {
  AutonomyDelegationGrant,
  AutonomyDelegationGrantMode,
  AutonomyDelegationGrantReadback,
  AutonomyDelegationGrantScope,
  AutonomyDelegationGrantStatus,
} from "@/types/autonomy-delegation-grant";

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND =
  "autohunt_work_queue_candidate" as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION =
  "autohunt_work_queue_candidate.v0.1" as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_KIND =
  "autohunt_work_queue_candidate_readback" as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_VERSION =
  "autohunt_work_queue_candidate_readback.v0.1" as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE =
  "autohunt_work_queue_candidates" as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_STATUSES = [
  "queued",
  "blocked",
  "deferred",
  "superseded",
  "rejected",
] as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_ORIGINS = [
  "continuity_spine_summary",
  "residual_diagnostic",
  "expected_observed_delta",
  "reuse_outcome",
  "next_work_signal",
  "no_mutation_result_record",
  "operator_supplied",
] as const;

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_AUTHORITY_FLAG_NAMES = [
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

export const AUTOHUNT_WORK_QUEUE_CANDIDATE_REQUIRED_STOP_CONDITIONS = [
  "manual_stop_requested",
  "authority_boundary_unclear",
] as const;

export type AutohuntWorkQueueCandidateStatus =
  (typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_STATUSES)[number];

export type AutohuntWorkQueueCandidateScope = AutonomyDelegationGrantScope;

export type AutohuntWorkQueueCandidateOrigin =
  (typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_ORIGINS)[number];

export type AutohuntWorkQueueCandidateAuthorityFlagName =
  (typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_AUTHORITY_FLAG_NAMES)[number];

export type AutohuntWorkQueueCandidateAuthorityBoundary = Record<
  AutohuntWorkQueueCandidateAuthorityFlagName,
  false
>;

export interface AutohuntWorkQueueCandidateSourceGrant {
  grant_id: string;
  grant_fingerprint: string;
  grant_status: AutonomyDelegationGrantStatus;
  grant_mode: AutonomyDelegationGrantMode;
}

export interface AutohuntWorkQueueCandidateBudgetProjection {
  estimated_iterations: number;
  estimated_tool_calls: number;
  estimated_codex_tasks: number;
  estimated_file_changes: number;
  estimated_draft_prs: number;
}

export interface AutohuntWorkQueueCandidateGrantFit {
  work_class_allowed: boolean;
  file_scope_allowed: boolean;
  forbidden_actions_absent: boolean;
  budget_within_grant: boolean;
  stop_conditions_present: boolean;
  source_freshness_ok: boolean;
  passed: boolean;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntWorkQueueCandidatePersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_queue_policy: true;
  persists_raw_prompt: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntWorkQueueCandidateValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  active_grant_verified: boolean;
  grant_fingerprint_verified: boolean;
  grant_validation_passed: boolean;
  work_class_allowed: boolean;
  file_scope_allowed: boolean;
  forbidden_actions_absent: boolean;
  budget_within_grant: boolean;
  required_stop_conditions_present: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
  candidate_fingerprint?: string | null;
}

export interface AutohuntWorkQueueCandidateRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutohuntWorkQueueCandidateRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntWorkQueueCandidateRowCountObservation[];
}

export interface AutohuntWorkQueueCandidate {
  queue_candidate_kind: typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND;
  queue_candidate_version: typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION;
  candidate_id: string;
  scope: AutohuntWorkQueueCandidateScope;
  created_at: string;
  candidate_status: AutohuntWorkQueueCandidateStatus;
  candidate_origin: AutohuntWorkQueueCandidateOrigin;
  source_grant: AutohuntWorkQueueCandidateSourceGrant;
  work_class: string;
  title: string;
  summary: string;
  title_summary_fingerprint: string;
  idempotency_key: string;
  source_refs: string[];
  source_fingerprints: string[];
  evidence_refs: string[];
  required_context_refs: string[];
  proposed_files_or_globs: string[];
  expected_outputs: string[];
  required_checks: string[];
  blocked_actions: string[];
  stop_conditions: string[];
  budget_projection: AutohuntWorkQueueCandidateBudgetProjection;
  grant_fit: AutohuntWorkQueueCandidateGrantFit;
  authority_boundary: AutohuntWorkQueueCandidateAuthorityBoundary;
  persisted_material_boundary: AutohuntWorkQueueCandidatePersistedMaterialBoundary;
  validation: AutohuntWorkQueueCandidateValidation;
  row_count_write_summary: AutohuntWorkQueueCandidateRowCountWriteSummary;
  candidate_fingerprint: string;
}

export type AutohuntWorkQueueCandidateSourceGrantInput =
  | AutonomyDelegationGrant
  | AutonomyDelegationGrantReadback
  | AutohuntWorkQueueCandidateSourceGrant
  | null
  | undefined;

export type AutohuntWorkQueueCandidateInput = Omit<
  AutohuntWorkQueueCandidate,
  | "queue_candidate_kind"
  | "queue_candidate_version"
  | "candidate_id"
  | "created_at"
  | "candidate_status"
  | "source_grant"
  | "title_summary_fingerprint"
  | "idempotency_key"
  | "grant_fit"
  | "authority_boundary"
  | "persisted_material_boundary"
  | "validation"
  | "row_count_write_summary"
  | "candidate_fingerprint"
> & {
  source_grant: AutohuntWorkQueueCandidateSourceGrantInput;
  created_at?: string;
  candidate_status?: AutohuntWorkQueueCandidateStatus;
  proposed_actions?: string[];
  candidate_input?: unknown;
  validation?: Partial<AutohuntWorkQueueCandidateValidation>;
};

export type AutohuntWorkQueueCandidateWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntWorkQueueCandidateWriteResult {
  ok: boolean;
  result_status: AutohuntWorkQueueCandidateWriteStatus;
  refusal_reasons: string[];
  candidate: AutohuntWorkQueueCandidate | null;
  duplicate_replayed: boolean;
  queue_candidate_record_written: boolean;
  row_count_write_summary: AutohuntWorkQueueCandidateRowCountWriteSummary | null;
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

export type AutohuntWorkQueueCandidateReadbackSelectionStatus =
  | "selected_queued_candidates"
  | "selected_by_candidate_id"
  | "candidate_id_not_found"
  | "no_queued_candidates"
  | "no_candidates";

export type AutohuntWorkQueueCandidateStatusBreakdown = Record<
  AutohuntWorkQueueCandidateStatus,
  number
>;

export interface AutohuntWorkQueueCandidateSelectedSummary {
  selected_queued_count: number;
  latest_candidate_id: string | null;
  latest_source_grant_id: string | null;
  latest_source_grant_fingerprint: string | null;
  latest_origin: AutohuntWorkQueueCandidateOrigin | null;
  latest_work_class: string | null;
  latest_title_summary_fingerprint: string | null;
  invalid_record_count: number;
  authority_boundary_all_false: boolean;
}

export interface AutohuntWorkQueueCandidateReadback {
  readback_kind: typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_KIND;
  readback_version: typeof AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_VERSION;
  scope: AutohuntWorkQueueCandidateScope;
  source_grant_id_filter: string | null;
  candidate_status_filter: AutohuntWorkQueueCandidateStatus | null;
  candidate_origin_filter: AutohuntWorkQueueCandidateOrigin | null;
  work_class_filter: string | null;
  candidate_id_filter: string | null;
  selection_status: AutohuntWorkQueueCandidateReadbackSelectionStatus;
  selected_candidate: AutohuntWorkQueueCandidate | null;
  selected_candidate_summary: AutohuntWorkQueueCandidateSelectedSummary | null;
  selected_queued_candidates: AutohuntWorkQueueCandidate[];
  candidates: AutohuntWorkQueueCandidate[];
  all_candidates: AutohuntWorkQueueCandidate[];
  queued_candidates: AutohuntWorkQueueCandidate[];
  blocked_candidates: AutohuntWorkQueueCandidate[];
  deferred_candidates: AutohuntWorkQueueCandidate[];
  rejected_candidates: AutohuntWorkQueueCandidate[];
  superseded_candidates: AutohuntWorkQueueCandidate[];
  status_breakdown: AutohuntWorkQueueCandidateStatusBreakdown;
  invalid_record_count: number;
  grant_fit_blocker_reasons: string[];
  grant_fit_warning_reasons: string[];
  no_run_no_execution_boundary: AutohuntWorkQueueCandidateAuthorityBoundary;
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
