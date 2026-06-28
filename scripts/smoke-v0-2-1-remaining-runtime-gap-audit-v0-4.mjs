#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_4.md";
const fixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.4.json";
const smokePath = "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-4.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const previousDocsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_3.md";
const previousFixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.3.json";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const finalRagDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const finalRagFixturePath = "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const finalRagSmokePath = "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs";
const finalRagRoutePath = "app/api/research-retrieval/final-rag-answer/route.ts";
const finalRagBuilderPath = "lib/research-retrieval/build-final-rag-answer-candidate.ts";
const finalRagProviderBoundaryPath =
  "lib/research-retrieval/final-rag-answer-provider-boundary.ts";
const finalRagTypePath = "types/final-rag-answer-candidate-review.ts";
const ragContextPreviewDocsPath = "docs/RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_V0_1.md";
const retrievalIndexDocsPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md";
const providerExtractionDocsPath = "docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_V0_1.md";
const productWriteAcceptedEvidenceRefDocsPath =
  "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";

const fixtureVersion = "v0_2_1_remaining_runtime_gap_audit.sample.v0.4";
const auditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_4";
const previousAuditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_3";
const finalRagRuntimeRef = "final_rag_answer_generation_candidate_review_v0_1";
const productWriteRuntimeRef = "product_write_accepted_evidence_ref_runtime_v0_1";
const packageScriptName = "smoke:v0-2-1-remaining-runtime-gap-audit-v0-4";
const packageScriptValue = "node scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-4.mjs";
const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-3.mjs",
]);

for (const filePath of [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  previousDocsPath,
  previousFixturePath,
  roadmapPath,
  finalRagDocsPath,
  finalRagFixturePath,
  finalRagSmokePath,
  finalRagRoutePath,
  finalRagBuilderPath,
  finalRagProviderBoundaryPath,
  finalRagTypePath,
  ragContextPreviewDocsPath,
  retrievalIndexDocsPath,
  providerExtractionDocsPath,
  productWriteAcceptedEvidenceRefDocsPath,
]) {
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
const finalRagDocsText = readText(finalRagDocsPath);
const finalRagFixtureText = readText(finalRagFixturePath);
const finalRagSmokeText = readText(finalRagSmokePath);
const finalRagRouteText = readText(finalRagRoutePath);
const finalRagBuilderText = readText(finalRagBuilderPath);
const finalRagProviderBoundaryText = readText(finalRagProviderBoundaryPath);
const ragContextPreviewDocsText = readText(ragContextPreviewDocsPath);
const providerExtractionDocsText = readText(providerExtractionDocsPath);
const productWriteAcceptedEvidenceRefDocsText = readText(productWriteAcceptedEvidenceRefDocsPath);

assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue, "package script");
for (const needle of [
  "v0.2.1 Remaining Runtime Gap Audit v0.4",
  docsPath,
  fixturePath,
  smokePath,
  packageScriptName,
  auditVersion,
]) {
  assertIncludes(indexText, needle, `latest index pointer ${needle}`);
}

assertIncludes(previousDocsText, previousAuditVersion, "v0.3 docs marker");
assertIncludes(previousFixtureText, previousAuditVersion, "v0.3 fixture marker");
assertIncludes(docsText, previousDocsPath, "v0.4 references v0.3 audit");
assertIncludes(docsText, previousAuditVersion, "v0.4 references v0.3 audit version");
assert.equal(fixture.previous_audit_version, previousAuditVersion);
assert.equal(fixture.previous_audit_ref, previousDocsPath);
assertIncludes(docsText, "PR #844", "v0.4 references PR #844");
assertIncludes(docsText, finalRagRuntimeRef, "v0.4 references final RAG runtime");
assertIncludes(fixtureText, finalRagRuntimeRef, "fixture references final RAG runtime");

for (const [text, marker, label] of [
  [finalRagDocsText, finalRagRuntimeRef, "#844 docs runtime marker"],
  [finalRagFixtureText, finalRagRuntimeRef, "#844 fixture runtime marker"],
  [finalRagSmokeText, "final-rag-answer-generation-candidate-review-v0-1", "#844 smoke runtime marker"],
  [finalRagRouteText, finalRagRuntimeRef, "#844 route runtime marker"],
  [finalRagBuilderText, finalRagRuntimeRef, "#844 builder runtime marker"],
  [finalRagDocsText, "context-backed source refs only", "#844 docs citation marker"],
  [finalRagSmokeText, "provider_cited_unbacked_source_ref", "#844 smoke unbacked citation marker"],
  [finalRagBuilderText, "provider_cited_unbacked_source_ref", "#844 builder unbacked citation marker"],
  [finalRagProviderBoundaryText, "raw_provider_output", "#844 raw key boundary marker"],
  [finalRagRouteText, "final_rag_answer_candidate_review_runtime", "#844 audit surface marker"],
  [ragContextPreviewDocsText, "Context preview is a review aid", "RAG context review aid marker"],
  [providerExtractionDocsText, "candidate", "provider extraction candidate marker"],
  [productWriteAcceptedEvidenceRefDocsText, productWriteRuntimeRef, "product-write accepted evidence ref marker"],
]) {
  assertIncludes(text, marker, label);
}
assert.doesNotMatch(finalRagRouteText, /export\s+async\s+function\s+GET\b/, "no GET provider execution route");

for (const section of [
  "## Purpose",
  "## Relationship to v0.3 audit",
  "## Relationship to PR #844 / Final RAG Answer Candidate Review v0.1",
  "## What #844 completed",
  "## What #844 explicitly did not complete",
  "## Final RAG state after #844",
  "## Product-write state after #844",
  "## Phase-by-phase delta",
  "## Runtime-complete surfaces added since v0.3",
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
  "This is not proof/evidence creation approval.",
  "This is not promotion approval.",
  "This is not durable state mutation approval.",
  "This is not Formation Receipt write approval.",
  "This is not product-write approval.",
  "This is not accepted evidence ref write approval.",
  "This is not product ID allocation approval.",
  "This is not GitHub actuation approval.",
  "This is not live provider approval.",
  "This audit is static. It does not implement new runtime behavior.",
  "This PR does not implement new runtime beyond audit/grounding docs, fixture,",
  "This PR confirms #844 as final RAG answer candidate/review runtime only.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
]) {
  assertIncludes(normalizedDocsText, phrase, `docs phrase ${phrase}`);
}

for (const phrase of [
  "final_rag_answer_generation_candidate_review_v0_1",
  "runtime-complete for the candidate/review layer only",
  "same-origin POST route",
  "bounded prompt descriptor",
  "deterministic `mock_provider` path",
  "configured-provider missing-key graceful refusal",
  "context-backed provider citation enforcement",
  "unbacked provider citations reject candidate generation",
  "private/raw key blocking, not only private/raw value blocking",
  "final_rag_answer_candidate_review_runtime",
  "no GET provider execution route",
  "no raw prompt storage",
  "no raw provider output storage",
  "no hidden reasoning storage",
  "no source fetch",
  "no retrieval index write",
  "no product-write",
  "no proof/evidence write",
  "no promotion",
  "no durable state mutation",
  "Final answer candidate is not truth.",
  "Final answer candidate is not proof.",
  "Final answer candidate is not accepted evidence.",
  "Final answer candidate is not promotion readiness.",
  "Final answer candidate is not product.",
  "Provider output remains candidate-only.",
  "Retrieval result remains non-authoritative.",
  "Retrieval score is not truth score or promotion readiness.",
  "Context preview remains a review aid.",
]) {
  assertIncludes(normalizedDocsText, phrase, `docs boundary phrase ${phrase}`);
}

for (const phrase of [
  "proof/evidence creation remains approval-gated",
  "claim/evidence writes remain approval-gated",
  "Review Memory writes remain approval-gated",
  "promotion remains approval-gated",
  "durable Perspective state mutation remains approval-gated",
  "Formation Receipt writes remain approval-gated",
  "product-write from final answer remains approval-gated",
  "accepted evidence ref write from final answer remains approval-gated",
  "product ID allocation remains approval-gated",
  "product-write adapter enablement remains approval-gated",
  "broad product persistence remains approval-gated",
  "GitHub actuation remains approval-gated",
  "release execution/publication remains approval-gated",
  "live provider validation remains deferred",
]) {
  assertIncludes(normalizedDocsText, phrase, `gated docs phrase ${phrase}`);
}

for (const phrase of [
  "context-backed provider citation enforcement",
  "unbacked provider citation rejection",
  "private/raw key blocking",
  "final_rag_answer_candidate_review_runtime audit surface",
  "proof/evidence creation",
  "claim/evidence writes",
  "Review Memory writes",
  "promotion",
  "durable Perspective state write/apply",
  "Formation Receipt writes",
  "product-write from final answer",
  "accepted evidence ref write from final answer",
  "product ID allocation",
  "product-write adapter enablement",
  "broad product persistence",
  "GitHub actuation",
  "release execution/publication",
  "live provider validation",
  "source fetching",
  "retrieval index write",
  "automatic answer-to-product conversion",
]) {
  assertIncludes(fixtureText, phrase, `fixture phrase ${phrase}`);
}

for (const phrase of [
  "roadmap completion",
  "release approval",
  "release execution",
  "broad product-write approval",
  "product ID allocation claim",
  "proof/evidence creation claim",
  "promotion completion claim",
  "durable state mutation claim",
  "smoke or CI truth claim",
]) {
  assertNoPositiveClaim(normalizedDocsText, phrase, `docs no positive ${phrase}`);
}

assert.equal(fixture.fixture_version, "v0_2_1_remaining_runtime_gap_audit.sample.v0.4");
assert.equal(fixture.audit_version, auditVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.roadmap_ref, roadmapPath);
assert.equal(fixture.final_rag_answer_candidate_review_runtime_ref, finalRagDocsPath);
assert.equal(
  fixture.product_write_accepted_evidence_ref_runtime_ref,
  productWriteAcceptedEvidenceRefDocsPath,
);
assert.equal(fixture.remaining_work_exists, true);
assert.equal(fixture.ungated_implementation_gap_exists, false);
assert.equal(fixture.no_remaining_work_claim, false);
assert.deepEqual(fixture.ungated_implementation_gaps, []);
assert.equal(fixture.next_recommended_implementation_slice.item_ref, "none_without_explicit_approval");

for (const completed of [
  "final_rag_answer_generation_candidate_review_v0_1",
  "candidate/review layer only",
  "same-origin POST route",
  "bounded prompt descriptor",
  "deterministic mock provider path",
  "configured provider missing-key graceful refusal",
  "context-backed provider citation enforcement",
  "unbacked provider citations reject candidate generation",
  "private/raw keys and values blocked",
  "final_rag_answer_candidate_review_runtime audit surface",
  "no GET provider execution route",
  "no raw prompt storage",
  "no raw provider output storage",
  "no hidden reasoning storage",
  "no source fetch",
  "no retrieval index write",
  "no product-write",
  "no proof/evidence write",
  "no promotion",
  "no durable state mutation",
]) {
  assertArrayIncludes(fixture.final_rag_state_after_844.completed, completed, completed);
}

for (const marker of [
  "final answer candidate is not truth",
  "final answer candidate is not proof",
  "final answer candidate is not accepted evidence",
  "final answer candidate is not promotion",
  "final answer candidate is not product",
  "provider output remains candidate-only",
  "retrieval result remains non-authoritative",
  "retrieval score remains not truth/promotion readiness",
  "context preview remains review aid",
]) {
  assertArrayIncludes(fixture.final_rag_state_after_844.non_authoritative_boundaries, marker, marker);
}

for (const gated of [
  "proof/evidence creation",
  "claim/evidence writes",
  "Review Memory writes",
  "promotion",
  "durable Perspective state write/apply",
  "Formation Receipt writes",
  "product-write from final answer",
  "accepted evidence ref write from final answer",
  "product ID allocation",
  "product-write adapter enablement",
  "broad product persistence",
  "GitHub actuation",
  "release execution/publication",
  "live provider validation",
  "source fetching",
  "retrieval index write",
  "automatic answer-to-product conversion",
]) {
  assertArrayIncludes(fixture.final_rag_state_after_844.still_gated, gated, `${gated} gated`);
}

assert.equal(
  fixture.product_write_state_after_844.completed_first_target_remains,
  "product_write_accepted_evidence_ref_runtime_v0_1 remains completed first target only",
);
for (const field of [
  "did_not_add_product_write_target",
  "did_not_write_accepted_evidence_refs",
  "did_not_allocate_product_ids",
  "did_not_enable_product_write_adapter",
  "did_not_add_broad_product_persistence",
  "still_limited_to_842_first_target_only",
]) {
  assert.equal(fixture.product_write_state_after_844[field], true, `product-write state ${field}`);
}

const finalRagSurface = fixture.completed_runtime_surfaces_after_844.find(
  (surface) => surface.item_ref === finalRagRuntimeRef,
);
assert(finalRagSurface, "final RAG completed runtime surface exists");
assert.equal(finalRagSurface.classification, "runtime_complete_candidate_review_layer_only");
assert.equal(finalRagSurface.opened_by_pr, 844);

const productWriteSurface = fixture.completed_runtime_surfaces_after_844.find(
  (surface) => surface.item_ref === productWriteRuntimeRef,
);
assert(productWriteSurface, "product-write completed runtime surface exists");
assert.equal(productWriteSurface.classification, "runtime_complete_first_target_only");
assert.equal(productWriteSurface.opened_by_pr, 842);

for (const gatedRef of [
  "proof_evidence_creation",
  "claim_evidence_writes",
  "review_memory_writes",
  "promotion",
  "durable_perspective_state_write_apply",
  "formation_receipt_writes",
  "product_write_from_final_answer",
  "accepted_evidence_ref_write_from_final_answer",
  "product_id_allocation",
  "product_write_adapter_enablement",
  "broad_product_persistence",
  "github_actuation",
  "release_execution_publication",
  "live_provider_validation",
  "source_fetching",
  "retrieval_index_write",
  "automatic_answer_to_product_conversion",
]) {
  const entry = fixture.gated_work_items.find((item) => item.item_ref === gatedRef);
  assert(entry, `gated item exists: ${gatedRef}`);
  assert.equal(entry.opened_by_844, false, `${gatedRef} not opened by #844`);
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
      smoke: "v0-2-1-remaining-runtime-gap-audit-v0-4",
      final_status: "pass",
      audit_version: auditVersion,
      previous_audit_version: fixture.previous_audit_version,
      completed_final_rag_surface: finalRagSurface.item_ref,
      next_recommended_implementation_slice: fixture.next_recommended_implementation_slice.item_ref,
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
    "postmerge_grounding_after_844",
    "docs_fixture_smoke_package_index_only",
  ]) {
    assert.equal(boundary[field], true, `authority ${field} true`);
  }
  for (const field of [
    "new_runtime_capability_now",
    "route_now",
    "ui_now",
    "db_query_or_write_now",
    "provider_call_now",
    "prompt_sent_now",
    "live_provider_validation_now",
    "proof_evidence_creation_now",
    "claim_evidence_write_now",
    "review_memory_write_now",
    "promotion_now",
    "durable_perspective_state_write_now",
    "durable_perspective_state_apply_now",
    "formation_receipt_write_now",
    "product_write_now",
    "accepted_evidence_ref_write_now",
    "product_id_allocation_now",
    "product_write_adapter_enabled_now",
    "broad_product_persistence_now",
    "github_actuation_now",
    "github_api_call_now",
    "git_write_now",
    "release_execution_now",
    "release_publication_now",
    "source_fetch_now",
    "retrieval_index_write_now",
    "background_job_now",
    "automatic_answer_to_product_conversion_now",
    "roadmap_completion_claim_now",
    "release_approval_now",
    "broad_product_write_approval_now",
    "product_id_allocation_claim_now",
    "proof_evidence_creation_claim_now",
    "promotion_completion_claim_now",
    "durable_state_mutation_claim_now",
    "smoke_pass_is_truth",
    "ci_pass_is_truth",
  ]) {
    assert.equal(boundary[field], false, `authority ${field} false`);
  }
}

function assertPublicSafeFixturePolicy(policy) {
  assert(policy && typeof policy === "object", "public safe fixture policy object");
  assert.equal(policy.repo_relative_refs_only, true);
  assert.equal(policy.symbolic_refs_only, true);
  assert.equal(
    policy.blocks_raw_private_provider_retrieval_db_conversation_hidden_reasoning_telemetry_raw_diff_terminal_github_payloads,
    true,
  );
  for (const field of [
    "raw_prompt_allowed",
    "raw_source_bodies_allowed",
    "raw_provider_output_allowed",
    "raw_retrieval_output_allowed",
    "raw_db_rows_allowed",
    "raw_conversations_allowed",
    "hidden_reasoning_allowed",
    "chain_of_thought_allowed",
    "telemetry_dumps_allowed",
    "raw_diffs_allowed",
    "terminal_logs_allowed",
    "github_payloads_allowed",
    "browser_dumps_allowed",
    "private_paths_allowed",
    "private_urls_allowed",
    "secrets_allowed",
    "provider_keys_allowed",
    "connector_ids_allowed",
    "uploaded_file_ids_allowed",
    "provider_internal_ids_allowed",
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
    { pattern: /terminal log:/i, label: "terminal log payload" },
    { pattern: /GitHub payload:/i, label: "GitHub payload" },
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
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to v0.4 docs/fixture/smoke/package/index files plus exact smoke compatibility exceptions",
  );
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
