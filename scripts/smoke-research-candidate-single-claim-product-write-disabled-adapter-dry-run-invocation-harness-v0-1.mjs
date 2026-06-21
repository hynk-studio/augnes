import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-dry-run-invocation-harness.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-dry-run-invocation-harness.sample.v0.1.json";
const contractTestsFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-tests.sample.v0.1.json";
const skeletonFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-skeleton.sample.v0.1.json";
const packagePath = "package.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1";
const optionalBackupDir =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-smoke-backups-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const harnessPath = path.join(artifactDir, "dry-run-invocation-harness.json");

const optionalReportPaths = {
  disabled_adapter_contract_tests:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
  disabled_adapter_skeleton:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json",
  authority_contract_bundle:
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
  dry_run_transaction_harness:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json",
  dry_run_transaction_plan:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json",
  disabled_bridge_skeleton_contract_tests:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json",
  disabled_bridge_skeleton:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json",
  temp_to_product_bridge_design:
    "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json",
  product_write_gate_design:
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
};

const expectedReportKind =
  "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_harness_report";
const expectedHarnessKind =
  "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const expectedVersion =
  "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_harness.v0.1";
const expectedHarnessStatus =
  "product_write_disabled_adapter_dry_run_invocation_harness_only";
const blockedHarnessStatus =
  "blocked_before_product_write_disabled_adapter_dry_run_invocation_harness";
const expectedRecommendation =
  "ready_for_single_claim_product_write_disabled_adapter_noop_invocation_report";
const blockedRecommendation =
  "blocked_before_product_write_disabled_adapter_noop_invocation_report";
const expectedNextSlice =
  "single_claim_product_write_disabled_adapter_noop_invocation_report";
const recheckSlice =
  "single_claim_product_write_disabled_adapter_dry_run_invocation_harness_recheck";

const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1",
  "harness:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1",
];
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  sampleFixturePath,
  helperPath,
  packagePath,
  browserValidatorPath,
  runnerPath,
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
];
const requiredTraceGroups = [
  "source_evidence_preflight",
  "contract_suite_preflight",
  "disabled_adapter_preflight",
  "invocation_input_normalization",
  "forbidden_input_scan",
  "authority_denial_check",
  "adapter_disabled_check",
  "future_command_preview_check",
  "refusal_resolution",
  "no_write_postconditions",
  "static_boundary_preflight",
];
const requiredProbeGroups = [
  "positive",
  "source_preflight",
  "adapter_boundary",
  "no_write_boundary",
  "route_ui_boundary",
  "invocation_input",
  "forbidden_input",
  "dry_noop_preview",
  "disabled_result",
  "trace_boundary",
  "forbidden_surface",
  "product_id_contamination",
  "static_boundary",
];
const productIdKeys = new Set([
  "product_record_id",
  "product_claim_id",
  "canonical_claim_id",
  "canonical_id",
  "proof_id",
  "evidence_id",
  "perspective_id",
  "work_item_id",
  "product_idempotency_record_id",
  "product_rollback_record_id",
  "product_audit_record_id",
  "product_observability_record_id",
  "audit_record_product_id",
  "output_product_claim_id",
  "output_proof_id",
  "output_evidence_id",
  "output_perspective_id",
  "output_work_item_id",
]);

for (const filePath of [
  helperPath,
  runnerPath,
  smokePath,
  sampleFixturePath,
  contractTestsFixturePath,
  skeletonFixturePath,
  packagePath,
  docsIndexPath,
  browserValidatorPath,
  tsxPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const committedSample = readJson(sampleFixturePath);
const packageJson = readJson(packagePath);
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
assert.equal(
  packageJson.scripts[
    "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1"
  ],
  "node scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
);
assert.equal(
  packageJson.scripts[
    "envelope:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1"
  ],
  "node scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_preflight_command_envelope_artifact_note",
  ),
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_preflight_command_envelope_no_browser_route",
  ),
);
const noopReportSmokeScript =
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1";
const noopReportRunnerScript =
  "report:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1";
assert.equal(
  packageJson.scripts[noopReportSmokeScript],
  "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
);
assert.equal(
  packageJson.scripts[noopReportRunnerScript],
  "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_disabled_adapter_noop_invocation_report_artifact_note",
  ),
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_disabled_adapter_noop_invocation_report_no_browser_route",
  ),
);

assertHarness(committedSample, "committed sample harness");
assertNoProductBoundary(committedSample);
assertTraceAndProbes(committedSample);
assertStaticEvidence(committedSample.static_boundary_evidence, "committed sample");
assertNoProductIds(committedSample);
assertSourceEvidence(committedSample);
assertHelperSource();
assertRunnerSource();
assertPackageScripts();
assertDocsAndBrowserValidator();
assertUiPathDetector();
assertExportedHelperMutation();

const backups = backupOptionalReports(Object.values(optionalReportPaths));
try {
  removeOptionalReports(Object.values(optionalReportPaths));
  const absent = runFixtureMode("optional reports absent");
  writeHarmlessStaleOptionalReports();
  const stale = runFixtureMode("stale optional reports present");
  assert.equal(absent.report.final_status, "pass");
  assert.equal(stale.report.final_status, "pass");
  assert.equal(
    absent.harness.dry_run_invocation_harness_fingerprint,
    stale.harness.dry_run_invocation_harness_fingerprint,
    "fixture-mode harness fingerprint must ignore stale optional /tmp reports",
  );
  assert.deepEqual(
    absent.harness.source_evidence,
    stale.harness.source_evidence,
    "fixture-mode source evidence must ignore stale optional /tmp reports",
  );
  assert.ok(
    Object.values(stale.report.non_fingerprinted_runtime_notes.optional_reports_present_on_disk).every(
      Boolean,
    ),
    "runtime temp-presence notes may be recorded outside the harness artifact",
  );
  assertFixtureModeIgnoredOptionalInputs(stale.report);

  assertFailedOptionalReportBlocks({
    label: "disabled_adapter_contract_tests",
    report: {
      ...readJson(contractTestsFixturePath),
      final_status: "fail",
      case_results: [{ stale: true }],
    },
    expectedFailureCode: "optional_disabled_adapter_contract_tests_report_not_passed",
  });
  assertFailedOptionalReportBlocks({
    label: "disabled_adapter_skeleton",
    report: {
      final_status: "fail",
      disabled_adapter_skeleton: readJson(skeletonFixturePath),
    },
    expectedFailureCode: "optional_disabled_adapter_skeleton_report_not_passed",
  });
  assertFailedOptionalReportBlocks({
    label: "authority_contract_bundle",
    report: {
      final_status: "fail",
      authority_contract_bundle: { stale: true },
    },
    expectedFailureCode: "optional_authority_contract_bundle_report_not_passed",
  });
  assertMissingOptionalPayloadBlocks({
    label: "disabled_adapter_skeleton",
    report: {
      final_status: "pass",
      wrong_payload: { stale: true },
    },
    expectedFailureCode: "optional_disabled_adapter_skeleton_report_missing_payload",
  });
  assertMalformedOptionalReportBlocks({
    label: "dry_run_transaction_plan",
    expectedFailureCode: "optional_dry_run_transaction_plan_report_malformed",
  });
} finally {
  restoreOptionalReports(backups);
  runFixtureMode("final passing fixture reset");
}

const runtimeReport = readJson(reportPath);
const runtimeHarness = readJson(harnessPath);
assertReport(runtimeReport, "runtime fixture-mode report");
assertHarness(runtimeHarness, "runtime fixture-mode harness");
assert.deepEqual(runtimeReport.dry_run_invocation_harness, runtimeHarness);
assertStaticEvidence(
  {
    ...runtimeHarness.static_boundary_evidence,
    static_boundary_base_ref: runtimeReport.static_boundary_base_ref,
    static_boundary_base_mode: runtimeReport.static_boundary_base_mode,
    static_boundary_changed_files_inspected:
      runtimeReport.static_boundary_changed_files_inspected,
    static_boundary_package_added_lines_inspected:
      runtimeReport.static_boundary_package_added_lines_inspected,
    static_boundary_used_fallback_allowlist:
      runtimeReport.static_boundary_used_fallback_allowlist,
  },
  "runtime report",
);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1",
      final_status: "pass",
      dry_run_invocation_harness_fingerprint:
        runtimeHarness.dry_run_invocation_harness_fingerprint,
      invocation_probe_count: runtimeHarness.invocation_probes.length,
      next_recommended_slice: runtimeHarness.next_recommended_slice,
      static_boundary_base_mode: runtimeReport.static_boundary_base_mode,
      checked_fixture_mode_determinism: true,
      checked_failed_optional_reports: true,
      checked_generated_source_evidence_readiness: true,
      checked_source_derived_invocation_reference_mismatches: true,
      checked_no_product_write_boundary: true,
    },
    null,
    2,
  ),
);

function assertReport(report, label) {
  assert.equal(report.report_kind, expectedReportKind, `${label} kind`);
  assert.equal(report.report_version, expectedVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final_status`);
  assert.equal(
    report.dry_run_invocation_harness_status,
    expectedHarnessStatus,
    `${label} status`,
  );
  assert.equal(report.recommendation_status, expectedRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assert.ok(
    !String(report.next_recommended_slice).includes("product_write_implementation"),
    `${label} must not recommend product write implementation`,
  );
  assert.ok(
    Array.isArray(report.static_boundary_changed_files_inspected),
    `${label} static changed files recorded`,
  );
}

function assertHarness(harness, label) {
  assert.equal(harness.dry_run_invocation_harness_kind, expectedHarnessKind);
  assert.equal(harness.dry_run_invocation_harness_version, expectedVersion);
  assert.equal(
    harness.dry_run_invocation_harness_status,
    expectedHarnessStatus,
    `${label} status`,
  );
  assert.match(
    harness.dry_run_invocation_harness_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
  assert.equal(harness.recommendation_status, expectedRecommendation);
  assert.equal(harness.next_recommended_slice, expectedNextSlice);
  assert.equal(harness.validation.passed, true);
  assert.deepEqual(harness.validation.failure_codes, []);
  assert.equal(harness.adapter_kind, "manual_note_single_claim_product_write_disabled_adapter");
  assert.equal(
    harness.disabled_invocation_result.result_status,
    "rejected_disabled_adapter",
  );
  assert.equal(harness.disabled_invocation_result.dry_noop_preview_produced, true);
  assert.equal(harness.dry_noop_preview.preview_storage_target, "local_artifact_only");
  assert.equal(harness.dry_noop_preview.preview_persisted_now, false);
}

function assertNoProductBoundary(harness) {
  for (const [key, expected] of [
    ["adapter_enabled", false],
    ["adapter_invocation_allowed_now", false],
    ["adapter_invocation_attempted_now", true],
    ["adapter_invocation_executed_against_runtime", false],
    ["product_write_attempted_now", false],
    ["product_write_allowed_now", false],
    ["product_write_authority_granted_now", false],
    ["product_write_implementation_allowed_now", false],
    ["transaction_execution_allowed_now", false],
    ["product_db_write", false],
    ["product_id_allocation", false],
    ["db_open", false],
    ["sql_execution", false],
    ["route_added", false],
    ["ui_write_action_added", false],
  ]) {
    assert.equal(harness[key], expected, `${key} must be ${expected}`);
  }
  for (const [key, value] of Object.entries(harness.explicit_forbidden_surfaces)) {
    assert.equal(value, false, `${key} forbidden surface must remain false`);
  }
  for (const key of [
    "adapter_runtime_invocation_now",
    "product_write_attempted_now",
    "product_write_executed_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "durable_records_created_now",
  ]) {
    assert.equal(
      harness.disabled_invocation_result[key],
      false,
      `disabled result ${key} must remain false`,
    );
  }
  assert.deepEqual(
    harness.disabled_invocation_result.refusal_reasons,
    [
      "adapter_disabled",
      "product_write_authority_not_granted",
      "authority_contracts_defined_but_not_satisfied",
      "product_write_implementation_not_allowed",
      "runtime_invocation_not_allowed",
    ],
  );
}

function assertTraceAndProbes(harness) {
  const traceGroups = new Set(harness.invocation_trace.map((row) => row.trace_group));
  for (const group of requiredTraceGroups) {
    assert.ok(traceGroups.has(group), `missing trace group ${group}`);
  }
  for (const row of harness.invocation_trace) {
    for (const key of [
      "product_write_attempted_now",
      "product_db_write_now",
      "product_id_allocation_now",
      "db_open_now",
      "sql_execution_now",
      "transaction_execution_now",
      "adapter_runtime_invocation_now",
      "durable_write_now",
    ]) {
      assert.equal(row[key], false, `trace ${row.trace_id} ${key}`);
    }
  }
  assert.ok(harness.invocation_probes.length >= 40, "probe matrix breadth");
  const probeGroups = new Set(
    harness.invocation_probes.map((probe) => probe.probe_group),
  );
  for (const group of requiredProbeGroups) {
    assert.ok(probeGroups.has(group), `missing probe group ${group}`);
  }
  for (const probe of harness.invocation_probes) {
    assert.equal(probe.probe_status, "pass", `probe ${probe.probe_id}`);
  }
  for (const probeId of [
    "source_contract_tests_failed_blocks",
    "skeleton_blocked_blocks",
    "authority_bundle_blocked_blocks",
    "dry_run_transaction_plan_blocked_blocks",
    "authority_contract_bundle_fingerprint_mismatch_blocks",
    "disabled_adapter_skeleton_fingerprint_mismatch_blocks",
    "contract_suite_fingerprint_mismatch_blocks",
    "adapter_enabled_true_blocks",
    "product_db_write_true_blocks",
    "product_claim_id_provided_blocks",
    "static_empty_delta_blocks",
    "static_package_addition_outside_allowlist_blocks",
    "static_schema_db_sql_changed_file_blocks",
    "static_app_router_ui_file_blocks",
    "static_external_call_pattern_blocks",
  ]) {
    assert.ok(
      harness.invocation_probes.some((probe) => probe.probe_id === probeId),
      `probe ${probeId} must be covered`,
    );
  }
}

function assertStaticEvidence(evidence, label) {
  assert.ok(evidence.static_boundary_base_ref, `${label} base ref recorded`);
  assert.ok(evidence.static_boundary_base_mode, `${label} base mode recorded`);
  assert.ok(
    Array.isArray(evidence.static_boundary_changed_files_inspected),
    `${label} changed files recorded`,
  );
  assert.ok(
    evidence.static_boundary_changed_files_inspected.length > 0,
    `${label} changed-file delta must be non-empty`,
  );
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      evidence.static_boundary_changed_files_inspected.includes(expectedFile),
      `${label} expected file missing: ${expectedFile}`,
    );
  }
  assert.ok(
    evidence.static_boundary_changed_files_inspected.includes(helperPath),
    `${label} helper file inspected`,
  );
  assert.ok(
    evidence.static_boundary_changed_files_inspected.includes(runnerPath),
    `${label} runner file inspected`,
  );
  assert.ok(
    evidence.static_boundary_changed_files_inspected.includes(smokePath),
    `${label} smoke file inspected`,
  );
  assert.ok(
    !evidence.static_boundary_changed_files_inspected.some(isSchemaDbSqlPath),
    `${label} must not include schema/migration/db/sql files`,
  );
  assert.ok(
    !evidence.static_boundary_changed_files_inspected.some((filePath) =>
      /^app\/api\//.test(filePath),
    ),
    `${label} must not include app/api route files`,
  );
  assert.ok(
    !evidence.static_boundary_changed_files_inspected.some(isUiFilePath),
    `${label} must not include UI files`,
  );
  assert.deepEqual(
    evidence.static_boundary_package_added_lines_inspected.map(extractScriptName),
    allowedPackageScriptNames,
    `${label} package additions must stay limited to two harness scripts`,
  );
  assert.equal(
    evidence.static_boundary_used_fallback_allowlist,
    true,
    `${label} sample/fixture mode should use committed allowlist mode`,
  );
}

function assertSourceEvidence(harness) {
  assert.equal(
    harness.source_evidence.disabled_adapter_contract_tests.contract_suite_status,
    "product_write_disabled_adapter_contract_tests_passed",
  );
  assert.equal(
    harness.source_evidence.disabled_adapter_contract_tests.final_status,
    "pass",
  );
  assert.equal(
    harness.source_evidence.disabled_adapter_skeleton.disabled_adapter_skeleton_status,
    "product_write_disabled_adapter_skeleton_only",
  );
  assert.equal(
    harness.source_evidence.authority_contract_bundle.authority_contract_bundle_status,
    "product_write_authority_contracts_defined_only",
  );
  assert.equal(
    harness.source_evidence.dry_run_transaction_harness
      .dry_run_transaction_harness_status,
    "disabled_dry_run_transaction_harness_only",
  );
  assert.equal(
    harness.source_evidence.dry_run_transaction_plan.dry_run_transaction_plan_status,
    "disabled_dry_run_transaction_plan_only",
  );
  assert.equal(
    harness.source_evidence.product_write_gate_design.gate_design_status,
    "product_write_gate_design_only",
  );
}

function assertHelperSource() {
  assert.match(helper, /invokeManualNoteSingleClaimProductWriteDisabledAdapterDryRun/);
  assert.match(helper, /adapter_invocation_attempted_now:\s*true/);
  assert.match(helper, /adapter_invocation_executed_against_runtime:\s*false/);
  assert.match(helper, /result_status:\s*"rejected_disabled_adapter"/);
  assertNoForbiddenStaticSource(helper, "helper");
}

function assertRunnerSource() {
  assert.match(
    runner,
    /AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_DRY_RUN_INVOCATION_HARNESS_BASE_REF/,
  );
  assert.match(runner, /optional_report_ignored_for_fixture_mode/);
  assert.match(runner, /optional_reports_present_on_disk/);
  assert.match(runner, /static_boundary_changed_files_inspected/);
  assert.match(runner, /static_boundary_package_added_lines_inspected/);
  assertNoForbiddenStaticSource(runner, "runner");
  assertNoForbiddenStaticSource(smoke, "smoke");
}

function assertPackageScripts() {
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(packageJson.scripts[scriptName], `missing ${scriptName}`);
  }
  assert.equal(
    packageJson.scripts[allowedPackageScriptNames[0]],
    `node ${smokePath}`,
  );
  assert.equal(
    packageJson.scripts[allowedPackageScriptNames[1]],
    `node ${runnerPath}`,
  );
}

function assertDocsAndBrowserValidator() {
  assert.match(
    docsIndex,
    /manual-note-single-claim-product-write-disabled-adapter-dry-run-invocation-harness/,
  );
  assert.match(
    docsIndex,
    /single_claim_product_write_disabled_adapter_noop_invocation_report/,
  );
  assert.match(docsIndex, /not product write/i);
  assert.match(
    browserValidator,
    /single_claim_product_write_disabled_adapter_dry_run_invocation_harness_artifact_note/,
  );
  assert.match(
    browserValidator,
    /single_claim_product_write_disabled_adapter_dry_run_invocation_harness_no_browser_route/,
  );
}

function assertUiPathDetector() {
  assert.equal(isUiFilePath("app/foo/page.tsx"), true);
  assert.equal(isUiFilePath("app/layout.jsx"), true);
  assert.equal(isUiFilePath("components/Foo.tsx"), true);
  assert.equal(isUiFilePath("lib/research-candidate-review/file.ts"), false);
}

function assertExportedHelperMutation() {
  const script = `
    import { readFileSync } from "node:fs";
    import { invokeManualNoteSingleClaimProductWriteDisabledAdapterDryRun } from "./${helperPath}";
    const skeleton = JSON.parse(readFileSync("${skeletonFixturePath}", "utf8"));
    const contractTests = JSON.parse(readFileSync("${contractTestsFixturePath}", "utf8"));
    const staticBoundaryEvidence = ${JSON.stringify(committedSample.static_boundary_evidence)};
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const runCase = (label, { mutateSkeleton, adapterInvocationInput }) => {
      const mutatedSkeleton = clone(skeleton);
      if (mutateSkeleton) mutateSkeleton(mutatedSkeleton);
      const result = invokeManualNoteSingleClaimProductWriteDisabledAdapterDryRun({
        disabledAdapterSkeleton: mutatedSkeleton,
        disabledAdapterContractTestsReport: contractTests,
        adapterInvocationInput,
        staticBoundaryEvidence
      });
      return {
        label,
        status: result.dry_run_invocation_harness_status,
        recommendation: result.recommendation_status,
        next: result.next_recommended_slice,
        failures: result.validation.failure_codes
      };
    };
    const cases = [
      runCase("adapter_enabled", {
        mutateSkeleton: (draft) => {
          draft.adapter_enabled = true;
        }
      }),
      runCase("nested_authority_bundle_blocked", {
        mutateSkeleton: (draft) => {
          draft.source_evidence.authority_contract_bundle.authority_contract_bundle_status = "blocked";
        }
      }),
      runCase("nested_dry_run_transaction_plan_blocked", {
        mutateSkeleton: (draft) => {
          draft.source_evidence.dry_run_transaction_plan.dry_run_transaction_plan_status = "blocked";
        }
      }),
      runCase("authority_fingerprint_mismatch", {
        adapterInvocationInput: {
          authority_contract_bundle_fingerprint: "fnv1a32:00000000"
        }
      }),
      runCase("disabled_adapter_skeleton_fingerprint_mismatch", {
        adapterInvocationInput: {
          disabled_adapter_skeleton_fingerprint: "fnv1a32:00000000"
        }
      }),
      runCase("contract_suite_fingerprint_mismatch", {
        adapterInvocationInput: {
          contract_suite_fingerprint: "fnv1a32:00000000"
        }
      })
    ];
    console.log(JSON.stringify(cases));
  `;
  const output = execFileSync(tsxPath, ["--eval", script], { encoding: "utf8" });
  const results = JSON.parse(output);
  assertDirectHelperBlocked(
    results,
    "adapter_enabled",
    "skeleton_adapter_enabled_not_false",
  );
  assertDirectHelperBlocked(
    results,
    "nested_authority_bundle_blocked",
    "source_authority_bundle_not_ready",
  );
  assertDirectHelperBlocked(
    results,
    "nested_dry_run_transaction_plan_blocked",
    "source_dry_run_transaction_plan_not_ready",
  );
  assertDirectHelperBlocked(
    results,
    "authority_fingerprint_mismatch",
    "invocation_input_authority_contract_bundle_fingerprint_mismatch",
  );
  assertDirectHelperBlocked(
    results,
    "disabled_adapter_skeleton_fingerprint_mismatch",
    "invocation_input_disabled_adapter_skeleton_fingerprint_mismatch",
  );
  assertDirectHelperBlocked(
    results,
    "contract_suite_fingerprint_mismatch",
    "invocation_input_contract_suite_fingerprint_mismatch",
  );
}

function assertDirectHelperBlocked(results, label, expectedFailureCode) {
  const result = results.find((entry) => entry.label === label);
  assert.ok(result, `${label} direct helper mutation result missing`);
  assert.equal(result.status, blockedHarnessStatus, `${label} blocked status`);
  assert.equal(
    result.recommendation,
    blockedRecommendation,
    `${label} blocked recommendation`,
  );
  assert.equal(result.next, recheckSlice, `${label} recheck next slice`);
  assert.ok(
    result.failures.includes(expectedFailureCode),
    `${label} must include ${expectedFailureCode}`,
  );
}

function runFixtureMode(label) {
  const result = spawnSync("node", [runnerPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_DRY_RUN_INVOCATION_HARNESS_FIXTURE_MODE:
        "1",
    },
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `${label} fixture runner failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return {
    report: readJson(reportPath),
    harness: readJson(harnessPath),
  };
}

function assertFailedOptionalReportBlocks({ label, report, expectedFailureCode }) {
  removeOptionalReports(Object.values(optionalReportPaths));
  writeJson(optionalReportPaths[label], report);
  const blocked = runRunnerExpectFail(`failed optional ${label}`);
  assert.equal(blocked.final_status, "fail");
  assert.equal(blocked.dry_run_invocation_harness_status, blockedHarnessStatus);
  assert.equal(blocked.recommendation_status, blockedRecommendation);
  assert.equal(blocked.next_recommended_slice, recheckSlice);
  assert.ok(
    blocked.validation.failure_codes.includes(expectedFailureCode),
    `${label} must block with ${expectedFailureCode}`,
  );
  assert.ok(
    !blocked.optional_inputs.find((input) => input.source_label === label)
      ?.fallback_to_committed_fixture,
    `${label} failed optional report must not fall back to committed fixture`,
  );
}

function assertMissingOptionalPayloadBlocks({
  label,
  report,
  expectedFailureCode,
}) {
  removeOptionalReports(Object.values(optionalReportPaths));
  writeJson(optionalReportPaths[label], report);
  const blocked = runRunnerExpectFail(`missing payload optional ${label}`);
  assert.equal(blocked.final_status, "fail");
  assert.ok(
    blocked.validation.failure_codes.includes(expectedFailureCode),
    `${label} must block with ${expectedFailureCode}`,
  );
  const selection = blocked.optional_inputs.find((input) => input.source_label === label);
  assert.equal(selection.fallback_to_committed_fixture, false);
  assert.equal(selection.source_used, "optional_report_missing_payload");
}

function assertMalformedOptionalReportBlocks({ label, expectedFailureCode }) {
  removeOptionalReports(Object.values(optionalReportPaths));
  mkdirSync(path.dirname(optionalReportPaths[label]), { recursive: true });
  writeFileSync(optionalReportPaths[label], "{\n", "utf8");
  const blocked = runRunnerExpectFail(`malformed optional ${label}`);
  assert.equal(blocked.final_status, "fail");
  assert.ok(
    blocked.validation.failure_codes.includes(expectedFailureCode),
    `${label} must block with ${expectedFailureCode}`,
  );
  const selection = blocked.optional_inputs.find((input) => input.source_label === label);
  assert.equal(selection.fallback_to_committed_fixture, false);
  assert.equal(selection.source_used, "optional_report_malformed");
}

function runRunnerExpectFail(label) {
  const result = spawnSync("node", [runnerPath], {
    cwd: process.cwd(),
    env: { ...process.env },
    encoding: "utf8",
  });
  assert.notEqual(
    result.status,
    0,
    `${label} should fail\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.ok(existsSync(reportPath), `${label} should still write report`);
  return readJson(reportPath);
}

function assertFixtureModeIgnoredOptionalInputs(report) {
  assert.equal(report.final_status, "pass");
  for (const selection of report.optional_inputs) {
    assert.equal(selection.source_used, "committed_fixture");
    assert.equal(selection.optional_report_present, false);
    assert.equal(selection.optional_report_ignored_for_fixture_mode, true);
    assert.equal(selection.fallback_to_committed_fixture, true);
  }
}

function writeHarmlessStaleOptionalReports() {
  for (const [label, filePath] of Object.entries(optionalReportPaths)) {
    const payloadKey =
      label === "disabled_adapter_contract_tests" ||
      label === "disabled_bridge_skeleton_contract_tests"
        ? "case_results"
        : label;
    writeJson(filePath, {
      final_status: "pass",
      [payloadKey]: { stale_optional_report: true, label },
    });
  }
}

function backupOptionalReports(filePaths) {
  rmSync(optionalBackupDir, { recursive: true, force: true });
  mkdirSync(optionalBackupDir, { recursive: true });
  return filePaths.map((filePath) => {
    if (!existsSync(filePath)) return { filePath, backupPath: null };
    const backupPath = path.join(
      optionalBackupDir,
      Buffer.from(filePath).toString("base64url"),
    );
    renameSync(filePath, backupPath);
    return { filePath, backupPath };
  });
}

function restoreOptionalReports(backups) {
  removeOptionalReports(backups.map((backup) => backup.filePath));
  for (const { filePath, backupPath } of backups) {
    if (!backupPath || !existsSync(backupPath)) continue;
    mkdirSync(path.dirname(filePath), { recursive: true });
    renameSync(backupPath, filePath);
  }
}

function removeOptionalReports(filePaths) {
  for (const filePath of filePaths) {
    rmSync(path.dirname(filePath), { recursive: true, force: true });
  }
}

function assertNoForbiddenStaticSource(text, label) {
  assert.equal(executableSqlPattern().test(text), false, `${label} SQL literal`);
  assert.equal(forbiddenImportPattern().test(text), false, `${label} forbidden import`);
  assert.equal(networkOrExternalCallPattern().test(text), false, `${label} external call`);
  assert.equal(browserPersistencePattern().test(text), false, `${label} browser persistence`);
  assert.equal(appServerStartupPattern().test(text), false, `${label} server startup`);
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => {
    if (productIdKeys.has(key)) return nested !== null && nested !== undefined;
    return hasNonNullProductIds(nested);
  });
}

function assertNoProductIds(value) {
  assert.equal(hasNonNullProductIds(value), false, "product ID contamination");
}

function isUiFilePath(filePath) {
  return /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
}

function isSchemaDbSqlPath(filePath) {
  return (
    /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
      filePath,
    ) || /^lib\/db(\.ts|\/)/.test(filePath)
  );
}

function executableSqlPattern() {
  return new RegExp(
    `\\b(${[
      ["CREATE", "TABLE"].join("\\s+"),
      ["INSERT", "INTO"].join("\\s+"),
      ["ALTER", "TABLE"].join("\\s+"),
      ["DROP", "TABLE"].join("\\s+"),
      "UPDATE\\s+\\w+",
      "DELETE\\s+FROM",
    ].join("|")})\\b`,
    "i",
  );
}

function forbiddenImportPattern() {
  const forbidden = [
    ["lib", "db"].join("\\/"),
    "better-sqlite3",
    "sqlite3",
    ["app", ""].join("\\/"),
    "openai",
    "provider",
    "retrieval",
    "rag",
    "source-fetch",
    "proof",
    "evidence",
    "work-item",
    "perspective-write",
    "canonical-write",
  ].join("|");
  return new RegExp(`from\\s+["'][^"']*(${forbidden})[^"']*["']`, "i");
}

function networkOrExternalCallPattern() {
  const probes = [
    ["fet", "ch"].join(""),
    ["new", "OpenAI"].join("\\s+"),
    "webhook",
    "sendEmail",
    "slack",
    "providerClient",
    "retrievalClient",
    "ragClient",
  ];
  const callProbes = probes.map((probe) =>
    probe.includes("\\s+") ? probe : `${probe}\\s*\\(`,
  );
  return new RegExp(`(?:\\b${callProbes.join("|\\b")})`, "i");
}

function browserPersistencePattern() {
  return new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("\\."),
    ].join("|")})\\b`,
  );
}

function appServerStartupPattern() {
  return new RegExp(
    `\\b(${[
      ["next", "dev"].join("\\s+"),
      ["npm", "run", "dev"].join("\\s+"),
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
    "i",
  );
}

function extractScriptName(line) {
  return line.match(/"([^"]+)":/)?.[1] ?? "";
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}
