import type { BuildCommissionedWorkFamilyManifestInputV01 } from "@/lib/vnext/commissioned-controlled-workbench";
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

const syntheticFixtureOutputsV01: CommissionedWorkSyntheticFixtureOutputV01[] = [];

function fixtureCaseIdV01(executorRoleId: string): string {
  if (executorRoleId.startsWith("executor-amber-")) return "case-amber-17";
  if (executorRoleId.startsWith("executor-cobalt-")) return "case-cobalt-29";
  if (executorRoleId.startsWith("executor-cedar-")) return "case-cedar-41";
  if (executorRoleId.startsWith("executor-quartz-")) return "case-quartz-83";
  throw new Error("commissioned_work_fixture_executor_case_unknown");
}

function operationContract(
  writes: CommissionedWorkSyntheticFixtureOutputV01["writes"],
): CommissionedWorkEpisodePlanSourceV01["operation_contract"] {
  return {
    allowed_operation_categories: ["repository_file_edit"],
    allowed_repository_relative_paths: writes.map(
      (write) => write.repository_relative_path,
    ),
    max_changed_files: writes.length,
    max_commands: 8,
    provider_authority_source: "separate_live_authorization_required",
    provider_calls_authorized_by_operation_contract: false,
    external_network_call_limit: 0,
    outside_root_write_allowed: false,
    github_mutation_allowed: false,
    semantic_authority_allowed: false,
  };
}

function registerSyntheticFixtureOutputV01(input: {
  executor: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"] | null;
  holdout_variant: CommissionedWorkSuccessorPlanSourceV01["holdout_variant"];
  writes: CommissionedWorkSyntheticFixtureOutputV01["writes"];
  claimed_complete: boolean;
}): void {
  const caseId = fixtureCaseIdV01(input.executor);
  syntheticFixtureOutputsV01.push({
    output_version: "commissioned_work_synthetic_fixture_output.v0.1",
    output_id: `synthetic-output-${input.executor}`,
    case_id: caseId,
    executor_role_id: input.executor,
    episode_role: input.episode_role,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    writes: input.writes,
    terminal_outcome:
      input.episode_role === "predecessor" ? "blocked" : "completed",
    executor_claimed_complete: input.claimed_complete,
    experiment_class: COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
    execution_evidence_class:
      COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
    expected_mechanics_response: true,
    commissioned_behavioral_evidence: false,
    part_of_task_context_packet: false,
    part_of_candidate_derivation_evidence: false,
    required_by_live_executor_path: false,
  });
}

function predecessorPlan(input: {
  executor: string;
  writes: CommissionedWorkSyntheticFixtureOutputV01["writes"];
  claimed_complete: boolean;
}): CommissionedWorkEpisodePlanSourceV01 {
  registerSyntheticFixtureOutputV01({
    ...input,
    episode_role: "predecessor",
    condition: null,
    holdout_variant: null,
  });
  return {
    executor_role_id: input.executor,
    operation_contract: operationContract(input.writes),
  };
}

function trainingPlan(input: {
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"];
  executor: string;
  writes: CommissionedWorkSyntheticFixtureOutputV01["writes"];
  selected: string[];
  excluded: string[];
  stale: string | null;
  intervention: string;
  holdout_variant?: CommissionedWorkSuccessorPlanSourceV01["holdout_variant"];
  candidate_intervention_mode?: CommissionedWorkSuccessorPlanSourceV01["candidate_intervention_mode"];
  claimed_complete?: boolean;
}): CommissionedWorkSuccessorPlanSourceV01 {
  const holdoutVariant = input.holdout_variant ?? null;
  registerSyntheticFixtureOutputV01({
    executor: input.executor,
    episode_role: "successor",
    condition: input.condition,
    holdout_variant: holdoutVariant,
    writes: input.writes,
    claimed_complete: input.claimed_complete ?? true,
  });
  return {
    executor_role_id: input.executor,
    operation_contract: operationContract(input.writes),
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
    claimed_complete: false,
    writes: [
      {
        repository_relative_path: "src/route-token.mjs",
        content:
          'export function routeToken(key, id) { return `${key}:${id}`; }\n',
      },
    ],
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
      writes: [
        {
          repository_relative_path: "src/route-token.mjs",
          content:
            'import { separator } from "./channel.mjs";\nexport function routeToken(key, id) { return `${key}${separator}${id}`; }\n',
        },
      ],
      selected: ["amber-current"],
      excluded: ["amber-old"],
      stale: null,
      intervention: "amber-intervention-exact",
    }),
    trainingPlan({
      condition: "matched_ablation",
      executor: "executor-amber-s2",
      writes: [
        {
          repository_relative_path: "src/route-token.mjs",
          content:
            'export function routeToken(key, id) { return [key, id].join(":"); }\n',
        },
      ],
      selected: [],
      excluded: ["amber-current", "amber-old"],
      stale: null,
      intervention: "amber-intervention-ablation",
    }),
    trainingPlan({
      condition: "stale_or_regime_shift_continuity",
      executor: "executor-amber-s3",
      writes: [
        {
          repository_relative_path: "src/route-token.mjs",
          content:
            'export function routeToken(key, id) { return [key, id].join(":"); }\n',
        },
      ],
      selected: ["amber-old"],
      excluded: ["amber-current"],
      stale: "amber-old",
      intervention: "amber-intervention-stale",
    }),
    trainingPlan({
      condition: "zero_continuation_control",
      executor: "executor-amber-s4",
      writes: [
        {
          repository_relative_path: "src/route-token.mjs",
          content:
            'export function routeToken(key, id) { return [key, id].join(":"); }\n',
        },
      ],
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
    claimed_complete: true,
    writes: [
      {
        repository_relative_path: "lib/quota-window.mjs",
        content: "export function accepts(value) { return value < 10; }\n",
      },
    ],
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
      writes: [
        {
          repository_relative_path: "lib/quota-window.mjs",
          content:
            'import { limit } from "../config/window.mjs";\nexport function accepts(value) { return value <= limit; }\n',
        },
      ],
      selected: ["cobalt-current", "cobalt-incomplete"],
      excluded: ["cobalt-implemented"],
      stale: null,
      intervention: "cobalt-intervention-exact",
    }),
    trainingPlan({
      condition: "matched_ablation",
      executor: "executor-cobalt-s2",
      writes: [
        {
          repository_relative_path: "lib/quota-window.mjs",
          content:
            'import { limit } from "../config/window.mjs";\nexport function accepts(value) { return value < limit; }\n',
        },
      ],
      selected: ["cobalt-current"],
      excluded: ["cobalt-incomplete", "cobalt-implemented"],
      stale: null,
      intervention: "cobalt-intervention-ablation",
    }),
    trainingPlan({
      condition: "stale_or_regime_shift_continuity",
      executor: "executor-cobalt-s3",
      writes: [
        {
          repository_relative_path: "lib/quota-window.mjs",
          content: "export function accepts(value) { return Number(value) < 10; }\n",
        },
      ],
      selected: ["cobalt-implemented"],
      excluded: ["cobalt-current", "cobalt-incomplete"],
      stale: "cobalt-implemented",
      intervention: "cobalt-intervention-stale",
    }),
    trainingPlan({
      condition: "zero_continuation_control",
      executor: "executor-cobalt-s4",
      writes: [
        {
          repository_relative_path: "lib/quota-window.mjs",
          content: "export function accepts(value) { return value <= 10; }\n",
        },
      ],
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
    claimed_complete: false,
    writes: [
      {
        repository_relative_path: "engine/resolve-mode.mjs",
        content:
          'export function resolveMode(name) { if (name === "hot") return "fast"; throw new Error("unknown"); }\n',
      },
    ],
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
      writes: [
        {
          repository_relative_path: "engine/resolve-mode.mjs",
          content:
            'import { catalog } from "./mode-catalog.mjs";\nexport function resolveMode(name) { if (!Object.hasOwn(catalog, name)) throw new Error("unknown"); return catalog[name]; }\n',
        },
      ],
      selected: ["cedar-current", "cedar-rejection"],
      excluded: ["cedar-fallback"],
      stale: null,
      intervention: "cedar-intervention-exact",
    }),
    trainingPlan({
      condition: "matched_ablation",
      executor: "executor-cedar-s2",
      writes: [
        {
          repository_relative_path: "engine/resolve-mode.mjs",
          content:
            'import { catalog } from "./mode-catalog.mjs";\nexport function resolveMode(name) { return catalog[name] ?? "default"; }\n',
        },
      ],
      selected: ["cedar-current"],
      excluded: ["cedar-rejection", "cedar-fallback"],
      stale: null,
      intervention: "cedar-intervention-ablation",
    }),
    trainingPlan({
      condition: "stale_or_regime_shift_continuity",
      executor: "executor-cedar-s3",
      writes: [
        {
          repository_relative_path: "engine/resolve-mode.mjs",
          content:
            'import { catalog } from "./mode-catalog.mjs";\nexport function resolveMode(name) { return catalog[name] ?? "default"; }\n',
        },
      ],
      selected: ["cedar-fallback"],
      excluded: ["cedar-current", "cedar-rejection"],
      stale: "cedar-fallback",
      intervention: "cedar-intervention-stale",
    }),
    trainingPlan({
      condition: "zero_continuation_control",
      executor: "executor-cedar-s4",
      writes: [
        {
          repository_relative_path: "engine/resolve-mode.mjs",
          content:
            'export function resolveMode(name) { switch (name) { case "hot": return "fast"; default: throw new Error("unknown"); } }\n',
        },
      ],
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

const quartzCase: CommissionedWorkCaseSourceV01 = {
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
    claimed_complete: false,
    writes: [
      {
        repository_relative_path: "modules/ledger/normalize.cjs",
        content:
          'exports.normalizeLabel = function (value) { return "+" + (value ?? "UNKNOWN").toUpperCase(); };\n',
      },
    ],
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
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { return mark + (value ?? "UNKNOWN").trim().toUpperCase(); };\n',
        },
      ],
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
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
        },
      ],
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
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string") throw new Error("label required"); return mark + value.toUpperCase(); };\n',
        },
      ],
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
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
        },
      ],
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

export function createCommissionedControlledWorkFamilySourceV01(): BuildCommissionedWorkFamilyManifestInputV01 {
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
    training_cases: [amberCase, cobaltCase, cedarCase],
    holdout_case: quartzCase,
  });
}

export function createCommissionedControlledWorkSyntheticFixtureOutputsV01(): CommissionedWorkSyntheticFixtureOutputV01[] {
  return structuredClone(syntheticFixtureOutputsV01);
}
