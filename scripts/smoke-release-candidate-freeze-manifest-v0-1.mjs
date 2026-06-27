#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const releaseOperatorChecklistDocsPath = "docs/RELEASE_OPERATOR_CHECKLIST_V0_1.md";
const docsPath = "docs/RELEASE_CANDIDATE_FREEZE_MANIFEST_V0_1.md";
const helperPath = "lib/release-readiness/release-candidate-freeze-manifest.ts";
const fixturePath = "fixtures/release-candidate-freeze-manifest.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const manifestVersion = "release_candidate_freeze_manifest.v0.1";
const inputVersion = "release_candidate_freeze_input.v0.1";
const resultVersion = "release_candidate_freeze_result.v0.1";
const itemVersion = "release_candidate_freeze_item.v0.1";
const fixtureVersion = "release_candidate_freeze_manifest.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:release-candidate-freeze-manifest-v0-1";
const packageScriptValue = "node scripts/smoke-release-candidate-freeze-manifest-v0-1.mjs";

const decisions = [
  "freeze_manifest_candidate_only",
  "needs_operator_review",
  "blocked",
  "rejected",
];
const itemKinds = [
  "release_operator_checklist",
  "release_notes_summary",
  "release_candidate_operator_review",
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
  "release_boundary",
  "product_write_boundary",
  "source_lineage",
  "operator_notes",
  "unknown",
];
const severities = ["info", "warning", "blocking", "critical", "unknown"];
const statuses = [
  "built",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
];

const authorityFalseFields = [
  "release_freeze_execution_now",
  "release_execution_now",
  "release_artifact_creation_now",
  "release_notes_publish_now",
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
  "freeze_manifest_is_truth",
  "freeze_manifest_is_proof",
  "freeze_manifest_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
];

const exactDocsPhrases = [
  "Product-write remains parked by #686.",
  "Release Candidate Freeze Manifest is review-only.",
  "Release Candidate Freeze Manifest is candidate-only.",
  "Release Candidate Freeze Manifest is not release freeze.",
  "Release Candidate Freeze Manifest does not freeze a release.",
  "Release Candidate Freeze Manifest does not publish release notes.",
  "Release Candidate Freeze Manifest does not create release artifacts.",
  "Release Candidate Freeze Manifest does not execute release.",
  "Release Candidate Freeze Manifest does not approve release.",
  "Release Candidate Freeze Manifest does not grant release authority.",
  "Release Candidate Freeze Manifest does not grant product-write authority.",
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
  "raw freeze manifest payload",
  "raw checklist payload",
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
  "raw freeze manifest payload blocked by fixture",
  "raw conversation blocked by freeze manifest fixture",
  "hidden reasoning blocked by freeze manifest fixture",
  "telemetry dump blocked by freeze manifest fixture",
  "secret-like freeze manifest input blocked by fixture",
  "sk-test-token-like-000000",
  "ghp_exampleTokenLikeValue000000",
  "risk-reduction",
  "task-level",
];

const forbiddenPositiveAuthorityGrants = authorityFalseFields
  .map((field) => `${field}: true`)
  .concat(authorityFalseFields.map((field) => `"${field}": true`));

const roadmap = read(roadmapPath);
const releaseOperatorChecklistDocs = read(releaseOperatorChecklistDocsPath);
const docs = read(docsPath);
const helperSource = read(helperPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);

assert.ok(
  roadmap.includes("release_candidate_freeze_manifest_v0_1"),
  "roadmap must contain release_candidate_freeze_manifest_v0_1",
);
assert.ok(
  releaseOperatorChecklistDocs.includes("Release Operator Checklist is review-only."),
  "Release Operator Checklist docs must preserve review-only wording",
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.manifest_version, manifestVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.item_version, itemVersion);
assert.equal(fixture.scope, scope);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the release candidate freeze manifest smoke",
);

for (const path of [
  docsPath,
  helperPath,
  fixturePath,
  "scripts/smoke-release-candidate-freeze-manifest-v0-1.mjs",
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

for (const value of [...decisions, ...itemKinds, ...severities, ...statuses]) {
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
  helperSource.includes('collectForbiddenAuthorityObjectFailures(input, "input")'),
  "input validator must recursively scan forbidden authority fields",
);
assert.ok(
  helperSource.includes('collectForbiddenAuthorityObjectFailures(input, "item")'),
  "item validator must recursively scan forbidden authority fields",
);
assert.ok(
  helperSource.includes("includesTokenLikeMarker"),
  "helper must use token-aware marker detection",
);
assert.ok(
  helperSource.includes("buildReleaseCandidateFreezeManifestV01"),
  "helper must export builder",
);
assert.ok(
  helperSource.includes("validateReleaseCandidateFreezeInputV01"),
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

const helper = await importReleaseCandidateFreezeHelper();

assert.deepEqual(
  helper.buildReleaseCandidateFreezeManifestV01(fixture.expected_valid_input),
  fixture.expected_result,
  "valid release candidate freeze manifest output must match expected_result",
);
assert.equal(fixture.expected_result.status, "built");
assert.equal(fixture.expected_result.decision, "freeze_manifest_candidate_only");
assertResultAuthorityClosed(fixture.expected_result);

const repeated = helper.buildReleaseCandidateFreezeManifestV01(fixture.expected_valid_input);
assert.equal(
  repeated.manifest_fingerprint,
  fixture.expected_result.manifest_fingerprint,
  "repeated build must keep the same fingerprint",
);

assert.deepEqual(
  helper.buildReleaseCandidateFreezeManifestV01(fixture.expected_empty_input),
  fixture.expected_empty_result,
  "empty release candidate freeze manifest output must match expected_empty_result",
);
assert.equal(fixture.expected_empty_result.status, "empty");
assert.equal(fixture.expected_empty_result.decision, "blocked");
assertResultAuthorityClosed(fixture.expected_empty_result);

const observedDecisions = new Set([fixture.expected_result.decision]);
for (const [caseName, input] of Object.entries(fixture.decision_coverage_inputs)) {
  const actual = helper.buildReleaseCandidateFreezeManifestV01(input);
  const expected = fixture.expected_decision_results[caseName];
  assert.deepEqual(actual, expected, `${caseName} must match expected decision result`);
  observedDecisions.add(actual.decision);
  assertResultAuthorityClosed(actual);
}
for (const decision of decisions) {
  assert.ok(observedDecisions.has(decision), `fixture must cover decision ${decision}`);
}

const observedItemKinds = new Set();
const observedSeverities = new Set();
for (const input of [
  fixture.expected_valid_input,
  ...Object.values(fixture.decision_coverage_inputs),
]) {
  for (const item of input.input_items) {
    observedItemKinds.add(item.item_kind);
    observedSeverities.add(item.severity);
  }
}
for (const itemKind of itemKinds) {
  assert.ok(observedItemKinds.has(itemKind), `fixture must cover item kind ${itemKind}`);
}
for (const severity of severities) {
  assert.ok(observedSeverities.has(severity), `fixture must cover severity ${severity}`);
}

assertDecisionCase(
  "missing_release_operator_checklist_item_blocked",
  "blocked",
  "release-candidate-freeze-manifest-item:missing:release_operator_checklist",
  "mandatory_manifest_item_missing",
);
assertDecisionCase(
  "missing_release_boundary_item_blocked",
  "blocked",
  "release-candidate-freeze-manifest-item:missing:release_boundary",
  "mandatory_manifest_item_missing",
);
assertDecisionCase(
  "missing_source_lineage_item_blocked",
  "blocked",
  "release-candidate-freeze-manifest-item:missing:source_lineage",
  "mandatory_manifest_item_missing",
);
assertDecisionCase(
  "missing_product_write_boundary_item_blocked",
  "blocked",
  "release-candidate-freeze-manifest-item:missing:product_write_boundary",
  "mandatory_manifest_item_missing",
);
assert.equal(
  fixture.expected_decision_results.excluded_blocking_item_blocked.decision,
  "blocked",
);
assert.ok(
  fixture.expected_decision_results.excluded_blocking_item_blocked.reason_codes.includes(
    "blocking_item_present",
  ),
  "excluded blocking item must record blocking_item_present",
);
assert.equal(
  fixture.expected_decision_results.excluded_warning_item_needs_operator_review
    .decision,
  "needs_operator_review",
);
assert.equal(
  fixture.expected_decision_results.unknown_item_kind_rejected.decision,
  "rejected",
);
assert.equal(
  fixture.expected_decision_results.harmless_unknown_boolean_allowed.status,
  "built",
  "harmless unknown booleans must not be blocked",
);

for (const [caseName, input] of Object.entries(fixture.invalid_inputs)) {
  const actual = helper.buildReleaseCandidateFreezeManifestV01(input);
  const expected = fixture.expected_rejection_results[caseName];
  assert.deepEqual(actual, expected, `${caseName} must match expected rejection result`);
  assert.equal(actual.items.length, 0, `${caseName} must not include output items`);
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
assert.equal(
  fixture.expected_rejection_results.unknown_top_level_authority_true.status,
  "blocked_invalid_input",
);
assert.equal(
  fixture.expected_rejection_results.unknown_item_level_authority_true.status,
  "blocked_invalid_input",
);

const publicSafeHyphenInput = structuredClone(fixture.expected_valid_input);
publicSafeHyphenInput.manifest_id = "release-candidate-freeze-manifest:hyphen-safe";
publicSafeHyphenInput.input_items[0].bounded_summary =
  "Public-safe risk-reduction and task-level release candidate freeze manifest summary.";
const publicSafeHyphenResult =
  helper.buildReleaseCandidateFreezeManifestV01(publicSafeHyphenInput);
assert.equal(
  publicSafeHyphenResult.status,
  "built",
  "risk-reduction/task-level public-safe text must not be blocked",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "release-candidate-freeze-manifest-v0-1",
      verified: {
        valid_result: fixture.expected_result.manifest_fingerprint,
        empty_result: fixture.expected_empty_result.manifest_fingerprint,
        decisions: [...observedDecisions].sort(),
        item_kinds: [...observedItemKinds].sort(),
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
    result.missing_item_refs.includes(missingRef),
    `${caseName} must include ${missingRef}`,
  );
  assert.ok(
    result.reason_codes.includes(reasonCode),
    `${caseName} must include ${reasonCode}`,
  );
  assertResultAuthorityClosed(result);
}

function assertResultAuthorityClosed(result) {
  assert.equal(result.release_frozen, false, "release_frozen must be false");
  assert.equal(result.release_executed, false, "release_executed must be false");
  assert.equal(
    result.release_artifact_created,
    false,
    "release_artifact_created must be false",
  );
  assert.equal(
    result.release_notes_published,
    false,
    "release_notes_published must be false",
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
  for (const item of result.items ?? []) {
    assert.equal(item.public_safe, true, "result item must be public safe");
    assertAuthorityBoundary(item.authority_boundary);
  }
}

function assertAuthorityBoundary(authorityBoundary) {
  assert.equal(
    authorityBoundary.release_candidate_freeze_manifest_now,
    true,
    "release_candidate_freeze_manifest_now must be true",
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
    "release freeze execution was added",
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
    !/\bsk-[a-z0-9_-]{8,}/i.test(fixtureText),
    "fixture must not contain token-like sk marker outside allowed placeholders",
  );
  assert.ok(
    !/\bghp_[a-z0-9_]{8,}/i.test(fixtureText),
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
    /release-freeze/i,
    /product-write-adapter-runtime/i,
    /route\.ts/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(helperSource), `helper must not match ${pattern}`);
  }
}

async function importReleaseCandidateFreezeHelper() {
  const stripped = stripTypeScriptTypes(helperSource, { mode: "strip" });
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}
