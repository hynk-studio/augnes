import {
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_REVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  type ProviderSpecificDeliveryIntentContractRecord,
  type ProviderSpecificDeliveryIntentContractRecordReview,
  type ProviderSpecificDeliveryIntentContractRecordReviewInput,
  type ProviderSpecificDeliveryIntentContractRecordSummary,
  type ProviderSpecificDeliveryIntentReviewStatus,
} from "@/types/provider-specific-delivery-intent-contract";
import {
  createProviderSpecificDeliveryIntentAuthorityBoundaryV01,
  providerSpecificDeliveryIntentBoundaryProblemReasonsV01,
  providerSpecificDeliveryIntentRefProblemReasonsV01,
} from "@/lib/workplane/provider-specific-delivery-intent-contract-preview";

type RecordValue = Record<string, unknown>;

export function buildProviderSpecificDeliveryIntentContractRecordReviewV01(
  input: ProviderSpecificDeliveryIntentContractRecordReviewInput = {},
): ProviderSpecificDeliveryIntentContractRecordReview {
  const asOf = input.as_of ?? new Date().toISOString();
  const storeResult = isRecord(input.store_result) ? input.store_result : null;
  const rawRecords =
    input.records ??
    (storeResult?.status === "schema_missing" ? [] : storeResult?.records) ??
    [];
  const summaries = rawRecords.map(summarizeUnknownRecord);
  const validRecords = rawRecords.filter(
    (record, index): record is ProviderSpecificDeliveryIntentContractRecord =>
      isProviderSpecificDeliveryIntentContractRecord(record) &&
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
    review_version:
      PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_REVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
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
      provider_surfaces: uniqueStrings(
        validRecords.map((record) => record.requested_provider_surface),
      ),
      provider_profile_refs: uniqueStrings(
        validRecords.map((record) => record.provider_profile_ref),
      ),
      requested_recipient_refs: uniqueStrings(
        validRecords.map((record) => record.requested_recipient_ref),
      ),
      payload_hashes: uniqueStrings(validRecords.map((record) => record.payload_hash)),
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
      network_called: false,
    },
    blocked_reasons:
      reviewStatus === "records_invalid"
        ? ["provider_specific_delivery_intent_contract_records_invalid"]
        : [],
    insufficient_data_reasons:
      reviewStatus === "no_records" || reviewStatus === "schema_missing"
        ? ["provider_specific_delivery_intent_contract_record_missing"]
        : [],
    source_refs: input.source_refs ?? [],
    records: validRecords,
    authority_boundary:
      createProviderSpecificDeliveryIntentAuthorityBoundaryV01(),
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
}): ProviderSpecificDeliveryIntentReviewStatus {
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
): ProviderSpecificDeliveryIntentContractRecordSummary {
  if (!isProviderSpecificDeliveryIntentContractRecord(value)) {
    const record = isRecord(value) ? value : {};
    const boundary = recordField(record, "external_delivery_boundary");
    return {
      record_id: stringField(record, "record_id"),
      created_at: stringField(record, "created_at"),
      source_provider_specific_preview_fingerprint: stringField(
        record,
        "source_provider_specific_preview_fingerprint",
      ),
      source_provider_specific_decision_fingerprint: stringField(
        record,
        "source_provider_specific_decision_fingerprint",
      ),
      source_external_handoff_delivery_contract_record_ref: stringField(
        record,
        "source_external_handoff_delivery_contract_record_ref",
      ),
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
      requested_provider_surface: stringField(
        record,
        "requested_provider_surface",
      ),
      provider_profile_ref: stringField(record, "provider_profile_ref"),
      requested_recipient_ref: stringField(record, "requested_recipient_ref"),
      requested_payload_format: stringField(record, "requested_payload_format"),
      payload_hash: stringField(record, "payload_hash"),
      payload_type: stringField(record, "payload_type"),
      intent_status: stringField(record, "intent_status"),
      delivery_performed: boundary?.delivery_performed === true,
      provider_called: boundary?.provider_called === true,
      external_message_sent: boundary?.external_message_sent === true,
      network_called: boundary?.network_called === true,
      problem_reasons: uniqueStrings([
        "provider_specific_delivery_intent_contract_record_malformed",
        ...recordProblemReasons(record),
      ]),
    };
  }
  return summarizeRecord(value);
}

function summarizeRecord(
  record: ProviderSpecificDeliveryIntentContractRecord,
): ProviderSpecificDeliveryIntentContractRecordSummary {
  return {
    record_id: record.record_id,
    created_at: record.created_at,
    source_provider_specific_preview_fingerprint:
      record.source_provider_specific_preview_fingerprint,
    source_provider_specific_decision_fingerprint:
      record.source_provider_specific_decision_fingerprint,
    source_external_handoff_delivery_contract_record_ref:
      record.source_external_handoff_delivery_contract_record_ref,
    source_local_fulfillment_ref: record.source_local_fulfillment_ref,
    source_handoff_send_contract_record_ref:
      record.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: record.source_exported_artifact_ref,
    requested_provider_surface: record.requested_provider_surface,
    provider_profile_ref: record.provider_profile_ref,
    requested_recipient_ref: record.requested_recipient_ref,
    requested_payload_format: record.requested_payload_format,
    payload_hash: record.payload_hash,
    payload_type: record.payload_type,
    intent_status: record.intent_status,
    delivery_performed: record.external_delivery_boundary.delivery_performed,
    provider_called: record.external_delivery_boundary.provider_called,
    external_message_sent:
      record.external_delivery_boundary.external_message_sent,
    network_called: record.external_delivery_boundary.network_called,
    problem_reasons: recordProblemReasons(record),
  };
}

function recordProblemReasons(
  record: ProviderSpecificDeliveryIntentContractRecord | RecordValue,
): string[] {
  const boundary = recordField(record, "external_delivery_boundary");
  const receipt = recordField(record, "receipt");
  return uniqueStrings([
    ...(record.scope !== PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE
      ? ["provider_specific_delivery_intent_record_scope_invalid"]
      : []),
    ...requiredStringProblems(record, [
      "source_provider_specific_preview_fingerprint",
      "source_provider_specific_decision_fingerprint",
      "source_external_handoff_delivery_contract_record_ref",
      "source_local_fulfillment_ref",
      "source_handoff_send_contract_record_ref",
      "source_exported_artifact_ref",
      "requested_provider_surface",
      "requested_recipient_ref",
      "requested_payload_format",
      "payload_hash",
    ]),
    ...providerSpecificDeliveryIntentRefProblemReasonsV01({
      surface: stringField(record, "requested_provider_surface"),
      providerProfileRef: stringField(record, "provider_profile_ref"),
      requestedRecipientRef: stringField(record, "requested_recipient_ref"),
      requestedPayloadFormat: stringField(record, "requested_payload_format"),
    }),
    ...providerSpecificDeliveryIntentBoundaryProblemReasonsV01(boundary),
    ...(receipt?.no_side_effects !== true
      ? ["receipt_no_side_effects_not_true"]
      : []),
    ...receiptProblemReasons(receipt),
    ...authorityProblems(record.authority_boundary),
  ]);
}

function receiptProblemReasons(receipt: RecordValue | null): string[] {
  if (!receipt) return ["receipt_missing"];
  return [
    "delivery_performed",
    "provider_specific_delivery",
    "provider_called",
    "external_message_sent",
    "email_sent",
    "slack_sent",
    "webhook_called",
    "network_called",
    "clipboard_written",
    "file_downloaded",
  ].flatMap((field) =>
    receipt[field] === true ? [`receipt_${field}_true`] : [],
  );
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
    "can_call_network",
    "can_write_clipboard",
    "can_download_file",
    "can_write_arbitrary_file",
    "can_mutate_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_write_external_handoff_delivery_contract_record",
    "can_write_provider_specific_preview_contract_record",
    "can_write_memory",
    "can_write_dogfood_metrics",
    "can_render_workbench_action_button",
  ].flatMap((field) =>
    boundary[field] === true
      ? [`provider_specific_delivery_intent_authority_forbidden_true:${field}`]
      : [],
  );
}

function isProviderSpecificDeliveryIntentContractRecord(
  value: unknown,
): value is ProviderSpecificDeliveryIntentContractRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version ===
        PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.created_at === "string" &&
      typeof value.source_provider_specific_preview_fingerprint === "string" &&
      typeof value.source_provider_specific_decision_fingerprint === "string" &&
      typeof value.source_external_handoff_delivery_contract_record_ref ===
        "string" &&
      typeof value.source_local_fulfillment_ref === "string" &&
      typeof value.source_handoff_send_contract_record_ref === "string" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_provider_surface === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      typeof value.requested_payload_format === "string" &&
      typeof value.payload_hash === "string" &&
      isRecord(value.external_delivery_boundary) &&
      isRecord(value.receipt) &&
      isRecord(value.authority_boundary),
  );
}

function requiredStringProblems(record: unknown, keys: string[]): string[] {
  const material = isRecord(record) ? record : {};
  return keys.flatMap((key) =>
    safeRef(material[key]) ? [] : [`${key}_missing`],
  );
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !/raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|https?:\/\//i.test(
      value,
    )
    ? value
    : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
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
