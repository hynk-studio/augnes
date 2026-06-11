import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import surfaceFixture from "../lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts";

const {
  filterLocalAdapterSnapshotInboxItems,
  validateCodexFormerLocalAdapterSnapshotFixtureSurface,
} = surfaceFixture;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx";
const componentFile =
  "components/codex-former-local-adapter-snapshot-fixture.tsx";
const helperFile =
  "lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts";
const cssFile = "app/globals.css";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation.md";
const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-snapshot-fixture-surface.mjs";
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
const sessionFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json";
const inboxFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json";
const readinessFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");
const sessionViewModels = JSON.parse(readFileSync(sessionFixtureFile, "utf8"));
const inboxViewModels = JSON.parse(readFileSync(inboxFixtureFile, "utf8"));
const readiness = JSON.parse(readFileSync(readinessFixtureFile, "utf8"));

assertPackageScripts();
assertFilesExist();
assertRouteImportsCommittedFixtures();
assertHelperValidation();
assertComponentSource();
assertFixtureSemantics();
assertDocsAndReports();
assertNoForbiddenBrowserOrRuntimeSurfaces();
assertNoForbiddenControls();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-local-adapter-snapshot-fixture-surface"
    ],
    `node ${browserSmokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    helperFile,
    docFile,
    reportFile,
    browserReportFile,
    smokeFile,
    browserSmokeFile,
    sessionFixtureFile,
    inboxFixtureFile,
    readinessFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertRouteImportsCommittedFixtures() {
  assertIncludesAll(routeText, [
    "CodexFormerLocalAdapterSnapshotFixtureSurface",
    "validateCodexFormerLocalAdapterSnapshotFixtureSurface",
    "2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json",
    "2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json",
    "2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json",
  ]);
  assert.equal(routeText.includes("readFile"), false);
  assert.equal(routeText.includes("process.argv"), false);
}

function assertHelperValidation() {
  assertIncludesAll(helperText, [
    "validateCodexFormerLocalAdapterSnapshotFixtureSurface",
    "expected exactly 3 session scenarios",
    "expected exactly 3 inbox items",
    "prepared scenario status must stay waiting for Codex return",
    "prepared inbox item must remain waiting",
    "reviewable count must remain 0",
    "readiness fixture must include UI status and browser matrix",
    "filterLocalAdapterSnapshotInboxItems",
  ]);
  const result = validateCodexFormerLocalAdapterSnapshotFixtureSurface({
    sessionViewModels,
    inboxViewModels,
    readiness,
  });
  assert.deepEqual(result, { valid: true, errors: [] });
}

function assertComponentSource() {
  assertIncludesAll(componentText, [
    "Session Panel Preview",
    "Capture Review Inbox Preview",
    "Integration Readiness",
    "useState",
    "selectedScenarioId",
    "selectedFilter",
    "selectedItemId",
    "openDetails",
    "filterLocalAdapterSnapshotInboxItems",
    "aria-pressed",
    "details",
    "summary",
    "candidate_count",
    "blocked_reason_count",
    "reviewable count",
    "accepted state",
    "Constellation available",
    "validation available",
    "returned candidate available",
    "prepare_helper_executed",
    "operational provenance only",
    "raw prompt/source/packet content",
    "Prohibited Control Copy / Denylist",
  ]);
  assertIncludesAll(cssText, [
    "codex-former-adapter-snapshot-shell",
    "codex-former-adapter-snapshot-section-grid",
    "codex-former-adapter-snapshot-chip",
    "codex-former-adapter-snapshot-item",
    "codex-former-adapter-snapshot-readiness",
    "@media (max-width: 760px)",
  ]);
}

function assertFixtureSemantics() {
  assert.equal(sessionViewModels.scenarios.length, 3);
  assert.equal(inboxViewModels.items.length, 3);
  assert.deepEqual(
    sessionViewModels.scenarios.map((scenario) => scenario.snapshot_state),
    ["not_ready", "waiting", "prepared_waiting_for_codex_return"],
  );
  assert.deepEqual(inboxViewModels.filters, [
    "all",
    "not_ready",
    "waiting",
    "prepared",
  ]);

  const preparedScenario = sessionViewModels.scenarios.find(
    (scenario) =>
      scenario.scenario_id === "prepared-waiting-for-codex-return",
  );
  assert.equal(
    preparedScenario.primary_status_label,
    "Prepared, waiting for Codex return",
  );
  assert.equal(
    preparedScenario.caveat_label,
    "Manual Codex return has not been captured.",
  );
  assert.equal(
    preparedScenario.next_safe_action_label,
    "Use the generated prompt/manual copy packet in a separate user-started Codex session, then return exactly one candidate envelope.",
  );
  assert.equal(preparedScenario.accepted_state, false);
  assert.equal(preparedScenario.handoff_status.constellation_available, false);
  assert.equal(preparedScenario.handoff_status.validation_available, false);
  assert.equal(preparedScenario.handoff_status.returned_candidate_available, false);
  assert.equal(
    preparedScenario.authority_summary
      .prepare_helper_executed_operational_only,
    true,
  );

  const preparedItem = inboxViewModels.items.find(
    (item) => item.item_id === "local-adapter-prepared-waiting-for-codex-return",
  );
  assert.equal(preparedItem.reviewability, "waiting");
  assert.equal(preparedItem.candidate_count, 0);
  assert.equal(preparedItem.blocked_reason_count, 0);
  assert.equal(preparedItem.safe_links.constellation_preview.available, false);
  assert.equal(inboxViewModels.counts.reviewable, 0);

  assert.equal(
    filterLocalAdapterSnapshotInboxItems(inboxViewModels.items, "all").length,
    3,
  );
  assert.deepEqual(
    filterLocalAdapterSnapshotInboxItems(inboxViewModels.items, "not_ready").map(
      (item) => item.snapshot_state,
    ),
    ["not_ready"],
  );
  assert.deepEqual(
    filterLocalAdapterSnapshotInboxItems(inboxViewModels.items, "waiting").map(
      (item) => item.snapshot_state,
    ),
    ["waiting", "prepared_waiting_for_codex_return"],
  );
  assert.deepEqual(
    filterLocalAdapterSnapshotInboxItems(inboxViewModels.items, "prepared").map(
      (item) => item.snapshot_state,
    ),
    ["prepared_waiting_for_codex_return"],
  );
}

function assertDocsAndReports() {
  for (const phrase of [
    "Purpose",
    "Why Follows PR #519",
    "Implementation Scope",
    "Route / Surface Path",
    "Fixture Inputs",
    "Session Panel Preview",
    "Capture Review Inbox Preview",
    "Integration Readiness Section",
    "Interaction Behavior",
    "Copy and Density Handling",
    "Accessibility Notes",
    "Browser/Computer-Use Validation",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Future Work",
    "Recommended Next PR",
    "Conclusion",
    "PASS with follow-up",
  ]) {
    assert(docText.includes(phrase), `doc must include ${phrase}`);
  }
  for (const phrase of [
    "Summary",
    "Why Follows PR #519",
    "Implementation Scope",
    "Route / Surface Path",
    "Fixture Inputs",
    "Session Panel Preview Result",
    "Capture Review Inbox Preview Result",
    "Integration Readiness Result",
    "Interaction Behavior",
    "Accessibility Notes",
    "Browser/Computer-Use Validation",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]) {
    assert(reportText.includes(phrase), `report must include ${phrase}`);
  }
  assertIncludesAll(`${docText}\n${reportText}\n${browserReportText}`, [
    "/cockpit/perspective/codex-former/local-adapter-snapshot-fixture",
    "read-only",
    "fixture-backed",
    "local-only",
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

function assertNoForbiddenBrowserOrRuntimeSurfaces() {
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
    ]) {
      assert(
        !text.includes(snippet),
        `${label} must not include forbidden surface: ${snippet}`,
      );
    }
  }
}

function assertNoForbiddenControls() {
  const buttonLabels = [
    ...componentText.matchAll(/<button[\s\S]*?>([\s\S]*?)<\/button>/g),
  ].map((match) => stripTags(match[1]).replace(/\s+/g, " ").trim());
  const forbidden = [
    "Accept",
    "Approve",
    "Promote",
    "Reject",
    "Merge",
    "Deploy",
    "Validate",
    "Run Codex",
  ];
  for (const label of buttonLabels) {
    for (const term of forbidden) {
      assert(
        !label.includes(term),
        `button/control label must not include forbidden copy ${term}: ${label}`,
      );
    }
    assert(
      !label.includes("PASS") && !label.includes("BLOCKED"),
      `button/control label must not imply PASS/BLOCKED: ${label}`,
    );
  }
  assert.equal(componentText.includes("worker_guidance"), false);
  assert.equal(componentText.includes("review_candidate"), false);
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
    routeFile,
    componentFile,
    helperFile,
    cssFile,
    docFile,
    reportFile,
    browserReportFile,
    smokeFile,
    browserSmokeFile,
    hardeningDocFile,
    hardeningReportFile,
    hardeningBrowserReportFile,
    hardeningSmokeFile,
    hardeningBrowserSmokeFile,
  ]);

  for (const file of allChanged) {
    assert(
      allowed.has(file),
      `local adapter snapshot fixture surface changed an out-of-scope file: ${file}`,
    );
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
