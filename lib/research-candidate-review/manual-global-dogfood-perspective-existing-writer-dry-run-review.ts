import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewStatus,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_REVIEW_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_REVIEW_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
  existing_writer_dry_run_contract,
  operator_decision,
  operator_note,
}: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewInput): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview {
  const contractReady =
    existing_writer_dry_run_contract.operator_authorization_mode ===
      "ready_for_future_existing_writer_dry_run_adapter_write_authorization" &&
    existing_writer_dry_run_contract.blocker_reasons.length === 0 &&
    existing_writer_dry_run_contract.validation.passed === true;
  const reviewStatus = determineReviewStatus({
    contractReady,
    operatorDecision: operator_decision,
  });
  const unresolvedBlockers = buildUnresolvedBlockers({
    contractReady,
    operatorDecision: operator_decision,
    contractBlockers: existing_writer_dry_run_contract.blocker_reasons,
  });
  const warningReasons = uniqueStrings([
    ...existing_writer_dry_run_contract.warning_reasons,
    ...(operator_note?.trim()
      ? ["operator_note_received_local_only_not_persisted"]
      : []),
  ]);
  const reviewFingerprint = fingerprint({
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_REVIEW_VERSION,
    source_contract_fingerprint:
      existing_writer_dry_run_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
  });

  return {
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_REVIEW_VERSION,
    scope: existing_writer_dry_run_contract.scope,
    source_contract_ref:
      existing_writer_dry_run_contract
        .source_perspective_writer_compatibility_readback_ref,
    source_contract_fingerprint:
      existing_writer_dry_run_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    accepted_mapping_summary:
      reviewStatus ===
      "ready_for_future_existing_writer_dry_run_adapter_write_slice"
        ? {
            source_contract_fingerprint:
              existing_writer_dry_run_contract.validation.contract_fingerprint,
            source_perspective_writer_compatibility_receipt_id:
              existing_writer_dry_run_contract
                .source_perspective_writer_compatibility_receipt_id,
            source_perspective_writer_compatibility_record_id:
              existing_writer_dry_run_contract
                .source_perspective_writer_compatibility_record_id,
            source_perspective_writer_compatibility_record_fingerprint:
              existing_writer_dry_run_contract
                .source_perspective_writer_compatibility_record_fingerprint,
            source_perspective_state_application_receipt_id:
              existing_writer_dry_run_contract
                .source_perspective_state_application_receipt_id,
            source_perspective_state_application_record_id:
              existing_writer_dry_run_contract
                .source_perspective_state_application_record_id,
            source_perspective_state_application_record_fingerprint:
              existing_writer_dry_run_contract
                .source_perspective_state_application_record_fingerprint,
            source_perspective_adapter_receipt_id:
              existing_writer_dry_run_contract
                .source_perspective_adapter_receipt_id,
            source_perspective_adapter_record_id:
              existing_writer_dry_run_contract
                .source_perspective_adapter_record_id,
            source_perspective_adapter_record_fingerprint:
              existing_writer_dry_run_contract
                .source_perspective_adapter_record_fingerprint,
            source_perspective_state_mutation_receipt_id:
              existing_writer_dry_run_contract
                .source_perspective_state_mutation_receipt_id,
            source_perspective_state_mutation_record_id:
              existing_writer_dry_run_contract
                .source_perspective_state_mutation_record_id,
            source_perspective_state_mutation_record_fingerprint:
              existing_writer_dry_run_contract
                .source_perspective_state_mutation_record_fingerprint,
            source_perspective_apply_receipt_id:
              existing_writer_dry_run_contract
                .source_perspective_apply_receipt_id,
            source_perspective_apply_record_id:
              existing_writer_dry_run_contract.source_perspective_apply_record_id,
            source_perspective_apply_record_fingerprint:
              existing_writer_dry_run_contract
                .source_perspective_apply_record_fingerprint,
            source_canonical_perspective_update_receipt_id:
              existing_writer_dry_run_contract
                .source_canonical_perspective_update_receipt_id,
            source_canonical_perspective_update_record_id:
              existing_writer_dry_run_contract
                .source_canonical_perspective_update_record_id,
            source_canonical_perspective_update_record_fingerprint:
              existing_writer_dry_run_contract
                .source_canonical_perspective_update_record_fingerprint,
            source_perspective_relay_receipt_id:
              existing_writer_dry_run_contract
                .source_perspective_relay_receipt_id,
            source_perspective_relay_record_id:
              existing_writer_dry_run_contract
                .source_perspective_relay_record_id,
            source_perspective_relay_record_fingerprint:
              existing_writer_dry_run_contract
                .source_perspective_relay_record_fingerprint,
            source_next_work_signal_receipt_id:
              existing_writer_dry_run_contract
                .source_next_work_signal_receipt_id,
            source_next_work_signal_record_id:
              existing_writer_dry_run_contract
                .source_next_work_signal_record_id,
            source_next_work_signal_record_fingerprint:
              existing_writer_dry_run_contract
                .source_next_work_signal_record_fingerprint,
            source_next_work_bias_receipt_id:
              existing_writer_dry_run_contract
                .source_next_work_bias_receipt_id,
            source_next_work_bias_record_id:
              existing_writer_dry_run_contract
                .source_next_work_bias_record_id,
            source_next_work_bias_record_fingerprint:
              existing_writer_dry_run_contract
                .source_next_work_bias_record_fingerprint,
            source_projection_fingerprint:
              existing_writer_dry_run_contract.source_projection_fingerprint,
            source_global_dogfood_ledger_receipt_id:
              existing_writer_dry_run_contract
                .source_global_dogfood_ledger_receipt_id,
            source_global_dogfood_ledger_record_id:
              existing_writer_dry_run_contract
                .source_global_dogfood_ledger_record_id,
            source_metric_snapshot_receipt_id:
              existing_writer_dry_run_contract
                .source_metric_snapshot_receipt_id,
            source_metric_snapshot_record_id:
              existing_writer_dry_run_contract
                .source_metric_snapshot_record_id,
            source_manual_receipt_id:
              existing_writer_dry_run_contract.source_manual_receipt_id,
            source_handoff_seed_fingerprint:
              existing_writer_dry_run_contract
                .source_handoff_seed_fingerprint,
            source_result_text_fingerprint:
              existing_writer_dry_run_contract.source_result_text_fingerprint,
            source_expected_observed_delta_record_ref:
              existing_writer_dry_run_contract
                .source_expected_observed_delta_record_ref,
            source_reuse_outcome_record_ref:
              existing_writer_dry_run_contract.source_reuse_outcome_record_ref,
            proposed_idempotency_key:
              existing_writer_dry_run_contract
                .idempotency_contract_preview.proposed_idempotency_key,
            intended_future_dry_run_target:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping
                .intended_future_dry_run_target,
            dry_run_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.dry_run_label,
            dry_run_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.dry_run_rationale,
            writer_compatibility_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping
                .writer_compatibility_label,
            writer_compatibility_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping
                .writer_compatibility_rationale,
            state_application_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping
                .state_application_label,
            state_application_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping
                .state_application_rationale,
            adapter_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.adapter_label,
            adapter_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.adapter_rationale,
            mutation_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.mutation_label,
            mutation_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.mutation_rationale,
            apply_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.apply_label,
            apply_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.apply_rationale,
            canonical_update_label:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping.canonical_update_label,
            canonical_update_rationale:
              existing_writer_dry_run_contract
                .proposed_existing_writer_dry_run_mapping
                .canonical_update_rationale,
            future_write_mode:
              existing_writer_dry_run_contract.requested_future_write_mode,
            writes_now: false,
            dry_run_runs_now: false,
          }
        : null,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
    future_write_requirements:
      existing_writer_dry_run_contract.required_future_authorization,
    validation: {
      passed:
        reviewStatus ===
        "ready_for_future_existing_writer_dry_run_adapter_write_slice",
      review_fingerprint: reviewFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      contract_ready: contractReady,
      operator_accepts_ready_contract:
        contractReady &&
        operator_decision ===
          "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
      operator_note_persisted: false,
      no_write_authority: true,
      no_dry_run_authority: true,
      unresolved_blocker_count: unresolvedBlockers.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: existing_writer_dry_run_contract.authority_boundary,
  };
}

function determineReviewStatus({
  contractReady,
  operatorDecision,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewStatus {
  if (!contractReady) {
    return "blocked_existing_writer_dry_run_contract_not_ready";
  }
  if (
    operatorDecision ===
    "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice"
  ) {
    return "ready_for_future_existing_writer_dry_run_adapter_write_slice";
  }
  if (
    operatorDecision ===
    "needs_existing_writer_dry_run_adapter_mapping_revision"
  ) {
    return "blocked_existing_writer_dry_run_adapter_mapping_revision_required";
  }
  if (operatorDecision === "reject_existing_writer_dry_run_contract") {
    return "rejected_by_operator";
  }
  return "deferred_by_operator";
}

function buildUnresolvedBlockers({
  contractReady,
  operatorDecision,
  contractBlockers,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision;
  contractBlockers: string[];
}) {
  if (!contractReady) return uniqueStrings(contractBlockers);
  if (
    operatorDecision ===
    "needs_existing_writer_dry_run_adapter_mapping_revision"
  ) {
    return ["operator_requested_existing_writer_dry_run_adapter_mapping_revision"];
  }
  if (operatorDecision === "reject_existing_writer_dry_run_contract") {
    return ["operator_rejected_existing_writer_dry_run_contract"];
  }
  if (operatorDecision === "defer_existing_writer_dry_run_contract") {
    return ["operator_deferred_existing_writer_dry_run_contract"];
  }
  return [];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
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
