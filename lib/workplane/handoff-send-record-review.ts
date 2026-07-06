import {
  HANDOFF_SEND_RECORD_REVIEW_VERSION,
  type HandoffSendNoSideEffectsSummary,
  type HandoffSendRecordReview,
  type HandoffSendRecordReviewAuthorityBoundary,
  type HandoffSendRecordReviewInput,
  type HandoffSendRecordReviewStatus,
  type HandoffSendRecordSummary,
} from "@/types/handoff-send-record-review";
import {
  HANDOFF_SEND_RECORD_VERSION,
  HANDOFF_SEND_STORE_VERSION,
  HANDOFF_SEND_WRITE_SCOPE,
  type HandoffSendNoSideEffects,
  type HandoffSendRecord,
  type HandoffSendStoreResult,
} from "@/types/handoff-send-write";

type RecordValue = Record<string, unknown>;

const allowedReceiptTrueFields = [
  "handoff_send_record_written",
  "handoff_send_receipt_written",
  "handoff_send_persisted",
  "local_handoff_send_fulfillment_recorded",
] as const;

const forbiddenNoSideEffectFields = [
  "handoff_sent",
  "handoff_sent_externally",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "provider_called",
  "github_called",
  "codex_executed",
  "codex_session_transferred",
  "browser_or_crawler_called",
  "network_send_performed",
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
  "handoff_send_contract_record_written",
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
  "durable_local_handoff_send_record",
  "local_project_handoff_send_only",
  "can_write_db",
  "can_create_handoff_send_record",
  "can_create_handoff_send_receipt",
  "can_record_local_send_fulfillment",
] as const;

const writeAuthorityFalseFields = [
  "source_of_truth",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_transfer_codex_session",
  "can_call_browser_or_crawler",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_packet_file",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
  "can_write_handoff_send_contract_record",
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

export function buildHandoffSendRecordReviewV01(
  input: HandoffSendRecordReviewInput = {},
): HandoffSendRecordReview {
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
      ? ["handoff_send_receipt_side_effect_invalid"]
      : [];
  const validRecords = rawRecords.filter(
    (record, index): record is HandoffSendRecord =>
      isHandoffSendRecord(record) && summaries[index].problem_reasons.length === 0,
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
    .map((summary) => summary.record_id)
    .filter((id): id is string => Boolean(id));

  return {
    review_version: HANDOFF_SEND_RECORD_REVIEW_VERSION,
    scope: HANDOFF_SEND_WRITE_SCOPE,
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
      has_records: rawRecords.length > 0,
      has_valid_records: validRecords.length > 0,
      has_invalid_records: invalidCount > 0,
      selected_record_found: Boolean(selectedRecord),
      send_surfaces: uniqueStrings(validRecords.map((record) => record.requested_send_surface)),
      delivery_modes: uniqueStrings(validRecords.map((record) => record.requested_delivery_mode)),
      recipient_refs: uniqueStrings(validRecords.map((record) => record.requested_recipient_ref)),
      send_execution_modes: uniqueStrings(
        validRecords.map((record) => record.requested_send_execution_mode),
      ),
      fulfillment_statuses: uniqueStrings(
        validRecords.map((record) => record.fulfillment_status),
      ),
      source_handoff_send_contract_record_refs: uniqueStrings(
        validRecords.map((record) => record.source_handoff_send_contract_record_ref),
      ),
      source_exported_artifact_refs: uniqueStrings(
        validRecords.map((record) => record.source_exported_artifact_ref),
      ),
      payload_hashes: uniqueStrings(validRecords.map((record) => record.payload_hash)),
      payload_types: uniqueStrings(validRecords.map((record) => record.payload_type)),
      problem_record_ids: problemIds,
    },
    handoff_send_material_summary: {
      latest_record_id: latestRecord?.record_id ?? null,
      latest_fulfillment_status: latestRecord?.fulfillment_status ?? null,
      latest_payload_hash: latestRecord?.payload_hash ?? null,
      latest_payload_type: latestRecord?.payload_type ?? null,
      latest_source_handoff_send_contract_record_ref:
        latestRecord?.source_handoff_send_contract_record_ref ?? null,
      external_delivery_performed: false,
      provider_called: false,
    },
    receipt_no_side_effects_summary: noSideEffectsSummary,
    blocked_reasons: [
      ...summaries.flatMap((summary) => summary.problem_reasons),
      ...storeReceiptProblemReasons,
    ],
    insufficient_data_reasons:
      rawRecords.length === 0 && reviewStatus !== "schema_missing"
        ? ["handoff_send_records_missing"]
        : [],
    operator_review_checklist: [
      "confirm_local_handoff_send_fulfillment_records_are_scoped_to_project_augnes",
      "confirm_local_handoff_send_fulfillment_recorded_does_not_mean_external_delivery",
      "confirm_provider_email_slack_webhook_github_codex_browser_network_clipboard_download_file_and_live_mutation_are_false",
    ],
    would_not_do: [
      "does_not_send_handoff_externally",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_or_network",
      "does_not_write_clipboard_download_or_arbitrary_file",
      "does_not_mutate_live_handoff_context_selected_refs_memory_metrics_or_routes",
    ],
    non_goals: [
      "provider_specific_external_delivery",
      "live_handoff_packet_mutation",
      "memory_or_metrics_promotion",
      "workbench_action_button",
    ],
    authority_boundary: createHandoffSendRecordReviewAuthorityBoundaryV01(),
  };
}

export function createHandoffSendRecordReviewAuthorityBoundaryV01():
  HandoffSendRecordReviewAuthorityBoundary {
  return {
    read_only: true,
    review_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_handoff_send_record: false,
    can_create_handoff_send_receipt: false,
    can_record_local_send_fulfillment: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_transfer_codex_session: false,
    can_call_browser_or_crawler: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_send_contract_record: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_render_workbench_action_button: false,
    notes: [
      "Review is read-only and does not open or create a DB by default.",
      "Valid local fulfillment rows do not mean external delivery occurred.",
    ],
  };
}

function evaluateRecord(record: unknown): HandoffSendRecordSummary {
  if (!isHandoffSendRecord(record)) return invalidSummary(record, ["record_malformed"]);
  const reasons: string[] = [];
  if (containsRawMaterialKeys(record)) reasons.push("raw_material_key_present");
  if (!isAuthorityProfileValid(record.authority_profile)) {
    reasons.push("handoff_send_record_authority_profile_invalid");
  }
  if (record.no_external_delivery_performed !== true) {
    reasons.push("no_external_delivery_performed_not_confirmed");
  }
  if (!isWriteAuthorityBoundaryValid(record.authority_boundary)) {
    reasons.push("handoff_send_record_authority_boundary_invalid");
  }
  if (!isFulfillmentValid(record.handoff_send_fulfillment)) {
    reasons.push("handoff_send_fulfillment_invalid");
  }
  if (
    record.no_side_effects !== undefined &&
    !isNoSideEffectsValid(record.no_side_effects)
  ) {
    reasons.push("handoff_send_record_no_side_effects_invalid");
  }
  return summarizeRecord(record, reasons);
}

function summarizeRecord(
  record: HandoffSendRecord,
  problemReasons: string[],
): HandoffSendRecordSummary {
  return {
    record_id: record.record_id,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    operator_ref: record.operator_ref,
    requested_send_surface: record.requested_send_surface,
    requested_delivery_mode: record.requested_delivery_mode,
    requested_recipient_ref: record.requested_recipient_ref,
    requested_send_execution_mode: record.requested_send_execution_mode,
    fulfillment_status: record.fulfillment_status,
    source_handoff_send_contract_record_ref:
      record.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: record.source_exported_artifact_ref,
    payload_hash: record.payload_hash,
    payload_type: record.payload_type,
    receipt_no_side_effects_valid:
      !problemReasons.includes("handoff_send_record_no_side_effects_invalid"),
    authority_boundary_valid: !problemReasons.includes(
      "handoff_send_record_authority_boundary_invalid",
    ),
    authority_profile_valid: !problemReasons.includes(
      "handoff_send_record_authority_profile_invalid",
    ),
    no_external_delivery_performed: record.no_external_delivery_performed === true,
    problem_reasons: problemReasons,
  };
}

function invalidSummary(record: unknown, reasons: string[]): HandoffSendRecordSummary {
  const candidate = isRecord(record) ? record : {};
  return {
    record_id: typeof candidate.record_id === "string" ? candidate.record_id : null,
    idempotency_key:
      typeof candidate.idempotency_key === "string"
        ? candidate.idempotency_key
        : null,
    created_at: typeof candidate.created_at === "string" ? candidate.created_at : null,
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
    requested_send_execution_mode:
      typeof candidate.requested_send_execution_mode === "string"
        ? candidate.requested_send_execution_mode
        : null,
    fulfillment_status:
      typeof candidate.fulfillment_status === "string"
        ? candidate.fulfillment_status
        : null,
    source_handoff_send_contract_record_ref:
      typeof candidate.source_handoff_send_contract_record_ref === "string"
        ? candidate.source_handoff_send_contract_record_ref
        : null,
    source_exported_artifact_ref:
      typeof candidate.source_exported_artifact_ref === "string"
        ? candidate.source_exported_artifact_ref
        : null,
    payload_hash:
      typeof candidate.payload_hash === "string" ? candidate.payload_hash : null,
    payload_type:
      typeof candidate.payload_type === "string" ? candidate.payload_type : null,
    receipt_no_side_effects_valid: false,
    authority_boundary_valid: false,
    authority_profile_valid: false,
    no_external_delivery_performed: false,
    problem_reasons: reasons,
  };
}

function isHandoffSendRecord(value: unknown): value is HandoffSendRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version === HANDOFF_SEND_RECORD_VERSION &&
      value.scope === HANDOFF_SEND_WRITE_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.idempotency_key === "string" &&
      typeof value.created_at === "string" &&
      typeof value.operator_ref === "string" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs) &&
      typeof value.source_handoff_send_contract_record_ref === "string" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      typeof value.requested_send_execution_mode === "string" &&
      isRecord(value.handoff_send_fulfillment) &&
      typeof value.fulfillment_status === "string" &&
      typeof value.payload_hash === "string" &&
      typeof value.payload_type === "string" &&
      isRecord(value.authority_profile) &&
      value.review_status === "recorded_as_scoped_local_handoff_send_fulfillment" &&
      value.persistence_horizon === "local_project_handoff_send_store" &&
      isRecord(value.write_validation) &&
      isRecord(value.authority_boundary) &&
      typeof value.record_fingerprint === "string",
  );
}

function isFulfillmentValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const summary = getRecord(value, "no_external_delivery_summary");
  const safety = getRecord(value, "public_safety_summary");
  return Boolean(
    value.fulfillment_version === "handoff_send_fulfillment.v0.1" &&
      typeof value.fulfillment_ref === "string" &&
      value.scope === HANDOFF_SEND_WRITE_SCOPE &&
      typeof value.source_handoff_send_contract_record_ref === "string" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_send_execution_mode === "string" &&
      typeof value.fulfillment_status === "string" &&
      safety?.public_safe === true &&
      safety.raw_private_material_excluded === true &&
      summary?.provider_call_performed === false &&
      summary.external_messaging_called === false &&
      summary.email_called === false &&
      summary.slack_called === false &&
      summary.webhook_called === false &&
      summary.github_called === false &&
      summary.codex_transfer_performed === false &&
      summary.browser_or_crawler_called === false &&
      summary.network_send_performed === false,
  );
}

function isAuthorityProfileValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Boolean(
    value.durable_local_handoff_send_record === true &&
      value.local_project_handoff_send_only === true &&
      value.handoff_send_record_written === true &&
      value.handoff_send_receipt_written === true &&
      value.local_handoff_send_fulfillment_recorded === true &&
      value.source_of_truth === false &&
      forbiddenNoSideEffectFields.every((field) => value[field] === false),
  );
}

function isWriteAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    writeAuthorityTrueFields.every((field) => value[field] === true) &&
    writeAuthorityFalseFields.every((field) => value[field] === false)
  );
}

function isNoSideEffectsValid(value: unknown): value is HandoffSendNoSideEffects {
  if (!isRecord(value)) return false;
  return (
    allowedReceiptTrueFields.every((field) => typeof value[field] === "boolean") &&
    forbiddenNoSideEffectFields.every((field) => value[field] === false)
  );
}

function summarizeNoSideEffects(
  value: HandoffSendNoSideEffects | undefined,
): HandoffSendNoSideEffectsSummary {
  if (!value) {
    return {
      allowed_local_write_true_fields: [],
      forbidden_true_fields: [],
      has_forbidden_true_field: false,
      local_fulfillment_recorded_only: false,
    };
  }
  const allowedLocalTrue = allowedReceiptTrueFields.filter(
    (field) => value[field] === true,
  );
  const forbiddenTrue = forbiddenNoSideEffectFields.filter(
    (field) => (value as unknown as Record<string, unknown>)[field] === true,
  );
  return {
    allowed_local_write_true_fields: allowedLocalTrue,
    forbidden_true_fields: forbiddenTrue,
    has_forbidden_true_field: forbiddenTrue.length > 0,
    local_fulfillment_recorded_only:
      allowedLocalTrue.includes("local_handoff_send_fulfillment_recorded") &&
      forbiddenTrue.length === 0,
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
  storeResult: HandoffSendStoreResult | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): HandoffSendRecordReviewStatus {
  if (storeResult?.status === "schema_missing") return "schema_missing";
  if (invalidCount > 0) return "records_invalid";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  if (validCount > 0) return "records_available";
  if (suppliedCount > 0) return "records_invalid";
  return "no_records";
}

function isStoreResult(value: unknown): value is HandoffSendStoreResult {
  return Boolean(
    isRecord(value) &&
      value.store_version === HANDOFF_SEND_STORE_VERSION &&
      value.scope === HANDOFF_SEND_WRITE_SCOPE &&
      typeof value.status === "string" &&
      Array.isArray(value.records) &&
      isRecord(value.receipt),
  );
}

function containsRawMaterialKeys(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    if (["raw_text", "raw_report", "raw_excerpt"].includes(key)) return true;
    if (Array.isArray(entry)) return entry.some(containsRawMaterialKeys);
    return isRecord(entry) ? containsRawMaterialKeys(entry) : false;
  });
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function getRecord(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
