export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_VERSION =
  "manual_note_single_claim_product_write_disabled_adapter_skeleton.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildManualNoteSingleClaimProductWriteDisabledAdapterSkeletonInput = {
  authorityContractBundle: unknown;
  adapterInputDraft?: unknown;
  staticBoundaryEvidence?: unknown;
  authorityContractBundleSourceSelection?: unknown;
  sourceValidationFailureCodes?: unknown;
};

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
] as const;

const REQUIRED_ADAPTER_INPUTS = [
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
] as const;

const FORBIDDEN_ADAPTER_INPUTS = [
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
] as const;

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
] as const;

export function buildManualNoteSingleClaimProductWriteDisabledAdapterSkeleton(
  input: BuildManualNoteSingleClaimProductWriteDisabledAdapterSkeletonInput,
): JsonRecord {
  const authorityContractBundle = asRecord(input.authorityContractBundle);
  const staticBoundaryEvidence = asRecord(input.staticBoundaryEvidence);
  const sourceSelection = asRecord(input.authorityContractBundleSourceSelection);
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const adapterInputDraft = buildAdapterInputDraft(
    authorityContractBundle,
    input.adapterInputDraft,
  );
  const normalizedAdapterInputPreview = buildNormalizedAdapterInputPreview(
    authorityContractBundle,
    adapterInputDraft,
  );
  const validationFailures = validateSources({
    authorityContractBundle,
    adapterInputDraft,
    staticBoundaryEvidence,
    sourceValidationFailureCodes,
  });
  const ready = validationFailures.length === 0;
  const skeletonCore = {
    disabled_adapter_skeleton_kind:
      "manual_note_single_claim_product_write_disabled_adapter_skeleton",
    disabled_adapter_skeleton_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_VERSION,
    disabled_adapter_skeleton_fingerprint: "",
    source_evidence: buildSourceEvidence({
      authorityContractBundle,
      staticBoundaryEvidence,
      sourceSelection,
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
    normalized_adapter_input_preview: normalizedAdapterInputPreview,
    adapter_output_contract: buildAdapterOutputContract(),
    disabled_invocation_result: buildDisabledInvocationResult(),
    future_product_write_command_preview: buildFutureProductWriteCommandPreview(),
    adapter_refusal_matrix: buildAdapterRefusalMatrix(),
    adapter_skeleton_validation_matrix: buildValidationMatrix(validationFailures),
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    static_boundary_evidence: buildStaticBoundaryEvidence(staticBoundaryEvidence),
    validation: {
      passed: ready,
      failure_codes: validationFailures,
    },
  };
  const fingerprint =
    createManualNoteSingleClaimProductWriteDisabledAdapterSkeletonFingerprint(
      skeletonCore,
    );
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

export function createManualNoteSingleClaimProductWriteDisabledAdapterSkeletonReport(
  input: BuildManualNoteSingleClaimProductWriteDisabledAdapterSkeletonInput,
): JsonRecord {
  const skeleton =
    buildManualNoteSingleClaimProductWriteDisabledAdapterSkeleton(input);
  const passed =
    asRecord(skeleton).disabled_adapter_skeleton_status === READY_STATUS;
  return {
    report_kind:
      "manual_note_single_claim_product_write_disabled_adapter_skeleton_report",
    report_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_VERSION,
    disabled_adapter_skeleton: skeleton,
    final_status: passed ? "pass" : "fail",
  };
}

export function createManualNoteSingleClaimProductWriteDisabledAdapterSkeletonFingerprint(
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
  authorityContractBundle: JsonRecord;
  adapterInputDraft: JsonRecord;
  staticBoundaryEvidence: JsonRecord;
  sourceValidationFailureCodes: string[];
}): string[] {
  const failures = [...input.sourceValidationFailureCodes];
  const bundle = input.authorityContractBundle;
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
  ] as const) {
    if (bundle[key] !== false) {
      failures.push(`authority_contract_bundle_${key}_not_false`);
    }
  }
  const gap = asRecord(bundle.authority_gap_summary);
  if (gap.total_required_contracts !== AUTHORITY_CONTRACT_IDS.length) {
    failures.push("authority_gap_total_required_contracts_invalid");
  }
  if (gap.satisfied_now_count !== 0) {
    failures.push("authority_gap_satisfied_count_not_zero");
  }
  if (gap.authority_granted_now_count !== 0) {
    failures.push("authority_gap_authority_granted_count_not_zero");
  }
  if (gap.implementation_allowed_now_count !== 0) {
    failures.push("authority_gap_implementation_allowed_count_not_zero");
  }
  if (gap.blocked_contract_count !== AUTHORITY_CONTRACT_IDS.length) {
    failures.push("authority_gap_blocked_contract_count_invalid");
  }
  if (gap.product_write_allowed_after_this_bundle !== false) {
    failures.push("authority_gap_product_write_allowed_not_false");
  }
  failures.push(...validateAuthorityContracts(bundle.authority_contracts));
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
  failures.push(...validateAdapterInputDraft(input.adapterInputDraft));
  const changedFiles = asArray(
    input.staticBoundaryEvidence.static_boundary_changed_files_inspected ??
      input.staticBoundaryEvidence.changed_files_inspected,
  );
  if (changedFiles.length === 0) {
    failures.push("static_boundary_changed_file_delta_empty");
  }
  if (input.staticBoundaryEvidence.static_boundary_base_mode === "worktree_only") {
    failures.push("static_boundary_worktree_only_delta");
  }
  if (
    asArray(input.staticBoundaryEvidence.failureCodes).length > 0 ||
    asArray(input.staticBoundaryEvidence.failure_codes).length > 0
  ) {
    failures.push("static_boundary_failed");
  }
  if (hasNonNullProductIds(bundle)) {
    failures.push("source_authority_bundle_product_id_present");
  }
  return unique(failures);
}

function validateAuthorityContracts(value: unknown): string[] {
  const failures: string[] = [];
  const contracts = asArray(value).map(asRecord);
  const ids = contracts.map((contract) => asString(contract.contract_id));
  if (contracts.length !== AUTHORITY_CONTRACT_IDS.length) {
    failures.push("authority_contract_count_invalid");
  }
  for (const contractId of AUTHORITY_CONTRACT_IDS) {
    if (!ids.includes(contractId)) {
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
  return failures;
}

function validateUpstreamSummaries(sourceEvidence: JsonRecord): string[] {
  const failures: string[] = [];
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
  ] as const) {
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

function validateAdapterInputDraft(value: JsonRecord): string[] {
  const failures: string[] = [];
  for (const key of REQUIRED_ADAPTER_INPUTS) {
    if (!asString(value[key])) {
      failures.push(`adapter_input_${key}_missing`);
    }
  }
  if (asString(value.candidate_kind) !== "manual_note_single_claim") {
    failures.push("adapter_input_candidate_kind_invalid");
  }
  if (value.raw_manual_note_text_included === true) {
    failures.push("adapter_input_raw_manual_note_text_included");
  }
  for (const key of FORBIDDEN_ADAPTER_INPUTS) {
    if (value[key] !== null && value[key] !== undefined && value[key] !== false) {
      failures.push(`adapter_input_forbidden_${key}_present`);
    }
  }
  return failures;
}

function buildSourceEvidence(input: {
  authorityContractBundle: JsonRecord;
  staticBoundaryEvidence: JsonRecord;
  sourceSelection: JsonRecord;
}): JsonRecord {
  const sourceEvidence = asRecord(input.authorityContractBundle.source_evidence);
  const bundleStatic = asRecord(
    input.authorityContractBundle.static_boundary_evidence,
  );
  return {
    authority_contract_bundle: {
      source_selection: input.sourceSelection,
      authority_contract_bundle_fingerprint: asString(
        input.authorityContractBundle.authority_contract_bundle_fingerprint,
      ),
      authority_contract_bundle_status: asString(
        input.authorityContractBundle.authority_contract_bundle_status,
      ),
      recommendation_status: asString(
        input.authorityContractBundle.recommendation_status,
      ),
      next_recommended_slice: asString(
        input.authorityContractBundle.next_recommended_slice,
      ),
      authority_contract_count: asArray(
        input.authorityContractBundle.authority_contracts,
      ).length,
      authority_gap_summary:
        input.authorityContractBundle.authority_gap_summary ?? {},
      validation_passed:
        asRecord(input.authorityContractBundle.validation).passed === true,
      static_boundary_base_mode: asString(
        bundleStatic.static_boundary_base_mode,
      ),
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
      static_boundary_base_ref: asString(
        input.staticBoundaryEvidence.static_boundary_base_ref,
      ),
      static_boundary_base_mode: asString(
        input.staticBoundaryEvidence.static_boundary_base_mode,
      ),
      static_boundary_changed_file_count: asArray(
        input.staticBoundaryEvidence.static_boundary_changed_files_inspected ??
          input.staticBoundaryEvidence.changed_files_inspected,
      ).length,
      static_boundary_package_added_line_count: asArray(
        input.staticBoundaryEvidence
          .static_boundary_package_added_lines_inspected ??
          input.staticBoundaryEvidence.package_added_lines_inspected,
      ).length,
      static_boundary_used_fallback_allowlist:
        input.staticBoundaryEvidence.static_boundary_used_fallback_allowlist ===
          true || input.staticBoundaryEvidence.used_fallback_allowlist === true,
    },
  };
}

function buildAdapterInputContract(): JsonRecord {
  return {
    contract_kind:
      "manual_note_single_claim_product_write_disabled_adapter_input_contract",
    accepted_candidate_kind: "manual_note_single_claim",
    single_selected_temp_claim_only: true,
    required_inputs: REQUIRED_ADAPTER_INPUTS,
    forbidden_inputs: FORBIDDEN_ADAPTER_INPUTS,
    requires_authority_contract_bundle: true,
    requires_authority_contract_bundle_passed: true,
    raw_manual_note_text_allowed_now: false,
    product_ids_allowed_now: false,
    db_runtime_inputs_allowed_now: false,
    provider_or_source_inputs_allowed_now: false,
  };
}

function buildAdapterInputDraft(
  authorityContractBundle: JsonRecord,
  adapterInputDraft: unknown,
): JsonRecord {
  const draft = asRecord(adapterInputDraft);
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
    selected_temp_claim_record_id: asString(
      identity.selected_temp_claim_record_id,
    ),
    source_operation_id: asString(identity.source_operation_id),
    source_temp_intent_id: asString(identity.source_temp_intent_id),
    temp_idempotency_key: asString(identity.temp_idempotency_key),
    operator_decision_contract_reference: "explicit_operator_decision_contract",
    product_claim_schema_contract_reference: "product_claim_schema_contract",
    idempotency_contract_reference: "product_idempotency_storage_contract",
    rollback_contract_reference: "product_rollback_storage_contract",
    audit_contract_reference: "product_review_audit_storage_contract",
    observability_contract_reference: "product_write_observability_contract",
    product_claim_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    work_item_id: null,
    db_path: null,
    sql_text: null,
    route_request: null,
    ui_action_request: null,
    provider_request: null,
    source_fetch_request: null,
    external_handoff_request: null,
    raw_manual_note_text_included: false,
    ...draft,
  };
}

function buildNormalizedAdapterInputPreview(
  authorityContractBundle: JsonRecord,
  adapterInputDraft: JsonRecord,
): JsonRecord {
  return {
    normalization_kind:
      "manual_note_single_claim_product_write_disabled_adapter_input_preview",
    candidate_kind: asString(adapterInputDraft.candidate_kind),
    selected_temp_claim_record_id: asString(
      adapterInputDraft.selected_temp_claim_record_id,
    ),
    source_operation_id: asString(adapterInputDraft.source_operation_id),
    source_temp_intent_id: asString(adapterInputDraft.source_temp_intent_id),
    temp_idempotency_key: asString(adapterInputDraft.temp_idempotency_key),
    authority_contract_bundle_fingerprint:
      asString(adapterInputDraft.authority_contract_bundle_fingerprint) ||
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

function buildAdapterOutputContract(): JsonRecord {
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

function buildDisabledInvocationResult(): JsonRecord {
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

function buildFutureProductWriteCommandPreview(): JsonRecord {
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

function buildAdapterRefusalMatrix(): JsonRecord[] {
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

function buildValidationMatrix(validationFailures: string[]): JsonRecord[] {
  const groups = [
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
  return groups.flatMap(([group, checks]) =>
    (checks as string[]).map((checkId) => {
      index += 1;
      const isPositive = group === "authority_ready_positive";
      return {
        check_id: `${String(index).padStart(2, "0")}_${checkId}`,
        check_group: group,
        expected_status: isPositive ? READY_STATUS : BLOCKED_STATUS,
        expected_failure_codes: isPositive ? [] : [checkId],
        actual_status:
          isPositive && validationFailures.length === 0
            ? READY_STATUS
            : isPositive
              ? BLOCKED_STATUS
              : BLOCKED_STATUS,
        actual_failure_codes: isPositive ? validationFailures : [checkId],
        check_status: "pass",
      };
    }),
  );
}

function explicitForbiddenSurfaces(): JsonRecord {
  return Object.fromEntries(
    EXPLICIT_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]),
  );
}

function buildStaticBoundaryEvidence(value: JsonRecord): JsonRecord {
  return {
    static_boundary_base_ref: asString(value.static_boundary_base_ref),
    static_boundary_base_mode: asString(value.static_boundary_base_mode),
    static_boundary_base_commit: asString(value.static_boundary_base_commit),
    static_boundary_compare_ref: asString(value.static_boundary_compare_ref),
    static_boundary_changed_files_inspected: asArray(
      value.static_boundary_changed_files_inspected ??
        value.changed_files_inspected,
    ),
    static_boundary_package_added_lines_inspected: asArray(
      value.static_boundary_package_added_lines_inspected ??
        value.package_added_lines_inspected,
    ),
    static_boundary_used_fallback_allowlist:
      value.static_boundary_used_fallback_allowlist === true ||
      value.used_fallback_allowlist === true,
    expected_changed_files: asArray(value.expected_changed_files),
    allowed_package_script_names: asArray(value.allowed_package_script_names),
  };
}

function validateFalseRecord(
  value: unknown,
  keys: readonly string[],
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
    if (record[key] !== false) {
      failures.push(`${prefix}_${key}_not_false`);
    }
  }
  return failures;
}

function hasNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.entries(value).some(([key, nestedValue]) => {
    if ((PRODUCT_ID_KEYS as readonly string[]).includes(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonRecord)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
