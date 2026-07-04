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

const typeFile = "types/handoff-context-apply-operator-decision-preview.ts";
const helperFile =
  "lib/handoff/handoff-context-apply-operator-decision-preview.ts";
const panelFile =
  "components/handoff/handoff-context-apply-operator-decision-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-handoff-context-apply-operator-decision-preview-v0-1.mjs";
const applyPreviewTypeFile = "types/handoff-context-apply-preview.ts";
const applyPreviewHelperFile =
  "lib/handoff/handoff-context-apply-preview.ts";
const applyPreviewPanelFile =
  "components/handoff/handoff-context-apply-preview-panel.tsx";
const applyPreviewSmokeFile =
  "scripts/smoke-handoff-context-apply-preview-v0-1.mjs";
const recordReviewDbReadSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const recordReviewSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const writeSmokeFile =
  "scripts/smoke-handoff-context-update-write-v0-1.mjs";
const updateDecisionSmokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const updatePreviewSmokeFile =
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
  applyPreviewSmokeFile,
  recordReviewDbReadSmokeFile,
  recordReviewSmokeFile,
  writeSmokeFile,
  updateDecisionSmokeFile,
  updatePreviewSmokeFile,
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
  applyPreviewTypeFile,
  applyPreviewHelperFile,
  applyPreviewPanelFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-apply-operator-decision-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-apply-operator-decision-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_context_apply_operator_decision_preview.v0.1",
    "ready_for_operator_review",
    "ready_for_future_apply_write",
    "defer_until_record_material_supplied",
    "handoff_context_apply_write_candidate.v0.1",
    "would_apply_preview",
    "would_not_apply",
    "candidate_carry_forward",
    "can_persist_decision: false",
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
    "buildHandoffContextApplyOperatorDecisionPreviewV01",
    "createHandoffContextApplyOperatorDecisionAuthorityBoundaryV01",
    "apply_preview_wrong_version",
    "selected_full_record_material_missing",
    "apply_candidate_material_missing",
    "blocked_duplicate_selected_ref_adds",
    "blocked_unknown_selected_ref_attempts",
    "blocked_selected_ref_candidate_missing_evidence",
    "blocked_problem_records_present",
    "blocked_apply_preview_authority_boundary_invalid",
    "does_not_mutate_live_handoff_context",
    "does_not_write_selected_refs_to_active_handoff_packet",
    "does_not_send_handoffs",
    "does_not_write_db_rows",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Operator-reviewed Handoff Context Apply Decision Preview",
    "Future write",
    "would apply preview",
    "carry forward",
    "would not apply",
    "can_persist_decision",
    "can_write_selected_refs_to_live_handoff",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "HandoffContextApplyOperatorDecisionPreviewPanel",
    "buildHandoffContextApplyOperatorDecisionPreviewV01",
    "workbench:handoff_context_apply_operator_decision_preview",
    "HandoffContextApplyPreviewPanel",
  ],
  { label: agentWorkplaneFile },
);

for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
]) {
  assertNoForbiddenDecisionRuntimeCall(label, text);
}
assertNoForbiddenWorkbenchRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assert(!panelText.includes("<button"), "decision preview panel must not add buttons");
assert(
  !/<button[^>]*>[^<]*(Write|Apply|Approve|Send)/i.test(agentWorkplaneText),
  "Workbench must not render write/apply/approve/send buttons",
);

const decisionModule = await import(
  "../lib/handoff/handoff-context-apply-operator-decision-preview.ts"
);
const {
  buildHandoffContextApplyOperatorDecisionPreviewV01,
  createHandoffContextApplyOperatorDecisionAuthorityBoundaryV01,
} = decisionModule;

const missingPreviewDecision =
  buildHandoffContextApplyOperatorDecisionPreviewV01({
    as_of: "2026-07-04T11:00:00.000Z",
    scope: "project:augnes",
  });
assert.equal(missingPreviewDecision.decision_preview_status, "insufficient_data");
assert.equal(missingPreviewDecision.readiness.ready_for_future_apply_write, false);
assert(
  missingPreviewDecision.insufficient_data_reasons.includes(
    "apply_preview_missing",
  ),
);
assertAuthorityFalse(missingPreviewDecision.authority_boundary);

let wrongVersionDecision;
assert.doesNotThrow(() => {
  wrongVersionDecision = buildHandoffContextApplyOperatorDecisionPreviewV01({
    apply_preview: {
      preview_version: "handoff_context_apply_preview.v9.9",
    },
    as_of: "2026-07-04T11:00:10.000Z",
  });
});
assert(
  ["insufficient_data", "blocked"].includes(
    wrongVersionDecision.decision_preview_status,
  ),
);
assert(
  wrongVersionDecision.insufficient_data_reasons.includes(
    "apply_preview_wrong_version",
  ) ||
    wrongVersionDecision.blocking_reasons.includes(
      "blocked_wrong_apply_preview_version",
    ),
);

const noRecordsDecision = decisionForPreview(applyPreview({
  preview_status: "no_records",
  selected_full_record_supplied: false,
  live_candidates: [],
}));
assert.equal(noRecordsDecision.decision_preview_status, "insufficient_data");
assert.equal(noRecordsDecision.readiness.ready_for_future_apply_write, false);

const insufficientDecision = decisionForPreview(applyPreview({
  preview_status: "insufficient_data",
  selected_full_record_supplied: false,
  live_candidates: [candidate("add")],
  insufficient_data_reasons: ["no_apply_material"],
}));
assert.equal(insufficientDecision.decision_preview_status, "insufficient_data");
assert.equal(insufficientDecision.readiness.ready_for_future_apply_write, false);

const noSelectedRecordDecision = decisionForPreview(applyPreview({
  preview_status: "no_selected_record",
  selected_full_record_supplied: false,
  live_candidates: [candidate("add")],
}));
assert.equal(noSelectedRecordDecision.decision_preview_status, "insufficient_data");

const blockedStatusDecision = decisionForPreview(applyPreview({
  preview_status: "blocked",
  live_candidates: [candidate("add")],
  blocked_reasons: ["record_review_problem_record:hcu-record:durable-problem"],
}));
assert.equal(blockedStatusDecision.decision_preview_status, "blocked");

const summaryOnlyDecision = decisionForPreview(applyPreview({
  preview_status: "insufficient_data",
  selected_full_record_supplied: false,
  live_candidates: [],
  insufficient_data_reasons: ["no_apply_material"],
}));
assert.equal(summaryOnlyDecision.readiness.ready_for_future_apply_write, false);
assert(
  summaryOnlyDecision.insufficient_data_reasons.includes("no_apply_material"),
);

const noFullRecordDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  selected_full_record_supplied: false,
  live_candidates: [candidate("add")],
}));
assert.equal(noFullRecordDecision.readiness.ready_for_future_apply_write, false);
assert(
  noFullRecordDecision.insufficient_data_reasons.includes(
    "selected_full_record_material_missing",
  ),
);

const noApplyCandidatesDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [],
}));
assert.equal(noApplyCandidatesDecision.readiness.ready_for_future_apply_write, false);
assert(
  noApplyCandidatesDecision.insufficient_data_reasons.includes(
    "apply_candidate_material_missing",
  ),
);

const blockingReasonsDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  blocked_reasons: ["duplicate_selected_ref_add_candidate:candidate:durable-add"],
}));
assert.equal(blockingReasonsDecision.decision_preview_status, "blocked");

const insufficientReasonsDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  insufficient_data_reasons: ["current_handoff_context_missing"],
}));
assert.equal(
  insufficientReasonsDecision.readiness.ready_for_future_apply_write,
  false,
);

const missingEvidenceDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  missing_evidence: ["evidence-ref:durable-missing"],
}));
assert.equal(missingEvidenceDecision.readiness.ready_for_future_apply_write, false);
assert.equal(missingEvidenceDecision.evidence_summary.has_missing_evidence, true);

const unknownSelectedDecision = decisionForPreview(applyPreview({
  preview_status: "blocked",
  live_candidates: [candidate("add")],
  conflict_overrides: {
    unknown_selected_ref_attempts: ["candidate:durable-unknown"],
    conflicting_candidate_ids: ["candidate:durable-unknown"],
  },
}));
assert.equal(unknownSelectedDecision.decision_preview_status, "blocked");
assert(
  unknownSelectedDecision.blocking_reasons.includes(
    "blocked_unknown_selected_ref_attempts",
  ),
);

const duplicateSelectedDecision = decisionForPreview(applyPreview({
  preview_status: "blocked",
  live_candidates: [candidate("reinforce", "selected_ref_reinforce")],
  conflict_overrides: {
    duplicate_selected_refs: ["context-ref:durable-add"],
    conflicting_candidate_ids: ["candidate:durable-add"],
  },
}));
assert.equal(duplicateSelectedDecision.decision_preview_status, "blocked");
assert(
  duplicateSelectedDecision.blocking_reasons.includes(
    "blocked_duplicate_selected_ref_adds",
  ),
);

const missingEvidenceCandidateDecision = decisionForPreview(applyPreview({
  preview_status: "blocked",
  live_candidates: [candidate("add")],
  conflict_overrides: {
    missing_evidence_candidates: ["candidate:durable-add"],
    conflicting_candidate_ids: ["candidate:durable-add"],
  },
}));
assert.equal(missingEvidenceCandidateDecision.decision_preview_status, "blocked");
assert(
  missingEvidenceCandidateDecision.blocking_reasons.includes(
    "blocked_selected_ref_candidate_missing_evidence",
  ),
);

const problemRecordDecision = decisionForPreview(applyPreview({
  preview_status: "blocked",
  live_candidates: [candidate("add")],
  problem_record_ids: ["hcu-record:durable-problem"],
}));
assert.equal(problemRecordDecision.decision_preview_status, "blocked");

const invalidAuthorityDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  authority_overrides: { can_send_handoff: true },
}));
assert.equal(invalidAuthorityDecision.decision_preview_status, "blocked");
assert(
  invalidAuthorityDecision.blocking_reasons.includes(
    "blocked_apply_preview_authority_boundary_invalid",
  ),
);

const liveMutationFalseDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  evidence_overrides: { no_live_handoff_mutation_confirmed: false },
}));
assert.equal(liveMutationFalseDecision.decision_preview_status, "blocked");

const handoffSendFalseDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  evidence_overrides: { no_handoff_send_confirmed: false },
}));
assert.equal(handoffSendFalseDecision.decision_preview_status, "blocked");

const providerGithubCodexFalseDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [candidate("add")],
  evidence_overrides: { no_provider_github_codex_confirmed: false },
}));
assert.equal(providerGithubCodexFalseDecision.decision_preview_status, "blocked");

const readyDecision = decisionForPreview(applyPreview({
  preview_status: "apply_candidates_available",
  live_candidates: [
    candidate("add"),
    candidate("reinforce", "selected_ref_reinforce"),
    candidate("warning", "warning_add"),
    candidate("deprioritize", "context_deprioritize"),
    candidate("exclude", "context_exclude"),
    candidate("expected", "expected_return_update"),
  ],
}));
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_apply_write",
);
assert.equal(readyDecision.recommended_operator_decision, "approve_for_future_apply_write");
assert.equal(readyDecision.readiness.ready_for_future_apply_write, true);
assert.equal(
  readyDecision.would_apply_preview.proposed_record_kind,
  "handoff_context_apply_write_candidate.v0.1",
);
assert.equal(readyDecision.would_apply_preview.selected_refs_to_add.length, 1);
assert.equal(
  readyDecision.would_apply_preview.selected_refs_to_reinforce.length,
  1,
);
assert.equal(
  readyDecision.would_apply_preview.warnings_to_add_or_strengthen.length,
  1,
);
assert.equal(readyDecision.would_apply_preview.context_refs_to_deprioritize.length, 1);
assert.equal(readyDecision.would_apply_preview.context_refs_to_exclude.length, 1);
assert.equal(
  readyDecision.would_apply_preview.expected_return_signal_updates.length,
  1,
);
assertAuthorityFalse(readyDecision.authority_boundary);

const reviewOnlyDecision = decisionForPreview(applyPreview({
  preview_status: "needs_operator_review",
  live_candidates: [candidate("add")],
  keep_unknown: [candidate("unknown", "keep_unknown")],
  stop_if_missing: [candidate("stop", "stop_if_missing_carry_forward")],
  rejected: [candidate("rejected", "rejected_or_excluded_review_note")],
}));
assert.equal(
  reviewOnlyDecision.decision_preview_status,
  "ready_for_operator_review",
);
assert.equal(reviewOnlyDecision.readiness.ready_for_future_apply_write, false);
assert.equal(
  reviewOnlyDecision.candidate_carry_forward.keep_unknown_as_review_only.length,
  1,
);
assert.equal(
  reviewOnlyDecision.candidate_carry_forward.carry_forward_stop_if_missing.length,
  1,
);
assert.equal(
  reviewOnlyDecision.candidate_carry_forward.rejected_or_excluded_review_notes
    .length,
  1,
);
assert.equal(
  reviewOnlyDecision.would_apply_preview.selected_refs_to_add.some(
    (item) => item.candidate_kind === "keep_unknown",
  ),
  false,
);
assert.equal(
  reviewOnlyDecision.would_apply_preview.selected_refs_to_add.some(
    (item) => item.candidate_kind === "stop_if_missing_carry_forward",
  ),
  false,
);
assert.equal(
  reviewOnlyDecision.would_apply_preview.selected_refs_to_add.some(
    (item) => item.candidate_kind === "rejected_or_excluded_review_note",
  ),
  false,
);

for (const expectedBoundary of [
  "does_not_mutate_live_handoff_context",
  "does_not_write_selected_refs_to_active_handoff_packet",
  "does_not_send_handoffs",
  "does_not_write_db_rows",
  "does_not_call_provider_openai",
  "does_not_call_github",
  "does_not_execute_codex",
]) {
  assert(
    readyDecision.would_not_apply.includes(expectedBoundary),
    `would_not_apply must include ${expectedBoundary}`,
  );
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-apply-operator-decision-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context apply operator decision preview file: ${file}`,
  );
}
const appRouteFiles = changedAndUntrackedFiles.filter((file) =>
  /^app\/api\/.*\/route\.ts$/.test(file),
);
assert.deepEqual(
  appRouteFiles,
  [],
  "handoff context apply operator decision preview must not add or modify app route files",
);

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-apply-operator-decision-preview-v0-1",
      pass: true,
      missing_apply_preview_checked: true,
      wrong_version_checked: true,
      insufficient_preview_statuses_checked: true,
      blocked_conflicts_checked: true,
      invalid_authority_checked: true,
      no_side_effect_confirmations_checked: true,
      ready_future_apply_write_checked: true,
      review_only_carry_forward_checked: true,
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
console.log("PASS smoke:handoff-context-apply-operator-decision-preview-v0-1");

function decisionForPreview(preview) {
  return buildHandoffContextApplyOperatorDecisionPreviewV01({
    apply_preview: preview,
    scope: "project:augnes",
    as_of: "2026-07-04T11:01:00.000Z",
    source_refs: [
      "operator-review-request:durable-apply-decision-preview",
    ],
  });
}

function applyPreview({
  preview_status,
  selected_full_record_supplied = true,
  live_candidates = [],
  keep_unknown = [],
  stop_if_missing = [],
  rejected = [],
  blocked_reasons = [],
  insufficient_data_reasons = [],
  missing_evidence = [],
  problem_record_ids = [],
  conflict_overrides = {},
  evidence_overrides = {},
  authority_overrides = {},
}) {
  const delta = {
    selected_refs_to_add: live_candidates.filter(
      (item) => item.candidate_kind === "selected_ref_add",
    ),
    selected_refs_to_reinforce: live_candidates.filter(
      (item) => item.candidate_kind === "selected_ref_reinforce",
    ),
    warnings_to_add_or_strengthen: live_candidates.filter((item) =>
      ["warning_add", "warning_strengthen"].includes(item.candidate_kind),
    ),
    context_refs_to_deprioritize: live_candidates.filter(
      (item) => item.candidate_kind === "context_deprioritize",
    ),
    context_refs_to_exclude: live_candidates.filter(
      (item) => item.candidate_kind === "context_exclude",
    ),
    keep_unknown_as_review_only: keep_unknown,
    expected_return_signal_updates: live_candidates.filter(
      (item) => item.candidate_kind === "expected_return_update",
    ),
    carry_forward_stop_if_missing: stop_if_missing,
    rejected_or_excluded_review_notes: rejected,
  };
  const applyCandidateCount = Object.values(delta).flat().length;
  return {
    preview_version: "handoff_context_apply_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T11:01:00.000Z",
    source_refs: ["apply-preview-source:durable-operator-decision"],
    preview_status,
    input_summary: {
      has_record_review: true,
      review_status: "selected_record_available",
      selected_record_id: selected_full_record_supplied
        ? "hcu-record:durable-apply-decision"
        : null,
      selected_record_found: selected_full_record_supplied,
      selected_full_record_supplied,
      current_handoff_context_supplied: true,
      current_selected_ref_count: 1,
      approved_record_count: 1,
      apply_candidate_count: applyCandidateCount,
      blocked_reason_count: blocked_reasons.length,
      insufficient_data_reason_count: insufficient_data_reasons.length,
    },
    selected_record_ref: selected_full_record_supplied
      ? "hcu-record:durable-apply-decision"
      : null,
    current_context_summary: {
      current_selected_ref_count: 1,
      current_warning_count: 0,
      current_stop_if_missing_count: 0,
      current_expected_return_signal_count: 0,
      source_refs: ["current-context-source:durable-apply-decision"],
    },
    proposed_apply_delta: delta,
    conflict_summary: {
      duplicate_selected_refs: [],
      unknown_selected_ref_attempts: [],
      missing_evidence_candidates: [],
      stale_or_noisy_candidates: [],
      conflicting_candidate_ids: [],
      blocked_apply_reasons: [],
      ...conflict_overrides,
    },
    evidence_summary: {
      has_record_review: true,
      has_selected_record: selected_full_record_supplied,
      has_full_record_material: selected_full_record_supplied,
      has_source_refs: true,
      has_evidence_refs: true,
      all_apply_candidates_evidence_backed: true,
      no_live_handoff_mutation_confirmed: true,
      no_handoff_send_confirmed: true,
      no_provider_github_codex_confirmed: true,
      source_refs: ["source-ref:durable-apply-decision"],
      evidence_refs: ["evidence-ref:durable-apply-decision"],
      missing_evidence,
      problem_record_ids,
      ...evidence_overrides,
    },
    operator_review_checklist: [
      "Review selected record ref before any future apply write.",
    ],
    blocked_reasons,
    insufficient_data_reasons,
    non_goals: ["no live handoff context mutation"],
    authority_boundary: {
      ...createApplyPreviewAuthorityBoundary(),
      ...authority_overrides,
    },
  };
}

function candidate(suffix, kind = "selected_ref_add") {
  return {
    candidate_id: `candidate:durable-${suffix}`,
    candidate_kind: kind,
    ref_id: `context-ref:durable-${suffix}`,
    label: `Durable ${suffix}`,
    summary: `Durable ${suffix} apply candidate`,
    source_record_id: "hcu-record:durable-apply-decision",
    source_candidate_id: `source-candidate:durable-${suffix}`,
    source_bucket: "helpful",
    evidence_refs: [`evidence-ref:durable-${suffix}`],
    source_refs: [`source-ref:durable-${suffix}`],
    existing_handoff_ref_ids: [],
    apply_preview_only: true,
    would_mutate_live_handoff: false,
    review_note: "Decision preview material only.",
  };
}

function createApplyPreviewAuthorityBoundary() {
  return {
    read_only_apply_preview: true,
    advisory_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_handoff_context_update_record: false,
    can_write_operator_approved_handoff_context_update_record: false,
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
    notes: ["Synthetic read-only apply preview authority."],
  };
}

function assertAuthorityFalse(authority) {
  for (const [field, value] of Object.entries(authority)) {
    if (["read_only", "advisory_only", "derived_read_model"].includes(field)) {
      assert.equal(value, true, `${field} should be true`);
      continue;
    }
    if (field === "notes") continue;
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoForbiddenDecisionRuntimeCall(label, text) {
  for (const forbidden of [
    "buildHandoffContextApplyPreviewV01(",
    "buildApprovedHandoffContextUpdateRecordReviewV01(",
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "readHandoffContextUpdateRecordReviewForWebV01",
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
