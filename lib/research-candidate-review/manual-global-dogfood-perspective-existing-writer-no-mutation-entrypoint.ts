import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAdapterTarget,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointNonMutationAssertions,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointRowCountObservation,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSnapshotSource,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceBinding,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointStatus,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSupportedCapabilities,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";
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
const DIRECT_EXISTING_WRITER_TARGETS = new Set([
  "existing_current_working_perspective_writer_dry_run",
  "existing_canonical_perspective_state_writer_dry_run",
]);
const SAFE_ADAPTER_TARGETS = new Set([
  "manual_specific_current_working_writer_dry_run_adapter",
  "manual_specific_existing_canonical_state_writer_dry_run_adapter",
]);

export function buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint({
  existing_writer_dry_run_contract,
  existing_writer_dry_run_review,
  existing_writer_dry_run_result,
  row_count_before,
  row_count_after,
  candidate_dry_run_adapter_input,
  allow_safe_adapter_noop = true,
}: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointInput): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult {
  const contract = existing_writer_dry_run_contract ?? null;
  const review = existing_writer_dry_run_review ?? null;
  const dryRunResult = existing_writer_dry_run_result ?? null;
  const sourceBinding = buildSourceBinding({ contract, review, dryRunResult });
  const snapshotSource = determineSnapshotSource({
    row_count_before,
    row_count_after,
    dryRunResult,
  });
  const protectedRowCounts = buildProtectedRowCountObservations({
    before: row_count_before ?? null,
    after: row_count_after ?? null,
    dryRunResult,
  });
  const nonMutationAssertions = createNonMutationAssertions({
    snapshotSource,
    protectedRowCounts,
  });
  const rawPayloadForbiddenFields = findForbiddenRawPayloadFields(
    candidate_dry_run_adapter_input,
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
  const sourceDryRunResultValidated =
    Boolean(dryRunResult) &&
    dryRunResult?.validation.passed === true &&
    dryRunResult?.non_mutation_proof.existing_writer_called === false &&
    dryRunResult?.non_mutation_proof.all_protected_row_counts_unchanged ===
      true;
  const sourceDryRunResultMatchesContractReview =
    Boolean(contract && review && dryRunResult) &&
    dryRunResult?.source_binding.source_contract_fingerprint ===
      contract?.validation.contract_fingerprint &&
    dryRunResult?.source_binding.source_review_fingerprint ===
      review?.validation.review_fingerprint &&
    dryRunResult?.source_binding.source_perspective_writer_compatibility_receipt_id ===
      contract?.source_perspective_writer_compatibility_receipt_id &&
    dryRunResult?.source_binding.source_perspective_writer_compatibility_record_id ===
      contract?.source_perspective_writer_compatibility_record_id &&
    dryRunResult?.source_binding
      .source_perspective_writer_compatibility_record_fingerprint ===
      contract?.source_perspective_writer_compatibility_record_fingerprint &&
    dryRunResult?.source_binding.source_handoff_seed_fingerprint ===
      contract?.source_handoff_seed_fingerprint &&
    dryRunResult?.source_binding.source_result_text_fingerprint ===
      contract?.source_result_text_fingerprint &&
    dryRunResult?.source_binding.accepted_future_dry_run_target ===
      review?.accepted_mapping_summary?.intended_future_dry_run_target;
  const directExistingWriterTargetRequested =
    DIRECT_EXISTING_WRITER_TARGETS.has(
      contract?.proposed_existing_writer_dry_run_mapping
        .intended_future_dry_run_target ?? "",
    ) ||
    DIRECT_EXISTING_WRITER_TARGETS.has(
      review?.accepted_mapping_summary?.intended_future_dry_run_target ?? "",
    ) ||
    Boolean(
      contract?.blocker_reasons.some((reason) =>
        [
          "writer_compatibility_existing_writer_target_must_not_be_ready",
          "existing_current_working_writer_dry_run_lineage_gap",
          "existing_canonical_state_writer_dry_run_lineage_gap",
        ].includes(reason),
      ),
    );
  const safeAdapterTargetSupported =
    SAFE_ADAPTER_TARGETS.has(sourceBinding.safe_adapter_target);
  const failureReasons = uniqueStrings([
    ...(!contract ? ["source_contract_missing"] : []),
    ...(!review ? ["source_review_missing"] : []),
    ...(!dryRunResult ? ["source_dry_run_result_missing"] : []),
    ...(contract && !sourceContractReady
      ? ["source_contract_not_ready"]
      : []),
    ...(review && !sourceReviewAccepted
      ? ["source_review_not_accepted"]
      : []),
    ...(dryRunResult && !sourceDryRunResultValidated
      ? ["source_dry_run_result_not_validated"]
      : []),
    ...(contract &&
    review &&
    !sourceContractFingerprintMatchesReview
      ? ["source_contract_fingerprint_mismatch"]
      : []),
    ...(contract && review && !acceptedMappingMatchesContract
      ? ["accepted_mapping_summary_mismatch"]
      : []),
    ...(contract &&
    review &&
    dryRunResult &&
    !sourceDryRunResultMatchesContractReview
      ? ["source_dry_run_result_mismatch"]
      : []),
    ...(!safeAdapterTargetSupported
      ? ["safe_adapter_target_unsupported"]
      : []),
    ...(directExistingWriterTargetRequested
      ? ["direct_existing_writer_target_refused"]
      : []),
    ...(rawPayloadForbiddenFields.length > 0
      ? ["raw_payload_forbidden_fields_present"]
      : []),
    ...(!nonMutationAssertions.all_protected_row_counts_unchanged
      ? ["protected_row_count_delta_detected"]
      : []),
  ]);
  const entrypointStatus = determineEntrypointStatus({
    failureReasons,
    directExistingWriterTargetRequested,
    rawPayloadForbiddenFields,
    rowCountsUnchanged:
      nonMutationAssertions.all_protected_row_counts_unchanged,
    allowSafeAdapterNoop: allow_safe_adapter_noop,
  });
  const supportedCapabilities = buildSupportedCapabilities({
    entrypointStatus,
    allowSafeAdapterNoop: allow_safe_adapter_noop,
  });
  const safeAdapterNoopExecuted =
    entrypointStatus === "safe_no_mutation_entrypoint_available";
  const warningReasons = uniqueStrings([
    ...(contract?.warning_reasons ?? []),
    ...(review?.warning_reasons ?? []),
    ...(!allow_safe_adapter_noop ? ["safe_adapter_noop_disabled"] : []),
    "existing_writer_call_not_attempted_by_no_mutation_entrypoint_harness",
  ]);
  const executionTrace = buildExecutionTrace({
    sourceContractReady,
    sourceReviewAccepted,
    sourceDryRunResultValidated,
    sourceDryRunResultMatchesContractReview,
    safeAdapterTargetSupported,
    rawPayloadForbiddenFields,
    directExistingWriterTargetRequested,
    rowCountsUnchanged:
      nonMutationAssertions.all_protected_row_counts_unchanged,
    safeAdapterNoopExecuted,
    entrypointStatus,
  });
  const entrypointFingerprint = fingerprint({
    entrypoint_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_KIND,
    entrypoint_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_VERSION,
    source_binding: sourceBinding,
    entrypoint_status: entrypointStatus,
    protected_row_counts: protectedRowCounts,
    failure_reasons: failureReasons,
    warning_reasons: warningReasons,
    supported_capabilities: supportedCapabilities,
  });
  const validationPassed =
    failureReasons.length === 0 &&
    nonMutationAssertions.all_protected_row_counts_unchanged === true &&
    nonMutationAssertions.existing_writer_called === false;

  return {
    entrypoint_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_KIND,
    entrypoint_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_VERSION,
    scope: contract?.scope ?? review?.scope ?? dryRunResult?.scope ?? DEFAULT_SCOPE,
    entrypoint_status: entrypointStatus,
    source_binding: sourceBinding,
    source_contract_fingerprint: sourceBinding.source_contract_fingerprint,
    source_review_fingerprint: sourceBinding.source_review_fingerprint,
    source_dry_run_result_fingerprint:
      sourceBinding.source_dry_run_result_fingerprint,
    safe_adapter_target: sourceBinding.safe_adapter_target,
    supported_capabilities: supportedCapabilities,
    execution_decision: {
      adapter_runnable_today:
        entrypointStatus === "safe_no_mutation_entrypoint_available",
      safe_adapter_noop_executed: safeAdapterNoopExecuted,
      existing_writer_called: false,
      existing_writer_skipped: true,
      skipped_existing_writer_reason:
        "safe_adapter_noop_harness_does_not_call_existing_mutating_writers",
      execution_trace: executionTrace,
    },
    non_mutation_assertions: nonMutationAssertions,
    validation: {
      passed: validationPassed,
      entrypoint_fingerprint: entrypointFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      source_contract_present: Boolean(contract),
      source_review_present: Boolean(review),
      source_dry_run_result_present: Boolean(dryRunResult),
      source_contract_ready: sourceContractReady,
      source_review_accepted: sourceReviewAccepted,
      source_dry_run_result_validated: sourceDryRunResultValidated,
      source_contract_fingerprint_matches_review:
        sourceContractFingerprintMatchesReview,
      accepted_mapping_summary_matches_contract: acceptedMappingMatchesContract,
      source_dry_run_result_matches_contract_review:
        sourceDryRunResultMatchesContractReview,
      safe_adapter_target_supported: safeAdapterTargetSupported,
      direct_existing_writer_target_requested:
        directExistingWriterTargetRequested,
      direct_existing_writer_target_refused: directExistingWriterTargetRequested,
      raw_payload_absent: rawPayloadForbiddenFields.length === 0,
      raw_payload_forbidden_fields: rawPayloadForbiddenFields,
      row_count_snapshots_present:
        snapshotSource !== "default_empty_in_memory_noop",
      protected_row_counts_unchanged:
        nonMutationAssertions.all_protected_row_counts_unchanged,
      existing_writer_called: false,
      existing_writer_call_faked: false,
      safe_adapter_noop_executed: safeAdapterNoopExecuted,
      no_write_authority: true,
      no_existing_writer_authority: true,
      no_provider_github_codex_retrieval_authority: true,
      failure_reasons: failureReasons,
      warning_reasons: warningReasons,
    },
    authority_boundary:
      createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAuthorityBoundary(),
    blocker_reasons: failureReasons,
    warning_reasons: warningReasons,
    next_recommended_slice:
      entrypointStatus === "safe_no_mutation_entrypoint_available"
        ? "Review the safe no-mutation entrypoint proof before any future explicit result-record write slice."
        : entrypointStatus === "unsupported_no_safe_entrypoint"
          ? "Implement or enable a safe adapter-only no-mutation entrypoint before invoking any existing writer dry-run."
          : "Resolve entrypoint input validation blockers before retrying the safe no-mutation entrypoint.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_run_safe_adapter_noop: true,
    can_call_existing_current_working_writer: false,
    can_call_existing_canonical_state_writer: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
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
  dryRunResult,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract | null;
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview | null;
  dryRunResult: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceBinding {
  const accepted = review?.accepted_mapping_summary ?? null;
  const intendedTarget =
    accepted?.intended_future_dry_run_target ??
    contract?.proposed_existing_writer_dry_run_mapping
      .intended_future_dry_run_target ??
    null;
  return {
    source_contract_fingerprint:
      contract?.validation.contract_fingerprint ?? null,
    source_review_fingerprint: review?.validation.review_fingerprint ?? null,
    source_dry_run_result_fingerprint:
      dryRunResult?.validation.result_fingerprint ?? null,
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
    source_handoff_seed_fingerprint:
      contract?.source_handoff_seed_fingerprint ?? null,
    source_result_text_fingerprint:
      contract?.source_result_text_fingerprint ?? null,
    intended_future_dry_run_target:
      contract?.proposed_existing_writer_dry_run_mapping
        .intended_future_dry_run_target ?? null,
    accepted_future_dry_run_target:
      accepted?.intended_future_dry_run_target ?? null,
    safe_adapter_target: normalizeSafeAdapterTarget(intendedTarget),
  };
}

function determineSnapshotSource({
  row_count_before,
  row_count_after,
  dryRunResult,
}: {
  row_count_before?: Record<string, number> | null;
  row_count_after?: Record<string, number> | null;
  dryRunResult: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSnapshotSource {
  if (row_count_before || row_count_after) return "provided_before_after";
  if (dryRunResult) return "dry_run_result_protected_row_counts";
  return "default_empty_in_memory_noop";
}

function buildProtectedRowCountObservations({
  before,
  after,
  dryRunResult,
}: {
  before: Record<string, number> | null;
  after: Record<string, number> | null;
  dryRunResult: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointRowCountObservation[] {
  const dryRunRowsByTable = new Map(
    dryRunResult?.non_mutation_proof.protected_table_row_counts.map((row) => [
      row.table_name,
      row,
    ]) ?? [],
  );
  const resolvedBefore = Object.fromEntries(
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES.map(
      (tableName) => [
        tableName,
        before?.[tableName] ?? dryRunRowsByTable.get(tableName)?.before_count,
      ],
    ),
  );
  const resolvedAfter = Object.fromEntries(
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES.map(
      (tableName) => [
        tableName,
        after?.[tableName] ?? dryRunRowsByTable.get(tableName)?.after_count,
      ],
    ),
  );
  return buildRowCountObservations(
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
    resolvedBefore,
    resolvedAfter,
  );
}

function createNonMutationAssertions({
  snapshotSource,
  protectedRowCounts,
}: {
  snapshotSource: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSnapshotSource;
  protectedRowCounts: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointRowCountObservation[];
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointNonMutationAssertions {
  const changedProtectedTableCount = protectedRowCounts.filter(
    (observation) => observation.changed,
  ).length;
  return {
    assertion_kind:
      "manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_assertions",
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
    work_mutated: false,
    dogfood_metrics_written: false,
    proof_or_evidence_written: false,
    manual_result_records_written: false,
    product_write_executed: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    raw_operator_note_or_result_persisted: false,
  };
}

function determineEntrypointStatus({
  failureReasons,
  directExistingWriterTargetRequested,
  rawPayloadForbiddenFields,
  rowCountsUnchanged,
  allowSafeAdapterNoop,
}: {
  failureReasons: string[];
  directExistingWriterTargetRequested: boolean;
  rawPayloadForbiddenFields: string[];
  rowCountsUnchanged: boolean;
  allowSafeAdapterNoop: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointStatus {
  if (directExistingWriterTargetRequested) {
    return "unsafe_existing_writer_target_refused";
  }
  if (rawPayloadForbiddenFields.length > 0) return "input_validation_failed";
  if (!rowCountsUnchanged) return "row_count_delta_detected";
  if (failureReasons.length > 0) return "input_validation_failed";
  return allowSafeAdapterNoop
    ? "safe_no_mutation_entrypoint_available"
    : "unsupported_no_safe_entrypoint";
}

function buildSupportedCapabilities({
  entrypointStatus,
  allowSafeAdapterNoop,
}: {
  entrypointStatus: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointStatus;
  allowSafeAdapterNoop: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSupportedCapabilities {
  const available =
    entrypointStatus === "safe_no_mutation_entrypoint_available";
  return {
    supports_row_count_snapshot: available,
    supports_transaction_rollback: available,
    supports_no_mutation_assertions: available,
    supports_safe_adapter_noop: available && allowSafeAdapterNoop,
    supports_existing_writer_call: false,
  };
}

function buildExecutionTrace({
  sourceContractReady,
  sourceReviewAccepted,
  sourceDryRunResultValidated,
  sourceDryRunResultMatchesContractReview,
  safeAdapterTargetSupported,
  rawPayloadForbiddenFields,
  directExistingWriterTargetRequested,
  rowCountsUnchanged,
  safeAdapterNoopExecuted,
  entrypointStatus,
}: {
  sourceContractReady: boolean;
  sourceReviewAccepted: boolean;
  sourceDryRunResultValidated: boolean;
  sourceDryRunResultMatchesContractReview: boolean;
  safeAdapterTargetSupported: boolean;
  rawPayloadForbiddenFields: string[];
  directExistingWriterTargetRequested: boolean;
  rowCountsUnchanged: boolean;
  safeAdapterNoopExecuted: boolean;
  entrypointStatus: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointStatus;
}) {
  return [
    `source_contract_ready:${String(sourceContractReady)}`,
    `source_review_accepted:${String(sourceReviewAccepted)}`,
    `source_dry_run_result_validated:${String(sourceDryRunResultValidated)}`,
    `source_dry_run_result_matches_contract_review:${String(sourceDryRunResultMatchesContractReview)}`,
    `safe_adapter_target_supported:${String(safeAdapterTargetSupported)}`,
    `raw_payload_absent:${String(rawPayloadForbiddenFields.length === 0)}`,
    `direct_existing_writer_target_refused:${String(directExistingWriterTargetRequested)}`,
    `protected_row_counts_unchanged:${String(rowCountsUnchanged)}`,
    `safe_adapter_noop_executed:${String(safeAdapterNoopExecuted)}`,
    `entrypoint_status:${entrypointStatus}`,
  ];
}

function normalizeSafeAdapterTarget(
  target: string | null,
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAdapterTarget {
  if (target === "manual_specific_current_working_writer_dry_run_adapter") {
    return "manual_specific_current_working_writer_dry_run_adapter";
  }
  if (target === "manual_specific_existing_canonical_state_writer_dry_run_adapter") {
    return "manual_specific_existing_canonical_state_writer_dry_run_adapter";
  }
  return "blocked";
}
