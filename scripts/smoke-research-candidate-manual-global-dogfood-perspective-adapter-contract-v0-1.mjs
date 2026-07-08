#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-adapter-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-adapter-review.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateMutationSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-state-mutation.ts";

const files = {
  contractType:
    "types/research-candidate-manual-global-dogfood-perspective-adapter-contract.ts",
  reviewType:
    "types/research-candidate-manual-global-dogfood-perspective-adapter-review.ts",
  contractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-adapter-contract.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-adapter-review.ts",
  panel:
    "components/research-candidate-manual-global-dogfood-perspective-adapter-contract-panel.tsx",
  stateMutationReadbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-state-mutation-readback-panel.tsx",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-adapter-contract-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-perspective-adapter-contract-v0-1",
      pass: true,
      preview_only: true,
      current_working_perspective_changed: false,
      existing_canonical_perspective_state_tables_changed: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      work_mutated: false,
      proof_or_evidence_rows_written: false,
      dogfood_metrics_written: false,
      schema_or_api_write_route_added: false,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_adapter_contract",
    "research_candidate_manual_global_dogfood_perspective_adapter_contract.v0.1",
    "source_perspective_state_mutation_receipt_id",
    "source_perspective_state_mutation_record_id",
    "source_perspective_state_mutation_record_fingerprint",
    "source_perspective_apply_receipt_id",
    "source_perspective_apply_record_id",
    "source_canonical_perspective_update_receipt_id",
    "source_perspective_relay_receipt_id",
    "source_next_work_signal_receipt_id",
    "source_next_work_bias_receipt_id",
    "proposed_adapter_mapping",
    "proposed_existing_current_working_adapter_compatibility",
    "proposed_existing_canonical_state_adapter_compatibility",
    "proposed_manual_adapter_write_path",
    "can_write_perspective_adapter_record: false",
    "can_update_current_working_perspective: false",
    "can_write_existing_canonical_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_work: false",
    "can_write_proof_or_evidence: false",
  ]) {
    assert.ok(
      source.contractType.includes(requiredText),
      `adapter contract type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "accept_contract_for_future_perspective_adapter_write_slice",
    "needs_perspective_adapter_mapping_revision",
    "reject_perspective_adapter_contract",
    "defer_perspective_adapter_contract",
    "ready_for_future_perspective_adapter_write_slice",
    "blocked_perspective_adapter_contract_not_ready",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "operator_note_persisted: false",
    "no_write_authority: true",
  ]) {
    assert.ok(
      source.reviewType.includes(requiredText),
      `adapter review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_handoff_seed_fingerprint",
    "perspective_adapter_contract.source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "perspective_adapter_contract.source_result_text_fingerprint",
  ]) {
    assert.ok(
      source.reviewBuilder.includes(requiredText),
      `adapter review builder must include accepted summary binding for ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_state_mutation_readback_current_working_perspective_already_updated",
    "source_state_mutation_readback_direct_canonical_state_already_mutated",
    "source_state_mutation_readback_perspective_promoted",
    "source_state_mutation_readback_perspective_memory_written",
    "source_state_mutation_readback_work_mutated",
    "source_state_mutation_readback_proof_or_evidence_written",
    "source_state_mutation_readback_metric_or_source_store_mutated",
    "source_state_mutation_raw_text_or_operator_note_present",
    "mutation_label_missing",
    "mutation_rationale_missing",
    "intended_future_mutation_target_must_be_canonical_perspective_state",
    "mutation_scope_hint_must_be_canonical_perspective_state",
    "selected_candidate_context_refs_missing",
    "source_next_work_candidate_card_ids_missing",
    "perspective_adapter_explanation_insufficient",
    "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence",
    "source_authority_boundary_not_read_only",
    "existing_current_working_adapter_lineage_gap",
    "existing_canonical_state_adapter_lineage_gap",
  ]) {
    assert.ok(
      source.contractBuilder.includes(requiredText),
      `adapter contract builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /openDatabase|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspectiveStateMutation\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveApply\s*\(|writeResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveRelay\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkBias\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "adapter contract/review builders must remain pure and avoid writers, DB, API, providers, and retrieval",
  );
  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "adapter contract/review builders must not contain SQL writes",
  );
  assert.ok(
    source.stateMutationReadbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContractPanel",
    ),
    "Perspective state mutation readback panel must render adapter contract panel",
  );
  assert.doesNotMatch(
    source.panel,
    /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "adapter contract panel must not fetch, persist browser state, use clipboard, or mention POST",
  );
  for (const requiredText of [
    "useEffect",
    "reviewContractFingerprint",
    "currentContractFingerprint = contract.validation.contract_fingerprint",
    "review.source_contract_fingerprint === currentContractFingerprint",
    "accepted_mapping_summary.proposed_idempotency_key",
    "contract.idempotency_contract_preview.proposed_idempotency_key",
    "setReviewContractFingerprint(currentContractFingerprint)",
    "setReviewContractFingerprint(null)",
  ]) {
    assert.ok(
      source.panel.includes(requiredText),
      `adapter panel must include stale-review guard text: ${requiredText}`,
    );
  }
  assert.match(
    source.panel,
    /function\s+updateOperatorDecision[\s\S]*?clearReview\(\);/,
    "operator decision changes must clear cached adapter review",
  );
  assert.match(
    source.panel,
    /function\s+updateOperatorNote[\s\S]*?clearReview\(\);/,
    "operator note changes must clear cached adapter review",
  );
  assert.match(
    source.panel,
    /reviewContractFingerprint\s*!==\s*currentContractFingerprint[\s\S]*?setReview\(null\);[\s\S]*?setReviewContractFingerprint\(null\);/,
    "contract fingerprint changes must clear cached adapter review",
  );
  assert.doesNotMatch(
    source.panel,
    /\{review\s*\?\s*<AdapterReviewPreview\s+review=\{review\}/,
    "adapter review preview must not render directly from stale review state",
  );
  assert.ok(
    source.panel.includes(
      "{currentReview ? <AdapterReviewPreview review={currentReview} /> : null}",
    ),
    "adapter review preview must render only the current contract-bound review",
  );
  assert.doesNotMatch(
    source.panel,
    /<button[\s\S]{0,260}(Apply current-working Perspective|Update current working Perspective|Write canonical Perspective state|Mutate existing canonical Perspective state|Promote Perspective|Write Perspective Memory|Create work item)/i,
    "adapter contract panel must not expose forbidden write controls",
  );
  assert.ok(
    !existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-perspective-adapter",
    ),
    "adapter contract preview must not add an API write route",
  );
}

function buildSample() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateMutationSchema(db);
  const countTables = [
    "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_records",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks",
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
  insertPerspectiveStateMutationSource(db, "committed");
  const countsBefore = readCounts();
  const readback =
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db,
      limit: 10,
    });
  const readyContract = buildContract(readback);
  const readyContractAgain = buildContract(readback);
  const acceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: readyContract,
      operator_decision:
        "accept_contract_for_future_perspective_adapter_write_slice",
      operator_note: "local note should not persist",
    });
  const revisionReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: readyContract,
      operator_decision: "needs_perspective_adapter_mapping_revision",
    });
  const rejectReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: readyContract,
      operator_decision: "reject_perspective_adapter_contract",
    });
  const deferReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: readyContract,
      operator_decision: "defer_perspective_adapter_contract",
    });
  const noSourceContract = buildContract({
    ...clone(readback),
    records_by_receipt: [],
    latest_receipts: [],
    latest_active_committed: null,
    count: 0,
  });
  setStateMutationStatus(db, "rolled_back");
  const rolledBackContract = buildContract(
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db,
      limit: 10,
    }),
  );
  setStateMutationStatus(db, "superseded");
  const supersededContract = buildContract(
    readResearchCandidateManualGlobalDogfoodPerspectiveStateMutation({
      db,
      limit: 10,
    }),
  );
  setStateMutationStatus(db, "committed");

  const missingLabelContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.mutation_label = "";
    }),
  );
  const missingRationaleContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.mutation_rationale = "";
    }),
  );
  const currentWorkingMutationTargetContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.intended_future_mutation_target = "current_working_perspective";
    }),
  );
  const currentWorkingScopeContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.mutation_scope_hint = "current_working_perspective";
    }),
  );
  const missingContextContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.selected_candidate_context_refs = [];
    }),
  );
  const missingCardsContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.source_next_work_candidate_card_ids = [];
    }),
  );
  const insufficientExplanationContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.expected_summary = null;
      record.observed_summary = null;
      record.mismatch_or_gap_summary = null;
    }),
  );
  const manualProofContract = buildContract(
    mutateActiveRecord(readback, (record) => {
      record.manual_only_context_refs = ["evidence:fake"];
    }),
  );
  const existingCurrentWorkingTargetContract = buildContract(readback, {
    intended_future_adapter_target:
      "existing_current_working_perspective_adapter",
  });
  const existingCanonicalTargetContract = buildContract(readback, {
    intended_future_adapter_target:
      "existing_canonical_perspective_state_adapter",
  });

  const mutationContracts = {};
  for (const flag of [
    "current_working_perspective_updated",
    "direct_canonical_perspective_state_table_mutated",
    "canonical_perspective_state_written",
    "perspective_promoted",
    "perspective_memory_written",
    "perspective_apply_record_mutated",
    "canonical_perspective_update_record_mutated",
    "perspective_relay_mutated",
    "next_work_bias_mutated",
    "work_mutated",
    "dogfood_metrics_written",
    "global_dogfood_ledger_mutated",
    "metric_snapshot_mutated",
    "next_work_signal_decision_mutated",
    "proof_or_evidence_rows_written",
    "product_write_executed",
    "raw_manual_note_text_present",
    "raw_result_report_text_present",
    "operator_notes_persisted",
  ]) {
    mutationContracts[flag] = buildContract({ ...clone(readback), [flag]: true });
  }

  const blockedAcceptReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
      perspective_adapter_contract: missingLabelContract,
      operator_decision:
        "accept_contract_for_future_perspective_adapter_write_slice",
    });
  const countsAfter = readCounts();
  const stateMutationRows = {
    receipts: count(
      "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
    ),
    records: count(
      "research_candidate_manual_global_dogfood_perspective_state_mutation_records",
    ),
    rollbacks: count(
      "research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks",
    ),
  };
  const stateMutationColumns = db
    .prepare(
      "PRAGMA table_info(research_candidate_manual_global_dogfood_perspective_state_mutation_records)",
    )
    .all()
    .map((row) => row.name);
  db.close();

  return {
    countsBefore,
    countsAfter,
    stateMutationRows,
    stateMutationColumns,
    readback,
    readyContract,
    readyContractAgain,
    acceptedReview,
    revisionReview,
    rejectReview,
    deferReview,
    noSourceContract,
    rolledBackContract,
    supersededContract,
    missingLabelContract,
    missingRationaleContract,
    currentWorkingMutationTargetContract,
    currentWorkingScopeContract,
    missingContextContract,
    missingCardsContract,
    insufficientExplanationContract,
    manualProofContract,
    existingCurrentWorkingTargetContract,
    existingCanonicalTargetContract,
    mutationContracts,
    blockedAcceptReview,
  };
}

function assertContract(sample) {
  assert.equal(sample.readyContract.validation.passed, true);
  assert.equal(
    sample.readyContract.operator_authorization_mode,
    "ready_for_future_perspective_adapter_write_authorization",
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate.candidate_status,
    "ready_for_future_perspective_adapter_write_authorization",
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate.adapter_scope_hint,
    "manual_specific_canonical_state_adapter",
  );
  assert.equal(
    sample.readyContract.proposed_adapter_mapping.intended_future_adapter_target,
    "manual_specific_canonical_state_adapter",
  );
  assert.equal(
    sample.readyContract.proposed_adapter_mapping.default_future_adapter_target,
    "manual_specific_canonical_state_adapter",
  );
  assert.equal(sample.readyContract.proposed_adapter_candidate.writes_now, false);
  assert.equal(
    sample.readyContract.proposed_adapter_candidate
      .would_update_current_working_perspective,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate
      .would_write_existing_canonical_perspective_state,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate.would_promote_perspective,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate
      .would_write_perspective_memory,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate.would_mutate_work,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_adapter_candidate
      .would_write_proof_or_evidence,
    false,
  );
  assert.equal(
    sample.readyContract.idempotency_contract_preview.proposed_idempotency_key,
    sample.readyContractAgain.idempotency_contract_preview
      .proposed_idempotency_key,
  );
  assert.equal(
    sample.readyContract.source_perspective_state_mutation_receipt_id,
    sample.readback.latest_active_committed.receipt.receipt_id,
  );
  assert.equal(
    sample.readyContract.source_perspective_state_mutation_record_fingerprint,
    sample.readback.latest_active_committed.perspective_state_mutation_record
      .perspective_state_mutation_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_perspective_apply_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_perspective_apply_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_canonical_perspective_update_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_canonical_perspective_update_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_perspective_relay_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_perspective_relay_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_next_work_signal_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_next_work_signal_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_next_work_bias_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_next_work_bias_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.proposed_existing_current_working_adapter_compatibility
      .manual_source_refs_preserved,
    true,
  );
  assert.equal(
    sample.readyContract.proposed_existing_current_working_adapter_compatibility
      .existing_current_working_perspective_update_contract_preview_compatible,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_existing_current_working_adapter_compatibility
      .existing_current_working_perspective_apply_write_compatible,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_existing_canonical_state_adapter_compatibility
      .manual_source_refs_preserved,
    true,
  );
  assert.equal(
    sample.readyContract.proposed_existing_canonical_state_adapter_compatibility
      .existing_canonical_perspective_state_writer_compatible,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_manual_adapter_write_path
      .recommended_storage_path,
    "manual_specific_perspective_adapter_tables",
  );
  assert.equal(
    sample.readyContract.proposed_manual_adapter_write_path
      .expected_future_write_scope,
    "adapter_record_only",
  );
  assert.ok(
    sample.readyContract.compatibility_findings.length > 0,
    "compatibility findings must be present",
  );

  for (const [label, contract] of Object.entries({
    noSourceContract: sample.noSourceContract,
    rolledBackContract: sample.rolledBackContract,
    supersededContract: sample.supersededContract,
    missingLabelContract: sample.missingLabelContract,
    missingRationaleContract: sample.missingRationaleContract,
    currentWorkingMutationTargetContract:
      sample.currentWorkingMutationTargetContract,
    currentWorkingScopeContract: sample.currentWorkingScopeContract,
    missingContextContract: sample.missingContextContract,
    missingCardsContract: sample.missingCardsContract,
    insufficientExplanationContract: sample.insufficientExplanationContract,
    manualProofContract: sample.manualProofContract,
    existingCurrentWorkingTargetContract:
      sample.existingCurrentWorkingTargetContract,
    existingCanonicalTargetContract: sample.existingCanonicalTargetContract,
  })) {
    assert.equal(contract.validation.passed, false, `${label} must block`);
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_perspective_adapter_authorization",
      `${label} must not be ready`,
    );
    assert.equal(
      contract.proposed_adapter_candidate.adapter_scope_hint,
      "blocked",
      `${label} must use blocked scope hint`,
    );
  }
  assert.ok(
    sample.noSourceContract.blocker_reasons.includes(
      "source_perspective_state_mutation_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.missingLabelContract.blocker_reasons.includes(
      "mutation_label_missing",
    ),
  );
  assert.ok(
    sample.currentWorkingMutationTargetContract.blocker_reasons.includes(
      "intended_future_mutation_target_must_be_canonical_perspective_state",
    ),
  );
  assert.ok(
    sample.currentWorkingScopeContract.blocker_reasons.includes(
      "mutation_scope_hint_must_be_canonical_perspective_state",
    ),
  );
  assert.ok(
    sample.insufficientExplanationContract.blocker_reasons.includes(
      "perspective_adapter_explanation_insufficient",
    ),
  );
  assert.ok(
    sample.manualProofContract.blocker_reasons.includes(
      "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence",
    ),
  );
  assert.ok(
    sample.existingCurrentWorkingTargetContract.blocker_reasons.includes(
      "existing_current_working_adapter_lineage_gap",
    ),
  );
  assert.ok(
    sample.existingCanonicalTargetContract.blocker_reasons.includes(
      "existing_canonical_state_adapter_lineage_gap",
    ),
  );

  for (const [flag, contract] of Object.entries(sample.mutationContracts)) {
    assert.equal(contract.validation.passed, false, `${flag} must block`);
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_perspective_adapter_authorization",
      `${flag} must not be ready`,
    );
  }
  assert.ok(
    sample.mutationContracts.current_working_perspective_updated.blocker_reasons.includes(
      "source_state_mutation_readback_current_working_perspective_already_updated",
    ),
  );
  assert.ok(
    sample.mutationContracts.direct_canonical_perspective_state_table_mutated.blocker_reasons.includes(
      "source_state_mutation_readback_direct_canonical_state_already_mutated",
    ),
  );
  assert.ok(
    sample.mutationContracts.global_dogfood_ledger_mutated.blocker_reasons.includes(
      "source_state_mutation_readback_metric_or_source_store_mutated",
    ),
  );
  assert.ok(
    sample.mutationContracts.operator_notes_persisted.blocker_reasons.includes(
      "source_state_mutation_raw_text_or_operator_note_present",
    ),
  );
}

function assertReview(sample) {
  assert.equal(
    sample.acceptedReview.review_status,
    "ready_for_future_perspective_adapter_write_slice",
  );
  assert.equal(sample.acceptedReview.validation.passed, true);
  assert.equal(
    sample.acceptedReview.operator_decision,
    "accept_contract_for_future_perspective_adapter_write_slice",
  );
  assert.equal(
    sample.acceptedReview.source_contract_fingerprint,
    sample.readyContract.validation.contract_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.proposed_idempotency_key,
    sample.readyContract.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_perspective_state_mutation_receipt_id,
    sample.readyContract.source_perspective_state_mutation_receipt_id,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_perspective_state_mutation_record_fingerprint,
    sample.readyContract.source_perspective_state_mutation_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_perspective_apply_record_fingerprint,
    sample.readyContract.source_perspective_apply_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_canonical_perspective_update_record_fingerprint,
    sample.readyContract.source_canonical_perspective_update_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_perspective_relay_record_fingerprint,
    sample.readyContract.source_perspective_relay_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_next_work_signal_record_fingerprint,
    sample.readyContract.source_next_work_signal_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_next_work_bias_record_fingerprint,
    sample.readyContract.source_next_work_bias_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_projection_fingerprint,
    sample.readyContract.source_projection_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_global_dogfood_ledger_receipt_id,
    sample.readyContract.source_global_dogfood_ledger_receipt_id,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_metric_snapshot_receipt_id,
    sample.readyContract.source_metric_snapshot_receipt_id,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.source_manual_receipt_id,
    sample.readyContract.source_manual_receipt_id,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_handoff_seed_fingerprint,
    sample.readyContract.source_handoff_seed_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_result_text_fingerprint,
    sample.readyContract.source_result_text_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_expected_observed_delta_record_ref,
    sample.readyContract.source_expected_observed_delta_record_ref,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_reuse_outcome_record_ref,
    sample.readyContract.source_reuse_outcome_record_ref,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .intended_future_adapter_target,
    sample.readyContract.proposed_adapter_mapping
      .intended_future_adapter_target,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.adapter_label,
    sample.readyContract.proposed_adapter_mapping.adapter_label,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.mutation_label,
    sample.readyContract.proposed_adapter_mapping.mutation_label,
  );
  assert.equal(
    sample.acceptedReview.validation.operator_note_persisted,
    false,
  );
  assert.equal(sample.acceptedReview.validation.no_write_authority, true);

  for (const [label, review] of Object.entries({
    revisionReview: sample.revisionReview,
    rejectReview: sample.rejectReview,
    deferReview: sample.deferReview,
    blockedAcceptReview: sample.blockedAcceptReview,
  })) {
    assert.notEqual(
      review.review_status,
      "ready_for_future_perspective_adapter_write_slice",
      `${label} must not be ready`,
    );
    assert.equal(review.validation.passed, false, `${label} must fail`);
    assert.equal(
      review.accepted_mapping_summary,
      null,
      `${label} must not include accepted mapping summary`,
    );
  }
}

function assertNonTargetTables(sample) {
  assert.deepEqual(
    sample.countsAfter,
    sample.countsBefore,
    "adapter preview builders and reviews must not mutate DB rows",
  );
  assert.deepEqual(sample.stateMutationRows, {
    receipts: 1,
    records: 1,
    rollbacks: 0,
  });
  assert.equal(sample.countsAfter.perspective_states, 0);
  assert.equal(sample.countsAfter.perspective_promotion_decisions, 0);
  assert.equal(sample.countsAfter.perspective_formation_receipts, 0);
  assert.equal(sample.countsAfter.perspective_memory_items, 0);
  assert.equal(sample.countsAfter.work_items, 0);
  assert.equal(sample.countsAfter.work_events, 0);
  assert.equal(sample.countsAfter.verification_evidence_records, 0);
  assert.equal(sample.countsAfter.dogfood_metric_snapshot_records, 0);
  assert.equal(sample.countsAfter.dogfooding_records, 0);
  assert.equal(sample.countsAfter.dogfooding_signals, 0);
  assert.equal(sample.countsAfter.dogfooding_review_cues, 0);
  assert.equal(sample.countsAfter.delivery_ledger, 0);
  assert.equal(
    sample.stateMutationColumns.some((column) =>
      /raw_manual_note_text|raw_result_report_text|operator_note/i.test(
        column,
      ),
    ),
    false,
    "source state mutation tables must not contain raw text/operator note columns",
  );
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-adapter-contract-v0-1"
    ],
    "tsx --tsconfig tsconfig.json scripts/smoke-research-candidate-manual-global-dogfood-perspective-adapter-contract-v0-1.mjs",
    "package.json must expose adapter contract smoke",
  );
  for (const requiredText of [
    "Manual Perspective Adapter Contract Preview",
    "Active committed manual Perspective state mutation readback",
    "preview-only",
    "does not update current-working Perspective",
    "mutate existing canonical Perspective state tables",
    "compatibility findings and gaps",
    "Perspective promotion remains out of scope",
  ]) {
    assert.ok(
      source.docs.includes(requiredText),
      `docs must include ${requiredText}`,
    );
  }
}

function buildContract(readback, options = {}) {
  return buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract({
    readback,
    operator_intent_label:
      "smoke_research_candidate_manual_global_dogfood_perspective_adapter_contract_v0_1",
    ...options,
  });
}

function insertPerspectiveStateMutationSource(db, status) {
  const receipt = {
    receipt_id: "manual-state-mutation-receipt-1",
    created_at: "2026-07-08T00:00:00.000Z",
    scope: "project:augnes",
    source_perspective_state_mutation_contract_fingerprint:
      "fnv1a32_canonical_json_v0_1:state-contract",
    source_perspective_state_mutation_review_fingerprint:
      "fnv1a32_canonical_json_v0_1:state-review",
    source_perspective_apply_receipt_id: "manual-apply-receipt-1",
    source_perspective_apply_record_id: "manual-apply-record-1",
    source_perspective_apply_record_fingerprint:
      "fnv1a32_canonical_json_v0_1:apply-record",
    source_canonical_perspective_update_receipt_id:
      "manual-canonical-update-receipt-1",
    source_canonical_perspective_update_record_id:
      "manual-canonical-update-record-1",
    source_canonical_perspective_update_record_fingerprint:
      "fnv1a32_canonical_json_v0_1:canonical-update-record",
    source_perspective_relay_receipt_id: "manual-relay-receipt-1",
    source_perspective_relay_record_id: "manual-relay-record-1",
    source_perspective_relay_record_fingerprint:
      "fnv1a32_canonical_json_v0_1:relay-record",
    source_next_work_signal_receipt_id: "manual-signal-receipt-1",
    source_next_work_signal_record_id: "manual-signal-record-1",
    source_next_work_signal_record_fingerprint:
      "fnv1a32_canonical_json_v0_1:signal-record",
    source_next_work_bias_receipt_id: "manual-bias-receipt-1",
    source_next_work_bias_record_id: "manual-bias-record-1",
    source_next_work_bias_record_fingerprint:
      "fnv1a32_canonical_json_v0_1:bias-record",
    source_projection_fingerprint:
      "fnv1a32_canonical_json_v0_1:projection",
    source_global_dogfood_ledger_receipt_id: "manual-ledger-receipt-1",
    source_global_dogfood_ledger_record_id: "manual-ledger-record-1",
    source_metric_snapshot_receipt_id: "manual-metric-receipt-1",
    source_metric_snapshot_record_id: "manual-metric-record-1",
    source_manual_receipt_id: "manual-result-receipt-1",
    source_handoff_seed_fingerprint:
      "fnv1a32_canonical_json_v0_1:handoff-seed",
    source_result_text_fingerprint:
      "fnv1a32_canonical_json_v0_1:result-text",
    source_expected_observed_delta_record_ref: "eod:manual-record-1",
    source_reuse_outcome_record_ref: "reuse:manual-record-1",
    idempotency_key: "state-mutation-idempotency-1",
    write_status: status,
    authority_profile:
      "manual_global_dogfood_perspective_state_mutation_record_metadata_only",
    receipt_fingerprint: "fnv1a32_canonical_json_v0_1:state-receipt",
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
    perspective_state_mutation_record_id: "manual-state-mutation-record-1",
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
    mutation_label: "Manual canonical state mutation candidate",
    mutation_rationale:
      "The manual dogfood source chain observed a durable mismatch that should be mapped into future canonical state adapter review without fabricated lineage.",
    apply_label: "Manual Perspective apply candidate",
    apply_rationale:
      "The prior apply record preserved the canonical update material for later explicit authorization.",
    canonical_update_label: "Manual canonical Perspective update",
    canonical_update_rationale:
      "The manual relay readback showed a stable expected-observed gap worth tracking.",
    relay_update_label: "Manual Perspective relay update",
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
      "candidate-context:manual-1",
    ]),
    source_next_work_candidate_card_ids_json: JSON.stringify([
      "candidate-card:manual-1",
    ]),
    manual_only_context_refs_json: JSON.stringify(["manual-context:relay-1"]),
    source_line: "Manual global dogfood source line",
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
      "fnv1a32_canonical_json_v0_1:state-mutation-record",
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

function setStateMutationStatus(db, status) {
  db.prepare(
    `
      UPDATE research_candidate_manual_global_dogfood_perspective_state_mutation_receipts
      SET write_status = ?
      WHERE receipt_id = 'manual-state-mutation-receipt-1'
    `,
  ).run(status);
}

function mutateActiveRecord(readback, mutate) {
  const nextReadback = clone(readback);
  const record =
    nextReadback.latest_active_committed?.perspective_state_mutation_record;
  assert.ok(record, "sample must include active state mutation record");
  mutate(record);
  const recordSet = nextReadback.records_by_receipt.find(
    (candidate) =>
      candidate.receipt.receipt_id ===
      nextReadback.latest_active_committed.receipt.receipt_id,
  );
  if (recordSet) recordSet.perspective_state_mutation_record = record;
  return nextReadback;
}

function tableExists(db, table) {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    )
    .get(table);
  return Boolean(row);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
