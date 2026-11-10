#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { buildCanonicalChildEnvironment, createCanonicalTestResourceRoot,
  createCanonicalTestResourceDirectory, beginCanonicalTestResourceUse,
  settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { MERGED_R8A_COMMIT, MERGED_R8A_TREE } from "./merged-r8a-fixture-build-config.mjs";
import { mergedR8AInstalledIdentity } from "./merged-r8a-fixture-dependencies.mjs";
import { R8A_DEPENDENCY_DIRECTORY, R8A_DEPENDENCY_SOURCES, assertR8ADependencySources,
  readPreparedR8ADependencies, sha256 } from "./merged-r8a-dependency-provision.mjs";

// Explicit preparation only. No package handoff, installed Companion, production
// data or current dependency tree is opened for mutation. Existing provisions
// are refused, never silently refreshed or accepted as a different historical graph.
assert.equal(process.argv.length, 2, "this preparation command takes no paths or versions");
assert.equal(process.versions.node, CANONICAL_NODE_VERSION);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(repositoryRoot, R8A_DEPENDENCY_DIRECTORY);
mkdirSync(path.dirname(root), { recursive: true, mode: 0o700 });
let complete = false, settled = true;
const results = [], owners = [], inUse = [];
let destination;
try {
  destination = createCanonicalTestResourceDirectory(root); owners.push(destination);
  const temporary = createCanonicalTestResourceRoot("ag-resource-test-", { shortSocketPaths: true }); owners.push(temporary);
  const environment = buildCanonicalChildEnvironment({ temporaryRoot: temporary.root });
  delete environment.NODE_ENV;
  environment.npm_config_cache = path.join(temporary.root, "npm-cache");
  environment.npm_config_devdir = path.join(temporary.root, "node-gyp");
  environment.npm_config_userconfig = path.join(temporary.root, "npmrc");
  // The historical manifests/locks stay byte-identical. npm's install-script
  // consent is an explicit preparation input, limited to resolved packages.
  writeFileSync(environment.npm_config_userconfig,
    "allow-scripts=better-sqlite3@12.9.0,esbuild@0.28.1,esbuild@0.27.7,fsevents@2.3.3,sharp@0.34.5\n",
    { flag: "wx", mode: 0o600 });
  for (const key of ["HOME", "APPDATA", "LOCALAPPDATA", "AUGNES_RUNTIME_STATE_DIR"])
    mkdirSync(environment[key], { recursive: true, mode: 0o700 });
  for (const owner of owners) { beginCanonicalTestResourceUse(owner); inUse.push(owner); }
  const readGit = args => {
    const result = spawnSync("git", args, { cwd: repositoryRoot, env: environment, timeout: 30_000, maxBuffer: 4 * 1024 * 1024 });
    assert.equal(result.status, 0, "historical Git source unavailable");
    assert.equal(result.error, undefined);
    return result.stdout;
  };
  assert.equal(readGit(["rev-parse", `${MERGED_R8A_COMMIT}^{tree}`]).toString().trim(), MERGED_R8A_TREE);
  for (const [relative, expected] of Object.entries(R8A_DEPENDENCY_SOURCES)) {
    const bytes = readGit(["show", `${MERGED_R8A_COMMIT}:${relative}`]);
    assert.equal(sha256(bytes), expected);
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true, mode: 0o700 });
    writeFileSync(path.join(root, relative), bytes, { flag: "wx", mode: 0o600 });
  }
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const version = spawnSync(npm, ["--version"], { env: environment, encoding: "utf8", timeout: 10_000 });
  assert.equal(version.status, 0); assert.equal(version.stdout.trim(), "11.16.0");
  for (const prefix of ["", "apps/augnes_apps"]) {
    settled = false;
    const result = await runCanonicalChild({ suite: "historical-dependency-preparation",
      label: prefix || "root", command: npm, args: ["ci", "--no-audit", "--no-fund"],
      cwd: path.join(root, prefix), env: environment, timeoutMs: 300_000 });
    results.push(result);
    settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
    assert.equal(canonicalChildAcceptanceFailure(result, { suite: "historical-dependency-preparation", timeoutMs: 300_000, requireCompleteCleanup: true }), null);
    assertR8ADependencySources(root);
  }
  const record = { schema: "augnes.merged-r8a-dependencies.v1", commit: MERGED_R8A_COMMIT,
    tree: MERGED_R8A_TREE, platform: process.platform, arch: process.arch,
    node: process.versions.node, abi: process.versions.modules, npm: "11.16.0",
    sources: R8A_DEPENDENCY_SOURCES, installed: mergedR8AInstalledIdentity(root) };
  writeFileSync(path.join(root, "provision.json"), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  const verified = readPreparedR8ADependencies(repositoryRoot);
  complete = true;
  console.log(JSON.stringify({ historical_dependency_preparation: "pass", fingerprint: verified.fingerprint, record, results }));
} finally {
  if (settled) for (const owner of inUse) settleCanonicalTestResourceUse(owner,
    { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  const cleanup = cleanupCanonicalTestResources(owners.filter(owner => !complete || owner !== destination).reverse());
  console.log(JSON.stringify({ cleanup, historical_dependency_artifact_retained: complete }));
  assert(cleanup.every(item => item.completed), "historical dependency preparation cleanup incomplete");
}
