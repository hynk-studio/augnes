#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildOperationalReentryFixtureFamilyV01,
  buildOperationalReentryPerturbationFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import {
  ACGC_E1_EXACT_SOURCE_FINGERPRINT_V01,
  ACGC_E1_EXACT_SOURCE_ID_V01,
  ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_FINGERPRINT_V01,
  ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_ID_V01,
  ACGC_E1_TARGET_ENTRY_ID_V01,
  buildOperationalReentryArmV01,
  buildOperationalReentryEvaluationV01,
  buildOperationalReentrySourceV01,
  validateOperationalReentryArmV01,
  validateOperationalReentryEvaluationV01,
  validateOperationalReentrySourceV01,
  type BuildOperationalReentryArmInputV01,
  type BuildOperationalReentrySourceInputV01,
} from "@/lib/vnext/operational-reentry-perturbation";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { renderOperationalReentryPerturbationReportV01 } from "@/scripts/operational-reentry-perturbation-report";
import type {
  OperationalReentryArmV01,
  OperationalReentryEvaluationV01,
  OperationalReentrySourceV01,
} from "@/types/vnext/operational-reentry-perturbation";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}

export function runOperationalReentryPerturbationConformanceV01() {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("ACGC-E1 deterministic fixtures must not call fetch");
  }) as typeof fetch;
  try {
    const family = buildOperationalReentryFixtureFamilyV01();
    const deciding = family.deciding_positive_reset;

    assertExactSourceV01(deciding.source);
    assertFourArmFamilyV01(deciding.evaluation);
    assertPositiveSemanticsV01(family);
    assertDeterminismAndCanonicalizationV01(deciding.evaluation);
    assertReportsV01(deciding.evaluation);
    const negativeRefusalCaseCount = assertRefusalMatrixV01(deciding.evaluation);
    assertZeroEffectsV01(deciding.evaluation);

    assert.equal(fetchCalls, 0);
    return {
      suite: "operational-reentry-perturbation-v0.1",
      status: "passed",
      evaluation_id: deciding.evaluation.evaluation_id,
      evaluation_fingerprint: deciding.evaluation.integrity.fingerprint,
      source_id: deciding.source.source_id,
      source_fingerprint: deciding.source.integrity.fingerprint,
      conditioning_relation: deciding.evaluation.conditioning_relation,
      reset_relation: deciding.evaluation.reset_relation,
      positive_fixture_count: 12,
      negative_refusal_case_count: negativeRefusalCaseCount,
      real_provider_calls: 0,
      model_calls: 0,
      network_calls: 0,
      database_writes: 0,
      product_state_mutations: 0,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function main(): void {
  console.log(JSON.stringify(runOperationalReentryPerturbationConformanceV01()));
}

function assertExactSourceV01(source: OperationalReentrySourceV01): void {
  assert.equal(validateOperationalReentrySourceV01(source).status, "valid");
  assert.equal(source.source_id, ACGC_E1_EXACT_SOURCE_ID_V01);
  assert.equal(
    source.integrity.fingerprint,
    ACGC_E1_EXACT_SOURCE_FINGERPRINT_V01,
  );
  assert.equal(
    source.parent_comparison_source_case.record_id,
    ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_ID_V01,
  );
  assert.equal(
    source.parent_comparison_source_case.record_fingerprint,
    ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_FINGERPRINT_V01,
  );
  assert.equal(source.selected_target_count, 1);
  assert.equal(source.target.packet_entry_id, ACGC_E1_TARGET_ENTRY_ID_V01);
  assert.equal(source.target_disposition, "selected_effective_accept");
  assert.equal(source.target_is_bundle, false);
  assert.equal(source.target_budget_excluded, false);
  assert.equal(source.target_unresolved, false);
  assert.equal(source.target.attribution_row.presentation, "yes");
  assert.equal(source.target.attribution_row.citation_or_reference, "referenced");
  assert.equal(source.target.attribution_row.actual_use, "unknown");
  assert.equal(source.target.attribution_row.support_validation, "unknown");
  assert.equal(source.target.attribution_row.outcome_association, "unknown");
  assert.equal(source.target.attribution_row.causal_contribution, "unknown");
  assert.equal(source.stage5_truth.item_actual_use_proven_count, 0);
  assert.equal(source.stage5_truth.support_validated_count, 0);
  assert.equal(source.stage5_truth.outcome_associated_count, 0);
  assert.equal(source.stage5_truth.causally_supported_count, 0);
  assert.equal(source.stage5_truth.exact_case_status, "inconclusive");
  assert.equal(source.stage5_truth.bundle_credit_assigned, false);
  assert.equal(source.baseline.run_count, 1);
  assert.equal(source.baseline.operational_continuation_present, false);
  assert.equal(source.baseline.packet_b_present, false);
  assert.equal(source.baseline.continuation_admission_present, false);
  assert.equal(source.baseline.post_cutoff_candidate_material_present, false);
}

function assertFourArmFamilyV01(evaluation: OperationalReentryEvaluationV01): void {
  assert.equal(validateOperationalReentryEvaluationV01(evaluation).status, "valid");
  assert.deepEqual(
    evaluation.arms.map((arm) => arm.role),
    [
      "exact_reentry",
      "matched_single_item_ablation",
      "stale_or_regime_shift_reset",
      "existing_one_run_baseline",
    ],
  );
  const exact = armV01(evaluation, "exact_reentry");
  const ablation = armV01(evaluation, "matched_single_item_ablation");
  const stale = armV01(evaluation, "stale_or_regime_shift_reset");
  const baseline = armV01(evaluation, "existing_one_run_baseline");
  assert.deepEqual(exact.target_entry_ids, [ACGC_E1_TARGET_ENTRY_ID_V01]);
  assert.deepEqual(ablation.target_entry_ids, []);
  assert.ok(!ablation.packet_entry_ids.includes(ACGC_E1_TARGET_ENTRY_ID_V01));
  assert.ok(
    !ablation.downstream.referenced_source_ids.includes(
      ACGC_E1_TARGET_ENTRY_ID_V01,
    ),
  );
  assert.deepEqual(baseline.target_entry_ids, []);
  assert.deepEqual(baseline.packet_entry_ids, []);
  assert.equal(baseline.target_lineage, null);
  assert.equal(stale.stale_relation?.target_entry_id, ACGC_E1_TARGET_ENTRY_ID_V01);
  assert.equal(evaluation.exact_reentry_ablation_parity.length, 19);
  assert.ok(
    evaluation.exact_reentry_ablation_parity.every(
      (row) => row.status === "equal",
    ),
  );
  assert.deepEqual(evaluation.single_target_intervention.removed_entry_ids, [
    ACGC_E1_TARGET_ENTRY_ID_V01,
  ]);
  assert.deepEqual(evaluation.single_target_intervention.introduced_entry_ids, []);
  assert.equal(
    evaluation.single_target_intervention.only_intended_difference_is_target_presence,
    true,
  );
  assert.equal(
    evaluation.source.repository.equal_budget_is_equal_capability,
    false,
  );
  assert.equal(
    evaluation.stale_regime_relation.matched_arm_role,
    "matched_single_item_ablation",
  );
  assert.equal(evaluation.stale_regime_relation.input_parity.length, 19);
  assert.equal(
    evaluation.stale_regime_relation.non_stale_regime_inputs_equal,
    true,
  );
  assert.ok(
    evaluation.stale_regime_relation.input_parity.every(
      (row) => row.status === "equal",
    ),
  );
}

function assertPositiveSemanticsV01(
  family: ReturnType<typeof buildOperationalReentryFixtureFamilyV01>,
): void {
  assert.equal(
    family.deciding_positive_reset.evaluation.conditioning_relation,
    "structured_delta_observed",
  );
  assert.equal(
    family.deciding_positive_reset.evaluation.reset_relation,
    "appropriate_reset_observed",
  );
  assert.equal(
    family.reference_only.evaluation.conditioning_relation,
    "reference_only",
  );
  assert.equal(
    family.no_structured_delta.evaluation.conditioning_relation,
    "no_structured_delta_observed",
  );
  assert.equal(family.unknown_conditioning.evaluation.conditioning_relation, "unknown");
  assert.equal(
    family.sticky_stale.evaluation.reset_relation,
    "stale_persistence_candidate",
  );
  assert.equal(
    family.sticky_stale.evaluation.stale_regime_relation.matched_arm_role,
    "exact_reentry",
  );
  assert.equal(
    family.sticky_stale.evaluation.stale_regime_relation.non_stale_regime_inputs_equal,
    true,
  );
  assert.equal(family.unknown_reset.evaluation.reset_relation, "unknown");
  for (const fixture of Object.values(family)) {
    assert.equal(validateOperationalReentryEvaluationV01(fixture.evaluation).status, "valid");
    assert.equal(fixture.evaluation.evidence_ladder.support_validation, "unknown");
    assert.equal(fixture.evaluation.evidence_ladder.outcome_association, "unknown");
    assert.equal(fixture.evaluation.evidence_ladder.causal_contribution, "unknown");
    assert.equal(fixture.evaluation.real_provider_or_model_evidence, false);
    assert.equal(fixture.evaluation.empirical_general_benefit_observed, false);
    assert.equal(fixture.evaluation.no_bundle_credit_or_blame, true);
  }
}

function assertDeterminismAndCanonicalizationV01(
  evaluation: OperationalReentryEvaluationV01,
): void {
  const replay = buildOperationalReentryPerturbationFixtureV01().evaluation;
  assert.deepEqual(replay, evaluation);

  const exact = armV01(evaluation, "exact_reentry");
  const reversedInput = armInputV01(exact);
  reversedInput.packet_entry_ids.reverse();
  reversedInput.packet_entry_fingerprints.reverse();
  reversedInput.non_target_downstream_input_fingerprints.reverse();
  reversedInput.task.required_checks.reverse();
  reversedInput.repository.capability_coverage.reverse();
  reversedInput.downstream.referenced_source_ids.reverse();
  reversedInput.downstream.operation_action_classes.reverse();
  reversedInput.downstream.result_limitations.reverse();
  assert.deepEqual(buildOperationalReentryArmV01(reversedInput), exact);

  const frozenInput = deepFreeze(armInputV01(exact));
  const before = canonicalizeProtocolValueV01(frozenInput);
  buildOperationalReentryArmV01(frozenInput);
  assert.equal(canonicalizeProtocolValueV01(frozenInput), before);
}

function assertReportsV01(evaluation: OperationalReentryEvaluationV01): void {
  const jsonA = renderOperationalReentryPerturbationReportV01(evaluation, "json");
  const jsonB = renderOperationalReentryPerturbationReportV01(evaluation, "json");
  const markdownA = renderOperationalReentryPerturbationReportV01(
    evaluation,
    "markdown",
  );
  const markdownB = renderOperationalReentryPerturbationReportV01(
    evaluation,
    "markdown",
  );
  assert.equal(jsonA, jsonB);
  assert.equal(markdownA, markdownB);
  const parsed = JSON.parse(jsonA);
  assert.equal(parsed.conditioning.relation, "structured_delta_observed");
  assert.equal(parsed.conditioning.is_support_validation, false);
  assert.equal(parsed.conditioning.is_outcome_benefit, false);
  assert.equal(parsed.conditioning.is_causal_contribution, false);
  assert.equal(parsed.exact_reference_relation.reference_is_actual_use, false);
  assert.equal(parsed.reset.relation, "appropriate_reset_observed");
  assert.equal(parsed.reset.matched_arm_role, "matched_single_item_ablation");
  assert.equal(parsed.reset.non_stale_regime_inputs_equal, true);
  assert.equal(parsed.reset.input_parity.length, 19);
  assert.equal(parsed.reset.activates_reset_or_fallback, false);
  assert.match(markdownA, /mechanics only/u);
  assert.match(markdownA, /Reference-only is not actual use/u);
  assert.match(markdownA, /not support validation, outcome benefit, causal contribution/u);
  assert.match(markdownA, /sticky-stale result is a candidate mechanics observation/u);
  assert.match(markdownA, /Neutral current-source reselection is outside E1 v0\.1/u);
  assert.match(markdownA, /neither continuation benefit nor Stage 7 fitness/u);
  assert.ok(Buffer.byteLength(jsonA) < 2 * 1024 * 1024);
  assert.ok(Buffer.byteLength(markdownA) < 128 * 1024);
}

function assertRefusalMatrixV01(evaluation: OperationalReentryEvaluationV01): number {
  const source = evaluation.source;
  const cases: Array<[string, () => void]> = [];

  cases.push(
    ["target not selected", () => sourceMutationBlockedV01(source, (value) => {
      value.target_disposition = "rejected" as "selected_effective_accept";
    })],
    ["multiple targets", () => sourceMutationBlockedV01(source, (value) => {
      value.selected_target_count = 2 as 1;
    })],
    ["bundle target", () => sourceMutationBlockedV01(source, (value) => {
      value.target_is_bundle = true as false;
    })],
    ["budget excluded target", () => sourceMutationBlockedV01(source, (value) => {
      value.target_budget_excluded = true as false;
    })],
    ["unresolved target", () => sourceMutationBlockedV01(source, (value) => {
      value.target_unresolved = true as false;
    })],
  );

  for (const [label, mutate] of [
    ["packet target mismatch", (value: OperationalReentrySourceV01) => {
      value.target.packet_entry_id = "operational-continuation:mismatch";
    }],
    ["selection target mismatch", (value: OperationalReentrySourceV01) => {
      value.target.selection.record_id = "operational-context-selection:mismatch";
    }],
    ["materialization target mismatch", (value: OperationalReentrySourceV01) => {
      value.target.materialization.record_id = "operational-continuation-materialization:mismatch";
    }],
    ["admission target mismatch", (value: OperationalReentrySourceV01) => {
      value.target.admission.record_id = "operational-continuation-admission:mismatch";
    }],
    ["attribution target mismatch", (value: OperationalReentrySourceV01) => {
      value.target.attribution_projection.record_id = "context-use-attribution:mismatch";
    }],
  ] as Array<[string, (value: OperationalReentrySourceV01) => void]>) {
    cases.push([label, () => sourceMutationBlockedV01(source, mutate)]);
  }

  cases.push(
    ["more than one ablated item", () => {
      const ablation = armInputV01(armV01(evaluation, "matched_single_item_ablation"));
      ablation.packet_entry_ids = ablation.packet_entry_ids.slice(1);
      ablation.packet_entry_fingerprints = ablation.packet_entry_fingerprints.slice(1);
      const result = rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(ablation));
      assert.equal(result.conditioning_relation, "not_comparable");
    }],
    ["non-target packet difference", () => {
      const ablation = armInputV01(armV01(evaluation, "matched_single_item_ablation"));
      ablation.packet_entry_ids = ["context:replacement", ...ablation.packet_entry_ids];
      ablation.packet_entry_fingerprints = [
        `sha256:${"a".repeat(64)}`,
        ...ablation.packet_entry_fingerprints,
      ];
      const result = rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(ablation));
      assert.equal(result.conditioning_relation, "not_comparable");
    }],
  );

  const parityMutations: Array<[
    string,
    (input: BuildOperationalReentryArmInputV01) => void,
  ]> = [
    ["task goal mismatch", (value) => { value.task.goal = "Different goal."; }],
    ["constraint mismatch", (value) => { value.task.required_checks = ["different-check"]; }],
    ["repository head mismatch", (value) => { value.repository.frozen_head_commit = "1".repeat(40); }],
    ["cutoff mismatch", (value) => { value.repository.observation_cutoff = "2026-07-18T15:59:00.000Z"; }],
    ["platform mismatch", (value) => { value.repository.platform = "other-platform"; }],
    ["adapter mismatch", (value) => { value.repository.deterministic_adapter_identity = "other-adapter.v0.1"; }],
    ["capability mismatch", (value) => { value.repository.capability_version = "other-capability.v0.1"; }],
    ["approval mismatch", (value) => { value.repository.operation_approval_policy_fingerprint = `sha256:${"b".repeat(64)}`; }],
    ["verification mismatch", (value) => { value.repository.verification_owner_set_fingerprint = `sha256:${"c".repeat(64)}`; }],
    ["equal ceiling mismatch", (value) => { value.repository.equal_ceiling_fingerprint = `sha256:${"d".repeat(64)}`; }],
  ];
  for (const [label, mutate] of parityMutations) {
    cases.push([label, () => {
      const input = armInputV01(armV01(evaluation, "matched_single_item_ablation"));
      mutate(input);
      const result = rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(input));
      assert.equal(result.conditioning_relation, "not_comparable");
    }]);
  }

  const resetParityMutations: Array<[
    string,
    (input: BuildOperationalReentryArmInputV01) => void,
  ]> = [
    ["reset task drift", (value) => { value.task.goal = "Different reset task."; }],
    ["reset repository drift", (value) => {
      value.repository.frozen_head_commit = "2".repeat(40);
    }],
    ["reset cutoff drift", (value) => {
      value.repository.observation_cutoff = "2026-07-18T17:59:00.000Z";
    }],
    ["reset capability drift", (value) => {
      value.repository.capability_version = "other-reset-capability.v0.1";
    }],
    ["reset non-target-input drift", (value) => {
      value.non_target_downstream_input_fingerprints = [
        `sha256:${"e".repeat(64)}`,
      ];
    }],
  ];
  for (const [label, mutate] of resetParityMutations) {
    cases.push([label, () => {
      const input = armInputV01(armV01(evaluation, "stale_or_regime_shift_reset"));
      mutate(input);
      const result = rebuildWithArmV01(
        evaluation,
        buildOperationalReentryArmV01(input),
      );
      assert.equal(result.reset_relation, "not_comparable");
      assert.equal(
        result.stale_regime_relation.non_stale_regime_inputs_equal,
        false,
      );
      assert.ok(
        result.stale_regime_relation.input_parity.some(
          (row) => row.status === "not_comparable",
        ),
      );
    }]);
  }

  cases.push(
    ["target reference survives ablation", () => {
      const input = armInputV01(armV01(evaluation, "matched_single_item_ablation"));
      input.downstream.referenced_source_ids = [ACGC_E1_TARGET_ENTRY_ID_V01];
      assert.throws(
        () => rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(input)),
        /operational_reentry_ablation_target_survived/u,
      );
    }],
    ["unrelated reference-set difference", () => {
      const referenceOnly = buildOperationalReentryPerturbationFixtureV01({
        conditioning: "reference_only",
      }).evaluation;
      const input = armInputV01(armV01(referenceOnly, "exact_reentry"));
      input.downstream.referenced_source_ids.push("context:unrelated-reference");
      const result = rebuildWithArmV01(
        referenceOnly,
        buildOperationalReentryArmV01(input),
      );
      assert.equal(result.conditioning_relation, "not_comparable");
    }],
    ["post-cutoff material", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.arms[0]!.post_cutoff_material_present = true as false;
    })],
    ["missing stale reason", () => {
      const input = armInputV01(armV01(evaluation, "stale_or_regime_shift_reset"));
      input.stale_relation = null;
      const result = rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(input));
      assert.equal(result.reset_relation, "not_comparable");
    }],
    ["post-cutoff stale reason", () => {
      const input = armInputV01(armV01(evaluation, "stale_or_regime_shift_reset"));
      input.stale_relation!.reason_observed_at = "2026-07-18T18:01:00.000Z";
      const result = rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(input));
      assert.equal(result.reset_relation, "not_comparable");
    }],
    ["unrelated stale reason", () => {
      const input = armInputV01(armV01(evaluation, "stale_or_regime_shift_reset"));
      input.stale_relation!.target_entry_id = "operational-continuation:unrelated";
      assert.throws(
        () => rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(input)),
        /operational_reentry_stale_reason_unrelated/u,
      );
    }],
    ["neutral current-source reselection removed", () => {
      const input = armInputV01(armV01(evaluation, "stale_or_regime_shift_reset"));
      input.downstream.response_status =
        "neutral_current_source_selected" as typeof input.downstream.response_status;
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_response_status_invalid/u,
      );
    }],
    ["unbound current-source field removed", () => {
      const input = armInputV01(armV01(evaluation, "stale_or_regime_shift_reset"));
      const relation = input.stale_relation as NonNullable<
        typeof input.stale_relation
      > & { current_source_ref?: string };
      relation.current_source_ref = "arbitrary-unbound-current-source";
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_arm_unknown_field/u,
      );
    }],
    ["conditioning overclaim from reference", () => {
      const referenceOnly = buildOperationalReentryPerturbationFixtureV01({
        conditioning: "reference_only",
      }).evaluation;
      evaluationMutationBlockedV01(referenceOnly, (value) => {
        value.conditioning_relation = "structured_delta_observed";
      });
    }],
    ["actual use overclaim", () => sourceMutationBlockedV01(source, (value) => {
      value.target.attribution_row.actual_use = "yes" as "unknown";
    })],
    ["support overclaim", () => sourceMutationBlockedV01(source, (value) => {
      value.target.attribution_row.support_validation = "supported" as "unknown";
    })],
    ["outcome overclaim", () => sourceMutationBlockedV01(source, (value) => {
      value.target.attribution_row.outcome_association = "associated" as "unknown";
    })],
    ["causal overclaim", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.evidence_ladder.causal_contribution = "supported" as "unknown";
    })],
    ["reset authority", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.authority_summary.activates_reset_or_fallback = true as false;
    })],
    ["packet mutation authority", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.authority_summary.mutates_task_context_packet = true as false;
    })],
    ["policy activation", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.authority_summary.is_policy = true as false;
    })],
    ["scalar fitness", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.authority_summary.creates_scalar_fitness = true as false;
    })],
    ["global winner", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.authority_summary.creates_global_winner = true as false;
    })],
    ["promotion", () => evaluationMutationBlockedV01(evaluation, (value) => {
      value.authority_summary.promotes_target_or_policy = true as false;
    })],
    ["cross-workspace source", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry"));
      input.workspace_id = "workspace:cross-scope";
      assert.throws(
        () => rebuildWithArmV01(evaluation, buildOperationalReentryArmV01(input)),
        /operational_reentry_target_lineage_mismatch/u,
      );
    }],
    ["malformed identity", () => sourceMutationBlockedV01(source, (value) => {
      value.parent_comparison_source_case.record_fingerprint = "not-a-fingerprint";
    })],
    ["resealed changed source", () => {
      const input = sourceInputV01(source);
      input.task.goal = "Conflicting resealed source goal.";
      assert.throws(
        () => buildOperationalReentrySourceV01(input),
        /operational_reentry_stage5_source_identity_mismatch/u,
      );
    }],
    ["secret material", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry"));
      input.downstream.result_limitations = [
        `${"OPENAI_"}API_KEY=redacted-synthetic-value`,
      ];
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /secret_shaped_material/u,
      );
    }],
    ["private path", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry"));
      input.downstream.result_limitations = [
        `read ${["", "Users", "example", "private.txt"].join("/")}`,
      ];
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_private_path_refused/u,
      );
    }],
    ["unknown field", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry")) as
        BuildOperationalReentryArmInputV01 & { experiment_score?: number };
      input.experiment_score = 1;
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_arm_unknown_field/u,
      );
    }],
    ["nested unknown field", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry")) as
        BuildOperationalReentryArmInputV01 & {
          downstream: BuildOperationalReentryArmInputV01["downstream"] & {
            confidence_score?: number;
          };
        };
      input.downstream.confidence_score = 1;
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_downstream_unknown_field/u,
      );
    }],
    ["live provider evidence class", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry"));
      input.evidence_class = "observed_live_provider" as typeof input.evidence_class;
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_live_provider_evidence_refused/u,
      );
    }],
    ["collection bound", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry"));
      input.downstream.result_limitations = Array.from(
        { length: 129 },
        (_, index) => `bounded-${index}`,
      );
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_collection_bound_exceeded/u,
      );
    }],
    ["text bound", () => {
      const input = armInputV01(armV01(evaluation, "exact_reentry"));
      input.downstream.result_limitations = ["x".repeat(2001)];
      assert.throws(
        () => buildOperationalReentryArmV01(input),
        /operational_reentry_text_bound_exceeded/u,
      );
    }],
  );

  for (const [label, test] of cases) {
    assert.doesNotThrow(test, label);
  }
  assert.ok(cases.length >= 24);
  return cases.length;
}

function assertZeroEffectsV01(evaluation: OperationalReentryEvaluationV01): void {
  for (const arm of evaluation.arms) {
    assert.equal(validateOperationalReentryArmV01(arm).status, "valid");
    assert.equal(arm.provider_calls, 0);
    assert.equal(arm.model_calls, 0);
    assert.equal(arm.network_calls, 0);
    assert.equal(arm.product_admission_used, false);
    assert.equal(arm.product_state_mutated, false);
    assert.equal(arm.post_cutoff_material_present, false);
  }
  for (const value of Object.values(evaluation.authority_summary)) {
    assert.equal(value, false);
  }
}

function rebuildWithArmV01(
  evaluation: OperationalReentryEvaluationV01,
  replacement: OperationalReentryArmV01,
): OperationalReentryEvaluationV01 {
  return buildOperationalReentryEvaluationV01({
    source: evaluation.source,
    arms: evaluation.arms.map((arm) =>
      arm.role === replacement.role ? replacement : arm,
    ),
    limitations: evaluation.limitations,
    missing_evidence: evaluation.missing_evidence,
  });
}

function sourceMutationBlockedV01(
  source: OperationalReentrySourceV01,
  mutate: (value: OperationalReentrySourceV01) => void,
): void {
  const changed = clone(source);
  mutate(changed);
  assert.equal(validateOperationalReentrySourceV01(changed).status, "blocked");
}

function evaluationMutationBlockedV01(
  evaluation: OperationalReentryEvaluationV01,
  mutate: (value: OperationalReentryEvaluationV01) => void,
): void {
  const changed = clone(evaluation);
  mutate(changed);
  assert.equal(validateOperationalReentryEvaluationV01(changed).status, "blocked");
}

function sourceInputV01(
  source: OperationalReentrySourceV01,
): BuildOperationalReentrySourceInputV01 {
  const {
    source_version: _version,
    source_id: _id,
    source_kind: _kind,
    data_is_synthetic_public_safe: _publicSafe,
    material_boundary: _boundary,
    integrity: _integrity,
    ...input
  } = clone(source);
  return input;
}

function armInputV01(
  arm: OperationalReentryArmV01,
): BuildOperationalReentryArmInputV01 {
  const {
    arm_version: _version,
    arm_id: _id,
    post_cutoff_material_present: _postCutoff,
    provider_calls: _provider,
    model_calls: _model,
    network_calls: _network,
    product_admission_used: _admission,
    product_state_mutated: _state,
    integrity: _integrity,
    ...input
  } = clone(arm);
  return input;
}

function armV01(
  evaluation: OperationalReentryEvaluationV01,
  role: OperationalReentryArmV01["role"],
): OperationalReentryArmV01 {
  const arm = evaluation.arms.find((candidate) => candidate.role === role);
  assert(arm, `missing ${role}`);
  return arm;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
