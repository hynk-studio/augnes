import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md";
const designReportFile =
  "reports/2026-06-10-perspective-codex-former-product-surface-design.md";
const designSmokeFile =
  "scripts/smoke-perspective-codex-former-product-surface-design.mjs";
const manualWorkflowDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md";
const sourceInputTemplateDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md";
const workflowCloseoutDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md";
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
const constellationProjectionModuleFile =
  "lib/perspective-ingest/perspective-codex-former-constellation-projection.ts";
const constellationProjectionDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md";
const constellationProjectionReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-projection.md";
const constellationProjectionSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-projection.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  designDocFile,
  designReportFile,
  designSmokeFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
  captureHelperSmokeFile,
  workflowCloseoutSmokeFile,
  constellationProjectionModuleFile,
  constellationProjectionDocFile,
  constellationProjectionReportFile,
  constellationProjectionSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const designDocText = readFileSync(designDocFile, "utf8");
const designReportText = readFileSync(designReportFile, "utf8");
const designSmokeText = readFileSync(designSmokeFile, "utf8");

assert.equal(existsSync(designDocFile), true, `${designDocFile} must exist`);
assert.equal(
  existsSync(designReportFile),
  true,
  `${designReportFile} must exist`,
);
assert.equal(
  existsSync(designSmokeFile),
  true,
  `${designSmokeFile} must exist`,
);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-product-surface-design"],
  `${expectedTsxCommand} ${designSmokeFile}`,
  "package.json must register the product-surface design smoke",
);

assertDesignDoc();
assertDesignReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-product-surface-design");

function assertDesignDoc() {
  assertContainsAll(designDocText, [
    "Perspective Codex Former Product Surface Design v0.1",
    "first product-surface direction",
    "manual workflow closeout from PR #497",
    "PR #492",
    "PR #493",
    "PR #494",
    "PR #495",
    "PR #496",
    "PR #497",
    "This PR is design-only.",
    "Product Thesis",
    "Codex performs work, Augnes captures and validates the perspective candidate",
    "the constellation UI shows how the candidate relates",
    "to work, source input, validation, warnings, and next actions.",
    "Codex Session Perspective Panel",
    "Capture Review Inbox",
    "Constellation Preview",
    "Node Model",
    "`work`",
    "`source_input`",
    "`manual_copy_packet`",
    "`codex_session`",
    "`candidate_draft`",
    "`validation_summary`",
    "`review_candidate`",
    "`warning`",
    "`worker_guidance`",
    "`next_action`",
    "Edge Model",
    "`prepared`",
    "`pasted_by_human`",
    "`returned`",
    "`validated`",
    "`informs`",
    "`suggests`",
    "`pointer_only`",
    "`blocked_by`",
    "Display Density Policy",
    "The UI must not show every authority flag as full text on every node and edge by default.",
    "default view: compact node label, status, and at most two badges",
    "hover/focus view: short validation and caveat summary",
    "detail drawer: full provenance, hashes, authority flags, warnings, candidate",
    "show at most two badges by default",
    "Authority Lens",
    "PASS with follow-up",
    "Example 1: PASS with follow-up",
    "Example 2: BLOCKED",
    "Browser/Computer-Use Validation Plan",
    "Stop Condition For Further Dogfood",
    "Product-Surface Entry Criteria",
    "Conclusion: PASS with follow-up",
    workflowCloseoutDocFile,
    manualWorkflowDocFile,
    sourceInputTemplateDocFile,
    "scripts/perspective-codex-former-capture-helper.mjs",
    "scripts/smoke-perspective-codex-former-capture-helper.mjs",
    "reports/2026-06-10-perspective-codex-former-workflow-closeout.md",
    "reports/2026-06-10-perspective-codex-former-source-input-hardening.md",
    "reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md",
  ]);

  assertContainsAll(designDocText, [
    "does not create accepted Augnes state",
    "proof/evidence/readiness records",
    "provider/model calls",
    "Codex SDK calls",
    "DB writes",
    "GitHub mutations",
    "UI implementation",
    "approvals",
    "merges",
    "deploys",
    "Core decisions",
    "accepted` only as a future state, not used by the current workflow",
    "missing or mismatched provenance blocks",
    "unsafe source-input markers block",
    "pointer warnings remain visible",
    "browser/computer-use validation plan exists for any UI",
    "UI must not imply accepted state",
  ]);
}

function assertDesignReport() {
  assertContainsAll(designReportText, [
    "Perspective Codex Former Product Surface Design",
    "Conclusion: PASS with follow-up.",
    "Summary",
    "Why Follows PR #497",
    "Design Scope",
    "Product Thesis",
    "Surfaces",
    "Node/Edge Model",
    "Authority Display Policy",
    "Browser Validation Plan",
    "Verification",
    "Skipped Checks",
    "What Codex Did Not Do",
    "no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${designDocText}\n${designReportText}`;
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
      `product-surface public docs/report must not echo raw unsafe marker ${marker}`,
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
    "navigator" + ".clipboard",
    "commit" + "StateUpdate(",
    "sql" + "ite",
    "better" + "-sql" + "ite3",
  ]) {
    assert.equal(
      designSmokeText.includes(snippet),
      false,
      `product-surface smoke must not introduce forbidden surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `product-surface design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile === constellationProjectionModuleFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `product-surface design must stay docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        (!changedFile.startsWith("lib/") ||
          changedFile === constellationProjectionModuleFile) &&
        !changedFile.startsWith("migrations/") &&
        changedFile !== "scripts/perspective-codex-former-capture-helper.mjs",
      `product-surface design must not change runtime, helper, route, UI, or schema surfaces: ${changedFile}`,
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
    const normalizedSnippet = normalizeWhitespace(snippet);
    assert(
      normalizedValue.includes(normalizedSnippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
