import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
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
  CODEX_ISOLATED_AUTH_AVAILABILITY_VERSION_V01,
  CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01,
  CODEX_ISOLATED_AUTH_ROUTE_V01,
  type CodexIsolatedAuthAvailabilityV01,
  type CodexIsolatedAuthCredentialAttestationV01,
  type CodexIsolatedAuthProjectionV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const MACOS_SECURITY_PATH_V01 = "/usr/bin/security";
const MAX_BROKER_OUTPUT_BYTES_V01 = 64 * 1024;
const BROKER_TIMEOUT_MS_V01 = 5_000;
const SOURCE_OWNED_BROKERS_V01 = new WeakSet<object>();
const EXACT_APP_SERVER_ENVIRONMENT_KEYS_V01 = new Set([
  "AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE",
  "CODEX_HOME",
  "CODEX_SQLITE_HOME",
  "FAKE_CODEX_AUTH_BOUNDARY_PATH",
  "FAKE_CODEX_CLEANUP_MARKER_PATH",
  "FAKE_CODEX_NETWORK_COUNT_PATH",
  "FAKE_CODEX_SCENARIO",
  "FAKE_CODEX_TRACE_PATH",
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
  provisioning_authorization_ref: ExternalRefV01;
  attestation_id: string;
  issued_at: string;
  expires_at: string;
}

export interface SpawnExactCodexAppServerInputV01 {
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
      FAKE_CODEX_NETWORK_COUNT_PATH?: string;
      FAKE_CODEX_SCENARIO?: string;
      FAKE_CODEX_TRACE_PATH?: string;
    };
  };
  launch_shape_fingerprint: string;
}

export interface CodexIsolatedSpawnedChildV01 {
  child: ChildProcessWithoutNullStreams;
  child_identity_fingerprint: string;
  projection_fingerprint: string;
}

/** Public callers can provision safe attestations or request one exact Codex
 * App Server spawn. No public operation returns credential bytes or a
 * secret-bearing environment. */
export interface CodexCredentialBrokerV01 {
  readonly binding_fingerprint: string;
  provisionCredentialAttestationV01(
    input: ProvisionCodexCredentialAttestationInputV01,
  ): Promise<CodexIsolatedAuthCredentialAttestationV01>;
  availabilityV01(input: {
    codex_executable_fingerprint: string;
    observed_at: string;
  }): Promise<CodexIsolatedAuthAvailabilityV01>;
  spawnExactCodexAppServerV01(
    input: SpawnExactCodexAppServerInputV01,
  ): Promise<CodexIsolatedSpawnedChildV01>;
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

interface BrokerLeaseV01 {
  fd: number;
  path: string;
  root: string;
  rootDevice: bigint;
  rootInode: bigint;
  device: bigint;
  inode: bigint;
}

class ExclusiveCodexCredentialBrokerV01 implements CodexCredentialBrokerV01 {
  readonly binding_fingerprint: string;
  readonly #binding: CodexCredentialBrokerBindingV01;
  readonly #leaseRoot: string | (() => string);
  readonly #preflight: () => void;
  readonly #resolveMaterial: () => Promise<string>;
  #leaseHeld = false;

  constructor(
    binding: CodexCredentialBrokerBindingV01,
    leaseRoot: string | (() => string),
    preflight: () => void,
    resolveMaterial: () => Promise<string>,
  ) {
    const exactBinding = deepFreezeV01(structuredClone(binding));
    this.binding_fingerprint =
      credentialBrokerBindingFingerprintV01(exactBinding);
    this.#binding = exactBinding;
    this.#leaseRoot = leaseRoot;
    this.#preflight = preflight;
    this.#resolveMaterial = resolveMaterial;
  }

  async provisionCredentialAttestationV01(
    input: ProvisionCodexCredentialAttestationInputV01,
  ): Promise<CodexIsolatedAuthCredentialAttestationV01> {
    return await this.#withResolvedMaterialV01(null, async (material) =>
      createCredentialAttestationFromMaterialV01({
        binding: this.#binding,
        input,
        material,
      }),
    );
  }

  async availabilityV01(input: {
    codex_executable_fingerprint: string;
    observed_at: string;
  }): Promise<CodexIsolatedAuthAvailabilityV01> {
    let state: CodexIsolatedAuthAvailabilityV01["state"] = "available_exact";
    try {
      await this.#withResolvedMaterialV01(null, async (material) => {
        decodeCredentialClaimsV01(material);
      });
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

  async spawnExactCodexAppServerV01(
    input: SpawnExactCodexAppServerInputV01,
  ): Promise<CodexIsolatedSpawnedChildV01> {
    assertExactSpawnBindingV01(this.#binding, input);
    return await this.#withResolvedMaterialV01(
      input.projection.auth_source_generation_fingerprint,
      async (material) => {
        const claims = decodeCredentialClaimsV01(material);
        const accountIdentity = accountIdentityFingerprintV01(claims);
        if (
          accountIdentity !== input.projection.account_identity_fingerprint ||
          input.credential_attestation.account_identity_fingerprint !==
            accountIdentity
        ) {
          throw new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_account_identity_mismatch",
          );
        }
        const { test_controls: testControls, ...nonSecretEnvironment } =
          input.launch_environment;
        const environment: NodeJS.ProcessEnv = {
          ...nonSecretEnvironment,
          ...testControls,
          CODEX_ACCESS_TOKEN: material,
        };
        let child: ChildProcessWithoutNullStreams;
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
          delete environment.CODEX_ACCESS_TOKEN;
        }
        child.stdout.pause();
        child.stderr.pause();
        await waitForChildSpawnV01(child);
        return {
          child,
          child_identity_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01({
              version: "codex_isolated_spawned_child.v0.1",
              projection_fingerprint: input.projection.integrity.fingerprint,
              pid_observed: child.pid !== undefined,
              launch_shape_fingerprint: input.launch_shape_fingerprint,
              spawn_nonce: randomUUID(),
            }),
          ),
          projection_fingerprint: input.projection.integrity.fingerprint,
        };
      },
    );
  }

  async #withResolvedMaterialV01<T>(
    expectedGeneration: string | null,
    useSafeInternal: (material: string) => Promise<T>,
  ): Promise<T> {
    this.#preflight();
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
      if (!isBoundedAgentIdentityJwtV01(material)) {
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_material_invalid",
        );
      }
      const generation = fingerprintCredentialSourceGenerationV01({
        auth_handle_external_id: this.#binding.auth_handle_ref.external_id,
        broker_locator_fingerprint: this.#binding.broker_locator_fingerprint,
        material,
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
      return await useSafeInternal(material);
    } finally {
      this.#leaseHeld = false;
      releaseLeaseV01(lease);
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
    };
    assertLeaseRootIdentityV01(lease);
    return lease;
  }
}

Object.freeze(ExclusiveCodexCredentialBrokerV01.prototype);

export function createMacOsKeychainAgentIdentityBrokerV01(input: {
  binding: CodexCredentialBrokerBindingV01;
  service_name: string;
  account_name: string;
  keychain_path: string;
}): CodexCredentialBrokerV01 {
  const binding = deepFreezeV01(structuredClone(input.binding));
  const locatorFingerprint = fingerprintBrokerLocatorV01({
    backend: "macos_keychain_generic_password",
    service_name: input.service_name,
    account_name: input.account_name,
    keychain_path: input.keychain_path,
  });
  if (locatorFingerprint !== binding.broker_locator_fingerprint) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_locator_mismatch",
    );
  }
  const serviceName = requiredPrivateLocatorV01(input.service_name);
  const accountName = requiredPrivateLocatorV01(input.account_name);
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
    ),
  );
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

function createCredentialAttestationFromMaterialV01(input: {
  binding: CodexCredentialBrokerBindingV01;
  input: ProvisionCodexCredentialAttestationInputV01;
  material: string;
}): CodexIsolatedAuthCredentialAttestationV01 {
  const claims = decodeCredentialClaimsV01(input.material);
  const generationFingerprint = fingerprintCredentialSourceGenerationV01({
    auth_handle_external_id: input.binding.auth_handle_ref.external_id,
    broker_locator_fingerprint: input.binding.broker_locator_fingerprint,
    material: input.material,
  });
  const claimFingerprint = (domain: string, value: unknown): string =>
    createProtocolSha256V01(canonicalizeProtocolValueV01({ domain, value }));
  const material = {
    attestation_version: CODEX_ISOLATED_AUTH_CREDENTIAL_ATTESTATION_VERSION_V01,
    attestation_id: requiredBoundedIdV01(input.input.attestation_id),
    provisioning_authorization_ref: input.input.provisioning_authorization_ref,
    auth_handle_ref: input.binding.auth_handle_ref,
    broker_locator_fingerprint: input.binding.broker_locator_fingerprint,
    auth_generation_fingerprint: generationFingerprint,
    account_identity_fingerprint: accountIdentityFingerprintV01(claims),
    account_read_email_fingerprint: optionalPrivateClaimFingerprintV01(
      "codex-agent-identity-account-read-email-v01",
      claims.email,
    ),
    agent_identity_runtime_fingerprint: claimFingerprint(
      "codex-agent-identity-runtime-v01",
      { task_id: claims.task_id, sub: claims.sub ?? null },
    ),
    provider_environment_fingerprint: claimFingerprint(
      "codex-agent-identity-provider-environment-v01",
      {
        provider: claims.provider ?? "openai",
        environment: claims.environment ?? "production",
      },
    ),
    plan_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-plan-v01",
      claims.plan_type ?? null,
    ),
    fedramp_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-fedramp-v01",
      claims.fedramp ?? null,
    ),
    issuer_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-issuer-v01",
      claims.iss ?? null,
    ),
    audience_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-audience-v01",
      claims.aud ?? null,
    ),
    validity_projection_fingerprint: claimFingerprint(
      "codex-agent-identity-validity-v01",
      { iat: claims.iat ?? null, exp: claims.exp ?? null },
    ),
    claims_authentication_status:
      "credential_claims_unverified_before_codex_auth",
    issued_at: input.input.issued_at,
    expires_at: input.input.expires_at,
  } as const;
  return { ...material, integrity: integrityV01(material) };
}

function decodeCredentialClaimsV01(material: string): Record<string, unknown> {
  if (!isBoundedAgentIdentityJwtV01(material)) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_material_invalid",
    );
  }
  try {
    const payload = JSON.parse(
      Buffer.from(material.split(".")[1]!, "base64url").toString("utf8"),
    ) as unknown;
    if (!isPlainObjectV01(payload)) throw new Error("invalid");
    accountIdentityFingerprintV01(payload);
    return payload;
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
  input: SpawnExactCodexAppServerInputV01,
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
    input.args.at(-2) !== "app-server" ||
    input.args.at(-1) !== "--stdio" ||
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
  service_name: string;
  account_name: string;
  keychain_path: string;
}): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      version: "codex_auth_broker_locator.v0.1",
      backend: input.backend,
      service_name: requiredPrivateLocatorV01(input.service_name),
      account_name: requiredPrivateLocatorV01(input.account_name),
      keychain_path_fingerprint: createProtocolSha256V01(
        requiredPrivateAbsolutePathV01(input.keychain_path),
      ),
    }),
  );
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
  if (!isBoundedAgentIdentityJwtV01(input.material)) {
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

function isBoundedAgentIdentityJwtV01(value: string): boolean {
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
  try {
    const header = JSON.parse(
      Buffer.from(segments[0]!, "base64url").toString("utf8"),
    ) as unknown;
    const payload = JSON.parse(
      Buffer.from(segments[1]!, "base64url").toString("utf8"),
    ) as unknown;
    return (
      isPlainObjectV01(header) &&
      typeof header.alg === "string" &&
      header.alg.length > 0 &&
      header.alg !== "none" &&
      isPlainObjectV01(payload) &&
      Object.keys(payload).length > 0
    );
  } catch {
    return false;
  }
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
  return candidate ? isBoundedAgentIdentityJwtV01(candidate) : false;
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
}): Promise<string> {
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
    }, BROKER_TIMEOUT_MS_V01);
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

function requiredPrivateLocatorV01(value: string): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 256 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u.test(value) ||
    containsSensitiveLocatorShapeV01(value)
  ) {
    throw new CodexCredentialBrokerErrorV01(
      "codex_auth_broker_locator_invalid",
    );
  }
  return value;
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
