import type { BuildCommissionedWorkFamilyManifestInputV01 } from "@/lib/vnext/commissioned-controlled-workbench";
import {
  COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  COMMISSIONED_WORKBENCH_FIXTURE_FAMILY_ID_V01,
  createCommissionedControlledWorkTrainingOnlyFamilyV01,
} from "@/fixtures/vnext/research/commissioned-controlled-workbench-training-v0-1";
import type {
  CommissionedWorkCaseSourceV01,
  CommissionedWorkEpisodePlanSourceV01,
  CommissionedWorkSourceMaterialV01,
  CommissionedWorkSuccessorPlanSourceV01,
  CommissionedWorkSyntheticFixtureOutputV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import {
  COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
} from "@/types/vnext/commissioned-controlled-workbench";

export {
  COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  COMMISSIONED_WORKBENCH_FIXTURE_FAMILY_ID_V01,
  createCommissionedControlledWorkTrainingOnlyFamilyV01,
} from "@/fixtures/vnext/research/commissioned-controlled-workbench-training-v0-1";

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

function fixtureCaseIdV01(executorRoleId: string): string {
  if (executorRoleId.startsWith("executor-amber-")) return "case-amber-17";
  if (executorRoleId.startsWith("executor-cobalt-")) return "case-cobalt-29";
  if (executorRoleId.startsWith("executor-cedar-")) return "case-cedar-41";
  if (executorRoleId.startsWith("executor-quartz-")) return "case-quartz-83";
  throw new Error("commissioned_work_fixture_executor_case_unknown");
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

function createQuartzCaseV01(): CommissionedWorkCaseSourceV01 {
  const quartzOperationContract = taskOwnedOperationContractV01({
    allowed_repository_relative_paths: [
      "modules/ledger/normalize.cjs",
      "modules/ledger/format.cjs",
    ],
    max_changed_files: 1,
  });
  return {
  case_id: "case-quartz-83",
  case_role: "holdout",
  project_id: "project-quartz-83",
  independent_origin_group_id: "origin-quartz-ledger",
  task: {
    goal: "Finish ledger label normalization and satisfy the bounded validation programs.",
    success_criteria: [
      "The shape validation program exits successfully.",
      "The edge validation program exits successfully.",
    ],
    non_goals: ["Do not edit the inventory mark or validation programs."],
  },
  repository_fixture: [
    {
      repository_relative_path: "inventory/marks.cjs",
      content: 'exports.mark = "+";\n',
    },
    {
      repository_relative_path: "modules/ledger/normalize.cjs",
      content:
        'exports.normalizeLabel = function () { throw new Error("pending"); };\n',
    },
    {
      repository_relative_path: "validation/shape.cjs",
      content:
        'const assert = require("node:assert/strict");\nconst { normalizeLabel } = require("../modules/ledger/normalize.cjs");\nassert.equal(normalizeLabel("alpha"), "+ALPHA");\n',
    },
    {
      repository_relative_path: "validation/edge.cjs",
      content:
        'const assert = require("node:assert/strict");\nconst { normalizeLabel } = require("../modules/ledger/normalize.cjs");\nassert.throws(() => normalizeLabel());\n',
    },
  ],
  predecessor_plan: predecessorPlan({
    executor: "executor-quartz-p0",
    operation_contract: quartzOperationContract,
  }),
  source_drift_writes: [
    {
      repository_relative_path: "inventory/marks.cjs",
      content: 'exports.mark = "@";\n',
    },
    {
      repository_relative_path: "validation/shape.cjs",
      content:
        'const assert = require("node:assert/strict");\nconst { normalizeLabel } = require("../modules/ledger/normalize.cjs");\nassert.equal(normalizeLabel("alpha"), "@ALPHA");\n',
    },
    {
      repository_relative_path: "validation/edge.cjs",
      content:
        'const assert = require("node:assert/strict");\nconst { normalizeLabel } = require("../modules/ledger/normalize.cjs");\nassert.equal(normalizeLabel(" beta "), "@BETA");\nassert.throws(() => normalizeLabel());\n',
    },
  ],
  successor_plans: [
    trainingPlan({
      executor: "executor-quartz-s1",
      operation_contract: quartzOperationContract,
      condition: "exact_current_continuity",
      holdout_variant: "strongest_equal_budget_baseline",
      candidate_intervention_mode: "no_candidate",
      selected: ["quartz-current", "quartz-incomplete", "quartz-old"],
      excluded: ["quartz-regime"],
      stale: null,
      intervention: "quartz-intervention-baseline",
    }),
    trainingPlan({
      executor: "executor-quartz-s2",
      operation_contract: quartzOperationContract,
      condition: "exact_current_continuity",
      holdout_variant: "candidate_present",
      candidate_intervention_mode: "all_frozen_candidate_components",
      selected: ["quartz-current", "quartz-incomplete", "quartz-old"],
      excluded: ["quartz-regime"],
      stale: null,
      intervention: "quartz-intervention-candidate",
    }),
    trainingPlan({
      executor: "executor-quartz-s3",
      operation_contract: quartzOperationContract,
      condition: "exact_current_continuity",
      holdout_variant: "candidate_component_ablation",
      candidate_intervention_mode: "frozen_candidate_minus_last_component",
      selected: ["quartz-current", "quartz-incomplete", "quartz-old"],
      excluded: ["quartz-regime"],
      stale: null,
      intervention: "quartz-intervention-ablation",
    }),
    trainingPlan({
      executor: "executor-quartz-s4",
      operation_contract: quartzOperationContract,
      condition: "stale_or_regime_shift_continuity",
      holdout_variant: "stale_or_reset",
      candidate_intervention_mode: "no_candidate",
      selected: ["quartz-current", "quartz-regime"],
      excluded: ["quartz-old", "quartz-incomplete"],
      stale: "quartz-regime",
      intervention: "quartz-intervention-reset",
    }),
  ],
  current_source_relative_paths: [
    "inventory/marks.cjs",
    "validation/edge.cjs",
    "validation/shape.cjs",
  ],
  required_checks: [
    { check_id: "quartz-shape-contract", oracle_relative_path: "validation/shape.cjs" },
    { check_id: "quartz-edge-contract", oracle_relative_path: "validation/edge.cjs" },
  ],
  source_currentness_check_id: "quartz-shape-contract",
  expected_success_changed_paths: ["modules/ledger/normalize.cjs"],
  expected_success_writes: [
    {
      repository_relative_path: "modules/ledger/normalize.cjs",
      content:
        'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
    },
  ],
  negative_space_guards: [
    {
      guard_id: "quartz-implicit-label",
      repository_relative_path: "modules/ledger/normalize.cjs",
      forbidden_fragment: '?? "UNKNOWN"',
      guarded_status: "retracted",
    },
  ],
  materials: [
    material(
      "quartz-common",
      "common_task_evidence",
      "current",
      "The task binds one ledger normalizer to two local validation programs.",
    ),
    material(
      "quartz-current",
      "continuation_material",
      "current",
      "The inventory mark changed and remains the current formatting source.",
    ),
    material(
      "quartz-incomplete",
      "continuation_material",
      "incomplete",
      "Whitespace and missing-label behavior still require objective validation.",
    ),
    material(
      "quartz-old",
      "excluded_or_ablated_material",
      "retracted",
      "Implicit missing-label substitution is no longer an admissible behavior.",
    ),
    material(
      "quartz-regime",
      "stale_relation",
      "stale",
      "The earlier label convention belongs to the prior inventory regime.",
    ),
    ...["baseline", "candidate", "ablation", "reset"].map((arm) =>
      material(
        `quartz-intervention-${arm}`,
        "intervention_provenance",
        "current",
        `Opaque frozen holdout assignment provenance quartz ${arm}.`,
      ),
    ),
  ],
  evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
  budget: SHARED_BUDGET,
  };
}

function syntheticFixtureOutputV01(input: {
  executor: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"] | null;
  holdout_variant: CommissionedWorkSuccessorPlanSourceV01["holdout_variant"];
  writes: CommissionedWorkSyntheticFixtureOutputV01["writes"];
  claimed_complete: boolean;
}): CommissionedWorkSyntheticFixtureOutputV01 {
  return {
    output_version: "commissioned_work_synthetic_fixture_output.v0.1",
    output_id: `synthetic-output-${input.executor}`,
    case_id: fixtureCaseIdV01(input.executor),
    executor_role_id: input.executor,
    episode_role: input.episode_role,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    writes: input.writes,
    terminal_outcome: "completed",
    executor_claimed_complete: input.claimed_complete,
    experiment_class: COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
    execution_evidence_class:
      COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
    expected_mechanics_response: true,
    commissioned_behavioral_evidence: false,
    part_of_task_context_packet: false,
    part_of_candidate_derivation_evidence: false,
    required_by_live_executor_path: false,
  };
}

function createSyntheticFixtureOutputsV01(): CommissionedWorkSyntheticFixtureOutputV01[] {
  return [
    syntheticFixtureOutputV01({
      executor: "executor-amber-p0",
      episode_role: "predecessor",
      condition: null,
      holdout_variant: null,
      claimed_complete: false,
      writes: [{
        repository_relative_path: "src/route-token.mjs",
        content: 'export function routeToken(key, id) { return `${key}:${id}`; }\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-amber-s1",
      episode_role: "successor",
      condition: "exact_current_continuity",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "src/route-token.mjs",
        content: 'import { separator } from "./channel.mjs";\nexport function routeToken(key, id) { return `${key}${separator}${id}`; }\n',
      }],
    }),
    ...["s2", "s3", "s4"].map((slot, index) =>
      syntheticFixtureOutputV01({
        executor: `executor-amber-${slot}`,
        episode_role: "successor",
        condition: ([
          "matched_ablation",
          "stale_or_regime_shift_continuity",
          "zero_continuation_control",
        ] as const)[index]!,
        holdout_variant: null,
        claimed_complete: true,
        writes: [{
          repository_relative_path: "src/route-token.mjs",
          content: 'export function routeToken(key, id) { return [key, id].join(":"); }\n',
        }],
      }),
    ),
    syntheticFixtureOutputV01({
      executor: "executor-cobalt-p0",
      episode_role: "predecessor",
      condition: null,
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "lib/quota-window.mjs",
        content: "export function accepts(value) { return value < 10; }\n",
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-cobalt-s1",
      episode_role: "successor",
      condition: "exact_current_continuity",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "lib/quota-window.mjs",
        content: 'import { limit } from "../config/window.mjs";\nexport function accepts(value) { return value <= limit; }\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-cobalt-s2",
      episode_role: "successor",
      condition: "matched_ablation",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "lib/quota-window.mjs",
        content: 'import { limit } from "../config/window.mjs";\nexport function accepts(value) { return value < limit; }\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-cobalt-s3",
      episode_role: "successor",
      condition: "stale_or_regime_shift_continuity",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "lib/quota-window.mjs",
        content: "export function accepts(value) { return Number(value) < 10; }\n",
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-cobalt-s4",
      episode_role: "successor",
      condition: "zero_continuation_control",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "lib/quota-window.mjs",
        content: "export function accepts(value) { return value <= 10; }\n",
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-cedar-p0",
      episode_role: "predecessor",
      condition: null,
      holdout_variant: null,
      claimed_complete: false,
      writes: [{
        repository_relative_path: "engine/resolve-mode.mjs",
        content: 'export function resolveMode(name) { if (name === "hot") return "fast"; throw new Error("unknown"); }\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-cedar-s1",
      episode_role: "successor",
      condition: "exact_current_continuity",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "engine/resolve-mode.mjs",
        content: 'import { catalog } from "./mode-catalog.mjs";\nexport function resolveMode(name) { if (!Object.hasOwn(catalog, name)) throw new Error("unknown"); return catalog[name]; }\n',
      }],
    }),
    ...["s2", "s3"].map((slot, index) =>
      syntheticFixtureOutputV01({
        executor: `executor-cedar-${slot}`,
        episode_role: "successor",
        condition: ([
          "matched_ablation",
          "stale_or_regime_shift_continuity",
        ] as const)[index]!,
        holdout_variant: null,
        claimed_complete: true,
        writes: [{
          repository_relative_path: "engine/resolve-mode.mjs",
          content: 'import { catalog } from "./mode-catalog.mjs";\nexport function resolveMode(name) { return catalog[name] ?? "default"; }\n',
        }],
      }),
    ),
    syntheticFixtureOutputV01({
      executor: "executor-cedar-s4",
      episode_role: "successor",
      condition: "zero_continuation_control",
      holdout_variant: null,
      claimed_complete: true,
      writes: [{
        repository_relative_path: "engine/resolve-mode.mjs",
        content: 'export function resolveMode(name) { switch (name) { case "hot": return "fast"; default: throw new Error("unknown"); } }\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-quartz-p0",
      episode_role: "predecessor",
      condition: null,
      holdout_variant: null,
      claimed_complete: false,
      writes: [{
        repository_relative_path: "modules/ledger/normalize.cjs",
        content: 'exports.normalizeLabel = function (value) { return "+" + (value ?? "UNKNOWN").toUpperCase(); };\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-quartz-s1",
      episode_role: "successor",
      condition: "exact_current_continuity",
      holdout_variant: "strongest_equal_budget_baseline",
      claimed_complete: true,
      writes: [{
        repository_relative_path: "modules/ledger/normalize.cjs",
        content: 'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { return mark + (value ?? "UNKNOWN").trim().toUpperCase(); };\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-quartz-s2",
      episode_role: "successor",
      condition: "exact_current_continuity",
      holdout_variant: "candidate_present",
      claimed_complete: true,
      writes: [{
        repository_relative_path: "modules/ledger/normalize.cjs",
        content: 'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-quartz-s3",
      episode_role: "successor",
      condition: "exact_current_continuity",
      holdout_variant: "candidate_component_ablation",
      claimed_complete: true,
      writes: [{
        repository_relative_path: "modules/ledger/normalize.cjs",
        content: 'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string") throw new Error("label required"); return mark + value.toUpperCase(); };\n',
      }],
    }),
    syntheticFixtureOutputV01({
      executor: "executor-quartz-s4",
      episode_role: "successor",
      condition: "stale_or_regime_shift_continuity",
      holdout_variant: "stale_or_reset",
      claimed_complete: true,
      writes: [{
        repository_relative_path: "modules/ledger/normalize.cjs",
        content: 'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
      }],
    }),
  ];
}

export function createCommissionedControlledWorkFamilySourceV01(): BuildCommissionedWorkFamilyManifestInputV01 {
  const { training_cases: trainingCases } =
    createCommissionedControlledWorkTrainingOnlyFamilyV01();
  return structuredClone({
    family_id: COMMISSIONED_WORKBENCH_FIXTURE_FAMILY_ID_V01,
    workspace_id: "workspace-cw1-controlled",
    task_family_key: "repository-continuation-family-01",
    sealed_at: "2026-08-27T00:00:00.000Z",
    construction_cutoff: "2026-08-27T01:00:00.000Z",
    evaluator_version: COMMISSIONED_WORKBENCH_FIXTURE_EVALUATOR_VERSION_V01,
    hypothesis:
      "Bounded source-linked continuity may improve later repository outcomes under controlled recurrence without granting authority.",
    task_author_role_id: "role-cw1-corpus-builder",
    outcome_evaluator_role_id: "role-cw1-objective-evaluator",
    consolidation_assessor_role_id: "role-cw1-consolidation-assessor",
    training_cases: trainingCases,
    holdout_case: createQuartzCaseV01(),
  });
}


export function createCommissionedControlledWorkSyntheticFixtureOutputsV01(): CommissionedWorkSyntheticFixtureOutputV01[] {
  return structuredClone(createSyntheticFixtureOutputsV01());
}
