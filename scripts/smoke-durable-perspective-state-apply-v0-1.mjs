import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const receiptDocPath = "docs/FORMATION_RECEIPT_DURABLE_WRITE_V0_1.md";
const docPath = "docs/DURABLE_PERSPECTIVE_STATE_APPLY_V0_1.md";
const promotionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const receiptStorePath = "lib/perspective/formation-receipt/formation-receipt-store.ts";
const receiptFixturePath = "fixtures/formation-receipt-durable-write.sample.v0.1.json";
const applyHelperPath = "lib/perspective/state/apply-perspective-delta.ts";
const readHelperPath = "lib/perspective/state/read-perspective-state.ts";
const stateStorePath = "lib/perspective/state/state-store.ts";
const applyRoutePath = "app/api/perspective/state/apply-delta/route.ts";
const readRoutePath = "app/api/perspective/state/[perspective_id]/route.ts";
const fixturePath = "fixtures/durable-perspective-state-apply.sample.v0.1.json";
const schemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const applyVersion = "durable_perspective_state_apply.v0.1";
const stateVersion = "durable_perspective_state.v0.1";
const applyEventVersion = "durable_perspective_state_apply_event.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:durable-perspective-state-apply-v0-1";
const packageScriptValue = "node scripts/smoke-durable-perspective-state-apply-v0-1.mjs";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Durable Perspective State Apply writes durable Perspective state.",
  "Durable Perspective State Apply requires a Formation Receipt.",
  "Formation Receipt is required before durable state apply.",
  "Durable Perspective State Apply does not product-write.",
  "Durable Perspective State Apply does not create proof/evidence records.",
  "Explicit user action is required.",
  "Prior thesis must not be silently overwritten.",
  "Retired claims must remain auditable.",
  "Contradicted evidence must not be deleted.",
  "Unresolved tensions must be preserved or explicitly resolved.",
  "Knowledge gaps must be preserved, deferred, or explicitly closed.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
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
  "raw durable perspective state payload",
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
  "raw durable perspective state payload blocked by fixture",
  "secret-like durable perspective state input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "product_write_executed: true",
  "proof_or_evidence_created: true",
  "claim_or_evidence_written: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
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
  "proof evidence write implementation",
  "createPullRequest",
  "github.",
  "git commit",
];

const forbiddenBoundaryFalseFields = [
  "formation_receipt_write_now",
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
  "source_of_truth_created_from_provider",
  "source_of_truth_created_from_retrieval",
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
  receiptDocPath,
  docPath,
  promotionStorePath,
  receiptStorePath,
  applyHelperPath,
  readHelperPath,
  stateStorePath,
  applyRoutePath,
  readRoutePath,
  fixturePath,
  schemaPath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const receiptDocText = readText(receiptDocPath);
const docText = readText(docPath);
const applyHelperText = readText(applyHelperPath);
const readHelperText = readText(readHelperPath);
const stateStoreText = readText(stateStorePath);
const applyRouteText = readText(applyRoutePath);
const readRouteText = readText(readRoutePath);
const schemaText = readText(schemaPath);
const fixtureText = readText(fixturePath);
const receiptFixture = JSON.parse(readText(receiptFixturePath));
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const applyHelper = await import(pathToFileURL(applyHelperPath).href);
const readHelper = await import(pathToFileURL(readHelperPath).href);
const stateStore = await import(pathToFileURL(stateStorePath).href);
const promotionStore = await import(pathToFileURL(promotionStorePath).href);
const receiptStore = await import(pathToFileURL(receiptStorePath).href);

assertIncludes(roadmapText, "durable_perspective_state_apply_v0_1", "roadmap has Phase 4.4 slice");
assertIncludes(
  receiptDocText,
  "Formation Receipt is required before durable state apply.",
  "PR #785 Formation Receipt docs exist",
);

assert.equal(fixture.fixture_version, "durable_perspective_state_apply.sample.v0.1");
assert.equal(fixture.apply_version, applyVersion);
assert.equal(fixture.state_version, stateVersion);
assert.equal(fixture.apply_event_version, applyEventVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert(Array.isArray(fixture.valid_apply_inputs) && fixture.valid_apply_inputs.length >= 3);
assert(Array.isArray(fixture.expected_apply_events) && fixture.expected_apply_events.length >= 3);
assert(fixture.expected_state, "fixture includes expected_state");
assert(fixture.invalid_apply_inputs, "fixture includes invalid_apply_inputs");
assert(Array.isArray(fixture.expected_rejection_results) && fixture.expected_rejection_results.length > 0);

for (const tableName of [
  "perspective_states",
  "perspective_state_prior_theses",
  "perspective_state_claims",
  "perspective_state_evidence_refs",
  "perspective_state_tensions",
  "perspective_state_knowledge_gaps",
  "perspective_state_apply_events",
  "perspective_state_activity",
]) {
  assertIncludes(schemaText, tableName, `schema contains ${tableName}`);
}

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertIndexCoverage();
assertDocsCoverage();
assertFixturePrivacy();
assertTypeAndHelperExports();
assertStaticRouteBoundaries();
assertExpectedFixtureRecords();
assertTempDbBehavior();

console.log(
  JSON.stringify(
    {
      smoke: "durable-perspective-state-apply-v0-1",
      final_status: "pass",
      apply_version: applyVersion,
      state_version: stateVersion,
      valid_inputs: fixture.valid_apply_inputs.length,
      rejection_cases: fixture.expected_rejection_results.length,
    },
    null,
    2,
  ),
);

function assertTempDbBehavior() {
  const Database = require("better-sqlite3");
  const tempDir = join(tmpdir(), "augnes-durable-perspective-state-apply-v0-1");
  const tempDbPath = join(tempDir, "perspective-state.sqlite");
  assert(tempDbPath.startsWith(tmpdir()), "smoke must use a temp DB");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(tempDbPath);
  try {
    stateStore.ensureDurablePerspectiveStateSchemaV01(db);
    assertMissingFormationReceiptStoreIsBlocked(db);
    seedPromotionDecisionAndReceipts(db);

    const addResult = stateStore.applyDurablePerspectiveStateV01(fixture.valid_apply_inputs[0], db);
    assert.equal(addResult.status, "applied", "valid add apply succeeds");
    assertValidApplyResult(addResult);
    assert(addResult.state.current_thesis.includes("Bounded durable thesis"), "add apply writes current thesis");
    assert(addResult.state.open_tensions.some((tension) => tension.tension_ref === "unresolved-tension:bounded:001"));
    assert(addResult.state.knowledge_gaps.some((gap) => gap.knowledge_gap_ref === "knowledge-gap:bounded:001"));
    assertNoUnsafePayloadEcho(addResult);

    const readResult = stateStore.readDurablePerspectiveStateV01("perspective:durable:001", db);
    assert.equal(readResult.status, "applied", "read existing durable state succeeds");
    assert.equal(readResult.state.perspective_id, "perspective:durable:001");
    assertValidApplyResult(readResult);
    const listResult = stateStore.listDurablePerspectiveApplyEventsV01({ perspective_id: "perspective:durable:001" }, db);
    assert.equal(listResult.status, "applied", "list apply events succeeds");
    assert.equal(listResult.apply_events.length, 1, "one apply event after add");

    const refineResult = stateStore.applyDurablePerspectiveStateV01(fixture.valid_apply_inputs[1], db);
    assert.equal(refineResult.status, "applied", "valid refine apply succeeds");
    assert(refineResult.state.prior_theses.includes(fixture.valid_apply_inputs[0].current_thesis));
    assert(refineResult.state.resolved_tensions.some((tension) => tension.tension_ref === "unresolved-tension:bounded:001"));
    assert(refineResult.state.knowledge_gaps.some((gap) => gap.gap_status === "deferred"));
    assertValidApplyResult(refineResult);

    const retireResult = stateStore.applyDurablePerspectiveStateV01(fixture.valid_apply_inputs[2], db);
    assert.equal(retireResult.status, "applied", "valid retire apply succeeds");
    assert(retireResult.state.retired_claims.some((claim) => claim.claim_ref === "claim-candidate:bounded:001"));
    assert(retireResult.state.retirement_history.includes("claim-candidate:bounded:001"));
    assert(retireResult.state.prior_theses.includes(fixture.valid_apply_inputs[1].current_thesis));
    assert(retireResult.state.contradicting_evidence_refs.includes("contradicting-evidence:bounded:001"));
    assertValidApplyResult(retireResult);

    const allEvents = stateStore.listDurablePerspectiveApplyEventsV01({ perspective_id: "perspective:durable:001" }, db);
    assert.equal(allEvents.apply_events.length, 3, "three apply events after valid add/refine/retire");

    const missingRead = stateStore.readDurablePerspectiveStateV01("perspective:durable:missing:404", db);
    assert.equal(missingRead.status, "not_found", "read unknown state returns not_found");

    assertRejection("missing_formation_receipt", "blocked_missing_formation_receipt", db);
    assertRejection("discarded_formation_receipt", "blocked_discarded_formation_receipt", db);
    assertRejection("already_applied_receipt", "blocked_already_applied_receipt", db);
    assertRejection("missing_selected_candidate_refs", "blocked_missing_selected_candidates", db);
    assertRejection("unresolved_tension_loss", "blocked_unresolved_tension_loss", db);
    assertRejection("knowledge_gap_loss", "blocked_knowledge_gap_loss", db);
    assertRejection("forbidden_authority", "blocked_forbidden_authority", db);
    assertRejection("private_raw_payload", "blocked_private_or_raw_payload", db);
    assertRejection("secret_like_payload", "blocked_private_or_raw_payload", db);
    assertDuplicateApplyEventRollback(db);
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertMissingFormationReceiptStoreIsBlocked(db) {
  const result = stateStore.applyDurablePerspectiveStateV01(fixture.valid_apply_inputs[0], db);
  assert.equal(result.status, "blocked_missing_formation_receipt");
  assert(result.reason_codes.includes("formation_receipt_ref_missing"));
  assert.equal(countRowsIfTableExists(db, "perspective_state_apply_events", "apply_event_id", fixture.valid_apply_inputs[0].apply_event_id), 0);
}

function seedPromotionDecisionAndReceipts(db) {
  promotionStore.ensurePromotionDecisionStoreSchemaV01(db);
  receiptStore.ensureFormationReceiptStoreSchemaV01(db);
  const promotion = promotionStore.createPromotionDecisionRecordV01(makePromotionDecisionInput(), db);
  assert.equal(promotion.status, "stored", "promotion decision lineage seeded");

  for (const receiptId of [
    "formation-receipt:durable-write:001",
    "formation-receipt:durable-write:002",
    "formation-receipt:durable-write:003",
    "formation-receipt:durable-write:004",
    "formation-receipt:durable-write:005",
    "formation-receipt:durable-write:006",
    "formation-receipt:durable-write:007",
    "formation-receipt:durable-write:008",
    "formation-receipt:durable-write:009",
    "formation-receipt:durable-write:010",
    "formation-receipt:durable-write:discarded",
  ]) {
    const receipt = receiptStore.createFormationReceiptV01(makeReceiptInput(receiptId), db);
    assert.equal(receipt.status, "written", `${receiptId} receipt seeded`);
  }
  const discard = receiptStore.discardFormationReceiptV01(
    "formation-receipt:durable-write:discarded",
    "operator-discarded-before-state-apply",
    db,
  );
  assert.equal(discard.status, "discarded", "discarded receipt seeded");
}

function makePromotionDecisionInput() {
  return {
    contract_version: "perspective_promotion_runtime_contract.v0.1",
    scope,
    promotion_decision_id: "promotion-decision:store:promote:001",
    decision_kind: "promote",
    decision_status: "eligible_for_future_operator_decision",
    operator_actor_ref: "operator:reviewer:001",
    explicit_user_action_required: true,
    future_operator_decision_only: true,
    review_record_ref: "review-record:promotion:001",
    gate_report_ref: "promotion-decision:store:promote:001:gate-report",
    basis_refs: [
      {
        basis_version: "perspective_promotion_basis.v0.1",
        scope,
        basis_id: "promotion-decision:store:promote:001:basis:source",
        basis_kind: "source_ref",
        basis_ref: "source-ref:bounded:001",
        source_refs: ["source-ref:bounded:001"],
        candidate_refs: [],
        review_record_refs: ["review-record:promotion:001"],
        rag_context_preview_refs: [],
        retrieval_candidate_refs: [],
        provider_candidate_refs: [],
        feedback_refs: [],
        bounded_summary: "Bounded source lineage summary for durable state apply smoke.",
        privacy_class: "public_safe_refs_only",
        redaction_status: "not_needed",
        public_safe: true,
        reason_codes: ["source_ref_present", "basis_ref_present"],
      },
      {
        basis_version: "perspective_promotion_basis.v0.1",
        scope,
        basis_id: "promotion-decision:store:promote:001:basis:claim",
        basis_kind: "claim_candidate",
        basis_ref: "claim-candidate:bounded:001",
        source_refs: ["source-ref:bounded:001"],
        candidate_refs: ["claim-candidate:bounded:001"],
        review_record_refs: ["review-record:promotion:001"],
        rag_context_preview_refs: [],
        retrieval_candidate_refs: [],
        provider_candidate_refs: [],
        feedback_refs: [],
        bounded_summary: "Bounded claim lineage summary for durable state apply smoke.",
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
    created_at: "2026-06-26T00:00:00.000Z",
    updated_at: "2026-06-26T00:00:00.000Z",
  };
}

function makeReceiptInput(receiptId) {
  const input = clone(receiptFixture.valid_create_inputs[0]);
  input.receipt_id = receiptId;
  input.created_at = receiptId.endsWith("001") ? "2026-06-26T00:00:00.000Z" : "2026-06-26T00:00:10.000Z";
  input.updated_at = input.created_at;
  return input;
}

function assertRejection(caseName, expectedStatus, db) {
  const input = invalidInput(caseName);
  const beforeEvents = countRows(db, "perspective_state_apply_events", "formation_receipt_id", input.formation_receipt_id);
  const result = stateStore.applyDurablePerspectiveStateV01(input, db);
  assert.equal(result.status, expectedStatus, `${caseName} returns ${expectedStatus}`);
  assert.equal(result.state, null, `${caseName} does not return state`);
  assert.equal(result.apply_event, null, `${caseName} does not return apply event`);
  assert.equal(
    countRows(db, "perspective_state_apply_events", "formation_receipt_id", input.formation_receipt_id),
    beforeEvents,
    `${caseName} leaves no partial apply event rows`,
  );
  assertNoUnsafePayloadEcho(result);
  assert(result.authority_boundary, `${caseName} includes authority boundary`);
}

function assertDuplicateApplyEventRollback(db) {
  const input = invalidInput("duplicate_apply_event");
  const beforeReceiptEvents = countRows(db, "perspective_state_apply_events", "formation_receipt_id", input.formation_receipt_id);
  const beforeDuplicateIdEvents = countRows(db, "perspective_state_apply_events", "apply_event_id", input.apply_event_id);
  const result = stateStore.applyDurablePerspectiveStateV01(input, db);
  assert.equal(result.status, "blocked_invalid_input", "duplicate apply event returns blocked_invalid_input");
  assert.equal(
    countRows(db, "perspective_state_apply_events", "formation_receipt_id", input.formation_receipt_id),
    beforeReceiptEvents,
    "duplicate apply event leaves no event row for the new receipt",
  );
  assert.equal(
    countRows(db, "perspective_state_apply_events", "apply_event_id", input.apply_event_id),
    beforeDuplicateIdEvents,
    "duplicate apply event does not add a second duplicate event row",
  );
}

function invalidInput(caseName) {
  const base = clone(fixture.valid_apply_inputs[0]);
  const override = clone(fixture.invalid_apply_inputs[caseName]);
  assert(override, `invalid fixture case exists: ${caseName}`);
  delete override.based_on;
  return { ...base, ...override };
}

function assertValidApplyResult(result) {
  assert(result.authority_boundary, "result includes authority boundary");
  assertBoundary(result.authority_boundary);
  assert.equal(result.durable_state_applied, true);
  assert.equal(result.formation_receipt_written, true);
  assert.equal(result.promotion_executed, false);
  assert.equal(result.proof_or_evidence_created, false);
  assert.equal(result.claim_or_evidence_written, false);
  assert.equal(result.product_write_executed, false);
  if (result.state) assertValidState(result.state);
  for (const state of result.states) assertValidState(state);
  if (result.apply_event) assertValidApplyEvent(result.apply_event);
  for (const event of result.apply_events) assertValidApplyEvent(event);
}

function assertValidState(state) {
  assert.equal(state.state_version, stateVersion);
  assert.equal(state.apply_version, applyVersion);
  assert.equal(state.scope, scope);
  assert(state.state_fingerprint && /^[a-f0-9]{64}$/.test(state.state_fingerprint));
  assert(state.formation_receipt_refs.length > 0, "state keeps Formation Receipt refs");
  assert(state.supporting_evidence_refs.length > 0, "state keeps source/evidence refs");
  assertBoundary(state.authority_boundary);
}

function assertValidApplyEvent(event) {
  assert.equal(event.apply_event_version, applyEventVersion);
  assert.equal(event.apply_version, applyVersion);
  assert.equal(event.state_version, stateVersion);
  assert.equal(event.durable_state_applied, true);
  assert.equal(event.formation_receipt_written, true);
  assert.equal(event.promotion_executed, false);
  assert.equal(event.proof_or_evidence_created, false);
  assert.equal(event.claim_or_evidence_written, false);
  assert.equal(event.product_write_executed, false);
  assertBoundary(event.authority_boundary);
}

function assertBoundary(boundary) {
  assert.equal(boundary.durable_perspective_state_apply_now, true);
  assert.equal(boundary.db_query_or_write_now, true);
  for (const field of forbiddenBoundaryFalseFields) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertExpectedFixtureRecords() {
  assert.equal(fixture.expected_state.durable_state_applied, true);
  assert.equal(fixture.expected_state.formation_receipt_written, true);
  assert.equal(fixture.expected_state.product_write_executed, false);
  for (const event of fixture.expected_apply_events) {
    assert.equal(event.durable_state_applied, true);
    assert.equal(event.formation_receipt_written, true);
    assert.equal(event.promotion_executed, false);
    assert.equal(event.proof_or_evidence_created, false);
    assert.equal(event.claim_or_evidence_written, false);
    assert.equal(event.product_write_executed, false);
  }
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Durable Perspective State Apply v0.1");
  for (const pointer of [
    docPath,
    applyHelperPath,
    readHelperPath,
    stateStorePath,
    applyRoutePath,
    readRoutePath,
    fixturePath,
    "scripts/smoke-durable-perspective-state-apply-v0-1.mjs",
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
    "product-write was added",
    "proof/evidence row writes were added",
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

function assertTypeAndHelperExports() {
  for (const exportName of [
    "DURABLE_PERSPECTIVE_STATE_APPLY_VERSION",
    "DURABLE_PERSPECTIVE_STATE_VERSION",
    "DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION",
    "allowedDurablePerspectiveStateReasonCodes",
    "validateDurablePerspectiveStateApplyInputV01",
    "buildDurablePerspectiveStateApplyEventV01",
    "buildDurablePerspectiveStateV01",
    "createDurablePerspectiveStateAuthorityBoundaryV01",
    "createDurablePerspectiveStateFingerprintV01",
  ]) {
    assert.equal(typeof applyHelper[exportName] !== "undefined", true, `${exportName} is exported`);
  }
  for (const exportName of [
    "buildDurablePerspectiveStateReadModelV01",
    "normalizeDurablePerspectiveStateV01",
    "createDurablePerspectiveStateFingerprintV01",
  ]) {
    assert.equal(typeof readHelper[exportName] !== "undefined", true, `${exportName} is exported`);
  }
  for (const exportName of [
    "ensureDurablePerspectiveStateSchemaV01",
    "durablePerspectiveStateSchemaExistsV01",
    "applyDurablePerspectiveStateV01",
    "readDurablePerspectiveStateV01",
    "listDurablePerspectiveApplyEventsV01",
    "isSafeDurablePerspectiveStateRouteDbPathV01",
  ]) {
    assert.equal(typeof stateStore[exportName] !== "undefined", true, `${exportName} is exported`);
  }
  assertIncludes(stateStoreText, "BEGIN IMMEDIATE", "state apply uses explicit transaction");
  assertIncludes(stateStoreText, "ROLLBACK", "state apply has rollback path");
  assertIncludes(stateStoreText, "validateFormationReceiptLineageV01", "store validates Formation Receipt lineage");
  assertIncludes(stateStoreText, "perspective_formation_receipts", "store references Formation Receipt table");
  assertIncludes(stateStoreText, "applyEventExistsForReceipt", "store rejects already-applied receipt");
  assertIncludes(stateStoreText, "unresolved_tension_loss_blocked", "store blocks unresolved tension loss");
  assertIncludes(stateStoreText, "knowledge_gap_loss_blocked", "store blocks knowledge gap loss");
}

function assertStaticRouteBoundaries() {
  assertIncludes(applyRouteText, "export async function POST", "apply route exports POST");
  assert(!applyRouteText.includes("export async function GET"), "apply route does not export GET");
  assertIncludes(readRouteText, "export async function GET", "read route exports GET");
  assert(!readRouteText.includes("export async function POST"), "state read route does not export POST");
  assertApplyPostRoute(applyRouteText);
  assertReadOnlyGetRoute(readRouteText);
  assertRouteStoreResultMapping(applyRouteText, "apply route");
  assertRouteStoreResultMapping(readRouteText, "read route");
  for (const [label, source] of [
    ["apply route", applyRouteText],
    ["read route", readRouteText],
  ]) {
    for (const snippet of forbiddenRouteSnippets) {
      assert(!source.includes(snippet), `${label} must not contain ${snippet}`);
    }
  }
}

function assertApplyPostRoute(source) {
  const postSource = extractExportedFunctionSource(source, "POST");
  assertIncludes(postSource, "requestHasSameOriginBoundary", "apply POST has same-origin guard");
  assertIncludes(postSource, "await request.json()", "apply POST parses JSON");
  assertIncludes(postSource, "invalid_json_object", "apply POST requires object");
  assertIncludes(postSource, "invalid_action", "apply POST validates action");
  assertIncludes(postSource, "invalid_input", "apply POST validates input object");
  assertIncludes(postSource, "openWriteLocalDb", "apply POST uses write DB opener");
  const openWriteIndex = postSource.indexOf("const db = openWriteLocalDb(inputBody.db_path)");
  assert(openWriteIndex > 0, "apply POST opens write DB through bounded opener");
  for (const errorCode of ["invalid_action", "invalid_input"]) {
    const errorIndex = postSource.indexOf(errorCode);
    assert(errorIndex > 0, `apply POST contains ${errorCode}`);
    assert(errorIndex < openWriteIndex, `${errorCode} is checked before write DB open`);
  }
}

function assertReadOnlyGetRoute(source) {
  const getSource = extractExportedFunctionSource(source, "GET");
  assertIncludes(getSource, "openReadOnlyLocalDb", "GET uses read-only DB opener");
  assertIncludes(getSource, "schema_missing", "GET has schema_missing path");
  assert(!getSource.includes("openWriteLocalDb"), "GET must not call write opener");
  assert(!getSource.includes("mkdirSync"), "GET must not call mkdirSync");
  assert(!getSource.includes("ensureDurablePerspectiveStateSchemaV01"), "GET must not ensure schema");
  assertIncludes(source, "readonly: true", "route has read-only DB option");
  assertIncludes(source, "fileMustExist: true", "route requires existing DB file");
  assertIncludes(source, "db_missing", "route has missing DB path");
}

function assertRouteStoreResultMapping(source, label) {
  assertIncludes(source, "storeResultResponse", `${label} has store result mapper`);
  assertIncludes(source, 'result.status.startsWith("blocked")', `${label} maps blocked status`);
  assertIncludes(source, 'result.status === "not_found"', `${label} maps not_found status`);
  assertIncludes(source, 'status: errorCode ? "error" : "ok"', `${label} sets error status`);
  assertIncludes(source, "error_code: errorCode", `${label} returns bounded error code`);
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

function countRowsIfTableExists(db, tableName, columnName, value) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
  return row ? countRows(db, tableName, columnName, value) : 0;
}

function countRows(db, tableName, columnName, value) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${columnName} = ?`)
    .get(value);
  return Number(row.count);
}
