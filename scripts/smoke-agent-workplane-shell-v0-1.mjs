#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const workbenchPageFile = "app/workbench/page.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const workplaneHeaderFile = "components/workplane/workplane-header.tsx";
const workplaneOverviewFile = "components/workplane/workplane-overview.tsx";
const workplaneBoundaryFile = "components/workplane/workplane-boundary-card.tsx";
const compatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";
const panelShellFile = "components/workplane/workplane-panel-shell.tsx";
const workQueuePanelFile = "components/workplane/work-queue-panel.tsx";
const currentPerspectivePanelFile =
  "components/workplane/current-perspective-workplane-panel.tsx";
const deltaProjectionPanelFile =
  "components/workplane/delta-projection-workplane-panel.tsx";
const reviewQueuePanelFile =
  "components/workplane/review-queue-workplane-panel.tsx";
const evidenceHandoffPanelFile =
  "components/workplane/evidence-handoff-workplane-panel.tsx";
const workplaneInspectorFile = "components/workplane/workplane-inspector.tsx";
const contextReaderFile = "lib/workplane/read-workplane-context.ts";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const smokeFile = "scripts/smoke-agent-workplane-shell-v0-1.mjs";

const followOnSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
];

const followOnAgentWorkplanePanelFiles = [
  panelShellFile,
  workQueuePanelFile,
  currentPerspectivePanelFile,
  deltaProjectionPanelFile,
  reviewQueuePanelFile,
  evidenceHandoffPanelFile,
  workplaneInspectorFile,
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];

const followOnAgentWorkplaneProjectionHandoffFiles = [
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
];

const requiredFiles = [
  workbenchPageFile,
  agentWorkplaneFile,
  workplaneHeaderFile,
  workplaneOverviewFile,
  workplaneBoundaryFile,
  compatibilityPanelFile,
  panelShellFile,
  workQueuePanelFile,
  currentPerspectivePanelFile,
  deltaProjectionPanelFile,
  reviewQueuePanelFile,
  evidenceHandoffPanelFile,
  workplaneInspectorFile,
  contextReaderFile,
  agentWorkplaneDoc,
  packageJsonFile,
  indexDoc,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...followOnSmokeCompatibilityFiles,
  ...followOnAgentWorkplanePanelFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const workbenchPageText = textByFile.get(workbenchPageFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const headerText = textByFile.get(workplaneHeaderFile);
const overviewText = textByFile.get(workplaneOverviewFile);
const boundaryText = textByFile.get(workplaneBoundaryFile);
const compatibilityText = textByFile.get(compatibilityPanelFile);
const panelText = [
  textByFile.get(panelShellFile),
  textByFile.get(workQueuePanelFile),
  textByFile.get(currentPerspectivePanelFile),
  textByFile.get(deltaProjectionPanelFile),
  textByFile.get(reviewQueuePanelFile),
  textByFile.get(evidenceHandoffPanelFile),
  textByFile.get(workplaneInspectorFile),
].join("\n");
const contextReaderText = textByFile.get(contextReaderFile);
const docText = textByFile.get(agentWorkplaneDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const smokeText = textByFile.get(smokeFile);

assertPackageJsonScript();
assertIndexPointer();
assertWorkbenchRouteShell();
assertWorkplaneComponents();
assertWorkplaneContextReader();
assertDocs();
assertNoNewAuthorityCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-shell-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      workbench_route_checked: true,
      agent_workplane_shell_checked: true,
      cockpit_compatibility_checked: true,
      current_working_perspective_context_checked: true,
      delta_projection_context_checked: true,
      no_new_authority_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      follow_on_smoke_compatibility_files_allowed:
        followOnSmokeCompatibilityFiles,
      follow_on_agent_workplane_panel_files_allowed:
        followOnAgentWorkplanePanelFiles,
      smoke_type: "static-agent-workplane-shell-ui-helper-doc-package-index-boundary-only",
      route_model_changed: "/workbench wrapper only",
      db_schema_migration_changed: false,
      db_write_added: false,
      mcp_app_tool_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      scheduler_autonomy_runner_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-shell-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:agent-workplane-shell-v0-1",
    expectedCommand: "node scripts/smoke-agent-workplane-shell-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      agentWorkplaneDoc,
      "Phase 5A read-only Agent Workplane shell",
      "/workbench",
      "legacy Cockpit compatibility content",
    ],
    { label: indexDoc },
  );
}

function assertWorkbenchRouteShell() {
  assertContainsAll(
    workbenchPageText,
    [
      "AgentWorkplane",
      "@/components/workplane/agent-workplane",
      "Augnes Agent Workplane",
      "Read-only backend work surface",
    ],
    { label: workbenchPageFile },
  );
  assert(
    !workbenchPageText.includes("<AugnesCockpit"),
    `${workbenchPageFile} should route through the Agent Workplane shell, not direct Cockpit rendering`,
  );
}

function assertWorkplaneComponents() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "Agent Workplane",
      "AugnesCockpit",
      "LegacyCockpitCompatibilityPanel",
      "WorkplaneOverview",
      "WorkQueuePanel",
      "CurrentPerspectiveWorkplanePanel",
      "DeltaProjectionWorkplanePanel",
      "ReviewQueueWorkplanePanel",
      "EvidenceHandoffWorkplanePanel",
      "WorkplaneInspector",
      "readWorkplaneContext",
      "Agent Workplane panels",
    ],
    { label: agentWorkplaneFile },
  );
  assertContainsAll(
    panelText,
    [
      "Work Queue",
      "Current Perspective",
      "Delta Projection",
      "Review Queue",
      "Evidence / Handoff",
      "Workplane Inspector",
      "WorkplaneBoundaryCard",
      "No handoff refs materialized yet",
      "Run postmortem source is not materialized yet",
      "No projected deltas materialized yet",
      "No active work goals are materialized yet",
    ],
    { label: "Phase 5B Agent Workplane panel files" },
  );
  assertContainsAll(
    headerText,
    [
      "Agent Workplane",
      "Backend work surface",
      "read-only operator view",
      "No hidden execution authority",
      "Current Working Perspective context",
      "Augnes Delta Projection context",
      "Evidence pointers",
      "Handoff context",
      "Trace context",
      'href="/"',
      'href="/perspective"',
    ],
    { label: workplaneHeaderFile },
  );
  assertContainsAll(
    overviewText,
    [
      "Current Working Perspective",
      "Augnes Delta Projection",
      "Review queue",
      "Source / fallback status",
      "Fixture fallback is not live runtime state",
      "No review queue delta refs are materialized yet",
    ],
    { label: workplaneOverviewFile },
  );
  assertContainsAll(
    boundaryText,
    [
      "Read-only UI; No hidden execution authority",
      "does not",
      "execute agents",
      "apply deltas",
      "write DB rows",
      "record proof",
      "create evidence",
      "launch Codex",
    ],
    { label: workplaneBoundaryFile },
  );
  assertContainsAll(
    compatibilityText,
    [
      "Existing Cockpit compatibility content",
      "Legacy Cockpit remains reachable",
      "Phase 5B extracts focused",
    ],
    { label: compatibilityPanelFile },
  );
}

function assertWorkplaneContextReader() {
  assertContainsAll(
    contextReaderText,
    [
      "readCurrentPerspectiveForHumanSurface",
      "readDeltaProjectionForHumanSurface",
      "current_perspective_read",
      "delta_projection_read",
      "source_status",
      "fallback_reason",
      "authority_boundary",
      "no_hidden_execution_authority",
      "can_execute_codex: false",
      "can_create_evidence: false",
      "can_record_proof: false",
      "latestDeltas",
      ".sort(",
      "Date.parse",
      "localeCompare",
    ],
    { label: contextReaderFile },
  );
  assert(
    !contextReaderText.includes("projection.deltas\n          .slice(0, 4)") &&
      !contextReaderText.includes("projection.deltas.slice(0, 4)"),
    `${contextReaderFile} must sort a copied delta array before slicing latest_delta_titles`,
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Agent Workplane v0.1",
      "Existing Cockpit Preservation",
      "Data Sources and Fallback",
      "Trace context summary",
      "No handoff refs",
      "No run/postmortem source",
      "Authority Boundary",
      "smoke:agent-workplane-shell-v0-1",
      "Phase 5B",
      "smoke:agent-workplane-panels-v0-1",
    ],
    { label: agentWorkplaneDoc },
  );
}

function assertNoNewAuthorityCode() {
  const implementationText = [
    workbenchPageText,
    agentWorkplaneText,
    headerText,
    overviewText,
    boundaryText,
    compatibilityText,
    panelText,
    contextReaderText,
  ].join("\n");

  const forbiddenPatterns = [
    [/\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating HTTP method"],
    [/\bfetch\s*\([^)]*,\s*\{[\s\S]*\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating fetch"],
    [/\bappendWorkEvent\s*\(/, "work event append"],
    [/\bappendCoordinationEvent\s*\(/, "coordination event append"],
    [/\bcreateEvidenceRecord\s*\(/, "evidence write helper"],
    [/\brecordProof\s*\(/, "proof write helper"],
    [/\bcommitStateDeltaProposal\s*\(/, "state delta commit"],
    [/\brejectStateDeltaProposal\s*\(/, "state delta reject"],
    [/\bcommitState\b/, "state commit"],
    [/\brejectState\b/, "state reject"],
    [/\bwrite[A-Z]\w*\s*\(/, "write helper"],
    [/\binsert[A-Z]\w*\s*\(/, "insert helper"],
    [/\bupdate[A-Z]\w*\s*\(/, "update helper"],
    [/\bdelete[A-Z]\w*\s*\(/, "delete helper"],
    [/\bnew\s+Database\b/, "direct DB open"],
    [/from\s+["']@\/lib\/db["']/, "direct DB import"],
    [/@openai/, "OpenAI package import"],
    [/\boctokit\b/i, "GitHub runtime client"],
    [/\bexecuteCodex\s*\(/, "Codex execution"],
    [/\bcodexSdk\b/i, "Codex SDK"],
    [/\bsetInterval\s*\(/, "scheduler interval"],
    [/\bautonomyRunner\b/i, "autonomy runner"],
    [/\bINSERT\s+INTO\b/i, "SQL insert"],
    [/\bUPDATE\s+\w+/i, "SQL update"],
    [/\bDELETE\s+FROM\b/i, "SQL delete"],
    [/\bCREATE\s+TABLE\b/i, "schema creation"],
    [/\bALTER\s+TABLE\b/i, "schema alteration"],
    [/\bDROP\s+TABLE\b/i, "schema drop"],
  ];

  for (const [pattern, label] of forbiddenPatterns) {
    assert(
      !pattern.test(implementationText),
      `Agent Workplane shell must not add ${label}: ${pattern}`,
    );
  }

  assertContainsAll(
    smokeText,
    [
      "app/api/",
      "migrations/",
      "apps/augnes_apps/",
      "app/page.tsx",
      "app/perspective/page.tsx",
      "no_new_authority_code_checked",
    ],
    { label: smokeFile },
  );
}

function assertChangedFileBoundary() {
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
      `Unexpected Phase 5A changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 5A must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 5A must not update /perspective page",
    );
    assert(!/^app\/api\//.test(file), `Phase 5A must not add API routes: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `Phase 5A must not add route files: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 5A must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 5A must not change migrations: ${file}`,
    );
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 5A must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 5A must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 5A must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 5A must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 5A must not add work mutation or autonomy runner files: ${file}`,
    );
  }

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0,
    skipped: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
    ),
    skip_reason:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
        ? null
        : "changed-file boundary could not be checked",
    files,
  };
}
