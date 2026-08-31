import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import path from "node:path";

import {
  CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
  observeCodexAppServerUserAgentV01,
} from "@/lib/vnext/native-host/codex-app-server-user-agent";
import {
  assertCodexBrokerRollbackCleanupAvailableV01,
  containsCodexCredentialSecretShapeV01,
  bindCodexBrokerPrivateLaunchCapabilityV01,
  credentialBrokerBindingFingerprintV01,
  assertSourceOwnedCodexCredentialBrokerV01,
  spawnCodexAppServerWithPrivateCapabilityV01,
  type CodexBrokerPrivateLaunchCapabilityV01,
  type CodexCredentialBrokerBindingV01,
  type CodexCredentialBrokerV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
import {
  consumeCodexAuthenticatedChildBindingIntoPreflightV01,
  type CodexIsolatedAuthenticatedPreflightSessionV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import {
  CODEX_ISOLATED_AUTH_BROKER_VERSION_V01,
  CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01,
  CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
  CODEX_AUTH_KEYRING_SERVICE_V01,
  CODEX_AGENT_IDENTITY_EFFECTIVE_BASE_URL_V01,
  CODEX_APP_SERVER_CLIENT_VERSION_V01,
  CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01,
  CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01,
  CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01,
  CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01,
  CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01,
  CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01,
  CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01,
  CODEX_ISOLATED_AUTH_PROVISIONING_BINDING_VERSION_V01,
  CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01,
  CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01,
  CODEX_ISOLATED_AUTH_ROUTE_V01,
  type CodexIsolatedAuthAvailabilityV01,
  type CodexIsolatedAuthConfigPolicyV01,
  type CodexIsolatedAuthCredentialAttestationV01,
  type CodexIsolatedAuthObservationV01,
  type CodexIsolatedAuthProvisioningBindingV01,
  type CodexIsolatedAuthProjectionSealV01,
  type CodexIsolatedAuthProjectionV01,
  type CodexIsolatedAuthSemanticProfileV01,
  type CodexIsolatedAuthStatePolicyV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const PROVIDER_ROUTE_MATERIAL_V01 = {
  provider_projection_version: "codex_agent_identity_effective_provider.v0.1",
  provider: "openai",
  auth_mode: "agent_identity",
  raw_provider_base_url: null,
  effective_provider_base_url_fingerprint: createProtocolSha256V01(
    CODEX_AGENT_IDENTITY_EFFECTIVE_BASE_URL_V01,
  ),
  wire_api: "responses",
  requires_openai_auth: true,
  supports_websockets: true,
  supports_standalone_web_search: true,
  builtin_version_header_owned: true,
  builtin_organization_env_header_owned: true,
  builtin_project_env_header_owned: true,
  isolated_launch_provider_header_env_absent: true,
  request_max_retries: 4,
  stream_max_retries: 5,
  stream_idle_timeout_ms: 300_000,
  websocket_connect_timeout_ms: 15_000,
  env_key_present: false,
  experimental_bearer_token_present: false,
  auth_command_present: false,
  aws_config_present: false,
  query_params_present: false,
  user_http_headers_present: false,
  user_env_http_headers_present: false,
} as const;
const SOURCE_OWNED_EXECUTION_OWNERS_V01 = new WeakSet<object>();
const SOURCE_OWNED_PROVISIONING_BINDINGS_V01 = new WeakSet<object>();
const PROVIDER_ROUTE_FINGERPRINT_V01 = createProtocolSha256V01(
  canonicalizeProtocolValueV01(PROVIDER_ROUTE_MATERIAL_V01),
);
const CONFIG_POLICY_BASE_V01 = {
  policy_version: "codex_isolated_tool_policy.v0.1",
  forced_login_method: "chatgpt",
  auth_store_mode: "file",
  use_agent_identity_feature_enabled: true,
  model_provider: "openai",
  provider_route_fingerprint: PROVIDER_ROUTE_FINGERPRINT_V01,
  provider_projection_version:
    PROVIDER_ROUTE_MATERIAL_V01.provider_projection_version,
  raw_provider_base_url: PROVIDER_ROUTE_MATERIAL_V01.raw_provider_base_url,
  effective_provider_base_url_fingerprint:
    PROVIDER_ROUTE_MATERIAL_V01.effective_provider_base_url_fingerprint,
  wire_api: PROVIDER_ROUTE_MATERIAL_V01.wire_api,
  requires_openai_auth: PROVIDER_ROUTE_MATERIAL_V01.requires_openai_auth,
  supports_websockets: PROVIDER_ROUTE_MATERIAL_V01.supports_websockets,
  supports_standalone_web_search:
    PROVIDER_ROUTE_MATERIAL_V01.supports_standalone_web_search,
  builtin_version_header_owned:
    PROVIDER_ROUTE_MATERIAL_V01.builtin_version_header_owned,
  builtin_organization_env_header_owned:
    PROVIDER_ROUTE_MATERIAL_V01.builtin_organization_env_header_owned,
  builtin_project_env_header_owned:
    PROVIDER_ROUTE_MATERIAL_V01.builtin_project_env_header_owned,
  isolated_launch_provider_header_env_absent:
    PROVIDER_ROUTE_MATERIAL_V01.isolated_launch_provider_header_env_absent,
  request_max_retries: PROVIDER_ROUTE_MATERIAL_V01.request_max_retries,
  stream_max_retries: PROVIDER_ROUTE_MATERIAL_V01.stream_max_retries,
  stream_idle_timeout_ms: PROVIDER_ROUTE_MATERIAL_V01.stream_idle_timeout_ms,
  websocket_connect_timeout_ms:
    PROVIDER_ROUTE_MATERIAL_V01.websocket_connect_timeout_ms,
  env_key_present: PROVIDER_ROUTE_MATERIAL_V01.env_key_present,
  experimental_bearer_token_present:
    PROVIDER_ROUTE_MATERIAL_V01.experimental_bearer_token_present,
  auth_command_present: PROVIDER_ROUTE_MATERIAL_V01.auth_command_present,
  aws_config_present: PROVIDER_ROUTE_MATERIAL_V01.aws_config_present,
  query_params_present: PROVIDER_ROUTE_MATERIAL_V01.query_params_present,
  user_http_headers_present:
    PROVIDER_ROUTE_MATERIAL_V01.user_http_headers_present,
  user_env_http_headers_present:
    PROVIDER_ROUTE_MATERIAL_V01.user_env_http_headers_present,
  config_layer_policy: "session_flags_exact_no_active_non_session_layers",
  config_requirements_policy:
    "not_enumerated_critical_override_origins_intact",
  web_search: "disabled",
  mcp_server_count: 0,
  plugin_count: 0,
  app_count: 0,
  skill_source_count: 0,
  project_instruction_bytes: 0,
  login_shell_allowed: false,
  shell_environment_inherit: "core",
  shell_default_sensitive_name_excludes: true,
  repository_command_auth_material_inheritance: false,
  sqlite_config_projection: "absent",
  sqlite_runtime_binding: "private_codex_sqlite_home_environment",
  sqlite_runtime_source: "CODEX_SQLITE_HOME",
  sqlite_runtime_private_root_required: true,
  sqlite_runtime_shared_fallback_forbidden: true,
  apps_config_projection: "source_default_only",
  apps_capability: "disabled_by_feature",
  thread_instruction_sources: "empty",
  orchestrator_skills_enabled: false,
  orchestrator_mcp_enabled: false,
  remote_tool_features_enabled: 0,
} as const;
const STATE_POLICY_V01: CodexIsolatedAuthStatePolicyV01 = {
  strategy_version: "codex_isolated_state_home.v0.2",
  per_attempt_private_root: true,
  home_isolated: true,
  codex_home_isolated: true,
  codex_sqlite_home_isolated: true,
  tmp_isolated: true,
  shared_state_fallback_forbidden: true,
  source_auth_file_copy_forbidden: true,
  broker_owned_minimal_auth_snapshot:
    "attempt_private_official_auth_dot_json",
  broker_owned_auth_snapshot_mode_0600: true,
  broker_owned_auth_snapshot_removed_before_observation: true,
  auth_file_symlink_forbidden: true,
  ordinary_config_copy_forbidden: true,
  ordinary_history_copy_forbidden: true,
  ordinary_skill_copy_forbidden: true,
  caller_tmpdir_override_forbidden: true,
  ephemeral_thread_required: true,
  remove_after_settlement: true,
};
const CONFIG_OVERRIDE_ARGS_V01 = CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01;
const CONFIG_PROVENANCE_CONTRACT_VERSION_V01 =
  "codex_config_read_provenance.rust-v0.150.1" as const;
type BoundedRuntimeOverrideValueV01 =
  | string
  | number
  | boolean
  | readonly []
  | Readonly<Record<string, never>>;
type RuntimeOverrideEntryV01 = {
  path: string;
  value: BoundedRuntimeOverrideValueV01;
};
const EXPECTED_RUNTIME_OVERRIDE_ENTRIES_V01 =
  parseRuntimeConfigOverrideArgsV01(CONFIG_OVERRIDE_ARGS_V01);
const EXPECTED_RUNTIME_OVERRIDE_PATHS_V01 =
  EXPECTED_RUNTIME_OVERRIDE_ENTRIES_V01.map((entry) => entry.path);
const EXPECTED_RUNTIME_OVERRIDE_PROJECTION_V01 =
  runtimeOverrideProjectionV01(EXPECTED_RUNTIME_OVERRIDE_ENTRIES_V01);
const EXPECTED_RUNTIME_ORIGIN_PATHS_V01 =
  runtimeOverrideOriginPathsV01(EXPECTED_RUNTIME_OVERRIDE_ENTRIES_V01);
const EXPECTED_SESSION_FLAGS_LAYER_VERSION_V01 = createProtocolSha256V01(
  canonicalizeProtocolValueV01(EXPECTED_RUNTIME_OVERRIDE_PROJECTION_V01),
);
const ALLOWED_ENV_KEYS_V01 = [
  "CODEX_HOME",
  "CODEX_SQLITE_HOME",
  "HOME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "NODE_ENV",
  "NO_COLOR",
  "PATH",
  "TERM",
  "TMPDIR",
  "TZ",
] as const;
const FORBIDDEN_UPSTREAM_OVERRIDE_ENV_KEYS_V01 = [
  "CODEX_AGENT_IDENTITY_AUTHAPI_BASE_URL",
  "CODEX_AGENT_IDENTITY_JWKS_BASE_URL",
  "CODEX_INTERNAL_ORIGINATOR_OVERRIDE",
] as const;
const FORBIDDEN_SURFACES_V01 = [
  "adapter_options",
  "argv",
  "artifact",
  "debug_output",
  "error",
  "lifecycle_event",
  "log",
  "native_host_request",
  "native_host_result",
  "protocol_record",
  "run_receipt",
  "trace",
] as const;
const DISABLED_FEATURE_NAMES_V01 = [
  "apps",
  "auth_elicitation",
  "browser_use",
  "browser_use_external",
  "browser_use_full_cdp_access",
  "computer_use",
  "hooks",
  "image_generation",
  "in_app_browser",
  "mcp_2026_07_28",
  "memories",
  "mentions_v2",
  "multi_agent",
  "network_proxy",
  "plugins",
  "recommended_plugins",
  "remote_control",
  "remote_plugin",
  "request_permissions_tool",
  "standalone_web_search",
  "tool_suggest",
  "web_search_cached",
  "web_search_request",
] as const;
const CONFIG_PROVENANCE_CONTRACT_MATERIAL_V01 = {
  contract_version: CONFIG_PROVENANCE_CONTRACT_VERSION_V01,
  config_read_include_layers: true,
  packaged_defaults_filtered_before_response: true,
  session_flags_layer_required: true,
  active_non_session_layer_count: 0,
  expected_runtime_override_paths: [...EXPECTED_RUNTIME_OVERRIDE_PATHS_V01],
  expected_runtime_origin_paths: [...EXPECTED_RUNTIME_ORIGIN_PATHS_V01],
  requirements_enumerated: false,
  critical_requirement_shadow_detection:
    "missing_expected_session_flags_origin",
} as const;
const AGENT_IDENTITY_CLAIM_CONTRACT_MATERIAL_V01 = {
  contract_version: CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01,
  algorithm: "RS256",
  kid_required: true,
  issuer: "https://chatgpt.com/codex-backend/agent-identity",
  audience: "codex-app-server",
  required_claims: [
    "iss",
    "aud",
    "iat",
    "exp",
    "agent_runtime_id",
    "agent_private_key",
    "account_id",
    "chatgpt_user_id",
    "plan_type",
    "chatgpt_account_is_fedramp",
  ],
  optional_claims: ["email"],
  source_expiry_safety_margin_seconds: 60,
} as const;
export const CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01 = deepFreezeV01({
  contract_version: CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
  supported_source_stores: ["file", "macos_direct_keyring"],
  file_source_location: "CODEX_HOME/auth.json",
  file_source_value: "serialized_auth_dot_json",
  keyring_service: CODEX_AUTH_KEYRING_SERVICE_V01,
  keyring_account_derivation:
    "cli_pipe_first_16_hex_sha256_of_canonical_codex_home",
  keyring_value: "serialized_auth_dot_json",
  supported_agent_identity_storage: ["jwt", "record"],
  managed_chatgpt_agent_identity_route:
    "upstream_auth_manager_chatgpt_auth_policy",
  managed_chatgpt_use_agent_identity_feature_required: true,
  manual_agent_identity_jwt_required: false,
  api_key_substitution_forbidden: true,
  source_storage_writeback: "forbidden",
  launch_snapshot:
    "minimal_agent_identity_auth_dot_json_in_attempt_private_codex_home",
  launch_snapshot_mode: "0600",
  launch_snapshot_removed_before_authenticated_observation: true,
  bootstrap_network_class:
    "credential_bootstrap_separate_from_task_provider_inference",
  external_execution_authorization_before_agent_identity_material: "forbidden",
} as const);
const APP_SERVER_METHOD_PROFILE_MATERIAL_V01 = {
  method_profile_version: "codex_app_server_auth_preflight.rust-v0.150.1",
  initialize: "initialize",
  initialized: "initialized",
  account_read: "account/read",
  auth_status: "getAuthStatus",
  config_read: "config/read",
  mcp_status: "mcpServerStatus/list",
  thread_start: "thread/start",
  turn_start: "turn/start",
  user_agent_contract_version:
    CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  user_agent_contract_fingerprint:
    CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
} as const;
const CONFIG_TOOL_FEATURE_SCHEMA_FINGERPRINT_V01 = createProtocolSha256V01(
  canonicalizeProtocolValueV01({
    config_policy: CONFIG_POLICY_BASE_V01,
    config_override_args: CONFIG_OVERRIDE_ARGS_V01,
    disabled_features: [...DISABLED_FEATURE_NAMES_V01],
    config_provenance_contract: CONFIG_PROVENANCE_CONTRACT_MATERIAL_V01,
  }),
);
const REQUIRED_ENVIRONMENT_AUTH_BEHAVIOR_FINGERPRINT_V01 =
  createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      state_policy: STATE_POLICY_V01,
      allowed_environment_keys: ALLOWED_ENV_KEYS_V01,
      forbidden_upstream_override_environment_keys:
        FORBIDDEN_UPSTREAM_OVERRIDE_ENV_KEYS_V01,
      launch_injection_mechanism:
        "broker_internal_attempt_private_auth_snapshot",
      auth_store_mode: "file",
      source_auth_file_copy_forbidden: true,
      broker_owned_minimal_auth_snapshot:
        "attempt_private_official_auth_dot_json",
      ordinary_codex_home_fallback_forbidden: true,
    }),
  );
const SEMANTIC_PROFILE_MATERIAL_V01 = {
  semantic_profile_version: CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01,
  upstream_tag: CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01,
  upstream_source_commit: CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01,
  supported_public_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  pinned_production_executable_fingerprint:
    CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01,
  agent_identity_claim_contract_version:
    CODEX_AGENT_IDENTITY_CLAIM_CONTRACT_VERSION_V01,
  agent_identity_claim_contract_fingerprint: createProtocolSha256V01(
    canonicalizeProtocolValueV01(AGENT_IDENTITY_CLAIM_CONTRACT_MATERIAL_V01),
  ),
  auth_storage_contract_version:
    CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
  auth_storage_contract_fingerprint: createProtocolSha256V01(
    canonicalizeProtocolValueV01(CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_V01),
  ),
  effective_provider_rule_fingerprint: PROVIDER_ROUTE_FINGERPRINT_V01,
  config_tool_feature_schema_fingerprint:
    CONFIG_TOOL_FEATURE_SCHEMA_FINGERPRINT_V01,
  app_server_method_profile_fingerprint: createProtocolSha256V01(
    canonicalizeProtocolValueV01(APP_SERVER_METHOD_PROFILE_MATERIAL_V01),
  ),
  app_server_user_agent_contract_version:
    CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  app_server_user_agent_contract_fingerprint:
    CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
  required_environment_auth_behavior_fingerprint:
    REQUIRED_ENVIRONMENT_AUTH_BEHAVIOR_FINGERPRINT_V01,
} as const;
export const CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01:
  CodexIsolatedAuthSemanticProfileV01 = deepFreezeV01({
  ...SEMANTIC_PROFILE_MATERIAL_V01,
  integrity: integrityV01(SEMANTIC_PROFILE_MATERIAL_V01),
});
const TEST_ENV_KEYS_V01 = new Set([
  "AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE",
  "FAKE_CODEX_AUTH_BOUNDARY_PATH",
  "FAKE_CODEX_CLEANUP_MARKER_PATH",
  "FAKE_CODEX_NETWORK_COUNT_PATH",
  "FAKE_CODEX_ORACLE_GUARD_PATH",
  "FAKE_CODEX_SCENARIO",
  "FAKE_CODEX_SESSION_ID",
  "FAKE_CODEX_THREAD_ID",
  "FAKE_CODEX_TRACE_PATH",
  "FAKE_CODEX_TURN_ID",
]);
const DISABLED_FEATURES_V01 = new Set<string>(DISABLED_FEATURE_NAMES_V01);

export class CodexIsolatedAuthProjectionErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexIsolatedAuthProjectionErrorV01";
  }
}

export interface ProvisionCodexIsolatedAuthProjectionInputV01 {
  projection_id: string;
  provisioning_binding: CodexIsolatedAuthProvisioningBindingV01;
  provisioning_binding_ref: ExternalRefV01;
  provider_ref: ExternalRefV01;
  broker_binding: CodexCredentialBrokerBindingV01;
  broker: CodexCredentialBrokerV01;
  codex_executable_ref: ExternalRefV01;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
  compatible_codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  issued_at: string;
  expires_at: string;
}

export function createCodexIsolatedAuthProvisioningBindingV01(input: {
  binding_id: string;
  auth_handle_ref: ExternalRefV01;
  broker_binding_fingerprint: string;
  provider_ref: ExternalRefV01;
  codex_executable_fingerprint: string;
  executable_identity_class:
    | "production_pinned_codex"
    | "test_emulated_profile";
  compatible_codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  issued_at: string;
  expires_at: string;
}): CodexIsolatedAuthProvisioningBindingV01 {
  validateRefV01(input.auth_handle_ref);
  validateRefV01(input.provider_ref);
  if (
    input.provider_ref.ref_type !== "model_provider" ||
    input.provider_ref.external_id !== "openai" ||
    parseStrictIsoTimestampV01(input.issued_at) === null ||
    parseStrictIsoTimestampV01(input.expires_at) === null ||
    Date.parse(input.expires_at) <= Date.parse(input.issued_at)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_provisioning_binding_invalid",
    );
  const material = {
    binding_version: CODEX_ISOLATED_AUTH_PROVISIONING_BINDING_VERSION_V01,
    binding_id: requiredIdV01(input.binding_id),
    auth_handle_ref: normalizeExternalRefPrimitiveV01(input.auth_handle_ref),
    broker_binding_fingerprint: requiredSha256V01(
      input.broker_binding_fingerprint,
    ),
    provider_ref: normalizeExternalRefPrimitiveV01(input.provider_ref),
    codex_executable_fingerprint: requiredSha256V01(
      input.codex_executable_fingerprint,
    ),
    executable_identity_class: exactExecutableIdentityClassV01(
      input.executable_identity_class,
      input.codex_executable_fingerprint,
    ),
    compatible_codex_cli_version: exactSupportedCliVersionV01(
      input.compatible_codex_cli_version,
    ),
    semantic_profile_version:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    projection_mode: CODEX_ISOLATED_AUTH_ROUTE_V01,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
    authority: {
      opaque_handle_attestation_read: true,
      authenticated_child_spawn_for_preflight: true,
      is_execution_authority: false,
      is_provider_authority: false,
      repository_execution_granted: false,
      provider_call_granted: false,
      task_network_granted: false,
      github_write_granted: false,
      semantic_write_granted: false,
      policy_activation_granted: false,
      publication_granted: false,
      merge_granted: false,
    },
  } as const;
  const binding: CodexIsolatedAuthProvisioningBindingV01 = {
    ...material,
    integrity: integrityV01(material),
  };
  assertSafePublicV01(binding);
  SOURCE_OWNED_PROVISIONING_BINDINGS_V01.add(binding);
  return deepFreezeV01(binding);
}

export interface ProvisionCodexIsolatedAuthProjectionResultV01 {
  availability: CodexIsolatedAuthAvailabilityV01;
  credential_attestation: CodexIsolatedAuthCredentialAttestationV01;
  projection_seal: CodexIsolatedAuthProjectionSealV01;
  projection: CodexIsolatedAuthProjectionV01;
}

export interface CodexIsolatedAuthLaunchInputV01 {
  projection: CodexIsolatedAuthProjectionV01;
  credential_attestation: CodexIsolatedAuthCredentialAttestationV01;
  projection_seal: CodexIsolatedAuthProjectionSealV01;
  broker: CodexCredentialBrokerV01;
  state_parent: string;
  repository_root: string;
  command: string;
  prefix_args?: string[];
  base_environment: {
    NODE_ENV?: "production" | "development" | "test";
    PATH?: string;
    LANG?: string;
    LC_ALL?: string;
    LC_CTYPE?: string;
    TZ?: string;
    TERM?: string;
    NO_COLOR?: string;
    TMPDIR?: string;
  };
  test_environment?: Record<string, string | undefined>;
}

interface StateV01 {
  root: DirectoryIdentityV01;
  home: DirectoryIdentityV01;
  codexHome: DirectoryIdentityV01;
  sqliteHome: DirectoryIdentityV01;
  tmp: DirectoryIdentityV01;
}
interface DirectoryIdentityV01 {
  path: string;
  device: bigint;
  inode: bigint;
  fingerprint: string;
}
interface ExecutableIdentityV01 extends DirectoryIdentityV01 {}

export async function provisionCodexIsolatedAuthProjectionV01(
  input: ProvisionCodexIsolatedAuthProjectionInputV01,
): Promise<ProvisionCodexIsolatedAuthProjectionResultV01> {
  validateProvisionInputV01(input);
  const binding = input.provisioning_binding;
  if (
    !SOURCE_OWNED_PROVISIONING_BINDINGS_V01.has(binding) ||
    binding.integrity.fingerprint !==
      integrityV01(
        Object.fromEntries(
          Object.entries(binding).filter(([key]) => key !== "integrity"),
        ),
      ).fingerprint ||
    canonicalizeProtocolValueV01(binding.auth_handle_ref) !==
      canonicalizeProtocolValueV01(input.broker_binding.auth_handle_ref) ||
    binding.broker_binding_fingerprint !==
      credentialBrokerBindingFingerprintV01(input.broker_binding) ||
    canonicalizeProtocolValueV01(binding.provider_ref) !==
      canonicalizeProtocolValueV01(input.provider_ref) ||
    binding.codex_executable_fingerprint !==
      input.codex_executable_fingerprint ||
    binding.executable_identity_class !==
      input.executable_identity_class ||
    binding.compatible_codex_cli_version !==
      input.compatible_codex_cli_version ||
    binding.semantic_profile_version !==
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version ||
    binding.semantic_profile_fingerprint !==
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint ||
    binding.issued_at !== input.issued_at ||
    binding.expires_at !== input.expires_at
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_provisioning_binding_refused",
    );
  const bindingRef = createRefV01(
    "codex_auth_provisioning_binding",
    binding.binding_id,
    binding.issued_at,
  );
  if (
    canonicalizeProtocolValueV01(
      normalizeExternalRefPrimitiveV01(input.provisioning_binding_ref),
    ) !== canonicalizeProtocolValueV01(bindingRef)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_provisioning_binding_refused",
    );
  assertSourceOwnedCodexCredentialBrokerV01(
    input.broker,
    credentialBrokerBindingFingerprintV01(input.broker_binding),
  );
  if (
    input.broker.binding_fingerprint !==
    credentialBrokerBindingFingerprintV01(input.broker_binding)
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_broker_binding_mismatch",
    );
  }
  const availability = await input.broker.availabilityV01({
    codex_executable_fingerprint: input.codex_executable_fingerprint,
    observed_at: input.issued_at,
  });
  if (availability.state !== "available_exact") {
    throw new CodexIsolatedAuthProjectionErrorV01(
      `codex_isolated_auth_${availability.state}`,
    );
  }
  const attestation = await input.broker.provisionCredentialAttestationV01({
    provisioning_binding_ref: bindingRef,
    semantic_profile_version:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    attestation_id: `${requiredIdV01(input.projection_id)}:credential-attestation`,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
  });
  assertSafePublicV01(attestation);
  const attestationRef = createRefV01(
    "codex_auth_credential_attestation",
    attestation.attestation_id,
    input.issued_at,
  );
  const sealRef = createRefV01(
    "codex_auth_projection_seal",
    `${input.projection_id}:seal`,
    input.issued_at,
  );
  const configPolicy = expectedConfigPolicyV01();
  const launchShape = launchShapeFingerprintV01(
    input.codex_executable_fingerprint,
    input.compatible_codex_cli_version,
  );
  const sealMaterial = {
    seal_version: CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01,
    seal_id: `${input.projection_id}:seal`,
    provisioning_binding_ref: bindingRef,
    semantic_profile_version:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    auth_attestation_ref: attestationRef,
    auth_attestation_fingerprint: attestation.integrity.fingerprint,
    broker_binding_fingerprint: input.broker.binding_fingerprint,
    codex_executable_fingerprint: requiredSha256V01(
      input.codex_executable_fingerprint,
    ),
    executable_identity_class: input.executable_identity_class,
    config_policy_fingerprint: configPolicy.policy_fingerprint,
    state_policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(STATE_POLICY_V01),
    ),
    app_server_launch_shape_fingerprint: launchShape,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
  } as const;
  const seal: CodexIsolatedAuthProjectionSealV01 = {
    ...sealMaterial,
    integrity: integrityV01(sealMaterial),
  };
  const material = {
    projection_version: CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01,
    projection_id: requiredIdV01(input.projection_id),
    projection_mode: CODEX_ISOLATED_AUTH_ROUTE_V01,
    provisioning_binding_ref: bindingRef,
    semantic_profile_version:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    auth_attestation_ref: attestationRef,
    auth_attestation_fingerprint: attestation.integrity.fingerprint,
    projection_seal_ref: sealRef,
    projection_seal_fingerprint: seal.integrity.fingerprint,
    provider_ref: normalizeExternalRefPrimitiveV01(input.provider_ref),
    auth_mode: "agent_identity",
    auth_handle_ref: normalizeExternalRefPrimitiveV01(
      input.broker_binding.auth_handle_ref,
    ),
    broker_version: CODEX_ISOLATED_AUTH_BROKER_VERSION_V01,
    broker_backend_ref: normalizeExternalRefPrimitiveV01(
      input.broker_binding.broker_backend_ref,
    ),
    broker_executable_ref: normalizeExternalRefPrimitiveV01(
      input.broker_binding.broker_executable_ref,
    ),
    broker_executable_fingerprint: requiredSha256V01(
      input.broker_binding.broker_executable_fingerprint,
    ),
    broker_locator_fingerprint: requiredSha256V01(
      input.broker_binding.broker_locator_fingerprint,
    ),
    auth_source_generation_fingerprint: attestation.auth_generation_fingerprint,
    account_identity_fingerprint: attestation.account_identity_fingerprint,
    source_auth_mode: attestation.source_auth_mode,
    agent_identity_storage_kind: attestation.agent_identity_storage_kind,
    managed_chatgpt_binding_verified:
      attestation.managed_chatgpt_binding_verified,
    agent_identity_task_registration_state:
      attestation.agent_identity_task_registration_state,
    codex_executable_ref: normalizeExternalRefPrimitiveV01(
      input.codex_executable_ref,
    ),
    codex_executable_fingerprint: requiredSha256V01(
      input.codex_executable_fingerprint,
    ),
    executable_identity_class: input.executable_identity_class,
    compatible_codex_cli_version: exactSupportedCliVersionV01(
      input.compatible_codex_cli_version,
    ),
    state_policy: STATE_POLICY_V01,
    config_policy: configPolicy,
    app_server_launch_shape_fingerprint: launchShape,
    launch_injection_mechanism:
      "broker_internal_attempt_private_auth_snapshot",
    sensitive_material_lifetime:
      "broker_internal_lookup_to_authenticated_load_only",
    refresh_update_policy:
      "source_codex_auth_read_only_attempt_snapshot_discarded",
    concurrency_lease_policy: "canonical_handle_generation_lookup_spawn_lease",
    cleanup_policy:
      "remove_auth_snapshot_before_observation_remove_attempt_root_after_settlement",
    allowed_child_environment_key_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(ALLOWED_ENV_KEYS_V01),
    ),
    forbidden_persistence_surface_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(FORBIDDEN_SURFACES_V01),
    ),
    auth_bootstrap_network_class:
      "credential_bootstrap_separate_from_task_network",
    task_tool_network_authority: "none",
    issued_at: input.issued_at,
    expires_at: input.expires_at,
    authority: {
      repository_execution_granted: false,
      provider_call_granted: false,
      task_network_granted: false,
      github_write_granted: false,
      semantic_write_granted: false,
      policy_activation_granted: false,
      publication_granted: false,
      merge_granted: false,
    },
  } as const;
  const projection: CodexIsolatedAuthProjectionV01 = {
    ...material,
    integrity: integrityV01(material),
  };
  assertValidCodexIsolatedAuthProjectionV01(projection, attestation, seal);
  return {
    availability,
    credential_attestation: attestation,
    projection_seal: seal,
    projection,
  };
}

export class CodexIsolatedAuthenticatedExecutionOwnerV01 {
  readonly projection: CodexIsolatedAuthProjectionV01;
  readonly state_root_fingerprint: string;
  readonly home_identity_fingerprint: string;
  readonly codex_home_identity_fingerprint: string;
  readonly codex_sqlite_home_identity_fingerprint: string;
  readonly tmp_identity_fingerprint: string;
  readonly repository_root_fingerprint: string;
  readonly execution_environment_fingerprint: string;
  readonly #attestation: CodexIsolatedAuthCredentialAttestationV01;
  readonly #seal: CodexIsolatedAuthProjectionSealV01;
  readonly #broker: CodexCredentialBrokerV01;
  readonly #state: StateV01;
  readonly #command: ExecutableIdentityV01;
  readonly #baseEnvironment: NodeJS.ProcessEnv;
  readonly #testEnvironment: Record<string, string | undefined>;
  readonly #launchCapability: CodexBrokerPrivateLaunchCapabilityV01;
  readonly #repositoryRoot: string;
  #spawned = false;
  #cleaned = false;
  #observation: CodexIsolatedAuthObservationV01 | null = null;

  constructor(input: CodexIsolatedAuthLaunchInputV01) {
    if (new.target !== CodexIsolatedAuthenticatedExecutionOwnerV01)
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_owner_subclass_refused",
      );
    const projection = deepFreezeV01(structuredClone(input.projection));
    const credentialAttestation = deepFreezeV01(
      structuredClone(input.credential_attestation),
    );
    const projectionSeal = deepFreezeV01(
      structuredClone(input.projection_seal),
    );
    assertValidCodexIsolatedAuthProjectionV01(
      projection,
      credentialAttestation,
      projectionSeal,
    );
    if (
      input.broker.binding_fingerprint !==
      projectionSeal.broker_binding_fingerprint
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_broker_binding_mismatch",
      );
    assertSourceOwnedCodexCredentialBrokerV01(
      input.broker,
      projectionSeal.broker_binding_fingerprint,
    );
    this.projection = projection;
    this.#attestation = credentialAttestation;
    this.#seal = projectionSeal;
    this.#broker = input.broker;
    this.#command = exactExecutableV01(
      input.command,
      input.projection.codex_executable_fingerprint,
    );
    const prefix = validatePrefixArgsV01(input.prefix_args ?? []);
    if (
      launchShapeFingerprintV01(
        input.projection.codex_executable_fingerprint,
        input.projection.compatible_codex_cli_version,
      ) !== input.projection.app_server_launch_shape_fingerprint
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_launch_shape_mismatch",
      );
    this.#baseEnvironment = boundedBaseEnvironmentV01(input.base_environment);
    this.#testEnvironment = validateTestEnvironmentV01(
      input.test_environment ?? {},
    );
    this.#state = createStateV01(input.state_parent);
    this.state_root_fingerprint = this.#state.root.fingerprint;
    this.home_identity_fingerprint = this.#state.home.fingerprint;
    this.codex_home_identity_fingerprint = this.#state.codexHome.fingerprint;
    this.codex_sqlite_home_identity_fingerprint =
      this.#state.sqliteHome.fingerprint;
    this.tmp_identity_fingerprint = this.#state.tmp.fingerprint;
    this.#repositoryRoot = exactRepositoryRootV01(input.repository_root);
    this.repository_root_fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        version: "codex_isolated_auth_repository_root.v0.1",
        canonical_root: this.#repositoryRoot,
      }),
    );
    this.execution_environment_fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        version: "codex_isolated_auth_execution_environment.v0.1",
        semantic_profile_fingerprint:
          this.projection.semantic_profile_fingerprint,
        projection_fingerprint: this.projection.integrity.fingerprint,
        repository_root_fingerprint: this.repository_root_fingerprint,
        state_root_fingerprint: this.#state.root.fingerprint,
        home_identity_fingerprint: this.#state.home.fingerprint,
        codex_home_identity_fingerprint: this.#state.codexHome.fingerprint,
        codex_sqlite_home_identity_fingerprint:
          this.#state.sqliteHome.fingerprint,
        tmp_identity_fingerprint: this.#state.tmp.fingerprint,
        config_policy_fingerprint:
          this.projection.config_policy.policy_fingerprint,
      }),
    );
    SOURCE_OWNED_EXECUTION_OWNERS_V01.add(this);
    this.#launchCapability = bindCodexBrokerPrivateLaunchCapabilityV01({
      owner: this,
      broker: this.#broker,
      projection: this.projection,
      credential_attestation: this.#attestation,
      command: this.#command.path,
      test_prefix_args: [...prefix],
      repository_root: this.#repositoryRoot,
      state_paths: {
        root: this.#state.root.path,
        HOME: this.#state.home.path,
        CODEX_HOME: this.#state.codexHome.path,
        CODEX_SQLITE_HOME: this.#state.sqliteHome.path,
        TMPDIR: this.#state.tmp.path,
      },
      base_environment: {
        NODE_ENV: this.#baseEnvironment.NODE_ENV as
          | "production"
          | "development"
          | "test",
        ...(this.#baseEnvironment.PATH
          ? { PATH: this.#baseEnvironment.PATH }
          : {}),
        ...(this.#baseEnvironment.LANG
          ? { LANG: this.#baseEnvironment.LANG }
          : {}),
        ...(this.#baseEnvironment.LC_ALL
          ? { LC_ALL: this.#baseEnvironment.LC_ALL }
          : {}),
        ...(this.#baseEnvironment.LC_CTYPE
          ? { LC_CTYPE: this.#baseEnvironment.LC_CTYPE }
          : {}),
        ...(this.#baseEnvironment.NO_COLOR
          ? { NO_COLOR: this.#baseEnvironment.NO_COLOR }
          : {}),
        ...(this.#baseEnvironment.TERM
          ? { TERM: this.#baseEnvironment.TERM }
          : {}),
        ...(this.#baseEnvironment.TZ ? { TZ: this.#baseEnvironment.TZ } : {}),
      },
      test_controls: { ...this.#testEnvironment },
      launch_shape_fingerprint:
        this.#seal.app_server_launch_shape_fingerprint,
    });
    Object.freeze(this);
  }

  async startAuthenticatedPreflightV01(): Promise<CodexIsolatedAuthenticatedPreflightSessionV01> {
    if (this.#spawned || this.#cleaned)
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_owner_single_use_refused",
      );
    assertProjectionTimeV01(this.projection);
    this.assertStateV01(true);
    assertIdentityV01(this.#command);
    this.#spawned = true;
    try {
      const authenticatedChildBinding =
        await spawnCodexAppServerWithPrivateCapabilityV01(
        this.#launchCapability,
      );
      return await consumeCodexAuthenticatedChildBindingIntoPreflightV01({
        owner: this,
        authenticated_child_binding: authenticatedChildBinding,
        repository_root: this.#repositoryRoot,
        observe_authenticated_configuration: (observationInput) =>
          this.#observeInitializedAccountV01(observationInput),
      });
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          "code" in error &&
          error.code === "codex_auth_broker_child_rollback_incomplete"
        )
      )
        this.cleanupV01();
      throw error;
    }
  }

  assertRepositoryRootV01(value: string): void {
    if (exactRepositoryRootV01(value) !== this.#repositoryRoot)
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_repository_root_mismatch",
      );
  }

  #observeInitializedAccountV01(input: {
    initialized: Record<string, unknown>;
    auth_status: Record<string, unknown>;
    account: Record<string, unknown>;
    config: Record<string, unknown>;
    mcp_status: Record<string, unknown>;
    observed_at: string;
  }): CodexIsolatedAuthObservationV01 {
    this.assertStateV01(false);
    if (
      realpathSync(
        requiredTextV01(
          input.initialized.codexHome,
          "codex_isolated_auth_initialize_home_missing",
        ),
      ) !== this.#state.codexHome.path
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_initialize_home_mismatch",
      );
    const semanticProfile =
      observeCodexIsolatedAuthCredentialFreeSemanticProfileV01({
        initialized: input.initialized,
        config: input.config,
        codex_sqlite_home: this.#state.sqliteHome.path,
        expected_client_name: "augnes",
      });
    const cliVersion = semanticProfile.observed_cli_version;
    assertAuthStatusV01(input.auth_status);
    const accountRead = accountReadProjectionV01(input.account);
    if (
      accountRead.planFingerprint !==
        this.#attestation.plan_projection_fingerprint ||
      (this.#attestation.account_read_email_fingerprint !== null &&
        accountRead.emailFingerprint !== null &&
        accountRead.emailFingerprint !==
          this.#attestation.account_read_email_fingerprint)
    ) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_account_projection_mismatch",
      );
    }
    if (
      semanticProfile.semantic_profile_fingerprint !==
        this.projection.semantic_profile_fingerprint ||
      semanticProfile.observed_security_policy_fingerprint !==
        this.projection.config_policy.policy_fingerprint
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_config_policy_mismatch",
      );
    const data = Array.isArray(input.mcp_status.data)
      ? input.mcp_status.data
      : null;
    if (!data || data.length !== 0 || input.mcp_status.nextCursor !== null)
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_mcp_policy_mismatch",
      );
    const material = {
      observation_version: CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01,
      projection_id: this.projection.projection_id,
      projection_fingerprint: this.projection.integrity.fingerprint,
      semantic_profile_version: this.projection.semantic_profile_version,
      semantic_profile_fingerprint: this.projection.semantic_profile_fingerprint,
      auth_attestation_fingerprint: this.#attestation.integrity.fingerprint,
      auth_source_generation_fingerprint:
        this.#attestation.auth_generation_fingerprint,
      claims_authentication_status: "verified_by_codex_agent_identity_auth",
      state_root_fingerprint: this.#state.root.fingerprint,
      home_identity_fingerprint: this.#state.home.fingerprint,
      codex_home_identity_fingerprint: this.#state.codexHome.fingerprint,
      codex_sqlite_home_identity_fingerprint:
        this.#state.sqliteHome.fingerprint,
      tmp_identity_fingerprint: this.#state.tmp.fingerprint,
      codex_executable_fingerprint:
        this.projection.codex_executable_fingerprint,
      executable_identity_class:
        this.projection.executable_identity_class,
      codex_cli_version: cliVersion,
      auth_mode: "agent_identity",
      account_identity_fingerprint:
        this.#attestation.account_identity_fingerprint,
      account_read_projection_fingerprint: accountRead.fingerprint,
      observed_security_policy_fingerprint:
        semanticProfile.observed_security_policy_fingerprint,
      provider_route_fingerprint:
        semanticProfile.provider_route_fingerprint,
      config_layers_fingerprint: semanticProfile.config_layers_fingerprint,
      codex_sqlite_home_reobserved: true,
      mcp_server_count: 0,
      unexpected_tool_policy_observed: false,
      ephemeral_thread_required: true,
      shared_state_observed: false,
      attempt_auth_material_persisted: false,
      auth_material_exposed_outside_app_server_launch_boundary: false,
      repository_command_auth_material_inherited: false,
      task_tool_network_authority: "none",
      observed_at: input.observed_at,
    } as const;
    const observation: CodexIsolatedAuthObservationV01 = {
      ...material,
      integrity: integrityV01(material),
    };
    assertValidCodexIsolatedAuthObservationV01(observation, this.projection);
    this.#observation = observation;
    return observation;
  }

  assertFreshThreadResponseV01(response: Record<string, unknown>): void {
    const thread = recordV01(response.thread);
    if (
      !thread ||
      thread.ephemeral !== true ||
      thread.path !== null ||
      !Array.isArray(response.instructionSources) ||
      response.instructionSources.length !== 0
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_thread_not_ephemeral",
      );
  }
  requireObservationV01(): CodexIsolatedAuthObservationV01 {
    if (!this.#observation)
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_observation_missing",
      );
    return this.#observation;
  }
  cleanupV01(): void {
    if (this.#cleaned) return;
    assertCodexBrokerRollbackCleanupAvailableV01(this);
    this.#cleaned = true;
    let prior: Error | null = null;
    try {
      this.assertStateV01(false);
    } catch (error) {
      prior = error as Error;
    }
    assertIdentityV01(this.#state.root);
    rmSync(this.#state.root.path, { recursive: true, force: false });
    if (existsSync(this.#state.root.path))
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_cleanup_incomplete",
      );
    if (prior) throw prior;
  }
  private assertStateV01(beforeSpawn: boolean): void {
    for (const identity of Object.values(this.#state))
      assertIdentityV01(identity);
    if (existsSync(path.join(this.#state.codexHome.path, "auth.json")))
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_file_persistence_refused",
      );
    if (
      beforeSpawn &&
      [
        this.#state.home,
        this.#state.codexHome,
        this.#state.sqliteHome,
        this.#state.tmp,
      ].some((item) => readdirSync(item.path).length !== 0)
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_shared_state_material_refused",
      );
  }
}

Object.freeze(CodexIsolatedAuthenticatedExecutionOwnerV01.prototype);

export function assertSourceOwnedCodexIsolatedExecutionOwnerV01(
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01,
): void {
  if (
    !SOURCE_OWNED_EXECUTION_OWNERS_V01.has(owner) ||
    Object.getPrototypeOf(owner) !==
      CodexIsolatedAuthenticatedExecutionOwnerV01.prototype ||
    owner.constructor !== CodexIsolatedAuthenticatedExecutionOwnerV01
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_owner_source_mismatch",
    );
}

export function assertValidCodexIsolatedAuthProjectionV01(
  input: CodexIsolatedAuthProjectionV01,
  attestation?: CodexIsolatedAuthCredentialAttestationV01,
  seal?: CodexIsolatedAuthProjectionSealV01,
): void {
  assertExactKeysV01(
    input as unknown as Record<string, unknown>,
    [
      "projection_version",
      "projection_id",
      "projection_mode",
      "provisioning_binding_ref",
      "semantic_profile_version",
      "semantic_profile_fingerprint",
      "auth_attestation_ref",
      "auth_attestation_fingerprint",
      "projection_seal_ref",
      "projection_seal_fingerprint",
      "provider_ref",
      "auth_mode",
      "auth_handle_ref",
      "broker_version",
      "broker_backend_ref",
      "broker_executable_ref",
      "broker_executable_fingerprint",
      "broker_locator_fingerprint",
      "auth_source_generation_fingerprint",
      "account_identity_fingerprint",
      "source_auth_mode",
      "agent_identity_storage_kind",
      "managed_chatgpt_binding_verified",
      "agent_identity_task_registration_state",
      "codex_executable_ref",
      "codex_executable_fingerprint",
      "executable_identity_class",
      "compatible_codex_cli_version",
      "state_policy",
      "config_policy",
      "app_server_launch_shape_fingerprint",
      "launch_injection_mechanism",
      "sensitive_material_lifetime",
      "refresh_update_policy",
      "concurrency_lease_policy",
      "cleanup_policy",
      "allowed_child_environment_key_fingerprint",
      "forbidden_persistence_surface_fingerprint",
      "auth_bootstrap_network_class",
      "task_tool_network_authority",
      "issued_at",
      "expires_at",
      "authority",
      "integrity",
    ],
    "codex_isolated_auth_projection_shape_invalid",
  );
  for (const value of [
    input.integrity.fingerprint,
    input.semantic_profile_fingerprint,
    input.auth_attestation_fingerprint,
    input.projection_seal_fingerprint,
    input.auth_source_generation_fingerprint,
    input.account_identity_fingerprint,
    input.codex_executable_fingerprint,
    input.broker_executable_fingerprint,
    input.broker_locator_fingerprint,
    input.config_policy.policy_fingerprint,
    input.app_server_launch_shape_fingerprint,
  ])
    requiredSha256V01(value);
  if (
    input.projection_version !== CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01 ||
    input.projection_mode !== CODEX_ISOLATED_AUTH_ROUTE_V01 ||
    input.semantic_profile_version !==
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version ||
    input.semantic_profile_fingerprint !==
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint ||
    input.compatible_codex_cli_version !==
      CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 ||
    exactExecutableIdentityClassV01(
      input.executable_identity_class,
      input.codex_executable_fingerprint,
    ) !== input.executable_identity_class ||
    input.provider_ref.external_id !== "openai" ||
    input.auth_mode !== "agent_identity" ||
    !["agentIdentity", "chatgpt"].includes(input.source_auth_mode) ||
    !["jwt", "record"].includes(input.agent_identity_storage_kind) ||
    input.managed_chatgpt_binding_verified !==
      (input.source_auth_mode === "chatgpt") ||
    input.agent_identity_task_registration_state !== "present" ||
    input.launch_injection_mechanism !==
      "broker_internal_attempt_private_auth_snapshot" ||
    input.sensitive_material_lifetime !==
      "broker_internal_lookup_to_authenticated_load_only" ||
    input.refresh_update_policy !==
      "source_codex_auth_read_only_attempt_snapshot_discarded" ||
    input.cleanup_policy !==
      "remove_auth_snapshot_before_observation_remove_attempt_root_after_settlement" ||
    input.task_tool_network_authority !== "none" ||
    Object.values(input.authority).some(Boolean)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_version_invalid",
    );
  assertIntegrityV01(input, "codex_isolated_auth_integrity_mismatch");
  if (
    attestation &&
    (attestation.attestation_version !==
      CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01 ||
      attestation.integrity.fingerprint !==
        input.auth_attestation_fingerprint ||
      attestation.auth_generation_fingerprint !==
        input.auth_source_generation_fingerprint ||
      attestation.semantic_profile_version !==
        input.semantic_profile_version ||
      attestation.semantic_profile_fingerprint !==
        input.semantic_profile_fingerprint ||
      attestation.account_identity_fingerprint !==
        input.account_identity_fingerprint ||
      attestation.source_auth_mode !== input.source_auth_mode ||
      attestation.agent_identity_storage_kind !==
        input.agent_identity_storage_kind ||
      attestation.managed_chatgpt_binding_verified !==
        input.managed_chatgpt_binding_verified ||
      attestation.agent_identity_task_registration_state !==
        input.agent_identity_task_registration_state ||
      attestation.issued_at !== input.issued_at ||
      attestation.expires_at !== input.expires_at)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_attestation_binding_mismatch",
    );
  if (attestation) {
    assertExactKeysV01(
      attestation as unknown as Record<string, unknown>,
      [
        "attestation_version",
        "attestation_id",
        "provisioning_binding_ref",
        "semantic_profile_version",
        "semantic_profile_fingerprint",
        "auth_handle_ref",
        "broker_locator_fingerprint",
        "auth_generation_fingerprint",
        "auth_storage_contract_version",
        "source_auth_mode",
        "agent_identity_storage_kind",
        "managed_chatgpt_binding_verified",
        "agent_identity_task_registration_state",
        "account_identity_fingerprint",
        "account_read_email_fingerprint",
        "agent_identity_runtime_fingerprint",
        "provider_environment_fingerprint",
        "plan_projection_fingerprint",
        "fedramp_projection_fingerprint",
        "issuer_projection_fingerprint",
        "audience_projection_fingerprint",
        "validity_projection_fingerprint",
        "source_not_before_epoch_seconds",
        "source_expires_at_epoch_seconds",
        "source_expiry_safety_margin_seconds",
        "claims_authentication_status",
        "issued_at",
        "expires_at",
        "integrity",
      ],
      "codex_isolated_auth_attestation_shape_invalid",
    );
    for (const value of [
      attestation.integrity.fingerprint,
      attestation.semantic_profile_fingerprint,
      attestation.broker_locator_fingerprint,
      attestation.auth_generation_fingerprint,
      attestation.account_identity_fingerprint,
      attestation.agent_identity_runtime_fingerprint,
      attestation.provider_environment_fingerprint,
      attestation.plan_projection_fingerprint,
      attestation.fedramp_projection_fingerprint,
    ])
      requiredSha256V01(value);
    for (const value of [
      attestation.issuer_projection_fingerprint,
      attestation.audience_projection_fingerprint,
      attestation.validity_projection_fingerprint,
    ])
      if (value !== null) requiredSha256V01(value);
    if (attestation.account_read_email_fingerprint !== null)
      requiredSha256V01(attestation.account_read_email_fingerprint);
    const jwtValidityExact =
      attestation.agent_identity_storage_kind === "jwt" &&
      Number.isSafeInteger(attestation.source_not_before_epoch_seconds) &&
      Number.isSafeInteger(attestation.source_expires_at_epoch_seconds) &&
      (attestation.source_expires_at_epoch_seconds as number) >
        (attestation.source_not_before_epoch_seconds as number) &&
      attestation.source_expiry_safety_margin_seconds === 60 &&
      attestation.issuer_projection_fingerprint !== null &&
      attestation.audience_projection_fingerprint !== null &&
      attestation.validity_projection_fingerprint !== null &&
      Date.parse(attestation.expires_at) <=
        ((attestation.source_expires_at_epoch_seconds as number) - 60) * 1000;
    const recordValidityExact =
      attestation.agent_identity_storage_kind === "record" &&
      attestation.source_not_before_epoch_seconds === null &&
      attestation.source_expires_at_epoch_seconds === null &&
      attestation.source_expiry_safety_margin_seconds === null &&
      attestation.issuer_projection_fingerprint === null &&
      attestation.audience_projection_fingerprint === null &&
      attestation.validity_projection_fingerprint === null;
    if (
      attestation.auth_storage_contract_version !==
        CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01 ||
      !["agentIdentity", "chatgpt"].includes(attestation.source_auth_mode) ||
      attestation.managed_chatgpt_binding_verified !==
        (attestation.source_auth_mode === "chatgpt") ||
      attestation.agent_identity_task_registration_state !== "present" ||
      attestation.claims_authentication_status !==
        "stored_agent_identity_unverified_before_codex_auth" ||
      (!jwtValidityExact && !recordValidityExact)
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_attestation_validity_invalid",
      );
    assertIntegrityV01(
      attestation,
      "codex_isolated_auth_attestation_integrity_mismatch",
    );
  }
  if (
    seal &&
    (seal.seal_version !== CODEX_ISOLATED_AUTH_PROJECTION_SEAL_VERSION_V01 ||
      seal.integrity.fingerprint !== input.projection_seal_fingerprint ||
      seal.auth_attestation_fingerprint !==
        input.auth_attestation_fingerprint ||
      seal.semantic_profile_version !== input.semantic_profile_version ||
      seal.semantic_profile_fingerprint !== input.semantic_profile_fingerprint ||
      seal.app_server_launch_shape_fingerprint !==
        input.app_server_launch_shape_fingerprint ||
      seal.executable_identity_class !==
        input.executable_identity_class ||
      seal.issued_at !== input.issued_at ||
      seal.expires_at !== input.expires_at)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_seal_binding_mismatch",
    );
  if (seal) {
    assertExactKeysV01(
      seal as unknown as Record<string, unknown>,
      [
        "seal_version",
        "seal_id",
        "provisioning_binding_ref",
        "semantic_profile_version",
        "semantic_profile_fingerprint",
        "auth_attestation_ref",
        "auth_attestation_fingerprint",
        "broker_binding_fingerprint",
        "codex_executable_fingerprint",
        "executable_identity_class",
        "config_policy_fingerprint",
        "state_policy_fingerprint",
        "app_server_launch_shape_fingerprint",
        "issued_at",
        "expires_at",
        "integrity",
      ],
      "codex_isolated_auth_seal_shape_invalid",
    );
    assertIntegrityV01(seal, "codex_isolated_auth_seal_integrity_mismatch");
  }
  assertSafePublicV01(input);
  if (attestation) assertSafePublicV01(attestation);
  if (seal) assertSafePublicV01(seal);
}

export function assertValidCodexIsolatedAuthObservationV01(
  input: CodexIsolatedAuthObservationV01,
  projection: CodexIsolatedAuthProjectionV01,
): void {
  assertExactKeysV01(
    input as unknown as Record<string, unknown>,
    [
      "observation_version",
      "projection_id",
      "projection_fingerprint",
      "semantic_profile_version",
      "semantic_profile_fingerprint",
      "auth_attestation_fingerprint",
      "auth_source_generation_fingerprint",
      "claims_authentication_status",
      "state_root_fingerprint",
      "home_identity_fingerprint",
      "codex_home_identity_fingerprint",
      "codex_sqlite_home_identity_fingerprint",
      "tmp_identity_fingerprint",
      "codex_executable_fingerprint",
      "executable_identity_class",
      "codex_cli_version",
      "auth_mode",
      "account_identity_fingerprint",
      "account_read_projection_fingerprint",
      "observed_security_policy_fingerprint",
      "provider_route_fingerprint",
      "config_layers_fingerprint",
      "codex_sqlite_home_reobserved",
      "mcp_server_count",
      "unexpected_tool_policy_observed",
      "ephemeral_thread_required",
      "shared_state_observed",
      "attempt_auth_material_persisted",
      "auth_material_exposed_outside_app_server_launch_boundary",
      "repository_command_auth_material_inherited",
      "task_tool_network_authority",
      "observed_at",
      "integrity",
    ],
    "codex_isolated_auth_observation_shape_invalid",
  );
  for (const value of [
    input.integrity.fingerprint,
    input.projection_fingerprint,
    input.semantic_profile_fingerprint,
    input.auth_attestation_fingerprint,
    input.auth_source_generation_fingerprint,
    input.state_root_fingerprint,
    input.home_identity_fingerprint,
    input.codex_home_identity_fingerprint,
    input.codex_sqlite_home_identity_fingerprint,
    input.tmp_identity_fingerprint,
    input.account_identity_fingerprint,
    input.account_read_projection_fingerprint,
    input.observed_security_policy_fingerprint,
    input.provider_route_fingerprint,
    input.config_layers_fingerprint,
  ])
    requiredSha256V01(value);
  if (
    input.observation_version !== CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01 ||
    input.projection_fingerprint !== projection.integrity.fingerprint ||
    input.semantic_profile_version !== projection.semantic_profile_version ||
    input.semantic_profile_fingerprint !==
      projection.semantic_profile_fingerprint ||
    input.codex_cli_version !== CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 ||
    input.executable_identity_class !==
      projection.executable_identity_class ||
    input.auth_attestation_fingerprint !==
      projection.auth_attestation_fingerprint ||
    input.auth_source_generation_fingerprint !==
      projection.auth_source_generation_fingerprint ||
    input.account_identity_fingerprint !==
      projection.account_identity_fingerprint ||
    input.observed_security_policy_fingerprint !==
      projection.config_policy.policy_fingerprint ||
    input.provider_route_fingerprint !==
      projection.config_policy.provider_route_fingerprint ||
    input.claims_authentication_status !==
      "verified_by_codex_agent_identity_auth" ||
    input.mcp_server_count !== 0 ||
    input.unexpected_tool_policy_observed ||
    input.shared_state_observed ||
    input.attempt_auth_material_persisted ||
    input.auth_material_exposed_outside_app_server_launch_boundary ||
    input.repository_command_auth_material_inherited ||
    input.task_tool_network_authority !== "none"
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_observation_binding_invalid",
    );
  assertIntegrityV01(
    input,
    "codex_isolated_auth_observation_integrity_mismatch",
  );
  assertSafePublicV01(input);
}

export function codexIsolatedAuthConfigOverrideArgsV01(): readonly string[] {
  return CONFIG_OVERRIDE_ARGS_V01;
}
export function codexIsolatedAuthExpectedRuntimeOverridePathsV01(): readonly string[] {
  return [...EXPECTED_RUNTIME_OVERRIDE_PATHS_V01];
}
export function codexIsolatedAuthExpectedRuntimeOriginPathsV01(): readonly string[] {
  return [...EXPECTED_RUNTIME_ORIGIN_PATHS_V01];
}
export function observeCodexIsolatedAuthCredentialFreeSemanticProfileV01(input: {
  initialized: Record<string, unknown>;
  config: Record<string, unknown>;
  codex_sqlite_home: string;
  expected_client_name: "augnes" | "augnes-semantic-preflight";
}): {
  semantic_profile_version: typeof CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_VERSION_V01;
  semantic_profile_fingerprint: string;
  observed_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  observed_security_policy_fingerprint: string;
  provider_route_fingerprint: string;
  config_layers_fingerprint: string;
} {
  const cliVersion = observeCodexAppServerUserAgentV01({
    raw_user_agent: input.initialized.userAgent,
    expected_client_name: input.expected_client_name,
    expected_client_version: CODEX_APP_SERVER_CLIENT_VERSION_V01,
    expected_codex_cli_version:
      CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  }).codex_cli_version;
  exactSupportedCliVersionV01(cliVersion);
  const observedPolicy = observedSecurityPolicyV01(input.config);
  const expected = expectedConfigPolicyV01();
  if (
    observedPolicy.fingerprint !== expected.policy_fingerprint ||
    observedPolicy.providerRouteFingerprint !== expected.provider_route_fingerprint
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_semantic_profile_mismatch",
    );
  return {
    semantic_profile_version:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    observed_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    observed_security_policy_fingerprint: observedPolicy.fingerprint,
    provider_route_fingerprint: observedPolicy.providerRouteFingerprint,
    config_layers_fingerprint: observedPolicy.layersFingerprint,
  };
}
export function createCodexIsolatedAuthTestRefV01(input: {
  ref_type: string;
  external_id?: string;
  observed_at: string;
}): ExternalRefV01 {
  return createRefV01(
    input.ref_type,
    input.external_id ?? `${input.ref_type}:${randomUUID()}`,
    input.observed_at,
  );
}

function expectedConfigPolicyV01(): CodexIsolatedAuthConfigPolicyV01 {
  return {
    ...CONFIG_POLICY_BASE_V01,
    policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        ...CONFIG_POLICY_BASE_V01,
        config_override_args: CONFIG_OVERRIDE_ARGS_V01,
      }),
    ),
  };
}
function parseRuntimeConfigOverrideArgsV01(
  args: readonly string[],
): RuntimeOverrideEntryV01[] {
  if (
    args[0] !== "--strict-config" ||
    args.length < 3 ||
    (args.length - 1) % 2 !== 0
  )
    throw new Error("codex_isolated_auth_config_override_shape_invalid");
  const entries: RuntimeOverrideEntryV01[] = [];
  const observedPaths = new Set<string>();
  for (let index = 1; index < args.length; index += 2) {
    if (args[index] !== "-c")
      throw new Error("codex_isolated_auth_config_override_shape_invalid");
    const expression = args[index + 1];
    if (typeof expression !== "string")
      throw new Error("codex_isolated_auth_config_override_shape_invalid");
    const separator = expression.indexOf("=");
    const overridePath = expression.slice(0, separator);
    const rawValue = expression.slice(separator + 1);
    if (
      separator <= 0 ||
      !/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/u.test(overridePath) ||
      observedPaths.has(overridePath)
    )
      throw new Error("codex_isolated_auth_config_override_shape_invalid");
    observedPaths.add(overridePath);
    entries.push({
      path: overridePath,
      value: boundedRuntimeOverrideValueV01(rawValue),
    });
  }
  return entries;
}
function boundedRuntimeOverrideValueV01(
  value: string,
): BoundedRuntimeOverrideValueV01 {
  if (value === "false") return false;
  if (value === "true") return true;
  if (/^(?:0|[1-9][0-9]*)$/u.test(value)) return Number(value);
  if (value === "{}") return {};
  if (value === "[]") return [];
  const stringMatch = /^"([a-z][a-z0-9_-]*)"$/u.exec(value);
  if (stringMatch) return stringMatch[1]!;
  throw new Error("codex_isolated_auth_config_override_value_invalid");
}
function runtimeOverrideProjectionV01(
  entries: readonly RuntimeOverrideEntryV01[],
): Record<string, unknown> {
  const projection: Record<string, unknown> = {};
  for (const entry of entries) {
    const segments = entry.path.split(".");
    let target = projection;
    for (const [index, segment] of segments.entries()) {
      if (["__proto__", "prototype", "constructor"].includes(segment))
        throw new Error("codex_isolated_auth_config_override_path_invalid");
      if (index === segments.length - 1) {
        if (Object.hasOwn(target, segment))
          throw new Error("codex_isolated_auth_config_override_path_invalid");
        target[segment] = structuredClone(entry.value);
        continue;
      }
      const existing = target[segment];
      if (existing === undefined) {
        const nested: Record<string, unknown> = {};
        target[segment] = nested;
        target = nested;
      } else {
        const nested = recordV01(existing);
        if (!nested)
          throw new Error("codex_isolated_auth_config_override_path_invalid");
        target = nested;
      }
    }
  }
  return projection;
}
function runtimeOverrideOriginPathsV01(
  entries: readonly RuntimeOverrideEntryV01[],
): string[] {
  const paths = entries.flatMap((entry) => {
    if (
      Array.isArray(entry.value) ||
      (typeof entry.value === "object" && entry.value !== null)
    )
      return [];
    if (entry.path === "features.network_proxy")
      return [entry.path, `${entry.path}.enabled`];
    return [entry.path];
  });
  return [...new Set(paths)].sort();
}
type ObservedConfigLayerSourceV01 = {
  type: string;
  precedence: number;
  packagedDefaults: boolean;
  sessionFlags: boolean;
};
function observeConfigReadProvenanceV01(value: Record<string, unknown>): {
  fingerprint: string;
} {
  const layers = Array.isArray(value.layers) ? value.layers : null;
  const origins = recordV01(value.origins);
  if (
    Object.hasOwn(value, "requirements") ||
    !layers ||
    layers.length === 0 ||
    layers.length > 64 ||
    !origins ||
    Object.keys(origins).length > 128
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_config_policy_mismatch",
    );
  let previousPrecedence = Number.POSITIVE_INFINITY;
  let sessionFlagsLayerCount = 0;
  let sessionFlagsVersion: string | null = null;
  let activeNonSessionLayerCount = 0;
  let packagedDefaultSurfaceObserved = false;
  for (const rawLayer of layers) {
    const layer = recordV01(rawLayer);
    const layerName = recordV01(layer?.name);
    const layerConfig = recordV01(layer?.config);
    const layerVersion = layer?.version;
    const disabledReasonPresent = Object.hasOwn(layer ?? {}, "disabledReason");
    const disabledReason = disabledReasonPresent
      ? layer?.disabledReason
      : undefined;
    if (
      !layer ||
      !layerName ||
      !layerConfig ||
      !exactObjectKeysV01(
        layer,
        disabledReasonPresent
          ? ["config", "disabledReason", "name", "version"]
          : ["config", "name", "version"],
      ) ||
      typeof layerVersion !== "string" ||
      !/^sha256:[a-f0-9]{64}$/u.test(layerVersion) ||
      layerVersion !==
        createProtocolSha256V01(
          canonicalizeProtocolValueV01(layerConfig),
        ) ||
      (disabledReasonPresent &&
        (typeof disabledReason !== "string" || disabledReason.length === 0))
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_config_policy_mismatch",
      );
    const source = observedConfigLayerSourceV01(layerName);
    if (source.precedence > previousPrecedence)
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_config_policy_mismatch",
      );
    previousPrecedence = source.precedence;
    if (source.packagedDefaults) packagedDefaultSurfaceObserved = true;
    if (source.sessionFlags) {
      sessionFlagsLayerCount += 1;
      if (
        disabledReasonPresent ||
        canonicalizeProtocolValueV01(layerConfig) !==
          canonicalizeProtocolValueV01(
            EXPECTED_RUNTIME_OVERRIDE_PROJECTION_V01,
          ) ||
        layerVersion !== EXPECTED_SESSION_FLAGS_LAYER_VERSION_V01
      )
        throw new CodexIsolatedAuthProjectionErrorV01(
          "codex_isolated_auth_config_policy_mismatch",
        );
      sessionFlagsVersion = layerVersion;
    } else if (!disabledReasonPresent && hasActiveConfigLeafV01(layerConfig)) {
      activeNonSessionLayerCount += 1;
    }
  }
  const observedOriginPaths = Object.keys(origins).sort();
  if (
    sessionFlagsLayerCount !== 1 ||
    sessionFlagsVersion === null ||
    activeNonSessionLayerCount !== 0 ||
    packagedDefaultSurfaceObserved ||
    canonicalizeProtocolValueV01(observedOriginPaths) !==
      canonicalizeProtocolValueV01(EXPECTED_RUNTIME_ORIGIN_PATHS_V01)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_config_policy_mismatch",
    );
  for (const expectedPath of EXPECTED_RUNTIME_ORIGIN_PATHS_V01) {
    const metadata = recordV01(origins[expectedPath]);
    const name = recordV01(metadata?.name);
    if (
      !metadata ||
      !name ||
      !exactObjectKeysV01(metadata, ["name", "version"]) ||
      typeof metadata.version !== "string" ||
      metadata.version !== sessionFlagsVersion ||
      !observedConfigLayerSourceV01(name).sessionFlags
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_config_policy_mismatch",
      );
  }
  const normalized = {
    config_provenance_contract_version:
      CONFIG_PROVENANCE_CONTRACT_VERSION_V01,
    session_flags_layer_count: sessionFlagsLayerCount,
    active_non_session_layer_count: activeNonSessionLayerCount,
    expected_runtime_override_count:
      EXPECTED_RUNTIME_OVERRIDE_PATHS_V01.length,
    session_flags_runtime_overrides_exact: true,
    expected_runtime_origin_count: EXPECTED_RUNTIME_ORIGIN_PATHS_V01.length,
    expected_runtime_origins_all_session_flags: true,
    unexpected_active_origin_count: 0,
    packaged_default_surface_observed: packagedDefaultSurfaceObserved,
    requirements_enumerated: false,
    critical_requirement_shadow_observed: false,
  } as const;
  return {
    fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(normalized),
    ),
  };
}
function observedConfigLayerSourceV01(
  source: Record<string, unknown>,
): ObservedConfigLayerSourceV01 {
  const type = source.type;
  if (typeof type !== "string")
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_config_policy_mismatch",
    );
  const exact = (keys: readonly string[]) => exactObjectKeysV01(source, keys);
  const absolute = (key: string) =>
    typeof source[key] === "string" &&
    path.isAbsolute(source[key] as string);
  const text = (key: string) =>
    typeof source[key] === "string" && (source[key] as string).length > 0;
  switch (type) {
    case "packagedDefaults":
      if (!exact(["file", "type"]) || !absolute("file")) break;
      return { type, precedence: -10, packagedDefaults: true, sessionFlags: false };
    case "mdm":
      if (!exact(["domain", "key", "type"]) || !text("domain") || !text("key"))
        break;
      return { type, precedence: 0, packagedDefaults: false, sessionFlags: false };
    case "system":
      if (!exact(["file", "type"]) || !absolute("file")) break;
      return { type, precedence: 10, packagedDefaults: false, sessionFlags: false };
    case "enterpriseManaged":
      if (!exact(["id", "name", "type"]) || !text("id") || !text("name"))
        break;
      return { type, precedence: 15, packagedDefaults: false, sessionFlags: false };
    case "user":
      if (
        !exact(["file", "profile", "type"]) ||
        !absolute("file") ||
        !(
          source.profile === null ||
          (typeof source.profile === "string" && source.profile.length > 0)
        )
      )
        break;
      return {
        type,
        precedence: source.profile === null ? 20 : 21,
        packagedDefaults: false,
        sessionFlags: false,
      };
    case "project":
      if (!exact(["dotCodexFolder", "type"]) || !absolute("dotCodexFolder"))
        break;
      return { type, precedence: 25, packagedDefaults: false, sessionFlags: false };
    case "sessionFlags":
      if (!exact(["type"])) break;
      return { type, precedence: 30, packagedDefaults: false, sessionFlags: true };
    case "legacyManagedConfigTomlFromFile":
      if (!exact(["file", "type"]) || !absolute("file")) break;
      return { type, precedence: 40, packagedDefaults: false, sessionFlags: false };
    case "legacyManagedConfigTomlFromMdm":
      if (!exact(["type"])) break;
      return { type, precedence: 50, packagedDefaults: false, sessionFlags: false };
  }
  throw new CodexIsolatedAuthProjectionErrorV01(
    "codex_isolated_auth_config_policy_mismatch",
  );
}
function exactObjectKeysV01(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) ===
    canonicalizeProtocolValueV01([...expected].sort())
  );
}
function hasActiveConfigLeafV01(value: unknown): boolean {
  if (Array.isArray(value))
    return value.some((entry) => hasActiveConfigLeafV01(entry));
  const record = recordV01(value);
  if (record)
    return Object.values(record).some((entry) => hasActiveConfigLeafV01(entry));
  return value !== null && value !== undefined;
}
function observedSecurityPolicyV01(
  value: Record<string, unknown>,
): {
  fingerprint: string;
  providerRouteFingerprint: string;
  layersFingerprint: string;
} {
  const config = recordV01(value.config);
  const features = recordV01(config?.features);
  const shell = recordV01(config?.shell_environment_policy);
  const orchestrator = recordV01(config?.orchestrator);
  const providerMap = recordV01(config?.model_providers);
  const appsProjectionExact = inactiveAppsProjectionV01(config?.apps);
  const provenance = observeConfigReadProvenanceV01(value);
  if (
    !config ||
    !features ||
    !shell ||
    !orchestrator ||
    (providerMap !== null && Object.keys(providerMap).length !== 0) ||
    config.forced_login_method !== "chatgpt" ||
    config.cli_auth_credentials_store !== "file" ||
    config.model_provider !== "openai" ||
    config.web_search !== "disabled" ||
    config.project_doc_max_bytes !== 0 ||
    config.allow_login_shell !== false ||
    config.check_for_update_on_startup !== false ||
    config.sqlite_home !== null ||
    !Array.isArray(config.project_doc_fallback_filenames) ||
    config.project_doc_fallback_filenames.length !== 0 ||
    shell.inherit !== "core" ||
    shell.ignore_default_excludes !== false ||
    !emptyRecordV01(config.mcp_servers) ||
    !emptyRecordV01(config.plugins) ||
    !emptyRecordV01(config.skills) ||
    !appsProjectionExact ||
    recordV01(orchestrator.skills)?.enabled !== false ||
    recordV01(orchestrator.mcp)?.enabled !== false ||
    Object.entries(features).some(
      ([key, enabled]) =>
        key === "use_agent_identity"
          ? enabled !== true
          : !DISABLED_FEATURES_V01.has(key) || enabled !== false,
    ) ||
    features.use_agent_identity !== true ||
    [...DISABLED_FEATURES_V01].some((key) => features[key] !== false)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_config_policy_mismatch",
    );
  const providerRouteMaterial = {
    ...PROVIDER_ROUTE_MATERIAL_V01,
    provider: config.model_provider,
  };
  const actual = {
    policy_version: CONFIG_POLICY_BASE_V01.policy_version,
    forced_login_method: config.forced_login_method,
    auth_store_mode: config.cli_auth_credentials_store,
    use_agent_identity_feature_enabled: features.use_agent_identity,
    model_provider: config.model_provider,
    provider_route_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(providerRouteMaterial),
    ),
    provider_projection_version:
      PROVIDER_ROUTE_MATERIAL_V01.provider_projection_version,
    raw_provider_base_url: null,
    effective_provider_base_url_fingerprint:
      PROVIDER_ROUTE_MATERIAL_V01.effective_provider_base_url_fingerprint,
    wire_api: PROVIDER_ROUTE_MATERIAL_V01.wire_api,
    requires_openai_auth: PROVIDER_ROUTE_MATERIAL_V01.requires_openai_auth,
    supports_websockets: PROVIDER_ROUTE_MATERIAL_V01.supports_websockets,
    supports_standalone_web_search:
      PROVIDER_ROUTE_MATERIAL_V01.supports_standalone_web_search,
    builtin_version_header_owned: true,
    builtin_organization_env_header_owned: true,
    builtin_project_env_header_owned: true,
    isolated_launch_provider_header_env_absent: true,
    request_max_retries: PROVIDER_ROUTE_MATERIAL_V01.request_max_retries,
    stream_max_retries: PROVIDER_ROUTE_MATERIAL_V01.stream_max_retries,
    stream_idle_timeout_ms:
      PROVIDER_ROUTE_MATERIAL_V01.stream_idle_timeout_ms,
    websocket_connect_timeout_ms:
      PROVIDER_ROUTE_MATERIAL_V01.websocket_connect_timeout_ms,
    env_key_present: false,
    experimental_bearer_token_present: false,
    auth_command_present: false,
    aws_config_present: false,
    query_params_present: false,
    user_http_headers_present: false,
    user_env_http_headers_present: false,
    config_layer_policy:
      "session_flags_exact_no_active_non_session_layers" as const,
    config_requirements_policy:
      "not_enumerated_critical_override_origins_intact" as const,
    web_search: config.web_search,
    mcp_server_count: Object.keys(config.mcp_servers as object).length,
    plugin_count: Object.keys(config.plugins as object).length,
    app_count: 0,
    skill_source_count: Object.keys(config.skills as object).length,
    project_instruction_bytes: config.project_doc_max_bytes,
    login_shell_allowed: config.allow_login_shell,
    shell_environment_inherit: shell.inherit,
    shell_default_sensitive_name_excludes:
      shell.ignore_default_excludes === false,
    repository_command_auth_material_inheritance: false,
    sqlite_config_projection:
      config.sqlite_home === null ? ("absent" as const) : "mismatch",
    sqlite_runtime_binding:
      "private_codex_sqlite_home_environment" as const,
    sqlite_runtime_source: "CODEX_SQLITE_HOME" as const,
    sqlite_runtime_private_root_required: true,
    sqlite_runtime_shared_fallback_forbidden: true,
    apps_config_projection: appsProjectionExact
      ? ("source_default_only" as const)
      : "mismatch",
    apps_capability:
      features.apps === false ? ("disabled_by_feature" as const) : "mismatch",
    thread_instruction_sources:
      Array.isArray(config.project_doc_fallback_filenames) &&
      config.project_doc_fallback_filenames.length === 0
        ? "empty"
        : "unexpected",
    orchestrator_skills_enabled: recordV01(orchestrator.skills)?.enabled,
    orchestrator_mcp_enabled: recordV01(orchestrator.mcp)?.enabled,
    remote_tool_features_enabled: [...DISABLED_FEATURES_V01].filter(
      (key) => features[key] === true,
    ).length,
    config_override_args: CONFIG_OVERRIDE_ARGS_V01,
  };
  return {
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(actual)),
    providerRouteFingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(providerRouteMaterial),
    ),
    layersFingerprint: provenance.fingerprint,
  };
}
function accountReadProjectionV01(value: Record<string, unknown>): {
  fingerprint: string;
  planFingerprint: string;
  emailFingerprint: string | null;
} {
  const account = recordV01(value.account);
  if (
    !account ||
    account.type !== "chatgpt" ||
    value.requiresOpenaiAuth !== true
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_account_shape_invalid",
    );
  const planType =
    typeof account.planType === "string" && account.planType.length > 0
      ? account.planType
      : null;
  const email =
    typeof account.email === "string" && account.email.length > 0
      ? account.email
      : null;
  return {
    fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        version: "codex_account_read_safe_projection.v0.1",
        account_type: "chatgpt",
        plan_type: planType,
        requires_openai_auth: true,
      }),
    ),
    planFingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        domain: "codex-agent-identity-plan-v01",
        value: planType,
      }),
    ),
    emailFingerprint:
      email === null
        ? null
        : createProtocolSha256V01(
            canonicalizeProtocolValueV01({
              domain: "codex-agent-identity-account-read-email-v01",
              value: email,
            }),
          ),
  };
}
function assertAuthStatusV01(value: Record<string, unknown>): void {
  if (
    value.authMethod !== "agentIdentity" ||
    value.authToken !== null ||
    value.requiresOpenaiAuth !== true
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_mode_mismatch",
    );
}
function launchShapeFingerprintV01(
  executableFingerprint: string,
  cliVersion: string,
): string {
  exactSupportedCliVersionV01(cliVersion);
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_isolated_app_server_launch_shape.v0.1",
      semantic_profile_version:
        CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.semantic_profile_version,
      semantic_profile_fingerprint:
        CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
      codex_executable_fingerprint: executableFingerprint,
      cli_version: cliVersion,
      config_override_args: CONFIG_OVERRIDE_ARGS_V01,
      terminal_args: ["app-server", "--stdio"],
    }),
  );
}
function createStateV01(parentInput: string): StateV01 {
  if (!path.isAbsolute(parentInput))
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_parent_invalid",
    );
  const parent = exactPrivateDirectoryV01(
    parentInput,
    "codex_isolated_auth_state_parent_invalid",
  );
  const root = mkdtempSync(path.join(parent.path, "codex-isolated-auth-"));
  chmodSync(root, 0o700);
  const values = {
    root: exactPrivateDirectoryV01(
      root,
      "codex_isolated_auth_state_substituted",
    ),
    home: directoryV01(root, "home"),
    codexHome: directoryV01(root, "codex-home"),
    sqliteHome: directoryV01(root, "sqlite-home"),
    tmp: directoryV01(root, "tmp"),
  };
  const shared = [
    process.env.HOME,
    process.env.CODEX_HOME,
    process.env.CODEX_SQLITE_HOME,
    process.env.TMPDIR,
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => {
      try {
        return realpathSync(v);
      } catch {
        return null;
      }
    });
  if (
    shared.some(
      (candidate) =>
        candidate &&
        Object.values(values).some(
          (owned) =>
            candidate === owned.path || withinV01(candidate, owned.path),
        ),
    )
  ) {
    rmSync(root, { recursive: true });
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_shared_state_refused",
    );
  }
  return values;
}

function exactRepositoryRootV01(value: string): string {
  try {
    if (!path.isAbsolute(value)) throw new Error();
    const exact = realpathSync(value);
    const stat = lstatSync(exact);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
    return exact;
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_repository_root_invalid",
    );
  }
}
function directoryV01(root: string, name: string): DirectoryIdentityV01 {
  const value = path.join(root, name);
  mkdirSync(value, { mode: 0o700 });
  return exactPrivateDirectoryV01(
    value,
    "codex_isolated_auth_state_substituted",
  );
}
function exactPrivateDirectoryV01(
  value: string,
  code: string,
): DirectoryIdentityV01 {
  try {
    const supplied = lstatSync(value, { bigint: true });
    const exact = realpathSync(value);
    const stat = lstatSync(exact, { bigint: true });
    if (
      supplied.isSymbolicLink() ||
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (stat.mode & BigInt(0o077)) !== BigInt(0)
    )
      throw new Error(code);
    return {
      path: exact,
      device: stat.dev,
      inode: stat.ino,
      fingerprint: directoryFingerprintV01(exact, stat.dev, stat.ino),
    };
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(code);
  }
}
function exactExecutableV01(
  value: string,
  fingerprint: string,
): ExecutableIdentityV01 {
  try {
    const exact = realpathSync(value);
    const stat = lstatSync(exact, { bigint: true });
    if (
      exact !== value ||
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      sha256FileV01(exact) !== fingerprint
    )
      throw new Error();
    return { path: exact, device: stat.dev, inode: stat.ino, fingerprint };
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_substituted",
    );
  }
}
function assertIdentityV01(identity: DirectoryIdentityV01): void {
  try {
    const stat = lstatSync(identity.path, { bigint: true });
    if (
      stat.isSymbolicLink() ||
      stat.dev !== identity.device ||
      stat.ino !== identity.inode ||
      (stat.isDirectory() && (stat.mode & BigInt(0o077)) !== BigInt(0)) ||
      (stat.isFile() && sha256FileV01(identity.path) !== identity.fingerprint)
    )
      throw new Error();
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_substituted",
    );
  }
}
function directoryFingerprintV01(
  value: string,
  device: bigint,
  inode: bigint,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      kind: path.basename(value),
      path: value,
      device: String(device),
      inode: String(inode),
    }),
  );
}
function boundedBaseEnvironmentV01(
  source: CodexIsolatedAuthLaunchInputV01["base_environment"],
): NodeJS.ProcessEnv {
  const output: NodeJS.ProcessEnv = {
    NODE_ENV: source.NODE_ENV ?? "production",
  };
  for (const key of [
    "PATH",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TZ",
    "TERM",
    "NO_COLOR",
  ] as const)
    if (source[key]) output[key] = source[key];
  return output;
}
function validateTestEnvironmentV01(
  source: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const keys = Object.keys(source);
  if (keys.length === 0) return {};
  if (
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1" ||
    source.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1" ||
    keys.some((key) => !TEST_ENV_KEYS_V01.has(key))
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_test_environment_refused",
    );
  return { ...source };
}
function validatePrefixArgsV01(values: string[]): string[] {
  if (
    (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1" &&
      values.length) ||
    values.length > 8 ||
    values.some(
      (value) =>
        !value ||
        /[\0\r\n]/u.test(value) ||
        containsCodexCredentialSecretShapeV01(value),
    )
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_prefix_args_invalid",
    );
  return [...values];
}
function validateProvisionInputV01(
  input: ProvisionCodexIsolatedAuthProjectionInputV01,
): void {
  exactSupportedCliVersionV01(input.compatible_codex_cli_version);
  exactExecutableIdentityClassV01(
    input.executable_identity_class,
    input.codex_executable_fingerprint,
  );
  for (const ref of [
    input.provisioning_binding_ref,
    input.provider_ref,
    input.broker_binding.auth_handle_ref,
    input.broker_binding.broker_backend_ref,
    input.broker_binding.broker_executable_ref,
    input.codex_executable_ref,
  ])
    validateRefV01(ref);
  if (
    input.provider_ref.ref_type !== "model_provider" ||
    input.provider_ref.external_id !== "openai" ||
    parseStrictIsoTimestampV01(input.issued_at) === null ||
    parseStrictIsoTimestampV01(input.expires_at) === null ||
    Date.parse(input.expires_at) <= Date.parse(input.issued_at)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_provisioning_input_invalid",
    );
  requiredSha256V01(input.codex_executable_fingerprint);
}
function validateRefV01(ref: ExternalRefV01): void {
  const errors: string[] = [];
  validateExternalRefStructureV01(ref, "$", {
    error: (code) => errors.push(code),
    warning() {},
  });
  if (errors.length)
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_external_ref_invalid",
    );
}
function createRefV01(
  refType: string,
  externalId: string,
  observedAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    provider: "codex",
    host: "local",
    observed_at: observedAt,
    trust_class: "direct_local_observation",
    compatibility_namespace: CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01,
  };
}
function assertProjectionTimeV01(
  projection: CodexIsolatedAuthProjectionV01,
): void {
  const now = Date.now();
  if (now < Date.parse(projection.issued_at))
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_not_yet_valid",
    );
  if (now >= Date.parse(projection.expires_at))
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_expired",
    );
}
function assertSafePublicV01(value: unknown): void {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code, issuePath) => issues.push(`${code}:${issuePath ?? "$"}`),
      warning() {},
    },
    {
      secret_material_message:
        "Isolated-auth public material must not contain sensitive values.",
      provider_specific_field_message: "Provider identity must remain typed.",
      allowed_canonical_identity_paths: new Set([
        "$.auth_generation_fingerprint",
        "$.auth_attestation_ref",
        "$.auth_attestation_fingerprint",
        "$.account_read_email_fingerprint",
        "$.claims_authentication_status",
        "$.auth_source_generation_fingerprint",
        "$.provider_environment_fingerprint",
        "$.provider_ref",
        "$.provider_route_fingerprint",
        "$.config_policy.provider_route_fingerprint",
        "$.codex_executable_ref",
        "$.codex_executable_fingerprint",
        "$.codex_cli_version",
        "$.codex_home_identity_fingerprint",
        "$.codex_sqlite_home_identity_fingerprint",
        "$.codex_sqlite_home_reobserved",
        "$.state_policy.codex_home_isolated",
        "$.state_policy.codex_sqlite_home_isolated",
        "$.config_policy.sqlite_runtime_binding",
        "$.config_policy.sqlite_runtime_source",
      ]),
      allowed_false_invariant_fields: new Set([
        "repository_execution_granted",
        "provider_call_granted",
        "task_network_granted",
        "github_write_granted",
        "semantic_write_granted",
        "policy_activation_granted",
        "publication_granted",
        "merge_granted",
        "login_shell_allowed",
        "repository_command_auth_material_inheritance",
        "caller_tmpdir_override_forbidden",
        "unexpected_tool_policy_observed",
        "shared_state_observed",
        "attempt_auth_material_persisted",
        "auth_material_exposed_outside_app_server_launch_boundary",
        "env_key_present",
        "experimental_bearer_token_present",
        "auth_command_present",
        "aws_config_present",
        "query_params_present",
        "user_http_headers_present",
        "user_env_http_headers_present",
      ]),
    },
  );
  walkStringsV01(value, (candidate) => {
    if (
      containsCodexCredentialSecretShapeV01(candidate) ||
      /^\/Users\//u.test(candidate) ||
      /^\/home\//u.test(candidate) ||
      /^[A-Za-z]:[\\/]/u.test(candidate) ||
      /^\\\\[^\\]+\\[^\\]+/u.test(candidate)
    )
      issues.push("private_material_forbidden");
  });
  if (issues.length)
    throw new CodexIsolatedAuthProjectionErrorV01(
      `codex_isolated_auth_public_material_forbidden:${[...new Set(issues)].join(",")}`,
    );
}
function walkStringsV01(value: unknown, visit: (value: string) => void): void {
  if (typeof value === "string") return visit(value);
  if (Array.isArray(value))
    return value.forEach((item) => walkStringsV01(item, visit));
  const record = recordV01(value);
  if (record)
    Object.values(record).forEach((item) => walkStringsV01(item, visit));
}
function deepFreezeV01<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entry of Object.values(value as Record<string, unknown>))
      deepFreezeV01(entry);
    Object.freeze(value);
  }
  return value;
}
function assertIntegrityV01(
  value: { integrity: { algorithm: string; fingerprint: string } },
  code: string,
): void {
  const { integrity, ...material } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.fingerprint !== integrityV01(material).fingerprint
  )
    throw new CodexIsolatedAuthProjectionErrorV01(code);
}
function integrityV01(value: unknown): {
  algorithm: "sha256";
  fingerprint: string;
} {
  return {
    algorithm: "sha256",
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)),
  };
}
function requiredSha256V01(value: string): string {
  if (!/^sha256:[a-f0-9]{64}$/u.test(value))
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_fingerprint_invalid",
    );
  return value;
}
function requiredIdV01(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(value))
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_id_invalid",
    );
  return value;
}
function requiredCliVersionV01(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/u.test(value))
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_cli_version_invalid",
    );
  return value;
}
function exactSupportedCliVersionV01(
  value: string,
): typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 {
  requiredCliVersionV01(value);
  if (value !== CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01)
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_cli_version_mismatch",
    );
  return CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
}
function exactExecutableIdentityClassV01(
  value: "production_pinned_codex" | "test_emulated_profile",
  fingerprint: string,
): "production_pinned_codex" | "test_emulated_profile" {
  requiredSha256V01(fingerprint);
  if (value === "production_pinned_codex") {
    if (
      fingerprint !==
      CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01
    )
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_production_executable_mismatch",
      );
    return value;
  }
  if (
    value !== "test_emulated_profile" ||
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1"
  )
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_identity_class_refused",
    );
  return value;
}
function requiredTextV01(value: unknown, code: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 4096 ||
    /[\0\r\n]/u.test(value)
  )
    throw new CodexIsolatedAuthProjectionErrorV01(code);
  return value;
}
function recordV01(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function assertExactKeysV01(
  value: Record<string, unknown>,
  keys: readonly string[],
  code: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(code);
  }
}
function emptyRecordV01(value: unknown): boolean {
  const record = recordV01(value);
  return Boolean(record && Object.keys(record).length === 0);
}
function inactiveAppsProjectionV01(value: unknown): boolean {
  const apps = recordV01(value);
  // Codex 0.150.1 converts an empty ConfigToml apps table into the API
  // AppsConfig shape with one nullable `_default` sentinel. No per-app key or
  // expanded default policy is part of the isolated profile.
  return Boolean(
    apps && exactObjectKeysV01(apps, ["_default"]) && apps._default === null,
  );
}
function withinV01(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return (
    relative.length > 0 &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}
function sha256FileV01(value: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(value)).digest("hex")}`;
}
