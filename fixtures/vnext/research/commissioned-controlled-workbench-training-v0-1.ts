import {
  buildCommissionedWorkCaseCommitmentV01,
  buildCommissionedWorkFamilyManifestFromCommitmentsV01,
  type BuildCommissionedWorkFamilyManifestInputV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import { COMMISSIONED_WORKBENCH_HOLDOUT_COMMITMENT_V01 } from "@/fixtures/vnext/research/commissioned-controlled-workbench-holdout-commitment-v0-1";
import type {
  CommissionedWorkCaseSourceV01,
  CommissionedWorkEpisodePlanSourceV01,
  CommissionedWorkSourceMaterialV01,
  CommissionedWorkSuccessorPlanSourceV01,
} from "@/types/vnext/commissioned-controlled-workbench";

export const COMMISSIONED_WORKBENCH_FIXTURE_FAMILY_ID_V01 =
  "cw1-family-fourfold-01" as const;
export const COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01 =
  "commissioned_work_objective_evaluator.v0.1" as const;

const SHARED_BUDGET = {
  max_changed_files: 2,
  max_checks: 2,
  max_processes: 1,
  provider_calls_authorized_by_family_manifest: false,
  external_network_call_limit: 0,
} as const;

function material(
  material_id: string,
  material_kind: CommissionedWorkSourceMaterialV01["material_kind"],
  lifecycle_status: CommissionedWorkSourceMaterialV01["lifecycle_status"],
  content: string,
): CommissionedWorkSourceMaterialV01 {
  return { material_id, material_kind, lifecycle_status, content };
}

function taskOwnedOperationContractV01(input: {
  allowed_repository_relative_paths: string[];
  max_changed_files: number;
}): CommissionedWorkEpisodePlanSourceV01["operation_contract"] {
  return {
    allowed_operation_categories: ["repository_file_edit"],
    allowed_repository_relative_paths: [
      ...input.allowed_repository_relative_paths,
    ].sort(),
    max_changed_files: input.max_changed_files,
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

const AMBER_OPERATION_CONTRACT_V01 = taskOwnedOperationContractV01({
  allowed_repository_relative_paths: [
    "src/route-token.mjs",
    "src/route-format.mjs",
  ],
  max_changed_files: 1,
});

const COBALT_OPERATION_CONTRACT_V01 = taskOwnedOperationContractV01({
  allowed_repository_relative_paths: [
    "lib/quota-window.mjs",
    "lib/quota-policy.mjs",
  ],
  max_changed_files: 1,
});

const CEDAR_OPERATION_CONTRACT_V01 = taskOwnedOperationContractV01({
  allowed_repository_relative_paths: [
    "engine/resolve-mode.mjs",
    "engine/mode-lookup.mjs",
  ],
  max_changed_files: 1,
});

function predecessorPlan(input: {
  executor: string;
  operation_contract: CommissionedWorkEpisodePlanSourceV01["operation_contract"];
}): CommissionedWorkEpisodePlanSourceV01 {
  return {
    executor_role_id: input.executor,
    operation_contract: input.operation_contract,
  };
}

function trainingPlan(input: {
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"];
  executor: string;
  operation_contract: CommissionedWorkEpisodePlanSourceV01["operation_contract"];
  selected: string[];
  excluded: string[];
  stale: string | null;
  intervention: string;
  holdout_variant?: CommissionedWorkSuccessorPlanSourceV01["holdout_variant"];
  candidate_intervention_mode?: CommissionedWorkSuccessorPlanSourceV01["candidate_intervention_mode"];
}): CommissionedWorkSuccessorPlanSourceV01 {
  const holdoutVariant = input.holdout_variant ?? null;
  return {
    executor_role_id: input.executor,
    operation_contract: input.operation_contract,
    condition: input.condition,
    holdout_variant: holdoutVariant,
    candidate_intervention_mode:
      input.candidate_intervention_mode ?? "not_applicable",
    selected_material_ids: input.selected,
    excluded_material_ids: input.excluded,
    stale_relation_material_id: input.stale,
    intervention_provenance_material_id: input.intervention,
  };
}

const amberCase: CommissionedWorkCaseSourceV01 = {
  case_id: "case-amber-17",
  case_role: "training",
  project_id: "project-amber-17",
  independent_origin_group_id: "origin-amber-routing",
  task: {
    goal: "Finish the route-token behavior and satisfy the local checker.",
    success_criteria: ["The route checker exits successfully."],
    non_goals: ["Do not change the channel contract or checker."],
  },
  repository_fixture: [
    {
      repository_relative_path: "src/channel.mjs",
      content: 'export const separator = ":";\n',
    },
    {
      repository_relative_path: "src/route-token.mjs",
      content:
        'export function routeToken() { throw new Error("pending"); }\n',
    },
    {
      repository_relative_path: "checks/route.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { routeToken } from "../src/route-token.mjs";\nassert.equal(routeToken("alpha", "7"), "alpha:7");\n',
    },
  ],
  predecessor_plan: predecessorPlan({
    executor: "executor-amber-p0",
    operation_contract: AMBER_OPERATION_CONTRACT_V01,
  }),
  source_drift_writes: [
    {
      repository_relative_path: "src/channel.mjs",
      content: 'export const separator = "~";\n',
    },
    {
      repository_relative_path: "checks/route.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { routeToken } from "../src/route-token.mjs";\nassert.equal(routeToken("alpha", "7"), "alpha~7");\n',
    },
  ],
  successor_plans: [
    trainingPlan({
      condition: "exact_current_continuity",
      executor: "executor-amber-s1",
      operation_contract: AMBER_OPERATION_CONTRACT_V01,
      selected: ["amber-current"],
      excluded: ["amber-old"],
      stale: null,
      intervention: "amber-intervention-exact",
    }),
    trainingPlan({
      condition: "matched_ablation",
      executor: "executor-amber-s2",
      operation_contract: AMBER_OPERATION_CONTRACT_V01,
      selected: [],
      excluded: ["amber-current", "amber-old"],
      stale: null,
      intervention: "amber-intervention-ablation",
    }),
    trainingPlan({
      condition: "stale_or_regime_shift_continuity",
      executor: "executor-amber-s3",
      operation_contract: AMBER_OPERATION_CONTRACT_V01,
      selected: ["amber-old"],
      excluded: ["amber-current"],
      stale: "amber-old",
      intervention: "amber-intervention-stale",
    }),
    trainingPlan({
      condition: "zero_continuation_control",
      executor: "executor-amber-s4",
      operation_contract: AMBER_OPERATION_CONTRACT_V01,
      selected: [],
      excluded: ["amber-current", "amber-old"],
      stale: null,
      intervention: "amber-intervention-zero",
    }),
  ],
  current_source_relative_paths: ["checks/route.mjs", "src/channel.mjs"],
  required_checks: [
    { check_id: "amber-route-contract", oracle_relative_path: "checks/route.mjs" },
  ],
  source_currentness_check_id: "amber-route-contract",
  expected_success_changed_paths: ["src/route-token.mjs"],
  expected_success_writes: [
    {
      repository_relative_path: "src/route-token.mjs",
      content:
        'import { separator } from "./channel.mjs";\nexport function routeToken(key, id) { return `${key}${separator}${id}`; }\n',
    },
  ],
  negative_space_guards: [
    {
      guard_id: "amber-colon-retirement",
      repository_relative_path: "src/route-token.mjs",
      forbidden_fragment: 'join(":")',
      guarded_status: "superseded",
    },
  ],
  materials: [
    material(
      "amber-common",
      "common_task_evidence",
      "current",
      "The bounded task names the route module and one local checker.",
    ),
    material(
      "amber-current",
      "continuation_material",
      "current",
      "The channel module now owns the separator used by route tokens.",
    ),
    material(
      "amber-old",
      "stale_relation",
      "superseded",
      "The earlier implementation note used a literal colon separator.",
    ),
    ...["exact", "ablation", "stale", "zero"].map((arm) =>
      material(
        `amber-intervention-${arm}`,
        "intervention_provenance",
        "current",
        `Opaque sealed assignment provenance ${arm}.`,
      ),
    ),
  ],
  evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  budget: SHARED_BUDGET,
};

const cobaltCase: CommissionedWorkCaseSourceV01 = {
  case_id: "case-cobalt-29",
  case_role: "training",
  project_id: "project-cobalt-29",
  independent_origin_group_id: "origin-cobalt-window",
  task: {
    goal: "Complete the quota-window module and satisfy both local check programs.",
    success_criteria: [
      "The base quota check exits successfully.",
      "The boundary quota check exits successfully.",
    ],
    non_goals: ["Do not edit the limit source or validation programs."],
  },
  repository_fixture: [
    {
      repository_relative_path: "config/window.mjs",
      content: "export const limit = 10;\n",
    },
    {
      repository_relative_path: "lib/quota-window.mjs",
      content:
        'export function accepts() { throw new Error("unfinished"); }\n',
    },
    {
      repository_relative_path: "checks/quota-base.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { accepts } from "../lib/quota-window.mjs";\nassert.equal(accepts(4), true);\nassert.equal(accepts(11), false);\n',
    },
    {
      repository_relative_path: "checks/quota-edge.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { accepts } from "../lib/quota-window.mjs";\nassert.equal(accepts(10), true);\n',
    },
  ],
  predecessor_plan: predecessorPlan({
    executor: "executor-cobalt-p0",
    operation_contract: COBALT_OPERATION_CONTRACT_V01,
  }),
  source_drift_writes: [
    {
      repository_relative_path: "config/window.mjs",
      content: "export const limit = 12;\n",
    },
    {
      repository_relative_path: "checks/quota-base.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { accepts } from "../lib/quota-window.mjs";\nassert.equal(accepts(4), true);\nassert.equal(accepts(13), false);\n',
    },
    {
      repository_relative_path: "checks/quota-edge.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { accepts } from "../lib/quota-window.mjs";\nassert.equal(accepts(12), true);\nassert.equal(accepts(13), false);\n',
    },
  ],
  successor_plans: [
    trainingPlan({
      condition: "exact_current_continuity",
      executor: "executor-cobalt-s1",
      operation_contract: COBALT_OPERATION_CONTRACT_V01,
      selected: ["cobalt-current", "cobalt-incomplete"],
      excluded: ["cobalt-implemented"],
      stale: null,
      intervention: "cobalt-intervention-exact",
    }),
    trainingPlan({
      condition: "matched_ablation",
      executor: "executor-cobalt-s2",
      operation_contract: COBALT_OPERATION_CONTRACT_V01,
      selected: ["cobalt-current"],
      excluded: ["cobalt-incomplete", "cobalt-implemented"],
      stale: null,
      intervention: "cobalt-intervention-ablation",
    }),
    trainingPlan({
      condition: "stale_or_regime_shift_continuity",
      executor: "executor-cobalt-s3",
      operation_contract: COBALT_OPERATION_CONTRACT_V01,
      selected: ["cobalt-implemented"],
      excluded: ["cobalt-current", "cobalt-incomplete"],
      stale: "cobalt-implemented",
      intervention: "cobalt-intervention-stale",
    }),
    trainingPlan({
      condition: "zero_continuation_control",
      executor: "executor-cobalt-s4",
      operation_contract: COBALT_OPERATION_CONTRACT_V01,
      selected: [],
      excluded: ["cobalt-current", "cobalt-incomplete", "cobalt-implemented"],
      stale: null,
      intervention: "cobalt-intervention-zero",
    }),
  ],
  current_source_relative_paths: [
    "checks/quota-base.mjs",
    "checks/quota-edge.mjs",
    "config/window.mjs",
  ],
  required_checks: [
    { check_id: "cobalt-base-contract", oracle_relative_path: "checks/quota-base.mjs" },
    { check_id: "cobalt-edge-contract", oracle_relative_path: "checks/quota-edge.mjs" },
  ],
  source_currentness_check_id: "cobalt-edge-contract",
  expected_success_changed_paths: ["lib/quota-window.mjs"],
  expected_success_writes: [
    {
      repository_relative_path: "lib/quota-window.mjs",
      content:
        'import { limit } from "../config/window.mjs";\nexport function accepts(value) { return value <= limit; }\n',
    },
  ],
  negative_space_guards: [
    {
      guard_id: "cobalt-unbounded-acceptance",
      repository_relative_path: "lib/quota-window.mjs",
      forbidden_fragment: "return true",
      guarded_status: "deferred",
    },
  ],
  materials: [
    material(
      "cobalt-common",
      "common_task_evidence",
      "current",
      "The task binds the quota module to two bounded local check programs.",
    ),
    material(
      "cobalt-current",
      "continuation_material",
      "current",
      "The configured quota limit changed after the predecessor edit.",
    ),
    material(
      "cobalt-incomplete",
      "continuation_material",
      "incomplete",
      "The predecessor did not establish the boundary-check obligation.",
    ),
    material(
      "cobalt-implemented",
      "stale_relation",
      "execution_only",
      "The earlier implementation was reported complete without the boundary check.",
    ),
    ...["exact", "ablation", "stale", "zero"].map((arm) =>
      material(
        `cobalt-intervention-${arm}`,
        "intervention_provenance",
        "current",
        `Opaque fixed assignment provenance cobalt ${arm}.`,
      ),
    ),
  ],
  evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  budget: SHARED_BUDGET,
};

const cedarCase: CommissionedWorkCaseSourceV01 = {
  case_id: "case-cedar-41",
  case_role: "training",
  project_id: "project-cedar-41",
  independent_origin_group_id: "origin-cedar-table",
  task: {
    goal: "Complete the mode resolver for the catalog and satisfy the table check.",
    success_criteria: ["The catalog table check exits successfully."],
    non_goals: ["Do not change the catalog or table check."],
  },
  repository_fixture: [
    {
      repository_relative_path: "engine/mode-catalog.mjs",
      content: 'export const catalog = { hot: "fast" };\n',
    },
    {
      repository_relative_path: "engine/resolve-mode.mjs",
      content:
        'export function resolveMode() { throw new Error("not ready"); }\n',
    },
    {
      repository_relative_path: "spec/table-check.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { resolveMode } from "../engine/resolve-mode.mjs";\nassert.equal(resolveMode("hot"), "fast");\nassert.throws(() => resolveMode("other"));\n',
    },
  ],
  predecessor_plan: predecessorPlan({
    executor: "executor-cedar-p0",
    operation_contract: CEDAR_OPERATION_CONTRACT_V01,
  }),
  source_drift_writes: [
    {
      repository_relative_path: "engine/mode-catalog.mjs",
      content: 'export const catalog = { hot: "fast", warm: "steady" };\n',
    },
    {
      repository_relative_path: "spec/table-check.mjs",
      content:
        'import assert from "node:assert/strict";\nimport { resolveMode } from "../engine/resolve-mode.mjs";\nassert.equal(resolveMode("hot"), "fast");\nassert.equal(resolveMode("warm"), "steady");\nassert.throws(() => resolveMode("other"));\n',
    },
  ],
  successor_plans: [
    trainingPlan({
      condition: "exact_current_continuity",
      executor: "executor-cedar-s1",
      operation_contract: CEDAR_OPERATION_CONTRACT_V01,
      selected: ["cedar-current", "cedar-rejection"],
      excluded: ["cedar-fallback"],
      stale: null,
      intervention: "cedar-intervention-exact",
    }),
    trainingPlan({
      condition: "matched_ablation",
      executor: "executor-cedar-s2",
      operation_contract: CEDAR_OPERATION_CONTRACT_V01,
      selected: ["cedar-current"],
      excluded: ["cedar-rejection", "cedar-fallback"],
      stale: null,
      intervention: "cedar-intervention-ablation",
    }),
    trainingPlan({
      condition: "stale_or_regime_shift_continuity",
      executor: "executor-cedar-s3",
      operation_contract: CEDAR_OPERATION_CONTRACT_V01,
      selected: ["cedar-fallback"],
      excluded: ["cedar-current", "cedar-rejection"],
      stale: "cedar-fallback",
      intervention: "cedar-intervention-stale",
    }),
    trainingPlan({
      condition: "zero_continuation_control",
      executor: "executor-cedar-s4",
      operation_contract: CEDAR_OPERATION_CONTRACT_V01,
      selected: [],
      excluded: ["cedar-current", "cedar-rejection", "cedar-fallback"],
      stale: null,
      intervention: "cedar-intervention-zero",
    }),
  ],
  current_source_relative_paths: ["engine/mode-catalog.mjs", "spec/table-check.mjs"],
  required_checks: [
    { check_id: "cedar-table-contract", oracle_relative_path: "spec/table-check.mjs" },
  ],
  source_currentness_check_id: "cedar-table-contract",
  expected_success_changed_paths: ["engine/resolve-mode.mjs"],
  expected_success_writes: [
    {
      repository_relative_path: "engine/resolve-mode.mjs",
      content:
        'import { catalog } from "./mode-catalog.mjs";\nexport function resolveMode(name) { if (!Object.hasOwn(catalog, name)) throw new Error("unknown"); return catalog[name]; }\n',
    },
  ],
  negative_space_guards: [
    {
      guard_id: "cedar-default-fallback",
      repository_relative_path: "engine/resolve-mode.mjs",
      forbidden_fragment: '?? "default"',
      guarded_status: "rejected",
    },
  ],
  materials: [
    material(
      "cedar-common",
      "common_task_evidence",
      "current",
      "The bounded task names a catalog, one resolver, and one table check.",
    ),
    material(
      "cedar-current",
      "continuation_material",
      "current",
      "The catalog gained one explicit mode after the interruption.",
    ),
    material(
      "cedar-rejection",
      "continuation_material",
      "rejected",
      "Unknown catalog names remain errors rather than implicit defaults.",
    ),
    material(
      "cedar-fallback",
      "stale_relation",
      "rejected",
      "An earlier fallback suggestion returned a default for unknown names.",
    ),
    ...["exact", "ablation", "stale", "zero"].map((arm) =>
      material(
        `cedar-intervention-${arm}`,
        "intervention_provenance",
        "current",
        `Opaque fixed assignment provenance cedar ${arm}.`,
      ),
    ),
  ],
  evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  budget: SHARED_BUDGET,
};

/**
 * Builds training sources and the pre-registered holdout commitment only.
 * This module has no dependency on the mixed fixture that owns raw holdout
 * source material.
 */
export function createCommissionedControlledWorkTrainingOnlyFamilyV01(): {
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestFromCommitmentsV01>;
  training_cases: BuildCommissionedWorkFamilyManifestInputV01["training_cases"];
} {
  const trainingCases = structuredClone([
    amberCase,
    cobaltCase,
    cedarCase,
  ]) as BuildCommissionedWorkFamilyManifestInputV01["training_cases"];
  const manifest = buildCommissionedWorkFamilyManifestFromCommitmentsV01({
    family_id: COMMISSIONED_WORKBENCH_FIXTURE_FAMILY_ID_V01,
    workspace_id: "workspace-cw1-controlled",
    task_family_key: "repository-continuation-family-01",
    sealed_at: "2026-08-27T00:00:00.000Z",
    construction_cutoff: "2026-08-27T01:00:00.000Z",
    evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
    hypothesis_fingerprint:
      "sha256:be72ec1dd78456162410f9c8dbac93f76750fc65faebfc1efee3f22d8a3ff9f0",
    task_author_role_id: "role-cw1-corpus-builder",
    outcome_evaluator_role_id: "role-cw1-objective-evaluator",
    consolidation_assessor_role_id: "role-cw1-consolidation-assessor",
    training_case_commitments: trainingCases.map(
      buildCommissionedWorkCaseCommitmentV01,
    ) as ReturnType<typeof buildCommissionedWorkCaseCommitmentV01>[] as
      Parameters<typeof buildCommissionedWorkFamilyManifestFromCommitmentsV01>[0]["training_case_commitments"],
    holdout_case_commitment: structuredClone(
      COMMISSIONED_WORKBENCH_HOLDOUT_COMMITMENT_V01,
    ),
    equal_budget_fingerprint:
      "sha256:9ed5c4e5d79cd5cf9c318a6010f8afda4f2044cf117f6c3f712727f84b91a956",
  });
  return { manifest, training_cases: trainingCases };
}
