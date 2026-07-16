import type { ExternalRefV01 } from "./external-ref";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const NATIVE_HOST_REQUEST_VERSION_V01 =
  "native_host_request.v0.1" as const;
export const NATIVE_HOST_RESULT_VERSION_V01 =
  "native_host_result.v0.1" as const;
export const NATIVE_HOST_RESULT_RETURN_VERSION_V01 =
  "native_host_result_return.v0.1" as const;

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

export interface NativeHostRootScopeV01 {
  canonical_root: string;
  path_flavor: "posix" | "win32";
  root_kind: NativeHostRootKindV01;
  root_fingerprint: string;
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
  automation_context: NativeHostAutomationContextV01 | null;
  policy: {
    filesystem: "selected_project_root_only";
    network: "forbidden";
    commands: "forbidden_in_deterministic_adapter";
    model: "forbidden_in_deterministic_adapter";
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
  invoke(
    request: NativeHostRequestV01,
    control: NativeHostInvocationControlV01,
  ): NativeHostInvocationV01;
}
