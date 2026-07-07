#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-apply-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-apply-review.ts";
import { readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate } from "../lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update.ts";
import {
  rollbackResearchCandidateManualGlobalDogfoodPerspectiveApplyReceipt,
  writeResearchCandidateManualGlobalDogfoodPerspectiveApply,
} from "../lib/research-candidate-review/manual-global-dogfood-perspective-apply-write.ts";
import { readResearchCandidateManualGlobalDogfoodPerspectiveApply } from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-apply.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION,
} from "../types/research-candidate-manual-global-dogfood-perspective-apply-write.ts";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-perspective-apply-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-perspective-apply-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-perspective-apply.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-apply/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-apply/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-perspective-apply-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-apply-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-perspective-apply-contract-panel.tsx",
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
        "research-candidate-manual-global-dogfood-perspective-apply-write-v0-1",
      pass: true,
      storage_path: "manual_specific_perspective_apply_tables",
      source_canonical_perspective_update_revalidated: true,
      rejection_cases_checked: true,
      commit_checked: true,
      duplicate_replay_checked: true,
      rollback_checked: true,
      supersede_checked: true,
      readback_checked: true,
      non_target_table_counts_checked: true,
      no_raw_text_or_operator_note_persistence_checked: true,
      static_forbidden_behavior_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "I authorize writing this manual global dogfood Perspective apply candidate to a Perspective apply record",
    "I authorize rolling back this manual global dogfood Perspective apply receipt",
    "manual_operator_authorized_perspective_apply_write",
    "manual_operator_authorized_perspective_apply_rollback",
    "can_write_perspective_apply_record: true",
    "can_write_perspective_apply_receipt: true",
    "can_write_perspective_apply_rollback_metadata: true",
    "can_update_current_working_perspective: false",
    "can_write_canonical_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_canonical_perspective_update_record: false",
    "can_mutate_perspective_relay: false",
    "can_mutate_next_work_bias: false",
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
    "research_candidate_manual_global_dogfood_perspective_apply_receipts",
    "research_candidate_manual_global_dogfood_perspective_apply_records",
    "research_candidate_manual_global_dogfood_perspective_apply_rollbacks",
    "source_perspective_apply_contract_fingerprint TEXT NOT NULL",
    "source_perspective_apply_review_fingerprint TEXT NOT NULL",
    "source_canonical_perspective_update_receipt_id TEXT NOT NULL",
    "source_canonical_perspective_update_record_id TEXT NOT NULL",
    "source_canonical_perspective_update_record_fingerprint TEXT NOT NULL",
    "source_perspective_relay_receipt_id TEXT NOT NULL",
    "source_next_work_signal_receipt_id TEXT NOT NULL",
    "source_next_work_bias_receipt_id TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "apply_label TEXT NOT NULL",
    "apply_rationale TEXT NOT NULL",
    "intended_future_apply_target TEXT NOT NULL",
    "apply_scope_hint TEXT NOT NULL",
    "existing_apply_path_compatibility_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveApplyTables",
    ),
    "lib/db.ts must migrate manual Perspective apply tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveApply",
    ),
    "db-migrations must expose manual Perspective apply migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodPerspectiveApplyResult",
    ),
    "db-migrate must run manual Perspective apply migration",
  );

  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /validateSourcesForRequest/,
    "writer must revalidate source canonical update inside the transaction",
  );
  assert.match(
    source.writer,
    /perspective_apply_source_canonical_update_receipt_not_active_committed/,
    "writer must reject inactive source canonical update receipt",
  );
  assert.match(
    source.writer,
    /perspective_apply_scope_hint_must_be_canonical_state/,
    "writer must refuse current-working Perspective scope hints",
  );
  assert.match(
    source.writer,
    /perspective_apply_target_must_be_canonical_state/,
    "writer must refuse current-working Perspective apply targets",
  );
  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computePerspectiveApplyIdempotencyKey"),
    source.writer.indexOf("function validationWithFailures"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note material",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveRelay\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkBias\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual Perspective apply writer/readback must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "Perspective apply write path must not write non-target tables or delete rows",
  );

  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-perspective-apply/,
    "write panel must call the same-origin manual Perspective apply route",
  );
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-canonical-perspective-update/,
    "write panel must fetch source canonical update readback",
  );
  assert.match(
    source.writePanel,
    /source_canonical_perspective_update_readback: sourceCanonicalUpdateReadback/,
    "write panel must submit source canonical update readback",
  );
  assert.doesNotMatch(
    source.writePanel,
    /<button[^>]*>\s*(Create work item|Promote Perspective|Write Perspective state|Write Perspective Memory|Update current working Perspective|Global metrics update)/i,
    "write panel must not expose current-working/state/memory/work/metric controls",
  );
  assert.match(
    source.contractPanel,
    /const currentAcceptedReview =[\s\S]*operatorDecision === "accept_contract_for_future_perspective_apply_write_slice"[\s\S]*currentReview\?\.operator_decision ===[\s\S]*"accept_contract_for_future_perspective_apply_write_slice"[\s\S]*currentReview\?\.review_status ===[\s\S]*"ready_for_future_perspective_apply_write_slice"/,
    "write panel gate must require the current operator decision and cached review to both be accepted",
  );
  assert.match(
    source.contractPanel,
    /currentReview\.source_contract_fingerprint === currentContractFingerprint/,
    "write panel gate must bind review source contract fingerprint to the current contract",
  );
  assert.match(
    source.contractPanel,
    /currentReview\.accepted_mapping_summary\?\.proposed_idempotency_key ===[\s\S]*contract\.idempotency_contract_preview\.proposed_idempotency_key/,
    "write panel gate must bind accepted mapping idempotency key to the current contract",
  );
  assert.match(
    source.contractPanel,
    /\{currentAcceptedReview \? \([\s\S]*ResearchCandidateManualGlobalDogfoodPerspectiveApplyWritePanel/,
    "write panel must render only behind currentAcceptedReview",
  );
}

function assertRuntimeWritePath() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync("lib/db/schema.sql", "utf8"));

  const countTables = [
    "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    "research_candidate_manual_global_dogfood_perspective_apply_receipts",
    "research_candidate_manual_global_dogfood_perspective_apply_records",
    "research_candidate_manual_global_dogfood_perspective_apply_rollbacks",
    "dogfood_metric_snapshot_records",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "verification_evidence_records",
    "action_records",
    "work_items",
    "work_events",
    "perspective_states",
    "perspective_memory_items",
    "delivery_ledger",
  ];
  const countsBefore = readCounts(db, countTables);

  const primary = readySource(db, "primary");
  const wrongConfirmation = write(db, primary, {
    operator_authorization: { operator_confirmation_text: "wrong confirmation" },
  });
  assert.equal(wrongConfirmation.ok, false);
  assert.ok(
    wrongConfirmation.refusal_reasons.includes("perspective_apply_wrong_confirmation"),
  );

  for (const decision of [
    "needs_perspective_apply_mapping_revision",
    "reject_perspective_apply_contract",
    "defer_perspective_apply_contract",
  ]) {
    const nonAcceptedReview =
      buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
        perspective_apply_contract: primary.contract,
        operator_decision: decision,
      });
    const result = write(db, { ...primary, review: nonAcceptedReview });
    assert.equal(result.ok, false, `${decision} must not write`);
  }

  const mismatch = readySource(db, "mismatch");
  const mismatchWrite = write(db, { ...primary, review: mismatch.review });
  assert.equal(mismatchWrite.ok, false);
  assert.ok(
    mismatchWrite.refusal_reasons.includes("perspective_apply_review_contract_mismatch") ||
      mismatchWrite.refusal_reasons.includes("perspective_apply_review_source_mismatch"),
  );

  const currentWorkingScope = {
    ...primary.contract,
    proposed_apply_candidate: {
      ...primary.contract.proposed_apply_candidate,
      apply_scope_hint: "current_working_perspective",
    },
  };
  const currentWorkingScopeWrite = write(db, {
    ...primary,
    contract: currentWorkingScope,
  });
  assert.equal(currentWorkingScopeWrite.ok, false);
  assert.ok(
    currentWorkingScopeWrite.refusal_reasons.includes(
      "perspective_apply_scope_hint_must_be_canonical_state",
    ),
  );

  const currentWorkingTarget = {
    ...primary.contract,
    proposed_perspective_apply_mapping: {
      ...primary.contract.proposed_perspective_apply_mapping,
      intended_future_apply_target: "current_working_perspective",
    },
  };
  const currentWorkingTargetWrite = write(db, {
    ...primary,
    contract: currentWorkingTarget,
  });
  assert.equal(currentWorkingTargetWrite.ok, false);
  assert.ok(
    currentWorkingTargetWrite.refusal_reasons.includes(
      "perspective_apply_target_must_be_canonical_state",
    ),
    JSON.stringify(currentWorkingTargetWrite.refusal_reasons),
  );

  const mutatedSourceReadbackWrite = write(db, {
    ...primary,
    sourceReadback: {
      ...primary.sourceReadback,
      canonical_perspective_state_written: true,
    },
  });
  assert.equal(mutatedSourceReadbackWrite.ok, false);
  assert.ok(
    mutatedSourceReadbackWrite.refusal_reasons.includes(
      "perspective_apply_source_readback_forbidden_mutation_flag",
    ),
  );

  for (const [label, overrides] of [
    ["raw text", { raw_result_report_text: "raw result text must not persist" }],
    ["operator note", { operator_note: "operator note must not persist" }],
    [
      "side effect",
      {
        requested_side_effects: {
          current_working_perspective_updated: true,
          canonical_perspective_state_written: true,
          perspective_promoted: true,
          perspective_memory_written: true,
          work_item_written: true,
          proof_or_evidence_written: true,
          dogfood_metrics_written: true,
          product_write_executed: true,
        },
      },
    ],
  ]) {
    const result = write(db, primary, overrides);
    assert.equal(result.ok, false, `${label} request must be refused`);
  }

  const rolledBackSource = readySource(db, "rolled-source");
  updateCanonicalSourceStatus(db, "rolled-source", "rolled_back");
  const rolledBackWrite = write(db, rolledBackSource);
  assert.equal(rolledBackWrite.ok, false);
  assert.ok(
    rolledBackWrite.refusal_reasons.includes(
      "perspective_apply_source_canonical_update_receipt_not_active_committed",
    ),
  );

  const supersededSource = readySource(db, "superseded-source");
  updateCanonicalSourceStatus(db, "superseded-source", "superseded");
  const supersededWrite = write(db, supersededSource);
  assert.equal(supersededWrite.ok, false);
  assert.ok(
    supersededWrite.refusal_reasons.includes(
      "perspective_apply_source_canonical_update_receipt_not_active_committed",
    ),
  );

  const committed = write(db, primary);
  assert.equal(committed.ok, true);
  assert.equal(committed.result_status, "committed");
  assert.equal(committed.duplicate_replayed, false);
  assert.equal(
    committed.receipt.source_canonical_perspective_update_receipt_id,
    primary.contract.source_canonical_perspective_update_receipt_id,
  );
  assert.equal(
    committed.perspective_apply_record.apply_label,
    primary.contract.proposed_perspective_apply_mapping.apply_label,
  );
  assert.equal(
    committed.perspective_apply_record.intended_future_apply_target,
    "canonical_perspective_state",
  );
  assert.equal(committed.current_working_perspective_updated, false);
  assert.equal(committed.canonical_perspective_state_written, false);
  assert.equal(committed.perspective_memory_written, false);
  assert.equal(committed.work_mutated, false);

  const duplicate = write(db, primary);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.result_status, "duplicate_replayed");
  assert.equal(duplicate.duplicate_replayed, true);
  assert.equal(count(db, "research_candidate_manual_global_dogfood_perspective_apply_receipts"), 1);
  assert.equal(count(db, "research_candidate_manual_global_dogfood_perspective_apply_records"), 1);

  const duplicateNoteReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
      perspective_apply_contract: primary.contract,
      operator_decision: "accept_contract_for_future_perspective_apply_write_slice",
      operator_note: "Different local-only note",
    });
  const duplicateWithDifferentLocalNote = write(db, {
    ...primary,
    review: duplicateNoteReview,
  });
  assert.equal(duplicateWithDifferentLocalNote.ok, true);
  assert.equal(duplicateWithDifferentLocalNote.result_status, "duplicate_replayed");
  assert.equal(count(db, "research_candidate_manual_global_dogfood_perspective_apply_receipts"), 1);

  const rollbackWrong = rollback(db, committed.receipt.receipt_id, {
    operator_confirmation_text: "wrong rollback",
  });
  assert.equal(rollbackWrong.ok, false);
  const rollbackResult = rollback(db, committed.receipt.receipt_id);
  assert.equal(rollbackResult.ok, true);
  assert.equal(rollbackResult.result_status, "rolled_back");
  assert.equal(count(db, "research_candidate_manual_global_dogfood_perspective_apply_records"), 1);
  const duplicateRollback = rollback(db, committed.receipt.receipt_id);
  assert.equal(duplicateRollback.ok, true);
  assert.equal(count(db, "research_candidate_manual_global_dogfood_perspective_apply_rollbacks"), 1);

  const supersedePrior = readySource(db, "supersede-prior");
  const prior = write(db, supersedePrior);
  assert.equal(prior.ok, true);
  const supersedeReplacement = readySource(db, "supersede-replacement");
  const supersede = write(db, supersedeReplacement, {
    operator_authorization: {
      write_mode: "supersede_previous",
      supersedes_receipt_id: prior.receipt.receipt_id,
    },
  });
  assert.equal(supersede.ok, true);
  assert.equal(supersede.result_status, "committed");
  const priorReadback = readResearchCandidateManualGlobalDogfoodPerspectiveApply({
    db,
    receiptId: prior.receipt.receipt_id,
    limit: 1,
  });
  assert.equal(priorReadback.records_by_receipt[0].receipt.write_status, "superseded");
  const supersedeRolledBack = write(db, supersedeReplacement, {
    operator_authorization: {
      write_mode: "supersede_previous",
      supersedes_receipt_id: committed.receipt.receipt_id,
    },
  });
  assert.equal(supersedeRolledBack.ok, false);

  const readback = readResearchCandidateManualGlobalDogfoodPerspectiveApply({ db });
  assert.ok(readback.count >= 3);
  assert.equal(readback.storage_path, "manual_specific_perspective_apply_tables");
  assert.equal(readback.current_working_perspective_updated, false);
  assert.equal(readback.canonical_perspective_state_written, false);
  assert.equal(readback.perspective_promoted, false);
  assert.equal(readback.perspective_memory_written, false);
  assert.equal(readback.proof_or_evidence_rows_written, false);

  const countsAfter = readCounts(db, countTables);
  assert.equal(
    countsAfter.research_candidate_manual_global_dogfood_canonical_perspective_update_receipts,
    countsBefore.research_candidate_manual_global_dogfood_canonical_perspective_update_receipts + 6,
  );
  assert.equal(
    countsAfter.research_candidate_manual_global_dogfood_perspective_apply_records,
    3,
  );
  for (const table of [
    "dogfood_metric_snapshot_records",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "verification_evidence_records",
    "work_items",
    "work_events",
    "perspective_states",
    "perspective_memory_items",
    "delivery_ledger",
  ]) {
    assert.equal(countsAfter[table], countsBefore[table], `${table} must not change`);
  }

  const storedJson = JSON.stringify(
    db
      .prepare("SELECT * FROM research_candidate_manual_global_dogfood_perspective_apply_receipts")
      .all(),
  );
  assert.doesNotMatch(storedJson, /raw result text|operator note/i);
}

function seedCanonicalUpdateSource(db, tag, status = "committed") {
  const createdAt = "2026-07-08T00:00:00.000Z";
  const receipt = {
    receipt_id: `manual-global-dogfood-canonical-perspective-update-receipt:${tag}`,
    created_at: createdAt,
    scope: "project:augnes",
    source_canonical_perspective_update_contract_fingerprint: `fnv1a32:canonical-contract-${tag}`,
    source_canonical_perspective_update_review_fingerprint: `fnv1a32:canonical-review-${tag}`,
    source_perspective_relay_receipt_id: `relay-receipt-${tag}`,
    source_perspective_relay_record_id: `relay-record-${tag}`,
    source_perspective_relay_record_fingerprint: `fnv1a32:relay-record-${tag}`,
    source_next_work_signal_receipt_id: `signal-receipt-${tag}`,
    source_next_work_signal_record_id: `signal-record-${tag}`,
    source_next_work_signal_record_fingerprint: `fnv1a32:signal-record-${tag}`,
    source_next_work_bias_receipt_id: `bias-receipt-${tag}`,
    source_next_work_bias_record_id: `bias-record-${tag}`,
    source_next_work_bias_record_fingerprint: `fnv1a32:bias-record-${tag}`,
    source_projection_fingerprint: `fnv1a32:projection-${tag}`,
    source_global_dogfood_ledger_receipt_id: `ledger-receipt-${tag}`,
    source_global_dogfood_ledger_record_id: `ledger-record-${tag}`,
    source_metric_snapshot_receipt_id: `metric-receipt-${tag}`,
    source_metric_snapshot_record_id: `metric-record-${tag}`,
    source_manual_receipt_id: `manual-receipt-${tag}`,
    source_handoff_seed_fingerprint: `fnv1a32:handoff-${tag}`,
    source_result_text_fingerprint: `fnv1a32:result-${tag}`,
    source_expected_observed_delta_record_ref: `eod-record-${tag}`,
    source_reuse_outcome_record_ref: `reuse-record-${tag}`,
    idempotency_key: `canonical-update-idempotency-${tag}`,
    write_status: status,
    authority_profile: "manual_global_dogfood_canonical_perspective_update_write_authority.v0.1",
    receipt_fingerprint: `fnv1a32:canonical-receipt-${tag}`,
    supersedes_receipt_id: null,
    rollback_of_receipt_id:
      status === "rolled_back"
        ? `manual-global-dogfood-canonical-perspective-update-receipt:${tag}`
        : null,
    rollback_reason: status === "rolled_back" ? "source rollback" : null,
  };
  const record = {
    canonical_perspective_update_record_id: `manual-global-dogfood-canonical-perspective-update-record:${tag}`,
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: receipt.scope,
    source_perspective_relay_receipt_id: receipt.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id: receipt.source_perspective_relay_record_id,
    source_next_work_signal_receipt_id: receipt.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: receipt.source_next_work_signal_record_id,
    source_next_work_bias_receipt_id: receipt.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id: receipt.source_next_work_bias_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    canonical_update_label: `Canonical update ${tag}`,
    canonical_update_rationale: `Canonical update rationale ${tag}`,
    relay_update_label: `Relay update ${tag}`,
    relay_update_rationale: `Relay update rationale ${tag}`,
    recommended_next_work_label: `Next work ${tag}`,
    outcome_label: "helpful",
    outcome_signal: "positive",
    update_scope_hint: "canonical_perspective_state",
    update_strength_hint: "medium",
    expected_summary: `Expected ${tag}`,
    observed_summary: `Observed ${tag}`,
    mismatch_or_gap_summary: `Gap ${tag}`,
    selected_candidate_context_refs_json: JSON.stringify([`context:${tag}`]),
    source_next_work_candidate_card_ids_json: JSON.stringify([`card:${tag}`]),
    manual_only_context_refs_json: JSON.stringify([`manual-only:${tag}`]),
    source_line: `Source line ${tag}`,
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify([`warning:${tag}`]),
    compatibility_findings_json: JSON.stringify([`compat:${tag}`]),
    existing_perspective_update_compatibility_json: JSON.stringify({
      existing_current_working_perspective_apply_write_compatible: false,
    }),
    source_refs_json: JSON.stringify([`source:${tag}`]),
    authority_profile: receipt.authority_profile,
    canonical_perspective_update_record_fingerprint: `fnv1a32:canonical-record-${tag}`,
  };
  insertRow(
    db,
    "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    receipt,
  );
  insertRow(
    db,
    "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    record,
  );
}

function readySource(db, tag, status = "committed") {
  seedCanonicalUpdateSource(db, tag, status);
  const sourceReadback = readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate({
    db,
    receiptId: `manual-global-dogfood-canonical-perspective-update-receipt:${tag}`,
    limit: 1,
  });
  const contract = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract({
    readback: sourceReadback,
    operator_intent_label: "manual_perspective_apply_write_smoke",
  });
  const review = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
    perspective_apply_contract: contract,
    operator_decision: "accept_contract_for_future_perspective_apply_write_slice",
    operator_note: `Local-only note ${tag}`,
  });
  if (status === "committed") {
    assert.equal(
      contract.operator_authorization_mode,
      "ready_for_future_perspective_apply_write_authorization",
    );
    assert.equal(review.review_status, "ready_for_future_perspective_apply_write_slice");
  }
  return { sourceReadback, contract, review };
}

function request(source, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } =
    overrides;
  return {
    perspective_apply_contract: source.contract,
    perspective_apply_review: source.review,
    source_canonical_perspective_update_readback: source.sourceReadback,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_perspective_apply_write",
      operator_confirmation_text:
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides,
    },
    ...topLevelOverrides,
  };
}

function write(db, source, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodPerspectiveApply(
    request(source, overrides),
    { db },
  );
}

function rollback(db, receiptId, overrides = {}) {
  return rollbackResearchCandidateManualGlobalDogfoodPerspectiveApplyReceipt(
    {
      receipt_id: receiptId,
      rollback_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_apply_rollback",
        operator_confirmation_text:
          RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION,
        rollback_reason: "manual smoke rollback",
        ...overrides,
      },
    },
    { db },
  );
}

function updateCanonicalSourceStatus(db, tag, status) {
  db.prepare(
    `
      UPDATE research_candidate_manual_global_dogfood_canonical_perspective_update_receipts
      SET write_status = ?,
          rollback_of_receipt_id = CASE WHEN ? = 'rolled_back' THEN receipt_id ELSE rollback_of_receipt_id END
      WHERE receipt_id = ?
    `,
  ).run(status, status, `manual-global-dogfood-canonical-perspective-update-receipt:${tag}`);
}

function insertRow(db, table, row) {
  const keys = Object.keys(row);
  db.prepare(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys
      .map((key) => `@${key}`)
      .join(", ")})`,
  ).run(row);
}

function tableExists(db, table) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table),
  );
}

function count(db, table) {
  return tableExists(db, table)
    ? db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
    : 0;
}

function readCounts(db, tables) {
  return Object.fromEntries(tables.map((table) => [table, count(db, table)]));
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-apply-write-v0-1"
    ],
    "tsx --tsconfig tsconfig.json scripts/smoke-research-candidate-manual-global-dogfood-perspective-apply-write-v0-1.mjs",
    "package script must expose the Perspective apply write smoke",
  );
  assert.match(
    source.docs,
    /Perspective apply record/i,
    "docs must describe manual Perspective apply record write",
  );
  assert.match(
    source.docs,
    /manual-specific Perspective apply table family/i,
    "docs must state storage path",
  );
  assert.match(
    source.docs,
    /no current-working Perspective update\/apply/i,
    "docs must keep current-working apply out of scope",
  );
}
