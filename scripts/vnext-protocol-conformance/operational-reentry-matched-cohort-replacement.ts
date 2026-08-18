import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
  ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
  ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
  ACGC_E2R1_HISTORICAL_HEAD_V01,
  ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01,
  buildOperationalReentryMatchedCohortReplacementHarnessV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-replacement";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V01,
} from "@/types/vnext/operational-reentry-matched-cohort-replacement";

export function runOperationalReentryMatchedCohortReplacementConformanceV01() {
  const harness = buildOperationalReentryMatchedCohortReplacementHarnessV01();
  assert.equal(harness.issue_number, 197);
  assert.equal(harness.zero_provider_egress, true);
  assert.equal(harness.replacement_authorizations_created, 0);
  assert.equal(harness.replacement_authorizations_consumed, 0);
  assert.equal(harness.replacement_provider_calls, 0);
  assert.equal(harness.behavioral_result_exists, false);
  assert.equal(harness.planned_calls, 16);
  assert.equal(
    harness.lineage.historical_source_head,
    ACGC_E2R1_HISTORICAL_HEAD_V01,
  );
  assert.equal(
    harness.lineage.compatibility_source_head,
    ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
  );
  assert.equal(
    harness.lineage.compatibility_report_fingerprint,
    ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
  );
  assert.equal(
    harness.lineage.compatibility_artifact_index_fingerprint,
    ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
  );
  assert.equal(harness.lineage.replacement_count, 1);
  assert.equal(harness.lineage.retry_of_historical_cohort, false);
  assert.equal(harness.lineage.historical_artifacts_rewritten, false);
  assert.equal(harness.lineage.further_cohort_authorized, false);
  assert.equal(harness.lineage.second_replacement_authorized, false);
  assert.equal(harness.lineage.stage_7_authorized, false);
  assert.equal(
    OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01,
    "operational_reentry_matched_cohort_replacement_authorization.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V01,
    "operational_reentry_matched_cohort_replacement_lineage.v0.1",
  );
  assert.equal(
    ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
    250_000_000,
  );
  assert.equal(
    ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01,
    ".augnes-lab/operational-reentry-matched-cohort-replacements/",
  );

  const core = sourceV01(
    "lib/vnext/operational-reentry-matched-cohort-replacement.ts",
  );
  const artifacts = sourceV01(
    "lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store.ts",
  );
  const runner = sourceV01(
    "scripts/operational-reentry-matched-cohort-replacement.ts",
  );
  const historicalRunner = sourceV01(
    "scripts/operational-reentry-matched-cohort.ts",
  );
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("OPENAI_API_KEY"), false);
  assert.ok(core.includes('request_family_kind: "replacement_cohort"'));
  assert.ok(
    core.includes(
      ".augnes-lab/operational-reentry-matched-cohort-replacements/",
    ),
  );
  assert.ok(artifacts.includes('openSync(target, "wx"'));
  assert.ok(runner.includes("--confirm-future-live-replacement-cohort"));
  assert.ok(runner.includes("--authorization-file"));
  assert.ok(runner.includes("--compatibility-probe-root"));
  assert.ok(runner.includes("refs/remotes/origin/main"));
  assert.equal(runner.includes("previous_response_id"), false);
  assert.ok(historicalRunner.includes('authorizationIssue !== "185"'));
  assert.ok(
    historicalRunner.includes("codex/acgc-e2-live-matched-reentry-cohort"),
  );

  return {
    status:
      "operational_reentry_matched_cohort_replacement_conformance_passed" as const,
    issue_number: 197,
    planned_calls: 16,
    replacement_authorizations_created: 0,
    replacement_authorizations_consumed: 0,
    provider_calls: 0,
    retry_of_historical_cohort: false,
    stage_7_started: false,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
