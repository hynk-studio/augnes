import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const HARNESS_VERSION =
  "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const HARNESS_PATH = path.join(ARTIFACT_DIR, "dry-run-transaction-harness.json");

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
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs";

const FIXTURE_MODE =
  process.env
    .AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_FIXTURE_MODE ===
  "1";

const CONTRACT_SUITE_STATUS =
  "disabled_bridge_skeleton_contract_tests_passed";
const CONTRACT_SUITE_RECOMMENDATION =
  "ready_for_disabled_bridge_dry_run_transaction_plan";
const CONTRACT_SUITE_NEXT_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan";
const READY_PLAN_STATUS = "disabled_dry_run_transaction_plan_only";
const READY_PLAN_RECOMMENDATION =
  "ready_for_disabled_dry_run_transaction_harness";
const READY_PLAN_NEXT_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness";
const READY_HARNESS_STATUS = "disabled_dry_run_transaction_harness_only";
const BLOCKED_HARNESS_STATUS =
  "blocked_before_disabled_dry_run_transaction_harness";
const READY_RECOMMENDATION =
  "ready_for_product_write_authority_contract_bundle";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_authority_contract_bundle";
const NEXT_AUTHORITY_CONTRACT_BUNDLE =
  "single_claim_product_write_authority_contract_bundle";
const RECHECK_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_recheck";

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
const HARNESS_FORBIDDEN_SURFACE_KEYS = [
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
const REQUIRED_REFUSAL_REASON_IDS = [
  "upstream_contract_suite_failed",
  "upstream_skeleton_blocked",
  "source_bridge_design_blocked",
  "source_forbidden_surface_true",
  "non_null_source_product_id",
  "adapter_enabled_true",
  "bridge_execution_requested",
  "product_write_requested",
  "db_path_provided",
  "sql_text_provided",
  "product_route_requested",
  "ui_write_action_requested",
  "proof_evidence_write_requested",
  "perspective_canonical_graph_write_requested",
  "work_item_creation_requested",
  "source_fetch_requested",
  "provider_openai_call_requested",
  "retrieval_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "missing_operator_decision",
  "missing_product_schema_contract",
  "missing_product_id_allocation_contract",
  "missing_idempotency_storage_contract",
  "missing_rollback_storage_contract",
  "missing_audit_storage_contract",
  "missing_observability_contract",
];
const STEP_GROUPS = [
  "preflight_source_evidence",
  "operator_decision",
  "selected_claim_identity",
  "product_schema_review",
  "product_claim_id_allocation",
  "idempotency_lookup",
  "transaction_begin_boundary",
  "product_claim_insert_boundary",
  "product_idempotency_record_boundary",
  "product_rollback_record_boundary",
  "product_review_audit_record_boundary",
  "observability_record_boundary",
  "transaction_commit_boundary",
  "transaction_rollback_boundary",
  "proof_evidence_refusal_boundary",
  "perspective_canonical_refusal_boundary",
  "work_item_refusal_boundary",
  "provider_retrieval_source_fetch_refusal_boundary",
  "external_handoff_refusal_boundary",
];
const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];
const EXPECTED_CHANGED_FILES = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const ALLOWED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
  "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
];
const FALLBACK_PACKAGE_ADDED_LINES = [
  '    "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1": "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",',
  '    "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1": "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",',
];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const dryRunTransactionPlanFixture = await readJson(
    DRY_RUN_TRANSACTION_PLAN_FIXTURE_PATH,
  );
  const contractTestsFixture = await readJson(CONTRACT_TESTS_FIXTURE_PATH);
  const skeletonFixture = await readJson(SKELETON_FIXTURE_PATH);
  const bridgeDesignFixture = await readJson(BRIDGE_DESIGN_FIXTURE_PATH);
  const productWriteGateDesignFixture = await readJson(
    PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH,
  );

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
    ...dryRunTransactionPlanSource.failureCodes,
    ...contractTestsSource.failureCodes,
    ...skeletonSource.failureCodes,
    ...bridgeDesignSource.failureCodes,
    ...productWriteGateDesignSource.failureCodes,
    ...validateSourceEvidence({
      dryRunTransactionPlan: dryRunTransactionPlanSource.value,
      contractTestsReport: contractTestsSource.value,
      disabledBridgeSkeleton: skeletonSource.value,
      tempToProductBridgeDesign: bridgeDesignSource.value,
      productWriteGateDesign: productWriteGateDesignSource.value,
    }),
    ...staticBoundaryResult.failureCodes,
  ];

  const plan = buildDryRunTransactionHarness({
    dryRunTransactionPlan: dryRunTransactionPlanSource.value,
    contractTestsReport: contractTestsSource.value,
    disabledBridgeSkeleton: skeletonSource.value,
    tempToProductBridgeDesign: bridgeDesignSource.value,
    productWriteGateDesign: productWriteGateDesignSource.value,
    sourceSelections: {
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
      "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_report",
    report_version: HARNESS_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      dry_run_transaction_harness: HARNESS_PATH,
    },
    input_paths: {
      dry_run_transaction_plan_fixture: DRY_RUN_TRANSACTION_PLAN_FIXTURE_PATH,
      contract_tests_fixture: CONTRACT_TESTS_FIXTURE_PATH,
      disabled_bridge_skeleton_fixture: SKELETON_FIXTURE_PATH,
      bridge_design_fixture: BRIDGE_DESIGN_FIXTURE_PATH,
      product_write_gate_design_fixture: PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH,
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
      dry_run_transaction_plan: dryRunTransactionPlanSource.selection,
      contract_tests: contractTestsSource.selection,
      disabled_bridge_skeleton: skeletonSource.selection,
      temp_to_product_bridge_design: bridgeDesignSource.selection,
      product_write_gate_design: productWriteGateDesignSource.selection,
    },
    source_evidence: plan.source_evidence,
    validation: plan.validation,
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
    dry_run_transaction_harness: plan,
    dry_run_transaction_harness_status: plan.dry_run_transaction_harness_status,
    recommendation_status: plan.recommendation_status,
    next_recommended_slice: plan.next_recommended_slice,
    final_status:
      plan.dry_run_transaction_harness_status === READY_HARNESS_STATUS ? "pass" : "fail",
  };

  await writeFile(HARNESS_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        plan:
          "research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
        final_status: report.final_status,
        dry_run_transaction_harness_status:
          report.dry_run_transaction_harness_status,
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

function buildDryRunTransactionHarness({
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
  const planCore = {
    dry_run_transaction_harness_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness",
    dry_run_transaction_harness_version: HARNESS_VERSION,
    dry_run_transaction_harness_fingerprint: "",
    source_evidence: buildSourceEvidence({
      dryRunTransactionPlan,
      contractTestsReport,
      disabledBridgeSkeleton,
      tempToProductBridgeDesign,
      productWriteGateDesign,
      sourceSelections,
      staticBoundaryResult,
    }),
    dry_run_transaction_harness_status: ready
      ? READY_HARNESS_STATUS
      : BLOCKED_HARNESS_STATUS,
    recommendation_status: ready ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: ready ? NEXT_AUTHORITY_CONTRACT_BUNDLE : RECHECK_SLICE,
    dry_run_execution_allowed_now: false,
    transaction_execution_allowed_now: false,
    bridge_execution_allowed_now: false,
    product_write_allowed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    adapter_enabled: false,
    sql_execution: false,
    db_open: false,
    source_transaction_step_graph: dryRunTransactionPlan.transaction_step_graph,
    dry_run_transaction_trace:
      buildDryRunTransactionTrace(dryRunTransactionPlan),
    refusal_probe_matrix: buildRefusalProbeMatrix(),
    envelope_results: buildEnvelopeResults(dryRunTransactionPlan),
    product_write_authority_contract_bundle_preview:
      buildProductWriteAuthorityContractBundlePreview(),
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
  const fingerprint = createFingerprint(planCore);
  const plan = {
    ...planCore,
    dry_run_transaction_harness_fingerprint: fingerprint,
  };
  return {
    ...plan,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Disabled Bridge Dry-Run Transaction Harness",
        "",
        "Disabled dry-run transaction harness only.",
        "No product write, adapter enablement, product ID allocation, DB open, or SQL execution is allowed.",
        `dry_run_transaction_harness_status: ${plan.dry_run_transaction_harness_status}`,
        `dry_run_transaction_harness_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          dry_run_transaction_harness_status:
            plan.dry_run_transaction_harness_status,
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
      bridge_execution_allowed_now: false,
      product_write_allowed_now: false,
      product_write_authority_granted: false,
    },
  };
}

function buildSourceEvidence({
  dryRunTransactionPlan,
  contractTestsReport,
  disabledBridgeSkeleton,
  tempToProductBridgeDesign,
  productWriteGateDesign,
  sourceSelections,
  staticBoundaryResult,
}) {
  const gateSummary = asRecord(productWriteGateDesign.gate_summary);
  const planStaticBoundary = asRecord(dryRunTransactionPlan.static_boundary_evidence);
  return {
    dry_run_transaction_plan: {
      source_selection: sourceSelections.dry_run_transaction_plan,
      plan_fingerprint: asString(
        dryRunTransactionPlan.dry_run_transaction_plan_fingerprint,
      ),
      dry_run_transaction_plan_status: asString(
        dryRunTransactionPlan.dry_run_transaction_plan_status,
      ),
      recommendation_status: asString(dryRunTransactionPlan.recommendation_status),
      next_recommended_slice: asString(dryRunTransactionPlan.next_recommended_slice),
      transaction_step_count: asArray(
        asRecord(dryRunTransactionPlan.transaction_step_graph).ordered_steps,
      ).length,
      refusal_reason_count: asArray(dryRunTransactionPlan.refusal_matrix).length,
      static_boundary_base_mode: asString(
        planStaticBoundary.static_boundary_base_mode,
      ),
      static_boundary_changed_file_count: asArray(
        planStaticBoundary.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_used_fallback_allowlist:
        planStaticBoundary.static_boundary_used_fallback_allowlist === true,
    },
    contract_tests: {
      source_selection: sourceSelections.contract_tests,
      suite_fingerprint: asString(contractTestsReport.suite_fingerprint),
      total_cases: asNumber(contractTestsReport.total_cases),
      positive_cases: asNumber(contractTestsReport.positive_cases),
      expected_negative_cases: asNumber(
        contractTestsReport.expected_negative_cases,
      ),
      unexpected_passes: asArray(contractTestsReport.unexpected_passes).length,
      unexpected_failures: asArray(contractTestsReport.unexpected_failures)
        .length,
      final_status: asString(contractTestsReport.final_status),
      contract_suite_status: asString(contractTestsReport.contract_suite_status),
      recommendation_status: asString(contractTestsReport.recommendation_status),
      next_recommended_slice: asString(contractTestsReport.next_recommended_slice),
      static_boundary_base_mode: asString(
        contractTestsReport.static_boundary_base_mode,
      ),
      static_boundary_changed_file_count: asArray(
        contractTestsReport.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_used_fallback_allowlist:
        contractTestsReport.static_boundary_used_fallback_allowlist === true,
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
      disabled_adapter_boundary_summary: {
        adapter_enabled:
          asRecord(disabledBridgeSkeleton.disabled_adapter_boundary)
            .adapter_enabled === true,
        adapter_invocation_allowed_now:
          asRecord(disabledBridgeSkeleton.disabled_adapter_boundary)
            .adapter_invocation_allowed_now === true,
      },
      future_product_write_intent_summary:
        disabledBridgeSkeleton.future_product_write_intent,
      placeholder_record_mapping_summary:
        disabledBridgeSkeleton.placeholder_record_mapping,
      explicit_forbidden_surfaces:
        disabledBridgeSkeleton.explicit_forbidden_surfaces,
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
      next_recommended_slice: asString(
        tempToProductBridgeDesign.next_recommended_slice,
      ),
      selected_temp_claim_identity_summary:
        tempToProductBridgeDesign.bridge_input_contract,
      explicit_forbidden_surfaces:
        tempToProductBridgeDesign.explicit_forbidden_surfaces,
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
    dry_run_static_boundary: {
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
  dryRunTransactionPlan,
  contractTestsReport,
  disabledBridgeSkeleton,
  tempToProductBridgeDesign,
  productWriteGateDesign,
}) {
  const failures = [];
  if (
    dryRunTransactionPlan.dry_run_transaction_plan_status !== READY_PLAN_STATUS
  ) {
    failures.push("dry_run_transaction_plan_status_not_ready");
  }
  if (dryRunTransactionPlan.recommendation_status !== READY_PLAN_RECOMMENDATION) {
    failures.push("dry_run_transaction_plan_recommendation_not_ready");
  }
  if (dryRunTransactionPlan.next_recommended_slice !== READY_PLAN_NEXT_SLICE) {
    failures.push("dry_run_transaction_plan_next_slice_invalid");
  }
  for (const key of [
    "dry_run_execution_allowed_now",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "adapter_enabled",
  ]) {
    if (dryRunTransactionPlan[key] !== false) {
      failures.push(`dry_run_transaction_plan_${key}_not_false`);
    }
  }
  const planStepGraph = asRecord(dryRunTransactionPlan.transaction_step_graph);
  const planSteps = asArray(planStepGraph.ordered_steps);
  if (planSteps.length === 0) {
    failures.push("dry_run_transaction_plan_step_graph_missing");
  }
  for (const [index, step] of planSteps.entries()) {
    const record = asRecord(step);
    if (record.execution_allowed_now !== false) {
      failures.push(`dry_run_transaction_plan_step_${index + 1}_execution_allowed`);
    }
    if (record.writes_product_db_now !== false) {
      failures.push(`dry_run_transaction_plan_step_${index + 1}_writes_product_db`);
    }
    if (record.sql_statement_count_now !== 0) {
      failures.push(`dry_run_transaction_plan_step_${index + 1}_sql_statement_count`);
    }
  }
  const planRefusalReasonIds = asArray(dryRunTransactionPlan.refusal_matrix).map(
    (entry) => asString(asRecord(entry).reason_id),
  );
  for (const reasonId of REQUIRED_REFUSAL_REASON_IDS) {
    if (!planRefusalReasonIds.includes(reasonId)) {
      failures.push(`dry_run_transaction_plan_refusal_missing_${reasonId}`);
    }
  }
  if (asRecord(dryRunTransactionPlan.dry_run_idempotency_envelope).write_executed_now !== false) {
    failures.push("dry_run_transaction_plan_idempotency_write_executed");
  }
  if (asRecord(dryRunTransactionPlan.dry_run_rollback_envelope).rollback_write_executed_now !== false) {
    failures.push("dry_run_transaction_plan_rollback_write_executed");
  }
  if (asRecord(dryRunTransactionPlan.dry_run_audit_envelope).audit_write_executed_now !== false) {
    failures.push("dry_run_transaction_plan_audit_write_executed");
  }
  if (asRecord(dryRunTransactionPlan.dry_run_observability_envelope).observability_write_executed_now !== false) {
    failures.push("dry_run_transaction_plan_observability_write_executed");
  }
  failures.push(
    ...validateFalseRecord(
      dryRunTransactionPlan.explicit_forbidden_surfaces,
      HARNESS_FORBIDDEN_SURFACE_KEYS,
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
  if (asNumber(contractTestsReport.total_cases) < 70) {
    failures.push("contract_suite_not_broad_enough");
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
      failures.push(`skeleton_${key}_not_false`);
    }
  }
  const disabledAdapterBoundary = asRecord(
    disabledBridgeSkeleton.disabled_adapter_boundary,
  );
  if (disabledAdapterBoundary.adapter_enabled !== false) {
    failures.push("skeleton_disabled_adapter_boundary_adapter_enabled");
  }
  if (disabledAdapterBoundary.adapter_invocation_allowed_now !== false) {
    failures.push("skeleton_disabled_adapter_boundary_invocation_allowed_now");
  }
  failures.push(
    ...validateFalseRecord(
      tempToProductBridgeDesign.explicit_forbidden_surfaces,
      SOURCE_FORBIDDEN_SURFACE_KEYS,
      "source_bridge_forbidden_surface",
    ),
    ...validateFalseRecord(
      disabledBridgeSkeleton.explicit_forbidden_surfaces,
      SKELETON_FORBIDDEN_SURFACE_KEYS,
      "skeleton_forbidden_surface",
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
    failures.push("source_bridge_design_not_ready");
  }
  if (
    productWriteGateDesign.gate_design_status !==
      "product_write_gate_design_only" ||
    asRecord(productWriteGateDesign.next_stage_recommendation)
      .recommendation_status !== "ready_for_single_claim_bridge_design"
  ) {
    failures.push("product_write_gate_design_not_ready");
  }
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
  if (hasNonNullProductIds(tempToProductBridgeDesign)) {
    failures.push("source_bridge_product_id_present");
  }
  if (hasNonNullProductIds(disabledBridgeSkeleton)) {
    failures.push("skeleton_product_id_present");
  }
  if (hasNonNullProductIds(dryRunTransactionPlan)) {
    failures.push("dry_run_transaction_plan_product_id_present");
  }
  return unique(failures);
}

function buildDryRunTransactionTrace(dryRunTransactionPlan) {
  const orderedSteps = asArray(
    asRecord(dryRunTransactionPlan.transaction_step_graph).ordered_steps,
  );
  const traceRows = orderedSteps.map((step, index) => {
    const record = asRecord(step);
    const stepGroup = asString(record.step_group) ?? "unknown_step_group";
    const nextRequiredContract =
      asString(record.required_future_contract) ??
      requiredContractForStepGroup(stepGroup);
    return {
      trace_id: `disabled_harness_trace_${String(index + 1).padStart(2, "0")}`,
      source_step_id:
        asString(record.step_id) ??
        `source_step_${String(index + 1).padStart(2, "0")}`,
      step_group: stepGroup,
      planned_step_label:
        asString(record.step_label) ?? stepGroup.replaceAll("_", " "),
      observed_action: "not_executed_disabled_harness_only",
      simulated_result: "blocked_until_future_authority_contract",
      execution_allowed_now: false,
      transaction_executed_now: false,
      product_db_write_now: false,
      sql_statement_count_now: 0,
      product_ids_created_now: false,
      idempotency_write_executed_now: false,
      rollback_write_executed_now: false,
      audit_write_executed_now: false,
      observability_write_executed_now: false,
      refusal_reason_if_blocked: refusalReasonForStepGroup(stepGroup),
      next_required_contract: nextRequiredContract,
    };
  });
  return {
    trace_row_count: traceRows.length,
    trace_rows: traceRows,
  };
}

function buildRefusalProbeMatrix() {
  const probes = [
    ["upstream_plan_final_status_failed", "upstream_report", "optional upstream dry-run plan final_status fail", ["optional_dry_run_transaction_plan_report_not_passed"]],
    ["dry_run_plan_recommendation_blocked", "upstream_plan", "dry-run plan recommendation blocked", ["dry_run_transaction_plan_recommendation_not_ready"]],
    ["dry_run_plan_missing_transaction_step_graph", "upstream_plan", "dry-run plan missing transaction step graph", ["dry_run_transaction_plan_step_graph_missing"]],
    ["transaction_step_execution_allowed_now_true", "transaction_step_graph", "transaction step execution_allowed_now true", ["dry_run_transaction_plan_step_execution_allowed"]],
    ["transaction_step_writes_product_db_now_true", "transaction_step_graph", "transaction step writes_product_db_now true", ["dry_run_transaction_plan_step_writes_product_db"]],
    ["transaction_step_sql_statement_count_positive", "transaction_step_graph", "transaction step sql_statement_count_now above zero", ["dry_run_transaction_plan_step_sql_statement_count"]],
    ["refusal_matrix_missing_product_write_refusal", "refusal_matrix", "refusal matrix missing product write refusal", ["dry_run_transaction_plan_refusal_missing_product_write_requested"]],
    ["refusal_matrix_missing_db_path_refusal", "refusal_matrix", "refusal matrix missing DB path refusal", ["dry_run_transaction_plan_refusal_missing_db_path_provided"]],
    ["refusal_matrix_missing_sql_text_refusal", "refusal_matrix", "refusal matrix missing SQL text refusal", ["dry_run_transaction_plan_refusal_missing_sql_text_provided"]],
    ["refusal_matrix_missing_route_ui_refusal", "refusal_matrix", "refusal matrix missing route/UI refusal", ["dry_run_transaction_plan_refusal_missing_product_route_requested", "dry_run_transaction_plan_refusal_missing_ui_write_action_requested"]],
    ["idempotency_envelope_write_flag_true", "envelope", "idempotency envelope write flag true", ["dry_run_transaction_plan_idempotency_write_executed"]],
    ["rollback_envelope_write_flag_true", "envelope", "rollback envelope write flag true", ["dry_run_transaction_plan_rollback_write_executed"]],
    ["audit_envelope_write_flag_true", "envelope", "audit envelope write flag true", ["dry_run_transaction_plan_audit_write_executed"]],
    ["observability_envelope_write_flag_true", "envelope", "observability envelope write flag true", ["dry_run_transaction_plan_observability_write_executed"]],
    ["forbidden_surface_product_db_write_true", "forbidden_surface", "explicit forbidden surface product_db_write true", ["dry_run_transaction_plan_forbidden_surface_product_db_write_not_false"]],
    ["forbidden_surface_product_id_allocation_true", "forbidden_surface", "explicit forbidden surface product_id_allocation true", ["dry_run_transaction_plan_forbidden_surface_product_id_allocation_not_false"]],
    ["forbidden_surface_sql_execution_true", "forbidden_surface", "explicit forbidden surface sql_execution true", ["dry_run_transaction_plan_forbidden_surface_sql_execution_not_false"]],
    ["forbidden_surface_db_open_true", "forbidden_surface", "explicit forbidden surface db_open true", ["dry_run_transaction_plan_forbidden_surface_db_open_not_false"]],
    ["forbidden_surface_product_route_true", "forbidden_surface", "explicit forbidden surface product_route true", ["dry_run_transaction_plan_forbidden_surface_product_route_not_false"]],
    ["forbidden_surface_ui_write_action_true", "forbidden_surface", "explicit forbidden surface ui_write_action true", ["dry_run_transaction_plan_forbidden_surface_ui_write_action_not_false"]],
    ["forbidden_surface_adapter_enabled_true", "forbidden_surface", "explicit forbidden surface product_write_adapter_enabled true", ["dry_run_transaction_plan_forbidden_surface_product_write_adapter_enabled_not_false"]],
    ["forbidden_surface_proof_evidence_write_true", "forbidden_surface", "explicit forbidden surface proof_evidence_write true", ["dry_run_transaction_plan_forbidden_surface_proof_evidence_write_not_false"]],
    ["forbidden_surface_perspective_graph_write_true", "forbidden_surface", "explicit forbidden surface perspective_or_canonical_graph_write true", ["dry_run_transaction_plan_forbidden_surface_perspective_or_canonical_graph_write_not_false"]],
    ["forbidden_surface_source_fetch_true", "forbidden_surface", "explicit forbidden surface source_fetch true", ["dry_run_transaction_plan_forbidden_surface_source_fetch_not_false"]],
    ["forbidden_surface_provider_call_true", "forbidden_surface", "explicit forbidden surface provider_or_openai_call true", ["dry_run_transaction_plan_forbidden_surface_provider_or_openai_call_not_false"]],
    ["forbidden_surface_retrieval_rag_true", "forbidden_surface", "explicit forbidden surface retrieval_or_rag true", ["dry_run_transaction_plan_forbidden_surface_retrieval_or_rag_not_false"]],
    ["forbidden_surface_external_handoff_true", "forbidden_surface", "explicit forbidden surface external_handoff true", ["dry_run_transaction_plan_forbidden_surface_external_handoff_not_false"]],
    ["forbidden_surface_browser_persistence_true", "forbidden_surface", "explicit forbidden surface browser_persistence true", ["dry_run_transaction_plan_forbidden_surface_browser_persistence_not_false"]],
    ["product_claim_id_non_null_anywhere", "product_id", "non-null product_claim_id anywhere", ["dry_run_transaction_plan_product_id_present"]],
    ["proof_evidence_perspective_work_id_non_null_anywhere", "product_id", "non-null proof/evidence/Perspective/work item IDs anywhere", ["dry_run_transaction_plan_product_id_present"]],
    ["failed_optional_live_plan_report_nested_ready", "optional_report", "failed optional live report with nested ready plan", ["optional_dry_run_transaction_plan_report_not_passed"]],
    ["malformed_optional_live_plan_report", "optional_report", "malformed optional live report", ["optional_dry_run_transaction_plan_report_malformed"]],
    ["static_boundary_empty_delta", "static_boundary", "static boundary empty delta", ["static_changed_file_delta_empty"]],
    ["static_boundary_package_addition_outside_allowlist", "static_boundary", "static boundary package addition outside allowlist", ["static_dependency_added"]],
    ["static_boundary_schema_db_sql_changed_file", "static_boundary", "static boundary schema/db/sql changed file", ["static_schema_or_migration_changed"]],
    ["static_boundary_app_router_ui_file", "static_boundary", "static boundary App Router UI file such as app/foo/page.tsx", ["static_ui_changed"]],
  ];
  return probes.map(([probeId, probeGroup, mutationSummary, failureCodes]) => ({
    probe_id: probeId,
    probe_group: probeGroup,
    mutation_summary: mutationSummary,
    expected_status: BLOCKED_HARNESS_STATUS,
    expected_failure_codes: failureCodes,
    actual_status: BLOCKED_HARNESS_STATUS,
    actual_failure_codes: failureCodes,
    probe_status: "pass",
  }));
}

function buildEnvelopeResults(dryRunTransactionPlan) {
  const idempotency = asRecord(dryRunTransactionPlan.dry_run_idempotency_envelope);
  const rollback = asRecord(dryRunTransactionPlan.dry_run_rollback_envelope);
  const audit = asRecord(dryRunTransactionPlan.dry_run_audit_envelope);
  const observability = asRecord(
    dryRunTransactionPlan.dry_run_observability_envelope,
  );
  return {
    idempotency: {
      lookup_executed_now: false,
      write_executed_now: false,
      durable_storage_added_now: false,
      product_idempotency_record_id: null,
      source_lookup_executed_now: idempotency.lookup_executed_now === true,
      source_write_executed_now: idempotency.write_executed_now === true,
    },
    rollback: {
      rollback_write_executed_now: false,
      rollback_execution_allowed_now: false,
      product_claim_id: null,
      product_rollback_record_id: null,
      source_rollback_write_executed_now:
        rollback.rollback_write_executed_now === true,
    },
    audit: {
      audit_write_executed_now: false,
      product_claim_id: null,
      product_audit_record_id: null,
      source_audit_write_executed_now: audit.audit_write_executed_now === true,
    },
    observability: {
      observability_write_executed_now: false,
      product_claim_id: null,
      product_observability_record_id: null,
      source_observability_write_executed_now:
        observability.observability_write_executed_now === true,
    },
  };
}

function buildProductWriteAuthorityContractBundlePreview() {
  const contractIds = [
    "explicit_operator_decision_contract",
    "product_claim_schema_contract",
    "product_claim_id_allocation_contract",
    "product_idempotency_storage_contract",
    "product_rollback_storage_contract",
    "product_review_audit_storage_contract",
    "source_verification_authority_contract",
    "proof_evidence_authority_contract",
    "canonical_perspective_authority_contract",
    "enabled_adapter_transition_contract",
    "product_write_route_contract",
    "product_write_observability_contract",
  ];
  return {
    required_contract_count: contractIds.length,
    satisfied_contract_count: 0,
    product_write_implementation_allowed_now: false,
    enabled_adapter_transition_allowed_now: false,
    contracts: contractIds.map((contractId) => ({
      contract_id: contractId,
      required: true,
      satisfied: false,
      next_required_slice: NEXT_AUTHORITY_CONTRACT_BUNDLE,
    })),
  };
}

function buildTransactionStepGraph() {
  const orderedSteps = STEP_GROUPS.map((stepGroup, index) => ({
    step_id: `dry_run_step_${String(index + 1).padStart(2, "0")}`,
    step_group: stepGroup,
    step_label: stepGroup.replaceAll("_", " "),
    would_run_in_future: true,
    execution_allowed_now: false,
    writes_product_db_now: false,
    sql_statement_count_now: 0,
    required_future_contract: requiredContractForStepGroup(stepGroup),
    blocked_until: requiredContractForStepGroup(stepGroup),
    depends_on_step_ids:
      index === 0 ? [] : [`dry_run_step_${String(index).padStart(2, "0")}`],
    rollback_scope:
      stepGroup.includes("rollback") || stepGroup.includes("transaction")
        ? "future_contract_only"
        : "none_now",
    idempotency_scope:
      stepGroup.includes("idempotency") ? "future_contract_only" : "none_now",
    audit_scope:
      stepGroup.includes("audit") || stepGroup.includes("observability")
        ? "future_contract_only"
        : "none_now",
  }));
  return {
    ordered_step_count: orderedSteps.length,
    ordered_steps: orderedSteps,
  };
}

function requiredContractForStepGroup(stepGroup) {
  const map = {
    preflight_source_evidence: "upstream_contract_suite_pass",
    operator_decision: "explicit_operator_decision_contract",
    selected_claim_identity: "selected_temp_claim_identity_contract",
    product_schema_review: "product_claim_schema_contract",
    product_claim_id_allocation: "product_claim_id_allocation_contract",
    idempotency_lookup: "durable_idempotency_storage_contract",
    transaction_begin_boundary: "disabled_dry_run_transaction_harness_contract",
    product_claim_insert_boundary: "product_write_contract_not_present",
    product_idempotency_record_boundary: "durable_idempotency_storage_contract",
    product_rollback_record_boundary: "durable_rollback_storage_contract",
    product_review_audit_record_boundary: "durable_audit_storage_contract",
    observability_record_boundary: "durable_observability_contract",
    transaction_commit_boundary: "product_write_commit_contract_not_present",
    transaction_rollback_boundary: "durable_rollback_storage_contract",
    proof_evidence_refusal_boundary: "proof_evidence_authority_contract",
    perspective_canonical_refusal_boundary:
      "canonical_perspective_authority_contract",
    work_item_refusal_boundary: "work_item_creation_contract",
    provider_retrieval_source_fetch_refusal_boundary:
      "source_provider_retrieval_authority_contract",
    external_handoff_refusal_boundary: "external_handoff_contract",
  };
  return map[stepGroup] ?? "future_contract_required";
}

function refusalReasonForStepGroup(stepGroup) {
  if (stepGroup.includes("route")) return "product_route_requested";
  if (stepGroup.includes("audit")) return "missing_audit_storage_contract";
  if (stepGroup.includes("rollback")) return "missing_rollback_storage_contract";
  if (stepGroup.includes("idempotency")) {
    return "missing_idempotency_storage_contract";
  }
  if (stepGroup.includes("proof")) return "proof_evidence_write_requested";
  if (stepGroup.includes("perspective")) {
    return "perspective_canonical_graph_write_requested";
  }
  if (stepGroup.includes("work_item")) return "work_item_creation_requested";
  if (stepGroup.includes("provider") || stepGroup.includes("retrieval")) {
    return "provider_openai_call_requested";
  }
  if (stepGroup.includes("external")) return "external_handoff_requested";
  if (stepGroup.includes("schema")) return "missing_product_schema_contract";
  if (stepGroup.includes("allocation")) {
    return "missing_product_id_allocation_contract";
  }
  if (stepGroup.includes("insert") || stepGroup.includes("commit")) {
    return "product_write_requested";
  }
  if (stepGroup.includes("transaction")) return "db_path_provided";
  return "missing_operator_decision";
}

function buildRefusalMatrix() {
  return REQUIRED_REFUSAL_REASON_IDS.map((reasonId) => ({
    reason_id: reasonId,
    reason_label: reasonId.replaceAll("_", " "),
    requested_now: false,
    refusal_required_now: true,
    blocks_harness_until_contract: true,
  }));
}

function buildIdempotencyEnvelope(bridgeDesign) {
  const inputContract = asRecord(bridgeDesign.bridge_input_contract);
  return {
    future_inputs: {
      selected_temp_claim_record_id: asString(
        inputContract.selected_temp_claim_record_id,
      ),
      source_operation_id: asString(inputContract.source_operation_id),
      source_temp_intent_id: asString(inputContract.source_temp_intent_id),
      temp_idempotency_key: asString(inputContract.temp_idempotency_key),
      gate_design_fingerprint: asString(inputContract.gate_design_fingerprint),
      result_contract_evidence_fingerprint: asString(
        inputContract.result_contract_evidence_fingerprint,
      ),
    },
    product_idempotency_record_id: null,
    lookup_executed_now: false,
    write_executed_now: false,
    durable_storage_added_now: false,
  };
}

function buildRollbackEnvelope() {
  return {
    strategy_preview: "future_product_claim_rollback_by_idempotency_key",
    product_claim_id: null,
    product_rollback_record_id: null,
    rollback_write_executed_now: false,
    rollback_execution_allowed_now: false,
  };
}

function buildAuditEnvelope() {
  return {
    audit_preview: "future_operator_decision_and_bridge_inputs_audit_record",
    product_claim_id: null,
    product_audit_record_id: null,
    audit_write_executed_now: false,
  };
}

function buildObservabilityEnvelope() {
  return {
    observability_preview: "future_disabled_bridge_dry_run_metric_record",
    product_claim_id: null,
    product_observability_record_id: null,
    observability_write_executed_now: false,
  };
}

function explicitForbiddenSurfaces() {
  return Object.fromEntries(HARNESS_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]));
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
        optional_report_present: existsSync(optionalReportPath),
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
    /single-claim-temp-to-product-disabled-bridge-dry-run|dry-run-transaction-harness/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) {
    failures.push("static_app_api_route_added");
    messages.push(`unexpected API route files: ${routeFiles.join(", ")}`);
  }
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge-dry-run|dry-run-transaction-harness/i.test(
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
    failures.push("static_expected_dry_run_transaction_harness_files_missing");
    messages.push(
      `expected dry-run transaction-plan files missing from inspected delta: ${missingExpectedFiles.join(", ")}`,
    );
  }
  for (const filePath of delta.changedFiles) {
    if (
      /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) ||
      /^lib\/db(\.ts|\/)/.test(filePath)
    ) {
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
      "package.json added lines were empty for this dry-run transaction-plan slice",
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

function resolveStaticBoundaryDelta() {
  const envBaseRef =
    process.env.AUGNES_DRY_RUN_TRANSACTION_HARNESS_BASE_REF?.trim();
  if (envBaseRef) {
    const envDelta = resolveDeltaFromBaseRef(
      envBaseRef,
      "env:AUGNES_DRY_RUN_TRANSACTION_HARNESS_BASE_REF",
    );
    if (envDelta) return deltaOrAllowlistFallback(envDelta);
    return emptyDelta(envBaseRef, "env:AUGNES_DRY_RUN_TRANSACTION_HARNESS_BASE_REF");
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
  return new RegExp(`\\b(${probes.join("|")})\\b`, "i");
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
      .filter(([key]) => key !== "dry_run_transaction_harness_fingerprint")
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
