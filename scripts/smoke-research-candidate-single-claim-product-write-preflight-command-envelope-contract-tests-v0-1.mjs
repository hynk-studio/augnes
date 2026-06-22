import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-product-write-preflight-command-envelope-contract-tests.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs";
const casesFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope-contract-test-cases.v0.1.json";
const preflightEnvelopeFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope.sample.v0.1.json";
const packagePath = "package.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const contractTestsPath = path.join(artifactDir, "contract-tests.json");

const optionalReportPaths = {
  preflight_command_envelope:
    "/tmp/augnes-single-claim-product-write-preflight-command-envelope-v0-1/report.json",
  dry_run_invocation_harness:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1/report.json",
  disabled_adapter_contract_tests:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
  disabled_adapter_skeleton:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json",
  authority_contract_bundle:
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
  product_write_gate_design:
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
};

const expectedReportKind =
  "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests_report";
const expectedVersion =
  "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests.v0.1";
const expectedSuiteStatus =
  "product_write_preflight_command_envelope_contract_tests_passed";
const blockedSuiteStatus =
  "blocked_before_product_write_preflight_command_envelope_contract_tests";
const expectedRecommendation = "ready_for_product_write_preflight_stopline";
const blockedRecommendation = "blocked_before_product_write_preflight_stopline";
const expectedNextSlice = "single_claim_product_write_preflight_stopline";
const recheckSlice =
  "single_claim_product_write_preflight_command_envelope_contract_tests_recheck";

const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
  "contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
];
const downstreamAllowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
  "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
];
const expectedChangedFiles = [
  docsIndexPath,
  casesFixturePath,
  helperPath,
  packagePath,
  browserValidatorPath,
  runnerPath,
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
];
const requiredCaseGroups = [
  "positive",
  "top_level_boundary",
  "command_input",
  "product_claim_draft_preview",
  "storage_previews",
  "source_evidence",
  "optional_traceability",
  "static_boundary",
];
const requiredCaseIds = [
  "positive_committed_684_fixture_passes",
  "positive_fixture_mode_runner_output_passes",
  "positive_optional_684_matching_report_passes",
  "positive_stale_optional_upstream_ignored_in_fixture_mode",
  "positive_non_fixture_static_boundary_uses_committed_delta",
  "positive_next_slice_is_stopline_not_implementation",
  "preflight_status_not_ready_blocks",
  "next_slice_product_write_implementation_blocks",
  "command_envelope_persisted_now_true_blocks",
  "product_db_write_true_blocks",
  "db_open_true_blocks",
  "sql_execution_true_blocks",
  "explicit_forbidden_surface_enabled_adapter_transition_true_blocks",
  "explicit_forbidden_surface_provider_or_openai_call_true_blocks",
  "command_input_raw_manual_note_text_included_true_blocks",
  "command_input_operator_decision_required_false_blocks",
  "command_input_noop_fingerprint_missing_blocks",
  "draft_product_claim_id_non_null_blocks",
  "draft_sql_statement_count_positive_blocks",
  "idempotency_preview_execution_and_write_flags_true_block",
  "rollback_preview_storage_contract_flags_invalid_block",
  "audit_preview_record_ids_non_null_block",
  "observability_preview_execution_and_write_flags_true_block",
  "source_noop_final_status_fail_blocks",
  "source_operator_may_approve_product_write_true_blocks",
  "source_invocation_failed_probe_count_positive_blocks",
  "source_disabled_adapter_skeleton_adapter_enabled_true_blocks",
  "source_authority_granted_now_count_positive_blocks",
  "source_product_write_gate_design_status_not_design_only_blocks",
  "optional_684_report_final_status_fail_blocks",
  "optional_684_report_pass_missing_payload_blocks",
  "optional_684_report_pass_payload_fingerprint_mismatch_blocks",
  "optional_upstream_dry_run_fingerprint_mismatch_blocks",
  "optional_upstream_contract_tests_total_cases_mismatch_blocks",
  "optional_upstream_skeleton_adapter_enabled_true_blocks",
  "optional_upstream_authority_granted_now_count_positive_blocks",
  "optional_upstream_gate_design_product_write_allowed_blocks",
  "static_boundary_empty_changed_file_delta_blocks",
  "static_boundary_package_addition_outside_allowlist_blocks",
  "static_boundary_app_api_route_path_blocks",
  "static_boundary_components_ui_path_blocks",
  "static_boundary_app_router_page_ui_path_blocks",
  "static_boundary_schema_migration_db_sql_path_blocks",
  "static_boundary_network_external_call_pattern_blocks",
  "static_boundary_app_server_startup_pattern_blocks",
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
  "normalized_product_claim_id",
  "normalized_proof_id",
  "normalized_evidence_id",
  "normalized_perspective_id",
  "normalized_work_item_id",
  "command_envelope_id",
]);

for (const filePath of [
  helperPath,
  runnerPath,
  smokePath,
  casesFixturePath,
  preflightEnvelopeFixturePath,
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
const preflightEnvelopeFixture = readJson(preflightEnvelopeFixturePath);
const packageJson = readJson(packagePath);
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const branchPackageAddedScriptNames = readBranchPackageAddedScriptNames();
const downstreamStoplinePackageOnly =
  JSON.stringify(branchPackageAddedScriptNames) ===
  JSON.stringify(downstreamAllowedPackageScriptNames);

assertCommittedCaseFixture(casesFixture);
assertPackageScripts();
assertDocsAndBrowserValidator();
assertHelperSource();
assertRunnerSource();
assertNoForbiddenStaticSource(helper, "helper");
assertNoForbiddenStaticSource(runner, "runner");
assertNoForbiddenStaticSource(smoke, "smoke");
assertExportedHelper();

removeOptionalReports();
const fixtureModeRun = runRunner({
  label: "fixture mode optional reports absent",
  env: {
    AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_FIXTURE_MODE:
      "1",
  },
  expectPass: true,
});
assertReport(fixtureModeRun.report, "fixture mode report");
assertContractSuite(fixtureModeRun.contractTests, "fixture mode contract artifact");
assertStaticMetadata(fixtureModeRun.report, "fixture mode report", {
  expectFallback: true,
});

writeHarmlessStaleOptionalReports();
const staleFixtureModeRun = runRunner({
  label: "fixture mode stale optional reports present",
  env: {
    AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_FIXTURE_MODE:
      "1",
  },
  expectPass: true,
});
assert.equal(
  fixtureModeRun.contractTests.suite_fingerprint,
  staleFixtureModeRun.contractTests.suite_fingerprint,
  "fixture-mode contract fingerprint must ignore stale optional reports",
);
assert.deepEqual(
  fixtureModeRun.contractTests.source_evidence,
  staleFixtureModeRun.contractTests.source_evidence,
  "fixture-mode source evidence must ignore stale optional reports",
);
assert.equal(
  staleFixtureModeRun.report.non_fingerprinted_runtime_notes
    .optional_preflight_command_envelope_report_present_on_disk,
  true,
  "fixture mode may record optional presence only in runtime notes",
);

assertOptionalPreflightBlocks({
  label: "optional #684 failed report",
  report: {
    final_status: "fail",
    preflight_command_envelope: preflightEnvelopeFixture,
  },
  expectedFailureCode: "optional_preflight_command_envelope_report_not_passed",
});
assertOptionalPreflightBlocks({
  label: "optional #684 missing payload",
  report: {
    final_status: "pass",
    wrong_payload: preflightEnvelopeFixture,
  },
  expectedFailureCode: "optional_preflight_command_envelope_report_missing_payload",
});
const mismatchedPreflight = cloneJson(preflightEnvelopeFixture);
mismatchedPreflight.preflight_command_envelope_fingerprint = "fnv1a32:mismatch";
assertOptionalPreflightBlocks({
  label: "optional #684 payload fingerprint mismatch",
  report: {
    final_status: "pass",
    preflight_command_envelope: mismatchedPreflight,
  },
  expectedFailureCode: "optional_preflight_command_envelope_traceability_mismatch",
});

for (const mismatch of [
  {
    label: "dry_run_invocation_harness",
    mutate: (payload) => {
      payload.dry_run_invocation_harness_fingerprint = "fnv1a32:mismatch";
    },
    expectedFailureCode: "optional_dry_run_invocation_harness_traceability_mismatch",
  },
  {
    label: "disabled_adapter_contract_tests",
    mutate: (payload) => {
      payload.suite_fingerprint = "fnv1a32:mismatch";
    },
    expectedFailureCode:
      "optional_disabled_adapter_contract_tests_traceability_mismatch",
  },
  {
    label: "disabled_adapter_contract_tests",
    mutate: (payload) => {
      payload.total_cases = 120;
    },
    expectedFailureCode:
      "optional_disabled_adapter_contract_tests_traceability_mismatch",
  },
  {
    label: "disabled_adapter_skeleton",
    mutate: (payload) => {
      payload.disabled_adapter_skeleton_fingerprint = "fnv1a32:mismatch";
    },
    expectedFailureCode: "optional_disabled_adapter_skeleton_traceability_mismatch",
  },
  {
    label: "disabled_adapter_skeleton",
    mutate: (payload) => {
      payload.adapter_enabled = true;
    },
    expectedFailureCode: "optional_disabled_adapter_skeleton_traceability_mismatch",
  },
  {
    label: "authority_contract_bundle",
    mutate: (payload) => {
      payload.authority_contract_bundle_fingerprint = "fnv1a32:mismatch";
    },
    expectedFailureCode: "optional_authority_contract_bundle_traceability_mismatch",
  },
  {
    label: "authority_contract_bundle",
    mutate: (payload) => {
      payload.authority_gap_summary.authority_granted_now_count = 1;
    },
    expectedFailureCode: "optional_authority_contract_bundle_traceability_mismatch",
  },
  {
    label: "product_write_gate_design",
    mutate: (payload) => {
      payload.design_fingerprint = "fnv1a32:mismatch";
    },
    expectedFailureCode: "optional_product_write_gate_design_traceability_mismatch",
  },
  {
    label: "product_write_gate_design",
    mutate: (payload) => {
      payload.gate_design_status = "product_write_allowed";
    },
    expectedFailureCode: "optional_product_write_gate_design_traceability_mismatch",
  },
]) {
  assertOptionalUpstreamTraceabilityMismatchBlocks(mismatch);
}

removeOptionalReports();
const liveRun = runRunner({ label: "non-fixture live static boundary", env: {}, expectPass: true });
assertReport(liveRun.report, "live report");
assertContractSuite(liveRun.contractTests, "live contract artifact");
assertStaticMetadata(liveRun.report, "live report", {
  expectFallback: downstreamStoplinePackageOnly,
});
assertNoProductIds(liveRun.report);
assertNoProductIds(liveRun.contractTests);
assertNoWriteBoundary(liveRun.contractTests);

removeOptionalReports();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
      final_status: "pass",
      total_cases: liveRun.report.total_cases,
      suite_fingerprint: liveRun.report.suite_fingerprint,
      next_recommended_slice: liveRun.report.next_recommended_slice,
      static_boundary_base_mode: liveRun.report.static_boundary_base_mode,
      checked_fixture_mode_determinism: true,
      checked_optional_preflight_blocks: true,
      checked_optional_upstream_traceability_mismatch_blocks: true,
      checked_no_product_write_boundary: true,
      checked_no_product_write_implementation_recommendation: true,
    },
    null,
    2,
  ),
);

function assertCommittedCaseFixture(fixture) {
  assert.equal(
    fixture.fixture_kind,
    "manual_note_single_claim_product_write_preflight_command_envelope_contract_test_cases",
  );
  assert.equal(fixture.fixture_version, expectedVersion);
  assert.equal(fixture.test_case_count, fixture.test_cases.length);
  assert.equal(
    fixture.exactness_contract?.actual_status_equals_expected_status,
    true,
  );
  assert.equal(
    fixture.exactness_contract?.expected_failure_codes_must_be_present,
    true,
  );
  assert.equal(
    fixture.exactness_contract?.unexpected_failure_codes_forbidden_by_default,
    true,
  );
  assert.ok(fixture.test_cases.length >= 90, "contract case count lower bound");
  assert.ok(fixture.test_cases.length <= 130, "contract case count upper bound");
  const groups = new Set(fixture.test_cases.map((testCase) => testCase.case_group));
  for (const group of requiredCaseGroups) {
    assert.ok(groups.has(group), `missing contract case group ${group}`);
  }
  for (const caseId of requiredCaseIds) {
    assert.ok(
      fixture.test_cases.some((testCase) => testCase.case_id === caseId),
      `missing required contract case ${caseId}`,
    );
  }
  for (const testCase of fixture.test_cases) {
    assert.ok(testCase.case_id, "case_id required");
    assert.ok(testCase.case_group, `${testCase.case_id} case_group required`);
    assert.ok(
      ["pass", "fail"].includes(testCase.expected_status),
      `${testCase.case_id} expected_status required`,
    );
    assert.ok(
      Array.isArray(testCase.expected_failure_codes),
      `${testCase.case_id} expected_failure_codes required`,
    );
    assert.ok(
      Array.isArray(testCase.allowed_unexpected_failure_codes),
      `${testCase.case_id} allowed unexpected codes required`,
    );
  }
}

function assertReport(report, label) {
  assert.equal(report.report_kind, expectedReportKind, `${label} kind`);
  assert.equal(report.report_version, expectedVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final_status`);
  assert.equal(report.contract_suite_status, expectedSuiteStatus, `${label} status`);
  assert.equal(report.recommendation_status, expectedRecommendation, `${label} recommendation`);
  assert.equal(report.next_recommended_slice, expectedNextSlice, `${label} next slice`);
  assert.ok(report.total_cases >= 90, `${label} total case lower bound`);
  assert.ok(report.total_cases <= 130, `${label} total case upper bound`);
  assert.equal(report.total_cases, casesFixture.test_case_count, `${label} case count`);
  assert.equal(report.unexpected_passes, 0, `${label} unexpected passes`);
  assert.equal(report.unexpected_failures, 0, `${label} unexpected failures`);
  assert.match(report.suite_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(report.validation.passed, true, `${label} validation`);
  assert.deepEqual(report.validation.failure_codes, [], `${label} failures`);
  assertNoImplementationRecommendation(report);
  for (const group of requiredCaseGroups) {
    assert.ok(
      report.coverage_summary.case_groups.includes(group),
      `${label} missing group ${group}`,
    );
  }
}

function assertContractSuite(suite, label) {
  assert.equal(suite.contract_suite_status, expectedSuiteStatus, `${label} suite status`);
  assert.equal(suite.recommendation_status, expectedRecommendation, `${label} recommendation`);
  assert.equal(suite.next_recommended_slice, expectedNextSlice, `${label} next`);
  assert.equal(suite.validation.passed, true, `${label} validation`);
  assert.deepEqual(suite.validation.failure_codes, [], `${label} failures`);
  assert.equal(suite.contract_case_results.length, casesFixture.test_case_count);
  for (const result of suite.contract_case_results) {
    assert.ok(Array.isArray(result.unexpected_failure_codes), `${result.case_id} unexpected field`);
    assert.ok(Array.isArray(result.missing_expected_failure_codes), `${result.case_id} missing field`);
    assert.ok(result.actual_status, `${result.case_id} actual status`);
    assert.ok(result.expected_status, `${result.case_id} expected status`);
    assert.equal(result.case_status, "passed", `${result.case_id} exactness`);
    assert.deepEqual(result.unexpected_failure_codes, [], `${result.case_id} unexpected codes`);
    assert.deepEqual(result.missing_expected_failure_codes, [], `${result.case_id} missing codes`);
  }
}

function assertStaticMetadata(report, label, { expectFallback }) {
  assert.ok(report.static_boundary_base_ref, `${label} base ref`);
  assert.ok(report.static_boundary_base_mode, `${label} base mode`);
  assert.ok(
    Array.isArray(report.static_boundary_changed_files_inspected),
    `${label} changed files`,
  );
  assert.ok(
    report.static_boundary_changed_files_inspected.length > 0,
    `${label} non-empty changed-file delta`,
  );
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      report.static_boundary_changed_files_inspected.includes(expectedFile),
      `${label} expected changed file missing: ${expectedFile}`,
    );
  }
  const addedScriptNames =
    report.static_boundary_package_added_lines_inspected.map(extractScriptName);
  assert.ok(
    [allowedPackageScriptNames, downstreamAllowedPackageScriptNames].some(
      (allowedNames) => JSON.stringify(addedScriptNames) === JSON.stringify(allowedNames),
    ),
    `${label} package additions must be limited to contract-test or downstream stopline scripts`,
  );
  assert.equal(
    report.static_boundary_used_fallback_allowlist,
    expectFallback,
    `${label} fallback flag`,
  );
}

function assertNoWriteBoundary(suite) {
  const closeout = suite.no_write_contract_closeout;
  assert.equal(closeout.closeout_status, "contract_tests_fixture_only");
  for (const key of [
    "product_write_implemented",
    "product_write_allowed_now",
    "product_write_executed_now",
    "command_envelope_persisted_now",
    "command_envelope_executable_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "transaction_commit_now",
    "transaction_rollback_execution_now",
    "adapter_enabled_now",
    "adapter_runtime_invocation_now",
    "enabled_adapter_transition_now",
    "route_added_now",
    "ui_write_action_added_now",
    "schema_or_migration_change_now",
    "proof_evidence_write_now",
    "perspective_or_canonical_graph_write_now",
    "work_item_creation_now",
    "source_fetch_now",
    "provider_or_openai_call_now",
    "retrieval_or_rag_now",
    "external_handoff_now",
    "browser_persistence_now",
    "local_app_server_startup_now",
    "db_backed_dry_run_now",
  ]) {
    assert.equal(closeout[key], false, `${key} must remain false`);
  }
}

function assertOptionalPreflightBlocks({ label, report, expectedFailureCode }) {
  removeOptionalReports();
  writeJson(optionalReportPaths.preflight_command_envelope, report);
  const result = runRunner({ label, env: {}, expectPass: false });
  assertBlocked(result, expectedFailureCode);
  const selection = result.report.optional_inputs.preflight_command_envelope;
  assert.equal(selection.fallback_to_committed_fixture, false);
}

function assertOptionalUpstreamTraceabilityMismatchBlocks({
  label,
  mutate,
  expectedFailureCode,
}) {
  removeOptionalReports();
  const report = buildTraceableOptionalUpstreamReport(label, mutate);
  writeJson(optionalReportPaths[label], report);
  const result = runRunner({
    label: `${label} optional traceability mismatch`,
    env: {},
    expectPass: false,
  });
  assertBlocked(result, expectedFailureCode);
  const selection = result.report.optional_inputs.upstream_reports.find(
    (candidate) => candidate.source_label === label,
  );
  assert.ok(selection, `${label} selection present`);
  assert.equal(selection.source_used, "optional_report_passed");
  assert.equal(selection.fallback_to_committed_fixture, false);
  assert.equal(selection.traceability_checked, true);
  assert.equal(selection.traceability_status, "mismatched");
  assert.equal(selection.traceability_failure_code, expectedFailureCode);
}

function assertBlocked(result, expectedFailureCode) {
  assert.equal(result.report.final_status, "fail");
  assert.equal(result.report.contract_suite_status, blockedSuiteStatus);
  assert.equal(result.report.recommendation_status, blockedRecommendation);
  assert.equal(result.report.next_recommended_slice, recheckSlice);
  assert.ok(
    result.report.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from report validation`,
  );
  assert.ok(
    result.contractTests.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from artifact validation`,
  );
}

function runRunner({ label, env, expectPass }) {
  const result = spawnSync(process.execPath, [runnerPath], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (expectPass) {
    assert.equal(result.status, 0, `${label} runner stderr: ${result.stderr}`);
  } else {
    assert.notEqual(result.status, 0, `${label} runner should fail`);
  }
  return {
    report: readJson(reportPath),
    contractTests: readJson(contractTestsPath),
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function buildTraceableOptionalUpstreamReport(label, mutate) {
  const source = cloneJson(
    preflightEnvelopeFixture.source_evidence[sourceEvidenceKeyForLabel(label)],
  );
  assert.ok(source, `${label} source evidence exists`);
  mutate(source);
  if (label === "dry_run_invocation_harness") {
    return {
      final_status: "pass",
      dry_run_invocation_harness: source,
    };
  }
  if (label === "disabled_adapter_contract_tests") {
    return {
      ...source,
      final_status: "pass",
      case_results: [{ case_id: "traceability-placeholder", case_status: "pass" }],
    };
  }
  return {
    final_status: "pass",
    [label]: source,
  };
}

function sourceEvidenceKeyForLabel(label) {
  return label === "dry_run_invocation_harness"
    ? "disabled_adapter_dry_run_invocation_harness"
    : label;
}

function assertPackageScripts() {
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(packageJson.scripts[scriptName], `missing ${scriptName}`);
  }
  assert.equal(packageJson.scripts[allowedPackageScriptNames[0]], `node ${smokePath}`);
  assert.equal(packageJson.scripts[allowedPackageScriptNames[1]], `node ${runnerPath}`);
  for (const forbidden of [
    "product-write-implementation",
    "enabled-adapter",
    "product-id-allocation",
    "product-db-write",
    "product-write-route",
  ]) {
    assert.equal(
      Object.keys(packageJson.scripts).some((scriptName) =>
        scriptName.includes(forbidden),
      ),
      false,
      `package scripts must not add ${forbidden}`,
    );
  }
}

function assertDocsAndBrowserValidator() {
  assert.match(
    docsIndex,
    /product write preflight command envelope contract tests/i,
  );
  assert.match(docsIndex, /single_claim_product_write_preflight_stopline/);
  assert.match(docsIndex, /not product write implementation/i);
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_preflight_command_envelope_contract_tests_artifact_note",
    ),
    "browser validator must include contract-test report-only artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_preflight_command_envelope_contract_tests_no_browser_route",
    ),
    "browser validator must assert no contract-test browser route",
  );
}

function assertHelperSource() {
  assert.match(
    helper,
    /buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests/,
  );
  assert.match(helper, /product_write_preflight_command_envelope_contract_tests_passed/);
  assert.match(helper, /ready_for_product_write_preflight_stopline/);
  assert.match(helper, /single_claim_product_write_preflight_stopline/);
  assert.doesNotMatch(
    helper,
    /const READY_RECOMMENDATION = "ready_for_product_write_implementation"/,
  );
}

function assertRunnerSource() {
  assert.match(
    runner,
    /AUGNES_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_BASE_REF/,
  );
  assert.match(runner, /optional_preflight_command_envelope_report_not_passed/);
  assert.match(runner, /optional_preflight_command_envelope_traceability_mismatch/);
  assert.match(runner, /optional_\$\{label\}_traceability_mismatch/);
  assert.doesNotMatch(runner, /product write route handler/i);
}

function assertExportedHelper() {
  const helperProbeStaticBoundaryEvidence = {
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
          buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests
        } from "./${helperPath}";
        import { readFileSync } from "node:fs";
        const preflight = JSON.parse(readFileSync("${preflightEnvelopeFixturePath}", "utf8"));
        const cases = JSON.parse(readFileSync("${casesFixturePath}", "utf8"));
        const staticBoundaryEvidence = ${JSON.stringify(helperProbeStaticBoundaryEvidence)};
        const suite = buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests({
          preflightCommandEnvelope: preflight,
          staticBoundaryEvidence,
          contractTestCases: cases
        });
        if (suite.contract_suite_status !== "${expectedSuiteStatus}") throw new Error(JSON.stringify(suite.validation));
        if (suite.next_recommended_slice !== "${expectedNextSlice}") throw new Error("wrong next slice");
        const defaulted = buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests({
          preflightCommandEnvelope: preflight,
          staticBoundaryEvidence
        });
        if (defaulted.contract_suite_status !== "${expectedSuiteStatus}") throw new Error("omitted contractTestCases did not use valid defaults");
        if (defaulted.coverage_summary.total_cases !== cases.test_cases.length) throw new Error("omitted contractTestCases default case count changed");
        const blocked = buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests({
          preflightCommandEnvelope: preflight,
          staticBoundaryEvidence,
          contractTestCases: cases,
          sourceValidationFailureCodes: ["optional_preflight_command_envelope_report_not_passed"]
        });
        if (blocked.contract_suite_status !== "${blockedSuiteStatus}") throw new Error("source failure did not block");
        const clone = (value) => JSON.parse(JSON.stringify(value));
        const sentinelCase = (label, sourceCase = cases.test_cases[0]) => ({
          ...clone(sourceCase),
          case_id: "sentinel_" + label
        });
        const fixtureWithCases = (label, testCases) => ({
          ...clone(cases),
          test_case_count: testCases.length,
          test_cases: testCases
        });
        const withFirstSentinel = (label, fixture) => {
          const draft = clone(fixture);
          if (Array.isArray(draft.test_cases) && draft.test_cases.length > 0) {
            draft.test_cases[0] = sentinelCase(label, draft.test_cases[0]);
          }
          return draft;
        };
        const assertProvidedFixtureUsed = (label, suite, badFixture) => {
          const providedCount = Array.isArray(badFixture.test_cases) ? badFixture.test_cases.length : 0;
          if (suite.coverage_summary.total_cases !== providedCount) {
            throw new Error(label + " regenerated default cases instead of using provided count");
          }
          const sentinelIds = (badFixture.test_cases ?? [])
            .map((testCase) => testCase?.case_id)
            .filter((caseId) => typeof caseId === "string" && caseId.startsWith("sentinel_"));
          for (const sentinelId of sentinelIds) {
            if (!suite.contract_case_results.some((result) => result.case_id === sentinelId)) {
              throw new Error(label + " did not evaluate provided sentinel case " + sentinelId);
            }
          }
        };
        const assertBadFixtureBlocks = (label, badFixture, expectedCode) => {
          const badSuite = buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests({
            preflightCommandEnvelope: preflight,
            staticBoundaryEvidence,
            contractTestCases: badFixture
          });
          if (badSuite.contract_suite_status !== "${blockedSuiteStatus}") throw new Error(label + " did not block");
          if (badSuite.recommendation_status !== "${blockedRecommendation}") throw new Error(label + " recommendation did not block");
          if (badSuite.next_recommended_slice !== "${recheckSlice}") throw new Error(label + " next slice did not recheck");
          if (badSuite.validation.passed !== false) throw new Error(label + " validation did not fail");
          if (!badSuite.validation.failure_codes.includes(expectedCode)) {
            throw new Error(label + " missing expected failure code " + expectedCode + ": " + JSON.stringify(badSuite.validation.failure_codes));
          }
          assertProvidedFixtureUsed(label, badSuite, badFixture);
        };
        const emptyCases = fixtureWithCases("empty_test_cases", []);
        assertBadFixtureBlocks("empty test_cases", emptyCases, "contract_cases_fixture_test_cases_missing");
        const tooFewCases = fixtureWithCases("too_few_test_cases", [sentinelCase("too_few_test_cases")]);
        assertBadFixtureBlocks("too few test_cases", tooFewCases, "contract_cases_fixture_count_out_of_range");
        const wrongKind = withFirstSentinel("wrong_fixture_kind", { ...clone(cases), fixture_kind: "wrong_fixture_kind" });
        assertBadFixtureBlocks("wrong fixture_kind", wrongKind, "contract_cases_fixture_kind_invalid");
        const wrongVersion = withFirstSentinel("wrong_fixture_version", { ...clone(cases), fixture_version: "wrong_fixture_version" });
        assertBadFixtureBlocks("wrong fixture_version", wrongVersion, "contract_cases_fixture_version_invalid");
        const countMismatch = withFirstSentinel("test_case_count_mismatch", { ...clone(cases), test_case_count: cases.test_cases.length + 1 });
        assertBadFixtureBlocks("test_case_count mismatch", countMismatch, "contract_cases_fixture_count_mismatch");
        const missingGroupCases = clone(cases).test_cases.filter((testCase) => testCase.case_group !== "source_evidence");
        missingGroupCases[0] = sentinelCase("missing_required_case_group", missingGroupCases[0]);
        const missingRequiredGroup = fixtureWithCases("missing_required_case_group", missingGroupCases);
        assertBadFixtureBlocks("missing required case group", missingRequiredGroup, "contract_cases_fixture_required_case_group_missing");
        const missingExactness = withFirstSentinel("missing_exactness_contract", clone(cases));
        delete missingExactness.exactness_contract;
        assertBadFixtureBlocks("missing exactness_contract", missingExactness, "contract_cases_fixture_exactness_contract_missing");
        const invalidExactness = withFirstSentinel("invalid_exactness_contract", {
          ...clone(cases),
          exactness_contract: {
            actual_status_equals_expected_status: false,
            expected_failure_codes_must_be_present: false,
            unexpected_failure_codes_forbidden_by_default: false
          }
        });
        assertBadFixtureBlocks("exactness_contract flags false", invalidExactness, "contract_cases_fixture_exactness_contract_invalid");
        const missingCaseId = clone(cases);
        delete missingCaseId.test_cases[0].case_id;
        missingCaseId.test_cases[1] = sentinelCase("case_id_missing", missingCaseId.test_cases[1]);
        assertBadFixtureBlocks("case missing case_id", missingCaseId, "contract_cases_fixture_case_id_missing");
        const missingExpectedStatus = withFirstSentinel("expected_status_missing", clone(cases));
        delete missingExpectedStatus.test_cases[0].expected_status;
        assertBadFixtureBlocks("case missing expected_status", missingExpectedStatus, "contract_cases_fixture_expected_status_invalid");
        const failCaseEmptyExpectedCodes = clone(cases);
        const failCaseIndex = failCaseEmptyExpectedCodes.test_cases.findIndex((testCase) => testCase.expected_status === "fail");
        failCaseEmptyExpectedCodes.test_cases[failCaseIndex] = {
          ...failCaseEmptyExpectedCodes.test_cases[failCaseIndex],
          case_id: "sentinel_fail_case_empty_expected_failure_codes",
          expected_failure_codes: []
        };
        assertBadFixtureBlocks(
          "fail case empty expected_failure_codes",
          failCaseEmptyExpectedCodes,
          "contract_cases_fixture_fail_case_missing_expected_failure_codes"
        );
      `,
    ],
    { encoding: "utf8" },
  );
  assert.equal(probe.status, 0, probe.stderr || probe.stdout);
}

function writeHarmlessStaleOptionalReports() {
  for (const [label, filePath] of Object.entries(optionalReportPaths)) {
    writeJson(filePath, {
      final_status: "fail",
      [label]: { stale_optional_report: true },
      preflight_command_envelope: { stale_optional_report: true },
      case_results: [{ stale_optional_report: true }],
    });
  }
}

function removeOptionalReports() {
  for (const filePath of Object.values(optionalReportPaths)) rmSync(filePath, { force: true });
}

function assertNoProductIds(value) {
  assert.equal(hasNonNullProductIds(value), false, "no product or related ID allocated");
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (productIdKeys.has(key)) return nestedValue !== null && nestedValue !== undefined;
    return hasNonNullProductIds(nestedValue);
  });
}

function assertNoForbiddenStaticSource(text, label) {
  assert.doesNotMatch(text, executableSqlPattern(), `${label} must not contain executable SQL`);
  assert.doesNotMatch(text, forbiddenImportPattern(), `${label} must not import forbidden modules`);
  assert.doesNotMatch(text, networkOrExternalCallPattern(), `${label} must not call network/provider/retrieval/external APIs`);
  assert.doesNotMatch(text, browserPersistencePattern(), `${label} must not use browser persistence`);
  assert.doesNotMatch(text, appServerStartupPattern(), `${label} must not start a server`);
}

function assertNoImplementationRecommendation(value) {
  assert.ok(
    !String(value.next_recommended_slice).includes("product_write_implementation"),
    "must not recommend product write implementation",
  );
  assert.notEqual(
    value.next_recommended_slice,
    "enabled_adapter_transition",
    "must not recommend enabled adapter",
  );
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function readBranchPackageAddedScriptNames() {
  const mergeBase = spawnSync("git", ["merge-base", "origin/main", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim();
  const diffArgs = mergeBase
    ? ["diff", "--unified=0", mergeBase, "--", packagePath]
    : ["diff", "--unified=0", "--", packagePath];
  const diff = spawnSync("git", diffArgs, { encoding: "utf8" }).stdout;
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map(extractScriptName)
    .filter(Boolean);
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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
