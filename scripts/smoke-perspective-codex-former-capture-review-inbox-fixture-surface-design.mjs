import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-capture-review-inbox-fixture-surface-design.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-capture-review-inbox-fixture-surface-design.mjs";
const sessionImplementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const constellationImplementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const passFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
const blockedFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(designDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");

assertPackageScript();
assertFilesExist();
assertDesignDocContent();
assertReportContent();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-capture-review-inbox-fixture-surface-design",
);

function assertPackageScript() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-capture-review-inbox-fixture-surface-design"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register capture review inbox fixture surface design smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    designDocFile,
    reportFile,
    smokeFile,
    sessionImplementationDocFile,
    constellationImplementationDocFile,
    passFixtureFile,
    blockedFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertDesignDocContent() {
  assertIncludesAll(docText, [
    "Capture Review Inbox",
    "Why Follows PR #505",
    sessionImplementationDocFile,
    constellationImplementationDocFile,
    passFixtureFile,
    blockedFixtureFile,
    "Relationship To Existing Surfaces",
    "Session Perspective Panel is single-work/session workflow status",
    "Constellation Preview is graph/relationship inspection",
    "Capture Review Inbox is multi-item triage and review queue",
    "Item A: Pending preparation",
    "Item B: Waiting for returned candidate",
    "Item C: Reviewable PASS with follow-up",
    "Item D: BLOCKED returned material",
    "Item E: Empty inbox",
    "Inbox Header",
    "Filter / Group Bar",
    "Review Item List",
    "Selected Item Summary",
    "Warning / Blocking Triage",
    "Authority Boundary Box",
    "Safe Next Actions",
    "Empty / Invalid State",
    "Display Density Policy",
    "Reviewability Taxonomy",
    "Accessibility And Keyboard Plan",
    "Browser/Computer-Use Validation Plan",
    "This PR is design-only",
    "implements no UI",
    "adds no route",
    "adds no runtime browser surface",
    "no accepted Augnes state",
    "no proof/evidence/readiness creation",
    "no provider/model calls",
    "no Codex SDK calls",
    "no DB writes",
    "no GitHub mutation",
    "no clipboard automation",
    "no approval/merge/deploy/Core decision",
    "no live Codex capture",
    "no runtime fixture mutation",
    "review decision records",
    "accept/promote/reject actions",
    "Immediate next PR",
    "Add read-only Capture Review Inbox fixture implementation",
    "Conclusion",
    "PASS with follow-up",
  ]);

  for (const taxonomyValue of [
    "empty",
    "not_ready",
    "waiting",
    "reviewable_with_follow_up",
    "blocked",
    "invalid_data",
  ]) {
    assert(
      docText.includes(taxonomyValue),
      `reviewability taxonomy must include ${taxonomyValue}`,
    );
  }

  assertIncludesAll(docText, [
    "render Empty inbox",
    "render Pending preparation item",
    "render Waiting item",
    "render PASS with follow-up item",
    "render BLOCKED item",
    "verify no approve/promote/reject controls",
    "verify no executable prepare/validate/Codex/GitHub/DB controls",
    "verify no external network/provider/Codex/GitHub/DB traffic",
  ]);
}

function assertReportContent() {
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #505",
    "Design Scope",
    "Relationship to Session Panel and Constellation Preview",
    "Fixture Item Types",
    "Inbox Regions",
    "Reviewability Taxonomy",
    "PASS with follow-up Inbox Behavior",
    "BLOCKED Inbox Behavior",
    "Pending / Waiting Inbox Behavior",
    "Empty Inbox Behavior",
    "Accessibility and Browser Validation Plan",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
    "Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.",
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
      `capture review inbox public docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  for (const phrase of [
    "no accepted Augnes state",
    "no proof/evidence/readiness creation",
    "no provider/model calls",
    "no Codex SDK calls",
    "no DB writes",
    "no GitHub mutation",
    "no clipboard automation",
    "no approval/merge/deploy/Core decision",
    "no live Codex capture",
    "no runtime fixture mutation",
  ]) {
    assert(
      docText.includes(phrase),
      `design boundary text must include: ${phrase}`,
    );
  }

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
      `capture review inbox smoke must not introduce forbidden implementation surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    designDocFile,
    reportFile,
    smokeFile,
  ]);

  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `capture review inbox fixture surface design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `capture review inbox design must stay docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `capture review inbox design must not touch runtime, UI, DB, app, component, lib, or schema surfaces: ${changedFile}`,
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
