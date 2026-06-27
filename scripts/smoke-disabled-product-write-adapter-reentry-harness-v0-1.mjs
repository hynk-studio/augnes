#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const releaseReadinessDocsPath = "docs/RELEASE_READINESS_MATRIX_V0_1.md";
const productWriteDocsPath = "docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md";
const docsPath = "docs/DISABLED_PRODUCT_WRITE_ADAPTER_REENTRY_HARNESS_V0_1.md";
const helperPath =
  "lib/product-write/disabled-product-write-adapter-reentry-harness.ts";
const fixturePath =
  "fixtures/disabled-product-write-adapter-reentry-harness.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const harnessVersion = "disabled_product_write_adapter_reentry_harness.v0.1";
const inputVersion = "disabled_product_write_adapter_input.v0.1";
const resultVersion = "disabled_product_write_adapter_result.v0.1";
const fixtureVersion = "disabled_product_write_adapter_reentry_harness.sample.v0.1";
const scope = "project:augnes";
const packageScriptName =
  "smoke:disabled-product-write-adapter-reentry-harness-v0-1";
const packageScriptValue =
  "node scripts/smoke-disabled-product-write-adapter-reentry-harness-v0-1.mjs";

const decisions = ["disabled", "refused", "blocked", "rejected"];
const statuses = [
  "refused_disabled",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
  "empty",
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
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "repository_file_write_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "source_fetch_now",
  "codex_execution_authority",
  "github_automation_authority",
  "disabled_harness_is_authority",
  "disabled_harness_is_adapter_runtime",
  "disabled_harness_is_product_write",
  "disabled_harness_is_reentry_approval",
  "product_write_authority",
  "release_readiness_is_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const exactDocsPhrases = [
  "Product-write remains parked by #686.",
  "Disabled Product Write Adapter Reentry Harness is disabled.",
  "Disabled Product Write Adapter Reentry Harness is review-only.",
  "Disabled Product Write Adapter Reentry Harness is not reentry approval.",
  "Disabled Product Write Adapter Reentry Harness is not adapter runtime.",
  "Disabled Product Write Adapter Reentry Harness does not enable product-write adapter.",
  "Disabled Product Write Adapter Reentry Harness does not execute product-write.",
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
  "raw product-write payload blocked by disabled harness fixture",
  "raw conversation blocked by disabled harness fixture",
  "hidden reasoning blocked by disabled harness fixture",
  "telemetry dump blocked by disabled harness fixture",
  "secret-like disabled harness input blocked by fixture",
  "sk-test-token-like-000000",
  "ghp_exampleTokenLikeValue000000",
];

const forbiddenPositiveAuthorityGrants = authorityFalseFields
  .map((field) => `${field}: true`)
  .concat(authorityFalseFields.map((field) => `"${field}": true`));

const roadmap = read(roadmapPath);
const releaseReadinessDocs = read(releaseReadinessDocsPath);
const productWriteDocs = read(productWriteDocsPath);
const docs = read(docsPath);
const helperSource = read(helperPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);

assert.ok(
  roadmap.includes("disabled_product_write_adapter_reentry_harness_v0_1"),
  "roadmap must contain disabled_product_write_adapter_reentry_harness_v0_1",
);
assert.ok(
  releaseReadinessDocs.includes("Release Readiness Matrix is review-only."),
  "Release Readiness docs must preserve review-only wording",
);
assert.ok(
  productWriteDocs.includes("Product Write Reentry Review is review-only."),
  "Product Write Reentry docs must preserve review-only wording",
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.harness_version, harnessVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.scope, scope);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the disabled harness smoke",
);

for (const path of [
  docsPath,
  helperPath,
  fixturePath,
  "scripts/smoke-disabled-product-write-adapter-reentry-harness-v0-1.mjs",
]) {
  assert.ok(index.includes(path), `docs/00_INDEX_LATEST.md must point to ${path}`);
}
assert.ok(index.includes("disabled"), "index must mention disabled");
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

for (const value of [...decisions, ...statuses]) {
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
  helperSource.includes("buildDisabledProductWriteAdapterHarnessV01"),
  "helper must export builder",
);
assert.ok(
  helperSource.includes("validateDisabledProductWriteAdapterInputV01"),
  "helper must export input validator",
);

assertNoForbiddenPositiveAuthority(docs, "docs");
assertNoForbiddenPositiveAuthority(index, "index");
assertNoForbiddenPositiveAuthority(helperSource, "helper");
assertIndexDoesNotImplyForbiddenAuthority();
assertFixturePrivacy();
assertNoForbiddenHelperImports();

const helper = await importDisabledHarnessHelper();

assert.deepEqual(
  helper.buildDisabledProductWriteAdapterHarnessV01(fixture.expected_valid_input),
  fixture.expected_result,
  "valid harness output must match expected_result",
);
assert.equal(fixture.expected_result.status, "refused_disabled");
assertHarnessBoundary(fixture.expected_result);

const repeated = helper.buildDisabledProductWriteAdapterHarnessV01(
  fixture.expected_valid_input,
);
assert.equal(
  repeated.harness_fingerprint,
  fixture.expected_result.harness_fingerprint,
  "repeated build must produce the same harness_fingerprint",
);

const resultWithoutFingerprint = { ...fixture.expected_result };
delete resultWithoutFingerprint.harness_fingerprint;
assert.equal(
  helper.createDisabledProductWriteAdapterFingerprintV01(resultWithoutFingerprint),
  fixture.expected_result.harness_fingerprint,
  "harness_fingerprint must be canonical over result without harness_fingerprint",
);

assert.deepEqual(
  helper.buildDisabledProductWriteAdapterHarnessV01(fixture.expected_empty_input),
  fixture.expected_empty_result,
  "empty input output must match expected_empty_result",
);
assert.equal(fixture.expected_empty_result.status, "empty");
assert.equal(fixture.expected_empty_result.decision, "disabled");
assertHarnessBoundary(fixture.expected_empty_result);

const coveredDecisions = new Set([
  fixture.expected_result.decision,
  fixture.expected_empty_result.decision,
]);
const coveredStatuses = new Set([
  fixture.expected_result.status,
  fixture.expected_empty_result.status,
]);

for (const [name, input] of Object.entries(fixture.decision_coverage_inputs)) {
  const actual = helper.buildDisabledProductWriteAdapterHarnessV01(input);
  assert.deepEqual(
    actual,
    fixture.expected_decision_results[name],
    `decision coverage output must match for ${name}`,
  );
  coveredDecisions.add(actual.decision);
  coveredStatuses.add(actual.status);
  assertHarnessBoundary(actual);
}

assertMissingPrerequisite(
  fixture.expected_decision_results.missing_release_readiness_refs_disabled,
  "disabled-harness-prereq:missing:release_readiness_refs",
  "release_readiness_ref_missing",
);
assertMissingPrerequisite(
  fixture.expected_decision_results.missing_product_write_reentry_refs_disabled,
  "disabled-harness-prereq:missing:product_write_reentry_refs",
  "product_write_reentry_ref_missing",
);
assertMissingPrerequisite(
  fixture.expected_decision_results.missing_explicit_reentry_approval_refs_refused,
  "disabled-harness-prereq:missing:explicit_reentry_approval_refs",
  "explicit_reentry_approval_required",
);
assertMissingPrerequisite(
  fixture.expected_decision_results.missing_product_write_target_contract_refs_refused,
  "disabled-harness-prereq:missing:product_write_target_contract_refs",
  "product_write_target_contract_missing",
);

const allRefsResult = fixture.expected_decision_results.all_refs_present_still_refused;
assert.equal(allRefsResult.status, "refused_disabled");
assert.equal(allRefsResult.decision, "refused");
assert.deepEqual(allRefsResult.missing_prerequisite_refs, []);
assertHarnessBoundary(allRefsResult);
assert.equal(
  helper.buildDisabledProductWriteAdapterHarnessV01(
    fixture.decision_coverage_inputs.all_refs_present_still_refused,
  ).harness_fingerprint,
  allRefsResult.harness_fingerprint,
  "all refs present case must remain deterministic",
);
assert.ok(
  JSON.stringify(fixture.decision_coverage_inputs.all_refs_present_still_refused).includes(
    "risk-reduction",
  ),
  "fixture must cover public-safe risk-reduction text",
);
assert.ok(
  JSON.stringify(fixture.decision_coverage_inputs.all_refs_present_still_refused).includes(
    "task-level",
  ),
  "fixture must cover public-safe task-level text",
);

for (const [name, input] of Object.entries(fixture.invalid_inputs)) {
  const actual = helper.buildDisabledProductWriteAdapterHarnessV01(input);
  assert.deepEqual(
    actual,
    fixture.expected_rejection_results[name],
    `rejection output must match for ${name}`,
  );
  coveredDecisions.add(actual.decision);
  coveredStatuses.add(actual.status);
  assert.deepEqual(actual.invocation_previews, [], `${name} must not echo previews`);
  assertHarnessBoundary(actual);
  assertBlockedOutputDoesNotEchoUnsafeValues(input, actual, name);
}

for (const decision of decisions) {
  assert.ok(coveredDecisions.has(decision), `decision covered: ${decision}`);
}
for (const status of statuses) {
  assert.ok(coveredStatuses.has(status), `status covered: ${status}`);
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
  fixture.expected_rejection_results.public_unsafe_invocation.status,
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
      smoke: "disabled-product-write-adapter-reentry-harness-v0-1",
      verified: {
        valid_result: fixture.expected_result.harness_fingerprint,
        empty_result: fixture.expected_empty_result.harness_fingerprint,
        decisions: [...coveredDecisions].sort(),
        statuses: [...coveredStatuses].sort(),
      },
    },
    null,
    2,
  ),
);

function read(path) {
  return readFileSync(path, "utf8");
}

async function importDisabledHarnessHelper() {
  const transformedSource = stripTypeScriptTypes(helperSource, { mode: "transform" });
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`);
}

function assertMissingPrerequisite(result, expectedRef, expectedReasonCode) {
  assert.ok(
    result.missing_prerequisite_refs.includes(expectedRef),
    `result must include missing prerequisite ${expectedRef}`,
  );
  assert.ok(
    result.reason_codes.includes(expectedReasonCode),
    `result must include reason code ${expectedReasonCode}`,
  );
  assert.ok(
    result.decision === "disabled" || result.decision === "refused",
    "missing prerequisite cases must remain disabled/refused",
  );
  assertHarnessBoundary(result);
}

function assertHarnessBoundary(result) {
  assert.equal(result.product_write_executed, false, "must not product-write");
  assert.equal(result.product_id_allocated, false, "must not allocate product ID");
  assert.equal(result.product_persisted, false, "must not persist product");
  assert.equal(
    result.product_write_authority_granted,
    false,
    "must not grant product-write authority",
  );
  assert.equal(result.adapter_enabled, false, "must not enable adapter");
  assert.equal(
    result.adapter_runtime_executed,
    false,
    "must not execute adapter runtime",
  );
  assertAuthorityBoundary(result.authority_boundary, "result.authority_boundary");
  for (const preview of result.invocation_previews) {
    assert.equal(preview.public_safe, true, `${preview.invocation_preview_id} public_safe`);
    assertAuthorityBoundary(
      preview.authority_boundary,
      `preview ${preview.invocation_preview_id}`,
    );
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(
    boundary.disabled_product_write_adapter_harness_now,
    true,
    `${label} must mark disabled harness now`,
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
    /from\s+["'][^"']*adapter-runtime[^"']*["']/,
    /from\s+["'][^"']*product-write-adapter-runtime[^"']*["']/,
  ];
  for (const pattern of forbiddenImports) {
    assert.ok(!pattern.test(helperSource), `helper must not import ${pattern}`);
  }
  for (const marker of [
    "Database",
    "NextResponse",
    "OpenAI",
    "fetch(",
    "GitHub automation",
    "git commit",
    "child_process",
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
    if (marker === "sk-" || marker === "ghp_") continue;
    assert.ok(
      !normalized.includes(marker.toLowerCase()),
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
