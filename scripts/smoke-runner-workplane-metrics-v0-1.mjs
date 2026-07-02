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

const typeFile = "types/augnes-workflow-metrics.ts";
const helperFile = "lib/metrics/runner-workplane-metrics.ts";
const panelFile = "components/workplane/workplane-metrics-panel.tsx";
const docFile = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const smokeFile = "scripts/smoke-runner-workplane-metrics-v0-1.mjs";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const intentDoc = "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md";
const cockpitInventoryDoc =
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md";
const absorptionMapDoc = "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md";
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


const requiredFiles = [
  typeFile,
  helperFile,
  panelFile,
  docFile,
  smokeFile,
  agentWorkplaneFile,
  agentWorkplaneDoc,
  intentDoc,
  cockpitInventoryDoc,
  absorptionMapDoc,
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
  ...followOnAugnesDogfoodFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnAgentWorkplaneRunPostmortemDetailFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const docText = textByFile.get(docFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const intentDocText = textByFile.get(intentDoc);
const cockpitInventoryText = textByFile.get(cockpitInventoryDoc);
const absorptionMapText = textByFile.get(absorptionMapDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const nodeContextText = textByFile.get(nodeContextFile);
const deltaProjectionPanelText = textByFile.get(deltaProjectionPanelFile);
const projectedDeltaBatchPanelText = textByFile.get(projectedDeltaBatchPanelFile);
const runnerDeltaBatchPanelText = textByFile.get(runnerDeltaBatchPanelFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:runner-workplane-metrics-v0-1",
  expectedCommand: "node scripts/smoke-runner-workplane-metrics-v0-1.mjs",
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
      smoke: "runner-workplane-metrics-v0-1",
      pass: true,
      type_exists: true,
      helper_exists: true,
      panel_exists: true,
      doc_exists: true,
      package_script_checked: true,
      index_pointer_checked: true,
      agent_workplane_doc_pointer_checked: true,
      intent_doc_pointer_checked: true,
      required_metric_groups_checked: true,
      required_metric_ids_checked: true,
      authority_boundary_checked: true,
      fixture_metrics_checked: behavior,
      empty_state_checked: true,
      component_no_controls_checked: true,
      agent_workplane_render_checked: true,
      no_route_added_checked: true,
      no_runner_execution_recovery_scheduler_behavior_added: true,
      no_external_authority_or_apply_added: true,
      no_legacy_cockpit_deletion_or_shrink_checked: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:runner-workplane-metrics-v0-1");

function assertDocsAndPointers() {
  assertContainsAll(indexText, [docFile], { label: indexDoc });
  assertContainsAll(agentWorkplaneDocText, [docFile], {
    label: agentWorkplaneDoc,
  });
  assertContainsAll(intentDocText, [docFile, "Runner / Workplane Metrics v0.1"], {
    label: intentDoc,
  });
  assertContainsAll(cockpitInventoryText, [docFile, "Metrics are signals"], {
    label: cockpitInventoryDoc,
  });
  assertContainsAll(absorptionMapText, [docFile, "signal only"], {
    label: absorptionMapDoc,
  });
  assertContainsAll(
    docText,
    [
      "Why Metrics Before Legacy Cockpit Shrink",
      "Metric Groups",
      "Core Workflow Metrics",
      "Runner Metrics",
      "Workplane Review Metrics",
      "GuideBrief Debug and Intent Projection Metrics",
      "Stale and Fallback Metrics",
      "Cockpit Absorption Readiness Metrics",
      "Dogfood Readiness Metrics",
      "Source Refs",
      "Empty and Insufficient Data",
      "Validation Summary",
      "Authority Boundary",
      "data-workplane-metrics-panel=\"v0.1\"",
      "Browser Sanity Expectation",
      "metrics are signals, not execution authority or auto-apply decisions",
      "no runner execution",
      "no runner tick",
      "no runner recovery write",
      "no scheduled runner behavior",
      "no GuideBrief execution authority",
      "no route",
      "no API write route",
      "no server action",
      "no provider/OpenAI call",
      "no GitHub call or actuation",
      "no Codex launch or execution",
      "no DB write or persistence",
      "no proof/evidence write",
      "no durable memory apply",
      "no Perspective apply",
      "no delta auto-apply",
      "no `localStorage` or `sessionStorage` durable view mode",
      "no legacy Cockpit functionality is deleted or shrunk",
      "Recommended next phase: Legacy Cockpit Shrink Plan v0.1",
      "Longer Augnes-on-Augnes Dogfood v0.1",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "AUGNES_WORKFLOW_METRICS_VERSION",
      "AugnesMetricStatus",
      "AugnesMetricTrend",
      "AugnesMetricSignal",
      "AugnesMetricAuthorityBoundary",
      "AugnesWorkflowMetric",
      "AugnesWorkflowMetricGroup",
      "AugnesWorkflowMetricsRead",
      "AugnesWorkflowMetricsInput",
      "RunnerWorkflowMetrics",
      "WorkplaneReviewMetrics",
      "GuideBriefProjectionMetrics",
      "LegacyCockpitReadinessMetrics",
      "DogfoodReadinessMetrics",
      "healthy",
      "watch",
      "needs_review",
      "blocked",
      "unknown",
      "insufficient_data",
      "improving",
      "steady",
      "degrading",
      "runner",
      "workplane",
      "guidebrief",
      "handoff",
      "stale_context",
      "cockpit_absorption",
      "dogfood_readiness",
      "handoff_loss_rate",
      "resume_latency_signal",
      "perspective_delta_quality_signal",
      "review_burden_signal",
      "autonomy_yield_signal",
      "stale_context_incident_count",
      "delta_noise_signal",
      "research_integration_yield_signal",
      "run_completion_rate",
      "scheduled_run_success_rate",
      "delta_batch_recovery_rate",
      "cancelled_run_safety_rate",
      "paused_run_non_execution_rate",
      "forbidden_action_attempt_count",
      "runner_error_rate",
      "average_run_duration_ms",
      "average_delta_batch_count_per_run",
      "needs_review_ratio",
      "recovered_delta_batch_visibility_rate",
      "workplane_review_queue_load",
      "workplane_fallback_source_count",
      "workplane_stale_source_count",
      "intent_projection_reversibility_signal",
      "guidebrief_debug_context_coverage_signal",
      "projected_vs_recovered_deltabatch_identity_signal",
      "cockpit_compatibility_dependency_signal",
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
      "can_recover_delta_batch",
      "can_create_branch_or_pr",
      "can_send_handoff",
      "can_merge_publish_retry_replay_deploy",
      "can_delete_legacy_cockpit",
    ],
    { label: typeFile },
  );
}

function assertHelperStaticShape() {
  assertContainsAll(
    helperText,
    [
      "buildRunnerWorkplaneMetrics",
      "readRunnerWorkplaneMetrics",
      "buildEmptyRunnerWorkplaneMetrics",
      "RUNNER_WORKPLANE_METRIC_GROUPS",
      "RUNNER_WORKPLANE_CORE_METRIC_IDS",
      "RUNNER_WORKPLANE_METRICS_AUTHORITY_BOUNDARY",
      "readWorkplaneContext",
      "buildAgentWorkplaneNodeContextRead",
      "buildGuideWorkplaneDebugContext",
      "buildWorkplaneIntentProjection",
      "smoke:runner-workplane-metrics-v0-1",
      "delta_projection",
      "projected_delta_batch",
      "delta_batch",
      "runner_delta_batch",
      "insufficient_data",
      "metrics are read-only signals",
      "isExplicitForbiddenActionAttempt",
      "isSafeBoundaryDisclosure",
      "blocked_by_authority",
      "authority_violation",
    ],
    { label: helperFile },
  );

  for (const forbidden of [
    "createAutonomyRun(",
    "tickAutonomyRun(",
    "pauseAutonomyRun(",
    "resumeAutonomyRun(",
    "cancelAutonomyRun(",
    "recoverDeltaBatchForRun(",
    "runDueAutonomyRunsOnce(",
    "runAutonomySchedulerWatch(",
    "fetch(",
    "localStorage",
    "sessionStorage",
  ]) {
    assert(
      !helperText.includes(forbidden),
      `${helperFile} must not include ${forbidden}`,
    );
  }
}

function assertComponentStaticShape() {
  assertContainsAll(
    panelText,
    [
      'data-workplane-metrics-panel="v0.1"',
      "data-workplane-metrics-status",
      "Runner metrics",
      "Workplane metrics",
      "GuideBrief / intent projection metrics",
      "Stale/fallback metrics",
      "Cockpit absorption readiness",
      "Dogfood readiness",
      "Authority boundary",
      "Validation summary",
      "Metrics are signals, not authority or auto-apply decisions.",
    ],
    { label: panelFile },
  );

  for (const pattern of [
    /<button\b/,
    /<form\b/,
    /<textarea\b/,
    /<input\b/,
    /\bonClick\s*=/,
    /\bformAction\s*=/,
    /"use server"/,
    /\bserverAction\b/i,
    /\bchat composer\b/i,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
  ]) {
    assert(!pattern.test(panelText), `${panelFile} must not match ${pattern}`);
  }
}

function assertAgentWorkplaneIntegration() {
  assertContainsAll(
    agentWorkplaneText,
    [
      'import { WorkplaneMetricsPanel }',
      "readRunnerWorkplaneMetrics",
      "const workplaneMetrics = await readRunnerWorkplaneMetrics",
      "<WorkplaneMetricsPanel metrics={workplaneMetrics} />",
      "workplane_context: context",
      "node_context_read: workplaneNodeContext",
      "debug_context: workplaneDebugContext",
      "intent_projection: workplaneIntentProjection",
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
    import { buildRunnerWorkplaneMetrics, buildEmptyRunnerWorkplaneMetrics } from "./lib/metrics/runner-workplane-metrics.ts";

    const now = "2026-07-02T00:00:00.000Z";
    const sourceRefs = {
      autonomy_contract_refs: ["autonomy_contract:fixture"],
      guide_brief_refs: ["guidebrief:fixture"],
      handoff_refs: ["handoff:fixture"],
      codex_launch_card_refs: [],
      current_working_perspective_refs: ["current_perspective:fixture"],
      delta_projection_refs: ["delta_projection:fixture"],
      preflight_refs: [],
      runner_refs: ["runner:fixture"],
      docs_refs: ["docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md"],
      repo_refs: ["repo:hynk-studio/augnes"]
    };
    const runnerAuthority = {
      source_of_truth: "autonomy_runner_ledger",
      autonomy_run_is_approval_record: false,
      runner_ledger_is_proof_or_evidence_ledger: false,
      scheduled_run_requires_explicit_local_runner_invocation: true,
      watch_mode_starts_on_import: false,
      can_write_runner_ledger: true,
      can_recover_delta_batch: true,
      can_call_github: false,
      can_call_openai_or_provider: false,
      can_execute_codex: false,
      can_create_branch_or_pr: false,
      can_publish_external: false,
      can_merge: false,
      can_retry_replay_deploy: false,
      can_record_proof: false,
      can_create_evidence: false,
      can_mutate_memory: false,
      can_apply_project_perspective: false,
      can_auto_apply_delta: false,
      notes: ["fixture runner authority"]
    };
    const budget = {
      budget_id: "budget.fixture",
      max_iterations: 3,
      max_tool_calls: 6,
      max_codex_tasks: 0,
      max_external_calls: 0,
      max_provider_calls: 0,
      max_github_calls: 0,
      max_memory_mutations: 0,
      max_perspective_applies: 0,
      notes: ["fixture"]
    };
    function step(run_id, step_id, status) {
      return {
        step_id,
        run_id,
        step_index: 1,
        action_kind: "summarize_current_autonomy_context",
        status,
        title: step_id,
        summary: "Fixture step",
        started_at: status === "planned" ? null : "2026-07-02T00:00:00.000Z",
        finished_at: status === "completed" ? "2026-07-02T00:00:01.000Z" : null,
        output: {},
        error_message: status === "failed" ? "fixture failure" : null,
        created_at: "2026-07-02T00:00:00.000Z",
        updated_at: "2026-07-02T00:00:01.000Z"
      };
    }
    function event(run_id, event_type, message = "fixture event") {
      return {
        event_id: run_id + "." + event_type,
        run_id,
        step_id: null,
        event_type,
        status: "ok",
        message,
        payload: {},
        created_at: "2026-07-02T00:00:00.000Z"
      };
    }
    function batch(run_id, batch_id, delta_count = 2, validation_status = "needs_review") {
      return {
        batch_id,
        run_id,
        batch_version: "autonomy_runner_delta_batch.v0.1",
        status: "needs_review",
        title: batch_id,
        summary: "Recovered fixture DeltaBatch",
        created_at: "2026-07-02T00:00:02.000Z",
        delta_count,
        deltas: Array.from({ length: delta_count }, (_, index) => ({
          delta_id: batch_id + ".delta." + index,
          evidence_refs: [],
          status: "needs_review"
        })),
        source_refs: sourceRefs,
        validation: {
          validation_status,
          completed_checks: ["fixture_check"],
          skipped_checks: [
            {
              check: "no_external_provider_github_codex_call_recorded",
              reason:
                "no_memory_mutation_recorded no_durable_perspective_apply_recorded"
            }
          ],
          notes: [
            "fixture validation",
            "DeltaBatch recovery is not durable Perspective apply.",
            "DeltaBatch recovery is not memory mutation."
          ]
        },
        authority_boundary: runnerAuthority
      };
    }
    function run({ run_id, status, scheduled_for = null, started_at = null, finished_at = null, steps = [], events = [], delta_batches = [] }) {
      return {
        run_id,
        scope: "project:augnes",
        autonomy_contract_ref: "autonomy_contract:fixture",
        title: run_id,
        status,
        scheduled_for,
        started_at,
        finished_at,
        created_at: "2026-07-02T00:00:00.000Z",
        updated_at: "2026-07-02T00:00:02.000Z",
        stop_reason: null,
        source_refs: sourceRefs,
        authority_boundary: runnerAuthority,
        budget_snapshot: budget,
        metadata: {},
        steps,
        events,
        delta_batches
      };
    }
    const runs = [
      run({
        run_id: "run.completed",
        status: "completed",
        started_at: "2026-07-02T00:00:00.000Z",
        finished_at: "2026-07-02T00:00:01.000Z",
        steps: [step("run.completed", "step.completed", "completed")],
        events: [event("run.completed", "run_completed")],
        delta_batches: [batch("run.completed", "batch.completed", 2)]
      }),
      run({
        run_id: "run.needs_review",
        status: "needs_review",
        steps: [step("run.needs_review", "step.review", "completed")],
        events: [event("run.needs_review", "run_needs_review")],
        delta_batches: [batch("run.needs_review", "batch.review", 2)]
      }),
      run({
        run_id: "run.cancelled",
        status: "cancelled",
        steps: [step("run.cancelled", "step.cancelled", "cancelled")],
        events: [event("run.cancelled", "run_cancelled")]
      }),
      run({
        run_id: "run.paused",
        status: "paused",
        steps: [step("run.paused", "step.paused", "planned")],
        events: [event("run.paused", "run_paused")]
      }),
      run({
        run_id: "run.scheduled.completed",
        status: "completed",
        scheduled_for: "2026-07-02T00:00:00.000Z",
        started_at: "2026-07-02T00:00:00.000Z",
        finished_at: "2026-07-02T00:00:02.000Z",
        steps: [step("run.scheduled.completed", "step.scheduled", "completed")],
        events: [
          event(
            "run.scheduled.completed",
            "run_scheduled",
            "Scheduled run recorded; it will execute only when the local runner or scheduler is explicitly invoked."
          ),
          event("run.scheduled.completed", "run_completed")
        ]
      }),
      run({
        run_id: "run.blocked",
        status: "blocked",
        steps: [step("run.blocked", "step.failed", "failed")],
        events: [event("run.blocked", "run_blocked", "fixture blocked")]
      })
    ];

    const fallback = { status: "runtime", reason: null, source_status: "runtime", notes: ["runtime"] };
    const stale = { status: "fresh", as_of: now, updated_at: now, notes: ["fresh"] };
    const nodeAuthority = {
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
    function panel(panel_id, node_id, source_refs = []) {
      return {
        panel_id,
        node_id,
        kind: panel_id === "delta_batch" ? "runner_context_source" : "native_panel",
        title: panel_id,
        summary: panel_id,
        status: "partial",
        created_at: now,
        updated_at: now,
        source_refs,
        related_run_ids: panel_id === "delta_batch" ? ["run.completed"] : [],
        related_step_ids: [],
        related_event_ids: [],
        related_batch_ids: panel_id === "delta_batch" ? ["batch.completed"] : [],
        related_delta_ids: panel_id === "delta_batch" ? ["batch.completed.delta.0"] : [],
        related_handoff_refs: [],
        authority_boundary: nodeAuthority,
        validation_summary: validation,
        staleness: stale,
        fallback_status: fallback,
        debug_notes: ["fixture"]
      };
    }
    const node_context_read = {
      contract_version: "agent_workplane_node_contract.v0.1",
      scope: "project:augnes",
      as_of: now,
      source_refs: ["node_context:fixture"],
      authority_boundary: nodeAuthority,
      validation_summary: validation,
      staleness: stale,
      fallback_status: fallback,
      panels: [
        panel("delta_projection", "perspective_delta", ["delta_projection:fixture"]),
        panel("projected_delta_batch", "perspective_delta", ["projected_delta_batch:fixture"]),
        panel("delta_batch", "runner_delta_batch", ["runner_delta_batch:fixture"]),
        panel("legacy_cockpit_compatibility", "legacy_cockpit_compatibility", ["legacy:fixture"])
      ],
      nodes: [],
      debug_notes: ["fixture"]
    };
    node_context_read.nodes = node_context_read.panels;
    const workplane_context = {
      overview: {
        scope: "project:augnes",
        current_perspective: {
          active_goal_count: 2,
          next_candidate_count: 1,
          staleness_status: "fresh"
        },
        runner_delta_batch: {
          recovered_delta_count: 4
        },
        review_queue: {
          total_attention_count: 4
        }
      },
      source_status: {
        current_perspective: "runtime",
        delta_projection: "fixture_fallback",
        runner_delta_batch: "runner_ledger"
      },
      delta_projection_read: {
        data: {
          deltas: [
            { evidence_refs: ["evidence:1"] },
            { evidence_refs: [] }
          ]
        }
      },
      runner_delta_batch_read: {
        recovered_batch_count: 1,
        staleness: { status: "fresh" }
      },
      workplane_notes: ["workplane fixture"]
    };
    const debug_context = {
      as_of: now,
      observed: [{ summary: "observed" }],
      inferred: [{ summary: "inferred" }],
      suggested: [{ summary: "suggested" }],
      needs_user_judgment: [],
      source_refs: ["debug:fixture"],
      selected_context: { source_refs: ["debug:selected"] }
    };
    const intent_projection = {
      created_at: now,
      source_refs: ["intent:fixture"],
      candidate_handoffs: [{ status: "draft_only" }],
      reversibility: {
        reversible: true,
        dismissible: true,
        durable_state_changed: false
      }
    };
    const metrics = buildRunnerWorkplaneMetrics({
      scope: "project:augnes",
      now,
      runner_runs: runs,
      workplane_context,
      node_context_read,
      debug_context,
      intent_projection,
      cockpit_inventory_text: "needs_native_absorption legacy_only_still_useful",
      native_absorption_map_text: "partial native replacement exists"
    });
    const find = (id) => metrics.groups.flatMap((group) => group.metrics).find((metric) => metric.metric_id === id);
    assert.equal(find("run_completion_rate").value, 2 / 6);
    assert.equal(find("scheduled_run_success_rate").value, 1);
    assert.equal(find("delta_batch_recovery_rate").value, 2 / 4);
    assert.equal(find("cancelled_run_safety_rate").value, 1);
    assert.equal(find("paused_run_non_execution_rate").value, 1);
    assert.equal(find("forbidden_action_attempt_count").value, 0);
    assert.equal(find("runner_error_rate").value, 1 / 6);
    assert.equal(find("average_run_duration_ms").value, 1500);
    assert.equal(find("average_delta_batch_count_per_run").value, 2 / 6);
    assert.equal(find("needs_review_ratio").value, 1 / 6);
    assert.equal(find("workplane_review_queue_load").value, 4);
    assert.equal(find("recovered_delta_batch_visibility_rate").value, 1);
    assert.equal(find("workplane_fallback_source_count").value, 1);
    assert.equal(find("intent_projection_reversibility_signal").value, 1);
    assert.equal(find("guidebrief_debug_context_coverage_signal").value, 1);
    assert.equal(find("projected_vs_recovered_deltabatch_identity_signal").value, 1);
    assert(metrics.source_refs.includes("docs/AUGNES_WORKFLOW_METRICS_V0_1.md"));
    assert(metrics.validation_summary.smoke_refs.includes("smoke:runner-workplane-metrics-v0-1"));
    assert.equal(metrics.authority_boundary.can_execute_runner, false);
    assert.equal(metrics.authority_boundary.can_recover_delta_batch, false);
    assert.equal(metrics.authority_boundary.can_schedule_runner, false);
    assert.equal(metrics.authority_boundary.can_write_db, false);
    assert.equal(metrics.authority_boundary.can_delete_legacy_cockpit, false);
    const explicitForbiddenAttemptMetrics = buildRunnerWorkplaneMetrics({
      scope: "project:augnes",
      now,
      runner_runs: [
        run({
          run_id: "run.explicit_forbidden_attempt",
          status: "blocked",
          steps: [step("run.explicit_forbidden_attempt", "step.explicit", "failed")],
          events: [
            event(
              "run.explicit_forbidden_attempt",
              "run_blocked",
              "forbidden provider call attempted"
            )
          ]
        })
      ],
      workplane_context,
      node_context_read,
      debug_context,
      intent_projection
    });
    const explicitFind = (id) =>
      explicitForbiddenAttemptMetrics.groups
        .flatMap((group) => group.metrics)
        .find((metric) => metric.metric_id === id);
    assert.equal(
      explicitFind("forbidden_action_attempt_count").value,
      1
    );
    const empty = buildEmptyRunnerWorkplaneMetrics({ now });
    assert.equal(empty.runner_metrics.run_completion_rate.status, "insufficient_data");
    assert(empty.caveats.some((caveat) => /insufficient data/.test(caveat)));
    console.log(JSON.stringify({
      run_completion_rate: find("run_completion_rate").value,
      scheduled_run_success_rate: find("scheduled_run_success_rate").value,
      delta_batch_recovery_rate: find("delta_batch_recovery_rate").value,
      runner_error_rate: find("runner_error_rate").value,
      review_queue_load: find("workplane_review_queue_load").value,
      recovered_visibility: find("recovered_delta_batch_visibility_rate").value,
      fallback_count: find("workplane_fallback_source_count").value,
      identity_signal: find("projected_vs_recovered_deltabatch_identity_signal").value,
      safe_boundary_forbidden_attempt_count: find("forbidden_action_attempt_count").value,
      explicit_forbidden_attempt_count: explicitFind("forbidden_action_attempt_count").value,
      empty_status: empty.runner_metrics.run_completion_rate.status
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
    assert(!/^apps\//.test(file), `No MCP/App tool changes allowed: ${file}`);
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
  const deletionNameStatus = collectNameStatus(["diff", "--name-status", "HEAD"]);
  const broadDeletion = deletionNameStatus.find((line) => line.startsWith("D"));
  assert(!broadDeletion, `No broad source deletion allowed: ${broadDeletion}`);
}

function assertChangedFileBoundary() {
  const files = changedAndUntrackedFiles();
  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Runner / Workplane Metrics changed or untracked file: ${file}`,
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
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function resolveRootBin(name) {
  return process.platform === "win32"
    ? `node_modules/.bin/${name}.cmd`
    : `node_modules/.bin/${name}`;
}
