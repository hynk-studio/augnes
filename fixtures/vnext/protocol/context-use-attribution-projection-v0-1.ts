import {
  contextUseReviewInputFixture,
  contextUseReviewLaterTaskRunReceiptFixture,
  contextUseReviewTransitionLoopFixture,
} from "@/fixtures/vnext/protocol/context-use-review-v0-1";
import {
  buildContextUseReviewV01,
  deriveContextUseReviewPresentationProvenanceV01,
} from "@/lib/vnext/context-use-review";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

const deliveryRef = {
  ref_version: "external_ref.v0.1" as const,
  ref_type: "task_context_packet_delivery",
  external_id: contextUseReviewTransitionLoopFixture.later_packet.packet_id,
  trust_class: "direct_local_observation" as const,
  observed_at: contextUseReviewLaterTaskRunReceiptFixture.recorded_at,
  source_ref:
    contextUseReviewTransitionLoopFixture.later_packet.integrity.fingerprint,
  compatibility_namespace:
    "augnes.vnext.context-use-attribution-fixture.v0.1",
};

export const contextUseAttributionRunReceiptFixture = (() => {
  const input = runReceiptBuilderInput(
    contextUseReviewLaterTaskRunReceiptFixture,
  );
  const selectedItemRef =
    contextUseReviewTransitionLoopFixture.later_packet.selected_context[0]!
      .external_ref!;
  input.checks.push({
    check_id: "deterministic_packet_delivery",
    required: true,
    status: "passed",
    basis: "observed",
    summary:
      "The exact later TaskContextPacket delivery relation passed in this synthetic fixture.",
    source_refs: [deliveryRef],
  });
  input.verification.required_check_ids.push(
    "deterministic_packet_delivery",
  );
  input.verifier_refs.push(deliveryRef);
  input.external_refs.push(selectedItemRef);
  input.source_refs.push(selectedItemRef);
  return buildRunReceiptV01(deepFreeze(input));
})();

export const contextUseAttributionReviewFixture = (() => {
  const input = clone(contextUseReviewInputFixture);
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    contextUseAttributionRunReceiptFixture,
  );
  input.later_task_run_receipt = {
    receipt_version: contextUseAttributionRunReceiptFixture.receipt_version,
    receipt_id: contextUseAttributionRunReceiptFixture.receipt_id,
    receipt_fingerprint:
      contextUseAttributionRunReceiptFixture.integrity.fingerprint,
  };
  input.usage.presented = presentation.presented;
  input.usage_provenance = {
    provenance_version: "context_use_review_usage_provenance.v0.1",
    presented: presentation.provenance,
    actually_used: {
      basis: "user_declaration",
      source_refs: [input.reviewer_ref],
    },
    assessment: {
      basis: "user_declaration",
      source_refs: [input.reviewer_ref],
    },
  };
  return buildContextUseReviewV01(deepFreeze(input));
})();

export const historicalContextUseAttributionReviewFixture = (() => {
  const input = clone(contextUseReviewInputFixture);
  input.later_task_run_receipt = {
    receipt_version: contextUseAttributionRunReceiptFixture.receipt_version,
    receipt_id: contextUseAttributionRunReceiptFixture.receipt_id,
    receipt_fingerprint:
      contextUseAttributionRunReceiptFixture.integrity.fingerprint,
  };
  delete input.usage_provenance;
  return buildContextUseReviewV01(deepFreeze(input));
})();

export const contextUseAttributionSourceFixture = {
  review: contextUseAttributionReviewFixture,
  prior_packet: contextUseReviewTransitionLoopFixture.prior_packet,
  later_packet: contextUseReviewTransitionLoopFixture.later_packet,
  source_transition_receipt:
    contextUseReviewTransitionLoopFixture.transition_receipt,
  later_task_run_receipt: contextUseAttributionRunReceiptFixture,
};

export const historicalContextUseAttributionSourceFixture = {
  ...contextUseAttributionSourceFixture,
  review: historicalContextUseAttributionReviewFixture,
};

function runReceiptBuilderInput(receipt: RunReceiptV01) {
  const {
    receipt_version: _version,
    receipt_id: _id,
    trust_summary: _trust,
    authority_summary,
    idempotency_key: _key,
    integrity: _integrity,
    ...input
  } = clone(receipt);
  return { ...input, authority_notes: authority_summary.notes };
}

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
