import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyContractInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyExistingCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyNonWriteConfirmation,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-contract";
import type {
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_perspective_apply_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE = "perspective_apply_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
  intended_future_apply_target,
}: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContractInput): ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract {
  const source = normalizeReadback(readback);
  const active = source.readback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.canonical_perspective_update_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-canonical-perspective-update-readback:${source.readback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    sourceReadbackPreservesNoApplyWrites(source.readback);
  const sourceAuthorityBoundaryReadOnly =
    sourceAuthorityBoundaryPreservesNoApplyWrites(source.readback);
  const sourceReadbackMutationBlockers =
    buildSourceReadbackMutationBlockers(source.readback);
  const canonicalUpdateLabelPresent = Boolean(
    record?.canonical_update_label.trim(),
  );
  const canonicalUpdateRationalePresent = Boolean(
    record?.canonical_update_rationale.trim(),
  );
  const updateScopeHintIsCanonical =
    record?.update_scope_hint === "canonical_perspective_state";
  const selectedContextPresent =
    (record?.selected_candidate_context_refs.length ?? 0) > 0;
  const candidateCardIdsPresent =
    (record?.source_next_work_candidate_card_ids.length ?? 0) > 0;
  const explanatoryMaterialPresent = Boolean(
    record?.expected_summary?.trim() &&
      record?.observed_summary?.trim() &&
      record?.mismatch_or_gap_summary?.trim() &&
      record?.canonical_update_rationale?.trim(),
  );
  const manualContextNotProofOrEvidence =
    (record?.manual_only_context_refs ?? []).every(
      (ref) => !/^(proof|evidence):/i.test(ref.trim()),
    );
  const blockerReasons = uniqueStrings([
    ...(source.missing
      ? ["source_canonical_perspective_update_readback_missing"]
      : []),
    ...(!active
      ? ["source_canonical_perspective_update_receipt_not_active_committed"]
      : []),
    ...(!record
      ? ["source_canonical_perspective_update_record_missing"]
      : []),
    ...(!record?.canonical_perspective_update_record_fingerprint
      ? ["source_canonical_perspective_update_record_fingerprint_missing"]
      : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...sourceReadbackMutationBlockers,
    ...(!canonicalUpdateLabelPresent ? ["canonical_update_label_missing"] : []),
    ...(!canonicalUpdateRationalePresent
      ? ["canonical_update_rationale_missing"]
      : []),
    ...(!updateScopeHintIsCanonical
      ? ["update_scope_hint_must_be_canonical_perspective_state"]
      : []),
    ...(!selectedContextPresent
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!candidateCardIdsPresent
      ? ["source_next_work_candidate_card_ids_missing"]
      : []),
    ...(!explanatoryMaterialPresent
      ? ["perspective_apply_explanation_insufficient"]
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
    ? "ready_for_future_perspective_apply_write_authorization"
    : "blocked_before_perspective_apply_authorization";
  const normalizedTarget = candidateReady
    ? normalizeApplyTarget(intended_future_apply_target)
    : "blocked";
  const applyLabel = buildApplyLabel(record);
  const applyRationale = buildApplyRationale(record, normalizedTarget);
  const warningReasons = uniqueStrings([
    ...(record?.warnings ?? []),
    ...(record?.manual_only_context_refs.length
      ? ["manual_only_context_refs_preserved_not_proof_evidence"]
      : []),
    ...(normalizedTarget === "current_working_perspective"
      ? ["current_working_perspective_apply_target_requires_future_adapter"]
      : []),
    "perspective_apply_contract_preview_only_no_apply_or_state_write",
    "existing_current_working_perspective_apply_path_requires_separate_mapping",
  ]);
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodPerspectiveApplyAuthorityBoundary();
  const nonWriteConfirmation = createPerspectiveApplyNonWriteConfirmation();
  const compatibility = buildExistingCompatibility({
    record,
    fieldGaps,
    explanatoryMaterialPresent,
    manualContextNotProofOrEvidence,
    normalizedTarget,
  });
  const compatibilitySummary = buildCompatibilitySummary(compatibility);
  const idempotencyKey = `manual-global-dogfood-perspective-apply-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_VERSION,
    source_canonical_perspective_update_receipt_id:
      receipt?.receipt_id ?? null,
    source_canonical_perspective_update_record_id:
      record?.canonical_perspective_update_record_id ?? null,
    source_canonical_perspective_update_record_fingerprint:
      record?.canonical_perspective_update_record_fingerprint ?? null,
    source_perspective_relay_receipt_id:
      receipt?.source_perspective_relay_receipt_id ?? null,
    source_perspective_relay_record_id:
      receipt?.source_perspective_relay_record_id ?? null,
    source_perspective_relay_record_fingerprint:
      receipt?.source_perspective_relay_record_fingerprint ?? null,
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
    canonical_update_label: record?.canonical_update_label ?? null,
    canonical_update_rationale: record?.canonical_update_rationale ?? null,
    relay_update_label: record?.relay_update_label ?? null,
    relay_update_rationale: record?.relay_update_rationale ?? null,
    recommended_next_work_label: record?.recommended_next_work_label ?? null,
    outcome_label: record?.outcome_label ?? null,
    outcome_signal: record?.outcome_signal ?? null,
    intended_future_apply_target: normalizedTarget,
    update_scope_hint: record?.update_scope_hint ?? null,
    update_strength_hint: record?.update_strength_hint ?? null,
    selected_candidate_context_refs:
      record?.selected_candidate_context_refs ?? [],
    source_next_work_candidate_card_ids:
      record?.source_next_work_candidate_card_ids ?? [],
    manual_only_context_refs: record?.manual_only_context_refs ?? [],
    expected_summary: record?.expected_summary ?? null,
    observed_summary: record?.observed_summary ?? null,
    mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
    source_line: record?.source_line ?? null,
  })}`;
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_VERSION,
    scope: source.readback.scope,
    source_readback_ref: sourceReadbackRef,
    source_canonical_perspective_update_receipt_id:
      receipt?.receipt_id ?? null,
    source_canonical_perspective_update_record_id:
      record?.canonical_perspective_update_record_id ?? null,
    source_canonical_perspective_update_record_fingerprint:
      record?.canonical_perspective_update_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_CONTRACT_VERSION,
    scope: source.readback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_canonical_perspective_update_readback_ref: sourceReadbackRef,
    source_canonical_perspective_update_receipt_id:
      receipt?.receipt_id ?? null,
    source_canonical_perspective_update_record_id:
      record?.canonical_perspective_update_record_id ?? null,
    source_canonical_perspective_update_record_fingerprint:
      record?.canonical_perspective_update_record_fingerprint ?? null,
    source_perspective_relay_receipt_id:
      receipt?.source_perspective_relay_receipt_id ?? null,
    source_perspective_relay_record_id:
      receipt?.source_perspective_relay_record_id ?? null,
    source_perspective_relay_record_fingerprint:
      receipt?.source_perspective_relay_record_fingerprint ?? null,
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
    proposed_perspective_apply_mapping: {
      apply_label: applyLabel,
      apply_rationale: applyRationale,
      canonical_update_label: record?.canonical_update_label ?? null,
      canonical_update_rationale: record?.canonical_update_rationale ?? null,
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
      compatibility_findings_summary: compatibilitySummary,
      blockers: blockerReasons,
      warnings: warningReasons,
      intended_future_apply_target: normalizedTarget,
      can_feed_future_perspective_apply_write_candidate: candidateReady,
      can_update_current_working_perspective_now: false,
      can_write_canonical_perspective_state_now: false,
      can_promote_perspective_now: false,
      can_write_perspective_memory_now: false,
      can_mutate_work_now: false,
      can_write_proof_or_evidence_now: false,
      can_mutate_source_records_now: false,
    },
    proposed_apply_candidate: {
      candidate_kind: "manual_global_dogfood_perspective_apply_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_perspective_apply_write_authorization"
        : "blocked_before_perspective_apply_authorization",
      apply_scope_hint: candidateReady
        ? "canonical_perspective_state"
        : "blocked",
      apply_strength_hint: candidateReady
        ? strengthHint(record?.update_strength_hint)
        : "blocked",
      reason: candidateReady
        ? "Active committed manual canonical Perspective update material can be reviewed for a future separately authorized Perspective apply write."
        : "Source canonical Perspective update readback lacks the active, explanatory, canonical-scope, no-source-mutation shape required before apply authorization.",
      writes_now: false,
      would_update_current_working_perspective: false,
      would_write_canonical_perspective_state: false,
      would_promote_perspective: false,
      would_write_perspective_memory: false,
      would_mutate_work: false,
      would_write_proof_or_evidence: false,
    },
    proposed_existing_apply_path_compatibility: compatibility,
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_perspective_apply_write: true,
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
      "explicit_operator_acceptance_of_perspective_apply_contract",
      "separate_future_perspective_apply_write_slice",
      "fresh_operator_confirmation_text_for_perspective_apply_write",
      "future_idempotent_perspective_apply_writer_contract",
      "no_current_working_perspective_canonical_state_promotion_memory_work_proof_or_metric_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_canonical_perspective_update_receipt_is_still_active_committed",
      "confirm_canonical_perspective_update_record_fingerprint_still_matches_readback",
      "confirm_relay_signal_bias_source_refs_still_match",
      "confirm_expected_observed_mismatch_material_still_explains_the_apply_candidate",
      "confirm_manual_only_context_refs_are_not_proof_or_evidence_refs",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        nonWriteConfirmation.current_working_perspective_updated === false &&
        nonWriteConfirmation.canonical_perspective_state_written === false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_write_canonical_perspective_state === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_canonical_perspective_update_receipt_present:
        Boolean(active),
      active_committed_canonical_perspective_update_record_present:
        Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      canonical_update_label_present: canonicalUpdateLabelPresent,
      canonical_update_rationale_present: canonicalUpdateRationalePresent,
      update_scope_hint_is_canonical_perspective_state:
        updateScopeHintIsCanonical,
      explanatory_expected_observed_material_present:
        explanatoryMaterialPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      source_next_work_candidate_card_ids_present: candidateCardIdsPresent,
      manual_context_not_proof_or_evidence: manualContextNotProofOrEvidence,
      source_readback_preserves_no_apply_state_promotion_memory_work_proof_metric_writes:
        sourceReadbackNoForbiddenWrites && sourceAuthorityBoundaryReadOnly,
      no_write_authority:
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_write_canonical_perspective_state === false &&
        authorityBoundary.can_promote_perspective === false &&
        authorityBoundary.can_write_perspective_memory === false &&
        authorityBoundary.can_mutate_work === false &&
        authorityBoundary.can_write_proof_or_evidence === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice: candidateReady
      ? "If accepted locally, implement a separate explicitly authorized idempotent Perspective apply write slice with source revalidation, duplicate replay, rollback/supersede, and row-count validation."
      : "Resolve canonical Perspective update readback blockers before preparing Perspective apply write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveApplyAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveApplyAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_update_current_working_perspective: false,
    can_write_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_canonical_perspective_update_record: false,
    can_mutate_perspective_relay: false,
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
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback;
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
      readback:
        value as ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
      missing: false,
    };
  }

  return {
    readback: {
      readback_kind:
        "research_candidate_manual_global_dogfood_canonical_perspective_update_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_canonical_perspective_update_readback.v0.1",
      scope: DEFAULT_SCOPE,
      storage_path: "manual_specific_canonical_perspective_update_tables",
      records_by_receipt: [],
      latest_receipts: [],
      latest_active_committed: null,
      count: 0,
      authority_boundary: createMissingSourceAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      canonical_perspective_update_record_written: false,
      canonical_perspective_state_written: false,
      current_working_perspective_updated: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      perspective_relay_mutated: false,
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

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteAuthorityBoundary {
  return {
    can_write_canonical_perspective_update_record: true,
    can_write_canonical_perspective_update_receipt: true,
    can_write_canonical_perspective_update_rollback_metadata: true,
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
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

function buildFieldGaps({
  receipt,
  record,
}: {
  receipt: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id
      ? "source_canonical_perspective_update_receipt_id"
      : null,
    !record?.canonical_perspective_update_record_id
      ? "source_canonical_perspective_update_record_id"
      : null,
    !record?.canonical_perspective_update_record_fingerprint
      ? "source_canonical_perspective_update_record_fingerprint"
      : null,
    !receipt?.source_perspective_relay_receipt_id
      ? "source_perspective_relay_receipt_id"
      : null,
    !receipt?.source_perspective_relay_record_id
      ? "source_perspective_relay_record_id"
      : null,
    !receipt?.source_perspective_relay_record_fingerprint
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

function sourceReadbackPreservesNoApplyWrites(
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
) {
  return (
    readback.canonical_perspective_state_written === false &&
    readback.current_working_perspective_updated === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.perspective_relay_mutated === false &&
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

function sourceAuthorityBoundaryPreservesNoApplyWrites(
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
) {
  const boundary = readback.authority_boundary;
  return (
    boundary.can_write_canonical_perspective_state === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_perspective_relay === false &&
    boundary.can_mutate_perspective_relay === false &&
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
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
) {
  return uniqueStrings([
    readback.canonical_perspective_state_written
      ? "source_canonical_update_readback_state_already_written"
      : null,
    readback.current_working_perspective_updated
      ? "source_canonical_update_readback_current_working_perspective_updated"
      : null,
    readback.perspective_promoted
      ? "source_canonical_update_readback_perspective_promoted"
      : null,
    readback.perspective_memory_written
      ? "source_canonical_update_readback_perspective_memory_written"
      : null,
    readback.work_mutated
      ? "source_canonical_update_readback_work_mutated"
      : null,
    readback.proof_or_evidence_rows_written
      ? "source_canonical_update_readback_proof_or_evidence_written"
      : null,
    readback.dogfood_metrics_written ||
    readback.global_dogfood_ledger_mutated ||
    readback.metric_snapshot_mutated ||
    readback.next_work_signal_decision_mutated ||
    readback.next_work_bias_mutated ||
    readback.perspective_relay_mutated
      ? "source_canonical_update_readback_metric_or_source_store_mutated"
      : null,
    readback.raw_manual_note_text_present ||
    readback.raw_result_report_text_present ||
    readback.operator_notes_persisted
      ? "source_canonical_update_raw_text_or_operator_note_present"
      : null,
    readback.product_write_executed
      ? "source_canonical_update_product_write_executed"
      : null,
  ]);
}

function buildExistingCompatibility({
  record,
  fieldGaps,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
  normalizedTarget,
}: {
  record: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord | null;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
  normalizedTarget: ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget;
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyExistingCompatibility {
  const compatibilityFieldGaps = uniqueStrings([
    ...fieldGaps,
    "current_working_perspective_material_not_supplied",
    "current_working_perspective_update_contract_record_not_supplied",
    "canonical_perspective_state_ref_not_supplied",
    "perspective_apply_patch_entries_not_supplied",
    "proof_or_evidence_refs_not_supplied_by_manual_path",
    ...(!record?.canonical_update_label ? ["canonical_update_label"] : []),
    ...(!record?.canonical_update_rationale
      ? ["canonical_update_rationale"]
      : []),
    ...(!explanatoryMaterialPresent
      ? ["expected_observed_mismatch_explanation"]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? ["manual_only_context_refs_not_proof_evidence"]
      : []),
  ]);
  const authorityGaps = [
    "manual_apply_contract_has_no_current_working_perspective_update_authority",
    "manual_apply_contract_has_no_canonical_perspective_state_write_authority",
    "manual_apply_contract_has_no_perspective_promotion_authority",
    "manual_apply_contract_has_no_perspective_memory_authority",
    "manual_apply_contract_has_no_work_mutation_authority",
  ];
  const sourceLineageGaps = [
    "existing_current_working_apply_path_requires_cwp_record_lineage",
    "existing_current_working_apply_path_requires_cwp_material",
    "manual_only_context_refs_are_not_evidence_refs",
  ];

  return {
    existing_current_working_perspective_update_contract_preview_compatible:
      false,
    existing_current_working_perspective_update_contract_write_compatible:
      false,
    existing_current_working_perspective_apply_preview_compatible: false,
    existing_current_working_perspective_apply_write_compatible: false,
    existing_route_integration_contract_compatible: false,
    compatibility_notes: [
      "Manual canonical Perspective update readback preserves source refs for future apply mapping.",
      "Existing current-working Perspective apply paths require current Perspective material, patch entries, and proof/evidence-style refs this manual preview does not invent.",
      normalizedTarget === "current_working_perspective"
        ? "Current-working Perspective can only be considered after a future explicit adapter maps manual material into honest CWP lineage."
        : "The default future apply target remains canonical Perspective state, while current-working Perspective compatibility stays false for this manual source.",
    ],
    field_gaps: compatibilityFieldGaps,
    authority_gaps: authorityGaps,
    source_lineage_gaps: sourceLineageGaps,
    manual_source_refs_preserved: true,
    recommended_future_mapping_path: record
      ? "manual_specific_apply_write_contract"
      : "blocked",
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
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodPerspectiveApplyCompatibilityFinding[] = [
    {
      finding_code: candidateReady
        ? "canonical_perspective_update_ready_for_apply_contract"
        : "canonical_perspective_update_not_ready_for_apply_contract",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "manual_global_dogfood_canonical_perspective_update",
      summary: candidateReady
        ? "The active committed manual canonical Perspective update record can feed a preview-only Perspective apply authorization contract."
        : "The Perspective apply authorization preview is blocked by source readback, explanatory material, source-shape, or scope gaps.",
    },
    {
      finding_code:
        "existing_current_working_perspective_apply_mapping_requires_future_adapter",
      severity: "warning",
      applies_to: "existing_current_working_perspective_apply_path",
      summary:
        "The existing CWP apply paths are not called here because this manual source lacks current Perspective material, CWP update records, proof/evidence refs, and write authority.",
    },
    {
      finding_code: "perspective_apply_write_requires_future_slice",
      severity: "warning",
      applies_to: "future_perspective_apply",
      summary:
        "This preview does not update current-working Perspective, write canonical Perspective state, promote Perspective, write memory, mutate work, write proof/evidence, write metrics, or mutate source stores.",
    },
  ];

  if (fieldGaps.length > 0) {
    findings.push({
      finding_code: "perspective_apply_source_field_gaps_present",
      severity: "blocker",
      applies_to: "manual_global_dogfood_canonical_perspective_update",
      summary: `Missing source fields: ${fieldGaps.join(", ")}.`,
    });
  }
  if (!explanatoryMaterialPresent) {
    findings.push({
      finding_code: "perspective_apply_explanation_missing",
      severity: "blocker",
      applies_to: "future_perspective_apply",
      summary:
        "Perspective apply preview requires canonical update rationale plus expected, observed, and mismatch/gap material before future apply authorization.",
    });
  }
  if (!manualContextNotProofOrEvidence) {
    findings.push({
      finding_code: "perspective_apply_manual_context_must_not_be_proof",
      severity: "blocker",
      applies_to: "future_perspective_apply",
      summary:
        "Manual-only context refs must remain manual context and cannot be treated as proof/evidence refs.",
    });
  }
  if (!sourceReadbackNoForbiddenWrites) {
    findings.push({
      finding_code: "perspective_apply_source_readback_has_forbidden_write_flags",
      severity: "blocker",
      applies_to: "manual_global_dogfood_canonical_perspective_update",
      summary:
        "The source canonical update readback must preserve no apply, state, promotion, memory, work, metrics, source-store mutation, proof, product, raw text, or operator note flags.",
    });
  }
  for (const blocker of sourceReadbackMutationBlockers) {
    findings.push({
      finding_code: blocker,
      severity: "blocker",
      applies_to: "manual_global_dogfood_canonical_perspective_update",
      summary:
        "A source canonical update readback mutation/write flag blocks Perspective apply authorization preview readiness.",
    });
  }
  for (const gap of [
    ...compatibility.field_gaps,
    ...compatibility.source_lineage_gaps,
  ]) {
    findings.push({
      finding_code: `existing_perspective_apply_gap:${gap}`,
      severity: "warning",
      applies_to: "existing_current_working_perspective_apply_path",
      summary: `Existing Perspective apply compatibility gap: ${gap}.`,
    });
  }

  return findings;
}

function buildCompatibilitySummary(
  compatibility: ResearchCandidateManualGlobalDogfoodPerspectiveApplyExistingCompatibility,
) {
  return uniqueStrings([
    ...compatibility.compatibility_notes,
    ...compatibility.field_gaps.map((gap) => `field_gap:${gap}`),
    ...compatibility.authority_gaps.map((gap) => `authority_gap:${gap}`),
    ...compatibility.source_lineage_gaps.map((gap) => `lineage_gap:${gap}`),
  ]);
}

function createPerspectiveApplyNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodPerspectiveApplyNonWriteConfirmation {
  return {
    current_working_perspective_updated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    canonical_perspective_update_record_mutated: false,
    perspective_relay_mutated: false,
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

function buildApplyLabel(
  record: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord | null,
) {
  if (!record?.canonical_update_label.trim()) return null;
  return `Apply manual canonical update: ${record.canonical_update_label.trim()}`;
}

function buildApplyRationale(
  record: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord | null,
  target: ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget,
) {
  if (!record?.canonical_update_rationale.trim()) return null;
  return `Future ${target} apply review should preserve the manual canonical update rationale: ${record.canonical_update_rationale.trim()}`;
}

function normalizeApplyTarget(
  value: ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget | undefined,
): ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget {
  if (
    value === "canonical_perspective_state" ||
    value === "current_working_perspective"
  ) {
    return value;
  }
  return "canonical_perspective_state";
}

function strengthHint(value: string | undefined) {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

function normalizeLabel(value: string | undefined, fallback = DEFAULT_OPERATOR_INTENT_LABEL) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 160) : fallback;
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
