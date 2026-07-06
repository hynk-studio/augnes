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
  scriptName: "smoke:provider-specific-delivery-execution-contract-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-provider-specific-delivery-execution-contract-preview-v0-1.mjs",
});

const expectedFiles = [
  "types/provider-specific-delivery-execution-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-execution-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-execution-operator-decision-preview.ts",
  "components/workplane/provider-specific-delivery-execution-contract-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-provider-specific-delivery-execution-contract-preview-v0-1.mjs",
  "types/delivery-spine-loop-closure.ts",
  "lib/workplane/delivery-spine-loop-closure.ts",
  "components/workplane/delivery-spine-loop-closure-panel.tsx",
  "scripts/smoke-delivery-spine-loop-closure-v0-1.mjs",
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
  "scripts/smoke-residual-diagnostic-candidate-v0-1.mjs",
  "scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
  "scripts/smoke-handoff-send-slice-v0-1.mjs",
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 6)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "provider_specific_delivery_execution_contract_preview_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get(
  "types/provider-specific-delivery-execution-contract-preview.ts",
);
const helperText = textByFile.get(
  "lib/workplane/provider-specific-delivery-execution-contract-preview.ts",
);
const decisionText = textByFile.get(
  "lib/workplane/provider-specific-delivery-execution-operator-decision-preview.ts",
);
const panelText = textByFile.get(
  "components/workplane/provider-specific-delivery-execution-contract-preview-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "provider_specific_delivery_execution_contract_preview.v0.1",
  "provider_specific_delivery_execution_operator_decision_preview.v0.1",
  "manual_operator_delivery_execution_preview",
  "email_delivery_execution_preview",
  "slack_delivery_execution_preview",
  "webhook_delivery_execution_preview",
  "ready_for_execution_contract_decision",
  "prepare_future_execution_contract_record_slice",
  "provider_execution_preview_is_delivery: false",
  "provider_execution_contract_is_delivery: false",
  "delivery_performed: false",
  "execution_performed: false",
  "provider_called: false",
  "external_message_sent: false",
  "network_called: false",
  "can_execute_delivery: false",
  "can_call_send_provider: false",
  "can_call_network: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(agentText.includes("buildProviderSpecificDeliveryExecutionContractPreviewV01"));
assert(agentText.includes("<ProviderSpecificDeliveryExecutionContractPreviewPanel"));
assertNoForbiddenPureRuntime("helper", helperText);
assertNoForbiddenPureRuntime("decision", decisionText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoForbiddenPureRuntime("agent", agentExecutionSnippet(agentText));
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent", agentExecutionSnippet(agentText));

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

const empty = buildProviderSpecificDeliveryExecutionContractPreviewV01({});
assert.equal(empty.status, "delivery_spine_missing");
assert.equal(empty.explicit_non_delivery_boundary.delivery_performed, false);
assert.equal(empty.explicit_non_delivery_boundary.execution_performed, false);
const emptyDecision =
  buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
    provider_specific_delivery_execution_contract_preview: empty,
  });
assert.notEqual(
  emptyDecision.recommended_operator_decision,
  "prepare_future_execution_contract_record_slice",
);

const noSpine = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  delivery_spine_loop_closure_read_model: undefined,
});
assert.equal(noSpine.status, "delivery_spine_missing");

const spineNotReady = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  delivery_spine_loop_closure_read_model: deliverySpine({
    status: "local_fulfillment_available",
  }),
});
assert.equal(spineNotReady.status, "delivery_spine_not_ready");

const manual = buildProviderSpecificDeliveryExecutionContractPreviewV01(
  fullInput({
    surface: "manual_operator_delivery",
    recipientRef: "recipient:operator",
    executionSurface: "manual_operator_delivery_execution_preview",
    executionProfileRef: undefined,
    providerProfileRef: null,
  }),
);
assert.equal(manual.status, "ready_for_execution_contract_decision");
assert.equal(manual.provider_config_gate_summary.config_runtime_verified, false);
assert.equal(manual.provider_config_gate_summary.provider_call_tested, false);
assert.equal(manual.explicit_non_delivery_boundary.provider_called, false);
assert.equal(manual.explicit_non_delivery_boundary.network_called, false);
assert.equal(manual.explicit_non_delivery_boundary.execution_performed, false);
const manualDecision =
  buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
    provider_specific_delivery_execution_contract_preview: manual,
    requested_operator_ref: "operator:delivery-execution-review",
    requested_idempotency_key: "idempotency:delivery-execution-preview",
    review_confirmation_ref: "review:delivery-execution-preview",
    operator_decision_intent:
      "prepare_future_execution_contract_record_slice",
  });
assert.equal(
  manualDecision.decision_status,
  "ready_for_execution_contract_design_review",
);
assert.equal(
  manualDecision.recommended_operator_decision,
  "prepare_future_execution_contract_record_slice",
);

for (const readyCase of [
  {
    surface: "email_delivery_preview",
    executionSurface: "email_delivery_execution_preview",
    executionProfileRef: "execution-profile:email:operator-managed",
    providerProfileRef: "provider-profile:email:operator-managed",
    recipientRef: "recipient:email:operator-managed",
  },
  {
    surface: "slack_delivery_preview",
    executionSurface: "slack_delivery_execution_preview",
    executionProfileRef: "execution-profile:slack:operator-managed",
    providerProfileRef: "provider-profile:slack:operator-managed",
    recipientRef: "recipient:slack-channel:ops",
  },
  {
    surface: "webhook_delivery_preview",
    executionSurface: "webhook_delivery_execution_preview",
    executionProfileRef: "execution-profile:webhook:operator-managed",
    providerProfileRef: "provider-profile:webhook:operator-managed",
    recipientRef: "endpoint-ref:webhook:operator-managed",
  },
]) {
  const ready = buildProviderSpecificDeliveryExecutionContractPreviewV01(
    fullInput(readyCase),
  );
  assert.equal(ready.status, "ready_for_execution_contract_decision");
  assert.equal(ready.provider_config_gate_summary.config_runtime_verified, false);
  assert.equal(ready.provider_config_gate_summary.provider_call_tested, false);
  assert.equal(ready.explicit_non_delivery_boundary.provider_called, false);
}

for (const surfaceCase of [
  ["email_delivery_preview", "email_delivery_execution_preview"],
  ["slack_delivery_preview", "slack_delivery_execution_preview"],
  ["webhook_delivery_preview", "webhook_delivery_execution_preview"],
]) {
  const missing = buildProviderSpecificDeliveryExecutionContractPreviewV01(
    fullInput({
      surface: surfaceCase[0],
      executionSurface: surfaceCase[1],
      executionProfileRef: undefined,
    }),
  );
  assert.equal(missing.status, "provider_config_missing");
  assert(missing.blocker_reasons.includes("execution_profile_ref_missing"));
  const missingDecision =
    buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
      provider_specific_delivery_execution_contract_preview: missing,
      requested_operator_ref: "operator:delivery-execution-review",
      requested_idempotency_key: "idempotency:delivery-execution-preview",
      review_confirmation_ref: "review:delivery-execution-preview",
    });
  assert.equal(missingDecision.decision_status, "execution_preview_not_ready");
  assert.equal(
    missingDecision.recommended_operator_decision,
    "resolve_provider_config_refs_first",
  );
}

for (const unsafe of [
  "token:abc",
  "secret:abc",
  "password:abc",
  "api_key:abc",
  "bearer abc",
  "https://example.invalid/hook",
  "env:DELIVERY_TOKEN",
  "process.env.DELIVERY_TOKEN",
  ".env:DELIVERY_TOKEN",
]) {
  const blocked = buildProviderSpecificDeliveryExecutionContractPreviewV01(
    fullInput({ executionProfileRef: unsafe }),
  );
  assert.equal(blocked.status, "provider_config_ref_unsafe");
  assert(blocked.blocker_reasons.includes("execution_profile_ref_unsafe"));
  const blockedDecision =
    buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
      provider_specific_delivery_execution_contract_preview: blocked,
      requested_operator_ref: "operator:delivery-execution-review",
      requested_idempotency_key: "idempotency:delivery-execution-preview",
      review_confirmation_ref: "review:delivery-execution-preview",
    });
  assert.equal(blockedDecision.decision_status, "execution_preview_not_ready");
  assert.equal(
    blockedDecision.recommended_operator_decision,
    "resolve_provider_config_refs_first",
  );
}

const unsupportedExecutionSurface =
  buildProviderSpecificDeliveryExecutionContractPreviewV01(
    fullInput({ executionSurface: "unsupported_execution_surface" }),
  );
assert.equal(unsupportedExecutionSurface.status, "execution_surface_unsupported");
assert(
  unsupportedExecutionSurface.blocker_reasons.includes(
    "requested_execution_surface_unsupported",
  ),
);
assert.equal(unsupportedExecutionSurface.requested_execution_surface, null);
assert.equal(
  unsupportedExecutionSurface.explicit_non_delivery_boundary.delivery_performed,
  false,
);

const unsafeExecutionSurface =
  buildProviderSpecificDeliveryExecutionContractPreviewV01(
    fullInput({ executionSurface: "https://example.invalid/execution" }),
  );
assert.equal(unsafeExecutionSurface.status, "execution_surface_unsupported");
assert(
  unsafeExecutionSurface.blocker_reasons.includes(
    "requested_execution_surface_unsafe",
  ),
);
assert.equal(unsafeExecutionSurface.requested_execution_surface, null);
assert.equal(
  unsafeExecutionSurface.explicit_non_delivery_boundary.provider_called,
  false,
);

const surfaceMismatch = buildProviderSpecificDeliveryExecutionContractPreviewV01(
  fullInput({
    surface: "email_delivery_preview",
    executionSurface: "email_delivery_execution_preview",
    executionProfileRef: "execution-profile:slack:operator-managed",
    providerProfileRef: "provider-profile:email:operator-managed",
    recipientRef: "recipient:email:operator-managed",
  }),
);
assert.notEqual(
  surfaceMismatch.status,
  "ready_for_execution_contract_decision",
);
assert(surfaceMismatch.blocker_reasons.includes("execution_profile_ref_surface_mismatch"));

const providerMismatch = buildProviderSpecificDeliveryExecutionContractPreviewV01(
  fullInput({
    surface: "slack_delivery_preview",
    executionSurface: "slack_delivery_execution_preview",
    executionProfileRef: "execution-profile:slack:operator-managed",
    providerProfileRef: "provider-profile:email:operator-managed",
    recipientRef: "recipient:slack-channel:ops",
  }),
);
assert(providerMismatch.blocker_reasons.includes("provider_profile_ref_surface_mismatch"));

const recipientMismatch = buildProviderSpecificDeliveryExecutionContractPreviewV01(
  fullInput({
    surface: "webhook_delivery_preview",
    executionSurface: "webhook_delivery_execution_preview",
    executionProfileRef: "execution-profile:webhook:operator-managed",
    providerProfileRef: "provider-profile:webhook:operator-managed",
    recipientRef: "recipient:email:operator-managed",
  }),
);
assert(recipientMismatch.blocker_reasons.includes("requested_recipient_ref_surface_mismatch"));

const unsafeRecipient = buildProviderSpecificDeliveryExecutionContractPreviewV01(
  fullInput({ recipientRef: "raw_message:hello" }),
);
assert.equal(unsafeRecipient.status, "recipient_ref_unsafe");

const unsafePayload = buildProviderSpecificDeliveryExecutionContractPreviewV01(
  fullInput({ payloadFormat: "raw_payload:hello" }),
);
assert.equal(unsafePayload.status, "payload_ref_unsafe");

for (const missingRequirement of [
  {
    field: "source_local_fulfillment_ref",
    missingRef: "local_handoff_send_fulfillment_ref_missing",
    satisfiedRequirement: "local_handoff_send_fulfillment",
  },
  {
    field: "source_external_handoff_delivery_contract_record_ref",
    missingRef: "external_handoff_delivery_contract_record_ref_missing",
    satisfiedRequirement: "external_handoff_delivery_contract_record",
  },
  {
    field: "source_exported_artifact_ref",
    missingRef: "exported_handoff_packet_artifact_ref_missing",
    satisfiedRequirement: "exported_handoff_packet_artifact",
  },
]) {
  const missingInput = removeIntentSourceRef(fullInput(), missingRequirement.field);
  const missingPreview =
    buildProviderSpecificDeliveryExecutionContractPreviewV01(missingInput);
  assert.notEqual(
    missingPreview.status,
    "ready_for_execution_contract_decision",
  );
  assert(
    missingPreview.provider_execution_requirement_summary.missing_refs.includes(
      missingRequirement.missingRef,
    ),
  );
  assert(
    !missingPreview.provider_execution_requirement_summary.satisfied_requirements.includes(
      missingRequirement.satisfiedRequirement,
    ),
  );
}

const forgedBoundary = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  delivery_spine_loop_closure_read_model: {
    ...deliverySpine(),
    explicit_non_delivery_boundary: {
      ...nonDeliveryBoundary(),
      provider_called: true,
    },
  },
});
assert.equal(forgedBoundary.status, "execution_boundary_blocked");

const invalidIntent = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  provider_specific_delivery_intent_contract_record_review:
    intentRecordReview({ reviewStatus: "records_invalid" }),
});
assert.equal(invalidIntent.status, "provider_specific_intent_invalid");

const missingIntent = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  provider_specific_delivery_intent_contract_record_review: undefined,
});
assert.equal(missingIntent.status, "provider_specific_intent_missing");

const lineageMismatch = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  provider_specific_external_delivery_preview_contract: providerPreview({
    previewFingerprint: "provider-preview-fp:other",
  }),
});
assert.equal(lineageMismatch.status, "lineage_gate_blocked");

const residualBlocked = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  residual_diagnostic_candidate_read_model: residualHard(),
});
assert.equal(residualBlocked.status, "residual_gate_blocked");

const residualWarning = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  residual_diagnostic_candidate_read_model: residualBoundaryPressureOnly(),
});
assert.equal(residualWarning.residual_gate_summary.gate_status, "warning_only");
assert.equal(residualWarning.status, "ready_for_execution_contract_decision");

const authorityBlocked = buildProviderSpecificDeliveryExecutionContractPreviewV01({
  ...fullInput(),
  delivery_spine_loop_closure_read_model: {
    ...deliverySpine(),
    authority_boundary: {
      ...authorityBoundary(),
      can_call_send_provider: true,
    },
  },
});
assert.equal(authorityBlocked.status, "authority_boundary_blocked");
assert.equal(authorityBlocked.authority_boundary.can_call_send_provider, false);

const missingDecisionEvidence =
  buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
    provider_specific_delivery_execution_contract_preview: manual,
    requested_operator_ref: "operator:delivery-execution-review",
    review_confirmation_ref: "review:delivery-execution-preview",
  });
assert.equal(
  missingDecisionEvidence.decision_status,
  "operator_evidence_missing",
);

const missingReviewConfirmation =
  buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01({
    provider_specific_delivery_execution_contract_preview: manual,
    requested_operator_ref: "operator:delivery-execution-review",
    requested_idempotency_key: "idempotency:delivery-execution-preview",
  });
assert.equal(
  missingReviewConfirmation.decision_status,
  "review_confirmation_missing",
);

console.log(
  "smoke-provider-specific-delivery-execution-contract-preview-v0-1: ok",
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
    source_refs: ["source:execution-preview-smoke"],
  };
}

function removeIntentSourceRef(input, field) {
  const cloned = structuredClone(input);
  const review =
    cloned.provider_specific_delivery_intent_contract_record_review;
  delete review.selected_record_summary[field];
  delete review.latest_record_summary[field];
  for (const summary of review.record_summaries) {
    delete summary[field];
  }
  for (const record of review.records) {
    delete record[field];
  }
  delete cloned.provider_specific_delivery_intent_contract_preview[field];
  delete cloned.provider_specific_external_delivery_preview_contract[field];
  return cloned;
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
    "execution_performed: true",
    "INSERT INTO",
    "UPDATE",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
  ]) {
    assert(!text.includes(forbidden), `${label} includes forbidden ${forbidden}`);
  }
}

function assertNoActionButtons(label, text) {
  assert(!/<button[\s>]/i.test(text), `${label} must not render button`);
  assert(!/onClick\s*=/.test(text), `${label} must not include onClick`);
  for (const forbidden of [
    "approve",
    "write",
    "apply",
    "send",
    "copy",
    "export",
    "download",
    "clipboard",
  ]) {
    assert(
      !new RegExp(`onClick[^\\n]*${forbidden}`, "i").test(text),
      `${label} includes forbidden action handler ${forbidden}`,
    );
  }
}

function agentExecutionSnippet(text) {
  const start = text.indexOf("buildProviderSpecificDeliveryExecutionContractPreviewV01");
  const panel = text.indexOf("<ProviderSpecificDeliveryExecutionContractPreviewPanel");
  assert(start >= 0, "missing execution preview builder in AgentWorkplane");
  assert(panel > start, "missing execution preview panel in AgentWorkplane");
  return text.slice(start, panel + 500);
}
