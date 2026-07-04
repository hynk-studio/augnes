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

const typeFile = "types/handoff-context-update-record-review.ts";
const helperFile = "lib/handoff/handoff-context-update-record-review.ts";
const readForWebHelperFile =
  "lib/handoff/read-handoff-context-update-record-review-for-web.ts";
const panelFile =
  "components/handoff/handoff-context-update-record-review-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const dbReadSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const applyPreviewTypeFile = "types/handoff-context-apply-preview.ts";
const applyPreviewHelperFile =
  "lib/handoff/handoff-context-apply-preview.ts";
const applyPreviewPanelFile =
  "components/handoff/handoff-context-apply-preview-panel.tsx";
const applyPreviewSmokeFile =
  "scripts/smoke-handoff-context-apply-preview-v0-1.mjs";
const applyDecisionTypeFile =
  "types/handoff-context-apply-operator-decision-preview.ts";
const applyDecisionHelperFile =
  "lib/handoff/handoff-context-apply-operator-decision-preview.ts";
const applyDecisionPanelFile =
  "components/handoff/handoff-context-apply-operator-decision-preview-panel.tsx";
const applyDecisionSmokeFile =
  "scripts/smoke-handoff-context-apply-operator-decision-preview-v0-1.mjs";
const applyWriteContractTypeFile =
  "types/handoff-context-apply-write-contract-preview.ts";
const applyWriteContractHelperFile =
  "lib/handoff/handoff-context-apply-write-contract-preview.ts";
const applyWriteContractPanelFile =
  "components/handoff/handoff-context-apply-write-contract-preview-panel.tsx";
const applyWriteContractSmokeFile =
  "scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs";
const packageJsonFile = "package.json";
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
const selectedSessionDigestIntakeTypeFile =
  "types/selected-session-digest-intake-preview.ts";
const selectedSessionDigestIntakeHelperFile =
  "lib/intake/selected-session-digest-intake-preview.ts";
const selectedSessionDigestIntakePanelFile =
  "components/intake/selected-session-digest-intake-preview-panel.tsx";
const selectedSessionDigestIntakeSmokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  readForWebHelperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  dbReadSmokeFile,
  applyPreviewTypeFile,
  applyPreviewHelperFile,
  applyPreviewPanelFile,
  applyPreviewSmokeFile,
  applyDecisionTypeFile,
  applyDecisionHelperFile,
  applyDecisionPanelFile,
  applyDecisionSmokeFile,
  applyWriteContractTypeFile,
  applyWriteContractHelperFile,
  applyWriteContractPanelFile,
  applyWriteContractSmokeFile,
  packageJsonFile,
  writeSmokeFile,
  decisionSmokeFile,
  previewSmokeFile,
  metricAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneSmokeFile,
  selectedSessionDigestIntakeTypeFile,
  selectedSessionDigestIntakeHelperFile,
  selectedSessionDigestIntakePanelFile,
  selectedSessionDigestIntakeSmokeFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-update-record-review-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-update-record-review-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "approved_handoff_context_update_record_review.v0.1",
    "review_status",
    "record_summaries",
    "selected_record_summary",
    "approved_material_summary",
    "evidence_summary",
    "live_state_boundary",
    "can_create_schema: false",
    "can_write_handoff_context_update_record: false",
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
    "buildApprovedHandoffContextUpdateRecordReviewV01",
    "createApprovedHandoffContextUpdateRecordReviewAuthorityBoundaryV01",
    "record_id_missing",
    "operator_approval_missing_or_invalid",
    "source_refs_missing_or_invalid",
    "approved_candidate_material_missing_or_invalid",
    "carry_forward_material_missing_or_invalid",
    "no_side_effects_missing_or_invalid",
    "hasCandidateArrayFields",
    "record_fingerprint_missing",
    "write_validation_hash_missing",
    "authority_${field}_true",
    "no_side_effects_${field}_true",
    "selected_record_available",
    "invalid_records",
    "no_records",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Approved Handoff Context Update Record Review",
    "Review status",
    "approved material",
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
    "HandoffContextUpdateRecordReviewPanel",
    "readHandoffContextUpdateRecordReviewForWebV01",
    "workbench:handoff_context_update_record_review",
  ],
  { label: agentWorkplaneFile },
);

for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
  [agentWorkplaneFile, agentWorkplaneText],
]) {
  assertNoForbiddenReviewRuntimeCall(label, text);
}
assert(!panelText.includes("<button"), "record review panel must not add buttons");
assert(
  !agentWorkplaneText.includes("writeOperatorApprovedHandoffContextUpdateV01"),
  "Workbench must not import or call the handoff context update write helper",
);
assert(
  !agentWorkplaneText.includes("buildApprovedHandoffContextUpdateRecordReviewV01"),
  "Workbench should use the DB-backed read-for-web review helper",
);
assert(
  !agentWorkplaneText.includes("ensureHandoffContextUpdateWriteSchemaV01"),
  "Workbench must not import or call the handoff context update schema helper",
);
assert(
  !agentWorkplaneText.includes("/api/handoff/context-updates"),
  "Workbench must not call the handoff context update route",
);
assert(
  !/\bfetch\s*\(/.test(agentWorkplaneText),
  "Workbench must not fetch context update records during render",
);
assert(
  !/<button[^>]*>[^<]*(Write|Apply|Approve|Send)/i.test(agentWorkplaneText),
  "Workbench must not render write/apply/approve/send buttons for record review",
);

const reviewModule = await import(
  "../lib/handoff/handoff-context-update-record-review.ts"
);
const { buildApprovedHandoffContextUpdateRecordReviewV01 } = reviewModule;

const emptyReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [],
  scope: "project:augnes",
  as_of: "2026-07-04T08:00:00.000Z",
  source_refs: ["operator-review-request:record-review-v0-1"],
});
assert.equal(emptyReview.review_status, "no_records");
assert.equal(emptyReview.input_summary.supplied_record_count, 0);
assertReviewAuthorityFalse(emptyReview);

const partialRecordReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [
    {
      record_version: "operator_approved_handoff_context_update_record.v0.1",
      record_fingerprint: "record-fingerprint:durable-partial",
      write_validation: {
        validation_hash: "validation-hash:durable-partial",
      },
    },
  ],
  scope: "project:augnes",
  as_of: "2026-07-04T08:00:30.000Z",
});
assert.equal(partialRecordReview.review_status, "invalid_records");
assert.equal(partialRecordReview.input_summary.valid_record_count, 0);
assert(partialRecordReview.evidence_summary.problem_record_ids.includes("malformed_record:1"));
assert(
  partialRecordReview.record_summaries[0].problem_reasons.includes(
    "record_id_missing",
  ),
);
assert(
  partialRecordReview.record_summaries[0].problem_reasons.includes(
    "operator_approval_missing_or_invalid",
  ),
);

const validRecord = approvedRecord({
  record_id: "hcu-record:durable-alpha",
  idempotency_key: "hcu-idempotency:durable-alpha",
  created_at: "2026-07-04T08:01:00.000Z",
  operator_ref: "operator-ref:durable-alpha",
  approved_by: "operator:durable-reviewer",
  record_fingerprint: "record-fingerprint:durable-alpha",
  validation_hash: "validation-hash:durable-alpha",
});

const oneRecordReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [validRecord],
  scope: "project:augnes",
  as_of: "2026-07-04T08:02:00.000Z",
  source_refs: ["operator-review-request:durable-alpha"],
});
assert.equal(oneRecordReview.review_status, "records_available");
assert.equal(oneRecordReview.record_summaries.length, 1);
assert.equal(oneRecordReview.input_summary.valid_record_count, 1);
assert.equal(oneRecordReview.approved_material_summary.selected_ref_add_count, 1);
assert.equal(
  oneRecordReview.approved_material_summary.selected_ref_reinforcement_count,
  1,
);
assert.equal(oneRecordReview.approved_material_summary.warning_update_count, 1);
assert.equal(oneRecordReview.approved_material_summary.context_diet_count, 1);
assert.equal(oneRecordReview.approved_material_summary.keep_unknown_count, 1);
assert.equal(
  oneRecordReview.approved_material_summary.expected_return_signal_count,
  1,
);
assert.equal(oneRecordReview.approved_material_summary.stop_if_missing_count, 1);
assert.equal(
  oneRecordReview.approved_material_summary.rejected_or_excluded_count,
  1,
);
assert(oneRecordReview.evidence_summary.has_source_refs);
assert(oneRecordReview.evidence_summary.has_evidence_refs);
assert.deepEqual(
  oneRecordReview.evidence_summary.evidence_refs,
  uniqueSorted([
    "evidence-ref:durable-alpha-add",
    "evidence-ref:durable-alpha-diet",
    "evidence-ref:durable-alpha-expected",
    "evidence-ref:durable-alpha-keep",
    "evidence-ref:durable-alpha-rejected",
    "evidence-ref:durable-alpha-reinforce",
    "evidence-ref:durable-alpha-stop",
    "evidence-ref:durable-alpha-warning",
    "evidence-ref:durable-preview-alpha",
  ]),
);
assert.equal(oneRecordReview.input_summary.live_handoff_context_mutated_count, 0);
assert.equal(
  oneRecordReview.input_summary.selected_refs_written_to_live_handoff_count,
  0,
);
assert.equal(oneRecordReview.input_summary.handoff_sent_count, 0);

const emptyCandidateRecord = recordWithEmptyCandidateArrays({
  record_id: "hcu-record:durable-empty-candidates",
  idempotency_key: "hcu-idempotency:durable-empty-candidates",
  created_at: "2026-07-04T08:02:30.000Z",
  operator_ref: "operator-ref:durable-empty-candidates",
  approved_by: "operator:durable-reviewer",
  record_fingerprint: "record-fingerprint:durable-empty-candidates",
  validation_hash: "validation-hash:durable-empty-candidates",
});
const emptyCandidateReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [emptyCandidateRecord],
  scope: "project:augnes",
  as_of: "2026-07-04T08:02:45.000Z",
});
assert.equal(emptyCandidateReview.review_status, "records_available");
assert.equal(emptyCandidateReview.input_summary.valid_record_count, 1);
assert.deepEqual(emptyCandidateReview.record_summaries[0].problem_reasons, []);
assert.equal(
  emptyCandidateReview.approved_material_summary.selected_ref_add_count,
  0,
);
assert.equal(
  emptyCandidateReview.approved_material_summary.selected_ref_reinforcement_count,
  0,
);
assert.equal(emptyCandidateReview.approved_material_summary.warning_update_count, 0);
assert.equal(emptyCandidateReview.approved_material_summary.context_diet_count, 0);
assert.equal(emptyCandidateReview.approved_material_summary.keep_unknown_count, 0);
assert.equal(
  emptyCandidateReview.approved_material_summary.expected_return_signal_count,
  0,
);
assert.equal(emptyCandidateReview.approved_material_summary.stop_if_missing_count, 0);
assert.equal(
  emptyCandidateReview.approved_material_summary.rejected_or_excluded_count,
  0,
);

const selectedReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [validRecord],
  selected_record_id: validRecord.record_id,
  scope: "project:augnes",
  as_of: "2026-07-04T08:03:00.000Z",
});
assert.equal(selectedReview.review_status, "selected_record_available");
assert.equal(selectedReview.input_summary.selected_record_found, true);
assert.equal(
  selectedReview.selected_record_summary?.record_id,
  validRecord.record_id,
);

const missingSelectedReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [validRecord],
  selected_record_id: "hcu-record:durable-missing",
  scope: "project:augnes",
  as_of: "2026-07-04T08:04:00.000Z",
});
assert.equal(missingSelectedReview.review_status, "records_available");
assert.equal(missingSelectedReview.input_summary.selected_record_found, false);
assert(
  missingSelectedReview.insufficient_data_reasons.includes(
    "selected_record_not_found_in_valid_records",
  ),
);

const newerRecord = approvedRecord({
  record_id: "hcu-record:durable-beta",
  idempotency_key: "hcu-idempotency:durable-beta",
  created_at: "2026-07-04T08:05:00.000Z",
  operator_ref: "operator-ref:durable-beta",
  approved_by: "operator:durable-reviewer",
  record_fingerprint: "record-fingerprint:durable-beta",
  validation_hash: "validation-hash:durable-beta",
});
const multipleRecordReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [validRecord, newerRecord],
  scope: "project:augnes",
  as_of: "2026-07-04T08:06:00.000Z",
});
assert.equal(multipleRecordReview.record_summaries[0].record_id, newerRecord.record_id);
assert.equal(multipleRecordReview.input_summary.latest_record_id, newerRecord.record_id);

assertProblematicRecord(
  "record_fingerprint_missing",
  (record) => {
    delete record.record_fingerprint;
  },
);
assertProblematicRecord(
  "write_validation_hash_missing",
  (record) => {
    delete record.write_validation.validation_hash;
  },
);
assert.doesNotThrow(() =>
  buildApprovedHandoffContextUpdateRecordReviewV01({
    records: ["malformed durable record"],
    scope: "project:augnes",
    as_of: "2026-07-04T08:07:00.000Z",
  }),
);
const malformedReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: ["malformed durable record"],
  scope: "project:augnes",
  as_of: "2026-07-04T08:08:00.000Z",
});
assert.equal(malformedReview.review_status, "invalid_records");
assert.deepEqual(malformedReview.evidence_summary.problem_record_ids, [
  "malformed_record:1",
]);
assertProblematicRecord(
  "authority_can_mutate_live_handoff_context_true",
  (record) => {
    record.authority_boundary.can_mutate_live_handoff_context = true;
  },
);
assertProblematicRecord(
  "no_side_effects_handoff_sent_true",
  (record) => {
    record.no_side_effects.handoff_sent = true;
  },
);
assertProblematicRecord(
  "no_side_effects_selected_refs_written_to_live_handoff_true",
  (record) => {
    record.no_side_effects.selected_refs_written_to_live_handoff = true;
  },
);
const providerGithubCodexReview = buildApprovedHandoffContextUpdateRecordReviewV01({
  records: [
    mutateRecord((record) => {
      record.no_side_effects.provider_called = true;
      record.no_side_effects.github_called = true;
      record.no_side_effects.codex_executed = true;
    }),
  ],
  scope: "project:augnes",
  as_of: "2026-07-04T08:09:00.000Z",
});
assert.equal(providerGithubCodexReview.review_status, "invalid_records");
assert(
  providerGithubCodexReview.record_summaries[0].problem_reasons.includes(
    "no_side_effects_provider_called_true",
  ),
);
assert(
  providerGithubCodexReview.record_summaries[0].problem_reasons.includes(
    "no_side_effects_github_called_true",
  ),
);
assert(
  providerGithubCodexReview.record_summaries[0].problem_reasons.includes(
    "no_side_effects_codex_executed_true",
  ),
);
assert.equal(
  providerGithubCodexReview.evidence_summary
    .all_records_confirm_no_provider_github_codex,
  false,
);
assertReviewAuthorityFalse(providerGithubCodexReview);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-update-record-review-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context update record review file: ${file}`,
  );
}
const appRouteFiles = changedAndUntrackedFiles.filter((file) =>
  /^app\/api\/.*\/route\.ts$/.test(file),
);
assert.deepEqual(
  appRouteFiles,
  [],
  "record review must not add or modify app route files",
);

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-update-record-review-v0-1",
      pass: true,
      empty_review_checked: true,
      selected_record_checked: true,
      material_counts_checked: true,
      deduped_refs_checked: true,
      invalid_records_checked: true,
      workbench_panel_marker_checked: true,
      workbench_write_route_absent: true,
      no_app_route_changed: true,
      authority_boundary_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-context-update-record-review-v0-1");

function approvedRecord({
  record_id,
  idempotency_key,
  created_at,
  operator_ref,
  approved_by,
  record_fingerprint,
  validation_hash,
}) {
  return {
    record_version: "operator_approved_handoff_context_update_record.v0.1",
    record_id,
    idempotency_key,
    created_at,
    scope: "project:augnes",
    operator_decision: "approve_for_future_write",
    operator_approval: {
      approved_by,
      operator_ref,
      approved_at: created_at,
      approval_statement:
        "Operator approved these already-reviewed handoff context update candidates for durable record review.",
      checklist_confirmations: {
        "record has public-safe operator refs": true,
        "record stays separate from live handoff context": true,
      },
    },
    source_refs: [
      "operator-record-source:durable-alpha",
      "operator-record-source:durable-alpha",
    ],
    decision_preview_refs: {
      preview_version: "handoff_context_update_operator_decision_preview.v0.1",
      decision_preview_status: "ready_for_future_write",
      recommended_operator_decision: "approve_for_future_write",
      write_ready: true,
      preview_as_of: created_at,
      source_refs: ["decision-preview-ref:durable-alpha"],
    },
    update_preview_refs: {
      update_preview_ref: "update-preview-ref:durable-alpha",
      update_preview_version: "handoff_context_update_preview.v0.1",
      update_preview_candidate_status: "update_candidates_available",
      source_refs: ["update-preview-source:durable-alpha"],
      evidence_refs: ["evidence-ref:durable-preview-alpha"],
    },
    approved_candidate_material: {
      selected_ref_add_candidates: [
        candidate("add", "selected_ref", "evidence-ref:durable-alpha-add"),
      ],
      selected_ref_reinforcement_candidates: [
        candidate(
          "reinforce",
          "selected_ref",
          "evidence-ref:durable-alpha-reinforce",
        ),
      ],
      warning_update_candidates: [
        candidate("warning", "warning", "evidence-ref:durable-alpha-warning"),
      ],
      context_diet_candidates: [
        candidate(
          "diet",
          "context_diet",
          "evidence-ref:durable-alpha-diet",
        ),
      ],
      keep_unknown_candidates: [
        candidate(
          "keep",
          "unknown_context",
          "evidence-ref:durable-alpha-keep",
        ),
      ],
      expected_return_signal_candidates: [
        candidate(
          "expected",
          "expected_return_signal",
          "evidence-ref:durable-alpha-expected",
        ),
      ],
    },
    carry_forward_material: {
      unresolved_blockers: [],
      missing_evidence: [],
      stop_if_missing_candidates: [
        candidate(
          "stop-review",
          "stop_if_missing",
          "evidence-ref:durable-alpha-stop",
        ),
      ],
      rejected_or_excluded_candidates: [
        candidate(
          "rejected-review",
          "context_diet",
          "evidence-ref:durable-alpha-rejected",
        ),
      ],
    },
    evidence_summary: {
      has_update_preview: true,
      update_preview_version_valid: true,
      has_candidate_material: true,
      has_selected_ref_signal: true,
      has_warning_signal: true,
      has_context_diet_signal: true,
      has_stop_if_missing_signal: false,
      has_expected_return_signal: true,
      has_unknown_signal: true,
      has_missing_evidence: false,
      has_insufficient_data: false,
      source_authority_boundary_valid: true,
      source_write_readiness_false: true,
      evidence_refs: [
        "evidence-ref:durable-alpha-add",
        "evidence-ref:durable-alpha-add",
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
      validation_hash,
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
      notes: [
        "This historical record authority is scoped to the already-written local record.",
      ],
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
    notes: [
      "Approved candidate material remains record review material only.",
    ],
    record_fingerprint,
  };
}

function recordWithEmptyCandidateArrays(input) {
  const record = approvedRecord(input);
  record.approved_candidate_material = {
    selected_ref_add_candidates: [],
    selected_ref_reinforcement_candidates: [],
    warning_update_candidates: [],
    context_diet_candidates: [],
    keep_unknown_candidates: [],
    expected_return_signal_candidates: [],
  };
  record.carry_forward_material = {
    unresolved_blockers: [],
    missing_evidence: [],
    stop_if_missing_candidates: [],
    rejected_or_excluded_candidates: [],
  };
  record.evidence_summary = {
    ...record.evidence_summary,
    has_candidate_material: false,
    has_selected_ref_signal: false,
    has_warning_signal: false,
    has_context_diet_signal: false,
    has_stop_if_missing_signal: false,
    has_expected_return_signal: false,
    has_unknown_signal: false,
    evidence_refs: ["evidence-ref:durable-empty-candidates"],
  };
  record.update_preview_refs = {
    ...record.update_preview_refs,
    evidence_refs: ["evidence-ref:durable-empty-candidates"],
  };
  return record;
}

function candidate(suffix, kind, evidenceRef) {
  return {
    candidate_id: `candidate:durable-alpha-${suffix}`,
    ref_id: `context-ref:durable-alpha-${suffix}`,
    label: `Durable alpha ${suffix}`,
    summary: `Durable alpha ${suffix} candidate`,
    candidate_kind: kind,
    source_bucket: "helpful",
    source_adjustment_kind: "add",
    source_candidate_id: `source-candidate:durable-alpha-${suffix}`,
    source_refs: [`source-ref:durable-alpha-${suffix}`],
    evidence_refs: [evidenceRef],
    source_record_refs: [`source-record-ref:durable-alpha-${suffix}`],
    existing_handoff_ref_ids: [],
    candidate_only: true,
    review_note: "Record review material only.",
  };
}

function assertProblematicRecord(expectedReason, mutate) {
  const review = buildApprovedHandoffContextUpdateRecordReviewV01({
    records: [mutateRecord(mutate)],
    scope: "project:augnes",
    as_of: "2026-07-04T08:10:00.000Z",
  });
  assert.equal(review.review_status, "invalid_records");
  assert.equal(review.input_summary.valid_record_count, 0);
  assert(
    review.record_summaries[0].problem_reasons.includes(expectedReason),
    `Expected ${expectedReason} in ${JSON.stringify(
      review.record_summaries[0].problem_reasons,
    )}`,
  );
  assert.equal(review.evidence_summary.problem_record_ids.length, 1);
}

function mutateRecord(mutate) {
  const record = cloneJson(
    approvedRecord({
      record_id: "hcu-record:durable-problem",
      idempotency_key: "hcu-idempotency:durable-problem",
      created_at: "2026-07-04T08:10:00.000Z",
      operator_ref: "operator-ref:durable-problem",
      approved_by: "operator:durable-reviewer",
      record_fingerprint: "record-fingerprint:durable-problem",
      validation_hash: "validation-hash:durable-problem",
    }),
  );
  mutate(record);
  return record;
}

function assertReviewAuthorityFalse(review) {
  for (const [field, value] of Object.entries(review.authority_boundary)) {
    if (field === "read_only_record_review") {
      assert.equal(value, true, `${field} should be true`);
      continue;
    }
    if (field === "notes") continue;
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoForbiddenReviewRuntimeCall(label, text) {
  for (const forbidden of [
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "readHandoffContextUpdateRecordByIdV01",
    "readHandoffContextUpdateRecordByIdempotencyKeyV01",
    "listHandoffContextUpdateRecordsV01",
    "better-sqlite3",
    "new Database",
    "/api/handoff/context-updates",
    "fetch(",
    "Octokit",
    "@octokit",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
