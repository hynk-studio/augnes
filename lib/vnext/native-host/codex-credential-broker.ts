import {
  spawn,
  spawnSync,
  type ChildProcess,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  type CodexIsolatedAuthenticatedExecutionOwnerV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  CODEX_ISOLATED_AUTH_AVAILABILITY_VERSION_V01,
  CODEX_AGENT_IDENTITY_AUDIENCE_V01,
  CODEX_AGENT_IDENTITY_ISSUER_V01,
  CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
  CODEX_AUTH_KEYRING_SERVICE_V01,
  CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01,
  CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01,
  CODEX_ISOLATED_AUTH_ROUTE_V01,
  type CodexIsolatedAuthAvailabilityV01,
  type CodexIsolatedAuthCredentialAttestationV01,
  type CodexIsolatedAuthProjectionV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const MACOS_SECURITY_PATH_V01 = "/usr/bin/security";
const MAX_BROKER_OUTPUT_BYTES_V01 = 64 * 1024;
const MACOS_KEYCHAIN_READ_TIMEOUT_MS_V01 = 60_000;
const CHILD_ROLLBACK_TIMEOUT_MS_V01 = 5_000;
const CREDENTIAL_EXPIRY_SAFETY_MARGIN_SECONDS_V01 = 60;
export const CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01 =
  "codex_isolated_authenticated_child_binding.v0.1" as const;
const SOURCE_OWNED_BROKERS_V01 = new WeakSet<object>();
const PRIVATE_BROKER_SPAWNERS_V01 = new WeakMap<
  CodexCredentialBrokerV01,
  (
    input: PrivateSpawnExactCodexAppServerInputV01,
  ) => Promise<CodexIsolatedAuthenticatedChildBindingV01>
>();
const PRIVATE_LAUNCH_CAPABILITIES_V01 = new WeakMap<
  CodexBrokerPrivateLaunchCapabilityV01,
  PrivateSpawnExactCodexAppServerInputV01
>();
const PRIVATE_BOUND_EXECUTION_OWNERS_V01 = new WeakSet<object>();
const PRIVATE_AUTHENTICATED_CHILD_BINDINGS_V01 = new WeakMap<
  CodexIsolatedAuthenticatedChildBindingV01,
  PrivateAuthenticatedChildBindingStateV01
>();
const PRIVATE_AUTHENTICATED_CHILD_BINDING_FAULTS_V01 = new WeakMap<
  CodexIsolatedAuthenticatedExecutionOwnerV01,
  CodexAuthenticatedChildBindingFaultForTestV01
>();
const PRIVATE_RETAINED_ROLLBACK_OWNERS_V01 = new WeakSet<object>();
const PRIVATE_RETAINED_ROLLBACK_CHILDREN_V01 =
  new Set<ChildProcessWithoutNullStreams>();
const PRIVATE_POISONED_LEASE_IDENTITIES_V01 = new Set<string>();
const PRIVATE_RETAINED_BROKER_LEASES_V01 = new Set<BrokerLeaseV01>();
const EXACT_APP_SERVER_ENVIRONMENT_KEYS_V01 = new Set([
  "AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE",
  "CODEX_HOME",
  "CODEX_SQLITE_HOME",
  "FAKE_CODEX_AUTH_BOUNDARY_PATH",
  "FAKE_CODEX_CLEANUP_MARKER_PATH",
  "FAKE_CODEX_CW1_OUTPUT_CONTENT_BASE64",
  "FAKE_CODEX_CW1_OUTPUT_RELATIVE_PATH",
  "FAKE_CODEX_NETWORK_COUNT_PATH",
  "FAKE_CODEX_ORACLE_GUARD_PATH",
  "FAKE_CODEX_SCENARIO",
  "FAKE_CODEX_SESSION_ID",
  "FAKE_CODEX_THREAD_ID",
  "FAKE_CODEX_TRACE_PATH",
  "FAKE_CODEX_TURN_ID",
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
]);

export class CodexCredentialBrokerErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexCredentialBrokerErrorV01";
  }
}

export interface CodexCredentialBrokerBindingV01 {
  auth_handle_ref: ExternalRefV01;
  broker_backend_ref: ExternalRefV01;
  broker_executable_ref: ExternalRefV01;
  broker_executable_fingerprint: string;
  broker_locator_fingerprint: string;
}

export interface ProvisionCodexCredentialAttestationInputV01 {
  provisioning_binding_ref: ExternalRefV01;
  semantic_profile_version: CodexIsolatedAuthCredentialAttestationV01["semantic_profile_version"];
  semantic_profile_fingerprint: string;
  attestation_id: string;
  issued_at: string;
  expires_at: string;
}

interface PrivateSpawnExactCodexAppServerInputV01 {
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  broker: CodexCredentialBrokerV01;
  projection: CodexIsolatedAuthProjectionV01;
  credential_attestation: CodexIsolatedAuthCredentialAttestationV01;
  command: string;
  args: string[];
  cwd: string;
  launch_environment: {
    NODE_ENV: "production" | "development" | "test";
    HOME: string;
    CODEX_HOME: string;
    CODEX_SQLITE_HOME: string;
    TMPDIR: string;
    PATH?: string;
    LANG?: string;
    LC_ALL?: string;
    LC_CTYPE?: string;
    NO_COLOR?: string;
    TERM?: string;
    TZ?: string;
    test_controls: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE?: string;
      FAKE_CODEX_AUTH_BOUNDARY_PATH?: string;
      FAKE_CODEX_CLEANUP_MARKER_PATH?: string;
      FAKE_CODEX_CW1_OUTPUT_CONTENT_BASE64?: string;
      FAKE_CODEX_CW1_OUTPUT_RELATIVE_PATH?: string;
      FAKE_CODEX_NETWORK_COUNT_PATH?: string;
      FAKE_CODEX_ORACLE_GUARD_PATH?: string;
      FAKE_CODEX_SCENARIO?: string;
      FAKE_CODEX_SESSION_ID?: string;
      FAKE_CODEX_THREAD_ID?: string;
      FAKE_CODEX_TRACE_PATH?: string;
      FAKE_CODEX_TURN_ID?: string;
    };
  };
  launch_shape_fingerprint: string;
  state_root: string;
  state_identities: Record<"HOME" | "CODEX_HOME" | "CODEX_SQLITE_HOME" | "TMPDIR", ExactLaunchDirectoryIdentityV01>;
  repository_identity: ExactLaunchDirectoryIdentityV01;
}

interface ExactLaunchDirectoryIdentityV01 {
  path: string;
  device: bigint;
  inode: bigint;
}

interface BrokerProcessBirthRecordV01 {
  pid: number;
  ppid: number;
  pgid: number;
  state: string;
  started: string;
  command_fingerprint: string;
}

interface BrokerOwnedProcessTreeIdentityV01 {
  root_pid: number | null;
  records: readonly BrokerProcessBirthRecordV01[];
  exact: boolean;
}

interface BrokerOwnedProcessTreeStopResultV01 {
  settled: boolean;
  ownership_exact: boolean;
}

export interface CodexBrokerPrivateLaunchCapabilityV01 {
  readonly capability_fingerprint: string;
}

export interface CodexIsolatedAuthenticatedChildBindingV01 {
  readonly binding_version: typeof CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01;
  readonly binding_fingerprint: string;
}

interface PrivateAuthenticatedChildBindingStateV01 {
  source_binding: CodexIsolatedAuthenticatedChildBindingV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  launch_input: PrivateSpawnExactCodexAppServerInputV01;
  source_child: ChildProcessWithoutNullStreams;
  bound_child: ChildProcessWithoutNullStreams;
  rollback_ownership: BrokerOwnedProcessTreeIdentityV01;
  child_pid: number;
  child_birth_record: BrokerProcessBirthRecordV01;
  child_identity_fingerprint: string;
  projection_fingerprint: string;
  credential_generation_fingerprint: string;
  credential_attestation_fingerprint: string;
  semantic_profile_fingerprint: string;
  executable_fingerprint: string;
  repository_root_fingerprint: string;
  launch_shape_fingerprint: string;
  state_root_fingerprint: string;
  private_auth_snapshot: ExactPrivateAuthSnapshotIdentityV01 | null;
  consumed: boolean;
  transferred: boolean;
}

interface ExactPrivateAuthSnapshotIdentityV01 {
  path: string;
  parent_path: string;
  device: bigint;
  inode: bigint;
}

interface AgentIdentityRecordV01 extends Record<string, unknown> {
  agent_runtime_id: string;
  agent_private_key: string;
  account_id: string;
  chatgpt_user_id: string;
  email?: string;
  plan_type: string;
  chatgpt_account_is_fedramp: boolean;
  task_id?: string;
}

interface ResolvedCodexAuthStorageV01 {
  source_material: string;
  source_auth_mode: "agentIdentity" | "chatgpt";
  agent_identity_storage_kind: "jwt" | "record";
  managed_chatgpt_binding_verified: boolean;
  agent_identity_task_registration_state: "present" | "required";
  identity: AgentIdentityClaimsV01 | AgentIdentityRecordV01;
  jwt_claims: AgentIdentityClaimsV01 | null;
  launch_auth_dot_json: string;
}

export type CodexAuthenticatedChildBindingFaultForTestV01 =
  | "cloned_binding"
  | "already_consumed"
  | "wrong_owner"
  | "wrong_projection"
  | "wrong_attestation"
  | "wrong_credential_generation"
  | "wrong_semantic_profile"
  | "wrong_executable"
  | "wrong_repository_root"
  | "wrong_state_root"
  | "wrong_pid"
  | "wrong_birth_identity"
  | "substituted_child"
  | "wrong_launch_shape";

export interface BindCodexBrokerPrivateLaunchCapabilityInputV01 {
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  broker: CodexCredentialBrokerV01;
  projection: CodexIsolatedAuthProjectionV01;
  credential_attestation: CodexIsolatedAuthCredentialAttestationV01;
  command: string;
  test_prefix_args: string[];
  repository_root: string;
  state_paths: {
    root: string;
    HOME: string;
    CODEX_HOME: string;
    CODEX_SQLITE_HOME: string;
    TMPDIR: string;
  };
  base_environment: {
    NODE_ENV: "production" | "development" | "test";
    PATH?: string;
    LANG?: string;
    LC_ALL?: string;
    LC_CTYPE?: string;
    NO_COLOR?: string;
    TERM?: string;
    TZ?: string;
  };
  test_controls: Record<string, string | undefined>;
  launch_shape_fingerprint: string;
}

/** Public callers can only inspect availability or provision a safe
 * attestation. Authenticated child creation is owned by a private, exact launch
 * capability whose stored launch material is not present on this interface. */
export interface CodexCredentialBrokerV01 {
  readonly binding_fingerprint: string;
  provisionCredentialAttestationV01(
    input: ProvisionCodexCredentialAttestationInputV01,
  ): Promise<CodexIsolatedAuthCredentialAttestationV01>;
  availabilityV01(input: {
    codex_executable_fingerprint: string;
    observed_at: string;
  }): Promise<CodexIsolatedAuthAvailabilityV01>;
}

export function assertSourceOwnedCodexCredentialBrokerV01(
  broker: CodexCredentialBrokerV01,
  expectedBindingFingerprint: string,
): void {
  if (
    !SOURCE_OWNED_BROKERS_V01.has(broker) ||
    broker.binding_fingerprint !== expectedBindingFingerprint
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_source_owner_mismatch",
    );
  }
}

/**
 * Bind one exact source-owned broker to one isolated App Server launch. The
 * returned capability is opaque: its only public field is a fingerprint, and
 * all command, argument, cwd, and state identities remain in this module's
 * WeakMap. The capability is single-use even when child creation rolls back.
 */
export function bindCodexBrokerPrivateLaunchCapabilityV01(
  input: BindCodexBrokerPrivateLaunchCapabilityInputV01,
): CodexBrokerPrivateLaunchCapabilityV01 {
  assertSourceOwnedCodexCredentialBrokerV01(
    input.broker,
    credentialBrokerBindingFingerprintV01({
      auth_handle_ref: input.projection.auth_handle_ref,
      broker_backend_ref: input.projection.broker_backend_ref,
      broker_executable_ref: input.projection.broker_executable_ref,
      broker_executable_fingerprint:
        input.projection.broker_executable_fingerprint,
      broker_locator_fingerprint: input.projection.broker_locator_fingerprint,
    }),
  );
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(input.owner);
  if (PRIVATE_BOUND_EXECUTION_OWNERS_V01.has(input.owner))
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_spawn_capability_refused",
    );
  const privateSpawner = PRIVATE_BROKER_SPAWNERS_V01.get(input.broker);
  if (!privateSpawner)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_spawn_unavailable",
    );
  const command = exactLaunchExecutableV01(
    input.command,
    input.projection.codex_executable_fingerprint,
  );
  const prefix = exactTestPrefixArgsV01(input.test_prefix_args);
  const root = exactPrivateDirectoryV01(input.state_paths.root);
  const stateIdentities = {
    HOME: exactLaunchStateDirectoryV01(root, input.state_paths.HOME),
    CODEX_HOME: exactLaunchStateDirectoryV01(
      root,
      input.state_paths.CODEX_HOME,
    ),
    CODEX_SQLITE_HOME: exactLaunchStateDirectoryV01(
      root,
      input.state_paths.CODEX_SQLITE_HOME,
    ),
    TMPDIR: exactLaunchStateDirectoryV01(root, input.state_paths.TMPDIR),
  };
  const repositoryIdentity = exactLaunchDirectoryIdentityV01(
    input.repository_root,
    "codex_auth_broker_repository_root_refused",
  );
  const args = [
    ...prefix,
    ...CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01,
    "app-server",
    "--stdio",
  ];
  const launchEnvironment = exactPrivateLaunchEnvironmentV01({
    base: input.base_environment,
    test_controls: input.test_controls,
    state: stateIdentities,
  });
  const capabilityFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_broker_private_launch_capability.v0.1",
      projection_fingerprint: input.projection.integrity.fingerprint,
      attestation_fingerprint:
        input.credential_attestation.integrity.fingerprint,
      command_fingerprint: input.projection.codex_executable_fingerprint,
      args_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(args),
      ),
      repository_identity_fingerprint: launchDirectoryFingerprintV01(
        repositoryIdentity,
      ),
      state_identity_fingerprints: Object.fromEntries(
        Object.entries(stateIdentities).map(([key, value]) => [
          key,
          launchDirectoryFingerprintV01(value),
        ]),
      ),
      launch_shape_fingerprint: input.launch_shape_fingerprint,
      nonce: randomUUID(),
    }),
  );
  const capability = Object.freeze({
    capability_fingerprint: capabilityFingerprint,
  });
  PRIVATE_LAUNCH_CAPABILITIES_V01.set(capability, {
    owner: input.owner,
    broker: input.broker,
    projection: deepFreezeV01(structuredClone(input.projection)),
    credential_attestation: deepFreezeV01(
      structuredClone(input.credential_attestation),
    ),
    command,
    args,
    cwd: repositoryIdentity.path,
    launch_environment: launchEnvironment,
    launch_shape_fingerprint: input.launch_shape_fingerprint,
    state_root: root,
    state_identities: stateIdentities,
    repository_identity: repositoryIdentity,
  });
  PRIVATE_BOUND_EXECUTION_OWNERS_V01.add(input.owner);
  return capability;
}

export async function spawnCodexAppServerWithPrivateCapabilityV01(
  capability: CodexBrokerPrivateLaunchCapabilityV01,
): Promise<CodexIsolatedAuthenticatedChildBindingV01> {
  const binding = PRIVATE_LAUNCH_CAPABILITIES_V01.get(capability);
  if (!binding)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_spawn_capability_refused",
    );
  PRIVATE_LAUNCH_CAPABILITIES_V01.delete(capability);
  const privateSpawner = PRIVATE_BROKER_SPAWNERS_V01.get(binding.broker);
  if (!privateSpawner)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_spawn_unavailable",
    );
  assertPrivateLaunchIdentitiesV01(binding);
  return await privateSpawner(binding);
}

/**
 * Atomic broker-to-adapter handoff. The opaque binding can be produced only by
 * the exact credential-injected spawn above. Raw process material is released
 * only to this one callback after every stored owner, credential, launch,
 * root, state, and process-birth relation has been reauthenticated.
 */
export async function consumeCodexIsolatedAuthenticatedChildBindingV01<T>(input: {
  binding: CodexIsolatedAuthenticatedChildBindingV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  repository_root: string;
  consume_authenticated_child(spawnedChild: unknown): Promise<T>;
}): Promise<T> {
  const state = PRIVATE_AUTHENTICATED_CHILD_BINDINGS_V01.get(input.binding);
  if (!state)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_authenticated_child_binding_refused",
    );
  if (state.consumed) {
    if (!state.transferred) {
      const rollback = await rollbackAuthenticatedChildBindingV01(state);
      if (!rollback.settled) {
        retainUnsettledRollbackV01(
          state.launch_input,
          state.source_child,
          state.rollback_ownership,
        );
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_child_rollback_incomplete",
        );
      }
    }
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_authenticated_child_binding_replayed",
    );
  }
  state.consumed = true;
  try {
    assertAuthenticatedChildBindingV01(input, state);
    const result = await input.consume_authenticated_child({
      child: state.source_child,
      child_identity_fingerprint: state.child_identity_fingerprint,
      projection_fingerprint: state.projection_fingerprint,
      settle_private_auth_material: () => {
        const snapshot = state.private_auth_snapshot;
        if (!snapshot)
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_private_auth_snapshot_unavailable",
          );
        settlePrivateAuthSnapshotV01(snapshot);
        state.private_auth_snapshot = null;
      },
    });
    state.transferred = true;
    return result;
  } catch (error) {
    const rollback = await rollbackAuthenticatedChildBindingV01(state);
    if (!rollback.settled) {
      retainUnsettledRollbackV01(
        state.launch_input,
        state.source_child,
        state.rollback_ownership,
      );
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_child_rollback_incomplete",
      );
    }
    throw error;
  }
}

/** Test-only source substitution owner for the closed binding matrix. */
export function configureCodexAuthenticatedChildBindingFaultForTestV01(
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01,
  fault: CodexAuthenticatedChildBindingFaultForTestV01,
): void {
  if (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1")
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_authenticated_child_binding_test_forbidden",
    );
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(owner);
  if (PRIVATE_AUTHENTICATED_CHILD_BINDING_FAULTS_V01.has(owner))
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_authenticated_child_binding_test_reused",
    );
  PRIVATE_AUTHENTICATED_CHILD_BINDING_FAULTS_V01.set(owner, fault);
}

/** Read-only guard used by the exact execution owner. Ordinary callers can
 * make cleanup stricter by invoking it, but cannot clear retained rollback
 * ownership or recover the child handle. */
export function assertCodexBrokerRollbackCleanupAvailableV01(
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01,
): void {
  if (PRIVATE_RETAINED_ROLLBACK_OWNERS_V01.has(owner))
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_child_rollback_retained",
    );
}

interface BrokerLeaseV01 {
  fd: number;
  path: string;
  root: string;
  rootDevice: bigint;
  rootInode: bigint;
  device: bigint;
  inode: bigint;
  identity: string;
}

class ExclusiveCodexCredentialBrokerV01 implements CodexCredentialBrokerV01 {
  readonly binding_fingerprint: string;
  readonly #binding: CodexCredentialBrokerBindingV01;
  readonly #leaseRoot: string | (() => string);
  readonly #preflight: () => void;
  readonly #resolveMaterial: () => Promise<string>;
  readonly #afterSpawnBeforeLeaseRelease: (() => void | Promise<void>) | null;
  readonly #nowEpochSeconds: () => number;
  readonly #forceRollbackUnsettledForTest: boolean;
  readonly #forcePersistentRollbackUnsettledForTest: boolean;
  readonly #forcePoisonWriteFailureForTest: boolean;
  #leaseHeld = false;
  #poisoned = false;

  constructor(
    binding: CodexCredentialBrokerBindingV01,
    leaseRoot: string | (() => string),
    preflight: () => void,
    resolveMaterial: () => Promise<string>,
    afterSpawnBeforeLeaseRelease: (() => void | Promise<void>) | null = null,
    nowEpochSeconds: () => number = () => Math.floor(Date.now() / 1000),
    forceRollbackUnsettledForTest = false,
    forcePersistentRollbackUnsettledForTest = false,
    forcePoisonWriteFailureForTest = false,
  ) {
    const exactBinding = deepFreezeV01(structuredClone(binding));
    this.binding_fingerprint =
      credentialBrokerBindingFingerprintV01(exactBinding);
    this.#binding = exactBinding;
    this.#leaseRoot = leaseRoot;
    this.#preflight = preflight;
    this.#resolveMaterial = resolveMaterial;
    this.#afterSpawnBeforeLeaseRelease = afterSpawnBeforeLeaseRelease;
    this.#nowEpochSeconds = nowEpochSeconds;
    this.#forceRollbackUnsettledForTest = forceRollbackUnsettledForTest;
    this.#forcePersistentRollbackUnsettledForTest =
      forcePersistentRollbackUnsettledForTest;
    this.#forcePoisonWriteFailureForTest = forcePoisonWriteFailureForTest;
    PRIVATE_BROKER_SPAWNERS_V01.set(this, async (input) =>
      await this.#spawnPrivateV01(input),
    );
  }

  async provisionCredentialAttestationV01(
    input: ProvisionCodexCredentialAttestationInputV01,
  ): Promise<CodexIsolatedAuthCredentialAttestationV01> {
    return await this.#withResolvedMaterialV01(null, async (resolved) => {
      assertAgentIdentityReadyWithoutBootstrapV01(resolved);
      return createCredentialAttestationFromStorageV01({
        binding: this.#binding,
        input,
        resolved,
      });
    });
  }

  async availabilityV01(input: {
    codex_executable_fingerprint: string;
    observed_at: string;
  }): Promise<CodexIsolatedAuthAvailabilityV01> {
    let state: CodexIsolatedAuthAvailabilityV01["state"] = "available_exact";
    try {
      await this.#withResolvedMaterialV01(
        null,
        async (resolved) => {
          assertAgentIdentityReadyWithoutBootstrapV01(resolved);
        },
        input.observed_at,
      );
    } catch (error) {
      const code =
        error instanceof CodexCredentialBrokerErrorV01 ? error.code : "";
      state =
        code === "codex_auth_broker_handle_missing"
          ? "handle_missing"
          : code === "codex_auth_broker_handle_ambiguous"
            ? "handle_ambiguous"
            : code === "codex_auth_broker_locator_mismatch"
              ? "locator_mismatch"
              : code ===
                  "codex_auth_broker_agent_identity_task_registration_required"
                ? "agent_identity_task_registration_required"
              : code === "codex_auth_broker_agent_identity_bootstrap_required"
                ? "agent_identity_bootstrap_required"
              : code === "codex_auth_broker_material_invalid"
                ? "credential_shape_invalid"
                : code === "codex_auth_broker_account_identity_missing"
                  ? "account_identity_unavailable"
                  : "unsupported";
    }
    const material = {
      availability_version: CODEX_ISOLATED_AUTH_AVAILABILITY_VERSION_V01,
      projection_mode: CODEX_ISOLATED_AUTH_ROUTE_V01,
      state,
      broker_locator_fingerprint: this.#binding.broker_locator_fingerprint,
      codex_executable_fingerprint: requiredSha256V01(
        input.codex_executable_fingerprint,
      ),
      observed_at: input.observed_at,
    } as const;
    return { ...material, integrity: integrityV01(material) };
  }

  async #spawnPrivateV01(
    input: PrivateSpawnExactCodexAppServerInputV01,
  ): Promise<CodexIsolatedAuthenticatedChildBindingV01> {
    assertExactSpawnBindingV01(this.#binding, input);
    this.#preflight();
    if (this.#poisoned)
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_spawn_capability_consumed",
      );
    if (this.#leaseHeld)
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_collision",
      );
    const lease = this.#acquireLeaseV01(
      input.projection.auth_source_generation_fingerprint,
    );
    this.#leaseHeld = true;
    this.#poisoned = true;
    let child: ChildProcessWithoutNullStreams | null = null;
    let rollbackOwnership: BrokerOwnedProcessTreeIdentityV01 | null = null;
    let privateAuthSnapshot: ExactPrivateAuthSnapshotIdentityV01 | null = null;
    let leaseSettled = false;
    let leaseReleaseAttempted = false;
    let primaryError: unknown = null;
    try {
      assertLeaseIdentityV01(lease);
      const material = await this.#resolveMaterial();
      const resolved = resolveCodexAuthStorageV01(
        material,
        input.credential_attestation.issued_at,
      );
      assertAgentIdentityReadyWithoutBootstrapV01(resolved);
      const generation = fingerprintCredentialSourceGenerationV01({
        auth_handle_external_id: this.#binding.auth_handle_ref.external_id,
        broker_locator_fingerprint: this.#binding.broker_locator_fingerprint,
        material: resolved.source_material,
      });
      if (
        generation !== input.projection.auth_source_generation_fingerprint ||
        accountIdentityFingerprintV01(resolved.identity) !==
          input.projection.account_identity_fingerprint ||
        input.credential_attestation.account_identity_fingerprint !==
          input.projection.account_identity_fingerprint
      )
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_generation_mismatch",
        );
      assertCredentialStorageValidAtSpawnV01(
        resolved,
        input.credential_attestation,
        this.#nowEpochSeconds(),
      );
      assertLeaseIdentityV01(lease);
      privateAuthSnapshot = writePrivateAuthSnapshotV01({
        codex_home: input.state_identities.CODEX_HOME,
        serialized_auth_dot_json: resolved.launch_auth_dot_json,
      });
      const { test_controls: testControls, ...nonSecretEnvironment } =
        input.launch_environment;
      const environment: NodeJS.ProcessEnv = {
        ...nonSecretEnvironment,
        ...testControls,
      };
      try {
        child = spawn(input.command, input.args, {
          cwd: input.cwd,
          env: environment,
          detached: false,
          shell: false,
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_child_spawn_failed",
        );
      } finally {
        Object.freeze(environment);
      }
      child.stdout.pause();
      child.stderr.pause();
      await waitForChildSpawnV01(child);
      rollbackOwnership = captureExactBrokerProcessTreeV01(child);
      if (!rollbackOwnership.exact)
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_child_identity_unavailable",
        );
      await this.#afterSpawnBeforeLeaseRelease?.();
      leaseReleaseAttempted = true;
      try {
        releaseLeaseV01(lease);
      } catch (error) {
        preserveLeasePoisonV01(lease);
        throw error;
      }
      leaseSettled = true;
      this.#leaseHeld = false;
      if (child.exitCode !== null || child.signalCode !== null)
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_child_exited_before_return",
        );
      return createAuthenticatedChildBindingV01(
        input,
        child,
        rollbackOwnership,
        privateAuthSnapshot,
      );
    } catch (error) {
      primaryError = error;
      let rollbackIncomplete = false;
      if (child) {
        if (this.#forcePersistentRollbackUnsettledForTest) {
          // Test-only fault injection enters the same retained-cleanup owner
          // used after two real bounded settlement failures, while leaving the
          // exact child live for the retained owner to settle.
          rollbackIncomplete = true;
        } else {
          const firstRollback = await stopExactBrokerProcessTreeV01(child, {
            graceful_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
            forced_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
            ...(rollbackOwnership ? { ownership: rollbackOwnership } : {}),
          });
          let rollbackSettled =
            firstRollback.settled && !this.#forceRollbackUnsettledForTest;
          if (!rollbackSettled) {
            const finalRollback = await stopExactBrokerProcessTreeV01(child, {
              graceful_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
              forced_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
              ...(rollbackOwnership ? { ownership: rollbackOwnership } : {}),
            });
            rollbackSettled = finalRollback.settled;
          }
          rollbackIncomplete = !rollbackSettled;
        }
        child.stdin.destroy();
        child.stdout.destroy();
        child.stderr.destroy();
      }
      if (privateAuthSnapshot) {
        settlePrivateAuthSnapshotV01(privateAuthSnapshot);
        privateAuthSnapshot = null;
      }
      if (!leaseSettled && !leaseReleaseAttempted) {
        let releaseAllowed = true;
        if (rollbackIncomplete) {
          PRIVATE_POISONED_LEASE_IDENTITIES_V01.add(lease.identity);
          try {
            if (this.#forcePoisonWriteFailureForTest)
              throw new CodexCredentialBrokerErrorV01(
                "codex_auth_broker_poison_write_failed",
              );
            writeExactLeasePoisonV01(lease);
          } catch {
            // Keep the original exclusive lease descriptor and file as the
            // durable blocker. Releasing it after an unauthenticated poison
            // failure would make the credential generation replayable.
            PRIVATE_RETAINED_BROKER_LEASES_V01.add(lease);
            releaseAllowed = false;
            leaseReleaseAttempted = true;
            primaryError = new CodexCredentialBrokerErrorV01(
              "codex_auth_broker_poison_write_failed",
            );
          }
        }
        if (releaseAllowed) {
          try {
            releaseLeaseV01(lease);
            leaseSettled = true;
          } catch (releaseError) {
            preserveLeasePoisonV01(lease);
            primaryError = releaseError;
          }
        }
      }
      if (rollbackIncomplete && child) {
        retainUnsettledRollbackV01(input, child, rollbackOwnership);
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_child_rollback_incomplete",
        );
      }
      throw primaryError;
    } finally {
      this.#leaseHeld = false;
    }
  }

  async #withResolvedMaterialV01<T>(
    expectedGeneration: string | null,
    useSafeInternal: (resolved: ResolvedCodexAuthStorageV01) => Promise<T>,
    observedAt?: string,
  ): Promise<T> {
    this.#preflight();
    if (this.#poisoned)
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_spawn_capability_consumed",
      );
    if (this.#leaseHeld) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_collision",
      );
    }
    const lease = this.#acquireLeaseV01(expectedGeneration);
    this.#leaseHeld = true;
    try {
      assertLeaseRootIdentityV01(lease);
      const material = await this.#resolveMaterial();
      const resolved = resolveCodexAuthStorageV01(
        material,
        observedAt ?? new Date().toISOString(),
      );
      const generation = fingerprintCredentialSourceGenerationV01({
        auth_handle_external_id: this.#binding.auth_handle_ref.external_id,
        broker_locator_fingerprint: this.#binding.broker_locator_fingerprint,
        material: resolved.source_material,
      });
      if (expectedGeneration !== null && generation !== expectedGeneration) {
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_generation_mismatch",
        );
      }
      // The lookup may have crossed an async keychain or test-broker boundary.
      // Re-authenticate the exclusive lease immediately before the first
      // launch effect so a removed or substituted lease cannot admit two
      // consumers of the same handle generation.
      assertLeaseIdentityV01(lease);
      return await useSafeInternal(resolved);
    } finally {
      this.#leaseHeld = false;
      try {
        releaseLeaseV01(lease);
      } catch (error) {
        this.#poisoned = true;
        preserveLeasePoisonV01(lease);
        throw error;
      }
    }
  }

  #acquireLeaseV01(generationFingerprint: string | null): BrokerLeaseV01 {
    const root = exactPrivateDirectoryV01(
      typeof this.#leaseRoot === "function"
        ? this.#leaseRoot()
        : this.#leaseRoot,
    );
    const rootStat = lstatSync(root, { bigint: true });
    const leaseIdentity = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        version: "codex_auth_broker_lease_identity.v0.1",
        auth_handle_ref: this.#binding.auth_handle_ref,
        generation_fingerprint: generationFingerprint ?? "provisioning",
      }),
    );
    const leasePath = path.join(
      root,
      `${leaseIdentity.slice("sha256:".length)}.lease`,
    );
    if (
      PRIVATE_POISONED_LEASE_IDENTITIES_V01.has(leaseIdentity) ||
      existsSync(`${leasePath}.poisoned`)
    )
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_collision",
      );
    let fd: number;
    try {
      fd = openSync(leasePath, "wx", 0o600);
    } catch {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_collision",
      );
    }
    const stat = fstatSync(fd, { bigint: true });
    writeFileSync(
      fd,
      `${createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          lease_identity_fingerprint: leaseIdentity,
          auth_handle_ref: this.#binding.auth_handle_ref,
          generation_fingerprint: generationFingerprint,
        }),
      )}\n`,
      { encoding: "utf8" },
    );
    const lease = {
      fd,
      path: leasePath,
      root,
      rootDevice: rootStat.dev,
      rootInode: rootStat.ino,
      device: stat.dev,
      inode: stat.ino,
      identity: leaseIdentity,
    };
    assertLeaseRootIdentityV01(lease);
    return lease;
  }
}

Object.freeze(ExclusiveCodexCredentialBrokerV01.prototype);

export function createMacOsKeychainCodexAuthBrokerV01(input: {
  binding: CodexCredentialBrokerBindingV01;
  source_codex_home: string;
  keychain_path: string;
}): CodexCredentialBrokerV01 {
  const binding = deepFreezeV01(structuredClone(input.binding));
  const locatorFingerprint = fingerprintBrokerLocatorV01({
    backend: "macos_keychain_generic_password",
    source_codex_home: input.source_codex_home,
    keychain_path: input.keychain_path,
  });
  if (locatorFingerprint !== binding.broker_locator_fingerprint) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_locator_mismatch",
    );
  }
  const sourceCodexHome = exactPrivateCodexHomeV01(input.source_codex_home);
  const serviceName = CODEX_AUTH_KEYRING_SERVICE_V01;
  const accountName = codexAuthKeyringAccountForHomeV01(sourceCodexHome);
  const keychainPath = requiredPrivateAbsolutePathV01(input.keychain_path);
  return sourceOwnedBrokerV01(
    new ExclusiveCodexCredentialBrokerV01(
      binding,
      canonicalProductionLeaseRootV01,
      () => {
        if (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE === "1") {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_production_broker_forbidden_in_test_mode",
          );
        }
        if (process.platform !== "darwin") {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_platform_unsupported",
          );
        }
      },
      async () => {
        const executable = realpathSync(MACOS_SECURITY_PATH_V01);
        if (executable !== MACOS_SECURITY_PATH_V01) {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_executable_substituted",
          );
        }
        const stat = lstatSync(executable);
        if (!stat.isFile() || stat.isSymbolicLink()) {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_executable_substituted",
          );
        }
        const fingerprint = sha256FileV01(executable);
        if (fingerprint !== binding.broker_executable_fingerprint) {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_executable_substituted",
          );
        }
        const keychainIdentity = exactPrivateKeychainIdentityV01(keychainPath);
        const material = await readExactMacOsKeychainItemV01({
          executable,
          service_name: serviceName,
          account_name: accountName,
          keychain_path: keychainIdentity.path,
          timeout_ms: MACOS_KEYCHAIN_READ_TIMEOUT_MS_V01,
        });
        assertExactPrivateFileIdentityV01(
          keychainIdentity,
          "codex_auth_broker_keychain_substituted",
        );
        return material;
      },
    ),
  );
}

export function createFakeCodexCredentialBrokerV01(input: {
  binding: CodexCredentialBrokerBindingV01;
  lease_root: string;
  entries: Array<{ handle_external_id: string; material: string }>;
  fail_code?: string | null;
  before_return?: (() => void | Promise<void>) | null;
  after_spawn_before_lease_release?: (() => void | Promise<void>) | null;
  now_epoch_seconds?: (() => number) | null;
  force_rollback_unsettled_for_test?: boolean;
  force_persistent_rollback_unsettled_for_test?: boolean;
  force_poison_write_failure_for_test?: boolean;
}): CodexCredentialBrokerV01 {
  const binding = deepFreezeV01(structuredClone(input.binding));
  const map = new Map<string, string>();
  for (const entry of input.entries) {
    if (map.has(entry.handle_external_id)) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_handle_duplicate",
      );
    }
    map.set(entry.handle_external_id, entry.material);
  }
  const expectedHandle = binding.auth_handle_ref.external_id;
  const failCode = input.fail_code ?? null;
  const beforeReturn = input.before_return ?? null;
  return sourceOwnedBrokerV01(
    new ExclusiveCodexCredentialBrokerV01(
      binding,
      input.lease_root,
      () => {
        if (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1") {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_fake_broker_forbidden_outside_test_mode",
          );
        }
      },
      async () => {
        if (failCode) throw new CodexCredentialBrokerErrorV01(failCode);
        if (!map.has(expectedHandle)) {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_handle_missing",
          );
        }
        if (map.size !== 1) {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_handle_ambiguous",
          );
        }
        await beforeReturn?.();
        return map.get(expectedHandle)!;
      },
      input.after_spawn_before_lease_release ?? null,
      input.now_epoch_seconds ?? undefined,
      input.force_rollback_unsettled_for_test === true,
      input.force_persistent_rollback_unsettled_for_test === true,
      input.force_poison_write_failure_for_test === true,
    ),
  );
}

function createAuthenticatedChildBindingV01(
  input: PrivateSpawnExactCodexAppServerInputV01,
  child: ChildProcessWithoutNullStreams,
  ownership: BrokerOwnedProcessTreeIdentityV01,
  privateAuthSnapshot: ExactPrivateAuthSnapshotIdentityV01,
): CodexIsolatedAuthenticatedChildBindingV01 {
  const childPid = child.pid ?? null;
  const childBirthRecord = ownership.records.find(
    (entry) => entry.pid === childPid,
  );
  if (!ownership.exact || childPid === null || !childBirthRecord)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_child_identity_unavailable",
    );
  const childBirthFingerprint = brokerProcessBirthFingerprintV01(
    childBirthRecord,
  );
  const childIdentityFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_isolated_authenticated_child_identity.v0.1",
      projection_fingerprint: input.projection.integrity.fingerprint,
      credential_generation_fingerprint:
        input.projection.auth_source_generation_fingerprint,
      executable_fingerprint: input.projection.codex_executable_fingerprint,
      child_pid: childPid,
      child_birth_fingerprint: childBirthFingerprint,
      launch_shape_fingerprint: input.launch_shape_fingerprint,
    }),
  );
  const bindingMaterial = {
    binding_version:
      CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01,
    projection_fingerprint: input.projection.integrity.fingerprint,
    credential_generation_fingerprint:
      input.projection.auth_source_generation_fingerprint,
    credential_attestation_fingerprint:
      input.credential_attestation.integrity.fingerprint,
    semantic_profile_fingerprint:
      input.projection.semantic_profile_fingerprint,
    executable_fingerprint: input.projection.codex_executable_fingerprint,
    repository_root_fingerprint: launchDirectoryFingerprintV01(
      input.repository_identity,
    ),
    child_identity_fingerprint: childIdentityFingerprint,
    launch_shape_fingerprint: input.launch_shape_fingerprint,
    state_root_fingerprint: input.owner.state_root_fingerprint,
    nonce: randomUUID(),
  } as const;
  const sourceBinding = Object.freeze({
    binding_version:
      CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01,
    binding_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(bindingMaterial),
    ),
  });
  const state: PrivateAuthenticatedChildBindingStateV01 = {
    source_binding: sourceBinding,
    owner: input.owner,
    launch_input: input,
    source_child: child,
    bound_child: child,
    rollback_ownership: ownership,
    child_pid: childPid,
    child_birth_record: Object.freeze({ ...childBirthRecord }),
    child_identity_fingerprint: childIdentityFingerprint,
    projection_fingerprint: input.projection.integrity.fingerprint,
    credential_generation_fingerprint:
      input.projection.auth_source_generation_fingerprint,
    credential_attestation_fingerprint:
      input.credential_attestation.integrity.fingerprint,
    semantic_profile_fingerprint:
      input.projection.semantic_profile_fingerprint,
    executable_fingerprint: input.projection.codex_executable_fingerprint,
    repository_root_fingerprint: launchDirectoryFingerprintV01(
      input.repository_identity,
    ),
    launch_shape_fingerprint: input.launch_shape_fingerprint,
    state_root_fingerprint: input.owner.state_root_fingerprint,
    private_auth_snapshot: privateAuthSnapshot,
    consumed: false,
    transferred: false,
  };
  let presentedBinding = sourceBinding;
  const fault = PRIVATE_AUTHENTICATED_CHILD_BINDING_FAULTS_V01.get(
    input.owner,
  );
  PRIVATE_AUTHENTICATED_CHILD_BINDING_FAULTS_V01.delete(input.owner);
  if (fault) {
    const substituted = `sha256:${"0".repeat(64)}`;
    switch (fault) {
      case "cloned_binding":
        presentedBinding = Object.freeze({ ...sourceBinding });
        break;
      case "already_consumed":
        state.consumed = true;
        break;
      case "wrong_owner":
        state.owner = Object.freeze(
          {},
        ) as CodexIsolatedAuthenticatedExecutionOwnerV01;
        break;
      case "wrong_projection":
        state.projection_fingerprint = substituted;
        break;
      case "wrong_attestation":
        state.credential_attestation_fingerprint = substituted;
        break;
      case "wrong_credential_generation":
        state.credential_generation_fingerprint = substituted;
        break;
      case "wrong_semantic_profile":
        state.semantic_profile_fingerprint = substituted;
        break;
      case "wrong_executable":
        state.executable_fingerprint = substituted;
        break;
      case "wrong_repository_root":
        state.repository_root_fingerprint = substituted;
        break;
      case "wrong_state_root":
        state.state_root_fingerprint = substituted;
        break;
      case "wrong_pid":
        state.child_pid += 1;
        break;
      case "wrong_birth_identity":
        state.child_birth_record = Object.freeze({
          ...state.child_birth_record,
          started: `${state.child_birth_record.started}:substituted`,
        });
        break;
      case "substituted_child":
        state.bound_child = Object.freeze(
          {},
        ) as ChildProcessWithoutNullStreams;
        break;
      case "wrong_launch_shape":
        state.launch_shape_fingerprint = substituted;
        break;
    }
  }
  PRIVATE_AUTHENTICATED_CHILD_BINDINGS_V01.set(presentedBinding, state);
  return presentedBinding;
}

function assertAuthenticatedChildBindingV01(
  input: {
    binding: CodexIsolatedAuthenticatedChildBindingV01;
    owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
    repository_root: string;
  },
  state: PrivateAuthenticatedChildBindingStateV01,
): void {
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(input.owner);
  input.owner.assertRepositoryRootV01(input.repository_root);
  const currentRepository = exactLaunchDirectoryIdentityV01(
    input.repository_root,
    "codex_auth_broker_repository_root_refused",
  );
  const currentOwnership = captureExactBrokerProcessTreeV01(
    state.source_child,
  );
  const currentBirth = currentOwnership.records.find(
    (entry) => entry.pid === state.source_child.pid,
  );
  if (
    input.binding !== state.source_binding ||
    Object.keys(input.binding).sort().join("\n") !==
      ["binding_fingerprint", "binding_version"].sort().join("\n") ||
    input.binding.binding_version !==
      CODEX_ISOLATED_AUTHENTICATED_CHILD_BINDING_VERSION_V01 ||
    !/^sha256:[a-f0-9]{64}$/u.test(input.binding.binding_fingerprint) ||
    state.owner !== input.owner ||
    state.bound_child !== state.source_child ||
    state.projection_fingerprint !==
      input.owner.projection.integrity.fingerprint ||
    state.credential_generation_fingerprint !==
      state.launch_input.projection.auth_source_generation_fingerprint ||
    state.credential_attestation_fingerprint !==
      state.launch_input.credential_attestation.integrity.fingerprint ||
    state.semantic_profile_fingerprint !==
      input.owner.projection.semantic_profile_fingerprint ||
    state.executable_fingerprint !==
      input.owner.projection.codex_executable_fingerprint ||
    state.repository_root_fingerprint !==
      launchDirectoryFingerprintV01(currentRepository) ||
    state.state_root_fingerprint !== input.owner.state_root_fingerprint ||
    state.launch_shape_fingerprint !==
      input.owner.projection.app_server_launch_shape_fingerprint ||
    state.private_auth_snapshot === null ||
    state.child_pid !== state.source_child.pid ||
    !currentOwnership.exact ||
    !currentBirth ||
    !sameBrokerProcessBirthV01(state.child_birth_record, currentBirth) ||
    state.source_child.exitCode !== null ||
    state.source_child.signalCode !== null
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_authenticated_child_binding_refused",
    );
  assertPrivateAuthSnapshotIdentityV01(state.private_auth_snapshot);
}

async function rollbackAuthenticatedChildBindingV01(
  state: PrivateAuthenticatedChildBindingStateV01,
): Promise<BrokerOwnedProcessTreeStopResultV01> {
  const first = await stopExactBrokerProcessTreeV01(state.source_child, {
    graceful_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
    forced_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
    ownership: state.rollback_ownership,
  });
  const result = first.settled
    ? first
    : await stopExactBrokerProcessTreeV01(state.source_child, {
        graceful_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
        forced_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
        ownership: state.rollback_ownership,
      });
  state.source_child.stdin.destroy();
  state.source_child.stdout.destroy();
  state.source_child.stderr.destroy();
  if (result.settled && state.private_auth_snapshot) {
    settlePrivateAuthSnapshotV01(state.private_auth_snapshot);
    state.private_auth_snapshot = null;
  }
  return result;
}

function brokerProcessBirthFingerprintV01(
  record: BrokerProcessBirthRecordV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_broker_process_birth.v0.1",
      pid: record.pid,
      ppid: record.ppid,
      pgid: record.pgid,
      started: record.started,
      command_fingerprint: record.command_fingerprint,
    }),
  );
}

function retainUnsettledRollbackV01(
  input: PrivateSpawnExactCodexAppServerInputV01,
  child: ChildProcessWithoutNullStreams,
  ownership: BrokerOwnedProcessTreeIdentityV01 | null,
): void {
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(input.owner);
  PRIVATE_RETAINED_ROLLBACK_OWNERS_V01.add(input.owner);
  PRIVATE_RETAINED_ROLLBACK_CHILDREN_V01.add(child);
  let completed = false;
  const complete = (): void => {
    if (completed) return;
    completed = true;
    PRIVATE_RETAINED_ROLLBACK_CHILDREN_V01.delete(child);
    PRIVATE_RETAINED_ROLLBACK_OWNERS_V01.delete(input.owner);
    try {
      input.owner.cleanupV01();
    } catch {
      // The exact owner remains fail-closed if its state identity was
      // substituted. No foreign path is recreated or removed here.
    }
  };
  if (child.exitCode !== null || child.signalCode !== null) complete();
  else {
    child.once("close", complete);
    void stopExactBrokerProcessTreeV01(child, {
      graceful_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
      forced_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01 / 2,
      ...(ownership ? { ownership } : {}),
    })
      .then((result) => {
        if (result.settled) complete();
      })
      .catch(() => {
        // The exact child and owner remain strongly retained and the lease is
        // poisoned. No state is removed while process ownership is ambiguous.
      });
  }
}

/** Test-only negative proof. It substitutes the captured root birth identity,
 * asks the broker's private rollback owner to stop it, and returns only the
 * bounded refusal result. The substituted identity can never authorize a
 * signal. */
export async function verifyCodexBrokerProcessIdentitySubstitutionForTestV01(
  child: ChildProcess,
): Promise<BrokerOwnedProcessTreeStopResultV01> {
  if (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1")
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_process_identity_test_forbidden",
    );
  const exact = captureExactBrokerProcessTreeV01(child);
  if (!exact.exact || exact.records.length === 0)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_child_identity_unavailable",
    );
  const substituted: BrokerOwnedProcessTreeIdentityV01 = Object.freeze({
    root_pid: exact.root_pid,
    exact: true,
    records: Object.freeze(
      exact.records.map((entry, index) =>
        Object.freeze({
          ...entry,
          started: index === 0 ? `${entry.started}:substituted` : entry.started,
        }),
      ),
    ),
  });
  return await stopExactBrokerProcessTreeV01(child, {
    graceful_timeout_ms: 250,
    forced_timeout_ms: 250,
    ownership: substituted,
  });
}

function captureExactBrokerProcessTreeV01(
  child: ChildProcess,
): BrokerOwnedProcessTreeIdentityV01 {
  const rootPid = child.pid ?? null;
  if (!rootPid || process.platform === "win32")
    return Object.freeze({
      root_pid: rootPid,
      records: Object.freeze([]),
      exact: false,
    });
  const snapshot = readBrokerProcessSnapshotV01();
  const root = snapshot.get(rootPid);
  if (!root)
    return Object.freeze({
      root_pid: rootPid,
      records: Object.freeze([]),
      exact: false,
    });
  return Object.freeze({
    root_pid: rootPid,
    records: Object.freeze(
      brokerDescendantsFromSnapshotV01(snapshot, root).map((entry) =>
        Object.freeze({ ...entry }),
      ),
    ),
    exact: true,
  });
}

async function stopExactBrokerProcessTreeV01(
  child: ChildProcess,
  options: {
    graceful_timeout_ms: number;
    forced_timeout_ms: number;
    ownership?: BrokerOwnedProcessTreeIdentityV01;
  },
): Promise<BrokerOwnedProcessTreeStopResultV01> {
  const ownership =
    options.ownership ?? captureExactBrokerProcessTreeV01(child);
  const rootPid = ownership.root_pid;
  const known = new Map(ownership.records.map((entry) => [entry.pid, entry]));
  if (!ownership.exact || !rootPid || !known.has(rootPid))
    return { settled: child.exitCode !== null, ownership_exact: false };
  const initial = reobserveExactBrokerProcessTreeV01(rootPid, known);
  if (!initial.exact) return { settled: false, ownership_exact: false };
  if (!initial.alive) return { settled: true, ownership_exact: true };
  if (!signalExactBrokerProcessTreeV01(known, "SIGTERM"))
    return { settled: false, ownership_exact: false };
  const graceful = await waitForExactBrokerProcessTreeExitV01(
    rootPid,
    known,
    options.graceful_timeout_ms,
  );
  if (!graceful.ownership_exact)
    return { settled: false, ownership_exact: false };
  if (graceful.settled) return { settled: true, ownership_exact: true };
  const beforeForced = reobserveExactBrokerProcessTreeV01(rootPid, known);
  if (!beforeForced.exact || !signalExactBrokerProcessTreeV01(known, "SIGKILL"))
    return { settled: false, ownership_exact: false };
  return await waitForExactBrokerProcessTreeExitV01(
    rootPid,
    known,
    options.forced_timeout_ms,
  );
}

function readBrokerProcessSnapshotV01(): Map<
  number,
  BrokerProcessBirthRecordV01
> {
  const observed = spawnSync(
    "/bin/ps",
    ["-axo", "pid=,ppid=,pgid=,state=,lstart=,command="],
    {
      encoding: "utf8",
      timeout: 2_000,
      windowsHide: true,
      env: { ...process.env, LC_ALL: "C", LANG: "C" },
    },
  );
  const snapshot = new Map<number, BrokerProcessBirthRecordV01>();
  if (observed.status !== 0 || typeof observed.stdout !== "string")
    return snapshot;
  for (const line of observed.stdout.split(/\r?\n/u)) {
    const match = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+?)\s*$/u.exec(
      line,
    );
    if (!match) continue;
    snapshot.set(Number(match[1]), {
      pid: Number(match[1]),
      ppid: Number(match[2]),
      pgid: Number(match[3]),
      state: match[4]!,
      started: match[5]!,
      command_fingerprint: createHash("sha256")
        .update(match[6]!)
        .digest("hex"),
    });
  }
  return snapshot;
}

function brokerDescendantsFromSnapshotV01(
  snapshot: Map<number, BrokerProcessBirthRecordV01>,
  root: BrokerProcessBirthRecordV01,
): BrokerProcessBirthRecordV01[] {
  const records = new Map<number, BrokerProcessBirthRecordV01>([
    [root.pid, root],
  ]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of snapshot.values()) {
      if (records.has(candidate.pid) || !records.has(candidate.ppid)) continue;
      records.set(candidate.pid, candidate);
      changed = true;
    }
  }
  return [...records.values()].sort((left, right) => left.pid - right.pid);
}

function sameBrokerProcessBirthV01(
  expected: BrokerProcessBirthRecordV01,
  observed: BrokerProcessBirthRecordV01,
): boolean {
  return (
    expected.pid === observed.pid &&
    expected.pgid === observed.pgid &&
    expected.started === observed.started &&
    (observed.state.startsWith("Z") ||
      expected.command_fingerprint === observed.command_fingerprint)
  );
}

function reobserveExactBrokerProcessTreeV01(
  rootPid: number,
  known: Map<number, BrokerProcessBirthRecordV01>,
): { exact: boolean; alive: boolean } {
  const snapshot = readBrokerProcessSnapshotV01();
  if (snapshot.size === 0) return { exact: false, alive: true };
  for (const expected of known.values()) {
    const observed = snapshot.get(expected.pid);
    if (observed && !sameBrokerProcessBirthV01(expected, observed))
      return { exact: false, alive: true };
  }
  const root = snapshot.get(rootPid);
  if (!root) return { exact: true, alive: false };
  const expectedRoot = known.get(rootPid);
  if (!expectedRoot || !sameBrokerProcessBirthV01(expectedRoot, root))
    return { exact: false, alive: true };
  for (const candidate of brokerDescendantsFromSnapshotV01(snapshot, root)) {
    const prior = known.get(candidate.pid);
    if (prior && !sameBrokerProcessBirthV01(prior, candidate))
      return { exact: false, alive: true };
    if (!prior) known.set(candidate.pid, candidate);
  }
  return {
    exact: true,
    alive: [...known.values()].some((entry) => {
      const current = snapshot.get(entry.pid);
      return current
        ? !current.state.startsWith("Z") &&
            sameBrokerProcessBirthV01(entry, current)
        : false;
    }),
  };
}

function signalExactBrokerProcessTreeV01(
  known: Map<number, BrokerProcessBirthRecordV01>,
  signal: NodeJS.Signals,
): boolean {
  for (const expected of [...known.values()].sort(
    (left, right) => right.pid - left.pid,
  )) {
    const observed = readBrokerProcessSnapshotV01().get(expected.pid);
    if (!observed) continue;
    if (!sameBrokerProcessBirthV01(expected, observed)) return false;
    try {
      process.kill(expected.pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") return false;
    }
  }
  return true;
}

async function waitForExactBrokerProcessTreeExitV01(
  rootPid: number,
  known: Map<number, BrokerProcessBirthRecordV01>,
  timeoutMs: number,
): Promise<BrokerOwnedProcessTreeStopResultV01> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = reobserveExactBrokerProcessTreeV01(rootPid, known);
    if (!current.exact)
      return { settled: false, ownership_exact: false };
    if (!current.alive) return { settled: true, ownership_exact: true };
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  const current = reobserveExactBrokerProcessTreeV01(rootPid, known);
  return {
    settled: current.exact && !current.alive,
    ownership_exact: current.exact,
  };
}

function sourceOwnedBrokerV01(
  broker: CodexCredentialBrokerV01,
): CodexCredentialBrokerV01 {
  SOURCE_OWNED_BROKERS_V01.add(broker);
  return Object.freeze(broker);
}

function deepFreezeV01<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entry of Object.values(value as Record<string, unknown>))
      deepFreezeV01(entry);
    Object.freeze(value);
  }
  return value;
}

export function credentialBrokerBindingFingerprintV01(
  binding: CodexCredentialBrokerBindingV01,
): string {
  for (const value of [
    binding.broker_executable_fingerprint,
    binding.broker_locator_fingerprint,
  ])
    requiredSha256V01(value);
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_credential_broker_binding.v0.1",
      ...binding,
    }),
  );
}

function createCredentialAttestationFromStorageV01(input: {
  binding: CodexCredentialBrokerBindingV01;
  input: ProvisionCodexCredentialAttestationInputV01;
  resolved: ResolvedCodexAuthStorageV01 & {
    agent_identity_task_registration_state: "present";
  };
}): CodexIsolatedAuthCredentialAttestationV01 {
  const identity = input.resolved.identity;
  const claims = input.resolved.jwt_claims;
  const requestedExpiry = Date.parse(input.input.expires_at);
  if (
    !Number.isFinite(requestedExpiry) ||
    (claims !== null &&
      requestedExpiry >
        (claims.exp - CREDENTIAL_EXPIRY_SAFETY_MARGIN_SECONDS_V01) * 1000)
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_projection_expiry_exceeds_credential",
    );
  const generationFingerprint = fingerprintCredentialSourceGenerationV01({
    auth_handle_external_id: input.binding.auth_handle_ref.external_id,
    broker_locator_fingerprint: input.binding.broker_locator_fingerprint,
    material: input.resolved.source_material,
  });
  const claimFingerprint = (domain: string, value: unknown): string =>
    createProtocolSha256V01(canonicalizeProtocolValueV01({ domain, value }));
  const material = {
    attestation_version: CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01,
    attestation_id: requiredBoundedIdV01(input.input.attestation_id),
    provisioning_binding_ref: input.input.provisioning_binding_ref,
    semantic_profile_version: input.input.semantic_profile_version,
    semantic_profile_fingerprint: requiredSha256V01(
      input.input.semantic_profile_fingerprint,
    ),
    auth_handle_ref: input.binding.auth_handle_ref,
    broker_locator_fingerprint: input.binding.broker_locator_fingerprint,
    auth_generation_fingerprint: generationFingerprint,
    auth_storage_contract_version:
      CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01,
    source_auth_mode: input.resolved.source_auth_mode,
    agent_identity_storage_kind:
      input.resolved.agent_identity_storage_kind,
    managed_chatgpt_binding_verified:
      input.resolved.managed_chatgpt_binding_verified,
    agent_identity_task_registration_state:
      input.resolved.agent_identity_task_registration_state,
    account_identity_fingerprint: accountIdentityFingerprintV01(identity),
    account_read_email_fingerprint: optionalPrivateClaimFingerprintV01(
      "codex-agent-identity-account-read-email-v01",
      identity.email,
    ),
    agent_identity_runtime_fingerprint: claimFingerprint(
      "codex-agent-identity-runtime-v01",
      identity.agent_runtime_id,
    ),
    provider_environment_fingerprint: claimFingerprint(
      "codex-agent-identity-provider-environment-v01",
      {
        provider: "openai",
        auth_mode: "agent_identity",
        issuer: CODEX_AGENT_IDENTITY_ISSUER_V01,
      },
    ),
    plan_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-plan-v01",
      identity.plan_type,
    ),
    fedramp_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-fedramp-v01",
      identity.chatgpt_account_is_fedramp,
    ),
    issuer_projection_fingerprint:
      claims === null
        ? null
        : claimFingerprint("codex-agent-identity-issuer-v01", claims.iss),
    audience_projection_fingerprint:
      claims === null
        ? null
        : claimFingerprint("codex-agent-identity-audience-v01", claims.aud),
    validity_projection_fingerprint:
      claims === null
        ? null
        : claimFingerprint("codex-agent-identity-validity-v01", {
            iat: claims.iat,
            exp: claims.exp,
          }),
    source_not_before_epoch_seconds: claims?.iat ?? null,
    source_expires_at_epoch_seconds: claims?.exp ?? null,
    source_expiry_safety_margin_seconds:
      claims === null ? null : CREDENTIAL_EXPIRY_SAFETY_MARGIN_SECONDS_V01,
    claims_authentication_status:
      "stored_agent_identity_unverified_before_codex_auth",
    issued_at: input.input.issued_at,
    expires_at: input.input.expires_at,
  } as const;
  return { ...material, integrity: integrityV01(material) };
}

interface AgentIdentityClaimsV01 extends Record<string, unknown> {
  iss: typeof CODEX_AGENT_IDENTITY_ISSUER_V01;
  aud: typeof CODEX_AGENT_IDENTITY_AUDIENCE_V01;
  iat: number;
  exp: number;
  agent_runtime_id: string;
  agent_private_key: string;
  account_id: string;
  chatgpt_user_id: string;
  email?: string;
  plan_type: string;
  chatgpt_account_is_fedramp: boolean;
}

/**
 * Parse the exact rust-v0.150.1 AuthDotJson storage envelope. Augnes never
 * treats the Keychain value itself as an Agent Identity JWT. Managed ChatGPT
 * auth may reuse only an official AgentIdentityAuthRecord whose account/user
 * binding matches the token snapshot; absent that Record, the official
 * AuthManager ChatGptAuth bootstrap remains the owner and Augnes reports the
 * separate prerequisite instead of minting identity material.
 */
function resolveCodexAuthStorageV01(
  material: string,
  observedAt: string,
): ResolvedCodexAuthStorageV01 {
  try {
    if (!boundedCodexAuthStorageMaterialV01(material)) throw new Error("invalid");
    const parsed = JSON.parse(material) as unknown;
    if (
      !isPlainObjectV01(parsed) ||
      !exactKeysAllowOptionalV01(
        parsed,
        [],
        [
          "auth_mode",
          "OPENAI_API_KEY",
          "tokens",
          "last_refresh",
          "agent_identity",
          "personal_access_token",
          "bedrock_api_key",
          "bedrock_access_keys",
        ],
      )
    )
      throw new Error("invalid");
    const authMode = resolvedCodexAuthModeV01(parsed);
    if (authMode !== "agentIdentity" && authMode !== "chatgpt") {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_material_invalid",
      );
    }
    if (
      (parsed.OPENAI_API_KEY !== undefined && parsed.OPENAI_API_KEY !== null) ||
      (parsed.personal_access_token !== undefined &&
        parsed.personal_access_token !== null) ||
      (parsed.bedrock_api_key !== undefined && parsed.bedrock_api_key !== null) ||
      (parsed.bedrock_access_keys !== undefined &&
        parsed.bedrock_access_keys !== null)
    )
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_material_invalid",
      );

    if (authMode === "chatgpt") {
      const binding = managedChatGptBindingV01(parsed.tokens);
      if (!isPlainObjectV01(parsed.agent_identity))
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_agent_identity_bootstrap_required",
        );
      const record = agentIdentityRecordV01(parsed.agent_identity);
      if (
        record.account_id !== binding.account_id ||
        record.chatgpt_user_id !== binding.chatgpt_user_id
      )
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_account_identity_missing",
        );
      return resolvedRecordStorageV01({
        source_material: material,
        source_auth_mode: "chatgpt",
        record,
        managed_chatgpt_binding_verified: true,
      });
    }

    if (typeof parsed.agent_identity === "string") {
      const claims = decodeAgentIdentityJwtClaimsV01(
        parsed.agent_identity,
        observedAt,
      );
      return {
        source_material: material,
        source_auth_mode: "agentIdentity",
        agent_identity_storage_kind: "jwt",
        managed_chatgpt_binding_verified: false,
        agent_identity_task_registration_state: "required",
        identity: claims,
        jwt_claims: claims,
        launch_auth_dot_json: minimalAgentIdentityAuthDotJsonV01(
          parsed.agent_identity,
        ),
      };
    }
    if (isPlainObjectV01(parsed.agent_identity)) {
      return resolvedRecordStorageV01({
        source_material: material,
        source_auth_mode: "agentIdentity",
        record: agentIdentityRecordV01(parsed.agent_identity),
        managed_chatgpt_binding_verified: false,
      });
    }
    throw new Error("invalid");
  } catch (error) {
    if (error instanceof CodexCredentialBrokerErrorV01) throw error;
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_material_invalid",
    );
  }
}

function resolvedCodexAuthModeV01(
  value: Record<string, unknown>,
): string {
  if (typeof value.auth_mode === "string") return value.auth_mode;
  if (value.personal_access_token !== undefined && value.personal_access_token !== null)
    return "personalAccessToken";
  if (value.bedrock_api_key !== undefined && value.bedrock_api_key !== null)
    return "bedrockApiKey";
  if (value.bedrock_access_keys !== undefined && value.bedrock_access_keys !== null)
    return "bedrockAccessKeys";
  if (value.OPENAI_API_KEY !== undefined && value.OPENAI_API_KEY !== null)
    return "apikey";
  return "chatgpt";
}

function resolvedRecordStorageV01(input: {
  source_material: string;
  source_auth_mode: "agentIdentity" | "chatgpt";
  record: AgentIdentityRecordV01;
  managed_chatgpt_binding_verified: boolean;
}): ResolvedCodexAuthStorageV01 {
  const taskId = boundedPrivateClaimV01(input.record.task_id);
  return {
    source_material: input.source_material,
    source_auth_mode: input.source_auth_mode,
    agent_identity_storage_kind: "record",
    managed_chatgpt_binding_verified:
      input.managed_chatgpt_binding_verified,
    agent_identity_task_registration_state:
      taskId === null ? "required" : "present",
    identity: input.record,
    jwt_claims: null,
    launch_auth_dot_json: minimalAgentIdentityAuthDotJsonV01(input.record),
  };
}

function assertAgentIdentityReadyWithoutBootstrapV01(
  resolved: ResolvedCodexAuthStorageV01,
): asserts resolved is ResolvedCodexAuthStorageV01 & {
  agent_identity_task_registration_state: "present";
} {
  if (resolved.agent_identity_task_registration_state !== "present")
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_agent_identity_task_registration_required",
    );
}

function minimalAgentIdentityAuthDotJsonV01(
  identity: string | AgentIdentityRecordV01,
): string {
  return JSON.stringify({
    auth_mode: "agentIdentity",
    OPENAI_API_KEY: null,
    tokens: null,
    last_refresh: null,
    agent_identity: identity,
    personal_access_token: null,
    bedrock_api_key: null,
    bedrock_access_keys: null,
  });
}

function agentIdentityRecordV01(
  value: Record<string, unknown>,
): AgentIdentityRecordV01 {
  if (
    !exactKeysAllowOptionalV01(
      value,
      [
        "agent_runtime_id",
        "agent_private_key",
        "account_id",
        "chatgpt_user_id",
        "plan_type",
        "chatgpt_account_is_fedramp",
      ],
      ["email", "task_id"],
    ) ||
    !boundedClaimStringV01(value.agent_runtime_id, 1, 512) ||
    !boundedAgentPrivateKeyV01(value.agent_private_key) ||
    !boundedClaimStringV01(value.account_id, 1, 512) ||
    !boundedClaimStringV01(value.chatgpt_user_id, 1, 512) ||
    !boundedClaimStringV01(value.plan_type, 1, 128) ||
    typeof value.chatgpt_account_is_fedramp !== "boolean" ||
    (value.email !== undefined &&
      value.email !== "" &&
      !boundedClaimStringV01(value.email, 1, 320)) ||
    (value.task_id !== undefined &&
      value.task_id !== null &&
      value.task_id !== "" &&
      !boundedClaimStringV01(value.task_id, 1, 512))
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_material_invalid",
    );
  return {
    agent_runtime_id: value.agent_runtime_id,
    agent_private_key: value.agent_private_key,
    account_id: value.account_id,
    chatgpt_user_id: value.chatgpt_user_id,
    ...(typeof value.email === "string" && value.email.length > 0
      ? { email: value.email }
      : {}),
    plan_type: value.plan_type,
    chatgpt_account_is_fedramp: value.chatgpt_account_is_fedramp,
    ...(typeof value.task_id === "string" && value.task_id.length > 0
      ? { task_id: value.task_id }
      : {}),
  };
}

function managedChatGptBindingV01(value: unknown): {
  account_id: string;
  chatgpt_user_id: string;
} {
  if (
    !isPlainObjectV01(value) ||
    !exactKeysAllowOptionalV01(
      value,
      ["id_token", "access_token", "refresh_token", "account_id"],
      [],
    ) ||
    !boundedClaimStringV01(value.id_token, 16, 32_768) ||
    !boundedClaimStringV01(value.access_token, 16, 32_768) ||
    /^(?:sk-|at-)/u.test(value.access_token) ||
    typeof value.refresh_token !== "string" ||
    value.refresh_token.length > 32_768 ||
    !basicJwtEnvelopeV01(value.id_token)
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_material_invalid",
    );
  try {
    const payload = JSON.parse(
      Buffer.from(value.id_token.split(".")[1]!, "base64url").toString("utf8"),
    ) as unknown;
    const auth = isPlainObjectV01(payload)
      ? payload["https://api.openai.com/auth"]
      : null;
    if (!isPlainObjectV01(auth)) throw new Error("invalid");
    const accountId =
      boundedPrivateClaimV01(value.account_id) ??
      boundedPrivateClaimV01(auth.chatgpt_account_id);
    const userId =
      boundedPrivateClaimV01(auth.chatgpt_user_id) ??
      boundedPrivateClaimV01(auth.user_id);
    if (!accountId || !userId) throw new Error("invalid");
    return { account_id: accountId, chatgpt_user_id: userId };
  } catch {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_account_identity_missing",
    );
  }
}

function boundedCodexAuthStorageMaterialV01(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length >= 2 &&
    Buffer.byteLength(value, "utf8") <= MAX_BROKER_OUTPUT_BYTES_V01 &&
    !value.includes("\u0000")
  );
}

function decodeAgentIdentityJwtClaimsV01(
  material: string,
  observedAt: string,
): AgentIdentityClaimsV01 {
  try {
    if (!basicJwtEnvelopeV01(material)) throw new Error("invalid");
    const [encodedHeader, encodedPayload] = material.split(".");
    const header = JSON.parse(
      Buffer.from(encodedHeader!, "base64url").toString("utf8"),
    ) as unknown;
    const payload = JSON.parse(
      Buffer.from(encodedPayload!, "base64url").toString("utf8"),
    ) as unknown;
    if (
      !isPlainObjectV01(header) ||
      !exactKeysAllowOptionalV01(header, ["alg", "kid"], ["typ"]) ||
      header.alg !== "RS256" ||
      !boundedClaimStringV01(header.kid, 1, 256) ||
      (header.typ !== undefined && header.typ !== "JWT") ||
      !isPlainObjectV01(payload) ||
      !exactKeysAllowOptionalV01(
        payload,
        [
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
        ["email"],
      ) ||
      payload.iss !== CODEX_AGENT_IDENTITY_ISSUER_V01 ||
      payload.aud !== CODEX_AGENT_IDENTITY_AUDIENCE_V01 ||
      !Number.isSafeInteger(payload.iat) ||
      !Number.isSafeInteger(payload.exp) ||
      (payload.iat as number) < 0 ||
      (payload.exp as number) <= (payload.iat as number) ||
      !boundedClaimStringV01(payload.agent_runtime_id, 1, 512) ||
      !boundedAgentPrivateKeyV01(payload.agent_private_key) ||
      !boundedClaimStringV01(payload.account_id, 1, 512) ||
      !boundedClaimStringV01(payload.chatgpt_user_id, 1, 512) ||
      (payload.email !== undefined &&
        !boundedClaimStringV01(payload.email, 1, 320)) ||
      !boundedClaimStringV01(payload.plan_type, 1, 128) ||
      typeof payload.chatgpt_account_is_fedramp !== "boolean"
    )
      throw new Error("invalid");
    const observedEpoch = Date.parse(observedAt) / 1000;
    if (
      !Number.isFinite(observedEpoch) ||
      (payload.iat as number) > observedEpoch + 300 ||
      (payload.exp as number) <= observedEpoch
    )
      throw new CodexCredentialBrokerErrorV01(
        (payload.exp as number) <= observedEpoch
          ? "codex_auth_broker_credential_expired"
          : "codex_auth_broker_credential_not_yet_valid",
      );
    accountIdentityFingerprintV01(payload);
    return payload as AgentIdentityClaimsV01;
  } catch (error) {
    if (error instanceof CodexCredentialBrokerErrorV01) throw error;
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_material_invalid",
    );
  }
}

function accountIdentityFingerprintV01(
  claims: Record<string, unknown>,
): string {
  const accountId = boundedPrivateClaimV01(claims.account_id);
  const userId = boundedPrivateClaimV01(claims.chatgpt_user_id);
  if (!accountId || !userId) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_account_identity_missing",
    );
  }
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      domain: "codex-agent-identity-account-v01",
      account_id: accountId,
      chatgpt_user_id: userId,
    }),
  );
}

function boundedPrivateClaimV01(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 512
    ? value
    : null;
}

function boundedClaimStringV01(
  value: unknown,
  min: number,
  max: number,
): value is string {
  return (
    typeof value === "string" &&
    value.length >= min &&
    value.length <= max &&
    !/[\u0000\r\n]/u.test(value)
  );
}

function boundedAgentPrivateKeyV01(value: unknown): value is string {
  return (
    boundedClaimStringV01(value, 32, 16_384) &&
    /^[A-Za-z0-9+/]+={0,2}$/u.test(value)
  );
}

function exactKeysAllowOptionalV01(
  value: Record<string, unknown>,
  required: string[],
  optional: string[],
): boolean {
  const keys = Object.keys(value).sort();
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function optionalPrivateClaimFingerprintV01(
  domain: string,
  value: unknown,
): string | null {
  const claim = boundedPrivateClaimV01(value);
  return claim === null
    ? null
    : createProtocolSha256V01(
        canonicalizeProtocolValueV01({ domain, value: claim }),
      );
}

function assertExactSpawnBindingV01(
  binding: CodexCredentialBrokerBindingV01,
  input: PrivateSpawnExactCodexAppServerInputV01,
): void {
  if (
    credentialBrokerBindingFingerprintV01(binding) !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          version: "codex_credential_broker_binding.v0.1",
          auth_handle_ref: input.projection.auth_handle_ref,
          broker_backend_ref: input.projection.broker_backend_ref,
          broker_executable_ref: input.projection.broker_executable_ref,
          broker_executable_fingerprint:
            input.projection.broker_executable_fingerprint,
          broker_locator_fingerprint:
            input.projection.broker_locator_fingerprint,
        }),
      ) ||
    input.credential_attestation.integrity.fingerprint !==
      input.projection.auth_attestation_fingerprint ||
    input.credential_attestation.auth_generation_fingerprint !==
      input.projection.auth_source_generation_fingerprint ||
    input.launch_shape_fingerprint !==
      input.projection.app_server_launch_shape_fingerprint ||
    !exactDerivedAppServerArgsV01(input.args) ||
    Object.hasOwn(input.launch_environment, "CODEX_ACCESS_TOKEN") ||
    Object.hasOwn(input.launch_environment.test_controls, "CODEX_ACCESS_TOKEN")
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_spawn_binding_mismatch",
    );
  }
  const environmentKeys = [
    ...Object.keys(input.launch_environment).filter(
      (key) => key !== "test_controls",
    ),
    ...Object.keys(input.launch_environment.test_controls),
  ];
  if (
    environmentKeys.some(
      (key) => !EXACT_APP_SERVER_ENVIRONMENT_KEYS_V01.has(key),
    ) ||
    ["HOME", "CODEX_HOME", "CODEX_SQLITE_HOME", "TMPDIR"].some(
      (key) =>
        typeof input.launch_environment[
          key as "HOME" | "CODEX_HOME" | "CODEX_SQLITE_HOME" | "TMPDIR"
        ] !== "string" ||
        !path.isAbsolute(
          input.launch_environment[
            key as "HOME" | "CODEX_HOME" | "CODEX_SQLITE_HOME" | "TMPDIR"
          ],
        ),
    )
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_spawn_environment_refused",
    );
  }
  const executableStat = lstatSync(input.command);
  if (
    !executableStat.isFile() ||
    executableStat.isSymbolicLink() ||
    sha256FileV01(input.command) !==
      input.projection.codex_executable_fingerprint
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_executable_substituted",
    );
  }
  assertPrivateLaunchIdentitiesV01(input);
}

function exactDerivedAppServerArgsV01(args: string[]): boolean {
  const terminal = ["app-server", "--stdio"];
  if (args.at(-2) !== terminal[0] || args.at(-1) !== terminal[1]) return false;
  const configStart = args.length - terminal.length - CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01.length;
  if (configStart < 0) return false;
  return CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01.every(
    (value, index) => args[configStart + index] === value,
  );
}

function exactLaunchExecutableV01(value: string, fingerprint: string): string {
  try {
    if (!path.isAbsolute(value) || realpathSync(value) !== value) throw new Error();
    const stat = lstatSync(value);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      sha256FileV01(value) !== fingerprint
    )
      throw new Error();
    return value;
  } catch {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_executable_substituted",
    );
  }
}

function exactTestPrefixArgsV01(values: string[]): string[] {
  if (values.length === 0) return [];
  if (
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1" ||
    values.length !== 1 ||
    !path.isAbsolute(values[0]!) ||
    realpathSync(values[0]!) !== values[0] ||
    lstatSync(values[0]!).isSymbolicLink() ||
    !lstatSync(values[0]!).isFile() ||
    path.basename(values[0]!) !== "fake-codex-app-server.mjs"
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_test_prefix_refused",
    );
  return [...values];
}

function exactLaunchDirectoryIdentityV01(
  value: string,
  code: string,
): ExactLaunchDirectoryIdentityV01 {
  try {
    if (!path.isAbsolute(value) || realpathSync(value) !== value) throw new Error();
    const stat = lstatSync(value, { bigint: true });
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (stat.mode & BigInt(0o077)) !== BigInt(0)
    )
      throw new Error();
    return { path: value, device: stat.dev, inode: stat.ino };
  } catch {
    throw new CodexCredentialBrokerErrorV01(code);
  }
}

function exactLaunchStateDirectoryV01(
  root: string,
  value: string,
): ExactLaunchDirectoryIdentityV01 {
  const identity = exactLaunchDirectoryIdentityV01(
    value,
    "codex_auth_broker_spawn_environment_refused",
  );
  if (
    path.dirname(identity.path) !== root ||
    readdirSync(identity.path).length !== 0
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_spawn_environment_refused",
    );
  return identity;
}

function launchDirectoryFingerprintV01(
  identity: ExactLaunchDirectoryIdentityV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_isolated_launch_directory_identity.v0.1",
      role: path.basename(identity.path),
      device: String(identity.device),
      inode: String(identity.inode),
    }),
  );
}

function assertExactLaunchDirectoryIdentityV01(
  identity: ExactLaunchDirectoryIdentityV01,
): void {
  const observed = exactLaunchDirectoryIdentityV01(
    identity.path,
    "codex_auth_broker_spawn_environment_refused",
  );
  if (
    observed.device !== identity.device ||
    observed.inode !== identity.inode
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_spawn_environment_refused",
    );
}

function assertPrivateLaunchIdentitiesV01(
  input: PrivateSpawnExactCodexAppServerInputV01,
): void {
  if (realpathSync(input.state_root) !== input.state_root)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_spawn_environment_refused",
    );
  for (const identity of Object.values(input.state_identities)) {
    assertExactLaunchDirectoryIdentityV01(identity);
    if (
      path.dirname(identity.path) !== input.state_root ||
      readdirSync(identity.path).length !== 0
    )
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_spawn_environment_refused",
      );
  }
  assertExactLaunchDirectoryIdentityV01(input.repository_identity);
  if (input.cwd !== input.repository_identity.path)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_repository_root_refused",
    );
}

function exactPrivateLaunchEnvironmentV01(input: {
  base: BindCodexBrokerPrivateLaunchCapabilityInputV01["base_environment"];
  test_controls: Record<string, string | undefined>;
  state: Record<"HOME" | "CODEX_HOME" | "CODEX_SQLITE_HOME" | "TMPDIR", ExactLaunchDirectoryIdentityV01>;
}): PrivateSpawnExactCodexAppServerInputV01["launch_environment"] {
  const testKeys = Object.keys(input.test_controls);
  if (
    testKeys.some((key) => !EXACT_APP_SERVER_ENVIRONMENT_KEYS_V01.has(key)) ||
    (testKeys.length > 0 &&
      (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1" ||
        input.test_controls.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1"))
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_spawn_environment_refused",
    );
  return {
    ...input.base,
    HOME: input.state.HOME.path,
    CODEX_HOME: input.state.CODEX_HOME.path,
    CODEX_SQLITE_HOME: input.state.CODEX_SQLITE_HOME.path,
    TMPDIR: input.state.TMPDIR.path,
    test_controls: { ...input.test_controls },
  };
}

function writePrivateAuthSnapshotV01(input: {
  codex_home: ExactLaunchDirectoryIdentityV01;
  serialized_auth_dot_json: string;
}): ExactPrivateAuthSnapshotIdentityV01 {
  assertExactLaunchDirectoryIdentityV01(input.codex_home);
  const snapshotPath = path.join(input.codex_home.path, "auth.json");
  if (
    existsSync(snapshotPath) ||
    !boundedCodexAuthStorageMaterialV01(input.serialized_auth_dot_json)
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_auth_snapshot_refused",
    );
  const bytes = Buffer.from(input.serialized_auth_dot_json, "utf8");
  let fd: number | null = null;
  try {
    fd = openSync(snapshotPath, "wx", 0o600);
    writeFileSync(fd, bytes);
    fsyncSync(fd);
    const stat = fstatSync(fd, { bigint: true });
    if (
      !stat.isFile() ||
      (stat.mode & BigInt(0o077)) !== BigInt(0)
    )
      throw new Error("invalid");
    return {
      path: snapshotPath,
      parent_path: input.codex_home.path,
      device: stat.dev,
      inode: stat.ino,
    };
  } catch {
    if (existsSync(snapshotPath)) unlinkSync(snapshotPath);
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_auth_snapshot_refused",
    );
  } finally {
    bytes.fill(0);
    if (fd !== null) closeSync(fd);
  }
}

function settlePrivateAuthSnapshotV01(
  snapshot: ExactPrivateAuthSnapshotIdentityV01,
): void {
  try {
    assertPrivateAuthSnapshotIdentityV01(snapshot);
    unlinkSync(snapshot.path);
    if (existsSync(snapshot.path)) throw new Error("invalid");
  } catch {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_auth_snapshot_cleanup_failed",
    );
  }
}

function assertPrivateAuthSnapshotIdentityV01(
  snapshot: ExactPrivateAuthSnapshotIdentityV01,
): void {
  if (
    path.dirname(snapshot.path) !== snapshot.parent_path ||
    path.basename(snapshot.path) !== "auth.json" ||
    realpathSync(snapshot.parent_path) !== snapshot.parent_path
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_auth_snapshot_substituted",
    );
  const stat = lstatSync(snapshot.path, { bigint: true });
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.dev !== snapshot.device ||
    stat.ino !== snapshot.inode ||
    (stat.mode & BigInt(0o077)) !== BigInt(0)
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_private_auth_snapshot_substituted",
    );
}

async function waitForChildSpawnV01(
  child: ChildProcessWithoutNullStreams,
): Promise<void> {
  if (child.pid !== undefined) return;
  await new Promise<void>((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", () =>
      reject(
        new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_child_spawn_failed",
        ),
      ),
    );
  });
}

function requiredBoundedIdV01(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(value)) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_attestation_id_invalid",
    );
  }
  return value;
}

function requiredSha256V01(value: string): string {
  if (!/^sha256:[a-f0-9]{64}$/u.test(value)) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_fingerprint_invalid",
    );
  }
  return value;
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

export function fingerprintBrokerLocatorV01(input: {
  backend: "macos_keychain_generic_password";
  source_codex_home: string;
  keychain_path: string;
}): string {
  const sourceCodexHome = exactPrivateCodexHomeV01(input.source_codex_home);
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_auth_broker_locator.v0.2",
      backend: input.backend,
      service_name: CODEX_AUTH_KEYRING_SERVICE_V01,
      account_name: codexAuthKeyringAccountForHomeV01(sourceCodexHome),
      source_codex_home_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(sourceCodexHome),
      ),
      keychain_path_fingerprint: createProtocolSha256V01(
        requiredPrivateAbsolutePathV01(input.keychain_path),
      ),
    }),
  );
}

export function codexAuthKeyringAccountForHomeV01(
  sourceCodexHome: string,
): string {
  const canonical = exactPrivateCodexHomeV01(sourceCodexHome);
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  return `cli|${digest.slice(0, 16)}`;
}

/**
 * Bind the exact opaque handle location to the credential bytes without
 * retaining those bytes. The value is an opaque high-entropy generation
 * identity; the broker recomputes it after exact lookup and before spawn.
 */
function fingerprintCredentialSourceGenerationV01(input: {
  auth_handle_external_id: string;
  broker_locator_fingerprint: string;
  material: string;
}): string {
  if (!boundedCodexAuthStorageMaterialV01(input.material)) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_material_invalid",
    );
  }
  if (!/^sha256:[a-f0-9]{64}$/u.test(input.broker_locator_fingerprint)) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_locator_mismatch",
    );
  }
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_auth_source_generation.v0.1",
      auth_handle_external_id: input.auth_handle_external_id,
      broker_locator_fingerprint: input.broker_locator_fingerprint,
      material: input.material,
    }),
  );
}

function basicJwtEnvelopeV01(value: string): boolean {
  if (
    typeof value !== "string" ||
    value.length < 64 ||
    value.length > 16_384 ||
    /[\u0000\s]/u.test(value) ||
    value.startsWith("at-")
  ) {
    return false;
  }
  const segments = value.split(".");
  if (
    segments.length !== 3 ||
    segments.some(
      (segment) =>
        segment.length < 2 ||
        segment.length > 8_192 ||
        !/^[A-Za-z0-9_-]+$/u.test(segment),
    )
  ) {
    return false;
  }
  return true;
}

/**
 * Detect credential-shaped material even when a caller prefixes or suffixes
 * it inside an otherwise syntactically valid identifier or locator.
 */
export function containsCodexCredentialSecretShapeV01(value: string): boolean {
  if (
    /(?:^|[^A-Za-z0-9])at-[A-Za-z0-9_-]{16,}/u.test(value) ||
    /(?:sk-(?:proj-)?|xoxb-|AKIA[A-Z0-9]{16}|BEGIN(?: [A-Z]+)? PRIVATE KEY)/u.test(
      value,
    )
  ) {
    return true;
  }
  const candidate = value.match(
    /eyJ[A-Za-z0-9_-]{2,8192}\.[A-Za-z0-9_-]{2,8192}\.[A-Za-z0-9_-]{8,8192}/u,
  )?.[0];
  return candidate ? basicJwtEnvelopeV01(candidate) : false;
}

function assertCredentialStorageValidAtSpawnV01(
  resolved: ResolvedCodexAuthStorageV01,
  attestation: CodexIsolatedAuthCredentialAttestationV01,
  now: number,
): void {
  if (
    attestation.auth_storage_contract_version !==
      CODEX_AUTH_DOT_JSON_STORAGE_CONTRACT_VERSION_V01 ||
    attestation.source_auth_mode !== resolved.source_auth_mode ||
    attestation.agent_identity_storage_kind !==
      resolved.agent_identity_storage_kind ||
    attestation.managed_chatgpt_binding_verified !==
      resolved.managed_chatgpt_binding_verified ||
    attestation.agent_identity_task_registration_state !==
      resolved.agent_identity_task_registration_state
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_credential_validity_mismatch",
    );
  const claims = resolved.jwt_claims;
  if (claims === null) {
    if (
      attestation.source_not_before_epoch_seconds !== null ||
      attestation.source_expires_at_epoch_seconds !== null ||
      attestation.source_expiry_safety_margin_seconds !== null
    )
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_credential_validity_mismatch",
      );
    return;
  }
  if (
    claims.iat !== attestation.source_not_before_epoch_seconds ||
    claims.exp !== attestation.source_expires_at_epoch_seconds ||
    claims.iat > now + 300 ||
    claims.exp <= now
  )
    throw new CodexCredentialBrokerErrorV01(
      claims.exp <= now
        ? "codex_auth_broker_credential_expired"
        : "codex_auth_broker_credential_validity_mismatch",
    );
}

function isPlainObjectV01(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * All projections over the same exact handle generation contend on one lease,
 * independent of unrelated projection fields or attempt identity.
 */
export function credentialLeaseIdentityFingerprintV01(
  projection: CodexIsolatedAuthProjectionV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_auth_broker_lease_identity.v0.1",
      auth_handle_ref: projection.auth_handle_ref,
      auth_source_generation_fingerprint:
        projection.auth_source_generation_fingerprint,
    }),
  );
}

async function readExactMacOsKeychainItemV01(input: {
  executable: string;
  service_name: string;
  account_name: string;
  keychain_path: string;
  timeout_ms: number;
}): Promise<string> {
  if (!Number.isSafeInteger(input.timeout_ms) || input.timeout_ms <= 0)
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_timeout_invalid",
    );
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(
      input.executable,
      [
        "find-generic-password",
        "-s",
        input.service_name,
        "-a",
        input.account_name,
        "-w",
        input.keychain_path,
      ],
      {
        shell: false,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          NODE_ENV: "production",
          PATH: "/usr/bin:/bin",
        },
      },
    );
    child.stdin.end();
    const stdout: Buffer[] = [];
    let stdoutBytes = 0;
    let settled = false;
    let pendingError: CodexCredentialBrokerErrorV01 | null = null;
    const finish = (error: CodexCredentialBrokerErrorV01 | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      for (const chunk of stdout) chunk.fill(0);
      if (error) reject(error);
    };
    const timer = setTimeout(() => {
      pendingError = new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_timeout",
      );
      child.kill("SIGKILL");
    }, input.timeout_ms);
    timer.unref();
    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength;
      if (stdoutBytes > MAX_BROKER_OUTPUT_BYTES_V01) {
        pendingError = new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_output_bound_exceeded",
        );
        child.kill("SIGKILL");
        return;
      }
      stdout.push(Buffer.from(chunk));
    });
    // Drain but never retain keychain diagnostics.
    child.stderr.on("data", () => undefined);
    child.once("error", () => {
      pendingError ??= new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_spawn_failed",
      );
    });
    child.once("close", (code) => {
      if (settled) return;
      if (pendingError) {
        finish(pendingError);
        return;
      }
      if (code !== 0) {
        finish(
          new CodexCredentialBrokerErrorV01("codex_auth_broker_lookup_failed"),
        );
        return;
      }
      const materialBuffer = Buffer.concat(stdout);
      const material = materialBuffer.toString("utf8").trim();
      materialBuffer.fill(0);
      settled = true;
      clearTimeout(timer);
      for (const chunk of stdout) chunk.fill(0);
      resolve(material);
    });
  });
}

/** Test-only proof surface for the purpose-specific Keychain timeout. */
export function macOsKeychainReadTimeoutContractForTestV01(): Readonly<{
  macos_keychain_read_timeout_ms: number;
  child_rollback_timeout_ms: number;
}> {
  assertMacOsKeychainReadTestModeV01();
  return Object.freeze({
    macos_keychain_read_timeout_ms: MACOS_KEYCHAIN_READ_TIMEOUT_MS_V01,
    child_rollback_timeout_ms: CHILD_ROLLBACK_TIMEOUT_MS_V01,
  });
}

/**
 * Test-only lifecycle observation over a synthetic executable. It returns no
 * credential material and refuses the real macOS Keychain executable.
 */
export async function observeMacOsKeychainReadForTestV01(input: {
  executable: string;
  keychain_path: string;
  timeout_ms: number;
}): Promise<
  Readonly<{
    state: "completed" | "failed_closed";
    error_code: string | null;
    material_returned_internally: boolean;
  }>
> {
  assertMacOsKeychainReadTestModeV01();
  if (
    !path.isAbsolute(input.executable) ||
    !path.isAbsolute(input.keychain_path) ||
    realpathSync(input.executable) === MACOS_SECURITY_PATH_V01 ||
    !Number.isSafeInteger(input.timeout_ms) ||
    input.timeout_ms <= 0 ||
    input.timeout_ms > 1_000
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_keychain_read_test_invalid",
    );
  try {
    const material = await readExactMacOsKeychainItemV01({
      executable: input.executable,
      service_name: "Augnes Synthetic Keychain Read Test",
      account_name: "synthetic-test-account",
      keychain_path: input.keychain_path,
      timeout_ms: input.timeout_ms,
    });
    return Object.freeze({
      state: "completed",
      error_code: null,
      material_returned_internally: material.length > 0,
    });
  } catch (error) {
    if (!(error instanceof CodexCredentialBrokerErrorV01)) throw error;
    return Object.freeze({
      state: "failed_closed",
      error_code: error.code,
      material_returned_internally: false,
    });
  }
}

function assertMacOsKeychainReadTestModeV01(): void {
  if (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1")
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_keychain_read_test_forbidden",
    );
}

function releaseLeaseV01(lease: BrokerLeaseV01): void {
  try {
    assertLeaseIdentityV01(lease);
    unlinkSync(lease.path);
    if (existsSync(lease.path)) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_substituted",
      );
    }
  } finally {
    closeSync(lease.fd);
  }
}

function preserveLeasePoisonV01(lease: BrokerLeaseV01): void {
  try {
    writeExactLeasePoisonV01(lease);
  } catch {
    // The in-memory broker remains poisoned. An inexact or missing lease root
    // is never recreated here because doing so could overwrite foreign state.
  }
}

function writeExactLeasePoisonV01(lease: BrokerLeaseV01): void {
  assertLeaseRootIdentityV01(lease);
  const poisonPath = `${lease.path}.poisoned`;
  const expected = `${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_auth_broker_poison_tombstone.v0.1",
      lease_identity: lease.identity,
      lease_birth_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          device: String(lease.device),
          inode: String(lease.inode),
        }),
      ),
    }),
  )}\n`;
  if (existsSync(poisonPath)) {
    const current = lstatSync(poisonPath);
    if (
      !current.isFile() ||
      current.isSymbolicLink() ||
      readFileSync(poisonPath, "utf8") !== expected
    )
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_poison_write_failed",
      );
    return;
  }
  const fd = openSync(poisonPath, "wx", 0o600);
  try {
    writeFileSync(fd, expected, { encoding: "utf8" });
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  const parentFd = openSync(lease.root, "r");
  try {
    fsyncSync(parentFd);
  } finally {
    closeSync(parentFd);
  }
  assertLeaseRootIdentityV01(lease);
  const current = lstatSync(poisonPath);
  if (
    !current.isFile() ||
    current.isSymbolicLink() ||
    readFileSync(poisonPath, "utf8") !== expected
  )
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_poison_write_failed",
    );
}

function assertLeaseIdentityV01(lease: BrokerLeaseV01): void {
  assertLeaseRootIdentityV01(lease);
  let current;
  let descriptor;
  try {
    current = lstatSync(lease.path, { bigint: true });
    descriptor = fstatSync(lease.fd, { bigint: true });
  } catch {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_lease_substituted",
    );
  }
  if (
    current.isSymbolicLink() ||
    current.dev !== lease.device ||
    current.ino !== lease.inode ||
    descriptor.dev !== lease.device ||
    descriptor.ino !== lease.inode
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_lease_substituted",
    );
  }
}

function assertLeaseRootIdentityV01(lease: BrokerLeaseV01): void {
  let currentRoot;
  try {
    currentRoot = lstatSync(lease.root, { bigint: true });
  } catch {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_lease_substituted",
    );
  }
  if (
    !currentRoot.isDirectory() ||
    currentRoot.isSymbolicLink() ||
    currentRoot.dev !== lease.rootDevice ||
    currentRoot.ino !== lease.rootInode
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_lease_substituted",
    );
  }
}

function exactPrivateDirectoryV01(value: string): string {
  try {
    if (!path.isAbsolute(value)) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_root_invalid",
      );
    }
    const supplied = lstatSync(value);
    if (supplied.isSymbolicLink()) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_root_invalid",
      );
    }
    const resolved = realpathSync(value);
    const stat = lstatSync(resolved);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (stat.mode & 0o077) !== 0 ||
      (typeof process.getuid === "function" && stat.uid !== process.getuid())
    ) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_root_invalid",
      );
    }
    return resolved;
  } catch (error) {
    if (error instanceof CodexCredentialBrokerErrorV01) throw error;
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_lease_root_invalid",
    );
  }
}

function exactPrivateCodexHomeV01(value: string): string {
  try {
    if (
      typeof value !== "string" ||
      !path.isAbsolute(value) ||
      path.normalize(value) !== value ||
      value.length > 4096 ||
      /[\u0000\r\n]/u.test(value) ||
      containsSensitiveLocatorShapeV01(value)
    )
      throw new Error("invalid");
    const supplied = lstatSync(value);
    if (supplied.isSymbolicLink()) throw new Error("invalid");
    const resolved = realpathSync(value);
    const stat = lstatSync(resolved);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (typeof process.getuid === "function" && stat.uid !== process.getuid())
    )
      throw new Error("invalid");
    return resolved;
  } catch {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_source_codex_home_invalid",
    );
  }
}

function containsSensitiveLocatorShapeV01(value: string): boolean {
  return containsCodexCredentialSecretShapeV01(value);
}

function requiredPrivateAbsolutePathV01(value: string): string {
  if (
    typeof value !== "string" ||
    !path.isAbsolute(value) ||
    path.normalize(value) !== value ||
    value.length > 4096 ||
    /[\u0000\r\n]/u.test(value) ||
    containsSensitiveLocatorShapeV01(value)
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_keychain_path_invalid",
    );
  }
  return value;
}

interface ExactPrivateFileIdentityV01 {
  path: string;
  device: bigint;
  inode: bigint;
}

function exactPrivateKeychainIdentityV01(
  value: string,
): ExactPrivateFileIdentityV01 {
  try {
    const supplied = lstatSync(value);
    if (supplied.isSymbolicLink()) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_keychain_substituted",
      );
    }
    const resolved = realpathSync(value);
    const stat = lstatSync(resolved, { bigint: true });
    if (resolved !== value || !stat.isFile() || stat.isSymbolicLink()) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_keychain_substituted",
      );
    }
    return { path: resolved, device: stat.dev, inode: stat.ino };
  } catch (error) {
    if (error instanceof CodexCredentialBrokerErrorV01) throw error;
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_keychain_substituted",
    );
  }
}

function assertExactPrivateFileIdentityV01(
  identity: ExactPrivateFileIdentityV01,
  code: string,
): void {
  try {
    const stat = lstatSync(identity.path, { bigint: true });
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.dev !== identity.device ||
      stat.ino !== identity.inode
    ) {
      throw new CodexCredentialBrokerErrorV01(code);
    }
  } catch (error) {
    if (error instanceof CodexCredentialBrokerErrorV01) throw error;
    throw new CodexCredentialBrokerErrorV01(code);
  }
}

function canonicalProductionLeaseRootV01(): string {
  if (process.platform !== "darwin" || typeof process.getuid !== "function") {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_platform_unsupported",
    );
  }
  const parent = realpathSync("/private/tmp");
  if (parent !== "/private/tmp") {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_lease_root_invalid",
    );
  }
  const root = path.join(
    parent,
    `augnes-codex-auth-leases-v0-1-${process.getuid()}`,
  );
  try {
    mkdirSync(root, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_root_invalid",
      );
    }
  }
  return exactPrivateDirectoryV01(root);
}

function sha256FileV01(filePath: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}
