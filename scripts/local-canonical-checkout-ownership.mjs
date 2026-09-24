import { createHash, randomBytes } from "node:crypto";
import {
  closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync,
  openSync, readSync, realpathSync, unlinkSync, writeFileSync,
} from "node:fs";
import path from "node:path";

import { CANONICAL_ORIGIN_URL, CANONICAL_REPOSITORY_ID } from "./canonical-repository-identity.mjs";
import { LOCAL_ARTIFACT_DIRECTORY } from "./local-canonical-environment.mjs";
import { readProcessBirthIdentity } from "./local-process-ownership.mjs";

export const CHECKOUT_OWNERSHIP_CONTRACT = "augnes.local-canonical-checkout-owner.v1";
export const CHECKOUT_OWNER_FILE = "checkout-owner.json";
const MAX_OWNER_BYTES = 4096;
const owners = new WeakMap();
const ownerError = (code) => Object.assign(new Error(code), { code });
const sameObject = (a, b) => a && b && a.dev === b.dev && a.ino === b.ino;

export function requiresCheckoutVerificationOwnership(selectedPlan) {
  return ["quick-feedback", "owner-targeted", "full-canonical"].includes(selectedPlan);
}

export function checkoutVerificationFingerprint(repositoryRoot) {
  const root = realpathSync(repositoryRoot);
  const physical = lstatSync(root);
  return createHash("sha256").update(JSON.stringify([
    CHECKOUT_OWNERSHIP_CONTRACT, CANONICAL_REPOSITORY_ID, CANONICAL_ORIGIN_URL,
    root, String(physical.dev), String(physical.ino),
  ])).digest("hex");
}

// Cooperative checkout exclusion, not hostile-host isolation. The open file
// pins the inode until release. Never reclaim on age/PID alone: orphaned
// consumers may outlive their parent. Stale/ambiguous artifacts fail closed.
export function acquireCheckoutVerificationOwnership({ repositoryRoot }) {
  const root = realpathSync(repositoryRoot);
  if (path.resolve(repositoryRoot) !== root) throw ownerError("checkout_owner_unsafe_root");
  const parent = path.join(root, LOCAL_ARTIFACT_DIRECTORY);
  try { mkdirSync(parent, { mode: 0o700 }); }
  catch (error) { if (error?.code !== "EEXIST") throw ownerError("checkout_owner_directory_failed"); }
  const state = {
    root, rootPhysical: lstatSync(root), parent, parentPhysical: lstatSync(parent),
    file: path.join(parent, CHECKOUT_OWNER_FILE), fd: null, released: false,
  };
  assertBoundary(state);
  const birth = readProcessBirthIdentity(process.pid);
  if (birth.state !== "present") throw ownerError("checkout_owner_process_unverifiable");
  const metadata = Object.freeze({
    contract: CHECKOUT_OWNERSHIP_CONTRACT,
    repository_id: CANONICAL_REPOSITORY_ID,
    checkout_fingerprint: checkoutVerificationFingerprint(root),
    ownership_id: randomBytes(16).toString("hex"),
    owner_pid: process.pid,
    owner_process_identity: birth.identity,
    acquired_at: new Date().toISOString(),
  });
  try {
    // O_EXCL refuses both an existing file and a symlink, including dangling links.
    state.fd = openSync(state.file, constants.O_CREAT | constants.O_EXCL | constants.O_RDWR |
      (constants.O_NOFOLLOW ?? 0), 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") refuseExistingOwner(state, metadata.checkout_fingerprint);
    throw ownerError("checkout_owner_acquisition_failed");
  }
  try {
    state.physical = fstatSync(state.fd);
    writeFileSync(state.fd, `${JSON.stringify(metadata)}\n`, "utf8");
    fsyncSync(state.fd);
    const owner = Object.freeze({ metadata });
    owners.set(owner, state);
    assertCheckoutVerificationOwnership(owner, root);
    return owner;
  } catch (error) {
    // Leave an incomplete artifact for explicit inspection; do not guess at
    // cleanup after a failed acquisition or convert it to successful ownership.
    closeSync(state.fd);
    throw ownerError(error?.code?.startsWith("checkout_") ? error.code : "checkout_owner_acquisition_failed");
  }
}

export function assertCheckoutVerificationOwnership(owner, repositoryRoot) {
  const state = owners.get(owner);
  if (!state || state.released || state.fd === null || process.pid !== owner.metadata.owner_pid ||
      realpathSync(repositoryRoot) !== state.root) throw ownerError("checkout_owner_not_owned");
  assertBoundary(state);
  const entry = lstatSync(state.file, { throwIfNoEntry: false });
  if (!entry?.isFile() || entry.isSymbolicLink() || entry.nlink !== 1 ||
      !sameObject(entry, state.physical) || !sameObject(fstatSync(state.fd), state.physical)) {
    throw ownerError("checkout_owner_identity_changed");
  }
  const stored = readBoundedMetadata(state.fd);
  if (JSON.stringify(stored) !== JSON.stringify(owner.metadata)) throw ownerError("checkout_owner_identity_changed");
  return true;
}

export function releaseCheckoutVerificationOwnership(owner, repositoryRoot, { consumersSettled = true } = {}) {
  const state = owners.get(owner);
  if (!state || state.released) throw ownerError("checkout_owner_not_owned");
  try {
    // Failed assertions may still have cleanly settled children. Unknown
    // settlement, however, cannot authorize a successor to replace their inputs.
    if (!consumersSettled) throw ownerError("checkout_owner_consumers_unsettled");
    assertCheckoutVerificationOwnership(owner, repositoryRoot);
    unlinkSync(state.file);
    state.released = true;
    return { released: true, released_at: new Date().toISOString() };
  } finally {
    // A lost/replaced file is never unlinked. Close only this invocation's fd.
    if (state.fd !== null) { closeSync(state.fd); state.fd = null; }
  }
}

function assertBoundary(state) {
  for (const [entry, physical] of [[state.root, state.rootPhysical], [state.parent, state.parentPhysical]]) {
    const current = lstatSync(entry, { throwIfNoEntry: false });
    if (!current?.isDirectory() || current.isSymbolicLink() ||
        !sameObject(current, physical) || realpathSync(entry) !== entry) {
      throw ownerError("checkout_owner_unsafe_path");
    }
  }
}

function readBoundedMetadata(fd) {
  const bytes = Buffer.alloc(MAX_OWNER_BYTES + 1);
  const size = readSync(fd, bytes, 0, bytes.length, 0);
  if (size === 0 || size > MAX_OWNER_BYTES) throw ownerError("checkout_owner_ambiguous");
  try { return JSON.parse(bytes.subarray(0, size).toString("utf8")); }
  catch { throw ownerError("checkout_owner_ambiguous"); }
}

function refuseExistingOwner(state, fingerprint) {
  assertBoundary(state);
  const entry = lstatSync(state.file, { throwIfNoEntry: false });
  if (!entry?.isFile() || entry.isSymbolicLink() || entry.nlink !== 1) throw ownerError("checkout_owner_unsafe_path");
  let fd;
  let value;
  try {
    fd = openSync(state.file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    if (!sameObject(entry, fstatSync(fd))) throw ownerError("checkout_owner_ambiguous");
    value = readBoundedMetadata(fd);
    assertBoundary(state);
    if (!sameObject(entry, lstatSync(state.file, { throwIfNoEntry: false }))) throw ownerError("checkout_owner_ambiguous");
  } catch (error) {
    throw ownerError(error?.code?.startsWith("checkout_") ? error.code : "checkout_owner_ambiguous");
  } finally { if (fd !== undefined) closeSync(fd); }
  if (value?.contract !== CHECKOUT_OWNERSHIP_CONTRACT || value?.repository_id !== CANONICAL_REPOSITORY_ID ||
      value?.checkout_fingerprint !== fingerprint || !/^[0-9a-f]{32}$/u.test(value?.ownership_id ?? "") ||
      !Number.isSafeInteger(value?.owner_pid) || value.owner_pid <= 0 ||
      !/^[0-9a-f]{64}$/u.test(value?.owner_process_identity ?? "") ||
      typeof value?.acquired_at !== "string" || !Number.isFinite(Date.parse(value.acquired_at))) {
    throw ownerError("checkout_owner_ambiguous");
  }
  const birth = readProcessBirthIdentity(value.owner_pid);
  if (birth.state === "missing" || (birth.state === "present" && birth.identity !== value.owner_process_identity)) {
    throw ownerError("checkout_owner_stale_refused");
  }
  throw ownerError(birth.state === "present" ? "checkout_owner_busy" : "checkout_owner_ambiguous");
}
