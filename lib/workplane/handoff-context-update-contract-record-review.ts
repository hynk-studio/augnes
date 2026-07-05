import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_REVIEW_VERSION,
  type HandoffContextUpdateContractNoSideEffectsSummary,
  type HandoffContextUpdateContractRecordReview,
  type HandoffContextUpdateContractRecordReviewAuthorityBoundary,
  type HandoffContextUpdateContractRecordReviewInput,
  type HandoffContextUpdateContractRecordReviewStatus,
  type HandoffContextUpdateContractRecordSummary,
} from "@/types/handoff-context-update-contract-record-review";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_STORE_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
  type HandoffContextUpdateContractNoSideEffects,
  type HandoffContextUpdateContractRecord,
  type HandoffContextUpdateContractStoreResult,
} from "@/types/handoff-context-update-contract-write";

type RecordValue = Record<string, unknown>;

const allowedReceiptTrueFields = [
  "handoff_context_update_contract_record_written",
  "handoff_context_update_contract_receipt_written",
  "handoff_context_update_contract_persisted",
  "handoff_context_update_contract_written",
] as const;

const forbiddenNoSideEffectFields = [
  "handoff_context_updated",
  "handoff_context_mutated",
  "handoff_context_applied",
  "handoff_sent",
  "selected_refs_written_to_live_handoff",
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

export function buildHandoffContextUpdateContractRecordReviewV01(
  input: HandoffContextUpdateContractRecordReviewInput = {},
): HandoffContextUpdateContractRecordReview {
  const asOf = input.as_of ?? new Date().toISOString();
  const sourceRefs = input.source_refs ?? [];
  const storeResult = isStoreResult(input.store_result) ? input.store_result : null;
  const rawRecords =
    input.records ??
    (storeResult?.status === "schema_missing" ? [] : storeResult?.records) ??
    [];
  const summaries = rawRecords.map(evaluateRecord);
  const storeReceiptProblemReasons =
    storeResult && !isReceiptNoSideEffectsValid(storeResult.receipt.no_side_effects)
      ? ["handoff_context_update_contract_receipt_side_effect_invalid"]
      : [];
  const validRecords = rawRecords.filter(
    (record, index): record is HandoffContextUpdateContractRecord =>
      isHandoffContextUpdateContractRecord(record) &&
      summaries[index].problem_reasons.length === 0,
  );
  const selectedRecord =
    input.selected_record_id && validRecords.length > 0
      ? validRecords.find((record) => record.record_id === input.selected_record_id) ??
        null
      : null;
  const latestRecord =
    validRecords.slice().sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
  const selectedSummary =
    selectedRecord
      ? summaries.find((summary) => summary.record_id === selectedRecord.record_id) ??
        null
      : null;
  const latestSummary =
    latestRecord
      ? summaries.find((summary) => summary.record_id === latestRecord.record_id) ??
        null
      : null;
  const invalidCount =
    summaries.filter((summary) => summary.problem_reasons.length > 0).length +
    storeReceiptProblemReasons.length;
  const receiptProblemCount = summaries.filter(
    (summary) => !summary.receipt_no_side_effects_valid,
  ).length + storeReceiptProblemReasons.length;
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
  const sectionCounts = countBy(
    validRecords.flatMap((record) =>
      record.proposed_handoff_context_entries.map((entry) => entry.handoff_section),
    ),
  );
  const entryKindCounts = countBy(
    validRecords.flatMap((record) =>
      record.proposed_handoff_context_entries.map((entry) => entry.entry_kind),
    ),
  );
  const problemIds = summaries
    .filter((summary) => summary.problem_reasons.length > 0)
    .map((summary) => summary.record_id);

  return {
    review_version: HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_REVIEW_VERSION,
    scope: input.scope ?? HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
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
          ? ["handoff_context_update_contract_records_missing"]
          : [],
      problem_record_ids: problemIds,
    },
    handoff_context_update_contract_material_summary: {
      section_counts: sectionCounts,
      entry_kind_counts: entryKindCounts,
      proposed_handoff_context_entry_count: validRecords.reduce(
        (sum, record) => sum + record.proposed_handoff_context_entry_count,
        0,
      ),
      source_route_integration_read_refs: uniqueStrings(
        validRecords.map((record) => record.source_route_integration_read_ref),
      ),
      source_applied_snapshot_refs: uniqueStrings(
        validRecords.map((record) => record.source_applied_snapshot_ref),
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
        ? ["handoff_context_update_contract_records_missing"]
        : [],
    operator_review_checklist: [
      "confirm_records_are_scoped_local_handoff_context_update_contract_only",
      "confirm_no_handoff_apply_or_send_receipt_claims",
      "confirm_section_and_entry_kind_counts_match_expected_context",
    ],
    would_not_do: [
      "does_not_apply_handoff_context",
      "does_not_send_handoff",
      "does_not_write_selected_refs_to_live_handoff",
      "does_not_mutate_cwp_route_snapshot_memory_metrics_or_external_systems",
    ],
    non_goals: [
      "no_live_handoff_context_update",
      "no_handoff_packet_copy_or_send",
      "no_memory_metric_or_external_write",
    ],
    authority_boundary:
      createHandoffContextUpdateContractRecordReviewAuthorityBoundaryV01(),
  };
}

export function createHandoffContextUpdateContractRecordReviewAuthorityBoundaryV01():
  HandoffContextUpdateContractRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_handoff_context_update_contract_record: false,
    can_apply_handoff_context_update: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Record review consumes already-read handoff context update contract records only.",
      "It cannot write schema, mutate handoff context, send handoff, or call external systems.",
    ],
  };
}

function evaluateRecord(value: unknown): HandoffContextUpdateContractRecordSummary {
  const record = isRecord(value) ? value : {};
  const typed = isHandoffContextUpdateContractRecord(value)
    ? (value as HandoffContextUpdateContractRecord)
    : null;
  const embeddedReceipt = isRecord(record.receipt) ? record.receipt : null;
  const problemReasons = uniqueStrings([
    ...(!typed ? ["handoff_context_update_contract_record_malformed"] : []),
    ...(typed && !hasExpectedAuthorityProfile(typed.authority_profile)
      ? ["handoff_context_update_contract_record_authority_profile_invalid"]
      : []),
    ...(typed && !hasExpectedNoHandoffApply(typed.no_handoff_apply_performed)
      ? ["handoff_context_update_contract_record_no_handoff_apply_invalid"]
      : []),
    ...(typed && !hasExpectedWriteAuthorityBoundary(typed.authority_boundary)
      ? ["handoff_context_update_contract_record_authority_boundary_invalid"]
      : []),
    ...(containsRawMaterialKeys(value) ? ["raw_material_key_refused"] : []),
    ...(typed &&
    !isReceiptNoSideEffectsValid(
      embeddedReceipt?.no_side_effects,
    )
      ? ["handoff_context_update_contract_record_receipt_side_effect_invalid"]
      : []),
  ]);
  return {
    record_id: stringValue(record.record_id) ?? "malformed-record",
    idempotency_key: stringValue(record.idempotency_key) ?? "missing",
    created_at: stringValue(record.created_at) ?? "",
    operator_ref: stringValue(record.operator_ref),
    source_route_integration_read_ref: stringValue(
      record.source_route_integration_read_ref,
    ),
    source_runtime_current_working_perspective_ref: stringValue(
      record.source_runtime_current_working_perspective_ref,
    ),
    source_applied_snapshot_ref: stringValue(record.source_applied_snapshot_ref),
    source_route_integration_contract_record_ref_count: arrayLength(
      record.source_route_integration_contract_record_refs,
    ),
    source_cwp_apply_record_ref_count: arrayLength(
      record.source_cwp_apply_record_refs,
    ),
    source_continuity_relay_record_ref_count: arrayLength(
      record.source_continuity_relay_record_refs,
    ),
    source_perspective_unit_record_ref_count: arrayLength(
      record.source_perspective_unit_record_refs,
    ),
    source_next_work_bias_record_ref_count: arrayLength(
      record.source_next_work_bias_record_refs,
    ),
    proposed_handoff_context_entry_count:
      typeof record.proposed_handoff_context_entry_count === "number"
        ? record.proposed_handoff_context_entry_count
        : arrayLength(record.proposed_handoff_context_entries),
    record_fingerprint: stringValue(record.record_fingerprint),
    receipt_no_side_effects_valid:
      Boolean(typed && isReceiptNoSideEffectsValid(undefined)),
    problem_reasons: problemReasons,
  };
}

function isHandoffContextUpdateContractRecord(
  value: unknown,
): value is HandoffContextUpdateContractRecord {
  return (
    isRecord(value) &&
    value.record_version === HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION &&
    value.scope === HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    typeof value.created_at === "string" &&
    typeof value.operator_ref === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    typeof value.source_route_integration_read_ref === "string" &&
    typeof value.source_runtime_current_working_perspective_ref === "string" &&
    Array.isArray(value.source_route_integration_contract_record_refs) &&
    Array.isArray(value.source_cwp_apply_record_refs) &&
    Array.isArray(value.source_continuity_relay_record_refs) &&
    Array.isArray(value.source_perspective_unit_record_refs) &&
    Array.isArray(value.source_next_work_bias_record_refs) &&
    isRecord(value.proposed_handoff_context_update_contract) &&
    value.proposed_handoff_context_update_contract.contract_kind ===
      "handoff_context_update_contract.v0.1" &&
    Array.isArray(value.proposed_handoff_context_entries) &&
    value.proposed_handoff_context_entries.length > 0 &&
    value.review_status === "recorded_as_scoped_handoff_context_update_contract" &&
    value.persistence_horizon ===
      "local_project_handoff_context_update_contract_store" &&
    isRecord(value.authority_profile) &&
    isRecord(value.no_handoff_apply_performed) &&
    isRecord(value.authority_boundary) &&
    typeof value.record_fingerprint === "string"
  );
}

function isStoreResult(value: unknown): value is HandoffContextUpdateContractStoreResult {
  return (
    isRecord(value) &&
    value.store_version === HANDOFF_CONTEXT_UPDATE_CONTRACT_STORE_VERSION &&
    value.scope === HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE &&
    typeof value.status === "string" &&
    Array.isArray(value.records) &&
    isRecord(value.receipt)
  );
}

function determineReviewStatus({
  storeResult,
  suppliedCount,
  validCount,
  invalidCount,
  selectedRecordId,
  selectedRecordFound,
}: {
  storeResult: HandoffContextUpdateContractStoreResult | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): HandoffContextUpdateContractRecordReviewStatus {
  if (storeResult?.status === "schema_missing") return "schema_missing";
  if (invalidCount > 0) return "records_invalid";
  if (selectedRecordId && !selectedRecordFound) return "selected_record_missing";
  if (selectedRecordFound) return "selected_record_found";
  if (validCount > 0) return "records_available";
  if (suppliedCount === 0) return "no_records";
  return "records_invalid";
}

function hasExpectedAuthorityProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const expected = {
    durable_local_handoff_context_update_contract: true,
    source_of_truth: false,
    local_project_handoff_context_update_contract_only: true,
    persistence_horizon: "local_project_handoff_context_update_contract_store",
    handoff_context_update_contract_written: true,
    handoff_context_update_applied: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    current_working_perspective_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  };
  return Object.entries(expected).every(([key, expectedValue]) =>
    value[key] === expectedValue,
  );
}

function hasExpectedNoHandoffApply(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return forbiddenNoSideEffectFields.every((field) => value[field] === false);
}

function hasExpectedWriteAuthorityBoundary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const expected = {
    durable_local_handoff_context_update_contract: true,
    source_of_truth: false,
    local_project_handoff_context_update_contract_only: true,
    can_write_db: true,
    can_create_handoff_context_update_contract_record: true,
    can_create_handoff_context_update_contract_receipt: true,
    can_apply_handoff_context_update: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
  };
  return Object.entries(expected).every(([key, expectedValue]) =>
    value[key] === expectedValue,
  );
}

function isReceiptNoSideEffectsValid(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  const allowedValid = allowedReceiptTrueFields.every(
    (field) => typeof value[field] === "boolean",
  );
  const forbiddenValid = forbiddenNoSideEffectFields.every(
    (field) => value[field] === false,
  );
  return allowedValid && forbiddenValid;
}

function summarizeNoSideEffects(
  noSideEffects: HandoffContextUpdateContractNoSideEffects | undefined,
): HandoffContextUpdateContractNoSideEffectsSummary {
  const count = (key: keyof HandoffContextUpdateContractNoSideEffects) =>
    noSideEffects?.[key] === true ? 1 : 0;
  return {
    handoff_context_update_contract_record_written_count: count(
      "handoff_context_update_contract_record_written",
    ),
    handoff_context_update_contract_receipt_written_count: count(
      "handoff_context_update_contract_receipt_written",
    ),
    handoff_context_update_contract_persisted_count: count(
      "handoff_context_update_contract_persisted",
    ),
    handoff_context_update_contract_written_count: count(
      "handoff_context_update_contract_written",
    ),
    handoff_context_updated_count: count("handoff_context_updated"),
    handoff_context_mutated_count: count("handoff_context_mutated"),
    handoff_context_applied_count: count("handoff_context_applied"),
    handoff_sent_count: count("handoff_sent"),
    selected_refs_written_to_live_handoff_count: count(
      "selected_refs_written_to_live_handoff",
    ),
    api_perspective_current_route_modified_count: count(
      "api_perspective_current_route_modified",
    ),
    current_working_perspective_route_response_replaced_count: count(
      "current_working_perspective_route_response_replaced",
    ),
    upstream_current_working_perspective_source_tables_updated_count: count(
      "upstream_current_working_perspective_source_tables_updated",
    ),
    upstream_current_working_perspective_source_tables_mutated_count: count(
      "upstream_current_working_perspective_source_tables_mutated",
    ),
    applied_current_working_perspective_snapshot_written_count: count(
      "applied_current_working_perspective_snapshot_written",
    ),
    current_working_perspective_apply_record_written_count: count(
      "current_working_perspective_apply_record_written",
    ),
    current_working_perspective_update_contract_record_written_count: count(
      "current_working_perspective_update_contract_record_written",
    ),
    route_integration_contract_record_written_count: count(
      "route_integration_contract_record_written",
    ),
    perspective_unit_written_count: count("perspective_unit_written"),
    next_work_bias_written_count: count("next_work_bias_written"),
    continuity_relay_written_count: count("continuity_relay_written"),
    continuity_relay_updated_count: count("continuity_relay_updated"),
    live_relay_state_applied_count: count("live_relay_state_applied"),
    memory_written_count: count("memory_written"),
    memory_promoted_count: count("memory_promoted"),
    memory_mutated_count: count("memory_mutated"),
    dogfood_metrics_written_count: count("dogfood_metrics_written"),
    dogfood_metrics_global_state_updated_count: count(
      "dogfood_metrics_global_state_updated",
    ),
    dogfood_metric_snapshot_written_count: count(
      "dogfood_metric_snapshot_written",
    ),
    reuse_outcome_ledger_written_count: count("reuse_outcome_ledger_written"),
    expected_observed_delta_written_count: count(
      "expected_observed_delta_written",
    ),
    work_episode_written_count: count("work_episode_written"),
    provider_called_count: count("provider_called"),
    github_called_count: count("github_called"),
    codex_executed_count: count("codex_executed"),
    pr_created_count: count("pr_created"),
    pr_merged_count: count("pr_merged"),
    autonomous_action_run_count: count("autonomous_action_run"),
    graph_or_vector_store_created_count: count("graph_or_vector_store_created"),
    rag_stack_created_count: count("rag_stack_created"),
    browser_observed_count: count("browser_observed"),
    crawler_or_browser_observer_created_count: count(
      "crawler_or_browser_observer_created",
    ),
    workbench_action_button_rendered_count: count(
      "workbench_action_button_rendered",
    ),
  };
}

function containsRawMaterialKeys(value: unknown, seen = new Set<unknown>()): boolean {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsRawMaterialKeys(entry, seen));
  }
  return Object.entries(value as RecordValue).some(
    ([key, nested]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawMaterialKeys(nested, seen),
  );
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
