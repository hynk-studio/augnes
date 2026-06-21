import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-temp-db-single-claim-write-prototype-harness.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-write-prototype-harness.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs";
const designSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs";
const resultReviewFixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-review.sample.v0.1.json";
const resultReviewSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-result-review-v0-1.mjs";
const resultReviewRunnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-result-review-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const artifactDir = "/tmp/augnes-single-claim-write-prototype-v0-1";
const tempTables = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
];

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  designSmokePath,
  resultReviewFixturePath,
  resultReviewSmokePath,
  resultReviewRunnerPath,
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
const designSmoke = readFileSync(designSmokePath, "utf8");
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
      smoke: "research-candidate-temp-db-single-claim-write-prototype-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      temp_sql_scope_checked: true,
      temp_db_write_prototype_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_HARNESS_VERSION",
    "manual_note_temp_db_single_claim_write_prototype_harness.v0.1",
    "buildManualNoteTempDbSingleClaimWritePrototypeHarnessPlan",
    "buildManualNoteTempDbSingleClaimWritePrototypeHarnessResult",
    "buildManualNoteTempDbSingleClaimWritePrototypeHarnessMarkdown",
    "buildManualNoteTempDbSingleClaimWritePrototypeHarnessJson",
    "createManualNoteTempDbSingleClaimWritePrototypeHarnessFingerprint",
    "ready_for_temp_db_execution",
    "blocked_by_design_gate",
    "temp_db_single_claim_only",
    "temp_db_write_passed",
    "blocked_before_temp_db_write",
    "temp_db_write_failed",
    "CREATE TABLE IF NOT EXISTS temp_claim_records",
    "CREATE TABLE IF NOT EXISTS temp_idempotency_records",
    "CREATE TABLE IF NOT EXISTS temp_rollback_records",
    "CREATE TABLE IF NOT EXISTS temp_review_audit_records",
    "product_table_names_forbidden: true",
    "temp_db_single_claim_write_prototype_result_review",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertRunnerContract() {
  for (const requiredText of [
    artifactDir,
    "RESOLVED_ARTIFACT_DIR",
    "normalizeTempDbPath",
    "path.resolve",
    "single-claim-prototype.sqlite",
    "better-sqlite3",
    "system sqlite3 CLI",
    "DESIGN_FIXTURE_PATH",
    "report.json",
    "harness-plan.json",
    "harness-result.json",
    "INSERT INTO temp_claim_records",
    "INSERT INTO temp_idempotency_records",
    "INSERT INTO temp_rollback_records",
    "INSERT INTO temp_review_audit_records",
    "SELECT COUNT(*) AS count FROM",
    "product_table_statement_count: 0",
    "../evil.sqlite",
    "subdir/../../evil.sqlite",
    "relative/path.sqlite",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.ok(
    runner.includes("await rm(RESOLVED_ARTIFACT_DIR, { recursive: true, force: true })"),
    "runner must recreate only the resolved harness artifact directory",
  );
  assert.ok(
    runner.includes("isUnderHarnessTmp(options.tempDbPath)"),
    "runner must guard temp DB paths before execution",
  );
  assert.ok(
    runner.includes("startsWith(`${RESOLVED_ARTIFACT_DIR}${path.sep}`)"),
    "runner must constrain resolved DB path under the resolved /tmp harness directory",
  );
  assert.ok(
    runner.includes('resolved.endsWith(".sqlite")'),
    "runner should require temp DB paths to end in .sqlite",
  );
  assert.doesNotMatch(
    runner,
    /startsWith\(`\$\{ARTIFACT_DIR\}\/`\)/,
    "runner must not rely on raw ARTIFACT_DIR string-prefix containment",
  );
  assert.doesNotMatch(
    runner,
    /AUGNES_DB_PATH|DATABASE_URL|PRODUCT_DB|productDbPath\s*=/,
    "runner must not read or accept product DB configuration",
  );
  assertSqlScope("runner", runner);
}

function assertFixtureContract() {
  assert.equal(
    fixture.report_kind,
    "manual_note_temp_db_single_claim_write_prototype_report",
  );
  assert.equal(
    fixture.report_version,
    "manual_note_temp_db_single_claim_write_prototype_harness.v0.1",
  );
  assert.equal(fixture.final_status, "pass");
  assert.equal(fixture.artifact_dir, artifactDir);
  assert.equal(fixture.sqlite_tooling.selected, "better-sqlite3");
  assert.equal(
    fixture.harness_plan.harness_kind,
    "manual_note_temp_db_single_claim_write_prototype_harness",
  );
  assert.equal(
    fixture.harness_plan.harness_status,
    "ready_for_temp_db_execution",
  );
  assert.equal(fixture.harness_plan.execution_mode, "temp_db_single_claim_only");
  assert.equal(
    fixture.harness_result.result_kind,
    "manual_note_temp_db_single_claim_write_prototype_result",
  );
  assert.equal(fixture.harness_result.result_status, "temp_db_write_passed");
  assert.equal(
    fixture.harness_result.temp_db_artifact.temp_db_path,
    `${artifactDir}/single-claim-prototype.sqlite`,
  );
  assert.equal(fixture.harness_result.temp_db_artifact.temp_db_created, true);
  assert.equal(
    fixture.harness_result.temp_db_artifact.temp_db_preserved_for_inspection,
    true,
  );
  assert.equal(fixture.harness_result.temp_db_artifact.temp_db_under_tmp, true);
  assert.equal(
    fixture.harness_result.temp_db_artifact.product_db_path_used,
    false,
  );
  assert.equal(
    fixture.harness_result.executed_sql_summary.create_table_statement_count,
    4,
  );
  assert.equal(fixture.harness_result.executed_sql_summary.insert_statement_count, 4);
  assert.equal(fixture.harness_result.executed_sql_summary.select_statement_count, 4);
  assert.equal(
    fixture.harness_result.executed_sql_summary.product_table_statement_count,
    0,
  );
  for (const tableName of tempTables) {
    assert.equal(
      fixture.harness_plan.expected_row_counts[tableName],
      1,
      `${tableName} expected count must be 1`,
    );
    assert.equal(
      fixture.harness_result.verification.row_counts[tableName],
      1,
      `${tableName} verified count must be 1`,
    );
  }
  assert.equal(
    fixture.harness_result.inserted_records.temp_claim_record.inserted,
    true,
  );
  assert.equal(
    fixture.harness_result.inserted_records.temp_idempotency_record.inserted,
    true,
  );
  assert.equal(
    fixture.harness_result.inserted_records.temp_rollback_record.inserted,
    true,
  );
  assert.equal(
    fixture.harness_result.inserted_records.temp_review_audit_record.inserted,
    true,
  );
  assert.equal(
    fixture.harness_result.inserted_records.temp_claim_record.source_operation_id,
    "disabled-plan-op:claim:001",
  );
  assert.equal(
    fixture.harness_result.inserted_records.temp_claim_record.source_temp_intent_id,
    "temp-intent:claim:001",
  );
  assert.equal(
    fixture.harness_result.verification.expected_row_counts_match,
    true,
  );
  assert.equal(fixture.harness_result.verification.temp_tables_only, true);
  assert.equal(fixture.harness_result.verification.product_ids_absent, true);
  assert.equal(fixture.harness_result.verification.raw_manual_note_absent, true);
  assert.equal(fixture.harness_result.verification.product_db_untouched, true);
  assertBoundary(fixture.harness_result.product_write_boundary);
  assertBoundary(fixture.preserved_boundaries);
  assertNoNonNullProductIds(fixture);
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /manual note raw text|verbatim manual note|raw note body/i,
  );
  for (const statement of fixture.harness_plan.temp_schema_plan
    .schema_sql_statements) {
    assertSqlStatementUsesOnlyTempTables(statement);
  }
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-temp-db-single-claim-write-prototype-v0-1"
    ],
    "node scripts/smoke-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "harness:research-candidate-temp-db-single-claim-write-prototype-v0-1"
    ],
    "node scripts/run-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs",
  );
  for (const requiredText of [
    "Manual note temp DB single-claim write prototype harness",
    "creates one `/tmp` DB file",
    "temp-only schema objects",
    "exactly one temp claim",
    "exactly one temp idempotency",
    "exactly one temp rollback",
    "exactly one temp review audit",
    "row counts",
    "no product IDs",
    "no product DB write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no repo schema/migration/dependency",
    "best available method",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_write_prototype_artifact_note",
    ),
    "browser validator should include temp DB write prototype artifact note",
  );
  assert.ok(
    browserValidator.includes("temp_db_single_claim_write_prototype_no_browser_route"),
    "browser validator should assert no temp DB write prototype browser route",
  );
  assert.ok(
    designSmoke.includes(
      "smoke:research-candidate-temp-db-single-claim-write-prototype-v0-1",
    ),
    "design smoke should point to temp DB write prototype smoke",
  );
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
  assert.ok(
    docsIndex.includes("Manual note temp DB single-claim write prototype result review"),
    "docs should point to temp DB result review follow-up",
  );
  assert.ok(
    docsIndex.includes("does not open DB") &&
      docsIndex.includes("does not execute SQL"),
    "docs should preserve result review no-DB-open/no-SQL boundary",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_result_review_artifact_note",
    ),
    "browser validator should include temp DB result review artifact note",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /temp-db-single-claim|single-claim-write-prototype|write-prototype/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for this harness");

  const uiFiles = listFiles("components").filter((filePath) =>
    /temp-db-single-claim|single-claim-write-prototype|write-prototype/i.test(
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
        '"smoke:research-candidate-temp-db-single-claim-write-prototype-v0-1"',
      ) ||
      line.includes(
        '"harness:research-candidate-temp-db-single-claim-write-prototype-v0-1"',
      ) ||
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
      `package.json must only add temp DB write prototype scripts, not dependencies: ${line}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
  ]) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(
      text,
      /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/,
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(lib\/db|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import product DB/provider/retrieval/source/proof/evidence/work/Perspective modules`,
    );
    assert.doesNotMatch(
      text,
      /\b(next dev|npm run dev|createServer|listen\s*\()/,
      `${label} must not start the app server`,
    );
  }
  assertSqlScope("helper", helper);
  assertSqlScope("runner", runner);
}

function assertSqlScope(label, text) {
  const sqlFragments = text
    .split("\n")
    .filter((line) =>
      /\b(CREATE TABLE IF NOT EXISTS|INSERT INTO|SELECT COUNT\(\*\).*FROM)\b/.test(
        line,
      ),
    )
    .join("\n");
  assert.ok(sqlFragments, `${label} must include temp SQL fragments`);
  for (const line of sqlFragments.split("\n").filter(Boolean)) {
    assertSqlStatementUsesOnlyTempTables(line);
  }
}

function assertSqlStatementUsesOnlyTempTables(statement) {
  assert.doesNotMatch(
    statement,
    /\b(claims|evidences?|proofs?|perspectives?|canonical_graph|canonical_graph_edges?|work_items?|sources?|source_documents?)\b/i,
    `SQL must not reference product-like tables: ${statement}`,
  );
  assert.ok(
    tempTables.some((tableName) => statement.includes(tableName)) ||
      statement.includes("${tableName}"),
    `SQL must reference only temp tables: ${statement}`,
  );
}

function assertBoundary(boundary) {
  assert.equal(boundary.temp_db_execution_only, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "temp_db_execution_only") continue;
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
    if (
      [
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
      ].includes(key)
    ) {
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
