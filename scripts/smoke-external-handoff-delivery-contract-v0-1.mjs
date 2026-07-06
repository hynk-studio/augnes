#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const root = process.cwd();
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");

assertPackageScript({
  packageJsonText: pkgText,
  scriptName: "smoke:external-handoff-delivery-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-external-handoff-delivery-contract-v0-1.mjs",
});

const expectedFiles = [
  "types/external-handoff-delivery-contract.ts",
  "lib/workplane/external-handoff-delivery-contract-preview.ts",
  "lib/workplane/external-handoff-delivery-operator-decision-preview.ts",
  "lib/workplane/external-handoff-delivery-contract-write.ts",
  "lib/workplane/external-handoff-delivery-contract-record-review.ts",
  "lib/workplane/read-external-handoff-delivery-contract-record-review-for-web.ts",
  "components/workplane/external-handoff-delivery-contract-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-external-handoff-delivery-contract-v0-1.mjs",
  "types/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts",
  "components/workplane/provider-specific-external-delivery-preview-contract-panel.tsx",
  "scripts/smoke-provider-specific-external-delivery-preview-contract-v0-1.mjs",
  "types/provider-specific-delivery-intent-contract.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-operator-decision-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-write.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-record-review.ts",
  "lib/workplane/read-provider-specific-delivery-intent-contract-record-review-for-web.ts",
  "components/workplane/provider-specific-delivery-intent-contract-panel.tsx",
  "scripts/smoke-provider-specific-delivery-intent-contract-v0-1.mjs",
  "types/delivery-spine-loop-closure.ts",
  "lib/workplane/delivery-spine-loop-closure.ts",
  "components/workplane/delivery-spine-loop-closure-panel.tsx",
  "scripts/smoke-delivery-spine-loop-closure-v0-1.mjs",
  "scripts/smoke-residual-diagnostic-candidate-v0-1.mjs",
  "scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
  "scripts/smoke-handoff-send-slice-v0-1.mjs",
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 9)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "external_handoff_delivery_contract_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get("types/external-handoff-delivery-contract.ts");
const previewText = textByFile.get(
  "lib/workplane/external-handoff-delivery-contract-preview.ts",
);
const decisionText = textByFile.get(
  "lib/workplane/external-handoff-delivery-operator-decision-preview.ts",
);
const writeText = textByFile.get(
  "lib/workplane/external-handoff-delivery-contract-write.ts",
);
const reviewText = textByFile.get(
  "lib/workplane/external-handoff-delivery-contract-record-review.ts",
);
const readText = textByFile.get(
  "lib/workplane/read-external-handoff-delivery-contract-record-review-for-web.ts",
);
const panelText = textByFile.get(
  "components/workplane/external-handoff-delivery-contract-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "external_handoff_delivery_contract_preview.v0.1",
  "external_handoff_delivery_operator_decision_preview.v0.1",
  "external_handoff_delivery_contract_record.v0.1",
  "external_handoff_delivery_contract_receipt.v0.1",
  "external_handoff_delivery_contract_store.v0.1",
  "external_handoff_delivery_contract_record_review.v0.1",
  "ready_for_contract_decision",
  "record_external_delivery_contract_candidate",
  "delivery_performed: false",
  "provider_called: false",
  "external_message_sent: false",
  "network_called: false",
  "local_fulfillment_is_external_delivery: false",
  "can_send_handoff: false",
  "can_call_send_provider: false",
  "can_call_email: false",
  "can_call_slack: false",
  "can_call_webhook: false",
  "can_write_clipboard: false",
  "can_download_file: false",
  "can_write_memory: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(
  agentText.includes("buildExternalHandoffDeliveryContractPreviewV01"),
  "Agent Workplane must build external handoff delivery contract preview",
);
assert(
  agentText.includes("<ExternalHandoffDeliveryContractPanel"),
  "Agent Workplane must render external handoff delivery contract panel",
);
assertNoForbiddenPureRuntime("preview", previewText);
assertNoForbiddenPureRuntime("decision", decisionText);
assertNoForbiddenPureRuntime("review", reviewText);
assertNoForbiddenPureRuntime("read helper", readText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentExternalDeliverySnippet(agentText));
assertScopedWriteOnly(writeText);

const { buildWorkbenchSpineConsolidationV01 } = await import(
  "../lib/workplane/workbench-spine-consolidation.ts"
);
const { buildResidualDiagnosticCandidateReadModelV01 } = await import(
  "../lib/workplane/residual-diagnostic-candidate.ts"
);
const {
  buildExternalHandoffDeliveryContractPreviewV01,
} = await import(
  "../lib/workplane/external-handoff-delivery-contract-preview.ts"
);
const {
  buildExternalHandoffDeliveryOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/external-handoff-delivery-operator-decision-preview.ts"
);
const writeLib = await import(
  "../lib/workplane/external-handoff-delivery-contract-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/external-handoff-delivery-contract-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-external-handoff-delivery-contract-record-review-for-web.ts"
);

const happySpine = buildWorkbenchSpineConsolidationV01(buildHappyInput());
const happyResidual = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: happySpine,
  current_working_perspective_route_integration_read: routeRead(),
});
const happyPreview = buildExternalHandoffDeliveryContractPreviewV01({
  workbench_spine_consolidation: happySpine,
  residual_diagnostic_candidate_read_model: happyResidual,
  sent_handoff_read: sentHandoffRead(true),
  handoff_send_record_review: sendRecordReview(),
  handoff_send_contract_record_review: sendContractReview(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(true),
  applied_handoff_context_read: appliedHandoffRead(true),
  source_refs: ["source:external-delivery-contract-smoke"],
  evidence_refs: ["evidence:external-delivery-contract-smoke"],
  as_of: "2026-07-06T00:00:00.000Z",
});
assert.equal(happySpine.dashboard_status, "local_fulfillment_available");
assert.equal(happyPreview.status, "ready_for_contract_decision");
assert.equal(happyPreview.external_delivery_boundary.delivery_performed, false);
assert.equal(happyPreview.external_delivery_boundary.provider_called, false);
assert.equal(happyPreview.external_delivery_boundary.external_message_sent, false);
assert.equal(
  happyPreview.external_delivery_boundary.local_fulfillment_is_external_delivery,
  false,
);
assert(
  happyPreview.warning_reasons.some((reason) =>
    reason.includes("external_delivery_boundary_pressure"),
  ),
  "external boundary pressure should be warning-only",
);

const happyDecision = buildExternalHandoffDeliveryOperatorDecisionPreviewV01({
  external_handoff_delivery_contract_preview: happyPreview,
  requested_operator_ref: "operator:external-delivery-contract",
  requested_idempotency_key: "idempotency:external-delivery-contract:001",
  review_confirmation_ref: "review:external-delivery-contract:001",
  operator_decision_intent: "record_external_delivery_contract_candidate",
  as_of: "2026-07-06T00:00:00.000Z",
});
assert.equal(
  happyDecision.recommended_operator_decision,
  "record_external_delivery_contract_candidate",
);
assert.equal(
  happyDecision.decision_status,
  "ready_for_external_delivery_contract_record_write",
);
assert.equal(happyDecision.write_readiness.write_ready, true);

const db = new Database(":memory:");
const writeInput = {
  operator_decision_preview: happyDecision,
  operator_approval: {
    operator_decision: "record_external_delivery_contract_candidate",
    approved_by: "operator:external-delivery-contract",
    operator_ref: "operator:external-delivery-contract",
    approved_at: "2026-07-06T00:00:00.000Z",
    approval_statement: "record external delivery contract candidate",
    checklist_confirmations: [
      "confirm:no_external_delivery",
      "confirm:no_provider_call",
      "confirm:future_provider_contract_required",
    ],
  },
  idempotency_key: "idempotency:external-delivery-contract:001",
  requested_side_effects: {
    can_write_db: true,
    can_create_external_delivery_contract_record: true,
    can_create_external_delivery_contract_receipt: true,
  },
  notes: ["local external delivery contract candidate only"],
};
const written = writeLib.writeExternalHandoffDeliveryContractRecordV01(
  writeInput,
  { db },
);
assert.equal(written.status, "written");
assert(written.record, "write should produce a record");
assert.equal(written.record.external_delivery_boundary.delivery_performed, false);
assert.equal(written.record.external_delivery_boundary.provider_called, false);
assert.equal(written.record.external_delivery_boundary.external_message_sent, false);
assert.equal(written.receipt.external_delivery_performed, false);
assert.equal(written.receipt.provider_called, false);
assert.equal(written.receipt.external_message_sent, false);
assert.equal(written.receipt.wrote, true);

const replay = writeLib.writeExternalHandoffDeliveryContractRecordV01(writeInput, {
  db,
});
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);
assert.equal(replay.receipt.external_delivery_performed, false);
assert.equal(replay.receipt.provider_called, false);
assert.equal(replay.receipt.external_message_sent, false);

const readById = writeLib.readExternalHandoffDeliveryContractByIdV01(
  written.record.record_id,
  { db },
);
assert.equal(readById.status, "read");
const readByIdempotency =
  writeLib.readExternalHandoffDeliveryContractByIdempotencyKeyV01(
    "idempotency:external-delivery-contract:001",
    { db },
  );
assert.equal(readByIdempotency.status, "read");
const listed = writeLib.listExternalHandoffDeliveryContractRecordsV01({ db });
assert.equal(listed.status, "listed");
assert.equal(listed.records.length, 1);

const review = reviewLib.buildExternalHandoffDeliveryContractRecordReviewV01({
  store_result: listed,
  selected_record_id: written.record.record_id,
});
assert.equal(review.review_status, "selected_record_found");
assert.equal(
  review.selected_record_summary.source_handoff_send_contract_record_ref,
  "handoff-send-contract-record:001",
);
assert.equal(review.evidence_summary.delivery_performed, false);
assert.equal(review.evidence_summary.provider_called, false);
assert.equal(review.evidence_summary.external_message_sent, false);

for (const forgedRecord of [
  (() => {
    const record = cloneRecord(written.record);
    delete record.source_handoff_send_contract_record_ref;
    return record;
  })(),
  {
    ...cloneRecord(written.record),
    source_handoff_send_contract_record_ref: null,
  },
]) {
  assertInvalidRecordReview({
    reviewLib,
    record: forgedRecord,
    reason: "source_handoff_send_contract_record_ref_missing",
  });
}

for (const [field, reason] of [
  ["delivery_performed", "external_delivery_performed_true"],
  ["provider_contract_present", "provider_contract_present_true"],
  ["provider_specific_delivery", "provider_specific_delivery_true"],
  ["provider_called", "provider_called_true"],
  ["external_message_sent", "external_message_sent_true"],
  ["email_sent", "email_sent_true"],
  ["slack_sent", "slack_sent_true"],
  ["webhook_called", "webhook_called_true"],
  ["network_called", "network_called_true"],
  ["clipboard_written", "clipboard_written_true"],
  ["file_downloaded", "file_downloaded_true"],
  [
    "local_fulfillment_is_external_delivery",
    "local_fulfillment_is_external_delivery_true",
  ],
]) {
  const record = cloneRecord(written.record);
  record.external_delivery_boundary[field] = true;
  assertInvalidRecordReview({ reviewLib, record, reason });
}

for (const [field, reason] of [
  ["network_called", "receipt_network_called_true"],
  ["clipboard_written", "receipt_clipboard_written_true"],
  ["file_downloaded", "receipt_file_downloaded_true"],
]) {
  const record = cloneRecord(written.record);
  record.receipt[field] = true;
  assertInvalidRecordReview({ reviewLib, record, reason });
}
const readReview =
  readReviewLib.readExternalHandoffDeliveryContractRecordReviewForWebV01();
assert.equal(readReview.review_status, "no_records");

const missingFulfillmentSpine = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  handoff_send_record_review: noSendRecordReview(),
  sent_handoff_read: sentHandoffRead(false),
});
const missingFulfillmentPreview = buildExternalHandoffDeliveryContractPreviewV01({
  workbench_spine_consolidation: missingFulfillmentSpine,
  residual_diagnostic_candidate_read_model: happyResidual,
  sent_handoff_read: sentHandoffRead(false),
  handoff_send_record_review: noSendRecordReview(),
  handoff_send_contract_record_review: sendContractReview(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(true),
});
assert.equal(missingFulfillmentPreview.status, "no_local_fulfillment");
assert.equal(
  missingFulfillmentPreview.would_write_external_handoff_delivery_contract_record_preview,
  null,
);

const upstreamGapSpine = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  applied_current_working_perspective_read: undefined,
});
const upstreamGapPreview = buildExternalHandoffDeliveryContractPreviewV01({
  workbench_spine_consolidation: upstreamGapSpine,
  residual_diagnostic_candidate_read_model:
    buildResidualDiagnosticCandidateReadModelV01({
      workbench_spine_consolidation: upstreamGapSpine,
    }),
  sent_handoff_read: sentHandoffRead(true),
  handoff_send_record_review: sendRecordReview(),
  handoff_send_contract_record_review: sendContractReview(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(true),
});
assert.equal(upstreamGapPreview.status, "residual_gate_blocked");
assert.equal(
  upstreamGapPreview.would_write_external_handoff_delivery_contract_record_preview,
  null,
);

for (const [category, expectedStatus] of [
  ["authority_boundary_drift", "residual_gate_blocked"],
  ["source_ref_lineage_mismatch", "residual_gate_blocked"],
  ["no_side_effects_replay_inconsistency", "residual_gate_blocked"],
]) {
  const blockedPreview = buildExternalHandoffDeliveryContractPreviewV01({
    workbench_spine_consolidation: happySpine,
    residual_diagnostic_candidate_read_model: residualWithCandidate(category, {
      status: "actionable_candidate",
      severity: "high",
      materialized_inconsistencies: [`${category}:materialized`],
      observed_signals: [
        {
          summary: `${category}:materialized`,
          materialized_inconsistency: true,
        },
      ],
    }),
    sent_handoff_read: sentHandoffRead(true),
    handoff_send_record_review: sendRecordReview(),
    handoff_send_contract_record_review: sendContractReview(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(true),
  });
  assert.equal(blockedPreview.status, expectedStatus, category);
  assert.equal(
    blockedPreview.would_write_external_handoff_delivery_contract_record_preview,
    null,
  );
}

const pressureOnlyPreview = buildExternalHandoffDeliveryContractPreviewV01({
  workbench_spine_consolidation: happySpine,
  residual_diagnostic_candidate_read_model: residualWithCandidate(
    "external_delivery_boundary_pressure",
    {
      status: "candidate",
      severity: "medium",
      materialized_inconsistencies: [],
      observed_signals: [
        {
          summary: "local fulfillment remains not external delivery",
          materialized_inconsistency: false,
        },
      ],
    },
  ),
  sent_handoff_read: sentHandoffRead(true),
  handoff_send_record_review: sendRecordReview(),
  handoff_send_contract_record_review: sendContractReview(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(true),
});
assert.equal(pressureOnlyPreview.status, "ready_for_contract_decision");
assert.equal(pressureOnlyPreview.residual_gate_summary.gate_status, "warning_only");

const forgedAuthorityPreview = buildExternalHandoffDeliveryContractPreviewV01({
  workbench_spine_consolidation: {
    ...happySpine,
    authority_boundary: {
      ...happySpine.authority_boundary,
      can_call_send_provider: true,
      can_write_db: true,
      can_send_handoff: true,
    },
  },
  residual_diagnostic_candidate_read_model: happyResidual,
  sent_handoff_read: sentHandoffRead(true),
  handoff_send_record_review: sendRecordReview(),
  handoff_send_contract_record_review: sendContractReview(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(true),
});
assert.equal(forgedAuthorityPreview.status, "authority_boundary_blocked");
assert.equal(forgedAuthorityPreview.authority_boundary.read_only, true);
assert.equal(forgedAuthorityPreview.authority_boundary.can_write_db, false);
assert.equal(forgedAuthorityPreview.authority_boundary.can_send_handoff, false);
assert.equal(
  forgedAuthorityPreview.authority_boundary.can_call_send_provider,
  false,
);

for (const forgedBoundary of [
  { provider_called: true },
  { external_message_sent: true },
  { local_fulfillment_is_external_delivery: true },
]) {
  const forgedProviderPreview = buildExternalHandoffDeliveryContractPreviewV01({
    workbench_spine_consolidation: {
      ...happySpine,
      external_delivery: {
        ...happySpine.external_delivery,
        ...forgedBoundary,
      },
    },
    residual_diagnostic_candidate_read_model: happyResidual,
    sent_handoff_read: sentHandoffRead(true),
    handoff_send_record_review: sendRecordReview(),
    handoff_send_contract_record_review: sendContractReview(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(true),
  });
  assert.notEqual(forgedProviderPreview.status, "ready_for_contract_decision");
  assert.equal(
    forgedProviderPreview.would_write_external_handoff_delivery_contract_record_preview,
    null,
  );
}

const refused = writeLib.writeExternalHandoffDeliveryContractRecordV01(
  {
    ...writeInput,
    idempotency_key: "idempotency:external-delivery-contract:refused",
    requested_side_effects: { provider_called: true },
  },
  { db: new Database(":memory:") },
);
assert.equal(refused.status, "refused");
assert.equal(refused.receipt.provider_called, false);
assert.equal(refused.receipt.external_delivery_performed, false);

console.log("smoke-external-handoff-delivery-contract-v0-1: ok");

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
    source_refs: ["workbench:external-delivery-contract-smoke"],
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
    authority_boundary: readOnlyBoundary(),
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
    authority_boundary: readOnlyBoundary(),
  };
}

function applyRecordReview() {
  return recordReview("current_working_perspective_apply_record_review.v0.1");
}

function handoffContextApplyReview() {
  return recordReview("handoff_context_apply_record_review.v0.1");
}

function packetCopyExportReview() {
  return recordReview("handoff_packet_copy_export_record_review.v0.1");
}

function recordReview(reviewVersion) {
  return {
    review_version: reviewVersion,
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
    authority_boundary: readOnlyBoundary(),
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
    authority_boundary: readOnlyBoundary(),
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
      source_exported_artifact_ref: "exported-artifact:001",
      requested_delivery_mode: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      payload_hash: "payload-hash:001",
      payload_type: "markdown_payload",
    },
    selected_record_summary: null,
    input_summary: { valid_record_count: 1 },
    evidence_summary: { payload_hashes: ["payload-hash:001"] },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ review_only: true }),
  };
}

function noSendRecordReview() {
  return {
    review_version: "handoff_send_record_review.v0.1",
    scope: "project:augnes",
    review_status: "no_records",
    source_refs: ["source:send-record"],
    latest_record_summary: null,
    selected_record_summary: null,
    input_summary: { valid_record_count: 0 },
    evidence_summary: { payload_hashes: [] },
    blocked_reasons: [],
    insufficient_data_reasons: ["handoff_send_record_missing"],
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
    authority_boundary: readOnlyBoundary(),
  };
}

function residualWithCandidate(category, overrides = {}) {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    dashboard_status: "candidates_available",
    source_refs: ["source:residual"],
    candidate_summary: {
      candidate_count: 1,
      actionable_candidate_count:
        overrides.status === "actionable_candidate" ? 1 : 0,
      blocked_candidate_count: 0,
      insufficient_data_candidate_count: 0,
      repeated_pattern_count: 1,
      materialized_inconsistency_count:
        overrides.materialized_inconsistencies?.length ?? 0,
      ordinary_missing_count: 0,
      recommended_next_hardening_target: category,
    },
    residual_candidates: [
      {
        candidate_id: `residual:${category}:001`,
        category,
        label: category,
        status: "candidate",
        severity: "medium",
        confidence: "medium",
        pattern_key: category,
        summary: category,
        source_signal_count: 1,
        repeated_evidence_count: 1,
        source_refs: ["source:residual"],
        evidence_refs: ["evidence:residual"],
        observed_signals: [],
        ordinary_missing_prerequisites: [],
        materialized_inconsistencies: [],
        false_leap_contrast: "candidate-only diagnostic does not authorize delivery",
        minimum_verification: ["verify local boundary remains false"],
        suggested_next_hardening_target: category,
        why_now: "smoke fixture",
        non_goals: ["external_delivery"],
        read_only: true,
        ...overrides,
      },
    ],
    insufficient_data: [],
    ordinary_missing_prerequisites: [],
    materialized_inconsistencies: overrides.materialized_inconsistencies ?? [],
    authority_boundary: readOnlyBoundary({
      advisory_only: true,
      candidate_layer_only: true,
    }),
    would_not_do: [],
    non_goals: [],
  };
}

function readOnlyBoundary(extra = {}) {
  return {
    read_only: true,
    advisory_only: true,
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

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

function assertInvalidRecordReview({ reviewLib, record, reason }) {
  const review = reviewLib.buildExternalHandoffDeliveryContractRecordReviewV01({
    records: [record],
  });
  assert.equal(review.review_status, "records_invalid", reason);
  assert(
    review.blocked_reasons.includes(
      "external_handoff_delivery_contract_records_invalid",
    ),
    `${reason} should block review`,
  );
  assert.equal(review.input_summary.valid_record_count, 0, reason);
  assert(
    review.record_summaries[0].problem_reasons.includes(reason),
    `missing problem reason ${reason}`,
  );
}

function assertNoForbiddenPureRuntime(label, text) {
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
    "navigator.clipboard",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
  assertNoTrueField(label, text, "delivery_performed");
  assertNoTrueField(label, text, "external_message_sent");
  assertNoTrueField(label, text, "provider_called");
  assertNoTrueField(label, text, "can_send_handoff");
  assertNoTrueField(label, text, "can_call_send_provider");
  assertNoTrueField(label, text, "can_write_memory");
}

function assertScopedWriteOnly(text) {
  for (const forbidden of [
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
    "navigator.clipboard",
  ]) {
    assert(!text.includes(forbidden), `writer must not include ${forbidden}`);
  }
  assertNoTrueField("writer", text, "delivery_performed");
  assertNoTrueField("writer", text, "external_message_sent");
  assertNoTrueField("writer", text, "provider_called");
  assertNoTrueField("writer", text, "can_send_handoff");
  assertNoTrueField("writer", text, "can_call_send_provider");
  assertNoTrueField("writer", text, "can_write_memory");
  assert(
    text.includes("CREATE TABLE IF NOT EXISTS external_handoff_delivery_contract_records"),
    "writer schema must be scoped to external delivery contract records",
  );
  assert(
    text.includes("INSERT INTO external_handoff_delivery_contract_records"),
    "writer insert must be scoped to external delivery contract records",
  );
  for (const sql of ["UPDATE ", "DELETE FROM", "ALTER TABLE", "DROP TABLE"]) {
    assert(!text.includes(sql), `writer must not include ${sql}`);
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
      !new RegExp(`on[A-Z][A-Za-z]+\\s*=\\s*\\{[^}]*${action}`, "i").test(text),
      `${label} must not bind ${action} handlers`,
    );
  }
}

function assertNoTrueField(label, text, field) {
  const pattern = new RegExp(`(^|[^A-Za-z0-9_])${field}\\s*:\\s*true`);
  assert(!pattern.test(text), `${label} must not set ${field} true`);
}

function agentExternalDeliverySnippet(text) {
  const start = text.indexOf("buildExternalHandoffDeliveryContractPreviewV01");
  const end = text.indexOf("<ExternalHandoffDeliveryContractPanel");
  assert(start >= 0, "missing external delivery contract builder snippet");
  assert(end >= 0, "missing external delivery contract panel snippet");
  return text.slice(start, end + 320);
}
