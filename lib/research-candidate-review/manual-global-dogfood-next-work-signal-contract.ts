import type {
  ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalCard,
} from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalContractInput,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalNonWriteConfirmation,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_next_work_signal_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "next_work_signal_decision_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection,
  operator_intent_label,
  requested_future_write_mode,
}: ResearchCandidateManualGlobalDogfoodNextWorkSignalContractInput): ResearchCandidateManualGlobalDogfoodNextWorkSignalContract {
  const sourceProjection = normalizeProjection(projection);
  const latest = sourceProjection.latest_ledger_record_summary;
  const primaryCards = sourceProjection.next_work_signal_candidates.filter(
    (card) => card.card_status === "primary_next_work_candidate",
  );
  const selectedCard =
    primaryCards.find(
      (card) => card.card_kind === "manual_global_dogfood_latest_outcome",
    ) ??
    primaryCards[0] ??
    null;
  const sourceProjectionRef = `manual-global-dogfood-workbench-projection:${sourceProjection.projection_fingerprint}`;
  const sourceLedgerRecordRef = selectedCard?.source_record_id ?? null;
  const projectionReady =
    sourceProjection.projection_readiness ===
      "ready_for_workbench_loop_spine_preview" &&
    sourceProjection.validation.passed === true;
  const selectedCardWriteFlagsAllFalse = primaryCards.every(
    (card) =>
      card.would_write_next_work_bias === false &&
      card.would_write_perspective === false &&
      card.would_write_metrics === false,
  );
  const sourceFingerprintsPresent = latestSourceFingerprintsPresent({
    latest,
    sourceLedgerRecordRef,
  });
  const projectionAuthorityReadOnly =
    projectionAuthorityIsReadOnly(sourceProjection);
  const fieldGaps = buildFieldGaps({ latest, sourceLedgerRecordRef });
  const blockerReasons = buildBlockers({
    projection: sourceProjection,
    projectionReady,
    primaryCards,
    selectedCardWriteFlagsAllFalse,
    sourceFingerprintsPresent,
    projectionAuthorityReadOnly,
    fieldGaps,
  });
  const operatorAuthorizationMode =
    blockerReasons.length === 0
      ? "ready_for_future_next_work_signal_write_authorization"
      : "blocked_before_next_work_signal_authorization";
  const candidateReady =
    operatorAuthorizationMode ===
    "ready_for_future_next_work_signal_write_authorization";
  const warningReasons = uniqueStrings([
    ...sourceProjection.warning_reasons,
    ...(selectedCard?.warnings ?? []),
    ...(sourceProjection.expected_observed_signal_summary
      .mismatch_or_gap_implies_follow_up
      ? ["next_work_signal_follow_up_candidate_from_mismatch_or_gap"]
      : []),
    "next_work_signal_contract_preview_only_no_next_work_bias_write",
  ]);
  const compatibilityFindings = buildCompatibilityFindings({
    projectionReady,
    primaryCards,
    selectedCardWriteFlagsAllFalse,
    sourceFingerprintsPresent,
    projectionAuthorityReadOnly,
  });
  const priorityHint = determinePriorityHint({
    candidateReady,
    outcomeSignal: sourceProjection.outcome_signal_summary.latest_outcome_signal,
    followUp:
      sourceProjection.expected_observed_signal_summary
        .mismatch_or_gap_implies_follow_up,
  });
  const decisionReason = candidateReady
    ? buildDecisionReason({
        selectedCard,
        outcomeSignal:
          sourceProjection.outcome_signal_summary.latest_outcome_signal,
        followUp:
          sourceProjection.expected_observed_signal_summary
            .mismatch_or_gap_implies_follow_up,
      })
    : "Projection or candidate-card blockers prevent future next-work signal write authorization.";
  const idempotencyKey = `manual-global-dogfood-next-work-signal-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_VERSION,
    source_projection_fingerprint: sourceProjection.projection_fingerprint,
    latest_active_committed_receipt_id:
      sourceProjection.latest_active_committed_receipt_id,
    source_next_work_candidate_card_ids: primaryCards.map((card) => card.card_id),
    source_ledger_record_ref: sourceLedgerRecordRef,
    source_manual_receipt_id: latest.source_manual_receipt_id,
    source_expected_observed_delta_record_ref:
      latest.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: latest.source_reuse_outcome_record_ref,
    outcome_label: latest.outcome_label,
    selected_candidate_context_refs: latest.selected_candidate_context_refs,
  })}`;
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary();
  const nonWriteConfirmation = createNextWorkSignalNonWriteConfirmation();
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_VERSION,
    scope: sourceProjection.scope,
    source_projection_fingerprint: sourceProjection.projection_fingerprint,
    source_latest_active_committed_receipt_id:
      sourceProjection.latest_active_committed_receipt_id,
    source_next_work_candidate_card_ids: primaryCards.map((card) => card.card_id),
    source_ledger_record_ref: sourceLedgerRecordRef,
    proposed_decision_status: candidateReady,
    idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_VERSION,
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
    source_next_work_candidate_card_ids: primaryCards.map((card) => card.card_id),
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
    proposed_next_work_signal_mapping: {
      recommended_next_work_label:
        selectedCard?.recommended_next_work_label ?? null,
      rationale: selectedCard?.rationale ?? null,
      outcome_label: latest.outcome_label,
      outcome_signal: sourceProjection.outcome_signal_summary.latest_outcome_signal,
      mismatch_or_gap_summary:
        sourceProjection.expected_observed_signal_summary
          .mismatch_or_gap_summary,
      selected_candidate_context_refs: latest.selected_candidate_context_refs,
      expected_summary:
        sourceProjection.expected_observed_signal_summary.expected_summary,
      observed_summary:
        sourceProjection.expected_observed_signal_summary.observed_summary,
      source_line: latest.source_line,
      blockers: blockerReasons,
      warnings: warningReasons,
      can_feed_next_work_signal_decision_candidate: candidateReady,
      can_write_next_work_bias_now: false,
      can_write_perspective_now: false,
    },
    proposed_decision_inputs: {
      source_next_work_candidate_card_ids: primaryCards.map(
        (card) => card.card_id,
      ),
      primary_candidate_card_count: primaryCards.length,
      selected_card_write_flags_all_false: selectedCardWriteFlagsAllFalse,
      expected_observed_follow_up_candidate:
        sourceProjection.expected_observed_signal_summary
          .mismatch_or_gap_implies_follow_up,
      outcome_signal: sourceProjection.outcome_signal_summary.latest_outcome_signal,
      source_fingerprints_present: sourceFingerprintsPresent,
      field_gaps: fieldGaps,
      writes_now: false,
    },
    proposed_decision_candidate: {
      decision_kind: "manual_global_dogfood_next_work_signal_decision_candidate",
      decision_status: candidateReady
        ? "ready_for_future_next_work_signal_write_authorization"
        : "blocked_before_next_work_signal_authorization",
      candidate_priority_hint: priorityHint,
      reason: decisionReason,
      writes_now: false,
    },
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_next_work_signal_write: true,
      durable_id_allocated: false,
      writes_now: false,
    },
    compatibility_findings: compatibilityFindings,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_next_work_signal_contract",
      "separate_future_next_work_signal_write_slice",
      "fresh_operator_confirmation_text_for_next_work_bias_write",
      "future_idempotent_next_work_signal_writer_contract",
      "no_perspective_metric_proof_work_or_memory_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_source_projection_fingerprint_still_matches_readback",
      "confirm_primary_candidate_cards_still_have_all_write_flags_false_before_authorization",
      "confirm_selected_context_refs_remain_manual_context_not_proof_or_evidence",
      "run_future_next_work_signal_idempotency_replay_check",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        operatorAuthorizationMode ===
          "ready_for_future_next_work_signal_write_authorization" &&
        nonWriteConfirmation.next_work_bias_written === false &&
        authorityBoundary.can_write_next_work_bias === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      projection_ready: projectionReady,
      latest_active_committed_receipt_present: Boolean(
        sourceProjection.latest_active_committed_receipt_id,
      ),
      primary_next_work_candidate_present: primaryCards.length > 0,
      selected_card_write_flags_all_false: selectedCardWriteFlagsAllFalse,
      source_fingerprints_present: sourceFingerprintsPresent,
      projection_authority_is_read_only: projectionAuthorityReadOnly,
      no_write_authority:
        authorityBoundary.can_write_next_work_bias === false &&
        authorityBoundary.can_write_work_item === false &&
        authorityBoundary.can_write_perspective_state === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice:
      operatorAuthorizationMode ===
      "ready_for_future_next_work_signal_write_authorization"
        ? "If accepted locally, implement a separate explicitly authorized idempotent next-work signal write slice with row-count validation."
        : "Resolve projection or candidate-card blockers before preparing next-work signal write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary {
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
      read_only_alignment_note:
        "Missing projection cannot feed next-work signal decision.",
    },
    blocked_reasons: ["blocked_shape_mismatch"],
    warning_reasons: [],
    required_future_authorization: [],
    authority_boundary: createMissingProjectionAuthorityBoundary(),
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
  primaryCards,
  selectedCardWriteFlagsAllFalse,
  sourceFingerprintsPresent,
  projectionAuthorityReadOnly,
  fieldGaps,
}: {
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection;
  projectionReady: boolean;
  primaryCards: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard[];
  selectedCardWriteFlagsAllFalse: boolean;
  sourceFingerprintsPresent: boolean;
  projectionAuthorityReadOnly: boolean;
  fieldGaps: string[];
}) {
  return uniqueStrings([
    ...(!projectionReady
      ? [`projection_not_ready:${projection.projection_readiness}`]
      : []),
    ...(!projection.latest_active_committed_receipt_id
      ? ["latest_active_committed_receipt_missing"]
      : []),
    ...(primaryCards.length === 0
      ? ["primary_next_work_candidate_cards_missing"]
      : []),
    ...(!selectedCardWriteFlagsAllFalse
      ? ["primary_next_work_candidate_card_has_write_flag"]
      : []),
    ...(!sourceFingerprintsPresent ? ["source_fingerprints_missing"] : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...(!projectionAuthorityReadOnly
      ? ["projection_authority_boundary_has_write_authority"]
      : []),
  ]);
}

function buildCompatibilityFindings({
  projectionReady,
  primaryCards,
  selectedCardWriteFlagsAllFalse,
  sourceFingerprintsPresent,
  projectionAuthorityReadOnly,
}: {
  projectionReady: boolean;
  primaryCards: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard[];
  selectedCardWriteFlagsAllFalse: boolean;
  sourceFingerprintsPresent: boolean;
  projectionAuthorityReadOnly: boolean;
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodNextWorkSignalCompatibilityFinding[] = [
    {
      finding_code: projectionReady
        ? "projection_ready_for_next_work_signal_contract"
        : "projection_not_ready_for_next_work_signal_contract",
      severity: projectionReady ? "ready" : "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary: projectionReady
        ? "The Workbench projection is ready to feed a preview-only next-work signal decision contract."
        : "The Workbench projection is blocked, so next-work signal authorization must remain blocked.",
    },
    {
      finding_code: "next_work_signal_write_requires_future_slice",
      severity: "warning",
      applies_to: "future_next_work_signal_decision",
      summary:
        "This contract can preview next-work signal candidates, but a future explicit write slice is required before next-work bias can change.",
    },
  ];

  if (primaryCards.length === 0) {
    findings.push({
      finding_code: "primary_next_work_candidate_cards_missing",
      severity: "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary: "The source projection has no primary next-work candidate cards.",
    });
  }
  if (!selectedCardWriteFlagsAllFalse) {
    findings.push({
      finding_code: "primary_next_work_candidate_card_has_write_flag",
      severity: "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary:
        "Source candidate cards must remain read-only before a future next-work signal write contract can be reviewed.",
    });
  }
  if (!sourceFingerprintsPresent) {
    findings.push({
      finding_code: "next_work_signal_source_fingerprints_missing",
      severity: "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary:
        "Required source fingerprints or manual record refs are missing from the projection.",
    });
  }
  if (!projectionAuthorityReadOnly) {
    findings.push({
      finding_code: "projection_authority_boundary_not_read_only",
      severity: "blocker",
      applies_to: "manual_global_dogfood_projection",
      summary:
        "Next-work signal contract previews only accept source projections that have no write authority.",
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

function latestSourceFingerprintsPresent({
  latest,
  sourceLedgerRecordRef,
}: {
  latest: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection["latest_ledger_record_summary"];
  sourceLedgerRecordRef: string | null;
}) {
  return buildFieldGaps({ latest, sourceLedgerRecordRef }).length === 0;
}

function determinePriorityHint({
  candidateReady,
  outcomeSignal,
  followUp,
}: {
  candidateReady: boolean;
  outcomeSignal: string | null;
  followUp: boolean;
}): "high" | "medium" | "low" | "blocked" {
  if (!candidateReady) return "blocked";
  if (followUp && outcomeSignal === "negative") return "high";
  if (followUp || outcomeSignal === "negative") return "medium";
  return "low";
}

function buildDecisionReason({
  selectedCard,
  outcomeSignal,
  followUp,
}: {
  selectedCard: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard | null;
  outcomeSignal: string | null;
  followUp: boolean;
}) {
  const label = selectedCard?.recommended_next_work_label ?? "manual dogfood outcome";
  if (followUp) {
    return `${label} is a read-only follow-up candidate because the latest ExpectedObservedDelta mismatch/gap implies follow-up.`;
  }
  return `${label} is a read-only candidate from the latest active manual global dogfood outcome signal (${outcomeSignal ?? "unknown"}).`;
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

function createNextWorkSignalNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodNextWorkSignalNonWriteConfirmation {
  return {
    next_work_bias_written: false,
    work_item_written: false,
    work_mutated: false,
    perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    dogfood_metrics_written: false,
    global_dogfood_ledger_written: false,
    global_dogfood_ledger_mutated: false,
    manual_result_records_written: false,
    manual_result_records_mutated: false,
    proof_or_evidence_written: false,
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
