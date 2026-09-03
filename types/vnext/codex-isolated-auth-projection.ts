import type { ExternalRefV01 } from "./external-ref";

export const CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01 =
  "codex_isolated_authenticated_execution_projection.v0.1" as const;
export const CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01 =
  "codex_isolated_auth_credential_attestation.v0.1" as const;
export const CODEX_ISOLATED_AUTH_PROVISIONING_BINDING_VERSION_V01 =
  "codex_isolated_auth_provisioning_binding.v0.1" as const;
export const CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01 =
  "codex_isolated_auth_projection_seal.v0.1" as const;
export const CODEX_ISOLATED_AUTH_AVAILABILITY_VERSION_V01 =
  "codex_isolated_auth_operational_availability.v0.1" as const;
export const CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01 =
  "codex_isolated_authenticated_execution_observation.v0.1" as const;
export const CODEX_ISOLATED_AUTH_BROKER_VERSION_V01 =
  "codex_credential_broker.v0.1" as const;
export const CODEX_ISOLATED_AUTH_ROUTE_V01 =
  "local_codex_auth_storage" as const;
export const CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_SEMANTIC_PROFILE_VERSION_V01 =
  "codex_isolated_auth_semantic_profile.rust-v0.150.1" as const;
export const CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_SUPPORTED_CLI_VERSION_V01 =
  "0.150.1" as const;
export const CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_UPSTREAM_TAG_V01 =
  "rust-v0.150.1" as const;
export const CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_UPSTREAM_SOURCE_COMMIT_V01 =
  "90854393966b21e9ebfd21b122334eb09a20c93d" as const;
export const CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_EXECUTABLE_FINGERPRINT_V01 =
  "sha256:a14f9a907c12c8812878b70e6b7d65f81c39ed795513e46a55817d7428c0ca6b" as const;
export const CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_SEMANTIC_PROFILE_FINGERPRINT_V01 =
  "sha256:0c2275335eb069ccd251dade36df03b6f4f0842deedc1d8d12191dadfa917058" as const;
export const CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01 =
  "codex_isolated_auth_semantic_profile.rust-v0.152.1" as const;
export const CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 = "0.152.1" as const;
export const CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01 = "rust-v0.152.1" as const;
export const CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01 =
  "5adb68a49933ae446bf11935662c83dba55a0804" as const;
/**
 * Legacy artifact-bound CDX3C/CDX3E qualification evidence. Production
 * admission is owned by the checked-in Qualified Runtime Registry; these
 * values remain exact so existing isolated-auth receipts and projections do
 * not silently acquire a different meaning.
 */
export const CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01 =
  "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf" as const;
export const CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01 =
  "sha256:795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529" as const;
export const CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01 =
  "codex_app_server_user_agent.rust-v0.152.1" as const;
export const CODEX_APP_SERVER_CLIENT_VERSION_V01 =
  "codex_app_server_adapter.v0.1" as const;
export const CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01 =
  "codex_agent_identity_jwt_claims.rust-v0.150.1" as const;
export const CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01 =
  "codex_auth_dot_json_storage.rust-v0.150.1" as const;
export const CODEX_AUTH_KEYRING_SERVICE_V01 = "Codex Auth" as const;
export const CODEX_ISOLATED_AUTH_CREDENTIAL_FREE_PREFLIGHT_VERSION_V01 =
  "codex_isolated_auth_credential_free_preflight.v0.1" as const;
export const CODEX_0_152_1_EXACT_QUALIFICATION_VERSION_V01 =
  "codex_rust_v0_152_1_exact_qualification.v0.1" as const;
export const CODEX_0_152_1_SEMANTIC_PROFILE_VERSION_V01 =
  "codex_isolated_auth_semantic_profile.rust-v0.152.1-qualification" as const;
export const CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01 = "0.152.1" as const;
export const CODEX_0_152_1_UPSTREAM_TAG_V01 = "rust-v0.152.1" as const;
export const CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01 =
  "5adb68a49933ae446bf11935662c83dba55a0804" as const;
export const CODEX_0_152_1_RELEASE_ASSET_NAME_V01 =
  "codex-aarch64-apple-darwin.tar.gz" as const;
export const CODEX_0_152_1_RELEASE_ARCHIVE_FINGERPRINT_V01 =
  "sha256:8ddde1fcf5c9842e9baa09c7c108088bb22a39feb86e4344e45dc0986764b9d7" as const;
export const CODEX_0_152_1_EXECUTABLE_FINGERPRINT_V01 =
  "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf" as const;
export const CODEX_0_152_1_PLATFORM_V01 = "darwin" as const;
export const CODEX_0_152_1_ARCHITECTURE_V01 = "arm64" as const;
export const CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01 =
  "codex_app_server_user_agent.rust-v0.152.1-qualification" as const;
export const CODEX_ISOLATED_AUTH_TEST_EXECUTION_AUTHORIZATION_VERSION_V01 =
  "codex_isolated_auth_test_external_execution_authorization.v0.1" as const;
export const CODEX_ISOLATED_AUTH_PRODUCTION_MODEL_CONFIGURATION_VERSION_V01 =
  "codex_isolated_auth_model_configuration.v0.1" as const;
export const CODEX_AGENT_IDENTITY_ISSUER_V01 =
  "https://chatgpt.com/codex-backend/agent-identity" as const;
export const CODEX_AGENT_IDENTITY_AUDIENCE_V01 = "codex-app-server" as const;
export const CODEX_AGENT_IDENTITY_EFFECTIVE_BASE_URL_V01 =
  "https://chatgpt.com/backend-api/codex" as const;
/**
 * Production overrides for released Codex 0.152.1. The final two added flags
 * preserve the 0.150.1 tool/item surface after 0.152.1 made `sleep_tool`
 * default-on and stabilized default-on `content_item_kinds`.
 */
export const CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01 = [
  "--strict-config",
  "-c",
  'forced_login_method="chatgpt"',
  "-c",
  'cli_auth_credentials_store="file"',
  "-c",
  'model_provider="openai"',
  "-c",
  'web_search="disabled"',
  "-c",
  "mcp_servers={}",
  "-c",
  "plugins={}",
  "-c",
  "skills={}",
  "-c",
  "apps={}",
  "-c",
  "features.auth_elicitation=false",
  "-c",
  "features.use_agent_identity=true",
  "-c",
  "features.apps=false",
  "-c",
  "features.plugins=false",
  "-c",
  "features.remote_plugin=false",
  "-c",
  "features.network_proxy=false",
  "-c",
  "features.request_permissions_tool=false",
  "-c",
  "features.hooks=false",
  "-c",
  "features.multi_agent=false",
  "-c",
  "features.in_app_browser=false",
  "-c",
  "features.mcp_2026_07_28=false",
  "-c",
  "features.memories=false",
  "-c",
  "features.mentions_v2=false",
  "-c",
  "features.browser_use=false",
  "-c",
  "features.browser_use_full_cdp_access=false",
  "-c",
  "features.browser_use_external=false",
  "-c",
  "features.computer_use=false",
  "-c",
  "features.image_generation=false",
  "-c",
  "features.tool_suggest=false",
  "-c",
  "features.recommended_plugins=false",
  "-c",
  "features.web_search_request=false",
  "-c",
  "features.web_search_cached=false",
  "-c",
  "features.standalone_web_search=false",
  "-c",
  "orchestrator.skills.enabled=false",
  "-c",
  "orchestrator.mcp.enabled=false",
  "-c",
  "check_for_update_on_startup=false",
  "-c",
  "allow_login_shell=false",
  "-c",
  'shell_environment_policy.inherit="core"',
  "-c",
  "shell_environment_policy.ignore_default_excludes=false",
  "-c",
  "project_doc_max_bytes=0",
  "-c",
  "project_doc_fallback_filenames=[]",
  "-c",
  "features.sleep_tool=false",
  "-c",
  "features.content_item_kinds=false",
] as const;

/** Frozen CDX3B candidate tuple. It remains candidate-only historical evidence. */
export const CODEX_0_152_1_QUALIFICATION_CONFIG_OVERRIDE_ARGS_V01 = [
  ...CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01,
] as const;

export interface CodexIsolatedAuthIntegrityV01 {
  algorithm: "sha256";
  fingerprint: string;
}

export interface CodexIsolatedAuthSemanticProfileV01 {
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  upstream_tag: typeof CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01;
  upstream_source_commit: typeof CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01;
  supported_public_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  pinned_production_executable_fingerprint: typeof CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01;
  agent_identity_claim_contract_version: typeof CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01;
  agent_identity_claim_contract_fingerprint: string;
  auth_storage_contract_version: typeof CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01;
  auth_storage_contract_fingerprint: string;
  effective_provider_rule_fingerprint: string;
  config_tool_feature_schema_fingerprint: string;
  app_server_method_profile_fingerprint: string;
  app_server_user_agent_contract_version: typeof CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01;
  app_server_user_agent_contract_fingerprint: string;
  required_environment_auth_behavior_fingerprint: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface Codex01521QualificationSemanticProfileV01 {
  semantic_profile_version: typeof CODEX_0_152_1_SEMANTIC_PROFILE_VERSION_V01;
  upstream_tag: typeof CODEX_0_152_1_UPSTREAM_TAG_V01;
  upstream_source_commit: typeof CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01;
  supported_public_cli_version: typeof CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01;
  release_asset_name: typeof CODEX_0_152_1_RELEASE_ASSET_NAME_V01;
  release_archive_fingerprint: typeof CODEX_0_152_1_RELEASE_ARCHIVE_FINGERPRINT_V01;
  qualification_executable_fingerprint: typeof CODEX_0_152_1_EXECUTABLE_FINGERPRINT_V01;
  platform: typeof CODEX_0_152_1_PLATFORM_V01;
  architecture: typeof CODEX_0_152_1_ARCHITECTURE_V01;
  production_profile_version: typeof CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_SEMANTIC_PROFILE_VERSION_V01;
  production_profile_fingerprint: string;
  production_selection: false;
  agent_identity_claim_contract_status: "unchanged_from_rust_v0.150.1";
  agent_identity_claim_contract_fingerprint: string;
  auth_storage_contract_status: "unchanged_from_rust_v0.150.1";
  auth_storage_contract_fingerprint: string;
  effective_openai_provider_route_status: "unchanged_from_rust_v0.150.1";
  effective_provider_rule_fingerprint: string;
  config_tool_feature_schema_status: "versioned_delta";
  config_tool_feature_schema_fingerprint: string;
  app_server_method_profile_status: "versioned_delta";
  app_server_method_profile_fingerprint: string;
  app_server_user_agent_contract_version: typeof CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01;
  app_server_user_agent_contract_fingerprint: string;
  required_environment_auth_behavior_status: "unchanged_private_state_policy";
  required_environment_auth_behavior_fingerprint: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthStatePolicyV01 {
  strategy_version: "codex_isolated_state_home.v0.2";
  per_attempt_private_root: true;
  home_isolated: true;
  codex_home_isolated: true;
  codex_sqlite_home_isolated: true;
  tmp_isolated: true;
  shared_state_fallback_forbidden: true;
  source_auth_file_copy_forbidden: true;
  broker_owned_minimal_auth_snapshot: "attempt_private_official_auth_dot_json";
  broker_owned_auth_snapshot_mode_0600: true;
  broker_owned_auth_snapshot_removed_before_observation: true;
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
  auth_store_mode: "file";
  use_agent_identity_feature_enabled: true;
  model_provider: "openai";
  provider_route_fingerprint: string;
  provider_projection_version: "codex_agent_identity_effective_provider.v0.1";
  raw_provider_base_url: null;
  effective_provider_base_url_fingerprint: string;
  wire_api: "responses";
  requires_openai_auth: true;
  supports_websockets: true;
  supports_standalone_web_search: true;
  builtin_version_header_owned: true;
  builtin_organization_env_header_owned: true;
  builtin_project_env_header_owned: true;
  isolated_launch_provider_header_env_absent: true;
  request_max_retries: 4;
  stream_max_retries: 5;
  stream_idle_timeout_ms: 300000;
  websocket_connect_timeout_ms: 15000;
  env_key_present: false;
  experimental_bearer_token_present: false;
  auth_command_present: false;
  aws_config_present: false;
  query_params_present: false;
  user_http_headers_present: false;
  user_env_http_headers_present: false;
  config_layer_policy: "session_flags_exact_no_active_non_session_layers";
  config_requirements_policy: "not_enumerated_critical_override_origins_intact";
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
  sqlite_config_projection: "absent";
  sqlite_runtime_binding: "private_codex_sqlite_home_environment";
  sqlite_runtime_source: "CODEX_SQLITE_HOME";
  sqlite_runtime_private_root_required: true;
  sqlite_runtime_shared_fallback_forbidden: true;
  apps_config_projection: "source_default_only";
  apps_capability: "disabled_by_feature";
  thread_instruction_sources: "empty";
  orchestrator_skills_enabled: false;
  orchestrator_mcp_enabled: false;
  remote_tool_features_enabled: 0;
  policy_fingerprint: string;
}

export type CodexIsolatedAuthAvailabilityStateV01 =
  | "available_exact"
  | "agent_identity_task_registration_required"
  | "agent_identity_bootstrap_required"
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

export type CodexIsolatedAuthCredentialFreePreflightStateV01 =
  | "compatible_exact"
  | "executable_mismatch"
  | "version_mismatch"
  | "semantic_profile_mismatch"
  | "method_shape_mismatch"
  | "unavailable";

export interface CodexIsolatedAuthCredentialFreePreflightV01 {
  preflight_version: typeof CODEX_ISOLATED_AUTH_CREDENTIAL_FREE_PREFLIGHT_VERSION_V01;
  state: CodexIsolatedAuthCredentialFreePreflightStateV01;
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
  observed_cli_version: string | null;
  observed_security_policy_fingerprint: string | null;
  credential_access_attempted: false;
  provider_model_call_attempted: false;
  repository_turn_started: false;
  successful_external_network_egress_observed: false;
  cleanup_completed: boolean;
  observed_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export type Codex01521ExactQualificationStateV01 =
  | "qualified_exact"
  | "compatible_emulated"
  | "release_identity_mismatch"
  | "executable_mismatch"
  | "platform_mismatch"
  | "version_mismatch"
  | "semantic_profile_mismatch"
  | "method_shape_mismatch"
  | "cleanup_incomplete"
  | "unavailable";

export interface Codex01521ExactQualificationResultV01 {
  qualification_version: typeof CODEX_0_152_1_EXACT_QUALIFICATION_VERSION_V01;
  verdict: "QUALIFIED_EXACT" | "HOLD / NOT_QUALIFIED";
  state: Codex01521ExactQualificationStateV01;
  upstream_tag: typeof CODEX_0_152_1_UPSTREAM_TAG_V01;
  upstream_source_commit: typeof CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01;
  release_asset_name: typeof CODEX_0_152_1_RELEASE_ASSET_NAME_V01;
  release_archive_fingerprint: string;
  executable_fingerprint: string;
  platform: string;
  architecture: string;
  cli_reported_version: string | null;
  app_server_reported_cli_version: string | null;
  semantic_profile_version: typeof CODEX_0_152_1_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  production_profile_version: typeof CODEX_ISOLATED_AUTH_HISTORICAL_0_150_1_SEMANTIC_PROFILE_VERSION_V01;
  production_profile_fingerprint: string;
  production_selected: false;
  production_compatibility_status:
    | "qualified_candidate_only"
    | "not_qualified";
  production_cutover_authorized: false;
  executable_identity_class:
    | "qualification_candidate_codex_0_152_1"
    | "test_emulated_profile";
  runtime_exercised_methods: string[];
  source_compatible_runtime_unqualified_methods: string[];
  source_and_fixture_qualified_notification_methods: string[];
  observed_security_policy_fingerprint: string | null;
  private_environment_observed: boolean;
  private_environment_policy: {
    home: true;
    codex_home: true;
    codex_sqlite_home: true;
    tmpdir: true;
    shared_state_fallback: false;
    ordinary_config_copied: false;
    ordinary_history_copied: false;
    ordinary_memories_inherited: false;
    ordinary_skills_plugins_apps_mcp_inherited: false;
    repository_instructions_inherited: false;
    repository_command_auth_material_inherited: false;
  };
  credential_material_supplied: false;
  provider_model_call_count: 0;
  repository_execution_count: 0;
  repository_turn_started: false;
  successful_external_network_egress_observed: false;
  cleanup_completed: boolean;
  observed_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthProvisioningBindingV01 {
  binding_version: typeof CODEX_ISOLATED_AUTH_PROVISIONING_BINDING_VERSION_V01;
  binding_id: string;
  auth_handle_ref: ExternalRefV01;
  broker_binding_fingerprint: string;
  provider_ref: ExternalRefV01;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
  compatible_codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  projection_mode: typeof CODEX_ISOLATED_AUTH_ROUTE_V01;
  issued_at: string;
  expires_at: string;
  authority: {
    opaque_handle_attestation_read: true;
    authenticated_child_spawn_for_preflight: true;
    is_execution_authority: false;
    is_provider_authority: false;
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

export interface CodexIsolatedAuthCredentialAttestationV01 {
  attestation_version: typeof CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01;
  attestation_id: string;
  provisioning_binding_ref: ExternalRefV01;
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  auth_handle_ref: ExternalRefV01;
  broker_locator_fingerprint: string;
  auth_generation_fingerprint: string;
  auth_storage_contract_version: typeof CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01;
  source_auth_mode: "agentIdentity" | "chatgpt";
  agent_identity_storage_kind: "jwt" | "record";
  managed_chatgpt_binding_verified: boolean;
  agent_identity_task_registration_state: "present";
  account_identity_fingerprint: string;
  account_read_email_fingerprint: string | null;
  agent_identity_runtime_fingerprint: string;
  provider_environment_fingerprint: string;
  plan_projection_fingerprint: string;
  fedramp_projection_fingerprint: string;
  issuer_projection_fingerprint: string | null;
  audience_projection_fingerprint: string | null;
  validity_projection_fingerprint: string | null;
  source_not_before_epoch_seconds: number | null;
  source_expires_at_epoch_seconds: number | null;
  source_expiry_safety_margin_seconds: 60 | null;
  claims_authentication_status: "stored_agent_identity_unverified_before_codex_auth";
  issued_at: string;
  expires_at: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexIsolatedAuthProjectionSealV01 {
  seal_version: typeof CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01;
  seal_id: string;
  provisioning_binding_ref: ExternalRefV01;
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  auth_attestation_ref: ExternalRefV01;
  auth_attestation_fingerprint: string;
  broker_binding_fingerprint: string;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
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
  provisioning_binding_ref: ExternalRefV01;
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
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
  source_auth_mode: "agentIdentity" | "chatgpt";
  agent_identity_storage_kind: "jwt" | "record";
  managed_chatgpt_binding_verified: boolean;
  agent_identity_task_registration_state: "present";
  codex_executable_ref: ExternalRefV01;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
  compatible_codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  state_policy: CodexIsolatedAuthStatePolicyV01;
  config_policy: CodexIsolatedAuthConfigPolicyV01;
  app_server_launch_shape_fingerprint: string;
  launch_injection_mechanism: "broker_internal_attempt_private_auth_snapshot";
  sensitive_material_lifetime: "broker_internal_lookup_to_authenticated_load_only";
  refresh_update_policy: "source_codex_auth_read_only_attempt_snapshot_discarded";
  concurrency_lease_policy: "canonical_handle_generation_lookup_spawn_lease";
  cleanup_policy: "remove_auth_snapshot_before_observation_remove_attempt_root_after_settlement";
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
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  auth_attestation_fingerprint: string;
  auth_source_generation_fingerprint: string;
  claims_authentication_status: "verified_by_codex_agent_identity_auth";
  state_root_fingerprint: string;
  home_identity_fingerprint: string;
  codex_home_identity_fingerprint: string;
  codex_sqlite_home_identity_fingerprint: string;
  tmp_identity_fingerprint: string;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
  codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
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

export interface CodexIsolatedAuthTestExecutionAuthorizationV01 {
  authorization_version: typeof CODEX_ISOLATED_AUTH_TEST_EXECUTION_AUTHORIZATION_VERSION_V01;
  authorization_kind: "test_only_external_execution";
  external_authorization_ref: ExternalRefV01;
  request_id: string;
  run_id: string;
  root_scope_fingerprint: string;
  projection_fingerprint: string;
  execution_environment_fingerprint: string;
  provider_ref: ExternalRefV01;
  model_configuration_ref: ExternalRefV01;
  effective_route_fingerprint: string;
  invocation_ordinal: 1;
  provider_model_bearing_invocation_ceiling: 1;
  expires_at: string;
  no_fallback: true;
  single_use: true;
  test_only: true;
  integrity: CodexIsolatedAuthIntegrityV01;
}
