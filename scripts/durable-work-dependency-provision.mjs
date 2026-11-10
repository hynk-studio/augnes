import assert from "node:assert/strict";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { historicalRootInstalledIdentity } from "./merged-r8a-fixture-dependencies.mjs";
import { sha256 } from "./merged-r8a-dependency-provision.mjs";

export const DURABLE_WORK_PREDECESSOR = "d9b6b56f0de6dcb0a36ac591b13a3672f99fa71a";
export const DURABLE_WORK_TREE = "cfb22f25ecc0a53b7eb53916aeecea20632fabcb";
export const DURABLE_DEPENDENCY_DIRECTORY = ".augnes-local-verification/fixtures/durable-work-dependencies";
export const DURABLE_PROVISION_MANIFEST = `${DURABLE_DEPENDENCY_DIRECTORY}/provision.json`;
export const DURABLE_DEPENDENCY_SOURCES = Object.freeze({
  "package.json": "c286b448976aa0db2de2f82d4d3d84f8ee6668312794296a42e8fdbaf5f0c73d",
  "package-lock.json": "7d5e41d870364e40acdcc64b0ef1bacdbde574f68622b9bad6cbe0f5700979e3",
});

export function assertDurableDependencySources(root) {
  for (const [relative, expected] of Object.entries(DURABLE_DEPENDENCY_SOURCES)) {
    const file = path.join(root, relative), stat = lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1);
    assert.equal(realpathSync(file), file, "historical dependency source alias refused");
    assert.equal(sha256(readFileSync(file)), expected, "historical dependency source bytes changed");
  }
}

export function assertDurableProvisionRecord(record, installed) {
  assert.deepEqual(Object.keys(record).sort(), ["schema", "commit", "tree", "platform", "arch", "node", "abi", "npm", "sources", "installed"].sort());
  assert.equal(record.schema, "augnes.durable-work-dependencies.v1");
  assert.equal(record.commit, DURABLE_WORK_PREDECESSOR);
  assert.equal(record.tree, DURABLE_WORK_TREE);
  assert.equal(record.platform, process.platform); assert.equal(record.arch, process.arch);
  assert.equal(record.node, process.versions.node); assert.equal(record.abi, process.versions.modules);
  assert.equal(record.npm, "11.16.0");
  assert.deepEqual(record.sources, DURABLE_DEPENDENCY_SOURCES);
  assert.deepEqual(record.installed, installed, "historical installed material differs from preparation");
}

export function readPreparedDurableDependencies(repositoryRoot) {
  const root = path.join(realpathSync(repositoryRoot), DURABLE_DEPENDENCY_DIRECTORY);
  assert.equal(realpathSync(root), root, "historical dependency provision alias refused");
  assert(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink());
  assertDurableDependencySources(root);
  const file = path.join(root, "provision.json"), stat = lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size < 16_384);
  const bytes = readFileSync(file), record = JSON.parse(bytes);
  assertDurableProvisionRecord(record, historicalRootInstalledIdentity(root));
  return { root, record, fingerprint: sha256(bytes) };
}
