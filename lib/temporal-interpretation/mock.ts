import {
  type TemporalInterpretationPreview,
  type TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";

export function buildMockTemporalPreview(
  context: TemporalPreviewContext,
): TemporalInterpretationPreview {
  return {
    current_interpretation: [
      "Augnes is in a challenge-demo state where committed runtime state, work trace context, and proof surfaces already exist.",
      "The temporal interpretation preview should read that context, preserve boundaries, and identify the next review step without becoming durable authority.",
    ].join(" "),
    active_prior_context: context.active_prior_context,
    evidence_anchors: context.evidence_anchors,
    summary_refs: context.summary_refs,
    source_authority_profile: context.source_authority_profile,
    counterexamples: context.counterexamples,
    residual_tensions: context.residual_tensions,
    transition_relation: "revision",
    revision_explanation:
      "The preview revises prior documentation-only temporal interpretation work into a runnable, read-only demo slice while leaving P4 durability and rule promotion out of scope.",
    user_context_vs_factuality:
      "User preferences explain demo priority and constraints, but factual readiness still depends on committed state, evidence anchors, guardrails, and verification results.",
    safe_next_step: context.safe_next_step,
    non_authority_boundary: context.non_authority_boundary,
    warnings: [],
  };
}
