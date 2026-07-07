import type {
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractInput,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateExistingCompatibility,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateNonWriteConfirmation,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_canonical_perspective_update_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "canonical_perspective_update_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
}: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractInput): ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract {
  const source = normalizeReadback(readback);
  const active = source.readback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.perspective_relay_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-perspective-relay-readback:${source.readback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    sourceReadbackPreservesNoCanonicalPerspectiveWrites(source.readback);
  const sourceReadbackMutationBlockers = buildSourceReadbackMutationBlockers(
    source.readback,
  );
  const relayUpdateLabelPresent = Boolean(record?.relay_update_label.trim());
  const relayUpdateRationalePresent = Boolean(
    record?.relay_update_rationale.trim(),
  );
  const selectedContextPresent =
    (record?.selected_candidate_context_refs.length ?? 0) > 0;
  const candidateCardIdsPresent =
    (record?.source_next_work_candidate_card_ids.length ?? 0) > 0;
  const explanatoryMaterialPresent = Boolean(
    record?.expected_summary?.trim() &&
      record?.observed_summary?.trim() &&
      record?.mismatch_or_gap_summary?.trim() &&
      record?.relay_update_rationale?.trim(),
  );
  const manualContextNotProofOrEvidence =
    (record?.manual_only_context_refs ?? []).every(
      (ref) => !/^(proof|evidence):/i.test(ref.trim()),
    );
  const sourceAuthorityBoundaryReadOnly =
    sourceAuthorityBoundaryPreservesNoCanonicalWrites(source.readback);
  const blockerReasons = uniqueStrings([
    ...(source.missing ? ["source_perspective_relay_readback_missing"] : []),
    ...(!active
      ? ["source_perspective_relay_receipt_not_active_committed"]
      : []),
    ...(!record ? ["source_perspective_relay_record_missing"] : []),
    ...(!record?.perspective_relay_record_fingerprint
      ? ["source_perspective_relay_record_fingerprint_missing"]
      : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...sourceReadbackMutationBlockers,
    ...(!relayUpdateLabelPresent ? ["relay_update_label_missing"] : []),
    ...(!relayUpdateRationalePresent ? ["relay_update_rationale_missing"] : []),
    ...(!selectedContextPresent
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!candidateCardIdsPresent
      ? ["source_next_work_candidate_card_ids_missing"]
      : []),
    ...(!explanatoryMaterialPresent
      ? ["canonical_update_explanation_insufficient"]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? ["manual_only_context_refs_must_not_be_treated_as_proof_or_evidence"]
      : []),
    ...(!sourceReadbackNoForbiddenWrites
      ? ["source_authority_boundary_not_read_only"]
      : []),
    ...(!sourceAuthorityBoundaryReadOnly
      ? ["source_authority_boundary_not_read_only"]
      : []),
  ]);
  const candidateReady = blockerReasons.length === 0;
  const operatorAuthorizationMode = candidateReady
    ? "ready_for_future_canonical_perspective_update_write_authorization"
    : "blocked_before_canonical_perspective_update_authorization";
  const canonicalUpdateLabel = buildCanonicalUpdateLabel(record);
  const canonicalUpdateRationale = buildCanonicalUpdateRationale(record);
  const warningReasons = uniqueStrings([
    ...(record?.warnings ?? []),
    ...(record?.manual_only_context_refs.length
      ? ["manual_only_context_refs_preserved_not_proof_evidence"]
      : []),
    "canonical_perspective_update_contract_preview_only_no_state_write",
    "existing_current_working_perspective_update_path_requires_separate_mapping",
  ]);
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary();
  const nonWriteConfirmation =
    createCanonicalPerspectiveUpdateNonWriteConfirmation();
  const compatibility = buildExistingCompatibility({
    record,
    fieldGaps,
    explanatoryMaterialPresent,
    manualContextNotProofOrEvidence,
  });
  const idempotencyKey = `manual-global-dogfood-canonical-perspective-update-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_VERSION,
    source_perspective_relay_receipt_id: receipt?.receipt_id ?? null,
    source_perspective_relay_record_id:
      record?.perspective_relay_record_id ?? null,
    source_perspective_relay_record_fingerprint:
      record?.perspective_relay_record_fingerprint ?? null,
    source_next_work_signal_receipt_id:
      receipt?.source_next_work_signal_receipt_id ?? null,
    source_next_work_signal_record_id:
      receipt?.source_next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      receipt?.source_next_work_signal_record_fingerprint ?? null,
    source_next_work_bias_receipt_id:
      receipt?.source_next_work_bias_receipt_id ?? null,
    source_next_work_bias_record_id:
      receipt?.source_next_work_bias_record_id ?? null,
    source_next_work_bias_record_fingerprint:
      receipt?.source_next_work_bias_record_fingerprint ?? null,
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
    relay_update_label: record?.relay_update_label ?? null,
    relay_update_rationale: record?.relay_update_rationale ?? null,
    canonical_update_label: canonicalUpdateLabel,
    canonical_update_rationale: canonicalUpdateRationale,
    recommended_next_work_label: record?.recommended_next_work_label ?? null,
    outcome_label: record?.outcome_label ?? null,
    outcome_signal: record?.outcome_signal ?? null,
    selected_candidate_context_refs:
      record?.selected_candidate_context_refs ?? [],
    source_next_work_candidate_card_ids:
      record?.source_next_work_candidate_card_ids ?? [],
    expected_summary: record?.expected_summary ?? null,
    observed_summary: record?.observed_summary ?? null,
    mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
    manual_only_context_refs: record?.manual_only_context_refs ?? [],
    source_line: record?.source_line ?? null,
  })}`;
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_VERSION,
    scope: source.readback.scope,
    source_readback_ref: sourceReadbackRef,
    source_perspective_relay_receipt_id: receipt?.receipt_id ?? null,
    source_perspective_relay_record_id:
      record?.perspective_relay_record_id ?? null,
    source_perspective_relay_record_fingerprint:
      record?.perspective_relay_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_VERSION,
    scope: source.readback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_perspective_relay_readback_ref: sourceReadbackRef,
    source_perspective_relay_receipt_id: receipt?.receipt_id ?? null,
    source_perspective_relay_record_id:
      record?.perspective_relay_record_id ?? null,
    source_perspective_relay_record_fingerprint:
      record?.perspective_relay_record_fingerprint ?? null,
    source_next_work_signal_receipt_id:
      receipt?.source_next_work_signal_receipt_id ?? null,
    source_next_work_signal_record_id:
      receipt?.source_next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      receipt?.source_next_work_signal_record_fingerprint ?? null,
    source_next_work_bias_receipt_id:
      receipt?.source_next_work_bias_receipt_id ?? null,
    source_next_work_bias_record_id:
      receipt?.source_next_work_bias_record_id ?? null,
    source_next_work_bias_record_fingerprint:
      receipt?.source_next_work_bias_record_fingerprint ?? null,
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
    proposed_canonical_perspective_update_mapping: {
      canonical_update_label: canonicalUpdateLabel,
      canonical_update_rationale: canonicalUpdateRationale,
      relay_update_label: record?.relay_update_label ?? null,
      relay_update_rationale: record?.relay_update_rationale ?? null,
      recommended_next_work_label: record?.recommended_next_work_label ?? null,
      outcome_label: record?.outcome_label ?? null,
      outcome_signal: record?.outcome_signal ?? null,
      expected_summary: record?.expected_summary ?? null,
      observed_summary: record?.observed_summary ?? null,
      mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
      selected_candidate_context_refs:
        record?.selected_candidate_context_refs ?? [],
      source_next_work_candidate_card_ids:
        record?.source_next_work_candidate_card_ids ?? [],
      manual_only_context_refs: record?.manual_only_context_refs ?? [],
      source_line: record?.source_line ?? null,
      blockers: blockerReasons,
      warnings: warningReasons,
      can_feed_canonical_perspective_update_write_candidate: candidateReady,
      can_write_canonical_perspective_now: false,
      can_promote_perspective_now: false,
      can_write_perspective_memory_now: false,
      can_mutate_work_now: false,
      can_write_proof_or_evidence_now: false,
      can_write_next_work_bias_now: false,
      can_write_relay_now: false,
    },
    proposed_perspective_update_candidate: {
      candidate_kind:
        "manual_global_dogfood_canonical_perspective_update_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_canonical_perspective_update_write_authorization"
        : "blocked_before_canonical_perspective_update_authorization",
      update_scope_hint: candidateReady
        ? "current_working_perspective"
        : "blocked",
      update_strength_hint: candidateReady
        ? strengthHint(record?.outcome_signal)
        : "blocked",
      reason: candidateReady
        ? "Active committed manual Perspective relay material can be reviewed for a future separately authorized canonical Perspective update write."
        : "Source relay readback lacks the active, explanatory, no-source-mutation shape required before canonical Perspective update authorization.",
      writes_now: false,
      would_write_canonical_perspective_state: false,
      would_promote_perspective: false,
      would_write_perspective_memory: false,
      would_mutate_work: false,
      would_write_proof_or_evidence: false,
    },
    proposed_existing_perspective_update_compatibility: compatibility,
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_canonical_perspective_update_write: true,
      durable_id_allocated: false,
      writes_now: false,
    },
    compatibility_findings: buildCompatibilityFindings({
      candidateReady,
      fieldGaps,
      explanatoryMaterialPresent,
      manualContextNotProofOrEvidence,
      sourceReadbackNoForbiddenWrites,
      sourceReadbackMutationBlockers,
      compatibility,
    }),
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_canonical_perspective_update_contract",
      "separate_future_canonical_perspective_update_write_slice",
      "fresh_operator_confirmation_text_for_canonical_perspective_update_write",
      "future_idempotent_canonical_perspective_update_writer_contract",
      "no_perspective_promotion_memory_work_proof_or_metric_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_perspective_relay_receipt_is_still_active_committed",
      "confirm_perspective_relay_record_fingerprint_still_matches_readback",
      "confirm_next_work_signal_and_next_work_bias_source_refs_still_match",
      "confirm_expected_observed_mismatch_material_still_explains_the_update",
      "confirm_manual_only_context_refs_are_not_proof_or_evidence_refs",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        nonWriteConfirmation.canonical_perspective_state_written === false &&
        authorityBoundary.can_write_canonical_perspective_state === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_perspective_relay_receipt_present: Boolean(active),
      active_committed_perspective_relay_record_present: Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      relay_update_label_present: relayUpdateLabelPresent,
      relay_update_rationale_present: relayUpdateRationalePresent,
      explanatory_expected_observed_material_present:
        explanatoryMaterialPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      source_next_work_candidate_card_ids_present: candidateCardIdsPresent,
      manual_context_not_proof_or_evidence: manualContextNotProofOrEvidence,
      source_readback_preserves_no_canonical_perspective_work_memory_proof_metric_writes:
        sourceReadbackNoForbiddenWrites && sourceAuthorityBoundaryReadOnly,
      no_write_authority:
        authorityBoundary.can_write_canonical_perspective_state === false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_promote_perspective === false &&
        authorityBoundary.can_write_perspective_memory === false &&
        authorityBoundary.can_mutate_work === false &&
        authorityBoundary.can_write_proof_or_evidence === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice: candidateReady
      ? "If accepted locally, implement a separate explicitly authorized idempotent canonical Perspective update write slice with source revalidation and row-count validation."
      : "Resolve Perspective relay readback blockers before preparing canonical Perspective update write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_canonical_perspective_state: false,
    can_update_current_working_perspective: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_perspective_relay: false,
    can_mutate_perspective_relay: false,
    can_write_next_work_bias: false,
    can_mutate_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
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

function normalizeReadback(value: unknown): {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback;
  missing: boolean;
} {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "latest_active_committed" in value &&
    "records_by_receipt" in value &&
    "authority_boundary" in value
  ) {
    return {
      readback: value as ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
      missing: false,
    };
  }

  return {
    readback: {
      readback_kind:
        "research_candidate_manual_global_dogfood_perspective_relay_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_perspective_relay_readback.v0.1",
      scope: DEFAULT_SCOPE,
      storage_path: "manual_specific_perspective_relay_tables",
      records_by_receipt: [],
      latest_receipts: [],
      latest_active_committed: null,
      count: 0,
      authority_boundary: createMissingSourceAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      perspective_relay_written: false,
      perspective_state_written: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      next_work_bias_mutated: false,
      work_mutated: false,
      dogfood_metrics_written: false,
      global_dogfood_ledger_mutated: false,
      metric_snapshot_mutated: false,
      next_work_signal_decision_mutated: false,
      proof_or_evidence_rows_written: false,
      product_write_executed: false,
    },
    missing: true,
  };
}

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary {
  return {
    can_write_perspective_relay_record: true,
    can_write_perspective_relay_receipt: true,
    can_write_perspective_relay_rollback_metadata: true,
    source_of_truth: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_next_work_bias: false,
    can_mutate_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
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
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

function buildFieldGaps({
  receipt,
  record,
}: {
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id ? "source_perspective_relay_receipt_id" : null,
    !record?.perspective_relay_record_id
      ? "source_perspective_relay_record_id"
      : null,
    !record?.perspective_relay_record_fingerprint
      ? "source_perspective_relay_record_fingerprint"
      : null,
    !receipt?.source_next_work_signal_receipt_id
      ? "source_next_work_signal_receipt_id"
      : null,
    !receipt?.source_next_work_signal_record_id
      ? "source_next_work_signal_record_id"
      : null,
    !receipt?.source_next_work_signal_record_fingerprint
      ? "source_next_work_signal_record_fingerprint"
      : null,
    !receipt?.source_next_work_bias_receipt_id
      ? "source_next_work_bias_receipt_id"
      : null,
    !receipt?.source_next_work_bias_record_id
      ? "source_next_work_bias_record_id"
      : null,
    !receipt?.source_next_work_bias_record_fingerprint
      ? "source_next_work_bias_record_fingerprint"
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

function sourceReadbackPreservesNoCanonicalPerspectiveWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
) {
  return (
    readback.perspective_state_written === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.next_work_bias_mutated === false &&
    readback.work_mutated === false &&
    readback.dogfood_metrics_written === false &&
    readback.global_dogfood_ledger_mutated === false &&
    readback.metric_snapshot_mutated === false &&
    readback.next_work_signal_decision_mutated === false &&
    readback.proof_or_evidence_rows_written === false &&
    readback.product_write_executed === false &&
    readback.raw_manual_note_text_present === false &&
    readback.raw_result_report_text_present === false &&
    readback.operator_notes_persisted === false
  );
}

function sourceAuthorityBoundaryPreservesNoCanonicalWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
) {
  const boundary = readback.authority_boundary;
  return (
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_mutate_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_metric_snapshot === false &&
    boundary.can_write_next_work_signal_decision === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_execute_product_write === false &&
    boundary.persists_raw_manual_note_text === false &&
    boundary.persists_raw_result_report_text === false &&
    boundary.persists_operator_notes === false
  );
}

function buildSourceReadbackMutationBlockers(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
) {
  return uniqueStrings([
    readback.perspective_state_written
      ? "source_relay_readback_canonical_perspective_already_written"
      : null,
    readback.perspective_promoted
      ? "source_relay_readback_perspective_promoted"
      : null,
    readback.perspective_memory_written
      ? "source_relay_readback_perspective_memory_written"
      : null,
    readback.work_mutated ? "source_relay_readback_work_mutated" : null,
    readback.proof_or_evidence_rows_written
      ? "source_relay_readback_proof_or_evidence_written"
      : null,
    readback.dogfood_metrics_written ||
    readback.global_dogfood_ledger_mutated ||
    readback.metric_snapshot_mutated ||
    readback.next_work_signal_decision_mutated ||
    readback.next_work_bias_mutated
      ? "source_relay_readback_metric_or_source_store_mutated"
      : null,
    readback.raw_manual_note_text_present ||
    readback.raw_result_report_text_present ||
    readback.operator_notes_persisted
      ? "source_relay_raw_text_or_operator_note_present"
      : null,
    readback.product_write_executed ? "source_relay_product_write_executed" : null,
  ]);
}

function buildExistingCompatibility({
  record,
  fieldGaps,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
}: {
  record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord | null;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
}): ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateExistingCompatibility {
  const compatibilityFieldGaps = uniqueStrings([
    ...fieldGaps,
    "current_working_perspective_material_not_supplied",
    "canonical_perspective_state_ref_not_supplied",
    "proof_or_evidence_refs_not_supplied_by_manual_path",
    ...(!record?.relay_update_label ? ["relay_update_label"] : []),
    ...(!record?.relay_update_rationale ? ["relay_update_rationale"] : []),
    ...(!explanatoryMaterialPresent
      ? ["expected_observed_mismatch_explanation"]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? ["manual_only_context_refs_not_proof_evidence"]
      : []),
  ]);
  const authorityGaps = [
    "manual_contract_has_no_canonical_perspective_write_authority",
    "manual_contract_has_no_perspective_promotion_authority",
    "manual_contract_has_no_perspective_memory_authority",
    "manual_contract_has_no_work_mutation_authority",
  ];

  return {
    existing_current_working_perspective_update_contract_compatible: false,
    existing_current_working_perspective_apply_write_compatible: false,
    existing_route_integration_contract_compatible: false,
    compatibility_notes: [
      "Manual relay readback preserves source refs for future mapping.",
      "Existing current-working Perspective contract paths require current Perspective material and proof/evidence-style refs this manual preview does not invent.",
      "A future write slice must explicitly map manual relay material into a canonical Perspective update contract with source revalidation.",
    ],
    field_gaps: compatibilityFieldGaps,
    authority_gaps: authorityGaps,
    manual_source_refs_preserved: true,
  };
}

function buildCompatibilityFindings({
  candidateReady,
  fieldGaps,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
  sourceReadbackNoForbiddenWrites,
  sourceReadbackMutationBlockers,
  compatibility,
}: {
  candidateReady: boolean;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
  sourceReadbackNoForbiddenWrites: boolean;
  sourceReadbackMutationBlockers: string[];
  compatibility: ReturnType<typeof buildExistingCompatibility>;
}): ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCompatibilityFinding[] = [
    {
      finding_code: candidateReady
        ? "perspective_relay_ready_for_canonical_update_contract"
        : "perspective_relay_not_ready_for_canonical_update_contract",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "manual_global_dogfood_perspective_relay",
      summary: candidateReady
        ? "The active committed manual Perspective relay record can feed a preview-only canonical Perspective update authorization contract."
        : "The canonical Perspective update authorization preview is blocked by source readback, explanatory material, or source-shape gaps.",
    },
    {
      finding_code:
        "existing_current_working_perspective_update_mapping_requires_future_slice",
      severity: "warning",
      applies_to: "existing_current_working_perspective_update_path",
      summary:
        "The existing CWP update/apply paths are not called here because this manual source lacks canonical Perspective/proof evidence refs and write authority.",
    },
    {
      finding_code: "canonical_perspective_update_write_requires_future_slice",
      severity: "warning",
      applies_to: "future_canonical_perspective_update",
      summary:
        "This preview does not write canonical Perspective state, update current working Perspective, promote Perspective, write memory, mutate work, write proof/evidence, write metrics, or mutate source stores.",
    },
  ];

  if (fieldGaps.length > 0) {
    findings.push({
      finding_code: "canonical_perspective_update_source_field_gaps_present",
      severity: "blocker",
      applies_to: "manual_global_dogfood_perspective_relay",
      summary: `Missing source fields: ${fieldGaps.join(", ")}.`,
    });
  }
  if (!explanatoryMaterialPresent) {
    findings.push({
      finding_code: "canonical_perspective_update_explanation_missing",
      severity: "blocker",
      applies_to: "future_canonical_perspective_update",
      summary:
        "Canonical Perspective update preview requires relay rationale plus expected, observed, and mismatch/gap material before any future write authorization.",
    });
  }
  if (!manualContextNotProofOrEvidence) {
    findings.push({
      finding_code: "canonical_perspective_manual_context_must_not_be_proof",
      severity: "blocker",
      applies_to: "future_canonical_perspective_update",
      summary:
        "Manual-only context refs must remain manual context and cannot be treated as proof/evidence refs.",
    });
  }
  if (!sourceReadbackNoForbiddenWrites) {
    findings.push({
      finding_code:
        "canonical_perspective_update_source_readback_has_forbidden_write_flags",
      severity: "blocker",
      applies_to: "manual_global_dogfood_perspective_relay",
      summary:
        "The source relay readback must preserve no canonical Perspective, promotion, memory, work, metrics, source-store mutation, proof, product, raw text, or operator note flags.",
    });
  }
  for (const blocker of sourceReadbackMutationBlockers) {
    findings.push({
      finding_code: blocker,
      severity: "blocker",
      applies_to: "manual_global_dogfood_perspective_relay",
      summary:
        "A source relay readback mutation/write flag blocks canonical Perspective update authorization preview readiness.",
    });
  }
  for (const gap of compatibility.field_gaps) {
    if (gap.startsWith("field_gap:")) continue;
    findings.push({
      finding_code: `existing_perspective_update_field_gap:${gap}`,
      severity: "warning",
      applies_to: "existing_current_working_perspective_update_path",
      summary: `Existing Perspective update compatibility gap: ${gap}.`,
    });
  }
  return findings;
}

function createCanonicalPerspectiveUpdateNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateNonWriteConfirmation {
  return {
    canonical_perspective_state_written: false,
    current_working_perspective_updated: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_relay_written: false,
    perspective_relay_mutated: false,
    next_work_bias_written: false,
    next_work_bias_mutated: false,
    work_item_written: false,
    work_mutated: false,
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

function buildCanonicalUpdateLabel(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord | null,
) {
  if (!record?.relay_update_label.trim()) return null;
  return `Canonical Perspective update candidate: ${record.relay_update_label}`;
}

function buildCanonicalUpdateRationale(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord | null,
) {
  if (!record?.relay_update_rationale.trim()) return null;
  return `Manual Perspective relay rationale: ${record.relay_update_rationale}`;
}

function strengthHint(outcomeSignal: string | null | undefined) {
  if (outcomeSignal === "positive") return "medium";
  if (outcomeSignal === "negative") return "low";
  if (outcomeSignal === "ambiguous") return "low";
  return "blocked";
}

function normalizeLabel(
  value: string | undefined,
  fallback = DEFAULT_OPERATOR_INTENT_LABEL,
) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 160) : fallback;
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
