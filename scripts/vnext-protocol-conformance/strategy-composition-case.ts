import assert from "node:assert/strict";

import {
  invalidStrategyCompositionCaseFixtureCasesV01,
  reorderedStrategyCompositionDevelopmentInputFixture,
  strategyCompositionAblationCaseFixture,
  strategyCompositionBaselineCaseFixture,
  strategyCompositionDevelopmentCaseFixture,
  strategyCompositionDevelopmentInputFixture,
  strategyCompositionHoldoutCaseFixture,
  strategyCompositionNegativeTransferCaseFixture,
} from "@/fixtures/vnext/protocol/strategy-composition-case-v0-1";
import {
  buildStrategyCompositionCaseV01,
  canonicalizeStrategyCompositionValueV01,
  createStrategyCompositionCaseFingerprintV01,
  deriveStrategyCompositionCaseIdV01,
  validateStrategyCompositionAblationRelationV01,
  validateStrategyCompositionCaseV01,
  validateStrategyCompositionHoldoutRelationV01,
  type BuildStrategyCompositionCaseInputV01,
} from "@/lib/vnext/strategy-composition-case";
import type { StrategyCompositionCaseV01 } from "@/types/vnext/strategy-composition-case";

export interface StrategyCompositionCaseConformanceSummaryV01 {
  suite: "strategy-composition-case-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  deterministic_case_id: string;
  deterministic_fingerprint: string;
  canonical_set_ordering_checked: true;
  meaningful_fingerprint_changes_checked: number;
  input_immutability_checked: true;
  role_binding_separation_checked: true;
  holdout_cutoff_and_recombination_checked: true;
  one_target_ablation_checked: true;
  ablation_causality_not_claimed: true;
  negative_transfer_general_harm_not_claimed: true;
  strategic_transfer_provenance_not_promoted: true;
  authority_all_false_checked: true;
  scalar_fitness_absent_checked: true;
}

export function runStrategyCompositionCaseConformanceV01(): StrategyCompositionCaseConformanceSummaryV01 {
  const frozenInput = deepFreeze(clone(strategyCompositionDevelopmentInputFixture));
  const before = canonicalizeStrategyCompositionValueV01(frozenInput);
  const development = buildStrategyCompositionCaseV01(frozenInput);
  const replay = buildStrategyCompositionCaseV01(frozenInput);
  assert.equal(canonicalizeStrategyCompositionValueV01(frozenInput), before);
  assert.deepEqual(replay, development);
  assert.deepEqual(development, strategyCompositionDevelopmentCaseFixture);
  assert.equal(validateStrategyCompositionCaseV01(development).status, "valid");
  assert.equal(validateStrategyCompositionCaseV01(strategyCompositionBaselineCaseFixture).status, "valid");
  assert.equal(validateStrategyCompositionCaseV01(strategyCompositionHoldoutCaseFixture).status, "valid");
  assert.equal(validateStrategyCompositionCaseV01(strategyCompositionAblationCaseFixture).status, "valid");
  assert.equal(validateStrategyCompositionCaseV01(strategyCompositionNegativeTransferCaseFixture).status, "valid");

  const reordered = buildStrategyCompositionCaseV01(
    deepFreeze(reorderedStrategyCompositionDevelopmentInputFixture()),
  );
  assert.deepEqual(reordered, development);
  assert.equal(development.relations.length, 2);

  const componentKeys = new Set(Object.keys(development.components[0]!));
  assert.equal(componentKeys.has("role"), false);
  assert.equal(componentKeys.has("role_binding"), false);
  assert.equal(componentKeys.has("actor_id"), false);
  assert.equal(componentKeys.has("actor_identity"), false);
  assert.equal(strategyCompositionBaselineCaseFixture.components.length, 1);
  assert.equal(strategyCompositionBaselineCaseFixture.role_bindings.length, 0);
  for (const binding of development.role_bindings) {
    assert.ok(
      development.components.some(
        (component) => component.component_id === binding.component_id,
      ),
    );
    assert.equal(binding.actor_identity_included, false);
  }

  const strategicComponent = development.components.find(
    (component) => component.component_id === "component:falsify",
  );
  assert.ok(strategicComponent);
  const transferProvenance = strategicComponent.provenance_relations.find(
    (relation) =>
      relation.relation_kind ===
      "strategic_advantage_transfer_hypothesis",
  );
  assert.ok(transferProvenance);
  assert.equal(transferProvenance.accepted_component, false);
  assert.equal(transferProvenance.verified_benefit, false);
  assert.equal(transferProvenance.causal_evidence, false);
  assert.equal(transferProvenance.product_promotion, false);
  assert.equal(strategicComponent.accepted_strategy, false);

  assert.equal(
    validateStrategyCompositionHoldoutRelationV01(
      development,
      strategyCompositionHoldoutCaseFixture,
    ).status,
    "valid",
  );
  const holdoutDesign = strategyCompositionHoldoutCaseFixture.evaluation_design;
  assert.equal(holdoutDesign.case_role, "holdout");
  if (holdoutDesign.case_role !== "holdout") assert.fail("holdout design expected");
  assert.equal(holdoutDesign.development_outcome_included, false);
  assert.equal(holdoutDesign.holdout_success_claimed, false);
  const holdoutCutoff = Date.parse(holdoutDesign.frozen_cutoff);
  for (const sourceRefId of holdoutDesign.evaluation_outcome_source_ref_ids) {
    const source = strategyCompositionHoldoutCaseFixture.source_refs.find(
      (candidate) => candidate.source_ref_id === sourceRefId,
    );
    assert.ok(source);
    assert.ok(Date.parse(source.available_at) > holdoutCutoff);
    assert.ok(
      strategyCompositionHoldoutCaseFixture.components.every(
        (component) => !component.source_ref_ids.includes(sourceRefId),
      ),
    );
  }

  assert.equal(
    validateStrategyCompositionAblationRelationV01(
      development,
      strategyCompositionAblationCaseFixture,
    ).status,
    "valid",
  );
  const ablationDesign = strategyCompositionAblationCaseFixture.evaluation_design;
  assert.equal(ablationDesign.case_role, "ablation");
  if (ablationDesign.case_role !== "ablation") assert.fail("ablation design expected");
  assert.equal(ablationDesign.targets.length, 1);
  assert.equal(ablationDesign.exactly_one_target, true);
  assert.equal(ablationDesign.causal_contribution_claimed, false);

  const staleParent = clone(strategyCompositionAblationCaseFixture);
  if (staleParent.evaluation_design.case_role !== "ablation") {
    assert.fail("ablation design expected");
  }
  staleParent.evaluation_design.parent_case.case_fingerprint = `sha256:${"f".repeat(64)}`;
  resignCase(staleParent);
  assertBlockedCode(
    validateStrategyCompositionAblationRelationV01(development, staleParent),
    "strategy_composition_ablation_parent_binding_mismatch",
    "stale_ablation_parent",
  );

  const hiddenNonTargetMutation = clone(strategyCompositionAblationCaseFixture);
  hiddenNonTargetMutation.components[0]!.summary =
    "A hidden non-target mutation must fail the parent-child relation.";
  resignCase(hiddenNonTargetMutation);
  assertBlockedCode(
    validateStrategyCompositionAblationRelationV01(
      development,
      hiddenNonTargetMutation,
    ),
    "strategy_composition_ablation_non_target_mutation",
    "hidden_non_target_ablation_mutation",
  );

  const negativeDesign =
    strategyCompositionNegativeTransferCaseFixture.evaluation_design;
  assert.equal(negativeDesign.case_role, "negative_transfer");
  if (negativeDesign.case_role !== "negative_transfer") {
    assert.fail("negative-transfer design expected");
  }
  assert.equal(negativeDesign.negative_transfer_candidate, true);
  assert.equal(negativeDesign.observed_adverse_association, "supplied");
  assert.equal(negativeDesign.causal_negative_contribution_claimed, false);
  assert.equal(negativeDesign.general_harm_claimed, false);
  assert.equal(negativeDesign.superiority_claimed, false);

  for (const fixture of invalidStrategyCompositionCaseFixtureCasesV01) {
    assert.throws(
      () => buildStrategyCompositionCaseV01(fixture.input),
      new RegExp(escapeRegExp(fixture.expected_code)),
      fixture.name,
    );
  }

  const outputValidationCases: Array<{
    name: string;
    expected_code: string;
    mutate: (value: StrategyCompositionCaseV01) => void;
    resign?: boolean;
  }> = [
    {
      name: "unknown_output_field",
      expected_code: "strategy_composition_unknown_field",
      mutate: (value) => {
        (value as unknown as Record<string, unknown>).extra = "forbidden";
      },
      resign: true,
    },
    {
      name: "authority_flag",
      expected_code: "strategy_composition_authority_field_forbidden",
      mutate: (value) => {
        (value.authority_summary as unknown as Record<string, unknown>).is_evidence =
          true;
      },
    },
    {
      name: "fingerprint",
      expected_code: "strategy_composition_identity_fingerprint_invalid",
      mutate: (value) => {
        value.integrity.fingerprint = `sha256:${"e".repeat(64)}`;
      },
    },
  ];
  for (const fixture of outputValidationCases) {
    const value = clone(development);
    fixture.mutate(value);
    if (fixture.resign) resignCase(value);
    assertBlockedCode(
      validateStrategyCompositionCaseV01(value),
      fixture.expected_code,
      fixture.name,
    );
  }

  const fingerprintMutations: Array<{
    name: string;
    mutate: (input: BuildStrategyCompositionCaseInputV01) => void;
  }> = [
    {
      name: "component",
      mutate: (input) => {
        input.components[0]!.summary =
          "A meaningful component definition change must alter identity.";
      },
    },
    {
      name: "source",
      mutate: (input) => {
        input.source_refs[0]!.source_fingerprint = `sha256:${"a".repeat(64)}`;
      },
    },
    {
      name: "cutoff",
      mutate: (input) => {
        input.case_binding.construction_cutoff = "2026-08-05T01:00:00.000Z";
      },
    },
    {
      name: "graph",
      mutate: (input) => {
        input.relations[0]!.relation_kind = "must_precede";
      },
    },
    {
      name: "role_binding",
      mutate: (input) => {
        input.role_bindings.find((binding) => binding.role === "planning")!.role =
          "decomposition";
      },
    },
  ];
  for (const fixture of fingerprintMutations) {
    const input = clone(strategyCompositionDevelopmentInputFixture);
    fixture.mutate(input);
    const changed = buildStrategyCompositionCaseV01(input);
    assert.notEqual(changed.case_id, development.case_id, fixture.name);
    assert.notEqual(
      changed.integrity.fingerprint,
      development.integrity.fingerprint,
      fixture.name,
    );
  }

  for (const [key, value] of Object.entries(development.authority_summary)) {
    if (key !== "notes") assert.equal(value, false, key);
  }
  assert.equal(hasForbiddenScalarField(development), false);
  assert.equal("fitness" in development, false);
  assert.equal("quality" in development, false);
  assert.equal(development.scalar_fitness_created, false);

  return {
    suite: "strategy-composition-case-v0.1",
    status: "passed",
    positive_fixture_count: 5,
    negative_fixture_count:
      invalidStrategyCompositionCaseFixtureCasesV01.length +
      outputValidationCases.length +
      2,
    deterministic_case_id: development.case_id,
    deterministic_fingerprint: development.integrity.fingerprint,
    canonical_set_ordering_checked: true,
    meaningful_fingerprint_changes_checked: fingerprintMutations.length,
    input_immutability_checked: true,
    role_binding_separation_checked: true,
    holdout_cutoff_and_recombination_checked: true,
    one_target_ablation_checked: true,
    ablation_causality_not_claimed: true,
    negative_transfer_general_harm_not_claimed: true,
    strategic_transfer_provenance_not_promoted: true,
    authority_all_false_checked: true,
    scalar_fitness_absent_checked: true,
  };
}

function resignCase(value: StrategyCompositionCaseV01): void {
  value.case_id = deriveStrategyCompositionCaseIdV01(value);
  value.integrity.fingerprint = createStrategyCompositionCaseFingerprintV01(value);
}

function assertBlockedCode(
  result: ReturnType<typeof validateStrategyCompositionCaseV01>,
  expectedCode: string,
  name: string,
): void {
  assert.equal(result.status, "blocked", name);
  assert.ok(
    result.errors.some((error) => error.code === expectedCode),
    `${name}: ${JSON.stringify(result)}`,
  );
}

function hasForbiddenScalarField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenScalarField);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => {
    const normalized = key.trim().replace(/[\s-]+/gu, "_").toLowerCase();
    if (
      normalized !== "scalar_fitness_created" &&
      /(?:^|_)(fitness|quality|score|ranking|rating|pareto|weighted_sum)(?:_|$)/u.test(
        normalized,
      )
    ) {
      return true;
    }
    return hasForbiddenScalarField(child);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
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
