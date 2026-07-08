#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-contract.ts";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "../lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-review.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-state-application.ts";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility,
} from "../lib/research-candidate-review/read-manual-global-dogfood-perspective-writer-compatibility.ts";

const files = {
  contractType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract.ts",
  reviewType:
    "types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review.ts",
  contractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-contract.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-review.ts",
  panel:
    "components/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-panel.tsx",
  writerCompatibilityReadbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-writer-compatibility-readback-panel.tsx",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-v0-1.mjs",
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
assertSourceTargetDerivation(sample.readback);
assertReview(sample);
assertNonTargetTables(sample);
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-v0-1",
      pass: true,
      preview_only: true,
      existing_writer_dry_run_executed: false,
      existing_current_working_writer_called: false,
      existing_canonical_state_writer_called: false,
      current_working_perspective_changed: false,
      existing_canonical_perspective_state_tables_changed: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      work_mutated: false,
      proof_or_evidence_rows_written: false,
      dogfood_metrics_written: false,
      schema_or_migration_added: false,
      api_write_route_added: false,
      dry_run_api_route_added: false,
      handoff_result_fingerprints_preserved: true,
      existing_writer_dry_run_findings_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_contract",
    "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_contract.v0.1",
    "source_perspective_writer_compatibility_readback_ref",
    "source_perspective_writer_compatibility_receipt_id",
    "source_perspective_writer_compatibility_record_id",
    "source_perspective_writer_compatibility_record_fingerprint",
    "source_perspective_state_application_receipt_id",
    "source_perspective_adapter_receipt_id",
    "source_perspective_state_mutation_receipt_id",
    "source_perspective_apply_receipt_id",
    "source_canonical_perspective_update_receipt_id",
    "source_perspective_relay_receipt_id",
    "source_next_work_signal_receipt_id",
    "source_next_work_bias_receipt_id",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "proposed_existing_writer_dry_run_mapping",
    "existing_current_working_writer_dry_run_compatibility",
    "existing_canonical_state_writer_dry_run_compatibility",
    "proposed_manual_existing_writer_adapter_path",
    "proposed_dry_run_input_contract",
    "can_write_existing_writer_dry_run_adapter_record: false",
    "can_run_existing_writer_dry_run: false",
    "can_call_existing_current_working_writer: false",
    "can_call_existing_canonical_state_writer: false",
    "can_update_current_working_perspective: false",
    "can_mutate_existing_canonical_perspective_state: false",
    "can_write_existing_canonical_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_perspective_writer_compatibility_record: false",
    "can_mutate_work: false",
    "can_write_proof_or_evidence: false",
  ]) {
    assert.ok(
      source.contractType.includes(requiredText),
      `existing writer dry-run contract type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    "needs_existing_writer_dry_run_adapter_mapping_revision",
    "reject_existing_writer_dry_run_contract",
    "defer_existing_writer_dry_run_contract",
    "ready_for_future_existing_writer_dry_run_adapter_write_slice",
    "blocked_existing_writer_dry_run_contract_not_ready",
    "source_perspective_writer_compatibility_receipt_id",
    "source_perspective_writer_compatibility_record_fingerprint",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "operator_note_persisted: false",
    "no_write_authority: true",
    "no_dry_run_authority: true",
  ]) {
    assert.ok(
      source.reviewType.includes(requiredText),
      `existing writer dry-run review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_perspective_writer_compatibility_readback_missing",
    "source_perspective_writer_compatibility_receipt_not_active_committed",
    "source_perspective_writer_compatibility_record_missing",
    "source_perspective_writer_compatibility_record_fingerprint_missing",
    "source_writer_compatibility_readback_existing_current_working_writer_already_called",
    "source_writer_compatibility_readback_existing_canonical_state_writer_already_called",
    "source_writer_compatibility_readback_current_working_perspective_already_updated",
    "source_writer_compatibility_readback_existing_canonical_state_already_mutated",
    "source_writer_compatibility_readback_perspective_promoted",
    "source_writer_compatibility_readback_perspective_memory_written",
    "source_writer_compatibility_readback_work_mutated",
    "source_writer_compatibility_readback_proof_or_evidence_written",
    "source_writer_compatibility_readback_metric_or_source_store_mutated",
    "source_writer_compatibility_raw_text_or_operator_note_present",
    "writer_compatibility_label_missing",
    "writer_compatibility_rationale_missing",
    "writer_compatibility_storage_path_must_be_manual_specific",
    "writer_compatibility_expected_future_write_scope_must_be_record_only",
    "writer_compatibility_existing_writer_target_must_not_be_ready",
    "selected_candidate_context_refs_missing",
    "source_next_work_candidate_card_ids_missing",
    "source_handoff_seed_fingerprint_missing",
    "source_result_text_fingerprint_missing",
    "existing_writer_dry_run_explanation_insufficient",
    "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence",
    "source_authority_boundary_not_read_only",
    "existing_current_working_writer_dry_run_lineage_gap",
    "existing_canonical_state_writer_dry_run_lineage_gap",
    "existing_writer_requires_unavailable_state_refs",
    "existing_writer_requires_unavailable_proof_or_work_refs",
    "existing_writer_dry_run_entrypoint_missing",
    "existing_writer_dry_run_side_effect_boundary_unproven",
  ]) {
    assert.ok(
      source.contractBuilder.includes(requiredText),
      `existing writer dry-run builder must include ${requiredText}`,
    );
  }
  for (const requiredText of [
    "deriveDryRunTargetFromSourceRecord",
    "mapWriterTargetToDryRunTarget",
    "manual_specific_current_working_writer_adapter",
    "manual_specific_current_working_writer_dry_run_adapter",
    "manual_specific_existing_canonical_state_writer_adapter",
    "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    "intended_future_dry_run_target ?? sourceDerivedDryRunTarget",
  ]) {
    assert.ok(
      source.contractBuilder.includes(requiredText),
      `existing writer dry-run builder must preserve source writer target derivation: ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /openDatabase|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveStateApplication\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveAdapter\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "existing writer dry-run builders must stay pure and avoid writers, DB, API, providers, and retrieval",
  );
  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "existing writer dry-run builders must not contain SQL writes",
  );
  assert.ok(
    source.writerCompatibilityReadbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractPanel",
    ),
    "Perspective writer compatibility readback panel must render existing writer dry-run contract panel",
  );
  assert.doesNotMatch(
    source.panel,
    /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|POST/i,
    "existing writer dry-run panel must not fetch, persist browser state, use clipboard, or expose direct route calls",
  );
  assert.doesNotMatch(
    source.panel,
    /ResearchCandidateManualGlobalDogfoodPerspective.*WritePanel/,
    "existing writer dry-run preview must not mount a write panel",
  );
  assert.doesNotMatch(
    source.panel,
    /<button[\s\S]{0,260}(Run existing writer dry-run|Call existing writer|Apply current-working Perspective|Update current working Perspective|Write canonical Perspective state|Mutate existing canonical Perspective state|Promote Perspective|Write Perspective Memory|Create work item)/i,
    "existing writer dry-run panel must not expose forbidden controls",
  );
  for (const requiredText of [
    "useEffect",
    "reviewContractFingerprint",
    "currentContractFingerprint = contract.validation.contract_fingerprint",
    "review.source_contract_fingerprint === currentContractFingerprint",
    "accepted_mapping_summary.proposed_idempotency_key",
    "contract.idempotency_contract_preview.proposed_idempotency_key",
    "source_perspective_writer_compatibility_receipt_id",
    "source_perspective_writer_compatibility_record_fingerprint",
    "source_handoff_seed_fingerprint",
    "source_result_text_fingerprint",
    "setReviewContractFingerprint(currentContractFingerprint)",
    "setReviewContractFingerprint(null)",
    "no dry-run authority",
  ]) {
    assert.ok(
      source.panel.includes(requiredText),
      `existing writer dry-run panel must include stale-review/no-dry-run guard text: ${requiredText}`,
    );
  }
  assert.match(
    source.panel,
    /function\s+updateOperatorDecision[\s\S]*?clearReview\(\);/,
    "operator decision changes must clear cached dry-run review",
  );
  assert.match(
    source.panel,
    /function\s+updateOperatorNote[\s\S]*?clearReview\(\);/,
    "operator note changes must clear cached dry-run review",
  );
  assert.match(
    source.panel,
    /reviewContractFingerprint\s*!==\s*currentContractFingerprint[\s\S]*?setReview\(null\);[\s\S]*?setReviewContractFingerprint\(null\);/,
    "contract fingerprint changes must clear cached dry-run review",
  );
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-v0-1"
    ],
    "package script must expose existing writer dry-run contract smoke",
  );
}

function buildSample() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema(db);
  ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema(db);
  insertWriterCompatibilitySource(db, "one", "committed", 1);
  const countTables = [
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks",
    "research_candidate_manual_global_dogfood_perspective_state_application_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_application_records",
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
  const readCounts = () =>
    Object.fromEntries(countTables.map((table) => [table, countRows(db, table)]));
  const beforeCounts = readCounts();
  const readback =
    readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
      db,
      limit: 10,
    });
  const readyContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback,
    });
  const readyContractAgain =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback,
    });
  const acceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: readyContract,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
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
  assert.equal(
    readback.count,
    1,
    "sample should have one writer compatibility receipt",
  );
  assert.equal(
    readyContract.operator_authorization_mode,
    "ready_for_future_existing_writer_dry_run_adapter_write_authorization",
  );
  assert.equal(readyContract.validation.passed, true);
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate.writes_now,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_call_existing_current_working_writer,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_call_existing_canonical_state_writer,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_run_existing_writer_dry_run,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_update_current_working_perspective,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_mutate_existing_canonical_perspective_state,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_promote_perspective,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_write_perspective_memory,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate.would_mutate_work,
    false,
  );
  assert.equal(
    readyContract.proposed_existing_writer_dry_run_candidate
      .would_write_proof_or_evidence,
    false,
  );
  assert.equal(
    readyContract.idempotency_contract_preview.proposed_idempotency_key,
    readyContractAgain.idempotency_contract_preview.proposed_idempotency_key,
    "idempotency key must be deterministic",
  );
  assert.equal(
    readyContract.source_perspective_writer_compatibility_receipt_id,
    "writer-compatibility-receipt-one",
  );
  assert.equal(
    readyContract.source_perspective_writer_compatibility_record_id,
    "writer-compatibility-record-one",
  );
  assert.equal(
    readyContract.source_perspective_writer_compatibility_record_fingerprint,
    "writer-compatibility-record-fp-one",
  );
  assert.equal(
    readyContract.source_perspective_state_application_receipt_id,
    "state-application-receipt-one",
  );
  assert.equal(
    readyContract.source_perspective_adapter_receipt_id,
    "adapter-receipt-one",
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
    readyContract.proposed_manual_existing_writer_adapter_path
      .recommended_storage_path,
    "manual_specific_perspective_existing_writer_dry_run_adapter_tables",
  );
  assert.equal(
    readyContract.proposed_manual_existing_writer_adapter_path
      .expected_future_write_scope,
    "existing_writer_dry_run_adapter_record_only",
  );
  assert.equal(
    readyContract.existing_current_working_writer_dry_run_compatibility
      .dry_run_entrypoint_detected,
    false,
  );
  assert.equal(
    readyContract.existing_canonical_state_writer_dry_run_compatibility
      .dry_run_entrypoint_detected,
    false,
  );
  assert.equal(
    readyContract.proposed_dry_run_input_contract
      .can_construct_existing_current_working_writer_input_now,
    false,
  );
  assert.equal(
    readyContract.proposed_dry_run_input_contract
      .can_construct_existing_canonical_state_writer_input_now,
    false,
  );
  assert.ok(
    readyContract.existing_current_working_writer_dry_run_compatibility
      .missing_current_working_refs.length > 0,
    "missing current-working refs must be visible",
  );
  assert.ok(
    readyContract.existing_canonical_state_writer_dry_run_compatibility
      .missing_canonical_state_refs.length > 0,
    "missing canonical state refs must be visible",
  );
  assert.ok(
    readyContract.existing_canonical_state_writer_dry_run_compatibility
      .missing_claim_evidence_tension_gap_refs.length > 0,
    "missing claim/evidence/tension/gap refs must be visible",
  );
  assert.ok(
    readyContract.existing_current_working_writer_dry_run_compatibility
      .dry_run_gaps.length > 0,
    "current-working dry-run gaps must be visible",
  );
  assert.ok(
    readyContract.existing_canonical_state_writer_dry_run_compatibility
      .dry_run_gaps.length > 0,
    "canonical dry-run gaps must be visible",
  );
  assert.equal(
    readyContract.existing_current_working_writer_dry_run_compatibility
      .manual_source_refs_preserved,
    true,
  );
  assert.equal(
    readyContract.existing_canonical_state_writer_dry_run_compatibility
      .manual_source_refs_preserved,
    true,
  );
  assert.ok(
    readyContract.compatibility_findings.some(
      (finding) =>
        finding.finding_code ===
        "existing_current_working_writer_dry_run_compatibility_false",
    ),
    "current-working dry-run compatibility finding must be present",
  );
  assert.ok(
    readyContract.compatibility_findings.some(
      (finding) =>
        finding.finding_code ===
        "existing_canonical_state_writer_dry_run_compatibility_false",
    ),
    "canonical dry-run compatibility finding must be present",
  );
  assert.ok(
    readyContract.compatibility_findings.some(
      (finding) => finding.finding_code === "proposed_dry_run_input_contract_visible",
    ),
    "dry-run input contract finding must be present",
  );

  const noSource =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: null,
    });
  assert.ok(
    noSource.blocker_reasons.includes(
      "source_perspective_writer_compatibility_readback_missing",
    ),
    "no-source readback must block",
  );

  const rolledBackOnly = clone(readback);
  rolledBackOnly.records_by_receipt[0].receipt.write_status = "rolled_back";
  rolledBackOnly.records_by_receipt[0].rolled_back = true;
  rolledBackOnly.latest_active_committed = null;
  const rolledBackContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: rolledBackOnly,
    });
  assert.ok(
    rolledBackContract.blocker_reasons.includes(
      "source_perspective_writer_compatibility_receipt_not_active_committed",
    ),
    "rolled_back writer compatibility source must block",
  );

  const supersededOnly = clone(readback);
  supersededOnly.records_by_receipt[0].receipt.write_status = "superseded";
  supersededOnly.records_by_receipt[0].superseded = true;
  supersededOnly.latest_active_committed = null;
  const supersededContract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: supersededOnly,
    });
  assert.ok(
    supersededContract.blocker_reasons.includes(
      "source_perspective_writer_compatibility_receipt_not_active_committed",
    ),
    "superseded-only writer compatibility source must block",
  );

  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.writer_compatibility_label = "";
  }, "writer_compatibility_label_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.writer_compatibility_rationale = "";
  }, "writer_compatibility_rationale_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.recommended_storage_path =
      "blocked";
  }, "writer_compatibility_storage_path_must_be_manual_specific");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.expected_future_write_scope =
      "current_working_perspective_update";
  }, "writer_compatibility_expected_future_write_scope_must_be_record_only");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.selected_candidate_context_refs =
      [];
  }, "selected_candidate_context_refs_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.source_next_work_candidate_card_ids =
      [];
  }, "source_next_work_candidate_card_ids_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.receipt.source_handoff_seed_fingerprint = "";
  }, "source_handoff_seed_fingerprint_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.receipt.source_result_text_fingerprint = "";
  }, "source_result_text_fingerprint_missing");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.expected_summary = null;
  }, "existing_writer_dry_run_explanation_insufficient");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.manual_only_context_refs =
      ["evidence:forbidden"];
  }, "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence");
  assertBlocks(readback, (next) => {
    next.latest_active_committed.perspective_writer_compatibility_record.existing_current_working_writer_compatibility = {
      existing_current_working_perspective_apply_write_compatible: true,
    };
  }, "existing_writer_requires_unavailable_state_refs");

  for (const [flag, blocker] of [
    [
      "existing_current_working_writer_called",
      "source_writer_compatibility_readback_existing_current_working_writer_already_called",
    ],
    [
      "existing_canonical_state_writer_called",
      "source_writer_compatibility_readback_existing_canonical_state_writer_already_called",
    ],
    [
      "current_working_perspective_updated",
      "source_writer_compatibility_readback_current_working_perspective_already_updated",
    ],
    [
      "existing_canonical_perspective_state_table_mutated",
      "source_writer_compatibility_readback_existing_canonical_state_already_mutated",
    ],
    [
      "canonical_perspective_state_written",
      "source_writer_compatibility_readback_existing_canonical_state_already_mutated",
    ],
    ["perspective_promoted", "source_writer_compatibility_readback_perspective_promoted"],
    [
      "perspective_memory_written",
      "source_writer_compatibility_readback_perspective_memory_written",
    ],
    ["work_mutated", "source_writer_compatibility_readback_work_mutated"],
    [
      "proof_or_evidence_rows_written",
      "source_writer_compatibility_readback_proof_or_evidence_written",
    ],
    ["dogfood_metrics_written", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["global_dogfood_ledger_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["metric_snapshot_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["next_work_signal_decision_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["next_work_bias_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["perspective_relay_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["canonical_perspective_update_record_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["perspective_apply_record_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["perspective_state_mutation_record_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["perspective_adapter_record_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["perspective_state_application_record_mutated", "source_writer_compatibility_readback_metric_or_source_store_mutated"],
    ["product_write_executed", "source_writer_compatibility_product_write_executed"],
    ["raw_manual_note_text_present", "source_writer_compatibility_raw_text_or_operator_note_present"],
    ["raw_result_report_text_present", "source_writer_compatibility_raw_text_or_operator_note_present"],
    ["operator_notes_persisted", "source_writer_compatibility_raw_text_or_operator_note_present"],
  ]) {
    assertBlocks(readback, (next) => {
      next[flag] = true;
    }, blocker);
  }

  const existingCurrentWorkingTarget =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback,
      intended_future_dry_run_target:
        "existing_current_working_perspective_writer_dry_run",
    });
  assert.ok(
    existingCurrentWorkingTarget.blocker_reasons.includes(
      "writer_compatibility_existing_writer_target_must_not_be_ready",
    ),
    "existing current-working dry-run target must be compatibility-only",
  );
  assert.ok(
    existingCurrentWorkingTarget.blocker_reasons.includes(
      "existing_current_working_writer_dry_run_lineage_gap",
    ),
    "existing current-working dry-run target must expose lineage gap",
  );
  const existingCanonicalTarget =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback,
      intended_future_dry_run_target:
        "existing_canonical_perspective_state_writer_dry_run",
    });
  assert.ok(
    existingCanonicalTarget.blocker_reasons.includes(
      "writer_compatibility_existing_writer_target_must_not_be_ready",
    ),
    "existing canonical dry-run target must be compatibility-only",
  );
  assert.ok(
    existingCanonicalTarget.blocker_reasons.includes(
      "existing_canonical_state_writer_dry_run_lineage_gap",
    ),
    "existing canonical dry-run target must expose lineage gap",
  );
}

function assertSourceTargetDerivation(readback) {
  const canonicalSource = clone(readback);
  setSourceWriterTarget(
    canonicalSource,
    "manual_specific_existing_canonical_state_writer_adapter",
  );
  const canonicalDefault =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: canonicalSource,
    });
  assert.equal(
    canonicalDefault.proposed_existing_writer_dry_run_mapping
      .intended_future_dry_run_target,
    "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    "canonical source target must default to canonical dry-run adapter",
  );
  assert.equal(
    canonicalDefault.proposed_existing_writer_dry_run_mapping
      .default_future_dry_run_target,
    "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    "canonical source target must preserve canonical default dry-run adapter",
  );
  assert.equal(
    canonicalDefault.proposed_existing_writer_dry_run_candidate
      .dry_run_scope_hint,
    "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    "canonical source target must preserve canonical dry-run scope hint",
  );

  const currentWorkingSource = clone(readback);
  setSourceWriterTarget(
    currentWorkingSource,
    "manual_specific_current_working_writer_adapter",
  );
  const currentWorkingDefault =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: currentWorkingSource,
    });
  assert.equal(
    currentWorkingDefault.proposed_existing_writer_dry_run_mapping
      .intended_future_dry_run_target,
    "manual_specific_current_working_writer_dry_run_adapter",
    "current-working source target must default to current-working dry-run adapter",
  );
  assert.equal(
    currentWorkingDefault.proposed_existing_writer_dry_run_mapping
      .default_future_dry_run_target,
    "manual_specific_current_working_writer_dry_run_adapter",
    "current-working source target must preserve current-working default dry-run adapter",
  );
  assert.equal(
    currentWorkingDefault.proposed_existing_writer_dry_run_candidate
      .dry_run_scope_hint,
    "manual_specific_current_working_writer_dry_run_adapter",
    "current-working source target must preserve current-working dry-run scope hint",
  );
  assert.notEqual(
    currentWorkingDefault.idempotency_contract_preview.proposed_idempotency_key,
    canonicalDefault.idempotency_contract_preview.proposed_idempotency_key,
    "dry-run idempotency preview must reflect source-derived target differences",
  );
  const currentWorkingAcceptedReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: currentWorkingDefault,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
      operator_note: "local only current-working target",
    });
  assert.equal(
    currentWorkingAcceptedReview.accepted_mapping_summary
      .intended_future_dry_run_target,
    "manual_specific_current_working_writer_dry_run_adapter",
    "accepted review must preserve source-derived current-working dry-run target",
  );
  assert.equal(
    currentWorkingAcceptedReview.accepted_mapping_summary
      .proposed_idempotency_key,
    currentWorkingDefault.idempotency_contract_preview.proposed_idempotency_key,
    "accepted review must bind the current source-derived idempotency preview",
  );

  const explicitCanonical =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: currentWorkingSource,
      intended_future_dry_run_target:
        "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    });
  assert.equal(
    explicitCanonical.proposed_existing_writer_dry_run_mapping
      .intended_future_dry_run_target,
    "manual_specific_existing_canonical_state_writer_dry_run_adapter",
    "explicit canonical dry-run target must override current-working source target",
  );

  const explicitCurrentWorking =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: canonicalSource,
      intended_future_dry_run_target:
        "manual_specific_current_working_writer_dry_run_adapter",
    });
  assert.equal(
    explicitCurrentWorking.proposed_existing_writer_dry_run_mapping
      .intended_future_dry_run_target,
    "manual_specific_current_working_writer_dry_run_adapter",
    "explicit current-working dry-run target must override canonical source target",
  );

  const explicitExistingCurrentWorking =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: currentWorkingSource,
      intended_future_dry_run_target:
        "existing_current_working_perspective_writer_dry_run",
    });
  assert.ok(
    explicitExistingCurrentWorking.blocker_reasons.includes(
      "writer_compatibility_existing_writer_target_must_not_be_ready",
    ),
    "explicit existing current-working dry-run target must remain compatibility-only and blocked",
  );
}

function assertReview({ readyContract, acceptedReview }) {
  assert.equal(
    acceptedReview.review_status,
    "ready_for_future_existing_writer_dry_run_adapter_write_slice",
  );
  assert.equal(acceptedReview.validation.operator_note_persisted, false);
  assert.equal(acceptedReview.validation.no_write_authority, true);
  assert.equal(acceptedReview.validation.no_dry_run_authority, true);
  assert.equal(
    acceptedReview.accepted_mapping_summary.source_contract_fingerprint,
    readyContract.validation.contract_fingerprint,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .source_perspective_writer_compatibility_receipt_id,
    readyContract.source_perspective_writer_compatibility_receipt_id,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .source_perspective_writer_compatibility_record_id,
    readyContract.source_perspective_writer_compatibility_record_id,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary
      .source_perspective_writer_compatibility_record_fingerprint,
    readyContract.source_perspective_writer_compatibility_record_fingerprint,
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
    acceptedReview.accepted_mapping_summary.intended_future_dry_run_target,
    readyContract.proposed_existing_writer_dry_run_mapping
      .intended_future_dry_run_target,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.dry_run_label,
    readyContract.proposed_existing_writer_dry_run_mapping.dry_run_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.writer_compatibility_label,
    readyContract.proposed_existing_writer_dry_run_mapping
      .writer_compatibility_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.state_application_label,
    readyContract.proposed_existing_writer_dry_run_mapping
      .state_application_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.adapter_label,
    readyContract.proposed_existing_writer_dry_run_mapping.adapter_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.mutation_label,
    readyContract.proposed_existing_writer_dry_run_mapping.mutation_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.apply_label,
    readyContract.proposed_existing_writer_dry_run_mapping.apply_label,
  );
  assert.equal(
    acceptedReview.accepted_mapping_summary.canonical_update_label,
    readyContract.proposed_existing_writer_dry_run_mapping.canonical_update_label,
  );

  for (const decision of [
    "needs_existing_writer_dry_run_adapter_mapping_revision",
    "reject_existing_writer_dry_run_contract",
    "defer_existing_writer_dry_run_contract",
  ]) {
    const review =
      buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
        existing_writer_dry_run_contract: readyContract,
        operator_decision: decision,
      });
    assert.notEqual(
      review.review_status,
      "ready_for_future_existing_writer_dry_run_adapter_write_slice",
    );
    assert.equal(review.accepted_mapping_summary, null);
  }

  const blocked =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: null,
    });
  const blockedAccepted =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: blocked,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    });
  assert.notEqual(
    blockedAccepted.review_status,
    "ready_for_future_existing_writer_dry_run_adapter_write_slice",
  );
  assert.equal(blockedAccepted.accepted_mapping_summary, null);
}

function assertNonTargetTables({ db, beforeCounts, afterCounts }) {
  assert.deepEqual(
    afterCounts,
    beforeCounts,
    "preview builders must not mutate DB row counts",
  );
  assert.equal(
    countRows(
      db,
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    ),
    1,
  );
  assert.equal(
    countRows(
      db,
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records",
    ),
    1,
  );
  for (const table of [
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
  ]) {
    assert.equal(countRows(db, table), 0, `${table} must remain empty/absent`);
  }
}

function assertDocsAndPackage() {
  assert.ok(
    source.docs.includes(
      "Active committed manual Perspective writer compatibility readback can now produce",
    ),
    "docs must mention dry-run contract preview from writer compatibility readback",
  );
  assert.ok(
    source.docs.includes("does not call existing current-working writers"),
    "docs must mention existing current-working writer non-invocation",
  );
  assert.ok(
    source.docs.includes("does not run an actual dry-run"),
    "docs must mention no actual dry-run",
  );
  assert.ok(
    source.docs.includes("no existing writer invocation until dry-run compatibility is proven"),
    "docs must mention no existing writer invocation until dry-run compatibility is proven",
  );
  assert.ok(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-v0-1"
    ],
    "package script must expose existing writer dry-run contract smoke",
  );
}

function assertBlocks(readback, mutate, blocker) {
  const next = clone(readback);
  mutate(next);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback: next,
    });
  assert.ok(
    contract.blocker_reasons.includes(blocker),
    `${blocker} must block existing writer dry-run contract`,
  );
  assert.notEqual(
    contract.operator_authorization_mode,
    "ready_for_future_existing_writer_dry_run_adapter_write_authorization",
  );
}

function setSourceWriterTarget(readback, target) {
  const record =
    readback.latest_active_committed.perspective_writer_compatibility_record;
  record.intended_future_writer_target = target;
  record.default_future_writer_target = target;
  record.writer_compatibility_scope_hint = target;
}

function insertWriterCompatibilitySource(db, suffix, status, index) {
  const createdAt = new Date(Date.UTC(2026, 0, index, 0, 0, 0)).toISOString();
  const receipt = {
    receipt_id: `writer-compatibility-receipt-${suffix}`,
    created_at: createdAt,
    scope: "project:augnes",
    source_perspective_writer_compatibility_contract_fingerprint: `writer-compatibility-contract-fp-${suffix}`,
    source_perspective_writer_compatibility_review_fingerprint: `writer-compatibility-review-fp-${suffix}`,
    source_perspective_state_application_receipt_id: `state-application-receipt-${suffix}`,
    source_perspective_state_application_record_id: `state-application-record-${suffix}`,
    source_perspective_state_application_record_fingerprint: `state-application-record-fp-${suffix}`,
    source_perspective_adapter_receipt_id: `adapter-receipt-${suffix}`,
    source_perspective_adapter_record_id: `adapter-record-${suffix}`,
    source_perspective_adapter_record_fingerprint: `adapter-record-fp-${suffix}`,
    source_perspective_state_mutation_receipt_id: `state-mutation-receipt-${suffix}`,
    source_perspective_state_mutation_record_id: `state-mutation-record-${suffix}`,
    source_perspective_state_mutation_record_fingerprint: `state-mutation-record-fp-${suffix}`,
    source_perspective_apply_receipt_id: `apply-receipt-${suffix}`,
    source_perspective_apply_record_id: `apply-record-${suffix}`,
    source_perspective_apply_record_fingerprint: `apply-record-fp-${suffix}`,
    source_canonical_perspective_update_receipt_id: `canonical-update-receipt-${suffix}`,
    source_canonical_perspective_update_record_id: `canonical-update-record-${suffix}`,
    source_canonical_perspective_update_record_fingerprint: `canonical-update-record-fp-${suffix}`,
    source_perspective_relay_receipt_id: `relay-receipt-${suffix}`,
    source_perspective_relay_record_id: `relay-record-${suffix}`,
    source_perspective_relay_record_fingerprint: `relay-record-fp-${suffix}`,
    source_next_work_signal_receipt_id: `signal-receipt-${suffix}`,
    source_next_work_signal_record_id: `signal-record-${suffix}`,
    source_next_work_signal_record_fingerprint: `signal-record-fp-${suffix}`,
    source_next_work_bias_receipt_id: `bias-receipt-${suffix}`,
    source_next_work_bias_record_id: `bias-record-${suffix}`,
    source_next_work_bias_record_fingerprint: `bias-record-fp-${suffix}`,
    source_projection_fingerprint: `projection-fp-${suffix}`,
    source_global_dogfood_ledger_receipt_id: `ledger-receipt-${suffix}`,
    source_global_dogfood_ledger_record_id: `ledger-record-${suffix}`,
    source_metric_snapshot_receipt_id: `metric-receipt-${suffix}`,
    source_metric_snapshot_record_id: `metric-record-${suffix}`,
    source_manual_receipt_id: `manual-receipt-${suffix}`,
    source_handoff_seed_fingerprint: `handoff-seed-fp-${suffix}`,
    source_result_text_fingerprint: `result-text-fp-${suffix}`,
    source_expected_observed_delta_record_ref: `eod-ref-${suffix}`,
    source_reuse_outcome_record_ref: `reuse-ref-${suffix}`,
    idempotency_key: `writer-compatibility-idempotency-${suffix}`,
    write_status: status,
    authority_profile: "manual_global_dogfood_perspective_writer_compatibility_record_only",
    receipt_fingerprint: `writer-compatibility-receipt-fp-${suffix}`,
    supersedes_receipt_id: null,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
  insertRow(
    db,
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    receipt,
  );
  const record = {
    perspective_writer_compatibility_record_id: `writer-compatibility-record-${suffix}`,
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: "project:augnes",
    source_perspective_state_application_receipt_id: receipt.source_perspective_state_application_receipt_id,
    source_perspective_state_application_record_id: receipt.source_perspective_state_application_record_id,
    source_perspective_adapter_receipt_id: receipt.source_perspective_adapter_receipt_id,
    source_perspective_adapter_record_id: receipt.source_perspective_adapter_record_id,
    source_perspective_state_mutation_receipt_id: receipt.source_perspective_state_mutation_receipt_id,
    source_perspective_state_mutation_record_id: receipt.source_perspective_state_mutation_record_id,
    source_perspective_apply_receipt_id: receipt.source_perspective_apply_receipt_id,
    source_perspective_apply_record_id: receipt.source_perspective_apply_record_id,
    source_canonical_perspective_update_receipt_id: receipt.source_canonical_perspective_update_receipt_id,
    source_canonical_perspective_update_record_id: receipt.source_canonical_perspective_update_record_id,
    source_perspective_relay_receipt_id: receipt.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id: receipt.source_perspective_relay_record_id,
    source_next_work_signal_receipt_id: receipt.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: receipt.source_next_work_signal_record_id,
    source_next_work_bias_receipt_id: receipt.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id: receipt.source_next_work_bias_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id: receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id: receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    writer_compatibility_label: `Writer compatibility ${suffix}`,
    writer_compatibility_rationale: `Writer compatibility rationale ${suffix}`,
    state_application_label: `State application ${suffix}`,
    state_application_rationale: `State application rationale ${suffix}`,
    adapter_label: `Adapter ${suffix}`,
    adapter_rationale: `Adapter rationale ${suffix}`,
    mutation_label: `Mutation ${suffix}`,
    mutation_rationale: `Mutation rationale ${suffix}`,
    apply_label: `Apply ${suffix}`,
    apply_rationale: `Apply rationale ${suffix}`,
    canonical_update_label: `Canonical update ${suffix}`,
    canonical_update_rationale: `Canonical update rationale ${suffix}`,
    relay_update_label: `Relay ${suffix}`,
    relay_update_rationale: `Relay rationale ${suffix}`,
    recommended_next_work_label: `Next work ${suffix}`,
    outcome_label: `Outcome ${suffix}`,
    outcome_signal: "positive",
    intended_future_writer_target:
      "manual_specific_existing_canonical_state_writer_adapter",
    default_future_writer_target:
      "manual_specific_existing_canonical_state_writer_adapter",
    writer_compatibility_scope_hint:
      "manual_specific_existing_canonical_state_writer_adapter",
    writer_compatibility_strength_hint: "medium",
    expected_future_write_scope: "writer_compatibility_record_only",
    recommended_storage_path: "manual_specific_perspective_writer_compatibility_tables",
    expected_summary: `Expected ${suffix}`,
    observed_summary: `Observed ${suffix}`,
    mismatch_or_gap_summary: `Mismatch ${suffix}`,
    selected_candidate_context_refs_json: JSON.stringify([
      `candidate-context-${suffix}`,
    ]),
    source_next_work_candidate_card_ids_json: JSON.stringify([
      `candidate-card-${suffix}`,
    ]),
    manual_only_context_refs_json: JSON.stringify([`manual-context-${suffix}`]),
    source_line: `source line ${suffix}`,
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify([]),
    compatibility_findings_json: JSON.stringify([
      `compatibility-finding-${suffix}`,
    ]),
    existing_current_working_writer_compatibility_json: JSON.stringify({
      existing_current_working_perspective_apply_write_compatible: false,
    }),
    existing_canonical_state_writer_compatibility_json: JSON.stringify({
      existing_canonical_perspective_state_writer_compatible: false,
    }),
    manual_writer_compatibility_path_json: JSON.stringify({
      recommended_storage_path:
        "manual_specific_perspective_writer_compatibility_tables",
    }),
    source_refs_json: JSON.stringify([receipt.receipt_id]),
    authority_profile: "manual_global_dogfood_perspective_writer_compatibility_record_only",
    perspective_writer_compatibility_record_fingerprint: `writer-compatibility-record-fp-${suffix}`,
  };
  insertRow(
    db,
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records",
    record,
  );
}

function insertRow(db, table, row) {
  const columns = Object.keys(row);
  const placeholders = columns.map((column) => `@${column}`).join(", ");
  db.prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
  ).run(row);
}

function countRows(db, table) {
  if (!tableExists(db, table)) return 0;
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function tableExists(db, table) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table),
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
