import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import fixtureSurfaceHelper from "../lib/perspective-ingest/codex-former-constellation-preview-fixture-surface.ts";

const { validateCodexFormerConstellationPreviewSurfaceData } =
  fixtureSurfaceHelper;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/constellation-preview-fixture/page.tsx";
const componentFile =
  "components/codex-former-constellation-preview-fixture.tsx";
const helperFile =
  "lib/perspective-ingest/codex-former-constellation-preview-fixture-surface.ts";
const cssFile = "app/globals.css";
const implementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const implementationReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-preview-fixture-surface-implementation.md";
const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-constellation-preview-fixture-surface.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-constellation-preview-fixture-surface-implementation.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-constellation-preview-fixture-surface.mjs";
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
const reportText = readFileSync(implementationReportFile, "utf8");
const passFixture = JSON.parse(readFileSync(passFixtureFile, "utf8"));
const blockedFixture = JSON.parse(readFileSync(blockedFixtureFile, "utf8"));

assertPackageScripts();
assertFilesExist();
assertFixtureImports();
assertFixtureSemantics();
assertSurfaceSource();
assertValidationHelper();
assertDocsAndReport();
assertNoForbiddenBehavior();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the implementation smoke",
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-constellation-preview-fixture-surface"
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
    smokeFile,
    browserSmokeFile,
    passFixtureFile,
    blockedFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertFixtureImports() {
  assertIncludesAll(routeText, [
    "2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json",
    "2026-06-10-codex-former-constellation-preview-data-blocked.json",
    "pass-with-follow-up",
    "blocked",
  ]);
}

function assertFixtureSemantics() {
  const passNodeIds = passFixture.graph.nodes.map((node) => node.id);
  const blockedNodeIds = blockedFixture.graph.nodes.map((node) => node.id);

  for (const nodeId of [
    "node:review_candidate",
    "node:worker_guidance",
    "node:next_action:1",
  ]) {
    assert(passNodeIds.includes(nodeId), `PASS fixture must include ${nodeId}`);
    assert(!blockedNodeIds.includes(nodeId), `BLOCKED fixture must omit ${nodeId}`);
  }

  assert.equal(
    passFixture.summary_panel.primary_status_label,
    "PASS with follow-up",
  );
  assert.equal(blockedFixture.summary_panel.primary_status_label, "BLOCKED");
  assert.equal(passFixture.summary_panel.is_accepted_state, false);
  assert.equal(blockedFixture.summary_panel.is_accepted_state, false);
  assert.equal(passFixture.authority_lens.default_enabled, false);
  assert.equal(blockedFixture.authority_lens.default_enabled, false);
  assert.equal(passFixture.warning_panel.default_collapsed, true);
  assert.equal(blockedFixture.warning_panel.default_collapsed, false);

  for (const fixture of [passFixture, blockedFixture]) {
    for (const node of fixture.graph.nodes) {
      assert(
        node.badges.length <= 2,
        `${fixture.summary_panel.primary_status_label} node ${node.id} must have at most two badges`,
      );
    }
    const nodeIds = new Set(fixture.graph.nodes.map((node) => node.id));
    for (const edge of fixture.graph.edges) {
      assert(nodeIds.has(edge.from), `${edge.id} must reference existing from node`);
      assert(nodeIds.has(edge.to), `${edge.id} must reference existing to node`);
    }
  }

  for (const node of passFixture.graph.nodes) {
    assert.doesNotMatch(
      node.label.toLowerCase(),
      /\b(accepted|final|committed)\b/,
      `PASS default graph node label must not imply accepted/final/committed state: ${node.label}`,
    );
  }
}

function assertSurfaceSource() {
  assertIncludesAll(componentText, [
    "Summary Strip",
    "Graph Canvas",
    "Warning Panel",
    "Authority Lens",
    "Detail Panel",
    "Legend",
    "data-augnes-region=\"summary-strip\"",
    "data-augnes-region=\"graph-canvas\"",
    "data-augnes-region=\"warning-panel\"",
    "data-augnes-region=\"authority-lens\"",
    "data-augnes-region=\"detail-panel\"",
    "data-augnes-region=\"legend\"",
    "setAuthorityOpen(Boolean(nextFixture?.previewData.authority_lens.default_enabled))",
    "open={authorityOpen}",
    "node.badges.slice(0, 2)",
    "No fixture selected",
  ]);
  assertIncludesAll(cssText, [
    ".codex-former-summary-strip",
    ".codex-former-graph-canvas",
    ".codex-former-warning-panel",
    ".codex-former-authority-lens",
    ".codex-former-detail-panel",
    ".codex-former-legend",
    ".tone-warning",
    ".tone-blocked",
    ":focus-visible",
  ]);
}

function assertValidationHelper() {
  assertIncludesAll(helperText, [
    "CODEX_FORMER_CONSTELLATION_PREVIEW_VERSION",
    "validateCodexFormerConstellationPreviewSurfaceData",
    "unsupported preview_version",
    "invalid graph edge reference",
    "getCodexFormerPreviewDrawerById",
  ]);

  const unsupported = validateCodexFormerConstellationPreviewSurfaceData({
    preview_version: "unsupported.v9",
    graph: { nodes: [{ id: "node:a" }], edges: [] },
  });
  assert.equal(unsupported.valid, false);
  assert(
    unsupported.errors.some((error) => error.includes("unsupported preview_version")),
    "validation helper must reject unsupported preview_version",
  );

  const invalidEdge = validateCodexFormerConstellationPreviewSurfaceData({
    preview_version: "codex_former_constellation_preview_data.v0.1",
    graph: {
      nodes: [{ id: "node:a" }],
      edges: [{ id: "edge:a-b", from: "node:a", to: "node:b" }],
    },
  });
  assert.equal(invalidEdge.valid, false);
  assert(
    invalidEdge.errors.some((error) =>
      error.includes("invalid graph edge reference"),
    ),
    "validation helper must reject invalid edge references",
  );
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #502",
    "Surface Is Read-Only",
    "Fixture Inputs",
    "Route / Surface Path",
    "Summary Strip Implementation",
    "Graph Canvas Implementation",
    "Warning Panel Implementation",
    "Authority Lens Implementation",
    "Detail Drawer / Details Panel Implementation",
    "Legend Implementation",
    "PASS with follow-up Behavior",
    "BLOCKED Behavior",
    "Accessibility Notes",
    "Browser/Computer-Use Validation",
    "Privacy Boundary",
    "Authority Boundary",
    "Known Caveats",
    "Recommended Next PR",
    "Design Codex Session Perspective Panel fixture surface",
    "Conclusion: PASS with follow-up",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #502",
    "Implementation Scope",
    "Route / Surface Path",
    "Fixture Inputs",
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
}

function assertNoForbiddenBehavior() {
  const implementationText = `${routeText}\n${componentText}\n${helperText}`;
  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "navigator.clipboard",
    "fetch(",
    "XMLHttpRequest",
    "responses.create",
    "openai.chat",
    "createClient(",
    "better-sqlite3",
    "sqlite",
    "graphql(",
    "approve",
    "merge(",
    "deploy(",
    "recordProof",
    "createEvidence",
    "readiness",
  ]) {
    assert.equal(
      implementationText.includes(forbidden),
      false,
      `implementation must not introduce forbidden behavior: ${forbidden}`,
    );
  }

  for (const flag of [
    "no_accepted_state",
    "no_db_write",
    "no_provider_call",
    "no_codex_sdk_call",
    "no_github_mutation",
    "no_core_decision",
  ]) {
    assert(
      passFixture.authority_lens.tags.includes(flag) ||
        blockedFixture.authority_lens.tags.includes(flag),
      `Authority Lens tags must include ${flag}`,
    );
  }
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}\n${componentText}`;
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
      `fixture surface implementation changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `fixture surface implementation must not touch forbidden runtime surface: ${changedFile}`,
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
