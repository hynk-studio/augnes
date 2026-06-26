import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const promotionDocPath = "docs/PROMOTION_DECISION_STORE_ROUTE_V0_1.md";
const docPath = "docs/FORMATION_RECEIPT_DURABLE_WRITE_V0_1.md";
const promotionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const builderPath = "lib/perspective/formation-receipt/build-durable-receipt.ts";
const storePath = "lib/perspective/formation-receipt/formation-receipt-store.ts";
const routePath = "app/api/perspective/formation-receipts/route.ts";
const fixturePath = "fixtures/formation-receipt-durable-write.sample.v0.1.json";
const schemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const builderVersion = "formation_receipt_builder.v0.1";
const recordVersion = "formation_receipt_record.v0.1";
const activityVersion = "formation_receipt_activity.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:formation-receipt-durable-write-v0-1";
const packageScriptValue = "node scripts/smoke-formation-receipt-durable-write-v0-1.mjs";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Formation Receipt Durable Write records why context was selected, omitted, or deferred.",
  "Formation Receipt is required before durable state apply.",
  "Formation Receipt write is not durable Perspective state apply.",
  "Formation Receipt is not proof of correctness.",
  "Formation Receipt is not evidence by itself.",
  "Durable Perspective state apply is deferred.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Selected candidates are preserved.",
  "Omitted candidates are preserved.",
  "Deferred candidates are preserved.",
  "Unresolved tensions are preserved.",
  "Knowledge gaps are preserved.",
  "Explicit user action is required.",
  "roadmap guide is not SSOT",
];

const forbiddenFixtureMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw formation receipt payload",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = [
  "raw formation receipt payload blocked by fixture",
  "secret-like formation receipt input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "durable_state_applied: true",
  "promotion_executed: true",
  "proof_or_evidence_created: true",
  "claim_or_evidence_written: true",
  "product_write_executed: true",
  "durable_perspective_state_apply_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
];

const forbiddenRouteSnippets = [
  "fetch(",
  "OpenAI",
  "embeddings.create",
  "provider response:",
  "actual prompt:",
  "retrieval execution implementation",
  "rag answer generation",
  "source fetch implementation",
  "product write implementation",
  "durable state apply implementation",
  "proof evidence write implementation",
  "createPullRequest",
  "github.",
  "git commit",
];

const forbiddenBoundaryFalseFields = [
  "durable_perspective_state_apply_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "source_of_truth",
  "formation_receipt_is_proof",
  "formation_receipt_is_evidence",
  "formation_receipt_is_state_apply",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "rag_context_is_truth",
  "feedback_is_truth",
  "product_write_authority",
];

for (const filePath of [
  roadmapPath,
  promotionDocPath,
  docPath,
  promotionStorePath,
  builderPath,
  storePath,
  routePath,
  fixturePath,
  schemaPath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const promotionDocText = readText(promotionDocPath);
const docText = readText(docPath);
const builderText = readText(builderPath);
const storeText = readText(storePath);
const routeText = readText(routePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const schemaText = readText(schemaPath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const builder = await import(pathToFileURL(builderPath).href);
const store = await import(pathToFileURL(storePath).href);
const promotionStore = await import(pathToFileURL(promotionStorePath).href);

assertIncludes(roadmapText, "formation_receipt_durable_write_v0_1", "roadmap has Phase 4.3 slice");
assertIncludes(
  promotionDocText,
  "Promotion Decision Store/Routes records explicit operator decisions.",
  "PR #783/#784 promotion decision store docs exist",
);

assert.equal(fixture.fixture_version, "formation_receipt_durable_write.sample.v0.1");
assert.equal(fixture.builder_version, builderVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.activity_version, activityVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert(Array.isArray(fixture.expected_records) && fixture.expected_records.length > 0);
assert(Array.isArray(fixture.expected_activities) && fixture.expected_activities.length > 0);
assert(Array.isArray(fixture.valid_create_inputs) && fixture.valid_create_inputs.length > 0);
assert(Array.isArray(fixture.expected_create_results) && fixture.expected_create_results.length > 0);
assert(Array.isArray(fixture.expected_read_results) && fixture.expected_read_results.length > 0);
assert(Array.isArray(fixture.expected_list_results) && fixture.expected_list_results.length > 0);
assert(Array.isArray(fixture.expected_discard_results) && fixture.expected_discard_results.length > 0);
assert(Array.isArray(fixture.expected_rejection_results) && fixture.expected_rejection_results.length > 0);

for (const tableName of [
  "perspective_formation_receipts",
  "perspective_formation_receipt_selected_candidates",
  "perspective_formation_receipt_omitted_candidates",
  "perspective_formation_receipt_deferred_candidates",
  "perspective_formation_receipt_sources",
  "perspective_formation_receipt_activity",
]) {
  assertIncludes(schemaText, tableName, `schema contains ${tableName}`);
}

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertIndexCoverage();
assertDocsCoverage();
assertFixturePrivacy();
assertStaticRouteBoundaries();
assertTypeAndHelperExports();
assertExpectedFixtureRecords();
assertTempDbBehavior();

console.log(
  JSON.stringify(
    {
      smoke: "formation-receipt-durable-write-v0-1",
      final_status: "pass",
      builder_version: builderVersion,
      record_version: recordVersion,
      valid_inputs: fixture.valid_create_inputs.length,
      rejection_cases: fixture.expected_rejection_results.length,
    },
    null,
    2,
  ),
);

function assertTempDbBehavior() {
  const Database = require("better-sqlite3");
  const tempDir = join(tmpdir(), "augnes-formation-receipt-durable-write-v0-1");
  const tempDbPath = join(tempDir, "formation-receipts.sqlite");
  assert(tempDbPath.startsWith(tmpdir()), "smoke must use a temp DB");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(tempDbPath);
  try {
    store.ensureFormationReceiptStoreSchemaV01(db);
    assertMissingPromotionStoreIsBlocked(db);
    seedPromotionDecisionLineage(db);
    for (const input of fixture.valid_create_inputs) {
      const built = builder.buildFormationReceiptRecordV01(input);
      assert.equal(built.receipt_id, input.receipt_id, "builder preserves receipt_id");
      assert.equal(built.formation_receipt_written, true, "builder marks receipt written");
      assert.equal(built.durable_state_applied, false, "builder does not apply durable state");
      assert.equal(built.product_write_executed, false, "builder does not product-write");

      const createResult = store.createFormationReceiptV01(input, db);
      assert.equal(createResult.status, "written", `${input.receipt_id} stores`);
      assertValidStoreResult(createResult);
      assert.equal(createResult.record.receipt_id, input.receipt_id);
      assert.equal(createResult.record.selected_candidate_refs.length, 2);
      assert.equal(createResult.record.omitted_candidate_refs.length, 1);
      assert.equal(createResult.record.deferred_candidate_refs.length, 1);
      assertNoUnsafePayloadEcho(createResult);
    }

    const receiptId = "formation-receipt:durable-write:001";
    const readResult = store.readFormationReceiptV01(receiptId, db);
    assert.equal(readResult.status, "written", "read stored Formation Receipt");
    assert.equal(readResult.record.receipt_id, receiptId);
    assertValidRecord(readResult.record);

    const byPromotionDecision = store.listFormationReceiptsV01(
      { promotion_decision_id: "promotion-decision:store:promote:001" },
      db,
    );
    assert(byPromotionDecision.records.some((record) => record.receipt_id === receiptId));

    const byReviewRecord = store.listFormationReceiptsV01(
      { review_record_ref: "review-record:promotion:001" },
      db,
    );
    assert(byReviewRecord.records.some((record) => record.receipt_id === receiptId));

    const missing = store.readFormationReceiptV01("formation-receipt:durable-write:unknown:404", db);
    assert.equal(missing.status, "not_found");

    const activityResult = store.appendFormationReceiptActivityV01(
      {
        activity_id: "formation-receipt:durable-write:001:activity:manual-smoke",
        receipt_id: receiptId,
        activity_kind: "formation_receipt_listed",
        actor_ref: "operator:reviewer:001",
        summary: "Bounded smoke activity append for Formation Receipt.",
        reason_codes: ["formation_receipt_written", "durable_state_not_applied"],
        created_at: "2026-06-26T00:00:04.000Z",
      },
      db,
    );
    assert.equal(activityResult.status, "written");
    assert.equal(activityResult.activities[0].activity_kind, "formation_receipt_listed");

    const orphanReceiptId = "formation-receipt:durable-write:unknown:orphan-activity";
    const orphanActivityResult = store.appendFormationReceiptActivityV01(
      {
        activity_id: `${orphanReceiptId}:activity:orphan`,
        receipt_id: orphanReceiptId,
        activity_kind: "formation_receipt_listed",
        actor_ref: "operator:reviewer:001",
        summary: "Bounded smoke orphan activity append must be rejected.",
        reason_codes: ["formation_receipt_written", "durable_state_not_applied"],
        created_at: "2026-06-26T00:00:05.000Z",
      },
      db,
    );
    assert.equal(orphanActivityResult.status, "not_found", "orphan activity append is rejected");
    assert.equal(countActivityRows(db, orphanReceiptId), 0, "orphan activity row is not inserted");

    assertRejection("missing_promotion_decision", "blocked_missing_promotion_decision", db);
    assertRejection("missing_review_record", "blocked_missing_review_record", db);
    assertRejection("missing_selected_candidates", "blocked_missing_selected_candidates", db);
    assertRejection("missing_selected_source_refs", "blocked_missing_selected_source_refs", db);
    assertRejection("forbidden_authority", "blocked_forbidden_authority", db);
    assertRejection("private_raw_payload", "blocked_private_or_raw_payload", db);
    assertRejection("secret_like_payload", "blocked_private_or_raw_payload", db);
    assertLineageRejectionIsAtomic(
      "unknown_promotion_decision",
      "blocked_missing_promotion_decision",
      "promotion_decision_ref_missing",
      db,
    );
    assertLineageRejectionIsAtomic(
      "discarded_promotion_decision",
      "blocked_invalid_input",
      "promotion_decision_discarded",
      db,
    );
    assertLineageRejectionIsAtomic(
      "non_promote_promotion_decision",
      "blocked_invalid_input",
      "promotion_decision_not_promote",
      db,
    );
    assertLineageRejectionIsAtomic(
      "non_eligible_promotion_decision",
      "blocked_invalid_input",
      "promotion_decision_not_eligible",
      db,
    );
    assertLineageRejectionIsAtomic(
      "promotion_review_record_mismatch",
      "blocked_invalid_input",
      "promotion_decision_review_record_mismatch",
      db,
    );
    assertLineageRejectionIsAtomic(
      "promotion_operator_mismatch",
      "blocked_invalid_input",
      "promotion_decision_operator_mismatch",
      db,
    );
    assertDuplicateCreateRejectionIsAtomic("duplicate_candidate_id", db);
    assertDuplicateCreateRejectionIsAtomic("duplicate_source_id", db);

    const discardResult = store.discardFormationReceiptV01(
      receiptId,
      "operator-discarded-formation-receipt",
      db,
    );
    assert.equal(discardResult.status, "discarded");
    assert.equal(discardResult.record.discard_reason, "operator-discarded-formation-receipt");
    assert(discardResult.record.discarded_at, "discarded_at is present");

    const discardedRead = store.readFormationReceiptV01(receiptId, db);
    assert.equal(discardedRead.status, "discarded");
    assert.equal(discardedRead.record.discard_reason, "operator-discarded-formation-receipt");
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertMissingPromotionStoreIsBlocked(db) {
  const input = clone(fixture.valid_create_inputs[0]);
  input.receipt_id = "formation-receipt:durable-write:invalid:missing-promotion-store";
  const result = store.createFormationReceiptV01(input, db);
  assert.equal(result.status, "blocked_missing_promotion_decision");
  assert(result.reason_codes.includes("promotion_decision_store_missing"));
  assert(result.reason_codes.includes("promotion_decision_ref_missing"));
  const counts = countPersistedRowsForReceipt(db, input.receipt_id);
  assert.equal(counts.receipts, 0, "missing promotion store leaves no receipt row");
  assert.equal(counts.selectedCandidates, 0, "missing promotion store leaves no selected candidate rows");
  assert.equal(counts.omittedCandidates, 0, "missing promotion store leaves no omitted candidate rows");
  assert.equal(counts.deferredCandidates, 0, "missing promotion store leaves no deferred candidate rows");
  assert.equal(counts.sources, 0, "missing promotion store leaves no source rows");
  assert.equal(counts.activities, 0, "missing promotion store leaves no activity rows");
  assertNoUnsafePayloadEcho(result);
}

function seedPromotionDecisionLineage(db) {
  for (const input of [
    makePromotionDecisionInput("promotion-decision:store:promote:001", {
      review_record_ref: "review-record:promotion:001",
      operator_actor_ref: "operator:reviewer:001",
      created_at: "2026-06-26T00:00:00.000Z",
    }),
    makePromotionDecisionInput("promotion-decision:lineage:discarded:001", {
      review_record_ref: "review-record:promotion:001",
      operator_actor_ref: "operator:reviewer:001",
      created_at: "2026-06-26T00:00:01.000Z",
    }),
    makePromotionDecisionInput("promotion-decision:lineage:non-promote:001", {
      decision_kind: "reject",
      decision_status: "eligible_for_future_operator_decision",
      review_record_ref: "review-record:promotion:001",
      operator_actor_ref: "operator:reviewer:001",
      created_at: "2026-06-26T00:00:02.000Z",
    }),
    makePromotionDecisionInput("promotion-decision:lineage:non-eligible:001", {
      decision_kind: "promote",
      decision_status: "candidate_only",
      review_record_ref: "review-record:promotion:001",
      operator_actor_ref: "operator:reviewer:001",
      created_at: "2026-06-26T00:00:03.000Z",
    }),
    makePromotionDecisionInput("promotion-decision:lineage:review-mismatch:001", {
      review_record_ref: "review-record:promotion:lineage-source",
      operator_actor_ref: "operator:reviewer:001",
      created_at: "2026-06-26T00:00:04.000Z",
    }),
    makePromotionDecisionInput("promotion-decision:lineage:operator-mismatch:001", {
      review_record_ref: "review-record:promotion:001",
      operator_actor_ref: "operator:reviewer:lineage-source",
      created_at: "2026-06-26T00:00:05.000Z",
    }),
  ]) {
    const createResult = promotionStore.createPromotionDecisionRecordV01(input, db);
    assert.equal(createResult.status, "stored", `${input.promotion_decision_id} promotion decision seeded`);
  }

  const discardResult = promotionStore.discardPromotionDecisionRecordV01(
    "promotion-decision:lineage:discarded:001",
    "operator-discarded-before-formation-receipt",
    db,
  );
  assert.equal(discardResult.status, "discarded", "discarded promotion decision seeded");
}

function makePromotionDecisionInput(promotionDecisionId, overrides = {}) {
  const reviewRecordRef = overrides.review_record_ref ?? "review-record:promotion:001";
  return {
    contract_version: "perspective_promotion_runtime_contract.v0.1",
    scope,
    promotion_decision_id: promotionDecisionId,
    decision_kind: overrides.decision_kind ?? "promote",
    decision_status: overrides.decision_status ?? "eligible_for_future_operator_decision",
    operator_actor_ref: overrides.operator_actor_ref ?? "operator:reviewer:001",
    explicit_user_action_required: true,
    future_operator_decision_only: true,
    review_record_ref: reviewRecordRef,
    gate_report_ref: `${promotionDecisionId}:gate-report`,
    basis_refs: [
      {
        basis_version: "perspective_promotion_basis.v0.1",
        scope,
        basis_id: `${promotionDecisionId}:basis:source`,
        basis_kind: "source_ref",
        basis_ref: "source-ref:bounded:001",
        source_refs: ["source-ref:bounded:001"],
        candidate_refs: [],
        review_record_refs: [reviewRecordRef],
        rag_context_preview_refs: [],
        retrieval_candidate_refs: [],
        provider_candidate_refs: [],
        feedback_refs: [],
        bounded_summary: "Bounded source lineage summary for Formation Receipt smoke.",
        privacy_class: "public_safe_refs_only",
        redaction_status: "not_needed",
        public_safe: true,
        reason_codes: ["source_ref_present", "basis_candidate_ref_present"],
      },
      {
        basis_version: "perspective_promotion_basis.v0.1",
        scope,
        basis_id: `${promotionDecisionId}:basis:claim`,
        basis_kind: "claim_candidate",
        basis_ref: "claim-candidate:bounded:001",
        source_refs: ["source-ref:bounded:001"],
        candidate_refs: ["claim-candidate:bounded:001"],
        review_record_refs: [reviewRecordRef],
        rag_context_preview_refs: [],
        retrieval_candidate_refs: [],
        provider_candidate_refs: [],
        feedback_refs: [],
        bounded_summary: "Bounded claim lineage summary for Formation Receipt smoke.",
        privacy_class: "public_safe_refs_only",
        redaction_status: "not_needed",
        public_safe: true,
        reason_codes: ["claim_candidate_ref_present", "source_ref_present"],
      },
    ],
    basis_claim_candidate_refs: ["claim-candidate:bounded:001"],
    basis_evidence_candidate_refs: ["evidence-candidate:bounded:001"],
    perspective_delta_candidate_refs: ["perspective-delta:bounded:001"],
    accepted_evidence_refs: [],
    unresolved_tension_refs: ["unresolved-tension:bounded:001"],
    knowledge_gap_refs: ["knowledge-gap:bounded:001"],
    unresolved_tension_policy: "preserve_unresolved",
    knowledge_gap_policy: "preserve_gap",
    formation_receipt_policy: "required_before_state_apply",
    promotion_executed: false,
    decision_store_written: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: [
      "contract_ref_present",
      "review_record_ref_present",
      "source_ref_present",
      "basis_ref_present",
      "operator_actor_present",
      "explicit_user_action_required",
      "future_operator_decision_only",
      "promotion_not_executed",
      "formation_receipt_not_written",
      "durable_state_not_applied",
      "proof_not_created",
      "evidence_not_created",
      "claim_evidence_not_written",
      "product_write_denied",
    ],
    boundary_notes: [
      "Promotion decision record storage is not promotion execution.",
      "Product-write remains parked by #686.",
    ],
    created_at: overrides.created_at ?? "2026-06-26T00:00:00.000Z",
    updated_at: overrides.updated_at ?? overrides.created_at ?? "2026-06-26T00:00:00.000Z",
  };
}

function assertRejection(caseName, expectedStatus, db) {
  const input = invalidInput(caseName);
  const result = store.createFormationReceiptV01(input, db);
  assert.equal(result.status, expectedStatus, `${caseName} returns ${expectedStatus}`);
  assert.equal(result.record, null, `${caseName} does not return record`);
  assertNoUnsafePayloadEcho(result);
  assert(result.authority_boundary, `${caseName} includes authority boundary`);
}

function assertLineageRejectionIsAtomic(caseName, expectedStatus, expectedReasonCode, db) {
  const input = invalidInput(caseName);
  const result = store.createFormationReceiptV01(input, db);
  assert.equal(result.status, expectedStatus, `${caseName} returns ${expectedStatus}`);
  assert(result.reason_codes.includes(expectedReasonCode), `${caseName} has ${expectedReasonCode}`);
  assert(result.reason_codes.includes("formation_receipt_required_before_state_apply"));
  assert(result.reason_codes.includes("durable_state_not_applied"));
  assert(result.reason_codes.includes("product_write_denied"));
  assert.equal(result.record, null, `${caseName} does not return record`);
  const counts = countPersistedRowsForReceipt(db, input.receipt_id);
  assert.equal(counts.receipts, 0, `${caseName} leaves no receipt row`);
  assert.equal(counts.selectedCandidates, 0, `${caseName} leaves no selected candidate rows`);
  assert.equal(counts.omittedCandidates, 0, `${caseName} leaves no omitted candidate rows`);
  assert.equal(counts.deferredCandidates, 0, `${caseName} leaves no deferred candidate rows`);
  assert.equal(counts.sources, 0, `${caseName} leaves no source rows`);
  assert.equal(counts.activities, 0, `${caseName} leaves no activity rows`);
  assertNoUnsafePayloadEcho(result);
  assert(result.authority_boundary, `${caseName} includes authority boundary`);
}

function assertDuplicateCreateRejectionIsAtomic(caseName, db) {
  const input = invalidInput(caseName);
  const result = store.createFormationReceiptV01(input, db);
  assert.equal(result.status, "blocked_invalid_input", `${caseName} returns blocked_invalid_input`);
  assert.equal(result.record, null, `${caseName} does not return record`);
  const counts = countPersistedRowsForReceipt(db, input.receipt_id);
  assert.equal(counts.receipts, 0, `${caseName} leaves no receipt row`);
  assert.equal(counts.selectedCandidates, 0, `${caseName} leaves no selected candidate rows`);
  assert.equal(counts.omittedCandidates, 0, `${caseName} leaves no omitted candidate rows`);
  assert.equal(counts.deferredCandidates, 0, `${caseName} leaves no deferred candidate rows`);
  assert.equal(counts.sources, 0, `${caseName} leaves no source rows`);
  assert.equal(counts.activities, 0, `${caseName} leaves no activity rows`);
  const readAfterBlockedCreate = store.readFormationReceiptV01(input.receipt_id, db);
  assert.equal(readAfterBlockedCreate.status, "not_found", `${caseName} remains unreadable`);
}

function invalidInput(caseName) {
  const base = clone(fixture.valid_create_inputs[0]);
  const override = clone(fixture.invalid_create_inputs[caseName]);
  assert(override, `invalid fixture case exists: ${caseName}`);
  delete override.based_on;
  return {
    ...base,
    receipt_id: `formation-receipt:durable-write:invalid:${caseName}`,
    ...clone(override),
  };
}

function assertValidStoreResult(result) {
  assert(result.authority_boundary, "result includes authority boundary");
  assertBoundary(result.authority_boundary);
  assert.equal(result.formation_receipt_written, true);
  assert.equal(result.durable_state_applied, false);
  assert.equal(result.promotion_executed, false);
  assert.equal(result.proof_or_evidence_created, false);
  assert.equal(result.claim_or_evidence_written, false);
  assert.equal(result.product_write_executed, false);
  if (result.record) assertValidRecord(result.record);
  for (const record of result.records) assertValidRecord(record);
}

function assertValidRecord(record) {
  assert.equal(record.record_version, recordVersion);
  assert.equal(record.builder_version, builderVersion);
  assert.equal(record.scope, scope);
  assert.equal(record.formation_receipt_written, true);
  assert.equal(record.durable_state_applied, false);
  assert.equal(record.promotion_executed, false);
  assert.equal(record.proof_or_evidence_created, false);
  assert.equal(record.claim_or_evidence_written, false);
  assert.equal(record.product_write_executed, false);
  assert(record.selected_candidate_refs.length > 0, "selected candidates are preserved");
  assert(record.omitted_candidate_refs.length > 0, "omitted candidates are preserved");
  assert(record.deferred_candidate_refs.length > 0, "deferred candidates are preserved");
  assert(record.unresolved_tensions_preserved.length > 0, "unresolved tensions are preserved");
  assert(record.knowledge_gaps_preserved.length > 0, "knowledge gaps are preserved");
  assertBoundary(record.authority_boundary);
}

function assertBoundary(boundary) {
  assert.equal(boundary.formation_receipt_write_now, true);
  assert.equal(boundary.db_query_or_write_now, true);
  for (const field of forbiddenBoundaryFalseFields) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertExpectedFixtureRecords() {
  for (const record of fixture.expected_records) {
    assert.equal(record.formation_receipt_written, true);
    assert.equal(record.durable_state_applied, false);
    assert.equal(record.promotion_executed, false);
    assert.equal(record.proof_or_evidence_created, false);
    assert.equal(record.claim_or_evidence_written, false);
    assert.equal(record.product_write_executed, false);
  }
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Formation Receipt Durable Write v0.1");
  for (const pointer of [
    docPath,
    builderPath,
    storePath,
    routePath,
    fixturePath,
    "scripts/smoke-formation-receipt-durable-write-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index block points to ${pointer}`);
  }
  assertIncludes(
    indexBlock,
    "Formation Receipt is required before durable state apply",
    "index mentions receipt before state apply",
  );
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product write");
  for (const forbiddenText of [
    "durable state apply was added",
    "proof/evidence write was added",
    "product-write was added",
    "Git Ledger export was added",
    "UI was added",
  ]) {
    assert(!indexBlock.includes(forbiddenText), `index block must not imply ${forbiddenText}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(indexBlock, "index block");
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  assertNoForbiddenPositiveAuthorityGrants(docText, "doc");
}

function assertFixturePrivacy() {
  const sanitized = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.split(placeholder).join(""),
    fixtureText,
  );
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertStaticRouteBoundaries() {
  assertIncludes(routeText, "export async function GET", "route exports GET");
  assertIncludes(routeText, "export async function POST", "route exports POST");
  assertIncludes(routeText, "requestHasSameOriginBoundary", "POST route has same-origin guard");
  assertIncludes(routeText, "same_origin_required", "POST route rejects cross-origin");
  assertIncludes(routeText, "await request.json()", "POST parses JSON");
  assertIncludes(routeText, "invalid_json_object", "POST requires object");
  assertReadOnlyGetRoute(routeText);
  assertWritePostRoute(routeText);
  assertRouteStoreResultMapping(routeText);
  for (const snippet of forbiddenRouteSnippets) {
    assert(!routeText.includes(snippet), `route must not contain ${snippet}`);
  }
}

function assertTypeAndHelperExports() {
  for (const exportName of [
    "FORMATION_RECEIPT_BUILDER_VERSION",
    "FORMATION_RECEIPT_RECORD_VERSION",
    "FORMATION_RECEIPT_ACTIVITY_VERSION",
    "buildFormationReceiptRecordV01",
    "validateFormationReceiptCreateInputV01",
    "createFormationReceiptAuthorityBoundaryV01",
    "createFormationReceiptFingerprintV01",
  ]) {
    assert.equal(typeof builder[exportName] !== "undefined", true, `${exportName} is exported`);
  }
  for (const exportName of [
    "ensureFormationReceiptStoreSchemaV01",
    "formationReceiptStoreSchemaExistsV01",
    "createFormationReceiptV01",
    "readFormationReceiptV01",
    "listFormationReceiptsV01",
    "discardFormationReceiptV01",
    "appendFormationReceiptActivityV01",
    "isSafeFormationReceiptRouteDbPathV01",
  ]) {
    assert.equal(typeof store[exportName] !== "undefined", true, `${exportName} is exported`);
  }
  assertIncludes(storeText, "BEGIN IMMEDIATE", "store create uses explicit transaction");
  assertIncludes(storeText, "ROLLBACK", "store create has rollback path");
  assertIncludes(storeText, "validatePromotionDecisionLineageV01", "store validates promotion lineage");
  assertIncludes(storeText, "perspective_promotion_decisions", "store references promotion decision table");
  assertIncludes(storeText, "perspective_promotion_decision_basis_refs", "store references promotion basis refs");
  assertIncludes(storeText, 'decision_kind !== "promote"', "store rejects non-promote decisions");
  assertIncludes(
    storeText,
    'decision_status !== "eligible_for_future_operator_decision"',
    "store rejects non-eligible decisions",
  );
  assertIncludes(storeText, "promotion_decision_review_record_mismatch", "store checks review record match");
  assertIncludes(storeText, "promotion_decision_operator_mismatch", "store checks operator match");
}

function assertReadOnlyGetRoute(source) {
  const getSource = extractExportedFunctionSource(source, "GET");
  assertIncludes(getSource, "openReadOnlyLocalDb", "GET uses read-only DB opener");
  assertIncludes(getSource, "schema_missing", "GET has schema_missing path");
  assert(!getSource.includes("openWriteLocalDb"), "GET must not call write opener");
  assert(!getSource.includes("mkdirSync"), "GET must not call mkdirSync");
  assert(!getSource.includes("ensureFormationReceiptStoreSchemaV01"), "GET must not ensure schema");
  assertIncludes(source, "readonly: true", "route has read-only DB option");
  assertIncludes(source, "fileMustExist: true", "route requires existing DB file");
  assertIncludes(source, "db_missing", "route has missing DB path");
}

function assertWritePostRoute(source) {
  const postSource = extractExportedFunctionSource(source, "POST");
  assertIncludes(postSource, "openWriteLocalDb", "POST uses write DB opener");
  assertIncludes(postSource, "storeResultResponse", "POST maps store result response");
  assertIncludes(postSource, "storeResultHttpStatus", "POST maps store result status");
}

function assertRouteStoreResultMapping(source) {
  assertIncludes(source, "storeResultResponse", "route has store result mapper");
  assertIncludes(source, 'result.status.startsWith("blocked")', "route maps blocked status");
  assertIncludes(source, 'result.status === "not_found"', "route maps not_found status");
  assertIncludes(source, 'status: errorCode ? "error" : "ok"', "route sets error status");
  assertIncludes(source, "error_code: errorCode", "route returns bounded error code");
  assert(!source.includes("function okResponse"), "route must not keep okResponse wrapper");
}

function assertNoForbiddenPositiveAuthorityGrants(text, label) {
  for (const grant of forbiddenPositiveAuthorityGrants) {
    assert(!text.includes(grant), `${label} must not contain ${grant}`);
  }
}

function assertNoUnsafePayloadEcho(value) {
  const text = JSON.stringify(value);
  for (const placeholder of allowedFixturePlaceholders) {
    assert(!text.includes(placeholder), `result must not echo ${placeholder}`);
  }
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index block exists for ${heading}`);
  const after = text.slice(start + 2);
  const next = after.search(/\n- [^\n]+:/);
  return next >= 0 ? after.slice(0, next) : after;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function extractExportedFunctionSource(text, functionName) {
  const pattern = new RegExp(`export async function ${functionName}[\\s\\S]*?\\)\\s*\\{`);
  const match = text.match(pattern);
  assert(match?.index !== undefined, `${functionName} function exists`);
  const bodyStart = match.index + match[0].length - 1;
  let depth = 0;
  for (let index = bodyStart; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(match.index, index + 1);
    }
  }
  assert.fail(`${functionName} function body must close`);
}

function countPersistedRowsForReceipt(db, receiptId) {
  return {
    receipts: countRows(db, "perspective_formation_receipts", "receipt_id", receiptId),
    selectedCandidates: countRows(
      db,
      "perspective_formation_receipt_selected_candidates",
      "receipt_id",
      receiptId,
    ),
    omittedCandidates: countRows(
      db,
      "perspective_formation_receipt_omitted_candidates",
      "receipt_id",
      receiptId,
    ),
    deferredCandidates: countRows(
      db,
      "perspective_formation_receipt_deferred_candidates",
      "receipt_id",
      receiptId,
    ),
    sources: countRows(db, "perspective_formation_receipt_sources", "receipt_id", receiptId),
    activities: countActivityRows(db, receiptId),
  };
}

function countActivityRows(db, receiptId) {
  return countRows(db, "perspective_formation_receipt_activity", "receipt_id", receiptId);
}

function countRows(db, tableName, columnName, value) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${columnName} = ?`)
    .get(value);
  return Number(row.count);
}
