import { chmodSync, closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { inspectOwnedChildLifecycleBytes, readOwnedChildLifecycleFile } from "./test-harness-process-lifecycle.mjs";

const validId = id => /^[A-Za-z0-9_-]{1,160}$/u.test(id ?? "");
const fail = () => Object.assign(new Error("evidence_pin_invalid"), { code: "evidence_pin_invalid" });
function pinRoot(root, create = false) {
  const pins = path.join(root, ".augnes-local-verification", "pins");
  if (create) try { mkdirSync(pins, { mode: 0o700 }); } catch (e) { if (e.code !== "EEXIST") throw e; }
  let s; try { s = lstatSync(pins); } catch (e) { if (e.code === "ENOENT" && !create) return null; throw e; }
  if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(pins) !== pins) throw fail();
  return pins;
}

export function pinVerificationEvidence({ root, checkoutOwner, runId, reason = "explicit_review" }) {
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  if (!validId(runId) || !["explicit_review", "attempt_family"].includes(reason)) throw fail();
  const pins = pinRoot(root, true);
  writeFileSync(path.join(pins, `${runId}.json`), `${JSON.stringify({ schema: "augnes.local-canonical-evidence-pin.v1", run_id: runId, reason })}\n`, { flag: "wx", mode: 0o600 });
}

export function readPinnedEvidence(root) {
  const pins = pinRoot(root);
  if (!pins) return new Set();
  const ids = new Set();
  for (const name of readdirSync(pins)) {
    const id = name.replace(/\.json$/u, "");
    if (name !== `${id}.json` || !validId(id)) throw fail();
    const file = path.join(pins, name), s = lstatSync(file);
    if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > 2048) throw fail();
    const pin = JSON.parse(readFileSync(file, "utf8"));
    if (pin.schema !== "augnes.local-canonical-evidence-pin.v1" || pin.run_id !== id || !["explicit_review", "attempt_family"].includes(pin.reason)) throw fail();
    ids.add(id);
  }
  return ids;
}

export const SELECTED_INPUT_EVIDENCE_CONTRACT = "augnes.local-canonical-selected-input-evidence.v1";
const evidenceError = code => Object.assign(new Error(code), { code });
const sha256 = value => createHash("sha256").update(value).digest("hex");
const canonical = value => JSON.stringify(sortValue(value));
const hash = value => sha256(canonical(value));
const MAX_SELECTED_RESOURCES = 32;
const MAX_SELECTED_BYTES = 2 * 1024 * 1024;
const bindingKeys = ["head", "tree", "executor_fingerprint", "plan_fingerprint", "consumer_map_fingerprint"];
const selectedKinds = new Set(["generated-git-config", "empty-config", "empty-npm-config", "source-git-head", "source-git-ref", "source-git-packed-refs", "source-git-index", "selected-execution-manifest", "generated-wrapper-recipe", "generated-execution-wrapper"]);

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]));
  return value;
}
function assertBinding(binding) {
  if (!binding || Object.keys(binding).sort().join() !== [...bindingKeys].sort().join() ||
      bindingKeys.some(key => !(key === "head" || key === "tree" ? /^[a-f0-9]{40}$/u : /^[a-f0-9]{64}$/u).test(binding[key] ?? "")))
    throw evidenceError("selected_evidence_binding_invalid");
}
function identity(stat) {
  return Object.fromEntries(["dev", "ino", "uid", "gid", "mode", "nlink", "size", "mtimeNs", "ctimeNs"].map(key => [key, String(stat[key])]));
}
function assertDirectory(directory, { immutable = false } = {}) {
  const stat = lstatSync(directory, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(directory) !== directory ||
      (stat.mode & 0o022n) !== 0n || (typeof process.getuid === "function" && stat.uid !== BigInt(process.getuid())) ||
      (immutable && (stat.mode & 0o777n) !== 0o700n)) throw evidenceError("selected_evidence_directory_unsafe");
  return stat;
}
function assertRunDirectory(root, runId) {
  if (!validId(runId) || !path.isAbsolute(root) || path.resolve(root) !== root) throw evidenceError("selected_evidence_location_invalid");
  let directory = root;
  assertDirectory(directory);
  for (const segment of [".augnes-local-verification", "logs", runId]) {
    directory = path.join(directory, segment); assertDirectory(directory);
  }
  return directory;
}
function readSafeSelectedFile(file, { retained = false, expectedIdentity = null, maximum = MAX_SELECTED_BYTES } = {}) {
  let fd;
  try {
    const before = lstatSync(file, { bigint: true });
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n || before.size > BigInt(maximum) ||
        realpathSync(file) !== file || (before.mode & 0o022n) !== 0n ||
        (retained && (before.mode & 0o777n) !== 0o400n) ||
        (typeof process.getuid === "function" && before.uid !== BigInt(process.getuid()))) throw evidenceError("selected_evidence_file_unsafe");
    if (!constants.O_NOFOLLOW) throw evidenceError("selected_evidence_safe_read_unsupported");
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | (constants.O_NONBLOCK ?? 0));
    const opened = fstatSync(fd, { bigint: true });
    if (canonical(identity(before)) !== canonical(identity(opened))) throw evidenceError("selected_evidence_file_changed");
    const bytes = readFileSync(fd);
    const after = fstatSync(fd, { bigint: true });
    if (canonical(identity(before)) !== canonical(identity(after)) || canonical(identity(lstatSync(file, { bigint: true }))) !== canonical(identity(after)) ||
        (expectedIdentity && canonical(expectedIdentity) !== canonical(identity(after)))) throw evidenceError("selected_evidence_file_changed");
    return { bytes, physical: identity(after) };
  } finally { if (fd !== undefined) closeSync(fd); }
}

// These files are authored by the selected-input owner, never copied account
// configuration. The closed kinds reject credentials, includes and executable
// config. Binary Git indexes contain source paths/object IDs, not file contents.
function assertSelectedBytes(kind, bytes, logical = null) {
  if (!selectedKinds.has(kind)) throw evidenceError("selected_evidence_kind_unsupported");
  if (kind === "empty-config") {
    if (bytes.length !== 0) throw evidenceError("selected_evidence_empty_content_refused");
    return;
  }
  if (kind === "source-git-index") {
    if (bytes.length < 32 || bytes.subarray(0, 4).toString() !== "DIRC" || ![2, 3].includes(bytes.readUInt32BE(4)) ||
        createHash("sha1").update(bytes.subarray(0, -20)).digest("hex") !== bytes.subarray(-20).toString("hex"))
      throw evidenceError("selected_evidence_index_invalid");
    let offset = 12;
    for (let entry = 0; entry < bytes.readUInt32BE(8); entry++) {
      const start = offset;
      if (offset + 62 > bytes.length - 20 || ![0o100644, 0o100755, 0o120000, 0o160000].includes(bytes.readUInt32BE(offset + 24))) throw evidenceError("selected_evidence_index_invalid");
      const extended = bytes.readUInt16BE(offset + 60) & 0x4000;
      offset += 62 + (extended ? 2 : 0);
      if (extended && bytes.readUInt32BE(4) !== 3) throw evidenceError("selected_evidence_index_invalid");
      const end = bytes.indexOf(0, offset);
      if (end <= offset || end >= bytes.length - 20) throw evidenceError("selected_evidence_index_invalid");
      offset = start + Math.ceil((end + 1 - start) / 8) * 8;
      if (offset > bytes.length - 20 || bytes.subarray(end, offset).some(byte => byte !== 0)) throw evidenceError("selected_evidence_index_invalid");
    }
    while (offset < bytes.length - 20) {
      if (offset + 8 > bytes.length - 20 || bytes.subarray(offset, offset + 4).toString() !== "TREE") throw evidenceError("selected_evidence_index_extension_unsupported");
      const length = bytes.readUInt32BE(offset + 4), end = offset + 8 + length;
      offset += 8;
      if (end > bytes.length - 20) throw evidenceError("selected_evidence_index_invalid");
      while (offset < end) {
        const nameEnd = bytes.indexOf(0, offset), numbersEnd = bytes.indexOf(10, nameEnd + 1);
        if (nameEnd < offset || numbersEnd <= nameEnd || numbersEnd >= end) throw evidenceError("selected_evidence_index_invalid");
        const fields = /^(-?\d+) (\d+)$/u.exec(bytes.subarray(nameEnd + 1, numbersEnd).toString());
        if (!fields) throw evidenceError("selected_evidence_index_invalid");
        offset = numbersEnd + 1 + (Number(fields[1]) >= 0 ? 20 : 0);
        if (offset > end) throw evidenceError("selected_evidence_index_invalid");
      }
    }
    return;
  }
  const text = bytes.toString("utf8");
  if (!Buffer.from(text).equals(bytes) || text.includes("\0") || /\b(?:sk-(?:proj-)?|gh[pousr]_|github_pat_)[A-Za-z0-9_-]{8,}|\bBearer\s+[A-Za-z0-9._~-]{8,}/iu.test(text))
    throw evidenceError("selected_evidence_private_content_refused");
  if (kind === "generated-execution-wrapper") {
    const npmGuard = "#!/bin/sh\ncase \"$*\" in\n  \"--version\"|\"ci --no-audit --no-fund\"|\"run build\"|\"run typecheck\"|\"run typegen\"|\"test\"|\"run test:authority\"|\"run test:integration\"|\"run test:operability\"|\"config get userconfig\") ;;\n  *) exit 126 ;;\nesac\n";
    const guardedNpm = logical?.tool === "npm" && text.startsWith(npmGuard);
    const body = guardedNpm ? `#!/bin/sh\n${text.slice(npmGuard.length)}` : text;
    const match = /^#!\/bin\/sh\nexec '(\/[^'\r\n]+)'(?:( '(\/[^'\r\n]+)')|( '-E' '-s' '-S'))? "\$@"\n$/u.exec(body);
    const argumentCount = match?.[4] ? 4 : match?.[3] ? 2 : 1;
    if (!match || logical?.schema !== "augnes.local-canonical-generated-wrapper-recipe.v1" || logical.template !== "selected-dispatch-v1" ||
        !["node", "git", "npm", "python3", "sh", "tar"].includes(logical.tool) || !Array.isArray(logical.arguments) ||
        logical.arguments.length !== argumentCount || (match[4] && (logical.tool !== "python3" || canonical(logical.arguments.slice(1)) !== canonical(["-E", "-s", "-S"]))) ||
        (logical.tool === "npm" && (!guardedNpm || !match[3])) ||
        logical.arguments.some(argument => typeof argument !== "string" || argument.length > 4096 || /[\r\n\0]/u.test(argument)))
      throw evidenceError("selected_evidence_wrapper_refused");
    return;
  }
  if (kind === "empty-npm-config") {
    if (text.split(/\r?\n/u).some(line => line.trim() && !/^[;#]/u.test(line.trim()))) throw evidenceError("selected_evidence_npm_content_refused");
    return;
  }
  if (kind === "source-git-head" || kind === "source-git-ref") {
    if (!/^[a-f0-9]{40}\n?$/u.test(text) && !(kind === "source-git-head" && /^ref: refs\/(?:heads|tags)\/[A-Za-z0-9._/-]+\n?$/u.test(text)))
      throw evidenceError("selected_evidence_git_ref_invalid");
    return;
  }
  if (kind === "source-git-packed-refs") {
    if (text.split("\n").some(line => line && !/^# pack-refs with: [a-z ]+$/u.test(line) && !/^[a-f0-9]{40} refs\/(?:heads|tags|remotes)\/[A-Za-z0-9._/-]+$/u.test(line) && !/^\^[a-f0-9]{40}$/u.test(line)))
      throw evidenceError("selected_evidence_git_ref_invalid");
    return;
  }
  if (kind === "generated-git-config") {
    let section = null;
    for (const original of text.split(/\r?\n/u)) {
      const line = original.trim(); if (!line || /^[#;]/u.test(line)) continue;
      if (/^\[(?:core|extensions|safe|remote "origin")\]$/u.test(line)) { section = line.slice(1, -1); continue; }
      const entry = /^([a-zA-Z]+)\s*=\s*(.*)$/u.exec(line);
      if (!entry) throw evidenceError("selected_evidence_git_config_refused");
      const key = entry[1].toLowerCase(), value = entry[2];
      const boolean = /^(?:true|false)$/u.test(value);
      const absolute = /^\/?(?:[^\r\n"\\]+|"[^\r\n"]+")$/u.test(value) && path.isAbsolute(value.replace(/^"|"$/gu, ""));
      const allowed = section === "core" && ((["filemode", "bare", "logallrefupdates", "ignorecase", "precomposeunicode", "protecthfs", "protectntfs", "quotepath", "fsmonitor", "untrackedcache"].includes(key) && boolean) ||
        (key === "repositoryformatversion" && /^[01]$/u.test(value)) || (["worktree", "hookspath", "excludesfile", "attributesfile"].includes(key) && absolute)) ||
        section === "extensions" && key === "worktreeconfig" && boolean || section === "safe" && key === "directory" && absolute ||
        section === 'remote "origin"' && (key === "url" && value === "https://github.com/hynk-studio/augnes.git" || key === "fetch" && value === "+refs/heads/*:refs/remotes/origin/*");
      if (!allowed) throw evidenceError("selected_evidence_git_config_refused");
    }
    return;
  }
  const value = JSON.parse(text);
  const schema = kind === "selected-execution-manifest" ? "augnes.local-canonical-selected-execution.v1" : "augnes.local-canonical-generated-wrapper-recipe.v1";
  if (value?.schema !== schema) throw evidenceError("selected_evidence_recipe_invalid");
  function inspect(value, depth = 0) {
    if (depth > 12) throw evidenceError("selected_evidence_recipe_invalid");
    if (value && typeof value === "object") for (const [key, nested] of Object.entries(value)) {
      if (/(?:credential|password|secret|authorization|access_token|api_key)/iu.test(key)) throw evidenceError("selected_evidence_private_content_refused");
      inspect(nested, depth + 1);
    }
  }
  inspect(value);
}

function logicalContent(resource, bytes) {
  // A producer supplies the canonical source-derived recipe when physical
  // runtime paths vary. Stock recomputes that recipe through the same source
  // owner; the recipe never replaces the retained historical execution bytes.
  const logical = resource.logical_content ?? { actual_execution_sha256: sha256(bytes) };
  const encoded = canonical(logical);
  if (typeof encoded !== "string" || Buffer.byteLength(encoded) > 128 * 1024 ||
      /\b(?:sk-(?:proj-)?|gh[pousr]_|github_pat_)[A-Za-z0-9_-]{8,}|\bBearer\s+[A-Za-z0-9._~-]{8,}/iu.test(encoded))
    throw evidenceError("selected_evidence_logical_content_invalid");
  return logical;
}

function writeImmutable(file, bytes, maximum = MAX_SELECTED_BYTES) {
  const fd = openSync(file, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600);
  try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
  chmodSync(file, 0o400);
  return readSafeSelectedFile(file, { retained: true, maximum }).physical;
}

export function retainSelectedInputEvidence({ root, checkoutOwner, runId, binding, resources }) {
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  assertBinding(binding);
  if (!Array.isArray(resources) || !resources.length || resources.length > MAX_SELECTED_RESOURCES || new Set(resources.map(resource => resource?.id)).size !== resources.length)
    throw evidenceError("selected_evidence_inventory_invalid");
  let total = 0;
  const selected = resources.map(resource => {
    if (!validId(resource?.id) || resource.source_generated !== true || !selectedKinds.has(resource.kind) || !path.isAbsolute(resource.file ?? "") ||
        !/^[a-f0-9]{64}$/u.test(resource.expected_sha256 ?? "")) throw evidenceError("selected_evidence_resource_invalid");
    const { bytes } = readSafeSelectedFile(resource.file);
    if (sha256(bytes) !== resource.expected_sha256) throw evidenceError("selected_evidence_source_changed");
    assertSelectedBytes(resource.kind, bytes, resource.logical_content); total += bytes.length;
    if (total > MAX_SELECTED_BYTES) throw evidenceError("selected_evidence_size_exceeded");
    const logical = logicalContent(resource, bytes);
    return { id: resource.id, kind: resource.kind, sha256: sha256(bytes), actual_execution_sha256: sha256(bytes),
      logical_sha256: hash(logical), logical_content: logical, bytes };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const runDirectory = assertRunDirectory(root, runId), directory = path.join(runDirectory, "selected-inputs");
  mkdirSync(directory, { mode: 0o700 }); // Never adopt/replace a prior evidence directory.
  const retained = selected.map(resource => ({ id: resource.id, kind: resource.kind, sha256: resource.sha256,
    actual_execution_sha256: resource.actual_execution_sha256, logical_sha256: resource.logical_sha256, logical_content: resource.logical_content, size: resource.bytes.length,
    file: `${resource.id}.input`, physical: writeImmutable(path.join(directory, `${resource.id}.input`), resource.bytes) }));
  const manifest = { contract: SELECTED_INPUT_EVIDENCE_CONTRACT, run_id: runId, binding: structuredClone(binding), resources: retained };
  const manifestBytes = Buffer.from(`${canonical(manifest)}\n`);
  const manifestPhysical = writeImmutable(path.join(directory, "manifest.json"), manifestBytes);
  // Keep the private directory removable by the existing log-retention owner.
  // Evidence files are read-only and exclusive creation forbids API overwrite;
  // cold stock binds this directory's exact identity and complete inventory.
  chmodSync(directory, 0o700);
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  const logicalResources = retained.map(({ file, physical, logical_content, ...resource }) => resource);
  return { contract: SELECTED_INPUT_EVIDENCE_CONTRACT, run_id: runId, binding: structuredClone(binding),
    binding_fingerprint: hash(binding), manifest_sha256: sha256(manifestBytes), manifest_identity: manifestPhysical,
    directory_identity: identity(assertDirectory(directory, { immutable: true })), resources: logicalResources,
    resources_fingerprint: hash(logicalResources) };
}

export function inspectRetainedSelectedInputs({ root, descriptor, expectedBinding, expectedResources }) {
  try {
    assertBinding(expectedBinding);
    if (descriptor?.contract !== SELECTED_INPUT_EVIDENCE_CONTRACT || canonical(descriptor.binding) !== canonical(expectedBinding) ||
        descriptor.binding_fingerprint !== hash(expectedBinding)) throw evidenceError("selected_evidence_binding_mismatch");
    const directory = path.join(assertRunDirectory(root, descriptor.run_id), "selected-inputs");
    if (canonical(identity(assertDirectory(directory, { immutable: true }))) !== canonical(descriptor.directory_identity)) throw evidenceError("selected_evidence_directory_changed");
    const { bytes } = readSafeSelectedFile(path.join(directory, "manifest.json"), { retained: true, expectedIdentity: descriptor.manifest_identity });
    if (sha256(bytes) !== descriptor.manifest_sha256) throw evidenceError("selected_evidence_manifest_changed");
    const manifest = JSON.parse(bytes.toString("utf8"));
    if (manifest.contract !== SELECTED_INPUT_EVIDENCE_CONTRACT || manifest.run_id !== descriptor.run_id || canonical(manifest.binding) !== canonical(expectedBinding) ||
        !Array.isArray(manifest.resources) || !manifest.resources.length || manifest.resources.length > MAX_SELECTED_RESOURCES) throw evidenceError("selected_evidence_manifest_invalid");
    const logical = manifest.resources.map(({ file, physical, logical_content, ...resource }) => resource);
    if (canonical(logical) !== canonical(descriptor.resources) || hash(logical) !== descriptor.resources_fingerprint || new Set(logical.map(resource => resource.id)).size !== logical.length)
      throw evidenceError("selected_evidence_inventory_mismatch");
    if (expectedResources && canonical(logical.map(({ id, kind, logical_sha256 }) => ({ id, kind, logical_sha256 }))) !== canonical([...expectedResources].map(resource => ({ id: resource.id, kind: resource.kind,
      logical_sha256: resource.logical_sha256 ?? hash(resource.logical_content ?? { actual_execution_sha256: resource.actual_execution_sha256 ?? resource.sha256 ?? resource.expected_sha256 }) })).sort((a, b) => a.id.localeCompare(b.id))))
      throw evidenceError("selected_evidence_resource_binding_mismatch");
    const names = ["manifest.json", ...logical.map(resource => `${resource.id}.input`)].sort();
    if (canonical(readdirSync(directory).sort()) !== canonical(names)) throw evidenceError("selected_evidence_inventory_mismatch");
    let total = 0;
    for (const resource of manifest.resources) {
      if (!validId(resource.id) || resource.file !== `${resource.id}.input` || !selectedKinds.has(resource.kind)) throw evidenceError("selected_evidence_resource_invalid");
      const { bytes: content } = readSafeSelectedFile(path.join(directory, resource.file), { retained: true, expectedIdentity: resource.physical });
      if (content.length !== resource.size || sha256(content) !== resource.sha256 || resource.actual_execution_sha256 !== resource.sha256 ||
          hash(logicalContent(resource, content)) !== resource.logical_sha256) throw evidenceError("selected_evidence_content_changed");
      assertSelectedBytes(resource.kind, content, resource.logical_content); total += content.length;
      if (total > MAX_SELECTED_BYTES) throw evidenceError("selected_evidence_size_exceeded");
    }
    return { valid: true, reason_codes: [], resources: logical };
  } catch (error) {
    const reason = /^selected_evidence_[a-z_]+$/u.test(error?.code ?? "") ? error.code : error?.code === "ENOENT" ? "selected_evidence_missing" : "selected_evidence_read_failed";
    return { valid: false, reason_codes: [reason], resources: [] };
  }
}

const RETAINED_LIFECYCLE_CONTRACT = "augnes.local-canonical-retained-child-lifecycle.v1";
const MAX_RETAINED_LIFECYCLE_BYTES = 64 * 1024 * 1024;

// Settlement evidence is runtime-produced, so it is kept separately from the
// source-generated selected-input inventory. UNKNOWN rows remain original data.
export function retainOwnedChildLifecycleEvidence({ root, checkoutOwner, runId, binding, file, identity: originalIdentity }) {
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  assertBinding(binding);
  const original = readOwnedChildLifecycleFile(file, originalIdentity);
  const { bytes } = readSafeSelectedFile(file, { maximum: MAX_RETAINED_LIFECYCLE_BYTES });
  if (sha256(bytes) !== original.content_sha256) throw evidenceError("selected_evidence_lifecycle_changed");
  const directory = path.join(assertRunDirectory(root, runId), "child-lifecycle");
  mkdirSync(directory, { mode: 0o700 });
  const retainedIdentity = writeImmutable(path.join(directory, "events.jsonl"), bytes, MAX_RETAINED_LIFECYCLE_BYTES);
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  return { contract: RETAINED_LIFECYCLE_CONTRACT, run_id: runId, binding: structuredClone(binding), binding_fingerprint: hash(binding),
    content_sha256: sha256(bytes), bytes: bytes.length, original_identity_fingerprint: hash(originalIdentity),
    retained_identity: retainedIdentity, directory_identity: identity(assertDirectory(directory, { immutable: true })),
    started_count: original.started_count, settled_count: original.settled_count, unknown_count: original.unknown_count,
    complete: original.complete, inventory_fingerprint: hash(original.children) };
}

export function inspectRetainedChildLifecycleEvidence({ root, descriptor, expectedBinding }) {
  try {
    assertBinding(expectedBinding);
    if (descriptor?.contract !== RETAINED_LIFECYCLE_CONTRACT || canonical(descriptor.binding) !== canonical(expectedBinding) ||
        descriptor.binding_fingerprint !== hash(expectedBinding)) throw evidenceError("selected_evidence_binding_mismatch");
    const directory = path.join(assertRunDirectory(root, descriptor.run_id), "child-lifecycle");
    if (canonical(identity(assertDirectory(directory, { immutable: true }))) !== canonical(descriptor.directory_identity) ||
        canonical(readdirSync(directory)) !== canonical(["events.jsonl"])) throw evidenceError("selected_evidence_lifecycle_directory_changed");
    const { bytes } = readSafeSelectedFile(path.join(directory, "events.jsonl"), { retained: true,
      expectedIdentity: descriptor.retained_identity, maximum: MAX_RETAINED_LIFECYCLE_BYTES });
    if (sha256(bytes) !== descriptor.content_sha256 || bytes.length !== descriptor.bytes) throw evidenceError("selected_evidence_lifecycle_changed");
    const lifecycle = inspectOwnedChildLifecycleBytes(bytes);
    if (["started_count", "settled_count", "unknown_count", "complete"].some(key => lifecycle[key] !== descriptor[key]) ||
        hash(lifecycle.children) !== descriptor.inventory_fingerprint) throw evidenceError("selected_evidence_lifecycle_inventory_changed");
    return { valid: lifecycle.complete, reason_codes: lifecycle.complete ? [] : ["selected_evidence_lifecycle_incomplete"], lifecycle };
  } catch (error) {
    const reason = /^(?:selected_evidence_|owned_child_)[a-z_]+$/u.test(error?.code ?? "") ? error.code : error?.code === "ENOENT" ? "selected_evidence_missing" : "selected_evidence_read_failed";
    return { valid: false, reason_codes: [reason], lifecycle: null };
  }
}

// Both the production stock wrapper and disposable fresh readers call these
// same filesystem readers. No producer approval flag or recreated file is used.
export function collectSelectedStockEvidence({ root, receipt, expectedBinding, currentResources }) {
  const historicalBinding = { head: receipt?.repository?.head_sha, tree: receipt?.repository?.tree_sha,
    executor_fingerprint: receipt?.executor?.source_fingerprint, plan_fingerprint: receipt?.inputs?.binding?.phase_inventory,
    consumer_map_fingerprint: receipt?.inputs?.binding?.selected_execution?.consumer_map_fingerprint };
  const currentRetainedInputEvidence = inspectRetainedSelectedInputs({ root,
    descriptor: receipt?.selected_inputs, expectedBinding: historicalBinding });
  const currentRetainedChildEvidence = inspectRetainedChildLifecycleEvidence({ root,
    descriptor: receipt?.owned_children, expectedBinding: historicalBinding });
  const currentSelectedInputEvidence = Array.isArray(currentResources) && currentResources.length ? inspectRetainedSelectedInputs({ root,
    descriptor: receipt?.selected_inputs, expectedBinding, expectedResources: currentResources }) :
    { valid: false, reason_codes: ["selected_evidence_current_inventory_missing"], resources: [] };
  return { currentRetainedInputEvidence, currentRetainedChildEvidence, currentSelectedInputEvidence,
    currentInputStateValid: currentSelectedInputEvidence.valid };
}
