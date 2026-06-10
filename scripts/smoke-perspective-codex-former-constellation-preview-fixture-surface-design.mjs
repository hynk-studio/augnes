import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const surfaceDesignDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_DESIGN_V0_1.md";
const surfaceDesignReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-preview-fixture-surface-design.md";
const surfaceDesignSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-preview-fixture-surface-design.mjs";
const manualWorkflowDocsSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-workflow-docs.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const separateSessionPrepSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const separateSessionCaptureSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs";
const captureHelperSmokeFile =
  "scripts/smoke-perspective-codex-former-capture-helper.mjs";
const workflowCloseoutSmokeFile =
  "scripts/smoke-perspective-codex-former-workflow-closeout.mjs";
const productSurfaceDesignSmokeFile =
  "scripts/smoke-perspective-codex-former-product-surface-design.mjs";
const constellationProjectionSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-projection.mjs";
const fixturePreviewSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-fixture-preview.mjs";
const previewDataAdapterSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-preview-data-adapter.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  surfaceDesignDocFile,
  surfaceDesignReportFile,
  surfaceDesignSmokeFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
  captureHelperSmokeFile,
  workflowCloseoutSmokeFile,
  productSurfaceDesignSmokeFile,
  constellationProjectionSmokeFile,
  fixturePreviewSmokeFile,
  previewDataAdapterSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(surfaceDesignDocFile, "utf8");
const reportText = readFileSync(surfaceDesignReportFile, "utf8");
const smokeText = readFileSync(surfaceDesignSmokeFile, "utf8");

assert.equal(existsSync(surfaceDesignDocFile), true, `${surfaceDesignDocFile} must exist`);
assert.equal(
  existsSync(surfaceDesignReportFile),
  true,
  `${surfaceDesignReportFile} must exist`,
);
assert.equal(
  existsSync(surfaceDesignSmokeFile),
  true,
  `${surfaceDesignSmokeFile} must exist`,
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-constellation-preview-fixture-surface-design"
  ],
  `${expectedTsxCommand} ${surfaceDesignSmokeFile}`,
  "package.json must register the fixture surface design smoke",
);

assertDesignDoc();
assertReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-constellation-preview-fixture-surface-design",
);

function assertDesignDoc() {
  assertContainsAll(docText, [
    "Perspective Codex Former Constellation Preview Fixture Surface Design v0.1",
    "Purpose",
    "Why Follows PR #501",
    "Surface Thesis",
    "Input Data Dependency",
    "lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts",
    "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_V0_1.md",
    "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json",
    "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json",
    "Summary Strip",
    "Graph Canvas",
    "Warning Panel",
    "Authority Lens",
    "Detail Drawer",
    "Legend",
    "PASS with follow-up Fixture",
    "BLOCKED Fixture",
    "Progressive Disclosure",
    "Badge And Tone Policy",
    "Empty And Error States",
    "Accessibility And Keyboard Plan",
    "Browser/Computer-Use Validation Plan",
    "Privacy And Redaction",
    "Authority Boundary",
    "Future Implementation Sequence",
    "Add read-only Constellation Preview fixture surface implementation",
    "Conclusion: PASS with follow-up",
  ]);
  assertContainsAll(docText, [
    "This PR is design-only.",
    "implements no UI",
    "no route",
    "runtime browser surface",
    "accepted Augnes state",
    "proof/evidence/readiness records",
    "provider/model calls",
    "Codex SDK calls",
    "DB writes",
    "GitHub mutations",
    "approvals",
    "merges",
    "deploys",
    "Core decisions",
  ]);
  assertContainsAll(docText, [
    "No fixture loaded",
    "Invalid preview data",
    "Missing graph nodes",
    "Edge references missing node",
    "Unsupported `preview_version`",
    "Blocked fixture",
    "Privacy/sanitization omission present",
    "keyboard traversal",
    "Browser/computer-use screenshots against PASS and BLOCKED fixtures",
  ]);
}

function assertReport() {
  assertContainsAll(reportText, [
    "Summary",
    "Why Follows PR #501",
    "Surface Design Scope",
    "Input Fixture Dependencies",
    "Surface Regions",
    "PASS with follow-up Surface Behavior",
    "BLOCKED Surface Behavior",
    "Progressive Disclosure",
    "Accessibility and Browser Validation Plan",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
    "no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}`;
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
      `surface design public docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "node:" + "http",
    "node:" + "https",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "navigator" + ".clipboard",
    "commit" + "StateUpdate(",
    "better" + "-sql" + "ite3",
    "createClient" + "(",
    "graphql" + "(",
    "app" + "/api/",
  ]) {
    assert.equal(
      smokeText.includes(snippet),
      false,
      `surface design smoke must not introduce forbidden surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `surface design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `surface design must stay docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        changedFile !== "scripts/perspective-codex-former-capture-helper.mjs",
      `surface design must not change runtime, helper, route, UI, DB, or schema surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "--diff-filter=ACMR"]);
  const stagedFiles = gitLines([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
  ]);
  const branchFiles = gitLines([
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    "origin/main...HEAD",
  ]);
  const untrackedFiles = gitLines([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);

  return [
    ...new Set([
      ...workingTreeFiles,
      ...stagedFiles,
      ...branchFiles,
      ...untrackedFiles,
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertContainsAll(value, expectedSnippets) {
  const normalizedValue = normalizeWhitespace(value);
  for (const snippet of expectedSnippets) {
    assert(
      normalizedValue.includes(normalizeWhitespace(snippet)),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
