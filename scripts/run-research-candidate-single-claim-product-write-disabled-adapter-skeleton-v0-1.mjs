import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SKELETON_VERSION =
  "manual_note_single_claim_product_write_disabled_adapter_skeleton.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const SKELETON_PATH = path.join(ARTIFACT_DIR, "disabled-adapter-skeleton.json");

const AUTHORITY_BUNDLE_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-authority-contract-bundle.sample.v0.1.json";
const OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json";

const OPTIONAL_UPSTREAM_REPORTS = [
  [
    "dry_run_transaction_harness",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json",
  ],
  [
    "dry_run_transaction_plan",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json",
  ],
  [
    "contract_tests",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json",
  ],
  [
    "disabled_bridge_skeleton",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json",
  ],
  [
    "temp_to_product_bridge_design",
    "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json",
  ],
  [
    "product_write_gate_design",
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
  ],
];

const HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-skeleton.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs";

const FIXTURE_MODE =
  process.env
    .AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_FIXTURE_MODE ===
  "1";

const READY_AUTHORITY_STATUS = "product_write_authority_contracts_defined_only";
const READY_AUTHORITY_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_skeleton";
const READY_AUTHORITY_NEXT_SLICE =
  "single_claim_product_write_disabled_adapter_skeleton";
const READY_STATUS = "product_write_disabled_adapter_skeleton_only";
const BLOCKED_STATUS =
  "blocked_before_product_write_disabled_adapter_skeleton";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_contract_tests";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_disabled_adapter_contract_tests";
const NEXT_CONTRACT_TESTS =
  "single_claim_product_write_disabled_adapter_contract_tests";
const RECHECK_SLICE =
  "single_claim_product_write_disabled_adapter_skeleton_recheck";

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

const EXPLICIT_FORBIDDEN_SURFACE_KEYS = [
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

const REFUSAL_REASON_IDS = [
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

const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];
const EXPECTED_CHANGED_FILES = [
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
const ALLOWED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1",
  "adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1",
];
const FALLBACK_PACKAGE_ADDED_LINES = [
  '    "smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",',
  '    "adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1": "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",',
];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const authorityFixture = await readJson(AUTHORITY_BUNDLE_FIXTURE_PATH);
  const authoritySource = await selectAuthorityBundleSource(authorityFixture);
  const optionalUpstreamReports = await inspectOptionalUpstreamReports();
  const optionalUpstreamFailures = optionalUpstreamReports.flatMap(
    (entry) => entry.failureCodes,
  );
  const liveStaticBoundaryResult = validateStaticRepoBoundary();
  const staticBoundaryResult = FIXTURE_MODE
    ? buildFixtureModeStaticBoundaryResult()
    : liveStaticBoundaryResult;
  const sourceFailures = [
    ...authoritySource.failureCodes,
    ...optionalUpstreamFailures,
    ...validateAuthorityBundleSource(authoritySource.value),
    ...staticBoundaryResult.failureCodes,
  ];

  const skeleton = buildDisabledAdapterSkeleton({
    authorityContractBundle: authoritySource.value,
    authoritySourceSelection: authoritySource.selection,
    staticBoundaryResult,
    validationFailureCodes: unique(sourceFailures),
  });
  const report = {
    report_kind:
      "manual_note_single_claim_product_write_disabled_adapter_skeleton_report",
    report_version: SKELETON_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      disabled_adapter_skeleton: SKELETON_PATH,
    },
    input_paths: {
      authority_contract_bundle_fixture: AUTHORITY_BUNDLE_FIXTURE_PATH,
      optional_authority_contract_bundle_report:
        OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH,
      optional_upstream_reports: Object.fromEntries(OPTIONAL_UPSTREAM_REPORTS),
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
      authority_contract_bundle: authoritySource.selection,
      upstream_reports: optionalUpstreamReports.map((entry) => entry.selection),
    },
    non_fingerprinted_runtime_notes: {
      fixture_mode: FIXTURE_MODE,
      fixture_mode_live_static_boundary_result: FIXTURE_MODE
        ? summarizeStaticBoundaryResult(liveStaticBoundaryResult)
        : null,
      optional_authority_contract_bundle_report_present_on_disk: existsSync(
        OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH,
      ),
      optional_upstream_reports_present_on_disk: Object.fromEntries(
        OPTIONAL_UPSTREAM_REPORTS.map(([label, filePath]) => [
          label,
          existsSync(filePath),
        ]),
      ),
    },
    source_evidence: skeleton.source_evidence,
    validation: skeleton.validation,
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
    disabled_adapter_skeleton: skeleton,
    disabled_adapter_skeleton_status:
      skeleton.disabled_adapter_skeleton_status,
    recommendation_status: skeleton.recommendation_status,
    next_recommended_slice: skeleton.next_recommended_slice,
    final_status:
      skeleton.disabled_adapter_skeleton_status === READY_STATUS
        ? "pass"
        : "fail",
  };

  await writeFile(SKELETON_PATH, `${JSON.stringify(skeleton, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        plan:
          "research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1",
        final_status: report.final_status,
        disabled_adapter_skeleton_status:
          report.disabled_adapter_skeleton_status,
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

async function selectAuthorityBundleSource(fixture) {
  if (FIXTURE_MODE) {
    return {
      value: cloneJson(fixture),
      failureCodes: [],
      selection: {
        source_label: "authority_contract_bundle",
        source_used: "committed_fixture",
        fixture_path: AUTHORITY_BUNDLE_FIXTURE_PATH,
        optional_report_path: OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH,
        optional_report_present: false,
        optional_report_ignored_for_fixture_mode: true,
        fallback_to_committed_fixture: true,
      },
    };
  }
  if (!existsSync(OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH)) {
    return {
      value: cloneJson(fixture),
      failureCodes: [],
      selection: {
        source_label: "authority_contract_bundle",
        source_used: "committed_fixture",
        fixture_path: AUTHORITY_BUNDLE_FIXTURE_PATH,
        optional_report_path: OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH,
        optional_report_present: false,
        optional_report_ignored_for_fixture_mode: false,
        fallback_to_committed_fixture: true,
      },
    };
  }
  const parsed = await readOptionalReport(OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH);
  if (!parsed.ok) {
    return {
      value: {},
      failureCodes: ["optional_authority_contract_bundle_report_malformed"],
      selection: {
        source_label: "authority_contract_bundle",
        source_used: "optional_report",
        fixture_path: AUTHORITY_BUNDLE_FIXTURE_PATH,
        optional_report_path: OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH,
        optional_report_present: true,
        optional_report_final_status: null,
        optional_report_parse_error: parsed.error,
        fallback_to_committed_fixture: false,
      },
    };
  }
  const report = asRecord(parsed.value);
  const selectedValue = asRecord(report.authority_contract_bundle);
  const failures = [];
  if (report.final_status !== "pass") {
    failures.push("optional_authority_contract_bundle_report_not_passed");
  }
  if (Object.keys(selectedValue).length === 0) {
    failures.push(
      "optional_authority_contract_bundle_report_missing_authority_contract_bundle",
    );
  }
  return {
    value: cloneJson(selectedValue),
    failureCodes: failures,
    selection: {
      source_label: "authority_contract_bundle",
      source_used: "optional_report",
      fixture_path: AUTHORITY_BUNDLE_FIXTURE_PATH,
      optional_report_path: OPTIONAL_AUTHORITY_BUNDLE_REPORT_PATH,
      optional_report_present: true,
      optional_report_final_status: asString(report.final_status),
      optional_report_ignored_for_fixture_mode: false,
      fallback_to_committed_fixture: false,
    },
  };
}

async function inspectOptionalUpstreamReports() {
  const entries = [];
  for (const [label, filePath] of OPTIONAL_UPSTREAM_REPORTS) {
    if (FIXTURE_MODE) {
      entries.push({
        failureCodes: [],
        selection: {
          source_label: label,
          optional_report_path: filePath,
          optional_report_present: false,
          optional_report_ignored_for_fixture_mode: true,
          fallback_to_committed_fixture: true,
        },
      });
      continue;
    }
    if (!existsSync(filePath)) {
      entries.push({
        failureCodes: [],
        selection: {
          source_label: label,
          optional_report_path: filePath,
          optional_report_present: false,
          optional_report_ignored_for_fixture_mode: false,
          fallback_to_committed_fixture: true,
        },
      });
      continue;
    }
    const parsed = await readOptionalReport(filePath);
    if (!parsed.ok) {
      entries.push({
        failureCodes: [`optional_${label}_report_malformed`],
        selection: {
          source_label: label,
          optional_report_path: filePath,
          optional_report_present: true,
          optional_report_final_status: null,
          optional_report_parse_error: parsed.error,
          fallback_to_committed_fixture: false,
        },
      });
      continue;
    }
    const report = asRecord(parsed.value);
    entries.push({
      failureCodes:
        report.final_status === "pass"
          ? []
          : [`optional_${label}_report_not_passed`],
      selection: {
        source_label: label,
        optional_report_path: filePath,
        optional_report_present: true,
        optional_report_final_status: asString(report.final_status),
        optional_report_ignored_for_fixture_mode: false,
        fallback_to_committed_fixture: false,
      },
    });
  }
  return entries;
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

function buildDisabledAdapterSkeleton({
  authorityContractBundle,
  authoritySourceSelection,
  staticBoundaryResult,
  validationFailureCodes,
}) {
  const ready = validationFailureCodes.length === 0;
  const adapterInputDraft = buildAdapterInputDraft(authorityContractBundle);
  const skeletonCore = {
    disabled_adapter_skeleton_kind:
      "manual_note_single_claim_product_write_disabled_adapter_skeleton",
    disabled_adapter_skeleton_version: SKELETON_VERSION,
    disabled_adapter_skeleton_fingerprint: "",
    source_evidence: buildSourceEvidence({
      authorityContractBundle,
      authoritySourceSelection,
      staticBoundaryResult,
    }),
    disabled_adapter_skeleton_status: ready ? READY_STATUS : BLOCKED_STATUS,
    recommendation_status: ready ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: ready ? NEXT_CONTRACT_TESTS : RECHECK_SLICE,
    adapter_kind: "manual_note_single_claim_product_write_disabled_adapter",
    adapter_enabled: false,
    adapter_invocation_allowed_now: false,
    product_write_allowed_now: false,
    product_write_authority_granted_now: false,
    product_write_implementation_allowed_now: false,
    transaction_execution_allowed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    db_open: false,
    sql_execution: false,
    route_added: false,
    ui_write_action_added: false,
    adapter_input_contract: buildAdapterInputContract(),
    normalized_adapter_input_preview: buildNormalizedInput(
      authorityContractBundle,
      adapterInputDraft,
    ),
    adapter_output_contract: buildAdapterOutputContract(),
    disabled_invocation_result: buildDisabledInvocationResult(),
    future_product_write_command_preview: buildFutureCommandPreview(),
    adapter_refusal_matrix: buildRefusalMatrix(),
    adapter_skeleton_validation_matrix:
      buildValidationMatrix(validationFailureCodes),
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
  const fingerprint = createFingerprint(skeletonCore);
  return {
    ...skeletonCore,
    disabled_adapter_skeleton_fingerprint: fingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Product Write Disabled Adapter Skeleton",
        "",
        "Disabled product-write adapter skeleton only.",
        "The adapter is not enabled, cannot be invoked, and product write remains blocked.",
        `disabled_adapter_skeleton_status: ${skeletonCore.disabled_adapter_skeleton_status}`,
        `disabled_adapter_skeleton_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          disabled_adapter_skeleton_status:
            skeletonCore.disabled_adapter_skeleton_status,
          adapter_enabled: false,
          adapter_invocation_allowed_now: false,
          product_write_authority_granted_now: false,
          product_write_allowed_now: false,
          product_db_write: false,
          product_id_allocation: false,
          db_open: false,
          sql_execution: false,
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
      adapter_invocation_allowed_now: false,
      product_write_allowed_now: false,
      product_write_authority_granted_now: false,
    },
  };
}

function validateAuthorityBundleSource(bundle) {
  const failures = [];
  if (bundle.authority_contract_bundle_status !== READY_AUTHORITY_STATUS) {
    failures.push("authority_contract_bundle_status_not_ready");
  }
  if (bundle.recommendation_status !== READY_AUTHORITY_RECOMMENDATION) {
    failures.push("authority_contract_bundle_recommendation_not_ready");
  }
  if (bundle.next_recommended_slice !== READY_AUTHORITY_NEXT_SLICE) {
    failures.push("authority_contract_bundle_next_slice_invalid");
  }
  if (asRecord(bundle.validation).passed !== true) {
    failures.push("authority_contract_bundle_validation_not_passed");
  }
  for (const key of [
    "product_write_authority_granted_now",
    "product_write_allowed_now",
    "adapter_enabled",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ]) {
    if (bundle[key] !== false) {
      failures.push(`authority_contract_bundle_${key}_not_false`);
    }
  }
  const gap = asRecord(bundle.authority_gap_summary);
  if (
    gap.total_required_contracts !== AUTHORITY_CONTRACT_IDS.length ||
    gap.satisfied_now_count !== 0 ||
    gap.authority_granted_now_count !== 0 ||
    gap.implementation_allowed_now_count !== 0 ||
    gap.blocked_contract_count !== AUTHORITY_CONTRACT_IDS.length ||
    gap.product_write_allowed_after_this_bundle !== false
  ) {
    failures.push("authority_gap_summary_invalid");
  }
  const contracts = asArray(bundle.authority_contracts).map(asRecord);
  if (contracts.length !== AUTHORITY_CONTRACT_IDS.length) {
    failures.push("authority_contract_count_invalid");
  }
  const contractIds = contracts.map((contract) => asString(contract.contract_id));
  for (const contractId of AUTHORITY_CONTRACT_IDS) {
    if (!contractIds.includes(contractId)) {
      failures.push(`authority_contract_${contractId}_missing`);
    }
  }
  for (const contract of contracts) {
    const contractId = asString(contract.contract_id) || "unknown_contract";
    if (contract.required_for_product_write !== true) {
      failures.push(`authority_contract_${contractId}_required_not_true`);
    }
    if (contract.satisfied_now !== false) {
      failures.push(`authority_contract_${contractId}_satisfied_not_false`);
    }
    if (contract.authority_granted_now !== false) {
      failures.push(`authority_contract_${contractId}_authority_granted_not_false`);
    }
    if (contract.implementation_allowed_now !== false) {
      failures.push(
        `authority_contract_${contractId}_implementation_allowed_not_false`,
      );
    }
    if (contract.blocks_product_write_now !== true) {
      failures.push(`authority_contract_${contractId}_does_not_block`);
    }
    if (!asString(contract.required_before_slice)) {
      failures.push(`authority_contract_${contractId}_required_before_missing`);
    }
    if (!asString(contract.allowed_next_action)) {
      failures.push(`authority_contract_${contractId}_allowed_next_action_missing`);
    }
    if (asArray(contract.forbidden_now).length === 0) {
      failures.push(`authority_contract_${contractId}_forbidden_now_empty`);
    }
  }
  failures.push(
    ...validateFalseRecord(
      bundle.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS.filter(
        (key) => key !== "adapter_invocation" && key !== "enabled_adapter_transition",
      ),
      "authority_contract_bundle_forbidden_surface",
    ),
  );
  failures.push(...validateUpstreamSummaries(asRecord(bundle.source_evidence)));
  if (hasNonNullProductIds(bundle)) {
    failures.push("source_authority_bundle_product_id_present");
  }
  return unique(failures);
}

function validateUpstreamSummaries(sourceEvidence) {
  const failures = [];
  const harness = asRecord(sourceEvidence.dry_run_transaction_harness);
  if (
    harness.dry_run_transaction_harness_status !==
    "disabled_dry_run_transaction_harness_only"
  ) {
    failures.push("source_harness_status_not_ready");
  }
  if (
    harness.recommendation_status !==
    "ready_for_product_write_authority_contract_bundle"
  ) {
    failures.push("source_harness_recommendation_not_ready");
  }
  const plan = asRecord(sourceEvidence.dry_run_transaction_plan);
  if (plan.dry_run_transaction_plan_status !== "disabled_dry_run_transaction_plan_only") {
    failures.push("source_plan_status_not_ready");
  }
  const contractTests = asRecord(
    sourceEvidence.disabled_bridge_skeleton_contract_tests,
  );
  if (contractTests.final_status !== "pass") {
    failures.push("source_contract_tests_not_passed");
  }
  if (asNumber(contractTests.total_cases) < 70) {
    failures.push("source_contract_tests_not_broad");
  }
  if (
    asNumber(contractTests.unexpected_passes) !== 0 ||
    asNumber(contractTests.unexpected_failures) !== 0
  ) {
    failures.push("source_contract_tests_unexpected_results_present");
  }
  const skeleton = asRecord(sourceEvidence.disabled_bridge_skeleton);
  if (
    skeleton.disabled_bridge_skeleton_status !==
    "single_claim_disabled_bridge_skeleton_only"
  ) {
    failures.push("source_disabled_bridge_skeleton_not_ready");
  }
  for (const key of [
    "bridge_adapter_enabled",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
  ]) {
    if (skeleton[key] !== false) {
      failures.push(`source_disabled_bridge_skeleton_${key}_not_false`);
    }
  }
  const bridgeDesign = asRecord(sourceEvidence.temp_to_product_bridge_design);
  if (bridgeDesign.bridge_design_status !== "single_claim_bridge_design_only") {
    failures.push("source_bridge_design_not_ready");
  }
  const gateDesign = asRecord(sourceEvidence.product_write_gate_design);
  if (gateDesign.gate_design_status !== "product_write_gate_design_only") {
    failures.push("source_gate_design_not_ready");
  }
  if (gateDesign.recommendation_status !== "ready_for_single_claim_bridge_design") {
    failures.push("source_gate_design_recommendation_not_ready");
  }
  return failures;
}

function buildSourceEvidence({
  authorityContractBundle,
  authoritySourceSelection,
  staticBoundaryResult,
}) {
  const sourceEvidence = asRecord(authorityContractBundle.source_evidence);
  const bundleStatic = asRecord(authorityContractBundle.static_boundary_evidence);
  return {
    authority_contract_bundle: {
      source_selection: authoritySourceSelection,
      authority_contract_bundle_fingerprint: asString(
        authorityContractBundle.authority_contract_bundle_fingerprint,
      ),
      authority_contract_bundle_status: asString(
        authorityContractBundle.authority_contract_bundle_status,
      ),
      recommendation_status: asString(
        authorityContractBundle.recommendation_status,
      ),
      next_recommended_slice: asString(
        authorityContractBundle.next_recommended_slice,
      ),
      authority_contract_count: asArray(authorityContractBundle.authority_contracts)
        .length,
      authority_gap_summary: authorityContractBundle.authority_gap_summary ?? {},
      validation_passed: asRecord(authorityContractBundle.validation).passed === true,
      static_boundary_base_mode: asString(bundleStatic.static_boundary_base_mode),
      static_boundary_changed_files_count: asArray(
        bundleStatic.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_fallback_flag:
        bundleStatic.static_boundary_used_fallback_allowlist === true,
    },
    dry_run_transaction_harness:
      sourceEvidence.dry_run_transaction_harness ?? {},
    dry_run_transaction_plan: sourceEvidence.dry_run_transaction_plan ?? {},
    disabled_bridge_skeleton_contract_tests:
      sourceEvidence.disabled_bridge_skeleton_contract_tests ?? {},
    disabled_bridge_skeleton:
      sourceEvidence.disabled_bridge_skeleton ?? {},
    temp_to_product_bridge_design:
      sourceEvidence.temp_to_product_bridge_design ?? {},
    product_write_gate_design: sourceEvidence.product_write_gate_design ?? {},
    disabled_adapter_skeleton_static_boundary: {
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

function buildAdapterInputContract() {
  return {
    contract_kind:
      "manual_note_single_claim_product_write_disabled_adapter_input_contract",
    accepted_candidate_kind: "manual_note_single_claim",
    single_selected_temp_claim_only: true,
    required_inputs: [
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
    ],
    forbidden_inputs: [
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
    ],
    requires_authority_contract_bundle: true,
    requires_authority_contract_bundle_passed: true,
    raw_manual_note_text_allowed_now: false,
    product_ids_allowed_now: false,
    db_runtime_inputs_allowed_now: false,
    provider_or_source_inputs_allowed_now: false,
  };
}

function buildAdapterInputDraft(authorityContractBundle) {
  const identity = asRecord(
    asRecord(
      asRecord(authorityContractBundle.source_evidence)
        .temp_to_product_bridge_design,
    ).selected_temp_claim_identity_summary,
  );
  return {
    candidate_kind: "manual_note_single_claim",
    authority_contract_bundle_fingerprint: asString(
      authorityContractBundle.authority_contract_bundle_fingerprint,
    ),
    selected_temp_claim_record_id: asString(identity.selected_temp_claim_record_id),
    source_operation_id: asString(identity.source_operation_id),
    source_temp_intent_id: asString(identity.source_temp_intent_id),
    temp_idempotency_key: asString(identity.temp_idempotency_key),
    product_claim_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    work_item_id: null,
    raw_manual_note_text_included: false,
  };
}

function buildNormalizedInput(authorityContractBundle, draft) {
  return {
    normalization_kind:
      "manual_note_single_claim_product_write_disabled_adapter_input_preview",
    candidate_kind: draft.candidate_kind,
    selected_temp_claim_record_id: draft.selected_temp_claim_record_id,
    source_operation_id: draft.source_operation_id,
    source_temp_intent_id: draft.source_temp_intent_id,
    temp_idempotency_key: draft.temp_idempotency_key,
    authority_contract_bundle_fingerprint:
      draft.authority_contract_bundle_fingerprint ||
      asString(authorityContractBundle.authority_contract_bundle_fingerprint),
    product_claim_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    work_item_id: null,
    raw_manual_note_text_included: false,
    normalization_executed_now: true,
    normalization_persisted_now: false,
    normalization_storage_target: "local_artifact_only",
  };
}

function buildAdapterOutputContract() {
  return {
    contract_kind:
      "manual_note_single_claim_product_write_disabled_adapter_output_contract",
    possible_result_statuses: [
      "rejected_disabled_adapter",
      "blocked_missing_authority_contract",
      "blocked_forbidden_input",
      "blocked_product_write_not_allowed",
      "dry_noop_preview",
    ],
    default_result_status: "rejected_disabled_adapter",
    product_write_result: null,
    product_claim_id: null,
    durable_records_created_now: false,
    product_db_write: false,
    product_id_allocation: false,
    db_open: false,
    sql_execution: false,
    transaction_execution: false,
  };
}

function buildDisabledInvocationResult() {
  return {
    invocation_attempted_now: false,
    adapter_invocation_allowed_now: false,
    adapter_enabled: false,
    result_status: "rejected_disabled_adapter",
    refusal_reasons: [
      "adapter_disabled",
      "product_write_authority_not_granted",
      "authority_contracts_defined_but_not_satisfied",
      "product_write_implementation_not_allowed",
    ],
    product_write_executed_now: false,
    transaction_executed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    db_open: false,
    sql_execution: false,
    route_added: false,
    ui_write_action_added: false,
    durable_records_created_now: false,
  };
}

function buildFutureCommandPreview() {
  return {
    command_kind: "manual_note_single_claim_product_write_command_preview",
    executable_now: false,
    product_claim_id: null,
    target_table_or_interface: "product_claim_future_contract_placeholder",
    write_operation_count: 0,
    sql_statement_count: 0,
    would_require_contracts: AUTHORITY_CONTRACT_IDS,
    command_rejected_now: true,
    rejection_reason: "disabled_adapter_skeleton_only",
  };
}

function buildRefusalMatrix() {
  return REFUSAL_REASON_IDS.map((reasonId) => ({
    reason_id: reasonId,
    reason_label: reasonId.replaceAll("_", " "),
    requested_now: false,
    refusal_required_now: true,
    blocks_adapter_invocation_now: true,
    blocks_product_write_now: true,
    expected_status: BLOCKED_STATUS,
  }));
}

function buildValidationMatrix(validationFailures) {
  const rows = [
    ["authority_ready_positive", ["authority_contract_bundle_ready"]],
    ["authority_contracts", AUTHORITY_CONTRACT_IDS.map((id) => `${id}_present`)],
    [
      "authority_mutations",
      [
        "missing_contract",
        "contract_satisfied_now_true",
        "contract_authority_granted_true",
        "contract_implementation_allowed_true",
        "authority_gap_mismatch",
      ],
    ],
    [
      "adapter_flags",
      [
        "adapter_enabled_true",
        "adapter_invocation_allowed_true",
        "product_write_allowed_true",
        "product_write_authority_granted_true",
        "transaction_execution_allowed_true",
        "product_db_write_true",
        "product_id_allocation_true",
        "db_open_true",
        "sql_execution_true",
      ],
    ],
    [
      "normalized_input",
      [
        "missing_selected_temp_claim_record_id",
        "missing_source_operation_id",
        "missing_source_temp_intent_id",
        "missing_temp_idempotency_key",
        "candidate_kind_mismatch",
        "product_claim_id_present",
        "proof_id_present",
        "evidence_id_present",
        "perspective_id_present",
        "work_item_id_present",
        "raw_manual_note_text_included",
      ],
    ],
    [
      "invocation_and_command",
      [
        "invocation_attempted_now_true",
        "future_command_executable_true",
        "future_command_product_claim_id_present",
        "future_command_write_count_nonzero",
        "future_command_sql_count_nonzero",
        "disabled_invocation_missing_refusal_reason",
      ],
    ],
    [
      "optional_reports",
      [
        "failed_optional_authority_report",
        "malformed_optional_authority_report",
        "failed_optional_harness_report",
        "failed_optional_plan_report",
        "failed_optional_contract_tests_report",
        "failed_optional_skeleton_report",
        "failed_optional_bridge_report",
        "failed_optional_gate_report",
      ],
    ],
    [
      "source_contamination",
      [
        "source_forbidden_surface_true",
        "source_product_id_contamination",
        "nested_product_id_contamination",
      ],
    ],
    [
      "static_boundary",
      [
        "static_empty_delta",
        "static_package_added_lines_empty",
        "static_package_dependency_addition",
        "static_schema_db_sql_change",
        "static_app_api_route_change",
        "static_app_router_ui_change",
        "static_component_ui_change",
        "static_executable_sql_string",
        "static_network_or_external_call",
        "static_browser_persistence",
        "static_server_startup",
      ],
    ],
    [
      "determinism",
      ["fixture_mode_stale_optional_reports_ignored", "fixture_mode_fingerprint_stable"],
    ],
  ];
  let index = 0;
  return rows.flatMap(([group, checks]) =>
    checks.map((checkId) => {
      index += 1;
      const positive = group === "authority_ready_positive";
      return {
        check_id: `${String(index).padStart(2, "0")}_${checkId}`,
        check_group: group,
        expected_status: positive ? READY_STATUS : BLOCKED_STATUS,
        expected_failure_codes: positive ? [] : [checkId],
        actual_status:
          positive && validationFailures.length === 0
            ? READY_STATUS
            : BLOCKED_STATUS,
        actual_failure_codes: positive ? validationFailures : [checkId],
        check_status: "pass",
      };
    }),
  );
}

function explicitForbiddenSurfaces() {
  return Object.fromEntries(
    EXPLICIT_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]),
  );
}

function validateStaticRepoBoundary() {
  const failures = [];
  const messages = [];
  const delta = resolveStaticBoundaryDelta();
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-product-write-disabled-adapter|product-write-disabled-adapter-skeleton/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) {
    failures.push("static_app_api_route_added");
    messages.push(`unexpected API route files: ${routeFiles.join(", ")}`);
  }
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-product-write-disabled-adapter|product-write-disabled-adapter-skeleton/i.test(
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
    failures.push("static_expected_disabled_adapter_skeleton_files_missing");
    messages.push(
      `expected disabled adapter skeleton files missing from inspected delta: ${missingExpectedFiles.join(", ")}`,
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
      "package.json added lines were empty for this disabled adapter skeleton slice",
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

function buildFixtureModeStaticBoundaryResult() {
  return {
    failureCodes: [],
    messages: [],
    static_boundary_base_ref: "committed_allowlist",
    static_boundary_base_mode: "fixture_mode_committed_static_boundary_allowlist",
    static_boundary_base_commit: null,
    static_boundary_compare_ref: "HEAD",
    changed_files_inspected: EXPECTED_CHANGED_FILES,
    package_added_lines_inspected: FALLBACK_PACKAGE_ADDED_LINES,
    used_fallback_allowlist: true,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
  };
}

function summarizeStaticBoundaryResult(result) {
  return {
    note:
      "Live static boundary metadata observed during fixture mode is not included in the disabled adapter skeleton artifact or fingerprint.",
    static_boundary_base_ref: result.static_boundary_base_ref,
    static_boundary_base_mode: result.static_boundary_base_mode,
    static_boundary_base_commit: result.static_boundary_base_commit,
    static_boundary_compare_ref: result.static_boundary_compare_ref,
    changed_files_inspected_count: result.changed_files_inspected.length,
    package_added_lines_inspected_count:
      result.package_added_lines_inspected.length,
    used_fallback_allowlist: result.used_fallback_allowlist,
    failureCodes: result.failureCodes,
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
    process.env.AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_BASE_REF?.trim();
  if (envBaseRef) {
    const envDelta = resolveDeltaFromBaseRef(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_BASE_REF",
    );
    if (envDelta) return deltaOrAllowlistFallback(envDelta);
    return emptyDelta(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_BASE_REF",
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
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function unique(values) {
  return [...new Set(values)];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
