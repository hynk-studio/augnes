import path from "node:path";
import { tmpdir } from "node:os";
import { closeSync, constants, fchmodSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readdirSync, realpathSync, rmdirSync, unlinkSync } from "node:fs";

// Parent-owned test resources, not production snapshot capabilities. Identity
// is captured before spawning a child; only the process runner marks settlement.
const resourceOwners = new WeakMap();
const sameObject = (a, b) => a.dev === b.dev && a.ino === b.ino && a.isDirectory() === b.isDirectory();
const resourceError = code => Object.assign(new Error(code), { code });

export function createCanonicalTestResourceRoot(prefix, { shortSocketPaths = false } = {}) {
  if (!/^ag-(?:suite|c[0-9]{2}|resource-test)-$/u.test(prefix)) throw resourceError("resource_prefix_invalid");
  // Darwin AF_UNIX paths are bounded. An outer invocation adds another level
  // above child roots, so use the system short temp location when requested.
  // The new directory still has the same physical owner and cleanup capability.
  const parent = realpathSync(shortSocketPaths && process.platform === "darwin" ? "/tmp" : tmpdir());
  const root = realpathSync(mkdtempSync(path.join(parent, prefix)));
  return ownResourceRoot(root, parent);
}

// Fixed-layout disposable inputs need their existing reader paths. Only a new
// directory can be owned; an existing archive is never adopted or overwritten.
export function createCanonicalTestResourceDirectory(root) {
  const parent = realpathSync(path.dirname(root));
  if (path.join(parent, path.basename(root)) !== root) throw resourceError("resource_parent_changed");
  mkdirSync(root, { mode: 0o700 });
  return ownResourceRoot(root, parent);
}

function ownResourceRoot(root, parent) {
  const physical = lstatSync(root);
  const owner = Object.freeze({ root, device: String(physical.dev), inode: String(physical.ino) });
  resourceOwners.set(owner, { parent, parentPhysical: lstatSync(parent), physical, state: "prepared" });
  return owner;
}

export function beginCanonicalTestResourceUse(owner) {
  const state = resourceOwners.get(owner);
  if (!state || state.state !== "prepared") throw resourceError("resource_owner_invalid");
  if (!assertResourceRoot(owner, state)) throw resourceError("resource_root_missing");
  state.state = "in_use";
}

export function settleCanonicalTestResourceUse(owner, result) {
  const state = resourceOwners.get(owner);
  if (!state || state.state !== "in_use") throw resourceError("resource_owner_invalid");
  if (result.exit_observed !== true || result.streams_closed !== true ||
      result.cleanup_completed !== true || result.remaining_owned_processes !== 0)
    throw resourceError("resource_consumers_unsettled");
  state.state = "settled";
}

function assertResourceRoot(owner, state) {
  const parent = lstatSync(state.parent);
  if (parent.isSymbolicLink() || !sameObject(parent, state.parentPhysical) || realpathSync(state.parent) !== state.parent)
    throw resourceError("resource_parent_changed");
  const observed = lstatSync(owner.root, { throwIfNoEntry: false });
  if (!observed) return false;
  if (observed.isSymbolicLink() || !sameObject(observed, state.physical) || realpathSync(owner.root) !== owner.root)
    throw resourceError("resource_root_changed");
  return true;
}

// Consumers have settled before this walk. No pathname chmod, symlink traversal
// or cross-device walk: only opened, identity-checked owned directories receive
// owner rwx bits. This is trusted test cleanup, not hostile-host race isolation.
function removeOwnedTestEntry(entry, rootDevice, assertParent, failures) {
  let fd;
  try {
    assertParent();
    const before = lstatSync(entry, { throwIfNoEntry: false });
    if (!before) return;
    if (!before.isDirectory() || before.isSymbolicLink()) {
      // unlink removes a symlink or hardlink itself; it never chmods its target.
      unlinkSync(entry); return;
    }
    if (before.dev !== rootDevice) throw resourceError("resource_device_changed");
    const assertEntry = () => {
      assertParent();
      const current = lstatSync(entry);
      if (current.isSymbolicLink() || !sameObject(current, before)) throw resourceError("resource_entry_changed");
    };
    assertEntry();
    if ((before.mode & 0o700) !== 0o700) {
      if (!constants.O_NOFOLLOW) throw resourceError("resource_permission_cleanup_unsupported");
      fd = openSync(entry, constants.O_RDONLY | constants.O_NOFOLLOW |
        (constants.O_DIRECTORY ?? 0) | (constants.O_NONBLOCK ?? 0));
      if (!sameObject(before, fstatSync(fd))) throw resourceError("resource_entry_changed");
      assertEntry();
      fchmodSync(fd, (before.mode & 0o777) | 0o700);
    }
    for (const name of readdirSync(entry)) removeOwnedTestEntry(path.join(entry, name), rootDevice, assertEntry, failures);
    assertEntry(); rmdirSync(entry);
  } catch (error) {
    const code = typeof error?.code === "string" && /^(?:E[A-Z]+|resource_[a-z_]+)$/u.test(error.code) ? error.code : "resource_cleanup_failed";
    failures.push(code);
  } finally {
    if (fd !== undefined) {
      try { closeSync(fd); } catch { failures.push("resource_descriptor_close_failed"); }
    }
  }
}

export function cleanupCanonicalTestResources(owners) {
  return owners.map(owner => {
    const state = resourceOwners.get(owner);
    const failures = [];
    try {
      if (!state || state.state === "released") throw resourceError("resource_owner_invalid");
      if (state.state === "in_use") throw resourceError("resource_consumers_unsettled");
      if (assertResourceRoot(owner, state)) {
        removeOwnedTestEntry(owner.root, state.physical.dev, () => assertResourceRoot(owner, state), failures);
      }
      if (lstatSync(owner.root, { throwIfNoEntry: false })) failures.push("resource_remains");
      if (failures.length === 0) state.state = "released";
    } catch (error) { failures.push(error?.code ?? "resource_cleanup_failed"); }
    return { root: owner?.root ?? null, completed: failures.length === 0,
      failure_count: failures.length, failures: failures.slice(0, 32) };
  });
}

// Each key is required by Node, npm, Chrome, or cross-platform process startup.
export const CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST = Object.freeze([
  "PATH",
  "Path",
  "HOME",
  "USERPROFILE",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
  // vswhere reads its installed-instance catalog beneath this standard,
  // non-secret Windows location. Developer-shell INCLUDE/LIB/PATH additions
  // remain excluded and the helper constructs those values from discovered SDKs.
  "ProgramData",
  "LANG",
  "LANGUAGE",
  "LC_ALL",
  "LC_CTYPE",
  "TZ",
  "TERM",
  "COLORTERM",
  "NO_COLOR",
  "FORCE_COLOR",
  "CI",
]);

// These inputs are explicitly selected by the local operator and remain
// subject to their owning browser or repository-identity validation.
export const CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST = Object.freeze([
  "AUGNES_BROWSER_EXECUTABLE_PATH",
  "AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT",
]);

// These values are authored by the canonical suite, never copied from ambient state.
export const CANONICAL_STEP_ENVIRONMENT_ALLOWLIST = Object.freeze({
  AUGNES_CANONICAL_TEMP_ROOT:
    "exposes the suite-owned temporary root to the environment-isolation regression",
  AUGNES_DB_PATH:
    "binds a database-writing test to a suite-owned disposable database",
  AUGNES_CANONICAL_TEST_MODE:
    "enables test-only local adapters inside a suite-owned runtime",
  AUGNES_TEST_FOLDER_PICKER_PATH:
    "injects a picker result constrained to the suite-owned temporary root",
  AUGNES_TEST_FOLDER_PICKER_OUTCOME:
    "injects a non-path picker outcome inside a suite-owned runtime",
  AUGNES_RUNTIME_STATE_DIR:
    "binds runtime state to a child-owned disposable directory",
});

const CANONICAL_STEP_PATH_KEYS = new Set([
  "AUGNES_CANONICAL_TEMP_ROOT",
  "AUGNES_DB_PATH",
  "AUGNES_TEST_FOLDER_PICKER_PATH",
  "AUGNES_RUNTIME_STATE_DIR",
]);

const CANONICAL_CHILD_OWNED_ENVIRONMENT_KEYS = new Set([
  "APPDATA",
  "AUGNES_CANONICAL_TEMP_ROOT",
  "AUGNES_DB_PATH",
  "AUGNES_RUNTIME_STATE_DIR",
  "LOCALAPPDATA",
]);

export function buildCanonicalChildEnvironment({
  ambientEnvironment = process.env,
  stepEnvironment = {},
  temporaryRoot,
  resourceRoot = temporaryRoot,
}) {
  if (typeof temporaryRoot !== "string" || !path.isAbsolute(temporaryRoot)) {
    throw new Error("canonical temporary root must be an absolute path");
  }
  if (
    typeof resourceRoot !== "string" ||
    !path.isAbsolute(resourceRoot)
  ) {
    throw new Error("canonical child resource root must be absolute");
  }
  if (
    !isPathInsideOrEqual(temporaryRoot, resourceRoot) &&
    path.dirname(path.resolve(resourceRoot)) !==
      path.dirname(path.resolve(temporaryRoot))
  ) {
    throw new Error(
      "canonical child resource root must be suite-owned OS-temporary state",
    );
  }

  const environment = { NODE_ENV: "test" };

  for (const key of CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }
  for (const key of CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }

  const homeRoot = path.join(resourceRoot, "home");
  const processTempRoot = resourceRoot;
  environment.HOME = homeRoot;
  environment.USERPROFILE = homeRoot;
  environment.LOCALAPPDATA = path.join(homeRoot, "AppData", "Local");
  environment.APPDATA = path.join(homeRoot, "AppData", "Roaming");
  environment.TMPDIR = processTempRoot;
  environment.TMP = processTempRoot;
  environment.TEMP = processTempRoot;
  environment.AUGNES_CANONICAL_TEMP_ROOT = resourceRoot;
  environment.AUGNES_DB_PATH = path.join(resourceRoot, "canonical.db");
  environment.AUGNES_RUNTIME_STATE_DIR = path.join(resourceRoot, "runtime-state");

  for (const [key, value] of Object.entries(stepEnvironment)) {
    if (!(key in CANONICAL_STEP_ENVIRONMENT_ALLOWLIST)) {
      throw new Error(`canonical step environment key is not allowlisted: ${key}`);
    }
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`canonical step environment value must be non-empty: ${key}`);
    }
    if (
      CANONICAL_STEP_PATH_KEYS.has(key) &&
      !isPathInsideOrEqual(resourceRoot, value)
    ) {
      throw new Error(
        `canonical step path must remain inside the child resource root: ${key}`,
      );
    }
    environment[key] = value;
  }

  return environment;
}

export function findForbiddenAmbientKeysForwarded({
  ambientEnvironment = process.env,
  childEnvironment,
  stepEnvironment = {},
}) {
  const allowedAmbientKeys = new Set([
    ...CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
    ...CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
  ]);
  const explicitStepKeys = new Set(Object.keys(stepEnvironment));

  return Object.keys(childEnvironment)
    .filter(
      (key) =>
        key !== "NODE_ENV" &&
        !allowedAmbientKeys.has(key) &&
        !CANONICAL_CHILD_OWNED_ENVIRONMENT_KEYS.has(key) &&
        !explicitStepKeys.has(key) &&
        Object.hasOwn(ambientEnvironment, key),
    )
    .sort();
}

export function isPathInsideOrEqual(root, candidate) {
  if (!path.isAbsolute(candidate)) return false;
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function copyNonEmptyString(target, source, key) {
  const value = source[key];
  if (typeof value === "string" && value.length > 0) target[key] = value;
}
