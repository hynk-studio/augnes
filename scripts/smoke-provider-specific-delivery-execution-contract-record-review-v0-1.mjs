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
  scriptName:
    "smoke:provider-specific-delivery-execution-contract-record-review-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-provider-specific-delivery-execution-contract-record-review-v0-1.mjs",
});

const expectedFiles = [
  "types/provider-specific-delivery-execution-contract-record-review.ts",
  "lib/workplane/provider-specific-delivery-execution-contract-record-review.ts",
  "components/workplane/provider-specific-delivery-execution-contract-record-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-provider-specific-delivery-execution-contract-record-review-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 5)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "provider_specific_delivery_execution_contract_record_review_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get(
  "types/provider-specific-delivery-execution-contract-record-review.ts",
);
const helperText = textByFile.get(
  "lib/workplane/provider-specific-delivery-execution-contract-record-review.ts",
);
const panelText = textByFile.get(
  "components/workplane/provider-specific-delivery-execution-contract-record-review-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "provider_specific_delivery_execution_contract_record.v0.1",
  "provider_specific_delivery_execution_contract_record_review.v0.1",
  "recordable",
  "source_execution_contract_preview_fingerprint",
  "source_operator_decision_preview_fingerprint",
  "source_delivery_spine_fingerprint",
  "source_provider_specific_intent_contract_record_ref",
  "source_external_handoff_delivery_contract_record_ref",
  "source_exported_handoff_artifact_ref",
  "source_local_fulfillment_ref",
  "requested_execution_surface",
  "provider_profile_ref",
  "execution_profile_ref",
  "payload_hash",
  "payload_type",
  "payload_format",
  "delivery_performed: false",
  "execution_performed: false",
  "provider_called: false",
  "external_message_sent: false",
  "email_sent: false",
  "slack_sent: false",
  "webhook_called: false",
  "network_called: false",
  "can_write_db: false",
  "can_create_route: false",
  "can_send_handoff: false",
  "can_execute_delivery: false",
  "can_call_send_provider: false",
  "can_call_email: false",
  "can_call_slack: false",
  "can_call_webhook: false",
  "can_call_network: false",
  "can_write_clipboard: false",
  "can_download_file: false",
  "can_write_memory: false",
  "can_mutate_cwp: false",
  "can_mutate_handoff: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(typeText.includes("ProviderSpecificDeliveryExecutionContractRecordReview"));
assert(
  agentText.includes(
    "buildProviderSpecificDeliveryExecutionContractRecordReviewV01",
  ),
  "Agent Workplane must build provider-specific delivery execution contract record review",
);
assert(
  agentText.includes(
    "<ProviderSpecificDeliveryExecutionContractRecordReviewPanel",
  ),
  "Agent Workplane must render provider-specific delivery execution contract record review panel",
);
assertNoForbiddenPureRuntime("helper", helperText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoForbiddenPureRuntime("agent wiring", agentExecutionRecordSnippet(agentText));
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentExecutionRecordSnippet(agentText));

const {
  buildProviderSpecificDeliveryExecutionContractPreviewV01,
} = await import(
  "../lib/workplane/provider-specific-delivery-execution-contract-preview.ts"
);
const {
  buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/provider-specific-delivery-execution-operator-decision-preview.ts"
);
const {
  buildProviderSpecificDeliveryExecutionContractRecordReviewV01,
} = await import(
  "../lib/workplane/provider-specific-delivery-execution-contract-record-review.ts"
);

const readyPreview =
  buildProviderSpecificDeliveryExecutionContractPreviewV01(fullInput());
assert.equal(readyPreview.status, "ready_for_execution_contract_decision");
const readyDecision =
  buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
    provider_specific_delivery_execution_contract_preview: readyPreview,
    requested_operator_ref: "operator:delivery-execution-record-review",
    requested_idempotency_key:
      "idempotency:delivery-execution-contract-record-review",
    review_confirmation_ref:
      "review:delivery-execution-contract-record-review",
    operator_decision_intent:
      "prepare_future_execution_contract_record_slice",
  });
assert.equal(
  readyDecision.decision_status,
  "ready_for_execution_contract_design_review",
);
const readyReview = buildProviderSpecificDeliveryExecutionContractRecordReviewV01({
  provider_specific_delivery_execution_contract_preview: readyPreview,
  provider_specific_delivery_execution_operator_decision_preview: readyDecision,
  delivery_spine_loop_closure_read_model: deliverySpine(),
  provider_specific_delivery_intent_contract_record_review: intentRecordReview(),
  source_refs: ["source:execution-record-review-smoke"],
  evidence_refs: ["evidence:execution-record-review-smoke"],
});
assert.equal(readyReview.review_status, "recordable");
assert.equal(
  readyReview.source_execution_contract_preview_fingerprint,
  readyPreview.preview_fingerprint,
);
assert.equal(
  readyReview.source_operator_decision_preview_fingerprint,
  readyDecision.decision_preview_fingerprint,
);
assert.equal(
  readyReview.operator_gate_summary.operator_decision_matches_execution_preview,
  true,
);
assert.equal(readyReview.readiness_summary.recordable, true);
assert(readyReview.would_record_provider_specific_delivery_execution_contract_record);
assert.equal(
  readyReview
    .would_record_provider_specific_delivery_execution_contract_record
    .source_execution_contract_preview_fingerprint,
  readyPreview.preview_fingerprint,
);
assert.equal(
  readyReview
    .would_record_provider_specific_delivery_execution_contract_record
    .source_operator_decision_preview_fingerprint,
  readyDecision.decision_preview_fingerprint,
);
assertAllNonDeliveryFlagsFalse(readyReview.explicit_non_delivery_boundary);
assertAllAuthorityFlagsFalse(readyReview.authority_boundary);
assertAllNonDeliveryFlagsFalse(
  readyReview.would_record_provider_specific_delivery_execution_contract_record
    .explicit_non_delivery_boundary,
);
assertAllAuthorityFlagsFalse(
  readyReview.would_record_provider_specific_delivery_execution_contract_record
    .authority_boundary,
);
assertNoRawMaterialEmitted(readyReview);

const missingIntentPreview =
  buildProviderSpecificDeliveryExecutionContractPreviewV01({
    ...fullInput(),
    provider_specific_delivery_intent_contract_record_review: undefined,
  });
const missingIntentReview =
  buildProviderSpecificDeliveryExecutionContractRecordReviewV01({
    provider_specific_delivery_execution_contract_preview: missingIntentPreview,
    provider_specific_delivery_execution_operator_decision_preview:
      buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
        provider_specific_delivery_execution_contract_preview:
          missingIntentPreview,
      }),
  });
assert.notEqual(missingIntentReview.review_status, "recordable");
assert(
  missingIntentReview.blocker_reasons.some((reason) =>
    reason.includes("provider_specific_intent"),
  ),
);

const residualBlockedPreview =
  buildProviderSpecificDeliveryExecutionContractPreviewV01({
    ...fullInput(),
    residual_diagnostic_candidate_read_model: residualHard(),
  });
const residualBlockedReview =
  buildProviderSpecificDeliveryExecutionContractRecordReviewV01({
    provider_specific_delivery_execution_contract_preview:
      residualBlockedPreview,
    provider_specific_delivery_execution_operator_decision_preview:
      buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
        provider_specific_delivery_execution_contract_preview:
          residualBlockedPreview,
      }),
  });
assert.equal(residualBlockedReview.review_status, "residual_gate_blocked");

const lineageMismatchPreview =
  buildProviderSpecificDeliveryExecutionContractPreviewV01({
    ...fullInput(),
    provider_specific_external_delivery_preview_contract: providerPreview({
      previewFingerprint: "provider-preview-fp:other",
    }),
  });
const lineageMismatchReview =
  buildProviderSpecificDeliveryExecutionContractRecordReviewV01({
    provider_specific_delivery_execution_contract_preview:
      lineageMismatchPreview,
    provider_specific_delivery_execution_operator_decision_preview:
      buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
        provider_specific_delivery_execution_contract_preview:
          lineageMismatchPreview,
      }),
  });
assert.equal(lineageMismatchReview.review_status, "lineage_gate_blocked");

const unsafeConfigPreview =
  buildProviderSpecificDeliveryExecutionContractPreviewV01(
    fullInput({ executionProfileRef: "token:delivery-provider" }),
  );
const unsafeConfigReview =
  buildProviderSpecificDeliveryExecutionContractRecordReviewV01({
    provider_specific_delivery_execution_contract_preview: unsafeConfigPreview,
    provider_specific_delivery_execution_operator_decision_preview:
      buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
        provider_specific_delivery_execution_contract_preview:
          unsafeConfigPreview,
      }),
  });
assert.equal(unsafeConfigReview.review_status, "provider_config_gate_blocked");
assert(
  unsafeConfigReview.blocker_reasons.includes(
    "provider_config_gate:execution_profile_ref_unsafe",
  ),
);
assertAllNonDeliveryFlagsFalse(unsafeConfigReview.explicit_non_delivery_boundary);
assertAllAuthorityFlagsFalse(unsafeConfigReview.authority_boundary);

const forgedRawPreview = {
  ...readyPreview,
  provider_profile_ref: "provider-token-secret",
  execution_profile_ref: "https://example.invalid/provider-webhook",
  requested_recipient_ref: "recipient:raw-secret-token",
  payload_hash: "raw_payload:secret-report-body",
  payload_type: "raw_result_report_text",
  requested_payload_format: "raw_manual_note",
};
const forgedRawReview =
  buildProviderSpecificDeliveryExecutionContractRecordReviewV01({
    provider_specific_delivery_execution_contract_preview: forgedRawPreview,
    provider_specific_delivery_execution_operator_decision_preview:
      readyDecision,
  });
assert.notEqual(forgedRawReview.review_status, "recordable");
assertNoRawMaterialEmitted(forgedRawReview);

console.log(
  "smoke-provider-specific-delivery-execution-contract-record-review-v0-1: ok",
);

function fullInput(overrides = {}) {
  const surface = overrides.surface ?? "email_delivery_preview";
  const executionSurface =
    overrides.executionSurface ?? "email_delivery_execution_preview";
  const executionProfileRef =
    "executionProfileRef" in overrides
      ? overrides.executionProfileRef
      : "execution-profile:email:operator-managed";
  const providerProfileRef =
    "providerProfileRef" in overrides
      ? overrides.providerProfileRef
      : "provider-profile:email:operator-managed";
  const recipientRef =
    overrides.recipientRef ?? "recipient:email:operator-managed";
  const payloadFormat = overrides.payloadFormat ?? "markdown_payload";
  return {
    delivery_spine_loop_closure_read_model: deliverySpine(),
    provider_specific_delivery_intent_contract_preview: intentPreview({
      surface,
      providerProfileRef,
      recipientRef,
      payloadFormat,
    }),
    provider_specific_delivery_intent_operator_decision_preview:
      intentDecision(),
    provider_specific_delivery_intent_contract_record_review:
      intentRecordReview({
        surface,
        providerProfileRef,
        recipientRef,
        payloadFormat,
      }),
    provider_specific_external_delivery_preview_contract: providerPreview({
      surface,
      providerProfileRef,
      recipientRef,
      payloadFormat,
    }),
    residual_diagnostic_candidate_read_model: residualBoundaryPressureOnly(),
    requested_execution_surface: executionSurface,
    requested_execution_profile_ref: executionProfileRef,
    scope: "project:augnes",
    as_of: "2026-07-07T00:00:00.000Z",
    source_refs: ["source:execution-record-review-smoke"],
  };
}

function deliverySpine({ status = "provider_specific_intent_recorded" } = {}) {
  return {
    read_model_version: "delivery_spine_loop_closure_read_model.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-07T00:00:00.000Z",
    delivery_spine_status: status,
    source_refs: ["source:delivery-spine"],
    evidence_refs: ["evidence:delivery-spine"],
    stage_summary: {
      total_stage_count: 12,
      ready_stage_count: 4,
      recorded_stage_count: 1,
      blocked_stage_count: 0,
      invalid_stage_count: 0,
      missing_stage_count: 0,
      warning_stage_count: 0,
      future_execution_stage_status: "not_started",
    },
    blocker_summary: { count: 0, blockers: [] },
    warning_summary: { count: 0, warnings: [] },
    residual_gate_summary: residualGate("warning_only"),
    explicit_non_delivery_boundary: nonDeliveryBoundary(),
    authority_boundary: authorityBoundary(),
  };
}

function intentRecordReview({
  reviewStatus = "selected_record_found",
  surface = "email_delivery_preview",
  providerProfileRef = "provider-profile:email:operator-managed",
  recipientRef = "recipient:email:operator-managed",
  payloadFormat = "markdown_payload",
} = {}) {
  const summary = {
    record_id: "provider-specific-intent-record:001",
    created_at: "2026-07-07T00:00:00.000Z",
    source_provider_specific_preview_fingerprint: "provider-preview-fp:001",
    source_provider_specific_decision_fingerprint: "provider-decision-fp:001",
    source_external_handoff_delivery_contract_record_ref:
      "external-delivery-contract:001",
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    requested_provider_surface: surface,
    provider_profile_ref: providerProfileRef,
    requested_recipient_ref: recipientRef,
    requested_payload_format: payloadFormat,
    payload_hash: "sha256:execution-preview-payload",
    payload_type: "markdown_payload",
    intent_status:
      "recorded_as_provider_specific_delivery_intent_contract_candidate",
    delivery_performed: false,
    provider_called: false,
    external_message_sent: false,
    network_called: false,
    problem_reasons: [],
  };
  return {
    review_version:
      "provider_specific_delivery_intent_contract_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-07T00:00:00.000Z",
    review_status: reviewStatus,
    selected_record_summary: reviewStatus === "records_invalid" ? null : summary,
    latest_record_summary: reviewStatus === "records_invalid" ? null : summary,
    record_summaries: reviewStatus === "records_invalid" ? [] : [summary],
    input_summary: {
      supplied_record_count: 1,
      valid_record_count: reviewStatus === "records_invalid" ? 0 : 1,
      invalid_record_count: reviewStatus === "records_invalid" ? 1 : 0,
      selected_record_id: "provider-specific-intent-record:001",
      selected_record_found: reviewStatus !== "records_invalid",
    },
    evidence_summary: {
      has_valid_records: reviewStatus !== "records_invalid",
      provider_surfaces: [surface],
      provider_profile_refs: providerProfileRef ? [providerProfileRef] : [],
      requested_recipient_refs: [recipientRef],
      payload_hashes: ["sha256:execution-preview-payload"],
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
      network_called: false,
    },
    blocked_reasons:
      reviewStatus === "records_invalid" ? ["records_invalid"] : [],
    insufficient_data_reasons: [],
    source_refs: ["source:intent-record-review"],
    records:
      reviewStatus === "records_invalid"
        ? []
        : [
            {
              record_id: "provider-specific-intent-record:001",
              source_intent_contract_preview_fingerprint: "intent-preview-fp:001",
              source_operator_decision_fingerprint: "intent-decision-fp:001",
              source_provider_specific_preview_fingerprint:
                "provider-preview-fp:001",
              source_provider_specific_decision_fingerprint:
                "provider-decision-fp:001",
              source_external_handoff_delivery_contract_record_ref:
                "external-delivery-contract:001",
              source_local_fulfillment_ref: "handoff-send-record:001",
              source_handoff_send_contract_record_ref:
                "handoff-send-contract:001",
              source_exported_artifact_ref: "handoff-packet-artifact:001",
              requested_provider_surface: surface,
              provider_profile_ref: providerProfileRef,
              requested_recipient_ref: recipientRef,
              requested_payload_format: payloadFormat,
              payload_hash: "sha256:execution-preview-payload",
              payload_type: "markdown_payload",
              external_delivery_boundary: nonDeliveryBoundary(),
            },
          ],
    authority_boundary: authorityBoundary(),
  };
}

function providerPreview({
  surface = "email_delivery_preview",
  providerProfileRef = "provider-profile:email:operator-managed",
  recipientRef = "recipient:email:operator-managed",
  payloadFormat = "markdown_payload",
  previewFingerprint = "provider-preview-fp:001",
} = {}) {
  return {
    preview_version: "provider_specific_external_delivery_preview_contract.v0.1",
    preview_fingerprint: previewFingerprint,
    scope: "project:augnes",
    as_of: "2026-07-07T00:00:00.000Z",
    status: "ready_for_provider_specific_decision",
    requested_provider_surface: surface,
    provider_profile_ref: providerProfileRef,
    source_external_handoff_delivery_contract_record_ref:
      "external-delivery-contract:001",
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    requested_recipient_ref: recipientRef,
    requested_payload_format: payloadFormat,
    payload_hash: "sha256:execution-preview-payload",
    payload_type: "markdown_payload",
    residual_gate_summary: residualGate("warning_only"),
    external_delivery_boundary: nonDeliveryBoundary(),
    authority_boundary: authorityBoundary(),
    source_refs: ["source:provider-preview"],
    evidence_refs: ["evidence:provider-preview"],
  };
}

function intentPreview({
  surface = "email_delivery_preview",
  providerProfileRef = "provider-profile:email:operator-managed",
  recipientRef = "recipient:email:operator-managed",
  payloadFormat = "markdown_payload",
} = {}) {
  return {
    preview_version: "provider_specific_delivery_intent_contract_preview.v0.1",
    preview_fingerprint: "intent-preview-fp:001",
    scope: "project:augnes",
    as_of: "2026-07-07T00:00:00.000Z",
    status: "ready_for_intent_decision",
    source_provider_specific_preview_fingerprint: "provider-preview-fp:001",
    source_provider_specific_decision_fingerprint: "provider-decision-fp:001",
    source_external_handoff_delivery_contract_record_ref:
      "external-delivery-contract:001",
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    requested_provider_surface: surface,
    provider_profile_ref: providerProfileRef,
    requested_recipient_ref: recipientRef,
    requested_payload_format: payloadFormat,
    payload_hash: "sha256:execution-preview-payload",
    payload_type: "markdown_payload",
    residual_gate_summary: residualGate("warning_only"),
    external_delivery_boundary: nonDeliveryBoundary(),
    authority_boundary: authorityBoundary(),
    source_refs: ["source:intent-preview"],
    evidence_refs: ["evidence:intent-preview"],
  };
}

function intentDecision() {
  return {
    decision_preview_version:
      "provider_specific_delivery_intent_operator_decision_preview.v0.1",
    decision_preview_fingerprint: "intent-decision-fp:001",
    scope: "project:augnes",
    decision_status:
      "ready_for_provider_specific_delivery_intent_contract_record_write",
    recommended_operator_decision:
      "record_provider_specific_delivery_intent_contract_candidate",
    blocker_reasons: [],
    write_readiness: {
      write_ready: true,
      current_blockers: [],
      current_missing_evidence: [],
    },
    authority_boundary: authorityBoundary(),
  };
}

function residualHard() {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    residual_candidates: [
      {
        candidate_id: "candidate:authority",
        category: "authority_boundary_drift",
        status: "actionable_candidate",
        severity: "high",
        observed_signals: [{ summary: "can_call_send_provider present" }],
      },
    ],
  };
}

function residualBoundaryPressureOnly() {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    residual_candidates: [
      {
        candidate_id: "candidate:boundary-pressure",
        category: "external_delivery_boundary_pressure",
        status: "candidate",
        severity: "medium",
        observed_signals: [{ summary: "external_delivery_not_configured" }],
      },
    ],
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

function nonDeliveryBoundary() {
  return {
    delivery_performed: false,
    external_delivery_performed: false,
    execution_performed: false,
    provider_specific_delivery: false,
    provider_delivery_intent_is_delivery: false,
    provider_execution_preview_is_delivery: false,
    provider_execution_contract_is_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
    local_fulfillment_is_external_delivery: false,
    external_contract_is_delivery: false,
    provider_specific_preview_is_delivery: false,
    provider_specific_intent_is_delivery: false,
    execution_contract_preview_exists: false,
  };
}

function authorityBoundary() {
  return {
    read_only: true,
    advisory_only: true,
    execution_preview_only: true,
    can_write_db: false,
    can_create_schema: false,
    can_create_route: false,
    can_send_handoff: false,
    can_execute_delivery: false,
    can_call_send_provider: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_memory: false,
    can_mutate_cwp: false,
    can_mutate_handoff: false,
    can_mutate_residual: false,
    can_mutate_external_contract: false,
    can_mutate_provider_intent: false,
    can_mutate_delivery_spine_loop_closure: false,
    can_render_workbench_action_button: false,
  };
}

function assertAllNonDeliveryFlagsFalse(boundary) {
  for (const field of [
    "delivery_performed",
    "execution_performed",
    "provider_called",
    "external_message_sent",
    "email_sent",
    "slack_sent",
    "webhook_called",
    "network_called",
  ]) {
    assert.equal(boundary[field], false, `${field} must remain false`);
  }
}

function assertAllAuthorityFlagsFalse(boundary) {
  for (const field of [
    "can_write_db",
    "can_create_route",
    "can_send_handoff",
    "can_execute_delivery",
    "can_call_send_provider",
    "can_call_email",
    "can_call_slack",
    "can_call_webhook",
    "can_call_network",
    "can_write_clipboard",
    "can_download_file",
    "can_write_memory",
    "can_mutate_cwp",
    "can_mutate_handoff",
    "can_render_workbench_action_button",
  ]) {
    assert.equal(boundary[field], false, `${field} must remain false`);
  }
}

function assertNoRawMaterialEmitted(value) {
  const text = JSON.stringify(value);
  for (const forbidden of [
    "raw_payload:secret-report-body",
    "recipient:raw-secret-token",
    "provider-token-secret",
    "raw_manual_note",
    "raw_result_report_text",
    "https://example.invalid/provider-webhook",
  ]) {
    assert(!text.includes(forbidden), `raw material emitted: ${forbidden}`);
  }
}

function assertNoForbiddenPureRuntime(label, text) {
  for (const forbidden of [
    "fetch(",
    'method: "POST"',
    "method: 'POST'",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "executeCodex",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "new Database",
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "navigator.clipboard",
    "download(",
    "downloadFile",
    "window.open",
  ]) {
    assert(!text.includes(forbidden), `${label} contains forbidden ${forbidden}`);
  }
}

function assertNoActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not add buttons`);
  assert(
    !text.includes("can_render_workbench_action_button: true"),
    `${label} must not render execution action buttons`,
  );
}

function agentExecutionRecordSnippet(agentText) {
  const start = agentText.indexOf(
    "const providerSpecificDeliveryExecutionContractPreview",
  );
  const end =
    agentText.indexOf(
      "<ProviderSpecificDeliveryExecutionContractRecordReviewPanel",
    ) + 240;
  assert(start >= 0, "missing execution contract preview agent snippet start");
  assert(end > start, "missing execution contract record review panel snippet");
  return agentText.slice(start, end);
}
