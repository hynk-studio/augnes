import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DESIGN_VERSION =
  "manual_note_single_claim_temp_to_product_bridge_design.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const DESIGN_PATH = path.join(ARTIFACT_DIR, "temp-to-product-bridge-design.json");
const PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";
const TEMP_DB_HARNESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-write-prototype-harness.sample.v0.1.json";
const TEMP_RESULT_REVIEW_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-review.sample.v0.1.json";
const TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-contract-test-cases.v0.1.json";
const OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json";
const OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-contract-tests-v0-1/report.json";
const OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-review-v0-1/report.json";
const OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH =
  "/tmp/augnes-single-claim-write-prototype-v0-1/report.json";
const OPTIONAL_BROWSER_REPORT_PATH =
  "/tmp/augnes-manual-note-lane-validation-v0-1/report.json";
const FIXTURE_MODE =
  process.env.AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_FIXTURE_MODE ===
  "1";
const TEMP_TABLES = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
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
  "audit_record_product_id",
];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const committedGateDesign = await readJson(PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH);
  const committedHarnessReport = await readJson(TEMP_DB_HARNESS_FIXTURE_PATH);
  const committedResultReview = await readJson(TEMP_RESULT_REVIEW_FIXTURE_PATH);
  const contractTestCases = await readJson(
    TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH,
  );
  const optionalGateDesignReport = FIXTURE_MODE
    ? null
    : await readOptionalJson(OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH);
  const optionalContractReport = FIXTURE_MODE
    ? null
    : await readOptionalJson(OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH);
  const optionalResultReviewReport = FIXTURE_MODE
    ? null
    : await readOptionalJson(OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH);
  const optionalHarnessReport = FIXTURE_MODE
    ? null
    : await readOptionalJson(OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH);
  const optionalBrowserReport = FIXTURE_MODE
    ? null
    : await readOptionalJson(OPTIONAL_BROWSER_REPORT_PATH);

  const design = buildDesign({
    productWriteGateDesign:
      asRecord(optionalGateDesignReport).product_write_gate_design ??
      committedGateDesign,
    tempDbWriteHarnessReport: optionalHarnessReport ?? committedHarnessReport,
    tempResultReview:
      asRecord(optionalResultReviewReport).result_review ?? committedResultReview,
    tempResultContractTestsReport: optionalContractReport,
    tempResultContractTestCases: contractTestCases,
    browserValidationReport: optionalBrowserReport,
  });
  const validation = validateDesign(design);
  const report = {
    report_kind: "manual_note_single_claim_temp_to_product_bridge_design_report",
    report_version: DESIGN_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      temp_to_product_bridge_design: DESIGN_PATH,
    },
    input_paths: {
      product_write_gate_design_fixture:
        PRODUCT_WRITE_GATE_DESIGN_FIXTURE_PATH,
      temp_db_harness_fixture: TEMP_DB_HARNESS_FIXTURE_PATH,
      temp_result_review_fixture: TEMP_RESULT_REVIEW_FIXTURE_PATH,
      temp_result_contract_test_cases_fixture:
        TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH,
      optional_product_write_gate_design_report:
        OPTIONAL_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH,
      optional_temp_result_contract_report:
        OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH,
      optional_temp_result_review_report: OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH,
      optional_temp_db_harness_report: OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH,
      optional_browser_report: OPTIONAL_BROWSER_REPORT_PATH,
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
      product_write_gate_design_report_present: Boolean(optionalGateDesignReport),
      product_write_gate_design_report_final_status:
        optionalGateDesignReport?.final_status ?? null,
      temp_result_contract_report_present: Boolean(optionalContractReport),
      temp_result_contract_report_final_status:
        optionalContractReport?.final_status ?? null,
      temp_result_review_report_present: Boolean(optionalResultReviewReport),
      temp_result_review_report_final_status:
        optionalResultReviewReport?.final_status ?? null,
      temp_db_harness_report_present: Boolean(optionalHarnessReport),
      temp_db_harness_report_final_status: optionalHarnessReport?.final_status ?? null,
      browser_report_present: Boolean(optionalBrowserReport),
      browser_report_final_status: optionalBrowserReport?.final_status ?? null,
    },
    temp_to_product_bridge_design: design,
    bridge_validation: validation,
    preserved_boundaries: design.explicit_forbidden_surfaces,
    final_status: validation.passed ? "pass" : "fail",
  };

  await writeFile(DESIGN_PATH, `${JSON.stringify(design, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        design:
          "research-candidate-single-claim-temp-to-product-bridge-design-v0-1",
        final_status: report.final_status,
        bridge_design_status: design.bridge_design_status,
        recommendation_status: design.recommendation_status,
        next_recommended_slice: design.next_recommended_slice,
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

function buildDesign({
  productWriteGateDesign,
  tempDbWriteHarnessReport,
  tempResultReview,
  tempResultContractTestsReport,
  tempResultContractTestCases,
  browserValidationReport,
}) {
  const gateDesign = asRecord(productWriteGateDesign);
  const gateSourceEvidence = asRecord(gateDesign.source_evidence);
  const gateContractEvidence = asRecord(gateSourceEvidence.temp_result_contract_tests);
  const gateRecommendation = asRecord(gateDesign.next_stage_recommendation);
  const harnessReport = asRecord(tempDbWriteHarnessReport);
  const harnessResult = asRecord(harnessReport.harness_result);
  const insertedRecords = asRecord(harnessResult.inserted_records);
  const tempClaimRecord = asRecord(insertedRecords.temp_claim_record);
  const tempIdempotencyRecord = asRecord(insertedRecords.temp_idempotency_record);
  const resultReview = readResultReview(tempResultReview);
  const insertedClaimSummary = asRecord(resultReview.inserted_claim_summary);
  const contractReport = asRecord(tempResultContractTestsReport);
  const contractCases = asRecord(tempResultContractTestCases);
  const browserReport = asRecord(browserValidationReport);
  const contractReportPresent = Object.keys(contractReport).length > 0;
  const browserReportPresent = Object.keys(browserReport).length > 0;
  const resultContractSuiteFingerprint =
    asString(contractReport.suite_fingerprint) ??
    asString(gateContractEvidence.suite_fingerprint) ??
    asString(gateContractEvidence.result_contract_suite_fingerprint) ??
    createFingerprint(contractCases);

  const bridgeInputContract = {
    selected_temp_claim_record_id:
      asString(tempClaimRecord.temp_claim_record_id) ??
      asString(insertedClaimSummary.temp_claim_record_id),
    source_operation_id:
      asString(tempClaimRecord.source_operation_id) ??
      asString(insertedClaimSummary.source_operation_id),
    source_temp_intent_id:
      asString(tempClaimRecord.source_temp_intent_id) ??
      asString(insertedClaimSummary.source_temp_intent_id),
    temp_idempotency_key: asString(tempIdempotencyRecord.temp_idempotency_key),
    result_contract_evidence_fingerprint: resultContractSuiteFingerprint,
    gate_design_fingerprint: asString(gateDesign.design_fingerprint),
    operator_decision_fingerprint_placeholder:
      "operator-decision-fingerprint:blocked-until-explicit-contract",
    operator_decision_status:
      "blocked_until_explicit_operator_decision_contract",
  };

  const designCore = {
    design_kind: "manual_note_single_claim_temp_to_product_bridge_design",
    design_version: DESIGN_VERSION,
    design_fingerprint: "",
    source_evidence: {
      product_write_gate_design: {
        design_fingerprint: asString(gateDesign.design_fingerprint),
        gate_design_status: asString(gateDesign.gate_design_status),
        recommendation_status: asString(gateRecommendation.recommendation_status),
        next_recommended_slice: asString(gateDesign.next_recommended_slice),
      },
      temp_db_write_harness: {
        result_fingerprint: asString(harnessResult.result_fingerprint),
        result_status: asString(harnessResult.result_status),
        selected_temp_claim_record_id:
          bridgeInputContract.selected_temp_claim_record_id,
        source_operation_id: bridgeInputContract.source_operation_id,
        source_temp_intent_id: bridgeInputContract.source_temp_intent_id,
        temp_idempotency_key: bridgeInputContract.temp_idempotency_key,
        temp_record_counts: readRowCounts(asRecord(harnessResult.verification).row_counts),
        product_db_write: false,
        product_ids_created: false,
      },
      temp_result_review: {
        review_fingerprint: asString(resultReview.review_fingerprint),
        review_status: asString(resultReview.review_status),
        next_recommended_slice: asString(resultReview.next_recommended_slice),
      },
      temp_result_contract_tests: {
        result_contract_evidence_fingerprint: resultContractSuiteFingerprint,
        result_contract_suite_fingerprint: resultContractSuiteFingerprint,
        final_status:
          asString(contractReport.final_status) ??
          asString(gateContractEvidence.final_status),
        total_cases:
          asNumber(contractReport.total_cases) ??
          asNumber(gateContractEvidence.total_cases) ??
          asArray(contractCases.test_cases).length,
        expected_failures:
          asNumber(contractReport.expected_failures) ??
          asNumber(gateContractEvidence.expected_failures) ??
          asArray(contractCases.test_cases).filter(
            (testCase) => asRecord(testCase).expected_status === "fail",
          ).length,
        report_present: contractReportPresent,
      },
      browser_validation: {
        report_present: browserReportPresent,
        final_status: asString(browserReport.final_status),
        external_request_count: asNumber(browserReport.external_request_count),
        forbidden_request_count: asNumber(browserReport.forbidden_request_count),
      },
      source_boundary_preserved: allSourceBoundariesPreserved({
        gateDesign,
        harnessResult,
        resultReview,
      }),
    },
    bridge_input_contract: bridgeInputContract,
    future_product_claim_draft: {
      candidate_kind: "manual_note_single_claim",
      source_temp_claim_record_id:
        bridgeInputContract.selected_temp_claim_record_id,
      source_operation_id: bridgeInputContract.source_operation_id,
      source_temp_intent_id: bridgeInputContract.source_temp_intent_id,
      product_claim_id: null,
      product_claim_id_allocation_status:
        "blocked_until_operator_and_schema_contract",
      raw_manual_note_text_included: false,
      proof_id: null,
      evidence_id: null,
      perspective_id: null,
      work_item_id: null,
    },
    future_product_idempotency_design: {
      key_inputs: {
        selected_temp_claim_record_id:
          bridgeInputContract.selected_temp_claim_record_id,
        source_operation_id: bridgeInputContract.source_operation_id,
        gate_design_fingerprint: bridgeInputContract.gate_design_fingerprint,
        result_contract_suite_fingerprint: resultContractSuiteFingerprint,
        operator_decision_fingerprint_placeholder:
          bridgeInputContract.operator_decision_fingerprint_placeholder,
      },
      storage_status: "blocked_until_product_idempotency_storage_contract",
      product_idempotency_record_id: null,
      idempotency_write_executed_now: false,
    },
    future_product_rollback_design: {
      strategy: "delete_or_mark_product_claim_by_idempotency_key",
      rollback_storage_status: "blocked_until_product_rollback_storage_contract",
      rollback_executed_now: false,
      product_rollback_record_id: null,
    },
    future_product_audit_design: {
      records_operator_decision: "required_later",
      records_gate_evidence: true,
      records_bridge_design_inputs: true,
      product_audit_record_id: null,
      audit_write_executed_now: false,
    },
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    bridge_design_status: "single_claim_bridge_design_only",
    bridge_execution_allowed_now: false,
    product_write_allowed_now: false,
    recommendation_status: "ready_for_disabled_bridge_skeleton",
    next_recommended_slice: "single_claim_temp_to_product_disabled_bridge_skeleton",
  };
  const fingerprint = createFingerprint(designCore);
  const design = {
    ...designCore,
    design_fingerprint: fingerprint,
  };
  return {
    ...design,
    local_copy_packet: {
      markdown: buildMarkdown(design),
      json: buildJson(design),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      product_write_authority_granted: false,
      bridge_execution_allowed_now: false,
      product_write_allowed_now: false,
    },
  };
}

function validateDesign(design) {
  const failures = [];
  if (design.bridge_design_status !== "single_claim_bridge_design_only") {
    failures.push("bridge_design_status_invalid");
  }
  if (design.bridge_execution_allowed_now !== false) {
    failures.push("bridge_execution_allowed_now");
  }
  if (design.product_write_allowed_now !== false) {
    failures.push("product_write_allowed_now");
  }
  if (design.recommendation_status !== "ready_for_disabled_bridge_skeleton") {
    failures.push("recommendation_status_invalid");
  }
  if (
    design.next_recommended_slice !==
    "single_claim_temp_to_product_disabled_bridge_skeleton"
  ) {
    failures.push("next_recommended_slice_invalid");
  }
  if (!allFalse(asRecord(design.explicit_forbidden_surfaces))) {
    failures.push("forbidden_surface_enabled");
  }
  if (!design.source_evidence?.source_boundary_preserved) {
    failures.push("source_boundary_not_preserved");
  }
  for (const requiredInput of [
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
    "result_contract_evidence_fingerprint",
    "gate_design_fingerprint",
  ]) {
    if (typeof design.bridge_input_contract?.[requiredInput] !== "string") {
      failures.push(`${requiredInput}_missing`);
    }
  }
  if (hasNonNullProductIds(design)) {
    failures.push("non_null_product_id_present");
  }
  if (design.future_product_claim_draft?.raw_manual_note_text_included !== false) {
    failures.push("raw_manual_note_text_included");
  }
  return {
    passed: failures.length === 0,
    failures,
  };
}

function buildMarkdown(design) {
  return [
    "# Manual Note Single-Claim Temp-to-Product Bridge Design",
    "",
    "Design-only bridge. No DB is opened, no SQL is executed, no product ID is allocated, and no product write authority is granted.",
    `bridge_design_status: ${design.bridge_design_status}`,
    `recommendation_status: ${design.recommendation_status}`,
    `selected_temp_claim_record_id: ${design.bridge_input_contract.selected_temp_claim_record_id}`,
    `gate_design_fingerprint: ${design.bridge_input_contract.gate_design_fingerprint}`,
    "",
    "## Future Draft",
    "candidate_kind=manual_note_single_claim",
    "product_claim_id=null",
    "product_claim_id_allocation_status=blocked_until_operator_and_schema_contract",
    "",
    "## Boundary",
    "bridge_execution_allowed_now=false",
    "product_write_allowed_now=false",
    "product_db_write=false",
    "product_id_allocation=false",
    "proof_evidence_write=false",
    "perspective_or_canonical_graph_write=false",
    "work_item_creation=false",
    "provider_or_openai_call=false",
    "retrieval_or_rag=false",
    "source_fetch=false",
    "external_handoff=false",
    "sql_execution=false",
    "db_open=false",
    "schema_or_migration_change=false",
    "route_added=false",
    "ui_write_action_added=false",
    "adapter_enabled=false",
    "",
    "## Next",
    design.next_recommended_slice,
  ].join("\n");
}

function buildJson(design) {
  return JSON.stringify(
    {
      design_kind: design.design_kind,
      design_version: design.design_version,
      design_fingerprint: design.design_fingerprint,
      bridge_input_contract: design.bridge_input_contract,
      future_product_claim_draft: design.future_product_claim_draft,
      future_product_idempotency_design:
        design.future_product_idempotency_design,
      future_product_rollback_design: design.future_product_rollback_design,
      future_product_audit_design: design.future_product_audit_design,
      explicit_forbidden_surfaces: design.explicit_forbidden_surfaces,
      bridge_design_status: design.bridge_design_status,
      bridge_execution_allowed_now: design.bridge_execution_allowed_now,
      product_write_allowed_now: design.product_write_allowed_now,
      recommendation_status: design.recommendation_status,
      next_recommended_slice: design.next_recommended_slice,
    },
    null,
    2,
  );
}

function explicitForbiddenSurfaces() {
  return {
    proof_evidence_write: false,
    perspective_or_canonical_graph_write: false,
    work_item_creation: false,
    source_fetch: false,
    provider_or_openai_call: false,
    retrieval_or_rag: false,
    external_handoff: false,
    product_db_write: false,
    product_id_allocation: false,
    sql_execution: false,
    db_open: false,
    schema_or_migration_change: false,
    route_added: false,
    ui_write_action_added: false,
    adapter_enabled: false,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath) {
  if (!existsSync(filePath)) return null;
  return readJson(filePath);
}

function readResultReview(value) {
  const record = asRecord(value);
  return Object.keys(asRecord(record.result_review)).length > 0
    ? asRecord(record.result_review)
    : record;
}

function readRowCounts(value) {
  const record = asRecord(value);
  return {
    temp_claim_records: asNumber(record.temp_claim_records) ?? 0,
    temp_idempotency_records: asNumber(record.temp_idempotency_records) ?? 0,
    temp_rollback_records: asNumber(record.temp_rollback_records) ?? 0,
    temp_review_audit_records: asNumber(record.temp_review_audit_records) ?? 0,
  };
}

function allSourceBoundariesPreserved({ gateDesign, harnessResult, resultReview }) {
  return (
    boundaryFalseExcept(asRecord(gateDesign.product_write_boundary), new Set(["gate_design_only"])) &&
    boundaryFalseExcept(asRecord(harnessResult.product_write_boundary), new Set(["temp_db_execution_only"])) &&
    boundaryFalseExcept(asRecord(resultReview.product_write_boundary), new Set(["result_review_only"])) &&
    !hasNonNullProductIds(gateDesign) &&
    !hasNonNullProductIds(harnessResult) &&
    !hasNonNullProductIds(resultReview)
  );
}

function boundaryFalseExcept(boundary, allowedTrueKeys) {
  if (Object.keys(boundary).length === 0) return false;
  return Object.entries(boundary).every(([key, value]) =>
    allowedTrueKeys.has(key) ? value === true : value === false,
  );
}

function allFalse(record) {
  return Object.keys(record).length > 0
    ? Object.values(record).every((value) => value === false)
    : false;
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) return nestedValue !== null;
    return hasNonNullProductIds(nestedValue);
  });
}

function createFingerprint(input) {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function stripGeneratedFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
        .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
    );
  }
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
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

await main();
