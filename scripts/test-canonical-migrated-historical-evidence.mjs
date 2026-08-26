#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MIGRATED_HISTORICAL_EVIDENCE_ROOT,
  resolveMigratedHistoricalEvidencePath,
} from "./canonical-historical-evidence.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const historicalIssue185 =
  ".augnes-lab/operational-reentry-matched-cohorts/operational-reentry-cohort_48331280ed7ead6dbad2d12105208dfb/issue-185";

assert.equal(existsSync(path.join(repositoryRoot, historicalIssue185)), false);
const resolved = resolveMigratedHistoricalEvidencePath({
  repositoryRoot,
  legacyRelativePath: historicalIssue185,
});
assert.ok(
  resolved.startsWith(
    path.join(repositoryRoot, MIGRATED_HISTORICAL_EVIDENCE_ROOT, ".augnes-lab") + path.sep,
  ),
);
assert.throws(
  () => resolveMigratedHistoricalEvidencePath({
    repositoryRoot,
    legacyRelativePath: "../.augnes-lab/operational-reentry-matched-cohorts",
  }),
  (error) => error?.code === "historical_evidence_path_invalid",
);

console.log(JSON.stringify({
  test: "canonical_migrated_historical_evidence",
  result: "pass",
  active_discovery_absent: true,
  explicit_historical_read_available: true,
  historical_read_grants_execution_authority: false,
}));
