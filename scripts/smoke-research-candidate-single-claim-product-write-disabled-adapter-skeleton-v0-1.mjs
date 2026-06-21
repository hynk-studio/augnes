import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-skeleton.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-skeleton.sample.v0.1.json";
const authorityBundleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-authority-contract-bundle.sample.v0.1.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const authorityBundleSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs";
const harnessSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs";
const dryRunPlanSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs";
const contractTestsSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs";
const skeletonSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs";
const bridgeDesignSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs";
const productWriteGateSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const skeletonPath = path.join(artifactDir, "disabled-adapter-skeleton.json");
const optionalAuthorityReportPath =
  "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json";
const optionalUpstreamReportPaths = {
  dry_run_transaction_harness:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json",
  dry_run_transaction_plan:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json",
  contract_tests:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json",
  disabled_bridge_skeleton:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json",
  temp_to_product_bridge_design:
    "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json",
  product_write_gate_design:
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
};

const expectedKind =
  "manual_note_single_claim_product_write_disabled_adapter_skeleton";
const expectedVersion =
  "manual_note_single_claim_product_write_disabled_adapter_skeleton.v0.1";
const expectedReadyStatus = "product_write_disabled_adapter_skeleton_only";
const expectedBlockedStatus =
  "blocked_before_product_write_disabled_adapter_skeleton";
const expectedReadyRecommendation =
  "ready_for_single_claim_product_write_disabled_adapter_contract_tests";
const expectedBlockedRecommendation =
  "blocked_before_product_write_disabled_adapter_contract_tests";
const expectedNextSlice =
  "single_claim_product_write_disabled_adapter_contract_tests";
const expectedRecheckSlice =
  "single_claim_product_write_disabled_adapter_skeleton_recheck";
const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1",
  "adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1",
];
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-skeleton.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-skeleton.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const authorityContractIds = [
  "explicit_operator_decision_contract",
  "selected_temp_claim_identity_contract",
  "product_claim_schema_contract",
  "product_claim_id_allocation_contract",
  "product_idempotency_storage_contract",
  "product_rollback_storage_contract",
  "product_review_audit_storage_contract",
  "product_write_observability_contract",
  "source_verification_authority_contract",
  "proof_evidence_authority_contract",
  "canonical_perspective_authority_contract",
  "enabled_adapter_transition_contract",
  "product_write_route_contract",
  "product_write_transaction_boundary_contract",
  "product_write_static_boundary_contract",
  "product_write_runtime_boundary_contract",
];
const requiredRefusalReasonIds = [
  "adapter_disabled",
  "adapter_invocation_requested",
  "product_write_requested",
  "product_write_authority_not_granted",
  "authority_contracts_not_satisfied",
  "missing_or_malformed_authority_bundle",
  "missing_selected_temp_claim_identity",
  "candidate_kind_mismatch",
  "multiple_selected_temp_claims",
  "product_claim_id_provided",
  "proof_or_evidence_id_provided",
  "perspective_or_canonical_id_provided",
  "work_item_id_provided",
  "raw_manual_note_text_included",
  "db_path_provided",
  "sql_text_provided",
  "transaction_execution_requested",
  "route_requested",
  "ui_action_requested",
  "provider_or_openai_requested",
  "source_fetch_requested",
  "retrieval_or_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "upstream_forbidden_surface_true",
  "static_schema_db_sql_change",
  "static_app_router_ui_change",
  "dependency_addition_outside_allowlist",
];
const requiredAdapterReferenceInputs = [
  "operator_decision_contract_reference",
  "product_claim_schema_contract_reference",
  "idempotency_contract_reference",
  "rollback_contract_reference",
  "audit_contract_reference",
  "observability_contract_reference",
];
const explicitForbiddenSurfaceKeys = [
  "product_write_authority_granted",
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "adapter_invocation",
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
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "durable_idempotency_write",
  "durable_rollback_write",
  "durable_audit_write",
  "durable_observability_write",
  "enabled_adapter_transition",
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
]);

for (const filePath of [
  helperPath,
  runnerPath,
  smokePath,
  sampleFixturePath,
  authorityBundleFixturePath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
  authorityBundleSmokePath,
  harnessSmokePath,
  dryRunPlanSmokePath,
  contractTestsSmokePath,
  skeletonSmokePath,
  bridgeDesignSmokePath,
  productWriteGateSmokePath,
  tsxPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const committedSample = JSON.parse(readFileSync(sampleFixturePath, "utf8"));
const authorityBundleFixture = JSON.parse(
  readFileSync(authorityBundleFixturePath, "utf8"),
);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const adjacentSmokeTexts = [
  readFileSync(authorityBundleSmokePath, "utf8"),
  readFileSync(harnessSmokePath, "utf8"),
  readFileSync(dryRunPlanSmokePath, "utf8"),
  readFileSync(contractTestsSmokePath, "utf8"),
  readFileSync(skeletonSmokePath, "utf8"),
  readFileSync(bridgeDesignSmokePath, "utf8"),
  readFileSync(productWriteGateSmokePath, "utf8"),
];

assertHelperContract();
assertSkeletonContract(committedSample, "committed sample fixture");
assertExportedHelperMissingAuthorityBundleBlocks();
assertExportedHelperBlockedAuthorityRecommendationBlocks();
assertExportedHelperRequiredAdapterInputReferenceBlocks();
const absentFixtureRun = runFixtureModeWithOptionalReports({});
assertReportContract(absentFixtureRun.report);
assertSkeletonContract(absentFixtureRun.skeleton, "fixture-mode runtime skeleton");
const staleFixtureRun = runFixtureModeWithOptionalReports(
  buildHarmlessStaleOptionalReports(),
);
assert.equal(staleFixtureRun.report.final_status, "pass");
assert.equal(
  staleFixtureRun.skeleton.disabled_adapter_skeleton_fingerprint,
  absentFixtureRun.skeleton.disabled_adapter_skeleton_fingerprint,
  "fixture-mode fingerprint must ignore stale optional report presence",
);
assert.deepEqual(
  staleFixtureRun.skeleton.static_boundary_evidence,
  absentFixtureRun.skeleton.static_boundary_evidence,
  "fixture-mode static boundary evidence must ignore stale optional report presence",
);
assert.deepEqual(
  staleFixtureRun.skeleton.source_evidence,
  absentFixtureRun.skeleton.source_evidence,
  "fixture-mode source evidence must ignore stale optional report presence",
);
assert.equal(
  staleFixtureRun.report.non_fingerprinted_runtime_notes
    .optional_authority_contract_bundle_report_present_on_disk,
  true,
);
assert.equal(
  staleFixtureRun.skeleton.source_evidence.authority_contract_bundle
    .source_selection.optional_report_present,
  false,
);
assert.equal(
  staleFixtureRun.skeleton.source_evidence.authority_contract_bundle
    .source_selection.optional_report_ignored_for_fixture_mode,
  true,
);
const baseOverrideFixtureRun = runRunnerWithOptionalReports(
  {},
  true,
  {
    AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_BASE_REF: "HEAD^",
  },
);
assert.equal(baseOverrideFixtureRun.report.final_status, "pass");
assert.equal(
  baseOverrideFixtureRun.skeleton.disabled_adapter_skeleton_fingerprint,
  absentFixtureRun.skeleton.disabled_adapter_skeleton_fingerprint,
  "fixture-mode fingerprint must ignore live base-ref metadata",
);
assert.deepEqual(
  baseOverrideFixtureRun.skeleton.static_boundary_evidence,
  absentFixtureRun.skeleton.static_boundary_evidence,
  "fixture-mode static boundary evidence must ignore live base-ref metadata",
);
assert.deepEqual(
  baseOverrideFixtureRun.skeleton.source_evidence
    .disabled_adapter_skeleton_static_boundary,
  absentFixtureRun.skeleton.source_evidence
    .disabled_adapter_skeleton_static_boundary,
  "fixture-mode source static boundary summary must ignore live base-ref metadata",
);
assert.match(
  baseOverrideFixtureRun.report.non_fingerprinted_runtime_notes
    .fixture_mode_live_static_boundary_result.static_boundary_base_mode,
  /AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_BASE_REF/,
);
assertOptionalFailedAuthorityReportBlocks();
assertOptionalMalformedAuthorityReportBlocks();
for (const [label, filePath] of Object.entries(optionalUpstreamReportPaths)) {
  assertOptionalFailedUpstreamReportBlocks(label, filePath);
}
assertSourceForbiddenSurfaceContaminationBlocks();
assertSourceProductIdContaminationBlocks();
assertStaticBoundaryAndNoExpansion(absentFixtureRun.report);
assertMutationValidatorCoverage(absentFixtureRun.skeleton);
assertDocsPackageBrowserAndAdjacentSmokePointers();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1",
      helper_exists: true,
      committed_fixture_checked: true,
      runner_fixture_mode_checked: true,
      fixture_mode_determinism_checked: true,
      fixture_mode_static_boundary_determinism_checked: true,
      direct_helper_missing_authority_bundle_blocks_checked: true,
      direct_helper_blocked_authority_recommendation_blocks_checked: true,
      direct_helper_required_adapter_input_reference_blocks_checked:
        requiredAdapterReferenceInputs.length,
      failed_optional_authority_report_blocks_checked: true,
      failed_optional_upstream_report_blocks_checked: Object.keys(
        optionalUpstreamReportPaths,
      ).length,
      source_forbidden_surface_contamination_blocks_checked: true,
      source_product_id_contamination_blocks_checked: true,
      refusal_reason_count_checked:
        absentFixtureRun.skeleton.adapter_refusal_matrix.length,
      validation_matrix_rows_checked:
        absentFixtureRun.skeleton.adapter_skeleton_validation_matrix.length,
      static_boundary_changed_files_checked:
        absentFixtureRun.report.static_boundary_changed_files_inspected.length,
      static_boundary_package_added_lines_checked:
        absentFixtureRun.report.static_boundary_package_added_lines_inspected
          .length,
      next_slice_checked: absentFixtureRun.skeleton.next_recommended_slice,
      product_write_implementation_not_recommended_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_VERSION",
    expectedVersion,
    "buildManualNoteSingleClaimProductWriteDisabledAdapterSkeleton",
    "createManualNoteSingleClaimProductWriteDisabledAdapterSkeletonReport",
    "createManualNoteSingleClaimProductWriteDisabledAdapterSkeletonFingerprint",
    "authority_contract_bundle_status_not_ready",
    "authority_contract_bundle_recommendation_not_ready",
    "source_authority_bundle_product_id_present",
    "adapter_input_forbidden_${key}_present",
    "product_claim_id",
    expectedReadyRecommendation,
    expectedNextSlice,
    expectedBlockedRecommendation,
    expectedRecheckSlice,
    "adapter_input_contract",
    "normalized_adapter_input_preview",
    "adapter_output_contract",
    "disabled_invocation_result",
    "future_product_write_command_preview",
    "adapter_refusal_matrix",
    "adapter_skeleton_validation_matrix",
    "0x811c9dc5",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
  for (const contractId of authorityContractIds) {
    assert.ok(helper.includes(contractId), `helper must include ${contractId}`);
  }
}

function assertExportedHelperMissingAuthorityBundleBlocks() {
  const skeleton = runExportedHelperMutation("missing_authority_bundle");
  assertBlockedHelperSkeleton(skeleton, [
    "authority_contract_bundle_status_not_ready",
    "authority_contract_bundle_recommendation_not_ready",
    "authority_contract_bundle_next_slice_invalid",
    "authority_contract_bundle_validation_not_passed",
    "authority_contract_count_invalid",
  ]);
}

function assertExportedHelperBlockedAuthorityRecommendationBlocks() {
  const skeleton = runExportedHelperMutation("blocked_authority_recommendation");
  assertBlockedHelperSkeleton(skeleton, [
    "authority_contract_bundle_recommendation_not_ready",
  ]);
}

function assertExportedHelperRequiredAdapterInputReferenceBlocks() {
  for (const fieldName of requiredAdapterReferenceInputs) {
    const skeleton = runExportedHelperMutation("required_adapter_input_blank", {
      [fieldName]: "",
    });
    assertBlockedHelperSkeleton(skeleton, [
      `adapter_input_${fieldName}_missing`,
    ]);
  }
}

function assertBlockedHelperSkeleton(skeleton, expectedFailureCodes) {
  assert.equal(skeleton.disabled_adapter_skeleton_status, expectedBlockedStatus);
  assert.equal(skeleton.recommendation_status, expectedBlockedRecommendation);
  assert.equal(skeleton.next_recommended_slice, expectedRecheckSlice);
  assert.equal(skeleton.validation.passed, false);
  for (const failureCode of expectedFailureCodes) {
    assert.ok(
      skeleton.validation.failure_codes.includes(failureCode),
      `blocked helper skeleton should include ${failureCode}`,
    );
  }
  assertTopLevelNoWriteFlags(skeleton, "blocked helper skeleton");
}

function runExportedHelperMutation(mutationKind, adapterInputDraft = null) {
  const script = `
    import { readFileSync } from "node:fs";
    import { buildManualNoteSingleClaimProductWriteDisabledAdapterSkeleton } from "./lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-skeleton.ts";

    const mutationKind = ${JSON.stringify(mutationKind)};
    const authorityContractBundle = JSON.parse(readFileSync(${JSON.stringify(authorityBundleFixturePath)}, "utf8"));
    const mutatedAuthority =
      mutationKind === "missing_authority_bundle"
        ? null
        : {
            ...authorityContractBundle,
            recommendation_status: "blocked_before_single_claim_product_write_disabled_adapter_skeleton",
          };
    const skeleton = buildManualNoteSingleClaimProductWriteDisabledAdapterSkeleton({
      authorityContractBundle: mutatedAuthority,
      adapterInputDraft: ${JSON.stringify(adapterInputDraft)},
      staticBoundaryEvidence: {
        static_boundary_base_ref: "committed_allowlist",
        static_boundary_base_mode: "smoke_helper_fixture_delta",
        static_boundary_changed_files_inspected: ${JSON.stringify(expectedChangedFiles)},
        static_boundary_package_added_lines_inspected: ${JSON.stringify(
          allowedPackageScriptNames.map(
            (scriptName) => `    "${scriptName}": "node scripts/placeholder.mjs",`,
          ),
        )},
        failureCodes: [],
      },
    });
    console.log(JSON.stringify({
      disabled_adapter_skeleton_status: skeleton.disabled_adapter_skeleton_status,
      recommendation_status: skeleton.recommendation_status,
      next_recommended_slice: skeleton.next_recommended_slice,
      validation: skeleton.validation,
      adapter_enabled: skeleton.adapter_enabled,
      adapter_invocation_allowed_now: skeleton.adapter_invocation_allowed_now,
      product_write_allowed_now: skeleton.product_write_allowed_now,
      product_write_authority_granted_now: skeleton.product_write_authority_granted_now,
      product_write_implementation_allowed_now: skeleton.product_write_implementation_allowed_now,
      transaction_execution_allowed_now: skeleton.transaction_execution_allowed_now,
      product_db_write: skeleton.product_db_write,
      product_id_allocation: skeleton.product_id_allocation,
      db_open: skeleton.db_open,
      sql_execution: skeleton.sql_execution,
      route_added: skeleton.route_added,
      ui_write_action_added: skeleton.ui_write_action_added,
    }));
  `;
  return JSON.parse(
    execFileSync(tsxPath, ["-e", script], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function runFixtureModeWithOptionalReports(overrides) {
  return runRunnerWithOptionalReports(overrides, true);
}

function runRunnerWithOptionalReports(overrides, fixtureMode = false, extraEnv = {}) {
  const optionalPaths = [
    optionalAuthorityReportPath,
    ...Object.values(optionalUpstreamReportPaths),
  ];
  const originals = new Map(
    optionalPaths.map((filePath) => [
      filePath,
      existsSync(filePath) ? readFileSync(filePath, "utf8") : null,
    ]),
  );
  try {
    rmSync(artifactDir, { recursive: true, force: true });
    for (const filePath of optionalPaths) {
      rmSync(filePath, { force: true });
    }
    for (const [filePath, value] of Object.entries(overrides)) {
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(
        filePath,
        typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
      );
    }
    const result = spawnSync("node", [runnerPath], {
      encoding: "utf8",
      env: {
        ...process.env,
        ...extraEnv,
        AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_FIXTURE_MODE:
          fixtureMode ? "1" : "0",
      },
    });
    return {
      exitCode: result.status ?? 0,
      stdout: result.stdout,
      stderr: result.stderr,
      report: existsSync(reportPath)
        ? JSON.parse(readFileSync(reportPath, "utf8"))
        : null,
      skeleton: existsSync(skeletonPath)
        ? JSON.parse(readFileSync(skeletonPath, "utf8"))
        : null,
    };
  } finally {
    for (const [filePath, originalText] of originals) {
      if (originalText === null) {
        rmSync(filePath, { force: true });
      } else {
        mkdirSync(path.dirname(filePath), { recursive: true });
        writeFileSync(filePath, originalText);
      }
    }
  }
}

function buildHarmlessStaleOptionalReports() {
  return {
    [optionalAuthorityReportPath]: {
      final_status: "pass",
      authority_contract_bundle: authorityBundleFixture,
    },
    ...Object.fromEntries(
      Object.entries(optionalUpstreamReportPaths).map(([label, filePath]) => [
        filePath,
        {
          final_status: "pass",
          stale_report_label: label,
          ignored_for_fixture_mode: true,
        },
      ]),
    ),
  };
}

function assertOptionalFailedAuthorityReportBlocks() {
  const result = runRunnerWithOptionalReports(
    {
      [optionalAuthorityReportPath]: {
        final_status: "fail",
        authority_contract_bundle: authorityBundleFixture,
      },
    },
    false,
  );
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.report.final_status, "fail");
  assert.equal(result.report.disabled_adapter_skeleton_status, expectedBlockedStatus);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_authority_contract_bundle_report_not_passed",
    ),
  );
  assert.equal(
    result.report.optional_inputs.authority_contract_bundle
      .fallback_to_committed_fixture,
    false,
  );
}

function assertOptionalMalformedAuthorityReportBlocks() {
  const result = runRunnerWithOptionalReports(
    {
      [optionalAuthorityReportPath]: "{ malformed authority bundle report",
    },
    false,
  );
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_authority_contract_bundle_report_malformed",
    ),
  );
}

function assertOptionalFailedUpstreamReportBlocks(label, filePath) {
  const result = runRunnerWithOptionalReports(
    {
      [filePath]: {
        final_status: "fail",
        report_label: label,
      },
    },
    false,
  );
  assert.notEqual(result.exitCode, 0, `${label} failed optional report must block`);
  assert.ok(
    result.report.validation.failure_codes.includes(
      `optional_${label}_report_not_passed`,
    ),
    `${label} failure code should be recorded`,
  );
  const selection = result.report.optional_inputs.upstream_reports.find(
    (entry) => entry.source_label === label,
  );
  assert.equal(selection.fallback_to_committed_fixture, false);
}

function assertSourceForbiddenSurfaceContaminationBlocks() {
  const contaminated = cloneJson(authorityBundleFixture);
  contaminated.explicit_forbidden_surfaces.product_db_write = true;
  const result = runRunnerWithOptionalReports(
    {
      [optionalAuthorityReportPath]: {
        final_status: "pass",
        authority_contract_bundle: contaminated,
      },
    },
    false,
  );
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "authority_contract_bundle_forbidden_surface_product_db_write_not_false",
    ),
  );
}

function assertSourceProductIdContaminationBlocks() {
  const contaminated = cloneJson(authorityBundleFixture);
  contaminated.source_evidence.dry_run_transaction_harness.product_claim_id =
    "product-claim:contaminated";
  const result = runRunnerWithOptionalReports(
    {
      [optionalAuthorityReportPath]: {
        final_status: "pass",
        authority_contract_bundle: contaminated,
      },
    },
    false,
  );
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "source_authority_bundle_product_id_present",
    ),
  );
}

function assertReportContract(report) {
  assert.equal(
    report.report_kind,
    "manual_note_single_claim_product_write_disabled_adapter_skeleton_report",
  );
  assert.equal(report.report_version, expectedVersion);
  assert.equal(report.final_status, "pass");
  assert.equal(report.disabled_adapter_skeleton_status, expectedReadyStatus);
  assert.equal(report.recommendation_status, expectedReadyRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assert.ok(report.static_boundary_base_ref);
  assert.ok(report.static_boundary_base_mode);
  assert.notEqual(report.static_boundary_base_mode, "worktree_only");
  assert.ok(
    report.static_boundary_changed_files_inspected.length >=
      expectedChangedFiles.length,
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter(isSchemaDbSqlPath),
    [],
  );
}

function assertSkeletonContract(skeleton, label) {
  assert.equal(skeleton.disabled_adapter_skeleton_kind, expectedKind, label);
  assert.equal(skeleton.disabled_adapter_skeleton_version, expectedVersion, label);
  assert.match(
    skeleton.disabled_adapter_skeleton_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
  assert.equal(skeleton.disabled_adapter_skeleton_status, expectedReadyStatus);
  assert.equal(skeleton.recommendation_status, expectedReadyRecommendation);
  assert.equal(skeleton.next_recommended_slice, expectedNextSlice);
  assert.doesNotMatch(
    skeleton.next_recommended_slice,
    /product_write_implementation|enabled_adapter|route|ui/i,
  );
  assertTopLevelNoWriteFlags(skeleton, label);
  assertAdapterInputContract(skeleton.adapter_input_contract);
  assertNormalizedInput(skeleton.normalized_adapter_input_preview);
  assertAdapterOutputContract(skeleton.adapter_output_contract);
  assertDisabledInvocationResult(skeleton.disabled_invocation_result);
  assertFutureCommandPreview(skeleton.future_product_write_command_preview);
  assertRefusalMatrix(skeleton.adapter_refusal_matrix);
  assertValidationMatrix(skeleton.adapter_skeleton_validation_matrix);
  assertExplicitForbiddenSurfaces(skeleton.explicit_forbidden_surfaces);
  assertSourceEvidence(skeleton.source_evidence);
  assertNoNonNullProductIds(skeleton, label);
  assert.equal(skeleton.validation.passed, true);
  assert.deepEqual(skeleton.validation.failure_codes, []);
  assert.equal(skeleton.local_copy_packet.local_clipboard_only, true);
  assert.equal(skeleton.local_copy_packet.external_handoff_sent, false);
  assert.equal(skeleton.local_copy_packet.packet_persisted_to_product_db, false);
  assert.equal(skeleton.local_copy_packet.adapter_enabled, false);
  assert.equal(skeleton.local_copy_packet.adapter_invocation_allowed_now, false);
  assert.equal(skeleton.local_copy_packet.product_write_allowed_now, false);
  assert.equal(
    skeleton.local_copy_packet.product_write_authority_granted_now,
    false,
  );
}

function assertTopLevelNoWriteFlags(value, label) {
  for (const key of [
    "adapter_enabled",
    "adapter_invocation_allowed_now",
    "product_write_allowed_now",
    "product_write_authority_granted_now",
    "product_write_implementation_allowed_now",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ]) {
    assert.equal(value[key], false, `${label}: ${key} must be false`);
  }
}

function assertAdapterInputContract(contract) {
  assert.equal(
    contract.contract_kind,
    "manual_note_single_claim_product_write_disabled_adapter_input_contract",
  );
  assert.equal(contract.accepted_candidate_kind, "manual_note_single_claim");
  assert.equal(contract.single_selected_temp_claim_only, true);
  for (const inputName of [
    "authority_contract_bundle_fingerprint",
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
    "operator_decision_contract_reference",
    "product_claim_schema_contract_reference",
    "idempotency_contract_reference",
    "rollback_contract_reference",
    "audit_contract_reference",
    "observability_contract_reference",
  ]) {
    assert.ok(contract.required_inputs.includes(inputName));
  }
  for (const inputName of [
    "product_claim_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
    "db_path",
    "sql_text",
    "route_request",
    "ui_action_request",
    "provider_request",
    "source_fetch_request",
    "external_handoff_request",
  ]) {
    assert.ok(contract.forbidden_inputs.includes(inputName));
  }
  assert.equal(contract.requires_authority_contract_bundle, true);
  assert.equal(contract.requires_authority_contract_bundle_passed, true);
  assert.equal(contract.raw_manual_note_text_allowed_now, false);
  assert.equal(contract.product_ids_allowed_now, false);
  assert.equal(contract.db_runtime_inputs_allowed_now, false);
}

function assertNormalizedInput(preview) {
  assert.equal(preview.candidate_kind, "manual_note_single_claim");
  for (const key of [
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
    "authority_contract_bundle_fingerprint",
  ]) {
    assert.ok(preview[key], `${key} must be present`);
  }
  for (const key of [
    "product_claim_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
  ]) {
    assert.equal(preview[key], null, `${key} must stay null`);
  }
  assert.equal(preview.raw_manual_note_text_included, false);
  assert.equal(preview.normalization_executed_now, true);
  assert.equal(preview.normalization_persisted_now, false);
  assert.equal(preview.normalization_storage_target, "local_artifact_only");
}

function assertAdapterOutputContract(contract) {
  for (const status of [
    "rejected_disabled_adapter",
    "blocked_missing_authority_contract",
    "blocked_forbidden_input",
    "blocked_product_write_not_allowed",
    "dry_noop_preview",
  ]) {
    assert.ok(contract.possible_result_statuses.includes(status));
  }
  assert.equal(contract.default_result_status, "rejected_disabled_adapter");
  assert.equal(contract.product_write_result, null);
  assert.equal(contract.product_claim_id, null);
  assert.equal(contract.durable_records_created_now, false);
  assert.equal(contract.product_db_write, false);
  assert.equal(contract.product_id_allocation, false);
  assert.equal(contract.db_open, false);
  assert.equal(contract.sql_execution, false);
  assert.equal(contract.transaction_execution, false);
}

function assertDisabledInvocationResult(result) {
  assert.equal(result.invocation_attempted_now, false);
  assert.equal(result.adapter_invocation_allowed_now, false);
  assert.equal(result.adapter_enabled, false);
  assert.equal(result.result_status, "rejected_disabled_adapter");
  for (const reason of [
    "adapter_disabled",
    "product_write_authority_not_granted",
    "authority_contracts_defined_but_not_satisfied",
    "product_write_implementation_not_allowed",
  ]) {
    assert.ok(result.refusal_reasons.includes(reason));
  }
  for (const key of [
    "product_write_executed_now",
    "transaction_executed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
    "durable_records_created_now",
  ]) {
    assert.equal(result[key], false, `${key} must be false`);
  }
}

function assertFutureCommandPreview(preview) {
  assert.equal(
    preview.command_kind,
    "manual_note_single_claim_product_write_command_preview",
  );
  assert.equal(preview.executable_now, false);
  assert.equal(preview.product_claim_id, null);
  assert.equal(
    preview.target_table_or_interface,
    "product_claim_future_contract_placeholder",
  );
  assert.equal(preview.write_operation_count, 0);
  assert.equal(preview.sql_statement_count, 0);
  assert.deepEqual(preview.would_require_contracts, authorityContractIds);
  assert.equal(preview.command_rejected_now, true);
  assert.equal(preview.rejection_reason, "disabled_adapter_skeleton_only");
}

function assertRefusalMatrix(matrix) {
  assert.ok(matrix.length >= requiredRefusalReasonIds.length);
  const reasonIds = matrix.map((entry) => entry.reason_id);
  for (const reasonId of requiredRefusalReasonIds) {
    assert.ok(reasonIds.includes(reasonId), `refusal matrix must include ${reasonId}`);
  }
  for (const entry of matrix) {
    assert.equal(entry.requested_now, false);
    assert.equal(entry.refusal_required_now, true);
    assert.equal(entry.blocks_adapter_invocation_now, true);
    assert.equal(entry.blocks_product_write_now, true);
    assert.equal(entry.expected_status, expectedBlockedStatus);
  }
}

function assertValidationMatrix(matrix) {
  assert.ok(matrix.length >= 50, "validation matrix must be broad");
  const groups = new Set(matrix.map((row) => row.check_group));
  for (const group of [
    "authority_ready_positive",
    "authority_contracts",
    "authority_mutations",
    "adapter_flags",
    "normalized_input",
    "invocation_and_command",
    "optional_reports",
    "source_contamination",
    "static_boundary",
    "determinism",
  ]) {
    assert.ok(groups.has(group), `validation matrix must include ${group}`);
  }
  for (const row of matrix) {
    assert.ok(row.check_id);
    assert.ok(row.expected_status);
    assert.ok(Array.isArray(row.expected_failure_codes));
    assert.ok(row.actual_status);
    assert.ok(Array.isArray(row.actual_failure_codes));
    assert.equal(row.check_status, "pass");
  }
}

function assertExplicitForbiddenSurfaces(surfaces) {
  for (const key of explicitForbiddenSurfaceKeys) {
    assert.equal(surfaces[key], false, `explicit forbidden surface ${key}`);
  }
}

function assertSourceEvidence(sourceEvidence) {
  assert.equal(
    sourceEvidence.authority_contract_bundle.authority_contract_bundle_status,
    "product_write_authority_contracts_defined_only",
  );
  assert.equal(
    sourceEvidence.authority_contract_bundle.recommendation_status,
    "ready_for_single_claim_product_write_disabled_adapter_skeleton",
  );
  assert.equal(
    sourceEvidence.authority_contract_bundle.next_recommended_slice,
    "single_claim_product_write_disabled_adapter_skeleton",
  );
  assert.equal(
    sourceEvidence.authority_contract_bundle.authority_contract_count,
    authorityContractIds.length,
  );
  assert.equal(
    sourceEvidence.authority_contract_bundle.validation_passed,
    true,
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_harness
      .dry_run_transaction_harness_status,
    "disabled_dry_run_transaction_harness_only",
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_plan.dry_run_transaction_plan_status,
    "disabled_dry_run_transaction_plan_only",
  );
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton_contract_tests.final_status,
    "pass",
  );
  assert.ok(sourceEvidence.disabled_bridge_skeleton_contract_tests.total_cases >= 70);
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton_contract_tests.unexpected_passes,
    0,
  );
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton_contract_tests.unexpected_failures,
    0,
  );
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton.disabled_bridge_skeleton_status,
    "single_claim_disabled_bridge_skeleton_only",
  );
  assert.equal(
    sourceEvidence.temp_to_product_bridge_design.bridge_design_status,
    "single_claim_bridge_design_only",
  );
  assert.equal(
    sourceEvidence.product_write_gate_design.gate_design_status,
    "product_write_gate_design_only",
  );
}

function assertStaticBoundaryAndNoExpansion(report) {
  assert.ok(report.static_boundary_changed_files_inspected.length > 0);
  for (const filePath of expectedChangedFiles) {
    assert.ok(
      report.static_boundary_changed_files_inspected.includes(filePath),
      `static boundary changed files must include ${filePath}`,
    );
  }
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter(isSchemaDbSqlPath),
    [],
  );
  assert.equal(
    report.static_boundary_package_added_lines_inspected.length,
    allowedPackageScriptNames.length,
  );
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(
      report.static_boundary_package_added_lines_inspected.some((line) =>
        line.includes(`"${scriptName}"`),
      ),
      `package additions must include ${scriptName}`,
    );
  }
  for (const line of report.static_boundary_package_added_lines_inspected) {
    assert.ok(
      allowedPackageScriptNames.some((scriptName) =>
        line.includes(`"${scriptName}"`),
      ),
      `package additions must only contain allowed scripts: ${line}`,
    );
  }
  assert.deepEqual(report.static_boundary_result.failureCodes, []);
  assert.equal(isUiFilePath("app/foo/page.tsx"), true);
  assert.equal(isUiFilePath("app/layout.jsx"), true);
  assert.equal(isUiFilePath("components/Foo.tsx"), true);
  assert.equal(isUiFilePath("lib/Foo.tsx"), false);
}

function assertMutationValidatorCoverage(skeleton) {
  for (const [field, value] of [
    ["adapter_enabled", true],
    ["adapter_invocation_allowed_now", true],
    ["product_write_allowed_now", true],
    ["product_write_authority_granted_now", true],
    ["transaction_execution_allowed_now", true],
    ["product_db_write", true],
    ["product_id_allocation", true],
    ["db_open", true],
    ["sql_execution", true],
    ["route_added", true],
    ["ui_write_action_added", true],
  ]) {
    const mutated = cloneJson(skeleton);
    mutated[field] = value;
    assert.throws(() => assertSkeletonContract(mutated, `${field} mutation`));
  }
  const executableCommand = cloneJson(skeleton);
  executableCommand.future_product_write_command_preview.executable_now = true;
  assert.throws(() =>
    assertSkeletonContract(executableCommand, "future command executable mutation"),
  );
  const productIdCommand = cloneJson(skeleton);
  productIdCommand.future_product_write_command_preview.product_claim_id =
    "product-claim:mutated";
  assert.throws(() =>
    assertSkeletonContract(productIdCommand, "future command product ID mutation"),
  );
  const missingReason = cloneJson(skeleton);
  missingReason.disabled_invocation_result.refusal_reasons = [];
  assert.throws(() =>
    assertSkeletonContract(missingReason, "missing refusal reason mutation"),
  );
}

function assertDocsPackageBrowserAndAdjacentSmokePointers() {
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
  for (const requiredText of [
    "Manual note single-claim product write disabled adapter skeleton",
    "Manual note single-claim product write disabled adapter contract tests",
    "disabled product-write adapter skeleton only",
    "does not implement product write",
    "does not enable an adapter",
    "does not invoke an adapter",
    "does not allocate product IDs",
    "does not open DB",
    "does not execute SQL",
    "no route",
    "no UI write action",
    "no schema/migration/dependency",
    "Product write remains blocked",
    expectedReadyRecommendation,
    expectedNextSlice,
    "not product write implementation",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_skeleton_artifact_note",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_skeleton_no_browser_route",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_contract_tests_artifact_note",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_contract_tests_no_browser_route",
    ),
  );
  for (const smokeText of adjacentSmokeTexts) {
    for (const scriptName of allowedPackageScriptNames) {
      assert.ok(
        smokeText.includes(`"${scriptName}"`) || smokeText.includes(scriptName),
        `adjacent smoke must acknowledge ${scriptName}`,
      );
    }
  }
}

function assertForbiddenPatternsAbsent() {
  const combined = [helper, runner, readFileSync(smokePath, "utf8")].join("\n");
  assert.doesNotMatch(combined, /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i);
  assert.doesNotMatch(
    combined,
    new RegExp(
      `\\b(${[
        ["local", "Storage"].join(""),
        ["session", "Storage"].join(""),
        ["indexed", "DB"].join(""),
        ["document", "cookie"].join("\\."),
      ].join("|")})\\b`,
    ),
  );
  assert.doesNotMatch(combined, /\bnext\s+dev\b|npm\s+run\s+dev\b/);
  assert.doesNotMatch(
    combined,
    new RegExp(
      [
        ["fetch", "\\s*\\("].join(""),
        ["new", "\\s+", "Open", "AI", "\\s*\\("].join(""),
        ["web", "hook", "\\s*\\("].join(""),
        ["send", "Email", "\\s*\\("].join(""),
        ["slack", "\\s*\\("].join(""),
        ["provider", "Client", "\\s*\\("].join(""),
        ["retrieval", "Client", "\\s*\\("].join(""),
        ["rag", "Client", "\\s*\\("].join(""),
      ].join("|"),
      "i",
    ),
  );
}

function assertNoNonNullProductIds(value, label) {
  const paths = collectNonNullProductIdPaths(value);
  assert.deepEqual(paths, [], `${label}: non-null product IDs must be absent`);
}

function collectNonNullProductIdPaths(value, pathPrefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectNonNullProductIdPaths(item, `${pathPrefix}[${index}]`),
    );
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const pathName = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (productIdKeys.has(key)) {
      return nestedValue === null || nestedValue === undefined ? [] : [pathName];
    }
    return collectNonNullProductIdPaths(nestedValue, pathName);
  });
}

function isUiFilePath(filePath) {
  return /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
}

function isSchemaDbSqlPath(filePath) {
  return (
    /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
      filePath,
    ) || /^lib\/db(\.ts|\/)/.test(filePath)
  );
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
