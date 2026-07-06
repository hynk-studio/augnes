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
  scriptName: "smoke:handoff-packet-copy-export-slice-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
});

const expectedFiles = [
  "types/handoff-packet-copy-export-preview.ts",
  "lib/workplane/handoff-packet-copy-export-preview.ts",
  "components/workplane/handoff-packet-copy-export-preview-panel.tsx",
  "types/handoff-packet-copy-export-decision.ts",
  "lib/workplane/handoff-packet-copy-export-decision.ts",
  "components/workplane/handoff-packet-copy-export-decision-panel.tsx",
  "types/handoff-packet-copy-export-write.ts",
  "lib/workplane/handoff-packet-copy-export-write.ts",
  "app/api/workplane/handoff-packet-copy-exports/route.ts",
  "types/handoff-packet-copy-export-record-review.ts",
  "lib/workplane/handoff-packet-copy-export-record-review.ts",
  "lib/workplane/read-handoff-packet-copy-export-record-review-for-web.ts",
  "lib/workplane/read-exported-handoff-packet-artifact-for-web.ts",
  "components/workplane/handoff-packet-copy-export-record-review-panel.tsx",
  "components/workplane/exported-handoff-packet-artifact-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
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
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
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
  "package.json",
];

for (const file of expectedFiles.slice(0, 15)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "handoff_packet_copy_export_slice_v0_1",
});

const textByFile = loadTextByFile(
  expectedFiles.filter((file) => existsSync(path.join(root, file))),
);
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "handoff_packet_copy_export_preview.v0.1",
  "handoff_packet_copy_export_operator_decision_preview.v0.1",
  "handoff_packet_copy_export_record.v0.1",
  "handoff_packet_copy_export_receipt.v0.1",
  "handoff_packet_exported_artifact.v0.1",
  "handoff_packet_copy_export_store.v0.1",
  "handoff_packet_copy_export_record_review.v0.1",
  "exported_handoff_packet_artifact_read.v0.1",
  "review_handoff_packet_copy_export_preview",
  "write_handoff_packet_copy_export_record",
  "review_handoff_packet_copy_export_record",
  "review_exported_handoff_packet_artifact",
  "prepare_handoff_send_contract",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const previewLib = await import(
  "../lib/workplane/handoff-packet-copy-export-preview.ts"
);
const decisionLib = await import(
  "../lib/workplane/handoff-packet-copy-export-decision.ts"
);
const writeLib = await import(
  "../lib/workplane/handoff-packet-copy-export-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/handoff-packet-copy-export-record-review.ts"
);
const contractReviewLib = await import(
  "../lib/workplane/handoff-packet-copy-export-contract-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-handoff-packet-copy-export-record-review-for-web.ts"
);
const readArtifactLib = await import(
  "../lib/workplane/read-exported-handoff-packet-artifact-for-web.ts"
);
const route = await import("../app/api/workplane/handoff-packet-copy-exports/route.ts");
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const { buildHandoffPacketCopyExportPreviewV01 } = previewLib;
const { buildHandoffPacketCopyExportOperatorDecisionPreviewV01 } = decisionLib;
const { buildHandoffPacketCopyExportRecordReviewV01 } = reviewLib;
const { buildHandoffPacketCopyExportContractRecordReviewV01 } = contractReviewLib;

const AS_OF = "2026-07-06T00:00:00.000Z";
const sourceRefs = ["source:packet-copy-export-slice"];
const evidenceRefs = ["evidence:packet-copy-export-slice"];
const operatorRef = "operator:packet-copy-export-slice";
const idempotencyKey = "idempotency:packet-copy-export-slice";
const reviewRef = "review:packet-copy-export-slice";
const dbPath = ".tmp/handoff-packet-copy-exports/slice.db";
const tempDir = path.join(root, ".tmp/handoff-packet-copy-exports");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const forbiddenNoSideEffectFields = [
  "handoff_packet_copied_to_clipboard",
  "handoff_packet_exported_to_file",
  "handoff_packet_download_created",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_sent",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
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
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
];

function buildManifest(format = "operator_handoff_packet_markdown", target = "operator_copy_surface_candidate") {
  return {
    manifest_version: "handoff_packet_manifest.v0.1",
    packet_ref: `handoff-packet-candidate:${format}`,
    packet_title: "Augnes Operator Handoff Packet Candidate",
    packet_format: format,
    packet_target: target,
    source_applied_handoff_context_snapshot_ref:
      "applied-handoff-context-snapshot:valid",
    source_apply_record_ref: "handoff-context-apply:valid",
    entry_count: 2,
    section_count: 2,
    public_safe: true,
    raw_private_material_excluded: true,
    copy_export_not_performed: true,
    send_not_performed: true,
    future_copy_export_required: true,
    future_send_required: true,
  };
}

function buildEntries(format = "operator_handoff_packet_markdown") {
  return [
    {
      packet_entry_ref: "handoff-packet-entry:header",
      source_applied_entry_ref: null,
      packet_section: "packet_header_section",
      entry_kind: "heading",
      copy_export_rendering_hint:
        format === "codex_handoff_packet_json" ? "json_field" : "markdown_heading",
      summary: "Augnes operator handoff packet candidate.",
      source_record_refs: ["handoff-packet-copy-export-contract:valid"],
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      public_safe: true,
      raw_private_material_excluded: true,
      authority_required: "future_handoff_packet_copy_export",
      persistence_horizon: "handoff_packet_copy_export_contract_record",
    },
    {
      packet_entry_ref: "handoff-packet-entry:next",
      source_applied_entry_ref: "applied-entry:next",
      packet_section: "next_candidates_section",
      entry_kind: "next_action",
      copy_export_rendering_hint:
        format === "conversation_handoff_capsule" ? "capsule_field" : "markdown_bullet",
      summary: "Continue with the next handoff packet slice.",
      source_record_refs: ["handoff-context-apply:valid"],
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      public_safe: true,
      raw_private_material_excluded: true,
      authority_required: "future_handoff_packet_copy_export",
      persistence_horizon: "handoff_packet_copy_export_contract_record",
    },
  ];
}

function contractAuthorityProfile() {
  return {
    durable_local_handoff_packet_copy_export_contract: true,
    source_of_truth: false,
    local_project_handoff_packet_copy_export_contract_only: true,
    persistence_horizon: "local_project_handoff_packet_copy_export_contract_store",
    handoff_packet_copy_export_contract_written: true,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_packet_file_written: false,
    clipboard_written: false,
    handoff_sent: false,
    live_handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  };
}

function contractNoSideEffects() {
  return {
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_packet_file_written: false,
    clipboard_written: false,
    file_download_created: false,
    handoff_sent: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
  };
}

function contractAuthorityBoundary() {
  return {
    durable_local_handoff_packet_copy_export_contract: true,
    source_of_truth: false,
    local_project_handoff_packet_copy_export_contract_only: true,
    can_write_db: true,
    can_create_handoff_packet_copy_export_contract_record: true,
    can_create_handoff_packet_copy_export_contract_receipt: true,
    can_copy_export_handoff_packet: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_context_apply_record: false,
    can_write_applied_handoff_context_snapshot: false,
    can_write_handoff_context_update_contract_record: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: ["contract authority"],
  };
}

function buildContractRecord(format = "operator_handoff_packet_markdown", target = "operator_copy_surface_candidate", overrides = {}) {
  const manifest = buildManifest(format, target);
  const entries = buildEntries(format);
  return {
    record_version: "handoff_packet_copy_export_contract_record.v0.1",
    record_id: `handoff-packet-copy-export-contract:${format}`,
    idempotency_key: `idempotency:contract:${format}`,
    created_at: AS_OF,
    scope: "project:augnes",
    operator_ref: "operator:contract",
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_applied_handoff_context_snapshot_ref:
      "applied-handoff-context-snapshot:valid",
    source_handoff_context_apply_record_ref: "handoff-context-apply:valid",
    source_handoff_context_update_contract_record_ref:
      "handoff-context-update-contract:valid",
    source_route_integration_read_ref: "cwp-route-integration-read:valid",
    source_runtime_current_working_perspective_ref:
      "current-working-perspective:runtime",
    source_applied_cwp_snapshot_ref:
      "current-working-perspective-applied-snapshot:valid",
    requested_packet_format: format,
    requested_copy_export_target: target,
    proposed_handoff_packet_copy_export_contract: {
      contract_kind: "handoff_packet_copy_export_contract.v0.1",
      packet_family: "augnes_operator_handoff_packet",
      source_applied_handoff_context_snapshot_ref:
        "applied-handoff-context-snapshot:valid",
      requested_packet_format: format,
      requested_copy_export_target: target,
      proposed_packet_manifest: manifest,
      proposed_packet_entries: entries,
      proposed_copy_export_plan: {
        plan_version: "handoff_packet_copy_export_plan.v0.1",
        packet_entry_count: entries.length,
        packet_section_counts: { packet_header_section: 1, next_candidates_section: 1 },
        source_applied_handoff_context_snapshot_ref:
          "applied-handoff-context-snapshot:valid",
        copy_export_not_performed: true,
        clipboard_write_not_performed: true,
        file_write_not_performed: true,
        download_not_performed: true,
        handoff_send_not_performed: true,
      },
      required_source_refs: sourceRefs,
      required_evidence_refs: evidenceRefs,
    },
    proposed_packet_manifest: manifest,
    proposed_packet_entries: entries,
    proposed_packet_entry_count: entries.length,
    proposed_packet_section_counts: { packet_header_section: 1, next_candidates_section: 1 },
    proposed_copy_export_plan: {
      plan_version: "handoff_packet_copy_export_plan.v0.1",
      packet_entry_count: entries.length,
      packet_section_counts: { packet_header_section: 1, next_candidates_section: 1 },
      source_applied_handoff_context_snapshot_ref:
        "applied-handoff-context-snapshot:valid",
      copy_export_not_performed: true,
      clipboard_write_not_performed: true,
      file_write_not_performed: true,
      download_not_performed: true,
      handoff_send_not_performed: true,
    },
    authority_profile: contractAuthorityProfile(),
    review_status: "recorded_as_scoped_handoff_packet_copy_export_contract",
    persistence_horizon: "local_project_handoff_packet_copy_export_contract_store",
    no_copy_export_or_send_performed: contractNoSideEffects(),
    write_validation: {
      validation_version: "handoff_packet_copy_export_contract_write_validation.v0.1",
      operator_decision_preview_revalidated: true,
      handoff_packet_copy_export_contract_revalidated: true,
      packet_manifest_revalidated: true,
      packet_entries_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_packet_copy_export_or_send: false,
      refused_metric_or_upstream_write: false,
      validation_hash: "hash:contract",
    },
    authority_boundary: contractAuthorityBoundary(),
    notes: ["note:contract"],
    record_fingerprint: `fingerprint:${format}`,
    ...overrides,
  };
}

function buildContractReview(record = buildContractRecord()) {
  return buildHandoffPacketCopyExportContractRecordReviewV01({
    records: [record],
    source_refs: sourceRefs,
  });
}

function buildPreview(overrides = {}) {
  return buildHandoffPacketCopyExportPreviewV01({
    handoff_packet_copy_export_contract_record_review: buildContractReview(),
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildDecision(preview = buildPreview(), overrides = {}) {
  return buildHandoffPacketCopyExportOperatorDecisionPreviewV01({
    handoff_packet_copy_export_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent: "approve_for_handoff_packet_copy_export_record",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision = buildDecision(), overrides = {}) {
  return {
    copy_export_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_handoff_packet_copy_export_record",
      approved_by: "operator:packet-copy-export-slice-approver",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:scoped-local-packet-artifact-only",
      checklist_confirmations: [
        "confirm:scoped-local-artifact-record-only",
        "confirm:no-clipboard-download-file-or-send",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:scoped-local-packet-artifact"],
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function assertNotReady(preview, reason) {
  assert.notEqual(
    preview.copy_export_preview_status,
    "ready_for_future_handoff_packet_copy_export_record_write",
    reason,
  );
  assert.equal(preview.copy_export_readiness.write_ready, false, reason);
}

function buildDirectContractRecordPreview(record) {
  return buildPreview({
    handoff_packet_copy_export_contract_record_review: undefined,
    handoff_packet_copy_export_contract_record: record,
  });
}

function assertDirectContractAuthorityBlocks(field) {
  const forged = buildContractRecord();
  forged.authority_boundary[field] = true;
  const preview = buildDirectContractRecordPreview(forged);
  assertNotReady(preview, `direct contract authority ${field} blocks`);
  assert(
    preview.blocking_reasons.includes(
      "handoff_packet_copy_export_contract_record_authority_boundary_invalid",
    ),
    `direct contract authority ${field} reports blocker`,
  );
}

function assertEmbeddedArtifactAuthorityInvalid(field) {
  const forged = clone(writeResult.record);
  forged.exported_packet_artifact.authority_boundary[field] = true;
  const review = buildHandoffPacketCopyExportRecordReviewV01({
    records: [forged],
  });
  assert.equal(
    review.review_status,
    "records_invalid",
    `embedded artifact authority ${field} invalid`,
  );
  assert(
    review.record_summaries[0].problem_reasons.includes(
      "handoff_packet_exported_artifact_malformed",
    ),
    `embedded artifact authority ${field} reports artifact problem`,
  );
}

assertNotReady(buildHandoffPacketCopyExportPreviewV01(), "missing contract review");
assertNotReady(
  buildHandoffPacketCopyExportPreviewV01({
    handoff_packet_copy_export_contract_record_review: { nope: true },
  }),
  "malformed contract review",
);
assertNotReady(
  buildHandoffPacketCopyExportPreviewV01({
    handoff_packet_copy_export_contract_record_review:
      buildHandoffPacketCopyExportContractRecordReviewV01({
        records: [{ record_id: "bad" }],
      }),
    source_refs: sourceRefs,
  }),
  "records_invalid contract review",
);
assertNotReady(
  buildPreview({
    handoff_packet_copy_export_contract_record_review: buildContractReview(
      buildContractRecord("operator_handoff_packet_markdown", "operator_copy_surface_candidate", {
        proposed_packet_entries: [],
        proposed_packet_entry_count: 0,
      }),
    ),
  }),
  "empty packet entries block",
);
assertNotReady(
  buildPreview({ source_refs: [] }),
  "missing source refs block",
);
assertNotReady(
  buildPreview({ requested_operator_ref: undefined }),
  "missing operator ref blocks",
);
assert(
  buildPreview({ existing_handoff_packet_or_capsule: { raw_text: "private" } })
    .refusal_reasons.includes(
      "raw_or_private_existing_handoff_packet_or_capsule_refused",
    ),
  "raw existing packet material refused",
);

for (const field of [
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_current_working_perspective_apply_record",
  "can_write_route_integration_contract_record",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_continuity_relay",
  "can_apply_live_relay_state",
  "can_update_global_dogfood_metrics",
  "can_write_dogfood_metric_snapshot",
  "can_create_pr",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
]) {
  assertDirectContractAuthorityBlocks(field);
}

for (const format of [
  "operator_handoff_packet_markdown",
  "codex_handoff_packet_json",
  "conversation_handoff_capsule",
  "dual_markdown_and_json",
]) {
  const preview = buildHandoffPacketCopyExportPreviewV01({
    handoff_packet_copy_export_contract_record_review: buildContractReview(
      buildContractRecord(format),
    ),
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    as_of: AS_OF,
    source_refs: sourceRefs,
  });
  assert.equal(
    preview.copy_export_preview_status,
    "ready_for_future_handoff_packet_copy_export_record_write",
    `${format} preview ready`,
  );
  const artifact = preview.proposed_exported_packet_artifact;
  assert(artifact, `${format} artifact exists`);
  assert.equal(artifact.artifact_metadata.clipboard_write_not_performed, true);
  assert.equal(artifact.artifact_metadata.download_not_performed, true);
  assert.equal(artifact.artifact_metadata.file_write_not_performed, true);
  assert.equal(artifact.artifact_metadata.handoff_send_not_performed, true);
  assert.equal(Boolean(artifact.markdown_payload), format.includes("markdown"));
  assert.equal(Boolean(artifact.json_payload), format.includes("json"));
  assert.equal(Boolean(artifact.capsule_payload), format === "conversation_handoff_capsule");
}

const readyPreview = buildPreview();
assert.equal(
  readyPreview.copy_export_preview_status,
  "ready_for_future_handoff_packet_copy_export_record_write",
);
assert.equal(readyPreview.authority_boundary.can_write_clipboard, false);
assert.equal(readyPreview.authority_boundary.can_download_file, false);
assert.equal(readyPreview.authority_boundary.can_send_handoff, false);

const notReadyDecision = buildDecision(
  buildPreview({ requested_operator_ref: undefined }),
);
assert.notEqual(
  notReadyDecision.decision_preview_status,
  "ready_for_future_handoff_packet_copy_export_record_write",
);
assert.notEqual(
  buildDecision(readyPreview, { operator_decision_intent: undefined })
    .decision_preview_status,
  "ready_for_future_handoff_packet_copy_export_record_write",
);
const readyDecision = buildDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_handoff_packet_copy_export_record_write",
);

assert.equal(
  writeLib.validateHandoffPacketCopyExportWriteInputV01(
    buildWriteInput(notReadyDecision),
  ).ok,
  false,
  "writer refuses non-ready decision preview",
);
assert.equal(existsSync(path.join(root, dbPath)), false);

assert(
  writeLib
    .validateHandoffPacketCopyExportWriteInputV01(
      buildWriteInput(readyDecision, { idempotency_key: "idempotency:mismatch" }),
    )
    .refusal_reasons.includes("idempotency_key_mismatch_with_decision_preview"),
  "writer refuses idempotency mismatch",
);

const operatorMismatch = buildWriteInput(readyDecision);
operatorMismatch.operator_approval.operator_ref = "operator:different";
assert(
  writeLib
    .validateHandoffPacketCopyExportWriteInputV01(operatorMismatch)
    .refusal_reasons.includes("operator_ref_mismatch_with_decision_preview"),
  "writer refuses operator ref mismatch",
);

for (const sideEffect of [
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "handoff_packet_copied_to_clipboard",
  "handoff_packet_exported_to_file",
  "handoff_packet_download_created",
  "handoff_sent",
  "selected_refs_written_to_live_handoff",
  "memory_written",
  "provider_called",
  "github_called",
]) {
  const result = writeLib.validateHandoffPacketCopyExportWriteInputV01(
    buildWriteInput(readyDecision, {
      requested_side_effects: { [sideEffect]: true },
    }),
  );
  assert.equal(result.ok, false, `writer refuses ${sideEffect}`);
}

const rawWrite = buildWriteInput(readyDecision);
rawWrite.raw_text = "private";
assert(
  writeLib
    .validateHandoffPacketCopyExportWriteInputV01(rawWrite)
    .refusal_reasons.includes("raw_or_private_marker_material_refused"),
  "writer refuses raw material",
);

for (const field of [
  "can_write_clipboard",
  "can_download_file",
  "can_write_handoff_packet_file",
  "can_send_handoff",
]) {
  const forged = buildDecision(readyPreview);
  forged.authority_boundary[field] = true;
  assert(
    writeLib
      .validateHandoffPacketCopyExportWriteInputV01(buildWriteInput(forged))
      .refusal_reasons.includes("copy_export_decision_preview_authority_boundary_invalid"),
    `writer refuses forged decision authority ${field}`,
  );
}

const forgedArtifact = buildDecision(clone(readyPreview));
forgedArtifact.would_write_handoff_packet_copy_export_decision_preview.copy_export_preview.would_write_handoff_packet_copy_export_record_preview.proposed_exported_packet_artifact.authority_boundary.can_write_clipboard = true;
assert(
  writeLib
    .validateHandoffPacketCopyExportWriteInputV01(buildWriteInput(forgedArtifact))
    .refusal_reasons.includes("exported_packet_artifact_authority_boundary_invalid"),
  "writer refuses forged artifact authority",
);

const malformedHash = buildDecision(clone(readyPreview));
malformedHash.would_write_handoff_packet_copy_export_decision_preview.copy_export_preview.would_write_handoff_packet_copy_export_record_preview.proposed_exported_packet_artifact.payload_hash =
  "wrong";
assert(
  writeLib
    .validateHandoffPacketCopyExportWriteInputV01(buildWriteInput(malformedHash))
    .refusal_reasons.includes("exported_packet_artifact_payload_hash_invalid"),
  "writer refuses malformed payload hash",
);

const db = new Database(path.join(root, dbPath));
const writeResult = writeLib.writeHandoffPacketCopyExportRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(writeResult.status, "written");
assert(writeResult.record);
assert(writeResult.exported_artifact);
assert.equal(writeResult.receipt.no_side_effects.handoff_packet_copy_export_record_written, true);
assert.equal(writeResult.receipt.no_side_effects.handoff_packet_copy_export_receipt_written, true);
assert.equal(writeResult.receipt.no_side_effects.handoff_packet_copy_export_persisted, true);
assert.equal(writeResult.receipt.no_side_effects.handoff_packet_exported_artifact_written, true);
assert.equal(writeResult.receipt.no_side_effects.handoff_packet_materialized_to_local_artifact, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(writeResult.receipt.no_side_effects[field], false, field);
}

const replayResult = writeLib.writeHandoffPacketCopyExportRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(replayResult.status, "idempotent_existing");
assert.equal(
  replayResult.receipt.no_side_effects.handoff_packet_copy_export_record_written,
  false,
);
assert.equal(
  replayResult.receipt.no_side_effects.handoff_packet_exported_artifact_written,
  false,
);

const conflictDecision = buildDecision(
  buildHandoffPacketCopyExportPreviewV01({
    handoff_packet_copy_export_contract_record_review: buildContractReview(
      buildContractRecord("dual_markdown_and_json"),
    ),
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    as_of: AS_OF,
    source_refs: sourceRefs,
  }),
);
const conflict = writeLib.writeHandoffPacketCopyExportRecordV01(
  buildWriteInput(conflictDecision),
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

assert.equal(
  writeLib.readHandoffPacketCopyExportRecordByIdV01(writeResult.record.record_id, {
    db,
  }).status,
  "read",
);
assert.equal(
  writeLib.readHandoffPacketCopyExportRecordByIdempotencyKeyV01(idempotencyKey, {
    db,
  }).status,
  "read",
);
assert.equal(
  writeLib.readHandoffPacketCopyExportRecordByExportedArtifactRefV01(
    writeResult.record.exported_artifact_ref,
    { db },
  ).status,
  "read",
);
assert.equal(writeLib.readLatestExportedHandoffPacketArtifactV01({ db }).status, "read");
db.close();

const reviewDefault = buildHandoffPacketCopyExportRecordReviewV01();
assert.equal(reviewDefault.review_status, "no_records");
const reviewValid = buildHandoffPacketCopyExportRecordReviewV01({
  store_result: writeResult,
});
assert.equal(reviewValid.review_status, "records_available");
assert.equal(
  buildHandoffPacketCopyExportRecordReviewV01({
    records: [{ record_id: "bad" }],
  }).review_status,
  "records_invalid",
);
const corruptReceipt = clone(writeResult);
corruptReceipt.receipt.no_side_effects.clipboard_written = true;
assert.equal(
  buildHandoffPacketCopyExportRecordReviewV01({
    store_result: corruptReceipt,
  }).review_status,
  "records_invalid",
);
for (const field of ["clipboard_written", "handoff_sent", "memory_written"]) {
  const forged = clone(writeResult.record);
  forged.no_external_copy_export_or_send_performed[field] = true;
  assert.equal(
    buildHandoffPacketCopyExportRecordReviewV01({ records: [forged] })
      .review_status,
    "records_invalid",
    `review flags forged no side effect ${field}`,
  );
}
for (const field of [
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_send_handoff",
  "can_write_dogfood_metrics",
  "can_create_pr",
  "can_create_graph_or_vector_store",
]) {
  const forged = clone(writeResult.record);
  forged.authority_boundary[field] = true;
  assert.equal(
    buildHandoffPacketCopyExportRecordReviewV01({ records: [forged] })
      .review_status,
    "records_invalid",
    `review flags forged authority ${field}`,
  );
}
for (const field of [
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_update_global_dogfood_metrics",
  "can_write_dogfood_metric_snapshot",
  "can_create_pr",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_copy_export_handoff_packet_to_local_artifact",
]) {
  assertEmbeddedArtifactAuthorityInvalid(field);
}
const artifactMismatch = clone(writeResult.record);
artifactMismatch.exported_packet_artifact.artifact_ref = "handoff-packet-exported-artifact:mismatch";
assert.equal(
  buildHandoffPacketCopyExportRecordReviewV01({ records: [artifactMismatch] })
    .review_status,
  "records_invalid",
  "review flags record/artifact mismatch",
);
const rawRecord = clone(writeResult.record);
rawRecord.raw_report = "private";
assert.equal(
  buildHandoffPacketCopyExportRecordReviewV01({ records: [rawRecord] })
    .review_status,
  "records_invalid",
  "review refuses raw material keys",
);

assert.equal(
  readArtifactLib.readExportedHandoffPacketArtifactForWebV01().status,
  "no_exported_handoff_packet_artifact",
);
assert.equal(
  readArtifactLib.readExportedHandoffPacketArtifactForWebV01({
    store_result: writeResult,
  }).status,
  "latest_exported_handoff_packet_artifact_available",
);
assert.equal(
  readReviewLib.readHandoffPacketCopyExportRecordReviewForWebV01({
    store_result: writeResult,
  }).review_status,
  "records_available",
);

assert.equal(
  route.isSafeHandoffPacketCopyExportRouteDbPathV01(
    "../handoff-packet-copy-exports/bad.sqlite",
  ),
  false,
);
assert.equal(route.isSafeHandoffPacketCopyExportRouteDbPathV01(dbPath), true);

async function routeJson(request) {
  const response = await route.POST(request);
  return { status: response.status, body: await response.json() };
}

const invalidJsonResponse = await route.POST(
  new Request("http://localhost/api/workplane/handoff-packet-copy-exports", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "{",
  }),
);
assert.equal(invalidJsonResponse.status, 400);

for (const action of ["export", "copy", "download", "clipboard", "send", "apply"]) {
  const response = await routeJson(
    new Request("http://localhost/api/workplane/handoff-packet-copy-exports", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost" },
      body: JSON.stringify({ action, db_path: dbPath, input: {} }),
    }),
  );
  assert.equal(response.status, 400, `route rejects ${action}`);
  assert.equal(response.body.error_code, "invalid_action");
}

const crossSite = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-exports", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "https://example.com",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ action: "write", db_path: dbPath, input: {} }),
  }),
);
assert.equal(crossSite.status, 403);

const routeDbPath = ".tmp/handoff-packet-copy-exports/route.db";
const routeWrite = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-exports", {
    method: "POST",
    headers: {
      host: "internal.local",
      "x-forwarded-host": "localhost",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      action: "write",
      db_path: routeDbPath,
      input: buildWriteInput(readyDecision),
    }),
  }),
);
assert.equal(routeWrite.status, 201);
assert.equal(routeWrite.body.handoff_packet_copy_export_record_written, true);
assert.equal(routeWrite.body.clipboard_written, false);
assert.equal(routeWrite.body.file_download_created, false);
assert.equal(routeWrite.body.handoff_sent, false);

const routeReplay = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-exports", {
    method: "POST",
    headers: {
      host: "internal.local",
      "x-forwarded-host": "localhost",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      action: "write",
      db_path: routeDbPath,
      input: buildWriteInput(readyDecision),
    }),
  }),
);
assert.equal(routeReplay.status, 200);
assert.equal(routeReplay.body.store_result.status, "idempotent_existing");
assert.equal(
  routeReplay.body.receipt.no_side_effects.handoff_packet_copy_export_record_written,
  false,
);

const badRouteDbPath = ".tmp/handoff-packet-copy-exports/invalid.db";
const invalidWrite = clone(buildWriteInput(readyDecision));
invalidWrite.copy_export_decision_preview.authority_boundary.can_write_clipboard = true;
const invalidRouteWrite = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-exports", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: JSON.stringify({
      action: "write",
      db_path: badRouteDbPath,
      input: invalidWrite,
    }),
  }),
);
assert.equal(invalidRouteWrite.status, 400);
assert.equal(existsSync(path.join(root, badRouteDbPath)), false);

for (const panel of [
  "components/workplane/handoff-packet-copy-export-preview-panel.tsx",
  "components/workplane/handoff-packet-copy-export-decision-panel.tsx",
  "components/workplane/handoff-packet-copy-export-record-review-panel.tsx",
  "components/workplane/exported-handoff-packet-artifact-panel.tsx",
]) {
  const text = readFileSync(path.join(root, panel), "utf8");
  assert(!text.includes("<button"), `${panel} must not render a button`);
  assert(!/onClick\s*=/.test(text), `${panel} must not include click handlers`);
  for (const word of ["approve", "send", "launch", "run", "execute", "merge", "copy", "download", "clipboard"]) {
    assert(!new RegExp(`onClick[^\\n]*${word}`, "i").test(text), `${panel} click ${word}`);
  }
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  handoff_packet_copy_export_preview: readyPreview,
  handoff_packet_copy_export_operator_decision_preview: readyDecision,
  handoff_packet_copy_export_record_review: reviewValid,
  exported_handoff_packet_artifact_read:
    readArtifactLib.readExportedHandoffPacketArtifactForWebV01({
      store_result: writeResult,
    }),
  source_refs: sourceRefs,
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
for (const stepId of [
  "handoff_packet_copy_export_preview",
  "handoff_packet_copy_export_decision",
  "handoff_packet_copy_export_record",
  "exported_handoff_packet_artifact",
]) {
  assert(stepIds.includes(stepId), `overview missing ${stepId}`);
}
const overviewText = JSON.stringify(overview);
for (const forbidden of [
  "clipboard_write",
  "browser_download",
  "arbitrary_file_write",
  "external_export",
  "handoff_send",
  "provider",
  "github",
  "codex",
  "graph",
  "browser_observer",
]) {
  assert(!overviewText.includes(`write_${forbidden}`), `overview recommends ${forbidden}`);
}

rmSync(tempDir, { recursive: true, force: true });

console.log("smoke-handoff-packet-copy-export-slice-v0-1 passed");
