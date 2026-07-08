#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-state-application-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-state-application-review.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveAdapterSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveAdapter,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-adapter.ts";

const files = {
  contractType:
    "types/research-candidate-manual-global-dogfood-perspective-state-application-contract.ts",
  reviewType:
    "types/research-candidate-manual-global-dogfood-perspective-state-application-review.ts",
  contractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-state-application-contract.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-state-application-review.ts",
  panel:
    "components/research-candidate-manual-global-dogfood-perspective-state-application-contract-panel.tsx",
  adapterReadbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-adapter-readback-panel.tsx",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-state-application-contract-v0-1.mjs",
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
const sample = buildSample();
assertContract(sample);
assertReview(sample);
assertNonTargetTables(sample);
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-perspective-state-application-contract-v0-1",
      pass: true,
      preview_only: true,
      current_working_perspective_changed: false,
      existing_canonical_perspective_state_tables_changed: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      work_mutated: false,
      proof_or_evidence_rows_written: false,
      dogfood_metrics_written: false,
      contract_preview_builders_write_free: true,
      authorized_write_route_present: existsSync(
        "app/api/research-candidate-review/manual-global-dogfood-perspective-state-application/route.ts",
      ),
      handoff_result_fingerprints_preserved: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_state_application_contract",
    "research_candidate_manual_global_dogfood_perspective_state_application_contract.v0.1",
    "source_perspective_adapter_receipt_id",
    "source_perspective_adapter_record_id",
    "source_perspective_adapter_record_fingerprint",
    "source_perspective_state_mutation_receipt_id",
    "source_perspective_apply_receipt_id",
    "source_canonical_perspective_update_receipt_id",
    "source_perspective_relay_receipt_id",
    "source_next_work_signal_receipt_id",
    "source_next_work_bias_receipt_id",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "proposed_state_application_mapping",
    "proposed_existing_current_working_application_compatibility",
    "proposed_existing_canonical_state_application_compatibility",
    "proposed_manual_state_application_write_path",
    "can_write_perspective_state_application_record: false",
    "can_update_current_working_perspective: false",
    "can_mutate_existing_canonical_perspective_state: false",
    "can_write_existing_canonical_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_perspective_adapter_record: false",
    "can_mutate_work: false",
    "can_write_proof_or_evidence: false",
  ]) {
    assert.ok(
      source.contractType.includes(requiredText),
      `state application contract type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "accept_contract_for_future_perspective_state_application_write_slice",
    "needs_perspective_state_application_mapping_revision",
    "reject_perspective_state_application_contract",
    "defer_perspective_state_application_contract",
    "ready_for_future_perspective_state_application_write_slice",
    "blocked_perspective_state_application_contract_not_ready",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "operator_note_persisted: false",
    "no_write_authority: true",
  ]) {
    assert.ok(
      source.reviewType.includes(requiredText),
      `state application review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_adapter_readback_current_working_perspective_already_updated",
    "source_adapter_readback_existing_canonical_state_already_mutated",
    "source_adapter_readback_perspective_promoted",
    "source_adapter_readback_perspective_memory_written",
    "source_adapter_readback_work_mutated",
    "source_adapter_readback_proof_or_evidence_written",
    "source_adapter_readback_metric_or_source_store_mutated",
    "source_adapter_raw_text_or_operator_note_present",
    "adapter_label_missing",
    "adapter_rationale_missing",
    "adapter_storage_path_must_be_manual_specific",
    "adapter_expected_future_write_scope_must_be_record_only",
    "adapter_existing_writer_target_must_not_be_ready",
    "selected_candidate_context_refs_missing",
    "source_next_work_candidate_card_ids_missing",
    "source_handoff_seed_fingerprint_missing",
    "source_result_text_fingerprint_missing",
    "perspective_state_application_explanation_insufficient",
    "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence",
    "source_authority_boundary_not_read_only",
    "existing_current_working_application_lineage_gap",
    "existing_canonical_state_application_lineage_gap",
  ]) {
    assert.ok(
      source.contractBuilder.includes(requiredText),
      `state application contract builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /openDatabase|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspectiveAdapter\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveStateMutation\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveApply\s*\(|writeResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveRelay\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkBias\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "state application contract/review builders must remain pure and avoid writers, DB, API, providers, and retrieval",
  );
  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "state application contract/review builders must not contain SQL writes",
  );
  assert.ok(
    source.adapterReadbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContractPanel",
    ),
    "Perspective adapter readback panel must render state application contract panel",
  );
  assert.doesNotMatch(
    source.panel,
    /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "state application contract panel must not fetch, persist browser state, use clipboard, or mention POST",
  );
  for (const requiredText of [
    "useEffect",
    "reviewContractFingerprint",
    "currentContractFingerprint = contract.validation.contract_fingerprint",
    "review.source_contract_fingerprint === currentContractFingerprint",
    "accepted_mapping_summary.proposed_idempotency_key",
    "contract.idempotency_contract_preview.proposed_idempotency_key",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "setReviewContractFingerprint(currentContractFingerprint)",
    "setReviewContractFingerprint(null)",
  ]) {
    assert.ok(
      source.panel.includes(requiredText),
      `state application panel must include stale-review guard text: ${requiredText}`,
    );
  }
  assert.match(
    source.panel,
    /function\s+updateOperatorDecision[\s\S]*?clearReview\(\);/,
    "operator decision changes must clear cached state application review",
  );
  assert.match(
    source.panel,
    /function\s+updateOperatorNote[\s\S]*?clearReview\(\);/,
    "operator note changes must clear cached state application review",
  );
  assert.match(
    source.panel,
    /reviewContractFingerprint\s*!==\s*currentContractFingerprint[\s\S]*?setReview\(null\);[\s\S]*?setReviewContractFingerprint\(null\);/,
    "contract fingerprint changes must clear cached state application review",
  );
  assert.doesNotMatch(
    source.panel,
    /\{review\s*\?\s*<StateApplicationReviewPreview\s+review=\{review\}/,
    "state application review preview must not render directly from stale review state",
  );
  assert.ok(
    source.panel.includes(
      "currentReview ? (\n          <StateApplicationReviewPreview review={currentReview} />",
    ),
    "state application review preview must render only the current contract-bound review",
  );
  assert.doesNotMatch(
    source.panel,
    /<button[\s\S]{0,260}(Apply current-working Perspective|Update current working Perspective|Write canonical Perspective state|Mutate existing canonical Perspective state|Promote Perspective|Write Perspective Memory|Create work item)/i,
    "state application contract panel must not expose forbidden write controls",
  );
  assert.ok(
    existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-perspective-state-application/route.ts",
    ),
    "authorized state application write slice must expose the narrow same-origin state application route",
  );
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-state-application-contract-v0-1"
    ],
    "package script must expose state application contract smoke",
  );
}

function buildSample() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveAdapterSchema(db);
  const countTables = [
    "research_candidate_manual_global_dogfood_perspective_adapter_receipts",
    "research_candidate_manual_global_dogfood_perspective_adapter_records",
    "research_candidate_manual_global_dogfood_perspective_adapter_rollbacks",
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_memory_items",
    "work_items",
    "work_events",
    "verification_evidence_records",
    "dogfood_metric_snapshot_records",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "delivery_ledger",
  ];
  const count = (table) =>
    tableExists(db, table)
      ? db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
      : 0;
  const readCounts = () =>
    Object.fromEntries(countTables.map((table) => [table, count(table)]));
  insertAdapterSource(db, "one", "committed", 1);
  const beforeCounts = readCounts();
  const readback = readResearchCandidateManualGlobalDogfoodPerspectiveAdapter({
    db,
  });
  const readyContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback,
    });
  const readyContractAgain =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback,
    });
  const acceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview({
      perspective_state_application_contract: readyContract,
      operator_decision:
        "accept_contract_for_future_perspective_state_application_write_slice",
      operator_note: "local only",
    });

  return {
    db,
    beforeCounts,
    afterCounts: readCounts(),
    readback,
    readyContract,
    readyContractAgain,
    acceptedReview,
  };
}

function assertContract({ readback, readyContract, readyContractAgain }) {
  assert.equal(readback.count, 1, "sample should have one adapter receipt");
  assert.equal(
    readyContract.operator_authorization_mode,
    "ready_for_future_perspective_state_application_write_authorization",
  );
  assert.equal(readyContract.validation.passed, true);
  assert.equal(readyContract.proposed_state_application_candidate.writes_now, false);
  assert.equal(
    readyContract.proposed_state_application_candidate
      .would_update_current_working_perspective,
    false,
  );
  assert.equal(
    readyContract.proposed_state_application_candidate
      .would_mutate_existing_canonical_perspective_state,
    false,
  );
  assert.equal(
    readyContract.proposed_state_application_candidate
      .would_promote_perspective,
    false,
  );
  assert.equal(
    readyContract.proposed_state_application_candidate
      .would_write_perspective_memory,
    false,
  );
  assert.equal(
    readyContract.proposed_state_application_candidate.would_mutate_work,
    false,
  );
  assert.equal(
    readyContract.proposed_state_application_candidate
      .would_write_proof_or_evidence,
    false,
  );
  assert.equal(
    readyContract.idempotency_contract_preview.proposed_idempotency_key,
    readyContractAgain.idempotency_contract_preview.proposed_idempotency_key,
    "idempotency key must be deterministic",
  );
  assert.equal(
    readyContract.source_perspective_adapter_receipt_id,
    "adapter-receipt-one",
  );
  assert.equal(
    readyContract.source_perspective_adapter_record_id,
    "adapter-record-one",
  );
  assert.equal(
    readyContract.source_perspective_adapter_record_fingerprint,
    "adapter-record-fp-one",
  );
  assert.equal(
    readyContract.source_handoff_seed_fingerprint,
    "handoff-seed-fp-one",
  );
  assert.equal(
    readyContract.source_result_text_fingerprint,
    "result-text-fp-one",
  );
  assert.equal(
    readyContract.proposed_manual_state_application_write_path
      .recommended_storage_path,
    "manual_specific_perspective_state_application_tables",
  );
  assert.equal(
    readyContract.proposed_manual_state_application_write_path
      .expected_future_write_scope,
    "state_application_record_only",
  );
  assert.equal(
    readyContract
      .proposed_existing_current_working_application_compatibility
      .existing_current_working_perspective_apply_write_compatible,
    false,
  );
  assert.equal(
    readyContract
      .proposed_existing_canonical_state_application_compatibility
      .existing_canonical_perspective_state_writer_compatible,
    false,
  );
  assert.ok(
    readyContract.compatibility_findings.some(
      (finding) =>
        finding.finding_code ===
        "existing_current_working_application_compatibility_false",
    ),
    "current-working compatibility finding must be present",
  );
  assert.ok(
    readyContract.compatibility_findings.some(
      (finding) =>
        finding.finding_code ===
        "existing_canonical_state_application_compatibility_false",
    ),
    "canonical state compatibility finding must be present",
  );

  const noSource =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback: null,
    });
  assert.ok(
    noSource.blocker_reasons.includes(
      "source_perspective_adapter_readback_missing",
    ),
    "no-source readback must block",
  );

  const rolledBackOnly = clone(readback);
  rolledBackOnly.records_by_receipt[0].receipt.write_status = "rolled_back";
  rolledBackOnly.records_by_receipt[0].rolled_back = true;
  rolledBackOnly.latest_active_committed = null;
  const rolledBackContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback: rolledBackOnly,
    });
  assert.ok(
    rolledBackContract.blocker_reasons.includes(
      "source_perspective_adapter_receipt_not_active_committed",
    ),
    "rolled_back adapter source must block",
  );

  const supersededOnly = clone(readback);
  supersededOnly.records_by_receipt[0].receipt.write_status = "superseded";
  supersededOnly.records_by_receipt[0].superseded = true;
  supersededOnly.latest_active_committed = null;
  const supersededContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback: supersededOnly,
    });
  assert.ok(
    supersededContract.blocker_reasons.includes(
      "source_perspective_adapter_receipt_not_active_committed",
    ),
    "superseded-only adapter source must block",
  );

  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.adapter_label = "";
  }, "adapter_label_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.adapter_rationale = "";
  }, "adapter_rationale_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.recommended_storage_path =
      "blocked";
  }, "adapter_storage_path_must_be_manual_specific");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.expected_future_write_scope =
      "current_working_perspective_update";
  }, "adapter_expected_future_write_scope_must_be_record_only");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.selected_candidate_context_refs =
      [];
  }, "selected_candidate_context_refs_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.source_next_work_candidate_card_ids =
      [];
  }, "source_next_work_candidate_card_ids_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.receipt.source_handoff_seed_fingerprint = "";
  }, "source_handoff_seed_fingerprint_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.receipt.source_result_text_fingerprint = "";
  }, "source_result_text_fingerprint_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.expected_summary = null;
  }, "perspective_state_application_explanation_insufficient");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_adapter_record.manual_only_context_refs =
      ["proof:forbidden"];
  }, "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence");

  for (const [flag, blocker] of [
    [
      "current_working_perspective_updated",
      "source_adapter_readback_current_working_perspective_already_updated",
    ],
    [
      "existing_canonical_perspective_state_table_mutated",
      "source_adapter_readback_existing_canonical_state_already_mutated",
    ],
    ["canonical_perspective_state_written", "source_adapter_readback_existing_canonical_state_already_mutated"],
    ["perspective_promoted", "source_adapter_readback_perspective_promoted"],
    ["perspective_memory_written", "source_adapter_readback_perspective_memory_written"],
    ["work_mutated", "source_adapter_readback_work_mutated"],
    ["proof_or_evidence_rows_written", "source_adapter_readback_proof_or_evidence_written"],
    ["dogfood_metrics_written", "source_adapter_readback_metric_or_source_store_mutated"],
    ["global_dogfood_ledger_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["metric_snapshot_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["next_work_signal_decision_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["next_work_bias_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["perspective_relay_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["canonical_perspective_update_record_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["perspective_apply_record_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["perspective_state_mutation_record_mutated", "source_adapter_readback_metric_or_source_store_mutated"],
    ["product_write_executed", "source_adapter_product_write_executed"],
    ["raw_manual_note_text_present", "source_adapter_raw_text_or_operator_note_present"],
    ["raw_result_report_text_present", "source_adapter_raw_text_or_operator_note_present"],
    ["operator_notes_persisted", "source_adapter_raw_text_or_operator_note_present"],
  ]) {
    assertBlocks(readback, (next) => {
      next[flag] = true;
    }, blocker);
  }

  const existingCurrentWorkingTarget =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback,
      intended_future_state_application_target:
        "existing_current_working_perspective_application",
    });
  assert.ok(
    existingCurrentWorkingTarget.blocker_reasons.includes(
      "adapter_existing_writer_target_must_not_be_ready",
    ),
    "existing current-working application target must be compatibility-only",
  );
  const existingCanonicalTarget =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback,
      intended_future_state_application_target:
        "existing_canonical_perspective_state_application",
    });
  assert.ok(
    existingCanonicalTarget.blocker_reasons.includes(
      "adapter_existing_writer_target_must_not_be_ready",
    ),
    "existing canonical state application target must be compatibility-only",
  );
}

function assertReview({ readyContract, acceptedReview }) {
  assert.equal(
    acceptedReview.review_status,
    "ready_for_future_perspective_state_application_write_slice",
  );
  assert.equal(acceptedReview.validation.operator_note_persisted, false);
  assert.equal(acceptedReview.validation.no_write_authority, true);
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_contract_fingerprint,
    readyContract.validation.contract_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .source_perspective_adapter_receipt_id,
    readyContract.source_perspective_adapter_receipt_id,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .source_perspective_adapter_record_id,
    readyContract.source_perspective_adapter_record_id,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .source_perspective_adapter_record_fingerprint,
    readyContract.source_perspective_adapter_record_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_handoff_seed_fingerprint,
    readyContract.source_handoff_seed_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_result_text_fingerprint,
    readyContract.source_result_text_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.proposed_idempotency_key,
    readyContract.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .intended_future_state_application_target,
    readyContract.proposed_state_application_mapping
      .intended_future_state_application_target,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.state_application_label,
    readyContract.proposed_state_application_mapping.state_application_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.adapter_label,
    readyContract.proposed_state_application_mapping.adapter_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.mutation_label,
    readyContract.proposed_state_application_mapping.mutation_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.apply_label,
    readyContract.proposed_state_application_mapping.apply_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.canonical_update_label,
    readyContract.proposed_state_application_mapping.canonical_update_label,
  );

  for (const decision of [
    "needs_perspective_state_application_mapping_revision",
    "reject_perspective_state_application_contract",
    "defer_perspective_state_application_contract",
  ]) {
    const review =
      buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview({
        perspective_state_application_contract: readyContract,
        operator_decision: decision,
      });
    assert.notEqual(
      review.review_status,
      "ready_for_future_perspective_state_application_write_slice",
    );
    assert.equal(review.accepted_mapping_summary, null);
  }

  const blocked =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback: null,
    });
  const blockedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview({
      perspective_state_application_contract: blocked,
      operator_decision:
        "accept_contract_for_future_perspective_state_application_write_slice",
    });
  assert.notEqual(
    blockedReview.review_status,
    "ready_for_future_perspective_state_application_write_slice",
  );
  assert.equal(blockedReview.accepted_mapping_summary, null);
}

function assertNonTargetTables({ beforeCounts, afterCounts }) {
  for (const [table, before] of Object.entries(beforeCounts)) {
    assert.equal(afterCounts[table], before, `${table} count must be unchanged`);
  }
}

function assertDocsAndPackage() {
  assert.ok(
    source.docs.includes("Manual Perspective State Application Contract Preview v0.1 Pointer"),
    "docs must include state application contract pointer",
  );
  assert.ok(
    source.docs.includes("preview-only"),
    "docs must describe preview-only boundary",
  );
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-state-application-contract-v0-1"
    ],
    "package.json must include state application contract smoke",
  );
}

function assertBlocks(readback, mutate, expectedBlocker) {
  const next = clone(readback);
  mutate(next);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback: next,
    });
  assert.ok(
    contract.blocker_reasons.includes(expectedBlocker),
    `${expectedBlocker} must block`,
  );
  assert.notEqual(
    contract.operator_authorization_mode,
    "ready_for_future_perspective_state_application_write_authorization",
  );
}

function insertAdapterSource(db, suffix, writeStatus, index) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_adapter_receipts (
        receipt_id,
        created_at,
        scope,
        source_perspective_adapter_contract_fingerprint,
        source_perspective_adapter_review_fingerprint,
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
        'manual_global_dogfood_perspective_adapter_write_v0_1',
        @receipt_fp,
        NULL,
        NULL,
        NULL
      )
    `,
  ).run(adapterReceiptParams(suffix, writeStatus, index));

  if (writeStatus !== "rolled_back") {
    db.prepare(
      `
        INSERT INTO research_candidate_manual_global_dogfood_perspective_adapter_records (
          perspective_adapter_record_id,
          receipt_id,
          created_at,
          scope,
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
          intended_future_adapter_target,
          default_future_adapter_target,
          adapter_scope_hint,
          adapter_strength_hint,
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
          existing_current_working_adapter_compatibility_json,
          existing_canonical_state_adapter_compatibility_json,
          manual_adapter_write_path_json,
          source_refs_json,
          authority_profile,
          perspective_adapter_record_fingerprint
        ) VALUES (
          @record_id,
          @receipt_id,
          @created_at,
          'project:augnes',
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
          'manual_specific_canonical_state_adapter',
          'manual_specific_canonical_state_adapter',
          'manual_specific_canonical_state_adapter',
          'medium',
          'adapter_record_only',
          'manual_specific_perspective_adapter_tables',
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
          '{"recommended_storage_path":"manual_specific_perspective_adapter_tables"}',
          '["source-ref-one"]',
          'manual_global_dogfood_perspective_adapter_write_v0_1',
          @record_fp
        )
      `,
    ).run(adapterRecordParams(suffix, index));
  }
}

function adapterReceiptParams(suffix, writeStatus, index) {
  return {
    receipt_id: `adapter-receipt-${suffix}`,
    created_at: `2026-07-08T00:00:0${index}.000Z`,
    contract_fp: `adapter-contract-fp-${suffix}`,
    review_fp: `adapter-review-fp-${suffix}`,
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
    idempotency_key: `adapter-idempotency-${suffix}`,
    write_status: writeStatus,
    receipt_fp: `adapter-receipt-fp-${suffix}`,
  };
}

function adapterRecordParams(suffix, index) {
  const receipt = adapterReceiptParams(suffix, "committed", index);
  return {
    ...receipt,
    record_id: `adapter-record-${suffix}`,
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
    record_fp: `adapter-record-fp-${suffix}`,
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
