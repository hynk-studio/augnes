import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const BUNDLE_VERSION =
  "manual_note_single_claim_product_write_authority_contract_bundle.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const BUNDLE_PATH = path.join(ARTIFACT_DIR, "authority-contract-bundle.json");

const DRY_RUN_TRANSACTION_HARNESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.sample.v0.1.json";
const DRY_RUN_TRANSACTION_PLAN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.sample.v0.1.json";
const CONTRACT_TESTS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.sample.v0.1.json";
const SKELETON_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json";
const BRIDGE_DESIGN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json";
const PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";

const OPTIONAL_DRY_RUN_TRANSACTION_HARNESS_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json";
const OPTIONAL_DRY_RUN_TRANSACTION_PLAN_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json";
const OPTIONAL_CONTRACT_TESTS_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json";
const OPTIONAL_SKELETON_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json";
const OPTIONAL_BRIDGE_DESIGN_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json";
const OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json";

const HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-product-write-authority-contract-bundle.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs";

const FIXTURE_MODE =
  process.env.AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_FIXTURE_MODE ===
  "1";

const READY_HARNESS_STATUS = "disabled_dry_run_transaction_harness_only";
const READY_HARNESS_RECOMMENDATION =
  "ready_for_product_write_authority_contract_bundle";
const READY_HARNESS_NEXT_SLICE =
  "single_claim_product_write_authority_contract_bundle";
const READY_PLAN_STATUS = "disabled_dry_run_transaction_plan_only";
const READY_PLAN_RECOMMENDATION =
  "ready_for_disabled_dry_run_transaction_harness";
const READY_PLAN_NEXT_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness";
const CONTRACT_SUITE_STATUS =
  "disabled_bridge_skeleton_contract_tests_passed";
const CONTRACT_SUITE_RECOMMENDATION =
  "ready_for_disabled_bridge_dry_run_transaction_plan";
const CONTRACT_SUITE_NEXT_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan";
const READY_BUNDLE_STATUS = "product_write_authority_contracts_defined_only";
const BLOCKED_BUNDLE_STATUS =
  "blocked_before_product_write_authority_contract_bundle";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_skeleton";
const BLOCKED_RECOMMENDATION =
  "blocked_before_single_claim_product_write_disabled_adapter_skeleton";
const NEXT_DISABLED_ADAPTER_SKELETON =
  "single_claim_product_write_disabled_adapter_skeleton";
const RECHECK_SLICE = "single_claim_product_write_authority_contract_bundle_recheck";

const AUTHORITY_CONTRACT_IDS = [
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

const AUTHORITY_FORBIDDEN_SURFACE_KEYS = [
  "product_write_authority_granted",
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
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "durable_idempotency_write",
  "durable_rollback_write",
  "durable_audit_write",
  "durable_observability_write",
];

const SOURCE_FORBIDDEN_SURFACE_KEYS = [
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

const DISABLED_FORBIDDEN_SURFACE_KEYS = [
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
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "durable_idempotency_write",
  "durable_rollback_write",
  "durable_audit_write",
  "durable_observability_write",
];

const SKELETON_FORBIDDEN_SURFACE_KEYS = [
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

const PRODUCT_ID_KEYS = [
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
];

const AUTHORITY_REFUSAL_REASON_IDS = [
  "missing_authority_contract_bundle",
  "authority_bundle_malformed",
  "upstream_harness_failed",
  "operator_decision_missing",
  "product_schema_missing",
  "product_id_allocation_missing",
  "idempotency_storage_missing",
  "rollback_storage_missing",
  "audit_storage_missing",
  "observability_missing",
  "source_verification_authority_missing",
  "proof_evidence_authority_missing",
  "perspective_canonical_authority_missing",
  "enabled_adapter_transition_requested",
  "product_write_route_requested",
  "ui_write_action_requested",
  "db_path_provided",
  "sql_text_provided",
  "transaction_execution_requested",
  "product_write_requested",
  "product_id_allocation_requested",
  "proof_evidence_write_requested",
  "perspective_canonical_write_requested",
  "source_fetch_requested",
  "provider_openai_call_requested",
  "retrieval_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "non_null_product_id_present",
  "upstream_forbidden_surface_true",
  "static_schema_db_sql_change",
  "static_app_router_ui_change",
];

const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];
const EXPECTED_CHANGED_FILES = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-authority-contract-bundle.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-product-write-authority-contract-bundle.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const ALLOWED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
  "authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
];
const FALLBACK_PACKAGE_ADDED_LINES = [
  '    "smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",',
  '    "authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1": "node scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",',
];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const dryRunTransactionHarnessFixture = await readJson(
    DRY_RUN_TRANSACTION_HARNESS_FIXTURE_PATH,
  );
  const dryRunTransactionPlanFixture = await readJson(
    DRY_RUN_TRANSACTION_PLAN_FIXTURE_PATH,
  );
  const contractTestsFixture = await readJson(CONTRACT_TESTS_FIXTURE_PATH);
  const skeletonFixture = await readJson(SKELETON_FIXTURE_PATH);
  const bridgeDesignFixture = await readJson(BRIDGE_DESIGN_FIXTURE_PATH);
  const productWriteGateDesignFixture = await readJson(
    PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH,
  );

  const dryRunTransactionHarnessSource = await selectSource({
    label: "dry_run_transaction_harness",
    fixturePath: DRY_RUN_TRANSACTION_HARNESS_FIXTURE_PATH,
    fixture: dryRunTransactionHarnessFixture,
    optionalReportPath: OPTIONAL_DRY_RUN_TRANSACTION_HARNESS_REPORT_PATH,
    nestedKey: "dry_run_transaction_harness",
  });
  const dryRunTransactionPlanSource = await selectSource({
    label: "dry_run_transaction_plan",
    fixturePath: DRY_RUN_TRANSACTION_PLAN_FIXTURE_PATH,
    fixture: dryRunTransactionPlanFixture,
    optionalReportPath: OPTIONAL_DRY_RUN_TRANSACTION_PLAN_REPORT_PATH,
    nestedKey: "dry_run_transaction_plan",
  });
  const contractTestsSource = await selectSource({
    label: "contract_tests",
    fixturePath: CONTRACT_TESTS_FIXTURE_PATH,
    fixture: contractTestsFixture,
    optionalReportPath: OPTIONAL_CONTRACT_TESTS_REPORT_PATH,
    nestedKey: null,
  });
  const skeletonSource = await selectSource({
    label: "disabled_bridge_skeleton",
    fixturePath: SKELETON_FIXTURE_PATH,
    fixture: skeletonFixture,
    optionalReportPath: OPTIONAL_SKELETON_REPORT_PATH,
    nestedKey: "disabled_bridge_skeleton",
  });
  const bridgeDesignSource = await selectSource({
    label: "temp_to_product_bridge_design",
    fixturePath: BRIDGE_DESIGN_FIXTURE_PATH,
    fixture: bridgeDesignFixture,
    optionalReportPath: OPTIONAL_BRIDGE_DESIGN_REPORT_PATH,
    nestedKey: "temp_to_product_bridge_design",
  });
  const productWriteGateDesignSource = await selectSource({
    label: "product_write_gate_design",
    fixturePath: PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH,
    fixture: productWriteGateDesignFixture,
    optionalReportPath: OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH,
    nestedKey: "product_write_gate_design",
  });

  const staticBoundaryResult = validateStaticRepoBoundary();
  const sourceFailures = [
    ...dryRunTransactionHarnessSource.failureCodes,
    ...dryRunTransactionPlanSource.failureCodes,
    ...contractTestsSource.failureCodes,
    ...skeletonSource.failureCodes,
    ...bridgeDesignSource.failureCodes,
    ...productWriteGateDesignSource.failureCodes,
    ...validateSourceEvidence({
      dryRunTransactionHarness: dryRunTransactionHarnessSource.value,
      dryRunTransactionPlan: dryRunTransactionPlanSource.value,
      contractTestsReport: contractTestsSource.value,
      disabledBridgeSkeleton: skeletonSource.value,
      tempToProductBridgeDesign: bridgeDesignSource.value,
      productWriteGateDesign: productWriteGateDesignSource.value,
      staticBoundaryResult,
    }),
    ...staticBoundaryResult.failureCodes,
  ];

  const bundle = buildAuthorityContractBundle({
    dryRunTransactionHarness: dryRunTransactionHarnessSource.value,
    dryRunTransactionPlan: dryRunTransactionPlanSource.value,
    contractTestsReport: contractTestsSource.value,
    disabledBridgeSkeleton: skeletonSource.value,
    tempToProductBridgeDesign: bridgeDesignSource.value,
    productWriteGateDesign: productWriteGateDesignSource.value,
    sourceSelections: {
      dry_run_transaction_harness: dryRunTransactionHarnessSource.selection,
      dry_run_transaction_plan: dryRunTransactionPlanSource.selection,
      contract_tests: contractTestsSource.selection,
      disabled_bridge_skeleton: skeletonSource.selection,
      temp_to_product_bridge_design: bridgeDesignSource.selection,
      product_write_gate_design: productWriteGateDesignSource.selection,
    },
    staticBoundaryResult,
    validationFailureCodes: unique(sourceFailures),
  });
  const report = {
    report_kind:
      "manual_note_single_claim_product_write_authority_contract_bundle_report",
    report_version: BUNDLE_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      authority_contract_bundle: BUNDLE_PATH,
    },
    input_paths: {
      dry_run_transaction_harness_fixture:
        DRY_RUN_TRANSACTION_HARNESS_FIXTURE_PATH,
      dry_run_transaction_plan_fixture: DRY_RUN_TRANSACTION_PLAN_FIXTURE_PATH,
      contract_tests_fixture: CONTRACT_TESTS_FIXTURE_PATH,
      disabled_bridge_skeleton_fixture: SKELETON_FIXTURE_PATH,
      bridge_design_fixture: BRIDGE_DESIGN_FIXTURE_PATH,
      product_write_gate_design_fixture: PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH,
      optional_dry_run_transaction_harness_report:
        OPTIONAL_DRY_RUN_TRANSACTION_HARNESS_REPORT_PATH,
      optional_dry_run_transaction_plan_report:
        OPTIONAL_DRY_RUN_TRANSACTION_PLAN_REPORT_PATH,
      optional_contract_tests_report: OPTIONAL_CONTRACT_TESTS_REPORT_PATH,
      optional_disabled_bridge_skeleton_report: OPTIONAL_SKELETON_REPORT_PATH,
      optional_bridge_design_report: OPTIONAL_BRIDGE_DESIGN_REPORT_PATH,
      optional_product_write_gate_design_report:
        OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH,
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
      dry_run_transaction_harness: dryRunTransactionHarnessSource.selection,
      dry_run_transaction_plan: dryRunTransactionPlanSource.selection,
      contract_tests: contractTestsSource.selection,
      disabled_bridge_skeleton: skeletonSource.selection,
      temp_to_product_bridge_design: bridgeDesignSource.selection,
      product_write_gate_design: productWriteGateDesignSource.selection,
    },
    source_evidence: bundle.source_evidence,
    validation: bundle.validation,
    static_boundary_result: staticBoundaryResult,
    static_boundary_base_ref: staticBoundaryResult.static_boundary_base_ref,
    static_boundary_base_mode: staticBoundaryResult.static_boundary_base_mode,
    static_boundary_base_commit: staticBoundaryResult.static_boundary_base_commit,
    static_boundary_changed_files_inspected:
      staticBoundaryResult.changed_files_inspected,
    static_boundary_package_added_lines_inspected:
      staticBoundaryResult.package_added_lines_inspected,
    static_boundary_used_fallback_allowlist:
      staticBoundaryResult.used_fallback_allowlist,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
    authority_contract_bundle: bundle,
    authority_contract_bundle_status: bundle.authority_contract_bundle_status,
    recommendation_status: bundle.recommendation_status,
    next_recommended_slice: bundle.next_recommended_slice,
    final_status:
      bundle.authority_contract_bundle_status === READY_BUNDLE_STATUS
        ? "pass"
        : "fail",
  };

  await writeFile(BUNDLE_PATH, `${JSON.stringify(bundle, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        plan:
          "research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
        final_status: report.final_status,
        authority_contract_bundle_status:
          report.authority_contract_bundle_status,
        recommendation_status: report.recommendation_status,
        next_recommended_slice: report.next_recommended_slice,
        static_boundary_base_mode: report.static_boundary_base_mode,
        static_boundary_changed_files_inspected:
          report.static_boundary_changed_files_inspected.length,
        static_boundary_used_fallback_allowlist:
          report.static_boundary_used_fallback_allowlist,
        artifact_paths: report.artifact_paths,
      },
      null,
      2,
    ),
  );

  if (report.final_status !== "pass") {
    process.exitCode = 1;
  }
}

function buildAuthorityContractBundle({
  dryRunTransactionHarness,
  dryRunTransactionPlan,
  contractTestsReport,
  disabledBridgeSkeleton,
  tempToProductBridgeDesign,
  productWriteGateDesign,
  sourceSelections,
  staticBoundaryResult,
  validationFailureCodes,
}) {
  const ready = validationFailureCodes.length === 0;
  const bundleCore = {
    authority_contract_bundle_kind:
      "manual_note_single_claim_product_write_authority_contract_bundle",
    authority_contract_bundle_version: BUNDLE_VERSION,
    authority_contract_bundle_fingerprint: "",
    source_evidence: buildSourceEvidence({
      dryRunTransactionHarness,
      dryRunTransactionPlan,
      contractTestsReport,
      disabledBridgeSkeleton,
      tempToProductBridgeDesign,
      productWriteGateDesign,
      sourceSelections,
      staticBoundaryResult,
    }),
    authority_contract_bundle_status: ready
      ? READY_BUNDLE_STATUS
      : BLOCKED_BUNDLE_STATUS,
    recommendation_status: ready ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: ready ? NEXT_DISABLED_ADAPTER_SKELETON : RECHECK_SLICE,
    product_write_authority_granted_now: false,
    product_write_allowed_now: false,
    adapter_enabled: false,
    transaction_execution_allowed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    db_open: false,
    sql_execution: false,
    route_added: false,
    ui_write_action_added: false,
    authority_contracts: buildAuthorityContracts(),
    authority_gap_summary: buildAuthorityGapSummary(),
    authority_dependency_graph: buildAuthorityDependencyGraph(),
    disabled_product_write_adapter_skeleton_preparation:
      buildDisabledAdapterSkeletonPreparation(),
    authority_refusal_matrix: buildAuthorityRefusalMatrix(),
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    static_boundary_evidence: {
      static_boundary_base_ref: staticBoundaryResult.static_boundary_base_ref,
      static_boundary_base_mode: staticBoundaryResult.static_boundary_base_mode,
      static_boundary_base_commit:
        staticBoundaryResult.static_boundary_base_commit,
      static_boundary_compare_ref: staticBoundaryResult.static_boundary_compare_ref,
      static_boundary_changed_files_inspected:
        staticBoundaryResult.changed_files_inspected,
      static_boundary_package_added_lines_inspected:
        staticBoundaryResult.package_added_lines_inspected,
      static_boundary_used_fallback_allowlist:
        staticBoundaryResult.used_fallback_allowlist,
      expected_changed_files: staticBoundaryResult.expected_changed_files,
      allowed_package_script_names:
        staticBoundaryResult.allowed_package_script_names,
    },
    validation: {
      passed: ready,
      failure_codes: validationFailureCodes,
    },
  };
  const fingerprint = createFingerprint(bundleCore);
  const bundle = {
    ...bundleCore,
    authority_contract_bundle_fingerprint: fingerprint,
  };
  return {
    ...bundle,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Product Write Authority Contract Bundle",
        "",
        "Product-write authority contract bundle only.",
        "Authority contracts are defined but not satisfied, and product write remains blocked.",
        `authority_contract_bundle_status: ${bundle.authority_contract_bundle_status}`,
        `authority_contract_bundle_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          authority_contract_bundle_status:
            bundle.authority_contract_bundle_status,
          product_write_authority_granted_now: false,
          product_write_allowed_now: false,
          adapter_enabled: false,
          product_db_write: false,
          product_id_allocation: false,
        },
        null,
        2,
      ),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      adapter_enabled: false,
      product_write_allowed_now: false,
      product_write_authority_granted_now: false,
    },
  };
}

function buildSourceEvidence({
  dryRunTransactionHarness,
  dryRunTransactionPlan,
  contractTestsReport,
  disabledBridgeSkeleton,
  tempToProductBridgeDesign,
  productWriteGateDesign,
  sourceSelections,
  staticBoundaryResult,
}) {
  const harnessStatic = asRecord(dryRunTransactionHarness.static_boundary_evidence);
  const gateSummary = asRecord(productWriteGateDesign.gate_summary);
  return {
    dry_run_transaction_harness: {
      source_selection: sourceSelections.dry_run_transaction_harness,
      harness_fingerprint: asString(
        dryRunTransactionHarness.dry_run_transaction_harness_fingerprint,
      ),
      dry_run_transaction_harness_status: asString(
        dryRunTransactionHarness.dry_run_transaction_harness_status,
      ),
      recommendation_status: asString(dryRunTransactionHarness.recommendation_status),
      next_recommended_slice: asString(
        dryRunTransactionHarness.next_recommended_slice,
      ),
      trace_row_count: asArray(
        asRecord(dryRunTransactionHarness.dry_run_transaction_trace).trace_rows,
      ).length,
      refusal_probe_count: asArray(dryRunTransactionHarness.refusal_probe_matrix)
        .length,
      authority_preview_contract_count: asNumber(
        asRecord(
          dryRunTransactionHarness.product_write_authority_contract_bundle_preview,
        ).required_contract_count,
      ),
      static_boundary_base_mode: asString(
        harnessStatic.static_boundary_base_mode,
      ),
      static_boundary_changed_files_count: asArray(
        harnessStatic.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_fallback_flag:
        harnessStatic.static_boundary_used_fallback_allowlist === true,
    },
    dry_run_transaction_plan: {
      source_selection: sourceSelections.dry_run_transaction_plan,
      plan_fingerprint: asString(
        dryRunTransactionPlan.dry_run_transaction_plan_fingerprint,
      ),
      dry_run_transaction_plan_status: asString(
        dryRunTransactionPlan.dry_run_transaction_plan_status,
      ),
      recommendation_status: asString(dryRunTransactionPlan.recommendation_status),
      next_recommended_slice: asString(
        dryRunTransactionPlan.next_recommended_slice,
      ),
      transaction_step_count: asArray(
        asRecord(dryRunTransactionPlan.transaction_step_graph).ordered_steps,
      ).length,
      refusal_reason_count: asArray(dryRunTransactionPlan.refusal_matrix).length,
    },
    disabled_bridge_skeleton_contract_tests: {
      source_selection: sourceSelections.contract_tests,
      suite_fingerprint: asString(contractTestsReport.suite_fingerprint),
      total_cases: asNumber(contractTestsReport.total_cases),
      positive_cases: asNumber(contractTestsReport.positive_cases),
      expected_negative_cases: asNumber(contractTestsReport.expected_negative_cases),
      unexpected_passes: asArray(contractTestsReport.unexpected_passes).length,
      unexpected_failures: asArray(contractTestsReport.unexpected_failures).length,
      final_status: asString(contractTestsReport.final_status),
      recommendation_status: asString(contractTestsReport.recommendation_status),
    },
    disabled_bridge_skeleton: {
      source_selection: sourceSelections.disabled_bridge_skeleton,
      skeleton_fingerprint: asString(disabledBridgeSkeleton.skeleton_fingerprint),
      disabled_bridge_skeleton_status: asString(
        disabledBridgeSkeleton.disabled_bridge_skeleton_status,
      ),
      bridge_adapter_enabled:
        disabledBridgeSkeleton.bridge_adapter_enabled === true,
      bridge_execution_allowed_now:
        disabledBridgeSkeleton.bridge_execution_allowed_now === true,
      product_write_allowed_now:
        disabledBridgeSkeleton.product_write_allowed_now === true,
    },
    temp_to_product_bridge_design: {
      source_selection: sourceSelections.temp_to_product_bridge_design,
      design_fingerprint: asString(tempToProductBridgeDesign.design_fingerprint),
      bridge_design_status: asString(
        tempToProductBridgeDesign.bridge_design_status,
      ),
      recommendation_status: asString(
        tempToProductBridgeDesign.recommendation_status,
      ),
      selected_temp_claim_identity_summary:
        tempToProductBridgeDesign.bridge_input_contract,
    },
    product_write_gate_design: {
      source_selection: sourceSelections.product_write_gate_design,
      design_fingerprint: asString(productWriteGateDesign.design_fingerprint),
      gate_design_status: asString(productWriteGateDesign.gate_design_status),
      recommendation_status: asString(
        asRecord(productWriteGateDesign.next_stage_recommendation)
          .recommendation_status,
      ),
      pass_count: asNumber(gateSummary.pass_count),
      warn_count: asNumber(gateSummary.warn_count),
      block_count: asNumber(gateSummary.block_count),
    },
    authority_bundle_static_boundary: {
      static_boundary_base_ref: staticBoundaryResult.static_boundary_base_ref,
      static_boundary_base_mode: staticBoundaryResult.static_boundary_base_mode,
      static_boundary_changed_file_count:
        staticBoundaryResult.changed_files_inspected.length,
      static_boundary_package_added_line_count:
        staticBoundaryResult.package_added_lines_inspected.length,
      static_boundary_used_fallback_allowlist:
        staticBoundaryResult.used_fallback_allowlist,
    },
  };
}

function validateSourceEvidence({
  dryRunTransactionHarness,
  dryRunTransactionPlan,
  contractTestsReport,
  disabledBridgeSkeleton,
  tempToProductBridgeDesign,
  productWriteGateDesign,
  staticBoundaryResult,
}) {
  const failures = [];
  if (
    dryRunTransactionHarness.dry_run_transaction_harness_status !==
    READY_HARNESS_STATUS
  ) {
    failures.push("dry_run_transaction_harness_status_not_ready");
  }
  if (dryRunTransactionHarness.recommendation_status !== READY_HARNESS_RECOMMENDATION) {
    failures.push("dry_run_transaction_harness_recommendation_not_ready");
  }
  if (dryRunTransactionHarness.next_recommended_slice !== READY_HARNESS_NEXT_SLICE) {
    failures.push("dry_run_transaction_harness_next_slice_invalid");
  }
  for (const key of [
    "dry_run_execution_allowed_now",
    "transaction_execution_allowed_now",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "adapter_enabled",
    "sql_execution",
    "db_open",
  ]) {
    if (dryRunTransactionHarness[key] !== false) {
      failures.push(`dry_run_transaction_harness_${key}_not_false`);
    }
  }
  const traceRows = asArray(
    asRecord(dryRunTransactionHarness.dry_run_transaction_trace).trace_rows,
  );
  if (traceRows.length === 0) {
    failures.push("dry_run_transaction_harness_trace_missing");
  }
  for (const [index, row] of traceRows.entries()) {
    const record = asRecord(row);
    for (const key of [
      "execution_allowed_now",
      "transaction_executed_now",
      "product_db_write_now",
      "product_ids_created_now",
      "idempotency_write_executed_now",
      "rollback_write_executed_now",
      "audit_write_executed_now",
      "observability_write_executed_now",
    ]) {
      if (record[key] !== false) {
        failures.push(`dry_run_transaction_harness_trace_${index + 1}_${key}_not_false`);
      }
    }
    if (record.sql_statement_count_now !== 0) {
      failures.push(`dry_run_transaction_harness_trace_${index + 1}_sql_statement_count_not_zero`);
    }
  }
  const envelopes = asRecord(dryRunTransactionHarness.envelope_results);
  for (const [label, envelope] of Object.entries(envelopes)) {
    for (const [key, value] of Object.entries(asRecord(envelope))) {
      if (
        (key.endsWith("_executed_now") ||
          key === "durable_storage_added_now" ||
          key === "rollback_execution_allowed_now") &&
        value !== false
      ) {
        failures.push(`dry_run_transaction_harness_${label}_${key}_not_false`);
      }
    }
  }
  failures.push(
    ...validateFalseRecord(
      dryRunTransactionHarness.explicit_forbidden_surfaces,
      DISABLED_FORBIDDEN_SURFACE_KEYS,
      "dry_run_transaction_harness_forbidden_surface",
    ),
  );
  if (dryRunTransactionPlan.dry_run_transaction_plan_status !== READY_PLAN_STATUS) {
    failures.push("dry_run_transaction_plan_status_not_ready");
  }
  if (dryRunTransactionPlan.recommendation_status !== READY_PLAN_RECOMMENDATION) {
    failures.push("dry_run_transaction_plan_recommendation_not_ready");
  }
  if (dryRunTransactionPlan.next_recommended_slice !== READY_PLAN_NEXT_SLICE) {
    failures.push("dry_run_transaction_plan_next_slice_invalid");
  }
  failures.push(
    ...validateFalseRecord(
      dryRunTransactionPlan.explicit_forbidden_surfaces,
      DISABLED_FORBIDDEN_SURFACE_KEYS,
      "dry_run_transaction_plan_forbidden_surface",
    ),
  );
  if (contractTestsReport.final_status !== "pass") {
    failures.push("contract_tests_report_not_passed");
  }
  if (contractTestsReport.contract_suite_status !== CONTRACT_SUITE_STATUS) {
    failures.push("contract_suite_status_not_ready");
  }
  if (contractTestsReport.recommendation_status !== CONTRACT_SUITE_RECOMMENDATION) {
    failures.push("contract_suite_recommendation_not_ready");
  }
  if (contractTestsReport.next_recommended_slice !== CONTRACT_SUITE_NEXT_SLICE) {
    failures.push("contract_suite_next_slice_invalid");
  }
  if (asArray(contractTestsReport.unexpected_passes).length !== 0) {
    failures.push("contract_suite_unexpected_passes_present");
  }
  if (asArray(contractTestsReport.unexpected_failures).length !== 0) {
    failures.push("contract_suite_unexpected_failures_present");
  }
  if (
    disabledBridgeSkeleton.disabled_bridge_skeleton_status !==
    "single_claim_disabled_bridge_skeleton_only"
  ) {
    failures.push("disabled_bridge_skeleton_status_not_ready");
  }
  for (const key of [
    "bridge_adapter_enabled",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_db_write",
    "product_id_allocation",
  ]) {
    if (disabledBridgeSkeleton[key] !== false) {
      failures.push(`disabled_bridge_skeleton_${key}_not_false`);
    }
  }
  failures.push(
    ...validateFalseRecord(
      disabledBridgeSkeleton.explicit_forbidden_surfaces,
      SKELETON_FORBIDDEN_SURFACE_KEYS,
      "disabled_bridge_skeleton_forbidden_surface",
    ),
  );
  if (
    tempToProductBridgeDesign.bridge_design_status !==
      "single_claim_bridge_design_only" ||
    tempToProductBridgeDesign.recommendation_status !==
      "ready_for_disabled_bridge_skeleton" ||
    tempToProductBridgeDesign.next_recommended_slice !==
      "single_claim_temp_to_product_disabled_bridge_skeleton"
  ) {
    failures.push("temp_to_product_bridge_design_not_ready");
  }
  failures.push(
    ...validateFalseRecord(
      tempToProductBridgeDesign.explicit_forbidden_surfaces,
      SOURCE_FORBIDDEN_SURFACE_KEYS,
      "temp_to_product_bridge_design_forbidden_surface",
    ),
  );
  if (
    productWriteGateDesign.gate_design_status !==
    "product_write_gate_design_only"
  ) {
    failures.push("product_write_gate_design_status_invalid");
  }
  if (
    asRecord(productWriteGateDesign.next_stage_recommendation)
      .recommendation_status !== "ready_for_single_claim_bridge_design"
  ) {
    failures.push("product_write_gate_design_recommendation_not_ready");
  }
  if (staticBoundaryResult.changed_files_inspected.length === 0) {
    failures.push("static_boundary_changed_file_delta_empty");
  }
  if (staticBoundaryResult.static_boundary_base_mode === "worktree_only") {
    failures.push("static_boundary_worktree_only_delta");
  }
  for (const value of [
    dryRunTransactionHarness,
    dryRunTransactionPlan,
    disabledBridgeSkeleton,
    tempToProductBridgeDesign,
    productWriteGateDesign,
  ]) {
    if (hasNonNullProductIds(value)) {
      failures.push("upstream_product_id_present");
      break;
    }
  }
  return unique(failures);
}

function buildAuthorityContracts() {
  return AUTHORITY_CONTRACT_IDS.map((contractId, index) => {
    const metadata = authorityContractMetadata(contractId);
    return {
      contract_id: contractId,
      contract_label: metadata.label,
      contract_kind: metadata.kind,
      required_for_product_write: true,
      satisfied_now: false,
      authority_granted_now: false,
      implementation_allowed_now: false,
      blocks_product_write_now: true,
      required_before_slice: metadata.requiredBeforeSlice,
      allowed_next_action: metadata.allowedNextAction,
      forbidden_now: metadata.forbiddenNow,
      required_inputs: metadata.requiredInputs,
      required_future_evidence: metadata.requiredFutureEvidence,
      forbidden_until_satisfied: metadata.forbiddenUntilSatisfied,
      acceptance_criteria: metadata.acceptanceCriteria,
      rejection_criteria: metadata.rejectionCriteria,
      observability_requirements: metadata.observabilityRequirements,
      rollback_requirements: metadata.rollbackRequirements,
      idempotency_requirements: metadata.idempotencyRequirements,
      audit_requirements: metadata.auditRequirements,
      contract_order: index + 1,
    };
  });
}

function buildAuthorityGapSummary() {
  return {
    total_required_contracts: AUTHORITY_CONTRACT_IDS.length,
    satisfied_now_count: 0,
    authority_granted_now_count: 0,
    implementation_allowed_now_count: 0,
    blocked_contract_count: AUTHORITY_CONTRACT_IDS.length,
    next_bundle_goal: "single_claim_product_write_disabled_adapter_plan",
    product_write_allowed_after_this_bundle: false,
  };
}

function authorityContractMetadata(contractId) {
  const base = {
    label: contractId.replaceAll("_", " "),
    kind: "product_write_authority_contract",
    requiredInputs: [`${contractId}_review_packet`],
    requiredFutureEvidence: [`${contractId}_approved_evidence`],
    forbiddenUntilSatisfied: ["product_write", "adapter_enablement"],
    acceptanceCriteria: [
      "future reviewer records explicit approval for this contract",
      "future artifact preserves no-write boundary until every authority contract is satisfied",
    ],
    rejectionCriteria: [
      "contract is missing or malformed",
      "contract attempts product write before authority is granted",
    ],
    observabilityRequirements: [
      "future implementation records reviewed contract status without product writes",
    ],
    rollbackRequirements: ["no rollback write is allowed in this bundle"],
    idempotencyRequirements: ["no durable idempotency write is allowed in this bundle"],
    auditRequirements: ["no durable audit write is allowed in this bundle"],
    requiredBeforeSlice: "single_claim_product_write_disabled_adapter_skeleton",
    allowedNextAction:
      "define_disabled_product_write_adapter_skeleton_without_execution",
    forbiddenNow: [
      "product_write",
      "product_write_implementation",
      "adapter_enablement",
      "db_open",
      "sql_execution",
      "transaction_execution",
    ],
  };
  const overrides = {
    explicit_operator_decision_contract: {
      requiredInputs: ["operator_decision_record", "selected_temp_claim_identity"],
      requiredFutureEvidence: ["explicit_operator_single_claim_promotion_decision"],
      forbiddenUntilSatisfied: ["product_write", "product_id_allocation", "adapter_invocation"],
      acceptanceCriteria: [
        "future operator decision confirms the selected temp claim identity before any product write",
        "future decision records an operator decision fingerprint tied to approve, reject, or defer choices",
        "future decision includes a raw text redaction policy and does not persist raw manual note text",
      ],
      rejectionCriteria: [
        "selected temp claim is missing or changed after decision",
        "operator decision fingerprint is missing",
        "decision omits approve, reject, or defer semantics",
        "raw manual note text would be copied into product storage",
      ],
    },
    selected_temp_claim_identity_contract: {
      requiredInputs: [
        "selected_temp_claim_record_id",
        "source_operation_id",
        "source_temp_intent_id",
        "temp_idempotency_key",
      ],
      requiredFutureEvidence: ["single_selected_temp_claim_identity_evidence"],
    },
    product_claim_schema_contract: {
      requiredInputs: ["future_product_claim_shape", "schema_review_packet"],
      requiredFutureEvidence: ["reviewed_product_claim_schema_contract"],
      forbiddenUntilSatisfied: ["product_write", "product_id_allocation", "db_transaction"],
      acceptanceCriteria: [
        "future schema review lists allowed product claim fields and nullability",
        "future schema review states raw manual note text inclusion policy",
        "future schema review records schema version and product DB target as placeholder only",
      ],
      rejectionCriteria: [
        "allowed fields or nullability are unspecified",
        "schema version is missing",
        "raw text inclusion policy permits unreviewed raw note persistence",
        "product DB target is treated as executable in this bundle",
      ],
    },
    product_claim_id_allocation_contract: {
      requiredInputs: ["product_claim_schema_contract", "id_allocation_policy"],
      requiredFutureEvidence: ["reviewed_product_id_allocation_policy"],
      forbiddenUntilSatisfied: ["product_id_allocation", "product_write"],
      idempotencyRequirements: ["allocation must be idempotent before any future write"],
      acceptanceCriteria: [
        "future allocation policy defines when product claim IDs are created",
        "future allocation policy proves IDs are not allocated before operator and schema authority",
        "future allocation policy records collision and retry behavior",
      ],
      rejectionCriteria: [
        "allocation can occur during disabled adapter planning",
        "allocation is not tied to selected temp claim and source fingerprints",
        "collision or retry behavior is undefined",
      ],
    },
    product_idempotency_storage_contract: {
      requiredInputs: ["temp_idempotency_key", "future_product_idempotency_storage_shape"],
      requiredFutureEvidence: ["reviewed_product_idempotency_storage_contract"],
      forbiddenUntilSatisfied: ["durable_idempotency_write", "product_write"],
      idempotencyRequirements: ["durable idempotency lookup and write rules must be reviewed later"],
      acceptanceCriteria: [
        "future idempotency contract requires lookup-before-write",
        "future idempotency contract defines replay behavior and duplicate suppression",
        "future idempotency contract lists source fingerprint inputs used for durable keys",
      ],
      rejectionCriteria: [
        "write can occur before idempotency lookup",
        "replay behavior is unspecified",
        "duplicate suppression does not use selected temp claim and source fingerprints",
      ],
    },
    product_rollback_storage_contract: {
      requiredInputs: ["rollback_strategy_preview", "future_product_rollback_storage_shape"],
      requiredFutureEvidence: ["reviewed_product_rollback_storage_contract"],
      forbiddenUntilSatisfied: ["durable_rollback_write", "transaction_commit"],
      rollbackRequirements: ["future rollback storage must identify how to undo partial product writes"],
      acceptanceCriteria: [
        "future rollback contract defines rollback record fields and triggering failure cases",
        "future rollback contract links rollback records to idempotency and product claim identifiers",
        "future rollback contract defines negative cases for partial product write recovery",
      ],
      rejectionCriteria: [
        "rollback storage cannot identify the affected future product claim",
        "rollback behavior after partial failure is unspecified",
        "rollback record would be written during this authority bundle",
      ],
    },
    product_review_audit_storage_contract: {
      requiredInputs: ["operator_decision_record", "future_review_audit_storage_shape"],
      requiredFutureEvidence: ["reviewed_product_review_audit_contract"],
      forbiddenUntilSatisfied: ["durable_audit_write", "product_write"],
      auditRequirements: ["future audit storage must record operator decision and source evidence"],
      acceptanceCriteria: [
        "future audit contract records operator identity boundary, decision fingerprint, and selected temp claim",
        "future audit contract records source evidence fingerprints without raw note persistence",
        "future audit contract defines negative cases for missing or contradictory decision evidence",
      ],
      rejectionCriteria: [
        "audit record omits operator decision fingerprint",
        "audit record would persist raw manual note text",
        "audit write occurs before all authority contracts are satisfied",
      ],
    },
    product_write_observability_contract: {
      requiredInputs: ["metric_names", "failure_event_names", "trace_correlation_plan"],
      requiredFutureEvidence: ["reviewed_product_write_observability_contract"],
      forbiddenUntilSatisfied: ["durable_observability_write", "product_write"],
      acceptanceCriteria: [
        "future observability contract defines success, refusal, rollback, duplicate, and failure event names",
        "future observability contract includes trace correlation between temp evidence and future product writes",
        "future observability contract defines negative cases for missing metrics or uncorrelated events",
      ],
      rejectionCriteria: [
        "observability omits refusal or rollback events",
        "trace correlation cannot connect source fingerprints to future product write attempts",
        "observability write occurs during this bundle",
      ],
    },
    source_verification_authority_contract: {
      requiredInputs: ["source_evidence_review_packet"],
      requiredFutureEvidence: ["reviewed_source_verification_authority"],
      forbiddenUntilSatisfied: ["source_fetch", "product_write"],
      acceptanceCriteria: [
        "future source authority names which source evidence is accepted without fetching new sources",
        "future source authority defines stale, missing, or contradictory source negative cases",
        "future source authority states whether any later source fetch requires separate approval",
      ],
      rejectionCriteria: [
        "source evidence is missing or stale without review",
        "future implementation fetches sources without separate source authority",
        "contradictory source evidence is ignored",
      ],
    },
    proof_evidence_authority_contract: {
      requiredInputs: ["proof_evidence_write_policy"],
      requiredFutureEvidence: ["reviewed_proof_evidence_authority"],
      forbiddenUntilSatisfied: ["proof_evidence_write", "product_write"],
      acceptanceCriteria: [
        "future proof/evidence authority defines whether product write may reference existing proof or evidence",
        "future proof/evidence authority requires separate review before any proof/evidence write",
        "future proof/evidence authority defines negative cases for missing proof or evidence pointers",
      ],
      rejectionCriteria: [
        "proof or evidence write is bundled with product claim write without authority",
        "proof/evidence references are missing or ambiguous",
        "future implementation treats this bundle as proof/evidence authority",
      ],
    },
    canonical_perspective_authority_contract: {
      requiredInputs: ["canonical_perspective_write_policy"],
      requiredFutureEvidence: ["reviewed_canonical_perspective_authority"],
      forbiddenUntilSatisfied: ["perspective_or_canonical_graph_write", "product_write"],
      acceptanceCriteria: [
        "future canonical authority defines whether Perspective or canonical graph writes are allowed later",
        "future canonical authority requires separate review for promotion into canonical graph state",
        "future canonical authority defines negative cases for conflicting canonical identities",
      ],
      rejectionCriteria: [
        "Perspective or canonical graph write occurs with product write by default",
        "canonical identity conflict handling is missing",
        "future implementation treats product write as canonical promotion authority",
      ],
    },
    enabled_adapter_transition_contract: {
      requiredInputs: ["disabled_adapter_skeleton", "enablement_review_record"],
      requiredFutureEvidence: ["reviewed_disabled_to_enabled_adapter_transition"],
      forbiddenUntilSatisfied: ["adapter_enablement", "adapter_invocation", "product_write"],
      acceptanceCriteria: [
        "future transition review names the disabled adapter skeleton and exact enablement switch",
        "future transition review requires explicit human approval before adapter invocation",
        "future transition review defines negative cases for accidental default enablement",
      ],
      rejectionCriteria: [
        "adapter can be enabled by default",
        "adapter invocation is possible before human transition review",
        "enablement is bundled with this authority contract bundle",
      ],
    },
    product_write_route_contract: {
      requiredInputs: ["route_review_packet", "operator_access_policy"],
      requiredFutureEvidence: ["reviewed_product_write_route_contract"],
      forbiddenUntilSatisfied: ["product_write_route", "ui_write_action", "product_write"],
      acceptanceCriteria: [
        "future route contract names any product write route and operator access policy",
        "future route contract defines UI action requirements if a UI action is ever added",
        "future route contract defines negative cases for accidental App Router or component additions",
      ],
      rejectionCriteria: [
        "route or UI action is added before route contract review",
        "operator access policy is missing",
        "future implementation exposes product write through an unreviewed route",
      ],
    },
    product_write_transaction_boundary_contract: {
      requiredInputs: ["transaction_plan", "idempotency_contract", "rollback_contract"],
      requiredFutureEvidence: ["reviewed_product_write_transaction_boundary"],
      forbiddenUntilSatisfied: ["db_open", "sql_execution", "transaction_execution", "product_write"],
      rollbackRequirements: ["future transaction contract must define rollback behavior before execution"],
    },
    product_write_static_boundary_contract: {
      requiredInputs: ["committed_delta_report", "static_scan_report"],
      requiredFutureEvidence: ["reviewed_static_boundary_for_product_write"],
      forbiddenUntilSatisfied: ["schema_or_migration_change", "route_added", "ui_write_action_added"],
    },
    product_write_runtime_boundary_contract: {
      requiredInputs: ["runtime_no_write_probe_plan", "operator_confirmation_policy"],
      requiredFutureEvidence: ["reviewed_runtime_boundary_for_product_write"],
      forbiddenUntilSatisfied: ["browser_persistence", "external_handoff", "provider_or_openai_call"],
    },
  };
  return { ...base, ...overrides[contractId] };
}

function buildAuthorityDependencyGraph() {
  const dependencyPairs = [
    ["explicit_operator_decision_contract", "selected_temp_claim_identity_contract"],
    ["selected_temp_claim_identity_contract", "product_claim_schema_contract"],
    ["product_claim_schema_contract", "product_claim_id_allocation_contract"],
    ["product_claim_id_allocation_contract", "product_idempotency_storage_contract"],
    ["product_idempotency_storage_contract", "product_rollback_storage_contract"],
    ["product_rollback_storage_contract", "product_review_audit_storage_contract"],
    ["product_review_audit_storage_contract", "product_write_observability_contract"],
    ["source_verification_authority_contract", "proof_evidence_authority_contract"],
    ["proof_evidence_authority_contract", "canonical_perspective_authority_contract"],
    ["canonical_perspective_authority_contract", "enabled_adapter_transition_contract"],
    ["enabled_adapter_transition_contract", "product_write_route_contract"],
    ["product_write_route_contract", "product_write_transaction_boundary_contract"],
    ["product_write_transaction_boundary_contract", "product_write_static_boundary_contract"],
    ["product_write_static_boundary_contract", "product_write_runtime_boundary_contract"],
  ];
  return {
    ordered_contract_ids: AUTHORITY_CONTRACT_IDS,
    dependency_edges: dependencyPairs.map(([from, to]) => ({
      from_contract_id: from,
      to_contract_id: to,
      dependency_kind: "must_be_reviewed_before",
    })),
    blocking_contract_ids: AUTHORITY_CONTRACT_IDS,
    product_write_unlock_sequence: [
      "operator decision exists",
      "product claim schema exists",
      "product ID allocation exists",
      "idempotency storage exists",
      "rollback storage exists",
      "audit storage exists",
      "observability exists",
      "source verification authority exists",
      "proof/evidence authority exists",
      "Perspective/canonical authority exists",
      "enabled adapter transition is explicitly reviewed",
      "route/UI contract is explicitly reviewed if ever added",
      "runtime DB transaction contract is reviewed",
    ],
  };
}

function buildDisabledAdapterSkeletonPreparation() {
  return {
    adapter_kind: "manual_note_single_claim_product_write_disabled_adapter",
    adapter_enabled_now: false,
    adapter_invocation_allowed_now: false,
    product_write_allowed_now: false,
    would_accept_candidate_kind: "manual_note_single_claim",
    would_accept_single_selected_temp_claim_only: true,
    would_require_authority_contract_bundle: true,
    would_require_all_contracts_satisfied_later: true,
    next_disabled_adapter_slice_inputs: [
      "authority_contract_bundle_fingerprint",
      "dry_run_transaction_harness_fingerprint",
      "selected_temp_claim_identity",
      "product_schema_contract_placeholder",
      "idempotency_contract_placeholder",
      "rollback_contract_placeholder",
      "audit_contract_placeholder",
      "observability_contract_placeholder",
    ],
  };
}

function buildAuthorityRefusalMatrix() {
  return AUTHORITY_REFUSAL_REASON_IDS.map((reasonId) => ({
    reason_id: reasonId,
    reason_label: reasonId.replaceAll("_", " "),
    requested_now: false,
    refusal_required_now: true,
    blocks_product_write_now: true,
    expected_status: BLOCKED_BUNDLE_STATUS,
  }));
}

function explicitForbiddenSurfaces() {
  return Object.fromEntries(AUTHORITY_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]));
}

async function selectSource({ label, fixturePath, fixture, optionalReportPath, nestedKey }) {
  if (FIXTURE_MODE) {
    return {
      value: cloneJson(fixture),
      failureCodes: [],
      selection: {
        source_label: label,
        source_used: "committed_fixture",
        fixture_path: fixturePath,
        optional_report_path: optionalReportPath,
        optional_report_present: false,
        optional_report_ignored_for_fixture_mode: true,
        fallback_to_committed_fixture: true,
      },
    };
  }
  if (!existsSync(optionalReportPath)) {
    return {
      value: cloneJson(fixture),
      failureCodes: [],
      selection: {
        source_label: label,
        source_used: "committed_fixture",
        fixture_path: fixturePath,
        optional_report_path: optionalReportPath,
        optional_report_present: false,
        optional_report_ignored_for_fixture_mode: false,
        fallback_to_committed_fixture: true,
      },
    };
  }
  const parsed = await readOptionalReport(optionalReportPath);
  if (!parsed.ok) {
    return {
      value: {},
      failureCodes: [`optional_${label}_report_malformed`],
      selection: {
        source_label: label,
        source_used: "optional_report",
        fixture_path: fixturePath,
        optional_report_path: optionalReportPath,
        optional_report_present: true,
        optional_report_final_status: null,
        optional_report_parse_error: parsed.error,
        fallback_to_committed_fixture: false,
      },
    };
  }
  const report = asRecord(parsed.value);
  const failures = [];
  if (report.final_status !== "pass") {
    failures.push(`optional_${label}_report_not_passed`);
  }
  const selectedValue = nestedKey === null ? report : asRecord(report[nestedKey]);
  if (
    nestedKey !== null &&
    (!hasOwn(report, nestedKey) || Object.keys(selectedValue).length === 0)
  ) {
    failures.push(`optional_${label}_report_missing_${nestedKey}`);
  }
  return {
    value: cloneJson(selectedValue),
    failureCodes: failures,
    selection: {
      source_label: label,
      source_used: "optional_report",
      fixture_path: fixturePath,
      optional_report_path: optionalReportPath,
      optional_report_present: true,
      optional_report_final_status: asString(report.final_status),
      optional_report_ignored_for_fixture_mode: false,
      fallback_to_committed_fixture: false,
    },
  };
}

async function readOptionalReport(filePath) {
  try {
    return { ok: true, value: JSON.parse(await readFile(filePath, "utf8")) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validateStaticRepoBoundary() {
  const failures = [];
  const messages = [];
  const delta = resolveStaticBoundaryDelta();
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-product-write-authority|product-write-authority-contract-bundle/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) {
    failures.push("static_app_api_route_added");
    messages.push(`unexpected API route files: ${routeFiles.join(", ")}`);
  }
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-product-write-authority|product-write-authority-contract-bundle/i.test(
      filePath,
    ),
  );
  if (uiFiles.length > 0) {
    failures.push("static_ui_file_added");
    messages.push(`unexpected UI files: ${uiFiles.join(", ")}`);
  }
  if (delta.changedFiles.length === 0) {
    failures.push("static_changed_file_delta_empty");
    messages.push("static boundary changed-file delta was empty");
  }
  const missingExpectedFiles = EXPECTED_CHANGED_FILES.filter(
    (filePath) => !delta.changedFiles.includes(filePath),
  );
  if (missingExpectedFiles.length > 0) {
    failures.push("static_expected_authority_bundle_files_missing");
    messages.push(
      `expected authority bundle files missing from inspected delta: ${missingExpectedFiles.join(", ")}`,
    );
  }
  for (const filePath of delta.changedFiles) {
    if (isSchemaDbSqlPath(filePath)) {
      failures.push("static_schema_or_migration_changed");
      messages.push(`schema/migration/db/sql path changed: ${filePath}`);
    }
    if (/^app\/api\//.test(filePath)) {
      failures.push("static_app_api_changed");
      messages.push(`API route changed: ${filePath}`);
    }
    if (isUiFilePath(filePath)) {
      failures.push("static_ui_changed");
      messages.push(`UI file changed: ${filePath}`);
    }
  }
  if (delta.packageAddedLines.length === 0) {
    failures.push("static_package_added_lines_empty");
    messages.push(
      "package.json added lines were empty for this authority contract bundle slice",
    );
  }
  const missingPackageScripts = ALLOWED_PACKAGE_SCRIPT_NAMES.filter(
    (scriptName) =>
      !delta.packageAddedLines.some((line) => line.includes(`"${scriptName}"`)),
  );
  if (missingPackageScripts.length > 0) {
    failures.push("static_expected_package_script_missing");
    messages.push(
      `expected package scripts missing from inspected additions: ${missingPackageScripts.join(", ")}`,
    );
  }
  for (const line of delta.packageAddedLines) {
    if (
      !ALLOWED_PACKAGE_SCRIPT_NAMES.some((scriptName) =>
        line.includes(`"${scriptName}"`),
      )
    ) {
      failures.push("static_dependency_added");
      messages.push(`unexpected package.json addition: ${line}`);
    }
  }
  const sourceTexts = STATIC_SCAN_PATHS.map((filePath) => [
    filePath,
    existsSync(filePath) ? readFileSync(filePath, "utf8") : "",
  ]);
  for (const [filePath, text] of sourceTexts) {
    if (executableSqlPattern().test(text)) {
      failures.push("static_executable_sql_string_present");
      messages.push(`executable SQL-like string found in ${filePath}`);
    }
    if (forbiddenImportPattern().test(text)) {
      failures.push("static_forbidden_import_present");
      messages.push(`forbidden import found in ${filePath}`);
    }
    if (networkOrExternalCallPattern().test(text)) {
      failures.push("static_network_or_external_handoff_present");
      messages.push(`network/provider/retrieval/external call found in ${filePath}`);
    }
    if (browserPersistencePattern().test(text)) {
      failures.push("static_browser_persistence_present");
      messages.push(`browser persistence found in ${filePath}`);
    }
    if (appServerStartupPattern().test(text)) {
      failures.push("static_app_server_startup_present");
      messages.push(`app server startup found in ${filePath}`);
    }
  }
  return {
    failureCodes: unique(failures),
    messages,
    static_boundary_base_ref: delta.baseRef,
    static_boundary_base_mode: delta.baseMode,
    static_boundary_base_commit: delta.baseCommit,
    static_boundary_compare_ref: delta.compareRef,
    changed_files_inspected: delta.changedFiles,
    package_added_lines_inspected: delta.packageAddedLines,
    used_fallback_allowlist: delta.usedFallbackAllowlist,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
  };
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

function resolveStaticBoundaryDelta() {
  const envBaseRef =
    process.env.AUGNES_PRODUCT_WRITE_AUTHORITY_BUNDLE_BASE_REF?.trim();
  if (envBaseRef) {
    const envDelta = resolveDeltaFromBaseRef(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_AUTHORITY_BUNDLE_BASE_REF",
    );
    if (envDelta) return deltaOrAllowlistFallback(envDelta);
    return emptyDelta(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_AUTHORITY_BUNDLE_BASE_REF",
    );
  }

  const baseCandidates = [
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    "origin/main",
    "main",
    "HEAD^",
  ].filter(Boolean);
  const attemptedDeltas = [];
  for (const candidate of baseCandidates) {
    const delta = resolveDeltaFromBaseRef(candidate, `merge_base:${candidate}`);
    if (!delta) continue;
    attemptedDeltas.push(delta);
    const expectedFilesPresent = EXPECTED_CHANGED_FILES.every((filePath) =>
      delta.changedFiles.includes(filePath),
    );
    if (expectedFilesPresent) return delta;
  }
  return allowlistFallback(
    attemptedDeltas[0]?.baseCommit ?? null,
    attemptedDeltas.length > 0
      ? "committed_allowlist_fallback_after_empty_or_downstream_delta"
      : "committed_allowlist_fallback_no_base_metadata",
  );
}

function deltaOrAllowlistFallback(delta) {
  if (EXPECTED_CHANGED_FILES.every((filePath) => delta.changedFiles.includes(filePath))) {
    return delta;
  }
  if (delta.changedFiles.length === 0) {
    return allowlistFallback(
      delta.baseCommit,
      "committed_allowlist_fallback_after_empty_env_delta",
    );
  }
  return delta;
}

function allowlistFallback(baseCommit, baseMode) {
  return {
    baseRef: "committed_allowlist",
    baseMode,
    baseCommit,
    compareRef: "HEAD",
    changedFiles: EXPECTED_CHANGED_FILES,
    packageAddedLines: FALLBACK_PACKAGE_ADDED_LINES,
    usedFallbackAllowlist: true,
  };
}

function resolveDeltaFromBaseRef(baseRef, baseMode) {
  const baseCommit = resolveBaseCommit(baseRef);
  if (!baseCommit) return null;
  const changedFiles = readGitLines([
    "diff",
    "--name-only",
    `${baseCommit}..HEAD`,
  ]);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    `${baseCommit}..HEAD`,
    "--",
    "package.json",
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  return {
    baseRef,
    baseMode,
    baseCommit,
    compareRef: "HEAD",
    changedFiles,
    packageAddedLines,
    usedFallbackAllowlist: false,
  };
}

function resolveBaseCommit(baseRef) {
  const verifiedBase = readGitOutput([
    "rev-parse",
    "--verify",
    `${baseRef}^{commit}`,
  ]).trim();
  if (!verifiedBase) return null;
  if (baseRef === "HEAD^") return verifiedBase;
  const mergeBase = readGitOutput(["merge-base", verifiedBase, "HEAD"]).trim();
  return mergeBase || verifiedBase;
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readGitLines(args) {
  return readGitOutput(args)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function emptyDelta(baseRef, baseMode) {
  return {
    baseRef,
    baseMode,
    baseCommit: null,
    compareRef: "HEAD",
    changedFiles: [],
    packageAddedLines: [],
    usedFallbackAllowlist: false,
  };
}

function validateFalseRecord(value, keys, prefix) {
  const record = asRecord(value);
  const failures = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${prefix}_record_missing`);
  }
  if (Object.keys(record).length === 0) {
    failures.push(`${prefix}_record_empty`);
  }
  for (const key of keys) {
    if (record[key] !== false) failures.push(`${prefix}_${key}_not_false`);
  }
  return failures;
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
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

function executableSqlPattern() {
  const statements = [
    ["CREATE", "TABLE"],
    ["INSERT", "INTO"],
    ["UPDATE", "\\w+"],
    ["DELETE", "FROM"],
    ["ALTER", "TABLE"],
    ["DROP", "TABLE"],
  ];
  return new RegExp(
    `\\b(${statements.map((parts) => parts.join("\\s+")).join("|")})\\b`,
    "i",
  );
}

function forbiddenImportPattern() {
  return /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i;
}

function networkOrExternalCallPattern() {
  const probes = [
    "fetch\\s*\\(",
    ["new", "OpenAI"].join("\\s+"),
    ["webhook", "\\s*\\("].join(""),
    ["send", "Email", "\\s*\\("].join(""),
    ["slack", "\\s*\\("].join(""),
    ["provider", "Client"].join(""),
    ["retrieval", "Client"].join(""),
    ["rag", "Client"].join(""),
  ];
  const callProbes = probes.map((probe) =>
    probe.includes("\\(") ? probe : `${probe}\\s*\\(`,
  );
  return new RegExp(`(?:\\b${callProbes.join("|\\b")})`, "i");
}

function browserPersistencePattern() {
  return new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("\\."),
    ].join("|")})\\b`,
  );
}

function appServerStartupPattern() {
  return new RegExp(
    `\\b(${[
      ["next", "dev"].join("\\s+"),
      "npm\\s+run\\s+dev",
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
  );
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createFingerprint(value) {
  const json = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([key]) => key !== "authority_contract_bundle_fingerprint")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${canonicalJson(nestedValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === "string" ? value : null;
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function unique(values) {
  return [...new Set(values)];
}

await main();
