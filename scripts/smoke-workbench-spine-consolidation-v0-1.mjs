#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  assertChangedFilesWithin,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const root = process.cwd();
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");

assertPackageScript({
  packageJsonText: pkgText,
  scriptName: "smoke:workbench-spine-consolidation-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
});

const expectedFiles = [
  "types/workbench-spine-consolidation.ts",
  "lib/workplane/workbench-spine-consolidation.ts",
  "components/workplane/workbench-spine-consolidation-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 5)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "workbench_spine_consolidation_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get("types/workbench-spine-consolidation.ts");
const helperText = textByFile.get("lib/workplane/workbench-spine-consolidation.ts");
const panelText = textByFile.get(
  "components/workplane/workbench-spine-consolidation-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "workbench_spine_consolidation.v0.1",
  "workbench_spine_lineage_map.v0.1",
  "applied_current_working_perspective",
  "applied_handoff_context",
  "exported_handoff_packet_artifact",
  "handoff_send_contract_record",
  "local_handoff_send_fulfillment",
  "external_handoff_delivery",
  "prepare_external_handoff_delivery_contract",
  "external_delivery_configured: false",
  "local_fulfillment_is_external_delivery: false",
  "can_send_handoff: false",
  "can_call_send_provider: false",
  "can_write_clipboard: false",
  "can_write_memory: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(
  agentText.includes("buildWorkbenchSpineConsolidationV01"),
  "Agent Workplane must build the spine consolidation dashboard",
);
assert(
  agentText.includes("<WorkbenchSpineConsolidationPanel"),
  "Agent Workplane must render the spine consolidation panel",
);
assertNoForbiddenRuntime("helper", helperText);
assertNoForbiddenRuntime("panel", panelText);
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentConsolidationSnippet(agentText));
assert(
  changedFileBoundary.files.every(
    (file) => !file.startsWith("app/api/workplane/workbench-spine"),
  ),
  "no route added",
);

const { buildWorkbenchSpineConsolidationV01 } = await import(
  "../lib/workplane/workbench-spine-consolidation.ts"
);

const happyPath = buildWorkbenchSpineConsolidationV01(buildHappyInput());
assert.equal(happyPath.dashboard_status, "local_fulfillment_available");
assert.equal(
  happyPath.recommended_next_operator_action.action,
  "prepare_external_handoff_delivery_contract",
);
assert.equal(happyPath.external_delivery.status, "not_configured");
assert.equal(happyPath.external_delivery.local_fulfillment_is_external_delivery, false);
assert.equal(happyPath.external_delivery.provider_called, false);
assert.equal(happyPath.external_delivery.external_message_sent, false);
assert.equal(
  stage(happyPath, "applied_current_working_perspective").status,
  "applied",
);
assert.equal(stage(happyPath, "exported_handoff_packet_artifact").status, "exported");
assert.equal(stage(happyPath, "handoff_send_contract_record").status, "approved");
assert.equal(stage(happyPath, "local_handoff_send_fulfillment").status, "fulfilled");
assert(
  happyPath.phase_groups.some((phase) => phase.phase_id === "packet_artifact"),
  "dashboard must group packet artifact phase",
);
assert(
  happyPath.lineage_map.edges.some(
    (edge) =>
      edge.from === "exported_handoff_packet_artifact" &&
      edge.to === "handoff_send_contract_record" &&
      edge.linked,
  ),
  "dashboard must link exported artifact to send contract",
);
assert(
  happyPath.lineage_map.missing_links.includes(
    "external_delivery_contract_not_configured",
  ),
  "external delivery must remain an explicit missing future contract",
);

const missingCwp = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  applied_current_working_perspective_read: undefined,
});
assert.notEqual(missingCwp.dashboard_status, "local_fulfillment_available");
assert(
  missingCwp.blocker_summary.missing_prerequisites.includes(
    "applied_current_working_perspective_snapshot_missing",
  ),
);
assert.equal(
  missingCwp.recommended_next_operator_action.action,
  "resolve_workbench_spine_consolidation_blockers",
);

const missingArtifact = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(false),
});
assert.notEqual(
  stage(missingArtifact, "exported_handoff_packet_artifact").status,
  "exported",
);
assert.notEqual(missingArtifact.dashboard_status, "local_fulfillment_available");
assert(
  missingArtifact.blocker_summary.missing_prerequisites.includes(
    "exported_handoff_packet_artifact_missing",
  ),
);

const localOnly = buildWorkbenchSpineConsolidationV01(buildHappyInput());
assert.equal(stage(localOnly, "local_handoff_send_fulfillment").status, "fulfilled");
assert.equal(localOnly.external_delivery.status, "not_configured");
assert.equal(localOnly.compact_summary.external_delivery_configured, false);

const forgedAuthority = buildHappyInput();
forgedAuthority.applied_current_working_perspective_read = {
  ...forgedAuthority.applied_current_working_perspective_read,
  authority_boundary: {
    ...forgedAuthority.applied_current_working_perspective_read.authority_boundary,
    can_write_db: true,
  },
};
const forgedDashboard = buildWorkbenchSpineConsolidationV01(forgedAuthority);
assert.equal(forgedDashboard.dashboard_status, "blocked");
assert(
  forgedDashboard.blocker_summary.authority_warnings.some((warning) =>
    warning.includes("authority_boundary_forbidden_true:can_write_db"),
  ),
);

const malformedRead = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  sent_handoff_read: { read_version: "bad" },
});
assert.equal(malformedRead.dashboard_status, "blocked");
assert(
  malformedRead.blocker_summary.malformed_inputs.includes(
    "sent_handoff_read_malformed",
  ),
);

const boundary = happyPath.authority_boundary;
for (const [key, value] of Object.entries(boundary)) {
  if (["read_only", "advisory_only", "derived_read_model"].includes(key)) {
    assert.equal(value, true, `${key} true`);
  } else if (key !== "notes") {
    assert.equal(value, false, `${key} false`);
  }
}

console.log("smoke-workbench-spine-consolidation-v0-1: ok");

function buildHappyInput() {
  return {
    applied_current_working_perspective_read: appliedCwpRead(true),
    current_working_perspective_route_integration_read: routeRead(),
    current_working_perspective_apply_record_review: applyRecordReview(),
    handoff_context_apply_record_review: handoffContextApplyReview(),
    applied_handoff_context_read: appliedHandoffRead(true),
    handoff_packet_copy_export_record_review: packetCopyExportReview(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(true),
    handoff_send_contract_record_review: sendContractReview(),
    handoff_send_record_review: sendRecordReview(),
    sent_handoff_read: sentHandoffRead(true),
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    source_refs: ["workbench:spine-consolidation-smoke"],
  };
}

function appliedCwpRead(available) {
  return {
    read_version: "applied_current_working_perspective_read.v0.1",
    status: available
      ? "latest_applied_snapshot_available"
      : "no_applied_snapshot",
    scope: "project:augnes",
    latest_applied_snapshot: available ? {} : null,
    latest_record: available ? {} : null,
    summary: {
      applied_snapshot_ref: available ? "applied-cwp-snapshot:001" : null,
      source_contract_record_ref: "cwp-update-contract:001",
      source_current_working_perspective_ref: "runtime-cwp:001",
      as_of: "2026-07-06T00:00:00.000Z",
      current_frame_summary: "Current frame",
      current_thesis_summary: "Current thesis",
      active_goal_count: 1,
      open_question_count: 0,
      active_risk_count: 0,
      next_candidate_count: 1,
      staleness_status: "fresh",
      applied_patch_count: 3,
    },
    authority_boundary: readOnlyBoundary({
      can_mutate_current_working_perspective: false,
      can_replace_current_working_perspective_route_response: false,
    }),
  };
}

function routeRead() {
  return {
    read_version: "current_working_perspective_route_integration_read.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    status: "runtime_with_applied_snapshot_overlay_candidate",
    route_path: "/api/perspective/current",
    route_family: "current_working_perspective",
    response_mode: "runtime_primary_with_applied_overlay_candidate",
    route_integration_metadata: {
      contract_record_id: "route-integration-contract:001",
      applied_snapshot_ref: "applied-cwp-snapshot:001",
    },
    applied_snapshot_metadata: {
      applied_snapshot_ref: "applied-cwp-snapshot:001",
    },
    blocked_reasons: [],
    warnings: [],
    source_refs: ["source:route"],
    evidence_refs: ["evidence:route"],
    authority_boundary: readOnlyBoundary({
      route_integration_read_only: true,
    }),
  };
}

function applyRecordReview() {
  return {
    review_version: "current_working_perspective_apply_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function appliedHandoffRead(available) {
  return {
    read_version: "applied_handoff_context_read.v0.1",
    status: available
      ? "latest_applied_handoff_context_snapshot_available"
      : "no_applied_handoff_context_snapshot",
    scope: "project:augnes",
    latest_applied_snapshot: available ? {} : null,
    latest_record: available ? {} : null,
    summary: {
      applied_handoff_context_snapshot_ref: available
        ? "applied-handoff-context-snapshot:001"
        : null,
      source_contract_record_ref: "handoff-context-contract:001",
      source_route_integration_read_ref: "route-integration-contract:001",
      as_of: "2026-07-06T00:00:00.000Z",
      section_counts: { summary: 1 },
      entry_count: 2,
      previous_context_used: false,
      copy_export_still_pending: true,
      send_still_pending: true,
    },
    authority_boundary: readOnlyBoundary({
      can_apply_handoff_context_update_live: false,
      can_send_handoff: false,
      can_copy_export_handoff_packet: false,
      can_mutate_memory: false,
    }),
  };
}

function handoffContextApplyReview() {
  return {
    review_version: "handoff_context_apply_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function packetCopyExportReview() {
  return {
    review_version: "handoff_packet_copy_export_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function exportedArtifactRead(available) {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    status: available
      ? "latest_exported_handoff_packet_artifact_available"
      : "no_exported_handoff_packet_artifact",
    scope: "project:augnes",
    latest_exported_artifact: available ? {} : null,
    latest_record: available ? {} : null,
    summary: {
      exported_artifact_ref: available ? "exported-artifact:001" : null,
      source_copy_export_contract_record_ref: "packet-copy-export-contract:001",
      source_applied_handoff_context_snapshot_ref:
        "applied-handoff-context-snapshot:001",
      packet_format: "operator_handoff_packet_markdown",
      copy_export_target: "operator_copy_surface_candidate",
      as_of: "2026-07-06T00:00:00.000Z",
      packet_entry_count: 3,
      packet_section_counts: { summary: 1 },
      has_markdown_payload: true,
      has_json_payload: false,
      has_capsule_payload: false,
      clipboard_write_still_pending: false,
      download_or_file_write_still_pending: false,
      send_still_pending: true,
    },
    authority_boundary: readOnlyBoundary({
      can_write_clipboard: false,
      can_download_file: false,
      can_write_arbitrary_file: false,
      can_send_handoff: false,
      can_mutate_memory: false,
    }),
  };
}

function sendContractReview() {
  return {
    review_version: "handoff_send_contract_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    source_refs: ["source:send-contract"],
    latest_record_summary: {
      record_id: "handoff-send-contract-record:001",
      source_exported_artifact_ref: "exported-artifact:001",
      payload_hash: "payload-hash:001",
    },
    selected_record_summary: null,
    input_summary: { valid_record_count: 1 },
    evidence_summary: { evidence_refs: ["evidence:send-contract"] },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function sendRecordReview() {
  return {
    review_version: "handoff_send_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    source_refs: ["source:send-record"],
    latest_record_summary: {
      record_id: "handoff-send-record:001",
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:001",
      payload_hash: "payload-hash:001",
    },
    selected_record_summary: null,
    input_summary: { valid_record_count: 1 },
    evidence_summary: { payload_hashes: ["payload-hash:001"] },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ review_only: true }),
  };
}

function sentHandoffRead(available) {
  return {
    read_version: "sent_handoff_read.v0.1",
    status: available
      ? "latest_handoff_send_fulfillment_available"
      : "no_handoff_send_fulfillment",
    scope: "project:augnes",
    latest_record: available ? {} : null,
    latest_fulfillment_summary: {
      record_id: available ? "handoff-send-record:001" : null,
      fulfillment_status: available
        ? "locally_fulfilled_manual_operator_send"
        : null,
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:001",
      source_exported_artifact_ref: "exported-artifact:001",
      requested_send_execution_mode: "manual_operator_send_fulfillment",
      requested_send_surface: "operator_manual_send_candidate",
      requested_delivery_mode: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      payload_hash: "payload-hash:001",
      payload_type: "markdown_payload",
      external_delivery_performed: false,
      provider_called: false,
    },
    authority_boundary: readOnlyBoundary({
      can_send_handoff: false,
      can_call_send_provider: false,
      can_call_external_messaging: false,
      can_call_email: false,
      can_call_slack: false,
      can_call_webhook: false,
    }),
  };
}

function readOnlyBoundary(extra = {}) {
  return {
    read_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_browser_or_crawler: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_global_dogfood_metrics: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_create_graph_or_vector_store: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    ...extra,
  };
}

function stage(dashboard, stageId) {
  return dashboard.stage_summaries.find((item) => item.stage_id === stageId);
}

function assertNoForbiddenRuntime(label, text) {
  for (const forbidden of [
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "better-sqlite3",
    "new Database",
    "@/lib/db",
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
    "send_provider_called: true",
    "external_message_sent: true",
    "provider_called: true",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(!text.includes("onClick"), `${label} must not include onClick handlers`);
  for (const action of [
    "approve",
    "write",
    "apply",
    "send",
    "copy",
    "export",
    "download",
    "clipboard",
    "email",
    "slack",
    "webhook",
    "provider",
    "network",
  ]) {
    assert(
      !new RegExp(`on[A-Z][A-Za-z]+${action}`, "i").test(text),
      `${label} must not include ${action} action handlers`,
    );
  }
}

function agentConsolidationSnippet(text) {
  const start = text.indexOf("<WorkbenchSpineConsolidationPanel");
  const end = text.indexOf("/>", start);
  assert(start !== -1, "Agent Workplane must build consolidation dashboard");
  assert(end > start, "Agent Workplane consolidation render snippet must exist");
  return text.slice(start, end + 2);
}
