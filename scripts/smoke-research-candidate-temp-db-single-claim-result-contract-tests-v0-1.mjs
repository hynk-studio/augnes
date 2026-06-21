import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-temp-db-single-claim-result-contract-tests.ts";
const testCasesFixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-contract-test-cases.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-result-contract-tests-v0-1.mjs";
const resultReviewSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-result-review-v0-1.mjs";
const productWriteGateDesignHelperPath =
  "lib/research-candidate-review/manual-note-single-claim-product-write-gate-design.ts";
const productWriteGateDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";
const productWriteGateDesignRunnerPath =
  "scripts/run-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const productWriteGateDesignSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const artifactDir = "/tmp/augnes-temp-db-single-claim-result-contract-tests-v0-1";
const requiredCaseIds = [
  "positive_committed_fixture_needs_attention",
  "positive_live_reports_all_pass_when_available",
  "warning_missing_browser_report",
  "warning_missing_tmp_harness_report",
  "negative_harness_result_not_passed",
  "negative_row_count_zero_claim",
  "negative_row_count_two_claims",
  "negative_idempotency_row_missing",
  "negative_rollback_row_missing",
  "negative_audit_row_missing",
  "negative_product_table_statement_count_nonzero",
  "negative_product_db_path_used_true",
  "negative_product_db_untouched_false",
  "negative_product_claim_id_present",
  "negative_canonical_claim_id_present",
  "negative_proof_id_present",
  "negative_evidence_id_present",
  "negative_perspective_id_present",
  "negative_work_item_id_present",
  "negative_raw_manual_note_flag_true",
  "negative_raw_manual_note_text_present",
  "negative_temp_db_path_outside_harness",
  "negative_temp_db_under_tmp_false",
  "negative_boundary_product_db_write_true",
  "negative_boundary_actual_promotion_true",
  "negative_boundary_perspective_write_true",
  "negative_boundary_provider_calls_true",
  "negative_boundary_source_fetching_true",
  "negative_browser_external_requests_nonzero",
  "negative_browser_forbidden_requests_nonzero",
  "negative_review_status_passed_with_warn_evidence",
  "negative_review_status_needs_attention_with_block_evidence",
  "negative_recommendation_ready_with_blocked_review",
  "fixture_drift_review_fingerprint_mismatch",
];
const requiredFailureCodes = [
  "harness_result_not_passed",
  "row_count_mismatch",
  "expected_row_counts_not_matched",
  "product_table_statement_present",
  "product_db_path_used",
  "product_db_touched",
  "product_id_present",
  "raw_manual_note_present",
  "temp_db_path_outside_harness",
  "temp_db_under_tmp_false",
  "boundary_flag_enabled",
  "browser_external_request_present",
  "browser_forbidden_request_present",
  "review_status_mismatch",
  "recommendation_status_mismatch",
  "fixture_drift_detected",
];
const intentionalProductIdCases = new Set([
  "negative_product_claim_id_present",
  "negative_canonical_claim_id_present",
  "negative_proof_id_present",
  "negative_evidence_id_present",
  "negative_perspective_id_present",
  "negative_work_item_id_present",
]);

for (const filePath of [
  helperPath,
  testCasesFixturePath,
  runnerPath,
  resultReviewSmokePath,
  productWriteGateDesignHelperPath,
  productWriteGateDesignFixturePath,
  productWriteGateDesignRunnerPath,
  productWriteGateDesignSmokePath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const fixtureText = readFileSync(testCasesFixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const resultReviewSmoke = readFileSync(resultReviewSmokePath, "utf8");
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const browserValidator = readFileSync(browserValidatorPath, "utf8");

assertHelperContract();
assertRunnerContract();
assertFixtureContract();
assertDocsPackageAndBrowserPointers();
assertNoRouteUiSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-temp-db-single-claim-result-contract-tests-v0-1",
      helper_exists: true,
      test_cases_fixture_exists_and_parses: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      no_db_open_or_sql_execution_checked: true,
      required_cases_checked: requiredCaseIds.length,
      required_failure_codes_checked: requiredFailureCodes.length,
      product_write_gate_design_next_step_pointer_checked: true,
      temp_db_single_claim_result_contract_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_VERSION",
    "manual_note_temp_db_single_claim_result_contract_tests.v0.1",
    "buildManualNoteTempDbSingleClaimResultContractTestSuite",
    "runManualNoteTempDbSingleClaimResultContractTestCase",
    "buildManualNoteTempDbSingleClaimResultContractTestReport",
    "createManualNoteTempDbSingleClaimResultContractTestFingerprint",
    "temp_result_review_passed",
    "temp_result_review_needs_attention",
    "temp_result_review_blocked",
    "fixture_drift_detected",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertRunnerContract() {
  for (const requiredText of [
    artifactDir,
    "RESULT_REVIEW_FIXTURE_PATH",
    "TEMP_DB_HARNESS_FIXTURE_PATH",
    "TEST_CASES_FIXTURE_PATH",
    "OPTIONAL_RESULT_REVIEW_REPORT_PATH",
    "OPTIONAL_TMP_HARNESS_REPORT_PATH",
    "OPTIONAL_BROWSER_REPORT_PATH",
    "case-results.json",
    "report.json",
    "expected_failure_codes",
    "positive_fixture_chain_result",
    "optional_live_report_case_result",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.ok(
    runner.includes("await rm(ARTIFACT_DIR, { recursive: true, force: true })"),
    "runner must recreate only the contract-test artifact directory",
  );
  assert.ok(
    runner.includes("await writeFile(") &&
      runner.includes("REPORT_PATH") &&
      runner.includes("CASE_RESULTS_PATH"),
    "runner must write report and case results artifacts",
  );
  assert.ok(
    runner.includes("path.resolve(value)") &&
      runner.includes("RESOLVED_HARNESS_ARTIFACT_DIR"),
    "runner must validate harness temp DB path using resolved path containment",
  );
  assert.doesNotMatch(
    runner,
    /\b(readFile|open|connect|exec|prepare)\s*\([^)]*\.sqlite/i,
    "runner must not open SQLite files",
  );
}

function assertFixtureContract() {
  assert.equal(
    fixture.suite_kind,
    "manual_note_temp_db_single_claim_result_contract_tests",
  );
  assert.equal(
    fixture.suite_version,
    "manual_note_temp_db_single_claim_result_contract_tests.v0.1",
  );
  assert.equal(
    fixture.positive_fixture_chain.expected_review_status,
    "temp_result_review_needs_attention",
  );
  assert.equal(
    fixture.positive_fixture_chain.expected_recommendation_status,
    "ready_for_temp_result_contract_tests",
  );
  const testCases = fixture.test_cases;
  assert.equal(testCases.length, requiredCaseIds.length);
  const caseIds = new Set(testCases.map((testCase) => testCase.case_id));
  for (const caseId of requiredCaseIds) {
    assert.ok(caseIds.has(caseId), `fixture must include case ${caseId}`);
  }
  const allExpectedFailureCodes = new Set(
    testCases.flatMap((testCase) => testCase.expected_failure_codes ?? []),
  );
  for (const code of requiredFailureCodes) {
    assert.ok(allExpectedFailureCodes.has(code), `fixture must include failure code ${code}`);
  }
  const positiveCommitted = findCase("positive_committed_fixture_needs_attention");
  assert.equal(positiveCommitted.expected_status, "pass");
  assert.equal(
    positiveCommitted.expected_review_status,
    "temp_result_review_needs_attention",
  );
  const optionalLive = findCase("positive_live_reports_all_pass_when_available");
  assert.equal(optionalLive.optional, true);
  assert.equal(optionalLive.skip_when_optional_reports_missing, true);
  assert.equal(optionalLive.expected_review_status, "temp_result_review_passed");

  const warnMismatch = findCase("negative_review_status_passed_with_warn_evidence");
  assert.deepEqual(warnMismatch.expected_failure_codes, ["review_status_mismatch"]);
  assert.ok(
    JSON.stringify(warnMismatch.mutated_fixture_patch).includes(
      "temp_result_review_passed",
    ),
    "warn-status case must prove warn evidence cannot produce passed status",
  );
  const blockMismatch = findCase(
    "negative_review_status_needs_attention_with_block_evidence",
  );
  assert.deepEqual(blockMismatch.expected_failure_codes, ["review_status_mismatch"]);
  assert.ok(
    JSON.stringify(blockMismatch.mutated_fixture_patch).includes('"block"'),
    "block-status case must prove block evidence requires blocked status",
  );

  assertBoundary(fixture.preserved_boundaries);
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assertNoUnexpectedProductIds(testCases);
  assertNoUnexpectedRawNoteText(testCases);
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-temp-db-single-claim-result-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "contracts:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-temp-db-single-claim-result-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-gate-design-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "design:research-candidate-single-claim-product-write-gate-design-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  );
  for (const requiredText of [
    "Manual note temp DB single-claim result contract tests",
    "positive needs_attention baseline",
    "optional live all-pass report case",
    "negative mutation matrix",
    "row counts",
    "path containment",
    "product IDs",
    "raw note",
    "product DB boundary",
    "browser external/forbidden requests",
    "status semantics",
    "/tmp contract-test report runner",
    "does not open DB",
    "does not execute SQL",
    "no product DB write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no repo schema/migration/dependency",
    "best available method",
    "Manual note single-claim product write gate design",
    "consumes temp DB result contract evidence",
    "defines product-write authority gates",
    "intentionally block product write",
    "single-claim temp-to-product bridge design",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_result_contract_tests_artifact_note",
    ),
    "browser validator should include temp DB result contract-tests artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_result_contract_tests_no_browser_route",
    ),
    "browser validator should assert no temp DB result contract-tests browser route",
  );
  assert.ok(
    browserValidator.includes("single_claim_product_write_gate_design_artifact_note"),
    "browser validator should include single-claim product write gate design artifact note",
  );
  assert.ok(
    browserValidator.includes("single_claim_product_write_gate_design_no_browser_route"),
    "browser validator should assert no single-claim product write gate design browser route",
  );
  assert.ok(
    resultReviewSmoke.includes(
      "smoke:research-candidate-temp-db-single-claim-result-contract-tests-v0-1",
    ),
    "result review smoke should point to result contract-tests smoke",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /temp-db-single-claim-result-contract|single-claim-result-contract/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for result contract tests");

  const uiFiles = listFiles("components").filter((filePath) =>
    /temp-db-single-claim-result-contract|single-claim-result-contract/i.test(
      filePath,
    ),
  );
  assert.deepEqual(uiFiles, [], "no UI component should be added for this slice");

  const changedFiles = new Set(readGitChangedFiles());
  for (const filePath of changedFiles) {
    assert.ok(
      !/(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) && !/^lib\/db(\.ts|\/)/.test(filePath),
      `schema or migration file must not be changed: ${filePath}`,
    );
  }

  const packageDiff = readCommand("git diff -- package.json");
  const addedPackageLines = packageDiff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  for (const line of addedPackageLines) {
    assert.ok(
      line.includes(
        '"smoke:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"',
      ) ||
      line.includes(
        '"contracts:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"',
      ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-gate-design-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-single-claim-product-write-gate-design-v0-1"',
      ),
      `package.json must only add result contract-test scripts, not dependencies: ${line}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
  ]) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(text, /\bopenDatabase\s*\(/, `${label} must not call openDatabase`);
    assert.doesNotMatch(
      text,
      /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/,
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import DB/provider/retrieval/source/proof/evidence/work/Perspective modules`,
    );
    assert.doesNotMatch(
      text,
      /\b(next dev|npm run dev|createServer|listen\s*\()/,
      `${label} must not start the app server`,
    );
    assert.doesNotMatch(
      text,
      /\b(CREATE TABLE|INSERT INTO|UPDATE\s+\w|DELETE\s+FROM|ALTER TABLE|DROP TABLE)\b/i,
      `${label} must not include executable SQL statements`,
    );
  }
}

function findCase(caseId) {
  const testCase = fixture.test_cases.find((candidate) => candidate.case_id === caseId);
  assert.ok(testCase, `fixture must include ${caseId}`);
  return testCase;
}

function assertBoundary(boundary) {
  assert.equal(boundary.fixture_only, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "fixture_only") continue;
    assert.equal(value, false, `boundary flag ${key} must be false`);
  }
}

function assertNoUnexpectedProductIds(testCases) {
  const productIdPattern =
    /(product-claim:bad|canonical-claim:bad|proof:bad|evidence:bad|perspective:bad|work-item:bad)/;
  for (const testCase of testCases) {
    const hasProductId = productIdPattern.test(JSON.stringify(testCase));
    assert.equal(
      hasProductId,
      intentionalProductIdCases.has(testCase.case_id),
      `${testCase.case_id} product ID mutation allowance mismatch`,
    );
  }
}

function assertNoUnexpectedRawNoteText(testCases) {
  for (const testCase of testCases) {
    const hasRawNoteProbe = /RAW_MANUAL_NOTE_TEXT_FOR_NEGATIVE_CONTRACT_TEST/.test(
      JSON.stringify(testCase),
    );
    assert.equal(
      hasRawNoteProbe,
      testCase.case_id === "negative_raw_manual_note_text_present",
      `${testCase.case_id} raw-note mutation allowance mismatch`,
    );
  }
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const output = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) stack.push(path.join(current, entry));
      continue;
    }
    output.push(current);
  }
  return output;
}

function readGitChangedFiles() {
  return readCommand("git diff --name-only")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readCommand(command) {
  return execSync(command, { encoding: "utf8" });
}
