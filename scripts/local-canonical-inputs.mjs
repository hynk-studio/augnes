import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";

export const INPUT_CONTRACT = "augnes.local-canonical-inputs.v2";
export const INPUT_CLASSES = Object.freeze(["execution", "safety", "ambient", "unknown"]);
export const EXCLUDED_PREFERENCES = Object.freeze(["model", "model_reasoning_effort", "service_tier"]);
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
export const digest = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(sorted(value))).digest("hex");
const fail = code => Object.assign(new Error(code), { code });

// No TOML value or complete source is retained. Only unambiguous one-line,
// unescaped top-level declarations in the leading scalar block can be masked.
// Unsupported syntax closes that block. Every other byte remains in the digest,
// including whitespace/comments, tables, trust, credentials and duplicate keys.
// This is deliberately a conservative lexical exclusion, not a TOML editor.
export function preferenceProjection(bytes) {
  const source = bytes.toString("utf8");
  if (!Buffer.from(source).equals(Buffer.from(bytes))) throw fail("input_invalid_utf8");
  const seen = new Set(), projection = {}, remainder = [];
  let leading = true;
  for (const line of source.match(/[^\n]*\n|[^\n]+$/gu) ?? []) {
    const text = line.replace(/\r?\n$/u, "");
    if (leading && /^\s*(?:#.*)?$/u.test(text)) { remainder.push(line); continue; }
    const scalar = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("[A-Za-z0-9_.+ -]*"|'[A-Za-z0-9_.+ -]*'|true|false|[0-9]+)\s*(?:#.*)?$/u.exec(text);
    if (!scalar) leading = false;
    if (leading && EXCLUDED_PREFERENCES.includes(scalar[1]) && !seen.has(scalar[1])) {
      seen.add(scalar[1]);
      const value = scalar[2].slice(1, -1);
      const safe = scalar[1] === "model" ? /^[a-z][a-z0-9_.-]{0,63}$/u.test(value) :
        scalar[1] === "model_reasoning_effort" ? /^(none|minimal|low|medium|high|xhigh|max|ultra)$/u.test(value) : /^(auto|default|priority|flex)$/u.test(value);
      if (safe && /^['"]/u.test(scalar[2])) {
        projection[scalar[1]] = value;
        // Retain the declaration and all surrounding bytes; mask only its value.
        remainder.push(line.replace(scalar[2], '"<excluded>"'));
        continue;
      }
    }
    remainder.push(line);
  }
  return { projection, remainder_sha256: digest(remainder.join("")) };
}

export function observeInputFile(file, { metadataOnly = false, preferences = false, readOnlyExecutable = false } = {}) {
  let stat;
  try { stat = lstatSync(file, { bigint: true }); }
  catch (error) { if (error.code === "ENOENT") return { present: false }; throw error; }
  // Existing shared executables are read/execute inputs, never cleanup targets.
  // Retain their complete observation; the role-aware comparator separately
  // classifies incidental link/ctime changes rather than requiring a private
  // inode. Configurations and mutable resources retain single-link refusal.
  const sharedPosix = ["darwin", "linux"].includes(process.platform);
  const allowedLinks = s => readOnlyExecutable && sharedPosix ? s.nlink > 0n && (s.mode & 0o111n) !== 0n : s.nlink === 1n;
  if (!stat.isFile() || stat.isSymbolicLink() || !allowedLinks(stat) || realpathSync(file) !== file)
    throw fail("input_unsafe_file");
  if (preferences && stat.size > 1024n * 1024n) throw fail("input_comparison_bound_exceeded");
  const securityBefore = readOnlyExecutable ? executablePermissions(file) : null;
  const metadata = s => ({ mode: String(s.mode), uid: String(s.uid), gid: String(s.gid), links: String(s.nlink),
    device: String(s.dev), inode: String(s.ino), bytes: String(s.size), mtime_ns: String(s.mtimeNs), ctime_ns: String(s.ctimeNs) });
  if (metadataOnly) return { present: true, metadata: metadata(stat), ...(readOnlyExecutable ? { permission_identity: securityBefore, executable_identity_policy: sharedPosix ? "shared-posix-v1" : "strict-metadata-v1" } : {}), observation: "metadata_only" };
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = fstatSync(fd, { bigint: true });
    if (before.ino !== stat.ino || before.dev !== stat.dev || before.nlink !== stat.nlink || !allowedLinks(before)) throw fail("input_observation_race");
    const bytes = readFileSync(fd);
    const after = fstatSync(fd, { bigint: true }), named = lstatSync(file, { bigint: true });
    if (JSON.stringify(metadata(before)) !== JSON.stringify(metadata(after)) || named.ino !== after.ino || named.dev !== after.dev)
      throw fail("input_observation_race");
    const securityAfter = readOnlyExecutable ? executablePermissions(file) : null;
    if (digest(securityBefore) !== digest(securityAfter)) throw fail("input_observation_race");
    return { present: true, metadata: metadata(after), sha256: digest(bytes),
      ...(readOnlyExecutable ? { permission_identity: securityAfter, executable_identity_policy: sharedPosix ? "shared-posix-v1" : "strict-metadata-v1" } : {}),
      ...(preferences ? preferenceProjection(bytes) : {}) };
  } finally { closeSync(fd); }
}

export const nonFaultInputChange = disposition => ["unchanged", "ambient_observation", "incidental_executable_metadata"].includes(disposition);

export function classifyInputChange(before, after, { classification, excludePreferences = false, readOnlyExecutable = false } = {}) {
  if (!INPUT_CLASSES.includes(classification) || !before || !after || typeof before !== "object" || typeof after !== "object" || Array.isArray(before) || Array.isArray(after)) return "unknown_relevance";
  const usableExecutable = value => value.present === true && /^[0-9a-f]{64}$/u.test(value.sha256 ?? "") &&
    ["mode", "uid", "gid", "device", "inode", "bytes", "mtime_ns", "ctime_ns", "links"].every(key => /^\d{1,40}$/u.test(value.metadata?.[key] ?? "")) &&
    /^[0-9a-f]{64}$/u.test(value.permission_identity ?? "") && ["shared-posix-v1", "strict-metadata-v1"].includes(value.executable_identity_policy) && BigInt(value.metadata.links) > 0n && (BigInt(value.metadata.mode) & 0o170000n) === 0o100000n && (value.executable_identity_policy === "strict-metadata-v1" || (BigInt(value.metadata.mode) & 0o111n) !== 0n);
  if (readOnlyExecutable && before.present === true && after.present === true &&
      (classification !== "execution" || !usableExecutable(before) || !usableExecutable(after))) return "unknown_relevance";
  // Saved receipts sort object keys. Compare the same canonical value both
  // in-process and after a supported persisted-state read.
  if (digest(before) === digest(after)) return "unchanged";
  if (before.present !== after.present) return classification === "safety" ? "safety_violation" : "input_invalidation";
  if (before.present === false) return "unchanged";
  for (const key of ["mode", "uid", "gid", "device", ...(readOnlyExecutable ? ["inode"] : ["links"])])
    if (before.metadata?.[key] !== after.metadata?.[key]) return "safety_violation";
  if (readOnlyExecutable && (before.permission_identity !== after.permission_identity || before.executable_identity_policy !== after.executable_identity_policy)) return "safety_violation";
  if (readOnlyExecutable && before.executable_identity_policy === "strict-metadata-v1")
    return before.metadata.links !== after.metadata.links ? "safety_violation" : "input_invalidation";
  if (readOnlyExecutable && classification === "execution") {
    // An existing shared executable is never a write/cleanup target. An alias
    // count or ctime observation does not change the consumed bytes or authority.
    // Compare a complete observation, not a metadata hint; retain both originals.
    const consumed = value => ({ ...value, metadata: Object.fromEntries(Object.entries(value.metadata).filter(([key]) => !["links", "ctime_ns"].includes(key))) });
    if (digest(consumed(before)) === digest(consumed(after))) return "incidental_executable_metadata";
    return "input_invalidation";
  }
  if (classification === "ambient" && excludePreferences && before.remainder_sha256 &&
      before.remainder_sha256 === after.remainder_sha256) return "ambient_observation";
  if (classification === "ambient" || classification === "unknown") return "unknown_relevance";
  // Content-equivalent inode/mtime replacement is only excluded above, never
  // silently accepted for declared execution inputs or metadata-only credentials.
  return classification === "safety" ? "safety_violation" : "input_invalidation";
}

export function freezeInputContract({ resources, pathKind, binding, read = observeInputFile }) {
  if (!Array.isArray(resources) || resources.length === 0 || !resources.every(r => r && typeof r === "object") || new Set(resources.map(r => r.id)).size !== resources.length)
    throw fail("input_inventory_invalid");
  const selected = resources.map(resource => {
    if (!/^[a-z][a-z0-9_-]{0,79}$/u.test(resource.id) || !INPUT_CLASSES.includes(resource.classification)) throw fail("input_inventory_invalid");
    if (resource.readOnlyExecutable && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences)) throw fail("input_executable_role_invalid");
    if (resource.excludePreferences && (pathKind !== "isolated-model-free-v1" || resource.classification !== "ambient")) throw fail("input_exclusion_unproven");
    return { ...resource, before: read(resource.file, { metadataOnly: resource.metadataOnly, preferences: resource.excludePreferences, readOnlyExecutable: resource.readOnlyExecutable }) };
  });
  const declared = { contract: INPUT_CONTRACT, path_kind: pathKind, binding,
    resources: selected.map(({ file, ...r }) => ({ ...r, location_fingerprint: digest(file) })) };
  // File locations stay in this closure. They never enter receipts or exports.
  const frozen = JSON.parse(JSON.stringify(declared));
  const fingerprint = digest(frozen);
  const events = [], secondary = [];
  let firstFault = null, checks = 0, observationOverflow = false;
  const check = ({ force = false } = {}) => {
    checks++;
    for (const resource of selected) {
      let after, disposition;
      try {
        // Large immutable executables use exact metadata as a polling hint;
        // the final check always rehashes. Small configuration/input files are
        // reread each time. This is an observation optimization, not exclusion.
        const hint = !force && Number(resource.before.metadata?.bytes) > 1024 * 1024
          ? read(resource.file, { metadataOnly: true, readOnlyExecutable: resource.readOnlyExecutable }) : null;
        after = hint && hint.permission_identity === resource.before.permission_identity && JSON.stringify(hint.metadata) === JSON.stringify(resource.before.metadata)
          ? resource.before : read(resource.file, { metadataOnly: resource.metadataOnly, preferences: resource.excludePreferences, readOnlyExecutable: resource.readOnlyExecutable });
        disposition = classifyInputChange(resource.before, after, resource);
      } catch { disposition = "observer_failure"; after = null; }
      if (disposition === "unchanged") continue;
      const key = digest([resource.id, disposition, after]);
      if (events.some(event => event.identity === key)) continue;
      const event = { resource: resource.id, classification: resource.classification, disposition,
        observed_at: new Date().toISOString(), monotonic_ns: String(process.hrtime.bigint()), identity: key, after };
      // A bounded observer cannot silently drop a relevant event.
      if (events.length >= 64) { disposition = "observer_failure"; observationOverflow = true; }
      else events.push(event);
      if (!nonFaultInputChange(disposition)) {
        const fault = { resource: resource.id, disposition, observed_at: event.observed_at, monotonic_ns: event.monotonic_ns };
        if (!firstFault) firstFault = fault; else if (secondary.length < 16) secondary.push(fault); else observationOverflow = true;
      }
    }
    return firstFault;
  };
  const reportObserverFault = (resource, disposition = "safety_violation") => {
    if (!["safety_violation", "input_invalidation", "observer_failure"].includes(disposition) || !/^[a-z][a-z0-9_-]{0,79}$/u.test(resource)) throw fail("safety_event_invalid");
    const identity = digest([resource, disposition, null]);
    if (events.some(e => e.identity === identity)) return;
    const event = { resource, classification: disposition === "input_invalidation" ? "execution" : "safety", disposition,
      observed_at: new Date().toISOString(), monotonic_ns: String(process.hrtime.bigint()), after: null, identity };
    if (events.length < 64) events.push(event); else observationOverflow = true;
    const fault = { resource, disposition, observed_at: event.observed_at, monotonic_ns: event.monotonic_ns };
    if (!firstFault) firstFault = fault;
    else if (secondary.length < 16) secondary.push(fault); else observationOverflow = true;
  };
  const reportSafetyEvent = reason => {
    if (!["unauthorized_task_write", "foreign_resource_interference", "installed_service_change", "credential_exposure", "ownership_change"].includes(reason)) throw fail("safety_event_invalid");
    reportObserverFault(reason);
  };
  return Object.freeze({ check, reportSafetyEvent, reportObserverFault, snapshot: () => ({ ...frozen, fingerprint, checks, events: structuredClone(events),
    first_fault: firstFault, secondary_faults: structuredClone(secondary), observation_overflow: observationOverflow,
    limitations: ["bounded polling cannot exclude transient changes between observations", "metadata timestamps are not observed write times", "cooperative ownership is not hostile-user isolation"] }) });
}

// Cancellation uses the executor's controller capability, never a PID or a
// foreign process name. runCanonicalChild owns TERM/drain/settlement.
export function monitorInputContract(contract, controller, { intervalMs = 1000, assertOwner = () => {} } = {}) {
  let stopped = false, ownerFault = null, latchedFault = null;
  const check = () => {
    if (stopped) return null;
    latchedFault ??= contract.snapshot().first_fault;
    try { assertOwner(); } catch (error) { ownerFault ??= { disposition: error?.code === "source_input_changed" ? "input_invalidation" : "safety_violation", resource: error?.code === "source_input_changed" ? "source" : "ownership", observed_at: new Date().toISOString(), monotonic_ns: String(process.hrtime.bigint()) }; }
    if (ownerFault) contract.reportObserverFault(ownerFault.resource, ownerFault.disposition);
    latchedFault ??= contract.snapshot().first_fault;
    const observed = contract.check();
    latchedFault ??= observed;
    const fault = latchedFault;
    if (fault && !controller.signal.aborted) controller.abort(fault);
    return fault;
  };
  check();
  const timer = setInterval(check, intervalMs);
  timer.unref();
  return { check, stop: () => { check(); contract.check({ force: true }); stopped = true; clearInterval(timer); }, fault: () => latchedFault ?? contract.snapshot().first_fault };
}

export function deriveOperationalDisposition({ phases = [], admitted = true, fault = null, cancelled = false, cleanup = false }) {
  if (!Array.isArray(phases) || !phases.every(p => p && typeof p === "object")) return "unknown_relevance";
  if (fault) return ["safety_violation", "input_invalidation"].includes(fault.disposition) ? fault.disposition : "unknown_relevance";
  if (!cleanup && phases.some(p => p.status !== "not_run")) return "cleanup_incomplete";
  if (!admitted || phases.every(p => p.status === "not_run")) return "admission_blocked";
  if (cancelled || phases.some(p => p.failure_code === "phase_cancelled")) return "user_cancellation";
  if (phases.some(p => p.timed_out)) return "unclassified_timeout";
  if (phases.some(p => p.failure_code === "browser_identity_invalid")) return "input_invalidation";
  // Only a child spawn failure has direct infrastructure causality here.
  // Assertion exits and timeouts cannot enter this lane by operator relabeling.
  if (phases.some(p => ["ENOENT", "EAGAIN", "EMFILE", "ENFILE", "ENOSPC"].includes(p.spawn_error_code))) return "infrastructure_interruption";
  if (phases.some(p => p.status === "failure")) return "product_failure";
  return phases.length > 0 && phases.every(p => p.status === "pass") && cleanup ? "completed_success" : "coverage_incomplete";
}

// A role exemption cannot hide ACL or file-flag changes behind stable Unix mode
// bits. These fixed read-only OS tools return only a fingerprint to callers.
// No ACL, principal name, attribute contents or complete command output persists.
function executablePermissions(file) {
  const run = (tool, args) => execFileSync(tool, args, { timeout: 2000, maxBuffer: 64 * 1024, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { PATH: "/usr/bin:/bin", LC_ALL: "C" } });
  if (process.platform === "darwin") {
    const lines = run("/bin/ls", ["-lde", file]).trimEnd().split("\n");
    if (!/^-[rwxstST-]{9}[+@ ]/u.test(lines[0] ?? "") || lines.slice(1).some(line => !/^ [0-9]+: /u.test(line))) throw fail("input_executable_permissions_unknown");
    const flags = run("/usr/bin/stat", ["-f", "%f", file]).trim();
    if (!/^\d+$/u.test(flags)) throw fail("input_executable_permissions_unknown");
    return digest({ contract: "posix-executable-permissions.v1", acl: lines.slice(1), flags, extended_attributes_sha256: digest(run("/usr/bin/xattr", ["-lx", file])) });
  }
  if (process.platform === "linux") {
    // Portable focused controls may prove an ordinary mode-only file. A '+'
    // ACL or security-context marker is unknown here, not silently excluded.
    const value = run("/bin/ls", ["-ld", "--", file]);
    if (!/^-[rwxstST-]{9} /u.test(value)) throw fail("input_executable_permissions_unknown");
    return digest({ contract: "posix-executable-permissions.v1", acl: [], flags: "linux-mode-only" });
  }
  // Other admitted platforms retain the older complete metadata equality rule;
  // this increment grants them no incidental-metadata exemption.
  return digest("strict-metadata-v1");
}
