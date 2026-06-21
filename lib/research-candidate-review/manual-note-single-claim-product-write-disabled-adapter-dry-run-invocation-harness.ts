export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_DRY_RUN_INVOCATION_HARNESS_VERSION =
  "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_harness.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type InvokeInput = {
  disabledAdapterSkeleton: unknown;
  disabledAdapterContractTestsReport: unknown;
  adapterInvocationInput?: unknown;
  staticBoundaryEvidence?: unknown;
  sourceValidationFailureCodes?: unknown;
};

const READY_HARNESS_STATUS =
  "product_write_disabled_adapter_dry_run_invocation_harness_only";
const BLOCKED_HARNESS_STATUS =
  "blocked_before_product_write_disabled_adapter_dry_run_invocation_harness";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_noop_invocation_report";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_disabled_adapter_noop_invocation_report";
const NEXT_NOOP_REPORT =
  "single_claim_product_write_disabled_adapter_noop_invocation_report";
const RECHECK_SLICE =
  "single_claim_product_write_disabled_adapter_dry_run_invocation_harness_recheck";

const REQUIRED_TRACE_GROUPS = [
  "source_evidence_preflight",
  "contract_suite_preflight",
  "disabled_adapter_preflight",
  "invocation_input_normalization",
  "forbidden_input_scan",
  "authority_denial_check",
  "adapter_disabled_check",
  "future_command_preview_check",
  "refusal_resolution",
  "no_write_postconditions",
  "static_boundary_preflight",
] as const;

const REQUIRED_REFUSAL_REASONS = [
  "adapter_disabled",
  "product_write_authority_not_granted",
  "authority_contracts_defined_but_not_satisfied",
  "product_write_implementation_not_allowed",
  "runtime_invocation_not_allowed",
] as const;

const REQUIRED_INPUT_FIELDS = [
  "authority_contract_bundle_fingerprint",
  "disabled_adapter_skeleton_fingerprint",
  "contract_suite_fingerprint",
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

const FORBIDDEN_INPUT_FIELDS = [
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
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "product_write_authority_granted",
  "product_write_implementation",
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
  "adapter_runtime_invocation",
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
  "output_product_claim_id",
  "output_proof_id",
  "output_evidence_id",
  "output_perspective_id",
  "output_work_item_id",
] as const;

export function invokeManualNoteSingleClaimProductWriteDisabledAdapterDryRun(
  input: InvokeInput,
): JsonRecord {
  const skeleton = asRecord(input.disabledAdapterSkeleton);
  const contractTests = asRecord(input.disabledAdapterContractTestsReport);
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const staticBoundaryEvidence = normalizeStaticBoundaryEvidence(
    input.staticBoundaryEvidence,
  );
  const dryRunInvocationInput = buildDryRunInvocationInput({
    skeleton,
    contractTests,
    providedInput: input.adapterInvocationInput,
  });
  const normalizedInvocationInput = normalizeInvocationInput(
    dryRunInvocationInput,
  );
  const sourceEvidence = buildSourceEvidence({ skeleton, contractTests });
  const validationFailureCodes = unique([
    ...sourceValidationFailureCodes,
    ...validateContractTestsReport(contractTests),
    ...validateSkeleton(skeleton),
    ...validateHarnessSourceEvidence(sourceEvidence),
    ...validateInvocationInput(dryRunInvocationInput),
    ...validateInvocationInputReferences(dryRunInvocationInput, sourceEvidence),
    ...validateStaticBoundaryEvidence(staticBoundaryEvidence),
  ]);
  const ready = validationFailureCodes.length === 0;
  const core = {
    dry_run_invocation_harness_kind:
      "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_harness",
    dry_run_invocation_harness_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_DRY_RUN_INVOCATION_HARNESS_VERSION,
    dry_run_invocation_harness_fingerprint: "",
    source_evidence: sourceEvidence,
    dry_run_invocation_harness_status: ready
      ? READY_HARNESS_STATUS
      : BLOCKED_HARNESS_STATUS,
    adapter_kind: "manual_note_single_claim_product_write_disabled_adapter",
    adapter_enabled: false,
    adapter_invocation_allowed_now: false,
    adapter_invocation_attempted_now: true,
    adapter_invocation_executed_against_runtime: false,
    product_write_attempted_now: false,
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
    dry_run_invocation_input: dryRunInvocationInput,
    normalized_invocation_input: normalizedInvocationInput,
    invocation_trace: buildInvocationTrace(),
    disabled_invocation_result: buildDisabledInvocationResult(),
    dry_noop_preview: buildDryNoopPreview(skeleton),
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    static_boundary_evidence: staticBoundaryEvidence,
    validation: {
      passed: ready,
      failure_codes: validationFailureCodes,
    },
    recommendation_status: ready ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: ready ? NEXT_NOOP_REPORT : RECHECK_SLICE,
  };
  const probes = buildInvocationProbeResults(core);
  const withProbes = {
    ...core,
    invocation_probes: probes,
  };
  const fingerprint =
    createManualNoteSingleClaimProductWriteDisabledAdapterDryRunInvocationHarnessFingerprint(
      withProbes,
    );
  return {
    ...withProbes,
    dry_run_invocation_harness_fingerprint: fingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Product Write Disabled Adapter Dry-Run Invocation Harness",
        "",
        "Pure in-memory disabled dry-run invocation only.",
        "No runtime adapter invocation, DB access, SQL, product IDs, or product write is performed.",
        `dry_run_invocation_harness_status: ${core.dry_run_invocation_harness_status}`,
        `dry_run_invocation_harness_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          dry_run_invocation_harness_status:
            core.dry_run_invocation_harness_status,
          adapter_invocation_attempted_now: true,
          adapter_invocation_executed_against_runtime: false,
          product_write_attempted_now: false,
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
      adapter_invocation_executed_against_runtime: false,
      product_write_allowed_now: false,
    },
  };
}

export function validateManualNoteSingleClaimProductWriteDisabledAdapterDryRunInvocationHarness(
  value: unknown,
): string[] {
  const harness = asRecord(value);
  const failures: string[] = [];
  if (harness.dry_run_invocation_harness_status !== READY_HARNESS_STATUS) {
    failures.push("dry_run_invocation_harness_status_not_ready");
  }
  for (const [key, expected] of [
    ["adapter_enabled", false],
    ["adapter_invocation_allowed_now", false],
    ["adapter_invocation_attempted_now", true],
    ["adapter_invocation_executed_against_runtime", false],
    ["product_write_attempted_now", false],
    ["product_write_allowed_now", false],
    ["product_write_authority_granted_now", false],
    ["product_write_implementation_allowed_now", false],
    ["transaction_execution_allowed_now", false],
    ["product_db_write", false],
    ["product_id_allocation", false],
    ["db_open", false],
    ["sql_execution", false],
    ["route_added", false],
    ["ui_write_action_added", false],
  ] as const) {
    if (harness[key] !== expected) failures.push(`${key}_invalid`);
  }
  failures.push(...validateInvocationInput(harness.dry_run_invocation_input));
  failures.push(
    ...validateInvocationInputReferences(
      harness.dry_run_invocation_input,
      harness.source_evidence,
    ),
  );
  failures.push(
    ...validateNormalizedInvocationInput(harness.normalized_invocation_input),
  );
  failures.push(...validateHarnessSourceEvidence(asRecord(harness.source_evidence)));
  failures.push(...validateInvocationTrace(harness.invocation_trace));
  failures.push(
    ...validateDisabledInvocationResult(harness.disabled_invocation_result),
  );
  failures.push(...validateDryNoopPreview(harness.dry_noop_preview));
  failures.push(
    ...validateFalseRecord(
      harness.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS,
      "explicit_forbidden_surface",
    ),
  );
  failures.push(...validateStaticBoundaryEvidence(harness.static_boundary_evidence));
  if (hasNonNullProductIds(harness)) {
    failures.push("non_null_product_or_related_id_present");
  }
  return unique(failures);
}

export function createManualNoteSingleClaimProductWriteDisabledAdapterDryRunInvocationHarnessFingerprint(
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

function buildDryRunInvocationInput({
  skeleton,
  contractTests,
  providedInput,
}: {
  skeleton: JsonRecord;
  contractTests: JsonRecord;
  providedInput?: unknown;
}): JsonRecord {
  const provided = asRecord(providedInput);
  const normalizedPreview = asRecord(skeleton.normalized_adapter_input_preview);
  const sourceEvidence = asRecord(skeleton.source_evidence);
  const authorityBundle = asRecord(sourceEvidence.authority_contract_bundle);
  const defaultInput = {
    input_kind:
      "manual_note_single_claim_product_write_disabled_adapter_dry_run_input",
    candidate_kind: "manual_note_single_claim",
    authority_contract_bundle_fingerprint: asString(
      authorityBundle.authority_contract_bundle_fingerprint,
    ),
    disabled_adapter_skeleton_fingerprint: asString(
      skeleton.disabled_adapter_skeleton_fingerprint,
    ),
    contract_suite_fingerprint: asString(contractTests.suite_fingerprint),
    selected_temp_claim_record_id: asString(
      normalizedPreview.selected_temp_claim_record_id,
    ),
    source_operation_id: asString(normalizedPreview.source_operation_id),
    source_temp_intent_id: asString(normalizedPreview.source_temp_intent_id),
    temp_idempotency_key: asString(normalizedPreview.temp_idempotency_key),
    operator_decision_contract_reference:
      "explicit_operator_decision_contract:blocked",
    product_claim_schema_contract_reference:
      "product_claim_schema_contract:defined_only",
    idempotency_contract_reference:
      "product_idempotency_storage_contract:defined_only",
    rollback_contract_reference: "product_rollback_storage_contract:defined_only",
    audit_contract_reference:
      "product_review_audit_storage_contract:defined_only",
    observability_contract_reference:
      "product_write_observability_contract:defined_only",
    product_claim_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    work_item_id: null,
    raw_manual_note_text_included: false,
    db_path: null,
    sql_text: null,
    route_request: null,
    ui_action_request: null,
    provider_request: null,
    source_fetch_request: null,
    external_handoff_request: null,
  };
  return { ...defaultInput, ...provided };
}

function normalizeInvocationInput(value: JsonRecord): JsonRecord {
  return {
    ...value,
    normalized_by:
      "manual_note_single_claim_product_write_disabled_adapter_dry_run_harness",
    normalization_executed_now: true,
    normalization_persisted_now: false,
    normalization_storage_target: "local_artifact_only",
    normalized_product_claim_id: null,
    normalized_proof_id: null,
    normalized_evidence_id: null,
    normalized_perspective_id: null,
    normalized_work_item_id: null,
    normalized_raw_manual_note_text_included: false,
  };
}

function buildSourceEvidence({
  skeleton,
  contractTests,
}: {
  skeleton: JsonRecord;
  contractTests: JsonRecord;
}): JsonRecord {
  const skeletonSource = asRecord(skeleton.source_evidence);
  const authorityBundle = asRecord(skeletonSource.authority_contract_bundle);
  const dryRunHarness = asRecord(skeletonSource.dry_run_transaction_harness);
  const dryRunPlan = asRecord(skeletonSource.dry_run_transaction_plan);
  const productWriteGateDesign = asRecord(skeletonSource.product_write_gate_design);
  const futureCommand = asRecord(skeleton.future_product_write_command_preview);
  return {
    disabled_adapter_contract_tests: {
      suite_fingerprint: asString(contractTests.suite_fingerprint),
      contract_suite_status: asString(contractTests.contract_suite_status),
      final_status: asString(contractTests.final_status),
      total_cases: asNumber(contractTests.total_cases),
      positive_cases: asNumber(contractTests.positive_cases),
      expected_negative_cases: asNumber(contractTests.expected_negative_cases),
      unexpected_passes_count: asArray(contractTests.unexpected_passes).length,
      unexpected_failures_count: asArray(contractTests.unexpected_failures).length,
      recommendation_status: asString(contractTests.recommendation_status),
      next_recommended_slice: asString(contractTests.next_recommended_slice),
      static_boundary_base_mode: asString(contractTests.static_boundary_base_mode),
      static_boundary_changed_file_count: asArray(
        contractTests.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_fallback_flag:
        contractTests.static_boundary_used_fallback_allowlist === true,
    },
    disabled_adapter_skeleton: {
      disabled_adapter_skeleton_fingerprint: asString(
        skeleton.disabled_adapter_skeleton_fingerprint,
      ),
      disabled_adapter_skeleton_status: asString(
        skeleton.disabled_adapter_skeleton_status,
      ),
      recommendation_status: asString(skeleton.recommendation_status),
      next_recommended_slice: asString(skeleton.next_recommended_slice),
      adapter_kind: asString(skeleton.adapter_kind),
      adapter_enabled: skeleton.adapter_enabled === true,
      adapter_invocation_allowed_now:
        skeleton.adapter_invocation_allowed_now === true,
      product_write_allowed_now: skeleton.product_write_allowed_now === true,
      product_write_authority_granted_now:
        skeleton.product_write_authority_granted_now === true,
      product_write_implementation_allowed_now:
        skeleton.product_write_implementation_allowed_now === true,
      transaction_execution_allowed_now:
        skeleton.transaction_execution_allowed_now === true,
      future_command_preview_summary: {
        executable_now: futureCommand.executable_now === true,
        write_operation_count: asNumber(futureCommand.write_operation_count),
        sql_statement_count: asNumber(futureCommand.sql_statement_count),
        rejection_reason: asString(futureCommand.rejection_reason),
      },
      refusal_matrix_count: asArray(skeleton.adapter_refusal_matrix).length,
    },
    authority_contract_bundle: {
      authority_contract_bundle_fingerprint: asString(
        authorityBundle.authority_contract_bundle_fingerprint,
      ),
      authority_contract_bundle_status: asString(
        authorityBundle.authority_contract_bundle_status,
      ),
      authority_contract_count: asNumber(authorityBundle.authority_contract_count),
      authority_gap_summary: authorityBundle.authority_gap_summary ?? {},
    },
    dry_run_transaction_harness: {
      harness_fingerprint: asString(dryRunHarness.harness_fingerprint),
      dry_run_transaction_harness_status: asString(
        dryRunHarness.dry_run_transaction_harness_status,
      ),
      trace_row_count: asNumber(dryRunHarness.trace_row_count),
      refusal_probe_count: asNumber(dryRunHarness.refusal_probe_count),
    },
    dry_run_transaction_plan: {
      plan_fingerprint: asString(dryRunPlan.plan_fingerprint),
      dry_run_transaction_plan_status: asString(
        dryRunPlan.dry_run_transaction_plan_status,
      ),
      transaction_step_count: asNumber(dryRunPlan.transaction_step_count),
    },
    product_write_gate_design: {
      design_fingerprint: asString(productWriteGateDesign.design_fingerprint),
      gate_design_status: asString(productWriteGateDesign.gate_design_status),
      recommendation_status: asString(productWriteGateDesign.recommendation_status),
      pass_count: asNumber(productWriteGateDesign.pass_count),
      warn_count: asNumber(productWriteGateDesign.warn_count),
      block_count: asNumber(productWriteGateDesign.block_count),
    },
  };
}

function validateContractTestsReport(report: JsonRecord): string[] {
  const failures: string[] = [];
  if (report.final_status !== "pass") failures.push("contract_tests_not_passed");
  if (
    report.contract_suite_status !==
    "product_write_disabled_adapter_contract_tests_passed"
  ) {
    failures.push("contract_suite_status_not_ready");
  }
  if (
    report.recommendation_status !==
    "ready_for_single_claim_product_write_disabled_adapter_dry_run_invocation_harness"
  ) {
    failures.push("contract_suite_recommendation_not_ready");
  }
  if (
    report.next_recommended_slice !==
    "single_claim_product_write_disabled_adapter_dry_run_invocation_harness"
  ) {
    failures.push("contract_suite_next_slice_invalid");
  }
  if (asNumber(report.total_cases) < 80) failures.push("contract_suite_not_broad");
  if (asArray(report.unexpected_passes).length !== 0) {
    failures.push("contract_suite_unexpected_passes_present");
  }
  if (asArray(report.unexpected_failures).length !== 0) {
    failures.push("contract_suite_unexpected_failures_present");
  }
  return failures;
}

function validateSkeleton(skeleton: JsonRecord): string[] {
  const failures: string[] = [];
  if (skeleton.disabled_adapter_skeleton_status !== "product_write_disabled_adapter_skeleton_only") {
    failures.push("disabled_adapter_skeleton_not_ready");
  }
  if (
    skeleton.recommendation_status !==
    "ready_for_single_claim_product_write_disabled_adapter_contract_tests"
  ) {
    failures.push("disabled_adapter_skeleton_recommendation_not_ready");
  }
  if (skeleton.next_recommended_slice !== "single_claim_product_write_disabled_adapter_contract_tests") {
    failures.push("disabled_adapter_skeleton_next_slice_invalid");
  }
  if (asRecord(skeleton.validation).passed !== true) {
    failures.push("disabled_adapter_skeleton_validation_not_passed");
  }
  for (const key of [
    "adapter_enabled",
    "adapter_invocation_allowed_now",
    "product_write_allowed_now",
    "product_write_authority_granted_now",
    "product_write_implementation_allowed_now",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ] as const) {
    if (skeleton[key] !== false) failures.push(`skeleton_${key}_not_false`);
  }
  const futureCommand = asRecord(skeleton.future_product_write_command_preview);
  if (futureCommand.executable_now !== false) {
    failures.push("future_command_executable_now_not_false");
  }
  if (asNumber(futureCommand.write_operation_count) !== 0) {
    failures.push("future_command_write_count_not_zero");
  }
  if (asNumber(futureCommand.sql_statement_count) !== 0) {
    failures.push("future_command_sql_count_not_zero");
  }
  failures.push(
    ...validateFalseRecord(
      skeleton.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS.filter(
        (key) =>
          key !== "product_write_implementation" &&
          key !== "adapter_runtime_invocation",
      ),
      "skeleton_forbidden_surface",
    ),
  );
  if (hasNonNullProductIds(skeleton)) {
    failures.push("source_non_null_product_or_related_id_present");
  }
  return unique(failures);
}

function validateInvocationInput(value: unknown): string[] {
  const input = asRecord(value);
  const failures: string[] = [];
  if (input.candidate_kind !== "manual_note_single_claim") {
    failures.push("invocation_input_candidate_kind_invalid");
  }
  for (const key of REQUIRED_INPUT_FIELDS) {
    if (!asString(input[key])) failures.push(`invocation_input_${key}_missing`);
  }
  for (const key of FORBIDDEN_INPUT_FIELDS) {
    if (input[key] !== null && input[key] !== false && input[key] !== undefined) {
      failures.push(`invocation_input_${key}_present`);
    }
  }
  if (input.raw_manual_note_text_included !== false) {
    failures.push("invocation_input_raw_manual_note_text_included_not_false");
  }
  return failures;
}

function validateInvocationInputReferences(
  value: unknown,
  sourceEvidenceValue: unknown,
): string[] {
  const input = asRecord(value);
  const sourceEvidence = asRecord(sourceEvidenceValue);
  const contractTests = asRecord(sourceEvidence.disabled_adapter_contract_tests);
  const skeleton = asRecord(sourceEvidence.disabled_adapter_skeleton);
  const authority = asRecord(sourceEvidence.authority_contract_bundle);
  const expectedReferences = [
    [
      "authority_contract_bundle_fingerprint",
      asString(authority.authority_contract_bundle_fingerprint),
    ],
    [
      "disabled_adapter_skeleton_fingerprint",
      asString(skeleton.disabled_adapter_skeleton_fingerprint),
    ],
    ["contract_suite_fingerprint", asString(contractTests.suite_fingerprint)],
  ] as const;
  const failures: string[] = [];
  for (const [field, expected] of expectedReferences) {
    if (asString(input[field]) !== expected) {
      failures.push(`invocation_input_${field}_mismatch`);
    }
  }
  return failures;
}

function validateNormalizedInvocationInput(value: unknown): string[] {
  const input = asRecord(value);
  const failures: string[] = [];
  if (
    input.normalized_by !==
    "manual_note_single_claim_product_write_disabled_adapter_dry_run_harness"
  ) {
    failures.push("normalized_invocation_input_normalized_by_invalid");
  }
  if (input.normalization_executed_now !== true) {
    failures.push("normalized_invocation_input_not_executed");
  }
  if (input.normalization_persisted_now !== false) {
    failures.push("normalized_invocation_input_persisted");
  }
  if (input.normalization_storage_target !== "local_artifact_only") {
    failures.push("normalized_invocation_input_storage_target_invalid");
  }
  for (const key of [
    "normalized_product_claim_id",
    "normalized_proof_id",
    "normalized_evidence_id",
    "normalized_perspective_id",
    "normalized_work_item_id",
  ] as const) {
    if (input[key] !== null) failures.push(`${key}_not_null`);
  }
  if (input.normalized_raw_manual_note_text_included !== false) {
    failures.push("normalized_raw_manual_note_text_included_not_false");
  }
  return failures;
}

function buildInvocationTrace(): JsonRecord[] {
  return REQUIRED_TRACE_GROUPS.map((group, index) => ({
    trace_id: `dry-run-invocation-trace:${String(index + 1).padStart(2, "0")}`,
    trace_group: group,
    trace_label: group.replaceAll("_", " "),
    input_checked: group,
    observed_value_summary: "disabled no-op boundary observed",
    expected_boundary: "no product write and no runtime adapter invocation",
    actual_boundary: "no product write and no runtime adapter invocation",
    trace_status: "pass",
    product_write_attempted_now: false,
    product_db_write_now: false,
    product_id_allocation_now: false,
    db_open_now: false,
    sql_execution_now: false,
    transaction_execution_now: false,
    adapter_runtime_invocation_now: false,
    durable_write_now: false,
  }));
}

function validateInvocationTrace(value: unknown): string[] {
  const rows = asArray(value).map(asRecord);
  const failures: string[] = [];
  const groups = rows.map((row) => asString(row.trace_group));
  for (const group of REQUIRED_TRACE_GROUPS) {
    if (!groups.includes(group)) failures.push(`trace_group_${group}_missing`);
  }
  for (const row of rows) {
    const id = asString(row.trace_id) || "unknown";
    for (const key of [
      "product_write_attempted_now",
      "product_db_write_now",
      "product_id_allocation_now",
      "db_open_now",
      "sql_execution_now",
      "transaction_execution_now",
      "adapter_runtime_invocation_now",
      "durable_write_now",
    ] as const) {
      if (row[key] !== false) failures.push(`trace_${id}_${key}_not_false`);
    }
  }
  return failures;
}

function buildDisabledInvocationResult(): JsonRecord {
  return {
    result_kind:
      "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_result",
    result_status: "rejected_disabled_adapter",
    dry_noop_preview_produced: true,
    adapter_disabled: true,
    adapter_runtime_invocation_now: false,
    adapter_invocation_allowed_now: false,
    product_write_attempted_now: false,
    product_write_executed_now: false,
    product_db_write_now: false,
    product_id_allocation_now: false,
    db_open_now: false,
    sql_execution_now: false,
    transaction_execution_now: false,
    durable_records_created_now: false,
    refusal_reasons: REQUIRED_REFUSAL_REASONS,
    output_product_claim_id: null,
    output_proof_id: null,
    output_evidence_id: null,
    output_perspective_id: null,
    output_work_item_id: null,
  };
}

function validateDisabledInvocationResult(value: unknown): string[] {
  const result = asRecord(value);
  const failures: string[] = [];
  if (result.result_status !== "rejected_disabled_adapter") {
    failures.push("disabled_invocation_result_status_invalid");
  }
  if (result.dry_noop_preview_produced !== true) {
    failures.push("disabled_invocation_noop_preview_not_produced");
  }
  for (const key of [
    "adapter_runtime_invocation_now",
    "adapter_invocation_allowed_now",
    "product_write_attempted_now",
    "product_write_executed_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "durable_records_created_now",
  ] as const) {
    if (result[key] !== false) {
      failures.push(`disabled_invocation_result_${key}_not_false`);
    }
  }
  const reasons = asArray(result.refusal_reasons).map(asString);
  for (const reason of REQUIRED_REFUSAL_REASONS) {
    if (!reasons.includes(reason)) {
      failures.push(`disabled_invocation_refusal_${reason}_missing`);
    }
  }
  return failures;
}

function buildDryNoopPreview(skeleton: JsonRecord): JsonRecord {
  const futureCommand = asRecord(skeleton.future_product_write_command_preview);
  return {
    preview_kind:
      "manual_note_single_claim_product_write_disabled_adapter_dry_noop_preview",
    preview_created_now: true,
    preview_persisted_now: false,
    preview_storage_target: "local_artifact_only",
    future_product_write_command_preview_fingerprint:
      createManualNoteSingleClaimProductWriteDisabledAdapterDryRunInvocationHarnessFingerprint(
        futureCommand,
      ),
    would_have_required_contracts_count: asArray(
      futureCommand.would_require_contracts,
    ).length,
    would_have_rejected_for_authority: true,
    would_have_rejected_for_disabled_adapter: true,
    write_operation_count_now: 0,
    sql_statement_count_now: 0,
    durable_record_count_now: 0,
    product_claim_id: null,
  };
}

function validateDryNoopPreview(value: unknown): string[] {
  const preview = asRecord(value);
  const failures: string[] = [];
  if (preview.preview_created_now !== true) failures.push("dry_noop_preview_not_created");
  if (preview.preview_persisted_now !== false) failures.push("dry_noop_preview_persisted");
  if (preview.preview_storage_target !== "local_artifact_only") {
    failures.push("dry_noop_preview_storage_target_invalid");
  }
  for (const key of [
    "write_operation_count_now",
    "sql_statement_count_now",
    "durable_record_count_now",
  ] as const) {
    if (asNumber(preview[key]) !== 0) failures.push(`dry_noop_preview_${key}_not_zero`);
  }
  if (preview.product_claim_id !== null) {
    failures.push("dry_noop_preview_product_claim_id_not_null");
  }
  return failures;
}

function buildInvocationProbeResults(harness: JsonRecord): JsonRecord[] {
  const probeConfigs: Array<[string, string, string, (draft: JsonRecord) => void, string[]]> = [
    ["positive_disabled_invocation_rejected", "positive", "disabled invocation returns rejected result", () => {}, []],
    ["source_contract_tests_failed_blocks", "source_preflight", "contract tests failed blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_contract_tests", "final_status"], "fail"), ["source_contract_tests_not_passed"]],
    ["skeleton_blocked_blocks", "source_preflight", "skeleton blocked blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_skeleton", "disabled_adapter_skeleton_status"], "blocked"), ["source_skeleton_not_ready"]],
    ["authority_bundle_blocked_blocks", "source_preflight", "authority bundle blocked blocks", (d) => setPath(d, ["source_evidence", "authority_contract_bundle", "authority_contract_bundle_status"], "blocked"), ["source_authority_bundle_not_ready"]],
    ["dry_run_transaction_plan_blocked_blocks", "source_preflight", "dry-run transaction plan blocked blocks", (d) => setPath(d, ["source_evidence", "dry_run_transaction_plan", "dry_run_transaction_plan_status"], "blocked"), ["source_dry_run_transaction_plan_not_ready"]],
    ["adapter_enabled_true_blocks", "adapter_boundary", "adapter enabled true blocks", (d) => { d.adapter_enabled = true; }, ["adapter_enabled_invalid"]],
    ["adapter_invocation_allowed_true_blocks", "adapter_boundary", "adapter invocation allowed true blocks", (d) => { d.adapter_invocation_allowed_now = true; }, ["adapter_invocation_allowed_now_invalid"]],
    ["product_write_allowed_true_blocks", "no_write_boundary", "product write allowed true blocks", (d) => { d.product_write_allowed_now = true; }, ["product_write_allowed_now_invalid"]],
    ["product_write_authority_granted_true_blocks", "no_write_boundary", "authority granted true blocks", (d) => { d.product_write_authority_granted_now = true; }, ["product_write_authority_granted_now_invalid"]],
    ["product_write_implementation_allowed_true_blocks", "no_write_boundary", "implementation allowed true blocks", (d) => { d.product_write_implementation_allowed_now = true; }, ["product_write_implementation_allowed_now_invalid"]],
    ["transaction_execution_allowed_true_blocks", "no_write_boundary", "transaction execution allowed true blocks", (d) => { d.transaction_execution_allowed_now = true; }, ["transaction_execution_allowed_now_invalid"]],
    ["product_db_write_true_blocks", "no_write_boundary", "product db write true blocks", (d) => { d.product_db_write = true; }, ["product_db_write_invalid"]],
    ["product_id_allocation_true_blocks", "no_write_boundary", "product ID allocation true blocks", (d) => { d.product_id_allocation = true; }, ["product_id_allocation_invalid"]],
    ["db_open_true_blocks", "no_write_boundary", "DB open true blocks", (d) => { d.db_open = true; }, ["db_open_invalid"]],
    ["sql_execution_true_blocks", "no_write_boundary", "SQL execution true blocks", (d) => { d.sql_execution = true; }, ["sql_execution_invalid"]],
    ["route_added_true_blocks", "route_ui_boundary", "route added true blocks", (d) => { d.route_added = true; }, ["route_added_invalid"]],
    ["ui_write_action_added_true_blocks", "route_ui_boundary", "UI write action true blocks", (d) => { d.ui_write_action_added = true; }, ["ui_write_action_added_invalid"]],
    ...REQUIRED_INPUT_FIELDS.slice(0, 3).map((field) => [
      `missing_${field}_blocks`,
      "invocation_input",
      `${field} missing blocks`,
      (d: JsonRecord) => setPath(d, ["dry_run_invocation_input", field], ""),
      [`invocation_input_${field}_missing`],
    ] as [string, string, string, (draft: JsonRecord) => void, string[]]),
    ["authority_contract_bundle_fingerprint_mismatch_blocks", "invocation_input", "authority contract bundle fingerprint mismatch blocks", (d) => setPath(d, ["dry_run_invocation_input", "authority_contract_bundle_fingerprint"], "fnv1a32:00000000"), ["invocation_input_authority_contract_bundle_fingerprint_mismatch"]],
    ["disabled_adapter_skeleton_fingerprint_mismatch_blocks", "invocation_input", "disabled adapter skeleton fingerprint mismatch blocks", (d) => setPath(d, ["dry_run_invocation_input", "disabled_adapter_skeleton_fingerprint"], "fnv1a32:00000000"), ["invocation_input_disabled_adapter_skeleton_fingerprint_mismatch"]],
    ["contract_suite_fingerprint_mismatch_blocks", "invocation_input", "contract suite fingerprint mismatch blocks", (d) => setPath(d, ["dry_run_invocation_input", "contract_suite_fingerprint"], "fnv1a32:00000000"), ["invocation_input_contract_suite_fingerprint_mismatch"]],
    ["candidate_kind_mismatch_blocks", "invocation_input", "candidate kind mismatch blocks", (d) => setPath(d, ["dry_run_invocation_input", "candidate_kind"], "manual_note_multi_claim"), ["invocation_input_candidate_kind_invalid"]],
    ...FORBIDDEN_INPUT_FIELDS.map((field) => [
      `${field}_provided_blocks`,
      "forbidden_input",
      `${field} provided blocks`,
      (d: JsonRecord) => setPath(d, ["dry_run_invocation_input", field], `${field}:blocked`),
      [`invocation_input_${field}_present`],
    ] as [string, string, string, (draft: JsonRecord) => void, string[]]),
    ["raw_manual_note_text_included_true_blocks", "forbidden_input", "raw manual note text true blocks", (d) => setPath(d, ["dry_run_invocation_input", "raw_manual_note_text_included"], true), ["invocation_input_raw_manual_note_text_included_not_false"]],
    ["dry_noop_write_count_positive_blocks", "dry_noop_preview", "dry noop write count positive blocks", (d) => setPath(d, ["dry_noop_preview", "write_operation_count_now"], 1), ["dry_noop_preview_write_operation_count_now_not_zero"]],
    ["dry_noop_sql_count_positive_blocks", "dry_noop_preview", "dry noop SQL count positive blocks", (d) => setPath(d, ["dry_noop_preview", "sql_statement_count_now"], 1), ["dry_noop_preview_sql_statement_count_now_not_zero"]],
    ["disabled_result_product_write_attempted_true_blocks", "disabled_result", "result product write attempted true blocks", (d) => setPath(d, ["disabled_invocation_result", "product_write_attempted_now"], true), ["disabled_invocation_result_product_write_attempted_now_not_false"]],
    ["disabled_result_adapter_runtime_invocation_true_blocks", "disabled_result", "runtime invocation true blocks", (d) => setPath(d, ["disabled_invocation_result", "adapter_runtime_invocation_now"], true), ["disabled_invocation_result_adapter_runtime_invocation_now_not_false"]],
    ["trace_product_db_write_true_blocks", "trace_boundary", "trace DB write true blocks", (d) => setPath(d, ["invocation_trace", 0, "product_db_write_now"], true), ["trace_dry-run-invocation-trace:01_product_db_write_now_not_false"]],
    ["trace_sql_execution_true_blocks", "trace_boundary", "trace SQL true blocks", (d) => setPath(d, ["invocation_trace", 0, "sql_execution_now"], true), ["trace_dry-run-invocation-trace:01_sql_execution_now_not_false"]],
    ["trace_transaction_execution_true_blocks", "trace_boundary", "trace transaction true blocks", (d) => setPath(d, ["invocation_trace", 0, "transaction_execution_now"], true), ["trace_dry-run-invocation-trace:01_transaction_execution_now_not_false"]],
    ["explicit_forbidden_surface_true_blocks", "forbidden_surface", "explicit forbidden surface true blocks", (d) => setPath(d, ["explicit_forbidden_surfaces", "product_db_write"], true), ["explicit_forbidden_surface_product_db_write_not_false"]],
    ["non_null_product_id_anywhere_blocks", "product_id_contamination", "non-null product ID anywhere blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_skeleton", "product_claim_id"], "product:blocked"), ["non_null_product_or_related_id_present"]],
    ["static_empty_delta_blocks", "static_boundary", "empty changed-file delta blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], []), ["static_boundary_changed_file_delta_empty"]],
    ["static_package_addition_outside_allowlist_blocks", "static_boundary", "package addition outside allowlist blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"], ['+    "openai": "^1.0.0",']), ["static_boundary_package_addition_outside_allowlist", "static_boundary_expected_package_script_missing"]],
    ["static_schema_db_sql_changed_file_blocks", "static_boundary", "schema/db/sql changed file blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["db/schema.sql"]), ["static_boundary_schema_db_sql_changed", "static_boundary_expected_files_missing"]],
    ["static_app_router_ui_file_blocks", "static_boundary", "App Router UI file blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["app/foo/page.tsx"]), ["static_boundary_ui_changed", "static_boundary_expected_files_missing"]],
    ["static_external_call_pattern_blocks", "static_boundary", "external call probe blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_probe_text"], `${["fet", "ch"].join("")}("https://example.com")`), ["static_boundary_network_or_external_call_present"]],
  ];
  return probeConfigs.map(([probeId, probeGroup, summary, mutate, expectedCodes]) => {
    const draft = cloneJson(harness);
    mutate(draft);
    const sourceFailures = validateHarnessSourceEvidence(asRecord(draft.source_evidence));
    const actualFailureCodes = unique([
      ...sourceFailures,
      ...validateManualNoteSingleClaimProductWriteDisabledAdapterDryRunInvocationHarness(
        draft,
      ),
    ]);
    const actualStatus = actualFailureCodes.length === 0 ? "pass" : "fail";
    const expectedStatus = expectedCodes.length === 0 ? "pass" : "fail";
    const covered = expectedCodes.every((code) => actualFailureCodes.includes(code));
    return {
      probe_id: probeId,
      probe_group: probeGroup,
      mutation_summary: summary,
      expected_status: expectedStatus,
      expected_failure_codes: expectedCodes,
      actual_status: actualStatus,
      actual_failure_codes: actualFailureCodes,
      probe_status:
        actualStatus === expectedStatus && covered ? "pass" : "unexpected_failure",
    };
  });
}

function validateHarnessSourceEvidence(sourceEvidence: JsonRecord): string[] {
  const failures: string[] = [];
  const contractTests = asRecord(sourceEvidence.disabled_adapter_contract_tests);
  if (contractTests.final_status !== "pass") failures.push("source_contract_tests_not_passed");
  if (
    contractTests.contract_suite_status !==
    "product_write_disabled_adapter_contract_tests_passed"
  ) {
    failures.push("source_contract_suite_status_not_ready");
  }
  const skeleton = asRecord(sourceEvidence.disabled_adapter_skeleton);
  if (
    skeleton.disabled_adapter_skeleton_status !==
    "product_write_disabled_adapter_skeleton_only"
  ) {
    failures.push("source_skeleton_not_ready");
  }
  const authority = asRecord(sourceEvidence.authority_contract_bundle);
  if (
    authority.authority_contract_bundle_status !==
    "product_write_authority_contracts_defined_only"
  ) {
    failures.push("source_authority_bundle_not_ready");
  }
  const harness = asRecord(sourceEvidence.dry_run_transaction_harness);
  if (
    harness.dry_run_transaction_harness_status !==
    "disabled_dry_run_transaction_harness_only"
  ) {
    failures.push("source_dry_run_transaction_harness_not_ready");
  }
  const plan = asRecord(sourceEvidence.dry_run_transaction_plan);
  if (plan.dry_run_transaction_plan_status !== "disabled_dry_run_transaction_plan_only") {
    failures.push("source_dry_run_transaction_plan_not_ready");
  }
  const gate = asRecord(sourceEvidence.product_write_gate_design);
  if (gate.gate_design_status !== "product_write_gate_design_only") {
    failures.push("source_product_write_gate_design_not_ready");
  }
  return failures;
}

function validateStaticBoundaryEvidence(value: unknown): string[] {
  const evidence = asRecord(value);
  const failures: string[] = [];
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
  if (changedFiles.some(isSchemaDbSqlPath)) failures.push("static_boundary_schema_db_sql_changed");
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) failures.push("static_boundary_app_api_route_changed");
  if (changedFiles.some(isUiFilePath)) failures.push("static_boundary_ui_changed");
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

function normalizeStaticBoundaryEvidence(value: unknown): JsonRecord {
  const evidence = asRecord(value);
  return {
    static_boundary_base_ref: asString(evidence.static_boundary_base_ref),
    static_boundary_base_mode: asString(evidence.static_boundary_base_mode),
    static_boundary_base_commit: evidence.static_boundary_base_commit ?? null,
    static_boundary_changed_files_inspected: asArray(
      evidence.static_boundary_changed_files_inspected ??
        evidence.changed_files_inspected,
    ).map(asString),
    static_boundary_package_added_lines_inspected: asArray(
      evidence.static_boundary_package_added_lines_inspected ??
        evidence.package_added_lines_inspected,
    ).map(asString),
    static_boundary_used_fallback_allowlist:
      evidence.static_boundary_used_fallback_allowlist === true ||
      evidence.used_fallback_allowlist === true,
    expected_changed_files: asArray(evidence.expected_changed_files).map(asString),
    allowed_package_script_names: asArray(
      evidence.allowed_package_script_names,
    ).map(asString),
    static_boundary_probe_text: asString(evidence.static_boundary_probe_text),
  };
}

function explicitForbiddenSurfaces(): JsonRecord {
  return Object.fromEntries(
    EXPLICIT_FORBIDDEN_SURFACE_KEYS.map((key) => [key, false]),
  );
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
  if (Object.keys(record).length === 0) failures.push(`${prefix}_record_empty`);
  for (const key of keys) {
    if (record[key] !== false) failures.push(`${prefix}_${key}_not_false`);
  }
  return failures;
}

function hasNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if ((PRODUCT_ID_KEYS as readonly string[]).includes(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
}

function isUiFilePath(filePath: string): boolean {
  return /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
}

function isSchemaDbSqlPath(filePath: string): boolean {
  return (
    /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
      filePath,
    ) || /^lib\/db(\.ts|\/)/.test(filePath)
  );
}

function executableSqlPattern(): RegExp {
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

function forbiddenImportPattern(): RegExp {
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

function networkOrExternalCallPattern(): RegExp {
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

function browserPersistencePattern(): RegExp {
  return new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("\\."),
    ].join("|")})\\b`,
  );
}

function appServerStartupPattern(): RegExp {
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

function setPath(target: JsonRecord, pathParts: Array<string | number>, value: unknown): void {
  let cursor: unknown = target;
  for (const part of pathParts.slice(0, -1)) {
    const record = cursor as JsonRecord;
    if (typeof part === "number") {
      cursor = asArray(cursor)[part];
    } else {
      if (!record[part] || typeof record[part] !== "object") record[part] = {};
      cursor = record[part];
    }
  }
  const last = pathParts[pathParts.length - 1];
  if (typeof last === "number") {
    (cursor as unknown[])[last] = value;
  } else {
    (cursor as JsonRecord)[last] = value;
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
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
