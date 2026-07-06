import {
  HANDOFF_CONTEXT_APPLY_RECORD_REVIEW_VERSION,
  type AppliedHandoffContextSnapshotSummary,
  type HandoffContextApplyNoSideEffectsSummary,
  type HandoffContextApplyRecordReview,
  type HandoffContextApplyRecordReviewAuthorityBoundary,
  type HandoffContextApplyRecordReviewInput,
  type HandoffContextApplyRecordReviewStatus,
  type HandoffContextApplyRecordSummary,
} from "@/types/handoff-context-apply-record-review";
import {
  APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION,
  HANDOFF_CONTEXT_APPLY_RECORD_VERSION,
  HANDOFF_CONTEXT_APPLY_STORE_VERSION,
  HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
  type AppliedHandoffContextSnapshot,
  type HandoffContextApplyNoSideEffects,
  type HandoffContextApplyRecord,
  type HandoffContextApplyStoreResult,
} from "@/types/handoff-context-apply-write";

type RecordValue = Record<string, unknown>;

const allowedReceiptTrueFields = [
  "handoff_context_apply_record_written",
  "handoff_context_apply_receipt_written",
  "handoff_context_apply_persisted",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_applied_to_local_snapshot",
] as const;

const forbiddenNoSideEffectFields = [
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "handoff_sent",
  "selected_refs_written_to_live_handoff",
  "handoff_packet_copy_exported",
  "handoff_packet_sent",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "handoff_context_update_contract_record_written",
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

export function buildHandoffContextApplyRecordReviewV01(
  input: HandoffContextApplyRecordReviewInput = {},
): HandoffContextApplyRecordReview {
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
      ? ["handoff_context_apply_receipt_side_effect_invalid"]
      : [];
  const validRecords = rawRecords.filter(
    (record, index): record is HandoffContextApplyRecord =>
      isApplyRecord(record) && summaries[index].problem_reasons.length === 0,
  );
  const validSnapshots = validRecords.map((record) => record.applied_snapshot);
  const selectedRecord =
    input.selected_record_id && validRecords.length
      ? validRecords.find((record) => record.record_id === input.selected_record_id) ??
        null
      : null;
  const selectedSnapshot =
    input.selected_applied_handoff_context_snapshot_ref && validSnapshots.length
      ? validSnapshots.find(
          (snapshot) =>
            snapshot.applied_handoff_context_snapshot_ref ===
            input.selected_applied_handoff_context_snapshot_ref,
        ) ?? null
      : null;
  const latestRecord =
    validRecords.slice().sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
  const latestSnapshot = latestRecord?.applied_snapshot ?? null;
  const selectedSummary = selectedRecord ? summarizeRecord(selectedRecord, []) : null;
  const selectedSnapshotSummary = selectedSnapshot
    ? summarizeSnapshot(selectedSnapshot, [])
    : null;
  const latestSummary = latestRecord ? summarizeRecord(latestRecord, []) : null;
  const latestSnapshotSummary = latestSnapshot
    ? summarizeSnapshot(latestSnapshot, [])
    : null;
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
    selectedSnapshotRef: input.selected_applied_handoff_context_snapshot_ref ?? null,
    selectedSnapshotFound: Boolean(selectedSnapshot),
  });
  const noSideEffectsSummary = summarizeNoSideEffects(
    storeResult?.receipt.no_side_effects,
  );
  const sectionCounts = countBy(
    validRecords.flatMap((record) =>
      record.applied_handoff_context_entries.map((entry) => entry.handoff_section),
    ),
  );
  const entryKindCounts = countBy(
    validRecords.flatMap((record) =>
      record.applied_handoff_context_entries.map((entry) => entry.entry_kind),
    ),
  );
  const problemIds = summaries
    .filter((summary) => summary.problem_reasons.length > 0)
    .map((summary) => summary.record_id);

  return {
    review_version: HANDOFF_CONTEXT_APPLY_RECORD_REVIEW_VERSION,
    scope: input.scope ?? HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      invalid_record_count: invalidCount,
      selected_record_id: input.selected_record_id ?? null,
      selected_record_found: Boolean(selectedRecord),
      selected_applied_handoff_context_snapshot_ref:
        input.selected_applied_handoff_context_snapshot_ref ?? null,
      selected_applied_snapshot_found: Boolean(selectedSnapshot),
      latest_record_id: latestRecord?.record_id ?? null,
      latest_record_created_at: latestRecord?.created_at ?? null,
      latest_applied_handoff_context_snapshot_ref:
        latestSnapshot?.applied_handoff_context_snapshot_ref ?? null,
      receipt_side_effect_problem_count: receiptProblemCount,
    },
    record_summaries: summaries,
    selected_record_summary: selectedSummary,
    selected_applied_snapshot_summary: selectedSnapshotSummary,
    latest_record_summary: latestSummary,
    latest_applied_snapshot_summary: latestSnapshotSummary,
    records: validRecords,
    applied_snapshots: validSnapshots,
    evidence_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      has_records: validRecords.length > 0,
      has_applied_snapshots: validSnapshots.length > 0,
      has_selected_record: Boolean(selectedRecord),
      has_selected_applied_snapshot: Boolean(selectedSnapshot),
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
          ? ["handoff_context_apply_records_missing"]
          : [],
      problem_record_ids: problemIds,
    },
    handoff_context_apply_material_summary: {
      section_counts: sectionCounts,
      entry_kind_counts: entryKindCounts,
      applied_entry_count: validRecords.reduce(
        (sum, record) => sum + record.applied_handoff_context_entry_count,
        0,
      ),
      source_contract_record_refs: uniqueStrings(
        validRecords.map(
          (record) => record.source_handoff_context_update_contract_record_ref,
        ),
      ),
      source_route_integration_read_refs: uniqueStrings(
        validRecords.map((record) => record.source_route_integration_read_ref),
      ),
      copy_export_still_pending: validSnapshots.some(
        (snapshot) =>
          snapshot.applied_handoff_context.apply_metadata.future_copy_export_required,
      ),
      send_still_pending: validSnapshots.some(
        (snapshot) => snapshot.applied_handoff_context.apply_metadata.future_send_required,
      ),
    },
    receipt_no_side_effects_summary: noSideEffectsSummary,
    blocked_reasons: uniqueStrings(
      summaries
        .flatMap((summary) => summary.problem_reasons)
        .concat(storeReceiptProblemReasons),
    ),
    insufficient_data_reasons:
      validRecords.length === 0 ? ["handoff_context_apply_records_missing"] : [],
    operator_review_checklist: [
      "confirm_records_are_scoped_local_handoff_context_apply_only",
      "confirm_no_handoff_send_copy_export_or_live_mutation_receipt_claims",
      "confirm_applied_snapshot_matches_record_material",
    ],
    would_not_do: [
      "does_not_send_handoff",
      "does_not_copy_export_handoff_packet",
      "does_not_write_selected_refs_to_live_handoff",
      "does_not_mutate_live_handoff_context",
      "does_not_write_memory_metrics_routes_relay_or_external_systems",
    ],
    non_goals: [
      "no_handoff_send",
      "no_handoff_packet_copy_export",
      "no_live_handoff_context_mutation",
      "no_memory_metric_route_relay_or_external_write",
    ],
    authority_boundary: createHandoffContextApplyRecordReviewAuthorityBoundaryV01(),
  };
}

export function createHandoffContextApplyRecordReviewAuthorityBoundaryV01():
  HandoffContextApplyRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_handoff_context_apply_record: false,
    can_create_applied_handoff_context_snapshot: false,
    can_apply_handoff_context_update_live: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_copy_export_handoff_packet: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_handoff_context_update_contract_record: false,
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
      "Review is read-only and does not open DB unless a caller separately supplies already-read material.",
      "It flags records invalid when they claim send/export/live mutation, route, memory, metrics, or external authority.",
    ],
  };
}

function evaluateRecord(record: unknown): HandoffContextApplyRecordSummary {
  if (!isApplyRecord(record)) {
    return summarizeMalformedRecord(record, [
      "handoff_context_apply_record_malformed",
    ]);
  }
  const reasons: string[] = [];
  if (!isAppliedSnapshot(record.applied_snapshot)) {
    reasons.push("handoff_context_applied_snapshot_malformed");
  }
  reasons.push(...recordSnapshotConsistencyProblems(record));
  if (!isAuthorityProfileValid(record.authority_profile)) {
    reasons.push("handoff_context_apply_record_authority_profile_invalid");
  }
  if (!isNoHandoffSendValid(record.no_handoff_send_performed)) {
    reasons.push("handoff_context_apply_record_no_handoff_send_invalid");
  }
  if (!isWriteAuthorityBoundaryValid(record.authority_boundary)) {
    reasons.push("handoff_context_apply_record_authority_boundary_invalid");
  }
  if (containsRawMaterialKey(record)) {
    reasons.push("handoff_context_apply_record_raw_material_refused");
  }
  return summarizeRecord(record, reasons);
}

function summarizeRecord(
  record: HandoffContextApplyRecord,
  problemReasons: string[],
): HandoffContextApplyRecordSummary {
  return {
    record_id: record.record_id,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    operator_ref: record.operator_ref,
    source_handoff_context_update_contract_record_ref:
      record.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: record.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      record.source_runtime_current_working_perspective_ref,
    source_applied_snapshot_ref: record.source_applied_snapshot_ref,
    applied_handoff_context_snapshot_ref:
      record.applied_handoff_context_snapshot_ref,
    applied_entry_count: record.applied_handoff_context_entry_count,
    applied_section_counts: record.applied_handoff_section_counts,
    record_fingerprint: record.record_fingerprint,
    receipt_no_side_effects_valid: problemReasons.every(
      (reason) => reason !== "handoff_context_apply_receipt_side_effect_invalid",
    ),
    problem_reasons: uniqueStrings(problemReasons),
  };
}

function summarizeMalformedRecord(
  record: unknown,
  problemReasons: string[],
): HandoffContextApplyRecordSummary {
  const candidate = isRecord(record) ? record : {};
  return {
    record_id: typeof candidate.record_id === "string" ? candidate.record_id : "malformed",
    idempotency_key:
      typeof candidate.idempotency_key === "string"
        ? candidate.idempotency_key
        : "malformed",
    created_at:
      typeof candidate.created_at === "string" ? candidate.created_at : "",
    operator_ref:
      typeof candidate.operator_ref === "string" ? candidate.operator_ref : null,
    source_handoff_context_update_contract_record_ref: null,
    source_route_integration_read_ref: null,
    source_runtime_current_working_perspective_ref: null,
    source_applied_snapshot_ref: null,
    applied_handoff_context_snapshot_ref: null,
    applied_entry_count: 0,
    applied_section_counts: {},
    record_fingerprint:
      typeof candidate.record_fingerprint === "string"
        ? candidate.record_fingerprint
        : null,
    receipt_no_side_effects_valid: false,
    problem_reasons: problemReasons,
  };
}

function summarizeSnapshot(
  snapshot: AppliedHandoffContextSnapshot,
  problemReasons: string[],
): AppliedHandoffContextSnapshotSummary {
  const context = snapshot.applied_handoff_context;
  return {
    applied_handoff_context_snapshot_ref:
      snapshot.applied_handoff_context_snapshot_ref,
    snapshot_version: snapshot.snapshot_version,
    source_handoff_context_update_contract_record_ref:
      snapshot.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: snapshot.source_route_integration_read_ref,
    applied_entry_count: snapshot.applied_entry_count,
    section_counts: countBy(
      snapshot.applied_handoff_context_entries.map((entry) => entry.handoff_section),
    ),
    previous_context_used: context.previous_context_summary.supplied,
    copy_export_still_pending: context.apply_metadata.future_copy_export_required,
    send_still_pending: context.apply_metadata.future_send_required,
    problem_reasons: uniqueStrings(problemReasons),
  };
}

function isApplyRecord(value: unknown): value is HandoffContextApplyRecord {
  if (!isRecord(value)) return false;
  return (
    value.record_version === HANDOFF_CONTEXT_APPLY_RECORD_VERSION &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    typeof value.created_at === "string" &&
    typeof value.operator_ref === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    typeof value.source_handoff_context_update_contract_record_ref === "string" &&
    value.applied_snapshot_version === APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION &&
    typeof value.applied_handoff_context_snapshot_ref === "string" &&
    isAppliedHandoffContextLike(value.applied_handoff_context) &&
    isAppliedSnapshot(value.applied_snapshot) &&
    Array.isArray(value.applied_handoff_context_entries) &&
    typeof value.applied_handoff_context_entry_count === "number" &&
    isRecord(value.applied_handoff_section_counts) &&
    isRecord(value.apply_plan) &&
    value.review_status === "applied_as_scoped_handoff_context_snapshot" &&
    value.persistence_horizon === "local_project_handoff_context_apply_store" &&
    typeof value.record_fingerprint === "string"
  );
}

function isAppliedSnapshot(value: unknown): value is AppliedHandoffContextSnapshot {
  if (!isRecord(value)) return false;
  return (
    value.snapshot_version === APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION &&
    typeof value.applied_handoff_context_snapshot_ref === "string" &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
    typeof value.as_of === "string" &&
    typeof value.source_handoff_context_update_contract_record_ref === "string" &&
    isAppliedHandoffContextLike(value.applied_handoff_context) &&
    Array.isArray(value.applied_handoff_context_entries) &&
    typeof value.applied_entry_count === "number" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    isWriteAuthorityBoundaryValid(value.authority_boundary)
  );
}

function isAppliedHandoffContextLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const metadata = getRecord(value, "apply_metadata");
  const authority = getRecord(value, "authority_boundary");
  return (
    value.handoff_context_version === "applied_handoff_context.v0.1" &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
    typeof value.as_of === "string" &&
    typeof value.source_contract_record_ref === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    isRecord(value.handoff_sections) &&
    Array.isArray(value.applied_entries) &&
    value.applied_entries.length > 0 &&
    metadata?.local_snapshot_only === true &&
    metadata.does_not_send_handoff === true &&
    metadata.does_not_write_live_packet === true &&
    isReadOnlyAppliedContextAuthority(authority)
  );
}

function recordSnapshotConsistencyProblems(
  record: HandoffContextApplyRecord,
): string[] {
  const snapshot = record.applied_snapshot;
  const reasons: string[] = [];
  if (record.applied_handoff_context_snapshot_ref !== snapshot.applied_handoff_context_snapshot_ref) {
    reasons.push("handoff_context_apply_record_snapshot_ref_mismatch");
  }
  if (record.applied_snapshot_version !== snapshot.snapshot_version) {
    reasons.push("handoff_context_apply_record_snapshot_version_mismatch");
  }
  if (
    record.source_handoff_context_update_contract_record_ref !==
    snapshot.source_handoff_context_update_contract_record_ref
  ) {
    reasons.push("handoff_context_apply_record_source_contract_ref_mismatch");
  }
  if (record.applied_handoff_context_entry_count !== snapshot.applied_entry_count) {
    reasons.push("handoff_context_apply_record_entry_count_mismatch");
  }
  if (
    JSON.stringify(record.applied_handoff_context) !==
    JSON.stringify(snapshot.applied_handoff_context)
  ) {
    reasons.push("handoff_context_apply_record_snapshot_context_mismatch");
  }
  return reasons;
}

function isAuthorityProfileValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.durable_local_handoff_context_apply_record === true &&
    value.durable_local_applied_handoff_context_snapshot === true &&
    value.source_of_truth === false &&
    value.local_project_handoff_context_apply_only === true &&
    value.handoff_context_apply_record_written === true &&
    value.applied_handoff_context_snapshot_written === true &&
    value.handoff_context_update_applied_to_local_snapshot === true &&
    value.live_handoff_context_mutated === false &&
    value.handoff_sent === false &&
    value.selected_refs_written_to_live_handoff === false &&
    value.handoff_packet_copy_exported === false &&
    value.handoff_packet_sent === false &&
    value.api_perspective_current_route_modified === false &&
    value.upstream_current_working_perspective_source_tables_mutated === false &&
    value.applied_current_working_perspective_snapshot_written === false &&
    value.current_working_perspective_apply_record_written === false &&
    value.route_integration_contract_record_written === false &&
    value.handoff_context_update_contract_record_written === false &&
    value.perspective_unit_write_performed === false &&
    value.next_work_bias_write_performed === false &&
    value.continuity_relay_write_performed === false &&
    value.continuity_relay_update_performed === false &&
    value.memory_promotion_performed === false &&
    value.metric_update_performed === false
  );
}

function isNoHandoffSendValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return forbiddenNoSideEffectFields.every((field) => value[field] === false);
}

function isWriteAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.durable_local_handoff_context_apply_record === true &&
    value.durable_local_applied_handoff_context_snapshot === true &&
    value.source_of_truth === false &&
    value.local_project_handoff_context_apply_only === true &&
    value.can_apply_handoff_context_update_live === false &&
    value.can_mutate_handoff_context === false &&
    value.can_send_handoff === false &&
    value.can_copy_export_handoff_packet === false &&
    value.can_write_selected_refs_to_live_handoff === false &&
    value.can_modify_api_perspective_current_route === false &&
    value.can_replace_current_working_perspective_route_response === false &&
    value.can_write_applied_current_working_perspective_snapshot === false &&
    value.can_write_current_working_perspective_apply_record === false &&
    value.can_write_current_working_perspective_update_contract_record === false &&
    value.can_write_route_integration_contract_record === false &&
    value.can_write_handoff_context_update_contract_record === false &&
    value.can_write_memory === false &&
    value.can_call_github === false &&
    value.can_call_provider_openai === false &&
    value.can_execute_codex === false &&
    value.can_render_workbench_action_button === false
  );
}

function isReadOnlyAppliedContextAuthority(value: RecordValue | null): boolean {
  if (!value) return false;
  return (
    value.can_write_db === false &&
    value.can_create_handoff_context_apply_record === false &&
    value.can_create_applied_handoff_context_snapshot === false &&
    value.can_apply_handoff_context_update_live === false &&
    value.can_mutate_handoff_context === false &&
    value.can_send_handoff === false &&
    value.can_copy_export_handoff_packet === false &&
    value.can_write_selected_refs_to_live_handoff === false &&
    value.can_write_memory === false &&
    value.can_call_github === false &&
    value.can_call_provider_openai === false &&
    value.can_execute_codex === false
  );
}

function isNoSideEffectsValid(value: unknown): value is HandoffContextApplyNoSideEffects {
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
  value: HandoffContextApplyNoSideEffects | undefined,
): HandoffContextApplyNoSideEffectsSummary {
  const count = (field: keyof HandoffContextApplyNoSideEffects) =>
    value?.[field] === true ? 1 : 0;
  return {
    handoff_context_apply_record_written_count:
      count("handoff_context_apply_record_written"),
    handoff_context_apply_receipt_written_count:
      count("handoff_context_apply_receipt_written"),
    handoff_context_apply_persisted_count:
      count("handoff_context_apply_persisted"),
    applied_handoff_context_snapshot_written_count:
      count("applied_handoff_context_snapshot_written"),
    handoff_context_update_applied_to_local_snapshot_count:
      count("handoff_context_update_applied_to_local_snapshot"),
    live_handoff_context_updated_count: count("live_handoff_context_updated"),
    live_handoff_context_mutated_count: count("live_handoff_context_mutated"),
    handoff_context_applied_live_count: count("handoff_context_applied_live"),
    handoff_context_mutated_count: count("handoff_context_mutated"),
    handoff_sent_count: count("handoff_sent"),
    selected_refs_written_to_live_handoff_count:
      count("selected_refs_written_to_live_handoff"),
    handoff_packet_copy_exported_count: count("handoff_packet_copy_exported"),
    handoff_packet_sent_count: count("handoff_packet_sent"),
    api_perspective_current_route_modified_count:
      count("api_perspective_current_route_modified"),
    current_working_perspective_route_response_replaced_count:
      count("current_working_perspective_route_response_replaced"),
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
  selectedSnapshotRef,
  selectedSnapshotFound,
}: {
  storeResult: HandoffContextApplyStoreResult | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  selectedSnapshotRef: string | null;
  selectedSnapshotFound: boolean;
}): HandoffContextApplyRecordReviewStatus {
  if (invalidCount > 0) return "records_invalid";
  if (storeResult?.status === "schema_missing") return "schema_missing";
  if (suppliedCount === 0 || validCount === 0) return "no_records";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  if (selectedSnapshotRef) {
    return selectedSnapshotFound
      ? "selected_applied_snapshot_found"
      : "selected_applied_snapshot_missing";
  }
  return "records_available";
}

function isStoreResult(value: unknown): value is HandoffContextApplyStoreResult {
  return (
    isRecord(value) &&
    value.store_version === HANDOFF_CONTEXT_APPLY_STORE_VERSION &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
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

function getRecord(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? (value[key] as RecordValue) : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
