export const CODEX_CURRENT_CONTINUITY_VERSION_V01 =
  "codex_current_continuity.v0.1" as const;
export const CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01 =
  "codex_current_continuity_snapshot.v0.1" as const;
export const CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01 =
  "codex-current-continuity-v0.1" as const;
export const CODEX_CURRENT_CONTINUITY_REQUEST_SCOPE_V01 =
  "project:augnes" as const;

export const CODEX_CURRENT_CONTINUITY_LIMITS_V01 = Object.freeze({
  goal_characters: 2_000,
  detail_items: 12,
  detail_characters: 500,
  result_summary_characters: 2_000,
  result_items: 32,
  result_item_characters: 512,
  gaps: 24,
  serialized_bytes: 64 * 1_024,
});

export type CodexCurrentContinuitySourceStatusV01 =
  | "exact"
  | "partial"
  | "unavailable";

export type CodexCurrentContinuityProjectStatusV01 =
  | "no_workspace"
  | "no_active_project"
  | "inactive_project"
  | "active_project"
  | "active_project_root_unavailable"
  | "project_source_unavailable";

export type CodexCurrentContinuityWorkStatusV01 =
  | "no_current_work"
  | "current_work"
  | "stale_current_work"
  | "current_work_unavailable"
  | "current_work_ambiguous";

export type CodexCurrentContinuityLineageKindV01 =
  | "initial_user_defined"
  | "pre_execution_user_revision"
  | "semantic_transition";

export type CodexCurrentContinuityWorkCurrentnessV01 =
  | "fresh"
  | "stale"
  | "unavailable_or_ambiguous"
  | "not_available";

export type CodexCurrentContinuityExecutionStageV01 =
  | "no_run"
  | "preparing"
  | "running"
  | "waiting_for_approval"
  | "cancellation_requested"
  | "reconciliation_required"
  | "terminal_result_ready"
  | "blocked"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "unavailable_or_inconsistent";

export type CodexCurrentContinuityResultStateV01 =
  | "no_result"
  | "result_unavailable"
  | "result_present";

export type CodexCurrentContinuityResultCurrentnessV01 =
  | "current"
  | "stale"
  | "unavailable_or_ambiguous"
  | "not_available";

export type CodexCurrentContinuityReviewStateV01 =
  | "no_proposal"
  | "proposal_present_decision_pending"
  | "decision_recorded"
  | "accepted_decision_awaiting_transition"
  | "transition_blocked"
  | "transition_applied"
  | "review_source_unavailable_or_inconsistent";

export type CodexCurrentContinuityNextActionKindV01 =
  | "choose_project"
  | "make_project_active"
  | "restore_project_root"
  | "define_work"
  | "revise_or_refresh_work"
  | "start_current_work"
  | "view_progress"
  | "review_host_approval"
  | "resume_or_reconcile_work"
  | "review_result"
  | "review_proposal"
  | "record_decision"
  | "complete_authorized_transition"
  | "understand_updated_project"
  | "no_available_action"
  | "unavailable";

export interface CodexCurrentContinuityAuthorityBoundaryV01 {
  writes_database: false;
  writes_project_files: false;
  changes_project_selection: false;
  changes_operator_session: false;
  creates_run: false;
  starts_codex_or_native_host: false;
  calls_provider: false;
  approves_host_action: false;
  cancels_or_resumes_run: false;
  creates_or_admits_result: false;
  creates_proof_or_evidence: false;
  creates_proposal: false;
  creates_review_decision: false;
  creates_or_applies_transition: false;
  mutates_accepted_state: false;
  retries_or_replays: false;
  calls_github: false;
  creates_branch_or_pr: false;
  merges_releases_or_deploys: false;
  starts_background_work: false;
}

export interface CodexCurrentContinuityArtifactV01 {
  kind: string;
  repository_relative_path: string | null;
  summary: string | null;
  change_kind: "added" | "modified" | "deleted" | "renamed" | "unknown" | null;
  basis: "observed" | "attested" | "mixed" | "unknown";
}

export interface CodexCurrentContinuityCheckV01 {
  check: string;
  status: "passed" | "failed" | "blocked" | "unknown";
  required: boolean;
  summary: string;
}

export interface CodexCurrentContinuitySkippedCheckV01 {
  check: string;
  required: boolean;
  reason: string;
}

export interface CodexCurrentContinuityV01 {
  projection_version: typeof CODEX_CURRENT_CONTINUITY_VERSION_V01;
  generated_at: string;
  source_status: CodexCurrentContinuitySourceStatusV01;
  snapshot: {
    binding_version: typeof CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01;
    algorithm: "sha256";
    status: "exact" | "unavailable";
    binding: string | null;
  };
  project: {
    status: CodexCurrentContinuityProjectStatusV01;
    project_key: string | null;
    display_name: string | null;
    active: boolean;
    selection_revision: number | null;
    root_availability:
      | "available"
      | "missing"
      | "inaccessible"
      | "not_directory"
      | "inspection_error"
      | "not_available";
  };
  current_work: {
    status: CodexCurrentContinuityWorkStatusV01;
    goal: string | null;
    success_criteria: string[];
    non_goals: string[];
    lineage_kind: CodexCurrentContinuityLineageKindV01 | null;
    currentness: CodexCurrentContinuityWorkCurrentnessV01;
    start_eligible: boolean;
    start_blocker: string | null;
    revision_eligible: boolean;
    revision_blocker: string | null;
  };
  managed_execution: {
    stage: CodexCurrentContinuityExecutionStageV01;
    mode:
      | "interactive"
      | "policy_triggered"
      | "repository_attachment"
      | "unknown"
      | null;
    latest_checkpoint: string | null;
    blocker_or_attention: string | null;
    attention_required: boolean;
    reconciliation_required: boolean;
    result_available: boolean;
    updated_at: string | null;
  };
  latest_result: {
    state: CodexCurrentContinuityResultStateV01;
    currentness: CodexCurrentContinuityResultCurrentnessV01;
    outcome: string | null;
    execution_status: string | null;
    verification_status: string | null;
    summary: string | null;
    recorded_at: string | null;
    artifacts: CodexCurrentContinuityArtifactV01[];
    checks: CodexCurrentContinuityCheckV01[];
    skipped_checks: CodexCurrentContinuitySkippedCheckV01[];
    blockers: string[];
    warnings: string[];
    gaps: string[];
    incomplete_historical_fields: string[];
    review_attention: string | null;
    proposed_next_steps: string[];
  };
  review_continuity: {
    state: CodexCurrentContinuityReviewStateV01;
    summary: string;
    decision_kind: string | null;
    transition_currentness: "current" | "blocked" | "applied" | "not_available";
  };
  next_action: {
    kind: CodexCurrentContinuityNextActionKindV01;
    label: string;
    reason: string;
    user_action_required: boolean;
    executes: false;
  };
  authority: CodexCurrentContinuityAuthorityBoundaryV01;
  gaps: string[];
}
