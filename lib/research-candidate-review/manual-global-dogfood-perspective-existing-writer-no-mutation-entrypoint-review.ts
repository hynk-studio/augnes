import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAcceptedSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewDecision,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewStatus,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import {
  allValuesFalse,
  fingerprint,
  requiredStringFieldsPresent,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  uniqueStrings,
} from "@/lib/research-candidate-review/shared-source-chain-guards";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export function buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview({
  source_entrypoint_result,
  operator_decision,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  operator_note,
}: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewInput): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview {
  const entrypoint = source_entrypoint_result ?? null;
  const sourceWriterCompatibilityRefs =
    buildSourceWriterCompatibilityRefs(entrypoint);
  const rowCountSummary = buildRowCountSummary(entrypoint);
  const nonMutationSummary = buildNonMutationSummary(entrypoint);
  const sourceBindingSummary = buildSourceBindingSummary({
    entrypoint,
    sourceWriterCompatibilityRefs,
  });
  const sourceEntrypointPresent = Boolean(entrypoint);
  const sourceEntrypointReady =
    entrypoint?.entrypoint_status === "safe_no_mutation_entrypoint_available";
  const sourceEntrypointLineageComplete = isSourceLineageComplete({
    entrypoint,
    refs: sourceWriterCompatibilityRefs,
  });
  const sourceEntrypointRowCountsUnchanged =
    rowCountSummary.all_protected_row_counts_unchanged === true &&
    rowCountSummary.changed_protected_table_count === 0;
  const sourceEntrypointSafe = isSourceEntrypointSafe({
    entrypoint,
    rowCountSummary,
    nonMutationSummary,
  });
  const normalizedOperatorDecision = operator_decision ?? null;
  const reviewStatus = determineReviewStatus({
    sourceEntrypointPresent,
    sourceEntrypointReady,
    sourceEntrypointSafe,
    sourceEntrypointLineageComplete,
    sourceEntrypointRowCountsUnchanged,
    operatorDecision: normalizedOperatorDecision,
  });
  const blockerReasons = buildBlockerReasons({
    entrypoint,
    sourceEntrypointPresent,
    sourceEntrypointReady,
    sourceEntrypointSafe,
    sourceEntrypointLineageComplete,
    sourceEntrypointRowCountsUnchanged,
    operatorDecision: normalizedOperatorDecision,
    reviewStatus,
  });
  const warningReasons = uniqueStrings([
    ...(entrypoint?.warning_reasons ?? []),
    ...(operator_note?.trim()
      ? ["operator_note_received_local_only_not_persisted"]
      : []),
    ...(requested_operator_ref?.trim()
      ? ["requested_operator_ref_local_only_not_persisted"]
      : []),
    ...(requested_idempotency_key?.trim()
      ? ["requested_idempotency_key_local_only_not_persisted"]
      : []),
    ...(review_confirmation_ref?.trim()
      ? ["review_confirmation_ref_local_only_not_persisted"]
      : []),
  ]);
  const acceptedEntrypointSummary =
    reviewStatus === "ready_for_future_no_mutation_result_record_planning"
      ? buildAcceptedEntrypointSummary({
          entrypoint: entrypoint as ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult,
          rowCountSummary,
          nonMutationSummary,
          sourceBindingSummary,
          sourceWriterCompatibilityRefs,
        })
      : null;
  const reviewFingerprint = fingerprint({
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_VERSION,
    source_entrypoint_fingerprint:
      entrypoint?.validation.entrypoint_fingerprint ?? null,
    operator_decision: normalizedOperatorDecision,
    review_status: reviewStatus,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    requested_operator_ref: requested_operator_ref ?? null,
    requested_idempotency_key: requested_idempotency_key ?? null,
    review_confirmation_ref: review_confirmation_ref ?? null,
  });

  return {
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_VERSION,
    scope: entrypoint?.scope ?? DEFAULT_SCOPE,
    review_status: reviewStatus,
    operator_decision: normalizedOperatorDecision,
    requested_operator_ref: requested_operator_ref ?? null,
    requested_idempotency_key: requested_idempotency_key ?? null,
    review_confirmation_ref: review_confirmation_ref ?? null,
    source_entrypoint_fingerprint:
      entrypoint?.validation.entrypoint_fingerprint ?? null,
    source_entrypoint_status: entrypoint?.entrypoint_status ?? null,
    source_contract_fingerprint:
      entrypoint?.source_contract_fingerprint ?? null,
    source_review_fingerprint: entrypoint?.source_review_fingerprint ?? null,
    source_dry_run_result_fingerprint:
      entrypoint?.source_dry_run_result_fingerprint ?? null,
    source_writer_compatibility_refs: sourceWriterCompatibilityRefs,
    safe_adapter_target: entrypoint?.safe_adapter_target ?? null,
    row_count_summary: rowCountSummary,
    non_mutation_summary: nonMutationSummary,
    source_binding_summary: sourceBindingSummary,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    accepted_entrypoint_summary: acceptedEntrypointSummary,
    authority_boundary:
      createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewAuthorityBoundary(),
    explicit_non_write_boundary:
      createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary(),
    validation: {
      passed:
        reviewStatus ===
        "ready_for_future_no_mutation_result_record_planning",
      review_fingerprint: reviewFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      source_entrypoint_present: sourceEntrypointPresent,
      source_entrypoint_ready: sourceEntrypointReady,
      source_entrypoint_safe: sourceEntrypointSafe,
      source_entrypoint_lineage_complete: sourceEntrypointLineageComplete,
      source_entrypoint_row_counts_unchanged:
        sourceEntrypointRowCountsUnchanged,
      operator_decision_present: Boolean(normalizedOperatorDecision),
      operator_accepts_safe_entrypoint:
        sourceEntrypointSafe &&
        sourceEntrypointLineageComplete &&
        normalizedOperatorDecision ===
          "accept_entrypoint_for_future_result_record_planning",
      no_write_authority: true,
      no_existing_writer_authority: true,
      no_provider_github_codex_retrieval_authority: true,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_no_mutation_result_record: false,
    can_write_review_record: false,
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

export function createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary {
  return {
    durable_review_record_written: false,
    no_mutation_result_record_written: false,
    existing_writer_called: false,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    work_mutated: false,
    proof_or_evidence_written: false,
    dogfood_metrics_written: false,
    product_or_delivery_record_written: false,
    source_record_mutated: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    raw_manual_note_result_or_operator_note_persisted: false,
    action_button_added: false,
    server_action_added: false,
    browser_or_network_call_added: false,
  };
}

function determineReviewStatus({
  sourceEntrypointPresent,
  sourceEntrypointReady,
  sourceEntrypointSafe,
  sourceEntrypointLineageComplete,
  sourceEntrypointRowCountsUnchanged,
  operatorDecision,
}: {
  sourceEntrypointPresent: boolean;
  sourceEntrypointReady: boolean;
  sourceEntrypointSafe: boolean;
  sourceEntrypointLineageComplete: boolean;
  sourceEntrypointRowCountsUnchanged: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewDecision | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewStatus {
  if (!sourceEntrypointPresent) return "source_entrypoint_missing";
  if (!sourceEntrypointRowCountsUnchanged) {
    return "source_entrypoint_row_count_delta";
  }
  if (!sourceEntrypointReady) return "source_entrypoint_not_ready";
  if (!sourceEntrypointSafe) return "source_entrypoint_not_safe";
  if (!sourceEntrypointLineageComplete) {
    return "source_entrypoint_lineage_mismatch";
  }
  if (!operatorDecision) return "operator_decision_missing";
  if (operatorDecision === "defer_entrypoint_review") {
    return "operator_decision_deferred";
  }
  if (operatorDecision === "reject_entrypoint_review") {
    return "operator_decision_rejected";
  }
  if (
    operatorDecision ===
    "accept_entrypoint_for_future_result_record_planning"
  ) {
    return "ready_for_future_no_mutation_result_record_planning";
  }
  return "blocked";
}

function buildBlockerReasons({
  entrypoint,
  sourceEntrypointPresent,
  sourceEntrypointReady,
  sourceEntrypointSafe,
  sourceEntrypointLineageComplete,
  sourceEntrypointRowCountsUnchanged,
  operatorDecision,
  reviewStatus,
}: {
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null;
  sourceEntrypointPresent: boolean;
  sourceEntrypointReady: boolean;
  sourceEntrypointSafe: boolean;
  sourceEntrypointLineageComplete: boolean;
  sourceEntrypointRowCountsUnchanged: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewDecision | null;
  reviewStatus: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewStatus;
}) {
  if (reviewStatus === "ready_for_future_no_mutation_result_record_planning") {
    return [];
  }
  return uniqueStrings([
    ...(!sourceEntrypointPresent ? ["source_entrypoint_missing"] : []),
    ...(!sourceEntrypointRowCountsUnchanged
      ? ["source_entrypoint_row_count_delta"]
      : []),
    ...(sourceEntrypointPresent && !sourceEntrypointReady
      ? ["source_entrypoint_not_ready"]
      : []),
    ...(sourceEntrypointPresent && !sourceEntrypointSafe
      ? ["source_entrypoint_not_safe"]
      : []),
    ...(sourceEntrypointPresent && !sourceEntrypointLineageComplete
      ? ["source_entrypoint_lineage_mismatch"]
      : []),
    ...(!operatorDecision ? ["operator_decision_missing"] : []),
    ...(operatorDecision === "defer_entrypoint_review"
      ? ["operator_deferred_entrypoint_review"]
      : []),
    ...(operatorDecision === "reject_entrypoint_review"
      ? ["operator_rejected_entrypoint_review"]
      : []),
    ...(entrypoint?.blocker_reasons ?? []),
  ]);
}

function buildSourceWriterCompatibilityRefs(
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null,
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs {
  return {
    source_perspective_writer_compatibility_receipt_id:
      entrypoint?.source_binding
        .source_perspective_writer_compatibility_receipt_id ?? null,
    source_perspective_writer_compatibility_record_id:
      entrypoint?.source_binding
        .source_perspective_writer_compatibility_record_id ?? null,
    source_perspective_writer_compatibility_record_fingerprint:
      entrypoint?.source_binding
        .source_perspective_writer_compatibility_record_fingerprint ?? null,
  };
}

function buildRowCountSummary(
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null,
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary {
  return {
    protected_table_count:
      entrypoint?.non_mutation_assertions.protected_table_count ?? 0,
    changed_protected_table_count:
      entrypoint?.non_mutation_assertions.changed_protected_table_count ?? 0,
    all_protected_row_counts_unchanged:
      entrypoint?.non_mutation_assertions
        .all_protected_row_counts_unchanged ?? false,
    row_count_before_after_snapshot_recorded:
      entrypoint?.non_mutation_assertions
        .row_count_before_after_snapshot_recorded ?? false,
    rows:
      entrypoint?.non_mutation_assertions.protected_table_row_counts ?? [],
  };
}

function buildNonMutationSummary(
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null,
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary {
  return {
    existing_writer_called:
      entrypoint?.non_mutation_assertions.existing_writer_called ?? false,
    existing_current_working_writer_called:
      entrypoint?.non_mutation_assertions
        .existing_current_working_writer_called ?? false,
    existing_canonical_state_writer_called:
      entrypoint?.non_mutation_assertions
        .existing_canonical_state_writer_called ?? false,
    current_working_perspective_updated:
      entrypoint?.non_mutation_assertions
        .current_working_perspective_updated ?? false,
    existing_canonical_perspective_state_table_mutated:
      entrypoint?.non_mutation_assertions
        .existing_canonical_perspective_state_table_mutated ?? false,
    canonical_perspective_state_written:
      entrypoint?.non_mutation_assertions.canonical_perspective_state_written ??
      false,
    perspective_promoted:
      entrypoint?.non_mutation_assertions.perspective_promoted ?? false,
    perspective_memory_written:
      entrypoint?.non_mutation_assertions.perspective_memory_written ?? false,
    work_mutated: entrypoint?.non_mutation_assertions.work_mutated ?? false,
    dogfood_metrics_written:
      entrypoint?.non_mutation_assertions.dogfood_metrics_written ?? false,
    proof_or_evidence_written:
      entrypoint?.non_mutation_assertions.proof_or_evidence_written ?? false,
    manual_result_records_written:
      entrypoint?.non_mutation_assertions.manual_result_records_written ??
      false,
    product_write_executed:
      entrypoint?.non_mutation_assertions.product_write_executed ?? false,
    provider_openai_called:
      entrypoint?.non_mutation_assertions.provider_openai_called ?? false,
    github_called: entrypoint?.non_mutation_assertions.github_called ?? false,
    codex_executed:
      entrypoint?.non_mutation_assertions.codex_executed ?? false,
    sources_fetched:
      entrypoint?.non_mutation_assertions.sources_fetched ?? false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run:
      entrypoint?.non_mutation_assertions
        .retrieval_rag_embeddings_vector_fts_or_crawler_run ?? false,
    raw_operator_note_or_result_persisted:
      entrypoint?.non_mutation_assertions
        .raw_operator_note_or_result_persisted ?? false,
  };
}

function buildSourceBindingSummary({
  entrypoint,
  sourceWriterCompatibilityRefs,
}: {
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null;
  sourceWriterCompatibilityRefs: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary {
  return {
    source_entrypoint_fingerprint:
      entrypoint?.validation.entrypoint_fingerprint ?? null,
    source_entrypoint_status: entrypoint?.entrypoint_status ?? null,
    source_contract_fingerprint:
      entrypoint?.source_contract_fingerprint ?? null,
    source_review_fingerprint: entrypoint?.source_review_fingerprint ?? null,
    source_dry_run_result_fingerprint:
      entrypoint?.source_dry_run_result_fingerprint ?? null,
    safe_adapter_target: entrypoint?.safe_adapter_target ?? null,
    accepted_mapping_summary_present:
      entrypoint?.source_binding.accepted_mapping_summary_present ?? false,
    source_writer_compatibility_refs: sourceWriterCompatibilityRefs,
  };
}

function buildAcceptedEntrypointSummary({
  entrypoint,
  rowCountSummary,
  nonMutationSummary,
  sourceBindingSummary,
  sourceWriterCompatibilityRefs,
}: {
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult;
  rowCountSummary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary;
  nonMutationSummary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary;
  sourceBindingSummary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary;
  sourceWriterCompatibilityRefs: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAcceptedSummary {
  return {
    source_entrypoint_fingerprint: entrypoint.validation.entrypoint_fingerprint,
    source_entrypoint_status: "safe_no_mutation_entrypoint_available",
    source_contract_fingerprint: entrypoint.source_contract_fingerprint ?? "",
    source_review_fingerprint: entrypoint.source_review_fingerprint ?? "",
    source_dry_run_result_fingerprint:
      entrypoint.source_dry_run_result_fingerprint ?? "",
    source_writer_compatibility_refs: sourceWriterCompatibilityRefs,
    safe_adapter_target: entrypoint.safe_adapter_target,
    row_count_summary: rowCountSummary,
    non_mutation_summary: nonMutationSummary,
    source_binding_summary: sourceBindingSummary,
    future_planning_scope:
      "future_explicit_no_mutation_result_record_planning_only",
    writes_now: false,
    existing_writer_called: false,
  };
}

function isSourceLineageComplete({
  entrypoint,
  refs,
}: {
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null;
  refs: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs;
}) {
  return requiredStringFieldsPresent(
    {
      source_entrypoint_fingerprint:
        entrypoint?.validation.entrypoint_fingerprint,
      source_contract_fingerprint: entrypoint?.source_contract_fingerprint,
      source_review_fingerprint: entrypoint?.source_review_fingerprint,
      source_dry_run_result_fingerprint:
        entrypoint?.source_dry_run_result_fingerprint,
      source_perspective_writer_compatibility_receipt_id:
        refs.source_perspective_writer_compatibility_receipt_id,
      source_perspective_writer_compatibility_record_id:
        refs.source_perspective_writer_compatibility_record_id,
      source_perspective_writer_compatibility_record_fingerprint:
        refs.source_perspective_writer_compatibility_record_fingerprint,
    },
    [
      "source_entrypoint_fingerprint",
      "source_contract_fingerprint",
      "source_review_fingerprint",
      "source_dry_run_result_fingerprint",
      "source_perspective_writer_compatibility_receipt_id",
      "source_perspective_writer_compatibility_record_id",
      "source_perspective_writer_compatibility_record_fingerprint",
    ],
  ).passed;
}

function isSourceEntrypointSafe({
  entrypoint,
  rowCountSummary,
  nonMutationSummary,
}: {
  entrypoint: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null;
  rowCountSummary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary;
  nonMutationSummary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary;
}) {
  return (
    entrypoint?.validation.passed === true &&
    entrypoint?.validation.no_write_authority === true &&
    entrypoint?.validation.no_existing_writer_authority === true &&
    entrypoint?.validation.no_provider_github_codex_retrieval_authority ===
      true &&
    entrypoint?.supported_capabilities.supports_row_count_snapshot === true &&
    entrypoint?.supported_capabilities.supports_transaction_rollback === true &&
    entrypoint?.supported_capabilities.supports_no_mutation_assertions ===
      true &&
    entrypoint?.supported_capabilities.supports_existing_writer_call === false &&
    rowCountSummary.all_protected_row_counts_unchanged === true &&
    rowCountSummary.changed_protected_table_count === 0 &&
    allValuesFalse(nonMutationSummary)
  );
}
