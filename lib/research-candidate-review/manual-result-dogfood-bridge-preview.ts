import type {
  ResearchCandidateManualExpectedObservedDeltaRecord,
  ResearchCandidateManualResultReadback,
  ResearchCandidateManualResultRecordsByReceipt,
  ResearchCandidateManualReuseOutcomeRecord,
} from "@/types/research-candidate-manual-result-authorized-record-write";
import type {
  ResearchCandidateManualResultDogfoodBridgeAuthorityBoundary,
  ResearchCandidateManualResultDogfoodBridgeCard,
  ResearchCandidateManualResultDogfoodBridgeOutcomeLabel,
  ResearchCandidateManualResultDogfoodBridgePreview,
  ResearchCandidateManualResultDogfoodBridgePreviewInput,
  ResearchCandidateManualResultDogfoodBridgeReadiness,
} from "@/types/research-candidate-manual-result-dogfood-bridge-preview";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_KIND,
  RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_VERSION,
} from "@/types/research-candidate-manual-result-dogfood-bridge-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_VIEW = "manual_result_dogfood_bridge_alignment_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const OUTCOME_LABELS = [
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
  "not_reported",
] as const;

export function buildResearchCandidateManualResultDogfoodBridgePreview({
  readback,
  limit = 25,
  scope,
  operator_view,
}: ResearchCandidateManualResultDogfoodBridgePreviewInput): ResearchCandidateManualResultDogfoodBridgePreview {
  const normalizedReadback = normalizeReadback(readback, scope ?? DEFAULT_SCOPE);
  const previewScope = scope ?? normalizedReadback.scope ?? DEFAULT_SCOPE;
  const records = normalizedReadback.records_by_receipt.slice(
    0,
    Math.max(0, Math.min(limit, 100)),
  );
  const sourceReceiptIds = records.map((recordSet) => recordSet.receipt.receipt_id);
  const latestCommitted = records.find(isActiveCommittedReceipt) ?? null;
  const latestCommittedEod =
    latestCommitted?.expected_observed_delta_record ?? null;
  const latestCommittedReuse = latestCommitted?.reuse_outcome_record ?? null;
  const latestEod =
    latestCommittedEod ??
    records.find((recordSet) => recordSet.expected_observed_delta_record)
      ?.expected_observed_delta_record ??
    null;
  const latestReuse =
    latestCommittedReuse ??
    records.find((recordSet) => recordSet.reuse_outcome_record)
      ?.reuse_outcome_record ??
    null;
  const receiptStatusSummary = summarizeReceiptStatuses(records);
  const eodAlignment = buildExpectedObservedDeltaAlignment({
    records,
    latestCommitted,
    latestEod,
    latestCommittedEod,
  });
  const reuseAlignment = buildReuseOutcomeAlignment({
    records,
    latestCommitted,
    latestReuse,
    latestCommittedReuse,
  });
  const candidateBridgeCards = buildCandidateBridgeCards({
    records,
    latestCommitted,
    latestCommittedEod,
    latestCommittedReuse,
  });
  const readiness = determineReadiness({
    records,
    latestCommitted,
    latestCommittedEod,
    latestCommittedReuse,
    eodBlockers: eodAlignment.blockers,
    reuseBlockers: reuseAlignment.blockers,
  });
  const warningReasons = uniqueStrings([
    ...buildWarningReasons({
      records,
      latestCommittedEod,
      latestCommittedReuse,
    }),
    ...Object.entries(reuseAlignment.warning_reason_counts).map(
      ([reason, count]) => `reuse_warning:${reason}:${count}`,
    ),
  ]);
  const blockedReasons = buildBlockedReasons({
    readiness,
    eodBlockers: eodAlignment.blockers,
    reuseBlockers: reuseAlignment.blockers,
  });
  const authorityBoundary =
    createResearchCandidateManualResultDogfoodBridgeAuthorityBoundary();
  const sourceReadbackRef = `manual-result-readback:${fingerprint({
    readback_version: normalizedReadback.readback_version,
    scope: previewScope,
    source_receipt_ids: sourceReceiptIds,
  })}`;
  const previewFingerprint = fingerprint({
    preview_kind: RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_KIND,
    preview_version: RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_VERSION,
    scope: previewScope,
    source_readback_ref: sourceReadbackRef,
    source_receipt_ids: sourceReceiptIds,
    latest_committed_receipt_id: latestCommitted?.receipt.receipt_id ?? null,
    receipt_status_summary: receiptStatusSummary,
    expected_observed_delta_alignment: eodAlignment,
    reuse_outcome_alignment: reuseAlignment,
    dogfood_bridge_readiness: readiness,
    candidate_bridge_cards: candidateBridgeCards,
    blocked_reasons: blockedReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    preview_kind: RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_KIND,
    preview_version: RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_VERSION,
    scope: previewScope,
    operator_view_label: normalizeOperatorView(operator_view),
    source_readback_ref: sourceReadbackRef,
    source_receipt_ids: sourceReceiptIds,
    latest_committed_receipt_id: latestCommitted?.receipt.receipt_id ?? null,
    receipt_status_summary: receiptStatusSummary,
    expected_observed_delta_alignment: eodAlignment,
    reuse_outcome_alignment: reuseAlignment,
    dogfood_bridge_readiness: readiness,
    candidate_bridge_cards: candidateBridgeCards,
    blocked_reasons: blockedReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "operator_reviewed_manual_result_bridge_candidate_selection",
      "explicit_global_dogfood_ledger_write_contract",
      "explicit_dogfood_metric_write_contract",
      "explicit_expected_observed_delta_global_record_contract",
      "explicit_reuse_outcome_global_record_contract",
      "separate_no_raw_text_persistence_review",
    ],
    authority_boundary: authorityBoundary,
    validation: {
      passed:
        normalizedReadback.readback_kind ===
          "research_candidate_manual_result_records_readback" &&
        normalizedReadback.raw_manual_note_text_present === false &&
        normalizedReadback.raw_result_report_text_present === false &&
        normalizedReadback.proof_or_evidence_rows_written === false &&
        normalizedReadback.work_or_perspective_rows_written === false &&
        authorityBoundary.writes_global_dogfood_ledger === false &&
        authorityBoundary.writes_dogfood_metrics === false,
      preview_fingerprint: previewFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      readback_is_manual_result_records:
        normalizedReadback.readback_kind ===
        "research_candidate_manual_result_records_readback",
      raw_manual_note_text_absent:
        normalizedReadback.raw_manual_note_text_present === false,
      raw_result_report_text_absent:
        normalizedReadback.raw_result_report_text_present === false,
      no_proof_evidence_work_or_perspective_rows_written:
        normalizedReadback.proof_or_evidence_rows_written === false &&
        normalizedReadback.work_or_perspective_rows_written === false,
      latest_committed_receipt_selected: Boolean(latestCommitted),
      no_global_dogfood_or_metric_write_authority:
        authorityBoundary.writes_global_dogfood_ledger === false &&
        authorityBoundary.writes_dogfood_metrics === false &&
        normalizedReadback.authority_boundary.can_update_global_dogfood_metrics ===
          false &&
        records.every((recordSet) =>
          recordSet.reuse_outcome_record
            ? recordSet.reuse_outcome_record.writes_ledger === false
            : true,
        ),
      blocker_count: blockedReasons.length,
      warning_count: warningReasons.length,
    },
    next_recommended_slice:
      "Review selected manual bridge candidates with an explicit operator bridge-review contract before any future global dogfood ledger, metrics, Perspective, proof/evidence, work-status, or memory integration.",
  };
}

export function createResearchCandidateManualResultDogfoodBridgeAuthorityBoundary(): ResearchCandidateManualResultDogfoodBridgeAuthorityBoundary {
  return {
    read_only: true,
    preview_only: true,
    source_of_truth: false,
    writes_global_dogfood_ledger: false,
    writes_dogfood_metrics: false,
    writes_expected_observed_delta_global_record: false,
    writes_reuse_outcome_global_record: false,
    writes_perspective: false,
    writes_perspective_memory: false,
    writes_proof_or_evidence: false,
    mutates_work: false,
    can_call_provider_or_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
  };
}

function normalizeReadback(
  readback: unknown,
  scope: ResearchCandidateReviewScope,
): ResearchCandidateManualResultReadback {
  if (
    readback &&
    typeof readback === "object" &&
    !Array.isArray(readback) &&
    "records_by_receipt" in readback &&
    Array.isArray((readback as ResearchCandidateManualResultReadback).records_by_receipt)
  ) {
    return readback as ResearchCandidateManualResultReadback;
  }

  return {
    readback_kind: "research_candidate_manual_result_records_readback",
    readback_version: "research_candidate_manual_result_records_readback.v0.1",
    scope,
    records_by_receipt: [],
    latest_receipts: [],
    count: 0,
    authority_boundary: {
      can_write_manual_expected_observed_delta_record: true,
      can_write_manual_reuse_outcome_record: true,
      can_write_manual_result_write_receipt: true,
      can_write_manual_result_rollback_metadata: true,
      source_of_truth: false,
      can_write_proof_or_evidence: false,
      can_create_evidence: false,
      can_record_proof: false,
      can_create_or_update_work_item: false,
      can_mutate_work_status: false,
      can_write_work_event: false,
      can_commit_or_reject_state: false,
      can_promote_perspective: false,
      can_mutate_perspective_state: false,
      can_write_perspective_memory: false,
      can_update_global_dogfood_metrics: false,
      can_execute_codex: false,
      can_call_github: false,
      can_call_providers_or_openai: false,
      can_fetch_sources: false,
      can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
      can_send_external_handoff: false,
      can_allocate_product_ids: false,
      can_execute_product_write: false,
      persists_raw_manual_note_text: false,
      persists_raw_result_report_text: false,
      persists_operator_notes: false,
    },
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    proof_or_evidence_rows_written: false,
    work_or_perspective_rows_written: false,
  };
}

function summarizeReceiptStatuses(records: ResearchCandidateManualResultRecordsByReceipt[]) {
  return {
    total_receipts: records.length,
    committed_count: records.filter(
      (recordSet) => receiptStatus(recordSet) === "committed",
    ).length,
    superseded_count: records.filter(
      (recordSet) => receiptStatus(recordSet) === "superseded",
    ).length,
    rolled_back_count: records.filter(
      (recordSet) => receiptStatus(recordSet) === "rolled_back",
    ).length,
    duplicate_replayed_count: records.filter(
      (recordSet) => receiptStatus(recordSet) === "duplicate_replayed",
    ).length,
    active_committed_count: records.filter(isActiveCommittedReceipt).length,
    context_only_receipt_count: records.filter((recordSet) =>
      isContextOnlyReceipt(recordSet),
    ).length,
  };
}

function buildExpectedObservedDeltaAlignment({
  records,
  latestCommitted,
  latestEod,
  latestCommittedEod,
}: {
  records: ResearchCandidateManualResultRecordsByReceipt[];
  latestCommitted: ResearchCandidateManualResultRecordsByReceipt | null;
  latestEod: ResearchCandidateManualExpectedObservedDeltaRecord | null;
  latestCommittedEod: ResearchCandidateManualExpectedObservedDeltaRecord | null;
}) {
  const blockers = uniqueStrings([
    ...(records.length === 0 ? ["manual_result_records_missing"] : []),
    ...(!latestCommitted ? ["latest_committed_receipt_missing"] : []),
    ...(!latestCommittedEod
      ? ["latest_committed_expected_observed_delta_record_missing"]
      : []),
    ...(latestCommittedEod &&
    !hasText(latestCommittedEod.observed_summary)
      ? ["observed_summary_missing"]
      : []),
    ...(latestCommittedEod &&
    !hasText(latestCommittedEod.source_handoff_seed_fingerprint)
      ? ["source_handoff_seed_fingerprint_missing"]
      : []),
    ...(latestCommittedEod &&
    !hasText(latestCommittedEod.source_result_text_fingerprint)
      ? ["source_result_text_fingerprint_missing"]
      : []),
  ]);

  return {
    total_manual_expected_observed_delta_records: records.filter(
      (recordSet) => recordSet.expected_observed_delta_record,
    ).length,
    committed_count: records.filter(
      (recordSet) =>
        receiptStatus(recordSet) === "committed" &&
        recordSet.expected_observed_delta_record,
    ).length,
    superseded_count: records.filter(
      (recordSet) =>
        receiptStatus(recordSet) === "superseded" &&
        recordSet.expected_observed_delta_record,
    ).length,
    rolled_back_count: records.filter(
      (recordSet) =>
        receiptStatus(recordSet) === "rolled_back" &&
        recordSet.expected_observed_delta_record,
    ).length,
    latest_expected_summary: latestEod?.expected_summary ?? null,
    latest_observed_summary: latestEod?.observed_summary ?? null,
    latest_mismatch_or_gap_summary: latestEod?.mismatch_or_gap_summary ?? null,
    observed_summary_present: hasText(latestCommittedEod?.observed_summary),
    source_handoff_seed_fingerprint_present: hasText(
      latestCommittedEod?.source_handoff_seed_fingerprint,
    ),
    source_result_text_fingerprint_present: hasText(
      latestCommittedEod?.source_result_text_fingerprint,
    ),
    can_become_broader_expected_observed_delta_bridge_candidate:
      blockers.length === 0,
    blockers,
  };
}

function buildReuseOutcomeAlignment({
  records,
  latestCommitted,
  latestReuse,
  latestCommittedReuse,
}: {
  records: ResearchCandidateManualResultRecordsByReceipt[];
  latestCommitted: ResearchCandidateManualResultRecordsByReceipt | null;
  latestReuse: ResearchCandidateManualReuseOutcomeRecord | null;
  latestCommittedReuse: ResearchCandidateManualReuseOutcomeRecord | null;
}) {
  const outcomeLabelCounts = createOutcomeLabelCounts();
  for (const recordSet of records) {
    if (recordSet.reuse_outcome_record) {
      outcomeLabelCounts[
        normalizeOutcomeLabel(recordSet.reuse_outcome_record.outcome_label)
      ] += 1;
    }
  }
  const warningReasonCounts: Record<string, number> = {};
  for (const warningReason of records.flatMap(
    (recordSet) => recordSet.reuse_outcome_record?.warning_reasons ?? [],
  )) {
    warningReasonCounts[warningReason] = (warningReasonCounts[warningReason] ?? 0) + 1;
  }

  const latestOutcomeLabel = normalizeOutcomeLabel(latestReuse?.outcome_label);
  const selectedCandidateContextRefCount =
    latestCommittedReuse?.selected_candidate_context_refs.length ?? 0;
  const blockers = uniqueStrings([
    ...(records.length === 0 ? ["manual_result_records_missing"] : []),
    ...(!latestCommitted ? ["latest_committed_receipt_missing"] : []),
    ...(!latestCommittedReuse
      ? ["latest_committed_reuse_outcome_record_missing"]
      : []),
    ...(latestCommittedReuse && latestOutcomeLabel === "not_reported"
      ? ["reuse_outcome_label_not_reported"]
      : []),
    ...(latestCommittedReuse &&
    selectedCandidateContextRefCount === 0
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(latestCommittedReuse && !hasText(latestCommittedReuse.source_line)
      ? ["reuse_outcome_source_line_missing"]
      : []),
    ...(latestCommittedReuse &&
    !hasText(latestCommittedReuse.source_handoff_seed_fingerprint)
      ? ["reuse_outcome_source_handoff_seed_fingerprint_missing"]
      : []),
    ...(latestCommittedReuse &&
    !hasText(latestCommittedReuse.source_result_text_fingerprint)
      ? ["reuse_outcome_source_result_text_fingerprint_missing"]
      : []),
  ]);

  return {
    total_manual_reuse_outcome_records: records.filter(
      (recordSet) => recordSet.reuse_outcome_record,
    ).length,
    committed_count: records.filter(
      (recordSet) =>
        receiptStatus(recordSet) === "committed" &&
        recordSet.reuse_outcome_record,
    ).length,
    superseded_count: records.filter(
      (recordSet) =>
        receiptStatus(recordSet) === "superseded" &&
        recordSet.reuse_outcome_record,
    ).length,
    rolled_back_count: records.filter(
      (recordSet) =>
        receiptStatus(recordSet) === "rolled_back" &&
        recordSet.reuse_outcome_record,
    ).length,
    outcome_label_counts: outcomeLabelCounts,
    latest_outcome_label: latestOutcomeLabel,
    selected_candidate_context_ref_count: selectedCandidateContextRefCount,
    total_selected_candidate_context_ref_count: records.reduce(
      (sum, recordSet) =>
        sum +
        (recordSet.reuse_outcome_record?.selected_candidate_context_refs.length ?? 0),
      0,
    ),
    source_line_present: hasText(latestCommittedReuse?.source_line),
    warning_reason_counts: warningReasonCounts,
    can_become_broader_reuse_outcome_bridge_candidate: blockers.length === 0,
    blockers,
  };
}

function buildCandidateBridgeCards({
  records,
  latestCommitted,
  latestCommittedEod,
  latestCommittedReuse,
}: {
  records: ResearchCandidateManualResultRecordsByReceipt[];
  latestCommitted: ResearchCandidateManualResultRecordsByReceipt | null;
  latestCommittedEod: ResearchCandidateManualExpectedObservedDeltaRecord | null;
  latestCommittedReuse: ResearchCandidateManualReuseOutcomeRecord | null;
}): ResearchCandidateManualResultDogfoodBridgeCard[] {
  const cards: ResearchCandidateManualResultDogfoodBridgeCard[] = [];

  if (latestCommitted && latestCommittedEod) {
    cards.push(eodCard(latestCommitted, latestCommittedEod, "primary_candidate"));
  }
  if (latestCommitted && latestCommittedReuse) {
    cards.push(reuseCard(latestCommitted, latestCommittedReuse, "primary_candidate"));
  }

  for (const recordSet of records) {
    if (!isContextOnlyReceipt(recordSet)) continue;
    if (recordSet.expected_observed_delta_record) {
      cards.push(
        eodCard(
          recordSet,
          recordSet.expected_observed_delta_record,
          "context_only",
        ),
      );
    }
    if (recordSet.reuse_outcome_record) {
      cards.push(
        reuseCard(recordSet, recordSet.reuse_outcome_record, "context_only"),
      );
    }
    if (
      !recordSet.expected_observed_delta_record &&
      !recordSet.reuse_outcome_record
    ) {
      cards.push(receiptContextCard(recordSet));
    }
  }

  return cards;
}

function eodCard(
  recordSet: ResearchCandidateManualResultRecordsByReceipt,
  record: ResearchCandidateManualExpectedObservedDeltaRecord,
  cardStatus: ResearchCandidateManualResultDogfoodBridgeCard["card_status"],
): ResearchCandidateManualResultDogfoodBridgeCard {
  const cardKind =
    cardStatus === "primary_candidate"
      ? "latest_committed_expected_observed_delta"
      : "context_only_expected_observed_delta";
  const blockers = uniqueStrings([
    ...(!hasText(record.observed_summary) ? ["observed_summary_missing"] : []),
    ...(!hasText(record.source_handoff_seed_fingerprint)
      ? ["source_handoff_seed_fingerprint_missing"]
      : []),
    ...(!hasText(record.source_result_text_fingerprint)
      ? ["source_result_text_fingerprint_missing"]
      : []),
  ]);
  return {
    card_id: `manual-result-dogfood-card:${fingerprint({
      card_kind: cardKind,
      receipt_id: record.receipt_id,
      record_id: record.record_id,
    })}`,
    card_kind: cardKind,
    card_status: cardStatus,
    receipt_id: record.receipt_id,
    receipt_status: recordSet.receipt.write_status,
    created_at: record.created_at,
    record_id: record.record_id,
    record_fingerprint: record.record_fingerprint,
    summary: record.mismatch_or_gap_summary || record.expected_summary,
    source_handoff_seed_fingerprint: record.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: record.source_result_text_fingerprint,
    source_refs: record.source_refs,
    selected_candidate_context_refs: [],
    outcome_label: null,
    writes_ledger: false,
    blockers,
    warning_reasons: isContextOnlyReceipt(recordSet)
      ? [`context_only_receipt_status:${recordSet.receipt.write_status}`]
      : [],
  };
}

function reuseCard(
  recordSet: ResearchCandidateManualResultRecordsByReceipt,
  record: ResearchCandidateManualReuseOutcomeRecord,
  cardStatus: ResearchCandidateManualResultDogfoodBridgeCard["card_status"],
): ResearchCandidateManualResultDogfoodBridgeCard {
  const cardKind =
    cardStatus === "primary_candidate"
      ? "latest_committed_reuse_outcome"
      : "context_only_reuse_outcome";
  const outcomeLabel = normalizeOutcomeLabel(record.outcome_label);
  const blockers = uniqueStrings([
    ...(outcomeLabel === "not_reported" ? ["reuse_outcome_label_not_reported"] : []),
    ...(record.selected_candidate_context_refs.length === 0
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!hasText(record.source_line) ? ["reuse_outcome_source_line_missing"] : []),
    ...(!hasText(record.source_handoff_seed_fingerprint)
      ? ["reuse_outcome_source_handoff_seed_fingerprint_missing"]
      : []),
    ...(!hasText(record.source_result_text_fingerprint)
      ? ["reuse_outcome_source_result_text_fingerprint_missing"]
      : []),
  ]);
  return {
    card_id: `manual-result-dogfood-card:${fingerprint({
      card_kind: cardKind,
      receipt_id: record.receipt_id,
      record_id: record.record_id,
    })}`,
    card_kind: cardKind,
    card_status: cardStatus,
    receipt_id: record.receipt_id,
    receipt_status: recordSet.receipt.write_status,
    created_at: record.created_at,
    record_id: record.record_id,
    record_fingerprint: record.record_fingerprint,
    summary: record.source_line ?? `Reuse outcome label: ${outcomeLabel}`,
    source_handoff_seed_fingerprint: record.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: record.source_result_text_fingerprint,
    source_refs: [],
    selected_candidate_context_refs: record.selected_candidate_context_refs,
    outcome_label: outcomeLabel,
    writes_ledger: false,
    blockers,
    warning_reasons: uniqueStrings([
      ...record.warning_reasons,
      ...(isContextOnlyReceipt(recordSet)
        ? [`context_only_receipt_status:${recordSet.receipt.write_status}`]
        : []),
      ...(outcomeLabel !== record.outcome_label
        ? [`unsupported_reuse_outcome_label:${record.outcome_label}`]
        : []),
    ]),
  };
}

function receiptContextCard(
  recordSet: ResearchCandidateManualResultRecordsByReceipt,
): ResearchCandidateManualResultDogfoodBridgeCard {
  return {
    card_id: `manual-result-dogfood-card:${fingerprint({
      card_kind: "context_only_receipt",
      receipt_id: recordSet.receipt.receipt_id,
    })}`,
    card_kind: "context_only_receipt",
    card_status: "context_only",
    receipt_id: recordSet.receipt.receipt_id,
    receipt_status: recordSet.receipt.write_status,
    created_at: recordSet.receipt.created_at,
    record_id: null,
    record_fingerprint: null,
    summary: `Receipt ${recordSet.receipt.write_status} without a bridgeable record.`,
    source_handoff_seed_fingerprint:
      recordSet.receipt.source_handoff_seed_fingerprint,
    source_result_text_fingerprint:
      recordSet.receipt.source_result_intake_fingerprint,
    source_refs: [],
    selected_candidate_context_refs: [],
    outcome_label: null,
    writes_ledger: false,
    blockers: ["bridgeable_record_missing"],
    warning_reasons: [`context_only_receipt_status:${recordSet.receipt.write_status}`],
  };
}

function determineReadiness({
  records,
  latestCommitted,
  latestCommittedEod,
  latestCommittedReuse,
  eodBlockers,
  reuseBlockers,
}: {
  records: ResearchCandidateManualResultRecordsByReceipt[];
  latestCommitted: ResearchCandidateManualResultRecordsByReceipt | null;
  latestCommittedEod: ResearchCandidateManualExpectedObservedDeltaRecord | null;
  latestCommittedReuse: ResearchCandidateManualReuseOutcomeRecord | null;
  eodBlockers: string[];
  reuseBlockers: string[];
}): ResearchCandidateManualResultDogfoodBridgeReadiness {
  if (records.length === 0) return "blocked_no_manual_result_records";
  if (!latestCommitted) {
    return records.every(isContextOnlyReceipt)
      ? "blocked_only_rolled_back_or_superseded_records"
      : "blocked_no_committed_receipt";
  }
  if (!latestCommittedEod) return "blocked_missing_expected_observed_delta";
  if (!latestCommittedReuse) return "blocked_missing_reuse_outcome";
  if (
    eodBlockers.some((reason) => !isReceiptPresenceBlocker(reason)) ||
    reuseBlockers.some((reason) => !isReceiptPresenceBlocker(reason))
  ) {
    return "blocked_shape_mismatch";
  }
  return "ready_for_operator_bridge_review";
}

function buildBlockedReasons({
  readiness,
  eodBlockers,
  reuseBlockers,
}: {
  readiness: ResearchCandidateManualResultDogfoodBridgeReadiness;
  eodBlockers: string[];
  reuseBlockers: string[];
}) {
  if (readiness === "ready_for_operator_bridge_review") return [];
  return uniqueStrings([readiness, ...eodBlockers, ...reuseBlockers]);
}

function buildWarningReasons({
  records,
  latestCommittedEod,
  latestCommittedReuse,
}: {
  records: ResearchCandidateManualResultRecordsByReceipt[];
  latestCommittedEod: ResearchCandidateManualExpectedObservedDeltaRecord | null;
  latestCommittedReuse: ResearchCandidateManualReuseOutcomeRecord | null;
}) {
  return uniqueStrings([
    ...(records.some(isContextOnlyReceipt)
      ? ["rolled_back_or_superseded_manual_receipts_present_context_only"]
      : []),
    ...(latestCommittedEod && latestCommittedEod.source_refs.length === 0
      ? ["expected_observed_delta_source_refs_missing"]
      : []),
    ...(latestCommittedReuse?.warning_reasons ?? []),
    ...records.flatMap((recordSet) => {
      const label = recordSet.reuse_outcome_record?.outcome_label;
      return label && normalizeOutcomeLabel(label) !== label
        ? [`unsupported_reuse_outcome_label:${label}`]
        : [];
    }),
  ]);
}

function isActiveCommittedReceipt(
  recordSet: ResearchCandidateManualResultRecordsByReceipt,
) {
  return (
    receiptStatus(recordSet) === "committed" &&
    recordSet.superseded === false &&
    recordSet.rolled_back === false
  );
}

function isContextOnlyReceipt(
  recordSet: ResearchCandidateManualResultRecordsByReceipt,
) {
  return (
    receiptStatus(recordSet) === "superseded" ||
    receiptStatus(recordSet) === "rolled_back" ||
    recordSet.superseded === true ||
    recordSet.rolled_back === true
  );
}

function receiptStatus(recordSet: ResearchCandidateManualResultRecordsByReceipt) {
  return recordSet.receipt.write_status as ResearchCandidateManualResultDogfoodBridgeCard["receipt_status"];
}

function isReceiptPresenceBlocker(reason: string) {
  return (
    reason === "manual_result_records_missing" ||
    reason === "latest_committed_receipt_missing" ||
    reason === "latest_committed_expected_observed_delta_record_missing" ||
    reason === "latest_committed_reuse_outcome_record_missing"
  );
}

function createOutcomeLabelCounts() {
  return OUTCOME_LABELS.reduce(
    (counts, label) => ({ ...counts, [label]: 0 }),
    {} as Record<ResearchCandidateManualResultDogfoodBridgeOutcomeLabel, number>,
  );
}

function normalizeOutcomeLabel(
  value: string | null | undefined,
): ResearchCandidateManualResultDogfoodBridgeOutcomeLabel {
  return OUTCOME_LABELS.includes(
    value as ResearchCandidateManualResultDogfoodBridgeOutcomeLabel,
  )
    ? (value as ResearchCandidateManualResultDogfoodBridgeOutcomeLabel)
    : "not_reported";
}

function normalizeOperatorView(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return DEFAULT_OPERATOR_VIEW;
  return normalized.slice(0, 120);
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function fingerprint(value: unknown) {
  return `fnv1a32:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
