import {
  HANDOFF_SEND_CONTRACT_RECORD_REVIEW_VERSION,
  type HandoffSendContractNoSideEffectsSummary,
  type HandoffSendContractRecordReview,
  type HandoffSendContractRecordReviewAuthorityBoundary,
  type HandoffSendContractRecordReviewInput,
  type HandoffSendContractRecordReviewStatus,
  type HandoffSendContractRecordSummary,
} from "@/types/handoff-send-contract-record-review";
import {
  HANDOFF_SEND_CONTRACT_RECORD_VERSION,
  HANDOFF_SEND_CONTRACT_STORE_VERSION,
  HANDOFF_SEND_CONTRACT_WRITE_SCOPE,
  type HandoffSendContractNoSideEffects,
  type HandoffSendContractRecord,
  type HandoffSendContractStoreResult,
} from "@/types/handoff-send-contract-write";

type RecordValue = Record<string, unknown>;

const allowedReceiptTrueFields = [
  "handoff_send_contract_record_written",
  "handoff_send_contract_receipt_written",
  "handoff_send_contract_persisted",
  "handoff_send_contract_written",
] as const;

const forbiddenNoSideEffectFields = [
  "handoff_sent",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "provider_called",
  "github_called",
  "codex_executed",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "handoff_packet_copied_to_clipboard",
  "handoff_packet_exported_to_file",
  "handoff_packet_download_created",
  "handoff_packet_copied",
  "handoff_packet_exported",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_packet_copy_export_record_written",
  "handoff_packet_exported_artifact_written",
  "handoff_packet_copy_export_contract_record_written",
  "handoff_context_apply_record_written",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_contract_record_written",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
] as const;

const writeAuthorityTrueFields = [
  "durable_local_handoff_send_contract",
  "local_project_handoff_send_contract_only",
  "can_write_db",
  "can_create_handoff_send_contract_record",
  "can_create_handoff_send_contract_receipt",
] as const;

const writeAuthorityFalseFields = [
  "source_of_truth",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_packet_file",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
  "can_write_handoff_packet_copy_export_record",
  "can_write_handoff_packet_exported_artifact",
  "can_write_handoff_packet_copy_export_contract_record",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
  "can_write_handoff_context_update_contract_record",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_continuity_relay",
  "can_update_continuity_relay",
  "can_apply_live_relay_state",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_update_global_dogfood_metrics",
  "can_write_dogfood_metrics",
  "can_write_dogfood_metric_snapshot",
  "can_write_reuse_outcome_ledger",
  "can_write_expected_observed_delta",
  "can_write_work_episode",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
] as const;

export function buildHandoffSendContractRecordReviewV01(
  input: HandoffSendContractRecordReviewInput = {},
): HandoffSendContractRecordReview {
  const asOf = input.as_of ?? new Date().toISOString();
  const sourceRefs = input.source_refs ?? [];
  const storeResult = isStoreResult(input.store_result) ? input.store_result : null;
  const rawRecords =
    input.records ??
    (storeResult?.status === "schema_missing" ? [] : storeResult?.records) ??
    [];
  const summaries = rawRecords.map(evaluateRecord);
  const storeReceiptProblemReasons =
    storeResult && !isNoSideEffectsValid(storeResult.receipt.no_side_effects)
      ? ["handoff_send_contract_receipt_side_effect_invalid"]
      : [];
  const validRecords = rawRecords.filter(
    (record, index): record is HandoffSendContractRecord =>
      isHandoffSendContractRecord(record) &&
      summaries[index].problem_reasons.length === 0,
  );
  const selectedRecord =
    input.selected_record_id && validRecords.length
      ? validRecords.find((record) => record.record_id === input.selected_record_id) ??
        null
      : null;
  const latestRecord =
    validRecords.slice().sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
  const selectedSummary = selectedRecord ? summarizeRecord(selectedRecord, []) : null;
  const latestSummary = latestRecord ? summarizeRecord(latestRecord, []) : null;
  const invalidCount =
    summaries.filter((summary) => summary.problem_reasons.length > 0).length +
    storeReceiptProblemReasons.length;
  const receiptProblemCount =
    summaries.filter((summary) => !summary.receipt_no_side_effects_valid).length +
    storeReceiptProblemReasons.length;
  const reviewStatus = determineReviewStatus({
    storeResult,
    suppliedCount: rawRecords.length,
    validCount: validRecords.length,
    invalidCount,
    selectedRecordId: input.selected_record_id ?? null,
    selectedRecordFound: Boolean(selectedRecord),
  });
  const noSideEffectsSummary = summarizeNoSideEffects(
    storeResult?.receipt.no_side_effects,
  );
  const problemIds = summaries
    .filter((summary) => summary.problem_reasons.length > 0)
    .map((summary) => summary.record_id);

  return {
    review_version: HANDOFF_SEND_CONTRACT_RECORD_REVIEW_VERSION,
    scope: HANDOFF_SEND_CONTRACT_WRITE_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      invalid_record_count: invalidCount,
      selected_record_id: input.selected_record_id ?? null,
      selected_record_found: Boolean(selectedRecord),
      latest_record_id: latestRecord?.record_id ?? null,
      latest_record_created_at: latestRecord?.created_at ?? null,
      receipt_side_effect_problem_count: receiptProblemCount,
    },
    record_summaries: summaries,
    selected_record_summary: selectedSummary,
    latest_record_summary: latestSummary,
    records: validRecords,
    evidence_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      has_records: validRecords.length > 0,
      has_selected_record: Boolean(selectedRecord),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: validRecords.some((record) => record.evidence_refs.length > 0),
      has_missing_evidence: validRecords.length === 0,
      has_receipt_side_effect_problem: receiptProblemCount > 0,
      source_refs: uniqueStrings([
        ...sourceRefs,
        ...validRecords.flatMap((record) => record.source_refs),
      ]),
      evidence_refs: uniqueStrings(
        validRecords.flatMap((record) => record.evidence_refs),
      ),
      missing_evidence:
        validRecords.length === 0
          ? ["handoff_send_contract_records_missing"]
          : [],
      problem_record_ids: problemIds,
    },
    handoff_send_contract_material_summary: {
      send_surface_counts: countBy(
        validRecords.map((record) => record.requested_send_surface),
      ),
      delivery_mode_counts: countBy(
        validRecords.map((record) => record.requested_delivery_mode),
      ),
      recipient_refs: uniqueStrings(
        validRecords.map((record) => record.requested_recipient_ref),
      ),
      source_exported_artifact_refs: uniqueStrings(
        validRecords.map((record) => record.source_exported_artifact_ref),
      ),
      source_handoff_packet_copy_export_record_refs: uniqueStrings(
        validRecords.map(
          (record) => record.source_handoff_packet_copy_export_record_ref,
        ),
      ),
      packet_format_counts: countBy(
        validRecords.map((record) => record.proposed_send_envelope.packet_format),
      ),
      payload_hashes: uniqueStrings(
        validRecords.map((record) => record.proposed_send_envelope.payload_hash),
      ),
    },
    receipt_no_side_effects_summary: noSideEffectsSummary,
    blocked_reasons: uniqueStrings(
      summaries
        .flatMap((summary) => summary.problem_reasons)
        .concat(storeReceiptProblemReasons),
    ),
    insufficient_data_reasons:
      validRecords.length === 0 ? ["handoff_send_contract_records_missing"] : [],
    operator_review_checklist: [
      "confirm_records_are_scoped_local_handoff_send_contracts_only",
      "confirm_no_send_provider_email_slack_webhook_clipboard_download_file_or_live_mutation_receipt_claims",
      "confirm_source_exported_artifact_refs_payload_hashes_and_packet_formats_match",
    ],
    would_not_do: [
      "does_not_send_handoff",
      "does_not_call_provider_external_messaging_email_slack_webhook_github_codex_or_openai",
      "does_not_write_clipboard_download_or_arbitrary_file",
      "does_not_mutate_live_handoff_context_selected_refs_route_cwp_relay_memory_metrics_or_external_systems",
    ],
    non_goals: [
      "no_actual_handoff_send",
      "no_send_provider_or_external_message_call",
      "no_clipboard_download_or_file_write",
      "no_live_handoff_context_or_selected_refs_mutation",
    ],
    authority_boundary: createHandoffSendContractRecordReviewAuthorityBoundaryV01(),
  };
}

export function createHandoffSendContractRecordReviewAuthorityBoundaryV01():
  HandoffSendContractRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_handoff_send_contract_record: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_handoff_packet_file: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_create_graph_or_vector_store: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Review is read-only and accepts already-read send contract records or store results.",
      "It flags records invalid when they claim send, provider, external messaging, clipboard, download, file, live handoff, route, memory, metrics, or external authority.",
    ],
  };
}

function evaluateRecord(record: unknown): HandoffSendContractRecordSummary {
  if (!isHandoffSendContractRecord(record)) {
    return summarizeMalformedRecord(record, [
      "handoff_send_contract_record_malformed",
    ]);
  }
  const reasons: string[] = [];
  if (!isAuthorityProfileValid(record.authority_profile)) {
    reasons.push("handoff_send_contract_record_authority_profile_invalid");
  }
  if (record.no_handoff_send_performed !== true) {
    reasons.push("handoff_send_contract_record_no_handoff_send_performed_invalid");
  }
  if (!isWriteAuthorityBoundaryValid(record.authority_boundary)) {
    reasons.push("handoff_send_contract_record_authority_boundary_invalid");
  }
  if (!isProposedSendContractValid(record.proposed_handoff_send_contract)) {
    reasons.push("handoff_send_contract_record_proposed_contract_invalid");
  }
  if (!isSendEnvelopeValid(record.proposed_send_envelope)) {
    reasons.push("handoff_send_contract_record_send_envelope_invalid");
  }
  if (!recordContractEnvelopeMatch(record)) {
    reasons.push("handoff_send_contract_record_contract_envelope_mismatch");
  }
  if (
    isRecord((record as unknown as RecordValue).no_side_effects) &&
    !isNoSideEffectsValid((record as unknown as RecordValue).no_side_effects)
  ) {
    reasons.push("handoff_send_contract_record_no_side_effects_invalid");
  }
  if (containsRawMaterialKey(record)) {
    reasons.push("handoff_send_contract_record_raw_material_refused");
  }
  return summarizeRecord(record, reasons);
}

function summarizeRecord(
  record: HandoffSendContractRecord,
  problemReasons: string[],
): HandoffSendContractRecordSummary {
  return {
    record_id: record.record_id,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    operator_ref: record.operator_ref,
    requested_send_surface: record.requested_send_surface,
    requested_delivery_mode: record.requested_delivery_mode,
    requested_recipient_ref: record.requested_recipient_ref,
    source_exported_artifact_ref: record.source_exported_artifact_ref,
    source_handoff_packet_copy_export_record_ref:
      record.source_handoff_packet_copy_export_record_ref,
    packet_format: record.proposed_send_envelope.packet_format,
    payload_hash: record.proposed_send_envelope.payload_hash,
    record_fingerprint: record.record_fingerprint,
    receipt_no_side_effects_valid: problemReasons.every(
      (reason) => reason !== "handoff_send_contract_receipt_side_effect_invalid",
    ),
    problem_reasons: uniqueStrings(problemReasons),
  };
}

function summarizeMalformedRecord(
  record: unknown,
  problemReasons: string[],
): HandoffSendContractRecordSummary {
  const candidate = isRecord(record) ? record : {};
  return {
    record_id:
      typeof candidate.record_id === "string" ? candidate.record_id : "malformed",
    idempotency_key:
      typeof candidate.idempotency_key === "string"
        ? candidate.idempotency_key
        : "malformed",
    created_at:
      typeof candidate.created_at === "string" ? candidate.created_at : "",
    operator_ref:
      typeof candidate.operator_ref === "string" ? candidate.operator_ref : null,
    requested_send_surface:
      typeof candidate.requested_send_surface === "string"
        ? candidate.requested_send_surface
        : null,
    requested_delivery_mode:
      typeof candidate.requested_delivery_mode === "string"
        ? candidate.requested_delivery_mode
        : null,
    requested_recipient_ref:
      typeof candidate.requested_recipient_ref === "string"
        ? candidate.requested_recipient_ref
        : null,
    source_exported_artifact_ref:
      typeof candidate.source_exported_artifact_ref === "string"
        ? candidate.source_exported_artifact_ref
        : null,
    source_handoff_packet_copy_export_record_ref: null,
    packet_format: null,
    payload_hash: null,
    record_fingerprint:
      typeof candidate.record_fingerprint === "string"
        ? candidate.record_fingerprint
        : null,
    receipt_no_side_effects_valid: false,
    problem_reasons: problemReasons,
  };
}

function isHandoffSendContractRecord(
  value: unknown,
): value is HandoffSendContractRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version === HANDOFF_SEND_CONTRACT_RECORD_VERSION &&
      value.scope === HANDOFF_SEND_CONTRACT_WRITE_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.idempotency_key === "string" &&
      typeof value.created_at === "string" &&
      typeof value.operator_ref === "string" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs) &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      isRecord(value.proposed_handoff_send_contract) &&
      isRecord(value.proposed_send_envelope) &&
      Array.isArray(value.proposed_send_steps) &&
      Array.isArray(value.proposed_send_preconditions) &&
      value.review_status === "recorded_as_scoped_handoff_send_contract" &&
      value.persistence_horizon === "local_project_handoff_send_contract_store" &&
      value.no_handoff_send_performed === true &&
      typeof value.record_fingerprint === "string",
  );
}

function isAuthorityProfileValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.durable_local_handoff_send_contract === true &&
    value.source_of_truth === false &&
    value.local_project_handoff_send_contract_only === true &&
    value.handoff_send_contract_written === true &&
    value.handoff_sent === false &&
    value.send_provider_called === false &&
    value.external_messaging_called === false &&
    value.email_called === false &&
    value.slack_called === false &&
    value.webhook_called === false &&
    value.clipboard_written === false &&
    value.file_download_created === false &&
    value.arbitrary_file_written === false &&
    value.handoff_packet_file_written === false &&
    value.live_handoff_context_mutated === false &&
    value.selected_refs_written_to_live_handoff === false &&
    value.handoff_packet_copy_export_record_written === false &&
    value.handoff_packet_exported_artifact_written === false &&
    value.handoff_packet_copy_export_contract_record_written === false &&
    value.handoff_context_apply_record_written === false &&
    value.applied_handoff_context_snapshot_written === false &&
    value.handoff_context_update_contract_record_written === false &&
    value.api_perspective_current_route_modified === false &&
    value.upstream_current_working_perspective_source_tables_mutated === false &&
    value.perspective_unit_write_performed === false &&
    value.next_work_bias_write_performed === false &&
    value.continuity_relay_write_performed === false &&
    value.continuity_relay_update_performed === false &&
    value.memory_promotion_performed === false &&
    value.metric_update_performed === false
  );
}

function isWriteAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsTrue(value, writeAuthorityTrueFields) &&
    fieldsFalse(value, writeAuthorityFalseFields);
}

function isProposedSendContractValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Boolean(
    value.contract_kind === "handoff_send_contract.v0.1" &&
      value.send_family === "augnes_operator_handoff_send" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      isRecord(value.packet_payload_summary) &&
      isRecord(value.proposed_send_envelope) &&
      Array.isArray(value.proposed_send_steps) &&
      Array.isArray(value.proposed_send_preconditions) &&
      Array.isArray(value.required_source_refs) &&
      Array.isArray(value.required_evidence_refs),
  );
}

function isSendEnvelopeValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Boolean(
    value.envelope_version === "handoff_send_envelope.v0.1" &&
      typeof value.envelope_ref === "string" &&
      value.packet_family === "augnes_operator_handoff_packet" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.packet_format === "string" &&
      typeof value.payload_hash === "string" &&
      typeof value.payload_type === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      value.public_safe === true &&
      value.raw_private_material_excluded === true &&
      value.send_not_performed === true &&
      value.provider_not_called === true &&
      value.external_delivery_not_performed === true &&
      value.future_send_slice_required === true,
  );
}

function recordContractEnvelopeMatch(record: HandoffSendContractRecord): boolean {
  const contract = record.proposed_handoff_send_contract;
  const envelope = record.proposed_send_envelope;
  return (
    contract.source_exported_artifact_ref === record.source_exported_artifact_ref &&
    envelope.source_exported_artifact_ref === record.source_exported_artifact_ref &&
    contract.requested_send_surface === record.requested_send_surface &&
    envelope.requested_send_surface === record.requested_send_surface &&
    contract.requested_delivery_mode === record.requested_delivery_mode &&
    envelope.requested_delivery_mode === record.requested_delivery_mode &&
    contract.requested_recipient_ref === record.requested_recipient_ref &&
    envelope.requested_recipient_ref === record.requested_recipient_ref &&
    contract.packet_payload_summary.payload_hash === envelope.payload_hash
  );
}

function isNoSideEffectsValid(
  value: unknown,
): value is HandoffSendContractNoSideEffects {
  if (!isRecord(value)) return false;
  for (const field of forbiddenNoSideEffectFields) {
    if (value[field] !== false) return false;
  }
  for (const field of allowedReceiptTrueFields) {
    if (typeof value[field] !== "boolean") return false;
  }
  return true;
}

function summarizeNoSideEffects(
  value: HandoffSendContractNoSideEffects | undefined,
): HandoffSendContractNoSideEffectsSummary {
  const count = (field: keyof HandoffSendContractNoSideEffects) =>
    value?.[field] === true ? 1 : 0;
  return {
    handoff_send_contract_record_written_count:
      count("handoff_send_contract_record_written"),
    handoff_send_contract_receipt_written_count:
      count("handoff_send_contract_receipt_written"),
    handoff_send_contract_persisted_count:
      count("handoff_send_contract_persisted"),
    handoff_send_contract_written_count:
      count("handoff_send_contract_written"),
    handoff_sent_count: count("handoff_sent"),
    send_provider_called_count: count("send_provider_called"),
    external_messaging_called_count: count("external_messaging_called"),
    email_called_count: count("email_called"),
    slack_called_count: count("slack_called"),
    webhook_called_count: count("webhook_called"),
    provider_called_count: count("provider_called"),
    github_called_count: count("github_called"),
    codex_executed_count: count("codex_executed"),
    clipboard_written_count: count("clipboard_written"),
    file_download_created_count: count("file_download_created"),
    arbitrary_file_written_count: count("arbitrary_file_written"),
    live_handoff_context_mutated_count: count("live_handoff_context_mutated"),
    selected_refs_written_to_live_handoff_count:
      count("selected_refs_written_to_live_handoff"),
    memory_written_count: count("memory_written"),
    dogfood_metrics_written_count: count("dogfood_metrics_written"),
  };
}

function determineReviewStatus({
  storeResult,
  suppliedCount,
  validCount,
  invalidCount,
  selectedRecordId,
  selectedRecordFound,
}: {
  storeResult: HandoffSendContractStoreResult | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): HandoffSendContractRecordReviewStatus {
  if (invalidCount > 0) return "records_invalid";
  if (storeResult?.status === "schema_missing") return "schema_missing";
  if (suppliedCount === 0 || validCount === 0) return "no_records";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  return "records_available";
}

function isStoreResult(value: unknown): value is HandoffSendContractStoreResult {
  return (
    isRecord(value) &&
    value.store_version === HANDOFF_SEND_CONTRACT_STORE_VERSION &&
    value.scope === HANDOFF_SEND_CONTRACT_WRITE_SCOPE &&
    Array.isArray(value.records)
  );
}

function containsRawMaterialKey(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some(containsRawMaterialKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawMaterialKey(entry),
  );
}

function fieldsTrue(value: RecordValue, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] === true);
}

function fieldsFalse(value: RecordValue, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] === false);
}

function countBy(values: unknown[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (typeof value !== "string" || !value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .filter(Boolean),
    ),
  ).sort();
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
