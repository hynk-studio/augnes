import { execFileSync, spawnSync } from "node:child_process";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomBytes } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync, writeSync } from "node:fs";
import path from "node:path";

export const OWNED_CHILD_LIFECYCLE_PREFIX = "[owned-child-lifecycle] ";
export const OWNED_CHILD_LIFECYCLE_SCHEMA = "augnes.owned-child-lifecycle.v1";
const lifecycleId = value => typeof value === "string" && /^[0-9a-f]{32}$/u.test(value);
const lifecycleTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));
export const MAX_OWNED_CHILD_LIFECYCLE_BYTES = 64 * 1024 * 1024;
export const MAX_OWNED_CHILD_REGISTRATIONS = 131072;
const MAX_LIFECYCLE_BYTES = MAX_OWNED_CHILD_LIFECYCLE_BYTES;
const ledgerFailure = code => Object.assign(new Error(code), { code });
const ledgerDigest = bytes => createHash("sha256").update(bytes).digest("hex");
const syncLifecycleScope = new AsyncLocalStorage();
export const OWNED_CHILD_ANCESTORS_ENV = "AUGNES_CANONICAL_CHILD_LEDGER_ANCESTORS";
const MAX_LEDGER_ANCESTORS = 8;

function lifecycleFileIdentity(file, stat = lstatSync(file)) {
  if (!path.isAbsolute(file) || realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() ||
      stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || (process.getuid && stat.uid !== process.getuid()))
    throw ledgerFailure("owned_child_ledger_unsafe");
  const parent = lstatSync(path.dirname(file));
  if (!parent.isDirectory() || parent.isSymbolicLink() || realpathSync(path.dirname(file)) !== path.dirname(file))
    throw ledgerFailure("owned_child_ledger_unsafe");
  return { schema: "augnes.owned-child-ledger.v1", location_fingerprint: ledgerDigest(file),
    device: String(stat.dev), inode: String(stat.ino), mode: stat.mode & 0o777, uid: stat.uid, gid: stat.gid,
    links: stat.nlink, parent_device: String(parent.dev), parent_inode: String(parent.ino) };
}

function assertLifecycleFile(file, identity, stat = lstatSync(file)) {
  const current = lifecycleFileIdentity(file, stat);
  if (!identity || Object.keys(current).length !== Object.keys(identity).length ||
      Object.entries(current).some(([key, value]) => identity[key] !== value))
    throw ledgerFailure("owned_child_ledger_owner_changed");
  if (stat.size > MAX_LIFECYCLE_BYTES) throw ledgerFailure("owned_child_ledger_overflow");
  return current;
}

// The caller supplies a new path in its existing owned private resource root.
// These helpers grant no path creation, adoption, or cleanup authority elsewhere.
export function initializeOwnedChildLifecycleFile(file) {
  if (!path.isAbsolute(file) || realpathSync(path.dirname(file)) !== path.dirname(file))
    throw ledgerFailure("owned_child_ledger_unsafe");
  const fd = openSync(file, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600);
  let identity;
  try { identity = lifecycleFileIdentity(file, fstatSync(fd)); }
  finally { closeSync(fd); }
  return { identity, environment: { AUGNES_CANONICAL_CHILD_LEDGER_PATH: file,
    AUGNES_CANONICAL_CHILD_LEDGER_IDENTITY: JSON.stringify(identity), [OWNED_CHILD_ANCESTORS_ENV]: "[]" } };
}

function lifecycleSelectionFromEnvironment(environment) {
  const file = environment.AUGNES_CANONICAL_CHILD_LEDGER_PATH;
  const selectedIdentity = environment.AUGNES_CANONICAL_CHILD_LEDGER_IDENTITY;
  if (file === undefined && selectedIdentity === undefined) {
    if (environment[OWNED_CHILD_ANCESTORS_ENV] && environment[OWNED_CHILD_ANCESTORS_ENV] !== "[]")
      throw ledgerFailure("owned_child_ledger_selection_missing");
    return;
  }
  if (!file || !selectedIdentity || selectedIdentity.length > 2048) throw ledgerFailure("owned_child_ledger_selection_missing");
  let identity;
  try { identity = JSON.parse(selectedIdentity); } catch { throw ledgerFailure("owned_child_ledger_selection_invalid"); }
  let ancestors;
  const encoded = environment[OWNED_CHILD_ANCESTORS_ENV] ?? "[]";
  if (typeof encoded !== "string" || encoded.length > 16384) throw ledgerFailure("owned_child_ledger_ancestors_invalid");
  try { ancestors = JSON.parse(encoded); } catch { throw ledgerFailure("owned_child_ledger_ancestors_invalid"); }
  return validateLifecycleSelection({ file, identity, ancestors });
}

function validateLifecycleSelection(selection) {
  const ancestors = selection.ancestors ?? [];
  if (!Array.isArray(ancestors) || ancestors.length > MAX_LEDGER_ANCESTORS)
    throw ledgerFailure("owned_child_ledger_ancestors_invalid");
  const files = new Set();
  for (const entry of [selection, ...ancestors]) {
    if (!entry || typeof entry.file !== "string" || !entry.identity || files.has(entry.file) ||
        (entry !== selection && (Object.keys(entry).length !== 2 || !Object.hasOwn(entry,"file") || !Object.hasOwn(entry,"identity"))))
      throw ledgerFailure("owned_child_ledger_ancestors_invalid");
    assertLifecycleFile(entry.file, entry.identity); files.add(entry.file);
  }
  return { file: selection.file, identity: structuredClone(selection.identity), ancestors: structuredClone(ancestors) };
}

// Only the execution selector calls this after verifying the parent manifest.
// This records into existing parent-owned files without adopting their cleanup.
export function inheritedOwnedChildLifecycleAncestors(environment) {
  const selected = lifecycleSelectionFromEnvironment(environment);
  if (!selected) return [];
  const ancestors = [{file:selected.file,identity:selected.identity}, ...selected.ancestors];
  if (ancestors.length > MAX_LEDGER_ANCESTORS) throw ledgerFailure("owned_child_ledger_ancestors_invalid");
  return ancestors;
}

function appendLifecycleSelection(selection, event) {
  validateLifecycleSelection(selection);
  for (const entry of [selection, ...(selection.ancestors ?? [])])
    appendOwnedChildLifecycleEvent(entry.file, entry.identity, event);
}

function appendSelectedOwnedChildLifecycleFile(event) {
  const selected = lifecycleSelectionFromEnvironment(process.env);
  if (selected) appendLifecycleSelection(selected, event);
}

export function appendOwnedChildLifecycleEvent(file, identity, event) {
  assertLifecycleFile(file, identity);
  const bytes = Buffer.from(`${JSON.stringify(event)}\n`);
  if (bytes.length > 2048) throw ledgerFailure("owned_child_event_invalid");
  const fd = openSync(file, constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = fstatSync(fd); assertLifecycleFile(file, identity, before);
    if (before.size + bytes.length > MAX_LIFECYCLE_BYTES) throw ledgerFailure("owned_child_ledger_overflow");
    if (writeSync(fd, bytes) !== bytes.length) throw ledgerFailure("owned_child_ledger_write_incomplete");
    assertLifecycleFile(file, identity, fstatSync(fd)); assertLifecycleFile(file, identity);
  } finally { closeSync(fd); }
}

// Bootstrap can bind its ledger before a selected environment exists. This
// scope applies only to synchronous calls; async owners keep their explicit
// registration/callback path and must not be double-counted.
export function withOwnedSyncLifecycle(selection, callback) {
  if (!selection || typeof callback !== "function") throw ledgerFailure("owned_child_ledger_selection_invalid");
  return syncLifecycleScope.run(validateLifecycleSelection(selection), callback);
}

function selectedSyncLifecycle() {
  const scoped = syncLifecycleScope.getStore();
  if (scoped) return scoped;
  return lifecycleSelectionFromEnvironment(process.env) ?? null;
}

function syncArguments(args, options) {
  if (Array.isArray(args)) return { args: [...args], options: options ?? {} };
  if (args != null && typeof args === "object") return { args: [], options: args };
  return { args: args ?? [], options: options ?? {} };
}

// Source-owned adapters preserve ordinary native calls outside a selection.
// Selected calls retain their arguments, streams and input while using the
// existing bounded child owner; no process-wide patch or preload is involved.
/**
 * @typedef {{schema: "augnes.owned-child-lifecycle.v1", child_id: string, observed_at: string}} OwnedChildLifecycleIdentity
 * @typedef {OwnedChildLifecycleIdentity & {event: "started", label_fingerprint: string}} OwnedChildLifecycleStart
 * @typedef {OwnedChildLifecycleIdentity & {event: "settled" | "unknown", exit_observed: boolean, streams_closed: boolean, exit_code: number | null, signal: NodeJS.Signals | null, remaining_owned_processes: number | null, reason?: string}} OwnedChildLifecycleTerminal
 * @typedef {OwnedChildLifecycleStart | OwnedChildLifecycleTerminal} OwnedChildLifecycleEvent
 */

/**
 * Native results are unchanged outside a selection, so lifecycle metadata is
 * optional. UNKNOWN/failed-dispatch paths throw; they are not result variants.
 * @template {string | import("node:buffer").NonSharedBuffer} T
 * @typedef {import("node:child_process").SpawnSyncReturns<T> & {owned_child_lifecycle_start?: OwnedChildLifecycleStart, owned_child_lifecycle?: OwnedChildLifecycleTerminal}} OwnedSyncResult
 */

/**
 * @overload
 * @param {string} command
 * @returns {OwnedSyncResult<import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {import("node:child_process").SpawnSyncOptionsWithStringEncoding} options
 * @returns {OwnedSyncResult<string>}
 */
/**
 * @overload
 * @param {string} command
 * @param {import("node:child_process").SpawnSyncOptionsWithBufferEncoding} options
 * @returns {OwnedSyncResult<import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 * @returns {OwnedSyncResult<string | import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @returns {OwnedSyncResult<import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptionsWithStringEncoding} options
 * @returns {OwnedSyncResult<string>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptionsWithBufferEncoding} options
 * @returns {OwnedSyncResult<import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} [args]
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 * @returns {OwnedSyncResult<string | import("node:buffer").NonSharedBuffer>}
 */
/**
 * @param {string} command
 * @param {readonly string[] | import("node:child_process").SpawnSyncOptions} [args]
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 * @returns {OwnedSyncResult<string | import("node:buffer").NonSharedBuffer>}
 */
export function ownedSpawnSync(command, args, options) {
  if (!selectedSyncLifecycle()) return spawnSync(command, args, options);
  const call = syncArguments(args, options);
  return runOwnedSyncChild(command, call.args, call.options);
}

/**
 * @overload
 * @param {string} command
 * @returns {import("node:buffer").NonSharedBuffer}
 */
/**
 * @overload
 * @param {string} command
 * @param {import("node:child_process").ExecFileSyncOptionsWithStringEncoding} options
 * @returns {string}
 */
/**
 * @overload
 * @param {string} command
 * @param {import("node:child_process").ExecFileSyncOptionsWithBufferEncoding} options
 * @returns {import("node:buffer").NonSharedBuffer}
 */
/**
 * @overload
 * @param {string} command
 * @param {import("node:child_process").ExecFileSyncOptions} [options]
 * @returns {string | import("node:buffer").NonSharedBuffer}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @returns {import("node:buffer").NonSharedBuffer}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").ExecFileSyncOptionsWithStringEncoding} options
 * @returns {string}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").ExecFileSyncOptionsWithBufferEncoding} options
 * @returns {import("node:buffer").NonSharedBuffer}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} [args]
 * @param {import("node:child_process").ExecFileSyncOptions} [options]
 * @returns {string | import("node:buffer").NonSharedBuffer}
 */
/**
 * @param {string} command
 * @param {readonly string[] | import("node:child_process").ExecFileSyncOptions} [args]
 * @param {import("node:child_process").ExecFileSyncOptions} [options]
 * @returns {string | import("node:buffer").NonSharedBuffer}
 */
export function ownedExecFileSync(command, args, options) {
  if (!selectedSyncLifecycle()) return execFileSync(command, args, options);
  const call = syncArguments(args, options);
  let result;
  try { result = runOwnedSyncChild(command, call.args, call.options); }
  catch (error) {
    if (error.result) {
      if (!call.options.stdio && error.result.stderr) process.stderr.write(error.result.stderr);
      Object.assign(error, error.result);
    }
    throw error;
  }
  if (!call.options.stdio && result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw Object.assign(result.error, result);
  if (result.status !== 0) {
    const message = `Command failed: ${[call.options.argv0 || command, ...call.args].join(" ")}` +
      (result.stderr?.length ? `\n${result.stderr.toString()}` : "");
    throw Object.assign(new Error(message), result);
  }
  return result.stdout;
}

// A synchronous dispatch registers before spawnSync can block. A failed spawn
// without a PID is conservatively UNKNOWN, not a claim that a child ran. The
// result preserves the original execution status, including a settled timeout.
// Fixed /bin/ps is the bounded observation primitive and is not recursively
// dispatched through this runner. No remaining process receives a signal here.
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @returns {OwnedSyncResult<import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptionsWithStringEncoding} options
 * @returns {OwnedSyncResult<string>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptionsWithBufferEncoding} options
 * @returns {OwnedSyncResult<import("node:buffer").NonSharedBuffer>}
 */
/**
 * @overload
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 * @returns {OwnedSyncResult<string | import("node:buffer").NonSharedBuffer>}
 */
/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 * @returns {OwnedSyncResult<string | import("node:buffer").NonSharedBuffer>}
 */
export function runOwnedSyncChild(command, args, options = {}) {
  const selection = selectedSyncLifecycle();
  if (!selection) return spawnSync(command, args, options);
  if (!["darwin", "linux"].includes(process.platform)) throw ledgerFailure("owned_sync_host_unsupported");
  const timeout = options.timeout ?? 30_000;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 120_000)
    throw ledgerFailure("owned_sync_timeout_invalid");
  const childId = randomBytes(16).toString("hex");
  const emit = event => {
    const value = { schema: OWNED_CHILD_LIFECYCLE_SCHEMA, child_id: childId,
      observed_at: new Date().toISOString(), ...event };
    appendLifecycleSelection(selection, value);
    return value;
  };
  const start = emit({ event: "started", label_fingerprint: ledgerDigest(`sync:${path.basename(String(command))}`) });
  let result = null, reason = null;
  try {
    // SIGKILL makes the supplied deadline finite even if the direct child
    // ignores TERM. Its detached group is observed after the synchronous wait.
    result = spawnSync(command, args, { ...options, detached: true, timeout, killSignal: "SIGKILL" });
    if (!Number.isSafeInteger(result.pid) || result.pid <= 0 || result.pid === process.pid)
      reason = "owned_sync_spawn_unconfirmed";
    else if (result.status === null && !result.signal) reason = "owned_sync_exit_unknown";
    else {
      let groupAbsent = false;
      try {
        // Signal zero only observes this detached child's group. ESRCH after
        // the direct wait proves there is no group left to inspect with ps.
        if (process.kill(-result.pid, 0) !== true) throw ledgerFailure("owned_process_observation_unknown");
      } catch (error) {
        if (error?.code === "ESRCH") groupAbsent = true;
        else throw ledgerFailure("owned_process_observation_unknown");
      }
      if (!groupAbsent && discoverOwnedProcessGroup(result.pid).length > 0) reason = "owned_sync_group_unsettled";
    }
  } catch (error) { reason = safeErrorCode(error?.code ?? "owned_sync_dispatch_failed"); }
  const exitObserved = Boolean(result && (Number.isInteger(result.status) || typeof result.signal === "string"));
  let terminal;
  try {
    terminal = emit({ event: reason === null ? "settled" : "unknown", exit_observed: exitObserved,
      streams_closed: Boolean(result), exit_code: Number.isInteger(result?.status) ? result.status : null,
      signal: typeof result?.signal === "string" ? result.signal : null,
      remaining_owned_processes: reason === null ? 0 : null, ...(reason ? { reason } : {}) });
  } catch (error) {
    throw Object.assign(error, { result, owned_child_lifecycle_start: start, owned_child_lifecycle: null });
  }
  if (reason) throw Object.assign(ledgerFailure(reason), { result,
    owned_child_lifecycle_start: start, owned_child_lifecycle: terminal });
  return Object.assign(result, { owned_child_lifecycle_start: start, owned_child_lifecycle: terminal });
}

export function readOwnedChildLifecycleFile(file, expectedIdentity) {
  assertLifecycleFile(file, expectedIdentity);
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = fstatSync(fd); assertLifecycleFile(file, expectedIdentity, before);
    const bytes = readFileSync(fd);
    const after = fstatSync(fd); assertLifecycleFile(file, expectedIdentity, after); assertLifecycleFile(file, expectedIdentity);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || bytes.length !== after.size)
      throw ledgerFailure("owned_child_ledger_observation_race");
    return { ...inspectOwnedChildLifecycleBytes(bytes), identity: expectedIdentity };
  } finally { closeSync(fd); }
}

// Cold readers validate retained bytes, not a recreated temporary runtime file.
export function inspectOwnedChildLifecycleBytes(value) {
  const bytes = Buffer.from(value);
  if (bytes.length > MAX_LIFECYCLE_BYTES) throw ledgerFailure("owned_child_ledger_overflow");
  const collector = createOwnedChildLifecycleCollector();
  if (bytes.length && bytes[bytes.length - 1] !== 10) throw ledgerFailure("owned_child_ledger_incomplete_record");
  if (!Buffer.from(bytes.toString("utf8")).equals(bytes)) throw ledgerFailure("owned_child_event_invalid");
  for (const line of bytes.length ? bytes.toString("utf8").slice(0, -1).split("\n") : []) {
    if (!line || Buffer.byteLength(line) > 2048) throw ledgerFailure("owned_child_event_invalid");
    let event; try { event = JSON.parse(line); } catch { throw ledgerFailure("owned_child_event_invalid"); }
    collector.record(event);
  }
  return { ...collector.snapshot(), content_sha256: ledgerDigest(bytes), bytes: bytes.length };
}

// This inventory starts at registration, not at matching successful result lines.
// A lost terminal event remains UNKNOWN even if another child completed cleanly.
export function createOwnedChildLifecycleCollector({ maximumChildren = MAX_OWNED_CHILD_REGISTRATIONS } = {}) {
  if (!Number.isSafeInteger(maximumChildren) || maximumChildren < 1 || maximumChildren > MAX_OWNED_CHILD_REGISTRATIONS)
    throw new TypeError("owned child inventory bound is invalid");
  const children = new Map(), issues = [];
  const issue = code => { if (!issues.includes(code) && issues.length < 16) issues.push(code); };
  const record = event => {
    if (!event || event.schema !== OWNED_CHILD_LIFECYCLE_SCHEMA || !lifecycleId(event.child_id) ||
        !lifecycleTime(event.observed_at) || !["started", "settled", "unknown"].includes(event.event)) {
      issue("owned_child_event_invalid"); return;
    }
    const keys = ["schema", "child_id", "observed_at", "event", ...(event.event === "started"
      ? ["label_fingerprint"] : ["exit_observed", "streams_closed", "exit_code", "signal", "remaining_owned_processes", ...(event.event === "unknown" ? ["reason"] : [])])];
    if (Object.keys(event).length !== keys.length || Object.keys(event).some(key => !keys.includes(key))) {
      issue("owned_child_event_invalid"); return;
    }
    const existing = children.get(event.child_id);
    if (event.event === "started") {
      if (existing) { issue("owned_child_start_duplicate"); return; }
      if (children.size >= maximumChildren) { issue("owned_child_inventory_overflow"); return; }
      if (typeof event.label_fingerprint !== "string" || !/^[0-9a-f]{64}$/u.test(event.label_fingerprint)) {
        issue("owned_child_event_invalid"); return;
      }
      children.set(event.child_id, { child_id: event.child_id, label_fingerprint: event.label_fingerprint,
        started_at: event.observed_at, terminal: null });
      return;
    }
    if (!existing) { issue("owned_child_start_missing"); return; }
    if (existing.terminal) { issue("owned_child_terminal_duplicate"); return; }
    if (Date.parse(event.observed_at) < Date.parse(existing.started_at) ||
        !(event.exit_code === null || Number.isSafeInteger(event.exit_code)) ||
        !(event.signal === null || (typeof event.signal === "string" && /^[A-Z0-9]{1,32}$/u.test(event.signal))) ||
        typeof event.exit_observed !== "boolean" || typeof event.streams_closed !== "boolean" ||
        (event.event === "settled" && (event.exit_observed !== true || event.streams_closed !== true ||
          event.remaining_owned_processes !== 0)) ||
        (event.event === "unknown" && (event.remaining_owned_processes !== null || typeof event.reason !== "string" || safeErrorCode(event.reason) !== event.reason))) {
      issue("owned_child_event_invalid"); return;
    }
    existing.terminal = structuredClone(event);
  };
  return Object.freeze({ record, snapshot: () => {
    const inventory = [...children.values()].map(child => ({ ...structuredClone(child),
      settlement: child.terminal?.event === "settled" ? "settled" : "UNKNOWN" }));
    return { schema: OWNED_CHILD_LIFECYCLE_SCHEMA, started_count: inventory.length,
      settled_count: inventory.filter(child => child.settlement === "settled").length,
      unknown_count: inventory.filter(child => child.settlement === "UNKNOWN").length,
      complete: inventory.length > 0 && issues.length === 0 && inventory.every(child => child.settlement === "settled"),
      issues: [...issues], children: inventory };
  } });
}

function publishOwnedChildLifecycle(record, event) {
  const value = { schema: OWNED_CHILD_LIFECYCLE_SCHEMA, child_id: record.lifecycleId,
    observed_at: new Date().toISOString(), ...event };
  try {
    appendSelectedOwnedChildLifecycleFile(value);
    record.onLifecycle?.(structuredClone(value));
    if (process.env.AUGNES_CANONICAL_CHILD_LEDGER === "1")
      process.stdout.write(`${OWNED_CHILD_LIFECYCLE_PREFIX}${JSON.stringify(value)}\n`);
  } catch { record.lifecycleEvidenceFailed = true; }
  return value;
}

function finishOwnedChildLifecycle(record, reason = null) {
  if (!record || record.lifecycleTerminal) return;
  const settled = reason === null && record.exited && record.closed && record.stdoutClosed && record.stderrClosed;
  record.lifecycleTerminal = publishOwnedChildLifecycle(record, { event: settled ? "settled" : "unknown",
    exit_observed: record.exited, streams_closed: record.stdoutClosed && record.stderrClosed,
    exit_code: record.closeResult?.code ?? null, signal: record.closeResult?.signal ?? null,
    remaining_owned_processes: settled ? 0 : null,
    ...(settled ? {} : { reason: safeErrorCode(reason ?? "owned_process_settlement_unknown") }) });
}

const DEFAULT_TERM_GRACE_MS = 5_000;
const DEFAULT_KILL_GRACE_MS = 5_000;
const PROCESS_SNAPSHOT_TIMEOUT_MS = 2_000;
const TASKKILL_TIMEOUT_MS = 3_000;
const SERVER_CLOSE_TIMEOUT_MS = 3_000;
const trackedServerSockets = new WeakMap();

export class OwnedProcessTimeoutError extends Error {
  constructor(label, timeoutMs) {
    super(`owned process timed out: label=${safeLabel(label)} timeout_ms=${timeoutMs}`);
    this.name = "OwnedProcessTimeoutError";
    this.code = "owned_process_timeout";
  }
}

export function registerOwnedChild(owner, child, { label = "test-child", onLifecycle } = {}) {
  if (!(owner instanceof Set)) throw new TypeError("owned process owner must be a Set");
  if (!child) throw new Error("owned process spawn failed");

  let resolveExit;
  let resolveClose;
  const record = {
    child,
    owner,
    lifecycleId: randomBytes(16).toString("hex"),
    lifecycleTerminal: null,
    lifecycleEvidenceFailed: false,
    onLifecycle,
    label: safeLabel(label),
    pid: Number.isInteger(child.pid) && child.pid > 0 ? child.pid : null,
    exited: false,
    exitResult: null,
    closed: false,
    closeResult: null,
    spawnErrorCode: null,
    stdoutClosed: child.stdout === null,
    stderrClosed: child.stderr === null,
    exitPromise: new Promise((resolve) => {
      resolveExit = resolve;
    }),
    closePromise: new Promise((resolve) => {
      resolveClose = resolve;
    }),
  };
  owner.add(record);

  child.once("error", (error) => {
    record.spawnErrorCode = safeErrorCode(error?.code);
  });
  child.once("exit", (code, signal) => {
    record.exited = true;
    record.exitResult = {
      code: Number.isInteger(code) ? code : null,
      signal: typeof signal === "string" ? signal : null,
    };
    resolveExit(record.exitResult);
  });
  child.stdout?.once("close", () => {
    record.stdoutClosed = true;
  });
  child.stderr?.once("close", () => {
    record.stderrClosed = true;
  });
  child.once("close", (code, signal) => {
    if (!record.exited) {
      record.exited = true;
      record.exitResult = {
        code: Number.isInteger(code) ? code : null,
        signal: typeof signal === "string" ? signal : null,
      };
      resolveExit(record.exitResult);
    }
    record.closed = true;
    record.closeResult = {
      code: Number.isInteger(code) ? code : null,
      signal: typeof signal === "string" ? signal : null,
    };
    // Stream closure is not process-tree settlement. Keep the record until the
    // existing cleanup owner proves the group is gone, including descendants.
    resolveClose(record.closeResult);
  });
  record.lifecycleStart = publishOwnedChildLifecycle(record, { event: "started", label_fingerprint: createHash("sha256").update(record.label).digest("hex") });
  return record;
}

export async function waitForOwnedProcessExit(
  record,
  timeoutMs,
  terminationOptions = {},
) {
  if (record.closed) {
    await terminateOwnedProcessTree(record, terminationOptions);
    return record.closeResult;
  }
  let timeout;
  const outcome = await Promise.race([
    record.exitPromise.then((value) => ({ kind: "exited", value })),
    record.closePromise.then((value) => ({ kind: "closed", value })),
    new Promise((resolve) => {
      timeout = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
    }),
  ]);
  clearTimeout(timeout);
  if (outcome.kind === "closed") {
    await terminateOwnedProcessTree(record, terminationOptions);
    return outcome.value;
  }
  if (outcome.kind === "exited") {
    await terminateOwnedProcessTree(record, terminationOptions);
    return record.closeResult ?? outcome.value;
  }

  await terminateOwnedProcessTree(record, terminationOptions);
  throw new OwnedProcessTimeoutError(record.label, timeoutMs);
}

export async function settleOwnedProcessAfterExit(
  record,
  {
    streamDrainMs = 1_000,
    termGraceMs = DEFAULT_TERM_GRACE_MS,
    killGraceMs = DEFAULT_KILL_GRACE_MS,
  } = {},
) {
  if (!record?.exited && !record?.closed) {
    throw new TypeError("owned process has not exited");
  }
  const closedDuringDrain = await waitForRecordClose(record, streamDrainMs);
  const termination = await terminateOwnedProcessTree(record, {
    termGraceMs,
    killGraceMs,
  });
  return {
    ...termination,
    closed_during_drain: closedDuringDrain,
    stdout_closed: record.stdoutClosed,
    stderr_closed: record.stderrClosed,
    remaining_owned_processes: 0,
  };
}

export async function terminateOwnedProcessTree(
  record,
  options = {},
) {
  try {
    const result = await terminateOwnedProcessTreeImpl(record, options);
    finishOwnedChildLifecycle(record);
    if (record && record.lifecycleTerminal?.event !== "settled")
      throw ledgerFailure("owned_process_settlement_unknown");
    if (record?.lifecycleTerminal?.event === "settled") record.owner.delete(record);
    if (record?.lifecycleEvidenceFailed) throw Object.assign(new Error("owned process lifecycle evidence failed"), { code: "owned_process_evidence_failed" });
    return result;
  } catch (error) {
    finishOwnedChildLifecycle(record, error?.code);
    error.owned_child_lifecycle = record?.lifecycleTerminal ?? null;
    throw error;
  }
}

async function terminateOwnedProcessTreeImpl(
  record,
  {
    termGraceMs = DEFAULT_TERM_GRACE_MS,
    killGraceMs = DEFAULT_KILL_GRACE_MS,
  } = {},
) {
  if (!record) return { term_sent: false, kill_sent: false };
  if (record.exited || record.closed) {
    if (
      process.platform === "win32" ||
      !Number.isInteger(record.pid) ||
      record.pid <= 0
    ) {
      return { term_sent: false, kill_sent: false };
    }
    const remainingGroup = discoverOwnedProcessGroup(record.pid);
    if (remainingGroup.length === 0) {
      closeChildStreams(record.child);
      if (!(await waitForRecordClose(record, killGraceMs))) {
        throw ownedCleanupError();
      }
      return { term_sent: false, kill_sent: false };
    }
    signalVerifiedOwnedProcesses(remainingGroup, "SIGTERM");
    if (await waitForVerifiedProcessesExit(remainingGroup, termGraceMs)) {
      closeChildStreams(record.child);
      if (!(await waitForRecordClose(record, killGraceMs))) {
        throw ownedCleanupError();
      }
      return { term_sent: true, kill_sent: false };
    }
    signalVerifiedOwnedProcesses(remainingGroup, "SIGKILL");
    const groupExited = await waitForVerifiedProcessesExit(
      remainingGroup,
      killGraceMs,
    );
    closeChildStreams(record.child);
    const closed = await waitForRecordClose(record, killGraceMs);
    if (!groupExited || !closed) throw ownedCleanupError();
    return { term_sent: true, kill_sent: true };
  }
  if (!Number.isInteger(record.pid) || record.pid <= 0) {
    if (!(await waitForRecordClose(record, killGraceMs))) throw ownedCleanupError();
    return { term_sent: false, kill_sent: false };
  }

  if (process.platform === "win32") {
    runTaskkill(record.pid, false);
    if (await waitForRecordClose(record, termGraceMs)) {
      closeChildStreams(record.child);
      return { term_sent: true, kill_sent: false };
    }
    runTaskkill(record.pid, true);
    if (!(await waitForRecordClose(record, killGraceMs))) {
      throw ownedCleanupError();
    }
    closeChildStreams(record.child);
    return { term_sent: true, kill_sent: true };
  }

  const owned = discoverOwnedProcessTree(record.pid);
  signalVerifiedOwnedProcesses(owned, "SIGTERM");
  if (
    (await waitForRecordClose(record, termGraceMs)) &&
    (await waitForVerifiedProcessesExit(owned, 0))
  ) {
    closeChildStreams(record.child);
    return { term_sent: true, kill_sent: false };
  }

  signalVerifiedOwnedProcesses(owned, "SIGKILL");
  const [closed, treeExited] = await Promise.all([
    waitForRecordClose(record, killGraceMs),
    waitForVerifiedProcessesExit(owned, killGraceMs),
  ]);
  closeChildStreams(record.child);
  if (!closed || !treeExited) throw ownedCleanupError();
  return { term_sent: true, kill_sent: true };
}

export async function cleanupOwnedProcesses(owner, options = {}) {
  const errors = [];
  for (const record of [...owner]) {
    try {
      await terminateOwnedProcessTree(record, options);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    const error = new Error("owned process cleanup failed");
    error.code = "owned_process_cleanup_failed";
    error.causes = errors.map((cause) => safeErrorCode(cause?.code));
    throw error;
  }
}

export function trackServerConnections(server) {
  if (!server || trackedServerSockets.has(server)) return server;
  const sockets = new Set();
  trackedServerSockets.set(server, sockets);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });
  return server;
}

export async function closeTrackedServer(
  server,
  { timeoutMs = SERVER_CLOSE_TIMEOUT_MS } = {},
) {
  if (!server) return;
  const sockets = trackedServerSockets.get(server) ?? server.testSockets ?? new Set();
  for (const socket of sockets) socket.destroy();
  server.closeAllConnections?.();
  server.closeIdleConnections?.();
  if (!server.listening) return;

  let settled = false;
  let closeError = null;
  const closed = new Promise((resolve) => {
    server.close((error) => {
      settled = true;
      closeError = error ?? null;
      resolve();
    });
  });
  const finished = await completesWithin(closed, timeoutMs);
  if (!finished) {
    for (const socket of sockets) socket.destroy();
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    await completesWithin(closed, 250);
  }
  if (!settled || server.listening) {
    const error = new Error("owned server close timed out");
    error.code = "owned_server_close_timeout";
    throw error;
  }
  if (closeError) throw closeError;
}

function discoverOwnedProcessTree(rootPid) {
  const snapshot = readPosixProcessSnapshot();
  const root = snapshot.get(rootPid);
  if (!root) {
    throw Object.assign(new Error("owned process identity unavailable"), { code: "owned_process_observation_unknown" });
  }

  const ownedPids = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const processRecord of snapshot.values()) {
      if (ownedPids.has(processRecord.pid) || !ownedPids.has(processRecord.ppid)) {
        continue;
      }
      ownedPids.add(processRecord.pid);
      changed = true;
    }
  }
  return [...ownedPids]
    .map((pid) => snapshot.get(pid))
    .filter(Boolean)
    .sort((left, right) => right.pid - left.pid);
}

function discoverOwnedProcessGroup(rootPid) {
  return [...readPosixProcessSnapshot().values()]
    .filter(
      (record) => record.pgid === rootPid && !record.state.startsWith("Z"),
    )
    .sort((left, right) => right.pid - left.pid);
}

function readPosixProcessSnapshot() {
  const result = spawnSync(
    "/bin/ps",
    ["-axo", "pid=,ppid=,pgid=,state=,lstart="],
    {
      encoding: "utf8",
      timeout: PROCESS_SNAPSHOT_TIMEOUT_MS,
      windowsHide: true,
    },
  );
  const snapshot = new Map();
  if (result.status !== 0 || result.error || typeof result.stdout !== "string" || !result.stdout.trim())
    throw Object.assign(new Error("owned process observation unavailable"), { code: "owned_process_observation_unknown" });
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+?)\s*$/);
    if (!match) throw Object.assign(new Error("owned process observation incomplete"), { code: "owned_process_observation_unknown" });
    if (![match[1], match[2], match[3]].every(value => Number.isSafeInteger(Number(value))) ||
        Number(match[1]) <= 0 || Number(match[3]) < 0 || snapshot.has(Number(match[1])))
      throw Object.assign(new Error("owned process observation ambiguous"), { code: "owned_process_observation_unknown" });
    snapshot.set(Number(match[1]), {
      pid: Number(match[1]),
      ppid: Number(match[2]),
      pgid: Number(match[3]),
      state: match[4],
      started: match[5],
    });
  }
  if (!snapshot.has(process.pid))
    throw Object.assign(new Error("owned process observation incomplete"), { code: "owned_process_observation_unknown" });
  return snapshot;
}

function signalVerifiedOwnedProcesses(owned, signal) {
  const current = readPosixProcessSnapshot();
  const verified = owned.filter((record) => {
    const candidate = current.get(record.pid);
    if (!candidate) return false;
    if (record.started === null) return record.pid === candidate.pid;
    return candidate.pgid === record.pgid && candidate.started === record.started;
  });
  const groups = new Set(
    verified
      .map((record) => record.pgid)
      .filter((pgid) => Number.isInteger(pgid) && pgid > 0),
  );
  const signaledGroups = new Set();
  for (const pgid of groups) {
    if (safeKill(-pgid, signal)) signaledGroups.add(pgid);
  }
  for (const record of verified) {
    if (!signaledGroups.has(record.pgid)) safeKill(record.pid, signal);
  }
}

async function waitForVerifiedProcessesExit(owned, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  do {
    const current = readPosixProcessSnapshot();
    const alive = owned.some((record) => {
      const candidate = current.get(record.pid);
      if (!candidate || candidate.state.startsWith("Z")) return false;
      if (record.started === null) return candidate.pid === record.pid;
      return candidate.pgid === record.pgid && candidate.started === record.started;
    });
    if (!alive) return true;
    if (Date.now() >= deadline) return false;
    await delay(50);
  } while (true);
}

async function waitForRecordClose(record, timeoutMs) {
  if (record.closed) return true;
  return completesWithin(record.closePromise, timeoutMs);
}

// A completed close must release its deadline too. Leaving the losing timer
// referenced keeps an otherwise settled test process alive until that deadline.
async function completesWithin(promise, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise.then(() => true),
      new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

function runTaskkill(pid, force) {
  const args = ["/PID", String(pid), "/T"];
  if (force) args.push("/F");
  spawnSync("taskkill", args, {
    stdio: "ignore",
    timeout: TASKKILL_TIMEOUT_MS,
    windowsHide: true,
  });
}

function safeKill(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch (error) {
    if (!["EPERM", "ESRCH"].includes(error?.code)) throw error;
    return false;
  }
}

function closeChildStreams(child) {
  for (const stream of [child.stdin, child.stdout, child.stderr]) {
    if (stream && !stream.destroyed) stream.destroy();
  }
}

function ownedCleanupError() {
  const error = new Error("owned process tree cleanup failed");
  error.code = "owned_process_tree_cleanup_failed";
  return error;
}

function safeLabel(value) {
  return String(value ?? "test-child")
    .replace(/[^a-zA-Z0-9 _.,:()/-]/g, "?")
    .slice(0, 160);
}

function safeErrorCode(value) {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value)
    ? value
    : "unknown";
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
