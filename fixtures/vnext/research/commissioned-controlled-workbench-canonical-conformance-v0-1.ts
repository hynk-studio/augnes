import type { BuildCommissionedWorkFamilyManifestInputV01 } from "@/lib/vnext/commissioned-controlled-workbench";
import {
  COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  createCommissionedControlledWorkTrainingCasesV01,
} from "@/fixtures/vnext/research/commissioned-controlled-workbench-training-v0-1";
import {
  COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type {
  CommissionedWorkCaseSourceV01,
  CommissionedWorkEpisodePlanSourceV01,
  CommissionedWorkHoldoutVariantV01,
  CommissionedWorkSourceMaterialV01,
  CommissionedWorkSuccessorPlanSourceV01,
  CommissionedWorkSyntheticFixtureOutputV01,
} from "@/types/vnext/commissioned-controlled-workbench";

export const COMMISSIONED_WORKBENCH_CANONICAL_CONFORMANCE_FAMILY_ID_V01 =
  "cw1-canonical-conformance-family-01" as const;
export const COMMISSIONED_WORKBENCH_CANONICAL_CONFORMANCE_HOLDOUT_CASE_ID_V01 =
  "case-canonical-conformance-holdout-01" as const;

const CONFORMANCE_BUDGET_V01 = {
  max_changed_files: 2,
  max_checks: 2,
  max_processes: 1,
  provider_calls_authorized_by_family_manifest: false,
  external_network_call_limit: 0,
} as const;

function conformanceOperationContractV01(): CommissionedWorkEpisodePlanSourceV01["operation_contract"] {
  return {
    allowed_operation_categories: ["repository_file_edit"],
    allowed_repository_relative_paths: ["lib/conformance-card.mjs"],
    max_changed_files: 1,
    max_artifacts: 2,
    max_commands: 8,
    provider_authority_source: "separate_live_authorization_required",
    provider_calls_authorized_by_operation_contract: false,
    external_network_call_limit: 0,
    outside_root_write_allowed: false,
    github_mutation_allowed: false,
    semantic_authority_allowed: false,
  };
}

function conformanceMaterialV01(
  material_id: string,
  material_kind: CommissionedWorkSourceMaterialV01["material_kind"],
  lifecycle_status: CommissionedWorkSourceMaterialV01["lifecycle_status"],
  content: string,
): CommissionedWorkSourceMaterialV01 {
  return { material_id, material_kind, lifecycle_status, content };
}

function conformanceHoldoutPlanV01(input: {
  executor_role_id: string;
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"];
  holdout_variant: CommissionedWorkHoldoutVariantV01;
  candidate_intervention_mode: CommissionedWorkSuccessorPlanSourceV01["candidate_intervention_mode"];
  selected_material_ids: string[];
  excluded_material_ids: string[];
  stale_relation_material_id: string | null;
  intervention_provenance_material_id: string;
}): CommissionedWorkSuccessorPlanSourceV01 {
  return {
    executor_role_id: input.executor_role_id,
    operation_contract: conformanceOperationContractV01(),
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    candidate_intervention_mode: input.candidate_intervention_mode,
    selected_material_ids: input.selected_material_ids,
    excluded_material_ids: input.excluded_material_ids,
    stale_relation_material_id: input.stale_relation_material_id,
    intervention_provenance_material_id:
      input.intervention_provenance_material_id,
  };
}

function createCanonicalConformanceHoldoutV01(): CommissionedWorkCaseSourceV01 {
  const currentMaterialId = "canonical-conformance-current-card-rule";
  const staleMaterialId = "canonical-conformance-retired-card-default";
  return {
    case_id: COMMISSIONED_WORKBENCH_CANONICAL_CONFORMANCE_HOLDOUT_CASE_ID_V01,
    case_role: "holdout",
    project_id: "project-canonical-conformance-holdout-01",
    independent_origin_group_id: "origin-canonical-conformance-holdout-01",
    task: {
      goal: "Complete the synthetic conformance card formatter and satisfy its local check.",
      success_criteria: ["The synthetic conformance card check exits successfully."],
      non_goals: ["Do not change the test token or its check program."],
    },
    repository_fixture: [
      {
        repository_relative_path: "config/conformance-token.mjs",
        content: 'export const token = "v0";\n',
      },
      {
        repository_relative_path: "lib/conformance-card.mjs",
        content:
          'export function conformanceCard() { throw new Error("test-only pending"); }\n',
      },
      {
        repository_relative_path: "checks/conformance-card.mjs",
        content:
          'import assert from "node:assert/strict";\nimport { conformanceCard } from "../lib/conformance-card.mjs";\nassert.equal(conformanceCard("north"), "[north|v0]");\n',
      },
    ],
    predecessor_plan: {
      executor_role_id: "executor-canonical-conformance-holdout-p0",
      operation_contract: conformanceOperationContractV01(),
    },
    source_drift_writes: [
      {
        repository_relative_path: "config/conformance-token.mjs",
        content: 'export const token = "v1";\n',
      },
      {
        repository_relative_path: "checks/conformance-card.mjs",
        content:
          'import assert from "node:assert/strict";\nimport { conformanceCard } from "../lib/conformance-card.mjs";\nassert.equal(conformanceCard("north"), "[north|v1]");\n',
      },
    ],
    successor_plans: [
      conformanceHoldoutPlanV01({
        executor_role_id: "executor-canonical-conformance-holdout-baseline",
        condition: "exact_current_continuity",
        holdout_variant: "strongest_equal_budget_baseline",
        candidate_intervention_mode: "no_candidate",
        selected_material_ids: [currentMaterialId],
        excluded_material_ids: [staleMaterialId],
        stale_relation_material_id: null,
        intervention_provenance_material_id:
          "canonical-conformance-intervention-baseline",
      }),
      conformanceHoldoutPlanV01({
        executor_role_id: "executor-canonical-conformance-holdout-candidate",
        condition: "exact_current_continuity",
        holdout_variant: "candidate_present",
        candidate_intervention_mode: "all_frozen_candidate_components",
        selected_material_ids: [currentMaterialId],
        excluded_material_ids: [staleMaterialId],
        stale_relation_material_id: null,
        intervention_provenance_material_id:
          "canonical-conformance-intervention-candidate",
      }),
      conformanceHoldoutPlanV01({
        executor_role_id: "executor-canonical-conformance-holdout-ablation",
        condition: "exact_current_continuity",
        holdout_variant: "candidate_component_ablation",
        candidate_intervention_mode: "frozen_candidate_minus_last_component",
        selected_material_ids: [currentMaterialId],
        excluded_material_ids: [staleMaterialId],
        stale_relation_material_id: null,
        intervention_provenance_material_id:
          "canonical-conformance-intervention-ablation",
      }),
      conformanceHoldoutPlanV01({
        executor_role_id: "executor-canonical-conformance-holdout-stale",
        condition: "stale_or_regime_shift_continuity",
        holdout_variant: "stale_or_reset",
        candidate_intervention_mode: "no_candidate",
        selected_material_ids: [staleMaterialId],
        excluded_material_ids: [currentMaterialId],
        stale_relation_material_id: staleMaterialId,
        intervention_provenance_material_id:
          "canonical-conformance-intervention-stale",
      }),
    ],
    current_source_relative_paths: [
      "checks/conformance-card.mjs",
      "config/conformance-token.mjs",
    ],
    required_checks: [
      {
        check_id: "canonical-conformance-card-check",
        oracle_relative_path: "checks/conformance-card.mjs",
      },
    ],
    source_currentness_check_id: "canonical-conformance-card-check",
    expected_success_changed_paths: ["lib/conformance-card.mjs"],
    expected_success_writes: [
      {
        repository_relative_path: "lib/conformance-card.mjs",
        content:
          'import { token } from "../config/conformance-token.mjs";\nexport function conformanceCard(value) { return `[${value}|${token}]`; }\n',
      },
    ],
    negative_space_guards: [
      {
        guard_id: "canonical-conformance-retired-default",
        repository_relative_path: "lib/conformance-card.mjs",
        forbidden_fragment: 'return "[test-default]";',
        guarded_status: "rejected",
      },
    ],
    materials: [
      conformanceMaterialV01(
        "canonical-conformance-common-task",
        "common_task_evidence",
        "current",
        "A synthetic formatter and one local check exercise only generic workbench mechanics.",
      ),
      conformanceMaterialV01(
        currentMaterialId,
        "continuation_material",
        "current",
        "The synthetic token changed from v0 to v1 before the successor slots.",
      ),
      conformanceMaterialV01(
        staleMaterialId,
        "stale_relation",
        "rejected",
        "A test-only default card was rejected in favor of the explicit token.",
      ),
      ...[
        "baseline",
        "candidate",
        "ablation",
        "stale",
      ].map((variant) =>
        conformanceMaterialV01(
          `canonical-conformance-intervention-${variant}`,
          "intervention_provenance",
          "current",
          `Opaque test-only conformance assignment ${variant}.`,
        ),
      ),
    ],
    evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
    budget: CONFORMANCE_BUDGET_V01,
  };
}

export function createCommissionedControlledWorkCanonicalConformanceFamilySourceV01(): BuildCommissionedWorkFamilyManifestInputV01 {
  return structuredClone({
    family_id: COMMISSIONED_WORKBENCH_CANONICAL_CONFORMANCE_FAMILY_ID_V01,
    workspace_id: "workspace-cw1-canonical-conformance",
    task_family_key: "test-only-workbench-mechanics-conformance",
    sealed_at: "2026-08-31T00:00:00.000Z",
    construction_cutoff: "2026-08-31T01:00:00.000Z",
    evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
    hypothesis:
      "A synthetic four-case family can exercise generic workbench mechanics without scientific authority.",
    task_author_role_id: "role-canonical-conformance-task-author",
    outcome_evaluator_role_id: "role-canonical-conformance-evaluator",
    consolidation_assessor_role_id: "role-canonical-conformance-assessor",
    training_cases: createCommissionedControlledWorkTrainingCasesV01(),
    holdout_case: createCanonicalConformanceHoldoutV01(),
  });
}

function targetPathV01(source: CommissionedWorkCaseSourceV01): string {
  const target = source.expected_success_changed_paths[0];
  if (!target) throw new Error("canonical_conformance_target_missing");
  return target;
}

function initialTargetContentV01(source: CommissionedWorkCaseSourceV01): string {
  const target = targetPathV01(source);
  const fixture = source.repository_fixture.find(
    (candidate) => candidate.repository_relative_path === target,
  );
  if (!fixture) throw new Error("canonical_conformance_target_fixture_missing");
  return fixture.content;
}

function trainingFailureContentV01(
  source: CommissionedWorkCaseSourceV01,
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"] | null,
): string {
  if (condition === "stale_or_regime_shift_continuity") {
    if (source.case_id === "case-amber-17") {
      return 'export function routeToken(...parts) { return parts.join(":"); }\n';
    }
    if (source.case_id === "case-cobalt-29") {
      return "export function accepts() { return true; }\n";
    }
    if (source.case_id === "case-cedar-41") {
      return 'export function resolveMode(name) { return name ?? "default"; }\n';
    }
  }
  return `${initialTargetContentV01(source)}// canonical conformance ${condition ?? "predecessor"}\n`;
}

function outputV01(input: {
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  episode_role: "predecessor" | "successor";
  writes: CommissionedWorkSyntheticFixtureOutputV01["writes"];
  terminal_outcome: CommissionedWorkSyntheticFixtureOutputV01["terminal_outcome"];
  executor_claimed_complete: boolean;
}): CommissionedWorkSyntheticFixtureOutputV01 {
  const successor = "condition" in input.plan ? input.plan : null;
  return {
    output_version: "commissioned_work_synthetic_fixture_output.v0.1",
    output_id: `${input.source.case_id}-${input.plan.executor_role_id}-output`,
    case_id: input.source.case_id,
    executor_role_id: input.plan.executor_role_id,
    episode_role: input.episode_role,
    condition: successor?.condition ?? null,
    holdout_variant: successor?.holdout_variant ?? null,
    writes: input.writes,
    terminal_outcome: input.terminal_outcome,
    executor_claimed_complete: input.executor_claimed_complete,
    experiment_class: COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
    execution_evidence_class: COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
    expected_mechanics_response: true,
    commissioned_behavioral_evidence: false,
    part_of_task_context_packet: false,
    part_of_candidate_derivation_evidence: false,
    required_by_live_executor_path: false,
  };
}

function trainingOutputsV01(
  source: CommissionedWorkCaseSourceV01,
): CommissionedWorkSyntheticFixtureOutputV01[] {
  const target = targetPathV01(source);
  const predecessorClaimedComplete = source.case_id === "case-cobalt-29";
  const predecessor = outputV01({
    source,
    plan: source.predecessor_plan,
    episode_role: "predecessor",
    writes: [{
      repository_relative_path: target,
      content: trainingFailureContentV01(source, null),
    }],
    terminal_outcome: "completed",
    executor_claimed_complete: predecessorClaimedComplete,
  });
  return [
    predecessor,
    ...source.successor_plans.map((plan) => {
      const succeeds = plan.condition === "exact_current_continuity";
      return outputV01({
        source,
        plan,
        episode_role: "successor",
        writes: succeeds
          ? structuredClone(source.expected_success_writes)
          : [{
              repository_relative_path: target,
              content: trainingFailureContentV01(source, plan.condition),
            }],
        terminal_outcome: "completed",
        executor_claimed_complete: succeeds,
      });
    }),
  ];
}

function conformanceHoldoutOutputsV01(
  source: CommissionedWorkCaseSourceV01,
): CommissionedWorkSyntheticFixtureOutputV01[] {
  const target = targetPathV01(source);
  const successWrites = structuredClone(source.expected_success_writes);
  const predecessor = outputV01({
    source,
    plan: source.predecessor_plan,
    episode_role: "predecessor",
    writes: [{
      repository_relative_path: target,
      content: 'export function conformanceCard() { return "test-only pending"; }\n',
    }],
    terminal_outcome: "completed",
    executor_claimed_complete: false,
  });
  return [
    predecessor,
    ...source.successor_plans.map((plan) => {
      const succeeds =
        plan.holdout_variant === "candidate_present" ||
        plan.holdout_variant === "stale_or_reset";
      const failureContent =
        plan.holdout_variant === "candidate_component_ablation"
          ? 'export function conformanceCard() { return "[test-default]"; }\n'
          : 'export function conformanceCard() { throw new Error("test-only baseline incomplete"); }\n';
      return outputV01({
        source,
        plan,
        episode_role: "successor",
        writes: succeeds
          ? successWrites
          : [{ repository_relative_path: target, content: failureContent }],
        terminal_outcome: "completed",
        executor_claimed_complete: succeeds,
      });
    }),
  ];
}

export function createCommissionedControlledWorkCanonicalConformanceSyntheticFixtureOutputsV01(): CommissionedWorkSyntheticFixtureOutputV01[] {
  const family = createCommissionedControlledWorkCanonicalConformanceFamilySourceV01();
  return structuredClone([
    ...family.training_cases.flatMap(trainingOutputsV01),
    ...conformanceHoldoutOutputsV01(family.holdout_case),
  ]);
}
