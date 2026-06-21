import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-product-write-gate-design.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const resultContractSmokePath =
  "scripts/smoke-research-candidate-temp-db-single-claim-result-contract-tests-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const artifactDir = "/tmp/augnes-single-claim-product-write-gate-design-v0-1";
const requiredGateIds = [
  "temp_db_write_harness_passed",
  "temp_result_review_non_blocking",
  "temp_result_contract_tests_passed",
  "browser_observed_no_external_or_forbidden_requests",
  "explicit_operator_decision_contract_present",
  "selected_claim_identity_contract_present",
  "product_claim_schema_contract_present",
  "product_claim_id_allocation_contract_present",
  "product_idempotency_storage_contract_present",
  "product_rollback_storage_contract_present",
  "product_review_audit_record_contract_present",
  "source_verification_authority_present",
  "proof_evidence_authority_present",
  "canonical_perspective_authority_present",
  "enabled_adapter_transition_contract_present",
  "product_write_route_contract_present",
  "product_boundary_preserved",
  "product_write_observability_contract_present",
];
const authorityBlockGateIds = new Set([
  "explicit_operator_decision_contract_present",
  "product_claim_schema_contract_present",
  "product_claim_id_allocation_contract_present",
  "product_idempotency_storage_contract_present",
  "product_rollback_storage_contract_present",
  "product_review_audit_record_contract_present",
  "source_verification_authority_present",
  "proof_evidence_authority_present",
  "canonical_perspective_authority_present",
  "enabled_adapter_transition_contract_present",
  "product_write_route_contract_present",
  "product_write_observability_contract_present",
]);

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  resultContractSmokePath,
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
const resultContractSmoke = readFileSync(resultContractSmokePath, "utf8");
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
      smoke: "research-candidate-single-claim-product-write-gate-design-v0-1",
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
      required_gate_ids_checked: requiredGateIds.length,
      product_authority_blocks_checked: authorityBlockGateIds.size,
      product_write_gate_design_boundaries_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_VERSION",
    "manual_note_single_claim_product_write_gate_design.v0.1",
    "buildManualNoteSingleClaimProductWriteGateDesign",
    "buildManualNoteSingleClaimProductWriteGateDesignMarkdown",
    "buildManualNoteSingleClaimProductWriteGateDesignJson",
    "createManualNoteSingleClaimProductWriteGateDesignFingerprint",
    "product_write_gate_design_only",
    "ready_for_single_claim_bridge_design",
    "single_claim_temp_to_product_bridge_design",
    "AUTHORITY_BLOCK_GATE_IDS",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertRunnerContract() {
  for (const requiredText of [
    artifactDir,
    "PRODUCT_WRITE_DESIGN_REVIEW_FIXTURE_PATH",
    "TEMP_DB_HARNESS_FIXTURE_PATH",
    "TEMP_RESULT_REVIEW_FIXTURE_PATH",
    "TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH",
    "OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH",
    "OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH",
    "OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH",
    "OPTIONAL_BROWSER_REPORT_PATH",
    "product-write-gate-design.json",
    "report.json",
    "validateDesign",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.ok(
    runner.includes("await rm(ARTIFACT_DIR, { recursive: true, force: true })"),
    "runner must recreate only the product write gate-design artifact directory",
  );
  assert.ok(
    runner.includes("await writeFile(DESIGN_PATH") &&
      runner.includes("await writeFile(REPORT_PATH"),
    "runner must write design and report artifacts",
  );
  assert.doesNotMatch(
    runner,
    /\b(readFile|open|connect|exec|prepare)\s*\([^)]*\.sqlite/i,
    "runner must not open SQLite files",
  );
}

function assertFixtureContract() {
  assert.equal(
    fixture.design_kind,
    "manual_note_single_claim_product_write_gate_design",
  );
  assert.equal(
    fixture.design_version,
    "manual_note_single_claim_product_write_gate_design.v0.1",
  );
  assert.match(fixture.design_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(fixture.gate_design_status, "product_write_gate_design_only");
  assert.equal(
    fixture.next_stage_recommendation.recommendation_status,
    "ready_for_single_claim_bridge_design",
  );
  assert.equal(fixture.next_recommended_slice, "single_claim_temp_to_product_bridge_design");
  const gates = fixture.product_write_gate_results;
  assert.equal(gates.length, requiredGateIds.length);
  const gateIds = new Set(gates.map((gate) => gate.gate_id));
  for (const gateId of requiredGateIds) {
    assert.ok(gateIds.has(gateId), `fixture must include gate ${gateId}`);
  }
  for (const gate of gates) {
    assert.equal(gate.product_write_allowed_now, false);
    if (authorityBlockGateIds.has(gate.gate_id)) {
      assert.equal(gate.status, "block", `${gate.gate_id} must block`);
    }
  }
  assert.equal(findGate("product_boundary_preserved").status, "pass");
  assert.equal(findGate("temp_db_write_harness_passed").status, "pass");
  assert.equal(findGate("selected_claim_identity_contract_present").status, "pass");
  assert.equal(findGate("temp_result_review_non_blocking").status, "warn");
  assert.equal(findGate("temp_result_contract_tests_passed").status, "warn");
  assert.equal(
    findGate("browser_observed_no_external_or_forbidden_requests").status,
    "warn",
  );
  assert.equal(fixture.gate_summary.pass_count, 3);
  assert.equal(fixture.gate_summary.warn_count, 3);
  assert.equal(fixture.gate_summary.block_count, 12);
  assert.deepEqual(fixture.gate_summary.block_gate_ids.sort(), [
    ...authorityBlockGateIds,
  ].sort());
  assert.equal(
    fixture.smallest_future_bridge_design_scope.bridge_name,
    "single_claim_temp_to_product_bridge_design",
  );
  assert.equal(fixture.smallest_future_bridge_design_scope.claim_only, true);
  assert.equal(
    fixture.smallest_future_bridge_design_scope.one_selected_claim_candidate_only,
    true,
  );
  assertBoundary(fixture.product_write_boundary);
  assertNoNonNullProductIds(fixture);
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /manual note raw text|verbatim manual note|raw note body|RAW_MANUAL_NOTE/i,
  );
}

function assertDocsPackageAndBrowserPointers() {
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
    "Manual note single-claim product write gate design",
    "consumes temp DB result contract evidence",
    "defines product-write authority gates",
    "intentionally block product write",
    "single-claim temp-to-product bridge design",
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
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes("single_claim_product_write_gate_design_artifact_note"),
    "browser validator should include single-claim product write gate design artifact note",
  );
  assert.ok(
    browserValidator.includes("single_claim_product_write_gate_design_no_browser_route"),
    "browser validator should assert no product write gate design browser route",
  );
  assert.ok(
    resultContractSmoke.includes(
      "smoke:research-candidate-single-claim-product-write-gate-design-v0-1",
    ),
    "result contract smoke should point to product write gate design smoke",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-product-write-gate|product-write-gate-design/i.test(filePath),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for gate design");

  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-product-write-gate|product-write-gate-design/i.test(filePath),
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
        '"smoke:research-candidate-single-claim-product-write-gate-design-v0-1"',
      ) ||
        line.includes(
          '"design:research-candidate-single-claim-product-write-gate-design-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-temp-to-product-bridge-design-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-single-claim-temp-to-product-bridge-design-v0-1"',
        ),
      `package.json must only add product write gate-design or temp-to-product bridge design scripts, not dependencies: ${line}`,
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

function findGate(gateId) {
  const gate = fixture.product_write_gate_results.find(
    (candidate) => candidate.gate_id === gateId,
  );
  assert.ok(gate, `fixture must include ${gateId}`);
  return gate;
}

function assertBoundary(boundary) {
  assert.equal(boundary.gate_design_only, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "gate_design_only") continue;
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
