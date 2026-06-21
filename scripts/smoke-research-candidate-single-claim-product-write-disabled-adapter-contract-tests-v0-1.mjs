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
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-contract-tests.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs";
const casesFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-test-cases.v0.1.json";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-tests.sample.v0.1.json";
const skeletonFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-skeleton.sample.v0.1.json";
const packagePath = "package.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const contractTestsPath = path.join(artifactDir, "contract-tests.json");
const optionalSkeletonReportPath =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json";
const optionalUpstreamReportPaths = {
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
  "manual_note_single_claim_product_write_disabled_adapter_contract_tests_report";
const expectedVersion =
  "manual_note_single_claim_product_write_disabled_adapter_contract_tests.v0.1";
const expectedSuiteStatus =
  "product_write_disabled_adapter_contract_tests_passed";
const expectedRecommendation =
  "ready_for_single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const expectedNextSlice =
  "single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const blockedSuiteStatus =
  "blocked_before_product_write_disabled_adapter_contract_tests";
const blockedRecommendation =
  "blocked_before_product_write_disabled_adapter_dry_run_invocation_harness";
const recheckSlice =
  "single_claim_product_write_disabled_adapter_contract_tests_recheck";
const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
  "contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
];
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-test-cases.v0.1.json",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-tests.sample.v0.1.json",
  helperPath,
  packagePath,
  browserValidatorPath,
  runnerPath,
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const requiredCaseGroups = [
  "positive",
  "skeleton_top_level_boundary",
  "adapter_input_contract",
  "normalized_adapter_input",
  "adapter_output_contract",
  "disabled_invocation_result",
  "future_product_write_command_preview",
  "refusal_matrix",
  "upstream_readiness",
  "source_contamination",
  "source_product_id_contamination",
  "optional_report_handling",
  "static_repo_boundary",
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
]);

for (const filePath of [
  helperPath,
  runnerPath,
  smokePath,
  casesFixturePath,
  sampleFixturePath,
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
const casesFixture = readJson(casesFixturePath);
const committedSample = readJson(sampleFixturePath);
const skeletonFixture = readJson(skeletonFixturePath);
const packageJson = readJson(packagePath);
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");

assertCommittedCaseFixture(casesFixture);
assertReport(committedSample, "committed sample report");
assertStaticMetadata(committedSample, "committed sample report");
assertNoProductBoundary(committedSample);
assertNoProductIds(committedSample);
assertSourceSelectionStable(committedSample);
assertHelperSource();
assertRunnerSource();
assertPackageScripts();
assertDocsAndBrowserValidator();
assertUiPathDetector();
assertExportedHelper();

const backups = backupOptionalReports([
  optionalSkeletonReportPath,
  ...Object.values(optionalUpstreamReportPaths),
]);
try {
  removeOptionalReports([
    optionalSkeletonReportPath,
    ...Object.values(optionalUpstreamReportPaths),
  ]);
  const absentReport = runFixtureModeAndReadReport("optional reports absent");
  writeHarmlessStaleOptionalReports();
  const staleReport = runFixtureModeAndReadReport("stale optional reports present");
  assert.equal(absentReport.final_status, "pass");
  assert.equal(staleReport.final_status, "pass");
  assert.equal(
    absentReport.suite_fingerprint,
    staleReport.suite_fingerprint,
    "fixture-mode fingerprint must not depend on stale /tmp optional reports",
  );
  assert.deepEqual(
    absentReport.source_evidence,
    staleReport.source_evidence,
    "fixture-mode source evidence must not include volatile /tmp presence",
  );
  assert.equal(
    staleReport.non_fingerprinted_runtime_notes
      .optional_disabled_adapter_skeleton_report_present_on_disk,
    true,
    "runtime optional presence may be recorded only outside the fingerprint",
  );
  assertFixtureModeIgnoredOptionalReports(staleReport);

  const failedOptional = runFailedOptionalSkeletonReport();
  assert.equal(failedOptional.final_status, "fail");
  assert.equal(failedOptional.contract_suite_status, blockedSuiteStatus);
  assert.equal(failedOptional.recommendation_status, blockedRecommendation);
  assert.equal(failedOptional.next_recommended_slice, recheckSlice);
  assert.ok(
    failedOptional.validation.failure_codes.includes(
      "optional_disabled_adapter_skeleton_report_not_passed",
    ),
    "failed optional skeleton report must block",
  );

  const failedUpstream = runFailedOptionalUpstreamReport();
  assert.equal(failedUpstream.final_status, "fail");
  assert.ok(
    failedUpstream.validation.failure_codes.includes(
      "optional_upstream_authority_contract_bundle_report_not_passed",
    ),
    "failed optional upstream report must block",
  );
} finally {
  restoreOptionalReports(backups);
  runFixtureModeAndReadReport("final passing fixture reset");
}

const runtimeReport = readJson(reportPath);
const contractTestsArtifact = readJson(contractTestsPath);
assertReport(runtimeReport, "runtime fixture-mode report");
assertStaticMetadata(runtimeReport, "runtime fixture-mode report");
assertNoProductBoundary(runtimeReport);
assert.equal(contractTestsArtifact.test_cases.length, runtimeReport.total_cases);
assert.equal(contractTestsArtifact.case_results.length, runtimeReport.total_cases);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
      final_status: "pass",
      total_cases: runtimeReport.total_cases,
      suite_fingerprint: runtimeReport.suite_fingerprint,
      next_recommended_slice: runtimeReport.next_recommended_slice,
      static_boundary_base_mode: runtimeReport.static_boundary_base_mode,
      checked_optional_report_stability: true,
      checked_static_boundary_delta: true,
    },
    null,
    2,
  ),
);

function assertCommittedCaseFixture(fixture) {
  assert.equal(
    fixture.fixture_kind,
    "manual_note_single_claim_product_write_disabled_adapter_contract_test_cases",
  );
  assert.equal(fixture.fixture_version, expectedVersion);
  assert.equal(fixture.test_case_count, fixture.test_cases.length);
  assert.ok(
    fixture.test_cases.length >= 80,
    "contract suite must stay broad enough for this disabled adapter slice",
  );
  assert.ok(
    fixture.test_cases.length <= 120,
    "contract suite should stay near the requested 80-120 case range",
  );
  const groups = new Set(fixture.test_cases.map((testCase) => testCase.case_group));
  for (const group of requiredCaseGroups) {
    assert.ok(groups.has(group), `missing contract case group ${group}`);
  }
  assertCaseCovered(
    fixture,
    "optional_disabled_adapter_skeleton_report_fail_blocks",
  );
  assertCaseCovered(fixture, "explicit_forbidden_surface_product_db_write_true_fails");
  assertCaseCovered(fixture, "source_nested_product_claim_id_fails");
  assertCaseCovered(fixture, "adapter_output_product_claim_id_invalid_fails");
  assertCaseCovered(fixture, "static_app_page_ui_rejected");
  assertCaseCovered(fixture, "static_app_layout_ui_rejected");
  assertCaseCovered(fixture, "static_component_ui_rejected");
  assertCaseCovered(fixture, "static_package_dependency_addition_rejected");
}

function assertReport(report, label) {
  assert.equal(report.report_kind, expectedReportKind, `${label} kind`);
  assert.equal(report.report_version, expectedVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final_status`);
  assert.equal(report.contract_suite_status, expectedSuiteStatus, `${label} status`);
  assert.equal(report.recommendation_status, expectedRecommendation, `${label} recommendation`);
  assert.equal(report.next_recommended_slice, expectedNextSlice, `${label} next slice`);
  assert.ok(report.total_cases >= 80, `${label} total case breadth`);
  assert.ok(report.total_cases <= 120, `${label} total case upper range`);
  assert.equal(report.positive_cases, 8, `${label} positive case count`);
  assert.equal(report.expected_negative_cases, report.total_cases - 8);
  assert.deepEqual(report.unexpected_passes, [], `${label} unexpected passes`);
  assert.deepEqual(report.unexpected_failures, [], `${label} unexpected failures`);
  assert.match(report.suite_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.match(
    report.source_disabled_adapter_skeleton_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
  assert.equal(report.validation.passed, true, `${label} validation`);
  assert.deepEqual(report.validation.failure_codes, [], `${label} failures`);
  assert.ok(
    !String(report.next_recommended_slice).includes("implementation"),
    `${label} must not recommend product write implementation`,
  );
  const groups = new Set(report.tested_boundaries.case_groups);
  for (const group of requiredCaseGroups) {
    assert.ok(groups.has(group), `${label} missing tested boundary ${group}`);
  }
}

function assertStaticMetadata(report, label) {
  assert.ok(report.static_boundary_base_ref, `${label} base ref recorded`);
  assert.ok(report.static_boundary_base_mode, `${label} base mode recorded`);
  assert.ok(
    Array.isArray(report.static_boundary_changed_files_inspected),
    `${label} changed files recorded`,
  );
  assert.ok(
    report.static_boundary_changed_files_inspected.length > 0,
    `${label} inspected changed-file set must be non-empty`,
  );
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      report.static_boundary_changed_files_inspected.includes(expectedFile),
      `${label} expected changed file missing: ${expectedFile}`,
    );
  }
  assert.ok(
    report.static_boundary_changed_files_inspected.some((filePath) =>
      filePath.endsWith("product-write-disabled-adapter-contract-tests-v0-1.mjs"),
    ),
    `${label} must include contract-test scripts in inspected delta`,
  );
  assert.ok(
    !report.static_boundary_changed_files_inspected.some(isSchemaDbSqlPath),
    `${label} must not include schema/migration/db/sql files`,
  );
  assert.deepEqual(
    report.static_boundary_package_added_lines_inspected.map(extractScriptName),
    allowedPackageScriptNames,
    `${label} package additions must be limited to the two contract-test scripts`,
  );
  assert.equal(
    report.static_boundary_used_fallback_allowlist,
    true,
    `${label} fixture sample uses committed allowlist mode`,
  );
  assert.equal(
    report.static_boundary_evidence.expected_changed_files.length,
    expectedChangedFiles.length,
    `${label} expected changed files recorded`,
  );
}

function assertNoProductBoundary(report) {
  const boundaries = report.tested_boundaries;
  for (const key of [
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "transaction_execution",
    "route_added",
    "ui_write_action_added",
    "adapter_enabled",
    "adapter_invocation_allowed_now",
    "proof_evidence_write",
    "perspective_or_canonical_graph_write",
    "work_item_creation",
    "source_fetch",
    "provider_or_openai_call",
    "retrieval_or_rag",
    "external_handoff",
    "browser_persistence",
  ]) {
    assert.equal(boundaries[key], false, `${key} must remain false`);
  }
  assert.equal(boundaries.disabled_adapter_contract_tests_only, true);
  assert.equal(boundaries.suite_does_not_recommend_product_write, true);
}

function assertNoProductIds(value) {
  assert.equal(hasNonNullProductIds(value), false, "report must not carry product IDs");
}

function assertSourceSelectionStable(report) {
  const skeletonSelection =
    report.source_evidence.disabled_adapter_skeleton.source_selection;
  assert.equal(skeletonSelection.optional_report_present, false);
  assert.equal(skeletonSelection.optional_report_ignored_for_fixture_mode, true);
  assert.equal(skeletonSelection.fallback_to_committed_fixture, true);
  for (const upstream of report.source_evidence.optional_upstream_reports) {
    assert.equal(upstream.source_selection.optional_report_present, false);
    assert.equal(
      upstream.source_selection.optional_report_ignored_for_fixture_mode,
      true,
    );
    assert.equal(upstream.source_selection.fallback_to_committed_fixture, true);
  }
}

function assertHelperSource() {
  assert.ok(
    helper.includes(
      "buildManualNoteSingleClaimProductWriteDisabledAdapterContractTestsReport",
    ),
    "exported helper builder must exist",
  );
  assert.ok(
    helper.includes("validateDisabledAdapterSkeletonContract"),
    "exported helper validator must exist",
  );
  assert.ok(
    helper.includes(expectedRecommendation),
    "helper must recommend dry-run invocation harness",
  );
  assert.ok(!helper.includes("ready_for_single_claim_product_write_implementation"));
}

function assertRunnerSource() {
  assert.ok(
    runner.includes("AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_BASE_REF"),
    "runner must support explicit static boundary base-ref override",
  );
  assert.ok(
    runner.includes("fixture_mode_committed_static_boundary_allowlist"),
    "runner must support committed allowlist fixture mode",
  );
  assert.ok(
    runner.includes("optional_disabled_adapter_skeleton_report_not_passed"),
    "runner must fail failed optional skeleton reports",
  );
  assert.ok(
    runner.includes("optional_upstream_authority_contract_bundle_report_not_passed"),
    "runner must fail failed optional upstream reports",
  );
  assert.ok(!runner.includes("product write route handler"));
}

function assertPackageScripts() {
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(packageJson.scripts[scriptName], `${scriptName} must be wired`);
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
    /product write disabled adapter contract tests/i,
    "docs index must mention this report-only contract suite",
  );
  assert.match(
    docsIndex,
    /single_claim_product_write_disabled_adapter_dry_run_invocation_harness/,
    "docs index must identify dry-run invocation harness as next slice",
  );
  assert.ok(
    browserValidator.includes(
      "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
    ),
    "browser validator must include report-only artifact note",
  );
  assert.ok(
    browserValidator.includes("product-write-disabled-adapter-contract-tests"),
    "browser validator must assert no browser route for this artifact",
  );
}

function assertUiPathDetector() {
  const isUiPath = (filePath) =>
    /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
  assert.equal(isUiPath("app/foo/page.tsx"), true);
  assert.equal(isUiPath("app/layout.jsx"), true);
  assert.equal(isUiPath("components/Foo.tsx"), true);
  assert.equal(isUiPath("app/api/foo/route.ts"), false);
}

function assertExportedHelper() {
  const staticBoundaryEvidence = {
    static_boundary_base_ref: "committed_allowlist",
    static_boundary_base_mode: "fixture_mode_committed_static_boundary_allowlist",
    static_boundary_changed_files_inspected: expectedChangedFiles,
    static_boundary_package_added_lines_inspected: allowedPackageScriptNames.map(
      (scriptName) => `+    "${scriptName}": "node placeholder.mjs",`,
    ),
    static_boundary_used_fallback_allowlist: true,
    expected_changed_files: expectedChangedFiles,
    allowed_package_script_names: allowedPackageScriptNames,
    static_boundary_probe_text: "",
  };
  const probe = spawnSync(
    tsxPath,
    [
      "--eval",
      `
        import {
          buildManualNoteSingleClaimProductWriteDisabledAdapterContractTestsReport,
          validateDisabledAdapterSkeletonContract
        } from "./${helperPath}";
        import { readFileSync } from "node:fs";
        const skeleton = JSON.parse(readFileSync("${skeletonFixturePath}", "utf8"));
        const cases = JSON.parse(readFileSync("${casesFixturePath}", "utf8"));
        const staticBoundaryEvidence = ${JSON.stringify(staticBoundaryEvidence)};
        const failures = validateDisabledAdapterSkeletonContract(skeleton);
        if (failures.length !== 0) throw new Error(failures.join(","));
        const report = buildManualNoteSingleClaimProductWriteDisabledAdapterContractTestsReport({
          disabledAdapterSkeleton: skeleton,
          contractTestCases: cases,
          staticBoundaryEvidence
        });
        if (report.final_status !== "pass") throw new Error(JSON.stringify(report.validation));
        if (report.next_recommended_slice !== "${expectedNextSlice}") throw new Error("wrong next slice");
      `,
    ],
    { encoding: "utf8" },
  );
  assert.equal(
    probe.status,
    0,
    `exported helper probe failed\nSTDOUT:\n${probe.stdout}\nSTDERR:\n${probe.stderr}`,
  );
}

function runFixtureModeAndReadReport(label) {
  const result = spawnSync(
    process.execPath,
    [runnerPath],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_FIXTURE_MODE:
          "1",
      },
    },
  );
  assert.equal(
    result.status,
    0,
    `${label} fixture runner failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return readJson(reportPath);
}

function runFailedOptionalSkeletonReport() {
  writeJson(optionalSkeletonReportPath, {
    final_status: "fail",
    disabled_adapter_skeleton: skeletonFixture,
  });
  const result = spawnSync(process.execPath, [runnerPath], {
    encoding: "utf8",
    env: { ...process.env },
  });
  assert.notEqual(result.status, 0, "failed optional skeleton report must fail");
  return readJson(reportPath);
}

function runFailedOptionalUpstreamReport() {
  rmSync(optionalSkeletonReportPath, { force: true });
  writeJson(optionalUpstreamReportPaths.authority_contract_bundle, {
    final_status: "fail",
    authority_contract_bundle: {
      authority_contract_bundle_status: "product_write_authority_contracts_defined_only",
    },
  });
  const result = spawnSync(process.execPath, [runnerPath], {
    encoding: "utf8",
    env: { ...process.env },
  });
  assert.notEqual(result.status, 0, "failed optional upstream report must fail");
  return readJson(reportPath);
}

function assertFixtureModeIgnoredOptionalReports(report) {
  assert.equal(
    report.optional_inputs.disabled_adapter_skeleton.optional_report_present,
    false,
  );
  assert.equal(
    report.optional_inputs.disabled_adapter_skeleton
      .optional_report_ignored_for_fixture_mode,
    true,
  );
  for (const upstream of report.optional_inputs.upstream_reports) {
    assert.equal(upstream.optional_report_present, false);
    assert.equal(upstream.optional_report_ignored_for_fixture_mode, true);
  }
}

function writeHarmlessStaleOptionalReports() {
  writeJson(optionalSkeletonReportPath, {
    final_status: "fail",
    disabled_adapter_skeleton: { stale: true },
  });
  for (const [label, filePath] of Object.entries(optionalUpstreamReportPaths)) {
    writeJson(filePath, {
      final_status: "fail",
      stale_optional_report: label,
    });
  }
}

function backupOptionalReports(filePaths) {
  const backupDir = `/tmp/augnes-product-write-disabled-adapter-contract-tests-smoke-backup-${process.pid}`;
  mkdirSync(backupDir, { recursive: true });
  return filePaths.map((filePath, index) => {
    const backupPath = path.join(backupDir, `${index}.json`);
    if (existsSync(filePath)) {
      mkdirSync(path.dirname(backupPath), { recursive: true });
      renameSync(filePath, backupPath);
      return { filePath, backupPath, existed: true };
    }
    return { filePath, backupPath, existed: false };
  });
}

function restoreOptionalReports(backups) {
  for (const backup of backups) {
    rmSync(backup.filePath, { force: true });
    if (backup.existed) {
      mkdirSync(path.dirname(backup.filePath), { recursive: true });
      renameSync(backup.backupPath, backup.filePath);
    }
  }
}

function removeOptionalReports(filePaths) {
  for (const filePath of filePaths) {
    rmSync(filePath, { force: true });
  }
}

function assertCaseCovered(fixture, caseId) {
  assert.ok(
    fixture.test_cases.some((testCase) => testCase.case_id === caseId),
    `${caseId} must be covered`,
  );
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractScriptName(line) {
  const match = line.match(/"([^"]+)":/);
  return match ? match[1] : "";
}

function isSchemaDbSqlPath(filePath) {
  return (
    /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
      filePath,
    ) || /^lib\/db(\.ts|\/)/.test(filePath)
  );
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (productIdKeys.has(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
}

void execFileSync;
