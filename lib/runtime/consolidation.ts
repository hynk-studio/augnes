import type {
  StateDeltaProposal,
  StateDeltaProposalScoringUpdate,
  StateEntry,
  StateValue,
} from "@/lib/db";

export type ConsolidationResult = {
  evaluated_count: number;
  ready_count: number;
  needs_review_count: number;
  reinforced_count: number;
  expired_count: number;
  updates: StateDeltaProposalScoringUpdate[];
};

type ConsolidateCandidatesInput = {
  proposals: StateDeltaProposal[];
  currentState: StateEntry[];
  now: string | Date;
};

export function consolidateCandidates({
  proposals,
  currentState,
  now,
}: ConsolidateCandidatesInput): ConsolidationResult {
  const evaluatedAt = normalizeIsoDate(now);
  const reinforcementCounts = countReinforcements(proposals);
  const contestedKeys = findContestedStateKeys(proposals);
  const currentStateKeys = new Set(currentState.map((entry) => entry.state_key));

  const updates = proposals.map((proposal) => {
    const reinforcementCount = reinforcementCounts.get(proposal.id) ?? 0;
    const isExpired = shouldExpireProposal({
      proposal,
      reinforcementCount,
      now: evaluatedAt,
    });
    const needsReview =
      proposal.conflict_score >= 0.7 || contestedKeys.has(proposal.state_key);
    const isReady =
      proposal.salience_score >= 0.72 &&
      proposal.evidence_score >= 0.55 &&
      proposal.conflict_score < 0.7 &&
      !isExpired;
    const status = isExpired
      ? "expired"
      : needsReview
        ? "needs_review"
        : isReady
          ? "ready"
          : reinforcementCount > 0
            ? "reinforced"
            : "candidate";
    const reason = buildScoringReason({
      status,
      reinforcementCount,
      contested: contestedKeys.has(proposal.state_key),
      currentStateHasKey: currentStateKeys.has(proposal.state_key),
    });

    return {
      id: proposal.id,
      prediction_error_score: proposal.prediction_error_score,
      salience_score: proposal.salience_score,
      evidence_score: proposal.evidence_score,
      conflict_score: proposal.conflict_score,
      self_impact_score: proposal.self_impact_score,
      consolidation_status: status,
      reinforcement_count: reinforcementCount,
      expires_at: proposal.expires_at,
      last_evaluated_at: evaluatedAt,
      scoring_version: proposal.scoring_version,
      scoring_reason: reason,
      score_breakdown: mergeScoreBreakdown({
        proposal,
        status,
        reason,
        reinforcementCount,
        contested: contestedKeys.has(proposal.state_key),
        currentStateHasKey: currentStateKeys.has(proposal.state_key),
        evaluatedAt,
      }),
    } satisfies StateDeltaProposalScoringUpdate;
  });

  return {
    evaluated_count: updates.length,
    ready_count: updates.filter((update) => update.consolidation_status === "ready")
      .length,
    needs_review_count: updates.filter(
      (update) => update.consolidation_status === "needs_review",
    ).length,
    reinforced_count: updates.filter(
      (update) => update.consolidation_status === "reinforced",
    ).length,
    expired_count: updates.filter(
      (update) => update.consolidation_status === "expired",
    ).length,
    updates,
  };
}

function countReinforcements(proposals: StateDeltaProposal[]) {
  const groups = new Map<string, StateDeltaProposal[]>();
  const counts = new Map<string, number>();

  for (const proposal of proposals) {
    const key = `${proposal.state_key}:${stableStringify(proposal.after_value)}`;
    groups.set(key, [...(groups.get(key) ?? []), proposal]);
  }

  for (const group of groups.values()) {
    const reinforcementCount = group.length >= 2 ? group.length - 1 : 0;

    for (const proposal of group) {
      counts.set(proposal.id, reinforcementCount);
    }
  }

  return counts;
}

function findContestedStateKeys(proposals: StateDeltaProposal[]) {
  const valuesByKey = new Map<string, Set<string>>();

  for (const proposal of proposals) {
    if (!valuesByKey.has(proposal.state_key)) {
      valuesByKey.set(proposal.state_key, new Set());
    }

    valuesByKey.get(proposal.state_key)?.add(stableStringify(proposal.after_value));
  }

  return new Set(
    [...valuesByKey.entries()]
      .filter(([, values]) => values.size >= 2)
      .map(([stateKey]) => stateKey),
  );
}

function shouldExpireProposal({
  proposal,
  reinforcementCount,
  now,
}: {
  proposal: StateDeltaProposal;
  reinforcementCount: number;
  now: string;
}) {
  if (
    proposal.consolidation_status === "ready" ||
    proposal.consolidation_status === "needs_review" ||
    !proposal.expires_at
  ) {
    return false;
  }

  const expiresAt = Date.parse(proposal.expires_at);
  const evaluatedAt = Date.parse(now);

  return (
    Number.isFinite(expiresAt) &&
    Number.isFinite(evaluatedAt) &&
    expiresAt < evaluatedAt &&
    proposal.salience_score < 0.55 &&
    reinforcementCount === 0
  );
}

function buildScoringReason({
  status,
  reinforcementCount,
  contested,
  currentStateHasKey,
}: {
  status: StateDeltaProposalScoringUpdate["consolidation_status"];
  reinforcementCount: number;
  contested: boolean;
  currentStateHasKey: boolean;
}) {
  if (status === "expired") {
    return "Consolidation marked this pending proposal expired because its expiry passed without salience or reinforcement.";
  }

  if (status === "needs_review") {
    return contested
      ? "Consolidation marked this pending proposal needs_review because the same state key has competing pending after_values."
      : "Consolidation marked this pending proposal needs_review because conflict_score is high.";
  }

  if (status === "ready") {
    return "Consolidation marked this pending proposal ready because salience and evidence are sufficient and conflict is below review threshold.";
  }

  if (status === "reinforced") {
    return `Consolidation marked this pending proposal reinforced by ${reinforcementCount} matching pending proposal(s).`;
  }

  return currentStateHasKey
    ? "Consolidation kept this pending proposal as candidate against existing committed state."
    : "Consolidation kept this pending proposal as candidate pending more evidence or reinforcement.";
}

function mergeScoreBreakdown({
  proposal,
  status,
  reason,
  reinforcementCount,
  contested,
  currentStateHasKey,
  evaluatedAt,
}: {
  proposal: StateDeltaProposal;
  status: StateDeltaProposalScoringUpdate["consolidation_status"];
  reason: string;
  reinforcementCount: number;
  contested: boolean;
  currentStateHasKey: boolean;
  evaluatedAt: string;
}): StateValue {
  const base =
    proposal.score_breakdown &&
    typeof proposal.score_breakdown === "object" &&
    !Array.isArray(proposal.score_breakdown)
      ? proposal.score_breakdown
      : {};

  return {
    ...base,
    consolidation_lifecycle: {
      evaluated_at: evaluatedAt,
      status,
      reason,
      rules: {
        reinforcement_count: reinforcementCount,
        contested_state_key: contested,
        current_state_has_key: currentStateHasKey,
        expired_threshold:
          "expires_at < now AND salience_score < 0.55 AND reinforcement_count === 0",
        needs_review_threshold:
          "conflict_score >= 0.70 OR same state_key has different pending after_values",
        ready_threshold:
          "salience_score >= 0.72 AND evidence_score >= 0.55 AND conflict_score < 0.70 AND not expired",
        priority: "expired -> needs_review -> ready -> reinforced -> candidate",
      },
    },
  };
}

function normalizeIsoDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function stableStringify(value: StateValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}
