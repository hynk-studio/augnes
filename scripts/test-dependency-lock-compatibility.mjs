#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  ROOT_DEPENDENCY_BEARING_FIELDS,
  normalizedDependencyLock,
} from "./dependency-lock-compatibility.mjs";

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
      deleted_package_entries_refused: true,
      nested_lock_compatibility_protected: true,
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
