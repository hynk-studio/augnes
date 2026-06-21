import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTRACT_TEST_VERSION =
  "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const CONTRACT_TESTS_PATH = path.join(ARTIFACT_DIR, "contract-tests.json");
const HELPER_INPUT_PATH = path.join(ARTIFACT_DIR, "helper-input.json");

const PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope.sample.v0.1.json";
const CONTRACT_TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope-contract-test-cases.v0.1.json";
const OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-v0-1/report.json";

const OPTIONAL_UPSTREAM_REPORT_SPECS = [
  [
    "dry_run_invocation_harness",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1/report.json",
    "dry_run_invocation_harness",
    "dry_run_invocation_harness",
  ],
  [
    "disabled_adapter_contract_tests",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
    null,
    "case_results",
  ],
  [
    "disabled_adapter_skeleton",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json",
    "disabled_adapter_skeleton",
    "disabled_adapter_skeleton",
  ],
  [
    "authority_contract_bundle",
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
    "authority_contract_bundle",
    "authority_contract_bundle",
  ],
  [
    "product_write_gate_design",
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
    "product_write_gate_design",
    "product_write_gate_design",
  ],
];

const HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-product-write-preflight-command-envelope-contract-tests.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs";
const TSX_PATH = "apps/augnes_apps/node_modules/.bin/tsx";

const FIXTURE_MODE =
  process.env
    .AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_FIXTURE_MODE ===
  "1";

const CONTRACT_SUITE_STATUS =
  "product_write_preflight_command_envelope_contract_tests_passed";
const BLOCKED_SUITE_STATUS =
  "blocked_before_product_write_preflight_command_envelope_contract_tests";
const READY_RECOMMENDATION = "ready_for_product_write_preflight_stopline";
const BLOCKED_RECOMMENDATION = "blocked_before_product_write_preflight_stopline";
const NEXT_STOPLINE = "single_claim_product_write_preflight_stopline";
const RECHECK_SLICE =
  "single_claim_product_write_preflight_command_envelope_contract_tests_recheck";

const EXPECTED_CHANGED_FILES = [
  "docs/00_INDEX_LATEST.md",
  CONTRACT_TEST_CASES_FIXTURE_PATH,
  HELPER_PATH,
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  RUNNER_PATH,
  SMOKE_PATH,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
];
const ALLOWED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
  "contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
];
const FALLBACK_PACKAGE_ADDED_LINES = [
  '+    "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",',
  '+    "contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1": "node scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",',
];
const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const committedPreflightEnvelope = await readJson(
    PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH,
  );
  const contractTestCases = await readJson(CONTRACT_TEST_CASES_FIXTURE_PATH);
  const selectedPreflight = await selectPreflightCommandEnvelope(
    committedPreflightEnvelope,
  );
  const optionalUpstreamReports = await inspectOptionalUpstreamReports(
    selectedPreflight.value,
  );
  const liveStaticBoundaryResult = validateStaticRepoBoundary();
  const staticBoundaryResult = FIXTURE_MODE
    ? buildFixtureModeStaticBoundaryResult()
    : liveStaticBoundaryResult;
  const staticBoundaryEvidence = buildStaticBoundaryEvidence(staticBoundaryResult);
  const sourceValidationFailureCodes = unique([
    ...selectedPreflight.failureCodes,
    ...optionalUpstreamReports.flatMap((entry) => entry.failureCodes),
    ...staticBoundaryResult.failureCodes,
  ]);
  const contractSuite = await invokeHelper({
    preflightCommandEnvelope: selectedPreflight.value,
    preflightCommandEnvelopeReport: selectedPreflight.report,
    upstreamSourceReports: optionalUpstreamReports.map((entry) => entry.selection),
    staticBoundaryEvidence,
    sourceValidationFailureCodes,
    contractTestCases,
  });
  const finalStatus =
    asRecord(contractSuite.validation).passed === true &&
    contractSuite.contract_suite_status === CONTRACT_SUITE_STATUS
      ? "pass"
      : "fail";
  const report = {
    report_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests_report",
    report_version: CONTRACT_TEST_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      contract_tests: CONTRACT_TESTS_PATH,
    },
    input_paths: {
      preflight_command_envelope_fixture: PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH,
      contract_test_cases_fixture: CONTRACT_TEST_CASES_FIXTURE_PATH,
      optional_preflight_command_envelope_report:
        OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH,
      optional_upstream_reports: Object.fromEntries(
        OPTIONAL_UPSTREAM_REPORT_SPECS.map(([label, filePath]) => [
          label,
          filePath,
        ]),
      ),
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
      preflight_command_envelope: selectedPreflight.selection,
      upstream_reports: optionalUpstreamReports.map((entry) => entry.selection),
    },
    non_fingerprinted_runtime_notes: {
      fixture_mode: FIXTURE_MODE,
      fixture_mode_live_static_boundary_result: FIXTURE_MODE
        ? summarizeStaticBoundaryResult(liveStaticBoundaryResult)
        : null,
      optional_preflight_command_envelope_report_present_on_disk: existsSync(
        OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH,
      ),
      optional_upstream_reports_present_on_disk: Object.fromEntries(
        OPTIONAL_UPSTREAM_REPORT_SPECS.map(([label, filePath]) => [
          label,
          existsSync(filePath),
        ]),
      ),
    },
    contract_suite: contractSuite,
    source_evidence: contractSuite.source_evidence,
    contract_suite_status:
      finalStatus === "pass" ? CONTRACT_SUITE_STATUS : BLOCKED_SUITE_STATUS,
    recommendation_status:
      finalStatus === "pass" ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: finalStatus === "pass" ? NEXT_STOPLINE : RECHECK_SLICE,
    final_status: finalStatus,
    total_cases: asNumber(asRecord(contractSuite.coverage_summary).total_cases),
    positive_cases: asNumber(
      asRecord(contractSuite.coverage_summary).positive_cases,
    ),
    expected_negative_cases: asNumber(
      asRecord(contractSuite.coverage_summary).expected_negative_cases,
    ),
    unexpected_passes: asNumber(
      asRecord(contractSuite.coverage_summary).unexpected_pass_count,
    ),
    unexpected_failures: asNumber(
      asRecord(contractSuite.coverage_summary).unexpected_failure_count,
    ),
    suite_fingerprint: contractSuite.suite_fingerprint,
    source_preflight_command_envelope_fingerprint:
      contractSuite.source_preflight_command_envelope_fingerprint,
    coverage_summary: contractSuite.coverage_summary,
    static_boundary_result: staticBoundaryResult,
    static_boundary_evidence: contractSuite.static_boundary_evidence,
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
    validation: {
      passed: finalStatus === "pass",
      failure_codes: unique([
        ...sourceValidationFailureCodes,
        ...asArray(asRecord(contractSuite.validation).failure_codes).map(asString),
      ]),
    },
  };

  await writeFile(CONTRACT_TESTS_PATH, `${JSON.stringify(contractSuite, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        contracts:
          "research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
        final_status: report.final_status,
        total_cases: report.total_cases,
        positive_cases: report.positive_cases,
        expected_negative_cases: report.expected_negative_cases,
        unexpected_passes: report.unexpected_passes,
        unexpected_failures: report.unexpected_failures,
        contract_suite_status: report.contract_suite_status,
        recommendation_status: report.recommendation_status,
        next_recommended_slice: report.next_recommended_slice,
        static_boundary_base_mode: report.static_boundary_base_mode,
        static_boundary_changed_files_inspected:
          report.static_boundary_changed_files_inspected.length,
        artifact_paths: report.artifact_paths,
      },
      null,
      2,
    ),
  );

  if (report.final_status !== "pass") process.exitCode = 1;
}

async function selectPreflightCommandEnvelope(committedFixture) {
  const baseSelection = {
    source_label: "preflight_command_envelope",
    source_used: "committed_fixture",
    fixture_path: PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH,
    optional_report_path: OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH,
    optional_report_present: false,
    optional_report_ignored_for_fixture_mode: FIXTURE_MODE,
    fallback_to_committed_fixture: true,
    expected_payload_key: "preflight_command_envelope",
    nested_payload_present: true,
    traceability_checked: false,
    traceability_status: FIXTURE_MODE
      ? "not_checked_fixture_mode"
      : "not_checked_absent",
    traceability_failure_code: null,
    compared_fields: [],
    payload_summary: summarizePreflightEnvelope(committedFixture),
  };
  if (FIXTURE_MODE) {
    return {
      value: committedFixture,
      report: {},
      selection: baseSelection,
      failureCodes: [],
    };
  }
  if (!existsSync(OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH)) {
    return {
      value: committedFixture,
      report: {},
      selection: baseSelection,
      failureCodes: [],
    };
  }
  let report;
  try {
    report = await readJson(OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH);
  } catch {
    return {
      value: {},
      report: {},
      selection: {
        ...baseSelection,
        source_used: "optional_report_malformed",
        optional_report_present: true,
        fallback_to_committed_fixture: false,
        nested_payload_present: false,
        payload_summary: {},
        traceability_status: "not_checked_failed_or_missing_payload",
      },
      failureCodes: ["optional_preflight_command_envelope_report_malformed"],
    };
  }
  const payload = asRecord(report.preflight_command_envelope);
  if (report.final_status !== "pass") {
    return {
      value: payload,
      report,
      selection: {
        ...baseSelection,
        source_used: "optional_report_failed",
        optional_report_present: true,
        fallback_to_committed_fixture: false,
        final_status: report.final_status ?? null,
        nested_payload_present: hasNonEmptyPayload(payload),
        payload_summary: summarizePreflightEnvelope(payload),
        traceability_status: "not_checked_failed_or_missing_payload",
      },
      failureCodes: ["optional_preflight_command_envelope_report_not_passed"],
    };
  }
  if (!hasNonEmptyPayload(payload)) {
    return {
      value: {},
      report,
      selection: {
        ...baseSelection,
        source_used: "optional_report_missing_payload",
        optional_report_present: true,
        fallback_to_committed_fixture: false,
        final_status: "pass",
        nested_payload_present: false,
        payload_summary: {},
        traceability_status: "not_checked_failed_or_missing_payload",
      },
      failureCodes: ["optional_preflight_command_envelope_report_missing_payload"],
    };
  }
  const comparison = comparePreflightEnvelopePayload(payload, committedFixture);
  return {
    value: payload,
    report,
    selection: {
      ...baseSelection,
      source_used: "optional_report_passed",
      optional_report_present: true,
      fallback_to_committed_fixture: false,
      final_status: "pass",
      nested_payload_present: true,
      payload_summary: summarizePreflightEnvelope(payload),
      traceability_checked: true,
      traceability_status: comparison.matched ? "matched" : "mismatched",
      traceability_failure_code: comparison.failureCode,
      compared_fields: comparison.comparedFields,
    },
    failureCodes: comparison.matched ? [] : [comparison.failureCode],
  };
}

async function inspectOptionalUpstreamReports(preflightCommandEnvelope) {
  const selections = [];
  for (const [label, filePath, nestedKey, payloadKey] of OPTIONAL_UPSTREAM_REPORT_SPECS) {
    selections.push(
      await inspectOptionalUpstreamReport({
        label,
        filePath,
        nestedKey,
        payloadKey,
        preflightCommandEnvelope,
      }),
    );
  }
  return selections;
}

async function inspectOptionalUpstreamReport({
  label,
  filePath,
  nestedKey,
  payloadKey,
  preflightCommandEnvelope,
}) {
  const baseSelection = {
    source_label: label,
    source_used: "absent_optional_report",
    fixture_path: null,
    optional_report_path: filePath,
    optional_report_present: false,
    optional_report_ignored_for_fixture_mode: FIXTURE_MODE,
    fallback_to_committed_fixture: true,
    expected_payload_key: payloadKey,
    nested_payload_present: false,
    traceability_checked: false,
    traceability_status: FIXTURE_MODE
      ? "not_checked_fixture_mode"
      : "not_checked_absent",
    traceability_failure_code: null,
    compared_fields: [],
    payload_summary: {},
  };
  if (FIXTURE_MODE || !existsSync(filePath)) {
    return { selection: baseSelection, failureCodes: [] };
  }
  let report;
  try {
    report = await readJson(filePath);
  } catch {
    return {
      selection: {
        ...baseSelection,
        source_used: "optional_report_malformed",
        optional_report_present: true,
        fallback_to_committed_fixture: false,
        traceability_status: "not_checked_failed_or_missing_payload",
      },
      failureCodes: [`optional_${label}_report_malformed`],
    };
  }
  const rawPayload = nestedKey ? asRecord(report[nestedKey]) : report;
  const comparablePayload = buildComparableOptionalPayload({
    label,
    report,
    payload: rawPayload,
  });
  if (report.final_status !== "pass") {
    return {
      selection: {
        ...baseSelection,
        source_used: "optional_report_failed",
        optional_report_present: true,
        fallback_to_committed_fixture: false,
        final_status: report.final_status ?? null,
        nested_payload_present: hasNonEmptyPayload(report[payloadKey]),
        payload_summary: summarizeOptionalPayload(label, comparablePayload),
        traceability_status: "not_checked_failed_or_missing_payload",
      },
      failureCodes: [`optional_${label}_report_not_passed`],
    };
  }
  if (!hasNonEmptyPayload(report[payloadKey])) {
    return {
      selection: {
        ...baseSelection,
        source_used: "optional_report_missing_payload",
        optional_report_present: true,
        fallback_to_committed_fixture: false,
        final_status: "pass",
        nested_payload_present: false,
        traceability_status: "not_checked_failed_or_missing_payload",
      },
      failureCodes: [`optional_${label}_report_missing_payload`],
    };
  }
  const sourceSummary = asRecord(
    asRecord(preflightCommandEnvelope.source_evidence)[sourceEvidenceKeyForLabel(label)],
  );
  const comparison = compareOptionalSourcePayload({
    label,
    payload: comparablePayload,
    sourceSummary,
  });
  return {
    selection: {
      ...baseSelection,
      source_used: "optional_report_passed",
      optional_report_present: true,
      fallback_to_committed_fixture: false,
      final_status: "pass",
      nested_payload_present: true,
      payload_summary: summarizeOptionalPayload(label, comparablePayload),
      traceability_checked: true,
      traceability_status: comparison.matched ? "matched" : "mismatched",
      traceability_failure_code: comparison.failureCode,
      compared_fields: comparison.comparedFields,
    },
    failureCodes: comparison.matched ? [] : [comparison.failureCode],
  };
}

function comparePreflightEnvelopePayload(payload, committedFixture) {
  const comparedFields = [
    "preflight_command_envelope_fingerprint",
    "preflight_command_envelope_status",
    "recommendation_status",
    "next_recommended_slice",
  ];
  const matched = comparedFields.every(
    (field) =>
      payload[field] !== undefined &&
      committedFixture[field] !== undefined &&
      payload[field] === committedFixture[field],
  );
  return {
    matched,
    failureCode: matched
      ? null
      : "optional_preflight_command_envelope_traceability_mismatch",
    comparedFields,
  };
}

function compareOptionalSourcePayload({ label, payload, sourceSummary }) {
  const comparedFields = optionalTraceabilityFields(label);
  const failureCode = `optional_${label}_traceability_mismatch`;
  let matched = true;
  for (const fieldPath of comparedFields) {
    const payloadValue = getPath(payload, fieldPath);
    const sourceValue = getPath(sourceSummary, fieldPath);
    if (payloadValue === undefined || sourceValue === undefined) {
      matched = false;
      continue;
    }
    if (payloadValue !== sourceValue) matched = false;
  }
  if (label === "disabled_adapter_skeleton" && payload.adapter_enabled !== false) {
    matched = false;
  }
  if (label === "authority_contract_bundle") {
    const authorityGranted = getPath(payload, [
      "authority_gap_summary",
      "authority_granted_now_count",
    ]);
    const implementationAllowed = getPath(payload, [
      "authority_gap_summary",
      "implementation_allowed_now_count",
    ]);
    if (authorityGranted !== undefined && authorityGranted !== 0) matched = false;
    if (implementationAllowed !== undefined && implementationAllowed !== 0) matched = false;
  }
  return {
    matched,
    failureCode: matched ? null : failureCode,
    comparedFields: comparedFields.map((fieldPath) => fieldPath.join(".")),
  };
}

function optionalTraceabilityFields(label) {
  if (label === "dry_run_invocation_harness") {
    return [
      ["dry_run_invocation_harness_fingerprint"],
      ["final_status"],
      ["dry_run_invocation_harness_status"],
    ];
  }
  if (label === "disabled_adapter_contract_tests") {
    return [
      ["suite_fingerprint"],
      ["final_status"],
      ["contract_suite_status"],
      ["total_cases"],
    ];
  }
  if (label === "disabled_adapter_skeleton") {
    return [
      ["disabled_adapter_skeleton_fingerprint"],
      ["disabled_adapter_skeleton_status"],
      ["adapter_enabled"],
    ];
  }
  if (label === "authority_contract_bundle") {
    return [
      ["authority_contract_bundle_fingerprint"],
      ["authority_contract_bundle_status"],
      ["authority_gap_summary", "total_required_contracts"],
      ["authority_gap_summary", "blocked_contract_count"],
      ["authority_gap_summary", "authority_granted_now_count"],
      ["authority_gap_summary", "implementation_allowed_now_count"],
    ];
  }
  if (label === "product_write_gate_design") {
    return [
      ["design_fingerprint"],
      ["gate_design_status"],
      ["recommendation_status"],
    ];
  }
  return [];
}

function sourceEvidenceKeyForLabel(label) {
  return label === "dry_run_invocation_harness"
    ? "disabled_adapter_dry_run_invocation_harness"
    : label;
}

function buildComparableOptionalPayload({ label, report, payload }) {
  if (label === "dry_run_invocation_harness") {
    return { ...payload, final_status: report.final_status ?? payload.final_status };
  }
  return payload;
}

function summarizePreflightEnvelope(payload) {
  const record = asRecord(payload);
  return {
    preflight_command_envelope_fingerprint:
      record.preflight_command_envelope_fingerprint ?? null,
    preflight_command_envelope_status:
      record.preflight_command_envelope_status ?? null,
    recommendation_status: record.recommendation_status ?? null,
    next_recommended_slice: record.next_recommended_slice ?? null,
  };
}

function summarizeOptionalPayload(label, payload) {
  const record = asRecord(payload);
  if (label === "dry_run_invocation_harness") {
    return {
      dry_run_invocation_harness_fingerprint:
        record.dry_run_invocation_harness_fingerprint ?? null,
      final_status: record.final_status ?? null,
      dry_run_invocation_harness_status:
        record.dry_run_invocation_harness_status ?? null,
    };
  }
  if (label === "disabled_adapter_contract_tests") {
    return {
      suite_fingerprint: record.suite_fingerprint ?? null,
      final_status: record.final_status ?? null,
      contract_suite_status: record.contract_suite_status ?? null,
      total_cases: record.total_cases ?? null,
    };
  }
  if (label === "disabled_adapter_skeleton") {
    return {
      disabled_adapter_skeleton_fingerprint:
        record.disabled_adapter_skeleton_fingerprint ?? null,
      disabled_adapter_skeleton_status:
        record.disabled_adapter_skeleton_status ?? null,
      adapter_enabled: record.adapter_enabled ?? null,
    };
  }
  if (label === "authority_contract_bundle") {
    const gap = asRecord(record.authority_gap_summary);
    return {
      authority_contract_bundle_fingerprint:
        record.authority_contract_bundle_fingerprint ?? null,
      authority_contract_bundle_status:
        record.authority_contract_bundle_status ?? null,
      authority_gap_summary: {
        total_required_contracts: gap.total_required_contracts ?? null,
        blocked_contract_count: gap.blocked_contract_count ?? null,
        authority_granted_now_count: gap.authority_granted_now_count ?? null,
        implementation_allowed_now_count:
          gap.implementation_allowed_now_count ?? null,
      },
    };
  }
  if (label === "product_write_gate_design") {
    return {
      design_fingerprint: record.design_fingerprint ?? null,
      gate_design_status: record.gate_design_status ?? null,
      recommendation_status: record.recommendation_status ?? null,
    };
  }
  return {};
}

async function invokeHelper(input) {
  await writeFile(HELPER_INPUT_PATH, `${JSON.stringify(input, null, 2)}\n`);
  const script = `
    import { readFileSync, writeFileSync } from "node:fs";
    import { buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests } from "./${HELPER_PATH}";
    const input = JSON.parse(readFileSync("${HELPER_INPUT_PATH}", "utf8"));
    const suite = buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests(input);
    writeFileSync("${CONTRACT_TESTS_PATH}", JSON.stringify(suite, null, 2) + "\\n");
  `;
  execFileSync(TSX_PATH, ["--eval", script], { stdio: "pipe" });
  return JSON.parse(await readFile(CONTRACT_TESTS_PATH, "utf8"));
}

function validateStaticRepoBoundary() {
  const failures = [];
  const messages = [];
  const delta = resolveStaticBoundaryDelta();
  const evidence = buildStaticBoundaryEvidence({
    failureCodes: [],
    messages: [],
    static_boundary_base_ref: delta.baseRef,
    static_boundary_base_mode: delta.baseMode,
    static_boundary_base_commit: delta.baseCommit,
    static_boundary_compare_ref: delta.compareRef,
    changed_files_inspected: delta.changedFiles,
    package_added_lines_inspected: delta.packageAddedLines,
    used_fallback_allowlist: delta.usedFallbackAllowlist,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
  });
  failures.push(...validateStaticBoundaryEvidence(evidence));
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-product-write-preflight-command-envelope-contract-tests|preflight-command-envelope-contract-tests/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) failures.push("static_app_api_route_added");
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-product-write-preflight-command-envelope-contract-tests|preflight-command-envelope-contract-tests/i.test(
      filePath,
    ),
  );
  if (uiFiles.length > 0) failures.push("static_ui_file_added");
  for (const [filePath, text] of STATIC_SCAN_PATHS.map((scanPath) => [
    scanPath,
    existsSync(scanPath) ? readFileSync(scanPath, "utf8") : "",
  ])) {
    if (executableSqlPattern().test(text)) {
      failures.push("static_executable_sql_string_present");
      messages.push(`executable SQL-like string found in ${filePath}`);
    }
    if (forbiddenImportPattern().test(text)) {
      failures.push("static_forbidden_import_present");
      messages.push(`forbidden import found in ${filePath}`);
    }
    if (networkOrExternalCallPattern().test(text)) {
      failures.push("static_network_or_external_call_present");
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

function validateStaticBoundaryEvidence(evidence) {
  const failures = [];
  const changedFiles = asArray(
    evidence.static_boundary_changed_files_inspected ??
      evidence.changed_files_inspected,
  ).map(asString);
  const packageLines = asArray(
    evidence.static_boundary_package_added_lines_inspected ??
      evidence.package_added_lines_inspected,
  ).map(asString);
  if (changedFiles.length === 0) failures.push("static_boundary_changed_file_delta_empty");
  const expectedFiles = asArray(evidence.expected_changed_files).map(asString);
  if (expectedFiles.some((filePath) => !changedFiles.includes(filePath))) {
    failures.push("static_boundary_expected_files_missing");
  }
  if (packageLines.length === 0) failures.push("static_boundary_package_added_lines_empty");
  if (changedFiles.some(isSchemaDbSqlPath)) failures.push("static_boundary_schema_db_sql_changed");
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) failures.push("static_boundary_app_api_route_changed");
  if (changedFiles.some(isUiFilePath)) failures.push("static_boundary_ui_changed");
  const allowedScripts = asArray(evidence.allowed_package_script_names).map(asString);
  for (const line of packageLines) {
    if (!allowedScripts.some((scriptName) => line.includes(`"${scriptName}"`))) {
      failures.push("static_boundary_package_addition_outside_allowlist");
    }
  }
  if (
    allowedScripts.some(
      (scriptName) => !packageLines.some((line) => line.includes(`"${scriptName}"`)),
    )
  ) {
    failures.push("static_boundary_expected_package_script_missing");
  }
  const probeText = asString(evidence.static_boundary_probe_text);
  if (probeText) {
    if (executableSqlPattern().test(probeText)) failures.push("static_boundary_executable_sql_string_present");
    if (forbiddenImportPattern().test(probeText)) failures.push("static_boundary_forbidden_import_present");
    if (networkOrExternalCallPattern().test(probeText)) failures.push("static_boundary_network_or_external_call_present");
    if (browserPersistencePattern().test(probeText)) failures.push("static_boundary_browser_persistence_present");
    if (appServerStartupPattern().test(probeText)) failures.push("static_boundary_app_server_startup_present");
  }
  return unique(failures);
}

function buildStaticBoundaryEvidence(result) {
  return {
    static_boundary_base_ref: result.static_boundary_base_ref,
    static_boundary_base_mode: result.static_boundary_base_mode,
    static_boundary_base_commit: result.static_boundary_base_commit,
    static_boundary_compare_ref: result.static_boundary_compare_ref,
    changed_files_inspected: result.changed_files_inspected,
    package_added_lines_inspected: result.package_added_lines_inspected,
    static_boundary_changed_files_inspected: result.changed_files_inspected,
    static_boundary_package_added_lines_inspected:
      result.package_added_lines_inspected,
    static_boundary_used_fallback_allowlist: result.used_fallback_allowlist,
    expected_changed_files: result.expected_changed_files,
    allowed_package_script_names: result.allowed_package_script_names,
    static_boundary_probe_text: "",
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
      "Live static boundary metadata observed during fixture mode is not included in the contract-test artifact or fingerprint.",
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

function resolveStaticBoundaryDelta() {
  const envBaseRef =
    process.env
      .AUGNES_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_BASE_REF?.trim();
  if (envBaseRef) {
    const envDelta = resolveDeltaFromBaseRef(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_BASE_REF",
    );
    if (envDelta) return deltaOrAllowlistFallback(envDelta);
    return emptyDelta(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_BASE_REF",
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
  const changedFiles = unique([
    ...readGitLines(["diff", "--name-only", baseCommit, "--"]),
    ...readGitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    baseCommit,
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

function executableSqlPattern() {
  return new RegExp(
    `\\b(${[
      ["CREATE", "TABLE"].join("\\s+"),
      ["INSERT", "INTO"].join("\\s+"),
      ["ALTER", "TABLE"].join("\\s+"),
      ["DROP", "TABLE"].join("\\s+"),
      "UPDATE\\s+\\w+",
      "DELETE\\s+FROM",
    ].join("|")})\\b`,
    "i",
  );
}

function forbiddenImportPattern() {
  const forbidden = [
    ["lib", "db"].join("\\/"),
    "better-sqlite3",
    "sqlite3",
    ["app", ""].join("\\/"),
    "openai",
    "provider",
    "retrieval",
    "rag",
    "source-fetch",
    "proof",
    "evidence",
    "work-item",
    "perspective-write",
    "canonical-write",
  ].join("|");
  return new RegExp(`from\\s+["'][^"']*(${forbidden})[^"']*["']`, "i");
}

function networkOrExternalCallPattern() {
  const probes = [
    ["fet", "ch"].join(""),
    ["new", "OpenAI"].join("\\s+"),
    "webhook",
    "sendEmail",
    "slack",
    "providerClient",
    "retrievalClient",
    "ragClient",
  ];
  const callProbes = probes.map((probe) =>
    probe.includes("\\s+") ? probe : `${probe}\\s*\\(`,
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
      ["npm", "run", "dev"].join("\\s+"),
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
    "i",
  );
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

function listFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  const files = [];
  for (const entry of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files.map((filePath) => filePath.replaceAll(path.sep, "/"));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function hasNonEmptyPayload(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== null && value !== undefined && value !== "";
}

function getPath(value, fieldPath) {
  let cursor = value;
  for (const field of fieldPath) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = cursor[field];
  }
  return cursor;
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
  return [...new Set(values.filter(Boolean))];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
