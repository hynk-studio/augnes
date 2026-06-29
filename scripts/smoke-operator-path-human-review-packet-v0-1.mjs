#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/OPERATOR_PATH_HUMAN_REVIEW_PACKET_V0_1.md";
const fixturePath = "fixtures/operator-path-human-review-packet.sample.v0.1.json";
const smokePath = "scripts/smoke-operator-path-human-review-packet-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const packageScriptName = "smoke:operator-path-human-review-packet-v0-1";
const packageScriptValue = "node scripts/smoke-operator-path-human-review-packet-v0-1.mjs";
const sliceName = "operator_path_human_review_packet_v0_1";
const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_REMAINING_GAP_INVENTORY_V0_1.md",
  "fixtures/operator-path-backend-remaining-gap-inventory.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs",
  "docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md",
  "fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json",
  "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs",
  "components/promotion-readiness-packet-panel.tsx",
  "app/perspective/promotion/readiness-packet/page.tsx",
  "docs/PROMOTION_READINESS_PACKET_UI_READ_DISPLAY_BINDING_V0_1.md",
  "fixtures/promotion-readiness-packet-ui-read-display-binding.sample.v0.1.json",
  "scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs",
  "docs/PROMOTION_READINESS_PACKET_UI_BROWSER_STATIC_VALIDATION_V0_1.md",
  "fixtures/promotion-readiness-packet-ui-browser-static-validation.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-packet-ui-browser-static-validation.md",
  "scripts/browser-validate-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
]);

for (const filePath of [docsPath, fixturePath, smokePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertDocFixturePackageAndIndex();
assertSummaries();
assertHumanStatus();
assertAuthorityBoundary();
assertPublicSafeAndSymbolicOnly();
assertNextRecommendation();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "operator-path-human-review-packet-v0-1",
      final_status: "pass",
      slice_name: sliceName,
      human_signoff_completed: false,
      human_review_still_required: true,
      next_recommendation: fixture.next_recommendation,
    },
    null,
    2,
  ),
);

function assertDocFixturePackageAndIndex() {
  assert.equal(fixture.slice_name, sliceName);
  assert.equal(fixture.version, "operator_path_human_review_packet.v0.1");
  assert.equal(fixture.packet_type, "public_safe_operator_path_human_review_packet");
  assert.deepEqual(fixture.source_prs, [851, 852, 855, 856]);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    sliceName,
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
  for (const section of [
    "# Operator Path Human Review Packet v0.1",
    "## Validation Summaries",
    "## Symbolic Artifact Index",
    "## Symbolic Screenshot Index",
    "## Remaining Human Judgment Checklist",
    "## Next Authority Candidates And Risk Notes",
    "## Authority Boundary",
    "## Public-Safe Policy",
  ]) {
    assertIncludes(rawDocs, section, `required doc section ${section}`);
  }
}

function assertSummaries() {
  for (const phrase of [
    "PR #851 route-level E2E summary",
    "PR #852 browser/CDP validation summary",
    "PR #855 assisted manual QA execution summary",
    "PR #856 backend safety validation summary",
    "final_rag_answer_review_memory_end_to_end_operator_path_v0_1",
    "final_rag_answer_review_memory_operator_browser_validation_v0_1",
    "operator_path_assisted_manual_qa_execution_report_v0_1",
    "operator_path_backend_safety_validation_bundle_v0_1",
    "Artifact freshness caveat",
  ]) {
    assertIncludes(rawDocs, phrase, `summary phrase ${phrase}`);
  }
  assert.equal(fixture.included_summaries.length, 4);
  for (const pr of [851, 852, 855, 856]) {
    assert.ok(
      fixture.included_summaries.some((summary) => summary.source_pr === pr),
      `fixture summary for PR #${pr}`,
    );
  }
}

function assertHumanStatus() {
  assertIncludes(rawDocs, "human_signoff_completed: false", "doc human signoff false");
  assertIncludes(rawDocs, "human_review_still_required: true", "doc human review true");
  assertIncludes(
    rawDocs,
    "smoke/CI/browser/server-side pass is not truth",
    "doc pass is not truth",
  );
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.human_review_still_required, true);
  assert.equal(fixture.smoke_ci_browser_server_side_pass_is_truth, false);
}

function assertAuthorityBoundary() {
  for (const phrase of [
    "not approval",
    "not approval, proof, evidence, product readiness, promotion, durable state, Formation Receipt, product-write, GitHub authority, or release authority",
    "denies product authority",
    "promotion execution",
    "promotion decision write",
    "proof/evidence creation",
    "durable state apply",
    "Formation Receipt write",
    "product-write",
    "accepted evidence ref write",
    "product ID allocation",
    "GitHub actuation",
    "release execution",
    "live provider validation",
    "source fetching",
    "retrieval expansion",
    "broad all-route audit instrumentation",
    "does not create proof/evidence",
    "does not write promotion decisions",
    "does not use or write the promotion decision store",
    "does not execute promotion",
    "does not create durable Perspective state",
    "does not write Formation Receipts",
    "does not product-write",
    "does not write accepted evidence refs",
    "does not allocate product IDs",
    "does not add GitHub actuation",
    "does not add release execution",
    "does not call live providers",
    "does not fetch sources",
    "does not expand retrieval execution",
    "does not add broad all-route audit instrumentation",
    "does not add UI behavior",
    "does not add API routes",
    "does not add DB schema or migrations",
  ]) {
    assertIncludes(docs, normalize(phrase), `doc authority phrase ${phrase}`);
  }

  for (const capability of [
    "product_authority",
    "promotion_execution",
    "promotion_decision_write",
    "promotion_decision_store_usage_or_write",
    "proof_evidence_creation",
    "durable_perspective_state_apply",
    "formation_receipt_write",
    "product_write",
    "accepted_evidence_ref_write",
    "product_id_allocation",
    "github_actuation",
    "release_execution",
    "live_provider_validation",
    "source_fetching",
    "retrieval_execution_expansion",
    "broad_all_route_audit_instrumentation",
    "ui_behavior",
    "api_routes",
    "db_schema_or_migrations",
  ]) {
    assert.ok(
      fixture.forbidden_capabilities.includes(capability),
      `fixture forbids ${capability}`,
    );
  }
}

function assertPublicSafeAndSymbolicOnly() {
  assert.ok(Array.isArray(fixture.artifact_index_symbolic_only));
  assert.ok(Array.isArray(fixture.screenshot_index_symbolic_only));
  assert.ok(fixture.artifact_index_symbolic_only.length >= 4);
  assert.ok(fixture.screenshot_index_symbolic_only.length >= 2);
  for (const value of [
    ...fixture.artifact_index_symbolic_only,
    ...fixture.screenshot_index_symbolic_only,
  ]) {
    assert.match(value, /^<[A-Z0-9_]+>$/, `symbolic placeholder ${value}`);
  }
  for (const [key, value] of Object.entries(fixture.public_safe_policy)) {
    if (key === "symbolic_refs_only" || key === "summary_labels_only") {
      assert.equal(value, true, `public safe policy ${key}`);
    } else {
      assert.equal(value, false, `public safe policy ${key}`);
    }
  }
  for (const phrase of [
    "does not embed raw browser report contents",
    "does not embed screenshots",
    "does not include raw DB rows",
    "raw route responses",
    "raw provider output",
    "raw prompts",
    "raw retrieval output",
    "source bodies",
    "terminal logs",
    "browser dumps",
    "secrets",
    "private local paths",
    "GitHub payloads",
    "release payloads",
  ]) {
    assertIncludes(docs, normalize(phrase), `public safe doc phrase ${phrase}`);
  }
  assert.doesNotMatch(rawDocs, /!\[[^\]]*]\([^)]*\)/, "doc must not embed images");
  assertNoPrivateOrRawPayloadMarkers(rawDocs, "doc");
  assertNoPrivateOrRawPayloadMarkers(fixtureText, "fixture");
}

function assertNextRecommendation() {
  assert.match(
    fixture.next_recommendation,
    /human spot review|human review/i,
    "fixture next recommendation remains human review",
  );
  assert.doesNotMatch(
    fixture.next_recommendation,
    /promotion execution|product-write|release/i,
    "fixture next recommendation must not be promotion/product/release",
  );
  assertIncludes(
    rawDocs,
    "The next recommendation remains human review / human spot review",
    "doc next recommendation",
  );
  assertIncludes(
    docs,
    "It is not promotion execution, product-write, or release.",
    "not next",
  );
}

function assertChangedFileScope() {
  const changed = changedFiles();
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], `Unexpected changed file(s): ${unexpected.join(", ")}`);
}

function assertNoPrivateOrRawPayloadMarkers(value, label) {
  for (const pattern of [
    /\/Users\/[^/\s]+/i,
    /sk-[A-Za-z0-9_-]{12,}/,
    /BEGIN (?:RSA |OPENSSH |EC |)PRIVATE KEY/,
    /browserSessionDump/i,
    /browser_session_dump/i,
    /github_payload\s*:\s*\{/i,
    /release_payload\s*:\s*\{/i,
    /raw_db_rows\s*:\s*\[/i,
    /raw_route_responses\s*:\s*\[/i,
    /raw_provider_output\s*:\s*["{[]/i,
    /raw_prompt\s*:\s*["{[]/i,
    /raw_retrieval_output\s*:\s*["{[]/i,
    /source_body\s*:\s*["{[]/i,
    /terminal_log\s*:\s*["{[]/i,
  ]) {
    assert.doesNotMatch(value, pattern, `${label} must not contain ${pattern}`);
  }
}

function changedFiles() {
  const status = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
    encoding: "utf8",
  });
  return new Set(
    status
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^.. /, ""))
      .map((line) => line.trim())
      .map((line) => (line.includes(" -> ") ? line.split(" -> ").at(-1) : line))
      .filter(Boolean),
  );
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} missing: ${needle}`);
}
