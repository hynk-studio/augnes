import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { request as httpRequest } from "node:http";
import path from "node:path";

export const RUNTIME_CONTRACT = "augnes-local-runtime-supervisor-v1";
export const RUNTIME_SCHEMA_VERSION = 2;
export const RUNTIME_GENERATION_VERSION = 1;
export const RUNTIME_RECONCILIATION_CONTRACT =
  "augnes-local-runtime-reconciliation-v1";
export const RUNTIME_RECONCILIATION_SCHEMA_VERSION = 1;

const LOOPBACK_HOST = "127.0.0.1";
const REQUEST_TIMEOUT_MS = 1_500;
const GRACEFUL_STOP_MS = 8_000;
const FORCED_STOP_MS = 4_000;
const UNPROVEN_EXIT_DRAIN_MS = 1_000;
const MAX_RESPONSE_BYTES = 64 * 1024;

export class PublicRuntimeReconciliationError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = "PublicRuntimeReconciliationError";
    this.code = code;
  }
}

export function withRuntimeReconciliationPath(paths) {
  return {
    ...paths,
    reconciliationLease: path.join(paths.directory, "reconciliation.lock"),
  };
}

export async function classifyRuntimeState({
  paths,
  repositoryFingerprint,
  ownedLease = null,
} = {}) {
  const lease = readRegularJson(paths.reconciliationLease);
  if (lease.state !== "missing" && !leaseOwnedBy(lease, ownedLease)) {
    if (
      lease.state === "valid" &&
      isReconciliationLease(lease.value, repositoryFingerprint)
    ) {
      return classification("reconciliation_in_progress", {
        reason: "runtime_reconciliation_in_progress",
        recoverable: false,
      });
    }
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
    });
  }

  const bundle = readOwnershipBundle(paths);
  if (bundle.presentCount === 0) return classification("clean", { bundle });
  if (bundle.invalid) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
    });
  }

  const records = [bundle.lock.value, bundle.manifest.value, bundle.token.value].filter(
    Boolean,
  );
  if (records.length === 0) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
    });
  }
  if (records.some((record) => !isGenerationRecord(record, repositoryFingerprint))) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
    });
  }
  const generationKeys = new Set(
    records.map((record) => generationKey(record)),
  );
  if (generationKeys.size !== 1) {
    return classification("conflicting_generation", {
      reason: "runtime_generation_conflict",
      recoverable: false,
      bundle,
    });
  }
  const generation = generationIdentity(records[0]);

  if (bundle.manifest.state === "valid" && !isRuntimeManifest(bundle.manifest.value)) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
      generation,
    });
  }
  if (bundle.lock.state === "valid" && !isRuntimeLock(bundle.lock.value)) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
      generation,
    });
  }
  if (bundle.token.state === "valid" && !isRuntimeToken(bundle.token.value)) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
      generation,
    });
  }

  const manifest = bundle.manifest.value;
  const lock = bundle.lock.value;
  const token = bundle.token.value;
  const recordedSupervisorPid = manifest?.supervisor_pid ?? lock?.supervisor_pid ?? null;

  if (manifest && lock && token) {
    if (!sameRuntimeBundle(manifest, lock, token)) {
      return classification("conflicting_generation", {
        reason: "runtime_generation_conflict",
        recoverable: false,
        bundle,
        generation,
      });
    }
    const supervisorIdentity = await probeSupervisor(manifest).catch(() => null);
    if (supervisorIdentity && verifiedSupervisorIdentity(supervisorIdentity, manifest)) {
      return classification("verified_live", {
        recoverable: false,
        bundle,
        generation,
        manifest,
        identity: supervisorIdentity,
      });
    }

    const liveChildren = [];
    for (const child of manifest.children) {
      if (!isProcessTreeAlive(child.pid)) continue;
      const proof = await probeChildOwnership({ child, manifest, token }).catch(
        () => null,
      );
      if (!proof) {
        if (await waitForProcessTreeExit(child.pid, UNPROVEN_EXIT_DRAIN_MS)) {
          continue;
        }
        return classification("ownership_unverifiable", {
          reason: "runtime_ownership_unverifiable",
          recoverable: false,
          bundle,
          generation,
        });
      }
      liveChildren.push({ child, proof });
    }
    if (liveChildren.length > 0) {
      return classification("owned_orphan_children", {
        recoverable: true,
        bundle,
        generation,
        manifest,
        token,
        liveChildren,
      });
    }
    return classification(
      manifest.children.length > 0 ? "stale_no_processes" : "interrupted_before_children",
      {
        recoverable: true,
        bundle,
        generation,
        manifest,
        token,
      },
    );
  }

  const manifestChildren = Array.isArray(manifest?.children) ? manifest.children : [];
  const anyRecordedChildAlive = manifestChildren.some((child) =>
    isProcessTreeAlive(child.pid),
  );
  if (
    (recordedSupervisorPid && isProcessAlive(recordedSupervisorPid)) ||
    anyRecordedChildAlive
  ) {
    return classification("ownership_unverifiable", {
      reason: "runtime_ownership_unverifiable",
      recoverable: false,
      bundle,
      generation,
    });
  }

  return classification(
    manifest ? "partial_owned_bundle" : "interrupted_before_children",
    {
      recoverable: true,
      bundle,
      generation,
      manifest,
      token,
    },
  );
}

export function publicRuntimeClassification(value) {
  return {
    classification: value.state,
    automatic_reconciliation: value.recoverable === true,
    owned_orphan_children:
      value.state === "owned_orphan_children"
        ? value.liveChildren?.length ?? 0
        : 0,
    reason: value.reason ?? null,
  };
}

export function acquireRuntimeReconciliationLease({
  paths,
  repositoryFingerprint,
}) {
  const record = {
    schema_version: RUNTIME_RECONCILIATION_SCHEMA_VERSION,
    contract: RUNTIME_RECONCILIATION_CONTRACT,
    repository_fingerprint: repositoryFingerprint,
    reconciliation_id: randomUUID(),
    owner_pid: process.pid,
    nonce: randomBytes(32).toString("hex"),
    acquired_at: new Date().toISOString(),
  };
  let descriptor = null;
  try {
    descriptor = openSync(paths.reconciliationLease, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(record)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    setRestrictiveMode(paths.reconciliationLease);
    fsyncDirectoryBestEffort(path.dirname(paths.reconciliationLease));
    return record;
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (error?.code === "EEXIST") {
      throw new PublicRuntimeReconciliationError(
        "runtime_reconciliation_in_progress",
      );
    }
    throw new PublicRuntimeReconciliationError("runtime_reconciliation_failed", error);
  }
}

export function releaseRuntimeReconciliationLease({ paths, lease }) {
  const current = readRegularJson(paths.reconciliationLease);
  if (
    current.state === "valid" &&
    current.value.contract === lease.contract &&
    current.value.reconciliation_id === lease.reconciliation_id &&
    constantTimeEqual(current.value.nonce, lease.nonce)
  ) {
    removeRegularFile(paths.reconciliationLease);
    removeDirectoryIfEmpty(paths.directory);
  }
}

export async function stopVerifiedOrphanChildren(classified) {
  if (classified.state !== "owned_orphan_children") return 0;
  let stopped = 0;
  for (const verified of [...classified.liveChildren].reverse()) {
    const freshProof = await probeChildOwnership({
      child: verified.child,
      manifest: classified.manifest,
      token: classified.token,
    }).catch(() => null);
    if (!freshProof) {
      throw new PublicRuntimeReconciliationError(
        "runtime_ownership_unverifiable",
      );
    }
    signalVerifiedProcessTree(verified.child.pid, "SIGTERM");
    if (!(await waitForProcessTreeExit(verified.child.pid, GRACEFUL_STOP_MS))) {
      const proofBeforeEscalation = await probeChildOwnership({
        child: verified.child,
        manifest: classified.manifest,
        token: classified.token,
      }).catch(() => null);
      if (!proofBeforeEscalation) {
        throw new PublicRuntimeReconciliationError(
          "runtime_ownership_unverifiable",
        );
      }
      signalVerifiedProcessTree(verified.child.pid, "SIGKILL");
      if (!(await waitForProcessTreeExit(verified.child.pid, FORCED_STOP_MS))) {
        throw new PublicRuntimeReconciliationError(
          "runtime_orphan_cleanup_failed",
        );
      }
    }
    stopped += 1;
  }
  return stopped;
}

export function cleanupRuntimeOwnershipBundle({ paths, classified }) {
  if (!classified.recoverable || !classified.generation) {
    throw new PublicRuntimeReconciliationError("runtime_ownership_unverifiable");
  }
  const current = readOwnershipBundle(paths);
  const records = [current.lock.value, current.manifest.value, current.token.value].filter(
    Boolean,
  );
  if (
    current.invalid ||
    records.length === 0 ||
    records.some(
      (record) => generationKey(record) !== generationKey(classified.generation),
    )
  ) {
    throw new PublicRuntimeReconciliationError("runtime_generation_conflict");
  }
  if (current.bridgeEnvironment.state === "valid") {
    removeRegularFile(paths.bridgeEnvironment);
  }
  removeGenerationJson(paths.manifest, classified.generation);
  removeGenerationJson(paths.token, classified.generation);
  removeGenerationJson(paths.lock, classified.generation);
}

export function hasRuntimeOwnershipMaterial(paths) {
  return [paths.manifest, paths.lock, paths.token, paths.bridgeEnvironment].some(
    existsSync,
  );
}

export function createRuntimeGeneration() {
  return {
    generationId: randomUUID(),
    childOwnershipToken: randomBytes(32).toString("hex"),
  };
}

export function validateRuntimeManifest(value) {
  return isRuntimeManifest(value);
}

function readOwnershipBundle(paths) {
  const lock = readRegularJson(paths.lock);
  const manifest = readRegularJson(paths.manifest);
  const token = readRegularJson(paths.token);
  const bridgeEnvironment = readRegularFile(paths.bridgeEnvironment);
  const members = [lock, manifest, token, bridgeEnvironment];
  return {
    lock,
    manifest,
    token,
    bridgeEnvironment,
    presentCount: members.filter((member) => member.state !== "missing").length,
    invalid: members.some((member) => member.state === "invalid"),
  };
}

function readRegularJson(filePath) {
  const file = readRegularFile(filePath);
  if (file.state !== "valid") return file;
  try {
    return { state: "valid", value: JSON.parse(file.contents) };
  } catch {
    return { state: "invalid" };
  }
}

function readRegularFile(filePath) {
  try {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) return { state: "invalid" };
    return { state: "valid", contents: readFileSync(filePath, "utf8") };
  } catch (error) {
    if (error?.code === "ENOENT") return { state: "missing" };
    return { state: "invalid" };
  }
}

function isGenerationRecord(value, repositoryFingerprint) {
  return (
    isObject(value) &&
    value.schema_version === RUNTIME_SCHEMA_VERSION &&
    value.contract === RUNTIME_CONTRACT &&
    value.generation_version === RUNTIME_GENERATION_VERSION &&
    nonEmpty(value.generation_id) &&
    nonEmpty(value.instance_id) &&
    value.repository_fingerprint === repositoryFingerprint
  );
}

function isRuntimeLock(value) {
  return (
    isObject(value) &&
    Number.isInteger(value.supervisor_pid) &&
    value.supervisor_pid > 0 &&
    nonEmpty(value.started_at)
  );
}

function isRuntimeToken(value) {
  return (
    isObject(value) &&
    typeof value.token === "string" &&
    value.token.length >= 32 &&
    typeof value.child_ownership_token === "string" &&
    value.child_ownership_token.length >= 32
  );
}

function isRuntimeManifest(value) {
  return (
    isObject(value) &&
    Number.isInteger(value.supervisor_pid) &&
    value.supervisor_pid > 0 &&
    value.control_host === LOOPBACK_HOST &&
    isPort(value.control_port) &&
    Array.isArray(value.children) &&
    value.children.every(isChildRecord) &&
    ["starting", "ready", "stopping", "failed"].includes(value.lifecycle_state)
  );
}

function isChildRecord(value) {
  return (
    isObject(value) &&
    ["ui", "bridge"].includes(value.role) &&
    Number.isInteger(value.pid) &&
    value.pid > 0 &&
    isPort(value.port) &&
    (value.ownership_port === null || isPort(value.ownership_port)) &&
    ["starting", "ready", "stopping", "stopped", "failed"].includes(value.state)
  );
}

function sameRuntimeBundle(manifest, lock, token) {
  return [lock, token].every(
    (record) => generationKey(record) === generationKey(manifest),
  );
}

function generationIdentity(record) {
  return {
    schema_version: record.schema_version,
    contract: record.contract,
    generation_version: record.generation_version,
    generation_id: record.generation_id,
    instance_id: record.instance_id,
    repository_fingerprint: record.repository_fingerprint,
  };
}

function generationKey(record) {
  return [
    record.schema_version,
    record.contract,
    record.generation_version,
    record.generation_id,
    record.instance_id,
    record.repository_fingerprint,
  ].join(":");
}

function classification(state, extra = {}) {
  return { state, recoverable: false, reason: null, ...extra };
}

function leaseOwnedBy(leaseResult, ownedLease) {
  return (
    ownedLease &&
    leaseResult.state === "valid" &&
    leaseResult.value.reconciliation_id === ownedLease.reconciliation_id &&
    constantTimeEqual(leaseResult.value.nonce, ownedLease.nonce)
  );
}

function isReconciliationLease(value, repositoryFingerprint) {
  return (
    isObject(value) &&
    value.schema_version === RUNTIME_RECONCILIATION_SCHEMA_VERSION &&
    value.contract === RUNTIME_RECONCILIATION_CONTRACT &&
    value.repository_fingerprint === repositoryFingerprint &&
    nonEmpty(value.reconciliation_id) &&
    Number.isInteger(value.owner_pid) &&
    value.owner_pid > 0 &&
    typeof value.nonce === "string" &&
    value.nonce.length >= 32
  );
}

async function probeSupervisor(manifest) {
  return requestJson({
    port: manifest.control_port,
    pathname: "/v1/identity",
    headers: {},
  }).then((response) =>
    response.statusCode === 200 ? response.body : null,
  );
}

function verifiedSupervisorIdentity(identity, manifest) {
  return (
    isObject(identity) &&
    generationKey(identity) === generationKey(manifest) &&
    identity.supervisor_pid === manifest.supervisor_pid &&
    identity.ui_port === manifest.ui_port &&
    identity.bridge_port === manifest.bridge_port &&
    identity.lifecycle_state === manifest.lifecycle_state
  );
}

async function probeChildOwnership({ child, manifest, token }) {
  if (!isPort(child.ownership_port)) return null;
  const response = await requestJson({
    port: child.ownership_port,
    pathname: "/v1/ownership",
    headers: {
      "x-augnes-child-ownership": token.child_ownership_token,
    },
  });
  if (response.statusCode !== 200) return null;
  const proof = response.body;
  if (
    !isObject(proof) ||
    proof.ownership_verified !== true ||
    proof.schema_version !== RUNTIME_SCHEMA_VERSION ||
    proof.contract !== RUNTIME_CONTRACT ||
    proof.generation_version !== RUNTIME_GENERATION_VERSION ||
    proof.generation_id !== manifest.generation_id ||
    proof.repository_fingerprint !== manifest.repository_fingerprint ||
    proof.instance_id !== manifest.instance_id ||
    proof.role !== child.role ||
    proof.child_root_pid !== child.pid ||
    !Number.isInteger(proof.process_pid) ||
    proof.process_pid <= 0 ||
    proof.loopback_port !== child.port
  ) {
    return null;
  }
  return proof;
}

function requestJson({ port, pathname, headers }) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        host: LOOPBACK_HOST,
        port,
        path: pathname,
        method: "GET",
        headers,
        agent: false,
      },
      (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > MAX_RESPONSE_BYTES) request.destroy();
        });
        response.on("end", () => {
          try {
            resolve({
              statusCode: response.statusCode ?? 0,
              body: body ? JSON.parse(body) : null,
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy());
    request.once("error", reject);
    request.end();
  });
}

function signalVerifiedProcessTree(pid, signal) {
  try {
    if (process.platform === "win32") {
      const args = ["/PID", String(pid), "/T"];
      if (signal === "SIGKILL") args.push("/F");
      spawnSync("taskkill", args, { stdio: "ignore", windowsHide: true });
    } else {
      process.kill(-pid, signal);
    }
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

async function waitForProcessTreeExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessTreeAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return !isProcessTreeAlive(pid);
}

function isProcessTreeAlive(pid) {
  try {
    process.kill(process.platform === "win32" ? pid : -pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function removeGenerationJson(filePath, generation) {
  const current = readRegularJson(filePath);
  if (current.state === "missing") return;
  if (
    current.state !== "valid" ||
    generationKey(current.value) !== generationKey(generation)
  ) {
    throw new PublicRuntimeReconciliationError("runtime_generation_conflict");
  }
  removeRegularFile(filePath);
}

function removeRegularFile(filePath) {
  try {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicRuntimeReconciliationError("runtime_ownership_unverifiable");
    }
    unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function removeDirectoryIfEmpty(directory) {
  try {
    rmdirSync(directory);
  } catch (error) {
    if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error?.code)) throw error;
  }
}

function setRestrictiveMode(filePath) {
  try {
    chmodSync(filePath, 0o600);
  } catch {
    // Windows does not implement POSIX mode semantics.
  }
}

function fsyncDirectoryBestEffort(directory) {
  let descriptor = null;
  try {
    descriptor = openSync(directory, "r");
    fsyncSync(descriptor);
  } catch {
    // Directory fsync is unavailable on some supported platforms.
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function nonEmpty(value) {
  return typeof value === "string" && value.length > 0;
}

function isPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65_535;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
