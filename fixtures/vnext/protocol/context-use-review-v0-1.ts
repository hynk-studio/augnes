import {
  semanticTransitionLoopProjectAFixture,
  buildSemanticTransitionLoopFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import type { ContextUseReviewBuilderInputV01 } from "@/lib/vnext/context-use-review";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const CONTEXT_USE_REVIEW_LATER_RUN_RECORDED_AT =
  "2026-07-10T13:30:00.000Z";
export const CONTEXT_USE_REVIEW_REVIEWED_AT = "2026-07-10T13:40:00.000Z";

export const contextUseReviewTransitionLoopFixture =
  buildSemanticTransitionLoopFixtureV01(semanticTransitionLoopProjectAFixture);

const laterPacketRef: ExternalRefV01 = {
  ref_version: "external_ref.v0.1",
  ref_type: "task_context_packet",
  external_id: contextUseReviewTransitionLoopFixture.later_packet.packet_id,
  trust_class: "direct_local_observation",
  observed_at: CONTEXT_USE_REVIEW_LATER_RUN_RECORDED_AT,
  source_ref:
    contextUseReviewTransitionLoopFixture.later_packet.integrity.fingerprint,
  compatibility_namespace: "augnes.vnext.context-use-review-fixture.v0.1",
};

const transitionReceiptRef: ExternalRefV01 = {
  ref_version: "external_ref.v0.1",
  ref_type: "state_transition_receipt",
  external_id:
    contextUseReviewTransitionLoopFixture.transition_receipt
      .transition_receipt_id,
  trust_class: "direct_local_observation",
  observed_at: CONTEXT_USE_REVIEW_LATER_RUN_RECORDED_AT,
  source_ref:
    contextUseReviewTransitionLoopFixture.transition_receipt.integrity
      .fingerprint,
  compatibility_namespace: "augnes.vnext.context-use-review-fixture.v0.1",
};

export const contextUseReviewLaterTaskRunReceiptFixture = (() => {
  const input = clone(genericCliDirectObservationInputFixture);
  input.workspace_id = contextUseReviewTransitionLoopFixture.project.workspace_id;
  input.project_id = contextUseReviewTransitionLoopFixture.project.project_id;
  input.run_id = "run:context-use-review-later-task";
  input.task_context_packet_ref = laterPacketRef;
  input.recorded_at = CONTEXT_USE_REVIEW_LATER_RUN_RECORDED_AT;
  input.external_refs.push(transitionReceiptRef);
  input.source_refs.push(transitionReceiptRef);
  input.result_summary = {
    summary:
      "Synthetic later-task receipt references the exact later packet and source transition receipt.",
    outcome: "Synthetic context-use result material is available for review.",
    limitations: [
      "Synthetic receipt material does not prove actual product use or helpfulness.",
    ],
  };
  return buildRunReceiptV01(deepFreeze(input));
})();

const reviewerAuthenticationBasisRef: ExternalRefV01 = {
  ref_version: "external_ref.v0.1",
  ref_type: "local_operator_session_action",
  external_id: "session:context-use-review-conformance",
  trust_class: "direct_local_observation",
  observed_at: CONTEXT_USE_REVIEW_REVIEWED_AT,
  source_ref: `sha256:${"a".repeat(64)}`,
  compatibility_namespace: "augnes.vnext.context-use-review-fixture.v0.1",
};

const reviewerRef: ExternalRefV01 = {
  ref_version: "external_ref.v0.1",
  ref_type: "local_operator_actor",
  external_id: "operator:context-use-review-conformance",
  trust_class: "user_declaration",
  observed_at: CONTEXT_USE_REVIEW_REVIEWED_AT,
  source_ref: reviewerAuthenticationBasisRef.source_ref,
  compatibility_namespace: "augnes.vnext.context-use-review-fixture.v0.1",
};

export const contextUseReviewInputFixture: ContextUseReviewBuilderInputV01 = {
  workspace_id: contextUseReviewTransitionLoopFixture.project.workspace_id,
  project_id: contextUseReviewTransitionLoopFixture.project.project_id,
  prior_packet: {
    packet_version:
      contextUseReviewTransitionLoopFixture.prior_packet.packet_version,
    packet_id: contextUseReviewTransitionLoopFixture.prior_packet.packet_id,
    packet_fingerprint:
      contextUseReviewTransitionLoopFixture.prior_packet.integrity.fingerprint,
  },
  later_packet: {
    packet_version:
      contextUseReviewTransitionLoopFixture.later_packet.packet_version,
    packet_id: contextUseReviewTransitionLoopFixture.later_packet.packet_id,
    packet_fingerprint:
      contextUseReviewTransitionLoopFixture.later_packet.integrity.fingerprint,
  },
  source_transition_receipt: {
    transition_receipt_version:
      contextUseReviewTransitionLoopFixture.transition_receipt
        .transition_receipt_version,
    transition_receipt_id:
      contextUseReviewTransitionLoopFixture.transition_receipt
        .transition_receipt_id,
    transition_receipt_fingerprint:
      contextUseReviewTransitionLoopFixture.transition_receipt.integrity
        .fingerprint,
  },
  later_task_run_receipt: {
    receipt_version: contextUseReviewLaterTaskRunReceiptFixture.receipt_version,
    receipt_id: contextUseReviewLaterTaskRunReceiptFixture.receipt_id,
    receipt_fingerprint:
      contextUseReviewLaterTaskRunReceiptFixture.integrity.fingerprint,
  },
  reviewer_ref: reviewerRef,
  reviewer_authentication_basis_refs: [reviewerAuthenticationBasisRef],
  reviewed_at: CONTEXT_USE_REVIEW_REVIEWED_AT,
  usage: { presented: "yes", actually_used: "yes" },
  assessment: "helpful",
  corrections: { correction_count: 1, summaries: ["Clarify one stale compatibility note before future reuse."] },
  metrics: {
    wrong_context_correction_count: 1,
    repeated_explanation_estimate: 0,
    missing_critical_context_count: 0,
    context_refs_used_count: 1,
  },
  notes: [
    "Synthetic review exercises contract mechanics without claiming real Reviewed Reuse.",
  ],
  compatibility: {
    source_contracts: [
      contextUseReviewTransitionLoopFixture.prior_packet.packet_version,
      contextUseReviewTransitionLoopFixture.later_packet.packet_version,
      contextUseReviewTransitionLoopFixture.transition_receipt
        .transition_receipt_version,
      contextUseReviewLaterTaskRunReceiptFixture.receipt_version,
    ],
    unmapped_fields: [],
    warnings: [
      "Fixture assessment is synthetic and does not establish outcome improvement.",
    ],
    external_refs: [],
  },
  authority_notes: [
    "Synthetic fixture records no real authorization, transition, Evidence, memory promotion, or work closure.",
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
