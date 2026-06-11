import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import inboxHelper from "../lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts";

const {
  buildCodexFormerCaptureReviewInboxFixture,
  filterCodexFormerCaptureReviewItems,
  validateCodexFormerCaptureReviewInboxItem,
} = inboxHelper;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/capture-review-inbox-fixture/page.tsx";
const componentFile =
  "components/codex-former-capture-review-inbox-fixture.tsx";
const helperFile =
  "lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts";
const cssFile = "app/globals.css";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_DESIGN_V0_1.md";
const implementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const implementationReportFile =
  "reports/2026-06-11-perspective-codex-former-capture-review-inbox-fixture-surface-implementation.md";
const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-capture-review-inbox-fixture-surface.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-capture-review-inbox-fixture-surface-implementation.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-capture-review-inbox-fixture-surface.mjs";
const passFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
const blockedFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const designDocText = readFileSync(designDocFile, "utf8");
const docText = readFileSync(implementationDocFile, "utf8");
const reportText = readFileSync(implementationReportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");
const passFixture = JSON.parse(readFileSync(passFixtureFile, "utf8"));
const blockedFixture = JSON.parse(readFileSync(blockedFixtureFile, "utf8"));
const inboxFixture = buildCodexFormerCaptureReviewInboxFixture({
  passWithFollowUpPreviewData: passFixture,
  blockedPreviewData: blockedFixture,
});

assertPackageScripts();
assertFilesExist();
assertRouteAndFixtures();
assertInboxSemantics();
assertSurfaceSource();
assertHelperValidation();
assertDocsAndReports();
assertNoExecutableControls();
assertNoForbiddenBehavior();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-capture-review-inbox-fixture-surface-implementation",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-capture-review-inbox-fixture-surface-implementation"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the implementation smoke",
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-capture-review-inbox-fixture-surface"
    ],
    `node ${browserSmokeFile}`,
    "package.json must register the browser validation report smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    helperFile,
    implementationDocFile,
    implementationReportFile,
    browserReportFile,
    smokeFile,
    browserSmokeFile,
    passFixtureFile,
    blockedFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertRouteAndFixtures() {
  assertIncludesAll(routeText, [
    "CodexFormerCaptureReviewInboxFixtureSurface",
    "buildCodexFormerCaptureReviewInboxFixture",
    "2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json",
    "2026-06-10-codex-former-constellation-preview-data-blocked.json",
  ]);
}

function assertInboxSemantics() {
  assert.equal(inboxFixture.items.length, 4, "normal inbox must define four items");
  assert.equal(inboxFixture.emptyState.reviewability, "empty");
  assert.equal(inboxFixture.invalidState.reviewability, "invalid_data");

  const byId = Object.fromEntries(inboxFixture.items.map((item) => [item.id, item]));
  assertIncludesAll(Object.keys(byId).join("\n"), [
    "capture-review:pending-preparation",
    "capture-review:waiting-for-candidate",
    "capture-review:pass-with-follow-up",
    "capture-review:blocked",
  ]);

  assert.equal(
    byId["capture-review:pending-preparation"].reviewability,
    "not_ready",
  );
  assert.equal(
    byId["capture-review:waiting-for-candidate"].reviewability,
    "waiting",
  );
  assert.equal(
    byId["capture-review:pass-with-follow-up"].reviewability,
    "reviewable_with_follow_up",
  );
  assert.equal(byId["capture-review:blocked"].reviewability, "blocked");

  assert.equal(
    byId["capture-review:pass-with-follow-up"].safeLinks.sessionPanel.available,
    true,
  );
  assert.equal(
    byId["capture-review:pass-with-follow-up"].safeLinks.constellationPreview
      .available,
    true,
  );
  assert.equal(
    byId["capture-review:blocked"].safeLinks.sessionPanel.available,
    true,
  );
  assert.equal(
    byId["capture-review:blocked"].safeLinks.constellationPreview.available,
    false,
  );
  assert.equal(
    byId["capture-review:pending-preparation"].safeLinks.constellationPreview
      .available,
    false,
  );
  assert.equal(
    byId["capture-review:waiting-for-candidate"].safeLinks.constellationPreview
      .available,
    false,
  );
  assert.equal(
    byId["capture-review:pass-with-follow-up"].authorityTags.includes(
      "non_committed",
    ),
    true,
    "PASS item must keep non_committed visible",
  );
  assert.equal(
    byId["capture-review:pass-with-follow-up"].authorityTags.includes(
      "review_only",
    ),
    true,
    "PASS item must keep review_only visible",
  );
  assert(
    byId["capture-review:blocked"].blockedReasonCount > 0,
    "BLOCKED item must keep blocked reasons visible",
  );
  assert.equal(
    inboxFixture.emptyState.detail.includes("not an error"),
    true,
    "empty inbox must not be treated as an error",
  );

  assert.deepEqual(
    filterCodexFormerCaptureReviewItems(inboxFixture.items, "reviewable").map(
      (item) => item.id,
    ),
    ["capture-review:pass-with-follow-up"],
  );

  for (const item of inboxFixture.items) {
    assert.equal(item.reviewOnly, true, `${item.id} must be review-only`);
    assert.equal(
      item.acceptedState,
      false,
      `${item.id} must not be accepted state`,
    );
    assert(item.badges.length <= 2, `${item.id} must have at most two badges`);
    assert.equal(
      item.privacy.rawPayloadsIncluded,
      false,
      `${item.id} must not include raw payloads`,
    );
    assert.equal(
      item.privacy.boundedSummariesOnly,
      true,
      `${item.id} must use bounded summaries only`,
    );
  }
}

function assertSurfaceSource() {
  assertIncludesAll(componentText, [
    "Inbox Header",
    "Filter / Group Bar",
    "Review Item List",
    "Selected Item Summary",
    "Warning / Blocking Triage",
    "Authority Boundary Box",
    "Safe Next Actions",
    "Empty / Invalid State",
    "data-augnes-region=\"inbox-header\"",
    "data-augnes-region=\"filter-group-bar\"",
    "data-augnes-region=\"review-item-list\"",
    "data-augnes-region=\"selected-item-summary\"",
    "data-augnes-region=\"warning-blocking-triage\"",
    "data-augnes-region=\"authority-boundary-box\"",
    "data-augnes-region=\"safe-next-actions\"",
    "data-augnes-region=\"empty-invalid-state\"",
    "data-augnes-inbox-filter=\"empty\"",
    "data-augnes-inbox-badge-count",
  ]);
  assertIncludesAll(helperText, [
    "CodexFormerCaptureReviewInboxFixture",
    "CodexFormerCaptureReviewInboxItem",
    "CodexFormerCaptureReviewability",
    "empty",
    "not_ready",
    "waiting",
    "reviewable_with_follow_up",
    "blocked",
    "invalid_data",
    "Pending preparation",
    "Waiting for returned candidate",
    "Reviewable PASS with follow-up",
    "BLOCKED returned material",
    "Open read-only Session Panel",
    "Open read-only Constellation Preview",
    "Constellation Preview not ready",
    "noConstellationLink",
    "validateCodexFormerCaptureReviewInboxItem",
    "unsupported reviewability",
  ]);
  assertIncludesAll(cssText, [
    ".codex-former-inbox-shell",
    ".codex-former-inbox-filter-bar",
    ".codex-former-inbox-item",
    ".codex-former-inbox-authority",
    ".codex-former-inbox-empty-state",
  ]);
}

function assertHelperValidation() {
  for (const item of inboxFixture.items) {
    assert.deepEqual(validateCodexFormerCaptureReviewInboxItem(item), {
      valid: true,
      errors: [],
    });
  }
  assert.equal(
    validateCodexFormerCaptureReviewInboxItem({
      id: "bad:item",
      reviewability: "empty",
      badges: [],
    }).valid,
    false,
  );
  assert.equal(
    validateCodexFormerCaptureReviewInboxItem({
      id: "capture-review:too-many-badges",
      reviewability: "empty",
      badges: ["one", "two", "three"],
    }).valid,
    false,
  );
}

function assertDocsAndReports() {
  assertIncludesAll(designDocText, [
    "Capture Review Inbox",
    "Reviewability Taxonomy",
    "PASS with follow-up",
    "BLOCKED",
  ]);
  assertIncludesAll(docText, [
    "# Perspective Codex Former Capture Review Inbox Fixture Surface Implementation v0.1",
    "Purpose",
    "Why Follows PR #506",
    "Surface Is Read-Only",
    "Fixture Inputs And Local Items",
    "Route / Surface Path",
    "Inbox Header Implementation",
    "Filter / Group Bar Implementation",
    "Review Item List Implementation",
    "Selected Item Summary Implementation",
    "Warning / Blocking Triage Implementation",
    "Authority Boundary Box Implementation",
    "Safe Next Actions Implementation",
    "Empty / Invalid State Implementation",
    "Empty Inbox Behavior",
    "Pending Preparation Behavior",
    "Waiting For Candidate Behavior",
    "PASS with follow-up Behavior",
    "BLOCKED Behavior",
    "Accessibility Notes",
    "Browser/Computer-Use Validation",
    "Privacy Boundary",
    "Authority Boundary",
    "Known Caveats",
    "Design local Codex integration adapter",
    "Conclusion",
    "PASS with follow-up",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #506",
    "Implementation Scope",
    "Route / Surface Path",
    "Fixture Inputs And Local Items",
    "Empty Inbox Surface Result",
    "Pending Preparation Surface Result",
    "Waiting For Candidate Surface Result",
    "PASS with follow-up Surface Result",
    "BLOCKED Surface Result",
    "Filter/group Behavior",
    "Selected Item Behavior",
    "Accessibility Notes",
    "Browser/Computer-Use Validation",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
  assertIncludesAll(browserReportText, [
    "Date",
    "Branch",
    "Local target route",
    "Setup command",
    "Empty inbox observations",
    "Pending preparation observations",
    "Waiting for candidate observations",
    "PASS with follow-up observations",
    "BLOCKED observations",
    "Filter/group behavior",
    "Selected item behavior",
    "Link/handoff behavior",
    "Accessibility / keyboard notes",
    "Responsive / layout notes",
    "Console and traffic notes",
    "Result",
  ]);
}

function assertNoExecutableControls() {
  const buttonLabels = [
    ...componentText.matchAll(/<button[\s\S]*?>([\s\S]*?)<\/button>/g),
  ].map((match) => stripTags(match[1]).replace(/\s+/g, " ").trim());

  const disallowedDecisionControls = [
    "approve",
    "promote",
    "reject",
    "accepted",
    "final",
    "committed",
  ];
  for (const label of buttonLabels) {
    const normalized = label.toLowerCase();
    for (const word of disallowedDecisionControls) {
      assert(
        !normalized.includes(word),
        `button label must not imply decision authority: ${label}`,
      );
    }
  }
}

function assertNoForbiddenBehavior() {
  const runtimeText = [routeText, componentText, helperText].join("\n");
  const forbidden = [
    ["local", "Storage"].join(""),
    ["session", "Storage"].join(""),
    "indexedDB",
    ["navigator", "clipboard"].join("."),
    ["fetch", "("].join(""),
    "XMLHttpRequest",
    ["responses", "create"].join("."),
    ["openai", "chat"].join("."),
    ["createClient", "("].join(""),
    ["better", "sqlite3"].join("-"),
    "graphql(",
    "recordProof",
    "createEvidence",
    "commitStateUpdate",
  ];

  for (const token of forbidden) {
    assert(
      !runtimeText.includes(token),
      `runtime implementation must not include forbidden behavior string: ${token}`,
    );
  }

  const lowercaseRuntimeText = runtimeText.toLowerCase();
  assert(
    !lowercaseRuntimeText.includes("accept/promote/reject action"),
    "runtime implementation must not introduce accept/promote/reject actions",
  );
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = [
    routeText,
    componentText,
    helperText,
    docText,
    reportText,
    browserReportText,
  ].join("\n");
  const rawMarkers = [
    ["hidden", "reasoning"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["oauth", "token"].join("_"),
    ["sk", "proj"].join("-"),
    ["gh", "p_"].join(""),
  ];

  for (const marker of rawMarkers) {
    assert(
      !publicText.includes(marker),
      `public docs/reports/source must not echo raw unsafe/private marker: ${marker}`,
    );
  }
}

function assertChangedFileBoundary() {
  const changed = execFileSync("git", ["diff", "--name-only", "main...HEAD"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const workingTreeChanged = execFileSync(
    "git",
    ["diff", "--name-only", "--"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);
  const allChanged = [...new Set([...changed, ...workingTreeChanged, ...untracked])];
  const allowed = new Set([
    packageFile,
    routeFile,
    componentFile,
    helperFile,
    cssFile,
    implementationDocFile,
    implementationReportFile,
    browserReportFile,
    smokeFile,
    browserSmokeFile,
  ]);

  for (const file of allChanged) {
    assert(allowed.has(file), `capture review inbox implementation changed an out-of-scope file: ${file}`);
  }
}

function assertIncludesAll(text, expected) {
  for (const phrase of expected) {
    assert(text.includes(phrase), `expected text to include: ${phrase}`);
  }
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}
