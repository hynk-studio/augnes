import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-disabled-write-adapter-contract-tests.ts";
const testCasesFixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-contract-test-cases.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs";
const tempHarnessSmokePath =
  "scripts/smoke-research-candidate-disabled-adapter-temp-harness-v0-1.mjs";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  helperPath,
  testCasesFixturePath,
  runnerPath,
  tempHarnessSmokePath,
  browserValidatorPath,
  docsIndexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const fixtureText = readFileSync(testCasesFixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const runner = readFileSync(runnerPath, "utf8");
const tempHarnessSmoke = readFileSync(tempHarnessSmokePath, "utf8");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertFixtureContract();
assertRunnerContract();
assertDocsPackageAndExistingSmokePointers();
assertNoRouteSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-disabled-write-adapter-contract-tests-v0-1",
      helper_exists: true,
      test_cases_fixture_exists_and_parses: true,
      contract_test_runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      contract_matrix_checked: true,
      tmp_only_runner_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_DISABLED_WRITE_ADAPTER_CONTRACT_TEST_VERSION",
    "manual_note_disabled_write_adapter_contract_tests.v0.1",
    "buildManualNoteDisabledWriteAdapterContractTestSuite",
    "runManualNoteDisabledWriteAdapterContractTestCase",
    "assertManualNoteDisabledWriteAdapterFixtureChain",
    "buildManualNoteDisabledWriteAdapterContractTestReport",
    "createManualNoteDisabledWriteAdapterContractTestFingerprint",
    "preview_draft_id_mismatch",
    "fingerprint_mismatch",
    "write_flag_enabled",
    "actual_promotion_enabled",
    "product_write_enabled",
    "non_null_product_id",
    "forbidden_provider_or_retrieval",
    "forbidden_source_fetching",
    "forbidden_external_handoff",
    "forbidden_persistence",
    "missing_required_section",
    "missing_contract_gap",
    "invalid_execution_mode",
    "invalid_product_write_mode",
    "invalid_temp_intent_id",
    "fixture_drift_detected",
    "temp-intent:",
    "temp_non_product_simulation",
    "product_write_mode",
    "disabled",
    "0x811c9dc5",
    "0x01000193",
    'key !== "generated_at" && key !== "selected_at"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertFixtureContract() {
  assert.equal(
    fixture.suite_kind,
    "manual_note_disabled_write_adapter_contract_tests",
  );
  assert.equal(
    fixture.suite_version,
    "manual_note_disabled_write_adapter_contract_tests.v0.1",
  );
  assert.equal(fixture.positive_fixture_chain.expected_status, "pass");
  assert.match(
    fixture.positive_fixture_chain.expected_fixture_chain_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
  assert.match(
    fixture.positive_fixture_chain.expected_candidate_review_packet_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );

  for (const fixturePath of [
    fixture.positive_fixture_chain.authority_design_fixture_path,
    fixture.positive_fixture_chain.disabled_adapter_readiness_fixture_path,
    fixture.positive_fixture_chain.contract_review_fixture_path,
    fixture.positive_fixture_chain.temp_harness_fixture_path,
  ]) {
    assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
    assert.ok(
      fixturePath.startsWith("fixtures/"),
      `${fixturePath} must be a committed fixture path`,
    );
  }

  const requiredCaseIds = [
    "positive_fixture_chain_passes",
    "authority_design_preview_draft_id_mismatch",
    "authority_design_candidate_review_fingerprint_mismatch",
    "authority_design_actual_write_route_enabled",
    "authority_design_write_adapter_implemented",
    "authority_design_write_execution_enabled",
    "authority_design_proof_evidence_write_true",
    "authority_design_canonical_graph_write_true",
    "disabled_readiness_normal_product_write_enabled",
    "disabled_readiness_actual_promotion_performed",
    "disabled_readiness_adapter_readiness_persisted",
    "disabled_readiness_non_null_proof_id",
    "disabled_readiness_non_null_perspective_id",
    "contract_review_gap_unexpected_empty_when_check_false",
    "contract_review_missing_idempotency_check",
    "temp_harness_non_temp_execution_mode",
    "temp_harness_product_write_mode_enabled",
    "temp_harness_product_db_write_true",
    "temp_harness_non_temp_intent_id",
    "temp_harness_non_null_product_record_id",
    "temp_harness_non_null_work_item_id",
    "temp_harness_source_fetching_true",
    "temp_harness_durable_persistence_true",
    "authority_design_provider_call_true",
    "authority_design_external_handoff_true",
    "authority_design_missing_source_evidence_section",
    "authority_design_missing_idempotency_section",
    "temp_harness_missing_rollback_section",
    "temp_harness_missing_review_audit_section",
    "fixture_drift_expected_chain_fingerprint_mismatch",
  ];
  const caseIds = fixture.test_cases.map((testCase) => testCase.case_id);
  for (const caseId of requiredCaseIds) {
    assert.ok(caseIds.includes(caseId), `fixture must include ${caseId}`);
  }
  assert.equal(new Set(caseIds).size, caseIds.length, "case ids must be unique");

  for (const testCase of fixture.test_cases) {
    assert.ok(testCase.case_id, "each test case needs a case_id");
    assert.ok(testCase.description, `${testCase.case_id} needs a description`);
    assert.ok(
      ["pass", "fail"].includes(testCase.expected_status),
      `${testCase.case_id} must declare expected_status`,
    );
    assert.ok(
      Array.isArray(testCase.expected_failure_codes),
      `${testCase.case_id} must declare expected_failure_codes`,
    );
  }

  const boundaries = fixture.preserved_boundaries;
  assert.equal(boundaries.fixture_only, true);
  for (const [key, value] of Object.entries(boundaries)) {
    if (key === "fixture_only") continue;
    assert.equal(value, false, `preserved boundary ${key} must be false`);
  }
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(fixtureText, /raw manual note|manual note raw text|verbatim manual note/i);
}

function assertRunnerContract() {
  for (const requiredText of [
    "/tmp/augnes-disabled-write-adapter-contract-tests-v0-1",
    "report.json",
    "case-results.json",
    testCasesFixturePath,
    "positiveChain.authority_design_fixture_path",
    "positiveChain.disabled_adapter_readiness_fixture_path",
    "positiveChain.contract_review_fixture_path",
    "positiveChain.temp_harness_fixture_path",
    "process.exitCode = 1",
    "final_status",
    "pass",
    "fail",
    "temp-intent:",
    "fixture_drift_detected",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  const writeFileLines = runner
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("await writeFile("));
  assert.deepEqual(writeFileLines, [
    "await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\\n`);",
    "await writeFile(CASE_RESULTS_PATH, `${JSON.stringify(caseResults, null, 2)}\\n`);",
  ]);
  assert.doesNotMatch(runner, /readFile\([^)]*(db|sqlite|schema|migration)/i);
}

function assertDocsPackageAndExistingSmokePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-disabled-write-adapter-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "contracts:research-candidate-disabled-write-adapter-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note fixture-only disabled write adapter contract tests",
    "positive fixture chain",
    "negative mutation matrix",
    "/tmp contract-test report runner",
    "no new route",
    "no UI behavior change",
    "no normal product write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no durable persistence",
    "no schema/migration/dependency",
    "best available method",
  ]) {
    assert.ok(
      docsIndex.includes(requiredText),
      `docs index must include ${requiredText}`,
    );
  }

  assert.ok(
    tempHarnessSmoke.includes(
      "smoke:research-candidate-disabled-write-adapter-contract-tests-v0-1",
    ),
    "temp harness smoke must point to fixture-only contract test follow-up",
  );
  assert.ok(
    tempHarnessSmoke.includes(
      "contracts:research-candidate-disabled-write-adapter-contract-tests-v0-1",
    ),
    "temp harness smoke must point to fixture-only contract runner",
  );
  assert.ok(
    browserValidator.includes("contract_tests_artifact_note"),
    "browser validator should include contract test artifact note",
  );
}

function assertNoRouteSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /disabled-write-adapter-contract-tests|contract-test/i.test(filePath),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for contract tests");

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
        '"smoke:research-candidate-disabled-write-adapter-contract-tests-v0-1"',
      ) ||
        line.includes(
          '"contracts:research-candidate-disabled-write-adapter-contract-tests-v0-1"',
        ),
      `package.json must only add the contract-test scripts, not dependencies: ${line}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  const implementationTexts = [
    ["helper", helper],
    ["runner", runner],
  ];
  for (const [label, text] of implementationTexts) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(
      text,
      /\bopenDatabase\s*\(/,
      `${label} must not call openDatabase`,
    );
    assert.doesNotMatch(
      text,
      /\b(INSERT|UPDATE|DELETE|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i,
      `${label} must not contain SQL write/schema statements`,
    );
    assert.doesNotMatch(
      text,
      /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/,
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import provider/retrieval/source/proof/evidence/work/Perspective write modules`,
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
      for (const entry of readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
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
