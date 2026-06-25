import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_STORE_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.memory-store.sample.v0.1.json";
const helperPath = "lib/research-candidate-review/review-memory-store.ts";
const typePath = "types/research-candidate-review-memory-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-review-memory-store-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-store-v0-1.mjs";
const storeVersion = "research_candidate_review_memory_store.v0.1";
const contractVersion = "research_candidate_review_memory_contract.v0.1";
const status = "local_store_snapshot";

const forbiddenAuthorityFields = [
  "runtime_route_added_now",
  "ui_added_now",
  "db_migration_added_now",
  "db_query_or_write_now",
  "provider_openai_call_now",
  "source_fetch_now",
  "retrieval_rag_execution_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

const forbiddenHelperSourceSnippets = [
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "new OpenAI",
  "better-sqlite3",
  "sqlite",
  "db.prepare",
  "child_process",
  "exec(",
  "spawn(",
  "createPullRequest",
  "createBranch",
  "git commit",
  "app/api",
];

const forbiddenSourceRefExamples = [
  "https://private.example.com/customer/path",
  "http://private.example.com/customer/path",
  "file:///Users/hynk/private.txt",
  "/Users/hynk/private.txt",
  "/home/hynk/private.txt",
  "C:\\Users\\hynk\\private.txt",
  "raw source body: example",
  "raw candidate payload: example",
  "raw provider output: example",
  "provider thread thread_abc123",
  "provider run run_abc123",
  "provider session session_abc123",
  "raw_db_row: users",
  "browser dump: html",
  "hidden reasoning: example",
  "sk-FAKE_UNREDACTED_EXAMPLE",
  "ghp_FAKE_UNREDACTED_EXAMPLE",
  "OPENAI_API_KEY=FAKE_UNREDACTED_EXAMPLE",
  "GITHUB_TOKEN=FAKE_UNREDACTED_EXAMPLE",
  "password: example",
  "secret: example",
  "-----BEGIN PRIVATE KEY-----",
];

const safeSourceRefExamples = [
  "lifecycle-summary:claim-lifecycle-001",
  "calibration-diagnostic:claim-calibration-001",
  "logical-claim-shape:claim-well-001",
  "feedback-rule:ai-context:repeated-correction:001",
  "temporal-handoff:codex-handoff-001",
  "target-agent-profile:codex-handoff-001",
  "operator-note:blocked-payload-placeholder-001",
  "manual-source-ref:operator-note-boundary-001",
];

for (const filePath of [docPath, fixturePath, helperPath, typePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const helperSource = readFile(helperPath);
const typeSource = readFile(typePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assert.equal(fixture.fixture_version, "research_candidate_review_memory_store.sample.v0.1");
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, status);

assertTypeCoverage();
assertHelperOutput();
assertSnapshot(fixture.expected_snapshot);
assertStoreOperations();
assertFileRoundtrip();
assertPrivacyRejections();
assertTimestampValidation();
assertReasonCodeValidation();
assertLineageValidation();
assertAuthorityBoundary(fixture.expected_snapshot.authority_boundary, "snapshot");
assertHelperSourceBoundary();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to store doc");
assertIndexBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-store-v0-1",
      final_status: "pass",
      store_version: fixture.store_version,
      contract_version: fixture.contract_version,
      status: fixture.status,
      records: fixture.expected_snapshot.records.length,
      store_fingerprint: fixture.expected_snapshot.store_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeCoverage() {
  for (const requiredText of [
    "export interface ResearchCandidateReviewMemoryStoreAuthorityBoundary",
    "export interface ResearchCandidateReviewMemoryStoreSnapshot",
    "export interface ResearchCandidateReviewMemoryStoreInput",
    "export interface ResearchCandidateReviewMemoryDiscardInput",
    "export interface ResearchCandidateReviewMemorySupersedeInput",
    storeVersion,
    contractVersion,
    status,
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertHelperOutput() {
  const snapshot = helper.createEmptyResearchCandidateReviewMemoryStoreSnapshot({
    scope: fixture.scope,
    as_of: fixture.as_of,
    records: fixture.input_records,
  });
  assert.deepEqual(snapshot, fixture.expected_snapshot);
  assert.deepEqual(helper.validateResearchCandidateReviewMemoryStoreSnapshot(snapshot), {
    passed: true,
    failure_codes: [],
  });
  assert.equal(
    helper.createResearchCandidateReviewMemoryStoreFingerprint(snapshot),
    snapshot.store_fingerprint,
  );
}

function assertSnapshot(snapshot) {
  assert.equal(snapshot.store_version, storeVersion);
  assert.equal(snapshot.contract_version, contractVersion);
  assert.equal(snapshot.scope, "project:augnes");
  assert.equal(snapshot.status, status);
  assert.ok(Array.isArray(snapshot.records));
  assert.ok(snapshot.records.length > 0, "records must be non-empty");
  assert.deepEqual(
    snapshot.record_order,
    snapshot.records.map((record) => record.record_id),
    "record_order matches records",
  );
  assert.equal(snapshot.record_count, snapshot.records.length);
  assert.deepEqual(snapshot.active_record_refs, refsForState(snapshot, "active"));
  assert.deepEqual(snapshot.discarded_record_refs, refsForState(snapshot, "discarded"));
  assert.deepEqual(snapshot.superseded_record_refs, refsForState(snapshot, "superseded"));
  assert.deepEqual(helper.validateResearchCandidateReviewMemoryStoreSnapshot(snapshot), {
    passed: true,
    failure_codes: [],
  });
  for (const record of snapshot.records) {
    assert.deepEqual(helper.validateResearchCandidateReviewMemoryRecordForStore(record), {
      passed: true,
      failure_codes: [],
    });
  }
}

function assertStoreOperations() {
  const snapshot = fixture.expected_snapshot;
  const activeRecord = snapshot.records.find(
    (record) => record.record_id === "store-record-active-001",
  );
  const idempotentSnapshot = helper.upsertResearchCandidateReviewMemoryRecord(
    snapshot,
    activeRecord,
  );
  assert.equal(idempotentSnapshot.store_fingerprint, snapshot.store_fingerprint);
  assert.deepEqual(idempotentSnapshot, snapshot);

  const olderRecord = {
    ...activeRecord,
    bounded_summary: "Older record should not replace newer review memory.",
    created_at: "2026-06-24T00:00:00.000Z",
    updated_at: "2026-06-24T00:00:00.000Z",
  };
  assert.throws(
    () => helper.upsertResearchCandidateReviewMemoryRecord(snapshot, olderRecord),
    /older_record_update_rejected/,
  );

  const discardedSnapshot = helper.discardResearchCandidateReviewMemoryRecord(snapshot, {
    record_id: "store-record-active-001",
    discard_reason: "Operator discarded this record in a bounded store smoke.",
    updated_at: "2026-06-25T01:00:00.000Z",
  });
  const discardedRecord = discardedSnapshot.records.find(
    (record) => record.record_id === "store-record-active-001",
  );
  assert.equal(discardedRecord.lifecycle_state, "discarded");
  assert.equal(discardedRecord.review_decision, "discard");
  assert.equal(discardedRecord.discard_reason, "Operator discarded this record in a bounded store smoke.");
  assert.ok(discardedSnapshot.records.some((record) => record.record_id === activeRecord.record_id));
  assert.ok(discardedRecord.reason_codes.includes("discard_is_not_deletion"));
  assert.deepEqual(helper.validateResearchCandidateReviewMemoryStoreSnapshot(discardedSnapshot), {
    passed: true,
    failure_codes: [],
  });

  const supersedingRecord = {
    ...activeRecord,
    record_id: "store-record-supersede-new-001",
    candidate_ref: "claim-store-supersede-new-001",
    related_record_refs: [],
    updated_at: "2026-06-25T02:00:00.000Z",
    bounded_summary: "Superseding record preserves old record lineage.",
  };
  const supersededSnapshot = helper.supersedeResearchCandidateReviewMemoryRecord(snapshot, {
    record_id: "store-record-active-001",
    superseding_record: supersedingRecord,
  });
  const oldRecord = supersededSnapshot.records.find(
    (record) => record.record_id === "store-record-active-001",
  );
  const newRecord = supersededSnapshot.records.find(
    (record) => record.record_id === "store-record-supersede-new-001",
  );
  assert.equal(oldRecord.lifecycle_state, "superseded");
  assert.equal(oldRecord.review_decision, "supersede");
  assert.equal(oldRecord.supersedes_record_ref, "store-record-supersede-new-001");
  assert.ok(oldRecord.related_record_refs.includes("store-record-supersede-new-001"));
  assert.ok(newRecord.related_record_refs.includes("store-record-active-001"));
  assert.ok(oldRecord.reason_codes.includes("supersede_preserves_lineage"));
  assert.deepEqual(helper.validateResearchCandidateReviewMemoryStoreSnapshot(supersededSnapshot), {
    passed: true,
    failure_codes: [],
  });

  const snapshotBeforeSelfSupersede = deepClone(snapshot);
  assert.throws(
    () =>
      helper.supersedeResearchCandidateReviewMemoryRecord(snapshot, {
        record_id: "store-record-active-001",
        superseding_record: deepClone(activeRecord),
      }),
    /self_supersede_rejected:store-record-active-001/,
  );
  assert.deepEqual(snapshot, snapshotBeforeSelfSupersede);
}

function assertFileRoundtrip() {
  const tempDir = mkdtempSync(join(tmpdir(), "augnes-review-memory-store-"));
  try {
    const filePath = join(tempDir, "store", "snapshot.json");
    helper.writeResearchCandidateReviewMemoryStoreFile(filePath, fixture.expected_snapshot);
    const writtenText = readFile(filePath);
    assert.ok(writtenText.endsWith("\n"), "written JSON must end with newline");
    assert.equal(writtenText, `${JSON.stringify(fixture.expected_snapshot, null, 2)}\n`);
    assert.deepEqual(
      helper.readResearchCandidateReviewMemoryStoreFile(filePath),
      fixture.expected_snapshot,
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertPrivacyRejections() {
  const baseRecord = fixture.expected_snapshot.records[0];
  for (const [index, forbiddenRef] of forbiddenSourceRefExamples.entries()) {
    const invalidRecord = {
      ...baseRecord,
      record_id: `invalid-source-ref-${index}`,
      source_refs: [
        {
          source_surface: "manual_source_ref",
          source_ref: forbiddenRef,
          public_safe: false,
        },
      ],
    };
    assert.equal(
      helper.validateResearchCandidateReviewMemoryRecordForStore(invalidRecord).passed,
      false,
      `${forbiddenRef} must be rejected`,
    );
  }
  for (const [index, safeRef] of safeSourceRefExamples.entries()) {
    const validRecord = {
      ...baseRecord,
      record_id: `valid-source-ref-${index}`,
      source_refs: [
        {
          source_surface: "manual_source_ref",
          source_ref: safeRef,
          public_safe: false,
        },
      ],
    };
    assert.deepEqual(helper.validateResearchCandidateReviewMemoryRecordForStore(validRecord), {
      passed: true,
      failure_codes: [],
    });
  }

  for (const field of ["bounded_summary", "operator_note_summary"]) {
    for (const forbiddenText of [
      "raw source body: example",
      "raw provider output: example",
      "hidden reasoning: example",
      "sk-FAKE_UNREDACTED_EXAMPLE",
      "password: example",
    ]) {
      const invalidRecord = {
        ...baseRecord,
        record_id: `invalid-${field}`,
        [field]: forbiddenText,
      };
      assert.equal(
        helper.validateResearchCandidateReviewMemoryRecordForStore(invalidRecord).passed,
        false,
        `${field} must reject ${forbiddenText}`,
      );
    }
  }

  const invalidPrivacyRecord = {
    ...baseRecord,
    record_id: "invalid-privacy-booleans",
    privacy_report: {
      ...baseRecord.privacy_report,
      privacy_class: "blocked_raw_private_payload",
      public_safe: false,
      raw_source_body_included: true,
      blocked_reason_codes: ["raw_payload_blocked"],
    },
  };
  assert.equal(
    helper.validateResearchCandidateReviewMemoryRecordForStore(invalidPrivacyRecord).passed,
    false,
    "blocked payload records cannot include raw/private booleans true",
  );
}

function assertTimestampValidation() {
  const baseRecord = fixture.expected_snapshot.records[0];
  const missingCreatedAtRecord = deepClone(baseRecord);
  missingCreatedAtRecord.record_id = "invalid-missing-created-at";
  delete missingCreatedAtRecord.created_at;
  assertRecordValidationFailure(missingCreatedAtRecord, "missing_created_at");

  const missingUpdatedAtRecord = deepClone(baseRecord);
  missingUpdatedAtRecord.record_id = "invalid-missing-updated-at";
  delete missingUpdatedAtRecord.updated_at;
  assertRecordValidationFailure(missingUpdatedAtRecord, "missing_updated_at");

  assertRecordValidationFailure(
    {
      ...baseRecord,
      record_id: "invalid-created-at-format",
      created_at: "not-a-date",
    },
    "invalid_created_at",
  );
  assertRecordValidationFailure(
    {
      ...baseRecord,
      record_id: "invalid-updated-at-format",
      updated_at: "not-a-date",
    },
    "invalid_updated_at",
  );
  assertRecordValidationFailure(
    {
      ...baseRecord,
      record_id: "invalid-updated-before-created",
      created_at: "2026-06-25T02:00:00.000Z",
      updated_at: "2026-06-25T01:00:00.000Z",
    },
    "updated_at_before_created_at",
  );

  assert.deepEqual(
    helper.validateResearchCandidateReviewMemoryRecordForStore({
      ...baseRecord,
      record_id: "valid-equal-timestamps",
      created_at: "2026-06-25T00:00:00.000Z",
      updated_at: "2026-06-25T00:00:00.000Z",
    }),
    { passed: true, failure_codes: [] },
  );
  assert.deepEqual(
    helper.validateResearchCandidateReviewMemoryRecordForStore({
      ...baseRecord,
      record_id: "valid-later-updated-at",
      created_at: "2026-06-25T00:00:00.000Z",
      updated_at: "2026-06-25T00:00:01.000Z",
    }),
    { passed: true, failure_codes: [] },
  );

  assert.throws(
    () =>
      helper.upsertResearchCandidateReviewMemoryRecord(fixture.expected_snapshot, {
        ...baseRecord,
        updated_at: "not-a-date",
      }),
    /invalid_updated_at/,
  );

  const upsertMissingUpdatedAtRecord = deepClone(baseRecord);
  delete upsertMissingUpdatedAtRecord.updated_at;
  assert.throws(
    () =>
      helper.upsertResearchCandidateReviewMemoryRecord(
        fixture.expected_snapshot,
        upsertMissingUpdatedAtRecord,
      ),
    /missing_updated_at/,
  );
}

function assertReasonCodeValidation() {
  const baseRecord = fixture.expected_snapshot.records[0];
  const unknownReasonRecord = {
    ...baseRecord,
    record_id: "invalid-unknown-reason-code",
    reason_codes: [...baseRecord.reason_codes, "proof_created"],
  };
  const unknownReasonValidation =
    helper.validateResearchCandidateReviewMemoryRecordForStore(unknownReasonRecord);
  assert.equal(unknownReasonValidation.passed, false);
  assert.ok(
    unknownReasonValidation.failure_codes.includes("invalid_reason_code:proof_created"),
    "unknown reason code must be rejected",
  );

  const nonArrayReasonRecord = {
    ...baseRecord,
    record_id: "invalid-non-array-reason-codes",
    reason_codes: "source_ref_present",
  };
  const nonArrayReasonValidation =
    helper.validateResearchCandidateReviewMemoryRecordForStore(nonArrayReasonRecord);
  assert.equal(nonArrayReasonValidation.passed, false);
  assert.ok(
    nonArrayReasonValidation.failure_codes.includes("invalid_reason_codes"),
    "non-array reason codes must be rejected",
  );
}

function assertLineageValidation() {
  const danglingRelatedSnapshot = snapshotWithRecordPatch(
    "store-record-active-001",
    (record) => ({
      ...record,
      related_record_refs: [...record.related_record_refs, "missing-record-ref-001"],
    }),
  );
  assertValidationFailure(
    danglingRelatedSnapshot,
    "dangling_related_record_ref:store-record-active-001:missing-record-ref-001",
  );

  const selfRelatedSnapshot = snapshotWithRecordPatch("store-record-active-001", (record) => ({
    ...record,
    related_record_refs: [...record.related_record_refs, record.record_id],
  }));
  assertValidationFailure(selfRelatedSnapshot, "self_related_record_ref:store-record-active-001");

  const danglingSupersedesSnapshot = snapshotWithRecordPatch(
    "store-record-superseded-001",
    (record) => ({
      ...record,
      supersedes_record_ref: "missing-superseding-record-001",
    }),
  );
  assertValidationFailure(
    danglingSupersedesSnapshot,
    "dangling_supersedes_record_ref:store-record-superseded-001:missing-superseding-record-001",
  );

  const selfSupersedesSnapshot = snapshotWithRecordPatch(
    "store-record-superseded-001",
    (record) => ({
      ...record,
      supersedes_record_ref: record.record_id,
    }),
  );
  assertValidationFailure(
    selfSupersedesSnapshot,
    "self_supersedes_record_ref:store-record-superseded-001",
  );
}

function assertHelperSourceBoundary() {
  for (const forbiddenText of forbiddenHelperSourceSnippets) {
    assert.ok(!helperSource.includes(forbiddenText), `helper must not contain ${forbiddenText}`);
  }
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Research Candidate Review Memory Store is local-store-only.",
    "It implements Phase 2.2 from the integrated development roadmap guide v0.2.",
    "It follows the #769 Review Memory Contract.",
    "It does not add runtime routes.",
    "It does not add UI.",
    "It does not add DB migrations.",
    "It does not query or write DB.",
    "It writes only to caller-provided local JSON file paths.",
    "It does not choose a default private path.",
    "It does not store raw private payloads.",
    "It does not store raw source bodies.",
    "It does not store raw provider outputs.",
    "It does not store raw conversations.",
    "It does not store hidden reasoning.",
    "It does not call provider/OpenAI.",
    "It does not fetch sources.",
    "It does not execute retrieval/RAG.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Candidate memory is not Perspective state.",
    "Discard is not deletion.",
    "Supersede preserves lineage.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertIndexBoundary() {
  const block = extractIndexBlock(indexDoc, "Research Candidate Review Memory Store v0.1");
  for (const requiredText of [
    docPath,
    helperPath,
    fixturePath,
    typePath,
    "scripts/smoke-research-candidate-review-memory-store-v0-1.mjs",
    "Phase 2.2",
    "integrated roadmap guide v0.2",
    "local-store-only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "does not implement routes",
    "UI",
    "DB migrations",
    "provider calls",
    "source fetch",
    "retrieval",
    "proof/evidence",
    "promotion",
    "GitHub automation",
    "Git Ledger",
    "product write",
  ]) {
    assert.ok(
      block.includes(requiredBoundaryText),
      `index block must include ${requiredBoundaryText}`,
    );
  }
  for (const forbiddenPattern of [
    /runtime route was added/i,
    /UI was added/i,
    /DB migration was added/i,
    /provider runtime was added/i,
    /retrieval runtime was added/i,
    /promotion was added/i,
    /Codex execution was added/i,
    /GitHub automation was added/i,
    /Git Ledger export was added/i,
    /product write was added/i,
    /product ID allocation was added/i,
  ]) {
    assert.doesNotMatch(block, forbiddenPattern);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(!source.includes(`${field}: true`), `doc must not grant ${field}`);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.local_store_only, true, `${label} local_store_only true`);
  assert.equal(
    boundary?.explicit_file_write_only,
    true,
    `${label} explicit_file_write_only true`,
  );
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function refsForState(snapshot, lifecycleState) {
  return snapshot.records
    .filter((record) => record.lifecycle_state === lifecycleState)
    .map((record) => record.record_id)
    .sort();
}

function snapshotWithRecordPatch(recordId, patchRecord) {
  const snapshot = deepClone(fixture.expected_snapshot);
  snapshot.records = snapshot.records.map((record) =>
    record.record_id === recordId ? patchRecord(deepClone(record)) : record,
  );
  snapshot.store_fingerprint =
    helper.createResearchCandidateReviewMemoryStoreFingerprint(snapshot);
  return snapshot;
}

function assertValidationFailure(snapshot, failureCode) {
  const validation = helper.validateResearchCandidateReviewMemoryStoreSnapshot(snapshot);
  assert.equal(validation.passed, false);
  assert.ok(
    validation.failure_codes.includes(failureCode),
    `expected validation failure ${failureCode}`,
  );
}

function assertRecordValidationFailure(record, failureCode) {
  const validation = helper.validateResearchCandidateReviewMemoryRecordForStore(record);
  assert.equal(validation.passed, false);
  assert.ok(
    validation.failure_codes.includes(failureCode),
    `expected record validation failure ${failureCode}`,
  );
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
