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
  scriptName: "smoke:provider-specific-delivery-intent-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-provider-specific-delivery-intent-contract-v0-1.mjs",
});

const expectedFiles = [
  "types/provider-specific-delivery-intent-contract.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-operator-decision-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-write.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-record-review.ts",
  "lib/workplane/read-provider-specific-delivery-intent-contract-record-review-for-web.ts",
  "components/workplane/provider-specific-delivery-intent-contract-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-provider-specific-delivery-intent-contract-v0-1.mjs",
  "types/delivery-spine-loop-closure.ts",
  "lib/workplane/delivery-spine-loop-closure.ts",
  "components/workplane/delivery-spine-loop-closure-panel.tsx",
  "scripts/smoke-delivery-spine-loop-closure-v0-1.mjs",
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
  "scripts/smoke-external-handoff-delivery-contract-v0-1.mjs",
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
  label: "provider_specific_delivery_intent_contract_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get(
  "types/provider-specific-delivery-intent-contract.ts",
);
const previewText = textByFile.get(
  "lib/workplane/provider-specific-delivery-intent-contract-preview.ts",
);
const decisionText = textByFile.get(
  "lib/workplane/provider-specific-delivery-intent-operator-decision-preview.ts",
);
const writeText = textByFile.get(
  "lib/workplane/provider-specific-delivery-intent-contract-write.ts",
);
const reviewText = textByFile.get(
  "lib/workplane/provider-specific-delivery-intent-contract-record-review.ts",
);
const readText = textByFile.get(
  "lib/workplane/read-provider-specific-delivery-intent-contract-record-review-for-web.ts",
);
const panelText = textByFile.get(
  "components/workplane/provider-specific-delivery-intent-contract-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "provider_specific_delivery_intent_contract_preview.v0.1",
  "provider_specific_delivery_intent_operator_decision_preview.v0.1",
  "provider_specific_delivery_intent_contract_record.v0.1",
  "provider_specific_delivery_intent_contract_receipt.v0.1",
  "provider_specific_delivery_intent_contract_store.v0.1",
  "provider_specific_delivery_intent_contract_record_review.v0.1",
  "ready_for_intent_decision",
  "record_provider_specific_delivery_intent_contract_candidate",
  "provider_delivery_intent_is_delivery: false",
  "delivery_performed: false",
  "provider_called: false",
  "external_message_sent: false",
  "email_sent: false",
  "slack_sent: false",
  "webhook_called: false",
  "network_called: false",
  "can_send_handoff: false",
  "can_call_send_provider: false",
  "can_call_email: false",
  "can_call_slack: false",
  "can_call_webhook: false",
  "can_call_network: false",
  "can_write_clipboard: false",
  "can_download_file: false",
  "can_write_memory: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(
  agentText.includes("buildProviderSpecificDeliveryIntentContractPreviewV01"),
  "Agent Workplane must build provider-specific delivery intent preview",
);
assert(
  agentText.includes("<ProviderSpecificDeliveryIntentContractPanel"),
  "Agent Workplane must render provider-specific delivery intent panel",
);
assertNoForbiddenPureRuntime("preview", previewText);
assertNoForbiddenPureRuntime("decision", decisionText);
assertNoForbiddenPureRuntime("review", reviewText);
assertNoForbiddenPureRuntime("read helper", readText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentIntentSnippet(agentText));
assertScopedIntentWriteOnly(writeText);

const {
  buildProviderSpecificExternalDeliveryPreviewContractV01,
} = await import(
  "../lib/workplane/provider-specific-external-delivery-preview-contract.ts"
);
const {
  buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts"
);
const {
  buildProviderSpecificDeliveryIntentContractPreviewV01,
} = await import(
  "../lib/workplane/provider-specific-delivery-intent-contract-preview.ts"
);
const {
  buildProviderSpecificDeliveryIntentOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/provider-specific-delivery-intent-operator-decision-preview.ts"
);
const writeLib = await import(
  "../lib/workplane/provider-specific-delivery-intent-contract-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/provider-specific-delivery-intent-contract-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-provider-specific-delivery-intent-contract-record-review-for-web.ts"
);

const externalPreview = externalContractPreview();
const externalRecordReview = externalContractRecordReview();
const residual = residualBoundaryPressureOnly();

const manual = buildReadyIntent({
  surface: "manual_operator_delivery",
  recipientRef: "recipient:operator",
});
assert.equal(manual.intentPreview.status, "ready_for_intent_decision");
assert.equal(manual.intentPreview.residual_gate_summary.gate_status, "warning_only");
assert(
  manual.intentPreview.warning_reasons.includes(
    "residual_candidate_warning:external_delivery_boundary_pressure",
  ),
);
assert.equal(
  manual.intentDecision.decision_status,
  "ready_for_provider_specific_delivery_intent_contract_record_write",
);
assert.equal(
  manual.intentDecision.recommended_operator_decision,
  "record_provider_specific_delivery_intent_contract_candidate",
);
const db = new Database(":memory:");
const writeInput = intentWriteInput(manual.intentDecision);
const written = writeLib.writeProviderSpecificDeliveryIntentContractRecordV01(
  writeInput,
  { db },
);
assert.equal(
  written.status,
  "written",
  JSON.stringify(written.receipt.refusal_reasons),
);
assert.equal(written.record.intent_status, "recorded_as_provider_specific_delivery_intent_contract_candidate");
assert.equal(written.record.external_delivery_boundary.delivery_performed, false);
assert.equal(written.record.external_delivery_boundary.provider_called, false);
assert.equal(written.record.external_delivery_boundary.external_message_sent, false);
assert.equal(written.record.external_delivery_boundary.network_called, false);
assert.equal(written.receipt.delivery_performed, false);
assert.equal(written.receipt.provider_called, false);
assert.equal(written.receipt.external_message_sent, false);
assert.equal(written.receipt.network_called, false);
const replay = writeLib.writeProviderSpecificDeliveryIntentContractRecordV01(
  writeInput,
  { db },
);
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);

for (const readyCase of [
  {
    surface: "email_delivery_preview",
    profileRef: "provider-profile:email:operator-managed",
    recipientRef: "recipient:email:operator-managed",
  },
  {
    surface: "slack_delivery_preview",
    profileRef: "provider-profile:slack:operator-managed",
    recipientRef: "recipient:slack-channel:ops",
  },
  {
    surface: "webhook_delivery_preview",
    profileRef: "provider-profile:webhook:operator-managed",
    recipientRef: "endpoint-ref:webhook:operator-managed",
  },
]) {
  const ready = buildReadyIntent(readyCase);
  assert.equal(ready.providerPreview.status, "ready_for_provider_specific_decision");
  assert.equal(ready.intentPreview.status, "ready_for_intent_decision");
  assert.equal(ready.intentPreview.external_delivery_boundary.provider_called, false);
  assert.equal(ready.intentPreview.external_delivery_boundary.network_called, false);
}

const recordReviewOnlyIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase({ includeExternalPreview: false }),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview:
    manual.providerDecision,
});
assert.equal(recordReviewOnlyIntent.status, "ready_for_intent_decision");
assert.notEqual(
  recordReviewOnlyIntent
    .would_write_provider_specific_delivery_intent_contract_record_preview,
  null,
);
assert(
  !recordReviewOnlyIntent.blocker_reasons.includes(
    "external_contract_preview_external_delivery_boundary_missing",
  ),
);
assert.equal(recordReviewOnlyIntent.external_delivery_boundary.delivery_performed, false);
assert.equal(recordReviewOnlyIntent.external_delivery_boundary.provider_called, false);
assert.equal(
  recordReviewOnlyIntent.external_delivery_boundary.external_message_sent,
  false,
);
assert.equal(recordReviewOnlyIntent.external_delivery_boundary.network_called, false);

const missingProviderPreview = buildProviderSpecificDeliveryIntentContractPreviewV01({
  provider_specific_external_delivery_operator_decision_preview:
    manual.providerDecision,
  external_handoff_delivery_contract_preview: externalPreview,
  external_handoff_delivery_contract_record_review: externalRecordReview,
  residual_diagnostic_candidate_read_model: residual,
});
assert.equal(missingProviderPreview.status, "provider_specific_preview_missing");
assert.equal(
  missingProviderPreview
    .would_write_provider_specific_delivery_intent_contract_record_preview,
  null,
);

const notReadyProviderPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
  external_handoff_delivery_contract_preview: externalPreview,
  external_handoff_delivery_contract_record_review: externalRecordReview,
  residual_diagnostic_candidate_read_model: residual,
  requested_provider_surface: "email_delivery_preview",
  requested_recipient_ref: "recipient:email:operator-managed",
  requested_payload_format: "markdown_payload",
});
assert.equal(notReadyProviderPreview.status, "provider_profile_missing");
const notReadyIntentPreview = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase(),
  provider_specific_external_delivery_preview_contract: notReadyProviderPreview,
});
assert.equal(notReadyIntentPreview.status, "provider_specific_preview_not_ready");

const missingDecisionPreview = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase(),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
});
assert.equal(missingDecisionPreview.status, "provider_specific_decision_missing");
const notReadyDecision = buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01({
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  requested_operator_ref: "operator:provider-specific-preview",
});
const notReadyDecisionIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase(),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview: notReadyDecision,
});
assert.equal(notReadyDecisionIntent.status, "provider_specific_decision_not_ready");

const decisionWithoutNextStep = { ...manual.providerDecision };
delete decisionWithoutNextStep.next_step_readiness;
const missingNextStepIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase(),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview:
    decisionWithoutNextStep,
});
assert.equal(missingNextStepIntent.status, "provider_specific_decision_not_ready");
assert(
  missingNextStepIntent.blocker_reasons.includes(
    "provider_specific_decision_next_step_readiness_missing",
  ),
);

const nextStepNotReadyIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase(),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview: {
    ...manual.providerDecision,
    next_step_readiness: {
      ...manual.providerDecision.next_step_readiness,
      ready_for_operator_review: false,
    },
  },
});
assert.equal(nextStepNotReadyIntent.status, "provider_specific_decision_not_ready");
assert(
  nextStepNotReadyIntent.blocker_reasons.includes(
    "provider_specific_decision_next_step_not_ready",
  ),
);

const nextStepMissingEvidenceIntent =
  buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: manual.providerPreview,
    provider_specific_external_delivery_operator_decision_preview: {
      ...manual.providerDecision,
      next_step_readiness: {
        ...manual.providerDecision.next_step_readiness,
        current_missing_evidence: ["provider_profile_ref_missing"],
      },
    },
  });
assert.equal(
  nextStepMissingEvidenceIntent.status,
  "provider_specific_decision_not_ready",
);
assert(
  nextStepMissingEvidenceIntent.blocker_reasons.includes(
    "provider_specific_decision_next_step_missing_evidence_present",
  ),
);

const nextStepBlockersIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase(),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview: {
    ...manual.providerDecision,
    next_step_readiness: {
      ...manual.providerDecision.next_step_readiness,
      current_blockers: ["provider_specific_external_delivery_preview_not_ready"],
    },
  },
});
assert.equal(nextStepBlockersIntent.status, "provider_specific_decision_not_ready");
assert(
  nextStepBlockersIntent.blocker_reasons.includes(
    "provider_specific_decision_next_step_blockers_present",
  ),
);

for (const missingDecisionRef of [
  {
    key: "requested_idempotency_key",
    reason: "provider_specific_decision_idempotency_key_missing_or_unsafe",
  },
  {
    key: "review_confirmation_ref",
    reason:
      "provider_specific_decision_review_confirmation_ref_missing_or_unsafe",
  },
]) {
  const forgedDecision = {
    ...manual.providerDecision,
    [missingDecisionRef.key]: null,
  };
  const blocked = buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: manual.providerPreview,
    provider_specific_external_delivery_operator_decision_preview: forgedDecision,
  });
  assert.equal(blocked.status, "provider_specific_decision_not_ready");
  assert(blocked.blocker_reasons.includes(missingDecisionRef.reason));
}

const invalidExternalIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase({
    externalRecordReview: {
      review_version: "external_handoff_delivery_contract_record_review.v0.1",
      review_status: "records_invalid",
      authority_boundary: readOnlyAuthority(),
    },
  }),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview:
    manual.providerDecision,
});
assert.equal(invalidExternalIntent.status, "external_contract_invalid");

const missingExternalContractIntent =
  buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase({
      includeExternalPreview: false,
      includeExternalRecordReview: false,
    }),
    provider_specific_external_delivery_preview_contract: manual.providerPreview,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
assert.equal(missingExternalContractIntent.status, "external_contract_missing");
assert.equal(
  missingExternalContractIntent
    .would_write_provider_specific_delivery_intent_contract_record_preview,
  null,
);

const providerPreviewWithoutExternalRecordRef = { ...manual.providerPreview };
delete providerPreviewWithoutExternalRecordRef.source_external_handoff_delivery_contract_record_ref;
const recordReviewWithoutRecordId = externalContractRecordReview();
delete recordReviewWithoutRecordId.latest_record_summary.record_id;
const missingExternalRecordRefIntent =
  buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase({
      includeExternalPreview: false,
      externalRecordReview: recordReviewWithoutRecordId,
    }),
    provider_specific_external_delivery_preview_contract:
      providerPreviewWithoutExternalRecordRef,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
assert.equal(missingExternalRecordRefIntent.status, "external_contract_invalid");
assert(
  missingExternalRecordRefIntent.blocker_reasons.includes(
    "source_external_handoff_delivery_contract_record_ref_missing",
  ),
);

const hardResidualIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase({ residual: residualHardBlocker() }),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview:
    manual.providerDecision,
});
assert.equal(hardResidualIntent.status, "residual_gate_blocked");

const routeResidualIntent = buildProviderSpecificDeliveryIntentContractPreviewV01({
  ...intentInputBase({
    residual: residualWithCandidate({
      candidate_id: "candidate:route-runtime-only",
      category: "route_integration_mode_mismatch",
      status: "actionable_candidate",
      severity: "medium",
      observed_signals: [{ summary: "runtime_only route read is not integration" }],
    }),
  }),
  provider_specific_external_delivery_preview_contract: manual.providerPreview,
  provider_specific_external_delivery_operator_decision_preview:
    manual.providerDecision,
});
assert.equal(routeResidualIntent.status, "residual_gate_blocked");
assert.equal(
  routeResidualIntent
    .would_write_provider_specific_delivery_intent_contract_record_preview,
  null,
);

const validationDriftResidualIntent =
  buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase({
      residual: residualWithCandidate({
        candidate_id: "candidate:review-writer-validation-drift",
        category: "review_writer_validation_drift",
        status: "candidate",
        severity: "medium",
        materialized_inconsistencies: [
          "writer accepted material that review later rejected",
        ],
      }),
    }),
    provider_specific_external_delivery_preview_contract: manual.providerPreview,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
assert.equal(validationDriftResidualIntent.status, "residual_gate_blocked");

const forbiddenObservedResidualIntent =
  buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase({
      residual: residualWithCandidate({
        candidate_id: "candidate:forbidden-provider-signal",
        category: "reuse_outcome_gap",
        status: "candidate",
        severity: "low",
        observed_signals: [
          { summary: "provider_called true appeared in source evidence" },
        ],
      }),
    }),
    provider_specific_external_delivery_preview_contract: manual.providerPreview,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
assert.equal(forbiddenObservedResidualIntent.status, "residual_gate_blocked");

for (const unsafe of [
  { key: "provider_profile_ref", value: "provider-profile:token:abc" },
  { key: "provider_profile_ref", value: "https://example.invalid/profile" },
  { key: "requested_recipient_ref", value: "recipient:raw_message:abc" },
  { key: "requested_recipient_ref", value: "https://example.invalid/recipient" },
  { key: "requested_payload_format", value: "raw_payload:hello" },
  { key: "requested_payload_format", value: "secret:payload" },
]) {
  const forgedPreview = {
    ...manual.providerPreview,
    [unsafe.key]: unsafe.value,
  };
  const blocked = buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: forgedPreview,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
  assert.equal(blocked.status, "unsafe_ref_blocked");
}

for (const mismatch of [
  {
    provider_profile_ref: "provider-profile:slack:operator-managed",
    requested_recipient_ref: "recipient:email:operator-managed",
    reason: "provider_profile_ref_surface_mismatch",
  },
  {
    provider_profile_ref: "provider-profile:email:operator-managed",
    requested_recipient_ref: "recipient:slack:channel:ops",
    reason: "requested_recipient_ref_surface_mismatch",
  },
]) {
  const forgedPreview = {
    ...manual.providerPreview,
    requested_provider_surface: "email_delivery_preview",
    provider_profile_ref: mismatch.provider_profile_ref,
    requested_recipient_ref: mismatch.requested_recipient_ref,
  };
  const blocked = buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: forgedPreview,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
  assert.equal(blocked.status, "unsafe_ref_blocked");
  assert(blocked.blocker_reasons.includes(mismatch.reason));
}

for (const sourceFlag of [
  "delivery_performed",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
  "local_fulfillment_is_external_delivery",
]) {
  const forgedPreview = {
    ...manual.providerPreview,
    external_delivery_boundary: {
      ...manual.providerPreview.external_delivery_boundary,
      [sourceFlag]: true,
    },
  };
  const blocked = buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: forgedPreview,
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
  assert.notEqual(blocked.status, "ready_for_intent_decision");
}

for (const authorityFlag of [
  "can_call_send_provider",
  "can_send_handoff",
  "can_write_db",
  "can_write_memory",
  "can_render_workbench_action_button",
]) {
  const blocked = buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: {
      ...manual.providerPreview,
      authority_boundary: {
        ...manual.providerPreview.authority_boundary,
        [authorityFlag]: true,
      },
    },
    provider_specific_external_delivery_operator_decision_preview:
      manual.providerDecision,
  });
  assert.equal(blocked.status, "authority_boundary_blocked");
  assert.equal(blocked.authority_boundary.can_call_send_provider, false);
  assert.equal(blocked.authority_boundary.can_write_db, false);
  assert.equal(blocked.authority_boundary.can_render_workbench_action_button, false);
}

const review = reviewLib.buildProviderSpecificDeliveryIntentContractRecordReviewV01({
  records: [written.record],
  selected_record_id: written.record.record_id,
});
assert.equal(review.review_status, "selected_record_found");
assert.equal(review.input_summary.valid_record_count, 1);

for (const missingField of [
  "source_provider_specific_preview_fingerprint",
  "source_provider_specific_decision_fingerprint",
  "source_local_fulfillment_ref",
  "source_handoff_send_contract_record_ref",
  "source_exported_artifact_ref",
]) {
  const forged = { ...written.record };
  delete forged[missingField];
  const forgedReview =
    reviewLib.buildProviderSpecificDeliveryIntentContractRecordReviewV01({
      records: [forged],
    });
  assert.equal(forgedReview.review_status, "records_invalid");
  assert.equal(forgedReview.input_summary.valid_record_count, 0);
  assert(
    forgedReview.record_summaries[0].problem_reasons.some((reason) =>
      reason.startsWith(missingField),
    ),
    `missing reason for ${missingField}`,
  );
}

for (const boundaryField of [
  "delivery_performed",
  "provider_specific_delivery",
  "provider_delivery_intent_is_delivery",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
  "local_fulfillment_is_external_delivery",
  "provider_specific_preview_is_delivery",
]) {
  const forged = {
    ...written.record,
    external_delivery_boundary: {
      ...written.record.external_delivery_boundary,
      [boundaryField]: true,
    },
  };
  const forgedReview =
    reviewLib.buildProviderSpecificDeliveryIntentContractRecordReviewV01({
      records: [forged],
    });
  assert.equal(forgedReview.review_status, "records_invalid");
  assert(
    forgedReview.record_summaries[0].problem_reasons.includes(
      `${boundaryField}_true`,
    ),
  );
}

for (const receiptField of [
  "delivery_performed",
  "provider_specific_delivery",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
]) {
  const forged = {
    ...written.record,
    receipt: { ...written.record.receipt, [receiptField]: true },
  };
  const forgedReview =
    reviewLib.buildProviderSpecificDeliveryIntentContractRecordReviewV01({
      records: [forged],
    });
  assert.equal(forgedReview.review_status, "records_invalid");
  assert(
    forgedReview.record_summaries[0].problem_reasons.includes(
      `receipt_${receiptField}_true`,
    ),
  );
}

const defaultReview =
  readReviewLib.readProviderSpecificDeliveryIntentContractRecordReviewForWebV01();
assert.equal(defaultReview.review_status, "no_records");
assert.equal(defaultReview.input_summary.valid_record_count, 0);

const readById = writeLib.readProviderSpecificDeliveryIntentContractByIdV01(
  written.record.record_id,
  { db },
);
assert.equal(readById.status, "read");
const readByKey =
  writeLib.readProviderSpecificDeliveryIntentContractByIdempotencyKeyV01(
    writeInput.idempotency_key,
    { db },
  );
assert.equal(readByKey.status, "read");
const listed = writeLib.listProviderSpecificDeliveryIntentContractRecordsV01({
  db,
});
assert.equal(listed.status, "listed");
assert.equal(listed.records.length, 1);

console.log("smoke-provider-specific-delivery-intent-contract-v0-1: ok");

function buildReadyIntent({ surface, profileRef = null, recipientRef }) {
  const providerPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
    external_handoff_delivery_contract_preview: externalPreview,
    external_handoff_delivery_contract_record_review: externalRecordReview,
    residual_diagnostic_candidate_read_model: residual,
    requested_provider_surface: surface,
    requested_provider_profile_ref: profileRef,
    requested_recipient_ref: recipientRef,
    requested_payload_format: "markdown_payload",
    source_refs: ["source:provider-specific-preview"],
    evidence_refs: ["evidence:provider-specific-preview"],
    as_of: "2026-07-06T00:00:00.000Z",
  });
  assert.equal(providerPreview.status, "ready_for_provider_specific_decision");
  const providerDecision =
    buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01({
      provider_specific_external_delivery_preview_contract: providerPreview,
      requested_operator_ref: "operator:provider-specific-preview",
      requested_idempotency_key: `idempotency:provider-specific-preview:${surface}`,
      review_confirmation_ref: `review:provider-specific-preview:${surface}`,
      operator_decision_intent:
        "record_provider_specific_preview_contract_candidate",
      as_of: "2026-07-06T00:00:00.000Z",
    });
  const intentPreview = buildProviderSpecificDeliveryIntentContractPreviewV01({
    ...intentInputBase(),
    provider_specific_external_delivery_preview_contract: providerPreview,
    provider_specific_external_delivery_operator_decision_preview:
      providerDecision,
  });
  const intentDecision =
    buildProviderSpecificDeliveryIntentOperatorDecisionPreviewV01({
      provider_specific_delivery_intent_contract_preview: intentPreview,
      requested_operator_ref: "operator:provider-specific-intent",
      requested_idempotency_key: `idempotency:provider-specific-intent:${surface}`,
      review_confirmation_ref: `review:provider-specific-intent:${surface}`,
      operator_decision_intent:
        "record_provider_specific_delivery_intent_contract_candidate",
      as_of: "2026-07-06T00:00:00.000Z",
    });
  return { providerPreview, providerDecision, intentPreview, intentDecision };
}

function intentInputBase(overrides = {}) {
  const includeExternalPreview = overrides.includeExternalPreview !== false;
  const includeExternalRecordReview =
    overrides.includeExternalRecordReview !== false;
  return {
    ...(includeExternalPreview
      ? {
          external_handoff_delivery_contract_preview:
            overrides.externalPreview ?? externalPreview,
        }
      : {}),
    ...(includeExternalRecordReview
      ? {
          external_handoff_delivery_contract_record_review:
            overrides.externalRecordReview ?? externalRecordReview,
        }
      : {}),
    residual_diagnostic_candidate_read_model: overrides.residual ?? residual,
    sent_handoff_read: { status: "local_handoff_send_fulfillment_available" },
    handoff_send_record_review: { review_status: "records_available" },
    handoff_send_contract_record_review: { review_status: "records_available" },
    exported_handoff_packet_artifact_read: {
      status: "latest_exported_handoff_packet_artifact_available",
    },
    applied_handoff_context_read: {
      status: "latest_applied_handoff_context_available",
    },
    as_of: "2026-07-06T00:00:00.000Z",
    source_refs: ["source:provider-specific-intent"],
    evidence_refs: ["evidence:provider-specific-intent"],
  };
}

function intentWriteInput(intentDecision) {
  return {
    operator_decision_preview: intentDecision,
    operator_approval: {
      operator_decision:
        "record_provider_specific_delivery_intent_contract_candidate",
      approved_by: "operator:provider-specific-intent",
      operator_ref: "operator:provider-specific-intent",
      approved_at: "2026-07-06T00:00:00.000Z",
      approval_statement: "approval:provider-specific-intent",
      checklist_confirmations: [
        "confirmed:not-delivery",
        "confirmed:no-provider-call",
        "confirmed:no-network-call",
      ],
    },
    idempotency_key: intentDecision.requested_idempotency_key,
    notes: ["note:provider-specific-intent"],
  };
}

function externalContractPreview() {
  return {
    preview_version: "external_handoff_delivery_contract_preview.v0.1",
    preview_fingerprint: "preview:external-delivery-contract:001",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    status: "ready_for_contract_decision",
    source_refs: ["source:external-contract"],
    evidence_refs: ["evidence:external-contract"],
    source_local_fulfillment_ref: "handoff-send-record:001",
    source_handoff_send_contract_record_ref: "handoff-send-contract:001",
    source_exported_artifact_ref: "handoff-packet-artifact:001",
    source_applied_handoff_context_ref: "applied-handoff-context:001",
    payload_hash: "sha256:provider-specific-intent-payload",
    payload_type: "markdown_payload",
    requested_delivery_mode: "manual_operator_delivery",
    requested_delivery_surface: "provider_specific_delivery_contract_required",
    requested_recipient_ref: "recipient:operator",
    readiness_summary: {
      local_spine_ready: true,
      local_fulfillment_stage_fulfilled: true,
      exported_artifact_stage_exported: true,
      handoff_send_contract_stage_approved: true,
      local_fulfillment_ref_present: true,
      exported_artifact_ref_present: true,
      payload_integrity_ref_present: true,
      residual_gate_passed: true,
      authority_boundary_passed: true,
      external_delivery_not_performed: true,
      contract_decision_ready: true,
    },
    blocker_reasons: [],
    warning_reasons: [],
    residual_gate_summary: residualGate("warning_only"),
    external_delivery_boundary: deliveryBoundary(),
    authority_boundary: readOnlyAuthority(),
    would_write_external_handoff_delivery_contract_record_preview: {},
    would_not_do: [],
    non_goals: [],
  };
}

function externalContractRecordReview() {
  return {
    review_version: "external_handoff_delivery_contract_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    review_status: "records_available",
    selected_record_summary: null,
    latest_record_summary: {
      record_id: "external-handoff-delivery-contract:001",
      created_at: "2026-07-06T00:00:00.000Z",
      source_local_fulfillment_ref: "handoff-send-record:001",
      source_handoff_send_contract_record_ref: "handoff-send-contract:001",
      source_exported_artifact_ref: "handoff-packet-artifact:001",
      payload_hash: "sha256:provider-specific-intent-payload",
      payload_type: "markdown_payload",
      requested_delivery_surface: "provider_specific_delivery_contract_required",
      requested_delivery_mode: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      contract_status: "recorded_as_external_handoff_delivery_contract_candidate",
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
      problem_reasons: [],
    },
    record_summaries: [],
    input_summary: { valid_record_count: 1 },
    evidence_summary: {
      has_valid_records: true,
      delivery_performed: false,
      provider_called: false,
      external_message_sent: false,
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    source_refs: ["source:external-contract-review"],
    records: [],
    authority_boundary: readOnlyAuthority(),
  };
}

function residualBoundaryPressureOnly() {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    source_refs: ["source:residual"],
    residual_candidates: [
      {
        candidate_id: "candidate:external-boundary-pressure",
        category: "external_delivery_boundary_pressure",
        status: "candidate",
        severity: "medium",
        observed_signals: [],
        materialized_inconsistencies: [],
      },
    ],
    authority_boundary: readOnlyAuthority(),
  };
}

function residualHardBlocker() {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    source_refs: ["source:residual-hard"],
    residual_candidates: [
      {
        candidate_id: "candidate:authority",
        category: "authority_boundary_drift",
        status: "actionable_candidate",
        severity: "high",
        observed_signals: [{ materialized_inconsistency: true }],
        materialized_inconsistencies: ["can_call_send_provider true"],
      },
    ],
    authority_boundary: readOnlyAuthority(),
  };
}

function residualWithCandidate(candidate) {
  return {
    diagnostic_version: "residual_diagnostic_candidate_read_model.v0.1",
    scope: "project:augnes",
    source_refs: ["source:residual-candidate"],
    residual_candidates: [
      {
        observed_signals: [],
        materialized_inconsistencies: [],
        ...candidate,
      },
    ],
    authority_boundary: readOnlyAuthority(),
  };
}

function residualGate(status = "passed") {
  return {
    gate_status: status,
    hard_blocking_candidate_ids: [],
    warning_candidate_ids:
      status === "warning_only" ? ["candidate:external-boundary-pressure"] : [],
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
    provider_delivery_intent_is_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
    local_fulfillment_is_external_delivery: false,
    provider_specific_preview_is_delivery: false,
  };
}

function readOnlyAuthority() {
  return {
    read_only: true,
    advisory_only: true,
    intent_contract_only: true,
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
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
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
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
  for (const field of [
    "external_message_sent",
    "provider_called",
    "network_called",
    "delivery_performed",
  ]) {
    assertNoTrueField(label, text, field);
  }
}

function assertNoTrueField(label, text, field) {
  const positive = new RegExp(`(?<![A-Za-z0-9_])${field}\\s*:\\s*true`, "g");
  assert(!positive.test(text), `${label} must not set ${field}: true`);
}

function assertNoActionButtons(label, text) {
  assert(!/<button\b/i.test(text), `${label} must not render button`);
  assert(!/\bon[A-Z][A-Za-z]+\s*=/.test(text), `${label} must not include handlers`);
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
      !new RegExp(`\\bon[A-Z][A-Za-z]+[^\\n]*(?:${forbidden})`, "i").test(text),
      `${label} must not wire ${forbidden} handler`,
    );
  }
}

function assertScopedIntentWriteOnly(text) {
  assert(text.includes("provider_specific_delivery_intent_contract_records"));
  assert(text.includes("INSERT INTO provider_specific_delivery_intent_contract_records"));
  assert(!text.includes("fetch("));
  assert(!text.includes("navigator.clipboard"));
  assert(!text.includes("new Database"));
  assertNoTrueField("write", text, "delivery_performed");
  assertNoTrueField("write", text, "provider_called");
  assertNoTrueField("write", text, "external_message_sent");
  assertNoTrueField("write", text, "network_called");
}

function agentIntentSnippet(text) {
  const start = text.indexOf("buildProviderSpecificDeliveryIntentContractPreviewV01");
  const end = text.indexOf("<ProviderSpecificDeliveryIntentContractPanel");
  assert(start >= 0 && end > start, "Agent intent snippet markers missing");
  return text.slice(start, end + 220);
}
