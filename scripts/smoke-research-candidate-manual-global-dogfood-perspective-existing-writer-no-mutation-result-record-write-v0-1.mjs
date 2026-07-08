#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecords,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-existing-writer-no-mutation-result-records.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
} from "../types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";

const files = {
  resultRecordType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record.ts",
  dryRunResultBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  entrypointBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint.ts",
  resultRecordWriter:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write.ts",
  resultRecordReadback:
    "lib/research-candidate-review/read-manual-global-dogfood-perspective-existing-writer-no-mutation-result-records.ts",
  sharedGuards:
    "lib/research-candidate-review/shared-source-chain-guards.ts",
  resultRecordReadbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-readback-panel.tsx",
  entrypointPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-panel.tsx",
  entrypointReviewType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  entrypointReviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  entrypointReviewPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-panel.tsx",
  entrypointSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1.mjs",
  entrypointReviewSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1.mjs",
  dryRunResultSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1.mjs",
  agentPanelSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1.mjs",
  sharedGuardSmoke:
    "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  packageJson: "package.json",
};

const allowedChangedFiles = new Set(Object.values(files));

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

assertChangedFileBoundary();
assertStaticContracts();
assertBehavior();
assertPackageAndMounting();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1",
      pass: true,
      accepted_review_writes_target_record: true,
      duplicate_replay_checked: true,
      readback_selects_record: true,
      row_count_target_only_write_checked: true,
      unsafe_review_refusals_checked: true,
      raw_material_refused: true,
      changed_files_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record",
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record.v0.1",
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
    "can_write_no_mutation_result_record: true",
    "persists_raw_manual_note: false",
    "persists_raw_result_report: false",
    "persists_raw_operator_note: false",
    "persists_raw_payload: false",
    "persists_secret_or_token: false",
    "target_only_write_proven: true",
    "raw_material_absent: true",
  ]) {
    assert.ok(
      source.resultRecordType.includes(requiredText),
      `result-record type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_entrypoint_review_missing",
    "source_entrypoint_review_not_ready",
    "operator_decision_not_accepted",
    "source_entrypoint_review_validation_not_passed",
    "accepted_entrypoint_summary_missing",
    "source_entrypoint_row_count_delta_or_gap",
    "source_entrypoint_non_mutation_summary_not_false",
    "source_entrypoint_explicit_non_write_boundary_not_false",
    "source_fingerprints_missing",
    "source_writer_compatibility_refs_missing",
    "source_entrypoint_lineage_mismatch",
    "raw_material_fields_present",
    "target_only_result_record_row_count_proof_failed",
    "BEGIN IMMEDIATE",
    "INSERT INTO research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
  ]) {
    assert.ok(
      source.resultRecordWriter.includes(requiredText),
      `result-record writer must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
    "source_entrypoint_review_fingerprint TEXT NOT NULL",
    "source_entrypoint_fingerprint TEXT NOT NULL",
    "source_contract_fingerprint TEXT NOT NULL",
    "source_review_fingerprint TEXT NOT NULL",
    "source_dry_run_result_fingerprint TEXT NOT NULL",
    "source_perspective_writer_compatibility_receipt_id TEXT NOT NULL",
    "source_perspective_writer_compatibility_record_id TEXT NOT NULL",
    "source_perspective_writer_compatibility_record_fingerprint TEXT NOT NULL",
    "row_count_write_summary_json TEXT NOT NULL",
    "record_fingerprint TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
    assert.ok(source.db.includes(requiredText), `lib/db.ts must include ${requiredText}`);
    assert.ok(source.migrations.includes(requiredText), `migration must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordTable",
    ),
    "lib/db.ts must migrate no-mutation result record table",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordResult",
    ),
    "db-migrate must run no-mutation result record migration",
  );
  assert.ok(
    source.resultRecordReadback.includes("computeResultRecordFingerprint") &&
      source.resultRecordReadback.includes("selected_latest_valid_record"),
    "readback must verify fingerprints and select the latest valid record",
  );
  assert.doesNotMatch(
    source.resultRecordWriter,
    /writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|fetch\s*\(|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "result-record writer must avoid existing writer, provider, GitHub, Codex, and retrieval behavior",
  );
  assert.doesNotMatch(
    source.resultRecordReadbackPanel,
    /useState|useEffect|<button|onClick|fetch\s*\(|formAction|server action|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "result-record readback panel must be passive and avoid controls, server actions, fetches, persistence, or route calls",
  );
}

function assertBehavior() {
  const db = new Database(":memory:");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordSchema(
    db,
  );
  for (const tableName of RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES) {
    createProtectedTable(db, tableName);
  }

  const safeEntrypoint = buildSafeEntrypointFixture();
  const acceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: safeEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
      },
    );

  assert.equal(acceptedReview.validation.passed, true);
  assert.equal(
    acceptedReview.review_status,
    "ready_for_future_no_mutation_result_record_planning",
  );

  const before = countRows(
    db,
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
  );
  const nonTargetBefore = snapshotProtectedCounts(db);
  const written =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      { source_entrypoint_review: acceptedReview },
      { db, now: "2026-07-09T00:00:00.000Z" },
    );
  assert.equal(written.ok, true);
  assert.equal(written.result_status, "written");
  assert.equal(written.result_record_written, true);
  assert.equal(written.existing_writer_called, false);
  assert.equal(written.current_working_perspective_updated, false);
  assert.equal(written.perspective_memory_written, false);
  assert.equal(written.proof_or_evidence_written, false);
  assert.equal(written.raw_material_persisted, false);
  assert.equal(
    countRows(
      db,
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
    ),
    before + 1,
  );
  assert.deepEqual(snapshotProtectedCounts(db), nonTargetBefore);
  assert.equal(written.record.source_entrypoint_review_fingerprint, acceptedReview.validation.review_fingerprint);
  assert.equal(written.record.source_entrypoint_fingerprint, acceptedReview.source_entrypoint_fingerprint);
  assert.equal(written.record.source_contract_fingerprint, acceptedReview.source_contract_fingerprint);
  assert.equal(written.record.source_review_fingerprint, acceptedReview.source_review_fingerprint);
  assert.equal(written.record.source_dry_run_result_fingerprint, acceptedReview.source_dry_run_result_fingerprint);
  assert.equal(written.record.validation.target_only_write_proven, true);
  assert.equal(written.record.validation.raw_material_absent, true);
  assert.equal(written.record.row_count_write_summary.target_delta, 1);
  assert.equal(written.record.row_count_write_summary.non_target_changed_table_count, 0);
  assert.equal(written.record.row_count_write_summary.all_non_target_row_counts_unchanged, true);

  const duplicate =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      { source_entrypoint_review: acceptedReview },
      { db, now: "2026-07-09T00:01:00.000Z" },
    );
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.result_status, "duplicate_replayed");
  assert.equal(duplicate.duplicate_replayed, true);
  assert.equal(duplicate.result_record_written, false);
  assert.equal(
    countRows(
      db,
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
    ),
    before + 1,
  );

  const readback =
    readResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecords(
      {
        db,
        source_entrypoint_review_fingerprint:
          acceptedReview.validation.review_fingerprint,
      },
    );
  assert.equal(readback.selection_status, "selected_latest_valid_record");
  assert.equal(readback.records.length, 1);
  assert.equal(readback.invalid_record_count, 0);
  assert.equal(readback.raw_material_persisted, false);
  assert.equal(readback.existing_writer_called, false);
  assert.equal(readback.selected_record.record_id, written.record.record_id);

  const missing =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      { source_entrypoint_review: null },
      { db },
    );
  assert.equal(missing.ok, false);
  assert.ok(missing.refusal_reasons.includes("source_entrypoint_review_missing"));

  const deferredReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: safeEntrypoint,
        operator_decision: "defer_entrypoint_review",
      },
    );
  const deferred =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      { source_entrypoint_review: deferredReview },
      { db },
    );
  assert.equal(deferred.ok, false);
  assert.ok(deferred.refusal_reasons.includes("source_entrypoint_review_not_ready"));
  assert.ok(deferred.refusal_reasons.includes("operator_decision_not_accepted"));

  const deltaEntrypoint = clone(safeEntrypoint);
  deltaEntrypoint.non_mutation_assertions.all_protected_row_counts_unchanged =
    false;
  deltaEntrypoint.non_mutation_assertions.changed_protected_table_count = 1;
  deltaEntrypoint.non_mutation_assertions.protected_table_row_counts[0] = {
    ...deltaEntrypoint.non_mutation_assertions.protected_table_row_counts[0],
    after_count:
      deltaEntrypoint.non_mutation_assertions.protected_table_row_counts[0]
        .before_count + 1,
    delta: 1,
    changed: true,
  };
  const deltaReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: deltaEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
      },
    );
  const delta =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      { source_entrypoint_review: deltaReview },
      { db },
    );
  assert.equal(delta.ok, false);
  assert.ok(delta.refusal_reasons.includes("source_entrypoint_review_not_ready"));
  assert.ok(
    delta.refusal_reasons.includes("source_entrypoint_review_validation_not_passed"),
  );

  const lineageMismatchReview = clone(acceptedReview);
  lineageMismatchReview.accepted_entrypoint_summary.source_review_fingerprint =
    "different-source-review-fingerprint";
  const lineageMismatch =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      { source_entrypoint_review: lineageMismatchReview },
      { db },
    );
  assert.equal(lineageMismatch.ok, false);
  assert.ok(lineageMismatch.refusal_reasons.includes("source_entrypoint_lineage_mismatch"));

  const rawMaterial =
    writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      {
        source_entrypoint_review: acceptedReview,
        candidate_input: {
          raw_result_report: "must not persist",
          callback_url: "https://example.invalid",
          api_token: "secret",
        },
      },
      { db },
    );
  assert.equal(rawMaterial.ok, false);
  assert.ok(rawMaterial.refusal_reasons.includes("raw_material_fields_present"));
  assert.equal(
    countRows(
      db,
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records",
    ),
    before + 1,
  );

  db.close();
}

function assertPackageAndMounting() {
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1"
    ],
    "package script must expose existing writer no-mutation result record smoke",
  );
  assert.ok(
    source.entrypointPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadbackPanel",
    ),
    "entrypoint panel must mount the result-record readback panel",
  );
  assert.ok(
    source.entrypointReviewSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record",
    ),
    "entrypoint review smoke must allow the result-record follow-on files",
  );
  assert.ok(
    source.entrypointSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record",
    ),
    "entrypoint smoke must allow the result-record follow-on files",
  );
  assert.ok(
    source.dryRunResultSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record",
    ),
    "dry-run result smoke must allow the result-record follow-on files",
  );
  assert.ok(
    source.agentPanelSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1",
    ),
    "agent workplane panel smoke must allow the result-record follow-on files",
  );
}

function buildSafeEntrypointFixture() {
  const rows =
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES.map(
      (tableName) => ({
        table_name: tableName,
        before_count:
          tableName ===
            "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts" ||
          tableName ===
            "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"
            ? 1
            : 0,
        after_count:
          tableName ===
            "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts" ||
          tableName ===
            "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"
            ? 1
            : 0,
        delta: 0,
        changed: false,
      }),
    );
  return {
    entrypoint_kind:
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint",
    entrypoint_version:
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint.v0.1",
    scope: "project:augnes",
    entrypoint_status: "safe_no_mutation_entrypoint_available",
    source_binding: {
      source_contract_fingerprint: "source-contract-fp-result-record",
      source_review_fingerprint: "source-review-fp-result-record",
      source_dry_run_result_fingerprint:
        "source-dry-run-result-fp-result-record",
      accepted_mapping_summary_present: true,
      accepted_mapping_contract_fingerprint:
        "source-contract-fp-result-record",
      source_perspective_writer_compatibility_receipt_id:
        "writer-compatibility-receipt-result-record",
      source_perspective_writer_compatibility_record_id:
        "writer-compatibility-record-result-record",
      source_perspective_writer_compatibility_record_fingerprint:
        "writer-compatibility-record-fp-result-record",
      source_handoff_seed_fingerprint: "handoff-seed-fp-result-record",
      source_result_text_fingerprint: "result-text-fp-result-record",
      intended_future_dry_run_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
      accepted_future_dry_run_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
      safe_adapter_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    },
    source_contract_fingerprint: "source-contract-fp-result-record",
    source_review_fingerprint: "source-review-fp-result-record",
    source_dry_run_result_fingerprint:
      "source-dry-run-result-fp-result-record",
    safe_adapter_target:
      "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    supported_capabilities: {
      supports_row_count_snapshot: true,
      supports_transaction_rollback: true,
      supports_no_mutation_assertions: true,
      supports_safe_adapter_noop: true,
      supports_existing_writer_call: false,
    },
    execution_decision: {
      adapter_runnable_today: true,
      safe_adapter_noop_executed: true,
      existing_writer_called: false,
      existing_writer_skipped: true,
      skipped_existing_writer_reason:
        "safe_adapter_noop_harness_does_not_call_existing_mutating_writers",
      execution_trace: ["entrypoint_status:safe_no_mutation_entrypoint_available"],
    },
    non_mutation_assertions: {
      assertion_kind:
        "manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_assertions",
      snapshot_source: "provided_before_after",
      protected_table_row_counts: rows,
      protected_table_count: rows.length,
      changed_protected_table_count: 0,
      all_protected_row_counts_unchanged: true,
      row_count_before_after_snapshot_recorded: true,
      existing_writer_called: false,
      existing_current_working_writer_called: false,
      existing_canonical_state_writer_called: false,
      current_working_perspective_updated: false,
      existing_canonical_perspective_state_table_mutated: false,
      canonical_perspective_state_written: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      work_mutated: false,
      dogfood_metrics_written: false,
      proof_or_evidence_written: false,
      manual_result_records_written: false,
      product_write_executed: false,
      provider_openai_called: false,
      github_called: false,
      codex_executed: false,
      sources_fetched: false,
      retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
      raw_operator_note_or_result_persisted: false,
    },
    validation: {
      passed: true,
      entrypoint_fingerprint: "entrypoint-fp-result-record",
      fingerprint_algorithm: "fnv1a32_canonical_json_v0_1",
      source_contract_present: true,
      source_review_present: true,
      source_dry_run_result_present: true,
      source_contract_ready: true,
      source_review_accepted: true,
      source_dry_run_result_validated: true,
      source_contract_fingerprint_matches_review: true,
      accepted_mapping_summary_matches_contract: true,
      source_dry_run_result_matches_contract_review: true,
      safe_adapter_target_supported: true,
      direct_existing_writer_target_requested: false,
      direct_existing_writer_target_refused: false,
      raw_payload_absent: true,
      raw_payload_forbidden_fields: [],
      row_count_snapshots_present: true,
      protected_row_counts_unchanged: true,
      existing_writer_called: false,
      existing_writer_call_faked: false,
      safe_adapter_noop_executed: true,
      no_write_authority: true,
      no_existing_writer_authority: true,
      no_provider_github_codex_retrieval_authority: true,
      failure_reasons: [],
      warning_reasons: [],
    },
    authority_boundary: {
      preview_only: true,
      read_only: true,
      source_of_truth: false,
      can_run_safe_adapter_noop: true,
      can_call_existing_current_working_writer: false,
      can_call_existing_canonical_state_writer: false,
      can_update_current_working_perspective: false,
      can_mutate_existing_canonical_perspective_state: false,
      can_write_existing_canonical_perspective_state: false,
      can_promote_perspective: false,
      can_write_perspective_memory: false,
      can_write_work_item: false,
      can_mutate_work: false,
      can_write_dogfood_metrics: false,
      can_write_global_dogfood_ledger: false,
      can_write_metric_snapshot: false,
      can_write_next_work_signal_decision: false,
      can_write_proof_or_evidence: false,
      can_execute_codex: false,
      can_call_github: false,
      can_call_providers_or_openai: false,
      can_fetch_sources: false,
      can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
      can_allocate_product_ids: false,
      can_execute_product_write: false,
    },
    blocker_reasons: [],
    warning_reasons: [],
    next_recommended_slice:
      "Persist the accepted no-mutation result record with target-only row-count proof.",
  };
}

function createProtectedTable(db, tableName) {
  assert.match(tableName, /^[a-zA-Z_][a-zA-Z0-9_]*$/);
  db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (id TEXT PRIMARY KEY)`).run();
  if (
    tableName ===
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts" ||
    tableName ===
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"
  ) {
    db.prepare(`INSERT OR IGNORE INTO ${tableName} (id) VALUES (?)`).run(
      `${tableName}-seed`,
    );
  }
}

function snapshotProtectedCounts(db) {
  return Object.fromEntries(
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES.map(
      (tableName) => [tableName, countRows(db, tableName)],
    ),
  );
}

function countRows(db, tableName) {
  assert.match(tableName, /^[a-zA-Z_][a-zA-Z0-9_]*$/);
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
  if (!table?.name) return 0;
  return db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
}

function assertChangedFileBoundary() {
  const files = uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...collectBaseRangeFiles(),
  ]);

  for (const file of files) {
    assert.ok(
      allowedChangedFiles.has(file),
      `Unexpected changed or untracked file for existing writer no-mutation result record slice: ${file}`,
    );
    assert.ok(!/^docs\//.test(file), "result record slice must not edit docs");
    assert.ok(!/^app\/api\//.test(file), "result record slice must not edit API routes");
  }
}

function collectBaseRangeFiles() {
  const baseRef = collectGitFiles(["merge-base", "HEAD", "origin/main"])[0];
  if (!baseRef) return [];
  return collectGitFiles(["diff", "--name-only", `${baseRef}...HEAD`]);
}

function collectGitFiles(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
