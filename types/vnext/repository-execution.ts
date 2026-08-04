import type { NativeHostPhysicalRootIdentityV01 } from "./native-host-adapter";

export const PHYSICAL_ROOT_BASELINE_VERSION_V01 =
  "physical_root_baseline.v0.1" as const;
export const REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01 =
  "repository_worktree_observation.v0.1" as const;
export const PROJECT_EXECUTION_ADMISSION_VERSION_V01 =
  "project_execution_admission.v0.1" as const;
export const REPOSITORY_EXECUTION_ATTACHMENT_VERSION_V01 =
  "repository_execution_attachment.v0.1" as const;
export const REPOSITORY_EXECUTION_FRESHNESS_POLICY_VERSION_V01 =
  "repository_execution_freshness_policy.v0.1" as const;

export type PhysicalRootObservationV01 =
  | {
      status: "exact";
      platform: "darwin" | "linux";
      node_scope_fingerprint: string;
      identity: NativeHostPhysicalRootIdentityV01;
      observation_fingerprint: string;
      observed_at: string;
    }
  | {
      status: "identity_unavailable" | "identity_unsupported" | "identity_ambiguous";
      platform: NodeJS.Platform;
      node_scope_fingerprint: string | null;
      reason: string;
      observed_at: string;
    };

export interface PhysicalRootBaselineV01 {
  baseline_version: typeof PHYSICAL_ROOT_BASELINE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  node_scope_fingerprint: string;
  root_binding_fingerprint: string;
  identity_version: NativeHostPhysicalRootIdentityV01["identity_version"];
  canonical_realpath_fingerprint: string;
  filesystem_volume_identity: string;
  filesystem_object_identity: string;
  observed_at: string;
  provenance: "canonical_new_project_onboarding" | "explicit_legacy_adoption" | "explicit_root_rebind";
  baseline_fingerprint: string;
}

export type RepositoryWorktreeObservationV01 =
  | {
      observation_version: typeof REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01;
      status: "exact";
      repository_kind: "git_repository" | "git_worktree";
      git_common_dir_fingerprint: string;
      head_commit: string | null;
      head_state: "branch" | "detached" | "unborn";
      branch_name: string | null;
      index_fingerprint: string;
      tracked_dirty_paths_fingerprint: string;
      relevant_untracked_paths_fingerprint: string;
      observed_at: string;
      observation_fingerprint: string;
    }
  | {
      observation_version: typeof REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01;
      status: "non_git";
      repository_kind: "plain_folder";
      observed_at: string;
      observation_fingerprint: string;
    }
  | {
      observation_version: typeof REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01;
      status: "unavailable" | "ambiguous";
      repository_kind: "unknown";
      reason: string;
      observed_at: string;
      observation_fingerprint: string;
    };

export type ProjectExecutionAdmissionReasonV01 =
  | "ready"
  | "project_unavailable"
  | "root_unavailable"
  | "baseline_adoption_required"
  | "physical_root_mismatch"
  | "identity_unavailable"
  | "identity_unsupported"
  | "identity_ambiguous"
  | "current_work_unavailable"
  | "worktree_unavailable"
  | "worktree_ambiguous"
  | "managed_run_conflict";

export interface ProjectExecutionAdmissionV01 {
  admission_version: typeof PROJECT_EXECUTION_ADMISSION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  readiness: "ready" | "decision_required" | "blocked";
  reason: ProjectExecutionAdmissionReasonV01;
  node_scope_fingerprint: string | null;
  physical_root_observation_fingerprint: string | null;
  root_binding_fingerprint: string | null;
  physical_root_baseline_fingerprint: string | null;
  task_context_packet_id: string | null;
  task_context_packet_fingerprint: string | null;
  current_work_fingerprint: string | null;
  managed_run_state_fingerprint: string;
  worktree_observation: RepositoryWorktreeObservationV01 | null;
  admission_fingerprint: string;
  browser_observation: {
    active_project_id: string | null;
    selected_project_is_target: boolean;
  };
  projection_only: true;
  execution_authority_granted: false;
  semantic_authority_granted: false;
}

export type RepositoryExecutionAttachmentLifecycleV01 =
  | "prepared"
  | "stale"
  | "superseded"
  | "revoked"
  | "consumed";

export type RepositoryExecutionAttachmentStaleReasonV01 =
  | "physical_root_mismatch"
  | "root_binding_changed"
  | "packet_changed"
  | "current_work_changed"
  | "project_unavailable"
  | "managed_run_conflict"
  | "worktree_changed"
  | "freshness_expired"
  | "explicitly_revoked"
  | "superseded";

export interface RepositoryExecutionAttachmentV01 {
  attachment_version: typeof REPOSITORY_EXECUTION_ATTACHMENT_VERSION_V01;
  attachment_id: string;
  workspace_id: string;
  project_id: string;
  node_scope_fingerprint: string;
  physical_root_baseline_fingerprint: string;
  root_binding_fingerprint: string;
  task_context_packet_id: string;
  task_context_packet_fingerprint: string;
  current_work_fingerprint: string;
  project_execution_admission_fingerprint: string;
  worktree_observation_fingerprint: string;
  managed_run_state_fingerprint: string;
  binding_fingerprint: string;
  prepared_at: string;
  freshness_policy: {
    policy_version: typeof REPOSITORY_EXECUTION_FRESHNESS_POLICY_VERSION_V01;
    max_age_ms: number;
    expires_at: string;
  };
  lifecycle: RepositoryExecutionAttachmentLifecycleV01;
  stale_reason: RepositoryExecutionAttachmentStaleReasonV01 | null;
  lifecycle_updated_at: string;
  consumed_run_id: null;
}

export interface RepositoryExecutionAuthorityBoundaryV01 {
  project_files_written: false;
  project_commands_executed: false;
  managed_run_created: false;
  execution_started: false;
  provider_called: false;
  branch_or_commit_created: false;
  github_called: false;
  semantic_authority_granted: false;
  execution_authority_granted: false;
  external_effect_authority_granted: false;
}

export interface RepositoryExecutionPreparationV01 {
  preparation_version: "repository_execution_preparation.v0.1";
  status: "prepared" | "baseline_adoption_required" | "blocked";
  reason: ProjectExecutionAdmissionReasonV01;
  project: { project_id: string; display_name: string | null } | null;
  ordinary_text: string;
  attachment: RepositoryExecutionAttachmentV01 | null;
  admission: ProjectExecutionAdmissionV01 | null;
  authority: RepositoryExecutionAuthorityBoundaryV01;
}
