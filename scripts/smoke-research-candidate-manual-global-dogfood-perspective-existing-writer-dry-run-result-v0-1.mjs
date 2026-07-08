#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-review.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
} from "../types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";

const files = {
  resultType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  resultBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  resultPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-panel.tsx",
  agentPanelSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1",
      pass: true,
      result_artifact_present: true,
      existing_writer_unsupported_when_no_safe_entrypoint: true,
      existing_writer_called: false,
      row_count_delta_detected: true,
      raw_result_text_refused: true,
      source_chain_mismatch_refused: true,
      changed_files_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_result",
    "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_result.v0.1",
    "no_mutation_dry_run_passed",
    "existing_writer_unsupported",
    "source_contract_not_ready",
    "source_review_not_accepted",
    "source_chain_mismatch",
    "raw_payload_refused",
    "row_count_delta_detected",
    "protected_table_row_counts",
    "existing_writer_called: false",
    "can_write_existing_writer_dry_run_result_record: false",
    "can_run_existing_writer_dry_run: false",
    "can_call_existing_current_working_writer: false",
    "can_call_existing_canonical_state_writer: false",
    "can_update_current_working_perspective: false",
    "can_mutate_existing_canonical_perspective_state: false",
    "can_write_perspective_memory: false",
    "can_write_proof_or_evidence: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "can_execute_codex: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
  ]) {
    assert.ok(
      source.resultType.includes(requiredText),
      `result type must include ${requiredText}`,
    );
  }

  for (const requiredTable of [
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_memory_items",
    "work_items",
    "work_events",
    "verification_evidence_records",
    "dogfood_metric_snapshot_records",
    "delivery_ledger",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_application_receipts",
    "research_candidate_manual_global_dogfood_perspective_adapter_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
    "research_candidate_manual_global_dogfood_perspective_apply_receipts",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    "research_candidate_manual_global_dogfood_metric_snapshot_records",
  ]) {
    assert.ok(
      source.resultType.includes(requiredTable),
      `result type must protect row count table ${requiredTable}`,
    );
  }

  for (const requiredText of [
    "safe_existing_writer_no_mutation_entrypoint_missing",
    "existing_current_working_writer_dry_run_entrypoint_missing",
    "existing_canonical_state_writer_dry_run_entrypoint_missing",
    "existing_current_working_writer_input_construction_false",
    "existing_canonical_state_writer_input_construction_false",
    "direct_existing_writer_target_refused",
    "raw_payload_forbidden_fields_present",
    "protected_row_count_delta_detected",
    "source_contract_fingerprint_mismatch",
    "accepted_mapping_summary_mismatch",
    "existing_writer_call_not_attempted_by_no_mutation_result_harness",
  ]) {
    assert.ok(
      source.resultBuilder.includes(requiredText),
      `result builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    source.resultBuilder,
    /openDatabase|better-sqlite3|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspective|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "result builder must stay pure and avoid DB, writer, API, provider, GitHub, Codex, and retrieval calls",
  );
  assert.doesNotMatch(
    source.resultBuilder,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "result builder must not contain SQL writes",
  );
  assert.doesNotMatch(
    source.resultPanel,
    /useState|useEffect|<button|onClick|fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "result panel must be passive and avoid controls, fetches, persistence, or route calls",
  );
}

function assertBehavior() {
  const { contract, review } = buildReadyContractAndReview();
  const counts = buildStableRowCounts();
  const unsupported =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
      row_count_before: counts,
      row_count_after: counts,
    });
  const unsupportedAgain =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
      row_count_before: counts,
      row_count_after: counts,
    });

  assert.equal(unsupported.result_status, "existing_writer_unsupported");
  assert.equal(unsupported.validation.passed, true);
  assert.equal(
    unsupported.execution_decision.existing_writer_support_status,
    "unsupported_no_safe_entrypoint",
  );
  assert.equal(unsupported.execution_decision.adapter_runnable_today, false);
  assert.equal(unsupported.execution_decision.existing_writer_called, false);
  assert.equal(unsupported.non_mutation_proof.existing_writer_called, false);
  assert.equal(
    unsupported.non_mutation_proof.all_protected_row_counts_unchanged,
    true,
  );
  assert.equal(
    unsupported.non_mutation_proof.changed_protected_table_count,
    0,
  );
  assert.equal(
    unsupported.validation.result_fingerprint,
    unsupportedAgain.validation.result_fingerprint,
    "result fingerprint must be deterministic",
  );
  assert.ok(
    unsupported.execution_decision.runnable_today_blockers.includes(
      "safe_existing_writer_no_mutation_entrypoint_missing",
    ),
  );
  assert.ok(
    unsupported.execution_decision.runnable_today_blockers.includes(
      "existing_current_working_writer_dry_run_entrypoint_missing",
    ),
  );
  assert.ok(
    unsupported.execution_decision.runnable_today_blockers.includes(
      "existing_canonical_state_writer_dry_run_entrypoint_missing",
    ),
  );

  const defaultCounts =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
    });
  assert.equal(defaultCounts.result_status, "existing_writer_unsupported");
  assert.equal(
    defaultCounts.non_mutation_proof.snapshot_source,
    "default_empty_in_memory_noop",
  );
  assert.equal(defaultCounts.validation.passed, true);

  const notAcceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: contract,
      operator_decision: "defer_existing_writer_dry_run_contract",
    });
  const notAcceptedResult =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: notAcceptedReview,
      row_count_before: counts,
      row_count_after: counts,
    });
  assert.equal(notAcceptedResult.result_status, "source_review_not_accepted");
  assert.ok(
    notAcceptedResult.blocker_reasons.includes("source_review_not_accepted"),
  );

  const staleReview = clone(review);
  staleReview.source_contract_fingerprint = "stale-contract-fingerprint";
  staleReview.accepted_mapping_summary.source_contract_fingerprint =
    "stale-contract-fingerprint";
  const staleResult =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: staleReview,
      row_count_before: counts,
      row_count_after: counts,
    });
  assert.equal(staleResult.result_status, "source_chain_mismatch");
  assert.ok(
    staleResult.blocker_reasons.includes(
      "source_contract_fingerprint_mismatch",
    ),
  );

  const rawPayloadResult =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
      row_count_before: counts,
      row_count_after: counts,
      candidate_input: {
        source_result_text_fingerprint: "fingerprint-is-ok",
        raw_result_text: "must not be accepted",
        operator_note: "must not be accepted",
      },
    });
  assert.equal(rawPayloadResult.result_status, "raw_payload_refused");
  assert.deepEqual(rawPayloadResult.validation.raw_payload_forbidden_fields, [
    "operator_note",
    "raw_result_text",
  ]);

  const afterDelta = {
    ...counts,
    perspective_states: counts.perspective_states + 1,
  };
  const rowDeltaResult =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
      row_count_before: counts,
      row_count_after: afterDelta,
    });
  assert.equal(rowDeltaResult.result_status, "row_count_delta_detected");
  assert.equal(
    rowDeltaResult.non_mutation_proof.changed_protected_table_count,
    1,
  );

  const directExistingTargetContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: buildReadyReadback(),
      intended_future_dry_run_target:
        "existing_canonical_perspective_state_writer_dry_run",
    });
  const directExistingTargetReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: directExistingTargetContract,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    });
  const directExistingTargetResult =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: directExistingTargetContract,
      existing_writer_dry_run_review: directExistingTargetReview,
      row_count_before: counts,
      row_count_after: counts,
    });
  assert.equal(
    directExistingTargetResult.validation.direct_existing_writer_target_refused,
    true,
  );
  assert.ok(
    directExistingTargetResult.blocker_reasons.includes(
      "direct_existing_writer_target_refused",
    ),
  );
  assert.notEqual(
    directExistingTargetResult.result_status,
    "no_mutation_dry_run_passed",
  );

  const supportedEntryPointStillUnsupported =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
      row_count_before: counts,
      row_count_after: counts,
      safe_existing_writer_no_mutation_entrypoint: {
        detected: true,
        entrypoint_id: "safe-entrypoint-not-enough-without-dry-run-compat",
        supports_no_mutation_assertions: true,
        supports_row_count_snapshot: true,
        supports_transaction_rollback: true,
      },
    });
  assert.equal(
    supportedEntryPointStillUnsupported.result_status,
    "existing_writer_unsupported",
  );
  assert.equal(
    supportedEntryPointStillUnsupported.validation.existing_writer_called,
    false,
  );
}

function assertPackageAndMounting() {
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1"
    ],
    "package script must expose existing writer dry-run result smoke",
  );
  assert.ok(
    source.contractPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultPanel",
    ),
    "contract panel must mount the no-mutation result panel",
  );
  assert.ok(
    source.agentPanelSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1",
    ),
    "agent workplane panel smoke must allow the result follow-on files",
  );
}

function buildReadyContractAndReview() {
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: buildReadyReadback(),
    });
  assert.equal(contract.validation.passed, true);
  const review =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: contract,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    });
  assert.equal(
    review.review_status,
    "ready_for_future_existing_writer_dry_run_adapter_write_slice",
  );
  return { contract, review };
}

function buildReadyReadback() {
  const receipt = {
    receipt_id: "writer-compatibility-receipt-result",
    created_at: "2026-01-01T00:00:00.000Z",
    scope: "project:augnes",
    source_perspective_writer_compatibility_contract_fingerprint:
      "writer-compatibility-contract-fp-result",
    source_perspective_writer_compatibility_review_fingerprint:
      "writer-compatibility-review-fp-result",
    source_perspective_state_application_receipt_id:
      "state-application-receipt-result",
    source_perspective_state_application_record_id:
      "state-application-record-result",
    source_perspective_state_application_record_fingerprint:
      "state-application-record-fp-result",
    source_perspective_adapter_receipt_id: "adapter-receipt-result",
    source_perspective_adapter_record_id: "adapter-record-result",
    source_perspective_adapter_record_fingerprint: "adapter-record-fp-result",
    source_perspective_state_mutation_receipt_id:
      "state-mutation-receipt-result",
    source_perspective_state_mutation_record_id:
      "state-mutation-record-result",
    source_perspective_state_mutation_record_fingerprint:
      "state-mutation-record-fp-result",
    source_perspective_apply_receipt_id: "apply-receipt-result",
    source_perspective_apply_record_id: "apply-record-result",
    source_perspective_apply_record_fingerprint: "apply-record-fp-result",
    source_canonical_perspective_update_receipt_id:
      "canonical-update-receipt-result",
    source_canonical_perspective_update_record_id:
      "canonical-update-record-result",
    source_canonical_perspective_update_record_fingerprint:
      "canonical-update-record-fp-result",
    source_perspective_relay_receipt_id: "relay-receipt-result",
    source_perspective_relay_record_id: "relay-record-result",
    source_perspective_relay_record_fingerprint: "relay-record-fp-result",
    source_next_work_signal_receipt_id: "signal-receipt-result",
    source_next_work_signal_record_id: "signal-record-result",
    source_next_work_signal_record_fingerprint: "signal-record-fp-result",
    source_next_work_bias_receipt_id: "bias-receipt-result",
    source_next_work_bias_record_id: "bias-record-result",
    source_next_work_bias_record_fingerprint: "bias-record-fp-result",
    source_projection_fingerprint: "projection-fp-result",
    source_global_dogfood_ledger_receipt_id: "ledger-receipt-result",
    source_global_dogfood_ledger_record_id: "ledger-record-result",
    source_metric_snapshot_receipt_id: "metric-receipt-result",
    source_metric_snapshot_record_id: "metric-record-result",
    source_manual_receipt_id: "manual-receipt-result",
    source_handoff_seed_fingerprint: "handoff-seed-fp-result",
    source_result_text_fingerprint: "result-text-fp-result",
    source_expected_observed_delta_record_ref: "eod-ref-result",
    source_reuse_outcome_record_ref: "reuse-ref-result",
    idempotency_key: "writer-compatibility-idempotency-result",
    write_status: "committed",
    authority_profile:
      "manual_global_dogfood_perspective_writer_compatibility_record_only",
    receipt_fingerprint: "writer-compatibility-receipt-fp-result",
    supersedes_receipt_id: null,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
  const record = {
    perspective_writer_compatibility_record_id:
      "writer-compatibility-record-result",
    receipt_id: receipt.receipt_id,
    created_at: receipt.created_at,
    scope: "project:augnes",
    source_perspective_state_application_receipt_id:
      receipt.source_perspective_state_application_receipt_id,
    source_perspective_state_application_record_id:
      receipt.source_perspective_state_application_record_id,
    source_perspective_adapter_receipt_id:
      receipt.source_perspective_adapter_receipt_id,
    source_perspective_adapter_record_id:
      receipt.source_perspective_adapter_record_id,
    source_perspective_state_mutation_receipt_id:
      receipt.source_perspective_state_mutation_receipt_id,
    source_perspective_state_mutation_record_id:
      receipt.source_perspective_state_mutation_record_id,
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
    source_next_work_bias_receipt_id: receipt.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id: receipt.source_next_work_bias_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id:
      receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    writer_compatibility_label: "Writer compatibility result",
    writer_compatibility_rationale: "Writer compatibility rationale result",
    state_application_label: "State application result",
    state_application_rationale: "State application rationale result",
    adapter_label: "Adapter result",
    adapter_rationale: "Adapter rationale result",
    mutation_label: "Mutation result",
    mutation_rationale: "Mutation rationale result",
    apply_label: "Apply result",
    apply_rationale: "Apply rationale result",
    canonical_update_label: "Canonical update result",
    canonical_update_rationale: "Canonical update rationale result",
    relay_update_label: "Relay result",
    relay_update_rationale: "Relay rationale result",
    recommended_next_work_label: "Next work result",
    outcome_label: "Outcome result",
    outcome_signal: "positive",
    intended_future_writer_target:
      "manual_specific_existing_canonical_state_writer_adapter",
    default_future_writer_target:
      "manual_specific_existing_canonical_state_writer_adapter",
    writer_compatibility_scope_hint:
      "manual_specific_existing_canonical_state_writer_adapter",
    writer_compatibility_strength_hint: "medium",
    expected_future_write_scope: "writer_compatibility_record_only",
    recommended_storage_path:
      "manual_specific_perspective_writer_compatibility_tables",
    expected_summary: "Expected result",
    observed_summary: "Observed result",
    mismatch_or_gap_summary: "Mismatch result",
    selected_candidate_context_refs: ["candidate-context-result"],
    source_next_work_candidate_card_ids: ["candidate-card-result"],
    manual_only_context_refs: ["manual-context-result"],
    source_line: "source line result",
    blockers: [],
    warnings: [],
    compatibility_findings: ["compatibility-finding-result"],
    existing_current_working_writer_compatibility: {
      existing_current_working_perspective_apply_write_compatible: false,
    },
    existing_canonical_state_writer_compatibility: {
      existing_canonical_perspective_state_writer_compatible: false,
    },
    manual_writer_compatibility_path: {
      recommended_storage_path:
        "manual_specific_perspective_writer_compatibility_tables",
    },
    source_refs: [receipt.receipt_id],
    authority_profile:
      "manual_global_dogfood_perspective_writer_compatibility_record_only",
    perspective_writer_compatibility_record_fingerprint:
      "writer-compatibility-record-fp-result",
  };
  const recordSet = {
    receipt,
    perspective_writer_compatibility_record: record,
    rollback: null,
    superseded: false,
    rolled_back: false,
  };
  return {
    readback_kind:
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_readback",
    readback_version:
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_readback.v0.1",
    scope: "project:augnes",
    storage_path: "manual_specific_perspective_writer_compatibility_tables",
    records_by_receipt: [recordSet],
    latest_receipts: [receipt],
    latest_active_committed: recordSet,
    count: 1,
    authority_boundary: createWriterCompatibilityAuthorityBoundary(),
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    operator_notes_persisted: false,
    perspective_writer_compatibility_record_written: true,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_state_application_record_mutated: false,
    perspective_adapter_record_mutated: false,
    perspective_state_mutation_record_mutated: false,
    perspective_apply_record_mutated: false,
    canonical_perspective_update_record_mutated: false,
    perspective_relay_mutated: false,
    next_work_bias_mutated: false,
    work_mutated: false,
    dogfood_metrics_written: false,
    global_dogfood_ledger_mutated: false,
    metric_snapshot_mutated: false,
    next_work_signal_decision_mutated: false,
    proof_or_evidence_rows_written: false,
    product_write_executed: false,
  };
}

function createWriterCompatibilityAuthorityBoundary() {
  return {
    can_write_perspective_writer_compatibility_record: true,
    can_write_perspective_writer_compatibility_receipt: true,
    can_write_perspective_writer_compatibility_rollback_metadata: true,
    source_of_truth: false,
    can_call_existing_current_working_writer: false,
    can_call_existing_canonical_state_writer: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_write_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_state_application_record: false,
    can_mutate_perspective_adapter_record: false,
    can_mutate_perspective_state_mutation_record: false,
    can_mutate_perspective_apply_record: false,
    can_mutate_canonical_perspective_update_record: false,
    can_write_perspective_relay: false,
    can_mutate_perspective_relay: false,
    can_write_next_work_bias: false,
    can_mutate_next_work_bias: false,
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
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

function buildStableRowCounts() {
  return Object.fromEntries(
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES.map(
      (table) => [
        table,
        table ===
          "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts" ||
        table ===
          "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records"
          ? 1
          : 0,
      ],
    ),
  );
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
      `Unexpected changed or untracked file for existing writer dry-run result slice: ${file}`,
    );
    assert.ok(!/^docs\//.test(file), "result slice must not edit docs");
    assert.ok(!/^app\/api\//.test(file), "result slice must not edit API routes");
    assert.ok(file !== "lib/db/schema.sql", "result slice must not edit DB schema");
    assert.ok(!/migrations?/.test(file), "result slice must not edit migrations");
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
