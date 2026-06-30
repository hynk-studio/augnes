#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const typePath = "types/dogfooding-research-record-runtime-contract.ts";
const storePath = "lib/dogfooding/dogfooding-record-store.ts";
const routePath = "app/api/dogfooding/research-records/route.ts";
const fixturePath = "fixtures/dogfooding-research-record-runtime.sample.v0.1.json";
const smokePath = "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const docsPath = "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const reconciliationDocsPath = "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";
const reconciliationFixturePath =
  "fixtures/post-868-non-ui-runtime-gap-reconciliation.sample.v0.1.json";
const ingestionDocsPath = "docs/DOGFOODING_INGESTION_RUNTIME_V0_1.md";
const ingestionStoreRoutePath = "app/api/dogfooding/records/route.ts";
const codexNormalizerPath = "lib/dogfooding/codex-result-report-normalizer.ts";
const privacyGuardPath = "lib/privacy/redaction-guard.ts";

const fixtureVersion = "dogfooding_research_record_runtime.sample.v0.1";
const runtimeVersion = "dogfooding_research_record_runtime.v0.1";
const inputVersion = "dogfooding_research_record_input.v0.1";
const recordVersion = "dogfooding_research_record.v0.1";
const storeVersion = "dogfooding_research_record_store.v0.1";
const routeVersion = "dogfooding_research_records_route.v0.1";
const scope = "project:augnes";
const selectedSlice = "dogfooding_record_runtime_store_route_v0_1";
const nextSlice = "codex_result_report_to_dogfooding_record_binding_v0_1";
const packageScriptName = "smoke:dogfooding-research-record-runtime-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";

const expectedChangedFiles = new Set([
  typePath,
  storePath,
  routePath,
  fixturePath,
  smokePath,
  docsPath,
  "lib/dogfooding/codex-result-to-dogfooding-record.ts",
  "fixtures/codex-result-to-dogfooding-record.sample.v0.1.json",
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs",
  "docs/CODEX_RESULT_TO_DOGFOODING_RECORD_BINDING_V0_1.md",
  "scripts/smoke-conversation-handoff-packet-v0-2.mjs",
  "lib/handoff/build-handoff-from-dogfooding-record.ts",
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json",
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs",
  "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md",
  "types/dogfooding-to-review-memory-proposal.ts",
  "lib/dogfooding/build-review-memory-proposal.ts",
  "fixtures/dogfooding-to-review-memory-proposal.sample.v0.1.json",
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs",
  "docs/DOGFOODING_TO_REVIEW_MEMORY_PROPOSAL_V0_1.md",
  "types/local-data-export-manifest.ts",
  "lib/local-export/build-local-data-export-manifest.ts",
  "fixtures/local-data-export-manifest.sample.v0.1.json",
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs",
  "docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md",
  "scripts/smoke-local-data-export-policy-v0-1.mjs",
  "lib/git-ledger/build-export-packet-from-local-manifest.ts",
  "fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json",
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs",
  "docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md",
  "types/runtime-audit-event.ts",
  "lib/runtime-audit/audit-event-store.ts",
  "fixtures/selected-runtime-audit-event-store.sample.v0.1.json",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md",
  "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md",
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json",
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs",
  packagePath,
  indexPath,
]);

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline:",
  "PR #870 selected `dogfooding_record_runtime_store_route_v0_1` as the next non-UI implementation slice.",
  "This slice adds no UI.",
  "Dogfooding research record is candidate-only review material.",
  "PR body is not truth.",
  "Changed files are not proof.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "Smoke pass is not evidence.",
  "Smoke failure is diagnostic, not automatic rejection.",
  "CI pass is not authority.",
  "CI failure is diagnostic, not automatic rejection.",
  "Codex result is not execution approval.",
  "Git refs are references only.",
  "GitHub PR refs are references only.",
  "Dogfooding record is not Review Memory write.",
  "Dogfooding record is not promotion.",
  "Dogfooding record is not Formation Receipt.",
  "Dogfooding record is not durable Perspective state.",
  "Dogfooding record is not product-write.",
  "Product-write remains parked by #686.",
  "GET is read-only.",
  "GET does not create directories.",
  "GET does not ensure tables.",
  "GET does not trigger writes.",
  "`/api/dogfooding/research-records/[record_id]` detail route remains incomplete.",
  "`codex_result_report_to_dogfooding_record_binding_v0_1`",
];

const forbiddenRuntimeSnippets = [
  "from \"openai\"",
  "from 'openai'",
  "fetch(",
  "provider_openai_call_now: true",
  "retrieval_execution_now: true",
  "source_fetch_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "promotion_execution_now: true",
  "formation_receipt_write_now: true",
  "durable_state_apply_now: true",
  "product_write_now: true",
  "github_api_call_now: true",
  "git_write_now: true",
  "release_deploy_publish_now: true",
];

for (const requiredPath of [
  typePath,
  storePath,
  routePath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  reconciliationDocsPath,
  reconciliationFixturePath,
  ingestionDocsPath,
  ingestionStoreRoutePath,
  codexNormalizerPath,
  privacyGuardPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const typeText = read(typePath);
const storeText = read(storePath);
const routeText = read(routePath);
const docsText = read(docsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(read(packagePath));
const indexText = read(indexPath);
const reconciliationDocs = read(reconciliationDocsPath);
const reconciliationFixture = JSON.parse(read(reconciliationFixturePath));

const store = await import(pathToFileURL(`${process.cwd()}/${storePath}`).href);
const route = await import(pathToFileURL(`${process.cwd()}/${routePath}`).href);

assertFixtureVersions();
assertStaticCoverage();
assertStoreBehavior();
await assertRouteBehavior();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "dogfooding-research-record-runtime-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      valid_record_id: fixture.safe_input_example.record_id,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.input_version, inputVersion);
  assert.equal(fixture.record_version, recordVersion);
  assert.equal(fixture.store_version, storeVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.deepEqual(
    fixture.blocked_forbidden_authority_string_claim_cases.map((testCase) => testCase.case_id),
    [
      "validation_pass_approval",
      "validation_failure_rejection",
      "changed_files_proof",
      "codex_result_execution_approval",
      "dogfooding_record_promotion",
      "dogfooding_record_product_write",
      "pr_body_truth",
      "smoke_failure_rejection",
      "ci_failure_rejection",
      "provider_output_evidence",
      "provider_output_accepted_evidence",
      "retrieval_score_promotion_readiness",
      "feedback_truth",
      "layout_coordinate_truth",
      "layout_coordinates_authority",
      "salience_score_truth",
    ],
    "fixture must preserve blocked authority string claim coverage",
  );
  assert.deepEqual(
    fixture.allowed_negated_authority_string_cases.map((testCase) => testCase.case_id),
    [
      "validation_pass_not_approval",
      "changed_files_not_proof",
      "codex_result_not_execution_approval",
      "dogfooding_record_not_product_write",
    ],
    "fixture must preserve negated boundary phrase allow coverage",
  );
  assert.equal(reconciliationFixture.selected_next_slice, selectedSlice);
  assert.ok(
    reconciliationDocs.includes(selectedSlice),
    "post-868 reconciliation must select this slice",
  );
}

function assertStaticCoverage() {
  for (const text of [
    "DogfoodingResearchRecordInput",
    "DogfoodingResearchRecord",
    "DogfoodingResearchRecordAuthorityBoundary",
    "DogfoodingResearchRecordStoreResult",
    "DogfoodingResearchRecordKinds",
  ]) {
    assertIncludes(typeText, text, `type export ${text}`);
  }
  for (const text of [
    "ensureDogfoodingResearchRecordStoreSchemaV01",
    "dogfoodingResearchRecordStoreSchemaExistsV01",
    "buildDogfoodingResearchRecordV01",
    "createDogfoodingResearchRecordV01",
    "createDogfoodingResearchRecordFromRecordV01",
    "readDogfoodingResearchRecordV01",
    "listDogfoodingResearchRecordsV01",
    "createDogfoodingResearchRecordAuthorityBoundaryV01",
    "codex_result_report_ingestion_v0_1",
    "privacy_redaction_runtime_guard_v0_1",
  ]) {
    assertIncludes(storeText, text, `store export or alignment ${text}`);
  }
  for (const text of [
    "export async function GET",
    "export async function POST",
    "requestHasSameOriginBoundary",
    "openReadOnlyDogfoodingResearchDbV01",
    "openWriteDogfoodingResearchDbV01",
    "readonly: true",
    "fileMustExist: true",
    "isSafeDogfoodingResearchRecordRouteDbPathV01",
    "buildDogfoodingResearchRecordV01",
  ]) {
    assertIncludes(routeText, text, `route boundary ${text}`);
  }
  const getSegment = routeText.slice(
    routeText.indexOf("export async function GET"),
    routeText.indexOf("export async function POST"),
  );
  assertNotIncludes(getSegment, "mkdirSync", "GET must not create directories");
  assertNotIncludes(
    getSegment,
    "ensureDogfoodingResearchRecordStoreSchemaV01",
    "GET must not ensure schema",
  );
  const postSegment = routeText.slice(routeText.indexOf("export async function POST"));
  assert.ok(
    postSegment.indexOf("buildDogfoodingResearchRecordV01") <
      postSegment.indexOf("openWriteDogfoodingResearchDbV01"),
    "POST must validate before opening write DB",
  );
  for (const phrase of requiredDocsPhrases) {
    assertIncludesNormalized(docsText, phrase, `docs phrase ${phrase}`);
  }
  for (const pointer of [typePath, storePath, routePath, fixturePath, smokePath, docsPath]) {
    assertIncludes(indexText, pointer, `latest index pointer ${pointer}`);
  }
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const source of [typeText, storeText, routeText, docsText, indexText]) {
    for (const forbidden of forbiddenRuntimeSnippets) {
      assertNotIncludes(source, forbidden, `forbidden runtime snippet ${forbidden}`);
    }
  }
}

function assertStoreBehavior() {
  const built = store.buildDogfoodingResearchRecordV01(fixture.safe_input_example);
  assert.equal(built.ok, true);
  assert.equal(built.status, "created");
  assert.ok(built.record, "valid build must return a record");
  const record = built.record;
  assert.equal(record.record_version, recordVersion);
  assert.equal(record.runtime_version, runtimeVersion);
  assert.equal(record.store_version, storeVersion);
  assert.equal(record.lifecycle_state, fixture.expected.valid_record_lifecycle_state);
  assert.equal(record.record_kind, fixture.expected.valid_record_kind);
  assert.equal(record.privacy_report.status, "passed");
  assert.equal(record.authority_boundary.candidate_only, true);
  assert.equal(record.authority_boundary.product_write_now, false);
  assert.equal(record.authority_boundary.promotion_execution_now, false);
  assert.equal(record.authority_boundary.proof_or_evidence_record_now, false);
  assert.equal(record.authority_boundary.durable_state_apply_now, false);
  assert.equal(record.authority_boundary.github_api_call_now, false);
  assert.equal(record.authority_boundary.provider_openai_call_now, false);
  assert.equal(record.authority_boundary.retrieval_execution_now, false);
  assert.equal(record.authority_boundary.source_fetch_now, false);
  assert.equal(record.authority_boundary.release_deploy_publish_now, false);
  assert.equal(record.authority_boundary.validation_pass_is_approval, false);
  assert.equal(record.authority_boundary.validation_failure_is_rejection, false);
  assert.deepEqual(
    fixture.expected.valid_preserved_review_cue_kinds,
    fixture.expected.valid_preserved_review_cue_kinds.filter((cueKind) =>
      record.review_cues.some((cue) => cue.cue_kind === cueKind),
    ),
  );
  for (const expected of [
    "skipped-check-ref:browser-validation:not-in-scope",
    "warning-ref:actions-node-runtime-deprecation",
    "not-done-ref:detail-route-remains-deferred",
    "delta-ref:validation-pass-not-approval",
    "delta-ref:validation-failure-not-rejection",
  ]) {
    assert.ok(
      JSON.stringify(record).includes(expected),
      `record must preserve ${expected}`,
    );
  }
  for (const reasonCode of [
    "skipped_checks_preserved",
    "known_warnings_preserved",
    "not_done_preserved",
    "expected_observed_delta_preserved",
    "validation_pass_not_approval",
    "validation_failure_not_rejection",
    "ci_pass_not_authority",
    "ci_failure_diagnostic_only",
  ]) {
    assert.ok(record.reason_codes.includes(reasonCode), `reason code ${reasonCode}`);
  }

  const invalid = store.buildDogfoodingResearchRecordV01(fixture.invalid_shape_example);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, fixture.expected.invalid_shape_status);
  assert.equal(invalid.record, null);

  const privateBlocked = store.buildDogfoodingResearchRecordV01(
    fixture.blocked_private_or_raw_payload_example,
  );
  assert.equal(privateBlocked.ok, false);
  assert.equal(privateBlocked.status, fixture.expected.blocked_private_status);
  assert.equal(privateBlocked.record, null);
  assertNoUnsafeEcho(privateBlocked, "private blocked result");

  const authorityBlocked = store.buildDogfoodingResearchRecordV01(
    fixture.blocked_forbidden_authority_example,
  );
  assert.equal(authorityBlocked.ok, false);
  assert.equal(authorityBlocked.status, fixture.expected.blocked_authority_status);
  assert.equal(authorityBlocked.record, null);

  for (const testCase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const input = authorityStringClaimInput(testCase);
    const result = store.buildDogfoodingResearchRecordV01(input);
    assert.equal(result.ok, false, `${testCase.case_id} must be blocked`);
    assert.equal(
      result.status,
      fixture.expected.blocked_authority_status,
      `${testCase.case_id} status`,
    );
    assert.equal(result.record, null, `${testCase.case_id} must not build record`);
    assert.ok(
      result.privacy_report.findings.some(
        (finding) => finding.finding_kind === "forbidden_authority_phrase",
      ),
      `${testCase.case_id} must include forbidden authority phrase finding`,
    );
    assertBlockedPhraseNotEchoed(result, testCase, `${testCase.case_id} result`);
  }

  for (const testCase of fixture.allowed_negated_authority_string_cases) {
    const input = authorityStringClaimInput(testCase);
    const result = store.buildDogfoodingResearchRecordV01(input);
    assert.equal(result.ok, true, `${testCase.case_id} must remain allowed`);
    assert.equal(result.status, "created", `${testCase.case_id} status`);
    assert.ok(result.record, `${testCase.case_id} must build record`);
  }

  const missingSchemaDb = new Database(":memory:");
  try {
    assert.equal(store.dogfoodingResearchRecordStoreSchemaExistsV01(missingSchemaDb), false);
    const schemaMissing = store.createDogfoodingResearchRecordFromRecordV01(
      record,
      missingSchemaDb,
    );
    assert.equal(schemaMissing.ok, false);
    assert.equal(schemaMissing.status, "schema_missing");
  } finally {
    missingSchemaDb.close();
  }

  const db = new Database(":memory:");
  try {
    store.ensureDogfoodingResearchRecordStoreSchemaV01(db);
    assert.equal(store.dogfoodingResearchRecordStoreSchemaExistsV01(db), true);
    const createResult = store.createDogfoodingResearchRecordFromRecordV01(record, db);
    assert.equal(createResult.ok, true);
    assert.equal(createResult.status, "created");
    assertAllForbiddenExecutionFlagsFalse(createResult);

    const duplicateResult = store.createDogfoodingResearchRecordFromRecordV01(record, db);
    assert.equal(duplicateResult.ok, true);
    assert.equal(duplicateResult.status, fixture.expected.duplicate_status);
    assert.equal(duplicateResult.idempotent_replay, true);

    const readResult = store.readDogfoodingResearchRecordV01(record.record_id, db);
    assert.equal(readResult.ok, true);
    assert.equal(readResult.status, "read");
    assert.deepEqual(readResult.record, record);

    const listResult = store.listDogfoodingResearchRecordsV01({}, db);
    assert.equal(listResult.ok, true);
    assert.equal(listResult.status, "listed");
    assert.deepEqual(
      listResult.records.map((item) => item.record_id),
      [record.record_id],
    );

    const changedInput = clone(fixture.safe_input_example);
    changedInput.normalized_summary = `${changedInput.normalized_summary} Changed.`;
    const changedRecord = store.buildDogfoodingResearchRecordV01(changedInput).record;
    const conflictResult = store.createDogfoodingResearchRecordFromRecordV01(
      changedRecord,
      db,
    );
    assert.equal(conflictResult.ok, false);
    assert.equal(conflictResult.status, "conflicting_record");
  } finally {
    db.close();
  }
}

async function assertRouteBehavior() {
  const tempDbPath = `.tmp/dogfooding-research-records/smoke-${process.pid}/records.sqlite`;
  rmSync(dirname(tempDbPath), { recursive: true, force: true });
  try {
    const missingGet = await route.GET(
      new Request(`http://localhost/api/dogfooding/research-records?db_path=${encodeURIComponent(tempDbPath)}`),
    );
    assert.equal(missingGet.status, 404);
    assert.equal((await missingGet.json()).error_code, "db_missing");
    assert.equal(existsSync(tempDbPath), false, "GET must not create missing DB");

    const refusedPost = await route.POST(
      routeRequest(tempDbPath, fixture.safe_input_example, {
        origin: "http://example.invalid",
      }),
    );
    assert.equal(refusedPost.status, 403);
    assert.equal((await refusedPost.json()).error_code, "same_origin_required");
    assert.equal(existsSync(tempDbPath), false, "refused POST must not create DB");

    const invalidDbPost = await route.POST(
      routeRequest("../unsafe.sqlite", fixture.safe_input_example),
    );
    assert.equal(invalidDbPost.status, 400);
    assert.equal((await invalidDbPost.json()).error_code, "invalid_db_path");

    const invalidShapePost = await route.POST(
      routeRequest(tempDbPath, fixture.invalid_shape_example),
    );
    assert.equal(invalidShapePost.status, 400);
    assert.equal((await invalidShapePost.json()).error_code, "rejected");
    assert.equal(existsSync(tempDbPath), false, "invalid shape must not create DB");

    const blockedPrivatePost = await route.POST(
      routeRequest(tempDbPath, fixture.blocked_private_or_raw_payload_example),
    );
    assert.equal(blockedPrivatePost.status, 400);
    const blockedPrivateBody = await blockedPrivatePost.json();
    assert.equal(blockedPrivateBody.error_code, "blocked_private_or_raw_payload");
    assertNoUnsafeEcho(blockedPrivateBody, "route private blocked body");
    assert.equal(existsSync(tempDbPath), false, "blocked private input must not create DB");

    const blockedAuthorityPost = await route.POST(
      routeRequest(tempDbPath, fixture.blocked_forbidden_authority_example),
    );
    assert.equal(blockedAuthorityPost.status, 403);
    assert.equal((await blockedAuthorityPost.json()).error_code, "blocked_forbidden_authority");
    assert.equal(existsSync(tempDbPath), false, "blocked authority input must not create DB");

    const blockedStringClaimCase =
      fixture.blocked_forbidden_authority_string_claim_cases[0];
    const blockedStringClaimPost = await route.POST(
      routeRequest(tempDbPath, authorityStringClaimInput(blockedStringClaimCase)),
    );
    assert.equal(blockedStringClaimPost.status, 403);
    const blockedStringClaimBody = await blockedStringClaimPost.json();
    assert.equal(
      blockedStringClaimBody.error_code,
      "blocked_forbidden_authority",
    );
    assertBlockedPhraseNotEchoed(
      blockedStringClaimBody,
      blockedStringClaimCase,
      "route blocked authority string body",
    );
    assert.equal(
      existsSync(tempDbPath),
      false,
      "blocked authority string input must not create DB",
    );

    const createPost = await route.POST(routeRequest(tempDbPath, fixture.safe_input_example));
    assert.equal(createPost.status, 201);
    const createBody = await createPost.json();
    assert.equal(createBody.status, "ok");
    assert.equal(createBody.records[0].record_id, fixture.safe_input_example.record_id);
    assertAllForbiddenExecutionFlagsFalse(createBody);
    assert.equal(existsSync(tempDbPath), true, "valid POST must create local test DB");

    const duplicatePost = await route.POST(routeRequest(tempDbPath, fixture.safe_input_example));
    assert.equal(duplicatePost.status, 200);
    const duplicateBody = await duplicatePost.json();
    assert.equal(duplicateBody.store_result.status, "duplicate_record");
    assert.equal(duplicateBody.store_result.idempotent_replay, true);

    const listGet = await route.GET(
      new Request(`http://localhost/api/dogfooding/research-records?db_path=${encodeURIComponent(tempDbPath)}`),
    );
    assert.equal(listGet.status, 200);
    const listBody = await listGet.json();
    assert.equal(listBody.store_result.status, "listed");
    assert.deepEqual(
      listBody.records.map((record) => record.record_id),
      [fixture.safe_input_example.record_id],
    );

    const readGet = await route.GET(
      new Request(
        `http://localhost/api/dogfooding/research-records?db_path=${encodeURIComponent(tempDbPath)}&record_id=${encodeURIComponent(fixture.safe_input_example.record_id)}`,
      ),
    );
    assert.equal(readGet.status, 200);
    const readBody = await readGet.json();
    assert.equal(readBody.store_result.status, "read");
    assert.equal(readBody.records[0].record_id, fixture.safe_input_example.record_id);
  } finally {
    rmSync(dirname(tempDbPath), { recursive: true, force: true });
  }
}

function routeRequest(dbPath, input, headerOverrides = {}) {
  return new Request("http://localhost/api/dogfooding/research-records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      ...headerOverrides,
    },
    body: JSON.stringify({
      action: "create",
      db_path: dbPath,
      input,
    }),
  });
}

function authorityStringClaimInput(testCase) {
  const input = clone(fixture.safe_input_example);
  input.record_id = `dogfooding-research-record:${testCase.case_id}`;
  input.record_kind = "operator_review_note";
  delete input.codex_result_report_input;
  input.source_refs = ["authority-string-claim-test-ref"];
  input.pr_refs = [];
  input.branch_refs = [];
  input.commit_refs = [];
  input.changed_file_refs = [];
  input.validation_refs = [];
  input.skipped_check_refs = [];
  input.known_warning_refs = [];
  input.not_done_refs = [];
  input.expected_observed_delta_refs = [];
  input.review_cues = [];
  input.boundary_notes = ["Authority string claim test case."];
  const phrase = phraseForCase(testCase);
  if (testCase.target === "boundary_notes") {
    input.normalized_summary = "Boundary note authority string claim test.";
    input.boundary_notes = [phrase];
  } else {
    input.normalized_summary = phrase;
  }
  return input;
}

function phraseForCase(testCase) {
  if (Array.isArray(testCase.phrase_parts)) return testCase.phrase_parts.join(" ");
  return testCase.phrase;
}

function assertAllForbiddenExecutionFlagsFalse(value) {
  for (const flag of fixture.expected.forbidden_execution_flags_false) {
    assert.equal(value[flag], false, `${flag} must stay false`);
  }
  const boundary = value.authority_boundary ?? value.record?.authority_boundary;
  if (boundary) {
    for (const key of [
      "product_write_now",
      "promotion_execution_now",
      "proof_or_evidence_record_now",
      "claim_or_evidence_write_now",
      "formation_receipt_write_now",
      "durable_state_apply_now",
      "review_memory_write_now",
      "github_api_call_now",
      "git_write_now",
      "github_git_actuation_now",
      "provider_openai_call_now",
      "retrieval_execution_now",
      "source_fetch_now",
      "release_deploy_publish_now",
    ]) {
      assert.equal(boundary[key], false, `${key} must stay false`);
    }
  }
}

function assertChangedFileScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.doesNotMatch(filePath, /^components\//, "no component files may change");
    assert.doesNotMatch(filePath, /^app\/(?:page|perspective|workbench)/, "no public route model files may change");
    assert.doesNotMatch(filePath, /^lib\/db\//, "no DB schema files may change");
    assert.doesNotMatch(filePath, /migrations/i, "no migration files may change");
    assert.doesNotMatch(filePath, /provider|retrieval|source-fetch/i, "no provider/retrieval/source-fetch files may change");
  }
}

function collectChangedFiles() {
  const outputs = [
    execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }),
    execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" }),
  ];
  return [...new Set(outputs.flatMap((output) => output.split(/\r?\n/).filter(Boolean)))].sort();
}

function assertNoUnsafeEcho(value, label) {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_HIDDEN_REASONING",
    "SAFE_MARKER_PRIVATE_URL",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "SAFE_MARKER_SECRET_TOKEN",
  ]) {
    assert.ok(!text.includes(marker), `${label} must not echo ${marker}`);
  }
}

function assertBlockedPhraseNotEchoed(value, testCase, label) {
  const phrase = phraseForCase(testCase);
  assert.ok(!JSON.stringify(value).includes(phrase), `${label} must not echo blocked phrase`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} must include ${needle}`);
}

function assertIncludesNormalized(source, needle, label) {
  assert.ok(
    source.replace(/\s+/g, " ").includes(needle.replace(/\s+/g, " ")),
    `${label} must include ${needle}`,
  );
}

function assertNotIncludes(source, needle, label) {
  assert.ok(!source.includes(needle), `${label} must not include ${needle}`);
}
