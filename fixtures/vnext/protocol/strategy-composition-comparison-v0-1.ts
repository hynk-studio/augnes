import {
  buildStrategyCompositionBudgetV01,
  buildStrategyCompositionComparisonV01,
  type BuildStrategyCompositionComparisonInputV01,
  type BuildStrategyCompositionOutcomeObservationInputV01,
} from "@/lib/vnext/strategy-composition-comparison";
import {
  buildStrategyCompositionAblationCaseV01,
  buildStrategyCompositionCaseV01,
  createStrategyCompositionCaseReferenceV01,
  type BuildStrategyCompositionCaseInputV01,
} from "@/lib/vnext/strategy-composition-case";
import type { StrategyCompositionOutcomeVectorV01 } from "@/types/vnext/strategy-composition-comparison";
import { STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01 } from "@/types/vnext/strategy-composition-case";
import {
  strategyCompositionBaselineCaseFixture,
  strategyCompositionDevelopmentInputFixture,
  strategyCompositionNegativeTransferCaseFixture,
} from "@/fixtures/vnext/protocol/strategy-composition-case-v0-1";

const workspaceId = strategyCompositionDevelopmentInputFixture.case_binding.workspace_id;
const projectId = strategyCompositionDevelopmentInputFixture.case_binding.project_id;
function componentizedInput(caseKey: string, withBindings: boolean, withRelations: boolean): BuildStrategyCompositionCaseInputV01 {
  return {
    ...structuredClone(strategyCompositionDevelopmentInputFixture),
    case_binding: { ...strategyCompositionDevelopmentInputFixture.case_binding, case_key: caseKey },
    role_bindings: withBindings ? structuredClone(strategyCompositionDevelopmentInputFixture.role_bindings) : [],
    relations: withRelations ? structuredClone(strategyCompositionDevelopmentInputFixture.relations) : [],
  };
}

export const strategyCompositionUnboundCaseFixture = buildStrategyCompositionCaseV01(
  componentizedInput("case:comparison-unbound", false, false),
);
export const strategyCompositionBoundCaseFixture = buildStrategyCompositionCaseV01(
  componentizedInput("case:comparison-bound", true, false),
);
export const strategyCompositionOrderedCaseFixture = buildStrategyCompositionCaseV01(
  componentizedInput("case:comparison-ordered", true, true),
);

const withheldSource = sourceFixture("source:comparison-withheld", "synthetic_fixture", "withheld_holdout", "fixture:comparison-withheld", "a", "2026-08-04T00:00:00.000Z");
const outcomeSources = [
  sourceFixture("source:comparison-outcome-monolithic", "evaluation_outcome", "evaluation_outcome", "outcome:comparison-monolithic", "b", "2026-08-07T01:00:00.000Z"),
  sourceFixture("source:comparison-outcome-unbound", "evaluation_outcome", "evaluation_outcome", "outcome:comparison-unbound", "c", "2026-08-07T02:00:00.000Z"),
  sourceFixture("source:comparison-outcome-bound", "evaluation_outcome", "evaluation_outcome", "outcome:comparison-bound", "d", "2026-08-07T03:00:00.000Z"),
  sourceFixture("source:comparison-outcome-ordered", "evaluation_outcome", "evaluation_outcome", "outcome:comparison-ordered", "e", "2026-08-07T04:00:00.000Z"),
  sourceFixture("source:comparison-outcome-ablation", "evaluation_outcome", "evaluation_outcome", "outcome:comparison-ablation", "f", "2026-08-07T05:00:00.000Z"),
];

export const strategyCompositionComparisonHoldoutCaseFixture = buildStrategyCompositionCaseV01({
  case_binding: {
    workspace_id: workspaceId,
    project_id: projectId,
    case_key: "case:comparison-holdout",
    task_family_key: "task-family:matched-holdout-review",
    construction_cutoff: "2026-08-06T00:00:00.000Z",
    synthetic: true,
  },
  source_refs: [...strategyCompositionOrderedCaseFixture.source_refs, withheldSource, ...outcomeSources],
  components: strategyCompositionOrderedCaseFixture.components,
  role_bindings: strategyCompositionOrderedCaseFixture.role_bindings,
  relations: strategyCompositionOrderedCaseFixture.relations,
  evaluation_design: {
    design_version: STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
    case_role: "holdout",
    baseline_case: createStrategyCompositionCaseReferenceV01(strategyCompositionBaselineCaseFixture),
    parent_development_case: createStrategyCompositionCaseReferenceV01(strategyCompositionOrderedCaseFixture),
    development_task_family_key: strategyCompositionOrderedCaseFixture.case_binding.task_family_key,
    holdout_task_family_key: "task-family:matched-holdout-review",
    frozen_cutoff: "2026-08-06T00:00:00.000Z",
    withheld_source_ref_ids: [withheldSource.source_ref_id],
    evaluation_outcome_source_ref_ids: outcomeSources.map((source) => source.source_ref_id),
    development_outcome_included: false,
    holdout_success_claimed: false,
    superiority_claimed: false,
  },
  limitations: ["Matched holdout observations remain observations, not strategy acceptance."],
  missingness: [],
});

export const strategyCompositionComparisonAblationCaseFixture = buildStrategyCompositionAblationCaseV01({
  parent_case: strategyCompositionOrderedCaseFixture,
  case_key: "case:comparison-ablation-role",
  target: { target_kind: "role_binding", role: "falsification", component_id: "component:falsify" },
});

export const strategyCompositionComparisonBudgetInputFixture = deepFreeze({
  budget_key: "budget:matched-offline-v0-1",
  provider_call_limit: 0,
  tool_call_limit: 20,
  step_limit: 12,
  token_limit: 0,
  cost_limit_microunits: 0,
  latency_limit_ms: 10_000,
});

const budget = buildStrategyCompositionBudgetV01(strategyCompositionComparisonBudgetInputFixture);
const budgetRef = { budget_id: budget.budget_id, budget_fingerprint: budget.integrity.fingerprint };
export const strategyCompositionComparisonEvaluationCaseFixture = deepFreeze({
  evaluation_case_id: "evaluation-case:matched-holdout-review",
  evaluation_case_fingerprint: `sha256:${"9".repeat(64)}`,
  task_family_key: "task-family:matched-holdout-review",
});
const holdoutRef = createStrategyCompositionCaseReferenceV01(strategyCompositionComparisonHoldoutCaseFixture);

function completeOutcome(input: {
  required: number; failed: number; hardGate: boolean; corrections: number; interventions: number;
  repeated: number; missingContext: number; tools: number; latency: number; cleanup?: number;
}): StrategyCompositionOutcomeVectorV01 {
  return {
    verification: { required_passed: input.required, failed: input.failed, blocked: 0, skipped: 0, unknown: 0, hard_gate_failure: input.hardGate, hard_gate_failure_codes: input.hardGate ? ["required-contract-failed"] : [] },
    review_burden: { correction_count: input.corrections, intervention_count: input.interventions, repeated_explanation_count: input.repeated, missing_critical_context_correction_count: input.missingContext },
    cost_operability: { provider_call_count: 0, tool_call_count: input.tools, token_count: 0, cost_microunits: 0, latency_ms: input.latency, cleanup_recovery_count: input.cleanup ?? 0, egress_observation: "none_observed" },
  };
}

const outcomes = {
  monolithic: completeOutcome({ required: 4, failed: 1, hardGate: true, corrections: 4, interventions: 2, repeated: 2, missingContext: 1, tools: 4, latency: 400 }),
  unbound: completeOutcome({ required: 5, failed: 0, hardGate: false, corrections: 3, interventions: 2, repeated: 2, missingContext: 1, tools: 7, latency: 650 }),
  bound: completeOutcome({ required: 6, failed: 0, hardGate: false, corrections: 2, interventions: 1, repeated: 1, missingContext: 1, tools: 9, latency: 800 }),
  ordered: completeOutcome({ required: 7, failed: 0, hardGate: false, corrections: 1, interventions: 1, repeated: 0, missingContext: 0, tools: 11, latency: 950 }),
  ablation: completeOutcome({ required: 6, failed: 0, hardGate: false, corrections: 2, interventions: 1, repeated: 1, missingContext: 0, tools: 10, latency: 880 }),
};

const cases = {
  monolithic: strategyCompositionBaselineCaseFixture,
  unbound: strategyCompositionUnboundCaseFixture,
  bound: strategyCompositionBoundCaseFixture,
  ordered: strategyCompositionOrderedCaseFixture,
};

function observation(subject: keyof typeof outcomes, sourceIndex: number, caseRef = subject === "ablation" ? createStrategyCompositionCaseReferenceV01(strategyCompositionComparisonAblationCaseFixture) : createStrategyCompositionCaseReferenceV01(cases[subject as keyof typeof cases])): BuildStrategyCompositionOutcomeObservationInputV01 {
  return {
    subject_kind: subject,
    case_ref: caseRef,
    evaluation_case: strategyCompositionComparisonEvaluationCaseFixture,
    holdout_case: holdoutRef,
    budget: budgetRef,
    source_ref_id: outcomeSources[sourceIndex]!.source_ref_id,
    outcome: outcomes[subject],
    limitations: ["Synthetic exact observation is bounded to this fixture."],
  };
}

export const strategyCompositionComparisonInputFixture = deepFreeze({
  workspace_id: workspaceId,
  project_id: projectId,
  comparison_family_key: "comparison-family:strategy-composition-matched-offline",
  cases,
  evaluation_case: strategyCompositionComparisonEvaluationCaseFixture,
  parent_development_case: strategyCompositionOrderedCaseFixture,
  holdout_case: strategyCompositionComparisonHoldoutCaseFixture,
  observation_cutoff: "2026-08-08T00:00:00.000Z",
  equal_budget: strategyCompositionComparisonBudgetInputFixture,
  observations: [observation("monolithic", 0), observation("unbound", 1), observation("bound", 2), observation("ordered", 3)],
  ablation: {
    parent_case: strategyCompositionOrderedCaseFixture,
    child_case: strategyCompositionComparisonAblationCaseFixture,
    parent_observation: observation("ordered", 3),
    child_observation: observation("ablation", 4),
  },
  negative_transfer_case: strategyCompositionNegativeTransferCaseFixture,
  limitations: ["Deterministic exact fixtures only; stochastic aggregation is unsupported in v0.1."],
} satisfies BuildStrategyCompositionComparisonInputV01);

export const strategyCompositionComparisonFixture = buildStrategyCompositionComparisonV01(strategyCompositionComparisonInputFixture);

export const strategyCompositionComparisonUnknownInputFixture = deepFreeze((() => {
  const input: BuildStrategyCompositionComparisonInputV01 = structuredClone(strategyCompositionComparisonInputFixture);
  input.observations[1]!.outcome.cost_operability.latency_ms = null;
  input.observations[1]!.outcome.cost_operability.egress_observation = "unknown";
  input.ablation = null;
  input.negative_transfer_case = null;
  return input;
})());

function sourceFixture(source_ref_id: string, source_kind: "synthetic_fixture" | "evaluation_outcome", source_use: "withheld_holdout" | "evaluation_outcome", source_id: string, fingerprintCharacter: string, timestamp: string) {
  return {
    source_ref_id, source_kind, source_use, workspace_id: workspaceId, project_id: projectId, source_id,
    source_fingerprint: `sha256:${fingerprintCharacter.repeat(64)}`,
    observed_at: timestamp, available_at: timestamp, epistemic_status: "observed" as const,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
