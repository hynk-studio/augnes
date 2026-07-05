#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const ingestWriteTypeFile = "types/selected-session-digest-ingest-write.ts";
const ingestWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-write.ts";
const ingestRouteFile =
  "app/api/intake/selected-session-digest/ingest-records/route.ts";
const ingestRecordReviewTypeFile =
  "types/selected-session-digest-ingest-record-review.ts";
const ingestRecordReviewHelperFile =
  "lib/intake/selected-session-digest-ingest-record-review.ts";
const ingestRecordReviewForWebFile =
  "lib/intake/read-selected-session-digest-ingest-record-review-for-web.ts";
const ingestRecordReviewPanelFile =
  "components/intake/selected-session-digest-ingest-record-review-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const overviewTypeFile = "types/workbench-dogfood-loop-spine-overview.ts";
const overviewHelperFile =
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts";
const decisionWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-decision-write.ts";
const operatorDecisionHelperFile =
  "lib/intake/selected-session-digest-ingest-operator-decision.ts";
const operatorDecisionSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-operator-decision-v0-1.mjs";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const overviewSmokeFile =
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs";
const smokeFile =
  "scripts/smoke-selected-session-digest-durable-ingest-record-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  ingestWriteTypeFile,
  ingestWriteHelperFile,
  ingestRouteFile,
  ingestRecordReviewTypeFile,
  ingestRecordReviewHelperFile,
  ingestRecordReviewForWebFile,
  ingestRecordReviewPanelFile,
  agentWorkplaneFile,
  overviewTypeFile,
  overviewHelperFile,
  decisionWriteHelperFile,
  operatorDecisionHelperFile,
  operatorDecisionSmokeFile,
  agentWorkplaneSmokeFile,
  overviewSmokeFile,
  smokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  ingestWriteTypeFile,
  ingestWriteHelperFile,
  ingestRouteFile,
  ingestRecordReviewTypeFile,
  ingestRecordReviewHelperFile,
  ingestRecordReviewForWebFile,
  ingestRecordReviewPanelFile,
  agentWorkplaneFile,
  overviewTypeFile,
  overviewHelperFile,
  decisionWriteHelperFile,
  operatorDecisionHelperFile,
  packageJsonFile,
]);
const ingestWriteTypeText = textByFile.get(ingestWriteTypeFile);
const ingestWriteHelperText = textByFile.get(ingestWriteHelperFile);
const ingestRouteText = textByFile.get(ingestRouteFile);
const ingestRecordReviewTypeText = textByFile.get(ingestRecordReviewTypeFile);
const ingestRecordReviewHelperText = textByFile.get(
  ingestRecordReviewHelperFile,
);
const ingestRecordReviewForWebText = textByFile.get(ingestRecordReviewForWebFile);
const ingestRecordReviewPanelText = textByFile.get(ingestRecordReviewPanelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const overviewTypeText = textByFile.get(overviewTypeFile);
const overviewHelperText = textByFile.get(overviewHelperFile);
const decisionWriteHelperText = textByFile.get(decisionWriteHelperFile);
const operatorDecisionHelperText = textByFile.get(operatorDecisionHelperFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:selected-session-digest-durable-ingest-record-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-selected-session-digest-durable-ingest-record-v0-1.mjs",
});

assertContainsAll(
  ingestWriteTypeText,
  [
    "selected_session_digest_ingest_record.v0.1",
    "selected_session_digest_ingest_receipt.v0.1",
    "selected_session_digest_ingest_store.v0.1",
    "selected_session_digest_persisted_as_candidate_record",
    "memory_mutated: false",
    "current_working_perspective_updated: false",
    "handoff_sent: false",
  ],
  { label: ingestWriteTypeFile },
);
assertContainsAll(
  ingestWriteHelperText,
  [
    "selectedSessionDigestIngestWriteSchemaSqlV01",
    "ensureSelectedSessionDigestIngestWriteSchemaV01",
    "selectedSessionDigestIngestWriteSchemaExistsV01",
    "validateSelectedSessionDigestIngestWriteInputV01",
    "writeSelectedSessionDigestIngestRecordV01",
    "refuseSelectedSessionDigestIngestWriteV01",
    "readSelectedSessionDigestIngestRecordByIdV01",
    "readSelectedSessionDigestIngestRecordByIdempotencyKeyV01",
    "listSelectedSessionDigestIngestRecordsV01",
    "createSelectedSessionDigestIngestWriteAuthorityBoundaryV01",
    "selected_session_digest_ingest_records",
    "idempotency_key_conflict",
  ],
  { label: ingestWriteHelperFile },
);
assertContainsAll(
  ingestRouteText,
  [
    "selected_session_digest_ingest_record_route.v0.1",
    "tmp/selected-session-digest-ingest-records/",
    ".tmp/selected-session-digest-ingest-records/",
    "fileMustExist: true",
    "requestHasSameOriginBoundary",
    "validateSelectedSessionDigestIngestWriteInputV01",
    "openWriteIngestRecordDb",
    "selected_session_digest_ingest_record_written",
    "memory_mutated: false",
    "handoff_sent: false",
  ],
  { label: ingestRouteFile },
);
assert(
  ingestRouteText.indexOf("validateSelectedSessionDigestIngestWriteInputV01") <
    ingestRouteText.indexOf("openWriteIngestRecordDb"),
  "ingest route POST should validate before opening write DB",
);
assertContainsAll(
  ingestRecordReviewTypeText,
  [
    "selected_session_digest_ingest_record_review.v0.1",
    "no_records",
    "records_available",
    "read_only_record_review: true",
    "can_write_memory: false",
  ],
  { label: ingestRecordReviewTypeFile },
);
assertContainsAll(
  ingestRecordReviewHelperText,
  [
    "buildSelectedSessionDigestIngestRecordReviewV01",
    "createSelectedSessionDigestIngestRecordReviewAuthorityBoundaryV01",
    "record_contains_raw_or_private_marker",
    "does_not_write_memory",
  ],
  { label: ingestRecordReviewHelperFile },
);
assertContainsAll(
  ingestRecordReviewForWebText,
  [
    "readSelectedSessionDigestIngestRecordReviewForWebV01",
    "workbench:selected_session_digest_ingest_record_review_no_db_read",
    "records: []",
  ],
  { label: ingestRecordReviewForWebFile },
);
assertContainsAll(
  ingestRecordReviewPanelText,
  [
    "Selected Session Digest Ingest Record Review",
    "candidate ingest record",
    "receipt",
    "no side effects",
    "authority boundary",
  ],
  { label: ingestRecordReviewPanelFile },
);
assertContainsAll(
  agentWorkplaneText,
  [
    "SelectedSessionDigestIngestRecordReviewPanel",
    "readSelectedSessionDigestIngestRecordReviewForWebV01",
    "selectedSessionDigestIngestRecordReview",
    "review={selectedSessionDigestIngestRecordReview}",
    "selected_session_digest_ingest_record_review: selectedSessionDigestIngestRecordReview",
  ],
  { label: agentWorkplaneFile },
);
assertContainsAll(
  overviewTypeText,
  [
    "SelectedSessionDigestIngestRecordReview",
    "selected_session_digest_durable_ingest_record",
    "selected_session_digest_ingest_record_review",
    "write_selected_session_digest_candidate_ingest_record",
    "review_selected_session_digest_ingest_record",
    "resolve_selected_session_digest_ingest_record_blockers",
    "can_create_ingest_receipt: false",
  ],
  { label: overviewTypeFile },
);
assertContainsAll(
  overviewHelperText,
  [
    "selectedSessionDigestDurableIngestRecordStep",
    "selected_session_digest_durable_ingest_record",
    "selected_session_digest_ingest_record_review",
    "write_selected_session_digest_candidate_ingest_record",
    "review_selected_session_digest_ingest_record",
    "does_not_promote_selected_digest_ingest_records_to_memory_or_perspective",
  ],
  { label: overviewHelperFile },
);
assertContainsAll(
  decisionWriteHelperText,
  ["decision_preview_malformed", "notes_must_be_string_array"],
  { label: decisionWriteHelperFile },
);
assertContainsAll(
  operatorDecisionHelperText,
  ["ingest_contract_preview_carry_forward_review_only_material_invalid"],
  { label: operatorDecisionHelperFile },
);

assertNoActionButtons(ingestRecordReviewPanelFile, ingestRecordReviewPanelText);
assertNoActionButtons(agentWorkplaneFile, agentWorkplaneText);
assertScopedRuntimeBoundaries();

const intakeModule = await import(
  "../lib/intake/selected-session-digest-intake-preview.ts"
);
const contractModule = await import(
  "../lib/intake/selected-session-digest-ingest-contract-preview.ts"
);
const operatorDecisionModule = await import(
  "../lib/intake/selected-session-digest-ingest-operator-decision.ts"
);
const decisionWriteModule = await import(
  "../lib/intake/selected-session-digest-ingest-decision-write.ts"
);
const ingestWriteModule = await import(
  "../lib/intake/selected-session-digest-ingest-write.ts"
);
const reviewModule = await import(
  "../lib/intake/selected-session-digest-ingest-record-review.ts"
);
const reviewForWebModule = await import(
  "../lib/intake/read-selected-session-digest-ingest-record-review-for-web.ts"
);
const overviewModule = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const routeModule = await import(
  "../app/api/intake/selected-session-digest/ingest-records/route.ts"
);

const { buildSelectedSessionDigestIntakePreviewV01 } = intakeModule;
const { buildSelectedSessionDigestIngestContractPreviewV01 } = contractModule;
const { buildSelectedSessionDigestIngestOperatorDecisionPreviewV01 } =
  operatorDecisionModule;
const {
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01,
  refuseOperatorApprovedSelectedSessionDigestIngestDecisionWriteV01,
} = decisionWriteModule;
const {
  selectedSessionDigestIngestWriteSchemaExistsV01,
  validateSelectedSessionDigestIngestWriteInputV01,
  writeSelectedSessionDigestIngestRecordV01,
  readSelectedSessionDigestIngestRecordByIdV01,
  readSelectedSessionDigestIngestRecordByIdempotencyKeyV01,
  listSelectedSessionDigestIngestRecordsV01,
  createSelectedSessionDigestIngestWriteAuthorityBoundaryV01,
} = ingestWriteModule;
const { buildSelectedSessionDigestIngestRecordReviewV01 } = reviewModule;
const { readSelectedSessionDigestIngestRecordReviewForWebV01 } =
  reviewForWebModule;
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = overviewModule;

const cleanIntake = buildCleanIntake();
const selectableContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: cleanIntake,
});
const firstCandidateRef =
  selectableContract.would_ingest_material_preview
    .selectable_digest_candidate_refs[0];
assert(firstCandidateRef, "clean intake should expose candidate refs");
const readyContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_candidate_refs: [firstCandidateRef],
  privacy_review_confirmation_ref: "privacy:selected-digest-durable-check",
  requested_idempotency_key: "idempotency:selected-digest-durable-check",
  requested_ingest_scope_ref: "scope:selected-digest-durable-check",
});
assert.equal(
  readyContract.contract_preview_status,
  "ready_for_future_ingest_write_scope",
);
const readyDecision = buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
  selected_session_digest_ingest_contract_preview: readyContract,
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_decision_record_write",
);

const malformedDecisionReceipt =
  refuseOperatorApprovedSelectedSessionDigestIngestDecisionWriteV01({
    decision_preview: {},
    operator_approval: {
      operator_decision: "approve_for_future_ingest_write",
      approved_by: "operator:durable-hardening",
      operator_ref: "operator:durable-hardening",
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement: "Bounded refusal construction check.",
      checklist_confirmations: {},
    },
    idempotency_key: "idempotency:durable-hardening",
  });
assert.equal(malformedDecisionReceipt.status, "refused");
assert(
  malformedDecisionReceipt.receipt.refusal_reasons.includes(
    "decision_preview_malformed",
  ) ||
    malformedDecisionReceipt.receipt.refusal_reasons.includes(
      "decision_preview_version_invalid",
    ),
);
const decisionNotesStringInput = buildValidDecisionWriteInput(readyDecision);
decisionNotesStringInput.notes = "not-an-array";
assert(
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    decisionNotesStringInput,
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("notes_must_be_string_array"),
);
const decisionNotesObjectInput = buildValidDecisionWriteInput(readyDecision);
decisionNotesObjectInput.notes = { note: "not-array" };
assert(
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    decisionNotesObjectInput,
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("notes_must_be_string_array"),
);
const malformedCarryForwardContract = structuredClone(readyContract);
malformedCarryForwardContract.carry_forward_review_only_material = {
  rejected_or_review_only_candidate_refs: [],
};
const malformedCarryDecision =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview:
      malformedCarryForwardContract,
  });
assert(
  ["blocked", "insufficient_data"].includes(
    malformedCarryDecision.decision_preview_status,
  ),
  "malformed carry-forward material should not throw",
);
assert(
  [
    ...malformedCarryDecision.blocking_reasons,
    ...malformedCarryDecision.write_readiness.current_insufficient_data,
  ].some((reason) =>
    reason.includes(
      "ingest_contract_preview_carry_forward_review_only_material_invalid",
    ),
  ),
);

const decisionWriteInput = buildValidDecisionWriteInput(readyDecision);
const decisionResult =
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    decisionWriteInput,
    { db: new Database(":memory:") },
  );
assert.equal(decisionResult.status, "written");
assert(decisionResult.record, "decision writer should return a record");

const validIngestInput = buildValidIngestInput(decisionResult.record);
const ingestValidation =
  validateSelectedSessionDigestIngestWriteInputV01(validIngestInput);
assert.equal(ingestValidation.ok, true, ingestValidation.refusal_reasons.join(", "));
assertIngestWriteAuthority(
  createSelectedSessionDigestIngestWriteAuthorityBoundaryV01({ writeNow: true }),
);

assert.equal(
  writeSelectedSessionDigestIngestRecordV01({}, { db: new Database(":memory:") })
    .status,
  "refused",
);
assert(
  writeSelectedSessionDigestIngestRecordV01(
    {
      operator_approved_decision_record: {
        record_version: "wrong.v0",
      },
      idempotency_key: "idempotency:selected-digest-durable-check",
    },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("decision_record_version_invalid"),
);
const malformedDecisionRecordInput = buildValidIngestInput({ record_version: "x" });
assert.equal(
  writeSelectedSessionDigestIngestRecordV01(malformedDecisionRecordInput, {
    db: new Database(":memory:"),
  }).status,
  "refused",
);
const nonApprovedRecord = structuredClone(decisionResult.record);
nonApprovedRecord.operator_decision = "defer";
assert(
  writeSelectedSessionDigestIngestRecordV01(
    buildValidIngestInput(nonApprovedRecord),
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes(
    "decision_record_operator_decision_not_approved",
  ),
);
const wrongScopeRecord = structuredClone(decisionResult.record);
wrongScopeRecord.scope = "project:other";
const wrongScopeResult = writeSelectedSessionDigestIngestRecordV01(
  buildValidIngestInput(wrongScopeRecord),
  { db: new Database(":memory:") },
);
assert.equal(wrongScopeResult.status, "refused");
assert(
  wrongScopeResult.receipt.refusal_reasons.includes(
    "decision_record_scope_invalid",
  ),
);
const priorMutationRecord = structuredClone(decisionResult.record);
priorMutationRecord.no_side_effects = {
  selected_session_digest_ingest_record_written: true,
};
assert(
  writeSelectedSessionDigestIngestRecordV01(
    buildValidIngestInput(priorMutationRecord),
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes(
    "decision_record_indicates_actual_ingest_or_state_mutation",
  ),
);
assert(
  writeSelectedSessionDigestIngestRecordV01(
    { ...validIngestInput, idempotency_key: "sk-private" },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("idempotency_key_missing_or_invalid"),
);
assert(
  writeSelectedSessionDigestIngestRecordV01(
    { ...validIngestInput, idempotency_key: "idempotency:mismatch" },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("idempotency_key_mismatch_with_decision_record"),
);
const missingSelectedRefsRecord = structuredClone(decisionResult.record);
missingSelectedRefsRecord.approved_future_ingest_material.selected_digest_candidate_refs = [];
assert(
  writeSelectedSessionDigestIngestRecordV01(
    buildValidIngestInput(missingSelectedRefsRecord),
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("selected_digest_candidate_refs_missing"),
);
const missingMaterialRecord = structuredClone(decisionResult.record);
missingMaterialRecord.approved_future_ingest_material.source_ref = null;
missingMaterialRecord.approved_future_ingest_material.operator_ref = null;
missingMaterialRecord.approved_future_ingest_material.session_ref = null;
missingMaterialRecord.approved_future_ingest_material.project_ref = null;
missingMaterialRecord.approved_future_ingest_material.evidence_refs = [];
missingMaterialRecord.approved_future_ingest_material.privacy_review_confirmation_ref = null;
const missingMaterialRefusals = writeSelectedSessionDigestIngestRecordV01(
  buildValidIngestInput(missingMaterialRecord),
  { db: new Database(":memory:") },
).receipt.refusal_reasons;
assert(missingMaterialRefusals.includes("source_ref_missing"));
assert(missingMaterialRefusals.includes("operator_ref_missing"));
assert(missingMaterialRefusals.includes("session_or_project_ref_missing"));
assert(missingMaterialRefusals.includes("evidence_refs_missing"));
assert(missingMaterialRefusals.includes("privacy_review_confirmation_ref_missing"));

const rawLeakRecord = structuredClone(decisionResult.record);
rawLeakRecord.approved_future_ingest_material.sanitized_candidate_summaries[0].summary =
  "raw_text should be refused";
assert(
  writeSelectedSessionDigestIngestRecordV01(
    buildValidIngestInput(rawLeakRecord),
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("raw_or_private_marker_material_refused"),
);
const privateMarkerRecord = structuredClone(decisionResult.record);
privateMarkerRecord.approved_future_ingest_material.sanitized_candidate_summaries[0].summary =
  "password: durable-private";
assert(
  writeSelectedSessionDigestIngestRecordV01(
    buildValidIngestInput(privateMarkerRecord),
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("raw_or_private_marker_material_refused"),
);
const sampleInput = buildValidIngestInput(decisionResult.record);
sampleInput.notes = ["sample marker should be refused"];
assert(
  writeSelectedSessionDigestIngestRecordV01(sampleInput, {
    db: new Database(":memory:"),
  }).receipt.refusal_reasons.includes(
    "sample_fixture_default_or_smoke_material_refused",
  ),
);
const forbiddenSideEffectInput = buildValidIngestInput(decisionResult.record);
forbiddenSideEffectInput.requested_side_effects = {
  can_write_memory: true,
};
assert.equal(
  writeSelectedSessionDigestIngestRecordV01(forbiddenSideEffectInput, {
    db: new Database(":memory:"),
  }).status,
  "refused",
);

const tempDir = path.join(
  process.cwd(),
  ".tmp/selected-session-digest-ingest-records",
);
mkdirSync(tempDir, { recursive: true });
const dbPath = path.join(tempDir, "durable-ingest-check.sqlite");
if (existsSync(dbPath)) rmSync(dbPath);
const db = new Database(dbPath);
try {
  const beforeSchemaList = listSelectedSessionDigestIngestRecordsV01({ db });
  assert.equal(beforeSchemaList.status, "schema_missing");
  assert.equal(selectedSessionDigestIngestWriteSchemaExistsV01(db), false);

  const written = writeSelectedSessionDigestIngestRecordV01(validIngestInput, {
    db,
  });
  assert.equal(written.status, "written");
  assert.equal(written.receipt.wrote, true);
  assert.equal(
    written.receipt.no_side_effects.selected_session_digest_ingest_record_written,
    true,
  );
  assert.equal(
    written.receipt.no_side_effects.selected_session_digest_ingest_receipt_written,
    true,
  );
  assert.equal(
    written.receipt.no_side_effects
      .selected_session_digest_persisted_as_candidate_record,
    true,
  );
  assertNoPromotionSideEffects(written.receipt.no_side_effects);
  assert(written.record?.record_id);
  assertNoLeaks(JSON.stringify(written.record));

  const replay = writeSelectedSessionDigestIngestRecordV01(validIngestInput, {
    db,
  });
  assert.equal(replay.status, "idempotent_existing");
  assert.equal(replay.receipt.idempotent_replay, true);

  const conflictInput = buildValidIngestInput(decisionResult.record);
  conflictInput.notes = ["alternate durable candidate note"];
  const conflict = writeSelectedSessionDigestIngestRecordV01(conflictInput, {
    db,
  });
  assert.equal(conflict.status, "refused");
  assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

  const readById = readSelectedSessionDigestIngestRecordByIdV01(
    written.record.record_id,
    { db },
  );
  assert.equal(readById.status, "read");
  const readByKey = readSelectedSessionDigestIngestRecordByIdempotencyKeyV01(
    written.record.idempotency_key,
    { db },
  );
  assert.equal(readByKey.status, "read");
  const listed = listSelectedSessionDigestIngestRecordsV01({ db });
  assert.equal(listed.status, "listed");
  assert.equal(listed.records.length, 1);

  const noRecordReview = buildSelectedSessionDigestIngestRecordReviewV01({
    records: [],
    as_of: "2026-07-05T00:00:00.000Z",
  });
  assert.equal(noRecordReview.review_status, "no_records");
  const recordsReview = buildSelectedSessionDigestIngestRecordReviewV01({
    records: [written.record],
    as_of: "2026-07-05T00:00:00.000Z",
  });
  assert.equal(recordsReview.review_status, "records_available");
  assert.equal(recordsReview.input_summary.valid_record_count, 1);
  assert.equal(recordsReview.evidence_summary.has_no_side_effects_receipts, true);

  const defaultWorkbenchReview =
    readSelectedSessionDigestIngestRecordReviewForWebV01({
      as_of: "2026-07-05T00:00:00.000Z",
    });
  assert.equal(defaultWorkbenchReview.review_status, "no_records");
  assert.equal(defaultWorkbenchReview.input_summary.supplied_record_count, 0);

  const decisionReadyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
    selected_session_digest_intake_preview: cleanIntake,
    selected_session_digest_ingest_contract_preview: readyContract,
    selected_session_digest_ingest_operator_decision_preview: readyDecision,
    selected_session_digest_ingest_record_review: noRecordReview,
  });
  assert.equal(
    stepById(decisionReadyOverview, "selected_session_digest_durable_ingest_record")
      .recommended_next_action,
    "write_selected_session_digest_candidate_ingest_record",
  );
  assert.equal(
    decisionReadyOverview.recommended_next_operator_action,
    "write_selected_session_digest_candidate_ingest_record",
  );
  const recordReviewOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
    selected_session_digest_intake_preview: cleanIntake,
    selected_session_digest_ingest_contract_preview: readyContract,
    selected_session_digest_ingest_operator_decision_preview: readyDecision,
    selected_session_digest_ingest_record_review: recordsReview,
  });
  assert.equal(
    stepById(recordReviewOverview, "selected_session_digest_durable_ingest_record")
      .recommended_next_action,
    "review_selected_session_digest_ingest_record",
  );
  assertNoMemoryPromotionActions(recordReviewOverview);
} finally {
  db.close();
  if (existsSync(dbPath)) rmSync(dbPath);
}

const routeDbPath = ".tmp/selected-session-digest-ingest-records/route-check.sqlite";
const routeDbAbs = path.join(process.cwd(), routeDbPath);
if (existsSync(routeDbAbs)) rmSync(routeDbAbs);
const missingGet = await routeModule.GET(
  new Request(
    `http://localhost/api/intake/selected-session-digest/ingest-records?db_path=${encodeURIComponent(routeDbPath)}`,
    { headers: { host: "localhost" } },
  ),
);
assert.equal(missingGet.status, 404);
const unsafeGet = await routeModule.GET(
  new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-records?db_path=/tmp/private.sqlite",
    { headers: { host: "localhost" } },
  ),
);
assert.equal(unsafeGet.status, 400);
assert.equal(
  (await routeModule.POST(routeRequest({ action: "read", db_path: routeDbPath })))
    .status,
  400,
);
assert.equal(
  (await routeModule.POST(new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-records",
    {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://evil.example",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({ action: "write", db_path: routeDbPath }),
    },
  ))).status,
  403,
);
assert.equal(
  (await routeModule.POST(routeRequest({ action: "write", db_path: "../bad.db" })))
    .status,
  400,
);
assert.equal(
  (await routeModule.POST(routeRequest("not-object"))).status,
  400,
);
const invalidRouteWrite = await routeModule.POST(
  routeRequest({
    action: "write",
    db_path: routeDbPath,
    input: {},
  }),
);
assert.equal(invalidRouteWrite.status, 400);
assert.equal(existsSync(routeDbAbs), false, "invalid route write must not open DB");
const validRouteWrite = await routeModule.POST(
  routeRequest({
    action: "write",
    db_path: routeDbPath,
    input: validIngestInput,
  }),
);
assert.equal(validRouteWrite.status, 201);
const validRouteJson = await validRouteWrite.json();
assert.equal(validRouteJson.selected_session_digest_ingest_record_written, true);
assert.equal(validRouteJson.selected_session_digest_ingest_receipt_written, true);
assert.equal(validRouteJson.memory_mutated, false);
assert.equal(validRouteJson.current_working_perspective_updated, false);
assert.equal(validRouteJson.perspective_unit_written, false);
assert.equal(validRouteJson.next_work_bias_written, false);
assert.equal(validRouteJson.continuity_relay_written, false);
assert.equal(validRouteJson.handoff_context_mutated, false);
assert.equal(validRouteJson.handoff_sent, false);
assertNoPromotionSideEffects(validRouteJson.no_side_effects);
if (existsSync(routeDbAbs)) rmSync(routeDbAbs);

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "selected session digest durable ingest record v0.1",
});
for (const file of collectUntrackedFiles()) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected untracked file for selected session digest durable ingest record: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "selected-session-digest-durable-ingest-record-v0-1",
      pass: true,
      package_script_checked: true,
      hardening_checked: true,
      durable_writer_checked: true,
      route_checked: true,
      review_panel_checked: true,
      spine_overview_checked: true,
      changed_files_checked: changedFileBoundary.checked,
      changed_files_skipped: changedFileBoundary.skipped,
      changed_files_skip_reason: changedFileBoundary.skip_reason,
      changed_files_observed: changedFileBoundary.files,
      memory_mutated: false,
      current_working_perspective_updated: false,
      handoff_sent: false,
      no_workbench_action_button_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:selected-session-digest-durable-ingest-record-v0-1");

function buildCleanIntake() {
  return buildSelectedSessionDigestIntakePreviewV01({
    digest: {
      title: "Reviewable selected session durable check",
      summary: "Operator supplied selected digest summary for durable review.",
      goals: ["Preserve source-refed continuity"],
      decisions: ["Keep selected digest candidate ingest bounded"],
      open_questions: ["Which candidate record should be reviewed later"],
      next_actions: ["Review the durable candidate ingest record"],
      evidence_refs: ["evidence:selected-digest-durable-check"],
      source_refs: ["source:selected-digest-durable-check"],
      reusable_context: ["Current dogfood loop restart point"],
      rejected_or_review_only: ["Review-only note stays carry-forward only"],
      session_ref: "session:selected-digest-durable-check",
    },
    source_kind: "chatgpt_session_digest",
    source_ref: "source:selected-digest-durable-check",
    operator_ref: "operator:selected-digest-durable-reviewer",
    session_ref: "session:selected-digest-durable-check",
    as_of: "2026-07-05T00:00:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:selected-digest-durable-builder"],
  });
}

function buildValidDecisionWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_future_ingest_write",
      approved_by: "operator:selected-digest-durable-lead",
      operator_ref:
        decisionPreview.would_write_decision_record_preview.operator_ref ??
        "operator:selected-digest-durable-reviewer",
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement:
        "I reviewed the bounded decision boundary and confirm operator approval only.",
      checklist_confirmations: Object.fromEntries(
        decisionPreview.approval_requirements.map((requirement) => [
          requirement,
          true,
        ]),
      ),
    },
    idempotency_key:
      decisionPreview.would_write_decision_record_preview
        .requested_idempotency_key ?? "idempotency:selected-digest-durable-check",
    requested_side_effects: {
      can_write_db: true,
      can_create_ingest_decision_record: true,
      can_create_operator_approved_ingest_decision_record: true,
      can_create_ingest_decision_receipt: true,
    },
  };
}

function buildValidIngestInput(decisionRecord) {
  return {
    operator_approved_decision_record: decisionRecord,
    idempotency_key:
      decisionRecord?.idempotency_key ??
      "idempotency:selected-digest-durable-check",
    requested_side_effects: {
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_selected_session_digest_candidate_record: true,
    },
  };
}

function routeRequest(body) {
  return new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-records",
    {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
  );
}

function stepById(overview, stepId) {
  const step = overview.spine_steps.find((candidate) => candidate.step_id === stepId);
  assert(step, `Missing spine step ${stepId}`);
  return step;
}

function assertIngestWriteAuthority(authority) {
  assert.equal(authority.durable_local_candidate_ingest_record, true);
  assert.equal(authority.candidate_record_only, true);
  assert.equal(authority.source_of_truth, false);
  assert.equal(authority.can_write_db, true);
  assert.equal(authority.can_create_ingest_record, true);
  assert.equal(authority.can_create_ingest_receipt, true);
  assert.equal(authority.can_write_selected_session_digest_candidate_record, true);
  for (const [field, value] of Object.entries(authority)) {
    if (
      [
        "durable_local_candidate_ingest_record",
        "candidate_record_only",
        "can_write_db",
        "can_create_ingest_record",
        "can_create_ingest_receipt",
        "can_write_selected_session_digest_candidate_record",
      ].includes(field) ||
      field === "notes"
    ) {
      continue;
    }
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoPromotionSideEffects(noSideEffects) {
  for (const [field, value] of Object.entries(noSideEffects)) {
    if (
      [
        "selected_session_digest_ingest_record_written",
        "selected_session_digest_ingest_receipt_written",
        "selected_session_digest_persisted_as_candidate_record",
      ].includes(field)
    ) {
      continue;
    }
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoLeaks(json) {
  for (const forbidden of [
    "raw_text",
    "raw_digest",
    "raw_excerpt",
    "password:",
    "hunter2",
    "sk-",
    "ghp_",
    "github_pat_",
    "xoxb-",
    "https://user:pass@",
    "/Users/",
    "/home/",
    ".env",
  ]) {
    assert(!json.includes(forbidden), `output must not leak ${forbidden}`);
  }
}

function assertNoMemoryPromotionActions(overview) {
  const serialized = JSON.stringify(overview);
  for (const forbidden of [
    "promote_memory",
    "write_memory",
    "write_perspective_unit",
    "write_next_work_bias",
    "mutate_current_working_perspective",
    "apply_handoff_context",
    "send_handoff",
  ]) {
    assert(!serialized.includes(`\"recommended_next_action\":\"${forbidden}\"`));
    assert(!serialized.includes(`\"recommended_next_operator_action\":\"${forbidden}\"`));
  }
}

function assertNoActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(
    !/onClick\s*=/.test(text),
    `${label} must not add click handlers for action buttons`,
  );
  assert(!text.includes("ActionButton"), `${label} must not use action buttons`);
  assert(!text.includes("action-button"), `${label} must not use action buttons`);
}

function assertScopedRuntimeBoundaries() {
  const scopedRuntimeFiles = new Set([
    ingestWriteHelperFile,
    ingestRouteFile,
    decisionWriteHelperFile,
  ]);
  const forbidden = [
    "better-sqlite3",
    "CREATE TABLE",
    "INSERT INTO",
    "@/lib/db",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
  ];
  for (const [file, text] of textByFile) {
    if (file === packageJsonFile) continue;
    for (const phrase of forbidden) {
      if (scopedRuntimeFiles.has(file)) continue;
      assert(!text.includes(phrase), `${file} must not contain ${phrase}`);
    }
  }
  assert(
    ingestWriteHelperText.includes("selected_session_digest_ingest_records"),
    "durable writer should use only selected_session_digest_ingest_records",
  );
  assert(
    !ingestWriteHelperText.includes("selected_session_digest_ingest_receipts"),
    "durable writer must not create a separate selected digest ingest receipt table",
  );
  assert(
    !ingestWriteHelperText.includes("@/lib/memory") &&
      !ingestRouteText.includes("@/lib/memory"),
    "durable writer/route must not import memory write paths",
  );
}
