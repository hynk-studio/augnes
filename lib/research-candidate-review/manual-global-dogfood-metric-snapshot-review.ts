import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReview,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewInput,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewStatus,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-review";

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
  metric_snapshot_contract,
  operator_decision,
  operator_note,
}: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewInput): ResearchCandidateManualGlobalDogfoodMetricSnapshotReview {
  const contractReady =
    metric_snapshot_contract.operator_authorization_mode ===
      "ready_for_future_metric_snapshot_write_authorization" &&
    metric_snapshot_contract.blocker_reasons.length === 0 &&
    metric_snapshot_contract.validation.passed === true;
  const reviewStatus = determineReviewStatus({
    contractReady,
    operatorDecision: operator_decision,
  });
  const unresolvedBlockers = buildUnresolvedBlockers({
    contractReady,
    operatorDecision: operator_decision,
    contractBlockers: metric_snapshot_contract.blocker_reasons,
  });
  const warningReasons = uniqueStrings([
    ...metric_snapshot_contract.warning_reasons,
    ...(operator_note?.trim()
      ? ["operator_note_received_local_only_not_persisted"]
      : []),
  ]);
  const reviewFingerprint = fingerprint({
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_VERSION,
    source_contract_fingerprint:
      metric_snapshot_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
  });

  return {
    review_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_KIND,
    review_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_VERSION,
    scope: metric_snapshot_contract.scope,
    source_contract_ref: metric_snapshot_contract.source_projection_ref,
    source_contract_fingerprint:
      metric_snapshot_contract.validation.contract_fingerprint,
    operator_decision,
    review_status: reviewStatus,
    accepted_mapping_summary:
      reviewStatus === "ready_for_future_metric_snapshot_write_slice"
        ? {
            source_projection_fingerprint:
              metric_snapshot_contract.source_projection_fingerprint,
            source_latest_active_committed_receipt_id:
              metric_snapshot_contract.source_latest_active_committed_receipt_id,
            source_ledger_record_ref:
              metric_snapshot_contract.source_ledger_record_ref,
            proposed_idempotency_key:
              metric_snapshot_contract.idempotency_contract_preview
                .proposed_idempotency_key,
            outcome_label:
              metric_snapshot_contract.proposed_metric_snapshot_mapping
                .outcome_label,
            outcome_signal:
              metric_snapshot_contract.proposed_metric_snapshot_mapping
                .outcome_signal,
            proposed_counter_count: Object.keys(
              metric_snapshot_contract.proposed_metric_counters,
            ).filter((key) => key !== "writes_now").length,
            future_write_mode:
              metric_snapshot_contract.requested_future_write_mode,
            writes_now: false,
          }
        : null,
    unresolved_blockers: unresolvedBlockers,
    warning_reasons: warningReasons,
    future_write_requirements:
      metric_snapshot_contract.required_future_authorization,
    validation: {
      passed: reviewStatus === "ready_for_future_metric_snapshot_write_slice",
      review_fingerprint: reviewFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      contract_ready: contractReady,
      operator_accepts_ready_contract:
        contractReady &&
        operator_decision ===
          "accept_contract_for_future_metric_snapshot_write_slice",
      operator_note_persisted: false,
      no_write_authority: true,
      unresolved_blocker_count: unresolvedBlockers.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: metric_snapshot_contract.authority_boundary,
  };
}

function determineReviewStatus({
  contractReady,
  operatorDecision,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewStatus {
  if (!contractReady) return "blocked_metric_contract_not_ready";
  if (operatorDecision === "accept_contract_for_future_metric_snapshot_write_slice") {
    return "ready_for_future_metric_snapshot_write_slice";
  }
  if (operatorDecision === "needs_metric_mapping_revision") {
    return "blocked_metric_mapping_revision_required";
  }
  if (operatorDecision === "reject_metric_contract") return "rejected_by_operator";
  return "deferred_by_operator";
}

function buildUnresolvedBlockers({
  contractReady,
  operatorDecision,
  contractBlockers,
}: {
  contractReady: boolean;
  operatorDecision: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision;
  contractBlockers: string[];
}) {
  if (!contractReady) return uniqueStrings(contractBlockers);
  if (operatorDecision === "needs_metric_mapping_revision") {
    return ["operator_requested_metric_mapping_revision"];
  }
  if (operatorDecision === "reject_metric_contract") {
    return ["operator_rejected_metric_contract"];
  }
  if (operatorDecision === "defer_metric_contract") {
    return ["operator_deferred_metric_contract"];
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
