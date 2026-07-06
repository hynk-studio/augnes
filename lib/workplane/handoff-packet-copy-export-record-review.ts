import {
  calculateHandoffPacketExportedArtifactPayloadHashV01,
} from "@/lib/workplane/handoff-packet-copy-export-preview";
import {
  HANDOFF_PACKET_COPY_EXPORT_RECORD_REVIEW_VERSION,
  type ExportedHandoffPacketArtifactSummary,
  type HandoffPacketCopyExportNoSideEffectsSummary,
  type HandoffPacketCopyExportRecordReview,
  type HandoffPacketCopyExportRecordReviewAuthorityBoundary,
  type HandoffPacketCopyExportRecordReviewInput,
  type HandoffPacketCopyExportRecordReviewStatus,
  type HandoffPacketCopyExportRecordSummary,
} from "@/types/handoff-packet-copy-export-record-review";
import {
  HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION,
  type HandoffPacketExportedArtifact,
} from "@/types/handoff-packet-copy-export-preview";
import {
  HANDOFF_PACKET_COPY_EXPORT_RECORD_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
  type HandoffPacketCopyExportNoSideEffects,
  type HandoffPacketCopyExportRecord,
  type HandoffPacketCopyExportStoreResult,
} from "@/types/handoff-packet-copy-export-write";

type RecordValue = Record<string, unknown>;

const allowedReceiptTrueFields = [
  "handoff_packet_copy_export_record_written",
  "handoff_packet_copy_export_receipt_written",
  "handoff_packet_copy_export_persisted",
  "handoff_packet_exported_artifact_written",
  "handoff_packet_materialized_to_local_artifact",
] as const;

const forbiddenNoSideEffectFields = [
  "handoff_packet_copied_to_clipboard",
  "handoff_packet_exported_to_file",
  "handoff_packet_download_created",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_sent",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
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
  "durable_local_handoff_packet_copy_export_record",
  "durable_local_handoff_packet_exported_artifact",
  "local_project_handoff_packet_copy_export_only",
  "can_write_db",
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_copy_export_receipt",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_materialize_handoff_packet_to_local_artifact",
] as const;

const writeAuthorityFalseFields = [
  "source_of_truth",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_packet_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
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

const exportedArtifactAuthorityFalseFields = [
  "can_write_db",
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_copy_export_receipt",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_copy_export_handoff_packet_to_local_artifact",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
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

export function buildHandoffPacketCopyExportRecordReviewV01(
  input: HandoffPacketCopyExportRecordReviewInput = {},
): HandoffPacketCopyExportRecordReview {
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
      ? ["handoff_packet_copy_export_receipt_side_effect_invalid"]
      : [];
  const validRecords = rawRecords.filter(
    (record, index): record is HandoffPacketCopyExportRecord =>
      isCopyExportRecord(record) && summaries[index].problem_reasons.length === 0,
  );
  const validArtifacts = validRecords.map((record) => record.exported_packet_artifact);
  const selectedRecord =
    input.selected_record_id && validRecords.length
      ? validRecords.find((record) => record.record_id === input.selected_record_id) ??
        null
      : null;
  const selectedArtifact =
    input.selected_exported_artifact_ref && validArtifacts.length
      ? validArtifacts.find(
          (artifact) =>
            artifact.artifact_ref === input.selected_exported_artifact_ref,
        ) ?? null
      : null;
  const latestRecord =
    validRecords.slice().sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
  const latestArtifact = latestRecord?.exported_packet_artifact ?? null;
  const selectedSummary = selectedRecord ? summarizeRecord(selectedRecord, []) : null;
  const selectedArtifactSummary = selectedArtifact
    ? summarizeArtifact(selectedArtifact, [])
    : null;
  const latestSummary = latestRecord ? summarizeRecord(latestRecord, []) : null;
  const latestArtifactSummary = latestArtifact
    ? summarizeArtifact(latestArtifact, [])
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
    selectedArtifactRef: input.selected_exported_artifact_ref ?? null,
    selectedArtifactFound: Boolean(selectedArtifact),
  });
  const noSideEffectsSummary = summarizeNoSideEffects(
    storeResult?.receipt.no_side_effects,
  );
  const problemIds = summaries
    .filter((summary) => summary.problem_reasons.length > 0)
    .map((summary) => summary.record_id);

  return {
    review_version: HANDOFF_PACKET_COPY_EXPORT_RECORD_REVIEW_VERSION,
    scope: HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      invalid_record_count: invalidCount,
      selected_record_id: input.selected_record_id ?? null,
      selected_record_found: Boolean(selectedRecord),
      selected_exported_artifact_ref: input.selected_exported_artifact_ref ?? null,
      selected_exported_artifact_found: Boolean(selectedArtifact),
      latest_record_id: latestRecord?.record_id ?? null,
      latest_record_created_at: latestRecord?.created_at ?? null,
      receipt_side_effect_problem_count: receiptProblemCount,
    },
    record_summaries: summaries,
    selected_record_summary: selectedSummary,
    selected_exported_artifact_summary: selectedArtifactSummary,
    latest_record_summary: latestSummary,
    latest_exported_artifact_summary: latestArtifactSummary,
    records: validRecords,
    exported_artifacts: validArtifacts,
    evidence_summary: {
      supplied_record_count: rawRecords.length,
      valid_record_count: validRecords.length,
      has_records: validRecords.length > 0,
      has_selected_record: Boolean(selectedRecord),
      has_selected_exported_artifact: Boolean(selectedArtifact),
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
          ? ["handoff_packet_copy_export_records_missing"]
          : [],
      problem_record_ids: problemIds,
    },
    handoff_packet_copy_export_material_summary: {
      packet_format_counts: countBy(
        validRecords.map((record) => record.requested_packet_format),
      ),
      copy_export_target_counts: countBy(
        validRecords.map((record) => record.requested_copy_export_target),
      ),
      packet_section_counts: countBy(
        validRecords.flatMap((record) =>
          Object.entries(record.packet_section_counts).flatMap(([section, count]) =>
            Array(Math.max(0, count)).fill(section),
          ),
        ),
      ),
      packet_entry_count: validRecords.reduce(
        (sum, record) => sum + record.packet_entry_count,
        0,
      ),
      payload_type_counts: countBy(
        validArtifacts.flatMap((artifact) => [
          artifact.markdown_payload ? "markdown_payload" : null,
          artifact.json_payload ? "json_payload" : null,
          artifact.capsule_payload ? "capsule_payload" : null,
        ]),
      ),
      payload_hashes: uniqueStrings(validArtifacts.map((artifact) => artifact.payload_hash)),
      source_copy_export_contract_record_refs: uniqueStrings(
        validRecords.map((record) => record.source_copy_export_contract_record_ref),
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
        ? ["handoff_packet_copy_export_records_missing"]
        : [],
    operator_review_checklist: [
      "confirm_records_are_scoped_local_packet_artifacts_only",
      "confirm_no_clipboard_download_file_or_send_receipt_claims",
      "confirm_payload_hash_and_record_artifact_refs_match",
    ],
    would_not_do: [
      "does_not_write_clipboard_download_or_arbitrary_file",
      "does_not_send_handoff",
      "does_not_mutate_live_handoff_context_or_selected_refs",
      "does_not_write_memory_metrics_routes_relay_or_external_systems",
    ],
    non_goals: [
      "no_os_clipboard_write",
      "no_browser_download_creation",
      "no_arbitrary_packet_file_write",
      "no_handoff_send",
    ],
    authority_boundary: createHandoffPacketCopyExportRecordReviewAuthorityBoundaryV01(),
  };
}

export function createHandoffPacketCopyExportRecordReviewAuthorityBoundaryV01():
  HandoffPacketCopyExportRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_handoff_packet_copy_export_record: false,
    can_create_handoff_packet_exported_artifact: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_handoff_packet_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
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
      "Review is read-only and accepts already-read records or store results.",
      "It flags records invalid when they claim clipboard, download, file, send, live handoff, route, memory, metrics, or external authority.",
    ],
  };
}

function evaluateRecord(record: unknown): HandoffPacketCopyExportRecordSummary {
  if (!isCopyExportRecord(record)) {
    return summarizeMalformedRecord(record, [
      "handoff_packet_copy_export_record_malformed",
    ]);
  }
  const reasons: string[] = [];
  if (!isAuthorityProfileValid(record.authority_profile)) {
    reasons.push("handoff_packet_copy_export_record_authority_profile_invalid");
  }
  if (!isNoExternalCopyExportOrSendValid(record.no_external_copy_export_or_send_performed)) {
    reasons.push("handoff_packet_copy_export_record_no_external_copy_export_or_send_invalid");
  }
  if (!isWriteAuthorityBoundaryValid(record.authority_boundary)) {
    reasons.push("handoff_packet_copy_export_record_authority_boundary_invalid");
  }
  if (!isExportedArtifactValid(record.exported_packet_artifact)) {
    reasons.push("handoff_packet_exported_artifact_malformed");
  }
  if (!recordArtifactMatch(record)) {
    reasons.push("handoff_packet_copy_export_record_artifact_mismatch");
  }
  if (containsRawMaterialKey(record)) {
    reasons.push("handoff_packet_copy_export_record_raw_material_refused");
  }
  return summarizeRecord(record, reasons);
}

function summarizeRecord(
  record: HandoffPacketCopyExportRecord,
  problemReasons: string[],
): HandoffPacketCopyExportRecordSummary {
  return {
    record_id: record.record_id,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    operator_ref: record.operator_ref,
    exported_artifact_ref: record.exported_artifact_ref,
    source_copy_export_contract_record_ref:
      record.source_copy_export_contract_record_ref,
    requested_packet_format: record.requested_packet_format,
    requested_copy_export_target: record.requested_copy_export_target,
    packet_entry_count: record.packet_entry_count,
    packet_section_counts: record.packet_section_counts,
    payload_hash: record.exported_packet_artifact_hash,
    record_fingerprint: record.record_fingerprint,
    receipt_no_side_effects_valid: problemReasons.every(
      (reason) =>
        reason !== "handoff_packet_copy_export_receipt_side_effect_invalid",
    ),
    problem_reasons: uniqueStrings(problemReasons),
  };
}

function summarizeMalformedRecord(
  record: unknown,
  problemReasons: string[],
): HandoffPacketCopyExportRecordSummary {
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
    exported_artifact_ref:
      typeof candidate.exported_artifact_ref === "string"
        ? candidate.exported_artifact_ref
        : null,
    source_copy_export_contract_record_ref: null,
    requested_packet_format: null,
    requested_copy_export_target: null,
    packet_entry_count: 0,
    packet_section_counts: {},
    payload_hash: null,
    record_fingerprint:
      typeof candidate.record_fingerprint === "string"
        ? candidate.record_fingerprint
        : null,
    receipt_no_side_effects_valid: false,
    problem_reasons: problemReasons,
  };
}

function summarizeArtifact(
  artifact: HandoffPacketExportedArtifact,
  problemReasons: string[],
): ExportedHandoffPacketArtifactSummary {
  return {
    artifact_ref: artifact.artifact_ref,
    packet_format: artifact.packet_format,
    copy_export_target: artifact.copy_export_target,
    source_copy_export_contract_record_ref:
      artifact.source_copy_export_contract_record_ref,
    source_applied_handoff_context_snapshot_ref:
      artifact.source_applied_handoff_context_snapshot_ref,
    packet_entry_count: artifact.packet_entry_count,
    packet_section_counts: artifact.packet_section_counts,
    has_markdown_payload: Boolean(artifact.markdown_payload),
    has_json_payload: Boolean(artifact.json_payload),
    has_capsule_payload: Boolean(artifact.capsule_payload),
    payload_hash: artifact.payload_hash,
    problem_reasons: uniqueStrings(problemReasons),
  };
}

function isCopyExportRecord(value: unknown): value is HandoffPacketCopyExportRecord {
  return Boolean(
    isRecord(value) &&
      value.record_version === HANDOFF_PACKET_COPY_EXPORT_RECORD_VERSION &&
      value.scope === HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.idempotency_key === "string" &&
      typeof value.created_at === "string" &&
      typeof value.operator_ref === "string" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs) &&
      typeof value.source_copy_export_contract_record_ref === "string" &&
      typeof value.source_applied_handoff_context_snapshot_ref === "string" &&
      typeof value.exported_artifact_ref === "string" &&
      isRecord(value.exported_packet_artifact) &&
      typeof value.exported_packet_artifact_hash === "string" &&
      typeof value.packet_entry_count === "number" &&
      isRecord(value.packet_section_counts) &&
      value.review_status === "copied_exported_as_scoped_local_handoff_packet_artifact" &&
      value.persistence_horizon === "local_project_handoff_packet_copy_export_store" &&
      typeof value.record_fingerprint === "string",
  );
}

function isExportedArtifactValid(value: unknown): value is HandoffPacketExportedArtifact {
  if (!isRecord(value)) return false;
  return (
    value.artifact_version === HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION &&
    value.scope === HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE &&
    typeof value.artifact_ref === "string" &&
    value.packet_family === "augnes_operator_handoff_packet" &&
    typeof value.packet_format === "string" &&
    typeof value.copy_export_target === "string" &&
    typeof value.source_copy_export_contract_record_ref === "string" &&
    typeof value.source_applied_handoff_context_snapshot_ref === "string" &&
    isRecord(value.packet_manifest) &&
    Array.isArray(value.packet_entries) &&
    typeof value.packet_entry_count === "number" &&
    isRecord(value.packet_section_counts) &&
    typeof value.payload_hash === "string" &&
    value.payload_hash ===
      calculateHandoffPacketExportedArtifactPayloadHashV01({
        packet_format: value.packet_format as HandoffPacketExportedArtifact["packet_format"],
        markdown_payload: value.markdown_payload as string | null,
        json_payload: value.json_payload as Record<string, unknown> | null,
        capsule_payload: value.capsule_payload as Record<string, unknown> | null,
      }) &&
    isArtifactAuthorityBoundaryValid(value.authority_boundary) &&
    isRecord(value.artifact_metadata) &&
    value.artifact_metadata.local_artifact_only === true &&
    value.artifact_metadata.clipboard_write_not_performed === true &&
    value.artifact_metadata.file_write_not_performed === true &&
    value.artifact_metadata.download_not_performed === true &&
    value.artifact_metadata.handoff_send_not_performed === true
  );
}

function recordArtifactMatch(record: HandoffPacketCopyExportRecord): boolean {
  const artifact = record.exported_packet_artifact;
  return (
    artifact.artifact_ref === record.exported_artifact_ref &&
    artifact.payload_hash === record.exported_packet_artifact_hash &&
    artifact.source_copy_export_contract_record_ref ===
      record.source_copy_export_contract_record_ref &&
    artifact.packet_format === record.requested_packet_format &&
    artifact.copy_export_target === record.requested_copy_export_target &&
    artifact.packet_entry_count === record.packet_entry_count
  );
}

function isAuthorityProfileValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.durable_local_handoff_packet_copy_export_record === true &&
    value.durable_local_handoff_packet_exported_artifact === true &&
    value.source_of_truth === false &&
    value.local_project_handoff_packet_copy_export_only === true &&
    value.handoff_packet_copy_export_record_written === true &&
    value.handoff_packet_exported_artifact_written === true &&
    value.handoff_packet_materialized_to_local_artifact === true &&
    value.clipboard_written === false &&
    value.file_download_created === false &&
    value.arbitrary_file_written === false &&
    value.handoff_packet_file_written === false &&
    value.handoff_sent === false &&
    value.live_handoff_context_mutated === false &&
    value.selected_refs_written_to_live_handoff === false &&
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

function isNoExternalCopyExportOrSendValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return forbiddenNoSideEffectFields.every((field) => value[field] === false);
}

function isWriteAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsTrue(value, writeAuthorityTrueFields) &&
    fieldsFalse(value, writeAuthorityFalseFields);
}

function isArtifactAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.read_only === true &&
    value.source_of_truth === false &&
    fieldsNotTrue(value, exportedArtifactAuthorityFalseFields)
  );
}

function isNoSideEffectsValid(
  value: unknown,
): value is HandoffPacketCopyExportNoSideEffects {
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
  value: HandoffPacketCopyExportNoSideEffects | undefined,
): HandoffPacketCopyExportNoSideEffectsSummary {
  const count = (field: keyof HandoffPacketCopyExportNoSideEffects) =>
    value?.[field] === true ? 1 : 0;
  return {
    handoff_packet_copy_export_record_written_count:
      count("handoff_packet_copy_export_record_written"),
    handoff_packet_copy_export_receipt_written_count:
      count("handoff_packet_copy_export_receipt_written"),
    handoff_packet_copy_export_persisted_count:
      count("handoff_packet_copy_export_persisted"),
    handoff_packet_exported_artifact_written_count:
      count("handoff_packet_exported_artifact_written"),
    handoff_packet_materialized_to_local_artifact_count:
      count("handoff_packet_materialized_to_local_artifact"),
    clipboard_written_count: count("clipboard_written"),
    file_download_created_count: count("file_download_created"),
    arbitrary_file_written_count: count("arbitrary_file_written"),
    handoff_packet_file_written_count: count("handoff_packet_file_written"),
    handoff_packet_copied_count: count("handoff_packet_copied"),
    handoff_packet_exported_count: count("handoff_packet_exported"),
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
  selectedArtifactRef,
  selectedArtifactFound,
}: {
  storeResult: HandoffPacketCopyExportStoreResult | null;
  suppliedCount: number;
  validCount: number;
  invalidCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  selectedArtifactRef: string | null;
  selectedArtifactFound: boolean;
}): HandoffPacketCopyExportRecordReviewStatus {
  if (invalidCount > 0) return "records_invalid";
  if (storeResult?.status === "schema_missing") return "schema_missing";
  if (suppliedCount === 0 || validCount === 0) return "no_records";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  if (selectedArtifactRef) {
    return selectedArtifactFound
      ? "selected_exported_artifact_found"
      : "selected_exported_artifact_missing";
  }
  return "records_available";
}

function isStoreResult(value: unknown): value is HandoffPacketCopyExportStoreResult {
  return (
    isRecord(value) &&
    value.store_version === HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION &&
    value.scope === HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE &&
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

function fieldsNotTrue(value: RecordValue, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] !== true);
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
