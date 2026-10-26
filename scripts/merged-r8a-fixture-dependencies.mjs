import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { normalizedDependencyLock } from "./dependency-lock-compatibility.mjs";

// This is the #1118 fixture's one reviewed reuse delta, not a relaxed lock
// normalizer or a general superset/install policy. The new leaf has no bins,
// dependencies or peer requirements and is never copied into historical input.
export const R8A_CURRENT_ONLY_PARSER = Object.freeze({
  version: "1.8.0",
  resolved: "https://registry.npmjs.org/smol-toml/-/smol-toml-1.8.0.tgz",
  integrity: "sha512-kCZr2V3ch9i00x8zXRhjUNVcjG9ijES5dDudkXvUVCT5QlJNQWElSJdZqyPemffHoLNUYwOcou0Fy+ojN0uHSQ==",
  license: "BSD-3-Clause",
  engines: Object.freeze({ node: ">= 18" }),
  funding: Object.freeze({ url: "https://github.com/sponsors/cyyynthia" }),
});
const PARSER = "node_modules/smol-toml";
const PREFIXES = ["", "apps/augnes_apps/"];
const EDGE_FIELDS = ["dependencies", "optionalDependencies", "peerDependencies", "peerDependenciesMeta"];
const readJson = file => JSON.parse(readFileSync(file, "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const stableHash = value => hash(JSON.stringify(value));
const inside = (root, file) => file.startsWith(`${root}${path.sep}`);
function regular(file) {
  const stat = lstatSync(file, { bigint: true });
  assert(stat.isFile() && !stat.isSymbolicLink(), "fixture dependency file must be regular");
  return stat;
}
function normalizedRecord(record) {
  return normalizedDependencyLock({ packages: { dependency: record } }).packages.dependency;
}

export function planMergedR8ADependencyView(historical, current, nested = false) {
  const oldGraph = normalizedDependencyLock(historical);
  const newGraph = normalizedDependencyLock(current);
  if (isDeepStrictEqual(oldGraph, newGraph)) return [];
  assert(!nested, "historical nested dependency graph changed");
  assert(!Object.hasOwn(oldGraph.packages, PARSER), "historical parser preimage changed");
  assert(!Object.hasOwn(oldGraph.packages[""].dependencies, "smol-toml"), "historical parser declaration changed");
  assert.equal(newGraph.packages[""].dependencies["smol-toml"], "1.8.0", "unapproved parser declaration");
  assert.deepEqual(newGraph.packages[PARSER], R8A_CURRENT_ONLY_PARSER, "unapproved parser package record");
  delete newGraph.packages[""].dependencies["smol-toml"];
  delete newGraph.packages[PARSER];
  assert.deepEqual(newGraph, oldGraph, "unsupported historical dependency reuse delta");
  // The original graphs still compare unequal; only a physical, historical-only
  // copy may consume this plan, with its own installed-material validation.
  return [PARSER];
}

function packageName(packagePath) {
  return packagePath.slice(packagePath.lastIndexOf("node_modules/") + "node_modules/".length);
}
function bins(value, name) {
  const entries = typeof value === "string" ? { [name.split("/").at(-1)]: value } : value ?? {};
  return Object.fromEntries(Object.entries(entries).map(([key, target]) => {
    assert(/^[A-Za-z0-9_.-]+$/u.test(key) && typeof target === "string", "unsupported bin metadata");
    const clean = target.replace(/^\.\//u, "");
    assert(clean && !path.isAbsolute(clean) && !clean.split("/").includes(".."), "unsafe bin target");
    return [key, clean];
  }));
}
function onPlatform(record) {
  const permits = (list, value) => !list || (!list.includes(`!${value}`) &&
    (!list.some(item => !item.startsWith("!")) || list.includes(value)));
  return permits(record.os, process.platform) && permits(record.cpu, process.arch);
}
function resolutionCandidates(owner, name) {
  assert(/^(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_.-]+$/u.test(name), "unsafe dependency name");
  const result = [];
  for (let dir = owner; ; dir = path.posix.dirname(dir)) {
    if (path.posix.basename(dir) !== "node_modules") result.push(dir === "." || dir === "" ? `node_modules/${name}` : `${dir}/node_modules/${name}`);
    if (dir === "." || dir === "") return result;
  }
}

function treeSnapshot(root) {
  const entries = new Map();
  function visit(relative) {
    const file = path.join(root, relative);
    const stat = lstatSync(file, { bigint: true });
    const common = { mode: Number(stat.mode & 0o777n), inode: `${stat.dev}:${stat.ino}` };
    if (stat.isSymbolicLink()) {
      const link = readlinkSync(file);
      assert(!path.isAbsolute(link) && inside(root, realpathSync(file)), "dependency symlink escapes isolated tree");
      entries.set(relative, { ...common, kind: "link", link });
    } else if (stat.isDirectory()) {
      entries.set(relative, { ...common, kind: "directory" });
      for (const name of readdirSync(file).sort()) visit(relative ? `${relative}/${name}` : name);
    } else {
      assert(stat.isFile(), "unsupported dependency entry");
      entries.set(relative, { ...common, kind: "file", sha256: hash(readFileSync(file)) });
    }
  }
  visit("");
  return entries;
}

function inspectInstalled(projectRoot, lock) {
  const root = path.join(projectRoot, "node_modules");
  assert.equal(realpathSync(root), root, "dependency root must be physical");
  assert(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink());
  regular(path.join(root, ".package-lock.json"));
  const hidden = readJson(path.join(root, ".package-lock.json"));
  assert.deepEqual(Object.keys(hidden).sort(), ["lockfileVersion", "name", "packages", "requires", "version"], "unsupported hidden lock metadata");
  assert.equal(hidden.lockfileVersion, lock.lockfileVersion);
  assert.equal(hidden.name, lock.name);
  assert.equal(hidden.version, lock.version);
  assert.equal(hidden.requires, lock.requires);
  const installed = Object.keys(hidden.packages).sort();
  assert(!installed.includes(""), "hidden lock must describe installed packages only");
  const expectedBins = new Map();
  const modules = new Map([["node_modules", new Set()]]);
  for (const packagePath of installed) {
    assert(/^node_modules\//u.test(packagePath) && !packagePath.split("/").includes("..") && !packagePath.includes("\\"));
    const locked = lock.packages[packagePath];
    assert(locked, "installed package absent from source lock");
    assert.deepEqual(normalizedRecord(hidden.packages[packagePath]), normalizedRecord(locked), "installed resolution/integrity metadata changed");
    const packageRoot = path.join(projectRoot, packagePath);
    assert.equal(realpathSync(packageRoot), packageRoot, "installed package must not be shared by symlink");
    regular(path.join(packageRoot, "package.json"));
    const manifest = readJson(path.join(packageRoot, "package.json"));
    assert.equal(manifest.name, locked.name ?? packageName(packagePath), "installed package name mismatch");
    assert.equal(manifest.version, locked.version, "installed package version mismatch");
    for (const field of EDGE_FIELDS) assert.deepEqual(manifest[field] ?? {}, locked[field] ?? {}, `installed ${field} mismatch`);
    const actualBins = bins(manifest.bin, manifest.name);
    assert.deepEqual(actualBins, bins(locked.bin, manifest.name), "installed bin metadata mismatch");
    const modulesPath = packagePath.slice(0, packagePath.lastIndexOf("node_modules/") + "node_modules".length);
    if (!modules.has(modulesPath)) modules.set(modulesPath, new Set());
    modules.get(modulesPath).add(packageName(packagePath));
    for (const [name, relative] of Object.entries(actualBins)) {
      const binPath = `${modulesPath}/.bin/${name}`;
      assert(!expectedBins.has(binPath), "ambiguous bin resolution");
      expectedBins.set(binPath, path.join(packageRoot, relative));
    }
  }
  for (const [packagePath, record] of Object.entries(lock.packages)) {
    if (packagePath && !record.optional) assert(hidden.packages[packagePath], "required installed package missing");
  }
  // Resolve each edge from its actual Node package location. Optional packages
  // under an uninstalled platform-specific parent need not be materialized.
  for (const owner of ["", ...installed]) {
    const record = lock.packages[owner];
    for (const field of ["dependencies", "optionalDependencies", "peerDependencies", ...(owner === "" ? ["devDependencies"] : [])]) {
      for (const name of Object.keys(record[field] ?? {})) {
        const candidates = resolutionCandidates(owner, name);
        const lockedPath = candidates.find(candidate => lock.packages[candidate]);
        const optionalPeer = field === "peerDependencies" && record.peerDependenciesMeta?.[name]?.optional;
        if (!lockedPath && optionalPeer) continue;
        assert(lockedPath, "locked dependency resolution missing");
        if (field === "optionalDependencies" && !onPlatform(lock.packages[lockedPath])) continue;
        if (optionalPeer && !hidden.packages[lockedPath]) continue;
        assert(hidden.packages[lockedPath], "installed dependency resolution missing");
        assert.equal(candidates.find(candidate => existsSync(path.join(projectRoot, candidate))), lockedPath, "installed dependency resolution shadowed");
      }
    }
  }
  const snapshot = treeSnapshot(root);
  for (const [relative, entry] of snapshot) {
    const fullRelative = relative ? `node_modules/${relative}` : "node_modules";
    if (entry.kind === "directory" && path.posix.basename(fullRelative) === "node_modules") {
      assert(modules.has(fullRelative), "unlocked nested dependency directory");
      const actual = [];
      for (const name of readdirSync(path.join(projectRoot, fullRelative)).sort()) {
        if (name === ".bin" || (fullRelative === "node_modules" && name === ".package-lock.json")) continue;
        if (name.startsWith("@")) for (const child of readdirSync(path.join(projectRoot, fullRelative, name))) actual.push(`${name}/${child}`);
        else actual.push(name);
      }
      assert.deepEqual(actual.sort(), [...modules.get(fullRelative)].sort(), "unlocked installed package/shadow path");
    }
    if (relative.split("/").at(-2) === ".bin") {
      const target = expectedBins.get(fullRelative);
      assert(target && entry.kind === "link", "unexpected installed bin entry");
      assert.equal(realpathSync(path.join(root, relative)), realpathSync(target), "installed bin target mismatch");
    }
  }
  for (const bin of expectedBins.keys()) assert(existsSync(path.join(projectRoot, bin)), "installed bin missing");
  return { snapshot, hidden, installed };
}

// Protect both current inputs across the whole package scenario, including
// its current build before the historical fixture is materialized.
export function snapshotMergedR8ACurrentInputs(currentRoot) {
  currentRoot = realpathSync(currentRoot);
  const inputs = PREFIXES.map(prefix => {
    const root = path.join(currentRoot, prefix), file = path.join(root, "package-lock.json");
    regular(file);
    return { file, hash: hash(readFileSync(file)), root: path.join(root, "node_modules"),
      snapshot: inspectInstalled(root, readJson(file)).snapshot };
  });
  return () => {
    for (const input of inputs) {
      assert.equal(hash(readFileSync(input.file)), input.hash, "current source lock changed during package scenario");
      assert.deepEqual(treeSnapshot(input.root), input.snapshot, "current installed inputs changed during package scenario");
    }
  };
}

// Used by the separately owned, network-enabled preparation command. The
// package scenario itself remains offline and validates this material again.
export function mergedR8AInstalledIdentity(root) {
  return installedIdentity(root, PREFIXES);
}

export function historicalRootInstalledIdentity(root) {
  return installedIdentity(root, [""]);
}

function installedIdentity(root, prefixes) {
  return prefixes.map(prefix => {
    const projectRoot = path.join(realpathSync(root), prefix);
    const lock = readJson(path.join(projectRoot, "package-lock.json"));
    const installed = inspectInstalled(projectRoot, lock);
    return { prefix, packages: installed.installed.length,
      sha256: stableHash([...installed.snapshot].map(([p, { inode, ...v }]) => [p, v])) };
  });
}

/** Only the existing archived #1118 fixture calls this owner. No installs,
 * environment changes, source-lock writes or current-tree mutations occur. */
export function materializeMergedR8ADependencies({ historicalRoot, currentRoot, dependencyRoot = currentRoot }) {
  return materializeDependencies({ historicalRoot, currentRoot, dependencyRoot, prefixes: PREFIXES });
}

// The durable-work predecessor has its own exact root graph. It cannot take
// the current-view exception or borrow the older R8A graph.
export function materializeExactHistoricalRootDependencies({ historicalRoot, currentRoot, dependencyRoot }) {
  assert(dependencyRoot && realpathSync(dependencyRoot) !== realpathSync(currentRoot), "exact historical provision required");
  return materializeDependencies({ historicalRoot, currentRoot, dependencyRoot, prefixes: [""] });
}

function materializeDependencies({ historicalRoot, currentRoot, dependencyRoot, prefixes }) {
  historicalRoot = realpathSync(historicalRoot);
  currentRoot = realpathSync(currentRoot);
  dependencyRoot = realpathSync(dependencyRoot);
  assert(historicalRoot !== dependencyRoot && !inside(dependencyRoot, historicalRoot) && !inside(historicalRoot, dependencyRoot), "dependency copies must be disjoint");
  assert(historicalRoot !== currentRoot && !inside(currentRoot, historicalRoot) && !inside(historicalRoot, currentRoot), "historical source must be isolated");
  const inputs = prefixes.map(prefix => {
    const oldFile = path.join(historicalRoot, prefix, "package-lock.json");
    const newFile = path.join(dependencyRoot, prefix, "package-lock.json");
    regular(oldFile);
    regular(newFile);
    const historical = readJson(oldFile), current = readJson(newFile);
    const excluded = planMergedR8ADependencyView(historical, current, prefix !== "");
    if (dependencyRoot !== currentRoot) assert.equal(hash(readFileSync(oldFile)), hash(readFileSync(newFile)), "prepared historical lock bytes differ");
    const source = path.join(dependencyRoot, prefix, "node_modules");
    const destination = path.join(historicalRoot, prefix, "node_modules");
    assert(!existsSync(destination), "historical dependencies already materialized");
    const installed = inspectInstalled(path.join(dependencyRoot, prefix), current);
    return { prefix, oldFile, newFile, historical, current, excluded, source, destination, installed,
      oldHash: hash(readFileSync(oldFile)), newHash: hash(readFileSync(newFile)) };
  });
  const evidence = [];
  const historicalSnapshots = [];
  for (const input of inputs) {
    const { source, destination, excluded, historical, installed } = input;
    cpSync(source, destination, { recursive: true, force: false, errorOnExist: true,
      preserveTimestamps: true, verbatimSymlinks: true,
      filter: file => file !== path.join(source, ".package-lock.json") &&
        !excluded.some(p => file === path.join(dependencyRoot, input.prefix, p)) });
    const historicalHidden = { ...installed.hidden, name: historical.name, version: historical.version,
      packages: Object.fromEntries(installed.installed.filter(p => !excluded.includes(p)).map(p => [p, historical.packages[p]])) };
    writeFileSync(path.join(destination, ".package-lock.json"), `${JSON.stringify(historicalHidden, null, 2)}\n`, { flag: "wx", mode: 0o644 });
    const actual = inspectInstalled(path.join(historicalRoot, input.prefix), historical);
    historicalSnapshots.push({ root: destination, snapshot: actual.snapshot });
    for (const p of excluded) assert(!existsSync(path.join(historicalRoot, input.prefix, p)), "current-only package leaked");
    const expectedPaths = [...installed.snapshot.keys()].filter(p => !excluded.some(e => {
      const relative = e.slice("node_modules/".length); return p === relative || p.startsWith(`${relative}/`);
    }));
    assert.deepEqual([...actual.snapshot.keys()], expectedPaths, "historical dependency view has unexpected paths");
    for (const [p, entry] of actual.snapshot) {
      const original = installed.snapshot.get(p);
      assert.notEqual(entry.inode, original.inode, "historical dependency entry shares current inode");
      if (p === ".package-lock.json") continue;
      const { inode: _new, ...copied } = entry;
      const { inode: _old, ...sourceEntry } = original;
      assert.deepEqual(copied, sourceEntry, "copied installed bytes/mode/link changed");
    }
    evidence.push({ prefix: input.prefix, excluded, historical_lock_sha256: input.oldHash,
      dependency_source: dependencyRoot === currentRoot ? "approved_current_view" : "exact_historical_install",
      source_lock_sha256: input.newHash, historical_installed_packages: actual.installed.length,
      source_installed_packages: installed.installed.length, copied_entries: actual.snapshot.size,
      historical_dependency_view_sha256: stableHash([...actual.snapshot].map(([p, { inode, ...v }]) => [p, v])),
      hidden_lock_historical_only: true, resolution_and_bins_verified: true, all_copied_inodes_disjoint: true });
  }
  const assertUnchanged = () => {
    for (const input of inputs) {
      assert.equal(hash(readFileSync(input.oldFile)), input.oldHash, "historical source lock changed");
      assert.equal(hash(readFileSync(input.newFile)), input.newHash, "current source lock changed");
      assert.deepEqual(treeSnapshot(input.source), input.installed.snapshot, "current installed dependencies changed");
    }
  };
  assertUnchanged();
  const assertHistoricalViewUnchanged = () => {
    for (const { root, snapshot } of historicalSnapshots)
      assert.deepEqual(treeSnapshot(root), snapshot, "historical dependency view changed after materialization");
  };
  return { evidence, assertUnchanged, assertHistoricalViewUnchanged };
}
