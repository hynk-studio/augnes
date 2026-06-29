#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const componentPath = "components/final-rag-answer-review-memory-panel.tsx";
const pagePath = "app/research-retrieval/final-rag-answer/review-memory/page.tsx";
const docsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const fixturePath = "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json";
const smokePath = "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const v05AuditPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const bindingSmokePath = "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const existingReviewMemoryUiDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const routeContractPath = "lib/research-candidate-review/review-memory-db-route-contract.ts";

const packageScriptName = "smoke:final-answer-candidate-review-ui-binding-v0-1";
const packageScriptValue = "node scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs";
const runtimeRef = "final_answer_candidate_review_ui_binding_v0_1";
const uiVersion = "final_answer_candidate_review_ui_binding.v0.1";
const bindingRuntimeRef = "final_rag_answer_candidate_review_memory_binding_v0_1";
const reviewMemoryGetRoute = "/api/research-candidate-review/review-records";
const requiredSanitizerMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "https://private.example",
  "https://internal.example",
  "https://internal.example/path",
  "https://foo.internal.example",
  "https://intranet.example",
  "https://corp.example",
  "https://corp.example/path",
  "https://example.local",
  "github_pat_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "provider_thread_id",
  "provider_run_id",
  "provider_session_id",
  "thread_",
  "run_",
  "session_",
  "connector_id",
  "uploaded_file_id",
  "raw-db-row",
  "github-payload",
];
const allowedPublicSafeSymbolicRefs = [
  "final-rag-answer-candidate:",
  "review-memory:",
  "source-ref:",
  "rag-context-preview:",
  "operator:",
];
const expectedChangedFiles = new Set([
  componentPath,
  pagePath,
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
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
  "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md",
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json",
  "scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "lib/runtime-audit/audit-event-store.ts",
]);

const allowedTrueBoundaryFields = [
  "final_answer_candidate_review_ui_binding_now",
  "read_display_only_ui_now",
  "explicit_operator_read_action_only",
  "same_origin_get_route_calls_only",
  "db_backed_review_memory_routes_primary",
  "review_memory_db_read_now",
  "final_answer_candidate_review_memory_display_now",
  "bounded_review_memory_record_display_now",
  "bounded_activity_display_now",
  "source_refs_lineage_only",
  "no_truth_language_required",
  "no_proof_language_required",
];

const forbiddenFalseBoundaryFields = [
  "post_route_call_now",
  "review_memory_write_now",
  "review_record_create_now",
  "review_record_activity_write_now",
  "review_record_discard_now",
  "final_answer_generation_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "accepted_evidence_ref_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "final_answer_candidate_is_truth",
  "final_answer_candidate_is_proof",
  "final_answer_candidate_is_accepted_evidence",
  "final_answer_candidate_is_promotion",
  "final_answer_candidate_is_product",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

for (const filePath of [
  componentPath,
  pagePath,
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  v05AuditPath,
  bindingDocsPath,
  bindingFixturePath,
  bindingSmokePath,
  existingReviewMemoryUiDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStoreDocsPath,
  routeContractPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const component = readText(componentPath);
const page = readText(pagePath);
const docs = normalizeWhitespace(readText(docsPath));
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const v05Audit = readText(v05AuditPath);
const bindingDocs = readText(bindingDocsPath);
const existingReviewMemoryUiDocs = readText(existingReviewMemoryUiDocsPath);
const routeContract = readText(routeContractPath);

assertPackageAndIndex();
assertReferences();
assertPageAndComponent();
assertGetOnlyRouteUsage();
assertReadDisplayBoundary();
assertRequiredUiBoundaryText();
assertInputAndDisplaySafety();
assertFixture();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "final-answer-candidate-review-ui-binding-v0-1",
      final_status: "pass",
      ui_version: fixture.ui_version,
      scope: fixture.scope,
      route_policy: "review_memory_get_routes_only",
      changed_file_scope: "bounded",
    },
    null,
    2,
  ),
);

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue, "package script");
  const block = normalizeWhitespace(
    extractIndexBlock(index, "Final Answer Candidate Review UI Binding v0.1"),
  );
  for (const phrase of [
    docsPath,
    fixturePath,
    smokePath,
    componentPath,
    pagePath,
    packageScriptName,
    runtimeRef,
    "read/display-only",
    "Review Memory is not truth",
    "Smoke/CI pass is not truth",
  ]) {
    assertIncludes(block, phrase, `index block ${phrase}`);
  }
}

function assertReferences() {
  assertIncludes(v05Audit, "v0_2_1_remaining_runtime_gap_audit_v0_5", "v0.5 audit marker");
  assertIncludes(v05Audit, "UI binding", "v0.5 UI binding marker");
  assertIncludes(bindingDocs, bindingRuntimeRef, "#846 binding docs marker");
  assertIncludes(existingReviewMemoryUiDocs, "Research Candidate Review Memory DB UI", "existing UI docs marker");
  assertIncludes(routeContract, "isSafeResearchCandidateReviewMemoryDbRoutePathV01", "DB path route validation");
  for (const phrase of [
    "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md",
    "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md",
  ]) {
    assertIncludes(docs, phrase, `docs reference ${phrase}`);
  }
}

function assertPageAndComponent() {
  assertIncludes(component, "export function FinalRagAnswerReviewMemoryPanel", "component export");
  assertIncludes(page, "FinalRagAnswerReviewMemoryPanel", "page renders panel");
  assertIncludes(page, "@/components/final-rag-answer-review-memory-panel", "page imports panel");
  assertIncludes(component, "data-read-display-only-ui-now", "component read-only data marker");
}

function assertGetOnlyRouteUsage() {
  assertIncludes(component, reviewMemoryGetRoute, "component uses review records route");
  assertIncludes(component, `${reviewMemoryGetRoute}`, "component route prefix");
  assertIncludes(component, 'method: "GET"', "component GET fetch");
  assertIncludes(component, "/activity", "component activity GET path");
  for (const forbidden of [
    'method: "POST"',
    "create_review_record",
    "append_review_record_activity",
    "discard_review_record",
    "/api/research-retrieval/final-rag-answer",
    "/api/product-write",
    "/api/research-candidate-review/provider-extraction",
    "/api/research-retrieval/rebuild",
    "/api/research-retrieval/search",
    "/api/github",
    "/api/release",
  ]) {
    assert.ok(!component.includes(forbidden), `component must not include ${forbidden}`);
  }
}

function assertReadDisplayBoundary() {
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(fixture.expected_authority_boundary[field], true, `fixture ${field}`);
    assertIncludes(component, `${field}: true`, `component ${field}`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(fixture.expected_authority_boundary[field], false, `fixture ${field}`);
    assertIncludes(component, `${field}: false`, `component ${field}`);
  }
}

function assertRequiredUiBoundaryText() {
  for (const phrase of [
    "Review Memory is not truth.",
    "Review Memory is not proof.",
    "Review Memory is not accepted evidence.",
    "Review Memory is not durable Perspective state.",
    "Final answer candidate remains candidate-only.",
    "Source refs are lineage pointers, not proof.",
    "Operator review note is review memory, not authority for promotion or product-write.",
    "This UI is read/display only.",
    "This UI does not create, modify, discard, promote, product-write, or write accepted evidence refs.",
    "Smoke/CI pass is not truth.",
  ]) {
    assertIncludes(component, phrase, `component boundary text ${phrase}`);
    assertIncludes(docs, phrase, `docs boundary text ${phrase}`);
  }
}

function assertInputAndDisplaySafety() {
  for (const phrase of [
    "isAllowedDbPath",
    "isEditableDbPathText",
    "blocked_private_or_raw_payload",
    "invalid_db_path",
    "safeDisplayText",
    "safeExcerpt",
    "isFinalAnswerCandidateReviewMemoryRecord",
    "candidate_review_snapshot",
    "final-rag-answer-candidate:",
    bindingRuntimeRef,
    "final_answer_candidate_not_truth",
    "review_memory_not_truth",
    "navigator.clipboard",
    "packet_kind: final_answer_candidate_review_memory_read_only",
  ]) {
    assertIncludes(component, phrase, `component safety/projection marker ${phrase}`);
  }
  for (const marker of requiredSanitizerMarkers) {
    assertIncludes(component, marker, `component sanitizer marker ${marker}`);
  }
  for (const phrase of [
    "explicitUnsafeDisplayTextMarkers",
    "explicitUnsafeDisplayTextPatterns",
    "escapeRegExp",
    "https?:\\/\\/",
    "localhost",
    "127\\.0\\.0\\.1",
    "0\\.0\\.0\\.0",
    "private|internal|intranet|corp|\\.local)[^",
    "raw[\\s_-]?db[\\s_-]?row:?",
    "github[\\s_-]?payload",
    "connector[\\s_-]?id",
    "uploaded[\\s_-]?file[\\s_-]?id",
  ]) {
    assertIncludes(component, phrase, `component sanitizer pattern ${phrase}`);
  }
  for (const refPrefix of allowedPublicSafeSymbolicRefs) {
    assertIncludes(fixtureText, refPrefix, `fixture keeps public-safe symbolic ref ${refPrefix}`);
  }
  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "indexedDB",
    "new Database",
    "better-sqlite3",
    "raw JSON",
  ]) {
    assert.ok(!component.includes(forbidden), `component must not include ${forbidden}`);
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
    assert.ok(!component.includes(forbiddenControl), `component must not expose ${forbiddenControl}`);
  }
}

function assertFixture() {
  assert.equal(fixture.fixture_version, "final_answer_candidate_review_ui_binding.sample.v0.1");
  assert.equal(fixture.ui_version, uiVersion);
  assert.equal(fixture.scope, "project:augnes");
  assertSafeDbPath(fixture.sample_db_path);
  assert.equal(fixture.sample_list_response.result.records[0].record_kind, "candidate_review_snapshot");
  assert.equal(fixture.sample_list_response.result.records[0].source_refs[0].public_safe, true);
  assert.equal(fixture.expected_ui_projection.badge, "final answer candidate review memory");
  assert.equal(fixture.expected_copied_packet.bounded, true);
  assert.equal(fixture.expected_copied_packet.non_authoritative, true);
  assert.equal(fixture.expected_copied_packet.contains_raw_json, false);
  assert.equal(fixture.invalid_db_path_case.expected_status, "invalid_db_path");
  assert.equal(fixture.private_raw_filter_blocked_case.expected_status, "blocked_private_or_raw_payload");
  assert.equal(fixture.public_safe_fixture_policy.symbolic_refs_only, true);
  assert.equal(
    fixture.public_safe_fixture_policy
      .blocks_raw_private_provider_retrieval_db_conversation_hidden_reasoning_telemetry_raw_diff_terminal_github_payloads,
    true,
  );
  for (const field of [
    "raw_prompt_allowed",
    "raw_provider_output_allowed",
    "raw_retrieval_output_allowed",
    "raw_source_body_allowed",
    "raw_candidate_payload_allowed",
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
    "real_product_ids_allowed",
  ]) {
    assert.equal(fixture.public_safe_fixture_policy[field], false, `fixture policy ${field}`);
  }
  assertPublicSafeFixtureText(fixtureText);
}

function assertChangedFileScope() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const filePath of runGitLines(args) ?? []) {
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
    "changed-file scope limited to final answer candidate review UI binding files plus exact old-smoke compatibility exceptions",
  );
}

function assertSafeDbPath(value) {
  assert.equal(typeof value, "string", "DB path must be string");
  assert.ok(value.endsWith(".sqlite") || value.endsWith(".db"), "DB path must end with SQLite extension");
  assert.ok(
    value.startsWith("tmp/research-candidate-review-memory/") ||
      value.startsWith(".tmp/research-candidate-review-memory/"),
    "DB path must use allowed prefix",
  );
  assert.ok(!value.startsWith("/"), "DB path must not be absolute");
  assert.ok(!value.includes(".."), "DB path must not traverse parents");
  assert.ok(!value.includes("\\"), "DB path must not contain backslashes");
  assert.ok(!value.includes("://"), "DB path must not be URL-like");
}

function assertPublicSafeFixtureText(text) {
  const sanitized = text
    .replaceAll("SAFE_MARKER_RAW_PROVIDER_OUTPUT", "")
    .replaceAll("raw_prompt_allowed", "")
    .replaceAll("raw_provider_output_allowed", "")
    .replaceAll("raw_retrieval_output_allowed", "")
    .replaceAll("raw_source_body_allowed", "")
    .replaceAll("raw_candidate_payload_allowed", "")
    .replaceAll("raw_db_rows_allowed", "")
    .replaceAll("raw_conversations_allowed", "")
    .replaceAll("hidden_reasoning_allowed", "")
    .replaceAll("private_paths_allowed", "")
    .replaceAll("private_urls_allowed", "")
    .replaceAll("secrets_allowed", "")
    .replaceAll("provider_keys_allowed", "")
    .replaceAll("connector_ids_allowed", "")
    .replaceAll("uploaded_file_ids_allowed", "")
    .replaceAll("provider_internal_ids_allowed", "");
  for (const forbiddenPattern of [
    /\/Users\//,
    /\/home\//,
    /file:\/\//,
    /https?:\/\//,
    /\bsk-[A-Za-z0-9]/,
    /\bghp_[A-Za-z0-9]/,
    /OPENAI_API_KEY/,
    /GITHUB_TOKEN/,
    /thread_[A-Za-z0-9_-]+/,
    /run_[A-Za-z0-9_-]+/,
    /uploaded[-_ ]?file[-_ ]?id/i,
    /connector[-_ ]?id/i,
  ]) {
    assert.doesNotMatch(sanitized, forbiddenPattern);
  }
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), `${label} missing ${needle}`);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ");
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
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
