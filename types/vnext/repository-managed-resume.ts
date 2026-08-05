import type { LiveNativeHostRunProjectionV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { RepositoryExecutionDecisionRequestProjectionV01 } from "./repository-execution";

export const REPOSITORY_MANAGED_RESUME_PREPARATION_VERSION_V01 =
  "repository_managed_resume_preparation.v0.1" as const;
export const REPOSITORY_MANAGED_RESUME_VERSION_V01 =
  "repository_managed_resume.v0.1" as const;
export const REPOSITORY_MANAGED_RESUME_ATTEMPT_VERSION_V01 =
  "repository_managed_resume_attempt.v0.1" as const;
export const REPOSITORY_MANAGED_RESUME_RUNTIME_CLAIM_VERSION_V01 =
  "repository_managed_resume_runtime_claim.v0.1" as const;
export const REPOSITORY_MANAGED_RESUME_CANCELLATION_VERSION_V01 =
  "repository_managed_resume_cancellation.v0.1" as const;
export const NATIVE_HOST_REPOSITORY_RESUME_CONTEXT_VERSION_V01 =
  "native_host_repository_resume_context.v0.1" as const;

export type RepositoryManagedResumeAttemptStateV01 =
  | "admitted_not_invoked"
  | "provider_resume_invocation_started"
  | "controller_owned"
  | "settled"
  | "reconciliation_required";

/** Private, machine-local invocation history. Never expose this record in ordinary copy. */
export interface RepositoryManagedResumeAttemptV01 {
  attempt_version: typeof REPOSITORY_MANAGED_RESUME_ATTEMPT_VERSION_V01;
  attempt_fingerprint: string;
  workspace_id: string;
  project_id: string;
  run_id: string;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  checkpoint_fingerprint: string;
  checkpoint_version: "repository_run_resume_checkpoint.v0.1";
  prior_controller_generation: number;
  resumed_controller_generation: number;
  decision_request_fingerprint: string;
  decision_grant_fingerprint: string;
  expected_state_fingerprint: string;
  admitted_run_control_revision: number;
  admitted_step_control_revision: number;
  runtime_instance_fingerprint: string;
  runtime_generation_fingerprint: string;
  attempt_state: RepositoryManagedResumeAttemptStateV01;
  final_outcome: "completed" | "failed" | "cancelled" | "timed_out" | null;
  admitted_at: string;
  provider_invocation_started_at: string | null;
  settled_at: string | null;
  updated_at: string;
}

/** Private, machine-local current execution claim. It is mutable; the attempt is not. */
export interface RepositoryManagedResumeRuntimeClaimV01 {
  claim_version: typeof REPOSITORY_MANAGED_RESUME_RUNTIME_CLAIM_VERSION_V01;
  attempt_fingerprint: string;
  runtime_instance_fingerprint: string;
  runtime_generation_fingerprint: string;
  claim_revision: number;
  claim_lifecycle: "claimed" | "invocation_started" | "released" | "cancelled";
  claimed_at: string;
  updated_at: string;
}

/** Private exact cancellation intent when provider stop is not yet confirmed. */
export interface RepositoryManagedResumeCancellationV01 {
  cancellation_version: typeof REPOSITORY_MANAGED_RESUME_CANCELLATION_VERSION_V01;
  attempt_fingerprint: string;
  workspace_id: string;
  project_id: string;
  run_id: string;
  attachment_id: string;
  controller_generation: number;
  cancellation_requested_at: string;
  cancellation_control_revision: number;
  provider_stop_confirmed: 0 | 1;
  resume_reacquisition_forbidden: 1;
  cancellation_signal_sent: 0 | 1;
  updated_at: string;
}

export interface RepositoryManagedResumeExpectedStateV01 {
  expected_state_version: "repository_managed_resume_expected_state.v0.1";
  action: "resume_repository_managed_delegation";
  workspace_id: string;
  project_id: string;
  run_id: string;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  attachment_lifecycle: "consumed";
  checkpoint_fingerprint: string;
  checkpoint_version: "repository_run_resume_checkpoint.v0.1";
  checkpoint_event_high_water_mark: number;
  checkpoint_step_high_water_mark: number;
  checkpoint_effect_high_water_mark: number;
  run_control_revision: number;
  step_control_revision: number;
  prior_controller_generation: number;
  expected_next_controller_generation: number;
  execution_envelope_fingerprint: string;
  adapter_version: string;
  capability_version: string;
  provider_resume_binding_version: "native_host_resume_binding.v0.1";
  provider_thread_binding_fingerprint: string;
  provider_turn_binding_fingerprint: string;
  root_binding_fingerprint: string;
  physical_root_baseline_fingerprint: string;
  packet_id: string;
  packet_fingerprint: string;
  current_work_fingerprint: string;
  checkpoint_worktree_fingerprint: string;
  runtime_instance_fingerprint: string;
  runtime_generation_fingerprint: string;
  platform: "darwin";
  resume_mode: "explicit_same_run";
  requested_at: string;
  expires_at: string;
}

export interface RepositoryManagedResumeAuthorityV01 {
  decision_request_created: boolean;
  decision_grant_consumed: boolean;
  resume_attempt_created: boolean;
  controller_generation_created: boolean;
  worker_started: boolean;
  provider_resume_may_occur: boolean;
  provider_thread_start_allowed: false;
  new_run_or_attachment_allowed: false;
  arbitrary_network_access_granted: false;
  github_authority_granted: false;
  release_authority_granted: false;
  semantic_authority_granted: false;
  approval_decided: false;
  review_decision_created: false;
  transition_created: false;
  accepted_state_mutated: false;
  work_closed: false;
}

export interface RepositoryManagedResumePreparationV01 {
  preparation_version: typeof REPOSITORY_MANAGED_RESUME_PREPARATION_VERSION_V01;
  status:
    | "decision_required"
    | "active_owned"
    | "approval_pending"
    | "terminal"
    | "reconciliation_required"
    | "stale"
    | "unsupported"
    | "blocked";
  ordinary_text: string;
  project: { project_id: string; display_name: string | null } | null;
  run_id: string | null;
  attachment_id: string | null;
  attachment_binding_fingerprint: string | null;
  expected_controller_generation: number | null;
  expected_run_control_revision: number | null;
  expected_state_fingerprint: string | null;
  decision_request: RepositoryExecutionDecisionRequestProjectionV01 | null;
  expires_at: string | null;
  authority: RepositoryManagedResumeAuthorityV01;
}

export interface RepositoryManagedResumeResultV01 {
  resume_version: typeof REPOSITORY_MANAGED_RESUME_VERSION_V01;
  status:
    | "accepted"
    | "exact_replay"
    | "active_owned"
    | "approval_pending"
    | "blocked"
    | "reconciliation_required";
  ordinary_text: string;
  run_id: string;
  attachment_id: string;
  controller_generation: number;
  projection: LiveNativeHostRunProjectionV01;
  authority: RepositoryManagedResumeAuthorityV01;
}
