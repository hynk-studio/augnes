import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContractInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterNonWriteConfirmation,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateAdapterCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingAdapterCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveManualAdapterWritePath,
} from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_perspective_adapter_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE = "perspective_adapter_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
  intended_future_adapter_target,
}: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContractInput): ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract {
  const source = normalizeReadback(readback);
  const active = source.readback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.perspective_state_mutation_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-perspective-state-mutation-readback:${source.readback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    sourceReadbackPreservesNoAdapterWrites(source.readback);
  const sourceAuthorityBoundaryReadOnly =
    sourceAuthorityBoundaryPreservesNoAdapterWrites(source.readback);
  const sourceReadbackMutationBlockers =
    buildSourceReadbackMutationBlockers(source.readback);
  const mutationLabelPresent = Boolean(record?.mutation_label.trim());
  const mutationRationalePresent = Boolean(record?.mutation_rationale.trim());
  const intendedMutationTargetIsCanonical =
    record?.intended_future_mutation_target === "canonical_perspective_state";
  const mutationScopeHintIsCanonical =
    record?.mutation_scope_hint === "canonical_perspective_state";
  const selectedContextPresent =
    (record?.selected_candidate_context_refs.length ?? 0) > 0;
  const candidateCardIdsPresent =
    (record?.source_next_work_candidate_card_ids.length ?? 0) > 0;
  const explanatoryMaterialPresent = Boolean(
    record?.expected_summary?.trim() &&
      record?.observed_summary?.trim() &&
      record?.mismatch_or_gap_summary?.trim() &&
      record?.mutation_rationale?.trim(),
  );
  const manualContextNotProofOrEvidence =
    (record?.manual_only_context_refs ?? []).every(
      (ref) => !/^(proof|evidence):/i.test(ref.trim()),
    );
  const normalizedTarget = normalizeAdapterTarget(
    intended_future_adapter_target,
  );
  const defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget =
    normalizedTarget === "manual_specific_current_working_adapter"
      ? "manual_specific_current_working_adapter"
      : "manual_specific_canonical_state_adapter";
  const requestedExistingCurrentWorking =
    normalizedTarget === "existing_current_working_perspective_adapter";
  const requestedExistingCanonical =
    normalizedTarget === "existing_canonical_perspective_state_adapter";
  const blockerReasons = uniqueStrings([
    ...(source.missing
      ? ["source_perspective_state_mutation_readback_missing"]
      : []),
    ...(!active
      ? ["source_perspective_state_mutation_receipt_not_active_committed"]
      : []),
    ...(!record ? ["source_perspective_state_mutation_record_missing"] : []),
    ...(!record?.perspective_state_mutation_record_fingerprint
      ? ["source_perspective_state_mutation_record_fingerprint_missing"]
      : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...sourceReadbackMutationBlockers,
    ...(!mutationLabelPresent ? ["mutation_label_missing"] : []),
    ...(!mutationRationalePresent ? ["mutation_rationale_missing"] : []),
    ...(!intendedMutationTargetIsCanonical
      ? ["intended_future_mutation_target_must_be_canonical_perspective_state"]
      : []),
    ...(!mutationScopeHintIsCanonical
      ? ["mutation_scope_hint_must_be_canonical_perspective_state"]
      : []),
    ...(!selectedContextPresent
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!candidateCardIdsPresent
      ? ["source_next_work_candidate_card_ids_missing"]
      : []),
    ...(!explanatoryMaterialPresent
      ? ["perspective_adapter_explanation_insufficient"]
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
    ...(requestedExistingCurrentWorking
      ? ["existing_current_working_adapter_lineage_gap"]
      : []),
    ...(requestedExistingCanonical
      ? ["existing_canonical_state_adapter_lineage_gap"]
      : []),
  ]);
  const candidateReady = blockerReasons.length === 0;
  const operatorAuthorizationMode = candidateReady
    ? "ready_for_future_perspective_adapter_write_authorization"
    : "blocked_before_perspective_adapter_authorization";
  const effectiveTarget = candidateReady ? normalizedTarget : "blocked";
  const adapterLabel = buildAdapterLabel(record, defaultTarget);
  const adapterRationale = buildAdapterRationale(record, defaultTarget);
  const warningReasons = uniqueStrings([
    ...(record?.warnings ?? []),
    ...(record?.manual_only_context_refs.length
      ? ["manual_only_context_refs_preserved_not_proof_evidence"]
      : []),
    "perspective_adapter_contract_preview_only_no_current_working_or_canonical_state_write",
    "existing_current_working_adapter_compatibility_false_until_manual_lineage_mapping_exists",
    "existing_canonical_state_adapter_compatibility_false_until_manual_lineage_mapping_exists",
  ]);
  const currentWorkingCompatibility = buildExistingCurrentWorkingCompatibility({
    fieldGaps,
    record,
    explanatoryMaterialPresent,
    manualContextNotProofOrEvidence,
  });
  const canonicalCompatibility = buildExistingCanonicalStateCompatibility({
    fieldGaps,
    record,
    explanatoryMaterialPresent,
    manualContextNotProofOrEvidence,
  });
  const manualWritePath = buildManualAdapterWritePath({
    candidateReady,
    target: effectiveTarget,
  });
  const compatibilitySummary = buildCompatibilitySummary({
    currentWorkingCompatibility,
    canonicalCompatibility,
    manualWritePath,
  });
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary();
  const nonWriteConfirmation = createPerspectiveAdapterNonWriteConfirmation();
  const idempotencyKey = `manual-global-dogfood-perspective-adapter-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_VERSION,
    source_perspective_state_mutation_receipt_id: receipt?.receipt_id ?? null,
    source_perspective_state_mutation_record_id:
      record?.perspective_state_mutation_record_id ?? null,
    source_perspective_state_mutation_record_fingerprint:
      record?.perspective_state_mutation_record_fingerprint ?? null,
    source_perspective_apply_receipt_id:
      receipt?.source_perspective_apply_receipt_id ?? null,
    source_perspective_apply_record_id:
      receipt?.source_perspective_apply_record_id ?? null,
    source_perspective_apply_record_fingerprint:
      receipt?.source_perspective_apply_record_fingerprint ?? null,
    source_canonical_perspective_update_receipt_id:
      receipt?.source_canonical_perspective_update_receipt_id ?? null,
    source_canonical_perspective_update_record_id:
      receipt?.source_canonical_perspective_update_record_id ?? null,
    source_canonical_perspective_update_record_fingerprint:
      receipt?.source_canonical_perspective_update_record_fingerprint ?? null,
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
    source_projection_fingerprint:
      receipt?.source_projection_fingerprint ?? null,
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
    adapter_label: adapterLabel,
    adapter_rationale: adapterRationale,
    mutation_label: record?.mutation_label ?? null,
    mutation_rationale: record?.mutation_rationale ?? null,
    apply_label: record?.apply_label ?? null,
    apply_rationale: record?.apply_rationale ?? null,
    canonical_update_label: record?.canonical_update_label ?? null,
    canonical_update_rationale: record?.canonical_update_rationale ?? null,
    relay_update_label: record?.relay_update_label ?? null,
    relay_update_rationale: record?.relay_update_rationale ?? null,
    recommended_next_work_label: record?.recommended_next_work_label ?? null,
    outcome_label: record?.outcome_label ?? null,
    outcome_signal: record?.outcome_signal ?? null,
    intended_future_adapter_target: effectiveTarget,
    intended_future_mutation_target:
      record?.intended_future_mutation_target ?? null,
    mutation_scope_hint: record?.mutation_scope_hint ?? null,
    mutation_strength_hint: record?.mutation_strength_hint ?? null,
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
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_VERSION,
    scope: source.readback.scope,
    source_readback_ref: sourceReadbackRef,
    source_perspective_state_mutation_receipt_id: receipt?.receipt_id ?? null,
    source_perspective_state_mutation_record_id:
      record?.perspective_state_mutation_record_id ?? null,
    source_perspective_state_mutation_record_fingerprint:
      record?.perspective_state_mutation_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_VERSION,
    scope: source.readback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_perspective_state_mutation_readback_ref: sourceReadbackRef,
    source_perspective_state_mutation_receipt_id: receipt?.receipt_id ?? null,
    source_perspective_state_mutation_record_id:
      record?.perspective_state_mutation_record_id ?? null,
    source_perspective_state_mutation_record_fingerprint:
      record?.perspective_state_mutation_record_fingerprint ?? null,
    source_perspective_apply_receipt_id:
      receipt?.source_perspective_apply_receipt_id ?? null,
    source_perspective_apply_record_id:
      receipt?.source_perspective_apply_record_id ?? null,
    source_perspective_apply_record_fingerprint:
      receipt?.source_perspective_apply_record_fingerprint ?? null,
    source_canonical_perspective_update_receipt_id:
      receipt?.source_canonical_perspective_update_receipt_id ?? null,
    source_canonical_perspective_update_record_id:
      receipt?.source_canonical_perspective_update_record_id ?? null,
    source_canonical_perspective_update_record_fingerprint:
      receipt?.source_canonical_perspective_update_record_fingerprint ?? null,
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
    source_projection_fingerprint:
      receipt?.source_projection_fingerprint ?? null,
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
    proposed_adapter_mapping: {
      adapter_label: adapterLabel,
      adapter_rationale: adapterRationale,
      mutation_label: record?.mutation_label ?? null,
      mutation_rationale: record?.mutation_rationale ?? null,
      apply_label: record?.apply_label ?? null,
      apply_rationale: record?.apply_rationale ?? null,
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
      intended_future_adapter_target: effectiveTarget,
      default_future_adapter_target: candidateReady ? defaultTarget : "blocked",
      can_feed_future_adapter_write_candidate: candidateReady,
      can_update_current_working_perspective_now: false,
      can_write_existing_canonical_perspective_state_now: false,
      can_promote_perspective_now: false,
      can_write_perspective_memory_now: false,
      can_mutate_work_now: false,
      can_write_proof_or_evidence_now: false,
      can_mutate_source_records_now: false,
    },
    proposed_adapter_candidate: {
      candidate_kind: "manual_global_dogfood_perspective_adapter_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_perspective_adapter_write_authorization"
        : "blocked_before_perspective_adapter_authorization",
      adapter_scope_hint: candidateReady
        ? adapterScopeHint(defaultTarget)
        : "blocked",
      adapter_strength_hint: candidateReady
        ? strengthHint(record?.mutation_strength_hint)
        : "blocked",
      reason: candidateReady
        ? "Active committed manual Perspective state mutation material can feed a future separately authorized manual-specific Perspective adapter write contract."
        : "Source Perspective state mutation readback lacks the active, explanatory, canonical-scope, no-source-mutation shape required before adapter authorization.",
      writes_now: false,
      would_update_current_working_perspective: false,
      would_write_existing_canonical_perspective_state: false,
      would_promote_perspective: false,
      would_write_perspective_memory: false,
      would_mutate_work: false,
      would_write_proof_or_evidence: false,
    },
    proposed_existing_current_working_adapter_compatibility:
      currentWorkingCompatibility,
    proposed_existing_canonical_state_adapter_compatibility:
      canonicalCompatibility,
    proposed_manual_adapter_write_path: manualWritePath,
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_perspective_adapter_write: true,
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
      currentWorkingCompatibility,
      canonicalCompatibility,
      manualWritePath,
    }),
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_perspective_adapter_contract",
      "separate_future_perspective_adapter_write_slice",
      "fresh_operator_confirmation_text_for_perspective_adapter_write",
      "future_idempotent_perspective_adapter_writer_contract",
      "no_current_working_perspective_or_existing_canonical_state_write_without_separate_contract",
      "no_proof_evidence_or_perspective_memory_fabrication",
    ],
    required_future_checks: [
      "confirm_perspective_state_mutation_receipt_is_still_active_committed",
      "confirm_perspective_state_mutation_record_fingerprint_still_matches_readback",
      "confirm_apply_canonical_update_relay_signal_bias_source_refs_still_match",
      "confirm_expected_observed_mismatch_material_still_explains_the_adapter_mapping",
      "confirm_manual_only_context_refs_are_not_proof_or_evidence_refs",
      "confirm_existing_current_working_or_canonical_state_writer_compatibility_before_reuse",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        nonWriteConfirmation.current_working_perspective_updated === false &&
        nonWriteConfirmation.existing_canonical_perspective_state_table_mutated ===
          false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_write_existing_canonical_perspective_state ===
          false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_perspective_state_mutation_receipt_present:
        Boolean(active),
      active_committed_perspective_state_mutation_record_present:
        Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      mutation_label_present: mutationLabelPresent,
      mutation_rationale_present: mutationRationalePresent,
      intended_future_mutation_target_is_canonical_perspective_state:
        intendedMutationTargetIsCanonical,
      mutation_scope_hint_is_canonical_perspective_state:
        mutationScopeHintIsCanonical,
      explanatory_expected_observed_material_present:
        explanatoryMaterialPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      source_next_work_candidate_card_ids_present: candidateCardIdsPresent,
      manual_context_not_proof_or_evidence: manualContextNotProofOrEvidence,
      source_readback_preserves_no_current_working_canonical_state_promotion_memory_work_proof_metric_writes:
        sourceReadbackNoForbiddenWrites && sourceAuthorityBoundaryReadOnly,
      no_write_authority:
        authorityBoundary.can_write_perspective_adapter_record === false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_write_existing_canonical_perspective_state ===
          false &&
        authorityBoundary.can_promote_perspective === false &&
        authorityBoundary.can_write_perspective_memory === false &&
        authorityBoundary.can_mutate_work === false &&
        authorityBoundary.can_write_proof_or_evidence === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice: candidateReady
      ? "If accepted locally, implement a separate explicitly authorized idempotent Perspective adapter write slice with source revalidation, duplicate replay, rollback/supersede, and row-count validation."
      : "Resolve Perspective state mutation readback blockers before preparing Perspective adapter write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_perspective_adapter_record: false,
    can_update_current_working_perspective: false,
    can_write_existing_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_state_mutation_record: false,
    can_mutate_perspective_apply_record: false,
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
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback;
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
        value as ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback,
      missing: false,
    };
  }

  return {
    readback: {
      readback_kind:
        "research_candidate_manual_global_dogfood_perspective_state_mutation_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_perspective_state_mutation_readback.v0.1",
      scope: DEFAULT_SCOPE,
      storage_path: "manual_specific_perspective_state_mutation_tables",
      records_by_receipt: [],
      latest_receipts: [],
      latest_active_committed: null,
      count: 0,
      authority_boundary: createMissingSourceAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      perspective_state_mutation_record_written: false,
      manual_canonical_perspective_state_mutation_record_written: false,
      current_working_perspective_updated: false,
      direct_canonical_perspective_state_table_mutated: false,
      canonical_perspective_state_written: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      perspective_apply_record_mutated: false,
      canonical_perspective_update_record_mutated: false,
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

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteAuthorityBoundary {
  return {
    can_write_perspective_state_mutation_record: true,
    can_write_perspective_state_mutation_receipt: true,
    can_write_perspective_state_mutation_rollback_metadata: true,
    can_write_manual_canonical_perspective_state_mutation_record: true,
    can_write_direct_canonical_perspective_state_table: false,
    source_of_truth: false,
    can_write_canonical_perspective_state: false,
    can_update_current_working_perspective: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_apply_record: false,
    can_mutate_canonical_perspective_update_record: false,
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
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id
      ? "source_perspective_state_mutation_receipt_id"
      : null,
    !record?.perspective_state_mutation_record_id
      ? "source_perspective_state_mutation_record_id"
      : null,
    !record?.perspective_state_mutation_record_fingerprint
      ? "source_perspective_state_mutation_record_fingerprint"
      : null,
    !receipt?.source_perspective_apply_receipt_id
      ? "source_perspective_apply_receipt_id"
      : null,
    !receipt?.source_perspective_apply_record_id
      ? "source_perspective_apply_record_id"
      : null,
    !receipt?.source_perspective_apply_record_fingerprint
      ? "source_perspective_apply_record_fingerprint"
      : null,
    !receipt?.source_canonical_perspective_update_receipt_id
      ? "source_canonical_perspective_update_receipt_id"
      : null,
    !receipt?.source_canonical_perspective_update_record_id
      ? "source_canonical_perspective_update_record_id"
      : null,
    !receipt?.source_canonical_perspective_update_record_fingerprint
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

function sourceReadbackPreservesNoAdapterWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback,
) {
  return (
    readback.current_working_perspective_updated === false &&
    readback.direct_canonical_perspective_state_table_mutated === false &&
    readback.canonical_perspective_state_written === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.perspective_apply_record_mutated === false &&
    readback.canonical_perspective_update_record_mutated === false &&
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

function sourceAuthorityBoundaryPreservesNoAdapterWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback,
) {
  const boundary = readback.authority_boundary;
  return (
    boundary.can_write_direct_canonical_perspective_state_table === false &&
    boundary.can_write_canonical_perspective_state === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_mutate_perspective_apply_record === false &&
    boundary.can_mutate_canonical_perspective_update_record === false &&
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
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback,
) {
  return uniqueStrings([
    readback.current_working_perspective_updated
      ? "source_state_mutation_readback_current_working_perspective_already_updated"
      : null,
    readback.direct_canonical_perspective_state_table_mutated ||
    readback.canonical_perspective_state_written
      ? "source_state_mutation_readback_direct_canonical_state_already_mutated"
      : null,
    readback.perspective_promoted
      ? "source_state_mutation_readback_perspective_promoted"
      : null,
    readback.perspective_memory_written
      ? "source_state_mutation_readback_perspective_memory_written"
      : null,
    readback.work_mutated
      ? "source_state_mutation_readback_work_mutated"
      : null,
    readback.proof_or_evidence_rows_written
      ? "source_state_mutation_readback_proof_or_evidence_written"
      : null,
    readback.dogfood_metrics_written ||
    readback.global_dogfood_ledger_mutated ||
    readback.metric_snapshot_mutated ||
    readback.next_work_signal_decision_mutated ||
    readback.next_work_bias_mutated ||
    readback.perspective_relay_mutated ||
    readback.canonical_perspective_update_record_mutated ||
    readback.perspective_apply_record_mutated
      ? "source_state_mutation_readback_metric_or_source_store_mutated"
      : null,
    readback.raw_manual_note_text_present ||
    readback.raw_result_report_text_present ||
    readback.operator_notes_persisted
      ? "source_state_mutation_raw_text_or_operator_note_present"
      : null,
    readback.product_write_executed
      ? "source_state_mutation_product_write_executed"
      : null,
  ]);
}

function buildExistingCurrentWorkingCompatibility({
  fieldGaps,
  record,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
}: {
  fieldGaps: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationRecord | null;
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingAdapterCompatibility {
  const missingCurrentWorkingRefs = [
    "current_working_perspective_ref",
    "current_working_perspective_update_contract_record_ref",
    "current_working_perspective_update_contract_record_fingerprint",
    "current_working_perspective_patch_entries",
    "current_working_perspective_operator_ref",
    "current_working_perspective_review_confirmation_ref",
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
      "Manual Perspective state mutation readback preserves manual source refs for future adapter mapping.",
      "Existing current-working Perspective apply paths require CWP material, CWP update contract records, patch entries, source refs, evidence refs, operator refs, review confirmation, and apply authority this manual preview does not fabricate.",
      "Current-working Perspective can only be considered after a future explicit adapter maps manual material into honest CWP lineage.",
    ],
    field_gaps: uniqueStrings([
      ...fieldGaps,
      ...missingCurrentWorkingRefs,
      "proof_or_evidence_refs_not_supplied_by_manual_path",
      ...(!record?.mutation_label ? ["mutation_label"] : []),
      ...(!record?.mutation_rationale ? ["mutation_rationale"] : []),
      ...(!explanatoryMaterialPresent
        ? ["expected_observed_mismatch_explanation"]
        : []),
      ...(!manualContextNotProofOrEvidence
        ? ["manual_only_context_refs_not_proof_evidence"]
        : []),
    ]),
    authority_gaps: [
      "manual_adapter_contract_has_no_current_working_perspective_update_authority",
      "manual_adapter_contract_has_no_current_working_perspective_apply_authority",
      "manual_adapter_contract_has_no_perspective_memory_authority",
      "manual_adapter_contract_has_no_work_mutation_authority",
      "manual_adapter_contract_has_no_proof_or_evidence_authority",
    ],
    source_lineage_gaps: [
      "existing_current_working_update_path_requires_current_cwp_lineage",
      "existing_current_working_apply_path_requires_update_contract_record_lineage",
      "existing_current_working_apply_path_requires_patch_application_material",
      "manual_only_context_refs_are_not_evidence_refs",
    ],
    missing_current_working_refs: missingCurrentWorkingRefs,
    manual_source_refs_preserved: true,
    recommended_future_mapping_path: record
      ? "manual_specific_current_working_adapter_contract"
      : "blocked",
  };
}

function buildExistingCanonicalStateCompatibility({
  fieldGaps,
  record,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
}: {
  fieldGaps: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationRecord | null;
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateAdapterCompatibility {
  const missingCanonicalStateRefs = [
    "durable_perspective_id",
    "durable_perspective_state_ref",
    "promotion_decision_id",
    "formation_receipt_id",
    "review_record_ref",
    "operator_actor_ref",
    "durable_state_apply_operation",
    "structured_claim_refs",
    "structured_evidence_refs",
    "structured_tension_refs",
    "structured_knowledge_gap_refs",
  ];
  return {
    existing_canonical_perspective_state_writer_compatible: false,
    existing_canonical_perspective_state_read_model_compatible: false,
    existing_canonical_perspective_state_route_compatible: false,
    compatibility_notes: [
      "Existing durable canonical Perspective state code expects promotion/formation lineage and structured durable state material.",
      "Manual Perspective state mutation records intentionally do not fabricate promotion decisions, formation receipts, Perspective IDs, proof/evidence refs, or durable state patch material.",
      "A future manual-specific canonical state adapter contract is the safest next mapping path before any existing canonical state writer reuse is reconsidered.",
    ],
    field_gaps: uniqueStrings([
      ...fieldGaps,
      ...missingCanonicalStateRefs,
      "proof_or_evidence_refs_not_supplied_by_manual_path",
      ...(!record?.mutation_label ? ["mutation_label"] : []),
      ...(!record?.mutation_rationale ? ["mutation_rationale"] : []),
      ...(!explanatoryMaterialPresent
        ? ["expected_observed_mismatch_explanation"]
        : []),
      ...(!manualContextNotProofOrEvidence
        ? ["manual_only_context_refs_not_proof_evidence"]
        : []),
    ]),
    authority_gaps: [
      "manual_adapter_contract_has_no_existing_canonical_state_write_authority",
      "manual_adapter_contract_has_no_perspective_promotion_authority",
      "manual_adapter_contract_has_no_formation_receipt_authority",
      "manual_adapter_contract_has_no_proof_or_evidence_authority",
      "manual_adapter_contract_has_no_product_or_work_mutation_authority",
    ],
    source_lineage_gaps: [
      "existing_canonical_state_writer_requires_promotion_decision_lineage",
      "existing_canonical_state_writer_requires_formation_receipt_lineage",
      "existing_canonical_state_writer_requires_durable_perspective_id",
      "manual_only_context_refs_are_not_evidence_refs",
    ],
    missing_canonical_state_refs: missingCanonicalStateRefs,
    manual_source_refs_preserved: true,
    recommended_future_mapping_path: record
      ? "manual_specific_canonical_state_adapter_contract"
      : "blocked",
  };
}

function buildManualAdapterWritePath({
  candidateReady,
  target,
}: {
  candidateReady: boolean;
  target: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget;
}): ResearchCandidateManualGlobalDogfoodPerspectiveManualAdapterWritePath {
  const currentWorkingTarget =
    target === "manual_specific_current_working_adapter";
  return {
    recommended_storage_path: candidateReady
      ? "manual_specific_perspective_adapter_tables"
      : "blocked",
    expected_future_write_scope: candidateReady
      ? currentWorkingTarget
        ? "adapter_record_only"
        : "adapter_record_only"
      : "blocked",
    requires_explicit_future_confirmation: true,
    requires_source_revalidation: true,
    requires_idempotency: true,
    requires_duplicate_replay: true,
    requires_rollback_supersede: true,
    requires_row_count_validation: true,
    requires_no_raw_text_or_operator_note_persistence: true,
    requires_no_proof_evidence_fabrication: true,
  };
}

function buildCompatibilityFindings({
  candidateReady,
  fieldGaps,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
  sourceReadbackNoForbiddenWrites,
  sourceReadbackMutationBlockers,
  currentWorkingCompatibility,
  canonicalCompatibility,
  manualWritePath,
}: {
  candidateReady: boolean;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
  sourceReadbackNoForbiddenWrites: boolean;
  sourceReadbackMutationBlockers: string[];
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingAdapterCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateAdapterCompatibility;
  manualWritePath: ResearchCandidateManualGlobalDogfoodPerspectiveManualAdapterWritePath;
}): ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCompatibilityFinding[] =
    [
      {
        finding_code: candidateReady
          ? "perspective_state_mutation_ready_for_adapter_contract"
          : "perspective_state_mutation_not_ready_for_adapter_contract",
        severity: candidateReady ? "ready" : "blocker",
        applies_to: "manual_global_dogfood_perspective_state_mutation",
        summary: candidateReady
          ? "The active committed manual Perspective state mutation record can feed a preview-only Perspective adapter authorization contract."
          : "The Perspective adapter authorization preview is blocked by source readback, explanatory material, source-shape, or scope gaps.",
      },
      {
        finding_code: "existing_current_working_adapter_compatibility_false",
        severity: "warning",
        applies_to: "existing_current_working_perspective_adapter",
        summary:
          "Existing current-working Perspective adapter/apply paths are not compatible yet because the manual source lacks CWP material, update contract records, patch entries, proof/evidence refs, and write authority.",
      },
      {
        finding_code: "existing_canonical_state_adapter_compatibility_false",
        severity: "warning",
        applies_to: "existing_canonical_perspective_state_adapter",
        summary:
          "Existing durable canonical Perspective state writers are not compatible yet because the manual source lacks promotion/formation lineage, Perspective IDs, structured durable state refs, and write authority.",
      },
      {
        finding_code: "manual_specific_adapter_write_path_recommended",
        severity: candidateReady ? "ready" : "warning",
        applies_to: "manual_specific_perspective_adapter_write_path",
        summary: `Recommended future storage path: ${manualWritePath.recommended_storage_path}; expected future write scope: ${manualWritePath.expected_future_write_scope}.`,
      },
    ];

  if (fieldGaps.length > 0) {
    findings.push({
      finding_code: "perspective_adapter_source_field_gaps_present",
      severity: "blocker",
      applies_to: "manual_global_dogfood_perspective_state_mutation",
      summary: `Missing source fields: ${fieldGaps.join(", ")}.`,
    });
  }
  if (!explanatoryMaterialPresent) {
    findings.push({
      finding_code: "perspective_adapter_explanation_missing",
      severity: "blocker",
      applies_to: "future_perspective_adapter",
      summary:
        "Perspective adapter preview requires mutation rationale plus expected, observed, and mismatch/gap material before future adapter authorization.",
    });
  }
  if (!manualContextNotProofOrEvidence) {
    findings.push({
      finding_code: "perspective_adapter_manual_context_must_not_be_proof",
      severity: "blocker",
      applies_to: "future_perspective_adapter",
      summary:
        "Manual-only context refs must remain manual context and cannot be treated as proof/evidence refs.",
    });
  }
  if (!sourceReadbackNoForbiddenWrites) {
    findings.push({
      finding_code:
        "perspective_adapter_source_readback_has_forbidden_write_flags",
      severity: "blocker",
      applies_to: "manual_global_dogfood_perspective_state_mutation",
      summary:
        "The source Perspective state mutation readback must preserve no current-working, canonical state, promotion, memory, work, metrics, source-store mutation, proof, product, raw text, or operator note flags.",
    });
  }
  for (const blocker of sourceReadbackMutationBlockers) {
    findings.push({
      finding_code: blocker,
      severity: "blocker",
      applies_to: "manual_global_dogfood_perspective_state_mutation",
      summary:
        "A source Perspective state mutation readback mutation/write flag blocks Perspective adapter authorization preview readiness.",
    });
  }
  for (const gap of [
    ...currentWorkingCompatibility.field_gaps,
    ...currentWorkingCompatibility.source_lineage_gaps,
  ]) {
    findings.push({
      finding_code: `existing_current_working_adapter_gap:${gap}`,
      severity: "warning",
      applies_to: "existing_current_working_perspective_adapter",
      summary: `Existing current-working adapter compatibility gap: ${gap}.`,
    });
  }
  for (const gap of [
    ...canonicalCompatibility.field_gaps,
    ...canonicalCompatibility.source_lineage_gaps,
  ]) {
    findings.push({
      finding_code: `existing_canonical_state_adapter_gap:${gap}`,
      severity: "warning",
      applies_to: "existing_canonical_perspective_state_adapter",
      summary: `Existing canonical state adapter compatibility gap: ${gap}.`,
    });
  }

  return findings;
}

function buildCompatibilitySummary({
  currentWorkingCompatibility,
  canonicalCompatibility,
  manualWritePath,
}: {
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingAdapterCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateAdapterCompatibility;
  manualWritePath: ResearchCandidateManualGlobalDogfoodPerspectiveManualAdapterWritePath;
}) {
  return uniqueStrings([
    ...currentWorkingCompatibility.compatibility_notes,
    ...canonicalCompatibility.compatibility_notes,
    ...currentWorkingCompatibility.field_gaps.map(
      (gap) => `current_working_field_gap:${gap}`,
    ),
    ...canonicalCompatibility.field_gaps.map(
      (gap) => `canonical_state_field_gap:${gap}`,
    ),
    ...currentWorkingCompatibility.authority_gaps.map(
      (gap) => `current_working_authority_gap:${gap}`,
    ),
    ...canonicalCompatibility.authority_gaps.map(
      (gap) => `canonical_state_authority_gap:${gap}`,
    ),
    ...currentWorkingCompatibility.source_lineage_gaps.map(
      (gap) => `current_working_lineage_gap:${gap}`,
    ),
    ...canonicalCompatibility.source_lineage_gaps.map(
      (gap) => `canonical_state_lineage_gap:${gap}`,
    ),
    `manual_adapter_write_path:${manualWritePath.recommended_storage_path}`,
    `manual_adapter_expected_scope:${manualWritePath.expected_future_write_scope}`,
  ]);
}

function createPerspectiveAdapterNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodPerspectiveAdapterNonWriteConfirmation {
  return {
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_state_mutation_record_mutated: false,
    perspective_apply_record_mutated: false,
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

function buildAdapterLabel(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationRecord | null,
  target: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget,
) {
  if (!record?.mutation_label.trim()) return null;
  return `Adapter candidate for ${target}: ${record.mutation_label.trim()}`;
}

function buildAdapterRationale(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationRecord | null,
  target: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget,
) {
  if (!record?.mutation_rationale.trim()) return null;
  return `Future ${target} review should map the manual Perspective state mutation rationale without fabricating current-working, canonical state, proof/evidence, work, or memory refs: ${record.mutation_rationale.trim()}`;
}

function normalizeAdapterTarget(
  value: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget | undefined,
): ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget {
  if (
    value === "manual_specific_current_working_adapter" ||
    value === "manual_specific_canonical_state_adapter" ||
    value === "existing_current_working_perspective_adapter" ||
    value === "existing_canonical_perspective_state_adapter"
  ) {
    return value;
  }
  return "manual_specific_canonical_state_adapter";
}

function adapterScopeHint(
  value: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget,
) {
  if (value === "manual_specific_current_working_adapter") {
    return "manual_specific_current_working_adapter";
  }
  return "manual_specific_canonical_state_adapter";
}

function strengthHint(value: string | undefined) {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

function normalizeLabel(
  value: string | undefined,
  fallback = DEFAULT_OPERATOR_INTENT_LABEL,
) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 160) : fallback;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ];
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
