import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReview,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewInput,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewStatus,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-review";

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract,
  operator_decision,
  operator_note,
}: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewInput): ResearchCandidateManualGlobalDogfoodNextWorkSignalReview {
  const contractReady =
    next_work_signal_contract.operator_authorization_mode ===
      "ready_for_future_next_work_signal_write_authorization" &&
    next_work_signal_contract.blocker_reasons.length === 0 &&
    next_work_signal_contract.validation.passed === true;
  const reviewStatus = determineReviewStatus({
    contractReady,
    operatorDecision: operator_decision,
  });
  const unresolvedBlockers = buildUnresolvedBlockers({
    contractReady,
    operatorDecision: operator_decision,
    contractBlockers: next_work_signal_contract.blocker_reasons,
  });
  const warningReasons = uniqueStrings([
    ...next_work_signal_contract.warning_reasons,
    ...(operator_note?.trim()
      ? ["operator_note_received_local_only_not_persisted"]
      : []),
  ]);
  const reviewFingerprint = fingerprint({
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_VERSION,
    source_contract_fingerprint:
      next_work_signal_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
  });

  return {
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_VERSION,
    scope: next_work_signal_contract.scope,
    source_contract_ref: next_work_signal_contract.source_projection_ref,
    source_contract_fingerprint:
      next_work_signal_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    accepted_mapping_summary:
      reviewStatus === "ready_for_future_next_work_signal_write_slice"
        ? {
            source_projection_fingerprint:
              next_work_signal_contract.source_projection_fingerprint,
            source_latest_active_committed_receipt_id:
              next_work_signal_contract
                .source_latest_active_committed_receipt_id,
            source_ledger_record_ref:
              next_work_signal_contract.source_ledger_record_ref,
            proposed_idempotency_key:
              next_work_signal_contract.idempotency_contract_preview
                .proposed_idempotency_key,
            recommended_next_work_label:
              next_work_signal_contract.proposed_next_work_signal_mapping
                .recommended_next_work_label,
            outcome_label:
              next_work_signal_contract.proposed_next_work_signal_mapping
                .outcome_label,
            candidate_priority_hint:
              next_work_signal_contract.proposed_decision_candidate
                .candidate_priority_hint,
            future_write_mode:
              next_work_signal_contract.requested_future_write_mode,
            writes_now: false,
          }
        : null,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
    future_write_requirements:
      next_work_signal_contract.required_future_authorization,
    validation: {
      passed: reviewStatus === "ready_for_future_next_work_signal_write_slice",
      review_fingerprint: reviewFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      contract_ready: contractReady,
      operator_accepts_ready_contract:
        contractReady &&
        operator_decision ===
          "accept_contract_for_future_next_work_signal_write_slice",
      operator_note_persisted: false,
      no_write_authority: true,
      unresolved_blocker_count: unresolvedBlockers.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: next_work_signal_contract.authority_boundary,
  };
}

function determineReviewStatus({
  contractReady,
  operatorDecision,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision;
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewStatus {
  if (!contractReady) return "blocked_next_work_contract_not_ready";
  if (operatorDecision === "accept_contract_for_future_next_work_signal_write_slice") {
    return "ready_for_future_next_work_signal_write_slice";
  }
  if (operatorDecision === "needs_next_work_mapping_revision") {
    return "blocked_next_work_mapping_revision_required";
  }
  if (operatorDecision === "reject_next_work_contract") {
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
  operatorDecision: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision;
  contractBlockers: string[];
}) {
  if (!contractReady) return uniqueStrings(contractBlockers);
  if (operatorDecision === "needs_next_work_mapping_revision") {
    return ["operator_requested_next_work_mapping_revision"];
  }
  if (operatorDecision === "reject_next_work_contract") {
    return ["operator_rejected_next_work_contract"];
  }
  if (operatorDecision === "defer_next_work_contract") {
    return ["operator_deferred_next_work_contract"];
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

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
