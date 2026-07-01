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
const projectionCandidatesPanelFile =
  "components/workplane/projection-candidates-panel.tsx";
const deltaBatchPanelFile = "components/workplane/delta-batch-panel.tsx";
const handoffBuilderPanelFile =
  "components/workplane/handoff-builder-preview-panel.tsx";
const runPostmortemPanelFile =
  "components/workplane/run-postmortem-skeleton-panel.tsx";
const traceDiagnosticsPanelFile =
  "components/workplane/trace-diagnostics-panel.tsx";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const shellSmokeFile = "scripts/smoke-agent-workplane-shell-v0-1.mjs";
const panelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const projectionHandoffSmokeFile =
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs";
const smokeFile = "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs";

const phase5aFiles = [
  agentWorkplaneFile,
  workplaneHeaderFile,
  workplaneOverviewFile,
  workplaneBoundaryFile,
  compatibilityPanelFile,
];

const phase5bPanelFiles = [
  panelShellFile,
  workQueuePanelFile,
  currentPerspectivePanelFile,
  deltaProjectionPanelFile,
  reviewQueuePanelFile,
  evidenceHandoffPanelFile,
  workplaneInspectorFile,
];

const phase5cPanelFiles = [
  projectionCandidatesPanelFile,
  deltaBatchPanelFile,
  handoffBuilderPanelFile,
  runPostmortemPanelFile,
  traceDiagnosticsPanelFile,
];

const followOnHistoricalSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
];

const followOnGuideBriefCoreFiles = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "types/guide-brief.ts",
  "lib/guide/guide-brief.ts",
  "fixtures/guide-brief.sample.v0.1.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
];

const requiredFiles = [
  workbenchPageFile,
  ...phase5aFiles,
  ...phase5bPanelFiles,
  ...phase5cPanelFiles,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  shellSmokeFile,
  panelsSmokeFile,
  projectionHandoffSmokeFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...phase5aFiles,
  ...phase5bPanelFiles,
  ...phase5cPanelFiles,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  shellSmokeFile,
  panelsSmokeFile,
  projectionHandoffSmokeFile,
  ...followOnHistoricalSmokeCompatibilityFiles,
  ...followOnGuideBriefCoreFiles,
  smokeFile,
  "app/globals.css",
]);

const textByFile = loadTextByFile(requiredFiles);
const workbenchPageText = textByFile.get(workbenchPageFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const headerText = textByFile.get(workplaneHeaderFile);
const overviewText = textByFile.get(workplaneOverviewFile);
const boundaryText = textByFile.get(workplaneBoundaryFile);
const compatibilityText = textByFile.get(compatibilityPanelFile);
const panelShellText = textByFile.get(panelShellFile);
const traceDiagnosticsText = textByFile.get(traceDiagnosticsPanelFile);
const docText = textByFile.get(agentWorkplaneDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const implementationText = [
  agentWorkplaneText,
  headerText,
  overviewText,
  boundaryText,
  compatibilityText,
  panelShellText,
  ...phase5bPanelFiles.map((file) => textByFile.get(file)),
  ...phase5cPanelFiles.map((file) => textByFile.get(file)),
].join("\n");
const nonCompatibilityWorkplaneText = [
  headerText,
  overviewText,
  boundaryText,
  panelShellText,
  ...phase5bPanelFiles
    .filter((file) => file !== panelShellFile)
    .map((file) => textByFile.get(file)),
  ...phase5cPanelFiles.map((file) => textByFile.get(file)),
].join("\n");

assertPackageJsonScript();
assertWorkbenchStillRendersAgentWorkplane();
assertPhase5ShellStillComposes();
assertPhase5BPanelsStillCompose();
assertPhase5CPreviewsStillCompose();
assertCleanupAndResponsiveHardening();
assertOldLabelCleanup();
assertDocsAndIndex();
assertNoAuthorityDrift();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-cleanup-hardening-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      workbench_route_checked: true,
      phase5a_shell_still_composes_checked: true,
      phase5b_panels_still_compose_checked: true,
      phase5c_previews_still_compose_checked: true,
      responsive_hardening_checked: true,
      old_label_cleanup_checked: true,
      docs_index_checked: true,
      no_authority_drift_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      route_model_changed: false,
      app_home_changed: false,
      perspective_page_changed: false,
      api_route_changed: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      mcp_app_tool_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      product_write_added: false,
      merge_publish_retry_replay_deploy_added: false,
      broad_cockpit_deletion: false,
      guidebrief_core_follow_on_allowed:
        changedFilesBoundary.guidebrief_core_follow_on_used,
      guidebrief_core_files_allowed: followOnGuideBriefCoreFiles,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-cleanup-hardening-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:agent-workplane-cleanup-hardening-v0-1",
    expectedCommand:
      "node scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  });
}

function assertWorkbenchStillRendersAgentWorkplane() {
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
    `${workbenchPageFile} must keep Cockpit behind the Agent Workplane compatibility shell`,
  );
}

function assertPhase5ShellStillComposes() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "Agent Workplane",
      "WorkplaneHeader",
      "WorkplaneOverview",
      "LegacyCockpitCompatibilityPanel",
      "AugnesCockpit",
      "readWorkplaneContext",
      "Agent Workplane layout",
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
      "Current Working Perspective context",
      "Augnes Delta Projection context",
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
    ],
    { label: workplaneOverviewFile },
  );
  assertContainsAll(
    compatibilityText,
    [
      "Existing Cockpit compatibility content",
      "Legacy Cockpit remains reachable",
      "legacy Cockpit compatibility content",
    ],
    { label: compatibilityPanelFile },
  );
}

function assertPhase5BPanelsStillCompose() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "WorkQueuePanel",
      "CurrentPerspectiveWorkplanePanel",
      "DeltaProjectionWorkplanePanel",
      "ReviewQueueWorkplanePanel",
      "EvidenceHandoffWorkplanePanel",
      "WorkplaneInspector",
      "Agent Workplane panels",
    ],
    { label: agentWorkplaneFile },
  );
}

function assertPhase5CPreviewsStillCompose() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "ProjectionCandidatesPanel",
      "DeltaBatchPanel",
      "HandoffBuilderPreviewPanel",
      "RunPostmortemSkeletonPanel",
      "TraceDiagnosticsPanel",
      "Agent Workplane projection and handoff previews",
      "Agent Workplane Phase 5C preview panels",
    ],
    { label: agentWorkplaneFile },
  );
  assertContainsAll(
    implementationText,
    [
      "Projection Candidates",
      "Delta Batch",
      "Handoff Builder preview",
      "Run Postmortem",
      "Trace / Diagnostics",
      "No projection candidates materialized yet",
      "No Delta Batch materialized yet",
      "No handoff builder preview refs materialized yet",
      "Run postmortem source is not materialized yet",
      "No trace diagnostics materialized yet",
    ],
    { label: "Agent Workplane Phase 5C implementation files" },
  );
}

function assertCleanupAndResponsiveHardening() {
  assertContainsAll(
    agentWorkplaneText,
    ["overflowX: \"hidden\"", "clamp(12px, 4vw, 28px)", "minWidth: 0"],
    { label: agentWorkplaneFile },
  );
  assertContainsAll(
    panelShellText,
    [
      "boxSizing: \"border-box\"",
      "overflow: \"hidden\"",
      "overflowWrap: \"anywhere\"",
      "wordBreak: \"break-word\"",
      "repeat(auto-fit, minmax(min(100%, 118px), 1fr))",
    ],
    { label: panelShellFile },
  );
  assertContainsAll(
    headerText,
    ["overflowWrap: \"anywhere\"", "No hidden execution authority"],
    { label: workplaneHeaderFile },
  );
  assertContainsAll(
    overviewText,
    [
      "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
      "Source / fallback status",
      "Fixture fallback is not live runtime state",
    ],
    { label: workplaneOverviewFile },
  );
  assertContainsAll(
    compatibilityText,
    ["overflowX: \"auto\"", "WebkitOverflowScrolling: \"touch\""],
    { label: compatibilityPanelFile },
  );
  assertContainsAll(
    traceDiagnosticsText,
    [
      "not a raw unbounded diagnostics dump",
      "slice(0, 3)",
      "reviewNotes.slice(0, 3)",
    ],
    { label: traceDiagnosticsPanelFile },
  );
}

function assertOldLabelCleanup() {
  assert(
    !/primary human product surface|main human product surface/i.test(
      implementationText,
    ),
    "Workplane UI must not frame /workbench as the primary human product surface",
  );
  assert(
    !/\bCockpit\b/.test(nonCompatibilityWorkplaneText),
    "Cockpit copy must stay limited to explicit legacy compatibility contexts",
  );
  assertContainsAll(
    docText,
    [
      "/ = Human Surface home",
      "/perspective = Perspective Human Timeline",
      "/workbench = Agent Workplane backend/operator surface",
      "old-label cleanup",
    ],
    { label: agentWorkplaneDoc },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    docText,
    [
      "Phase 5D Agent Workplane Cleanup / Responsive Hardening",
      "responsive hardening",
      "old-label cleanup",
      "accessibility / semantics",
      "source/fallback visibility",
      "boundary-copy consistency",
      "smoke:agent-workplane-cleanup-hardening-v0-1",
      "Phase 6 GuideBrief / Cross-Surface Guide Core can start only after",
    ],
    { label: agentWorkplaneDoc },
  );
  assertContainsAll(
    indexText,
    [
      "Phase 5D adds Agent Workplane cleanup",
      "responsive hardening",
      "old-label cleanup",
      "source/fallback visibility",
      "bounded trace/diagnostics",
      "GuideBrief",
    ],
    { label: indexDoc },
  );
}

function assertNoAuthorityDrift() {
  assert(
    !/<button\b/i.test(implementationText),
    "Phase 5D Workplane cleanup must not add button controls",
  );
  assert(
    !/<form\b/i.test(implementationText),
    "Phase 5D Workplane cleanup must not add forms",
  );

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
      `Phase 5D cleanup must not add ${label}: ${pattern}`,
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

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 5D changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 5D must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 5D must not update /perspective page",
    );
    assert(
      file !== "app/workbench/page.tsx",
      "Phase 5D must not update /workbench route wrapper",
    );
    assert(!/^app\/api\//.test(file), `Phase 5D must not add API routes: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `Phase 5D must not add route files: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 5D must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 5D must not change migrations: ${file}`,
    );
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 5D must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 5D must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 5D must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 5D must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 5D must not add work mutation or autonomy runner files: ${file}`,
    );
    assert(
      followOnGuideBriefCoreFiles.includes(file) ||
        !/(guidebrief|guide-brief|guide_brief)/i.test(file),
      `Phase 5D must not allow GuideBrief files outside exact Phase 6A core follow-on scope: ${file}`,
    );
  }

  const guidebriefCoreFollowOnUsed = files.some((file) =>
    followOnGuideBriefCoreFiles.includes(file),
  );

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
    guidebrief_core_follow_on_used: guidebriefCoreFollowOnUsed,
    files,
  };
}
