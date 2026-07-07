import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewInput,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewStatus,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-review";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_KIND,
  RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_VERSION,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-review";

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract,
  operator_decision,
  operator_note,
}: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewInput): ResearchCandidateManualResultDogfoodLedgerAuthorizationReview {
  const contractReady =
    authorization_contract.operator_authorization_mode ===
      "ready_for_future_ledger_write_authorization" &&
    authorization_contract.blocker_reasons.length === 0 &&
    authorization_contract.validation.passed === true;
  const reviewStatus = determineReviewStatus({
    contractReady,
    operatorDecision: operator_decision,
  });
  const unresolvedBlockers = buildUnresolvedBlockers({
    contractReady,
    operatorDecision: operator_decision,
    contractBlockers: authorization_contract.blocker_reasons,
  });
  const warningReasons = uniqueStrings([
    ...authorization_contract.warning_reasons,
    ...(operator_note?.trim()
      ? ["operator_note_received_local_only_not_persisted"]
      : []),
    ...(authorization_contract.proposed_reuse_outcome_ledger_mapping
      .compatibility_blockers_for_existing_writer.length > 0
      ? ["existing_handoff_reuse_outcome_ledger_writer_not_compatible_without_future_mapping"]
      : []),
  ]);
  const reviewFingerprint = fingerprint({
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_VERSION,
    source_contract_fingerprint:
      authorization_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
  });

  return {
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_VERSION,
    scope: authorization_contract.scope,
    source_contract_ref: authorization_contract.source_bridge_preview_ref,
    source_contract_fingerprint:
      authorization_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    accepted_mapping_summary:
      reviewStatus === "ready_for_future_ledger_write_slice"
        ? {
            source_manual_receipt_id:
              authorization_contract.proposed_global_dogfood_mapping
                .source_manual_receipt_id,
            proposed_idempotency_key:
              authorization_contract.idempotency_contract_preview
                .proposed_idempotency_key,
            outcome_label:
              authorization_contract.proposed_global_dogfood_mapping
                .selected_context_outcome_label,
            selected_candidate_context_ref_count:
              authorization_contract.proposed_global_dogfood_mapping
                .selected_candidate_context_refs.length,
            expected_observed_delta_record_ref:
              authorization_contract.proposed_global_dogfood_mapping
                .source_expected_observed_delta_record_ref,
            reuse_outcome_record_ref:
              authorization_contract.proposed_global_dogfood_mapping
                .source_reuse_outcome_record_ref,
            future_write_mode: authorization_contract.requested_future_write_mode,
            writes_now: false,
          }
        : null,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
    future_write_requirements: authorization_contract.required_future_authorization,
    validation: {
      passed: reviewStatus === "ready_for_future_ledger_write_slice",
      review_fingerprint: reviewFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      contract_ready: contractReady,
      operator_accepts_ready_contract:
        contractReady &&
        operator_decision === "accept_contract_for_future_write_slice",
      operator_note_persisted: false,
      no_write_authority: true,
      unresolved_blocker_count: unresolvedBlockers.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorization_contract.authority_boundary,
  };
}

function determineReviewStatus({
  contractReady,
  operatorDecision,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision;
}): ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewStatus {
  if (!contractReady) return "blocked_contract_not_ready";
  if (operatorDecision === "accept_contract_for_future_write_slice") {
    return "ready_for_future_ledger_write_slice";
  }
  if (operatorDecision === "needs_mapping_revision") {
    return "blocked_mapping_revision_required";
  }
  if (operatorDecision === "reject_contract") return "rejected_by_operator";
  return "deferred_by_operator";
}

function buildUnresolvedBlockers({
  contractReady,
  operatorDecision,
  contractBlockers,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision;
  contractBlockers: string[];
}) {
  if (!contractReady) return uniqueStrings(contractBlockers);
  if (operatorDecision === "needs_mapping_revision") {
    return ["operator_requested_mapping_revision"];
  }
  if (operatorDecision === "reject_contract") {
    return ["operator_rejected_contract"];
  }
  if (operatorDecision === "defer_contract") {
    return ["operator_deferred_contract"];
  }
  return [];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function fingerprint(value: unknown) {
  return `fnv1a32:${fnv1a32(stableJson(value))}`;
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
