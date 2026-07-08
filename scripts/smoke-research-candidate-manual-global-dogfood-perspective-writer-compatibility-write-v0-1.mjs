#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-review.ts";
import {
  rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt,
  writeResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility,
} from "../lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-write.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-state-application.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-writer-compatibility.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
} from "../types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write.ts";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-perspective-writer-compatibility.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-writer-compatibility-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-perspective-writer-compatibility-contract-panel.tsx",
  stateApplicationReadbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-state-application-readback-panel.tsx",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  docs: "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  packageJson: "package.json",
};

for (const filePath of Object.values(files)) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [
    key,
    readFileSync(filePath, "utf8"),
  ]),
);
const packageJson = JSON.parse(source.packageJson);

assertStaticContracts();
assertRuntimeWritePath();
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-perspective-writer-compatibility-write-v0-1",
      pass: true,
      storage_path: "manual_specific_perspective_writer_compatibility_tables",
      source_perspective_state_application_revalidated: true,
      malformed_contract_refusal_checked: true,
      duplicate_replay_checked: true,
      rollback_checked: true,
      supersede_checked: true,
      route_boundary_checked: true,
      existing_writer_non_invocation_checked: true,
      non_target_flags_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "I authorize writing this manual global dogfood Perspective writer compatibility candidate to a Perspective writer compatibility record",
    "I authorize rolling back this manual global dogfood Perspective writer compatibility receipt",
    "manual_operator_authorized_perspective_writer_compatibility_write",
    "manual_operator_authorized_perspective_writer_compatibility_rollback",
    "can_write_perspective_writer_compatibility_record: true",
    "can_write_perspective_writer_compatibility_receipt: true",
    "can_write_perspective_writer_compatibility_rollback_metadata: true",
    "can_call_existing_current_working_writer: false",
    "can_call_existing_canonical_state_writer: false",
    "can_mutate_perspective_state_application_record: false",
    "persists_raw_manual_note_text: false",
    "persists_raw_result_report_text: false",
    "persists_operator_notes: false",
  ]) {
    assert.ok(source.type.includes(requiredText), `type must include ${requiredText}`);
  }

  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks",
    "source_perspective_writer_compatibility_contract_fingerprint TEXT NOT NULL",
    "source_perspective_writer_compatibility_review_fingerprint TEXT NOT NULL",
    "source_perspective_state_application_receipt_id TEXT NOT NULL",
    "source_perspective_state_application_record_id TEXT NOT NULL",
    "source_perspective_state_application_record_fingerprint TEXT NOT NULL",
    "source_handoff_seed_fingerprint TEXT NOT NULL",
    "source_result_text_fingerprint TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "writer_compatibility_label TEXT NOT NULL",
    "writer_compatibility_rationale TEXT NOT NULL",
    "state_application_label TEXT NOT NULL",
    "state_application_rationale TEXT NOT NULL",
    "existing_current_working_writer_compatibility_json TEXT NOT NULL",
    "existing_canonical_state_writer_compatibility_json TEXT NOT NULL",
    "manual_writer_compatibility_path_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityTables",
    ),
    "lib/db.ts must migrate manual Perspective writer compatibility tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility",
    ),
    "db-migrations must expose writer compatibility migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityResult",
    ),
    "db-migrate must run writer compatibility migration",
  );

  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  assert.match(
    source.writer,
    /const contractShapeValid =[\s\S]*validateContractShape\(contractRecord\)/,
    "writer must validate contract shape before typed access",
  );
  assert.match(
    source.writer,
    /contractShapeValid && contract[\s\S]*computePerspectiveWriterCompatibilityIdempotencyKey\(contract\)/,
    "writer must compute idempotency only for a shape-valid contract",
  );
  assert.match(
    source.writer,
    /contractShapeValid && contract[\s\S]*validateReview\(review, contract\)/,
    "writer must bind review only for a shape-valid contract",
  );
  assert.match(
    source.writer,
    /readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId/,
    "writer must revalidate source Perspective state application readback",
  );
  assert.match(
    source.writer,
    /perspective_writer_compatibility_existing_writer_claim_refused/,
    "writer must refuse unproven existing writer compatibility claims",
  );
  for (const requiredText of [
    "perspective_writer_compatibility_source_state_application_receipt_not_active_committed",
    "perspective_writer_compatibility_source_state_application_record_mismatch",
    "perspective_writer_compatibility_source_readback_forbidden_mutation_flag",
    "perspective_writer_compatibility_target_must_be_manual_specific",
    "perspective_writer_compatibility_storage_path_must_be_manual_specific",
    "perspective_writer_compatibility_future_write_scope_must_be_record_only",
    "source_handoff_seed_fingerprint_missing",
    "source_result_text_fingerprint_missing",
    "summary.source_handoff_seed_fingerprint",
    "summary.source_result_text_fingerprint",
  ]) {
    assert.ok(source.writer.includes(requiredText), `writer must include ${requiredText}`);
  }

  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computePerspectiveWriterCompatibilityIdempotencyKey"),
    source.writer.indexOf("function writerAuthorityBoundaryIsNarrow"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note material",
  );
  assert.match(idempotencySlice, /source_perspective_state_application_receipt_id/);
  assert.match(idempotencySlice, /source_handoff_seed_fingerprint/);
  assert.match(idempotencySlice, /source_result_text_fingerprint/);

  for (const requiredText of [
    "allowOriginlessSameOriginRead",
    'request.method === "GET"',
    'fetchSite === "same-origin"',
    "requestHasSameOriginBoundary(request, { allowOriginlessSameOriginRead: true })",
    "POST(request: Request)",
    "requestHasSameOriginBoundary(request)",
    "invalid_json_body",
    "existing_current_working_writer_called: false",
    "existing_canonical_state_writer_called: false",
  ]) {
    assert.ok(source.route.includes(requiredText), `route must include ${requiredText}`);
  }
  assert.doesNotMatch(
    source.rollbackRoute,
    /allowOriginlessSameOriginRead/,
    "rollback POST route must stay strict",
  );

  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "writer compatibility path must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "writer compatibility path must not write non-target tables or delete rows",
  );

  for (const requiredText of [
    "/api/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility",
    "/api/research-candidate-review/manual-global-dogfood-perspective-state-application",
    "source_perspective_state_application_readback",
    "source_perspective_state_application_receipt_id",
    "source_perspective_state_application_record_fingerprint",
    "RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION",
    "RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION",
  ]) {
    assert.ok(source.writePanel.includes(requiredText), `write panel must include ${requiredText}`);
  }
  assert.match(source.contractPanel, /currentAcceptedReview/);
  assert.match(
    source.contractPanel,
    /source_handoff_seed_fingerprint ===[\s\S]*contract\.source_handoff_seed_fingerprint/,
  );
  assert.match(
    source.contractPanel,
    /source_result_text_fingerprint ===[\s\S]*contract\.source_result_text_fingerprint/,
  );
  assert.doesNotMatch(
    source.writePanel,
    /<button[^>]*>\s*(Create work item|Promote Perspective|Write Perspective Memory|Update current working Perspective|Mutate existing canonical Perspective state|Call existing writer)/i,
  );
  assert.ok(
    source.stateApplicationReadbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContractPanel",
    ),
    "state application readback panel must expose writer compatibility preview",
  );
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-writer-compatibility-write-v0-1"
    ],
    "package script must expose writer compatibility write smoke",
  );
}

function assertRuntimeWritePath() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema(db);
  ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema(db);
  insertStateApplicationSource(db, "one", "committed", 1);

  const sourceReadback = readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
    db,
    limit: 10,
  });
  const readyContract = buildContract(sourceReadback);
  assert.equal(
    readyContract.operator_authorization_mode,
    "ready_for_future_perspective_writer_compatibility_write_authorization",
  );
  const acceptedReview = buildAcceptedReview(readyContract);
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_perspective_state_application_receipt_id,
    readyContract.source_perspective_state_application_receipt_id,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_handoff_seed_fingerprint,
    readyContract.source_handoff_seed_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_result_text_fingerprint,
    readyContract.source_result_text_fingerprint,
  );

  const wrongConfirmation = writeWriterCompatibility(db, readyContract, acceptedReview, {
    confirmation: "wrong",
  });
  assert.equal(wrongConfirmation.ok, false);
  assert.ok(
    wrongConfirmation.refusal_reasons.includes("perspective_writer_compatibility_wrong_confirmation"),
  );

  const nonAcceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview({
      perspective_writer_compatibility_contract: readyContract,
      operator_decision: "defer_perspective_writer_compatibility_contract",
    });
  assert.equal(writeWriterCompatibility(db, readyContract, nonAcceptedReview).ok, false);

  const mismatchedReview = clone(acceptedReview);
  mismatchedReview.accepted_mapping_summary.source_result_text_fingerprint =
    "fnv1a32_canonical_json_v0_1:other-result";
  const mismatch = writeWriterCompatibility(db, readyContract, mismatchedReview);
  assert.equal(mismatch.ok, false);
  assert.ok(
    mismatch.refusal_reasons.includes("perspective_writer_compatibility_review_source_mismatch"),
  );

  const malformedContract = writeResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(
    {
      perspective_writer_compatibility_contract: {},
      perspective_writer_compatibility_review: acceptedReview,
      source_perspective_state_application_readback: sourceReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_writer_compatibility_write",
        operator_confirmation_text:
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
        write_mode: "commit",
      },
    },
    { db },
  );
  assert.equal(malformedContract.ok, false);
  assert.equal(malformedContract.result_status, "refused");
  assert.ok(
    malformedContract.validation.failure_codes.includes(
      "perspective_writer_compatibility_contract_shape_invalid",
    ),
  );
  assert.equal(malformedContract.idempotency_key, null);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts"), 0);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"), 0);

  const requestedMutation = writeWriterCompatibility(db, readyContract, acceptedReview, {
    requestedSideEffects: { call_existing_current_working_writer: true },
  });
  assert.equal(requestedMutation.ok, false);
  assert.ok(
    requestedMutation.refusal_reasons.includes(
      "perspective_writer_compatibility_requested_side_effects_refused",
    ),
  );

  const rawText = writeResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(
    {
      perspective_writer_compatibility_contract: readyContract,
      perspective_writer_compatibility_review: acceptedReview,
      source_perspective_state_application_readback: sourceReadback,
      raw_result_report_text: "must not persist",
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_writer_compatibility_write",
        operator_confirmation_text:
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
        write_mode: "commit",
      },
    },
    { db },
  );
  assert.equal(rawText.ok, false);
  assert.ok(rawText.refusal_reasons.includes("raw_text_fields_present"));

  const existingTargetContract = clone(readyContract);
  existingTargetContract.proposed_writer_compatibility_mapping.intended_future_writer_target =
    "existing_current_working_perspective_writer";
  const existingTarget = writeWriterCompatibility(
    db,
    existingTargetContract,
    acceptedReview,
  );
  assert.equal(existingTarget.ok, false);
  assert.ok(
    existingTarget.refusal_reasons.includes(
      "perspective_writer_compatibility_target_must_be_manual_specific",
    ),
  );

  const existingWriterClaimContract = clone(readyContract);
  existingWriterClaimContract.existing_current_working_writer_compatibility.existing_current_working_perspective_apply_write_compatible = true;
  const existingClaim = writeWriterCompatibility(
    db,
    existingWriterClaimContract,
    acceptedReview,
  );
  assert.equal(existingClaim.ok, false);
  assert.ok(
    existingClaim.refusal_reasons.includes(
      "perspective_writer_compatibility_existing_writer_claim_refused",
    ),
  );

  const forbiddenReadback = clone(sourceReadback);
  forbiddenReadback.current_working_perspective_updated = true;
  const forbiddenSourceReadback = writeWriterCompatibility(
    db,
    readyContract,
    acceptedReview,
    { sourceReadback: forbiddenReadback },
  );
  assert.equal(forbiddenSourceReadback.ok, false);
  assert.ok(
    forbiddenSourceReadback.refusal_reasons.includes(
      "perspective_writer_compatibility_source_readback_forbidden_mutation_flag",
    ),
  );

  const committed = writeWriterCompatibility(db, readyContract, acceptedReview);
  assert.equal(committed.ok, true);
  assert.equal(committed.result_status, "committed");
  assert.equal(committed.perspective_writer_compatibility_record_written, true);
  assert.equal(committed.existing_current_working_writer_called, false);
  assert.equal(committed.existing_canonical_state_writer_called, false);
  assert.equal(committed.current_working_perspective_updated, false);
  assert.equal(committed.existing_canonical_perspective_state_table_mutated, false);
  assert.equal(committed.perspective_promoted, false);
  assert.equal(committed.perspective_memory_written, false);
  assert.equal(committed.work_mutated, false);
  assert.equal(committed.proof_or_evidence_rows_written, false);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts"), 1);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"), 1);
  assert.equal(
    committed.receipt.source_perspective_state_application_receipt_id,
    readyContract.source_perspective_state_application_receipt_id,
  );
  assert.equal(
    committed.receipt.source_handoff_seed_fingerprint,
    readyContract.source_handoff_seed_fingerprint,
  );
  assert.equal(
    committed.receipt.source_result_text_fingerprint,
    readyContract.source_result_text_fingerprint,
  );
  assert.equal(
    committed.perspective_writer_compatibility_record.writer_compatibility_label,
    readyContract.proposed_writer_compatibility_mapping.writer_compatibility_label,
  );
  assert.equal(
    committed.perspective_writer_compatibility_record.state_application_label,
    readyContract.proposed_writer_compatibility_mapping.state_application_label,
  );
  assert.equal(
    committed.perspective_writer_compatibility_record.recommended_storage_path,
    "manual_specific_perspective_writer_compatibility_tables",
  );
  assert.equal(
    committed.perspective_writer_compatibility_record.expected_future_write_scope,
    "writer_compatibility_record_only",
  );

  const acceptedReviewWithLocalNote =
    buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview({
      perspective_writer_compatibility_contract: readyContract,
      operator_decision:
        "accept_contract_for_future_perspective_writer_compatibility_write_slice",
      operator_note: "local only and deliberately excluded from idempotency",
    });
  const duplicate = writeWriterCompatibility(
    db,
    readyContract,
    acceptedReviewWithLocalNote,
  );
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.result_status, "duplicate_replayed");
  assert.equal(duplicate.duplicate_replayed, true);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts"), 1);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"), 1);

  const wrongRollback = rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt(
    {
      receipt_id: committed.receipt.receipt_id,
      rollback_authorization: {
        authorization_kind:
          "manual_operator_authorized_perspective_writer_compatibility_rollback",
        operator_confirmation_text: "wrong",
        rollback_reason: "wrong confirmation must not rollback",
      },
    },
    { db },
  );
  assert.equal(wrongRollback.ok, false);

  const rollback = rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt(
    {
      receipt_id: committed.receipt.receipt_id,
      rollback_authorization: {
        authorization_kind:
          "manual_operator_authorized_perspective_writer_compatibility_rollback",
        operator_confirmation_text:
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION,
        rollback_reason: "Smoke rollback after commit.",
      },
    },
    { db },
  );
  assert.equal(rollback.ok, true);
  assert.equal(rollback.result_status, "rolled_back");
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"), 1);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks"), 1);
  const duplicateRollback = rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt(
    {
      receipt_id: committed.receipt.receipt_id,
      rollback_authorization: {
        authorization_kind:
          "manual_operator_authorized_perspective_writer_compatibility_rollback",
        operator_confirmation_text:
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION,
        rollback_reason: "Smoke rollback after commit.",
      },
    },
    { db },
  );
  assert.equal(duplicateRollback.ok, true);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks"), 1);

  insertStateApplicationSource(db, "two", "committed", 2);
  const secondContract = buildContract(
    readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
      db,
      limit: 10,
    }),
  );
  const secondReview = buildAcceptedReview(secondContract);
  const secondCommitted = writeWriterCompatibility(db, secondContract, secondReview);
  assert.equal(secondCommitted.ok, true);

  insertStateApplicationSource(db, "three", "committed", 3);
  const thirdContract = buildContract(
    readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
      db,
      limit: 10,
    }),
  );
  const thirdReview = buildAcceptedReview(thirdContract);
  const supersede = writeWriterCompatibility(db, thirdContract, thirdReview, {
    writeMode: "supersede_previous",
    supersedesReceiptId: secondCommitted.receipt.receipt_id,
  });
  assert.equal(supersede.ok, true);
  assert.equal(supersede.result_status, "committed");
  assert.equal(
    db
      .prepare(
        "SELECT write_status FROM research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts WHERE receipt_id = ?",
      )
      .get(secondCommitted.receipt.receipt_id).write_status,
    "superseded",
  );

  const activeReadback =
    readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
      db,
      limit: 10,
    });
  assert.equal(
    activeReadback.latest_active_committed.receipt.receipt_id,
    supersede.receipt.receipt_id,
  );
  assert.equal(activeReadback.existing_current_working_writer_called, false);
  assert.equal(activeReadback.existing_canonical_state_writer_called, false);
  assert.equal(activeReadback.current_working_perspective_updated, false);
  assert.equal(activeReadback.existing_canonical_perspective_state_table_mutated, false);
  assert.equal(activeReadback.perspective_promoted, false);
  assert.equal(activeReadback.perspective_memory_written, false);
  assert.equal(activeReadback.work_mutated, false);
  assert.equal(activeReadback.proof_or_evidence_rows_written, false);
  assert.equal(activeReadback.dogfood_metrics_written, false);
  assert.equal(activeReadback.product_write_executed, false);

  const staleContract = buildContract(sourceReadback);
  db.prepare(
    "UPDATE research_candidate_manual_global_dogfood_perspective_state_application_receipts SET write_status = 'rolled_back' WHERE receipt_id = ?",
  ).run("state-application-receipt-one");
  const staleWrite = writeWriterCompatibility(
    db,
    staleContract,
    buildAcceptedReview(staleContract),
  );
  assert.equal(staleWrite.ok, false);
  assert.ok(
    staleWrite.refusal_reasons.includes(
      "perspective_writer_compatibility_source_state_application_receipt_not_active_committed",
    ),
  );

  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_state_application_receipts"), 3);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_state_application_records"), 3);
}

function assertDocsAndPackage() {
  assert.ok(
    source.docs.includes("manual-specific Perspective writer compatibility table family"),
    "docs must mention manual-specific writer compatibility storage",
  );
  assert.ok(
    source.docs.includes("Perspective writer compatibility record"),
    "docs must mention Perspective writer compatibility record write",
  );
}

function buildContract(readback) {
  return buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract({
    readback,
    operator_intent_label:
      "smoke_research_candidate_manual_global_dogfood_perspective_writer_compatibility_write_v0_1",
  });
}

function buildAcceptedReview(contract) {
  return buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview({
    perspective_writer_compatibility_contract: contract,
    operator_decision:
      "accept_contract_for_future_perspective_writer_compatibility_write_slice",
  });
}

function writeWriterCompatibility(db, contract, review, options = {}) {
  return writeResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(
    {
      perspective_writer_compatibility_contract: contract,
      perspective_writer_compatibility_review: review,
      source_perspective_state_application_readback:
        options.sourceReadback ??
        readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
          db,
          limit: 10,
        }),
      operator_authorization: {
        authorization_kind:
          "manual_operator_authorized_perspective_writer_compatibility_write",
        operator_confirmation_text:
          options.confirmation ??
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
        write_mode: options.writeMode ?? "commit",
        supersedes_receipt_id: options.supersedesReceiptId ?? null,
      },
      requested_side_effects: options.requestedSideEffects,
    },
    { db },
  );
}

function insertStateApplicationSource(db, suffix, writeStatus, index) {
  const params = sourceParams(suffix, writeStatus, index);
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_state_application_receipts (
        receipt_id,
        created_at,
        scope,
        source_perspective_state_application_contract_fingerprint,
        source_perspective_state_application_review_fingerprint,
        source_perspective_adapter_receipt_id,
        source_perspective_adapter_record_id,
        source_perspective_adapter_record_fingerprint,
        source_perspective_state_mutation_receipt_id,
        source_perspective_state_mutation_record_id,
        source_perspective_state_mutation_record_fingerprint,
        source_perspective_apply_receipt_id,
        source_perspective_apply_record_id,
        source_perspective_apply_record_fingerprint,
        source_canonical_perspective_update_receipt_id,
        source_canonical_perspective_update_record_id,
        source_canonical_perspective_update_record_fingerprint,
        source_perspective_relay_receipt_id,
        source_perspective_relay_record_id,
        source_perspective_relay_record_fingerprint,
        source_next_work_signal_receipt_id,
        source_next_work_signal_record_id,
        source_next_work_signal_record_fingerprint,
        source_next_work_bias_receipt_id,
        source_next_work_bias_record_id,
        source_next_work_bias_record_fingerprint,
        source_projection_fingerprint,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_metric_snapshot_receipt_id,
        source_metric_snapshot_record_id,
        source_manual_receipt_id,
        source_handoff_seed_fingerprint,
        source_result_text_fingerprint,
        source_expected_observed_delta_record_ref,
        source_reuse_outcome_record_ref,
        idempotency_key,
        write_status,
        authority_profile,
        receipt_fingerprint,
        supersedes_receipt_id,
        rollback_of_receipt_id,
        rollback_reason
      ) VALUES (
        @receipt_id,
        @created_at,
        'project:augnes',
        @contract_fp,
        @review_fp,
        @adapter_receipt_id,
        @adapter_record_id,
        @adapter_record_fp,
        @state_mutation_receipt_id,
        @state_mutation_record_id,
        @state_mutation_record_fp,
        @apply_receipt_id,
        @apply_record_id,
        @apply_record_fp,
        @canonical_receipt_id,
        @canonical_record_id,
        @canonical_record_fp,
        @relay_receipt_id,
        @relay_record_id,
        @relay_record_fp,
        @signal_receipt_id,
        @signal_record_id,
        @signal_record_fp,
        @bias_receipt_id,
        @bias_record_id,
        @bias_record_fp,
        @projection_fp,
        @ledger_receipt_id,
        @ledger_record_id,
        @metric_receipt_id,
        @metric_record_id,
        @manual_receipt_id,
        @handoff_seed_fp,
        @result_text_fp,
        @eod_ref,
        @reuse_ref,
        @idempotency_key,
        @write_status,
        'manual_global_dogfood_perspective_state_application_write_v0_1',
        @receipt_fp,
        NULL,
        NULL,
        NULL
      )
    `,
  ).run(params);

  if (writeStatus !== "rolled_back") {
    db.prepare(
      `
        INSERT INTO research_candidate_manual_global_dogfood_perspective_state_application_records (
          perspective_state_application_record_id,
          receipt_id,
          created_at,
          scope,
          source_perspective_adapter_receipt_id,
          source_perspective_adapter_record_id,
          source_perspective_state_mutation_receipt_id,
          source_perspective_state_mutation_record_id,
          source_perspective_apply_receipt_id,
          source_perspective_apply_record_id,
          source_canonical_perspective_update_receipt_id,
          source_canonical_perspective_update_record_id,
          source_perspective_relay_receipt_id,
          source_perspective_relay_record_id,
          source_next_work_signal_receipt_id,
          source_next_work_signal_record_id,
          source_next_work_bias_receipt_id,
          source_next_work_bias_record_id,
          source_projection_fingerprint,
          source_global_dogfood_ledger_receipt_id,
          source_global_dogfood_ledger_record_id,
          source_metric_snapshot_receipt_id,
          source_metric_snapshot_record_id,
          state_application_label,
          state_application_rationale,
          adapter_label,
          adapter_rationale,
          mutation_label,
          mutation_rationale,
          apply_label,
          apply_rationale,
          canonical_update_label,
          canonical_update_rationale,
          relay_update_label,
          relay_update_rationale,
          recommended_next_work_label,
          outcome_label,
          outcome_signal,
          intended_future_state_application_target,
          default_future_state_application_target,
          state_application_scope_hint,
          state_application_strength_hint,
          expected_future_write_scope,
          recommended_storage_path,
          expected_summary,
          observed_summary,
          mismatch_or_gap_summary,
          selected_candidate_context_refs_json,
          source_next_work_candidate_card_ids_json,
          manual_only_context_refs_json,
          source_line,
          blockers_json,
          warnings_json,
          compatibility_findings_json,
          existing_current_working_application_compatibility_json,
          existing_canonical_state_application_compatibility_json,
          manual_state_application_write_path_json,
          source_refs_json,
          authority_profile,
          perspective_state_application_record_fingerprint
        ) VALUES (
          @record_id,
          @receipt_id,
          @created_at,
          'project:augnes',
          @adapter_receipt_id,
          @adapter_record_id,
          @state_mutation_receipt_id,
          @state_mutation_record_id,
          @apply_receipt_id,
          @apply_record_id,
          @canonical_receipt_id,
          @canonical_record_id,
          @relay_receipt_id,
          @relay_record_id,
          @signal_receipt_id,
          @signal_record_id,
          @bias_receipt_id,
          @bias_record_id,
          @projection_fp,
          @ledger_receipt_id,
          @ledger_record_id,
          @metric_receipt_id,
          @metric_record_id,
          @state_application_label,
          @state_application_rationale,
          @adapter_label,
          @adapter_rationale,
          @mutation_label,
          @mutation_rationale,
          @apply_label,
          @apply_rationale,
          @canonical_update_label,
          @canonical_update_rationale,
          @relay_update_label,
          @relay_update_rationale,
          @recommended_next_work_label,
          @outcome_label,
          'positive',
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_existing_canonical_state_application_adapter',
          'medium',
          'state_application_record_only',
          'manual_specific_perspective_state_application_tables',
          @expected_summary,
          @observed_summary,
          @mismatch_summary,
          @selected_refs_json,
          @candidate_card_ids_json,
          @manual_refs_json,
          @source_line,
          '[]',
          '["warning-one"]',
          '["finding-one"]',
          '{"compatible":false}',
          '{"compatible":false}',
          '{"recommended_storage_path":"manual_specific_perspective_state_application_tables"}',
          '["source-ref-one"]',
          'manual_global_dogfood_perspective_state_application_write_v0_1',
          @record_fp
        )
      `,
    ).run(params);
  }
}

function sourceParams(suffix, writeStatus, index) {
  return {
    receipt_id: `state-application-receipt-${suffix}`,
    record_id: `state-application-record-${suffix}`,
    created_at: `2026-07-08T00:00:0${index}.000Z`,
    contract_fp: `state-application-contract-fp-${suffix}`,
    review_fp: `state-application-review-fp-${suffix}`,
    adapter_receipt_id: `adapter-receipt-${suffix}`,
    adapter_record_id: `adapter-record-${suffix}`,
    adapter_record_fp: `adapter-record-fp-${suffix}`,
    state_mutation_receipt_id: `state-mutation-receipt-${suffix}`,
    state_mutation_record_id: `state-mutation-record-${suffix}`,
    state_mutation_record_fp: `state-mutation-record-fp-${suffix}`,
    apply_receipt_id: `apply-receipt-${suffix}`,
    apply_record_id: `apply-record-${suffix}`,
    apply_record_fp: `apply-record-fp-${suffix}`,
    canonical_receipt_id: `canonical-update-receipt-${suffix}`,
    canonical_record_id: `canonical-update-record-${suffix}`,
    canonical_record_fp: `canonical-update-record-fp-${suffix}`,
    relay_receipt_id: `relay-receipt-${suffix}`,
    relay_record_id: `relay-record-${suffix}`,
    relay_record_fp: `relay-record-fp-${suffix}`,
    signal_receipt_id: `signal-receipt-${suffix}`,
    signal_record_id: `signal-record-${suffix}`,
    signal_record_fp: `signal-record-fp-${suffix}`,
    bias_receipt_id: `bias-receipt-${suffix}`,
    bias_record_id: `bias-record-${suffix}`,
    bias_record_fp: `bias-record-fp-${suffix}`,
    projection_fp: `projection-fp-${suffix}`,
    ledger_receipt_id: `ledger-receipt-${suffix}`,
    ledger_record_id: `ledger-record-${suffix}`,
    metric_receipt_id: `metric-receipt-${suffix}`,
    metric_record_id: `metric-record-${suffix}`,
    manual_receipt_id: `manual-receipt-${suffix}`,
    handoff_seed_fp: `handoff-seed-fp-${suffix}`,
    result_text_fp: `result-text-fp-${suffix}`,
    eod_ref: `expected-observed-delta:${suffix}`,
    reuse_ref: `reuse-outcome:${suffix}`,
    idempotency_key: `state-application-idempotency-${suffix}`,
    write_status: writeStatus,
    receipt_fp: `state-application-receipt-fp-${suffix}`,
    record_fp: `state-application-record-fp-${suffix}`,
    state_application_label: `State application label ${suffix}`,
    state_application_rationale: `State application rationale ${suffix}`,
    adapter_label: `Adapter label ${suffix}`,
    adapter_rationale: `Adapter rationale ${suffix}`,
    mutation_label: `Mutation label ${suffix}`,
    mutation_rationale: `Mutation rationale ${suffix}`,
    apply_label: `Apply label ${suffix}`,
    apply_rationale: `Apply rationale ${suffix}`,
    canonical_update_label: `Canonical update label ${suffix}`,
    canonical_update_rationale: `Canonical update rationale ${suffix}`,
    relay_update_label: `Relay update label ${suffix}`,
    relay_update_rationale: `Relay update rationale ${suffix}`,
    recommended_next_work_label: `Recommended next work ${suffix}`,
    outcome_label: `Outcome label ${suffix}`,
    expected_summary: `Expected summary ${suffix}`,
    observed_summary: `Observed summary ${suffix}`,
    mismatch_summary: `Mismatch summary ${suffix}`,
    selected_refs_json: JSON.stringify([`selected-context-${suffix}`]),
    candidate_card_ids_json: JSON.stringify([`candidate-card-${suffix}`]),
    manual_refs_json: JSON.stringify([`manual-context-${suffix}`]),
    source_line: `source line ${suffix}`,
  };
}

function tableExists(db, tableName) {
  const row = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  return row.count > 0;
}

function countRows(db, tableName) {
  if (!tableExists(db, tableName)) return 0;
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
