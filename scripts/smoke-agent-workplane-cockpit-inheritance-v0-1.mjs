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

const inventoryDoc = "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md";
const absorptionMapDoc =
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs";

const requiredFiles = [
  inventoryDoc,
  absorptionMapDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const downstreamSmokeCompatibilityFiles = [
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnAgentWorkplaneNodeContractFiles = [
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "components/workplane/workplane-panel-shell.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "components/workplane/work-queue-panel.tsx",
  "components/workplane/current-perspective-workplane-panel.tsx",
  "components/workplane/delta-projection-workplane-panel.tsx",
  "components/workplane/review-queue-workplane-panel.tsx",
  "components/workplane/evidence-handoff-workplane-panel.tsx",
  "components/workplane/workplane-inspector.tsx",
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnWorkplaneRunnerDeltaBatchIntegrationFiles = [
  "lib/workplane/read-runner-delta-batches-for-workplane.ts",
  "components/workplane/runner-delta-batch-panel.tsx",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "lib/workplane/read-workplane-context.ts",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
];

const followOnGuideWorkplaneDebugContextFiles = [
  "types/guide-debug-context.ts",
  "lib/guide/guide-workplane-debug-context.ts",
  "components/guide/guide-workplane-debug-panel.tsx",
  "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnGuideBriefIntentProjectionFiles = [
  "types/workplane-intent-projection.ts",
  "lib/guide/workplane-intent-projection.ts",
  "lib/workplane/apply-workplane-view-projection.ts",
  "components/workplane/workplane-intent-mode-panel.tsx",
  "components/guide/guide-intent-projection-panel.tsx",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...downstreamSmokeCompatibilityFiles,
  ...followOnAgentWorkplaneNodeContractFiles,
  ...followOnWorkplaneRunnerDeltaBatchIntegrationFiles,
  ...followOnGuideWorkplaneDebugContextFiles,
  ...followOnGuideBriefIntentProjectionFiles,
]);

const validStatuses = new Set([
  "native_complete",
  "partially_native",
  "legacy_only_still_useful",
  "obsolete",
  "remove_later",
  "needs_native_absorption",
]);

const requiredInventoryCapabilities = [
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

const requiredInventoryFields = [
  "capability_id",
  "legacy_surface",
  "description",
  "why_agents_use_it",
  "current_native_replacement",
  "status",
  "source_refs",
  "validation_coverage",
  "recommended_next_action",
];

const requiredMapCapabilities = [
  "work_brief",
  "handoff",
  "perspective",
  "bridge",
  "operator_visibility",
  "runner_outputs",
  "postmortem",
  "trace_context",
];

const textByFile = loadTextByFile(requiredFiles);
const inventoryText = textByFile.get(inventoryDoc);
const mapText = textByFile.get(absorptionMapDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-cockpit-inheritance-v0-1",
  expectedCommand:
    "node scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
});

assertContainsAll(indexText, [inventoryDoc, absorptionMapDoc], {
  label: indexDoc,
});

assertContainsAll(
  inventoryText,
  [
    "Legacy Cockpit must not be removed until native replacement and validation exist.",
    "no provider/OpenAI call",
    "no GitHub execution behavior",
    "no Codex execution behavior",
    "no durable memory apply",
    "no Perspective apply",
    "no runner behavior",
  ],
  { label: inventoryDoc },
);

assertContainsAll(
  mapText,
  [
    "Legacy Cockpit must not be removed until native replacement and validation exist.",
    "Work Queue / Current Objective",
    "Handoff Builder / Handoff Capsule / Codex packet panel",
    "Current Perspective / Perspective Delta / Timeline context",
    "Source Ref Bridge / Trace Bridge",
    "Authority / Validation / Debug Inspector",
    "Runner State / DeltaBatch panel",
    "Run Postmortem panel",
    "Trace / Diagnostics panel",
    "no provider/OpenAI",
    "GitHub execution",
    "Codex execution",
    "durable memory apply",
    "Perspective apply",
  ],
  { label: absorptionMapDoc },
);

const inventoryRows = parseMarkdownTable(inventoryText, "capability_id");
const mapRows = parseMarkdownTable(mapText, "inventory_capability_id");

assertRequiredInventoryCapabilities(inventoryRows);
assertRequiredMapCapabilities(mapRows);
assertInventoryRowsHaveRequiredFields(inventoryRows);
assertEveryInventoryCapabilityHasValidStatus(inventoryRows);
assertUsefulCapabilitiesHaveInheritancePath(inventoryRows);
assertChangedFilesWithinAllowedScope();
assertNoSourceFileDeletion();
assertNoRuntimeAuthorityFilesChanged();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-cockpit-inheritance-v0-1",
      pass: true,
      inventory_doc_exists: true,
      absorption_map_doc_exists: true,
      package_script_checked: true,
      index_pointers_checked: true,
      required_inventory_capabilities_checked:
        requiredInventoryCapabilities,
      inventory_capability_count: inventoryRows.length,
      required_inventory_fields_checked: requiredInventoryFields,
      valid_statuses_checked: [...validStatuses],
      useful_inheritance_paths_checked: true,
      legacy_cockpit_removal_stopline_checked: true,
      no_source_file_deletion_checked: true,
      no_provider_openai_github_codex_execution_added: true,
      no_durable_memory_or_perspective_apply_added: true,
      no_new_runner_behavior_added: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-cockpit-inheritance-v0-1");

function parseMarkdownTable(text, requiredIdHeader) {
  const lines = text.split("\n");
  const headerIndex = lines.findIndex(
    (line) =>
      line.trim().startsWith("|") &&
      splitMarkdownRow(line).includes(requiredIdHeader),
  );

  assert(headerIndex >= 0, `Expected table with ${requiredIdHeader}`);

  const headers = splitMarkdownRow(lines[headerIndex]);
  const rows = [];

  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const values = splitMarkdownRow(line);
    if (values.length !== headers.length) {
      continue;
    }

    rows.push(
      Object.fromEntries(headers.map((header, index) => [header, values[index]])),
    );
  }

  assert(rows.length > 0, `Expected rows in table with ${requiredIdHeader}`);
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

function assertRequiredInventoryCapabilities(rows) {
  const ids = new Set(rows.map((row) => row.capability_id));
  for (const capabilityId of requiredInventoryCapabilities) {
    assert(ids.has(capabilityId), `Missing inventory capability ${capabilityId}`);
  }
}

function assertRequiredMapCapabilities(rows) {
  const ids = new Set(rows.map((row) => row.inventory_capability_id));
  for (const capabilityId of requiredMapCapabilities) {
    assert(ids.has(capabilityId), `Missing absorption map capability ${capabilityId}`);
  }
}

function assertInventoryRowsHaveRequiredFields(rows) {
  for (const row of rows) {
    for (const field of requiredInventoryFields) {
      assert(
        hasMeaningfulCell(row[field]),
        `${row.capability_id || "inventory row"} must record ${field}`,
      );
    }
  }
}

function assertEveryInventoryCapabilityHasValidStatus(rows) {
  for (const row of rows) {
    assert(
      validStatuses.has(row.status),
      `Invalid status for ${row.capability_id}: ${row.status}`,
    );
  }
}

function assertUsefulCapabilitiesHaveInheritancePath(rows) {
  for (const row of rows) {
    if (["obsolete", "remove_later"].includes(row.status)) {
      continue;
    }

    const hasNativeReplacement = hasMeaningfulCell(row.current_native_replacement);
    const hasRetainedCompatibility = hasMeaningfulCell(row.retained_compatibility_path);
    const hasAbsorptionTarget = hasMeaningfulCell(row.absorption_target);

    assert(
      hasNativeReplacement || hasRetainedCompatibility || hasAbsorptionTarget,
      `${row.capability_id} must have native replacement, retained compatibility path, or absorption target`,
    );
  }
}

function hasMeaningfulCell(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return !["none", "n/a", "tbd", "-"].includes(normalized);
}

function assertChangedFilesWithinAllowedScope() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Agent Workplane Cockpit inheritance v0.1: ${file}`,
    );
  }
}

function assertNoSourceFileDeletion() {
  const deletedFiles = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "--diff-filter=D", "HEAD"])
      .files,
    ...collectDiffNameOnly(["diff", "--name-only", "--diff-filter=D", "origin/main...HEAD"]),
  ]);

  assert.deepEqual(deletedFiles, [], "No source file deletion is allowed");
}

function assertNoRuntimeAuthorityFilesChanged() {
  const allFiles = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "HEAD"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);

  const forbiddenPathPrefixes = [
    "app/",
    "components/",
    "lib/",
    "types/",
    "fixtures/",
    "apps/",
    "plugins/",
  ];

  for (const file of allFiles) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected runtime or authority file changed: ${file}`,
    );
    if (
      followOnAgentWorkplaneNodeContractFiles.includes(file) ||
      followOnWorkplaneRunnerDeltaBatchIntegrationFiles.includes(file) ||
      followOnGuideWorkplaneDebugContextFiles.includes(file) ||
      followOnGuideBriefIntentProjectionFiles.includes(file)
    ) {
      continue;
    }
    assert(
      !forbiddenPathPrefixes.some((prefix) => file.startsWith(prefix)),
      `No runtime, UI, API, provider, GitHub, Codex, runner, durable memory, or Perspective apply file may change: ${file}`,
    );
  }
}

function collectDiffNameOnly(args) {
  try {
    const output = execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
