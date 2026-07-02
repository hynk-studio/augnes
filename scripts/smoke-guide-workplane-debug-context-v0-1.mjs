#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
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

const typeFile = "types/guide-debug-context.ts";
const helperFile = "lib/guide/guide-workplane-debug-context.ts";
const panelFile = "components/guide/guide-workplane-debug-panel.tsx";
const docFile = "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md";
const smokeFile = "scripts/smoke-guide-workplane-debug-context-v0-1.mjs";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const nodeContractDoc = "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md";
const runnerIntegrationDoc =
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const nodeContextFile = "lib/workplane/workplane-node-context.ts";
const deltaProjectionPanelFile =
  "components/workplane/delta-projection-workplane-panel.tsx";
const projectedDeltaBatchPanelFile =
  "components/workplane/delta-batch-panel.tsx";
const runnerDeltaBatchPanelFile =
  "components/workplane/runner-delta-batch-panel.tsx";

const existingSmokeFiles = [
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

const requiredFiles = [
  typeFile,
  helperFile,
  panelFile,
  docFile,
  smokeFile,
  agentWorkplaneFile,
  guideBriefDoc,
  agentWorkplaneDoc,
  nodeContractDoc,
  runnerIntegrationDoc,
  indexDoc,
  packageJsonFile,
  nodeContextFile,
  deltaProjectionPanelFile,
  projectedDeltaBatchPanelFile,
  runnerDeltaBatchPanelFile,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...existingSmokeFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const docText = textByFile.get(docFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const guideBriefDocText = textByFile.get(guideBriefDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const nodeContractDocText = textByFile.get(nodeContractDoc);
const runnerIntegrationDocText = textByFile.get(runnerIntegrationDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const nodeContextText = textByFile.get(nodeContextFile);
const deltaProjectionPanelText = textByFile.get(deltaProjectionPanelFile);
const projectedDeltaBatchPanelText = textByFile.get(projectedDeltaBatchPanelFile);
const runnerDeltaBatchPanelText = textByFile.get(runnerDeltaBatchPanelFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:guide-workplane-debug-context-v0-1",
  expectedCommand: "node scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
assertComponentStaticShape();
assertAgentWorkplaneIntegration();
assertStableIdentityGuard();
const behavior = assertHelperBehavior();
assertNoNewRoute();
assertNoSourceFileDeletion();
assertNoBroadSourceDeletion();
assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "guide-workplane-debug-context-v0-1",
      pass: true,
      type_exists: true,
      helper_exists: true,
      panel_exists: true,
      doc_exists: true,
      package_script_checked: true,
      index_pointer_checked: true,
      guidebrief_doc_pointer_checked: true,
      agent_workplane_doc_pointer_checked: true,
      required_type_fields_checked: true,
      helper_exports_checked: true,
      matched_workplane_inspector_checked: behavior.workplane_inspector_status,
      matched_projected_delta_batch_checked:
        behavior.projected_delta_batch_status,
      matched_runner_delta_batch_checked: behavior.runner_delta_batch_status,
      unknown_selection_checked: behavior.unknown_selection_status,
      observed_inferred_suggested_judgment_separation_checked: true,
      projected_vs_recovered_deltabatch_distinction_checked: true,
      component_data_attributes_checked: true,
      component_no_controls_checked: true,
      agent_workplane_render_checked: true,
      no_route_added_checked: true,
      no_runner_execution_recovery_scheduler_behavior_added: true,
      no_external_authority_or_apply_added: true,
      no_intent_projection_added: true,
      no_legacy_cockpit_deletion_checked: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:guide-workplane-debug-context-v0-1");

function assertDocsAndPointers() {
  assertContainsAll(indexText, [docFile], { label: indexDoc });
  assertContainsAll(guideBriefDocText, [docFile], { label: guideBriefDoc });
  assertContainsAll(agentWorkplaneDocText, [docFile], {
    label: agentWorkplaneDoc,
  });
  assertContainsAll(
    nodeContractDocText,
    ["GuideBrief Workplane Debug Context v0.1 now consumes this contract"],
    { label: nodeContractDoc },
  );
  assertContainsAll(
    runnerIntegrationDocText,
    ["GuideBrief Workplane Debug Context v0.1 now uses"],
    { label: runnerIntegrationDoc },
  );

  assertContainsAll(
    docText,
    [
      "Why This Exists",
      "GuideBrief Authority",
      "Selection Inputs",
      "Output Shape",
      "Observed: source-backed Workplane node/context facts only",
      "Inferred: derived interpretation with caveats",
      "Suggested: candidate debug, navigation, or validation checks only",
      "Needs user judgment: unresolved operator decisions only",
      "Source Refs",
      "Debug Trace",
      "Validation Summary",
      "Stale, Fallback, and Judgment Behavior",
      "Authority Boundary",
      "Codex debug handoff candidate",
      "Projected vs Recovered DeltaBatch Distinction",
      "data-guide-workplane-debug-panel=\"v0.1\"",
      "Browser Sanity Expectation",
      "no GuideBrief intent projection",
      "no Workplane intent mode",
      "no route",
      "no API write route",
      "no server action",
      "no provider/OpenAI call",
      "no GitHub call or actuation",
      "no Codex launch or execution",
      "no runner execution",
      "no runner recovery write",
      "no scheduled runner behavior",
      "no DB write or persistence",
      "no proof/evidence write",
      "no durable memory apply",
      "no Perspective apply",
      "no delta auto-apply",
      "no legacy Cockpit shrink or deletion",
      "Recommended next phase: GuideBrief Intent Projection v0.1",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "GUIDE_WORKPLANE_DEBUG_CONTEXT_VERSION",
      "GuideWorkplaneDebugSelectionInput",
      "GuideWorkplaneDebugSelectedContext",
      "GuideWorkplaneDebugObservedItem",
      "GuideWorkplaneDebugInferredItem",
      "GuideWorkplaneDebugSuggestion",
      "GuideWorkplaneDebugNeedsUserJudgmentItem",
      "GuideWorkplaneDebugTraceStep",
      "GuideWorkplaneDebugValidationSummary",
      "GuideWorkplaneDebugStaleWarning",
      "GuideWorkplaneDebugAuthorityBoundary",
      "GuideWorkplaneDebugCodexHandoffCandidate",
      "GuideWorkplaneDebugContext",
      "GuideWorkplaneDebugContextInput",
      "selected_panel_id",
      "selected_node_id",
      "run_id",
      "step_id",
      "event_id",
      "batch_id",
      "delta_id",
      "handoff_ref",
      "debug_question",
      "debug_context_id",
      "debug_version",
      "selected_context",
      "observed",
      "inferred",
      "suggested",
      "needs_user_judgment",
      "source_refs",
      "debug_trace",
      "validation_summary",
      "stale_warnings",
      "authority_boundary",
      "codex_debug_handoff_candidate",
      "selection_status",
      "matched",
      "partial_match",
      "not_found",
      "ambiguous",
      "can_write_db",
      "can_write_runner_ledger",
      "can_record_proof",
      "can_create_evidence",
      "can_update_work",
      "can_mutate_memory",
      "can_apply_project_perspective",
      "can_apply_durable_memory",
      "can_auto_apply_delta",
      "can_call_provider_openai",
      "can_call_github",
      "can_actuate_github",
      "can_execute_codex",
      "can_execute_runner",
      "can_schedule_runner",
      "can_create_branch_or_pr",
      "can_send_handoff",
      "can_merge_publish_retry_replay_deploy",
      "can_create_ui_action",
      "can_project_intent",
    ],
    { label: typeFile },
  );

  for (const pattern of [
    /\breadFileSync\b/,
    /\bwriteFileSync\b/,
    /\bfetch\s*\(/,
    /\bnew\s+Database\b/,
    /\bprocess\.env\b/,
    /from\s+["']@\/lib\/db/,
    /from\s+["'][^"']*openai[^"']*["']/i,
    /\boctokit\b/i,
  ]) {
    assert(!pattern.test(typeText), `${typeFile} must not match ${pattern}`);
  }
}

function assertHelperStaticShape() {
  assertContainsAll(
    helperText,
    [
      "buildGuideWorkplaneDebugContext",
      "readGuideWorkplaneDebugContext",
      "GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS",
      "readAgentWorkplaneNodeContext",
      "matchSelectedWorkplaneContext",
      "selected_panel_id",
      "selected_node_id",
      "run_id",
      "step_id",
      "event_id",
      "batch_id",
      "delta_id",
      "handoff_ref",
      "observed",
      "inferred",
      "suggested",
      "needs_user_judgment",
      "debug_trace",
      "validation_summary",
      "stale_warnings",
      "codex_debug_handoff_candidate",
      "preview-only Codex debug handoff candidate",
      "projected_delta_batch",
      "delta_batch",
      "runner_delta_batch",
      "delta_projection / perspective_delta",
      "projected_delta_batch / perspective_delta",
      "delta_batch / runner_delta_batch",
      "smoke:guide-workplane-debug-context-v0-1",
    ],
    { label: helperFile },
  );

  for (const pattern of [
    /\breadRunnerDeltaBatchesForWorkplane\b/,
    /\brecoverDeltaBatchForRun\s*\(/,
    /\bcreateAutonomyRun\s*\(/,
    /\btickAutonomyRun\s*\(/,
    /\bpauseAutonomyRun\s*\(/,
    /\bresumeAutonomyRun\s*\(/,
    /\bcancelAutonomyRun\s*\(/,
    /\brunAutonomyScheduler/i,
    /\bfetch\s*\(/,
    /\bPOST\s*\(/,
    /\bPUT\s*\(/,
    /\bPATCH\s*\(/,
    /\bDELETE\s*\(/,
    /\bnew\s+Database\b/,
    /from\s+["']@\/lib\/db/,
    /from\s+["'][^"']*openai[^"']*["']/i,
    /\boctokit\b/i,
    /\bexecuteCodex\s*\(/,
    /\bapplyDurableMemory\s*\(/i,
    /\bapplyPerspective\s*\(/i,
    /\bautoApplyDelta\s*\(/i,
    /\bprojectIntent\s*\(/i,
    /\bcreateBranch\b/i,
    /\bcreatePullRequest\b/i,
  ]) {
    assert(!pattern.test(helperText), `${helperFile} must not match ${pattern}`);
  }
}

function assertComponentStaticShape() {
  assertContainsAll(
    panelText,
    [
      "GuideWorkplaneDebugContext",
      'data-guide-workplane-debug-panel="v0.1"',
      "data-guide-workplane-debug-selected-panel-id",
      "data-guide-workplane-debug-selected-node-id",
      "data-guide-workplane-debug-selection-status",
      "Selected context",
      "Observed",
      "Inferred",
      "Suggested",
      "Needs user judgment",
      "Source refs",
      "Debug trace",
      "Validation summary",
      "Stale warnings",
      "Authority boundary",
      "Codex debug handoff candidate",
      "Read-only debug context",
      "not intent projection and not execution",
    ],
    { label: panelFile },
  );

  for (const pattern of [
    /<button\b/i,
    /<form\b/i,
    /<textarea\b/i,
    /<input\b/i,
    /\bonClick\s*=/,
    /\bformAction\s*=/,
    /"use server"/,
    /\bserverAction\b/i,
    /\bmutate[A-Z]\w*\s*\(/,
    /\bapply[A-Z]\w*\s*\(/,
    /\bexecute[A-Z]\w*\s*\(/,
    /\brecover[A-Z]\w*\s*\(/,
    /\btick[A-Z]\w*\s*\(/,
    /\bschedule[A-Z]\w*\s*\(/,
  ]) {
    assert(!pattern.test(panelText), `${panelFile} must not match ${pattern}`);
  }
}

function assertAgentWorkplaneIntegration() {
  assertContainsAll(
    agentWorkplaneText,
    [
      'import { GuideWorkplaneDebugPanel }',
      "buildGuideWorkplaneDebugContext",
      "GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS",
      "buildAgentWorkplaneNodeContextRead",
      "<GuideWorkplaneDebugPanel debugContext={workplaneDebugContext} />",
    ],
    { label: agentWorkplaneFile },
  );
}

function assertStableIdentityGuard() {
  assertContainsAll(
    nodeContextText,
    [
      'panel_id: "delta_projection"',
      'node_id: "perspective_delta"',
      'panel_id: "projected_delta_batch"',
      'panel_id: "delta_batch"',
      'node_id: "runner_delta_batch"',
    ],
    { label: nodeContextFile },
  );
  assertContainsAll(
    deltaProjectionPanelText,
    ['panelId="delta_projection"', 'nodeId="perspective_delta"'],
    { label: deltaProjectionPanelFile },
  );
  assertContainsAll(
    projectedDeltaBatchPanelText,
    ['panelId="projected_delta_batch"', 'nodeId="perspective_delta"'],
    { label: projectedDeltaBatchPanelFile },
  );
  assertContainsAll(
    runnerDeltaBatchPanelText,
    ['panelId="delta_batch"', 'nodeId="runner_delta_batch"'],
    { label: runnerDeltaBatchPanelFile },
  );
}

function assertHelperBehavior() {
  const behaviorScript = `
    import assert from "node:assert/strict";
    import { buildGuideWorkplaneDebugContext } from "./lib/guide/guide-workplane-debug-context.ts";

    const baseFallback = {
      status: "runtime",
      reason: null,
      source_status: "runtime",
      notes: ["runtime source"]
    };
    const baseStaleness = {
      status: "fresh",
      as_of: "2026-07-02T00:00:00.000Z",
      updated_at: "2026-07-02T00:00:00.000Z",
      notes: ["fresh fixture"]
    };
    const authority = {
      surface: "agent_workplane",
      read_only_context: true,
      can_write_db: false,
      can_write_proof_evidence: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_actuate_github: false,
      can_execute_codex: false,
      can_execute_runner: false,
      can_schedule: false,
      can_apply_durable_memory: false,
      can_apply_perspective: false,
      can_auto_apply_delta: false,
      can_merge_publish_retry_replay_deploy: false,
      notes: ["read-only fixture"]
    };
    const validation = {
      status: "partial",
      smoke_refs: ["smoke:agent-workplane-node-contract-v0-1"],
      notes: ["fixture validation"]
    };
    function panel(panel_id, node_id, kind, status, title, summary, refs = {}) {
      return {
        panel_id,
        node_id,
        kind,
        title,
        summary,
        status,
        created_at: "2026-07-02T00:00:00.000Z",
        updated_at: "2026-07-02T00:00:00.000Z",
        source_refs: refs.source_refs ?? [\`source:\${panel_id}\`],
        related_run_ids: refs.related_run_ids ?? [],
        related_step_ids: refs.related_step_ids ?? [],
        related_event_ids: refs.related_event_ids ?? [],
        related_batch_ids: refs.related_batch_ids ?? [],
        related_delta_ids: refs.related_delta_ids ?? [],
        related_handoff_refs: refs.related_handoff_refs ?? [],
        authority_boundary: authority,
        validation_summary: validation,
        staleness: refs.staleness ?? baseStaleness,
        fallback_status: refs.fallback_status ?? baseFallback,
        debug_notes: refs.debug_notes ?? ["fixture panel"]
      };
    }

    const nodeContextRead = {
      contract_version: "agent_workplane_node_contract.v0.1",
      scope: "project:augnes",
      as_of: "2026-07-02T00:00:00.000Z",
      source_refs: ["workplane_context:fixture"],
      authority_boundary: authority,
      validation_summary: validation,
      staleness: baseStaleness,
      fallback_status: baseFallback,
      panels: [
        panel("workplane_inspector", "source_ref_bridge", "debug_context_source", "partial", "Workplane Inspector", "Pointer-only source refs.", {
          source_refs: ["delta_projection:fixture", "work_event:event.fixture"],
          related_event_ids: ["event.fixture"]
        }),
        panel("delta_projection", "perspective_delta", "native_panel", "partial", "Delta Projection", "Native Delta Projection panel.", {
          source_refs: ["delta_projection:fixture"],
          related_batch_ids: ["projected.batch.fixture"],
          related_delta_ids: ["delta.fixture"]
        }),
        panel("projected_delta_batch", "perspective_delta", "preview_panel", "preview_only", "Projected Delta Batch", "Projected Delta Projection batch preview context.", {
          source_refs: ["delta_projection:fixture", "projected_batch:fixture"],
          related_batch_ids: ["projected.batch.fixture"],
          related_delta_ids: ["delta.fixture"],
          fallback_status: { ...baseFallback, source_status: "delta_projection" },
          staleness: { ...baseStaleness, status: "unknown" }
        }),
        panel("delta_batch", "runner_delta_batch", "runner_context_source", "ready", "Recovered Runner DeltaBatch", "Recovered runner DeltaBatch ledger readback.", {
          source_refs: ["autonomy_run:run.fixture", "autonomy_run_delta_batch:batch.fixture"],
          related_run_ids: ["run.fixture"],
          related_step_ids: ["step.fixture"],
          related_event_ids: ["event.fixture"],
          related_batch_ids: ["batch.fixture"],
          related_delta_ids: ["runner.delta.fixture"]
        })
      ],
      nodes: [],
      debug_notes: ["fixture"]
    };
    nodeContextRead.nodes = nodeContextRead.panels;

    function assertCommon(context) {
      assert.equal(context.debug_version, "guide_workplane_debug_context.v0.1");
      assert(context.observed.length >= 3);
      assert(context.inferred.length >= 1);
      assert(context.suggested.length >= 2);
      assert(Array.isArray(context.needs_user_judgment));
      assert(context.source_refs.length > 0);
      assert(context.debug_trace.length >= 3);
      assert(context.validation_summary.smoke_refs.includes("smoke:guide-workplane-debug-context-v0-1"));
      assert.equal(context.authority_boundary.can_write_db, false);
      assert.equal(context.authority_boundary.can_write_runner_ledger, false);
      assert.equal(context.authority_boundary.can_record_proof, false);
      assert.equal(context.authority_boundary.can_create_evidence, false);
      assert.equal(context.authority_boundary.can_execute_codex, false);
      assert.equal(context.authority_boundary.can_execute_runner, false);
      assert.equal(context.authority_boundary.can_schedule_runner, false);
      assert.equal(context.authority_boundary.can_project_intent, false);
      assert.equal(context.codex_debug_handoff_candidate.preview_only, true);
    }

    const workplaneInspector = buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id: "workplane_inspector",
        selected_node_id: "source_ref_bridge",
        debug_question: "Why is this Workplane context shown here?"
      }
    });
    assertCommon(workplaneInspector);
    assert.equal(workplaneInspector.selected_context.selection_status, "matched");
    assert.equal(workplaneInspector.selected_context.matched_panel_id, "workplane_inspector");
    assert.equal(workplaneInspector.selected_context.matched_node_id, "source_ref_bridge");

    const projected = buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id: "projected_delta_batch",
        selected_node_id: "perspective_delta"
      }
    });
    assertCommon(projected);
    assert.equal(projected.selected_context.selection_status, "matched");
    assert.equal(projected.selected_context.matched_panel_id, "projected_delta_batch");
    assert(projected.inferred.some((item) => item.summary.includes("projected_delta_batch / perspective_delta")));

    const recovered = buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id: "delta_batch",
        selected_node_id: "runner_delta_batch"
      }
    });
    assertCommon(recovered);
    assert.equal(recovered.selected_context.selection_status, "matched");
    assert.equal(recovered.selected_context.matched_panel_id, "delta_batch");
    assert.equal(recovered.selected_context.matched_node_id, "runner_delta_batch");
    assert(recovered.inferred.some((item) => item.summary.includes("delta_batch / runner_delta_batch")));
    assert(recovered.source_refs.some((ref) => ref.includes("autonomy_run_delta_batch")));

    const nativeProjection = buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id: "delta_projection",
        selected_node_id: "perspective_delta"
      }
    });
    assertCommon(nativeProjection);
    assert.equal(nativeProjection.selected_context.selection_status, "matched");
    assert.equal(nativeProjection.selected_context.matched_panel_id, "delta_projection");
    assert(nativeProjection.inferred.some((item) => item.summary.includes("delta_projection / perspective_delta")));

    assert.notEqual(nativeProjection.selected_context.matched_panel_id, projected.selected_context.matched_panel_id);
    assert.notEqual(projected.selected_context.matched_panel_id, recovered.selected_context.matched_panel_id);

    const unknown = buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id: "unknown_panel"
      }
    });
    assertCommon(unknown);
    assert.equal(unknown.selected_context.selection_status, "not_found");
    assert(unknown.needs_user_judgment.length >= 1);
    assert.equal(unknown.codex_debug_handoff_candidate.status, "blocked");

    console.log(JSON.stringify({
      workplane_inspector_status: workplaneInspector.selected_context.selection_status,
      projected_delta_batch_status: projected.selected_context.selection_status,
      runner_delta_batch_status: recovered.selected_context.selection_status,
      delta_projection_status: nativeProjection.selected_context.selection_status,
      unknown_selection_status: unknown.selected_context.selection_status,
      projected_panel_id: projected.selected_context.matched_panel_id,
      recovered_panel_id: recovered.selected_context.matched_panel_id
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

function assertNoNewRoute() {
  for (const file of changedAndUntrackedFiles()) {
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `No route file changes allowed: ${file}`,
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

function assertNoBroadSourceDeletion() {
  for (const file of changedAndUntrackedFiles()) {
    assert(
      !/^components\/augnes-cockpit\.tsx$/.test(file),
      "Legacy Cockpit deletion or shrink is out of scope",
    );
  }
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
      `Unexpected GuideBrief Workplane Debug Context changed or untracked file: ${file}`,
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

function resolveRootBin(binName) {
  const executableName = process.platform === "win32" ? `${binName}.cmd` : binName;
  const binPath = join(process.cwd(), "node_modules", ".bin", executableName);
  assert(
    existsSync(binPath),
    `missing_root_bin:${binName}: run npm install from the repository root before running smoke:guide-workplane-debug-context-v0-1`,
  );
  return binPath;
}
