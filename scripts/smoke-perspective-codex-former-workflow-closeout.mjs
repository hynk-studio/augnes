import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const closeoutDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md";
const closeoutReportFile =
  "reports/2026-06-10-perspective-codex-former-workflow-closeout.md";
const closeoutSmokeFile =
  "scripts/smoke-perspective-codex-former-workflow-closeout.mjs";
const manualWorkflowDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md";
const sourceInputTemplateDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md";
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
const productSurfaceDesignDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md";
const productSurfaceDesignReportFile =
  "reports/2026-06-10-perspective-codex-former-product-surface-design.md";
const productSurfaceDesignSmokeFile =
  "scripts/smoke-perspective-codex-former-product-surface-design.mjs";
const constellationProjectionModuleFile =
  "lib/perspective-ingest/perspective-codex-former-constellation-projection.ts";
const constellationProjectionDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md";
const constellationProjectionReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-projection.md";
const constellationProjectionSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-projection.mjs";
const fixturePreviewDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_V0_1.md";
const fixturePreviewReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-fixture-preview.md";
const fixturePreviewPassFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json";
const fixturePreviewBlockedFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-blocked.json";
const fixturePreviewDogfoodFile =
  "scripts/dogfood-perspective-codex-former-constellation-fixture-preview.mjs";
const fixturePreviewSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-fixture-preview.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  closeoutDocFile,
  closeoutReportFile,
  closeoutSmokeFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
  captureHelperSmokeFile,
  productSurfaceDesignDocFile,
  productSurfaceDesignReportFile,
  productSurfaceDesignSmokeFile,
  constellationProjectionModuleFile,
  constellationProjectionDocFile,
  constellationProjectionReportFile,
  constellationProjectionSmokeFile,
  fixturePreviewDocFile,
  fixturePreviewReportFile,
  fixturePreviewPassFixtureFile,
  fixturePreviewBlockedFixtureFile,
  fixturePreviewDogfoodFile,
  fixturePreviewSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const closeoutDocText = readFileSync(closeoutDocFile, "utf8");
const closeoutReportText = readFileSync(closeoutReportFile, "utf8");
const smokeText = readFileSync(closeoutSmokeFile, "utf8");

assert.equal(existsSync(closeoutDocFile), true, `${closeoutDocFile} must exist`);
assert.equal(
  existsSync(closeoutReportFile),
  true,
  `${closeoutReportFile} must exist`,
);
assert.equal(
  existsSync(closeoutSmokeFile),
  true,
  `${closeoutSmokeFile} must exist`,
);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-workflow-closeout"],
  `${expectedTsxCommand} ${closeoutSmokeFile}`,
  "package.json must register the workflow closeout smoke",
);

assertCloseoutDoc();
assertCloseoutReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-workflow-closeout");

function assertCloseoutDoc() {
  assertContainsAll(closeoutDocText, [
    "Perspective Codex Former Workflow Closeout v0.1",
    "This closes the current Codex Former manual capture workflow slice.",
    "local, manual, and review-only",
    "PR #492",
    "PR #493",
    "PR #494",
    "PR #495",
    "PR #496",
    "PASS with follow-up",
    manualWorkflowDocFile,
    sourceInputTemplateDocFile,
    "scripts/perspective-codex-former-capture-helper.mjs",
    "scripts/smoke-perspective-codex-former-capture-helper.mjs",
    "npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture --source-input /tmp/augnes-codex-former-capture/bounded-source-input.json --generated-at 2026-06-10T00:00:00.000Z",
    "npm run perspective:codex-former:validate-capture -- --envelope /tmp/augnes-codex-former-capture/returned-envelope.txt --metadata /tmp/augnes-codex-former-capture/codex-former-capture-metadata.json --summary-out /tmp/augnes-codex-former-capture/validation-summary.json",
    "Pointer warnings may remain and must be reviewed.",
    "needs_review",
    "non_committed",
    "Do not keep running more transcript dogfood",
    "just to reconfirm the same manual",
    "Product-Surface Entry Criteria",
    "the CLI/helper path is stable on `main`",
    "validate helper handles the exactly-one-candidate invariant",
    "missing or mismatched provenance blocks",
    "unsafe source-input markers block",
    "pointer warnings remain visible",
    "authority boundary is represented in output",
    "browser/computer-use validation plan exists for any UI",
    "Recommended next PR title:",
    "Start product-surface design for Codex Former capture review",
    "The next PR should be design-only",
    "unless the user explicitly asks to implement",
    "Conclusion: `PASS with follow-up`",
  ]);

  assertContainsAll(closeoutDocText, [
    "does not create accepted Augnes state",
    "proof records",
    "evidence",
    "readiness",
    "provider/model calls",
    "Codex SDK calls",
    "GitHub",
    "mutations",
    "DB writes",
    "UI",
    "approvals",
    "merges",
    "deploys",
    "Core decisions",
  ]);

  assert.equal(
    closeoutDocText.includes("```bash"),
    false,
    "closeout commands must be plain text lines, not fenced shell blocks",
  );
}

function assertCloseoutReport() {
  assertContainsAll(closeoutReportText, [
    "Perspective Codex Former Workflow Closeout",
    "Conclusion: PASS with follow-up.",
    "Why Follows PR #496",
    "Closeout Scope",
    "Current Operator Workflow",
    "Completed PR Chain",
    "Stop Condition For Further Dogfood",
    "Product-Surface Entry Criteria",
    "Authority Boundary",
    "Privacy/Redaction Handling",
    "Pointer Warning / needs_review Caveat",
    "Verification",
    "Skipped Checks With Reasons",
    "What Codex Did Not Do",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${closeoutDocText}\n${closeoutReportText}`;
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
      `closeout docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "app" + "/api/",
    "navigator" + ".clipboard",
    "sql" + "ite",
  ]) {
    assert.equal(
      smokeText.includes(snippet),
      false,
      `workflow closeout smoke must not introduce forbidden surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `workflow closeout changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile === constellationProjectionModuleFile ||
        changedFile === fixturePreviewDogfoodFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `workflow closeout must stay docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        (!changedFile.startsWith("lib/") ||
          changedFile === constellationProjectionModuleFile) &&
        changedFile !== "scripts/perspective-codex-former-capture-helper.mjs",
      `workflow closeout must not change runtime/helper surfaces: ${changedFile}`,
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
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}
