import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { MERGED_R8A_COMMIT, MERGED_R8A_TREE } from "./merged-r8a-fixture-build-config.mjs";
import { mergedR8AInstalledIdentity } from "./merged-r8a-fixture-dependencies.mjs";

export const R8A_DEPENDENCY_DIRECTORY = ".augnes-local-verification/fixtures/merged-r8a-dependencies";
export const R8A_PROVISION_MANIFEST = `${R8A_DEPENDENCY_DIRECTORY}/provision.json`;
export const R8A_DEPENDENCY_SOURCES = Object.freeze({
  "package.json": "62b5ab60745463a559ea48c3340edd4d4c661fa981ccf6bcc1e1e885b92e3a8f",
  "package-lock.json": "2bf8b8f04e3a1904f15e2bdd5b45b7dc2905a75a811f931ea25ce5334ac7a1fa",
  "apps/augnes_apps/package.json": "caf7ce7e54d3f91524070e97b8ae488dc1681e172543968b6e871bc042039f5d",
  "apps/augnes_apps/package-lock.json": "ee320730041ff8788c2ba8ee39293eb8d2e3968fb17324e6cab8d9ce1096259c",
});
export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

export function assertR8ADependencySources(root) {
  for (const [relative, expected] of Object.entries(R8A_DEPENDENCY_SOURCES)) {
    const file = path.join(root, relative);
    const stat = lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, "historical dependency source must be private regular material");
    assert.equal(realpathSync(file), file, "historical dependency source alias refused");
    assert.equal(sha256(readFileSync(file)), expected, "historical dependency source bytes changed");
  }
}

export function assertR8AProvisionRecord(record, installed) {
  assert.deepEqual(Object.keys(record).sort(), ["schema", "commit", "tree", "platform", "arch", "node", "abi", "npm", "sources", "installed"].sort());
  assert.equal(record.schema, "augnes.merged-r8a-dependencies.v1");
  assert.equal(record.commit, MERGED_R8A_COMMIT);
  assert.equal(record.tree, MERGED_R8A_TREE);
  assert.equal(record.platform, process.platform);
  assert.equal(record.arch, process.arch);
  assert.equal(record.node, process.versions.node);
  assert.equal(record.abi, process.versions.modules);
  assert.equal(record.npm, "11.16.0");
  assert.deepEqual(record.sources, R8A_DEPENDENCY_SOURCES);
  assert.deepEqual(record.installed, installed, "historical installed material differs from preparation");
}

export function readPreparedR8ADependencies(repositoryRoot) {
  const root = path.join(realpathSync(repositoryRoot), R8A_DEPENDENCY_DIRECTORY);
  assert.equal(realpathSync(root), root, "historical dependency provision alias refused");
  assert(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink());
  assertR8ADependencySources(root);
  const file = path.join(root, "provision.json"), stat = lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size < 16_384);
  const bytes = readFileSync(file), record = JSON.parse(bytes);
  assertR8AProvisionRecord(record, mergedR8AInstalledIdentity(root));
  return { root, record, fingerprint: sha256(bytes) };
}
