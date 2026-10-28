#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { assertSafeDistributablePath as currentValidator } from "./distributable-package-contract.mjs";
import { MERGED_R8A_COMMIT, MERGED_R8A_TREE, MERGED_R8A_BUILD_ID,
  applyMergedR8AFixtureBuildConfig } from "./merged-r8a-fixture-build-config.mjs";
import { readPreparedR8ADependencies } from "./merged-r8a-dependency-provision.mjs";

const repositoryRoot = process.cwd();
// The producer must come from the exact historical provision even when the
// current application has moved to a different patched Next release.
const provision = readPreparedR8ADependencies(repositoryRoot);
const historicalRequire = createRequire(path.join(provision.root, "package.json"));
const nextConfig = historicalRequire("next/dist/server/config.js");
const nextConstants = historicalRequire("next/constants.js");
const nextGenerate = historicalRequire("next/dist/build/generate-build-id.js");
const nextManifest = historicalRequire("next/dist/shared/lib/turbopack/manifest-loader.js");
const nanoid = historicalRequire("next/dist/compiled/nanoid/index.cjs");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "ag-r8a-config-"));
const sourceRoot = path.join(temporaryRoot, "source");
mkdirSync(sourceRoot);
try {
  assert.equal((await command("git", ["rev-parse", `${MERGED_R8A_COMMIT}^{tree}`])).trim(),
    MERGED_R8A_TREE);
  const archive = path.join(temporaryRoot, "source.tar");
  await command("git", ["archive", "--format=tar", `--output=${archive}`, MERGED_R8A_COMMIT]);
  await command("tar", ["-xf", archive, "-C", sourceRoot]);
  const before = snapshot(sourceRoot);
  // Bind every extracted source file, including modes and symlinks, to Git.
  const listing = await command("git", ["ls-tree", "-r", "-z", MERGED_R8A_TREE]);
  const expected = Object.fromEntries(listing.split("\0").filter(Boolean).map((entry) => {
    const [, mode, kind, hash, name] = /^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/u.exec(entry);
    assert.equal(kind, "blob");
    return [name, { mode, hash }];
  }));
  assert.deepEqual(before, expected);
  const historical = await import(pathToFileURL(path.join(sourceRoot,
    "scripts/distributable-package-contract.mjs")).href);
  const historicalValidator = historical.assertSafeDistributablePath;
  const pinned = JSON.parse(readFileSync(path.join(sourceRoot, "package.json"))).dependencies.next;
  assert.equal(pinned, "16.2.4");
  assert.equal(historicalRequire("next/package.json").version, pinned);

  // Actual bundled nanoid, with its existing injected byte-source seam; no
  // random/crypto globals are patched and no production build is retried.
  const hyphenIndex = nanoid.urlAlphabet.indexOf("-");
  assert(hyphenIndex >= 0);
  const generated = nanoid.customRandom(nanoid.urlAlphabet, 8,
    (size) => new Uint8Array(size).fill(hyphenIndex))();
  assert.equal(generated, "--------");
  const badId = await nextGenerate.generateBuildId(() => null, () => generated);
  for (const candidate of writeNextManifests(badId)) {
    assert.throws(() => historicalValidator(candidate), /package_path_unsafe/u);
    assert.equal(currentValidator(candidate), candidate);
  }
  for (const candidate of [".next/static/fixture/_buildManifest.js", ".next/static/ordinary-id/_buildManifest.js"]) {
    assert.equal(historicalValidator(candidate), candidate);
  }
  assert.throws(() => historicalValidator(".next/static/-fixture/_buildManifest.js"), /package_path_unsafe/u);
  for (const candidate of ["../x", "/x", "-option/x", "a//b", "a/./b", "a/../b",
    "a\\b", "C:/x", "a:b", "a\0b", "a\nb", ""]) {
    assert.throws(() => historicalValidator(candidate), /package_path_unsafe/u);
    assert.throws(() => currentValidator(candidate), /package_path_unsafe/u);
  }
  for (const identity of [{ commit: "wrong", tree: MERGED_R8A_TREE },
    { commit: MERGED_R8A_COMMIT, tree: "wrong" }]) {
    assert.throws(() => applyMergedR8AFixtureBuildConfig({ sourceRoot, ...identity }));
    assert.deepEqual(snapshot(sourceRoot), before);
  }
  const configPath = path.join(sourceRoot, "next.config.ts");
  const originalConfig = readFileSync(configPath, "utf8");
  writeFileSync(configPath, `${originalConfig}// unexpected source change\n`);
  assert.throws(() => applyMergedR8AFixtureBuildConfig({ sourceRoot,
    commit: MERGED_R8A_COMMIT, tree: MERGED_R8A_TREE }), /preimage changed/u);
  assert.equal(readFileSync(configPath, "utf8"), `${originalConfig}// unexpected source change\n`);
  writeFileSync(configPath, originalConfig);
  const provenance = applyMergedR8AFixtureBuildConfig({ sourceRoot,
    commit: MERGED_R8A_COMMIT, tree: MERGED_R8A_TREE });
  assert.equal(readFileSync(configPath, "utf8"), originalConfig.replace(
    '  output: "standalone",',
    `  output: "standalone",\n  generateBuildId: async () => "${MERGED_R8A_BUILD_ID}",`));
  const after = snapshot(sourceRoot);
  assert.equal(after["next.config.ts"].mode, before["next.config.ts"].mode);
  after["next.config.ts"] = before["next.config.ts"];
  assert.deepEqual(after, before, "the sole overlay must preserve every other historical source file");

  // Use Next's actual config loader and build-ID consumer, then its manifest
  // producer. The complete handoff additionally checks the real build output.
  const config = await nextConfig.default(nextConstants.PHASE_PRODUCTION_BUILD, sourceRoot);
  assert.equal(config.output, "standalone");
  const buildId = await nextGenerate.generateBuildId(config.generateBuildId,
    () => assert.fail("controlled fixture must not use the random fallback"));
  assert.equal(buildId, MERGED_R8A_BUILD_ID);
  for (const candidate of writeNextManifests(buildId)) {
    assert.equal(historicalValidator(candidate), candidate);
  }
  const owner = readFileSync("scripts/test-distributable-package.mjs", "utf8");
  assert.match(owner, /mergedR8AFixtureBuildConfiguration = applyMergedR8AFixtureBuildConfig\(\{/u);
  assert.match(owner, /the historical Next build must consume the controlled build configuration/u);
  assert.match(owner, /merged_r8a_fixture_build_configuration: mergedR8AFixtureBuildConfiguration/u);
  assert.equal(readPreparedR8ADependencies(repositoryRoot).fingerprint, provision.fingerprint);
  console.log(JSON.stringify({ test: "merged-r8a-fixture-build-configuration", status: "pass",
    historical_files_verified: Object.keys(before).length, changed_source_files: ["next.config.ts"],
    next_version: pinned, unsafe_controls: 12, actual_config_and_manifest_producers_verified: true,
    provenance }, null, 2));
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
assert.equal(existsSync(temporaryRoot), false);

async function command(executable, args) {
  let stdout = "";
  const result = await runCanonicalChild({ suite: "historical-fixture-config", label: executable,
    command: executable, args, cwd: repositoryRoot,
    env: buildCanonicalChildEnvironment({ temporaryRoot }), timeoutMs: 30_000,
    stdout: { write: (chunk) => { stdout += chunk; } }, stderr: process.stderr, log: () => {} });
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: "historical-fixture-config",
    timeoutMs: 30_000, requireNaturalExit: true }), null);
  return stdout;
}

function snapshot(root, prefix = "", result = {}) {
  for (const name of readdirSync(path.join(root, prefix))) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const file = path.join(root, relative);
    const stat = lstatSync(file);
    if (stat.isDirectory()) { snapshot(root, relative, result); continue; }
    assert(stat.isFile() || stat.isSymbolicLink());
    const bytes = stat.isSymbolicLink() ? Buffer.from(readlinkSync(file)) : readFileSync(file);
    result[relative] = {
      mode: stat.isSymbolicLink() ? "120000" : stat.mode & 0o111 ? "100755" : "100644",
      hash: createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"),
    };
  }
  return result;
}

function writeNextManifests(buildId) {
  const distDir = path.join(temporaryRoot, "generated", buildId, ".next");
  mkdirSync(path.join(distDir, "static", buildId), { recursive: true });
  const loader = new nextManifest.TurbopackManifestLoader({ distDir, buildId,
    dev: false, sriEnabled: false });
  return loader.writeClientBuildManifest({ page: new Map(), global: {} }).map((file) => {
    assert(readFileSync(path.join(distDir, file)).length > 0);
    return `.next/${file}`;
  });
}
