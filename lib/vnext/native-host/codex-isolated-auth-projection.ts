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
import { pathToFileURL } from "node:url";

import {
  containsCodexCredentialSecretShapeV01,
  type CodexCredentialBrokerV01,
} from "@/lib/vnext/native-host/codex-credential-broker";
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
  CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01,
  CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01,
  CODEX_ISOLATED_AUTH_ROUTE_V01,
  type CodexIsolatedAuthConfigPolicyV01,
  type CodexIsolatedAuthObservationV01,
  type CodexIsolatedAuthProjectionV01,
  type CodexIsolatedAuthStatePolicyV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const CONFIG_POLICY_MATERIAL_V01 = {
  policy_version: "codex_isolated_tool_policy.v0.1",
  forced_login_method: "chatgpt",
  auth_store_mode: "ephemeral",
  web_search: "disabled",
  mcp_server_count: 0,
  plugin_count: 0,
  app_count: 0,
  project_instruction_bytes: 0,
  login_shell_allowed: false,
  shell_environment_inherit: "core",
  shell_default_sensitive_name_excludes: true,
  repository_command_auth_material_inheritance: false,
  codex_sqlite_home_binding: "exact_attempt_state_home",
  thread_instruction_sources: "empty",
  orchestrator_skills_enabled: false,
  orchestrator_mcp_enabled: false,
  remote_tool_features_enabled: 0,
} as const;

const STATE_POLICY_V01: CodexIsolatedAuthStatePolicyV01 = {
  strategy_version: "codex_isolated_state_home.v0.1",
  per_attempt_private_root: true,
  home_isolated: true,
  codex_home_isolated: true,
  codex_sqlite_home_isolated: true,
  shared_state_fallback_forbidden: true,
  auth_file_copy_forbidden: true,
  auth_file_symlink_forbidden: true,
  ordinary_config_copy_forbidden: true,
  ordinary_history_copy_forbidden: true,
  ordinary_skill_copy_forbidden: true,
  ephemeral_thread_required: true,
  remove_after_settlement: true,
};

const ALLOWED_CHILD_ENVIRONMENT_KEYS_V01 = [
  "CODEX_ACCESS_TOKEN",
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

const FORBIDDEN_PERSISTENCE_SURFACES_V01 = [
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

const CONFIG_OVERRIDE_ARGS_V01 = [
  "--strict-config",
  "-c",
  'forced_login_method="chatgpt"',
  "-c",
  'cli_auth_credentials_store="ephemeral"',
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
] as const;

const TEST_ENVIRONMENT_KEYS_V01 = new Set([
  "AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE",
  "FAKE_CODEX_AUTH_BOUNDARY_PATH",
  "FAKE_CODEX_CLEANUP_MARKER_PATH",
  "FAKE_CODEX_NETWORK_COUNT_PATH",
  "FAKE_CODEX_SCENARIO",
  "FAKE_CODEX_TRACE_PATH",
]);

const PROJECTION_KEYS_V01 = new Set([
  "projection_version",
  "projection_id",
  "projection_mode",
  "provider_ref",
  "auth_mode",
  "auth_handle_ref",
  "broker_version",
  "broker_backend_ref",
  "broker_executable_ref",
  "broker_executable_fingerprint",
  "broker_locator_fingerprint",
  "auth_source_generation_fingerprint",
  "expected_account_projection_fingerprint",
  "codex_executable_ref",
  "codex_executable_fingerprint",
  "compatible_codex_cli_version",
  "state_policy",
  "config_policy",
  "launch_injection_mechanism",
  "launch_injection_key",
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
]);

const OBSERVATION_KEYS_V01 = new Set([
  "observation_version",
  "projection_id",
  "projection_fingerprint",
  "state_root_fingerprint",
  "home_identity_fingerprint",
  "codex_home_identity_fingerprint",
  "codex_sqlite_home_identity_fingerprint",
  "codex_executable_fingerprint",
  "codex_cli_version",
  "auth_mode",
  "account_projection_fingerprint",
  "config_policy_fingerprint",
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
]);

const AUTHORITY_KEYS_V01 = new Set([
  "repository_execution_granted",
  "provider_call_granted",
  "task_network_granted",
  "github_write_granted",
  "semantic_write_granted",
  "policy_activation_granted",
  "publication_granted",
  "merge_granted",
]);

export class CodexIsolatedAuthProjectionErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexIsolatedAuthProjectionErrorV01";
  }
}

export interface CreateCodexIsolatedAuthProjectionInputV01 {
  projection_id: string;
  provider_ref: ExternalRefV01;
  auth_handle_ref: ExternalRefV01;
  broker_backend_ref: ExternalRefV01;
  broker_executable_ref: ExternalRefV01;
  broker_executable_fingerprint: string;
  broker_locator_fingerprint: string;
  auth_source_generation_fingerprint: string;
  expected_account_projection_fingerprint: string;
  codex_executable_ref: ExternalRefV01;
  codex_executable_fingerprint: string;
  compatible_codex_cli_version: string;
  issued_at: string;
  expires_at: string;
}

export interface CodexIsolatedAuthLaunchInputV01 {
  projection: CodexIsolatedAuthProjectionV01;
  broker: CodexCredentialBrokerV01;
  state_parent: string;
  command: string;
  prefix_args?: string[];
  base_environment: NodeJS.ProcessEnv;
  test_environment?: Record<string, string | undefined>;
}

interface IsolatedStateV01 {
  root: string;
  home: string;
  codexHome: string;
  sqliteHome: string;
  rootDevice: bigint;
  rootInode: bigint;
  homeDevice: bigint;
  homeInode: bigint;
  codexHomeDevice: bigint;
  codexHomeInode: bigint;
  sqliteHomeDevice: bigint;
  sqliteHomeInode: bigint;
  rootFingerprint: string;
  homeFingerprint: string;
  codexHomeFingerprint: string;
  sqliteHomeFingerprint: string;
}

interface ExactExecutableIdentityV01 {
  path: string;
  device: bigint;
  inode: bigint;
  fingerprint: string;
}

export interface CodexIsolatedSpawnMaterialV01 {
  command: string;
  args: string[];
  cwd: string;
  environment: NodeJS.ProcessEnv;
  sensitive_environment_key: "CODEX_ACCESS_TOKEN";
}

export class CodexIsolatedAuthenticatedExecutionOwnerV01 {
  readonly projection: CodexIsolatedAuthProjectionV01;
  readonly state_root_fingerprint: string;
  readonly home_identity_fingerprint: string;
  readonly codex_home_identity_fingerprint: string;
  readonly codex_sqlite_home_identity_fingerprint: string;
  readonly #broker: CodexCredentialBrokerV01;
  readonly #state: IsolatedStateV01;
  readonly #command: ExactExecutableIdentityV01;
  readonly #prefixArgs: string[];
  readonly #baseEnvironment: NodeJS.ProcessEnv;
  readonly #testEnvironment: Record<string, string | undefined>;
  #spawned = false;
  #cleaned = false;
  #observation: CodexIsolatedAuthObservationV01 | null = null;

  constructor(input: CodexIsolatedAuthLaunchInputV01) {
    assertValidCodexIsolatedAuthProjectionV01(input.projection);
    if (
      input.broker.projection_fingerprint !==
      input.projection.integrity.fingerprint
    ) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_broker_projection_mismatch",
      );
    }
    this.projection = input.projection;
    this.#broker = input.broker;
    this.#command = exactExecutableV01(
      input.command,
      input.projection.codex_executable_fingerprint,
    );
    this.#prefixArgs = validatePrefixArgsV01(
      input.prefix_args ?? [],
      process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE === "1",
    );
    this.#baseEnvironment = boundedBaseEnvironmentV01(input.base_environment);
    this.#testEnvironment = validateTestEnvironmentV01(
      input.test_environment ?? {},
    );
    this.#state = createIsolatedStateV01(input.state_parent);
    this.state_root_fingerprint = this.#state.rootFingerprint;
    this.home_identity_fingerprint = this.#state.homeFingerprint;
    this.codex_home_identity_fingerprint = this.#state.codexHomeFingerprint;
    this.codex_sqlite_home_identity_fingerprint =
      this.#state.sqliteHomeFingerprint;
  }

  async withSpawnMaterialV01<T>(input: {
    repository_root: string;
    use: (material: CodexIsolatedSpawnMaterialV01) => Promise<T>;
  }): Promise<T> {
    if (this.#spawned || this.#cleaned) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_owner_single_use_refused",
      );
    }
    assertProjectionTimeWindowV01(this.projection);
    this.assertStateCleanV01(true);
    assertExactExecutableIdentityV01(this.#command);
    this.#spawned = true;
    return await this.#broker.withLaunchMaterialV01(async (material) => {
      // Credential lookup is asynchronous. Expiry must still be valid at the
      // immediate child-spawn handoff rather than only before lookup began.
      assertProjectionTimeWindowV01(this.projection);
      this.assertStateCleanV01(true);
      // Re-observe the exact executable after credential resolution and at the
      // immediate handoff to the synchronous child-spawn owner.
      assertExactExecutableIdentityV01(this.#command);
      const environment: NodeJS.ProcessEnv = {
        ...this.#baseEnvironment,
        ...this.#testEnvironment,
        HOME: this.#state.home,
        CODEX_HOME: this.#state.codexHome,
        CODEX_SQLITE_HOME: this.#state.sqliteHome,
        CODEX_ACCESS_TOKEN: material,
      };
      return await input.use({
        command: this.#command.path,
        args: [
          ...this.#prefixArgs,
          ...CONFIG_OVERRIDE_ARGS_V01,
          "app-server",
          "--stdio",
        ],
        cwd: input.repository_root,
        environment,
        sensitive_environment_key: "CODEX_ACCESS_TOKEN",
      });
    });
  }

  observeInitializedAccountV01(input: {
    initialized: Record<string, unknown>;
    auth_status: Record<string, unknown>;
    account: Record<string, unknown>;
    config: Record<string, unknown>;
    mcp_status: Record<string, unknown>;
    observed_at: string;
  }): CodexIsolatedAuthObservationV01 {
    this.assertStateCleanV01(false);
    const initializedCodexHome = requiredTextV01(
      input.initialized.codexHome,
      "codex_isolated_auth_initialize_home_missing",
    );
    if (realpathSync(initializedCodexHome) !== this.#state.codexHome) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_initialize_home_mismatch",
      );
    }
    const cliVersion = publicCliVersionV01(input.initialized.userAgent);
    if (cliVersion !== this.projection.compatible_codex_cli_version) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_cli_version_mismatch",
      );
    }
    assertExactAuthStatusV01(input.auth_status);
    const accountProjection = createCodexAccountProjectionFingerprintV01({
      auth_status: input.auth_status,
      account: input.account,
    });
    if (
      accountProjection !==
      this.projection.expected_account_projection_fingerprint
    ) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_account_projection_mismatch",
      );
    }
    const observedConfigPolicyFingerprint = assertExactConfigPolicyV01(
      input.config,
      this.projection.config_policy,
      this.#state.sqliteHome,
    );
    const mcpData = Array.isArray(input.mcp_status.data)
      ? input.mcp_status.data
      : null;
    if (!mcpData || mcpData.length !== 0 || input.mcp_status.nextCursor !== null) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_mcp_policy_mismatch",
      );
    }
    const material = {
      observation_version: CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01,
      projection_id: this.projection.projection_id,
      projection_fingerprint: this.projection.integrity.fingerprint,
      state_root_fingerprint: this.#state.rootFingerprint,
      home_identity_fingerprint: this.#state.homeFingerprint,
      codex_home_identity_fingerprint: this.#state.codexHomeFingerprint,
      codex_sqlite_home_identity_fingerprint: this.#state.sqliteHomeFingerprint,
      codex_executable_fingerprint:
        this.projection.codex_executable_fingerprint,
      codex_cli_version: cliVersion,
      auth_mode: "agent_identity",
      account_projection_fingerprint: accountProjection,
      config_policy_fingerprint: observedConfigPolicyFingerprint,
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
    assertValidCodexIsolatedAuthObservationV01(
      observation,
      this.projection,
    );
    this.#observation = observation;
    return observation;
  }

  assertFreshThreadResponseV01(response: Record<string, unknown>): void {
    const thread = isRecordV01(response.thread) ? response.thread : null;
    if (
      !thread ||
      thread.ephemeral !== true ||
      thread.path !== null ||
      !Array.isArray(response.instructionSources) ||
      response.instructionSources.length !== 0
    ) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_thread_not_ephemeral",
      );
    }
  }

  requireObservationV01(): CodexIsolatedAuthObservationV01 {
    if (!this.#observation) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_observation_missing",
      );
    }
    return this.#observation;
  }

  cleanupV01(): void {
    if (this.#cleaned) return;
    this.#cleaned = true;
    let materialError: CodexIsolatedAuthProjectionErrorV01 | null = null;
    try {
      this.assertStateCleanV01(false);
    } catch (error) {
      if (error instanceof CodexIsolatedAuthProjectionErrorV01) {
        materialError = error;
      } else {
        materialError = new CodexIsolatedAuthProjectionErrorV01(
          "codex_isolated_auth_state_substituted",
        );
      }
    }
    let current;
    try {
      current = lstatSync(this.#state.root, { bigint: true });
    } catch {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_cleanup_identity_mismatch",
      );
    }
    if (
      current.isSymbolicLink() ||
      current.dev !== this.#state.rootDevice ||
      current.ino !== this.#state.rootInode
    ) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_cleanup_identity_mismatch",
      );
    }
    try {
      rmSync(this.#state.root, { recursive: true, force: false });
    } catch {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_cleanup_incomplete",
      );
    }
    if (existsSync(this.#state.root)) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_cleanup_incomplete",
      );
    }
    if (materialError) throw materialError;
  }

  private assertStateCleanV01(beforeSpawn: boolean): void {
    for (const identity of [
      {
        directory: this.#state.root,
        device: this.#state.rootDevice,
        inode: this.#state.rootInode,
      },
      {
        directory: this.#state.home,
        device: this.#state.homeDevice,
        inode: this.#state.homeInode,
      },
      {
        directory: this.#state.codexHome,
        device: this.#state.codexHomeDevice,
        inode: this.#state.codexHomeInode,
      },
      {
        directory: this.#state.sqliteHome,
        device: this.#state.sqliteHomeDevice,
        inode: this.#state.sqliteHomeInode,
      },
    ]) {
      let stat;
      try {
        stat = lstatSync(identity.directory, { bigint: true });
      } catch {
        throw new CodexIsolatedAuthProjectionErrorV01(
          "codex_isolated_auth_state_substituted",
        );
      }
      if (
        !stat.isDirectory() ||
        stat.isSymbolicLink() ||
        stat.dev !== identity.device ||
        stat.ino !== identity.inode ||
        (stat.mode & BigInt(0o077)) !== BigInt(0)
      ) {
        throw new CodexIsolatedAuthProjectionErrorV01(
          "codex_isolated_auth_state_substituted",
        );
      }
    }
    const authPath = path.join(this.#state.codexHome, "auth.json");
    if (existsSync(authPath)) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_file_persistence_refused",
      );
    }
    if (
      beforeSpawn &&
      [this.#state.home, this.#state.codexHome, this.#state.sqliteHome].some(
        (directory) => readdirSync(directory).length !== 0,
      )
    ) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_shared_state_material_refused",
      );
    }
  }
}

export function createCodexIsolatedAuthProjectionV01(
  input: CreateCodexIsolatedAuthProjectionInputV01,
): CodexIsolatedAuthProjectionV01 {
  const configPolicy: CodexIsolatedAuthConfigPolicyV01 = {
    ...CONFIG_POLICY_MATERIAL_V01,
    policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        ...CONFIG_POLICY_MATERIAL_V01,
        config_override_args: CONFIG_OVERRIDE_ARGS_V01,
      }),
    ),
  };
  const material = {
    projection_version: CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01,
    projection_id: requiredIdV01(input.projection_id),
    projection_mode: CODEX_ISOLATED_AUTH_ROUTE_V01,
    provider_ref: normalizeExternalRefPrimitiveV01(input.provider_ref),
    auth_mode: "agent_identity",
    auth_handle_ref: normalizeExternalRefPrimitiveV01(input.auth_handle_ref),
    broker_version: CODEX_ISOLATED_AUTH_BROKER_VERSION_V01,
    broker_backend_ref: normalizeExternalRefPrimitiveV01(
      input.broker_backend_ref,
    ),
    broker_executable_ref: normalizeExternalRefPrimitiveV01(
      input.broker_executable_ref,
    ),
    broker_executable_fingerprint: requiredSha256V01(
      input.broker_executable_fingerprint,
    ),
    broker_locator_fingerprint: requiredSha256V01(
      input.broker_locator_fingerprint,
    ),
    auth_source_generation_fingerprint: requiredSha256V01(
      input.auth_source_generation_fingerprint,
    ),
    expected_account_projection_fingerprint: requiredSha256V01(
      input.expected_account_projection_fingerprint,
    ),
    codex_executable_ref: normalizeExternalRefPrimitiveV01(
      input.codex_executable_ref,
    ),
    codex_executable_fingerprint: requiredSha256V01(
      input.codex_executable_fingerprint,
    ),
    compatible_codex_cli_version: requiredCliVersionV01(
      input.compatible_codex_cli_version,
    ),
    state_policy: STATE_POLICY_V01,
    config_policy: configPolicy,
    launch_injection_mechanism: "immediate_child_environment_exact_key",
    launch_injection_key: "CODEX_ACCESS_TOKEN",
    sensitive_material_lifetime: "broker_to_app_server_process_lifetime_only",
    refresh_update_policy:
      "agent_identity_source_read_only_no_augnes_writeback",
    concurrency_lease_policy:
      "canonical_handle_generation_lookup_spawn_lease",
    cleanup_policy:
      "release_after_spawn_remove_attempt_root_after_settlement",
    allowed_child_environment_key_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(ALLOWED_CHILD_ENVIRONMENT_KEYS_V01),
    ),
    forbidden_persistence_surface_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(FORBIDDEN_PERSISTENCE_SURFACES_V01),
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
  assertValidCodexIsolatedAuthProjectionV01(projection);
  return projection;
}

export function assertValidCodexIsolatedAuthProjectionV01(
  input: CodexIsolatedAuthProjectionV01,
): void {
  assertExactKeysV01(
    input as unknown as Record<string, unknown>,
    PROJECTION_KEYS_V01,
    "codex_isolated_auth_projection_shape_invalid",
  );
  assertExactKeysV01(
    input.authority as unknown as Record<string, unknown>,
    AUTHORITY_KEYS_V01,
    "codex_isolated_auth_authority_boundary_invalid",
  );
  assertExactKeysV01(
    input.integrity as unknown as Record<string, unknown>,
    new Set(["algorithm", "fingerprint"]),
    "codex_isolated_auth_integrity_mismatch",
  );
  const expectedConfigPolicy: CodexIsolatedAuthConfigPolicyV01 = {
    ...CONFIG_POLICY_MATERIAL_V01,
    policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        ...CONFIG_POLICY_MATERIAL_V01,
        config_override_args: CONFIG_OVERRIDE_ARGS_V01,
      }),
    ),
  };
  const expectedAllowedEnvironmentFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(ALLOWED_CHILD_ENVIRONMENT_KEYS_V01),
  );
  const expectedForbiddenPersistenceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(FORBIDDEN_PERSISTENCE_SURFACES_V01),
  );
  if (
    input.projection_version !== CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01 ||
    input.projection_mode !== CODEX_ISOLATED_AUTH_ROUTE_V01 ||
    input.auth_mode !== "agent_identity" ||
    input.broker_version !== CODEX_ISOLATED_AUTH_BROKER_VERSION_V01 ||
    input.launch_injection_mechanism !==
      "immediate_child_environment_exact_key" ||
    input.sensitive_material_lifetime !==
      "broker_to_app_server_process_lifetime_only" ||
    input.refresh_update_policy !==
      "agent_identity_source_read_only_no_augnes_writeback" ||
    input.concurrency_lease_policy !==
      "canonical_handle_generation_lookup_spawn_lease" ||
    input.cleanup_policy !==
      "release_after_spawn_remove_attempt_root_after_settlement" ||
    input.auth_bootstrap_network_class !==
      "credential_bootstrap_separate_from_task_network" ||
    canonicalizeProtocolValueV01(input.state_policy) !==
      canonicalizeProtocolValueV01(STATE_POLICY_V01) ||
    canonicalizeProtocolValueV01(input.config_policy) !==
      canonicalizeProtocolValueV01(expectedConfigPolicy)
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_version_invalid",
    );
  }
  for (const ref of [
    input.provider_ref,
    input.auth_handle_ref,
    input.broker_backend_ref,
    input.broker_executable_ref,
    input.codex_executable_ref,
  ]) {
    const errors: string[] = [];
    validateExternalRefStructureV01(ref, "$", {
      error(code) {
        errors.push(code);
      },
      warning() {},
    });
    if (errors.length > 0) {
      throw new CodexIsolatedAuthProjectionErrorV01(
        "codex_isolated_auth_external_ref_invalid",
      );
    }
  }
  if (
    input.provider_ref.ref_type !== "model_provider" ||
    input.provider_ref.external_id !== "openai" ||
    input.auth_handle_ref.ref_type !== "opaque_auth_handle" ||
    !/^codex-auth-handle:[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(
      input.auth_handle_ref.external_id,
    ) ||
    input.broker_backend_ref.ref_type !== "auth_broker_backend" ||
    input.broker_backend_ref.external_id !==
      "macos-keychain-generic-password" ||
    input.broker_executable_ref.ref_type !== "auth_broker_executable" ||
    input.broker_executable_ref.external_id !== "security-system-binary" ||
    input.codex_executable_ref.ref_type !== "codex_executable"
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_external_ref_invalid",
    );
  }
  if (
    parseStrictIsoTimestampV01(input.issued_at) === null ||
    parseStrictIsoTimestampV01(input.expires_at) === null ||
    Date.parse(input.expires_at) <= Date.parse(input.issued_at)
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_time_invalid",
    );
  }
  for (const value of [
    input.broker_executable_fingerprint,
    input.broker_locator_fingerprint,
    input.auth_source_generation_fingerprint,
    input.expected_account_projection_fingerprint,
    input.codex_executable_fingerprint,
    input.config_policy.policy_fingerprint,
    input.allowed_child_environment_key_fingerprint,
    input.forbidden_persistence_surface_fingerprint,
  ]) {
    requiredSha256V01(value);
  }
  if (
    input.allowed_child_environment_key_fingerprint !==
      expectedAllowedEnvironmentFingerprint ||
    input.forbidden_persistence_surface_fingerprint !==
      expectedForbiddenPersistenceFingerprint
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_material_boundary_mismatch",
    );
  }
  if (
    input.launch_injection_key !== "CODEX_ACCESS_TOKEN" ||
    input.state_policy.ephemeral_thread_required !== true ||
    input.config_policy.repository_command_auth_material_inheritance !== false ||
    input.task_tool_network_authority !== "none" ||
    Object.values(input.authority).some((value) => value !== false)
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_authority_boundary_invalid",
    );
  }
  const { integrity, ...material } = input;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.fingerprint !== integrityV01(material).fingerprint
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_integrity_mismatch",
    );
  }
  assertSafePublicProjectionV01(input);
}

export function assertValidCodexIsolatedAuthObservationV01(
  input: CodexIsolatedAuthObservationV01,
  projection: CodexIsolatedAuthProjectionV01,
): void {
  assertValidCodexIsolatedAuthProjectionV01(projection);
  assertExactKeysV01(
    input as unknown as Record<string, unknown>,
    OBSERVATION_KEYS_V01,
    "codex_isolated_auth_observation_shape_invalid",
  );
  assertExactKeysV01(
    input.integrity as unknown as Record<string, unknown>,
    new Set(["algorithm", "fingerprint"]),
    "codex_isolated_auth_observation_integrity_mismatch",
  );
  for (const fingerprint of [
    input.projection_fingerprint,
    input.state_root_fingerprint,
    input.home_identity_fingerprint,
    input.codex_home_identity_fingerprint,
    input.codex_sqlite_home_identity_fingerprint,
    input.codex_executable_fingerprint,
    input.account_projection_fingerprint,
    input.config_policy_fingerprint,
  ]) {
    requiredSha256V01(fingerprint);
  }
  if (
    input.observation_version !== CODEX_ISOLATED_AUTH_OBSERVATION_VERSION_V01 ||
    input.projection_id !== projection.projection_id ||
    input.projection_fingerprint !== projection.integrity.fingerprint ||
    input.codex_executable_fingerprint !==
      projection.codex_executable_fingerprint ||
    input.codex_cli_version !== projection.compatible_codex_cli_version ||
    input.auth_mode !== "agent_identity" ||
    input.account_projection_fingerprint !==
      projection.expected_account_projection_fingerprint ||
    input.config_policy_fingerprint !==
      projection.config_policy.policy_fingerprint ||
    input.codex_sqlite_home_reobserved !== true ||
    input.mcp_server_count !== 0 ||
    input.unexpected_tool_policy_observed !== false ||
    input.ephemeral_thread_required !== true ||
    input.shared_state_observed !== false ||
    input.attempt_auth_material_persisted !== false ||
    input.auth_material_exposed_outside_app_server_launch_boundary !== false ||
    input.repository_command_auth_material_inherited !== false ||
    input.task_tool_network_authority !== "none" ||
    parseStrictIsoTimestampV01(input.observed_at) === null
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_observation_binding_invalid",
    );
  }
  const { integrity, ...material } = input;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.fingerprint !== integrityV01(material).fingerprint
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_observation_integrity_mismatch",
    );
  }
  assertSafePublicProjectionV01(input);
}

export function createCodexAccountProjectionFingerprintV01(input: {
  auth_status: Record<string, unknown>;
  account: Record<string, unknown>;
}): string {
  assertExactAuthStatusV01(input.auth_status);
  assertExactKeysV01(
    input.account,
    new Set(["account", "requiresOpenaiAuth"]),
    "codex_isolated_auth_account_shape_invalid",
  );
  const account = isRecordV01(input.account.account)
    ? input.account.account
    : null;
  if (!account || account.type !== "chatgpt") {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_account_shape_invalid",
    );
  }
  assertExactKeysV01(
    account,
    new Set(["type", "email", "planType"]),
    "codex_isolated_auth_account_shape_invalid",
  );
  const email =
    typeof account.email === "string" && account.email.length > 0
      ? account.email
      : null;
  const planType =
    typeof account.planType === "string" && account.planType.length > 0
      ? account.planType
      : null;
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      projection_version: "codex_public_account_projection.v0.1",
      auth_mode: "agent_identity",
      account_type: "chatgpt",
      account_identity_fingerprint: email
        ? createProtocolSha256V01(email)
        : null,
      plan_type: planType,
      requires_openai_auth: input.account.requiresOpenaiAuth === true,
    }),
  );
}

export function codexIsolatedAuthConfigOverrideArgsV01(): readonly string[] {
  return CONFIG_OVERRIDE_ARGS_V01;
}

function createIsolatedStateV01(parentInput: string): IsolatedStateV01 {
  if (!path.isAbsolute(parentInput)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_parent_invalid",
    );
  }
  let suppliedParentStat;
  try {
    suppliedParentStat = lstatSync(parentInput);
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_parent_invalid",
    );
  }
  if (suppliedParentStat.isSymbolicLink()) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_parent_invalid",
    );
  }
  let parent: string;
  let parentStat;
  try {
    parent = realpathSync(parentInput);
    parentStat = lstatSync(parent);
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_parent_invalid",
    );
  }
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (parentStat.mode & 0o077) !== 0
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_state_parent_invalid",
    );
  }
  const root = mkdtempSync(path.join(parent, "codex-isolated-auth-"));
  chmodSync(root, 0o700);
  const home = path.join(root, "home");
  const codexHome = path.join(root, "codex-home");
  const sqliteHome = path.join(root, "sqlite-home");
  for (const directory of [home, codexHome, sqliteHome]) {
    mkdirSync(directory, { mode: 0o700 });
  }
  const exactRoot = realpathSync(root);
  const exactHome = realpathSync(home);
  const exactCodexHome = realpathSync(codexHome);
  const exactSqliteHome = realpathSync(sqliteHome);
  const sharedCandidates = [
    process.env.HOME,
    process.env.CODEX_HOME,
    process.env.CODEX_SQLITE_HOME,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      try {
        return realpathSync(value);
      } catch {
        return null;
      }
    });
  if (
    sharedCandidates.some(
      (candidate) =>
        candidate !== null &&
        ([parent, exactRoot, exactHome, exactCodexHome, exactSqliteHome].some(
          (owned) => owned === candidate || isWithinPathV01(candidate, owned),
        ) ||
          isWithinPathV01(parent, candidate)),
    )
  ) {
    rmSync(exactRoot, { recursive: true, force: false });
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_shared_state_refused",
    );
  }
  const rootStat = lstatSync(exactRoot, { bigint: true });
  const homeStat = lstatSync(exactHome, { bigint: true });
  const codexHomeStat = lstatSync(exactCodexHome, { bigint: true });
  const sqliteHomeStat = lstatSync(exactSqliteHome, { bigint: true });
  return {
    root: exactRoot,
    home: exactHome,
    codexHome: exactCodexHome,
    sqliteHome: exactSqliteHome,
    rootDevice: rootStat.dev,
    rootInode: rootStat.ino,
    homeDevice: homeStat.dev,
    homeInode: homeStat.ino,
    codexHomeDevice: codexHomeStat.dev,
    codexHomeInode: codexHomeStat.ino,
    sqliteHomeDevice: sqliteHomeStat.dev,
    sqliteHomeInode: sqliteHomeStat.ino,
    rootFingerprint: stateDirectoryIdentityFingerprintV01(
      "state-root",
      exactRoot,
      rootStat.dev,
      rootStat.ino,
    ),
    homeFingerprint: stateDirectoryIdentityFingerprintV01(
      "home",
      exactHome,
      homeStat.dev,
      homeStat.ino,
    ),
    codexHomeFingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        kind: "codex-home",
        path: exactCodexHome,
        device: String(codexHomeStat.dev),
        inode: String(codexHomeStat.ino),
      }),
    ),
    sqliteHomeFingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        kind: "sqlite-home",
        path: exactSqliteHome,
        device: String(sqliteHomeStat.dev),
        inode: String(sqliteHomeStat.ino),
      }),
    ),
  };
}

function stateDirectoryIdentityFingerprintV01(
  kind: string,
  directory: string,
  device: bigint,
  inode: bigint,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      kind,
      path: directory,
      device: String(device),
      inode: String(inode),
    }),
  );
}

function assertExactAuthStatusV01(value: Record<string, unknown>): void {
  assertExactKeysV01(
    value,
    new Set(["authMethod", "authToken", "requiresOpenaiAuth"]),
    "codex_isolated_auth_mode_mismatch",
  );
  if (
    value.authMethod !== "agentIdentity" ||
    value.authToken !== null ||
    value.requiresOpenaiAuth !== true
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_mode_mismatch",
    );
  }
}

function assertExactConfigPolicyV01(
  value: Record<string, unknown>,
  expected: CodexIsolatedAuthConfigPolicyV01,
  expectedSqliteHome: string,
): string {
  const config = isRecordV01(value.config) ? value.config : null;
  const shellPolicy = isRecordV01(config?.shell_environment_policy)
    ? config.shell_environment_policy
    : null;
  const features = isRecordV01(config?.features) ? config.features : null;
  const orchestrator = isRecordV01(config?.orchestrator)
    ? config.orchestrator
    : null;
  const orchestratorSkills = isRecordV01(orchestrator?.skills)
    ? orchestrator.skills
    : null;
  const orchestratorMcp = isRecordV01(orchestrator?.mcp)
    ? orchestrator.mcp
    : null;
  if (
    !config ||
    config.forced_login_method !== "chatgpt" ||
    config.web_search !== "disabled" ||
    config.project_doc_max_bytes !== 0 ||
    config.allow_login_shell !== false ||
    config.cli_auth_credentials_store !== "ephemeral" ||
    config.check_for_update_on_startup !== false ||
    config.sqlite_home !== pathToFileURL(expectedSqliteHome).href ||
    !Array.isArray(config.project_doc_fallback_filenames) ||
    config.project_doc_fallback_filenames.length !== 0 ||
    !shellPolicy ||
    shellPolicy.inherit !== "core" ||
    shellPolicy.ignore_default_excludes !== false ||
    !isEmptyRecordV01(config.mcp_servers) ||
    !isEmptyRecordV01(config.plugins) ||
    !isEmptyRecordV01(config.skills) ||
    !isEmptyRecordV01(config.apps) ||
    !orchestratorSkills ||
    orchestratorSkills.enabled !== false ||
    !orchestratorMcp ||
    orchestratorMcp.enabled !== false ||
    !features ||
    [
      "apps",
      "browser_use",
      "browser_use_external",
      "browser_use_full_cdp_access",
      "computer_use",
      "hooks",
      "image_generation",
      "in_app_browser",
      "multi_agent",
      "network_proxy",
      "plugins",
      "recommended_plugins",
      "remote_plugin",
      "request_permissions_tool",
      "standalone_web_search",
      "tool_suggest",
      "web_search_cached",
      "web_search_request",
    ].some((key) => features[key] !== false)
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_config_policy_mismatch",
    );
  }
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...CONFIG_POLICY_MATERIAL_V01,
      config_override_args: CONFIG_OVERRIDE_ARGS_V01,
    }),
  );
  if (fingerprint !== expected.policy_fingerprint) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_config_policy_mismatch",
    );
  }
  return fingerprint;
}

function assertSafePublicProjectionV01(value: unknown): void {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error(code) {
        issues.push(code);
      },
      warning() {},
    },
    {
      secret_material_message:
        "Isolated-auth public material must not contain sensitive values.",
      provider_specific_field_message:
        "Provider identity must remain inside typed ExternalRef material.",
      allowed_canonical_identity_paths: new Set([
        "$.codex_executable_ref",
        "$.codex_executable_fingerprint",
        "$.state_policy.codex_home_isolated",
        "$.state_policy.codex_sqlite_home_isolated",
        "$.config_policy.codex_sqlite_home_binding",
        "$.codex_home_identity_fingerprint",
        "$.codex_sqlite_home_identity_fingerprint",
        "$.codex_sqlite_home_reobserved",
        "$.codex_cli_version",
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
        "unexpected_tool_policy_observed",
        "shared_state_observed",
        "attempt_auth_material_persisted",
        "auth_material_exposed_outside_app_server_launch_boundary",
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
    ) {
      issues.push("absolute_local_path_forbidden");
    }
  });
  if (issues.length > 0) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_public_material_forbidden",
    );
  }
}

function assertProjectionTimeWindowV01(
  projection: CodexIsolatedAuthProjectionV01,
): void {
  const now = Date.now();
  if (now < Date.parse(projection.issued_at)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_not_yet_valid",
    );
  }
  if (now >= Date.parse(projection.expires_at)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_expired",
    );
  }
}

function exactExecutableV01(
  input: string,
  expectedFingerprint: string,
): ExactExecutableIdentityV01 {
  if (!path.isAbsolute(input)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_not_absolute",
    );
  }
  let executable: string;
  let stat;
  try {
    executable = realpathSync(input);
    stat = lstatSync(executable);
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_substituted",
    );
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_substituted",
    );
  }
  const fingerprint = `sha256:${createHash("sha256")
    .update(readFileSync(executable))
    .digest("hex")}`;
  if (fingerprint !== expectedFingerprint) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_substituted",
    );
  }
  const identity = {
    path: executable,
    device: BigInt(stat.dev),
    inode: BigInt(stat.ino),
    fingerprint,
  };
  assertExactExecutableIdentityV01(identity);
  return identity;
}

function assertExactExecutableIdentityV01(
  identity: ExactExecutableIdentityV01,
): void {
  let current;
  try {
    current = lstatSync(identity.path, { bigint: true });
  } catch {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_substituted",
    );
  }
  if (
    !current.isFile() ||
    current.isSymbolicLink() ||
    current.dev !== identity.device ||
    current.ino !== identity.inode ||
    `sha256:${createHash("sha256")
      .update(readFileSync(identity.path))
      .digest("hex")}` !== identity.fingerprint
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_executable_substituted",
    );
  }
}

function boundedBaseEnvironmentV01(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const output: NodeJS.ProcessEnv = { NODE_ENV: source.NODE_ENV ?? "production" };
  for (const key of [
    "PATH",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TMPDIR",
    "TZ",
    "TERM",
    "NO_COLOR",
  ]) {
    if (typeof source[key] === "string" && source[key]!.length > 0) {
      output[key] = source[key];
    }
  }
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
    keys.some((key) => !TEST_ENVIRONMENT_KEYS_V01.has(key))
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_test_environment_refused",
    );
  }
  return { ...source };
}

function validatePrefixArgsV01(values: string[], testMode: boolean): string[] {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    values,
    "$.prefix_args",
    {
      error(code) {
        issues.push(code);
      },
      warning() {},
    },
    {
      secret_material_message: "Secret material is forbidden in argv.",
      provider_specific_field_message:
        "Provider material is forbidden in argv.",
    },
  );
  if (
    (!testMode && values.length !== 0) ||
    values.length > 8 ||
    issues.length > 0 ||
    values.some(
      (value) =>
        typeof value !== "string" ||
        value.length < 1 ||
        value.length > 4096 ||
        /[\u0000\r\n]/u.test(value) ||
        containsCodexCredentialSecretShapeV01(value),
    )
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_prefix_args_invalid",
    );
  }
  return [...values];
}

function requiredIdV01(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(value)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_projection_id_invalid",
    );
  }
  return value;
}

function requiredSha256V01(value: string): string {
  if (!/^sha256:[a-f0-9]{64}$/u.test(value)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_fingerprint_invalid",
    );
  }
  return value;
}

function requiredCliVersionV01(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/u.test(value)) {
    throw new CodexIsolatedAuthProjectionErrorV01(
      "codex_isolated_auth_cli_version_invalid",
    );
  }
  return value;
}

function publicCliVersionV01(value: unknown): string {
  const text = requiredTextV01(
    value,
    "codex_isolated_auth_cli_version_missing",
  );
  const match = text.match(/(?:codex-cli[\s/]+)([A-Za-z0-9._-]+)/u);
  return requiredCliVersionV01(match?.[1] ?? text);
}

function requiredTextV01(value: unknown, code: string): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 4096 ||
    /[\u0000\r\n]/u.test(value)
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(code);
  }
  return value;
}

function integrityV01(value: unknown): {
  algorithm: "sha256";
  fingerprint: string;
} {
  return {
    algorithm: "sha256",
    fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(value),
    ),
  };
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEmptyRecordV01(value: unknown): boolean {
  return isRecordV01(value) && Object.keys(value).length === 0;
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  expected: ReadonlySet<string>,
  code: string,
): void {
  const keys = Object.keys(value);
  if (
    keys.length !== expected.size ||
    keys.some((key) => !expected.has(key))
  ) {
    throw new CodexIsolatedAuthProjectionErrorV01(code);
  }
}

function isWithinPathV01(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function walkStringsV01(
  value: unknown,
  visit: (candidate: string) => void,
): void {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStringsV01(item, visit);
    return;
  }
  if (!isRecordV01(value)) return;
  for (const item of Object.values(value)) walkStringsV01(item, visit);
}

export function createCodexIsolatedAuthTestRefV01(input: {
  ref_type: string;
  external_id?: string;
  observed_at: string;
}): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: input.ref_type,
    external_id: input.external_id ?? `${input.ref_type}:${randomUUID()}`,
    provider: "codex",
    host: "local",
    observed_at: input.observed_at,
    trust_class: "direct_local_observation",
    compatibility_namespace: CODEX_ISOLATED_AUTH_PROJECTION_VERSION_V01,
  };
}
