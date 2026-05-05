import type { PendingStateDeltaProposalInput, StateEntry, StateValue } from "@/lib/db";

export const SCORING_VERSION = "v0.2-rule-001";

export type ConsolidationStatus =
  | "candidate"
  | "reinforced"
  | "ready"
  | "needs_review"
  | "expired"
  | "committed"
  | "rejected";

export type CandidateScoreResult = {
  prediction_error_score: number;
  salience_score: number;
  evidence_score: number;
  conflict_score: number;
  self_impact_score: number;
  consolidation_status: ConsolidationStatus;
  reinforcement_count: number;
  expires_at: string | null;
  last_evaluated_at: string;
  scoring_version: typeof SCORING_VERSION;
  scoring_reason: string;
  score_breakdown: StateValue;
};

type ScoreCandidateProposalInput = {
  proposal: PendingStateDeltaProposalInput;
  currentState: StateEntry[];
  now: string | Date;
};

type RuleContribution = {
  rule: string;
  delta: number;
};

export function scoreCandidateProposal({
  proposal,
  currentState,
  now,
}: ScoreCandidateProposalInput): CandidateScoreResult {
  const evaluatedAt = normalizeIsoDate(now);
  const currentEntry =
    currentState.find((entry) => entry.state_key === proposal.state_key) ?? null;
  const hasCurrentEntry = currentEntry !== null;
  const beforeMatchesCurrent = hasCurrentEntry
    ? stateValuesEqual(currentEntry.value, proposal.before_value)
    : proposal.before_value === null;
  const afterMatchesCurrent = hasCurrentEntry
    ? stateValuesEqual(currentEntry.value, proposal.after_value)
    : false;
  const activeConflict =
    hasCurrentEntry &&
    isActiveState(currentEntry) &&
    !afterMatchesCurrent &&
    proposal.temporal_scope !== "future_phase" &&
    proposal.change_type !== "future_intent";

  const prediction = scorePredictionError({
    proposal,
    hasCurrentEntry,
    beforeMatchesCurrent,
    afterMatchesCurrent,
  });
  const salience = scoreSalience(proposal);
  const evidence = scoreEvidence({
    proposal,
    beforeMatchesCurrent,
    afterMatchesCurrent,
  });
  const conflict = scoreConflict({
    proposal,
    activeConflict,
    beforeMatchesCurrent,
    afterMatchesCurrent,
  });
  const selfImpact = scoreSelfImpact({
    proposal,
    hasCurrentEntry,
    afterMatchesCurrent,
  });

  const scores = {
    prediction_error_score: roundScore(prediction.value),
    salience_score: roundScore(salience.value),
    evidence_score: roundScore(evidence.value),
    conflict_score: roundScore(conflict.value),
    self_impact_score: roundScore(selfImpact.value),
  };
  const consolidation = selectConsolidationStatus(scores);
  const expiresAt = selectExpiry(proposal, evaluatedAt);

  return {
    ...scores,
    consolidation_status: consolidation.status,
    reinforcement_count: 0,
    expires_at: expiresAt.value,
    last_evaluated_at: evaluatedAt,
    scoring_version: SCORING_VERSION,
    scoring_reason: consolidation.reason,
    score_breakdown: {
      version: SCORING_VERSION,
      evaluated_at: evaluatedAt,
      current_state: {
        found: hasCurrentEntry,
        before_matches_current: beforeMatchesCurrent,
        after_matches_current: afterMatchesCurrent,
        current_stability: currentEntry?.stability ?? null,
      },
      scores: {
        prediction_error: {
          value: scores.prediction_error_score,
          contributions: prediction.contributions,
        },
        salience: {
          value: scores.salience_score,
          contributions: salience.contributions,
        },
        evidence: {
          value: scores.evidence_score,
          contributions: evidence.contributions,
        },
        conflict: {
          value: scores.conflict_score,
          contributions: conflict.contributions,
        },
        self_impact: {
          value: scores.self_impact_score,
          contributions: selfImpact.contributions,
        },
      },
      consolidation: {
        status: consolidation.status,
        rule: consolidation.rule,
      },
      expiry: {
        expires_at: expiresAt.value,
        rule: expiresAt.rule,
      },
    },
  };
}

function scorePredictionError({
  proposal,
  hasCurrentEntry,
  beforeMatchesCurrent,
  afterMatchesCurrent,
}: {
  proposal: PendingStateDeltaProposalInput;
  hasCurrentEntry: boolean;
  beforeMatchesCurrent: boolean;
  afterMatchesCurrent: boolean;
}) {
  const contributions: RuleContribution[] = [
    {
      rule: hasCurrentEntry
        ? "existing_state_key_baseline"
        : "new_state_key_baseline",
      delta: hasCurrentEntry ? 0.45 : 0.35,
    },
  ];

  if (afterMatchesCurrent) {
    contributions.push({ rule: "after_value_already_current", delta: -0.35 });
  } else {
    contributions.push({ rule: "after_value_changes_current_state", delta: 0.2 });
  }

  if (!beforeMatchesCurrent) {
    contributions.push({ rule: "before_value_differs_from_current", delta: 0.25 });
  }

  if (["override", "reversal"].includes(proposal.change_type)) {
    contributions.push({ rule: "corrective_change_type", delta: 0.15 });
  }

  if (proposal.temporal_scope === "future_phase") {
    contributions.push({ rule: "future_phase_defers_prediction_error", delta: -0.1 });
  }

  return scoreFromContributions(contributions);
}

function scoreSalience(proposal: PendingStateDeltaProposalInput) {
  const contributions: RuleContribution[] = [
    { rule: "base_candidate_salience", delta: 0.2 },
    {
      rule: `temporal_scope:${proposal.temporal_scope}`,
      delta:
        {
          current_session: 0.1,
          current_task: 0.18,
          current_project: 0.25,
          until_deadline: 0.28,
          future_phase: 0.12,
          historical_note: 0.05,
          global_preference: 0.3,
        }[proposal.temporal_scope] ?? 0,
    },
    {
      rule: `stability:${proposal.stability}`,
      delta:
        {
          temporary: 0.04,
          tentative: 0.08,
          active: 0.2,
          stable: 0.25,
          deprecated: 0.12,
          completed: 0.16,
        }[proposal.stability] ?? 0,
    },
    {
      rule: `change_type:${proposal.change_type}`,
      delta:
        {
          new_state: 0.14,
          refinement: 0.14,
          override: 0.24,
          reversal: 0.24,
          completion: 0.2,
          deprecation: 0.2,
          future_intent: 0.08,
        }[proposal.change_type] ?? 0,
    },
  ];

  const namespace = proposal.state_key.split(".")[0];
  const namespaceBoost =
    {
      security: 0.25,
      submission: 0.18,
      timeline: 0.18,
      deadline: 0.18,
      implementation: 0.12,
      product: 0.1,
    }[namespace] ?? 0.06;
  contributions.push({ rule: `state_key_namespace:${namespace}`, delta: namespaceBoost });

  return scoreFromContributions(contributions);
}

function scoreEvidence({
  proposal,
  beforeMatchesCurrent,
  afterMatchesCurrent,
}: {
  proposal: PendingStateDeltaProposalInput;
  beforeMatchesCurrent: boolean;
  afterMatchesCurrent: boolean;
}) {
  const reasonLength = proposal.reason?.trim().length ?? 0;
  const contributions: RuleContribution[] = [
    { rule: "base_semantic_proposal_evidence", delta: 0.2 },
    {
      rule: "reason_specificity",
      delta: reasonLength >= 80 ? 0.25 : reasonLength >= 30 ? 0.18 : 0.1,
    },
    {
      rule: beforeMatchesCurrent
        ? "before_value_matches_current"
        : "before_value_stale_or_unknown",
      delta: beforeMatchesCurrent ? 0.25 : -0.15,
    },
    {
      rule: proposal.after_value === null
        ? "after_value_null"
        : "after_value_non_null",
      delta: proposal.after_value === null ? 0 : 0.15,
    },
  ];

  if (afterMatchesCurrent) {
    contributions.push({ rule: "after_value_reinforces_current_state", delta: 0.12 });
  }

  if (["active", "stable", "completed"].includes(proposal.stability)) {
    contributions.push({ rule: `stable_stability:${proposal.stability}`, delta: 0.1 });
  }

  return scoreFromContributions(contributions);
}

function scoreConflict({
  proposal,
  activeConflict,
  beforeMatchesCurrent,
  afterMatchesCurrent,
}: {
  proposal: PendingStateDeltaProposalInput;
  activeConflict: boolean;
  beforeMatchesCurrent: boolean;
  afterMatchesCurrent: boolean;
}) {
  const contributions: RuleContribution[] = [
    { rule: "base_conflict", delta: 0 },
  ];

  if (activeConflict) {
    contributions.push({ rule: "after_value_conflicts_with_active_state", delta: 0.5 });
  }

  if (!beforeMatchesCurrent) {
    contributions.push({ rule: "before_value_stale_or_contested", delta: 0.3 });
  }

  if (["override", "reversal"].includes(proposal.change_type)) {
    contributions.push({ rule: "explicit_corrective_change", delta: 0.15 });
  }

  if (["supersede", "deprecate"].includes(proposal.operation)) {
    contributions.push({ rule: `operation:${proposal.operation}`, delta: 0.12 });
  }

  if (afterMatchesCurrent) {
    contributions.push({ rule: "after_value_matches_current", delta: -0.25 });
  }

  if (
    proposal.temporal_scope === "future_phase" ||
    proposal.change_type === "future_intent"
  ) {
    contributions.push({ rule: "future_delta_low_active_conflict", delta: -0.2 });
  }

  return scoreFromContributions(contributions);
}

function scoreSelfImpact({
  proposal,
  hasCurrentEntry,
  afterMatchesCurrent,
}: {
  proposal: PendingStateDeltaProposalInput;
  hasCurrentEntry: boolean;
  afterMatchesCurrent: boolean;
}) {
  const namespace = proposal.state_key.split(".")[0];
  const contributions: RuleContribution[] = [
    { rule: "base_self_impact", delta: 0.2 },
    {
      rule: hasCurrentEntry
        ? "updates_existing_runtime_state"
        : "adds_new_runtime_state",
      delta: hasCurrentEntry ? 0.18 : 0.14,
    },
    {
      rule: `temporal_scope:${proposal.temporal_scope}`,
      delta:
        proposal.temporal_scope === "current_project" ||
        proposal.temporal_scope === "global_preference"
          ? 0.2
          : proposal.temporal_scope === "current_task" ||
              proposal.temporal_scope === "until_deadline"
            ? 0.12
            : 0.06,
    },
  ];

  if (namespace === "security") {
    contributions.push({ rule: "security_state_affects_agent_constraints", delta: 0.25 });
  } else if (namespace === "submission") {
    contributions.push({ rule: "submission_state_affects_delivery_work", delta: 0.18 });
  }

  if (["complete", "deprecate", "supersede"].includes(proposal.operation)) {
    contributions.push({ rule: `operation:${proposal.operation}`, delta: 0.15 });
  }

  if (!afterMatchesCurrent) {
    contributions.push({ rule: "after_value_changes_runtime_behavior", delta: 0.15 });
  }

  if (["active", "stable"].includes(proposal.stability)) {
    contributions.push({ rule: `stability:${proposal.stability}`, delta: 0.1 });
  }

  return scoreFromContributions(contributions);
}

function selectConsolidationStatus(scores: {
  prediction_error_score: number;
  salience_score: number;
  evidence_score: number;
  conflict_score: number;
  self_impact_score: number;
}): { status: ConsolidationStatus; reason: string; rule: string } {
  if (scores.conflict_score >= 0.7 || scores.evidence_score <= 0.35) {
    return {
      status: "needs_review",
      reason:
        "Deterministic scoring marked this candidate for review because conflict is high or evidence is low.",
      rule: "conflict_score >= 0.70 OR evidence_score <= 0.35",
    };
  }

  if (
    scores.prediction_error_score >= 0.35 &&
    scores.salience_score >= 0.55 &&
    scores.evidence_score >= 0.65 &&
    scores.self_impact_score >= 0.45 &&
    scores.conflict_score < 0.5
  ) {
    return {
      status: "ready",
      reason:
        "Deterministic scoring marked this candidate ready because evidence, salience, and impact are strong without high conflict.",
      rule:
        "prediction_error_score >= 0.35 AND salience_score >= 0.55 AND evidence_score >= 0.65 AND self_impact_score >= 0.45 AND conflict_score < 0.50",
    };
  }

  return {
    status: "candidate",
    reason:
      "Deterministic scoring kept this proposal as a candidate pending more reinforcement or review.",
    rule: "default_candidate_status",
  };
}

function selectExpiry(
  proposal: PendingStateDeltaProposalInput,
  evaluatedAt: string,
): { value: string | null; rule: string } {
  if (proposal.valid_until) {
    return { value: proposal.valid_until, rule: "uses_valid_until" };
  }

  if (["stable", "completed", "deprecated"].includes(proposal.stability)) {
    return { value: null, rule: `no_expiry_for_stability:${proposal.stability}` };
  }

  const days =
    {
      current_session: 1,
      current_task: 14,
      current_project: 90,
      until_deadline: 30,
      future_phase: 180,
      historical_note: 365,
      global_preference: 365,
    }[proposal.temporal_scope] ?? null;

  if (days === null) {
    return { value: null, rule: "no_temporal_expiry_rule" };
  }

  return {
    value: addDays(evaluatedAt, days),
    rule: `temporal_scope:${proposal.temporal_scope}:plus_${days}_days`,
  };
}

function scoreFromContributions(contributions: RuleContribution[]) {
  return {
    value: contributions.reduce((sum, contribution) => sum + contribution.delta, 0),
    contributions,
  };
}

function roundScore(value: number) {
  return Math.round(clamp01(value) * 100) / 100;
}

function clamp01(value: number) {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function normalizeIsoDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function isActiveState(entry: StateEntry) {
  return (
    entry.temporal_scope !== "future_phase" &&
    entry.stability !== "deprecated" &&
    entry.stability !== "completed"
  );
}

function stateValuesEqual(left: StateValue, right: StateValue) {
  return stableStringify(left) === stableStringify(right);
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
