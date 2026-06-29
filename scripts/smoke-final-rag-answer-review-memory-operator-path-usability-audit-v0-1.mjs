#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md";
const fixturePath =
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json";
const smokePath =
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const browserDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md";
const browserFixturePath =
  "fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json";
const browserValidationScriptPath =
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs";
const browserSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs";
const e2eDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md";
const e2eFixturePath =
  "fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json";
const e2eSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs";
const readinessDocsPath = "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md";
const readinessFixturePath =
  "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json";
const readinessSmokePath = "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs";
const uiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const uiFixturePath = "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json";
const uiSmokePath = "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs";
const uiComponentPath = "components/final-rag-answer-review-memory-panel.tsx";
const uiPagePath = "app/research-retrieval/final-rag-answer/review-memory/page.tsx";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const bindingSmokePath = "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const finalCandidateDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const finalCandidateFixturePath =
  "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const finalCandidateSmokePath =
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const promotionRuntimeDocsPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const promotionDecisionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const productWriteDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";

const packageScriptName =
  "smoke:final-rag-answer-review-memory-operator-path-usability-audit-v0-1";
const packageScriptValue =
  "node scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs";
const fixtureVersion =
  "final_rag_answer_review_memory_operator_path_usability_audit.sample.v0.1";
const scope = "project:augnes";
const recommendedSlice = "operator_path_manual_qa_runbook_v0_1";
const artifactDir =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1";

const exactOldSmokeCompatibilityFiles = [
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
  "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md",
  "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md",
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json",
  "scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_SAFETY_VALIDATION_BUNDLE_V0_1.md",
  "fixtures/operator-path-backend-safety-validation-bundle.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs",
  "docs/OPERATOR_PATH_HUMAN_REVIEW_PACKET_V0_1.md",
  "fixtures/operator-path-human-review-packet.sample.v0.1.json",
  "scripts/smoke-operator-path-human-review-packet-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_REMAINING_GAP_INVENTORY_V0_1.md",
  "fixtures/operator-path-backend-remaining-gap-inventory.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs",
  "docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md",
  "fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json",
  "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs",
];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  ...exactOldSmokeCompatibilityFiles,
]);

const requiredExistingFiles = [
  browserDocsPath,
  browserFixturePath,
  browserValidationScriptPath,
  browserSmokePath,
  e2eDocsPath,
  e2eFixturePath,
  e2eSmokePath,
  readinessDocsPath,
  readinessFixturePath,
  readinessSmokePath,
  uiDocsPath,
  uiFixturePath,
  uiSmokePath,
  uiComponentPath,
  uiPagePath,
  bindingDocsPath,
  bindingFixturePath,
  bindingSmokePath,
  finalCandidateDocsPath,
  finalCandidateFixturePath,
  finalCandidateSmokePath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  promotionRuntimeDocsPath,
  promotionDecisionStorePath,
  productWriteDocsPath,
  privacyGuardDocsPath,
  runtimeAuditDocsPath,
];

for (const filePath of [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  ...requiredExistingFiles,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = normalize(readText(docsPath));
const rawDocs = readText(docsPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const browserDocs = normalize(readText(browserDocsPath));
const browserFixture = JSON.parse(readText(browserFixturePath));
const e2eDocs = normalize(readText(e2eDocsPath));
const e2eFixture = JSON.parse(readText(e2eFixturePath));

assertDocsFixturePackageAndIndex();
assertReferenceValidationGrounding();
assertUsabilityAnalysis();
assertAuthorityAndPrivacyBoundary();
assertPublicSafeFixture();
assertNoEmbeddedBrowserArtifacts();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "final-rag-answer-review-memory-operator-path-usability-audit-v0-1",
      final_status: "pass",
      fixture_version: fixtureVersion,
      scope,
      next_recommended_slice: recommendedSlice,
      smoke_ci_browser_pass_is_truth: false,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    "final_rag_answer_review_memory_operator_path_usability_audit_v0_1",
    "operator_path_manual_qa_runbook_v0_1",
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
  for (const section of [
    "## Purpose",
    "## Relationship to PR #851 route-level E2E validation",
    "## Relationship to PR #852 browser validation",
    "## Current operator path",
    "## What is validated",
    "## What is not validated",
    "## Operator friction points",
    "## UX risk register",
    "## Authority boundary",
    "## Privacy/redaction boundary",
    "## Manual QA recommendation",
    "## Dogfood readiness recommendation",
    "## Next implementation slice recommendation",
    "## Explicitly deferred items",
    "## Fixture policy",
    "## Verification expectations",
  ]) {
    assertIncludes(rawDocs, section, `audit section ${section}`);
  }
}

function assertReferenceValidationGrounding() {
  assert.deepEqual(fixture.validated_path, [
    "final_rag_answer_generation_candidate_review_v0_1",
    "final_rag_answer_candidate_review_memory_binding_v0_1",
    "final_answer_candidate_review_ui_binding_v0_1",
    "promotion_readiness_packet_from_review_memory_v0_1",
    "final_rag_answer_review_memory_end_to_end_operator_path_v0_1",
    "final_rag_answer_review_memory_operator_browser_validation_v0_1",
  ]);
  for (const phrase of [
    "Relationship to PR #851 route-level E2E validation",
    "PR #851 added `final_rag_answer_review_memory_end_to_end_operator_path_v0_1`.",
    "Relationship to PR #852 browser validation",
    "PR #852 added `final_rag_answer_review_memory_operator_browser_validation_v0_1`.",
    "final RAG answer candidate -> Review Memory binding -> Review Memory read/display UI -> promotion readiness packet -> browser validation evidence",
    "browser validation passed only for browser-observed request boundaries",
    "Browser validation is not server-side outbound network instrumentation.",
    "Screenshots/report artifacts remain outside repo under `/tmp`",
    `${artifactDir}/report.json`,
    `${artifactDir}/desktop.png`,
    `${artifactDir}/mobile-390.png`,
    "Smoke/CI/browser pass is not truth.",
  ]) {
    assertIncludes(docs, normalize(phrase), `audit grounding phrase ${phrase}`);
  }
  assertIncludes(e2eDocs, "direct route-handler", "E2E route-handler validation");
  assertIncludes(e2eDocs, "Smoke/CI pass is not truth", "E2E no-truth boundary");
  assertIncludes(browserDocs, "browser/page network observation only", "browser observation boundary");
  assert.equal(browserFixture.expected_forbidden_routes.includes("POST route from UI"), true);
  assert.equal(e2eFixture.skipped_or_degraded_route_stage_policy.live_provider_validation_skipped, true);
}

function assertUsabilityAnalysis() {
  for (const phrase of [
    "DB path entry is still manual.",
    "Browser validation uses seeded temp DB, not long-lived operator data.",
    "UI is read/display-only and cannot fix or annotate records.",
    "Review Memory write path exists elsewhere, but UI intentionally does not write.",
    "Promotion readiness packet is not visible in the UI yet.",
    "Operator may need to jump between page, route validation, and readiness packet output.",
    "No promotion decision write is available, intentionally.",
    "Browser validation confirms no forbidden route calls, but does not prove full server-side outbound network absence.",
    "Browser visual validation is limited to generated screenshots and scripted assertions, not a full human UX review.",
    "The current path is safe enough for bounded manual QA",
    "not yet a polished dogfood operator workflow",
    "Recommended next slice: `operator_path_manual_qa_runbook_v0_1`.",
    "Choose Option A",
  ]) {
    assertIncludes(docs, normalize(phrase), `audit usability phrase ${phrase}`);
  }
  const frictionClassifications = new Set(
    fixture.operator_friction_points.map((point) => point.classification),
  );
  for (const classification of ["blocking", "high", "medium", "low", "deferred"]) {
    assert.ok(
      frictionClassifications.has(classification),
      `friction must include ${classification}`,
    );
  }
  for (const id of [
    "manual_db_path_entry",
    "seeded_temp_db_not_long_lived_operator_data",
    "read_display_only_no_fix_or_annotate",
    "review_memory_write_path_exists_elsewhere_not_ui",
    "readiness_packet_not_visible_in_ui",
    "operator_jumps_between_page_route_validation_and_packet_output",
    "no_promotion_decision_write",
    "browser_validation_not_server_outbound_proof",
    "scripted_visual_validation_not_full_human_review",
  ]) {
    assert.ok(
      fixture.operator_friction_points.some((point) => point.id === id),
      `fixture must include friction point ${id}`,
    );
  }
  assert.equal(fixture.next_recommended_slice.option, recommendedSlice);
  assert.equal(fixture.next_recommended_slice.option_label, "Option A");
  assert.equal(fixture.next_recommended_slice.adds_runtime, false);
  assert.equal(fixture.next_recommended_slice.adds_ui_changes, false);
  assert.equal(fixture.next_recommended_slice.adds_api_routes, false);
  assert.equal(fixture.manual_qa_readiness.bounded_manual_qa_safe_now, true);
  assert.equal(fixture.manual_qa_readiness.broad_dogfood_ready_now, false);
}

function assertAuthorityAndPrivacyBoundary() {
  for (const phrase of [
    "This audit creates no new runtime authority.",
    "It adds no API routes",
    "no UI behavior changes",
    "no promotion execution",
    "no promotion decision write",
    "no promotion decision store write",
    "no proof/evidence creation",
    "no durable Perspective state write/apply",
    "no Formation Receipt write",
    "no product-write",
    "no accepted evidence ref write",
    "no product ID allocation",
    "no GitHub actuation",
    "no release execution",
    "Smoke/CI/browser pass is not truth",
  ]) {
    assertIncludes(docs, normalize(phrase), `authority phrase ${phrase}`);
  }
  for (const field of [
    "review_memory_write_from_ui",
    "post_route_call_from_ui",
    "final_answer_generation_now",
    "provider_call_now",
    "prompt_sent_now",
    "retrieval_execution_now",
    "source_fetch_now",
    "retrieval_index_write_now",
    "promotion_execution_now",
    "promotion_decision_write_now",
    "promotion_decision_store_write_now",
    "proof_or_evidence_creation_now",
    "durable_state_mutation_now",
    "formation_receipt_write_now",
    "product_write_now",
    "accepted_evidence_ref_write_now",
    "product_id_allocation_now",
    "github_or_release_authority_now",
    "smoke_ci_browser_pass_is_truth",
  ]) {
    assert.equal(
      fixture.validated_authority_boundaries[field],
      false,
      `${field} must remain false`,
    );
  }
  for (const forbidden of [
    "new_api_routes",
    "ui_behavior_changes",
    "review_memory_writes_from_ui",
    "final_answer_generation_expansion",
    "provider_calls",
    "prompt_sending",
    "retrieval_execution",
    "source_fetching",
    "retrieval_index_writes",
    "promotion_execution",
    "promotion_decision_record_writes",
    "promotion_decision_store_writes",
    "proof_or_evidence_creation",
    "durable_perspective_state_apply",
    "formation_receipt_writes",
    "product_write",
    "accepted_evidence_ref_write_from_final_answer",
    "product_id_allocation",
    "github_actuation",
    "release_execution",
  ]) {
    assert.ok(fixture.still_forbidden.includes(forbidden), `still forbidden ${forbidden}`);
  }
}

function assertPublicSafeFixture() {
  assert.equal(fixture.browser_validation_summary.final_status, "pass");
  assert.equal(fixture.browser_validation_summary.forbidden_request_count, 0);
  assert.equal(fixture.browser_validation_summary.external_request_count, 0);
  assert.equal(fixture.browser_validation_summary.relevant_console_error_count, 0);
  assert.equal(fixture.browser_validation_summary.pageerror_count, 0);
  assert.equal(fixture.browser_validation_summary.failed_request_count, 0);
  assert.equal(fixture.browser_validation_summary.ignored_local_favicon_404_console_message, 1);
  assert.equal(fixture.browser_validation_summary.browser_observed_request_boundaries_only, true);
  assert.equal(fixture.browser_validation_summary.server_side_outbound_instrumentation, false);
  assert.equal(fixture.route_validation_summary.final_status, "pass");
  assert.equal(fixture.route_validation_summary.execution_mode, "direct_route_handlers");
  assert.equal(fixture.route_validation_summary.raw_route_responses_copied, false);
  for (const policyKey of [
    "raw_browser_reports_allowed",
    "screenshots_embedded_in_repo_allowed",
    "raw_route_responses_allowed",
    "raw_db_rows_allowed",
    "raw_provider_output_allowed",
    "raw_prompt_text_allowed",
    "raw_retrieval_output_allowed",
    "raw_source_bodies_allowed",
    "hidden_reasoning_allowed",
    "terminal_logs_allowed",
    "private_paths_allowed",
    "browser_session_dumps_allowed",
    "real_secrets_allowed",
    "real_provider_ids_allowed",
    "real_product_ids_allowed",
    "github_payloads_allowed",
    "browser_artifact_contents_copied",
    "smoke_ci_browser_pass_is_truth",
  ]) {
    assert.equal(
      fixture.public_safe_fixture_policy[policyKey],
      false,
      `fixture policy must block ${policyKey}`,
    );
  }
  assertNoUnsafeText(fixtureText, "fixture");
  assertNoRawArtifactText(fixtureText, "fixture");
}

function assertNoEmbeddedBrowserArtifacts() {
  assert.equal(/!\[[^\]]*]\([^)]*\)/.test(rawDocs), false, "audit must not embed images");
  assert.equal(rawDocs.includes("data:image/"), false, "audit must not embed image data");
  assertNoRawArtifactText(rawDocs, "audit");
  for (const filePath of changedFiles()) {
    assert.equal(filePath.endsWith(".png"), false, "changed files must not include screenshots");
    assert.equal(filePath.endsWith(".jpg"), false, "changed files must not include screenshots");
    assert.equal(filePath.endsWith(".jpeg"), false, "changed files must not include screenshots");
    assert.equal(filePath.endsWith(".webp"), false, "changed files must not include screenshots");
  }
}

function assertChangedFileScope() {
  const unexpected = changedFiles()
    .filter((filePath) => !expectedChangedFiles.has(filePath))
    .sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to audit docs/fixture/smoke/package/index plus exact old-smoke compatibility exceptions",
  );
}

function assertNoUnsafeText(text, label) {
  const withoutAllowedTmpArtifacts = text.replaceAll(artifactDir, "/tmp/ARTIFACT_DIR");
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
    assert.equal(withoutAllowedTmpArtifacts.includes(marker), false, `${label} must not contain ${marker}`);
  }
}

function assertNoRawArtifactText(text, label) {
  for (const marker of [
    "raw_browser_dump",
    "request_headers",
    "response_headers",
    "browser_session_dump_payload",
    "terminal log:",
    "screenshot_base64",
    "data:image",
  ]) {
    assert.equal(text.includes(marker), false, `${label} must not include ${marker}`);
  }
}

function changedFiles() {
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
  return [...changed].sort();
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
