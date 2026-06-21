export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_VERSION =
  "manual_note_single_claim_product_write_gate_design.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type GateStatus = "pass" | "warn" | "block";

type ProductWriteGateDesignInput = {
  productWriteDesignReview: unknown;
  tempDbWriteHarnessReport: unknown;
  tempResultReview: unknown;
  tempResultContractTestsReport?: unknown | null;
  tempResultContractTestCases?: unknown | null;
  browserValidationReport?: unknown | null;
  generated_at?: string | null;
};

type GateResult = {
  gate_id: string;
  gate_group: string;
  gate_label: string;
  status: GateStatus;
  currently_supported_by: string[];
  missing_authority: string[];
  why_required_before_product_write: string;
  required_future_artifact_or_contract: string;
  product_write_allowed_now: false;
  can_be_satisfied_in_future_slice: boolean;
};

type ProductWriteBoundary = {
  gate_design_only: true;
  normal_product_write_enabled: false;
  product_db_write: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  product_ids_created: false;
  repo_schema_changed: false;
  migration_added: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_product_persistence: false;
  browser_persistence: false;
};

type ProductWriteGateDesignCopySource = Omit<
  ManualNoteSingleClaimProductWriteGateDesign,
  "local_copy_packet"
>;

export type ManualNoteSingleClaimProductWriteGateDesign = {
  design_kind: "manual_note_single_claim_product_write_gate_design";
  design_version: typeof MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_VERSION;
  design_fingerprint: string;
  source_evidence: {
    product_write_design_review: {
      review_fingerprint: string | null;
      design_status: string | null;
      next_recommended_slice: string | null;
    };
    temp_db_write_harness: {
      result_fingerprint: string | null;
      result_status: string | null;
      temp_record_counts: Record<string, number>;
      product_db_write: false;
      product_ids_created: false;
    };
    temp_result_review: {
      review_fingerprint: string | null;
      review_status: string | null;
      next_recommended_slice: string | null;
    };
    temp_result_contract_tests: {
      suite_fingerprint: string | null;
      final_status: string | null;
      total_cases: number;
      expected_failures: number;
      unexpected_passes: number | null;
      unexpected_failures: number | null;
    };
    browser_validation: {
      report_present: boolean;
      final_status: string | null;
      external_request_count: number | null;
      forbidden_request_count: number | null;
    };
  };
  gate_design_status: "product_write_gate_design_only";
  gate_summary: {
    pass_count: number;
    warn_count: number;
    block_count: number;
    pass_gate_ids: string[];
    warn_gate_ids: string[];
    block_gate_ids: string[];
  };
  product_write_gate_results: GateResult[];
  required_gate_groups: string[];
  required_future_contracts: string[];
  smallest_future_bridge_design_scope: {
    bridge_name: "single_claim_temp_to_product_bridge_design";
    claim_only: true;
    one_selected_claim_candidate_only: true;
    temp_db_result_required: true;
    result_contract_tests_required: true;
    operator_decision_required: true;
    product_schema_review_required: true;
    product_idempotency_required: true;
    rollback_required: true;
    audit_required: true;
    source_verification_required_before_normal_product_write: true;
    proof_evidence_write_still_forbidden_in_bridge: true;
    Perspective_or_canonical_graph_write_still_forbidden_in_bridge: true;
    work_item_creation_still_forbidden_in_bridge: true;
    provider_retrieval_source_fetch_still_forbidden_in_bridge: true;
    external_handoff_still_forbidden_in_bridge: true;
  };
  blocked_product_write_reasons: string[];
  product_write_boundary: ProductWriteBoundary;
  next_stage_recommendation: {
    recommendation_status:
      | "ready_for_single_claim_bridge_design"
      | "blocked_before_bridge_design";
    recommended_next_slice: "single_claim_temp_to_product_bridge_design";
    why_product_write_is_still_forbidden: string[];
    minimum_artifacts_before_any_product_write_implementation: string[];
  };
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted_to_product_db: false;
    product_write_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "single_claim_temp_to_product_bridge_design";
};

const TEMP_TABLES = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
] as const;

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

export function buildManualNoteSingleClaimProductWriteGateDesign(
  input: ProductWriteGateDesignInput,
): ManualNoteSingleClaimProductWriteGateDesign {
  const productWriteDesignReview = asRecord(input.productWriteDesignReview);
  const tempHarnessReport = asRecord(input.tempDbWriteHarnessReport);
  const harnessResult = asRecord(tempHarnessReport.harness_result);
  const tempResultReview = readResultReview(input.tempResultReview);
  const contractReport = asRecord(input.tempResultContractTestsReport);
  const contractCases = asRecord(input.tempResultContractTestCases);
  const browserReport = asRecord(input.browserValidationReport);
  const tempRecordCounts = readRowCounts(
    asRecord(harnessResult.verification).row_counts,
  );
  const insertedClaim = asRecord(tempResultReview.inserted_claim_summary);
  const productBoundaryPreserved = allSourceBoundariesPreserved({
    productWriteDesignReview,
    harnessResult,
    tempResultReview,
  });
  const contractReportPresent = Object.keys(contractReport).length > 0;
  const browserReportPresent = Object.keys(browserReport).length > 0;
  const contractUnexpectedPasses = countMaybeArray(contractReport.unexpected_passes);
  const contractUnexpectedFailures = countMaybeArray(
    contractReport.unexpected_failures,
  );
  const contractTotalCases =
    asNumber(contractReport.total_cases) ??
    asArray(contractCases.test_cases).length;
  const contractExpectedFailures =
    asNumber(contractReport.expected_failures) ??
    asArray(contractCases.test_cases).filter(
      (testCase) => asRecord(testCase).expected_status === "fail",
    ).length;

  const productWriteGateResults = buildGateResults({
    productWriteDesignReview,
    harnessResult,
    tempResultReview,
    tempRecordCounts,
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

  const designCore: ProductWriteGateDesignCopySource = {
    design_kind: "manual_note_single_claim_product_write_gate_design",
    design_version: MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_VERSION,
    design_fingerprint: "",
    source_evidence: {
      product_write_design_review: {
        review_fingerprint: asString(productWriteDesignReview.review_fingerprint),
        design_status: asString(productWriteDesignReview.design_status),
        next_recommended_slice: asString(productWriteDesignReview.next_recommended_slice),
      },
      temp_db_write_harness: {
        result_fingerprint: asString(harnessResult.result_fingerprint),
        result_status: asString(harnessResult.result_status),
        temp_record_counts: tempRecordCounts,
        product_db_write: false,
        product_ids_created: false,
      },
      temp_result_review: {
        review_fingerprint: asString(tempResultReview.review_fingerprint),
        review_status: asString(tempResultReview.review_status),
        next_recommended_slice: asString(tempResultReview.next_recommended_slice),
      },
      temp_result_contract_tests: {
        suite_fingerprint:
          asString(contractReport.suite_fingerprint) ??
          createManualNoteSingleClaimProductWriteGateDesignFingerprint(contractCases),
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
  const fingerprint =
    createManualNoteSingleClaimProductWriteGateDesignFingerprint(designCore);
  const design = {
    ...designCore,
    design_fingerprint: fingerprint,
  };
  return {
    ...design,
    local_copy_packet: {
      markdown: buildManualNoteSingleClaimProductWriteGateDesignMarkdown(design),
      json: buildManualNoteSingleClaimProductWriteGateDesignJson(design),
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

export function buildManualNoteSingleClaimProductWriteGateDesignMarkdown(
  design: ProductWriteGateDesignCopySource,
): string {
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

export function buildManualNoteSingleClaimProductWriteGateDesignJson(
  design: ProductWriteGateDesignCopySource,
): string {
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

export function createManualNoteSingleClaimProductWriteGateDesignFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function buildGateResults({
  productWriteDesignReview,
  harnessResult,
  tempResultReview,
  tempRecordCounts,
  insertedClaim,
  contractReport,
  contractReportPresent,
  contractUnexpectedPasses,
  contractUnexpectedFailures,
  browserReport,
  browserReportPresent,
  productBoundaryPreserved,
}: {
  productWriteDesignReview: JsonRecord;
  harnessResult: JsonRecord;
  tempResultReview: JsonRecord;
  tempRecordCounts: Record<string, number>;
  insertedClaim: JsonRecord;
  contractReport: JsonRecord;
  contractReportPresent: boolean;
  contractUnexpectedPasses: number | null;
  contractUnexpectedFailures: number | null;
  browserReport: JsonRecord;
  browserReportPresent: boolean;
  productBoundaryPreserved: boolean;
}): GateResult[] {
  const reviewStatus = asString(tempResultReview.review_status);
  const tempEvidenceSupported =
    harnessResult.result_status === "temp_db_write_passed" &&
    rowCountsExactlyOne(tempRecordCounts);
  const contractPass =
    contractReportPresent &&
    contractReport.final_status === "pass" &&
    contractUnexpectedPasses === 0 &&
    contractUnexpectedFailures === 0;
  const browserExternalCount = asNumber(browserReport.external_request_count);
  const browserForbiddenCount = asNumber(browserReport.forbidden_request_count);
  const browserStatus: GateStatus = !browserReportPresent
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
  gateId: string,
  gateGroup: string,
  gateLabel: string,
  status: GateStatus,
  currentlySupportedBy: string[],
  missingAuthority: string[],
  whyRequiredBeforeProductWrite: string,
  requiredFutureArtifactOrContract: string,
  canBeSatisfiedInFutureSlice = true,
): GateResult {
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
  gateId: string,
  gateGroup: string,
  gateLabel: string,
  whyRequiredBeforeProductWrite: string,
  requiredFutureArtifactOrContract: string,
  missingAuthority: string[],
): GateResult {
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

function summarizeGates(gates: GateResult[]) {
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

function canRecommendBridgeDesign(gates: GateResult[]): boolean {
  return gates.every((gateResult) => {
    if (AUTHORITY_BLOCK_GATE_IDS.has(gateResult.gate_id)) {
      return gateResult.status === "block";
    }
    return gateResult.status !== "block";
  });
}

function readResultReview(value: unknown): JsonRecord {
  const record = asRecord(value);
  return Object.keys(asRecord(record.result_review)).length > 0
    ? asRecord(record.result_review)
    : record;
}

function readRowCounts(value: unknown): Record<string, number> {
  const record = asRecord(value);
  return {
    temp_claim_records: asNumber(record.temp_claim_records) ?? 0,
    temp_idempotency_records: asNumber(record.temp_idempotency_records) ?? 0,
    temp_rollback_records: asNumber(record.temp_rollback_records) ?? 0,
    temp_review_audit_records: asNumber(record.temp_review_audit_records) ?? 0,
  };
}

function rowCountsExactlyOne(rowCounts: Record<string, number>): boolean {
  return TEMP_TABLES.every((tableName) => rowCounts[tableName] === 1);
}

function countMaybeArray(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  return asNumber(value);
}

function allSourceBoundariesPreserved({
  productWriteDesignReview,
  harnessResult,
  tempResultReview,
}: {
  productWriteDesignReview: JsonRecord;
  harnessResult: JsonRecord;
  tempResultReview: JsonRecord;
}): boolean {
  return (
    boundaryFalseExcept(
      asRecord(productWriteDesignReview.product_write_boundary),
      new Set(["design_review_only"]),
    ) &&
    boundaryFalseExcept(
      asRecord(harnessResult.product_write_boundary),
      new Set(["temp_db_execution_only"]),
    ) &&
    boundaryFalseExcept(
      asRecord(tempResultReview.product_write_boundary),
      new Set(["result_review_only"]),
    ) &&
    noNonNullProductIds(productWriteDesignReview) &&
    noNonNullProductIds(harnessResult) &&
    noNonNullProductIds(tempResultReview)
  );
}

function boundaryFalseExcept(boundary: JsonRecord, allowedTrueKeys: Set<string>): boolean {
  if (Object.keys(boundary).length === 0) return false;
  return Object.entries(boundary).every(([key, value]) =>
    allowedTrueKeys.has(key) ? value === true : value === false,
  );
}

function noNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => noNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return true;
  return Object.entries(value as JsonRecord).every(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) return nestedValue === null;
    return noNonNullProductIds(nestedValue);
  });
}

function productWriteBoundary(): ProductWriteBoundary {
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
    bridge_name: "single_claim_temp_to_product_bridge_design" as const,
    claim_only: true as const,
    one_selected_claim_candidate_only: true as const,
    temp_db_result_required: true as const,
    result_contract_tests_required: true as const,
    operator_decision_required: true as const,
    product_schema_review_required: true as const,
    product_idempotency_required: true as const,
    rollback_required: true as const,
    audit_required: true as const,
    source_verification_required_before_normal_product_write: true as const,
    proof_evidence_write_still_forbidden_in_bridge: true as const,
    Perspective_or_canonical_graph_write_still_forbidden_in_bridge: true as const,
    work_item_creation_still_forbidden_in_bridge: true as const,
    provider_retrieval_source_fetch_still_forbidden_in_bridge: true as const,
    external_handoff_still_forbidden_in_bridge: true as const,
  };
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
