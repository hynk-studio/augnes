import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-temp-db-single-claim-result-review.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-review.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-result-review-v0-1.mjs";
const resultContractTestsFixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-contract-test-cases.v0.1.json";
const resultContractTestsSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-result-contract-tests-v0-1.mjs";
const resultContractTestsRunnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-result-contract-tests-v0-1.mjs";
const writePrototypeSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const artifactDir = "/tmp/augnes-temp-db-single-claim-result-review-v0-1";
const tempTables = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
];
const productIdKeys = [
  "product_record_id",
  "product_claim_id",
  "canonical_claim_id",
  "canonical_id",
  "proof_id",
  "evidence_id",
  "perspective_id",
  "work_item_id",
  "product_idempotency_record_id",
  "audit_record_product_id",
];

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  resultContractTestsFixturePath,
  resultContractTestsSmokePath,
  resultContractTestsRunnerPath,
  writePrototypeSmokePath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const writePrototypeSmoke = readFileSync(writePrototypeSmokePath, "utf8");
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
      smoke: "research-candidate-temp-db-single-claim-result-review-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      no_db_open_or_sql_execution_checked: true,
      temp_db_single_claim_result_review_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_VERSION",
    "manual_note_temp_db_single_claim_result_review.v0.1",
    "buildManualNoteTempDbSingleClaimResultReview",
    "buildManualNoteTempDbSingleClaimResultReviewMarkdown",
    "buildManualNoteTempDbSingleClaimResultReviewJson",
    "createManualNoteTempDbSingleClaimResultReviewFingerprint",
    "temp_result_review_passed",
    "temp_result_review_needs_attention",
    "temp_result_review_blocked",
    "row_counts_match_expected",
    "temp_db_path_containment_checked",
    "remaining_product_write_blockers",
    "temp_db_single_claim_result_contract_tests",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertRunnerContract() {
  for (const requiredText of [
    artifactDir,
    "COMMITTED_HARNESS_FIXTURE_PATH",
    "TMP_HARNESS_REPORT_PATH",
    "BROWSER_VALIDATION_REPORT_PATH",
    "report.json",
    "result-review.json",
    "final_status",
    "validateReport",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.ok(
    runner.includes("await rm(ARTIFACT_DIR, { recursive: true, force: true })"),
    "runner must recreate only the result-review artifact directory",
  );
  assert.ok(
    runner.includes("await writeFile(REVIEW_PATH"),
    "runner must write the result review artifact",
  );
  assert.ok(
    runner.includes("await writeFile(REPORT_PATH"),
    "runner must write the result review report artifact",
  );
  assertStatusDerivation("helper", helper);
  assertStatusDerivation("runner", runner);
  assert.ok(
    runner.includes('["temp_result_review_passed", "temp_result_review_needs_attention"]') &&
      runner.includes('result.status !== "block"'),
    "validateReport must accept needs_attention only when evidence checks are non-blocking",
  );
  assert.doesNotMatch(
    runner,
    /\.(?:open|connect|Database|exec|prepare)\s*\([^)]*\.sqlite/i,
    "runner must not open SQLite files",
  );
}

function assertFixtureContract() {
  assert.equal(fixture.review_kind, "manual_note_temp_db_single_claim_result_review");
  assert.equal(
    fixture.review_version,
    "manual_note_temp_db_single_claim_result_review.v0.1",
  );
  assert.match(fixture.review_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(fixture.review_status, "temp_result_review_needs_attention");
  assert.ok(
    fixture.evidence_check_results.some((result) => result.status === "warn"),
    "fixture should preserve warn evidence for optional report-backed checks",
  );
  assert.ok(
    !fixture.evidence_check_results.some((result) => result.status === "block"),
    "fixture warn evidence should remain non-blocking",
  );
  assert.equal(fixture.source_harness.result_status, "temp_db_write_passed");
  assert.equal(fixture.source_harness.sqlite_method, "better-sqlite3");
  assert.equal(fixture.source_harness.temp_db_under_tmp, true);
  assert.equal(fixture.source_harness.temp_db_created, true);
  assert.equal(fixture.temp_record_summary.exactly_one_each, true);
  for (const tableName of tempTables) {
    assert.equal(
      fixture.temp_record_summary[tableName],
      1,
      `${tableName} count must be 1`,
    );
  }
  assert.equal(
    fixture.inserted_claim_summary.source_operation_id,
    "disabled-plan-op:claim:001",
  );
  assert.equal(
    fixture.inserted_claim_summary.source_temp_intent_id,
    "temp-intent:claim:001",
  );
  assert.equal(fixture.inserted_claim_summary.raw_manual_note_text_included, false);
  for (const [key, value] of Object.entries(fixture.evidence_checks)) {
    assert.equal(value, true, `evidence check ${key} must be true`);
  }
  assert.ok(
    fixture.remaining_product_write_blockers.length >= 10,
    "fixture must list remaining product-write blockers",
  );
  assertBoundary(fixture.product_write_boundary);
  assert.equal(
    fixture.next_stage_recommendation.recommendation_status,
    "ready_for_temp_result_contract_tests",
  );
  assert.equal(
    fixture.next_recommended_slice,
    "temp_db_single_claim_result_contract_tests",
  );
  assertNoNonNullProductIds(fixture);
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /manual note raw text|verbatim manual note|raw note body/i,
  );
}

function assertStatusDerivation(label, text) {
  assert.ok(text.includes("hasBlock"), `${label} must derive status from block checks`);
  assert.ok(text.includes("hasWarn"), `${label} must derive status from warn checks`);
  assert.ok(
    text.includes('? "temp_result_review_blocked"'),
    `${label} must use blocked status when any evidence check blocks`,
  );
  assert.ok(
    text.includes('? "temp_result_review_needs_attention"'),
    `${label} must use needs_attention when any evidence check warns`,
  );
  assert.doesNotMatch(
    text,
    /hasWarn[\s\S]{0,120}\? "temp_result_review_passed"/,
    `${label} must not map warn evidence to passed`,
  );
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-temp-db-single-claim-result-review-v0-1"
    ],
    "node scripts/smoke-research-candidate-temp-db-single-claim-result-review-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "review:research-candidate-temp-db-single-claim-result-review-v0-1"
    ],
    "node scripts/run-research-candidate-temp-db-single-claim-result-review-v0-1.mjs",
  );
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
  for (const requiredText of [
    "Manual note temp DB single-claim write prototype result review",
    "reviews the committed harness fixture",
    "local `/tmp` harness report",
    "does not open DB",
    "does not execute SQL",
    "row-count evidence",
    "path containment",
    "product DB boundary",
    "product ID absence",
    "raw note absence",
    "remaining product-write blockers",
    "no product DB write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no repo schema/migration/dependency",
    "best available method",
    "Manual note temp DB single-claim result contract tests",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_result_review_artifact_note",
    ),
    "browser validator should include temp DB result review artifact note",
  );
  assert.ok(
    browserValidator.includes("temp_db_single_claim_result_review_no_browser_route"),
    "browser validator should assert no temp DB result review browser route",
  );
  assert.ok(
    writePrototypeSmoke.includes(
      "smoke:research-candidate-temp-db-single-claim-result-review-v0-1",
    ),
    "write prototype smoke should point to temp DB result review smoke",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_result_contract_tests_artifact_note",
    ),
    "browser validator should include temp DB result contract-tests artifact note",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /temp-db-single-claim-result-review|single-claim-result-review/i.test(filePath),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for result review");

  const uiFiles = listFiles("components").filter((filePath) =>
    /temp-db-single-claim-result-review|single-claim-result-review/i.test(filePath),
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
        '"smoke:research-candidate-temp-db-single-claim-result-review-v0-1"',
      ) ||
        line.includes(
          '"review:research-candidate-temp-db-single-claim-result-review-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"contracts:research-candidate-temp-db-single-claim-result-contract-tests-v0-1"',
        ),
      `package.json must only add result review scripts, not dependencies: ${line}`,
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

function assertBoundary(boundary) {
  assert.equal(boundary.result_review_only, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "result_review_only") continue;
    assert.equal(value, false, `boundary flag ${key} must be false`);
  }
}

function assertNoNonNullProductIds(value, pathLabel = "fixture") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoNonNullProductIds(item, `${pathLabel}[${index}]`),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    if (productIdKeys.includes(key)) {
      assert.equal(nestedValue, null, `${pathLabel}.${key} must be null`);
    }
    assertNoNonNullProductIds(nestedValue, `${pathLabel}.${key}`);
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
