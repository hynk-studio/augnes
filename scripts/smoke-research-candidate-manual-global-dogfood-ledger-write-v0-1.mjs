#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const typePath =
  "types/research-candidate-manual-global-dogfood-ledger-write.ts";
const writerPath =
  "lib/research-candidate-review/manual-global-dogfood-ledger-write.ts";
const readbackPath =
  "lib/research-candidate-review/read-manual-global-dogfood-ledger.ts";
const routePath =
  "app/api/research-candidate-review/manual-global-dogfood-ledger/route.ts";
const rollbackRoutePath =
  "app/api/research-candidate-review/manual-global-dogfood-ledger/[receipt_id]/rollback/route.ts";
const writePanelPath =
  "components/research-candidate-manual-global-dogfood-ledger-write-panel.tsx";
const readbackPanelPath =
  "components/research-candidate-manual-global-dogfood-ledger-readback-panel.tsx";
const contractPanelPath =
  "components/research-candidate-manual-result-dogfood-ledger-authorization-contract-panel.tsx";
const schemaPath = "lib/db/schema.sql";
const dbPath = "lib/db.ts";
const migrationPath = "scripts/db-migrations.mjs";
const dbMigratePath = "scripts/db-migrate.mjs";
const packagePath = "package.json";
const docsPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";

for (const filePath of [
  typePath,
  writerPath,
  readbackPath,
  routePath,
  rollbackRoutePath,
  writePanelPath,
  readbackPanelPath,
  contractPanelPath,
  schemaPath,
  dbPath,
  migrationPath,
  dbMigratePath,
  packagePath,
  docsPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const writerSource = readFileSync(writerPath, "utf8");
const readbackSource = readFileSync(readbackPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const rollbackRouteSource = readFileSync(rollbackRoutePath, "utf8");
const writePanelSource = readFileSync(writePanelPath, "utf8");
const readbackPanelSource = readFileSync(readbackPanelPath, "utf8");
const contractPanelSource = readFileSync(contractPanelPath, "utf8");
const schemaSource = readFileSync(schemaPath, "utf8");
const dbSource = readFileSync(dbPath, "utf8");
const migrationSource = readFileSync(migrationPath, "utf8");
const dbMigrateSource = readFileSync(dbMigratePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsSource = readFileSync(docsPath, "utf8");

assertTypeAndSchemaContracts();
assertStaticBoundaries();
const sample = buildSample();
assertRejections(sample);
assertCommitDuplicateRollbackSupersede(sample);
assertReadbackAndNonTargetTables(sample);
assertDocsAndPackage();
assertExistingSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-global-dogfood-ledger-write-v0-1",
      pass: true,
      explicit_confirmation_checked: true,
      ready_contract_and_accepted_review_checked: true,
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

function assertTypeAndSchemaContracts() {
  for (const requiredText of [
    "I authorize writing this manual research candidate bridge to the global dogfood ledger",
    "I authorize rolling back this manual research candidate global dogfood ledger receipt",
    "manual_operator_authorized_global_dogfood_ledger_write",
    "manual_operator_authorized_global_dogfood_ledger_rollback",
    "can_write_manual_global_dogfood_ledger_receipt: true",
    "can_write_manual_global_dogfood_ledger_record: true",
    "can_write_manual_global_dogfood_rollback_metadata: true",
    "can_write_dogfood_metrics: false",
    "can_write_expected_observed_delta_global_record: false",
    "can_write_reuse_outcome_global_record: false",
    "can_write_proof_or_evidence: false",
    "can_mutate_work: false",
    "can_write_perspective_state: false",
    "can_write_perspective_memory: false",
    "can_mutate_manual_result_records: false",
    "can_execute_codex: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "can_fetch_sources: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
    "persists_raw_manual_note_text: false",
    "persists_raw_result_report_text: false",
    "persists_operator_notes: false",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type must include ${requiredText}`);
  }

  for (const requiredText of [
    "research_candidate_manual_global_dogfood_ledger_receipts",
    "research_candidate_manual_global_dogfood_ledger_records",
    "research_candidate_manual_global_dogfood_ledger_rollbacks",
    "source_contract_fingerprint TEXT NOT NULL",
    "source_authorization_review_fingerprint TEXT NOT NULL",
    "source_manual_receipt_id TEXT NOT NULL",
    "source_handoff_seed_fingerprint TEXT NOT NULL",
    "source_result_text_fingerprint TEXT NOT NULL",
    "source_expected_observed_delta_record_ref TEXT NOT NULL",
    "source_reuse_outcome_record_ref TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "ledger_write_status TEXT NOT NULL CHECK",
    "manual_only_context_refs_json TEXT NOT NULL",
    "compatibility_findings_json TEXT NOT NULL",
  ]) {
    assert.ok(schemaSource.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    dbSource.includes("migrateResearchCandidateManualGlobalDogfoodLedgerTables"),
    "lib/db.ts must migrate the manual global dogfood ledger tables",
  );
  assert.ok(
    migrationSource.includes("migrateResearchCandidateManualGlobalDogfoodLedger"),
    "db-migrations must expose the manual global dogfood ledger migration",
  );
  assert.ok(
    dbMigrateSource.includes("researchCandidateManualGlobalDogfoodLedgerResult"),
    "db-migrate must run the manual global dogfood ledger migration",
  );
}

function assertStaticBoundaries() {
  assert.match(writerSource, /BEGIN IMMEDIATE/, "writer must use a transaction");
  assert.match(
    writerSource.slice(writerSource.indexOf("BEGIN IMMEDIATE")),
    /idempotencyKey:\s*validation\.idempotency_key/,
    "writer must check idempotency inside the transaction",
  );
  assert.match(
    writerSource,
    /supersedes_receipt_not_committed/,
    "writer must refuse non-committed supersede targets",
  );
  assert.match(
    writerSource,
    /readResearchCandidateManualResultRecordsByReceiptId/,
    "writer must verify source manual result receipt readback",
  );
  assert.doesNotMatch(
    writerSource,
    /writeReuseOutcomeBridgeLedgerRecord|reuse-outcome-bridge-ledger-write|handoff-reuse-outcome-ledger/i,
    "writer must not invoke the existing incompatible handoff/reuse outcome ledger helper",
  );
  assert.doesNotMatch(
    `${writerSource}\n${readbackSource}\n${routeSource}\n${rollbackRouteSource}`,
    /\bnew\s+OpenAI\b|api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources\s*\(|ragIndex\s*\(|vectorStore\s*\(|scrapeSource\s*\(|crawlSources\s*\(/i,
    "ledger write path must not add provider/OpenAI, GitHub, Codex, retrieval, or source-fetch behavior",
  );
  assert.doesNotMatch(
    `${writerSource}\n${readbackSource}\n${routeSource}\n${rollbackRouteSource}`,
    /INSERT\s+INTO\s+(dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "writer must not write metrics/proof/work/Perspective/memory/product tables or delete rows",
  );
  assert.ok(routeSource.includes("export async function GET"));
  assert.ok(routeSource.includes("export async function POST"));
  assert.ok(rollbackRouteSource.includes("export async function POST"));
  assert.ok(routeSource.includes("same_origin_required"));
  assert.ok(rollbackRouteSource.includes("same_origin_required"));
  assert.ok(routeSource.includes("dogfood_metrics_written: false"));
  assert.ok(rollbackRouteSource.includes("dogfood_metrics_written: false"));
  assert.ok(routeSource.includes("product_write_executed: false"));
  assert.ok(rollbackRouteSource.includes("product_write_executed: false"));

  assert.match(
    writePanelSource,
    /\/api\/research-candidate-review\/manual-global-dogfood-ledger/,
    "write panel may call only the manual global dogfood ledger route",
  );
  assert.doesNotMatch(
    writePanelSource,
    /api\/dogfooding|api\.openai\.com|github\.com|localStorage|sessionStorage|navigator\.clipboard|perspective\/.*POST/i,
    "write panel must not add forbidden API/storage/clipboard behavior",
  );
  assert.match(
    writePanelSource,
    /Write global dogfood ledger record/,
    "write panel must expose the explicit authorized write button",
  );
  assert.match(
    writePanelSource,
    /Rollback ledger receipt/,
    "write panel must expose rollback metadata control",
  );
  assert.ok(
    readbackPanelSource.includes("raw_manual_note_text_present") &&
      readbackPanelSource.includes("operator_notes_persisted"),
    "readback panel must show raw text and operator note persistence flags",
  );
  assert.ok(
    contractPanelSource.includes("ResearchCandidateManualGlobalDogfoodLedgerWritePanel") &&
      contractPanelSource.includes("ready_for_future_ledger_write_slice"),
    "authorization contract panel must gate the write panel behind accepted local review",
  );
}

function buildSample() {
  const code = `
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";
import { buildResearchCandidateManualNoteHandoffResultIntake } from "./lib/research-candidate-review/manual-note-handoff-result-intake";
import { buildResearchCandidateManualNoteResultIntakeOperatorReview } from "./lib/research-candidate-review/manual-note-result-intake-operator-review";
import { buildResearchCandidateManualNoteResultRecordContractPreview } from "./lib/research-candidate-review/manual-note-result-record-contract-preview";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-result-authorized-record-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-ledger-write";
import {
  writeResearchCandidateManualResultAuthorizedRecords,
  rollbackResearchCandidateManualResultWriteReceipt
} from "./lib/research-candidate-review/manual-result-authorized-record-write";
import { readResearchCandidateManualResultRecords } from "./lib/research-candidate-review/read-manual-result-records";
import { buildResearchCandidateManualResultDogfoodBridgePreview } from "./lib/research-candidate-review/manual-result-dogfood-bridge-preview";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review";
import {
  writeResearchCandidateManualGlobalDogfoodLedger,
  rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-ledger-write";
import { readResearchCandidateManualGlobalDogfoodLedger } from "./lib/research-candidate-review/read-manual-global-dogfood-ledger";

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(readFileSync("lib/db/schema.sql", "utf8"));

function tableExists(table) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}
function count(table) {
  return tableExists(table) ? db.prepare("SELECT COUNT(*) AS count FROM " + table).get().count : 0;
}
const countTables = [
  "research_candidate_manual_result_write_receipts",
  "research_candidate_manual_expected_observed_delta_records",
  "research_candidate_manual_reuse_outcome_records",
  "research_candidate_manual_result_write_rollbacks",
  "research_candidate_manual_global_dogfood_ledger_receipts",
  "research_candidate_manual_global_dogfood_ledger_records",
  "research_candidate_manual_global_dogfood_ledger_rollbacks",
  "dogfooding_records",
  "dogfooding_signals",
  "dogfooding_review_cues",
  "verification_evidence_records",
  "action_records",
  "work_items",
  "work_events",
  "perspective_states",
  "perspective_promotion_decisions",
  "perspective_formation_receipts",
  "perspective_memory_product_persistence_boundary_records",
  "perspective_memory_items",
  "delivery_ledger"
];
function readCounts() {
  return Object.fromEntries(countTables.map((table) => [table, count(table)]));
}

const note = [
  "Research Question: Can accepted manual bridge authorization contracts write a narrow dogfood ledger integration record?",
  "Operator Intent: Write only an explicitly authorized manual-to-global dogfood ledger receipt and record.",
  "Source Title: Manual global dogfood ledger write note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-global-dogfood-ledger-write-001",
  "Claim: Accepted manual bridge contracts can write a narrow idempotent ledger integration record.",
  "Evidence: supports: The contract preview preserves manual EOD and Reuse Outcome source refs.",
  "Tension: The existing handoff reuse outcome ledger writer expects incompatible source lineage.",
  "Gap: Need exact confirmation, idempotency, rollback, supersede, and non-target row checks. next: global dogfood ledger write",
  "Perspective Delta: Keep the write separate from Perspective promotion and proof/evidence.",
  "Next: Implement authorized ledger write. files: lib/research-candidate-review/manual-global-dogfood-ledger-write.ts checks: npm run smoke:research-candidate-manual-global-dogfood-ledger-write-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-global-dogfood-ledger-write",
    persisted_preview_draft: false
  },
  target_label: "Manual global dogfood ledger write smoke sample"
});

function makeReport({ outcome, suffix }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1005",
    "pr_number: 1005",
    "live_host_observation: /research-candidate-review showed the authorized manual global dogfood ledger writer.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + suffix,
    "",
    "## Files changed",
    "- lib/research-candidate-review/manual-global-dogfood-ledger-write.ts",
    "- components/research-candidate-manual-global-dogfood-ledger-write-panel.tsx",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-global-dogfood-ledger-write-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Dogfood metrics remain out of scope.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Manual bridge contracts write only scoped global dogfood ledger integration rows.",
    "",
    "## Authority boundary statement",
    "Explicitly authorized global dogfood ledger integration write only; no dogfood metrics, no proof/evidence rows, no work status change, no Perspective promotion, no memory writes, no raw text persistence, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
  ].join("\\n");
}

function makeFlow(report) {
  const intake = buildResearchCandidateManualNoteHandoffResultIntake({
    handoff_seed: seed,
    codex_result_report_text: report,
    source_metadata: { result_source: "sample_smoke" }
  });
  const review = buildResearchCandidateManualNoteResultIntakeOperatorReview({
    result_intake: intake,
    operator_decision: "prepare_record_contract_preview",
    operator_notes: "Local setup note that must not be stored by the ledger writer."
  });
  const contract = buildResearchCandidateManualNoteResultRecordContractPreview({
    result_intake: intake,
    operator_review: review
  });
  return { intake, review, contract };
}

function manualWriteRequest(flow, authorization = {}) {
  return {
    result_intake: flow.intake,
    operator_review: flow.review,
    record_contract_preview: flow.contract,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_record_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...authorization
    }
  };
}

function createManualSource({ outcome, suffix }) {
  const flow = makeFlow(makeReport({ outcome, suffix }));
  const write = writeResearchCandidateManualResultAuthorizedRecords(
    manualWriteRequest(flow),
    { db }
  );
  assert.equal(write.ok, true);
  const readback = readResearchCandidateManualResultRecords({
    db,
    receiptId: write.receipt.receipt_id,
    limit: 1
  });
  const bridgePreview = buildResearchCandidateManualResultDogfoodBridgePreview({
    readback,
    operator_view: "manual_global_dogfood_ledger_write_smoke"
  });
  const contract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
    bridge_preview: bridgePreview
  });
  const review = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
    authorization_contract: contract,
    operator_decision: "accept_contract_for_future_write_slice",
    operator_note: "Local accept note that must not persist."
  });
  return { flow, write, readback, bridgePreview, contract, review };
}

function createRolledBackManualContract() {
  const source = createManualSource({
    outcome: "helpful",
    suffix: "Rolled back manual source must block the global ledger writer."
  });
  const rollback = rollbackResearchCandidateManualResultWriteReceipt(
    {
      receipt_id: source.write.receipt.receipt_id,
      rollback_authorization: {
        authorization_kind: "manual_operator_authorized_record_rollback",
        operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION,
        rollback_reason: "Smoke rolled back manual source before ledger write."
      }
    },
    { db }
  );
  assert.equal(rollback.ok, true);
  const readback = readResearchCandidateManualResultRecords({
    db,
    receiptId: source.write.receipt.receipt_id,
    limit: 1
  });
  const bridgePreview = buildResearchCandidateManualResultDogfoodBridgePreview({ readback });
  return buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
    bridge_preview: bridgePreview
  });
}

function createSupersededManualContract() {
  const source = createManualSource({
    outcome: "missing",
    suffix: "Superseded manual source must block the global ledger writer."
  });
  const replacementFlow = makeFlow(makeReport({
    outcome: "stale",
    suffix: "Replacement manual source supersedes the older manual source."
  }));
  const replacement = writeResearchCandidateManualResultAuthorizedRecords(
    manualWriteRequest(replacementFlow, {
      write_mode: "supersede_previous",
      supersedes_receipt_id: source.write.receipt.receipt_id
    }),
    { db }
  );
  assert.equal(replacement.ok, true);
  const readback = readResearchCandidateManualResultRecords({
    db,
    receiptId: source.write.receipt.receipt_id,
    limit: 1
  });
  const bridgePreview = buildResearchCandidateManualResultDogfoodBridgePreview({ readback });
  return buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
    bridge_preview: bridgePreview
  });
}

function writeRequest(source, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    authorization_contract: source.contract,
    authorization_review: source.review,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}

function writeWith(source, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodLedger(
    writeRequest(source, overrides),
    { db }
  );
}

const countsBeforeSetup = readCounts();
const sourceA = createManualSource({
  outcome: "helpful",
  suffix: "Source A preserves helpful outcome and complete ExpectedObservedDelta summaries."
});
const sourceB = createManualSource({
  outcome: "stale",
  suffix: "Source B is a valid replacement candidate for supersede tests."
});
const sourceC = createManualSource({
  outcome: "noisy",
  suffix: "Source C supersedes source B in the global ledger integration table."
});
const sourceD = createManualSource({
  outcome: "misleading",
  suffix: "Source D is refused when superseding an already superseded receipt."
});
const rolledBackContract = createRolledBackManualContract();
const supersededContract = createSupersededManualContract();
const countsAfterSetup = readCounts();

const wrongConfirmation = writeWith(sourceA, {
  operator_authorization: {
    operator_confirmation_text: "wrong confirmation text"
  }
});
const revisionReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: sourceA.contract,
  operator_decision: "needs_mapping_revision"
});
const rejectReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: sourceA.contract,
  operator_decision: "reject_contract"
});
const deferReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: sourceA.contract,
  operator_decision: "defer_contract"
});
const revisionReviewResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_review: revisionReview
}, { db });
const rejectReviewResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_review: rejectReview
}, { db });
const deferReviewResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_review: deferReview
}, { db });
const blockedContractResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_contract: rolledBackContract
}, { db });
const supersededContractResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_contract: supersededContract
}, { db });
const missingSourceRefsContract = {
  ...sourceA.contract,
  proposed_global_dogfood_mapping: {
    ...sourceA.contract.proposed_global_dogfood_mapping,
    source_manual_receipt_id: null,
    source_expected_observed_delta_record_ref: null
  }
};
const missingSourceRefsResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_contract: missingSourceRefsContract
}, { db });
const rawTextResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  raw_result_report_text: "forbidden raw result text"
}, { db });
const wrongBoundaryContract = {
  ...sourceA.contract,
  authority_boundary: {
    ...sourceA.contract.authority_boundary,
    can_write_global_dogfood_ledger: true
  }
};
const wrongBoundaryResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_contract: wrongBoundaryContract
}, { db });
const unsupportedOutcomeContract = {
  ...sourceA.contract,
  proposed_global_dogfood_mapping: {
    ...sourceA.contract.proposed_global_dogfood_mapping,
    selected_context_outcome_label: "not_reported"
  }
};
const unsupportedOutcomeResult = writeResearchCandidateManualGlobalDogfoodLedger({
  ...writeRequest(sourceA),
  authorization_contract: unsupportedOutcomeContract
}, { db });
const supersedeMissing = writeWith(sourceA, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: "missing-global-ledger-receipt"
  }
});
const countsAfterRejections = readCounts();

const committedA = writeWith(sourceA);
const countsAfterCommitA = readCounts();
const duplicateA = writeWith(sourceA);
const countsAfterDuplicateA = readCounts();
const rollbackA = rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt(
  {
    receipt_id: committedA.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback of committed manual global dogfood ledger receipt."
    }
  },
  { db }
);
const duplicateRollbackA = rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt(
  {
    receipt_id: committedA.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback replay should not create a duplicate rollback row."
    }
  },
  { db }
);
const countsAfterRollbackA = readCounts();
const supersedeRolledBack = writeWith(sourceB, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedA.receipt.receipt_id
  }
});
const countsAfterSupersedeRolledBack = readCounts();
const committedB = writeWith(sourceB);
const countsAfterCommitB = readCounts();
const supersededC = writeWith(sourceC, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedB.receipt.receipt_id
  }
});
const countsAfterValidSupersede = readCounts();
const supersedeAlreadySuperseded = writeWith(sourceD, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedB.receipt.receipt_id
  }
});
const countsAfterSupersedeAlreadySuperseded = readCounts();

const readback = readResearchCandidateManualGlobalDogfoodLedger({ db, limit: 20 });
const sourceAReadback = readResearchCandidateManualGlobalDogfoodLedger({
  db,
  receiptId: committedA.receipt.receipt_id,
  limit: 1
});
const latest = readback.latest_active_committed;
const rawTextSearch = {
  receipts: db.prepare("SELECT COUNT(*) AS count FROM research_candidate_manual_global_dogfood_ledger_receipts WHERE receipt_id LIKE '%result text%' OR receipt_fingerprint LIKE '%result text%'").get().count,
  records: db.prepare("SELECT COUNT(*) AS count FROM research_candidate_manual_global_dogfood_ledger_records WHERE expected_summary LIKE '%raw result text%' OR observed_summary LIKE '%raw result text%' OR mismatch_or_gap_summary LIKE '%raw result text%'").get().count
};

console.log(JSON.stringify({
  countsBeforeSetup,
  countsAfterSetup,
  countsAfterRejections,
  countsAfterCommitA,
  countsAfterDuplicateA,
  countsAfterRollbackA,
  countsAfterSupersedeRolledBack,
  countsAfterCommitB,
  countsAfterValidSupersede,
  countsAfterSupersedeAlreadySuperseded,
  wrongConfirmation,
  revisionReviewResult,
  rejectReviewResult,
  deferReviewResult,
  blockedContractResult,
  supersededContractResult,
  missingSourceRefsResult,
  rawTextResult,
  wrongBoundaryResult,
  unsupportedOutcomeResult,
  supersedeMissing,
  committedA,
  duplicateA,
  rollbackA,
  duplicateRollbackA,
  supersedeRolledBack,
  committedB,
  supersededC,
  supersedeAlreadySuperseded,
  readback,
  sourceAReadback,
  latest,
  sourceAContract: sourceA.contract,
  sourceAReview: sourceA.review,
  sourceBContract: sourceB.contract,
  sourceCContract: sourceC.contract,
  rawTextSearch
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertRefused(result, expectedReason) {
  assert.equal(result.ok, false, `${expectedReason} should be refused`);
  assert.equal(result.result_status, "refused", `${expectedReason} status`);
  assert.ok(
    result.refusal_reasons.length > 0,
    `${expectedReason} must include refusal reasons`,
  );
}

function assertRejections(sample) {
  assertRefused(sample.wrongConfirmation, "wrong confirmation");
  assert.ok(
    sample.wrongConfirmation.refusal_reasons.includes(
      "operator_confirmation_text_invalid",
    ),
  );
  for (const [name, result] of [
    ["needs mapping revision review", sample.revisionReviewResult],
    ["reject review", sample.rejectReviewResult],
    ["defer review", sample.deferReviewResult],
    ["rolled_back-only bridge contract", sample.blockedContractResult],
    ["superseded-only bridge contract", sample.supersededContractResult],
    ["missing source refs", sample.missingSourceRefsResult],
    ["raw text field", sample.rawTextResult],
    ["wrong authority boundary", sample.wrongBoundaryResult],
    ["unsupported outcome", sample.unsupportedOutcomeResult],
    ["supersede missing receipt", sample.supersedeMissing],
  ]) {
    assertRefused(result, name);
  }
  assert.ok(
    sample.rawTextResult.refusal_reasons.includes(
      "raw_text_or_operator_note_field_refused",
    ),
  );
  assert.ok(
    sample.unsupportedOutcomeResult.refusal_reasons.includes(
      "unsupported_outcome_label",
    ),
  );
  assert.ok(
    sample.supersedeMissing.refusal_reasons.includes(
      "supersedes_receipt_id_not_found",
    ),
  );
  assert.deepEqual(
    sample.countsAfterRejections,
    sample.countsAfterSetup,
    "refused writes must not create global ledger rows",
  );
}

function assertCommitDuplicateRollbackSupersede(sample) {
  assert.equal(sample.committedA.ok, true);
  assert.equal(sample.committedA.result_status, "committed");
  assert.equal(sample.committedA.receipt.ledger_write_status, "committed");
  assert.equal(sample.committedA.ledger_record.outcome_label, "helpful");
  assert.equal(
    sample.committedA.receipt.source_manual_receipt_id,
    sample.sourceAContract.proposed_global_dogfood_mapping.source_manual_receipt_id,
  );
  assert.equal(
    sample.committedA.receipt.source_expected_observed_delta_record_ref,
    sample.sourceAContract.proposed_global_dogfood_mapping
      .source_expected_observed_delta_record_ref,
  );
  assert.equal(
    sample.committedA.receipt.source_reuse_outcome_record_ref,
    sample.sourceAContract.proposed_global_dogfood_mapping
      .source_reuse_outcome_record_ref,
  );
  assert.equal(
    sample.committedA.receipt.source_handoff_seed_fingerprint,
    sample.sourceAContract.proposed_global_dogfood_mapping
      .source_handoff_seed_fingerprint,
  );
  assert.equal(
    sample.committedA.receipt.source_result_text_fingerprint,
    sample.sourceAContract.proposed_global_dogfood_mapping
      .source_result_text_fingerprint,
  );
  assert.ok(sample.committedA.ledger_record.expected_summary);
  assert.ok(sample.committedA.ledger_record.observed_summary);
  assert.ok(sample.committedA.ledger_record.mismatch_or_gap_summary);
  assert.ok(sample.committedA.ledger_record.selected_candidate_context_refs.length > 0);
  assert.ok(sample.committedA.ledger_record.manual_only_context_refs.length > 0);
  assert.equal(sample.committedA.dogfood_metrics_written, false);
  assert.equal(sample.committedA.proof_or_evidence_rows_written, false);
  assert.equal(sample.committedA.work_or_perspective_rows_written, false);
  assert.equal(sample.committedA.perspective_memory_written, false);
  assert.equal(sample.committedA.product_write_executed, false);
  assert.equal(sample.committedA.receipt.idempotency_key, sample.duplicateA.idempotency_key);

  assert.equal(sample.duplicateA.ok, true);
  assert.equal(sample.duplicateA.result_status, "duplicate_replayed");
  assert.equal(sample.duplicateA.duplicate_replayed, true);
  assert.equal(sample.duplicateA.receipt.receipt_id, sample.committedA.receipt.receipt_id);
  assert.deepEqual(
    sample.countsAfterDuplicateA,
    sample.countsAfterCommitA,
    "duplicate replay must not add rows",
  );

  assert.equal(sample.rollbackA.ok, true);
  assert.equal(sample.rollbackA.result_status, "rolled_back");
  assert.equal(sample.rollbackA.receipt.ledger_write_status, "rolled_back");
  assert.ok(sample.rollbackA.rollback.rollback_reason.includes("Smoke rollback"));
  assert.equal(sample.duplicateRollbackA.ok, true);
  assert.equal(sample.duplicateRollbackA.rollback.rollback_id, sample.rollbackA.rollback.rollback_id);
  assert.equal(
    sample.countsAfterRollbackA.research_candidate_manual_global_dogfood_ledger_rollbacks,
    sample.countsAfterCommitA.research_candidate_manual_global_dogfood_ledger_rollbacks + 1,
  );
  assert.equal(
    sample.countsAfterRollbackA.research_candidate_manual_global_dogfood_ledger_records,
    sample.countsAfterCommitA.research_candidate_manual_global_dogfood_ledger_records,
    "rollback must not delete ledger rows",
  );

  assertRefused(sample.supersedeRolledBack, "supersede rolled_back receipt");
  assert.ok(
    sample.supersedeRolledBack.refusal_reasons.includes(
      "supersedes_receipt_not_committed",
    ),
  );
  assert.deepEqual(
    sample.countsAfterSupersedeRolledBack,
    sample.countsAfterRollbackA,
    "refused rolled_back supersede must not insert rows",
  );

  assert.equal(sample.committedB.ok, true);
  assert.equal(sample.committedB.result_status, "committed");
  assert.equal(sample.supersededC.ok, true);
  assert.equal(sample.supersededC.result_status, "committed");
  assert.equal(
    sample.supersededC.receipt.supersedes_receipt_id,
    sample.committedB.receipt.receipt_id,
  );
  assert.equal(sample.supersededC.ledger_record.outcome_label, "noisy");
  assert.equal(
    sample.countsAfterValidSupersede
      .research_candidate_manual_global_dogfood_ledger_receipts,
    sample.countsAfterCommitB
      .research_candidate_manual_global_dogfood_ledger_receipts + 1,
  );
  const supersededB = sample.readback.records_by_receipt.find(
    (item) => item.receipt.receipt_id === sample.committedB.receipt.receipt_id,
  );
  assert.equal(supersededB.receipt.ledger_write_status, "superseded");

  assertRefused(sample.supersedeAlreadySuperseded, "supersede already superseded");
  assert.ok(
    sample.supersedeAlreadySuperseded.refusal_reasons.includes(
      "supersedes_receipt_not_committed",
    ),
  );
  assert.deepEqual(
    sample.countsAfterSupersedeAlreadySuperseded,
    sample.countsAfterValidSupersede,
    "refused already-superseded write must not add rows",
  );
}

function assertReadbackAndNonTargetTables(sample) {
  assert.equal(sample.readback.count, 3);
  assert.equal(
    sample.readback.latest_active_committed.receipt.receipt_id,
    sample.supersededC.receipt.receipt_id,
  );
  assert.equal(sample.readback.raw_manual_note_text_present, false);
  assert.equal(sample.readback.raw_result_report_text_present, false);
  assert.equal(sample.readback.operator_notes_persisted, false);
  assert.equal(sample.readback.dogfood_metrics_written, false);
  assert.equal(sample.readback.expected_observed_delta_global_record_written, false);
  assert.equal(sample.readback.reuse_outcome_global_record_written, false);
  assert.equal(sample.readback.proof_or_evidence_rows_written, false);
  assert.equal(sample.readback.work_or_perspective_rows_written, false);
  assert.equal(sample.readback.perspective_memory_written, false);
  assert.equal(sample.readback.product_write_executed, false);

  const committedSource = sample.sourceAReadback.records_by_receipt[0];
  assert.equal(committedSource.receipt.ledger_write_status, "rolled_back");
  assert.ok(committedSource.ledger_record, "rolled back receipt keeps ledger record");
  assert.equal(sample.rawTextSearch.receipts, 0);
  assert.equal(sample.rawTextSearch.records, 0);

  for (const table of [
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "verification_evidence_records",
    "action_records",
    "work_items",
    "work_events",
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_memory_product_persistence_boundary_records",
    "perspective_memory_items",
    "delivery_ledger",
  ]) {
    assert.equal(
      sample.countsAfterSupersedeAlreadySuperseded[table],
      0,
      `${table} must remain zero`,
    );
  }

  for (const table of [
    "research_candidate_manual_result_write_receipts",
    "research_candidate_manual_expected_observed_delta_records",
    "research_candidate_manual_reuse_outcome_records",
    "research_candidate_manual_result_write_rollbacks",
  ]) {
    assert.equal(
      sample.countsAfterSupersedeAlreadySuperseded[table],
      sample.countsAfterSetup[table],
      `${table} must not be mutated by global ledger writes`,
    );
  }
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-ledger-write-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-ledger-write-v0-1.mjs",
  );
  const normalized = docsSource.replace(/\s+/g, " ");
  for (const requiredText of [
    "Authorized Manual Bridge Global Dogfood Ledger Write v0.1 Pointer",
    "research_candidate_manual_global_dogfood_ledger_receipts",
    "research_candidate_manual_global_dogfood_ledger_records",
    "research_candidate_manual_global_dogfood_ledger_rollbacks",
    "duplicate_replayed",
    "rolled_back",
    "superseded",
    "no dogfood metrics",
    "no Perspective promotion",
    "no proof/evidence",
    "no work mutation",
    "no provider/GitHub/Codex",
    "no source fetching/retrieval",
    "no raw text persistence",
  ]) {
    assert.ok(normalized.includes(requiredText), `docs must include ${requiredText}`);
  }
}

function assertExistingSmokesPass() {
  for (const script of [
    "scripts/smoke-research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-result-dogfood-bridge-preview-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-result-authorized-record-write-v0-1.mjs",
  ]) {
    execFileSync("node", [script], { encoding: "utf8", stdio: "pipe" });
  }
}
