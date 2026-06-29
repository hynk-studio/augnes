#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md";
const fixturePath = "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json";
const smokePath = "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const usabilityAuditDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md";
const usabilityAuditFixturePath =
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json";
const usabilityAuditSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs";
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

const fixtureVersion = "operator_path_manual_qa_runbook.sample.v0.1";
const scope = "project:augnes";
const runbookRef = "operator_path_manual_qa_runbook_v0_1";
const packageScriptName = "smoke:operator-path-manual-qa-runbook-v0-1";
const packageScriptValue = "node scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs";
const manualPagePath =
  "http://localhost:<DEV_SERVER_PORT>/research-retrieval/final-rag-answer/review-memory";
const artifactDir =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1";

const exactOldSmokeCompatibilityFiles = [
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
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
  usabilityAuditDocsPath,
  usabilityAuditFixturePath,
  usabilityAuditSmokePath,
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

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const usabilityAuditDocs = normalize(readText(usabilityAuditDocsPath));
const browserDocs = normalize(readText(browserDocsPath));
const e2eDocs = normalize(readText(e2eDocsPath));

assertDocsFixturePackageAndIndex();
assertReferenceGrounding();
assertRequiredSections();
assertCommandGroups();
assertManualPathAndArtifacts();
assertPassFailEvidenceTroubleshooting();
assertAuthorityBoundary();
assertPublicSafeFixture();
assertNoEmbeddedArtifactsOrUnsafeValues();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "operator-path-manual-qa-runbook-v0-1",
      final_status: "pass",
      fixture_version: fixtureVersion,
      scope,
      runbook_ref: runbookRef,
      next_recommended_after_runbook: "manual_qa_execution_report_v0_1",
      smoke_ci_browser_pass_is_truth: false,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.runbook_ref, runbookRef);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    runbookRef,
    "manual_qa_execution_report_v0_1",
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
}

function assertReferenceGrounding() {
  for (const phrase of [
    "PR #853",
    "final_rag_answer_review_memory_operator_path_usability_audit_v0_1",
    "PR #852 browser validation",
    "PR #851 route-level E2E validation",
    "final RAG answer candidate -> Review Memory binding -> Review Memory read/display UI -> promotion readiness packet -> route-level E2E validation -> browser validation -> manual UI inspection",
  ]) {
    assertIncludes(docs, normalize(phrase), `reference grounding ${phrase}`);
  }
  assertIncludes(usabilityAuditDocs, "operator_path_manual_qa_runbook_v0_1", "#853 audit recommendation");
  assertIncludes(browserDocs, "final_rag_answer_review_memory_operator_browser_validation_v0_1", "#852 browser validation");
  assertIncludes(e2eDocs, "final_rag_answer_review_memory_end_to_end_operator_path_v0_1", "#851 route validation");
  assert.deepEqual(fixture.validated_path, [
    "final_rag_answer_generation_candidate_review_v0_1",
    "final_rag_answer_candidate_review_memory_binding_v0_1",
    "final_answer_candidate_review_ui_binding_v0_1",
    "promotion_readiness_packet_from_review_memory_v0_1",
    "final_rag_answer_review_memory_end_to_end_operator_path_v0_1",
    "final_rag_answer_review_memory_operator_browser_validation_v0_1",
    "manual_ui_inspection",
  ]);
}

function assertRequiredSections() {
  for (const section of [
    "## Purpose",
    "## Scope",
    "## Preconditions",
    "## Authority boundary",
    "## What this runbook validates",
    "## What this runbook does not validate",
    "## Required local environment",
    "## Setup",
    "## Step 1: run static validation",
    "## Step 2: run route-level E2E validation",
    "## Step 3: run browser validation",
    "## Step 4: inspect browser artifacts",
    "## Step 5: open the UI manually",
    "## Step 6: use seeded Review Memory DB path",
    "## Step 7: verify visible boundary notes",
    "## Step 8: list and inspect final answer candidate Review Memory record",
    "## Step 9: load activity history",
    "## Step 10: check copied bounded packet",
    "## Step 11: verify invalid DB path blocking",
    "## Step 12: verify private/raw filter blocking",
    "## Step 13: verify no forbidden route calls",
    "## Step 14: verify promotion readiness packet remains diagnostic",
    "## Pass criteria",
    "## Fail criteria",
    "## Evidence to collect",
    "## Known warnings",
    "## Troubleshooting",
    "## Out-of-scope actions",
    "## Stop conditions",
    "## Next recommendation after manual QA",
  ]) {
    assertIncludes(rawDocs, section, `required section ${section}`);
  }
}

function assertCommandGroups() {
  const allCommands = [
    ...fixture.required_commands.static_baseline,
    ...fixture.required_commands.focused_smokes,
    ...fixture.required_commands.browser_validation,
    ...fixture.required_commands.type_and_diff,
  ];
  for (const command of [
    "node --check scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
    "npm run smoke:operator-path-manual-qa-runbook-v0-1",
    "npm run smoke:final-rag-answer-review-memory-operator-path-usability-audit-v0-1",
    "npm run smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1",
    "npm run smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1",
    "npm run smoke:promotion-readiness-packet-from-review-memory-v0-1",
    "npm run smoke:final-answer-candidate-review-ui-binding-v0-1",
    "npm run smoke:final-rag-answer-review-memory-binding-v0-1",
    "npm run smoke:final-rag-answer-generation-candidate-review-v0-1",
    "npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1",
    "npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1",
    "npm run smoke:perspective-promotion-runtime-contract-v0-1",
    "npm run smoke:perspective-promotion-decision-store-v0-1",
    "npm run smoke:product-write-accepted-evidence-ref-runtime-v0-1",
    "npm run smoke:privacy-redaction-guard-v0-1",
    "npm run smoke:authority-boundary-regression-v0-1",
    "npm run smoke:runtime-audit-panel-runtime-completion-v0-1",
    "npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1",
    "npm run typecheck",
    "git diff --check",
    "git diff --cached --check",
  ]) {
    assertIncludes(rawDocs, command, `docs command ${command}`);
    assert.ok(allCommands.includes(command), `fixture command ${command}`);
  }
}

function assertManualPathAndArtifacts() {
  assert.equal(fixture.manual_page_path, manualPagePath);
  assertIncludes(rawDocs, manualPagePath, "manual page path");
  assertIncludes(rawDocs, "<SEE_BROWSER_VALIDATION_REPORT_FOR_SEEDED_DB_PATH>", "seeded DB placeholder");
  assertIncludes(rawDocs, "<SEE_BROWSER_VALIDATION_REPORT_FOR_ARTIFACT_DIR>", "artifact dir placeholder");
  for (const artifactPath of [
    `${artifactDir}/report.json`,
    `${artifactDir}/desktop.png`,
    `${artifactDir}/mobile-390.png`,
  ]) {
    assertIncludes(rawDocs, artifactPath, `artifact path ${artifactPath}`);
  }
  for (const phrase of [
    "Do not copy artifact contents into the repo.",
    "Do not embed screenshots in repo docs.",
    "Do not copy raw report contents into repo docs.",
    "Do not include raw browser dumps.",
  ]) {
    assertIncludes(docs, normalize(phrase), `artifact policy ${phrase}`);
  }
}

function assertPassFailEvidenceTroubleshooting() {
  for (const criterion of [
    "Browser validation final_status is pass.",
    "Browser validation launched a real browser.",
    "Desktop and mobile screenshots are created under /tmp.",
    "Boundary notes are visible.",
    "Invalid DB path is blocked before fetch.",
    "Private/raw filter is blocked before fetch.",
    "Browser-observed forbidden request count is 0.",
    "Browser-observed external request count is 0.",
    "No UI POST calls are observed.",
    "Readiness packet remains diagnostic only.",
    "No promotion decision write/store usage occurs.",
    "No proof/evidence creation occurs.",
    "No durable state mutation occurs.",
    "No Formation Receipt write occurs.",
    "No product-write / accepted evidence ref write / product ID allocation occurs.",
  ]) {
    assertIncludes(docs, normalize(criterion), `pass criterion ${criterion}`);
    assert.ok(fixture.pass_criteria.includes(criterion), `fixture pass criterion ${criterion}`);
  }
  for (const criterion of [
    "Any command exits nonzero.",
    "Browser validation cannot launch a real browser.",
    "Browser validation report is missing.",
    "Screenshots are missing.",
    "Boundary notes are absent.",
    "Forbidden route count is greater than 0.",
    "External request count is greater than 0.",
    "UI makes POST calls.",
    "Raw/private data is displayed or copied.",
    "Invalid DB path triggers fetch.",
    "Private/raw filter triggers fetch.",
    "Promotion decision write/store usage occurs.",
    "Product-write or accepted evidence ref write occurs.",
    "Smoke/CI/browser pass is described as truth.",
  ]) {
    assertIncludes(docs, normalize(criterion), `fail criterion ${criterion}`);
    assert.ok(fixture.fail_criteria.includes(criterion), `fixture fail criterion ${criterion}`);
  }
  for (const evidence of [
    "command names and pass/fail status",
    "browser report path",
    "screenshot paths",
    "seeded DB path as symbolic or repo-safe relative path only",
    "observed forbidden request count",
    "observed external request count",
    "short manual notes about readability/friction",
  ]) {
    assertIncludes(docs, evidence, `evidence ${evidence}`);
    assert.ok(fixture.evidence_to_collect.includes(evidence), `fixture evidence ${evidence}`);
  }
  for (const item of [
    "Browser unavailable",
    "Dev server port conflict",
    "Missing browser report",
    "Seeded DB path not obvious",
    "Empty record list",
    "Boundary notes missing",
    "Invalid DB path block not visible",
    "Private/raw filter block not visible",
    "Favicon 404 noise",
    "MODULE_TYPELESS_PACKAGE_JSON warning",
    "ExperimentalWarning: stripTypeScriptTypes warning",
  ]) {
    assertIncludes(rawDocs, item, `troubleshooting ${item}`);
    assert.ok(fixture.troubleshooting_items.includes(item), `fixture troubleshooting ${item}`);
  }
}

function assertAuthorityBoundary() {
  for (const phrase of [
    "This runbook creates no new runtime authority.",
    "No new API routes are added.",
    "No UI behavior changes are added.",
    "No Review Memory writes from UI are added.",
    "This runbook does not expand final answer generation, live provider calls, prompt sending, retrieval execution, source fetching, or retrieval index writes.",
    "This runbook does not execute promotion",
    "write promotion decision records",
    "use or write the promotion decision store",
    "create proof/evidence",
    "mutate durable Perspective state",
    "write Formation Receipts",
    "product-write",
    "write accepted evidence refs",
    "allocate product IDs",
    "execute GitHub actuation",
    "execute release work",
    "Smoke/CI/browser pass is not truth.",
  ]) {
    assertIncludes(docs, normalize(phrase), `authority phrase ${phrase}`);
  }
  for (const forbidden of [
    "new_api_routes",
    "ui_behavior_changes",
    "review_memory_writes_from_ui",
    "live_provider_calls",
    "retrieval_execution_expansion",
    "source_fetching",
    "promotion_execution",
    "promotion_decision_record_writes",
    "promotion_decision_store_writes",
    "proof_or_evidence_creation",
    "durable_perspective_state_write_or_apply",
    "formation_receipt_writes",
    "product_write",
    "accepted_evidence_ref_write",
    "product_id_allocation",
    "github_actuation",
    "release_execution",
  ]) {
    assert.ok(fixture.forbidden_actions.includes(forbidden), `fixture forbids ${forbidden}`);
  }
}

function assertPublicSafeFixture() {
  assert.equal(fixture.next_recommended_after_runbook.slice, "manual_qa_execution_report_v0_1");
  assert.equal(
    fixture.next_recommended_after_runbook.only_after_human_actually_runs_runbook,
    true,
  );
  assert.equal(
    fixture.next_recommended_after_runbook.do_not_recommend_promotion_decision_write_yet,
    true,
  );
  assert.equal(
    fixture.next_recommended_after_runbook
      .do_not_recommend_promotion_readiness_ui_binding_before_runbook_execution_review,
    true,
  );
  for (const note of fixture.expected_boundary_notes) {
    assertIncludes(rawDocs, note, `boundary note ${note}`);
  }
  for (const policyKey of [
    "raw_db_rows_allowed",
    "raw_route_responses_allowed",
    "raw_browser_reports_allowed",
    "screenshots_embedded_in_repo_allowed",
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
}

function assertNoEmbeddedArtifactsOrUnsafeValues() {
  assert.equal(/!\[[^\]]*]\([^)]*\)/.test(rawDocs), false, "runbook must not embed images");
  assert.equal(rawDocs.includes("data:image/"), false, "runbook must not embed image data");
  assertNoUnsafeText(rawDocs, "runbook");
  assertNoUnsafeText(fixtureText, "fixture");
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
    "changed-file scope limited to manual QA runbook docs/fixture/smoke/package/index plus exact old-smoke compatibility exceptions",
  );
}

function assertNoUnsafeText(text, label) {
  const allowed = text
    .replaceAll(artifactDir, "/tmp/ARTIFACT_DIR")
    .replaceAll(manualPagePath, "http://localhost:PORT/PAGE")
    .replaceAll("http://localhost:<DEV_SERVER_PORT>", "http://localhost:PORT");
  for (const marker of [
    "/Users/",
    "/home/",
    "file://",
    "github_pat_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "sk-",
    "ghp_",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
  ]) {
    assert.equal(allowed.includes(marker), false, `${label} must not contain ${marker}`);
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
