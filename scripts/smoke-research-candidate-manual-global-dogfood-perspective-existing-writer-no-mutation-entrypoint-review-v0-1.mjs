#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
} from "../types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";

const files = {
  reviewType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  dryRunResultBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  entrypointBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  sharedGuards:
    "lib/research-candidate-review/shared-source-chain-guards.ts",
  reviewPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-panel.tsx",
  entrypointPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-panel.tsx",
  entrypointSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1.mjs",
  dryRunResultSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1.mjs",
  agentPanelSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1.mjs",
  sharedGuardSmoke:
    "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  packageJson: "package.json",
};

const allowedChangedFiles = new Set(Object.values(files));
const followOnResultRecordFiles = [
  "types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record.ts",
  "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-perspective-existing-writer-no-mutation-result-records.ts",
  "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-readback-panel.tsx",
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1.mjs",
];
const followOnResultRecordMigrationFiles = new Set([
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
]);
for (const file of followOnResultRecordFiles) {
  allowedChangedFiles.add(file);
}

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
        "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1",
      pass: true,
      missing_entrypoint_blocks: true,
      unsafe_entrypoint_blocks: true,
      row_count_delta_blocks: true,
      accept_decision_ready: true,
      missing_decision_blocks: true,
      defer_decision_deferred: true,
      reject_decision_rejected: true,
      production_ui_auto_acceptance_absent: true,
      changed_files_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_review",
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_review.v0.1",
    "ready_for_future_no_mutation_result_record_planning",
    "source_entrypoint_missing",
    "source_entrypoint_not_ready",
    "source_entrypoint_not_safe",
    "source_entrypoint_row_count_delta",
    "source_entrypoint_lineage_mismatch",
    "operator_decision_missing",
    "operator_decision_deferred",
    "operator_decision_rejected",
    "accept_entrypoint_for_future_result_record_planning",
    "defer_entrypoint_review",
    "reject_entrypoint_review",
    "accepted_entrypoint_summary",
    "explicit_non_write_boundary",
    "can_write_no_mutation_result_record: false",
    "can_write_review_record: false",
    "can_call_existing_current_working_writer: false",
    "can_call_existing_canonical_state_writer: false",
    "can_write_proof_or_evidence: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "can_execute_codex: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
  ]) {
    assert.ok(
      source.reviewType.includes(requiredText),
      `review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "operator_note_received_local_only_not_persisted",
    "requested_operator_ref_local_only_not_persisted",
    "requested_idempotency_key_local_only_not_persisted",
    "review_confirmation_ref_local_only_not_persisted",
    "future_explicit_no_mutation_result_record_planning_only",
    "source_entrypoint_row_count_delta",
    "source_entrypoint_lineage_mismatch",
    "operator_decision_missing",
  ]) {
    assert.ok(
      source.reviewBuilder.includes(requiredText),
      `review builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    source.reviewBuilder,
    /openDatabase|better-sqlite3|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspective|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "review builder must stay pure and avoid DB, writer, API, provider, GitHub, Codex, and retrieval calls",
  );
  assert.doesNotMatch(
    source.reviewBuilder,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "review builder must not contain SQL writes",
  );
  assert.doesNotMatch(
    source.reviewPanel,
    /useState|useEffect|<button|onClick|fetch\s*\(|formAction|server action|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "review panel must be passive and avoid controls, server actions, fetches, persistence, or route calls",
  );
  assert.doesNotMatch(
    source.entrypointPanel,
    /operator_decision:\s*["']accept_entrypoint_for_future_result_record_planning["']/,
    "production entrypoint panel must not auto-accept the review decision",
  );
  assert.ok(
    source.entrypointPanel.includes(
      "buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview",
    ),
    "entrypoint panel must build the local review preview",
  );
  assert.ok(
    source.entrypointPanel.includes("source_entrypoint_result: entrypointResult"),
    "entrypoint panel must bind review preview to the entrypoint result",
  );
  assert.ok(
    source.entrypointPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewPanel",
    ),
    "entrypoint panel must mount the review panel",
  );
}

function assertBehavior() {
  const safeEntrypoint = buildSafeEntrypointFixture();

  const missing =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: null,
      },
    );
  assert.equal(missing.review_status, "source_entrypoint_missing");
  assert.equal(missing.validation.passed, false);
  assert.equal(missing.accepted_entrypoint_summary, null);
  assert.ok(missing.blocker_reasons.includes("source_entrypoint_missing"));

  const missingDecision =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: safeEntrypoint,
      },
    );
  assert.equal(missingDecision.review_status, "operator_decision_missing");
  assert.equal(missingDecision.operator_decision, null);
  assert.equal(missingDecision.validation.operator_decision_present, false);
  assert.equal(missingDecision.accepted_entrypoint_summary, null);

  const deferred =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: safeEntrypoint,
        operator_decision: "defer_entrypoint_review",
      },
    );
  assert.equal(deferred.review_status, "operator_decision_deferred");
  assert.equal(deferred.accepted_entrypoint_summary, null);

  const rejected =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: safeEntrypoint,
        operator_decision: "reject_entrypoint_review",
      },
    );
  assert.equal(rejected.review_status, "operator_decision_rejected");
  assert.equal(rejected.accepted_entrypoint_summary, null);

  const accepted =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: safeEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
        requested_operator_ref: "operator-review-ref",
        requested_idempotency_key: "entrypoint-review-idempotency-key",
        review_confirmation_ref: "entrypoint-review-confirmation-ref",
      },
    );
  assert.equal(
    accepted.review_status,
    "ready_for_future_no_mutation_result_record_planning",
  );
  assert.equal(accepted.validation.passed, true);
  assert.equal(accepted.validation.operator_accepts_safe_entrypoint, true);
  assert.ok(accepted.accepted_entrypoint_summary);
  assert.equal(
    accepted.accepted_entrypoint_summary.source_entrypoint_fingerprint,
    safeEntrypoint.validation.entrypoint_fingerprint,
  );
  assert.equal(
    accepted.accepted_entrypoint_summary.source_contract_fingerprint,
    safeEntrypoint.source_contract_fingerprint,
  );
  assert.equal(
    accepted.accepted_entrypoint_summary.source_review_fingerprint,
    safeEntrypoint.source_review_fingerprint,
  );
  assert.equal(
    accepted.accepted_entrypoint_summary.source_dry_run_result_fingerprint,
    safeEntrypoint.source_dry_run_result_fingerprint,
  );
  assert.equal(
    accepted.accepted_entrypoint_summary.safe_adapter_target,
    safeEntrypoint.safe_adapter_target,
  );
  assert.equal(
    accepted.accepted_entrypoint_summary.row_count_summary.rows.length,
    safeEntrypoint.non_mutation_assertions.protected_table_row_counts.length,
  );
  assert.equal(
    accepted.accepted_entrypoint_summary.non_mutation_summary
      .existing_writer_called,
    false,
  );
  assertNoWriteAuthority(accepted);

  const blockedEntrypoint = clone(safeEntrypoint);
  blockedEntrypoint.entrypoint_status = "unsupported_no_safe_entrypoint";
  blockedEntrypoint.validation.passed = false;
  blockedEntrypoint.supported_capabilities.supports_row_count_snapshot = false;
  const blocked =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: blockedEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
      },
    );
  assert.equal(blocked.review_status, "source_entrypoint_not_ready");
  assert.equal(blocked.validation.passed, false);
  assert.equal(blocked.accepted_entrypoint_summary, null);

  const unsafeEntrypoint = clone(safeEntrypoint);
  unsafeEntrypoint.validation.passed = false;
  const unsafe =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: unsafeEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
      },
    );
  assert.equal(unsafe.review_status, "source_entrypoint_not_safe");
  assert.equal(unsafe.validation.source_entrypoint_safe, false);

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
  const delta =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: deltaEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
      },
    );
  assert.equal(delta.review_status, "source_entrypoint_row_count_delta");
  assert.equal(delta.validation.source_entrypoint_row_counts_unchanged, false);

  const lineageGapEntrypoint = clone(safeEntrypoint);
  lineageGapEntrypoint.source_binding.source_perspective_writer_compatibility_record_fingerprint =
    null;
  const lineageGap =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: lineageGapEntrypoint,
        operator_decision:
          "accept_entrypoint_for_future_result_record_planning",
      },
    );
  assert.equal(
    lineageGap.review_status,
    "source_entrypoint_lineage_mismatch",
  );
  assert.equal(lineageGap.validation.source_entrypoint_lineage_complete, false);
}

function assertNoWriteAuthority(review) {
  for (const [field, value] of Object.entries(review.authority_boundary)) {
    if (field === "preview_only" || field === "read_only") {
      assert.equal(value, true, `${field} must remain true`);
    } else {
      assert.equal(value, false, `${field} must remain false`);
    }
  }
  for (const [field, value] of Object.entries(
    review.explicit_non_write_boundary,
  )) {
    assert.equal(value, false, `${field} must remain false`);
  }
  for (const [field, value] of Object.entries(review.non_mutation_summary)) {
    assert.equal(value, false, `${field} must remain false`);
  }
}

function assertPackageAndMounting() {
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1"
    ],
    "package script must expose existing writer no-mutation entrypoint review smoke",
  );
  assert.ok(
    source.entrypointSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review",
    ),
    "entrypoint smoke must allow the review follow-on files",
  );
  assert.ok(
    source.dryRunResultSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review",
    ),
    "dry-run result smoke must allow the review follow-on files",
  );
  assert.ok(
    source.agentPanelSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1",
    ),
    "agent workplane panel smoke must allow the review follow-on files",
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
      source_contract_fingerprint: "source-contract-fp-review",
      source_review_fingerprint: "source-review-fp-review",
      source_dry_run_result_fingerprint: "source-dry-run-result-fp-review",
      accepted_mapping_summary_present: true,
      accepted_mapping_contract_fingerprint: "source-contract-fp-review",
      source_perspective_writer_compatibility_receipt_id:
        "writer-compatibility-receipt-review",
      source_perspective_writer_compatibility_record_id:
        "writer-compatibility-record-review",
      source_perspective_writer_compatibility_record_fingerprint:
        "writer-compatibility-record-fp-review",
      source_handoff_seed_fingerprint: "handoff-seed-fp-review",
      source_result_text_fingerprint: "result-text-fp-review",
      intended_future_dry_run_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
      accepted_future_dry_run_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
      safe_adapter_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    },
    source_contract_fingerprint: "source-contract-fp-review",
    source_review_fingerprint: "source-review-fp-review",
    source_dry_run_result_fingerprint: "source-dry-run-result-fp-review",
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
      entrypoint_fingerprint: "entrypoint-fp-review",
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
      "Review the safe no-mutation entrypoint proof before any future explicit result-record write slice.",
  };
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
      `Unexpected changed or untracked file for existing writer no-mutation entrypoint review slice: ${file}`,
    );
    assert.ok(!/^docs\//.test(file), "entrypoint review slice must not edit docs");
    assert.ok(!/^app\/api\//.test(file), "entrypoint review slice must not edit API routes");
    if (!followOnResultRecordMigrationFiles.has(file)) {
      assert.ok(file !== "lib/db/schema.sql", "entrypoint review slice must not edit DB schema");
      assert.ok(!/migrations?/.test(file), "entrypoint review slice must not edit migrations");
    }
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
