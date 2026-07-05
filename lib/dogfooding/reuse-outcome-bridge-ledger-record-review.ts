import {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  type HandoffReuseOutcomeLedgerRecord,
  type HandoffReuseOutcomeLedgerStoreResult,
} from "@/types/handoff-reuse-outcome-ledger";
import {
  REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION,
  type ReuseOutcomeBridgeLedgerRecordReview,
  type ReuseOutcomeBridgeLedgerRecordReviewAuthorityBoundary,
  type ReuseOutcomeBridgeLedgerRecordReviewInput,
  type ReuseOutcomeBridgeLedgerRecordSummary,
} from "@/types/reuse-outcome-bridge-ledger-record-review";
import { createReuseOutcomeBridgeLedgerNoSideEffectsV01 } from "@/lib/dogfooding/reuse-outcome-bridge-ledger-write";
import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildReuseOutcomeBridgeLedgerRecordReviewV01({
  records,
  store_result,
  selected_record_id,
  scope,
  as_of,
  source_refs,
}: ReuseOutcomeBridgeLedgerRecordReviewInput = {}): ReuseOutcomeBridgeLedgerRecordReview {
  const supplied = [
    ...(records ?? []),
    ...(store_result?.records ?? []),
    ...(store_result?.record ? [store_result.record] : []),
  ];
  const validRecords = uniqueRecords(
    supplied.filter(isHandoffReuseOutcomeLedgerRecord),
  );
  const invalidCount = supplied.length - validRecords.length;
  const summaries = validRecords.map(buildSummary);
  const selectedSummary =
    summaries.find((summary) => summary.record_id === selected_record_id) ??
    null;
  const latestSummary = [...summaries].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0] ?? null;
  const recordSideEffectProblemCount = summaries.filter(
    (summary) => !summary.receipt_no_side_effects_valid,
  ).length;
  const receiptSideEffectProblemReasons =
    buildStoreResultReceiptSideEffectProblemReasons(store_result);
  const sideEffectProblemCount =
    recordSideEffectProblemCount + receiptSideEffectProblemReasons.length;
  const reviewStatus =
    invalidCount > 0 || sideEffectProblemCount > 0
      ? "records_invalid"
      : selected_record_id && selectedSummary
        ? "selected_record_found"
        : selected_record_id
          ? "selected_record_missing"
          : validRecords.length > 0
            ? "records_available"
            : store_result?.status === "schema_missing"
              ? "schema_missing"
              : "no_records";
  const sourceRefs = uniqueCandidateIngressStringsV01([
    REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION,
    ...(source_refs ?? []),
    ...(store_result?.receipt.source_refs ?? []),
    ...validRecords.flatMap((record) => record.source_refs),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const aggregateCounts = aggregate(summaries);

  return {
    review_version: REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION,
    scope: scope ?? HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    as_of:
      as_of ??
      latestSummary?.created_at ??
      store_result?.record?.created_at ??
      FALLBACK_AS_OF,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: supplied.length,
      valid_record_count: validRecords.length,
      invalid_record_count: invalidCount,
      selected_record_id: selected_record_id ?? null,
      selected_record_found: Boolean(selectedSummary),
      latest_record_id: latestSummary?.record_id ?? null,
      latest_record_created_at: latestSummary?.created_at ?? null,
      bridge_written_record_count: validRecords.filter(isBridgeWrittenRecord)
        .length,
      receipt_side_effect_problem_count: sideEffectProblemCount,
    },
    record_summaries: summaries,
    selected_record_summary: selectedSummary,
    latest_record_summary: latestSummary,
    records: validRecords,
    evidence_summary: {
      supplied_record_count: supplied.length,
      valid_record_count: validRecords.length,
      has_records: validRecords.length > 0,
      has_selected_record: Boolean(selectedSummary),
      has_source_refs: sourceRefs.length > 0,
      has_receipt_side_effect_problem: sideEffectProblemCount > 0,
      source_refs: sourceRefs,
      problem_record_ids: summaries
        .filter((summary) => summary.problem_reasons.length > 0)
        .map((summary) => summary.record_id),
    },
    aggregate_counts: aggregateCounts,
    receipt_no_side_effects_summary:
      createReuseOutcomeBridgeLedgerNoSideEffectsV01({
        wrote: validRecords.length > 0,
      }),
    blocked_reasons: uniqueCandidateIngressStringsV01([
      ...(invalidCount > 0 ? ["invalid_reuse_ledger_records_present"] : []),
      ...receiptSideEffectProblemReasons,
      ...(sideEffectProblemCount > 0
        ? ["reuse_ledger_receipt_forbidden_side_effect_claim_present"]
        : []),
    ]),
    insufficient_data_reasons:
      validRecords.length === 0 ? ["reuse_outcome_ledger_records_missing"] : [],
    operator_review_checklist: [
      "confirm_records_are_existing_handoff_reuse_outcome_ledger_records",
      "confirm_bridge_written_records_are_local_ledger_records_only",
      "confirm_receipts_do_not_claim_metric_memory_perspective_cwp_relay_or_handoff_side_effects",
      "confirm_reuse_ledger_records_are_not_memory_or_perspective_promotion",
    ],
    would_not_do: [
      "does_not_open_db_or_create_schema",
      "does_not_write_reuse_ledger_from_review",
      "does_not_write_dogfood_metrics",
      "does_not_write_memory_perspective_cwp_relay_or_handoff",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "dogfood_metric_write",
      "expected_observed_delta_write",
      "work_episode_write",
      "memory_or_perspective_promotion",
      "handoff_context_apply_or_send",
      "external_action",
    ],
    authority_boundary:
      createReuseOutcomeBridgeLedgerRecordReviewAuthorityBoundaryV01(),
  };
}

export function createReuseOutcomeBridgeLedgerRecordReviewAuthorityBoundaryV01(): ReuseOutcomeBridgeLedgerRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_handoff_reuse_ledger: false,
    can_write_dogfood_metrics: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_write_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Read-only review of already-read HandoffReuseOutcomeLedger records.",
      "Workbench default does not open DB handles, call routes, create schema, or write records.",
    ],
  };
}

function buildStoreResultReceiptSideEffectProblemReasons(
  storeResult: ReuseOutcomeBridgeLedgerRecordReviewInput["store_result"],
): string[] {
  if (!storeResult) return [];

  const reasons: string[] = [];
  if (!ledgerReceiptNoSideEffectsValid(storeResult.receipt)) {
    reasons.push("reuse_ledger_receipt_no_side_effects_invalid");
  }
  if (!ledgerStoreNoSideEffectsValid(storeResult)) {
    reasons.push("reuse_ledger_store_no_side_effects_invalid");
  }
  if (
    isRecord(storeResult) &&
    isRecord(storeResult.no_side_effects) &&
    !bridgeWrapperNoSideEffectsValid(storeResult.no_side_effects)
  ) {
    reasons.push("reuse_ledger_receipt_forbidden_side_effect_claim_present");
  }

  return uniqueCandidateIngressStringsV01(reasons);
}

function ledgerReceiptNoSideEffectsValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    "no_metric_update",
    "no_memory_mutation",
    "no_perspective_apply",
    "no_provider_call",
    "no_github_call",
    "no_codex_execution",
    "no_handoff_send",
  ].every((field) => value[field] === true);
}

function ledgerStoreNoSideEffectsValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    "no_metric_update",
    "no_memory_mutation",
    "no_perspective_apply",
    "no_provider_call",
    "no_github_call",
    "no_codex_execution",
    "no_handoff_send",
  ].every((field) => value[field] === undefined || value[field] === true);
}

function bridgeWrapperNoSideEffectsValid(value: Record<string, unknown>): boolean {
  return [
    "dogfood_metrics_written",
    "work_episode_written",
    "expected_observed_delta_written",
    "memory_mutated",
    "current_working_perspective_updated",
    "perspective_unit_written",
    "next_work_bias_written",
    "continuity_relay_written",
    "handoff_context_mutated",
    "selected_refs_written_to_live_handoff",
    "handoff_sent",
    "provider_called",
    "github_called",
    "codex_executed",
    "pr_created",
    "pr_merged",
    "autonomous_action_run",
    "graph_or_vector_store_created",
    "rag_stack_created",
    "crawler_or_browser_observer_created",
  ].every((field) => value[field] === undefined || value[field] === false);
}

function buildSummary(
  record: HandoffReuseOutcomeLedgerRecord,
): ReuseOutcomeBridgeLedgerRecordSummary {
  const carryForward = record.carry_forward_candidates;
  const noSideEffectsValid =
    record.authority_boundary.can_update_metrics === false &&
    record.authority_boundary.can_mutate_memory === false &&
    record.authority_boundary.can_apply_project_perspective === false &&
    record.authority_boundary.can_send_handoff === false &&
    record.authority_boundary.can_call_provider_openai === false &&
    record.authority_boundary.can_call_github === false &&
    record.authority_boundary.can_execute_codex === false;
  return {
    record_id: record.record_id,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    operator_ref: record.operator_approval.operator_ref,
    result_ref: record.result_report_ref,
    work_ref: record.feedback_draft_refs.feedback_draft_ref,
    handoff_ref: record.context_relay_rationale_ref,
    delta_ref_count: record.source_refs.filter((ref) =>
      ref.includes("expected-observed-delta"),
    ).length,
    helpful_ref_count: record.reuse_classifications.helpful_refs.length,
    stale_ref_count: record.reuse_classifications.stale_refs.length,
    missing_ref_count: record.reuse_classifications.missing_refs.length,
    noisy_ref_count: record.reuse_classifications.noisy_refs.length,
    misleading_ref_count: record.reuse_classifications.misleading_refs.length,
    unknown_ref_count: record.reuse_classifications.unknown_refs.length,
    skipped_or_unverified_check_count:
      record.skipped_or_unverified_checks.length,
    not_done_count: record.not_done_items.length,
    expected_observed_mismatch_count:
      record.expected_observed_summary.missing_expectation_count +
      record.expected_observed_summary.unexpected_observation_count,
    carry_forward_count:
      carryForward.refs_to_preserve_next_time.length +
      carryForward.refs_to_warn_next_time.length +
      carryForward.refs_to_drop_or_deprioritize.length +
      carryForward.unresolved_gaps.length +
      (carryForward.next_focus_candidate ? 1 : 0),
    receipt_no_side_effects_valid: noSideEffectsValid,
    problem_reasons: noSideEffectsValid
      ? []
      : ["reuse_ledger_record_forbidden_side_effect_authority"],
  };
}

function aggregate(summaries: ReuseOutcomeBridgeLedgerRecordSummary[]) {
  return {
    helpful_ref_count: sum(summaries.map((summary) => summary.helpful_ref_count)),
    stale_ref_count: sum(summaries.map((summary) => summary.stale_ref_count)),
    missing_ref_count: sum(summaries.map((summary) => summary.missing_ref_count)),
    noisy_ref_count: sum(summaries.map((summary) => summary.noisy_ref_count)),
    misleading_ref_count: sum(
      summaries.map((summary) => summary.misleading_ref_count),
    ),
    unknown_ref_count: sum(summaries.map((summary) => summary.unknown_ref_count)),
    skipped_or_unverified_check_count: sum(
      summaries.map((summary) => summary.skipped_or_unverified_check_count),
    ),
    not_done_count: sum(summaries.map((summary) => summary.not_done_count)),
    expected_observed_mismatch_count: sum(
      summaries.map((summary) => summary.expected_observed_mismatch_count),
    ),
    carry_forward_count: sum(summaries.map((summary) => summary.carry_forward_count)),
  };
}

function isHandoffReuseOutcomeLedgerRecord(
  value: unknown,
): value is HandoffReuseOutcomeLedgerRecord {
  return (
    isRecord(value) &&
    value.record_version === HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION &&
    isRecord(value.operator_approval) &&
    isRecord(value.reuse_classifications) &&
    isRecord(value.expected_observed_summary) &&
    isRecord(value.carry_forward_candidates)
  );
}

function isBridgeWrittenRecord(record: HandoffReuseOutcomeLedgerRecord): boolean {
  return record.source_refs.some((ref) =>
    ref.includes("reuse_outcome_bridge_ledger_write_adapter.v0.1"),
  );
}

function uniqueRecords(
  records: HandoffReuseOutcomeLedgerRecord[],
): HandoffReuseOutcomeLedgerRecord[] {
  const seen = new Set<string>();
  const output: HandoffReuseOutcomeLedgerRecord[] = [];
  for (const record of records) {
    if (seen.has(record.record_id)) continue;
    seen.add(record.record_id);
    output.push(record);
  }
  return output;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
