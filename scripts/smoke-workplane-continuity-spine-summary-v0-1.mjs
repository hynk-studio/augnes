#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  assertChangedFilesWithin,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const root = process.cwd();
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");

const expectedFiles = [
  "types/workplane-continuity-spine-summary.ts",
  "lib/workplane/workplane-continuity-spine-summary.ts",
  "components/workplane/workplane-continuity-spine-summary-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-workplane-continuity-spine-summary-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

assertPackageScript({
  packageJsonText: pkgText,
  scriptName: "smoke:workplane-continuity-spine-summary-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-workplane-continuity-spine-summary-v0-1.mjs",
});

for (const file of expectedFiles.slice(0, 5)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "workplane_continuity_spine_summary_v0_1",
});
assertNoUnexpectedChangedOrUntrackedFiles(expectedFiles);

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get("types/workplane-continuity-spine-summary.ts");
const helperText = textByFile.get(
  "lib/workplane/workplane-continuity-spine-summary.ts",
);
const panelText = textByFile.get(
  "components/workplane/workplane-continuity-spine-summary-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const agentSnippet = workplaneContinuitySpineSummarySnippet(agentText);
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "workplane_continuity_spine_summary.v0.1",
  "ready_for_operator_review",
  "stale_source_attention",
  "no_active_spine",
  "provider_specific_execution_contract_record_review",
  "source_freshness_status",
  "rollback_supersede_status",
  "next_allowed_actions",
  "blocked_actions",
  "codex_handoff_hints",
  "source_coverage_summary",
  "can_execute_delivery: false",
  "can_call_provider: false",
  "can_call_network: false",
  "can_write_proof: false",
  "can_write_evidence: false",
  "can_execute_codex: false",
  "can_call_github: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(
  agentText.includes("buildWorkplaneContinuitySpineSummaryV01"),
  "Agent Workplane must build Workplane Continuity Spine Summary",
);
assert(
  agentText.includes("<WorkplaneContinuitySpineSummaryPanel"),
  "Agent Workplane must render Workplane Continuity Spine Summary panel",
);
assert(
  agentSnippet.indexOf("<WorkplaneContinuitySpineSummaryPanel") >
    agentSnippet.indexOf("<ContinuityRelayWorkplanePanel"),
  "summary panel should render immediately after continuity relay",
);
assertNoForbiddenPureRuntime("helper", helperText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoForbiddenPureRuntime("agent wiring", agentSnippet);
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentSnippet);

const { buildWorkplaneContinuitySpineSummaryV01 } = await import(
  "../lib/workplane/workplane-continuity-spine-summary.ts"
);

const readySummary = buildWorkplaneContinuitySpineSummaryV01(readyInput());
assert.equal(readySummary.spine_status, "ready_for_operator_review");
assert.equal(
  readySummary.latest_active_stage,
  "provider_specific_execution_contract_record_review",
);
assert.equal(
  readySummary.latest_active_receipt_or_record_ref,
  "provider-intent-record:1",
);
assert.equal(readySummary.source_freshness_status, "fresh");
assert.equal(readySummary.rollback_supersede_status, "active_only");
assert.equal(readySummary.blocker_reasons.length, 0);
assert.equal(readySummary.missing_source_refs.length, 0);
assert(readySummary.summary_fingerprint);

const missingSummary = buildWorkplaneContinuitySpineSummaryV01({
  ...readyInput(),
  provider_specific_delivery_execution_contract_record_review: {
    ...providerExecutionRecordReview(),
    review_status: "source_ref_missing",
    requirement_summary: {
      required_refs: ["source_exported_handoff_artifact_ref"],
      missing_refs: ["missing:source_exported_handoff_artifact_ref"],
      satisfied_requirements: [],
    },
  },
});
assert(
  missingSummary.missing_source_refs.includes(
    "missing:source_exported_handoff_artifact_ref",
  ),
);
assert(
  ["insufficient_data", "blocked"].includes(missingSummary.spine_status),
  "missing upstream refs should not remain ready",
);

const fallbackSummary = buildWorkplaneContinuitySpineSummaryV01({
  ...readyInput(),
  workplane_context: workplaneContext({ sourceStatus: "fixture_fallback" }),
  current_working_perspective_route_integration_read:
    routeIntegrationRead("runtime_only", true),
});
assert(
  ["fallback_only", "mixed"].includes(fallbackSummary.source_freshness_status),
  `fallback/runtime-only CWP material must be visible, got ${fallbackSummary.source_freshness_status}`,
);

const residualSummary = buildWorkplaneContinuitySpineSummaryV01({
  ...readyInput(),
  residual_diagnostic_candidate_read_model: residualReadModel({
    residual_candidates: [
      {
        candidate_id: "residual:authority-boundary:1",
        category: "authority_boundary_drift",
        status: "actionable_candidate",
        severity: "high",
      },
    ],
  }),
});
assert.equal(residualSummary.spine_status, "blocked");
assert(
  residualSummary.blocker_reasons.some((reason) =>
    reason.includes("residual_high:actionable_candidate"),
  ),
  "high/actionable residual candidate should contribute a compact blocker",
);

const historySummary = buildWorkplaneContinuitySpineSummaryV01({
  ...readyInput(),
  workbench_spine_consolidation: {
    ...workbenchSpine(),
    lineage_history: {
      rollback_state: "rolled_back",
      superseded_by: "record:replacement:1",
    },
  },
});
assert.equal(historySummary.rollback_supersede_status, "mixed_history");

for (const action of readySummary.next_allowed_actions) {
  assert(
    /^(review|inspect|open|read|prepare)_/.test(action),
    `next_allowed_actions must stay review/navigation/handoff-prep only: ${action}`,
  );
  assert(
    !/(send|execute|write|mutate|call|record|approve|publish|merge)/.test(
      action,
    ),
    `next_allowed_actions must not contain action authority: ${action}`,
  );
}

const blockedActionText = readySummary.blocked_actions.join(" ");
for (const boundaryWord of [
  "provider",
  "delivery",
  "db",
  "proof",
  "perspective",
  "work",
  "codex",
  "github",
  "network",
  "crawler",
  "rag",
  "action_button",
]) {
  assert(
    blockedActionText.toLowerCase().includes(boundaryWord),
    `blocked_actions must include ${boundaryWord} boundary`,
  );
}

assertAllDangerousAuthorityFlagsFalse(readySummary.authority_boundary);

const maliciousSummary = buildWorkplaneContinuitySpineSummaryV01({
  ...readyInput(),
  source_refs: [
    "https://example.invalid/raw_payload?token=secret",
    "env:OPENAI_API_KEY",
  ],
  provider_specific_delivery_execution_contract_record_review: {
    ...providerExecutionRecordReview(),
    source_refs: ["secret-token-source-ref"],
    source_provider_specific_intent_contract_record_ref:
      "https://example.invalid/raw_payload?token=secret",
  },
});
assertNoRawMaterialEmitted(maliciousSummary);

for (const docsFile of changedAndUntrackedFiles()) {
  assert(!docsFile.startsWith("docs/"), `docs must not change: ${docsFile}`);
}

console.log(
  JSON.stringify(
    {
      smoke: "workplane-continuity-spine-summary-v0-1",
      status: "passed",
      latest_stage: readySummary.latest_active_stage,
      source_freshness: readySummary.source_freshness_status,
      checked_files: expectedFiles,
    },
    null,
    2,
  ),
);

function readyInput() {
  return {
    workplane_context: workplaneContext(),
    current_working_perspective_read: currentPerspectiveRead(),
    workplane_continuity_relay: continuityRelay(),
    workbench_spine_consolidation: workbenchSpine(),
    workbench_dogfood_loop_spine_overview: dogfoodSpine(),
    residual_diagnostic_candidate_read_model: residualReadModel(),
    applied_current_working_perspective_read: appliedCwpRead(),
    current_working_perspective_route_integration_read:
      routeIntegrationRead(),
    applied_handoff_context_read: appliedHandoffContextRead(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(),
    handoff_send_contract_record_review: handoffSendContractReview(),
    handoff_send_record_review: handoffSendRecordReview(),
    sent_handoff_read: sentHandoffRead(),
    external_handoff_delivery_contract_record_review:
      externalContractRecordReview(),
    provider_specific_delivery_intent_contract_record_review:
      providerIntentRecordReview(),
    delivery_spine_loop_closure_read_model: deliverySpineLoopClosure(),
    provider_specific_delivery_execution_contract_record_review:
      providerExecutionRecordReview(),
    scope: "project:augnes",
    as_of: "2026-07-09T00:00:00.000Z",
    source_refs: ["workbench:continuity_spine_summary_smoke"],
  };
}

function workplaneContext({ sourceStatus = "fresh" } = {}) {
  return {
    current_perspective_read: currentPerspectiveRead(sourceStatus),
    continuity_relay: continuityRelay(sourceStatus),
    overview: {
      current_perspective: {
        as_of: "2026-07-09T00:00:00.000Z",
      },
    },
    source_status: {
      current_perspective: sourceStatus,
      delta_projection: "fresh",
      runner_delta_batch: "fresh",
    },
    fallback_reason: {
      current_perspective:
        sourceStatus === "fixture_fallback" ? "runtime_fallback" : null,
      delta_projection: null,
      runner_delta_batch: null,
    },
  };
}

function currentPerspectiveRead(sourceStatus = "fresh") {
  return {
    source_status: sourceStatus,
    data: {
      as_of: "2026-07-09T00:00:00.000Z",
      current_frame: {
        source_refs: ["cwp:source:1"],
      },
      staleness: {
        status: sourceStatus === "fixture_fallback" ? "fallback" : "fresh",
      },
    },
  };
}

function continuityRelay(sourceStatus = "fresh") {
  return {
    relay_version: "workplane_continuity_relay.v0.1",
    source_status: {
      current_perspective: sourceStatus,
      delta_projection: "fresh",
      guide_brief: "fresh",
      runner_delta_batch: "fresh",
    },
    fallback_reason: sourceStatus === "fixture_fallback" ? "runtime_fallback" : null,
  };
}

function workbenchSpine() {
  return {
    dashboard_version: "workbench_spine_consolidation.v0.1",
    as_of: "2026-07-09T00:00:00.000Z",
    source_refs: ["workbench:spine:1"],
    dashboard_status: "local_fulfillment_available",
    stage_summaries: [],
    lineage_map: { missing_links: [], edges: [], nodes: [] },
    blocker_summary: {
      blockers: [],
      missing_prerequisites: [],
      authority_warnings: [],
      malformed_inputs: [],
    },
  };
}

function dogfoodSpine() {
  return {
    preview_version: "workbench_dogfood_loop_spine_overview.v0.1",
    as_of: "2026-07-09T00:00:00.000Z",
    source_refs: ["workbench:dogfood:1"],
    overview_status: "ready_for_operator_review",
    spine_summary: { supplied_step_count: 1 },
    spine_steps: [
      {
        step_id: "review_selected_session_digest_ingest_record",
        material_count: 1,
      },
    ],
    top_blockers: [],
    top_missing_evidence: [],
    current_material_gaps: [],
  };
}

function residualReadModel(overrides = {}) {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    as_of: "2026-07-09T00:00:00.000Z",
    source_refs: ["workbench:residual:1"],
    dashboard_status: "no_signal",
    residual_candidates: [],
    insufficient_data: [],
    ...overrides,
  };
}

function appliedCwpRead() {
  return {
    read_version: "applied_current_working_perspective_read.v0.1",
    status: "latest_applied_snapshot_available",
    summary: {
      applied_snapshot_ref: "applied-cwp:1",
      staleness_status: "fresh",
    },
  };
}

function routeIntegrationRead(status = "runtime_with_applied_snapshot_overlay_candidate", usedFallback = false) {
  return {
    read_version: "current_working_perspective_route_integration_read.v0.1",
    status,
    source_refs: ["workbench:route-integration:1"],
    contract_summary: {
      record_id: "route-contract-record:1",
    },
    applied_snapshot_metadata: {
      applied_snapshot_ref: "applied-cwp:1",
    },
    runtime_current_working_perspective_summary: {
      cwp_ref: "cwp:runtime:1",
    },
    fallback_metadata: {
      used_runtime_fallback: usedFallback,
      fallback_reason: usedFallback ? "runtime_only" : null,
    },
    blocked_reasons: [],
    refusal_reasons: [],
    warnings: [],
  };
}

function appliedHandoffContextRead() {
  return {
    read_version: "applied_handoff_context_read.v0.1",
    status: "latest_applied_handoff_context_snapshot_available",
    summary: {
      applied_handoff_context_snapshot_ref: "applied-handoff-context:1",
      source_contract_record_ref: "handoff-context-contract-record:1",
      source_route_integration_read_ref: "route-contract-record:1",
    },
  };
}

function exportedArtifactRead() {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    status: "latest_exported_handoff_packet_artifact_available",
    summary: {
      exported_artifact_ref: "exported-artifact:1",
      source_copy_export_contract_record_ref: "copy-export-contract:1",
    },
  };
}

function handoffSendContractReview() {
  return {
    review_version: "handoff_send_contract_record_review.v0.1",
    review_status: "selected_record_found",
    source_refs: ["workbench:handoff-send-contract:1"],
    selected_record_summary: {
      record_id: "handoff-send-contract-record:1",
    },
    latest_record_summary: {
      record_id: "handoff-send-contract-record:1",
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  };
}

function handoffSendRecordReview() {
  return {
    review_version: "handoff_send_record_review.v0.1",
    review_status: "selected_record_found",
    source_refs: ["workbench:handoff-send-record:1"],
    selected_record_summary: {
      record_id: "handoff-send-record:1",
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:1",
      source_exported_artifact_ref: "exported-artifact:1",
    },
    latest_record_summary: {
      record_id: "handoff-send-record:1",
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    operator_review_checklist: [],
  };
}

function sentHandoffRead() {
  return {
    status: "not_configured",
    source_refs: ["workbench:sent-handoff:1"],
  };
}

function externalContractRecordReview() {
  return {
    review_version: "external_handoff_delivery_contract_record_review.v0.1",
    review_status: "selected_record_found",
    source_refs: ["workbench:external-contract:1"],
    selected_record_summary: {
      record_id: "external-contract-record:1",
      source_local_fulfillment_ref: "handoff-send-record:1",
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:1",
      source_exported_artifact_ref: "exported-artifact:1",
    },
    latest_record_summary: {
      record_id: "external-contract-record:1",
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  };
}

function providerIntentRecordReview() {
  return {
    review_version:
      "provider_specific_delivery_intent_contract_record_review.v0.1",
    review_status: "selected_record_found",
    source_refs: ["workbench:provider-intent:1"],
    selected_record_summary: {
      record_id: "provider-intent-record:1",
      source_provider_specific_preview_fingerprint: "provider-preview-fp-1",
      source_external_handoff_delivery_contract_record_ref:
        "external-contract-record:1",
      source_local_fulfillment_ref: "handoff-send-record:1",
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:1",
      source_exported_artifact_ref: "exported-artifact:1",
    },
    latest_record_summary: {
      record_id: "provider-intent-record:1",
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  };
}

function deliverySpineLoopClosure() {
  return {
    read_model_version: "delivery_spine_loop_closure_read_model.v0.1",
    as_of: "2026-07-09T00:00:00.000Z",
    delivery_spine_status: "provider_specific_intent_recorded",
    source_refs: ["workbench:delivery-spine:1"],
    lineage_map: {
      missing_links: [],
      nodes: [
        {
          ref: "provider-intent-record:1",
        },
      ],
    },
    blocker_summary: {
      blockers: [],
    },
    warning_summary: {
      warnings: [],
    },
  };
}

function providerExecutionRecordReview() {
  return {
    review_version:
      "provider_specific_delivery_execution_contract_record_review.v0.1",
    review_status: "recordable",
    review_fingerprint: "provider-execution-review-fp-1",
    source_execution_contract_preview_fingerprint: "execution-preview-fp-1",
    source_operator_decision_preview_fingerprint: "operator-decision-fp-1",
    source_delivery_spine_fingerprint: "delivery-spine-fp-1",
    source_provider_specific_intent_contract_record_ref:
      "provider-intent-record:1",
    source_external_handoff_delivery_contract_record_ref:
      "external-contract-record:1",
    source_exported_handoff_artifact_ref: "exported-artifact:1",
    source_local_fulfillment_ref: "handoff-send-record:1",
    source_handoff_send_contract_record_ref:
      "handoff-send-contract-record:1",
    source_refs: ["workbench:provider-execution-record-review:1"],
    requirement_summary: {
      required_refs: [],
      missing_refs: [],
      satisfied_requirements: [],
    },
    blocker_reasons: [],
    warning_reasons: [],
    insufficient_data_reasons: [],
    readiness_summary: {
      recordable: true,
    },
    would_record_provider_specific_delivery_execution_contract_record: {
      record_fingerprint: "provider-execution-record-fp-1",
    },
  };
}

function assertAllDangerousAuthorityFlagsFalse(boundary) {
  for (const [key, value] of Object.entries(boundary)) {
    if (key.startsWith("can_") || key === "source_of_truth") {
      assert.equal(value, false, `${key} must be false`);
    }
  }
}

function assertNoRawMaterialEmitted(summary) {
  const text = JSON.stringify(summary).toLowerCase();
  for (const forbidden of [
    "https://",
    "raw_payload",
    "raw recipient",
    "raw_recipient",
    "manual_note",
    "result_report",
    "token",
    "secret",
    "openai_api_key",
    "env:",
    "credential",
  ]) {
    assert(!text.includes(forbidden), `summary emitted raw material: ${forbidden}`);
  }
}

function assertNoForbiddenPureRuntime(label, text) {
  const forbiddenPatterns = [
    [/\bfetch\s*\(/, "network fetch"],
    [/\bXMLHttpRequest\b/, "browser network client"],
    [/\bnew\s+Database\b/, "direct DB open"],
    [/from\s+["']@\/lib\/db["']/, "direct DB import"],
    [/better-sqlite3/, "DB package import"],
    [/@openai|from\s+["']openai["']/, "OpenAI package import"],
    [/\boctokit\b/i, "GitHub runtime client"],
    [/\bexecuteCodex\s*\(/, "Codex execution"],
    [/\bcodexSdk\b/i, "Codex SDK"],
    [/\bplaywright\b|\bpuppeteer\b/i, "browser automation"],
    [/\bcreatePullRequest\s*\(/, "GitHub actuation"],
    [/\bnavigator\.clipboard\b/, "clipboard write surface"],
    [/\bdownload\s*=/, "download surface"],
    [/from\s+["']@\/app\/api\//, "route import"],
  ];

  for (const [pattern, name] of forbiddenPatterns) {
    assert(!pattern.test(text), `${label} must not add ${name}: ${pattern}`);
  }
}

function assertNoActionButtons(label, text) {
  for (const pattern of [/<button\b/i, /\bonClick\s*=/, /role=["']button["']/i, /action-control/i]) {
    assert(!pattern.test(text), `${label} must not add action button/control`);
  }
}

function workplaneContinuitySpineSummarySnippet(agentText) {
  const start = agentText.indexOf("buildWorkplaneContinuitySpineSummaryV01");
  const panel = agentText.indexOf("<WorkplaneContinuitySpineSummaryPanel");
  assert(start >= 0, "missing summary builder in Agent Workplane");
  assert(panel >= 0, "missing summary panel in Agent Workplane");
  return agentText.slice(Math.max(0, start - 400), panel + 220);
}

function assertNoUnexpectedChangedOrUntrackedFiles(allowedFiles) {
  const allowed = new Set(allowedFiles);
  for (const file of changedAndUntrackedFiles()) {
    assert(allowed.has(file), `Unexpected changed or untracked file: ${file}`);
  }
}

function changedAndUntrackedFiles() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untracked = collectUntrackedFiles();
  return uniqueSorted([
    ...workingTree.files,
    ...baseRange.files,
    ...untracked,
  ]);
}
