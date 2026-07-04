#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/handoff-context-apply-preview.ts";
const helperFile = "lib/handoff/handoff-context-apply-preview.ts";
const panelFile = "components/handoff/handoff-context-apply-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile = "scripts/smoke-handoff-context-apply-preview-v0-1.mjs";
const recordReviewTypeFile =
  "types/handoff-context-update-record-review.ts";
const recordReviewHelperFile =
  "lib/handoff/handoff-context-update-record-review.ts";
const recordReviewPanelFile =
  "components/handoff/handoff-context-update-record-review-panel.tsx";
const recordReviewSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const recordReviewDbReadSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const writeSmokeFile =
  "scripts/smoke-handoff-context-update-write-v0-1.mjs";
const decisionSmokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const previewSmokeFile =
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const metricAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const agentWorkplaneSmokeFile =
  "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  recordReviewSmokeFile,
  recordReviewDbReadSmokeFile,
  writeSmokeFile,
  decisionSmokeFile,
  previewSmokeFile,
  metricAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneSmokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  recordReviewTypeFile,
  recordReviewHelperFile,
  recordReviewPanelFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-apply-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-apply-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_context_apply_preview.v0.1",
    "preview_status",
    "proposed_apply_delta",
    "selected_refs_to_add",
    "selected_refs_to_reinforce",
    "keep_unknown_as_review_only",
    "carry_forward_stop_if_missing",
    "authority_boundary",
    "can_write_db: false",
    "can_create_schema: false",
    "can_mutate_live_handoff_context: false",
    "can_write_selected_refs_to_live_handoff: false",
    "can_send_handoff: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildHandoffContextApplyPreviewV01",
    "createHandoffContextApplyPreviewAuthorityBoundaryV01",
    "no_apply_material",
    "selected_full_record_material_missing",
    "selected_record_full_material_invalid",
    "selected_record_approved_candidate_material_invalid",
    "selected_record_carry_forward_material_invalid",
    "unknown_selected_ref_candidate",
    "selected_ref_candidate_missing_evidence",
    "duplicate_selected_ref_add_candidate",
    "current_handoff_context_missing",
    "selected_refs_to_add",
    "selected_refs_to_reinforce",
    "keep_unknown_as_review_only",
    "carry_forward_stop_if_missing",
    "read_only_apply_preview: true",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Handoff Context Apply Preview",
    "Preview status",
    "candidate delta",
    "source and evidence",
    "Live handoff context not mutated",
    "can_create_schema",
    "can_send_handoff",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "HandoffContextApplyPreviewPanel",
    "buildHandoffContextApplyPreviewV01",
    "workbench:handoff_context_apply_preview",
    "HandoffContextUpdateRecordReviewPanel",
  ],
  { label: agentWorkplaneFile },
);

for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
]) {
  assertNoForbiddenApplyPreviewRuntimeCall(label, text);
}
assertNoForbiddenWorkbenchRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assert(!panelText.includes("<button"), "apply preview panel must not add buttons");
assert(
  !/<button[^>]*>[^<]*(Write|Apply|Approve|Send)/i.test(agentWorkplaneText),
  "Workbench must not render write/apply/approve/send buttons",
);

const reviewModule = await import(
  "../lib/handoff/handoff-context-update-record-review.ts"
);
const applyModule = await import(
  "../lib/handoff/handoff-context-apply-preview.ts"
);
const { buildApprovedHandoffContextUpdateRecordReviewV01 } = reviewModule;
const { buildHandoffContextApplyPreviewV01 } = applyModule;

const missingReviewPreview = buildHandoffContextApplyPreviewV01({
  as_of: "2026-07-04T10:00:00.000Z",
  scope: "project:augnes",
});
assert.equal(missingReviewPreview.preview_status, "insufficient_data");
assert(
  missingReviewPreview.insufficient_data_reasons.includes(
    "record_review_missing",
  ),
);
assert.equal(missingReviewPreview.input_summary.apply_candidate_count, 0);
assertApplyAuthorityFalse(missingReviewPreview);

const emptyReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [],
  scope: "project:augnes",
  as_of: "2026-07-04T10:01:00.000Z",
});
const noRecordsPreview = buildHandoffContextApplyPreviewV01({
  record_review: emptyReview,
  as_of: "2026-07-04T10:02:00.000Z",
});
assert.equal(noRecordsPreview.preview_status, "no_records");
assert.equal(noRecordsPreview.input_summary.apply_candidate_count, 0);
assert.deepEqual(noRecordsPreview.proposed_apply_delta.selected_refs_to_add, []);

const validRecord = approvedApplyRecord({
  record_id: "hcu-record:durable-apply-alpha",
  idempotency_key: "hcu-idempotency:durable-apply-alpha",
  created_at: "2026-07-04T10:03:00.000Z",
});
const validReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [validRecord],
  selected_record_id: validRecord.record_id,
  scope: "project:augnes",
  as_of: "2026-07-04T10:04:00.000Z",
});

const summaryOnlyPreview = buildHandoffContextApplyPreviewV01({
  record_review: validReview,
  as_of: "2026-07-04T10:05:00.000Z",
});
assert.equal(summaryOnlyPreview.preview_status, "insufficient_data");
assert(
  summaryOnlyPreview.insufficient_data_reasons.includes("no_apply_material"),
);
assert.equal(summaryOnlyPreview.input_summary.selected_full_record_supplied, false);
assert.equal(summaryOnlyPreview.input_summary.apply_candidate_count, 0);
assert.equal(
  summaryOnlyPreview.proposed_apply_delta.selected_refs_to_add.length,
  0,
);

let partialSelectedRecordPreview;
assert.doesNotThrow(() => {
  partialSelectedRecordPreview = buildHandoffContextApplyPreviewV01({
    record_review: validReview,
    selected_record: {
      record_version: "operator_approved_handoff_context_update_record.v0.1",
      record_id: validRecord.record_id,
    },
    as_of: "2026-07-04T10:05:30.000Z",
  });
});
assert(
  ["insufficient_data", "blocked"].includes(
    partialSelectedRecordPreview.preview_status,
  ),
);
assert.equal(
  partialSelectedRecordPreview.input_summary.selected_full_record_supplied,
  false,
);
assert.equal(partialSelectedRecordPreview.input_summary.apply_candidate_count, 0);
assert.equal(
  partialSelectedRecordPreview.proposed_apply_delta.selected_refs_to_add.length,
  0,
);
assert(
  partialSelectedRecordPreview.insufficient_data_reasons.includes(
    "selected_record_full_material_invalid",
  ) ||
    partialSelectedRecordPreview.blocked_reasons.includes(
      "selected_record_full_material_invalid",
    ),
);

const positivePreview = buildHandoffContextApplyPreviewV01({
  record_review: validReview,
  selected_record: validRecord,
  current_selected_refs: ["context-ref:durable-current-anchor"],
  as_of: "2026-07-04T10:06:00.000Z",
  source_refs: ["operator-review-request:durable-apply-preview"],
});
assert(
  ["apply_candidates_available", "needs_operator_review"].includes(
    positivePreview.preview_status,
  ),
);
assert.equal(positivePreview.input_summary.selected_full_record_supplied, true);
assert.equal(positivePreview.proposed_apply_delta.selected_refs_to_add.length, 1);
assert.equal(
  positivePreview.proposed_apply_delta.selected_refs_to_add[0].ref_id,
  "context-ref:durable-apply-add",
);
assert.equal(
  positivePreview.proposed_apply_delta.selected_refs_to_reinforce.length,
  1,
);
assert.equal(
  positivePreview.proposed_apply_delta.warnings_to_add_or_strengthen.length,
  1,
);
assert.equal(
  positivePreview.proposed_apply_delta.context_refs_to_deprioritize.length,
  1,
);
assert.equal(positivePreview.proposed_apply_delta.context_refs_to_exclude.length, 1);
assert.equal(
  positivePreview.proposed_apply_delta.keep_unknown_as_review_only.length,
  1,
);
assert.equal(
  positivePreview.proposed_apply_delta.expected_return_signal_updates.length,
  1,
);
assert.equal(
  positivePreview.proposed_apply_delta.carry_forward_stop_if_missing.length,
  1,
);
assert.equal(
  positivePreview.proposed_apply_delta.rejected_or_excluded_review_notes.length,
  1,
);
assert.equal(
  positivePreview.proposed_apply_delta.keep_unknown_as_review_only[0]
    .candidate_kind,
  "keep_unknown",
);
assert.equal(
  positivePreview.proposed_apply_delta.keep_unknown_as_review_only[0].ref_id,
  "context-ref:durable-apply-unknown",
);
assert.equal(
  positivePreview.proposed_apply_delta.selected_refs_to_add.some(
    (candidate) => candidate.ref_id === "context-ref:durable-apply-unknown",
  ),
  false,
);
assert.equal(
  positivePreview.evidence_summary.all_apply_candidates_evidence_backed,
  true,
);
assert.equal(
  positivePreview.evidence_summary.no_live_handoff_mutation_confirmed,
  true,
);
assert.equal(positivePreview.evidence_summary.no_handoff_send_confirmed, true);
assert.equal(
  positivePreview.evidence_summary.no_provider_github_codex_confirmed,
  true,
);
assertApplyAuthorityFalse(positivePreview);

const invalidRecordReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [
    {
      record_version: "operator_approved_handoff_context_update_record.v0.1",
      record_id: "hcu-record:durable-apply-invalid",
      record_fingerprint: "record-fingerprint:durable-apply-invalid",
      write_validation: {
        validation_hash: "validation-hash:durable-apply-invalid",
      },
    },
  ],
  scope: "project:augnes",
  as_of: "2026-07-04T10:07:00.000Z",
});
const invalidPreview = buildHandoffContextApplyPreviewV01({
  record_review: invalidRecordReview,
  as_of: "2026-07-04T10:08:00.000Z",
});
assert.equal(invalidPreview.preview_status, "blocked");
assert(
  invalidPreview.blocked_reasons.some((reason) =>
    reason.includes("record_review_problem_record"),
  ),
);
assert(
  invalidPreview.evidence_summary.problem_record_ids.includes(
    "hcu-record:durable-apply-invalid",
  ),
);

const missingSelectedReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [validRecord],
  selected_record_id: "hcu-record:durable-apply-missing",
  scope: "project:augnes",
  as_of: "2026-07-04T10:09:00.000Z",
});
const missingSelectedPreview = buildHandoffContextApplyPreviewV01({
  record_review: missingSelectedReview,
  as_of: "2026-07-04T10:10:00.000Z",
});
assert.equal(missingSelectedPreview.preview_status, "no_selected_record");
assert(
  missingSelectedPreview.insufficient_data_reasons.includes(
    "selected_record_not_found",
  ),
);

const missingEvidenceRecord = cloneJson(validRecord);
missingEvidenceRecord.record_id = "hcu-record:durable-apply-missing-evidence";
missingEvidenceRecord.approved_candidate_material.selected_ref_add_candidates[0].evidence_refs =
  [];
const missingEvidenceReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [missingEvidenceRecord],
  selected_record_id: missingEvidenceRecord.record_id,
  scope: "project:augnes",
  as_of: "2026-07-04T10:11:00.000Z",
});
const missingEvidencePreview = buildHandoffContextApplyPreviewV01({
  record_review: missingEvidenceReview,
  selected_record: missingEvidenceRecord,
  current_selected_refs: ["context-ref:durable-current-anchor"],
  as_of: "2026-07-04T10:12:00.000Z",
});
assert.equal(missingEvidencePreview.preview_status, "blocked");
assert(
  missingEvidencePreview.blocked_reasons.some((reason) =>
    reason.includes("selected_ref_candidate_missing_evidence"),
  ),
);
assert(
  missingEvidencePreview.conflict_summary.missing_evidence_candidates.includes(
    "candidate:durable-apply-add",
  ),
);
assert.equal(
  missingEvidencePreview.evidence_summary.all_apply_candidates_evidence_backed,
  false,
);

const unknownSelectedRecord = cloneJson(validRecord);
unknownSelectedRecord.record_id = "hcu-record:durable-apply-unknown-selected";
unknownSelectedRecord.approved_candidate_material.selected_ref_add_candidates = [
  candidate("unknown-selected", "selected_ref", "unknown", [
    "evidence-ref:durable-apply-unknown-selected",
  ]),
];
const unknownSelectedReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [unknownSelectedRecord],
  selected_record_id: unknownSelectedRecord.record_id,
  scope: "project:augnes",
  as_of: "2026-07-04T10:13:00.000Z",
});
const unknownSelectedPreview = buildHandoffContextApplyPreviewV01({
  record_review: unknownSelectedReview,
  selected_record: unknownSelectedRecord,
  current_selected_refs: ["context-ref:durable-current-anchor"],
  as_of: "2026-07-04T10:14:00.000Z",
});
assert.equal(unknownSelectedPreview.preview_status, "blocked");
assert(
  unknownSelectedPreview.conflict_summary.unknown_selected_ref_attempts.includes(
    "candidate:durable-apply-unknown-selected",
  ),
);
assert.equal(
  unknownSelectedPreview.proposed_apply_delta.selected_refs_to_add.some(
    (candidate) =>
      candidate.ref_id === "context-ref:durable-apply-unknown-selected",
  ),
  false,
);

const duplicatePreview = buildHandoffContextApplyPreviewV01({
  record_review: validReview,
  selected_record: validRecord,
  current_selected_refs: ["context-ref:durable-apply-add"],
  as_of: "2026-07-04T10:15:00.000Z",
});
assert.equal(duplicatePreview.preview_status, "blocked");
assert(
  duplicatePreview.conflict_summary.duplicate_selected_refs.includes(
    "context-ref:durable-apply-add",
  ),
);
assert(
  duplicatePreview.conflict_summary.conflicting_candidate_ids.includes(
    "candidate:durable-apply-add",
  ),
);
assert.equal(
  duplicatePreview.proposed_apply_delta.selected_refs_to_add.some(
    (candidate) => candidate.ref_id === "context-ref:durable-apply-add",
  ),
  false,
);
assert(
  duplicatePreview.blocked_reasons.includes(
    "duplicate_selected_ref_add_candidate:candidate:durable-apply-add",
  ),
);

const missingCurrentContextPreview = buildHandoffContextApplyPreviewV01({
  record_review: validReview,
  selected_record: validRecord,
  as_of: "2026-07-04T10:16:00.000Z",
});
assert(
  missingCurrentContextPreview.insufficient_data_reasons.includes(
    "current_handoff_context_missing",
  ),
);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-apply-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context apply preview file: ${file}`,
  );
}
const appRouteFiles = changedAndUntrackedFiles.filter((file) =>
  /^app\/api\/.*\/route\.ts$/.test(file),
);
assert.deepEqual(
  appRouteFiles,
  [],
  "handoff context apply preview must not add or modify app route files",
);

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-apply-preview-v0-1",
      pass: true,
      no_records_checked: true,
      summary_only_no_apply_material_checked: true,
      partial_selected_record_no_throw_checked: true,
      positive_mapping_checked: true,
      invalid_record_review_blocked_checked: true,
      selected_record_missing_checked: true,
      missing_evidence_blocked_checked: true,
      unknown_selected_ref_blocked_checked: true,
      duplicate_selected_ref_checked: true,
      current_context_missing_checked: true,
      workbench_panel_marker_checked: true,
      no_route_changed: true,
      authority_boundary_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-context-apply-preview-v0-1");

function approvedApplyRecord({ record_id, idempotency_key, created_at }) {
  return {
    record_version: "operator_approved_handoff_context_update_record.v0.1",
    record_id,
    idempotency_key,
    created_at,
    scope: "project:augnes",
    operator_decision: "approve_for_future_write",
    operator_approval: {
      approved_by: "operator:durable-apply-reviewer",
      operator_ref: "operator-ref:durable-apply-reviewer",
      approved_at: created_at,
      approval_statement:
        "Operator approved durable handoff context update material for preview.",
      checklist_confirmations: {
        "record has public-safe operator refs": true,
        "record stays separate from live handoff context": true,
      },
    },
    source_refs: ["operator-record-source:durable-apply"],
    decision_preview_refs: {
      preview_version: "handoff_context_update_operator_decision_preview.v0.1",
      decision_preview_status: "ready_for_future_write",
      recommended_operator_decision: "approve_for_future_write",
      write_ready: true,
      preview_as_of: created_at,
      source_refs: ["decision-preview-ref:durable-apply"],
    },
    update_preview_refs: {
      update_preview_ref: "update-preview-ref:durable-apply",
      update_preview_version: "handoff_context_update_preview.v0.1",
      update_preview_candidate_status: "update_candidates_available",
      source_refs: ["update-preview-source:durable-apply"],
      evidence_refs: ["evidence-ref:durable-apply-preview"],
    },
    approved_candidate_material: {
      selected_ref_add_candidates: [
        candidate("add", "selected_ref", "helpful", [
          "evidence-ref:durable-apply-add",
        ]),
      ],
      selected_ref_reinforcement_candidates: [
        candidate("reinforce", "selected_ref", "helpful", [
          "evidence-ref:durable-apply-reinforce",
        ]),
      ],
      warning_update_candidates: [
        candidate("warning", "warning", "stale", [
          "evidence-ref:durable-apply-warning",
        ]),
      ],
      context_diet_candidates: [
        candidate("diet-noisy", "context_diet", "noisy", [
          "evidence-ref:durable-apply-diet-noisy",
        ]),
        candidate("diet-misleading", "context_diet", "misleading", [
          "evidence-ref:durable-apply-diet-misleading",
        ]),
      ],
      keep_unknown_candidates: [
        candidate("unknown", "unknown_context", "unknown", [
          "evidence-ref:durable-apply-unknown",
        ]),
      ],
      expected_return_signal_candidates: [
        candidate("expected", "expected_return_signal", "expected_observed_mismatch", [
          "evidence-ref:durable-apply-expected",
        ]),
      ],
    },
    carry_forward_material: {
      unresolved_blockers: [],
      missing_evidence: [],
      stop_if_missing_candidates: [
        candidate("stop", "stop_if_missing", "carry_forward", [
          "evidence-ref:durable-apply-stop",
        ]),
      ],
      rejected_or_excluded_candidates: [
        candidate("rejected", "context_diet", "misleading", [
          "evidence-ref:durable-apply-rejected",
        ]),
      ],
    },
    evidence_summary: {
      has_update_preview: true,
      update_preview_version_valid: true,
      has_candidate_material: true,
      has_selected_ref_signal: true,
      has_warning_signal: true,
      has_context_diet_signal: true,
      has_stop_if_missing_signal: true,
      has_expected_return_signal: true,
      has_unknown_signal: true,
      has_missing_evidence: false,
      has_insufficient_data: false,
      source_authority_boundary_valid: true,
      source_write_readiness_false: true,
      evidence_refs: [
        "evidence-ref:durable-apply-add",
        "evidence-ref:durable-apply-preview",
      ],
      missing_evidence: [],
    },
    write_validation: {
      validation_version:
        "operator_approved_handoff_context_update_write_validation.v0.1",
      write_ready_revalidated: true,
      required_approval_requirements: [
        "operator approval is explicit",
        "candidate refs are evidence backed",
      ],
      checklist_confirmations_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      validation_hash: "validation-hash:durable-apply",
    },
    authority_boundary: {
      operator_approved_record_only: true,
      source_of_truth: false,
      durable_local_record: true,
      can_write_db: true,
      can_write_handoff_context_update_record: true,
      can_write_operator_approved_handoff_context_update_record: true,
      can_persist_general_operator_decision: false,
      can_mutate_live_handoff_context: false,
      can_write_selected_refs_to_live_handoff: false,
      can_send_handoff: false,
      can_write_continuity_relay: false,
      can_update_current_working_perspective: false,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_write_memory: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_apply_project_perspective: false,
      can_create_promotion_decision: false,
      can_create_formation_receipt: false,
      can_write_dogfood_metrics: false,
      can_update_metrics: false,
      can_write_dogfood_ledger: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: ["Already-written local record authority only."],
    },
    no_side_effects: {
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
      continuity_relay_written: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      memory_mutated: false,
      dogfood_metrics_written: false,
      reuse_ledger_written: false,
      provider_called: false,
      github_called: false,
      codex_executed: false,
      pr_created: false,
      pr_merged: false,
      autonomous_action_run: false,
      graph_or_vector_store_created: false,
      rag_stack_created: false,
      crawler_or_browser_observer_created: false,
    },
    notes: ["Approved candidate material remains apply-preview material only."],
    record_fingerprint: "record-fingerprint:durable-apply",
  };
}

function candidate(suffix, kind, bucket, evidenceRefs) {
  return {
    candidate_id: `candidate:durable-apply-${suffix}`,
    ref_id: `context-ref:durable-apply-${suffix}`,
    label: `Durable apply ${suffix}`,
    summary: `Durable apply ${suffix} candidate`,
    candidate_kind: kind,
    source_bucket: bucket,
    source_adjustment_kind: "add",
    source_candidate_id: `source-candidate:durable-apply-${suffix}`,
    source_refs: [`source-ref:durable-apply-${suffix}`],
    evidence_refs: evidenceRefs,
    source_record_refs: [`source-record-ref:durable-apply-${suffix}`],
    existing_handoff_ref_ids:
      suffix === "reinforce" ? ["context-ref:durable-existing"] : [],
    candidate_only: true,
    review_note: "Apply preview material only.",
  };
}

function assertApplyAuthorityFalse(preview) {
  for (const [field, value] of Object.entries(preview.authority_boundary)) {
    if (["read_only_apply_preview", "advisory_only"].includes(field)) {
      assert.equal(value, true, `${field} should be true`);
      continue;
    }
    if (field === "notes") continue;
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoForbiddenApplyPreviewRuntimeCall(label, text) {
  for (const forbidden of [
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "readHandoffContextUpdateRecordReviewForWebV01",
    "readHandoffContextUpdateRecordByIdV01",
    "readHandoffContextUpdateRecordByIdempotencyKeyV01",
    "listHandoffContextUpdateRecordsV01",
    "better-sqlite3",
    "new Database",
    "/api/handoff/context-updates",
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "Octokit",
    "@octokit",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "sendHandoff(",
    "writeSelectedRef",
    "applyPerspective(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoForbiddenWorkbenchRuntimeCall(label, text) {
  for (const forbidden of [
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "/api/handoff/context-updates",
    "fetch(",
    "<button",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "sendHandoff(",
    "writeSelectedRef",
    "applyPerspective(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
