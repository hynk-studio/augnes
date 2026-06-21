import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
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
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs";
const bridgeDesignSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs";
const bridgeDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const artifactDir =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1";
const artifactReportPath = path.join(artifactDir, "report.json");
const optionalBridgeDesignReportPath =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";
const forbiddenSurfaceKeys = [
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "sql_execution",
  "db_open",
  "schema_or_migration_change",
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "browser_persistence",
  "ui_write_action",
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
  "product_rollback_record_id",
  "product_audit_record_id",
  "audit_record_product_id",
];

for (const filePath of [
  helperPath,
  fixturePath,
  runnerPath,
  bridgeDesignFixturePath,
  bridgeDesignSmokePath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
  tsxPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const bridgeDesignFixture = JSON.parse(readFileSync(bridgeDesignFixturePath, "utf8"));
const bridgeDesignSmoke = readFileSync(bridgeDesignSmokePath, "utf8");
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const browserValidator = readFileSync(browserValidatorPath, "utf8");

assertHelperContract();
assertRunnerContract();
assertFixtureContract();
assertExportedHelperSourceForbiddenSurfaceMutation();
assertExportedHelperSourceProductIdMutation();
assertRunnerFixtureMode();
assertBlockedBridgeDesignMutation();
assertFailedBridgeDesignReportWithReadyNestedMutation();
assertSourceForbiddenSurfaceMutation();
assertSourceProductIdMutation();
assertAdapterEnabledMutation();
assertProductIdMutation();
assertDocsPackageAndBrowserPointers();
assertNoRouteUiSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      runner_exists: true,
      exported_helper_source_forbidden_surface_mutation_checked: true,
      exported_helper_source_product_id_mutation_checked: true,
      runner_fixture_mode_checked: true,
      blocked_bridge_design_mutation_checked: true,
      failed_bridge_design_report_ready_nested_mutation_checked: true,
      source_forbidden_surface_mutation_checked: true,
      source_product_id_mutation_checked: true,
      adapter_enabled_mutation_checked: true,
      product_id_mutation_checked: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      browser_artifact_note_checked: true,
      no_new_api_route_checked: true,
      no_ui_component_added: true,
      no_schema_migration_changes_checked: true,
      no_dependency_addition_checked: true,
      no_db_open_or_sql_execution_checked: true,
      forbidden_surfaces_checked: forbiddenSurfaceKeys.length,
      product_ids_null_checked: true,
      next_slice_checked:
        "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_VERSION",
    "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton.v0.1",
    "buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton",
    "buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonMarkdown",
    "buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonJson",
    "createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonFingerprint",
    "sourceBridgeEvidenceClean",
    "allFalseRecord",
    "hasNonNullProductIds",
    "source_evidence",
    "temp_to_product_bridge_design",
    "disabled_bridge_skeleton_status",
    "single_claim_disabled_bridge_skeleton_only",
    "blocked_before_disabled_bridge_skeleton",
    "ready_for_disabled_bridge_skeleton_contract_tests",
    "blocked_before_disabled_bridge_skeleton_contract_tests",
    "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
    "single_claim_temp_to_product_bridge_design_recheck",
    "disabled_dry_boundary_only",
    "adapter_enabled: false",
    "adapter_invocation_allowed_now: false",
    "bridge_execution_allowed_now: false",
    "product_write_allowed_now: false",
    "product_claim_id: null",
    "product_write_statement_count: 0",
    "sql_statement_count: 0",
    "db_opened: false",
    "route_added: false",
    "ui_action_added: false",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
  assert.ok(
    helper.includes('"ready_for_disabled_bridge_skeleton"') &&
      helper.includes("sourceBridgeEvidenceClean"),
    "helper must derive readiness from source bridge design recommendation_status",
  );
}

function assertRunnerContract() {
  for (const requiredText of [
    artifactDir,
    "BRIDGE_DESIGN_FIXTURE_PATH",
    "OPTIONAL_BRIDGE_DESIGN_REPORT_PATH",
    "AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_FIXTURE_MODE",
    "disabled-bridge-skeleton.json",
    "report.json",
    "sourceBridgeDesignReportPassed",
    "validateSkeleton",
    "source_bridge_design_not_ready",
    "source_bridge_design_report_not_passed",
    "source_bridge_forbidden_surface_enabled",
    "source_bridge_design_forbidden_surface_enabled",
    "source_bridge_design_product_id_present",
    "disabled_bridge_skeleton_recommendation_status_not_ready",
    "future_product_write_intent_non_executable_violation",
    "non_null_product_id_present",
    "process.exitCode = 1",
  ]) {
    assert.ok(runner.includes(requiredText), `runner must include ${requiredText}`);
  }
  assert.ok(
    runner.includes("await rm(ARTIFACT_DIR, { recursive: true, force: true })"),
    "runner must recreate only the disabled bridge skeleton artifact directory",
  );
  assert.ok(
    runner.includes("await writeFile(SKELETON_PATH") &&
      runner.includes("await writeFile(REPORT_PATH"),
    "runner must write skeleton and report artifacts",
  );
  assert.doesNotMatch(
    runner,
    /\b(readFile|open|connect|prepare)\s*\([^)]*\.sqlite/i,
    "runner must not open SQLite files",
  );
}

function assertFixtureContract() {
  assert.equal(
    fixture.skeleton_kind,
    "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton",
  );
  assert.equal(
    fixture.skeleton_version,
    "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton.v0.1",
  );
  assert.match(fixture.skeleton_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.recommendation_status,
    "ready_for_disabled_bridge_skeleton",
  );
  assert.equal(
    fixture.disabled_bridge_skeleton_status,
    "single_claim_disabled_bridge_skeleton_only",
  );
  assert.equal(
    fixture.recommendation_status,
    "ready_for_disabled_bridge_skeleton_contract_tests",
  );
  assert.equal(
    fixture.next_recommended_slice,
    "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
  );
  assertDisabledBoundary(fixture);
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.bridge_input_contract_summary
      .selected_temp_claim_record_id,
    "temp-claim:aa03dfea",
  );
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.future_product_claim_draft_summary
      .candidate_kind,
    "manual_note_single_claim",
  );
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.future_product_claim_draft_summary
      .raw_manual_note_text_included,
    false,
  );
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.idempotency_design_summary
      .storage_status,
    "blocked_until_product_idempotency_storage_contract",
  );
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.rollback_design_summary
      .rollback_storage_status,
    "blocked_until_product_rollback_storage_contract",
  );
  assert.equal(
    fixture.source_evidence.temp_to_product_bridge_design.audit_design_summary
      .records_operator_decision,
    "required_later",
  );
  assertForbiddenSurfaces(fixture.explicit_forbidden_surfaces);
  assertAllFalse(
    fixture.source_evidence.temp_to_product_bridge_design
      .explicit_forbidden_surfaces,
    "source bridge forbidden surfaces",
  );
  assertNoNonNullProductIds(fixture);
  assert.equal(fixture.local_copy_packet.adapter_enabled, false);
  assert.equal(fixture.local_copy_packet.bridge_execution_allowed_now, false);
  assert.equal(fixture.local_copy_packet.product_write_allowed_now, false);
  assert.equal(fixture.local_copy_packet.product_write_authority_granted, false);
  assert.doesNotMatch(fixtureText, /https?:\/\//i);
  assert.doesNotMatch(
    fixtureText,
    /manual note raw text|verbatim manual note|raw note body|"manual_note_text"\s*:/i,
  );
  const validation = validateSkeletonArtifact(fixture);
  assert.deepEqual(validation.failures, []);
  assert.equal(validation.passed, true);
}

function assertRunnerFixtureMode() {
  const output = execSync(
    "AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_FIXTURE_MODE=1 node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
    { encoding: "utf8", stdio: "pipe" },
  );
  const summary = JSON.parse(output);
  assert.equal(summary.final_status, "pass");
  assert.equal(
    summary.recommendation_status,
    "ready_for_disabled_bridge_skeleton_contract_tests",
  );
  const report = JSON.parse(readFileSync(artifactReportPath, "utf8"));
  assert.equal(report.final_status, "pass");
  assert.equal(report.disabled_bridge_skeleton_validation.passed, true);
  assert.deepEqual(report.disabled_bridge_skeleton_validation.failures, []);
  assert.deepEqual(report.disabled_bridge_skeleton, fixture);
}

function assertExportedHelperSourceForbiddenSurfaceMutation() {
  const result = runExportedHelperMutation("source_forbidden_surface");
  assert.equal(
    result.disabled_bridge_skeleton_status,
    "blocked_before_disabled_bridge_skeleton",
  );
  assert.equal(
    result.recommendation_status,
    "blocked_before_disabled_bridge_skeleton_contract_tests",
  );
  assert.notEqual(
    result.recommendation_status,
    "ready_for_disabled_bridge_skeleton_contract_tests",
  );
  assert.equal(
    result.next_recommended_slice,
    "single_claim_temp_to_product_bridge_design_recheck",
  );
  assert.equal(result.source_product_db_write, true);
  assert.equal(result.bridge_adapter_enabled, false);
  assert.equal(result.bridge_execution_allowed_now, false);
  assert.equal(result.product_write_allowed_now, false);
  assert.equal(result.product_db_write, false);
  assert.equal(result.product_id_allocation, false);
  assert.equal(result.future_product_claim_id, null);
}

function assertExportedHelperSourceProductIdMutation() {
  const result = runExportedHelperMutation("source_product_id");
  assert.equal(
    result.disabled_bridge_skeleton_status,
    "blocked_before_disabled_bridge_skeleton",
  );
  assert.equal(
    result.recommendation_status,
    "blocked_before_disabled_bridge_skeleton_contract_tests",
  );
  assert.notEqual(
    result.recommendation_status,
    "ready_for_disabled_bridge_skeleton_contract_tests",
  );
  assert.equal(
    result.next_recommended_slice,
    "single_claim_temp_to_product_bridge_design_recheck",
  );
  assert.equal(result.source_product_claim_id_summary, null);
  assert.equal(result.bridge_adapter_enabled, false);
  assert.equal(result.bridge_execution_allowed_now, false);
  assert.equal(result.product_write_allowed_now, false);
  assert.equal(result.product_db_write, false);
  assert.equal(result.product_id_allocation, false);
  assert.equal(result.future_product_claim_id, null);
}

function assertBlockedBridgeDesignMutation() {
  const originalReportExists = existsSync(optionalBridgeDesignReportPath);
  const originalReportText = originalReportExists
    ? readFileSync(optionalBridgeDesignReportPath, "utf8")
    : null;
  const blockedBridgeDesign = JSON.parse(JSON.stringify(bridgeDesignFixture));
  blockedBridgeDesign.recommendation_status =
    "blocked_before_disabled_bridge_skeleton";
  mkdirSync(path.dirname(optionalBridgeDesignReportPath), { recursive: true });
  writeFileSync(
    optionalBridgeDesignReportPath,
    `${JSON.stringify(
      {
        report_kind:
          "manual_note_single_claim_temp_to_product_bridge_design_report_negative_smoke_fixture",
        final_status: "fail",
        temp_to_product_bridge_design: blockedBridgeDesign,
      },
      null,
      2,
    )}\n`,
  );

  try {
    let failedAsExpected = false;
    try {
      execSync(
        "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
        { encoding: "utf8", stdio: "pipe" },
      );
    } catch (error) {
      failedAsExpected = true;
      assert.equal(error.status, 1, "blocked upstream runner exit status must be 1");
    }
    assert.equal(
      failedAsExpected,
      true,
      "runner must fail when upstream bridge design is blocked",
    );
    const blockedReport = JSON.parse(readFileSync(artifactReportPath, "utf8"));
    const blockedSkeleton = blockedReport.disabled_bridge_skeleton;
    assert.equal(blockedReport.final_status, "fail");
    assert.equal(blockedReport.disabled_bridge_skeleton_validation.passed, false);
    assert.ok(
      blockedReport.disabled_bridge_skeleton_validation.failures.includes(
        "source_bridge_design_not_ready",
      ),
      "blocked validation must include source bridge not-ready failure",
    );
    assert.ok(
      blockedReport.disabled_bridge_skeleton_validation.failures.includes(
        "disabled_bridge_skeleton_recommendation_status_not_ready",
      ),
      "blocked validation must include skeleton recommendation failure",
    );
    assert.equal(
      blockedSkeleton.source_evidence.temp_to_product_bridge_design
        .recommendation_status,
      "blocked_before_disabled_bridge_skeleton",
    );
    assert.equal(
      blockedSkeleton.disabled_bridge_skeleton_status,
      "blocked_before_disabled_bridge_skeleton",
    );
    assert.equal(
      blockedSkeleton.recommendation_status,
      "blocked_before_disabled_bridge_skeleton_contract_tests",
    );
    assert.notEqual(
      blockedSkeleton.recommendation_status,
      "ready_for_disabled_bridge_skeleton_contract_tests",
    );
    assert.equal(blockedSkeleton.bridge_adapter_enabled, false);
    assert.equal(blockedSkeleton.bridge_execution_allowed_now, false);
    assert.equal(blockedSkeleton.product_write_allowed_now, false);
    assertDisabledBoundary(blockedSkeleton);
    assertForbiddenSurfaces(blockedSkeleton.explicit_forbidden_surfaces);
    assertNoNonNullProductIds(blockedSkeleton, "blockedSkeleton");
  } finally {
    if (originalReportExists && originalReportText !== null) {
      writeFileSync(optionalBridgeDesignReportPath, originalReportText);
    } else {
      rmSync(optionalBridgeDesignReportPath, { force: true });
    }
  }
}

function assertFailedBridgeDesignReportWithReadyNestedMutation() {
  const readyBridgeDesign = JSON.parse(JSON.stringify(bridgeDesignFixture));
  readyBridgeDesign.recommendation_status = "ready_for_disabled_bridge_skeleton";
  withOptionalBridgeDesignReport(
    {
      report_kind:
        "manual_note_single_claim_temp_to_product_bridge_design_report_failed_ready_nested_negative_smoke_fixture",
      final_status: "fail",
      temp_to_product_bridge_design: readyBridgeDesign,
    },
    () => {
      const { failedAsExpected, status } = runSkeletonRunnerExpectingFailure();
      assert.equal(failedAsExpected, true);
      assert.equal(status, 1);
      const failedReport = JSON.parse(readFileSync(artifactReportPath, "utf8"));
      const failedSkeleton = failedReport.disabled_bridge_skeleton;
      assert.equal(failedReport.final_status, "fail");
      assert.equal(
        failedReport.optional_inputs.bridge_design_report_present,
        true,
      );
      assert.equal(
        failedReport.optional_inputs.bridge_design_report_final_status,
        "fail",
      );
      assert.equal(
        failedSkeleton.source_evidence.temp_to_product_bridge_design
          .recommendation_status,
        "ready_for_disabled_bridge_skeleton",
      );
      assert.ok(
        failedReport.disabled_bridge_skeleton_validation.failures.includes(
          "source_bridge_design_report_not_passed",
        ),
        "failed optional report must include source report not-passed failure",
      );
      assert.equal(
        failedSkeleton.disabled_bridge_skeleton_status,
        "blocked_before_disabled_bridge_skeleton",
      );
      assert.equal(
        failedSkeleton.recommendation_status,
        "blocked_before_disabled_bridge_skeleton_contract_tests",
      );
      assert.notEqual(
        failedSkeleton.recommendation_status,
        "ready_for_disabled_bridge_skeleton_contract_tests",
      );
      assertDisabledBoundary(failedSkeleton);
      assertForbiddenSurfaces(failedSkeleton.explicit_forbidden_surfaces);
      assertNoNonNullProductIds(failedSkeleton, "failedSkeleton");
    },
  );
}

function assertSourceForbiddenSurfaceMutation() {
  const contaminatedBridgeDesign = JSON.parse(JSON.stringify(bridgeDesignFixture));
  contaminatedBridgeDesign.recommendation_status =
    "ready_for_disabled_bridge_skeleton";
  contaminatedBridgeDesign.explicit_forbidden_surfaces.product_db_write = true;
  withOptionalBridgeDesignReport(
    {
      report_kind:
        "manual_note_single_claim_temp_to_product_bridge_design_report_source_forbidden_surface_negative_smoke_fixture",
      final_status: "pass",
      temp_to_product_bridge_design: contaminatedBridgeDesign,
    },
    () => {
      const { failedAsExpected, status } = runSkeletonRunnerExpectingFailure();
      assert.equal(failedAsExpected, true);
      assert.equal(status, 1);
      const contaminatedReport = JSON.parse(
        readFileSync(artifactReportPath, "utf8"),
      );
      const contaminatedSkeleton = contaminatedReport.disabled_bridge_skeleton;
      assert.equal(contaminatedReport.final_status, "fail");
      assert.ok(
        contaminatedReport.disabled_bridge_skeleton_validation.failures.includes(
          "source_bridge_forbidden_surface_enabled",
        ),
        "source summary forbidden-surface failure must be reported",
      );
      assert.ok(
        contaminatedReport.disabled_bridge_skeleton_validation.failures.includes(
          "source_bridge_design_forbidden_surface_enabled",
        ),
        "original source forbidden-surface failure must be reported",
      );
      assert.equal(
        contaminatedSkeleton.source_evidence.temp_to_product_bridge_design
          .explicit_forbidden_surfaces.product_db_write,
        true,
      );
      assert.equal(
        contaminatedSkeleton.disabled_bridge_skeleton_status,
        "blocked_before_disabled_bridge_skeleton",
      );
      assert.equal(
        contaminatedSkeleton.recommendation_status,
        "blocked_before_disabled_bridge_skeleton_contract_tests",
      );
      assertDisabledBoundary(contaminatedSkeleton);
      assertForbiddenSurfaces(contaminatedSkeleton.explicit_forbidden_surfaces);
      assertNoNonNullProductIds(contaminatedSkeleton, "contaminatedSkeleton");
    },
  );
}

function assertSourceProductIdMutation() {
  const contaminatedBridgeDesign = JSON.parse(JSON.stringify(bridgeDesignFixture));
  contaminatedBridgeDesign.recommendation_status =
    "ready_for_disabled_bridge_skeleton";
  contaminatedBridgeDesign.future_product_claim_draft.product_claim_id =
    "product-claim:bad-source";
  withOptionalBridgeDesignReport(
    {
      report_kind:
        "manual_note_single_claim_temp_to_product_bridge_design_report_source_product_id_negative_smoke_fixture",
      final_status: "pass",
      temp_to_product_bridge_design: contaminatedBridgeDesign,
    },
    () => {
      const { failedAsExpected, status } = runSkeletonRunnerExpectingFailure();
      assert.equal(failedAsExpected, true);
      assert.equal(status, 1);
      const contaminatedReport = JSON.parse(
        readFileSync(artifactReportPath, "utf8"),
      );
      const contaminatedSkeleton = contaminatedReport.disabled_bridge_skeleton;
      assert.equal(contaminatedReport.final_status, "fail");
      assert.ok(
        contaminatedReport.disabled_bridge_skeleton_validation.failures.includes(
          "source_bridge_design_product_id_present",
        ),
        "source product ID contamination must be reported",
      );
      assert.equal(
        contaminatedSkeleton.disabled_bridge_skeleton_status,
        "blocked_before_disabled_bridge_skeleton",
      );
      assert.equal(
        contaminatedSkeleton.recommendation_status,
        "blocked_before_disabled_bridge_skeleton_contract_tests",
      );
      assertDisabledBoundary(contaminatedSkeleton);
      assertForbiddenSurfaces(contaminatedSkeleton.explicit_forbidden_surfaces);
      assertNoNonNullProductIds(contaminatedSkeleton, "contaminatedSkeleton");
    },
  );
}

function assertAdapterEnabledMutation() {
  const mutated = JSON.parse(JSON.stringify(fixture));
  mutated.bridge_adapter_enabled = true;
  mutated.disabled_adapter_boundary.adapter_enabled = true;
  mutated.disabled_adapter_boundary.adapter_invocation_allowed_now = true;
  mutated.explicit_forbidden_surfaces.product_write_adapter_enabled = true;
  const validation = validateSkeletonArtifact(mutated);
  assert.equal(validation.passed, false);
  assert.ok(validation.failures.includes("bridge_adapter_enabled"));
  assert.ok(validation.failures.includes("adapter_enabled"));
  assert.ok(validation.failures.includes("adapter_invocation_allowed_now"));
  assert.ok(validation.failures.includes("forbidden_surface_enabled"));
}

function assertProductIdMutation() {
  const mutated = JSON.parse(JSON.stringify(fixture));
  mutated.future_product_write_intent.product_claim_id = "product-claim:bad";
  const validation = validateSkeletonArtifact(mutated);
  assert.equal(validation.passed, false);
  assert.ok(validation.failures.includes("non_null_product_id_present"));
}

function assertDocsPackageAndBrowserPointers() {
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
  for (const requiredText of [
    "Manual note single-claim temp-to-product disabled bridge skeleton",
    "Manual note single-claim temp-to-product disabled bridge skeleton contract tests",
    "disabled bridge skeleton only",
    "contract-test suite for the disabled bridge skeleton",
    "does not implement product write",
    "does not enable an adapter",
    "ready_for_disabled_bridge_skeleton_contract_tests",
    "disabled_bridge_skeleton_contract_tests_passed",
    "ready_for_disabled_bridge_dry_run_transaction_plan",
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan",
    "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
    "no product DB write",
    "no product ID allocation",
    "does not open DB",
    "does not execute SQL",
    "no route",
    "no UI write action",
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
      "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_artifact_note",
    ),
    "browser validator should include disabled bridge skeleton contract-test artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_no_browser_route",
    ),
    "browser validator should assert no disabled bridge skeleton contract-test browser route",
  );
  assert.ok(
    bridgeDesignSmoke.includes(
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1",
    ),
    "bridge design smoke should allow the disabled bridge skeleton smoke script",
  );
  assert.ok(
    bridgeDesignSmoke.includes(
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
    ),
    "bridge design smoke should allow the disabled bridge skeleton contract smoke script",
  );
  assert.ok(
    bridgeDesignSmoke.includes(
      "contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
    ),
    "bridge design smoke should allow the disabled bridge skeleton contract runner script",
  );
}

function assertNoRouteUiSchemaDependencyExpansion() {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge|disabled-bridge-skeleton/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for skeleton");

  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge|disabled-bridge-skeleton/i.test(
      filePath,
    ),
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
      ),
      `package.json must only add disabled bridge skeleton scripts, not dependencies: ${line}`,
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

function validateSkeletonArtifact(skeleton) {
  const failures = [];
  if (
    skeleton.source_evidence?.temp_to_product_bridge_design
      ?.recommendation_status !== "ready_for_disabled_bridge_skeleton"
  ) {
    failures.push("source_bridge_design_not_ready");
  }
  if (
    skeleton.disabled_bridge_skeleton_status !==
    "single_claim_disabled_bridge_skeleton_only"
  ) {
    failures.push("disabled_bridge_skeleton_status_not_ready");
  }
  if (
    skeleton.recommendation_status !==
    "ready_for_disabled_bridge_skeleton_contract_tests"
  ) {
    failures.push("disabled_bridge_skeleton_recommendation_status_not_ready");
  }
  if (skeleton.bridge_adapter_enabled !== false) {
    failures.push("bridge_adapter_enabled");
  }
  if (skeleton.disabled_adapter_boundary?.adapter_enabled !== false) {
    failures.push("adapter_enabled");
  }
  if (skeleton.disabled_adapter_boundary?.adapter_invocation_allowed_now !== false) {
    failures.push("adapter_invocation_allowed_now");
  }
  if (skeleton.bridge_execution_allowed_now !== false) {
    failures.push("bridge_execution_allowed_now");
  }
  if (skeleton.product_write_allowed_now !== false) {
    failures.push("product_write_allowed_now");
  }
  if (!allFalse(skeleton.explicit_forbidden_surfaces)) {
    failures.push("forbidden_surface_enabled");
  }
  if (
    !allFalse(
      skeleton.source_evidence?.temp_to_product_bridge_design
        ?.explicit_forbidden_surfaces,
    )
  ) {
    failures.push("source_bridge_forbidden_surface_enabled");
  }
  if (
    skeleton.future_product_write_intent?.product_write_statement_count !== 0 ||
    skeleton.future_product_write_intent?.sql_statement_count !== 0 ||
    skeleton.future_product_write_intent?.db_opened !== false ||
    skeleton.future_product_write_intent?.route_added !== false ||
    skeleton.future_product_write_intent?.ui_action_added !== false
  ) {
    failures.push("future_product_write_intent_non_executable_violation");
  }
  if (hasNonNullProductIds(skeleton)) {
    failures.push("non_null_product_id_present");
  }
  return {
    passed: failures.length === 0,
    failures: [...new Set(failures)],
  };
}

function assertDisabledBoundary(skeleton) {
  assert.equal(skeleton.bridge_adapter_enabled, false);
  assert.equal(skeleton.bridge_execution_allowed_now, false);
  assert.equal(skeleton.product_write_allowed_now, false);
  assert.equal(skeleton.product_db_write, false);
  assert.equal(skeleton.product_id_allocation, false);
  assert.equal(skeleton.disabled_adapter_boundary.adapter_enabled, false);
  assert.equal(
    skeleton.disabled_adapter_boundary.adapter_invocation_allowed_now,
    false,
  );
  assert.equal(
    skeleton.disabled_adapter_boundary.adapter_execution_mode,
    "disabled_dry_boundary_only",
  );
  assert.equal(skeleton.future_product_write_intent.product_claim_id, null);
  assert.equal(skeleton.future_product_write_intent.product_write_statement_count, 0);
  assert.equal(skeleton.future_product_write_intent.sql_statement_count, 0);
  assert.equal(skeleton.future_product_write_intent.db_opened, false);
  assert.equal(skeleton.future_product_write_intent.route_added, false);
  assert.equal(skeleton.future_product_write_intent.ui_action_added, false);
  assert.equal(
    skeleton.future_product_write_intent.execution_status,
    "blocked_disabled_skeleton_only",
  );
  assert.equal(skeleton.placeholder_record_mapping.product_idempotency_record_id, null);
  assert.equal(skeleton.placeholder_record_mapping.product_rollback_record_id, null);
  assert.equal(skeleton.placeholder_record_mapping.product_audit_record_id, null);
  assert.equal(
    skeleton.placeholder_record_mapping.idempotency_write_executed_now,
    false,
  );
  assert.equal(
    skeleton.placeholder_record_mapping.rollback_write_executed_now,
    false,
  );
  assert.equal(skeleton.placeholder_record_mapping.audit_write_executed_now, false);
}

function assertForbiddenSurfaces(surfaces) {
  for (const key of forbiddenSurfaceKeys) {
    assert.equal(surfaces[key], false, `forbidden surface ${key} must be false`);
  }
  assertAllFalse(surfaces, "forbidden surfaces");
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}.${key} must be false`);
  }
}

function allFalse(record) {
  return record && Object.keys(record).length > 0
    ? Object.values(record).every((value) => value === false)
    : false;
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

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (productIdKeys.includes(key)) return nestedValue !== null;
    return hasNonNullProductIds(nestedValue);
  });
}

function withOptionalBridgeDesignReport(report, fn) {
  const originalReportExists = existsSync(optionalBridgeDesignReportPath);
  const originalReportText = originalReportExists
    ? readFileSync(optionalBridgeDesignReportPath, "utf8")
    : null;
  mkdirSync(path.dirname(optionalBridgeDesignReportPath), { recursive: true });
  writeFileSync(
    optionalBridgeDesignReportPath,
    `${JSON.stringify(report, null, 2)}\n`,
  );

  try {
    fn();
  } finally {
    if (originalReportExists && originalReportText !== null) {
      writeFileSync(optionalBridgeDesignReportPath, originalReportText);
    } else {
      rmSync(optionalBridgeDesignReportPath, { force: true });
    }
  }
}

function runSkeletonRunnerExpectingFailure() {
  try {
    execSync(
      "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
      { encoding: "utf8", stdio: "pipe" },
    );
    return { failedAsExpected: false, status: 0 };
  } catch (error) {
    return { failedAsExpected: true, status: error.status };
  }
}

function runExportedHelperMutation(mutationKind) {
  const script = `
    import { readFileSync } from "node:fs";
    import { buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton } from "./lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.ts";

    const mutationKind = ${JSON.stringify(mutationKind)};
    const bridgeDesign = JSON.parse(readFileSync(${JSON.stringify(bridgeDesignFixturePath)}, "utf8"));
    if (mutationKind === "source_forbidden_surface") {
      bridgeDesign.explicit_forbidden_surfaces.product_db_write = true;
    } else if (mutationKind === "source_product_id") {
      bridgeDesign.future_product_claim_draft.product_claim_id =
        "product-claim:bad-source-helper";
    } else {
      throw new Error(\`unknown mutation kind: \${mutationKind}\`);
    }

    const skeleton = buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton({
      tempToProductBridgeDesign: bridgeDesign,
    });
    console.log(JSON.stringify({
      disabled_bridge_skeleton_status: skeleton.disabled_bridge_skeleton_status,
      recommendation_status: skeleton.recommendation_status,
      next_recommended_slice: skeleton.next_recommended_slice,
      bridge_adapter_enabled: skeleton.bridge_adapter_enabled,
      bridge_execution_allowed_now: skeleton.bridge_execution_allowed_now,
      product_write_allowed_now: skeleton.product_write_allowed_now,
      product_db_write: skeleton.product_db_write,
      product_id_allocation: skeleton.product_id_allocation,
      future_product_claim_id: skeleton.future_product_write_intent.product_claim_id,
      source_product_db_write:
        skeleton.source_evidence.temp_to_product_bridge_design
          .explicit_forbidden_surfaces.product_db_write ?? null,
      source_product_claim_id_summary:
        skeleton.source_evidence.temp_to_product_bridge_design
          .future_product_claim_draft_summary.product_claim_id,
    }));
  `;
  return JSON.parse(
    execFileSync(tsxPath, ["-e", script], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
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
