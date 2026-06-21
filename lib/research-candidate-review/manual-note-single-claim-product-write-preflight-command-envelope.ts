export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_VERSION =
  "manual_note_single_claim_product_write_preflight_command_envelope.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildInput = {
  noopInvocationReport: unknown;
  commandEnvelopeInput?: unknown;
  staticBoundaryEvidence?: unknown;
  sourceValidationFailureCodes?: unknown;
};

const READY_ENVELOPE_STATUS = "product_write_preflight_command_envelope_only";
const BLOCKED_ENVELOPE_STATUS =
  "blocked_before_product_write_preflight_command_envelope";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_preflight_command_envelope_contract_tests";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_preflight_command_envelope_contract_tests";
const NEXT_CONTRACT_TESTS =
  "single_claim_product_write_preflight_command_envelope_contract_tests";
const RECHECK_SLICE =
  "single_claim_product_write_preflight_command_envelope_recheck";

const READY_NOOP_STATUS =
  "product_write_disabled_adapter_noop_invocation_report_only";
const READY_NOOP_RECOMMENDATION =
  "ready_for_single_claim_product_write_preflight_command_envelope";
const READY_NOOP_NEXT_SLICE =
  "single_claim_product_write_preflight_command_envelope";

const REQUIRED_REJECTION_REASONS = [
  "operator_decision_missing",
  "product_claim_schema_not_satisfied",
  "product_claim_id_allocation_not_authorized",
  "idempotency_storage_not_satisfied",
  "rollback_storage_not_satisfied",
  "audit_storage_not_satisfied",
  "observability_storage_not_satisfied",
  "adapter_not_enabled",
  "product_write_authority_not_granted",
  "product_write_implementation_not_allowed",
  "command_envelope_not_persisted",
  "db_write_not_allowed",
  "sql_execution_not_allowed",
  "transaction_execution_not_allowed",
] as const;

const EXPLICIT_FORBIDDEN_SURFACE_KEYS = [
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "product_write_authority_granted",
  "product_write_implementation",
  "command_envelope_persistence",
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
  "normalized_product_claim_id",
  "normalized_proof_id",
  "normalized_evidence_id",
  "normalized_perspective_id",
  "normalized_work_item_id",
  "command_envelope_id",
] as const;

const COMMAND_INPUT_FALSE_KEYS = [
  "raw_manual_note_text_included",
] as const;

const TOP_LEVEL_FALSE_KEYS = [
  "command_envelope_persisted_now",
  "command_envelope_executable_now",
  "product_write_allowed_now",
  "product_write_authority_granted_now",
  "product_write_implementation_allowed_now",
  "product_id_allocation",
  "product_db_write",
  "db_open",
  "sql_execution",
  "transaction_execution_now",
  "adapter_runtime_invocation_now",
  "route_added",
  "ui_write_action_added",
] as const;

const PREVIEW_FALSE_KEYS = [
  "preview_persisted_now",
  "preview_executed_now",
  "durable_write_now",
  "db_open_now",
  "sql_execution_now",
  "transaction_execution_now",
  "product_id_allocation_now",
  "product_db_write_now",
  "proof_evidence_write_now",
  "perspective_or_canonical_graph_write_now",
  "work_item_creation_now",
] as const;

export function buildManualNoteSingleClaimProductWritePreflightCommandEnvelope(
  input: BuildInput,
): JsonRecord {
  const noopInvocationReport = asRecord(input.noopInvocationReport);
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const staticBoundaryEvidence = normalizeStaticBoundaryEvidence(
    input.staticBoundaryEvidence,
  );
  const sourceEvidence = buildSourceEvidence(noopInvocationReport);
  const commandEnvelopeInput = buildCommandEnvelopeInput(
    noopInvocationReport,
    input.commandEnvelopeInput,
  );
  const commandEnvelopeInputSummary =
    summarizeCommandEnvelopeInput(commandEnvelopeInput);
  const productClaimDraftPreview =
    buildProductClaimDraftPreview(commandEnvelopeInput);
  const idempotencyPreview = buildStoragePreview(
    "idempotency_preview",
    commandEnvelopeInput,
  );
  const rollbackPreview = buildStoragePreview(
    "rollback_preview",
    commandEnvelopeInput,
  );
  const auditPreview = buildStoragePreview("audit_preview", commandEnvelopeInput);
  const observabilityPreview = buildStoragePreview(
    "observability_preview",
    commandEnvelopeInput,
  );
  const noWritePreflightCloseout = buildNoWritePreflightCloseout();
  const seedFailures = unique([
    ...sourceValidationFailureCodes,
    ...validateNoopInvocationReportReadiness(noopInvocationReport),
    ...validateStaticBoundaryEvidence(staticBoundaryEvidence),
  ]);
  const seedReady = seedFailures.length === 0;
  const core = {
    preflight_command_envelope_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope",
    preflight_command_envelope_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_VERSION,
    preflight_command_envelope_fingerprint: "",
    source_validation_failure_codes: sourceValidationFailureCodes,
    source_evidence: sourceEvidence,
    preflight_command_envelope_status: seedReady
      ? READY_ENVELOPE_STATUS
      : BLOCKED_ENVELOPE_STATUS,
    command_envelope_created_now: true,
    command_envelope_persisted_now: false,
    command_envelope_executable_now: false,
    product_write_allowed_now: false,
    product_write_authority_granted_now: false,
    product_write_implementation_allowed_now: false,
    product_claim_id: null,
    product_id_allocation: false,
    product_db_write: false,
    db_open: false,
    sql_execution: false,
    transaction_execution_now: false,
    adapter_runtime_invocation_now: false,
    route_added: false,
    ui_write_action_added: false,
    preflight_command_envelope: {
      command_kind: "manual_note_single_claim_product_write_command",
      command_status: "preflight_shape_only",
      command_envelope_created_now: true,
      command_envelope_persisted_now: false,
      command_envelope_executable_now: false,
      product_write_allowed_now: false,
      product_claim_id: null,
      command_envelope_id: null,
      input: commandEnvelopeInput,
      product_claim_draft_preview: productClaimDraftPreview,
      idempotency_preview: idempotencyPreview,
      rollback_preview: rollbackPreview,
      audit_preview: auditPreview,
      observability_preview: observabilityPreview,
      write_operation_count_now: 0,
      db_write_count_now: 0,
      sql_statement_count_now: 0,
      transaction_execution_now: false,
    },
    command_envelope_input: commandEnvelopeInput,
    command_envelope_input_summary: commandEnvelopeInputSummary,
    product_claim_draft_preview: productClaimDraftPreview,
    idempotency_preview: idempotencyPreview,
    rollback_preview: rollbackPreview,
    audit_preview: auditPreview,
    observability_preview: observabilityPreview,
    preflight_rejection_reasons: REQUIRED_REJECTION_REASONS,
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    static_boundary_evidence: staticBoundaryEvidence,
    no_write_preflight_closeout: noWritePreflightCloseout,
    validation: {
      passed: seedReady,
      failure_codes: seedFailures,
    },
    recommendation_status: seedReady
      ? READY_RECOMMENDATION
      : BLOCKED_RECOMMENDATION,
    next_recommended_slice: seedReady ? NEXT_CONTRACT_TESTS : RECHECK_SLICE,
  };
  const validationMatrix = buildPreflightValidationMatrix(core);
  const matrixFailures = validationMatrix
    .filter((row) => row.check_status !== "pass")
    .map((row) => `validation_matrix_${asString(row.check_id)}_${asString(row.check_status)}`);
  const finalFailures = unique([...seedFailures, ...matrixFailures]);
  const finalReady = finalFailures.length === 0;
  const envelopeWithoutFingerprint = {
    ...core,
    preflight_command_envelope_status: finalReady
      ? READY_ENVELOPE_STATUS
      : BLOCKED_ENVELOPE_STATUS,
    preflight_validation_matrix: validationMatrix,
    validation: {
      passed: finalReady,
      failure_codes: finalFailures,
    },
    recommendation_status: finalReady
      ? READY_RECOMMENDATION
      : BLOCKED_RECOMMENDATION,
    next_recommended_slice: finalReady ? NEXT_CONTRACT_TESTS : RECHECK_SLICE,
  };
  const fingerprint =
    createManualNoteSingleClaimProductWritePreflightCommandEnvelopeFingerprint(
      envelopeWithoutFingerprint,
    );
  return {
    ...envelopeWithoutFingerprint,
    preflight_command_envelope_fingerprint: fingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Single-Claim Product Write Preflight Command Envelope",
        "",
        "Product write preflight command envelope only.",
        "The command envelope is non-persisted, non-executing, and product write remains blocked.",
        `preflight_command_envelope_status: ${envelopeWithoutFingerprint.preflight_command_envelope_status}`,
        `preflight_command_envelope_fingerprint: ${fingerprint}`,
        `next_recommended_slice: ${envelopeWithoutFingerprint.next_recommended_slice}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          preflight_command_envelope_status:
            envelopeWithoutFingerprint.preflight_command_envelope_status,
          command_envelope_created_now: true,
          command_envelope_persisted_now: false,
          command_envelope_executable_now: false,
          product_write_allowed_now: false,
          product_claim_id: null,
          db_open: false,
          sql_execution: false,
          transaction_execution_now: false,
          next_recommended_slice:
            envelopeWithoutFingerprint.next_recommended_slice,
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

export function validateManualNoteSingleClaimProductWritePreflightCommandEnvelope(
  value: unknown,
): string[] {
  const envelope = asRecord(value);
  const failures: string[] = [];
  failures.push(...asArray(envelope.source_validation_failure_codes).map(asString));
  if (envelope.preflight_command_envelope_status !== READY_ENVELOPE_STATUS) {
    failures.push("preflight_command_envelope_status_not_ready");
  }
  if (
    envelope.preflight_command_envelope_kind !==
    "manual_note_single_claim_product_write_preflight_command_envelope"
  ) {
    failures.push("preflight_command_envelope_kind_invalid");
  }
  if (
    envelope.preflight_command_envelope_version !==
    MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_VERSION
  ) {
    failures.push("preflight_command_envelope_version_invalid");
  }
  if (envelope.command_envelope_created_now !== true) {
    failures.push("command_envelope_created_now_not_true");
  }
  failures.push(
    ...validateFalseRecord(envelope, TOP_LEVEL_FALSE_KEYS, "preflight"),
  );
  if (envelope.product_claim_id !== null) {
    failures.push("preflight_product_claim_id_not_null");
  }
  failures.push(...validateSourceEvidence(envelope.source_evidence));
  failures.push(
    ...validateCommandEnvelopeInput(envelope.command_envelope_input),
  );
  failures.push(
    ...validateCommandEnvelopeInputSummary(
      envelope.command_envelope_input_summary,
    ),
  );
  failures.push(
    ...validateProductClaimDraftPreview(envelope.product_claim_draft_preview),
  );
  failures.push(...validatePreview(envelope.idempotency_preview, "idempotency"));
  failures.push(...validatePreview(envelope.rollback_preview, "rollback"));
  failures.push(...validatePreview(envelope.audit_preview, "audit"));
  failures.push(
    ...validatePreview(envelope.observability_preview, "observability"),
  );
  failures.push(
    ...validateNoWritePreflightCloseout(
      envelope.no_write_preflight_closeout,
    ),
  );
  failures.push(
    ...validateFalseRecord(
      envelope.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS,
      "explicit_forbidden_surface",
    ),
  );
  failures.push(
    ...validatePreflightRejectionReasons(envelope.preflight_rejection_reasons),
  );
  failures.push(...validateStaticBoundaryEvidence(envelope.static_boundary_evidence));
  failures.push(
    ...validateNestedPreflightCommandEnvelope(
      envelope.preflight_command_envelope,
    ),
  );
  if (hasNonNullProductIds(envelope)) {
    failures.push("non_null_product_or_related_id_present");
  }
  if (envelope.recommendation_status !== READY_RECOMMENDATION) {
    failures.push("recommendation_status_not_ready");
  }
  if (envelope.next_recommended_slice !== NEXT_CONTRACT_TESTS) {
    failures.push("next_recommended_slice_invalid");
  }
  if (asString(envelope.next_recommended_slice).includes("product_write_implementation")) {
    failures.push("product_write_implementation_recommended");
  }
  return unique(failures);
}

export function createManualNoteSingleClaimProductWritePreflightCommandEnvelopeFingerprint(
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

function buildSourceEvidence(noop: JsonRecord): JsonRecord {
  const source = asRecord(noop.source_evidence);
  const harness = asRecord(source.disabled_adapter_dry_run_invocation_harness);
  const contractTests = asRecord(source.disabled_adapter_contract_tests);
  const skeleton = asRecord(source.disabled_adapter_skeleton);
  const authority = asRecord(source.authority_contract_bundle);
  const gate = asRecord(source.product_write_gate_design);
  const operatorPacket = asRecord(noop.operator_review_packet);
  const closeout = asRecord(noop.no_write_closeout);
  const invocationCloseout = asRecord(noop.invocation_closeout_summary);
  const preview = asRecord(noop.product_write_preflight_command_envelope_preview);
  return {
    noop_invocation_report: {
      noop_invocation_report_fingerprint: asString(
        noop.noop_invocation_report_fingerprint,
      ),
      final_status: sourceNoopFinalStatus(noop),
      noop_invocation_report_status: asString(noop.noop_invocation_report_status),
      recommendation_status: asString(noop.recommendation_status),
      next_recommended_slice: asString(noop.next_recommended_slice),
      validation_passed: asRecord(noop.validation).passed === true,
    },
    operator_review_packet: {
      review_packet_status: asString(operatorPacket.review_packet_status),
      operator_decision_required_before_product_write:
        operatorPacket.operator_decision_required_before_product_write === true,
      operator_decision_satisfied_now:
        operatorPacket.operator_decision_satisfied_now === true,
      operator_may_approve_product_write_now:
        operatorPacket.operator_may_approve_product_write_now === true,
      raw_manual_note_text_included:
        operatorPacket.raw_manual_note_text_included === true,
    },
    no_write_closeout: {
      closeout_status: asString(closeout.closeout_status),
      runtime_adapter_invocation_now:
        closeout.runtime_adapter_invocation_now === true,
      product_write_attempted_now: closeout.product_write_attempted_now === true,
      product_write_executed_now: closeout.product_write_executed_now === true,
      product_db_write_now: closeout.product_db_write_now === true,
      product_id_allocation_now: closeout.product_id_allocation_now === true,
      db_open_now: closeout.db_open_now === true,
      sql_execution_now: closeout.sql_execution_now === true,
      transaction_execution_now: closeout.transaction_execution_now === true,
      durable_records_created_now: closeout.durable_records_created_now === true,
      route_added_now: closeout.route_added_now === true,
      ui_write_action_added_now: closeout.ui_write_action_added_now === true,
      external_handoff_now: closeout.external_handoff_now === true,
    },
    invocation_closeout_summary: {
      dry_run_invocation_result_status: asString(
        invocationCloseout.dry_run_invocation_result_status,
      ),
      failed_probe_count: asNumber(invocationCloseout.failed_probe_count),
      probe_count: asNumber(invocationCloseout.probe_count),
      product_write_result: invocationCloseout.product_write_result ?? null,
      product_claim_id: invocationCloseout.product_claim_id ?? null,
    },
    noop_preflight_command_envelope_preview: {
      preview_status: asString(preview.preview_status),
      executable_now: preview.executable_now === true,
      persisted_now: preview.command_envelope_persisted_now === true,
      product_write_allowed_now: preview.product_write_allowed_now === true,
      product_claim_id: preview.product_claim_id ?? null,
      command_envelope_id: preview.command_envelope_id ?? null,
    },
    disabled_adapter_dry_run_invocation_harness: {
      dry_run_invocation_harness_fingerprint: asString(
        harness.dry_run_invocation_harness_fingerprint,
      ),
      final_status: asString(harness.final_status),
      dry_run_invocation_harness_status: asString(
        harness.dry_run_invocation_harness_status,
      ),
    },
    disabled_adapter_contract_tests: {
      suite_fingerprint: asString(contractTests.suite_fingerprint),
      final_status: asString(contractTests.final_status),
      contract_suite_status: asString(contractTests.contract_suite_status),
      total_cases: asNumber(contractTests.total_cases),
    },
    disabled_adapter_skeleton: {
      disabled_adapter_skeleton_fingerprint: asString(
        skeleton.disabled_adapter_skeleton_fingerprint,
      ),
      disabled_adapter_skeleton_status: asString(
        skeleton.disabled_adapter_skeleton_status,
      ),
      adapter_enabled: skeleton.adapter_enabled === true,
    },
    authority_contract_bundle: {
      authority_contract_bundle_fingerprint: asString(
        authority.authority_contract_bundle_fingerprint,
      ),
      authority_contract_bundle_status: asString(
        authority.authority_contract_bundle_status,
      ),
      authority_gap_summary: authority.authority_gap_summary ?? {},
    },
    product_write_gate_design: {
      design_fingerprint: asString(gate.design_fingerprint),
      gate_design_status: asString(gate.gate_design_status),
      recommendation_status: asString(gate.recommendation_status),
    },
  };
}

function buildCommandEnvelopeInput(
  noop: JsonRecord,
  commandEnvelopeInput: unknown,
): JsonRecord {
  const overrides = asRecord(commandEnvelopeInput);
  const operatorPacket = asRecord(noop.operator_review_packet);
  const source = asRecord(noop.source_evidence);
  const harness = asRecord(source.disabled_adapter_dry_run_invocation_harness);
  const authority = asRecord(source.authority_contract_bundle);
  return {
    input_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_input",
    candidate_kind: "manual_note_single_claim",
    noop_invocation_report_fingerprint:
      asString(overrides.noop_invocation_report_fingerprint) ||
      asString(noop.noop_invocation_report_fingerprint),
    dry_run_invocation_harness_fingerprint:
      asString(overrides.dry_run_invocation_harness_fingerprint) ||
      asString(harness.dry_run_invocation_harness_fingerprint),
    authority_contract_bundle_fingerprint:
      asString(overrides.authority_contract_bundle_fingerprint) ||
      asString(authority.authority_contract_bundle_fingerprint),
    selected_temp_claim_record_id:
      asString(overrides.selected_temp_claim_record_id) ||
      asString(operatorPacket.selected_temp_claim_record_id),
    source_operation_id:
      asString(overrides.source_operation_id) ||
      asString(operatorPacket.source_operation_id),
    source_temp_intent_id:
      asString(overrides.source_temp_intent_id) ||
      asString(operatorPacket.source_temp_intent_id),
    temp_idempotency_key:
      asString(overrides.temp_idempotency_key) ||
      asString(operatorPacket.temp_idempotency_key),
    operator_decision_reference: null,
    operator_decision_required: true,
    operator_decision_satisfied_now: false,
    raw_manual_note_text_included: false,
    product_claim_id: null,
    db_path: null,
    sql_text: null,
    route_request: null,
    ui_action_request: null,
  };
}

function summarizeCommandEnvelopeInput(input: JsonRecord): JsonRecord {
  return {
    input_kind: asString(input.input_kind),
    candidate_kind: asString(input.candidate_kind),
    noop_invocation_report_fingerprint: asString(
      input.noop_invocation_report_fingerprint,
    ),
    dry_run_invocation_harness_fingerprint: asString(
      input.dry_run_invocation_harness_fingerprint,
    ),
    authority_contract_bundle_fingerprint: asString(
      input.authority_contract_bundle_fingerprint,
    ),
    selected_temp_claim_record_id: asString(input.selected_temp_claim_record_id),
    source_operation_id: asString(input.source_operation_id),
    source_temp_intent_id: asString(input.source_temp_intent_id),
    temp_idempotency_key: asString(input.temp_idempotency_key),
    operator_decision_required: input.operator_decision_required === true,
    operator_decision_satisfied_now:
      input.operator_decision_satisfied_now === true,
    raw_manual_note_text_included: input.raw_manual_note_text_included === true,
    product_claim_id: input.product_claim_id ?? null,
    db_path: input.db_path ?? null,
    sql_text: input.sql_text ?? null,
    route_request: input.route_request ?? null,
    ui_action_request: input.ui_action_request ?? null,
  };
}

function buildProductClaimDraftPreview(input: JsonRecord): JsonRecord {
  return {
    draft_kind: "manual_note_single_claim_product_claim_draft_preview",
    draft_status: "preflight_shape_only",
    product_claim_id: null,
    selected_temp_claim_record_id: asString(input.selected_temp_claim_record_id),
    source_operation_id: asString(input.source_operation_id),
    source_temp_intent_id: asString(input.source_temp_intent_id),
    source_temp_idempotency_key: asString(input.temp_idempotency_key),
    product_claim_schema_contract_required: true,
    schema_satisfied_now: false,
    raw_manual_note_text_included: false,
    allowed_fields_preview: [
      "claim_text_normalized_placeholder",
      "source_temp_intent_reference",
      "source_operation_reference",
      "operator_decision_reference",
      "idempotency_key_reference",
    ],
    nullability_preview: {
      product_claim_id: null,
      proof_id: null,
      evidence_id: null,
      perspective_id: null,
      work_item_id: null,
      raw_manual_note_text: null,
      db_path: null,
      sql_text: null,
    },
    write_operation_count_now: 0,
    db_write_count_now: 0,
    sql_statement_count_now: 0,
  };
}

function buildStoragePreview(previewName: string, input: JsonRecord): JsonRecord {
  return {
    preview_kind: `manual_note_single_claim_product_write_${previewName}`,
    preview_status: "preflight_shape_only",
    preview_persisted_now: false,
    preview_executed_now: false,
    durable_write_now: false,
    db_open_now: false,
    sql_execution_now: false,
    transaction_execution_now: false,
    product_id_allocation_now: false,
    product_db_write_now: false,
    proof_evidence_write_now: false,
    perspective_or_canonical_graph_write_now: false,
    work_item_creation_now: false,
    product_claim_id: null,
    product_idempotency_record_id: null,
    product_rollback_record_id: null,
    product_audit_record_id: null,
    product_observability_record_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    work_item_id: null,
    source_temp_idempotency_key: asString(input.temp_idempotency_key),
    storage_contract_required: true,
    storage_contract_satisfied_now: false,
  };
}

function buildNoWritePreflightCloseout(): JsonRecord {
  return {
    closeout_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_no_write_closeout",
    closeout_status: "no_write_preflight_command_envelope_only",
    command_envelope_created_now: true,
    command_envelope_persisted_now: false,
    command_envelope_executable_now: false,
    product_write_allowed_now: false,
    product_write_executed_now: false,
    product_db_write_now: false,
    product_id_allocation_now: false,
    db_open_now: false,
    sql_execution_now: false,
    transaction_execution_now: false,
    transaction_commit_now: false,
    transaction_rollback_execution_now: false,
    adapter_runtime_invocation_now: false,
    route_added_now: false,
    ui_write_action_added_now: false,
    proof_evidence_write_now: false,
    perspective_or_canonical_graph_write_now: false,
    work_item_creation_now: false,
    source_fetch_now: false,
    provider_or_openai_call_now: false,
    retrieval_or_rag_now: false,
    external_handoff_now: false,
    browser_persistence_now: false,
    durable_idempotency_write_now: false,
    durable_rollback_write_now: false,
    durable_audit_write_now: false,
    durable_observability_write_now: false,
  };
}

function validateNoopInvocationReportReadiness(noop: JsonRecord): string[] {
  const failures: string[] = [];
  const operatorPacket = asRecord(noop.operator_review_packet);
  const closeout = asRecord(noop.no_write_closeout);
  const invocationCloseout = asRecord(noop.invocation_closeout_summary);
  const preview = asRecord(noop.product_write_preflight_command_envelope_preview);
  if (sourceNoopFinalStatus(noop) !== "pass") {
    failures.push("source_noop_invocation_report_final_status_not_passed");
  }
  if (noop.noop_invocation_report_status !== READY_NOOP_STATUS) {
    failures.push("source_noop_invocation_report_status_not_ready");
  }
  if (noop.recommendation_status !== READY_NOOP_RECOMMENDATION) {
    failures.push("source_noop_invocation_report_recommendation_not_ready");
  }
  if (noop.next_recommended_slice !== READY_NOOP_NEXT_SLICE) {
    failures.push("source_noop_invocation_report_next_slice_invalid");
  }
  if (asRecord(noop.validation).passed !== true) {
    failures.push("source_noop_invocation_report_validation_not_passed");
  }
  if (
    operatorPacket.operator_decision_required_before_product_write !== true
  ) {
    failures.push("source_operator_decision_requirement_missing");
  }
  if (operatorPacket.operator_decision_satisfied_now !== false) {
    failures.push("source_operator_decision_satisfied_now");
  }
  if (operatorPacket.operator_may_approve_product_write_now !== false) {
    failures.push("source_operator_may_approve_product_write_now");
  }
  if (closeout.closeout_status !== "no_write_observed") {
    failures.push("source_no_write_closeout_status_invalid");
  }
  for (const key of [
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
  ] as const) {
    if (closeout[key] !== false) {
      failures.push(`source_no_write_closeout_${key}_not_false`);
    }
  }
  if (
    invocationCloseout.dry_run_invocation_result_status !==
    "rejected_disabled_adapter"
  ) {
    failures.push("source_invocation_closeout_result_status_invalid");
  }
  if (asNumber(invocationCloseout.failed_probe_count) !== 0) {
    failures.push("source_invocation_closeout_failed_probe_count_not_zero");
  }
  if (preview.executable_now !== false) {
    failures.push("source_preflight_preview_executable_now");
  }
  if (preview.command_envelope_persisted_now !== false) {
    failures.push("source_preflight_preview_persisted_now");
  }
  if (preview.product_write_allowed_now !== false) {
    failures.push("source_preflight_preview_product_write_allowed_now");
  }
  if (preview.product_claim_id !== null) {
    failures.push("source_preflight_preview_product_claim_id_not_null");
  }
  if (preview.command_envelope_id !== null) {
    failures.push("source_preflight_preview_command_envelope_id_not_null");
  }
  failures.push(
    ...validateFalseRecord(
      noop.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS,
      "source_forbidden_surface",
    ),
  );
  if (hasNonNullProductIds(noop)) {
    failures.push("source_non_null_product_or_related_id_present");
  }
  return unique(failures);
}

function validateSourceEvidence(value: unknown): string[] {
  const source = asRecord(value);
  const failures: string[] = [];
  const noop = asRecord(source.noop_invocation_report);
  if (noop.final_status !== "pass") {
    failures.push("source_evidence_noop_final_status_not_passed");
  }
  if (noop.noop_invocation_report_status !== READY_NOOP_STATUS) {
    failures.push("source_evidence_noop_status_not_ready");
  }
  if (noop.recommendation_status !== READY_NOOP_RECOMMENDATION) {
    failures.push("source_evidence_noop_recommendation_not_ready");
  }
  if (noop.next_recommended_slice !== READY_NOOP_NEXT_SLICE) {
    failures.push("source_evidence_noop_next_slice_invalid");
  }
  if (noop.validation_passed !== true) {
    failures.push("source_evidence_noop_validation_not_passed");
  }
  const operator = asRecord(source.operator_review_packet);
  if (operator.operator_decision_required_before_product_write !== true) {
    failures.push("source_evidence_operator_decision_requirement_missing");
  }
  if (operator.operator_decision_satisfied_now !== false) {
    failures.push("source_evidence_operator_decision_satisfied_now");
  }
  if (operator.operator_may_approve_product_write_now !== false) {
    failures.push("source_evidence_operator_may_approve_product_write_now");
  }
  if (operator.raw_manual_note_text_included !== false) {
    failures.push("source_evidence_operator_raw_manual_note_text_included");
  }
  const closeout = asRecord(source.no_write_closeout);
  if (closeout.closeout_status !== "no_write_observed") {
    failures.push("source_evidence_no_write_closeout_status_invalid");
  }
  for (const key of [
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
  ] as const) {
    if (closeout[key] !== false) {
      failures.push(`source_evidence_no_write_closeout_${key}_not_false`);
    }
  }
  const invocation = asRecord(source.invocation_closeout_summary);
  if (
    invocation.dry_run_invocation_result_status !==
    "rejected_disabled_adapter"
  ) {
    failures.push("source_evidence_invocation_result_status_invalid");
  }
  if (asNumber(invocation.failed_probe_count) !== 0) {
    failures.push("source_evidence_invocation_failed_probe_count_not_zero");
  }
  const preview = asRecord(source.noop_preflight_command_envelope_preview);
  if (preview.executable_now !== false) {
    failures.push("source_evidence_noop_preview_executable_now");
  }
  if (preview.persisted_now !== false) {
    failures.push("source_evidence_noop_preview_persisted_now");
  }
  if (preview.product_write_allowed_now !== false) {
    failures.push("source_evidence_noop_preview_product_write_allowed_now");
  }
  if (preview.product_claim_id !== null) {
    failures.push("source_evidence_noop_preview_product_claim_id_not_null");
  }
  const harness = asRecord(source.disabled_adapter_dry_run_invocation_harness);
  if (harness.final_status !== "pass") {
    failures.push("source_evidence_dry_run_harness_final_status_not_passed");
  }
  if (
    harness.dry_run_invocation_harness_status !==
    "product_write_disabled_adapter_dry_run_invocation_harness_only"
  ) {
    failures.push("source_evidence_dry_run_harness_status_not_ready");
  }
  const contractTests = asRecord(source.disabled_adapter_contract_tests);
  if (contractTests.final_status !== "pass") {
    failures.push("source_evidence_contract_tests_final_status_not_passed");
  }
  if (
    contractTests.contract_suite_status !==
    "product_write_disabled_adapter_contract_tests_passed"
  ) {
    failures.push("source_evidence_contract_suite_status_not_ready");
  }
  const skeleton = asRecord(source.disabled_adapter_skeleton);
  if (
    skeleton.disabled_adapter_skeleton_status !==
    "product_write_disabled_adapter_skeleton_only"
  ) {
    failures.push("source_evidence_disabled_adapter_skeleton_status_not_ready");
  }
  if (skeleton.adapter_enabled !== false) {
    failures.push("source_evidence_disabled_adapter_skeleton_enabled");
  }
  const authority = asRecord(source.authority_contract_bundle);
  if (
    authority.authority_contract_bundle_status !==
    "product_write_authority_contracts_defined_only"
  ) {
    failures.push("source_evidence_authority_contract_bundle_status_not_ready");
  }
  const gate = asRecord(source.product_write_gate_design);
  if (gate.gate_design_status !== "product_write_gate_design_only") {
    failures.push("source_evidence_product_write_gate_design_status_not_ready");
  }
  return failures;
}

function validateCommandEnvelopeInput(value: unknown): string[] {
  const input = asRecord(value);
  const failures: string[] = [];
  if (
    input.input_kind !==
    "manual_note_single_claim_product_write_preflight_command_envelope_input"
  ) {
    failures.push("command_envelope_input_kind_invalid");
  }
  if (input.candidate_kind !== "manual_note_single_claim") {
    failures.push("command_envelope_input_candidate_kind_invalid");
  }
  for (const key of [
    "noop_invocation_report_fingerprint",
    "dry_run_invocation_harness_fingerprint",
    "authority_contract_bundle_fingerprint",
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
  ] as const) {
    if (!asString(input[key])) failures.push(`command_envelope_input_${key}_missing`);
  }
  if (input.operator_decision_reference !== null) {
    failures.push("command_envelope_input_operator_decision_reference_not_null");
  }
  if (input.operator_decision_required !== true) {
    failures.push("command_envelope_input_operator_decision_required_not_true");
  }
  if (input.operator_decision_satisfied_now !== false) {
    failures.push("command_envelope_input_operator_decision_satisfied_now");
  }
  failures.push(
    ...validateFalseRecord(input, COMMAND_INPUT_FALSE_KEYS, "command_envelope_input"),
  );
  for (const key of [
    "product_claim_id",
    "db_path",
    "sql_text",
    "route_request",
    "ui_action_request",
  ] as const) {
    if (input[key] !== null) {
      failures.push(`command_envelope_input_${key}_not_null`);
    }
  }
  return failures;
}

function validateCommandEnvelopeInputSummary(value: unknown): string[] {
  const summary = asRecord(value);
  const failures: string[] = [];
  if (summary.raw_manual_note_text_included !== false) {
    failures.push("command_envelope_input_summary_raw_manual_note_text_included");
  }
  if (summary.operator_decision_required !== true) {
    failures.push("command_envelope_input_summary_operator_decision_required_not_true");
  }
  if (summary.operator_decision_satisfied_now !== false) {
    failures.push("command_envelope_input_summary_operator_decision_satisfied_now");
  }
  for (const key of [
    "product_claim_id",
    "db_path",
    "sql_text",
    "route_request",
    "ui_action_request",
  ] as const) {
    if (summary[key] !== null) {
      failures.push(`command_envelope_input_summary_${key}_not_null`);
    }
  }
  return failures;
}

function validateProductClaimDraftPreview(value: unknown): string[] {
  const draft = asRecord(value);
  const failures: string[] = [];
  if (draft.draft_kind !== "manual_note_single_claim_product_claim_draft_preview") {
    failures.push("product_claim_draft_preview_kind_invalid");
  }
  if (draft.draft_status !== "preflight_shape_only") {
    failures.push("product_claim_draft_preview_status_invalid");
  }
  if (draft.product_claim_id !== null) {
    failures.push("product_claim_draft_preview_product_claim_id_not_null");
  }
  if (draft.product_claim_schema_contract_required !== true) {
    failures.push("product_claim_draft_preview_schema_contract_not_required");
  }
  if (draft.schema_satisfied_now !== false) {
    failures.push("product_claim_draft_preview_schema_satisfied_now");
  }
  if (draft.raw_manual_note_text_included !== false) {
    failures.push("product_claim_draft_preview_raw_manual_note_text_included");
  }
  for (const key of [
    "write_operation_count_now",
    "db_write_count_now",
    "sql_statement_count_now",
  ] as const) {
    if (asNumber(draft[key]) !== 0) {
      failures.push(`product_claim_draft_preview_${key}_not_zero`);
    }
  }
  return failures;
}

function validatePreview(value: unknown, label: string): string[] {
  const preview = asRecord(value);
  const failures: string[] = [];
  if (preview.preview_status !== "preflight_shape_only") {
    failures.push(`${label}_preview_status_invalid`);
  }
  failures.push(...validateFalseRecord(preview, PREVIEW_FALSE_KEYS, `${label}_preview`));
  for (const key of [
    "product_claim_id",
    "product_idempotency_record_id",
    "product_rollback_record_id",
    "product_audit_record_id",
    "product_observability_record_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
  ] as const) {
    if (preview[key] !== null) {
      failures.push(`${label}_preview_${key}_not_null`);
    }
  }
  if (preview.storage_contract_required !== true) {
    failures.push(`${label}_preview_storage_contract_not_required`);
  }
  if (preview.storage_contract_satisfied_now !== false) {
    failures.push(`${label}_preview_storage_contract_satisfied_now`);
  }
  return failures;
}

function validateNoWritePreflightCloseout(value: unknown): string[] {
  const closeout = asRecord(value);
  const failures: string[] = [];
  if (
    closeout.closeout_kind !==
    "manual_note_single_claim_product_write_preflight_command_envelope_no_write_closeout"
  ) {
    failures.push("no_write_preflight_closeout_kind_invalid");
  }
  if (closeout.closeout_status !== "no_write_preflight_command_envelope_only") {
    failures.push("no_write_preflight_closeout_status_invalid");
  }
  if (closeout.command_envelope_created_now !== true) {
    failures.push("no_write_preflight_closeout_command_envelope_created_not_true");
  }
  for (const key of [
    "command_envelope_persisted_now",
    "command_envelope_executable_now",
    "product_write_allowed_now",
    "product_write_executed_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "transaction_commit_now",
    "transaction_rollback_execution_now",
    "adapter_runtime_invocation_now",
    "route_added_now",
    "ui_write_action_added_now",
    "proof_evidence_write_now",
    "perspective_or_canonical_graph_write_now",
    "work_item_creation_now",
    "source_fetch_now",
    "provider_or_openai_call_now",
    "retrieval_or_rag_now",
    "external_handoff_now",
    "browser_persistence_now",
    "durable_idempotency_write_now",
    "durable_rollback_write_now",
    "durable_audit_write_now",
    "durable_observability_write_now",
  ] as const) {
    if (closeout[key] !== false) {
      failures.push(`no_write_preflight_closeout_${key}_not_false`);
    }
  }
  return failures;
}

function validatePreflightRejectionReasons(value: unknown): string[] {
  const reasons = asArray(value).map(asString);
  const failures: string[] = [];
  for (const reason of REQUIRED_REJECTION_REASONS) {
    if (!reasons.includes(reason)) {
      failures.push(`preflight_rejection_reason_${reason}_missing`);
    }
  }
  return failures;
}

function validateNestedPreflightCommandEnvelope(value: unknown): string[] {
  const nested = asRecord(value);
  const failures: string[] = [];
  if (nested.command_kind !== "manual_note_single_claim_product_write_command") {
    failures.push("nested_preflight_command_kind_invalid");
  }
  if (nested.command_status !== "preflight_shape_only") {
    failures.push("nested_preflight_command_status_invalid");
  }
  if (nested.command_envelope_created_now !== true) {
    failures.push("nested_preflight_command_envelope_created_not_true");
  }
  for (const key of [
    "command_envelope_persisted_now",
    "command_envelope_executable_now",
    "product_write_allowed_now",
    "transaction_execution_now",
  ] as const) {
    if (nested[key] !== false) {
      failures.push(`nested_preflight_${key}_not_false`);
    }
  }
  if (nested.product_claim_id !== null) {
    failures.push("nested_preflight_product_claim_id_not_null");
  }
  if (nested.command_envelope_id !== null) {
    failures.push("nested_preflight_command_envelope_id_not_null");
  }
  for (const key of [
    "write_operation_count_now",
    "db_write_count_now",
    "sql_statement_count_now",
  ] as const) {
    if (asNumber(nested[key]) !== 0) {
      failures.push(`nested_preflight_${key}_not_zero`);
    }
  }
  return failures;
}

function buildPreflightValidationMatrix(envelope: JsonRecord): JsonRecord[] {
  const rowConfigs: Array<
    [string, string, string, (draft: JsonRecord) => void, string[]]
  > = [
    ["positive_envelope_from_committed_noop_report_passes", "positive", "positive envelope from committed no-op report passes", () => {}, []],
    ["noop_report_failed_blocks", "source_noop", "no-op report failed blocks", (d) => setPath(d, ["source_evidence", "noop_invocation_report", "final_status"], "fail"), ["source_evidence_noop_final_status_not_passed"]],
    ["noop_report_status_blocked_blocks", "source_noop", "no-op report status blocked blocks", (d) => setPath(d, ["source_evidence", "noop_invocation_report", "noop_invocation_report_status"], "blocked"), ["source_evidence_noop_status_not_ready"]],
    ["noop_report_recommendation_wrong_blocks", "source_noop", "no-op report recommendation wrong blocks", (d) => setPath(d, ["source_evidence", "noop_invocation_report", "recommendation_status"], "wrong"), ["source_evidence_noop_recommendation_not_ready"]],
    ["noop_report_next_slice_wrong_blocks", "source_noop", "no-op report next slice wrong blocks", (d) => setPath(d, ["source_evidence", "noop_invocation_report", "next_recommended_slice"], "product_write_implementation"), ["source_evidence_noop_next_slice_invalid"]],
    ["noop_report_validation_false_blocks", "source_noop", "no-op report validation false blocks", (d) => setPath(d, ["source_evidence", "noop_invocation_report", "validation_passed"], false), ["source_evidence_noop_validation_not_passed"]],
    ["operator_decision_required_false_blocks", "operator", "operator decision requirement missing blocks", (d) => setPath(d, ["source_evidence", "operator_review_packet", "operator_decision_required_before_product_write"], false), ["source_evidence_operator_decision_requirement_missing"]],
    ["operator_decision_satisfied_now_true_blocks", "operator", "operator decision satisfied now true blocks", (d) => setPath(d, ["source_evidence", "operator_review_packet", "operator_decision_satisfied_now"], true), ["source_evidence_operator_decision_satisfied_now"]],
    ["operator_may_approve_product_write_now_true_blocks", "operator", "operator may approve product write now true blocks", (d) => setPath(d, ["source_evidence", "operator_review_packet", "operator_may_approve_product_write_now"], true), ["source_evidence_operator_may_approve_product_write_now"]],
    ["source_operator_raw_manual_note_text_true_blocks", "operator", "operator raw manual note text true blocks", (d) => setPath(d, ["source_evidence", "operator_review_packet", "raw_manual_note_text_included"], true), ["source_evidence_operator_raw_manual_note_text_included"]],
    ["no_write_closeout_status_wrong_blocks", "no_write", "no-write closeout status wrong blocks", (d) => setPath(d, ["source_evidence", "no_write_closeout", "closeout_status"], "write_observed"), ["source_evidence_no_write_closeout_status_invalid"]],
    ["no_write_closeout_product_db_write_true_blocks", "no_write", "no-write closeout product DB write true blocks", (d) => setPath(d, ["source_evidence", "no_write_closeout", "product_db_write_now"], true), ["source_evidence_no_write_closeout_product_db_write_now_not_false"]],
    ["no_write_closeout_db_open_true_blocks", "no_write", "no-write closeout DB open true blocks", (d) => setPath(d, ["source_evidence", "no_write_closeout", "db_open_now"], true), ["source_evidence_no_write_closeout_db_open_now_not_false"]],
    ["no_write_closeout_sql_execution_true_blocks", "no_write", "no-write closeout SQL execution true blocks", (d) => setPath(d, ["source_evidence", "no_write_closeout", "sql_execution_now"], true), ["source_evidence_no_write_closeout_sql_execution_now_not_false"]],
    ["no_write_closeout_transaction_execution_true_blocks", "no_write", "no-write closeout transaction execution true blocks", (d) => setPath(d, ["source_evidence", "no_write_closeout", "transaction_execution_now"], true), ["source_evidence_no_write_closeout_transaction_execution_now_not_false"]],
    ["invocation_closeout_status_wrong_blocks", "invocation", "invocation closeout status wrong blocks", (d) => setPath(d, ["source_evidence", "invocation_closeout_summary", "dry_run_invocation_result_status"], "executed"), ["source_evidence_invocation_result_status_invalid"]],
    ["invocation_closeout_failed_probe_count_positive_blocks", "invocation", "invocation closeout failed probe count positive blocks", (d) => setPath(d, ["source_evidence", "invocation_closeout_summary", "failed_probe_count"], 1), ["source_evidence_invocation_failed_probe_count_not_zero"]],
    ["noop_preview_executable_now_true_blocks", "noop_preview", "no-op preview executable now true blocks", (d) => setPath(d, ["source_evidence", "noop_preflight_command_envelope_preview", "executable_now"], true), ["source_evidence_noop_preview_executable_now"]],
    ["noop_preview_persisted_now_true_blocks", "noop_preview", "no-op preview persisted now true blocks", (d) => setPath(d, ["source_evidence", "noop_preflight_command_envelope_preview", "persisted_now"], true), ["source_evidence_noop_preview_persisted_now"]],
    ["noop_preview_product_write_allowed_now_true_blocks", "noop_preview", "no-op preview product write allowed now true blocks", (d) => setPath(d, ["source_evidence", "noop_preflight_command_envelope_preview", "product_write_allowed_now"], true), ["source_evidence_noop_preview_product_write_allowed_now"]],
    ["noop_preview_product_claim_id_non_null_blocks", "noop_preview", "no-op preview product claim ID non-null blocks", (d) => setPath(d, ["source_evidence", "noop_preflight_command_envelope_preview", "product_claim_id"], "product:blocked"), ["source_evidence_noop_preview_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["command_envelope_persisted_now_true_blocks", "top_level", "command envelope persisted now true blocks", (d) => { d.command_envelope_persisted_now = true; }, ["preflight_command_envelope_persisted_now_not_false"]],
    ["command_envelope_executable_now_true_blocks", "top_level", "command envelope executable now true blocks", (d) => { d.command_envelope_executable_now = true; }, ["preflight_command_envelope_executable_now_not_false"]],
    ["product_write_allowed_now_true_blocks", "top_level", "product write allowed now true blocks", (d) => { d.product_write_allowed_now = true; }, ["preflight_product_write_allowed_now_not_false"]],
    ["product_write_authority_granted_now_true_blocks", "top_level", "product write authority granted now true blocks", (d) => { d.product_write_authority_granted_now = true; }, ["preflight_product_write_authority_granted_now_not_false"]],
    ["product_write_implementation_allowed_now_true_blocks", "top_level", "product write implementation allowed now true blocks", (d) => { d.product_write_implementation_allowed_now = true; }, ["preflight_product_write_implementation_allowed_now_not_false"]],
    ["product_claim_id_non_null_blocks", "top_level", "product claim ID non-null blocks", (d) => { d.product_claim_id = "product:blocked"; }, ["preflight_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["product_id_allocation_true_blocks", "top_level", "product ID allocation true blocks", (d) => { d.product_id_allocation = true; }, ["preflight_product_id_allocation_not_false"]],
    ["product_db_write_true_blocks", "top_level", "product DB write true blocks", (d) => { d.product_db_write = true; }, ["preflight_product_db_write_not_false"]],
    ["db_open_true_blocks", "top_level", "DB open true blocks", (d) => { d.db_open = true; }, ["preflight_db_open_not_false"]],
    ["sql_execution_true_blocks", "top_level", "SQL execution true blocks", (d) => { d.sql_execution = true; }, ["preflight_sql_execution_not_false"]],
    ["transaction_execution_now_true_blocks", "top_level", "transaction execution now true blocks", (d) => { d.transaction_execution_now = true; }, ["preflight_transaction_execution_now_not_false"]],
    ["adapter_runtime_invocation_now_true_blocks", "top_level", "adapter runtime invocation now true blocks", (d) => { d.adapter_runtime_invocation_now = true; }, ["preflight_adapter_runtime_invocation_now_not_false"]],
    ["route_added_true_blocks", "top_level", "route added true blocks", (d) => { d.route_added = true; }, ["preflight_route_added_not_false"]],
    ["ui_write_action_added_true_blocks", "top_level", "UI write action added true blocks", (d) => { d.ui_write_action_added = true; }, ["preflight_ui_write_action_added_not_false"]],
    ["command_input_raw_manual_note_text_true_blocks", "command_input", "command input raw manual note text true blocks", (d) => setPath(d, ["command_envelope_input", "raw_manual_note_text_included"], true), ["command_envelope_input_raw_manual_note_text_included_not_false"]],
    ["command_input_product_claim_id_non_null_blocks", "command_input", "command input product claim ID non-null blocks", (d) => setPath(d, ["command_envelope_input", "product_claim_id"], "product:blocked"), ["command_envelope_input_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["command_input_db_path_non_null_blocks", "command_input", "command input DB path non-null blocks", (d) => setPath(d, ["command_envelope_input", "db_path"], "/tmp/product.db"), ["command_envelope_input_db_path_not_null"]],
    ["command_input_sql_text_non_null_blocks", "command_input", "command input SQL text non-null blocks", (d) => setPath(d, ["command_envelope_input", "sql_text"], "select 1"), ["command_envelope_input_sql_text_not_null"]],
    ["product_claim_draft_product_claim_id_non_null_blocks", "draft", "product claim draft product claim ID non-null blocks", (d) => setPath(d, ["product_claim_draft_preview", "product_claim_id"], "product:blocked"), ["product_claim_draft_preview_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["product_claim_draft_write_count_positive_blocks", "draft", "product claim draft write count positive blocks", (d) => setPath(d, ["product_claim_draft_preview", "write_operation_count_now"], 1), ["product_claim_draft_preview_write_operation_count_now_not_zero"]],
    ["product_claim_draft_db_write_count_positive_blocks", "draft", "product claim draft DB write count positive blocks", (d) => setPath(d, ["product_claim_draft_preview", "db_write_count_now"], 1), ["product_claim_draft_preview_db_write_count_now_not_zero"]],
    ["product_claim_draft_sql_statement_count_positive_blocks", "draft", "product claim draft SQL statement count positive blocks", (d) => setPath(d, ["product_claim_draft_preview", "sql_statement_count_now"], 1), ["product_claim_draft_preview_sql_statement_count_now_not_zero"]],
    ["idempotency_durable_write_true_blocks", "preview", "idempotency durable write true blocks", (d) => setPath(d, ["idempotency_preview", "durable_write_now"], true), ["idempotency_preview_durable_write_now_not_false"]],
    ["rollback_durable_write_true_blocks", "preview", "rollback durable write true blocks", (d) => setPath(d, ["rollback_preview", "durable_write_now"], true), ["rollback_preview_durable_write_now_not_false"]],
    ["audit_durable_write_true_blocks", "preview", "audit durable write true blocks", (d) => setPath(d, ["audit_preview", "durable_write_now"], true), ["audit_preview_durable_write_now_not_false"]],
    ["observability_durable_write_true_blocks", "preview", "observability durable write true blocks", (d) => setPath(d, ["observability_preview", "durable_write_now"], true), ["observability_preview_durable_write_now_not_false"]],
    ["missing_rejection_reason_blocks", "rejection", "missing rejection reason blocks", (d) => { d.preflight_rejection_reasons = asArray(d.preflight_rejection_reasons).filter((reason) => reason !== "db_write_not_allowed"); }, ["preflight_rejection_reason_db_write_not_allowed_missing"]],
    ["normalized_product_claim_id_non_null_blocks", "id_scan", "normalized product claim ID non-null blocks", (d) => setPath(d, ["command_envelope_input_summary", "normalized_product_claim_id"], "product:blocked"), ["non_null_product_or_related_id_present"]],
    ["proof_id_non_null_blocks", "id_scan", "proof ID non-null blocks", (d) => setPath(d, ["idempotency_preview", "proof_id"], "proof:blocked"), ["idempotency_preview_proof_id_not_null", "non_null_product_or_related_id_present"]],
    ["evidence_id_non_null_blocks", "id_scan", "evidence ID non-null blocks", (d) => setPath(d, ["rollback_preview", "evidence_id"], "evidence:blocked"), ["rollback_preview_evidence_id_not_null", "non_null_product_or_related_id_present"]],
    ["perspective_id_non_null_blocks", "id_scan", "Perspective ID non-null blocks", (d) => setPath(d, ["audit_preview", "perspective_id"], "perspective:blocked"), ["audit_preview_perspective_id_not_null", "non_null_product_or_related_id_present"]],
    ["work_item_id_non_null_blocks", "id_scan", "work item ID non-null blocks", (d) => setPath(d, ["observability_preview", "work_item_id"], "work:blocked"), ["observability_preview_work_item_id_not_null", "non_null_product_or_related_id_present"]],
    ["failed_optional_noop_report_blocks", "optional_report", "failed optional no-op report blocks", (d) => { d.source_validation_failure_codes = ["optional_noop_invocation_report_not_passed"]; }, ["optional_noop_invocation_report_not_passed"]],
    ["optional_pass_missing_nested_payload_blocks", "optional_report", "optional pass missing nested payload blocks", (d) => { d.source_validation_failure_codes = ["optional_noop_invocation_report_missing_payload"]; }, ["optional_noop_invocation_report_missing_payload"]],
    ["static_boundary_empty_delta_blocks", "static_boundary", "empty changed-file delta blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], []), ["static_boundary_changed_file_delta_empty"]],
    ["static_boundary_package_addition_outside_allowlist_blocks", "static_boundary", "package addition outside allowlist blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"], ['+    "openai": "^1.0.0",']), ["static_boundary_package_addition_outside_allowlist", "static_boundary_expected_package_script_missing"]],
    ["static_boundary_missing_expected_package_script_blocks", "static_boundary", "missing expected package script blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"], [asArray(asRecord(d.static_boundary_evidence).static_boundary_package_added_lines_inspected)[0] ?? ""]), ["static_boundary_expected_package_script_missing"]],
    ["static_boundary_schema_db_sql_file_blocks", "static_boundary", "schema/db/sql file blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["db/schema.sql"]), ["static_boundary_schema_db_sql_changed", "static_boundary_expected_files_missing"]],
    ["static_boundary_app_api_route_file_blocks", "static_boundary", "App API route file blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["app/api/product-write/route.ts"]), ["static_boundary_app_api_route_changed", "static_boundary_expected_files_missing"]],
    ["static_boundary_app_router_ui_path_blocks", "static_boundary", "App Router UI path blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["app/product-write/page.tsx"]), ["static_boundary_ui_changed", "static_boundary_expected_files_missing"]],
    ["static_boundary_external_call_pattern_blocks", "static_boundary", "external call pattern blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_probe_text"], `${["fet", "ch"].join("")}("https://example.com")`), ["static_boundary_network_or_external_call_present"]],
    ["static_boundary_browser_persistence_pattern_blocks", "static_boundary", "browser persistence pattern blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_probe_text"], ["local", "Storage"].join("")), ["static_boundary_browser_persistence_present"]],
    ["static_boundary_app_server_startup_pattern_blocks", "static_boundary", "app server startup pattern blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_probe_text"], ["npm", "run", "dev"].join(" ")), ["static_boundary_app_server_startup_present"]],
    ["static_boundary_executable_sql_string_blocks", "static_boundary", "executable SQL string blocks", (d) => setPath(d, ["static_boundary_evidence", "static_boundary_probe_text"], `${["INSERT", "INTO"].join(" ")} product_claims`), ["static_boundary_executable_sql_string_present"]],
    ["explicit_forbidden_surface_command_persistence_blocks", "forbidden_surface", "command envelope persistence forbidden surface true blocks", (d) => setPath(d, ["explicit_forbidden_surfaces", "command_envelope_persistence"], true), ["explicit_forbidden_surface_command_envelope_persistence_not_false"]],
    ["explicit_forbidden_surface_provider_call_blocks", "forbidden_surface", "provider call forbidden surface true blocks", (d) => setPath(d, ["explicit_forbidden_surfaces", "provider_or_openai_call"], true), ["explicit_forbidden_surface_provider_or_openai_call_not_false"]],
    ["source_dry_run_harness_final_status_fail_blocks", "source_chain", "source dry-run harness final status fail blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_dry_run_invocation_harness", "final_status"], "fail"), ["source_evidence_dry_run_harness_final_status_not_passed"]],
    ["source_contract_suite_final_status_fail_blocks", "source_chain", "source contract suite final status fail blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_contract_tests", "final_status"], "fail"), ["source_evidence_contract_tests_final_status_not_passed"]],
    ["source_disabled_adapter_skeleton_enabled_blocks", "source_chain", "source disabled adapter skeleton enabled blocks", (d) => setPath(d, ["source_evidence", "disabled_adapter_skeleton", "adapter_enabled"], true), ["source_evidence_disabled_adapter_skeleton_enabled"]],
    ["source_authority_contract_bundle_status_wrong_blocks", "source_chain", "source authority contract bundle status wrong blocks", (d) => setPath(d, ["source_evidence", "authority_contract_bundle", "authority_contract_bundle_status"], "granted"), ["source_evidence_authority_contract_bundle_status_not_ready"]],
    ["source_product_write_gate_design_status_wrong_blocks", "source_chain", "source product write gate design status wrong blocks", (d) => setPath(d, ["source_evidence", "product_write_gate_design", "gate_design_status"], "product_write_allowed"), ["source_evidence_product_write_gate_design_status_not_ready"]],
  ];
  return rowConfigs.map(([checkId, checkGroup, mutationSummary, mutate, expectedCodes]) => {
    const draft = cloneJson(envelope);
    mutate(draft);
    const actualFailureCodes =
      validateManualNoteSingleClaimProductWritePreflightCommandEnvelope(draft);
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

function sourceNoopFinalStatus(noop: JsonRecord): string {
  const explicitStatus = asString(noop.final_status) || asString(noop.source_report_final_status);
  if (explicitStatus) return explicitStatus;
  return noop.noop_invocation_report_status === READY_NOOP_STATUS &&
    asRecord(noop.validation).passed === true
    ? "pass"
    : "";
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
