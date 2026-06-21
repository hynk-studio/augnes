import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-bridge-design.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs";
const productWriteGateSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const productWriteGateDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const artifactDir =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1";
const artifactReportPath = path.join(artifactDir, "report.json");
const optionalProductWriteGateDesignReportPath =
  "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json";
const forbiddenSurfaceKeys = [
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "product_db_write",
  "product_id_allocation",
  "sql_execution",
  "db_open",
  "schema_or_migration_change",
  "route_added",
  "ui_write_action_added",
  "adapter_enabled",
];

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  productWriteGateDesignFixturePath,
  productWriteGateSmokePath,
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
const productWriteGateDesignFixture = JSON.parse(
  readFileSync(productWriteGateDesignFixturePath, "utf8"),
);
const productWriteGateSmoke = readFileSync(productWriteGateSmokePath, "utf8");
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
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

assertHelperContract();
assertRunnerContract();
assertFixtureContract();
assertBlockedUpstreamGateDesignMutation();
assertDocsPackageAndBrowserPointers();
assertNoRouteUiSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-temp-to-product-bridge-design-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      runner_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      browser_artifact_note_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      no_db_open_or_sql_execution_checked: true,
      blocked_upstream_gate_mutation_checked: true,
      forbidden_surfaces_checked: forbiddenSurfaceKeys.length,
      product_ids_null_checked: true,
      next_slice_checked:
        "single_claim_temp_to_product_disabled_bridge_skeleton",
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_VERSION",
    "manual_note_single_claim_temp_to_product_bridge_design.v0.1",
    "buildManualNoteSingleClaimTempToProductBridgeDesign",
    "buildManualNoteSingleClaimTempToProductBridgeDesignMarkdown",
    "buildManualNoteSingleClaimTempToProductBridgeDesignJson",
    "createManualNoteSingleClaimTempToProductBridgeDesignFingerprint",
    "bridge_input_contract",
    "future_product_claim_draft",
    "future_product_idempotency_design",
    "future_product_rollback_design",
    "future_product_audit_design",
    "explicit_forbidden_surfaces",
    "single_claim_bridge_design_only",
    "ready_for_disabled_bridge_skeleton",
    "blocked_before_disabled_bridge_skeleton",
    "deriveBridgeRecommendationStatus",
    "single_claim_temp_to_product_disabled_bridge_skeleton",
    "blocked_until_explicit_operator_decision_contract",
    "blocked_until_operator_and_schema_contract",
    "blocked_until_product_idempotency_storage_contract",
    "blocked_until_product_rollback_storage_contract",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertRunnerContract() {
  for (const requiredText of [
    artifactDir,
    "PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH",
    "TEMP_DB_HARNESS_FIXTURE_PATH",
    "TEMP_RESULT_REVIEW_FIXTURE_PATH",
    "TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH",
    "OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH",
    "OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH",
    "OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH",
    "OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH",
    "OPTIONAL_BROWSER_REPORT_PATH",
    "temp-to-product-bridge-design.json",
    "report.json",
    "validateDesign",
    "upstream_product_write_gate_design_not_ready",
    "bridge_recommendation_status_not_ready",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.ok(
    runner.includes("await rm(ARTIFACT_DIR, { recursive: true, force: true })"),
    "runner must recreate only the temp-to-product bridge-design artifact directory",
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
    "manual_note_single_claim_temp_to_product_bridge_design",
  );
  assert.equal(
    fixture.design_version,
    "manual_note_single_claim_temp_to_product_bridge_design.v0.1",
  );
  assert.match(fixture.design_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    fixture.bridge_design_status,
    "single_claim_bridge_design_only",
  );
  assert.equal(fixture.bridge_execution_allowed_now, false);
  assert.equal(fixture.product_write_allowed_now, false);
  assert.equal(
    fixture.recommendation_status,
    "ready_for_disabled_bridge_skeleton",
  );
  assert.equal(
    fixture.next_recommended_slice,
    "single_claim_temp_to_product_disabled_bridge_skeleton",
  );
  assert.equal(fixture.source_evidence.source_boundary_preserved, true);
  assert.equal(
    fixture.source_evidence.product_write_gate_design.next_recommended_slice,
    "single_claim_temp_to_product_bridge_design",
  );
  assert.equal(
    fixture.source_evidence.temp_db_write_harness.selected_temp_claim_record_id,
    "temp-claim:aa03dfea",
  );
  assert.equal(
    fixture.bridge_input_contract.selected_temp_claim_record_id,
    "temp-claim:aa03dfea",
  );
  assert.equal(
    fixture.bridge_input_contract.source_operation_id,
    "disabled-plan-op:claim:001",
  );
  assert.equal(
    fixture.bridge_input_contract.source_temp_intent_id,
    "temp-intent:claim:001",
  );
  assert.equal(
    fixture.bridge_input_contract.temp_idempotency_key,
    "temp-idempotency:d2caa29d",
  );
  assert.equal(
    fixture.bridge_input_contract.operator_decision_status,
    "blocked_until_explicit_operator_decision_contract",
  );
  assert.equal(
    fixture.future_product_claim_draft.candidate_kind,
    "manual_note_single_claim",
  );
  assert.equal(fixture.future_product_claim_draft.product_claim_id, null);
  assert.equal(
    fixture.future_product_claim_draft.product_claim_id_allocation_status,
    "blocked_until_operator_and_schema_contract",
  );
  assert.equal(
    fixture.future_product_claim_draft.raw_manual_note_text_included,
    false,
  );
  assert.equal(
    fixture.future_product_idempotency_design.storage_status,
    "blocked_until_product_idempotency_storage_contract",
  );
  assert.equal(
    fixture.future_product_idempotency_design.product_idempotency_record_id,
    null,
  );
  assert.equal(
    fixture.future_product_idempotency_design.idempotency_write_executed_now,
    false,
  );
  assert.equal(
    fixture.future_product_rollback_design.strategy,
    "delete_or_mark_product_claim_by_idempotency_key",
  );
  assert.equal(
    fixture.future_product_rollback_design.rollback_storage_status,
    "blocked_until_product_rollback_storage_contract",
  );
  assert.equal(fixture.future_product_rollback_design.rollback_executed_now, false);
  assert.equal(fixture.future_product_rollback_design.product_rollback_record_id, null);
  assert.equal(
    fixture.future_product_audit_design.records_operator_decision,
    "required_later",
  );
  assert.equal(fixture.future_product_audit_design.records_gate_evidence, true);
  assert.equal(
    fixture.future_product_audit_design.records_bridge_design_inputs,
    true,
  );
  assert.equal(fixture.future_product_audit_design.product_audit_record_id, null);
  assert.equal(fixture.future_product_audit_design.audit_write_executed_now, false);
  assertForbiddenSurfaces(fixture.explicit_forbidden_surfaces);
  assertNoNonNullProductIds(fixture);
  assert.equal(fixture.local_copy_packet.product_write_authority_granted, false);
  assert.equal(fixture.local_copy_packet.bridge_execution_allowed_now, false);
  assert.equal(fixture.local_copy_packet.product_write_allowed_now, false);
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /manual note raw text|verbatim manual note|raw note body/i,
  );
}

function assertBlockedUpstreamGateDesignMutation() {
  const originalReportExists = existsSync(optionalProductWriteGateDesignReportPath);
  const originalReportText = originalReportExists
    ? readFileSync(optionalProductWriteGateDesignReportPath, "utf8")
    : null;
  const blockedGateDesign = JSON.parse(
    JSON.stringify(productWriteGateDesignFixture),
  );
  blockedGateDesign.next_stage_recommendation.recommendation_status =
    "blocked_before_bridge_design";
  mkdirSync(path.dirname(optionalProductWriteGateDesignReportPath), {
    recursive: true,
  });
  writeFileSync(
    optionalProductWriteGateDesignReportPath,
    `${JSON.stringify(
      {
        report_kind:
          "manual_note_single_claim_product_write_gate_design_report_negative_smoke_fixture",
        final_status: "fail",
        product_write_gate_design: blockedGateDesign,
      },
      null,
      2,
    )}\n`,
  );

  try {
    let failedAsExpected = false;
    try {
      execSync(
        "node scripts/run-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
        { encoding: "utf8", stdio: "pipe" },
      );
    } catch (error) {
      failedAsExpected = true;
      assert.equal(error.status, 1, "blocked upstream runner exit status must be 1");
    }
    assert.equal(
      failedAsExpected,
      true,
      "runner must fail when upstream product-write gate design is blocked",
    );
    const blockedReport = JSON.parse(readFileSync(artifactReportPath, "utf8"));
    const blockedDesign = blockedReport.temp_to_product_bridge_design;
    assert.equal(blockedReport.final_status, "fail");
    assert.equal(blockedReport.bridge_validation.passed, false);
    assert.ok(
      blockedReport.bridge_validation.failures.includes(
        "upstream_product_write_gate_design_not_ready",
      ),
      "blocked validation must include upstream not-ready failure",
    );
    assert.ok(
      blockedReport.bridge_validation.failures.includes(
        "bridge_recommendation_status_not_ready",
      ),
      "blocked validation must include bridge recommendation failure",
    );
    assert.equal(
      blockedDesign.source_evidence.product_write_gate_design.recommendation_status,
      "blocked_before_bridge_design",
    );
    assert.equal(
      blockedDesign.recommendation_status,
      "blocked_before_disabled_bridge_skeleton",
    );
    assert.notEqual(
      blockedDesign.recommendation_status,
      "ready_for_disabled_bridge_skeleton",
    );
    assert.equal(blockedDesign.bridge_execution_allowed_now, false);
    assert.equal(blockedDesign.product_write_allowed_now, false);
    assertForbiddenSurfaces(blockedDesign.explicit_forbidden_surfaces);
    assertNoNonNullProductIds(blockedDesign, "blockedDesign");
  } finally {
    if (originalReportExists && originalReportText !== null) {
      writeFileSync(optionalProductWriteGateDesignReportPath, originalReportText);
    } else {
      rmSync(optionalProductWriteGateDesignReportPath, { force: true });
    }
  }
}

function assertDocsPackageAndBrowserPointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-bridge-design-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "design:research-candidate-single-claim-temp-to-product-bridge-design-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "design:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "plan:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "harness:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  );
  for (const requiredText of [
    "Manual note single-claim temp-to-product bridge design",
    "Manual note single-claim product write disabled adapter contract tests",
    "Manual note single-claim product write disabled adapter dry-run invocation harness",
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction plan",
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction harness",
    "maps the existing temp DB single-claim evidence chain",
    "disabled dry-run transaction plan only",
    "disabled dry-run transaction harness only",
    "future product claim draft",
    "idempotency mapping",
    "rollback mapping",
    "audit mapping",
    "operator decision placeholder",
    "design-only bridge artifact",
    "ready_for_disabled_bridge_skeleton",
    "single_claim_temp_to_product_disabled_bridge_skeleton",
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan",
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness",
    "single_claim_product_write_authority_contract_bundle",
    "does not open DB",
    "does not execute SQL",
    "no product DB write",
    "no product ID allocation",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no route",
    "no UI write action",
    "no enabled adapter",
    "no repo schema/migration/dependency",
    "best available method",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes("single_claim_temp_to_product_bridge_design_artifact_note"),
    "browser validator should include single-claim temp-to-product bridge design artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_bridge_design_no_browser_route",
    ),
    "browser validator should assert no temp-to-product bridge design browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_skeleton_artifact_note",
    ),
    "browser validator should include disabled bridge skeleton artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_skeleton_no_browser_route",
    ),
    "browser validator should assert no disabled bridge skeleton browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_artifact_note",
    ),
    "browser validator should include disabled bridge dry-run transaction-plan artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_no_browser_route",
    ),
    "browser validator should assert no disabled bridge dry-run transaction-plan browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note",
    ),
    "browser validator should include disabled bridge dry-run transaction-harness artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_no_browser_route",
    ),
    "browser validator should assert no disabled bridge dry-run transaction-harness browser route",
  );
  assert.ok(
    productWriteGateSmoke.includes(
      "smoke:research-candidate-single-claim-temp-to-product-bridge-design-v0-1",
    ),
    "product write gate smoke should allow the bridge design smoke script",
  );
  assert.ok(
    productWriteGateSmoke.includes(
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1",
    ),
    "product write gate smoke should allow the disabled bridge skeleton smoke script",
  );
  assert.ok(
    productWriteGateSmoke.includes(
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
    ),
    "product write gate smoke should allow the disabled bridge skeleton contract smoke script",
  );
  assert.ok(
    productWriteGateSmoke.includes(
      "contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
    ),
    "product write gate smoke should allow the disabled bridge skeleton contract runner script",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-temp-to-product|temp-to-product-bridge/i.test(filePath),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for bridge design");

  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-temp-to-product|temp-to-product-bridge/i.test(filePath),
  );
  assert.deepEqual(uiFiles, [], "no UI component should be added for this slice");

  const changedFiles = new Set(readGitChangedFiles());
  for (const filePath of changedFiles) {
    const isDisabledBridgeSkeletonContractTestFile =
      /single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests|disabled-bridge-skeleton-contract-test-cases/i.test(
        filePath,
      );
    assert.ok(
      !/(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) && !/^lib\/db(\.ts|\/)/.test(filePath),
      `schema or migration file must not be changed: ${filePath}`,
    );
    assert.ok(
      isDisabledBridgeSkeletonContractTestFile ||
        !/(gate-review|gate-result-review|gate-contract-test|bridge-readiness-audit|closeout-only)/i.test(
        filePath,
        ),
      `this slice must not add another gate-review/result/contract/closeout layer: ${filePath}`,
    );
  }

  const packageDiff = readCommand("git diff -- package.json");
  const addedPackageLines = packageDiff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  for (const line of addedPackageLines) {
    assert.ok(
      line.includes(
        '"smoke:research-candidate-single-claim-temp-to-product-bridge-design-v0-1"',
      ) ||
        line.includes(
          '"design:research-candidate-single-claim-temp-to-product-bridge-design-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1"',
        ) ||
        line.includes(
          '"design:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1"',
        ) ||
        line.includes(
          '"plan:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1"',
        ) ||
        line.includes(
          '"harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1"',
        ) ||
        line.includes(
          '"authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1"',
        ) ||
        line.includes(
          '"adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1"',
        ) ||
        line.includes(
          '"harness:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1"',
        ) ||
        line.includes(
          '"report:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1"',
        ) ||
        line.includes(
          '"smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1"',
        ) ||
        line.includes(
          '"contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1"',
        ),
      `package.json must only add temp-to-product bridge design, disabled bridge skeleton, dry-run harness, authority bundle, disabled adapter skeleton, disabled adapter contract-test, disabled adapter dry-run invocation harness, no-op report, or preflight envelope contract-test scripts, not dependencies: ${line}`,
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

function assertForbiddenSurfaces(surfaces) {
  for (const key of forbiddenSurfaceKeys) {
    assert.equal(surfaces[key], false, `forbidden surface ${key} must be false`);
  }
  for (const [key, value] of Object.entries(surfaces)) {
    assert.equal(value, false, `forbidden surface ${key} must be false`);
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
        "product_rollback_record_id",
        "product_audit_record_id",
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
