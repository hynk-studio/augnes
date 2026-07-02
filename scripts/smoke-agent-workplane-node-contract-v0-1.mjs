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

const typeContractFile = "types/agent-workplane-node.ts";
const nodeContextHelperFile = "lib/workplane/workplane-node-context.ts";
const nodeContractDoc = "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-agent-workplane-node-contract-v0-1.mjs";

const panelShellFile = "components/workplane/workplane-panel-shell.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";

const requiredPanelMetadata = [
  {
    file: "components/workplane/work-queue-panel.tsx",
    panelId: "work_queue",
    nodeId: "current_objective",
    kind: "native_panel",
    status: "partial",
  },
  {
    file: "components/workplane/current-perspective-workplane-panel.tsx",
    panelId: "current_perspective",
    nodeId: "current_perspective",
    kind: "native_panel",
    status: "partial",
  },
  {
    file: "components/workplane/delta-projection-workplane-panel.tsx",
    panelId: "delta_projection",
    nodeId: "perspective_delta",
    kind: "native_panel",
    status: "partial",
  },
  {
    file: "components/workplane/review-queue-workplane-panel.tsx",
    panelId: "review_queue",
    nodeId: "authority_validation_debug",
    kind: "native_panel",
    status: "partial",
  },
  {
    file: "components/workplane/evidence-handoff-workplane-panel.tsx",
    panelId: "evidence_handoff",
    nodeId: "handoff_context",
    kind: "handoff_context_source",
    status: "partial",
  },
  {
    file: "components/workplane/workplane-inspector.tsx",
    panelId: "workplane_inspector",
    nodeId: "source_ref_bridge",
    kind: "debug_context_source",
    status: "partial",
  },
  {
    file: "components/workplane/projection-candidates-panel.tsx",
    panelId: "projection_candidates",
    nodeId: "perspective_delta",
    kind: "preview_panel",
    status: "preview_only",
  },
  {
    file: "components/workplane/delta-batch-panel.tsx",
    panelId: "projected_delta_batch",
    nodeId: "perspective_delta",
    kind: "preview_panel",
    status: "preview_only",
  },
  {
    file: "components/workplane/runner-delta-batch-panel.tsx",
    panelId: "delta_batch",
    nodeId: "runner_delta_batch",
    kind: "runner_context_source",
    status: "dynamic",
  },
  {
    file: "components/workplane/handoff-builder-preview-panel.tsx",
    panelId: "handoff_builder_preview",
    nodeId: "handoff_context",
    kind: "handoff_context_source",
    status: "preview_only",
  },
  {
    file: "components/workplane/run-postmortem-skeleton-panel.tsx",
    panelId: "run_postmortem",
    nodeId: "run_postmortem",
    kind: "runner_context_source",
    status: "not_materialized",
  },
  {
    file: "components/workplane/trace-diagnostics-panel.tsx",
    panelId: "trace_diagnostics",
    nodeId: "trace_bridge",
    kind: "trace_context_source",
    status: "partial",
  },
];

const existingWorkplaneSmokeFiles = [
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
];

const followOnWorkplaneRunnerDeltaBatchIntegrationFiles = [
  "lib/workplane/read-runner-delta-batches-for-workplane.ts",
  "components/workplane/runner-delta-batch-panel.tsx",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "lib/workplane/read-workplane-context.ts",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
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
  typeContractFile,
  nodeContextHelperFile,
  nodeContractDoc,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  panelShellFile,
  legacyCompatibilityPanelFile,
  ...requiredPanelMetadata.map((panel) => panel.file),
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...existingWorkplaneSmokeFiles,
  ...followOnWorkplaneRunnerDeltaBatchIntegrationFiles,
  ...followOnGuideWorkplaneDebugContextFiles,
  ...followOnGuideBriefIntentProjectionFiles,
  ...followOnRunnerWorkplaneMetricsFiles,
  ...followOnAugnesDogfoodFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnAgentWorkplaneRunPostmortemDetailFiles,
]);

const requiredFields = [
  "panel_id",
  "node_id",
  "kind",
  "title",
  "summary",
  "status",
  "created_at",
  "updated_at",
  "source_refs",
  "related_run_ids",
  "related_step_ids",
  "related_event_ids",
  "related_batch_ids",
  "related_delta_ids",
  "related_handoff_refs",
  "authority_boundary",
  "validation_summary",
  "staleness",
  "fallback_status",
  "debug_notes",
];

const stablePanelIds = [
  "work_queue",
  "current_perspective",
  "delta_projection",
  "review_queue",
  "evidence_handoff",
  "workplane_inspector",
  "projection_candidates",
  "projected_delta_batch",
  "delta_batch",
  "handoff_builder_preview",
  "run_postmortem",
  "trace_diagnostics",
  "legacy_cockpit_compatibility",
];

const absorptionTargetNodeIds = [
  "current_objective",
  "handoff_context",
  "perspective_delta",
  "source_ref_bridge",
  "trace_bridge",
  "authority_validation_debug",
  "runner_state",
  "runner_delta_batch",
  "run_postmortem",
  "trace_diagnostics",
];

const requiredNodeKinds = [
  "native_panel",
  "preview_panel",
  "compatibility_panel",
  "debug_context_source",
  "handoff_context_source",
  "runner_context_source",
  "trace_context_source",
];

const requiredStatuses = [
  "ready",
  "partial",
  "preview_only",
  "compatibility_only",
  "not_materialized",
  "stale",
  "fallback",
];

const requiredAuthorityFields = [
  "can_write_db",
  "can_write_proof_evidence",
  "can_call_provider_openai",
  "can_call_github",
  "can_actuate_github",
  "can_execute_codex",
  "can_execute_runner",
  "can_schedule",
  "can_apply_durable_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_merge_publish_retry_replay_deploy",
];

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeContractFile);
const helperText = textByFile.get(nodeContextHelperFile);
const docText = textByFile.get(nodeContractDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const panelShellText = textByFile.get(panelShellFile);
const legacyCompatibilityText = textByFile.get(legacyCompatibilityPanelFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-node-contract-v0-1",
  expectedCommand: "node scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
});

assertContainsAll(indexText, [nodeContractDoc], { label: indexDoc });
assertContainsAll(agentWorkplaneDocText, [nodeContractDoc], {
  label: agentWorkplaneDoc,
});
assertTypeContract();
assertDocs();
assertPanelShellMetadata();
assertPanelMetadata();
assertPanelIdentityPairsUnique();
assertLegacyCompatibilityMetadata();
assertNodeContextHelper();
assertChangedFileBoundary();
assertNoSourceFileDeletion();
assertNoNewRoute();
assertNoForbiddenRuntimeAuthority();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-node-contract-v0-1",
      pass: true,
      type_contract_exists: true,
      node_context_helper_exists: true,
      doc_exists: true,
      package_script_checked: true,
      index_pointer_checked: true,
      agent_workplane_doc_pointer_checked: true,
      required_fields_checked: requiredFields,
      stable_panel_ids_checked: stablePanelIds,
      absorption_target_node_ids_checked: absorptionTargetNodeIds,
      node_kinds_checked: requiredNodeKinds,
      node_statuses_checked: requiredStatuses,
      panel_shell_data_attributes_checked: true,
      key_panel_metadata_checked: requiredPanelMetadata.map(
        (panel) => panel.panelId,
      ),
      key_panel_identity_pairs_unique_checked: true,
      legacy_cockpit_compatibility_metadata_checked: true,
      node_context_registry_checked: true,
      source_fallback_staleness_authority_validation_checked: true,
      no_legacy_cockpit_deletion_checked: true,
      no_guidebrief_debug_or_intent_projection_added: true,
      no_runner_execution_recovery_write_or_scheduler_behavior_added: true,
      no_route_provider_openai_github_codex_db_or_persistence_added: true,
      no_durable_memory_or_perspective_apply_added: true,
      no_broad_source_deletion_checked: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-node-contract-v0-1");

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "AgentWorkplanePanelId",
      "AgentWorkplaneNodeKind",
      "AgentWorkplaneNodeStatus",
      "AgentWorkplaneAuthorityBoundary",
      "AgentWorkplaneValidationSummary",
      "AgentWorkplaneStaleness",
      "AgentWorkplaneFallbackStatus",
      "AgentWorkplaneNodeContext",
      "AgentWorkplanePanelContext",
      "AgentWorkplaneNodeContextRead",
      "AGENT_WORKPLANE_PANEL_IDS",
      "AGENT_WORKPLANE_NODE_KINDS",
      "AGENT_WORKPLANE_NODE_STATUSES",
      ...requiredFields,
      ...stablePanelIds,
      ...absorptionTargetNodeIds,
      ...requiredNodeKinds,
      ...requiredStatuses,
      ...requiredAuthorityFields,
    ],
    { label: typeContractFile },
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "GuideBrief Workplane Debug Context",
      "GuideBrief Intent Projection",
      "Why This Contract Exists",
      "Required Fields",
      "Stable Panel IDs",
      "Stable Node Kinds",
      "Status Semantics",
      "Source Refs Expectations",
      "Related Ref Expectations",
      "Authority Boundary Expectations",
      "Validation Summary Expectations",
      "Staleness and Fallback Expectations",
      "Legacy Cockpit Compatibility",
      "Not Implemented Yet",
      "no GuideBrief debug panel",
      "no GuideBrief intent projection",
      "Recovered runner DeltaBatch Workplane readback",
      "no new runner execution behavior",
      "no recovery write behavior is added to Workplane reads",
      "no scheduled runner behavior",
      "no route",
      "no DB write or persistence",
      "no provider/OpenAI/GitHub/Codex execution",
      "no durable memory apply",
      "no Perspective apply",
      "no legacy Cockpit deletion",
      "Legacy Cockpit must not be removed until native replacement and validation exist.",
      ...stablePanelIds,
      ...absorptionTargetNodeIds,
      ...requiredNodeKinds,
      ...requiredStatuses,
    ],
    { label: nodeContractDoc },
  );

  assertContainsAll(
    agentWorkplaneDocText,
    [
      "Agent Workplane Node / Panel Contract v0.1",
      "data-workplane-panel-id",
      "data-workplane-node-id",
      "data-workplane-node-kind",
      "data-workplane-node-status",
      "read-only node context helper",
      "does not add a route, DB write, persistence, runner execution",
      "legacy_cockpit_compatibility",
      "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
    ],
    { label: agentWorkplaneDoc },
  );
}

function assertPanelShellMetadata() {
  assertContainsAll(
    panelShellText,
    [
      "panelId?: AgentWorkplanePanelId",
      "nodeId?: AgentWorkplanePanelId",
      "nodeKind?: AgentWorkplaneNodeKind",
      "nodeStatus?: AgentWorkplaneNodeStatus",
      "data-workplane-panel-id={panelId}",
      "data-workplane-node-id={nodeId}",
      "data-workplane-node-kind={nodeKind}",
      "data-workplane-node-status={nodeStatus}",
    ],
    { label: panelShellFile },
  );
}

function assertPanelMetadata() {
  for (const panel of requiredPanelMetadata) {
    const text = textByFile.get(panel.file);
    assertContainsAll(
      text,
      [
        `panelId="${panel.panelId}"`,
        `nodeId="${panel.nodeId}"`,
        `nodeKind="${panel.kind}"`,
      ],
      { label: panel.file },
    );
    if (panel.status === "dynamic") {
      assertContainsAll(text, ["nodeStatus={nodeStatus}"], {
        label: panel.file,
      });
    } else {
      assertContainsAll(text, [`nodeStatus="${panel.status}"`], {
        label: panel.file,
      });
    }
  }
}

function assertPanelIdentityPairsUnique() {
  const seen = new Map();

  for (const panel of requiredPanelMetadata) {
    const key = `${panel.panelId}/${panel.nodeId}`;
    assert(
      !seen.has(key),
      `${panel.file} must not share panelId/nodeId pair ${key} with ${seen.get(
        key,
      )}`,
    );
    seen.set(key, panel.file);
  }

  assert.equal(
    requiredPanelMetadata.find(
      (panel) =>
        panel.file === "components/workplane/delta-projection-workplane-panel.tsx",
    )?.panelId,
    "delta_projection",
  );
  assert.equal(
    requiredPanelMetadata.find(
      (panel) => panel.file === "components/workplane/delta-batch-panel.tsx",
    )?.panelId,
    "projected_delta_batch",
  );
  assert.equal(
    requiredPanelMetadata.find(
      (panel) =>
        panel.file === "components/workplane/runner-delta-batch-panel.tsx",
    )?.panelId,
    "delta_batch",
  );
}

function assertLegacyCompatibilityMetadata() {
  assertContainsAll(
    legacyCompatibilityText,
    [
      'data-workplane-panel-id="legacy_cockpit_compatibility"',
      'data-workplane-node-id="legacy_cockpit_compatibility"',
      'data-workplane-node-kind="compatibility_panel"',
      'data-workplane-node-status="compatibility_only"',
    ],
    { label: legacyCompatibilityPanelFile },
  );
}

function assertNodeContextHelper() {
  assertContainsAll(
    helperText,
    [
      "readWorkplaneContext",
      "readAgentWorkplaneNodeContext",
      "buildAgentWorkplaneNodeContextRead",
      "AgentWorkplaneNodeContextRead",
      "AGENT_WORKPLANE_NODE_CONTEXT_REGISTRY",
      "AGENT_WORKPLANE_REQUIRED_PANEL_IDS",
      "AGENT_WORKPLANE_ABSORPTION_TARGET_NODE_IDS",
      "AGENT_WORKPLANE_PANEL_REGISTRY",
      "AGENT_WORKPLANE_NODE_STATUSES",
      "source_refs",
      "fallback_status",
      "staleness",
      "authority_boundary",
      "validation_summary",
      "Fixture fallback disclosure",
      "not_materialized",
      "Recovered runner DeltaBatches are read-only review candidates",
      "runner_delta_batch_read",
      ...stablePanelIds,
      ...absorptionTargetNodeIds,
      ...requiredNodeKinds,
    ],
    { label: nodeContextHelperFile },
  );

  assert(
    !/Date\.now\s*\(/.test(helperText),
    "Node context helper must not use nondeterministic Date.now()",
  );
  assert(
    !/from\s+["']@\/lib\/autonomy\/runner/.test(helperText),
    "Node context helper must not import runner lifecycle helpers",
  );
  assert(
    !/\bfetch\s*\(/.test(helperText),
    "Node context helper must not add fetch or route-to-route reads",
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
      `Unexpected Agent Workplane node contract changed or untracked file: ${file}`,
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
  const files = changedAndUntrackedFiles();
  for (const file of files) {
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `No route file changes allowed: ${file}`,
    );
    assert(!/^apps\//.test(file), `No MCP/App tool changes allowed: ${file}`);
  }
}

function assertNoForbiddenRuntimeAuthority() {
  const implementationText = [
    helperText,
    panelShellText,
    legacyCompatibilityText,
    ...requiredPanelMetadata.map((panel) => textByFile.get(panel.file)),
  ].join("\n");

  const forbiddenPatterns = [
    [/\bPOST\s*\(/, "mutating POST handler"],
    [/\bPUT\s*\(/, "mutating PUT handler"],
    [/\bPATCH\s*\(/, "mutating PATCH handler"],
    [/\bDELETE\s*\(/, "mutating DELETE handler"],
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
    [/\brecoverDeltaBatchForRun\s*\(/, "runner DeltaBatch integration"],
    [/\btickAutonomyRun\s*\(/, "runner behavior"],
    [/\bcreateAutonomyRun\s*\(/, "runner behavior"],
    [/\bINSERT\s+INTO\b/i, "SQL insert"],
    [/\bUPDATE\s+\w+/i, "SQL update"],
    [/\bDELETE\s+FROM\b/i, "SQL delete"],
    [/\bCREATE\s+TABLE\b/i, "schema creation"],
    [/\bALTER\s+TABLE\b/i, "schema alteration"],
    [/\bDROP\s+TABLE\b/i, "schema drop"],
    [/\bcreatePullRequest\s*\(/, "GitHub actuation"],
    [/\bapplyPerspective\s*\(/i, "Perspective apply"],
    [/\bapplyDurableMemory\s*\(/i, "durable memory apply"],
  ];

  for (const [pattern, label] of forbiddenPatterns) {
    assert(
      !pattern.test(implementationText),
      `Agent Workplane node contract must not add ${label}: ${pattern}`,
    );
  }

  const files = changedAndUntrackedFiles();
  for (const file of files) {
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `No provider/OpenAI/GitHub runtime files allowed: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `No proof/evidence write path changes allowed: ${file}`,
    );
    assert(
      !/(^|\/)(scheduler|autonomy-runner|runner-ledger)(\/|$)/i.test(file),
      `No scheduler or runner behavior path changes allowed: ${file}`,
    );
  }

  assertNoBroadCockpitDeletion();
}

function assertNoBroadCockpitDeletion() {
  const deletionNameStatus = collectNameStatus(["diff", "--name-status", "HEAD"]);
  const cockpitDeletion = deletionNameStatus.find(
    (line) =>
      line.startsWith("D") &&
      /(^|\/)(augnes-cockpit|cockpit|components\/workplane)\b/i.test(line),
  );
  assert(!cockpitDeletion, `No legacy Cockpit deletion allowed: ${cockpitDeletion}`);
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
