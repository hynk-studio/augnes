#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_3.md";
const fixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.3.json";
const smokePath = "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-3.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const previousDocsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_2.md";
const previousFixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.2.json";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const acceptedEvidenceRefDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const acceptedEvidenceRefFixturePath =
  "fixtures/product-write-accepted-evidence-ref-runtime.sample.v0.1.json";
const acceptedEvidenceRefSmokePath =
  "scripts/smoke-product-write-accepted-evidence-ref-runtime-v0-1.mjs";
const acceptedEvidenceRefRoutePath = "app/api/product-write/accepted-evidence-refs/route.ts";
const acceptedEvidenceRefRuntimePath = "lib/product-write/accepted-evidence-ref-runtime.ts";
const acceptedEvidenceRefStorePath = "lib/product-write/accepted-evidence-ref-store.ts";
const acceptedEvidenceRefTypePath = "types/product-write-accepted-evidence-ref.ts";
const targetContractDocsPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const reentryReviewDocsPath = "docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md";
const disabledHarnessDocsPath = "docs/DISABLED_PRODUCT_WRITE_ADAPTER_REENTRY_HARNESS_V0_1.md";

const fixtureVersion = "v0_2_1_remaining_runtime_gap_audit.sample.v0.3";
const auditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_3";
const previousAuditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_2";
const acceptedEvidenceRefRuntimeRef = "product_write_accepted_evidence_ref_runtime_v0_1";
const scope = "project:augnes";
const packageScriptName = "smoke:v0-2-1-remaining-runtime-gap-audit-v0-3";
const packageScriptValue = "node scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-3.mjs";

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
]);

const requiredFiles = [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  previousDocsPath,
  previousFixturePath,
  roadmapPath,
  acceptedEvidenceRefDocsPath,
  acceptedEvidenceRefFixturePath,
  acceptedEvidenceRefSmokePath,
  acceptedEvidenceRefRoutePath,
  acceptedEvidenceRefRuntimePath,
  acceptedEvidenceRefStorePath,
  acceptedEvidenceRefTypePath,
  targetContractDocsPath,
  reentryReviewDocsPath,
  disabledHarnessDocsPath,
];

for (const filePath of requiredFiles) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docsText = readText(docsPath);
const normalizedDocsText = normalizeWhitespace(docsText);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const previousDocsText = readText(previousDocsPath);
const previousFixtureText = readText(previousFixturePath);
const acceptedDocsText = readText(acceptedEvidenceRefDocsPath);
const acceptedSmokeText = readText(acceptedEvidenceRefSmokePath);
const acceptedRouteText = readText(acceptedEvidenceRefRoutePath);
const acceptedRuntimeText = readText(acceptedEvidenceRefRuntimePath);

assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue, "package script");
assertIncludes(indexText, "v0.2.1 Remaining Runtime Gap Audit v0.3", "latest index title");
assertIncludes(indexText, docsPath, "latest index docs pointer");
assertIncludes(indexText, fixturePath, "latest index fixture pointer");
assertIncludes(indexText, smokePath, "latest index smoke pointer");
assertIncludes(indexText, packageScriptName, "latest index package script pointer");
assertIncludes(indexText, auditVersion, "latest index audit marker");

assertIncludes(previousDocsText, previousAuditVersion, "v0.2 audit marker in docs");
assertIncludes(previousFixtureText, previousAuditVersion, "v0.2 audit marker in fixture");
assertIncludes(docsText, previousDocsPath, "v0.3 references v0.2 audit docs");
assertIncludes(docsText, previousAuditVersion, "v0.3 references v0.2 audit version");
assertIncludes(fixture.previous_audit_version, previousAuditVersion, "fixture previous audit version");
assertIncludes(docsText, "PR #842", "v0.3 references PR #842");
assertIncludes(docsText, acceptedEvidenceRefRuntimeRef, "v0.3 references accepted evidence ref runtime");
assertIncludes(fixtureText, acceptedEvidenceRefRuntimeRef, "fixture references accepted evidence ref runtime");
assertIncludes(acceptedDocsText, acceptedEvidenceRefRuntimeRef, "#842 docs runtime marker");
assertIncludes(acceptedSmokeText, acceptedEvidenceRefRuntimeRef, "#842 smoke runtime marker");
assertIncludes(acceptedRouteText, "requestHasSameOriginBoundary", "#842 route same-origin helper");
assertIncludes(acceptedRuntimeText, "isFalseLikeAuthorityValue", "#842 runtime fail-closed helper");
assertIncludes(acceptedRuntimeText, "preflightAcceptedEvidenceRefRuntimeV01", "#842 runtime preflight helper");

for (const section of [
  "## Purpose",
  "## Relationship to v0.2 audit",
  "## Relationship to PR #842 / Product Write Accepted Evidence Ref Runtime v0.1",
  "## What #842 completed",
  "## What #842 explicitly did not complete",
  "## Product-write state after #842",
  "## Phase-by-phase delta",
  "## Runtime-complete surfaces added since v0.2",
  "## Remaining gated work",
  "## Ungated implementation gaps",
  "## Next recommended implementation slice",
  "## Evidence refs",
  "## Authority boundary",
  "## Fixture policy",
  "## Verification expectations",
]) {
  assertIncludes(docsText, section, `required docs section ${section}`);
}

for (const phrase of [
  "This is not roadmap completion closeout.",
  "This is not release approval.",
  "This is not release execution.",
  "This is not broad product-write approval.",
  "This is not product ID allocation approval.",
  "This is not product-write adapter enablement.",
  "This is not GitHub actuation approval.",
  "This is not final RAG answer generation approval.",
  "This audit is static. It does not implement new runtime behavior.",
  "This PR does not implement new runtime beyond audit/grounding docs, fixture, and smoke.",
  "This PR does not grant additional product-write authority.",
  "This PR confirms #842 as the first completed `accepted_evidence_records` product-write target only.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
]) {
  assertIncludes(normalizedDocsText, phrase, `docs phrase ${phrase}`);
}

for (const phrase of [
  "product_write_minimal_runtime_v0_1` is no longer completely unopened",
  "product_write_accepted_evidence_ref_runtime_v0_1",
  "`accepted_evidence_records` first target only",
  "caller-injected SQLite accepted evidence ref write store",
  "runtime validation and idempotency",
  "same-origin POST/GET route",
  "optional bounded audit event emission",
  "fail-closed forbidden authority validation for non-false-like values",
  "DB-free preflight before product DB open",
  "no product DB creation for invalid, forbidden, private, missing-prerequisite,",
  "GET same-origin boundary",
]) {
  assertIncludes(normalizedDocsText, phrase, `completed #842 phrase ${phrase}`);
}

for (const phrase of [
  "product ID allocation remains approval-gated",
  "broad product persistence remains approval-gated",
  "product-write adapter enablement remains approval-gated",
  "GitHub actuation remains approval-gated",
  "release execution/publication remains approval-gated",
  "final RAG answer generation remains approval-gated",
  "proof/work-item creation remains not opened by #842",
  "durable Perspective state mutation from product-write remains not opened by",
  "string true blocked",
  "numeric one blocked",
  "object enabled blocked",
  "array enabled blocked",
  "no product DB creation before preflight",
  "missing lineage DB no-create behavior",
  "GET same-origin boundary",
]) {
  assertIncludes(normalizedDocsText, phrase, `boundary phrase ${phrase}`);
}

for (const phrase of [
  "string true blocked",
  "numeric one blocked",
  "object enabled blocked",
  "array enabled blocked",
  "no product DB creation before preflight",
  "missing lineage DB no-create behavior",
  "GET same-origin boundary",
]) {
  assertIncludes(fixtureText, phrase, `fixture boundary phrase ${phrase}`);
}

for (const phrase of [
  "roadmap completion",
  "release approval",
  "release execution",
  "broad product-write approval",
  "product ID allocation claim",
  "smoke or CI truth claim",
]) {
  assertNoPositiveClaim(normalizedDocsText, phrase, `docs no positive ${phrase}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.audit_version, auditVersion);
assert.equal(fixture.previous_audit_version, previousAuditVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.roadmap_ref, roadmapPath);
assert.equal(fixture.product_write_accepted_evidence_ref_runtime_ref, acceptedEvidenceRefDocsPath);
assert.equal(fixture.remaining_work_exists, true);
assert.equal(fixture.ungated_implementation_gap_exists, false);
assert.equal(fixture.no_remaining_work_claim, false);
assert.deepEqual(fixture.ungated_implementation_gaps, []);
assert.equal(
  fixture.next_recommended_implementation_slice.item_ref,
  "none_without_explicit_approval",
  "next slice remains none_without_explicit_approval",
);

assertArrayIncludes(
  fixture.product_write_state_after_842.completed,
  "product_write_accepted_evidence_ref_runtime_v0_1",
  "completed runtime marker",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.completed,
  "accepted_evidence_records first target only",
  "completed first target marker",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "product ID allocation",
  "product ID allocation remains gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "broad product persistence",
  "broad product persistence remains gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "product-write adapter enablement",
  "product-write adapter remains gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "GitHub actuation",
  "GitHub actuation remains gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "release execution/publication",
  "release execution remains gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "final RAG answer generation",
  "final RAG answer generation remains gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "proof records",
  "proof records remain gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "work items",
  "work items remain gated",
);
assertArrayIncludes(
  fixture.product_write_state_after_842.still_gated,
  "durable Perspective state mutation from product-write",
  "durable state mutation remains gated",
);

assert.equal(fixture.completed_first_product_write_target.first_target_only, true);
assert.equal(fixture.completed_first_product_write_target.target_group, "accepted_evidence_records");
assert.equal(
  fixture.completed_first_product_write_target.classification,
  "runtime_complete_first_target_only",
);
for (const ref of fixture.completed_first_product_write_target.evidence_refs) {
  assert.ok(existsSync(ref), `#842 evidence ref exists: ${ref}`);
}

for (const gatedRef of [
  "product_id_allocation",
  "broad_product_persistence",
  "product_write_adapter_enablement",
  "github_actuation",
  "release_execution_publication",
  "final_rag_answer_generation",
  "proof_work_item_creation",
  "durable_perspective_state_mutation_from_product_write",
]) {
  const entry = fixture.gated_work_items.find((item) => item.item_ref === gatedRef);
  assert(entry, `gated item exists: ${gatedRef}`);
  assert.equal(entry.opened_by_842, false, `${gatedRef} not opened by #842`);
}

assertAuthorityBoundary(fixture.authority_boundary);
assertPublicSafeFixturePolicy(fixture.public_safe_fixture_policy);

for (const ref of fixture.evidence_refs) {
  assert.ok(existsSync(ref), `top-level evidence ref exists: ${ref}`);
}

assertPublicSafeText(docsText, docsPath);
assertPublicSafeText(fixtureText, fixturePath);
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "v0-2-1-remaining-runtime-gap-audit-v0-3",
      final_status: "pass",
      audit_version: auditVersion,
      previous_audit_version: fixture.previous_audit_version,
      completed_first_product_write_target:
        fixture.completed_first_product_write_target.item_ref,
      next_recommended_implementation_slice:
        fixture.next_recommended_implementation_slice.item_ref,
      gated_work_items: fixture.gated_work_items.length,
    },
    null,
    2,
  ),
);

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), `${label} missing ${needle}`);
}

function assertArrayIncludes(values, expected, label) {
  assert.ok(Array.isArray(values), `${label} array`);
  assert.ok(values.includes(expected), `${label} missing ${expected}`);
}

function assertNoPositiveClaim(text, claim, label) {
  const forbidden = [
    `${claim} approved`,
    `${claim} complete`,
    `${claim} is approved`,
    `${claim} is complete`,
    `${claim} executed`,
  ];
  for (const phrase of forbidden) {
    assert.ok(!text.includes(phrase), `${label}: ${phrase}`);
  }
}

function assertAuthorityBoundary(boundary) {
  assert(boundary && typeof boundary === "object", "authority boundary object");
  for (const field of [
    "remaining_runtime_gap_audit_now",
    "static_repo_grounded_audit_only",
    "postmerge_grounding_after_842",
    "docs_fixture_smoke_package_index_only",
  ]) {
    assert.equal(boundary[field], true, `authority ${field} true`);
  }
  for (const field of [
    "new_runtime_capability_now",
    "route_now",
    "ui_now",
    "db_query_or_write_now",
    "product_write_target_opened_now",
    "additional_product_write_authority_granted_now",
    "product_id_allocation_now",
    "broad_product_persistence_now",
    "product_write_adapter_enabled_now",
    "product_object_creation_now",
    "product_profile_creation_now",
    "product_publication_now",
    "github_actuation_now",
    "github_api_call_now",
    "release_execution_now",
    "release_publication_now",
    "final_rag_answer_generation_now",
    "proof_record_creation_now",
    "work_item_creation_now",
    "durable_perspective_state_mutation_from_product_write_now",
    "provider_call_now",
    "prompt_sent_now",
    "retrieval_rag_execution_now",
    "source_fetch_now",
    "background_job_now",
    "automatic_product_generation_now",
    "roadmap_completion_claim_now",
    "release_approval_now",
    "broad_product_write_approval_now",
    "smoke_pass_is_truth",
    "ci_pass_is_truth",
  ]) {
    assert.equal(boundary[field], false, `authority ${field} false`);
  }
}

function assertPublicSafeFixturePolicy(policy) {
  assert(policy && typeof policy === "object", "public safe fixture policy object");
  assert.equal(policy.repo_relative_refs_only, true);
  assert.equal(
    policy.blocks_raw_private_provider_retrieval_db_conversation_hidden_reasoning_telemetry_raw_diff_payloads,
    true,
  );
  for (const field of [
    "raw_source_bodies_allowed",
    "raw_provider_output_allowed",
    "raw_retrieval_output_allowed",
    "raw_db_rows_allowed",
    "raw_conversations_allowed",
    "hidden_reasoning_allowed",
    "telemetry_dumps_allowed",
    "raw_diffs_allowed",
    "private_paths_allowed",
    "private_urls_allowed",
    "secrets_allowed",
  ]) {
    assert.equal(policy[field], false, `policy ${field} false`);
  }
}

function assertPublicSafeText(text, label) {
  const forbiddenPatterns = [
    { pattern: /\/Users\//, label: "mac user path" },
    { pattern: /\/home\//, label: "home path" },
    { pattern: /file:\/\//, label: "file URL" },
    { pattern: /\bsk-[A-Za-z0-9_-]{8,}\b/, label: "OpenAI-like token" },
    { pattern: /\bghp_[A-Za-z0-9_]{8,}\b/, label: "GitHub token" },
    { pattern: /\bgithub_pat_[A-Za-z0-9_]{8,}\b/, label: "GitHub fine-grained token" },
    { pattern: /\bOPENAI_API_KEY\b/, label: "OpenAI env var" },
    { pattern: /\bGITHUB_TOKEN\b/, label: "GitHub env var" },
    { pattern: /raw source body:/i, label: "raw source body payload" },
    { pattern: /raw provider output:/i, label: "raw provider output payload" },
    { pattern: /raw retrieval output:/i, label: "raw retrieval output payload" },
    { pattern: /raw DB row:/i, label: "raw DB row payload" },
    { pattern: /raw conversation:/i, label: "raw conversation payload" },
    { pattern: /hidden reasoning:/i, label: "hidden reasoning payload" },
    { pattern: /telemetry dump:/i, label: "telemetry dump payload" },
    { pattern: /diff --git/i, label: "raw diff payload" },
  ];
  for (const { pattern, label: markerLabel } of forbiddenPatterns) {
    assert.doesNotMatch(text, pattern, `${label} must not contain ${markerLabel}`);
  }
}

function assertChangedFileScope() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const filePath of runGitLines(args)) {
      if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
    }
  }

  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only", "main...HEAD"],
  ]) {
    const lines = runGitLines(args, { allowFailure: true });
    for (const filePath of lines) {
      if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
    }
    if (lines.length > 0) break;
  }

  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], "changed-file scope limited to v0.3 docs/fixture/smoke/package/index files");
}

function isTempSmokeArtifact(filePath) {
  return filePath.startsWith(".tmp/") || filePath.startsWith("tmp/");
}

function runGitLines(args, options = {}) {
  try {
    const output = execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (options.allowFailure) return [];
    throw error;
  }
}
