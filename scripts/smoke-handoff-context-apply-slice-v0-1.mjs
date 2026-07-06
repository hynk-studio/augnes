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
  scriptName: "smoke:handoff-context-apply-slice-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-apply-slice-v0-1.mjs",
});

const expectedFiles = [
  "types/handoff-context-apply-slice-preview.ts",
  "lib/workplane/handoff-context-apply-preview.ts",
  "components/workplane/handoff-context-apply-preview-panel.tsx",
  "types/handoff-context-apply-slice-decision.ts",
  "lib/workplane/handoff-context-apply-decision.ts",
  "components/workplane/handoff-context-apply-decision-panel.tsx",
  "types/handoff-context-apply-write.ts",
  "lib/workplane/handoff-context-apply-write.ts",
  "app/api/workplane/handoff-context-applies/route.ts",
  "types/handoff-context-apply-record-review.ts",
  "lib/workplane/handoff-context-apply-record-review.ts",
  "lib/workplane/read-handoff-context-apply-record-review-for-web.ts",
  "lib/workplane/read-applied-handoff-context-for-web.ts",
  "components/workplane/handoff-context-apply-record-review-panel.tsx",
  "components/workplane/applied-handoff-context-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
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

for (const file of expectedFiles.slice(0, 15)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "handoff_context_apply_slice_v0_1",
});

const textByFile = loadTextByFile(
  expectedFiles.filter((file) => existsSync(path.join(root, file))),
);
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "handoff_context_apply_preview.v0.1",
  "handoff_context_apply_operator_decision_preview.v0.1",
  "handoff_context_apply_record.v0.1",
  "handoff_context_apply_receipt.v0.1",
  "applied_handoff_context_snapshot.v0.1",
  "handoff_context_apply_store.v0.1",
  "handoff_context_apply_record_review.v0.1",
  "review_handoff_context_apply_preview",
  "write_handoff_context_apply_record",
  "review_applied_handoff_context_snapshot",
  "prepare_handoff_packet_copy_export_contract",
  "prepare_handoff_send_contract",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const previewLib = await import(
  "../lib/workplane/handoff-context-apply-preview.ts"
);
const decisionLib = await import(
  "../lib/workplane/handoff-context-apply-decision.ts"
);
const writeLib = await import(
  "../lib/workplane/handoff-context-apply-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/handoff-context-apply-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-handoff-context-apply-record-review-for-web.ts"
);
const appliedReadLib = await import(
  "../lib/workplane/read-applied-handoff-context-for-web.ts"
);
const updateContractReviewLib = await import(
  "../lib/workplane/handoff-context-update-contract-record-review.ts"
);
const route = await import("../app/api/workplane/handoff-context-applies/route.ts");
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const { buildHandoffContextApplyPreviewV01 } = previewLib;
const { buildHandoffContextApplyOperatorDecisionPreviewV01 } = decisionLib;
const {
  buildHandoffContextApplyRecordReviewV01,
} = reviewLib;
const {
  buildHandoffContextUpdateContractRecordReviewV01,
} = updateContractReviewLib;

const AS_OF = "2026-07-06T00:00:00.000Z";
const sourceRefs = ["source:handoff-context-apply"];
const evidenceRefs = ["evidence:handoff-context-apply"];
const operatorRef = "operator:handoff-context-apply";
const idempotencyKey = "idempotency:handoff-context-apply";
const reviewRef = "review:handoff-context-apply";
const dbPath = ".tmp/handoff-context-applies/smoke.db";
const tempDir = path.join(root, ".tmp/handoff-context-applies");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const forbiddenNoSideEffectFields = [
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "handoff_sent",
  "selected_refs_written_to_live_handoff",
  "handoff_packet_copy_exported",
  "handoff_packet_sent",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "handoff_context_update_contract_record_written",
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

function buildPreview(overrides = {}) {
  return buildHandoffContextApplyPreviewV01({
    handoff_context_update_contract_record_review: validContractReview(),
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
  return buildHandoffContextApplyOperatorDecisionPreviewV01({
    handoff_context_apply_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent: "approve_for_handoff_context_apply_record",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision = buildDecision(), overrides = {}) {
  return {
    apply_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_handoff_context_apply_record",
      approved_by: "operator:handoff-context-apply-approver",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:scoped-local-handoff-apply-only",
      checklist_confirmations: [
        "confirm:handoff-context-local-snapshot-only",
        "confirm:no-handoff-send-copy-export-or-live-mutation",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:scoped-local-handoff-apply"],
    ...overrides,
  };
}

function contractRecord(overrides = {}) {
  const entries = [
    entry("entry:current-frame", "current_frame_section", "summarize"),
    entry("entry:next-action", "next_candidates_section", "next_action_candidate"),
    entry("entry:risk", "active_risks_section", "warn"),
  ];
  return {
    record_version: "handoff_context_update_contract_record.v0.1",
    record_id: "handoff-context-update-contract:valid",
    idempotency_key: "idempotency:handoff-context-update-contract-valid",
    created_at: AS_OF,
    scope: "project:augnes",
    operator_ref: "operator:handoff-context-update-contract",
    source_refs: ["source:handoff-context-update-contract"],
    evidence_refs: evidenceRefs,
    source_route_integration_read_ref: "cwp-route-integration-read:valid",
    source_runtime_current_working_perspective_ref: "cwp-runtime:valid",
    source_applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
    source_route_integration_contract_record_refs: [
      "current-working-perspective-route-integration-contract:valid",
    ],
    source_cwp_apply_record_refs: ["current-working-perspective-apply:valid"],
    source_continuity_relay_record_refs: ["continuity-relay:valid"],
    source_perspective_unit_record_refs: ["perspective-unit:valid"],
    source_next_work_bias_record_refs: ["perspective-next-work-bias:valid"],
    proposed_handoff_context_update_contract: {
      contract_kind: "handoff_context_update_contract.v0.1",
      handoff_context_family: "augnes_operator_handoff_context",
      source_route_integration_read_ref: "cwp-route-integration-read:valid",
      source_route_integration_status: "runtime_with_applied_snapshot_overlay_candidate",
      source_route_integration_response_mode:
        "runtime_primary_with_applied_overlay_candidate",
      source_runtime_current_working_perspective_ref: "cwp-runtime:valid",
      source_applied_snapshot_ref:
        "current-working-perspective-applied-snapshot:valid",
      source_route_integration_contract_record_refs: [
        "current-working-perspective-route-integration-contract:valid",
      ],
      source_cwp_apply_record_refs: ["current-working-perspective-apply:valid"],
      source_continuity_relay_record_refs: ["continuity-relay:valid"],
      source_perspective_unit_record_refs: ["perspective-unit:valid"],
      source_next_work_bias_record_refs: ["perspective-next-work-bias:valid"],
      requested_handoff_context_mode: "route_integrated_cwp_summary",
      proposed_handoff_sections: Object.fromEntries(
        [
          "current_frame_section",
          "current_thesis_section",
          "active_goals_section",
          "next_candidates_section",
          "open_questions_section",
          "active_risks_section",
          "continuity_relay_section",
          "perspective_units_section",
          "next_work_bias_section",
          "route_integration_metadata_section",
          "operator_review_required_section",
          "blocked_or_missing_context_section",
        ].map((section) => [
          section,
          entries.filter((candidate) => candidate.handoff_section === section),
        ]),
      ),
      proposed_handoff_context_entries: entries,
      proposed_handoff_packet_delta: {
        packet_delta_kind: "handoff_context_update_candidate",
        existing_handoff_material_ref: null,
        proposed_entry_count: entries.length,
        does_not_apply_or_send: true,
      },
      required_source_refs: sourceRefs,
      required_evidence_refs: evidenceRefs,
      blocked_live_mutations: ["handoff_send", "live_handoff_mutation"],
      future_apply_requirements: ["future_handoff_context_apply_slice_required"],
      operator_acceptance_criteria: ["operator_confirms_local_apply_only"],
      rollback_and_fallback_plan: ["ignore_local_snapshot_without_send_contract"],
    },
    proposed_handoff_context_entries: entries,
    proposed_handoff_context_entry_count: entries.length,
    proposed_handoff_section_counts: {
      current_frame_section: 1,
      next_candidates_section: 1,
      active_risks_section: 1,
    },
    authority_profile: updateContractAuthorityProfile(),
    review_status: "recorded_as_scoped_handoff_context_update_contract",
    persistence_horizon: "local_project_handoff_context_update_contract_store",
    no_handoff_apply_performed: updateContractNoHandoffApply(),
    write_validation: {
      validation_version: "handoff_context_update_contract_write_validation.v0.1",
      operator_decision_preview_revalidated: true,
      handoff_context_update_contract_revalidated: true,
      handoff_context_entries_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_handoff_apply_or_send: false,
      refused_metric_or_upstream_write: false,
      validation_hash: "hash:handoff-context-update-contract",
    },
    authority_boundary: updateContractAuthorityBoundary(),
    notes: ["note:handoff-context-update-contract"],
    record_fingerprint: "fingerprint:handoff-context-update-contract-valid",
    ...overrides,
  };
}

function validContractReview(record = contractRecord(), overrides = {}) {
  return buildHandoffContextUpdateContractRecordReviewV01({
    records: [record],
    selected_record_id: record.record_id,
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: ["source:handoff-context-update-contract-review"],
    ...overrides,
  });
}

function noEvidenceContractRecord() {
  const record = contractRecord({ evidence_refs: [] });
  const entries = record.proposed_handoff_context_entries.map((candidate) => ({
    ...candidate,
    evidence_refs: [],
  }));
  record.proposed_handoff_context_entries = entries;
  record.proposed_handoff_context_update_contract.proposed_handoff_context_entries =
    entries;
  record.proposed_handoff_context_update_contract.required_evidence_refs = [];
  record.proposed_handoff_context_update_contract.proposed_handoff_sections =
    Object.fromEntries(
      Object.keys(
        record.proposed_handoff_context_update_contract.proposed_handoff_sections,
      ).map((section) => [
        section,
        entries.filter((candidate) => candidate.handoff_section === section),
      ]),
    );
  return record;
}

function entry(entryRef, handoffSection, entryKind) {
  return {
    entry_ref: entryRef,
    handoff_section: handoffSection,
    entry_kind: entryKind,
    summary: `Summary for ${entryRef}`,
    source_record_refs: ["handoff-context-update-contract:valid"],
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    review_pressure: "operator_review",
    authority_required: "future_handoff_context_apply",
    persistence_horizon: "handoff_context_update_contract_record",
  };
}

function updateContractAuthorityProfile() {
  return {
    durable_local_handoff_context_update_contract: true,
    source_of_truth: false,
    local_project_handoff_context_update_contract_only: true,
    persistence_horizon: "local_project_handoff_context_update_contract_store",
    handoff_context_update_contract_written: true,
    handoff_context_update_applied: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    current_working_perspective_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  };
}

function updateContractNoHandoffApply() {
  return {
    handoff_context_updated: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
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

function updateContractAuthorityBoundary() {
  return {
    durable_local_handoff_context_update_contract: true,
    source_of_truth: false,
    local_project_handoff_context_update_contract_only: true,
    can_write_db: true,
    can_create_handoff_context_update_contract_record: true,
    can_create_handoff_context_update_contract_receipt: true,
    can_apply_handoff_context_update: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs_to_live_handoff: false,
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
    notes: ["authority:handoff-context-update-contract"],
  };
}

function expectNotReady(preview, reason) {
  assert.notEqual(
    preview.apply_preview_status,
    "ready_for_future_handoff_context_apply_record_write",
    reason,
  );
}

function assertForbiddenNoSideEffectsFalse(noSideEffects) {
  for (const field of forbiddenNoSideEffectFields) {
    assert.equal(noSideEffects[field], false, `${field} should remain false`);
  }
}

function requestFor(body, headers = {}) {
  return new Request("http://localhost/api/workplane/handoff-context-applies", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

assert.equal(
  buildHandoffContextApplyPreviewV01({ as_of: AS_OF }).apply_preview_status,
  "no_handoff_context_update_contract_record",
);
expectNotReady(
  buildPreview({
    handoff_context_update_contract_record_review: { review_version: "bad" },
  }),
  "malformed review should not be ready",
);
expectNotReady(
  buildPreview({
    handoff_context_update_contract_record_review:
      buildHandoffContextUpdateContractRecordReviewV01({
        records: [{ record_version: "handoff_context_update_contract_record.v0.1" }],
      }),
  }),
  "records_invalid review should not be ready",
);
expectNotReady(
  buildPreview({
    handoff_context_update_contract_record_review: validContractReview(
      contractRecord(),
      { selected_record_id: "handoff-context-update-contract:missing" },
    ),
  }),
  "selected missing should not be ready",
);
expectNotReady(
  buildPreview({
    handoff_context_update_contract_record_review: validContractReview(
      contractRecord({
        proposed_handoff_context_entries: [],
        proposed_handoff_context_entry_count: 0,
      }),
    ),
  }),
  "empty entries should not be ready",
);
expectNotReady(buildPreview({ source_refs: [] }), "source refs required");
expectNotReady(
  buildPreview({
    handoff_context_update_contract_record_review:
      validContractReview(noEvidenceContractRecord()),
  }),
  "evidence refs required",
);
expectNotReady(
  buildPreview({ requested_operator_ref: undefined }),
  "operator ref required",
);
expectNotReady(
  buildPreview({ requested_idempotency_key: undefined }),
  "idempotency key required",
);
expectNotReady(
  buildPreview({ review_confirmation_ref: undefined }),
  "review confirmation required",
);
assert(
  buildPreview({ source_refs: ["/Users/private/path"] }).refusal_reasons.includes(
    "unsafe_source_refs_refused",
  ),
);
assert(
  buildPreview({
    existing_handoff_packet_or_capsule: { raw_text: "private" },
  }).refusal_reasons.includes("raw_or_private_existing_handoff_material_refused"),
);

const existingHandoff = {
  summary: "Existing handoff summary",
  source_refs: ["source:previous-handoff"],
};
const before = structuredClone(existingHandoff);
const readyPreview = buildPreview({
  current_handoff_context_read: existingHandoff,
});
assert.equal(
  readyPreview.apply_preview_status,
  "ready_for_future_handoff_context_apply_record_write",
);
assert.deepEqual(existingHandoff, before, "preview must not mutate input handoff");
assert.equal(
  readyPreview.proposed_applied_handoff_context.previous_context_summary
    .preserved_as_previous_context_only,
  true,
);
assert.equal(readyPreview.authority_boundary.can_write_db, false);
assert.equal(readyPreview.authority_boundary.can_send_handoff, false);
assert.equal(
  readyPreview.authority_boundary.can_copy_export_handoff_packet,
  false,
);

assert.notEqual(
  buildHandoffContextApplyOperatorDecisionPreviewV01({
    handoff_context_apply_preview: buildPreview({
      requested_idempotency_key: undefined,
    }),
  }).decision_preview_status,
  "ready_for_future_handoff_context_apply_record_write",
);
assert.notEqual(
  buildDecision(readyPreview, {
    operator_decision_intent: "keep_preview_only",
  }).decision_preview_status,
  "ready_for_future_handoff_context_apply_record_write",
);
const readyDecision = buildDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_handoff_context_apply_record_write",
);

const invalidDbPath = ".tmp/handoff-context-applies/invalid-write.db";
rmSync(path.join(root, invalidDbPath), { force: true });
const invalidWriteResult = writeLib.validateHandoffContextApplyWriteInputV01(
  buildWriteInput(
    buildDecision(
      buildPreview({
        requested_idempotency_key: undefined,
      }),
    ),
  ),
);
assert.equal(invalidWriteResult.ok, false);
assert(!existsSync(path.join(root, invalidDbPath)), "invalid validation opened no DB");

assert(
  writeLib
    .validateHandoffContextApplyWriteInputV01(
      buildWriteInput(readyDecision, { idempotency_key: "idempotency:mismatch" }),
    )
    .refusal_reasons.includes("idempotency_key_mismatch_with_decision_preview"),
);
const operatorMismatch = buildWriteInput(readyDecision);
operatorMismatch.operator_approval.operator_ref = "operator:other";
assert(
  writeLib
    .validateHandoffContextApplyWriteInputV01(operatorMismatch)
    .refusal_reasons.includes("operator_ref_mismatch_with_decision_preview"),
);
assert(
  writeLib
    .validateHandoffContextApplyWriteInputV01({
      ...buildWriteInput(readyDecision),
      notes: ["/Users/private/path"],
    })
    .refusal_reasons.includes("notes_contain_unsafe_ref"),
);
assert(
  writeLib
    .validateHandoffContextApplyWriteInputV01({
      ...buildWriteInput(readyDecision),
      requested_side_effects: { handoff_sent: true },
    })
    .refusal_reasons.some((reason) =>
      reason.includes("forbidden_requested_side_effect_handoff_sent"),
    ),
);
for (const sideEffect of [
  "handoff_packet_copy_exported",
  "selected_refs_written_to_live_handoff",
  "memory_written",
  "provider_called",
  "github_called",
]) {
  assert.equal(
    writeLib.validateHandoffContextApplyWriteInputV01({
      ...buildWriteInput(readyDecision),
      requested_side_effects: { [sideEffect]: true },
    }).ok,
    false,
    `${sideEffect} should be refused`,
  );
}
const malformedSnapshotDecision = structuredClone(readyDecision);
malformedSnapshotDecision.would_write_handoff_context_apply_decision_preview.contract_preview.would_write_handoff_context_apply_record_preview.proposed_applied_handoff_context = {};
assert(
  writeLib
    .validateHandoffContextApplyWriteInputV01(
      buildWriteInput(malformedSnapshotDecision),
    )
    .refusal_reasons.includes("applied_handoff_context_snapshot_malformed"),
);
const malformedPlanDecision = structuredClone(readyDecision);
malformedPlanDecision.would_write_handoff_context_apply_decision_preview.contract_preview.would_write_handoff_context_apply_record_preview.proposed_handoff_context_apply_plan = {};
assert(
  writeLib
    .validateHandoffContextApplyWriteInputV01(buildWriteInput(malformedPlanDecision))
    .refusal_reasons.includes("handoff_context_apply_plan_malformed"),
);
const forgedAuthorityDecision = structuredClone(readyDecision);
forgedAuthorityDecision.would_write_handoff_context_apply_decision_preview.contract_preview.would_write_handoff_context_apply_record_preview.proposed_applied_handoff_context.authority_boundary.can_send_handoff = true;
assert.equal(
  writeLib.validateHandoffContextApplyWriteInputV01(
    buildWriteInput(forgedAuthorityDecision),
  ).ok,
  false,
);

for (const field of [
  "can_modify_api_perspective_current_route",
  "can_write_dogfood_metrics",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
]) {
  const forgedAppliedContextAuthorityDecision = structuredClone(readyDecision);
  forgedAppliedContextAuthorityDecision.would_write_handoff_context_apply_decision_preview.contract_preview.would_write_handoff_context_apply_record_preview.proposed_applied_handoff_context.authority_boundary[field] = true;
  const validation = writeLib.validateHandoffContextApplyWriteInputV01(
    buildWriteInput(forgedAppliedContextAuthorityDecision),
  );
  assert.equal(validation.ok, false, `${field} should be refused`);
  assert(
    validation.refusal_reasons.includes(
      "applied_handoff_context_authority_boundary_invalid",
    ),
    `${field} should report applied context authority invalid`,
  );
}

for (const field of [
  "can_modify_api_perspective_current_route",
  "can_create_pr",
  "can_write_dogfood_metrics",
]) {
  const forgedDecisionAuthority = structuredClone(readyDecision);
  forgedDecisionAuthority.authority_boundary[field] = true;
  const validation = writeLib.validateHandoffContextApplyWriteInputV01(
    buildWriteInput(forgedDecisionAuthority),
  );
  assert.equal(validation.ok, false, `${field} decision authority should refuse`);
  assert(
    validation.refusal_reasons.includes(
      "apply_decision_preview_authority_boundary_invalid",
    ),
    `${field} should report decision authority invalid`,
  );
}

const db = new Database(path.join(root, dbPath));
const writeResult = writeLib.writeHandoffContextApplyRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(writeResult.status, "written");
assert.equal(writeResult.receipt.wrote, true);
assert.equal(
  writeResult.no_side_effects.handoff_context_apply_record_written,
  true,
);
assert.equal(
  writeResult.no_side_effects.handoff_context_apply_receipt_written,
  true,
);
assert.equal(writeResult.no_side_effects.handoff_context_apply_persisted, true);
assert.equal(
  writeResult.no_side_effects.applied_handoff_context_snapshot_written,
  true,
);
assert.equal(
  writeResult.no_side_effects.handoff_context_update_applied_to_local_snapshot,
  true,
);
assertForbiddenNoSideEffectsFalse(writeResult.no_side_effects);

const replay = writeLib.writeHandoffContextApplyRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);
assert.equal(replay.no_side_effects.handoff_context_apply_record_written, false);
assert.equal(
  replay.no_side_effects.applied_handoff_context_snapshot_written,
  false,
);
assertForbiddenNoSideEffectsFalse(replay.no_side_effects);

const conflictDecision = structuredClone(readyDecision);
conflictDecision.would_write_handoff_context_apply_decision_preview.contract_preview.would_write_handoff_context_apply_record_preview.proposed_applied_handoff_context.applied_entries[0].summary =
  "different summary";
const conflict = writeLib.writeHandoffContextApplyRecordV01(
  buildWriteInput(conflictDecision),
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

assert.equal(
  writeLib.readHandoffContextApplyRecordByIdV01(writeResult.record.record_id, { db })
    .status,
  "read",
);
assert.equal(
  writeLib.readHandoffContextApplyRecordByIdempotencyKeyV01(idempotencyKey, {
    db,
  }).status,
  "read",
);
assert.equal(
  writeLib.readHandoffContextApplyRecordByAppliedSnapshotRefV01(
    writeResult.record.applied_handoff_context_snapshot_ref,
    { db },
  ).status,
  "read",
);
assert.equal(
  writeLib.readLatestAppliedHandoffContextSnapshotV01({ db }).status,
  "read",
);
db.prepare(
  `INSERT INTO handoff_context_apply_records (
    record_id, idempotency_key, created_at, scope, operator_ref,
    record_fingerprint, applied_snapshot_ref, record_json, applied_snapshot_json, receipt_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run(
  "handoff-context-apply:out-of-scope",
  "idempotency:out-of-scope",
  AS_OF,
  "project:other",
  operatorRef,
  "fingerprint:out-of-scope",
  "applied-handoff-context-snapshot:out-of-scope",
  JSON.stringify({
    ...writeResult.record,
    record_id: "handoff-context-apply:out-of-scope",
    scope: "project:other",
    idempotency_key: "idempotency:out-of-scope",
  }),
  JSON.stringify(writeResult.record.applied_snapshot),
  JSON.stringify(writeResult.receipt),
);
assert.equal(
  writeLib.listHandoffContextApplyRecordsV01({ db }).records.some(
    (record) => record.scope !== "project:augnes",
  ),
  false,
);
db.close();

const outOfScopeDbPath = ".tmp/handoff-context-applies/out-of-scope.db";
const outDb = new Database(path.join(root, outOfScopeDbPath));
writeLib.ensureHandoffContextApplyWriteSchemaV01(outDb);
outDb
  .prepare(
    `INSERT INTO handoff_context_apply_records (
      record_id, idempotency_key, created_at, scope, operator_ref,
      record_fingerprint, applied_snapshot_ref, record_json, applied_snapshot_json, receipt_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  .run(
    "handoff-context-apply:other-scope-only",
    idempotencyKey,
    AS_OF,
    "project:other",
    operatorRef,
    "fingerprint:other-scope-only",
    "applied-handoff-context-snapshot:other-scope-only",
    JSON.stringify({
      ...writeResult.record,
      record_id: "handoff-context-apply:other-scope-only",
      scope: "project:other",
    }),
    JSON.stringify(writeResult.record.applied_snapshot),
    JSON.stringify(writeResult.receipt),
  );
const outReplay = writeLib.writeHandoffContextApplyRecordV01(
  buildWriteInput(readyDecision),
  { db: outDb },
);
assert.notEqual(outReplay.status, "idempotent_existing");
outDb.close();

const emptyDbPath = ".tmp/handoff-context-applies/empty.db";
new Database(path.join(root, emptyDbPath)).close();
const emptyDb = new Database(path.join(root, emptyDbPath), {
  readonly: true,
  fileMustExist: true,
});
assert.equal(
  writeLib.listHandoffContextApplyRecordsV01({ db: emptyDb }).status,
  "schema_missing",
);
emptyDb.close();

assert.equal(buildHandoffContextApplyRecordReviewV01().review_status, "no_records");
const review = buildHandoffContextApplyRecordReviewV01({
  store_result: writeResult,
});
assert.equal(review.review_status, "records_available");
assert.equal(review.input_summary.valid_record_count, 1);
const selectedSnapshotReview = buildHandoffContextApplyRecordReviewV01({
  records: [writeResult.record],
  selected_applied_handoff_context_snapshot_ref:
    writeResult.record.applied_handoff_context_snapshot_ref,
});
assert.equal(selectedSnapshotReview.review_status, "selected_applied_snapshot_found");
for (const mutation of [
  (record) => {
    record.applied_handoff_context = {};
  },
  (record) => {
    record.applied_snapshot.applied_handoff_context = {};
  },
  (record) => {
    record.authority_profile.handoff_sent = true;
  },
  (record) => {
    record.no_handoff_send_performed.handoff_sent = true;
  },
  (record) => {
    record.authority_boundary.can_send_handoff = true;
  },
  (record) => {
    record.applied_snapshot.applied_handoff_context_snapshot_ref =
      "applied-handoff-context-snapshot:mismatch";
  },
  (record) => {
    record.raw_text = "raw";
  },
]) {
  const forged = structuredClone(writeResult.record);
  mutation(forged);
  assert.equal(
    buildHandoffContextApplyRecordReviewV01({ records: [forged] }).review_status,
    "records_invalid",
  );
}
for (const field of [
  "can_write_dogfood_metrics",
  "can_create_pr",
  "can_create_graph_or_vector_store",
  "can_crawl_or_observe_browser",
]) {
  const forged = structuredClone(writeResult.record);
  forged.authority_boundary[field] = true;
  const forgedReview = buildHandoffContextApplyRecordReviewV01({
    records: [forged],
  });
  assert.equal(forgedReview.review_status, "records_invalid");
  assert(
    forgedReview.record_summaries[0].problem_reasons.includes(
      "handoff_context_apply_record_authority_boundary_invalid",
    ),
    `${field} should be reported as invalid record authority`,
  );
}
const forgedAppliedContextAuthorityRecord = structuredClone(writeResult.record);
forgedAppliedContextAuthorityRecord.applied_handoff_context.authority_boundary.can_modify_api_perspective_current_route = true;
const forgedAppliedContextAuthorityReview =
  buildHandoffContextApplyRecordReviewV01({
    records: [forgedAppliedContextAuthorityRecord],
  });
assert.equal(forgedAppliedContextAuthorityReview.review_status, "records_invalid");
assert(
  forgedAppliedContextAuthorityReview.record_summaries[0].problem_reasons.some(
    (reason) =>
      reason === "handoff_context_apply_record_malformed" ||
      reason === "handoff_context_applied_snapshot_malformed" ||
      reason === "applied_handoff_context_authority_boundary_invalid",
  ),
);
const forgedAppliedSnapshotAuthorityRecord = structuredClone(writeResult.record);
forgedAppliedSnapshotAuthorityRecord.applied_snapshot.authority_boundary.can_write_dogfood_metrics = true;
const forgedAppliedSnapshotAuthorityReview =
  buildHandoffContextApplyRecordReviewV01({
    records: [forgedAppliedSnapshotAuthorityRecord],
  });
assert.equal(forgedAppliedSnapshotAuthorityReview.review_status, "records_invalid");
assert(
  forgedAppliedSnapshotAuthorityReview.record_summaries[0].problem_reasons.some(
    (reason) =>
      reason === "handoff_context_apply_record_malformed" ||
      reason === "handoff_context_applied_snapshot_malformed" ||
      reason === "handoff_context_apply_record_authority_boundary_invalid",
  ),
);
const corruptStoreResult = structuredClone(writeResult);
corruptStoreResult.receipt.no_side_effects.handoff_sent = true;
assert.equal(
  buildHandoffContextApplyRecordReviewV01({
    store_result: corruptStoreResult,
  }).review_status,
  "records_invalid",
);

const noAppliedRead = appliedReadLib.readAppliedHandoffContextForWebV01();
assert.equal(noAppliedRead.status, "no_applied_handoff_context_snapshot");
const appliedRead = appliedReadLib.readAppliedHandoffContextForWebV01({
  store_result: writeResult,
});
assert.equal(
  appliedRead.status,
  "latest_applied_handoff_context_snapshot_available",
);
assert.equal(appliedRead.summary.entry_count, 3);

assert.equal(route.isSafeHandoffContextApplyRouteDbPathV01("../bad.db"), false);
let response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-context-applies", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: "{",
  }),
);
assert.equal(response.status, 400);
response = await route.POST(requestFor(null));
assert.equal(response.status, 400);
response = await route.POST(requestFor({ action: "send", db_path: dbPath }));
assert.equal(response.status, 400);
response = await route.POST(
  requestFor(
    { action: "write", db_path: dbPath, input: buildWriteInput(readyDecision) },
    { origin: "http://evil.example", host: "localhost" },
  ),
);
assert.equal(response.status, 403);
const invalidRoutePath = ".tmp/handoff-context-applies/invalid-route.db";
rmSync(path.join(root, invalidRoutePath), { force: true });
response = await route.POST(
  requestFor({
    action: "write",
    db_path: invalidRoutePath,
    input: buildWriteInput(buildDecision(buildPreview({ source_refs: [] }))),
  }),
);
assert.equal(response.status, 400);
assert(!existsSync(path.join(root, invalidRoutePath)));

const forgedRouteAuthorityDbPath =
  ".tmp/handoff-context-applies/forged-authority-route.db";
rmSync(path.join(root, forgedRouteAuthorityDbPath), { force: true });
const forgedRouteAuthorityDecision = structuredClone(readyDecision);
forgedRouteAuthorityDecision.would_write_handoff_context_apply_decision_preview.contract_preview.would_write_handoff_context_apply_record_preview.proposed_applied_handoff_context.authority_boundary.can_modify_api_perspective_current_route = true;
response = await route.POST(
  requestFor({
    action: "write",
    db_path: forgedRouteAuthorityDbPath,
    input: buildWriteInput(forgedRouteAuthorityDecision),
  }),
);
assert.equal(response.status, 400);
assert(!existsSync(path.join(root, forgedRouteAuthorityDbPath)));

const routeDbPath = ".tmp/handoff-context-applies/route.db";
response = await route.POST(
  requestFor({
    action: "write",
    db_path: routeDbPath,
    input: buildWriteInput(readyDecision),
  }),
);
assert.equal(response.status, 201);
let routeBody = await response.json();
assert.equal(routeBody.handoff_context_apply_record_written, true);
assertForbiddenNoSideEffectsFalse(routeBody.no_side_effects);
response = await route.POST(
  requestFor(
    {
      action: "write",
      db_path: routeDbPath,
      input: buildWriteInput(readyDecision),
    },
    { "x-forwarded-host": "localhost" },
  ),
);
assert.equal(response.status, 200);
routeBody = await response.json();
assert.equal(routeBody.store_result.status, "idempotent_existing");
assert.equal(routeBody.handoff_context_apply_record_written, false);
assert.equal(routeBody.no_side_effects.handoff_context_apply_record_written, false);
assert.equal(
  routeBody.no_side_effects.applied_handoff_context_snapshot_written,
  false,
);
assertForbiddenNoSideEffectsFalse(routeBody.no_side_effects);

const readReview = readReviewLib.readHandoffContextApplyRecordReviewForWebV01({
  store_result: writeResult,
});
assert.equal(readReview.review_status, "records_available");
assert.equal(
  readReviewLib.readHandoffContextApplyRecordReviewForWebV01({
    db_path: ".tmp/handoff-context-applies/bad.token.db",
  }).review_status,
  "records_invalid",
);

for (const file of [
  "components/workplane/handoff-context-apply-preview-panel.tsx",
  "components/workplane/handoff-context-apply-decision-panel.tsx",
  "components/workplane/handoff-context-apply-record-review-panel.tsx",
  "components/workplane/applied-handoff-context-panel.tsx",
]) {
  const text = readFileSync(path.join(root, file), "utf8");
  assert(!text.includes("<button"), `${file} must render no button element`);
  for (const handler of [
    "onClick",
    "import(",
    "apply(",
    "approve(",
    "send(",
    "launch(",
    "run(",
    "execute(",
    "merge(",
    "write(",
    "export(",
    "copy(",
  ]) {
    assert(!text.includes(handler), `${file} must not include ${handler}`);
  }
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  handoff_context_update_contract_record_review: validContractReview(),
  handoff_context_apply_preview: readyPreview,
  handoff_context_apply_operator_decision_preview: readyDecision,
  handoff_context_apply_record_review: review,
  applied_handoff_context_read: appliedRead,
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
for (const stepId of [
  "handoff_context_apply_preview",
  "handoff_context_apply_decision",
  "handoff_context_apply_record",
  "applied_handoff_context_snapshot",
]) {
  assert(stepIds.includes(stepId), `missing spine step ${stepId}`);
}
const overviewText = JSON.stringify(overview);
for (const forbidden of [
  "handoff_sent true",
  "handoff_packet_copy_exported true",
  "live_handoff_context_mutated true",
  "api_perspective_current_route_modified true",
  "memory_written true",
  "provider_called true",
  "github_called true",
  "codex_executed true",
  "graph_or_vector_store_created true",
  "browser_observed true",
]) {
  assert(!overviewText.includes(forbidden), `overview must not recommend ${forbidden}`);
}

console.log("smoke-handoff-context-apply-slice-v0-1 passed");
