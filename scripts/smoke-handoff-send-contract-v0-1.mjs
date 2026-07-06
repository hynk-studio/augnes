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
  scriptName: "smoke:handoff-send-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-send-contract-v0-1.mjs",
});

const expectedFiles = [
  "types/handoff-send-contract-preview.ts",
  "lib/workplane/handoff-send-contract-preview.ts",
  "components/workplane/handoff-send-contract-preview-panel.tsx",
  "types/handoff-send-contract-decision.ts",
  "lib/workplane/handoff-send-contract-decision.ts",
  "components/workplane/handoff-send-contract-decision-panel.tsx",
  "types/handoff-send-contract-write.ts",
  "lib/workplane/handoff-send-contract-write.ts",
  "app/api/workplane/handoff-send-contracts/route.ts",
  "types/handoff-send-contract-record-review.ts",
  "lib/workplane/handoff-send-contract-record-review.ts",
  "lib/workplane/read-handoff-send-contract-record-review-for-web.ts",
  "components/workplane/handoff-send-contract-record-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
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
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-contract-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 13)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "handoff_send_contract_v0_1",
});

const textByFile = loadTextByFile(
  expectedFiles.filter((file) => existsSync(path.join(root, file))),
);
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "handoff_send_contract_preview.v0.1",
  "handoff_send_contract_operator_decision_preview.v0.1",
  "handoff_send_contract_record.v0.1",
  "handoff_send_contract_receipt.v0.1",
  "handoff_send_contract_store.v0.1",
  "handoff_send_contract_record_review.v0.1",
  "handoff_send_envelope.v0.1",
  "review_handoff_send_contract",
  "approve_handoff_send_contract_record",
  "write_handoff_send_contract_record",
  "review_handoff_send_contract_record",
  "resolve_handoff_send_contract_blockers",
  "prepare_handoff_send_slice",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const previewLib = await import(
  "../lib/workplane/handoff-send-contract-preview.ts"
);
const decisionLib = await import(
  "../lib/workplane/handoff-send-contract-decision.ts"
);
const writeLib = await import(
  "../lib/workplane/handoff-send-contract-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/handoff-send-contract-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-handoff-send-contract-record-review-for-web.ts"
);
const copyExportPreviewLib = await import(
  "../lib/workplane/handoff-packet-copy-export-preview.ts"
);
const route = await import("../app/api/workplane/handoff-send-contracts/route.ts");
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const { buildHandoffSendContractPreviewV01 } = previewLib;
const { buildHandoffSendContractOperatorDecisionPreviewV01 } = decisionLib;
const { buildHandoffSendContractRecordReviewV01 } = reviewLib;
const {
  calculateHandoffPacketExportedArtifactPayloadHashV01,
  createHandoffPacketCopyExportPreviewAuthorityBoundaryV01,
} = copyExportPreviewLib;

const AS_OF = "2026-07-06T00:00:00.000Z";
const sourceRefs = ["source:handoff-send-contract-v0-1"];
const evidenceRefs = ["evidence:handoff-send-contract-v0-1"];
const operatorRef = "operator:handoff-send-contract-v0-1";
const idempotencyKey = "idempotency:handoff-send-contract-v0-1";
const reviewRef = "review:handoff-send-contract-v0-1";
const recipientRef = "recipient:manual-operator";
const dbPath = ".tmp/handoff-send-contracts/send-contract.db";
const tempDir = path.join(root, ".tmp/handoff-send-contracts");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const forbiddenNoSideEffectFields = [
  "handoff_sent",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "provider_called",
  "github_called",
  "codex_executed",
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

function buildArtifact(overrides = {}) {
  const base = {
    artifact_version: "handoff_packet_exported_artifact.v0.1",
    artifact_ref: "handoff-packet-exported-artifact:valid-send-contract",
    scope: "project:augnes",
    as_of: AS_OF,
    packet_family: "augnes_operator_handoff_packet",
    packet_format: "operator_handoff_packet_markdown",
    copy_export_target: "operator_copy_surface_candidate",
    source_copy_export_contract_record_ref:
      "handoff-packet-copy-export-contract:valid",
    source_applied_handoff_context_snapshot_ref:
      "applied-handoff-context-snapshot:valid",
    source_handoff_context_apply_record_ref: "handoff-context-apply:valid",
    source_handoff_context_update_contract_record_ref:
      "handoff-context-update-contract:valid",
    source_route_integration_read_ref: "route-integration-read:valid",
    source_runtime_current_working_perspective_ref:
      "runtime-current-working-perspective:valid",
    source_applied_cwp_snapshot_ref: "applied-cwp-snapshot:valid",
    packet_manifest: {
      manifest_version: "handoff_packet_manifest.v0.1",
      packet_ref: "handoff-packet:valid",
      packet_title: "Handoff Packet",
      packet_format: "operator_handoff_packet_markdown",
      packet_target: "operator_copy_surface_candidate",
      entry_count: 1,
      public_safe: true,
      raw_private_material_excluded: true,
      copy_export_not_performed: true,
      send_not_performed: true,
    },
    packet_entries: [
      {
        packet_entry_ref: "handoff-packet-entry:valid",
        packet_section: "summary",
        entry_kind: "summary",
        summary: "Public safe handoff packet summary.",
        source_refs: sourceRefs,
        evidence_refs: evidenceRefs,
        public_safe: true,
        raw_private_material_excluded: true,
        authority_required: "future_handoff_packet_copy_export",
      },
    ],
    packet_entry_count: 1,
    packet_section_counts: { summary: 1 },
    markdown_payload: "# Handoff Packet\n\n- Public safe handoff packet summary.",
    json_payload: null,
    capsule_payload: null,
    payload_hash: "",
    public_safety_summary: {
      public_safe: true,
      raw_private_material_excluded: true,
      raw_text_excluded: true,
      raw_report_excluded: true,
      raw_excerpt_excluded: true,
    },
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    artifact_metadata: {
      local_artifact_only: true,
      clipboard_write_not_performed: true,
      file_write_not_performed: true,
      download_not_performed: true,
      handoff_send_not_performed: true,
      future_user_surface_copy_export_required: true,
      future_handoff_send_contract_required: true,
    },
    authority_boundary: createHandoffPacketCopyExportPreviewAuthorityBoundaryV01(),
  };
  const merged = deepMerge(base, overrides);
  if (!overrides.payload_hash) {
    merged.payload_hash = calculateHandoffPacketExportedArtifactPayloadHashV01({
      packet_format: merged.packet_format,
      markdown_payload: merged.markdown_payload,
      json_payload: merged.json_payload,
      capsule_payload: merged.capsule_payload,
    });
  }
  return merged;
}

function buildRecord(overrides = {}) {
  return {
    record_id: "handoff-packet-copy-export:valid",
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    exported_artifact_ref:
      overrides.exported_artifact_ref ??
      "handoff-packet-exported-artifact:valid-send-contract",
    ...overrides,
  };
}

function buildArtifactRead(artifact = buildArtifact(), record = buildRecord()) {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    status: "latest_exported_handoff_packet_artifact_available",
    scope: "project:augnes",
    latest_exported_artifact: artifact,
    latest_record: record,
    summary: {
      exported_artifact_ref: artifact.artifact_ref,
      source_copy_export_contract_record_ref:
        artifact.source_copy_export_contract_record_ref,
      source_applied_handoff_context_snapshot_ref:
        artifact.source_applied_handoff_context_snapshot_ref,
      packet_format: artifact.packet_format,
      copy_export_target: artifact.copy_export_target,
      as_of: artifact.as_of,
      packet_entry_count: artifact.packet_entry_count,
      packet_section_counts: artifact.packet_section_counts,
      has_markdown_payload: Boolean(artifact.markdown_payload),
      has_json_payload: Boolean(artifact.json_payload),
      has_capsule_payload: Boolean(artifact.capsule_payload),
      clipboard_write_still_pending: true,
      download_or_file_write_still_pending: true,
      send_still_pending: true,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_write_clipboard: false,
      can_download_file: false,
      can_write_arbitrary_file: false,
      can_send_handoff: false,
      can_mutate_memory: false,
      can_call_github: false,
      can_call_provider_openai: false,
    },
  };
}

function buildCopyExportReview({
  artifact = buildArtifact(),
  record = buildRecord(),
  status = "records_available",
  sideEffectProblem = false,
  includeArtifact = true,
} = {}) {
  return {
    review_version: "handoff_packet_copy_export_record_review.v0.1",
    scope: "project:augnes",
    review_status: status,
    input_summary: {
      valid_record_count: status === "records_invalid" ? 0 : 1,
      receipt_side_effect_problem_count: sideEffectProblem ? 1 : 0,
    },
    records: status === "records_invalid" ? [] : [record],
    exported_artifacts: includeArtifact ? [artifact] : [],
    evidence_summary: {
      has_receipt_side_effect_problem: sideEffectProblem,
      evidence_refs: evidenceRefs,
      source_refs: sourceRefs,
      problem_record_ids: sideEffectProblem ? [record.record_id] : [],
    },
  };
}

function buildReadyPreview(overrides = {}) {
  const artifact = overrides.artifact ?? buildArtifact();
  const record = overrides.record ?? buildRecord({
    exported_artifact_ref: artifact.artifact_ref,
  });
  return buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(artifact, record),
    handoff_packet_copy_export_record_review: buildCopyExportReview({
      artifact,
      record,
    }),
    requested_send_surface:
      overrides.requested_send_surface ?? "operator_manual_send_candidate",
    requested_delivery_mode:
      overrides.requested_delivery_mode ?? "manual_operator_delivery",
    requested_recipient_ref: overrides.requested_recipient_ref ?? recipientRef,
    requested_operator_ref: overrides.requested_operator_ref ?? operatorRef,
    requested_idempotency_key:
      overrides.requested_idempotency_key ?? idempotencyKey,
    review_confirmation_ref: overrides.review_confirmation_ref ?? reviewRef,
    source_refs: overrides.source_refs ?? sourceRefs,
    as_of: AS_OF,
  });
}

function buildReadyDecision(preview = buildReadyPreview()) {
  return buildHandoffSendContractOperatorDecisionPreviewV01({
    handoff_send_contract_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent: "approve_for_handoff_send_contract_record",
    source_refs: sourceRefs,
    as_of: AS_OF,
  });
}

function buildWriteInput(decision = buildReadyDecision(), overrides = {}) {
  return {
    operator_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_handoff_send_contract_record",
      approved_by: "operator:handoff-send-contract-reviewer",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:handoff-send-contract-record",
      checklist_confirmations: [
        "confirm:future-send-slice-required",
        "confirm:no-provider-call",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:handoff-send-contract-record"],
    ...overrides,
  };
}

assert.equal(
  buildHandoffSendContractPreviewV01({ as_of: AS_OF }).contract_preview_status,
  "no_exported_handoff_packet_artifact",
);
assert.notEqual(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: {
      read_version: "exported_handoff_packet_artifact_read.v0.1",
      status: "no_exported_handoff_packet_artifact",
      scope: "project:augnes",
    },
    as_of: AS_OF,
  }).contract_preview_status,
  "ready_for_future_handoff_send_contract_record_write",
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: { bad: true },
    as_of: AS_OF,
  }).blocking_reasons.includes("exported_handoff_packet_artifact_read_malformed"),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact: { bad: true },
    as_of: AS_OF,
  }).blocking_reasons.includes("exported_handoff_packet_artifact_malformed"),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(
      buildArtifact({ markdown_payload: "", payload_hash: "bad" }),
    ),
    as_of: AS_OF,
  }).blocking_reasons.includes(
    "exported_handoff_packet_artifact_payload_hash_mismatch",
  ),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(
      buildArtifact({ payload_hash: "bad-hash" }),
    ),
    as_of: AS_OF,
  }).blocking_reasons.includes(
    "exported_handoff_packet_artifact_payload_hash_mismatch",
  ),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(
      buildArtifact({
        authority_boundary: {
          ...createHandoffPacketCopyExportPreviewAuthorityBoundaryV01(),
          can_send_handoff: true,
        },
      }),
    ),
    as_of: AS_OF,
  }).blocking_reasons.includes("exported_artifact_authority_forbidden_can_send_handoff"),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    handoff_packet_copy_export_record_review: buildCopyExportReview({
      status: "records_invalid",
    }),
    as_of: AS_OF,
  }).blocking_reasons.includes(
    "handoff_packet_copy_export_record_review_records_invalid",
  ),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    handoff_packet_copy_export_record_review: buildCopyExportReview({
      sideEffectProblem: true,
    }),
    as_of: AS_OF,
  }).blocking_reasons.includes(
    "handoff_packet_copy_export_record_review_receipt_side_effect_invalid",
  ),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    handoff_packet_copy_export_record_review: buildCopyExportReview({
      includeArtifact: false,
      record: buildRecord({ exported_artifact_ref: "artifact:other" }),
    }),
    as_of: AS_OF,
  }).blocking_reasons.includes(
    "exported_artifact_not_supported_by_copy_export_record_review",
  ),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    handoff_packet_copy_export_record_review: buildCopyExportReview(),
    requested_delivery_mode: "manual_operator_delivery",
    requested_recipient_ref: recipientRef,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).missing_evidence.includes("requested_recipient_ref_missing") === false,
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    requested_send_surface: "unsupported_surface",
    requested_delivery_mode: "manual_operator_delivery",
    requested_recipient_ref: recipientRef,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).refusal_reasons.includes("requested_send_surface_unsupported"),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    requested_send_surface: "operator_manual_send_candidate",
    requested_delivery_mode: "unsupported_mode",
    requested_recipient_ref: recipientRef,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).refusal_reasons.includes("requested_delivery_mode_unsupported"),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    requested_send_surface: "operator_manual_send_candidate",
    requested_delivery_mode: "manual_operator_delivery",
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).missing_evidence.includes("requested_recipient_ref_missing"),
);
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(),
    requested_send_surface: "operator_manual_send_candidate",
    requested_delivery_mode: "manual_operator_delivery",
    requested_recipient_ref: "/Users/hynk/private-ref",
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).refusal_reasons.includes("handoff_send_contract_refs_unsafe"),
);
{
  const artifactNoRefs = buildArtifact({
    source_refs: [],
    evidence_refs: [],
  });
  const recordNoRefs = buildRecord({
    source_refs: [],
    evidence_refs: [],
    exported_artifact_ref: artifactNoRefs.artifact_ref,
  });
  const preview = buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(
      artifactNoRefs,
      recordNoRefs,
    ),
    requested_send_surface: "operator_manual_send_candidate",
    requested_delivery_mode: "manual_operator_delivery",
    requested_recipient_ref: recipientRef,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: [],
    as_of: AS_OF,
  });
  assert(preview.missing_evidence.includes("source_refs_missing"));
  assert(preview.missing_evidence.includes("evidence_refs_missing"));
}
assert(
  buildHandoffSendContractPreviewV01({
    exported_handoff_packet_artifact_read: buildArtifactRead(
      buildArtifact({ markdown_payload: "password: hidden" }),
    ),
    requested_send_surface: "operator_manual_send_candidate",
    requested_delivery_mode: "manual_operator_delivery",
    requested_recipient_ref: recipientRef,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).refusal_reasons.includes("raw_or_private_packet_payload_refused"),
);

const readyPreview = buildReadyPreview();
assert.equal(
  readyPreview.contract_preview_status,
  "ready_for_future_handoff_send_contract_record_write",
);
assert.equal(readyPreview.contract_readiness.write_ready, true);
assert.equal(
  readyPreview.proposed_handoff_send_contract?.proposed_send_envelope
    .send_not_performed,
  true,
);
assert(readyPreview.proposed_handoff_send_contract?.proposed_send_preconditions.length);
for (const field of [
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_mutate_handoff_context",
]) {
  assert.equal(readyPreview.authority_boundary[field], false, field);
}

assert.notEqual(
  buildHandoffSendContractOperatorDecisionPreviewV01({
    as_of: AS_OF,
  }).decision_preview_status,
  "ready_for_future_handoff_send_contract_record_write",
);
assert.notEqual(
  buildHandoffSendContractOperatorDecisionPreviewV01({
    handoff_send_contract_preview: readyPreview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    source_refs: sourceRefs,
    as_of: AS_OF,
  }).decision_preview_status,
  "ready_for_future_handoff_send_contract_record_write",
);
const readyDecision = buildReadyDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_handoff_send_contract_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);

{
  const db = new Database(":memory:");
  const refused = writeLib.writeHandoffSendContractRecordV01({}, { db });
  assert.equal(refused.status, "refused");
  assert.equal(writeLib.handoffSendContractWriteSchemaExistsV01(db), false);
  db.close();
}
{
  const bad = buildWriteInput(readyDecision, { idempotency_key: "idempotency:other" });
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(bad).refusal_reasons.includes(
      "idempotency_key_mismatch_with_decision_preview",
    ),
  );
}
{
  const badDecision = structuredClone(readyDecision);
  badDecision.would_write_handoff_send_contract_decision_preview.requested_operator_ref =
    "operator:other";
  const bad = buildWriteInput(badDecision);
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(bad).refusal_reasons.includes(
      "operator_ref_mismatch_with_decision_preview",
    ),
  );
}
{
  const bad = buildWriteInput(readyDecision, { notes: ["/Users/hynk/private"] });
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(bad).refusal_reasons.includes(
      "notes_contain_unsafe_ref",
    ),
  );
}
{
  const bad = buildWriteInput(readyDecision, { notes: ["workbench:default"] });
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(bad).refusal_reasons.includes(
      "sample_fixture_default_or_workbench_material_refused",
    ),
  );
}
{
  const bad = buildWriteInput(readyDecision, {
    requested_side_effects: {
      handoff_sent: true,
      send_provider_called: true,
      external_messaging_called: true,
      email_called: true,
      slack_called: true,
      webhook_called: true,
      provider_called: true,
      github_called: true,
      codex_executed: true,
      clipboard_written: true,
      file_download_created: true,
      arbitrary_file_written: true,
      selected_refs_written_to_live_handoff: true,
      memory_written: true,
    },
  });
  const refusalText = writeLib
    .validateHandoffSendContractWriteInputV01(bad)
    .refusal_reasons.join("\n");
  for (const field of [
    "handoff_sent",
    "send_provider_called",
    "external_messaging_called",
    "email_called",
    "slack_called",
    "webhook_called",
    "provider_called",
    "github_called",
    "codex_executed",
    "clipboard_written",
    "file_download_created",
    "arbitrary_file_written",
    "selected_refs_written_to_live_handoff",
    "memory_written",
  ]) {
    assert(refusalText.includes(field), `missing refusal for ${field}`);
  }
}
{
  const badDecision = structuredClone(readyDecision);
  badDecision.would_write_handoff_send_contract_decision_preview
    .handoff_send_contract_preview
    .would_write_handoff_send_contract_record_preview
    .proposed_handoff_send_contract = null;
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(
      buildWriteInput(badDecision),
    ).refusal_reasons.includes("proposed_handoff_send_contract_malformed"),
  );
}
{
  const badDecision = structuredClone(readyDecision);
  badDecision.would_write_handoff_send_contract_decision_preview
    .handoff_send_contract_preview
    .would_write_handoff_send_contract_record_preview
    .proposed_send_envelope = null;
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(
      buildWriteInput(badDecision),
    ).refusal_reasons.includes("proposed_send_envelope_malformed"),
  );
}
{
  const badDecision = structuredClone(readyDecision);
  badDecision.authority_boundary.can_call_email = true;
  assert(
    writeLib.validateHandoffSendContractWriteInputV01(
      buildWriteInput(badDecision),
    ).refusal_reasons.includes(
      "handoff_send_contract_decision_preview_authority_boundary_invalid",
    ),
  );
}

const db = new Database(dbPath);
const writeInput = buildWriteInput(readyDecision);
const written = writeLib.writeHandoffSendContractRecordV01(writeInput, { db });
assert.equal(
  written.status,
  "written",
  JSON.stringify(written.receipt ?? written, null, 2),
);
assert.equal(written.record.scope, "project:augnes");
assert.equal(written.receipt.no_side_effects.handoff_send_contract_record_written, true);
assert.equal(written.receipt.no_side_effects.handoff_send_contract_receipt_written, true);
assert.equal(written.receipt.no_side_effects.handoff_send_contract_persisted, true);
assert.equal(written.receipt.no_side_effects.handoff_send_contract_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(written.receipt.no_side_effects[field], false, field);
}
const replay = writeLib.writeHandoffSendContractRecordV01(writeInput, { db });
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.no_side_effects.handoff_send_contract_record_written, false);
assert.equal(replay.receipt.no_side_effects.handoff_send_contract_receipt_written, false);
assert.equal(replay.receipt.no_side_effects.handoff_send_contract_persisted, false);
const conflictDecision = buildReadyDecision(
  buildReadyPreview({ requested_recipient_ref: "recipient:different" }),
);
const conflict = writeLib.writeHandoffSendContractRecordV01(
  buildWriteInput(conflictDecision),
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

assert.equal(
  writeLib.readHandoffSendContractRecordByIdV01(written.record.record_id, { db })
    .status,
  "read",
);
assert.equal(
  writeLib.readHandoffSendContractRecordByIdempotencyKeyV01(idempotencyKey, {
    db,
  }).status,
  "read",
);
assert.equal(
  writeLib.listHandoffSendContractRecordsV01({ db }).records.length,
  1,
);

const outOfScopeDb = new Database(":memory:");
writeLib.ensureHandoffSendContractWriteSchemaV01(outOfScopeDb);
outOfScopeDb
  .prepare(
    `INSERT INTO handoff_send_contract_records (
      record_id,
      idempotency_key,
      created_at,
      scope,
      operator_ref,
      send_surface,
      delivery_mode,
      recipient_ref,
      source_exported_artifact_ref,
      record_fingerprint,
      record_json,
      receipt_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  .run(
    "handoff-send-contract:out-of-scope",
    idempotencyKey,
    AS_OF,
    "project:other",
    operatorRef,
    "operator_manual_send_candidate",
    "manual_operator_delivery",
    recipientRef,
    "handoff-packet-exported-artifact:valid-send-contract",
    "out-of-scope",
    JSON.stringify({ scope: "project:other" }),
    JSON.stringify(written.receipt),
  );
assert.equal(
  writeLib.listHandoffSendContractRecordsV01({ db: outOfScopeDb }).records.length,
  0,
);
const outOfScopeReplay = writeLib.writeHandoffSendContractRecordV01(writeInput, {
  db: outOfScopeDb,
});
assert.equal(outOfScopeReplay.status, "written");
outOfScopeDb.close();

const emptyDb = new Database(":memory:");
assert.equal(
  writeLib.readHandoffSendContractRecordByIdV01("missing", { db: emptyDb }).status,
  "schema_missing",
);
assert.equal(writeLib.handoffSendContractWriteSchemaExistsV01(emptyDb), false);
assert.equal(
  writeLib.listHandoffSendContractRecordsV01({ db: emptyDb }).status,
  "schema_missing",
);
assert.equal(writeLib.handoffSendContractWriteSchemaExistsV01(emptyDb), false);
emptyDb.close();

const emptyReview = buildHandoffSendContractRecordReviewV01();
assert.equal(emptyReview.review_status, "no_records");
const validReview = buildHandoffSendContractRecordReviewV01({
  store_result: written,
});
assert.equal(validReview.review_status, "records_available");
assert.equal(validReview.input_summary.valid_record_count, 1);
assert.equal(
  buildHandoffSendContractRecordReviewV01({ records: [{ bad: true }] })
    .review_status,
  "records_invalid",
);
const corruptReceiptReview = buildHandoffSendContractRecordReviewV01({
  store_result: {
    ...written,
    receipt: {
      ...written.receipt,
      no_side_effects: {
        ...written.receipt.no_side_effects,
        handoff_sent: true,
      },
    },
  },
});
assert.equal(corruptReceiptReview.review_status, "records_invalid");
for (const field of [
  "authority_profile",
  "no_handoff_send_performed",
  "authority_boundary",
  "no_side_effects",
]) {
  const badRecord = structuredClone(written.record);
  if (field === "authority_profile") badRecord.authority_profile.handoff_sent = true;
  if (field === "no_handoff_send_performed") badRecord.no_handoff_send_performed = false;
  if (field === "authority_boundary") badRecord.authority_boundary.can_send_handoff = true;
  if (field === "no_side_effects") badRecord.no_side_effects = { handoff_sent: true };
  assert.equal(
    buildHandoffSendContractRecordReviewV01({ records: [badRecord] })
      .review_status,
    "records_invalid",
    field,
  );
}
assert.equal(
  buildHandoffSendContractRecordReviewV01({
    records: [{ ...written.record, raw_text: "not allowed" }],
  }).review_status,
  "records_invalid",
);

assert.equal(
  readReviewLib.readHandoffSendContractRecordReviewForWebV01().review_status,
  "no_records",
);
assert.equal(
  readReviewLib.readHandoffSendContractRecordReviewForWebV01({
    db_path: ".tmp/handoff-send-contracts/missing.db",
  }).review_status,
  "no_records",
);
assert.equal(
  readReviewLib.readHandoffSendContractRecordReviewForWebV01({
    db_path: "../handoff-send-contracts/bad.sqlite",
  }).review_status,
  "records_invalid",
);
db.close();

for (const badPath of [
  "/tmp/handoff-send-contracts/bad.db",
  ".tmp/handoff-send-contracts/../bad.db",
  ".tmp/handoff-send-contracts/private-key.db",
  ".tmp//handoff-send-contracts/bad.db",
]) {
  assert.equal(route.isSafeHandoffSendContractRouteDbPathV01(badPath), false);
}

let response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: { host: "localhost", "sec-fetch-site": "same-origin" },
    body: "{",
  }),
);
assert.equal(response.status, 400);
response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: { host: "localhost", "sec-fetch-site": "same-origin" },
    body: JSON.stringify([]),
  }),
);
assert.equal(response.status, 400);
response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: { host: "localhost", "sec-fetch-site": "same-origin" },
    body: JSON.stringify({ action: "delete", db_path: dbPath, input: writeInput }),
  }),
);
assert.equal(response.status, 400);
response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://evil.example",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ action: "write", db_path: dbPath, input: writeInput }),
  }),
);
assert.equal(response.status, 403);
for (const action of [
  "send",
  "email",
  "slack",
  "webhook",
  "provider",
  "copy",
  "download",
  "clipboard",
]) {
  const invalidAction = await route.POST(
    new Request("http://localhost/api/workplane/handoff-send-contracts", {
      method: "POST",
      headers: { host: "localhost", "sec-fetch-site": "same-origin" },
      body: JSON.stringify({ action, db_path: dbPath, input: writeInput }),
    }),
  );
  assert.equal(invalidAction.status, 400, action);
}
const badRouteDbPath = ".tmp/handoff-send-contracts/invalid.db";
rmSync(path.join(root, badRouteDbPath), { force: true });
response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: { host: "localhost", "sec-fetch-site": "same-origin" },
    body: JSON.stringify({
      action: "write",
      db_path: badRouteDbPath,
      input: {},
    }),
  }),
);
assert.equal(response.status, 400);
assert.equal(existsSync(path.join(root, badRouteDbPath)), false);

const routeDbPath = ".tmp/handoff-send-contracts/route.db";
rmSync(path.join(root, routeDbPath), { force: true });
response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://proxy.local",
      "x-forwarded-host": "proxy.local",
      "sec-fetch-site": "same-site",
    },
    body: JSON.stringify({
      action: "write",
      db_path: routeDbPath,
      input: writeInput,
    }),
  }),
);
assert.equal(response.status, 201);
let routeJson = await response.json();
assert.equal(routeJson.handoff_send_contract_record_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(routeJson[field], false, `route response ${field}`);
}
response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-send-contracts", {
    method: "POST",
    headers: { host: "localhost", "sec-fetch-site": "same-origin" },
    body: JSON.stringify({
      action: "write",
      db_path: routeDbPath,
      input: writeInput,
    }),
  }),
);
routeJson = await response.json();
assert.equal(routeJson.store_result.status, "idempotent_existing");
assert.equal(routeJson.receipt.no_side_effects.handoff_send_contract_record_written, false);
response = await route.GET(
  new Request(
    `http://localhost/api/workplane/handoff-send-contracts?db_path=${encodeURIComponent(routeDbPath)}&idempotency_key=${encodeURIComponent(idempotencyKey)}`,
    { headers: { host: "localhost" } },
  ),
);
assert.equal(response.status, 200);

for (const file of [
  "components/workplane/handoff-send-contract-preview-panel.tsx",
  "components/workplane/handoff-send-contract-decision-panel.tsx",
  "components/workplane/handoff-send-contract-record-review-panel.tsx",
]) {
  const text = readFileSync(path.join(root, file), "utf8");
  assert(!text.includes("<button"), `${file} must not render buttons`);
  assert(!/onClick\s*=/.test(text), `${file} must not include click handlers`);
  for (const forbiddenHandler of [
    "import",
    "apply",
    "approve",
    "send",
    "launch",
    "run",
    "execute",
    "merge",
    "write",
    "export",
    "copy",
    "download",
    "clipboard",
    "email",
    "slack",
    "webhook",
    "provider",
  ]) {
    assert(
      !new RegExp(`onClick[^\\n]+${forbiddenHandler}`, "i").test(text),
      `${file} has forbidden ${forbiddenHandler} click handler`,
    );
  }
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  exported_handoff_packet_artifact_read: buildArtifactRead(),
  handoff_send_contract_preview: readyPreview,
  handoff_send_contract_decision_preview: readyDecision,
  handoff_send_contract_record_review: validReview,
  as_of: AS_OF,
  source_refs: sourceRefs,
});
for (const stepId of [
  "handoff_send_contract",
  "handoff_send_contract_decision",
  "handoff_send_contract_record",
]) {
  assert(
    overview.spine_steps.some((step) => step.step_id === stepId),
    `missing spine step ${stepId}`,
  );
}
const actionText = JSON.stringify(overview);
for (const expected of [
  "review_handoff_send_contract",
  "approve_handoff_send_contract_record",
  "write_handoff_send_contract_record",
  "review_handoff_send_contract_record",
  "prepare_handoff_send_slice",
]) {
  assert(actionText.includes(expected), `missing overview action ${expected}`);
}
const blockedOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  exported_handoff_packet_artifact_read: buildArtifactRead(),
  handoff_send_contract_preview: readyPreview,
  handoff_send_contract_decision_preview: readyDecision,
  handoff_send_contract_record_review: corruptReceiptReview,
  as_of: AS_OF,
  source_refs: sourceRefs,
});
assert(
  JSON.stringify(blockedOverview).includes("resolve_handoff_send_contract_blockers"),
  "missing blocked overview action resolve_handoff_send_contract_blockers",
);
const recommendedActions = [
  overview.recommended_next_operator_action,
  ...overview.spine_steps.map((step) => step.recommended_next_action),
  blockedOverview.recommended_next_operator_action,
  ...blockedOverview.spine_steps.map((step) => step.recommended_next_action),
].join(" ");
for (const forbidden of [
  "send_handoff_now",
  "call_send_provider",
  "call_email",
  "call_slack",
  "call_webhook",
  "write_clipboard",
  "create_browser_download",
  "write_arbitrary_file",
  "mutate_live_handoff_context",
  "mutate_api_perspective_current",
  "write_memory",
  "write_metrics",
  "call_github",
  "execute_codex",
  "create_graph",
  "create_vector",
  "create_rag",
  "observe_browser",
]) {
  assert(
    !recommendedActions.includes(forbidden),
    `forbidden overview action ${forbidden}`,
  );
}

function deepMerge(base, overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return structuredClone(base);
  }
  const output = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

rmSync(tempDir, { recursive: true, force: true });

console.log("smoke-handoff-send-contract-v0-1: ok");
