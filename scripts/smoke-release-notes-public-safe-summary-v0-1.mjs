#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const releaseCandidateDocsPath = "docs/RELEASE_CANDIDATE_OPERATOR_REVIEW_V0_1.md";
const docsPath = "docs/RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_V0_1.md";
const helperPath = "lib/release-readiness/release-notes-public-safe-summary.ts";
const fixturePath = "fixtures/release-notes-public-safe-summary.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const summaryVersion = "release_notes_public_safe_summary.v0.1";
const inputVersion = "release_notes_public_safe_input.v0.1";
const resultVersion = "release_notes_public_safe_result.v0.1";
const sectionVersion = "release_notes_public_safe_section.v0.1";
const fixtureVersion = "release_notes_public_safe_summary.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:release-notes-public-safe-summary-v0-1";
const packageScriptValue =
  "node scripts/smoke-release-notes-public-safe-summary-v0-1.mjs";

const decisions = [
  "summary_candidate_only",
  "needs_operator_review",
  "blocked",
  "rejected",
];
const sectionKinds = [
  "overview",
  "notable_changes",
  "review_context",
  "known_limitations",
  "verification_notes",
  "privacy_notes",
  "product_write_status",
  "release_boundary",
  "deferred_work",
  "unknown",
];
const statuses = [
  "built",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
];

const authorityFalseFields = [
  "release_notes_publish_now",
  "release_execution_now",
  "release_artifact_creation_now",
  "release_authority_granted_now",
  "release_candidate_approved_now",
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
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "repository_file_write_now",
  "codex_execution_authority",
  "github_automation_authority",
  "release_notes_summary_is_truth",
  "release_notes_summary_is_proof",
  "release_notes_summary_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
];

const exactDocsPhrases = [
  "Product-write remains parked by #686.",
  "Release Notes Public Safe Summary is review-only.",
  "Release Notes Public Safe Summary is candidate-only.",
  "Release Notes Public Safe Summary does not publish release notes.",
  "Release Notes Public Safe Summary does not create release artifacts.",
  "Release Notes Public Safe Summary does not execute release.",
  "Release Notes Public Safe Summary does not approve release.",
  "Release Notes Public Safe Summary does not grant release authority.",
  "Release Notes Public Safe Summary does not grant product-write authority.",
  "Product-write authority is not granted.",
  "Product-write runtime is not implemented.",
  "Product-write adapter is not enabled.",
  "Product-write target contract is not created.",
  "Product IDs are not allocated.",
  "Products are not persisted.",
  "This PR does not write DB.",
  "This PR does not add routes.",
  "This PR does not add UI.",
  "This PR does not mutate durable Perspective state.",
  "This PR does not write Formation Receipts.",
  "This PR does not promote Perspective.",
  "This PR does not create proof/evidence.",
  "This PR does not write claim/evidence records.",
  "This PR does not execute Git Ledger export.",
  "This PR does not execute Git.",
  "This PR does not call GitHub.",
  "This PR does not call providers.",
  "This PR does not execute retrieval or RAG.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Smoke/CI pass is not truth.",
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
  "raw release payload",
  "raw release notes payload",
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
  "raw release notes payload blocked by fixture",
  "raw conversation blocked by release notes fixture",
  "hidden reasoning blocked by release notes fixture",
  "telemetry dump blocked by release notes fixture",
  "secret-like release notes input blocked by fixture",
  "sk-test-token-like-000000",
  "ghp_exampleTokenLikeValue000000",
  "risk-reduction",
  "task-level",
];

const forbiddenPositiveAuthorityGrants = authorityFalseFields
  .map((field) => `${field}: true`)
  .concat(authorityFalseFields.map((field) => `"${field}": true`));

const roadmap = read(roadmapPath);
const releaseCandidateDocs = read(releaseCandidateDocsPath);
const docs = read(docsPath);
const helperSource = read(helperPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);

assert.ok(
  roadmap.includes("release_notes_public_safe_summary_v0_1"),
  "roadmap must contain release_notes_public_safe_summary_v0_1",
);
assert.ok(
  releaseCandidateDocs.includes("Release Candidate Operator Review is review-only."),
  "Release Candidate Operator Review docs must preserve review-only wording",
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.summary_version, summaryVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.section_version, sectionVersion);
assert.equal(fixture.scope, scope);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the release notes public-safe summary smoke",
);

for (const path of [
  docsPath,
  helperPath,
  fixturePath,
  "scripts/smoke-release-notes-public-safe-summary-v0-1.mjs",
]) {
  assert.ok(index.includes(path), `docs/00_INDEX_LATEST.md must point to ${path}`);
}
assert.ok(index.includes("review-only"), "index must mention review-only");
assert.ok(index.includes("candidate-only"), "index must mention candidate-only");
assert.ok(
  index.includes("Product-write remains parked by #686"),
  "index must mention Product-write remains parked by #686",
);
assert.ok(
  index.includes("release/product-write authority is not granted"),
  "index must mention release/product-write authority is not granted",
);

for (const phrase of exactDocsPhrases) {
  assert.ok(docs.includes(phrase), `docs must include exact phrase: ${phrase}`);
}

for (const value of [...decisions, ...sectionKinds, ...statuses]) {
  assert.ok(helperSource.includes(`"${value}"`), `helper unions must include ${value}`);
}
assert.ok(
  helperSource.includes("collectUnsafeObjectFailures"),
  "helper must recursively scan unknown fields",
);
assert.ok(
  helperSource.includes("collectForbiddenAuthorityObjectFailures"),
  "helper must recursively scan forbidden authority fields",
);
assert.ok(
  helperSource.includes("hasTopLevelOperatorReviewGapV01"),
  "helper must expose top-level operator review gap detection",
);
assert.ok(
  helperSource.includes('collectForbiddenAuthorityObjectFailures(input, "input")'),
  "input validator must recursively scan forbidden authority fields",
);
assert.ok(
  helperSource.includes('collectForbiddenAuthorityObjectFailures(input, "section")'),
  "section validator must recursively scan forbidden authority fields",
);
assert.ok(
  helperSource.includes("includesTokenLikeMarker"),
  "helper must use token-aware marker detection",
);
assert.ok(
  helperSource.includes("tokenLikePatterns"),
  "helper must keep token-like marker patterns",
);
assert.ok(
  helperSource.includes("buildReleaseNotesPublicSafeSummaryV01"),
  "helper must export builder",
);
assert.ok(
  helperSource.includes("validateReleaseNotesPublicSafeInputV01"),
  "helper must export input validator",
);

assertNoForbiddenPositiveAuthority(docs, "docs");
assertNoForbiddenPositiveAuthority(index, "index");
assertNoForbiddenPositiveAuthority(helperSource, "helper");
assertIndexDoesNotImplyForbiddenAuthority();
assertFixturePrivacy();
assert.ok(
  JSON.stringify(fixture.expected_valid_input).includes("risk-reduction"),
  "valid fixture must cover public-safe risk-reduction text",
);
assert.ok(
  JSON.stringify(fixture.expected_valid_input).includes("task-level"),
  "valid fixture must cover public-safe task-level text",
);
assertNoForbiddenHelperImports();

const helper = await importReleaseNotesPublicSafeHelper();

assert.deepEqual(
  helper.buildReleaseNotesPublicSafeSummaryV01(fixture.expected_valid_input),
  fixture.expected_result,
  "valid release notes summary output must match expected_result",
);
assert.equal(fixture.expected_result.status, "built");
assert.equal(fixture.expected_result.decision, "summary_candidate_only");
assertResultAuthorityClosed(fixture.expected_result);

const repeated = helper.buildReleaseNotesPublicSafeSummaryV01(
  fixture.expected_valid_input,
);
assert.equal(
  repeated.summary_fingerprint,
  fixture.expected_result.summary_fingerprint,
  "repeated build must keep the same fingerprint",
);

assert.deepEqual(
  helper.buildReleaseNotesPublicSafeSummaryV01(fixture.expected_empty_input),
  fixture.expected_empty_result,
  "empty release notes summary output must match expected_empty_result",
);
assert.equal(fixture.expected_empty_result.status, "empty");
assert.equal(fixture.expected_empty_result.decision, "blocked");
assertResultAuthorityClosed(fixture.expected_empty_result);

const observedDecisions = new Set([fixture.expected_result.decision]);
for (const [caseName, input] of Object.entries(fixture.decision_coverage_inputs)) {
  const actual = helper.buildReleaseNotesPublicSafeSummaryV01(input);
  const expected = fixture.expected_decision_results[caseName];
  assert.deepEqual(actual, expected, `${caseName} must match expected decision result`);
  observedDecisions.add(actual.decision);
  assertResultAuthorityClosed(actual);
}
for (const decision of decisions) {
  assert.ok(observedDecisions.has(decision), `fixture must cover decision ${decision}`);
}

const observedSectionKinds = new Set();
for (const input of [
  fixture.expected_valid_input,
  ...Object.values(fixture.decision_coverage_inputs),
]) {
  for (const section of input.input_sections) {
    observedSectionKinds.add(section.section_kind);
  }
}
for (const sectionKind of sectionKinds) {
  assert.ok(
    observedSectionKinds.has(sectionKind),
    `fixture must cover section kind ${sectionKind}`,
  );
}

assertDecisionCase(
  "missing_overview_section_blocked",
  "blocked",
  "release-notes-section:missing:overview",
  "overview_section_missing",
);
assertDecisionCase(
  "missing_product_write_status_section_blocked",
  "blocked",
  "release-notes-section:missing:product_write_status",
  "operator_review_required",
);
assertDecisionCase(
  "missing_release_boundary_section_blocked",
  "blocked",
  "release-notes-section:missing:release_boundary",
  "operator_review_required",
);
assertDecisionHasReason(
  "missing_release_candidate_operator_refs_needs_review",
  "needs_operator_review",
  "release_candidate_operator_ref_missing",
);
assertDecisionHasReason(
  "missing_release_candidate_operator_refs_needs_review",
  "needs_operator_review",
  "operator_review_required",
);
assertDecisionHasReason(
  "missing_release_readiness_refs_needs_review",
  "needs_operator_review",
  "release_readiness_ref_missing",
);
assertDecisionHasReason(
  "missing_release_readiness_refs_needs_review",
  "needs_operator_review",
  "operator_review_required",
);
assertDecisionHasReason(
  "missing_both_top_level_refs_needs_review",
  "needs_operator_review",
  "release_candidate_operator_ref_missing",
);
assertDecisionHasReason(
  "missing_both_top_level_refs_needs_review",
  "needs_operator_review",
  "release_readiness_ref_missing",
);
assert.equal(
  fixture.expected_decision_results.all_required_sections_and_refs_summary_candidate_only
    .decision,
  "summary_candidate_only",
);
assert.equal(
  fixture.expected_decision_results.harmless_unknown_boolean_allowed.status,
  "built",
  "harmless unknown booleans must not be blocked solely because they are unknown",
);
assert.equal(
  fixture.expected_decision_results.harmless_unknown_boolean_allowed.decision,
  "summary_candidate_only",
  "harmless unknown booleans must preserve candidate-only behavior when all refs are present",
);
assert.equal(
  fixture.expected_decision_results.needs_operator_review.decision,
  "needs_operator_review",
);
assert.equal(
  fixture.expected_decision_results.unknown_section_kind_rejected.decision,
  "rejected",
);

for (const [caseName, input] of Object.entries(fixture.invalid_inputs)) {
  const actual = helper.buildReleaseNotesPublicSafeSummaryV01(input);
  const expected = fixture.expected_rejection_results[caseName];
  assert.deepEqual(actual, expected, `${caseName} must match expected rejection result`);
  assert.equal(actual.sections.length, 0, `${caseName} must not include output sections`);
  assertResultAuthorityClosed(actual);
  assertNoUnsafeEcho(caseName, actual);
}

assert.equal(
  fixture.expected_rejection_results.private_raw_payload.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.raw_conversation.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.hidden_reasoning.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.telemetry.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.token_like_sk.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.token_like_ghp.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.expected_rejection_results.public_safe_false_section.status,
  "blocked_invalid_input",
);
assert.equal(
  fixture.expected_rejection_results.forbidden_authority.status,
  "blocked_invalid_input",
);
for (const caseName of [
  "unknown_top_level_product_write_now_true",
  "unknown_top_level_release_notes_publish_now_true",
  "unknown_top_level_release_execution_now_true",
  "unknown_section_product_write_authority_true",
  "unknown_nested_github_api_call_now_true",
]) {
  assert.equal(
    fixture.expected_rejection_results[caseName].status,
    "blocked_invalid_input",
    `${caseName} must be blocked as invalid input`,
  );
}

const publicSafeHyphenInput = structuredClone(fixture.expected_valid_input);
publicSafeHyphenInput.summary_id = "release-notes-public-safe-summary:hyphen-safe";
publicSafeHyphenInput.input_sections[0].bounded_summary =
  "Public-safe risk-reduction and task-level release note summary.";
const publicSafeHyphenResult =
  helper.buildReleaseNotesPublicSafeSummaryV01(publicSafeHyphenInput);
assert.equal(
  publicSafeHyphenResult.status,
  "built",
  "risk-reduction/task-level public-safe text must not be blocked",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "release-notes-public-safe-summary-v0-1",
      verified: {
        valid_result: fixture.expected_result.summary_fingerprint,
        empty_result: fixture.expected_empty_result.summary_fingerprint,
        decisions: [...observedDecisions].sort(),
        section_kinds: [...observedSectionKinds].sort(),
      },
    },
    null,
    2,
  ),
);

function assertDecisionCase(caseName, decision, missingRef, reasonCode) {
  const result = fixture.expected_decision_results[caseName];
  assert.equal(result.decision, decision, `${caseName} decision`);
  assert.ok(
    result.missing_section_refs.includes(missingRef),
    `${caseName} must include ${missingRef}`,
  );
  assert.ok(
    result.reason_codes.includes(reasonCode),
    `${caseName} must include ${reasonCode}`,
  );
  assertResultAuthorityClosed(result);
}

function assertDecisionHasReason(caseName, decision, reasonCode) {
  const result = fixture.expected_decision_results[caseName];
  assert.equal(result.decision, decision, `${caseName} decision`);
  assert.ok(
    result.reason_codes.includes(reasonCode),
    `${caseName} must include ${reasonCode}`,
  );
  assertResultAuthorityClosed(result);
}

function assertResultAuthorityClosed(result) {
  assert.equal(
    result.release_notes_published,
    false,
    "release_notes_published must be false",
  );
  assert.equal(result.release_executed, false, "release_executed must be false");
  assert.equal(
    result.release_artifact_created,
    false,
    "release_artifact_created must be false",
  );
  assert.equal(
    result.release_authority_granted,
    false,
    "release_authority_granted must be false",
  );
  assert.equal(
    result.release_candidate_approved,
    false,
    "release_candidate_approved must be false",
  );
  assert.equal(
    result.product_write_executed,
    false,
    "product_write_executed must be false",
  );
  assert.equal(result.product_id_allocated, false, "product_id_allocated must be false");
  assert.equal(
    result.product_write_authority_granted,
    false,
    "product_write_authority_granted must be false",
  );
  assertAuthorityBoundary(result.authority_boundary);
  for (const section of result.sections ?? []) {
    assert.equal(section.public_safe, true, "result section must be public safe");
    assertAuthorityBoundary(section.authority_boundary);
  }
}

function assertAuthorityBoundary(authorityBoundary) {
  assert.equal(
    authorityBoundary.release_notes_summary_now,
    true,
    "release_notes_summary_now must be true",
  );
  assert.equal(authorityBoundary.review_only, true, "review_only must be true");
  for (const field of authorityFalseFields) {
    assert.equal(authorityBoundary[field], false, `${field} must stay false`);
  }
}

function assertNoUnsafeEcho(caseName, result) {
  const output = JSON.stringify(result).toLowerCase();
  for (const placeholder of allowedFixturePlaceholders) {
    assert.ok(
      !output.includes(placeholder.toLowerCase()),
      `${caseName} output must not echo unsafe placeholder ${placeholder}`,
    );
  }
}

function assertNoForbiddenPositiveAuthority(source, label) {
  for (const forbiddenGrant of forbiddenPositiveAuthorityGrants) {
    assert.ok(
      !source.includes(forbiddenGrant),
      `${label} must not include positive authority grant ${forbiddenGrant}`,
    );
  }
}

function assertIndexDoesNotImplyForbiddenAuthority() {
  const forbiddenIndexImplications = [
    "release notes publication was added",
    "release execution was added",
    "release artifacts were created",
    "release approval was added",
    "product-write runtime was added",
    "adapter was enabled",
    "target contract was created",
    "product ID allocation was added",
    "DB write was added",
    "route/UI was added",
    "state mutation was added",
    "proof/evidence writes were added",
    "Git Ledger export runtime was added",
    "Git/GitHub execution was added",
    "provider/retrieval/RAG",
    "source fetch was added",
  ];
  for (const phrase of forbiddenIndexImplications) {
    assert.ok(!index.includes(phrase), `index must not imply: ${phrase}`);
  }
}

function assertFixturePrivacy() {
  let fixtureText = JSON.stringify(fixture);
  for (const placeholder of allowedFixturePlaceholders) {
    fixtureText = fixtureText.split(placeholder).join("");
  }
  const lowerFixture = fixtureText.toLowerCase();
  for (const marker of fixtureForbiddenMarkers) {
    if (marker === "sk-" || marker === "ghp_") continue;
    assert.ok(
      !lowerFixture.includes(marker.toLowerCase()),
      `fixture must not contain forbidden marker outside allowed placeholders: ${marker}`,
    );
  }
  assert.ok(
    !/\\bsk-[a-z0-9_-]{8,}/i.test(fixtureText),
    "fixture must not contain token-like sk marker outside allowed placeholders",
  );
  assert.ok(
    !/\\bghp_[a-z0-9_]{8,}/i.test(fixtureText),
    "fixture must not contain token-like ghp marker outside allowed placeholders",
  );
}

function assertNoForbiddenHelperImports() {
  const forbiddenPatterns = [
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
    /from\s+["']next\/server["']/,
    /from\s+["']openai["']/i,
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /\bfetch\s*\(/,
    /Database\s*\(/,
    /NextResponse/,
    /release-publish/i,
    /release-execution/i,
    /product-write-adapter-runtime/i,
    /route\\.ts/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(helperSource), `helper must not match ${pattern}`);
  }
}

async function importReleaseNotesPublicSafeHelper() {
  const stripped = stripTypeScriptTypes(helperSource, { mode: "strip" });
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}
