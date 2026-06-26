#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const gitLedgerDocsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_V0_1.md";
const docsPath = "docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md";
const helperPath = "lib/product-write/product-write-reentry-review.ts";
const fixturePath = "fixtures/product-write-reentry-review.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const reviewVersion = "product_write_reentry_review.v0.1";
const inputVersion = "product_write_reentry_input.v0.1";
const resultVersion = "product_write_reentry_result.v0.1";
const gateVersion = "product_write_reentry_gate.v0.1";
const prerequisiteVersion = "product_write_reentry_prerequisite.v0.1";
const fixtureVersion = "product_write_reentry_review.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:product-write-reentry-review-v0-1";
const packageScriptValue =
  "node scripts/smoke-product-write-reentry-review-v0-1.mjs";

const gateDecisions = [
  "blocked",
  "remains_parked",
  "needs_explicit_reentry_approval",
  "eligible_for_future_reentry_review",
  "rejected",
];

const prerequisiteKinds = [
  "runtime_audit_complete",
  "git_ledger_contract_present",
  "release_readiness_matrix_present",
  "disabled_adapter_harness_present",
  "product_write_target_contract_present",
  "operator_approval_present",
  "privacy_boundary_reviewed",
  "rollback_plan_present",
  "idempotency_plan_present",
  "failure_mode_reviewed",
  "proof_boundary_reviewed",
  "evidence_boundary_reviewed",
  "state_mutation_boundary_reviewed",
  "external_side_effect_boundary_reviewed",
  "unknown",
];

const authorityFalseFields = [
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_write_target_contract_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "product_route_now",
  "product_ui_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "browser_log_ingestion_now",
  "session_log_ingestion_now",
  "raw_conversation_ingestion_now",
  "telemetry_ingestion_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "repository_file_write_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "review_context_is_authority",
  "runtime_audit_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const exactDocsPhrases = [
  "Product-write remains parked by #686.",
  "Product Write Reentry Review is review-only.",
  "This PR does not re-enable product-write.",
  "This PR does not implement product-write runtime.",
  "This PR does not enable product-write adapter.",
  "This PR does not allocate product IDs.",
  "This PR does not persist products.",
  "This PR does not write DB.",
  "This PR does not call routes.",
  "This PR does not add UI.",
  "This PR does not mutate durable Perspective state.",
  "This PR does not write Formation Receipts.",
  "This PR does not promote Perspective.",
  "This PR does not create proof/evidence.",
  "This PR does not write claim/evidence records.",
  "This PR does not execute Git Ledger export.",
  "This PR does not call GitHub.",
  "This PR does not call providers.",
  "This PR does not execute retrieval or RAG.",
  "Product-write authority is not granted by review context.",
  "Runtime audit is review context, not authority.",
  "Git Ledger packets are review/export candidates, not commits.",
  "Smoke/CI pass is not truth.",
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
  "raw product-write payload",
  "raw audit payload",
  "raw ledger payload",
  "raw conversation",
  "hidden reasoning",
  "telemetry dump",
  "browser dump",
  "raw browser dump",
  "raw DB row",
  "raw_db_row",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = [
  "raw product-write payload blocked by fixture",
  "raw conversation blocked by product-write reentry fixture",
  "hidden reasoning blocked by product-write reentry fixture",
  "telemetry dump blocked by product-write reentry fixture",
  "secret-like product-write reentry input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = authorityFalseFields
  .map((field) => `${field}: true`)
  .concat([
    "product_write_now: true",
    "product_write_runtime_now: true",
    "product_write_adapter_enabled_now: true",
    "product_write_target_contract_now: true",
    "product_id_allocation_now: true",
    "product_persistence_now: true",
    "product_route_now: true",
    "product_ui_now: true",
    "git_ledger_export_runtime_now: true",
    "git_write_now: true",
    "github_api_call_now: true",
    "pull_request_creation_now: true",
    "repository_file_write_now: true",
  ]);

const roadmap = read(roadmapPath);
const gitLedgerDocs = read(gitLedgerDocsPath);
const runtimeAuditDocs = read(runtimeAuditDocsPath);
const docs = read(docsPath);
const helperSource = read(helperPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);

assert.ok(
  roadmap.includes("product_write_reentry_review_v0_1"),
  "roadmap must contain product_write_reentry_review_v0_1",
);
assert.ok(
  gitLedgerDocs.includes("Git Ledger Export Contract is contract-only."),
  "Git Ledger docs must exist and preserve contract-only wording",
);
assert.ok(
  runtimeAuditDocs.includes("Runtime Audit Panel is read-only."),
  "Runtime Audit docs must preserve read-only wording",
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.review_version, reviewVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.gate_version, gateVersion);
assert.equal(fixture.prerequisite_version, prerequisiteVersion);
assert.equal(fixture.scope, scope);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the product-write reentry smoke",
);

for (const path of [
  docsPath,
  helperPath,
  fixturePath,
  "scripts/smoke-product-write-reentry-review-v0-1.mjs",
]) {
  assert.ok(index.includes(path), `docs/00_INDEX_LATEST.md must point to ${path}`);
}
assert.ok(index.includes("review-only"), "index must mention review-only");
assert.ok(
  index.includes("Product-write remains parked by #686"),
  "index must mention Product-write remains parked by #686",
);
assert.ok(
  index.includes("product-write authority is not granted"),
  "index must mention product-write authority is not granted",
);

for (const phrase of exactDocsPhrases) {
  assert.ok(docs.includes(phrase), `docs must include exact phrase: ${phrase}`);
}

for (const value of [...gateDecisions, ...prerequisiteKinds]) {
  assert.ok(helperSource.includes(`"${value}"`), `helper type unions must include ${value}`);
}

assert.ok(
  helperSource.includes("collectUnsafeObjectFailures"),
  "helper must recursively scan unknown fields for unsafe markers",
);
assert.ok(
  helperSource.includes("includesTokenLikeMarker"),
  "helper must keep token-like marker detection",
);
assert.ok(
  helperSource.includes("tokenLikePatterns"),
  "helper must use token-like marker patterns",
);

assertNoForbiddenPositiveAuthority(docs, "docs");
assertNoForbiddenPositiveAuthority(index, "index");
assertNoForbiddenPositiveAuthority(helperSource, "helper");
assertFixturePrivacy();
assertNoForbiddenHelperImports();

const helper = await importProductWriteHelper();

assert.deepEqual(
  helper.buildProductWriteReentryReviewV01(fixture.expected_valid_input),
  fixture.expected_result,
  "valid review output must match expected_result",
);
assert.equal(fixture.expected_result.status, "reviewed");
assert.equal(fixture.expected_result.gate.gate_decision, "blocked");
assertReviewResultBoundary(fixture.expected_result);

const repeated = helper.buildProductWriteReentryReviewV01(fixture.expected_valid_input);
assert.equal(
  repeated.review_fingerprint,
  fixture.expected_result.review_fingerprint,
  "repeated build must produce the same review_fingerprint",
);

const resultWithoutFingerprint = { ...fixture.expected_result };
delete resultWithoutFingerprint.review_fingerprint;
assert.equal(
  helper.createProductWriteReentryFingerprintV01(resultWithoutFingerprint),
  fixture.expected_result.review_fingerprint,
  "review_fingerprint must be canonical over result without review_fingerprint",
);

assert.deepEqual(
  helper.buildProductWriteReentryReviewV01(fixture.expected_empty_input),
  fixture.expected_empty_result,
  "empty input output must match expected_empty_result",
);
assert.equal(fixture.expected_empty_result.status, "empty");
assert.equal(fixture.expected_empty_result.gate, null);
assertReviewResultBoundary(fixture.expected_empty_result);

const coveredGateDecisions = new Set();
for (const [name, input] of Object.entries(fixture.decision_coverage_inputs)) {
  const actual = helper.buildProductWriteReentryReviewV01(input);
  assert.deepEqual(
    actual,
    fixture.expected_decision_results[name],
    `decision coverage output must match for ${name}`,
  );
  if (actual.gate) coveredGateDecisions.add(actual.gate.gate_decision);
  assertReviewResultBoundary(actual);
}
for (const gateDecision of gateDecisions) {
  assert.ok(coveredGateDecisions.has(gateDecision), `gate decision covered: ${gateDecision}`);
}

const allPrerequisites = [
  ...fixture.expected_valid_input.requested_prerequisites,
  ...Object.values(fixture.decision_coverage_inputs).flatMap(
    (input) => input.requested_prerequisites,
  ),
];
const coveredPrerequisiteKinds = new Set(
  allPrerequisites.map((prerequisite) => prerequisite.prerequisite_kind),
);
for (const kind of prerequisiteKinds) {
  assert.ok(coveredPrerequisiteKinds.has(kind), `prerequisite kind covered: ${kind}`);
}

assert.ok(
  fixture.expected_result.missing_prerequisite_refs.length > 0,
  "valid fixture must include missing prerequisite coverage",
);
assert.ok(
  fixture.expected_result.blocking_prerequisite_refs.length > 0,
  "valid fixture must include blocking prerequisite coverage",
);
assert.ok(
  ["blocked", "needs_explicit_reentry_approval"].includes(
    fixture.expected_result.gate.gate_decision,
  ),
  "missing/blocking prerequisites must keep gate blocked or requiring approval",
);

const allSatisfiedResult =
  fixture.expected_decision_results.eligible_for_future_reentry_review;
assert.equal(allSatisfiedResult.gate.gate_decision, "eligible_for_future_reentry_review");
assert.equal(allSatisfiedResult.product_write_authority_granted, false);
assert.equal(allSatisfiedResult.gate.product_write_authority_granted, false);
assert.equal(allSatisfiedResult.authority_boundary.product_write_authority, false);

for (const [name, input] of Object.entries(fixture.invalid_inputs)) {
  const actual = helper.buildProductWriteReentryReviewV01(input);
  assert.deepEqual(
    actual,
    fixture.expected_rejection_results[name],
    `rejection output must match for ${name}`,
  );
  assert.equal(actual.gate, null, `${name} must not produce a gate`);
  assert.deepEqual(actual.prerequisites, [], `${name} must not echo prerequisites`);
  assertReviewResultBoundary(actual);
  assertBlockedOutputDoesNotEchoUnsafeValues(input, actual, name);
}
assert.equal(
  fixture.expected_rejection_results.private_raw_payload.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.raw_conversation.status,
  "blocked_private_or_raw_payload",
);
assert.ok(
  fixture.expected_rejection_results.raw_conversation.reason_codes.includes(
    "raw_conversation_blocked",
  ),
);
assert.ok(
  fixture.expected_rejection_results.hidden_reasoning.reason_codes.includes(
    "hidden_reasoning_blocked",
  ),
);
assert.ok(
  fixture.expected_rejection_results.telemetry_dump.reason_codes.includes(
    "telemetry_dump_blocked",
  ),
);
assert.equal(
  fixture.expected_rejection_results.public_unsafe_field.status,
  "blocked_invalid_input",
);
assert.equal(
  fixture.expected_rejection_results.forbidden_authority.status,
  "blocked_invalid_input",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "product-write-reentry-review-v0-1",
      verified: {
        valid_result: fixture.expected_result.review_fingerprint,
        empty_result: fixture.expected_empty_result.review_fingerprint,
        gate_decisions: [...coveredGateDecisions].sort(),
        prerequisite_kinds: [...coveredPrerequisiteKinds].sort(),
      },
    },
    null,
    2,
  ),
);

function read(path) {
  return readFileSync(path, "utf8");
}

async function importProductWriteHelper() {
  const transformedSource = stripTypeScriptTypes(helperSource, { mode: "transform" });
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`);
}

function assertReviewResultBoundary(result) {
  assert.equal(result.product_write_executed, false, "result must not execute product-write");
  assert.equal(result.product_id_allocated, false, "result must not allocate product IDs");
  assert.equal(
    result.product_write_authority_granted,
    false,
    "result must not grant product-write authority",
  );
  assertAuthorityBoundary(result.authority_boundary, "result.authority_boundary");
  for (const prerequisite of result.prerequisites) {
    assertAuthorityBoundary(
      prerequisite.authority_boundary,
      `prerequisite ${prerequisite.prerequisite_id}`,
    );
  }
  if (result.gate) {
    assert.equal(result.gate.product_write_executed, false);
    assert.equal(result.gate.product_id_allocated, false);
    assert.equal(result.gate.product_write_authority_granted, false);
    assertAuthorityBoundary(result.gate.authority_boundary, "gate.authority_boundary");
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.product_write_reentry_review_now, true, `${label} must be review now`);
  assert.equal(boundary.review_only, true, `${label} must be review-only`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertNoForbiddenPositiveAuthority(source, label) {
  for (const marker of new Set(forbiddenPositiveAuthorityGrants)) {
    assert.ok(!source.includes(marker), `${label} must not contain ${marker}`);
  }
}

function assertNoForbiddenHelperImports() {
  const forbiddenImports = [
    /from\\s+["']node:fs["']/,
    /from\\s+["']fs["']/,
    /from\\s+["']node:child_process["']/,
    /from\\s+["']child_process["']/,
    /from\\s+["'][^"']*route[^"']*["']/,
    /from\\s+["'][^"']*adapter[^"']*["']/,
  ];
  for (const pattern of forbiddenImports) {
    assert.ok(!pattern.test(helperSource), `helper must not import ${pattern}`);
  }
  for (const marker of [
    "Database",
    "NextResponse",
    "OpenAI",
    "fetch(",
    "git commit",
    "git_ledger_export_runtime_now: true",
  ]) {
    assert.ok(!helperSource.includes(marker), `helper must not contain ${marker}`);
  }
}

function assertFixturePrivacy() {
  let fixtureText = JSON.stringify(fixture, null, 2);
  for (const placeholder of allowedFixturePlaceholders) {
    fixtureText = fixtureText.split(placeholder).join("");
  }
  const normalized = fixtureText.toLowerCase();
  for (const marker of fixtureForbiddenMarkers) {
    assert.ok(
      !normalized.includes(marker.toLowerCase()),
      `fixture must not contain forbidden marker outside allowed placeholders: ${marker}`,
    );
  }
}

function assertBlockedOutputDoesNotEchoUnsafeValues(input, output, name) {
  const unsafeValues = collectUnsafeFixtureStrings(input);
  const outputText = JSON.stringify(output);
  for (const unsafeValue of unsafeValues) {
    assert.ok(
      !outputText.includes(unsafeValue),
      `${name} blocked output must not echo unsafe value ${unsafeValue}`,
    );
  }
}

function collectUnsafeFixtureStrings(value) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (
      fixtureForbiddenMarkers.some((marker) =>
        normalized.includes(marker.toLowerCase()),
      )
    ) {
      return [value];
    }
    return [];
  }
  if (Array.isArray(value)) return value.flatMap(collectUnsafeFixtureStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectUnsafeFixtureStrings);
  }
  return [];
}
