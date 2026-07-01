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
const phase5bSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const smokeFile = "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs";

const followOnSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const phase5bPanelFiles = [
  "components/workplane/work-queue-panel.tsx",
  "components/workplane/current-perspective-workplane-panel.tsx",
  "components/workplane/delta-projection-workplane-panel.tsx",
  "components/workplane/review-queue-workplane-panel.tsx",
  "components/workplane/evidence-handoff-workplane-panel.tsx",
  "components/workplane/workplane-inspector.tsx",
];

const phase5cPanelFiles = [
  projectionCandidatesPanelFile,
  deltaBatchPanelFile,
  handoffBuilderPanelFile,
  runPostmortemPanelFile,
  traceDiagnosticsPanelFile,
];

const followOnAgentWorkplaneCleanupHardeningFiles = [
  "components/workplane/agent-workplane.tsx",
  "components/workplane/workplane-header.tsx",
  "components/workplane/workplane-overview.tsx",
  "components/workplane/workplane-boundary-card.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "components/workplane/workplane-panel-shell.tsx",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
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


const requiredFiles = [
  workbenchPageFile,
  agentWorkplaneFile,
  ...phase5bPanelFiles,
  ...phase5cPanelFiles,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  phase5bSmokeFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  agentWorkplaneFile,
  ...phase5cPanelFiles,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  phase5bSmokeFile,
  ...followOnSmokeCompatibilityFiles,
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
const projectionCandidatesText = textByFile.get(projectionCandidatesPanelFile);
const deltaBatchText = textByFile.get(deltaBatchPanelFile);
const handoffBuilderText = textByFile.get(handoffBuilderPanelFile);
const runPostmortemText = textByFile.get(runPostmortemPanelFile);
const traceDiagnosticsText = textByFile.get(traceDiagnosticsPanelFile);
const phase5bSmokeText = textByFile.get(phase5bSmokeFile);
const docText = textByFile.get(agentWorkplaneDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageJsonScript();
assertWorkbenchStillRendersAgentWorkplane();
assertPhase5BPanelsStillCompose();
assertPhase5CPanelComponents();
assertPhase5CComposition();
assertDocsAndIndex();
assertNoAuthorityDrift();
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

const followOnHandoffCapsuleAppToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleAppToolFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleCodexSkillFiles = [
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
];
for (const file of followOnHandoffCapsuleCodexSkillFiles) {
  allowedChangedFiles.add(file);
}

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-projection-handoff-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      workbench_route_checked: true,
      phase5b_panels_still_compose_checked: true,
      phase5c_panels_checked: true,
      docs_index_checked: true,
      no_authority_drift_checked: true,
      phase5d_agent_workplane_cleanup_hardening_files_allowed:
        followOnAgentWorkplaneCleanupHardeningFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      route_model_changed: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      api_write_route_added: false,
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
console.log("PASS smoke:agent-workplane-projection-handoff-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:agent-workplane-projection-handoff-v0-1",
    expectedCommand:
      "node scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  });
}

function assertWorkbenchStillRendersAgentWorkplane() {
  assertContainsAll(
    workbenchPageText,
    [
      "AgentWorkplane",
      "@/components/workplane/agent-workplane",
      "Augnes Agent Workplane",
    ],
    { label: workbenchPageFile },
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
      "LegacyCockpitCompatibilityPanel",
      "AugnesCockpit",
    ],
    { label: agentWorkplaneFile },
  );
}

function assertPhase5CPanelComponents() {
  assertContainsAll(
    projectionCandidatesText,
    [
      "ProjectionCandidatesPanel",
      "Projection Candidates",
      "No projection candidates materialized yet",
      "read-only preview",
      "No apply, approve",
      "persistence controls",
      "review_queue",
      "next_candidates",
      "candidateDeltaPreview",
      "visibleCandidateDeltas",
      "candidateDeltaPreview.slice(0, 4)",
      "candidateCount = nextCandidates.length + candidateDeltaPreview.length",
    ],
    { label: projectionCandidatesPanelFile },
  );
  assert(
    !/candidateCount\s*=\s*nextCandidates\.length\s*\+\s*visibleCandidateDeltas\.length/.test(
      projectionCandidatesText,
    ),
    `${projectionCandidatesPanelFile} Candidates metric must use the full uncapped candidate delta list`,
  );
  assertContainsAll(
    deltaBatchText,
    [
      "DeltaBatchPanel",
      "Delta Batch",
      "No Delta Batch materialized yet",
      "validation_summary",
      "snapshot_refs",
      "diagnostic_refs",
      "authority_boundary",
      "no batch apply",
      "totalBatchDeltaCount",
      "totalBatchSnapshotRefCount",
      "totalBatchDiagnosticRefCount",
      "batches.reduce(",
      "count + batch.deltas.length",
      "count + batch.snapshot_refs.length",
      "count + batch.diagnostic_refs.length",
      "batches.slice(0, 3)",
    ],
    { label: deltaBatchPanelFile },
  );
  assert(
    !/firstBatch\s*\?\s*firstBatch\.(?:deltas|snapshot_refs|diagnostic_refs)\.length\s*:\s*0/.test(
      deltaBatchText,
    ),
    `${deltaBatchPanelFile} top metrics must summarize all materialized batches`,
  );
  assertContainsAll(
    handoffBuilderText,
    [
      "HandoffBuilderPreviewPanel",
      "Handoff Builder preview",
      "sourceRefs.handoff_refs",
      "projection.deltas.flatMap((delta) => delta.handoff_refs)",
      "handoffRef.handoff_ref",
      "No handoff builder preview refs materialized yet",
      "Handoff Capsule is not implemented in Phase 5C",
      "Future handoff build/send behavior requires separate explicit authority",
    ],
    { label: handoffBuilderPanelFile },
  );
  assertContainsAll(
    runPostmortemText,
    [
      "RunPostmortemSkeletonPanel",
      "Run Postmortem",
      "Run postmortem source is not materialized yet",
      "not materialized yet",
      "goal",
      "context loaded",
      "major decisions",
      "tools used",
      "failed attempts",
      "validation",
      "outputs",
      "generated deltas",
      "unresolved issues",
    ],
    { label: runPostmortemPanelFile },
  );
  assertContainsAll(
    traceDiagnosticsText,
    [
      "TraceDiagnosticsPanel",
      "Trace / Diagnostics",
      "No trace diagnostics materialized yet",
      "slice(0, 3)",
      "not a raw unbounded diagnostics dump",
      "diagnostic_refs",
      "validation_summary",
      "reviewNotes",
      "reviewNotes.slice(0, 3)",
      "review note",
      "review_notes",
      "non_goals",
    ],
    { label: traceDiagnosticsPanelFile },
  );
}

function assertPhase5CComposition() {
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
      "Phase 5C read-only preview",
      "No hidden",
    ],
    { label: agentWorkplaneFile },
  );
  assertContainsAll(
    phase5bSmokeText,
    [
      "followOnAgentWorkplaneProjectionHandoffFiles",
      "projection-candidates-panel.tsx",
      "smoke-agent-workplane-projection-handoff-v0-1.mjs",
    ],
    { label: phase5bSmokeFile },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    docText,
    [
      "Phase 5C Agent Workplane Projection / Handoff / Postmortem Skeletons",
      "Projection Candidates panel",
      "Delta Batch panel",
      "Handoff Builder preview panel",
      "Run Postmortem skeleton panel",
      "Trace / Diagnostics panel",
      "Phase 5D cleanup",
      "Phase 6 GuideBrief",
      "smoke:agent-workplane-projection-handoff-v0-1",
    ],
    { label: agentWorkplaneDoc },
  );
  assertContainsAll(
    indexText,
    [
      "Phase 5C adds read-only / preview-only Agent Workplane skeletons",
      "Projection Candidates",
      "Delta Batch",
      "Handoff Builder preview",
      "Run Postmortem",
      "Trace / Diagnostics",
      "Phase 5D cleanup",
      "Phase 6 GuideBrief",
    ],
    { label: indexDoc },
  );
}

function assertNoAuthorityDrift() {
  const implementationText = [
    agentWorkplaneText,
    projectionCandidatesText,
    deltaBatchText,
    handoffBuilderText,
    runPostmortemText,
    traceDiagnosticsText,
  ].join("\n");

  assert(
    !/<button\b/i.test(implementationText),
    "Phase 5C preview panels must not add button controls",
  );
  assert(
    !/<form\b/i.test(implementationText),
    "Phase 5C preview panels must not add forms",
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
      `Phase 5C preview panels must not add ${label}: ${pattern}`,
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
      `Unexpected Phase 5C changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 5C must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 5C must not update /perspective page",
    );
    assert(
      file !== "app/workbench/page.tsx",
      "Phase 5C must not update /workbench route wrapper",
    );
    assert(
      !/^app\/api\//.test(file) || followOnGuideBriefRouteFiles.includes(file),
      `Phase 5C must not add API routes outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        followOnGuideBriefRouteFiles.includes(file),
      `Phase 5C must not add route files outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 5C must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 5C must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 5C must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file)) ||
        followOnChatgptAppGuideBriefToolFiles.includes(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file) ||
        followOnHandoffCapsuleCodexSkillFiles.includes(file)),
      `Phase 5C must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 5C must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 5C must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 5C must not add work mutation or autonomy runner files: ${file}`,
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
