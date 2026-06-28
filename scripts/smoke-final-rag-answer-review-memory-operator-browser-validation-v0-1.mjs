#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md";
const fixturePath =
  "fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json";
const browserScriptPath =
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs";
const smokePath =
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const uiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const uiFixturePath = "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json";
const uiSmokePath = "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs";
const uiComponentPath = "components/final-rag-answer-review-memory-panel.tsx";
const uiPagePath = "app/research-retrieval/final-rag-answer/review-memory/page.tsx";
const e2eDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md";
const e2eFixturePath =
  "fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json";
const e2eSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const bindingSmokePath = "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const finalCandidateDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const readinessDocsPath = "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStorePath = "lib/research-candidate-review/review-memory-db-store.ts";
const reviewMemoryRouteContractPath =
  "lib/research-candidate-review/review-memory-db-route-contract.ts";
const promotionRuntimeDocsPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const promotionDecisionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const productWriteDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";

const packageBrowserScriptName =
  "browser:validate-final-rag-answer-review-memory-operator-path-v0-1";
const packageSmokeScriptName =
  "smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1";
const packageBrowserScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs";
const packageSmokeScriptValue =
  "node scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs";
const validationVersion =
  "final_rag_answer_review_memory_operator_browser_validation.v0.1";
const scope = "project:augnes";
const pagePath = "/research-retrieval/final-rag-answer/review-memory";
const artifactDir =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1";

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  browserScriptPath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
]);

const requiredExistingFiles = [
  uiDocsPath,
  uiFixturePath,
  uiSmokePath,
  uiComponentPath,
  uiPagePath,
  e2eDocsPath,
  e2eFixturePath,
  e2eSmokePath,
  bindingDocsPath,
  bindingFixturePath,
  bindingSmokePath,
  finalCandidateDocsPath,
  readinessDocsPath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStorePath,
  reviewMemoryRouteContractPath,
  promotionRuntimeDocsPath,
  promotionDecisionStorePath,
  productWriteDocsPath,
  privacyGuardDocsPath,
  runtimeAuditDocsPath,
];

for (const filePath of [
  docsPath,
  fixturePath,
  browserScriptPath,
  smokePath,
  packagePath,
  indexPath,
  ...requiredExistingFiles,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = normalize(readText(docsPath));
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const browserScript = readText(browserScriptPath);
const smokeSource = readText(smokePath);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const uiDocs = normalize(readText(uiDocsPath));
const uiComponent = readText(uiComponentPath);
const uiPage = readText(uiPagePath);
const e2eDocs = normalize(readText(e2eDocsPath));
const bindingDocs = normalize(readText(bindingDocsPath));
const finalCandidateDocs = normalize(readText(finalCandidateDocsPath));
const readinessDocs = normalize(readText(readinessDocsPath));

assertDocsFixturePackageAndIndex();
assertBrowserValidationScript();
assertExistingRuntimeReferences();
assertPublicSafeFixture();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "final-rag-answer-review-memory-operator-browser-validation-v0-1",
      final_status: "pass",
      validation_version: validationVersion,
      scope,
      browser_validation_script: browserScriptPath,
      browser_pass_is_truth: false,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.validation_version, validationVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.page_path, pagePath);
  assert.equal(fixture.expected_panel_marker, "final-answer-candidate-review-ui-binding");
  assert.equal(packageJson.scripts[packageBrowserScriptName], packageBrowserScriptValue);
  assert.equal(packageJson.scripts[packageSmokeScriptName], packageSmokeScriptValue);
  for (const phrase of [
    "final_rag_answer_review_memory_operator_browser_validation_v0_1",
    "browser/operator usability only",
    "adds no runtime authority",
    "adds no API routes",
    "adds no UI behavior",
    "temporary seeded Review Memory DB",
    "existing Review Memory GET routes only",
    "does not POST",
    "does not write Review Memory",
    "does not generate final answers",
    "does not call providers",
    "does not send prompts",
    "does not execute retrieval",
    "does not fetch sources",
    "does not write retrieval indexes",
    "does not create proof/evidence",
    "does not promote Perspective",
    "does not write promotion decisions",
    "does not use/write the promotion decision store",
    "does not write Formation Receipts",
    "does not write/apply durable state",
    "does not product-write",
    "does not write accepted evidence refs",
    "does not allocate product IDs",
    "Browser readiness is not truth",
    "Smoke/CI/browser pass is not truth",
  ]) {
    assertIncludes(docs, phrase, "docs");
  }
  assert.ok(index.includes(docsPath), "latest index must include browser validation docs");
  assert.ok(index.includes(browserScriptPath), "latest index must include browser validation script");
  assert.ok(index.includes(packageBrowserScriptName), "latest index must include browser package script");
}

function assertBrowserValidationScript() {
  for (const phrase of [
    pagePath,
    "data-augnes-surface=\"final-answer-candidate-review-ui-binding\"",
    ".tmp/research-candidate-review-memory/",
    "createResearchCandidateReviewRecordV01",
    "appendResearchCandidateReviewRecordActivityV01",
    "Seed Review Memory record",
    "seed_write_test_setup_only",
    "npm",
    "run",
    "dev",
    "Chrome DevTools Protocol",
    "remote-debugging-port",
    "Page.captureScreenshot",
    desktopScreenshotPathMarker(),
    mobileScreenshotPathMarker(),
    "report.json",
    "Network.requestWillBeSent",
    "Network.responseReceived",
    "Network.loadingFailed",
    "external_non_localhost_url",
    "post_route_call_now",
    "GET /api/research-candidate-review/review-records",
    "/api/research-candidate-review/review-records/[review_record_id]",
    "/api/research-candidate-review/review-records/[review_record_id]/activity",
    "/api/research-retrieval/final-rag-answer",
    "/api/research-retrieval/final-rag-answer/review-memory",
    "/api/perspective/promotion/readiness-packet",
    "/api/product-write",
    "provider",
    "retrieval_rebuild_or_search_route",
    "source_fetch_route",
    "github_route",
    "release_route",
    "Review Memory is not truth.",
    "Review Memory is not proof.",
    "Review Memory is not accepted evidence.",
    "Review Memory is not durable Perspective state.",
    "Final answer candidate remains candidate-only.",
    "Source refs are lineage pointers, not proof.",
    "This UI is read/display only.",
    "Smoke/CI pass is not truth.",
    "invalid_db_path_blocked_before_fetch",
    "private_raw_filter_blocked_before_fetch",
    "bounded_packet_preview_created",
    "no_post_calls",
    "no_forbidden_route_calls",
    "no_external_requests",
    "no provider call",
    "no prompt sending",
    "no retrieval execution",
    "no source fetch",
    "no product-write",
    "no promotion execution",
    "no proof/evidence creation",
    "no Formation Receipt write",
    "no Git/GitHub/release execution",
    "browser pass is not truth",
  ]) {
    assertIncludes(browserScript, phrase, "browser validation script");
  }
  assert.doesNotMatch(browserScript, /POST \/api\/research-candidate-review\/review-records/);
  assert.doesNotMatch(browserScript, /localStorage|sessionStorage|document\\.cookie|indexedDB/);
}

function assertExistingRuntimeReferences() {
  assertIncludes(uiDocs, "read/display-only", "UI docs");
  assertIncludes(uiComponent, "List matching records", "UI component");
  assertIncludes(uiComponent, "Copy bounded packet", "UI component");
  assertIncludes(uiComponent, "review_memory_write_now: false", "UI component");
  assertIncludes(uiComponent, "fetch(route, { method: \"GET\" })", "UI component");
  assert.doesNotMatch(uiComponent, /fetch\([^)]*method:\s*["']POST["']/);
  assertIncludes(uiPage, "FinalRagAnswerReviewMemoryPanel", "UI page");
  assertIncludes(e2eDocs, "final_rag_answer_review_memory_end_to_end_operator_path_v0_1", "E2E docs");
  assertIncludes(bindingDocs, "final_rag_answer_candidate_review_memory_binding_v0_1", "binding docs");
  assertIncludes(finalCandidateDocs, "final_rag_answer_generation_candidate_review_v0_1", "final candidate docs");
  assertIncludes(readinessDocs, "promotion_readiness_packet_from_review_memory_v0_1", "readiness docs");
}

function assertPublicSafeFixture() {
  assert.equal(fixture.expected_artifact_paths.report_json, `${artifactDir}/report.json`);
  assert.equal(fixture.expected_artifact_paths.desktop_screenshot, `${artifactDir}/desktop.png`);
  assert.equal(fixture.expected_artifact_paths.mobile_screenshot, `${artifactDir}/mobile-390.png`);
  assert.deepEqual(fixture.expected_allowed_routes, [
    "GET /api/research-candidate-review/review-records",
    "GET /api/research-candidate-review/review-records/[review_record_id]",
    "GET /api/research-candidate-review/review-records/[review_record_id]/activity",
  ]);
  for (const route of [
    "POST route from UI",
    "/api/research-retrieval/final-rag-answer",
    "/api/research-retrieval/final-rag-answer/review-memory",
    "/api/perspective/promotion/readiness-packet",
    "/api/product-write",
    "provider extraction routes",
    "retrieval rebuild/search routes",
    "source fetch routes",
    "GitHub routes",
    "release routes",
    "external non-localhost URLs",
  ]) {
    assert.ok(fixture.expected_forbidden_routes.includes(route), `fixture forbids ${route}`);
  }
  for (const flag of [
    "review_memory_write_from_ui",
    "post_route_call_from_ui",
    "final_answer_generation_from_ui",
    "provider_call_from_ui",
    "prompt_sent_from_ui",
    "retrieval_execution_from_ui",
    "source_fetch_from_ui",
    "retrieval_index_write_from_ui",
    "promotion_execution_from_ui",
    "promotion_decision_write_from_ui",
    "proof_or_evidence_creation_from_ui",
    "durable_state_mutation_from_ui",
    "formation_receipt_write_from_ui",
    "product_write_from_ui",
    "accepted_evidence_ref_write_from_ui",
    "product_id_allocation_from_ui",
    "github_or_release_execution_from_ui",
    "browser_pass_is_truth",
  ]) {
    assert.equal(fixture.expected_no_authority_flags[flag], false, `${flag} must be false`);
  }
  for (const policyKey of [
    "raw_prompt_payloads_allowed",
    "raw_provider_outputs_allowed",
    "raw_retrieval_outputs_allowed",
    "raw_source_bodies_allowed",
    "raw_db_rows_allowed",
    "raw_conversations_allowed",
    "hidden_reasoning_allowed",
    "chain_of_thought_allowed",
    "telemetry_dumps_allowed",
    "raw_diffs_allowed",
    "terminal_logs_allowed",
    "github_payloads_allowed",
    "browser_or_session_dumps_allowed",
  ]) {
    assert.equal(
      fixture.public_safe_fixture_policy[policyKey],
      false,
      `fixture policy must block ${policyKey}`,
    );
  }
  assertNoUnsafeText(fixtureText, "fixture");
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
    "changed-file scope limited to approved browser validation files plus exact old-smoke compatibility exceptions if required",
  );
}

function assertNoUnsafeText(text, label) {
  for (const marker of [
    "github_pat_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "sk-",
    "ghp_",
    "http://",
    "https://",
    "/Users/",
    "/home/",
    "file://",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
  ]) {
    assert.equal(text.includes(marker), false, `${label} must not contain ${marker}`);
  }
}

function desktopScreenshotPathMarker() {
  return "desktop.png";
}

function mobileScreenshotPathMarker() {
  return "mobile-390.png";
}

function isTempSmokeArtifact(filePath) {
  return filePath.startsWith(".tmp/") || filePath.startsWith("tmp/");
}

function runGitLines(args, options = {}) {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (options.allowFailure) return [];
    throw error;
  }
}

function assertIncludes(text, phrase, label) {
  assert.ok(text.includes(phrase), `${label} must include ${phrase}`);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
