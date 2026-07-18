import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";

export const VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01 =
  "vnext_operator_pilot_later_result_intake.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_CONTRACT_V01 =
  "vnext_operator_pilot_context_use_review.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01 =
  "augnes.vnext.operator-pilot-context-use-review.v0.1" as const;

type ContextUseReviewIdentityMaterialV01 = Pick<
  ContextUseReviewV01,
  | "workspace_id"
  | "project_id"
  | "prior_packet"
  | "later_packet"
  | "source_transition_receipt"
  | "later_task_run_receipt"
  | "reviewer_ref"
>;

type ContextUseReviewRequestMaterialV01 = ContextUseReviewIdentityMaterialV01 &
  Pick<
    ContextUseReviewV01,
    "usage" | "assessment" | "corrections" | "metrics" | "notes"
  >;

export function createVNextOperatorPilotContextUseReviewLogicalIdentityV01(
  review: ContextUseReviewIdentityMaterialV01,
): string {
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: review.workspace_id,
      project_id: review.project_id,
      prior_packet_id: review.prior_packet.packet_id,
      prior_packet_fingerprint: review.prior_packet.packet_fingerprint,
      later_packet_id: review.later_packet.packet_id,
      later_packet_fingerprint: review.later_packet.packet_fingerprint,
      transition_receipt_id:
        review.source_transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        review.source_transition_receipt.transition_receipt_fingerprint,
      later_task_run_receipt_id: review.later_task_run_receipt.receipt_id,
      later_task_run_receipt_fingerprint:
        review.later_task_run_receipt.receipt_fingerprint,
      reviewer_id: review.reviewer_ref.external_id,
    }),
  );
  return `context-use-review-logical:${fingerprint.slice(7, 39)}`;
}

export function createVNextOperatorPilotContextUseReviewRequestFingerprintV01(
  review: ContextUseReviewRequestMaterialV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: review.workspace_id,
      project_id: review.project_id,
      prior_packet_id: review.prior_packet.packet_id,
      prior_packet_fingerprint: review.prior_packet.packet_fingerprint,
      later_packet_id: review.later_packet.packet_id,
      later_packet_fingerprint: review.later_packet.packet_fingerprint,
      transition_receipt_id:
        review.source_transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        review.source_transition_receipt.transition_receipt_fingerprint,
      later_task_run_receipt_id: review.later_task_run_receipt.receipt_id,
      later_task_run_receipt_fingerprint:
        review.later_task_run_receipt.receipt_fingerprint,
      reviewer_id: review.reviewer_ref.external_id,
      usage: review.usage,
      assessment: review.assessment,
      corrections: review.corrections,
      metrics: review.metrics,
      notes: review.notes,
    }),
  );
}
