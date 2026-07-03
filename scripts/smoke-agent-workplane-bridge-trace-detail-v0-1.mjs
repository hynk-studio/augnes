#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/workplane-bridge-trace-detail.ts";
const helperFile = "lib/workplane/workplane-bridge-trace-detail.ts";
const panelFile = "components/workplane/source-ref-bridge-detail-panel.tsx";
const docFile = "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md";
const smokeFile = "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const absorptionMapDoc = "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md";
const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const browserRegressionDoc =
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const nodeContextHelperFile = "lib/workplane/workplane-node-context.ts";
const browserRegressionHelperFile =
  "lib/workplane/workplane-browser-regression.ts";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";

const bridgeTraceDetailSliceFiles = [
  typeFile,
  helperFile,
  panelFile,
  docFile,
  smokeFile,
  agentWorkplaneFile,
  nodeContextHelperFile,
  browserRegressionHelperFile,
  agentWorkplaneDoc,
  absorptionMapDoc,
  shrinkPlanDoc,
  browserRegressionDoc,
  indexDoc,
  packageJsonFile,
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

const followOnLegacyCockpitLocalControlClassificationFiles = [
  "types/legacy-cockpit-local-control-classification.ts",
  "lib/workplane/legacy-cockpit-local-control-classification.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const existingSmokeAllowlistFiles = [
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
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
  "types/augnes-dogfood-metrics-baseline.ts",
  "lib/dogfood/augnes-dogfood-metrics-baseline.ts",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "scripts/run-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",

  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "app/cockpit/page.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",

];

const allowedChangedFiles = [
  ...bridgeTraceDetailSliceFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnAgentWorkplaneRunPostmortemDetailFiles,
  ...followOnLegacyCockpitLocalControlClassificationFiles,
  ...existingSmokeAllowlistFiles,
];

const requiredFiles = [
  ...bridgeTraceDetailSliceFiles,
  augnesCockpitFile,
  cockpitPageFile,
  legacyCompatibilityPanelFile,
];

const requiredStatuses = [
  "ready",
  "partial",
  "empty",
  "fallback",
  "needs_review",
  "insufficient_data",
];

const requiredRefKinds = [
  "current_perspective",
  "delta_projection",
  "projected_delta_batch",
  "runner_delta_batch",
  "work_event",
  "coordination_event",
  "action_record",
  "evidence",
  "artifact",
  "handoff",
  "diagnostic",
  "snapshot",
  "smoke",
  "docs",
  "repo",
  "legacy_cockpit_compatibility",
];

const requiredBridgeRows = [
  "source_ref_bridge",
  "trace_bridge",
  "delta_projection",
  "projected_delta_batch",
  "runner_delta_batch",
  "legacy_cockpit_compatibility",
];

const requiredAuthorityFields = [
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
  "can_delete_or_shrink_legacy_cockpit",
  "can_hide_legacy_cockpit",
];

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const docText = textByFile.get(docFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const absorptionMapText = textByFile.get(absorptionMapDoc);
const shrinkPlanText = textByFile.get(shrinkPlanDoc);
const browserRegressionDocText = textByFile.get(browserRegressionDoc);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const nodeContextText = textByFile.get(nodeContextHelperFile);
const browserRegressionHelperText = textByFile.get(browserRegressionHelperFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-bridge-trace-detail-v0-1",
  expectedCommand:
    "node scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
assertPanelStaticShape();
assertWorkplaneIntegration();
assertBrowserRegressionUpdated();
const behavior = assertHelperAndRegressionBehavior();
assertCompatibilityStillRendered();
const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "agent workplane bridge trace detail v0.1",
});
assertNoSourceDeletion();
assertNoRouteOrAuthorityPathAdded();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-bridge-trace-detail-v0-1",
      pass: true,
      type_exists: true,
      helper_exists: true,
      panel_exists: true,
      doc_exists: true,
      package_script_checked: true,
      docs_pointers_checked: true,
      statuses_checked: requiredStatuses,
      ref_kinds_checked: requiredRefKinds,
      bridge_rows_checked: behavior.bridge_row_ids,
      authority_fields_checked: requiredAuthorityFields,
      helper_report_status: behavior.helper_status,
      browser_regression_status: behavior.browser_status,
      bridge_capability_status: behavior.bridge_capability_status,
      source_ref_capability_status: behavior.source_ref_capability_status,
      validation_capability_status: behavior.validation_capability_status,
      no_route_or_authority_added_checked: true,
      no_legacy_cockpit_deletion_shrink_hide_checked: true,
      deltabatch_identity_separation_checked: true,
      changed_files_boundary: changedFilesBoundary,
      changed_files_allowed: allowedChangedFiles,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-bridge-trace-detail-v0-1");

function assertDocsAndPointers() {
  for (const text of [
    indexText,
    agentWorkplaneDocText,
    absorptionMapText,
    shrinkPlanText,
    browserRegressionDocText,
  ]) {
    assertContainsAll(text, [docFile], {
      label: "bridge trace detail backlink docs",
    });
  }

  assertContainsAll(
    docText,
    [
      "Why Bridge / Trace Detail Hardening Exists",
      "Shrink-Plan Gaps Addressed",
      "Native Source Ref Bridge / Trace Bridge Absorption",
      "Source/ref visibility",
      "validation/evidence detail",
      "GuideBrief Debug Explainability",
      "Browser Regression Expectations",
      "Remaining Gaps",
      "Authority Boundary",
      "UI Panel Behavior",
      "Recommended Next Phase",
      "No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled",
      "Compatibility path remains rendered",
      "Future deletion requires a separate PR",
      "Browser regression, metrics, and dogfood are evidence/signals, not shrink authority",
      "no route",
      "no API write route",
      "no server action",
      "no chat composer",
      "no provider/OpenAI/GitHub/Codex execution",
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
      "no product UI action authority",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "WORKPLANE_BRIDGE_TRACE_DETAIL_VERSION",
      "WorkplaneBridgeTraceStatus",
      "WorkplaneBridgeTraceRefKind",
      "WorkplaneBridgeTraceDetailRef",
      "WorkplaneBridgeTraceBridgeRow",
      "WorkplaneBridgeTraceValidationDetail",
      "WorkplaneBridgeTraceEvidenceDetail",
      "WorkplaneBridgeTraceDiagnosticDetail",
      "WorkplaneBridgeTraceGapDetail",
      "WorkplaneBridgeTraceAuthorityBoundary",
      "WorkplaneBridgeTraceDetailRead",
      ...requiredStatuses,
      ...requiredRefKinds,
      ...requiredAuthorityFields,
      "bridge_rows",
      "validation_details",
      "evidence_details",
      "diagnostic_details",
      "gap_details",
      "authority_boundary",
      "validation_summary",
    ],
    { label: typeFile },
  );

  for (const field of requiredAuthorityFields) {
    assert(
      typeText.includes(`${field}: false`),
      `${typeFile} must type ${field} as false`,
    );
  }
}

function assertHelperStaticShape() {
  assertContainsAll(
    helperText,
    [
      "buildWorkplaneBridgeTraceDetailRead",
      "readWorkplaneBridgeTraceDetail",
      "WORKPLANE_BRIDGE_TRACE_DETAIL_REQUIRED_REF_KINDS",
      "WORKPLANE_BRIDGE_TRACE_DETAIL_REQUIRED_BRIDGE_ROWS",
      "WORKPLANE_BRIDGE_TRACE_DETAIL_SMOKE_REFS",
      ...requiredBridgeRows,
      ...requiredRefKinds,
      "source_backed_run_postmortem_fields",
      "review_memory_proposal_visibility",
      "bridge_matrix_detail",
      "smoke:agent-workplane-bridge-trace-detail-v0-1",
      "can_delete_or_shrink_legacy_cockpit: false",
      "can_hide_legacy_cockpit: false",
    ],
    { label: helperFile },
  );

  assert(!/\bfetch\s*\(/.test(helperText), "helper must not fetch");
  assert(!/\bwriteFile|writeFileSync|appendFileSync\b/.test(helperText), "helper must not write files");
  assert(!/recoverDeltaBatchForRun|tickAutonomyRun|runDueAutonomyRunsOnce|runAutonomySchedulerWatch/.test(helperText), "helper must not call runner lifecycle/recovery helpers");
  assert(!/api\.openai\.com|api\.github\.com|@octokit|OpenAI\(/.test(helperText), "helper must not call provider/GitHub/Codex paths");
}

function assertPanelStaticShape() {
  assertContainsAll(
    panelText,
    [
      "WorkplanePanelShell",
      'data-workplane-bridge-trace-detail-panel="v0.1"',
      'panelId="source_ref_bridge"',
      'nodeId="source_ref_bridge"',
      'nodeKind="debug_context_source"',
      "Source Ref Bridge",
      "Trace Bridge",
      "Bridge matrix",
      "source refs",
      "validation summary",
      "evidence refs",
      "diagnostic refs",
      "legacy compatibility retained",
      "read-only bridge/trace detail",
      "not execution authority",
      "not shrink authority",
    ],
    { label: panelFile },
  );

  assert(!/<button\b/i.test(panelText), "panel must render no button");
  assert(!/<form\b/i.test(panelText), "panel must render no form");
  assert(!/<input\b/i.test(panelText), "panel must render no input");
  assert(!/<textarea\b/i.test(panelText), "panel must render no textarea");
  assert(!/\bonClick\b/.test(panelText), "panel must not render onClick");
  assert(!/\bformAction\b/.test(panelText), "panel must not render formAction");
}

function assertWorkplaneIntegration() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "SourceRefBridgeDetailPanel",
      "buildWorkplaneBridgeTraceDetailRead",
      "<SourceRefBridgeDetailPanel read={bridgeTraceDetail} />",
      "LegacyCockpitCompatibilityPanel",
      "<" + "LegacyCockpitCompatibilityPanel />",
    ],
    { label: agentWorkplaneFile },
  );
  assert(
    !agentWorkplaneText.includes("AugnesCockpit"),
    "AgentWorkplane must not import or render AugnesCockpit after the route split",
  );
  assertContainsAll(
    nodeContextText,
    [
      "source_ref_bridge",
      "trace_bridge",
      "smoke:agent-workplane-bridge-trace-detail-v0-1",
      "Bridge/trace detail is source-backed read-only context",
    ],
    { label: nodeContextHelperFile },
  );
}

function assertBrowserRegressionUpdated() {
  assertContainsAll(
    browserRegressionHelperText,
    [
      'data-workplane-bridge-trace-detail-panel="v0.1"',
      'data-workplane-panel-id="source_ref_bridge"',
      "Source Ref Bridge",
      "Trace Bridge",
      "Bridge matrix",
      "validation summary",
      "evidence refs",
      "diagnostic refs",
      "bridge",
      "source_ref_visibility",
      "validation_smoke_visibility",
      "browser_regression_passed_shrink_gated",
    ],
    { label: browserRegressionHelperFile },
  );
}

function assertHelperAndRegressionBehavior() {
  const code = `
    import assert from "node:assert/strict";
    import { readWorkplaneContext } from "./lib/workplane/read-workplane-context.ts";
    import { buildAgentWorkplaneNodeContextRead } from "./lib/workplane/workplane-node-context.ts";
    import { buildWorkplaneBridgeTraceDetailRead } from "./lib/workplane/workplane-bridge-trace-detail.ts";
    import { buildWorkplaneBrowserRegressionReport } from "./lib/workplane/workplane-browser-regression.ts";

    const context = await readWorkplaneContext();
    const nodeContext = buildAgentWorkplaneNodeContextRead(context);
    const read = buildWorkplaneBridgeTraceDetailRead({
      workplane_context: context,
      node_context_read: nodeContext
    });

    for (const rowId of ${JSON.stringify(requiredBridgeRows)}) {
      assert(read.bridge_rows.some((row) => row.row_id === rowId), rowId);
    }
    for (const refKind of ${JSON.stringify(requiredRefKinds)}) {
      assert(read.source_ref_kinds.some((row) => row.ref_kind === refKind), refKind);
    }
    assert(read.validation_details.length > 0);
    assert(read.evidence_details.length > 0);
    assert(read.diagnostic_details.length > 0);
    assert(read.gap_details.some((gap) => gap.gap_id === "source_backed_run_postmortem_fields"));
    assert(read.gap_details.some((gap) => gap.gap_id === "review_memory_proposal_visibility"));
    assert(read.gap_details.some((gap) => gap.gap_id === "bridge_matrix_detail"));
    for (const field of ${JSON.stringify(requiredAuthorityFields)}) {
      assert.equal(read.authority_boundary[field], false, field);
    }
    assert(read.validation_summary.smoke_refs.includes("smoke:agent-workplane-bridge-trace-detail-v0-1"));

    const html = buildFixtureHtml();
    const report = buildWorkplaneBrowserRegressionReport({
      html,
      metrics_status: "watch",
      dogfood_status: "needs_review",
      cockpit_shrink_readiness: "needs_review"
    });
    const capability = (id) => report.capability_checks.find((check) => check.capability_id === id);
    assert.equal(report.status, "partial");
    assert.equal(report.marker_summary.failed, 0);
    assert.equal(report.legacy_compatibility_status, "passed");
    assert.equal(report.no_control_status, "passed");
    assert.equal(report.deltabatch_identity_status, "passed");
    assert(["partial", "passed"].includes(capability("bridge").status));
    assert(["partial", "passed"].includes(capability("source_ref_visibility").status));
    assert(["partial", "passed"].includes(capability("validation_smoke_visibility").status));
    assert.equal(report.recommendation.decision, "browser_regression_passed_shrink_gated");

    function buildFixtureHtml() {
      return \`
        <main aria-label="Agent Workplane">Agent Workplane</main>
        <aside data-guide-workplane-debug-panel="v0.1">GuideBrief Workplane Debug Context Observed Inferred Suggested Needs user judgment</aside>
        <aside data-guide-intent-projection-panel="v0.1">GuideBrief Intent Projection reversible non-executable not authority</aside>
        <aside data-workplane-intent-mode-panel="v0.1">Workplane Intent Mode reversible</aside>
        <section data-workplane-metrics-panel="v0.1">Runner / Workplane Metrics Metrics are signals, not authority validation summary</section>
        <section data-workplane-panel-id="work_queue" data-workplane-node-id="current_objective">Work Queue</section>
        <section data-workplane-panel-id="current_perspective" data-workplane-node-id="current_perspective">Current Perspective</section>
        <section data-workplane-panel-id="delta_projection" data-workplane-node-id="perspective_delta">Delta Projection</section>
        <section data-workplane-panel-id="projected_delta_batch" data-workplane-node-id="perspective_delta">Projected Delta Batch</section>
        <section data-workplane-panel-id="delta_batch" data-workplane-node-id="runner_delta_batch">Recovered Runner DeltaBatch</section>
        <section data-workplane-panel-id="review_queue" data-workplane-node-id="authority_validation_debug">Review Queue Needs user judgment</section>
        <section data-workplane-review-memory-detail-panel="v0.1"><section data-workplane-panel-id="review_memory_detail" data-workplane-node-id="authority_validation_debug">Review / memory proposal detail durable memory review Perspective review validation required needs user judgment source refs no durable memory apply no Perspective apply legacy compatibility retained</section></section>
        <section data-workplane-panel-id="evidence_handoff" data-workplane-node-id="handoff_context">Evidence Handoff validation summary evidence refs</section>
        <section data-workplane-panel-id="workplane_inspector" data-workplane-node-id="source_ref_bridge">Source refs</section>
        <section data-workplane-bridge-trace-detail-panel="v0.1"><section data-workplane-panel-id="source_ref_bridge" data-workplane-node-id="source_ref_bridge">Source Ref Bridge Trace Bridge Bridge matrix source refs validation summary evidence refs diagnostic refs legacy compatibility retained</section></section>
        <section data-workplane-panel-id="projection_candidates" data-workplane-node-id="perspective_delta">Projection Candidates</section>
        <section data-workplane-panel-id="handoff_builder_preview" data-workplane-node-id="handoff_context">Handoff Builder preview</section>
        <section data-workplane-run-postmortem-detail-panel="v0.1"><section data-workplane-panel-id="run_postmortem" data-workplane-node-id="run_postmortem">Run Postmortem detail source-backed run postmortem run_id step refs event refs recovered DeltaBatch validation status source refs no runner execution no runner tick no DeltaBatch recovery no durable memory apply no Perspective apply legacy compatibility retained</section></section>
        <section data-workplane-panel-id="trace_diagnostics" data-workplane-node-id="trace_bridge">Trace Diagnostics validation summary diagnostic refs</section>
        <section data-workplane-panel-id="legacy_cockpit_compatibility" data-workplane-node-id="legacy_cockpit_compatibility" data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed" data-workplane-legacy-cockpit-route="/cockpit">Legacy Cockpit route split Legacy Cockpit full mount was removed from /workbench Full Legacy Cockpit remains reachable at /cockpit Native Agent Workplane remains primary</section>
      \`;
    }

    console.log(JSON.stringify({
      helper_status: read.status,
      bridge_row_ids: read.bridge_rows.map((row) => row.row_id),
      browser_status: report.status,
      bridge_capability_status: capability("bridge").status,
      source_ref_capability_status: capability("source_ref_visibility").status,
      validation_capability_status: capability("validation_smoke_visibility").status
    }));
  `;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
    env: {
      ...process.env,
      AUGNES_DB_PATH: "/tmp/augnes-bridge-trace-detail-smoke-empty.db",
    },
  });
  return JSON.parse(output);
}

function assertCompatibilityStillRendered() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "LegacyCockpitCompatibilityPanel",
      "<" + "LegacyCockpitCompatibilityPanel />",
    ],
    { label: agentWorkplaneFile },
  );
  assert(
    !agentWorkplaneText.includes("AugnesCockpit"),
    "AgentWorkplane must not import or render AugnesCockpit after the route split",
  );
  assertContainsAll(textByFile.get(legacyCompatibilityPanelFile), [
    'data-workplane-panel-id="legacy_cockpit_compatibility"',
    'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
    'data-workplane-legacy-cockpit-route="/cockpit"',
    "Legacy Cockpit full mount was removed from /workbench",
  ]);
  assertContainsAll(textByFile.get(cockpitPageFile), [
    'import { ' + 'AugnesCockpit } from "@/components/augnes-cockpit"',
    "<" + "AugnesCockpit />",
  ]);
  assert(textByFile.get(augnesCockpitFile).includes("export function " + "AugnesCockpit"));
}

function assertNoRouteOrAuthorityPathAdded() {
  const changedFiles = observedChangedFiles();
  for (const file of changedFiles) {
    if (file === cockpitPageFile) {
      continue;
    }
    assert(!/^app\//.test(file), `No product route/page changes allowed: ${file}`);
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(!/route\.(ts|tsx|js|jsx)$/.test(file), `No route file changes allowed: ${file}`);
    assert(!/^db\//.test(file), `No DB persistence changes allowed: ${file}`);
    assert(!/^migrations\//.test(file), `No migration changes allowed: ${file}`);
  }

  const allTouchedText = [
    helperText,
    panelText,
    agentWorkplaneText,
    nodeContextText,
    browserRegressionHelperText,
  ].join("\n");

  assert(!/api\.openai\.com|api\.github\.com|@octokit|OpenAI\(/.test(allTouchedText), "no provider/OpenAI/GitHub path may be added");
  assert(!/recoverDeltaBatchForRun|tickAutonomyRun|runDueAutonomyRunsOnce|runAutonomySchedulerWatch/.test(helperText), "no runner execution/tick/recovery/scheduler path may be added");
  assert(!/localStorage|sessionStorage/.test(allTouchedText), "no durable browser storage mode may be added");
  assert(!/<button\b|<form\b|<input\b|<textarea\b|\bonClick\b|\bformAction\b/.test(panelText), "new panel must not add mutation controls");
}

function assertNoSourceDeletion() {
  for (const file of collectGitDiffFiles(["diff", "--name-only", "--diff-filter=D", "HEAD"]).files) {
    assert.fail(`No source deletion allowed: ${file}`);
  }
  for (const file of collectGitDiffFiles([
    "diff",
    "--name-only",
    "--diff-filter=D",
    "origin/main...HEAD",
  ]).files) {
    assert.fail(`No broad source deletion allowed: ${file}`);
  }
}

function observedChangedFiles() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untracked = collectUntrackedFiles();
  return uniqueSorted([...workingTree.files, ...baseRange.files, ...untracked]);
}
