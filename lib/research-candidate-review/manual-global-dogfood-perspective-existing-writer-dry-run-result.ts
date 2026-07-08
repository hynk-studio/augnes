import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunEntrypointStatus,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputValidation,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonMutationProof,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultStatus,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunRowCountObservation,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSnapshotSource,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSourceBinding,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import {
  buildRowCountObservations,
  findForbiddenRawMaterialFields as findForbiddenRawPayloadFields,
  fingerprint,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  uniqueStrings,
} from "@/lib/research-candidate-review/shared-source-chain-guards";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const ACCEPTED_REVIEW_STATUS =
  "ready_for_future_existing_writer_dry_run_adapter_write_slice";

export function buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
  existing_writer_dry_run_contract,
  existing_writer_dry_run_review,
  row_count_before,
  row_count_after,
  candidate_input,
  safe_existing_writer_no_mutation_entrypoint,
  safe_existing_writer_no_mutation_entrypoint_result,
}: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultInput): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult {
  const contract = existing_writer_dry_run_contract ?? null;
  const review = existing_writer_dry_run_review ?? null;
  const sourceBinding = buildSourceBinding({ contract, review });
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultAuthorityBoundary();
  const snapshotSource: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSnapshotSource =
    row_count_before || row_count_after
      ? "provided_before_after"
      : "default_empty_in_memory_noop";
  const protectedRowCounts = buildProtectedRowCountObservations({
    before: row_count_before ?? null,
    after: row_count_after ?? null,
  });
  const rawPayloadForbiddenFields =
    findForbiddenRawPayloadFields(candidate_input);
  const directExistingWriterTargetRequested =
    sourceBinding.intended_future_dry_run_target ===
      "existing_current_working_perspective_writer_dry_run" ||
    sourceBinding.intended_future_dry_run_target ===
      "existing_canonical_perspective_state_writer_dry_run" ||
    Boolean(
      contract?.blocker_reasons.some((reason) =>
        [
          "writer_compatibility_existing_writer_target_must_not_be_ready",
          "existing_current_working_writer_dry_run_lineage_gap",
          "existing_canonical_state_writer_dry_run_lineage_gap",
        ].includes(reason),
      ),
    );
  const sourceContractReady =
    Boolean(contract) &&
    contract?.operator_authorization_mode ===
      "ready_for_future_existing_writer_dry_run_adapter_write_authorization" &&
    contract?.validation.passed === true &&
    contract?.blocker_reasons.length === 0;
  const sourceReviewAccepted =
    Boolean(review) &&
    review?.review_status === ACCEPTED_REVIEW_STATUS &&
    review?.validation.passed === true &&
    Boolean(review?.accepted_mapping_summary);
  const sourceContractFingerprintMatchesReview =
    Boolean(contract && review) &&
    contract?.validation.contract_fingerprint ===
      review?.source_contract_fingerprint &&
    review?.accepted_mapping_summary?.source_contract_fingerprint ===
      contract?.validation.contract_fingerprint;
  const acceptedMappingMatchesContract =
    Boolean(contract && review?.accepted_mapping_summary) &&
    review?.accepted_mapping_summary?.source_perspective_writer_compatibility_receipt_id ===
      contract?.source_perspective_writer_compatibility_receipt_id &&
    review?.accepted_mapping_summary?.source_perspective_writer_compatibility_record_id ===
      contract?.source_perspective_writer_compatibility_record_id &&
    review?.accepted_mapping_summary
      ?.source_perspective_writer_compatibility_record_fingerprint ===
      contract?.source_perspective_writer_compatibility_record_fingerprint &&
    review?.accepted_mapping_summary?.source_handoff_seed_fingerprint ===
      contract?.source_handoff_seed_fingerprint &&
    review?.accepted_mapping_summary?.source_result_text_fingerprint ===
      contract?.source_result_text_fingerprint &&
    review?.accepted_mapping_summary?.proposed_idempotency_key ===
      contract?.idempotency_contract_preview.proposed_idempotency_key &&
    review?.accepted_mapping_summary?.intended_future_dry_run_target ===
      contract?.proposed_existing_writer_dry_run_mapping
        .intended_future_dry_run_target;
  const rowCountsUnchanged = protectedRowCounts.every(
    (observation) => observation.changed === false,
  );
  const entrypointResult =
    safe_existing_writer_no_mutation_entrypoint_result ?? null;
  const entrypointResultSourceMatches = doesEntrypointResultMatchSource({
    entrypointResult,
    contract,
    review,
  });
  const entrypointResultValidated =
    Boolean(entrypointResult) &&
    entrypointResultSourceMatches &&
    entrypointResult?.validation.passed === true &&
    entrypointResult?.non_mutation_assertions
      .all_protected_row_counts_unchanged === true &&
    entrypointResult?.execution_decision.existing_writer_called === false &&
    entrypointResult?.non_mutation_assertions.existing_writer_called === false;
  const entrypointResultAvailable =
    entrypointResultValidated &&
    entrypointResult?.entrypoint_status ===
      "safe_no_mutation_entrypoint_available" &&
    entrypointResult?.supported_capabilities.supports_row_count_snapshot ===
      true &&
    entrypointResult?.supported_capabilities.supports_transaction_rollback ===
      true &&
    entrypointResult?.supported_capabilities
      .supports_no_mutation_assertions === true;
  const entrypointStatus = normalizeEntrypointStatus(
    entrypointResultAvailable
      ? {
          detected: true,
          entrypoint_id:
            entrypointResult?.validation.entrypoint_fingerprint ?? null,
          supports_row_count_snapshot: true,
          supports_transaction_rollback: true,
          supports_no_mutation_assertions: true,
        }
      : safe_existing_writer_no_mutation_entrypoint,
  );
  const existingCurrentWorkingEntrypointDetected =
    contract?.existing_current_working_writer_dry_run_compatibility
      .dry_run_entrypoint_detected === true;
  const existingCanonicalEntrypointDetected =
    contract?.existing_canonical_state_writer_dry_run_compatibility
      .dry_run_entrypoint_detected === true;
  const legacyEntrypointSupported =
    entrypointStatus.detected === true &&
    entrypointStatus.supports_row_count_snapshot === true &&
    entrypointStatus.supports_transaction_rollback === true &&
    entrypointStatus.supports_no_mutation_assertions === true &&
    (existingCurrentWorkingEntrypointDetected ||
      existingCanonicalEntrypointDetected);
  const existingWriterSupportedToday =
    entrypointResultAvailable || legacyEntrypointSupported;
  const failureReasons = uniqueStrings([
    ...(!contract ? ["source_contract_missing"] : []),
    ...(!review ? ["source_review_missing"] : []),
    ...(contract && !sourceContractReady
      ? ["source_contract_not_ready"]
      : []),
    ...(review && !sourceReviewAccepted
      ? ["source_review_not_accepted"]
      : []),
    ...(contract &&
    review &&
    !sourceContractFingerprintMatchesReview
      ? ["source_contract_fingerprint_mismatch"]
      : []),
    ...(contract && review && !acceptedMappingMatchesContract
      ? ["accepted_mapping_summary_mismatch"]
      : []),
    ...(entrypointResult &&
    (!entrypointResultSourceMatches || !entrypointResultValidated)
      ? ["safe_existing_writer_no_mutation_entrypoint_result_invalid"]
      : []),
    ...(directExistingWriterTargetRequested
      ? ["direct_existing_writer_target_refused"]
      : []),
    ...(rawPayloadForbiddenFields.length > 0
      ? ["raw_payload_forbidden_fields_present"]
      : []),
    ...(!rowCountsUnchanged ? ["protected_row_count_delta_detected"] : []),
  ]);
  const runnableTodayBlockers = uniqueStrings([
    ...(!entrypointStatus.detected
      ? ["safe_existing_writer_no_mutation_entrypoint_missing"]
      : []),
    ...(!entrypointStatus.supports_row_count_snapshot
      ? ["safe_entrypoint_row_count_snapshot_support_missing"]
      : []),
    ...(!entrypointStatus.supports_transaction_rollback
      ? ["safe_entrypoint_transaction_rollback_support_missing"]
      : []),
    ...(!entrypointStatus.supports_no_mutation_assertions
      ? ["safe_entrypoint_no_mutation_assertions_missing"]
      : []),
    ...(!entrypointResultAvailable && !existingCurrentWorkingEntrypointDetected
      ? ["existing_current_working_writer_dry_run_entrypoint_missing"]
      : []),
    ...(!entrypointResultAvailable && !existingCanonicalEntrypointDetected
      ? ["existing_canonical_state_writer_dry_run_entrypoint_missing"]
      : []),
    ...(!entrypointResultAvailable &&
    contract?.proposed_dry_run_input_contract
      .can_construct_existing_current_working_writer_input_now === false
      ? ["existing_current_working_writer_input_construction_false"]
      : []),
    ...(!entrypointResultAvailable &&
    contract?.proposed_dry_run_input_contract
      .can_construct_existing_canonical_state_writer_input_now === false
      ? ["existing_canonical_state_writer_input_construction_false"]
      : []),
    ...(entrypointResultValidated &&
    !entrypointResultAvailable &&
    entrypointResult?.entrypoint_status === "unsupported_no_safe_entrypoint"
      ? ["safe_entrypoint_result_unsupported_no_safe_entrypoint"]
      : []),
  ]);
  const warningReasons = uniqueStrings([
    ...(contract?.warning_reasons ?? []),
    ...(review?.warning_reasons ?? []),
    ...runnableTodayBlockers,
    "existing_writer_call_not_attempted_by_no_mutation_result_harness",
  ]);
  const resultStatus = determineResultStatus({
    failureReasons,
    sourceContractReady,
    sourceReviewAccepted,
    sourceContractFingerprintMatchesReview,
    acceptedMappingMatchesContract,
    rawPayloadForbiddenFields,
    rowCountsUnchanged,
    existingWriterSupportedToday,
  });
  const nonMutationProof = createNonMutationProof({
    snapshotSource,
    protectedRowCounts,
  });
  const resultFingerprint = fingerprint({
    result_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_KIND,
    result_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_VERSION,
    source_binding: sourceBinding,
    result_status: resultStatus,
    protected_row_counts: protectedRowCounts,
    failure_reasons: failureReasons,
    warning_reasons: warningReasons,
    existing_writer_supported_today: existingWriterSupportedToday,
    safe_entrypoint_result_fingerprint:
      entrypointResult?.validation.entrypoint_fingerprint ?? null,
    safe_entrypoint_result_status:
      entrypointResult?.entrypoint_status ?? null,
  });
  const validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputValidation =
    {
      passed:
        failureReasons.length === 0 &&
        nonMutationProof.all_protected_row_counts_unchanged === true &&
        nonMutationProof.existing_writer_called === false,
      result_fingerprint: resultFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      source_contract_present: Boolean(contract),
      source_review_present: Boolean(review),
      source_contract_ready: sourceContractReady,
      source_review_accepted: sourceReviewAccepted,
      source_contract_fingerprint_matches_review:
        sourceContractFingerprintMatchesReview,
      accepted_mapping_summary_matches_contract: acceptedMappingMatchesContract,
      direct_existing_writer_target_requested:
        directExistingWriterTargetRequested,
      direct_existing_writer_target_refused: directExistingWriterTargetRequested,
      raw_payload_absent: rawPayloadForbiddenFields.length === 0,
      raw_payload_forbidden_fields: rawPayloadForbiddenFields,
      row_count_snapshots_present: Boolean(row_count_before && row_count_after),
      protected_row_counts_unchanged:
        nonMutationProof.all_protected_row_counts_unchanged,
      safe_existing_writer_no_mutation_entrypoint_result_present:
        Boolean(entrypointResult),
      safe_existing_writer_no_mutation_entrypoint_result_validated:
        entrypointResultValidated,
      safe_existing_writer_no_mutation_entrypoint_result_available:
        entrypointResultAvailable,
      safe_existing_writer_no_mutation_entrypoint_result_fingerprint:
        entrypointResult?.validation.entrypoint_fingerprint ?? null,
      safe_existing_writer_no_mutation_entrypoint_result_status:
        entrypointResult?.entrypoint_status ?? null,
      safe_existing_writer_no_mutation_entrypoint_detected:
        entrypointStatus.detected,
      existing_current_working_writer_dry_run_entrypoint_detected:
        existingCurrentWorkingEntrypointDetected,
      existing_canonical_state_writer_dry_run_entrypoint_detected:
        existingCanonicalEntrypointDetected,
      existing_writer_supported_today: existingWriterSupportedToday,
      existing_writer_called: false,
      existing_writer_call_faked: false,
      no_write_authority: true,
      no_existing_writer_authority: true,
      no_provider_github_codex_retrieval_authority: true,
      failure_reasons: failureReasons,
      warning_reasons: warningReasons,
    };

  return {
    result_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_KIND,
    result_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_VERSION,
    scope: contract?.scope ?? review?.scope ?? DEFAULT_SCOPE,
    result_status: resultStatus,
    source_binding: sourceBinding,
    execution_decision: {
      adapter_runnable_today: existingWriterSupportedToday,
      existing_writer_support_status:
        failureReasons.length > 0
          ? "blocked_input_validation"
          : existingWriterSupportedToday
            ? "supported_no_mutation_entrypoint_available"
            : "unsupported_no_safe_entrypoint",
      existing_writer_called: false,
      existing_writer_skipped: true,
      skip_reason:
        failureReasons.length > 0
          ? "input_validation_blocked_existing_writer_no_mutation_harness"
          : existingWriterSupportedToday
            ? "existing_writer_call_skipped_by_this_result_harness"
            : "no_safe_existing_writer_no_mutation_entrypoint_available",
      runnable_today_blockers: runnableTodayBlockers,
    },
    non_mutation_proof: nonMutationProof,
    validation,
    authority_boundary: authorityBoundary,
    blocker_reasons: failureReasons,
    warning_reasons: warningReasons,
    next_recommended_slice:
      resultStatus === "existing_writer_unsupported"
        ? "Implement a separately authorized safe existing-writer no-mutation entrypoint before any current-working or canonical-state writer dry-run can be invoked."
        : resultStatus === "no_mutation_dry_run_passed"
          ? "Review the no-mutation result and decide whether a future explicit adapter write slice should persist a result record."
          : "Resolve input validation blockers before re-running the no-mutation result harness.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_existing_writer_dry_run_result_record: false,
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

function buildSourceBinding({
  contract,
  review,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract | null;
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSourceBinding {
  const accepted = review?.accepted_mapping_summary ?? null;
  return {
    source_contract_fingerprint:
      contract?.validation.contract_fingerprint ?? null,
    source_review_fingerprint: review?.validation.review_fingerprint ?? null,
    accepted_mapping_summary_present: Boolean(accepted),
    accepted_mapping_contract_fingerprint:
      accepted?.source_contract_fingerprint ?? null,
    source_perspective_writer_compatibility_receipt_id:
      contract?.source_perspective_writer_compatibility_receipt_id ?? null,
    source_perspective_writer_compatibility_record_id:
      contract?.source_perspective_writer_compatibility_record_id ?? null,
    source_perspective_writer_compatibility_record_fingerprint:
      contract?.source_perspective_writer_compatibility_record_fingerprint ??
      null,
    accepted_perspective_writer_compatibility_receipt_id:
      accepted?.source_perspective_writer_compatibility_receipt_id ?? null,
    accepted_perspective_writer_compatibility_record_id:
      accepted?.source_perspective_writer_compatibility_record_id ?? null,
    accepted_perspective_writer_compatibility_record_fingerprint:
      accepted?.source_perspective_writer_compatibility_record_fingerprint ??
      null,
    source_handoff_seed_fingerprint:
      contract?.source_handoff_seed_fingerprint ?? null,
    source_result_text_fingerprint:
      contract?.source_result_text_fingerprint ?? null,
    proposed_idempotency_key:
      contract?.idempotency_contract_preview.proposed_idempotency_key ?? null,
    accepted_proposed_idempotency_key:
      accepted?.proposed_idempotency_key ?? null,
    intended_future_dry_run_target:
      contract?.proposed_existing_writer_dry_run_mapping
        .intended_future_dry_run_target ?? null,
    accepted_future_dry_run_target:
      accepted?.intended_future_dry_run_target ?? null,
  };
}

function buildProtectedRowCountObservations({
  before,
  after,
}: {
  before: Record<string, number> | null;
  after: Record<string, number> | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunRowCountObservation[] {
  return buildRowCountObservations(
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
    before,
    after,
  );
}

function createNonMutationProof({
  snapshotSource,
  protectedRowCounts,
}: {
  snapshotSource: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSnapshotSource;
  protectedRowCounts: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunRowCountObservation[];
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonMutationProof {
  const changedProtectedTableCount = protectedRowCounts.filter(
    (observation) => observation.changed,
  ).length;
  return {
    proof_kind:
      "manual_global_dogfood_perspective_existing_writer_no_mutation_dry_run_proof",
    snapshot_source: snapshotSource,
    protected_table_row_counts: protectedRowCounts,
    protected_table_count: protectedRowCounts.length,
    changed_protected_table_count: changedProtectedTableCount,
    all_protected_row_counts_unchanged: changedProtectedTableCount === 0,
    row_count_before_after_snapshot_recorded: true,
    existing_writer_called: false,
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

function determineResultStatus({
  failureReasons,
  sourceContractReady,
  sourceReviewAccepted,
  sourceContractFingerprintMatchesReview,
  acceptedMappingMatchesContract,
  rawPayloadForbiddenFields,
  rowCountsUnchanged,
  existingWriterSupportedToday,
}: {
  failureReasons: string[];
  sourceContractReady: boolean;
  sourceReviewAccepted: boolean;
  sourceContractFingerprintMatchesReview: boolean;
  acceptedMappingMatchesContract: boolean;
  rawPayloadForbiddenFields: string[];
  rowCountsUnchanged: boolean;
  existingWriterSupportedToday: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultStatus {
  if (rawPayloadForbiddenFields.length > 0) return "raw_payload_refused";
  if (!rowCountsUnchanged) return "row_count_delta_detected";
  if (!sourceContractReady) return "source_contract_not_ready";
  if (!sourceReviewAccepted) return "source_review_not_accepted";
  if (!sourceContractFingerprintMatchesReview || !acceptedMappingMatchesContract) {
    return "source_chain_mismatch";
  }
  if (failureReasons.length > 0) return "blocked";
  return existingWriterSupportedToday
    ? "no_mutation_dry_run_passed"
    : "existing_writer_unsupported";
}

function normalizeEntrypointStatus(
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunEntrypointStatus | null | undefined,
): Required<ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunEntrypointStatus> {
  return {
    detected: entrypoint?.detected === true,
    entrypoint_id: entrypoint?.entrypoint_id ?? null,
    supports_row_count_snapshot:
      entrypoint?.supports_row_count_snapshot === true,
    supports_transaction_rollback:
      entrypoint?.supports_transaction_rollback === true,
    supports_no_mutation_assertions:
      entrypoint?.supports_no_mutation_assertions === true,
  };
}

function doesEntrypointResultMatchSource({
  entrypointResult,
  contract,
  review,
}: {
  entrypointResult: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null;
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract | null;
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview | null;
}) {
  if (!entrypointResult || !contract || !review) return false;
  return (
    entrypointResult.source_contract_fingerprint ===
      contract.validation.contract_fingerprint &&
    entrypointResult.source_review_fingerprint ===
      review.validation.review_fingerprint &&
    entrypointResult.source_binding.source_perspective_writer_compatibility_receipt_id ===
      contract.source_perspective_writer_compatibility_receipt_id &&
    entrypointResult.source_binding.source_perspective_writer_compatibility_record_id ===
      contract.source_perspective_writer_compatibility_record_id &&
    entrypointResult.source_binding
      .source_perspective_writer_compatibility_record_fingerprint ===
      contract.source_perspective_writer_compatibility_record_fingerprint &&
    entrypointResult.source_binding.source_handoff_seed_fingerprint ===
      contract.source_handoff_seed_fingerprint &&
    entrypointResult.source_binding.source_result_text_fingerprint ===
      contract.source_result_text_fingerprint &&
    entrypointResult.source_binding.accepted_future_dry_run_target ===
      review.accepted_mapping_summary?.intended_future_dry_run_target
  );
}
