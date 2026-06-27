#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const productWriteDocsPath = "docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md";
const gitLedgerDocsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const docsPath = "docs/RELEASE_READINESS_MATRIX_V0_1.md";
const helperPath = "lib/release-readiness/build-release-readiness-matrix.ts";
const fixturePath = "fixtures/release-readiness-matrix.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const matrixVersion = "release_readiness_matrix.v0.1";
const inputVersion = "release_readiness_input.v0.1";
const resultVersion = "release_readiness_result.v0.1";
const itemVersion = "release_readiness_item.v0.1";
const categoryVersion = "release_readiness_category.v0.1";
const fixtureVersion = "release_readiness_matrix.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:release-readiness-matrix-v0-1";
const packageScriptValue = "node scripts/smoke-release-readiness-matrix-v0-1.mjs";

const decisions = [
  "blocked",
  "not_ready",
  "needs_operator_review",
  "ready_for_release_candidate_review",
  "rejected",
];

const categories = [
  "runtime_audit",
  "product_write_reentry",
  "git_ledger",
  "dogfooding",
  "feedback",
  "privacy",
  "verification",
  "rollback",
  "idempotency",
  "failure_modes",
  "state_boundaries",
  "external_side_effects",
  "operator_approval",
  "release_scope",
  "unknown",
];

const severities = ["info", "warning", "blocking", "critical", "unknown"];

const mandatoryCategories = [
  "runtime_audit",
  "product_write_reentry",
  "git_ledger",
  "dogfooding",
  "feedback",
  "privacy",
  "verification",
  "rollback",
  "idempotency",
  "failure_modes",
  "state_boundaries",
  "external_side_effects",
  "operator_approval",
  "release_scope",
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
  "release_readiness_is_truth",
  "release_readiness_is_proof",
  "release_readiness_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
];

const exactDocsPhrases = [
  "Product-write remains parked by #686.",
  "Release Readiness Matrix is review-only.",
  "Release readiness is not truth.",
  "Release readiness is not proof.",
  "Release readiness does not grant authority.",
  "Release candidate review is not release.",
  "`not_ready` reason codes identify only the required refs that are actually\nmissing.",
  "Present refs are not also reported as missing.",
  "`*_ref_present` reason codes are emitted only when matching refs are actually\nsupplied.",
  "Category labels alone do not create ref-present reason codes.",
  "Category context codes may describe the review category, but they must not\nfabricate ref presence.",
  "This PR does not execute a release.",
  "This PR does not create release artifacts.",
  "This PR does not approve a release candidate.",
  "Product-write authority is not granted.",
  "Product-write is not executed.",
  "Product IDs are not allocated.",
  "Product-write runtime is not implemented.",
  "Product-write adapter is not enabled.",
  "Runtime audit is review context, not authority.",
  "Git Ledger packets are review/export candidates, not commits.",
  "Smoke/CI pass is not truth.",
  "This PR does not write DB.",
  "This PR does not add routes.",
  "This PR does not add UI.",
  "This PR does not mutate durable Perspective state.",
  "This PR does not execute Git Ledger export.",
  "This PR does not execute Git.",
  "This PR does not call GitHub.",
  "This PR does not call providers.",
  "This PR does not execute retrieval or RAG.",
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
  "raw release payload blocked by fixture",
  "raw conversation blocked by release readiness fixture",
  "hidden reasoning blocked by release readiness fixture",
  "telemetry dump blocked by release readiness fixture",
  "secret-like release readiness input blocked by fixture",
  "sk-test-token-like-000000",
  "ghp_exampleTokenLikeValue000000",
  "risk-reduction",
  "task-level",
];

const forbiddenPositiveAuthorityGrants = authorityFalseFields.map(
  (field) => `${field}: true`,
);

const roadmap = read(roadmapPath);
const productWriteDocs = read(productWriteDocsPath);
const gitLedgerDocs = read(gitLedgerDocsPath);
const docs = read(docsPath);
const helperSource = read(helperPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);

assert.ok(
  roadmap.includes("release_readiness_matrix_v0_1"),
  "roadmap must contain release_readiness_matrix_v0_1",
);
assert.ok(
  productWriteDocs.includes("Product Write Reentry Review is review-only."),
  "Product Write Reentry Review docs must preserve review-only wording",
);
assert.ok(
  gitLedgerDocs.includes("Git Ledger Export Contract is contract-only."),
  "Git Ledger docs must preserve contract-only wording",
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.matrix_version, matrixVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.item_version, itemVersion);
assert.equal(fixture.category_version, categoryVersion);
assert.equal(fixture.scope, scope);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the release readiness smoke",
);

for (const path of [
  docsPath,
  helperPath,
  fixturePath,
  "scripts/smoke-release-readiness-matrix-v0-1.mjs",
]) {
  assert.ok(index.includes(path), `docs/00_INDEX_LATEST.md must point to ${path}`);
}
assert.ok(index.includes("review-only"), "index must mention review-only");
assert.ok(
  index.includes("Product-write remains parked by #686"),
  "index must mention Product-write remains parked by #686",
);
assert.ok(
  index.includes("release readiness does not grant authority"),
  "index must mention release readiness does not grant authority",
);

for (const phrase of exactDocsPhrases) {
  assert.ok(docs.includes(phrase), `docs must include exact phrase: ${phrase}`);
}

for (const value of [...decisions, ...categories, ...severities]) {
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
assert.ok(
  helperSource.includes("mandatoryReleaseReadinessCategoriesV01"),
  "helper must define mandatory release readiness categories",
);
assert.ok(
  helperSource.includes("getMissingMandatoryCategoriesV01"),
  "helper must compute missing mandatory categories",
);
assert.ok(
  helperSource.includes("allMandatoryCategoriesSatisfiedV01"),
  "helper must require all mandatory categories before readiness",
);
assert.ok(
  helperSource.includes("missingRequiredRefReasonCodesForInputV01"),
  "helper must compute missing required ref reason codes from actual input refs",
);
assert.ok(
  helperSource.includes("normalizeNotReadyRequiredRefReasonCodesV01"),
  "helper must normalize not_ready required ref present/missing reason codes",
);
assert.ok(
  helperSource.includes("presentRefReasonCodesForItemRefs"),
  "helper must split actual ref-present reason codes from category context",
);
assert.ok(
  helperSource.includes("categoryContextReasonCodes"),
  "helper must keep non-ref category context reason codes separate",
);
assertNoCategoryOnlyRefPresentSourcePatterns();
assert.ok(
  !helperSource.includes('"sk-"') || !helperSource.includes('privateOrRawMarkers = [\\n  "sk-"'),
  "sk- must not be a bare privateOrRaw marker",
);
assert.ok(
  !helperSource.includes('"ghp_"') || !helperSource.includes('privateOrRawMarkers = [\\n  "ghp_"'),
  "ghp_ must not be a bare privateOrRaw marker",
);

assertNoForbiddenPositiveAuthority(docs, "docs");
assertNoForbiddenPositiveAuthority(index, "index");
assertNoForbiddenPositiveAuthority(helperSource, "helper");
assertIndexDoesNotImplyForbiddenAuthority();
assertFixturePrivacy();
assertNoForbiddenHelperImports();

const helper = await importReleaseReadinessHelper();

assert.deepEqual(
  helper.buildReleaseReadinessMatrixV01(fixture.expected_valid_input),
  fixture.expected_result,
  "valid matrix output must match expected_result",
);
assert.equal(fixture.expected_result.status, "built");
assert.equal(fixture.expected_result.decision, "blocked");
assertMatrixBoundary(fixture.expected_result);

const repeated = helper.buildReleaseReadinessMatrixV01(fixture.expected_valid_input);
assert.equal(
  repeated.matrix_fingerprint,
  fixture.expected_result.matrix_fingerprint,
  "repeated build must produce the same matrix_fingerprint",
);

const resultWithoutFingerprint = { ...fixture.expected_result };
delete resultWithoutFingerprint.matrix_fingerprint;
assert.equal(
  helper.createReleaseReadinessFingerprintV01(resultWithoutFingerprint),
  fixture.expected_result.matrix_fingerprint,
  "matrix_fingerprint must be canonical over result without matrix_fingerprint",
);

assert.deepEqual(
  helper.buildReleaseReadinessMatrixV01(fixture.expected_empty_input),
  fixture.expected_empty_result,
  "empty input output must match expected_empty_result",
);
assert.equal(fixture.expected_empty_result.status, "empty");
assertMatrixBoundary(fixture.expected_empty_result);

const coveredDecisions = new Set([fixture.expected_result.decision]);
for (const [name, input] of Object.entries(fixture.decision_coverage_inputs)) {
  const actual = helper.buildReleaseReadinessMatrixV01(input);
  assert.deepEqual(
    actual,
    fixture.expected_decision_results[name],
    `decision coverage output must match for ${name}`,
  );
  coveredDecisions.add(actual.decision);
  assertMatrixBoundary(actual);
}
for (const decision of decisions) {
  assert.ok(coveredDecisions.has(decision), `decision covered: ${decision}`);
}

const allItems = [
  ...fixture.expected_valid_input.input_items,
  ...Object.values(fixture.decision_coverage_inputs).flatMap((input) => input.input_items),
];
const coveredCategories = new Set(allItems.map((item) => item.category));
const coveredSeverities = new Set(allItems.map((item) => item.severity));
for (const category of categories) {
  assert.ok(coveredCategories.has(category), `category covered: ${category}`);
}
for (const severity of severities) {
  assert.ok(coveredSeverities.has(severity), `severity covered: ${severity}`);
}

const missingCategoryResult =
  fixture.expected_decision_results.missing_mandatory_category_blocked;
assert.equal(missingCategoryResult.decision, "blocked");
assert.ok(
  missingCategoryResult.missing_category_refs.includes(
    "release-readiness-category:missing:operator_approval",
  ),
  "missing mandatory category must create stable missing ref",
);
assert.ok(
  missingCategoryResult.reason_codes.includes("mandatory_category_missing"),
  "missing mandatory category must include mandatory_category_missing",
);

assertNotReadyReasonCodesExact(
  fixture.expected_decision_results.missing_only_release_scope_refs_not_ready,
  ["release_scope_missing"],
  [
    "runtime_audit_ref_present",
    "product_write_reentry_ref_present",
    "git_ledger_contract_ref_present",
  ],
  [
    "runtime_audit_ref_missing",
    "product_write_reentry_ref_missing",
    "git_ledger_contract_ref_missing",
    "release_scope_present",
  ],
);
assertNotReadyReasonCodesExact(
  fixture.expected_decision_results.missing_only_runtime_audit_refs_not_ready,
  ["runtime_audit_ref_missing"],
  [
    "product_write_reentry_ref_present",
    "git_ledger_contract_ref_present",
    "release_scope_present",
  ],
  [
    "runtime_audit_ref_present",
    "product_write_reentry_ref_missing",
    "git_ledger_contract_ref_missing",
    "release_scope_missing",
  ],
);
assertNotReadyReasonCodesExact(
  fixture.expected_decision_results.missing_only_product_write_reentry_refs_not_ready,
  ["product_write_reentry_ref_missing"],
  ["runtime_audit_ref_present", "git_ledger_contract_ref_present", "release_scope_present"],
  [
    "runtime_audit_ref_missing",
    "product_write_reentry_ref_present",
    "git_ledger_contract_ref_missing",
    "release_scope_missing",
  ],
);
assertNotReadyReasonCodesExact(
  fixture.expected_decision_results.missing_only_git_ledger_contract_refs_not_ready,
  ["git_ledger_contract_ref_missing"],
  [
    "runtime_audit_ref_present",
    "product_write_reentry_ref_present",
    "release_scope_present",
  ],
  [
    "runtime_audit_ref_missing",
    "product_write_reentry_ref_missing",
    "git_ledger_contract_ref_present",
    "release_scope_missing",
  ],
);
assertNotReadyReasonCodesExact(
  fixture.expected_decision_results.missing_all_required_refs_not_ready,
  [
    "runtime_audit_ref_missing",
    "product_write_reentry_ref_missing",
    "git_ledger_contract_ref_missing",
    "release_scope_missing",
  ],
  [],
  [
    "runtime_audit_ref_present",
    "product_write_reentry_ref_present",
    "git_ledger_contract_ref_present",
    "release_scope_present",
  ],
);
assertCategoryOnlyNoRefPresentCode(
  fixture.expected_decision_results.category_only_runtime_audit_no_ref_no_present_code,
  "runtime_audit",
  "runtime_audit_ref_present",
  "runtime_audit_ref_missing",
);
assertCategoryOnlyNoRefPresentCode(
  fixture.expected_decision_results.category_only_product_write_reentry_no_ref_no_present_code,
  "product_write_reentry",
  "product_write_reentry_ref_present",
);
assertCategoryOnlyNoRefPresentCode(
  fixture.expected_decision_results.category_only_git_ledger_no_ref_no_present_code,
  "git_ledger",
  "git_ledger_contract_ref_present",
);
assertCategoryOnlyNoRefPresentCode(
  fixture.expected_decision_results.category_only_dogfooding_no_ref_no_present_code,
  "dogfooding",
  "dogfooding_ref_present",
);
assertCategoryOnlyNoRefPresentCode(
  fixture.expected_decision_results.category_only_feedback_no_ref_no_present_code,
  "feedback",
  "feedback_ref_present",
);
assertCategoryOnlyNoRefPresentCode(
  fixture.expected_decision_results.category_only_verification_no_ref_no_present_code,
  "verification",
  "verification_ref_present",
);
assertActualRefsEmitPresentCodes(
  fixture.expected_decision_results.actual_refs_emit_present_codes,
);
assert.equal(
  fixture.expected_decision_results.ready_for_release_candidate_review.decision,
  "ready_for_release_candidate_review",
);
assertMatrixBoundary(fixture.expected_decision_results.ready_for_release_candidate_review);
assert.equal(
  fixture.expected_decision_results.needs_operator_review.decision,
  "needs_operator_review",
);
assert.equal(
  fixture.expected_decision_results.unknown_category_rejected.decision,
  "rejected",
);

const publicSafeHyphenatedInput =
  fixture.decision_coverage_inputs.ready_for_release_candidate_review;
const publicSafeText = JSON.stringify(publicSafeHyphenatedInput);
assert.ok(publicSafeText.includes("risk-reduction"));
assert.ok(publicSafeText.includes("task-level"));
assert.equal(
  helper.buildReleaseReadinessMatrixV01(publicSafeHyphenatedInput).decision,
  "ready_for_release_candidate_review",
  "risk-reduction/task-level public-safe text must not be blocked",
);

for (const [name, input] of Object.entries(fixture.invalid_inputs)) {
  const actual = helper.buildReleaseReadinessMatrixV01(input);
  assert.deepEqual(
    actual,
    fixture.expected_rejection_results[name],
    `rejection output must match for ${name}`,
  );
  assert.deepEqual(actual.items, [], `${name} must not echo items`);
  assert.deepEqual(actual.category_summaries, [], `${name} must not echo summaries`);
  assertMatrixBoundary(actual);
  assertBlockedOutputDoesNotEchoUnsafeValues(input, actual, name);
}
assert.equal(
  fixture.expected_rejection_results.private_raw_payload.status,
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
assert.ok(
  fixture.expected_rejection_results.token_like_sk.reason_codes.includes(
    "private_or_raw_payload_blocked",
  ),
);
assert.ok(
  fixture.expected_rejection_results.token_like_ghp.reason_codes.includes(
    "private_or_raw_payload_blocked",
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
      smoke: "release-readiness-matrix-v0-1",
      verified: {
        valid_result: fixture.expected_result.matrix_fingerprint,
        empty_result: fixture.expected_empty_result.matrix_fingerprint,
        decisions: [...coveredDecisions].sort(),
        categories: [...coveredCategories].sort(),
        severities: [...coveredSeverities].sort(),
      },
    },
    null,
    2,
  ),
);

function read(path) {
  return readFileSync(path, "utf8");
}

async function importReleaseReadinessHelper() {
  const transformedSource = stripTypeScriptTypes(helperSource, { mode: "transform" });
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`);
}

function assertMatrixBoundary(result) {
  assert.equal(result.release_executed, false, "result must not execute release");
  assert.equal(
    result.release_artifact_created,
    false,
    "result must not create release artifact",
  );
  assert.equal(
    result.release_authority_granted,
    false,
    "result must not grant release authority",
  );
  assert.equal(
    result.release_candidate_approved,
    false,
    "result must not approve release candidate",
  );
  assert.equal(result.product_write_executed, false, "result must not product-write");
  assert.equal(result.product_id_allocated, false, "result must not allocate product ID");
  assert.equal(
    result.product_write_authority_granted,
    false,
    "result must not grant product-write authority",
  );
  assertAuthorityBoundary(result.authority_boundary, "result.authority_boundary");
  for (const item of result.items) {
    assert.equal(item.public_safe, true, `item ${item.item_id} must be public-safe`);
    assertAuthorityBoundary(item.authority_boundary, `item ${item.item_id}`);
  }
  for (const summary of result.category_summaries) {
    assertAuthorityBoundary(
      summary.authority_boundary,
      `summary ${summary.category}`,
    );
  }
}

function assertNotReadyReasonCodesExact(
  result,
  expectedMissingReasonCodes,
  expectedPresentReasonCodes,
  forbiddenReasonCodes,
) {
  assert.equal(result.decision, "not_ready", "case must be not_ready");
  for (const reasonCode of expectedMissingReasonCodes) {
    assert.ok(
      result.reason_codes.includes(reasonCode),
      `not_ready result must include ${reasonCode}`,
    );
  }
  for (const reasonCode of expectedPresentReasonCodes) {
    assert.ok(
      result.reason_codes.includes(reasonCode),
      `not_ready result must preserve present code ${reasonCode}`,
    );
  }
  for (const reasonCode of forbiddenReasonCodes) {
    assert.ok(
      !result.reason_codes.includes(reasonCode),
      `not_ready result must not include contradictory code ${reasonCode}`,
    );
  }
  assertMatrixBoundary(result);
}

function assertCategoryOnlyNoRefPresentCode(
  result,
  category,
  presentReasonCode,
  expectedResultMissingReasonCode,
) {
  const item = result.items.find((candidate) => candidate.category === category);
  const summary = result.category_summaries.find(
    (candidate) => candidate.category === category,
  );
  assert.ok(item, `category-only case must include item for ${category}`);
  assert.ok(summary, `category-only case must include summary for ${category}`);
  assert.ok(
    !item.reason_codes.includes(presentReasonCode),
    `${category} item must not include ${presentReasonCode} without actual refs`,
  );
  assert.ok(
    !summary.reason_codes.includes(presentReasonCode),
    `${category} summary must not inherit ${presentReasonCode} without actual refs`,
  );
  if (expectedResultMissingReasonCode) {
    assert.equal(result.decision, "not_ready");
    assert.ok(
      result.reason_codes.includes(expectedResultMissingReasonCode),
      `${category} result must include ${expectedResultMissingReasonCode}`,
    );
  }
  assertMatrixBoundary(result);
}

function assertActualRefsEmitPresentCodes(result) {
  const expectedByCategory = {
    runtime_audit: "runtime_audit_ref_present",
    product_write_reentry: "product_write_reentry_ref_present",
    git_ledger: "git_ledger_contract_ref_present",
    dogfooding: "dogfooding_ref_present",
    feedback: "feedback_ref_present",
    verification: "verification_ref_present",
  };
  assert.equal(result.decision, "ready_for_release_candidate_review");
  for (const [category, presentReasonCode] of Object.entries(expectedByCategory)) {
    const item = result.items.find((candidate) => candidate.category === category);
    const summary = result.category_summaries.find(
      (candidate) => candidate.category === category,
    );
    assert.ok(item, `actual-ref case must include item for ${category}`);
    assert.ok(summary, `actual-ref case must include summary for ${category}`);
    assert.ok(
      item.reason_codes.includes(presentReasonCode),
      `${category} item must include ${presentReasonCode} when refs exist`,
    );
    assert.ok(
      summary.reason_codes.includes(presentReasonCode),
      `${category} summary must include ${presentReasonCode} when refs exist`,
    );
  }
  assertMatrixBoundary(result);
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(
    boundary.release_readiness_matrix_now,
    true,
    `${label} must be release readiness now`,
  );
  assert.equal(boundary.review_only, true, `${label} must be review-only`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertNoForbiddenPositiveAuthority(source, label) {
  for (const marker of forbiddenPositiveAuthorityGrants) {
    assert.ok(!source.includes(marker), `${label} must not contain ${marker}`);
  }
}

function assertIndexDoesNotImplyForbiddenAuthority() {
  const forbiddenIndexPhrases = [
    "release execution was added",
    "release artifacts were created",
    "release candidate approval was added",
    "product-write runtime was added",
    "adapter was enabled",
    "product ID allocation was added",
    "DB write was added",
    "route/UI was added",
    "state mutation was added",
    "proof/evidence writes were added",
    "Git Ledger export runtime was added",
    "Git/GitHub execution was added",
  ];
  for (const phrase of forbiddenIndexPhrases) {
    assert.ok(!index.includes(phrase), `index must not imply ${phrase}`);
  }
}

function assertNoForbiddenHelperImports() {
  const forbiddenImports = [
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /from\s+["'][^"']*route[^"']*["']/,
    /from\s+["'][^"']*adapter[^"']*["']/,
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
    "product-write adapter",
  ]) {
    assert.ok(!helperSource.includes(marker), `helper must not contain ${marker}`);
  }
}

function assertNoCategoryOnlyRefPresentSourcePatterns() {
  const forbiddenFallbackPairs = [
    ["runtime_audit_refs", "runtime_audit"],
    ["product_write_reentry_refs", "product_write_reentry"],
    ["git_ledger_refs", "git_ledger"],
    ["dogfooding_refs", "dogfooding"],
    ["feedback_refs", "feedback"],
    ["verification_refs", "verification"],
  ];
  for (const [refField, category] of forbiddenFallbackPairs) {
    const snippet = `item.${refField}.length > 0 || item.category === "${category}"`;
    assert.ok(
      !helperSource.includes(snippet),
      `helper must not contain category fallback for ref-present logic: ${snippet}`,
    );
  }

  const forbiddenPatterns = [
    /runtime_audit_refs\.length > 0\s*\|\|\s*item\.category === "runtime_audit"[\s\S]{0,160}runtime_audit_ref_present/,
    /product_write_reentry_refs\.length > 0\s*\|\|\s*item\.category === "product_write_reentry"[\s\S]{0,160}product_write_reentry_ref_present/,
    /git_ledger_refs\.length > 0\s*\|\|\s*item\.category === "git_ledger"[\s\S]{0,160}git_ledger_contract_ref_present/,
    /dogfooding_refs\.length > 0\s*\|\|\s*item\.category === "dogfooding"[\s\S]{0,160}dogfooding_ref_present/,
    /feedback_refs\.length > 0\s*\|\|\s*item\.category === "feedback"[\s\S]{0,160}feedback_ref_present/,
    /verification_refs\.length > 0\s*\|\|\s*item\.category === "verification"[\s\S]{0,160}verification_ref_present/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.ok(
      !pattern.test(helperSource),
      `helper must not emit ref-present codes by category alone: ${pattern}`,
    );
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
