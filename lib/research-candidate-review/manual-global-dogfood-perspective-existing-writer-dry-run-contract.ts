import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunFinding,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonWriteConfirmation,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget,
  ResearchCandidateManualGlobalDogfoodPerspectiveManualExistingWriterAdapterPath,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_perspective_existing_writer_dry_run_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "existing_writer_dry_run_adapter_authorization_preview";
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
  "source_perspective_writer_compatibility_receipt_id",
  "source_perspective_writer_compatibility_record_id",
  "source_perspective_writer_compatibility_record_fingerprint",
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
  "writer_compatibility_label",
  "writer_compatibility_rationale",
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

export function buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
  intended_future_dry_run_target,
}: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractInput): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract {
  const source = normalizeReadback(readback);
  const active = source.readback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.perspective_writer_compatibility_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-perspective-writer-compatibility-readback:${source.readback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    sourceReadbackPreservesNoExistingWriterDryRunWrites(source.readback);
  const sourceAuthorityBoundaryReadOnly =
    sourceAuthorityBoundaryPreservesNoExistingWriterDryRunWrites(source.readback);
  const sourceReadbackMutationBlockers =
    buildSourceReadbackMutationBlockers(source.readback);
  const writerCompatibilityLabelPresent = Boolean(
    record?.writer_compatibility_label.trim(),
  );
  const writerCompatibilityRationalePresent = Boolean(
    record?.writer_compatibility_rationale.trim(),
  );
  const writerCompatibilityStoragePathIsManualSpecific =
    record?.recommended_storage_path ===
    "manual_specific_perspective_writer_compatibility_tables";
  const writerCompatibilityExpectedScopeIsRecordOnly =
    record?.expected_future_write_scope === "writer_compatibility_record_only";
  const writerCompatibilityTargetRemainsManualSpecific =
    record?.intended_future_writer_target ===
      "manual_specific_existing_canonical_state_writer_adapter" ||
    record?.intended_future_writer_target ===
      "manual_specific_current_working_writer_adapter";
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
      record?.writer_compatibility_rationale?.trim(),
  );
  const manualContextNotProofOrEvidence =
    (record?.manual_only_context_refs ?? []).every(
      (ref) => !/^(proof|evidence):/i.test(ref.trim()),
    );
  const sourceDerivedDryRunTarget = deriveDryRunTargetFromSourceRecord(record);
  const normalizedTarget = normalizeDryRunTarget(
    intended_future_dry_run_target ?? sourceDerivedDryRunTarget,
  );
  const requestedExistingCurrentWorking =
    normalizedTarget === "existing_current_working_perspective_writer_dry_run";
  const requestedExistingCanonical =
    normalizedTarget === "existing_canonical_perspective_state_writer_dry_run";
  const defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget =
    normalizedTarget === "manual_specific_current_working_writer_dry_run_adapter"
      ? "manual_specific_current_working_writer_dry_run_adapter"
      : "manual_specific_existing_canonical_state_writer_dry_run_adapter";
  const existingDryRunTargetRequested =
    requestedExistingCurrentWorking || requestedExistingCanonical;
  const sourceExistingWriterClaimedCompatible =
    sourceCompatibilityClaimedTrue(record);
  const blockerReasons = uniqueStrings([
    ...(source.missing
      ? ["source_perspective_writer_compatibility_readback_missing"]
      : []),
    ...(!active
      ? ["source_perspective_writer_compatibility_receipt_not_active_committed"]
      : []),
    ...(!record
      ? ["source_perspective_writer_compatibility_record_missing"]
      : []),
    ...(!record?.perspective_writer_compatibility_record_fingerprint
      ? ["source_perspective_writer_compatibility_record_fingerprint_missing"]
      : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...sourceReadbackMutationBlockers,
    ...(!writerCompatibilityLabelPresent
      ? ["writer_compatibility_label_missing"]
      : []),
    ...(!writerCompatibilityRationalePresent
      ? ["writer_compatibility_rationale_missing"]
      : []),
    ...(!writerCompatibilityStoragePathIsManualSpecific
      ? ["writer_compatibility_storage_path_must_be_manual_specific"]
      : []),
    ...(!writerCompatibilityExpectedScopeIsRecordOnly
      ? ["writer_compatibility_expected_future_write_scope_must_be_record_only"]
      : []),
    ...(!writerCompatibilityTargetRemainsManualSpecific ||
    existingDryRunTargetRequested
      ? ["writer_compatibility_existing_writer_target_must_not_be_ready"]
      : []),
    ...(sourceExistingWriterClaimedCompatible
      ? ["existing_writer_requires_unavailable_state_refs"]
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
      ? ["existing_writer_dry_run_explanation_insufficient"]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? ["manual_only_context_refs_must_not_be_treated_as_proof_or_evidence"]
      : []),
    ...(!sourceReadbackNoForbiddenWrites || !sourceAuthorityBoundaryReadOnly
      ? ["source_authority_boundary_not_read_only"]
      : []),
    ...(requestedExistingCurrentWorking
      ? [
          "existing_current_working_writer_dry_run_lineage_gap",
          "existing_writer_requires_unavailable_state_refs",
          "existing_writer_requires_unavailable_proof_or_work_refs",
          "existing_writer_dry_run_entrypoint_missing",
          "existing_writer_dry_run_side_effect_boundary_unproven",
        ]
      : []),
    ...(requestedExistingCanonical
      ? [
          "existing_canonical_state_writer_dry_run_lineage_gap",
          "existing_writer_requires_unavailable_state_refs",
          "existing_writer_requires_unavailable_proof_or_work_refs",
          "existing_writer_dry_run_entrypoint_missing",
          "existing_writer_dry_run_side_effect_boundary_unproven",
        ]
      : []),
  ]);
  const candidateReady = blockerReasons.length === 0;
  const effectiveTarget = candidateReady ? normalizedTarget : "blocked";
  const dryRunLabel = buildDryRunLabel(record, defaultTarget);
  const dryRunRationale = buildDryRunRationale(record, defaultTarget);
  const currentWorkingCompatibility = buildExistingCurrentWorkingDryRunCompatibility({
    fieldGaps,
    record,
    explanatoryMaterialPresent,
    requestedExistingCurrentWorking,
  });
  const canonicalCompatibility = buildExistingCanonicalStateDryRunCompatibility({
    fieldGaps,
    record,
    explanatoryMaterialPresent,
    requestedExistingCanonical,
  });
  const manualPath = buildManualExistingWriterAdapterPath({ candidateReady });
  const dryRunInputContract = buildProposedDryRunInputContract({
    currentWorkingCompatibility,
    canonicalCompatibility,
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
    "existing_writer_dry_run_contract_preview_only_no_dry_run_or_writer_invocation",
    "existing_current_working_writer_dry_run_compatibility_false_until_manual_lineage_mapping_exists",
    "existing_canonical_state_writer_dry_run_compatibility_false_until_structured_state_mapping_exists",
  ]);
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary();
  const nonWriteConfirmation =
    createPerspectiveExistingWriterDryRunNonWriteConfirmation();
  const idempotencyKey = `manual-global-dogfood-perspective-existing-writer-dry-run-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_VERSION,
    source_perspective_writer_compatibility_receipt_id:
      receipt?.receipt_id ?? null,
    source_perspective_writer_compatibility_record_id:
      record?.perspective_writer_compatibility_record_id ?? null,
    source_perspective_writer_compatibility_record_fingerprint:
      record?.perspective_writer_compatibility_record_fingerprint ?? null,
    source_perspective_state_application_receipt_id:
      receipt?.source_perspective_state_application_receipt_id ?? null,
    source_perspective_state_application_record_id:
      receipt?.source_perspective_state_application_record_id ?? null,
    source_perspective_state_application_record_fingerprint:
      receipt?.source_perspective_state_application_record_fingerprint ?? null,
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
    dry_run_label: dryRunLabel,
    dry_run_rationale: dryRunRationale,
    writer_compatibility_label: record?.writer_compatibility_label ?? null,
    writer_compatibility_rationale:
      record?.writer_compatibility_rationale ?? null,
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
    intended_future_dry_run_target: effectiveTarget,
    intended_future_writer_target: record?.intended_future_writer_target ?? null,
    default_future_writer_target: record?.default_future_writer_target ?? null,
    writer_compatibility_scope_hint:
      record?.writer_compatibility_scope_hint ?? null,
    writer_compatibility_strength_hint:
      record?.writer_compatibility_strength_hint ?? null,
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
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_VERSION,
    scope: source.readback.scope,
    source_readback_ref: sourceReadbackRef,
    source_perspective_writer_compatibility_receipt_id:
      receipt?.receipt_id ?? null,
    source_perspective_writer_compatibility_record_id:
      record?.perspective_writer_compatibility_record_id ?? null,
    source_perspective_writer_compatibility_record_fingerprint:
      record?.perspective_writer_compatibility_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    existing_current_working_writer_dry_run_compatibility:
      currentWorkingCompatibility,
    existing_canonical_state_writer_dry_run_compatibility:
      canonicalCompatibility,
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
    currentWorkingCompatibility.existing_route_integration_contract_compatible &&
    currentWorkingCompatibility.dry_run_entrypoint_detected;
  const existingCanonicalCompatible =
    canonicalCompatibility.existing_canonical_perspective_state_writer_compatible &&
    canonicalCompatibility.existing_canonical_perspective_state_read_model_compatible &&
    canonicalCompatibility.existing_canonical_perspective_state_route_compatible &&
    canonicalCompatibility.dry_run_entrypoint_detected;

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_VERSION,
    scope: source.readback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_perspective_writer_compatibility_readback_ref: sourceReadbackRef,
    source_perspective_writer_compatibility_receipt_id:
      receipt?.receipt_id ?? null,
    source_perspective_writer_compatibility_record_id:
      record?.perspective_writer_compatibility_record_id ?? null,
    source_perspective_writer_compatibility_record_fingerprint:
      record?.perspective_writer_compatibility_record_fingerprint ?? null,
    source_perspective_state_application_receipt_id:
      receipt?.source_perspective_state_application_receipt_id ?? null,
    source_perspective_state_application_record_id:
      receipt?.source_perspective_state_application_record_id ?? null,
    source_perspective_state_application_record_fingerprint:
      receipt?.source_perspective_state_application_record_fingerprint ?? null,
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
      ? "ready_for_future_existing_writer_dry_run_adapter_write_authorization"
      : "blocked_before_existing_writer_dry_run_adapter_authorization",
    proposed_existing_writer_dry_run_mapping: {
      dry_run_label: dryRunLabel,
      dry_run_rationale: dryRunRationale,
      writer_compatibility_label: record?.writer_compatibility_label ?? null,
      writer_compatibility_rationale:
        record?.writer_compatibility_rationale ?? null,
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
      intended_future_dry_run_target: effectiveTarget,
      default_future_dry_run_target: candidateReady ? defaultTarget : "blocked",
      can_feed_future_existing_writer_dry_run_write_candidate: candidateReady,
      can_call_existing_current_working_writer_now: false,
      can_call_existing_canonical_state_writer_now: false,
      can_run_existing_writer_dry_run_now: false,
      can_update_current_working_perspective_now: false,
      can_mutate_existing_canonical_perspective_state_now: false,
      can_promote_perspective_now: false,
      can_write_perspective_memory_now: false,
      can_mutate_work_now: false,
      can_write_proof_or_evidence_now: false,
      can_mutate_source_records_now: false,
    },
    proposed_existing_writer_dry_run_candidate: {
      candidate_kind:
        "manual_global_dogfood_perspective_existing_writer_dry_run_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_existing_writer_dry_run_adapter_write_authorization"
        : "blocked_before_existing_writer_dry_run_adapter_authorization",
      dry_run_scope_hint: candidateReady
        ? dryRunScopeHint(defaultTarget)
        : "blocked",
      dry_run_strength_hint: candidateReady
        ? strengthHint(record?.writer_compatibility_strength_hint)
        : "blocked",
      reason: candidateReady
        ? "Active committed manual Perspective writer compatibility material can feed a future separately authorized manual-specific existing-writer dry-run adapter record without running a dry-run or invoking existing writers."
        : "Source Perspective writer compatibility readback lacks the active, explanatory, manual-specific, no-source-mutation shape required before existing-writer dry-run adapter authorization.",
      writes_now: false,
      would_call_existing_current_working_writer: false,
      would_call_existing_canonical_state_writer: false,
      would_run_existing_writer_dry_run: false,
      would_update_current_working_perspective: false,
      would_mutate_existing_canonical_perspective_state: false,
      would_promote_perspective: false,
      would_write_perspective_memory: false,
      would_mutate_work: false,
      would_write_proof_or_evidence: false,
    },
    existing_current_working_writer_dry_run_compatibility:
      currentWorkingCompatibility,
    existing_canonical_state_writer_dry_run_compatibility:
      canonicalCompatibility,
    proposed_manual_existing_writer_adapter_path: manualPath,
    proposed_dry_run_input_contract: dryRunInputContract,
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_existing_writer_dry_run_adapter_write: true,
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
      dryRunInputContract,
    }),
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_existing_writer_dry_run_adapter_contract",
      "separate_future_existing_writer_dry_run_adapter_write_slice",
      "fresh_operator_confirmation_text_for_existing_writer_dry_run_adapter_write",
      "future_idempotent_existing_writer_dry_run_adapter_record_contract",
      "no_existing_writer_dry_run_invocation_without_proven_no_mutation_boundary",
      "no_existing_current_working_or_canonical_writer_invocation_without_proven_mapping",
      "no_current_working_perspective_or_existing_canonical_state_write_without_separate_contract",
      "no_proof_evidence_or_perspective_memory_fabrication",
    ],
    required_future_checks: [
      "confirm_perspective_writer_compatibility_receipt_is_still_active_committed",
      "confirm_perspective_writer_compatibility_record_fingerprint_still_matches_readback",
      "confirm_writer_compatibility_state_application_adapter_state_mutation_apply_canonical_update_relay_signal_bias_source_refs_still_match",
      "confirm_handoff_and_result_fingerprints_still_match",
      "confirm_expected_observed_mismatch_material_still_explains_the_existing_writer_dry_run_adapter_mapping",
      "confirm_manual_only_context_refs_are_not_proof_or_evidence_refs",
      "confirm_current_working_or_canonical_state_ref_mapping_before_existing_writer_reuse",
      "confirm_existing_writer_dry_run_input_contract_and_no_mutation_enforcement_before_invocation",
      "run_non_target_table_row_count_checks_before_and_after_future_write_or_dry_run",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        existingCurrentWorkingCompatible === false &&
        existingCanonicalCompatible === false &&
        nonWriteConfirmation.existing_writer_dry_run_executed === false &&
        nonWriteConfirmation.existing_current_working_writer_called === false &&
        nonWriteConfirmation.existing_canonical_state_writer_called === false &&
        authorityBoundary.can_run_existing_writer_dry_run === false &&
        authorityBoundary.can_call_existing_current_working_writer === false &&
        authorityBoundary.can_call_existing_canonical_state_writer === false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_mutate_existing_canonical_perspective_state ===
          false &&
        authorityBoundary.can_write_existing_canonical_perspective_state ===
          false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_perspective_writer_compatibility_receipt_present:
        Boolean(active),
      active_committed_perspective_writer_compatibility_record_present:
        Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      writer_compatibility_label_present: writerCompatibilityLabelPresent,
      writer_compatibility_rationale_present:
        writerCompatibilityRationalePresent,
      writer_compatibility_storage_path_is_manual_specific:
        writerCompatibilityStoragePathIsManualSpecific,
      writer_compatibility_expected_future_write_scope_is_record_only:
        writerCompatibilityExpectedScopeIsRecordOnly,
      writer_compatibility_target_remains_manual_specific:
        writerCompatibilityTargetRemainsManualSpecific,
      explanatory_expected_observed_material_present:
        explanatoryMaterialPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      source_next_work_candidate_card_ids_present: candidateCardIdsPresent,
      source_handoff_seed_fingerprint_present: handoffFingerprintPresent,
      source_result_text_fingerprint_present: resultFingerprintPresent,
      manual_context_not_proof_or_evidence: manualContextNotProofOrEvidence,
      existing_current_working_writer_dry_run_compatible:
        existingCurrentWorkingCompatible,
      existing_canonical_state_writer_dry_run_compatible:
        existingCanonicalCompatible,
      source_readback_preserves_no_existing_writer_dry_run_current_working_canonical_state_promotion_memory_work_proof_metric_writes:
        sourceReadbackNoForbiddenWrites && sourceAuthorityBoundaryReadOnly,
      no_write_authority:
        authorityBoundary.can_write_existing_writer_dry_run_adapter_record ===
          false &&
        authorityBoundary.can_update_current_working_perspective === false &&
        authorityBoundary.can_mutate_existing_canonical_perspective_state ===
          false &&
        authorityBoundary.can_write_existing_canonical_perspective_state ===
          false &&
        authorityBoundary.can_promote_perspective === false &&
        authorityBoundary.can_write_perspective_memory === false &&
        authorityBoundary.can_mutate_work === false &&
        authorityBoundary.can_write_proof_or_evidence === false,
      no_dry_run_authority:
        authorityBoundary.can_run_existing_writer_dry_run === false &&
        authorityBoundary.can_call_existing_current_working_writer === false &&
        authorityBoundary.can_call_existing_canonical_state_writer === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice: candidateReady
      ? "If accepted locally, implement a separate explicitly authorized idempotent existing-writer dry-run adapter record slice with source revalidation, duplicate replay, rollback/supersede, row-count validation, and no existing writer dry-run invocation until compatibility and side-effect boundaries are proven."
      : "Resolve Perspective writer compatibility readback blockers before preparing existing-writer dry-run adapter write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_existing_writer_dry_run_adapter_record: false,
    can_run_existing_writer_dry_run: false,
    can_call_existing_current_working_writer: false,
    can_call_existing_canonical_state_writer: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_writer_compatibility_record: false,
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
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback;
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
        value as ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
      missing: false,
    };
  }

  return {
    readback: {
      readback_kind:
        "research_candidate_manual_global_dogfood_perspective_writer_compatibility_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_perspective_writer_compatibility_readback.v0.1",
      scope: DEFAULT_SCOPE,
      storage_path: "manual_specific_perspective_writer_compatibility_tables",
      records_by_receipt: [],
      latest_receipts: [],
      latest_active_committed: null,
      count: 0,
      authority_boundary: createMissingSourceAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      perspective_writer_compatibility_record_written: false,
      existing_current_working_writer_called: false,
      existing_canonical_state_writer_called: false,
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

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary {
  return {
    can_write_perspective_writer_compatibility_record: true,
    can_write_perspective_writer_compatibility_receipt: true,
    can_write_perspective_writer_compatibility_rollback_metadata: true,
    source_of_truth: false,
    can_call_existing_current_working_writer: false,
    can_call_existing_canonical_state_writer: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_write_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_state_application_record: false,
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
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id
      ? "source_perspective_writer_compatibility_receipt_id"
      : null,
    !record?.perspective_writer_compatibility_record_id
      ? "source_perspective_writer_compatibility_record_id"
      : null,
    !record?.perspective_writer_compatibility_record_fingerprint
      ? "source_perspective_writer_compatibility_record_fingerprint"
      : null,
    !receipt?.source_perspective_state_application_receipt_id
      ? "source_perspective_state_application_receipt_id"
      : null,
    !receipt?.source_perspective_state_application_record_id
      ? "source_perspective_state_application_record_id"
      : null,
    !receipt?.source_perspective_state_application_record_fingerprint
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

function sourceReadbackPreservesNoExistingWriterDryRunWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
) {
  return (
    readback.existing_current_working_writer_called === false &&
    readback.existing_canonical_state_writer_called === false &&
    readback.current_working_perspective_updated === false &&
    readback.existing_canonical_perspective_state_table_mutated === false &&
    readback.canonical_perspective_state_written === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.perspective_state_application_record_mutated === false &&
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

function sourceAuthorityBoundaryPreservesNoExistingWriterDryRunWrites(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
) {
  return (
    readback.authority_boundary.can_call_existing_current_working_writer ===
      false &&
    readback.authority_boundary.can_call_existing_canonical_state_writer ===
      false &&
    readback.authority_boundary.can_update_current_working_perspective ===
      false &&
    readback.authority_boundary.can_mutate_existing_canonical_perspective_state ===
      false &&
    readback.authority_boundary.can_write_existing_canonical_perspective_state ===
      false &&
    readback.authority_boundary.can_promote_perspective === false &&
    readback.authority_boundary.can_write_perspective_memory === false &&
    readback.authority_boundary.can_mutate_perspective_state_application_record ===
      false &&
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
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
) {
  return uniqueStrings([
    readback.existing_current_working_writer_called
      ? "source_writer_compatibility_readback_existing_current_working_writer_already_called"
      : null,
    readback.existing_canonical_state_writer_called
      ? "source_writer_compatibility_readback_existing_canonical_state_writer_already_called"
      : null,
    readback.current_working_perspective_updated
      ? "source_writer_compatibility_readback_current_working_perspective_already_updated"
      : null,
    readback.existing_canonical_perspective_state_table_mutated ||
    readback.canonical_perspective_state_written
      ? "source_writer_compatibility_readback_existing_canonical_state_already_mutated"
      : null,
    readback.perspective_promoted
      ? "source_writer_compatibility_readback_perspective_promoted"
      : null,
    readback.perspective_memory_written
      ? "source_writer_compatibility_readback_perspective_memory_written"
      : null,
    readback.work_mutated
      ? "source_writer_compatibility_readback_work_mutated"
      : null,
    readback.proof_or_evidence_rows_written
      ? "source_writer_compatibility_readback_proof_or_evidence_written"
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
    readback.perspective_adapter_record_mutated ||
    readback.perspective_state_application_record_mutated
      ? "source_writer_compatibility_readback_metric_or_source_store_mutated"
      : null,
    readback.product_write_executed
      ? "source_writer_compatibility_product_write_executed"
      : null,
    readback.raw_manual_note_text_present ||
    readback.raw_result_report_text_present ||
    readback.operator_notes_persisted
      ? "source_writer_compatibility_raw_text_or_operator_note_present"
      : null,
  ]);
}

function buildExistingCurrentWorkingDryRunCompatibility({
  fieldGaps,
  record,
  explanatoryMaterialPresent,
  requestedExistingCurrentWorking,
}: {
  fieldGaps: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null;
  explanatoryMaterialPresent: boolean;
  requestedExistingCurrentWorking: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility {
  return {
    existing_current_working_perspective_update_contract_preview_compatible:
      false,
    existing_current_working_perspective_update_contract_write_compatible:
      false,
    existing_current_working_perspective_apply_preview_compatible: false,
    existing_current_working_perspective_apply_write_compatible: false,
    existing_route_integration_contract_compatible: false,
    dry_run_entrypoint_detected: false,
    existing_writer_entrypoints: CURRENT_WORKING_ENTRYPOINTS,
    dry_run_entrypoints: [],
    required_input_fields: [
      "source_current_working_perspective_ref",
      "source_cwp_version",
      "current_working_perspective_patch_entries",
      "current_working_perspective_apply_decision_preview",
      "applied_current_working_perspective_snapshot",
      "route_integration_contract_material",
    ],
    available_manual_source_fields: AVAILABLE_MANUAL_SOURCE_FIELDS,
    dry_run_required_fields: [
      "existing_current_working_writer_dry_run_route",
      "no_mutation_enforcement",
      "row_count_before_after_snapshot",
      "dry_run_result_readback",
    ],
    dry_run_missing_fields: [
      "existing_current_working_writer_dry_run_route",
      "current_working_writer_dry_run_result_schema",
      "current_working_writer_non_mutation_proof",
    ],
    compatibility_notes: [
      "Manual writer compatibility readback preserves manual source-chain refs, but it does not contain an existing current-working Perspective ref or current-working patch entries.",
      "No existing current-working writer dry-run entrypoint is invoked or treated as available by this preview.",
      ...(requestedExistingCurrentWorking
        ? [
            "Requested existing current-working writer dry-run target is blocked until explicit mapping can prove source lineage, patch material, no-mutation enforcement, and row-count behavior.",
          ]
        : []),
    ],
    field_gaps: uniqueStrings([
      ...fieldGaps,
      ...(!record ? ["source_perspective_writer_compatibility_record"] : []),
      ...(!explanatoryMaterialPresent
        ? ["expected_observed_mismatch_explanation"]
        : []),
    ]),
    authority_gaps: [
      "this_preview_has_no_existing_current_working_writer_call_authority",
      "this_preview_has_no_existing_writer_dry_run_authority",
      "this_preview_has_no_current_working_perspective_update_authority",
      "future_existing_writer_dry_run_use_requires_separate_authorization",
    ],
    source_lineage_gaps: [
      "manual_source_chain_is_not_a_current_working_perspective_lineage",
      "accepted_manual_context_refs_are_not_current_working_evidence_refs",
      "no_existing_current_working_writer_receipt_or_dry_run_event_is_present",
    ],
    dry_run_gaps: [
      "existing_current_working_writer_dry_run_entrypoint_missing",
      "existing_current_working_writer_no_mutation_boundary_unproven",
      "existing_current_working_writer_row_count_snapshot_contract_missing",
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
      "manual_specific_current_working_writer_dry_run_adapter_contract",
  };
}

function buildExistingCanonicalStateDryRunCompatibility({
  fieldGaps,
  record,
  explanatoryMaterialPresent,
  requestedExistingCanonical,
}: {
  fieldGaps: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null;
  explanatoryMaterialPresent: boolean;
  requestedExistingCanonical: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility {
  return {
    existing_canonical_perspective_state_writer_compatible: false,
    existing_canonical_perspective_state_read_model_compatible: false,
    existing_canonical_perspective_state_route_compatible: false,
    dry_run_entrypoint_detected: false,
    existing_writer_entrypoints: CANONICAL_STATE_ENTRYPOINTS,
    dry_run_entrypoints: [],
    existing_state_tables_detected: [
      "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
      "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
      "research_candidate_manual_global_dogfood_perspective_state_application_receipts",
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
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
    dry_run_required_fields: [
      "existing_canonical_state_writer_dry_run_route",
      "no_mutation_enforcement",
      "row_count_before_after_snapshot",
      "dry_run_result_readback",
    ],
    dry_run_missing_fields: [
      "existing_canonical_state_writer_dry_run_route",
      "canonical_state_writer_dry_run_result_schema",
      "canonical_state_writer_non_mutation_proof",
    ],
    compatibility_notes: [
      "Manual writer compatibility readback preserves canonical update source metadata but not existing canonical state table row ids or structured claim/evidence/tension/gap refs.",
      "No existing canonical Perspective state writer dry-run entrypoint is invoked or treated as available by this preview.",
      ...(requestedExistingCanonical
        ? [
            "Requested existing canonical Perspective state writer dry-run target is blocked because this preview cannot fabricate canonical state ids, proof/evidence refs, no-mutation enforcement, or dry-run result rows.",
          ]
        : []),
    ],
    field_gaps: uniqueStrings([
      ...fieldGaps,
      ...(!record ? ["source_perspective_writer_compatibility_record"] : []),
      ...(!explanatoryMaterialPresent
        ? ["expected_observed_mismatch_explanation"]
        : []),
    ]),
    authority_gaps: [
      "this_preview_has_no_existing_canonical_state_writer_call_authority",
      "this_preview_has_no_existing_writer_dry_run_authority",
      "this_preview_has_no_existing_canonical_state_mutation_authority",
      "future_existing_writer_dry_run_use_requires_separate_authorization",
    ],
    source_lineage_gaps: [
      "manual_source_chain_is_not_existing_canonical_state_lineage",
      "manual_only_context_refs_are_not_proof_or_evidence_refs",
      "no_existing_canonical_state_writer_receipt_or_dry_run_event_is_present",
    ],
    dry_run_gaps: [
      "existing_canonical_state_writer_dry_run_entrypoint_missing",
      "existing_canonical_state_writer_no_mutation_boundary_unproven",
      "existing_canonical_state_writer_row_count_snapshot_contract_missing",
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
      "manual_specific_existing_canonical_state_writer_dry_run_adapter_contract",
  };
}

function buildManualExistingWriterAdapterPath({
  candidateReady,
}: {
  candidateReady: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveManualExistingWriterAdapterPath {
  return {
    recommended_storage_path: candidateReady
      ? "manual_specific_perspective_existing_writer_dry_run_adapter_tables"
      : "blocked",
    expected_future_write_scope: candidateReady
      ? "existing_writer_dry_run_adapter_record_only"
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
    requires_existing_writer_dry_run_contract: true,
    requires_existing_writer_dry_run_result_readback: true,
    requires_existing_writer_non_mutation_proof: true,
    requires_current_working_or_canonical_state_ref_mapping: true,
    requires_strict_dry_run_side_effect_boundary: true,
  };
}

function buildProposedDryRunInputContract({
  currentWorkingCompatibility,
  canonicalCompatibility,
}: {
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputContract {
  return {
    dry_run_input_contract_kind:
      "manual_global_dogfood_perspective_existing_writer_dry_run_input_contract",
    dry_run_input_contract_version:
      "manual_global_dogfood_perspective_existing_writer_dry_run_input_contract.v0.1",
    can_construct_existing_current_working_writer_input_now: false,
    can_construct_existing_canonical_state_writer_input_now: false,
    would_require_manual_adapter_record: true,
    would_require_existing_writer_dry_run_route: true,
    would_require_no_mutation_enforcement: true,
    would_require_row_count_before_after_snapshot: true,
    would_require_source_chain_binding: true,
    would_require_current_working_refs:
      currentWorkingCompatibility.missing_current_working_refs,
    would_require_canonical_state_refs:
      canonicalCompatibility.missing_canonical_state_refs,
    would_require_proof_or_evidence_refs: uniqueStrings([
      ...currentWorkingCompatibility.missing_proof_or_evidence_refs,
      ...canonicalCompatibility.missing_proof_or_evidence_refs,
    ]),
    would_require_work_refs: uniqueStrings([
      ...currentWorkingCompatibility.missing_work_refs,
      ...canonicalCompatibility.missing_work_refs,
    ]),
    would_require_memory_refs: uniqueStrings([
      ...currentWorkingCompatibility.missing_memory_refs,
      ...canonicalCompatibility.missing_memory_refs,
    ]),
    available_manual_fields: AVAILABLE_MANUAL_SOURCE_FIELDS,
    missing_fields_for_existing_current_working_writer: uniqueStrings([
      ...currentWorkingCompatibility.missing_current_working_refs,
      ...currentWorkingCompatibility.missing_patch_or_apply_material,
      ...currentWorkingCompatibility.dry_run_missing_fields,
    ]),
    missing_fields_for_existing_canonical_state_writer: uniqueStrings([
      ...canonicalCompatibility.missing_canonical_state_refs,
      ...canonicalCompatibility.missing_structured_state_material,
      ...canonicalCompatibility.missing_claim_evidence_tension_gap_refs,
      ...canonicalCompatibility.dry_run_missing_fields,
    ]),
    proposed_adapter_field_mapping: [
      "manual_writer_compatibility_receipt_to_adapter_source_receipt",
      "manual_writer_compatibility_record_to_adapter_source_record",
      "manual_chain_fingerprints_to_adapter_source_fingerprints",
      "expected_observed_mismatch_material_to_adapter_explanation",
      "candidate_context_refs_to_manual_context_only_not_evidence",
    ],
    non_fabrication_rules: [
      "do_not_fabricate_current_working_refs",
      "do_not_fabricate_existing_canonical_state_refs",
      "do_not_fabricate_proof_or_evidence_refs",
      "do_not_treat_manual_only_context_refs_as_evidence",
      "do_not_fabricate_dry_run_result_rows",
    ],
    dry_run_side_effect_forbidden_flags: [
      "existing_current_working_writer_called",
      "existing_canonical_state_writer_called",
      "current_working_perspective_updated",
      "existing_canonical_perspective_state_table_mutated",
      "canonical_perspective_state_written",
      "perspective_promoted",
      "perspective_memory_written",
      "work_mutated",
      "proof_or_evidence_rows_written",
      "dogfood_metrics_written",
      "product_write_executed",
    ],
  };
}

function buildCompatibilitySummary({
  currentWorkingCompatibility,
  canonicalCompatibility,
  manualPath,
}: {
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility;
  manualPath: ResearchCandidateManualGlobalDogfoodPerspectiveManualExistingWriterAdapterPath;
}) {
  return [
    `existing_current_working_writer_dry_run_compatible=${String(
      currentWorkingCompatibility.dry_run_entrypoint_detected,
    )}`,
    `existing_canonical_state_writer_dry_run_compatible=${String(
      canonicalCompatibility.dry_run_entrypoint_detected,
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
  dryRunInputContract,
}: {
  candidateReady: boolean;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
  sourceReadbackNoForbiddenWrites: boolean;
  sourceReadbackMutationBlockers: string[];
  currentWorkingCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility;
  canonicalCompatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility;
  manualPath: ResearchCandidateManualGlobalDogfoodPerspectiveManualExistingWriterAdapterPath;
  dryRunInputContract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputContract;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunFinding[] {
  return [
    {
      finding_code: candidateReady
        ? "manual_existing_writer_dry_run_candidate_ready"
        : "manual_existing_writer_dry_run_candidate_blocked",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "future_existing_writer_dry_run_adapter",
      summary: candidateReady
        ? "Manual writer compatibility readback can feed a future manual-specific existing-writer dry-run adapter record preview without running dry-runs or invoking existing writers."
        : "Manual writer compatibility readback is not ready to feed existing-writer dry-run adapter authorization.",
    },
    {
      finding_code:
        "existing_current_working_writer_dry_run_compatibility_false",
      severity: "warning",
      applies_to: "existing_current_working_perspective_writer_dry_run",
      summary: currentWorkingCompatibility.compatibility_notes.join(" "),
    },
    {
      finding_code: "existing_canonical_state_writer_dry_run_compatibility_false",
      severity: "warning",
      applies_to: "existing_canonical_perspective_state_writer_dry_run",
      summary: canonicalCompatibility.compatibility_notes.join(" "),
    },
    {
      finding_code: "manual_existing_writer_adapter_path_visible",
      severity: candidateReady ? "ready" : "blocker",
      applies_to:
        "manual_specific_perspective_existing_writer_dry_run_adapter_path",
      summary: `Future path is ${manualPath.recommended_storage_path} with scope ${manualPath.expected_future_write_scope}.`,
    },
    {
      finding_code: "proposed_dry_run_input_contract_visible",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "future_existing_writer_dry_run_adapter",
      summary: `Existing writer input construction remains false; missing current-working fields: ${dryRunInputContract.missing_fields_for_existing_current_working_writer.length}, missing canonical fields: ${dryRunInputContract.missing_fields_for_existing_canonical_state_writer.length}.`,
    },
    ...(fieldGaps.length
      ? [
          {
            finding_code: "manual_source_chain_field_gaps",
            severity: "blocker" as const,
            applies_to:
              "manual_global_dogfood_perspective_writer_compatibility" as const,
            summary: `Missing source fields: ${fieldGaps.join(", ")}`,
          },
        ]
      : []),
    ...(!explanatoryMaterialPresent
      ? [
          {
            finding_code: "existing_writer_dry_run_explanation_gap",
            severity: "blocker" as const,
            applies_to: "future_existing_writer_dry_run_adapter" as const,
            summary:
              "Expected, observed, mismatch, and rationale material must be present before future existing-writer dry-run adapter authorization.",
          },
        ]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? [
          {
            finding_code: "manual_context_not_proof_evidence_gap",
            severity: "blocker" as const,
            applies_to: "future_existing_writer_dry_run_adapter" as const,
            summary:
              "Manual-only context refs cannot be treated as proof/evidence refs.",
          },
        ]
      : []),
    ...(!sourceReadbackNoForbiddenWrites || sourceReadbackMutationBlockers.length
      ? [
          {
            finding_code: "source_readback_forbidden_mutation_gap",
            severity: "blocker" as const,
            applies_to:
              "manual_global_dogfood_perspective_writer_compatibility" as const,
            summary:
              sourceReadbackMutationBlockers.join(", ") ||
              "Source readback does not preserve the required no-write/no-dry-run flags.",
          },
        ]
      : []),
  ];
}

function createPerspectiveExistingWriterDryRunNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonWriteConfirmation {
  return {
    existing_writer_dry_run_executed: false,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_writer_compatibility_record_mutated: false,
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
    product_write_executed: false,
    api_write_route_added: false,
    dry_run_api_route_added: false,
    db_schema_or_migration_added: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    operator_note_persisted: false,
  };
}

function sourceCompatibilityClaimedTrue(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null,
) {
  if (!record) return false;
  return (
    objectHasTruthyCompatibility(
      record.existing_current_working_writer_compatibility,
    ) ||
    objectHasTruthyCompatibility(record.existing_canonical_state_writer_compatibility)
  );
}

function objectHasTruthyCompatibility(value: Record<string, unknown>) {
  return Object.entries(value).some(
    ([key, entry]) => /compatible/i.test(key) && entry === true,
  );
}

function normalizeDryRunTarget(
  target:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget
    | undefined,
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget {
  if (
    target === "manual_specific_current_working_writer_dry_run_adapter" ||
    target === "existing_current_working_perspective_writer_dry_run" ||
    target === "existing_canonical_perspective_state_writer_dry_run"
  ) {
    return target;
  }
  return "manual_specific_existing_canonical_state_writer_dry_run_adapter";
}

function deriveDryRunTargetFromSourceRecord(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null,
):
  | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget
  | undefined {
  return (
    mapWriterTargetToDryRunTarget(record?.intended_future_writer_target) ??
    mapWriterTargetToDryRunTarget(record?.default_future_writer_target)
  );
}

function mapWriterTargetToDryRunTarget(
  target: string | null | undefined,
):
  | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget
  | undefined {
  if (target === "manual_specific_current_working_writer_adapter") {
    return "manual_specific_current_working_writer_dry_run_adapter";
  }

  if (target === "manual_specific_existing_canonical_state_writer_adapter") {
    return "manual_specific_existing_canonical_state_writer_dry_run_adapter";
  }

  return undefined;
}

function dryRunScopeHint(
  target: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget,
) {
  if (target === "manual_specific_current_working_writer_dry_run_adapter") {
    return "manual_specific_current_working_writer_dry_run_adapter";
  }
  return "manual_specific_existing_canonical_state_writer_dry_run_adapter";
}

function strengthHint(value: unknown): "low" | "medium" | "high" {
  if (value === "low" || value === "high") return value;
  return "medium";
}

function buildDryRunLabel(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null,
  defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget,
) {
  const sourceLabel = record?.writer_compatibility_label?.trim();
  if (sourceLabel) return `Existing writer dry-run adapter preview for ${sourceLabel}`;
  return `Existing writer dry-run adapter preview for ${defaultTarget}`;
}

function buildDryRunRationale(
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord | null,
  defaultTarget: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget,
) {
  const sourceRationale = record?.writer_compatibility_rationale?.trim();
  const suffix =
    "The preview is manual-specific, does not run an existing writer dry-run, and keeps existing writer targets behind a future adapter contract with row-count and no-mutation proof.";
  if (sourceRationale) return `${sourceRationale} ${suffix}`;
  return `Manual writer compatibility material can be inspected for ${defaultTarget}. ${suffix}`;
}

function normalizeLabel(value: string | undefined, fallback = DEFAULT_OPERATOR_INTENT_LABEL) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values.filter((value): value is string => Boolean(value?.trim())),
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

function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
