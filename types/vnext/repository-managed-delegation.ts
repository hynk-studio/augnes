import type { RepositoryExecutionDecisionRequestProjectionV01 } from "./repository-execution";
import type { LiveNativeHostRunProjectionV01 } from "@/lib/vnext/runtime/live-native-host-run-service";

export const REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01 =
  "repository_execution_envelope.v0.1" as const;
export const REPOSITORY_MANAGED_DELEGATION_START_VERSION_V01 =
  "repository_managed_delegation_start.v0.1" as const;

export interface RepositoryExecutionEnvelopeV01 {
  envelope_version: typeof REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01;
  platform: "darwin";
  run_mode: "repository_attachment";
  filesystem_scope: "exact_repository_root";
  network_scope: "provider_egress_only";
  provider_egress: "forbidden" | "native_host_managed";
  timeout_ms: number;
  stop_settle_timeout_ms: number;
  budgets: {
    max_changed_files: number;
    max_artifacts: number;
    max_commands: number;
    max_checks: number;
    max_correction_attempts: 1;
  };
  allowed_operation_categories: string[];
  forbidden_operation_categories: string[];
  protected_untracked_paths_fingerprint: string;
  adapter_version: string;
  capability_version: string;
  envelope_fingerprint: string;
}

export interface RepositoryManagedDelegationExpectedStateV01 {
  expected_state_version: "repository_managed_delegation_expected_state.v0.1";
  action: "start_repository_managed_delegation";
  workspace_id: string;
  project_id: string;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  expected_attachment_lifecycle: "prepared";
  node_scope_fingerprint: string;
  physical_root_baseline_fingerprint: string;
  root_binding_fingerprint: string;
  task_context_packet_id: string;
  task_context_packet_fingerprint: string;
  current_work_fingerprint: string;
  project_execution_admission_fingerprint: string;
  worktree_observation_fingerprint: string;
  managed_run_state_fingerprint: string;
  expected_database_state_fingerprint: string;
  execution_envelope_version: typeof REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01;
  execution_envelope_fingerprint: string;
  native_host_adapter_version: string;
  native_host_capability_version: string;
  run_mode: "repository_attachment";
  timeout_ms: number;
  stop_settle_timeout_ms: number;
  requested_at: string;
  expires_at: string;
}

export interface RepositoryManagedDelegationPreparationV01 {
  preparation_version: "repository_managed_delegation_preparation.v0.1";
  status: "decision_required" | "blocked";
  ordinary_text: string;
  project: { project_id: string; display_name: string | null } | null;
  attachment_id: string | null;
  execution_envelope: RepositoryExecutionEnvelopeV01 | null;
  decision_request: RepositoryExecutionDecisionRequestProjectionV01 | null;
  authority: RepositoryManagedDelegationAuthorityV01;
}

export interface RepositoryManagedDelegationAuthorityV01 {
  attachment_consumed: boolean;
  managed_run_created: boolean;
  /**
   * True only when this specific start request newly started the managed
   * worker. Exact replay is always false, even when the already-admitted run
   * still has an owned worker.
   */
  worker_started: boolean;
  project_files_may_be_written: boolean;
  project_commands_may_be_executed: boolean;
  provider_egress_may_occur: boolean;
  arbitrary_network_access_granted: false;
  github_authority_granted: false;
  release_authority_granted: false;
  semantic_authority_granted: false;
  decision_created: false;
  transition_created: false;
  accepted_state_mutated: false;
  work_closed: false;
}

export interface RepositoryManagedDelegationStartResultV01 {
  start_version: typeof REPOSITORY_MANAGED_DELEGATION_START_VERSION_V01;
  status: "accepted" | "exact_replay" | "blocked";
  ordinary_text: string;
  attachment_id: string;
  run_id: string;
  attachment_binding_fingerprint: string;
  execution_envelope_fingerprint: string;
  projection: LiveNativeHostRunProjectionV01;
  authority: RepositoryManagedDelegationAuthorityV01;
}

export interface RepositoryManagedDelegationCancellationResultV01 {
  status:
    | "cancel_requested"
    | "cancelled"
    | "exact_replay"
    | "reconciliation_required";
  ordinary_text: string;
  attachment_id: string;
  run_id: string;
  projection: LiveNativeHostRunProjectionV01;
  semantic_authority_granted: false;
  decision_created: false;
  transition_created: false;
  work_closed: false;
}
