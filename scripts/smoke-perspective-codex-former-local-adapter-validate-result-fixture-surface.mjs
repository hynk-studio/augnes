import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import surfaceFixture from "../lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts";

const {
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE,
  filterValidateResultInboxItems,
  validateCodexFormerLocalAdapterValidateResultFixtureSurface,
} = surfaceFixture;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/page.tsx";
const componentFile =
  "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.tsx";
const cssFile =
  "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.module.css";
const helperFile =
  "lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_V0_1.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md";
const browserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md";
const sessionPassFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json";
const sessionFollowUpFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json";
const sessionBlockedFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json";
const inboxPassFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json";
const inboxFollowUpFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json";
const inboxBlockedFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json";
const snapshotSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");
const browserSmokeText = readFileSync(browserSmokeFile, "utf8");
const fixtureInput = {
  sessionPanelSnapshots: {
    pass: JSON.parse(readFileSync(sessionPassFixtureFile, "utf8")),
    passWithFollowUp: JSON.parse(readFileSync(sessionFollowUpFixtureFile, "utf8")),
    blocked: JSON.parse(readFileSync(sessionBlockedFixtureFile, "utf8")),
  },
  inboxItems: {
    pass: JSON.parse(readFileSync(inboxPassFixtureFile, "utf8")),
    passWithFollowUp: JSON.parse(readFileSync(inboxFollowUpFixtureFile, "utf8")),
    blocked: JSON.parse(readFileSync(inboxBlockedFixtureFile, "utf8")),
  },
  snapshotSummary: JSON.parse(readFileSync(snapshotSummaryFixtureFile, "utf8")),
};

assertPackageScripts();
assertFilesExist();
assertRouteImportsCommittedFixtures();
assertHelperValidationAndFiltering();
assertComponentSource();
assertCssSource();
assertDocsAndReports();
assertNoForbiddenBrowserOrRuntimeSurfaces();
assertNoForbiddenExecutableControls();
assertNoUnsafeSurfaceMarkers();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-local-adapter-validate-result-fixture-surface"
    ],
    `node ${browserSmokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    cssFile,
    helperFile,
    smokeFile,
    browserSmokeFile,
    docFile,
    reportFile,
    browserReportFile,
    sessionPassFixtureFile,
    sessionFollowUpFixtureFile,
    sessionBlockedFixtureFile,
    inboxPassFixtureFile,
    inboxFollowUpFixtureFile,
    inboxBlockedFixtureFile,
    snapshotSummaryFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertRouteImportsCommittedFixtures() {
  assertIncludesAll(routeText, [
    "CodexFormerLocalAdapterValidateResultFixtureSurface",
    "validateCodexFormerLocalAdapterValidateResultFixtureSurface",
    "2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json",
    "2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json",
    "2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json",
    "2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json",
    "2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json",
    "2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json",
    "2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json",
  ]);
  assert.equal(routeText.includes("readFile"), false);
  assert.equal(routeText.includes("process.argv"), false);
}

function assertHelperValidationAndFiltering() {
  assertIncludesAll(helperText, [
    "CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE",
    "validation-pass-with-follow-up",
    "expected exactly 3 validate result Session Panel scenarios",
    "expected exactly 3 validate result Capture Review Inbox items",
    "validation_summary safe link href must be null",
    "read_only_validate_result_ui availability must stay false",
    "runtime_handoff availability must stay false",
    "snapshot summary mode must be validate-result-snapshots",
    "filterValidateResultInboxItems",
  ]);
  const validation =
    validateCodexFormerLocalAdapterValidateResultFixtureSurface(fixtureInput);
  assert.deepEqual(validation, { valid: true, errors: [] });
  const items = Object.values(fixtureInput.inboxItems);
  assert.equal(filterValidateResultInboxItems(items, "all").length, 3);
  assert.deepEqual(
    filterValidateResultInboxItems(items, "reviewable").map((item) => item.item_id),
    ["local-adapter-validation-pass"],
  );
  assert.deepEqual(
    filterValidateResultInboxItems(items, "reviewable_with_follow_up").map(
      (item) => item.item_id,
    ),
    ["local-adapter-validation-pass-with-follow-up"],
  );
  assert.deepEqual(
    filterValidateResultInboxItems(items, "blocked").map((item) => item.item_id),
    ["local-adapter-validation-blocked"],
  );
}

function assertComponentSource() {
  assertIncludesAll(componentText, [
    "Validate Result Session Panel",
    "Capture Review Inbox Preview",
    "Snapshot Summary / Readiness",
    "PASS remains review-only",
    "PASS with follow-up remains review material",
    "BLOCKED is a validation result, not automated rejection",
    "aria-pressed",
    "details",
    "summary",
    "candidate_count",
    "candidate_shape_status",
    "contract_fit_status",
    "direct_validation_status",
    "candidate_compatible_review_material",
    "candidate_authority",
    "candidate_basis_quality",
    "worker_facing_guidance_status",
    "worker_facing_guidance_advisory_only",
    "warning_count",
    "pointer_warning_count",
    "blocked_reason_count",
    "review_only",
    "accepted_state",
    "review_decision_created",
    "product_readiness_created",
    "constellation_handoff_available",
    "runtime_handoff_available",
    "Safe Link Availability",
    "read_only_validate_result_ui available",
    "runtime_handoff available",
    "Prohibited Control Copy / Policy Text Only",
  ]);
  assertIncludesAll(componentText, [
    "data-augnes-validate-result-scenario",
    "data-augnes-validate-result-filter",
    "data-augnes-validate-result-inbox-item",
    "data-augnes-selected-session-status",
    "data-augnes-selected-inbox-item",
  ]);
}

function assertCssSource() {
  assertIncludesAll(cssText, [
    ".shell",
    ".previewGrid",
    ".buttonRow",
    ".chip",
    ".itemButton",
    ".details > summary:focus-visible",
    ".tonePass",
    ".toneFollowUp",
    ".toneBlocked",
    "overflow-wrap: anywhere",
    "@media (max-width: 520px)",
  ]);
}

function assertDocsAndReports() {
  const publicText = `${docText}\n${reportText}\n${browserReportText}\n${browserSmokeText}`;
  assertIncludesAll(publicText, [
    "Read-only local Codex adapter validate result fixture surface",
    CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE,
    "PASS, review-only",
    "PASS with follow-up, review-only",
    "BLOCKED, review-only finding",
    "PASS is review-only and not approval",
    "PASS with follow-up remains review material only",
    "BLOCKED is a validation result, not automated rejection",
    "validation_summary_path and validation_summary_hash render only inside expanded details",
    "safe links are availability text only",
    "No unexpected external traffic",
    "390px viewport had no horizontal overflow",
    "768px viewport had no horizontal overflow",
    "desktop viewport had no horizontal overflow",
    "changed-file boundary",
  ]);
}

function assertNoForbiddenBrowserOrRuntimeSurfaces() {
  const sourceText = `${routeText}\n${componentText}\n${helperText}`;
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bindexedDB\b/,
    /navigator\.clipboard/,
    /document\.cookie/,
    /window\.location/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(sourceText), false, `source must not match ${pattern}`);
  }
}

function assertNoForbiddenExecutableControls() {
  const buttonBodies = Array.from(
    componentText.matchAll(/<button[\s\S]*?<\/button>/g),
    (match) => match[0],
  );
  const forbiddenControlTerms = [
    "Accept",
    "Approve",
    "Promote",
    "Reject",
    "Merge",
    "Deploy",
    "Persist",
    "Export",
    "Run Codex",
    "Call Codex",
    "Call provider/model",
    "Create review decision",
    "Create accepted state",
    "Handoff to runtime",
  ];
  for (const buttonBody of buttonBodies) {
    for (const term of forbiddenControlTerms) {
      assert.equal(
        buttonBody.includes(term),
        false,
        `button copy must not include ${term}`,
      );
    }
  }
}

function assertNoUnsafeSurfaceMarkers() {
  const surfaceSource = `${routeText}\n${componentText}`;
  for (const marker of [
    "raw returned candidate",
    "raw prompt",
    "raw source packet",
    "raw packet content",
    "hidden reasoning",
    "provider logs",
    "browser dumps",
    "raw diffs",
    "raw review payloads",
    "raw source payloads",
    "raw candidate payloads",
    "private markers",
    "unsafe marker values",
    "sk-proj-",
    "ghp_",
  ]) {
    assert.equal(
      surfaceSource.includes(marker),
      false,
      `surface source must not include unsafe marker ${marker}`,
    );
  }
}

function assertChangedFileBoundary() {
  const stdout = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    encoding: "utf8",
  });
  const changedFiles = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const allowedPrefixes = [
    "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/",
    "lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts",
    "scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs",
    "scripts/browser-smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs",
    "scripts/smoke-perspective-codex-former-local-adapter-validate-result-snapshots.mjs",
    "scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.mjs",
    "scripts/browser-smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.mjs",
    "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_V0_1.md",
    "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_HARDENING_V0_1.md",
    "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md",
    "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md",
    "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md",
    "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md",
    "package.json",
  ];
  for (const file of changedFiles) {
    assert(
      allowedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix)),
      `changed-file boundary excludes ${file}`,
    );
  }
}

function assertIncludesAll(text, phrases) {
  for (const phrase of phrases) {
    assert(text.includes(phrase), `expected phrase: ${phrase}`);
  }
}
