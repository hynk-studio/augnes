import type { ExternalRefV01 } from "./external-ref";
import type {
  NativeHostApprovalDecisionKindV01,
  NativeHostApprovalOperationV01,
} from "./native-host-adapter";

export const REPOSITORY_RUN_RESUME_CHECKPOINT_VERSION_V01 =
  "repository_run_resume_checkpoint.v0.1" as const;
export const REPOSITORY_RUN_RESUME_ELIGIBILITY_VERSION_V01 =
  "repository_run_resume_eligibility.v0.1" as const;
export const NATIVE_HOST_RESUME_BINDING_VERSION_V01 =
  "native_host_resume_binding.v0.1" as const;

export const REPOSITORY_RUN_RESUME_LIMITS_V01 = Object.freeze({
  public_text_characters: 640,
  public_gap_items: 12,
  public_serialized_bytes: 24 * 1024,
  private_ref_json_bytes: 4 * 1024,
});

export type RepositoryRunCheckpointPhaseV01 =
  | "declared_pre_start"
  | "post_operation";

export type RepositoryRunOperationCertaintyV01 =
  | "not_started"
  | "started"
  | "completed"
  | "failed"
  | "cancelled"
  | "waiting_for_approval";

/**
 * Private, node-local checkpoint material. It is operational source state and
 * must never be serialized into ordinary Browser or MCP copy.
 */
export interface RepositoryRunResumeCheckpointV01 {
  checkpoint_version: typeof REPOSITORY_RUN_RESUME_CHECKPOINT_VERSION_V01;
  checkpoint_fingerprint: string;
  workspace_id: string;
  project_id: string;
  run_id: string;
  invocation_origin: "repository_attachment";
  attachment_id: string;
  attachment_binding_fingerprint: string;
  node_scope_fingerprint: string;
  execution_envelope_version: "repository_execution_envelope.v0.1";
  execution_envelope_fingerprint: string;
  adapter_version: string;
  capability_version: string;
  provider_resume_binding_version: typeof NATIVE_HOST_RESUME_BINDING_VERSION_V01;
  provider_thread_ref: ExternalRefV01;
  last_turn_ref: ExternalRefV01;
  controller_generation: number;
  runtime_instance_fingerprint: string;
  runtime_generation_fingerprint: string;
  run_control_revision: number;
  step_id: string;
  step_control_revision: number;
  event_high_water_mark: number;
  step_high_water_mark: number;
  effect_ledger_high_water_mark: number;
  operation_ref: string;
  operation_class: Extract<
    NativeHostApprovalOperationV01,
    "command_execution" | "file_change"
  >;
  checkpoint_phase: RepositoryRunCheckpointPhaseV01;
  operation_certainty: RepositoryRunOperationCertaintyV01;
  approval_ref: string | null;
  approval_state: "pending" | "decided" | "expired" | null;
  root_binding_fingerprint: string;
  physical_root_baseline_fingerprint: string;
  worktree_observation_fingerprint: string;
  observed_at: string;
}

export type RepositoryRunResumeEligibilityStatusV01 =
  | "active_owned"
  | "terminal"
  | "approval_pending"
  | "resume_ready"
  | "reconciliation_required"
  | "stale"
  | "unsupported"
  | "unavailable";

export interface RepositoryRunResumeEligibilityAuthorityV01 {
  writes_database: false;
  writes_project_files: false;
  creates_run_or_attachment: false;
  creates_controller_generation: false;
  starts_or_resumes_worker: false;
  calls_provider_or_thread_resume: false;
  executes_command: false;
  consumes_grant: false;
  issues_or_decides_approval: false;
  creates_result_or_proposal: false;
  creates_review_decision_or_transition: false;
  mutates_accepted_state_or_closes_work: false;
  calls_github_or_external_network: false;
}

export interface RepositoryRunResumeEligibilityV01 {
  projection_version: typeof REPOSITORY_RUN_RESUME_ELIGIBILITY_VERSION_V01;
  generated_at: string;
  status: RepositoryRunResumeEligibilityStatusV01;
  summary: string;
  run_state:
    | "active"
    | "paused_or_disconnected"
    | "terminal"
    | "not_available";
  last_confirmed_operation: null | {
    operation_class: "command_execution" | "file_change";
    certainty: "not_started" | "completed" | "failed" | "cancelled";
    summary: string;
    observed_at: string;
  };
  pending_approval: null | {
    operation_class: NativeHostApprovalOperationV01;
    title: string;
    reason: string;
    risk: string;
    resource_summary: string;
    available_decisions: NativeHostApprovalDecisionKindV01[];
    expires_at: string | null;
  };
  next_action: {
    kind:
      | "view_progress"
      | "review_result"
      | "review_approval"
      | "request_explicit_resume"
      | "review_uncertain_operation"
      | "restore_checkpoint_state"
      | "restore_resume_support"
      | "restore_continuity";
    label: string;
    reason: string;
    executes: false;
  };
  gaps: string[];
  authority: RepositoryRunResumeEligibilityAuthorityV01;
}

export const REPOSITORY_RUN_RESUME_ELIGIBILITY_AUTHORITY_V01 = Object.freeze({
  writes_database: false,
  writes_project_files: false,
  creates_run_or_attachment: false,
  creates_controller_generation: false,
  starts_or_resumes_worker: false,
  calls_provider_or_thread_resume: false,
  executes_command: false,
  consumes_grant: false,
  issues_or_decides_approval: false,
  creates_result_or_proposal: false,
  creates_review_decision_or_transition: false,
  mutates_accepted_state_or_closes_work: false,
  calls_github_or_external_network: false,
}) satisfies RepositoryRunResumeEligibilityAuthorityV01;
