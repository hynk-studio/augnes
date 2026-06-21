import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DESIGN_VERSION = "manual_note_single_claim_product_write_gate_design.v0.1";
const ARTIFACT_DIR = "/tmp/augnes-single-claim-product-write-gate-design-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const DESIGN_PATH = path.join(ARTIFACT_DIR, "product-write-gate-design.json");
const PRODUCT_WRITE_DESIGN_REVIEW_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-product-write-design-review.sample.v0.1.json";
const TEMP_DB_HARNESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-write-prototype-harness.sample.v0.1.json";
const TEMP_RESULT_REVIEW_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-review.sample.v0.1.json";
const TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-contract-test-cases.v0.1.json";
const OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-contract-tests-v0-1/report.json";
const OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-review-v0-1/report.json";
const OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH =
  "/tmp/augnes-single-claim-write-prototype-v0-1/report.json";
const OPTIONAL_BROWSER_REPORT_PATH =
  "/tmp/augnes-manual-note-lane-validation-v0-1/report.json";
const FIXTURE_MODE =
  process.env.AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_FIXTURE_MODE === "1";
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
  "audit_record_product_id",
];
const REQUIRED_GATE_GROUPS = [
  "temp_evidence_gates",
  "operator_authority_gates",
  "source_evidence_authority_gates",
  "product_schema_gates",
  "product_id_allocation_gates",
  "idempotency_gates",
  "rollback_gates",
  "review_audit_gates",
  "adapter_enablement_gates",
  "route_and_execution_gates",
  "product_boundary_gates",
];
const REQUIRED_FUTURE_CONTRACTS = [
  "explicit_operator_single_claim_promotion_decision_contract",
  "selected_claim_candidate_identity_contract",
  "product_claim_schema_contract",
  "product_claim_id_allocation_contract",
  "product_idempotency_storage_contract",
  "product_rollback_storage_contract",
  "product_review_audit_record_contract",
  "source_verification_authority_contract",
  "proof_evidence_authority_contract",
  "canonical_perspective_authority_contract",
  "disabled_to_enabled_adapter_transition_contract",
  "product_write_route_contract",
  "product_write_observability_contract",
];
const BLOCKED_PRODUCT_WRITE_REASONS = [
  "source_verification_authority_missing",
  "proof_evidence_write_authority_missing",
  "canonical_perspective_write_authority_missing",
  "product_schema_review_missing",
  "product_claim_id_allocation_contract_missing",
  "product_idempotency_storage_missing",
  "product_rollback_contract_missing",
  "product_audit_record_contract_missing",
  "explicit_operator_promotion_decision_missing",
  "enabled_adapter_review_missing",
  "product_write_route_missing",
];
const AUTHORITY_BLOCK_GATE_IDS = new Set([
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

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const productWriteDesignReview = await readJson(
    PRODUCT_WRITE_DESIGN_REVIEW_FIXTURE_PATH,
  );
  const committedHarnessReport = await readJson(TEMP_DB_HARNESS_FIXTURE_PATH);
  const committedResultReview = await readJson(TEMP_RESULT_REVIEW_FIXTURE_PATH);
  const contractTestCases = await readJson(
    TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH,
  );
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
    productWriteDesignReview,
    tempDbWriteHarnessReport: optionalHarnessReport ?? committedHarnessReport,
    tempResultReview:
      asRecord(optionalResultReviewReport).result_review ?? committedResultReview,
    tempResultContractTestsReport: optionalContractReport,
    tempResultContractTestCases: contractTestCases,
    browserValidationReport: optionalBrowserReport,
  });
  const validation = validateDesign(design);
  const report = {
    report_kind: "manual_note_single_claim_product_write_gate_design_report",
    report_version: DESIGN_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      product_write_gate_design: DESIGN_PATH,
    },
    input_paths: {
      product_write_design_review_fixture:
        PRODUCT_WRITE_DESIGN_REVIEW_FIXTURE_PATH,
      temp_db_harness_fixture: TEMP_DB_HARNESS_FIXTURE_PATH,
      temp_result_review_fixture: TEMP_RESULT_REVIEW_FIXTURE_PATH,
      temp_result_contract_test_cases_fixture:
        TEMP_RESULT_CONTRACT_TEST_CASES_FIXTURE_PATH,
      optional_temp_result_contract_report:
        OPTIONAL_TEMP_RESULT_CONTRACT_REPORT_PATH,
      optional_temp_result_review_report: OPTIONAL_TEMP_RESULT_REVIEW_REPORT_PATH,
      optional_temp_db_harness_report: OPTIONAL_TEMP_DB_HARNESS_REPORT_PATH,
      optional_browser_report: OPTIONAL_BROWSER_REPORT_PATH,
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
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
    product_write_gate_design: design,
    gate_validation: validation,
    preserved_boundaries: design.product_write_boundary,
    final_status: validation.passed ? "pass" : "fail",
  };

  await writeFile(DESIGN_PATH, `${JSON.stringify(design, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        design: "research-candidate-single-claim-product-write-gate-design-v0-1",
        final_status: report.final_status,
        recommendation_status:
          design.next_stage_recommendation.recommendation_status,
        gate_summary: design.gate_summary,
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
  productWriteDesignReview,
  tempDbWriteHarnessReport,
  tempResultReview,
  tempResultContractTestsReport,
  tempResultContractTestCases,
  browserValidationReport,
}) {
  const productReview = asRecord(productWriteDesignReview);
  const harnessReport = asRecord(tempDbWriteHarnessReport);
  const harnessResult = asRecord(harnessReport.harness_result);
  const resultReview = readResultReview(tempResultReview);
  const contractReport = asRecord(tempResultContractTestsReport);
  const contractCases = asRecord(tempResultContractTestCases);
  const browserReport = asRecord(browserValidationReport);
  const rowCounts = readRowCounts(asRecord(harnessResult.verification).row_counts);
  const insertedClaim = asRecord(resultReview.inserted_claim_summary);
  const contractReportPresent = Object.keys(contractReport).length > 0;
  const browserReportPresent = Object.keys(browserReport).length > 0;
  const contractUnexpectedPasses = countMaybeArray(contractReport.unexpected_passes);
  const contractUnexpectedFailures = countMaybeArray(
    contractReport.unexpected_failures,
  );
  const contractTotalCases =
    asNumber(contractReport.total_cases) ?? asArray(contractCases.test_cases).length;
  const contractExpectedFailures =
    asNumber(contractReport.expected_failures) ??
    asArray(contractCases.test_cases).filter(
      (testCase) => asRecord(testCase).expected_status === "fail",
    ).length;
  const productBoundaryPreserved = allSourceBoundariesPreserved({
    productReview,
    harnessResult,
    resultReview,
  });
  const productWriteGateResults = buildGateResults({
    productReview,
    harnessResult,
    resultReview,
    rowCounts,
    insertedClaim,
    contractReport,
    contractReportPresent,
    contractUnexpectedPasses,
    contractUnexpectedFailures,
    browserReport,
    browserReportPresent,
    productBoundaryPreserved,
  });
  const gateSummary = summarizeGates(productWriteGateResults);
  const recommendationStatus = canRecommendBridgeDesign(productWriteGateResults)
    ? "ready_for_single_claim_bridge_design"
    : "blocked_before_bridge_design";
  const designCore = {
    design_kind: "manual_note_single_claim_product_write_gate_design",
    design_version: DESIGN_VERSION,
    design_fingerprint: "",
    source_evidence: {
      product_write_design_review: {
        review_fingerprint: asString(productReview.review_fingerprint),
        design_status: asString(productReview.design_status),
        next_recommended_slice: asString(productReview.next_recommended_slice),
      },
      temp_db_write_harness: {
        result_fingerprint: asString(harnessResult.result_fingerprint),
        result_status: asString(harnessResult.result_status),
        temp_record_counts: rowCounts,
        product_db_write: false,
        product_ids_created: false,
      },
      temp_result_review: {
        review_fingerprint: asString(resultReview.review_fingerprint),
        review_status: asString(resultReview.review_status),
        next_recommended_slice: asString(resultReview.next_recommended_slice),
      },
      temp_result_contract_tests: {
        suite_fingerprint:
          asString(contractReport.suite_fingerprint) ?? createFingerprint(contractCases),
        final_status: asString(contractReport.final_status),
        total_cases: contractTotalCases,
        expected_failures: contractExpectedFailures,
        unexpected_passes: contractUnexpectedPasses,
        unexpected_failures: contractUnexpectedFailures,
      },
      browser_validation: {
        report_present: browserReportPresent,
        final_status: asString(browserReport.final_status),
        external_request_count: asNumber(browserReport.external_request_count),
        forbidden_request_count: asNumber(browserReport.forbidden_request_count),
      },
    },
    gate_design_status: "product_write_gate_design_only",
    gate_summary: gateSummary,
    product_write_gate_results: productWriteGateResults,
    required_gate_groups: [...REQUIRED_GATE_GROUPS],
    required_future_contracts: [...REQUIRED_FUTURE_CONTRACTS],
    smallest_future_bridge_design_scope: smallestFutureBridgeDesignScope(),
    blocked_product_write_reasons: [...BLOCKED_PRODUCT_WRITE_REASONS],
    product_write_boundary: productWriteBoundary(),
    next_stage_recommendation: {
      recommendation_status: recommendationStatus,
      recommended_next_slice: "single_claim_temp_to_product_bridge_design",
      why_product_write_is_still_forbidden: [
        "This artifact designs gates only and grants no product write authority.",
        "Operator decision, source verification, proof/evidence, canonical Perspective, product schema, idempotency, rollback, audit, enabled adapter, and product route contracts are still missing.",
      ],
      minimum_artifacts_before_any_product_write_implementation: [
        "explicit_operator_single_claim_promotion_decision_contract",
        "product_claim_schema_and_migration_review",
        "product_claim_id_allocation_contract",
        "durable_idempotency_storage_contract",
        "durable_rollback_contract",
        "product_review_audit_record_contract",
        "source_verification_authority_contract",
        "proof_evidence_authority_contract",
        "canonical_perspective_authority_contract",
        "disabled_to_enabled_adapter_transition_review",
        "product_write_route_contract",
      ],
    },
    next_recommended_slice: "single_claim_temp_to_product_bridge_design",
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
      actual_promotion_allowed: false,
    },
  };
}

function buildGateResults({
  harnessResult,
  resultReview,
  rowCounts,
  insertedClaim,
  contractReport,
  contractReportPresent,
  contractUnexpectedPasses,
  contractUnexpectedFailures,
  browserReport,
  browserReportPresent,
  productBoundaryPreserved,
}) {
  const reviewStatus = asString(resultReview.review_status);
  const tempEvidenceSupported =
    harnessResult.result_status === "temp_db_write_passed" &&
    rowCountsExactlyOne(rowCounts);
  const contractPass =
    contractReportPresent &&
    contractReport.final_status === "pass" &&
    contractUnexpectedPasses === 0 &&
    contractUnexpectedFailures === 0;
  const browserExternalCount = asNumber(browserReport.external_request_count);
  const browserForbiddenCount = asNumber(browserReport.forbidden_request_count);
  const browserStatus = !browserReportPresent
    ? "warn"
    : browserReport.final_status === "pass" &&
        browserExternalCount === 0 &&
        browserForbiddenCount === 0
      ? "pass"
      : "block";
  const selectedClaimSupported =
    asString(insertedClaim.source_operation_id) !== null &&
    asString(insertedClaim.source_temp_intent_id) !== null &&
    asString(insertedClaim.temp_claim_record_id) !== null &&
    insertedClaim.product_claim_id === null &&
    insertedClaim.canonical_claim_id === null;

  return [
    gate(
      "temp_db_write_harness_passed",
      "temp_evidence_gates",
      "Temp DB write harness passed",
      tempEvidenceSupported ? "pass" : "block",
      ["temp DB harness result", "exactly one temp claim/idempotency/rollback/audit row"],
      [],
      "The bridge design cannot proceed unless the temp-only write experiment produced the expected isolated record set.",
      "temp_db_single_claim_write_prototype_harness_report",
    ),
    gate(
      "temp_result_review_non_blocking",
      "temp_evidence_gates",
      "Temp result review is non-blocking",
      reviewStatus === "temp_result_review_blocked"
        ? "block"
        : reviewStatus === "temp_result_review_needs_attention"
          ? "warn"
          : "pass",
      ["temp DB result review artifact"],
      reviewStatus === "temp_result_review_needs_attention"
        ? ["optional browser or traversal-backed evidence may be incomplete"]
        : [],
      "Result review must not block before product-write gate design can proceed.",
      "temp_db_single_claim_result_review",
    ),
    gate(
      "temp_result_contract_tests_passed",
      "temp_evidence_gates",
      "Temp result contract tests passed",
      !contractReportPresent ? "warn" : contractPass ? "pass" : "block",
      contractReportPresent
        ? ["temp DB result contract-test report"]
        : ["committed result contract-test matrix fixture"],
      contractReportPresent ? [] : ["optional live /tmp contract-test report"],
      "Contract tests must prove malformed result evidence is rejected before bridge design hardens into implementation.",
      "temp_db_single_claim_result_contract_tests_report",
    ),
    gate(
      "browser_observed_no_external_or_forbidden_requests",
      "temp_evidence_gates",
      "Browser observed no external or forbidden requests",
      browserStatus,
      browserReportPresent ? ["browser validation report"] : [],
      browserReportPresent ? [] : ["optional browser-backed validation report"],
      "The lane must stay free of provider, retrieval, source-fetch, and external request behavior before product-write design continues.",
      "browser_backed_manual_note_lane_validation_report",
    ),
    blockedGate(
      "explicit_operator_decision_contract_present",
      "operator_authority_gates",
      "Explicit operator single-claim decision contract present",
      "No product write may be designed as executable until a human operator decision contract exists.",
      "explicit_operator_single_claim_promotion_decision_contract",
      ["operator promotion decision authority"],
    ),
    gate(
      "selected_claim_identity_contract_present",
      "operator_authority_gates",
      "Selected claim identity contract present",
      selectedClaimSupported ? "pass" : "block",
      selectedClaimSupported
        ? ["temp claim record id", "source operation id", "source temp intent id"]
        : [],
      selectedClaimSupported ? [] : ["single selected claim candidate identity"],
      "The future bridge must bind exactly one selected claim candidate before any product ID allocation can be designed.",
      "selected_claim_candidate_identity_contract",
    ),
    blockedGate(
      "product_claim_schema_contract_present",
      "product_schema_gates",
      "Product claim schema contract present",
      "A product claim table or product record contract must be reviewed before any product DB write design.",
      "product_claim_schema_contract",
      ["product schema review"],
    ),
    blockedGate(
      "product_claim_id_allocation_contract_present",
      "product_id_allocation_gates",
      "Product claim ID allocation contract present",
      "Future product claim IDs may only be allocated after the ID allocation gate controls the selected claim candidate and operator decision.",
      "product_claim_id_allocation_contract",
      ["product claim ID allocation authority"],
    ),
    blockedGate(
      "product_idempotency_storage_contract_present",
      "idempotency_gates",
      "Product idempotency storage contract present",
      "Durable idempotency storage is required before a bridge can prevent duplicate product writes.",
      "product_idempotency_storage_contract",
      ["durable product idempotency storage"],
    ),
    blockedGate(
      "product_rollback_storage_contract_present",
      "rollback_gates",
      "Product rollback storage contract present",
      "A rollback contract is required before a future product write can be safely reversed or inspected.",
      "product_rollback_storage_contract",
      ["durable product rollback storage"],
    ),
    blockedGate(
      "product_review_audit_record_contract_present",
      "review_audit_gates",
      "Product review audit record contract present",
      "Product write attempts need durable review audit records distinct from preview activity.",
      "product_review_audit_record_contract",
      ["durable product review audit storage"],
    ),
    blockedGate(
      "source_verification_authority_present",
      "source_evidence_authority_gates",
      "Source verification authority present",
      "The bridge cannot treat preview source references as verified sources without a separate authority lane.",
      "source_verification_authority_contract",
      ["source verification authority"],
    ),
    blockedGate(
      "proof_evidence_authority_present",
      "source_evidence_authority_gates",
      "Proof/evidence write authority present",
      "Claim promotion cannot create proof or evidence records without explicit proof/evidence authority.",
      "proof_evidence_authority_contract",
      ["proof/evidence write authority"],
    ),
    blockedGate(
      "canonical_perspective_authority_present",
      "source_evidence_authority_gates",
      "Canonical Perspective authority present",
      "Claim-only bridge design must keep Perspective and canonical graph writes forbidden without separate authority.",
      "canonical_perspective_authority_contract",
      ["canonical Perspective authority"],
    ),
    blockedGate(
      "enabled_adapter_transition_contract_present",
      "adapter_enablement_gates",
      "Enabled adapter transition contract present",
      "A disabled adapter cannot become executable without an explicit transition review.",
      "disabled_to_enabled_adapter_transition_contract",
      ["enabled adapter transition review"],
    ),
    blockedGate(
      "product_write_route_contract_present",
      "route_and_execution_gates",
      "Product write route contract present",
      "No production route exists or is allowed in this PR; future bridge design must define one before implementation.",
      "product_write_route_contract",
      ["product write route authority"],
    ),
    gate(
      "product_boundary_preserved",
      "product_boundary_gates",
      "Product write boundary preserved",
      productBoundaryPreserved ? "pass" : "block",
      productBoundaryPreserved
        ? ["source fixture boundary flags", "absence of product IDs"]
        : [],
      productBoundaryPreserved ? [] : ["no-product-write boundary restoration"],
      "Bridge design can only proceed while all current artifacts preserve no product write, no product IDs, no provider/retrieval/source fetch, and no external handoff.",
      "product_boundary_invariant",
    ),
    blockedGate(
      "product_write_observability_contract_present",
      "route_and_execution_gates",
      "Product write observability contract present",
      "A future product-write bridge needs bounded observability before any implementation work.",
      "product_write_observability_contract",
      ["product write observability contract"],
    ),
  ];
}

function gate(
  gateId,
  gateGroup,
  gateLabel,
  status,
  currentlySupportedBy,
  missingAuthority,
  whyRequiredBeforeProductWrite,
  requiredFutureArtifactOrContract,
  canBeSatisfiedInFutureSlice = true,
) {
  return {
    gate_id: gateId,
    gate_group: gateGroup,
    gate_label: gateLabel,
    status,
    currently_supported_by: currentlySupportedBy,
    missing_authority: missingAuthority,
    why_required_before_product_write: whyRequiredBeforeProductWrite,
    required_future_artifact_or_contract: requiredFutureArtifactOrContract,
    product_write_allowed_now: false,
    can_be_satisfied_in_future_slice: canBeSatisfiedInFutureSlice,
  };
}

function blockedGate(
  gateId,
  gateGroup,
  gateLabel,
  whyRequiredBeforeProductWrite,
  requiredFutureArtifactOrContract,
  missingAuthority,
) {
  return gate(
    gateId,
    gateGroup,
    gateLabel,
    "block",
    [],
    missingAuthority,
    whyRequiredBeforeProductWrite,
    requiredFutureArtifactOrContract,
  );
}

function summarizeGates(gates) {
  const passGateIds = gates
    .filter((gateResult) => gateResult.status === "pass")
    .map((gateResult) => gateResult.gate_id);
  const warnGateIds = gates
    .filter((gateResult) => gateResult.status === "warn")
    .map((gateResult) => gateResult.gate_id);
  const blockGateIds = gates
    .filter((gateResult) => gateResult.status === "block")
    .map((gateResult) => gateResult.gate_id);
  return {
    pass_count: passGateIds.length,
    warn_count: warnGateIds.length,
    block_count: blockGateIds.length,
    pass_gate_ids: passGateIds,
    warn_gate_ids: warnGateIds,
    block_gate_ids: blockGateIds,
  };
}

function canRecommendBridgeDesign(gates) {
  return gates.every((gateResult) => {
    if (AUTHORITY_BLOCK_GATE_IDS.has(gateResult.gate_id)) {
      return gateResult.status === "block";
    }
    return gateResult.status !== "block";
  });
}

function validateDesign(design) {
  const failures = [];
  const gates = asArray(design.product_write_gate_results).map(asRecord);
  for (const gateResult of gates) {
    if (AUTHORITY_BLOCK_GATE_IDS.has(gateResult.gate_id)) {
      if (gateResult.status !== "block") {
        failures.push(`${gateResult.gate_id}_unexpectedly_unblocked`);
      }
      continue;
    }
    if (gateResult.status === "block") {
      failures.push(`${gateResult.gate_id}_blocked`);
    }
  }
  if (!boundaryFalseExcept(asRecord(design.product_write_boundary), new Set(["gate_design_only"]))) {
    failures.push("product_write_boundary_violated");
  }
  if (design.local_copy_packet?.product_write_authority_granted !== false) {
    failures.push("product_write_authority_granted");
  }
  if (design.next_stage_recommendation?.recommendation_status !== "ready_for_single_claim_bridge_design") {
    failures.push("bridge_design_recommendation_blocked");
  }
  return {
    passed: failures.length === 0,
    failures,
  };
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

function rowCountsExactlyOne(rowCounts) {
  return TEMP_TABLES.every((tableName) => rowCounts[tableName] === 1);
}

function countMaybeArray(value) {
  if (Array.isArray(value)) return value.length;
  return asNumber(value);
}

function allSourceBoundariesPreserved({ productReview, harnessResult, resultReview }) {
  return (
    boundaryFalseExcept(asRecord(productReview.product_write_boundary), new Set(["design_review_only"])) &&
    boundaryFalseExcept(asRecord(harnessResult.product_write_boundary), new Set(["temp_db_execution_only"])) &&
    boundaryFalseExcept(asRecord(resultReview.product_write_boundary), new Set(["result_review_only"])) &&
    noNonNullProductIds(productReview) &&
    noNonNullProductIds(harnessResult) &&
    noNonNullProductIds(resultReview)
  );
}

function boundaryFalseExcept(boundary, allowedTrueKeys) {
  if (Object.keys(boundary).length === 0) return false;
  return Object.entries(boundary).every(([key, value]) =>
    allowedTrueKeys.has(key) ? value === true : value === false,
  );
}

function noNonNullProductIds(value) {
  if (Array.isArray(value)) {
    return value.every((item) => noNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return true;
  return Object.entries(value).every(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) return nestedValue === null;
    return noNonNullProductIds(nestedValue);
  });
}

function productWriteBoundary() {
  return {
    gate_design_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    product_ids_created: false,
    repo_schema_changed: false,
    migration_added: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_product_persistence: false,
    browser_persistence: false,
  };
}

function smallestFutureBridgeDesignScope() {
  return {
    bridge_name: "single_claim_temp_to_product_bridge_design",
    claim_only: true,
    one_selected_claim_candidate_only: true,
    temp_db_result_required: true,
    result_contract_tests_required: true,
    operator_decision_required: true,
    product_schema_review_required: true,
    product_idempotency_required: true,
    rollback_required: true,
    audit_required: true,
    source_verification_required_before_normal_product_write: true,
    proof_evidence_write_still_forbidden_in_bridge: true,
    Perspective_or_canonical_graph_write_still_forbidden_in_bridge: true,
    work_item_creation_still_forbidden_in_bridge: true,
    provider_retrieval_source_fetch_still_forbidden_in_bridge: true,
    external_handoff_still_forbidden_in_bridge: true,
  };
}

function buildMarkdown(design) {
  return [
    "# Manual Note Single-Claim Product Write Gate Design",
    "",
    "Design/gate only. No DB is opened and no SQL is executed.",
    `gate_design_status: ${design.gate_design_status}`,
    `recommendation_status: ${design.next_stage_recommendation.recommendation_status}`,
    "",
    "## Gate Summary",
    `- pass: ${design.gate_summary.pass_count}`,
    `- warn: ${design.gate_summary.warn_count}`,
    `- block: ${design.gate_summary.block_count}`,
    "",
    "## Boundary",
    "normal_product_write_enabled=false",
    "product_db_write=false",
    "actual_promotion_performed=false",
    "proof_or_evidence_writes=false",
    "perspective_or_canonical_writes=false",
    "canonical_graph_write=false",
    "work_item_creation=false",
    "provider_or_openai_calls=false",
    "retrieval_or_rag=false",
    "source_fetching=false",
    "external_handoff_sent=false",
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
      gate_summary: design.gate_summary,
      required_future_contracts: design.required_future_contracts,
      blocked_product_write_reasons: design.blocked_product_write_reasons,
      product_write_boundary: design.product_write_boundary,
      next_stage_recommendation: design.next_stage_recommendation,
      next_recommended_slice: design.next_recommended_slice,
    },
    null,
    2,
  );
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath) {
  if (!existsSync(filePath)) return null;
  return readJson(filePath);
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
