#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_DARWIN_REPOSITORY_ROOT,
  CANONICAL_ORIGIN_URL,
  CANONICAL_REPOSITORY_ID,
  canonicalRepositoryIdentity,
  matchCanonicalRepositoryIdentity,
} from "./canonical-repository-identity.mjs";
import { AUTHORIZED_GITHUB_REPOSITORY } from "./github-main-branch-transport.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const legacyRoot = "/Users/hynk/code/augnes-temp";
const legacyOrigin =
  "https://github.com/hynk-studio/augnes-perspective-lab.git";

assert.equal(AUTHORIZED_GITHUB_REPOSITORY, CANONICAL_REPOSITORY_ID);

const darwinIdentity = canonicalRepositoryIdentity({ platform: "darwin" });
assert.deepEqual(darwinIdentity, {
  role: "canonical",
  repository_id: CANONICAL_REPOSITORY_ID,
  origin: CANONICAL_ORIGIN_URL,
  root: CANONICAL_DARWIN_REPOSITORY_ROOT,
});
assert.deepEqual(
  matchCanonicalRepositoryIdentity({
    resolvedRoot: CANONICAL_DARWIN_REPOSITORY_ROOT,
    originUrl: CANONICAL_ORIGIN_URL,
    platform: "darwin",
  }),
  darwinIdentity,
);

for (const [resolvedRoot, originUrl, errorCode] of [
  [legacyRoot, legacyOrigin, "unauthorized_repository_root"],
  [legacyRoot, CANONICAL_ORIGIN_URL, "unauthorized_repository_root"],
  [CANONICAL_DARWIN_REPOSITORY_ROOT, legacyOrigin, "unauthorized_repository_origin"],
  ["/Users/hynk/code/another-augnes", CANONICAL_ORIGIN_URL, "unauthorized_repository_root"],
  [CANONICAL_DARWIN_REPOSITORY_ROOT, "https://github.com/hynk-studio/another-augnes.git", "unauthorized_repository_origin"],
]) {
  assert.throws(
    () => matchCanonicalRepositoryIdentity({
      resolvedRoot,
      originUrl,
      platform: "darwin",
    }),
    (error) => error?.code === errorCode,
  );
}

const windowsRoot = "C:\\Users\\operator\\src\\augnes";
assert.deepEqual(
  canonicalRepositoryIdentity({
    platform: "win32",
    windowsRepositoryRoot: windowsRoot,
  }),
  {
    role: "canonical",
    repository_id: CANONICAL_REPOSITORY_ID,
    origin: CANONICAL_ORIGIN_URL,
    root: windowsRoot,
  },
);
assert.equal(
  canonicalRepositoryIdentity({
    platform: "win32",
    windowsRepositoryRoot: "relative\\augnes",
  }),
  null,
);

assert.equal(
  existsSync(path.join(repositoryRoot, "scripts/canonical-repository-migration-bridge.mjs")),
  false,
);
for (const relativePath of [
  "scripts/governed-actor-lab-live-cohort.ts",
  "scripts/operational-reentry-matched-cohort.ts",
  "scripts/operational-reentry-matched-cohort-replacement.ts",
  "scripts/operational-reentry-provider-compatibility-probe.ts",
  "scripts/operational-reentry-clean-control-provider-compatibility-probe.ts",
  "scripts/operational-reentry-parser-closed-provider-compatibility-probe.ts",
  "scripts/operational-reentry-parser-closed-clean-control-cohort.ts",
  "scripts/operational-reentry-v0-4-provider-compatibility-probe.ts",
  "scripts/operational-reentry-v0-4-stale-reset-isolation-cohort.ts",
  "scripts/operational-reentry-stale-reset-cross-case-live-common.ts",
]) {
  const source = readFileSync(path.join(repositoryRoot, relativePath), "utf8");
  assert.match(source, /matchCanonicalRepositoryIdentity/u, relativePath);
  assert.doesNotMatch(
    source,
    /hynk-studio\/augnes-perspective-lab|\/Users\/hynk\/code\/augnes-temp/u,
    relativePath,
  );
}
for (const relativePath of [
  "lib/vnext/operational-reentry-clean-control-provider-compatibility-probe.ts",
  "lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe.ts",
  "lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts",
  "lib/vnext/operational-reentry-v0-4-provider-compatibility-probe.ts",
  "lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort.ts",
  "lib/vnext/operational-reentry-v0-4-stale-reset-isolation-artifact-store.ts",
  "lib/vnext/operational-reentry-stale-reset-cross-case-replication.ts",
]) {
  const source = readFileSync(path.join(repositoryRoot, relativePath), "utf8");
  assert.doesNotMatch(
    source,
    /hynk-studio\/augnes-perspective-lab|\/Users\/hynk\/code\/augnes-temp/u,
    relativePath,
  );
}

console.log(JSON.stringify({
  test: "canonical_repository_identity",
  result: "pass",
  admitted_darwin_identity_count: 1,
  admitted_windows_repository_count: 1,
  legacy_pair_rejected: true,
  cross_pairs_rejected: true,
  third_identities_rejected: true,
  legacy_execution_bridge_removed: true,
  governed_actor_and_research_live_runners_target_root_gated: true,
  github_transport_repository: AUTHORIZED_GITHUB_REPOSITORY,
}));
