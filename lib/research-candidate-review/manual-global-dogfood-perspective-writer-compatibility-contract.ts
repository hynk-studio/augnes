import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveManualWriterCompatibilityPath,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContractInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityNonWriteConfirmation,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterDefaultTarget,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterTarget,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_perspective_writer_compatibility_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "perspective_writer_compatibility_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

const CURRENT_WORKING_ENTRYPOINTS = [
  "types/current-working-perspective-update-contract-preview.ts",
  "types/current-working-perspective-update-contract-write.ts",
  "types/current-working-perspective-apply-preview.ts",
  "types/current-working-perspective-apply-write.ts",
  "types/current-working-perspective-route-integration-contract-preview.ts",
  "types/current-working-perspective-route-integration-contract-write.ts",
  "lib/workplane/current-working-perspective-update-contract-preview.ts",
  "lib/workplane/current-working-perspective-apply-preview.ts",
  "lib/workplane/current-working-perspective-apply-write.ts",
];

const CANONICAL_STATE_ENTRYPOINTS = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-canonical-perspective-update-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update.ts",
];

const AVAILABLE_MANUAL_SOURCE_FIELDS = [
  "source_perspective_state_application_receipt_id",
  "source_perspective_state_application_record_id",
  "source_perspective_state_application_record_fingerprint",
  "source_perspective_adapter_receipt_id",
  "source_perspective_adapter_record_id",
  "source_perspective_adapter_record_fingerprint",
  "source_perspective_state_mutation_receipt_id",
  "source_perspective_state_mutation_record_id",
  "source_perspective_state_mutation_record_fingerprint",
  "source_perspective_apply_receipt_id",
  "source_perspective_apply_record_id",
  "source_perspective_apply_record_fingerprint",
  "source_canonical_perspective_update_receipt_id",
  "source_canonical_perspective_update_record_id",
  "source_canonical_perspective_update_record_fingerprint",
  "source_perspective_relay_receipt_id",
  "source_perspective_relay_record_id",
  "source_perspective_relay_record_fingerprint",
  "source_next_work_signal_receipt_id",
  "source_next_work_signal_record_id",
  "source_next_work_signal_record_fingerprint",
  "source_next_work_bias_receipt_id",
  "source_next_work_bias_record_id",
  "source_next_work_bias_record_fingerprint",
  "source_projection_fingerprint",
  "source_global_dogfood_ledger_receipt_id",
  "source_global_dogfood_ledger_record_id",
  "source_metric_snapshot_receipt_id",
  "source_metric_snapshot_record_id",
  "source_manual_receipt_id",
  "source_handoff_seed_fingerprint",
  "source_result_text_fingerprint",
  "source_expected_observed_delta_record_ref",
  "source_reuse_outcome_record_ref",
  "state_application_label",
  "state_application_rationale",
  "adapter_label",
  "adapter_rationale",
  "mutation_label",
  "mutation_rationale",
  "apply_label",
  "apply_rationale",
  "canonical_update_label",
  "canonical_update_rationale",
  "relay_update_label",
  "relay_update_rationale",
  "expected_summary",
  "observed_summary",
  "mismatch_or_gap_summary",
  "selected_candidate_context_refs",
  "source_next_work_candidate_card_ids",
  "manual_only_context_refs",
  "source_line",
];

export function buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
  intended_future_writer_target,
}: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContractInput): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract {
  const source = normalizeReadback(readback);
  const active = source.readback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.perspective_state_application_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-perspective-state-application-readback:${source.readback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    sourceReadbackPreservesNoWriterCompatibilityWrites(source.readback);
  const sourceAuthorityBoundaryReadOnly =
    sourceAuthorityBoundaryPreservesNoWriterCompatibilityWrites(source.readback);
  const sourceReadbackMutationBlockers =
    buildSourceReadbackMutationBlockers(source.readback);
  const stateApplicationLabelPresent = Boolean(
    record?.state_application_label.trim(),
  );
  const stateApplicationRationalePresent = Boolean(
    record?.state_application_rationale.trim(),
  );
  const stateApplicationStoragePathIsManualSpecific =
    record?.recommended_storage_path ===
    "manual_specific_perspective_state_application_tables";
  const stateApplicationExpectedScopeIsRecordOnly =
    record?.expected_future_write_scope === "state_application_record_only";
  const stateApplicationTargetRemainsManualSpecific =
    record?.intended_future_state_application_target ===
      "manual_specific_existing_canonical_state_application_adapter" ||
    record?.intended_future_state_application_target ===
      "manual_specific_current_working_application_adapter";
  const selectedContextPresent =
    (record?.selected_candidate_context_refs.length ?? 0) > 0;
  const candidateCardIdsPresent =
    (record?.source_next_work_candidate_card_ids.length ?? 0) > 0;
  const handoffFingerprintPresent = Boolean(
    receipt?.source_handoff_seed_fingerprint.trim(),
  );
  const resultFingerprintPresent = Boolean(
    receipt?.source_result_text_fingerprint.trim(),
  );
  const explanatoryMaterialPresent = Boolean(
    record?.expected_summary?.trim() &&
      record?.observed_summary?.trim() &&
      record?.mismatch_or_gap_summary?.trim() &&
      record?.state_application_rationale?.trim(),
  );
  const manualContextNotProofOrEvidence =
    (record?.manual_only_context_refs ?? []).every(
      (ref) => !/^(proof|evidence):/i.test(ref.trim()),
    );
  const normalizedTarget = normalizeWriterTarget(intended_future_writer_target);
  const requestedExistingCurrentWorking =
    normalizedTarget === "existing_current_working_perspective_writer";
  const requestedExistingCanonical =
    normalizedTarget === "existing_canonical_perspective_state_writer";
  const defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveWriterDefaultTarget =
    normalizedTarget === "manual_specific_current_working_writer_adapter"
      ? "manual_specific_current_working_writer_adapter"
      : "manual_specific_existing_canonical_state_writer_adapter";
  const existingWriterTargetRequested =
    requestedExistingCurrentWorking || requestedExistingCanonical;
  const blockerReasons = uniqueStrings([
    ...(source.missing
      ? ["source_perspective_state_application_readback_missing"]
      : []),
    ...(!active
      ? ["source_perspective_state_application_receipt_not_active_committed"]
      : []),
    ...(!record ? ["source_perspective_state_application_record_missing"] : []),
    ...(!record?.perspective_state_application_record_fingerprint
      ? ["source_perspective_state_application_record_fingerprint_missing"]
      : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...sourceReadbackMutationBlockers,
    ...(!stateApplicationLabelPresent
      ? ["state_application_label_missing"]
      : []),
    ...(!stateApplicationRationalePresent
      ? ["state_application_rationale_missing"]
      : []),
    ...(!stateApplicationStoragePathIsManualSpecific
      ? ["state_application_storage_path_must_be_manual_specific"]
      : []),
    ...(!stateApplicationExpectedScopeIsRecordOnly
      ? ["state_application_expected_future_write_scope_must_be_record_only"]
      : []),
    ...(!stateApplicationTargetRemainsManualSpecific ||
    existingWriterTargetRequested
      ? ["state_application_existing_writer_target_must_not_be_ready"]
      : []),
    ...(!selectedContextPresent
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!candidateCardIdsPresent
      ? ["source_next_work_candidate_card_ids_missing"]
      : []),
    ...(!handoffFingerprintPresent
      ? ["source_handoff_seed_fingerprint_missing"]
      : []),
    ...(!resultFingerprintPresent
      ? ["source_result_text_fingerprint_missing"]
      : []),
    ...(!explanatoryMaterialPresent
      ? ["perspective_writer_compatibility_explanation_insufficient"]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? ["manual_only_context_refs_must_not_be_treated_as_proof_or_evidence"]
      : []),
    ...(!sourceReadbackNoForbiddenWrites || !sourceAuthorityBoundaryReadOnly
      ? ["source_authority_boundary_not_read_only"]
      : []),
    ...(requestedExistingCurrentWorking
      ? [
          "existing_current_working_writer_lineage_gap",
          "existing_writer_requires_unavailable_state_refs",
          "existing_writer_requires_unavailable_proof_or_work_refs",
        ]
      : []),
    ...(requestedExistingCanonical
      ? [
          "existing_canonical_state_writer_lineage_gap",
          "existing_writer_requires_unavailable_state_refs",
          "existing_writer_requires_unavailable_proof_or_work_refs",
        ]
      : []),
  ]);
  const candidateReady = blockerReasons.length === 0;
  const effectiveTarget = candidateReady ? normalizedTarget : "blocked";
  const writerCompatibilityLabel = buildWriterCompatibilityLabel(
    record,
    defaultTarget,
  );
  const writerCompatibilityRationale = buildWriterCompatibilityRationale(
    record,
    defaultTarget,
  );
  const currentWorkingCompatibility = buildExistingCurrentWorkingCompatibility({
    fieldGaps,
    record,
    explanatoryMaterialPresent,
    requestedExistingCurrentWorking,
  });
  const canonicalCompatibility = buildExistingCanonicalStateCompatibility({
    fieldGaps,
    record,
    explanatoryMaterialPresent,
    requestedExistingCanonical,
  });
  const manualPath = buildManualWriterCompatibilityPath({
    candidateReady,
  });
  const compatibilitySummary = buildCompatibilitySummary({
    currentWorkingCompatibility,
    canonicalCompatibility,
    manualPath,
  });
  const warningReasons = uniqueStrings([
    ...(record?.warnings ?? []),
    ...(record?.manual_only_context_refs.length
      ? ["manual_only_context_refs_preserved_not_proof_evidence"]
      : []),
    "perspective_writer_compatibility_contract_preview_only_no_existing_writer_invocation",
    "existing_current_working_writer_compatibility_false_until_manual_lineage_mapping_exists",
    "existing_canonical_state_writer_compatibility_false_until_structured_state_mapping_exists",
  ]);
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityAuthorityBoundary();
  const nonWriteConfirmation =
    createPerspectiveWriterCompatibilityNonWriteConfirmation();
  const idempotencyKey = `manual-global-dogfood-perspective-writer-compatibility-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_VERSION,
    source_perspective_state_application_receipt_id:
      receipt?.receipt_id ?? null,
    source_perspective_state_application_record_id:
      record?.perspective_state_application_record_id ?? null,
    source_perspective_state_application_record_fingerprint:
      record?.perspective_state_application_record_fingerprint ?? null,
    source_perspective_adapter_receipt_id:
      receipt?.source_perspective_adapter_receipt_id ?? null,
    source_perspective_adapter_record_id:
      receipt?.source_perspective_adapter_record_id ?? null,
    source_perspective_adapter_record_fingerprint:
      receipt?.source_perspective_adapter_record_fingerprint ?? null,
    source_perspective_state_mutation_receipt_id:
      receipt?.source_perspective_state_mutation_receipt_id ?? null,
    source_perspective_state_mutation_record_id:
      receipt?.source_perspective_state_mutation_record_id ?? null,
    source_perspective_state_mutation_record_fingerprint:
      receipt?.source_perspective_state_mutation_record_fingerprint ?? null,
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
    writer_compatibility_label: writerCompatibilityLabel,
    writer_compatibility_rationale: writerCompatibilityRationale,
    state_application_label: record?.state_application_label ?? null,
    state_application_rationale: record?.state_application_rationale ?? null,
    adapter_label: record?.adapter_label ?? null,
    adapter_rationale: record?.adapter_rationale ?? null,
    mutation_label: record?.mutation_label ?? null,
    mutation_rationale: record?.mutation_rationale ?? null,
    apply_label: record?.apply_label ?? null,
    apply_rationale: record?.apply_rationale ?? null,
    canonical_update_label: record?.canonical_update_label ?? null,
    canonical_update_rationale:
      record?.canonical_update_rationale ?? null,
    relay_update_label: record?.relay_update_label ?? null,
    relay_update_rationale: record?.relay_update_rationale ?? null,
    recommended_next_work_label: record?.recommended_next_work_label ?? null,
    outcome_label: record?.outcome_label ?? null,
    outcome_signal: record?.outcome_signal ?? null,
    intended_future_writer_target: effectiveTarget,
    intended_future_state_application_target:
      record?.intended_future_state_application_target ?? null,
    default_future_state_application_target:
      record?.default_future_state_application_target ?? null,
    state_application_scope_hint: record?.state_application_scope_hint ?? null,
    state_application_strength_hint:
      record?.state_application_strength_hint ?? null,
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
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_VERSION,
    scope: source.readback.scope,
    source_readback_ref: sourceReadbackRef,
    source_perspective_state_application_receipt_id:
      receipt?.receipt_id ?? null,
    source_perspective_state_application_record_id:
      record?.perspective_state_application_record_id ?? null,
    source_perspective_state_application_record_fingerprint:
      record?.perspective_state_application_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    existing_current_working_writer_compatibility:
      currentWorkingCompatibility,
    existing_canonical_state_writer_compatibility: canonicalCompatibility,
    authority_boundary: authorityBoundary,
  });
  const existingCurrentWorkingCompatible =
    currentWorkingCompatibility
      .existing_current_working_perspective_update_contract_preview_compatible &&
    currentWorkingCompatibility
      .existing_current_working_perspective_update_contract_write_compatible &&
    currentWorkingCompatibility
      .existing_current_working_perspective_apply_preview_compatible &&
    currentWorkingCompatibility
      .existing_current_working_perspective_apply_write_compatible &&
    currentWorkingCompatibility.existing_route_integration_contract_compatible;
  const existingCanonicalCompatible =
    canonicalCompatibility.existing_canonical_perspective_state_writer_compatible &&
    canonicalCompatibility.existing_canonical_perspective_state_read_model_compatible &&
    canonicalCompatibility.existing_canonical_perspective_state_route_compatible;

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_CONTRACT_VERSION,
    scope: source.readback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_perspective_state_application_readback_ref: sourceReadbackRef,
    source_perspective_state_application_receipt_id:
      receipt?.receipt_id ?? null,
    source_perspective_state_application_record_id:
      record?.perspective_state_application_record_id ?? null,
    source_perspective_state_application_record_fingerprint:
      record?.perspective_state_application_record_fingerprint ?? null,
    source_perspective_adapter_receipt_id:
      receipt?.source_perspective_adapter_receipt_id ?? null,
    source_perspective_adapter_record_id:
      receipt?.source_perspective_adapter_record_id ?? null,
    source_perspective_adapter_record_fingerprint:
      receipt?.source_perspective_adapter_record_fingerprint ?? null,
    source_perspective_state_mutation_receipt_id:
      receipt?.source_perspective_state_mutation_receipt_id ?? null,
    source_perspective_state_mutation_record_id:
      receipt?.source_perspective_state_mutation_record_id ?? null,
    source_perspective_state_mutation_record_fingerprint:
      receipt?.source_perspective_state_mutation_record_fingerprint ?? null,
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
    operator_authorization_mode: candidateReady
      ? "ready_for_future_perspective_writer_compatibility_write_authorization"
      : "blocked_before_perspective_writer_compatibility_authorization",
    proposed_writer_compatibility_mapping: {
      writer_compatibility_label: writerCompatibilityLabel,
      writer_compatibility_rationale: writerCompatibilityRationale,
      state_application_label: record?.state_application_label ?? null,
      state_application_rationale: record?.state_application_rationale ?? null,
      adapter_label: record?.adapter_label ?? null,
      adapter_rationale: record?.adapter_rationale ?? null,
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
      intended_future_writer_target: effectiveTarget,
      default_future_writer_target: candidateReady ? defaultTarget : "blocked",
      can_feed_future_writer_compatibility_write_candidate: candidateReady,
      can_update_current_working_perspective_now: false,
      can_mutate_existing_canonical_perspective_state_now: false,
      can_call_existing_current_working_writer_now: false,
      can_call_existing_canonical_state_writer_now: false,
      can_promote_perspective_now: false,
      can_write_perspective_memory_now: false,
      can_mutate_work_now: false,
      can_write_proof_or_evidence_now: false,
      can_mutate_source_records_now: false,
    },
    proposed_writer_compatibility_candidate: {
      candidate_kind:
        "manual_global_dogfood_perspective_writer_compatibility_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_perspective_writer_compatibility_write_authorization"
        : "blocked_before_perspective_writer_compatibility_authorization",
      writer_compatibility_scope_hint: candidateReady
        ? writerCompatibilityScopeHint(defaultTarget)
        : "blocked",
      writer_compatibility_strength_hint: candidateReady
        ? strengthHint(record?.state_application_strength_hint)
        : "blocked",
      reason: candidateReady
        ? "Active committed manual Perspective state application material can feed a future separately authorized manual-specific writer compatibility record without invoking existing writers."
        : "Source Perspective state application readback lacks the active, explanatory, manual-specific, no-source-mutation shape required before writer compatibility authorization.",
      writes_now: false,
      would_update_current_working_perspective: false,
      would_mutate_existing_canonical_perspective_state: false,
      would_call_existing_current_working_writer: false,
      would_call_existing_canonical_state_writer: false,
      would_promote_perspective: false,
      would_write_perspective_memory: false,
      would_mutate_work: false,
      would_write_proof_or_evidence: false,
    },
    existing_current_working_writer_compatibility: currentWorkingCompatibility,
    existing_canonical_state_writer_compatibility: canonicalCompatibility,
    proposed_manual_writer_compatibility_path: manualPath,
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_perspective_writer_compatibility_write: true,
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
      manualPath,
    }),
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_perspective_writer_compatibility_contract",
      "separate_future_perspective_writer_compatibility_write_slice",
      "fresh_operator_confirmation_text_for_perspective_writer_compatibility_write",
      "future_idempotent_perspective_writer_compatibility_record_contract",
      "no_existing_current_working_or_canonical_writer_invocation_without_proven_mapping",
      "no_current_working_perspective_or_existing_canonical_state_write_without_separate_contract",
      "no_proof_evidence_or_perspective_memory_fabrication",
    ],
    required_future_checks: [
      "confirm_perspective_state_application_receipt_is_still_active_committed",
      "confirm_perspective_state_application_record_fingerprint_still_matches_readback",
      "confirm_state_application_adapter_state_mutation_apply_canonical_update_relay_signal_bias_source_refs_still_match",
      "confirm_handoff_and_result_fingerprints_still_match",
      "confirm_expected_observed_mismatch_material_still_explains_the_writer_compatibility_mapping",
      "confirm_manual_only_context_refs_are_not_proof_or_evidence_refs",
      "confirm_current_working_or_canonical_state_ref_mapping_before_existing_writer_reuse",
      "confirm_existing_writer_dry_run_or_static_contract_before_invocation",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        existingCurrentWorkingCompatible === false &&
        existingCanonicalCompatible === false &&
        nonWriteConfirmation.current_working_perspective_updated === false &&
        nonWriteConfirmation
          .existing_canonical_perspective_state_table_mutated === false &&
        authorityBoundary.can_call_existing_current_working_writer === false &&
        authorityBoundary.can_call_existing_canonical_state_writer === false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_mutate_existing_canonical_perspective_state ===
          false &&
        authorityBoundary.can_write_existing_canonical_perspective_state ===
          false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_perspective_state_application_receipt_present:
        Boolean(active),
      active_committed_perspective_state_application_record_present:
        Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      state_application_label_present: stateApplicationLabelPresent,
      state_application_rationale_present: stateApplicationRationalePresent,
      state_application_storage_path_is_manual_specific:
        stateApplicationStoragePathIsManualSpecific,
      state_application_expected_future_write_scope_is_record_only:
        stateApplicationExpectedScopeIsRecordOnly,
      state_application_target_remains_manual_specific:
        stateApplicationTargetRemainsManualSpecific,
      explanatory_expected_observed_material_present:
        explanatoryMaterialPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      source_next_work_candidate_card_ids_present: candidateCardIdsPresent,
      source_handoff_seed_fingerprint_present: handoffFingerprintPresent,
      source_result_text_fingerprint_present: resultFingerprintPresent,
      manual_context_not_proof_or_evidence: manualContextNotProofOrEvidence,
      existing_current_working_writer_compatible:
        existingCurrentWorkingCompatible,
      existing_canonical_state_writer_compatible: existingCanonicalCompatible,
      source_readback_preserves_no_current_working_canonical_state_promotion_memory_work_proof_metric_writes:
        sourceReadbackNoForbiddenWrites && sourceAuthorityBoundaryReadOnly,
      no_write_authority:
        authorityBoundary.can_write_perspective_writer_compatibility_record ===
          false &&
        authorityBoundary.can_call_existing_current_working_writer === false &&
        authorityBoundary.can_call_existing_canonical_state_writer === false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_mutate_existing_canonical_perspective_state ===
          false &&
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
      ? "If accepted locally, implement a separate explicitly authorized idempotent Perspective writer compatibility record slice with source revalidation, duplicate replay, rollback/supersede, row-count validation, and no existing writer invocation until compatibility is proven."
      : "Resolve Perspective state application readback blockers before preparing Perspective writer compatibility write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_perspective_writer_compatibility_record: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_call_existing_current_working_writer: false,
    can_call_existing_canonical_state_writer: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_state_application_record: false,
    can_mutate_perspective_adapter_record: false,
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
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback;
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
        value as ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
      missing: false,
    };
  }

  return {
    readback: {
      readback_kind:
        "research_candidate_manual_global_dogfood_perspective_state_application_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_perspective_state_application_readback.v0.1",
      scope: DEFAULT_SCOPE,
      storage_path: "manual_specific_perspective_state_application_tables",
      records_by_receipt: [],
      latest_receipts: [],
      latest_active_committed: null,
      count: 0,
      authority_boundary: createMissingSourceAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      perspective_state_application_record_written: false,
      current_working_perspective_updated: false,
      existing_canonical_perspective_state_table_mutated: false,
      canonical_perspective_state_written: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      perspective_adapter_record_mutated: false,
      perspective_state_mutation_record_mutated: false,
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

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary {
  return {
    can_write_perspective_state_application_record: true,
    can_write_perspective_state_application_receipt: true,
    can_write_perspective_state_application_rollback_metadata: true,
    source_of_truth: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_write_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_adapter_record: false,
    can_mutate_perspective_state_mutation_record: false,
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
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id
      ? "source_perspective_state_application_receipt_id"
      : null,
    !record?.perspective_state_application_record_id
      ? "source_perspective_state_application_record_id"
      : null,
    !record?.perspective_state_application_record_fingerprint
      ? "source_perspective_state_application_record_fingerprint"
      : null,
    !receipt?.source_perspective_adapter_receipt_id
      ? "source_perspective_adapter_receipt_id"
      : null,
    !receipt?.source_perspective_adapter_record_id
      ? "source_perspective_adapter_record_id"
      : null,
    !receipt?.source_perspective_adapter_record_fingerprint
      ? "source_perspective_adapter_record_fingerprint"
      : null,
    !receipt?.source_perspective_state_mutation_receipt_id
      ? "source_perspective_state_mutation_receipt_id"
      : null,
    !receipt?.source_perspective_state_mutation_record_id
      ? "source_perspective_state_mutation_record_id"
      : null,
    !receipt?.source_perspective_state_mutation_record_fingerprint
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

function sourceReadbackPreservesNoWriterCompatibilityWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
) {
  return (
    readback.current_working_perspective_updated === false &&
    readback.existing_canonical_perspective_state_table_mutated === false &&
    readback.canonical_perspective_state_written === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.perspective_adapter_record_mutated === false &&
    readback.perspective_state_mutation_record_mutated === false &&
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

function sourceAuthorityBoundaryPreservesNoWriterCompatibilityWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
) {
  return (
    readback.authority_boundary.can_update_current_working_perspective ===
      false &&
    readback.authority_boundary.can_mutate_existing_canonical_perspective_state ===
      false &&
    readback.authority_boundary.can_write_existing_canonical_perspective_state ===
      false &&
    readback.authority_boundary.can_promote_perspective === false &&
    readback.authority_boundary.can_write_perspective_memory === false &&
    readback.authority_boundary.can_mutate_perspective_adapter_record ===
      false &&
    readback.authority_boundary.can_mutate_perspective_state_mutation_record ===
      false &&
    readback.authority_boundary.can_mutate_work === false &&
    readback.authority_boundary.can_write_dogfood_metrics === false &&
    readback.authority_boundary.can_write_proof_or_evidence === false &&
    readback.authority_boundary.can_execute_product_write === false
  );
}

function buildSourceReadbackMutationBlockers(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
) {
  return uniqueStrings([
    readback.current_working_perspective_updated
      ? "source_state_application_readback_current_working_perspective_already_updated"
      : null,
    readback.existing_canonical_perspective_state_table_mutated ||
    readback.canonical_perspective_state_written
      ? "source_state_application_readback_existing_canonical_state_already_mutated"
      : null,
    readback.perspective_promoted
      ? "source_state_application_readback_perspective_promoted"
      : null,
    readback.perspective_memory_written
      ? "source_state_application_readback_perspective_memory_written"
      : null,
    readback.work_mutated
      ? "source_state_application_readback_work_mutated"
      : null,
    readback.proof_or_evidence_rows_written
      ? "source_state_application_readback_proof_or_evidence_written"
      : null,
    readback.dogfood_metrics_written ||
    readback.global_dogfood_ledger_mutated ||
    readback.metric_snapshot_mutated ||
    readback.next_work_signal_decision_mutated ||
    readback.next_work_bias_mutated ||
    readback.perspective_relay_mutated ||
    readback.canonical_perspective_update_record_mutated ||
    readback.perspective_apply_record_mutated ||
    readback.perspective_state_mutation_record_mutated ||
    readback.perspective_adapter_record_mutated
      ? "source_state_application_readback_metric_or_source_store_mutated"
      : null,
    readback.product_write_executed
      ? "source_state_application_product_write_executed"
      : null,
    readback.raw_manual_note_text_present ||
    readback.raw_result_report_text_present ||
    readback.operator_notes_persisted
      ? "source_state_application_raw_text_or_operator_note_present"
      : null,
  ]);
}

function buildExistingCurrentWorkingCompatibility({
  fieldGaps,
  record,
  explanatoryMaterialPresent,
  requestedExistingCurrentWorking,
}: {
  fieldGaps: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null;
  explanatoryMaterialPresent: boolean;
  requestedExistingCurrentWorking: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterCompatibility {
  return {
    existing_current_working_perspective_update_contract_preview_compatible:
      false,
    existing_current_working_perspective_update_contract_write_compatible:
      false,
    existing_current_working_perspective_apply_preview_compatible: false,
    existing_current_working_perspective_apply_write_compatible: false,
    existing_route_integration_contract_compatible: false,
    existing_writer_entrypoints: CURRENT_WORKING_ENTRYPOINTS,
    required_input_fields: [
      "source_current_working_perspective_ref",
      "source_cwp_version",
      "current_working_perspective_patch_entries",
      "current_working_perspective_apply_decision_preview",
      "applied_current_working_perspective_snapshot",
      "route_integration_contract_material",
    ],
    available_manual_source_fields: AVAILABLE_MANUAL_SOURCE_FIELDS,
    compatibility_notes: [
      "Manual state application readback preserves manual source-chain refs, but it does not contain an existing current-working Perspective ref or current-working patch entries.",
      "Existing current-working update/apply writers remain compatibility-only for this source chain and are not invoked by this preview.",
      ...(requestedExistingCurrentWorking
        ? [
            "Requested existing current-working writer target is blocked until explicit mapping can prove source lineage, patch material, and row-count behavior.",
          ]
        : []),
    ],
    field_gaps: uniqueStrings([
      ...fieldGaps,
      ...(!record ? ["source_perspective_state_application_record"] : []),
      ...(!explanatoryMaterialPresent
        ? ["expected_observed_mismatch_explanation"]
        : []),
    ]),
    authority_gaps: [
      "this_preview_has_no_existing_current_working_writer_call_authority",
      "this_preview_has_no_current_working_perspective_update_authority",
      "future_existing_writer_use_requires_separate_authorization",
    ],
    source_lineage_gaps: [
      "manual_source_chain_is_not_a_current_working_perspective_lineage",
      "accepted_manual_context_refs_are_not_current_working_evidence_refs",
      "no_existing_current_working_writer_receipt_or_apply_event_is_present",
    ],
    missing_current_working_refs: [
      "source_current_working_perspective_ref",
      "current_working_perspective_version_ref",
      "applied_current_working_perspective_snapshot_ref",
    ],
    missing_patch_or_apply_material: [
      "current_working_perspective_patch_entries",
      "current_working_perspective_apply_decision_preview",
      "current_working_perspective_route_integration_material",
    ],
    missing_proof_or_evidence_refs: [
      "proof_or_evidence_refs_not_present_and_must_not_be_fabricated",
    ],
    missing_work_refs: ["work_item_or_work_event_refs_not_present"],
    missing_memory_refs: ["perspective_memory_refs_not_present"],
    manual_source_refs_preserved: true,
    recommended_future_mapping_path:
      "manual_specific_current_working_writer_adapter_contract",
  };
}

function buildExistingCanonicalStateCompatibility({
  fieldGaps,
  record,
  explanatoryMaterialPresent,
  requestedExistingCanonical,
}: {
  fieldGaps: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null;
  explanatoryMaterialPresent: boolean;
  requestedExistingCanonical: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterCompatibility {
  return {
    existing_canonical_perspective_state_writer_compatible: false,
    existing_canonical_perspective_state_read_model_compatible: false,
    existing_canonical_perspective_state_route_compatible: false,
    existing_writer_entrypoints: CANONICAL_STATE_ENTRYPOINTS,
    existing_state_tables_detected: [
      "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
      "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
      "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
      "research_candidate_manual_global_dogfood_perspective_state_application_receipts",
    ],
    required_input_fields: [
      "existing_canonical_perspective_state_id",
      "canonical_state_claim_refs",
      "canonical_state_evidence_refs",
      "canonical_state_tension_refs",
      "canonical_state_gap_refs",
      "structured_state_mutation_material",
      "row_count_validation_contract",
    ],
    available_manual_source_fields: AVAILABLE_MANUAL_SOURCE_FIELDS,
    compatibility_notes: [
      "Manual state application readback preserves canonical update source metadata but not existing canonical state table row ids or structured claim/evidence/tension/gap refs.",
      "Existing canonical Perspective state writer compatibility remains false until a separate mapping proves all state refs and row-count behavior.",
      ...(requestedExistingCanonical
        ? [
            "Requested existing canonical Perspective state writer target is blocked because this preview cannot fabricate canonical state ids or proof/evidence refs.",
          ]
        : []),
    ],
    field_gaps: uniqueStrings([
      ...fieldGaps,
      ...(!record ? ["source_perspective_state_application_record"] : []),
      ...(!explanatoryMaterialPresent
        ? ["expected_observed_mismatch_explanation"]
        : []),
    ]),
    authority_gaps: [
      "this_preview_has_no_existing_canonical_state_writer_call_authority",
      "this_preview_has_no_existing_canonical_state_mutation_authority",
      "future_existing_writer_use_requires_separate_authorization",
    ],
    source_lineage_gaps: [
      "manual_source_chain_is_not_existing_canonical_state_lineage",
      "manual_only_context_refs_are_not_proof_or_evidence_refs",
      "no_existing_canonical_state_writer_receipt_or_apply_event_is_present",
    ],
    missing_canonical_state_refs: [
      "existing_canonical_perspective_state_id",
      "existing_canonical_perspective_state_version_ref",
      "existing_canonical_perspective_state_row_refs",
    ],
    missing_structured_state_material: [
      "canonical_state_patch_material",
      "canonical_state_row_count_expectations",
      "canonical_state_conflict_detection_material",
    ],
    missing_claim_evidence_tension_gap_refs: [
      "canonical_claim_refs",
      "canonical_evidence_refs",
      "canonical_tension_refs",
      "canonical_gap_refs",
    ],
    missing_proof_or_evidence_refs: [
      "proof_or_evidence_refs_not_present_and_must_not_be_fabricated",
    ],
    missing_work_refs: ["work_item_or_work_event_refs_not_present"],
    missing_memory_refs: ["perspective_memory_refs_not_present"],
    manual_source_refs_preserved: true,
    recommended_future_mapping_path:
      "manual_specific_existing_canonical_state_writer_adapter_contract",
  };
}

function buildManualWriterCompatibilityPath({
  candidateReady,
}: {
  candidateReady: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveManualWriterCompatibilityPath {
  return {
    recommended_storage_path: candidateReady
      ? "manual_specific_perspective_writer_compatibility_tables"
      : "blocked",
    expected_future_write_scope: candidateReady
      ? "writer_compatibility_record_only"
      : "blocked",
    requires_explicit_future_confirmation: true,
    requires_source_revalidation: true,
    requires_idempotency: true,
    requires_duplicate_replay: true,
    requires_rollback_supersede: true,
    requires_row_count_validation: true,
    requires_no_raw_text_or_operator_note_persistence: true,
    requires_no_proof_evidence_fabrication: true,
    requires_existing_state_writer_compatibility_review: true,
    requires_manual_source_chain_binding: true,
    requires_existing_writer_dry_run_or_static_contract: true,
    requires_current_working_or_canonical_state_ref_mapping: true,
  };
}

function buildCompatibilitySummary({
  currentWorkingCompatibility,
  canonicalCompatibility,
  manualPath,
}: {
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterCompatibility;
  manualPath: ResearchCandidateManualGlobalDogfoodPerspectiveManualWriterCompatibilityPath;
}) {
  return [
    `existing_current_working_writer_compatible=${String(
      currentWorkingCompatibility
        .existing_current_working_perspective_apply_write_compatible,
    )}`,
    `existing_canonical_state_writer_compatible=${String(
      canonicalCompatibility.existing_canonical_perspective_state_writer_compatible,
    )}`,
    `recommended_storage_path=${manualPath.recommended_storage_path}`,
    `expected_future_write_scope=${manualPath.expected_future_write_scope}`,
  ];
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
  manualPath,
}: {
  candidateReady: boolean;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
  sourceReadbackNoForbiddenWrites: boolean;
  sourceReadbackMutationBlockers: string[];
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterCompatibility;
  manualPath: ResearchCandidateManualGlobalDogfoodPerspectiveManualWriterCompatibilityPath;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityFinding[] {
  return [
    {
      finding_code: candidateReady
        ? "manual_writer_compatibility_candidate_ready"
        : "manual_writer_compatibility_candidate_blocked",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "future_perspective_writer_compatibility",
      summary: candidateReady
        ? "Manual state application readback can feed a future manual-specific writer compatibility record preview without invoking existing writers."
        : "Manual state application readback is not ready to feed writer compatibility authorization.",
    },
    {
      finding_code:
        "existing_current_working_writer_compatibility_false",
      severity: "warning",
      applies_to: "existing_current_working_perspective_writer",
      summary:
        currentWorkingCompatibility.compatibility_notes.join(" "),
    },
    {
      finding_code: "existing_canonical_state_writer_compatibility_false",
      severity: "warning",
      applies_to: "existing_canonical_perspective_state_writer",
      summary: canonicalCompatibility.compatibility_notes.join(" "),
    },
    {
      finding_code: "manual_writer_compatibility_path_visible",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "manual_specific_perspective_writer_compatibility_path",
      summary: `Future path is ${manualPath.recommended_storage_path} with scope ${manualPath.expected_future_write_scope}.`,
    },
    ...(fieldGaps.length
      ? [
          {
            finding_code: "manual_source_chain_field_gaps",
            severity: "blocker" as const,
            applies_to:
              "manual_global_dogfood_perspective_state_application" as const,
            summary: `Missing source fields: ${fieldGaps.join(", ")}`,
          },
        ]
      : []),
    ...(!explanatoryMaterialPresent
      ? [
          {
            finding_code: "writer_compatibility_explanation_gap",
            severity: "blocker" as const,
            applies_to: "future_perspective_writer_compatibility" as const,
            summary:
              "Expected, observed, mismatch, and rationale material must be present before future writer compatibility authorization.",
          },
        ]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? [
          {
            finding_code: "manual_context_not_proof_evidence_gap",
            severity: "blocker" as const,
            applies_to: "future_perspective_writer_compatibility" as const,
            summary:
              "Manual-only context refs cannot be treated as proof/evidence refs.",
          },
        ]
      : []),
    ...(!sourceReadbackNoForbiddenWrites
      ? [
          {
            finding_code: "source_readback_forbidden_mutation_flag",
            severity: "blocker" as const,
            applies_to:
              "manual_global_dogfood_perspective_state_application" as const,
            summary: `Forbidden source readback flags: ${sourceReadbackMutationBlockers.join(", ")}`,
          },
        ]
      : []),
  ];
}

function normalizeWriterTarget(
  target?: ResearchCandidateManualGlobalDogfoodPerspectiveWriterTarget,
): ResearchCandidateManualGlobalDogfoodPerspectiveWriterTarget {
  if (
    target === "manual_specific_current_working_writer_adapter" ||
    target === "existing_current_working_perspective_writer" ||
    target === "existing_canonical_perspective_state_writer"
  ) {
    return target;
  }
  return "manual_specific_existing_canonical_state_writer_adapter";
}

function writerCompatibilityScopeHint(
  target: ResearchCandidateManualGlobalDogfoodPerspectiveWriterDefaultTarget,
) {
  return target === "manual_specific_current_working_writer_adapter"
    ? "manual_specific_current_working_writer_adapter"
    : "manual_specific_existing_canonical_state_writer_adapter";
}

function strengthHint(value: unknown): "low" | "medium" | "high" {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : "medium";
}

function buildWriterCompatibilityLabel(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null,
  defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveWriterDefaultTarget,
) {
  if (!record?.state_application_label?.trim()) return null;
  const targetLabel =
    defaultTarget === "manual_specific_current_working_writer_adapter"
      ? "manual current-working writer adapter"
      : "manual canonical state writer adapter";
  return `${record.state_application_label.trim()} -> ${targetLabel} compatibility`;
}

function buildWriterCompatibilityRationale(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null,
  defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveWriterDefaultTarget,
) {
  if (!record?.state_application_rationale?.trim()) return null;
  const targetLabel =
    defaultTarget === "manual_specific_current_working_writer_adapter"
      ? "manual-specific current-working writer adapter"
      : "manual-specific existing canonical state writer adapter";
  return `${record.state_application_rationale.trim()} Existing writer compatibility remains a preview-only mapping check; the safest future path is ${targetLabel} record-only storage until current-working or canonical state refs can be proven without fabrication.`;
}

function createPerspectiveWriterCompatibilityNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityNonWriteConfirmation {
  return {
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_state_application_record_mutated: false,
    perspective_adapter_record_mutated: false,
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
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
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

function normalizeLabel(value: string | undefined, fallback = DEFAULT_OPERATOR_INTENT_LABEL) {
  const next = value?.trim();
  return next ? next.slice(0, 160) : fallback;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0)))];
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
