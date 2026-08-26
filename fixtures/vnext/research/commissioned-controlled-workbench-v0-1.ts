import type { BuildCommissionedWorkFamilyManifestInputV01 } from "@/lib/vnext/commissioned-controlled-workbench";
import type {
  CommissionedWorkCaseSourceV01,
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
  provider_call_limit: 0,
  network_call_limit: 0,
} as const;

function material(
  material_id: string,
  material_kind: CommissionedWorkSourceMaterialV01["material_kind"],
  lifecycle_status: CommissionedWorkSourceMaterialV01["lifecycle_status"],
  content: string,
): CommissionedWorkSourceMaterialV01 {
  return { material_id, material_kind, lifecycle_status, content };
}

function trainingPlan(input: {
  condition: CommissionedWorkSuccessorPlanSourceV01["condition"];
  executor: string;
  writes: CommissionedWorkSuccessorPlanSourceV01["writes"];
  selected: string[];
  excluded: string[];
  stale: string | null;
  intervention: string;
  referenced: string[];
  claimed_complete?: boolean;
}): CommissionedWorkSuccessorPlanSourceV01 {
  return {
    executor_role_id: input.executor,
    claimed_complete: input.claimed_complete ?? true,
    writes: input.writes,
    referenced_material_ids: input.referenced,
    condition: input.condition,
    holdout_variant: null,
    candidate_intervention_mode: "not_applicable",
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
  predecessor_plan: {
    executor_role_id: "executor-amber-p0",
    claimed_complete: false,
    writes: [
      {
        repository_relative_path: "src/route-token.mjs",
        content:
          'export function routeToken(key, id) { return `${key}:${id}`; }\n',
      },
    ],
    referenced_material_ids: ["amber-common"],
  },
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
      referenced: ["amber-common", "amber-current"],
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
      referenced: ["amber-common"],
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
      referenced: ["amber-common", "amber-old"],
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
      referenced: ["amber-common"],
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
  predecessor_plan: {
    executor_role_id: "executor-cobalt-p0",
    claimed_complete: true,
    writes: [
      {
        repository_relative_path: "lib/quota-window.mjs",
        content: "export function accepts(value) { return value < 10; }\n",
      },
    ],
    referenced_material_ids: ["cobalt-common", "cobalt-implemented"],
  },
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
      referenced: ["cobalt-common", "cobalt-current", "cobalt-incomplete"],
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
      referenced: ["cobalt-common", "cobalt-current"],
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
      referenced: ["cobalt-common", "cobalt-implemented"],
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
      referenced: ["cobalt-common"],
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
  predecessor_plan: {
    executor_role_id: "executor-cedar-p0",
    claimed_complete: false,
    writes: [
      {
        repository_relative_path: "engine/resolve-mode.mjs",
        content:
          'export function resolveMode(name) { if (name === "hot") return "fast"; throw new Error("unknown"); }\n',
      },
    ],
    referenced_material_ids: ["cedar-common", "cedar-rejection"],
  },
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
      referenced: ["cedar-common", "cedar-current", "cedar-rejection"],
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
      referenced: ["cedar-common", "cedar-current"],
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
      referenced: ["cedar-common", "cedar-fallback"],
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
      referenced: ["cedar-common"],
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
  predecessor_plan: {
    executor_role_id: "executor-quartz-p0",
    claimed_complete: false,
    writes: [
      {
        repository_relative_path: "modules/ledger/normalize.cjs",
        content:
          'exports.normalizeLabel = function (value) { return "+" + (value ?? "UNKNOWN").toUpperCase(); };\n',
      },
    ],
    referenced_material_ids: ["quartz-common", "quartz-old"],
  },
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
    {
      executor_role_id: "executor-quartz-s1",
      claimed_complete: true,
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { return mark + (value ?? "UNKNOWN").trim().toUpperCase(); };\n',
        },
      ],
      referenced_material_ids: [
        "quartz-common",
        "quartz-current",
        "quartz-incomplete",
        "quartz-old",
      ],
      condition: "exact_current_continuity",
      holdout_variant: "strongest_equal_budget_baseline",
      candidate_intervention_mode: "no_candidate",
      selected_material_ids: ["quartz-current", "quartz-incomplete", "quartz-old"],
      excluded_material_ids: ["quartz-regime"],
      stale_relation_material_id: null,
      intervention_provenance_material_id: "quartz-intervention-baseline",
    },
    {
      executor_role_id: "executor-quartz-s2",
      claimed_complete: true,
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
        },
      ],
      referenced_material_ids: [
        "quartz-common",
        "quartz-current",
        "quartz-incomplete",
        "quartz-old",
      ],
      condition: "exact_current_continuity",
      holdout_variant: "candidate_present",
      candidate_intervention_mode: "all_frozen_candidate_components",
      selected_material_ids: ["quartz-current", "quartz-incomplete", "quartz-old"],
      excluded_material_ids: ["quartz-regime"],
      stale_relation_material_id: null,
      intervention_provenance_material_id: "quartz-intervention-candidate",
    },
    {
      executor_role_id: "executor-quartz-s3",
      claimed_complete: true,
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string") throw new Error("label required"); return mark + value.toUpperCase(); };\n',
        },
      ],
      referenced_material_ids: [
        "quartz-common",
        "quartz-current",
        "quartz-incomplete",
        "quartz-old",
      ],
      condition: "exact_current_continuity",
      holdout_variant: "candidate_component_ablation",
      candidate_intervention_mode: "frozen_candidate_minus_last_component",
      selected_material_ids: ["quartz-current", "quartz-incomplete", "quartz-old"],
      excluded_material_ids: ["quartz-regime"],
      stale_relation_material_id: null,
      intervention_provenance_material_id: "quartz-intervention-ablation",
    },
    {
      executor_role_id: "executor-quartz-s4",
      claimed_complete: true,
      writes: [
        {
          repository_relative_path: "modules/ledger/normalize.cjs",
          content:
            'const { mark } = require("../../inventory/marks.cjs");\nexports.normalizeLabel = function (value) { if (typeof value !== "string" || value.trim() === "") throw new Error("label required"); return mark + value.trim().toUpperCase(); };\n',
        },
      ],
      referenced_material_ids: ["quartz-common", "quartz-current", "quartz-regime"],
      condition: "stale_or_regime_shift_continuity",
      holdout_variant: "stale_or_reset",
      candidate_intervention_mode: "no_candidate",
      selected_material_ids: ["quartz-current", "quartz-regime"],
      excluded_material_ids: ["quartz-old", "quartz-incomplete"],
      stale_relation_material_id: "quartz-regime",
      intervention_provenance_material_id: "quartz-intervention-reset",
    },
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
