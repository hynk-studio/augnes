export const MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_VERSION =
  "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanInput =
  {
    contractTestsReport: unknown;
    disabledBridgeSkeleton: unknown;
    tempToProductBridgeDesign: unknown;
    productWriteGateDesign: unknown;
    staticBoundaryEvidence?: unknown;
  };

const CONTRACT_SUITE_STATUS =
  "disabled_bridge_skeleton_contract_tests_passed";
const CONTRACT_SUITE_RECOMMENDATION =
  "ready_for_disabled_bridge_dry_run_transaction_plan";
const THIS_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan";
const READY_FOR_HARNESS =
  "ready_for_disabled_dry_run_transaction_harness";
const BLOCKED_BEFORE_HARNESS =
  "blocked_before_disabled_dry_run_transaction_harness";
const NEXT_HARNESS =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness";
const RECHECK_SLICE =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_recheck";

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

const PLAN_FORBIDDEN_SURFACE_KEYS = [
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

const REQUIRED_REFUSAL_REASONS = [
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
] as const;

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
] as const;

export function buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlan(
  input: BuildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanInput,
): JsonRecord {
  const contractTestsReport = asRecord(input.contractTestsReport);
  const skeleton = asRecord(input.disabledBridgeSkeleton);
  const bridgeDesign = asRecord(input.tempToProductBridgeDesign);
  const gateDesign = asRecord(input.productWriteGateDesign);
  const validationFailures = validateSources({
    contractTestsReport,
    skeleton,
    bridgeDesign,
    gateDesign,
  });
  const ready = validationFailures.length === 0;
  const planCore = {
    dry_run_transaction_plan_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan",
    dry_run_transaction_plan_version:
      MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_VERSION,
    dry_run_transaction_plan_fingerprint: "",
    source_evidence: buildSourceEvidence({
      contractTestsReport,
      skeleton,
      bridgeDesign,
      gateDesign,
    }),
    dry_run_transaction_plan_status: ready
      ? "disabled_dry_run_transaction_plan_only"
      : "blocked_before_disabled_dry_run_transaction_plan",
    recommendation_status: ready ? READY_FOR_HARNESS : BLOCKED_BEFORE_HARNESS,
    next_recommended_slice: ready ? NEXT_HARNESS : RECHECK_SLICE,
    dry_run_execution_allowed_now: false,
    bridge_execution_allowed_now: false,
    product_write_allowed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    adapter_enabled: false,
    transaction_step_graph: buildTransactionStepGraph(),
    refusal_matrix: buildRefusalMatrix(),
    dry_run_idempotency_envelope: buildIdempotencyEnvelope(bridgeDesign),
    dry_run_rollback_envelope: buildRollbackEnvelope(),
    dry_run_audit_envelope: buildAuditEnvelope(),
    dry_run_observability_envelope: buildObservabilityEnvelope(),
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    static_boundary_evidence: asRecord(input.staticBoundaryEvidence),
    validation: {
      passed: ready,
      failure_codes: validationFailures,
    },
  };
  const fingerprint =
    createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanFingerprint(
      planCore,
    );
  return {
    ...planCore,
    dry_run_transaction_plan_fingerprint: fingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Disabled Bridge Dry-Run Transaction Plan",
        "",
        "Disabled dry-run transaction plan only.",
        "No product write, adapter enablement, product ID allocation, DB open, or SQL execution is allowed.",
        `dry_run_transaction_plan_status: ${planCore.dry_run_transaction_plan_status}`,
        `dry_run_transaction_plan_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          dry_run_transaction_plan_status:
            planCore.dry_run_transaction_plan_status,
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

export function createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanReport(
  input: BuildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanInput,
): JsonRecord {
  const plan =
    buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlan(
      input,
    );
  const passed =
    asRecord(plan).dry_run_transaction_plan_status ===
    "disabled_dry_run_transaction_plan_only";
  return {
    report_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_report",
    report_version:
      MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_VERSION,
    dry_run_transaction_plan: plan,
    final_status: passed ? "pass" : "fail",
  };
}

export function createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanFingerprint(
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
  contractTestsReport: JsonRecord;
  skeleton: JsonRecord;
  bridgeDesign: JsonRecord;
  gateDesign: JsonRecord;
}): string[] {
  const failures: string[] = [];
  if (input.contractTestsReport.final_status !== "pass") {
    failures.push("contract_tests_report_not_passed");
  }
  if (input.contractTestsReport.contract_suite_status !== CONTRACT_SUITE_STATUS) {
    failures.push("contract_suite_status_not_ready");
  }
  if (input.contractTestsReport.recommendation_status !== CONTRACT_SUITE_RECOMMENDATION) {
    failures.push("contract_suite_recommendation_not_ready");
  }
  if (input.contractTestsReport.next_recommended_slice !== THIS_SLICE) {
    failures.push("contract_suite_next_slice_invalid");
  }
  if (
    input.skeleton.disabled_bridge_skeleton_status !==
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
    if (input.skeleton[key] !== false) failures.push(`${key}_not_false`);
  }
  if (
    input.bridgeDesign.bridge_design_status !== "single_claim_bridge_design_only" ||
    input.bridgeDesign.recommendation_status !==
      "ready_for_disabled_bridge_skeleton" ||
    input.bridgeDesign.next_recommended_slice !==
      "single_claim_temp_to_product_disabled_bridge_skeleton"
  ) {
    failures.push("source_bridge_design_not_ready");
  }
  const gateRecommendation = asRecord(
    input.gateDesign.next_stage_recommendation,
  );
  if (
    input.gateDesign.gate_design_status !== "product_write_gate_design_only" ||
    gateRecommendation.recommendation_status !==
      "ready_for_single_claim_bridge_design"
  ) {
    failures.push("product_write_gate_design_not_ready");
  }
  if (input.gateDesign.gate_design_status !== "product_write_gate_design_only") {
    failures.push("product_write_gate_design_status_invalid");
  }
  if (
    gateRecommendation.recommendation_status !==
    "ready_for_single_claim_bridge_design"
  ) {
    failures.push("product_write_gate_design_recommendation_not_ready");
  }
  failures.push(
    ...validateFalseRecord(
      asRecord(input.bridgeDesign.explicit_forbidden_surfaces),
      SOURCE_FORBIDDEN_SURFACE_KEYS,
      "source_bridge_forbidden_surface",
    ),
    ...validateFalseRecord(
      asRecord(input.skeleton.explicit_forbidden_surfaces),
      SKELETON_FORBIDDEN_SURFACE_KEYS,
      "skeleton_forbidden_surface",
    ),
  );
  if (hasNonNullProductIds(input.bridgeDesign)) {
    failures.push("source_bridge_product_id_present");
  }
  if (hasNonNullProductIds(input.skeleton)) {
    failures.push("skeleton_product_id_present");
  }
  return unique(failures);
}

function buildSourceEvidence(input: {
  contractTestsReport: JsonRecord;
  skeleton: JsonRecord;
  bridgeDesign: JsonRecord;
  gateDesign: JsonRecord;
}): JsonRecord {
  const contractReport = input.contractTestsReport;
  const skeleton = input.skeleton;
  const bridgeDesign = input.bridgeDesign;
  const gateDesign = input.gateDesign;
  const gateSummary = asRecord(gateDesign.gate_summary);
  return {
    contract_tests: {
      suite_fingerprint: asString(contractReport.suite_fingerprint),
      total_cases: asNumber(contractReport.total_cases),
      positive_cases: asNumber(contractReport.positive_cases),
      expected_negative_cases: asNumber(contractReport.expected_negative_cases),
      unexpected_passes: asArray(contractReport.unexpected_passes).length,
      unexpected_failures: asArray(contractReport.unexpected_failures).length,
      final_status: asString(contractReport.final_status),
      contract_suite_status: asString(contractReport.contract_suite_status),
      recommendation_status: asString(contractReport.recommendation_status),
      next_recommended_slice: asString(contractReport.next_recommended_slice),
      static_boundary_base_mode: asString(
        contractReport.static_boundary_base_mode,
      ),
      static_boundary_changed_file_count: asArray(
        contractReport.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_used_fallback_allowlist:
        contractReport.static_boundary_used_fallback_allowlist === true,
    },
    disabled_bridge_skeleton: {
      skeleton_fingerprint: asString(skeleton.skeleton_fingerprint),
      disabled_bridge_skeleton_status: asString(
        skeleton.disabled_bridge_skeleton_status,
      ),
      bridge_adapter_enabled: skeleton.bridge_adapter_enabled === true,
      bridge_execution_allowed_now:
        skeleton.bridge_execution_allowed_now === true,
      product_write_allowed_now: skeleton.product_write_allowed_now === true,
      disabled_adapter_boundary_summary: {
        adapter_enabled:
          asRecord(skeleton.disabled_adapter_boundary).adapter_enabled === true,
        adapter_invocation_allowed_now:
          asRecord(skeleton.disabled_adapter_boundary)
            .adapter_invocation_allowed_now === true,
      },
      future_product_write_intent_summary: skeleton.future_product_write_intent,
      placeholder_record_mapping_summary: skeleton.placeholder_record_mapping,
      explicit_forbidden_surfaces: skeleton.explicit_forbidden_surfaces,
    },
    temp_to_product_bridge_design: {
      design_fingerprint: asString(bridgeDesign.design_fingerprint),
      bridge_design_status: asString(bridgeDesign.bridge_design_status),
      recommendation_status: asString(bridgeDesign.recommendation_status),
      next_recommended_slice: asString(bridgeDesign.next_recommended_slice),
      selected_temp_claim_identity_summary: bridgeDesign.bridge_input_contract,
      explicit_forbidden_surfaces: bridgeDesign.explicit_forbidden_surfaces,
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
  };
}

function buildTransactionStepGraph(): JsonRecord {
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

function requiredContractForStepGroup(stepGroup: string): string {
  const map: Record<string, string> = {
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

function buildRefusalMatrix(): JsonRecord[] {
  return REQUIRED_REFUSAL_REASONS.map((reasonId) => ({
    reason_id: reasonId,
    reason_label: reasonId.replaceAll("_", " "),
    requested_now: false,
    refusal_required_now: true,
    blocks_harness_until_contract: true,
  }));
}

function buildIdempotencyEnvelope(bridgeDesign: JsonRecord): JsonRecord {
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

function buildRollbackEnvelope(): JsonRecord {
  return {
    strategy_preview: "future_product_claim_rollback_by_idempotency_key",
    product_claim_id: null,
    product_rollback_record_id: null,
    rollback_write_executed_now: false,
    rollback_execution_allowed_now: false,
  };
}

function buildAuditEnvelope(): JsonRecord {
  return {
    audit_preview: "future_operator_decision_and_bridge_inputs_audit_record",
    product_claim_id: null,
    product_audit_record_id: null,
    audit_write_executed_now: false,
  };
}

function buildObservabilityEnvelope(): JsonRecord {
  return {
    observability_preview: "future_disabled_bridge_dry_run_metric_record",
    product_claim_id: null,
    product_observability_record_id: null,
    observability_write_executed_now: false,
  };
}

function explicitForbiddenSurfaces(): Record<
  (typeof PLAN_FORBIDDEN_SURFACE_KEYS)[number],
  false
> {
  return Object.fromEntries(
    PLAN_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]),
  ) as Record<(typeof PLAN_FORBIDDEN_SURFACE_KEYS)[number], false>;
}

function validateFalseRecord<T extends readonly string[]>(
  record: JsonRecord,
  keys: T,
  prefix: string,
): string[] {
  return keys
    .filter((key) => record[key] !== false)
    .map((key) => `${prefix}_${key}_not_false`);
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
    const entries = Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "dry_run_transaction_plan_fingerprint")
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
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
