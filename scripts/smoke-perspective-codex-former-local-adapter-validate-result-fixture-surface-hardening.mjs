import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import surfaceFixture from "../lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts";

const {
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE,
  findForbiddenValidateResultExecutableControlCopy,
  forbiddenValidateResultExecutableControlTerms,
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
const baseSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs";
const baseBrowserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface.mjs";
const hardeningSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.mjs";
const hardeningBrowserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.mjs";
const baseDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_V0_1.md";
const hardeningDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_HARDENING_V0_1.md";
const baseReportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md";
const hardeningReportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md";
const baseBrowserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md";
const hardeningBrowserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md";
const fixtureFiles = [
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json",
];
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const baseSmokeText = readFileSync(baseSmokeFile, "utf8");
const hardeningBrowserSmokeText = readFileSync(hardeningBrowserSmokeFile, "utf8");
const docText = readFileSync(hardeningDocFile, "utf8");
const reportText = readFileSync(hardeningReportFile, "utf8");
const browserReportText = readFileSync(hardeningBrowserReportFile, "utf8");
const fixtureInput = {
  sessionPanelSnapshots: {
    pass: JSON.parse(readFileSync(fixtureFiles[0], "utf8")),
    passWithFollowUp: JSON.parse(readFileSync(fixtureFiles[1], "utf8")),
    blocked: JSON.parse(readFileSync(fixtureFiles[2], "utf8")),
  },
  inboxItems: {
    pass: JSON.parse(readFileSync(fixtureFiles[3], "utf8")),
    passWithFollowUp: JSON.parse(readFileSync(fixtureFiles[4], "utf8")),
    blocked: JSON.parse(readFileSync(fixtureFiles[5], "utf8")),
  },
  snapshotSummary: JSON.parse(readFileSync(fixtureFiles[6], "utf8")),
};

assertPackageScripts();
assertFilesExist();
assertRouteAndFixtureConsumption();
assertHelperHardening();
assertComponentHardening();
assertCssHardening();
assertDocsReportsAndBrowserMatrix();
assertNoForbiddenRuntimeApis();
assertNoForbiddenExecutableControls();
assertNoUnsafeVisibleSurfaceMarkers();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening"
    ],
    `${expectedTsxCommand} ${hardeningSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening"
    ],
    `node ${hardeningBrowserSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface"
    ],
    `${expectedTsxCommand} ${baseSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-local-adapter-validate-result-fixture-surface"
    ],
    `node ${baseBrowserSmokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    cssFile,
    helperFile,
    baseSmokeFile,
    baseBrowserSmokeFile,
    hardeningSmokeFile,
    hardeningBrowserSmokeFile,
    baseDocFile,
    hardeningDocFile,
    baseReportFile,
    hardeningReportFile,
    baseBrowserReportFile,
    hardeningBrowserReportFile,
    packageFile,
    ...fixtureFiles,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertRouteAndFixtureConsumption() {
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

function assertHelperHardening() {
  assertIncludesAll(helperText, [
    "forbiddenValidateResultExecutableControlTerms",
    "findForbiddenValidateResultExecutableControlCopy",
    "Call Provider",
    "Create readiness",
    "Create evidence",
    "Create proof",
    "validation_summary safe link href must be null",
    "runtime_handoff availability must stay false",
  ]);
  assert.deepEqual(
    validateCodexFormerLocalAdapterValidateResultFixtureSurface(fixtureInput),
    { valid: true, errors: [] },
  );
  assert.deepEqual(
    findForbiddenValidateResultExecutableControlCopy([
      "PASS",
      "Call Provider",
      "Create evidence",
    ]),
    [
      { control: "Call Provider", term: "Call Provider" },
      { control: "Create evidence", term: "Create evidence" },
    ],
  );
}

function assertComponentHardening() {
  assertIncludesAll(componentText, [
    "aria-current",
    "aria-describedby",
    "aria-label",
    "data-augnes-selected-scenario-evidence",
    "data-augnes-selected-inbox-evidence",
    "data-augnes-safe-links",
    "data-augnes-safe-link-navigation",
    "Current scenario:",
    "Current inbox item:",
    "reviewability",
    "local fixture reference only",
    "availability text only, no href, no navigation target",
    "unavailable / no href / no navigation / no product authority",
    "unavailable / no href / no navigation / no runtime state",
    "PASS remains review-only",
    "PASS with follow-up remains review material",
    "BLOCKED is a validation result, not automated rejection",
  ]);
  assertIncludesAll(componentText, [
    "PASS",
    "PASS with follow-up",
    "BLOCKED",
    "review-only fixture material",
    "next_safe_action",
    "caveat",
  ]);
}

function assertCssHardening() {
  assertIncludesAll(cssText, [
    ".selectionEvidence",
    ".safeLinkNotice",
    ".chip[aria-current=\"true\"]",
    ".itemButton[aria-current=\"true\"]",
    ".details > summary:focus-visible",
    "outline: 4px solid",
    "box-shadow",
    "overflow-wrap: anywhere",
  ]);
}

function assertDocsReportsAndBrowserMatrix() {
  const publicText = `${docText}\n${reportText}\n${browserReportText}\n${hardeningBrowserSmokeText}`;
  assertIncludesAll(publicText, [
    "Why This Follows PR #526",
    "Hardening Scope",
    CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE,
    "Accessibility / Focus Changes",
    "Copy / Denylist Hardening",
    "Safe-Link Non-Navigation",
    "Responsive Behavior",
    "Browser / Computer-Use Validation Results",
    "Synthetic Tab Limitation",
    "Authority Boundary",
    "Privacy / Redaction Handling",
    "Skipped Checks",
    "recommended next PR",
    "route loads successfully",
    "scenario/filter/item interaction matrix",
    "native focusable-order evidence",
    "forbidden-controls check",
    "safe-link non-navigation check",
    "privacy/raw-material visibility check",
  ]);
}

function assertNoForbiddenRuntimeApis() {
  const sourceText = `${routeText}\n${componentText}\n${helperText}`;
  for (const pattern of [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bindexedDB\b/,
    /navigator\.clipboard/,
    /document\.cookie/,
    /window\.location/,
    /router\.(push|replace|prefetch)/,
  ]) {
    assert.equal(pattern.test(sourceText), false, `source must not match ${pattern}`);
  }
}

function assertNoForbiddenExecutableControls() {
  const buttonBodies = Array.from(
    componentText.matchAll(/<button[\s\S]*?<\/button>/g),
    (match) => match[0],
  );
  const ariaLabels = Array.from(
    componentText.matchAll(/aria-label=\{?`([^`]+)`\}?|aria-label="([^"]+)"/g),
    (match) => match[1] ?? match[2] ?? "",
  );
  const controlText = [...buttonBodies, ...ariaLabels];
  const hits = findForbiddenValidateResultExecutableControlCopy(controlText);
  assert.deepEqual(hits, []);
  assert(forbiddenValidateResultExecutableControlTerms.includes("Create proof"));
}

function assertNoUnsafeVisibleSurfaceMarkers() {
  const visibleSource = `${routeText}\n${componentText}`;
  for (const marker of [
    "raw returned candidate",
    "raw prompt",
    "raw source packet",
    "raw packet content",
    "hidden reasoning",
    "provider logs",
    "secrets",
    "cookies",
    "tokens",
    "API keys",
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
      visibleSource.includes(marker),
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
  const allowedFiles = [
    routeFile,
    componentFile,
    cssFile,
    helperFile,
    baseSmokeFile,
    "scripts/smoke-perspective-codex-former-local-adapter-validate-result-snapshots.mjs",
    "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-execution.mjs",
    hardeningSmokeFile,
    hardeningBrowserSmokeFile,
    hardeningDocFile,
    hardeningReportFile,
    hardeningBrowserReportFile,
    "scripts/smoke-perspective-codex-former-local-adapter-v0-1-closeout.mjs",
    "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_V0_1_CLOSEOUT.md",
    "reports/2026-06-12-perspective-codex-former-local-adapter-v0-1-closeout.md",
    "reports/fixtures/2026-06-12-codex-former-local-adapter-v0-1-closeout-summary.json",
    packageFile,
  ];
  for (const file of changedFiles) {
    assert(allowedFiles.includes(file), `changed-file boundary excludes ${file}`);
  }
}

function assertIncludesAll(text, phrases) {
  for (const phrase of phrases) {
    assert(text.includes(phrase), `expected phrase: ${phrase}`);
  }
}
