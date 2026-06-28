#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md";
const fixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json";
const smokePath = "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const previousDocsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md";
const previousFixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.5.json";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const uiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const uiFixturePath = "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json";
const uiSmokePath = "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs";
const uiPanelPath = "components/final-rag-answer-review-memory-panel.tsx";
const uiPagePath = "app/research-retrieval/final-rag-answer/review-memory/page.tsx";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const bindingSmokePath = "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const finalRagDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const reviewMemoryUiDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const routeContractPath = "lib/research-candidate-review/review-memory-db-route-contract.ts";
const productWriteDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";

const fixtureVersion = "v0_2_1_remaining_runtime_gap_audit.sample.v0.6";
const auditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_6";
const previousAuditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_5";
const uiRuntimeRef = "final_answer_candidate_review_ui_binding_v0_1";
const bindingRuntimeRef = "final_rag_answer_candidate_review_memory_binding_v0_1";
const finalRagRuntimeRef = "final_rag_answer_generation_candidate_review_v0_1";
const productWriteRuntimeRef = "product_write_accepted_evidence_ref_runtime_v0_1";
const packageScriptName = "smoke:v0-2-1-remaining-runtime-gap-audit-v0-6";
const packageScriptValue = "node scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs";

const exactOlderSmokeCompatibilityFiles = [
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs",
];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  ...exactOlderSmokeCompatibilityFiles,
  "types/promotion-readiness-packet-from-review-memory.ts",
  "lib/perspective/promotion/promotion-readiness-packet-from-review-memory.ts",
  "app/api/perspective/promotion/readiness-packet/route.ts",
  "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md",
  "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md",
  "fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json",
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md",
  "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "lib/runtime-audit/audit-event-store.ts",
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
  uiDocsPath,
  uiFixturePath,
  uiSmokePath,
  uiPanelPath,
  uiPagePath,
  bindingDocsPath,
  bindingFixturePath,
  bindingSmokePath,
  finalRagDocsPath,
  reviewMemoryUiDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStoreDocsPath,
  routeContractPath,
  productWriteDocsPath,
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
const uiDocsText = readText(uiDocsPath);
const uiFixtureText = readText(uiFixturePath);
const uiSmokeText = readText(uiSmokePath);
const uiPanelText = readText(uiPanelPath);
const uiPageText = readText(uiPagePath);
const bindingDocsText = readText(bindingDocsPath);
const bindingFixtureText = readText(bindingFixturePath);
const finalRagDocsText = readText(finalRagDocsPath);
const reviewMemoryUiDocsText = readText(reviewMemoryUiDocsPath);
const reviewMemoryRoutesDocsText = readText(reviewMemoryRoutesDocsPath);
const reviewMemoryStoreDocsText = readText(reviewMemoryStoreDocsPath);
const productWriteDocsText = readText(productWriteDocsPath);

assertPackageAndIndex();
assertRelationshipsAndEvidence();
assertDocSectionsAndBoundaryPhrases();
assertFixture();
assertUiRuntimeEvidence();
assertNoPositiveCompletionClaims();
assertPublicSafeFixturePolicy(fixture.public_safe_fixture_policy);
assertPublicSafeText(docsText, docsPath);
assertPublicSafeText(fixtureText, fixturePath);
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "v0-2-1-remaining-runtime-gap-audit-v0-6",
      final_status: "pass",
      audit_version: auditVersion,
      previous_audit_version: fixture.previous_audit_version,
      completed_ui_surface: uiRuntimeRef,
      next_recommended_implementation_slice: fixture.next_recommended_implementation_slice.item_ref,
      gated_work_items: fixture.gated_work_items.length,
    },
    null,
    2,
  ),
);

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue, "package script");
  const block = normalizeWhitespace(extractIndexBlock(indexText, "v0.2.1 Remaining Runtime Gap Audit v0.6"));
  for (const needle of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    auditVersion,
    "PR #848",
    uiRuntimeRef,
    "read/display-only UI binding only",
    "Smoke/CI pass is not truth",
  ]) {
    assertIncludes(block, needle, `latest index pointer ${needle}`);
  }
}

function assertRelationshipsAndEvidence() {
  assertIncludes(previousDocsText, previousAuditVersion, "v0.5 docs marker");
  assertIncludes(previousFixtureText, previousAuditVersion, "v0.5 fixture marker");
  assertIncludes(docsText, previousDocsPath, "v0.6 references v0.5 audit");
  assertIncludes(docsText, previousAuditVersion, "v0.6 references v0.5 audit version");
  assertIncludes(docsText, "PR #848", "v0.6 references PR #848");
  assertIncludes(docsText, uiRuntimeRef, "v0.6 references UI runtime");
  assertIncludes(fixtureText, uiRuntimeRef, "fixture references UI runtime");
  assert.equal(fixture.previous_audit_version, previousAuditVersion);
  assert.equal(fixture.previous_audit_ref, previousDocsPath);

  for (const [text, marker, label] of [
    [uiDocsText, uiRuntimeRef, "#848 docs runtime marker"],
    [uiFixtureText, "final_answer_candidate_review_ui_binding.v0.1", "#848 fixture UI version"],
    [uiSmokeText, "final-answer-candidate-review-ui-binding-v0-1", "#848 smoke marker"],
    [uiPanelText, "FinalRagAnswerReviewMemoryPanel", "#848 panel marker"],
    [uiPanelText, "explicitUnsafeDisplayTextMarkers", "#848 sanitizer marker"],
    [uiPanelText, "private|internal|intranet|corp|\\.local", "#848 private host sanitizer"],
    [uiPageText, "FinalRagAnswerReviewMemoryPanel", "#848 page marker"],
    [bindingDocsText, bindingRuntimeRef, "#846 binding docs marker"],
    [bindingFixtureText, bindingRuntimeRef, "#846 binding fixture marker"],
    [finalRagDocsText, finalRagRuntimeRef, "#844 final RAG docs marker"],
    [reviewMemoryUiDocsText, "Research Candidate Review Memory DB UI", "Review Memory UI docs marker"],
    [reviewMemoryRoutesDocsText, "Review Memory", "Review Memory routes docs marker"],
    [reviewMemoryStoreDocsText, "Review Memory", "Review Memory store docs marker"],
    [productWriteDocsText, productWriteRuntimeRef, "product-write accepted evidence ref marker"],
  ]) {
    assertIncludes(text, marker, label);
  }

  for (const ref of fixture.evidence_refs) {
    assert.ok(existsSync(ref), `fixture evidence ref exists: ${ref}`);
  }
}

function assertDocSectionsAndBoundaryPhrases() {
  for (const section of [
    "## Purpose",
    "## Relationship to v0.5 audit",
    "## Relationship to PR #848 / Final Answer Candidate Review UI Binding v0.1",
    "## What #848 completed",
    "## What #848 explicitly did not complete",
    "## UI state after #848",
    "## Review Memory state after #848",
    "## Final RAG state after #848",
    "## Product-write state after #848",
    "## Phase-by-phase delta",
    "## Runtime-complete surfaces added since v0.5",
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
    "This is not Review Memory write approval.",
    "This is not POST route approval.",
    "This is not final answer generation approval.",
    "This is not provider approval.",
    "This is not retrieval execution approval.",
    "This is not source fetching approval.",
    "This is not retrieval index write approval.",
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
    "This audit is static. It does not implement new runtime behavior.",
    "The roadmap guide is not SSOT.",
    "Smoke/CI pass is not truth.",
  ]) {
    assertIncludes(normalizedDocsText, phrase, `docs boundary phrase ${phrase}`);
  }

  for (const phrase of [
    "read/display-only UI binding only",
    "existing Review Memory DB GET routes only",
    "no POST route calls",
    "no write controls",
    "no create/save/discard/activity-write controls",
    "bounded Review Memory record/detail/activity projections",
    "candidate refs display",
    "source refs display",
    "lifecycle and review decision display",
    "boundary acknowledgement display",
    "non-authority notes display",
    "bounded read-only copied packet",
    "invalid DB path blocked before fetch",
    "private/raw filter text blocked before fetch",
    "private URL/path/token/provider/internal ID variants blocked",
    "broad private/internal/intranet/corp/.local URL hosts blocked",
    "public-safe symbolic refs remain displayable",
    "no raw JSON blob rendering",
    "no route response body wholesale rendering",
    "Review Memory is not truth",
    "Review Memory is not proof",
    "Review Memory is not accepted evidence",
    "Review Memory is not durable Perspective state",
    "final answer candidate remains candidate-only",
    "source refs are lineage pointers, not proof",
    "operator review note is not promotion or product-write authority",
    "read/display UI is not write authority",
    "copied packet is not proof/evidence/promotion/product-write/approval",
  ]) {
    assertIncludes(normalizedDocsText, phrase, `docs UI phrase ${phrase}`);
    assertIncludes(fixtureText, phrase, `fixture UI phrase ${phrase}`);
  }

  for (const phrase of [
    "proof/evidence creation",
    "claim/evidence writes",
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
    assertIncludes(normalizedDocsText, phrase, `gated docs phrase ${phrase}`);
    assertIncludes(fixtureText, phrase, `fixture gated phrase ${phrase}`);
  }
}

function assertFixture() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.audit_version, auditVersion);
  assert.equal(fixture.scope, "project:augnes");
  assert.equal(fixture.roadmap_ref, roadmapPath);
  assert.equal(fixture.final_answer_candidate_review_ui_binding_ref, uiDocsPath);
  assert.equal(fixture.final_rag_answer_review_memory_binding_ref, bindingDocsPath);
  assert.equal(fixture.final_rag_answer_candidate_review_runtime_ref, finalRagDocsPath);
  assert.equal(fixture.review_memory_db_ui_runtime_ref, reviewMemoryUiDocsPath);
  assert.equal(fixture.review_memory_db_store_runtime_ref, reviewMemoryStoreDocsPath);
  assert.equal(fixture.review_memory_db_routes_runtime_ref, reviewMemoryRoutesDocsPath);
  assert.equal(fixture.product_write_accepted_evidence_ref_runtime_ref, productWriteDocsPath);
  assert.equal(fixture.remaining_work_exists, true);
  assert.equal(fixture.no_remaining_work_claim, false);
  assert.equal(fixture.ungated_implementation_gap_exists, false);
  assert.deepEqual(fixture.ungated_implementation_gaps, []);
  assert.equal(fixture.next_recommended_implementation_slice.item_ref, "none_without_explicit_approval");
  assert.equal(
    fixture.next_recommended_implementation_slice.candidate_slice_if_separately_classified,
    "promotion_readiness_packet_from_review_memory_v0_1",
  );

  for (const completed of [
    "final_answer_candidate_review_ui_binding_v0_1",
    "read/display-only UI binding only",
    "page route /research-retrieval/final-rag-answer/review-memory",
    "client panel components/final-rag-answer-review-memory-panel.tsx",
    "existing Review Memory DB GET routes only",
    "no POST calls",
    "no write controls",
    "no create/save/discard/activity-write controls",
    "bounded record/detail/activity projections",
    "private/raw filter text blocked before fetch",
    "broad private/internal/intranet/corp/.local URL hosts blocked",
    "public-safe symbolic refs remain displayable",
    "copied packet is not proof/evidence/promotion/product-write/approval",
    "no product ID allocation",
    "no Git/GitHub/release execution",
  ]) {
    assertArrayIncludes(fixture.ui_state_after_848.completed, completed, completed);
  }

  for (const gated of [
    "Review Memory writes beyond existing approved routes/binding",
    "final answer generation",
    "provider calls",
    "prompt sending",
    "retrieval execution",
    "source fetching",
    "retrieval index writes",
    "proof/evidence creation",
    "claim/evidence writes",
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
    "automatic answer-to-product conversion",
  ]) {
    assertArrayIncludes(fixture.ui_state_after_848.still_gated, gated, `${gated} gated`);
  }

  for (const field of [
    "did_not_add_review_memory_writes",
    "did_not_add_post_route_calls",
    "did_not_create_modify_discard_or_append_activity",
    "review_memory_remains_not_truth_proof_accepted_evidence_or_durable_state",
  ]) {
    assert.equal(fixture.review_memory_state_after_848[field], true, `review memory state ${field}`);
  }

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
    assert.equal(fixture.final_rag_state_after_848[field], true, `final RAG state ${field}`);
  }

  for (const field of [
    "did_not_add_product_write_target",
    "did_not_write_accepted_evidence_refs",
    "did_not_allocate_product_ids",
    "did_not_enable_product_write_adapter",
    "did_not_add_broad_product_persistence",
    "did_not_convert_final_answer_candidates_into_product_state",
  ]) {
    assert.equal(fixture.product_write_state_after_848[field], true, `product-write state ${field}`);
  }

  const uiSurface = fixture.completed_runtime_surfaces_after_848.find(
    (surface) => surface.item_ref === uiRuntimeRef,
  );
  assert(uiSurface, "UI completed runtime surface exists");
  assert.equal(uiSurface.classification, "runtime_complete_read_display_ui_binding_only");
  assert.equal(uiSurface.opened_by_pr, 848);

  for (const [itemRef, classification] of [
    [bindingRuntimeRef, "runtime_complete_bounded_review_memory_binding_only"],
    [finalRagRuntimeRef, "runtime_complete_candidate_review_layer_only"],
    [productWriteRuntimeRef, "runtime_complete_first_target_only"],
  ]) {
    const surface = fixture.completed_runtime_surfaces_after_848.find((entry) => entry.item_ref === itemRef);
    assert(surface, `${itemRef} completed runtime surface exists`);
    assert.equal(surface.classification, classification);
  }

  assertAuthorityBoundary(fixture.authority_boundary);
}

function assertUiRuntimeEvidence() {
  assertIncludes(uiPanelText, "/api/research-candidate-review/review-records", "UI GET route base");
  assertIncludes(uiPanelText, 'method: "GET"', "UI GET fetch");
  assert.doesNotMatch(uiPanelText, /method:\s*"POST"/, "UI has no POST fetch");
  assert.doesNotMatch(uiPanelText, /localStorage|sessionStorage|document\.cookie|indexedDB|new Database|better-sqlite3/);
  for (const forbidden of [
    "/api/research-retrieval/final-rag-answer",
    "/api/product-write",
    "/api/research-candidate-review/provider-extraction",
    "/api/research-retrieval/rebuild",
    "/api/research-retrieval/search",
    "/api/github",
    "/api/release",
  ]) {
    assert.ok(!uiPanelText.includes(forbidden), `UI must not call ${forbidden}`);
  }
  for (const forbiddenControl of [
    ">Save",
    ">Discard",
    ">Create",
    ">Promote",
    "Proof control",
    "Evidence control",
    "Formation Receipt control",
    "Product ID control",
    "Provider control",
    "Prompt box",
    "Source fetch control",
    "Retrieval execution control",
    "GitHub control",
    "Release control",
  ]) {
    assert.ok(!uiPanelText.includes(forbiddenControl), `UI must not expose ${forbiddenControl}`);
  }
  for (const marker of [
    "https://private.example",
    "https://internal.example/path",
    "https://foo.internal.example",
    "https://intranet.example",
    "https://corp.example/path",
    "private|internal|intranet|corp|\\.local",
    "final-rag-answer-candidate:",
    "review-memory:",
    "source-ref:",
    "rag-context-preview:",
    "operator:",
  ]) {
    assertIncludes(uiPanelText + uiFixtureText, marker, `UI sanitizer/ref marker ${marker}`);
  }
}

function assertNoPositiveCompletionClaims() {
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
}

function assertAuthorityBoundary(boundary) {
  assert(boundary && typeof boundary === "object", "authority boundary object");
  for (const field of [
    "remaining_runtime_gap_audit_now",
    "static_repo_grounded_audit_only",
    "postmerge_grounding_after_848",
    "docs_fixture_smoke_package_index_only",
    "exact_older_smoke_compatibility_allowlists_only",
  ]) {
    assert.equal(boundary[field], true, `authority ${field} true`);
  }
  for (const field of [
    "new_runtime_capability_now",
    "ui_behavior_change_now",
    "review_memory_write_now",
    "post_route_call_now",
    "provider_call_now",
    "prompt_sent_now",
    "final_answer_generation_now",
    "retrieval_execution_now",
    "source_fetch_now",
    "retrieval_index_write_now",
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
    { pattern: /\b[A-Z_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)\s*=/, label: "secret env assignment" },
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
  const baseDiffLines =
    runGitLines(["diff", "--name-only", "origin/main...HEAD"], { allowFailure: true }) ??
    runGitLines(["diff", "--name-only", "main...HEAD"], { allowFailure: true }) ??
    [];
  for (const filePath of baseDiffLines) {
    if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
  }
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to v0.6 docs/fixture/smoke/package/index files plus exact older-smoke compatibility exceptions",
  );
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

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
