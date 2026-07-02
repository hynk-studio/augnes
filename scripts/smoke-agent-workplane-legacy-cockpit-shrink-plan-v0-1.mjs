#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const smokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const inventoryDoc =
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md";
const absorptionMapDoc =
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md";
const metricsDoc = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const dogfoodDoc = "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";

const requiredDocs = [
  shrinkPlanDoc,
  indexDoc,
  agentWorkplaneDoc,
  inventoryDoc,
  absorptionMapDoc,
  metricsDoc,
  dogfoodDoc,
];

const requiredFiles = [
  ...requiredDocs,
  packageJsonFile,
  smokeFile,
  legacyCompatibilityPanelFile,
  augnesCockpitFile,
  agentWorkplaneFile,
];

const shrinkPlanSliceFiles = [
  shrinkPlanDoc,
  smokeFile,
  packageJsonFile,
  indexDoc,
  agentWorkplaneDoc,
  inventoryDoc,
  absorptionMapDoc,
  metricsDoc,
  dogfoodDoc,
];

const existingSmokeAllowlistFiles = [
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
];

const followOnWorkplaneNativeBrowserRegressionFiles = [
  "types/workplane-browser-regression.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "scripts/run-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAgentWorkplaneBridgeTraceDetailFiles = [
  "types/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "components/workplane/source-ref-bridge-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];
const followOnAgentWorkplaneReviewMemoryDetailFiles = [
  "types/workplane-review-memory-detail.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "components/workplane/review-memory-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAgentWorkplaneRunPostmortemDetailFiles = [
  "types/workplane-run-postmortem-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "components/workplane/run-postmortem-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];


const allowedChangedFiles = new Set([
  ...shrinkPlanSliceFiles,
  ...existingSmokeAllowlistFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnAgentWorkplaneRunPostmortemDetailFiles,
]);

const requiredCapabilities = [
  "work_brief",
  "handoff",
  "perspective",
  "bridge",
  "operator_visibility",
  "work_run_visibility",
  "source_ref_visibility",
  "review_memory_proposal_visibility",
  "validation_smoke_visibility",
  "legacy_local_ui_controls",
];

const requiredTableFields = [
  "capability_id",
  "legacy_surface",
  "native_replacement",
  "native_panel_or_node_ids",
  "compatibility_path",
  "current_status",
  "shrink_readiness",
  "required_evidence_before_removal",
  "required_smoke_or_browser_coverage",
  "guidebrief_debug_path",
  "metrics_or_dogfood_signal",
  "recommended_action",
];

const allowedShrinkReadinessValues = [
  "not_ready",
  "watch",
  "candidate_after_more_dogfood",
  "candidate_after_browser_regression",
  "candidate_after_metric_threshold",
  "ready_for_future_removal_plan",
  "obsolete_with_rationale",
];

const allowedRecommendedActions = [
  "retain_compatibility",
  "add_native_absorption",
  "add_browser_regression",
  "add_metric_baseline",
  "add_dogfood_baseline",
  "plan_future_removal_pr",
  "mark_obsolete_later",
  "no_action",
];

const requiredGates = [
  "Gate 0: compatibility path present",
  "Gate 1: native replacement exists",
  "Gate 2: stable panel/node contract and source refs exist",
  "Gate 3: GuideBrief debug path exists",
  "Gate 4: intent projection can focus/recover the capability context",
  "Gate 5: metrics show acceptable review burden / resume latency / stale",
  "Gate 6: dogfood shows no useful capability loss",
  "Gate 7: browser smoke validates replacement and compatibility rollback",
  "Gate 8: explicit human approval for removal PR",
];

const textByFile = loadTextByFile(requiredFiles);
const shrinkPlanText = textByFile.get(shrinkPlanDoc);
const indexText = textByFile.get(indexDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const inventoryText = textByFile.get(inventoryDoc);
const absorptionMapText = textByFile.get(absorptionMapDoc);
const metricsText = textByFile.get(metricsDoc);
const dogfoodText = textByFile.get(dogfoodDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const legacyCompatibilityPanelText = textByFile.get(legacyCompatibilityPanelFile);
const augnesCockpitText = textByFile.get(augnesCockpitFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-legacy-cockpit-shrink-plan-v0-1",
  expectedCommand:
    "node scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
});

assertDocsAndPointers();
const tableRows = parseShrinkPlanTable(shrinkPlanText);
assertCapabilityRows(tableRows);
assertAllowedValues(tableRows);
assertCompatibilityStillRendered();
const changedFilesBoundary = assertChangedFilesWithinAllowedScope();
assertNoProductBehaviorFilesChanged();
assertNoSourceDeletion();
assertNoRouteOrAuthorityPathAdded();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-legacy-cockpit-shrink-plan-v0-1",
      pass: true,
      shrink_plan_doc_exists: true,
      package_script_checked: true,
      index_pointer_checked: true,
      backlink_docs_checked: true,
      required_capabilities_checked: requiredCapabilities,
      required_table_fields_checked: requiredTableFields,
      allowed_shrink_readiness_values_checked: allowedShrinkReadinessValues,
      allowed_recommended_action_values_checked: allowedRecommendedActions,
      shrink_gates_checked: requiredGates.length,
      cockpit_shrink_readiness_not_blanket_go_signal_checked: true,
      future_deletion_requires_separate_pr_checked: true,
      metrics_signal_boundary_checked: true,
      dogfood_evidence_boundary_checked: true,
      compatibility_components_present_checked: true,
      legacy_cockpit_panel_render_checked: true,
      no_product_ui_behavior_file_changes_checked: true,
      no_route_or_authority_added_checked: true,
      no_runner_or_persistence_authority_added_checked: true,
      no_source_deletion_checked: true,
      deltabatch_identity_separation_checked: true,
      recommendations_checked: true,
      changed_files_boundary: changedFilesBoundary,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-legacy-cockpit-shrink-plan-v0-1");

function assertDocsAndPointers() {
  for (const doc of [
    indexText,
    agentWorkplaneDocText,
    inventoryText,
    absorptionMapText,
    metricsText,
    dogfoodText,
  ]) {
    assertContainsAll(doc, [shrinkPlanDoc], {
      label: "shrink plan backlink docs",
    });
  }

  assertContainsAll(
    shrinkPlanText,
    [
      "Why This Plan Exists",
      "This is not a deletion PR",
      "No Legacy Cockpit functionality is deleted or shrunk in this PR.",
      "No compatibility path is removed in this PR.",
      "No UI behavior is changed in this PR.",
      "Future deletion requires a separate PR.",
      "Current shrink readiness is not a blanket go-signal yet.",
      "`cockpit_shrink_readiness`: `needs_review`",
      "metrics Cockpit shrink readiness: `watch`",
      "`resume_latency` still needs repeated baseline data",
      "`review_burden` still needs repeated baseline data",
      "Metrics are signals, not shrink authority.",
      "Dogfood reports are evidence, not shrink authority.",
      "Legacy Cockpit removal only in a future dedicated removal PR",
      "another dogfood/metrics baseline if readiness remains `watch` / `needs_review`",
      "Browser Regression for Native Workplane Replacement v0.1",
      "Legacy Cockpit Shrink Candidate v0.1",
      "no route",
      "no API write route",
      "no server action",
      "no chat composer",
      "no provider/OpenAI call",
      "no GitHub call or actuation",
      "no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy",
      "no runner execution",
      "no runner tick",
      "no runner recovery write",
      "no scheduled runner behavior",
      "no product DB write or persistence",
      "no proof/evidence write",
      "no durable memory apply",
      "no Perspective apply",
      "no delta auto-apply",
      "no localStorage/sessionStorage durable view mode",
      "data-workplane-metrics-panel=\"v0.1\"",
      "data-guide-workplane-debug-panel=\"v0.1\"",
      "data-guide-intent-projection-panel=\"v0.1\"",
      "data-workplane-intent-mode-panel=\"v0.1\"",
      "data-workplane-panel-id=\"delta_projection\"",
      "data-workplane-panel-id=\"projected_delta_batch\"",
      "data-workplane-panel-id=\"delta_batch\"",
      "data-workplane-panel-id=\"legacy_cockpit_compatibility\"",
      "delta_projection` / `perspective_delta",
      "projected_delta_batch` / `perspective_delta",
      "delta_batch` / `runner_delta_batch",
    ],
    { label: shrinkPlanDoc },
  );

  assertContainsAll(shrinkPlanText, requiredGates, { label: shrinkPlanDoc });
}

function parseShrinkPlanTable(text) {
  const lines = text.split("\n");
  const headerIndex = lines.findIndex(
    (line) =>
      line.trim().startsWith("|") &&
      splitMarkdownRow(line).includes("capability_id") &&
      splitMarkdownRow(line).includes("shrink_readiness"),
  );
  assert(headerIndex >= 0, "Expected capability shrink readiness table");
  const headers = splitMarkdownRow(lines[headerIndex]);
  for (const field of requiredTableFields) {
    assert(headers.includes(field), `Shrink plan table missing ${field}`);
  }

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const values = splitMarkdownRow(line);
    if (values.length !== headers.length) continue;
    rows.push(
      Object.fromEntries(headers.map((header, index) => [header, values[index]])),
    );
  }

  assert(rows.length >= requiredCapabilities.length, "Expected capability rows");
  return rows;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/^`|`$/g, ""));
}

function assertCapabilityRows(rows) {
  const ids = new Set(rows.map((row) => row.capability_id));
  for (const capabilityId of requiredCapabilities) {
    assert(ids.has(capabilityId), `Missing shrink plan capability ${capabilityId}`);
  }

  for (const row of rows) {
    for (const field of requiredTableFields) {
      assert(
        row[field] && !["-", "none", "tbd"].includes(row[field].toLowerCase()),
        `${row.capability_id} must record ${field}`,
      );
    }
  }
}

function assertAllowedValues(rows) {
  for (const value of allowedShrinkReadinessValues) {
    assert(
      shrinkPlanText.includes(value),
      `Shrink plan must include shrink_readiness value ${value}`,
    );
  }
  for (const value of allowedRecommendedActions) {
    assert(
      shrinkPlanText.includes(value),
      `Shrink plan must include recommended_action value ${value}`,
    );
  }

  const readiness = new Set(allowedShrinkReadinessValues);
  const actions = new Set(allowedRecommendedActions);
  for (const row of rows) {
    assert(
      readiness.has(row.shrink_readiness),
      `Invalid shrink_readiness for ${row.capability_id}: ${row.shrink_readiness}`,
    );
    assert(
      actions.has(row.recommended_action),
      `Invalid recommended_action for ${row.capability_id}: ${row.recommended_action}`,
    );
  }
}

function assertCompatibilityStillRendered() {
  assertContainsAll(legacyCompatibilityPanelText, [
    "LegacyCockpitCompatibilityPanel",
    'data-workplane-panel-id="legacy_cockpit_compatibility"',
    "Legacy Cockpit remains reachable",
  ], { label: legacyCompatibilityPanelFile });
  assertContainsAll(augnesCockpitText, ["export function AugnesCockpit"], {
    label: augnesCockpitFile,
  });
  assertContainsAll(agentWorkplaneText, [
    "LegacyCockpitCompatibilityPanel",
    "AugnesCockpit",
    "<LegacyCockpitCompatibilityPanel>",
    "<AugnesCockpit />",
  ], { label: agentWorkplaneFile });
}

function assertChangedFilesWithinAllowedScope() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Legacy Cockpit shrink plan v0.1: ${file}`,
    );
  }

  return {
    files,
    working_tree_checked: workingTree.checked,
    cached_checked: cached.checked,
    base_ref: baseRange.base_ref,
    base_range_checked: baseRange.checked,
    untracked_checked: true,
  };
}

function assertNoProductBehaviorFilesChanged() {
  const changedFiles = allChangedFiles();
  const forbiddenProductPrefixes = [
    "app/",
    "components/",
    "lib/",
    "types/",
    "fixtures/",
    "db/",
    "migrations/",
    "apps/",
  ];

  for (const file of changedFiles) {
    if (
      followOnWorkplaneNativeBrowserRegressionFiles.includes(file) ||
      followOnAgentWorkplaneBridgeTraceDetailFiles.includes(file) ||
      (followOnAgentWorkplaneReviewMemoryDetailFiles.includes(file) ||
        followOnAgentWorkplaneRunPostmortemDetailFiles.includes(file))
    ) {
      continue;
    }
    assert(
      !forbiddenProductPrefixes.some((prefix) => file.startsWith(prefix)),
      `No product UI/runtime/type/data behavior file may change in this planning slice: ${file}`,
    );
  }
}

function assertNoSourceDeletion() {
  const deletedFiles = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "--diff-filter=D", "HEAD"])
      .files,
    ...collectGitDiffFiles([
      "diff",
      "--name-only",
      "--diff-filter=D",
      "origin/main...HEAD",
    ]).files,
  ]);
  assert.deepEqual(deletedFiles, [], "No source file deletion is allowed");
}

function assertNoRouteOrAuthorityPathAdded() {
  const changedFiles = allChangedFiles();
  const addedFiles = collectNameStatusAddedFiles();

  for (const file of addedFiles) {
    assert(!file.startsWith("app/"), `No product route is added: ${file}`);
    assert(!/\/api\//.test(file), `No API route is added: ${file}`);
  }

  const forbiddenChangedPathPatterns = [
    /^app\//,
    /^components\//,
    /^lib\//,
    /^types\//,
    /^fixtures\//,
    /^db\//,
    /^migrations\//,
    /^apps\//,
    /(^|\/)(provider|providers|openai|github|codex|runner|scheduler)(\/|$)/i,
    /(^|\/)(proof|evidence|memory|persistence)(\/|$)/i,
  ];

  for (const file of changedFiles) {
    if (
      followOnWorkplaneNativeBrowserRegressionFiles.includes(file) ||
      followOnAgentWorkplaneBridgeTraceDetailFiles.includes(file) ||
      (followOnAgentWorkplaneReviewMemoryDetailFiles.includes(file) ||
        followOnAgentWorkplaneRunPostmortemDetailFiles.includes(file))
    ) {
      continue;
    }
    for (const pattern of forbiddenChangedPathPatterns) {
      assert(
        !pattern.test(file),
        `No route, execution, runner, persistence, proof/evidence, memory, or external authority path may change: ${file}`,
      );
    }
  }
}

function allChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);
}

function collectNameStatusAddedFiles() {
  const outputs = [
    gitOutput(["diff", "--name-status"]),
    gitOutput(["diff", "--cached", "--name-status"]),
    gitOutput(["diff", "--name-status", "origin/main...HEAD"]),
  ];
  return uniqueSorted(
    outputs
      .flatMap((output) => output.split("\n"))
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => /^A\s+/.test(line))
      .map((line) => line.replace(/^A\s+/, "")),
  );
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return "";
  }
}
