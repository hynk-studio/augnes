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
const shellSmokeFile = "scripts/smoke-agent-workplane-shell-v0-1.mjs";
const humanSurfaceSmokeFile = "scripts/smoke-human-surface-home-v0-1.mjs";
const perspectiveSmokeFile =
  "scripts/smoke-perspective-human-timeline-v0-1.mjs";
const smokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";

const followOnHistoricalSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
];

const followOnAgentWorkplaneProjectionHandoffFiles = [
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
];

const followOnAgentWorkplaneCleanupHardeningFiles = [
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnGuideBriefCoreFiles = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "types/guide-brief.ts",
  "lib/guide/guide-brief.ts",
  "fixtures/guide-brief.sample.v0.1.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
];

const followOnGuideBriefRouteFiles = [
  "app/api/augnes/read/guide-brief/route.ts",
  "lib/guide/guide-brief-source.ts",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
];

const followOnWebGuidePanelFiles = [
  "components/guide/guide-brief-panel.tsx",
  "components/guide/guide-brief-section.tsx",
  "components/guide/guide-brief-summary-card.tsx",
  "components/guide/guide-brief-boundary-card.tsx",
  "components/guide/guide-brief-mini-panel.tsx",
  "lib/guide/read-guide-brief-for-web.ts",
  "components/human-surface/human-surface-home.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
const followOnChatgptAppGuideBriefToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
];


const panelFiles = [
  panelShellFile,
  workQueuePanelFile,
  currentPerspectivePanelFile,
  deltaProjectionPanelFile,
  reviewQueuePanelFile,
  evidenceHandoffPanelFile,
  workplaneInspectorFile,
];

const requiredFiles = [
  workbenchPageFile,
  agentWorkplaneFile,
  workplaneHeaderFile,
  workplaneOverviewFile,
  workplaneBoundaryFile,
  compatibilityPanelFile,
  ...panelFiles,
  contextReaderFile,
  agentWorkplaneDoc,
  packageJsonFile,
  indexDoc,
  shellSmokeFile,
  humanSurfaceSmokeFile,
  perspectiveSmokeFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  workbenchPageFile,
  agentWorkplaneFile,
  workplaneHeaderFile,
  workplaneOverviewFile,
  workplaneBoundaryFile,
  compatibilityPanelFile,
  ...panelFiles,
  contextReaderFile,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  shellSmokeFile,
  humanSurfaceSmokeFile,
  perspectiveSmokeFile,
  ...followOnHistoricalSmokeCompatibilityFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
  ...followOnAgentWorkplaneCleanupHardeningFiles,
  ...followOnGuideBriefCoreFiles,
  ...followOnGuideBriefRouteFiles,
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
  smokeFile,
]);

const textByFile = loadTextByFile(requiredFiles);
const workbenchPageText = textByFile.get(workbenchPageFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const headerText = textByFile.get(workplaneHeaderFile);
const overviewText = textByFile.get(workplaneOverviewFile);
const boundaryText = textByFile.get(workplaneBoundaryFile);
const compatibilityText = textByFile.get(compatibilityPanelFile);
const panelShellText = textByFile.get(panelShellFile);
const workQueueText = textByFile.get(workQueuePanelFile);
const currentPerspectiveText = textByFile.get(currentPerspectivePanelFile);
const deltaProjectionText = textByFile.get(deltaProjectionPanelFile);
const reviewQueueText = textByFile.get(reviewQueuePanelFile);
const evidenceHandoffText = textByFile.get(evidenceHandoffPanelFile);
const inspectorText = textByFile.get(workplaneInspectorFile);
const contextReaderText = textByFile.get(contextReaderFile);
const docText = textByFile.get(agentWorkplaneDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const shellSmokeText = textByFile.get(shellSmokeFile);
const humanSurfaceSmokeText = textByFile.get(humanSurfaceSmokeFile);
const perspectiveSmokeText = textByFile.get(perspectiveSmokeFile);

assertPackageJsonScript();
assertIndexPointer();
assertWorkbenchRouteStillShell();
assertShellComposition();
assertPanelComponents();
assertWorkplaneContextReader();
assertDocs();
assertFollowOnSmokeCompatibility();
assertNoNewAuthorityCode();
const followOnCodexGuideBriefHandoffFiles = [
  "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
  "plugins/augnes-operator/skills/augnes-guidebrief-handoff/SKILL.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
];
for (const file of followOnCodexGuideBriefHandoffFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "types/handoff-capsule.ts",
  "lib/handoff/handoff-capsule.ts",
  "fixtures/handoff-capsule.sample.v0.1.json",
  "fixtures/codex-launch-card.sample.v0.1.json",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-panels-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      workbench_route_checked: true,
      shell_composition_checked: true,
      panel_components_checked: true,
      cockpit_compatibility_checked: true,
      current_working_perspective_context_checked: true,
      delta_projection_context_checked: true,
      follow_on_smoke_compatibility_checked: true,
      follow_on_historical_smoke_compatibility_files_allowed:
        followOnHistoricalSmokeCompatibilityFiles,
      phase5c_agent_workplane_projection_handoff_follow_on_used:
        changedFilesBoundary.phase5c_agent_workplane_projection_handoff_follow_on_used,
      phase5c_agent_workplane_projection_handoff_files_allowed:
        followOnAgentWorkplaneProjectionHandoffFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      no_new_authority_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-agent-workplane-panels-ui-helper-doc-package-index-boundary-only",
      route_model_changed: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      api_write_route_added: false,
      mcp_app_tool_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      phase5c_panel_scope_started:
        changedFilesBoundary.phase5c_agent_workplane_projection_handoff_follow_on_used,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-panels-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:agent-workplane-panels-v0-1",
    expectedCommand: "node scripts/smoke-agent-workplane-panels-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      agentWorkplaneDoc,
      "Phase 5B adds focused read-only Agent Workplane panels",
      "Work Queue",
      "Current Perspective",
      "Delta Projection",
      "Review Queue",
      "Evidence/Handoff",
      "Workplane Inspector",
    ],
    { label: indexDoc },
  );
}

function assertWorkbenchRouteStillShell() {
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
    `${workbenchPageFile} should keep Cockpit behind the Agent Workplane compatibility shell`,
  );
}

function assertShellComposition() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "Agent Workplane",
      "WorkplaneHeader",
      "WorkplaneOverview",
      "WorkQueuePanel",
      "CurrentPerspectiveWorkplanePanel",
      "DeltaProjectionWorkplanePanel",
      "ReviewQueueWorkplanePanel",
      "EvidenceHandoffWorkplanePanel",
      "WorkplaneInspector",
      "LegacyCockpitCompatibilityPanel",
      "AugnesCockpit",
      "readWorkplaneContext",
      "Agent Workplane panels",
      "Agent Workplane active compatibility content",
    ],
    { label: agentWorkplaneFile },
  );
  assertContainsAll(
    headerText,
    [
      "Agent Workplane",
      "Backend work surface",
      "read-only operator view",
      "No hidden execution authority",
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
    ],
    { label: workplaneOverviewFile },
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

function assertPanelComponents() {
  assertContainsAll(
    panelShellText,
    [
      "WorkplanePanelShell",
      "WorkplanePanelMetric",
      "workplaneCopyStyle",
      "workplaneListStyle",
      "workplaneItemStyle",
      "workplaneBadgeStyle",
    ],
    { label: panelShellFile },
  );
  assertContainsAll(
    workQueueText,
    [
      "WorkQueuePanel",
      "Work Queue",
      "Active work and review scope",
      "No active work goals are materialized yet",
      "read-only queue hints",
      "WorkplaneContextRead",
    ],
    { label: workQueuePanelFile },
  );
  assertContainsAll(
    currentPerspectiveText,
    [
      "CurrentPerspectiveWorkplanePanel",
      "Current Perspective",
      "Current Working Perspective workplane context",
      "Source status",
      "Staleness",
      "Fixture fallback is disclosed",
      "WorkplaneContextRead",
    ],
    { label: currentPerspectivePanelFile },
  );
  assertContainsAll(
    deltaProjectionText,
    [
      "DeltaProjectionWorkplanePanel",
      "Delta Projection",
      "Augnes Delta Projection workplane context",
      "No projected deltas materialized yet",
      "read-model inputs",
      "Date.parse",
      "localeCompare",
      "WorkplaneContextRead",
    ],
    { label: deltaProjectionPanelFile },
  );
  assertContainsAll(
    reviewQueueText,
    [
      "ReviewQueueWorkplanePanel",
      "Review Queue",
      "Operator attention hints",
      "No review queue delta refs are materialized yet",
      "does not approve",
      "WorkplaneContextRead",
    ],
    { label: reviewQueuePanelFile },
  );
  assertContainsAll(
    evidenceHandoffText,
    [
      "EvidenceHandoffWorkplanePanel",
      "Evidence / Handoff",
      "Pointer-only handoff and evidence context",
      "Evidence pointers",
      "Handoff context",
      "sourceHandoffRefs",
      "deltaHandoffRefs",
      "delta.handoff_refs",
      "uniqueHandoffRefCount",
      "handoffRef.handoff_ref",
      "No handoff refs materialized yet",
      "No evidence pointers materialized yet",
      "Run postmortem source is not materialized yet",
      "does not create evidence records",
      "WorkplaneContextRead",
    ],
    { label: evidenceHandoffPanelFile },
  );
  assertContainsAll(
    inspectorText,
    [
      "WorkplaneInspector",
      "WorkplaneBoundaryCard",
      "No hidden execution authority",
      "Pointer-only backend context",
      "merge policy",
      "Non-goals",
      "No projected deltas materialized yet",
      "Date.parse",
      "localeCompare",
      "WorkplaneContextRead",
    ],
    { label: workplaneInspectorFile },
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
      "Phase 5B extracts work queue",
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
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Phase 5B Agent Workplane Panels",
      "Work Queue panel",
      "Current Perspective Workplane panel",
      "Delta Projection Workplane panel",
      "Review Queue panel",
      "Evidence/Handoff panel",
      "Workplane Inspector",
      "Phase 5C",
      "Projection Candidates",
      "Handoff Builder preview",
      "Trace / Diagnostics",
      "smoke:agent-workplane-panels-v0-1",
      "no-write, no-execution, no-hidden-authority",
    ],
    { label: agentWorkplaneDoc },
  );
}

function assertFollowOnSmokeCompatibility() {
  assertContainsAll(
    shellSmokeText,
    [
      "followOnAgentWorkplanePanelFiles",
      "work-queue-panel.tsx",
      "smoke-agent-workplane-panels-v0-1.mjs",
    ],
    { label: shellSmokeFile },
  );
  assertContainsAll(
    humanSurfaceSmokeText,
    [
      "followOnAgentWorkplanePanelFiles",
      "smoke-agent-workplane-panels-v0-1.mjs",
    ],
    { label: humanSurfaceSmokeFile },
  );
  assertContainsAll(
    perspectiveSmokeText,
    [
      "followOnAgentWorkplanePanelFiles",
      "smoke-agent-workplane-panels-v0-1.mjs",
    ],
    { label: perspectiveSmokeFile },
  );
}

function assertNoNewAuthorityCode() {
  const implementationText = [
    agentWorkplaneText,
    headerText,
    overviewText,
    boundaryText,
    compatibilityText,
    panelShellText,
    workQueueText,
    currentPerspectiveText,
    deltaProjectionText,
    reviewQueueText,
    evidenceHandoffText,
    inspectorText,
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
    [/\bsetTimeout\s*\(/, "scheduler timeout"],
    [/\bautonomyRunner\b/i, "autonomy runner"],
    [/\bINSERT\s+INTO\b/i, "SQL insert"],
    [/\bUPDATE\s+\w+/i, "SQL update"],
    [/\bDELETE\s+FROM\b/i, "SQL delete"],
    [/\bCREATE\s+TABLE\b/i, "schema creation"],
    [/\bALTER\s+TABLE\b/i, "schema alteration"],
    [/\bDROP\s+TABLE\b/i, "schema drop"],
    [/\bcreatePullRequest\s*\(/, "GitHub actuation"],
  ];

  for (const [pattern, label] of forbiddenPatterns) {
    assert(
      !pattern.test(implementationText),
      `Agent Workplane panels must not add ${label}: ${pattern}`,
    );
  }
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
  const phase5cAgentWorkplaneProjectionHandoffFollowOnUsed = files.some((file) =>
    followOnAgentWorkplaneProjectionHandoffFiles.includes(file),
  );

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 5B changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 5B must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 5B must not update /perspective page",
    );
    assert(
      !/^app\/api\//.test(file) || followOnGuideBriefRouteFiles.includes(file),
      `Phase 5B must not add API routes outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        followOnGuideBriefRouteFiles.includes(file),
      `Phase 5B must not add route files outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 5B must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 5B must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 5B must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) || followOnCodexGuideBriefHandoffFiles.includes(file)) || followOnChatgptAppGuideBriefToolFiles.includes(file) || followOnCodexGuideBriefHandoffFiles.includes(file)),
      `Phase 5B must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 5B must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 5B must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 5B must not add work mutation or autonomy runner files: ${file}`,
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
    phase5c_agent_workplane_projection_handoff_follow_on_used:
      phase5cAgentWorkplaneProjectionHandoffFollowOnUsed,
  };
}
