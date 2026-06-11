import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import surfaceFixture from "../lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts";

const {
  FORBIDDEN_INTERACTIVE_CONTROL_COPY,
  normalizeAuthorityFlagsForDisplay,
} = surfaceFixture;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx";
const componentFile =
  "components/codex-former-local-adapter-snapshot-fixture.tsx";
const helperFile =
  "lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts";
const cssFile = "app/globals.css";
const implementationSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation.mjs";
const hardeningDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_FIXTURE_SURFACE_HARDENING_V0_1.md";
const hardeningReportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md";
const hardeningBrowserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md";
const hardeningSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.mjs";
const hardeningBrowserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.mjs";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const docText = readFileSync(hardeningDocFile, "utf8");
const reportText = readFileSync(hardeningReportFile, "utf8");
const browserReportText = readFileSync(hardeningBrowserReportFile, "utf8");

assertPackageScripts();
assertFilesExist();
assertAccessibilityAndCopyHardening();
assertAuthorityNormalization();
assertDenylistControlBoundary();
assertNoForbiddenRuntimeSurfaces();
assertDocsAndReports();
assertResponsiveCss();
assertBrowserReportCoverage();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening"
    ],
    `${expectedTsxCommand} ${hardeningSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening"
    ],
    `node ${hardeningBrowserSmokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    helperFile,
    cssFile,
    hardeningDocFile,
    hardeningReportFile,
    hardeningBrowserReportFile,
    hardeningSmokeFile,
    hardeningBrowserSmokeFile,
    implementationSmokeFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertAccessibilityAndCopyHardening() {
  assertIncludesAll(componentText, [
    "role=\"group\"",
    "Session scenario selector",
    "Inbox filter bar",
    "aria-pressed",
    "buildInboxItemAriaLabel",
    "reviewability ${item.reviewability}",
    "candidate count",
    "not reviewable",
    "no Constellation handoff",
    "selectedScenario.primary_status_label",
    "selectedScenario.caveat_label",
    "selectedScenario.next_safe_action_label",
    "selectedItem.primary_status",
    "selectedItem.next_safe_action",
    "accepted state",
    "validation unavailable",
    "Constellation unavailable",
    "review candidate unavailable",
    "Local Snapshot / Handoff Boundary",
    "implementation readiness only",
    "not product readiness",
  ]);
}

function assertAuthorityNormalization() {
  assertIncludesAll(helperText, [
    "normalizeAuthorityFlagsForDisplay",
    "authorityFlagDisplayOrder",
    "prepare_helper_executed",
    "operational provenance only",
    "accepted_state_created",
    "review_decision_created",
    "surface_export_created",
    "validate_helper_executed",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "network_calls",
    "db_writes",
    "clipboard_automation",
  ]);
  const missing = normalizeAuthorityFlagsForDisplay({});
  assert(
    missing.every((flag) => flag.value === "false"),
    "missing flags must normalize to false",
  );
  const prepared = normalizeAuthorityFlagsForDisplay({
    prepare_helper_executed: true,
    validate_helper_executed: true,
    accepted_state_created: true,
  });
  assert.equal(
    prepared.find((flag) => flag.label === "prepare_helper_executed")?.value,
    "operational provenance only",
  );
  assert.equal(
    prepared.find((flag) => flag.label === "validate_helper_executed")?.value,
    "false",
  );
  assert.equal(
    prepared.find((flag) => flag.label === "accepted_state_created")?.value,
    "false",
  );
  assert(componentText.includes("normalizeAuthorityFlagsForDisplay"));
  assert(componentText.includes("buildInboxAuthorityFlagsForDisplay"));
}

function assertDenylistControlBoundary() {
  assert.deepEqual(FORBIDDEN_INTERACTIVE_CONTROL_COPY, [
    "Accept",
    "Approve",
    "Promote",
    "Reject",
    "Merge",
    "Deploy",
    "Validate",
    "Run Codex",
    "PASS",
    "BLOCKED",
  ]);
  assert(componentText.includes("FORBIDDEN_INTERACTIVE_CONTROL_COPY.map"));
  assert(componentText.includes("Prohibited Control Copy / Denylist"));

  const interactiveTexts = collectInteractiveSourceLabels(componentText);
  for (const label of interactiveTexts) {
    for (const term of FORBIDDEN_INTERACTIVE_CONTROL_COPY) {
      assert(
        !label.includes(term),
        `forbidden action term ${term} must not appear in interactive source label: ${label}`,
      );
    }
  }
}

function assertNoForbiddenRuntimeSurfaces() {
  for (const [label, text] of [
    ["route", routeText],
    ["component", componentText],
    ["helper", helperText],
  ]) {
    for (const snippet of [
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
      "sqlite",
      ["graphql", "("].join(""),
      "recordProof",
      "createEvidence",
      "commitStateUpdate",
      "perspective:codex-former:capture-packet",
      "perspective:codex-former:validate-capture",
    ]) {
      assert(
        !text.includes(snippet),
        `${label} must not include forbidden surface: ${snippet}`,
      );
    }
  }
}

function assertDocsAndReports() {
  for (const phrase of [
    "Purpose",
    "Why Follows PR #520",
    "Hardening Scope",
    "Accessibility and Keyboard Traversal",
    "Denylist Control Detection",
    "Prepared-as-Waiting Copy",
    "Authority Flag Rendering",
    "Local Snapshot Availability vs Handoff Availability",
    "Responsive/Layout Hardening",
    "Browser Validation",
    "Static Smoke Hardening",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Future Work",
    "Recommended Next PR",
    "PASS with follow-up",
  ]) {
    assert(docText.includes(phrase), `doc must include ${phrase}`);
  }
  for (const phrase of [
    "Summary",
    "Why Follows PR #520",
    "Hardening Scope",
    "Accessibility and Keyboard Traversal",
    "Denylist Control Detection",
    "Prepared-as-Waiting Copy",
    "Authority Flag Rendering",
    "Local Snapshot Availability vs Handoff Availability",
    "Responsive/Layout Hardening",
    "Browser Validation",
    "Static Smoke Hardening",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]) {
    assert(reportText.includes(phrase), `report must include ${phrase}`);
  }
  assertIncludesAll(`${docText}\n${reportText}`, [
    "UI remains read-only",
    "fixture-backed only",
    "no helper execution",
    "no validate helper",
    "no Codex call",
    "no Codex SDK",
    "no provider/model API",
    "no GitHub API",
    "no network",
    "no DB",
    "no persistence",
    "no clipboard automation",
    "no accepted state",
    "no review decision",
    "no surface export to runtime/product state",
    "prepared state is still waiting for human-started Codex return",
    "prepare_helper_executed true is operational provenance only",
  ]);
}

function assertResponsiveCss() {
  assertIncludesAll(cssText, [
    "codex-former-adapter-snapshot-surface *",
    "overflow-wrap: anywhere",
    "codex-former-adapter-snapshot-handoff-boundary",
    "codex-former-adapter-snapshot-status-note",
    "@media (max-width: 1100px)",
    "@media (max-width: 760px)",
    "grid-template-columns: minmax(0, 1fr)",
  ]);
}

function assertBrowserReportCoverage() {
  assertIncludesAll(browserReportText, [
    "Browser / tool used",
    "Route load observations",
    "Session Panel scenario observations",
    "Inbox filter and selection observations",
    "Integration Readiness observations",
    "Denylist/action-control observations",
    "Keyboard traversal observations",
    "390px",
    "768px",
    "desktop width",
    "No console warnings/errors",
    "No provider/model/GitHub/Codex/OpenAI/external traffic was observed",
    "No fetch/XMLHttpRequest route behavior observed",
    "No localStorage/sessionStorage/clipboard path was exercised",
    "No raw prompt/source/packet/private marker text",
    "PASS",
  ]);
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
  for (const marker of [
    ["hidden", "reasoning"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["oauth", "token"].join("_"),
    ["sk", "proj"].join("-") + "-",
    ["gh", "p_"].join(""),
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public docs/reports/source must not echo raw unsafe marker ${marker}`,
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
    componentFile,
    helperFile,
    cssFile,
    implementationSmokeFile,
    hardeningDocFile,
    hardeningReportFile,
    hardeningBrowserReportFile,
    hardeningSmokeFile,
    hardeningBrowserSmokeFile,
  ]);

  for (const file of allChanged) {
    assert(
      allowed.has(file),
      `local adapter snapshot fixture surface hardening changed an out-of-scope file: ${file}`,
    );
  }
}

function collectInteractiveSourceLabels(source) {
  const labels = [];
  for (const match of source.matchAll(/<button[\s\S]*?<\/button>/g)) {
    labels.push(stripTags(match[0]).replace(/\s+/g, " ").trim());
    for (const aria of match[0].matchAll(/aria-label={(?:`([^`]+)`|\"([^\"]+)\")}/g)) {
      labels.push((aria[1] ?? aria[2] ?? "").replace(/\s+/g, " ").trim());
    }
  }
  for (const match of source.matchAll(/<a[\s\S]*?<\/a>/g)) {
    labels.push(stripTags(match[0]).replace(/\s+/g, " ").trim());
  }
  return labels.filter(Boolean);
}

function assertIncludesAll(text, expected) {
  for (const phrase of expected) {
    assert(text.includes(phrase), `expected text to include: ${phrase}`);
  }
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}
