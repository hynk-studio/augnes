import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-disabled-write-adapter-transaction-plan.ts";
const planFixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-transaction-plan.sample.v0.1.json";
const abortFixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-abort-result.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-disabled-write-adapter-transaction-plan-v0-1.mjs";
const productWriteDesignReviewHelperPath =
  "lib/research-candidate-review/manual-note-product-write-design-review.ts";
const productWriteDesignReviewFixturePath =
  "fixtures/research-candidate-review.manual-note-product-write-design-review.sample.v0.1.json";
const productWriteDesignReviewSmokePath =
  "scripts/smoke-research-candidate-product-write-design-review-v0-1.mjs";
const productWriteDesignReviewRunnerPath =
  "scripts/run-research-candidate-product-write-design-review-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";

for (const filePath of [
  helperPath,
  planFixturePath,
  abortFixturePath,
  runnerPath,
  productWriteDesignReviewHelperPath,
  productWriteDesignReviewFixturePath,
  productWriteDesignReviewSmokePath,
  productWriteDesignReviewRunnerPath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const planFixtureText = readFileSync(planFixturePath, "utf8");
const abortFixtureText = readFileSync(abortFixturePath, "utf8");
const planFixture = JSON.parse(planFixtureText);
const abortFixture = JSON.parse(abortFixtureText);
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const normalizedDocsIndex = docsIndex.replace(/\s+/g, " ");

assertHelperContract();
assertFixtureContract();
assertRunnerContract();
assertDocsPackageAndBrowserPointers();
assertNoRouteUiSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-disabled-write-adapter-transaction-plan-v0-1",
      helper_exists: true,
      fixtures_exist_and_parse: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      no_write_or_persistence_patterns_checked: true,
      abort_only_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_DISABLED_WRITE_ADAPTER_TRANSACTION_PLAN_VERSION",
    "manual_note_disabled_write_adapter_transaction_plan.v0.1",
    "MANUAL_NOTE_DISABLED_WRITE_ADAPTER_ABORT_RESULT_VERSION",
    "manual_note_disabled_write_adapter_abort_result.v0.1",
    "buildManualNoteDisabledWriteAdapterTransactionPlan",
    "buildManualNoteDisabledWriteAdapterAbortOnlyResult",
    "buildManualNoteDisabledWriteAdapterTransactionPlanMarkdown",
    "buildManualNoteDisabledWriteAdapterTransactionPlanJson",
    "buildManualNoteDisabledWriteAdapterAbortResultMarkdown",
    "buildManualNoteDisabledWriteAdapterAbortResultJson",
    "createManualNoteDisabledWriteAdapterTransactionPlanFingerprint",
    "createManualNoteDisabledWriteAdapterAbortResultFingerprint",
    "manual_note_disabled_write_adapter_transaction_plan",
    "manual_note_disabled_write_adapter_abort_result",
    "blocked_before_commit",
    "ready_for_abort_only_harness",
    "abort_only_non_product_harness",
    "aborted_before_product_write",
    "disabled-plan-op:",
    "temp-intent:",
    "commit_allowed: false",
    "product_write_allowed: false",
    "rollback_required_if_future_commit: true",
    "audit_required_if_future_commit: true",
    "product_db_write: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "external_handoff_sent: false",
    "durable_persistence: false",
    "browser_persistence: false",
    "disabled_transaction_plan_fixture_execution_tests",
    "0x811c9dc5",
    "0x01000193",
    'key !== "generated_at" && key !== "selected_at"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertFixtureContract() {
  assert.equal(
    planFixture.plan_kind,
    "manual_note_disabled_write_adapter_transaction_plan",
  );
  assert.equal(
    planFixture.plan_version,
    "manual_note_disabled_write_adapter_transaction_plan.v0.1",
  );
  assert.match(planFixture.plan_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.ok(
    ["blocked_before_commit", "ready_for_abort_only_harness"].includes(
      planFixture.plan_status,
    ),
  );
  assert.equal(
    planFixture.next_recommended_slice,
    "disabled_transaction_plan_fixture_execution_tests",
  );
  assert.equal(
    abortFixture.result_kind,
    "manual_note_disabled_write_adapter_abort_result",
  );
  assert.equal(
    abortFixture.result_version,
    "manual_note_disabled_write_adapter_abort_result.v0.1",
  );
  assert.match(abortFixture.result_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(abortFixture.execution_mode, "abort_only_non_product_harness");
  assert.equal(abortFixture.result_status, "aborted_before_product_write");
  assert.equal(
    abortFixture.source_transaction_plan_fingerprint,
    planFixture.plan_fingerprint,
  );
  assert.equal(
    abortFixture.next_recommended_slice,
    "disabled_transaction_plan_fixture_execution_tests",
  );

  const operations = Object.values(planFixture.operation_groups).flat();
  assert.ok(operations.length >= 5, "fixture should include all operation groups");
  for (const operation of operations) {
    assert.match(operation.operation_id, /^disabled-plan-op:/);
    assert.match(operation.source_temp_intent_id, /^temp-intent:/);
    assert.equal(operation.product_write_allowed, false);
    assert.equal(operation.commit_allowed, false);
    assert.equal(operation.rollback_required_if_future_commit, true);
    assert.equal(operation.audit_required_if_future_commit, true);
    assert.equal(operation.temp_harness_only, true);
    assertAllProductIdsNull(operation, operation.operation_id);
  }

  assert.equal(abortFixture.operation_results.length, operations.length);
  for (const operationResult of abortFixture.operation_results) {
    assert.match(operationResult.operation_id, /^disabled-plan-op:/);
    assert.equal(operationResult.status, "aborted_before_product_write");
    assert.equal(operationResult.product_write_attempted, false);
    assert.equal(operationResult.product_write_performed, false);
    assertAllProductIdsNull(operationResult, operationResult.operation_id);
  }

  assertBoundary(planFixture.execution_boundary, [
    "disabled_transaction_plan_only",
    "abort_only_harness",
  ]);
  assertBoundary(abortFixture.abort_boundary, ["abort_only"]);
  assert.equal(planFixture.local_copy_packet.local_clipboard_only, true);
  assert.equal(planFixture.local_copy_packet.external_handoff_sent, false);
  assert.equal(planFixture.local_copy_packet.packet_persisted, false);
  assert.equal(planFixture.local_copy_packet.actual_promotion_allowed, false);
  assert.equal(abortFixture.local_copy_packet.local_clipboard_only, true);
  assert.equal(abortFixture.local_copy_packet.external_handoff_sent, false);
  assert.equal(abortFixture.local_copy_packet.packet_persisted, false);
  assert.equal(abortFixture.local_copy_packet.actual_promotion_allowed, false);

  for (const text of [planFixtureText, abortFixtureText]) {
    assert.doesNotMatch(text, /https?:\/\//i);
    assert.doesNotMatch(text, /raw manual note|manual note raw text|verbatim manual note/i);
    assert.doesNotMatch(text, /\/tmp\/|\.db|sqlite/i);
  }
}

function assertRunnerContract() {
  for (const requiredText of [
    "/tmp/augnes-disabled-write-adapter-transaction-plan-v0-1",
    "report.json",
    "transaction-plan.json",
    "abort-result.json",
    "CONTRACT_TEST_REPORT_PATH",
    "contract_test_report_present",
    "ready_for_abort_only_harness",
    "blocked_before_commit",
    "aborted_before_product_write",
    "disabled-plan-op:",
    "temp-intent:",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  const writeFileLines = runner
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("await writeFile("));
  assert.deepEqual(writeFileLines, [
    "await writeFile(TRANSACTION_PLAN_PATH, `${JSON.stringify(transactionPlan, null, 2)}\\n`);",
    "await writeFile(ABORT_RESULT_PATH, `${JSON.stringify(abortResult, null, 2)}\\n`);",
    "await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\\n`);",
  ]);
  assert.doesNotMatch(runner, /readFile\([^)]*(db|sqlite|schema|migration)/i);
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-disabled-write-adapter-transaction-plan-v0-1"
    ],
    "node scripts/smoke-research-candidate-disabled-write-adapter-transaction-plan-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "plan:research-candidate-disabled-write-adapter-transaction-plan-v0-1"
    ],
    "node scripts/run-research-candidate-disabled-write-adapter-transaction-plan-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-product-write-design-review-v0-1"
    ],
    "node scripts/smoke-research-candidate-product-write-design-review-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "design:research-candidate-product-write-design-review-v0-1"
    ],
    "node scripts/run-research-candidate-product-write-design-review-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note disabled write adapter in-memory transaction plan",
    "Manual note first product-write design review",
    "abort-only non-product execution harness",
    "/tmp transaction-plan report runner",
    "static repo inventory",
    "candidate product write target groups",
    "smallest safe future write prototype",
    "/tmp design review report runner",
    productWriteDesignReviewHelperPath,
    "npm run smoke:research-candidate-product-write-design-review-v0-1",
    "npm run design:research-candidate-product-write-design-review-v0-1",
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
      normalizedDocsIndex.includes(requiredText),
      `docs must include ${requiredText}`,
    );
  }

  assert.ok(
    browserValidator.includes("transaction_plan_artifact_note"),
    "browser validator should include transaction plan artifact note",
  );
  assert.ok(
    browserValidator.includes("transaction_plan_fixture_only_no_browser_route"),
    "browser validator should assert no transaction plan route is called",
  );
  assert.ok(
    browserValidator.includes("product_write_design_review_artifact_note"),
    "browser validator should include product-write design review artifact note",
  );
  assert.ok(
    browserValidator.includes("product_write_design_review_no_browser_route"),
    "browser validator should assert no product-write design review route is called",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /transaction-plan|abort-result|disabled-write-adapter-transaction/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for transaction plan");

  const uiFiles = listFiles("components").filter((filePath) =>
    /transaction-plan|abort-result|disabled-write-adapter-transaction/i.test(
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
        '"smoke:research-candidate-disabled-write-adapter-transaction-plan-v0-1"',
      ) ||
      line.includes(
        '"plan:research-candidate-disabled-write-adapter-transaction-plan-v0-1"',
      ) ||
        line.includes(
          '"smoke:research-candidate-product-write-design-review-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-product-write-design-review-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-prototype-design-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-temp-db-single-claim-prototype-design-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-temp-db-single-claim-write-prototype-v0-1"',
        ) ||
        line.includes(
          '"harness:research-candidate-temp-db-single-claim-write-prototype-v0-1"',
        ),
      `package.json must only add the transaction-plan, product-write design-review, or temp DB single-claim design/harness scripts, not dependencies: ${line}`,
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

function assertAllProductIdsNull(value, label) {
  for (const key of [
    "product_record_id",
    "canonical_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "canonical_graph_edge_id",
    "work_item_id",
  ]) {
    assert.equal(value[key], null, `${label}.${key} must be null`);
  }
}

function assertBoundary(boundary, trueKeys) {
  for (const [key, value] of Object.entries(boundary)) {
    assert.equal(
      value,
      trueKeys.includes(key),
      `boundary flag ${key} must be ${String(trueKeys.includes(key))}`,
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
