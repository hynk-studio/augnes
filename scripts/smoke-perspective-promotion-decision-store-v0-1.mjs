import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const docPath = "docs/PROMOTION_DECISION_STORE_ROUTE_V0_1.md";
const typePath = "types/perspective-promotion-runtime-contract.ts";
const helperPath = "lib/perspective/promotion/promotion-decision-store.ts";
const collectionRoutePath = "app/api/perspective/promotion-decisions/route.ts";
const detailRoutePath =
  "app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts";
const fixturePath = "fixtures/perspective-promotion-decision-store.sample.v0.1.json";
const schemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const storeVersion = "promotion_decision_store.v0.1";
const recordVersion = "promotion_decision_record.v0.1";
const activityVersion = "promotion_decision_activity.v0.1";
const contractVersion = "perspective_promotion_runtime_contract.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:perspective-promotion-decision-store-v0-1";
const packageScriptValue =
  "node scripts/smoke-perspective-promotion-decision-store-v0-1.mjs";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Promotion Decision Store/Routes records explicit operator decisions.",
  "Storing a promotion decision is not promotion execution.",
  "Storing a promote decision is not durable Perspective state apply.",
  "Storing a promote decision is not proof.",
  "Storing a promote decision is not accepted evidence by itself.",
  "Formation Receipt is required before durable state apply.",
  "Formation Receipt write is deferred.",
  "Durable Perspective state apply is deferred.",
  "Proof/evidence creation is deferred.",
  "Claim/evidence writes are deferred.",
  "Explicit user action is required.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Review memory is not durable Perspective state.",
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
  "raw promotion payload",
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
  "raw promotion decision payload blocked by store fixture",
  "secret-like promotion decision input blocked by store fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "promotion_executed: true",
  "formation_receipt_written: true",
  "durable_state_applied: true",
  "proof_or_evidence_created: true",
  "claim_or_evidence_written: true",
  "product_write_executed: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "formation_receipt_write_now: true",
  "durable_perspective_state_apply_now: true",
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
  "Formation Receipt write implementation",
  "durable state apply implementation",
  "createPullRequest",
  "github.",
  "git commit",
];

const forbiddenBoundaryFalseFields = [
  "promotion_runtime_now",
  "formation_receipt_write_now",
  "durable_perspective_state_apply_now",
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
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "rag_context_is_truth",
  "feedback_is_truth",
  "ci_pass_is_proof",
  "smoke_pass_is_proof",
  "pr_body_is_authority",
  "git_ref_is_authority",
];

for (const filePath of [
  roadmapPath,
  contractDocPath,
  docPath,
  typePath,
  helperPath,
  collectionRoutePath,
  detailRoutePath,
  fixturePath,
  schemaPath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const contractDocText = readText(contractDocPath);
const docText = readText(docPath);
const typeText = readText(typePath);
const helperText = readText(helperPath);
const collectionRouteText = readText(collectionRoutePath);
const detailRouteText = readText(detailRoutePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const schemaText = readText(schemaPath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assertIncludes(roadmapText, "promotion_decision_store_route_v0_1", "roadmap has Phase 4.2 slice");
assertIncludes(
  contractDocText,
  "Perspective Promotion Runtime Contract is contract-only.",
  "PR #782 contract doc exists",
);

assert.equal(fixture.fixture_version, "perspective_promotion_decision_store.sample.v0.1");
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.activity_version, activityVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert(Array.isArray(fixture.expected_records) && fixture.expected_records.length > 0);
assert(Array.isArray(fixture.expected_activities) && fixture.expected_activities.length > 0);
assert(Array.isArray(fixture.expected_create_results) && fixture.expected_create_results.length > 0);
assert(Array.isArray(fixture.expected_read_results) && fixture.expected_read_results.length > 0);
assert(Array.isArray(fixture.expected_list_results) && fixture.expected_list_results.length > 0);
assert(Array.isArray(fixture.expected_discard_results) && fixture.expected_discard_results.length > 0);
assert(Array.isArray(fixture.expected_rejection_results) && fixture.expected_rejection_results.length > 0);

assertIncludes(schemaText, "perspective_promotion_decisions", "schema has decisions table");
assertIncludes(schemaText, "perspective_promotion_decision_basis_refs", "schema has basis refs table");
assertIncludes(schemaText, "perspective_promotion_decision_activity", "schema has activity table");

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
      smoke: "perspective-promotion-decision-store-v0-1",
      final_status: "pass",
      store_version: storeVersion,
      record_version: recordVersion,
      contract_version: contractVersion,
      valid_inputs: fixture.valid_create_inputs.length,
      rejection_cases: fixture.expected_rejection_results.length,
    },
    null,
    2,
  ),
);

function assertTempDbBehavior() {
  const Database = require("better-sqlite3");
  const tempDir = join(tmpdir(), "augnes-perspective-promotion-decision-store-v0-1");
  const tempDbPath = join(tempDir, "promotion-decisions.sqlite");
  assert(tempDbPath.startsWith(tmpdir()), "smoke must use a temp DB");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(tempDbPath);
  try {
    helper.ensurePromotionDecisionStoreSchemaV01(db);
    for (const input of fixture.valid_create_inputs) {
      const createResult = helper.createPromotionDecisionRecordV01(input, db);
      assert.equal(createResult.status, "stored", `${input.promotion_decision_id} stores`);
      assertValidStoreResult(createResult);
      assert.equal(createResult.record.promotion_decision_id, input.promotion_decision_id);
      assertNoUnsafePayloadEcho(createResult);
    }

    const promoteId = "promotion-decision:store:promote:001";
    const readResult = helper.readPromotionDecisionRecordV01(promoteId, db);
    assert.equal(readResult.status, "stored", "read stored promote decision");
    assert.equal(readResult.record.promotion_decision_id, promoteId);
    assertValidRecord(readResult.record);

    const byStatus = helper.listPromotionDecisionRecordsV01(
      { decision_status: "eligible_for_future_operator_decision" },
      db,
    );
    assert(byStatus.records.some((record) => record.promotion_decision_id === promoteId));

    const byReviewRecord = helper.listPromotionDecisionRecordsV01(
      { review_record_ref: "review-record:promotion:001" },
      db,
    );
    assert(byReviewRecord.records.some((record) => record.promotion_decision_id === promoteId));

    for (const decisionKind of ["reject", "defer", "request_more_evidence"]) {
      assert(
        helper
          .listPromotionDecisionRecordsV01({ include_discarded: true }, db)
          .records.some((record) => record.decision_kind === decisionKind),
        `${decisionKind} record exists`,
      );
    }

    const discardResult = helper.discardPromotionDecisionRecordV01(
      "promotion-decision:store:defer:001",
      "operator-discarded-deferred-decision",
      db,
    );
    assert.equal(discardResult.status, "discarded");
    assert.equal(discardResult.record.discard_reason, "operator-discarded-deferred-decision");
    assert(discardResult.record.discarded_at, "discarded_at is present");

    const discardedRead = helper.readPromotionDecisionRecordV01(
      "promotion-decision:store:defer:001",
      db,
    );
    assert.equal(discardedRead.status, "discarded");
    assert.equal(discardedRead.record.discard_reason, "operator-discarded-deferred-decision");

    const missing = helper.readPromotionDecisionRecordV01(
      "promotion-decision:store:unknown:404",
      db,
    );
    assert.equal(missing.status, "not_found");

    const activityResult = helper.appendPromotionDecisionActivityV01(
      {
        activity_id: "promotion-decision:store:promote:001:activity:manual-smoke",
        promotion_decision_id: promoteId,
        activity_kind: "decision_record_listed",
        actor_ref: "operator:reviewer:001",
        summary: "Bounded smoke activity append for decision record.",
        reason_codes: ["promotion_not_executed", "formation_receipt_not_written"],
        created_at: "2026-06-26T00:00:04.000Z",
      },
      db,
    );
    assert.equal(activityResult.status, "stored");
    assert.equal(activityResult.activities[0].activity_kind, "decision_record_listed");

    assertRejection("missing_review_record", "blocked_missing_review_record", db);
    assertRejection("missing_source_refs", "blocked_missing_source_refs", db);
    assertRejection("missing_basis_refs", "blocked_missing_basis_refs", db);
    assertRejection("forbidden_authority", "blocked_forbidden_authority", db);
    assertRejection("private_raw_payload", "blocked_private_or_raw_payload", db);
    assertRejection("secret_like_payload", "blocked_private_or_raw_payload", db);

    for (const forbiddenFlag of [
      "product_write_executed",
      "promotion_executed",
      "formation_receipt_written",
      "durable_state_applied",
      "proof_or_evidence_created",
      "claim_or_evidence_written",
    ]) {
      const blockedInput = {
        ...clone(fixture.valid_create_inputs[0]),
        promotion_decision_id: `promotion-decision:store:blocked:${forbiddenFlag}`,
        [forbiddenFlag]: true,
      };
      const blocked = helper.createPromotionDecisionRecordV01(blockedInput, db);
      assert.equal(blocked.status, "blocked_forbidden_authority", `${forbiddenFlag} rejected`);
    }
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertRejection(caseName, expectedStatus, db) {
  const input = invalidInput(caseName);
  const result = helper.createPromotionDecisionRecordV01(input, db);
  assert.equal(result.status, expectedStatus, `${caseName} returns ${expectedStatus}`);
  assert.equal(result.record, null, `${caseName} does not return record`);
  assertNoUnsafePayloadEcho(result);
  assert(result.authority_boundary, `${caseName} includes authority boundary`);
}

function invalidInput(caseName) {
  const base = clone(fixture.valid_create_inputs[0]);
  const override = fixture.invalid_create_inputs[caseName];
  assert(override, `invalid fixture case exists: ${caseName}`);
  delete override.based_on;
  return {
    ...base,
    promotion_decision_id: `promotion-decision:store:invalid:${caseName}`,
    ...clone(override),
  };
}

function assertValidStoreResult(result) {
  assert(result.authority_boundary, "result includes authority boundary");
  assertBoundary(result.authority_boundary);
  assert.equal(result.promotion_executed, false);
  assert.equal(result.formation_receipt_written, false);
  assert.equal(result.durable_state_applied, false);
  assert.equal(result.proof_or_evidence_created, false);
  assert.equal(result.claim_or_evidence_written, false);
  assert.equal(result.product_write_executed, false);
  if (result.record) assertValidRecord(result.record);
  for (const record of result.records) assertValidRecord(record);
}

function assertValidRecord(record) {
  assert.equal(record.record_version, recordVersion);
  assert.equal(record.store_version, storeVersion);
  assert.equal(record.contract_version, contractVersion);
  assert.equal(record.scope, scope);
  assert.equal(record.explicit_user_action_required, true);
  assert.equal(record.future_operator_decision_only, true);
  assert.equal(record.promotion_executed, false);
  assert.equal(record.decision_store_written, true);
  assert.equal(record.formation_receipt_written, false);
  assert.equal(record.durable_state_applied, false);
  assert.equal(record.proof_or_evidence_created, false);
  assert.equal(record.claim_or_evidence_written, false);
  assert.equal(record.product_write_executed, false);
  assertBoundary(record.authority_boundary);
}

function assertBoundary(boundary) {
  assert.equal(boundary.explicit_operator_decision_record_storage_only, true);
  assert.equal(boundary.promotion_decision_record_write_now, true);
  assert.equal(boundary.promotion_store_now, true);
  assert.equal(boundary.db_query_or_write_now, true);
  for (const field of forbiddenBoundaryFalseFields) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertExpectedFixtureRecords() {
  for (const record of fixture.expected_records) {
    assert.equal(record.promotion_executed, false);
    assert.equal(record.decision_store_written, true);
    assert.equal(record.formation_receipt_written, false);
    assert.equal(record.durable_state_applied, false);
    assert.equal(record.proof_or_evidence_created, false);
    assert.equal(record.claim_or_evidence_written, false);
    assert.equal(record.product_write_executed, false);
  }
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Promotion Decision Store/Routes v0.1");
  for (const pointer of [
    docPath,
    helperPath,
    collectionRoutePath,
    detailRoutePath,
    fixturePath,
    "scripts/smoke-perspective-promotion-decision-store-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index block points to ${pointer}`);
  }
  assertIncludes(indexBlock, "explicit operator decision records", "index mentions explicit records");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product write");
  for (const forbiddenText of [
    "promotion execution was added",
    "Formation Receipt write was added",
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
  assertIncludes(collectionRouteText, "export async function GET", "collection route exports GET");
  assertIncludes(collectionRouteText, "export async function POST", "collection route exports POST");
  assertIncludes(detailRouteText, "export async function GET", "detail route exports GET");
  assertIncludes(detailRouteText, "export async function POST", "detail route exports POST");
  assertIncludes(collectionRouteText, "requestHasSameOriginBoundary", "collection route has same-origin guard");
  assertIncludes(detailRouteText, "requestHasSameOriginBoundary", "detail route has same-origin guard");
  assertIncludes(collectionRouteText, "same_origin_required", "collection route rejects cross-origin");
  assertIncludes(detailRouteText, "same_origin_required", "detail route rejects cross-origin");
  assertIncludes(collectionRouteText, "await request.json()", "collection POST parses JSON");
  assertIncludes(detailRouteText, "await request.json()", "detail POST parses JSON");
  assertIncludes(collectionRouteText, "invalid_json_object", "collection POST requires object");
  assertIncludes(detailRouteText, "invalid_json_object", "detail POST requires object");

  const routeText = `${collectionRouteText}\n${detailRouteText}`;
  for (const snippet of forbiddenRouteSnippets) {
    assert(!routeText.includes(snippet), `routes must not contain ${snippet}`);
  }
}

function assertTypeAndHelperExports() {
  assertIncludes(typeText, "PerspectivePromotionDecisionKind", "contract type remains present");
  for (const exportName of [
    "PROMOTION_DECISION_STORE_VERSION",
    "PROMOTION_DECISION_RECORD_VERSION",
    "PROMOTION_DECISION_ACTIVITY_VERSION",
    "createPromotionDecisionRecordV01",
    "readPromotionDecisionRecordV01",
    "listPromotionDecisionRecordsV01",
    "discardPromotionDecisionRecordV01",
    "appendPromotionDecisionActivityV01",
    "validatePromotionDecisionCreateInputV01",
    "createPromotionDecisionAuthorityBoundaryV01",
  ]) {
    assert.equal(typeof helper[exportName] !== "undefined", true, `${exportName} is exported`);
  }
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
