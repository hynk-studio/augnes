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
  scriptName: "smoke:delivery-spine-loop-closure-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-delivery-spine-loop-closure-v0-1.mjs",
});

const expectedFiles = [
  "types/delivery-spine-loop-closure.ts",
  "lib/workplane/delivery-spine-loop-closure.ts",
  "components/workplane/delivery-spine-loop-closure-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-delivery-spine-loop-closure-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "types/provider-specific-delivery-intent-contract.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-operator-decision-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-write.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-record-review.ts",
  "lib/workplane/read-provider-specific-delivery-intent-contract-record-review-for-web.ts",
  "components/workplane/provider-specific-delivery-intent-contract-panel.tsx",
  "scripts/smoke-provider-specific-delivery-intent-contract-v0-1.mjs",
  "types/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts",
  "components/workplane/provider-specific-external-delivery-preview-contract-panel.tsx",
  "scripts/smoke-provider-specific-external-delivery-preview-contract-v0-1.mjs",
  "types/external-handoff-delivery-contract.ts",
  "lib/workplane/external-handoff-delivery-contract-preview.ts",
  "lib/workplane/external-handoff-delivery-operator-decision-preview.ts",
  "lib/workplane/external-handoff-delivery-contract-write.ts",
  "lib/workplane/external-handoff-delivery-contract-record-review.ts",
  "lib/workplane/read-external-handoff-delivery-contract-record-review-for-web.ts",
  "components/workplane/external-handoff-delivery-contract-panel.tsx",
  "scripts/smoke-external-handoff-delivery-contract-v0-1.mjs",
  "types/residual-diagnostic-candidate.ts",
  "lib/workplane/residual-diagnostic-candidate.ts",
  "components/workplane/residual-diagnostic-candidate-panel.tsx",
  "scripts/smoke-residual-diagnostic-candidate-v0-1.mjs",
  "types/workbench-spine-consolidation.ts",
  "lib/workplane/workbench-spine-consolidation.ts",
  "components/workplane/workbench-spine-consolidation-panel.tsx",
  "scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
  "scripts/smoke-handoff-send-slice-v0-1.mjs",
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 5)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "delivery_spine_loop_closure_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get("types/delivery-spine-loop-closure.ts");
const helperText = textByFile.get("lib/workplane/delivery-spine-loop-closure.ts");
const panelText = textByFile.get(
  "components/workplane/delivery-spine-loop-closure-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "delivery_spine_loop_closure_read_model.v0.1",
  "delivery_spine_lineage_map.v0.1",
  "no_delivery_spine_material",
  "local_fulfillment_available",
  "external_contract_ready",
  "provider_specific_preview_ready",
  "provider_specific_intent_recorded",
  "future_provider_execution_contract_preview",
  "prepare_provider_specific_delivery_execution_contract_preview",
  "execution_boundary_preflight",
  "provider_specific_intent_is_delivery: false",
  "delivery_performed: false",
  "provider_called: false",
  "external_message_sent: false",
  "network_called: false",
  "can_write_db: false",
  "can_call_send_provider: false",
  "can_call_network: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(agentText.includes("buildDeliverySpineLoopClosureReadModelV01"));
assert(agentText.includes("<DeliverySpineLoopClosurePanel"));
assertNoForbiddenPureRuntime("helper", helperText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoForbiddenPureRuntime("agent", agentDeliverySnippet(agentText));
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent", agentDeliverySnippet(agentText));

const { buildDeliverySpineLoopClosureReadModelV01 } = await import(
  "../lib/workplane/delivery-spine-loop-closure.ts"
);

const empty = buildDeliverySpineLoopClosureReadModelV01({});
assert.equal(empty.delivery_spine_status, "no_delivery_spine_material");
assert.equal(empty.blocker_summary.count, 0);
assert.equal(empty.explicit_non_delivery_boundary.delivery_performed, false);
assert.equal(empty.explicit_non_delivery_boundary.provider_called, false);
assert.notEqual(
  empty.recommended_next_operator_action,
  "prepare_provider_specific_delivery_execution_contract_preview",
);

const localOnly = buildDeliverySpineLoopClosureReadModelV01({
  sent_handoff_read: sentHandoffRead(),
  handoff_send_record_review: handoffSendRecordReview(),
  residual_diagnostic_candidate_read_model: residualBoundaryPressureOnly(),
});
assert.equal(localOnly.delivery_spine_status, "local_fulfillment_available");
assert.equal(
  localOnly.recommended_next_operator_action,
  "wait_for_valid_external_delivery_contract_record",
);
assert.equal(localOnly.explicit_non_delivery_boundary.network_called, false);

const externalReady = buildDeliverySpineLoopClosureReadModelV01({
  ...baseLocalInput(),
  external_handoff_delivery_contract_preview: externalPreview(),
  external_handoff_delivery_contract_record_review: externalRecordReview(),
});
assert.equal(externalReady.delivery_spine_status, "external_contract_ready");
assert.equal(
  externalReady.recommended_next_operator_action,
  "wait_for_provider_specific_preview_ready",
);

const providerReady = buildDeliverySpineLoopClosureReadModelV01({
  ...baseExternalInput(),
  provider_specific_external_delivery_preview_contract: providerPreview(),
  provider_specific_external_delivery_operator_decision_preview:
    providerDecision(),
});
assert.equal(providerReady.delivery_spine_status, "provider_specific_preview_ready");
assert.equal(
  providerReady.recommended_next_operator_action,
  "wait_for_provider_specific_intent_record",
);

const full = buildDeliverySpineLoopClosureReadModelV01(fullInput());
assert.equal(full.delivery_spine_status, "provider_specific_intent_recorded");
assert.equal(
  full.stage_summary.future_execution_stage_status,
  "not_started",
);
assert.equal(
  full.recommended_next_operator_action,
  "prepare_provider_specific_delivery_execution_contract_preview",
);
assert.equal(full.explicit_non_delivery_boundary.delivery_performed, false);
assert.equal(full.explicit_non_delivery_boundary.provider_called, false);
assert.equal(full.explicit_non_delivery_boundary.external_message_sent, false);
assert.equal(full.explicit_non_delivery_boundary.email_sent, false);
assert.equal(full.explicit_non_delivery_boundary.slack_sent, false);
assert.equal(full.explicit_non_delivery_boundary.webhook_called, false);
assert.equal(full.explicit_non_delivery_boundary.network_called, false);
assert.equal(full.explicit_non_delivery_boundary.provider_specific_intent_is_delivery, false);
assert(
  ["medium", "high"].includes(
    full.loop_closure_summary.review_burden_risk_level,
  ),
);
assert(
  ["insufficient_data", "no_outcome_claim"].includes(
    full.loop_closure_summary.outcome_claim_status,
  ),
);

for (const flag of [
  "provider_called",
  "external_message_sent",
  "delivery_performed",
  "network_called",
  "email_sent",
  "slack_sent",
  "webhook_called",
]) {
  const forged = providerPreview();
  forged.external_delivery_boundary = {
    ...forged.external_delivery_boundary,
    [flag]: true,
  };
  const blocked = buildDeliverySpineLoopClosureReadModelV01({
    ...fullInput(),
    provider_specific_external_delivery_preview_contract: forged,
  });
  assert.equal(blocked.delivery_spine_status, "invalid_source_material");
  assert.equal(
    blocked.recommended_next_operator_action,
    "resolve_delivery_spine_blockers_before_execution_preview",
  );
}

const lineageMismatch = buildDeliverySpineLoopClosureReadModelV01({
  ...fullInput(),
  external_handoff_delivery_contract_record_review: externalRecordReview({
    source_local_fulfillment_ref: "handoff-send-record:other",
  }),
});
assert.equal(lineageMismatch.delivery_spine_status, "blocked");
assert(
  lineageMismatch.lineage_map.mismatch_links.includes(
    "local_handoff_send_fulfillment->external_delivery_contract_record_review",
  ),
);
assert(
  lineageMismatch.blocker_summary.blockers.includes(
    "local_fulfillment_to_external_contract_ref_mismatch",
  ),
);

const downstreamWithoutUpstream = buildDeliverySpineLoopClosureReadModelV01({
  ...baseLocalInput(),
  provider_specific_external_delivery_preview_contract: providerPreview(),
});
assert.equal(downstreamWithoutUpstream.delivery_spine_status, "blocked");
assert(
  downstreamWithoutUpstream.blocker_summary.blockers.includes(
    "external_contract_to_provider_specific_preview_downstream_without_upstream",
  ),
);

for (const candidate of [
  residualCandidate("authority_boundary_drift"),
  residualCandidate("source_ref_lineage_mismatch"),
  residualCandidate("no_side_effects_replay_inconsistency"),
  residualCandidate("route_integration_mode_mismatch"),
  residualCandidate("review_writer_validation_drift"),
]) {
  const blocked = buildDeliverySpineLoopClosureReadModelV01({
    ...fullInput(),
    residual_diagnostic_candidate_read_model: residualWithCandidate(candidate),
  });
  assert.equal(blocked.residual_gate_summary.gate_status, "blocked");
  assert.equal(blocked.delivery_spine_status, "blocked");
}

const pressureOnly = buildDeliverySpineLoopClosureReadModelV01({
  ...fullInput(),
  residual_diagnostic_candidate_read_model: residualBoundaryPressureOnly(),
});
assert.equal(pressureOnly.residual_gate_summary.gate_status, "warning_only");
assert.equal(pressureOnly.delivery_spine_status, "provider_specific_intent_recorded");

console.log("smoke-delivery-spine-loop-closure-v0-1: ok");

function baseLocalInput() {
  return {
    sent_handoff_read: sentHandoffRead(),
    handoff_send_record_review: handoffSendRecordReview(),
    handoff_send_contract_record_review: handoffSendContractRecordReview(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(),
    residual_diagnostic_candidate_read_model: residualBoundaryPressureOnly(),
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    source_refs: ["source:delivery-spine-loop-closure"],
  };
}

function baseExternalInput() {
  return {
    ...baseLocalInput(),
    external_handoff_delivery_contract_preview: externalPreview(),
    external_handoff_delivery_operator_decision_preview: externalDecision(),
    external_handoff_delivery_contract_record_review: externalRecordReview(),
  };
}

function fullInput() {
  return {
    ...baseExternalInput(),
    provider_specific_external_delivery_preview_contract: providerPreview(),
    provider_specific_external_delivery_operator_decision_preview:
      providerDecision(),
    provider_specific_delivery_intent_contract_preview: intentPreview(),
    provider_specific_delivery_intent_operator_decision_preview: intentDecision(),
    provider_specific_delivery_intent_contract_record_review: intentRecordReview(),
  };
}

function sentHandoffRead() {
  return {
    read_version: "sent_handoff_read.v0.1",
    scope: "project:augnes",
    status: "latest_handoff_send_fulfillment_available",
    latest_record: null,
    latest_fulfillment_summary: {
      record_id: "handoff-send-record:001",
      fulfillment_status: "locally_fulfilled_manual_operator_send",
      source_handoff_send_contract_record_ref: "handoff-send-contract:001",
      source_exported_artifact_ref: "handoff-packet-artifact:001",
      requested_send_execution_mode: "manual_operator_send_fulfillment",
      requested_send_surface: "operator_manual_send_candidate",
      requested_delivery_mode: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      payload_hash: "sha256:delivery-spine-payload",
      payload_type: "markdown_payload",
      external_delivery_performed: false,
      provider_called: false,
    },
    authority_boundary: readOnlyAuthority(),
  };
}

function handoffSendRecordReview() {
  return {
    review_version: "handoff_send_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    latest_record_summary: {
      record_id: "handoff-send-record:001",
      source_handoff_send_contract_record_ref: "handoff-send-contract:001",
      source_exported_artifact_ref: "handoff-packet-artifact:001",
      payload_hash: "sha256:delivery-spine-payload",
      payload_type: "markdown_payload",
      problem_reasons: [],
    },
    input_summary: { valid_record_count: 1 },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    source_refs: ["source:handoff-send-review"],
    authority_boundary: readOnlyAuthority(),
  };
}

function handoffSendContractRecordReview() {
  return {
    review_version: "handoff_send_contract_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    latest_record_summary: {
      record_id: "handoff-send-contract:001",
      source_exported_artifact_ref: "handoff-packet-artifact:001",
      payload_hash: "sha256:delivery-spine-payload",
      problem_reasons: [],
    },
    input_summary: { valid_record_count: 1 },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    source_refs: ["source:handoff-send-contract-review"],
    authority_boundary: readOnlyAuthority(),
  };
}

function exportedArtifactRead() {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    scope: "project:augnes",
    status: "latest_exported_handoff_packet_artifact_available",
    latest_exported_artifact: {
      artifact_ref: "handoff-packet-artifact:001",
      payload_hash: "sha256:delivery-spine-payload",
    },
    source_refs: ["source:exported-artifact"],
    authority_boundary: readOnlyAuthority(),
  };
}

function externalPreview() {
  return {
    preview_version: "external_handoff_delivery_contract_preview.v0.1",
    preview_fingerprint: "preview:external-contract:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    status: "ready_for_contract_decision",
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    payload_hash: "sha256:delivery-spine-payload",
    payload_type: "markdown_payload",
    blocker_reasons: [],
    warning_reasons: [],
    residual_gate_summary: residualGate("warning_only"),
    external_delivery_boundary: deliveryBoundary(),
    authority_boundary: readOnlyAuthority(),
    source_refs: ["source:external-preview"],
    evidence_refs: ["evidence:external-preview"],
  };
}

function externalDecision() {
  return {
    decision_preview_version:
      "external_handoff_delivery_operator_decision_preview.v0.1",
    decision_preview_fingerprint: "decision:external-contract:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    decision_status: "ready_for_external_delivery_contract_record_write",
    recommended_operator_decision: "record_external_delivery_contract_candidate",
    blocker_reasons: [],
    warning_reasons: [],
    write_readiness: {
      write_ready: true,
      current_blockers: [],
      current_missing_evidence: [],
    },
    authority_boundary: readOnlyAuthority(),
  };
}

function externalRecordReview(overrides = {}) {
  return {
    review_version: "external_handoff_delivery_contract_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    latest_record_summary: {
      record_id: "external-handoff-delivery-contract:001",
      source_local_fulfillment_ref: "handoff-send-record:001",
      source_handoff_send_contract_record_ref: "handoff-send-contract:001",
      source_exported_artifact_ref: "handoff-packet-artifact:001",
      payload_hash: "sha256:delivery-spine-payload",
      payload_type: "markdown_payload",
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
      problem_reasons: [],
      ...overrides,
    },
    input_summary: { valid_record_count: 1 },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    source_refs: ["source:external-record-review"],
    authority_boundary: readOnlyAuthority(),
  };
}

function providerPreview() {
  return {
    preview_version: "provider_specific_external_delivery_preview_contract.v0.1",
    preview_fingerprint: "preview:provider-specific:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    status: "ready_for_provider_specific_decision",
    requested_provider_surface: "manual_operator_delivery",
    provider_profile_ref: null,
    source_external_handoff_delivery_contract_record_ref:
      "external-handoff-delivery-contract:001",
    source_external_handoff_delivery_contract_preview_fingerprint:
      "preview:external-contract:001",
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    payload_hash: "sha256:delivery-spine-payload",
    payload_type: "markdown_payload",
    requested_payload_format: "markdown_payload",
    requested_recipient_ref: "recipient:operator",
    blocker_reasons: [],
    warning_reasons: [],
    residual_gate_summary: residualGate("warning_only"),
    external_delivery_boundary: providerBoundary(),
    authority_boundary: readOnlyAuthority(),
    source_refs: ["source:provider-preview"],
    evidence_refs: ["evidence:provider-preview"],
  };
}

function providerDecision() {
  return {
    decision_preview_version:
      "provider_specific_external_delivery_operator_decision_preview.v0.1",
    decision_preview_fingerprint: "decision:provider-specific:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    decision_status: "ready_for_provider_specific_preview_decision",
    recommended_operator_decision:
      "record_provider_specific_preview_contract_candidate",
    blocker_reasons: [],
    warning_reasons: [],
    next_step_readiness: {
      ready_for_operator_review: true,
      current_blockers: [],
      current_missing_evidence: [],
    },
    authority_boundary: readOnlyAuthority(),
  };
}

function intentPreview() {
  return {
    preview_version: "provider_specific_delivery_intent_contract_preview.v0.1",
    preview_fingerprint: "preview:provider-intent:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    status: "ready_for_intent_decision",
    source_provider_specific_preview_fingerprint: "preview:provider-specific:001",
    source_provider_specific_decision_fingerprint: "decision:provider-specific:001",
    source_external_handoff_delivery_contract_record_ref:
      "external-handoff-delivery-contract:001",
    source_external_handoff_delivery_contract_preview_fingerprint:
      "preview:external-contract:001",
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    requested_provider_surface: "manual_operator_delivery",
    provider_profile_ref: null,
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "markdown_payload",
    payload_hash: "sha256:delivery-spine-payload",
    payload_type: "markdown_payload",
    blocker_reasons: [],
    warning_reasons: [],
    residual_gate_summary: residualGate("warning_only"),
    external_delivery_boundary: intentBoundary(),
    authority_boundary: readOnlyAuthority(),
    source_refs: ["source:intent-preview"],
    evidence_refs: ["evidence:intent-preview"],
  };
}

function intentDecision() {
  return {
    decision_preview_version:
      "provider_specific_delivery_intent_operator_decision_preview.v0.1",
    decision_preview_fingerprint: "decision:provider-intent:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    decision_status:
      "ready_for_provider_specific_delivery_intent_contract_record_write",
    recommended_operator_decision:
      "record_provider_specific_delivery_intent_contract_candidate",
    blocker_reasons: [],
    warning_reasons: [],
    write_readiness: {
      write_ready: true,
      current_blockers: [],
      current_missing_evidence: [],
    },
    authority_boundary: readOnlyAuthority(),
  };
}

function intentRecordReview(overrides = {}) {
  return {
    review_version:
      "provider_specific_delivery_intent_contract_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    latest_record_summary: {
      record_id: "provider-specific-intent-record:001",
      source_provider_specific_preview_fingerprint:
        "preview:provider-specific:001",
      source_provider_specific_decision_fingerprint:
        "decision:provider-specific:001",
      source_intent_contract_preview_fingerprint: "preview:provider-intent:001",
      source_external_handoff_delivery_contract_record_ref:
        "external-handoff-delivery-contract:001",
      source_local_fulfillment_ref: "handoff-send-record:001",
      source_handoff_send_contract_record_ref: "handoff-send-contract:001",
      source_exported_artifact_ref: "handoff-packet-artifact:001",
      requested_provider_surface: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      requested_payload_format: "markdown_payload",
      payload_hash: "sha256:delivery-spine-payload",
      payload_type: "markdown_payload",
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
      network_called: false,
      problem_reasons: [],
      ...overrides,
    },
    input_summary: { valid_record_count: 1 },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    source_refs: ["source:intent-record-review"],
    authority_boundary: readOnlyAuthority(),
  };
}

function residualBoundaryPressureOnly() {
  return residualWithCandidate({
    candidate_id: "candidate:boundary-pressure",
    category: "external_delivery_boundary_pressure",
    status: "candidate",
    severity: "medium",
  });
}

function residualCandidate(category) {
  return {
    candidate_id: `candidate:${category}`,
    category,
    status: "actionable_candidate",
    severity: "high",
    observed_signals: [
      {
        summary: `${category} materialized for delivery spine`,
        materialized_inconsistency: true,
      },
    ],
    materialized_inconsistencies: [`${category}:materialized`],
  };
}

function residualWithCandidate(candidate) {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    residual_candidates: [
      {
        observed_signals: [],
        materialized_inconsistencies: [],
        ...candidate,
      },
    ],
    source_refs: ["source:residual"],
    authority_boundary: readOnlyAuthority(),
  };
}

function residualGate(status = "passed") {
  return {
    gate_status: status,
    hard_blocking_candidate_ids: [],
    warning_candidate_ids:
      status === "warning_only" ? ["candidate:boundary-pressure"] : [],
    non_blocking_candidate_ids: [],
    hard_blocker_reasons: [],
    warning_reasons:
      status === "warning_only"
        ? ["residual_candidate_warning:external_delivery_boundary_pressure"]
        : [],
  };
}

function deliveryBoundary() {
  return {
    delivery_performed: false,
    provider_contract_present: false,
    provider_specific_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
    local_fulfillment_is_external_delivery: false,
  };
}

function providerBoundary() {
  return {
    ...deliveryBoundary(),
    provider_specific_preview_is_delivery: false,
  };
}

function intentBoundary() {
  return {
    ...providerBoundary(),
    provider_delivery_intent_is_delivery: false,
  };
}

function readOnlyAuthority() {
  return {
    read_only: true,
    advisory_only: true,
    consolidation_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_memory: false,
    can_render_workbench_action_button: false,
  };
}

function assertNoForbiddenPureRuntime(label, text) {
  const forbidden = [
    "fetch(",
    'method: "POST"',
    "method: 'POST'",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "executeCodex",
    "email client",
    "slack client",
    "webhook client",
    "provider SDK",
    "setInterval",
    "setTimeout",
    "navigator.clipboard",
    "download behavior",
    "external_message_sent: true",
    "provider_called: true",
    "network_called: true",
    "delivery_performed: true",
    "INSERT INTO",
    "UPDATE",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
  ];
  for (const needle of forbidden) {
    assert(!text.includes(needle), `${label} must not include ${needle}`);
  }
}

function assertNoActionButtons(label, text) {
  assert(!/<button\b/i.test(text), `${label} must not render button`);
  for (const needle of [
    "onClick",
    "approve",
    "apply",
    "send",
    "copy",
    "export",
    "download",
    "clipboard",
  ]) {
    assert(!new RegExp(`onClick[^\\n]*${needle}`, "i").test(text));
  }
}

function agentDeliverySnippet(text) {
  const start = text.indexOf("buildDeliverySpineLoopClosureReadModelV01");
  const panel = text.indexOf("<DeliverySpineLoopClosurePanel");
  assert(start >= 0, "agent must build delivery spine loop closure");
  assert(panel >= 0, "agent must render delivery spine loop closure panel");
  return text.slice(Math.max(0, start - 1000), panel + 1000);
}
