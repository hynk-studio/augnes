#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const releaseReadinessDocsPath = "docs/RELEASE_READINESS_MATRIX_V0_1.md";
const disabledHarnessDocsPath =
  "docs/DISABLED_PRODUCT_WRITE_ADAPTER_REENTRY_HARNESS_V0_1.md";
const docsPath = "docs/RELEASE_CANDIDATE_OPERATOR_REVIEW_V0_1.md";
const helperPath = "lib/release-readiness/release-candidate-operator-review.ts";
const fixturePath = "fixtures/release-candidate-operator-review.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const reviewVersion = "release_candidate_operator_review.v0.1";
const inputVersion = "release_candidate_operator_input.v0.1";
const resultVersion = "release_candidate_operator_result.v0.1";
const itemVersion = "release_candidate_operator_item.v0.1";
const fixtureVersion = "release_candidate_operator_review.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:release-candidate-operator-review-v0-1";
const packageScriptValue =
  "node scripts/smoke-release-candidate-operator-review-v0-1.mjs";

const decisions = [
  "blocked",
  "needs_operator_review",
  "ready_for_future_operator_review",
  "rejected",
];
const itemKinds = [
  "release_readiness",
  "disabled_product_write_harness",
  "product_write_reentry",
  "git_ledger_contract",
  "runtime_audit",
  "dogfooding",
  "feedback",
  "verification",
  "privacy",
  "rollback",
  "idempotency",
  "failure_modes",
  "operator_notes",
  "unknown",
];
const mandatoryItemKinds = [
  "release_readiness",
  "disabled_product_write_harness",
  "product_write_reentry",
  "git_ledger_contract",
  "runtime_audit",
  "dogfooding",
  "feedback",
  "verification",
  "privacy",
  "rollback",
  "idempotency",
  "failure_modes",
];
const missingMandatoryItemKindRefs = mandatoryItemKinds.map(
  (kind) => `release-candidate-item-kind:missing:${kind}`,
);
const missingTopLevelContextRefs = [
  "release-candidate-context:missing:disabled_harness_refs",
  "release-candidate-context:missing:git_ledger_contract_refs",
  "release-candidate-context:missing:product_write_reentry_refs",
  "release-candidate-context:missing:release_readiness_refs",
  "release-candidate-context:missing:runtime_audit_refs",
];
const severities = ["info", "warning", "blocking", "critical", "unknown"];
const statuses = [
  "reviewed",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
];

const authorityFalseFields = [
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
  "release_candidate_review_is_truth",
  "release_candidate_review_is_proof",
  "release_candidate_review_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
];

const exactDocsPhrases = [
  "Product-write remains parked by #686.",
  "Release Candidate Operator Review is review-only.",
  "Release Candidate Operator Review is not release.",
  "Release Candidate Operator Review is not release approval.",
  "Release Candidate Operator Review does not grant release authority.",
  "Release Candidate Operator Review does not grant product-write authority.",
  "Product-write authority is not granted.",
  "Product-write runtime is not implemented.",
  "Product-write adapter is not enabled.",
  "Product-write target contract is not created.",
  "Product IDs are not allocated.",
  "Products are not persisted.",
  "This PR does not execute a release.",
  "This PR does not create release artifacts.",
  "This PR does not approve a release candidate.",
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
  "raw release candidate payload blocked by fixture",
  "raw conversation blocked by release candidate review fixture",
  "hidden reasoning blocked by release candidate review fixture",
  "telemetry dump blocked by release candidate review fixture",
  "secret-like release candidate review input blocked by fixture",
  "sk-test-token-like-000000",
  "ghp_exampleTokenLikeValue000000",
  "risk-reduction",
  "task-level",
];

const forbiddenPositiveAuthorityGrants = authorityFalseFields
  .map((field) => `${field}: true`)
  .concat(authorityFalseFields.map((field) => `"${field}": true`));

const roadmap = read(roadmapPath);
const releaseReadinessDocs = read(releaseReadinessDocsPath);
const disabledHarnessDocs = read(disabledHarnessDocsPath);
const docs = read(docsPath);
const helperSource = read(helperPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);

assert.ok(
  roadmap.includes("release_candidate_operator_review_v0_1"),
  "roadmap must contain release_candidate_operator_review_v0_1",
);
assert.ok(
  releaseReadinessDocs.includes("Release Readiness Matrix is review-only."),
  "Release Readiness docs must preserve review-only wording",
);
assert.ok(
  disabledHarnessDocs.includes(
    "Disabled Product Write Adapter Reentry Harness is disabled.",
  ),
  "Disabled Harness docs must preserve disabled wording",
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.review_version, reviewVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.item_version, itemVersion);
assert.equal(fixture.scope, scope);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the release candidate operator review smoke",
);

for (const path of [
  docsPath,
  helperPath,
  fixturePath,
  "scripts/smoke-release-candidate-operator-review-v0-1.mjs",
]) {
  assert.ok(index.includes(path), `docs/00_INDEX_LATEST.md must point to ${path}`);
}
assert.ok(index.includes("review-only"), "index must mention review-only");
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

for (const value of [...decisions, ...itemKinds, ...severities, ...statuses]) {
  assert.ok(helperSource.includes(`"${value}"`), `helper unions must include ${value}`);
}
assert.ok(
  helperSource.includes("collectUnsafeObjectFailures"),
  "helper must recursively scan unknown fields",
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
  helperSource.includes("buildReleaseCandidateOperatorReviewV01"),
  "helper must export builder",
);
assert.ok(
  helperSource.includes("validateReleaseCandidateOperatorReviewInputV01"),
  "helper must export input validator",
);
assert.ok(
  helperSource.includes("function missingContextRefsForEmptyReviewV01"),
  "helper must combine empty-review missing context refs",
);
assert.ok(
  helperSource.includes("...missingMandatoryItemKindRefs([])"),
  "empty review helper must include all missing mandatory item-kind refs",
);
const emptyBranchStart = helperSource.indexOf("if (input.review_items.length === 0)");
const emptyBranchEnd = helperSource.indexOf("const authorityBoundary", emptyBranchStart);
assert.ok(emptyBranchStart >= 0 && emptyBranchEnd > emptyBranchStart);
const emptyBranchSource = helperSource.slice(emptyBranchStart, emptyBranchEnd);
assert.ok(
  !emptyBranchSource.includes("blocking_item_refs: []"),
  "empty review branch must not drop blocking item refs",
);

assertNoForbiddenPositiveAuthority(docs, "docs");
assertNoForbiddenPositiveAuthority(index, "index");
assertNoForbiddenPositiveAuthority(helperSource, "helper");
assertIndexDoesNotImplyForbiddenAuthority();
assertFixturePrivacy();
assertNoForbiddenHelperImports();

const helper = await importReleaseCandidateOperatorHelper();

assert.deepEqual(
  helper.buildReleaseCandidateOperatorReviewV01(fixture.expected_valid_input),
  fixture.expected_result,
  "valid operator review output must match expected_result",
);
assert.equal(fixture.expected_result.status, "reviewed");
assert.equal(fixture.expected_result.decision, "ready_for_future_operator_review");
assertResultAuthorityClosed(fixture.expected_result);

const repeated = helper.buildReleaseCandidateOperatorReviewV01(
  fixture.expected_valid_input,
);
assert.equal(
  repeated.review_fingerprint,
  fixture.expected_result.review_fingerprint,
  "repeated build must keep the same fingerprint",
);

assert.deepEqual(
  helper.buildReleaseCandidateOperatorReviewV01(fixture.expected_empty_input),
  fixture.expected_empty_result,
  "empty operator review output must match expected_empty_result",
);
assert.equal(fixture.expected_empty_result.status, "empty");
assert.equal(fixture.expected_empty_result.decision, "blocked");
assertResultAuthorityClosed(fixture.expected_empty_result);
assertEmptyResultHasMissingRefs(
  fixture.expected_empty_result,
  [...missingTopLevelContextRefs, ...missingMandatoryItemKindRefs],
  "expected_empty_result",
);

const observedDecisions = new Set([fixture.expected_result.decision]);
for (const [caseName, input] of Object.entries(fixture.decision_coverage_inputs)) {
  const actual = helper.buildReleaseCandidateOperatorReviewV01(input);
  const expected = fixture.expected_decision_results[caseName];
  assert.deepEqual(actual, expected, `${caseName} must match expected decision result`);
  observedDecisions.add(actual.decision);
  assertResultAuthorityClosed(actual);
}
for (const decision of decisions) {
  assert.ok(observedDecisions.has(decision), `fixture must cover decision ${decision}`);
}

const observedKinds = new Set();
const observedSeverities = new Set();
for (const input of [
  fixture.expected_valid_input,
  ...Object.values(fixture.decision_coverage_inputs),
]) {
  for (const item of input.review_items) {
    observedKinds.add(item.item_kind);
    observedSeverities.add(item.severity);
  }
}
for (const itemKind of itemKinds) {
  assert.ok(observedKinds.has(itemKind), `fixture must cover item kind ${itemKind}`);
}
for (const severity of severities) {
  assert.ok(observedSeverities.has(severity), `fixture must cover severity ${severity}`);
}

assertDecisionCase(
  "missing_release_readiness_refs_blocked",
  "blocked",
  "release-candidate-context:missing:release_readiness_refs",
  "release_readiness_ref_missing",
);
assertDecisionCase(
  "missing_disabled_harness_refs_blocked",
  "blocked",
  "release-candidate-context:missing:disabled_harness_refs",
  "disabled_harness_ref_missing",
);
assertDecisionCase(
  "missing_product_write_reentry_refs_blocked",
  "blocked",
  "release-candidate-context:missing:product_write_reentry_refs",
  "product_write_reentry_ref_missing",
);
assertDecisionCase(
  "missing_git_ledger_refs_blocked",
  "blocked",
  "release-candidate-context:missing:git_ledger_contract_refs",
  "git_ledger_contract_ref_missing",
);
assertDecisionCase(
  "missing_runtime_audit_refs_blocked",
  "blocked",
  "release-candidate-context:missing:runtime_audit_refs",
  "runtime_audit_ref_missing",
);
assertEmptyResultHasMissingRefs(
  fixture.expected_decision_results
    .empty_all_top_level_refs_present_blocked_missing_item_kinds,
  missingMandatoryItemKindRefs,
  "empty_all_top_level_refs_present_blocked_missing_item_kinds",
);
assert.ok(
  fixture.expected_decision_results
    .empty_all_top_level_refs_present_blocked_missing_item_kinds.missing_context_refs.every(
      (ref) => !ref.startsWith("release-candidate-context:missing:"),
    ),
  "empty all-top-level-refs-present case must not invent top-level missing refs",
);
assertEmptyResultHasMissingRefs(
  fixture.expected_decision_results
    .empty_missing_top_level_refs_and_missing_item_kinds,
  [...missingTopLevelContextRefs, ...missingMandatoryItemKindRefs],
  "empty_missing_top_level_refs_and_missing_item_kinds",
);
assert.equal(
  fixture.expected_decision_results.needs_operator_review.decision,
  "needs_operator_review",
);
assert.equal(
  fixture.expected_decision_results.unknown_item_kind_rejected.decision,
  "rejected",
);

for (const [caseName, input] of Object.entries(fixture.invalid_inputs)) {
  const actual = helper.buildReleaseCandidateOperatorReviewV01(input);
  const expected = fixture.expected_rejection_results[caseName];
  assert.deepEqual(actual, expected, `${caseName} must match expected rejection result`);
  assert.equal(actual.review_items.length, 0, `${caseName} must not include output items`);
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
  fixture.expected_rejection_results.public_safe_false_item.status,
  "blocked_invalid_input",
);
assert.equal(
  fixture.expected_rejection_results.forbidden_authority.status,
  "blocked_invalid_input",
);

const publicSafeHyphenInput = structuredClone(fixture.expected_valid_input);
publicSafeHyphenInput.review_id = "release-candidate-operator-review:hyphen-safe";
publicSafeHyphenInput.review_items[0].bounded_summary =
  "Public-safe risk-reduction and task-level review summary.";
const publicSafeHyphenResult =
  helper.buildReleaseCandidateOperatorReviewV01(publicSafeHyphenInput);
assert.equal(
  publicSafeHyphenResult.status,
  "reviewed",
  "risk-reduction/task-level public-safe text must not be blocked",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "release-candidate-operator-review-v0-1",
      verified: {
        valid_result: fixture.expected_result.review_fingerprint,
        empty_result: fixture.expected_empty_result.review_fingerprint,
        decisions: [...observedDecisions].sort(),
        item_kinds: [...observedKinds].sort(),
        severities: [...observedSeverities].sort(),
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
    result.missing_context_refs.includes(missingRef),
    `${caseName} must include ${missingRef}`,
  );
  assert.ok(
    result.reason_codes.includes(reasonCode),
    `${caseName} must include ${reasonCode}`,
  );
  assertResultAuthorityClosed(result);
}

function assertEmptyResultHasMissingRefs(result, missingRefs, label) {
  assert.equal(result.status, "empty", `${label} status`);
  assert.equal(result.decision, "blocked", `${label} decision`);
  assert.deepEqual(result.review_items, [], `${label} must not fabricate review items`);
  assert.ok(
    result.reason_codes.includes("mandatory_review_context_missing"),
    `${label} must include mandatory_review_context_missing`,
  );
  for (const missingRef of missingRefs) {
    assert.ok(
      result.missing_context_refs.includes(missingRef),
      `${label} missing_context_refs must include ${missingRef}`,
    );
    assert.ok(
      result.blocking_item_refs.includes(missingRef),
      `${label} blocking_item_refs must include ${missingRef}`,
    );
  }
  assertResultAuthorityClosed(result);
}

function assertResultAuthorityClosed(result) {
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
  for (const item of result.review_items ?? []) {
    assert.equal(item.public_safe, true, "result item must be public safe");
    assertAuthorityBoundary(item.authority_boundary);
  }
}

function assertAuthorityBoundary(authorityBoundary) {
  assert.equal(
    authorityBoundary.release_candidate_operator_review_now,
    true,
    "release_candidate_operator_review_now must be true",
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
    "release execution was added",
    "release artifacts were created",
    "release approval was added",
    "product-write runtime was added",
    "adapter was enabled",
    "target contract was created",
    "product ID allocation was added",
    "products were persisted",
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
    !/\bsk-[a-z0-9_-]{8,}/i.test(fixtureText),
    "fixture must not contain token-like sk marker outside allowed placeholders",
  );
  assert.ok(
    !/\bghp_[a-z0-9_]{8,}/i.test(fixtureText),
    "fixture must not contain token-like ghp marker outside allowed placeholders",
  );
}

function assertNoForbiddenHelperImports() {
  const forbiddenImportPatterns = [
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /Database/,
    /NextResponse/,
    /OpenAI/,
    /from\s+["'][^"']*provider[^"']*["']/i,
    /provider\s*\(/i,
    /\bfetch\s*\(/,
    /from\s+["'][^"']*github[^"']*automation[^"']*["']/i,
    /githubAutomation\s*\(/,
    /route\.(ts|tsx|js|mjs)/,
    /product-write-adapter-runtime/i,
    /release-execution/i,
  ];
  for (const pattern of forbiddenImportPatterns) {
    assert.doesNotMatch(helperSource, pattern, `helper must not match ${pattern}`);
  }
}

async function importReleaseCandidateOperatorHelper() {
  const tsSource = read(helperPath);
  const jsSource = stripTypeScriptTypes(tsSource);
  return import(`data:text/javascript,${encodeURIComponent(jsSource)}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}
