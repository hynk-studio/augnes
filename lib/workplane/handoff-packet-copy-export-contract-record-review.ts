import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_REVIEW_VERSION,
  type HandoffPacketCopyExportContractNoSideEffectsSummary,
  type HandoffPacketCopyExportContractRecordReview,
  type HandoffPacketCopyExportContractRecordReviewAuthorityBoundary,
  type HandoffPacketCopyExportContractRecordReviewInput,
  type HandoffPacketCopyExportContractRecordReviewStatus,
  type HandoffPacketCopyExportContractRecordSummary,
} from "@/types/handoff-packet-copy-export-contract-record-review";
import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_STORE_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE,
  type HandoffPacketCopyExportContractNoSideEffects,
  type HandoffPacketCopyExportContractRecord,
  type HandoffPacketCopyExportContractStoreResult,
} from "@/types/handoff-packet-copy-export-contract-write";

type RecordValue = Record<string, unknown>;

const allowedReceiptTrueFields = [
  "handoff_packet_copy_export_contract_record_written",
  "handoff_packet_copy_export_contract_receipt_written",
  "handoff_packet_copy_export_contract_persisted",
  "handoff_packet_copy_export_contract_written",
] as const;

const forbiddenNoSideEffectFields = [
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_packet_file_written",
  "clipboard_written",
  "file_download_created",
  "handoff_sent",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
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
  "provider_called",
  "github_called",
  "codex_executed",
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
  "durable_local_handoff_packet_copy_export_contract",
  "local_project_handoff_packet_copy_export_contract_only",
  "can_write_db",
  "can_create_handoff_packet_copy_export_contract_record",
  "can_create_handoff_packet_copy_export_contract_receipt",
] as const;

const writeAuthorityFalseFields = [
  "source_of_truth",
  "can_copy_export_handoff_packet",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
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

export function buildHandoffPacketCopyExportContractRecordReviewV01(
  input: HandoffPacketCopyExportContractRecordReviewInput = {},
): HandoffPacketCopyExportContractRecordReview {
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
      ? ["handoff_packet_copy_export_contract_receipt_side_effect_invalid"]
      : [];
  const validRecords = rawRecords.filter(
    (record, index): record is HandoffPacketCopyExportContractRecord =>
      isCopyExportContractRecord(record) &&
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
    review_version: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_REVIEW_VERSION,
    scope: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE,
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
          ? ["handoff_packet_copy_export_contract_records_missing"]
          : [],
      problem_record_ids: problemIds,
    },
    handoff_packet_copy_export_contract_material_summary: {
      packet_format_counts: countBy(
        validRecords.map((record) => record.requested_packet_format),
      ),
      copy_export_target_counts: countBy(
        validRecords.map((record) => record.requested_copy_export_target),
      ),
      packet_section_counts: countBy(
        validRecords.flatMap((record) =>
          Object.entries(record.proposed_packet_section_counts).flatMap(
            ([section, count]) => Array(Math.max(0, count)).fill(section),
          ),
        ),
      ),
      packet_entry_count: validRecords.reduce(
        (sum, record) => sum + record.proposed_packet_entry_count,
        0,
      ),
      source_applied_handoff_context_snapshot_refs: uniqueStrings(
        validRecords.map(
          (record) => record.source_applied_handoff_context_snapshot_ref,
        ),
      ),
    },
    receipt_no_side_effects_summary: noSideEffectsSummary,
    blocked_reasons: uniqueStrings(
      summaries
        .flatMap((summary) => summary.problem_reasons)
        .concat(storeReceiptProblemReasons),
    ),
    insufficient_data_reasons:
      validRecords.length === 0
        ? ["handoff_packet_copy_export_contract_records_missing"]
        : [],
    operator_review_checklist: [
      "confirm_records_are_scoped_local_copy_export_contracts_only",
      "confirm_no_packet_copy_export_download_clipboard_or_send_receipt_claims",
      "confirm_packet_entries_remain_contract_material_only",
    ],
    would_not_do: [
      "does_not_copy_export_download_write_file_or_clipboard",
      "does_not_send_handoff",
      "does_not_mutate_live_handoff_context_or_selected_refs",
      "does_not_write_memory_metrics_routes_relay_or_external_systems",
    ],
    non_goals: [
      "no_actual_handoff_packet_copy_export",
      "no_file_download_or_clipboard_write",
      "no_handoff_send",
      "no_live_handoff_context_mutation",
    ],
    authority_boundary:
      createHandoffPacketCopyExportContractRecordReviewAuthorityBoundaryV01(),
  };
}

export function createHandoffPacketCopyExportContractRecordReviewAuthorityBoundaryV01():
  HandoffPacketCopyExportContractRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_handoff_packet_copy_export_contract_record: false,
    can_copy_export_handoff_packet: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_context_apply_record: false,
    can_write_applied_handoff_context_snapshot: false,
    can_write_handoff_context_update_contract_record: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
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
      "Review is read-only and accepts already-read records or store results.",
      "It flags records invalid when they claim copy/export/download/clipboard/send, live handoff, route, memory, metrics, or external authority.",
    ],
  };
}

function evaluateRecord(
  record: unknown,
): HandoffPacketCopyExportContractRecordSummary {
  if (!isCopyExportContractRecord(record)) {
    return summarizeMalformedRecord(record, [
      "handoff_packet_copy_export_contract_record_malformed",
    ]);
  }
  const reasons: string[] = [];
  if (!isAuthorityProfileValid(record.authority_profile)) {
    reasons.push("handoff_packet_copy_export_contract_record_authority_profile_invalid");
  }
  if (!isNoCopyExportOrSendValid(record.no_copy_export_or_send_performed)) {
    reasons.push("handoff_packet_copy_export_contract_record_no_copy_export_or_send_invalid");
  }
  if (!isWriteAuthorityBoundaryValid(record.authority_boundary)) {
    reasons.push("handoff_packet_copy_export_contract_record_authority_boundary_invalid");
  }
  if (!isPacketManifestLike(record.proposed_packet_manifest)) {
    reasons.push("handoff_packet_manifest_malformed");
  }
  if (
    !Array.isArray(record.proposed_packet_entries) ||
    !record.proposed_packet_entries.length ||
    !record.proposed_packet_entries.every(isPacketEntryLike)
  ) {
    reasons.push("handoff_packet_entries_malformed");
  }
  if (containsRawMaterialKey(record)) {
    reasons.push("handoff_packet_copy_export_contract_record_raw_material_refused");
  }
  return summarizeRecord(record, reasons);
}

function summarizeRecord(
  record: HandoffPacketCopyExportContractRecord,
  problemReasons: string[],
): HandoffPacketCopyExportContractRecordSummary {
  return {
    record_id: record.record_id,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    operator_ref: record.operator_ref,
    source_applied_handoff_context_snapshot_ref:
      record.source_applied_handoff_context_snapshot_ref,
    source_handoff_context_apply_record_ref:
      record.source_handoff_context_apply_record_ref,
    requested_packet_format: record.requested_packet_format,
    requested_copy_export_target: record.requested_copy_export_target,
    proposed_packet_entry_count: record.proposed_packet_entry_count,
    proposed_packet_section_counts: record.proposed_packet_section_counts,
    record_fingerprint: record.record_fingerprint,
    receipt_no_side_effects_valid: problemReasons.every(
      (reason) =>
        reason !== "handoff_packet_copy_export_contract_receipt_side_effect_invalid",
    ),
    problem_reasons: uniqueStrings(problemReasons),
  };
}

function summarizeMalformedRecord(
  record: unknown,
  problemReasons: string[],
): HandoffPacketCopyExportContractRecordSummary {
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
    source_applied_handoff_context_snapshot_ref: null,
    source_handoff_context_apply_record_ref: null,
    requested_packet_format: null,
    requested_copy_export_target: null,
    proposed_packet_entry_count: 0,
    proposed_packet_section_counts: {},
    record_fingerprint:
      typeof candidate.record_fingerprint === "string"
        ? candidate.record_fingerprint
        : null,
    receipt_no_side_effects_valid: false,
    problem_reasons: problemReasons,
  };
}

function isCopyExportContractRecord(
  value: unknown,
): value is HandoffPacketCopyExportContractRecord {
  if (!isRecord(value)) return false;
  return (
    value.record_version === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION &&
    value.scope === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    typeof value.created_at === "string" &&
    typeof value.operator_ref === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    typeof value.source_applied_handoff_context_snapshot_ref === "string" &&
    typeof value.requested_packet_format === "string" &&
    typeof value.requested_copy_export_target === "string" &&
    isRecord(value.proposed_handoff_packet_copy_export_contract) &&
    isPacketManifestLike(value.proposed_packet_manifest) &&
    Array.isArray(value.proposed_packet_entries) &&
    typeof value.proposed_packet_entry_count === "number" &&
    isRecord(value.proposed_packet_section_counts) &&
    isRecord(value.proposed_copy_export_plan) &&
    value.review_status === "recorded_as_scoped_handoff_packet_copy_export_contract" &&
    value.persistence_horizon === "local_project_handoff_packet_copy_export_contract_store" &&
    typeof value.record_fingerprint === "string"
  );
}

function isAuthorityProfileValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.durable_local_handoff_packet_copy_export_contract === true &&
    value.source_of_truth === false &&
    value.local_project_handoff_packet_copy_export_contract_only === true &&
    value.handoff_packet_copy_export_contract_written === true &&
    value.handoff_packet_copied === false &&
    value.handoff_packet_exported === false &&
    value.handoff_packet_file_written === false &&
    value.clipboard_written === false &&
    value.handoff_sent === false &&
    value.live_handoff_context_mutated === false &&
    value.selected_refs_written_to_live_handoff === false &&
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

function isNoCopyExportOrSendValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return forbiddenNoSideEffectFields.every((field) => value[field] === false);
}

function isWriteAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    fieldsTrue(value, writeAuthorityTrueFields) &&
    fieldsFalse(value, writeAuthorityFalseFields)
  );
}

function isNoSideEffectsValid(
  value: unknown,
): value is HandoffPacketCopyExportContractNoSideEffects {
  if (!isRecord(value)) return false;
  for (const field of forbiddenNoSideEffectFields) {
    if (value[field] !== false) return false;
  }
  for (const field of allowedReceiptTrueFields) {
    if (typeof value[field] !== "boolean") return false;
  }
  return true;
}

function isPacketManifestLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.manifest_version === "handoff_packet_manifest.v0.1" &&
    typeof value.packet_ref === "string" &&
    typeof value.packet_format === "string" &&
    typeof value.packet_target === "string" &&
    typeof value.entry_count === "number" &&
    value.entry_count > 0 &&
    value.copy_export_not_performed === true &&
    value.send_not_performed === true
  );
}

function isPacketEntryLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.packet_entry_ref === "string" &&
    typeof value.packet_section === "string" &&
    typeof value.entry_kind === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    value.public_safe === true &&
    value.raw_private_material_excluded === true &&
    value.authority_required === "future_handoff_packet_copy_export"
  );
}

function summarizeNoSideEffects(
  value: HandoffPacketCopyExportContractNoSideEffects | undefined,
): HandoffPacketCopyExportContractNoSideEffectsSummary {
  const count = (field: keyof HandoffPacketCopyExportContractNoSideEffects) =>
    value?.[field] === true ? 1 : 0;
  return {
    handoff_packet_copy_export_contract_record_written_count:
      count("handoff_packet_copy_export_contract_record_written"),
    handoff_packet_copy_export_contract_receipt_written_count:
      count("handoff_packet_copy_export_contract_receipt_written"),
    handoff_packet_copy_export_contract_persisted_count:
      count("handoff_packet_copy_export_contract_persisted"),
    handoff_packet_copy_export_contract_written_count:
      count("handoff_packet_copy_export_contract_written"),
    handoff_packet_copied_count: count("handoff_packet_copied"),
    handoff_packet_exported_count: count("handoff_packet_exported"),
    handoff_packet_file_written_count: count("handoff_packet_file_written"),
    clipboard_written_count: count("clipboard_written"),
    file_download_created_count: count("file_download_created"),
    handoff_sent_count: count("handoff_sent"),
    live_handoff_context_mutated_count: count("live_handoff_context_mutated"),
    selected_refs_written_to_live_handoff_count:
      count("selected_refs_written_to_live_handoff"),
    memory_written_count: count("memory_written"),
    provider_called_count: count("provider_called"),
    github_called_count: count("github_called"),
    codex_executed_count: count("codex_executed"),
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
  storeResult: HandoffPacketCopyExportContractStoreResult | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): HandoffPacketCopyExportContractRecordReviewStatus {
  if (invalidCount > 0) return "records_invalid";
  if (storeResult?.status === "schema_missing") return "schema_missing";
  if (suppliedCount === 0 || validCount === 0) return "no_records";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  return "records_available";
}

function isStoreResult(
  value: unknown,
): value is HandoffPacketCopyExportContractStoreResult {
  return (
    isRecord(value) &&
    value.store_version === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_STORE_VERSION &&
    value.scope === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE &&
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
  ).sort((a, b) => a.localeCompare(b));
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
