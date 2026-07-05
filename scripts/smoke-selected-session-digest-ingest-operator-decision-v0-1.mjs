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

const operatorDecisionTypeFile =
  "types/selected-session-digest-ingest-operator-decision.ts";
const operatorDecisionHelperFile =
  "lib/intake/selected-session-digest-ingest-operator-decision.ts";
const operatorDecisionPanelFile =
  "components/intake/selected-session-digest-ingest-operator-decision-panel.tsx";
const decisionWriteTypeFile =
  "types/selected-session-digest-ingest-decision-write.ts";
const decisionWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-decision-write.ts";
const routeFile =
  "app/api/intake/selected-session-digest/ingest-decisions/route.ts";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const overviewTypeFile = "types/workbench-dogfood-loop-spine-overview.ts";
const overviewHelperFile =
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const contractSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-contract-preview-v0-1.mjs";
const overviewSmokeFile =
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs";
const smokeFile =
  "scripts/smoke-selected-session-digest-ingest-operator-decision-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  operatorDecisionTypeFile,
  operatorDecisionHelperFile,
  operatorDecisionPanelFile,
  decisionWriteTypeFile,
  decisionWriteHelperFile,
  routeFile,
  agentWorkplaneFile,
  overviewTypeFile,
  overviewHelperFile,
  agentWorkplaneSmokeFile,
  contractSmokeFile,
  overviewSmokeFile,
  smokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  operatorDecisionTypeFile,
  operatorDecisionHelperFile,
  operatorDecisionPanelFile,
  decisionWriteTypeFile,
  decisionWriteHelperFile,
  routeFile,
  agentWorkplaneFile,
  overviewTypeFile,
  overviewHelperFile,
  packageJsonFile,
]);
const operatorDecisionTypeText = textByFile.get(operatorDecisionTypeFile);
const operatorDecisionHelperText = textByFile.get(operatorDecisionHelperFile);
const operatorDecisionPanelText = textByFile.get(operatorDecisionPanelFile);
const decisionWriteTypeText = textByFile.get(decisionWriteTypeFile);
const decisionWriteHelperText = textByFile.get(decisionWriteHelperFile);
const routeText = textByFile.get(routeFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const overviewTypeText = textByFile.get(overviewTypeFile);
const overviewHelperText = textByFile.get(overviewHelperFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:selected-session-digest-ingest-operator-decision-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-selected-session-digest-ingest-operator-decision-v0-1.mjs",
});

assertContainsAll(
  operatorDecisionTypeText,
  [
    "selected_session_digest_ingest_operator_decision_preview.v0.1",
    "ready_for_future_decision_record_write",
    "approve_for_future_ingest_write",
    "would_write_decision_record_preview",
    "can_create_ingest_record: false",
    "can_create_ingest_receipt: false",
  ],
  { label: operatorDecisionTypeFile },
);
assertContainsAll(
  decisionWriteTypeText,
  [
    "operator_approved_selected_session_digest_ingest_decision_record.v0.1",
    "operator_approved_selected_session_digest_ingest_decision_write_receipt.v0.1",
    "operator_approved_selected_session_digest_ingest_decision_store.v0.1",
    "selected_session_digest_ingest_record.v0.1",
    "selected_session_digest_ingest_receipt.v0.1",
    "selected_session_digest_ingest_record_written: false",
    "selected_session_digest_ingest_receipt_written: false",
  ],
  { label: decisionWriteTypeFile },
);
assertContainsAll(
  operatorDecisionHelperText,
  [
    "buildSelectedSessionDigestIngestOperatorDecisionPreviewV01",
    "createSelectedSessionDigestIngestOperatorDecisionAuthorityBoundaryV01",
    "SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION",
    "selected_digest_candidate_refs_not_subset_of_selectable_refs",
    "unknown_selected_digest_candidate_ref",
    "ready_for_future_decision_record_write",
  ],
  { label: operatorDecisionHelperFile },
);
assertContainsAll(
  decisionWriteHelperText,
  [
    "selectedSessionDigestIngestDecisionWriteSchemaSqlV01",
    "ensureSelectedSessionDigestIngestDecisionWriteSchemaV01",
    "selectedSessionDigestIngestDecisionWriteSchemaExistsV01",
    "validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01",
    "writeOperatorApprovedSelectedSessionDigestIngestDecisionV01",
    "refuseOperatorApprovedSelectedSessionDigestIngestDecisionWriteV01",
    "readSelectedSessionDigestIngestDecisionRecordByIdV01",
    "readSelectedSessionDigestIngestDecisionRecordByIdempotencyKeyV01",
    "listSelectedSessionDigestIngestDecisionRecordsV01",
    "createSelectedSessionDigestIngestDecisionWriteAuthorityBoundaryV01",
    "selected_session_digest_ingest_decision_records",
    "idempotency_key_conflict",
  ],
  { label: decisionWriteHelperFile },
);
assertContainsAll(
  routeText,
  [
    "operator_approved_selected_session_digest_ingest_decision_route.v0.1",
    "tmp/selected-session-digest-ingest-decisions/",
    ".tmp/selected-session-digest-ingest-decisions/",
    "fileMustExist: true",
    "requestHasSameOriginBoundary",
    "validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01",
    "openWriteIngestDecisionDb",
    "operator_approved_selected_session_digest_ingest_decision_record_written",
    "selected_session_digest_ingest_record_written: false",
    "selected_session_digest_ingest_receipt_written: false",
  ],
  { label: routeFile },
);
assert(
  routeText.indexOf(
    "validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01",
  ) < routeText.indexOf("openWriteIngestDecisionDb"),
  "route POST should validate before opening write DB",
);

assertContainsAll(
  operatorDecisionPanelText,
  [
    "Selected Session Digest Ingest Operator Decision",
    "recommended operator decision",
    "approval requirements",
    "would-write decision record",
    "would not write",
    "authority boundary",
  ],
  { label: operatorDecisionPanelFile },
);
assertContainsAll(
  agentWorkplaneText,
  [
    "SelectedSessionDigestIngestOperatorDecisionPanel",
    "buildSelectedSessionDigestIngestOperatorDecisionPreviewV01",
    "selectedSessionDigestIngestOperatorDecisionPreview",
    "selected_session_digest_ingest_contract_preview: selectedSessionDigestIngestContractPreview",
    "preview={selectedSessionDigestIngestOperatorDecisionPreview}",
    "selected_session_digest_ingest_operator_decision_preview: selectedSessionDigestIngestOperatorDecisionPreview",
  ],
  { label: agentWorkplaneFile },
);
assertContainsAll(
  overviewTypeText,
  [
    "SelectedSessionDigestIngestOperatorDecisionPreview",
    "selected_session_digest_ingest_operator_decision_preview",
    "selected_session_digest_ingest_operator_decision",
    "prepare_operator_approved_selected_session_digest_ingest_decision_record",
    "resolve_selected_session_digest_ingest_decision_blockers",
  ],
  { label: overviewTypeFile },
);
assertContainsAll(
  overviewHelperText,
  [
    "selectedSessionDigestIngestOperatorDecisionStep",
    "selected_session_digest_ingest_operator_decision",
    "selected_session_digest_ingest_operator_decision_preview",
    "prepare_operator_approved_selected_session_digest_ingest_decision_record",
    "mapSelectedSessionIngestOperatorDecisionStatus",
  ],
  { label: overviewHelperFile },
);

assertNoActionButtons(operatorDecisionPanelFile, operatorDecisionPanelText);
assertNoActionButtons(agentWorkplaneFile, agentWorkplaneText);
assertNoForbiddenRuntimeOutsideScopedFiles();
assertNoActualSelectedDigestIngestTable();

const { buildSelectedSessionDigestIntakePreviewV01 } = await import(
  "../lib/intake/selected-session-digest-intake-preview.ts"
);
const { buildSelectedSessionDigestIngestContractPreviewV01 } = await import(
  "../lib/intake/selected-session-digest-ingest-contract-preview.ts"
);
const {
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01,
  createSelectedSessionDigestIngestOperatorDecisionAuthorityBoundaryV01,
} = await import(
  "../lib/intake/selected-session-digest-ingest-operator-decision.ts"
);
const decisionWriteModule = await import(
  "../lib/intake/selected-session-digest-ingest-decision-write.ts"
);
const {
  selectedSessionDigestIngestDecisionWriteSchemaExistsV01,
  validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01,
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01,
  readSelectedSessionDigestIngestDecisionRecordByIdV01,
  readSelectedSessionDigestIngestDecisionRecordByIdempotencyKeyV01,
  listSelectedSessionDigestIngestDecisionRecordsV01,
  createSelectedSessionDigestIngestDecisionWriteAuthorityBoundaryV01,
} = decisionWriteModule;
const routeModule = await import(
  "../app/api/intake/selected-session-digest/ingest-decisions/route.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const missingDecisionPreview =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01();
assert.equal(
  missingDecisionPreview.decision_preview_status,
  "no_ingest_contract_preview",
);
assert.equal(
  missingDecisionPreview.recommended_operator_decision,
  "defer_until_contract_material_supplied",
);
assert.equal(missingDecisionPreview.write_readiness.write_ready, false);

const wrongVersionDecision =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview: { preview_version: "wrong.v0" },
  });
assert(
  ["blocked", "insufficient_data"].includes(
    wrongVersionDecision.decision_preview_status,
  ),
  "wrong-version contract preview should not throw",
);
assert.equal(wrongVersionDecision.write_readiness.write_ready, false);

const malformedDecision =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview: {
      preview_version: "selected_session_digest_ingest_contract_preview.v0.1",
    },
  });
assert(
  ["blocked", "insufficient_data"].includes(
    malformedDecision.decision_preview_status,
  ),
  "malformed contract preview should not throw",
);

const emptyIntake = buildSelectedSessionDigestIntakePreviewV01();
const emptyContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: emptyIntake,
});
const emptyDecision = buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
  selected_session_digest_ingest_contract_preview: emptyContract,
});
assert.notEqual(
  emptyDecision.decision_preview_status,
  "ready_for_future_decision_record_write",
);
assert.equal(emptyDecision.write_readiness.write_ready, false);

const cleanIntake = buildCleanIntake();
const selectableContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: cleanIntake,
});
const firstCandidateRef =
  selectableContract.would_ingest_material_preview.selectable_digest_candidate_refs[0];
assert(firstCandidateRef, "clean intake should expose selectable candidate refs");

const readyContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_candidate_refs: [firstCandidateRef],
  privacy_review_confirmation_ref: "privacy:selected-digest-decision-test",
  requested_idempotency_key: "idempotency:selected-digest-decision-test",
  requested_ingest_scope_ref: "scope:selected-digest-decision-test",
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
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_future_ingest_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.would_write_decision_record_preview
    .selected_digest_candidate_refs[0],
  firstCandidateRef,
);
assertAuthorityFalse(
  createSelectedSessionDigestIngestOperatorDecisionAuthorityBoundaryV01(),
);

const unknownRefContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_candidate_refs: ["candidate:not-from-this-intake"],
  privacy_review_confirmation_ref: "privacy:selected-digest-decision-test",
  requested_idempotency_key: "idempotency:selected-digest-decision-test",
  requested_ingest_scope_ref: "scope:selected-digest-decision-test",
});
const unknownRefDecision =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview: unknownRefContract,
  });
assert.notEqual(
  unknownRefDecision.decision_preview_status,
  "ready_for_future_decision_record_write",
);
assert.equal(unknownRefDecision.write_readiness.write_ready, false);
assert(
  [
    ...unknownRefDecision.blocking_reasons,
    ...unknownRefDecision.refusal_reasons,
    ...unknownRefDecision.write_readiness.current_refusal_reasons,
    ...unknownRefDecision.write_readiness.current_insufficient_data,
  ].some((reason) =>
    [
      "selected_candidate_refs_not_in_intake_preview",
      "unknown_selected_digest_candidate_ref",
      "selected_digest_candidate_refs_missing",
    ].includes(reason),
  ),
  "unknown selected refs should block or refuse decision readiness",
);
const unknownOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_session_digest_ingest_contract_preview: unknownRefContract,
  selected_session_digest_ingest_operator_decision_preview: unknownRefDecision,
});
assert.notEqual(
  unknownOverview.recommended_next_operator_action,
  "prepare_separate_ingest_write_slice",
);

const missingPrivacyDecision = buildDecisionFromContractInput({
  selected_session_digest_intake_preview: cleanIntake,
  selected_candidate_refs: [firstCandidateRef],
  requested_idempotency_key: "idempotency:selected-digest-decision-test",
});
assert.equal(
  missingPrivacyDecision.recommended_operator_decision,
  "defer_until_privacy_review_confirmed",
);
const missingIdempotencyDecision = buildDecisionFromContractInput({
  selected_session_digest_intake_preview: cleanIntake,
  selected_candidate_refs: [firstCandidateRef],
  privacy_review_confirmation_ref: "privacy:selected-digest-decision-test",
});
assert.equal(
  missingIdempotencyDecision.recommended_operator_decision,
  "defer_until_idempotency_supplied",
);
const missingEvidenceIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Decision candidate without evidence refs",
    session_ref: "session:selected-digest-decision-missing-evidence",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:selected-digest-decision-missing-evidence",
  operator_ref: "operator:selected-digest-decision-reviewer",
  session_ref: "session:selected-digest-decision-missing-evidence",
});
const missingEvidenceDecision = buildDecisionFromContractInput({
  selected_session_digest_intake_preview: missingEvidenceIntake,
});
assert.notEqual(
  missingEvidenceDecision.decision_preview_status,
  "ready_for_future_decision_record_write",
);
assert.equal(missingEvidenceDecision.write_readiness.write_ready, false);

const unsafeIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Unsafe source ref candidate",
    evidence_refs: ["evidence:selected-digest-decision-unsafe"],
    session_ref: "session:selected-digest-decision-unsafe",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:sk-private",
  operator_ref: "operator:selected-digest-decision-reviewer",
  session_ref: "session:selected-digest-decision-unsafe",
});
const unsafeDecision = buildDecisionFromContractInput({
  selected_session_digest_intake_preview: unsafeIntake,
});
assert.equal(unsafeDecision.decision_preview_status, "blocked");
assert.equal(
  unsafeDecision.recommended_operator_decision,
  "resolve_blockers_or_unsafe_refs",
);

assert.equal(
  readyDecision.candidate_carry_forward.review_only_candidate_count,
  1,
);
assertNoLeaks(JSON.stringify(readyDecision));
assertNoLeaks(
  JSON.stringify(readyDecision.would_write_decision_record_preview),
);

const validInput = buildValidWriteInput(readyDecision);
const validation =
  validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01(
    validInput,
  );
assert.equal(validation.ok, true, validation.refusal_reasons.join(", "));

const nonReadyWrite = writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
  buildValidWriteInput(emptyDecision),
  { db: new Database(":memory:") },
);
assert.equal(nonReadyWrite.status, "refused");
assert(
  nonReadyWrite.receipt.refusal_reasons.includes("write_readiness_not_ready"),
);

const missingChecklistInput = structuredClone(validInput);
missingChecklistInput.operator_approval.checklist_confirmations = {};
assert.equal(
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    missingChecklistInput,
    { db: new Database(":memory:") },
  ).status,
  "refused",
);

const mismatchedOperatorInput = structuredClone(validInput);
mismatchedOperatorInput.operator_approval.operator_ref = "operator:mismatch";
assert(
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    mismatchedOperatorInput,
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes(
    "operator_ref_mismatch_with_decision_preview",
  ),
);

const mismatchedIdempotencyInput = structuredClone(validInput);
mismatchedIdempotencyInput.idempotency_key = "idempotency:mismatch";
assert(
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    mismatchedIdempotencyInput,
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes(
    "idempotency_key_mismatch_with_decision_preview",
  ),
);

const sampleInput = structuredClone(validInput);
sampleInput.notes = ["sample marker should be refused"];
assert(
  writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(sampleInput, {
    db: new Database(":memory:"),
  }).receipt.refusal_reasons.includes(
    "sample_fixture_default_or_smoke_material_refused",
  ),
);

const sideEffectInput = structuredClone(validInput);
sideEffectInput.requested_side_effects = {
  can_create_ingest_record: true,
  can_write_memory: true,
};
const sideEffectResult = writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
  sideEffectInput,
  { db: new Database(":memory:") },
);
assert.equal(sideEffectResult.status, "refused");
assert(
  sideEffectResult.receipt.refusal_reasons.some((reason) =>
    reason.includes("requested_side_effect_not_allowed") ||
    reason.includes("requested_side_effect_forbidden"),
  ),
);

const tempDir = path.join(
  process.cwd(),
  ".tmp/selected-session-digest-ingest-decisions",
);
mkdirSync(tempDir, { recursive: true });
const dbPath = path.join(tempDir, "operator-decision-test.sqlite");
if (existsSync(dbPath)) rmSync(dbPath);
const db = new Database(dbPath);
try {
  const beforeSchemaList = listSelectedSessionDigestIngestDecisionRecordsV01({
    db,
  });
  assert.equal(beforeSchemaList.status, "schema_missing");
  assert.equal(
    selectedSessionDigestIngestDecisionWriteSchemaExistsV01(db),
    false,
  );

  const written = writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    validInput,
    { db },
  );
  assert.equal(written.status, "written");
  assert.equal(written.receipt.wrote, true);
  assert.equal(
    written.receipt.no_side_effects
      .selected_session_digest_ingest_record_written,
    false,
  );
  assert.equal(
    written.receipt.no_side_effects
      .selected_session_digest_ingest_receipt_written,
    false,
  );
  assertNoStateSideEffects(written.receipt.no_side_effects);
  assert(written.record?.record_id);

  const replay = writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    validInput,
    { db },
  );
  assert.equal(replay.status, "idempotent_existing");
  assert.equal(replay.receipt.idempotent_replay, true);

  const conflictInput = structuredClone(validInput);
  conflictInput.operator_approval.approval_statement =
    "I reviewed the bounded decision record and confirm a changed statement.";
  const conflict = writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
    conflictInput,
    { db },
  );
  assert.equal(conflict.status, "refused");
  assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

  const readById = readSelectedSessionDigestIngestDecisionRecordByIdV01(
    written.record.record_id,
    { db },
  );
  assert.equal(readById.status, "read");
  const readByKey =
    readSelectedSessionDigestIngestDecisionRecordByIdempotencyKeyV01(
      validInput.idempotency_key,
      { db },
    );
  assert.equal(readByKey.status, "read");
  const listed = listSelectedSessionDigestIngestDecisionRecordsV01({
    db,
    operator_ref: validInput.operator_approval.operator_ref,
  });
  assert.equal(listed.status, "listed");
  assert.equal(listed.records.length, 1);
} finally {
  db.close();
}

const missingDbGet = await routeModule.GET(
  new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-decisions?db_path=.tmp/selected-session-digest-ingest-decisions/missing.sqlite",
  ),
);
assert.equal(missingDbGet.status, 404);
const unsafePathGet = await routeModule.GET(
  new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-decisions?db_path=/Users/hynk/private.sqlite",
  ),
);
assert.equal(unsafePathGet.status, 400);
const invalidActionPost = await routeModule.POST(
  routeRequest({ action: "execute", db_path: routeDbPath(), input: validInput }),
);
assert.equal(invalidActionPost.status, 400);
const invalidObjectPost = await routeModule.POST(
  new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-decisions",
    {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify(null),
    },
  ),
);
assert.equal(invalidObjectPost.status, 400);
const crossSitePost = await routeModule.POST(
  new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-decisions",
    {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://evil.example",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({ action: "write", db_path: routeDbPath(), input: validInput }),
    },
  ),
);
assert.equal(crossSitePost.status, 403);

const routeDb = routeDbPath();
const routeDbAbs = path.join(process.cwd(), routeDb);
if (existsSync(routeDbAbs)) rmSync(routeDbAbs);
const validRoutePost = await routeModule.POST(
  routeRequest({ action: "write", db_path: routeDb, input: validInput }),
);
assert.equal(validRoutePost.status, 201);
const validRouteJson = await validRoutePost.json();
assert.equal(
  validRouteJson.operator_approved_selected_session_digest_ingest_decision_record_written,
  true,
);
assert.equal(validRouteJson.selected_session_digest_ingest_record_written, false);
assert.equal(validRouteJson.selected_session_digest_ingest_receipt_written, false);
assert.equal(
  validRouteJson.no_side_effects.selected_session_digest_ingest_record_written,
  false,
);

const readyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_session_digest_ingest_contract_preview: readyContract,
  selected_session_digest_ingest_operator_decision_preview: readyDecision,
});
assert(
  readyOverview.spine_steps.some(
    (step) => step.step_id === "selected_session_digest_ingest_operator_decision",
  ),
);
assert.equal(
  readyOverview.recommended_next_operator_action,
  "prepare_operator_approved_selected_session_digest_ingest_decision_record",
);
assert.notEqual(
  readyOverview.recommended_next_operator_action,
  "prepare_separate_ingest_write_slice",
);

const writeAuthority = createSelectedSessionDigestIngestDecisionWriteAuthorityBoundaryV01({
  writeNow: true,
});
assert.equal(writeAuthority.can_write_db, true);
assert.equal(writeAuthority.can_create_ingest_decision_record, true);
assert.equal(writeAuthority.can_create_ingest_record, false);
assert.equal(writeAuthority.can_create_ingest_receipt, false);

for (const cleanupPath of [dbPath, routeDbAbs]) {
  if (existsSync(cleanupPath)) rmSync(cleanupPath);
}

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "selected-session-digest-ingest-operator-decision-v0-1",
});
for (const file of collectUntrackedFiles()) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected untracked file for selected session digest ingest operator decision: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "selected-session-digest-ingest-operator-decision-v0-1",
      pass: true,
      package_script_checked: true,
      decision_preview_checked: true,
      writer_checked: true,
      route_checked: true,
      workbench_panel_checked: true,
      spine_overview_checked: true,
      changed_files_checked: changedFileBoundary.checked,
      changed_files_skipped: changedFileBoundary.skipped,
      changed_files_skip_reason: changedFileBoundary.skip_reason,
      changed_files_observed: changedFileBoundary.files,
      selected_session_digest_ingest_record_written: false,
      selected_session_digest_ingest_receipt_written: false,
      no_workbench_action_button_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:selected-session-digest-ingest-operator-decision-v0-1");

function buildCleanIntake() {
  return buildSelectedSessionDigestIntakePreviewV01({
    digest: {
      title: "Reviewable selected session decision",
      summary: "Operator supplied selected digest summary for decision review.",
      goals: ["Preserve source-refed continuity"],
      decisions: ["Keep selected digest ingest as a later slice"],
      open_questions: ["Which selected candidates should move forward"],
      next_actions: ["Review the bounded operator decision record"],
      evidence_refs: ["evidence:selected-digest-decision-test"],
      source_refs: ["source:selected-digest-decision-test"],
      reusable_context: ["Current dogfood loop restart point"],
      rejected_or_review_only: ["Review-only note stays out of future material"],
      session_ref: "session:selected-digest-decision-test",
    },
    source_kind: "chatgpt_session_digest",
    source_ref: "source:selected-digest-decision-test",
    operator_ref: "operator:selected-digest-decision-reviewer",
    session_ref: "session:selected-digest-decision-test",
    as_of: "2026-07-05T00:00:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:selected-digest-decision-builder"],
  });
}

function buildDecisionFromContractInput(input) {
  const contract = buildSelectedSessionDigestIngestContractPreviewV01(input);
  return buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview: contract,
  });
}

function buildValidWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_future_ingest_write",
      approved_by: "operator:selected-digest-decision-lead",
      operator_ref:
        decisionPreview.would_write_decision_record_preview.operator_ref ??
        "operator:selected-digest-decision-reviewer",
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement:
        "I reviewed the bounded decision record and confirm decision-record scope only.",
      checklist_confirmations: Object.fromEntries(
        decisionPreview.approval_requirements.map((requirement) => [
          requirement,
          true,
        ]),
      ),
    },
    idempotency_key:
      decisionPreview.would_write_decision_record_preview
        .requested_idempotency_key ?? "idempotency:selected-digest-decision-test",
    requested_side_effects: {
      can_write_db: true,
      can_create_ingest_decision_record: true,
      can_create_operator_approved_ingest_decision_record: true,
      can_create_ingest_decision_receipt: true,
    },
  };
}

function routeDbPath() {
  return ".tmp/selected-session-digest-ingest-decisions/route-test.sqlite";
}

function routeRequest(body) {
  return new Request(
    "http://localhost/api/intake/selected-session-digest/ingest-decisions",
    {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify(body),
    },
  );
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

function assertNoStateSideEffects(noSideEffects) {
  for (const [field, value] of Object.entries(noSideEffects)) {
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

function assertNoActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(
    !/onClick\s*=/.test(text),
    `${label} must not add click handlers for action buttons`,
  );
  assert(!text.includes("ActionButton"), `${label} must not use action buttons`);
  assert(!text.includes("action-button"), `${label} must not use action buttons`);
}

function assertNoForbiddenRuntimeOutsideScopedFiles() {
  const scopedWriteFiles = new Set([decisionWriteHelperFile, routeFile]);
  for (const [file, text] of textByFile) {
    if (file === packageJsonFile) continue;
    if (scopedWriteFiles.has(file)) continue;
    for (const forbidden of [
      "fetch(",
      "method: \"POST\"",
      "method: 'POST'",
      "better-sqlite3",
      "new Database",
      "@/lib/db",
      "INSERT INTO",
      "UPDATE ",
      "DELETE FROM",
      "CREATE TABLE",
      "ALTER TABLE",
      "DROP TABLE",
      "@openai",
      "OpenAI",
      "Octokit",
      "@octokit",
      "createPullRequest",
      "mergePullRequest",
      "executeCodex",
      "setInterval(",
      "setTimeout(",
    ]) {
      assert(!text.includes(forbidden), `${file} must not include ${forbidden}`);
    }
  }
  assert(decisionWriteHelperText.includes("CREATE TABLE IF NOT EXISTS selected_session_digest_ingest_decision_records"));
  assert(decisionWriteHelperText.includes("INSERT INTO selected_session_digest_ingest_decision_records"));
  assert(routeText.includes("app/api/intake/selected-session-digest/ingest-decisions") || routeFile.includes("app/api/"));
}

function assertNoActualSelectedDigestIngestTable() {
  const combined = [
    operatorDecisionTypeText,
    operatorDecisionHelperText,
    decisionWriteTypeText,
    decisionWriteHelperText,
    routeText,
  ].join("\n");
  assert(
    !/CREATE TABLE IF NOT EXISTS selected_session_digest_ingest_records/.test(
      combined,
    ),
    "must not create actual selected session digest ingest records table",
  );
  assert(
    !/CREATE TABLE IF NOT EXISTS selected_session_digest_ingest_receipts/.test(
      combined,
    ),
    "must not create actual selected session digest ingest receipts table",
  );
  assert(
    !/INSERT INTO selected_session_digest_ingest_records/.test(combined),
    "must not insert actual selected session digest ingest records",
  );
  assert(
    !/INSERT INTO selected_session_digest_ingest_receipts/.test(combined),
    "must not insert actual selected session digest ingest receipts",
  );
}
