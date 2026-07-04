#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const helperFile =
  "lib/handoff/read-handoff-context-update-record-review-for-web.ts";
const reviewHelperFile =
  "lib/handoff/handoff-context-update-record-review.ts";
const writeHelperFile = "lib/handoff/handoff-context-update-write.ts";
const panelFile =
  "components/handoff/handoff-context-update-record-review-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const reviewSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const writeSmokeFile =
  "scripts/smoke-handoff-context-update-write-v0-1.mjs";
const agentWorkplaneSmokeFile =
  "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const applyPreviewTypeFile = "types/handoff-context-apply-preview.ts";
const applyPreviewHelperFile =
  "lib/handoff/handoff-context-apply-preview.ts";
const applyPreviewPanelFile =
  "components/handoff/handoff-context-apply-preview-panel.tsx";
const applyPreviewSmokeFile =
  "scripts/smoke-handoff-context-apply-preview-v0-1.mjs";
const decisionSmokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const previewSmokeFile =
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const metricAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  helperFile,
  agentWorkplaneFile,
  smokeFile,
  reviewSmokeFile,
  writeSmokeFile,
  agentWorkplaneSmokeFile,
  applyPreviewTypeFile,
  applyPreviewHelperFile,
  applyPreviewPanelFile,
  applyPreviewSmokeFile,
  decisionSmokeFile,
  previewSmokeFile,
  metricAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  helperFile,
  reviewHelperFile,
  writeHelperFile,
  panelFile,
  agentWorkplaneFile,
  packageJsonFile,
]);
const helperText = textByFile.get(helperFile);
const reviewHelperText = textByFile.get(reviewHelperFile);
const writeHelperText = textByFile.get(writeHelperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-update-record-review-db-read-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs",
});

assertContainsAll(
  helperText,
  [
    "readHandoffContextUpdateRecordReviewForWebV01",
    "handoff_context_update_record_review_for_web.v0.1",
    "AUGNES_HANDOFF_CONTEXT_UPDATE_DB_PATH",
    "readonly: true",
    "fileMustExist: true",
    "query_only = ON",
    "handoff_context_update_review_db_path_missing",
    "handoff_context_update_review_db_path_unsafe",
    "handoff_context_update_review_db_missing",
    "handoff_context_update_review_schema_missing",
    "handoff_context_update_review_read_failed",
    "handoff_context_update_review_selected_record_not_found",
    "HANDOFF_CONTEXT_UPDATE_WRITE_TABLE",
    "record_json",
    "receipt_json",
    "no_side_effects",
    "buildApprovedHandoffContextUpdateRecordReviewV01",
  ],
  { label: helperFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "readHandoffContextUpdateRecordReviewForWebV01",
    "HandoffContextUpdateRecordReviewPanel",
    "workbench:handoff_context_update_record_review",
  ],
  { label: agentWorkplaneFile },
);

assertNoForbiddenReadHelperRuntimeCall(helperFile, helperText);
assertNoForbiddenWorkbenchRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assertNoForbiddenWorkbenchRuntimeCall(panelFile, panelText);
assert(!panelText.includes("<button"), "record review panel must not add buttons");
assert(
  reviewHelperText.includes("can_create_schema: false"),
  "review authority boundary must deny schema creation",
);
assert(
  writeHelperText.includes("listHandoffContextUpdateRecordsV01"),
  "existing #959 read helper remains available for setup/read verification",
);

const reader = await import(
  "../lib/handoff/read-handoff-context-update-record-review-for-web.ts"
);
const writer = await import("../lib/handoff/handoff-context-update-write.ts");

const missingPathReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  as_of: "2026-07-04T09:00:00.000Z",
});
assert.equal(missingPathReview.review_status, "no_records");
assert(
  missingPathReview.insufficient_data_reasons.includes(
    "handoff_context_update_review_db_path_missing",
  ),
);
assertReviewAuthorityFalse(missingPathReview);

for (const unsafePath of [
  "/Users/hynk/tmp/handoff-context-updates/private.sqlite",
  "C:\\tmp\\handoff-context-updates\\private.sqlite",
  "../tmp/handoff-context-updates/private.sqlite",
  ".tmp//handoff-context-updates/private.sqlite",
  ".tmp/handoff-context-updates/private.txt",
  ".tmp/handoff-context-updates/sk-private.sqlite",
  ".tmp/handoff-context-updates/github_pat_private.sqlite",
  ".tmp/handoff-context-updates/password:private.sqlite",
]) {
  const unsafeReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
    db_path: unsafePath,
    as_of: "2026-07-04T09:01:00.000Z",
  });
  assert.equal(unsafeReview.review_status, "no_records");
  assert(
    unsafeReview.insufficient_data_reasons.includes(
      "handoff_context_update_review_db_path_unsafe",
    ),
    `unsafe path ${unsafePath} must be refused`,
  );
}

const missingDbParent = `.tmp/handoff-context-updates/missing-parent-${process.pid}`;
const missingDbPath = `${missingDbParent}/missing.sqlite`;
rmSync(missingDbParent, { recursive: true, force: true });
const missingDbReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: missingDbPath,
  as_of: "2026-07-04T09:02:00.000Z",
});
assert.equal(missingDbReview.review_status, "no_records");
assert(
  missingDbReview.insufficient_data_reasons.includes(
    "handoff_context_update_review_db_missing",
  ),
);
assert.equal(existsSync(missingDbPath), false);
assert.equal(existsSync(missingDbParent), false);

const noSchemaDbPath = `.tmp/handoff-context-updates/no-schema-${process.pid}.sqlite`;
rmSync(noSchemaDbPath, { force: true });
mkdirSync(dirname(noSchemaDbPath), { recursive: true });
const noSchemaSetupDb = new Database(noSchemaDbPath);
noSchemaSetupDb.prepare("CREATE TABLE unrelated(id TEXT PRIMARY KEY)").run();
noSchemaSetupDb.close();
const noSchemaReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: noSchemaDbPath,
  as_of: "2026-07-04T09:03:00.000Z",
});
assert.equal(noSchemaReview.review_status, "no_records");
assert(
  noSchemaReview.insufficient_data_reasons.includes(
    "handoff_context_update_review_schema_missing",
  ),
);
const noSchemaVerifyDb = new Database(noSchemaDbPath, {
  readonly: true,
  fileMustExist: true,
});
try {
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(noSchemaVerifyDb), false);
} finally {
  noSchemaVerifyDb.close();
  rmSync(noSchemaDbPath, { force: true });
}

const dbPath = `.tmp/handoff-context-updates/db-read-${process.pid}.sqlite`;
rmSync(dbPath, { force: true });
mkdirSync(dirname(dbPath), { recursive: true });
let setupDb = new Database(dbPath);
try {
  const firstWrite = writer.writeOperatorApprovedHandoffContextUpdateV01(
    approvalPayload(readyDecisionPreview(), {
      idempotencyKey:
        "handoff-context-update:operator-approved:db-read-alpha",
      approvedAt: "2026-07-04T13:00:00.000Z",
    }),
    { db: setupDb },
  );
  assert.equal(firstWrite.status, "written");
  const secondWrite = writer.writeOperatorApprovedHandoffContextUpdateV01(
    approvalPayload(readyDecisionPreview(), {
      idempotencyKey:
        "handoff-context-update:operator-approved:db-read-beta",
      approvedAt: "2026-07-04T13:10:00.000Z",
    }),
    { db: setupDb },
  );
  assert.equal(secondWrite.status, "written");
} finally {
  setupDb.close();
}

const positiveReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: dbPath,
  limit: 10,
  as_of: "2026-07-04T09:04:00.000Z",
  source_refs: ["operator-review-request:db-read-positive"],
});
assert.equal(positiveReview.review_status, "records_available");
assert.equal(positiveReview.input_summary.valid_record_count, 2);
assert.equal(positiveReview.record_summaries.length, 2);
assert.equal(
  positiveReview.record_summaries[0].idempotency_key,
  "handoff-context-update:operator-approved:db-read-beta",
);
assert.equal(
  positiveReview.input_summary.latest_record_id,
  positiveReview.record_summaries[0].record_id,
);
assert(positiveReview.evidence_summary.has_source_refs);
assert(positiveReview.evidence_summary.has_evidence_refs);
assertReviewAuthorityFalse(positiveReview);

const selectedReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: dbPath,
  selected_record_id: positiveReview.record_summaries[1].record_id,
  limit: 1,
  as_of: "2026-07-04T09:05:00.000Z",
});
assert.equal(selectedReview.review_status, "selected_record_available");
assert.equal(selectedReview.input_summary.selected_record_found, true);
assert.equal(
  selectedReview.selected_record_summary?.record_id,
  positiveReview.record_summaries[1].record_id,
);

const missingSelectedReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: dbPath,
  selected_record_id: "handoff-context-update-record:durable-missing",
  limit: 10,
  as_of: "2026-07-04T09:06:00.000Z",
});
assert.equal(missingSelectedReview.review_status, "records_available");
assert.equal(missingSelectedReview.input_summary.selected_record_found, false);
assert(
  missingSelectedReview.insufficient_data_reasons.includes(
    "handoff_context_update_review_selected_record_not_found",
  ),
);

setupDb = new Database(dbPath);
try {
  setupDb
    .prepare(
      `INSERT INTO handoff_context_update_records (
        record_id,
        idempotency_key,
        created_at,
        scope,
        operator_ref,
        record_fingerprint,
        record_json,
        receipt_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      "handoff-context-update-record:durable-malformed-db-read",
      "handoff-context-update:operator-approved:db-read-malformed",
      "2026-07-04T13:20:00.000Z",
      "project:augnes",
      "operator-ref:db-read-malformed",
      "record-fingerprint:db-read-malformed",
      JSON.stringify({
        record_version: "operator_approved_handoff_context_update_record.v0.1",
        record_id: "handoff-context-update-record:durable-malformed-db-read",
        record_fingerprint: "record-fingerprint:db-read-malformed",
        write_validation: {
          validation_hash: "validation-hash:db-read-malformed",
        },
      }),
      JSON.stringify({
        receipt_version:
          "operator_approved_handoff_context_update_write_receipt.v0.1",
        no_side_effects: noSideEffects(),
      }),
    );
} finally {
  setupDb.close();
}

const malformedDbReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: dbPath,
  limit: 1,
  as_of: "2026-07-04T09:07:00.000Z",
});
assert.equal(malformedDbReview.review_status, "invalid_records");
assert(
  malformedDbReview.evidence_summary.problem_record_ids.includes(
    "handoff-context-update-record:durable-malformed-db-read",
  ),
);
assert(
  malformedDbReview.record_summaries[0].problem_reasons.includes(
    "operator_approval_missing_or_invalid",
  ),
);

setupDb = new Database(dbPath);
try {
  const baseRow = setupDb
    .prepare(
      `SELECT record_json, receipt_json
       FROM handoff_context_update_records
       WHERE idempotency_key = ?`,
    )
    .get("handoff-context-update:operator-approved:db-read-beta");
  assert(baseRow, "positive setup row must be available for bad receipt fixture");
  const badReceiptRecordId =
    "handoff-context-update-record:durable-bad-receipt-db-read";
  const badReceiptIdempotencyKey =
    "handoff-context-update:operator-approved:db-read-bad-receipt";
  const badReceiptCreatedAt = "2026-07-04T13:30:00.000Z";
  const badReceiptFingerprint = "record-fingerprint:db-read-bad-receipt";
  const badReceiptValidationHash = "validation-hash:db-read-bad-receipt";
  const badReceiptRecord = persistedRecordFixtureFromBase(baseRow.record_json, {
    recordId: badReceiptRecordId,
    idempotencyKey: badReceiptIdempotencyKey,
    createdAt: badReceiptCreatedAt,
    recordFingerprint: badReceiptFingerprint,
    validationHash: badReceiptValidationHash,
  });
  assert.equal(
    Object.hasOwn(badReceiptRecord, "no_side_effects"),
    false,
    "bad receipt regression row must rely on persisted receipt_json no_side_effects",
  );
  const badReceipt = persistedReceiptFixtureFromBase(baseRow.receipt_json, {
    recordId: badReceiptRecordId,
    idempotencyKey: badReceiptIdempotencyKey,
    createdAt: badReceiptCreatedAt,
    recordFingerprint: badReceiptFingerprint,
    validationHash: badReceiptValidationHash,
    noSideEffects: {
      ...noSideEffects(),
      provider_called: true,
    },
  });
  setupDb
    .prepare(
      `INSERT INTO handoff_context_update_records (
        record_id,
        idempotency_key,
        created_at,
        scope,
        operator_ref,
        record_fingerprint,
        record_json,
        receipt_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      badReceiptRecordId,
      badReceiptIdempotencyKey,
      badReceiptCreatedAt,
      "project:augnes",
      "operator-ref:db-read-bad-receipt",
      badReceiptFingerprint,
      JSON.stringify(badReceiptRecord),
      JSON.stringify(badReceipt),
    );
} finally {
  setupDb.close();
}

const badReceiptReview = reader.readHandoffContextUpdateRecordReviewForWebV01({
  db_path: dbPath,
  limit: 1,
  as_of: "2026-07-04T09:08:00.000Z",
});
assert.equal(badReceiptReview.review_status, "invalid_records");
const badReceiptSummary = badReceiptReview.record_summaries.find(
  (summary) =>
    summary.record_id ===
    "handoff-context-update-record:durable-bad-receipt-db-read",
);
assert(badReceiptSummary, "bad receipt record must be summarized");
assert(
  badReceiptSummary.problem_reasons.includes(
    "no_side_effects_provider_called_true",
  ),
);
assert.equal(
  badReceiptReview.evidence_summary.all_records_confirm_no_provider_github_codex,
  false,
);

const selectedBadReceiptReview =
  reader.readHandoffContextUpdateRecordReviewForWebV01({
    db_path: dbPath,
    selected_record_id:
      "handoff-context-update-record:durable-bad-receipt-db-read",
    limit: 1,
    as_of: "2026-07-04T09:09:00.000Z",
  });
const selectedBadReceiptSummary =
  selectedBadReceiptReview.record_summaries.find(
    (summary) =>
      summary.record_id ===
      "handoff-context-update-record:durable-bad-receipt-db-read",
  );
assert(selectedBadReceiptSummary, "selected bad receipt record must be read");
assert(
  selectedBadReceiptSummary.problem_reasons.includes(
    "no_side_effects_provider_called_true",
  ),
);

rmSync(dbPath, { force: true });

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-update-record-review-db-read-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context update record review DB-read file: ${file}`,
  );
}
const appRouteFiles = changedAndUntrackedFiles.filter((file) =>
  /^app\/api\/.*\/route\.ts$/.test(file),
);
assert.deepEqual(
  appRouteFiles,
  [],
  "record review DB-read must not add or modify app route files",
);

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-update-record-review-db-read-v0-1",
      pass: true,
      missing_db_path_checked: true,
      unsafe_db_path_checked: true,
      missing_db_no_create_checked: true,
      schema_missing_no_create_checked: true,
      positive_db_read_checked: true,
      selected_record_checked: true,
      malformed_db_record_checked: true,
      persisted_receipt_no_side_effects_checked: true,
      workbench_read_helper_checked: true,
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
console.log("PASS smoke:handoff-context-update-record-review-db-read-v0-1");

function readyDecisionPreview() {
  const selectedAdd = candidate(
    "selected-add:durable-db-read-alpha",
    "context-ref:durable-db-read-alpha",
    "selected_ref",
    "helpful",
    { evidenceRefs: ["evidence-ref:durable-db-read-alpha"] },
  );
  const selectedReinforce = candidate(
    "selected-reinforce:durable-db-read-beta",
    "context-ref:durable-db-read-beta",
    "selected_ref",
    "helpful",
    {
      evidenceRefs: ["evidence-ref:durable-db-read-beta"],
      existingHandoffRefIds: ["context-ref:durable-db-read-beta"],
    },
  );
  const warning = candidate(
    "warning:durable-db-read-gamma",
    "context-ref:durable-db-read-gamma",
    "warning",
    "stale",
    { evidenceRefs: ["evidence-ref:durable-db-read-gamma"] },
  );
  const diet = candidate(
    "context-diet:durable-db-read-delta",
    "context-ref:durable-db-read-delta",
    "context_diet",
    "noisy",
    { evidenceRefs: ["evidence-ref:durable-db-read-delta"] },
  );
  const expected = candidate(
    "expected-return:durable-db-read-epsilon",
    "expected-return-ref:durable-db-read-epsilon",
    "expected_return_signal",
    "expected_observed_mismatch",
    { evidenceRefs: ["evidence-ref:durable-db-read-epsilon"] },
  );
  const evidenceRefs = [
    ...selectedAdd.evidence_refs,
    ...selectedReinforce.evidence_refs,
    ...warning.evidence_refs,
    ...diet.evidence_refs,
    ...expected.evidence_refs,
  ];
  const sourceRefs = [
    "operator-provided-context-update:durable-db-read",
    "handoff-context-update-preview:durable-db-read",
  ];
  const approvalRequirements = [
    "Handoff Context Update Preview is supplied and version-valid.",
    "Candidate material exists and is evidence-backed where selected refs are proposed.",
    "Unknown refs remain unknown and are not selected into handoff context.",
    "Stop-if-missing and verification-required candidates are resolved before any future write.",
    "Missing evidence and insufficient-data reasons are resolved before any future write.",
    "Source preview remains read-only, candidate-only, and not source of truth.",
    "Source preview write-readiness flags remain false, proving it did not write.",
    "Operator explicitly approves a separately scoped future write path.",
  ];

  return {
    preview_version: "handoff_context_update_operator_decision_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T12:30:00.000Z",
    source_refs: sourceRefs,
    decision_preview_status: "ready_for_future_write",
    recommended_operator_decision: "approve_for_future_write",
    available_operator_decisions: [
      "defer_until_evidence_supplied",
      "defer_until_blockers_resolved",
      "review_for_future_write",
      "approve_for_future_write",
      "keep_preview_only",
      "reject_update_candidate",
    ],
    input_summary: {
      update_preview_ref: "handoff_context_update_preview.v0.1",
      update_preview_source_status: "supplied",
      update_preview_candidate_status: "needs_operator_review",
      selected_ref_add_candidate_count: 1,
      selected_ref_reinforcement_candidate_count: 1,
      warning_candidate_count: 1,
      context_diet_candidate_count: 1,
      stop_if_missing_candidate_count: 0,
      verification_required_candidate_count: 0,
      expected_return_signal_candidate_count: 1,
      unknown_candidate_count: 0,
      total_candidate_count: 5,
      candidate_material_present: true,
      blocking_reason_count: 0,
      missing_evidence_count: 0,
      source_preview_write_flags_all_false: true,
    },
    update_preview_refs: {
      update_preview_ref:
        "handoff_context_update_preview:handoff_context_update_preview.v0.1:2026-07-04T12:00:00.000Z",
      update_preview_version: "handoff_context_update_preview.v0.1",
      update_preview_candidate_status: "needs_operator_review",
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
    },
    source_status: {
      handoff_context_update_preview: "supplied",
      candidate_status: "needs_operator_review",
      authority_boundary: "valid_read_only",
      source_write_readiness: "all_false",
    },
    write_readiness: {
      write_ready: true,
      readiness_label:
        "ready for future write preparation; this preview still cannot write",
      requires_valid_update_preview: true,
      requires_candidate_material: true,
      requires_no_blockers: true,
      requires_no_missing_evidence: true,
      requires_no_unresolved_stop_or_verification: true,
      requires_selected_refs_evidence_backed: true,
      requires_selected_refs_not_unknown: true,
      requires_read_only_source_preview: true,
      requires_source_preview_no_write_performed: true,
      requires_operator_confirmation: true,
      current_blockers: [],
      current_missing_evidence: [],
    },
    approval_requirements: approvalRequirements,
    blocking_reasons: [],
    missing_evidence: [],
    evidence_summary: {
      has_update_preview: true,
      update_preview_version_valid: true,
      has_candidate_material: true,
      has_selected_ref_signal: true,
      has_warning_signal: true,
      has_context_diet_signal: true,
      has_stop_if_missing_signal: false,
      has_expected_return_signal: true,
      has_unknown_signal: false,
      has_missing_evidence: false,
      has_insufficient_data: false,
      source_authority_boundary_valid: true,
      source_write_readiness_false: true,
      evidence_refs: evidenceRefs,
      missing_evidence: [],
    },
    would_write_preview: {
      proposed_record_kind: "handoff_context_update_write_candidate.v0.1",
      selected_ref_add_candidates: [selectedAdd],
      selected_ref_reinforcement_candidates: [selectedReinforce],
      warning_update_candidates: [warning],
      context_diet_candidates: [diet],
      keep_unknown_candidates: [],
      stop_if_missing_candidates: [],
      expected_return_signal_candidates: [expected],
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      update_preview_ref:
        "handoff_context_update_preview:handoff_context_update_preview.v0.1:2026-07-04T12:00:00.000Z",
      review_summary: "Operator-provided durable context update material.",
    },
    would_not_write: [
      "mutate live handoff context",
      "send a handoff",
      "call providers",
    ],
    candidate_carry_forward: {
      selected_ref_update_candidates: [selectedAdd, selectedReinforce],
      warning_update_candidates: [warning],
      context_diet_candidates: [diet],
      keep_unknown_candidates: [],
      stop_if_missing_candidates: [],
      expected_return_signal_candidates: [expected],
      unresolved_blockers: [],
      missing_evidence: [],
    },
    review_checklist: ["Confirm approved candidate material is evidence-backed."],
    non_goals: [
      "no_handoff_context_write",
      "no_selected_ref_write",
      "no_provider_github_codex_or_autonomous_action",
    ],
    authority_boundary: decisionAuthorityBoundary(),
  };
}

function approvalPayload(decisionPreview, { idempotencyKey, approvedAt }) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_future_write",
      approved_by: "operator-ref:handoff-context-update-db-reader",
      operator_ref: "operator-ref:handoff-context-update-db-reader",
      approved_at: approvedAt,
      approval_statement:
        "Operator reviewed evidence-backed handoff context update material for a future local record write.",
      checklist_confirmations: Object.fromEntries(
        decisionPreview.approval_requirements.map((requirement) => [
          requirement,
          true,
        ]),
      ),
    },
    idempotency_key: idempotencyKey,
    requested_side_effects: {
      can_write_db: true,
      can_write_handoff_context_update_record: true,
      can_write_operator_approved_handoff_context_update_record: true,
    },
  };
}

function candidate(candidateId, refId, kind, bucket, options = {}) {
  return {
    candidate_id: candidateId,
    ref_id: refId,
    label: refId,
    summary: `${kind} ${bucket} candidate ${refId}`,
    candidate_kind: kind,
    source_bucket: bucket,
    source_adjustment_kind: options.adjustmentKind ?? "warn_anchor",
    source_candidate_id: options.sourceCandidateId ?? candidateId,
    source_refs: [refId, ...(options.sourceRefs ?? [])],
    evidence_refs: options.evidenceRefs ?? [`evidence-ref:${candidateId}`],
    source_record_refs:
      options.sourceRecordRefs ?? ["source-record:durable-db-read"],
    existing_handoff_ref_ids: options.existingHandoffRefIds ?? [],
    candidate_only: true,
    review_note: "candidate remains review-only",
  };
}

function decisionAuthorityBoundary() {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_write_handoff_context: false,
    can_write_selected_refs: false,
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
    notes: ["decision preview remains read-only"],
  };
}

function noSideEffects() {
  return {
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
  };
}

function persistedRecordFixtureFromBase(
  recordJson,
  { recordId, idempotencyKey, createdAt, recordFingerprint, validationHash },
) {
  const record = JSON.parse(recordJson);
  record.record_id = recordId;
  record.idempotency_key = idempotencyKey;
  record.created_at = createdAt;
  record.operator_approval = {
    ...record.operator_approval,
    approved_at: createdAt,
    approved_by: "operator-ref:db-read-bad-receipt",
    operator_ref: "operator-ref:db-read-bad-receipt",
  };
  record.write_validation = {
    ...record.write_validation,
    validation_hash: validationHash,
  };
  record.record_fingerprint = recordFingerprint;
  delete record.no_side_effects;
  return record;
}

function persistedReceiptFixtureFromBase(
  receiptJson,
  {
    recordId,
    idempotencyKey,
    createdAt,
    recordFingerprint,
    validationHash,
    noSideEffects,
  },
) {
  const receipt = JSON.parse(receiptJson);
  return {
    ...receipt,
    record_id: recordId,
    idempotency_key: idempotencyKey,
    created_at: createdAt,
    validation_hash: validationHash,
    record_fingerprint: recordFingerprint,
    store_ref: `handoff_context_update_records:${recordId}`,
    no_side_effects: noSideEffects,
  };
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

function assertNoForbiddenReadHelperRuntimeCall(label, text) {
  for (const forbidden of [
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "/api/handoff/context-updates",
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "mkdirSync",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "sendHandoff(",
    "writeSelectedRef",
    "applyPerspective(",
    "withStoreNoSideEffects",
    "listResult.no_side_effects",
    "selectedResult.no_side_effects",
    "listHandoffContextUpdateRecordsV01",
    "readHandoffContextUpdateRecordByIdV01",
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
