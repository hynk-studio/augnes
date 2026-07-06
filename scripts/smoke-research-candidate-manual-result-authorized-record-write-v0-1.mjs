import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const typePath =
  "types/research-candidate-manual-result-authorized-record-write.ts";
const writerPath =
  "lib/research-candidate-review/manual-result-authorized-record-write.ts";
const readbackPath =
  "lib/research-candidate-review/read-manual-result-records.ts";
const routePath =
  "app/api/research-candidate-review/manual-result-records/route.ts";
const rollbackRoutePath =
  "app/api/research-candidate-review/manual-result-records/[receipt_id]/rollback/route.ts";
const writePanelPath =
  "components/research-candidate-manual-note-authorized-record-write-panel.tsx";
const readbackPanelPath =
  "components/research-candidate-manual-note-record-readback-panel.tsx";
const operatorReviewPanelPath =
  "components/research-candidate-manual-note-result-intake-operator-review-panel.tsx";
const schemaPath = "lib/db/schema.sql";
const dbMigrationsPath = "scripts/db-migrations.mjs";
const dbMigratePath = "scripts/db-migrate.mjs";
const dbPath = "lib/db.ts";
const docsPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const smokePath =
  "scripts/smoke-research-candidate-manual-result-authorized-record-write-v0-1.mjs";
const resultIntakeOperatorSmokePath =
  "scripts/smoke-research-candidate-manual-note-result-intake-operator-review-v0-1.mjs";
const resultIntakeSmokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-result-intake-v0-1.mjs";
const seedSmokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-seed-v0-1.mjs";
const previewUiSmokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";
const packagePath = "package.json";

for (const filePath of [
  typePath,
  writerPath,
  readbackPath,
  routePath,
  rollbackRoutePath,
  writePanelPath,
  readbackPanelPath,
  operatorReviewPanelPath,
  schemaPath,
  dbMigrationsPath,
  dbMigratePath,
  dbPath,
  docsPath,
  smokePath,
  resultIntakeOperatorSmokePath,
  resultIntakeSmokePath,
  seedSmokePath,
  previewUiSmokePath,
  packagePath,
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
const operatorReviewPanelSource = readFileSync(operatorReviewPanelPath, "utf8");
const schemaSource = readFileSync(schemaPath, "utf8");
const dbMigrationsSource = readFileSync(dbMigrationsPath, "utf8");
const dbMigrateSource = readFileSync(dbMigratePath, "utf8");
const dbSource = readFileSync(dbPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertTypeContracts();
assertSchemaContracts();
assertRouteAndComponentBoundaries();
const sample = buildAndWriteSampleRecords();
assertWriteRejections(sample);
assertCommittedWrite(sample);
assertDuplicateReplay(sample);
assertSupersedeAndRollback(sample);
assertReadbackBoundaries(sample);
assertForbiddenStaticPatterns();
assertExistingManualNoteSmokesPass();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-result-authorized-record-write-v0-1",
      pass: true,
      schema_tables_checked: true,
      writer_rejections_checked: true,
      committed_record_write_checked: true,
      duplicate_replay_checked: true,
      supersede_checked: true,
      rollback_metadata_checked: true,
      readback_checked: true,
      forbidden_side_effects_checked: true,
      existing_manual_note_smokes_passed: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertTypeContracts() {
  for (const requiredText of [
    "ResearchCandidateManualResultAuthorizedWriteRequest",
    "ResearchCandidateManualResultAuthorizedWriteAuthority",
    "ResearchCandidateManualResultWriteReceipt",
    "ResearchCandidateManualExpectedObservedDeltaRecord",
    "ResearchCandidateManualReuseOutcomeRecord",
    "ResearchCandidateManualResultRollbackRequest",
    "ResearchCandidateManualResultReadback",
    "RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION",
    "I authorize writing these manual research candidate result records",
    "can_write_manual_expected_observed_delta_record: true",
    "can_write_manual_reuse_outcome_record: true",
    "can_write_manual_result_write_receipt: true",
    "can_write_manual_result_rollback_metadata: true",
    "can_write_proof_or_evidence: false",
    "can_create_or_update_work_item: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_update_global_dogfood_metrics: false",
    "can_execute_codex: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "persists_raw_manual_note_text: false",
    "persists_raw_result_report_text: false",
    "persists_operator_notes: false",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type contract must include ${requiredText}`);
  }
}

function assertSchemaContracts() {
  for (const requiredText of [
    "research_candidate_manual_result_write_receipts",
    "research_candidate_manual_expected_observed_delta_records",
    "research_candidate_manual_reuse_outcome_records",
    "research_candidate_manual_result_write_rollbacks",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "source_operator_review_fingerprint TEXT NOT NULL",
    "source_record_contract_fingerprint TEXT NOT NULL",
    "write_status IN",
    "'committed'",
    "'duplicate_replayed'",
    "'superseded'",
    "'rolled_back'",
    "source_refs_json TEXT NOT NULL",
    "selected_candidate_context_refs_json TEXT NOT NULL",
    "warning_reasons_json TEXT NOT NULL",
  ]) {
    assert.ok(schemaSource.includes(requiredText), `schema must include ${requiredText}`);
  }
  assert.ok(
    dbMigrationsSource.includes("migrateResearchCandidateManualResultRecords"),
    "db-migrations must expose manual result record migration",
  );
  assert.ok(
    dbMigrateSource.includes("migrateResearchCandidateManualResultRecords"),
    "db:migrate must run manual result record migration",
  );
  assert.ok(
    dbSource.includes("migrateResearchCandidateManualResultRecordsTables"),
    "openDatabase must initialize manual result record tables",
  );
}

function assertRouteAndComponentBoundaries() {
  assert.match(
    routeSource,
    /fetch|NextResponse|writeResearchCandidateManualResultAuthorizedRecords/,
    "route must expose write handler through NextResponse",
  );
  assert.match(
    routeSource,
    /requestHasSameOriginBoundary/,
    "write route must enforce same-origin boundary",
  );
  assert.match(
    routeSource,
    /readResearchCandidateManualResultRecords/,
    "route must expose readback",
  );
  assert.match(
    rollbackRouteSource,
    /rollbackResearchCandidateManualResultWriteReceipt/,
    "rollback route must call rollback helper",
  );
  assert.match(
    rollbackRouteSource,
    /records_deleted:\s*false/,
    "rollback route must state records are not deleted",
  );
  assert.match(
    writePanelSource,
    /Write authorized records/,
    "write panel must expose explicit write button",
  );
  assert.match(
    writePanelSource,
    /RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION/,
    "write panel must require exact confirmation text",
  );
  assert.match(
    writePanelSource,
    /fetch\(\s*["'`]\/api\/research-candidate-review\/manual-result-records/,
    "write panel must POST to same-origin manual result records route",
  );
  assert.match(
    writePanelSource,
    /Record rollback metadata/,
    "write panel must expose rollback metadata control",
  );
  assert.match(
    readbackPanelSource,
    /raw_result_report_text_present/,
    "readback panel must show raw result report absence",
  );
  assert.match(
    operatorReviewPanelSource,
    /ResearchCandidateManualNoteAuthorizedRecordWritePanel/,
    "operator review panel must render authorized write panel after ready contract preview",
  );
  assert.doesNotMatch(
    writePanelSource,
    /localStorage|sessionStorage|indexedDB|navigator\.clipboard|writeText|api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|executeCodex|runCodex|launchCodex/i,
    "write panel must not add browser storage, clipboard, provider, GitHub, or Codex behavior",
  );
  assert.doesNotMatch(
    `${routeSource}\n${rollbackRouteSource}`,
    /api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources|ragIndex|vectorStore|scrapeSource/i,
    "routes must not add provider/OpenAI, GitHub, Codex, retrieval, or source-fetch behavior",
  );
}

function buildAndWriteSampleRecords() {
  const code = `
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
  writeResearchCandidateManualResultAuthorizedRecords,
  rollbackResearchCandidateManualResultWriteReceipt
} from "./lib/research-candidate-review/manual-result-authorized-record-write";
import { readResearchCandidateManualResultRecords } from "./lib/research-candidate-review/read-manual-result-records";

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(readFileSync("lib/db/schema.sql", "utf8"));

const note = [
  "Research Question: Can an accepted manual Research Candidate result contract write narrow durable records?",
  "Operator Intent: Authorize only manual ExpectedObservedDelta and Reuse Outcome records.",
  "Source Title: Manual authorized result record note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-authorized-write-001",
  "Claim: A complete reviewed result-intake contract can write narrow manual result records after explicit confirmation.",
  "Evidence: supports: The contract preview includes expected and observed summaries plus a reuse outcome candidate.",
  "Tension: A write receipt could be mistaken for proof, evidence, or Perspective promotion.",
  "Gap: Need duplicate replay and rollback metadata readback. next: temp DB validation",
  "Perspective Delta: Keep manual result records separate from canonical Perspective promotion.",
  "Next: Implement authorized manual result records. files: lib/research-candidate-review/manual-result-authorized-record-write.ts checks: npm run smoke:research-candidate-manual-result-authorized-record-write-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:sample-authorized-write",
    persisted_preview_draft: false
  },
  target_label: "Manual authorized write smoke sample"
});

function makeReport({ outcome = "helpful", observed = "The authorized write path stored one manual EOD record and one reuse outcome record." } = {}) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1002",
    "pr_number: 1002",
    "live_host_observation: /research-candidate-review showed the authorized write panel.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + observed,
    "",
    "## Files changed",
    "- types/research-candidate-manual-result-authorized-record-write.ts",
    "- lib/research-candidate-review/manual-result-authorized-record-write.ts",
    "- lib/research-candidate-review/read-manual-result-records.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-result-authorized-record-write-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Browser validation still needs live temp DB confirmation.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Candidate context helped keep the durable write narrow and idempotent.",
    "",
    "## Authority boundary statement",
    "Authorized manual result records only; no proof/evidence rows, no work status change, no Perspective promotion, no provider calls, no GitHub automation, and no Codex execution."
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
    operator_notes: "Local review note that must not be stored."
  });
  const contract = buildResearchCandidateManualNoteResultRecordContractPreview({
    result_intake: intake,
    operator_review: review
  });
  return { intake, review, contract };
}

const ready = makeFlow(makeReport());
const changed = makeFlow(makeReport({
  outcome: "stale",
  observed: "The superseding authorized write stored revised manual result summaries."
}));
const incomplete = makeFlow(makeReport().replace("selected candidate context outcome: helpful\\n", ""));
const rejectedReview = buildResearchCandidateManualNoteResultIntakeOperatorReview({
  result_intake: ready.intake,
  operator_decision: "reject_result_intake_preview"
});
const rejectedContract = buildResearchCandidateManualNoteResultRecordContractPreview({
  result_intake: ready.intake,
  operator_review: rejectedReview
});

function requestFor(flow, authorization = {}) {
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

const missingConfirmation = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(ready, { operator_confirmation_text: "wrong" }),
  { db }
);
const incompleteResult = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(incomplete),
  { db }
);
const rejectedResult = writeResearchCandidateManualResultAuthorizedRecords(
  {
    result_intake: ready.intake,
    operator_review: rejectedReview,
    record_contract_preview: rejectedContract,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_record_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
      write_mode: "commit"
    }
  },
  { db }
);
const rawTextResult = writeResearchCandidateManualResultAuthorizedRecords(
  {
    ...requestFor(ready),
    codex_result_report_text: "raw pasted report should be refused"
  },
  { db }
);
const wrongBoundaryRequest = requestFor(ready);
wrongBoundaryRequest.record_contract_preview = {
  ...wrongBoundaryRequest.record_contract_preview,
  record_write_authorized: true
};
const wrongBoundaryResult = writeResearchCandidateManualResultAuthorizedRecords(
  wrongBoundaryRequest,
  { db }
);

const committed = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(ready),
  { db }
);
const duplicate = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(ready),
  { db }
);
const superseded = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(changed, {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committed.receipt.receipt_id
  }),
  { db }
);
const rollback = rollbackResearchCandidateManualResultWriteReceipt(
  {
    receipt_id: superseded.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_record_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke test rollback metadata without deleting manual records."
    }
  },
  { db }
);
const readback = readResearchCandidateManualResultRecords({ db, limit: 10 });

const tableCounts = Object.fromEntries([
  "research_candidate_manual_result_write_receipts",
  "research_candidate_manual_expected_observed_delta_records",
  "research_candidate_manual_reuse_outcome_records",
  "research_candidate_manual_result_write_rollbacks",
  "verification_evidence_records",
  "work_items",
  "work_events",
  "perspective_states",
  "perspective_memory_items",
  "dogfooding_records"
].map((table) => [
  table,
  db.prepare("SELECT COUNT(*) AS count FROM " + table).get().count
]));

console.log(JSON.stringify({
  missingConfirmation,
  incompleteResult,
  rejectedResult,
  rawTextResult,
  wrongBoundaryResult,
  committed,
  duplicate,
  superseded,
  rollback,
  readback,
  tableCounts
}));
`;
  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertWriteRejections(sample) {
  assert.equal(sample.missingConfirmation.ok, false);
  assert.ok(
    sample.missingConfirmation.refusal_reasons.includes(
      "operator_confirmation_text_mismatch",
    ),
  );
  assert.equal(sample.incompleteResult.ok, false);
  assert.ok(
    sample.incompleteResult.refusal_reasons.some((reason) =>
      /not_ready|validation_not_passed|not_ready_for_operator/.test(reason),
    ),
    "incomplete intake must be refused before write",
  );
  assert.equal(sample.rejectedResult.ok, false);
  assert.ok(
    sample.rejectedResult.refusal_reasons.includes(
      "operator_review_decision_not_prepare_record_contract",
    ),
  );
  assert.equal(sample.rawTextResult.ok, false);
  assert.ok(sample.rawTextResult.refusal_reasons.includes("raw_text_field_refused"));
  assert.equal(sample.wrongBoundaryResult.ok, false);
  assert.ok(
    sample.wrongBoundaryResult.refusal_reasons.includes(
      "preview_contract_write_flags_not_false",
    ),
  );
}

function assertCommittedWrite(sample) {
  assert.equal(sample.committed.ok, true);
  assert.equal(sample.committed.result_status, "committed");
  assert.equal(sample.committed.duplicate_replayed, false);
  assert.match(sample.committed.receipt.receipt_id, /^manual-result-receipt:fnv1a32:[0-9a-f]{8}$/);
  assert.match(sample.committed.receipt.idempotency_key, /^manual-result-record-write:fnv1a32:[0-9a-f]{8}$/);
  assert.match(sample.committed.expected_observed_delta_record.record_id, /^manual-eod-record:fnv1a32:[0-9a-f]{8}$/);
  assert.match(sample.committed.reuse_outcome_record.record_id, /^manual-reuse-record:fnv1a32:[0-9a-f]{8}$/);
  assert.equal(sample.committed.reuse_outcome_record.writes_ledger, false);
  assert.equal(Object.hasOwn(sample.committed.receipt, "operator_notes"), false);
}

function assertDuplicateReplay(sample) {
  assert.equal(sample.duplicate.ok, true);
  assert.equal(sample.duplicate.result_status, "duplicate_replayed");
  assert.equal(sample.duplicate.duplicate_replayed, true);
  assert.equal(
    sample.duplicate.receipt.receipt_id,
    sample.committed.receipt.receipt_id,
    "duplicate replay must return the existing receipt",
  );
  assert.equal(
    sample.tableCounts.research_candidate_manual_result_write_receipts,
    2,
    "duplicate replay plus one supersede write should leave two receipts only",
  );
  assert.equal(sample.tableCounts.research_candidate_manual_expected_observed_delta_records, 2);
  assert.equal(sample.tableCounts.research_candidate_manual_reuse_outcome_records, 2);
}

function assertSupersedeAndRollback(sample) {
  assert.equal(sample.superseded.ok, true);
  assert.equal(sample.superseded.result_status, "committed");
  assert.equal(
    sample.superseded.receipt.supersedes_receipt_id,
    sample.committed.receipt.receipt_id,
  );
  const supersededReadback = sample.readback.records_by_receipt.find(
    (item) => item.receipt.receipt_id === sample.committed.receipt.receipt_id,
  );
  assert.equal(supersededReadback.receipt.write_status, "superseded");
  assert.equal(sample.rollback.ok, true);
  assert.equal(sample.rollback.result_status, "rolled_back");
  assert.equal(sample.tableCounts.research_candidate_manual_result_write_rollbacks, 1);
  const rolledBackReadback = sample.readback.records_by_receipt.find(
    (item) => item.receipt.receipt_id === sample.superseded.receipt.receipt_id,
  );
  assert.equal(rolledBackReadback.receipt.write_status, "rolled_back");
  assert.equal(rolledBackReadback.rolled_back, true);
  assert.ok(rolledBackReadback.rollback.rollback_reason.includes("Smoke test rollback"));
}

function assertReadbackBoundaries(sample) {
  assert.equal(sample.readback.count, 2);
  assert.equal(sample.readback.raw_manual_note_text_present, false);
  assert.equal(sample.readback.raw_result_report_text_present, false);
  assert.equal(sample.readback.proof_or_evidence_rows_written, false);
  assert.equal(sample.readback.work_or_perspective_rows_written, false);
  assert.equal(sample.tableCounts.verification_evidence_records, 0);
  assert.equal(sample.tableCounts.work_items, 0);
  assert.equal(sample.tableCounts.work_events, 0);
  assert.equal(sample.tableCounts.perspective_states, 0);
  assert.equal(sample.tableCounts.perspective_memory_items, 0);
  assert.equal(sample.tableCounts.dogfooding_records, 0);
}

function assertForbiddenStaticPatterns() {
  assert.doesNotMatch(
    `${writerSource}\n${readbackSource}`,
    /node:crypto|createHash|crypto\.subtle/,
    "manual result writer/readback should use browser-safe deterministic fingerprints, not crypto APIs",
  );
  assert.doesNotMatch(
    `${writerSource}\n${readbackSource}\n${routeSource}\n${rollbackRouteSource}`,
    /\bnew\s+OpenAI\b|api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources\s*\(|ragIndex\s*\(|vectorStore\s*\(|scrapeSource\s*\(|crawlSources\s*\(/i,
    "write path must not add provider/OpenAI, GitHub, Codex, retrieval, or source-fetch behavior",
  );
  assert.doesNotMatch(
    `${writerSource}\n${routeSource}\n${rollbackRouteSource}`,
    /INSERT\s+INTO\s+(verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|dogfooding_records|dogfooding_signals)|UPDATE\s+(work_items|work_events|perspective_states|perspective_memory_items|dogfooding_records)/i,
    "write path must not write proof/evidence/work/Perspective/memory/global dogfood tables",
  );
  assert.match(
    writerSource,
    /BEGIN IMMEDIATE/,
    "writer must use an explicit transaction for durable rows",
  );
  assert.match(
    writerSource,
    /idempotency_key/,
    "writer must compute and check idempotency",
  );
}

function assertExistingManualNoteSmokesPass() {
  for (const script of [
    resultIntakeOperatorSmokePath,
    resultIntakeSmokePath,
    seedSmokePath,
    previewUiSmokePath,
  ]) {
    execFileSync("node", [script], { encoding: "utf8", stdio: "pipe" });
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-manual-result-authorized-record-write-v0-1"
    ],
    `node ${smokePath}`,
    "package.json must include the authorized record write smoke script",
  );
}
