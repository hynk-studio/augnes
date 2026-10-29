import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { createBrowserBundleObserver, compareBrowserBundle } from "./local-canonical-browser-bundle.mjs";

export const INPUT_CONTRACT = "augnes.local-canonical-inputs.v3";
export const LEGACY_INPUT_CONTRACT = "augnes.local-canonical-inputs.v2";
export const supportedInputContract = value => [LEGACY_INPUT_CONTRACT, INPUT_CONTRACT].includes(value);
export const INPUT_CLASSES = Object.freeze(["execution", "safety", "ambient", "unknown"]);
export const EXCLUDED_PREFERENCES = Object.freeze(["model", "model_reasoning_effort", "service_tier"]);
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
export const digest = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(sorted(value))).digest("hex");
const fail = code => Object.assign(new Error(code), { code });

// This resource-level discriminator leaves all earlier v2/v3 declarations and
// their recorded faults under the original whole-file interpretation.
const GIT_TRACKING_POLICY = "isolated-current-branches-v1";
const sha = value => typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
const safeBranch = value => /^[A-Za-z0-9_][A-Za-z0-9_./+-]*$/u.test(value) &&
  !value.includes("..") && !value.includes("//") && !value.endsWith("/") &&
  value.split("/").every(part => part && !part.startsWith(".") && !part.endsWith(".") && !part.endsWith(".lock"));

function gitTrackingContext(file, roots) {
  if (!Array.isArray(roots) || roots.length < 1 || roots.length > 2 || new Set(roots).size !== roots.length ||
      Object.keys(process.env).some(key => /^GIT_(?:CONFIG.*|DIR|COMMON_DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES)$/u.test(key))) return null;
  try {
    const branches = [], external = new Map();
    let worktreeConfiguration = false;
    for (const [index, root] of roots.entries()) {
      if (!path.isAbsolute(root) || realpathSync(root) !== root) return null;
      const git = args => execFileSync("git", ["-C", root, ...args], { timeout: 5000, maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
      if (path.join(realpathSync(path.resolve(root, git(["rev-parse", "--git-common-dir"]).toString("utf8").trim())), "config") !== file) return null;
      const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"]).toString("utf8").trim();
      if (!safeBranch(branch)) return null;
      branches.push(digest(branch));
      // Once the same common file is verified, the no-include/no-extension
      // configuration graph under this one environment is shared by both roots.
      // Both physical roots and branch identities are still read every window.
      if (index > 0 && !worktreeConfiguration) continue;
      // Includes from ANY effective scope, conditional includes and unknown
      // extensions are outside this closed consumer projection. No values are
      // retained, and failed/ambiguous reads cannot select the exemption.
      const names = git(["config", "--includes", "--null", "--show-origin", "--show-scope", "--name-only", "--list"]);
      const text = names.toString("utf8");
      if (!Buffer.from(text).equals(names) || !text.endsWith("\0")) return null;
      const fields = text.slice(0, -1).split("\0");
      if (fields.length % 3 !== 0) return null;
      const rows = Array.from({ length: fields.length / 3 }, (_, i) => fields.slice(i * 3, i * 3 + 3));
      const extensions = rows.filter(([, , key]) => /^extensions\./iu.test(key));
      if (extensions.length > 1 || extensions.some(([scope, origin, key]) => scope !== "local" ||
          origin !== `file:${file}` && path.resolve(root, origin.slice(5)) !== file || key.toLowerCase() !== "extensions.worktreeconfig")) return null;
      let worktreeFile = null;
      if (extensions.length) {
        const enabled = git(["config", "--local", "--bool", "--get", "extensions.worktreeConfig"]).toString("utf8").trim();
        if (!["true", "false"].includes(enabled)) return null;
        worktreeConfiguration = enabled === "true";
        if (worktreeConfiguration) {
          worktreeFile = path.resolve(root, git(["rev-parse", "--git-path", "config.worktree"]).toString("utf8").trim());
          if (realpathSync(path.dirname(worktreeFile)) !== path.dirname(worktreeFile)) return null;
          // Existing worktree configuration is fully consumed input, including
          // absence. It is never enabled, edited or projected by this reader.
          external.set(worktreeFile, observeInputFile(worktreeFile, { protectedConfiguration: true }));
        }
      }
      for (let i = 0; i < fields.length; i += 3) {
        const [scope, origin, key] = fields.slice(i, i + 3);
        if (!key || /^include(?:if)?\./iu.test(key) ||
            !["system", "global", "local", "worktree", "unknown"].includes(scope) || !origin.startsWith("file:")) return null;
        const originPath = path.resolve(root, origin.slice(5));
        if (scope === "local") { if (originPath !== file) return null; }
        else if (scope === "worktree") { if (!worktreeConfiguration || originPath !== worktreeFile) return null; }
        // Apple Git reports file-backed default configuration as scope unknown.
        // Bind that entire observed file just like system/global input; no key
        // or content in an unknown scope receives the tracking projection.
        else if (!external.has(originPath)) {
          const observation = observeInputFile(originPath, { protectedConfiguration: true });
          if (!observation.present) return null;
          external.set(originPath, observation);
        }
      }
    }
    return { branches: [...new Set(branches)].sort(), fingerprint: digest({ roots: roots.map(digest), branches,
      external: [...external].sort(([a], [b]) => a.localeCompare(b)).map(([file, observation]) => [digest(file), observation]) }) };
  } catch { return null; }
}

export function createGitTrackingResource(file, roots) {
  const resource = { id: "git-config", file, classification: "execution" };
  const gitRoots = [...new Set(roots)], context = gitTrackingContext(file, gitRoots);
  return context ? { ...resource, gitTracking: { policy: GIT_TRACKING_POLICY, protected_branches: context.branches }, gitRoots } : resource;
}

function gitTrackingRole(resource, input) {
  const scope = resource.gitTracking;
  return input?.contract === INPUT_CONTRACT && input.path_kind === "isolated-model-free-v1" &&
    resource.id === "git-config" && resource.classification === "execution" && !resource.metadataOnly &&
    !resource.excludePreferences && !resource.readOnlyExecutable && !resource.browserBundle &&
    scope?.policy === GIT_TRACKING_POLICY && Object.keys(scope).length === 2 &&
    Array.isArray(scope.protected_branches) && scope.protected_branches.length >= 1 && scope.protected_branches.length <= 2 &&
    scope.protected_branches.every(sha) && digest([...new Set(scope.protected_branches)].sort()) === digest(scope.protected_branches);
}

// A deliberately restricted lexical projection, never a Git configuration
// editor. Retain every byte except a complete, unique foreign branch section
// containing exactly one plain remote and one plain refs/heads merge value.
// Unsupported syntax anywhere retains whole-file protection.
function gitTrackingProjection(bytes, protectedBranches) {
  const source = bytes.toString("utf8");
  if (!Buffer.from(source).equals(bytes) || source.includes("\0") || source.includes("\\")) return null;
  const blocks = [], seen = new Set();
  let block = { lines: [], section: null, branch: null, entries: [] };
  for (const line of source.match(/[^\n]*\n|[^\n]+$/gu) ?? []) {
    const text = line.replace(/\r?\n$/u, "");
    const header = /^[ \t]*\[([A-Za-z][A-Za-z0-9-]*)(?:[ \t]+"([A-Za-z0-9_./@+-]+)")?\][ \t]*$/u.exec(text);
    if (header) {
      blocks.push(block);
      const section = header[1].toLowerCase(), branch = section === "branch" ? header[2] : null;
      if (["include", "includeif"].includes(section) || (section === "branch" && !safeBranch(branch ?? ""))) return null;
      if (branch && seen.has(branch)) return null;
      if (branch) seen.add(branch);
      block = { lines: [line], section, branch, entries: [] };
      continue;
    }
    block.lines.push(line);
    if (/^[ \t]*(?:[#;].*)?$/u.test(text)) { block.entries.push(null); continue; }
    const entry = /^[ \t]*([A-Za-z][A-Za-z0-9-]*)[ \t]*=[ \t]*("[^"\r\n]*"|[^"\r\n]*)$/u.exec(text);
    if (!block.section || !entry) return null;
    block.entries.push([entry[1].toLowerCase(), entry[2].trim()]);
  }
  blocks.push(block);
  const retained = blocks.filter(b => {
    if (!b.branch || protectedBranches.includes(digest(b.branch)) || b.entries.length !== 2 || b.entries.some(e => !e)) return true;
    const entries = new Map(b.entries);
    return entries.size !== 2 || !/^[A-Za-z0-9_./-]+$/u.test(entries.get("remote") ?? "") ||
      !safeBranch((entries.get("merge") ?? "").replace(/^refs\/heads\//u, "")) || !(entries.get("merge") ?? "").startsWith("refs/heads/");
  });
  return digest(retained.flatMap(b => b.lines).join(""));
}

const FAILURE_DIAGNOSTIC = "augnes.input-observation-failure.v1";
const failureStages = new Set(["reader", "classification", "initial_stat", "path_resolution", "file_type", "open", "descriptor_stat", "read", "named_stat", "metadata_consistency", "permission_consistency", "close", "preference_projection", "permission_acl", "permission_flags", "permission_attributes"]);
const failureCodes = new Set(["EACCES", "EPERM", "ENOENT", "EIO", "ELOOP", "ENOTDIR", "EMFILE", "ENFILE", "EBADF", "EINVAL", "ESTALE", "EINTR", "ETIMEDOUT", "ENOBUFS", "ENOMEM", "EISDIR", "input_unsafe_file", "input_observation_race", "input_comparison_bound_exceeded", "input_invalid_utf8", "input_executable_permissions_unknown", "helper_exit_nonzero", "unclassified_error"]);
const taggedFailures = new WeakMap();
const ownValue = (value, key) => { try { return Object.getOwnPropertyDescriptor(value, key)?.value; } catch { return undefined; } };
export const validObservationDiagnostic = value => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).length === 3 && value.contract === FAILURE_DIAGNOSTIC && failureStages.has(value.stage) && failureCodes.has(value.code);
function observationFailure(error, stage) {
  if (taggedFailures.has(error)) return taggedFailures.get(error);
  const code = ownValue(error, "code"), status = ownValue(error, "status");
  return { contract: FAILURE_DIAGNOSTIC, stage, code: failureCodes.has(code) ? code :
    stage.startsWith("permission_") && Number.isInteger(status) && status > 0 ? "helper_exit_nonzero" : "unclassified_error" };
}
function atStage(stage, action) {
  try { return action(); }
  catch (caught) {
    const diagnostic = observationFailure(caught, stage);
    // Direct reader callers also receive only a bounded error, without the
    // native helper's message, command, output, path or cause object.
    const error = fail(diagnostic.code);
    taggedFailures.set(error, diagnostic);
    throw error;
  }
}
export const inputEventIdentity = event => digest([event.resource, event.disposition, event.after,
  ...(event.diagnostic === undefined ? [] : [event.diagnostic])]);

// Optional diagnostics are additive. An old diagnostic-free failure is never
// reconstructed or reinterpreted. Unknown/extra fields cannot become an export.
export function validInputFailureDiagnostics(input, { exported = false } = {}) {
  if (!input) return true;
  const events = input.events ?? [], secondary = input.secondary_faults ?? [];
  if (!Array.isArray(events) || !Array.isArray(secondary) || secondary.some(f => !f || typeof f !== "object" || Array.isArray(f))) return false;
  const faults = [input.first_fault, ...secondary].filter(Boolean);
  const valid = item => item && typeof item === "object" && !Array.isArray(item) &&
    (item.diagnostic === undefined || (item.disposition === "observer_failure" && validObservationDiagnostic(item.diagnostic)));
  if (!events.every(e => valid(e) && (e.diagnostic === undefined || exported || e.after === null)) || !faults.every(valid)) return false;
  return faults.every(fault => {
    const event = events.find(e => e.resource === fault.resource && e.observed_at === fault.observed_at && e.disposition === fault.disposition &&
      (exported || e.monotonic_ns === fault.monotonic_ns));
    return fault.diagnostic === undefined && event?.diagnostic === undefined ||
      !!event && digest(fault.diagnostic ?? null) === digest(event.diagnostic ?? null);
  });
}

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

export function observeInputFile(file, { metadataOnly = false, preferences = false, readOnlyExecutable = false, protectedConfiguration = false, gitTracking = null, gitRoots = null } = {}) {
  let stat;
  try { stat = atStage("initial_stat", () => lstatSync(file, { bigint: true })); }
  catch (error) { if (error.code === "ENOENT") return { present: false }; throw error; }
  // Existing shared executables are read/execute inputs, never cleanup targets.
  // Retain their complete observation; the role-aware comparator separately
  // classifies incidental link/ctime changes rather than requiring a private
  // inode. Configurations and mutable resources retain single-link refusal.
  const sharedPosix = ["darwin", "linux"].includes(process.platform);
  const allowedLinks = s => readOnlyExecutable && sharedPosix ? s.nlink > 0n && (s.mode & 0o111n) !== 0n : s.nlink === 1n;
  const checkFile = s => atStage("file_type", () => {
    if (!s.isFile() || s.isSymbolicLink() || !allowedLinks(s)) throw fail("input_unsafe_file");
    if ((preferences || protectedConfiguration) && s.size > 1024n * 1024n) throw fail("input_comparison_bound_exceeded");
  });
  checkFile(stat);
  atStage("path_resolution", () => { if (realpathSync(file) !== file) throw fail("input_unsafe_file"); });
  const securityBefore = readOnlyExecutable || protectedConfiguration ? executablePermissions(file) : null;
  const gitBefore = gitTracking ? gitTrackingContext(file, gitRoots) : null;
  const metadata = s => ({ mode: String(s.mode), uid: String(s.uid), gid: String(s.gid), links: String(s.nlink),
    device: String(s.dev), inode: String(s.ino), bytes: String(s.size), mtime_ns: String(s.mtimeNs), ctime_ns: String(s.ctimeNs) });
  if (metadataOnly) return { present: true, metadata: metadata(stat), ...(readOnlyExecutable ? { permission_identity: securityBefore, executable_identity_policy: sharedPosix ? "shared-posix-v1" : "strict-metadata-v1" } : {}), observation: "metadata_only" };
  const shared = readOnlyExecutable && sharedPosix;
  const consumedMetadata = s => Object.fromEntries(Object.entries(metadata(s)).filter(([key]) => !shared || !["links", "ctime_ns"].includes(key)));
  const samples = [stat];
  const checkSample = s => {
    checkFile(s);
    atStage("metadata_consistency", () => { if (digest(consumedMetadata(stat)) !== digest(consumedMetadata(s))) throw fail("input_observation_race"); });
    samples.push(s);
  };
  const readWindow = () => {
    const fd = atStage("open", () => openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)));
    let primary;
    try {
      checkSample(atStage("descriptor_stat", () => fstatSync(fd, { bigint: true })));
      const bytes = atStage("read", () => readFileSync(fd));
      atStage("metadata_consistency", () => { if (BigInt(bytes.length) !== stat.size) throw fail("input_observation_race"); });
      checkSample(atStage("descriptor_stat", () => fstatSync(fd, { bigint: true })));
      checkSample(atStage("named_stat", () => lstatSync(file, { bigint: true })));
      const security = readOnlyExecutable || protectedConfiguration ? executablePermissions(file) : null;
      atStage("permission_consistency", () => { if (securityBefore !== security) throw fail("input_observation_race"); });
      // Include changes while the native permission helpers were running.
      checkSample(atStage("named_stat", () => lstatSync(file, { bigint: true })));
      return bytes;
    } catch (error) { primary = error; throw error; }
    finally {
      try { atStage("close", () => closeSync(fd)); } catch (error) { if (!primary) throw error; }
    }
  };
  const bytes = readWindow();
  const gitAfter = gitTracking ? gitTrackingContext(file, gitRoots) : null;
  if (gitTracking && digest(gitBefore) !== digest(gitAfter)) throw fail("input_observation_race");
  const gitEffective = gitTracking && gitBefore && digest(gitBefore.branches) === digest(gitTracking.protected_branches)
    ? gitTrackingProjection(bytes, gitBefore.branches) : null;
  if (shared && samples.some(s => digest(metadata(s)) !== digest(metadata(stat)))) {
    // One fixed corroborating read, never a retry of a failed observation or a
    // choice of a favorable sample. BOTH byte sequences and ALL content,
    // identity and permission samples must agree. ctime alone is insufficient.
    const corroborating = readWindow();
    atStage("metadata_consistency", () => { if (!bytes.equals(corroborating)) throw fail("input_observation_race"); });
  }
  return { present: true, metadata: metadata(samples.at(-1)), sha256: digest(bytes),
    ...(gitTracking ? { git_projection: { policy: GIT_TRACKING_POLICY, applicable: gitEffective !== null,
      scope_fingerprint: gitBefore?.fingerprint ?? null, effective_sha256: gitEffective } } : {}),
    ...(protectedConfiguration ? { permission_identity: securityBefore } : {}),
    ...(readOnlyExecutable ? { permission_identity: securityBefore, executable_identity_policy: sharedPosix ? "shared-posix-v1" : "strict-metadata-v1" } : {}),
    ...(preferences ? atStage("preference_projection", () => preferenceProjection(bytes)) : {}) };
}

export const nonFaultInputChange = disposition => ["unchanged", "ambient_observation", "incidental_executable_metadata"].includes(disposition);

// This is a fixed consumer classification, not a caller-supplied ignore list.
// Only the current isolated model-free inventory has demonstrated non-consumption
// of this one shared configuration. Legacy observations retain their old rule.
function unconsumedCodexConfiguration(resource, input) {
  return input?.contract === INPUT_CONTRACT && input.path_kind === "isolated-model-free-v1" &&
    resource.id === "codex-preferences" && resource.classification === "ambient" && resource.excludePreferences === true &&
    !resource.metadataOnly && !resource.readOnlyExecutable && !resource.browserBundle;
}

export function inputReadOptions(resource, input) {
  if (resource.gitTracking && !gitTrackingRole(resource, input)) throw fail("input_git_role_unproven");
  const git = gitTrackingRole(resource, input);
  const protectedConfiguration = unconsumedCodexConfiguration(resource, input) || git;
  return { metadataOnly: resource.metadataOnly, preferences: resource.excludePreferences && !protectedConfiguration,
    readOnlyExecutable: resource.readOnlyExecutable, browserBundle: resource.browserBundle, protectedConfiguration,
    ...(git ? { gitTracking: resource.gitTracking, gitRoots: resource.gitRoots } : {}) };
}

// Preparation/admission and comparison use the same effective identity. Raw
// observations remain in the frozen declaration/events, never in this projection.
export function effectiveInputObservation(value, resource, input) {
  if (resource.gitTracking) {
    if (!gitTrackingRole(resource, input)) throw fail("input_git_role_unproven");
    if (value?.present === false && Object.keys(value).length === 1) return value;
    const projection = value?.git_projection;
    if (value?.present !== true || !sha(value.sha256) || !sha(value.permission_identity) ||
        !["mode", "uid", "gid", "device", "inode", "bytes", "mtime_ns", "ctime_ns", "links"].every(k => /^\d{1,40}$/u.test(value.metadata?.[k] ?? "")) ||
        value.metadata.links !== "1" || (BigInt(value.metadata.mode) & 0o170000n) !== 0o100000n ||
        projection?.policy !== GIT_TRACKING_POLICY || Object.keys(projection).length !== 4 || typeof projection.applicable !== "boolean" ||
        (!projection.applicable && (projection.effective_sha256 !== null || !(projection.scope_fingerprint === null || sha(projection.scope_fingerprint)))) ||
        (projection.applicable && (!sha(projection.scope_fingerprint) || !sha(projection.effective_sha256))))
      throw fail("input_git_observation_incomplete");
    if (!projection.applicable) return value;
    return { present: true, permission_identity: value.permission_identity, git_projection: projection,
      metadata: Object.fromEntries(["mode", "uid", "gid", "device", "links"].map(k => [k, value.metadata[k]])) };
  }
  if (input?.contract === INPUT_CONTRACT && resource.excludePreferences && !unconsumedCodexConfiguration(resource, input))
    throw fail("input_exclusion_unproven");
  if (unconsumedCodexConfiguration(resource, input)) {
    if (value?.present === false && Object.keys(value).length === 1) return value;
    if (value?.present !== true || !/^[0-9a-f]{64}$/u.test(value.sha256 ?? "") ||
        !/^[0-9a-f]{64}$/u.test(value.permission_identity ?? "") ||
        !["mode", "uid", "gid", "device", "inode", "bytes", "mtime_ns", "ctime_ns", "links"].every(k => /^\d{1,40}$/u.test(value.metadata?.[k] ?? "")) ||
        value.metadata.links !== "1" || (BigInt(value.metadata.mode) & 0o170000n) !== 0o100000n)
      throw fail("input_configuration_observation_incomplete");
    return { present: true, permission_identity: value.permission_identity,
      metadata: Object.fromEntries(["mode", "uid", "gid", "device", "links"].map(k => [k, value.metadata[k]])) };
  }
  if (input?.contract === INPUT_CONTRACT && resource.readOnlyExecutable && value?.executable_identity_policy === "shared-posix-v1") {
    if (!usableExecutable(value)) throw fail("input_executable_observation_incomplete");
    return { ...value, metadata: Object.fromEntries(Object.entries(value.metadata).filter(([key]) => !["links", "ctime_ns"].includes(key))) };
  }
  return value;
}

export function commonInputResources(input) {
  if (!supportedInputContract(input?.contract)) throw fail("input_contract_unknown");
  return input.resources.filter(r => !r.id.startsWith("browser-")).map(r =>
    ({ ...r, before: effectiveInputObservation(r.before, r, input) }));
}

const usableExecutable = value => value.present === true && /^[0-9a-f]{64}$/u.test(value.sha256 ?? "") &&
  ["mode", "uid", "gid", "device", "inode", "bytes", "mtime_ns", "ctime_ns", "links"].every(key => /^\d{1,40}$/u.test(value.metadata?.[key] ?? "")) &&
  /^[0-9a-f]{64}$/u.test(value.permission_identity ?? "") && ["shared-posix-v1", "strict-metadata-v1"].includes(value.executable_identity_policy) && BigInt(value.metadata.links) > 0n && (BigInt(value.metadata.mode) & 0o170000n) === 0o100000n && (value.executable_identity_policy === "strict-metadata-v1" || (BigInt(value.metadata.mode) & 0o111n) !== 0n);

export function classifyInputChange(before, after, resource = {}, input = null) {
  const { classification, excludePreferences = false, readOnlyExecutable = false, browserBundle = false } = resource;
  if (input && !supportedInputContract(input.contract)) return "unknown_relevance";
  if (resource.gitTracking) {
    let prior, current;
    try { prior = effectiveInputObservation(before, resource, input); current = effectiveInputObservation(after, resource, input); }
    catch { return "unknown_relevance"; }
    if (before.present !== after.present) return "input_invalidation";
    if (before.present === false) return "unchanged";
    if (before.permission_identity !== after.permission_identity ||
        ["mode", "uid", "gid", "device", "links"].some(k => before.metadata[k] !== after.metadata[k])) return "safety_violation";
    if (digest(prior) !== digest(current)) return "input_invalidation";
    return digest(before) === digest(after) ? "unchanged" : "ambient_observation";
  }
  if (unconsumedCodexConfiguration(resource, input)) {
    let prior, current;
    try { prior = effectiveInputObservation(before, resource, input); current = effectiveInputObservation(after, resource, input); }
    catch { return "unknown_relevance"; }
    if (before.present !== after.present) return "input_invalidation";
    if (digest(prior) !== digest(current)) return "safety_violation";
    return digest(before) === digest(after) ? "unchanged" : "ambient_observation";
  }
  if (browserBundle) return classification === "execution" && !excludePreferences && !readOnlyExecutable ? compareBrowserBundle(before, after) : "unknown_relevance";
  if (!INPUT_CLASSES.includes(classification) || !before || !after || typeof before !== "object" || typeof after !== "object" || Array.isArray(before) || Array.isArray(after)) return "unknown_relevance";
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
    const consumed = value => input?.contract === INPUT_CONTRACT ? effectiveInputObservation(value, resource, input)
      : ({ ...value, metadata: Object.fromEntries(Object.entries(value.metadata).filter(([key]) => !["links", "ctime_ns"].includes(key))) });
    if (digest(consumed(before)) === digest(consumed(after))) return "incidental_executable_metadata";
    return "input_invalidation";
  }
  if (input?.contract !== INPUT_CONTRACT && classification === "ambient" && excludePreferences && before.remainder_sha256 &&
      before.remainder_sha256 === after.remainder_sha256) return "ambient_observation";
  if (classification === "ambient" || classification === "unknown") return "unknown_relevance";
  // Content-equivalent inode/mtime replacement is only excluded above, never
  // silently accepted for declared execution inputs or metadata-only credentials.
  return classification === "safety" ? "safety_violation" : "input_invalidation";
}

export function createInputReader() {
  const bundles = new Map();
  return (file, options = {}) => {
    if (!options.browserBundle) return observeInputFile(file, options);
    if (!bundles.has(file)) bundles.set(file, createBrowserBundleObserver(file));
    return bundles.get(file)({ force: options.force === true }).observation;
  };
}

export function freezeInputContract({ resources, pathKind, binding, read = createInputReader(), contract = INPUT_CONTRACT }) {
  if (!supportedInputContract(contract)) throw fail("input_contract_unknown");
  const policy = { contract, path_kind: pathKind };
  if (!Array.isArray(resources) || resources.length === 0 || !resources.every(r => r && typeof r === "object") || new Set(resources.map(r => r.id)).size !== resources.length)
    throw fail("input_inventory_invalid");
  const selected = resources.map(resource => {
    if (!/^[a-z][a-z0-9_-]{0,79}$/u.test(resource.id) || !INPUT_CLASSES.includes(resource.classification)) throw fail("input_inventory_invalid");
    if (resource.readOnlyExecutable && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences)) throw fail("input_executable_role_invalid");
    if (resource.excludePreferences && (pathKind !== "isolated-model-free-v1" || resource.classification !== "ambient")) throw fail("input_exclusion_unproven");
    if (contract === INPUT_CONTRACT && resource.excludePreferences && !unconsumedCodexConfiguration(resource, policy)) throw fail("input_exclusion_unproven");
    if (resource.browserBundle && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences || resource.readOnlyExecutable)) throw fail("input_bundle_role_invalid");
    const before = read(resource.file, { ...inputReadOptions(resource, policy), force: true });
    effectiveInputObservation(before, resource, policy);
    return { ...resource, before };
  });
  const declared = { contract, path_kind: pathKind, binding,
    resources: selected.map(({ file, gitRoots, ...r }) => ({ ...r, location_fingerprint: digest(file) })) };
  // File locations stay in this closure. They never enter receipts or exports.
  const frozen = JSON.parse(JSON.stringify(declared));
  const fingerprint = digest(frozen);
  const events = [], secondary = [];
  let firstFault = null, checks = 0;
  const check = ({ force = false } = {}) => {
    checks++;
    for (const resource of selected) {
      let after, disposition, diagnostic, stage = "reader";
      try {
        // Large immutable executables use exact metadata as a polling hint;
        // the final check always rehashes. Small configuration/input files are
        // reread each time. This is an observation optimization, not exclusion.
        const hint = !force && Number(resource.before.metadata?.bytes) > 1024 * 1024
          ? read(resource.file, { metadataOnly: true, readOnlyExecutable: resource.readOnlyExecutable }) : null;
        after = hint && hint.permission_identity === resource.before.permission_identity && JSON.stringify(hint.metadata) === JSON.stringify(resource.before.metadata)
          ? resource.before : read(resource.file, { ...inputReadOptions(resource, policy), force });
        stage = "classification";
        disposition = classifyInputChange(resource.before, after, resource, policy);
      } catch (error) { disposition = "observer_failure"; after = null; diagnostic = observationFailure(error, stage); }
      if (disposition === "unchanged") continue;
      const key = inputEventIdentity({ resource: resource.id, disposition, after, diagnostic });
      if (events.some(event => event.identity === key)) continue;
      const event = { resource: resource.id, classification: resource.classification, disposition,
        observed_at: new Date().toISOString(), monotonic_ns: String(process.hrtime.bigint()), identity: key, after,
        ...(diagnostic ? { diagnostic } : {}) };
      // A bounded observer cannot silently drop a relevant event.
      if (events.length >= 64) disposition = "observer_failure";
      else events.push(event);
      if (!nonFaultInputChange(disposition)) {
        const fault = { resource: resource.id, disposition, observed_at: event.observed_at, monotonic_ns: event.monotonic_ns,
          ...(diagnostic ? { diagnostic } : {}) };
        if (!firstFault) firstFault = fault; else if (secondary.length < 16) secondary.push(fault);
      }
    }
    return firstFault;
  };
  const reportSafetyEvent = reason => {
    if (!["unauthorized_task_write", "foreign_resource_interference", "installed_service_change", "credential_exposure", "ownership_change"].includes(reason)) throw fail("safety_event_invalid");
    const event = { resource: reason, classification: "safety", disposition: "safety_violation",
      observed_at: new Date().toISOString(), monotonic_ns: String(process.hrtime.bigint()), after: null };
    event.identity = digest(event);
    if (events.length < 64) events.push(event);
    firstFault ??= { resource: reason, disposition: "safety_violation", observed_at: event.observed_at, monotonic_ns: event.monotonic_ns };
  };
  return Object.freeze({ check, reportSafetyEvent, snapshot: () => ({ ...frozen, fingerprint, checks, events: structuredClone(events),
    first_fault: structuredClone(firstFault), secondary_faults: structuredClone(secondary),
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
    latchedFault ??= ownerFault;
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
  const run = (stage, tool, args) => atStage(stage, () => execFileSync(tool, args, { timeout: 2000, maxBuffer: 64 * 1024, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { PATH: "/usr/bin:/bin", LC_ALL: "C" } }));
  if (process.platform === "darwin") {
    const lines = run("permission_acl", "/bin/ls", ["-lde", file]).trimEnd().split("\n");
    atStage("permission_acl", () => { if (!/^-[rwxstST-]{9}[+@ ]/u.test(lines[0] ?? "") || lines.slice(1).some(line => !/^ [0-9]+: /u.test(line))) throw fail("input_executable_permissions_unknown"); });
    const flags = run("permission_flags", "/usr/bin/stat", ["-f", "%f", file]).trim();
    atStage("permission_flags", () => { if (!/^\d+$/u.test(flags)) throw fail("input_executable_permissions_unknown"); });
    return digest({ contract: "posix-executable-permissions.v1", acl: lines.slice(1), flags, extended_attributes_sha256: digest(run("permission_attributes", "/usr/bin/xattr", ["-lx", file])) });
  }
  if (process.platform === "linux") {
    // Portable focused controls may prove an ordinary mode-only file. A '+'
    // ACL or security-context marker is unknown here, not silently excluded.
    const value = run("permission_acl", "/bin/ls", ["-ld", "--", file]);
    atStage("permission_acl", () => { if (!/^-[rwxstST-]{9} /u.test(value)) throw fail("input_executable_permissions_unknown"); });
    return digest({ contract: "posix-executable-permissions.v1", acl: [], flags: "linux-mode-only" });
  }
  // Other admitted platforms retain the older complete metadata equality rule;
  // this increment grants them no incidental-metadata exemption.
  return digest("strict-metadata-v1");
}
