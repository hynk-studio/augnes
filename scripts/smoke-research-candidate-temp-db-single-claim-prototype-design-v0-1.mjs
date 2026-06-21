import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-temp-db-single-claim-prototype-design.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-prototype-design.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs";
const writePrototypeHelperPath =
  "lib/research-candidate-review/manual-note-temp-db-single-claim-write-prototype-harness.ts";
const writePrototypeFixturePath =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-write-prototype-harness.sample.v0.1.json";
const writePrototypeRunnerPath =
  "scripts/run-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs";
const writePrototypeSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  writePrototypeHelperPath,
  writePrototypeFixturePath,
  writePrototypeRunnerPath,
  writePrototypeSmokePath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const runner = readFileSync(runnerPath, "utf8");
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const normalizedDocsIndex = docsIndex.replace(/\s+/g, " ");

assertHelperContract();
assertFixtureContract();
assertRunnerContract();
assertPrototypeStatusGateBinding();
assertDocsPackageAndBrowserPointers();
assertNoRouteUiSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-temp-db-single-claim-prototype-design-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      no_db_file_or_sql_execution_checked: true,
      prototype_status_gate_binding_checked: true,
      temp_db_single_claim_design_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_VERSION",
    "manual_note_temp_db_single_claim_prototype_design.v0.1",
    "buildManualNoteTempDbSingleClaimPrototypeDesign",
    "buildManualNoteTempDbSingleClaimPrototypeDesignMarkdown",
    "buildManualNoteTempDbSingleClaimPrototypeDesignJson",
    "createManualNoteTempDbSingleClaimPrototypeDesignFingerprint",
    "manual_note_temp_db_single_claim_prototype_design",
    "design_only_ready_for_temp_execution_spec",
    "blocked_by_missing_single_claim_operation",
    "blocked_by_source_design_gap",
    "single_claim_candidate_fixture_write_dry_run",
    "first_claim_operation_from_disabled_transaction_plan_fixture",
    "temp_claim_records",
    "temp_idempotency_records",
    "temp_rollback_records",
    "temp_review_audit_records",
    "temp_db_file_created_now: false",
    "created_in_temp_db_now: false",
    "product_db_write: false",
    "product_ids_created: false",
    "executable_sql_included: false",
    "sql_executed_now: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "external_handoff_sent: false",
    "durable_persistence: false",
    "browser_persistence: false",
    "temp_db_single_claim_write_prototype_harness",
    "0x811c9dc5",
    "0x01000193",
    'key !== "generated_at" && key !== "local_copy_packet"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertFixtureContract() {
  assert.equal(
    fixture.design_kind,
    "manual_note_temp_db_single_claim_prototype_design",
  );
  assert.equal(
    fixture.design_version,
    "manual_note_temp_db_single_claim_prototype_design.v0.1",
  );
  assert.match(fixture.design_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    fixture.prototype_status,
    "design_only_ready_for_temp_execution_spec",
  );
  assert.equal(
    fixture.next_recommended_slice,
    "temp_db_single_claim_write_prototype_harness",
  );
  assert.equal(
    fixture.selected_claim_operation.operation_id,
    "disabled-plan-op:claim:001",
  );
  assert.equal(
    fixture.selected_claim_operation.source_temp_intent_id,
    "temp-intent:claim:001",
  );
  assert.equal(fixture.selected_claim_operation.product_record_id, null);
  assert.equal(fixture.selected_claim_operation.product_write_allowed_now, false);
  assert.equal(fixture.selected_claim_operation.temp_write_executed_now, false);

  assert.equal(fixture.temp_db_design.temp_db_only, true);
  assert.equal(fixture.temp_db_design.temp_db_file_created_now, false);
  assert.equal(
    fixture.temp_db_design.future_temp_db_path_pattern,
    "/tmp/augnes-single-claim-write-prototype-v0-1/*.sqlite",
  );
  assert.equal(fixture.temp_db_design.product_db_allowed, false);
  assert.deepEqual(fixture.temp_db_design.schema_objects, [
    "temp_claim_records",
    "temp_idempotency_records",
    "temp_rollback_records",
    "temp_review_audit_records",
  ]);
  assert.equal(fixture.temp_db_design.executable_sql_included, false);
  assert.equal(fixture.temp_db_design.sql_executed_now, false);
  for (const definition of fixture.temp_db_design.schema_object_definitions) {
    assert.equal(definition.product_table_mirror, false);
    assert.equal(definition.migration_required_now, false);
    assert.equal(definition.repo_schema_changed_now, false);
    assert.ok(Array.isArray(definition.required_fields));
    assert.ok(Array.isArray(definition.forbidden_fields));
  }

  assert.equal(
    fixture.temp_claim_write_shape.temp_claim_record_kind,
    "manual_note_single_claim_temp_record",
  );
  assert.equal(
    fixture.temp_claim_write_shape.claim_candidate_text_source,
    "fixture_operation_metadata_only",
  );
  assert.equal(fixture.temp_claim_write_shape.raw_manual_note_text_included, false);
  assert.equal(fixture.temp_claim_write_shape.created_in_product_db, false);
  assert.equal(fixture.temp_claim_write_shape.created_in_temp_db_now, false);
  for (const key of [
    "product_claim_id",
    "canonical_claim_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
  ]) {
    assert.equal(fixture.temp_claim_write_shape[key], null, `${key} must be null`);
  }

  assert.equal(fixture.temp_idempotency_design.required, true);
  assert.equal(
    fixture.temp_idempotency_design.idempotency_key_kind,
    "temp_db_single_claim_only",
  );
  assert.equal(fixture.temp_idempotency_design.storage_created_now, false);
  assert.equal(
    fixture.temp_idempotency_design.product_idempotency_storage_created_now,
    false,
  );
  assert.equal(fixture.temp_rollback_design.required, true);
  assert.equal(
    fixture.temp_rollback_design.rollback_strategy,
    "delete_temp_claim_record_by_temp_idempotency_key",
  );
  assert.equal(fixture.temp_rollback_design.rollback_executed_now, false);
  assert.equal(fixture.temp_rollback_design.product_rollback_performed_now, false);
  assert.equal(fixture.temp_review_audit_design.required, true);
  assert.equal(fixture.temp_review_audit_design.records_operator_decision, false);
  assert.equal(
    fixture.temp_review_audit_design.records_prototype_design_inputs,
    true,
  );
  assert.equal(fixture.temp_review_audit_design.audit_record_created_now, false);
  assert.equal(
    fixture.temp_review_audit_design.product_audit_record_created_now,
    false,
  );
  assert.equal(
    fixture.source_evidence_authority_gap.source_fetching_performed_now,
    false,
  );
  assert.equal(
    fixture.source_evidence_authority_gap.source_verification_performed_now,
    false,
  );
  assert.equal(
    fixture.source_evidence_authority_gap.proof_evidence_write_authority_present,
    false,
  );

  for (const requiredGate of [
    "contract_test_report_passed",
    "transaction_plan_ready_for_abort_only_harness",
    "abort_result_aborted_before_product_write",
    "product_write_design_review_present",
    "exactly_one_claim_operation_selected",
    "temp_db_path_is_under_tmp",
    "product_db_path_absent",
    "raw_manual_note_text_absent",
    "no_provider_retrieval_source_fetch",
    "no_external_handoff",
  ]) {
    assert.ok(
      fixture.required_gates_before_temp_execution.includes(requiredGate),
      `fixture must include gate ${requiredGate}`,
    );
    assert.ok(
      fixture.gates_status.some(
        (gate) => gate.gate_id === requiredGate && gate.status === "pass",
      ),
      `fixture gate ${requiredGate} must pass`,
    );
  }
  assert.equal(
    fixture.future_temp_execution_harness_spec.runner_name,
    "run-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs",
  );
  assertBoundary(fixture.product_write_boundary);
  assert.equal(fixture.local_copy_packet.local_clipboard_only, true);
  assert.equal(fixture.local_copy_packet.external_handoff_sent, false);
  assert.equal(fixture.local_copy_packet.packet_persisted, false);
  assert.equal(fixture.local_copy_packet.product_write_authority_granted, false);
  assert.equal(fixture.local_copy_packet.actual_promotion_allowed, false);

  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /raw manual note|manual note raw text|verbatim manual note/i,
  );
  assertNoExecutableSqlStrings("fixture", fixtureText);
  assertNoNonNullProductIds(fixture);
}

function assertRunnerContract() {
  for (const requiredText of [
    "/tmp/augnes-temp-db-single-claim-prototype-design-v0-1",
    "report.json",
    "temp-db-single-claim-prototype-design.json",
    "PRODUCT_WRITE_DESIGN_REVIEW_FIXTURE_PATH",
    "TRANSACTION_PLAN_FIXTURE_PATH",
    "ABORT_RESULT_FIXTURE_PATH",
    "PRODUCT_WRITE_DESIGN_REVIEW_REPORT_PATH",
    "TRANSACTION_PLAN_REPORT_PATH",
    "CONTRACT_TEST_REPORT_PATH",
    "temp_db_single_claim_prototype_design_report",
    "prototype_status",
    "design_only_ready_for_temp_execution_spec",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  const writeFileLines = runner
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("await writeFile("));
  assert.deepEqual(writeFileLines, [
    "await writeFile(DESIGN_PATH, `${JSON.stringify(design, null, 2)}\\n`);",
    "await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\\n`);",
  ]);
  assert.doesNotMatch(
    runner,
    /writeFile\([^)]*\.(sqlite|db)/i,
    "runner must not create sqlite/db files",
  );
}

function assertPrototypeStatusGateBinding() {
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
  ]) {
    const normalizedText = text.replace(/\s+/g, " ");
    assert.ok(
      normalizedText.includes("derivePrototypeStatus({ gatesStatus: gates") ||
        normalizedText.includes("derivePrototypeStatus({ gatesStatus,"),
      `${label} must pass built gates into derivePrototypeStatus`,
    );
    assert.ok(
      text.includes(
        'gatesStatus.every((gateStatus) => gateStatus.status === "pass")',
      ),
      `${label} must require every readiness gate to pass before ready status`,
    );
    assert.ok(
      text.includes("claimOperations.length === 0"),
      `${label} must keep the missing single-claim status`,
    );
    assert.ok(
      text.includes("claimOperations.length > 1"),
      `${label} must block ambiguous multi-claim selections`,
    );
    for (const gateId of [
      "contract_test_report_passed",
      "transaction_plan_ready_for_abort_only_harness",
      "abort_result_aborted_before_product_write",
      "product_write_design_review_present",
      "exactly_one_claim_operation_selected",
    ]) {
      assert.ok(
        text.includes(gateId),
        `${label} must keep readiness gate ${gateId}`,
      );
    }
  }
  assert.ok(
    runner.includes("Array.isArray(design.gates_status)"),
    "runner validateReport must require gates_status to exist",
  );
  assert.ok(
    runner.includes(
      'design.gates_status.every((gateStatus) => gateStatus.status === "pass")',
    ),
    "runner validateReport must require all gates to pass",
  );
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-temp-db-single-claim-prototype-design-v0-1"
    ],
    "node scripts/smoke-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "design:research-candidate-temp-db-single-claim-prototype-design-v0-1"
    ],
    "node scripts/run-research-candidate-temp-db-single-claim-prototype-design-v0-1.mjs",
  );
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
    "Manual note temp DB single-claim write prototype design",
    "Manual note temp DB single-claim write prototype harness",
    "first claim operation",
    "structured temp schema design objects",
    "idempotency/rollback/audit/source-authority gates",
    "future temp DB execution harness spec",
    "creates one `/tmp` DB file",
    "temp-only schema objects",
    "exactly one temp claim",
    "row counts",
    "/tmp design report runner",
    "no temp DB execution yet",
    "no DB file creation",
    "no SQL execution",
    "no executable SQL strings",
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
    browserValidator.includes(
      "temp_db_single_claim_prototype_design_artifact_note",
    ),
    "browser validator should include temp DB single-claim prototype design artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_prototype_design_no_browser_route",
    ),
    "browser validator should assert no temp DB single-claim prototype design route is called",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_write_prototype_artifact_note",
    ),
    "browser validator should include temp DB single-claim write prototype artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "temp_db_single_claim_write_prototype_no_browser_route",
    ),
    "browser validator should assert no temp DB single-claim write prototype route is called",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /temp-db-single-claim|single-claim-prototype|claim-write-prototype/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for this design");

  const uiFiles = listFiles("components").filter((filePath) =>
    /temp-db-single-claim|single-claim-prototype|claim-write-prototype/i.test(
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
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-gate-design-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-single-claim-product-write-gate-design-v0-1"',
        ),
      `package.json must only add temp DB single-claim design or write prototype scripts, not dependencies: ${line}`,
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
    assertNoExecutableSqlStrings(label, text);
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

function assertBoundary(boundary) {
  assert.equal(boundary.design_only, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "design_only") continue;
    assert.equal(value, false, `boundary flag ${key} must be false`);
  }
}

function assertNoExecutableSqlStrings(label, text) {
  assert.doesNotMatch(
    text,
    /\b(CREATE\s+TABLE|INSERT|UPDATE|DELETE|ALTER\s+TABLE|DROP\s+TABLE)\b/,
    `${label} must not contain executable SQL strings`,
  );
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
