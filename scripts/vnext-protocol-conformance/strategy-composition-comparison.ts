import assert from "node:assert/strict";

import {
  strategyCompositionBoundCaseFixture,
  strategyCompositionComparisonFixture,
  strategyCompositionComparisonInputFixture,
  strategyCompositionComparisonUnknownInputFixture,
  strategyCompositionOrderedCaseFixture,
  strategyCompositionUnboundCaseFixture,
} from "@/fixtures/vnext/protocol/strategy-composition-comparison-v0-1";
import { strategyCompositionDevelopmentInputFixture } from "@/fixtures/vnext/protocol/strategy-composition-case-v0-1";
import {
  buildStrategyCompositionComparisonV01,
  canonicalizeStrategyCompositionComparisonValueV01,
  validateStrategyCompositionComparisonV01,
  type BuildStrategyCompositionComparisonInputV01,
} from "@/lib/vnext/strategy-composition-comparison";
import {
  buildStrategyCompositionCaseV01,
  type BuildStrategyCompositionCaseInputV01,
} from "@/lib/vnext/strategy-composition-case";
import type { StrategyCompositionComparisonV01 } from "@/types/vnext/strategy-composition-comparison";
import { runStrategyCompositionComparisonReportV01 } from "@/scripts/strategy-composition-comparison-report";

export interface StrategyCompositionComparisonConformanceSummaryV01 {
  suite: "strategy-composition-comparison-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  comparison_id: string;
  comparison_fingerprint: string;
  structural_parity_checked: true;
  equal_budget_checked: true;
  deterministic_pairwise_deltas_checked: true;
  hard_gate_non_compensation_checked: true;
  holdout_boundary_checked: true;
  non_dominance_without_winner_checked: true;
  ablation_association_noncausal_checked: true;
  negative_transfer_local_only_checked: true;
  unknown_lanes_preserved: true;
  input_immutability_checked: true;
  authority_all_false_checked: true;
  scalar_or_ranking_absent_checked: true;
}

export function runStrategyCompositionComparisonConformanceV01(): StrategyCompositionComparisonConformanceSummaryV01 {
  const frozen = deepFreeze(clone(strategyCompositionComparisonInputFixture));
  const before = canonicalizeStrategyCompositionComparisonValueV01(frozen);
  const first = buildStrategyCompositionComparisonV01(frozen);
  const replay = buildStrategyCompositionComparisonV01(frozen);
  assert.equal(canonicalizeStrategyCompositionComparisonValueV01(frozen), before);
  assert.deepEqual(first, replay);
  assert.deepEqual(first, strategyCompositionComparisonFixture);
  assert.equal(validateStrategyCompositionComparisonV01(first).status, "valid");
  const changedOutcomeInput = clone(strategyCompositionComparisonInputFixture);
  changedOutcomeInput.observations[1]!.outcome.review_burden.correction_count = 4;
  const changedOutcome = buildStrategyCompositionComparisonV01(changedOutcomeInput);
  assert.notEqual(changedOutcome.comparison_id, first.comparison_id);
  assert.notEqual(changedOutcome.integrity.fingerprint, first.integrity.fingerprint);
  const jsonReport = runStrategyCompositionComparisonReportV01({ ...clone(strategyCompositionComparisonInputFixture), format: "json" });
  const markdownReport = runStrategyCompositionComparisonReportV01({ ...clone(strategyCompositionComparisonInputFixture), format: "markdown" });
  assert.equal((JSON.parse(jsonReport) as StrategyCompositionComparisonV01).integrity.fingerprint, first.integrity.fingerprint);
  assert.match(markdownReport, /## Four variants/u);
  assert.match(markdownReport, /## Pairwise dimension results/u);
  assert.match(markdownReport, /no causal contribution is claimed/u);
  assert.match(markdownReport, /no general harm/u);
  assert.match(markdownReport, /no Core state, Evidence, accepted strategy/u);

  assert.deepEqual(first.variant_summaries.map((item) => item.variant_kind), ["monolithic", "unbound", "bound", "ordered"]);
  assert.deepEqual(first.variant_summaries.map((item) => [item.role_binding_count, item.relation_count]), [[0, 0], [0, 0], [3, 0], [3, 2]]);
  assert.equal(first.structural_parity.componentized_components_equal, true);
  assert.equal(first.structural_parity.componentized_sources_equal, true);
  assert.equal(first.structural_parity.intended_binding_and_order_deltas_only, true);
  assert.equal(first.equal_budget.equal_for_all_variants, true);
  assert.equal(new Set(first.outcome_observations.map((item) => item.budget.budget_id)).size, 1);
  assert.equal(new Set(first.outcome_observations.map((item) => item.evaluation_case.evaluation_case_id)).size, 1);
  assert.equal(new Set(first.outcome_observations.map((item) => item.holdout_case.case_id)).size, 1);
  assert.ok(Date.parse(first.evaluation_binding.frozen_cutoff) < Date.parse(first.evaluation_binding.observation_cutoff));
  for (const observation of first.outcome_observations) {
    assert.ok(Date.parse(observation.source.available_at) > Date.parse(first.evaluation_binding.frozen_cutoff));
    assert.equal(observation.outcome_is_evaluation_truth, false);
    assert.equal(observation.observed_advantage_is_verified_general_benefit, false);
  }

  assert.deepEqual(first.pairwise_comparisons.map((item) => item.summary_relation), ["right_better_hard_gate", "tradeoff", "tradeoff", "right_better_hard_gate"]);
  assert.equal(first.pairwise_comparisons[0]!.hard_gate_non_compensation_applied, true);
  assert.equal(first.pairwise_comparisons[0]!.dimension_deltas.find((item) => item.dimension === "cost_operability.latency_ms")!.relation, "better");
  assert.equal(first.pairwise_comparisons[0]!.summary_relation, "right_better_hard_gate");
  assert.equal(first.non_dominance.status, "determined");
  assert.deepEqual(first.non_dominance.non_dominated_variants, ["unbound", "bound", "ordered"]);
  assert.equal(first.non_dominance.global_winner_created, false);
  assert.equal(first.non_dominance.ordinal_ranking_created, false);
  assert.equal(first.non_dominance.product_promotion_created, false);

  assert.ok(first.ablation_association);
  assert.equal(first.ablation_association.association_kind, "bounded_ablation_intervention_association");
  assert.equal(first.ablation_association.causal_contribution_claimed, false);
  assert.equal(first.ablation_association.general_causal_contribution_claimed, false);
  assert.ok(first.negative_transfer);
  assert.equal(first.negative_transfer.signal, "local_negative_transfer_candidate");
  assert.equal(first.negative_transfer.general_harm_claimed, false);
  assert.equal(first.negative_transfer.component_blacklist_created, false);

  const unknown = buildStrategyCompositionComparisonV01(strategyCompositionComparisonUnknownInputFixture);
  assert.equal(unknown.completeness.status, "partial");
  assert.ok(unknown.completeness.missing_dimensions.includes("cost_operability.latency_ms"));
  assert.equal(unknown.non_dominance.status, "undetermined");
  assert.deepEqual(unknown.non_dominance.non_dominated_variants, []);

  for (const [key, value] of Object.entries(first.authority_summary)) {
    if (key === "notes") continue;
    assert.equal(value, false, `authority flag ${key}`);
  }
  assertNoForbiddenOutputFields(first);

  const reordered = clone(strategyCompositionComparisonInputFixture);
  reordered.observations.reverse();
  reordered.limitations = [...reordered.limitations].reverse();
  assert.deepEqual(buildStrategyCompositionComparisonV01(reordered), first);

  const invalidCases: Array<{ name: string; code: string; mutate: (input: BuildStrategyCompositionComparisonInputV01) => void }> = [
    { name: "component_content_mismatch", code: "strategy_comparison_component_content_mismatch", mutate: (input) => { input.cases.unbound = rebuiltComponentizedCase("case:comparison-unbound-mismatch", false, false, (caseInput) => { caseInput.components[0]!.summary = "Different construction content."; }); } },
    { name: "source_provenance_mismatch", code: "strategy_comparison_source_provenance_mismatch", mutate: (input) => { input.cases.bound = rebuiltComponentizedCase("case:comparison-bound-source-mismatch", true, false, (caseInput) => { caseInput.source_refs[0]!.source_fingerprint = `sha256:${"8".repeat(64)}`; }); } },
    { name: "construction_cutoff_mismatch", code: "strategy_comparison_construction_material_mismatch", mutate: (input) => { input.cases.ordered = rebuiltComponentizedCase("case:comparison-ordered-cutoff", true, true, (caseInput) => { caseInput.case_binding.construction_cutoff = "2026-08-05T12:00:00.000Z"; }); } },
    { name: "task_family_mismatch", code: "strategy_comparison_construction_material_mismatch", mutate: (input) => { input.cases.ordered = rebuiltComponentizedCase("case:comparison-ordered-family", true, true, (caseInput) => { caseInput.case_binding.task_family_key = "task-family:different"; }); } },
    { name: "budget_mismatch", code: "strategy_comparison_budget_mismatch", mutate: (input) => { input.observations[0]!.budget.budget_id = "budget:different"; } },
    { name: "evaluation_mismatch", code: "strategy_comparison_evaluation_identity_mismatch", mutate: (input) => { input.observations[0]!.evaluation_case = { ...input.observations[0]!.evaluation_case, evaluation_case_id: "evaluation-case:different" }; } },
    { name: "holdout_identity_mismatch", code: "strategy_comparison_holdout_identity_mismatch", mutate: (input) => { input.observations[0]!.holdout_case = { ...input.observations[0]!.holdout_case, case_id: "strategy-composition-case:different" }; } },
    { name: "holdout_leakage_source", code: "strategy_comparison_outcome_source_invalid", mutate: (input) => { input.observations[0]!.source_ref_id = input.holdout_case.source_refs.find((source) => source.source_use === "construction_input")!.source_ref_id; } },
    { name: "post_cutoff_outcome", code: "strategy_comparison_outcome_source_temporal_invalid", mutate: (input) => { input.observation_cutoff = "2026-08-07T00:30:00.000Z"; } },
    { name: "duplicate_observation", code: "strategy_comparison_duplicate_or_missing_observation", mutate: (input) => { input.observations[1]!.subject_kind = "monolithic"; } },
    { name: "outcome_bound", code: "strategy_comparison_bound_invalid", mutate: (input) => { input.observations[0]!.outcome.verification.required_passed = 1_000_001; } },
    { name: "scalar_field", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input as unknown as Record<string, unknown>).fitness_score = 1; } },
    { name: "ranking_field", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input as unknown as Record<string, unknown>).ranking = ["ordered"]; } },
    { name: "promotion_field", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input as unknown as Record<string, unknown>).promotion = "ordered"; } },
    { name: "causal_overclaim", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input.ablation as unknown as Record<string, unknown>).causal_contribution_claimed = true; } },
    { name: "general_harm_overclaim", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input as unknown as Record<string, unknown>).general_harm = true; } },
    { name: "raw_transcript", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input as unknown as Record<string, unknown>).raw_transcript = "forbidden"; } },
    { name: "secret", code: "strategy_comparison_secret_forbidden", mutate: (input) => { input.limitations = ["sk-testthismustneverpersist123456"]; } },
    { name: "private_absolute_path", code: "strategy_comparison_private_absolute_path_forbidden", mutate: (input) => { input.limitations = ["/Users/private/research.json"]; } },
    { name: "unknown_field", code: "strategy_comparison_unknown_or_missing_field", mutate: (input) => { (input as unknown as Record<string, unknown>).unexpected = false; } },
  ];
  for (const fixture of invalidCases) {
    const input = clone(strategyCompositionComparisonInputFixture);
    fixture.mutate(input);
    assert.throws(() => buildStrategyCompositionComparisonV01(input), new RegExp(fixture.code), fixture.name);
  }

  const authorityMutation = clone(first);
  authorityMutation.authority_summary.is_evidence = true as false;
  assertBlocked(validateStrategyCompositionComparisonV01(authorityMutation), "strategy_comparison_authority_boundary_invalid");
  const fingerprintMutation = clone(first);
  fingerprintMutation.integrity.fingerprint = `sha256:${"0".repeat(64)}`;
  assertBlocked(validateStrategyCompositionComparisonV01(fingerprintMutation), "strategy_comparison_fingerprint_mismatch");
  const unknownOutput = clone(first) as StrategyCompositionComparisonV01 & { extra?: string };
  unknownOutput.extra = "forbidden";
  assertBlocked(validateStrategyCompositionComparisonV01(unknownOutput), "strategy_comparison_unknown_or_missing_field");

  return {
    suite: "strategy-composition-comparison-v0.1", status: "passed", positive_fixture_count: 12,
    negative_fixture_count: invalidCases.length + 3, comparison_id: first.comparison_id,
    comparison_fingerprint: first.integrity.fingerprint, structural_parity_checked: true,
    equal_budget_checked: true, deterministic_pairwise_deltas_checked: true,
    hard_gate_non_compensation_checked: true, holdout_boundary_checked: true,
    non_dominance_without_winner_checked: true, ablation_association_noncausal_checked: true,
    negative_transfer_local_only_checked: true, unknown_lanes_preserved: true,
    input_immutability_checked: true, authority_all_false_checked: true,
    scalar_or_ranking_absent_checked: true,
  };
}

function rebuiltComponentizedCase(caseKey: string, bindings: boolean, relations: boolean, mutate: (input: BuildStrategyCompositionCaseInputV01) => void) {
  const input: BuildStrategyCompositionCaseInputV01 = {
    ...clone(strategyCompositionDevelopmentInputFixture),
    case_binding: { ...strategyCompositionDevelopmentInputFixture.case_binding, case_key: caseKey },
    role_bindings: bindings ? clone(strategyCompositionDevelopmentInputFixture.role_bindings) : [],
    relations: relations ? clone(strategyCompositionDevelopmentInputFixture.relations) : [],
  };
  mutate(input);
  return buildStrategyCompositionCaseV01(input);
}

function assertNoForbiddenOutputFields(value: StrategyCompositionComparisonV01): void {
  const keys = collectKeys(value);
  for (const forbidden of ["fitness_score", "quality_score", "overall_score", "weighted_sum", "global_strategy_score", "winner", "winning_variant", "rank", "ranking", "ordinal_rank", "promotion", "accepted_strategy"]) {
    assert.equal(keys.has(forbidden), false, forbidden);
  }
}

function collectKeys(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) collectKeys(item, result);
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) { result.add(key); collectKeys(child, result); }
  return result;
}

function assertBlocked(result: ReturnType<typeof validateStrategyCompositionComparisonV01>, code: string): void {
  assert.equal(result.status, "blocked");
  assert.equal(result.errors[0]?.code, code);
}

function clone<T>(value: T): T { return structuredClone(value); }
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); }
  return value;
}
