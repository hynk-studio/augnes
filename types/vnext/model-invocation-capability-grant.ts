export const MODEL_INVOCATION_CAPABILITY_GRANT_VERSION_V01 =
  "model_invocation_capability_grant.v0.1" as const;

export interface ModelInvocationCapabilityGrantV01 {
  grant_version: typeof MODEL_INVOCATION_CAPABILITY_GRANT_VERSION_V01;
  grant_id: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
  automation_control_revision: number;
  permitted_purposes: Array<
    | "observe_delta_compile"
    | "planner_plan"
    | "temporal_interpretation"
  >;
  permitted_execution_modes: Array<"live" | "deterministic">;
  provider_egress_allowed: boolean;
  max_provider_calls: 0 | 1;
  max_input_bytes: number;
  max_output_tokens: number;
  max_timeout_ms: number;
  max_model_invocations: 1;
  allowed_data_classifications: Array<
    "public_safe" | "private" | "local_only" | "secret"
  >;
  issued_at: string;
  expires_at: string;
  status: "active" | "revoked";
  capability_status: "available" | "unavailable";
  automatic_retry: false;
  provider_failover: false;
  semantic_mutation_authorized: false;
  external_actions_authorized: false;
  can_expand_own_authority: false;
  lineage_fingerprint: string;
}

export interface ModelInvocationCapabilityGrantAuthorityV01 {
  read(grant_id: string):
    | unknown
    | null
    | Promise<unknown | null>;
}
