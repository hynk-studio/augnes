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
  scriptName: "smoke:provider-specific-external-delivery-preview-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-provider-specific-external-delivery-preview-contract-v0-1.mjs",
});

const expectedFiles = [
  "types/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts",
  "components/workplane/provider-specific-external-delivery-preview-contract-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-provider-specific-external-delivery-preview-contract-v0-1.mjs",
  "types/external-handoff-delivery-contract.ts",
  "lib/workplane/external-handoff-delivery-contract-preview.ts",
  "lib/workplane/external-handoff-delivery-operator-decision-preview.ts",
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
  label: "provider_specific_external_delivery_preview_contract_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get(
  "types/provider-specific-external-delivery-preview-contract.ts",
);
const helperText = textByFile.get(
  "lib/workplane/provider-specific-external-delivery-preview-contract.ts",
);
const decisionText = textByFile.get(
  "lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts",
);
const panelText = textByFile.get(
  "components/workplane/provider-specific-external-delivery-preview-contract-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "provider_specific_external_delivery_preview_contract.v0.1",
  "provider_specific_external_delivery_operator_decision_preview.v0.1",
  "manual_operator_delivery",
  "email_delivery_preview",
  "slack_delivery_preview",
  "webhook_delivery_preview",
  "ready_for_provider_specific_decision",
  "record_provider_specific_preview_contract_candidate",
  "provider_specific_preview_is_delivery: false",
  "delivery_performed: false",
  "provider_called: false",
  "external_message_sent: false",
  "network_called: false",
  "requires_provider_token: false",
  "validates_by_provider_call: false",
  "delivery_execution_available: false",
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
  agentText.includes("buildProviderSpecificExternalDeliveryPreviewContractV01"),
  "Agent Workplane must build provider-specific preview contract",
);
assert(
  agentText.includes("<ProviderSpecificExternalDeliveryPreviewContractPanel"),
  "Agent Workplane must render provider-specific preview panel",
);
assertNoForbiddenPureRuntime("helper", helperText);
assertNoForbiddenPureRuntime("decision", decisionText);
assertNoForbiddenPureRuntime("panel", panelText);
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentProviderSpecificSnippet(agentText));

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
  buildProviderSpecificExternalDeliveryPreviewContractV01,
} = await import(
  "../lib/workplane/provider-specific-external-delivery-preview-contract.ts"
);
const {
  buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts"
);

const happySpine = buildWorkbenchSpineConsolidationV01(buildHappyInput());
const happyResidual = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: happySpine,
  current_working_perspective_route_integration_read: routeRead(),
});
const externalPreview = buildExternalHandoffDeliveryContractPreviewV01({
  workbench_spine_consolidation: happySpine,
  residual_diagnostic_candidate_read_model: happyResidual,
  sent_handoff_read: sentHandoffRead(true),
  handoff_send_record_review: sendRecordReview(),
  handoff_send_contract_record_review: sendContractReview(),
  exported_handoff_packet_artifact_read: exportedArtifactRead(true),
  applied_handoff_context_read: appliedHandoffRead(true),
  source_refs: ["source:provider-specific-smoke"],
  evidence_refs: ["evidence:provider-specific-smoke"],
  as_of: "2026-07-06T00:00:00.000Z",
});
assert.equal(externalPreview.status, "ready_for_contract_decision");

const manualPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
  ...providerInputBase({ externalPreview, happyResidual }),
  requested_provider_surface: "manual_operator_delivery",
  requested_recipient_ref: "recipient:operator",
  requested_payload_format: "markdown_payload",
});
assert.equal(manualPreview.status, "ready_for_provider_specific_decision");
assert.equal(manualPreview.provider_profile_status, "not_required_for_manual_operator_delivery");
assert.equal(
  manualPreview.provider_capability_summary.requires_provider_profile_ref,
  false,
);
assert.equal(manualPreview.external_delivery_boundary.delivery_performed, false);
assert.equal(manualPreview.external_delivery_boundary.provider_called, false);
assert.equal(
  manualPreview.external_delivery_boundary.external_message_sent,
  false,
);
assert.equal(manualPreview.external_delivery_boundary.network_called, false);
assert.equal(
  manualPreview.external_delivery_boundary.provider_specific_preview_is_delivery,
  false,
);
const manualDecision =
  buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01({
    provider_specific_external_delivery_preview_contract: manualPreview,
    requested_operator_ref: "operator:provider-specific-preview",
    requested_idempotency_key: "idempotency:provider-specific-preview:001",
    review_confirmation_ref: "review:provider-specific-preview:001",
    operator_decision_intent:
      "record_provider_specific_preview_contract_candidate",
    as_of: "2026-07-06T00:00:00.000Z",
  });
assert.equal(
  manualDecision.recommended_operator_decision,
  "record_provider_specific_preview_contract_candidate",
);
assert.equal(
  manualDecision.decision_status,
  "ready_for_provider_specific_preview_decision",
);

for (const surface of [
  "email_delivery_preview",
  "slack_delivery_preview",
  "webhook_delivery_preview",
]) {
  const missingProfilePreview =
    buildProviderSpecificExternalDeliveryPreviewContractV01({
      ...providerInputBase({ externalPreview, happyResidual }),
      requested_provider_surface: surface,
      requested_recipient_ref: `recipient:${surface}:operator-managed`,
      requested_payload_format: "markdown_payload",
    });
  assert.equal(missingProfilePreview.status, "provider_profile_missing");
  assert.equal(
    missingProfilePreview.external_delivery_boundary.delivery_performed,
    false,
  );
  const decision =
    buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01({
      provider_specific_external_delivery_preview_contract: missingProfilePreview,
    });
  assert.notEqual(
    decision.recommended_operator_decision,
    "record_provider_specific_preview_contract_candidate",
  );
}

const safeEmailPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
  ...providerInputBase({ externalPreview, happyResidual }),
  requested_provider_surface: "email_delivery_preview",
  requested_provider_profile_ref: "provider-profile:email:operator-managed",
  requested_recipient_ref: "recipient:email:operator-managed",
  requested_payload_format: "markdown_payload",
});
assert.equal(safeEmailPreview.status, "ready_for_provider_specific_decision");
assert.equal(safeEmailPreview.provider_profile_status, "safe_ref_available");
assert.equal(safeEmailPreview.external_delivery_boundary.provider_called, false);

const safeSlackPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
  ...providerInputBase({ externalPreview, happyResidual }),
  requested_provider_surface: "slack_delivery_preview",
  requested_provider_profile_ref: "provider-profile:slack:operator-managed",
  requested_recipient_ref: "recipient:slack-channel:ops",
  requested_payload_format: "markdown_payload",
});
assert.equal(safeSlackPreview.status, "ready_for_provider_specific_decision");
assert.equal(safeSlackPreview.external_delivery_boundary.provider_called, false);

const safeWebhookPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
  ...providerInputBase({ externalPreview, happyResidual }),
  requested_provider_surface: "webhook_delivery_preview",
  requested_provider_profile_ref: "provider-profile:webhook:operator-managed",
  requested_recipient_ref: "endpoint-ref:webhook:operator-managed",
  requested_payload_format: "markdown_payload",
});
assert.equal(safeWebhookPreview.status, "ready_for_provider_specific_decision");
assert.equal(safeWebhookPreview.external_delivery_boundary.provider_called, false);

for (const mismatch of [
  {
    requested_provider_surface: "email_delivery_preview",
    requested_provider_profile_ref: "provider-profile:slack:operator-managed",
    requested_recipient_ref: "recipient:email:operator-managed",
    reason: "provider_profile_ref_surface_mismatch",
    status: "provider_profile_invalid",
  },
  {
    requested_provider_surface: "email_delivery_preview",
    requested_provider_profile_ref: "provider-profile:email:operator-managed",
    requested_recipient_ref: "recipient:slack:channel:ops",
    reason: "requested_recipient_ref_surface_mismatch",
    status: "blocked",
  },
  {
    requested_provider_surface: "slack_delivery_preview",
    requested_provider_profile_ref: "provider-profile:email:operator-managed",
    requested_recipient_ref: "recipient:slack-channel:ops",
    reason: "provider_profile_ref_surface_mismatch",
    status: "provider_profile_invalid",
  },
  {
    requested_provider_surface: "slack_delivery_preview",
    requested_provider_profile_ref: "provider-profile:slack:operator-managed",
    requested_recipient_ref: "recipient:email:operator-managed",
    reason: "requested_recipient_ref_surface_mismatch",
    status: "blocked",
  },
  {
    requested_provider_surface: "webhook_delivery_preview",
    requested_provider_profile_ref: "provider-profile:email:operator-managed",
    requested_recipient_ref: "endpoint-ref:webhook:operator-managed",
    reason: "provider_profile_ref_surface_mismatch",
    status: "provider_profile_invalid",
  },
  {
    requested_provider_surface: "webhook_delivery_preview",
    requested_provider_profile_ref: "provider-profile:webhook:operator-managed",
    requested_recipient_ref: "recipient:email:operator-managed",
    reason: "requested_recipient_ref_surface_mismatch",
    status: "blocked",
  },
  {
    requested_provider_surface: "manual_operator_delivery",
    requested_recipient_ref: "recipient:email:operator-managed",
    reason: "requested_recipient_ref_surface_mismatch",
    status: "blocked",
  },
]) {
  const mismatchPreview = buildProviderSpecificExternalDeliveryPreviewContractV01({
    ...providerInputBase({ externalPreview, happyResidual }),
    requested_provider_surface: mismatch.requested_provider_surface,
    requested_provider_profile_ref: mismatch.requested_provider_profile_ref,
    requested_recipient_ref: mismatch.requested_recipient_ref,
    requested_payload_format: "markdown_payload",
  });
  assert.equal(mismatchPreview.status, mismatch.status);
  assert(
    mismatchPreview.blocker_reasons.includes(mismatch.reason),
    `missing ${mismatch.reason}`,
  );
  assert.notEqual(
    mismatchPreview.status,
    "ready_for_provider_specific_decision",
  );
  assert.equal(mismatchPreview.external_delivery_boundary.delivery_performed, false);
  assert.equal(mismatchPreview.external_delivery_boundary.provider_called, false);
  assert.equal(
    mismatchPreview.external_delivery_boundary.external_message_sent,
    false,
  );
  assert.equal(mismatchPreview.external_delivery_boundary.network_called, false);
}

for (const unsafeProfileRef of [
  "provider-profile:token:abc",
  "provider-profile:secret:abc",
  "provider-profile:bearer:abc",
  "provider-profile:password:abc",
  "provider-profile:api_key:abc",
  "http://example.invalid/webhook",
  "https://example.invalid/webhook",
  "webhook url secret",
]) {
  const unsafeProfilePreview =
    buildProviderSpecificExternalDeliveryPreviewContractV01({
      ...providerInputBase({ externalPreview, happyResidual }),
      requested_provider_surface: "email_delivery_preview",
      requested_provider_profile_ref: unsafeProfileRef,
      requested_recipient_ref: "recipient:email:operator-managed",
      requested_payload_format: "markdown_payload",
    });
  assert.equal(unsafeProfilePreview.status, "provider_profile_invalid");
  assert(
    unsafeProfilePreview.blocker_reasons.includes("provider_profile_ref_unsafe"),
  );
  assert.equal(unsafeProfilePreview.external_delivery_boundary.provider_called, false);
}

for (const unsafeRecipientRef of [
  "recipient:token:abc",
  "recipient:secret:abc",
  "recipient:raw_message:abc",
  "recipient:private:abc",
  "https://example.invalid/recipient",
  "raw_email_body:hello",
  "raw_payload:hello",
]) {
  const unsafeRecipientPreview =
    buildProviderSpecificExternalDeliveryPreviewContractV01({
      ...providerInputBase({ externalPreview, happyResidual }),
      requested_provider_surface: "manual_operator_delivery",
      requested_recipient_ref: unsafeRecipientRef,
      requested_payload_format: "markdown_payload",
    });
  assert.notEqual(
    unsafeRecipientPreview.status,
    "ready_for_provider_specific_decision",
  );
  assert(
    unsafeRecipientPreview.blocker_reasons.includes(
      "requested_recipient_ref_unsafe",
    ),
  );
}

const unsupportedSurfacePreview =
  buildProviderSpecificExternalDeliveryPreviewContractV01({
    ...providerInputBase({ externalPreview, happyResidual }),
    requested_provider_surface: "fax_delivery",
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "markdown_payload",
  });
assert.equal(unsupportedSurfacePreview.status, "insufficient_data");
assert(
  unsupportedSurfacePreview.blocker_reasons.includes(
    "unsupported_provider_surface",
  ),
);

const unsupportedPayloadPreview =
  buildProviderSpecificExternalDeliveryPreviewContractV01({
    ...providerInputBase({ externalPreview, happyResidual }),
    requested_provider_surface: "manual_operator_delivery",
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "raw_provider_payload",
  });
assert.equal(unsupportedPayloadPreview.status, "payload_format_unsupported");
assert(
  unsupportedPayloadPreview.blocker_reasons.includes(
    "payload_format_unsupported",
  ),
);

for (const unsafePayloadFormat of [
  "raw_payload:hello",
  "raw_message:hello",
  "secret:payload",
  "token:payload",
  "https://example.invalid/payload",
]) {
  const unsafePayloadPreview =
    buildProviderSpecificExternalDeliveryPreviewContractV01({
      ...providerInputBase({ externalPreview, happyResidual }),
      requested_provider_surface: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      requested_payload_format: unsafePayloadFormat,
    });
  assert.equal(unsafePayloadPreview.status, "payload_format_unsupported");
  assert(
    unsafePayloadPreview.blocker_reasons.includes(
      "requested_payload_format_unsafe",
    ),
    `unsafe payload format ${unsafePayloadFormat} must be explicit`,
  );
  assert.notEqual(
    unsafePayloadPreview.status,
    "ready_for_provider_specific_decision",
  );
  assert.equal(unsafePayloadPreview.requested_payload_format, null);
  assert.equal(unsafePayloadPreview.external_delivery_boundary.delivery_performed, false);
  assert.equal(unsafePayloadPreview.external_delivery_boundary.provider_called, false);
  assert.equal(
    unsafePayloadPreview.external_delivery_boundary.external_message_sent,
    false,
  );
  assert.equal(unsafePayloadPreview.external_delivery_boundary.network_called, false);
}

const missingExternalContractPreview =
  buildProviderSpecificExternalDeliveryPreviewContractV01({
    residual_diagnostic_candidate_read_model: happyResidual,
    requested_provider_surface: "manual_operator_delivery",
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "markdown_payload",
    as_of: "2026-07-06T00:00:00.000Z",
  });
assert.equal(missingExternalContractPreview.status, "external_contract_missing");

const invalidExternalContractRecordPreview =
  buildProviderSpecificExternalDeliveryPreviewContractV01({
    residual_diagnostic_candidate_read_model: happyResidual,
    external_handoff_delivery_contract_record_review: {
      review_version: "external_handoff_delivery_contract_record_review.v0.1",
      review_status: "records_invalid",
      source_refs: ["source:invalid-external-contract"],
      authority_boundary: readOnlyBoundary(),
    },
    requested_provider_surface: "manual_operator_delivery",
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "markdown_payload",
  });
assert.equal(
  invalidExternalContractRecordPreview.status,
  "external_contract_not_ready",
);
assert(
  invalidExternalContractRecordPreview.blocker_reasons.includes(
    "external_handoff_delivery_contract_record_review_invalid",
  ),
);

for (const forgedBoundary of [
  { provider_called: true },
  { external_message_sent: true },
  { network_called: true },
  { delivery_performed: true },
  { local_fulfillment_is_external_delivery: true },
]) {
  const forgedPreview =
    buildProviderSpecificExternalDeliveryPreviewContractV01({
      ...providerInputBase({
        externalPreview: {
          ...externalPreview,
          external_delivery_boundary: {
            ...externalPreview.external_delivery_boundary,
            ...forgedBoundary,
          },
        },
        happyResidual,
      }),
      requested_provider_surface: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      requested_payload_format: "markdown_payload",
    });
  assert.notEqual(forgedPreview.status, "ready_for_provider_specific_decision");
}

for (const category of [
  "authority_boundary_drift",
  "source_ref_lineage_mismatch",
]) {
  const residualBlockedPreview =
    buildProviderSpecificExternalDeliveryPreviewContractV01({
      ...providerInputBase({
        externalPreview,
        happyResidual: residualWithCandidate(category, {
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
      }),
      requested_provider_surface: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      requested_payload_format: "markdown_payload",
    });
  assert.equal(residualBlockedPreview.status, "residual_gate_blocked");
}

const pressureOnlyPreview =
  buildProviderSpecificExternalDeliveryPreviewContractV01({
    ...providerInputBase({
      externalPreview,
      happyResidual: residualWithCandidate("external_delivery_boundary_pressure", {
        status: "candidate",
        severity: "medium",
        materialized_inconsistencies: [],
        observed_signals: [
          {
            summary: "local fulfillment remains not external delivery",
            materialized_inconsistency: false,
          },
        ],
      }),
    }),
    requested_provider_surface: "manual_operator_delivery",
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "markdown_payload",
  });
assert.equal(pressureOnlyPreview.status, "ready_for_provider_specific_decision");
assert.equal(pressureOnlyPreview.residual_gate_summary.gate_status, "warning_only");
assert(
  pressureOnlyPreview.warning_reasons.some((reason) =>
    reason.includes("external_delivery_boundary_pressure"),
  ),
);

const forgedAuthorityPreview =
  buildProviderSpecificExternalDeliveryPreviewContractV01({
    ...providerInputBase({
      externalPreview,
      happyResidual,
      workbench_spine_consolidation: {
        ...happySpine,
        authority_boundary: {
          ...happySpine.authority_boundary,
          can_call_send_provider: true,
          can_send_handoff: true,
          can_write_db: true,
          can_write_memory: true,
          can_render_workbench_action_button: true,
        },
      },
    }),
    requested_provider_surface: "manual_operator_delivery",
    requested_recipient_ref: "recipient:operator",
    requested_payload_format: "markdown_payload",
  });
assert.equal(forgedAuthorityPreview.status, "authority_boundary_blocked");
assert.equal(forgedAuthorityPreview.authority_boundary.read_only, true);
assert.equal(forgedAuthorityPreview.authority_boundary.can_write_db, false);
assert.equal(forgedAuthorityPreview.authority_boundary.can_send_handoff, false);
assert.equal(
  forgedAuthorityPreview.authority_boundary.can_call_send_provider,
  false,
);
assert.equal(forgedAuthorityPreview.authority_boundary.can_write_memory, false);
assert.equal(
  forgedAuthorityPreview.authority_boundary.can_render_workbench_action_button,
  false,
);

console.log("smoke-provider-specific-external-delivery-preview-contract-v0-1: ok");

function providerInputBase({
  externalPreview,
  happyResidual,
  workbench_spine_consolidation = happySpine,
}) {
  return {
    external_handoff_delivery_contract_preview: externalPreview,
    external_handoff_delivery_contract_record_review: {
      review_version: "external_handoff_delivery_contract_record_review.v0.1",
      review_status: "no_records",
      source_refs: ["source:external-contract-record-review"],
      authority_boundary: readOnlyBoundary(),
    },
    workbench_spine_consolidation,
    residual_diagnostic_candidate_read_model: happyResidual,
    sent_handoff_read: sentHandoffRead(true),
    handoff_send_record_review: sendRecordReview(),
    handoff_send_contract_record_review: sendContractReview(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(true),
    applied_handoff_context_read: appliedHandoffRead(true),
    source_refs: ["source:provider-specific-preview"],
    evidence_refs: ["evidence:provider-specific-preview"],
    as_of: "2026-07-06T00:00:00.000Z",
  };
}

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
    source_refs: ["workbench:provider-specific-smoke"],
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
    can_call_network: false,
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
    "email client",
    "slack client",
    "webhook client",
    "provider SDK",
    "setInterval(",
    "setTimeout(",
    "navigator.clipboard",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
  assertNoTrueField(label, text, "delivery_performed");
  assertNoTrueField(label, text, "external_message_sent");
  assertNoTrueField(label, text, "provider_called");
  assertNoTrueField(label, text, "network_called");
  assertNoTrueField(label, text, "can_send_handoff");
  assertNoTrueField(label, text, "can_call_send_provider");
  assertNoTrueField(label, text, "can_write_memory");
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
      !new RegExp(`\\bon[A-Z][A-Za-z]+\\s*=\\s*\\{[^}]*${action}`, "i").test(text),
      `${label} must not bind ${action} handlers`,
    );
  }
}

function assertNoTrueField(label, text, field) {
  const pattern = new RegExp(`(^|[^A-Za-z0-9_])${field}\\s*:\\s*true`);
  assert(!pattern.test(text), `${label} must not set ${field} true`);
}

function agentProviderSpecificSnippet(text) {
  const start = text.indexOf(
    "buildProviderSpecificExternalDeliveryPreviewContractV01",
  );
  const end = text.indexOf(
    "<ProviderSpecificExternalDeliveryPreviewContractPanel",
  );
  assert(start >= 0, "missing provider-specific preview builder snippet");
  assert(end >= 0, "missing provider-specific panel snippet");
  return text.slice(start, end + 360);
}
