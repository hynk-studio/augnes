import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_CONTRACT_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.memory-contract.sample.v0.1.json";
const typePath = "types/research-candidate-review-memory-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-review-memory-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-contract-v0-1.mjs";
const contractVersion = "research_candidate_review_memory_contract.v0.1";
const recordVersion = "research_candidate_review_memory_record.v0.1";
const bundleVersion = "research_candidate_review_memory_contract_bundle.v0.1";
const status = "contract_only";

const recordKinds = new Set([
  "candidate_review_snapshot",
  "operator_review_note",
  "discard_record",
  "feedback_summary",
  "handoff_summary",
  "diagnostic_summary",
  "profile_summary",
]);

const lifecycleStates = new Set([
  "draft",
  "active",
  "discarded",
  "superseded",
  "archived",
]);

const reviewDecisions = new Set([
  "none",
  "keep_for_review",
  "discard",
  "supersede",
  "needs_more_evidence",
  "needs_operator_review",
]);

const sourceSurfaces = new Set([
  "research_candidate_lifecycle_read_model",
  "research_candidate_calibration_diagnostic",
  "logical_claim_shape_preview",
  "feedback_to_rule_candidate",
  "temporal_handoff_diagnostic_sections",
  "target_agent_ai_context_packet_profiles",
  "operator_note",
  "manual_source_ref",
  "unknown",
]);

const privacyClasses = new Set([
  "public_safe",
  "private_ref_only",
  "blocked_raw_private_payload",
]);

const reasonCodes = new Set([
  "candidate_ref_present",
  "candidate_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "operator_review_required",
  "discard_is_not_deletion",
  "supersede_preserves_lineage",
  "privacy_boundary_preserved",
  "raw_payload_blocked",
  "contract_only_not_runtime_memory",
  "candidate_memory_not_truth",
  "review_memory_not_promotion",
  "product_write_denied",
]);

const forbiddenAuthorityFields = [
  "runtime_memory_write_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

const forbiddenSummaryPattern =
  /raw conversation|hidden reasoning|raw source body|raw candidate payload|raw provider output|provider thread|provider run|private URL|file:\/\/\/Users|\/Users\/|\bsecret\b|\btoken\b|sk-|ghp_|password:|private key/i;

for (const filePath of [docPath, fixturePath, typePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const typeSource = readFile(typePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);

assert.equal(
  fixture.fixture_version,
  "research_candidate_review_memory_contract.sample.v0.1",
);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, status);
assert.equal(fixture.expected_bundle.status, status);

assertTypeContract();
assertBundle(fixture.expected_bundle);
assertFixtureCoverage(fixture.expected_bundle);
assertFingerprint(fixture.expected_bundle);
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to review memory contract doc");
assertIndexBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-contract-v0-1",
      final_status: "pass",
      contract_version: fixture.contract_version,
      record_version: fixture.record_version,
      bundle_version: fixture.bundle_version,
      status: fixture.status,
      records: fixture.expected_bundle.records.length,
      bundle_fingerprint: fixture.expected_bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeContract() {
  for (const requiredText of [
    "export type ResearchCandidateReviewMemoryContractVersion",
    "export type ResearchCandidateReviewMemoryScope",
    "export type ResearchCandidateReviewMemoryStatus",
    "export type ResearchCandidateReviewMemoryRecordKind",
    "export type ResearchCandidateReviewMemoryLifecycleState",
    "export type ResearchCandidateReviewMemoryReviewDecision",
    "export type ResearchCandidateReviewMemorySourceSurface",
    "export type ResearchCandidateReviewMemoryPrivacyClass",
    "export type ResearchCandidateReviewMemoryReasonCode",
    "export interface ResearchCandidateReviewMemoryAuthorityBoundary",
    "export interface ResearchCandidateReviewMemorySourceRef",
    "export interface ResearchCandidateReviewMemoryPrivacyReport",
    "export interface ResearchCandidateReviewMemoryRecord",
    "export interface ResearchCandidateReviewMemoryContractBundle",
    "export interface ResearchCandidateReviewMemoryValidationResult",
    contractVersion,
    recordVersion,
    bundleVersion,
    status,
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertBundle(bundle) {
  assert.equal(bundle.bundle_version, bundleVersion);
  assert.equal(bundle.contract_version, contractVersion);
  assert.equal(bundle.scope, "project:augnes");
  assert.equal(bundle.status, status);
  assert.ok(Array.isArray(bundle.records), "records must be an array");
  assert.ok(bundle.records.length > 0, "expected_bundle.records must be non-empty");
  assertAuthorityBoundary(bundle.authority_boundary, "bundle");
  assertCountMap(bundle.record_kind_counts, bundle.records, "record_kind", recordKinds);
  assertCountMap(
    bundle.lifecycle_state_counts,
    bundle.records,
    "lifecycle_state",
    lifecycleStates,
  );
  assertCountMap(
    bundle.review_decision_counts,
    bundle.records,
    "review_decision",
    reviewDecisions,
  );
  assertCountMap(
    bundle.privacy_class_counts,
    bundle.records.map((record) => record.privacy_report),
    "privacy_class",
    privacyClasses,
  );

  const seenRecordIds = new Set();
  for (const record of bundle.records) {
    assert.equal(record.record_version, recordVersion);
    assert.equal(record.scope, "project:augnes");
    assert.equal(record.status, status);
    assert.ok(record.record_id, "record_id must be present");
    assert.ok(!seenRecordIds.has(record.record_id), `${record.record_id} must be unique`);
    seenRecordIds.add(record.record_id);
    assert.ok(recordKinds.has(record.record_kind), `${record.record_id} kind controlled`);
    assert.ok(
      lifecycleStates.has(record.lifecycle_state),
      `${record.record_id} lifecycle controlled`,
    );
    assert.ok(record.candidate_ref, `${record.record_id} candidate_ref must be present`);
    assert.ok(Array.isArray(record.source_refs), `${record.record_id} source_refs`);
    assert.ok(
      Array.isArray(record.related_record_refs),
      `${record.record_id} related_record_refs`,
    );
    assert.ok(
      reviewDecisions.has(record.review_decision),
      `${record.record_id} review decision controlled`,
    );
    assert.ok(record.bounded_summary, `${record.record_id} bounded_summary present`);
    assert.ok(record.created_at, `${record.record_id} created_at present`);
    assert.ok(record.updated_at, `${record.record_id} updated_at present`);
    assertPrivacyReport(record.privacy_report, record.record_id);
    assertAuthorityBoundary(record.authority_boundary, record.record_id);

    for (const sourceRef of record.source_refs) {
      assert.ok(
        sourceSurfaces.has(sourceRef.source_surface),
        `${record.record_id} source surface ${sourceRef.source_surface} controlled`,
      );
      assert.ok(sourceRef.source_ref, `${record.record_id} source_ref present`);
      assert.equal(typeof sourceRef.public_safe, "boolean");
    }
    for (const reasonCode of record.reason_codes) {
      assert.ok(
        reasonCodes.has(reasonCode),
        `${record.record_id} reason ${reasonCode} controlled`,
      );
    }
    if (record.source_refs.length === 0) {
      assert.ok(
        record.reason_codes.includes("source_ref_missing"),
        `${record.record_id} empty source_refs require source_ref_missing`,
      );
    } else {
      assert.ok(
        record.reason_codes.includes("source_ref_present"),
        `${record.record_id} source_refs require source_ref_present`,
      );
    }
    assert.doesNotMatch(record.bounded_summary, forbiddenSummaryPattern);
    if (record.operator_note_summary) {
      assert.doesNotMatch(record.operator_note_summary, forbiddenSummaryPattern);
    }
  }
}

function assertFixtureCoverage(bundle) {
  assertIncludesAll(
    new Set(bundle.records.map((record) => record.record_kind)),
    [
      "candidate_review_snapshot",
      "operator_review_note",
      "discard_record",
      "feedback_summary",
      "handoff_summary",
      "diagnostic_summary",
      "profile_summary",
    ],
  );
  assertIncludesAll(
    new Set(bundle.records.map((record) => record.lifecycle_state)),
    ["draft", "active", "discarded", "superseded", "archived"],
  );
  assertIncludesAll(
    new Set(bundle.records.map((record) => record.review_decision)),
    [
      "none",
      "keep_for_review",
      "discard",
      "supersede",
      "needs_more_evidence",
      "needs_operator_review",
    ],
  );
  assertIncludesAll(
    new Set(bundle.records.map((record) => record.privacy_report.privacy_class)),
    ["public_safe", "private_ref_only", "blocked_raw_private_payload"],
  );
  assertIncludesAll(
    new Set(
      bundle.records.flatMap((record) =>
        record.source_refs.map((sourceRef) => sourceRef.source_surface),
      ),
    ),
    [
      "research_candidate_lifecycle_read_model",
      "research_candidate_calibration_diagnostic",
      "logical_claim_shape_preview",
      "feedback_to_rule_candidate",
      "temporal_handoff_diagnostic_sections",
      "target_agent_ai_context_packet_profiles",
      "operator_note",
      "manual_source_ref",
    ],
  );
  assertIncludesAll(
    new Set(bundle.records.flatMap((record) => record.reason_codes)),
    [
      "candidate_ref_present",
      "source_ref_present",
      "source_ref_missing",
      "operator_review_required",
      "discard_is_not_deletion",
      "supersede_preserves_lineage",
      "privacy_boundary_preserved",
      "raw_payload_blocked",
      "contract_only_not_runtime_memory",
      "candidate_memory_not_truth",
      "review_memory_not_promotion",
      "product_write_denied",
    ],
  );
  assert.ok(
    bundle.records.some((record) => record.lifecycle_state === "discarded"),
    "at least one record must be discarded",
  );
  assert.ok(
    bundle.records.some(
      (record) => record.lifecycle_state === "superseded" && record.supersedes_record_ref,
    ),
    "at least one superseded record must preserve supersedes_record_ref",
  );
  assert.ok(
    bundle.records.some(
      (record) =>
        record.privacy_report.privacy_class === "blocked_raw_private_payload" &&
        record.privacy_report.public_safe === false,
    ),
    "at least one blocked_raw_private_payload record must exist",
  );
  assert.ok(
    bundle.records.some(
      (record) =>
        record.privacy_report.privacy_class === "private_ref_only" &&
        record.privacy_report.public_safe === false,
    ),
    "at least one private_ref_only record must be non-public-safe",
  );
  assert.ok(
    bundle.records.some((record) => record.source_refs.length > 0),
    "at least one record must have source refs",
  );
  assert.ok(
    bundle.records.some(
      (record) =>
        record.source_refs.length === 0 && record.reason_codes.includes("source_ref_missing"),
    ),
    "at least one record must intentionally have no source refs",
  );
  assert.ok(
    bundle.records.some((record) => record.operator_note_summary),
    "at least one record must have operator_note_summary",
  );
  assert.ok(
    bundle.records.some((record) => record.discard_reason),
    "at least one record must have discard_reason",
  );
  assert.ok(
    bundle.records.some((record) => record.related_record_refs.length > 0),
    "at least one record must have related_record_refs",
  );
  for (const record of bundle.records.filter(
    (candidate) => candidate.lifecycle_state === "discarded",
  )) {
    assert.ok(record.discard_reason, `${record.record_id} discarded record needs reason`);
  }
  for (const record of bundle.records.filter(
    (candidate) => candidate.lifecycle_state === "superseded",
  )) {
    assert.ok(
      record.supersedes_record_ref,
      `${record.record_id} superseded record needs supersedes_record_ref`,
    );
  }
}

function assertPrivacyReport(privacyReport, label) {
  assert.ok(
    privacyClasses.has(privacyReport.privacy_class),
    `${label} privacy class controlled`,
  );
  assert.equal(typeof privacyReport.public_safe, "boolean");
  for (const field of [
    "raw_conversation_included",
    "hidden_reasoning_included",
    "raw_source_body_included",
    "raw_candidate_payload_included",
    "raw_provider_output_included",
    "provider_thread_run_session_ids_included",
    "private_urls_included",
    "local_private_paths_included",
    "secrets_included",
    "raw_db_rows_included",
    "raw_browser_dump_included",
  ]) {
    assert.equal(privacyReport[field], false, `${label} ${field} false`);
  }
  assert.ok(
    Array.isArray(privacyReport.blocked_reason_codes),
    `${label} blocked_reason_codes array`,
  );
  if (privacyReport.privacy_class === "blocked_raw_private_payload") {
    assert.equal(privacyReport.public_safe, false, `${label} blocked payload public false`);
    assert.ok(
      privacyReport.blocked_reason_codes.length > 0,
      `${label} blocked payload must have blocked reason codes`,
    );
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.contract_only, true, `${label} contract_only true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertCountMap(countMap, records, field, controlledValues) {
  for (const key of Object.keys(countMap ?? {})) {
    assert.ok(controlledValues.has(key), `${field} count ${key} controlled`);
  }
  for (const value of controlledValues) {
    const expected = records.filter((record) => record[field] === value).length;
    assert.equal(countMap[value] ?? 0, expected, `${field} count for ${value}`);
  }
}

function assertFingerprint(bundle) {
  assert.ok(bundle.bundle_fingerprint, "bundle_fingerprint must be non-empty");
  assert.equal(bundle.bundle_fingerprint, createBundleFingerprint(bundle));
}

function createBundleFingerprint(bundle) {
  const { bundle_fingerprint: _fingerprint, ...hashInput } = bundle;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Research Candidate Review Memory Contract is contract-only.",
    "It begins Phase 2 from the integrated development roadmap guide v0.2.",
    "It does not implement runtime memory storage.",
    "It does not query or write DB.",
    "It does not create routes.",
    "It does not create UI.",
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
    "Blocked raw payloads must not be stored.",
    "Source refs are lineage pointers, not proof.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(!source.includes(`${field}: true`), `doc must not grant ${field}`);
  }
}

function assertIndexBoundary() {
  const block = extractIndexBlock(indexDoc, "Research Candidate Review Memory Contract v0.1");
  for (const requiredText of [
    docPath,
    typePath,
    fixturePath,
    "scripts/smoke-research-candidate-review-memory-contract-v0-1.mjs",
    "begins Phase 2",
    "integrated roadmap guide v0.2",
    "contract-only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "adds no runtime route",
    "UI",
    "DB query",
    "write",
    "provider/OpenAI call",
    "source fetch",
    "retrieval/RAG execution",
    "proof/evidence",
    "promotion",
    "Codex execution",
    "GitHub automation",
    "Git Ledger",
    "product write",
    "product ID allocation",
    "does not implement runtime memory storage",
  ]) {
    assert.ok(
      block.includes(requiredBoundaryText),
      `index block must include ${requiredBoundaryText}`,
    );
  }
  for (const forbiddenPattern of [
    /runtime DB write was added/i,
    /route was added/i,
    /UI was added/i,
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

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function assertIncludesAll(actualSet, expectedValues) {
  for (const expectedValue of expectedValues) {
    assert.ok(actualSet.has(expectedValue), `expected coverage for ${expectedValue}`);
  }
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
