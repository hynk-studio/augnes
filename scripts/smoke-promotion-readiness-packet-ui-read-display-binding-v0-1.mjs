#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/PROMOTION_READINESS_PACKET_UI_READ_DISPLAY_BINDING_V0_1.md";
const fixturePath =
  "fixtures/promotion-readiness-packet-ui-read-display-binding.sample.v0.1.json";
const componentPath = "components/promotion-readiness-packet-panel.tsx";
const pagePath = "app/perspective/promotion/readiness-packet/page.tsx";
const smokePath = "scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const sliceName = "promotion_readiness_packet_ui_read_display_binding_v0_1";
const packageScriptName = "smoke:promotion-readiness-packet-ui-read-display-binding-v0-1";
const packageScriptValue =
  "node scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs";

const readinessPacketFields = [
  "readiness_packet_id",
  "review_memory_record_ref",
  "candidate_ref",
  "readiness_status",
  "blocking_items",
  "missing_prerequisites",
  "evidence_summary_public_safe",
  "boundary_summary",
  "next_allowed_non_authority_actions",
  "blocked_authority_actions",
];

const displayedSections = [
  "readiness summary",
  "source/basis refs",
  "blocking items",
  "missing prerequisites",
  "public-safe evidence summary",
  "boundary summary",
  "next allowed non-authority actions",
  "blocked authority actions",
];

const statusFlags = [
  "human_signoff_completed",
  "human_review_still_required",
  "promotion_execution",
  "promotion_decision_write",
  "product_write",
  "proof_or_evidence_creation",
  "durable_state_apply",
  "formation_receipt_write",
  "accepted_evidence_ref_write",
  "product_id_allocation",
];

const deniedCapabilityPhrases = [
  "product authority",
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
  "release authority",
  "live provider validation",
  "source fetching/retrieval expansion",
  "broad all-route audit instrumentation",
  "API write routes",
  "DB schema/migrations",
];

const forbiddenCapabilityKeys = [
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
  "release_authority",
  "live_provider_validation",
  "source_fetching_retrieval_expansion",
  "broad_all_route_audit_instrumentation",
  "api_write_routes",
  "db_schema_or_migrations",
];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  componentPath,
  pagePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs",
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs",
  "scripts/smoke-operator-path-human-review-packet-v0-1.mjs",
  "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
]);

for (const filePath of [
  docsPath,
  fixturePath,
  componentPath,
  pagePath,
  smokePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const component = readText(componentPath);
const page = readText(pagePath);
const componentAndPage = `${component}\n${page}`;
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertPointers();
assertBasisAndDocs();
assertUiContent();
assertNoActionControlsOrRouteCalls();
assertFixture();
assertAuthorityBoundary();
assertPublicSafe();
assertRecommendation();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "promotion-readiness-packet-ui-read-display-binding-v0-1",
      final_status: "pass",
      slice_name: sliceName,
      read_display_only: true,
      no_action_controls: true,
      human_signoff_completed: false,
      human_review_still_required: true,
      final_recommendation: fixture.final_recommendation,
    },
    null,
    2,
  ),
);

function assertPointers() {
  assert.equal(fixture.slice_name, sliceName);
  assert.equal(fixture.version, "promotion_readiness_packet_ui_read_display_binding.v0.1");
  assert.equal(fixture.packet_type, "promotion_readiness_packet_ui_read_display_binding");
  assert.deepEqual(fixture.basis_prs, [856, 857, 858, 859]);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    componentPath,
    pagePath,
    packageScriptName,
    sliceName,
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
}

function assertBasisAndDocs() {
  for (const phrase of [
    "Current basis: PR #856",
    "PR #857",
    "PR #858",
    "PR #859",
    "Purpose: read/display-only UI binding for the existing promotion readiness",
    "This UI does not execute promotion",
    "This UI does not write promotion decisions",
    "This UI does not create proof/evidence",
    "This UI does not product-write",
    "Readiness is not promotion",
    "Validation pass is not truth/proof/approval/product readiness",
    "Human review remains required before authority-increasing transitions.",
    "human_signoff_completed: false",
    "human_review_still_required: true",
  ]) {
    assertIncludes(docs, normalize(phrase), `doc phrase ${phrase}`);
  }
  for (const section of displayedSections) {
    assertIncludes(docs, normalize(section), `doc section ${section}`);
  }
}

function assertUiContent() {
  for (const phrase of [
    "Promotion readiness packet read/display",
    "Promotion Readiness Packet Read/Display Binding",
    "Readiness is not promotion",
    "Validation pass is not truth/proof/approval/product readiness",
    "No action controls",
    "read/display-only",
    "static public-safe preview data",
  ]) {
    assertIncludes(componentAndPage, phrase, `component/page phrase ${phrase}`);
  }
  for (const statusFlag of statusFlags) {
    assertIncludes(componentAndPage, statusFlag, `component/page status ${statusFlag}`);
  }
  assertIncludes(componentAndPage, '["human_signoff_completed", "false"]', "human signoff false");
  assertIncludes(
    componentAndPage,
    '["human_review_still_required", "true"]',
    "human review true",
  );
  for (const field of readinessPacketFields) {
    assertIncludes(componentAndPage, field, `readiness field ${field}`);
  }
  for (const section of displayedSections) {
    assertIncludes(componentAndPage, section, `displayed section ${section}`);
  }
  for (const pr of ["PR #856", "PR #857", "PR #858", "PR #859"]) {
    assertIncludes(componentAndPage, pr, `basis ${pr}`);
  }
}

function assertNoActionControlsOrRouteCalls() {
  for (const source of [
    ["component", component],
    ["page", page],
  ]) {
    const [label, text] = source;
    assert.doesNotMatch(text, /<button\b/i, `${label} must not render button elements`);
    assert.doesNotMatch(text, /<form\b/i, `${label} must not render forms`);
    assert.doesNotMatch(text, /\bonClick\s*=/i, `${label} must not attach click handlers`);
    assert.doesNotMatch(text, /\buseState\b/i, `${label} must not keep action state`);
    assert.doesNotMatch(text, /\bfetch\s*\(/i, `${label} must not call fetch`);
    assert.doesNotMatch(text, /\bXMLHttpRequest\b/i, `${label} must not call XHR`);
    assert.doesNotMatch(text, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i, `${label} write method`);
    assert.doesNotMatch(text, /\/api\//i, `${label} must not call API routes`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*promotion[^\s"'`]*decision/i, `${label} promotion decision route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*product[^\s"'`]*write/i, `${label} product-write route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*proof[^\s"'`]*evidence/i, `${label} proof/evidence route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*formation[^\s"'`]*receipt/i, `${label} Formation Receipt write route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*github/i, `${label} GitHub route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*release/i, `${label} release route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*provider/i, `${label} provider route`);
    assert.doesNotMatch(text, /\/api\/[^\s"'`]*source[^\s"'`]*fetch/i, `${label} source fetch route`);
  }
}

function assertFixture() {
  assert.equal(fixture.read_display_only, true);
  assert.equal(fixture.no_action_controls, true);
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.human_review_still_required, true);
  assert.ok(fixture.readiness_packet, "fixture readiness_packet");
  for (const field of readinessPacketFields) {
    assert.ok(
      Object.hasOwn(fixture.readiness_packet, field),
      `readiness_packet includes ${field}`,
    );
    assertIncludes(fixtureText, field, `fixture readiness field ${field}`);
  }
  for (const section of displayedSections) {
    assert.ok(fixture.displayed_sections.includes(section), `fixture section ${section}`);
  }
  assertNoUnsafePayloadText(JSON.stringify(fixture.readiness_packet), "fixture readiness_packet");
}

function assertAuthorityBoundary() {
  for (const phrase of deniedCapabilityPhrases) {
    assertIncludes(docs, normalize(phrase), `doc denies ${phrase}`);
  }
  for (const capability of forbiddenCapabilityKeys) {
    assert.ok(
      fixture.forbidden_capabilities.includes(capability),
      `fixture forbids ${capability}`,
    );
    assert.equal(fixture.authority_boundary[capability], false, `authority ${capability}`);
  }
  for (const field of [
    "validation_pass_is_truth",
    "validation_pass_is_proof",
    "validation_pass_is_approval",
    "validation_pass_is_product_readiness",
  ]) {
    assert.equal(fixture.authority_boundary[field], false, field);
  }
}

function assertPublicSafe() {
  for (const phrase of [
    "does not copy raw artifacts into the repo",
    "does not embed screenshots",
    "does not include private local paths",
    "raw browser reports",
    "terminal logs",
    "browser dumps",
    "raw DB rows",
    "raw route responses",
    "raw provider output",
    "prompts",
    "retrieval output",
    "source bodies",
    "secrets",
    "GitHub payloads",
    "release payloads",
  ]) {
    assertIncludes(docs, normalize(phrase), `public-safe doc phrase ${phrase}`);
  }
  for (const [label, text] of [
    ["doc", rawDocs],
    ["fixture", fixtureText],
    ["component", component],
    ["page", page],
  ]) {
    assert.doesNotMatch(text, /!\[[^\]]*]\([^)]*\)/, `${label} must not embed images`);
    assertNoUnsafePayloadText(text, label);
  }
}

function assertRecommendation() {
  assert.match(
    fixture.final_recommendation,
    /browser_static_smoke_validation|usability_follow_up/i,
    "final recommendation is browser/static validation or usability follow-up",
  );
  assert.doesNotMatch(
    fixture.final_recommendation,
    /promotion execution|promotion_execution|product-write|product_write|release/i,
    "final recommendation must not be promotion/product/release",
  );
  assertIncludes(
    rawDocs,
    "Proceed to browser/static smoke validation of this read/display UI or a narrow\nusability follow-up",
    "doc final recommendation",
  );
  assertIncludes(rawDocs, "Do not recommend promotion execution, product-write, or release.", "not next");
}

function assertChangedFileScope() {
  const changed = changedFiles();
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], `Unexpected changed file(s): ${unexpected.join(", ")}`);
}

function assertNoUnsafePayloadText(value, label) {
  for (const pattern of [
    /\/Users\/[^/\s]+/i,
    /\/tmp\/[^\s)"']+/i,
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
    /\bOPENAI_API_KEY\b/i,
    /\bGITHUB_TOKEN\b/i,
    /github_pat_[A-Za-z0-9_]+/i,
    /ghp_[A-Za-z0-9_]+/i,
  ]) {
    assert.doesNotMatch(value, pattern, `${label} must not contain ${pattern}`);
  }
}

function changedFiles() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const filePath of runGitLines(args)) changed.add(filePath);
  }
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only", "main...HEAD"],
  ]) {
    const lines = runGitLines(args, { allowFailure: true });
    for (const filePath of lines) changed.add(filePath);
    if (lines.length > 0) break;
  }
  return changed;
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

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} missing: ${needle}`);
}
