#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-review.ts";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
} from "../types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";

const files = {
  entrypointType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint.ts",
  reviewType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  entrypointBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  entrypointPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-panel.tsx",
  reviewPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-panel.tsx",
  resultType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  resultBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  resultPanel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-panel.tsx",
  resultSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1.mjs",
  agentPanelSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1.mjs",
  reviewSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1",
      pass: true,
      safe_no_mutation_entrypoint_available: true,
      no_entrypoint_supplied_still_unsupported: true,
      direct_existing_writer_targets_refused: true,
      unsafe_raw_inputs_refused: true,
      protected_row_count_delta_detected: true,
      existing_writer_called: false,
      changed_files_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint",
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint.v0.1",
    "safe_no_mutation_entrypoint_available",
    "unsupported_no_safe_entrypoint",
    "input_validation_failed",
    "unsafe_existing_writer_target_refused",
    "row_count_delta_detected",
    "manual_specific_current_working_writer_dry_run_adapter",
    "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    "supports_existing_writer_call: false",
    "existing_writer_called: false",
    "can_call_existing_current_working_writer: false",
    "can_call_existing_canonical_state_writer: false",
    "can_write_proof_or_evidence: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "can_execute_codex: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
  ]) {
    assert.ok(
      source.entrypointType.includes(requiredText),
      `entrypoint type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "safe_adapter_noop_harness_does_not_call_existing_mutating_writers",
    "direct_existing_writer_target_refused",
    "raw_payload_forbidden_fields_present",
    "source_dry_run_result_mismatch",
    "protected_row_count_delta_detected",
    "existing_writer_call_not_attempted_by_no_mutation_entrypoint_harness",
    "callback_url",
    "environment_variable",
  ]) {
    assert.ok(
      source.entrypointBuilder.includes(requiredText),
      `entrypoint builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    source.entrypointBuilder,
    /openDatabase|better-sqlite3|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspective|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "entrypoint builder must stay pure and avoid DB, writer, API, provider, GitHub, Codex, and retrieval calls",
  );
  assert.doesNotMatch(
    source.entrypointBuilder,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "entrypoint builder must not contain SQL writes",
  );
  assert.doesNotMatch(
    source.entrypointPanel,
    /useState|useEffect|<button|onClick|fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "entrypoint panel must be passive and avoid controls, fetches, persistence, or route calls",
  );
  assert.ok(
    source.resultType.includes(
      "safe_existing_writer_no_mutation_entrypoint_result?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null",
    ),
    "result input must accept the safe no-mutation entrypoint result",
  );
  assert.ok(
    source.resultBuilder.includes(
      "safe_existing_writer_no_mutation_entrypoint_result_available",
    ),
    "result builder must expose whether supplied entrypoint result is available",
  );
  assert.ok(
    source.resultPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointPanel",
    ),
    "result panel must mount the safe no-mutation entrypoint panel",
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

  assert.equal(unsupported.result_status, "existing_writer_unsupported");
  assert.equal(
    unsupported.execution_decision.existing_writer_support_status,
    "unsupported_no_safe_entrypoint",
  );
  assert.equal(
    unsupported.validation
      .safe_existing_writer_no_mutation_entrypoint_result_present,
    false,
  );

  const entrypoint =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: review,
        existing_writer_dry_run_result: unsupported,
        row_count_before: counts,
        row_count_after: counts,
      },
    );

  assert.equal(
    entrypoint.entrypoint_status,
    "safe_no_mutation_entrypoint_available",
  );
  assert.equal(entrypoint.validation.passed, true);
  assert.equal(entrypoint.validation.source_contract_ready, true);
  assert.equal(entrypoint.validation.source_review_accepted, true);
  assert.equal(entrypoint.validation.source_dry_run_result_validated, true);
  assert.equal(
    entrypoint.validation.source_dry_run_result_matches_contract_review,
    true,
  );
  assert.equal(
    entrypoint.non_mutation_assertions.all_protected_row_counts_unchanged,
    true,
  );
  assert.equal(
    entrypoint.non_mutation_assertions.changed_protected_table_count,
    0,
  );
  assert.equal(entrypoint.execution_decision.existing_writer_called, false);
  assert.equal(entrypoint.non_mutation_assertions.existing_writer_called, false);
  assert.equal(
    entrypoint.supported_capabilities.supports_existing_writer_call,
    false,
  );
  assertNoMutationExternalFlags(entrypoint);

  const resultWithEntrypoint =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: contract,
      existing_writer_dry_run_review: review,
      row_count_before: counts,
      row_count_after: counts,
      safe_existing_writer_no_mutation_entrypoint_result: entrypoint,
    });

  assert.equal(resultWithEntrypoint.result_status, "no_mutation_dry_run_passed");
  assert.equal(resultWithEntrypoint.validation.passed, true);
  assert.equal(
    resultWithEntrypoint.execution_decision.existing_writer_support_status,
    "supported_no_mutation_entrypoint_available",
  );
  assert.equal(resultWithEntrypoint.execution_decision.adapter_runnable_today, true);
  assert.equal(resultWithEntrypoint.execution_decision.existing_writer_called, false);
  assert.equal(
    resultWithEntrypoint.validation
      .safe_existing_writer_no_mutation_entrypoint_result_validated,
    true,
  );
  assert.equal(
    resultWithEntrypoint.validation
      .safe_existing_writer_no_mutation_entrypoint_result_available,
    true,
  );
  assert.equal(
    resultWithEntrypoint.validation
      .safe_existing_writer_no_mutation_entrypoint_result_fingerprint,
    entrypoint.validation.entrypoint_fingerprint,
  );

  const missingReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: null,
        existing_writer_dry_run_result: unsupported,
      },
    );
  assert.equal(missingReview.entrypoint_status, "input_validation_failed");
  assert.equal(missingReview.validation.source_review_present, false);
  assert.equal(missingReview.validation.passed, false);
  assert.ok(missingReview.blocker_reasons.includes("source_review_missing"));

  const rejectedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: contract,
      operator_decision: "reject_existing_writer_dry_run_contract",
    });
  const nonAccepted =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: rejectedReview,
        existing_writer_dry_run_result: unsupported,
      },
    );
  assert.equal(nonAccepted.entrypoint_status, "input_validation_failed");
  assert.equal(nonAccepted.validation.source_review_accepted, false);
  assert.ok(nonAccepted.blocker_reasons.includes("source_review_not_accepted"));

  const mismatchedDryRunResult = clone(unsupported);
  mismatchedDryRunResult.source_binding.source_review_fingerprint = "stale";
  const mismatched =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: review,
        existing_writer_dry_run_result: mismatchedDryRunResult,
      },
    );
  assert.equal(mismatched.entrypoint_status, "input_validation_failed");
  assert.equal(
    mismatched.validation.source_dry_run_result_matches_contract_review,
    false,
  );
  assert.ok(
    mismatched.blocker_reasons.includes("source_dry_run_result_mismatch"),
  );

  const directContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: buildReadyReadback(),
      intended_future_dry_run_target:
        "existing_current_working_perspective_writer_dry_run",
    });
  const directReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: directContract,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    });
  const directResult =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: directContract,
      existing_writer_dry_run_review: directReview,
    });
  const directEntrypoint =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: directContract,
        existing_writer_dry_run_review: directReview,
        existing_writer_dry_run_result: directResult,
      },
    );
  assert.equal(
    directEntrypoint.entrypoint_status,
    "unsafe_existing_writer_target_refused",
  );
  assert.equal(
    directEntrypoint.validation.direct_existing_writer_target_refused,
    true,
  );

  const unsafeRaw =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: review,
        existing_writer_dry_run_result: unsupported,
        candidate_dry_run_adapter_input: {
          source_contract_fingerprint: contract.validation.contract_fingerprint,
          operator_note: "do not persist",
          nested: {
            raw_result_text: "do not persist",
            api_token: "secret",
            callback_url: "https://example.invalid/callback",
            env: { OPENAI_API_KEY: "secret" },
          },
        },
      },
    );
  assert.equal(unsafeRaw.entrypoint_status, "input_validation_failed");
  assert.equal(unsafeRaw.validation.raw_payload_absent, false);
  assert.ok(
    unsafeRaw.validation.raw_payload_forbidden_fields.includes("operator_note"),
  );
  assert.ok(
    unsafeRaw.validation.raw_payload_forbidden_fields.includes(
      "nested.raw_result_text",
    ),
  );
  assert.ok(
    unsafeRaw.validation.raw_payload_forbidden_fields.includes(
      "nested.api_token",
    ),
  );
  assert.ok(
    unsafeRaw.validation.raw_payload_forbidden_fields.includes(
      "nested.callback_url",
    ),
  );
  assert.ok(
    unsafeRaw.validation.raw_payload_forbidden_fields.includes("nested.env"),
  );

  const changedCounts = {
    ...counts,
    perspective_states: counts.perspective_states + 1,
  };
  const deltaEntrypoint =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: review,
        existing_writer_dry_run_result: unsupported,
        row_count_before: counts,
        row_count_after: changedCounts,
      },
    );
  assert.equal(deltaEntrypoint.entrypoint_status, "row_count_delta_detected");
  assert.equal(
    deltaEntrypoint.non_mutation_assertions.all_protected_row_counts_unchanged,
    false,
  );
  assert.ok(
    deltaEntrypoint.blocker_reasons.includes(
      "protected_row_count_delta_detected",
    ),
  );

  const disabled =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypoint(
      {
        existing_writer_dry_run_contract: contract,
        existing_writer_dry_run_review: review,
        existing_writer_dry_run_result: unsupported,
        allow_safe_adapter_noop: false,
      },
    );
  assert.equal(disabled.entrypoint_status, "unsupported_no_safe_entrypoint");
  assert.equal(disabled.validation.passed, true);
  assert.equal(disabled.execution_decision.adapter_runnable_today, false);
}

function assertNoMutationExternalFlags(entrypoint) {
  const proof = entrypoint.non_mutation_assertions;
  for (const field of [
    "existing_writer_called",
    "existing_current_working_writer_called",
    "existing_canonical_state_writer_called",
    "current_working_perspective_updated",
    "existing_canonical_perspective_state_table_mutated",
    "canonical_perspective_state_written",
    "perspective_promoted",
    "perspective_memory_written",
    "work_mutated",
    "dogfood_metrics_written",
    "proof_or_evidence_written",
    "manual_result_records_written",
    "product_write_executed",
    "provider_openai_called",
    "github_called",
    "codex_executed",
    "sources_fetched",
    "retrieval_rag_embeddings_vector_fts_or_crawler_run",
    "raw_operator_note_or_result_persisted",
  ]) {
    assert.equal(proof[field], false, `${field} must remain false`);
  }
}

function assertPackageAndMounting() {
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1"
    ],
    "package script must expose existing writer no-mutation entrypoint smoke",
  );
  assert.ok(
    source.resultSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint",
    ),
    "existing dry-run result smoke must allow the entrypoint follow-on files",
  );
  assert.ok(
    source.agentPanelSmoke.includes(
      "research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1",
    ),
    "agent workplane panel smoke must allow the entrypoint follow-on files",
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
    receipt_id: "writer-compatibility-receipt-entrypoint",
    created_at: "2026-01-01T00:00:00.000Z",
    scope: "project:augnes",
    source_perspective_writer_compatibility_contract_fingerprint:
      "writer-compatibility-contract-fp-entrypoint",
    source_perspective_writer_compatibility_review_fingerprint:
      "writer-compatibility-review-fp-entrypoint",
    source_perspective_state_application_receipt_id:
      "state-application-receipt-entrypoint",
    source_perspective_state_application_record_id:
      "state-application-record-entrypoint",
    source_perspective_state_application_record_fingerprint:
      "state-application-record-fp-entrypoint",
    source_perspective_adapter_receipt_id: "adapter-receipt-entrypoint",
    source_perspective_adapter_record_id: "adapter-record-entrypoint",
    source_perspective_adapter_record_fingerprint:
      "adapter-record-fp-entrypoint",
    source_perspective_state_mutation_receipt_id:
      "state-mutation-receipt-entrypoint",
    source_perspective_state_mutation_record_id:
      "state-mutation-record-entrypoint",
    source_perspective_state_mutation_record_fingerprint:
      "state-mutation-record-fp-entrypoint",
    source_perspective_apply_receipt_id: "apply-receipt-entrypoint",
    source_perspective_apply_record_id: "apply-record-entrypoint",
    source_perspective_apply_record_fingerprint: "apply-record-fp-entrypoint",
    source_canonical_perspective_update_receipt_id:
      "canonical-update-receipt-entrypoint",
    source_canonical_perspective_update_record_id:
      "canonical-update-record-entrypoint",
    source_canonical_perspective_update_record_fingerprint:
      "canonical-update-record-fp-entrypoint",
    source_perspective_relay_receipt_id: "relay-receipt-entrypoint",
    source_perspective_relay_record_id: "relay-record-entrypoint",
    source_perspective_relay_record_fingerprint: "relay-record-fp-entrypoint",
    source_next_work_signal_receipt_id: "signal-receipt-entrypoint",
    source_next_work_signal_record_id: "signal-record-entrypoint",
    source_next_work_signal_record_fingerprint: "signal-record-fp-entrypoint",
    source_next_work_bias_receipt_id: "bias-receipt-entrypoint",
    source_next_work_bias_record_id: "bias-record-entrypoint",
    source_next_work_bias_record_fingerprint: "bias-record-fp-entrypoint",
    source_projection_fingerprint: "projection-fp-entrypoint",
    source_global_dogfood_ledger_receipt_id: "ledger-receipt-entrypoint",
    source_global_dogfood_ledger_record_id: "ledger-record-entrypoint",
    source_metric_snapshot_receipt_id: "metric-receipt-entrypoint",
    source_metric_snapshot_record_id: "metric-record-entrypoint",
    source_manual_receipt_id: "manual-receipt-entrypoint",
    source_handoff_seed_fingerprint: "handoff-seed-fp-entrypoint",
    source_result_text_fingerprint: "result-text-fp-entrypoint",
    source_expected_observed_delta_record_ref: "eod-ref-entrypoint",
    source_reuse_outcome_record_ref: "reuse-ref-entrypoint",
    idempotency_key: "writer-compatibility-idempotency-entrypoint",
    write_status: "committed",
    authority_profile:
      "manual_global_dogfood_perspective_writer_compatibility_record_only",
    receipt_fingerprint: "writer-compatibility-receipt-fp-entrypoint",
    supersedes_receipt_id: null,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
  const record = {
    perspective_writer_compatibility_record_id:
      "writer-compatibility-record-entrypoint",
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
    writer_compatibility_label: "Writer compatibility entrypoint",
    writer_compatibility_rationale: "Writer compatibility rationale entrypoint",
    state_application_label: "State application entrypoint",
    state_application_rationale: "State application rationale entrypoint",
    adapter_label: "Adapter entrypoint",
    adapter_rationale: "Adapter rationale entrypoint",
    mutation_label: "Mutation entrypoint",
    mutation_rationale: "Mutation rationale entrypoint",
    apply_label: "Apply entrypoint",
    apply_rationale: "Apply rationale entrypoint",
    canonical_update_label: "Canonical update entrypoint",
    canonical_update_rationale: "Canonical update rationale entrypoint",
    relay_update_label: "Relay entrypoint",
    relay_update_rationale: "Relay rationale entrypoint",
    recommended_next_work_label: "Next work entrypoint",
    outcome_label: "Outcome entrypoint",
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
    expected_summary: "Expected entrypoint",
    observed_summary: "Observed entrypoint",
    mismatch_or_gap_summary: "Mismatch entrypoint",
    selected_candidate_context_refs: ["candidate-context-entrypoint"],
    source_next_work_candidate_card_ids: ["candidate-card-entrypoint"],
    manual_only_context_refs: ["manual-context-entrypoint"],
    source_line: "source line entrypoint",
    blockers: [],
    warnings: [],
    compatibility_findings: ["compatibility-finding-entrypoint"],
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
      "writer-compatibility-record-fp-entrypoint",
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
      `Unexpected changed or untracked file for existing writer no-mutation entrypoint slice: ${file}`,
    );
    assert.ok(!/^docs\//.test(file), "entrypoint slice must not edit docs");
    assert.ok(!/^app\/api\//.test(file), "entrypoint slice must not edit API routes");
    assert.ok(file !== "lib/db/schema.sql", "entrypoint slice must not edit DB schema");
    assert.ok(!/migrations?/.test(file), "entrypoint slice must not edit migrations");
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
