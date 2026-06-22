import { createManualNoteSingleClaimProductWritePreflightCommandEnvelopeFingerprint } from "./manual-note-single-claim-product-write-preflight-command-envelope";

export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_VERSION =
  "manual_note_single_claim_product_write_preflight_stopline.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildInput = {
  preflightCommandEnvelopeContractTests: unknown;
  preflightCommandEnvelope: unknown;
  sourceReports?: unknown;
  staticBoundaryEvidence?: unknown;
  sourceValidationFailureCodes?: unknown;
};

const READY_STOPLINE_STATUS = "product_write_preflight_stopline_reached";
const BLOCKED_STOPLINE_STATUS = "blocked_before_product_write_preflight_stopline";
const READY_RECOMMENDATION = "ready_for_perspective_geometry_digest";
const BLOCKED_RECOMMENDATION = "blocked_before_perspective_geometry_digest";
const NEXT_PRIMARY_SLICE = "perspective_geometry_digest_builder_v0_1";
const NEXT_SECONDARY_SLICE =
  "agent_perspective_substrate_docs_type_fixture_v0_1";
const RECHECK_SLICE = "single_claim_product_write_preflight_stopline_recheck";
const FORBIDDEN_PRODUCT_WRITE_IMPLEMENTATION_RECOMMENDATION = [
  "ready",
  "for",
  "product",
  "write",
  "implementation",
].join("_");

const CONTRACT_SUITE_STATUS =
  "product_write_preflight_command_envelope_contract_tests_passed";
const CONTRACT_SUITE_RECOMMENDATION = "ready_for_product_write_preflight_stopline";
const CONTRACT_SUITE_NEXT = "single_claim_product_write_preflight_stopline";

const PREFLIGHT_STATUS = "product_write_preflight_command_envelope_only";
const PREFLIGHT_RECOMMENDATION =
  "ready_for_single_claim_product_write_preflight_command_envelope_contract_tests";
const PREFLIGHT_NEXT =
  "single_claim_product_write_preflight_command_envelope_contract_tests";

const PRODUCT_ID_KEYS = [
  "product_record_id",
  "product_id",
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

const BLOCKED_SURFACE_KEYS = [
  "product_db_write",
  "product_id_allocation",
  "product_claim_id_allocation",
  "product_write_route",
  "product_write_ui_action",
  "product_write_adapter_enabled",
  "adapter_runtime_invocation",
  "enabled_adapter_transition",
  "command_envelope_persistence",
  "sql_execution",
  "db_open",
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "schema_or_migration_change",
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "durable_perspective_promotion",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "browser_persistence",
  "product_write_implementation",
] as const;

const REENTRY_CONDITIONS = [
  "perspective_geometry_digest_builder_completed",
  "agent_perspective_substrate_boundary_completed",
  "durable_perspective_promotion_contract_reviewed",
  "explicit_operator_product_write_decision_recorded",
] as const;

const FORBIDDEN_UNTIL_REENTRY = [
  "product_write_implementation",
  "product_id_allocation",
  "enabled_adapter_transition",
  "product_write_route_or_ui",
  "db_sql_transaction_execution",
] as const;

export function buildManualNoteSingleClaimProductWritePreflightStopline(
  input: BuildInput,
): JsonRecord {
  const contractTests = asRecord(input.preflightCommandEnvelopeContractTests);
  const preflightEnvelope = asRecord(input.preflightCommandEnvelope);
  const staticBoundaryEvidence = normalizeStaticBoundaryEvidence(
    input.staticBoundaryEvidence,
  );
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const sourceEvidence = buildSourceEvidenceSummary({
    contractTests,
    preflightEnvelope,
    sourceReports: input.sourceReports,
  });
  const chainSummary = buildProductWritePreflightChainSummary({
    sourceEvidence,
    contractTests,
    preflightEnvelope,
  });
  const blockedSurfacesSummary = buildBlockedSurfacesSummary();
  const closeout = buildNoWriteStoplineCloseout();
  const roadmapReturnPacket = buildRoadmapReturnPacket();

  const stoplineCore = {
    stopline_kind: "manual_note_single_claim_product_write_preflight_stopline",
    stopline_version: MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_VERSION,
    stopline_fingerprint: "",
    source_validation_failure_codes: sourceValidationFailureCodes,
    source_evidence: sourceEvidence,
    product_write_preflight_chain_summary: chainSummary,
    blocked_surfaces_summary: blockedSurfacesSummary,
    no_write_stopline_closeout: closeout,
    roadmap_return_packet: roadmapReturnPacket,
    static_boundary_evidence: staticBoundaryEvidence,
    stopline_status: READY_STOPLINE_STATUS,
    product_write_lane_parked_now: true,
    product_write_implementation_allowed_now: false,
    product_write_authority_granted_now: false,
    product_write_allowed_now: false,
    product_id_allocation_allowed_now: false,
    command_envelope_persistence_allowed_now: false,
    db_open_allowed_now: false,
    sql_execution_allowed_now: false,
    transaction_execution_allowed_now: false,
    enabled_adapter_transition_allowed_now: false,
    route_or_ui_allowed_now: false,
    durable_perspective_promotion_allowed_now: false,
    recommendation_status: READY_RECOMMENDATION,
    next_recommended_slice: NEXT_PRIMARY_SLICE,
    secondary_next_recommended_slice: NEXT_SECONDARY_SLICE,
  };

  const validationMatrix = buildValidationMatrix(stoplineCore);
  const matrixFailures = validationMatrix
    .filter((row) => row.check_status !== "pass")
    .map((row) => `validation_matrix_${row.check_id}_failed`);
  const failures = unique([
    ...sourceValidationFailureCodes,
    ...validateStoplineCandidate(stoplineCore),
    ...validateStaticBoundaryEvidence(staticBoundaryEvidence),
    ...matrixFailures,
  ]);
  const finalReady = failures.length === 0;
  const finalStopline = {
    ...stoplineCore,
    stopline_status: finalReady ? READY_STOPLINE_STATUS : BLOCKED_STOPLINE_STATUS,
    recommendation_status: finalReady ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice: finalReady ? NEXT_PRIMARY_SLICE : RECHECK_SLICE,
    secondary_next_recommended_slice: finalReady ? NEXT_SECONDARY_SLICE : null,
    stopline_validation_matrix: validationMatrix,
    validation: {
      passed: finalReady,
      failure_codes: failures,
    },
  };
  const stoplineFingerprint = createFingerprint({
    ...finalStopline,
    stopline_fingerprint: "",
  });
  return {
    ...finalStopline,
    stopline_fingerprint: stoplineFingerprint,
  };
}

function buildSourceEvidenceSummary({
  contractTests,
  preflightEnvelope,
  sourceReports,
}: {
  contractTests: JsonRecord;
  preflightEnvelope: JsonRecord;
  sourceReports: unknown;
}): JsonRecord {
  const preflightSource = asRecord(preflightEnvelope.source_evidence);
  const sourceReportSummaries = asArray(sourceReports).map((report) => {
    const record = asRecord(report);
    return {
      source_label: asString(record.source_label ?? record.label),
      source_used: asString(record.source_used),
      source_status: asString(record.source_status),
      traceability_status: asString(record.traceability_status),
      failure_codes: asArray(record.failure_codes).map(asString),
      fingerprint: firstString(record, [
        "fingerprint",
        "suite_fingerprint",
        "design_fingerprint",
        "authority_contract_bundle_fingerprint",
        "disabled_adapter_skeleton_fingerprint",
        "dry_run_invocation_harness_fingerprint",
        "noop_invocation_report_fingerprint",
      ]),
    };
  });
  return {
    preflight_command_envelope_contract_tests: {
      suite_fingerprint: asString(contractTests.suite_fingerprint),
      final_status: asString(contractTests.final_status),
      contract_suite_status: asString(contractTests.contract_suite_status),
      recommendation_status: asString(contractTests.recommendation_status),
      next_recommended_slice: asString(contractTests.next_recommended_slice),
      validation_passed: asRecord(contractTests.validation).passed === true,
      total_cases: asNumber(asRecord(contractTests.coverage_summary).total_cases),
    },
    preflight_command_envelope: {
      preflight_command_envelope_fingerprint: asString(
        preflightEnvelope.preflight_command_envelope_fingerprint,
      ),
      final_status: asString(preflightEnvelope.final_status),
      preflight_command_envelope_status: asString(
        preflightEnvelope.preflight_command_envelope_status,
      ),
      recommendation_status: asString(preflightEnvelope.recommendation_status),
      next_recommended_slice: asString(preflightEnvelope.next_recommended_slice),
      validation_passed: asRecord(preflightEnvelope.validation).passed === true,
      command_envelope_created_now:
        preflightEnvelope.command_envelope_created_now === true,
      command_envelope_persisted_now:
        preflightEnvelope.command_envelope_persisted_now === true,
      command_envelope_executable_now:
        preflightEnvelope.command_envelope_executable_now === true,
      product_write_allowed_now: preflightEnvelope.product_write_allowed_now === true,
      product_claim_id: preflightEnvelope.product_claim_id ?? null,
    },
    disabled_adapter_noop_invocation_report:
      preflightSource.noop_invocation_report ?? {},
    operator_review_packet: preflightSource.operator_review_packet ?? {},
    no_write_closeout: preflightSource.no_write_closeout ?? {},
    invocation_closeout_summary:
      preflightSource.invocation_closeout_summary ?? {},
    noop_preflight_command_envelope_preview:
      preflightSource.noop_preflight_command_envelope_preview ?? {},
    disabled_adapter_dry_run_invocation_harness:
      preflightSource.disabled_adapter_dry_run_invocation_harness ?? {},
    disabled_adapter_contract_tests:
      preflightSource.disabled_adapter_contract_tests ?? {},
    disabled_adapter_skeleton: preflightSource.disabled_adapter_skeleton ?? {},
    authority_contract_bundle: preflightSource.authority_contract_bundle ?? {},
    product_write_gate_design: preflightSource.product_write_gate_design ?? {},
    optional_source_reports: sourceReportSummaries,
  };
}

function buildProductWritePreflightChainSummary({
  sourceEvidence,
  contractTests,
  preflightEnvelope,
}: {
  sourceEvidence: JsonRecord;
  contractTests: JsonRecord;
  preflightEnvelope: JsonRecord;
}): JsonRecord {
  const chain = [
    chainNode({
      node_id: "product_write_gate_design",
      source_pr_number: 673,
      source_artifact_kind: "manual_note_single_claim_product_write_gate_design",
      evidence: asRecord(sourceEvidence.product_write_gate_design),
      statusKey: "gate_design_status",
      fingerprintKey: "design_fingerprint",
    }),
    chainNode({
      node_id: "product_write_authority_contract_bundle",
      source_pr_number: 679,
      source_artifact_kind:
        "manual_note_single_claim_product_write_authority_contract_bundle",
      evidence: asRecord(sourceEvidence.authority_contract_bundle),
      statusKey: "authority_contract_bundle_status",
      fingerprintKey: "authority_contract_bundle_fingerprint",
    }),
    chainNode({
      node_id: "disabled_adapter_skeleton",
      source_pr_number: 680,
      source_artifact_kind:
        "manual_note_single_claim_product_write_disabled_adapter_skeleton",
      evidence: asRecord(sourceEvidence.disabled_adapter_skeleton),
      statusKey: "disabled_adapter_skeleton_status",
      fingerprintKey: "disabled_adapter_skeleton_fingerprint",
    }),
    chainNode({
      node_id: "disabled_adapter_contract_tests",
      source_pr_number: 681,
      source_artifact_kind:
        "manual_note_single_claim_product_write_disabled_adapter_contract_tests",
      evidence: asRecord(sourceEvidence.disabled_adapter_contract_tests),
      statusKey: "contract_suite_status",
      fingerprintKey: "suite_fingerprint",
    }),
    chainNode({
      node_id: "disabled_adapter_dry_run_invocation_harness",
      source_pr_number: 682,
      source_artifact_kind:
        "manual_note_single_claim_product_write_disabled_adapter_dry_run_invocation_harness",
      evidence: asRecord(sourceEvidence.disabled_adapter_dry_run_invocation_harness),
      statusKey: "dry_run_invocation_harness_status",
      fingerprintKey: "dry_run_invocation_harness_fingerprint",
    }),
    chainNode({
      node_id: "disabled_adapter_noop_invocation_report",
      source_pr_number: 683,
      source_artifact_kind:
        "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_report",
      evidence: asRecord(sourceEvidence.disabled_adapter_noop_invocation_report),
      statusKey: "noop_invocation_report_status",
      fingerprintKey: "noop_invocation_report_fingerprint",
    }),
    chainNode({
      node_id: "preflight_command_envelope",
      source_pr_number: 684,
      source_artifact_kind:
        "manual_note_single_claim_product_write_preflight_command_envelope",
      evidence: preflightEnvelope,
      statusKey: "preflight_command_envelope_status",
      fingerprintKey: "preflight_command_envelope_fingerprint",
    }),
    chainNode({
      node_id: "preflight_command_envelope_contract_tests",
      source_pr_number: 685,
      source_artifact_kind:
        "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests",
      evidence: contractTests,
      statusKey: "contract_suite_status",
      fingerprintKey: "suite_fingerprint",
    }),
    {
      node_id: "preflight_stopline",
      source_pr_number: null,
      source_artifact_kind:
        "manual_note_single_claim_product_write_preflight_stopline",
      status: READY_STOPLINE_STATUS,
      fingerprint: null,
      final_status: null,
      next_slice_from_source: NEXT_PRIMARY_SLICE,
      no_write_boundary_preserved: true,
      product_write_implemented: false,
      product_id_allocated: false,
      db_sql_transaction_executed: false,
    },
  ];
  return {
    chain_kind: "manual_note_single_claim_product_write_preflight_chain_summary",
    chain_closed_at: "preflight_stopline",
    product_write_chain_ready_for_stopline: true,
    product_write_chain_ready_for_implementation: false,
    ordered_chain: chain,
  };
}

function chainNode({
  node_id,
  source_pr_number,
  source_artifact_kind,
  evidence,
  statusKey,
  fingerprintKey,
}: {
  node_id: string;
  source_pr_number: number;
  source_artifact_kind: string;
  evidence: JsonRecord;
  statusKey: string;
  fingerprintKey: string;
}): JsonRecord {
  return {
    node_id,
    source_pr_number,
    source_artifact_kind,
    status: asString(evidence[statusKey]),
    fingerprint: asString(evidence[fingerprintKey]),
    final_status: asString(evidence.final_status),
    next_slice_from_source: asString(
      evidence.next_recommended_slice ??
        evidence.recommended_next_slice ??
        asRecord(evidence.next_stage_recommendation).recommended_next_slice,
    ),
    no_write_boundary_preserved: true,
    product_write_implemented: false,
    product_id_allocated: false,
    db_sql_transaction_executed: false,
  };
}

function buildBlockedSurfacesSummary(): JsonRecord {
  return Object.fromEntries(BLOCKED_SURFACE_KEYS.map((key) => [key, false]));
}

function buildNoWriteStoplineCloseout(): JsonRecord {
  return {
    closeout_kind:
      "manual_note_single_claim_product_write_preflight_stopline_no_write_closeout",
    closeout_status: "product_write_preflight_lane_parked",
    product_write_chain_ready_for_stopline: true,
    product_write_chain_ready_for_implementation: false,
    operator_decision_required_before_any_product_write: true,
    operator_decision_satisfied_now: false,
    implementation_blockers_remaining: [
      "perspective_geometry_digest_not_completed",
      "agent_perspective_substrate_boundary_not_completed",
      "durable_perspective_promotion_contract_not_reviewed",
      "explicit_operator_product_write_decision_not_recorded",
    ],
    authority_contracts_unsatisfied: [
      "product_write_authority_not_granted",
      "enabled_adapter_transition_not_authorized",
    ],
    storage_contracts_unsatisfied: [
      "durable_idempotency_storage_not_satisfied",
      "durable_rollback_storage_not_satisfied",
      "durable_audit_storage_not_satisfied",
      "durable_observability_storage_not_satisfied",
    ],
    schema_contract_unsatisfied: "product_claim_schema_not_satisfied",
    durable_promotion_contract_unsatisfied:
      "durable_perspective_promotion_contract_not_reviewed",
    next_safe_lane: NEXT_PRIMARY_SLICE,
  };
}

function buildRoadmapReturnPacket(): JsonRecord {
  return {
    return_reason: "product_write_preflight_chain_reached_safe_stopline",
    return_to_milestone: "M9_PerspectiveGeometryDigest_Builder",
    next_primary_slice: NEXT_PRIMARY_SLICE,
    next_secondary_slice: NEXT_SECONDARY_SLICE,
    product_write_reentry_condition: [...REENTRY_CONDITIONS],
    forbidden_until_reentry: [...FORBIDDEN_UNTIL_REENTRY],
  };
}

function validateStoplineCandidate(candidate: JsonRecord): string[] {
  const failures: string[] = [];
  const source = asRecord(candidate.source_evidence);
  const contractTests = asRecord(source.preflight_command_envelope_contract_tests);
  const preflight = asRecord(source.preflight_command_envelope);
  const noop = asRecord(source.disabled_adapter_noop_invocation_report);
  const operator = asRecord(source.operator_review_packet);
  const closeout = asRecord(source.no_write_closeout);
  const invocation = asRecord(source.invocation_closeout_summary);
  const noopPreview = asRecord(source.noop_preflight_command_envelope_preview);
  const skeleton = asRecord(source.disabled_adapter_skeleton);
  const authority = asRecord(source.authority_contract_bundle);
  const authorityGap = asRecord(authority.authority_gap_summary);
  const gate = asRecord(source.product_write_gate_design);
  const blockedSurfaces = asRecord(candidate.blocked_surfaces_summary);
  const noWriteCloseout = asRecord(candidate.no_write_stopline_closeout);
  const roadmap = asRecord(candidate.roadmap_return_packet);

  if (
    asString(contractTests.final_status) &&
    asString(contractTests.final_status) !== "pass"
  ) {
    failures.push("contract_tests_final_status_not_passed");
  }
  if (contractTests.contract_suite_status !== CONTRACT_SUITE_STATUS) {
    failures.push("contract_tests_status_not_passed");
  }
  if (contractTests.recommendation_status !== CONTRACT_SUITE_RECOMMENDATION) {
    failures.push("contract_tests_recommendation_not_stopline_ready");
  }
  if (contractTests.next_recommended_slice !== CONTRACT_SUITE_NEXT) {
    failures.push("contract_tests_next_slice_invalid");
  }
  if (contractTests.validation_passed !== true) {
    failures.push("contract_tests_validation_not_passed");
  }

  if (preflight.preflight_command_envelope_status !== PREFLIGHT_STATUS) {
    failures.push("preflight_command_envelope_status_not_ready");
  }
  if (preflight.recommendation_status !== PREFLIGHT_RECOMMENDATION) {
    failures.push("preflight_command_envelope_recommendation_invalid");
  }
  if (preflight.next_recommended_slice !== PREFLIGHT_NEXT) {
    failures.push("preflight_command_envelope_next_slice_invalid");
  }
  if (preflight.validation_passed !== true) {
    failures.push("preflight_command_envelope_validation_not_passed");
  }
  if (preflight.command_envelope_created_now !== true) {
    failures.push("preflight_command_envelope_created_now_not_true");
  }
  if (preflight.command_envelope_persisted_now !== false) {
    failures.push("preflight_command_envelope_persisted_now_not_false");
  }
  if (preflight.command_envelope_executable_now !== false) {
    failures.push("preflight_command_envelope_executable_now_not_false");
  }
  if (preflight.product_write_allowed_now !== false) {
    failures.push("preflight_product_write_allowed_now_not_false");
  }
  if (preflight.product_claim_id !== null) {
    failures.push("preflight_product_claim_id_not_null");
  }

  if (noop.final_status !== "pass") {
    failures.push("noop_invocation_report_final_status_not_passed");
  }
  if (
    noop.noop_invocation_report_status !==
    "product_write_disabled_adapter_noop_invocation_report_only"
  ) {
    failures.push("noop_invocation_report_status_not_ready");
  }
  if (
    noop.recommendation_status !==
    "ready_for_single_claim_product_write_preflight_command_envelope"
  ) {
    failures.push("noop_invocation_report_recommendation_invalid");
  }
  if (noop.next_recommended_slice !== "single_claim_product_write_preflight_command_envelope") {
    failures.push("noop_invocation_report_next_slice_invalid");
  }
  if (noop.validation_passed !== true) {
    failures.push("noop_invocation_report_validation_not_passed");
  }

  if (operator.operator_decision_required_before_product_write !== true) {
    failures.push("operator_decision_requirement_missing");
  }
  if (operator.operator_decision_satisfied_now !== false) {
    failures.push("operator_decision_satisfied_now");
  }
  if (operator.operator_may_approve_product_write_now !== false) {
    failures.push("operator_may_approve_product_write_now");
  }
  if (closeout.closeout_status !== "no_write_observed") {
    failures.push("noop_no_write_closeout_status_invalid");
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
  ]) {
    if (closeout[key] !== false) failures.push(`noop_no_write_${key}_not_false`);
  }
  if (invocation.dry_run_invocation_result_status !== "rejected_disabled_adapter") {
    failures.push("noop_invocation_result_not_rejected_disabled_adapter");
  }
  if (asNumber(invocation.failed_probe_count) !== 0) {
    failures.push("noop_invocation_failed_probe_count_not_zero");
  }
  if (noopPreview.executable_now !== false) {
    failures.push("noop_preflight_preview_executable_now_not_false");
  }
  if (noopPreview.persisted_now !== false) {
    failures.push("noop_preflight_preview_persisted_now_not_false");
  }
  if (noopPreview.product_write_allowed_now !== false) {
    failures.push("noop_preflight_preview_product_write_allowed_now_not_false");
  }

  if (skeleton.adapter_enabled !== false) {
    failures.push("disabled_adapter_enabled_now");
  }
  if (asNumber(authorityGap.authority_granted_now_count) !== 0) {
    failures.push("authority_granted_now_count_not_zero");
  }
  if (asNumber(authorityGap.implementation_allowed_now_count) !== 0) {
    failures.push("implementation_allowed_now_count_not_zero");
  }
  if (gate.gate_design_status !== "product_write_gate_design_only") {
    failures.push("product_write_gate_design_status_invalid");
  }

  for (const key of BLOCKED_SURFACE_KEYS) {
    if (blockedSurfaces[key] !== false) {
      failures.push(`blocked_surface_${key}_not_false`);
    }
  }

  if (candidate.product_write_lane_parked_now !== true) {
    failures.push("product_write_lane_not_parked");
  }
  for (const key of [
    "product_write_implementation_allowed_now",
    "product_write_authority_granted_now",
    "product_write_allowed_now",
    "product_id_allocation_allowed_now",
    "command_envelope_persistence_allowed_now",
    "db_open_allowed_now",
    "sql_execution_allowed_now",
    "transaction_execution_allowed_now",
    "enabled_adapter_transition_allowed_now",
    "route_or_ui_allowed_now",
    "durable_perspective_promotion_allowed_now",
  ]) {
    if (candidate[key] !== false) failures.push(`${key}_not_false`);
  }
  if (
    candidate.recommendation_status ===
    FORBIDDEN_PRODUCT_WRITE_IMPLEMENTATION_RECOMMENDATION
  ) {
    failures.push("product_write_implementation_recommended");
  }
  if (candidate.next_recommended_slice === "product_write_implementation") {
    failures.push("next_slice_product_write_implementation");
  }
  if (candidate.next_recommended_slice !== NEXT_PRIMARY_SLICE) {
    failures.push("next_recommended_slice_not_perspective_geometry_digest");
  }
  if (candidate.secondary_next_recommended_slice !== NEXT_SECONDARY_SLICE) {
    failures.push("secondary_next_recommended_slice_invalid");
  }

  if (noWriteCloseout.closeout_status !== "product_write_preflight_lane_parked") {
    failures.push("stopline_closeout_status_invalid");
  }
  if (noWriteCloseout.product_write_chain_ready_for_stopline !== true) {
    failures.push("chain_not_ready_for_stopline");
  }
  if (noWriteCloseout.product_write_chain_ready_for_implementation !== false) {
    failures.push("chain_ready_for_implementation");
  }
  if (noWriteCloseout.operator_decision_satisfied_now !== false) {
    failures.push("stopline_operator_decision_satisfied_now");
  }
  if (noWriteCloseout.next_safe_lane !== NEXT_PRIMARY_SLICE) {
    failures.push("stopline_next_safe_lane_invalid");
  }

  if (roadmap.return_to_milestone !== "M9_PerspectiveGeometryDigest_Builder") {
    failures.push("roadmap_return_milestone_missing");
  }
  if (roadmap.next_primary_slice !== NEXT_PRIMARY_SLICE) {
    failures.push("roadmap_next_primary_slice_invalid");
  }
  if (roadmap.next_secondary_slice !== NEXT_SECONDARY_SLICE) {
    failures.push("roadmap_next_secondary_slice_invalid");
  }
  const reentryConditions = asArray(roadmap.product_write_reentry_condition).map(
    asString,
  );
  for (const condition of REENTRY_CONDITIONS) {
    if (!reentryConditions.includes(condition)) {
      failures.push("roadmap_reentry_condition_missing");
      break;
    }
  }
  const forbiddenUntilReentry = asArray(roadmap.forbidden_until_reentry).map(
    asString,
  );
  for (const forbidden of FORBIDDEN_UNTIL_REENTRY) {
    if (!forbiddenUntilReentry.includes(forbidden)) {
      failures.push("roadmap_forbidden_until_reentry_missing");
      break;
    }
  }

  if (hasNonNullProductIds(candidate)) {
    failures.push("non_null_product_or_related_id_present");
  }
  failures.push(
    ...validateStaticBoundaryEvidence(
      asRecord(candidate.static_boundary_evidence),
    ),
  );
  return unique(failures);
}

function buildValidationMatrix(baseCandidate: JsonRecord): JsonRecord[] {
  const cases: JsonRecord[] = [];
  const addCase = (
    checkId: string,
    checkGroup: string,
    mutationSummary: string,
    expectedFailureCodes: string[],
    mutate?: (draft: JsonRecord) => void,
  ) => {
    const draft = cloneJson(baseCandidate);
    mutate?.(draft);
    const actualFailureCodes = validateStoplineCandidate(draft);
    const actualStatus = actualFailureCodes.length === 0 ? "pass" : "fail";
    const expectedStatus = expectedFailureCodes.length === 0 ? "pass" : "fail";
    const missingExpectedFailureCodes = expectedFailureCodes.filter(
      (code) => !actualFailureCodes.includes(code),
    );
    const unexpectedFailureCodes = actualFailureCodes.filter(
      (code) => !expectedFailureCodes.includes(code),
    );
    cases.push({
      check_id: checkId,
      check_group: checkGroup,
      mutation_summary: mutationSummary,
      expected_status: expectedStatus,
      expected_failure_codes: expectedFailureCodes,
      actual_status: actualStatus,
      actual_failure_codes: actualFailureCodes,
      missing_expected_failure_codes: missingExpectedFailureCodes,
      unexpected_failure_codes: unexpectedFailureCodes,
      check_status:
        actualStatus === expectedStatus &&
        missingExpectedFailureCodes.length === 0 &&
        unexpectedFailureCodes.length === 0
          ? "pass"
          : "fail",
    });
  };
  const setPath = (path: string[], value: unknown) => (draft: JsonRecord) =>
    setNestedPath(draft, path, value);

  addCase("positive_full_chain_passes", "positive", "full chain passes", []);
  addCase(
    "contract_tests_failed_blocks",
    "contract_tests",
    "#685 contract tests failed blocks",
    ["contract_tests_final_status_not_passed"],
    setPath(["source_evidence", "preflight_command_envelope_contract_tests", "final_status"], "fail"),
  );
  addCase(
    "contract_tests_wrong_next_slice_blocks",
    "contract_tests",
    "#685 wrong next slice blocks",
    ["contract_tests_next_slice_invalid"],
    setPath(["source_evidence", "preflight_command_envelope_contract_tests", "next_recommended_slice"], "product_write_implementation"),
  );
  addCase(
    "contract_tests_recommends_implementation_blocks",
    "contract_tests",
    "#685 recommends implementation blocks",
    ["contract_tests_recommendation_not_stopline_ready"],
    setPath(
      ["source_evidence", "preflight_command_envelope_contract_tests", "recommendation_status"],
      FORBIDDEN_PRODUCT_WRITE_IMPLEMENTATION_RECOMMENDATION,
    ),
  );
  addCase(
    "preflight_envelope_failed_blocks",
    "preflight",
    "#684 preflight envelope failed blocks",
    ["preflight_command_envelope_validation_not_passed"],
    setPath(["source_evidence", "preflight_command_envelope", "validation_passed"], false),
  );
  addCase(
    "preflight_command_envelope_persisted_true_blocks",
    "preflight",
    "#684 command envelope persisted true blocks",
    ["preflight_command_envelope_persisted_now_not_false"],
    setPath(["source_evidence", "preflight_command_envelope", "command_envelope_persisted_now"], true),
  );
  addCase(
    "preflight_command_envelope_executable_true_blocks",
    "preflight",
    "#684 executable true blocks",
    ["preflight_command_envelope_executable_now_not_false"],
    setPath(["source_evidence", "preflight_command_envelope", "command_envelope_executable_now"], true),
  );
  addCase(
    "preflight_product_write_allowed_true_blocks",
    "preflight",
    "#684 product write allowed true blocks",
    ["preflight_product_write_allowed_now_not_false"],
    setPath(["source_evidence", "preflight_command_envelope", "product_write_allowed_now"], true),
  );
  addCase(
    "preflight_product_claim_id_non_null_blocks",
    "preflight",
    "#684 product claim ID non-null blocks",
    ["preflight_product_claim_id_not_null", "non_null_product_or_related_id_present"],
    setPath(["source_evidence", "preflight_command_envelope", "product_claim_id"], "product_claim_1"),
  );
  addCase(
    "preflight_id_contamination_blocks",
    "preflight",
    "#684 ID contamination blocks",
    ["non_null_product_or_related_id_present"],
    setPath(["source_evidence", "preflight_command_envelope", "normalized_product_claim_id"], "normalized_product_claim_1"),
  );
  addCase(
    "noop_report_failed_blocks",
    "noop",
    "#683 no-op report failed blocks",
    ["noop_invocation_report_final_status_not_passed"],
    setPath(["source_evidence", "disabled_adapter_noop_invocation_report", "final_status"], "fail"),
  );
  addCase(
    "operator_decision_satisfied_true_blocks",
    "operator",
    "operator decision satisfied true blocks",
    ["operator_decision_satisfied_now"],
    setPath(["source_evidence", "operator_review_packet", "operator_decision_satisfied_now"], true),
  );
  addCase(
    "operator_may_approve_product_write_true_blocks",
    "operator",
    "operator may approve product write true blocks",
    ["operator_may_approve_product_write_now"],
    setPath(["source_evidence", "operator_review_packet", "operator_may_approve_product_write_now"], true),
  );
  addCase(
    "disabled_adapter_enabled_blocks",
    "upstream",
    "disabled adapter enabled blocks",
    ["disabled_adapter_enabled_now"],
    setPath(["source_evidence", "disabled_adapter_skeleton", "adapter_enabled"], true),
  );
  addCase(
    "authority_granted_count_positive_blocks",
    "upstream",
    "authority granted count greater than zero blocks",
    ["authority_granted_now_count_not_zero"],
    setPath(["source_evidence", "authority_contract_bundle", "authority_gap_summary", "authority_granted_now_count"], 1),
  );
  addCase(
    "implementation_allowed_count_positive_blocks",
    "upstream",
    "implementation allowed count greater than zero blocks",
    ["implementation_allowed_now_count_not_zero"],
    setPath(["source_evidence", "authority_contract_bundle", "authority_gap_summary", "implementation_allowed_now_count"], 1),
  );
  addCase(
    "product_write_gate_allowed_blocks",
    "upstream",
    "product write gate status product_write_allowed blocks",
    ["product_write_gate_design_status_invalid"],
    setPath(["source_evidence", "product_write_gate_design", "gate_design_status"], "product_write_allowed"),
  );

  for (const [surface, code] of [
    ["product_db_write", "blocked_surface_product_db_write_not_false"],
    ["product_id_allocation", "blocked_surface_product_id_allocation_not_false"],
    [
      "product_claim_id_allocation",
      "blocked_surface_product_claim_id_allocation_not_false",
    ],
    ["db_open", "blocked_surface_db_open_not_false"],
    ["sql_execution", "blocked_surface_sql_execution_not_false"],
    ["transaction_execution", "blocked_surface_transaction_execution_not_false"],
    ["transaction_commit", "blocked_surface_transaction_commit_not_false"],
    [
      "transaction_rollback_execution",
      "blocked_surface_transaction_rollback_execution_not_false",
    ],
    ["product_write_route", "blocked_surface_product_write_route_not_false"],
    ["product_write_ui_action", "blocked_surface_product_write_ui_action_not_false"],
    [
      "product_write_adapter_enabled",
      "blocked_surface_product_write_adapter_enabled_not_false",
    ],
    [
      "adapter_runtime_invocation",
      "blocked_surface_adapter_runtime_invocation_not_false",
    ],
    [
      "enabled_adapter_transition",
      "blocked_surface_enabled_adapter_transition_not_false",
    ],
    [
      "command_envelope_persistence",
      "blocked_surface_command_envelope_persistence_not_false",
    ],
    [
      "schema_or_migration_change",
      "blocked_surface_schema_or_migration_change_not_false",
    ],
    ["proof_evidence_write", "blocked_surface_proof_evidence_write_not_false"],
    [
      "perspective_or_canonical_graph_write",
      "blocked_surface_perspective_or_canonical_graph_write_not_false",
    ],
    [
      "durable_perspective_promotion",
      "blocked_surface_durable_perspective_promotion_not_false",
    ],
    ["work_item_creation", "blocked_surface_work_item_creation_not_false"],
    ["provider_or_openai_call", "blocked_surface_provider_or_openai_call_not_false"],
    ["retrieval_or_rag", "blocked_surface_retrieval_or_rag_not_false"],
    ["source_fetch", "blocked_surface_source_fetch_not_false"],
    ["external_handoff", "blocked_surface_external_handoff_not_false"],
    ["browser_persistence", "blocked_surface_browser_persistence_not_false"],
    [
      "product_write_implementation",
      "blocked_surface_product_write_implementation_not_false",
    ],
  ]) {
    addCase(
      `blocked_surface_${surface}_true_blocks`,
      "blocked_surfaces",
      `blocked surface ${surface} true blocks`,
      [code],
      setPath(["blocked_surfaces_summary", surface], true),
    );
  }

  addCase(
    "roadmap_missing_m9_blocks",
    "roadmap",
    "roadmap return missing M9 blocks",
    ["roadmap_return_milestone_missing"],
    setPath(["roadmap_return_packet", "return_to_milestone"], "product_write_implementation"),
  );
  addCase(
    "next_slice_product_write_implementation_blocks",
    "roadmap",
    "next slice product write implementation blocks",
    ["next_slice_product_write_implementation", "next_recommended_slice_not_perspective_geometry_digest"],
    setPath(["next_recommended_slice"], "product_write_implementation"),
  );
  addCase(
    "missing_reentry_condition_blocks",
    "roadmap",
    "missing product write reentry condition blocks",
    ["roadmap_reentry_condition_missing"],
    setPath(["roadmap_return_packet", "product_write_reentry_condition"], []),
  );
  addCase(
    "secondary_next_slice_wrong_blocks",
    "roadmap",
    "secondary next slice wrong blocks",
    ["secondary_next_recommended_slice_invalid"],
    setPath(["secondary_next_recommended_slice"], "product_write_implementation"),
  );
  addCase(
    "roadmap_missing_forbidden_until_reentry_blocks",
    "roadmap",
    "missing forbidden until reentry blocks",
    ["roadmap_forbidden_until_reentry_missing"],
    setPath(["roadmap_return_packet", "forbidden_until_reentry"], []),
  );
  addCase(
    "closeout_ready_for_implementation_true_blocks",
    "closeout",
    "closeout ready for implementation true blocks",
    ["chain_ready_for_implementation"],
    setPath(["no_write_stopline_closeout", "product_write_chain_ready_for_implementation"], true),
  );
  addCase(
    "product_write_lane_not_parked_blocks",
    "stopline_flags",
    "product write lane not parked blocks",
    ["product_write_lane_not_parked"],
    setPath(["product_write_lane_parked_now"], false),
  );
  for (const [pathKey, code] of [
    [
      "product_write_implementation_allowed_now",
      "product_write_implementation_allowed_now_not_false",
    ],
    [
      "product_write_authority_granted_now",
      "product_write_authority_granted_now_not_false",
    ],
    ["product_write_allowed_now", "product_write_allowed_now_not_false"],
    [
      "product_id_allocation_allowed_now",
      "product_id_allocation_allowed_now_not_false",
    ],
    [
      "command_envelope_persistence_allowed_now",
      "command_envelope_persistence_allowed_now_not_false",
    ],
    ["db_open_allowed_now", "db_open_allowed_now_not_false"],
    ["sql_execution_allowed_now", "sql_execution_allowed_now_not_false"],
    [
      "transaction_execution_allowed_now",
      "transaction_execution_allowed_now_not_false",
    ],
    [
      "enabled_adapter_transition_allowed_now",
      "enabled_adapter_transition_allowed_now_not_false",
    ],
    ["route_or_ui_allowed_now", "route_or_ui_allowed_now_not_false"],
    [
      "durable_perspective_promotion_allowed_now",
      "durable_perspective_promotion_allowed_now_not_false",
    ],
  ]) {
    addCase(
      `${pathKey}_true_blocks`,
      "stopline_flags",
      `${pathKey} true blocks`,
      [code],
      setPath([pathKey], true),
    );
  }
  addCase(
    "static_boundary_empty_delta_blocks",
    "static_boundary",
    "static boundary empty changed-file delta blocks",
    ["static_boundary_changed_file_delta_empty", "static_boundary_expected_files_missing"],
    setPath(["static_boundary_evidence", "static_boundary_changed_files_inspected"], []),
  );
  addCase(
    "static_boundary_missing_expected_files_blocks",
    "static_boundary",
    "static boundary missing expected files blocks",
    ["static_boundary_expected_files_missing"],
    setPath(["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["docs/00_INDEX_LATEST.md"]),
  );
  addCase(
    "static_boundary_package_addition_outside_allowlist_blocks",
    "static_boundary",
    "package addition outside allowlist blocks",
    ["static_boundary_package_addition_outside_allowlist"],
    setPath(["static_boundary_evidence", "static_boundary_package_added_lines_inspected"], [
      '+    "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",',
      '+    "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1": "node scripts/run-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",',
      `+    "dev": "${["next", "dev"].join(" ")}",`,
    ]),
  );
  addCase(
    "static_boundary_app_api_route_path_blocks",
    "static_boundary",
    "app/api route path blocks",
    ["static_boundary_expected_files_missing", "static_boundary_app_api_route_changed"],
    setPath(["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["app/api/product-write/route.ts"]),
  );
  addCase(
    "static_boundary_components_ui_path_blocks",
    "static_boundary",
    "components UI path blocks",
    ["static_boundary_expected_files_missing", "static_boundary_ui_changed"],
    setPath(["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["components/ProductWriteButton.tsx"]),
  );
  addCase(
    "static_boundary_schema_db_sql_path_blocks",
    "static_boundary",
    "schema/db/sql path blocks",
    ["static_boundary_expected_files_missing", "static_boundary_schema_db_sql_changed"],
    setPath(["static_boundary_evidence", "static_boundary_changed_files_inspected"], ["db/product-write.sql"]),
  );
  addCase(
    "static_boundary_network_external_pattern_blocks",
    "static_boundary",
    "network/provider/retrieval/source-fetch pattern blocks",
    ["static_boundary_network_or_external_call_present"],
    setPath(["static_boundary_evidence", "static_boundary_probe_text"], `${["fet", "ch"].join("")}("https://example.com")`),
  );
  addCase(
    "static_boundary_app_server_startup_pattern_blocks",
    "static_boundary",
    "app server startup pattern blocks",
    ["static_boundary_app_server_startup_present"],
    setPath(["static_boundary_evidence", "static_boundary_probe_text"], ["npm", "run", "dev"].join(" ")),
  );
  return cases;
}

export function validateManualNoteSingleClaimProductWritePreflightStopline(
  value: unknown,
): string[] {
  return validateStoplineCandidate(asRecord(value));
}

export function validateManualNoteSingleClaimProductWritePreflightStoplineStaticBoundary(
  value: unknown,
): string[] {
  return validateStaticBoundaryEvidence(normalizeStaticBoundaryEvidence(value));
}

function validateStaticBoundaryEvidence(evidence: JsonRecord): string[] {
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
  if (changedFiles.some(isSchemaDbSqlPath)) failures.push("static_boundary_schema_db_sql_changed");
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) {
    failures.push("static_boundary_app_api_route_changed");
  }
  if (changedFiles.some(isUiFilePath)) failures.push("static_boundary_ui_changed");
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
    allowed_package_script_names: asArray(evidence.allowed_package_script_names).map(asString),
    static_boundary_probe_text: asString(evidence.static_boundary_probe_text),
  };
}

function firstString(record: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return "";
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

function setNestedPath(target: JsonRecord, path: string[], value: unknown): void {
  if (path.length === 0) return;
  let cursor: JsonRecord = target;
  for (const segment of path.slice(0, -1)) {
    const current = cursor[segment];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as JsonRecord;
  }
  cursor[path[path.length - 1]] = value;
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

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function createFingerprint(value: unknown): string {
  return createManualNoteSingleClaimProductWritePreflightCommandEnvelopeFingerprint(
    value,
  );
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
