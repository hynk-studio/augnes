#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const surfacingDocsPath = "docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_V0_1.md";
const docsPath = "docs/DOGFOODING_RECORD_RUNTIME_CONTRACT_V0_1.md";
const typePath = "types/dogfooding-record-runtime-contract.ts";
const fixturePath = "fixtures/dogfooding-record-runtime-contract.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const contractVersion = "dogfooding_record_runtime_contract.v0.1";
const recordVersion = "dogfooding_record.v0.1";
const signalVersion = "dogfooding_signal.v0.1";
const reviewCueVersion = "dogfooding_review_cue.v0.1";
const bundleVersion = "dogfooding_record_bundle.v0.1";
const fixtureVersion = "dogfooding_record_runtime_contract.sample.v0.1";
const scope = "project:augnes";
const status = "contract_only";
const roadmapRef = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const packageScriptName = "smoke:dogfooding-record-runtime-contract-v0-1";
const packageScriptValue = "node scripts/smoke-dogfooding-record-runtime-contract-v0-1.mjs";

const signalKinds = [
  "usability_friction",
  "missing_context",
  "wrong_surfacing",
  "confusing_label",
  "broken_flow",
  "stale_context",
  "source_gap",
  "overreach",
  "latency_observation",
  "trust_boundary_confusion",
  "product_write_request",
  "unknown",
];

const surfaces = [
  "cockpit",
  "research_candidate_review",
  "constellation_runtime_ui",
  "feedback_controls",
  "surfacing_preview",
  "manual_anchor_store",
  "promotion_decision",
  "formation_receipt",
  "durable_state",
  "trajectory",
  "codex_handoff",
  "unknown",
];

const severities = ["low", "medium", "high", "critical", "unknown"];

const reviewCueKinds = [
  "review_needed",
  "evidence_needed",
  "boundary_confusion",
  "stale_context_review",
  "source_gap_review",
  "surfacing_review",
  "usability_review",
  "product_write_reentry_request",
  "unknown",
];

const recordStatuses = [
  "contract_only",
  "candidate_only",
  "ready_for_future_ingestion",
  "blocked_private_or_raw_payload",
  "blocked_missing_surface",
  "blocked_missing_signal",
  "blocked_forbidden_authority",
  "rejected",
];

const privacyClasses = [
  "public_safe_summary",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
];

const redactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_raw_payload",
  "blocked_secret_like_pattern",
  "blocked_private_location",
];

const reasonCodes = [
  "roadmap_file_present",
  "dogfooding_record_contract_present",
  "dogfooding_signal_present",
  "dogfooding_signal_missing",
  "dogfooding_surface_present",
  "dogfooding_surface_missing",
  "bounded_summary_present",
  "bounded_summary_missing",
  "operator_actor_ref_present",
  "operator_actor_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "feedback_ref_present",
  "surfacing_preview_ref_present",
  "manual_anchor_ref_present",
  "promotion_decision_ref_present",
  "formation_receipt_ref_present",
  "durable_state_ref_present",
  "trajectory_ref_present",
  "review_cue_present",
  "review_cue_missing",
  "product_write_request_recorded_as_review_cue_only",
  "product_write_not_executed",
  "dogfooding_record_is_not_truth",
  "dogfooding_record_is_not_proof",
  "dogfooding_record_is_not_promotion_readiness",
  "dogfooding_record_is_not_raw_conversation",
  "dogfooding_record_is_not_hidden_reasoning",
  "dogfooding_record_is_not_telemetry_dump",
  "dogfooding_record_is_bounded_summary_only",
  "ingestion_runtime_not_implemented",
  "dogfooding_write_not_implemented",
  "dogfooding_route_not_implemented",
  "db_write_not_executed",
  "candidate_not_mutated",
  "durable_state_not_mutated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "git_ledger_export_not_executed",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
];

const authorityFalseFields = [
  "dogfooding_ingestion_runtime_now",
  "dogfooding_write_route_now",
  "dogfooding_read_route_now",
  "dogfooding_record_write_now",
  "db_query_or_write_now",
  "browser_log_ingestion_now",
  "session_log_ingestion_now",
  "raw_conversation_ingestion_now",
  "telemetry_ingestion_now",
  "external_analytics_ingestion_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "candidate_mutation_now",
  "rule_mutation_now",
  "parser_mutation_now",
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
  "dogfooding_record_is_truth",
  "dogfooding_record_is_proof",
  "dogfooding_record_is_promotion_readiness",
  "dogfooding_record_is_raw_conversation",
  "dogfooding_record_is_hidden_reasoning",
  "dogfooding_record_is_telemetry_dump",
  "product_write_authority",
];

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Dogfooding Record Runtime Contract is contract-only.",
  "Dogfooding records are bounded review records.",
  "Dogfooding records are not raw conversation logs.",
  "Dogfooding records are not hidden reasoning.",
  "Dogfooding records are not telemetry dumps.",
  "Dogfooding records are not truth.",
  "Dogfooding records are not proof.",
  "Dogfooding records are not promotion readiness.",
  "Dogfooding records do not mutate candidates.",
  "Dogfooding records do not mutate durable Perspective state.",
  "Dogfooding records do not write Formation Receipts.",
  "Dogfooding records do not promote Perspective.",
  "Dogfooding records do not create proof/evidence.",
  "Dogfooding records do not write claim/evidence records.",
  "Dogfooding records do not product-write.",
  "Product-write requests are review cues only.",
  "Product-write requests do not execute product-write.",
  "This PR does not implement dogfooding ingestion runtime.",
  "This PR does not add dogfooding write route.",
  "This PR does not add dogfooding read route.",
  "This PR does not write DB.",
  "This PR does not read browser logs.",
  "This PR does not read session logs.",
  "This PR does not ingest raw conversations.",
  "This PR does not ingest telemetry.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
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
  "telemetry dump",
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
  "raw dogfooding payload blocked by contract fixture",
  "secret-like dogfooding input blocked by contract fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "dogfooding_ingestion_runtime_now: true",
  "dogfooding_write_route_now: true",
  "dogfooding_read_route_now: true",
  "dogfooding_record_write_now: true",
  "db_query_or_write_now: true",
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
  "dogfooding ingestion runtime was added",
  "dogfooding route was added",
  "DB write was added",
  "browser log ingestion was added",
  "session log ingestion was added",
  "raw conversation ingestion was added",
  "telemetry ingestion was added",
  "state mutation was added",
  "proof/evidence writes were added",
  "product-write was added",
  "Git Ledger export was added",
  "provider calls were added",
  "retrieval/RAG was added",
  "source fetch was added",
];

for (const filePath of [
  roadmapPath,
  surfacingDocsPath,
  docsPath,
  typePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const surfacingDocsText = readText(surfacingDocsPath);
const docsText = readText(docsPath);
const typeText = readText(typePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);

assertIncludes(
  roadmapText,
  "dogfooding_record_runtime_contract_v0_1",
  "roadmap contains Phase 6.1 slice",
);
assertIncludes(
  surfacingDocsText,
  "Feedback Influenced Surfacing Preview is preview-only.",
  surfacingDocsPath,
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.signal_version, signalVersion);
assert.equal(fixture.review_cue_version, reviewCueVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, status);
assert.equal(fixture.roadmap_ref, roadmapRef);
assert.equal(fixture.expected_bundle.status, status);
assert.ok(fixture.expected_bundle.records.length > 0, "expected_bundle.records must be non-empty");
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertTypeCoverage();
assertFixtureCoverage();
assertAuthorityBoundaries();
assertProductWriteCue();
assertFingerprints();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "dogfooding-record-runtime-contract-v0-1",
      contract_version: contractVersion,
      records: fixture.expected_bundle.records.length,
      signals: fixture.expected_bundle.records.reduce(
        (total, record) => total + record.signals.length,
        0,
      ),
      review_cues: fixture.expected_bundle.records.reduce(
        (total, record) => total + record.review_cues.length,
        0,
      ),
    },
    null,
    2,
  ),
);

function assertTypeCoverage() {
  for (const text of [
    "DogfoodingRecordRuntimeContractVersion",
    "DogfoodingRecordVersion",
    "DogfoodingSignalVersion",
    "DogfoodingReviewCueVersion",
    "DogfoodingRecordBundleVersion",
    "DogfoodingRecordRuntimeScope",
    "DogfoodingRecordRuntimeStatus",
    "export interface DogfoodingSignal",
    "export interface DogfoodingReviewCue",
    "export interface DogfoodingRecord",
    "export interface DogfoodingRecordBundle",
    "export interface DogfoodingRecordValidationResult",
  ]) {
    assertIncludes(typeText, text, `type export ${text}`);
  }
  for (const value of [
    ...signalKinds,
    ...surfaces,
    ...severities,
    ...reviewCueKinds,
    ...recordStatuses,
    ...privacyClasses,
    ...redactionStatuses,
    ...reasonCodes,
  ]) {
    assertIncludes(typeText, `"${value}"`, `type union coverage ${value}`);
  }
}

function assertFixtureCoverage() {
  assertDeepSetEqual(fixture.coverage.signal_kinds, signalKinds, "coverage.signal_kinds");
  assertDeepSetEqual(fixture.coverage.surfaces, surfaces, "coverage.surfaces");
  assertDeepSetEqual(fixture.coverage.severities, severities, "coverage.severities");
  assertDeepSetEqual(
    fixture.coverage.review_cue_kinds,
    reviewCueKinds,
    "coverage.review_cue_kinds",
  );
  assertDeepSetEqual(
    fixture.coverage.record_statuses,
    recordStatuses,
    "coverage.record_statuses",
  );
  assertDeepSetEqual(
    fixture.coverage.privacy_classes,
    privacyClasses,
    "coverage.privacy_classes",
  );
  assertDeepSetEqual(
    fixture.coverage.redaction_statuses,
    redactionStatuses,
    "coverage.redaction_statuses",
  );
  assertDeepSetEqual(fixture.coverage.reason_codes, reasonCodes, "coverage.reason_codes");

  const records = fixture.expected_bundle.records;
  assertDeepSetEqual(
    records.flatMap((record) => record.signals.map((signal) => signal.signal_kind)),
    signalKinds,
    "records signal kind coverage",
  );
  assertDeepSetEqual(
    records.flatMap((record) => record.signals.map((signal) => signal.surface)),
    surfaces,
    "records surface coverage",
  );
  assertDeepSetEqual(
    [
      ...records.flatMap((record) => record.signals.map((signal) => signal.severity)),
      ...records.flatMap((record) => record.review_cues.map((cue) => cue.severity)),
    ],
    severities,
    "records severity coverage",
  );
  assertDeepSetEqual(
    records.flatMap((record) => record.review_cues.map((cue) => cue.cue_kind)),
    reviewCueKinds,
    "records review cue kind coverage",
  );
  assertDeepSetEqual(
    records.map((record) => record.status),
    recordStatuses,
    "records status coverage",
  );
  assertDeepSetEqual(
    [
      ...records.map((record) => record.privacy_class),
      ...records.flatMap((record) => record.signals.map((signal) => signal.privacy_class)),
    ],
    privacyClasses,
    "records privacy coverage",
  );
  assertDeepSetEqual(
    [
      ...records.map((record) => record.redaction_status),
      ...records.flatMap((record) => record.signals.map((signal) => signal.redaction_status)),
    ],
    redactionStatuses,
    "records redaction coverage",
  );

  for (const value of signalKinds) {
    assert.ok(
      fixture.expected_bundle.signal_kind_counts[value] > 0,
      `signal_kind_counts.${value} must be covered`,
    );
  }
  for (const value of surfaces) {
    assert.ok(
      fixture.expected_bundle.surface_counts[value] > 0,
      `surface_counts.${value} must be covered`,
    );
  }
  for (const value of severities) {
    assert.ok(
      fixture.expected_bundle.severity_counts[value] > 0,
      `severity_counts.${value} must be covered`,
    );
  }
  for (const value of reviewCueKinds) {
    assert.ok(
      fixture.expected_bundle.review_cue_kind_counts[value] > 0,
      `review_cue_kind_counts.${value} must be covered`,
    );
  }
  for (const value of privacyClasses) {
    assert.ok(
      fixture.expected_bundle.privacy_class_counts[value] > 0,
      `privacy_class_counts.${value} must be covered`,
    );
  }
  for (const value of redactionStatuses) {
    assert.ok(
      fixture.expected_bundle.redaction_status_counts[value] > 0,
      `redaction_status_counts.${value} must be covered`,
    );
  }
}

function assertAuthorityBoundaries() {
  assertAuthorityBoundary(fixture.expected_bundle.authority_boundary, "bundle.authority_boundary");
  for (const record of fixture.expected_bundle.records) {
    assertAuthorityBoundary(record.authority_boundary, `${record.record_id}.authority_boundary`);
    for (const signal of record.signals) {
      assertAuthorityBoundary(signal.authority_boundary, `${signal.signal_id}.authority_boundary`);
    }
    for (const cue of record.review_cues) {
      assertAuthorityBoundary(cue.authority_boundary, `${cue.review_cue_id}.authority_boundary`);
      assert.equal(cue.candidate_only, true, `${cue.review_cue_id}.candidate_only`);
      assert.equal(cue.product_write_executed, false, `${cue.review_cue_id}.product_write`);
    }
  }
  for (const [source, label] of [
    [docsText, docsPath],
    [indexText, indexPath],
  ]) {
    for (const forbidden of forbiddenPositiveAuthorityGrants) {
      assertNotIncludes(source, forbidden, label);
    }
  }
}

function assertProductWriteCue() {
  const cues = fixture.expected_bundle.records.flatMap((record) => record.review_cues);
  const cue = cues.find((candidate) => candidate.cue_kind === "product_write_reentry_request");
  assert.ok(cue, "product_write_reentry_request cue must exist");
  assert.equal(cue.product_write_request_only, true);
  assert.equal(cue.product_write_executed, false);
  for (const code of [
    "product_write_request_recorded_as_review_cue_only",
    "product_write_not_executed",
    "product_write_denied",
  ]) {
    assert.ok(cue.reason_codes.includes(code), `product write cue reason ${code}`);
  }
}

function assertFingerprints() {
  for (const record of fixture.expected_bundle.records) {
    const withoutFingerprint = { ...record };
    delete withoutFingerprint.record_fingerprint;
    assert.equal(
      record.record_fingerprint,
      sha256CanonicalJson(withoutFingerprint),
      `${record.record_id}.record_fingerprint`,
    );
  }
  const bundleWithoutFingerprint = { ...fixture.expected_bundle };
  delete bundleWithoutFingerprint.bundle_fingerprint;
  assert.equal(
    fixture.expected_bundle.bundle_fingerprint,
    sha256CanonicalJson(bundleWithoutFingerprint),
    "expected_bundle.bundle_fingerprint",
  );
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) {
    assertIncludes(docsText, phrase, docsPath);
  }
  for (const section of [
    "## 1. Purpose",
    "## 2. Relationship to the integrated roadmap guide v0.2.1 FULL",
    "## 3. Relationship to PR #792 through PR #794",
    "## 4. Scope and non-goals",
    "## 5. Dogfooding signal shape",
    "## 6. Review cue shape",
    "## 7. Product-write request handling",
    "## 8. Privacy and redaction rules",
    "## 9. Authority boundary",
    "## 10. Deferred work",
    "## 11. Verification expectations",
    "## 12. Next recommended slices",
  ]) {
    assertIncludes(docsText, section, docsPath);
  }
}

function assertIndexCoverage() {
  for (const path of [
    docsPath,
    typePath,
    fixturePath,
    "scripts/smoke-dogfooding-record-runtime-contract-v0-1.mjs",
  ]) {
    assertIncludes(indexText, path, indexPath);
  }
  for (const phrase of [
    "contract-only",
    "bounded review records",
    "Product-write remains parked by #686.",
  ]) {
    assertIncludes(indexText, phrase, indexPath);
  }
  for (const forbidden of indexForbiddenImplications) {
    assertNotIncludes(indexText, forbidden, indexPath);
  }
}

function assertFixturePrivacy() {
  const normalizedFixtureText = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.replaceAll(placeholder, ""),
    fixtureText,
  );
  for (const marker of fixtureForbiddenMarkers) {
    assertNotIncludes(normalizedFixtureText, marker, "fixture");
  }
  for (const placeholder of allowedFixturePlaceholders) {
    assertIncludes(fixtureText, placeholder, "fixture allowed placeholder");
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.contract_only, true, `${label}.contract_only`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertDeepSetEqual(actual, expected, label) {
  assert.deepEqual([...new Set(actual)].sort(), [...expected].sort(), label);
}

function sha256CanonicalJson(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} missing required text: ${needle}`);
}

function assertNotIncludes(haystack, needle, label) {
  assert.ok(!haystack.includes(needle), `${label} unexpectedly includes: ${needle}`);
}
