export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_VERSION =
  "manual_note_single_claim_product_write_authority_contract_bundle.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildManualNoteSingleClaimProductWriteAuthorityContractBundleInput = {
  dryRunTransactionHarness: unknown;
  dryRunTransactionPlan: unknown;
  contractTestsReport: unknown;
  disabledBridgeSkeleton: unknown;
  tempToProductBridgeDesign: unknown;
  productWriteGateDesign: unknown;
  staticBoundaryEvidence?: unknown;
};

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
const READY_STATUS = "product_write_authority_contracts_defined_only";
const BLOCKED_STATUS = "blocked_before_product_write_authority_contract_bundle";
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
] as const;

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
] as const;

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
] as const;

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
] as const;

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
  "product_observability_record_id",
  "audit_record_product_id",
] as const;

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
] as const;

export function buildManualNoteSingleClaimProductWriteAuthorityContractBundle(
  input: BuildManualNoteSingleClaimProductWriteAuthorityContractBundleInput,
): JsonRecord {
  const dryRunTransactionHarness = asRecord(input.dryRunTransactionHarness);
  const dryRunTransactionPlan = asRecord(input.dryRunTransactionPlan);
  const contractTestsReport = asRecord(input.contractTestsReport);
  const disabledBridgeSkeleton = asRecord(input.disabledBridgeSkeleton);
  const tempToProductBridgeDesign = asRecord(input.tempToProductBridgeDesign);
  const productWriteGateDesign = asRecord(input.productWriteGateDesign);
  const staticBoundaryEvidence = asRecord(input.staticBoundaryEvidence);
  const validationFailures = validateSources({
    dryRunTransactionHarness,
    dryRunTransactionPlan,
    contractTestsReport,
    disabledBridgeSkeleton,
    tempToProductBridgeDesign,
    productWriteGateDesign,
    staticBoundaryEvidence,
  });
  const ready = validationFailures.length === 0;
  const bundleCore = {
    authority_contract_bundle_kind:
      "manual_note_single_claim_product_write_authority_contract_bundle",
    authority_contract_bundle_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_VERSION,
    authority_contract_bundle_fingerprint: "",
    source_evidence: buildSourceEvidence({
      dryRunTransactionHarness,
      dryRunTransactionPlan,
      contractTestsReport,
      disabledBridgeSkeleton,
      tempToProductBridgeDesign,
      productWriteGateDesign,
      staticBoundaryEvidence,
    }),
    authority_contract_bundle_status: ready ? READY_STATUS : BLOCKED_STATUS,
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
    static_boundary_evidence: staticBoundaryEvidence,
    validation: {
      passed: ready,
      failure_codes: validationFailures,
    },
  };
  const fingerprint =
    createManualNoteSingleClaimProductWriteAuthorityContractBundleFingerprint(
      bundleCore,
    );
  return {
    ...bundleCore,
    authority_contract_bundle_fingerprint: fingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Product Write Authority Contract Bundle",
        "",
        "Product-write authority contract bundle only.",
        "Authority contracts are defined but not satisfied, and product write remains blocked.",
        `authority_contract_bundle_status: ${bundleCore.authority_contract_bundle_status}`,
        `authority_contract_bundle_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          authority_contract_bundle_status:
            bundleCore.authority_contract_bundle_status,
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

export function createManualNoteSingleClaimProductWriteAuthorityContractBundleReport(
  input: BuildManualNoteSingleClaimProductWriteAuthorityContractBundleInput,
): JsonRecord {
  const bundle =
    buildManualNoteSingleClaimProductWriteAuthorityContractBundle(input);
  const passed =
    asRecord(bundle).authority_contract_bundle_status === READY_STATUS;
  return {
    report_kind:
      "manual_note_single_claim_product_write_authority_contract_bundle_report",
    report_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_VERSION,
    authority_contract_bundle: bundle,
    final_status: passed ? "pass" : "fail",
  };
}

export function createManualNoteSingleClaimProductWriteAuthorityContractBundleFingerprint(
  value: unknown,
): string {
  const json = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function validateSources(input: {
  dryRunTransactionHarness: JsonRecord;
  dryRunTransactionPlan: JsonRecord;
  contractTestsReport: JsonRecord;
  disabledBridgeSkeleton: JsonRecord;
  tempToProductBridgeDesign: JsonRecord;
  productWriteGateDesign: JsonRecord;
  staticBoundaryEvidence: JsonRecord;
}): string[] {
  const failures: string[] = [];
  if (input.dryRunTransactionHarness.dry_run_transaction_harness_status !== READY_HARNESS_STATUS) {
    failures.push("dry_run_transaction_harness_status_not_ready");
  }
  if (input.dryRunTransactionHarness.recommendation_status !== READY_HARNESS_RECOMMENDATION) {
    failures.push("dry_run_transaction_harness_recommendation_not_ready");
  }
  if (input.dryRunTransactionHarness.next_recommended_slice !== READY_HARNESS_NEXT_SLICE) {
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
  ] as const) {
    if (input.dryRunTransactionHarness[key] !== false) {
      failures.push(`dry_run_transaction_harness_${key}_not_false`);
    }
  }
  const traceRows = asArray(
    asRecord(input.dryRunTransactionHarness.dry_run_transaction_trace).trace_rows,
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
    ] as const) {
      if (record[key] !== false) {
        failures.push(`dry_run_transaction_harness_trace_${index + 1}_${key}_not_false`);
      }
    }
    if (record.sql_statement_count_now !== 0) {
      failures.push(`dry_run_transaction_harness_trace_${index + 1}_sql_statement_count_not_zero`);
    }
  }
  const envelopes = asRecord(input.dryRunTransactionHarness.envelope_results);
  for (const [label, envelope] of Object.entries(envelopes)) {
    const record = asRecord(envelope);
    for (const [key, value] of Object.entries(record)) {
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
      input.dryRunTransactionHarness.explicit_forbidden_surfaces,
      DISABLED_FORBIDDEN_SURFACE_KEYS,
      "dry_run_transaction_harness_forbidden_surface",
    ),
  );
  if (input.dryRunTransactionPlan.dry_run_transaction_plan_status !== READY_PLAN_STATUS) {
    failures.push("dry_run_transaction_plan_status_not_ready");
  }
  if (input.dryRunTransactionPlan.recommendation_status !== READY_PLAN_RECOMMENDATION) {
    failures.push("dry_run_transaction_plan_recommendation_not_ready");
  }
  if (input.dryRunTransactionPlan.next_recommended_slice !== READY_PLAN_NEXT_SLICE) {
    failures.push("dry_run_transaction_plan_next_slice_invalid");
  }
  failures.push(
    ...validateFalseRecord(
      input.dryRunTransactionPlan.explicit_forbidden_surfaces,
      DISABLED_FORBIDDEN_SURFACE_KEYS,
      "dry_run_transaction_plan_forbidden_surface",
    ),
  );
  if (input.contractTestsReport.final_status !== "pass") {
    failures.push("contract_tests_report_not_passed");
  }
  if (input.contractTestsReport.contract_suite_status !== CONTRACT_SUITE_STATUS) {
    failures.push("contract_suite_status_not_ready");
  }
  if (input.contractTestsReport.recommendation_status !== CONTRACT_SUITE_RECOMMENDATION) {
    failures.push("contract_suite_recommendation_not_ready");
  }
  if (input.contractTestsReport.next_recommended_slice !== CONTRACT_SUITE_NEXT_SLICE) {
    failures.push("contract_suite_next_slice_invalid");
  }
  if (asArray(input.contractTestsReport.unexpected_passes).length !== 0) {
    failures.push("contract_suite_unexpected_passes_present");
  }
  if (asArray(input.contractTestsReport.unexpected_failures).length !== 0) {
    failures.push("contract_suite_unexpected_failures_present");
  }
  if (
    input.disabledBridgeSkeleton.disabled_bridge_skeleton_status !==
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
  ] as const) {
    if (input.disabledBridgeSkeleton[key] !== false) {
      failures.push(`disabled_bridge_skeleton_${key}_not_false`);
    }
  }
  failures.push(
    ...validateFalseRecord(
      input.disabledBridgeSkeleton.explicit_forbidden_surfaces,
      SKELETON_FORBIDDEN_SURFACE_KEYS,
      "disabled_bridge_skeleton_forbidden_surface",
    ),
  );
  if (
    input.tempToProductBridgeDesign.bridge_design_status !==
      "single_claim_bridge_design_only" ||
    input.tempToProductBridgeDesign.recommendation_status !==
      "ready_for_disabled_bridge_skeleton" ||
    input.tempToProductBridgeDesign.next_recommended_slice !==
      "single_claim_temp_to_product_disabled_bridge_skeleton"
  ) {
    failures.push("temp_to_product_bridge_design_not_ready");
  }
  failures.push(
    ...validateFalseRecord(
      input.tempToProductBridgeDesign.explicit_forbidden_surfaces,
      SOURCE_FORBIDDEN_SURFACE_KEYS,
      "temp_to_product_bridge_design_forbidden_surface",
    ),
  );
  const gateRecommendation = asRecord(
    input.productWriteGateDesign.next_stage_recommendation,
  );
  if (
    input.productWriteGateDesign.gate_design_status !==
    "product_write_gate_design_only"
  ) {
    failures.push("product_write_gate_design_status_invalid");
  }
  if (
    gateRecommendation.recommendation_status !==
    "ready_for_single_claim_bridge_design"
  ) {
    failures.push("product_write_gate_design_recommendation_not_ready");
  }
  const staticChangedFiles = asArray(
    input.staticBoundaryEvidence.static_boundary_changed_files_inspected ??
      input.staticBoundaryEvidence.changed_files_inspected,
  );
  if (staticChangedFiles.length === 0) {
    failures.push("static_boundary_changed_file_delta_empty");
  }
  if (input.staticBoundaryEvidence.static_boundary_base_mode === "worktree_only") {
    failures.push("static_boundary_worktree_only_delta");
  }
  const staticFailureCodes = asArray(input.staticBoundaryEvidence.failureCodes);
  if (staticFailureCodes.length > 0) {
    failures.push("static_boundary_failed");
  }
  for (const value of [
    input.dryRunTransactionHarness,
    input.dryRunTransactionPlan,
    input.disabledBridgeSkeleton,
    input.tempToProductBridgeDesign,
    input.productWriteGateDesign,
  ]) {
    if (hasNonNullProductIds(value)) {
      failures.push("upstream_product_id_present");
      break;
    }
  }
  return unique(failures);
}

function buildSourceEvidence(input: {
  dryRunTransactionHarness: JsonRecord;
  dryRunTransactionPlan: JsonRecord;
  contractTestsReport: JsonRecord;
  disabledBridgeSkeleton: JsonRecord;
  tempToProductBridgeDesign: JsonRecord;
  productWriteGateDesign: JsonRecord;
  staticBoundaryEvidence: JsonRecord;
}): JsonRecord {
  const harness = input.dryRunTransactionHarness;
  const plan = input.dryRunTransactionPlan;
  const contractReport = input.contractTestsReport;
  const skeleton = input.disabledBridgeSkeleton;
  const bridgeDesign = input.tempToProductBridgeDesign;
  const gateDesign = input.productWriteGateDesign;
  const gateSummary = asRecord(gateDesign.gate_summary);
  const harnessStatic = asRecord(harness.static_boundary_evidence);
  return {
    dry_run_transaction_harness: {
      harness_fingerprint: asString(harness.dry_run_transaction_harness_fingerprint),
      dry_run_transaction_harness_status: asString(
        harness.dry_run_transaction_harness_status,
      ),
      recommendation_status: asString(harness.recommendation_status),
      next_recommended_slice: asString(harness.next_recommended_slice),
      trace_row_count: asArray(
        asRecord(harness.dry_run_transaction_trace).trace_rows,
      ).length,
      refusal_probe_count: asArray(harness.refusal_probe_matrix).length,
      authority_preview_contract_count: asNumber(
        asRecord(harness.product_write_authority_contract_bundle_preview)
          .required_contract_count,
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
      plan_fingerprint: asString(plan.dry_run_transaction_plan_fingerprint),
      dry_run_transaction_plan_status: asString(
        plan.dry_run_transaction_plan_status,
      ),
      recommendation_status: asString(plan.recommendation_status),
      next_recommended_slice: asString(plan.next_recommended_slice),
      transaction_step_count: asArray(
        asRecord(plan.transaction_step_graph).ordered_steps,
      ).length,
      refusal_reason_count: asArray(plan.refusal_matrix).length,
    },
    disabled_bridge_skeleton_contract_tests: {
      suite_fingerprint: asString(contractReport.suite_fingerprint),
      total_cases: asNumber(contractReport.total_cases),
      positive_cases: asNumber(contractReport.positive_cases),
      expected_negative_cases: asNumber(contractReport.expected_negative_cases),
      unexpected_passes: asArray(contractReport.unexpected_passes).length,
      unexpected_failures: asArray(contractReport.unexpected_failures).length,
      final_status: asString(contractReport.final_status),
      recommendation_status: asString(contractReport.recommendation_status),
    },
    disabled_bridge_skeleton: {
      skeleton_fingerprint: asString(skeleton.skeleton_fingerprint),
      disabled_bridge_skeleton_status: asString(
        skeleton.disabled_bridge_skeleton_status,
      ),
      bridge_adapter_enabled: skeleton.bridge_adapter_enabled === true,
      bridge_execution_allowed_now: skeleton.bridge_execution_allowed_now === true,
      product_write_allowed_now: skeleton.product_write_allowed_now === true,
    },
    temp_to_product_bridge_design: {
      design_fingerprint: asString(bridgeDesign.design_fingerprint),
      bridge_design_status: asString(bridgeDesign.bridge_design_status),
      recommendation_status: asString(bridgeDesign.recommendation_status),
      selected_temp_claim_identity_summary: bridgeDesign.bridge_input_contract,
    },
    product_write_gate_design: {
      design_fingerprint: asString(gateDesign.design_fingerprint),
      gate_design_status: asString(gateDesign.gate_design_status),
      recommendation_status: asString(
        asRecord(gateDesign.next_stage_recommendation).recommendation_status,
      ),
      pass_count: asNumber(gateSummary.pass_count),
      warn_count: asNumber(gateSummary.warn_count),
      block_count: asNumber(gateSummary.block_count),
    },
    static_boundary: input.staticBoundaryEvidence,
  };
}

function buildAuthorityContracts(): JsonRecord[] {
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

function buildAuthorityGapSummary(): JsonRecord {
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

function authorityContractMetadata(contractId: string): {
  label: string;
  kind: string;
  requiredInputs: string[];
  requiredFutureEvidence: string[];
  forbiddenUntilSatisfied: string[];
  acceptanceCriteria: string[];
  rejectionCriteria: string[];
  observabilityRequirements: string[];
  rollbackRequirements: string[];
  idempotencyRequirements: string[];
  auditRequirements: string[];
  requiredBeforeSlice: string;
  allowedNextAction: string;
  forbiddenNow: string[];
} {
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
  const overrides: Record<string, Partial<typeof base>> = {
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

function buildAuthorityDependencyGraph(): JsonRecord {
  const orderedContractIds = [...AUTHORITY_CONTRACT_IDS];
  return {
    ordered_contract_ids: orderedContractIds,
    dependency_edges: [
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
    ].map(([from, to]) => ({
      from_contract_id: from,
      to_contract_id: to,
      dependency_kind: "must_be_reviewed_before",
    })),
    blocking_contract_ids: orderedContractIds,
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

function buildDisabledAdapterSkeletonPreparation(): JsonRecord {
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

function buildAuthorityRefusalMatrix(): JsonRecord[] {
  return AUTHORITY_REFUSAL_REASON_IDS.map((reasonId) => ({
    reason_id: reasonId,
    reason_label: reasonId.replaceAll("_", " "),
    requested_now: false,
    refusal_required_now: true,
    blocks_product_write_now: true,
    expected_status: BLOCKED_STATUS,
  }));
}

function explicitForbiddenSurfaces(): Record<
  (typeof AUTHORITY_FORBIDDEN_SURFACE_KEYS)[number],
  false
> {
  return Object.fromEntries(
    AUTHORITY_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]),
  ) as Record<(typeof AUTHORITY_FORBIDDEN_SURFACE_KEYS)[number], false>;
}

function validateFalseRecord<T extends readonly string[]>(
  value: unknown,
  keys: T,
  prefix: string,
): string[] {
  const record = asRecord(value);
  const failures: string[] = [];
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

function hasNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as JsonRecord).some(([key, nestedValue]) => {
    if ((PRODUCT_ID_KEYS as readonly string[]).includes(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "authority_contract_bundle_fingerprint")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${canonicalJson(nestedValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
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

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
