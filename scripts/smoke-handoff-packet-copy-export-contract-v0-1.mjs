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
  scriptName: "smoke:handoff-packet-copy-export-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-packet-copy-export-contract-v0-1.mjs",
});

const expectedFiles = [
  "types/handoff-packet-copy-export-contract-preview.ts",
  "lib/workplane/handoff-packet-copy-export-contract-preview.ts",
  "components/workplane/handoff-packet-copy-export-contract-preview-panel.tsx",
  "types/handoff-packet-copy-export-contract-decision.ts",
  "lib/workplane/handoff-packet-copy-export-contract-decision.ts",
  "components/workplane/handoff-packet-copy-export-contract-decision-panel.tsx",
  "types/handoff-packet-copy-export-contract-write.ts",
  "lib/workplane/handoff-packet-copy-export-contract-write.ts",
  "app/api/workplane/handoff-packet-copy-export-contracts/route.ts",
  "types/handoff-packet-copy-export-contract-record-review.ts",
  "lib/workplane/handoff-packet-copy-export-contract-record-review.ts",
  "lib/workplane/read-handoff-packet-copy-export-contract-record-review-for-web.ts",
  "components/workplane/handoff-packet-copy-export-contract-record-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
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
  "package.json",
];

for (const file of expectedFiles.slice(0, 13)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "handoff_packet_copy_export_contract_v0_1",
});

const textByFile = loadTextByFile(
  expectedFiles.filter((file) => existsSync(path.join(root, file))),
);
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "handoff_packet_copy_export_contract_preview.v0.1",
  "handoff_packet_copy_export_contract_operator_decision_preview.v0.1",
  "handoff_packet_copy_export_contract_record.v0.1",
  "handoff_packet_copy_export_contract_receipt.v0.1",
  "handoff_packet_copy_export_contract_store.v0.1",
  "handoff_packet_copy_export_contract_record_review.v0.1",
  "handoff_packet_manifest.v0.1",
  "review_handoff_packet_copy_export_contract",
  "write_handoff_packet_copy_export_contract_record",
  "review_handoff_packet_copy_export_contract_record",
  "prepare_handoff_packet_copy_export_slice",
  "prepare_handoff_send_contract",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const previewLib = await import(
  "../lib/workplane/handoff-packet-copy-export-contract-preview.ts"
);
const decisionLib = await import(
  "../lib/workplane/handoff-packet-copy-export-contract-decision.ts"
);
const writeLib = await import(
  "../lib/workplane/handoff-packet-copy-export-contract-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/handoff-packet-copy-export-contract-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-handoff-packet-copy-export-contract-record-review-for-web.ts"
);
const route = await import(
  "../app/api/workplane/handoff-packet-copy-export-contracts/route.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const { buildHandoffPacketCopyExportContractPreviewV01 } = previewLib;
const {
  buildHandoffPacketCopyExportContractOperatorDecisionPreviewV01,
} = decisionLib;
const {
  buildHandoffPacketCopyExportContractRecordReviewV01,
} = reviewLib;

const AS_OF = "2026-07-06T00:00:00.000Z";
const sourceRefs = ["source:packet-copy-export-contract"];
const evidenceRefs = ["evidence:packet-copy-export-contract"];
const operatorRef = "operator:packet-copy-export-contract";
const idempotencyKey = "idempotency:packet-copy-export-contract";
const reviewRef = "review:packet-copy-export-contract";
const dbPath = ".tmp/handoff-packet-copy-export-contracts/contract.db";
const tempDir = path.join(root, ".tmp/handoff-packet-copy-export-contracts");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const forbiddenNoSideEffectFields = [
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_packet_file_written",
  "clipboard_written",
  "file_download_created",
  "handoff_sent",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
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

function buildAppliedContext(overrides = {}) {
  const entries = [
    {
      applied_entry_ref: "applied-entry:current-frame",
      source_contract_entry_ref: "contract-entry:current-frame",
      handoff_section: "current_frame_section",
      entry_kind: "summarize",
      summary: "Current frame summary for packet candidate.",
      source_record_refs: ["handoff-context-update-contract:record"],
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      review_pressure: "operator_review_required",
      applied_status: "applied_to_local_handoff_context_snapshot",
      persistence_horizon: "local_project_handoff_context_apply_store",
    },
    {
      applied_entry_ref: "applied-entry:next-candidate",
      source_contract_entry_ref: "contract-entry:next-candidate",
      handoff_section: "next_candidates_section",
      entry_kind: "next_action_candidate",
      summary: "Next candidate summary for packet candidate.",
      source_record_refs: ["handoff-context-update-contract:record"],
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      review_pressure: "operator_review_required",
      applied_status: "applied_to_local_handoff_context_snapshot",
      persistence_horizon: "local_project_handoff_context_apply_store",
    },
  ];
  return {
    handoff_context_version: "applied_handoff_context.v0.1",
    scope: "project:augnes",
    as_of: AS_OF,
    source_contract_record_ref: "handoff-context-update-contract:record",
    source_handoff_context_update_contract_record_refs: [
      "handoff-context-update-contract:record",
    ],
    source_route_integration_read_ref: "cwp-route-integration-read:valid",
    source_runtime_current_working_perspective_ref: "current-working-perspective:runtime",
    source_applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    handoff_sections: {
      current_frame_section: [entries[0]],
      current_thesis_section: [],
      active_goals_section: [],
      next_candidates_section: [entries[1]],
      open_questions_section: [],
      active_risks_section: [],
      continuity_relay_section: [],
      perspective_units_section: [],
      next_work_bias_section: [],
      route_integration_metadata_section: [],
      operator_review_required_section: [],
      blocked_or_missing_context_section: [],
    },
    applied_entries: entries,
    previous_context_summary: {
      supplied: false,
      preserved_as_previous_context_only: true,
      summary: null,
      source_refs: [],
    },
    apply_metadata: {
      local_snapshot_only: true,
      does_not_send_handoff: true,
      does_not_write_live_packet: true,
      future_copy_export_required: true,
      future_send_required: true,
    },
    authority_boundary: readOnlyAppliedAuthority(),
    ...overrides,
  };
}

function readOnlyAppliedAuthority(overrides = {}) {
  return {
    read_only: true,
    advisory_only: true,
    apply_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_context_apply_record: false,
    can_create_applied_handoff_context_snapshot: false,
    can_apply_handoff_context_update_to_local_snapshot: false,
    can_apply_handoff_context_update_live: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_copy_export_handoff_packet: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_handoff_context_update_contract_record: false,
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
    can_call_github: false,
    can_call_provider_openai: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    ...overrides,
  };
}

function writeAuthority(overrides = {}) {
  return {
    durable_local_handoff_context_apply_record: true,
    durable_local_applied_handoff_context_snapshot: true,
    source_of_truth: false,
    local_project_handoff_context_apply_only: true,
    can_write_db: true,
    can_create_handoff_context_apply_record: true,
    can_create_handoff_context_apply_receipt: true,
    can_create_applied_handoff_context_snapshot: true,
    can_apply_handoff_context_update_to_local_snapshot: true,
    can_apply_handoff_context_update_live: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_copy_export_handoff_packet: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_handoff_context_update_contract_record: false,
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
    can_call_github: false,
    can_call_provider_openai: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    ...overrides,
  };
}

function buildSnapshot(overrides = {}) {
  const context = buildAppliedContext();
  return {
    snapshot_version: "applied_handoff_context_snapshot.v0.1",
    applied_handoff_context_snapshot_ref: "applied-handoff-context-snapshot:valid",
    scope: "project:augnes",
    as_of: AS_OF,
    source_handoff_context_update_contract_record_ref:
      "handoff-context-update-contract:record",
    source_route_integration_read_ref: "cwp-route-integration-read:valid",
    source_runtime_current_working_perspective_ref:
      "current-working-perspective:runtime",
    source_applied_snapshot_ref:
      "current-working-perspective-applied-snapshot:valid",
    applied_handoff_context: context,
    applied_handoff_context_entries: context.applied_entries,
    applied_entry_count: context.applied_entries.length,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    authority_boundary: writeAuthority(),
    ...overrides,
  };
}

function buildApplyRecord(snapshot = buildSnapshot(), overrides = {}) {
  return {
    record_version: "handoff_context_apply_record.v0.1",
    record_id: "handoff-context-apply:record",
    scope: "project:augnes",
    applied_snapshot: snapshot,
    ...overrides,
  };
}

function buildAppliedRead(overrides = {}) {
  const snapshot = buildSnapshot();
  return {
    read_version: "applied_handoff_context_read.v0.1",
    status: "latest_applied_handoff_context_snapshot_available",
    scope: "project:augnes",
    latest_applied_snapshot: snapshot,
    latest_record: buildApplyRecord(snapshot),
    summary: {
      applied_handoff_context_snapshot_ref:
        snapshot.applied_handoff_context_snapshot_ref,
      source_contract_record_ref:
        snapshot.source_handoff_context_update_contract_record_ref,
      source_route_integration_read_ref: snapshot.source_route_integration_read_ref,
      as_of: snapshot.as_of,
      section_counts: { current_frame_section: 1, next_candidates_section: 1 },
      entry_count: snapshot.applied_entry_count,
      previous_context_used: false,
      copy_export_still_pending: true,
      send_still_pending: true,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_apply_handoff_context_update_live: false,
      can_send_handoff: false,
      can_copy_export_handoff_packet: false,
      can_mutate_memory: false,
      can_call_github: false,
      can_call_provider_openai: false,
    },
    ...overrides,
  };
}

function buildApplyReview(overrides = {}) {
  const snapshot = buildSnapshot();
  return {
    review_version: "handoff_context_apply_record_review.v0.1",
    review_status: "records_available",
    input_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      invalid_record_count: 0,
    },
    records: [buildApplyRecord(snapshot)],
    applied_snapshots: [snapshot],
    latest_record_summary: { record_id: "handoff-context-apply:record" },
    latest_applied_snapshot_summary: {
      applied_handoff_context_snapshot_ref:
        snapshot.applied_handoff_context_snapshot_ref,
    },
    evidence_summary: {
      has_receipt_side_effect_problem: false,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      problem_record_ids: [],
    },
    source_refs: sourceRefs,
    ...overrides,
  };
}

function buildPreview(overrides = {}) {
  return buildHandoffPacketCopyExportContractPreviewV01({
    applied_handoff_context_read: buildAppliedRead(),
    handoff_context_apply_record_review: buildApplyReview(),
    requested_packet_format: "operator_handoff_packet_markdown",
    requested_copy_export_target: "operator_copy_surface_candidate",
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
  return buildHandoffPacketCopyExportContractOperatorDecisionPreviewV01({
    handoff_packet_copy_export_contract_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent:
      "approve_for_handoff_packet_copy_export_contract_record",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision = buildDecision(), overrides = {}) {
  return {
    operator_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_handoff_packet_copy_export_contract_record",
      approved_by: "operator:packet-copy-export-contract-approver",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:scoped-local-packet-copy-export-contract-only",
      checklist_confirmations: [
        "confirm:copy-export-contract-record-only",
        "confirm:no-packet-copy-export-download-clipboard-or-send",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:scoped-local-copy-export-contract"],
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function assertNotReady(preview, reason) {
  assert.notEqual(
    preview.contract_preview_status,
    "ready_for_future_handoff_packet_copy_export_contract_record_write",
    reason,
  );
  assert.equal(preview.contract_readiness.write_ready, false, reason);
}

function assertPreviewBlocks(preview, blocker, reason) {
  assertNotReady(preview, reason);
  assert(
    preview.blocking_reasons.includes(blocker),
    `${reason}: expected ${blocker}`,
  );
}

function buildAppliedReadWithContextAuthority(field) {
  const snapshot = buildSnapshot({
    applied_handoff_context: buildAppliedContext({
      authority_boundary: readOnlyAppliedAuthority({ [field]: true }),
    }),
  });
  return buildAppliedRead({
    latest_applied_snapshot: snapshot,
    latest_record: buildApplyRecord(snapshot),
  });
}

function buildAppliedReadWithSnapshotAuthority(field) {
  const snapshot = buildSnapshot({
    authority_boundary: writeAuthority({ [field]: true }),
  });
  return buildAppliedRead({
    latest_applied_snapshot: snapshot,
    latest_record: buildApplyRecord(snapshot),
  });
}

assertNotReady(
  buildHandoffPacketCopyExportContractPreviewV01({
    requested_packet_format: "operator_handoff_packet_markdown",
    requested_copy_export_target: "operator_copy_surface_candidate",
  }),
  "preview without applied read is not ready",
);

assertNotReady(
  buildPreview({
    applied_handoff_context_read: {
      ...buildAppliedRead(),
      status: "no_applied_handoff_context_snapshot",
      latest_applied_snapshot: null,
    },
  }),
  "no applied handoff snapshot status is not ready",
);

assert(
  buildPreview({
    applied_handoff_context_read: {
      ...buildAppliedRead(),
      latest_applied_snapshot: { nope: true },
    },
  }).blocking_reasons.includes("applied_handoff_context_snapshot_malformed"),
  "malformed latest applied snapshot blocks",
);

assert(
  buildPreview({
    applied_handoff_context_read: {
      ...buildAppliedRead(),
      latest_applied_snapshot: buildSnapshot({
        applied_handoff_context: {
          ...buildAppliedContext(),
          handoff_context_version: "wrong",
        },
      }),
    },
  }).blocking_reasons.includes("applied_handoff_context_snapshot_malformed"),
  "malformed applied handoff context blocks",
);

assert(
  buildPreview({
    applied_handoff_context_read: {
      ...buildAppliedRead(),
      latest_applied_snapshot: buildSnapshot({
        applied_handoff_context_entries: [],
        applied_entry_count: 0,
      }),
    },
  }).blocking_reasons.includes("applied_handoff_context_entries_missing"),
  "empty applied snapshot entries block",
);

assert(
  buildPreview({
    handoff_context_apply_record_review: buildApplyReview({
      review_status: "records_invalid",
    }),
  }).blocking_reasons.includes("handoff_context_apply_record_review_invalid"),
  "records_invalid apply review blocks",
);

assert(
  buildPreview({
    handoff_context_apply_record_review: buildApplyReview({
      evidence_summary: {
        has_receipt_side_effect_problem: true,
        evidence_refs: evidenceRefs,
      },
    }),
  }).blocking_reasons.includes(
    "handoff_context_apply_record_review_receipt_side_effect_invalid",
  ),
  "corrupt apply receipt side effect blocks",
);

assert(
  buildPreview({
    handoff_context_apply_record_review: buildApplyReview({
      applied_snapshots: [
        {
          applied_handoff_context_snapshot_ref:
            "applied-handoff-context-snapshot:other",
        },
      ],
      latest_applied_snapshot_summary: {
        applied_handoff_context_snapshot_ref:
          "applied-handoff-context-snapshot:other",
      },
    }),
  }).blocking_reasons.includes(
    "applied_handoff_context_snapshot_not_supported_by_apply_record_review",
  ),
  "applied snapshot must be supported by apply review",
);

assertNotReady(
  buildPreview({ requested_packet_format: undefined }),
  "missing packet format is not ready",
);
assert(
  buildPreview({ requested_packet_format: "unsupported-format" }).refusal_reasons.includes(
    "requested_packet_format_unsupported",
  ),
  "unsupported packet format refused",
);
assertNotReady(
  buildPreview({ requested_copy_export_target: undefined }),
  "missing target is not ready",
);
assert(
  buildPreview({
    requested_copy_export_target: "unsupported-target",
  }).refusal_reasons.includes("requested_copy_export_target_unsupported"),
  "unsupported copy/export target refused",
);
assertNotReady(buildPreview({ source_refs: [] }), "missing source refs not ready");
assertNotReady(
  buildPreview({ requested_operator_ref: undefined }),
  "missing operator ref not ready",
);
assertNotReady(
  buildPreview({ requested_idempotency_key: undefined }),
  "missing idempotency key not ready",
);
assertNotReady(
  buildPreview({ review_confirmation_ref: undefined }),
  "missing review confirmation not ready",
);
assert(
  buildPreview({ source_refs: ["secret:unsafe"] }).refusal_reasons.includes(
    "unsafe_refs_refused",
  ),
  "unsafe refs refused",
);
assert(
  buildPreview({
    existing_handoff_packet_or_capsule: { raw_text: "private material" },
  }).refusal_reasons.includes(
    "raw_or_private_existing_handoff_packet_or_capsule_refused",
  ),
  "raw existing handoff material refused",
);

for (const field of [
  "can_write_clipboard",
  "can_write_handoff_packet_file",
  "can_write_dogfood_metrics",
  "can_create_pr",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
]) {
  assertPreviewBlocks(
    buildPreview({
      applied_handoff_context_read: buildAppliedReadWithContextAuthority(field),
    }),
    "applied_handoff_context_authority_boundary_invalid",
    `forged applied handoff context authority ${field} blocks`,
  );
}

for (const field of [
  "can_write_clipboard",
  "can_download_file",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_dogfood_metrics",
  "can_create_pr",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
]) {
  assertPreviewBlocks(
    buildPreview({
      applied_handoff_context_read: buildAppliedReadWithSnapshotAuthority(field),
    }),
    "applied_handoff_context_snapshot_authority_boundary_invalid",
    `forged applied snapshot authority ${field} blocks`,
  );
}

assertPreviewBlocks(
  buildPreview({
    applied_handoff_context_read: undefined,
    applied_handoff_context_snapshot: buildSnapshot({
      applied_handoff_context: buildAppliedContext({
        authority_boundary: readOnlyAppliedAuthority({
          can_write_clipboard: true,
        }),
      }),
    }),
  }),
  "applied_handoff_context_authority_boundary_invalid",
  "direct applied snapshot applied context authority blocks",
);

assertPreviewBlocks(
  buildPreview({
    applied_handoff_context_read: undefined,
    applied_handoff_context_snapshot: buildSnapshot({
      authority_boundary: writeAuthority({ can_download_file: true }),
    }),
  }),
  "applied_handoff_context_snapshot_authority_boundary_invalid",
  "direct applied snapshot authority blocks",
);

const readyPreview = buildPreview();
assert.equal(
  readyPreview.contract_preview_status,
  "ready_for_future_handoff_packet_copy_export_contract_record_write",
);
assert.equal(readyPreview.contract_readiness.write_ready, true);
assert(readyPreview.proposed_handoff_packet_copy_export_contract);
assert(readyPreview.proposed_handoff_packet_copy_export_contract.proposed_packet_entries.length >= 4);
assert.equal(
  readyPreview.authority_boundary.can_copy_export_handoff_packet,
  false,
);
assert.equal(readyPreview.authority_boundary.can_write_clipboard, false);
assert.equal(readyPreview.authority_boundary.can_send_handoff, false);

const notReadyDecision =
  buildHandoffPacketCopyExportContractOperatorDecisionPreviewV01({
    handoff_packet_copy_export_contract_preview: buildPreview({
      requested_operator_ref: undefined,
    }),
  });
assert.notEqual(
  notReadyDecision.decision_preview_status,
  "ready_for_future_handoff_packet_copy_export_contract_record_write",
);
assert.notEqual(
  buildDecision(readyPreview, { operator_decision_intent: undefined })
    .decision_preview_status,
  "ready_for_future_handoff_packet_copy_export_contract_record_write",
);
const readyDecision = buildDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_handoff_packet_copy_export_contract_record_write",
);

assert.equal(
  writeLib.validateHandoffPacketCopyExportContractWriteInputV01(
    buildWriteInput(notReadyDecision),
  ).ok,
  false,
  "writer refuses non-ready decision preview",
);
assert.equal(existsSync(path.join(root, dbPath)), false);

assert(
  writeLib
    .validateHandoffPacketCopyExportContractWriteInputV01(
      buildWriteInput(readyDecision, { idempotency_key: "idempotency:mismatch" }),
    )
    .refusal_reasons.includes("idempotency_key_mismatch_with_decision_preview"),
  "writer refuses idempotency mismatch",
);

const operatorMismatch = buildWriteInput(readyDecision);
operatorMismatch.operator_approval.operator_ref = "operator:different";
assert(
  writeLib
    .validateHandoffPacketCopyExportContractWriteInputV01(operatorMismatch)
    .refusal_reasons.includes("operator_ref_mismatch_with_decision_preview"),
  "writer refuses operator ref mismatch",
);

for (const sideEffect of [
  "handoff_packet_copied",
  "handoff_packet_exported",
  "handoff_packet_file_written",
  "clipboard_written",
  "file_download_created",
  "handoff_sent",
  "selected_refs_written_to_live_handoff",
  "memory_written",
  "provider_called",
  "github_called",
]) {
  const result = writeLib.validateHandoffPacketCopyExportContractWriteInputV01(
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
    .validateHandoffPacketCopyExportContractWriteInputV01(rawWrite)
    .refusal_reasons.includes("raw_or_private_marker_material_refused"),
  "writer refuses raw material",
);

const forgedDecision = buildDecision(readyPreview);
forgedDecision.authority_boundary.can_write_clipboard = true;
assert(
  writeLib
    .validateHandoffPacketCopyExportContractWriteInputV01(
      buildWriteInput(forgedDecision),
    )
    .refusal_reasons.includes("operator_decision_preview_authority_boundary_invalid"),
  "writer refuses forged decision authority",
);

const malformedManifestDecision = buildDecision(clone(readyPreview));
malformedManifestDecision.would_write_handoff_packet_copy_export_contract_decision_preview.contract_preview.would_write_handoff_packet_copy_export_contract_record_preview.proposed_packet_manifest.manifest_version =
  "wrong";
assert(
  writeLib
    .validateHandoffPacketCopyExportContractWriteInputV01(
      buildWriteInput(malformedManifestDecision),
    )
    .refusal_reasons.includes("handoff_packet_manifest_malformed"),
  "writer refuses malformed manifest",
);

const db = new Database(path.join(root, dbPath));
const writeResult = writeLib.writeHandoffPacketCopyExportContractRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(writeResult.status, "written");
assert(writeResult.record);
assert.equal(
  writeResult.receipt.no_side_effects
    .handoff_packet_copy_export_contract_record_written,
  true,
);
assert.equal(
  writeResult.receipt.no_side_effects
    .handoff_packet_copy_export_contract_receipt_written,
  true,
);
assert.equal(
  writeResult.receipt.no_side_effects.handoff_packet_copy_export_contract_persisted,
  true,
);
assert.equal(
  writeResult.receipt.no_side_effects.handoff_packet_copy_export_contract_written,
  true,
);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(writeResult.receipt.no_side_effects[field], false, field);
}

const replayResult = writeLib.writeHandoffPacketCopyExportContractRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(replayResult.status, "idempotent_existing");
assert.equal(
  replayResult.receipt.no_side_effects
    .handoff_packet_copy_export_contract_record_written,
  false,
  "idempotent replay does not claim new record write",
);
assert.equal(
  replayResult.receipt.no_side_effects.handoff_packet_copy_export_contract_persisted,
  false,
  "idempotent replay does not claim persisted write",
);

const conflictDecision = buildDecision(
  buildPreview({ requested_packet_format: "dual_markdown_and_json" }),
);
const conflict = writeLib.writeHandoffPacketCopyExportContractRecordV01(
  buildWriteInput(conflictDecision),
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

const byId = writeLib.readHandoffPacketCopyExportContractRecordByIdV01(
  writeResult.record.record_id,
  { db },
);
assert.equal(byId.status, "read");
const byKey = writeLib.readHandoffPacketCopyExportContractRecordByIdempotencyKeyV01(
  idempotencyKey,
  { db },
);
assert.equal(byKey.status, "read");
const listed = writeLib.listHandoffPacketCopyExportContractRecordsV01({
  db,
  packet_format: "operator_handoff_packet_markdown",
  copy_export_target: "operator_copy_surface_candidate",
});
assert.equal(listed.status, "listed");
assert.equal(listed.records.length, 1);
db.close();

const reviewDefault = buildHandoffPacketCopyExportContractRecordReviewV01();
assert.equal(reviewDefault.review_status, "no_records");
const reviewValid = buildHandoffPacketCopyExportContractRecordReviewV01({
  store_result: writeResult,
});
assert.equal(reviewValid.review_status, "records_available");
const malformedReview = buildHandoffPacketCopyExportContractRecordReviewV01({
  records: [{ record_id: "bad" }],
});
assert.equal(malformedReview.review_status, "records_invalid");
const corruptReceipt = clone(writeResult);
corruptReceipt.receipt.no_side_effects.handoff_packet_copied = true;
assert.equal(
  buildHandoffPacketCopyExportContractRecordReviewV01({
    store_result: corruptReceipt,
  }).review_status,
  "records_invalid",
);
for (const field of [
  "handoff_packet_copied",
  "clipboard_written",
  "handoff_sent",
]) {
  const forged = clone(writeResult.record);
  forged.no_copy_export_or_send_performed[field] = true;
  assert.equal(
    buildHandoffPacketCopyExportContractRecordReviewV01({
      records: [forged],
    }).review_status,
    "records_invalid",
    `review flags forged no side effect ${field}`,
  );
}
for (const field of [
  "can_copy_export_handoff_packet",
  "can_write_clipboard",
  "can_download_file",
  "can_send_handoff",
  "can_write_dogfood_metrics",
  "can_create_pr",
  "can_create_graph_or_vector_store",
]) {
  const forged = clone(writeResult.record);
  forged.authority_boundary[field] = true;
  assert.equal(
    buildHandoffPacketCopyExportContractRecordReviewV01({
      records: [forged],
    }).review_status,
    "records_invalid",
    `review flags forged authority ${field}`,
  );
}
const rawRecord = clone(writeResult.record);
rawRecord.raw_report = "private";
assert.equal(
  buildHandoffPacketCopyExportContractRecordReviewV01({
    records: [rawRecord],
  }).review_status,
  "records_invalid",
  "review refuses raw material keys",
);

const missingDb = ".tmp/handoff-packet-copy-export-contracts/missing.db";
assert.equal(
  readReviewLib.readHandoffPacketCopyExportContractRecordReviewForWebV01({
    db_path: missingDb,
  }).review_status,
  "no_records",
);
assert.equal(existsSync(path.join(root, missingDb)), false);

assert.equal(
  route.isSafeHandoffPacketCopyExportContractRouteDbPathV01(
    "../handoff-packet-copy-export-contracts/bad.sqlite",
  ),
  false,
);
assert.equal(
  route.isSafeHandoffPacketCopyExportContractRouteDbPathV01(dbPath),
  true,
);

async function routeJson(request) {
  const response = await route.POST(request);
  return {
    status: response.status,
    body: await response.json(),
  };
}

const invalidJsonResponse = await route.POST(
  new Request("http://localhost/api/workplane/handoff-packet-copy-export-contracts", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "{",
  }),
);
assert.equal(invalidJsonResponse.status, 400);

const invalidAction = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-export-contracts", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: JSON.stringify({ action: "copy", db_path: dbPath, input: {} }),
  }),
);
assert.equal(invalidAction.status, 400);
assert.equal(invalidAction.body.error_code, "invalid_action");

const crossSite = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-export-contracts", {
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

const routeDbPath = ".tmp/handoff-packet-copy-export-contracts/route.db";
const routeWrite = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-export-contracts", {
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
assert.equal(
  routeWrite.body.handoff_packet_copy_export_contract_record_written,
  true,
);
assert.equal(routeWrite.body.handoff_packet_copied, false);
assert.equal(routeWrite.body.clipboard_written, false);
assert.equal(routeWrite.body.handoff_sent, false);

const routeReplay = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-export-contracts", {
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
  routeReplay.body.receipt.no_side_effects
    .handoff_packet_copy_export_contract_record_written,
  false,
);

const badRouteDbPath = ".tmp/handoff-packet-copy-export-contracts/invalid.db";
const invalidWrite = clone(buildWriteInput(readyDecision));
invalidWrite.operator_decision_preview.authority_boundary.can_write_clipboard = true;
const invalidRouteWrite = await routeJson(
  new Request("http://localhost/api/workplane/handoff-packet-copy-export-contracts", {
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
  "components/workplane/handoff-packet-copy-export-contract-preview-panel.tsx",
  "components/workplane/handoff-packet-copy-export-contract-decision-panel.tsx",
  "components/workplane/handoff-packet-copy-export-contract-record-review-panel.tsx",
]) {
  const text = readFileSync(path.join(root, panel), "utf8");
  assert(!text.includes("<button"), `${panel} must not render buttons`);
  assert(!/onClick\s*=/.test(text), `${panel} must not include click handlers`);
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  applied_handoff_context_read: buildAppliedRead(),
  handoff_packet_copy_export_contract_preview: readyPreview,
  handoff_packet_copy_export_contract_decision_preview: readyDecision,
  handoff_packet_copy_export_contract_record_review: reviewValid,
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
for (const stepId of [
  "handoff_packet_copy_export_contract",
  "handoff_packet_copy_export_contract_decision",
  "handoff_packet_copy_export_contract_record",
]) {
  assert(stepIds.includes(stepId), `missing overview step ${stepId}`);
}
const overviewText = JSON.stringify(overview);
for (const forbidden of [
  "handoff_packet_copied",
  "handoff_packet_exported",
  "clipboard_written",
  "handoff_sent",
  "provider_called",
  "github_called",
  "codex_executed",
]) {
  assert(!overviewText.includes(`\"recommended_next_action\":\"${forbidden}\"`));
}

rmSync(tempDir, { recursive: true, force: true });
console.log("smoke-handoff-packet-copy-export-contract-v0-1: ok");
