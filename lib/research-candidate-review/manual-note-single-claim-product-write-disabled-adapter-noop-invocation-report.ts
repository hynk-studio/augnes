export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_NOOP_INVOCATION_REPORT_VERSION =
  "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_report.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildInput = {
  dryRunInvocationHarness: unknown;
  reportReviewInput?: unknown;
  staticBoundaryEvidence?: unknown;
  sourceValidationFailureCodes?: unknown;
};

const READY_REPORT_STATUS =
  "product_write_disabled_adapter_noop_invocation_report_only";
const BLOCKED_REPORT_STATUS =
  "blocked_before_product_write_disabled_adapter_noop_invocation_report";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_preflight_command_envelope";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_preflight_command_envelope";
const NEXT_PREFLIGHT_COMMAND_ENVELOPE =
  "single_claim_product_write_preflight_command_envelope";
const RECHECK_SLICE =
  "single_claim_product_write_disabled_adapter_noop_invocation_report_recheck";

const READY_HARNESS_STATUS =
  "product_write_disabled_adapter_dry_run_invocation_harness_only";
const READY_HARNESS_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_noop_invocation_report";
const READY_HARNESS_NEXT_SLICE =
  "single_claim_product_write_disabled_adapter_noop_invocation_report";

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

const REQUIRED_REVIEWED_SECTIONS = [
  "source evidence",
  "normalized invocation input",
  "refusal reasons",
  "no-write closeout",
  "preflight command envelope preview",
] as const;

const PREFLIGHT_REQUIREMENTS = [
  "explicit_operator_decision",
  "product_claim_schema_contract_satisfied",
  "product_claim_id_allocation_contract_satisfied",
  "idempotency_storage_contract_satisfied",
  "rollback_storage_contract_satisfied",
  "audit_storage_contract_satisfied",
  "observability_contract_satisfied",
  "source_verification_authority_satisfied",
  "proof_evidence_authority_decision",
  "canonical_perspective_authority_decision",
  "enabled_adapter_transition_decision",
  "static_boundary_clean",
  "no_runtime_write_before_authority",
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
  "command_envelope_persistence",
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
  "normalized_product_claim_id",
  "normalized_proof_id",
  "normalized_evidence_id",
  "normalized_perspective_id",
  "normalized_work_item_id",
  "command_envelope_id",
] as const;

export function buildManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReport(
  input: BuildInput,
): JsonRecord {
  const harness = asRecord(input.dryRunInvocationHarness);
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const staticBoundaryEvidence = normalizeStaticBoundaryEvidence(
    input.staticBoundaryEvidence,
  );
  const sourceEvidence = buildSourceEvidence(harness);
  const seedFailures = unique([
    ...sourceValidationFailureCodes,
    ...validateHarnessReadiness(harness),
    ...validateStaticBoundaryEvidence(staticBoundaryEvidence),
  ]);
  const ready = seedFailures.length === 0;
  const core = {
    noop_invocation_report_kind:
      "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_report",
    noop_invocation_report_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_NOOP_INVOCATION_REPORT_VERSION,
    noop_invocation_report_fingerprint: "",
    source_validation_failure_codes: sourceValidationFailureCodes,
    source_evidence: sourceEvidence,
    noop_invocation_report_status: ready
      ? READY_REPORT_STATUS
      : BLOCKED_REPORT_STATUS,
    report_created_from_harness: true,
    report_reviewed_product_write_attempt: false,
    adapter_kind: "manual_note_single_claim_product_write_disabled_adapter",
    adapter_enabled: false,
    adapter_invocation_attempted_now: true,
    adapter_invocation_executed_against_runtime: false,
    adapter_invocation_allowed_now: false,
    product_write_attempted_now: false,
    product_write_executed_now: false,
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
    dry_run_invocation_input_summary: summarizeInvocationInput(
      harness.dry_run_invocation_input,
    ),
    normalized_invocation_input_summary: summarizeNormalizedInput(
      harness.normalized_invocation_input,
    ),
    invocation_trace: cloneJson(asArray(harness.invocation_trace)),
    invocation_probes: cloneJson(asArray(harness.invocation_probes)),
    disabled_invocation_result: cloneJson(
      asRecord(harness.disabled_invocation_result),
    ),
    dry_noop_preview: cloneJson(asRecord(harness.dry_noop_preview)),
    operator_review_packet: buildOperatorReviewPacket(
      harness,
      input.reportReviewInput,
    ),
    no_write_closeout: buildNoWriteCloseout(),
    invocation_closeout_summary: buildInvocationCloseoutSummary(harness),
    product_write_preflight_command_envelope_preview:
      buildProductWritePreflightCommandEnvelopePreview(harness),
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    static_boundary_evidence: staticBoundaryEvidence,
    validation: {
      passed: ready,
      failure_codes: seedFailures,
    },
    recommendation_status: ready ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: ready ? NEXT_PREFLIGHT_COMMAND_ENVELOPE : RECHECK_SLICE,
  };
  const validationMatrix = buildReportValidationMatrix(core);
  const matrixFailures = validationMatrix
    .filter((row) => row.check_status !== "pass")
    .map((row) => `validation_matrix_${asString(row.check_id)}_${asString(row.check_status)}`);
  const finalFailures = unique([...seedFailures, ...matrixFailures]);
  const finalReady = finalFailures.length === 0;
  const reportWithoutFingerprint = {
    ...core,
    noop_invocation_report_status: finalReady
      ? READY_REPORT_STATUS
      : BLOCKED_REPORT_STATUS,
    report_validation_matrix: validationMatrix,
    validation: {
      passed: finalReady,
      failure_codes: finalFailures,
    },
    recommendation_status: finalReady
      ? READY_RECOMMENDATION
      : BLOCKED_RECOMMENDATION,
    next_recommended_slice: finalReady
      ? NEXT_PREFLIGHT_COMMAND_ENVELOPE
      : RECHECK_SLICE,
  };
  const fingerprint =
    createManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReportFingerprint(
      reportWithoutFingerprint,
    );
  return {
    ...reportWithoutFingerprint,
    noop_invocation_report_fingerprint: fingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Product Write Disabled Adapter No-Op Invocation Report",
        "",
        "Disabled product write adapter no-op invocation report only.",
        "Product write remains blocked; next slice is the preflight command envelope.",
        `noop_invocation_report_status: ${reportWithoutFingerprint.noop_invocation_report_status}`,
        `noop_invocation_report_fingerprint: ${fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          noop_invocation_report_status:
            reportWithoutFingerprint.noop_invocation_report_status,
          adapter_invocation_attempted_now: true,
          adapter_invocation_executed_against_runtime: false,
          product_write_attempted_now: false,
          product_db_write: false,
          product_id_allocation: false,
          db_open: false,
          sql_execution: false,
          next_recommended_slice: reportWithoutFingerprint.next_recommended_slice,
        },
        null,
        2,
      ),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      command_envelope_persisted_now: false,
      product_write_allowed_now: false,
    },
  };
}

export function validateManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReport(
  value: unknown,
): string[] {
  const report = asRecord(value);
  const failures: string[] = [];
  failures.push(...asArray(report.source_validation_failure_codes).map(asString));
  if (report.noop_invocation_report_status !== READY_REPORT_STATUS) {
    failures.push("noop_invocation_report_status_not_ready");
  }
  if (report.report_created_from_harness !== true) {
    failures.push("report_created_from_harness_not_true");
  }
  if (report.report_reviewed_product_write_attempt !== false) {
    failures.push("report_reviewed_product_write_attempt_not_false");
  }
  for (const [key, expected] of [
    ["adapter_enabled", false],
    ["adapter_invocation_attempted_now", true],
    ["adapter_invocation_executed_against_runtime", false],
    ["adapter_invocation_allowed_now", false],
    ["product_write_attempted_now", false],
    ["product_write_executed_now", false],
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
    if (report[key] !== expected) failures.push(`${key}_invalid`);
  }
  failures.push(...validateReportSourceEvidence(report.source_evidence));
  failures.push(...validateInvocationTrace(report.invocation_trace));
  failures.push(...validateInvocationProbes(report.invocation_probes));
  failures.push(
    ...validateDisabledInvocationResult(report.disabled_invocation_result),
  );
  failures.push(...validateDryNoopPreview(report.dry_noop_preview));
  failures.push(...validateOperatorReviewPacket(report.operator_review_packet));
  failures.push(...validateNoWriteCloseout(report.no_write_closeout));
  failures.push(
    ...validateInvocationCloseoutSummary(report.invocation_closeout_summary),
  );
  failures.push(
    ...validateProductWritePreflightCommandEnvelopePreview(
      report.product_write_preflight_command_envelope_preview,
    ),
  );
  failures.push(
    ...validateFalseRecord(
      report.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS,
      "explicit_forbidden_surface",
    ),
  );
  failures.push(...validateStaticBoundaryEvidence(report.static_boundary_evidence));
  if (hasNonNullProductIds(report)) {
    failures.push("non_null_product_or_related_id_present");
  }
  if (report.recommendation_status !== READY_RECOMMENDATION) {
    failures.push("recommendation_status_not_ready");
  }
  if (report.next_recommended_slice !== NEXT_PREFLIGHT_COMMAND_ENVELOPE) {
    failures.push("next_recommended_slice_invalid");
  }
  return unique(failures);
}

export function createManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReportFingerprint(
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

function buildSourceEvidence(harness: JsonRecord): JsonRecord {
  const harnessSource = asRecord(harness.source_evidence);
  const contractTests = asRecord(harnessSource.disabled_adapter_contract_tests);
  const skeleton = asRecord(harnessSource.disabled_adapter_skeleton);
  const authority = asRecord(harnessSource.authority_contract_bundle);
  const gateDesign = asRecord(harnessSource.product_write_gate_design);
  const disabledResult = asRecord(harness.disabled_invocation_result);
  const dryNoopPreview = asRecord(harness.dry_noop_preview);
  const staticEvidence = asRecord(harness.static_boundary_evidence);
  return {
    disabled_adapter_dry_run_invocation_harness: {
      dry_run_invocation_harness_fingerprint: asString(
        harness.dry_run_invocation_harness_fingerprint,
      ),
      final_status: harnessSourceFinalStatus(harness),
      dry_run_invocation_harness_status: asString(
        harness.dry_run_invocation_harness_status,
      ),
      recommendation_status: asString(harness.recommendation_status),
      next_recommended_slice: asString(harness.next_recommended_slice),
      adapter_invocation_attempted_now:
        harness.adapter_invocation_attempted_now === true,
      adapter_invocation_executed_against_runtime:
        harness.adapter_invocation_executed_against_runtime === true,
      product_write_attempted_now: harness.product_write_attempted_now === true,
      disabled_invocation_result_status: asString(disabledResult.result_status),
      dry_noop_preview_status: dryNoopPreview.preview_created_now === true
        ? "created_local_artifact_only"
        : "missing",
      trace_row_count: asArray(harness.invocation_trace).length,
      probe_count: asArray(harness.invocation_probes).length,
      static_boundary_base_mode: asString(
        staticEvidence.static_boundary_base_mode,
      ),
      static_boundary_changed_file_count: asArray(
        staticEvidence.static_boundary_changed_files_inspected,
      ).length,
      static_boundary_fallback_flag:
        staticEvidence.static_boundary_used_fallback_allowlist === true,
    },
    disabled_adapter_contract_tests: {
      suite_fingerprint: asString(contractTests.suite_fingerprint),
      contract_suite_status: asString(contractTests.contract_suite_status),
      final_status: asString(contractTests.final_status),
      total_cases: asNumber(contractTests.total_cases),
      unexpected_passes_count: asNumber(contractTests.unexpected_passes_count),
      unexpected_failures_count: asNumber(contractTests.unexpected_failures_count),
    },
    disabled_adapter_skeleton: {
      disabled_adapter_skeleton_fingerprint: asString(
        skeleton.disabled_adapter_skeleton_fingerprint,
      ),
      disabled_adapter_skeleton_status: asString(
        skeleton.disabled_adapter_skeleton_status,
      ),
      adapter_kind: asString(skeleton.adapter_kind),
      adapter_enabled: skeleton.adapter_enabled === true,
      adapter_invocation_allowed_now:
        skeleton.adapter_invocation_allowed_now === true,
      product_write_allowed_now: skeleton.product_write_allowed_now === true,
    },
    authority_contract_bundle: {
      authority_contract_bundle_fingerprint: asString(
        authority.authority_contract_bundle_fingerprint,
      ),
      authority_contract_bundle_status: asString(
        authority.authority_contract_bundle_status,
      ),
      authority_contract_count: asNumber(authority.authority_contract_count),
      authority_gap_summary: authority.authority_gap_summary ?? {},
    },
    product_write_gate_design: {
      design_fingerprint: asString(gateDesign.design_fingerprint),
      gate_design_status: asString(gateDesign.gate_design_status),
      recommendation_status: asString(gateDesign.recommendation_status),
      pass_count: asNumber(gateDesign.pass_count),
      warn_count: asNumber(gateDesign.warn_count),
      block_count: asNumber(gateDesign.block_count),
    },
  };
}

function buildOperatorReviewPacket(
  harness: JsonRecord,
  reportReviewInput: unknown,
): JsonRecord {
  const invocationInput = asRecord(harness.dry_run_invocation_input);
  const reviewInput = asRecord(reportReviewInput);
  return {
    review_packet_kind:
      "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_operator_review_packet",
    review_packet_status: "reviewable_noop_invocation_only",
    selected_temp_claim_record_id: asString(
      invocationInput.selected_temp_claim_record_id,
    ),
    source_operation_id: asString(invocationInput.source_operation_id),
    source_temp_intent_id: asString(invocationInput.source_temp_intent_id),
    temp_idempotency_key: asString(invocationInput.temp_idempotency_key),
    raw_manual_note_text_included: false,
    operator_decision_required_before_product_write: true,
    operator_decision_satisfied_now: false,
    operator_may_approve_product_write_now: false,
    operator_may_only_review_noop_report_now: true,
    reviewed_sections: REQUIRED_REVIEWED_SECTIONS,
    reviewer_label: asString(reviewInput.reviewer_label) || "operator_review_pending",
    redaction_policy: {
      raw_manual_note_text_redacted: true,
      product_ids_redacted_or_absent: true,
      proof_evidence_ids_redacted_or_absent: true,
      perspective_work_ids_redacted_or_absent: true,
    },
  };
}

function buildNoWriteCloseout(): JsonRecord {
  return {
    closeout_kind:
      "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_no_write_closeout",
    closeout_status: "no_write_observed",
    checked_runtime_adapter_invocation: true,
    checked_product_write_attempt: true,
    checked_product_db_write: true,
    checked_product_id_allocation: true,
    checked_db_open: true,
    checked_sql_execution: true,
    checked_transaction_execution: true,
    checked_durable_record_creation: true,
    checked_route_ui_absence: true,
    checked_external_behavior_absence: true,
    runtime_adapter_invocation_now: false,
    product_write_attempted_now: false,
    product_write_executed_now: false,
    product_db_write_now: false,
    product_id_allocation_now: false,
    db_open_now: false,
    sql_execution_now: false,
    transaction_execution_now: false,
    durable_records_created_now: false,
    route_added_now: false,
    ui_write_action_added_now: false,
    external_handoff_now: false,
  };
}

function buildInvocationCloseoutSummary(harness: JsonRecord): JsonRecord {
  const disabledResult = asRecord(harness.disabled_invocation_result);
  const dryNoopPreview = asRecord(harness.dry_noop_preview);
  const traceGroups = asArray(harness.invocation_trace)
    .map(asRecord)
    .map((row) => asString(row.trace_group))
    .filter(Boolean);
  const probes = asArray(harness.invocation_probes).map(asRecord);
  return {
    dry_run_invocation_result_status: asString(disabledResult.result_status),
    refusal_reasons: asArray(disabledResult.refusal_reasons).map(asString),
    trace_group_count: unique(traceGroups).length,
    trace_groups: unique(traceGroups),
    probe_count: probes.length,
    failed_probe_count: probes.filter((probe) => probe.probe_status !== "pass")
      .length,
    dry_noop_preview_created: dryNoopPreview.preview_created_now === true,
    dry_noop_preview_persisted: dryNoopPreview.preview_persisted_now === true,
    dry_noop_preview_storage_target: asString(
      dryNoopPreview.preview_storage_target,
    ),
    product_write_result: null,
    product_claim_id: null,
  };
}

function buildProductWritePreflightCommandEnvelopePreview(
  harness: JsonRecord,
): JsonRecord {
  const invocationInput = asRecord(harness.dry_run_invocation_input);
  const tempIdempotencyKey = asString(invocationInput.temp_idempotency_key);
  return {
    preview_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_preview",
    preview_status: "defined_for_next_slice_only",
    executable_now: false,
    product_write_allowed_now: false,
    product_claim_id: null,
    command_envelope_id: null,
    command_envelope_persisted_now: false,
    command_envelope_requires_next_slice:
      NEXT_PREFLIGHT_COMMAND_ENVELOPE,
    would_require: PREFLIGHT_REQUIREMENTS,
    command_shape_preview: {
      command_kind: "manual_note_single_claim_product_write_command",
      candidate_kind: "manual_note_single_claim",
      selected_temp_claim_record_id: asString(
        invocationInput.selected_temp_claim_record_id,
      ),
      source_operation_id: asString(invocationInput.source_operation_id),
      source_temp_intent_id: asString(invocationInput.source_temp_intent_id),
      temp_idempotency_key: tempIdempotencyKey,
      product_claim_id: null,
      idempotency_key_preview: `product-write-preflight:${tempIdempotencyKey}`,
      rollback_plan_preview: {
        preview_status: "defined_for_next_slice_only",
        durable_rollback_write_now: false,
      },
      audit_event_preview: {
        preview_status: "defined_for_next_slice_only",
        durable_audit_write_now: false,
      },
      observability_event_preview: {
        preview_status: "defined_for_next_slice_only",
        durable_observability_write_now: false,
      },
      sql_statement_count_now: 0,
      db_write_count_now: 0,
      transaction_execution_now: false,
    },
  };
}

function summarizeInvocationInput(value: unknown): JsonRecord {
  const input = asRecord(value);
  return {
    input_kind: asString(input.input_kind),
    candidate_kind: asString(input.candidate_kind),
    selected_temp_claim_record_id: asString(input.selected_temp_claim_record_id),
    source_operation_id: asString(input.source_operation_id),
    source_temp_intent_id: asString(input.source_temp_intent_id),
    temp_idempotency_key: asString(input.temp_idempotency_key),
    authority_contract_bundle_fingerprint: asString(
      input.authority_contract_bundle_fingerprint,
    ),
    disabled_adapter_skeleton_fingerprint: asString(
      input.disabled_adapter_skeleton_fingerprint,
    ),
    contract_suite_fingerprint: asString(input.contract_suite_fingerprint),
    raw_manual_note_text_included: input.raw_manual_note_text_included === true,
    product_claim_id: input.product_claim_id ?? null,
    proof_id: input.proof_id ?? null,
    evidence_id: input.evidence_id ?? null,
    perspective_id: input.perspective_id ?? null,
    work_item_id: input.work_item_id ?? null,
  };
}

function summarizeNormalizedInput(value: unknown): JsonRecord {
  const input = asRecord(value);
  return {
    normalized_by: asString(input.normalized_by),
    normalization_executed_now: input.normalization_executed_now === true,
    normalization_persisted_now: input.normalization_persisted_now === true,
    normalization_storage_target: asString(input.normalization_storage_target),
    normalized_raw_manual_note_text_included:
      input.normalized_raw_manual_note_text_included === true,
    normalized_product_claim_id: input.normalized_product_claim_id ?? null,
    normalized_proof_id: input.normalized_proof_id ?? null,
    normalized_evidence_id: input.normalized_evidence_id ?? null,
    normalized_perspective_id: input.normalized_perspective_id ?? null,
    normalized_work_item_id: input.normalized_work_item_id ?? null,
  };
}

function validateHarnessReadiness(harness: JsonRecord): string[] {
  const failures: string[] = [];
  const disabledResult = asRecord(harness.disabled_invocation_result);
  const dryNoopPreview = asRecord(harness.dry_noop_preview);
  if (harnessSourceFinalStatus(harness) !== "pass") {
    failures.push("source_harness_final_status_not_passed");
  }
  if (harness.dry_run_invocation_harness_status !== READY_HARNESS_STATUS) {
    failures.push("source_harness_status_not_ready");
  }
  if (harness.recommendation_status !== READY_HARNESS_RECOMMENDATION) {
    failures.push("source_harness_recommendation_not_ready");
  }
  if (harness.next_recommended_slice !== READY_HARNESS_NEXT_SLICE) {
    failures.push("source_harness_next_slice_invalid");
  }
  if (asRecord(harness.validation).passed !== true) {
    failures.push("source_harness_validation_not_passed");
  }
  for (const [key, expected] of [
    ["adapter_invocation_attempted_now", true],
    ["adapter_invocation_executed_against_runtime", false],
    ["adapter_enabled", false],
    ["adapter_invocation_allowed_now", false],
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
    if (harness[key] !== expected) {
      failures.push(`source_harness_${key}_invalid`);
    }
  }
  if (disabledResult.result_status !== "rejected_disabled_adapter") {
    failures.push("source_harness_disabled_result_status_invalid");
  }
  if (disabledResult.dry_noop_preview_produced !== true) {
    failures.push("source_harness_disabled_result_noop_preview_missing");
  }
  for (const key of [
    "adapter_runtime_invocation_now",
    "product_write_attempted_now",
    "product_write_executed_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "durable_records_created_now",
  ] as const) {
    if (disabledResult[key] !== false) {
      failures.push(`source_harness_disabled_result_${key}_not_false`);
    }
  }
  if (dryNoopPreview.preview_created_now !== true) {
    failures.push("source_harness_dry_noop_preview_missing");
  }
  if (dryNoopPreview.preview_persisted_now !== false) {
    failures.push("source_harness_dry_noop_preview_persisted");
  }
  if (dryNoopPreview.preview_storage_target !== "local_artifact_only") {
    failures.push("source_harness_dry_noop_preview_storage_invalid");
  }
  for (const key of [
    "write_operation_count_now",
    "sql_statement_count_now",
    "durable_record_count_now",
  ] as const) {
    if (asNumber(dryNoopPreview[key]) !== 0) {
      failures.push(`source_harness_dry_noop_preview_${key}_not_zero`);
    }
  }
  if (dryNoopPreview.product_claim_id !== null) {
    failures.push("source_harness_dry_noop_preview_product_claim_id_not_null");
  }
  failures.push(...validateInvocationTrace(harness.invocation_trace).map((code) => `source_harness_${code}`));
  failures.push(...validateInvocationProbes(harness.invocation_probes).map((code) => `source_harness_${code}`));
  failures.push(
    ...validateFalseRecord(
      harness.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS.filter(
        (key) => key !== "command_envelope_persistence",
      ),
      "source_harness_forbidden_surface",
    ),
  );
  if (hasNonNullProductIds(harness)) {
    failures.push("source_harness_non_null_product_or_related_id_present");
  }
  return unique(failures);
}

function validateReportSourceEvidence(value: unknown): string[] {
  const source = asRecord(value);
  const failures: string[] = [];
  const harness = asRecord(source.disabled_adapter_dry_run_invocation_harness);
  if (harness.final_status !== "pass") {
    failures.push("source_harness_final_status_not_passed");
  }
  if (harness.dry_run_invocation_harness_status !== READY_HARNESS_STATUS) {
    failures.push("source_harness_status_not_ready");
  }
  if (harness.recommendation_status !== READY_HARNESS_RECOMMENDATION) {
    failures.push("source_harness_recommendation_not_ready");
  }
  if (harness.next_recommended_slice !== READY_HARNESS_NEXT_SLICE) {
    failures.push("source_harness_next_slice_invalid");
  }
  if (harness.adapter_invocation_attempted_now !== true) {
    failures.push("source_harness_adapter_invocation_not_attempted");
  }
  if (harness.adapter_invocation_executed_against_runtime !== false) {
    failures.push("source_harness_runtime_invocation_executed");
  }
  if (harness.product_write_attempted_now !== false) {
    failures.push("source_harness_product_write_attempted");
  }
  if (harness.disabled_invocation_result_status !== "rejected_disabled_adapter") {
    failures.push("source_harness_disabled_result_status_invalid");
  }
  const contractTests = asRecord(source.disabled_adapter_contract_tests);
  if (contractTests.final_status !== "pass") {
    failures.push("source_contract_tests_not_passed");
  }
  if (
    contractTests.contract_suite_status !==
    "product_write_disabled_adapter_contract_tests_passed"
  ) {
    failures.push("source_contract_suite_status_not_ready");
  }
  if (asNumber(contractTests.unexpected_passes_count) !== 0) {
    failures.push("source_contract_suite_unexpected_passes_present");
  }
  if (asNumber(contractTests.unexpected_failures_count) !== 0) {
    failures.push("source_contract_suite_unexpected_failures_present");
  }
  const skeleton = asRecord(source.disabled_adapter_skeleton);
  if (
    skeleton.disabled_adapter_skeleton_status !==
    "product_write_disabled_adapter_skeleton_only"
  ) {
    failures.push("source_skeleton_not_ready");
  }
  if (skeleton.adapter_enabled !== false) {
    failures.push("source_skeleton_adapter_enabled");
  }
  const authority = asRecord(source.authority_contract_bundle);
  if (
    authority.authority_contract_bundle_status !==
    "product_write_authority_contracts_defined_only"
  ) {
    failures.push("source_authority_bundle_not_ready");
  }
  const gate = asRecord(source.product_write_gate_design);
  if (gate.gate_design_status !== "product_write_gate_design_only") {
    failures.push("source_product_write_gate_design_not_ready");
  }
  return failures;
}

function validateDisabledInvocationResult(value: unknown): string[] {
  const result = asRecord(value);
  const failures: string[] = [];
  if (result.result_status !== "rejected_disabled_adapter") {
    failures.push("disabled_invocation_result_status_invalid");
  }
  if (result.dry_noop_preview_produced !== true) {
    failures.push("disabled_invocation_result_noop_preview_missing");
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

function validateDryNoopPreview(value: unknown): string[] {
  const preview = asRecord(value);
  const failures: string[] = [];
  if (preview.preview_created_now !== true) failures.push("dry_noop_preview_missing");
  if (preview.preview_persisted_now !== false) failures.push("dry_noop_preview_persisted");
  if (preview.preview_storage_target !== "local_artifact_only") {
    failures.push("dry_noop_preview_storage_target_invalid");
  }
  for (const key of [
    "write_operation_count_now",
    "sql_statement_count_now",
    "durable_record_count_now",
  ] as const) {
    if (asNumber(preview[key]) !== 0) {
      failures.push(`dry_noop_preview_${key}_not_zero`);
    }
  }
  if (preview.product_claim_id !== null) {
    failures.push("dry_noop_preview_product_claim_id_not_null");
  }
  return failures;
}

function validateOperatorReviewPacket(value: unknown): string[] {
  const packet = asRecord(value);
  const failures: string[] = [];
  if (
    packet.review_packet_kind !==
    "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_operator_review_packet"
  ) {
    failures.push("operator_review_packet_kind_invalid");
  }
  if (packet.review_packet_status !== "reviewable_noop_invocation_only") {
    failures.push("operator_review_packet_status_invalid");
  }
  if (!asString(packet.selected_temp_claim_record_id)) {
    failures.push("operator_review_packet_selected_temp_claim_record_id_missing");
  }
  if (!asString(packet.source_operation_id)) {
    failures.push("operator_review_packet_source_operation_id_missing");
  }
  if (!asString(packet.source_temp_intent_id)) {
    failures.push("operator_review_packet_source_temp_intent_id_missing");
  }
  if (!asString(packet.temp_idempotency_key)) {
    failures.push("operator_review_packet_temp_idempotency_key_missing");
  }
  if (packet.raw_manual_note_text_included !== false) {
    failures.push("operator_review_packet_raw_manual_note_text_included");
  }
  if (packet.operator_decision_required_before_product_write !== true) {
    failures.push("operator_review_packet_decision_requirement_missing");
  }
  if (packet.operator_decision_satisfied_now !== false) {
    failures.push("operator_review_packet_decision_satisfied_now");
  }
  if (packet.operator_may_approve_product_write_now !== false) {
    failures.push("operator_may_approve_product_write_now");
  }
  if (packet.operator_may_only_review_noop_report_now !== true) {
    failures.push("operator_review_packet_review_only_not_true");
  }
  const sections = asArray(packet.reviewed_sections).map(asString);
  for (const section of REQUIRED_REVIEWED_SECTIONS) {
    if (!sections.includes(section)) {
      failures.push(`operator_review_packet_section_${section.replaceAll(" ", "_")}_missing`);
    }
  }
  failures.push(
    ...validateTrueRecord(
      packet.redaction_policy,
      [
        "raw_manual_note_text_redacted",
        "product_ids_redacted_or_absent",
        "proof_evidence_ids_redacted_or_absent",
        "perspective_work_ids_redacted_or_absent",
      ],
      "operator_review_packet_redaction",
    ),
  );
  return failures;
}

function validateNoWriteCloseout(value: unknown): string[] {
  const closeout = asRecord(value);
  const failures: string[] = [];
  if (
    closeout.closeout_kind !==
    "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_no_write_closeout"
  ) {
    failures.push("no_write_closeout_kind_invalid");
  }
  if (closeout.closeout_status !== "no_write_observed") {
    failures.push("no_write_closeout_status_invalid");
  }
  failures.push(
    ...validateTrueRecord(
      closeout,
      [
        "checked_runtime_adapter_invocation",
        "checked_product_write_attempt",
        "checked_product_db_write",
        "checked_product_id_allocation",
        "checked_db_open",
        "checked_sql_execution",
        "checked_transaction_execution",
        "checked_durable_record_creation",
        "checked_route_ui_absence",
        "checked_external_behavior_absence",
      ],
      "no_write_closeout_check",
    ),
  );
  failures.push(
    ...validateFalseRecord(
      closeout,
      [
        "runtime_adapter_invocation_now",
        "product_write_attempted_now",
        "product_write_executed_now",
        "product_db_write_now",
        "product_id_allocation_now",
        "db_open_now",
        "sql_execution_now",
        "transaction_execution_now",
        "durable_records_created_now",
        "route_added_now",
        "ui_write_action_added_now",
        "external_handoff_now",
      ],
      "no_write_closeout",
    ),
  );
  return failures;
}

function validateInvocationCloseoutSummary(value: unknown): string[] {
  const summary = asRecord(value);
  const failures: string[] = [];
  if (summary.dry_run_invocation_result_status !== "rejected_disabled_adapter") {
    failures.push("invocation_closeout_result_status_invalid");
  }
  const reasons = asArray(summary.refusal_reasons).map(asString);
  for (const reason of REQUIRED_REFUSAL_REASONS) {
    if (!reasons.includes(reason)) {
      failures.push(`invocation_closeout_refusal_${reason}_missing`);
    }
  }
  const groups = asArray(summary.trace_groups).map(asString);
  for (const group of REQUIRED_TRACE_GROUPS) {
    if (!groups.includes(group)) {
      failures.push(`invocation_closeout_trace_group_${group}_missing`);
    }
  }
  if (asNumber(summary.trace_group_count) !== REQUIRED_TRACE_GROUPS.length) {
    failures.push("invocation_closeout_trace_group_count_invalid");
  }
  if (asNumber(summary.probe_count) <= 0) {
    failures.push("invocation_closeout_probe_count_invalid");
  }
  if (asNumber(summary.failed_probe_count) !== 0) {
    failures.push("invocation_closeout_failed_probe_count_not_zero");
  }
  if (summary.dry_noop_preview_created !== true) {
    failures.push("invocation_closeout_dry_noop_preview_not_created");
  }
  if (summary.dry_noop_preview_persisted !== false) {
    failures.push("invocation_closeout_dry_noop_preview_persisted");
  }
  if (summary.dry_noop_preview_storage_target !== "local_artifact_only") {
    failures.push("invocation_closeout_dry_noop_storage_invalid");
  }
  if (summary.product_write_result !== null) {
    failures.push("invocation_closeout_product_write_result_not_null");
  }
  if (summary.product_claim_id !== null) {
    failures.push("invocation_closeout_product_claim_id_not_null");
  }
  return failures;
}

function validateProductWritePreflightCommandEnvelopePreview(
  value: unknown,
): string[] {
  const preview = asRecord(value);
  const command = asRecord(preview.command_shape_preview);
  const failures: string[] = [];
  if (
    preview.preview_kind !==
    "manual_note_single_claim_product_write_preflight_command_envelope_preview"
  ) {
    failures.push("preflight_command_envelope_preview_kind_invalid");
  }
  if (preview.preview_status !== "defined_for_next_slice_only") {
    failures.push("preflight_command_envelope_preview_status_invalid");
  }
  if (preview.executable_now !== false) {
    failures.push("preflight_command_envelope_executable_now");
  }
  if (preview.product_write_allowed_now !== false) {
    failures.push("preflight_command_envelope_product_write_allowed_now");
  }
  if (preview.product_claim_id !== null) {
    failures.push("preflight_command_envelope_product_claim_id_not_null");
  }
  if (preview.command_envelope_id !== null) {
    failures.push("preflight_command_envelope_id_not_null");
  }
  if (preview.command_envelope_persisted_now !== false) {
    failures.push("preflight_command_envelope_persisted_now");
  }
  if (
    preview.command_envelope_requires_next_slice !==
    NEXT_PREFLIGHT_COMMAND_ENVELOPE
  ) {
    failures.push("preflight_command_envelope_next_slice_invalid");
  }
  const requirements = asArray(preview.would_require).map(asString);
  for (const requirement of PREFLIGHT_REQUIREMENTS) {
    if (!requirements.includes(requirement)) {
      failures.push(`preflight_command_envelope_requirement_${requirement}_missing`);
    }
  }
  if (command.command_kind !== "manual_note_single_claim_product_write_command") {
    failures.push("preflight_command_shape_kind_invalid");
  }
  if (command.candidate_kind !== "manual_note_single_claim") {
    failures.push("preflight_command_shape_candidate_kind_invalid");
  }
  for (const key of [
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
    "idempotency_key_preview",
  ] as const) {
    if (!asString(command[key])) {
      failures.push(`preflight_command_shape_${key}_missing`);
    }
  }
  if (command.product_claim_id !== null) {
    failures.push("preflight_command_shape_product_claim_id_not_null");
  }
  if (asNumber(command.sql_statement_count_now) !== 0) {
    failures.push("preflight_command_shape_sql_statement_count_now_not_zero");
  }
  if (asNumber(command.db_write_count_now) !== 0) {
    failures.push("preflight_command_shape_db_write_count_now_not_zero");
  }
  if (command.transaction_execution_now !== false) {
    failures.push("preflight_command_shape_transaction_execution_now");
  }
  return failures;
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

function validateInvocationProbes(value: unknown): string[] {
  const probes = asArray(value).map(asRecord);
  const failures: string[] = [];
  if (probes.length === 0) failures.push("invocation_probes_missing");
  for (const probe of probes) {
    if (probe.probe_status !== "pass") {
      failures.push(`invocation_probe_${asString(probe.probe_id) || "unknown"}_not_passed`);
    }
  }
  return failures;
}

function buildReportValidationMatrix(report: JsonRecord): JsonRecord[] {
  const rowConfigs: Array<[string, string, string, (draft: JsonRecord) => void, string[]]> = [
    ["positive_noop_report_passes", "positive", "positive no-op report from committed harness passes", () => {}, []],
    ["report_status_wrong_blocks", "report_status", "report status wrong blocks", (d) => { d.noop_invocation_report_status = "wrong"; }, ["noop_invocation_report_status_not_ready"]],
    ["harness_final_status_fail_blocks", "source_harness", "harness final_status fail blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_dry_run_invocation_harness", "final_status"], "fail"), ["source_harness_final_status_not_passed"]],
    ["harness_status_blocked_blocks", "source_harness", "harness status blocked blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_dry_run_invocation_harness", "dry_run_invocation_harness_status"], "blocked"), ["source_harness_status_not_ready"]],
    ["harness_recommendation_wrong_blocks", "source_harness", "harness recommendation wrong blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_dry_run_invocation_harness", "recommendation_status"], "wrong"), ["source_harness_recommendation_not_ready"]],
    ["harness_next_slice_wrong_blocks", "source_harness", "harness next slice wrong blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_dry_run_invocation_harness", "next_recommended_slice"], "product_write"), ["source_harness_next_slice_invalid"]],
    ["adapter_invocation_attempted_false_blocks", "harness_boundary", "adapter invocation attempted false blocks", (d) => { d.adapter_invocation_attempted_now = false; }, ["adapter_invocation_attempted_now_invalid"]],
    ["adapter_runtime_invocation_true_blocks", "harness_boundary", "runtime adapter invocation true blocks", (d) => { d.adapter_invocation_executed_against_runtime = true; }, ["adapter_invocation_executed_against_runtime_invalid"]],
    ["product_write_attempted_true_blocks", "harness_boundary", "product write attempted true blocks", (d) => { d.product_write_attempted_now = true; }, ["product_write_attempted_now_invalid"]],
    ["product_write_executed_true_blocks", "harness_boundary", "product write executed true blocks", (d) => { d.product_write_executed_now = true; }, ["product_write_executed_now_invalid"]],
    ["product_write_allowed_true_blocks", "harness_boundary", "product write allowed true blocks", (d) => { d.product_write_allowed_now = true; }, ["product_write_allowed_now_invalid"]],
    ["product_write_authority_granted_true_blocks", "harness_boundary", "authority granted true blocks", (d) => { d.product_write_authority_granted_now = true; }, ["product_write_authority_granted_now_invalid"]],
    ["product_write_implementation_allowed_true_blocks", "harness_boundary", "implementation allowed true blocks", (d) => { d.product_write_implementation_allowed_now = true; }, ["product_write_implementation_allowed_now_invalid"]],
    ["product_db_write_true_blocks", "harness_boundary", "product DB write true blocks", (d) => { d.product_db_write = true; }, ["product_db_write_invalid"]],
    ["product_id_allocation_true_blocks", "harness_boundary", "product ID allocation true blocks", (d) => { d.product_id_allocation = true; }, ["product_id_allocation_invalid"]],
    ["db_open_true_blocks", "harness_boundary", "DB open true blocks", (d) => { d.db_open = true; }, ["db_open_invalid"]],
    ["sql_execution_true_blocks", "harness_boundary", "SQL execution true blocks", (d) => { d.sql_execution = true; }, ["sql_execution_invalid"]],
    ["transaction_execution_allowed_true_blocks", "harness_boundary", "transaction execution allowed true blocks", (d) => { d.transaction_execution_allowed_now = true; }, ["transaction_execution_allowed_now_invalid"]],
    ["route_added_true_blocks", "route_ui_boundary", "route added true blocks", (d) => { d.route_added = true; }, ["route_added_invalid"]],
    ["ui_write_action_added_true_blocks", "route_ui_boundary", "UI action added true blocks", (d) => { d.ui_write_action_added = true; }, ["ui_write_action_added_invalid"]],
    ["disabled_result_status_wrong_blocks", "disabled_result", "disabled result status wrong blocks", (d) => setPath(d, ["disabled_invocation_result", "result_status"], "executed"), ["disabled_invocation_result_status_invalid"]],
    ["disabled_result_product_write_attempted_true_blocks", "disabled_result", "disabled result product write attempted true blocks", (d) => setPath(d, ["disabled_invocation_result", "product_write_attempted_now"], true), ["disabled_invocation_result_product_write_attempted_now_not_false"]],
    ["disabled_result_runtime_invocation_true_blocks", "disabled_result", "disabled result runtime invocation true blocks", (d) => setPath(d, ["disabled_invocation_result", "adapter_runtime_invocation_now"], true), ["disabled_invocation_result_adapter_runtime_invocation_now_not_false"]],
    ["dry_noop_preview_missing_blocks", "dry_noop_preview", "dry noop preview missing blocks", (d) => { d.dry_noop_preview = {}; }, ["dry_noop_preview_missing"]],
    ["dry_noop_preview_persisted_true_blocks", "dry_noop_preview", "dry noop preview persisted true blocks", (d) => setPath(d, ["dry_noop_preview", "preview_persisted_now"], true), ["dry_noop_preview_persisted"]],
    ["dry_noop_preview_write_count_positive_blocks", "dry_noop_preview", "dry noop preview write count positive blocks", (d) => setPath(d, ["dry_noop_preview", "write_operation_count_now"], 1), ["dry_noop_preview_write_operation_count_now_not_zero"]],
    ["dry_noop_preview_sql_count_positive_blocks", "dry_noop_preview", "dry noop preview SQL count positive blocks", (d) => setPath(d, ["dry_noop_preview", "sql_statement_count_now"], 1), ["dry_noop_preview_sql_statement_count_now_not_zero"]],
    ["trace_group_missing_blocks", "trace", "trace group missing blocks", (d) => { d.invocation_trace = asArray(d.invocation_trace).slice(1); }, ["trace_group_source_evidence_preflight_missing"]],
    ["trace_row_product_db_write_true_blocks", "trace", "trace row product DB write true blocks", (d) => setPath(d, ["invocation_trace", 0, "product_db_write_now"], true), ["trace_dry-run-invocation-trace:01_product_db_write_now_not_false"]],
    ["trace_row_sql_execution_true_blocks", "trace", "trace row SQL true blocks", (d) => setPath(d, ["invocation_trace", 0, "sql_execution_now"], true), ["trace_dry-run-invocation-trace:01_sql_execution_now_not_false"]],
    ["probe_failure_blocks", "probes", "probe failure blocks", (d) => setPath(d, ["invocation_probes", 0, "probe_status"], "unexpected_failure"), ["invocation_probe_positive_disabled_invocation_rejected_not_passed"]],
    ["operator_raw_text_true_blocks", "operator_review_packet", "operator raw manual note true blocks", (d) => setPath(d, ["operator_review_packet", "raw_manual_note_text_included"], true), ["operator_review_packet_raw_manual_note_text_included"]],
    ["operator_may_approve_true_blocks", "operator_review_packet", "operator may approve product write true blocks", (d) => setPath(d, ["operator_review_packet", "operator_may_approve_product_write_now"], true), ["operator_may_approve_product_write_now"]],
    ["no_write_closeout_product_db_write_true_blocks", "no_write_closeout", "no-write closeout product DB write true blocks", (d) => setPath(d, ["no_write_closeout", "product_db_write_now"], true), ["no_write_closeout_product_db_write_now_not_false"]],
    ["preflight_executable_true_blocks", "preflight_preview", "preflight command envelope executable true blocks", (d) => setPath(d, ["product_write_preflight_command_envelope_preview", "executable_now"], true), ["preflight_command_envelope_executable_now"]],
    ["preflight_product_claim_id_non_null_blocks", "preflight_preview", "preflight product claim ID non-null blocks", (d) => setPath(d, ["product_write_preflight_command_envelope_preview", "product_claim_id"], "product:blocked"), ["preflight_command_envelope_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["preflight_persisted_true_blocks", "preflight_preview", "preflight command envelope persisted true blocks", (d) => setPath(d, ["product_write_preflight_command_envelope_preview", "command_envelope_persisted_now"], true), ["preflight_command_envelope_persisted_now"]],
    ["command_shape_sql_count_positive_blocks", "preflight_preview", "command shape SQL count positive blocks", (d) => setPath(d, ["product_write_preflight_command_envelope_preview", "command_shape_preview", "sql_statement_count_now"], 1), ["preflight_command_shape_sql_statement_count_now_not_zero"]],
    ["command_shape_db_write_count_positive_blocks", "preflight_preview", "command shape DB write count positive blocks", (d) => setPath(d, ["product_write_preflight_command_envelope_preview", "command_shape_preview", "db_write_count_now"], 1), ["preflight_command_shape_db_write_count_now_not_zero"]],
    ["explicit_forbidden_surface_true_blocks", "forbidden_surface", "explicit forbidden surface true blocks", (d) => setPath(d, ["explicit_forbidden_surfaces", "product_db_write"], true), ["explicit_forbidden_surface_product_db_write_not_false"]],
    ["non_null_product_id_anywhere_blocks", "product_id_contamination", "non-null product ID anywhere blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_dry_run_invocation_harness", "product_claim_id"], "product:blocked"), ["non_null_product_or_related_id_present"]],
    ["normalized_product_claim_id_blocks", "product_id_contamination", "normalized product claim ID blocks", (d) => setPath(d, ["normalized_invocation_input_summary", "normalized_product_claim_id"], "product:blocked"), ["non_null_product_or_related_id_present"]],
    ["failed_optional_harness_report_blocks", "optional_report_handling", "failed optional harness report blocks", (d) => { d.source_validation_failure_codes = ["optional_dry_run_invocation_harness_report_not_passed"]; }, ["optional_dry_run_invocation_harness_report_not_passed"]],
    ["optional_harness_report_missing_payload_blocks", "optional_report_handling", "optional harness report pass missing payload blocks", (d) => { d.source_validation_failure_codes = ["optional_dry_run_invocation_harness_report_missing_payload"]; }, ["optional_dry_run_invocation_harness_report_missing_payload"]],
    ["static_empty_delta_blocks", "static_boundary", "empty changed-file delta blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], []), ["static_boundary_changed_file_delta_empty"]],
    ["static_package_addition_outside_allowlist_blocks", "static_boundary", "package addition outside allowlist blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"], ['+    "openai": "^1.0.0",']), ["static_boundary_package_addition_outside_allowlist", "static_boundary_expected_package_script_missing"]],
    ["static_missing_expected_package_script_blocks", "static_boundary", "missing expected package script blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"], [asArray(asRecord(d.static_boundary_evidence).static_boundary_package_added_lines_inspected)[0] ?? ""]), ["static_boundary_expected_package_script_missing"]],
    ["static_schema_db_sql_changed_file_blocks", "static_boundary", "schema/db/sql changed file blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["db/schema.sql"]), ["static_boundary_schema_db_sql_changed", "static_boundary_expected_files_missing"]],
    ["static_app_router_ui_path_blocks", "static_boundary", "App Router UI path blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["app/foo/page.tsx"]), ["static_boundary_ui_changed", "static_boundary_expected_files_missing"]],
    ["static_external_call_pattern_blocks", "static_boundary", "external call pattern blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_probe_text"], `${["fet", "ch"].join("")}("https://example.com")`), ["static_boundary_network_or_external_call_present"]],
  ];
  return rowConfigs.map(([checkId, checkGroup, mutationSummary, mutate, expectedCodes]) => {
    const draft = cloneJson(report);
    mutate(draft);
    const actualFailureCodes = validateManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReport(draft);
    const actualStatus = actualFailureCodes.length === 0 ? "pass" : "fail";
    const expectedStatus = expectedCodes.length === 0 ? "pass" : "fail";
    const covered = expectedCodes.every((code) => actualFailureCodes.includes(code));
    return {
      check_id: checkId,
      check_group: checkGroup,
      mutation_summary: mutationSummary,
      expected_status: expectedStatus,
      expected_failure_codes: expectedCodes,
      actual_status: actualStatus,
      actual_failure_codes: actualFailureCodes,
      check_status:
        actualStatus === expectedStatus && covered ? "pass" : "unexpected_failure",
    };
  });
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
    static_boundary_compare_ref: asString(evidence.static_boundary_compare_ref),
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

function validateTrueRecord(
  value: unknown,
  keys: readonly string[],
  prefix: string,
): string[] {
  const record = asRecord(value);
  const failures: string[] = [];
  for (const key of keys) {
    if (record[key] !== true) failures.push(`${prefix}_${key}_not_true`);
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

function harnessSourceFinalStatus(harness: JsonRecord): string {
  const sourceStatus =
    asString(harness.source_report_final_status) || asString(harness.final_status);
  if (sourceStatus) return sourceStatus;
  return harness.dry_run_invocation_harness_status === READY_HARNESS_STATUS &&
    asRecord(harness.validation).passed === true
    ? "pass"
    : "";
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

function setPath(
  value: JsonRecord,
  path: Array<string | number>,
  nextValue: unknown,
): void {
  let cursor: unknown = value;
  for (let index = 0; index < path.length - 1; index += 1) {
    const part = path[index];
    if (typeof part === "number") {
      cursor = asArray(cursor)[part];
    } else {
      const record = asRecord(cursor);
      if (!record[part] || typeof record[part] !== "object") {
        record[part] = typeof path[index + 1] === "number" ? [] : {};
      }
      cursor = record[part];
    }
  }
  const last = path[path.length - 1];
  if (typeof last === "number") {
    asArray(cursor)[last] = nextValue;
  } else {
    asRecord(cursor)[last] = nextValue;
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
