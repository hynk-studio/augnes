#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md";
const fixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.5.json";
const smokePath = "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const previousDocsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_4.md";
const previousFixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.4.json";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const bindingSmokePath = "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const bindingRoutePath =
  "app/api/research-retrieval/final-rag-answer/review-memory/route.ts";
const bindingHelperPath = "lib/research-retrieval/final-rag-answer-review-memory-binding.ts";
const bindingTypePath = "types/final-rag-answer-review-memory-binding.ts";
const finalRagDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const finalRagFixturePath = "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const finalRagSmokePath = "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStoreHelperPath = "lib/research-candidate-review/review-memory-db-store.ts";
const reviewMemoryRouteContractPath =
  "lib/research-candidate-review/review-memory-db-route-contract.ts";
const productWriteAcceptedEvidenceRefDocsPath =
  "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";

const fixtureVersion = "v0_2_1_remaining_runtime_gap_audit.sample.v0.5";
const auditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_5";
const previousAuditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_4";
const bindingRuntimeRef = "final_rag_answer_candidate_review_memory_binding_v0_1";
const finalRagRuntimeRef = "final_rag_answer_generation_candidate_review_v0_1";
const productWriteRuntimeRef = "product_write_accepted_evidence_ref_runtime_v0_1";
const packageScriptName = "smoke:v0-2-1-remaining-runtime-gap-audit-v0-5";
const packageScriptValue = "node scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs";
const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-4.mjs",
  "components/final-rag-answer-review-memory-panel.tsx",
  "app/research-retrieval/final-rag-answer/review-memory/page.tsx",
  "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md",
  "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
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
  bindingDocsPath,
  bindingFixturePath,
  bindingSmokePath,
  bindingRoutePath,
  bindingHelperPath,
  bindingTypePath,
  finalRagDocsPath,
  finalRagFixturePath,
  finalRagSmokePath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStoreHelperPath,
  reviewMemoryRouteContractPath,
  productWriteAcceptedEvidenceRefDocsPath,
  runtimeAuditDocsPath,
  privacyGuardDocsPath,
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
const bindingDocsText = readText(bindingDocsPath);
const bindingFixtureText = readText(bindingFixturePath);
const bindingSmokeText = readText(bindingSmokePath);
const bindingRouteText = readText(bindingRoutePath);
const bindingHelperText = readText(bindingHelperPath);
const bindingTypeText = readText(bindingTypePath);
const finalRagDocsText = readText(finalRagDocsPath);
const finalRagFixtureText = readText(finalRagFixturePath);
const finalRagSmokeText = readText(finalRagSmokePath);
const reviewMemoryStoreDocsText = readText(reviewMemoryStoreDocsPath);
const reviewMemoryRoutesDocsText = readText(reviewMemoryRoutesDocsPath);
const productWriteAcceptedEvidenceRefDocsText = readText(productWriteAcceptedEvidenceRefDocsPath);

assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue, "package script");
for (const needle of [
  "v0.2.1 Remaining Runtime Gap Audit v0.5",
  docsPath,
  fixturePath,
  smokePath,
  packageScriptName,
  auditVersion,
]) {
  assertIncludes(indexText, needle, `latest index pointer ${needle}`);
}

assertIncludes(previousDocsText, previousAuditVersion, "v0.4 docs marker");
assertIncludes(previousFixtureText, previousAuditVersion, "v0.4 fixture marker");
assertIncludes(docsText, previousDocsPath, "v0.5 references v0.4 audit");
assertIncludes(docsText, previousAuditVersion, "v0.5 references v0.4 audit version");
assert.equal(fixture.previous_audit_version, previousAuditVersion);
assert.equal(fixture.previous_audit_ref, previousDocsPath);
assertIncludes(docsText, "PR #846", "v0.5 references PR #846");
assertIncludes(docsText, bindingRuntimeRef, "v0.5 references binding runtime");
assertIncludes(fixtureText, bindingRuntimeRef, "fixture references binding runtime");

for (const [text, marker, label] of [
  [bindingDocsText, bindingRuntimeRef, "#846 docs runtime marker"],
  [bindingFixtureText, bindingRuntimeRef, "#846 fixture runtime marker"],
  [bindingSmokeText, "final-rag-answer-review-memory-binding-v0-1", "#846 smoke runtime marker"],
  [bindingRouteText, bindingRuntimeRef, "#846 route runtime marker"],
  [bindingHelperText, bindingRuntimeRef, "#846 helper runtime marker"],
  [bindingTypeText, "final_rag_answer_review_memory_binding.v0.1", "#846 type runtime marker"],
  [bindingRouteText, "final_rag_answer_review_memory_binding_runtime", "#846 audit surface marker"],
  [bindingHelperText, "candidate_review_snapshot", "#846 candidate review snapshot marker"],
  [bindingHelperText, "preflightFinalRagAnswerReviewMemoryBindingRuntimeV01", "#846 preflight marker"],
  [finalRagDocsText, finalRagRuntimeRef, "final RAG docs marker"],
  [finalRagFixtureText, finalRagRuntimeRef, "final RAG fixture marker"],
  [finalRagSmokeText, "final-rag-answer-generation-candidate-review-v0-1", "final RAG smoke marker"],
  [reviewMemoryStoreDocsText, "Review Memory", "Review Memory store docs marker"],
  [reviewMemoryRoutesDocsText, "Review Memory", "Review Memory routes docs marker"],
  [productWriteAcceptedEvidenceRefDocsText, productWriteRuntimeRef, "product-write accepted evidence ref marker"],
]) {
  assertIncludes(text, marker, label);
}
assert.doesNotMatch(bindingRouteText, /export\s+async\s+function\s+GET\b/, "no GET route");

for (const section of [
  "## Purpose",
  "## Relationship to v0.4 audit",
  "## Relationship to PR #846 / Final RAG Answer Review Memory Binding v0.1",
  "## What #846 completed",
  "## What #846 explicitly did not complete",
  "## Review Memory state after #846",
  "## Final RAG state after #846",
  "## Product-write state after #846",
  "## Phase-by-phase delta",
  "## Runtime-complete surfaces added since v0.4",
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
  "This is not claim/evidence write approval.",
  "This is not promotion approval.",
  "This is not durable state mutation approval.",
  "This is not Formation Receipt write approval.",
  "This is not product-write approval.",
  "This is not accepted evidence ref write approval.",
  "This is not product ID allocation approval.",
  "This is not GitHub actuation approval.",
  "This is not live provider approval.",
  "This is not UI implementation approval.",
  "This audit is static. It does not implement new runtime behavior.",
  "This PR does not implement new runtime beyond audit/grounding docs, fixture,",
  "This PR confirms #846 as final RAG answer candidate Review Memory binding only.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
]) {
  assertIncludes(normalizedDocsText, phrase, `docs phrase ${phrase}`);
}

for (const phrase of [
  "final_rag_answer_candidate_review_memory_binding_v0_1",
  "runtime-complete for bounded Review Memory binding only",
  "same-origin POST route",
  "no GET route",
  "uses the existing Review Memory DB store helper",
  "candidate_review_snapshot",
  "Review Memory DB schema ensure/write happens only after preflight passes",
  "DB-free preflight runs before Review Memory DB open",
  "invalid/forbidden/private/missing-prerequisite payloads do not create DB",
  "idempotent replay",
  "material payload conflict rejection",
  "final_rag_answer_review_memory_binding_runtime",
  "Review Memory remains not truth",
  "Review Memory remains not proof",
  "Review Memory remains not accepted evidence",
  "Review Memory remains not durable Perspective state",
  "final answer candidate remains candidate-only",
  "source refs remain lineage pointers, not proof",
  "operator review note is not promotion or product-write authority",
  "no provider call",
  "no prompt sending",
  "no retrieval execution",
  "no source fetch",
  "no retrieval index write",
  "no proof/evidence creation",
  "no promotion",
  "no durable state mutation",
  "no Formation Receipt write",
  "no product-write",
  "no accepted evidence ref write",
  "no product ID allocation",
  "no Git/GitHub/release execution",
]) {
  assertIncludes(normalizedDocsText, phrase, `docs boundary phrase ${phrase}`);
}

for (const phrase of [
  "proof/evidence creation",
  "claim/evidence writes outside Review Memory",
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
  "UI binding",
  "automatic answer-to-product conversion",
]) {
  assertIncludes(normalizedDocsText, phrase, `gated docs phrase ${phrase}`);
  assertIncludes(fixtureText, phrase, `fixture gated phrase ${phrase}`);
}

for (const phrase of [
  "UI binding is not implemented by #846 or by this audit",
  "none_without_explicit_approval",
  "No specific ungated post-#846 implementation gap is visible from repo evidence",
]) {
  assertIncludes(normalizedDocsText, phrase, `UI/next slice phrase ${phrase}`);
}

for (const phrase of [
  "roadmap completion",
  "release approval",
  "release execution",
  "proof/evidence creation claim",
  "promotion completion claim",
  "durable state mutation claim",
  "product-write approval",
  "product ID allocation claim",
  "smoke or CI truth claim",
]) {
  assertNoPositiveClaim(normalizedDocsText, phrase, `docs no positive ${phrase}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.audit_version, auditVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.roadmap_ref, roadmapPath);
assert.equal(fixture.final_rag_answer_review_memory_binding_ref, bindingDocsPath);
assert.equal(fixture.final_rag_answer_candidate_review_runtime_ref, finalRagDocsPath);
assert.equal(fixture.review_memory_db_store_runtime_ref, reviewMemoryStoreDocsPath);
assert.equal(fixture.review_memory_db_routes_runtime_ref, reviewMemoryRoutesDocsPath);
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
  "final_rag_answer_candidate_review_memory_binding_v0_1",
  "bounded Review Memory binding only",
  "same-origin POST route",
  "no GET route",
  "uses existing Review Memory DB store helper",
  "maps final answer candidate to candidate_review_snapshot",
  "Review Memory DB schema ensure/write only after preflight passes",
  "DB-free preflight before Review Memory DB open",
  "invalid/forbidden/private/missing-prerequisite payloads do not create DB",
  "idempotent replay",
  "material payload conflict rejection",
  "final_rag_answer_review_memory_binding_runtime audit surface",
  "Review Memory is not truth",
  "Review Memory is not proof",
  "Review Memory is not accepted evidence",
  "Review Memory is not durable Perspective state",
  "final answer candidate remains candidate-only",
  "source refs are lineage pointers, not proof",
  "operator review note is not promotion or product-write authority",
  "no provider call",
  "no prompt sending",
  "no retrieval execution",
  "no source fetch",
  "no retrieval index write",
  "no proof/evidence creation",
  "no promotion",
  "no durable state mutation",
  "no Formation Receipt write",
  "no product-write",
  "no accepted evidence ref write",
  "no product ID allocation",
  "no Git/GitHub/release execution",
]) {
  assertArrayIncludes(fixture.review_memory_state_after_846.completed, completed, completed);
}

for (const marker of [
  "Review Memory is not truth",
  "Review Memory is not proof",
  "Review Memory is not accepted evidence",
  "Review Memory is not durable Perspective state",
  "final answer candidate remains candidate-only",
  "source refs are lineage pointers, not proof",
  "operator review note is not promotion or product-write authority",
]) {
  assertArrayIncludes(fixture.review_memory_state_after_846.non_authoritative_boundaries, marker, marker);
}

for (const gated of [
  "proof/evidence creation",
  "claim/evidence writes outside Review Memory",
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
  "UI binding",
  "automatic answer-to-product conversion",
]) {
  assertArrayIncludes(fixture.review_memory_state_after_846.still_gated, gated, `${gated} gated`);
}

assert.equal(
  fixture.final_rag_state_after_846.candidate_review_surface_remains,
  "final_rag_answer_generation_candidate_review_v0_1 remains completed candidate/review layer only",
);
assert.equal(
  fixture.final_rag_state_after_846.review_memory_binding_addition,
  "final_rag_answer_candidate_review_memory_binding_v0_1 adds Review Memory binding from already generated candidates only",
);
for (const field of [
  "did_not_generate_final_answers",
  "did_not_call_providers",
  "did_not_send_prompts",
  "did_not_execute_retrieval",
  "did_not_fetch_sources",
  "did_not_write_retrieval_indexes",
  "did_not_product_write",
  "did_not_create_proof_evidence",
  "did_not_promote_perspective",
]) {
  assert.equal(fixture.final_rag_state_after_846[field], true, `final RAG state ${field}`);
}
for (const marker of [
  "final answer candidate remains candidate-only",
  "provider output remains candidate-only",
  "retrieval result remains non-authoritative",
  "retrieval score remains not truth/promotion readiness",
  "context preview remains review aid",
]) {
  assertArrayIncludes(fixture.final_rag_state_after_846.non_authoritative_boundaries, marker, marker);
}

assert.equal(
  fixture.product_write_state_after_846.completed_first_target_remains,
  "product_write_accepted_evidence_ref_runtime_v0_1 remains completed first target only",
);
for (const field of [
  "did_not_add_product_write_target",
  "did_not_write_accepted_evidence_refs",
  "did_not_allocate_product_ids",
  "did_not_enable_product_write_adapter",
  "did_not_add_broad_product_persistence",
  "did_not_convert_final_answer_candidates_into_product_state",
  "still_limited_to_842_first_target_only",
]) {
  assert.equal(fixture.product_write_state_after_846[field], true, `product-write state ${field}`);
}

const bindingSurface = fixture.completed_runtime_surfaces_after_846.find(
  (surface) => surface.item_ref === bindingRuntimeRef,
);
assert(bindingSurface, "binding completed runtime surface exists");
assert.equal(bindingSurface.classification, "runtime_complete_bounded_review_memory_binding_only");
assert.equal(bindingSurface.opened_by_pr, 846);

const finalRagSurface = fixture.completed_runtime_surfaces_after_846.find(
  (surface) => surface.item_ref === finalRagRuntimeRef,
);
assert(finalRagSurface, "final RAG completed runtime surface exists");
assert.equal(finalRagSurface.classification, "runtime_complete_candidate_review_layer_only");
assert.equal(finalRagSurface.opened_by_pr, 844);

const productWriteSurface = fixture.completed_runtime_surfaces_after_846.find(
  (surface) => surface.item_ref === productWriteRuntimeRef,
);
assert(productWriteSurface, "product-write completed runtime surface exists");
assert.equal(productWriteSurface.classification, "runtime_complete_first_target_only");
assert.equal(productWriteSurface.opened_by_pr, 842);

for (const gatedRef of [
  "proof_evidence_creation",
  "claim_evidence_writes_outside_review_memory",
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
  "ui_binding",
  "automatic_answer_to_product_conversion",
]) {
  const entry = fixture.gated_work_items.find((item) => item.item_ref === gatedRef);
  assert(entry, `gated item exists: ${gatedRef}`);
  assert.equal(entry.opened_by_846, false, `${gatedRef} not opened by #846`);
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
      smoke: "v0-2-1-remaining-runtime-gap-audit-v0-5",
      final_status: "pass",
      audit_version: auditVersion,
      previous_audit_version: fixture.previous_audit_version,
      completed_review_memory_surface: bindingSurface.item_ref,
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
    "postmerge_grounding_after_846",
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
    "final_answer_generation_now",
    "retrieval_execution_now",
    "live_provider_validation_now",
    "proof_evidence_creation_now",
    "claim_evidence_write_now",
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
    "proof_evidence_creation_claim_now",
    "promotion_completion_claim_now",
    "durable_state_mutation_claim_now",
    "product_write_approval_now",
    "product_id_allocation_claim_now",
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
  const baseDiffLines = runGitLines(["diff", "--name-only", "origin/main...HEAD"], {
    allowFailure: true,
  });
  const fallbackBaseDiffLines =
    baseDiffLines === null
      ? runGitLines(["diff", "--name-only", "main...HEAD"], { allowFailure: true }) ?? []
      : baseDiffLines;
  for (const filePath of fallbackBaseDiffLines) {
    if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
  }
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to v0.5 docs/fixture/smoke/package/index files plus exact smoke compatibility exceptions",
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
    if (options.allowFailure) return null;
    throw error;
  }
}
