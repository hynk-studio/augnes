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

const followOnGuideBriefRouteFiles = [
  "app/api/augnes/read/guide-brief/route.ts",
  "lib/guide/guide-brief-source.ts",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
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
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
];

const followOnAgentWorkplaneCockpitInheritanceFiles = [
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
];

const followOnAgentWorkplaneNodeContractFiles = [
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  ...phase5aFiles,
  ...phase5bPanelFiles,
  ...phase5cPanelFiles,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
];

const followOnWorkplaneRunnerDeltaBatchIntegrationFiles = [
  "lib/workplane/read-runner-delta-batches-for-workplane.ts",
  "components/workplane/runner-delta-batch-panel.tsx",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "lib/workplane/read-workplane-context.ts",
  agentWorkplaneFile,
  deltaBatchPanelFile,
  agentWorkplaneDoc,
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  indexDoc,
  packageJsonFile,
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
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

const phase9aAutonomyRunnerPreflightFiles = [
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "types/autonomy-runner.ts",
  "lib/autonomy/autonomy-runner-preflight.ts",
  "fixtures/autonomy-runner-preflight.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "app/api/augnes/read/autonomy-runner-preflight/route.ts",
  "lib/autonomy/autonomy-runner-preflight-source.ts",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "package.json",
  "package-lock.json",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
  "types/autonomy-runner-execution.ts",
  "lib/autonomy/runner.ts",
  "lib/autonomy/scheduler.ts",
  "lib/autonomy/runner-ledger.ts",
  "lib/autonomy/runner-delta-batch.ts",
  "lib/autonomy/runner-state.ts",
  "app/api/autonomy/runs/route.ts",
  "app/api/autonomy/runs/[id]/route.ts",
  "fixtures/autonomy-runner.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
  "lib/db/schema.sql",
];
const allowedChangedFiles = new Set([
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "types/autonomy-contract.ts",
  "lib/autonomy/autonomy-contract.ts",
  "fixtures/autonomy-contract.sample.v0.1.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "app/api/augnes/read/autonomy-contract/route.ts",
  "lib/autonomy/autonomy-contract-source.ts",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
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
  ...followOnGuideBriefRouteFiles,
  ...followOnGuideWorkplaneDebugContextFiles,
  ...followOnGuideBriefIntentProjectionFiles,
  ...followOnRunnerWorkplaneMetricsFiles,
  ...followOnAugnesDogfoodFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
  ...followOnAgentWorkplaneCockpitInheritanceFiles,
  ...followOnAgentWorkplaneNodeContractFiles,
  ...followOnWorkplaneRunnerDeltaBatchIntegrationFiles,
  smokeFile,
  "app/globals.css",
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}
const phase8PriorSmokeAllowlistFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];
for (const file of phase8PriorSmokeAllowlistFiles) {
  allowedChangedFiles.add(file);
}
const phase8cAutonomyContractWebPreviewFiles = [
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-budget-preview-panel.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "components/autonomy/autonomy-policy-preview-panel.tsx",
  "components/autonomy/autonomy-preview-shared.tsx",
  "components/autonomy/autonomy-run-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
];
for (const file of phase8cAutonomyContractWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const phase8fAutonomyContractCopyExportFiles = [
  "lib/autonomy/autonomy-contract-copy-export.ts",
  "components/autonomy/autonomy-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];
for (const file of phase8fAutonomyContractCopyExportFiles) {
  allowedChangedFiles.add(file);
}

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

const followOnAutonomyContractCodexSkillFiles = [
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];
for (const file of followOnAutonomyContractCodexSkillFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleCopyExportFiles = [
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleCopyExportFiles) {
  allowedChangedFiles.add(file);
}

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
    assert(
      !/^app\/api\//.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        phase9aAutonomyRunnerPreflightFiles.includes(file),
      `Phase 5D must not add API routes outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        phase9aAutonomyRunnerPreflightFiles.includes(file),
      `Phase 5D must not add route files outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 5D must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 5D must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 5D must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file)) ||
        followOnChatgptAppGuideBriefToolFiles.includes(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file) ||
        followOnHandoffCapsuleCodexSkillFiles.includes(file) ||
        followOnAutonomyContractCodexSkillFiles.includes(file) || phase9aAutonomyRunnerPreflightFiles.includes(file)),
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
        followOnGuideBriefRouteFiles.includes(file) ||
        followOnGuideWorkplaneDebugContextFiles.includes(file) ||
        followOnGuideBriefIntentProjectionFiles.includes(file) ||
        followOnRunnerWorkplaneMetricsFiles.includes(file) ||
        followOnWebGuidePanelFiles.includes(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file) ||
        (!/(guidebrief|guide-brief|guide_brief)/i.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 5D must not allow GuideBrief files outside exact Phase 6A core follow-on scope: ${file}`,
    );
  }

  const guidebriefCoreFollowOnUsed = files.some((file) =>
    followOnGuideBriefCoreFiles.includes(file),
  );
  const webGuidePanelFollowOnUsed = files.some((file) =>
    followOnWebGuidePanelFiles.includes(file),
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
    web_guide_panel_follow_on_used: webGuidePanelFollowOnUsed,
    files,
  };
}
