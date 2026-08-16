#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildDeterministicModelHostSuccessionBenchmarkFixtureV01,
  buildModelHostSuccessionRouteProfilesFixtureV01,
  buildUnavailableModelHostSuccessionBenchmarkFixtureV01,
} from "@/fixtures/vnext/research/model-host-succession-benchmark-v0-1";
import {
  ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01,
  buildModelHostSuccessionArmResultV01,
  buildModelHostSuccessionBenchmarkV01,
  buildModelHostSuccessionFallbackPlanV01,
  buildModelHostSuccessionFrozenCaseV01,
  buildModelHostSuccessionRouteProfileV01,
  deriveModelHostSuccessionPairwiseRouteDeltasV01,
  modelHostSuccessionFallbackArmRefV01,
  routeProfileRefV01,
  validateModelHostSuccessionArmResultV01,
  validateModelHostSuccessionBenchmarkV01,
  validateModelHostSuccessionFallbackPlanV01,
  validateModelHostSuccessionFrozenCaseV01,
  validateModelHostSuccessionRouteProfileV01,
} from "@/lib/vnext/model-host-succession-benchmark";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { renderModelHostSuccessionBenchmarkReportV01 } from "@/scripts/model-host-succession-benchmark-report";
import {
  MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01,
  type ModelHostSuccessionArmResultV01,
  type ModelHostSuccessionBenchmarkV01,
  type ModelHostSuccessionPairwiseDeltaV01,
  type ModelHostSuccessionFallbackPlanV01,
  type ModelHostSuccessionFrozenCaseV01,
  type ModelHostSuccessionRouteProfileV01,
} from "@/types/vnext/model-host-succession-benchmark";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const fixture = await buildDeterministicModelHostSuccessionBenchmarkFixtureV01();
  const benchmark = fixture.benchmark;

  assert.equal(validateModelHostSuccessionBenchmarkV01(benchmark).status, "valid");
  assertSourceBindingV01(benchmark);
  assertRouteMatrixV01(benchmark);
  assertCapabilityNarrowingV01(benchmark);
  assertContinuationTraceV01(benchmark);
  assertFallbackV01(benchmark);
  assertBenchmarkSemanticsV01(benchmark);
  assertUnavailableArmSemanticsV01(benchmark);
  assertZeroUnauthorizedEffectsV01(benchmark, fixture);
  assertReportV01(benchmark);

  console.log(
    JSON.stringify({
      suite: "model-host-succession-benchmark",
      status: "passed",
      benchmark_id: benchmark.benchmark_id,
      benchmark_fingerprint: benchmark.integrity.fingerprint,
      frozen_case_id: benchmark.frozen_case.frozen_case_id,
      summary: benchmark.summary,
      route_roles: benchmark.route_profiles.map((profile) => profile.route_role),
      real_provider_calls: fixture.real_provider_calls,
      network_calls: benchmark.authority_summary.network_calls,
      github_calls: benchmark.authority_summary.github_calls,
      cleanup_verified: fixture.cleanup_verified,
    }),
  );
}

function assertSourceBindingV01(benchmark: ModelHostSuccessionBenchmarkV01): void {
  const frozen = benchmark.frozen_case;
  assert.equal(validateModelHostSuccessionFrozenCaseV01(frozen).status, "valid");
  assert.equal(
    frozen.merged_stage5_baseline_commit,
    ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01,
  );
  assert.equal(frozen.constraints.data_classification, "public_safe");
  assert.equal(frozen.data_is_synthetic_public_safe, true);
  assert.equal(frozen.continuation_hop, 1);
  assert.equal(frozen.second_continuation_hop_present, false);
  assert.deepEqual(
    frozen.operational_context_selection.selected_rows,
    [frozen.selected_operational_entry],
  );
  assert.equal(
    frozen.continuation_admission.lineage.packet_b.packet_id,
    frozen.packet_b.packet_id,
  );
  assert.equal(
    frozen.continuation_admission.lineage.packet_b.packet_fingerprint,
    frozen.packet_b.integrity.fingerprint,
  );
  assert.equal(frozen.stage5_truth.exact_case_result, "inconclusive");
  assert.equal(
    frozen.stage5_truth.structural_coordination_favored,
    "one_run_baseline",
  );
  assert.equal(
    frozen.stage5_truth.complete_path_review_burden_favored,
    "one_run_baseline",
  );
  assert.equal(frozen.stage5_truth.general_benefit_established, false);
  assert.equal(frozen.stage5_truth.general_failure_established, false);
  assert.equal(
    frozen.stage5_truth.packet_b_harmful_transfer_established,
    false,
  );
  assert.equal(frozen.stage5_truth.policy_fitness_established, false);

  const replay = buildModelHostSuccessionFrozenCaseV01(
    frozenBuilderInputV01(frozen),
  );
  assert.deepEqual(replay, frozen);

  const changedHead = buildModelHostSuccessionFrozenCaseV01({
    ...frozenBuilderInputV01(frozen),
    frozen_head_commit: "1".repeat(40),
  });
  assert.notEqual(changedHead.frozen_case_id, frozen.frozen_case_id);
  assert.notEqual(
    changedHead.integrity.fingerprint,
    frozen.integrity.fingerprint,
  );

  const taskMismatch = cloneV01(frozen);
  taskMismatch.task.goal = "A mismatched goal.";
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(taskMismatch),
    "task mismatch",
  );
  const constraintMismatch = cloneV01(frozen);
  constraintMismatch.constraints.required_checks = ["mismatched-check"];
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(constraintMismatch),
    "constraint mismatch",
  );
  const packetMismatch = cloneV01(frozen);
  packetMismatch.packet_b.packet_id = `${packetMismatch.packet_b.packet_id}:mismatch`;
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(packetMismatch),
    "Packet B mismatch",
  );
  const selectionMismatch = cloneV01(frozen);
  selectionMismatch.operational_context_selection.selection_id =
    `${selectionMismatch.operational_context_selection.selection_id}:mismatch`;
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(selectionMismatch),
    "selection mismatch",
  );
  const materializationMismatch = cloneV01(frozen);
  materializationMismatch.acgc5a_materialization_identity.materialization_id =
    `${materializationMismatch.acgc5a_materialization_identity.materialization_id}:mismatch`;
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(materializationMismatch),
    "materialization mismatch",
  );
  const admissionMismatch = cloneV01(frozen);
  admissionMismatch.continuation_admission.lineage.continuation_hop = 2 as 1;
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(admissionMismatch),
    "admission or second-hop mismatch",
  );
  const frozenHeadMismatch = cloneV01(frozen);
  frozenHeadMismatch.repository_state.frozen_head_commit = "2".repeat(40);
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(frozenHeadMismatch),
    "frozen HEAD mismatch",
  );
  const contentMismatch = cloneV01(frozen);
  contentMismatch.repository_state.frozen_worktree_content_fingerprint =
    `sha256:${"3".repeat(64)}`;
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(contentMismatch),
    "frozen content mismatch",
  );
  const comparisonMismatch = cloneV01(frozen);
  comparisonMismatch.merged_stage5_comparison_binding.source_case_id =
    "operational-continuation-source-case:conflicting-reseal";
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(comparisonMismatch),
    "rebuilt Stage 5 source-case binding mismatch",
  );
  assert.throws(
    () =>
      buildModelHostSuccessionFrozenCaseV01({
        ...frozenBuilderInputV01(frozen),
        construction_cutoff: "2026-07-18T14:59:00.000Z",
      }),
    /model_host_frozen_source_invalid|model_host_post_cutoff_material_refused/u,
  );
  const crossScope = cloneV01(frozen);
  crossScope.packet_b.project_id = "project:cross-scope-refused";
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(crossScope),
    "cross-scope source",
  );
  const privatePath = cloneV01(frozen) as ModelHostSuccessionFrozenCaseV01 & {
    debug_path?: string;
  };
  privatePath.debug_path = "/Users/example/private/material";
  assertBlockedCodeV01(
    validateModelHostSuccessionFrozenCaseV01(privatePath),
    "private_path_material_refused",
  );
  const secret = cloneV01(frozen) as ModelHostSuccessionFrozenCaseV01 & {
    credential?: string;
  };
  secret.credential = "sk-example-secret-shaped-material-123456789";
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(secret),
    "secret-shaped source",
  );
  const raw = cloneV01(frozen) as ModelHostSuccessionFrozenCaseV01 & {
    raw_prompt?: string;
  };
  raw.raw_prompt = "forbidden raw source";
  assertBlockedV01(
    validateModelHostSuccessionFrozenCaseV01(raw),
    "raw source material",
  );
}

function assertRouteMatrixV01(benchmark: ModelHostSuccessionBenchmarkV01): void {
  assert.deepEqual(
    benchmark.route_profiles.map((profile) => profile.route_role),
    [...MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01],
  );
  assert.equal(new Set(benchmark.route_profiles.map((profile) => profile.route_role)).size, 5);
  assert.equal(
    benchmark.route_profiles.every(
      (profile) =>
        validateModelHostSuccessionRouteProfileV01(profile).status === "valid",
    ),
    true,
  );
  const same = routeV01(benchmark, "same_model_cold_session_simulation");
  const constrained = routeV01(
    benchmark,
    "capability_constrained_simulation",
  );
  const alternate = routeV01(
    benchmark,
    "alternate_provider_host_contract_simulation",
  );
  const zero = routeV01(benchmark, "zero_model_fallback");
  const predecessor = routeV01(benchmark, "predecessor_route_replay");
  assert.deepEqual(same.provider_ref, predecessor.provider_ref);
  assert.deepEqual(same.model_ref, predecessor.model_ref);
  assert.deepEqual(same.host_ref, predecessor.host_ref);
  assert.equal(
    same.adapter_implementation_id,
    predecessor.adapter_implementation_id,
  );
  assert.equal(same.capability_version, predecessor.capability_version);
  assert.equal(
    constrained.supported_operation_classes.length <
      predecessor.supported_operation_classes.length,
    true,
  );
  assert.equal(
    constrained.supported_operation_classes.every((operation) =>
      predecessor.supported_operation_classes.includes(operation)),
    true,
  );
  assert.equal(
    predecessor.supported_operation_classes.every(
      (operation) =>
        constrained.supported_operation_classes.includes(operation) ||
        constrained.unsupported_operation_classes.includes(operation),
    ),
    true,
  );
  assert.notEqual(
    constrained.capability_version,
    predecessor.capability_version,
  );
  assert.notEqual(
    alternate.host_ref.external_id,
    predecessor.host_ref.external_id,
  );
  assert.notEqual(
    alternate.adapter_implementation_id,
    predecessor.adapter_implementation_id,
  );
  assert(alternate.provider_ref && alternate.model_ref);
  assert.equal(alternate.evidence_class, "simulated_route_contract");
  assert.equal(zero.provider_ref, null);
  assert.equal(zero.model_ref, null);
  assert.equal(zero.execution_profile, "deterministic_zero_model");
  assert.equal(zero.provider_egress_policy, "forbidden");

  for (const profile of benchmark.route_profiles) {
    assert.equal(profile.authority.automatic_selection_authorized, false);
    assert.equal(profile.authority.activation_authorized, false);
    assert.equal(profile.authority.policy_authorized, false);
    assert.equal(profile.authority.automatic_start_authorized, false);
    assert.equal(profile.authority.automatic_resume_authorized, false);
    assert.equal(profile.authority.automatic_fallback_authorized, false);
    assert.equal(profile.authority.automatic_rollback_authorized, false);
    const replay = buildModelHostSuccessionRouteProfileV01(
      routeBuilderInputV01(profile),
    );
    assert.deepEqual(replay, profile);
  }

  assert.throws(
    () =>
      buildModelHostSuccessionRouteProfileV01({
        ...routeBuilderInputV01(same),
        evidence_class: "observed_live_provider",
      }),
    /model_host_live_provider_evidence_refused/u,
  );
  assert.throws(
    () =>
      buildModelHostSuccessionRouteProfileV01({
        ...routeBuilderInputV01(same),
        evidence_class: "invalid_evidence_class" as never,
      }),
    /model_host_route_contract_invalid/u,
  );
  assert.throws(
    () =>
      buildModelHostSuccessionRouteProfileV01({
        ...routeBuilderInputV01(same),
        execution_profile: "invalid_execution_profile" as never,
      }),
    /model_host_route_contract_invalid/u,
  );
  const conflict = cloneV01(same);
  conflict.capability_version = "conflicting_reseal.v0.1";
  assertBlockedV01(
    validateModelHostSuccessionRouteProfileV01(conflict),
    "route conflicting reseal",
  );
  const changed = buildModelHostSuccessionRouteProfileV01({
    ...routeBuilderInputV01(same),
    adapter_implementation_version: "deterministic_codex_adapter.v0.1-test-change",
  });
  assert.notEqual(changed.route_profile_id, same.route_profile_id);
}

function assertCapabilityNarrowingV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): void {
  const constrained = armV01(
    benchmark,
    "capability_constrained_simulation",
  );
  assert.equal(constrained.contract_status, "fallback_required");
  assert.equal(constrained.execution_status, "blocked");
  assert.equal(constrained.fallback_required, true);
  assert.equal(constrained.fallback_used, false);
  assert.equal(constrained.direct_success_claimed, false);
  assert.equal(constrained.unsupported_operation_executed_count, 0);
  assert.equal(constrained.stronger_result_inherited, false);
  assert.equal(constrained.silent_fallback_used, false);
  assert.equal(
    constrained.unsupported_capability.includes("verify-portable-output"),
    true,
  );
  assert.equal(
    constrained.required_checks.skipped.includes("verify-portable-output"),
    true,
  );
  assert.equal(
    constrained.required_checks.passed.includes("verify-portable-output"),
    false,
  );
}

function assertContinuationTraceV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): void {
  for (const arm of benchmark.arm_results) {
    assert.equal(arm.continuation_trace.packet_b_exact_bytes_delivered, true);
    assert.equal(arm.continuation_trace.selected_entry_count, 1);
    assert.equal(arm.continuation_trace.selected_entry_delivered_count, 1);
    assert.equal(
      arm.continuation_trace.selected_entry_exact_receipt_referenced_count,
      1,
    );
    assert.equal(arm.continuation_trace.packet_level_actual_use_claim, "unknown");
    assert.equal(arm.continuation_trace.item_actual_use, "unknown");
    assert.equal(arm.continuation_trace.support_validation, "unknown");
    assert.equal(arm.continuation_trace.outcome_association, "unknown");
    assert.equal(arm.continuation_trace.causal_contribution, "unknown");
    assert.equal(arm.continuation_trace.excluded_candidate_credit_count, 0);
    assert.equal(arm.continuation_trace.bundle_credit_assigned, false);
    assert(arm.record_refs.run && arm.record_refs.run_receipt);
    assert(arm.record_refs.context_use_review);
    assert(arm.record_refs.context_use_attribution);
  }
}

function assertFallbackV01(benchmark: ModelHostSuccessionBenchmarkV01): void {
  const plan = benchmark.fallback_plan;
  assert.equal(validateModelHostSuccessionFallbackPlanV01(plan).status, "valid");
  const constrained = armV01(
    benchmark,
    "capability_constrained_simulation",
  );
  const replay = armV01(benchmark, "predecessor_route_replay");
  const predecessorProfile = routeV01(benchmark, "predecessor_route_replay");
  assert.equal(plan.failed_arm_ref.arm_id, constrained.arm_id);
  assert.equal(
    plan.failed_arm_ref.arm_fingerprint,
    constrained.integrity.fingerprint,
  );
  assert.equal(plan.failed_arm_ref.settled_status, "fallback_required");
  assert.deepEqual(
    plan.predecessor_route_ref,
    routeProfileRefV01(predecessorProfile),
  );
  assert.deepEqual(plan.predecessor_route_ref, replay.route_profile_ref);
  assert.equal(plan.frozen_case_ref.frozen_case_id, benchmark.frozen_case.frozen_case_id);
  assert.equal(plan.automatic_execution_authorized, false);
  assert.equal(plan.product_route_mutation_authorized, false);
  assert.equal(plan.policy_activation_authorized, false);
  assert.equal(plan.rollback_activation_authorized, false);
  assert.equal(
    replay.predecessor_replay_status,
    "explicit_fresh_replay_completed",
  );
  assert.equal(benchmark.fallback_relation.candidate_history_unchanged, true);
  assert.equal(
    benchmark.fallback_relation.cross_arm_contamination_detected,
    false,
  );
  assert.equal(benchmark.fallback_relation.automatic_execution_used, false);
  assert.equal(constrained.fallback_used, false);
  assert.equal(armV01(benchmark, "same_model_cold_session_simulation").fallback_used, false);
  assert.equal(armV01(benchmark, "alternate_provider_host_contract_simulation").fallback_used, false);
  assert.equal(armV01(benchmark, "zero_model_fallback").fallback_used, false);
  assert.equal(replay.fallback_used, true);
  assertNoIdentityOverlapV01(constrained, replay);

  const planReplay = buildModelHostSuccessionFallbackPlanV01(
    fallbackBuilderInputV01(plan),
  );
  assert.deepEqual(planReplay, plan);
  const meaningfulChange = buildModelHostSuccessionFallbackPlanV01({
    ...fallbackBuilderInputV01(plan),
    fallback_reason: `${plan.fallback_reason} Exact changed reason.`,
  });
  assert.notEqual(meaningfulChange.fallback_plan_id, plan.fallback_plan_id);
  const conflict = cloneV01(plan);
  conflict.fallback_reason = "Conflicting reseal without a new identity.";
  assertBlockedV01(
    validateModelHostSuccessionFallbackPlanV01(conflict),
    "fallback conflicting reseal",
  );

  const fabricatedPredecessor = buildModelHostSuccessionFallbackPlanV01({
    ...fallbackBuilderInputV01(plan),
    predecessor_route_ref: {
      ...plan.predecessor_route_ref,
      route_profile_id: "model-host-succession-route:fabricated",
      route_profile_fingerprint: `sha256:${"a".repeat(64)}`,
    },
  });
  assert.equal(
    validateModelHostSuccessionFallbackPlanV01(fabricatedPredecessor).status,
    "valid",
  );
  assert.throws(
    () => buildModelHostSuccessionBenchmarkV01({
      ...benchmarkBuilderInputV01(benchmark),
      fallback_plan: fabricatedPredecessor,
    }),
    /model_host_fallback_relation_invalid/u,
  );

  const zeroRoute = routeV01(benchmark, "zero_model_fallback");
  const substitutedBenchmarkRoute = buildModelHostSuccessionFallbackPlanV01({
    ...fallbackBuilderInputV01(plan),
    predecessor_route_ref: {
      ...routeProfileRefV01(zeroRoute),
      route_role: "predecessor_route_replay",
    },
  });
  assert.throws(
    () => buildModelHostSuccessionBenchmarkV01({
      ...benchmarkBuilderInputV01(benchmark),
      fallback_plan: substitutedBenchmarkRoute,
    }),
    /model_host_fallback_relation_invalid/u,
  );

  const wrongPredecessorFingerprint =
    buildModelHostSuccessionFallbackPlanV01({
      ...fallbackBuilderInputV01(plan),
      predecessor_route_ref: {
        ...plan.predecessor_route_ref,
        route_profile_fingerprint: `sha256:${"b".repeat(64)}`,
      },
    });
  assert.throws(
    () => buildModelHostSuccessionBenchmarkV01({
      ...benchmarkBuilderInputV01(benchmark),
      fallback_plan: wrongPredecessorFingerprint,
    }),
    /model_host_fallback_relation_invalid/u,
  );

  for (const settledStatus of [
    "failed",
    "unavailable",
    "not_executed",
    "contract_incompatible",
  ] as const) {
    const wrongSettledStatus = buildModelHostSuccessionFallbackPlanV01({
      ...fallbackBuilderInputV01(plan),
      failed_arm_ref: {
        arm_id: constrained.arm_id,
        arm_fingerprint: constrained.integrity.fingerprint,
        settled_status: settledStatus,
      },
    });
    assert.notEqual(wrongSettledStatus.fallback_plan_id, plan.fallback_plan_id);
    assert.throws(
      () => buildModelHostSuccessionBenchmarkV01({
        ...benchmarkBuilderInputV01(benchmark),
        fallback_plan: wrongSettledStatus,
      }),
      /model_host_fallback_relation_invalid/u,
    );
  }

  assert.throws(
    () => buildModelHostSuccessionBenchmarkV01({
      ...benchmarkBuilderInputV01(benchmark),
      fallback_relation: {
        ...benchmark.fallback_relation,
        predecessor_replay_arm_id: armV01(
          benchmark,
          "zero_model_fallback",
        ).arm_id,
      },
    }),
    /model_host_fallback_relation_invalid/u,
  );

  const identityReusingReplay = buildModelHostSuccessionArmResultV01({
    ...armBuilderInputV01(replay),
    fresh_identity_proof: {
      ...replay.fresh_identity_proof,
      project_scope_fingerprint:
        constrained.fresh_identity_proof.project_scope_fingerprint,
    },
  });
  assert.throws(
    () => buildModelHostSuccessionBenchmarkV01({
      ...benchmarkBuilderInputV01(benchmark),
      arm_results: benchmark.arm_results.map((arm) =>
        arm.route_profile_ref.route_role === "predecessor_route_replay"
          ? identityReusingReplay
          : arm),
      fallback_relation: {
        ...benchmark.fallback_relation,
        predecessor_replay_arm_id: identityReusingReplay.arm_id,
      },
    }),
    /model_host_cross_arm_identity_reuse_detected/u,
  );
}

function assertBenchmarkSemanticsV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): void {
  const replay = buildModelHostSuccessionBenchmarkV01({
    ...benchmarkBuilderInputV01(benchmark),
  });
  assert.deepEqual(replay, benchmark);
  assert.deepEqual(
    buildModelHostSuccessionBenchmarkV01({
      ...benchmarkBuilderInputV01(benchmark),
      route_profiles: [...benchmark.route_profiles].reverse(),
      arm_results: [...benchmark.arm_results].reverse(),
    }),
    benchmark,
  );
  assert.deepEqual(
    deriveModelHostSuccessionPairwiseRouteDeltasV01(
      [...benchmark.arm_results].reverse(),
    ),
    benchmark.pairwise_route_deltas,
  );
  assert.equal(benchmark.summary, "inconclusive");
  assert.equal(
    benchmark.pairwise_route_deltas.some(
      (row) => row.dimension === "model_quality" && row.relation === "unknown",
    ),
    true,
  );
  assert.equal(
    benchmark.pairwise_route_deltas.some((row) =>
      row.dimension === "capability_coverage" &&
      ["left_narrow_coverage", "right_narrow_coverage"].includes(row.relation)),
    true,
  );
  assert.equal(
    benchmark.pairwise_route_deltas.some(
      (row) =>
        row.dimension === "route_contract_status" &&
        row.relation === "tradeoff" &&
        (row.left_value === "fallback_required" ||
          row.right_value === "fallback_required"),
    ),
    true,
  );
  const alternate = armV01(
    benchmark,
    "alternate_provider_host_contract_simulation",
  );
  assert.equal(alternate.contract_status, "contract_compatible");
  assert.equal(alternate.evidence_class, "simulated_route_contract");
  assert.equal(alternate.resource_observations.provider_calls, 0);
  const zero = armV01(benchmark, "zero_model_fallback");
  assert.equal(zero.contract_status, "contract_compatible");
  assert.equal(zero.resource_observations.model_calls, 0);
  assert.equal(
    benchmark.missing_evidence.some((item) => /model quality/iu.test(item)),
    true,
  );
  const serialized = canonicalizeProtocolValueV01(benchmark);
  for (const forbidden of [
    "quality_score",
    "scalar_score",
    "route_winner",
    "provider_or_model_rank",
  ]) {
    assert.equal(
      serialized.includes(`\"${forbidden}\":true`),
      false,
      `${forbidden} must not be created`,
    );
  }
  assert.equal(benchmark.authority_summary.quality_score_created, false);
  assert.equal(benchmark.authority_summary.scalar_score_created, false);
  assert.equal(benchmark.authority_summary.provider_or_model_rank_created, false);
  assert.equal(benchmark.authority_summary.route_winner_created, false);
  assert.equal(benchmark.authority_summary.route_selected, false);
  assert.equal(benchmark.authority_summary.policy_fitness_claimed, false);
  assert.equal(benchmark.authority_summary.operational_policy_activated, false);
  assert.equal(benchmark.authority_summary.active_route_pointer_created, false);

  assertPairwiseResealRefusalsV01(benchmark);
  assertPairwiseSourceChangeV01(benchmark);
}

function assertPairwiseResealRefusalsV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): void {
  const routeStatusRow = benchmark.pairwise_route_deltas.find(
    (row) =>
      row.dimension === "route_contract_status" &&
      row.relation === "tradeoff",
  );
  const capabilityRow = benchmark.pairwise_route_deltas.find(
    (row) => row.dimension === "capability_coverage",
  );
  assert(routeStatusRow && capabilityRow);

  const changedStatusValue = cloneV01(benchmark);
  pairwiseRowV01(changedStatusValue, routeStatusRow).left_value = "unobserved";
  assertBlockedCodeV01(
    validateModelHostSuccessionBenchmarkV01(
      resealBenchmarkV01(changedStatusValue),
    ),
    "model_host_pairwise_source_binding_invalid",
  );

  const changedRelation = cloneV01(benchmark);
  pairwiseRowV01(changedRelation, routeStatusRow).relation = "equal";
  assertBlockedCodeV01(
    validateModelHostSuccessionBenchmarkV01(resealBenchmarkV01(changedRelation)),
    "model_host_pairwise_source_binding_invalid",
  );

  const changedCapabilityValue = cloneV01(benchmark);
  const capabilityValue = pairwiseRowV01(
    changedCapabilityValue,
    capabilityRow,
  ).left_value;
  assert(capabilityValue && typeof capabilityValue === "object");
  capabilityValue.supported_operation_class_count += 1;
  capabilityValue.explicit_operation_class_count += 1;
  assertBlockedCodeV01(
    validateModelHostSuccessionBenchmarkV01(
      resealBenchmarkV01(changedCapabilityValue),
    ),
    "model_host_pairwise_source_binding_invalid",
  );

  const changedBasis = cloneV01(benchmark);
  pairwiseRowV01(changedBasis, routeStatusRow).basis =
    "Caller-supplied contradictory route interpretation.";
  assertBlockedCodeV01(
    validateModelHostSuccessionBenchmarkV01(resealBenchmarkV01(changedBasis)),
    "model_host_pairwise_source_binding_invalid",
  );
}

function assertPairwiseSourceChangeV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): void {
  const alternate = armV01(
    benchmark,
    "alternate_provider_host_contract_simulation",
  );
  const stateChangedArm = buildModelHostSuccessionArmResultV01({
    ...armBuilderInputV01(alternate),
    contract_status: "unobserved",
  });
  const stateChangedBenchmark = buildModelHostSuccessionBenchmarkV01({
    ...benchmarkBuilderInputV01(benchmark),
    arm_results: benchmark.arm_results.map((arm) =>
      arm.route_profile_ref.route_role ===
        "alternate_provider_host_contract_simulation"
        ? stateChangedArm
        : arm),
  });
  assert.notDeepEqual(
    stateChangedBenchmark.pairwise_route_deltas,
    benchmark.pairwise_route_deltas,
  );
  assert.notEqual(stateChangedBenchmark.benchmark_id, benchmark.benchmark_id);

  const alternateProfile = routeV01(
    benchmark,
    "alternate_provider_host_contract_simulation",
  );
  const capabilityChangedProfile = buildModelHostSuccessionRouteProfileV01({
    ...routeBuilderInputV01(alternateProfile),
    capability_version: "alternate_contract_capability.narrow.v0.1",
    supported_operation_classes: ["validated_packet_delivery"],
    unsupported_operation_classes: [
      "provider_or_model_egress",
      "repository_command_execution",
      "return_bounded_structured_result",
      "verify-portable-output",
    ],
    capability_coverage: alternateProfile.capability_coverage.map((row) =>
      row.operation_class === "return_bounded_structured_result"
        ? { ...row, coverage: "unsupported" as const }
        : row),
  });
  const capabilityChangedArm = buildModelHostSuccessionArmResultV01({
    ...armBuilderInputV01(alternate),
    route_profile_ref: routeProfileRefV01(capabilityChangedProfile),
    supported_capability:
      capabilityChangedProfile.supported_operation_classes,
    unsupported_capability:
      capabilityChangedProfile.unsupported_operation_classes,
  });
  const capabilityChangedBenchmark = buildModelHostSuccessionBenchmarkV01({
    ...benchmarkBuilderInputV01(benchmark),
    route_profiles: benchmark.route_profiles.map((profile) =>
      profile.route_role === "alternate_provider_host_contract_simulation"
        ? capabilityChangedProfile
        : profile),
    arm_results: benchmark.arm_results.map((arm) =>
      arm.route_profile_ref.route_role ===
        "alternate_provider_host_contract_simulation"
        ? capabilityChangedArm
        : arm),
  });
  assert.notDeepEqual(
    capabilityChangedBenchmark.pairwise_route_deltas,
    benchmark.pairwise_route_deltas,
  );
  assert.notEqual(
    capabilityChangedBenchmark.benchmark_id,
    benchmark.benchmark_id,
  );
  assert.equal(
    capabilityChangedBenchmark.pairwise_route_deltas.every((row) =>
      row.dimension !== "model_quality" ||
      (row.relation === "unknown" &&
        row.left_value === null && row.right_value === null)),
    true,
  );
}

function assertUnavailableArmSemanticsV01(
  decidingBenchmark: ModelHostSuccessionBenchmarkV01,
): void {
  const unavailableBenchmark =
    buildUnavailableModelHostSuccessionBenchmarkFixtureV01(decidingBenchmark);
  assert.equal(
    validateModelHostSuccessionBenchmarkV01(unavailableBenchmark).status,
    "valid",
  );
  assert.equal(unavailableBenchmark.summary, "inconclusive");
  const candidate = armV01(
    unavailableBenchmark,
    "capability_constrained_simulation",
  );
  const replay = armV01(unavailableBenchmark, "predecessor_route_replay");
  assert.equal(candidate.contract_status, "unobserved");
  assert.equal(candidate.execution_status, "unavailable");
  assert.equal(candidate.verification_status, "not_run");
  assert.equal(candidate.fallback_required, true);
  assert.equal(candidate.fallback_used, false);
  assert.equal(candidate.direct_success_claimed, false);
  assert.equal(candidate.continuation_trace.packet_b_exact_bytes_delivered, false);
  assert.equal(candidate.continuation_trace.selected_entry_count, 1);
  assert.equal(candidate.continuation_trace.selected_entry_delivered_count, 0);
  assert.equal(
    candidate.continuation_trace.selected_entry_exact_receipt_referenced_count,
    0,
  );
  assert.equal(Object.values(candidate.record_refs).every((ref) => ref === null), true);
  assert.equal(
    Object.entries(candidate.fresh_identity_proof).every(([field, value]) =>
      [
        "project_scope_fingerprint",
        "database_scope_fingerprint",
        "repository_root_fingerprint",
        "prior_identity_reuse_count",
        "no_reuse_proven",
        "resume_used",
        "retry_used",
      ].includes(field) || value === null),
    true,
  );
  assert.equal(
    unavailableBenchmark.fallback_plan.failed_arm_ref.settled_status,
    "unavailable",
  );
  assert.deepEqual(
    unavailableBenchmark.fallback_plan.failed_arm_ref,
    modelHostSuccessionFallbackArmRefV01(candidate),
  );
  assert.deepEqual(
    unavailableBenchmark.fallback_plan.predecessor_route_ref,
    replay.route_profile_ref,
  );
  assert.equal(replay.fallback_used, true);
  assertNoIdentityOverlapV01(candidate, replay);
  assert.equal(
    unavailableBenchmark.pairwise_route_deltas.some((row) =>
      row.dimension === "route_contract_status" &&
      row.relation === "not_comparable" &&
      (row.left_route_role === "capability_constrained_simulation" ||
        row.right_route_role === "capability_constrained_simulation")),
    true,
  );
  assert.equal(
    unavailableBenchmark.pairwise_route_deltas.every((row) =>
      row.dimension !== "model_quality" ||
      (row.relation === "unknown" &&
        row.left_value === null && row.right_value === null)),
    true,
  );

  const notExecutedCandidate = buildModelHostSuccessionArmResultV01({
    ...armBuilderInputV01(candidate),
    execution_status: "not_executed",
  });
  assert.equal(
    validateModelHostSuccessionArmResultV01(notExecutedCandidate).status,
    "valid",
  );
  assert.equal(
    modelHostSuccessionFallbackArmRefV01(notExecutedCandidate).settled_status,
    "not_executed",
  );
  const notExecutedPlan = buildModelHostSuccessionFallbackPlanV01({
    ...fallbackBuilderInputV01(unavailableBenchmark.fallback_plan),
    failed_arm_ref: modelHostSuccessionFallbackArmRefV01(notExecutedCandidate),
  });
  const notExecutedBenchmark = buildModelHostSuccessionBenchmarkV01({
    ...benchmarkBuilderInputV01(unavailableBenchmark),
    arm_results: unavailableBenchmark.arm_results.map((arm) =>
      arm.route_profile_ref.route_role === "capability_constrained_simulation"
        ? notExecutedCandidate
        : arm),
    fallback_plan: notExecutedPlan,
    fallback_relation: {
      ...unavailableBenchmark.fallback_relation,
      candidate_arm_id: notExecutedCandidate.arm_id,
    },
  });
  assert.equal(
    validateModelHostSuccessionBenchmarkV01(notExecutedBenchmark).status,
    "valid",
  );
  assert.equal(notExecutedBenchmark.summary, "inconclusive");

  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(candidate),
      record_refs: {
        ...candidate.record_refs,
        run_receipt: replay.record_refs.run_receipt,
      },
    }),
    /model_host_arm_nonexecuted_evidence_invalid/u,
  );
  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(candidate),
      continuation_trace: {
        ...candidate.continuation_trace,
        packet_b_exact_bytes_delivered: true,
        selected_entry_delivered_count: 1,
        selected_entry_exact_receipt_referenced_count: 1,
      },
    }),
    /model_host_arm_nonexecuted_evidence_invalid/u,
  );
  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(candidate),
      direct_success_claimed: true as false,
    }),
    /model_host_arm_authority_or_reuse_invalid/u,
  );
  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(candidate),
      verification_status: "passed",
    }),
    /model_host_arm_nonexecuted_evidence_invalid/u,
  );
  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(
        armV01(decidingBenchmark, "same_model_cold_session_simulation"),
      ),
      fresh_identity_proof: {
        ...armV01(
          decidingBenchmark,
          "same_model_cold_session_simulation",
        ).fresh_identity_proof,
        managed_run_id: null,
      },
    }),
    /model_host_arm_executed_evidence_invalid|model_host_text_invalid/u,
  );
  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(notExecutedCandidate),
      fresh_identity_proof: {
        ...notExecutedCandidate.fresh_identity_proof,
        host_thread_identity_fingerprint: `sha256:${"c".repeat(64)}`,
        provider_thread_identity_fingerprint: `sha256:${"d".repeat(64)}`,
      },
    }),
    /model_host_arm_nonexecuted_evidence_invalid/u,
  );
  assert.throws(
    () => buildModelHostSuccessionArmResultV01({
      ...armBuilderInputV01(candidate),
      record_refs: cloneV01(replay.record_refs),
    }),
    /model_host_arm_nonexecuted_evidence_invalid/u,
  );
}

function assertZeroUnauthorizedEffectsV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
  fixture: Awaited<
    ReturnType<typeof buildDeterministicModelHostSuccessionBenchmarkFixtureV01>
  >,
): void {
  assert.equal(fixture.real_provider_calls, 0);
  assert.equal(fixture.fetch_calls, 0);
  assert.equal(
    fixture.captured_packet_b_canonical_bytes.every(
      (bytes) => bytes === fixture.frozen_packet_b_canonical_bytes,
    ),
    true,
  );
  for (const arm of benchmark.arm_results) {
    assert.equal(arm.resource_observations.provider_calls, 0);
    assert.equal(arm.resource_observations.model_calls, 0);
    assert.equal(arm.resource_observations.network_calls, 0);
    assert.equal(arm.resource_observations.github_calls, 0);
    assert.equal(arm.resource_observations.external_calls, 0);
    assert.equal(arm.fresh_identity_proof.resume_used, false);
    assert.equal(arm.fresh_identity_proof.retry_used, false);
    assert.equal(arm.fresh_identity_proof.no_reuse_proven, true);
    assert.equal(arm.cleanup_status, "complete");
  }
  assert.equal(benchmark.authority_summary.benchmark_persisted, false);
  assert.equal(benchmark.authority_summary.benchmark_builder_database_writes, 0);
  assert.equal(benchmark.authority_summary.benchmark_builder_session_writes, 0);
  assert.equal(benchmark.authority_summary.benchmark_builder_project_file_writes, 0);
  assert.equal(benchmark.authority_summary.benchmark_builder_project_commands, 0);
  assert.equal(benchmark.authority_summary.real_provider_calls, 0);
  assert.equal(benchmark.authority_summary.network_calls, 0);
  assert.equal(benchmark.authority_summary.github_calls, 0);
  assert.equal(benchmark.authority_summary.external_calls, 0);
  assert.equal(benchmark.authority_summary.semantic_state_changed, false);
  assert.equal(benchmark.authority_summary.transition_created, false);
  assert.equal(benchmark.authority_summary.activation_receipt_created, false);
  assert.equal(benchmark.authority_summary.rollback_receipt_created, false);
  assert.equal(benchmark.authority_summary.packet_c_created, false);
  assert.equal(benchmark.authority_summary.second_continuation_hop_created, false);
  assert.equal(benchmark.authority_summary.automatic_start_authorized, false);
  assert.equal(benchmark.authority_summary.automatic_resume_authorized, false);
  assert.equal(benchmark.authority_summary.automatic_fallback_authorized, false);
  assert.equal(benchmark.authority_summary.automatic_rollback_authorized, false);
  assert.equal(fixture.cleanup_verified, true);
  assert.equal(fixture.source_fixture_root_removed, true);
  assert.equal(
    [...fixture.arm_database_paths, ...fixture.arm_project_roots].every(
      (entry) => !existsSync(entry),
    ),
    true,
  );
  assertFreshIdentityMatrixV01(benchmark);
}

function assertReportV01(benchmark: ModelHostSuccessionBenchmarkV01): void {
  const json = renderModelHostSuccessionBenchmarkReportV01(benchmark, "json");
  const markdown = renderModelHostSuccessionBenchmarkReportV01(
    benchmark,
    "markdown",
  );
  const parsed = JSON.parse(json) as { summary: string; route_profiles: unknown[] };
  assert.equal(parsed.summary, "inconclusive");
  assert.equal(parsed.route_profiles.length, 5);
  for (const phrase of [
    "The merged Stage 5 result remains inconclusive",
    "same_model_cold_session_simulation",
    "capability_constrained_simulation",
    "alternate_provider_host_contract_simulation",
    "zero_model_fallback",
    "predecessor_route_replay",
    "No scalar, score, rank, route winner",
    "ADR owner-gap observations",
    "creates no active route",
  ]) {
    assert.equal(markdown.includes(phrase), true, `missing report phrase: ${phrase}`);
  }
  assert.equal(markdown.includes("observed_live_provider"), false);
  assert.equal(markdown.includes("/Users/"), false);
}

function routeV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
  role: ModelHostSuccessionRouteProfileV01["route_role"],
): ModelHostSuccessionRouteProfileV01 {
  const profile = benchmark.route_profiles.find((item) => item.route_role === role);
  assert(profile);
  return profile;
}

function armV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
  role: ModelHostSuccessionRouteProfileV01["route_role"],
) {
  const arm = benchmark.arm_results.find(
    (item) => item.route_profile_ref.route_role === role,
  );
  assert(arm);
  return arm;
}

function frozenBuilderInputV01(frozen: ModelHostSuccessionFrozenCaseV01) {
  return {
    packet_a: frozen.packet_a,
    operational_context_selection: frozen.operational_context_selection,
    acgc5a_materialization_identity:
      frozen.acgc5a_materialization_identity,
    packet_b: frozen.packet_b,
    continuation_admission: frozen.continuation_admission,
    frozen_head_commit: frozen.repository_state.frozen_head_commit,
    frozen_worktree_content_fingerprint:
      frozen.repository_state.frozen_worktree_content_fingerprint,
    construction_cutoff: frozen.repository_state.construction_cutoff,
    observation_cutoff: frozen.repository_state.observation_cutoff,
    platform: frozen.repository_state.platform,
  };
}

function routeBuilderInputV01(profile: ModelHostSuccessionRouteProfileV01) {
  return {
    route_role: profile.route_role,
    provider_ref: profile.provider_ref,
    model_ref: profile.model_ref,
    host_ref: profile.host_ref,
    adapter_implementation_id: profile.adapter_implementation_id,
    adapter_implementation_version: profile.adapter_implementation_version,
    native_host_adapter_version: profile.native_host_adapter_version,
    capability_version: profile.capability_version,
    execution_profile: profile.execution_profile,
    provider_egress_policy: profile.provider_egress_policy,
    session_continuity_mode: profile.session_continuity_mode,
    evidence_class: profile.evidence_class,
    supported_operation_classes: profile.supported_operation_classes,
    unsupported_operation_classes: profile.unsupported_operation_classes,
    capability_coverage: profile.capability_coverage,
    predecessor_route_ref: profile.predecessor_route_ref,
    fallback_target_ref: profile.fallback_target_ref,
  };
}

function fallbackBuilderInputV01(plan: ModelHostSuccessionFallbackPlanV01) {
  return {
    failed_arm_ref: plan.failed_arm_ref,
    predecessor_route_ref: plan.predecessor_route_ref,
    frozen_case_ref: plan.frozen_case_ref,
    fallback_reason: plan.fallback_reason,
    fallback_trigger: plan.fallback_trigger,
    benchmark_harness_authorization: plan.benchmark_harness_authorization,
    required_fresh_execution_identities:
      plan.required_fresh_execution_identities,
  };
}

function armBuilderInputV01(arm: ModelHostSuccessionArmResultV01) {
  const {
    arm_version: _armVersion,
    arm_id: _armId,
    integrity: _integrity,
    ...input
  } = arm;
  return input;
}

function benchmarkBuilderInputV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
) {
  return {
    frozen_case: benchmark.frozen_case,
    route_profiles: benchmark.route_profiles,
    arm_results: benchmark.arm_results,
    fallback_plan: benchmark.fallback_plan,
    fallback_relation: benchmark.fallback_relation,
    trade_offs: benchmark.trade_offs,
    resource_observation_provenance:
      benchmark.resource_observation_provenance,
    missing_evidence: benchmark.missing_evidence,
    limitations: benchmark.limitations,
    adr_owner_gap_observations: benchmark.adr_owner_gap_observations,
  };
}

function pairwiseRowV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
  source: ModelHostSuccessionPairwiseDeltaV01,
): ModelHostSuccessionPairwiseDeltaV01 {
  const row = benchmark.pairwise_route_deltas.find((candidate) =>
    candidate.left_route_role === source.left_route_role &&
    candidate.right_route_role === source.right_route_role &&
    candidate.dimension === source.dimension);
  assert(row);
  return row;
}

function resealBenchmarkV01(
  value: ModelHostSuccessionBenchmarkV01,
): ModelHostSuccessionBenchmarkV01 {
  const benchmark = cloneV01(value);
  const pendingFingerprint = `sha256:${"0".repeat(64)}`;
  benchmark.benchmark_id = "model-host-succession-benchmark:pending";
  benchmark.integrity.fingerprint = pendingFingerprint;
  benchmark.benchmark_id = `model-host-succession-benchmark:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(benchmark),
  ).slice(7, 31)}`;
  benchmark.integrity.fingerprint = pendingFingerprint;
  benchmark.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(benchmark),
  );
  return benchmark;
}

function assertFreshIdentityMatrixV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): void {
  for (let left = 0; left < benchmark.arm_results.length; left += 1) {
    for (let right = left + 1; right < benchmark.arm_results.length; right += 1) {
      assertNoIdentityOverlapV01(
        benchmark.arm_results[left]!,
        benchmark.arm_results[right]!,
      );
    }
  }
}

function assertNoIdentityOverlapV01(
  left: ModelHostSuccessionBenchmarkV01["arm_results"][number],
  right: ModelHostSuccessionBenchmarkV01["arm_results"][number],
): void {
  const leftValues = Object.values(left.fresh_identity_proof).filter(
    (value): value is string => typeof value === "string",
  );
  const rightValues = Object.values(right.fresh_identity_proof).filter(
    (value): value is string => typeof value === "string",
  );
  assert.equal(
    leftValues.some((value) => rightValues.includes(value)),
    false,
    `${left.route_profile_ref.route_role} reused identity with ${right.route_profile_ref.route_role}`,
  );
}

function assertBlockedV01(
  result: ReturnType<typeof validateModelHostSuccessionBenchmarkV01>,
  label: string,
): void {
  assert.equal(result.status, "blocked", `${label} was not refused`);
}

function assertBlockedCodeV01(
  result: ReturnType<typeof validateModelHostSuccessionBenchmarkV01>,
  code: string,
): void {
  assert.equal(result.status, "blocked");
  assert.equal(result.errors.some((error) => error.code === code), true);
}

function cloneV01<T>(value: T): T {
  return structuredClone(value);
}

export function buildModelHostSuccessionRouteProfileValidationFixtureV01() {
  return buildModelHostSuccessionRouteProfilesFixtureV01();
}
