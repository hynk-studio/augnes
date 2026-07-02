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

const typeFile = "types/workplane-intent-projection.ts";
const helperFile = "lib/guide/workplane-intent-projection.ts";
const viewHelperFile = "lib/workplane/apply-workplane-view-projection.ts";
const workplanePanelFile =
  "components/workplane/workplane-intent-mode-panel.tsx";
const guidePanelFile = "components/guide/guide-intent-projection-panel.tsx";
const docFile = "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md";
const smokeFile = "scripts/smoke-guidebrief-intent-projection-v0-1.mjs";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const debugDoc = "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md";
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
const debugHelperFile = "lib/guide/guide-workplane-debug-context.ts";
const debugTypeFile = "types/guide-debug-context.ts";
const debugPanelFile = "components/guide/guide-workplane-debug-panel.tsx";

const existingSmokeFiles = [
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

const requiredFiles = [
  typeFile,
  helperFile,
  viewHelperFile,
  workplanePanelFile,
  guidePanelFile,
  docFile,
  smokeFile,
  agentWorkplaneFile,
  guideBriefDoc,
  debugDoc,
  agentWorkplaneDoc,
  nodeContractDoc,
  runnerIntegrationDoc,
  indexDoc,
  packageJsonFile,
  nodeContextFile,
  deltaProjectionPanelFile,
  projectedDeltaBatchPanelFile,
  runnerDeltaBatchPanelFile,
  debugHelperFile,
  debugTypeFile,
  debugPanelFile,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...existingSmokeFiles,
  ...followOnRunnerWorkplaneMetricsFiles,
  ...followOnAugnesDogfoodFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const viewHelperText = textByFile.get(viewHelperFile);
const workplanePanelText = textByFile.get(workplanePanelFile);
const guidePanelText = textByFile.get(guidePanelFile);
const docText = textByFile.get(docFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const guideBriefDocText = textByFile.get(guideBriefDoc);
const debugDocText = textByFile.get(debugDoc);
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
  scriptName: "smoke:guidebrief-intent-projection-v0-1",
  expectedCommand: "node scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
assertViewHelperStaticShape();
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
      smoke: "guidebrief-intent-projection-v0-1",
      pass: true,
      type_exists: true,
      helper_exists: true,
      view_helper_exists: true,
      workplane_panel_exists: true,
      guide_panel_exists: true,
      doc_exists: true,
      package_script_checked: true,
      index_pointer_checked: true,
      guidebrief_doc_pointer_checked: true,
      debug_doc_pointer_checked: true,
      agent_workplane_doc_pointer_checked: true,
      required_type_fields_checked: true,
      helper_exports_checked: true,
      view_helper_exports_checked: true,
      example_intents_checked: behavior.example_classes,
      runner_priorities_checked: behavior.runner_priorities_checked,
      handoff_candidate_checked: behavior.handoff_candidate_checked,
      runner_config_candidate_checked: behavior.runner_config_candidate_checked,
      perspective_update_candidate_checked:
        behavior.perspective_update_candidate_checked,
      executable_deferred_checked: behavior.executable_deferred_checked,
      pure_view_projection_checked: behavior.pure_view_projection_checked,
      projected_vs_recovered_deltabatch_distinction_checked: true,
      components_no_controls_checked: true,
      no_route_added_checked: true,
      no_runner_execution_recovery_scheduler_behavior_added: true,
      no_external_authority_or_apply_added: true,
      no_legacy_cockpit_deletion_checked: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:guidebrief-intent-projection-v0-1");

function assertDocsAndPointers() {
  assertContainsAll(indexText, [docFile], { label: indexDoc });
  assertContainsAll(guideBriefDocText, [docFile], { label: guideBriefDoc });
  assertContainsAll(debugDocText, [docFile], { label: debugDoc });
  assertContainsAll(agentWorkplaneDocText, [docFile], {
    label: agentWorkplaneDoc,
  });
  assertContainsAll(
    nodeContractDocText,
    ["GuideBrief Intent Projection v0.1 now consumes this contract"],
    { label: nodeContractDoc },
  );
  assertContainsAll(
    runnerIntegrationDocText,
    ["GuideBrief Intent Projection v0.1 now uses this read-only recovered runner DeltaBatch context"],
    { label: runnerIntegrationDoc },
  );

  assertContainsAll(
    docText,
    [
      "Why This Exists",
      "How It Builds on Debug Context",
      "Input Shape",
      "Output Shape",
      "Supported Intent Classes",
      "View Projection Behavior",
      "Draft Projection Behavior",
      "Candidate Action Behavior",
      "Candidate Handoff Behavior",
      "Candidate Runner Config Behavior",
      "Candidate Perspective Update Behavior",
      "Display Filters",
      "Source Refs",
      "Stale and Fallback Warnings",
      "Needs User Judgment",
      "Reversibility and Dismissibility",
      "Authority Boundary",
      "Projected vs Recovered DeltaBatch Distinction",
      "data-guide-intent-projection-panel=\"v0.1\"",
      "data-workplane-intent-mode-panel=\"v0.1\"",
      "Browser Sanity Expectation",
      "no executable projection",
      "no runner execution",
      "no runner recovery write",
      "no scheduled runner behavior",
      "no GuideBrief execution authority",
      "no route",
      "no API write route",
      "no server action",
      "no chat composer",
      "no provider/OpenAI call",
      "no GitHub call or actuation",
      "no Codex launch or execution",
      "no DB write or persistence",
      "no proof/evidence write",
      "no durable memory apply",
      "no Perspective apply",
      "no delta auto-apply",
      "no `localStorage` or `sessionStorage` durable view mode",
      "no legacy Cockpit shrink or deletion",
      "Runner / Workplane Metrics v0.1 is the implemented follow-on",
      "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "WORKPLANE_INTENT_PROJECTION_VERSION",
      "WorkplaneIntentClass",
      "WorkplaneIntentProjectionLevel",
      "WorkplaneIntentProjectionStatus",
      "WorkplaneIntentProjectionInput",
      "WorkplaneInterpretedIntent",
      "WorkplaneIntentPanelMode",
      "WorkplaneIntentDisplayFilter",
      "WorkplaneIntentCandidateAction",
      "WorkplaneIntentCandidateHandoff",
      "WorkplaneIntentCandidateRunnerConfig",
      "WorkplaneIntentCandidatePerspectiveUpdate",
      "WorkplaneIntentAuthorityBoundary",
      "WorkplaneIntentNeedsUserJudgmentItem",
      "WorkplaneIntentReversibility",
      "WorkplaneIntentProjection",
      "WorkplaneIntentProjectionRead",
      "debug",
      "navigate",
      "review",
      "handoff",
      "run_planning",
      "dogfood",
      "research",
      "implementation",
      "cleanup",
      "metric_review",
      "perspective_alignment",
      "unknown",
      "view_projection",
      "draft_projection",
      "executable_projection_deferred",
      "projected",
      "partial",
      "needs_user_judgment",
      "unsupported",
      "empty_intent",
      "original_user_intent",
      "selected_panel_id",
      "selected_node_id",
      "selected_run_id",
      "selected_step_id",
      "selected_event_id",
      "selected_batch_id",
      "selected_delta_id",
      "selected_handoff_ref",
      "debug_question",
      "max_focus_refs",
      "max_candidate_actions",
      "projection_id",
      "projection_version",
      "created_at",
      "interpreted_intent",
      "intent_class",
      "projection_level",
      "projection_status",
      "target_surface",
      "focus_refs",
      "suppressed_refs",
      "prioritized_panels",
      "suggested_panel_modes",
      "candidate_actions",
      "candidate_handoffs",
      "candidate_runner_configs",
      "candidate_perspective_updates",
      "display_filters",
      "source_refs",
      "stale_warnings",
      "authority_boundary",
      "needs_user_judgment",
      "reversibility",
      "validation_summary",
      "debug_context_refs",
      "can_change_ui_view",
      "can_create_draft_projection",
      "can_create_handoff_candidate",
      "can_create_runner_config_candidate",
      "can_create_perspective_candidate",
      "can_apply_perspective",
      "can_mutate_memory",
      "can_execute_runner",
      "can_schedule_runner",
      "can_recover_delta_batch",
      "can_call_provider_openai",
      "can_call_github",
      "can_actuate_github",
      "can_execute_codex",
      "can_create_branch_or_pr",
      "can_auto_apply_delta",
      "can_write_db",
      "can_write_runner_ledger",
      "can_record_proof",
      "can_create_evidence",
      "can_merge_publish_retry_replay_deploy",
      "can_send_handoff",
      "durable_state_changed",
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
      "buildWorkplaneIntentProjection",
      "readWorkplaneIntentProjection",
      "WORKPLANE_INTENT_PROJECTION_EXAMPLES",
      "WORKPLANE_INTENT_CLASS_RULES",
      "buildGuideWorkplaneDebugContext",
      "readAgentWorkplaneNodeContext",
      "Focus the Workplane on runner and DeltaBatch review.",
      "delta_batch",
      "runner_delta_batch",
      "projected_delta_batch",
      "delta_projection / perspective_delta",
      "projected_delta_batch / perspective_delta",
      "delta_batch / runner_delta_batch",
      "candidate_handoffs",
      "candidate_runner_configs",
      "candidate_perspective_updates",
      "draft_only",
      "executable_projection_deferred",
      "smoke:guidebrief-intent-projection-v0-1",
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
    /\bcreateBranch\b/i,
    /\bcreatePullRequest\b/i,
    /\blocalStorage\./,
    /\bsessionStorage\./,
  ]) {
    assert(!pattern.test(helperText), `${helperFile} must not match ${pattern}`);
  }
}

function assertViewHelperStaticShape() {
  assertContainsAll(
    viewHelperText,
    [
      "applyWorkplaneViewProjection",
      "buildProjectedWorkplanePanelOrder",
      "filterWorkplaneRefsForProjection",
      "ordered_panel_ids",
      "highlighted_panel_ids",
      "hidden_panel_ids",
      "Pure non-durable view model only.",
      "Input node context is not mutated.",
    ],
    { label: viewHelperFile },
  );

  for (const pattern of [
    /\bfetch\s*\(/,
    /\bPOST\s*\(/,
    /\bPUT\s*\(/,
    /\bPATCH\s*\(/,
    /\bDELETE\s*\(/,
    /\bnew\s+Database\b/,
    /from\s+["']@\/lib\/db/,
    /\breadRunnerDeltaBatchesForWorkplane\b/,
    /\brecoverDeltaBatchForRun\s*\(/,
    /\btickAutonomyRun\s*\(/,
    /\brunAutonomyScheduler/i,
    /\boctokit\b/i,
    /from\s+["'][^"']*openai[^"']*["']/i,
    /\blocalStorage\./,
    /\bsessionStorage\./,
    /\bsetItem\s*\(/,
  ]) {
    assert(!pattern.test(viewHelperText), `${viewHelperFile} must not match ${pattern}`);
  }
}

function assertComponentStaticShape() {
  assertContainsAll(
    workplanePanelText,
    [
      "WorkplaneIntentProjection",
      'data-workplane-intent-mode-panel="v0.1"',
      "data-workplane-intent-class",
      "data-workplane-intent-projection-status",
      "Reversible View Projection",
      "reversible",
      "durable_state_changed",
      "dismissible",
      "View and draft candidate authority only.",
    ],
    { label: workplanePanelFile },
  );
  assertContainsAll(
    guidePanelText,
    [
      "WorkplaneIntentProjection",
      'data-guide-intent-projection-panel="v0.1"',
      "data-guide-intent-class",
      "data-guide-intent-projection-level",
      "data-guide-intent-projection-status",
      "Draft Projection Packet",
      "Draft candidate actions",
      "Candidate handoffs",
      "Candidate runner configs",
      "Candidate Perspective updates",
      "Draft projection authority only.",
    ],
    { label: guidePanelFile },
  );

  for (const [file, text] of [
    [workplanePanelFile, workplanePanelText],
    [guidePanelFile, guidePanelText],
  ]) {
    for (const pattern of [
      /<button\b/i,
      /<form\b/i,
      /<textarea\b/i,
      /<input\b/i,
      /\bonClick\s*=/,
      /\bformAction\s*=/,
      /"use server"/,
      /\bserverAction\b/i,
      /\bchat\s*composer/i,
      /\bmutate[A-Z]\w*\s*\(/,
      /\bexecute[A-Z]\w*\s*\(/,
      /\brecover[A-Z]\w*\s*\(/,
      /\btick[A-Z]\w*\s*\(/,
      /\bschedule[A-Z]\w*\s*\(/,
    ]) {
      assert(!pattern.test(text), `${file} must not match ${pattern}`);
    }
  }
}

function assertAgentWorkplaneIntegration() {
  assertContainsAll(
    agentWorkplaneText,
    [
      'import { GuideIntentProjectionPanel }',
      'import { WorkplaneIntentModePanel }',
      "buildWorkplaneIntentProjection",
      "WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT",
      "applyWorkplaneViewProjection",
      "<GuideIntentProjectionPanel projection={workplaneIntentProjection} />",
      "<WorkplaneIntentModePanel",
      "selected_panel_id:",
      "selected_node_id:",
      "debug_question:",
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
    import { buildWorkplaneIntentProjection } from "./lib/guide/workplane-intent-projection.ts";
    import { applyWorkplaneViewProjection } from "./lib/workplane/apply-workplane-view-projection.ts";

    const fallback = { status: "runtime", reason: null, source_status: "runtime", notes: ["runtime"] };
    const staleness = { status: "fresh", as_of: "2026-07-02T00:00:00.000Z", updated_at: "2026-07-02T00:00:00.000Z", notes: ["fresh"] };
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
      notes: ["read-only"]
    };
    const validation = { status: "partial", smoke_refs: ["smoke:agent-workplane-node-contract-v0-1"], notes: ["fixture"] };
    function panel(panel_id, node_id, kind, status, title, refs = {}) {
      return {
        panel_id,
        node_id,
        kind,
        title,
        summary: title + " summary",
        status,
        created_at: "2026-07-02T00:00:00.000Z",
        updated_at: "2026-07-02T00:00:00.000Z",
        source_refs: refs.source_refs ?? ["source:" + panel_id],
        related_run_ids: refs.related_run_ids ?? [],
        related_step_ids: refs.related_step_ids ?? [],
        related_event_ids: refs.related_event_ids ?? [],
        related_batch_ids: refs.related_batch_ids ?? [],
        related_delta_ids: refs.related_delta_ids ?? [],
        related_handoff_refs: refs.related_handoff_refs ?? [],
        authority_boundary: authority,
        validation_summary: validation,
        staleness: refs.staleness ?? staleness,
        fallback_status: refs.fallback_status ?? fallback,
        debug_notes: refs.debug_notes ?? ["fixture"]
      };
    }
    const nodeContextRead = {
      contract_version: "agent_workplane_node_contract.v0.1",
      scope: "project:augnes",
      as_of: "2026-07-02T00:00:00.000Z",
      source_refs: ["workplane_context:fixture"],
      authority_boundary: authority,
      validation_summary: validation,
      staleness,
      fallback_status: fallback,
      panels: [
        panel("work_queue", "current_objective", "native_panel", "partial", "Work Queue"),
        panel("current_perspective", "current_perspective", "native_panel", "partial", "Current Perspective"),
        panel("delta_projection", "perspective_delta", "native_panel", "partial", "Delta Projection", {
          source_refs: ["delta_projection:fixture"],
          related_batch_ids: ["projected.batch.fixture"],
          related_delta_ids: ["projected.delta.fixture"]
        }),
        panel("projected_delta_batch", "perspective_delta", "preview_panel", "preview_only", "Projected Delta Batch", {
          source_refs: ["projected_batch:fixture"],
          related_batch_ids: ["projected.batch.fixture"],
          related_delta_ids: ["projected.delta.fixture"]
        }),
        panel("delta_batch", "runner_delta_batch", "runner_context_source", "ready", "Recovered Runner DeltaBatch", {
          source_refs: ["autonomy_run:run.fixture", "autonomy_run_delta_batch:batch.fixture"],
          related_run_ids: ["run.fixture"],
          related_step_ids: ["step.fixture"],
          related_event_ids: ["event.fixture"],
          related_batch_ids: ["batch.fixture"],
          related_delta_ids: ["runner.delta.fixture"]
        }),
        panel("trace_diagnostics", "trace_bridge", "trace_context_source", "partial", "Trace Diagnostics"),
        panel("review_queue", "authority_validation_debug", "native_panel", "partial", "Review Queue"),
        panel("workplane_inspector", "source_ref_bridge", "debug_context_source", "partial", "Workplane Inspector"),
        panel("handoff_builder_preview", "handoff_context", "handoff_context_source", "preview_only", "Handoff Builder")
      ],
      nodes: [],
      debug_notes: ["fixture"]
    };
    nodeContextRead.nodes = nodeContextRead.panels;
    const debugContext = buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id: "delta_batch",
        selected_node_id: "runner_delta_batch",
        debug_question: "How should the Workplane focus runner and DeltaBatch review?"
      }
    });

    function build(intent) {
      return buildWorkplaneIntentProjection({
        original_user_intent: intent,
        node_context_read: nodeContextRead,
        debug_context: debugContext,
        now: "2026-07-02T00:00:00.000Z"
      });
    }
    function assertCommon(projection) {
      assert.equal(projection.projection_version, "workplane_intent_projection.v0.1");
      assert.equal(projection.authority_boundary.can_change_ui_view, true);
      assert.equal(projection.authority_boundary.can_create_draft_projection, true);
      assert.equal(projection.authority_boundary.can_create_handoff_candidate, true);
      assert.equal(projection.authority_boundary.can_create_runner_config_candidate, true);
      assert.equal(projection.authority_boundary.can_create_perspective_candidate, true);
      assert.equal(projection.authority_boundary.can_apply_perspective, false);
      assert.equal(projection.authority_boundary.can_execute_runner, false);
      assert.equal(projection.authority_boundary.can_schedule_runner, false);
      assert.equal(projection.authority_boundary.can_recover_delta_batch, false);
      assert.equal(projection.authority_boundary.can_call_provider_openai, false);
      assert.equal(projection.authority_boundary.can_call_github, false);
      assert.equal(projection.authority_boundary.can_execute_codex, false);
      assert.equal(projection.authority_boundary.can_write_db, false);
      assert.equal(projection.authority_boundary.can_write_runner_ledger, false);
      assert.equal(projection.authority_boundary.can_record_proof, false);
      assert.equal(projection.authority_boundary.can_create_evidence, false);
      assert.equal(projection.authority_boundary.can_send_handoff, false);
      assert.equal(projection.reversibility.reversible, true);
      assert.equal(projection.reversibility.durable_state_changed, false);
      assert.equal(projection.reversibility.dismissible, true);
      assert(projection.source_refs.length > 0);
      assert(projection.validation_summary.smoke_refs.includes("smoke:guidebrief-intent-projection-v0-1"));
      assert(Array.isArray(projection.stale_warnings));
      assert(Array.isArray(projection.needs_user_judgment));
    }

    const examples = {
      navigate: build("Show only post-Phase-9 next work."),
      handoff: build("Prepare this state for Codex handoff."),
      runner: build("Focus the Workplane on runner and DeltaBatch review."),
      dogfood: build("Sort next actions by impact on Augnes-on-Augnes dogfood."),
      staleRun: build("Show what is stale before starting a scheduled run."),
      perspective: build("Use this perspective lens for the next work session.")
    };
    Object.values(examples).forEach(assertCommon);
    assert.equal(examples.navigate.intent_class, "navigate");
    assert.equal(examples.handoff.intent_class, "handoff");
    assert.equal(examples.runner.intent_class, "run_planning");
    assert.equal(examples.dogfood.intent_class, "dogfood");
    assert.equal(examples.staleRun.intent_class, "debug");
    assert.equal(examples.perspective.intent_class, "perspective_alignment");
    for (const id of ["delta_batch", "projected_delta_batch", "delta_projection", "trace_diagnostics", "review_queue", "workplane_inspector"]) {
      assert(examples.runner.prioritized_panels.includes(id), "runner intent missing priority " + id);
    }
    assert(examples.handoff.candidate_handoffs.some((item) => item.status === "draft_only"));
    assert(examples.runner.candidate_runner_configs.some((item) => item.status === "draft_only"));
    assert(examples.perspective.candidate_perspective_updates.some((item) => item.status === "draft_only"));
    const executable = build("Run the runner and schedule recovery now.");
    assertCommon(executable);
    assert.equal(executable.projection_level, "executable_projection_deferred");
    assert.equal(executable.projection_status, "needs_user_judgment");
    assert(executable.needs_user_judgment.some((item) => item.judgment_id === "judgment.executable_language_deferred"));
    assert(examples.runner.notes.some((note) => note.includes("delta_projection / perspective_delta")));
    assert(examples.runner.notes.some((note) => note.includes("projected_delta_batch / perspective_delta")));
    assert(examples.runner.notes.some((note) => note.includes("delta_batch / runner_delta_batch")));

    const before = JSON.stringify(nodeContextRead);
    const view = applyWorkplaneViewProjection({
      projection: examples.runner,
      node_context_read: nodeContextRead
    });
    const after = JSON.stringify(nodeContextRead);
    assert.equal(before, after);
    assert(view.ordered_panel_ids.includes("delta_batch"));
    assert(view.highlighted_panel_ids.includes("delta_batch"));
    assert(view.focus_refs.includes("autonomy_run_delta_batch:batch.fixture"));

    console.log(JSON.stringify({
      example_classes: Object.fromEntries(Object.entries(examples).map(([key, value]) => [key, value.intent_class])),
      runner_priorities_checked: true,
      handoff_candidate_checked: true,
      runner_config_candidate_checked: true,
      perspective_update_candidate_checked: true,
      executable_deferred_checked: true,
      pure_view_projection_checked: true
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
      `Unexpected GuideBrief Intent Projection changed or untracked file: ${file}`,
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
    `missing_root_bin:${binName}: run npm install from the repository root before running smoke:guidebrief-intent-projection-v0-1`,
  );
  return binPath;
}
