#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/PROMOTION_READINESS_COPY_IA_CLARITY_V0_1.md";
const fixturePath = "fixtures/promotion-readiness-copy-ia-clarity.sample.v0.1.json";
const homeComponentPath =
  "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx";
const hubComponentPath = "components/promotion-readiness-packet-review-hub.tsx";
const packetComponentPath = "components/promotion-readiness-packet-panel.tsx";
const browserScriptPath =
  "scripts/browser-validate-promotion-readiness-copy-ia-clarity-v0-1.mjs";
const smokePath = "scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs";
const reportPath = "reports/browser/2026-06-29-promotion-readiness-copy-ia-clarity.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const sliceName = "promotion_readiness_copy_ia_clarity_v0_1";
const packageBrowserScriptName = "browser:promotion-readiness-copy-ia-clarity-v0-1";
const packageBrowserScriptValue =
  "node scripts/browser-validate-promotion-readiness-copy-ia-clarity-v0-1.mjs";
const packageSmokeScriptName = "smoke:promotion-readiness-copy-ia-clarity-v0-1";
const packageSmokeScriptValue =
  "node scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs";
const basisPrs = [856, 857, 858, 859, 860, 861, 862, 863];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  homeComponentPath,
  "app/page.tsx",
  "components/augnes-cockpit.tsx",
  hubComponentPath,
  packetComponentPath,
  browserScriptPath,
  "scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  smokePath,
  reportPath,
  packagePath,
  indexPath,
  "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx",
  "components/promotion-readiness-packet-review-hub.tsx",
  "components/promotion-readiness-packet-panel.tsx",
  "docs/PROMOTION_READINESS_COPY_IA_CLARITY_V0_1.md",
  "fixtures/promotion-readiness-copy-ia-clarity.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-copy-ia-clarity.md",
  "scripts/browser-validate-promotion-readiness-copy-ia-clarity-v0-1.mjs",
  "scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs",
  "scripts/smoke-perspective-public-surface-mode-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-review-hub-read-display-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs",
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

const forbiddenCapabilityKeys = [
  "product_authority",
  "promotion_execution",
  "promotion_decision_write",
  "promotion_decision_store_usage_or_write",
  "promotion_decision_controls",
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
  "raw_artifact_copying",
  "screenshot_embedding",
  "private_local_path_inclusion",
];

const deniedCapabilityPhrases = [
  "product authority",
  "promotion execution",
  "promotion decision write",
  "promotion decision store usage/write",
  "promotion decision controls",
  "proof/evidence creation",
  "durable Perspective state apply",
  "Formation Receipt write",
  "product-write",
  "accepted evidence ref write",
  "product ID allocation",
  "GitHub actuation",
  "release execution",
  "live provider validation",
  "source fetching/retrieval expansion",
  "broad all-route audit instrumentation",
  "API write routes",
  "DB schema/migrations",
  "raw artifact copying",
  "screenshot embedding",
  "private local path inclusion",
  "release authority",
];

const unsafeArtifactPatterns = [
  /!\[[^\]]*]\([^)]*\)/,
  /data:image\/[a-z]+;base64/i,
  /browserSessionDump/i,
  /browser_session_dump/i,
  /raw_har\s*[:=]\s*["{[]/i,
  /raw_browser_report\s*[:=]\s*["{[]/i,
  /raw_browser_dump\s*[:=]\s*["{[]/i,
  /terminal_log\s*[:=]\s*["{[]/i,
  /raw_db_rows\s*[:=]\s*["{[]/i,
  /raw_route_responses\s*[:=]\s*["{[]/i,
  /raw_provider_output\s*[:=]\s*["{[]/i,
  /raw_prompt\s*[:=]\s*["{[]/i,
  /raw_retrieval_output\s*[:=]\s*["{[]/i,
  /source_body\s*[:=]\s*["{[]/i,
  /secret\s*[:=]\s*["{[]/i,
  /github_payload\s*[:=]\s*["{[]/i,
  /release_payload\s*[:=]\s*["{[]/i,
  /\/Users\/[^/\s]+/i,
  /sk-[A-Za-z0-9_-]{12,}/,
  /BEGIN (?:RSA |OPENSSH |EC |)PRIVATE KEY/,
  /\bOPENAI_API_KEY\s*=/i,
  /\bGITHUB_TOKEN\s*=/i,
  /github_pat_[A-Za-z0-9_]+/i,
  /ghp_[A-Za-z0-9_]+/i,
];

for (const filePath of [
  docsPath,
  fixturePath,
  homeComponentPath,
  hubComponentPath,
  packetComponentPath,
  browserScriptPath,
  smokePath,
  reportPath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const homeComponent = readText(homeComponentPath);
const hubComponent = readText(hubComponentPath);
const packetComponent = readText(packetComponentPath);
const allComponents = `${homeComponent}\n${hubComponent}\n${packetComponent}`;
const browserScript = readText(browserScriptPath);
const rawReport = readText(reportPath);
const report = normalize(rawReport);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertFixture();
assertPackageAndIndex();
assertDocsReportFixtureContent();
assertUiSource();
assertBrowserValidator();
assertAuthorityBoundary();
assertPublicSafe();
assertFinalRecommendation();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "promotion-readiness-copy-ia-clarity-v0-1",
      final_status: "pass",
      slice_name: sliceName,
      routes_validated: ["/", "/perspective/promotion", "/perspective/promotion/readiness-packet"],
      browser_validator: browserScriptPath,
      report_path: reportPath,
      human_signoff_completed: false,
      human_review_still_required: true,
    },
    null,
    2,
  ),
);

function assertFixture() {
  assert.equal(fixture.slice_name, sliceName);
  assert.equal(fixture.version, "promotion_readiness_copy_ia_clarity.v0.1");
  assert.equal(fixture.packet_type, "promotion_readiness_copy_ia_clarity");
  assert.deepEqual(fixture.basis_prs, basisPrs);
  assert.equal(fixture.human_spot_review_classification, "pass_with_copy_risk");
  assert.deepEqual(fixture.routes_touched_or_validated, [
    "/",
    "/perspective/promotion",
    "/perspective/promotion/readiness-packet",
  ]);
  assert.equal(fixture.read_display_only, true);
  assert.equal(fixture.no_action_controls, true);
  assert.equal(fixture.copy_ia_only, true);
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.human_review_still_required, true);
  for (const key of forbiddenCapabilityKeys) {
    assert.equal(fixture.authority_boundary?.[key], false, `fixture boundary ${key}`);
    assert.ok(fixture.forbidden_capabilities.includes(key), `fixture forbidden ${key}`);
  }
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageBrowserScriptName], packageBrowserScriptValue);
  assert.equal(packageJson.scripts?.[packageSmokeScriptName], packageSmokeScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    browserScriptPath,
    smokePath,
    reportPath,
    packageBrowserScriptName,
    packageSmokeScriptName,
    homeComponentPath,
    hubComponentPath,
    packetComponentPath,
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
}

function assertDocsReportFixtureContent() {
  for (const pr of basisPrs) {
    assertIncludes(docs, `#${pr}`, `doc basis #${pr}`);
  }
  for (const text of [docs, report, normalize(fixtureText)]) {
    assertIncludes(text, "pass_with_copy_risk", "human spot review classification");
    assertIncludes(text, "home entrypoint discoverability fail", "home discoverability FAIL");
    assertIncludes(text, "static/symbolic preview meaning risk", "static/symbolic preview risk");
    assertIncludes(text, "copy", "copy marker");
    assertIncludes(text, "ia", "ia marker");
    assertIncludes(text, "human_signoff_completed", "human signoff key");
    assertIncludes(text, "false", "false value");
    assertIncludes(text, "human_review_still_required", "human review key");
    assertIncludes(text, "true", "true value");
  }
  for (const section of [
    "Home Entrypoint Clarity Assertions",
    "Hub Hierarchy Assertions",
    "Readiness Packet Static/Symbolic Clarity Assertions",
    "Navigation Link Assertion Summary",
    "Scoped No-Action-Controls Result",
    "Network/Request Boundary Summary",
    "Known Warnings",
    "Final Status",
  ]) {
    assertIncludes(rawReport, `## ${section}`, `report section ${section}`);
  }
}

function assertUiSource() {
  for (const phrase of [
    "Promotion readiness review",
    "Secondary review prep",
    "Promotion readiness is secondary review prep, not approval",
    "Human review still required",
    "Read/display-only",
    "Readiness is not promotion",
    "No action controls",
    "Open read/display promotion review hub",
    "human_signoff_completed",
    "human_review_still_required",
  ]) {
    assertIncludes(homeComponent, phrase, `home copy ${phrase}`);
  }
  for (const phrase of [
    "Review preparation, not promotion approval",
    "This hub only links to read/display surfaces",
    "No promotion decision is written here",
    "No product-write or release happens here",
    "Human review still required",
  ]) {
    assertIncludes(hubComponent, phrase, `hub copy ${phrase}`);
  }
  for (const phrase of [
    "Static/symbolic read-display preview",
    "This is not live promotion readiness",
    "Use this to prepare human review, not to approve promotion",
    "Readiness is not promotion",
    "Validation pass is not truth/proof/approval/product readiness",
  ]) {
    assertIncludes(packetComponent, phrase, `packet copy ${phrase}`);
  }

  for (const source of [homeComponent, hubComponent, packetComponent]) {
    assert.doesNotMatch(source, /<button\b/i, "promotion readiness scopes must not include button elements");
    assert.doesNotMatch(source, /<form\b/i, "promotion readiness scopes must not include form elements");
    assert.doesNotMatch(source, /<input\b/i, "promotion readiness scopes must not include input elements");
    assert.doesNotMatch(source, /\bonClick\s*=/i, "promotion readiness scopes must not include onClick");
    assert.doesNotMatch(source, /role\s*=\s*["']button["']/i, "promotion readiness scopes must not include role=button");
    assert.doesNotMatch(source, /\bfetch\s*\(/i, "promotion readiness scopes must not include fetch");
    assert.doesNotMatch(source, /["'`]\/api(?:\/|["'`])/i, "promotion readiness scopes must not include /api route calls");
    assert.doesNotMatch(source, /\b(?:POST|PUT|PATCH|DELETE)\b/, "promotion readiness scopes must not include write methods");
  }

  for (const label of [
    "Open read/display promotion review hub",
    "Open read/display readiness packet",
  ]) {
    assert.doesNotMatch(
      label,
      /\b(?:approve|promote|publish|release|write|commit|accept|send)\b/i,
      `navigation label must avoid action wording: ${label}`,
    );
  }
  assertIncludes(allComponents, 'data-testid="promotion-readiness-review-hub-cockpit-entrypoint"', "home scope marker");
  assertIncludes(allComponents, 'data-testid="promotion-readiness-review-hub"', "hub scope marker");
  assertIncludes(allComponents, 'data-testid="promotion-readiness-packet-panel"', "packet scope marker");
}

function assertBrowserValidator() {
  for (const phrase of [
    "Page.enable",
    "Runtime.enable",
    "Network.enable",
    "request metadata only",
    "scopedSurfaces",
    "readScopedActionControls",
    "readScopedLinks",
    "home_cockpit_api_noise_count",
    "reports/browser/2026-06-29-promotion-readiness-copy-ia-clarity.md",
  ]) {
    assertIncludes(browserScript, phrase, `browser validator ${phrase}`);
  }
  assert.doesNotMatch(browserScript, /Network\.getRequestPostData/i, "validator must not read raw request bodies");
  assert.doesNotMatch(browserScript, /Network\.getResponseBody/i, "validator must not read raw response bodies");
  assert.doesNotMatch(browserScript, /\bpostData\b/i, "validator must not log postData");
  assert.doesNotMatch(browserScript, /Page\.captureScreenshot/i, "validator must not capture screenshots");
  assert.doesNotMatch(browserScript, /\/Users\/[^/\s]+/i, "validator must not include private local paths");
}

function assertAuthorityBoundary() {
  for (const phrase of deniedCapabilityPhrases) {
    assertIncludes(docs, normalize(phrase), `doc denies ${phrase}`);
    assertIncludes(report, normalize(phrase), `report denies ${phrase}`);
  }
  for (const key of forbiddenCapabilityKeys) {
    assertIncludes(normalize(fixtureText), normalize(key), `fixture key ${key}`);
  }
}

function assertPublicSafe() {
  for (const [label, text] of [
    ["docs", rawDocs],
    ["report", rawReport],
    ["fixture", fixtureText],
  ]) {
    for (const pattern of unsafeArtifactPatterns) {
      assert.doesNotMatch(text, pattern, `${label} must be public-safe for ${pattern}`);
    }
  }
}

function assertFinalRecommendation() {
  for (const text of [docs, report, normalize(fixtureText)]) {
    assertIncludes(text, "rerun human spot review on copy clarity", "rerun human spot review recommendation");
    assertIncludes(text, "promotion execution", "not promotion execution");
    assertIncludes(text, "product-write", "not product-write");
    assertIncludes(text, "release", "not release");
  }
  const finalSections = [
    rawDocs.match(/## Final Recommendation[\s\S]*$/)?.[0] ?? "",
    rawReport.match(/## Final Recommendation[\s\S]*?## Final Status/s)?.[0] ?? "",
  ].join("\n");
  assert.doesNotMatch(
    finalSections,
    /(?:^|\n)\s*(?:recommend|proceed to|continue to)\s+(?:promotion execution|product-write|release)/i,
    "final recommendation must not recommend authority action",
  );
}

function assertChangedFileScope() {
  const changed = changedFiles();
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], `Unexpected changed file(s): ${unexpected.join(", ")}`);
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
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function assertIncludes(haystack, needle, label) {
  assert.ok(normalize(haystack).includes(normalize(needle)), `${label} must include ${needle}`);
}
