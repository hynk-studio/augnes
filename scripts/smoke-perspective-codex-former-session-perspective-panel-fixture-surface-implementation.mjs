import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import sessionPanelHelper from "../lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts";

const {
  buildCodexFormerSessionPanelScenarios,
  validateCodexFormerSessionPanelScenario,
} = sessionPanelHelper;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/session-perspective-panel-fixture/page.tsx";
const componentFile =
  "components/codex-former-session-perspective-panel-fixture.tsx";
const helperFile =
  "lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts";
const cssFile = "app/globals.css";
const implementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_DESIGN_V0_1.md";
const implementationReportFile =
  "reports/2026-06-11-perspective-codex-former-session-perspective-panel-fixture-surface-implementation.md";
const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-session-perspective-panel-fixture-surface.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-session-perspective-panel-fixture-surface-implementation.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-session-perspective-panel-fixture-surface.mjs";
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
const docText = readFileSync(implementationDocFile, "utf8");
const designDocText = readFileSync(designDocFile, "utf8");
const reportText = readFileSync(implementationReportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");
const passFixture = JSON.parse(readFileSync(passFixtureFile, "utf8"));
const blockedFixture = JSON.parse(readFileSync(blockedFixtureFile, "utf8"));

const scenarios = buildCodexFormerSessionPanelScenarios({
  passWithFollowUpPreviewData: passFixture,
  blockedPreviewData: blockedFixture,
});

assertPackageScripts();
assertFilesExist();
assertRouteAndFixtures();
assertScenarioSemantics();
assertSurfaceSource();
assertHelperValidation();
assertDocsAndReports();
assertNoExecutableControls();
assertNoForbiddenBehavior();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-session-perspective-panel-fixture-surface-implementation",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-session-perspective-panel-fixture-surface-implementation"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the implementation smoke",
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-session-perspective-panel-fixture-surface"
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
    "CodexFormerSessionPerspectivePanelFixtureSurface",
    "buildCodexFormerSessionPanelScenarios",
    "2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json",
    "2026-06-10-codex-former-constellation-preview-data-blocked.json",
  ]);
}

function assertScenarioSemantics() {
  assert.equal(scenarios.length, 4, "surface must define four scenarios");
  const scenarioIds = scenarios.map((scenario) => scenario.id);
  assert.deepEqual(scenarioIds, [
    "not-prepared",
    "waiting-for-candidate",
    "pass-with-follow-up",
    "blocked",
  ]);

  const byId = Object.fromEntries(
    scenarios.map((scenario) => [scenario.id, scenario]),
  );
  assert.equal(byId["not-prepared"].primaryStatusLabel, "Not prepared");
  assert.equal(
    byId["waiting-for-candidate"].primaryStatusLabel,
    "Waiting for candidate",
  );
  assert.equal(
    byId["pass-with-follow-up"].primaryStatusLabel,
    "PASS with follow-up",
  );
  assert.equal(byId.blocked.primaryStatusLabel, "BLOCKED");

  assert.equal(byId["pass-with-follow-up"].handoff.available, true);
  assert.equal(
    byId["pass-with-follow-up"].handoff.label,
    "Available for read-only graph inspection",
  );
  assert.equal(byId.blocked.handoff.available, false);
  assert.equal(
    byId.blocked.handoff.label,
    "Not available as usable review candidate",
  );
  assert.equal(byId["not-prepared"].handoff.label, "Not ready");
  assert.equal(byId["waiting-for-candidate"].handoff.label, "Not ready");

  assert.equal(byId["pass-with-follow-up"].acceptedState, false);
  assert.equal(byId.blocked.acceptedState, false);
  assert.equal(
    byId["pass-with-follow-up"].authority.tags.includes("non_committed"),
    true,
    "PASS scenario must keep non_committed visible",
  );
  assert.equal(
    byId["pass-with-follow-up"].authority.tags.includes("review_only"),
    true,
    "PASS scenario must keep review_only visible",
  );
  assert(
    byId.blocked.warnings.blockedReasonCount > 0,
    "BLOCKED scenario must keep blocked reasons visible",
  );

  for (const scenario of scenarios) {
    assert.equal(scenario.reviewOnly, true, `${scenario.id} must be review-only`);
    assert.equal(
      scenario.acceptedState,
      false,
      `${scenario.id} must not be accepted state`,
    );
    assert.equal(
      scenario.privacy.rawPayloadsIncluded,
      false,
      `${scenario.id} must not include raw payloads`,
    );
    assert.equal(
      scenario.privacy.boundedSummariesOnly,
      true,
      `${scenario.id} must use bounded summaries only`,
    );
  }
}

function assertSurfaceSource() {
  assertIncludesAll(componentText, [
    "Session Header",
    "Formation Timeline",
    "Status Card",
    "Evidence / Provenance Strip",
    "Warning / Blocking Summary",
    "Authority Boundary Box",
    "Action Guidance",
    "Constellation Handoff Preview",
    "data-augnes-region=\"session-header\"",
    "data-augnes-region=\"formation-timeline\"",
    "data-augnes-region=\"status-card\"",
    "data-augnes-region=\"evidence-provenance-strip\"",
    "data-augnes-region=\"warning-blocking-summary\"",
    "data-augnes-region=\"authority-boundary-box\"",
    "data-augnes-region=\"action-guidance\"",
    "data-augnes-region=\"constellation-handoff-preview\"",
    "Open read-only Constellation Preview",
    "Navigation not ready",
  ]);
  assertIncludesAll(helperText, [
    "local deterministic in-code fixture: not-prepared",
    "local deterministic in-code fixture: waiting-for-candidate",
    "Not prepared",
    "Waiting for candidate",
    "PASS with follow-up",
    "BLOCKED",
    "Available for read-only graph inspection",
    "Not available as usable review candidate",
    "Not ready",
    "validateCodexFormerSessionPanelScenario",
    "unsupported scenario id",
    "unsupported timeline status",
  ]);
  assertIncludesAll(cssText, [
    ".codex-former-session-panel-shell",
    ".codex-former-session-panel-header",
    ".codex-former-session-panel-timeline",
    ".codex-former-session-panel-status",
    ".codex-former-session-panel-evidence",
    ".codex-former-session-panel-warning",
    ".codex-former-session-panel-authority",
    ".codex-former-session-panel-action",
    ".codex-former-session-panel-handoff",
    ".status-blocked",
    ".status-needs_review",
    ":focus-visible",
  ]);
}

function assertHelperValidation() {
  const invalidId = validateCodexFormerSessionPanelScenario({
    id: "unsupported",
    timeline: [],
  });
  assert.equal(invalidId.valid, false);
  assert(
    invalidId.errors.some((error) => error.includes("unsupported scenario id")),
    "helper must reject unsupported scenario ids",
  );

  const invalidStatus = validateCodexFormerSessionPanelScenario({
    id: "not-prepared",
    timeline: [{ id: "step", status: "accepted" }],
  });
  assert.equal(invalidStatus.valid, false);
  assert(
    invalidStatus.errors.some((error) =>
      error.includes("unsupported timeline status"),
    ),
    "helper must reject unsupported timeline statuses",
  );
}

function assertDocsAndReports() {
  assertIncludesAll(designDocText, [
    "Codex Session Perspective Panel",
    "Conclusion: PASS with follow-up",
  ]);
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #504",
    "Surface Is Read-Only",
    "Fixture Inputs And Local Scenarios",
    "Route / Surface Path",
    "Session Header Implementation",
    "Formation Timeline Implementation",
    "Status Card Implementation",
    "Evidence / Provenance Strip Implementation",
    "Warning / Blocking Summary Implementation",
    "Authority Boundary Box Implementation",
    "Action Guidance Implementation",
    "Constellation Handoff Preview Implementation",
    "Not Prepared Behavior",
    "Waiting For Candidate Behavior",
    "PASS with follow-up Behavior",
    "BLOCKED Behavior",
    "Accessibility Notes",
    "Browser/Computer-Use Validation",
    "Privacy Boundary",
    "Authority Boundary",
    "Known Caveats",
    "Recommended Next PR",
    "Design Capture Review Inbox fixture surface",
    "Conclusion: PASS with follow-up",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #504",
    "Implementation Scope",
    "Route / Surface Path",
    "Fixture Inputs And Local Scenarios",
    "Not Prepared Surface Result",
    "Waiting For Candidate Surface Result",
    "PASS with follow-up Surface Result",
    "BLOCKED Surface Result",
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
    "Setup Command",
    "Not prepared observations",
    "Waiting for candidate observations",
    "PASS with follow-up observations",
    "BLOCKED observations",
    "Switching behavior",
    "Accessibility / keyboard notes",
    "Responsive / layout notes",
    "Console and traffic notes",
    "Result",
  ]);
}

function assertNoExecutableControls() {
  const buttonLabels = [
    ...componentText.matchAll(/<button[\s\S]*?>\s*([^<]+?)\s*<\/button>/g),
  ].map((match) => normalizeText(match[1]).toLowerCase());

  for (const label of buttonLabels) {
    assert.doesNotMatch(
      label,
      /\b(prepare|validate|codex|github|db|approve|merge|deploy)\b/,
      `button label must not be executable authority control: ${label}`,
    );
    assert.doesNotMatch(
      label,
      /\b(accepted|final|approved|committed)\b/,
      `button label must not imply accepted/final/approved/committed state: ${label}`,
    );
  }
}

function assertNoForbiddenBehavior() {
  const implementationText = `${routeText}\n${componentText}\n${helperText}`;
  for (const forbidden of [
    "local" + "Storage",
    "session" + "Storage",
    "indexed" + "DB",
    "navigator" + ".clipboard",
    "fetch" + "(",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "createClient" + "(",
    "better-" + "sqlite3",
    "sqlite",
    "graphql" + "(",
    "record" + "Proof",
    "create" + "Evidence",
    "commit" + "StateUpdate",
  ]) {
    assert.equal(
      implementationText.includes(forbidden),
      false,
      `implementation must not introduce forbidden behavior: ${forbidden}`,
    );
  }

  for (const requiredAuthorityTag of [
    "no_accepted_state",
    "no_db_write",
    "no_provider_call",
    "no_codex_sdk_call",
    "no_github_mutation",
    "no_core_decision",
  ]) {
    assert(
      scenarios.some((scenario) =>
        scenario.authority.tags.includes(requiredAuthorityTag),
      ),
      `authority tags must include ${requiredAuthorityTag}`,
    );
  }
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}\n${browserReportText}\n${componentText}\n${helperText}`;
  for (const marker of [
    "hidden" + "_reasoning",
    "raw_page" + "_dump",
    "raw_pr" + "_diff",
    "raw_review" + "_payload",
    "access" + "_token",
    "refresh" + "_token",
    "api" + "_key",
    "oauth" + "_token",
    "sk-proj" + "-",
    "ghp" + "_",
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public artifacts must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
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
  const changedFiles = collectChangedFiles();

  for (const changedFile of changedFiles) {
    assert(
      allowedChangedFiles.has(changedFile),
      `session panel fixture implementation changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `session panel fixture implementation must not touch forbidden runtime surface: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, requiredPhrases) {
  const normalizedText = normalizeText(text);
  for (const phrase of requiredPhrases) {
    assert(
      normalizedText.includes(normalizeText(phrase)),
      `expected text to include: ${phrase}`,
    );
  }
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}
