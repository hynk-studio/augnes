import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocsPath = "docs/DOGFOODING_RECORD_RUNTIME_CONTRACT_V0_1.md";
const docsPath = "docs/DOGFOODING_INGESTION_RUNTIME_V0_1.md";
const contractTypePath = "types/dogfooding-record-runtime-contract.ts";
const helperPath = "lib/dogfooding/dogfooding-ingestion-runtime.ts";
const storePath = "lib/dogfooding/dogfooding-record-store.ts";
const routePath = "app/api/dogfooding/records/route.ts";
const fixturePath = "fixtures/dogfooding-ingestion-runtime.sample.v0.1.json";
const schemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const runtimeVersion = "dogfooding_ingestion_runtime.v0.1";
const inputVersion = "dogfooding_ingestion_input.v0.1";
const resultVersion = "dogfooding_ingestion_result.v0.1";
const contractVersion = "dogfooding_record_runtime_contract.v0.1";
const fixtureVersion = "dogfooding_ingestion_runtime.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:dogfooding-ingestion-runtime-v0-1";
const packageScriptValue = "node scripts/smoke-dogfooding-ingestion-runtime-v0-1.mjs";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Dogfooding Ingestion Runtime ingests bounded summaries only.",
  "Dogfooding Ingestion Runtime requires explicit operator action.",
  "Dogfooding Ingestion Runtime does not ingest raw conversations.",
  "Dogfooding Ingestion Runtime does not ingest hidden reasoning.",
  "Dogfooding Ingestion Runtime does not ingest telemetry dumps.",
  "Dogfooding Ingestion Runtime does not read browser logs.",
  "Dogfooding Ingestion Runtime does not read session logs.",
  "Dogfooding Ingestion Runtime does not read private files.",
  "Dogfooding Ingestion Runtime does not fetch sources.",
  "Dogfooding Ingestion Runtime does not call providers.",
  "Dogfooding Ingestion Runtime does not execute retrieval or RAG.",
  "Dogfooding records are not truth.",
  "Dogfooding records are not proof.",
  "Dogfooding records are not promotion readiness.",
  "Dogfooding ingestion does not mutate candidates.",
  "Dogfooding ingestion does not mutate durable Perspective state.",
  "Dogfooding ingestion does not write Formation Receipts.",
  "Dogfooding ingestion does not promote Perspective.",
  "Dogfooding ingestion does not create proof/evidence.",
  "Dogfooding ingestion does not write claim/evidence records.",
  "Dogfooding ingestion does not product-write.",
  "Product-write requests are review cues only.",
  "Product-write requests do not execute product-write.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Private/raw/secret-like markers are rejected case-insensitively.",
  "Capitalization does not bypass raw conversation, hidden reasoning, telemetry, secret-like, private path, or private URL blocking.",
  "roadmap guide is not SSOT",
];

const fixtureForbiddenMarkers = [
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
  "raw feedback payload",
  "raw surfacing payload",
  "raw dogfooding payload",
  "raw conversation",
  "hidden reasoning",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "telemetry dump",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = [
  "raw dogfooding payload blocked by ingestion fixture",
  "raw conversation blocked by ingestion fixture",
  "hidden reasoning blocked by ingestion fixture",
  "telemetry dump blocked by ingestion fixture",
  "secret-like dogfooding input blocked by ingestion fixture",
  "Password: copied into note",
  "Secret: copied into note",
  "Private Key copied into note",
  "Raw Conversation copied into note",
  "Hidden Reasoning copied into note",
  "Telemetry Dump copied into note",
  "Secret: copied into signal summary",
  "Hidden Reasoning copied into boundary note",
  "Private-Local-Path-Ref:Dogfooding:Blocked",
  "Secret: copied into reason code",
];

const forbiddenPositiveAuthorityGrants = [
  "browser_log_ingestion_now: true",
  "session_log_ingestion_now: true",
  "raw_conversation_ingestion_now: true",
  "telemetry_ingestion_now: true",
  "external_analytics_ingestion_now: true",
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_execution_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "candidate_mutation_now: true",
  "rule_mutation_now: true",
  "parser_mutation_now: true",
  "source_fetch_now: true",
  "local_file_read_now: true",
  "repository_file_read_now: true",
  "uploaded_file_read_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
  "dogfooding_record_is_truth: true",
  "dogfooding_record_is_proof: true",
  "dogfooding_record_is_promotion_readiness: true",
  "dogfooding_record_is_raw_conversation: true",
  "dogfooding_record_is_hidden_reasoning: true",
  "dogfooding_record_is_telemetry_dump: true",
];

const indexForbiddenImplications = [
  "raw conversation ingestion was added",
  "hidden reasoning ingestion was added",
  "telemetry ingestion was added",
  "browser log ingestion was added",
  "session log ingestion was added",
  "private file read was added",
  "source fetch was added",
  "state mutation was added",
  "proof/evidence writes were added",
  "product-write was added",
  "Git Ledger export was added",
  "provider calls were added",
  "retrieval/RAG was added",
  "GitHub automation was added",
];

const roadmapText = readText(roadmapPath);
const contractDocsText = readText(contractDocsPath);
const docsText = readText(docsPath);
const contractTypeText = readText(contractTypePath);
const helperText = readText(helperPath);
const storeText = readText(storePath);
const routeText = readText(routePath);
const fixtureText = readText(fixturePath);
const schemaText = readText(schemaPath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const fixture = JSON.parse(fixtureText);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);
const store = await import(pathToFileURL(`${process.cwd()}/${storePath}`).href);

assertIncludes(
  roadmapText,
  "dogfooding_ingestion_runtime_v0_1",
  "roadmap contains Phase 6.2 runtime slice",
);
assertIncludes(
  contractDocsText,
  "Dogfooding Record Runtime Contract is contract-only.",
  contractDocsPath,
);

assertFixtureVersions();
assertStaticFiles();
assertHelperBehavior();
assertStoreBehavior();
assertRouteBoundaries();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();
assertNoOutputStoresRawMarkers();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "dogfooding-ingestion-runtime-v0-1",
      runtime_version: runtimeVersion,
      valid_inputs: Object.keys(fixture.valid_inputs).length,
      invalid_inputs: Object.keys(fixture.invalid_inputs).length,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.input_version, inputVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.contract_version, contractVersion);
  assert.equal(fixture.scope, scope);
  assert.deepEqual(fixture.source_fixture_refs, [
    "fixtures/dogfooding-record-runtime-contract.sample.v0.1.json",
    "fixtures/feedback-influenced-surfacing-preview.sample.v0.1.json",
  ]);
}

function assertStaticFiles() {
  for (const text of [
    "DogfoodingIngestionSignalInput",
    "DogfoodingIngestionInput",
    "DogfoodingIngestionResult",
    "DogfoodingIngestionValidationResult",
    "ingestDogfoodingRecordV01",
    "validateDogfoodingIngestionInputV01",
    "validateDogfoodingIngestionSignalInputV01",
    "createDogfoodingIngestionAuthorityBoundaryV01",
    "createDogfoodingRecordFingerprintV01",
    "createDogfoodingReviewCueFromSignalV01",
  ]) {
    assertIncludes(helperText, text, `helper export ${text}`);
  }
  for (const text of [
    "ensureDogfoodingRecordStoreSchemaV01",
    "dogfoodingRecordStoreSchemaExistsV01",
    "createDogfoodingRecordV01",
    "readDogfoodingRecordV01",
    "listDogfoodingRecordsV01",
  ]) {
    assertIncludes(storeText, text, `store export ${text}`);
  }
  for (const table of [
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
  ]) {
    assertIncludes(schemaText, table, `schema table ${table}`);
  }
  assertIncludes(contractTypeText, "export interface DogfoodingRecord", contractTypePath);
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  assertIncludes(helperText, "const normalizedValue = value.toLowerCase()", "helper normalizes marker values");
  assertIncludes(helperText, "marker.toLowerCase()", "helper normalizes markers");
  assertIncludes(helperText, "function includesMarker", "helper case-insensitive marker helper");
  assertIncludes(routeText, "const normalizedValue = value.toLowerCase()", "route normalizes marker values");
  assertIncludes(routeText, "marker.toLowerCase()", "route normalizes markers");
  assertIncludes(storeText, "const normalizedValue = value.toLowerCase()", "store normalizes marker values");
  assertIncludes(storeText, "marker.toLowerCase()", "store normalizes markers");
  for (const [source, label] of [
    [helperText, helperPath],
    [routeText, routePath],
    [storeText, storePath],
  ]) {
    assert.doesNotMatch(
      source,
      /value\\.includes\\(marker\\)|JSON\\.stringify\\(record\\)\\.includes\\(marker\\)/,
      `${label} must not use plain case-sensitive marker includes`,
    );
  }
}

function assertHelperBehavior() {
  const validInput = fixture.valid_inputs.valid_bounded_ingestion;
  const validValidation = helper.validateDogfoodingIngestionInputV01(validInput);
  assert.equal(validValidation.passed, true, "valid input should validate");

  const validResult = helper.ingestDogfoodingRecordV01(validInput);
  assert.deepEqual(validResult, fixture.expected_results.valid_bounded_ingestion);
  assert.deepEqual(helper.ingestDogfoodingRecordV01(validInput), validResult);
  assert.equal(validResult.status, "ingested");
  assert.ok(validResult.record, "valid result must include record");
  assert.equal(validResult.record.record_id, validInput.record_id);
  assert.equal(validResult.record.status, "ready_for_future_ingestion");
  assert.equal(validResult.record.public_safe, true);
  assert.equal(validResult.durable_state_mutated, false);
  assert.equal(validResult.candidate_mutated, false);
  assert.equal(validResult.proof_or_evidence_created, false);
  assert.equal(validResult.claim_or_evidence_written, false);
  assert.equal(validResult.product_write_executed, false);

  const emptyResult = helper.ingestDogfoodingRecordV01(fixture.valid_inputs.empty_signals);
  assert.deepEqual(emptyResult, fixture.expected_results.empty_signals);
  assert.equal(emptyResult.status, "empty");
  assert.equal(emptyResult.record, null);
  assert.equal(emptyResult.review_cues.length, 0);

  const productResult = helper.ingestDogfoodingRecordV01(
    fixture.valid_inputs.product_write_request_review_cue,
  );
  assert.deepEqual(productResult, fixture.expected_results.product_write_request_review_cue);
  assert.equal(productResult.status, "ingested");
  const productCue = productResult.review_cues.find(
    (cue) => cue.cue_kind === "product_write_reentry_request",
  );
  assert.ok(productCue, "product-write request cue must exist");
  assert.equal(productCue.product_write_request_only, true);
  assert.equal(productCue.product_write_executed, false);
  assert.equal(productCue.candidate_only, true);
  for (const code of [
    "product_write_request_recorded_as_review_cue_only",
    "product_write_not_executed",
    "product_write_denied",
  ]) {
    assert.ok(productCue.reason_codes.includes(code), `product cue reason ${code}`);
  }

  for (const [key, invalidInput] of Object.entries(fixture.invalid_inputs)) {
    const result = helper.ingestDogfoodingRecordV01(invalidInput);
    assert.deepEqual(result, fixture.expected_rejection_results[key], `${key} rejection`);
    assert.equal(result.record, null, `${key} must not build record`);
    assert.equal(result.review_cues.length, 0, `${key} must not build cues`);
    assert.equal(result.durable_state_mutated, false, `${key} state flag`);
    assert.equal(result.candidate_mutated, false, `${key} candidate flag`);
    assert.equal(result.proof_or_evidence_created, false, `${key} proof flag`);
    assert.equal(result.claim_or_evidence_written, false, `${key} claim flag`);
    assert.equal(result.product_write_executed, false, `${key} product flag`);
  }
  assert.equal(
    fixture.expected_rejection_results.private_raw_input.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.raw_conversation_marker.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.hidden_reasoning_marker.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.telemetry_dump_marker.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.local_private_path.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.forbidden_authority.status,
    "blocked_forbidden_authority",
  );
  assert.equal(fixture.expected_rejection_results.public_safe_false.status, "blocked_invalid_input");
  assert.equal(
    fixture.expected_rejection_results.signal_public_safe_false.status,
    "blocked_invalid_input",
  );
  for (const key of [
    "capitalized_password_marker",
    "capitalized_secret_marker",
    "capitalized_private_key_marker",
    "capitalized_raw_conversation_marker",
    "capitalized_hidden_reasoning_marker",
    "capitalized_telemetry_dump_marker",
    "capitalized_signal_secret_marker",
    "capitalized_boundary_note_marker",
    "capitalized_ref_marker",
    "capitalized_reason_code_marker",
  ]) {
    assert.equal(
      fixture.expected_rejection_results[key].status,
      "blocked_private_or_raw_payload",
      `${key} must block private/raw payload`,
    );
  }
  for (const key of [
    "capitalized_password_marker",
    "capitalized_secret_marker",
    "capitalized_private_key_marker",
    "capitalized_signal_secret_marker",
    "capitalized_reason_code_marker",
  ]) {
    assert.ok(
      fixture.expected_rejection_results[key].reason_codes.includes(
        "secret_like_pattern_blocked",
      ),
      `${key} must include secret_like_pattern_blocked`,
    );
  }
  assert.ok(
    fixture.expected_rejection_results.capitalized_raw_conversation_marker.reason_codes.includes(
      "raw_conversation_blocked",
    ),
    "capitalized raw conversation must include raw_conversation_blocked",
  );
  assert.ok(
    fixture.expected_rejection_results.capitalized_hidden_reasoning_marker.reason_codes.includes(
      "hidden_reasoning_blocked",
    ),
    "capitalized hidden reasoning must include hidden_reasoning_blocked",
  );
  assert.ok(
    fixture.expected_rejection_results.capitalized_boundary_note_marker.reason_codes.includes(
      "hidden_reasoning_blocked",
    ),
    "capitalized boundary note must include hidden_reasoning_blocked",
  );
  assert.ok(
    fixture.expected_rejection_results.capitalized_telemetry_dump_marker.reason_codes.includes(
      "telemetry_dump_blocked",
    ),
    "capitalized telemetry dump must include telemetry_dump_blocked",
  );
  assert.ok(
    fixture.expected_rejection_results.capitalized_ref_marker.reason_codes.includes(
      "local_path_blocked",
    ),
    "capitalized local path ref must include local_path_blocked",
  );
}

function assertStoreBehavior() {
  const tempRoot = mkdtempSync(join(tmpdir(), "augnes-dogfooding-ingestion-"));
  const dbPath = join(tempRoot, "dogfooding.sqlite");
  const db = new Database(dbPath);
  try {
    assert.equal(store.dogfoodingRecordStoreSchemaExistsV01(db), false);
    store.ensureDogfoodingRecordStoreSchemaV01(db);
    assert.equal(store.dogfoodingRecordStoreSchemaExistsV01(db), true);

    const validRecord = fixture.expected_results.valid_bounded_ingestion.record;
    const productRecord = fixture.expected_results.product_write_request_review_cue.record;
    const createResult = store.createDogfoodingRecordV01(validRecord, db);
    assert.equal(createResult.ok, true);
    assert.equal(createResult.status, "created");

    const readResult = store.readDogfoodingRecordV01(validRecord.record_id, db);
    assert.equal(readResult.ok, true);
    assert.deepEqual(readResult.record, validRecord);

    const duplicateResult = store.createDogfoodingRecordV01(validRecord, db);
    assert.equal(duplicateResult.ok, false);
    assert.equal(duplicateResult.status, "duplicate_record");

    const productCreateResult = store.createDogfoodingRecordV01(productRecord, db);
    assert.equal(productCreateResult.ok, true);

    const listResult = store.listDogfoodingRecordsV01({ include_blocked: true }, db);
    assert.equal(listResult.ok, true);
    assert.deepEqual(
      listResult.records.map((record) => record.record_id),
      fixture.store_expectations.list_expected_record_ids,
    );

    const unsafeStoreRecord = structuredClone(validRecord);
    unsafeStoreRecord.record_id = "dogfooding-record:ingestion:store-capitalized-private";
    unsafeStoreRecord.bounded_context_summary = "Password: copied into stored record";
    const unsafeStoreCreate = store.createDogfoodingRecordV01(unsafeStoreRecord, db);
    assert.equal(unsafeStoreCreate.ok, false);
    assert.equal(unsafeStoreCreate.status, "blocked_private_or_raw_payload");
    const unsafeStoreRead = store.readDogfoodingRecordV01(unsafeStoreRecord.record_id, db);
    assert.equal(unsafeStoreRead.status, "not_found", "unsafe store record must not persist");

    const conflictingRecord = structuredClone(validRecord);
    conflictingRecord.record_id = "dogfooding-record:ingestion:partial-failure";
    const failedCreate = store.createDogfoodingRecordV01(conflictingRecord, db);
    assert.equal(failedCreate.ok, false);
    const partialRead = store.readDogfoodingRecordV01(conflictingRecord.record_id, db);
    assert.equal(partialRead.status, "not_found", "failed write must leave no partial row");
  } finally {
    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertRouteBoundaries() {
  assertIncludes(routeText, "export async function GET", "route exports GET");
  assertIncludes(routeText, "export async function POST", "route exports POST");
  assertIncludes(routeText, "requestHasSameOriginBoundary", "POST has same-origin guard");
  assertIncludes(routeText, "await request.json()", "POST parses JSON");
  assertIncludes(routeText, "invalid_json_object", "POST requires JSON object");
  assertIncludes(routeText, "validateDogfoodingIngestionInputV01", "POST validates input");
  assertIncludes(routeText, "openWriteDogfoodingDbV01", "route has write opener");
  assertIncludes(routeText, "openReadOnlyDogfoodingDbV01", "route has read-only opener");
  assertIncludes(routeText, "readonly: true", "GET uses read-only DB option");
  assertIncludes(routeText, "fileMustExist: true", "GET requires existing DB file");
  assertIncludes(routeText, "db_missing", "GET has db_missing bounded response");
  assertIncludes(routeText, "schema_missing", "GET has schema_missing bounded response");
  assertIncludes(routeText, "storeResponse", "route maps store errors to top-level response");
  assertIncludes(routeText, "OPENAI_API_KEY", "route safe DB path checks token markers");
  assertIncludes(routeText, "password:", "route safe DB path checks secret-like markers");

  const postStart = routeText.indexOf("export async function POST");
  const validationIndex = routeText.indexOf("validateDogfoodingIngestionInputV01", postStart);
  const openWriteIndex = routeText.indexOf("openWriteDogfoodingDbV01", postStart);
  assert.ok(validationIndex > postStart, "POST validation must be in handler");
  assert.ok(openWriteIndex > validationIndex, "POST validates before opening write DB");

  const getSegment = routeText.slice(
    routeText.indexOf("export async function GET"),
    routeText.indexOf("export async function POST"),
  );
  assertNotIncludes(getSegment, "mkdirSync", "GET must not mkdir");
  assertNotIncludes(getSegment, "ensureDogfoodingRecordStoreSchemaV01", "GET must not ensure schema");

  for (const forbidden of [
    "OpenAI",
    "provider_openai_call_now: true",
    "prompt_sent_now: true",
    "retrieval_execution_now: true",
    "rag_answer_generation_now: true",
    "source_fetch_now: true",
    "product_write_now: true",
    "durable_state_write_now: true",
    "proof_or_evidence_record_now: true",
    "github_automation_authority: true",
  ]) {
    assertNotIncludes(routeText, forbidden, routePath);
  }
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) {
    assertIncludes(docsText, phrase, `docs exact phrase ${phrase}`);
  }
  for (const source of [docsText, indexText, routeText]) {
    for (const forbidden of forbiddenPositiveAuthorityGrants) {
      assertNotIncludes(source, forbidden, `forbidden grant ${forbidden}`);
    }
  }
}

function assertIndexCoverage() {
  for (const path of [
    docsPath,
    helperPath,
    storePath,
    routePath,
    fixturePath,
    "scripts/smoke-dogfooding-ingestion-runtime-v0-1.mjs",
  ]) {
    assertIncludes(indexText, path, `index pointer ${path}`);
  }
  assertIncludes(indexText, "bounded summaries only", "index bounded summaries");
  assertIncludes(indexText, "explicit operator action", "index explicit operator action");
  assertIncludes(indexText, "Product-write remains parked by #686.", "index product-write parked");
  for (const forbidden of indexForbiddenImplications) {
    assertNotIncludes(indexText, forbidden, indexPath);
  }
}

function assertFixturePrivacy() {
  let sanitized = fixtureText;
  for (const allowed of allowedFixturePlaceholders) {
    sanitized = sanitized.split(allowed).join("");
  }
  for (const marker of fixtureForbiddenMarkers) {
    assertNotIncludes(sanitized, marker, `fixture privacy marker ${marker}`);
  }
}

function assertNoOutputStoresRawMarkers() {
  const outputText = JSON.stringify({
    expected_results: fixture.expected_results,
    expected_records: fixture.expected_records,
    expected_review_cues: fixture.expected_review_cues,
    expected_rejection_results: fixture.expected_rejection_results,
  });
  for (const marker of fixtureForbiddenMarkers) {
    assertNotIncludes(outputText, marker, `output privacy marker ${marker}`);
  }
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), `${label} must include ${needle}`);
}

function assertNotIncludes(text, needle, label) {
  assert.ok(!text.includes(needle), `${label} must not include ${needle}`);
}
