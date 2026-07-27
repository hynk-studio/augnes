import type { SemanticReviewDecisionRequestV01 } from "./semantic-review-types";

export type ReviewDecisionFormSupportedDecisionV01 =
  SemanticReviewDecisionRequestV01["decision"];

export const DEFAULT_DEFER_RATIONALE_V01 =
  "Defer this suggested change until its unresolved questions are addressed.";

export interface ReviewDecisionFormOwnerStateV01 {
  decision: ReviewDecisionFormSupportedDecisionV01;
  rationale_summary: string;
  rationale_bound_decision: ReviewDecisionFormSupportedDecisionV01 | null;
  revisit_condition: string;
}

export function applyReviewDecisionSelectionV01(
  state: ReviewDecisionFormOwnerStateV01,
  nextDecision: ReviewDecisionFormSupportedDecisionV01,
): ReviewDecisionFormOwnerStateV01 {
  if (nextDecision === state.decision) return state;
  if (nextDecision === "defer") {
    const restoreDefault = state.rationale_summary.trim().length === 0;
    return {
      ...state,
      decision: nextDecision,
      rationale_summary: restoreDefault
        ? DEFAULT_DEFER_RATIONALE_V01
        : state.rationale_summary,
      rationale_bound_decision: restoreDefault ? "defer" : null,
    };
  }
  const untouchedDeferDefault =
    state.decision === "defer" &&
    state.rationale_summary === DEFAULT_DEFER_RATIONALE_V01 &&
    state.rationale_bound_decision === "defer";
  return {
    ...state,
    decision: nextDecision,
    rationale_summary: untouchedDeferDefault
      ? ""
      : state.rationale_summary,
    rationale_bound_decision: null,
  };
}

export function canSubmitReviewDecisionFormV01(
  state: ReviewDecisionFormOwnerStateV01,
  input: {
    busy: boolean;
    selected_decision_allowed: boolean;
  },
): boolean {
  return (
    !input.busy &&
    input.selected_decision_allowed &&
    state.rationale_bound_decision === state.decision &&
    state.rationale_summary.trim().length > 0 &&
    (state.decision !== "defer" ||
      state.revisit_condition.trim().length > 0)
  );
}
