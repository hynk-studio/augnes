import {
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
  type ExternalHandoffDeliveryContractRecord,
  type ExternalHandoffDeliveryContractRecordReview,
  type ExternalHandoffDeliveryContractRecordReviewInput,
  type ExternalHandoffDeliveryContractRecordSummary,
  type ExternalHandoffDeliveryContractReviewStatus,
} from "@/types/external-handoff-delivery-contract";
import {
  createExternalHandoffDeliveryContractAuthorityBoundaryV01,
} from "@/lib/workplane/external-handoff-delivery-contract-preview";

type RecordValue = Record<string, unknown>;

export function buildExternalHandoffDeliveryContractRecordReviewV01(
  input: ExternalHandoffDeliveryContractRecordReviewInput = {},
): ExternalHandoffDeliveryContractRecordReview {
  const asOf = input.as_of ?? new Date().toISOString();
  const storeResult = isRecord(input.store_result) ? input.store_result : null;
  const rawRecords =
    input.records ??
    (storeResult?.status === "schema_missing" ? [] : storeResult?.records) ??
    [];
  const summaries = rawRecords.map(summarizeUnknownRecord);
  const validRecords = rawRecords.filter(
    (record, index): record is ExternalHandoffDeliveryContractRecord =>
      isExternalHandoffDeliveryContractRecord(record) &&
      summaries[index].problem_reasons.length === 0,
  );
  const invalidCount = summaries.filter(
    (summary) => summary.problem_reasons.length > 0,
  ).length;
  const selectedRecord =
    input.selected_record_id && validRecords.length
      ? validRecords.find((record) => record.record_id === input.selected_record_id) ??
        null
      : null;
  const latestRecord =
    validRecords.slice().sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
  const reviewStatus = determineStatus({
    storeStatus: typeof storeResult?.status === "string" ? storeResult.status : null,
    suppliedCount: rawRecords.length,
    validCount: validRecords.length,
    invalidCount,
    selectedRecordId: input.selected_record_id ?? null,
    selectedRecordFound: Boolean(selectedRecord),
  });
  return {
    review_version: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION,
    scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
    as_of: asOf,
    review_status: reviewStatus,
    selected_record_summary: selectedRecord ? summarizeRecord(selectedRecord) : null,
    latest_record_summary: latestRecord ? summarizeRecord(latestRecord) : null,
    record_summaries: summaries,
    input_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      invalid_record_count: invalidCount,
      selected_record_id: input.selected_record_id ?? null,
      selected_record_found: Boolean(selectedRecord),
    },
    evidence_summary: {
      has_valid_records: validRecords.length > 0,
      source_local_fulfillment_refs: uniqueStrings(
        validRecords.map((record) => record.source_local_fulfillment_ref),
      ),
      source_exported_artifact_refs: uniqueStrings(
        validRecords.map((record) => record.source_exported_artifact_ref),
      ),
      payload_hashes: uniqueStrings(validRecords.map((record) => record.payload_hash)),
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
    },
    blocked_reasons:
      reviewStatus === "records_invalid"
        ? ["external_handoff_delivery_contract_records_invalid"]
        : [],
    insufficient_data_reasons:
      reviewStatus === "no_records" || reviewStatus === "schema_missing"
        ? ["external_handoff_delivery_contract_record_missing"]
        : [],
    source_refs: input.source_refs ?? [],
    records: validRecords,
    authority_boundary:
      createExternalHandoffDeliveryContractAuthorityBoundaryV01(),
  };
}

function determineStatus({
  storeStatus,
  suppliedCount,
  validCount,
  invalidCount,
  selectedRecordId,
  selectedRecordFound,
}: {
  storeStatus: string | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): ExternalHandoffDeliveryContractReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (invalidCount > 0) return "records_invalid";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  if (validCount > 0) return "records_available";
  if (suppliedCount === 0) return "no_records";
  return "records_invalid";
}

function summarizeUnknownRecord(
  value: unknown,
): ExternalHandoffDeliveryContractRecordSummary {
  if (!isExternalHandoffDeliveryContractRecord(value)) {
    const record = isRecord(value) ? value : {};
    const boundary = recordField(record, "external_delivery_boundary");
    return {
      record_id: stringField(record, "record_id"),
      created_at: stringField(record, "created_at"),
      source_local_fulfillment_ref: stringField(
        record,
        "source_local_fulfillment_ref",
      ),
      source_handoff_send_contract_record_ref: stringField(
        record,
        "source_handoff_send_contract_record_ref",
      ),
      source_exported_artifact_ref: stringField(
        record,
        "source_exported_artifact_ref",
      ),
      payload_hash: stringField(record, "payload_hash"),
      payload_type: stringField(record, "payload_type"),
      requested_delivery_surface: stringField(
        record,
        "requested_delivery_surface",
      ),
      requested_delivery_mode: stringField(record, "requested_delivery_mode"),
      requested_recipient_ref: stringField(record, "requested_recipient_ref"),
      contract_status: stringField(record, "contract_status"),
      delivery_performed: boundary?.delivery_performed === true,
      provider_called: boundary?.provider_called === true,
      external_message_sent: boundary?.external_message_sent === true,
      problem_reasons: uniqueStrings([
        "external_handoff_delivery_contract_record_malformed",
        ...recordProblemReasons(record),
      ]),
    };
  }
  return summarizeRecord(value);
}

function summarizeRecord(
  record: ExternalHandoffDeliveryContractRecord,
): ExternalHandoffDeliveryContractRecordSummary {
  return {
    record_id: record.record_id,
    created_at: record.created_at,
    source_local_fulfillment_ref: record.source_local_fulfillment_ref,
    source_handoff_send_contract_record_ref:
      record.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: record.source_exported_artifact_ref,
    payload_hash: record.payload_hash,
    payload_type: record.payload_type,
    requested_delivery_surface: record.requested_delivery_surface,
    requested_delivery_mode: record.requested_delivery_mode,
    requested_recipient_ref: record.requested_recipient_ref,
    contract_status: record.contract_status,
    delivery_performed: record.external_delivery_boundary.delivery_performed,
    provider_called: record.external_delivery_boundary.provider_called,
    external_message_sent:
      record.external_delivery_boundary.external_message_sent,
    problem_reasons: recordProblemReasons(record),
  };
}

function recordProblemReasons(
  record: ExternalHandoffDeliveryContractRecord | RecordValue,
): string[] {
  const boundary = recordField(record, "external_delivery_boundary");
  const receipt = recordField(record, "receipt");
  return uniqueStrings([
    ...(record.scope !== EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE
      ? ["external_handoff_delivery_contract_record_scope_invalid"]
      : []),
    ...(!stringField(record, "source_local_fulfillment_ref")
      ? ["source_local_fulfillment_ref_missing"]
      : []),
    ...(!stringField(record, "source_handoff_send_contract_record_ref")
      ? ["source_handoff_send_contract_record_ref_missing"]
      : []),
    ...(!stringField(record, "source_exported_artifact_ref")
      ? ["source_exported_artifact_ref_missing"]
      : []),
    ...(!stringField(record, "payload_hash") ? ["payload_hash_missing"] : []),
    ...externalDeliveryBoundaryProblems(boundary),
    ...(receipt?.no_side_effects !== true
      ? ["receipt_no_side_effects_not_true"]
      : []),
    ...(receipt?.external_delivery_performed
      ? ["receipt_external_delivery_performed_true"]
      : []),
    ...(receipt?.provider_called ? ["receipt_provider_called_true"] : []),
    ...(receipt?.external_message_sent
      ? ["receipt_external_message_sent_true"]
      : []),
    ...(receipt?.network_called ? ["receipt_network_called_true"] : []),
    ...(receipt?.clipboard_written ? ["receipt_clipboard_written_true"] : []),
    ...(receipt?.file_downloaded ? ["receipt_file_downloaded_true"] : []),
    ...authorityProblems(record.authority_boundary),
  ]);
}

function externalDeliveryBoundaryProblems(boundary: RecordValue | null): string[] {
  if (!boundary) return ["external_delivery_boundary_missing"];
  return [
    ["delivery_performed", "external_delivery_performed_true"],
    ["provider_contract_present", "provider_contract_present_true"],
    ["provider_specific_delivery", "provider_specific_delivery_true"],
    ["provider_called", "provider_called_true"],
    ["external_message_sent", "external_message_sent_true"],
    ["email_sent", "email_sent_true"],
    ["slack_sent", "slack_sent_true"],
    ["webhook_called", "webhook_called_true"],
    ["network_called", "network_called_true"],
    ["clipboard_written", "clipboard_written_true"],
    ["file_downloaded", "file_downloaded_true"],
    [
      "local_fulfillment_is_external_delivery",
      "local_fulfillment_is_external_delivery_true",
    ],
  ].flatMap(([field, reason]) => (boundary[field] === true ? [reason] : []));
}

function authorityProblems(value: unknown): string[] {
  const boundary = isRecord(value) ? value : {};
  return [
    "can_send_handoff",
    "can_call_send_provider",
    "can_call_external_messaging",
    "can_call_email",
    "can_call_slack",
    "can_call_webhook",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_call_browser_or_crawler",
    "can_write_clipboard",
    "can_download_file",
    "can_write_arbitrary_file",
    "can_mutate_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_write_handoff_send_record",
    "can_write_memory",
    "can_write_dogfood_metrics",
    "can_render_workbench_action_button",
  ].flatMap((field) =>
    boundary[field] === true
      ? [`external_handoff_delivery_contract_authority_forbidden_true:${field}`]
      : [],
  );
}

function isExternalHandoffDeliveryContractRecord(
  value: unknown,
): value is ExternalHandoffDeliveryContractRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version === EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION &&
      value.scope === EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.created_at === "string" &&
      typeof value.source_local_fulfillment_ref === "string" &&
      typeof value.source_handoff_send_contract_record_ref === "string" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.payload_hash === "string" &&
      isRecord(value.external_delivery_boundary) &&
      isRecord(value.receipt) &&
      isRecord(value.authority_boundary),
  );
}

function stringField(value: unknown, key: string): string | null {
  return isRecord(value) && typeof value[key] === "string"
    ? value[key]
    : null;
}

function recordField(value: unknown, key: string): RecordValue | null {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
