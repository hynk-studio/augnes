import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const STOPLINE_VERSION =
  "manual_note_single_claim_product_write_preflight_stopline.v0.1";
const CONTRACT_TEST_VERSION =
  "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-product-write-preflight-stopline-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const STOPLINE_PATH = path.join(ARTIFACT_DIR, "stopline.json");
const HELPER_INPUT_PATH = path.join(ARTIFACT_DIR, "helper-input.json");
const CONTRACT_HELPER_INPUT_PATH = path.join(
  ARTIFACT_DIR,
  "contract-helper-input.json",
);
const CONTRACT_HELPER_OUTPUT_PATH = path.join(
  ARTIFACT_DIR,
  "contract-tests.json",
);

const PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope.sample.v0.1.json";
const CONTRACT_TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope-contract-test-cases.v0.1.json";
const STOPLINE_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-stopline.sample.v0.1.json";

const OPTIONAL_CONTRACT_TESTS_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1/report.json";
const OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-v0-1/report.json";

const OPTIONAL_UPSTREAM_REPORT_SPECS = [
  [
    "disabled_adapter_noop_invocation_report",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1/report.json",
    "noop_invocation_report",
  ],
  [
    "disabled_adapter_dry_run_invocation_harness",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1/report.json",
    "dry_run_invocation_harness",
  ],
  [
    "disabled_adapter_contract_tests",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
    null,
  ],
  [
    "disabled_adapter_skeleton",
    "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json",
    "disabled_adapter_skeleton",
  ],
  [
    "authority_contract_bundle",
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
    "authority_contract_bundle",
  ],
  [
    "product_write_gate_design",
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
    "product_write_gate_design",
  ],
];

const HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-product-write-preflight-stopline.ts";
const CONTRACT_HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-product-write-preflight-command-envelope-contract-tests.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const TSX_PATH = "apps/augnes_apps/node_modules/.bin/tsx";

const FIXTURE_MODE =
  process.env.AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_FIXTURE_MODE ===
  "1";

const READY_STOPLINE_STATUS = "product_write_preflight_stopline_reached";
const BLOCKED_STOPLINE_STATUS = "blocked_before_product_write_preflight_stopline";
const READY_RECOMMENDATION = "ready_for_perspective_geometry_digest";
const BLOCKED_RECOMMENDATION = "blocked_before_perspective_geometry_digest";
const NEXT_PRIMARY_SLICE = "perspective_geometry_digest_builder_v0_1";
const NEXT_SECONDARY_SLICE =
  "agent_perspective_substrate_docs_type_fixture_v0_1";
const RECHECK_SLICE = "single_claim_product_write_preflight_stopline_recheck";
const CONTRACT_SUITE_STATUS =
  "product_write_preflight_command_envelope_contract_tests_passed";
const PREFLIGHT_STATUS = "product_write_preflight_command_envelope_only";

const EXPECTED_CHANGED_FILES = [
  "docs/00_INDEX_LATEST.md",
  STOPLINE_FIXTURE_PATH,
  HELPER_PATH,
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  RUNNER_PATH,
  SMOKE_PATH,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
];
const ALLOWED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
  "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
];
const FALLBACK_PACKAGE_ADDED_LINES = [
  '+    "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",',
  '+    "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1": "node scripts/run-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",',
];
const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const committedPreflightEnvelope = await readJson(
    PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH,
  );
  const contractTestCases = await readJson(CONTRACT_TEST_CASES_FIXTURE_PATH);
  const contractStaticBoundary = buildContractTestsFixtureStaticBoundary();
  const committedContractTests = await invokeContractTestsHelper({
    preflightCommandEnvelope: committedPreflightEnvelope,
    staticBoundaryEvidence: contractStaticBoundary,
    contractTestCases,
  });

  const selectedContractTests = await selectContractTests(committedContractTests);
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
    ...selectedContractTests.failureCodes,
    ...selectedPreflight.failureCodes,
    ...optionalUpstreamReports.flatMap((entry) => entry.failureCodes),
    ...staticBoundaryResult.failureCodes,
  ]);
  const selectedSourceReports = [
    selectedContractTests.selection,
    selectedPreflight.selection,
    ...optionalUpstreamReports.map((entry) => entry.selection),
  ];
  const fingerprintedSourceReports = FIXTURE_MODE
    ? selectedSourceReports.map(normalizeFixtureModeSourceReportSelection)
    : selectedSourceReports;

  const stopline = await invokeStoplineHelper({
    preflightCommandEnvelopeContractTests: selectedContractTests.value,
    preflightCommandEnvelope: selectedPreflight.value,
    sourceReports: fingerprintedSourceReports,
    staticBoundaryEvidence,
    sourceValidationFailureCodes,
  });
  const validation = asRecord(stopline.validation);
  const finalStatus =
    validation.passed === true && stopline.stopline_status === READY_STOPLINE_STATUS
      ? "pass"
      : "fail";
  const report = {
    report_kind: "manual_note_single_claim_product_write_preflight_stopline_report",
    report_version: STOPLINE_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      stopline: STOPLINE_PATH,
    },
    input_paths: {
      preflight_command_envelope_fixture: PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_PATH,
      contract_test_cases_fixture: CONTRACT_TEST_CASES_FIXTURE_PATH,
      stopline_fixture: STOPLINE_FIXTURE_PATH,
      optional_contract_tests_report: OPTIONAL_CONTRACT_TESTS_REPORT_PATH,
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
      contract_tests: selectedContractTests.selection,
      preflight_command_envelope: selectedPreflight.selection,
      upstream_reports: optionalUpstreamReports.map((entry) => entry.selection),
    },
    non_fingerprinted_runtime_notes: {
      fixture_mode: FIXTURE_MODE,
      fixture_mode_live_static_boundary_result: FIXTURE_MODE
        ? summarizeStaticBoundaryResult(liveStaticBoundaryResult)
        : null,
      optional_contract_tests_report_present_on_disk: existsSync(
        OPTIONAL_CONTRACT_TESTS_REPORT_PATH,
      ),
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
    stopline,
    source_evidence: stopline.source_evidence,
    product_write_preflight_chain_summary:
      stopline.product_write_preflight_chain_summary,
    blocked_surfaces_summary: stopline.blocked_surfaces_summary,
    no_write_stopline_closeout: stopline.no_write_stopline_closeout,
    roadmap_return_packet: stopline.roadmap_return_packet,
    stopline_status:
      finalStatus === "pass" ? READY_STOPLINE_STATUS : BLOCKED_STOPLINE_STATUS,
    recommendation_status:
      finalStatus === "pass" ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: finalStatus === "pass" ? NEXT_PRIMARY_SLICE : RECHECK_SLICE,
    secondary_next_recommended_slice:
      finalStatus === "pass" ? NEXT_SECONDARY_SLICE : null,
    final_status: finalStatus,
    stopline_fingerprint: stopline.stopline_fingerprint,
    validation_matrix_count: asArray(stopline.stopline_validation_matrix).length,
    static_boundary_result: staticBoundaryResult,
    static_boundary_evidence: stopline.static_boundary_evidence,
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
        ...asArray(validation.failure_codes).map(asString),
        ...(finalStatus === "pass" ? [] : ["stopline_not_ready"]),
      ]),
    },
  };

  await writeFile(STOPLINE_PATH, `${JSON.stringify(stopline, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        stopline: "research-candidate-single-claim-product-write-preflight-stopline-v0-1",
        final_status: report.final_status,
        stopline_status: report.stopline_status,
        recommendation_status: report.recommendation_status,
        next_recommended_slice: report.next_recommended_slice,
        secondary_next_recommended_slice: report.secondary_next_recommended_slice,
        validation_matrix_count: report.validation_matrix_count,
        static_boundary_base_mode: report.static_boundary_base_mode,
        static_boundary_changed_files_inspected:
          report.static_boundary_changed_files_inspected.length,
        artifact_paths: report.artifact_paths,
      },
      null,
      2,
    ),
  );

  if (finalStatus !== "pass") process.exitCode = 1;
}

function normalizeFixtureModeSourceReportSelection(selection) {
  const record = asRecord(selection);
  if (record.source_used !== "ignored_in_fixture_mode") return record;
  return {
    ...record,
    source_status: "optional_absent",
  };
}

async function selectContractTests(committedContractTests) {
  const selectionBase = {
    source_label: "preflight_command_envelope_contract_tests",
    source_path: OPTIONAL_CONTRACT_TESTS_REPORT_PATH,
    compared_fields: [
      "suite_fingerprint",
      "contract_suite_status",
      "recommendation_status",
      "next_recommended_slice",
      "validation.passed",
    ],
  };
  if (FIXTURE_MODE) {
    return {
      value: committedContractTests,
      report: null,
      failureCodes: [],
      selection: {
        ...selectionBase,
        source_used: "committed_fixture_generated_contract_suite",
        source_status: "fixture_mode_committed_fallback",
        fallback_to_committed_fixture: true,
        traceability_checked: false,
        traceability_status: "not_checked_fixture_mode",
        traceability_failure_code: null,
      },
    };
  }
  const optionalReport = await readOptionalJson(OPTIONAL_CONTRACT_TESTS_REPORT_PATH);
  if (!optionalReport.present) {
    return {
      value: committedContractTests,
      report: null,
      failureCodes: [],
      selection: {
        ...selectionBase,
        source_used: "committed_fixture_generated_contract_suite",
        source_status: "optional_absent",
        fallback_to_committed_fixture: true,
        traceability_checked: false,
        traceability_status: "not_checked_absent",
        traceability_failure_code: null,
      },
    };
  }
  if (!optionalReport.parsed) {
    return failedOptionalSelection({
      value: committedContractTests,
      report: null,
      selectionBase,
      sourceStatus: "optional_malformed",
      failureCode: "optional_contract_tests_report_malformed",
    });
  }
  const report = asRecord(optionalReport.value);
  if (report.final_status !== "pass") {
    return failedOptionalSelection({
      value: report.contract_suite ?? committedContractTests,
      report,
      selectionBase,
      sourceStatus: "optional_not_passed",
      failureCode: "optional_contract_tests_report_not_passed",
    });
  }
  const payload = asRecord(report.contract_suite);
  if (Object.keys(payload).length === 0) {
    return failedOptionalSelection({
      value: committedContractTests,
      report,
      selectionBase,
      sourceStatus: "optional_pass_missing_payload",
      failureCode: "optional_contract_tests_report_missing_payload",
    });
  }
  const matched =
    payload.suite_fingerprint === committedContractTests.suite_fingerprint &&
    payload.contract_suite_status === committedContractTests.contract_suite_status &&
    payload.recommendation_status === committedContractTests.recommendation_status &&
    payload.next_recommended_slice === committedContractTests.next_recommended_slice &&
    asRecord(payload.validation).passed === asRecord(committedContractTests.validation).passed;
  if (!matched) {
    return failedOptionalSelection({
      value: payload,
      report,
      selectionBase,
      sourceStatus: "optional_pass_traceability_mismatch",
      failureCode: "optional_contract_tests_traceability_mismatch",
      traceabilityChecked: true,
    });
  }
  return {
    value: payload,
    report,
    failureCodes: [],
    selection: {
      ...selectionBase,
      source_used: "optional_live_report",
      source_status: "optional_pass_payload_matched",
      fallback_to_committed_fixture: false,
      traceability_checked: true,
      traceability_status: "matched",
      traceability_failure_code: null,
      fingerprint: asString(payload.suite_fingerprint),
    },
  };
}

async function selectPreflightCommandEnvelope(committedPreflightEnvelope) {
  const selectionBase = {
    source_label: "preflight_command_envelope",
    source_path: OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH,
    compared_fields: [
      "preflight_command_envelope_fingerprint",
      "preflight_command_envelope_status",
      "recommendation_status",
      "next_recommended_slice",
      "validation.passed",
    ],
  };
  if (FIXTURE_MODE) {
    return {
      value: committedPreflightEnvelope,
      report: null,
      failureCodes: [],
      selection: {
        ...selectionBase,
        source_used: "committed_fixture",
        source_status: "fixture_mode_committed_fallback",
        fallback_to_committed_fixture: true,
        traceability_checked: false,
        traceability_status: "not_checked_fixture_mode",
        traceability_failure_code: null,
      },
    };
  }
  const optionalReport = await readOptionalJson(
    OPTIONAL_PREFLIGHT_COMMAND_ENVELOPE_REPORT_PATH,
  );
  if (!optionalReport.present) {
    return {
      value: committedPreflightEnvelope,
      report: null,
      failureCodes: [],
      selection: {
        ...selectionBase,
        source_used: "committed_fixture",
        source_status: "optional_absent",
        fallback_to_committed_fixture: true,
        traceability_checked: false,
        traceability_status: "not_checked_absent",
        traceability_failure_code: null,
      },
    };
  }
  if (!optionalReport.parsed) {
    return failedOptionalSelection({
      value: committedPreflightEnvelope,
      report: null,
      selectionBase,
      sourceStatus: "optional_malformed",
      failureCode: "optional_preflight_command_envelope_report_malformed",
    });
  }
  const report = asRecord(optionalReport.value);
  if (report.final_status !== "pass") {
    return failedOptionalSelection({
      value: report.preflight_command_envelope ?? committedPreflightEnvelope,
      report,
      selectionBase,
      sourceStatus: "optional_not_passed",
      failureCode: "optional_preflight_command_envelope_report_not_passed",
    });
  }
  const payload = asRecord(report.preflight_command_envelope);
  if (Object.keys(payload).length === 0) {
    return failedOptionalSelection({
      value: committedPreflightEnvelope,
      report,
      selectionBase,
      sourceStatus: "optional_pass_missing_payload",
      failureCode: "optional_preflight_command_envelope_report_missing_payload",
    });
  }
  const matched =
    payload.preflight_command_envelope_fingerprint ===
      committedPreflightEnvelope.preflight_command_envelope_fingerprint &&
    payload.preflight_command_envelope_status ===
      committedPreflightEnvelope.preflight_command_envelope_status &&
    payload.recommendation_status === committedPreflightEnvelope.recommendation_status &&
    payload.next_recommended_slice === committedPreflightEnvelope.next_recommended_slice &&
    asRecord(payload.validation).passed ===
      asRecord(committedPreflightEnvelope.validation).passed;
  if (!matched) {
    return failedOptionalSelection({
      value: payload,
      report,
      selectionBase,
      sourceStatus: "optional_pass_traceability_mismatch",
      failureCode: "optional_preflight_command_envelope_traceability_mismatch",
      traceabilityChecked: true,
    });
  }
  return {
    value: payload,
    report,
    failureCodes: [],
    selection: {
      ...selectionBase,
      source_used: "optional_live_report",
      source_status: "optional_pass_payload_matched",
      fallback_to_committed_fixture: false,
      traceability_checked: true,
      traceability_status: "matched",
      traceability_failure_code: null,
      fingerprint: asString(payload.preflight_command_envelope_fingerprint),
    },
  };
}

async function inspectOptionalUpstreamReports(selectedPreflightEnvelope) {
  const sourceEvidence = asRecord(selectedPreflightEnvelope.source_evidence);
  const results = [];
  for (const [label, filePath, payloadKey] of OPTIONAL_UPSTREAM_REPORT_SPECS) {
    const selectionBase = {
      source_label: label,
      source_path: filePath,
      compared_fields: optionalTraceabilityFields(label).map((fieldPath) =>
        fieldPath.join("."),
      ),
    };
    if (FIXTURE_MODE) {
      results.push({
        failureCodes: [],
        selection: {
          ...selectionBase,
          source_used: "ignored_in_fixture_mode",
          source_status: existsSync(filePath)
            ? "optional_present_ignored_fixture_mode"
            : "optional_absent",
          fallback_to_committed_fixture: true,
          traceability_checked: false,
          traceability_status: "not_checked_fixture_mode",
          traceability_failure_code: null,
        },
      });
      continue;
    }
    const optionalReport = await readOptionalJson(filePath);
    if (!optionalReport.present) {
      results.push({
        failureCodes: [],
        selection: {
          ...selectionBase,
          source_used: "committed_source_evidence",
          source_status: "optional_absent",
          fallback_to_committed_fixture: true,
          traceability_checked: false,
          traceability_status: "not_checked_absent",
          traceability_failure_code: null,
        },
      });
      continue;
    }
    if (!optionalReport.parsed) {
      results.push({
        failureCodes: [`optional_${label}_report_malformed`],
        selection: {
          ...selectionBase,
          source_used: "optional_live_report_malformed",
          source_status: "optional_malformed",
          fallback_to_committed_fixture: false,
          traceability_checked: false,
          traceability_status: "not_checked_failed_or_missing_payload",
          traceability_failure_code: `optional_${label}_report_malformed`,
        },
      });
      continue;
    }
    const report = asRecord(optionalReport.value);
    if (report.final_status !== "pass") {
      results.push({
        failureCodes: [`optional_${label}_report_not_passed`],
        selection: {
          ...selectionBase,
          source_used: "optional_live_report_failed",
          source_status: "optional_not_passed",
          fallback_to_committed_fixture: false,
          traceability_checked: false,
          traceability_status: "not_checked_failed_or_missing_payload",
          traceability_failure_code: `optional_${label}_report_not_passed`,
        },
      });
      continue;
    }
    const payload = payloadKey ? asRecord(report[payloadKey]) : report;
    if (Object.keys(payload).length === 0) {
      results.push({
        failureCodes: [`optional_${label}_report_missing_payload`],
        selection: {
          ...selectionBase,
          source_used: "optional_live_report_missing_payload",
          source_status: "optional_pass_missing_payload",
          fallback_to_committed_fixture: false,
          traceability_checked: false,
          traceability_status: "not_checked_failed_or_missing_payload",
          traceability_failure_code: `optional_${label}_report_missing_payload`,
        },
      });
      continue;
    }
    const sourceKey =
      label === "disabled_adapter_noop_invocation_report"
        ? "noop_invocation_report"
        : label;
    const sourceSummary = asRecord(sourceEvidence[sourceKey]);
    const traceability = compareOptionalPayload({
      label,
      payload,
      sourceSummary,
    });
    results.push({
      failureCodes: traceability.matched ? [] : [traceability.failureCode],
      selection: {
        ...selectionBase,
        source_used: "optional_live_report",
        source_status: traceability.matched
          ? "optional_pass_payload_matched"
          : "optional_pass_traceability_mismatch",
        fallback_to_committed_fixture: false,
        traceability_checked: true,
        traceability_status: traceability.matched ? "matched" : "mismatched",
        traceability_failure_code: traceability.matched
          ? null
          : traceability.failureCode,
        fingerprint: traceability.fingerprint,
      },
    });
  }
  return results;
}

function failedOptionalSelection({
  value,
  report,
  selectionBase,
  sourceStatus,
  failureCode,
  traceabilityChecked = false,
}) {
  return {
    value,
    report,
    failureCodes: [failureCode],
    selection: {
      ...selectionBase,
      source_used: "optional_live_report",
      source_status: sourceStatus,
      fallback_to_committed_fixture: false,
      traceability_checked: traceabilityChecked,
      traceability_status: traceabilityChecked
        ? "mismatched"
        : "not_checked_failed_or_missing_payload",
      traceability_failure_code: failureCode,
    },
  };
}

function compareOptionalPayload({ label, payload, sourceSummary }) {
  let matched = true;
  const fields = optionalTraceabilityFields(label);
  for (const fieldPath of fields) {
    const payloadValue = getPath(payload, fieldPath);
    const sourceValue = getPath(sourceSummary, fieldPath);
    if (payloadValue === undefined || sourceValue === undefined || payloadValue !== sourceValue) {
      matched = false;
    }
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
    if (implementationAllowed !== undefined && implementationAllowed !== 0) {
      matched = false;
    }
  }
  return {
    matched,
    failureCode: `optional_${label}_traceability_mismatch`,
    fingerprint: firstString(payload, [
      "noop_invocation_report_fingerprint",
      "dry_run_invocation_harness_fingerprint",
      "suite_fingerprint",
      "disabled_adapter_skeleton_fingerprint",
      "authority_contract_bundle_fingerprint",
      "design_fingerprint",
    ]),
  };
}

function optionalTraceabilityFields(label) {
  if (label === "disabled_adapter_noop_invocation_report") {
    return [
      ["noop_invocation_report_fingerprint"],
      ["final_status"],
      ["noop_invocation_report_status"],
      ["recommendation_status"],
      ["next_recommended_slice"],
    ];
  }
  if (label === "disabled_adapter_dry_run_invocation_harness") {
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

async function invokeContractTestsHelper(input) {
  await writeFile(CONTRACT_HELPER_INPUT_PATH, `${JSON.stringify(input, null, 2)}\n`);
  const script = `
    import { readFileSync, writeFileSync } from "node:fs";
    import { buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests } from "./${CONTRACT_HELPER_PATH}";
    const input = JSON.parse(readFileSync("${CONTRACT_HELPER_INPUT_PATH}", "utf8"));
    const suite = buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests(input);
    writeFileSync("${CONTRACT_HELPER_OUTPUT_PATH}", JSON.stringify(suite, null, 2) + "\\n");
  `;
  execFileSync(TSX_PATH, ["--eval", script], { stdio: "pipe" });
  return JSON.parse(await readFile(CONTRACT_HELPER_OUTPUT_PATH, "utf8"));
}

async function invokeStoplineHelper(input) {
  await writeFile(HELPER_INPUT_PATH, `${JSON.stringify(input, null, 2)}\n`);
  const script = `
    import { readFileSync, writeFileSync } from "node:fs";
    import { buildManualNoteSingleClaimProductWritePreflightStopline } from "./${HELPER_PATH}";
    const input = JSON.parse(readFileSync("${HELPER_INPUT_PATH}", "utf8"));
    const stopline = buildManualNoteSingleClaimProductWritePreflightStopline(input);
    writeFileSync("${STOPLINE_PATH}", JSON.stringify(stopline, null, 2) + "\\n");
  `;
  execFileSync(TSX_PATH, ["--eval", script], { stdio: "pipe" });
  return JSON.parse(await readFile(STOPLINE_PATH, "utf8"));
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
    /single-claim-product-write-preflight-stopline|product-write-preflight-stopline/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) failures.push("static_app_api_route_added");
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-product-write-preflight-stopline|product-write-preflight-stopline/i.test(
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
  const expectedFiles = asArray(evidence.expected_changed_files).map(asString);
  const allowedScripts = asArray(evidence.allowed_package_script_names).map(asString);
  if (changedFiles.length === 0) failures.push("static_boundary_changed_file_delta_empty");
  if (expectedFiles.some((filePath) => !changedFiles.includes(filePath))) {
    failures.push("static_boundary_expected_files_missing");
  }
  if (packageLines.length === 0) failures.push("static_boundary_package_added_lines_empty");
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
  if (changedFiles.some(isSchemaDbSqlPath)) failures.push("static_boundary_schema_db_sql_changed");
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) {
    failures.push("static_boundary_app_api_route_changed");
  }
  if (changedFiles.some(isUiFilePath)) failures.push("static_boundary_ui_changed");
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

function buildContractTestsFixtureStaticBoundary() {
  return {
    static_boundary_base_ref: "committed_allowlist",
    static_boundary_base_mode:
      "fixture_mode_committed_static_boundary_allowlist_for_stopline_source_contract_tests",
    static_boundary_base_commit: null,
    static_boundary_compare_ref: "HEAD",
    static_boundary_changed_files_inspected: [
      "docs/00_INDEX_LATEST.md",
      CONTRACT_TEST_CASES_FIXTURE_PATH,
      CONTRACT_HELPER_PATH,
      "package.json",
      "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
      "scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
    ],
    static_boundary_package_added_lines_inspected: [
      '+    "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",',
      '+    "contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1": "node scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",',
    ],
    static_boundary_used_fallback_allowlist: true,
    expected_changed_files: [
      "docs/00_INDEX_LATEST.md",
      CONTRACT_TEST_CASES_FIXTURE_PATH,
      CONTRACT_HELPER_PATH,
      "package.json",
      "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
      "scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
      "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
    ],
    allowed_package_script_names: [
      "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
      "contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
    ],
    static_boundary_probe_text: "",
  };
}

function summarizeStaticBoundaryResult(result) {
  return {
    note:
      "Live static boundary metadata observed during fixture mode is not included in the stopline artifact or fingerprint.",
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
  const envBaseRef = process.env.AUGNES_PRODUCT_WRITE_PREFLIGHT_STOPLINE_BASE_REF?.trim();
  if (envBaseRef) {
    const envDelta = resolveDeltaFromBaseRef(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_PREFLIGHT_STOPLINE_BASE_REF",
    );
    return envDelta ?? emptyDelta(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_PREFLIGHT_STOPLINE_BASE_REF",
    );
  }
  const baseCandidates = [
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    "origin/main",
    "main",
    "HEAD^",
  ].filter(Boolean);
  for (const candidate of baseCandidates) {
    const delta = resolveDeltaFromBaseRef(candidate, `merge_base:${candidate}`);
    if (!delta) continue;
    const expectedFilesPresent = EXPECTED_CHANGED_FILES.every((filePath) =>
      delta.changedFiles.includes(filePath),
    );
    if (expectedFilesPresent) return delta;
    if (delta.changedFiles.length > 0) return delta;
  }
  return allowlistFallback(null, "committed_allowlist_fallback_no_base_metadata");
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

function listFiles(root) {
  if (!existsSync(root)) return [];
  const output = [];
  for (const entry of readdirSync(root)) {
    const entryPath = path.join(root, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      output.push(...listFiles(entryPath));
    } else {
      output.push(entryPath);
    }
  }
  return output.map((filePath) => filePath.replaceAll(path.sep, "/"));
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath) {
  if (!existsSync(filePath)) return { present: false, parsed: false, value: null };
  try {
    return { present: true, parsed: true, value: await readJson(filePath) };
  } catch {
    return { present: true, parsed: false, value: null };
  }
}

function getPath(value, pathSegments) {
  let cursor = value;
  for (const segment of pathSegments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

function firstString(record, keys) {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return "";
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
