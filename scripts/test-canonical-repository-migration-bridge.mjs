#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  CANONICAL_REPOSITORY_MIGRATION_BRIDGE,
  LEGACY_MIGRATION_ORIGIN_URL,
  LEGACY_MIGRATION_REPOSITORY_ID,
  LEGACY_MIGRATION_REPOSITORY_ROOT,
  TARGET_CANONICAL_ORIGIN_URL,
  TARGET_CANONICAL_REPOSITORY_ID,
  TARGET_CANONICAL_REPOSITORY_ROOT,
  canonicalMigrationBridgeIdentities,
  matchCanonicalMigrationBridgeIdentity,
} from "./canonical-repository-migration-bridge.mjs";
import { AUTHORIZED_GITHUB_REPOSITORY } from "./local-canonical-github-transport.mjs";

assert.equal(
  CANONICAL_REPOSITORY_MIGRATION_BRIDGE,
  "perspective-lab-to-augnes.v0.1",
);
assert.equal(AUTHORIZED_GITHUB_REPOSITORY, TARGET_CANONICAL_REPOSITORY_ID);

const darwinIdentities = canonicalMigrationBridgeIdentities({
  platform: "darwin",
});
assert.deepEqual(darwinIdentities, [
  {
    role: "legacy_migration_source",
    repository_id: LEGACY_MIGRATION_REPOSITORY_ID,
    origin: LEGACY_MIGRATION_ORIGIN_URL,
    root: LEGACY_MIGRATION_REPOSITORY_ROOT,
  },
  {
    role: "target_canonical",
    repository_id: TARGET_CANONICAL_REPOSITORY_ID,
    origin: TARGET_CANONICAL_ORIGIN_URL,
    root: TARGET_CANONICAL_REPOSITORY_ROOT,
  },
]);

for (const identity of darwinIdentities) {
  assert.deepEqual(
    matchCanonicalMigrationBridgeIdentity({
      resolvedRoot: identity.root,
      originUrl: identity.origin,
      platform: "darwin",
    }),
    identity,
  );
}

for (const [resolvedRoot, originUrl, errorCode] of [
  [
    LEGACY_MIGRATION_REPOSITORY_ROOT,
    TARGET_CANONICAL_ORIGIN_URL,
    "unauthorized_repository_origin",
  ],
  [
    TARGET_CANONICAL_REPOSITORY_ROOT,
    LEGACY_MIGRATION_ORIGIN_URL,
    "unauthorized_repository_origin",
  ],
  [
    "/Users/hynk/code/another-augnes",
    TARGET_CANONICAL_ORIGIN_URL,
    "unauthorized_repository_root",
  ],
  [
    TARGET_CANONICAL_REPOSITORY_ROOT,
    "https://github.com/hynk-studio/another-augnes.git",
    "unauthorized_repository_origin",
  ],
]) {
  assert.throws(
    () => matchCanonicalMigrationBridgeIdentity({
      resolvedRoot,
      originUrl,
      platform: "darwin",
    }),
    (error) => error?.code === errorCode,
  );
}

const windowsRoot = "C:\\Users\\operator\\src\\augnes";
const windowsIdentities = canonicalMigrationBridgeIdentities({
  platform: "win32",
  windowsRepositoryRoot: windowsRoot,
});
assert.equal(windowsIdentities.length, 2);
assert.ok(windowsIdentities.every((identity) => identity.root === windowsRoot));
assert.deepEqual(
  canonicalMigrationBridgeIdentities({
    platform: "win32",
    windowsRepositoryRoot: "relative\\augnes",
  }),
  [],
);

console.log(JSON.stringify({
  test: "canonical_repository_migration_bridge",
  result: "pass",
  admitted_darwin_identity_count: darwinIdentities.length,
  admitted_windows_repository_count: windowsIdentities.length,
  github_transport_repository: AUTHORIZED_GITHUB_REPOSITORY,
}));
