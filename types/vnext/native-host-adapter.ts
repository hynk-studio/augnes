import type { ExternalRefV01 } from "./external-ref";
import type { TaskContextPacketV01 } from "./task-context-packet";
import type { BoundedAutomationCapabilityGrantV01 } from "./bounded-automation-cycle";

export const NATIVE_HOST_REQUEST_VERSION_V01 =
  "native_host_request.v0.1" as const;
export const NATIVE_HOST_RESULT_VERSION_V01 =
  "native_host_result.v0.1" as const;
export const NATIVE_HOST_RESULT_RETURN_VERSION_V01 =
  "native_host_result_return.v0.1" as const;
export const NATIVE_HOST_APPROVAL_VERSION_V01 =
  "native_host_approval.v0.1" as const;

export type NativeHostRunModeV01 = "interactive" | "policy_triggered";
export type NativeHostRootKindV01 =
  | "plain_folder"
  | "git_repository"
  | "git_worktree";
export type NativeHostTerminalOutcomeV01 =
  | "completed"
  | "blocked"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "unavailable";
export type NativeHostCoverageClassV01 =
  | "enforced"
  | "observed"
  | "host_attested"
  | "unsupported";
export type NativeHostLifecycleStateV01 =
  | "queued"
  | "starting"
  | "running"
  | "waiting_for_approval"
  | "cancelling"
  | "paused";
export type NativeHostApprovalOperationV01 =
  | "command_execution"
  | "file_change"
  | "filesystem_permission"
  | "network_permission";
export type NativeHostApprovalDecisionKindV01 =
  | "approve_once"
  | "decline"
  | "cancel_run";
export type NativeHostExecutionProfileV01 =
  | "deterministic_zero_model"
  | "native_host_managed_model";
export type NativeHostProviderEgressV01 = "forbidden" | "native_host_managed";

export interface NativeHostPhysicalRootIdentityV01 {
  identity_version: "native_host_physical_root_identity.v0.1";
  canonical_realpath_fingerprint: string;
  device: string;
  inode: string;
}

export interface NativeHostRootScopeV01 {
  canonical_root: string;
  path_flavor: "posix" | "win32";
  root_kind: NativeHostRootKindV01;
  root_fingerprint: string;
  physical_root_identity: NativeHostPhysicalRootIdentityV01;
  root_scope_ref: ExternalRefV01;
  repository_ref: ExternalRefV01 | null;
  selected_worktree_ref: ExternalRefV01 | null;
}

export interface NativeHostAutomationContextV01 {
  policy_ref: ExternalRefV01;
  capability_grant_ref: ExternalRefV01;
  control_revision: number | null;
  automatic_retry_allowed: false;
  scheduler_started: false;
  bounded_cycle?: {
    profile: "bounded_autohunt_review_needed.v0.1";
    cycle_id: string;
    attempt: 1;
    trigger_ref: ExternalRefV01;
    grant: BoundedAutomationCapabilityGrantV01;
  };
}

export interface NativeHostRequestV01 {
  request_version: typeof NATIVE_HOST_REQUEST_VERSION_V01;
  request_id: string;
  run_id: string;
  idempotency_key: string;
  workspace_id: string;
  project_id: string;
  work_ref: ExternalRefV01;
  task_ref: ExternalRefV01;
  task_context_packet_ref: ExternalRefV01;
  packet: TaskContextPacketV01;
  packet_lineage: {
    source_transition_receipt_ref: ExternalRefV01;
    packet_source_refs: ExternalRefV01[];
    selected_context_refs: ExternalRefV01[];
  };
  mode: NativeHostRunModeV01;
  root_scope: NativeHostRootScopeV01;
  requested_capability: string;
  allowed_operation_categories: string[];
  forbidden_operation_categories: string[];
  packet_capability_grant: TaskContextPacketV01["capability_grant"];
  execution_grant_ref: ExternalRefV01 | null;
  automation_context: NativeHostAutomationContextV01 | null;
  policy: {
    filesystem: "selected_project_root_only";
    network: "forbidden" | "exact_grant_only";
    commands:
      | "forbidden_in_deterministic_adapter"
      | "approval_required";
    model:
      | "forbidden_in_deterministic_adapter"
      | "native_host_managed";
    host_egress:
      | "forbidden"
      | "explicit_interactive_start"
      | "bounded_capability_grant";
    max_changed_files: number;
    max_artifacts: number;
    max_commands: number;
    max_checks: number;
    timeout_ms: number;
    stop_settle_timeout_ms: number;
    stop_conditions: string[];
  };
  result_return: {
    return_version: typeof NATIVE_HOST_RESULT_RETURN_VERSION_V01;
    structured_result_required: true;
    legacy_result_text_allowed: false;
    raw_output_allowed: false;
    max_result_bytes: number;
  };
}

export interface NativeHostChangedFileV01 {
  repository_relative_path: string;
  change_kind: "added" | "modified" | "deleted" | "renamed" | "unknown";
  before_hash: string | null;
  after_hash: string | null;
}

export interface NativeHostArtifactV01 {
  artifact_ref: ExternalRefV01;
  summary: string;
}

export interface NativeHostObservedCommandV01 {
  command_id: string;
  summary: string;
  command_fingerprint: string | null;
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  status: "completed" | "failed" | "blocked" | "unknown";
}

export interface NativeHostObservedCheckV01 {
  check_id: string;
  required: boolean;
  status: "passed" | "failed" | "blocked" | "unknown";
  summary: string;
}

export interface NativeHostSkippedCheckV01 {
  check_id: string;
  required: boolean;
  reason: string;
}

export interface NativeHostResultV01 {
  result_version: typeof NATIVE_HOST_RESULT_VERSION_V01;
  request_id: string;
  run_id: string;
  outcome: NativeHostTerminalOutcomeV01;
  public_stop_reason: string | null;
  started_at: string;
  finished_at: string;
  host_refs: ExternalRefV01[];
  adapter_version: string;
  capability_version: string;
  changed_files: NativeHostChangedFileV01[];
  artifacts: NativeHostArtifactV01[];
  observed_actions: string[];
  commands: NativeHostObservedCommandV01[];
  checks: NativeHostObservedCheckV01[];
  skipped_checks: NativeHostSkippedCheckV01[];
  model_invocation_receipt_refs: ExternalRefV01[];
  summary: string;
  uncertainty: string[];
  gaps: string[];
  proposed_next_steps: string[];
  capability_coverage: Array<{
    capability: string;
    coverage: NativeHostCoverageClassV01;
    source_ref: ExternalRefV01 | null;
    notes: string[];
  }>;
  adapter_extension: {
    extension_version: string;
    adapter_kind: string;
    bounded_metadata: Record<
      string,
      string | number | boolean | null
    >;
  };
}

export interface NativeHostInvocationControlV01 {
  cancellation_signal: AbortSignal;
  timeout_ms: number;
  stop_settle_timeout_ms: number;
  lifecycle_sink?: NativeHostLifecycleSinkV01;
  resume_binding?: NativeHostResumeBindingV01 | null;
}

export interface NativeHostResumeBindingV01 {
  host_connection_ref: ExternalRefV01 | null;
  host_thread_ref: ExternalRefV01;
  host_session_ref: ExternalRefV01 | null;
  host_turn_ref: ExternalRefV01;
  control_revision: number;
}

export interface NativeHostLifecycleEventV01 {
  event_id: string;
  run_id: string;
  state: NativeHostLifecycleStateV01;
  event_kind:
    | "process_started"
    | "capability_confirmed"
    | "thread_bound"
    | "thread_status_changed"
    | "turn_started"
    | "approval_resolved"
    | "stop_requested"
    | "transport_disconnected"
    | "reconciliation_required";
  observed_at: string;
  coverage: NativeHostCoverageClassV01;
  host_refs: ExternalRefV01[];
  bounded_metadata: Record<string, string | number | boolean | null>;
}

export interface NativeHostApprovalRequestV01 {
  approval_version: typeof NATIVE_HOST_APPROVAL_VERSION_V01;
  approval_id: string;
  idempotency_fingerprint: string;
  workspace_id: string;
  project_id: string;
  run_id: string;
  packet_id: string;
  packet_fingerprint: string;
  host_thread_ref: ExternalRefV01;
  host_turn_ref: ExternalRefV01;
  host_item_ref: ExternalRefV01;
  host_request_ref: ExternalRefV01;
  operation_class: NativeHostApprovalOperationV01;
  repository_relative_paths: string[];
  network_resources: string[];
  command_summary: string | null;
  command_fingerprint: string | null;
  resource_summary: string;
  public_reason: string;
  public_risk_summary: string;
  budget_impact: string | null;
  available_decisions: NativeHostApprovalDecisionKindV01[];
  issued_at: string;
  expires_at: string | null;
  coverage: NativeHostCoverageClassV01;
}

export interface NativeHostApprovalDecisionV01 {
  approval_id: string;
  idempotency_fingerprint: string;
  decision: NativeHostApprovalDecisionKindV01;
  decision_source:
    | "explicit_local_operator"
    | "bounded_capability_grant"
    | "run_cancellation";
  decided_at: string;
  control_revision: number;
}

export interface NativeHostLifecycleSinkV01 {
  report_event(event: NativeHostLifecycleEventV01): Promise<void>;
  request_approval(
    request: NativeHostApprovalRequestV01,
  ): Promise<NativeHostApprovalDecisionV01>;
}

export type NativeHostStopReasonV01 = "timeout" | "cancellation_requested";

export interface NativeHostStopRequestV01 {
  reason: NativeHostStopReasonV01;
}

export interface NativeHostInvocationV01 {
  result: Promise<NativeHostResultV01>;
  /** Idempotently request that the adapter stop all work owned by this invocation. */
  request_stop(request: NativeHostStopRequestV01): Promise<void>;
  /** Resolves only after adapter-owned work, subprocesses, timers, and cleanup stop. */
  settled: Promise<void>;
}

export interface NativeHostAdapterV01 {
  readonly adapter_version: string;
  readonly capability_version: string;
  readonly execution_profile: NativeHostExecutionProfileV01;
  readonly provider_egress: NativeHostProviderEgressV01;
  invoke(
    request: NativeHostRequestV01,
    control: NativeHostInvocationControlV01,
  ): NativeHostInvocationV01;
}
