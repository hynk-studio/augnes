import type { ExternalRefV01 } from "./external-ref";

export const CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01 =
  "codex_isolated_authenticated_execution_projection.v0.1" as const;
export const CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01 =
  "codex_isolated_auth_credential_attestation.v0.1" as const;
export const CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01 =
  "codex_isolated_auth_projection_seal.v0.1" as const;
export const CODEX_ISOLATED_AUTH_AVAILABILITY_VERSION_V01 =
  "codex_isolated_auth_operational_availability.v0.1" as const;
export const CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01 =
  "codex_isolated_authenticated_execution_observation.v0.1" as const;
export const CODEX_ISOLATED_AUTH_BROKER_VERSION_V01 =
  "codex_credential_broker.v0.1" as const;
export const CODEX_ISOLATED_AUTH_ROUTE_V01 =
  "macos_keychain_agent_identity_handle" as const;

export interface CodexIsolatedAuthIntegrityV01 {
  algorithm: "sha256";
  fingerprint: string;
}

export interface CodexIsolatedAuthStatePolicyV01 {
  strategy_version: "codex_isolated_state_home.v0.1";
  per_attempt_private_root: true;
  home_isolated: true;
  codex_home_isolated: true;
  codex_sqlite_home_isolated: true;
  tmp_isolated: true;
  shared_state_fallback_forbidden: true;
  auth_file_copy_forbidden: true;
  auth_file_symlink_forbidden: true;
  ordinary_config_copy_forbidden: true;
  ordinary_history_copy_forbidden: true;
  ordinary_skill_copy_forbidden: true;
  caller_tmpdir_override_forbidden: true;
  ephemeral_thread_required: true;
  remove_after_settlement: true;
}

export interface CodexIsolatedAuthConfigPolicyV01 {
  policy_version: "codex_isolated_tool_policy.v0.1";
  forced_login_method: "chatgpt";
  auth_store_mode: "ephemeral";
  model_provider: "openai";
  provider_route_fingerprint: string;
  config_layer_policy: "runtime_overrides_only";
  config_requirements_policy: "none";
  web_search: "disabled";
  mcp_server_count: 0;
  plugin_count: 0;
  app_count: 0;
  skill_source_count: 0;
  project_instruction_bytes: 0;
  login_shell_allowed: false;
  shell_environment_inherit: "core";
  shell_default_sensitive_name_excludes: true;
  repository_command_auth_material_inheritance: false;
  codex_sqlite_home_binding: "exact_attempt_state_home";
  thread_instruction_sources: "empty";
  orchestrator_skills_enabled: false;
  orchestrator_mcp_enabled: false;
  remote_tool_features_enabled: 0;
  policy_fingerprint: string;
}

export type CodexIsolatedAuthAvailabilityStateV01 =
  | "available_exact"
  | "handle_missing"
  | "handle_ambiguous"
  | "locator_mismatch"
  | "credential_shape_invalid"
  | "account_identity_unavailable"
  | "CLI_incompatible"
  | "unsupported";
export interface CodexIsolatedAuthAvailabilityV01 {
  availability_version: typeof CODEX_ISOLATED_AUTH_AVAILABILITY_VERSION_V01;
  projection_mode: typeof CODEX_ISOLATED_AUTH_ROUTE_V01;
  state: CodexIsolatedAuthAvailabilityStateV01;
  broker_locator_fingerprint: string;
  codex_executable_fingerprint: string;
  observed_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthCredentialAttestationV01 {
  attestation_version: typeof CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01;
  attestation_id: string;
  provisioning_authorization_ref: ExternalRefV01;
  auth_handle_ref: ExternalRefV01;
  broker_locator_fingerprint: string;
  auth_generation_fingerprint: string;
  account_identity_fingerprint: string;
  account_read_email_fingerprint: string | null;
  agent_identity_runtime_fingerprint: string;
  provider_environment_fingerprint: string;
  plan_projection_fingerprint: string;
  fedramp_projection_fingerprint: string;
  issuer_projection_fingerprint: string;
  audience_projection_fingerprint: string;
  validity_projection_fingerprint: string;
  claims_authentication_status: "credential_claims_unverified_before_codex_auth";
  issued_at: string;
  expires_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthProjectionSealV01 {
  seal_version: typeof CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01;
  seal_id: string;
  provisioning_authorization_ref: ExternalRefV01;
  auth_attestation_ref: ExternalRefV01;
  auth_attestation_fingerprint: string;
  broker_binding_fingerprint: string;
  codex_executable_fingerprint: string;
  config_policy_fingerprint: string;
  state_policy_fingerprint: string;
  app_server_launch_shape_fingerprint: string;
  issued_at: string;
  expires_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthProjectionV01 {
  projection_version: typeof CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01;
  projection_id: string;
  projection_mode: typeof CODEX_ISOLATED_AUTH_ROUTE_V01;
  provisioning_authorization_ref: ExternalRefV01;
  auth_attestation_ref: ExternalRefV01;
  auth_attestation_fingerprint: string;
  projection_seal_ref: ExternalRefV01;
  projection_seal_fingerprint: string;
  provider_ref: ExternalRefV01;
  auth_mode: "agent_identity";
  auth_handle_ref: ExternalRefV01;
  broker_version: typeof CODEX_ISOLATED_AUTH_BROKER_VERSION_V01;
  broker_backend_ref: ExternalRefV01;
  broker_executable_ref: ExternalRefV01;
  broker_executable_fingerprint: string;
  broker_locator_fingerprint: string;
  auth_source_generation_fingerprint: string;
  account_identity_fingerprint: string;
  codex_executable_ref: ExternalRefV01;
  codex_executable_fingerprint: string;
  compatible_codex_cli_version: string;
  state_policy: CodexIsolatedAuthStatePolicyV01;
  config_policy: CodexIsolatedAuthConfigPolicyV01;
  app_server_launch_shape_fingerprint: string;
  launch_injection_mechanism: "broker_internal_immediate_child_spawn";
  sensitive_material_lifetime: "broker_internal_lookup_to_spawn_only";
  refresh_update_policy: "agent_identity_source_read_only_no_augnes_writeback";
  concurrency_lease_policy: "canonical_handle_generation_lookup_spawn_lease";
  cleanup_policy: "release_after_spawn_remove_attempt_root_after_settlement";
  allowed_child_environment_key_fingerprint: string;
  forbidden_persistence_surface_fingerprint: string;
  auth_bootstrap_network_class: "credential_bootstrap_separate_from_task_network";
  task_tool_network_authority: "none";
  issued_at: string;
  expires_at: string;
  authority: {
    repository_execution_granted: false;
    provider_call_granted: false;
    task_network_granted: false;
    github_write_granted: false;
    semantic_write_granted: false;
    policy_activation_granted: false;
    publication_granted: false;
    merge_granted: false;
  };
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthObservationV01 {
  observation_version: typeof CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01;
  projection_id: string;
  projection_fingerprint: string;
  auth_attestation_fingerprint: string;
  claims_authentication_status: "verified_by_codex_agent_identity_auth";
  state_root_fingerprint: string;
  home_identity_fingerprint: string;
  codex_home_identity_fingerprint: string;
  codex_sqlite_home_identity_fingerprint: string;
  tmp_identity_fingerprint: string;
  codex_executable_fingerprint: string;
  codex_cli_version: string;
  auth_mode: "agent_identity";
  account_identity_fingerprint: string;
  account_read_projection_fingerprint: string;
  observed_security_policy_fingerprint: string;
  provider_route_fingerprint: string;
  config_layers_fingerprint: string;
  codex_sqlite_home_reobserved: true;
  mcp_server_count: 0;
  unexpected_tool_policy_observed: false;
  ephemeral_thread_required: true;
  shared_state_observed: false;
  attempt_auth_material_persisted: false;
  auth_material_exposed_outside_app_server_launch_boundary: false;
  repository_command_auth_material_inherited: false;
  task_tool_network_authority: "none";
  observed_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}
