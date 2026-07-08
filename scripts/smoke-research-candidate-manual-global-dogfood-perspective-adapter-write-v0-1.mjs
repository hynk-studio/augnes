#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-adapter-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-adapter-review.ts";
import {
  rollbackResearchCandidateManualGlobalDogfoodPerspectiveAdapterReceipt,
  writeResearchCandidateManualGlobalDogfoodPerspectiveAdapter,
} from "../lib/research-candidate-review/manual-global-dogfood-perspective-adapter-write.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveAdapterSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveAdapter,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-adapter.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateMutationSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-state-mutation.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION,
} from "../types/research-candidate-manual-global-dogfood-perspective-adapter-write.ts";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-perspective-adapter-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-perspective-adapter-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-perspective-adapter.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-adapter/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-adapter/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-perspective-adapter-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-adapter-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-perspective-adapter-contract-panel.tsx",
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
        "research-candidate-manual-global-dogfood-perspective-adapter-write-v0-1",
      pass: true,
      storage_path: "manual_specific_perspective_adapter_tables",
      source_perspective_state_mutation_revalidated: true,
      handoff_result_fingerprint_binding_checked: true,
      rejection_cases_checked: true,
      commit_checked: true,
      duplicate_replay_checked: true,
      rollback_checked: true,
      supersede_checked: true,
      non_target_table_counts_checked: true,
      no_raw_text_or_operator_note_persistence_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "I authorize writing this manual global dogfood Perspective adapter candidate to a Perspective adapter record",
    "I authorize rolling back this manual global dogfood Perspective adapter receipt",
    "manual_operator_authorized_perspective_adapter_write",
    "manual_operator_authorized_perspective_adapter_rollback",
    "can_write_perspective_adapter_record: true",
    "can_write_perspective_adapter_receipt: true",
    "can_write_perspective_adapter_rollback_metadata: true",
    "can_update_current_working_perspective: false",
    "can_write_existing_canonical_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_perspective_state_mutation_record: false",
    "can_mutate_perspective_apply_record: false",
    "can_write_work_item: false",
    "can_mutate_work: false",
    "can_write_dogfood_metrics: false",
    "can_write_proof_or_evidence: false",
    "persists_raw_manual_note_text: false",
    "persists_raw_result_report_text: false",
    "persists_operator_notes: false",
  ]) {
    assert.ok(source.type.includes(requiredText), `type must include ${requiredText}`);
  }

  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_adapter_receipts",
    "research_candidate_manual_global_dogfood_perspective_adapter_records",
    "research_candidate_manual_global_dogfood_perspective_adapter_rollbacks",
    "source_perspective_adapter_contract_fingerprint TEXT NOT NULL",
    "source_perspective_adapter_review_fingerprint TEXT NOT NULL",
    "source_perspective_state_mutation_receipt_id TEXT NOT NULL",
    "source_perspective_state_mutation_record_id TEXT NOT NULL",
    "source_perspective_state_mutation_record_fingerprint TEXT NOT NULL",
    "source_handoff_seed_fingerprint TEXT NOT NULL",
    "source_result_text_fingerprint TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "adapter_label TEXT NOT NULL",
    "adapter_rationale TEXT NOT NULL",
    "mutation_label TEXT NOT NULL",
    "mutation_rationale TEXT NOT NULL",
    "recommended_storage_path TEXT NOT NULL",
    "expected_future_write_scope TEXT NOT NULL",
    "existing_current_working_adapter_compatibility_json TEXT NOT NULL",
    "existing_canonical_state_adapter_compatibility_json TEXT NOT NULL",
    "manual_adapter_write_path_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapterTables",
    ),
    "lib/db.ts must migrate manual Perspective adapter tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapter",
    ),
    "db-migrations must expose manual Perspective adapter migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodPerspectiveAdapterResult",
    ),
    "db-migrate must run manual Perspective adapter migration",
  );

  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /validateSourcesForRequest/,
    "writer must revalidate source Perspective state mutation inside the transaction",
  );
  for (const requiredText of [
    "perspective_adapter_source_state_mutation_receipt_not_active_committed",
    "perspective_adapter_source_state_mutation_record_mismatch",
    "perspective_adapter_source_readback_forbidden_mutation_flag",
    "perspective_adapter_target_must_be_manual_specific",
    "perspective_adapter_storage_path_must_be_manual_specific",
    "perspective_adapter_future_write_scope_must_be_adapter_record_only",
    "source_handoff_seed_fingerprint_missing",
    "source_result_text_fingerprint_missing",
    "summary.source_handoff_seed_fingerprint",
    "summary.source_result_text_fingerprint",
  ]) {
    assert.ok(source.writer.includes(requiredText), `writer must include ${requiredText}`);
  }

  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computePerspectiveAdapterIdempotencyKey"),
    source.writer.indexOf("function writerAuthorityBoundaryIsNarrow"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note material",
  );
  assert.match(
    idempotencySlice,
    /source_handoff_seed_fingerprint/,
    "idempotency must include source handoff seed fingerprint",
  );
  assert.match(
    idempotencySlice,
    /source_result_text_fingerprint/,
    "idempotency must include source result text fingerprint",
  );

  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual Perspective adapter writer/readback must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "Perspective adapter write path must not write non-target tables or delete rows",
  );

  for (const requiredText of [
    "/api/research-candidate-review/manual-global-dogfood-perspective-adapter",
    "/api/research-candidate-review/manual-global-dogfood-perspective-state-mutation",
    "source_perspective_state_mutation_readback: sourcePerspectiveStateMutationReadback",
    "RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION",
    "RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
  ]) {
    assert.ok(source.writePanel.includes(requiredText), `write panel must include ${requiredText}`);
  }
  assert.match(
    source.contractPanel,
    /currentAcceptedReview/,
    "contract panel must derive a current accepted review gate",
  );
  assert.match(
    source.contractPanel,
    /source_handoff_seed_fingerprint ===[\s\S]*contract\.source_handoff_seed_fingerprint/,
    "contract panel write gate must bind handoff fingerprint",
  );
  assert.match(
    source.contractPanel,
    /source_result_text_fingerprint ===[\s\S]*contract\.source_result_text_fingerprint/,
    "contract panel write gate must bind result fingerprint",
  );
  assert.doesNotMatch(
    source.writePanel,
    /<button[^>]*>\s*(Create work item|Promote Perspective|Write Perspective Memory|Update current working Perspective|Mutate existing canonical Perspective state)/i,
    "write panel must not expose forbidden controls",
  );

  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-adapter-write-v0-1"
    ],
    "package script must expose adapter write smoke",
  );
}

function assertRuntimeWritePath() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateMutationSchema(db);
  ensureResearchCandidateManualGlobalDogfoodPerspectiveAdapterSchema(db);
  insertPerspectiveStateMutationSource(db, "one", "committed", 1);

  const sourceReadback =
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db,
      limit: 10,
    });
  const readyContract = buildContract(sourceReadback);
  assert.equal(
    readyContract.operator_authorization_mode,
    "ready_for_future_perspective_adapter_write_authorization",
  );
  const acceptedReview = buildAcceptedReview(readyContract);
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_handoff_seed_fingerprint,
    readyContract.source_handoff_seed_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_result_text_fingerprint,
    readyContract.source_result_text_fingerprint,
  );

  const wrongConfirmation = writeAdapter(db, readyContract, acceptedReview, {
    confirmation: "wrong",
  });
  assert.equal(wrongConfirmation.ok, false);
  assert.ok(
    wrongConfirmation.refusal_reasons.includes("perspective_adapter_wrong_confirmation"),
  );

  const nonAcceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: readyContract,
      operator_decision: "defer_perspective_adapter_contract",
    });
  const nonAccepted = writeAdapter(db, readyContract, nonAcceptedReview);
  assert.equal(nonAccepted.ok, false);

  const mismatchedReview = structuredClone(acceptedReview);
  mismatchedReview.accepted_mapping_summary.source_handoff_seed_fingerprint =
    "fnv1a32_canonical_json_v0_1:other-handoff";
  const mismatch = writeAdapter(db, readyContract, mismatchedReview);
  assert.equal(mismatch.ok, false);
  assert.ok(
    mismatch.refusal_reasons.includes("perspective_adapter_review_source_mismatch"),
  );

  const committed = writeAdapter(db, readyContract, acceptedReview);
  assert.equal(committed.ok, true);
  assert.equal(committed.result_status, "committed");
  assert.equal(committed.duplicate_replayed, false);
  assert.equal(committed.perspective_adapter_record_written, true);
  assert.equal(committed.current_working_perspective_updated, false);
  assert.equal(committed.existing_canonical_perspective_state_table_mutated, false);
  assert.equal(committed.perspective_promoted, false);
  assert.equal(committed.perspective_memory_written, false);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_receipts"), 1);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_records"), 1);
  assert.equal(
    committed.receipt.source_handoff_seed_fingerprint,
    readyContract.source_handoff_seed_fingerprint,
  );
  assert.equal(
    committed.receipt.source_result_text_fingerprint,
    readyContract.source_result_text_fingerprint,
  );
  assert.equal(
    committed.perspective_adapter_record.adapter_label,
    readyContract.proposed_adapter_mapping.adapter_label,
  );
  assert.equal(
    committed.perspective_adapter_record.recommended_storage_path,
    "manual_specific_perspective_adapter_tables",
  );
  assert.equal(
    committed.perspective_adapter_record.expected_future_write_scope,
    "adapter_record_only",
  );

  const acceptedReviewWithLocalNote =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: readyContract,
      operator_decision:
        "accept_contract_for_future_perspective_adapter_write_slice",
      operator_note: "local only and deliberately excluded from idempotency",
    });
  const duplicate = writeAdapter(db, readyContract, acceptedReviewWithLocalNote);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.result_status, "duplicate_replayed");
  assert.equal(duplicate.duplicate_replayed, true);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_receipts"), 1);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_records"), 1);

  const wrongRollback =
    rollbackResearchCandidateManualGlobalDogfoodPerspectiveAdapterReceipt(
      {
        receipt_id: committed.receipt.receipt_id,
        rollback_authorization: {
          authorization_kind: "manual_operator_authorized_perspective_adapter_rollback",
          operator_confirmation_text: "wrong",
          rollback_reason: "wrong confirmation must not rollback",
        },
      },
      { db },
    );
  assert.equal(wrongRollback.ok, false);

  const rollback =
    rollbackResearchCandidateManualGlobalDogfoodPerspectiveAdapterReceipt(
      {
        receipt_id: committed.receipt.receipt_id,
        rollback_authorization: {
          authorization_kind: "manual_operator_authorized_perspective_adapter_rollback",
          operator_confirmation_text:
            RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION,
          rollback_reason: "Smoke rollback after commit.",
        },
      },
      { db },
    );
  assert.equal(rollback.ok, true);
  assert.equal(rollback.result_status, "rolled_back");
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_records"), 1);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_rollbacks"), 1);
  const duplicateRollback =
    rollbackResearchCandidateManualGlobalDogfoodPerspectiveAdapterReceipt(
      {
        receipt_id: committed.receipt.receipt_id,
        rollback_authorization: {
          authorization_kind: "manual_operator_authorized_perspective_adapter_rollback",
          operator_confirmation_text:
            RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION,
          rollback_reason: "Smoke rollback after commit.",
        },
      },
      { db },
    );
  assert.equal(duplicateRollback.ok, true);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_rollbacks"), 1);

  insertPerspectiveStateMutationSource(db, "two", "committed", 2);
  const secondReadback =
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db,
      limit: 10,
    });
  const secondContract = buildContract(secondReadback);
  const secondReview = buildAcceptedReview(secondContract);
  const secondCommitted = writeAdapter(db, secondContract, secondReview);
  assert.equal(secondCommitted.ok, true);
  assert.equal(secondCommitted.result_status, "committed");

  insertPerspectiveStateMutationSource(db, "three", "committed", 3);
  const thirdContract = buildContract(
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db,
      limit: 10,
    }),
  );
  const thirdReview = buildAcceptedReview(thirdContract);
  const supersede = writeAdapter(db, thirdContract, thirdReview, {
    writeMode: "supersede_previous",
    supersedesReceiptId: secondCommitted.receipt.receipt_id,
  });
  assert.equal(supersede.ok, true);
  assert.equal(supersede.result_status, "committed");
  const supersededReceipt = db
    .prepare(
      "SELECT write_status FROM research_candidate_manual_global_dogfood_perspective_adapter_receipts WHERE receipt_id = ?",
    )
    .get(secondCommitted.receipt.receipt_id);
  assert.equal(supersededReceipt.write_status, "superseded");

  const activeReadback =
    readResearchCandidateManualGlobalDogfoodPerspectiveAdapter({ db, limit: 10 });
  assert.equal(
    activeReadback.latest_active_committed.receipt.receipt_id,
    supersede.receipt.receipt_id,
  );
  assert.equal(activeReadback.current_working_perspective_updated, false);
  assert.equal(activeReadback.existing_canonical_perspective_state_table_mutated, false);
  assert.equal(activeReadback.perspective_promoted, false);
  assert.equal(activeReadback.perspective_memory_written, false);
  assert.equal(activeReadback.work_mutated, false);
  assert.equal(activeReadback.proof_or_evidence_rows_written, false);
  assert.equal(activeReadback.dogfood_metrics_written, false);
  assert.equal(activeReadback.product_write_executed, false);

  const rolledBackSourceDb = new Database(":memory:");
  rolledBackSourceDb.pragma("foreign_keys = ON");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateMutationSchema(
    rolledBackSourceDb,
  );
  ensureResearchCandidateManualGlobalDogfoodPerspectiveAdapterSchema(
    rolledBackSourceDb,
  );
  insertPerspectiveStateMutationSource(rolledBackSourceDb, "rolled", "rolled_back", 1);
  const blockedContract = buildContract(
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db: rolledBackSourceDb,
      limit: 10,
    }),
  );
  const blockedReview = buildAcceptedReview(blockedContract);
  const blockedWrite = writeAdapter(
    rolledBackSourceDb,
    blockedContract,
    blockedReview,
  );
  assert.equal(blockedWrite.ok, false);

  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts"), 3);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_state_mutation_records"), 3);
  assert.equal(countRows(db, "research_candidate_manual_global_dogfood_perspective_adapter_records") >= 3, true);
}

function assertDocsAndPackage() {
  assert.ok(
    source.docs.includes("manual-specific Perspective adapter table family"),
    "docs must mention manual-specific adapter storage",
  );
  assert.ok(
    source.docs.includes("Perspective adapter record"),
    "docs must mention Perspective adapter record write",
  );
}

function buildContract(readback) {
  return buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract({
    readback,
    operator_intent_label:
      "smoke_research_candidate_manual_global_dogfood_perspective_adapter_write_v0_1",
  });
}

function buildAcceptedReview(contract) {
  return buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
    perspective_adapter_contract: contract,
    operator_decision: "accept_contract_for_future_perspective_adapter_write_slice",
  });
}

function writeAdapter(db, contract, review, options = {}) {
  return writeResearchCandidateManualGlobalDogfoodPerspectiveAdapter(
    {
      perspective_adapter_contract: contract,
      perspective_adapter_review: review,
      source_perspective_state_mutation_readback:
        readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
          db,
          limit: 10,
        }),
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_adapter_write",
        operator_confirmation_text:
          options.confirmation ??
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION,
        write_mode: options.writeMode ?? "commit",
        supersedes_receipt_id: options.supersedesReceiptId ?? null,
      },
    },
    { db },
  );
}

function insertPerspectiveStateMutationSource(db, tag, status, sortIndex) {
  const suffix = `-${tag}`;
  const receipt = {
    receipt_id: `manual-state-mutation-receipt${suffix}`,
    created_at: `2026-07-08T00:00:0${sortIndex}.000Z`,
    scope: "project:augnes",
    source_perspective_state_mutation_contract_fingerprint:
      `fnv1a32_canonical_json_v0_1:state-contract${suffix}`,
    source_perspective_state_mutation_review_fingerprint:
      `fnv1a32_canonical_json_v0_1:state-review${suffix}`,
    source_perspective_apply_receipt_id: `manual-apply-receipt${suffix}`,
    source_perspective_apply_record_id: `manual-apply-record${suffix}`,
    source_perspective_apply_record_fingerprint:
      `fnv1a32_canonical_json_v0_1:apply-record${suffix}`,
    source_canonical_perspective_update_receipt_id:
      `manual-canonical-update-receipt${suffix}`,
    source_canonical_perspective_update_record_id:
      `manual-canonical-update-record${suffix}`,
    source_canonical_perspective_update_record_fingerprint:
      `fnv1a32_canonical_json_v0_1:canonical-update-record${suffix}`,
    source_perspective_relay_receipt_id: `manual-relay-receipt${suffix}`,
    source_perspective_relay_record_id: `manual-relay-record${suffix}`,
    source_perspective_relay_record_fingerprint:
      `fnv1a32_canonical_json_v0_1:relay-record${suffix}`,
    source_next_work_signal_receipt_id: `manual-signal-receipt${suffix}`,
    source_next_work_signal_record_id: `manual-signal-record${suffix}`,
    source_next_work_signal_record_fingerprint:
      `fnv1a32_canonical_json_v0_1:signal-record${suffix}`,
    source_next_work_bias_receipt_id: `manual-bias-receipt${suffix}`,
    source_next_work_bias_record_id: `manual-bias-record${suffix}`,
    source_next_work_bias_record_fingerprint:
      `fnv1a32_canonical_json_v0_1:bias-record${suffix}`,
    source_projection_fingerprint:
      `fnv1a32_canonical_json_v0_1:projection${suffix}`,
    source_global_dogfood_ledger_receipt_id: `manual-ledger-receipt${suffix}`,
    source_global_dogfood_ledger_record_id: `manual-ledger-record${suffix}`,
    source_metric_snapshot_receipt_id: `manual-metric-receipt${suffix}`,
    source_metric_snapshot_record_id: `manual-metric-record${suffix}`,
    source_manual_receipt_id: `manual-result-receipt${suffix}`,
    source_handoff_seed_fingerprint:
      `fnv1a32_canonical_json_v0_1:handoff-seed${suffix}`,
    source_result_text_fingerprint:
      `fnv1a32_canonical_json_v0_1:result-text${suffix}`,
    source_expected_observed_delta_record_ref: `eod:manual-record${suffix}`,
    source_reuse_outcome_record_ref: `reuse:manual-record${suffix}`,
    idempotency_key: `state-mutation-idempotency${suffix}`,
    write_status: status,
    authority_profile:
      "manual_global_dogfood_perspective_state_mutation_record_metadata_only",
    receipt_fingerprint: `fnv1a32_canonical_json_v0_1:state-receipt${suffix}`,
    supersedes_receipt_id: null,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_state_mutation_receipts (
        receipt_id,
        created_at,
        scope,
        source_perspective_state_mutation_contract_fingerprint,
        source_perspective_state_mutation_review_fingerprint,
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
      )
      VALUES (
        @receipt_id,
        @created_at,
        @scope,
        @source_perspective_state_mutation_contract_fingerprint,
        @source_perspective_state_mutation_review_fingerprint,
        @source_perspective_apply_receipt_id,
        @source_perspective_apply_record_id,
        @source_perspective_apply_record_fingerprint,
        @source_canonical_perspective_update_receipt_id,
        @source_canonical_perspective_update_record_id,
        @source_canonical_perspective_update_record_fingerprint,
        @source_perspective_relay_receipt_id,
        @source_perspective_relay_record_id,
        @source_perspective_relay_record_fingerprint,
        @source_next_work_signal_receipt_id,
        @source_next_work_signal_record_id,
        @source_next_work_signal_record_fingerprint,
        @source_next_work_bias_receipt_id,
        @source_next_work_bias_record_id,
        @source_next_work_bias_record_fingerprint,
        @source_projection_fingerprint,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_metric_snapshot_receipt_id,
        @source_metric_snapshot_record_id,
        @source_manual_receipt_id,
        @source_handoff_seed_fingerprint,
        @source_result_text_fingerprint,
        @source_expected_observed_delta_record_ref,
        @source_reuse_outcome_record_ref,
        @idempotency_key,
        @write_status,
        @authority_profile,
        @receipt_fingerprint,
        @supersedes_receipt_id,
        @rollback_of_receipt_id,
        @rollback_reason
      )
    `,
  ).run(receipt);

  const record = {
    perspective_state_mutation_record_id: `manual-state-mutation-record${suffix}`,
    receipt_id: receipt.receipt_id,
    created_at: receipt.created_at,
    scope: receipt.scope,
    source_perspective_apply_receipt_id:
      receipt.source_perspective_apply_receipt_id,
    source_perspective_apply_record_id:
      receipt.source_perspective_apply_record_id,
    source_canonical_perspective_update_receipt_id:
      receipt.source_canonical_perspective_update_receipt_id,
    source_canonical_perspective_update_record_id:
      receipt.source_canonical_perspective_update_record_id,
    source_perspective_relay_receipt_id:
      receipt.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id:
      receipt.source_perspective_relay_record_id,
    source_next_work_signal_receipt_id:
      receipt.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id:
      receipt.source_next_work_signal_record_id,
    source_next_work_bias_receipt_id:
      receipt.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id:
      receipt.source_next_work_bias_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id:
      receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    mutation_label: `Manual canonical state mutation candidate${suffix}`,
    mutation_rationale:
      "The manual dogfood source chain observed a durable mismatch that should be mapped into future adapter review without fabricated lineage.",
    apply_label: `Manual Perspective apply candidate${suffix}`,
    apply_rationale:
      "The prior apply record preserved the canonical update material for later explicit authorization.",
    canonical_update_label: `Manual canonical Perspective update${suffix}`,
    canonical_update_rationale:
      "The manual relay readback showed a stable expected-observed gap worth tracking.",
    relay_update_label: `Manual Perspective relay update${suffix}`,
    relay_update_rationale:
      "The relay summarized the manual dogfood source chain without source mutation.",
    recommended_next_work_label: "Prepare adapter mapping",
    outcome_label: "manual dogfood gap remains useful",
    outcome_signal: "positive",
    intended_future_mutation_target: "canonical_perspective_state",
    mutation_scope_hint: "canonical_perspective_state",
    mutation_strength_hint: "medium",
    intended_future_apply_target: "canonical_perspective_state",
    apply_scope_hint: "canonical_perspective_state",
    apply_strength_hint: "medium",
    expected_summary: "Expected the manual dogfood flow to expose source-chain gaps.",
    observed_summary: "Observed a stable source-chain gap suitable for adapter review.",
    mismatch_or_gap_summary:
      "The manual chain needs a future adapter before any current-working or canonical state writer can be used.",
    selected_candidate_context_refs_json: JSON.stringify([
      `candidate-context:manual${suffix}`,
    ]),
    source_next_work_candidate_card_ids_json: JSON.stringify([
      `candidate-card:manual${suffix}`,
    ]),
    manual_only_context_refs_json: JSON.stringify([`manual-context:relay${suffix}`]),
    source_line: `Manual global dogfood source line${suffix}`,
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify(["manual_only_context_preserved"]),
    compatibility_findings_json: JSON.stringify([
      "existing_current_working_adapter_lineage_gap",
      "existing_canonical_state_adapter_lineage_gap",
    ]),
    existing_state_apply_compatibility_json: JSON.stringify({
      recommended_future_mapping_path:
        "manual_specific_state_mutation_write_contract",
    }),
    source_refs_json: JSON.stringify([
      receipt.source_perspective_apply_receipt_id,
      receipt.source_canonical_perspective_update_receipt_id,
      receipt.source_perspective_relay_receipt_id,
      receipt.source_next_work_signal_receipt_id,
      receipt.source_next_work_bias_receipt_id,
    ]),
    authority_profile:
      "manual_global_dogfood_perspective_state_mutation_record_metadata_only",
    perspective_state_mutation_record_fingerprint:
      `fnv1a32_canonical_json_v0_1:state-mutation-record${suffix}`,
  };
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_state_mutation_records (
        perspective_state_mutation_record_id,
        receipt_id,
        created_at,
        scope,
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
        intended_future_mutation_target,
        mutation_scope_hint,
        mutation_strength_hint,
        intended_future_apply_target,
        apply_scope_hint,
        apply_strength_hint,
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
        existing_state_apply_compatibility_json,
        source_refs_json,
        authority_profile,
        perspective_state_mutation_record_fingerprint
      )
      VALUES (
        @perspective_state_mutation_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_perspective_apply_receipt_id,
        @source_perspective_apply_record_id,
        @source_canonical_perspective_update_receipt_id,
        @source_canonical_perspective_update_record_id,
        @source_perspective_relay_receipt_id,
        @source_perspective_relay_record_id,
        @source_next_work_signal_receipt_id,
        @source_next_work_signal_record_id,
        @source_next_work_bias_receipt_id,
        @source_next_work_bias_record_id,
        @source_projection_fingerprint,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_metric_snapshot_receipt_id,
        @source_metric_snapshot_record_id,
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
        @outcome_signal,
        @intended_future_mutation_target,
        @mutation_scope_hint,
        @mutation_strength_hint,
        @intended_future_apply_target,
        @apply_scope_hint,
        @apply_strength_hint,
        @expected_summary,
        @observed_summary,
        @mismatch_or_gap_summary,
        @selected_candidate_context_refs_json,
        @source_next_work_candidate_card_ids_json,
        @manual_only_context_refs_json,
        @source_line,
        @blockers_json,
        @warnings_json,
        @compatibility_findings_json,
        @existing_state_apply_compatibility_json,
        @source_refs_json,
        @authority_profile,
        @perspective_state_mutation_record_fingerprint
      )
    `,
  ).run(record);
}

function countRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}
