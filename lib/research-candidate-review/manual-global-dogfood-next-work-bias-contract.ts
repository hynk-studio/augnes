import type {
  ResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkBiasCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodNextWorkBiasContract,
  ResearchCandidateManualGlobalDogfoodNextWorkBiasContractInput,
  ResearchCandidateManualGlobalDogfoodNextWorkBiasNonWriteConfirmation,
} from "@/types/research-candidate-manual-global-dogfood-next-work-bias-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-next-work-bias-contract";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_next_work_bias_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "next_work_bias_write_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
}: ResearchCandidateManualGlobalDogfoodNextWorkBiasContractInput): ResearchCandidateManualGlobalDogfoodNextWorkBiasContract {
  const sourceReadback = normalizeReadback(readback);
  const active = sourceReadback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.next_work_signal_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-next-work-signal-readback:${sourceReadback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    readbackPreservesNoBiasWorkPerspectiveWrites(sourceReadback);
  const selectedContextPresent =
    (record?.selected_candidate_context_refs.length ?? 0) > 0;
  const candidateCardIdsPresent =
    (record?.source_next_work_candidate_card_ids.length ?? 0) > 0;
  const recommendedLabelPresent =
    Boolean(record?.recommended_next_work_label?.trim());
  const blockerReasons = uniqueStrings([
    ...(!active ? ["blocked_no_active_committed_next_work_signal_receipt"] : []),
    ...(!record ? ["blocked_missing_next_work_signal_record"] : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...(!recommendedLabelPresent
      ? ["recommended_next_work_label_missing"]
      : []),
    ...(!selectedContextPresent
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!candidateCardIdsPresent
      ? ["source_next_work_candidate_card_ids_missing"]
      : []),
    ...(!sourceReadbackNoForbiddenWrites
      ? ["source_readback_has_forbidden_bias_work_perspective_or_metric_write"]
      : []),
  ]);
  const operatorAuthorizationMode =
    blockerReasons.length === 0
      ? "ready_for_future_next_work_bias_write_authorization"
      : "blocked_before_next_work_bias_authorization";
  const candidateReady =
    operatorAuthorizationMode ===
    "ready_for_future_next_work_bias_write_authorization";
  const warningReasons = uniqueStrings([
    ...(record?.warnings ?? []),
    ...(record?.outcome_signal === "ambiguous"
      ? ["next_work_bias_outcome_signal_ambiguous"]
      : []),
    "next_work_bias_contract_preview_only_no_bias_write",
  ]);
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorityBoundary();
  const nonWriteConfirmation = createNextWorkBiasNonWriteConfirmation();
  const idempotencyKey = `manual-global-dogfood-next-work-bias-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_VERSION,
    source_next_work_signal_receipt_id: receipt?.receipt_id ?? null,
    source_next_work_signal_record_id:
      record?.next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      record?.next_work_signal_record_fingerprint ?? null,
    source_projection_fingerprint: receipt?.source_projection_fingerprint ?? null,
    source_global_dogfood_ledger_receipt_id:
      receipt?.source_global_dogfood_ledger_receipt_id ?? null,
    source_metric_snapshot_receipt_id:
      receipt?.source_metric_snapshot_receipt_id ?? null,
    source_manual_receipt_id: receipt?.source_manual_receipt_id ?? null,
    source_expected_observed_delta_record_ref:
      receipt?.source_expected_observed_delta_record_ref ?? null,
    source_reuse_outcome_record_ref:
      receipt?.source_reuse_outcome_record_ref ?? null,
    recommended_next_work_label: record?.recommended_next_work_label ?? null,
    rationale: record?.rationale ?? null,
    outcome_label: record?.outcome_label ?? null,
    outcome_signal: record?.outcome_signal ?? null,
    candidate_priority_hint: record?.candidate_priority_hint ?? null,
    selected_candidate_context_refs:
      record?.selected_candidate_context_refs ?? [],
    source_next_work_candidate_card_ids:
      record?.source_next_work_candidate_card_ids ?? [],
    expected_summary: record?.expected_summary ?? null,
    observed_summary: record?.observed_summary ?? null,
    mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
  })}`;
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_VERSION,
    scope: sourceReadback.scope,
    source_readback_ref: sourceReadbackRef,
    source_next_work_signal_receipt_id: receipt?.receipt_id ?? null,
    source_next_work_signal_record_id:
      record?.next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      record?.next_work_signal_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });
  const biasStrengthHint = determineBiasStrengthHint({
    candidateReady,
    priorityHint: record?.candidate_priority_hint ?? null,
    outcomeSignal: record?.outcome_signal ?? null,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_CONTRACT_VERSION,
    scope: sourceReadback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_next_work_signal_readback_ref: sourceReadbackRef,
    source_next_work_signal_receipt_id: receipt?.receipt_id ?? null,
    source_next_work_signal_record_id:
      record?.next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      record?.next_work_signal_record_fingerprint ?? null,
    source_projection_fingerprint: receipt?.source_projection_fingerprint ?? null,
    source_global_dogfood_ledger_receipt_id:
      receipt?.source_global_dogfood_ledger_receipt_id ?? null,
    source_global_dogfood_ledger_record_id:
      receipt?.source_global_dogfood_ledger_record_id ?? null,
    source_metric_snapshot_receipt_id:
      receipt?.source_metric_snapshot_receipt_id ?? null,
    source_metric_snapshot_record_id:
      receipt?.source_metric_snapshot_record_id ?? null,
    source_manual_receipt_id: receipt?.source_manual_receipt_id ?? null,
    source_handoff_seed_fingerprint:
      receipt?.source_handoff_seed_fingerprint ?? null,
    source_result_text_fingerprint:
      receipt?.source_result_text_fingerprint ?? null,
    source_expected_observed_delta_record_ref:
      receipt?.source_expected_observed_delta_record_ref ?? null,
    source_reuse_outcome_record_ref:
      receipt?.source_reuse_outcome_record_ref ?? null,
    operator_authorization_mode: operatorAuthorizationMode,
    proposed_next_work_bias_mapping: {
      recommended_next_work_label: record?.recommended_next_work_label ?? null,
      rationale: record?.rationale ?? null,
      outcome_label: record?.outcome_label ?? null,
      outcome_signal: record?.outcome_signal ?? null,
      candidate_priority_hint: record?.candidate_priority_hint ?? null,
      selected_candidate_context_refs:
        record?.selected_candidate_context_refs ?? [],
      source_next_work_candidate_card_ids:
        record?.source_next_work_candidate_card_ids ?? [],
      expected_summary: record?.expected_summary ?? null,
      observed_summary: record?.observed_summary ?? null,
      mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
      source_line: record?.source_line ?? null,
      blockers: blockerReasons,
      warnings: warningReasons,
      can_feed_next_work_bias_write_candidate: candidateReady,
      can_write_next_work_bias_now: false,
      can_mutate_work_now: false,
      can_write_perspective_now: false,
    },
    proposed_bias_candidate: {
      candidate_kind: "manual_global_dogfood_next_work_bias_write_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_next_work_bias_write_authorization"
        : "blocked_before_next_work_bias_authorization",
      bias_strength_hint: biasStrengthHint,
      reason: candidateReady
        ? "Active committed manual next-work signal decision material can be reviewed for a future separately authorized next-work bias write."
        : "Source next-work signal decision material has blockers before any future next-work bias authorization.",
      writes_now: false,
      would_mutate_work: false,
      would_promote_perspective: false,
    },
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_next_work_bias_write: true,
      durable_id_allocated: false,
      writes_now: false,
    },
    compatibility_findings: buildCompatibilityFindings({
      candidateReady,
      fieldGaps,
      sourceReadbackNoForbiddenWrites,
    }),
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_next_work_bias_contract",
      "separate_future_next_work_bias_write_slice",
      "fresh_operator_confirmation_text_for_next_work_bias_write",
      "future_idempotent_next_work_bias_writer_contract",
      "no_work_perspective_proof_metric_or_memory_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_next_work_signal_receipt_is_still_active_committed",
      "confirm_next_work_signal_record_fingerprint_still_matches_readback",
      "confirm_selected_context_refs_remain_manual_context_not_proof_or_evidence",
      "run_future_next_work_bias_idempotency_replay_check",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        nonWriteConfirmation.next_work_bias_written === false &&
        authorityBoundary.can_write_next_work_bias === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_next_work_signal_receipt_present: Boolean(active),
      active_committed_next_work_signal_record_present: Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      recommended_next_work_label_present: recommendedLabelPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      source_next_work_candidate_card_ids_present: candidateCardIdsPresent,
      source_readback_preserves_no_bias_work_perspective_writes:
        sourceReadbackNoForbiddenWrites,
      no_write_authority:
        authorityBoundary.can_write_next_work_bias === false &&
        authorityBoundary.can_mutate_work === false &&
        authorityBoundary.can_write_perspective_state === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice: candidateReady
      ? "If accepted locally, implement a separate explicitly authorized idempotent next-work bias write slice with row-count validation."
      : "Resolve next-work signal readback blockers before preparing next-work bias write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_dogfood_metrics: false,
    can_write_global_dogfood_ledger: false,
    can_write_metric_snapshot: false,
    can_write_next_work_signal_decision: false,
    can_write_proof_or_evidence: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function normalizeReadback(
  value: unknown,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "latest_active_committed" in value &&
    "records_by_receipt" in value &&
    "authority_boundary" in value
  ) {
    return value as ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback;
  }

  return {
    readback_kind:
      "research_candidate_manual_global_dogfood_next_work_signal_readback",
    readback_version:
      "research_candidate_manual_global_dogfood_next_work_signal_readback.v0.1",
    scope: DEFAULT_SCOPE,
    records_by_receipt: [],
    latest_receipts: [],
    latest_active_committed: null,
    count: 0,
    authority_boundary: createMissingSourceAuthorityBoundary(),
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    operator_notes_persisted: false,
    next_work_bias_written: false,
    work_or_perspective_rows_written: false,
    dogfood_metrics_written: false,
    metric_snapshot_mutated: false,
    global_dogfood_ledger_mutated: false,
    proof_or_evidence_rows_written: false,
    perspective_memory_written: false,
    product_write_executed: false,
  };
}

function buildFieldGaps({
  receipt,
  record,
}: {
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id ? "source_next_work_signal_receipt_id" : null,
    !record?.next_work_signal_record_id
      ? "source_next_work_signal_record_id"
      : null,
    !record?.next_work_signal_record_fingerprint
      ? "source_next_work_signal_record_fingerprint"
      : null,
    !receipt?.source_projection_fingerprint
      ? "source_projection_fingerprint"
      : null,
    !receipt?.source_global_dogfood_ledger_receipt_id
      ? "source_global_dogfood_ledger_receipt_id"
      : null,
    !receipt?.source_global_dogfood_ledger_record_id
      ? "source_global_dogfood_ledger_record_id"
      : null,
    !receipt?.source_metric_snapshot_receipt_id
      ? "source_metric_snapshot_receipt_id"
      : null,
    !receipt?.source_metric_snapshot_record_id
      ? "source_metric_snapshot_record_id"
      : null,
    !receipt?.source_manual_receipt_id ? "source_manual_receipt_id" : null,
    !receipt?.source_handoff_seed_fingerprint
      ? "source_handoff_seed_fingerprint"
      : null,
    !receipt?.source_result_text_fingerprint
      ? "source_result_text_fingerprint"
      : null,
    !receipt?.source_expected_observed_delta_record_ref
      ? "source_expected_observed_delta_record_ref"
      : null,
    !receipt?.source_reuse_outcome_record_ref
      ? "source_reuse_outcome_record_ref"
      : null,
  ]);
}

function readbackPreservesNoBiasWorkPerspectiveWrites(
  readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
) {
  const boundary = readback.authority_boundary;
  return (
    readback.next_work_bias_written === false &&
    readback.work_or_perspective_rows_written === false &&
    readback.dogfood_metrics_written === false &&
    readback.proof_or_evidence_rows_written === false &&
    readback.perspective_memory_written === false &&
    readback.product_write_executed === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_execute_product_write === false
  );
}

function buildCompatibilityFindings({
  candidateReady,
  fieldGaps,
  sourceReadbackNoForbiddenWrites,
}: {
  candidateReady: boolean;
  fieldGaps: string[];
  sourceReadbackNoForbiddenWrites: boolean;
}): ResearchCandidateManualGlobalDogfoodNextWorkBiasCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodNextWorkBiasCompatibilityFinding[] = [
    {
      finding_code: candidateReady
        ? "next_work_signal_ready_for_bias_contract"
        : "next_work_signal_not_ready_for_bias_contract",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "manual_global_dogfood_next_work_signal_decision",
      summary: candidateReady
        ? "The active committed manual next-work signal decision can feed a preview-only next-work bias authorization contract."
        : "The next-work bias authorization preview is blocked by source readback or source-shape gaps.",
    },
    {
      finding_code: "next_work_bias_write_requires_future_slice",
      severity: "warning",
      applies_to: "future_next_work_bias_write",
      summary:
        "This preview does not write next-work bias, work status, Perspective, proof/evidence, metrics, memory, or product state.",
    },
  ];

  if (fieldGaps.length > 0) {
    findings.push({
      finding_code: "next_work_bias_source_field_gaps_present",
      severity: "blocker",
      applies_to: "manual_global_dogfood_next_work_signal_decision",
      summary: `Missing source fields: ${fieldGaps.join(", ")}.`,
    });
  }
  if (!sourceReadbackNoForbiddenWrites) {
    findings.push({
      finding_code: "next_work_bias_source_readback_has_forbidden_write_flags",
      severity: "blocker",
      applies_to: "manual_global_dogfood_next_work_signal_decision",
      summary:
        "The source readback must preserve no next-work bias, work, Perspective, metrics, proof, memory, or product writes before future bias authorization.",
    });
  }
  return findings;
}

function determineBiasStrengthHint({
  candidateReady,
  priorityHint,
  outcomeSignal,
}: {
  candidateReady: boolean;
  priorityHint: string | null;
  outcomeSignal: string | null;
}) {
  if (!candidateReady) return "blocked";
  if (priorityHint === "high") return "high";
  if (priorityHint === "medium") return "medium";
  if (outcomeSignal === "positive") return "medium";
  return "low";
}

function createNextWorkBiasNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodNextWorkBiasNonWriteConfirmation {
  return {
    next_work_bias_written: false,
    work_item_written: false,
    work_mutated: false,
    perspective_relay_written: false,
    perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    dogfood_metrics_written: false,
    global_dogfood_ledger_written: false,
    metric_snapshot_written: false,
    next_work_signal_decision_written: false,
    proof_or_evidence_written: false,
    manual_result_records_written: false,
    manual_result_records_mutated: false,
    product_write_executed: false,
    api_write_route_added: false,
    db_schema_or_migration_added: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    operator_note_persisted: false,
  };
}

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary {
  return {
    can_write_next_work_signal_decision_record: true,
    can_write_next_work_signal_decision_receipt: true,
    can_write_next_work_signal_rollback_metadata: true,
    source_of_truth: false,
    can_write_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_dogfood_metrics: false,
    can_write_global_dogfood_ledger: false,
    can_mutate_manual_global_dogfood_ledger: false,
    can_write_metric_snapshot: false,
    can_mutate_metric_snapshot: false,
    can_write_proof_or_evidence: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

function normalizeLabel(
  value: string | undefined,
  fallback = DEFAULT_OPERATOR_INTENT_LABEL,
) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
}

function fingerprint(value: unknown) {
  return `${FINGERPRINT_ALGORITHM}:${fnv1a32(stableJson(value))}`;
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
