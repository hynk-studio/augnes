import type {
  CodexContextReuseRef,
  CodexResultFeedbackDraftConfidence,
} from "@/types/codex-result-feedback-draft";
import {
  DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
  type DogfoodMetricCandidateAggregateCounts,
  type DogfoodMetricCandidateAuthorityBoundary,
  type DogfoodMetricCandidatePreview,
  type DogfoodMetricCandidateWindow,
  type DogfoodMetricSourceRecordSummary,
} from "@/types/dogfood-metric-candidate-preview";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  type HandoffReuseOutcomeLedgerRecord,
} from "@/types/handoff-reuse-outcome-ledger";

export interface DogfoodMetricCandidatePreviewInput {
  records: HandoffReuseOutcomeLedgerRecord[];
  as_of?: string;
  scope?: string;
  ledger_store_ref?: string | null;
  metric_window?: Partial<DogfoodMetricCandidateWindow>;
  source_refs?: string[];
  insufficient_data_reasons?: string[];
}

const sampleFixtureMarkers = [
  "codex-result-report:sample-safe",
  "sample-codex-result-report",
  "sample-public-safe",
  "operator-ref:sample-human-reviewer",
  "fixtures/codex-result-report-ingestion.sample.v0.1.json",
  "codex-result-report-ingestion.sample.v0.1",
] as const;

export function buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01(
  input: DogfoodMetricCandidatePreviewInput,
): DogfoodMetricCandidatePreview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const window = normalizeWindow(input.metric_window);
  const filteredRecords = applyWindowFilters(input.records, window);
  const approvedRecords = filteredRecords.filter(
    (record) => isApprovedLedgerRecord(record) && !isSampleFixtureBacked(record),
  );
  const excludedRecordCount = filteredRecords.length - approvedRecords.length;
  const sourceRecordSummaries = approvedRecords.map(sourceRecordSummary);
  const aggregateCounts = aggregateRecordCounts(sourceRecordSummaries);
  const insufficientDataReasons = insufficientReasons({
    inputReasons: input.insufficient_data_reasons ?? [],
    approvedRecordCount: approvedRecords.length,
    filteredRecordCount: filteredRecords.length,
    excludedRecordCount,
  });
  const candidateStatus =
    approvedRecords.length === 0
      ? "insufficient_data"
      : hasProblemSignals(aggregateCounts)
        ? "needs_review"
        : "candidate_signal";
  const sourceRefs = uniqueSortedStrings([
    DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    ...(input.source_refs ?? []),
    ...approvedRecords.flatMap((record) => record.source_refs),
    ...approvedRecords.map((record) => `ledger-record:${record.record_id}`),
    ...approvedRecords.map(
      (record) => `result-report:${record.result_report_ref}`,
    ),
  ]);

  return {
    preview_version: DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
    scope: input.scope ?? HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    as_of: asOf,
    candidate_status: candidateStatus,
    summary: previewSummary({
      approvedRecordCount: approvedRecords.length,
      aggregateCounts,
      excludedRecordCount,
    }),
    source_refs: sourceRefs,
    ledger_source: {
      store_version: HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
      record_count: approvedRecords.length,
      raw_record_count: input.records.length,
      excluded_record_count: excludedRecordCount,
      record_refs: approvedRecords.map((record) => record.record_id),
      result_report_refs: uniqueSortedStrings(
        approvedRecords.map((record) => record.result_report_ref),
      ),
      ledger_store_ref: input.ledger_store_ref ?? null,
    },
    metric_window: window,
    aggregate_counts: aggregateCounts,
    reuse_quality_candidate: {
      helpful_records: sourceRecordSummaries.filter(
        (summary) => summary.helpful_ref_count > 0,
      ).length,
      problem_records: sourceRecordSummaries.filter(
        (summary) => problemBucketCount(summary) > 0,
      ).length,
      unknown_heavy_records: sourceRecordSummaries.filter(
        (summary) =>
          summary.unknown_ref_count >
          summary.helpful_ref_count + problemBucketCount(summary),
      ).length,
      stale_or_gap_records: sourceRecordSummaries.filter(
        (summary) =>
          summary.stale_ref_count + summary.missing_ref_count > 0,
      ).length,
      context_feedback_signal_records: approvedRecords.filter(
        (record) => record.dogfood_signal.context_feedback_signal_present,
      ).length,
      confidence: candidateConfidence(approvedRecords.length, aggregateCounts),
      summary: reuseSummary(approvedRecords.length, aggregateCounts),
    },
    handoff_quality_candidate: {
      records_with_skipped_checks: sourceRecordSummaries.filter(
        (summary) => summary.skipped_check_count > 0,
      ).length,
      records_with_not_done_items: sourceRecordSummaries.filter(
        (summary) => summary.not_done_item_count > 0,
      ).length,
      records_with_mismatches: sourceRecordSummaries.filter((summary) =>
        summary.expected_observed_mismatch,
      ).length,
      records_with_carry_forward_candidates: approvedRecords.filter(
        (record) => carryForwardCount(record) > 0,
      ).length,
      confidence: candidateConfidence(approvedRecords.length, aggregateCounts),
      summary: handoffSummary(approvedRecords.length, aggregateCounts),
    },
    source_record_summaries: sourceRecordSummaries,
    insufficient_data_reasons: insufficientDataReasons,
    metric_write_readiness: {
      ready_for_metric_write: false,
      required_followup: [
        "operator_reviewed_dogfood_metric_write_contract",
        "metric_baseline_update_policy",
        "repeated_approved_ledger_record_review",
      ],
      refusal_reasons: [
        "metric_write_not_in_scope_for_v0_1",
        "candidate_preview_only",
        "operator_review_required_before_metric_write",
      ],
    },
    non_goals: [
      "no_dogfood_metric_write",
      "no_metric_baseline_update",
      "no_memory_mutation",
      "no_perspective_apply",
      "no_provider_github_codex_or_handoff_action",
    ],
    authority_boundary: createDogfoodMetricCandidateAuthorityBoundaryV01(),
  };
}

export function createDogfoodMetricCandidateAuthorityBoundaryV01(): DogfoodMetricCandidateAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_dogfood_ledger: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_send_handoff: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Dogfood metric candidate preview is a read-only derived read model.",
      "Approved ledger records are not automatic metric writes or proof of improvement.",
      "Skipped checks, not-done items, stale refs, missing refs, noisy refs, misleading refs, and unknown refs remain visible problem signals.",
    ],
  };
}

function normalizeWindow(
  window: Partial<DogfoodMetricCandidateWindow> | undefined,
): DogfoodMetricCandidateWindow {
  return {
    since: window?.since ?? null,
    until: window?.until ?? null,
    limit: window?.limit ?? null,
    filtered_by_result_report_ref: window?.filtered_by_result_report_ref ?? null,
    filtered_by_operator_ref: window?.filtered_by_operator_ref ?? null,
  };
}

function applyWindowFilters(
  records: HandoffReuseOutcomeLedgerRecord[],
  window: DogfoodMetricCandidateWindow,
): HandoffReuseOutcomeLedgerRecord[] {
  const sinceMs = window.since ? Date.parse(window.since) : Number.NaN;
  const untilMs = window.until ? Date.parse(window.until) : Number.NaN;
  const filtered = records
    .filter((record) => {
      if (
        window.filtered_by_result_report_ref &&
        record.result_report_ref !== window.filtered_by_result_report_ref
      ) {
        return false;
      }
      if (
        window.filtered_by_operator_ref &&
        record.operator_approval.approved_by !==
          window.filtered_by_operator_ref &&
        record.operator_approval.operator_ref !==
          window.filtered_by_operator_ref
      ) {
        return false;
      }
      const createdAtMs = Date.parse(record.created_at);
      if (Number.isFinite(sinceMs) && createdAtMs < sinceMs) return false;
      if (Number.isFinite(untilMs) && createdAtMs > untilMs) return false;
      return true;
    })
    .sort((left, right) =>
      left.created_at === right.created_at
        ? left.record_id.localeCompare(right.record_id)
        : left.created_at.localeCompare(right.created_at),
    );
  return window.limit && window.limit > 0
    ? filtered.slice(0, window.limit)
    : filtered;
}

function isApprovedLedgerRecord(
  record: HandoffReuseOutcomeLedgerRecord,
): boolean {
  return (
    record.record_version === HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION &&
    record.store_version === HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION &&
    record.operator_decision === "approve_for_future_write" &&
    record.authority_boundary.operator_approved_durable_local_record === true
  );
}

function sourceRecordSummary(
  record: HandoffReuseOutcomeLedgerRecord,
): DogfoodMetricSourceRecordSummary {
  const expectedObserved = record.expected_observed_summary;
  const expectedObservedMismatch =
    hasExpectedObservedMismatch(expectedObserved);
  return {
    record_id: record.record_id,
    result_report_ref: record.result_report_ref,
    operator_ref: record.operator_approval.operator_ref,
    approved_by: record.operator_approval.approved_by,
    created_at: record.created_at,
    proposed_record_kind: record.proposed_record_kind,
    helpful_ref_count: countRefs(record.reuse_classifications.helpful_refs),
    stale_ref_count: countRefs(record.reuse_classifications.stale_refs),
    missing_ref_count: countRefs(record.reuse_classifications.missing_refs),
    noisy_ref_count: countRefs(record.reuse_classifications.noisy_refs),
    misleading_ref_count: countRefs(
      record.reuse_classifications.misleading_refs,
    ),
    unknown_ref_count: countRefs(record.reuse_classifications.unknown_refs),
    skipped_check_count: record.skipped_or_unverified_checks.length,
    not_done_item_count: record.not_done_items.length,
    expected_observed_mismatch: expectedObservedMismatch,
    mismatch_summary: expectedObserved.mismatch_summary,
    confidence: expectedObserved.confidence,
    source_refs: uniqueSortedStrings([
      record.record_id,
      record.result_report_ref,
      ...record.source_refs.slice(0, 12),
    ]),
  };
}

function aggregateRecordCounts(
  summaries: DogfoodMetricSourceRecordSummary[],
): DogfoodMetricCandidateAggregateCounts {
  return {
    approved_record_count: summaries.length,
    helpful_ref_count: sum(summaries, "helpful_ref_count"),
    stale_ref_count: sum(summaries, "stale_ref_count"),
    missing_ref_count: sum(summaries, "missing_ref_count"),
    noisy_ref_count: sum(summaries, "noisy_ref_count"),
    misleading_ref_count: sum(summaries, "misleading_ref_count"),
    unknown_ref_count: sum(summaries, "unknown_ref_count"),
    skipped_or_unverified_check_count: sum(summaries, "skipped_check_count"),
    not_done_item_count: sum(summaries, "not_done_item_count"),
    expected_observed_mismatch_count: summaries.filter(
      (summary) => summary.expected_observed_mismatch,
    ).length,
    insufficient_data_record_count: summaries.filter(
      (summary) => summary.confidence === "insufficient_data",
    ).length,
  };
}

function insufficientReasons({
  inputReasons,
  approvedRecordCount,
  filteredRecordCount,
  excludedRecordCount,
}: {
  inputReasons: string[];
  approvedRecordCount: number;
  filteredRecordCount: number;
  excludedRecordCount: number;
}): string[] {
  const reasons = [...inputReasons];
  if (filteredRecordCount === 0) {
    reasons.push("empty_metric_window");
    reasons.push("approved_reuse_ledger_records_missing");
  }
  if (approvedRecordCount === 0) {
    reasons.push("approved_current_work_metric_inputs_missing");
  }
  if (excludedRecordCount > 0) {
    reasons.push("sample_fixture_or_non_approved_records_excluded");
  }
  return uniqueSortedStrings(reasons);
}

function previewSummary({
  approvedRecordCount,
  aggregateCounts,
  excludedRecordCount,
}: {
  approvedRecordCount: number;
  aggregateCounts: DogfoodMetricCandidateAggregateCounts;
  excludedRecordCount: number;
}): string {
  if (approvedRecordCount === 0) {
    return "No approved handoff reuse outcome ledger records are available for dogfood metric candidate aggregation.";
  }
  return [
    `${approvedRecordCount} approved ledger record(s) produced candidate signal only.`,
    `${aggregateCounts.helpful_ref_count} helpful refs and ${problemSignalCount(aggregateCounts)} problem/unknown refs remain visible.`,
    "This is not a metric write or proof of improvement.",
    excludedRecordCount > 0
      ? `${excludedRecordCount} record(s) were excluded from current-work metric input.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function reuseSummary(
  approvedRecordCount: number,
  counts: DogfoodMetricCandidateAggregateCounts,
): string {
  if (approvedRecordCount === 0) {
    return "Reuse quality has insufficient data because no approved ledger records were supplied.";
  }
  return `${counts.helpful_ref_count} helpful refs are visible alongside ${counts.stale_ref_count} stale, ${counts.missing_ref_count} missing, ${counts.noisy_ref_count} noisy, ${counts.misleading_ref_count} misleading, and ${counts.unknown_ref_count} unknown refs.`;
}

function handoffSummary(
  approvedRecordCount: number,
  counts: DogfoodMetricCandidateAggregateCounts,
): string {
  if (approvedRecordCount === 0) {
    return "Handoff quality has insufficient data because no approved ledger records were supplied.";
  }
  return `${counts.skipped_or_unverified_check_count} skipped or unverified checks, ${counts.not_done_item_count} not-done items, and ${counts.expected_observed_mismatch_count} expected/observed mismatch records remain candidate signals.`;
}

function candidateConfidence(
  approvedRecordCount: number,
  counts: DogfoodMetricCandidateAggregateCounts,
): CodexResultFeedbackDraftConfidence {
  if (approvedRecordCount === 0) return "insufficient_data";
  if (approvedRecordCount < 2) return "low";
  if (hasProblemSignals(counts)) return "medium";
  return "medium";
}

function hasProblemSignals(
  counts: DogfoodMetricCandidateAggregateCounts,
): boolean {
  return (
    counts.stale_ref_count +
      counts.missing_ref_count +
      counts.noisy_ref_count +
      counts.misleading_ref_count +
      counts.unknown_ref_count +
      counts.skipped_or_unverified_check_count +
      counts.not_done_item_count +
      counts.expected_observed_mismatch_count >
    0
  );
}

function problemSignalCount(
  counts: DogfoodMetricCandidateAggregateCounts,
): number {
  return (
    counts.stale_ref_count +
    counts.missing_ref_count +
    counts.noisy_ref_count +
    counts.misleading_ref_count +
    counts.unknown_ref_count
  );
}

function problemBucketCount(summary: DogfoodMetricSourceRecordSummary): number {
  return (
    summary.stale_ref_count +
    summary.missing_ref_count +
    summary.noisy_ref_count +
    summary.misleading_ref_count
  );
}

function hasExpectedObservedMismatch(
  summary: HandoffReuseOutcomeLedgerRecord["expected_observed_summary"],
): boolean {
  if (summary.missing_expectation_count > 0) return true;
  if (summary.unexpected_observation_count > 0) return true;
  if (summary.not_done_items.length > 0) return true;
  if (
    /^no expected\/observed mismatch/i.test(summary.mismatch_summary) ||
    /^matched\b/i.test(summary.mismatch_summary)
  ) {
    return false;
  }
  return (
    summary.missing_expectations.length > 0 ||
    summary.unexpected_observations.length > 0
  );
}

function carryForwardCount(record: HandoffReuseOutcomeLedgerRecord): number {
  const candidates = record.carry_forward_candidates;
  return (
    candidates.next_relay_update_suggestions.length +
    candidates.next_handoff_adjustments.length +
    candidates.refs_to_preserve_next_time.length +
    candidates.refs_to_warn_next_time.length +
    candidates.refs_to_drop_or_deprioritize.length +
    candidates.unresolved_gaps.length
  );
}

function countRefs(refs: CodexContextReuseRef[]): number {
  return refs.length;
}

function sum(
  summaries: DogfoodMetricSourceRecordSummary[],
  field: keyof Pick<
    DogfoodMetricSourceRecordSummary,
    | "helpful_ref_count"
    | "stale_ref_count"
    | "missing_ref_count"
    | "noisy_ref_count"
    | "misleading_ref_count"
    | "unknown_ref_count"
    | "skipped_check_count"
    | "not_done_item_count"
  >,
): number {
  return summaries.reduce((total, summary) => total + summary[field], 0);
}

function isSampleFixtureBacked(value: unknown): boolean {
  const normalized = stableStringify(value).toLowerCase();
  return sampleFixtureMarkers.some((marker) => normalized.includes(marker));
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortJson(value[key])]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
