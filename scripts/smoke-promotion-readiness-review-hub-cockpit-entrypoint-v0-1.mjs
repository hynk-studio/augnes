#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath =
  "docs/PROMOTION_READINESS_REVIEW_HUB_COCKPIT_ENTRYPOINT_V0_1.md";
const fixturePath =
  "fixtures/promotion-readiness-review-hub-cockpit-entrypoint.sample.v0.1.json";
const componentPath =
  "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx";
const pagePath = "app/page.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const browserScriptPath =
  "scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs";
const smokePath =
  "scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs";
const reportPath =
  "reports/browser/2026-06-29-promotion-readiness-review-hub-cockpit-entrypoint.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const sliceName = "promotion_readiness_review_hub_cockpit_entrypoint_v0_1";
const homeRoute = "/";
const linkedRoute = "/perspective/promotion";
const downstreamRoute = "/perspective/promotion/readiness-packet";
const entrypointTestId = "promotion-readiness-review-hub-cockpit-entrypoint";
const navigationLabel = "Open read/display promotion review hub";
const packageBrowserScriptName =
  "browser:promotion-readiness-review-hub-cockpit-entrypoint-v0-1";
const packageBrowserScriptValue =
  "node scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs";
const packageSmokeScriptName =
  "smoke:promotion-readiness-review-hub-cockpit-entrypoint-v0-1";
const packageSmokeScriptValue =
  "node scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs";

const requiredBasisPrs = [856, 857, 858, 859, 860, 861, 862];

const requiredVisibleCopy = [
  "Promotion readiness review",
  "Read/display-only",
  navigationLabel,
  linkedRoute,
  "Readiness is not promotion",
  "Validation pass is not truth/proof/approval/product readiness",
  "Browser validation is not human review",
  "human_signoff_completed",
  "false",
  "human_review_still_required",
  "true",
  "promotion_execution",
  "promotion_decision_write",
  "product_write",
  "proof_or_evidence_creation",
  "durable_state_apply",
  "formation_receipt_write",
  "accepted_evidence_ref_write",
  "product_id_allocation",
  "PR #856",
  "PR #857",
  "PR #858",
  "PR #859",
  "PR #860",
  "PR #861",
  "PR #862",
  "Read/display-only review-prep lane",
  "Secondary Perspective cockpit lane",
  "Status and boundary",
  "Navigation-only route",
  "No action controls",
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

const reportRequiredSections = [
  "Page Load Result",
  "Visible Copy Assertions Summary",
  "Navigation Link Assertion Summary",
  "Destination Navigation Result",
  "Scoped No-Action-Controls Result",
  "Network/Request Boundary Summary",
  "Forbidden Method Summary",
  "Forbidden Route Summary",
  "External Request Summary",
  "Screenshot Policy",
  "Known Warnings",
  "Final Status",
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

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  componentPath,
  pagePath,
  cockpitPath,
  browserScriptPath,
  smokePath,
  reportPath,
  packagePath,
  indexPath,
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
  "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx",
  "components/promotion-readiness-packet-review-hub.tsx",
  "components/promotion-readiness-packet-panel.tsx",
  "docs/PROMOTION_READINESS_COPY_IA_CLARITY_V0_1.md",
  "fixtures/promotion-readiness-copy-ia-clarity.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-copy-ia-clarity.md",
  "scripts/browser-validate-promotion-readiness-copy-ia-clarity-v0-1.mjs",
  "scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs",
  "scripts/smoke-perspective-cockpit-surface-recovery-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
]);

for (const filePath of [
  docsPath,
  fixturePath,
  componentPath,
  pagePath,
  cockpitPath,
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
const component = readText(componentPath);
const page = readText(pagePath);
const cockpit = readText(cockpitPath);
const browserScript = readText(browserScriptPath);
const rawReport = readText(reportPath);
const report = normalize(rawReport);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertDocsFixturePackageAndIndex();
assertComponentAndPage();
assertReport();
assertBrowserValidator();
assertAuthorityBoundary();
assertPublicSafe();
assertFinalRecommendation();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "promotion-readiness-review-hub-cockpit-entrypoint-v0-1",
      final_status: "pass",
      slice_name: sliceName,
      home_route: homeRoute,
      linked_route: linkedRoute,
      downstream_route: downstreamRoute,
      browser_validator: browserScriptPath,
      report_path: reportPath,
      human_signoff_completed: false,
      human_review_still_required: true,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.slice_name, sliceName);
  assert.equal(fixture.version, "promotion_readiness_review_hub_cockpit_entrypoint.v0.1");
  assert.equal(fixture.packet_type, "promotion_readiness_review_hub_cockpit_entrypoint");
  assert.equal(fixture.home_route, homeRoute);
  assert.equal(fixture.linked_route, linkedRoute);
  assert.equal(fixture.downstream_readiness_packet_route, downstreamRoute);
  assert.deepEqual(fixture.basis_prs, requiredBasisPrs);
  assert.equal(fixture.read_display_only, true);
  assert.equal(fixture.no_action_controls, true);
  assert.equal(packageJson.scripts?.[packageBrowserScriptName], packageBrowserScriptValue);
  assert.equal(packageJson.scripts?.[packageSmokeScriptName], packageSmokeScriptValue);

  for (const pr of requiredBasisPrs) {
    assertIncludes(docs, normalize(`PR #${pr}`), `doc basis PR #${pr}`);
  }
  for (const pointer of [
    docsPath,
    fixturePath,
    componentPath,
    pagePath,
    browserScriptPath,
    smokePath,
    reportPath,
    packageBrowserScriptName,
    packageSmokeScriptName,
    sliceName,
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
  for (const phrase of [
    "this entrypoint does not perform human review",
    "this entrypoint does not claim human signoff",
    "this entrypoint does not execute promotion",
    "this entrypoint does not write promotion decisions",
    "this entrypoint does not create proof/evidence",
    "this entrypoint does not product-write",
    "readiness is not promotion",
    "validation pass is not truth/proof/approval/product readiness",
    "browser validation is not human review",
    "the /perspective/promotion link is navigation only, not approval, promotion, write, or release",
    "home/cockpit route touched/tested: `/`",
    linkedRoute,
    downstreamRoute,
    "promotion readiness review entrypoint",
    "allowed read/display navigation",
    "basis refs",
    "status flags",
    "blocked authority actions",
    "what this entrypoint cannot do",
    "navigation affordance policy",
    "no-action-controls policy",
    "network and request boundary",
    "screenshot and artifact policy",
    "human_signoff_completed: false",
    "human_review_still_required: true",
  ]) {
    assertIncludes(docs, normalize(phrase), `doc phrase ${phrase}`);
  }
}

function assertComponentAndPage() {
  assertIncludes(
    cockpit,
    "@/components/promotion-readiness-review-hub-cockpit-entrypoint",
    "cockpit imports entrypoint component",
  );
  assertIncludes(
    cockpit,
    "<PromotionReadinessReviewHubCockpitEntrypoint />",
    "cockpit renders entrypoint component",
  );
  assertIncludes(
    page,
    "return <AugnesCockpit />",
    "page renders the cockpit as the primary home surface",
  );
  assert.doesNotMatch(
    page,
    /PromotionReadinessReviewHubCockpitEntrypoint/,
    "page must not place promotion readiness above cockpit",
  );
  assertIncludes(
    component,
    `data-testid="${entrypointTestId}"`,
    "component stable scope marker",
  );
  assertIncludes(component, `const linkedRoute = "${linkedRoute}"`, "linked route const");
  assertIncludes(component, `href={linkedRoute}`, "normal navigation link href");
  assertIncludes(component, navigationLabel, "navigation link label");
  for (const phrase of requiredVisibleCopy) {
    assertIncludes(normalize(component), normalize(phrase), `component visible copy ${phrase}`);
  }
  assert.doesNotMatch(component, /<button\b/i, "component must not include button elements");
  assert.doesNotMatch(component, /<form\b/i, "component must not include form elements");
  assert.doesNotMatch(component, /<input\b/i, "component must not include input elements");
  assert.doesNotMatch(component, /\bonClick\s*=/i, "component must not include onClick handlers");
  assert.doesNotMatch(component, /\bfetch\s*\(/i, "component must not include fetch calls");
  assert.doesNotMatch(component, /["'`]\/api(?:\/|["'`])/i, "component must not include /api calls");
  assert.doesNotMatch(component, /\b(?:POST|PUT|PATCH|DELETE)\b/, "component must not include write methods");
  assert.doesNotMatch(component, /href\s*=\s*["']https?:\/\//i, "component must not include external hrefs");
  assert.doesNotMatch(component, /role\s*=\s*["']button["']/i, "component must not include role=button");
  assert.doesNotMatch(
    navigationLabel,
    /\b(?:approve|promote|publish|release|write|commit|accept|send)\b/i,
    "component link label must avoid action wording",
  );
}

function assertReport() {
  assertIncludes(rawReport, "Home/cockpit route tested: `/`", "report home route");
  assertIncludes(report, linkedRoute, "report linked route");
  assertIncludes(report, downstreamRoute, "report downstream route");
  assertIncludes(report, "human_signoff_completed: false", "report human signoff false");
  assertIncludes(report, "human_review_still_required: true", "report human review true");
  assertIncludes(report, "readiness is not promotion", "report readiness boundary");
  assertIncludes(
    report,
    "validation pass is not truth/proof/approval/product readiness",
    "report validation boundary",
  );
  for (const section of reportRequiredSections) {
    assertIncludes(rawReport, `## ${section}`, `report section ${section}`);
  }
}

function assertBrowserValidator() {
  for (const phrase of [
    homeRoute,
    linkedRoute,
    downstreamRoute,
    entrypointTestId,
    "Page.enable",
    "Runtime.enable",
    "Network.enable",
    "Log.enable",
    "request metadata only",
    "requiredVisibleCopy",
    "requiredSections",
    "destinationRequiredCopy",
    "downstreamRequiredCopy",
    "readEntrypointLinks",
    "readScopedActionControls",
    "allowedNavigationLabel",
    navigationLabel,
    "forbiddenMethods",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "api_target",
    "external_non_loopback_request",
    "promotion_decision_or_execution_route",
    "product_write_route",
    "proof_or_evidence_route",
    "formation_receipt_write_route",
    "github_route",
    "release_route",
    "provider_route",
    "source_fetch_route",
    "retrieval_expansion_route",
    reportPath,
  ]) {
    assertIncludes(browserScript, phrase, `browser validator phrase ${phrase}`);
  }
  for (const pattern of [
    /Network\.getResponseBody/,
    /request\.postData/,
    /postData/i,
    /raw_request_body/i,
    /raw_response_body/i,
    /raw_har/i,
    /captureScreenshot/,
    /writeFile\([^)]*\.png/i,
    /\/Users\//,
  ]) {
    assert.doesNotMatch(browserScript, pattern, `browser validator must not include ${pattern}`);
  }
}

function assertAuthorityBoundary() {
  for (const phrase of deniedCapabilityPhrases) {
    assertIncludes(docs, normalize(phrase), `doc denies ${phrase}`);
    assertIncludes(report, normalize(phrase), `report denies ${phrase}`);
  }
  for (const capability of forbiddenCapabilityKeys) {
    assert.ok(
      fixture.forbidden_capabilities.includes(capability),
      `fixture forbids ${capability}`,
    );
    assert.equal(fixture.authority_boundary[capability], false, `authority ${capability}`);
  }
  for (const field of [
    "human_review_performed",
    "human_signoff_claimed",
    "validation_pass_is_truth",
    "validation_pass_is_proof",
    "validation_pass_is_approval",
    "validation_pass_is_product_readiness",
    "browser_validation_is_human_review",
    "new_api_routes",
  ]) {
    assert.equal(fixture.authority_boundary[field], false, field);
  }
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.human_review_still_required, true);
  assert.equal(fixture.authority_boundary.readiness_is_promotion, false);
  const nav = fixture.navigation_affordances?.[0];
  assert.equal(nav.label, navigationLabel);
  assert.equal(nav.href, linkedRoute);
  assert.equal(nav.affordance_type, "navigation_link");
  assert.equal(nav.external, false);
  assert.equal(nav.role_button, false);
  assert.equal(nav.write_action, false);
  assert.equal(nav.promotion_action, false);
  assert.equal(nav.proof_or_evidence_action, false);
  assert.equal(nav.product_write_action, false);
  assert.equal(nav.release_action, false);
}

function assertPublicSafe() {
  for (const [label, text] of [
    ["doc", rawDocs],
    ["fixture", fixtureText],
    ["report", rawReport],
    ["browser validator", browserScript],
    ["component", component],
  ]) {
    for (const pattern of unsafeArtifactPatterns) {
      assert.doesNotMatch(text, pattern, `${label} must not contain ${pattern}`);
    }
  }
}

function assertFinalRecommendation() {
  const recommendation = JSON.stringify(fixture.final_recommendation);
  for (const allowed of [
    "browser/static validation complete",
    "next read/display usability slice",
    "human spot review",
  ]) {
    assertIncludes(recommendation, allowed, `fixture recommendation ${allowed}`);
    assertIncludes(docs, normalize(allowed), `doc recommendation ${allowed}`);
    assertIncludes(report, normalize(allowed), `report recommendation ${allowed}`);
  }
  for (const forbidden of ["promotion execution", "product-write", "release"]) {
    assertIncludes(recommendation, forbidden, `fixture not allowed ${forbidden}`);
  }
  assert.doesNotMatch(
    rawDocs.match(/## Final Recommendation[\s\S]*$/)?.[0] ?? "",
    /(?:^|\n)\s*(?:recommend|proceed to|continue to)\s+(?:promotion execution|product-write|release)/i,
    "doc final recommendation must not recommend authority action",
  );
  assert.doesNotMatch(
    rawReport.match(/## Final Recommendation[\s\S]*?## Final Status/s)?.[0] ?? "",
    /(?:^|\n)\s*(?:recommend|proceed to|continue to)\s+(?:promotion execution|product-write|release)/i,
    "report final recommendation must not recommend authority action",
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
  assert.ok(haystack.includes(needle), `${label} missing: ${needle}`);
}
