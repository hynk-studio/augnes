#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { materializeMergedR8ADependencies, materializeExactHistoricalRootDependencies, planMergedR8ADependencyView, R8A_CURRENT_ONLY_PARSER, snapshotMergedR8ACurrentInputs } from "./merged-r8a-fixture-dependencies.mjs";

import {
  ROOT_DEPENDENCY_BEARING_FIELDS,
  normalizedDependencyLock,
} from "./dependency-lock-compatibility.mjs";
import { assertR8AProvisionRecord, R8A_DEPENDENCY_SOURCES } from "./merged-r8a-dependency-provision.mjs";
import { MERGED_R8A_COMMIT, MERGED_R8A_TREE } from "./merged-r8a-fixture-build-config.mjs";
import { assertDurableProvisionRecord, DURABLE_DEPENDENCY_SOURCES, DURABLE_WORK_PREDECESSOR, DURABLE_WORK_TREE } from "./durable-work-dependency-provision.mjs";

const provision = { schema: "augnes.merged-r8a-dependencies.v1", commit: MERGED_R8A_COMMIT,
  tree: MERGED_R8A_TREE, platform: process.platform, arch: process.arch,
  node: process.versions.node, abi: process.versions.modules, npm: "11.16.0",
  sources: R8A_DEPENDENCY_SOURCES, installed: [{ prefix: "", packages: 1, sha256: "a".repeat(64) }] };
assertR8AProvisionRecord(provision, provision.installed);
for (const [key, value] of Object.entries({ tree: "0".repeat(40), node: "v24.22.1", abi: "0", npm: "11.19.1", sources: {}, installed: [] }))
  assert.throws(() => assertR8AProvisionRecord({ ...provision, [key]: value }, provision.installed));
const durableProvision = { ...provision, schema: "augnes.durable-work-dependencies.v1",
  commit: DURABLE_WORK_PREDECESSOR, tree: DURABLE_WORK_TREE, sources: DURABLE_DEPENDENCY_SOURCES };
assertDurableProvisionRecord(durableProvision, durableProvision.installed);
for (const [key, value] of Object.entries({ commit: MERGED_R8A_COMMIT, tree: MERGED_R8A_TREE,
  node: "v24.22.1", abi: "0", npm: "11.19.1", sources: R8A_DEPENDENCY_SOURCES, installed: [] }))
  assert.throws(() => assertDurableProvisionRecord({ ...durableProvision, [key]: value }, durableProvision.installed));

const rootLock = createLock("augnes");

expectCompatible(rootLock, (candidate) => {
  candidate.version = "9.9.9";
  candidate.packages[""].version = "9.9.9";
});
expectCompatible(rootLock, (candidate) => {
  candidate.packages[""].engines = {
    node: "^22.0.0 || ^24.0.0",
    npm: ">=10 <12",
  };
});
const rootLockWithoutEngines = structuredClone(rootLock);
delete rootLockWithoutEngines.packages[""].engines;
expectCompatible(rootLockWithoutEngines, (candidate) => {
  candidate.packages[""].engines = { node: ">=24" };
});
expectCompatible(rootLock, (candidate) => {
  candidate.packages[""].engines = { node: ">=24" };
  candidate.packages[""].packageManager = "npm@11.16.0";
  candidate.packages[""].devEngines = {
    runtime: { name: "node", onFail: "error" },
  };
});

expectIncompatible(rootLock, (candidate) => {
  candidate.packages[""].dependencies.react = "19.2.6";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages[""].devDependencies.typescript = "6.0.4";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages[""].optionalDependencies.sharp = "0.34.6";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages[""].peerDependencies.react = "^20.0.0";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages[""].peerDependenciesMeta.react.optional = false;
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages[""].workspaces.push("packages/extra");
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages["node_modules/react"].version = "19.2.6";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages["node_modules/react"].resolved =
    "https://registry.npmjs.org/react/-/react-19.2.6.tgz";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages["node_modules/react"].integrity = "sha512-changed";
});
expectIncompatible(rootLock, (candidate) => {
  candidate.packages["node_modules/react"].engines = { node: ">=24" };
});
expectCompatible(rootLock, (candidate) => {
  candidate.packages["node_modules/react"].peer = true;
});
expectIncompatible(rootLock, (candidate) => {
  delete candidate.packages["node_modules/react"];
});

const nestedLock = createLock("@augnes/apps");
expectIncompatible(nestedLock, (candidate) => {
  candidate.packages[""].dependencies["@modelcontextprotocol/sdk"] =
    "^1.30.0";
});
expectIncompatible(nestedLock, (candidate) => {
  candidate.packages["node_modules/react"].integrity = "sha512-nested-change";
});

assert.deepEqual(ROOT_DEPENDENCY_BEARING_FIELDS, [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundledDependencies",
  "bundleDependencies",
  "workspaces",
]);

const materializationCases = testHistoricalMaterialization();

console.log(
  JSON.stringify(
    {
      test: "dependency-lock-compatibility",
      status: "pass",
      root_version_ignored: true,
      root_engines_addition_and_change_ignored: true,
      root_package_manager_policy_ignored: true,
      root_dependency_declarations_exact: true,
      transitive_package_entries_exact: true,
      resolved_and_integrity_material_exact: true,
      transitive_peer_reachability_classification_ignored: true,
      deleted_package_entries_refused: true,
      nested_lock_compatibility_protected: true,
      historical_materialization_cases: materializationCases,
      current_only_parser_excluded_from_historical_view: true,
      current_source_locks_and_installed_files_unchanged: true,
      isolated_copy_resolution_bins_and_hidden_lock_verified: true,
    },
    null,
    2,
  ),
);

function createLock(name) {
  return {
    name,
    version: "0.1.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": {
        name,
        version: "0.1.0",
        dependencies: {
          "@modelcontextprotocol/sdk": "^1.29.0",
          react: "19.2.5",
        },
        devDependencies: {
          typescript: "6.0.3",
        },
        optionalDependencies: {
          sharp: "0.34.5",
        },
        peerDependencies: {
          react: "^19.0.0",
        },
        peerDependenciesMeta: {
          react: { optional: true },
        },
        bundledDependencies: ["embedded-one"],
        bundleDependencies: ["embedded-two"],
        workspaces: ["apps/*"],
        engines: {
          node: ">=20.9.0",
        },
      },
      "node_modules/react": {
        version: "19.2.5",
        resolved: "https://registry.npmjs.org/react/-/react-19.2.5.tgz",
        integrity: "sha512-original",
        license: "MIT",
        engines: {
          node: ">=0.10.0",
        },
      },
    },
  };
}

function expectCompatible(lock, mutate) {
  const candidate = structuredClone(lock);
  mutate(candidate);
  assert.deepEqual(
    normalizedDependencyLock(candidate),
    normalizedDependencyLock(lock),
  );
}

function expectIncompatible(lock, mutate) {
  const candidate = structuredClone(lock);
  mutate(candidate);
  assert.notDeepEqual(
    normalizedDependencyLock(candidate),
    normalizedDependencyLock(lock),
  );
}

function testHistoricalMaterialization() {
  const parent = mkdtempSync(path.join(tmpdir(), "augnes-r8a-dependencies-"));
  let count = 0;
  const simpleLock = (name) => ({ name, version: "0.1.0", lockfileVersion: 3, requires: true,
    packages: { "": { name, version: "0.1.0", dependencies: { base: "1.0.0" } },
      "node_modules/base": { version: "1.0.0", resolved: "https://example.invalid/base.tgz", integrity: "sha512-base",
        dependencies: { leaf: "1.0.0" }, bin: { base: "bin/run.js" } },
      "node_modules/leaf": { version: "1.0.0", resolved: "https://example.invalid/leaf.tgz", integrity: "sha512-leaf" } } });
  const addParser = lock => { lock.packages[""].dependencies["smol-toml"] = "1.8.0"; lock.packages["node_modules/smol-toml"] = structuredClone(R8A_CURRENT_ONLY_PARSER); };
  const json = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, `${JSON.stringify(value)}\n`); };
  function installed(root, lock) {
    json(path.join(root, "package-lock.json"), lock);
    json(path.join(root, "package.json"), lock.packages[""]);
    const records = Object.entries(lock.packages).filter(([p]) => p);
    json(path.join(root, "node_modules/.package-lock.json"), { ...lock, packages: Object.fromEntries(records) });
    for (const [p, record] of records) {
      const name = p.split("/").at(-1);
      json(path.join(root, p, "package.json"), { name, version: record.version,
        ...(record.dependencies ? { dependencies: record.dependencies } : {}), ...(record.bin ? { bin: record.bin } : {}) });
      writeFileSync(path.join(root, p, "index.js"), `module.exports = ${JSON.stringify(name)};\n`);
      for (const [bin, relative] of Object.entries(record.bin ?? {})) {
        mkdirSync(path.dirname(path.join(root, p, relative)), { recursive: true });
        writeFileSync(path.join(root, p, relative), "#!/usr/bin/env node\n", { mode: 0o755 });
        mkdirSync(path.join(root, "node_modules/.bin"), { recursive: true });
        symlinkSync(`../${name}/${relative}`, path.join(root, "node_modules/.bin", bin));
      }
    }
  }
  function fixture(additive = true) {
    const root = path.join(parent, `case-${count++}`), historicalRoot = path.join(root, "historical"), currentRoot = path.join(root, "current");
    for (const prefix of ["", "apps/augnes_apps"]) {
      const old = simpleLock(prefix ? "@augnes/apps" : "augnes"), current = structuredClone(old);
      if (!prefix && additive) addParser(current);
      json(path.join(historicalRoot, prefix, "package-lock.json"), old);
      json(path.join(historicalRoot, prefix, "package.json"), old.packages[""]);
      installed(path.join(currentRoot, prefix), current);
    }
    return { historicalRoot, currentRoot };
  }
  function mutate(file, update) { const value = JSON.parse(readFileSync(file)); update(value); json(file, value); }
  try {
    const durable = fixture(false), durablePrepared = fixture(false).currentRoot;
    assert.throws(() => materializeExactHistoricalRootDependencies({ ...durable,
      dependencyRoot: durable.currentRoot }), /exact historical provision required/u);
    const durableView = materializeExactHistoricalRootDependencies({ ...durable, dependencyRoot: durablePrepared });
    assert.equal(durableView.evidence.length, 1);
    assert.equal(durableView.evidence[0].dependency_source, "exact_historical_install");
    assert(!existsSync(path.join(durable.historicalRoot, "apps/augnes_apps/node_modules")));
    durableView.assertUnchanged(); durableView.assertHistoricalViewUnchanged();
    const durableMismatch = fixture(false), durableMismatchPrepared = fixture(false).currentRoot;
    mutate(path.join(durableMismatchPrepared, "package-lock.json"), l => { l.version = "9.0.0"; });
    assert.throws(() => materializeExactHistoricalRootDependencies({ ...durableMismatch,
      dependencyRoot: durableMismatchPrepared }), /prepared historical lock bytes differ/u);
    // A changed current graph cannot be reused. A separately installed exact
    // historical graph can supply the fixture, without either source being relabelled.
    const changed = fixture(false), prepared = fixture(false).currentRoot;
    mutate(path.join(changed.currentRoot, "package-lock.json"), l => { l.packages["node_modules/leaf"].version = "2.0.0"; });
    assert.throws(() => materializeMergedR8ADependencies(changed));
    const exact = materializeMergedR8ADependencies({ ...changed, dependencyRoot: prepared });
    assert(exact.evidence.every(e => e.dependency_source === "exact_historical_install" && e.excluded.length === 0));
    exact.assertUnchanged(); exact.assertHistoricalViewUnchanged();
    writeFileSync(path.join(prepared, "node_modules/leaf/index.js"), "changed prepared input\n");
    assert.throws(exact.assertUnchanged);
    const mismatched = fixture(false), mismatchedPrepared = fixture(false).currentRoot;
    mutate(path.join(mismatchedPrepared, "package-lock.json"), l => { l.version = "9.0.0"; });
    assert.throws(() => materializeMergedR8ADependencies({ ...mismatched, dependencyRoot: mismatchedPrepared }), /prepared historical lock bytes differ/u);
    for (const additive of [false, true]) {
      const input = fixture(additive);
      const historical = JSON.parse(readFileSync(path.join(input.historicalRoot, "package-lock.json")));
      const current = JSON.parse(readFileSync(path.join(input.currentRoot, "package-lock.json")));
      assert.deepEqual(planMergedR8ADependencyView(historical, current), additive ? ["node_modules/smol-toml"] : []);
      if (additive) assert.notDeepEqual(normalizedDependencyLock(historical), normalizedDependencyLock(current));
      const assertCurrentInputsUnchanged = snapshotMergedR8ACurrentInputs(input.currentRoot);
      const result = materializeMergedR8ADependencies(input);
      assertCurrentInputsUnchanged();
      const oldRequire = createRequire(path.join(input.historicalRoot, "package.json"));
      assert.equal(oldRequire("base"), "base");
      assert.throws(() => oldRequire.resolve("smol-toml"), { code: "MODULE_NOT_FOUND" });
      const hidden = JSON.parse(readFileSync(path.join(input.historicalRoot, "node_modules/.package-lock.json")));
      assert.equal(Object.hasOwn(hidden.packages, "node_modules/smol-toml"), false);
      if (additive) assert.equal(createRequire(path.join(input.currentRoot, "package.json"))("smol-toml"), "smol-toml");
      result.assertHistoricalViewUnchanged();
      writeFileSync(path.join(input.historicalRoot, "node_modules/leaf/index.js"), "historical-only edit\n");
      result.assertUnchanged();
      assert.throws(result.assertHistoricalViewUnchanged, /historical dependency view changed/u);
      writeFileSync(path.join(input.currentRoot, "node_modules/leaf/index.js"), "unexpected current edit\n");
      assert.throws(result.assertUnchanged, /current installed dependencies changed/u);
      assert.throws(assertCurrentInputsUnchanged, /current installed inputs changed/u);
    }
    const negatives = [
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { l.packages["node_modules/unapproved"] = { version: "1" }; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { l.packages[""].dependencies.base = "2"; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { delete l.packages["node_modules/leaf"]; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { l.packages["node_modules/leaf"].integrity = "changed"; l.packages["node_modules/leaf"].resolved = "https://example.invalid/other"; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { delete l.packages["node_modules/leaf"].integrity; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { l.packages["node_modules/base"].peerDependencies = { leaf: "2" }; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "package-lock.json"), l => { l.packages["node_modules/smol-toml"].bin = { injected: "bin.js" }; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "apps/augnes_apps/package-lock.json"), addParser),
      ({ currentRoot }) => mutate(path.join(currentRoot, "apps/augnes_apps/node_modules/base/package.json"), m => { m.version = "2.0.0"; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "node_modules/.package-lock.json"), l => { l.packages["node_modules/leaf"].integrity = "wrong installed integrity"; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "node_modules/.package-lock.json"), l => { l.unapproved = "current-only metadata"; }),
      ({ currentRoot }) => mutate(path.join(currentRoot, "node_modules/base/package.json"), m => { m.version = "2.0.0"; }),
      ({ currentRoot }) => rmSync(path.join(currentRoot, "node_modules/leaf"), { recursive: true }),
      ({ currentRoot }) => rmSync(path.join(currentRoot, "node_modules/.bin/base")),
      ({ currentRoot }) => { const bin = path.join(currentRoot, "node_modules/.bin/base"); rmSync(bin); symlinkSync("../leaf/index.js", bin); },
      ({ currentRoot }) => { const p = path.join(currentRoot, "node_modules/base/node_modules/leaf"); mkdirSync(p, { recursive: true }); json(path.join(p, "package.json"), { name: "leaf", version: "1.0.0" }); },
      ({ currentRoot }) => { symlinkSync(currentRoot, path.join(currentRoot, "node_modules/foreign")); },
    ];
    for (const negative of negatives) {
      const input = fixture(); negative(input);
      assert.throws(() => materializeMergedR8ADependencies(input));
      assert.equal(existsSync(path.join(input.historicalRoot, "node_modules")), false, "refuse before materialization");
    }
    return count;
  } finally { rmSync(parent, { recursive: true, force: true }); assert.equal(existsSync(parent), false); }
}
