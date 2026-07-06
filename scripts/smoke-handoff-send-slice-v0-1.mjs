import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
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
  scriptName: "smoke:handoff-send-slice-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-send-slice-v0-1.mjs",
});

const expectedFiles = [
  "types/handoff-send-preview.ts",
  "lib/workplane/handoff-send-preview.ts",
  "components/workplane/handoff-send-preview-panel.tsx",
  "types/handoff-send-decision.ts",
  "lib/workplane/handoff-send-decision.ts",
  "components/workplane/handoff-send-decision-panel.tsx",
  "types/handoff-send-write.ts",
  "lib/workplane/handoff-send-write.ts",
  "app/api/workplane/handoff-sends/route.ts",
  "types/handoff-send-record-review.ts",
  "lib/workplane/handoff-send-record-review.ts",
  "lib/workplane/read-handoff-send-record-review-for-web.ts",
  "lib/workplane/read-sent-handoff-for-web.ts",
  "components/workplane/handoff-send-record-review-panel.tsx",
  "components/workplane/sent-handoff-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
  "scripts/smoke-handoff-send-slice-v0-1.mjs",
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-contract-v0-1.mjs",
  "scripts/smoke-handoff-context-apply-slice-v0-1.mjs",
  "scripts/smoke-handoff-context-update-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  "types/workbench-spine-consolidation.ts",
  "lib/workplane/workbench-spine-consolidation.ts",
  "components/workplane/workbench-spine-consolidation-panel.tsx",
  "scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
  "types/residual-diagnostic-candidate.ts",
  "lib/workplane/residual-diagnostic-candidate.ts",
  "components/workplane/residual-diagnostic-candidate-panel.tsx",
  "scripts/smoke-residual-diagnostic-candidate-v0-1.mjs",
  "types/external-handoff-delivery-contract.ts",
  "lib/workplane/external-handoff-delivery-contract-preview.ts",
  "lib/workplane/external-handoff-delivery-operator-decision-preview.ts",
  "lib/workplane/external-handoff-delivery-contract-write.ts",
  "lib/workplane/external-handoff-delivery-contract-record-review.ts",
  "lib/workplane/read-external-handoff-delivery-contract-record-review-for-web.ts",
  "components/workplane/external-handoff-delivery-contract-panel.tsx",
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
  "types/provider-specific-delivery-execution-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-execution-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-execution-operator-decision-preview.ts",
  "components/workplane/provider-specific-delivery-execution-contract-preview-panel.tsx",
  "scripts/smoke-provider-specific-delivery-execution-contract-preview-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 15)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "handoff_send_slice_v0_1",
});

const textByFile = loadTextByFile(
  expectedFiles.filter((file) => existsSync(path.join(root, file))),
);
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "handoff_send_preview.v0.1",
  "handoff_send_operator_decision_preview.v0.1",
  "handoff_send_record.v0.1",
  "handoff_send_receipt.v0.1",
  "handoff_send_store.v0.1",
  "handoff_send_record_review.v0.1",
  "sent_handoff_read.v0.1",
  "handoff_send_fulfillment.v0.1",
  "manual_operator_send_fulfillment",
  "local_deferred_send_queue_fulfillment",
  "provider_send_dry_run_fulfillment",
  "codex_session_transfer_dry_run_fulfillment",
  "review_handoff_send_preview",
  "approve_handoff_send_record",
  "write_handoff_send_record",
  "review_handoff_send_record",
  "review_sent_handoff_status",
  "resolve_handoff_send_blockers",
  "prepare_external_handoff_delivery_contract",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const previewLib = await import("../lib/workplane/handoff-send-preview.ts");
const decisionLib = await import("../lib/workplane/handoff-send-decision.ts");
const writeLib = await import("../lib/workplane/handoff-send-write.ts");
const reviewLib = await import("../lib/workplane/handoff-send-record-review.ts");
const readReviewLib = await import(
  "../lib/workplane/read-handoff-send-record-review-for-web.ts"
);
const readSentLib = await import("../lib/workplane/read-sent-handoff-for-web.ts");
const route = await import("../app/api/workplane/handoff-sends/route.ts");
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const { buildHandoffSendPreviewV01 } = previewLib;
const { buildHandoffSendOperatorDecisionPreviewV01 } = decisionLib;
const {
  ensureHandoffSendWriteSchemaV01,
  handoffSendWriteSchemaExistsV01,
  listHandoffSendRecordsV01,
  readHandoffSendRecordByIdV01,
  readHandoffSendRecordByIdempotencyKeyV01,
  writeHandoffSendRecordV01,
} = writeLib;
const { buildHandoffSendRecordReviewV01 } = reviewLib;
const { readHandoffSendRecordReviewForWebV01 } = readReviewLib;
const { readSentHandoffForWebV01 } = readSentLib;

const AS_OF = "2026-07-06T00:00:00.000Z";
const sourceRefs = ["source:send-slice-v0-1"];
const evidenceRefs = ["evidence:send-slice-v0-1"];
const operatorRef = "operator:send-slice-v0-1";
const idempotencyKey = "idempotency:send-slice-v0-1";
const reviewRef = "review:send-slice-v0-1";
const recipientRef = "recipient:manual-operator";
const manualConfirmationRef = "manual-confirm:send-slice-v0-1";
const localQueueRef = "local-queue:send-slice-v0-1";
const tempDir = path.join(root, ".tmp/handoff-sends");
const dbPath = ".tmp/handoff-sends/send-slice.db";
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const forbiddenNoSideEffectFields = [
  "handoff_sent",
  "handoff_sent_externally",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "provider_called",
  "github_called",
  "codex_executed",
  "codex_session_transferred",
  "browser_or_crawler_called",
  "network_send_performed",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "handoff_packet_copied_to_clipboard",
  "handoff_packet_exported_to_file",
  "handoff_packet_download_created",
  "handoff_packet_copied",
  "handoff_packet_exported",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_send_contract_record_written",
  "handoff_packet_copy_export_record_written",
  "handoff_packet_exported_artifact_written",
  "handoff_packet_copy_export_contract_record_written",
  "handoff_context_apply_record_written",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_contract_record_written",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildEnvelope(overrides = {}) {
  return {
    envelope_version: "handoff_send_envelope.v0.1",
    envelope_ref: "handoff-send-envelope:send-slice-v0-1",
    packet_family: "augnes_operator_handoff_packet",
    source_exported_artifact_ref: "exported-artifact:send-slice-v0-1",
    packet_format: "operator_handoff_packet_markdown",
    payload_hash: "payload-hash:send-slice-v0-1",
    payload_type: "markdown_payload",
    requested_send_surface: "operator_manual_send_candidate",
    requested_delivery_mode: "manual_operator_delivery",
    requested_recipient_ref: recipientRef,
    public_safe: true,
    raw_private_material_excluded: true,
    send_not_performed: true,
    provider_not_called: true,
    external_delivery_not_performed: true,
    future_send_slice_required: true,
    ...overrides,
  };
}

function buildProposedContract({
  recordRef,
  surface,
  deliveryMode,
  envelope,
  recipient = recipientRef,
} = {}) {
  return {
    contract_kind: "handoff_send_contract.v0.1",
    send_family: "augnes_operator_handoff_send",
    source_exported_artifact_ref: envelope.source_exported_artifact_ref,
    source_handoff_packet_copy_export_record_ref:
      "handoff-packet-copy-export-record:send-slice-v0-1",
    source_handoff_packet_copy_export_contract_record_ref:
      "handoff-packet-copy-export-contract-record:send-slice-v0-1",
    source_applied_handoff_context_snapshot_ref:
      "applied-handoff-context-snapshot:send-slice-v0-1",
    source_handoff_context_apply_record_ref:
      "handoff-context-apply-record:send-slice-v0-1",
    source_handoff_context_update_contract_record_ref:
      "handoff-context-update-contract-record:send-slice-v0-1",
    source_route_integration_read_ref:
      "route-integration-read:send-slice-v0-1",
    source_runtime_current_working_perspective_ref:
      "runtime-cwp:send-slice-v0-1",
    source_applied_cwp_snapshot_ref: "applied-cwp:send-slice-v0-1",
    requested_send_surface: surface,
    requested_delivery_mode: deliveryMode,
    requested_recipient_ref: recipient,
    packet_payload_summary: {
      packet_format: envelope.packet_format,
      payload_hash: envelope.payload_hash,
      payload_type: envelope.payload_type,
      public_safe: true,
      raw_private_material_excluded: true,
    },
    proposed_send_envelope: envelope,
    proposed_send_steps: [
      "validate_exported_artifact_ref",
      "validate_payload_hash",
      "require_future_handoff_send_slice",
    ],
    proposed_send_preconditions: [
      "approved_handoff_send_contract_record",
      "payload_hash_revalidated",
    ],
    required_source_refs: sourceRefs,
    required_evidence_refs: evidenceRefs,
    blocked_live_mutations: ["live_handoff_context_mutation"],
    future_send_requirements: ["provider_specific_external_delivery_contract"],
    operator_acceptance_criteria: ["local_send_slice_must_not_send_externally"],
    rollback_and_fallback_plan: ["delete_local_send_record_if_operator_rejects"],
    contract_record_ref: recordRef,
  };
}

function buildContractRecord(overrides = {}) {
  const surface =
    overrides.requested_send_surface ?? "operator_manual_send_candidate";
  const deliveryMode =
    overrides.requested_delivery_mode ?? "manual_operator_delivery";
  const recipient = overrides.requested_recipient_ref ?? recipientRef;
  const envelope = overrides.proposed_send_envelope ?? buildEnvelope({
    requested_send_surface: surface,
    requested_delivery_mode: deliveryMode,
    requested_recipient_ref: recipient,
  });
  const recordId =
    overrides.record_id ?? "handoff-send-contract-record:send-slice-v0-1";
  const proposedContract =
    overrides.proposed_handoff_send_contract ??
    buildProposedContract({
      recordRef: recordId,
      surface,
      deliveryMode,
      envelope,
      recipient,
    });
  return {
    record_version: "handoff_send_contract_record.v0.1",
    record_id: recordId,
    idempotency_key: "idempotency:send-contract-source-v0-1",
    created_at: AS_OF,
    scope: "project:augnes",
    operator_ref: "operator:send-contract-source-v0-1",
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_exported_artifact_ref: envelope.source_exported_artifact_ref,
    source_handoff_packet_copy_export_record_ref:
      "handoff-packet-copy-export-record:send-slice-v0-1",
    source_handoff_packet_copy_export_contract_record_ref:
      "handoff-packet-copy-export-contract-record:send-slice-v0-1",
    source_applied_handoff_context_snapshot_ref:
      "applied-handoff-context-snapshot:send-slice-v0-1",
    source_handoff_context_apply_record_ref:
      "handoff-context-apply-record:send-slice-v0-1",
    source_handoff_context_update_contract_record_ref:
      "handoff-context-update-contract-record:send-slice-v0-1",
    source_route_integration_read_ref:
      "route-integration-read:send-slice-v0-1",
    source_runtime_current_working_perspective_ref:
      "runtime-cwp:send-slice-v0-1",
    source_applied_cwp_snapshot_ref: "applied-cwp:send-slice-v0-1",
    requested_send_surface: surface,
    requested_delivery_mode: deliveryMode,
    requested_recipient_ref: recipient,
    proposed_handoff_send_contract: proposedContract,
    proposed_send_envelope: envelope,
    proposed_send_steps: proposedContract.proposed_send_steps ?? [],
    proposed_send_preconditions: proposedContract.proposed_send_preconditions ?? [],
    authority_profile: {
      durable_local_handoff_send_contract: true,
      source_of_truth: false,
      local_project_handoff_send_contract_only: true,
      handoff_send_contract_written: true,
      handoff_sent: false,
      send_provider_called: false,
      external_messaging_called: false,
      email_called: false,
      slack_called: false,
      webhook_called: false,
    },
    review_status: "recorded_as_scoped_handoff_send_contract",
    persistence_horizon: "local_project_handoff_send_contract_store",
    no_handoff_send_performed: true,
    write_validation: {
      validation_version: "handoff_send_contract_write_validation.v0.1",
      operator_decision_preview_revalidated: true,
      proposed_send_contract_revalidated: true,
      proposed_send_envelope_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_send_provider_or_external_action: false,
      refused_metric_or_upstream_write: false,
      validation_hash: "validation-hash:send-contract-source-v0-1",
    },
    authority_boundary: {
      durable_local_handoff_send_contract: true,
      source_of_truth: false,
      local_project_handoff_send_contract_only: true,
      can_write_db: true,
      can_create_handoff_send_contract_record: true,
      can_create_handoff_send_contract_receipt: true,
      can_send_handoff: false,
      can_call_send_provider: false,
      can_call_external_messaging: false,
      can_call_email: false,
      can_call_slack: false,
      can_call_webhook: false,
      can_write_clipboard: false,
      can_download_file: false,
      can_write_arbitrary_file: false,
      can_mutate_handoff_context: false,
      can_write_memory: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_render_workbench_action_button: false,
    },
    notes: [],
    record_fingerprint: "fingerprint:send-contract-source-v0-1",
    ...overrides,
    proposed_send_envelope: envelope,
    proposed_handoff_send_contract: proposedContract,
  };
}

function buildContractReview({
  records = [buildContractRecord()],
  reviewStatus = "records_available",
  selectedRecordId = null,
  evidenceSummary = {},
} = {}) {
  return {
    review_version: "handoff_send_contract_record_review.v0.1",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: records.length,
      valid_record_count: reviewStatus === "records_invalid" ? 0 : records.length,
      invalid_record_count: reviewStatus === "records_invalid" ? records.length : 0,
      selected_record_id: selectedRecordId,
      selected_record_found: Boolean(
        selectedRecordId &&
          records.some((record) => record.record_id === selectedRecordId),
      ),
      latest_record_id: records[0]?.record_id ?? null,
      receipt_side_effect_problem_count:
        reviewStatus === "records_invalid" ? 1 : 0,
    },
    selected_record_summary: selectedRecordId ? { record_id: selectedRecordId } : null,
    latest_record_summary: records[0] ? { record_id: records[0].record_id } : null,
    records,
    evidence_summary: {
      supplied_record_count: records.length,
      valid_record_count: reviewStatus === "records_invalid" ? 0 : records.length,
      has_records: records.length > 0,
      has_selected_record: Boolean(
        selectedRecordId &&
          records.some((record) => record.record_id === selectedRecordId),
      ),
      has_source_refs: true,
      has_evidence_refs: records.some((record) => record.evidence_refs?.length),
      has_missing_evidence: records.length === 0,
      has_receipt_side_effect_problem: false,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: records.length ? [] : ["handoff_send_contract_records_missing"],
      problem_record_ids: [],
      ...evidenceSummary,
    },
    blocked_reasons:
      reviewStatus === "records_invalid"
        ? ["handoff_send_contract_record_side_effect_or_shape_problem"]
        : [],
    insufficient_data_reasons: records.length ? [] : ["handoff_send_contract_records_missing"],
  };
}

function buildExportedArtifactRead(artifactRef = "exported-artifact:send-slice-v0-1") {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    scope: "project:augnes",
    status: "latest_exported_handoff_packet_artifact_available",
    latest_exported_artifact: {
      artifact_version: "handoff_packet_exported_artifact.v0.1",
      artifact_ref: artifactRef,
      scope: "project:augnes",
    },
  };
}

function buildPreview(overrides = {}) {
  return buildHandoffSendPreviewV01({
    handoff_send_contract_record_review: buildContractReview(),
    exported_handoff_packet_artifact_read: buildExportedArtifactRead(),
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    requested_send_execution_mode: "manual_operator_send_fulfillment",
    manual_delivery_confirmation_ref: manualConfirmationRef,
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildDecision(preview, overrides = {}) {
  return buildHandoffSendOperatorDecisionPreviewV01({
    handoff_send_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent: "approve_for_handoff_send_record",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision, overrides = {}) {
  return {
    send_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_handoff_send_record",
      approved_by: "operator:send-slice-reviewer-v0-1",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:handoff-send-record-v0-1",
      checklist_confirmations: [
        "check:local-fulfillment-only",
        "check:no-external-delivery",
        "check:no-provider-or-system-call",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:send-slice-v0-1"],
    ...overrides,
  };
}

function assertNotReady(preview, message) {
  assert.notEqual(
    preview.send_preview_status,
    "ready_for_future_handoff_send_record_write",
    message,
  );
  assert.equal(preview.send_readiness.write_ready, false, message);
}

function assertNotReadyWithBlocker(preview, blocker, message) {
  assertNotReady(preview, message);
  assert(
    preview.blocking_reasons.includes(blocker),
    `${message}: missing blocker ${blocker}`,
  );
}

function assertForgedDirectRecordBlocks(record, blocker, message) {
  assertNotReadyWithBlocker(
    buildPreview({ handoff_send_contract_record: record }),
    blocker,
    message,
  );
}

function assertWriterRefusesWithoutSchema(input, message) {
  const db = new Database(":memory:");
  try {
    const result = writeHandoffSendRecordV01(input, { db });
    assert.equal(result.status, "refused", message);
    assert.equal(handoffSendWriteSchemaExistsV01(db), false, message);
    return result;
  } finally {
    db.close();
  }
}

function request(body, headers = {}) {
  return new Request("http://localhost/api/workplane/handoff-sends", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function responseJson(response) {
  return response.json();
}

assertNotReady(
  buildHandoffSendPreviewV01({ as_of: AS_OF }),
  "send preview must have no material without send contract review",
);
assertNotReady(
  buildPreview({ handoff_send_contract_record_review: { bad: true } }),
  "malformed send contract record review must not be ready",
);
assertNotReady(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      reviewStatus: "records_invalid",
    }),
  }),
  "records_invalid send contract review must not be ready",
);
assertNotReady(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      selectedRecordId: "handoff-send-contract-record:missing",
    }),
  }),
  "missing selected send contract record must not be ready",
);
assertNotReady(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      records: [
        buildContractRecord({
          proposed_handoff_send_contract: { contract_kind: "bad" },
        }),
      ],
    }),
  }),
  "malformed proposed handoff send contract must not be ready",
);
assertNotReady(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      records: [
        buildContractRecord({
          proposed_send_envelope: { envelope_version: "bad" },
        }),
      ],
    }),
  }),
  "malformed proposed send envelope must not be ready",
);
assertNotReady(
  buildPreview({ requested_send_execution_mode: undefined }),
  "missing send execution mode must not be ready",
);
const unsupportedMode = buildPreview({
  requested_send_execution_mode: "external_provider_send_now",
});
assertNotReady(unsupportedMode, "unsupported send execution mode must not be ready");
assert(
  unsupportedMode.refusal_reasons.includes("requested_send_execution_mode_unsupported"),
);
assertNotReady(
  buildPreview({ manual_delivery_confirmation_ref: undefined }),
  "manual fulfillment requires manual confirmation ref",
);
assertNotReady(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      records: [
        buildContractRecord({
          requested_send_surface: "local_send_queue_candidate",
          requested_delivery_mode: "deferred_send_queue",
        }),
      ],
    }),
  }),
  "manual fulfillment must match manual contract surface and delivery mode",
);
assertNotReady(
  buildPreview({
    requested_send_execution_mode: "local_deferred_send_queue_fulfillment",
    manual_delivery_confirmation_ref: undefined,
  }),
  "deferred queue fulfillment requires local queue ref",
);
const queueReadyPreview = buildPreview({
  handoff_send_contract_record_review: buildContractReview({
    records: [
      buildContractRecord({
        requested_send_surface: "local_send_queue_candidate",
        requested_delivery_mode: "deferred_send_queue",
      }),
    ],
  }),
  requested_send_execution_mode: "local_deferred_send_queue_fulfillment",
  manual_delivery_confirmation_ref: undefined,
  local_queue_ref: localQueueRef,
});
assert.equal(
  queueReadyPreview.send_preview_status,
  "ready_for_future_handoff_send_record_write",
);
assertNotReady(
  buildPreview({
    requested_send_execution_mode: "local_deferred_send_queue_fulfillment",
    local_queue_ref: localQueueRef,
    manual_delivery_confirmation_ref: undefined,
  }),
  "deferred queue fulfillment must match queue contract surface and delivery mode",
);
const providerDryRunMissing = buildPreview({
  requested_send_execution_mode: "provider_send_dry_run_fulfillment",
  manual_delivery_confirmation_ref: undefined,
});
assertNotReady(providerDryRunMissing, "provider dry run requires confirmation ref");
const providerDryRunReady = buildPreview({
  requested_send_execution_mode: "provider_send_dry_run_fulfillment",
});
assert.equal(
  providerDryRunReady.proposed_handoff_send_fulfillment
    .no_external_delivery_summary.provider_call_performed,
  false,
);
const codexDryRunReady = buildPreview({
  requested_send_execution_mode: "codex_session_transfer_dry_run_fulfillment",
});
assert.equal(
  codexDryRunReady.proposed_handoff_send_fulfillment
    .no_external_delivery_summary.codex_transfer_performed,
  false,
);
assertNotReady(
  buildPreview({ source_refs: [] }),
  "source refs must be supplied",
);
assertNotReady(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      records: [buildContractRecord({ evidence_refs: [] })],
    }),
  }),
  "evidence refs must be supplied by the contract record",
);
assertNotReady(
  buildPreview({ requested_operator_ref: undefined }),
  "operator ref must be supplied",
);
assertNotReady(
  buildPreview({ requested_idempotency_key: undefined }),
  "idempotency key must be supplied",
);
assertNotReady(
  buildPreview({ review_confirmation_ref: undefined }),
  "review confirmation must be supplied",
);
const unsafeRefs = buildPreview({ requested_operator_ref: "secret:operator" });
assertNotReady(unsafeRefs, "unsafe refs must be refused");
assert(unsafeRefs.refusal_reasons.includes("handoff_send_refs_unsafe"));
assertNotReady(
  buildPreview({
    handoff_send_contract_record: {
      ...buildContractRecord(),
      raw_text: "private material",
    },
  }),
  "raw material keys must be refused",
);

for (const field of ["handoff_sent", "send_provider_called"]) {
  const forged = buildContractRecord();
  forged.authority_profile = {
    ...forged.authority_profile,
    [field]: true,
  };
  assertForgedDirectRecordBlocks(
    forged,
    "handoff_send_contract_record_authority_profile_invalid",
    `forged direct source contract authority_profile ${field} must block`,
  );
}

for (const field of [
  "email_called",
  "slack_called",
  "webhook_called",
  "metric_update_performed",
]) {
  const forged = buildContractRecord();
  forged.authority_profile = {
    ...forged.authority_profile,
    [field]: true,
  };
  assertForgedDirectRecordBlocks(
    forged,
    "handoff_send_contract_record_authority_profile_invalid",
    `forged direct source contract authority_profile ${field} must block`,
  );
}

for (const field of [
  "can_call_send_provider",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
]) {
  const forged = buildContractRecord();
  forged.authority_boundary = {
    ...forged.authority_boundary,
    [field]: true,
  };
  assertForgedDirectRecordBlocks(
    forged,
    "handoff_send_contract_record_authority_boundary_invalid",
    `forged direct source contract authority_boundary ${field} must block`,
  );
}

for (const field of [
  "can_modify_api_perspective_current_route",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_current_working_perspective_apply_record",
  "can_write_continuity_relay",
  "can_apply_live_relay_state",
  "can_write_memory",
  "can_write_dogfood_metrics",
  "can_create_pr",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
]) {
  const forged = buildContractRecord();
  forged.authority_boundary = {
    ...forged.authority_boundary,
    [field]: true,
  };
  assertForgedDirectRecordBlocks(
    forged,
    "handoff_send_contract_record_authority_boundary_invalid",
    `forged direct source contract authority_boundary ${field} must block`,
  );
}

const directNoHandoff = buildPreview({
  handoff_send_contract_record: {
    ...buildContractRecord(),
    no_handoff_send_performed: false,
  },
});
assertNotReadyWithBlocker(
  directNoHandoff,
  "handoff_send_contract_record_malformed",
  "direct source contract no_handoff_send_performed false must block",
);
assertNotReadyWithBlocker(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      records: [
        {
          ...buildContractRecord(),
          no_handoff_send_performed: false,
        },
      ],
    }),
  }),
  "handoff_send_contract_record_no_handoff_send_performed_invalid",
  "review-selected source contract no_handoff_send_performed false must block",
);

const forgedNoSideEffects = buildContractRecord();
forgedNoSideEffects.no_side_effects = { handoff_sent: true };
assertForgedDirectRecordBlocks(
  forgedNoSideEffects,
  "handoff_send_contract_record_no_side_effects_invalid",
  "forged source contract no_side_effects handoff_sent true must block",
);

const mismatchedContractEnvelope = buildContractRecord();
mismatchedContractEnvelope.proposed_send_envelope = {
  ...mismatchedContractEnvelope.proposed_send_envelope,
  payload_hash: "payload-hash:mismatched-source-contract",
};
assertForgedDirectRecordBlocks(
  mismatchedContractEnvelope,
  "handoff_send_contract_record_contract_envelope_mismatch",
  "source contract and envelope mismatch must block",
);

assertNotReadyWithBlocker(
  buildPreview({
    handoff_send_contract_record_review: buildContractReview({
      evidenceSummary: { has_receipt_side_effect_problem: true },
    }),
  }),
  "handoff_send_contract_record_review_receipt_side_effect_invalid",
  "send contract review receipt side-effect problem must block",
);

for (const [reviewStatus, blocker] of [
  ["schema_missing", "handoff_send_contract_record_review_schema_missing"],
  ["no_records", "handoff_send_contract_record_review_no_records"],
  [
    "selected_record_missing",
    "handoff_send_contract_record_review_selected_record_missing",
  ],
]) {
  assertNotReadyWithBlocker(
    buildPreview({
      handoff_send_contract_record_review: buildContractReview({
        records: reviewStatus === "no_records" ? [] : [buildContractRecord()],
        reviewStatus,
        selectedRecordId:
          reviewStatus === "selected_record_missing"
            ? "handoff-send-contract-record:missing"
            : null,
      }),
    }),
    blocker,
    `send contract review status ${reviewStatus} must block without direct record`,
  );
}

const readyPreview = buildPreview();
assert.equal(
  readyPreview.send_preview_status,
  "ready_for_future_handoff_send_record_write",
);
assert.equal(readyPreview.send_readiness.write_ready, true);
assert.equal(
  readyPreview.proposed_handoff_send_fulfillment.fulfillment_status,
  "locally_fulfilled_manual_operator_send",
);
assert.equal(
  readyPreview.proposed_handoff_send_receipt_preview.external_delivery_performed,
  false,
);
for (const [key, value] of Object.entries(readyPreview.authority_boundary)) {
  if (key.startsWith("can_")) assert.equal(value, false, `${key} must be false`);
}

const missingDecision = buildHandoffSendOperatorDecisionPreviewV01({
  handoff_send_preview: buildPreview({ requested_operator_ref: undefined }),
  requested_operator_ref: operatorRef,
  requested_idempotency_key: idempotencyKey,
  review_confirmation_ref: reviewRef,
  operator_decision_intent: "approve_for_handoff_send_record",
  source_refs: sourceRefs,
});
assert.notEqual(
  missingDecision.decision_preview_status,
  "ready_for_future_handoff_send_record_write",
);
const decisionWithoutIntent = buildDecision(readyPreview, {
  operator_decision_intent: undefined,
});
assert.notEqual(
  decisionWithoutIntent.decision_preview_status,
  "ready_for_future_handoff_send_record_write",
);
const readyDecision = buildDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_handoff_send_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);

assertWriterRefusesWithoutSchema(
  buildWriteInput(decisionWithoutIntent),
  "writer must refuse non-ready decision previews without schema",
);
assertWriterRefusesWithoutSchema(
  buildWriteInput(readyDecision, { idempotency_key: "idempotency:mismatch" }),
  "writer must refuse idempotency mismatch",
);
assertWriterRefusesWithoutSchema(
  buildWriteInput(readyDecision, {
    operator_approval: {
      ...buildWriteInput(readyDecision).operator_approval,
      operator_ref: "operator:mismatch",
    },
  }),
  "writer must refuse operator ref mismatch",
);
assertWriterRefusesWithoutSchema(
  buildWriteInput(readyDecision, { notes: ["secret:note"] }),
  "writer must refuse unsafe refs",
);
assertWriterRefusesWithoutSchema(
  buildWriteInput(readyDecision, { notes: ["workbench:default"] }),
  "writer must refuse sample/default/workbench material",
);
assertWriterRefusesWithoutSchema(
  {
    ...buildWriteInput(readyDecision),
    raw_text: "private material",
  },
  "writer must refuse raw private material",
);
for (const field of [
  "handoff_sent",
  "handoff_sent_externally",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "provider_called",
  "github_called",
  "codex_executed",
  "codex_session_transferred",
  "browser_or_crawler_called",
  "network_send_performed",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "selected_refs_written_to_live_handoff",
  "memory_written",
]) {
  assertWriterRefusesWithoutSchema(
    buildWriteInput(readyDecision, {
      requested_side_effects: { [field]: true },
    }),
    `writer must refuse requested side effect ${field}`,
  );
}
const malformedFulfillmentPreview = clone(readyPreview);
malformedFulfillmentPreview.would_write_handoff_send_record_preview
  .proposed_handoff_send_fulfillment.fulfillment_version = "bad";
assertWriterRefusesWithoutSchema(
  buildWriteInput(buildDecision(malformedFulfillmentPreview)),
  "writer must refuse malformed fulfillment",
);
const forgedPreviewAuthority = clone(readyPreview);
forgedPreviewAuthority.authority_boundary.can_call_send_provider = true;
assertWriterRefusesWithoutSchema(
  buildWriteInput(buildDecision(forgedPreviewAuthority)),
  "writer must refuse forged preview authority",
);
const forgedDecisionAuthority = clone(readyDecision);
forgedDecisionAuthority.authority_boundary.can_call_email = true;
assertWriterRefusesWithoutSchema(
  buildWriteInput(forgedDecisionAuthority),
  "writer must refuse forged decision authority",
);
const forgedFulfillmentAuthority = clone(readyPreview);
forgedFulfillmentAuthority.would_write_handoff_send_record_preview
  .proposed_handoff_send_fulfillment.authority_boundary.can_call_webhook = true;
assertWriterRefusesWithoutSchema(
  buildWriteInput(buildDecision(forgedFulfillmentAuthority)),
  "writer must refuse forged fulfillment authority",
);

const db = new Database(path.join(root, dbPath));
const writeInput = buildWriteInput(readyDecision);
const written = writeHandoffSendRecordV01(writeInput, { db });
assert.equal(written.status, "written");
assert.equal(written.record.record_version, "handoff_send_record.v0.1");
assert.equal(written.record.scope, "project:augnes");
assert.equal(written.record.review_status, "recorded_as_scoped_local_handoff_send_fulfillment");
assert.equal(written.record.no_external_delivery_performed, true);
for (const field of [
  "handoff_send_record_written",
  "handoff_send_receipt_written",
  "handoff_send_persisted",
  "local_handoff_send_fulfillment_recorded",
]) {
  assert.equal(written.receipt.no_side_effects[field], true, `${field} true`);
}
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(written.receipt.no_side_effects[field], false, `${field} false`);
}
const replay = writeHandoffSendRecordV01(writeInput, { db });
assert.equal(replay.status, "idempotent_existing");
for (const field of [
  "handoff_send_record_written",
  "handoff_send_receipt_written",
  "handoff_send_persisted",
  "local_handoff_send_fulfillment_recorded",
]) {
  assert.equal(replay.receipt.no_side_effects[field], false, `${field} replay false`);
}
const conflictPreview = buildPreview({
  manual_delivery_confirmation_ref: "manual-confirm:send-slice-conflict-v0-1",
});
const conflict = writeHandoffSendRecordV01(
  buildWriteInput(buildDecision(conflictPreview)),
  { db },
);
assert.equal(conflict.status, "conflict");
assert.equal(
  readHandoffSendRecordByIdV01(written.record.record_id, { db }).status,
  "read",
);
assert.equal(
  readHandoffSendRecordByIdempotencyKeyV01(idempotencyKey, { db }).status,
  "read",
);
assert.equal(listHandoffSendRecordsV01({ db, limit: 100 }).records.length, 1);
db.close();

const schemaDb = new Database(":memory:");
assert.equal(readHandoffSendRecordByIdV01("missing", { db: schemaDb }).status, "schema_missing");
assert.equal(listHandoffSendRecordsV01({ db: schemaDb }).status, "schema_missing");
assert.equal(handoffSendWriteSchemaExistsV01(schemaDb), false);
schemaDb.close();

const scopedDb = new Database(":memory:");
ensureHandoffSendWriteSchemaV01(scopedDb);
const outRecord = {
  ...written.record,
  scope: "project:other",
  record_id: "handoff-send:out-of-scope-v0-1",
};
scopedDb
  .prepare(
    `INSERT INTO handoff_send_records (
      record_id, idempotency_key, created_at, scope, operator_ref,
      send_surface, delivery_mode, recipient_ref, send_execution_mode,
      fulfillment_status, source_handoff_send_contract_record_ref,
      source_exported_artifact_ref, record_fingerprint, record_json, receipt_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  .run(
    outRecord.record_id,
    outRecord.idempotency_key,
    outRecord.created_at,
    outRecord.scope,
    outRecord.operator_ref,
    outRecord.requested_send_surface,
    outRecord.requested_delivery_mode,
    outRecord.requested_recipient_ref,
    outRecord.requested_send_execution_mode,
    outRecord.fulfillment_status,
    outRecord.source_handoff_send_contract_record_ref,
    outRecord.source_exported_artifact_ref,
    outRecord.record_fingerprint,
    JSON.stringify(outRecord),
    JSON.stringify(written.receipt),
  );
assert.equal(listHandoffSendRecordsV01({ db: scopedDb }).records.length, 0);
assert.equal(
  readHandoffSendRecordByIdV01(outRecord.record_id, { db: scopedDb }).status,
  "not_found",
);
assert.equal(
  writeHandoffSendRecordV01(writeInput, { db: scopedDb }).status,
  "written",
);
scopedDb.close();

assert.equal(buildHandoffSendRecordReviewV01().review_status, "no_records");
const validReview = buildHandoffSendRecordReviewV01({ store_result: written });
assert.equal(validReview.review_status, "records_available");
assert.equal(validReview.input_summary.valid_record_count, 1);
assert.equal(validReview.receipt_no_side_effects_summary.local_fulfillment_recorded_only, true);
assert.equal(
  buildHandoffSendRecordReviewV01({ records: [{ record_id: "bad" }] }).review_status,
  "records_invalid",
);
assert.equal(
  buildHandoffSendRecordReviewV01({
    store_result: {
      ...written,
      receipt: {
        ...written.receipt,
        no_side_effects: {
          ...written.receipt.no_side_effects,
          email_called: true,
        },
      },
    },
  }).review_status,
  "records_invalid",
);
for (const forged of [
  { authority_profile: { ...written.record.authority_profile, send_provider_called: true } },
  { no_external_delivery_performed: false },
  { no_side_effects: { ...written.receipt.no_side_effects, slack_called: true } },
  { authority_boundary: { ...written.record.authority_boundary, can_call_webhook: true } },
  { raw_text: "private material" },
]) {
  assert.equal(
    buildHandoffSendRecordReviewV01({
      records: [{ ...written.record, ...forged }],
    }).review_status,
    "records_invalid",
  );
}

assert.equal(
  readHandoffSendRecordReviewForWebV01().review_status,
  "no_records",
);
assert.equal(
  readSentHandoffForWebV01().status,
  "no_handoff_send_fulfillment",
);
const sentRead = readSentHandoffForWebV01({ store_result: written });
assert.equal(sentRead.status, "latest_handoff_send_fulfillment_available");
assert.equal(sentRead.latest_fulfillment_summary.record_id, written.record.record_id);

for (const unsafePath of [
  "/tmp/handoff-sends/bad.db",
  ".tmp/handoff-sends/../bad.db",
  ".tmp/handoff-sends/private-key.db",
  ".tmp//handoff-sends/bad.db",
]) {
  assert.equal(route.isSafeHandoffSendRouteDbPathV01(unsafePath), false);
}

assert.equal((await route.POST(request("{"))).status, 400);
assert.equal((await route.POST(request([]))).status, 400);
assert.equal(
  (await route.POST(request({ action: "write", db_path: "../bad.db", input: writeInput }))).status,
  400,
);
assert.equal(
  (
    await route.POST(
      request(
        { action: "write", db_path: ".tmp/handoff-sends/cross-site.db", input: writeInput },
        {
          origin: "http://evil.example",
          "sec-fetch-site": "cross-site",
        },
      ),
    )
  ).status,
  403,
);
for (const action of [
  "delete",
  "update",
  "apply",
  "send",
  "run",
  "execute",
  "merge",
  "approve",
  "import",
  "export",
  "copy",
  "download",
  "clipboard",
  "email",
  "slack",
  "webhook",
  "provider",
  "network",
]) {
  assert.equal(
    (
      await route.POST(
        request({ action, db_path: ".tmp/handoff-sends/action.db", input: writeInput }),
      )
    ).status,
    400,
    `route must reject action ${action}`,
  );
}
const invalidRoutePath = ".tmp/handoff-sends/invalid-write.db";
rmSync(path.join(root, invalidRoutePath), { force: true });
assert.equal(
  (
    await route.POST(
      request({
        action: "write",
        db_path: invalidRoutePath,
        input: buildWriteInput(decisionWithoutIntent),
      }),
    )
  ).status,
  400,
);
assert.equal(existsSync(path.join(root, invalidRoutePath)), false);

const routeDbPath = ".tmp/handoff-sends/route.db";
const routeIdempotencyKey = "idempotency:send-slice-route-v0-1";
const routePreview = buildPreview({
  requested_idempotency_key: routeIdempotencyKey,
});
const routeDecision = buildHandoffSendOperatorDecisionPreviewV01({
  handoff_send_preview: routePreview,
  requested_operator_ref: operatorRef,
  requested_idempotency_key: routeIdempotencyKey,
  review_confirmation_ref: reviewRef,
  operator_decision_intent: "approve_for_handoff_send_record",
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
const routeInput = buildWriteInput(routeDecision, {
  idempotency_key: routeIdempotencyKey,
});
const routeResponse = await route.POST(
  request(
    { action: "write", db_path: routeDbPath, input: routeInput },
    {
      host: "internal.localhost",
      "x-forwarded-host": "localhost",
      origin: "http://localhost",
    },
  ),
);
assert.equal(routeResponse.status, 201);
const routeJson = await responseJson(routeResponse);
assert.equal(routeJson.handoff_send_record_written, true);
assert.equal(routeJson.local_handoff_send_fulfillment_recorded, true);
assert.equal(routeJson.handoff_sent_externally, false);
assert.equal(routeJson.handoff_send_contract_record_written, false);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(routeJson[field], false, `route ${field} false`);
  assert.equal(routeJson.no_side_effects[field], false, `route receipt ${field} false`);
}
const routeReplayResponse = await route.POST(
  request({ action: "write", db_path: routeDbPath, input: routeInput }),
);
assert.equal(routeReplayResponse.status, 200);
const routeReplayJson = await responseJson(routeReplayResponse);
assert.equal(routeReplayJson.store_result.status, "idempotent_existing");
assert.equal(routeReplayJson.no_side_effects.handoff_send_record_written, false);
assert.equal(routeReplayJson.no_side_effects.local_handoff_send_fulfillment_recorded, false);
const routeReadResponse = await route.GET(
  new Request(
    `http://localhost/api/workplane/handoff-sends?db_path=${encodeURIComponent(routeDbPath)}&idempotency_key=${encodeURIComponent(routeIdempotencyKey)}`,
  ),
);
assert.equal(routeReadResponse.status, 200);

for (const panelFile of [
  "components/workplane/handoff-send-preview-panel.tsx",
  "components/workplane/handoff-send-decision-panel.tsx",
  "components/workplane/handoff-send-record-review-panel.tsx",
  "components/workplane/sent-handoff-panel.tsx",
]) {
  const text = textByFile.get(panelFile);
  assert(!/<button\b/i.test(text), `${panelFile} must not render buttons`);
  assert(!/onClick\s*=/i.test(text), `${panelFile} must not include onClick`);
  assert(!/send provider called/i.test(text), `${panelFile} must not imply provider call`);
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  handoff_send_contract_record_review: buildContractReview(),
  handoff_send_preview: readyPreview,
  handoff_send_decision_preview: readyDecision,
  handoff_send_record_review: validReview,
  sent_handoff_read: sentRead,
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
const overviewNeedsPreview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  handoff_send_contract_record_review: buildContractReview(),
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
const overviewNeedsWrite = buildWorkbenchDogfoodLoopSpineOverviewV01({
  handoff_send_contract_record_review: buildContractReview(),
  handoff_send_preview: readyPreview,
  handoff_send_decision_preview: readyDecision,
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
const overviewBlocked = buildWorkbenchDogfoodLoopSpineOverviewV01({
  handoff_send_record_review: buildHandoffSendRecordReviewV01({
    records: [{ ...written.record, no_external_delivery_performed: false }],
  }),
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
for (const stepId of [
  "handoff_send_preview",
  "handoff_send_decision",
  "handoff_send_record",
  "sent_handoff_status",
]) {
  assert(stepIds.includes(stepId), `overview missing ${stepId}`);
}
const overviewText = [
  overview,
  overviewNeedsPreview,
  overviewNeedsWrite,
  overviewBlocked,
].map((value) => JSON.stringify(value)).join("\n");
for (const action of [
  "review_handoff_send_preview",
  "approve_handoff_send_record",
  "write_handoff_send_record",
  "review_handoff_send_record",
  "review_sent_handoff_status",
  "resolve_handoff_send_blockers",
  "prepare_external_handoff_delivery_contract",
]) {
  assert(overviewText.includes(action), `overview missing action ${action}`);
}
const forbiddenOverviewActions = new Set([
  "send_handoff",
  "call_send_provider",
  "call_email",
  "call_slack",
  "call_webhook",
  "write_clipboard",
  "download_file",
  "write_arbitrary_file",
  "mutate_live_handoff",
  "write_memory",
  "write_metrics",
  "execute_codex",
  "create_graph_or_vector_store",
]);
assert(!forbiddenOverviewActions.has(overview.recommended_next_operator_action));
for (const step of overview.spine_steps) {
  assert(!forbiddenOverviewActions.has(step.recommended_next_action));
}

rmSync(tempDir, { recursive: true, force: true });

console.log("smoke-handoff-send-slice-v0-1: ok");
