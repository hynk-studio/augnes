export interface ReviewDecisionLineageComparableV01 {
  decision_id: string;
  decided_at: string;
  lineage: {
    prior_decisions: Array<{
      decision_id: string;
      decision_fingerprint: string;
    }>;
  };
  integrity: { fingerprint: string };
}

export function compareEffectiveReviewDecisionsV01(
  left: ReviewDecisionLineageComparableV01,
  right: ReviewDecisionLineageComparableV01,
): number {
  const leftReferencesRight = reviewDecisionReferencesV01(left, right);
  const rightReferencesLeft = reviewDecisionReferencesV01(right, left);
  if (leftReferencesRight !== rightReferencesLeft) {
    return leftReferencesRight ? -1 : 1;
  }
  return (
    Date.parse(right.decided_at) - Date.parse(left.decided_at) ||
    compareCodeUnitsV01(right.decision_id, left.decision_id)
  );
}

function reviewDecisionReferencesV01(
  decision: ReviewDecisionLineageComparableV01,
  possiblePrior: ReviewDecisionLineageComparableV01,
): boolean {
  return decision.lineage.prior_decisions.some(
    (binding) =>
      binding.decision_id === possiblePrior.decision_id &&
      binding.decision_fingerprint ===
        possiblePrior.integrity.fingerprint,
  );
}

function compareCodeUnitsV01(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
