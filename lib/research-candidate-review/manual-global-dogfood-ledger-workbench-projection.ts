import type {
  ResearchCandidateManualGlobalDogfoodLedgerReadback,
  ResearchCandidateManualGlobalDogfoodLedgerRecord,
  ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt,
  ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-ledger-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_VERSION,
  type ResearchCandidateManualGlobalDogfoodExpectedObservedSignalSummary,
  type ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection,
  type ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionReadiness,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalCard,
  type ResearchCandidateManualGlobalDogfoodOutcomeSignal,
  type ResearchCandidateManualGlobalDogfoodOutcomeSignalSummary,
  type ResearchCandidateManualGlobalDogfoodWorkbenchProjectionAuthorityBoundary,
} from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

type OutcomeLabel =
  | "helpful"
  | "stale"
  | "missing"
  | "noisy"
  | "misleading";

const OUTCOME_LABELS: OutcomeLabel[] = [
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
];

export function buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
  readback,
  operator_view = null,
  limit,
}: {
  readback: ResearchCandidateManualGlobalDogfoodLedgerReadback | null;
  operator_view?: string | null;
  limit?: number | null;
}): ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection {
  const normalizedReadback = isReadback(readback) ? readback : null;
  const scope = normalizedReadback?.scope ?? DEFAULT_SCOPE;
  const recordsByReceipt = limitRecords(
    normalizedReadback?.records_by_receipt ?? [],
    limit,
  );
  const latestActive = normalizedReadback?.latest_active_committed ?? null;
  const latestRecord = latestActive?.ledger_record ?? null;
  const latestReceipt = latestActive?.receipt ?? null;
  const sourceReceiptIds = recordsByReceipt.map(
    (recordSet) => recordSet.receipt.receipt_id,
  );
  const sourceReadbackRef = buildSourceReadbackRef({
    readback: normalizedReadback,
    sourceReceiptIds,
  });
  const ledgerStatusSummary = summarizeLedgerStatuses(recordsByReceipt);
  const latestSummary = summarizeLatestLedgerRecord(latestReceipt, latestRecord);
  const blockedReasons = determineBlockers({
    readback: normalizedReadback,
    latestActive,
    latestRecord,
    latestSummary,
  });
  const readiness = determineReadiness(blockedReasons);
  const warningReasons = uniqueStrings([
    ...recordsByReceipt.flatMap((recordSet) =>
      recordSet.ledger_record?.warning_reasons ?? [],
    ),
    ...recordsByReceipt
      .filter((recordSet) => recordSet.rolled_back || recordSet.superseded)
      .map((recordSet) =>
        recordSet.rolled_back
          ? `context_only_rolled_back:${recordSet.receipt.receipt_id}`
          : `context_only_superseded:${recordSet.receipt.receipt_id}`,
      ),
  ]);
  const outcomeSignalSummary = buildOutcomeSignalSummary({
    recordsByReceipt,
    latestRecord,
  });
  const expectedObservedSignalSummary =
    buildExpectedObservedSignalSummary(latestRecord);
  const cards = buildNextWorkSignalCards({
    recordsByReceipt,
    latestActive,
    blockedReasons,
    warningReasons,
  });
  const requiredFutureAuthorization = [
    "Separate operator-reviewed dogfood metric snapshot write authorization is required before any metric write.",
    "Separate operator-reviewed next-work signal decision authorization is required before any next-work bias write.",
    "Separate Perspective promotion or memory authorization is required before any Perspective or memory write.",
    "Separate proof/evidence authorization is required before any proof/evidence row is created.",
  ];
  const authorityBoundary = getProjectionAuthorityBoundary();
  const projectionFingerprint = fingerprint({
    projection_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_VERSION,
    scope,
    source_readback_ref: sourceReadbackRef,
    source_receipt_ids: sourceReceiptIds,
    latest_active_committed_receipt_id: latestReceipt?.receipt_id ?? null,
    latest_ledger_record_summary: latestSummary,
    outcome_signal_summary: outcomeSignalSummary,
    expected_observed_signal_summary: expectedObservedSignalSummary,
    next_work_signal_candidates: cards.map((card) => ({
      card_kind: card.card_kind,
      card_status: card.card_status,
      source_receipt_id: card.source_receipt_id,
      source_record_id: card.source_record_id,
      source_fingerprints: card.source_fingerprints,
      blockers: card.blockers,
      warnings: card.warnings,
    })),
    blocked_reasons: blockedReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });
  const validation = {
    passed: blockedReasons.length === 0,
    failure_codes: blockedReasons,
    projection_fingerprint: projectionFingerprint,
    source_readback_shape_valid: Boolean(normalizedReadback),
    active_committed_receipt_present: Boolean(latestActive),
    latest_ledger_record_present: Boolean(latestRecord),
    source_fingerprints_present: latestSourceFingerprintsPresent(latestSummary),
    no_metric_write: true,
    no_next_work_bias_write: true,
    no_perspective_write: true,
    no_proof_or_evidence_write: true,
    no_work_mutation: true,
  } as const;

  return {
    projection_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_KIND,
    projection_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_VERSION,
    projection_readiness: readiness,
    projection_fingerprint: projectionFingerprint,
    scope,
    operator_view,
    source_readback_ref: sourceReadbackRef,
    source_receipt_ids: sourceReceiptIds,
    latest_active_committed_receipt_id: latestReceipt?.receipt_id ?? null,
    ledger_status_summary: ledgerStatusSummary,
    latest_ledger_record_summary: latestSummary,
    outcome_signal_summary: outcomeSignalSummary,
    expected_observed_signal_summary: expectedObservedSignalSummary,
    next_work_signal_candidates: cards,
    dogfood_loop_spine_alignment: {
      can_feed_workbench_dogfood_loop_spine_overview_read_model:
        readiness === "ready_for_workbench_loop_spine_preview",
      can_feed_dogfood_metric_snapshot_preview_read_model:
        readiness === "ready_for_workbench_loop_spine_preview",
      can_feed_next_work_signal_decision_preview_read_model:
        readiness === "ready_for_workbench_loop_spine_preview",
      blockers_before_any_write_or_mutation: [
        ...blockedReasons,
        "future_write_requires_separate_operator_authorization",
      ],
      read_only_alignment_note:
        "Manual global dogfood ledger readback is candidate input only; this projection does not write metrics, next-work bias, Perspective, proof/evidence, work, memory, or product state.",
    },
    blocked_reasons: blockedReasons,
    warning_reasons: warningReasons,
    required_future_authorization: requiredFutureAuthorization,
    authority_boundary: authorityBoundary,
    validation,
    next_recommended_slice:
      readiness === "ready_for_workbench_loop_spine_preview"
        ? "Define a separate operator-reviewed dogfood metric snapshot or next-work signal decision contract, still without automatic Perspective promotion."
        : "Create or restore an active committed manual global dogfood ledger receipt before preparing any loop-spine or next-work write contract.",
  };
}

export function getResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodWorkbenchProjectionAuthorityBoundary {
  return getProjectionAuthorityBoundary();
}

function isReadback(
  value: ResearchCandidateManualGlobalDogfoodLedgerReadback | null,
): value is ResearchCandidateManualGlobalDogfoodLedgerReadback {
  return (
    Boolean(value) &&
    value?.readback_kind ===
      "research_candidate_manual_global_dogfood_ledger_readback" &&
    value?.readback_version ===
      "research_candidate_manual_global_dogfood_ledger_readback.v0.1" &&
    Array.isArray(value.records_by_receipt)
  );
}

function limitRecords(
  records: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt[],
  limit?: number | null,
) {
  if (!limit) {
    return records;
  }
  return records.slice(0, Math.max(0, Math.min(limit, 100)));
}

function summarizeLedgerStatuses(
  recordsByReceipt: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt[],
) {
  const committedCount = recordsByReceipt.filter(
    (recordSet) => recordSet.receipt.ledger_write_status === "committed",
  ).length;
  const rolledBackCount = recordsByReceipt.filter(
    (recordSet) => recordSet.rolled_back,
  ).length;
  const supersededCount = recordsByReceipt.filter(
    (recordSet) => recordSet.superseded,
  ).length;
  const activeCommittedCount = recordsByReceipt.filter(
    (recordSet) =>
      recordSet.receipt.ledger_write_status === "committed" &&
      !recordSet.rolled_back &&
      !recordSet.superseded,
  ).length;

  return {
    total_receipts: recordsByReceipt.length,
    committed_count: committedCount,
    rolled_back_count: rolledBackCount,
    superseded_count: supersededCount,
    active_committed_count: activeCommittedCount,
    context_only_count: rolledBackCount + supersededCount,
  };
}

function summarizeLatestLedgerRecord(
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt | null,
  record: ResearchCandidateManualGlobalDogfoodLedgerRecord | null,
) {
  return {
    source_manual_receipt_id: receipt?.source_manual_receipt_id ?? null,
    source_contract_fingerprint: receipt?.source_contract_fingerprint ?? null,
    source_authorization_review_fingerprint:
      receipt?.source_authorization_review_fingerprint ?? null,
    source_handoff_seed_fingerprint:
      receipt?.source_handoff_seed_fingerprint ?? null,
    source_result_text_fingerprint:
      receipt?.source_result_text_fingerprint ?? null,
    source_expected_observed_delta_record_ref:
      receipt?.source_expected_observed_delta_record_ref ?? null,
    source_reuse_outcome_record_ref:
      receipt?.source_reuse_outcome_record_ref ?? null,
    outcome_label: record?.outcome_label ?? null,
    selected_candidate_context_refs:
      record?.selected_candidate_context_refs ?? [],
    selected_candidate_context_ref_count:
      record?.selected_candidate_context_refs.length ?? 0,
    expected_summary: record?.expected_summary ?? null,
    observed_summary: record?.observed_summary ?? null,
    mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
    source_line: record?.source_line ?? null,
    manual_only_context_refs: record?.manual_only_context_refs ?? [],
    warning_reasons: record?.warning_reasons ?? [],
    warning_reason_count: record?.warning_reasons.length ?? 0,
    compatibility_findings: record?.compatibility_findings ?? [],
    compatibility_finding_count: record?.compatibility_findings.length ?? 0,
  };
}

function determineBlockers({
  readback,
  latestActive,
  latestRecord,
  latestSummary,
}: {
  readback: ResearchCandidateManualGlobalDogfoodLedgerReadback | null;
  latestActive: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt | null;
  latestRecord: ResearchCandidateManualGlobalDogfoodLedgerRecord | null;
  latestSummary: ReturnType<typeof summarizeLatestLedgerRecord>;
}) {
  const blockers: string[] = [];
  if (!readback) {
    blockers.push("blocked_shape_mismatch");
    return blockers;
  }
  if (readback.records_by_receipt.length === 0) {
    blockers.push("blocked_no_global_dogfood_ledger_records");
    return blockers;
  }
  if (!latestActive) {
    blockers.push("blocked_no_active_committed_ledger_receipt");
    return blockers;
  }
  if (!latestRecord) {
    blockers.push("blocked_missing_ledger_record");
  }
  if (!latestSourceFingerprintsPresent(latestSummary)) {
    blockers.push("blocked_missing_source_fingerprints");
  }
  return uniqueStrings(blockers);
}

function determineReadiness(
  blockers: string[],
): ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionReadiness {
  if (blockers.includes("blocked_shape_mismatch")) {
    return "blocked_shape_mismatch";
  }
  if (blockers.includes("blocked_no_global_dogfood_ledger_records")) {
    return "blocked_no_global_dogfood_ledger_records";
  }
  if (blockers.includes("blocked_no_active_committed_ledger_receipt")) {
    return "blocked_no_active_committed_ledger_receipt";
  }
  if (blockers.includes("blocked_missing_ledger_record")) {
    return "blocked_missing_ledger_record";
  }
  if (blockers.includes("blocked_missing_source_fingerprints")) {
    return "blocked_missing_source_fingerprints";
  }
  return "ready_for_workbench_loop_spine_preview";
}

function latestSourceFingerprintsPresent(
  latestSummary: ReturnType<typeof summarizeLatestLedgerRecord>,
) {
  return Boolean(
    latestSummary.source_manual_receipt_id &&
      latestSummary.source_contract_fingerprint &&
      latestSummary.source_authorization_review_fingerprint &&
      latestSummary.source_handoff_seed_fingerprint &&
      latestSummary.source_result_text_fingerprint &&
      latestSummary.source_expected_observed_delta_record_ref &&
      latestSummary.source_reuse_outcome_record_ref,
  );
}

function buildOutcomeSignalSummary({
  recordsByReceipt,
  latestRecord,
}: {
  recordsByReceipt: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt[];
  latestRecord: ResearchCandidateManualGlobalDogfoodLedgerRecord | null;
}): ResearchCandidateManualGlobalDogfoodOutcomeSignalSummary {
  const counts = {
    helpful: 0,
    stale: 0,
    missing: 0,
    noisy: 0,
    misleading: 0,
    unknown: 0,
  };

  for (const recordSet of recordsByReceipt) {
    const outcome = normalizeOutcomeLabel(recordSet.ledger_record?.outcome_label);
    if (outcome) {
      counts[outcome] += 1;
    } else {
      counts.unknown += 1;
    }
  }

  const latestOutcome = latestRecord?.outcome_label ?? null;
  return {
    outcome_label_counts: counts,
    latest_active_outcome_label: latestOutcome,
    latest_active_outcome_is_helpful: latestOutcome === "helpful",
    latest_active_outcome_is_stale: latestOutcome === "stale",
    latest_active_outcome_is_missing: latestOutcome === "missing",
    latest_active_outcome_is_noisy: latestOutcome === "noisy",
    latest_active_outcome_is_misleading: latestOutcome === "misleading",
    latest_outcome_signal: classifyOutcomeSignal(latestOutcome),
    no_salience_update: true,
    no_metric_write: true,
  };
}

function buildExpectedObservedSignalSummary(
  latestRecord: ResearchCandidateManualGlobalDogfoodLedgerRecord | null,
): ResearchCandidateManualGlobalDogfoodExpectedObservedSignalSummary {
  const mismatch = latestRecord?.mismatch_or_gap_summary ?? null;
  const mismatchText = mismatch ?? "";
  return {
    expected_summary: latestRecord?.expected_summary ?? null,
    observed_summary: latestRecord?.observed_summary ?? null,
    mismatch_or_gap_summary: mismatch,
    observed_summary_present: Boolean(latestRecord?.observed_summary),
    mismatch_or_gap_implies_follow_up:
      mismatchText.length > 0 && !/^none$/i.test(mismatchText.trim()),
    no_perspective_promotion: true,
    no_proof_or_evidence: true,
  };
}

function buildNextWorkSignalCards({
  recordsByReceipt,
  latestActive,
  blockedReasons,
  warningReasons,
}: {
  recordsByReceipt: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt[];
  latestActive: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt | null;
  blockedReasons: string[];
  warningReasons: string[];
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalCard[] {
  const cards: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard[] = [];
  let blockedPrimaryReceiptId: string | null = null;
  if (latestActive?.ledger_record) {
    cards.push(
      buildCard({
        recordSet: latestActive,
        cardKind: "manual_global_dogfood_latest_outcome",
        cardStatus: "primary_next_work_candidate",
        label: buildOutcomeNextWorkLabel(latestActive.ledger_record.outcome_label),
        rationale:
          "Latest active committed manual global dogfood ledger record can inform a future operator-reviewed next-work signal preview.",
        blockers: [],
        warnings: warningReasons,
      }),
      buildCard({
        recordSet: latestActive,
        cardKind: "manual_global_dogfood_expected_observed_delta",
        cardStatus: "primary_next_work_candidate",
        label: "Review manual ExpectedObservedDelta follow-up signal",
        rationale:
          "The active ledger record preserves expected, observed, and mismatch/gap summaries for read-only follow-up review.",
        blockers: [],
        warnings: latestActive.ledger_record.warning_reasons,
      }),
    );
  } else if (recordsByReceipt.length > 0) {
    const first = recordsByReceipt[0];
    blockedPrimaryReceiptId = first.receipt.receipt_id;
    cards.push(
      buildCard({
        recordSet: first,
        cardKind:
          first.receipt.ledger_write_status === "rolled_back"
            ? "manual_global_dogfood_context_only_rolled_back"
            : "manual_global_dogfood_context_only_superseded",
        cardStatus: "blocked",
        label: "Restore an active committed manual ledger receipt",
        rationale:
          "No active committed manual global dogfood ledger receipt is available for primary next-work candidate material.",
        blockers: blockedReasons,
        warnings: first.ledger_record?.warning_reasons ?? [],
      }),
    );
  }

  for (const recordSet of recordsByReceipt) {
    if (
      latestActive?.receipt.receipt_id === recordSet.receipt.receipt_id ||
      blockedPrimaryReceiptId === recordSet.receipt.receipt_id ||
      (!recordSet.rolled_back && !recordSet.superseded)
    ) {
      continue;
    }
    cards.push(
      buildCard({
        recordSet,
        cardKind: recordSet.rolled_back
          ? "manual_global_dogfood_context_only_rolled_back"
          : "manual_global_dogfood_context_only_superseded",
        cardStatus: "context_only",
        label: recordSet.rolled_back
          ? "Keep rolled back manual ledger receipt as context only"
          : "Keep superseded manual ledger receipt as context only",
        rationale:
          "Rolled back and superseded manual ledger receipts remain inspectable but cannot be primary next-work candidates.",
        blockers: [],
        warnings: recordSet.ledger_record?.warning_reasons ?? [],
      }),
    );
  }

  return cards;
}

function buildCard({
  recordSet,
  cardKind,
  cardStatus,
  label,
  rationale,
  blockers,
  warnings,
}: {
  recordSet: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt;
  cardKind: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard["card_kind"];
  cardStatus: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard["card_status"];
  label: string;
  rationale: string;
  blockers: string[];
  warnings: string[];
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalCard {
  const receipt = recordSet.receipt;
  const ledgerRecord = recordSet.ledger_record;
  const cardId = `manual-global-dogfood-workbench-card:${fingerprint({
    cardKind,
    receipt_id: receipt.receipt_id,
    record_id: ledgerRecord?.ledger_record_id ?? null,
  })}`;

  return {
    card_id: cardId,
    card_kind: cardKind,
    card_status: cardStatus,
    source_receipt_id: receipt.receipt_id,
    source_record_id: ledgerRecord?.ledger_record_id ?? null,
    source_fingerprints: {
      source_contract_fingerprint: receipt.source_contract_fingerprint,
      source_authorization_review_fingerprint:
        receipt.source_authorization_review_fingerprint,
      source_handoff_seed_fingerprint: receipt.source_handoff_seed_fingerprint,
      source_result_text_fingerprint: receipt.source_result_text_fingerprint,
      source_expected_observed_delta_record_ref:
        receipt.source_expected_observed_delta_record_ref,
      source_reuse_outcome_record_ref: receipt.source_reuse_outcome_record_ref,
    },
    recommended_next_work_label: label,
    rationale,
    blockers: uniqueStrings(blockers),
    warnings: uniqueStrings(warnings),
    would_write_next_work_bias: false,
    would_write_perspective: false,
    would_write_metrics: false,
  };
}

function buildOutcomeNextWorkLabel(outcomeLabel: string) {
  switch (outcomeLabel) {
    case "helpful":
      return "Review helpful manual dogfood outcome for candidate continuity";
    case "stale":
      return "Review stale context signal before next-work planning";
    case "missing":
      return "Review missing context signal before next-work planning";
    case "noisy":
      return "Review noisy context signal before next-work planning";
    case "misleading":
      return "Review misleading context signal before next-work planning";
    default:
      return "Review manual dogfood outcome before next-work planning";
  }
}

function normalizeOutcomeLabel(value: string | null | undefined): OutcomeLabel | null {
  return OUTCOME_LABELS.includes(value as OutcomeLabel)
    ? (value as OutcomeLabel)
    : null;
}

function classifyOutcomeSignal(
  outcomeLabel: string | null,
): ResearchCandidateManualGlobalDogfoodOutcomeSignal {
  if (outcomeLabel === "helpful") {
    return "positive";
  }
  if (normalizeOutcomeLabel(outcomeLabel)) {
    return "negative";
  }
  return "ambiguous";
}

function buildSourceReadbackRef({
  readback,
  sourceReceiptIds,
}: {
  readback: ResearchCandidateManualGlobalDogfoodLedgerReadback | null;
  sourceReceiptIds: string[];
}) {
  return `manual-global-dogfood-ledger-readback:${fingerprint({
    readback_kind: readback?.readback_kind ?? "missing",
    readback_version: readback?.readback_version ?? "missing",
    scope: readback?.scope ?? DEFAULT_SCOPE,
    count: readback?.count ?? 0,
    source_receipt_ids: sourceReceiptIds,
    latest_active_committed_receipt_id:
      readback?.latest_active_committed?.receipt.receipt_id ?? null,
  })}`;
}

function getProjectionAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodWorkbenchProjectionAuthorityBoundary {
  return {
    read_only: true,
    preview_only: true,
    source_of_truth: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_ledger: false,
    can_mutate_manual_global_dogfood_ledger: false,
    can_write_next_work_bias: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_proof_or_evidence: false,
    can_mutate_work: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  ).sort();
}

function fingerprint(value: unknown) {
  return `${FINGERPRINT_ALGORITHM}:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
