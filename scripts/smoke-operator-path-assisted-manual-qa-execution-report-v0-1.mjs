#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md";
const fixturePath =
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json";
const assistedScriptPath =
  "scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs";
const smokePath =
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const runbookDocsPath = "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md";
const runbookFixturePath = "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json";
const runbookSmokePath = "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs";
const usabilityAuditDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md";
const browserDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md";
const browserValidationScriptPath =
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs";
const browserSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs";
const e2eDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md";
const e2eSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs";
const readinessDocsPath = "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md";
const uiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const uiComponentPath = "components/final-rag-answer-review-memory-panel.tsx";
const uiPagePath = "app/research-retrieval/final-rag-answer/review-memory/page.tsx";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const finalCandidateDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const promotionRuntimeDocsPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const promotionDecisionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const productWriteDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";

const fixtureVersion = "operator_path_assisted_manual_qa_execution_report.sample.v0.1";
const scope = "project:augnes";
const reportRef = "operator_path_assisted_manual_qa_execution_report_v0_1";
const runbookRef = "operator_path_manual_qa_runbook_v0_1";
const expectedTmpReportPath =
  "/tmp/augnes-operator-path-assisted-manual-qa-execution-report-v0-1/report.json";
const browserArtifactDir =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1";
const assistedPackageScriptName = "assisted:operator-path-manual-qa-v0-1";
const smokePackageScriptName =
  "smoke:operator-path-assisted-manual-qa-execution-report-v0-1";
const assistedPackageScriptValue =
  "node scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs";
const smokePackageScriptValue =
  "node scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs";

const exactOldSmokeCompatibilityFiles = [
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  assistedScriptPath,
  smokePath,
  packagePath,
  indexPath,
  ...exactOldSmokeCompatibilityFiles,
]);

for (const filePath of [
  docsPath,
  fixturePath,
  assistedScriptPath,
  smokePath,
  packagePath,
  indexPath,
  runbookDocsPath,
  runbookFixturePath,
  runbookSmokePath,
  usabilityAuditDocsPath,
  browserDocsPath,
  browserValidationScriptPath,
  browserSmokePath,
  e2eDocsPath,
  e2eSmokePath,
  readinessDocsPath,
  uiDocsPath,
  uiComponentPath,
  uiPagePath,
  bindingDocsPath,
  finalCandidateDocsPath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  promotionRuntimeDocsPath,
  promotionDecisionStorePath,
  productWriteDocsPath,
  privacyGuardDocsPath,
  runtimeAuditDocsPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const assistedScript = readText(assistedScriptPath);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertDocsFixturePackageAndIndex();
assertAssistedScriptShape();
assertAuthorityAndHumanSignoff();
assertPublicSafePolicy();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "operator-path-assisted-manual-qa-execution-report-v0-1",
      final_status: "pass",
      fixture_version: fixtureVersion,
      scope,
      report_ref: reportRef,
      next_recommended_slice: "human_spot_review_of_assisted_manual_qa_v0_1",
      human_signoff_completed: false,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.report_ref, reportRef);
  assert.equal(fixture.runbook_ref, runbookRef);
  assert.equal(packageJson.scripts?.[assistedPackageScriptName], assistedPackageScriptValue);
  assert.equal(packageJson.scripts?.[smokePackageScriptName], smokePackageScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    assistedScriptPath,
    smokePath,
    assistedPackageScriptName,
    smokePackageScriptName,
    reportRef,
    runbookRef,
    "human_spot_review_of_assisted_manual_qa_v0_1",
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
  for (const section of [
    "## Purpose",
    "## Relationship to OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1",
    "## What Codex/CDP executed",
    "## What Codex/CDP did not execute",
    "## Browser validation rerun summary",
    "## Assisted execution report artifact",
    "## Mechanical pass criteria",
    "## Human judgment items still required",
    "## Authority boundary",
    "## Privacy/redaction boundary",
    "## Known warnings",
    "## Final assisted execution status",
    "## Next recommendation",
    "## Verification expectations",
  ]) {
    assertIncludes(rawDocs, section, `required section ${section}`);
  }
}

function assertAssistedScriptShape() {
  for (const phrase of [
    "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md",
    "npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1",
    `${browserArtifactDir}/report.json`,
    `${browserArtifactDir}/desktop.png`,
    `${browserArtifactDir}/mobile-390.png`,
    expectedTmpReportPath,
    "raw_browser_report_contents_copied_into_repo: false",
    "raw_route_responses_copied_into_repo: false",
    "raw_db_rows_copied_into_repo: false",
    "terminal_logs_copied_into_repo: false",
    "human_signoff_completed: false",
    "human_review_still_required: true",
    "safe_to_request_human_spot_review",
    "browser/page network events only",
    "not server-side outbound network instrumentation",
  ]) {
    assertIncludes(assistedScript, phrase, `assisted script phrase ${phrase}`);
  }
  assert.equal(fixture.expected_tmp_report_path, expectedTmpReportPath);
  assert.equal(
    fixture.expected_browser_artifact_paths.browser_report_path,
    `${browserArtifactDir}/report.json`,
  );
  assert.equal(
    fixture.expected_browser_artifact_paths.desktop_screenshot_path,
    `${browserArtifactDir}/desktop.png`,
  );
  assert.equal(
    fixture.expected_browser_artifact_paths.mobile_screenshot_path,
    `${browserArtifactDir}/mobile-390.png`,
  );
}

function assertAuthorityAndHumanSignoff() {
  for (const phrase of [
    "This is Codex/CDP/browser-assisted execution, not human QA signoff.",
    "Human signoff remains required.",
    "Smoke/CI/browser pass is not truth.",
    "does not create product authority",
    "It does not execute promotion.",
    "It does not write promotion decisions.",
    "It does not use/write the promotion decision store.",
    "It does not create proof/evidence.",
    "It does not write durable state.",
    "It does not write Formation Receipts.",
    "It does not product-write.",
    "It does not write accepted evidence refs.",
    "It does not allocate product IDs.",
    "It does not create GitHub or release authority.",
  ]) {
    assertIncludes(docs, normalize(phrase), `authority docs phrase ${phrase}`);
  }
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.human_review_still_required, true);
  assert.equal(fixture.next_recommended_slice, "human_spot_review_of_assisted_manual_qa_v0_1");
  for (const item of [
    "full human comprehension of runbook clarity",
    "human assessment of UI readability",
    "human assessment of whether boundary notes are sufficiently understandable",
    "human assessment of whether readiness can be confused with promotion",
    "human dogfood readiness signoff",
    "human decision on next product slice",
    "human acceptance of screenshots and UI layout",
  ]) {
    assertIncludes(rawDocs, item, `human judgment item ${item}`);
    assert.ok(
      fixture.human_judgment_items_not_completed.includes(item),
      `fixture human item ${item}`,
    );
  }
  for (const forbidden of [
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
    "human_signoff",
  ]) {
    assert.ok(
      fixture.forbidden_capabilities_not_opened.includes(forbidden),
      `fixture forbids ${forbidden}`,
    );
  }
}

function assertPublicSafePolicy() {
  for (const phrase of [
    "does not copy screenshots into the repo",
    "does not copy raw browser report contents into the repo",
    "does not copy raw route responses",
    "raw DB rows",
    "terminal logs",
    "raw provider output",
    "raw prompts",
    "raw retrieval output",
    "raw source bodies",
    "hidden reasoning",
    "secrets",
    "private local paths",
    "browser session dumps",
    "provider IDs",
    "product IDs",
    "GitHub payloads",
  ]) {
    assertIncludes(docs, normalize(phrase), `privacy docs phrase ${phrase}`);
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
    "release_payloads_allowed",
    "browser_artifact_contents_copied",
    "smoke_ci_browser_pass_is_truth",
  ]) {
    assert.equal(
      fixture.public_safe_fixture_policy[policyKey],
      false,
      `fixture policy must block ${policyKey}`,
    );
  }
  assertNoUnsafeText(rawDocs, "docs");
  assertNoUnsafeText(fixtureText, "fixture");
  assertNoUnsafeText(assistedScript, "assisted script");
}

function assertChangedFileScope() {
  const unexpected = changedFiles()
    .filter((filePath) => !expectedChangedFiles.has(filePath))
    .sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to assisted manual QA execution report files plus exact old-smoke compatibility exceptions",
  );
}

function assertNoUnsafeText(text, label) {
  const allowed = text
    .replaceAll(browserArtifactDir, "/tmp/BROWSER_ARTIFACT_DIR")
    .replaceAll("/tmp/augnes-operator-path-assisted-manual-qa-execution-report-v0-1", "/tmp/REPORT_DIR")
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
    "data:image/",
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
