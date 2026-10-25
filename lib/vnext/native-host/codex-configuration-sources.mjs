import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readSync, readlinkSync, realpathSync } from "node:fs";
import path from "node:path";

export const NATIVE_CONFIGURATION_CONTRACT = "augnes.native-configuration-inputs.v1";
export const NATIVE_FIXTURE_ROOTS_ENV = "AUGNES_CANONICAL_NATIVE_FIXTURE_ROOTS";
const selectedKey = "AUGNES_CANONICAL_SELECTED_INPUTS";
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const hash = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(sorted(value))).digest("hex");
const fail = code => { throw Object.assign(new Error(code), { code }); };
const inside = (file, root) => file === root || file.startsWith(root + path.sep);
const absolute = file => typeof file === "string" && path.isAbsolute(file) && path.resolve(file) === file;
const metadata = s => ({ mode: String(s.mode), uid: String(s.uid), gid: String(s.gid), links: String(s.nlink),
  device: String(s.dev), inode: String(s.ino), bytes: String(s.size), mtime_ns: String(s.mtimeNs), ctime_ns: String(s.ctimeNs) });
const directoryIdentity = s => ({ device: String(s.dev), inode: String(s.ino), mode: String(s.mode), uid: String(s.uid), gid: String(s.gid) });

// The native reader and verification selector share this exact source set.
// Original source ancestry matters even when execution uses a private snapshot.
export function codexConfigurationFiles(codexHome, roots) {
  if (!absolute(codexHome) || !Array.isArray(roots) || !roots.length || roots.length > 16 || roots.some(root => !absolute(root)))
    fail("native_configuration_paths_invalid");
  const files = new Set(["/etc/codex/config.toml", path.join(codexHome, "config.toml")]);
  for (const root of roots) {
    let current = root, depth = 0;
    for (;;) {
      if (++depth > 128) fail("native_configuration_paths_invalid");
      files.add(path.join(current, ".codex", "config.toml"));
      if (current === path.dirname(current)) break;
      current = path.dirname(current);
    }
  }
  return [...files].sort();
}
export function codexManagedConfigurationFiles(home, codexHome) {
  if (!absolute(home) || !absolute(codexHome)) fail("native_configuration_paths_invalid");
  return ["/etc/codex/requirements.toml", "/etc/codex/managed_config.toml", path.join(codexHome, "managed_config.toml"),
    "/Library/Managed Preferences/com.openai.codex.plist", path.join(home, "Library/Managed Preferences/com.openai.codex.plist")];
}
export function codexInstructionFiles(codexHome) { return ["AGENTS.md", "AGENTS.override.md"].map(name => path.join(codexHome, name)); }
export function codexConfigurationSourceFiles({ home, codexHome, roots }) {
  return [...new Set([...codexConfigurationFiles(codexHome, roots), ...codexManagedConfigurationFiles(home, codexHome),
    ...codexInstructionFiles(codexHome)])].sort();
}

// Bind absent paths too. Directory content/timestamps are deliberately absent:
// unrelated temporary entries do not change the authority of this pathname.
function ancestry(file) {
  if (!absolute(file)) fail("native_configuration_path_invalid");
  const result = [], parts = path.dirname(file).split(path.sep).filter(Boolean);
  if (parts.length > 128) fail("native_configuration_path_invalid");
  let current = path.parse(file).root, missing = false;
  for (const part of [null, ...parts]) {
    if (part !== null) current = path.join(current, part);
    const entry = { location_fingerprint: hash(current) };
    if (missing) { result.push({ ...entry, present: false }); continue; }
    let stat;
    try { stat = lstatSync(current, { bigint: true }); }
    catch (error) { if (error.code !== "ENOENT") throw error; missing = true; result.push({ ...entry, present: false }); continue; }
    if (stat.isSymbolicLink()) {
      // These fixed Darwin aliases are OS layout, not user-controlled config
      // redirections. Their exact link and target identity remain observed.
      const target = process.platform === "darwin" && ({ "/etc": "/private/etc", "/tmp": "/private/tmp", "/var": "/private/var" })[current];
      if (!target || realpathSync(current) !== target) fail("native_configuration_ancestor_unsafe");
      result.push({ ...entry, present: true, ...directoryIdentity(stat), link_fingerprint: hash(readlinkSync(current)),
        target: directoryIdentity(lstatSync(target, { bigint: true })) });
    } else {
      if (!stat.isDirectory()) fail("native_configuration_ancestor_unsafe");
      result.push({ ...entry, present: true, ...directoryIdentity(stat) });
    }
  }
  return hash(result);
}

// Only non-secret observations leave this reader. Neither bytes nor parsed
// configuration values enter the selected manifest or Canonical receipt.
export function observeNativeConfigurationInput(file) {
  const pathChain = ancestry(file);
  let stat;
  try { stat = lstatSync(file, { bigint: true }); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (ancestry(file) !== pathChain) fail("native_configuration_observation_race");
    return { present: false, source_path_policy: NATIVE_CONFIGURATION_CONTRACT, path_chain_sha256: pathChain };
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1n || stat.size > 128n * 1024n || realpathSync(file) !== file)
    fail("native_configuration_file_unsafe");
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (hash(metadata(opened)) !== hash(metadata(stat))) fail("native_configuration_observation_race");
    const buffer = Buffer.alloc(128 * 1024 + 1); let length = 0;
    while (length < buffer.length) { const count = readSync(fd, buffer, length, buffer.length - length, null); if (!count) break; length += count; }
    const bytes = buffer.subarray(0, length), after = fstatSync(fd, { bigint: true }), named = lstatSync(file, { bigint: true });
    if (bytes.length > 128 * 1024 || BigInt(bytes.length) !== stat.size || hash(metadata(after)) !== hash(metadata(stat)) || hash(metadata(named)) !== hash(metadata(stat)) ||
        ancestry(file) !== pathChain) fail("native_configuration_observation_race");
    return { present: true, metadata: metadata(after), sha256: hash(bytes), source_path_policy: NATIVE_CONFIGURATION_CONTRACT, path_chain_sha256: pathChain };
  } finally { closeSync(fd); }
}

export function nativeConfigurationFixtureRoot(root) {
  if (!absolute(root)) fail("native_configuration_fixture_root_invalid");
  const stat = lstatSync(root, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(root) !== root || (stat.mode & 0o777n) !== 0o700n ||
      (process.getuid && stat.uid !== BigInt(process.getuid()))) fail("native_configuration_fixture_root_invalid");
  return { root, identity: directoryIdentity(stat) };
}
export function assertNativeConfigurationFixtureRoots(roots) {
  if (!Array.isArray(roots) || !roots.length || roots.length > 16 || new Set(roots.map(r => r?.root)).size !== roots.length)
    fail("native_configuration_fixture_roots_invalid");
  for (const root of roots) if (hash(nativeConfigurationFixtureRoot(root.root)) !== hash(root)) fail("native_configuration_fixture_root_changed");
}
export function assertNativeConfigurationSelection(selection) {
  if (selection?.schema !== NATIVE_CONFIGURATION_CONTRACT || !Array.isArray(selection.external_sources) || !selection.external_sources.length ||
      selection.external_sources.length > 256 || new Set(selection.external_sources.map(r => r.file)).size !== selection.external_sources.length)
    fail("native_configuration_inventory_invalid");
  assertNativeConfigurationFixtureRoots(selection.fixture_roots);
  for (const source of selection.external_sources) {
    if (source.id !== `native-config-${hash(source.file).slice(0, 24)}` || !absolute(source.file) || source.classification !== "safety" || source.nativeConfiguration !== true ||
        selection.fixture_roots.some(root => inside(source.file, root.root))) fail("native_configuration_inventory_invalid");
    if (hash(observeNativeConfigurationInput(source.file)) !== hash(source.before)) fail("native_configuration_external_changed");
  }
}
export function selectedNativeFixtureRoots(environment, selection) {
  const encoded = environment[NATIVE_FIXTURE_ROOTS_ENV];
  if (!encoded) return selection.fixture_roots;
  if (encoded.length > 32 * 1024) fail("native_configuration_fixture_roots_invalid");
  const value = JSON.parse(encoded);
  if (value.selection_fingerprint !== environment[`${selectedKey}_SHA256`]) fail("native_configuration_fixture_binding_invalid");
  assertNativeConfigurationFixtureRoots(value.roots);
  for (const root of selection.fixture_roots) if (!value.roots.some(other => hash(root) === hash(other))) fail("native_configuration_fixture_binding_invalid");
  if (selection.external_sources.some(source => value.roots.some(root => inside(source.file, root.root)))) fail("native_configuration_parent_inventory_changed");
  return value.roots;
}

// The native scope owner runs in the selected test/controller process. Its
// minimal launch environment is intentionally not the selection authority.
export function assertSelectedNativeConfigurationSources(files, environment = process.env) {
  const file = environment[selectedKey];
  if (!file) return;
  const expected = environment[`${selectedKey}_SHA256`];
  if (!absolute(file) || !/^[a-f0-9]{64}$/u.test(expected ?? "")) fail("native_configuration_selection_missing");
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o400 || realpathSync(file) !== file ||
      stat.size > 1024 * 1024 || (process.getuid && stat.uid !== process.getuid())) fail("native_configuration_selection_unsafe");
  const bytes = readFileSync(file);
  if (hash(bytes) !== expected) fail("native_configuration_selection_changed");
  const manifest = JSON.parse(bytes), selection = manifest.native_configuration;
  if (manifest.contract !== "augnes.local-canonical-selected-execution.v1") fail("native_configuration_selection_missing");
  assertNativeConfigurationSelection(selection);
  const roots = selectedNativeFixtureRoots(environment, selection);
  for (const source of files) {
    if (!roots.some(root => inside(source, root.root)) && !selection.external_sources.some(r => r.file === source)) fail("native_configuration_source_unselected");
    observeNativeConfigurationInput(source); // Reject aliases inside mutable fixtures too.
  }
}
