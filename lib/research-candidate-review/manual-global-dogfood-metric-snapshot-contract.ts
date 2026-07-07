import type {
  ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalCard,
} from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotContractInput,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotNonWriteConfirmation,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_metric_snapshot_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "dogfood_metric_snapshot_refresh_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const SUPPORTED_OUTCOME_LABELS = [
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
] as const;

export function buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
  projection,
  operator_intent_label,
  requested_future_write_mode,
}: ResearchCandidateManualGlobalDogfoodMetricSnapshotContractInput): ResearchCandidateManualGlobalDogfoodMetricSnapshotContract {
  const sourceProjection = normalizeProjection(projection);
  const latest = sourceProjection.latest_ledger_record_summary;
  const sourceLedgerRecordRef = findPrimaryLedgerRecordRef(sourceProjection);
  const sourceProjectionRef = `manual-global-dogfood-workbench-projection:${sourceProjection.projection_fingerprint}`;
  const projectionReady =
    sourceProjection.projection_readiness ===
      "ready_for_workbench_loop_spine_preview" &&
    sourceProjection.validation.passed === true;
  const projectionAuthorityReadOnly =
    projectionAuthorityIsReadOnly(sourceProjection);
  const outcomeSignal = sourceProjection.outcome_signal_summary.latest_outcome_signal;
  const fieldGaps = buildFieldGaps({
    latest,
    sourceLedgerRecordRef,
  });
  const supportedOutcomeLabel = SUPPORTED_OUTCOME_LABELS.includes(
    latest.outcome_label as (typeof SUPPORTED_OUTCOME_LABELS)[number],
  );
  const blockerReasons = buildBlockers({
    projection: sourceProjection,
    projectionReady,
    sourceLedgerRecordRef,
    fieldGaps,
    supportedOutcomeLabel,
    projectionAuthorityReadOnly,
  });
  const operatorAuthorizationMode =
    blockerReasons.length === 0
      ? "ready_for_future_metric_snapshot_write_authorization"
      : "blocked_before_metric_snapshot_authorization";
  const warningReasons = uniqueStrings([
    ...sourceProjection.warning_reasons,
    ...(outcomeSignal === "ambiguous"
      ? ["metric_snapshot_outcome_signal_ambiguous"]
      : []),
    ...(sourceProjection.expected_observed_signal_summary
      .mismatch_or_gap_implies_follow_up
      ? ["metric_snapshot_follow_up_candidate_from_mismatch_or_gap"]
      : []),
    "metric_snapshot_contract_preview_only_no_metric_write",
  ]);
  const compatibilityFindings = buildCompatibilityFindings({
    projectionReady,
    fieldGaps,
    supportedOutcomeLabel,
    projectionAuthorityReadOnly,
  });
  const canFeedMetric =
    operatorAuthorizationMode ===
    "ready_for_future_metric_snapshot_write_authorization";
  const proposedMetricCounters = {
    manual_global_dogfood_ledger_active_candidate_count: canFeedMetric ? 1 : 0,
    manual_global_dogfood_positive_signal_count:
      canFeedMetric && outcomeSignal === "positive" ? 1 : 0,
    manual_global_dogfood_negative_signal_count:
      canFeedMetric && outcomeSignal === "negative" ? 1 : 0,
    manual_global_dogfood_ambiguous_signal_count:
      canFeedMetric && outcomeSignal === "ambiguous" ? 1 : 0,
    manual_global_dogfood_follow_up_candidate_count:
      canFeedMetric &&
      sourceProjection.expected_observed_signal_summary
        .mismatch_or_gap_implies_follow_up
        ? 1
        : 0,
    writes_now: false,
  } as const;
  const proposedMetricLabels = {
    source_family: "manual_research_candidate_global_dogfood_ledger",
    projection_ready_label: sourceProjection.projection_readiness,
    outcome_label: latest.outcome_label,
    outcome_signal: outcomeSignal,
    expected_observed_follow_up_label:
      sourceProjection.expected_observed_signal_summary
        .mismatch_or_gap_implies_follow_up
        ? "follow_up_candidate"
        : "no_follow_up_candidate",
    labels: uniqueStrings([
      `scope:${sourceProjection.scope}`,
      `projection:${sourceProjection.projection_fingerprint}`,
      latest.outcome_label ? `outcome:${latest.outcome_label}` : null,
      `signal:${outcomeSignal}`,
      sourceProjection.latest_active_committed_receipt_id
        ? `receipt:${sourceProjection.latest_active_committed_receipt_id}`
        : null,
    ]),
    writes_now: false,
  } as const;
  const idempotencyKey = `manual-global-dogfood-metric-snapshot-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_VERSION,
    source_projection_fingerprint: sourceProjection.projection_fingerprint,
    latest_active_committed_receipt_id:
      sourceProjection.latest_active_committed_receipt_id,
    source_ledger_record_ref: sourceLedgerRecordRef,
    source_manual_receipt_id: latest.source_manual_receipt_id,
    source_expected_observed_delta_record_ref:
      latest.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: latest.source_reuse_outcome_record_ref,
    outcome_label: latest.outcome_label,
    outcome_signal: outcomeSignal,
    selected_candidate_context_refs: latest.selected_candidate_context_refs,
  })}`;
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary();
  const nonWriteConfirmation = createMetricSnapshotNonWriteConfirmation();
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_VERSION,
    scope: sourceProjection.scope,
    source_projection_fingerprint: sourceProjection.projection_fingerprint,
    source_latest_active_committed_receipt_id:
      sourceProjection.latest_active_committed_receipt_id,
    source_ledger_record_ref: sourceLedgerRecordRef,
    proposed_metric_counters: proposedMetricCounters,
    idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_VERSION,
    scope: sourceProjection.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_projection_ref: sourceProjectionRef,
    source_projection_fingerprint: sourceProjection.projection_fingerprint,
    source_latest_active_committed_receipt_id:
      sourceProjection.latest_active_committed_receipt_id,
    source_ledger_record_ref: sourceLedgerRecordRef,
    source_manual_receipt_id: latest.source_manual_receipt_id,
    source_contract_fingerprint: latest.source_contract_fingerprint,
    source_authorization_review_fingerprint:
      latest.source_authorization_review_fingerprint,
    source_handoff_seed_fingerprint: latest.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: latest.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      latest.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: latest.source_reuse_outcome_record_ref,
    operator_authorization_mode: operatorAuthorizationMode,
    proposed_metric_snapshot_mapping: {
      outcome_label: latest.outcome_label,
      outcome_signal: outcomeSignal,
      expected_summary_present: Boolean(
        sourceProjection.expected_observed_signal_summary.expected_summary,
      ),
      observed_summary_present:
        sourceProjection.expected_observed_signal_summary
          .observed_summary_present,
      mismatch_or_gap_present: Boolean(
        sourceProjection.expected_observed_signal_summary
          .mismatch_or_gap_summary,
      ),
      selected_candidate_context_ref_count:
        latest.selected_candidate_context_refs.length,
      warning_reason_count: latest.warning_reason_count,
      compatibility_finding_count: latest.compatibility_finding_count,
      source_line_present: Boolean(latest.source_line),
      can_feed_metric_snapshot_refresh_candidate: canFeedMetric,
      can_write_metric_now: false,
      field_gaps: fieldGaps,
    },
    proposed_metric_dimensions: {
      scope: sourceProjection.scope,
      source_projection_ref: sourceProjectionRef,
      source_latest_active_committed_receipt_id:
        sourceProjection.latest_active_committed_receipt_id,
      source_ledger_record_ref: sourceLedgerRecordRef,
      source_manual_receipt_id: latest.source_manual_receipt_id,
      source_contract_fingerprint: latest.source_contract_fingerprint,
      source_authorization_review_fingerprint:
        latest.source_authorization_review_fingerprint,
      source_handoff_seed_fingerprint: latest.source_handoff_seed_fingerprint,
      source_result_text_fingerprint: latest.source_result_text_fingerprint,
      source_expected_observed_delta_record_ref:
        latest.source_expected_observed_delta_record_ref,
      source_reuse_outcome_record_ref: latest.source_reuse_outcome_record_ref,
      outcome_label: latest.outcome_label,
      outcome_signal: outcomeSignal,
      selected_candidate_context_refs: latest.selected_candidate_context_refs,
      manual_only_context_refs: latest.manual_only_context_refs,
    },
    proposed_metric_counters: proposedMetricCounters,
    proposed_metric_labels: proposedMetricLabels,
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_metric_snapshot_write: true,
      durable_id_allocated: false,
      writes_now: false,
    },
    compatibility_findings: compatibilityFindings,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_metric_snapshot_contract",
      "separate_future_metric_snapshot_write_slice",
      "fresh_operator_confirmation_text_for_metric_write",
      "future_idempotent_metric_writer_contract",
      "no_next_work_bias_perspective_proof_work_or_memory_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_source_projection_fingerprint_still_matches_readback",
      "confirm_latest_active_committed_manual_global_dogfood_receipt_is_current",
      "confirm_selected_context_refs_remain_manual_context_not_proof_or_evidence",
      "run_future_metric_snapshot_idempotency_replay_check",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        operatorAuthorizationMode ===
          "ready_for_future_metric_snapshot_write_authorization" &&
        nonWriteConfirmation.dogfood_metrics_written === false &&
        authorityBoundary.can_write_dogfood_metrics === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      projection_ready: projectionReady,
      latest_active_committed_receipt_present: Boolean(
        sourceProjection.latest_active_committed_receipt_id,
      ),
      source_ledger_record_ref_present: Boolean(sourceLedgerRecordRef),
      source_fingerprints_present: fieldGaps.length === 0,
      outcome_signal_supported: supportedOutcomeLabel,
      projection_authority_is_read_only: projectionAuthorityReadOnly,
      no_write_authority:
        authorityBoundary.can_write_dogfood_metrics === false &&
        authorityBoundary.can_write_metric_snapshot === false &&
        authorityBoundary.can_write_next_work_bias === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice:
      operatorAuthorizationMode ===
      "ready_for_future_metric_snapshot_write_authorization"
        ? "If accepted locally, implement a separate explicitly authorized idempotent dogfood metric snapshot write slice with row-count validation."
        : "Resolve projection or source-shape blockers before preparing dogfood metric snapshot write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_dogfood_metrics: false,
    can_write_metric_snapshot: false,
    can_write_global_dogfood_ledger: false,
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

function normalizeProjection(
  value: unknown,
): ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "projection_kind" in value &&
    "projection_version" in value &&
    "latest_ledger_record_summary" in value &&
    "next_work_signal_candidates" in value
  ) {
    return value as ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection;
  }

  return {
    projection_kind:
      "research_candidate_manual_global_dogfood_ledger_workbench_projection",
    projection_version:
      "research_candidate_manual_global_dogfood_ledger_workbench_projection.v0.1",
    projection_readiness: "blocked_shape_mismatch",
    projection_fingerprint: "missing_projection",
    scope: DEFAULT_SCOPE,
    operator_view: "missing_projection",
    source_readback_ref: "manual-global-dogfood-ledger-readback:missing",
    source_receipt_ids: [],
    latest_active_committed_receipt_id: null,
    ledger_status_summary: {
      total_receipts: 0,
      committed_count: 0,
      rolled_back_count: 0,
      superseded_count: 0,
      active_committed_count: 0,
      context_only_count: 0,
    },
    latest_ledger_record_summary: {
      source_manual_receipt_id: null,
      source_contract_fingerprint: null,
      source_authorization_review_fingerprint: null,
      source_handoff_seed_fingerprint: null,
      source_result_text_fingerprint: null,
      source_expected_observed_delta_record_ref: null,
      source_reuse_outcome_record_ref: null,
      outcome_label: null,
      selected_candidate_context_refs: [],
      selected_candidate_context_ref_count: 0,
      expected_summary: null,
      observed_summary: null,
      mismatch_or_gap_summary: null,
      source_line: null,
      manual_only_context_refs: [],
      warning_reasons: [],
      warning_reason_count: 0,
      compatibility_findings: [],
      compatibility_finding_count: 0,
    },
    outcome_signal_summary: {
      outcome_label_counts: {
        helpful: 0,
        stale: 0,
        missing: 0,
        noisy: 0,
        misleading: 0,
        unknown: 0,
      },
      latest_active_outcome_label: null,
      latest_active_outcome_is_helpful: false,
      latest_active_outcome_is_stale: false,
      latest_active_outcome_is_missing: false,
      latest_active_outcome_is_noisy: false,
      latest_active_outcome_is_misleading: false,
      latest_outcome_signal: "ambiguous",
      no_salience_update: true,
      no_metric_write: true,
    },
    expected_observed_signal_summary: {
      expected_summary: null,
      observed_summary: null,
      mismatch_or_gap_summary: null,
      observed_summary_present: false,
      mismatch_or_gap_implies_follow_up: false,
      no_perspective_promotion: true,
      no_proof_or_evidence: true,
    },
    next_work_signal_candidates: [],
    dogfood_loop_spine_alignment: {
      can_feed_workbench_dogfood_loop_spine_overview_read_model: false,
      can_feed_dogfood_metric_snapshot_preview_read_model: false,
      can_feed_next_work_signal_decision_preview_read_model: false,
      blockers_before_any_write_or_mutation: ["blocked_shape_mismatch"],
      read_only_alignment_note: "Missing projection cannot feed metric snapshot.",
    },
    blocked_reasons: ["blocked_shape_mismatch"],
    warning_reasons: [],
    required_future_authorization: [],
    authority_boundary:
      createMissingProjectionAuthorityBoundary(),
    validation: {
      passed: false,
      failure_codes: ["blocked_shape_mismatch"],
      projection_fingerprint: "missing_projection",
      source_readback_shape_valid: false,
      active_committed_receipt_present: false,
      latest_ledger_record_present: false,
      source_fingerprints_present: false,
      no_metric_write: true,
      no_next_work_bias_write: true,
      no_perspective_write: true,
      no_proof_or_evidence_write: true,
      no_work_mutation: true,
    },
    next_recommended_slice: "Provide a valid Workbench projection.",
  };
}

function buildBlockers({
  projection,
  projectionReady,
  sourceLedgerRecordRef,
  fieldGaps,
  supportedOutcomeLabel,
  projectionAuthorityReadOnly,
}: {
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection;
  projectionReady: boolean;
  sourceLedgerRecordRef: string | null;
  fieldGaps: string[];
  supportedOutcomeLabel: boolean;
  projectionAuthorityReadOnly: boolean;
}) {
  return uniqueStrings([
    ...(!projectionReady
      ? [`projection_not_ready:${projection.projection_readiness}`]
      : []),
    ...(!projection.latest_active_committed_receipt_id
      ? ["latest_active_committed_receipt_missing"]
      : []),
    ...(!sourceLedgerRecordRef ? ["source_ledger_record_ref_missing"] : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...(!supportedOutcomeLabel ? ["outcome_label_not_supported_for_metric"] : []),
    ...(!projectionAuthorityReadOnly
      ? ["projection_authority_boundary_has_write_authority"]
      : []),
  ]);
}

function buildCompatibilityFindings({
  projectionReady,
  fieldGaps,
  supportedOutcomeLabel,
  projectionAuthorityReadOnly,
}: {
  projectionReady: boolean;
  fieldGaps: string[];
  supportedOutcomeLabel: boolean;
  projectionAuthorityReadOnly: boolean;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodMetricSnapshotCompatibilityFinding[] = [
    {
      finding_code: projectionReady
        ? "projection_ready_for_metric_snapshot_contract"
        : "projection_not_ready_for_metric_snapshot_contract",
      severity: projectionReady ? "ready" : "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary: projectionReady
        ? "The Workbench projection is ready to feed a preview-only metric snapshot authorization contract."
        : "The Workbench projection is blocked, so metric snapshot authorization must remain blocked.",
    },
    {
      finding_code: "metric_snapshot_write_requires_future_slice",
      severity: "warning",
      applies_to: "future_metric_snapshot_refresh",
      summary:
        "This contract can preview counters and labels, but a future explicit write slice is required before dogfood metrics can change.",
    },
  ];

  if (fieldGaps.length > 0) {
    findings.push({
      finding_code: "metric_snapshot_source_field_gaps_present",
      severity: "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary: `Missing source fields: ${fieldGaps.join(", ")}.`,
    });
  }
  if (!supportedOutcomeLabel) {
    findings.push({
      finding_code: "metric_snapshot_outcome_label_not_supported",
      severity: "blocker",
      applies_to: "future_metric_snapshot_refresh",
      summary:
        "The latest active outcome label is missing or outside the supported manual dogfood outcome labels.",
    });
  }
  if (!projectionAuthorityReadOnly) {
    findings.push({
      finding_code: "projection_authority_boundary_not_read_only",
      severity: "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary:
        "Metric snapshot contract previews only accept source projections that have no write authority.",
    });
  }
  return findings;
}

function buildFieldGaps({
  latest,
  sourceLedgerRecordRef,
}: {
  latest: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection["latest_ledger_record_summary"];
  sourceLedgerRecordRef: string | null;
}) {
  return uniqueStrings([
    !sourceLedgerRecordRef ? "source_ledger_record_ref" : null,
    !latest.source_manual_receipt_id ? "source_manual_receipt_id" : null,
    !latest.source_contract_fingerprint ? "source_contract_fingerprint" : null,
    !latest.source_authorization_review_fingerprint
      ? "source_authorization_review_fingerprint"
      : null,
    !latest.source_handoff_seed_fingerprint
      ? "source_handoff_seed_fingerprint"
      : null,
    !latest.source_result_text_fingerprint
      ? "source_result_text_fingerprint"
      : null,
    !latest.source_expected_observed_delta_record_ref
      ? "source_expected_observed_delta_record_ref"
      : null,
    !latest.source_reuse_outcome_record_ref
      ? "source_reuse_outcome_record_ref"
      : null,
    !latest.outcome_label ? "outcome_label" : null,
  ]);
}

function findPrimaryLedgerRecordRef(
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection,
) {
  return (
    projection.next_work_signal_candidates.find(
      (card) =>
        card.card_status === "primary_next_work_candidate" &&
        card.card_kind === "manual_global_dogfood_latest_outcome",
    )?.source_record_id ??
    projection.next_work_signal_candidates.find(
      (card) => card.card_status === "primary_next_work_candidate",
    )?.source_record_id ??
    null
  );
}

function projectionAuthorityIsReadOnly(
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection,
) {
  const boundary = projection.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.preview_only === true &&
    boundary.source_of_truth === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_dogfood_ledger === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_mutate_work === false &&
    boundary.can_execute_product_write === false
  );
}

function createMissingProjectionAuthorityBoundary() {
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
  } as const;
}

function createMetricSnapshotNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodMetricSnapshotNonWriteConfirmation {
  return {
    dogfood_metrics_written: false,
    metric_snapshot_written: false,
    next_work_bias_written: false,
    global_dogfood_ledger_written: false,
    global_dogfood_ledger_mutated: false,
    manual_result_records_written: false,
    manual_result_records_mutated: false,
    proof_or_evidence_written: false,
    work_mutated: false,
    perspective_promoted: false,
    perspective_state_written: false,
    perspective_memory_written: false,
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

function normalizeLabel(
  value: string | undefined,
  fallback = DEFAULT_OPERATOR_INTENT_LABEL,
) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
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
