import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
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
import type { CodexIsolatedAuthProjectionV01 } from "@/types/vnext/codex-isolated-auth-projection";

const MACOS_SECURITY_PATH_V01 = "/usr/bin/security";
const MAX_BROKER_OUTPUT_BYTES_V01 = 64 * 1024;
const BROKER_TIMEOUT_MS_V01 = 5_000;

export class CodexCredentialBrokerErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexCredentialBrokerErrorV01";
  }
}

export interface CodexCredentialBrokerV01 {
  readonly projection_fingerprint: string;
  withLaunchMaterialV01<T>(use: (material: string) => Promise<T>): Promise<T>;
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

abstract class ExclusiveCodexCredentialBrokerV01
  implements CodexCredentialBrokerV01
{
  readonly projection_fingerprint: string;
  private leaseHeld = false;

  constructor(
    protected readonly projection: CodexIsolatedAuthProjectionV01,
    private readonly leaseRoot: string | (() => string),
  ) {
    this.projection_fingerprint = projection.integrity.fingerprint;
  }

  async withLaunchMaterialV01<T>(
    use: (material: string) => Promise<T>,
  ): Promise<T> {
    this.preflightV01();
    if (this.leaseHeld) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_lease_collision",
      );
    }
    const lease = this.acquireLeaseV01();
    this.leaseHeld = true;
    try {
      assertLeaseRootIdentityV01(lease);
      const material = await this.resolveMaterialV01();
      if (!isBoundedAgentIdentityJwtV01(material)) {
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_material_invalid",
        );
      }
      if (
        fingerprintCredentialSourceGenerationV01({
          auth_handle_external_id:
            this.projection.auth_handle_ref.external_id,
          broker_locator_fingerprint:
            this.projection.broker_locator_fingerprint,
          material,
        }) !== this.projection.auth_source_generation_fingerprint
      ) {
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_generation_mismatch",
        );
      }
      // The lookup may have crossed an async keychain or test-broker boundary.
      // Re-authenticate the exclusive lease immediately before the first
      // launch effect so a removed or substituted lease cannot admit two
      // consumers of the same handle generation.
      assertLeaseIdentityV01(lease);
      return await use(material);
    } finally {
      this.leaseHeld = false;
      releaseLeaseV01(lease);
    }
  }

  protected abstract resolveMaterialV01(): Promise<string>;

  protected preflightV01(): void {}

  private acquireLeaseV01(): BrokerLeaseV01 {
    const root = exactPrivateDirectoryV01(
      typeof this.leaseRoot === "function" ? this.leaseRoot() : this.leaseRoot,
    );
    const rootStat = lstatSync(root, { bigint: true });
    const leaseIdentity = credentialLeaseIdentityFingerprintV01(
      this.projection,
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
          auth_handle_ref: this.projection.auth_handle_ref,
          generation_fingerprint:
            this.projection.auth_source_generation_fingerprint,
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

export class MacOsKeychainAgentIdentityBrokerV01 extends ExclusiveCodexCredentialBrokerV01 {
  readonly #serviceName: string;
  readonly #accountName: string;
  readonly #keychainPath: string;

  constructor(input: {
    projection: CodexIsolatedAuthProjectionV01;
    service_name: string;
    account_name: string;
    keychain_path: string;
  }) {
    super(input.projection, canonicalProductionLeaseRootV01);
    if (input.projection.projection_mode !== "macos_keychain_agent_identity_handle") {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_route_mismatch",
      );
    }
    const locatorFingerprint = fingerprintBrokerLocatorV01({
      backend: "macos_keychain_generic_password",
      service_name: input.service_name,
      account_name: input.account_name,
      keychain_path: input.keychain_path,
    });
    if (locatorFingerprint !== input.projection.broker_locator_fingerprint) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_locator_mismatch",
      );
    }
    this.#serviceName = requiredPrivateLocatorV01(input.service_name);
    this.#accountName = requiredPrivateLocatorV01(input.account_name);
    this.#keychainPath = requiredPrivateAbsolutePathV01(input.keychain_path);
  }

  protected override preflightV01(): void {
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
  }

  protected async resolveMaterialV01(): Promise<string> {
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
    if (fingerprint !== this.projection.broker_executable_fingerprint) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_executable_substituted",
      );
    }
    const keychainIdentity = exactPrivateKeychainIdentityV01(
      this.#keychainPath,
    );
    const material = await readExactMacOsKeychainItemV01({
      executable,
      service_name: this.#serviceName,
      account_name: this.#accountName,
      keychain_path: keychainIdentity.path,
    });
    assertExactPrivateFileIdentityV01(
      keychainIdentity,
      "codex_auth_broker_keychain_substituted",
    );
    return material;
  }
}

export class FakeCodexCredentialBrokerV01 extends ExclusiveCodexCredentialBrokerV01 {
  readonly #materialByHandle: Map<string, string>;
  readonly #expectedHandle: string;
  readonly #failCode: string | null;
  readonly #beforeReturn: (() => void | Promise<void>) | null;

  constructor(input: {
    projection: CodexIsolatedAuthProjectionV01;
    lease_root: string;
    entries: Array<{ handle_external_id: string; material: string }>;
    fail_code?: string | null;
    before_return?: (() => void | Promise<void>) | null;
  }) {
    super(input.projection, input.lease_root);
    const map = new Map<string, string>();
    for (const entry of input.entries) {
      if (map.has(entry.handle_external_id)) {
        throw new CodexCredentialBrokerErrorV01(
          "codex_auth_broker_handle_duplicate",
        );
      }
      map.set(entry.handle_external_id, entry.material);
    }
    this.#materialByHandle = map;
    this.#expectedHandle = input.projection.auth_handle_ref.external_id;
    this.#failCode = input.fail_code ?? null;
    this.#beforeReturn = input.before_return ?? null;
  }

  protected async resolveMaterialV01(): Promise<string> {
    if (process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE !== "1") {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_fake_broker_forbidden_outside_test_mode",
      );
    }
    if (this.#failCode) {
      throw new CodexCredentialBrokerErrorV01(this.#failCode);
    }
    if (!this.#materialByHandle.has(this.#expectedHandle)) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_handle_missing",
      );
    }
    if (this.#materialByHandle.size !== 1) {
      throw new CodexCredentialBrokerErrorV01(
        "codex_auth_broker_handle_ambiguous",
      );
    }
    await this.#beforeReturn?.();
    return this.#materialByHandle.get(this.#expectedHandle)!;
  }
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
export function fingerprintCredentialSourceGenerationV01(input: {
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

function isPlainObjectV01(
  value: unknown,
): value is Record<string, unknown> {
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
          new CodexCredentialBrokerErrorV01(
            "codex_auth_broker_lookup_failed",
          ),
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
