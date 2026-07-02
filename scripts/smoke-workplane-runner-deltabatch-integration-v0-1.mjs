#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const readerFile = "lib/workplane/read-runner-delta-batches-for-workplane.ts";
const panelFile = "components/workplane/runner-delta-batch-panel.tsx";
const integrationDoc =
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md";
const smokeFile =
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs";
const contextReaderFile = "lib/workplane/read-workplane-context.ts";
const nodeContextFile = "lib/workplane/workplane-node-context.ts";
const typeContractFile = "types/agent-workplane-node.ts";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const deltaProjectionPanelFile =
  "components/workplane/delta-projection-workplane-panel.tsx";
const projectedDeltaBatchPanelFile =
  "components/workplane/delta-batch-panel.tsx";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const nodeContractDoc = "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";

const existingWorkplaneSmokeFiles = [
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
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

const followOnRunnerWorkplaneMetricsFiles = [
  "types/augnes-workflow-metrics.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "components/workplane/workplane-metrics-panel.tsx",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
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

const followOnAugnesDogfoodFiles = [
  "types/augnes-dogfood.ts",
  "lib/dogfood/augnes-on-augnes-dogfood.ts",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "scripts/run-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnLegacyCockpitShrinkPlanFiles = [
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const requiredFiles = [
  readerFile,
  panelFile,
  integrationDoc,
  smokeFile,
  contextReaderFile,
  nodeContextFile,
  typeContractFile,
  agentWorkplaneFile,
  deltaProjectionPanelFile,
  projectedDeltaBatchPanelFile,
  agentWorkplaneDoc,
  nodeContractDoc,
  indexDoc,
  packageJsonFile,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...existingWorkplaneSmokeFiles,
  ...followOnGuideWorkplaneDebugContextFiles,
  ...followOnGuideBriefIntentProjectionFiles,
  ...followOnRunnerWorkplaneMetricsFiles,
  ...followOnAugnesDogfoodFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const readerText = textByFile.get(readerFile);
const panelText = textByFile.get(panelFile);
const docText = textByFile.get(integrationDoc);
const contextReaderText = textByFile.get(contextReaderFile);
const nodeContextText = textByFile.get(nodeContextFile);
const typeContractText = textByFile.get(typeContractFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const deltaProjectionPanelText = textByFile.get(deltaProjectionPanelFile);
const projectedDeltaBatchPanelText = textByFile.get(projectedDeltaBatchPanelFile);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const nodeContractDocText = textByFile.get(nodeContractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:workplane-runner-deltabatch-integration-v0-1",
  expectedCommand:
    "node scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
});

assertContainsAll(indexText, [integrationDoc], { label: indexDoc });
assertContainsAll(agentWorkplaneDocText, [integrationDoc], {
  label: agentWorkplaneDoc,
});
assertContainsAll(
  nodeContractDocText,
  [
    "Recovered runner DeltaBatch Workplane readback",
    "smoke:workplane-runner-deltabatch-integration-v0-1",
  ],
  { label: nodeContractDoc },
);

assertReaderStaticShape();
assertContextIntegration();
assertNodeContextIntegration();
assertPanelIntegration();
assertPanelIdentitySeparation();
assertDocs();
const behavior = assertTempLedgerBehavior();
assertChangedFileBoundary();
assertNoSourceFileDeletion();
assertNoNewRoute();
assertNoBroadSourceDeletion();
assertNoForbiddenRuntimeAuthority();

console.log(
  JSON.stringify(
    {
      smoke: "workplane-runner-deltabatch-integration-v0-1",
      pass: true,
      reader_exists: true,
      panel_exists: true,
      doc_exists: true,
      package_script_checked: true,
      index_pointer_checked: true,
      agent_workplane_doc_pointer_checked: true,
      node_contract_doc_pointer_checked: true,
      workplane_context_runner_delta_batch_read_checked: true,
      node_context_runner_refs_checked: true,
      agent_workplane_panel_render_checked: true,
      stable_panel_identity_distinction_checked: true,
      projected_vs_recovered_distinction_checked: true,
      empty_state_checked: behavior.default_empty_status,
      temp_ledger_readback_checked: behavior.read_status,
      recovered_batch_id: behavior.recovered_batch_id,
      latest_batch_id: behavior.latest_batch_id,
      no_reader_write_after_fixture_checked: behavior.counts_unchanged_after_read,
      no_route_added_checked: true,
      no_legacy_cockpit_deletion_checked: true,
      no_runner_execution_recovery_scheduler_behavior_added: true,
      no_external_authority_or_apply_added: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:workplane-runner-deltabatch-integration-v0-1");

function assertReaderStaticShape() {
  assertContainsAll(
    readerText,
    [
      "WorkplaneRunnerDeltaBatchStatus",
      "WorkplaneRunnerDeltaBatchSummary",
      "WorkplaneRunnerDeltaBatchRead",
      "readRunnerDeltaBatchesForWorkplane",
      "listAutonomyRuns",
      "getAutonomyRun",
      "readonly: true",
      "query_only",
      "source_status",
      "fallback_reason",
      "staleness",
      "authority_boundary",
      "validation_summary",
      "smoke:workplane-runner-deltabatch-integration-v0-1",
      "Projected Delta Projection batches remain separate from recovered runner DeltaBatches.",
      "No recovered runner DeltaBatch is available",
    ],
    { label: readerFile },
  );

  for (const pattern of [
    /\brecoverDeltaBatchForRun\s*\(/,
    /\bcreateAutonomyRun\s*\(/,
    /\btickAutonomyRun\s*\(/,
    /\bpauseAutonomyRun\s*\(/,
    /\bresumeAutonomyRun\s*\(/,
    /\bcancelAutonomyRun\s*\(/,
    /\brunAutonomyScheduler/i,
    /\bfetch\s*\(/,
    /from\s+["'][^"']*openai[^"']*["']/i,
    /\boctokit\b/i,
    /\bexecuteCodex\s*\(/,
    /\bapplyDurableMemory\s*\(/i,
    /\bapplyPerspective\s*\(/i,
    /\bautoApplyDelta\s*\(/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
  ]) {
    assert(!pattern.test(readerText), `${readerFile} must not match ${pattern}`);
  }
}

function assertContextIntegration() {
  assertContainsAll(
    contextReaderText,
    [
      "readRunnerDeltaBatchesForWorkplane",
      "WorkplaneRunnerDeltaBatchRead",
      "runner_delta_batch_read",
      "runner_delta_batch: {",
      "recovered_batch_count",
      "recovered_delta_count",
      "latest_batch_id",
      "latest_run_id",
      "latest_validation_status",
      "source_status",
      "fallback_reason",
      "Recovered runner DeltaBatches are review-only context",
      "Projected Delta Projection batches remain separate",
    ],
    { label: contextReaderFile },
  );
}

function assertNodeContextIntegration() {
  assertContainsAll(
    nodeContextText,
    [
      "runner_delta_batch_read",
      "related_run_ids",
      "related_step_ids",
      "related_event_ids",
      "related_batch_ids",
      "related_delta_ids",
      "collectRunnerDeltaBatchSourceRefs",
      "isRunnerDeltaBatchPanel",
      "projected_delta_batch",
      "smoke:workplane-runner-deltabatch-integration-v0-1",
      "Recovered runner DeltaBatches are review candidates",
      "Projected Delta Projection batch preview context",
      "recovery write",
      "runner behavior",
    ],
    { label: nodeContextFile },
  );
}

function assertPanelIntegration() {
  assertContainsAll(
    agentWorkplaneText,
    [
      'import { RunnerDeltaBatchPanel }',
      "<RunnerDeltaBatchPanel context={context} />",
      "projected Delta Batch review",
      "recovered runner",
    ],
    { label: agentWorkplaneFile },
  );

  assertContainsAll(
    typeContractText,
    ["AGENT_WORKPLANE_PANEL_IDS", "projected_delta_batch", "delta_batch"],
    { label: typeContractFile },
  );

  assertContainsAll(
    panelText,
    [
      "WorkplanePanelShell",
      'title="Recovered Runner DeltaBatch"',
      'panelId="delta_batch"',
      'nodeId="runner_delta_batch"',
      'nodeKind="runner_context_source"',
      "nodeStatus={nodeStatus}",
      "latest.run_id",
      "latest.batch_id",
      "latest.delta_count",
      "latest.validation_status",
      "source_ref_count",
      "related_step_ids",
      "related_event_ids",
      "related_delta_ids",
      "no durable memory apply",
      "no Perspective apply",
      "no delta auto-apply",
      "no proof/evidence write",
      "no provider/OpenAI/GitHub/Codex execution",
    ],
    { label: panelFile },
  );

  assertContainsAll(
    deltaProjectionPanelText,
    [
      'panelId="delta_projection"',
      'nodeId="perspective_delta"',
      'nodeKind="native_panel"',
    ],
    { label: deltaProjectionPanelFile },
  );

  assertContainsAll(
    projectedDeltaBatchPanelText,
    [
      'title="Projected Delta Batch"',
      'panelId="projected_delta_batch"',
      'nodeId="perspective_delta"',
      'nodeKind="preview_panel"',
      "not a recovered runner DeltaBatch",
    ],
    { label: projectedDeltaBatchPanelFile },
  );

  for (const pattern of [
    /<button\b/i,
    /\bonClick\s*=/,
    /\bformAction\s*=/,
    /\brecoverDeltaBatchForRun\s*\(/,
    /\btickAutonomyRun\s*\(/,
    /\bcreateAutonomyRun\s*\(/,
    /\bschedule[A-Z]\w*\s*\(/,
    /\bsend[A-Z]\w*\s*\(/,
    /\blaunch[A-Z]\w*\s*\(/,
  ]) {
    assert(!pattern.test(panelText), `${panelFile} must not match ${pattern}`);
  }
}

function assertPanelIdentitySeparation() {
  const panelIdentities = [
    {
      file: deltaProjectionPanelFile,
      text: deltaProjectionPanelText,
      expectedPanelId: "delta_projection",
      expectedNodeId: "perspective_delta",
    },
    {
      file: projectedDeltaBatchPanelFile,
      text: projectedDeltaBatchPanelText,
      expectedPanelId: "projected_delta_batch",
      expectedNodeId: "perspective_delta",
    },
    {
      file: panelFile,
      text: panelText,
      expectedPanelId: "delta_batch",
      expectedNodeId: "runner_delta_batch",
    },
  ];

  const seen = new Map();
  for (const identity of panelIdentities) {
    assertContainsAll(
      identity.text,
      [
        `panelId="${identity.expectedPanelId}"`,
        `nodeId="${identity.expectedNodeId}"`,
      ],
      { label: identity.file },
    );
    const key = `${identity.expectedPanelId}/${identity.expectedNodeId}`;
    assert(
      !seen.has(key),
      `${identity.file} must not share panelId/nodeId pair ${key} with ${seen.get(
        key,
      )}`,
    );
    seen.set(key, identity.file);
  }

  assert.notEqual(
    "delta_projection/perspective_delta",
    "projected_delta_batch/perspective_delta",
  );
  assert.notEqual(
    "projected_delta_batch/perspective_delta",
    "delta_batch/runner_delta_batch",
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Why This Exists",
      "Data Read From the Runner Ledger",
      "Projected vs Recovered DeltaBatches",
      "projected_delta_batch",
      "delta_projection",
      "delta_batch",
      "IDs are intentionally separate",
      "Workplane Read Context Shape",
      "Node and Panel Context Integration",
      "UI Panel Behavior",
      "Source Ref Expectations",
      "Validation Summary Expectations",
      "Staleness, Fallback, and Empty State",
      "Authority Boundary",
      "GuideBrief Workplane Debug Context",
      "no new runner execution behavior is added",
      "no recovery write behavior is added to Workplane reads",
      "no scheduled runner behavior is added",
      "no GuideBrief debug panel is added",
      "no GuideBrief intent projection is added",
      "no provider/OpenAI/GitHub/Codex execution is added",
      "no DB write or persistence is added by Workplane reads",
      "no proof/evidence write is added",
      "no durable memory apply is added",
      "no Perspective apply is added",
      "no delta auto-apply is added",
      "no legacy Cockpit functionality is deleted",
      "Recommended next phase: GuideBrief Workplane Debug Context v0.1",
    ],
    { label: integrationDoc },
  );
}

function assertTempLedgerBehavior() {
  const tempDir = join(tmpdir(), "augnes-workplane-runner-deltabatch-v0-1");
  const tempDbPath = join(tempDir, "runner.sqlite");
  const missingDefaultDbPath = join(tempDir, "missing-default.sqlite");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });

  const behaviorScript = `
    import assert from "node:assert/strict";
    import { existsSync } from "node:fs";
    import {
      createAutonomyRun,
      tickAutonomyRun,
      recoverDeltaBatchForRun
    } from "./lib/autonomy/runner.ts";
    import { countAutonomyRunnerLedgerRows } from "./lib/autonomy/runner-ledger.ts";
    import { readRunnerDeltaBatchesForWorkplane } from "./lib/workplane/read-runner-delta-batches-for-workplane.ts";

    const scope = "project:augnes";
    const dbPath = ${JSON.stringify(tempDbPath)};
    const missingDefaultDbPath = ${JSON.stringify(missingDefaultDbPath)};

    process.env.AUGNES_DB_PATH = missingDefaultDbPath;
    const defaultEmpty = readRunnerDeltaBatchesForWorkplane({ scope, limit: 2 });
    assert.equal(defaultEmpty.status, "empty");
    assert.equal(defaultEmpty.source_status, "empty");
    assert.equal(defaultEmpty.recovered_batch_count, 0);
    assert.equal(existsSync(missingDefaultDbPath), false, "default empty read must not create DB file");

    const created = createAutonomyRun({
      dbPath,
      run_id: "autonomy_run.smoke.workplane.runner_deltabatch",
      scope,
      autonomy_contract_ref: "autonomy_contract.smoke.workplane",
      title: "Smoke Workplane runner DeltaBatch readback",
      created_at: "2026-07-02T00:10:00.000Z",
      budget_snapshot: { budget_id: "budget.smoke.workplane", max_iterations: 4 },
      source_refs: {
        autonomy_contract_refs: ["autonomy_contract.smoke.workplane"],
        current_working_perspective_refs: ["current_perspective.smoke.workplane"],
        delta_projection_refs: ["delta_projection.smoke.workplane"],
        docs_refs: ["docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md"],
        repo_refs: ["hynk-studio/augnes"]
      }
    });
    tickAutonomyRun({
      dbPath,
      run_id: created.run_id,
      now: "2026-07-02T00:10:01.000Z"
    });
    const completed = tickAutonomyRun({
      dbPath,
      run_id: created.run_id,
      now: "2026-07-02T00:10:02.000Z"
    });
    assert.equal(completed.status, "completed");
    const recovered = recoverDeltaBatchForRun({
      dbPath,
      run_id: created.run_id,
      now: "2026-07-02T00:10:03.000Z"
    });

    const countsBeforeRead = countAutonomyRunnerLedgerRows({ dbPath });
    const read = readRunnerDeltaBatchesForWorkplane({ dbPath, scope, limit: 3 });
    const countsAfterRead = countAutonomyRunnerLedgerRows({ dbPath });
    assert.deepEqual(countsAfterRead, countsBeforeRead, "Workplane reader must not write ledger rows after fixture setup");
    assert.equal(read.status, "ready");
    assert.equal(read.source_status, "runner_ledger");
    assert.equal(read.recovered_batch_count, 1);
    assert.equal(read.recovered_delta_count, 4);
    assert.equal(read.latest_batch_id, recovered.batch_id);
    assert.equal(read.latest_run_id, created.run_id);
    assert.equal(read.batches[0].batch_id, recovered.batch_id);
    assert.equal(read.batches[0].run_id, created.run_id);
    assert.equal(read.batches[0].related_delta_ids.length, 4);
    assert(read.batches[0].related_step_ids.length >= 2);
    assert(read.batches[0].related_event_ids.length >= 1);
    assert.equal(read.authority_boundary.can_write_runner_ledger, false);
    assert.equal(read.authority_boundary.can_recover_delta_batch, false);
    assert.equal(read.authority_boundary.can_execute_runner, false);
    assert.equal(read.authority_boundary.can_apply_durable_memory, false);
    assert.equal(read.authority_boundary.can_apply_perspective, false);
    assert.equal(read.authority_boundary.can_auto_apply_delta, false);

    console.log(JSON.stringify({
      default_empty_status: defaultEmpty.status,
      read_status: read.status,
      recovered_batch_id: recovered.batch_id,
      latest_batch_id: read.latest_batch_id,
      latest_run_id: read.latest_run_id,
      counts_unchanged_after_read: JSON.stringify(countsAfterRead) === JSON.stringify(countsBeforeRead)
    }));
  `;

  const output = execFileSync(resolveRootBin("tsx"), ["--eval", behaviorScript], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, TSX_TSCONFIG_PATH: "tsconfig.json" },
    shell: process.platform === "win32",
  });
  return JSON.parse(output);
}

function assertChangedFileBoundary() {
  const files = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Workplane runner DeltaBatch integration changed or untracked file: ${file}`,
    );
  }
}

function assertNoSourceFileDeletion() {
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

function assertNoNewRoute() {
  for (const file of changedAndUntrackedFiles()) {
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `No route file changes allowed: ${file}`,
    );
    assert(!/^apps\//.test(file), `No MCP/App tool changes allowed: ${file}`);
  }
}

function assertNoBroadSourceDeletion() {
  const deletionNameStatus = collectNameStatus(["diff", "--name-status", "HEAD"]);
  const broadDeletion = deletionNameStatus.find((line) => line.startsWith("D"));
  assert(!broadDeletion, `No broad source deletion allowed: ${broadDeletion}`);
}

function assertNoForbiddenRuntimeAuthority() {
  const changedFiles = changedAndUntrackedFiles();
  for (const file of changedFiles) {
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `No provider/OpenAI/GitHub runtime files allowed: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `No proof/evidence write path changes allowed: ${file}`,
    );
    assert(
      !/(^|\/)(scheduler)(\/|$)/i.test(file),
      `No scheduler behavior path changes allowed: ${file}`,
    );
  }

  const implementationText = [
    readerText,
    panelText,
    contextReaderText,
    nodeContextText,
    agentWorkplaneText,
    projectedDeltaBatchPanelText,
  ].join("\n");

  for (const [pattern, label] of [
    [/\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating HTTP method"],
    [/\bfetch\s*\([^)]*,\s*\{[\s\S]*\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating fetch"],
    [/\brecoverDeltaBatchForRun\s*\(/, "Workplane recovery call"],
    [/\btickAutonomyRun\s*\(/, "Workplane runner tick"],
    [/\bcreateAutonomyRun\s*\(/, "Workplane runner creation"],
    [/\bpauseAutonomyRun\s*\(/, "Workplane runner pause"],
    [/\bresumeAutonomyRun\s*\(/, "Workplane runner resume"],
    [/\bcancelAutonomyRun\s*\(/, "Workplane runner cancel"],
    [/\brunAutonomyScheduler/i, "scheduler execution"],
    [/@openai/, "OpenAI package import"],
    [/\boctokit\b/i, "GitHub runtime client"],
    [/\bexecuteCodex\s*\(/, "Codex execution"],
    [/\bapplyPerspective\s*\(/i, "Perspective apply"],
    [/\bapplyDurableMemory\s*\(/i, "durable memory apply"],
    [/\bautoApplyDelta\s*\(/i, "delta auto-apply"],
    [/\bcreateEvidenceRecord\s*\(/, "evidence write"],
    [/\brecordProof\s*\(/, "proof write"],
  ]) {
    assert(
      !pattern.test(implementationText),
      `Workplane runner DeltaBatch integration must not add ${label}: ${pattern}`,
    );
  }
}

function changedAndUntrackedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);
}

function collectNameStatus(args) {
  try {
    const output = execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function resolveRootBin(binName) {
  const executableName = process.platform === "win32" ? `${binName}.cmd` : binName;
  const binPath = join(process.cwd(), "node_modules", ".bin", executableName);
  assert(
    existsSync(binPath),
    `missing_root_bin:${binName}: run npm install from the repository root before running smoke:workplane-runner-deltabatch-integration-v0-1`,
  );
  return binPath;
}
