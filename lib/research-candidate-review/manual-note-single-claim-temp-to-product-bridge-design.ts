export const MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_VERSION =
  "manual_note_single_claim_temp_to_product_bridge_design.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BridgeDesignInput = {
  productWriteGateDesign: unknown;
  tempDbWriteHarnessReport: unknown;
  tempResultReview: unknown;
  tempResultContractTestsReport?: unknown | null;
  tempResultContractTestCases?: unknown | null;
  browserValidationReport?: unknown | null;
  generated_at?: string | null;
};

type ExplicitForbiddenSurfaces = {
  proof_evidence_write: false;
  perspective_or_canonical_graph_write: false;
  work_item_creation: false;
  source_fetch: false;
  provider_or_openai_call: false;
  retrieval_or_rag: false;
  external_handoff: false;
  product_db_write: false;
  product_id_allocation: false;
  sql_execution: false;
  db_open: false;
  schema_or_migration_change: false;
  route_added: false;
  ui_write_action_added: false;
  adapter_enabled: false;
};

type BridgeDesignCopySource = Omit<
  ManualNoteSingleClaimTempToProductBridgeDesign,
  "local_copy_packet"
>;

export type ManualNoteSingleClaimTempToProductBridgeDesign = {
  design_kind: "manual_note_single_claim_temp_to_product_bridge_design";
  design_version: typeof MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_VERSION;
  design_fingerprint: string;
  source_evidence: {
    product_write_gate_design: {
      design_fingerprint: string | null;
      gate_design_status: string | null;
      recommendation_status: string | null;
      next_recommended_slice: string | null;
    };
    temp_db_write_harness: {
      result_fingerprint: string | null;
      result_status: string | null;
      selected_temp_claim_record_id: string | null;
      source_operation_id: string | null;
      source_temp_intent_id: string | null;
      temp_idempotency_key: string | null;
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
      result_contract_evidence_fingerprint: string | null;
      result_contract_suite_fingerprint: string | null;
      final_status: string | null;
      total_cases: number;
      expected_failures: number;
      report_present: boolean;
    };
    browser_validation: {
      report_present: boolean;
      final_status: string | null;
      external_request_count: number | null;
      forbidden_request_count: number | null;
    };
    source_boundary_preserved: boolean;
  };
  bridge_input_contract: {
    selected_temp_claim_record_id: string | null;
    source_operation_id: string | null;
    source_temp_intent_id: string | null;
    temp_idempotency_key: string | null;
    result_contract_evidence_fingerprint: string | null;
    gate_design_fingerprint: string | null;
    operator_decision_fingerprint_placeholder: "operator-decision-fingerprint:blocked-until-explicit-contract";
    operator_decision_status: "blocked_until_explicit_operator_decision_contract";
  };
  future_product_claim_draft: {
    candidate_kind: "manual_note_single_claim";
    source_temp_claim_record_id: string | null;
    source_operation_id: string | null;
    source_temp_intent_id: string | null;
    product_claim_id: null;
    product_claim_id_allocation_status: "blocked_until_operator_and_schema_contract";
    raw_manual_note_text_included: false;
    proof_id: null;
    evidence_id: null;
    perspective_id: null;
    work_item_id: null;
  };
  future_product_idempotency_design: {
    key_inputs: {
      selected_temp_claim_record_id: string | null;
      source_operation_id: string | null;
      gate_design_fingerprint: string | null;
      result_contract_suite_fingerprint: string | null;
      operator_decision_fingerprint_placeholder: "operator-decision-fingerprint:blocked-until-explicit-contract";
    };
    storage_status: "blocked_until_product_idempotency_storage_contract";
    product_idempotency_record_id: null;
    idempotency_write_executed_now: false;
  };
  future_product_rollback_design: {
    strategy: "delete_or_mark_product_claim_by_idempotency_key";
    rollback_storage_status: "blocked_until_product_rollback_storage_contract";
    rollback_executed_now: false;
    product_rollback_record_id: null;
  };
  future_product_audit_design: {
    records_operator_decision: "required_later";
    records_gate_evidence: true;
    records_bridge_design_inputs: true;
    product_audit_record_id: null;
    audit_write_executed_now: false;
  };
  explicit_forbidden_surfaces: ExplicitForbiddenSurfaces;
  bridge_design_status: "single_claim_bridge_design_only";
  bridge_execution_allowed_now: false;
  product_write_allowed_now: false;
  recommendation_status: "ready_for_disabled_bridge_skeleton";
  next_recommended_slice: "single_claim_temp_to_product_disabled_bridge_skeleton";
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted_to_product_db: false;
    product_write_authority_granted: false;
    bridge_execution_allowed_now: false;
    product_write_allowed_now: false;
  };
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
  "product_rollback_record_id",
  "product_audit_record_id",
  "audit_record_product_id",
];

export function buildManualNoteSingleClaimTempToProductBridgeDesign(
  input: BridgeDesignInput,
): ManualNoteSingleClaimTempToProductBridgeDesign {
  const productWriteGateDesign = asRecord(input.productWriteGateDesign);
  const gateSourceEvidence = asRecord(productWriteGateDesign.source_evidence);
  const gateContractEvidence = asRecord(gateSourceEvidence.temp_result_contract_tests);
  const gateRecommendation = asRecord(
    productWriteGateDesign.next_stage_recommendation,
  );
  const harnessReport = asRecord(input.tempDbWriteHarnessReport);
  const harnessResult = asRecord(harnessReport.harness_result);
  const insertedRecords = asRecord(harnessResult.inserted_records);
  const tempClaimRecord = asRecord(insertedRecords.temp_claim_record);
  const tempIdempotencyRecord = asRecord(insertedRecords.temp_idempotency_record);
  const tempResultReview = readResultReview(input.tempResultReview);
  const insertedClaimSummary = asRecord(tempResultReview.inserted_claim_summary);
  const contractReport = asRecord(input.tempResultContractTestsReport);
  const contractCases = asRecord(input.tempResultContractTestCases);
  const browserReport = asRecord(input.browserValidationReport);
  const contractReportPresent = Object.keys(contractReport).length > 0;
  const browserReportPresent = Object.keys(browserReport).length > 0;
  const resultContractSuiteFingerprint =
    asString(contractReport.suite_fingerprint) ??
    asString(gateContractEvidence.suite_fingerprint) ??
    asString(gateContractEvidence.result_contract_suite_fingerprint) ??
    createManualNoteSingleClaimTempToProductBridgeDesignFingerprint(contractCases);

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
    gate_design_fingerprint: asString(productWriteGateDesign.design_fingerprint),
    operator_decision_fingerprint_placeholder:
      "operator-decision-fingerprint:blocked-until-explicit-contract" as const,
    operator_decision_status:
      "blocked_until_explicit_operator_decision_contract" as const,
  };

  const designCore: BridgeDesignCopySource = {
    design_kind: "manual_note_single_claim_temp_to_product_bridge_design",
    design_version:
      MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_VERSION,
    design_fingerprint: "",
    source_evidence: {
      product_write_gate_design: {
        design_fingerprint: asString(productWriteGateDesign.design_fingerprint),
        gate_design_status: asString(productWriteGateDesign.gate_design_status),
        recommendation_status: asString(gateRecommendation.recommendation_status),
        next_recommended_slice: asString(productWriteGateDesign.next_recommended_slice),
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
        review_fingerprint: asString(tempResultReview.review_fingerprint),
        review_status: asString(tempResultReview.review_status),
        next_recommended_slice: asString(tempResultReview.next_recommended_slice),
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
        productWriteGateDesign,
        harnessResult,
        tempResultReview,
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
  const fingerprint =
    createManualNoteSingleClaimTempToProductBridgeDesignFingerprint(designCore);
  const design = {
    ...designCore,
    design_fingerprint: fingerprint,
  };
  return {
    ...design,
    local_copy_packet: {
      markdown: buildManualNoteSingleClaimTempToProductBridgeDesignMarkdown(design),
      json: buildManualNoteSingleClaimTempToProductBridgeDesignJson(design),
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

export function buildManualNoteSingleClaimTempToProductBridgeDesignMarkdown(
  design: BridgeDesignCopySource,
): string {
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

export function buildManualNoteSingleClaimTempToProductBridgeDesignJson(
  design: BridgeDesignCopySource,
): string {
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

export function createManualNoteSingleClaimTempToProductBridgeDesignFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function explicitForbiddenSurfaces(): ExplicitForbiddenSurfaces {
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

function allSourceBoundariesPreserved({
  productWriteGateDesign,
  harnessResult,
  tempResultReview,
}: {
  productWriteGateDesign: JsonRecord;
  harnessResult: JsonRecord;
  tempResultReview: JsonRecord;
}): boolean {
  return (
    boundaryFalseExcept(
      asRecord(productWriteGateDesign.product_write_boundary),
      new Set(["gate_design_only"]),
    ) &&
    boundaryFalseExcept(
      asRecord(harnessResult.product_write_boundary),
      new Set(["temp_db_execution_only"]),
    ) &&
    boundaryFalseExcept(
      asRecord(tempResultReview.product_write_boundary),
      new Set(["result_review_only"]),
    ) &&
    noNonNullProductIds(productWriteGateDesign) &&
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
