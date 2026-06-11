import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-session-perspective-panel-fixture-surface-design.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-session-perspective-panel-fixture-surface-design.mjs";
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

assert.equal(existsSync(designDocFile), true, `${designDocFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(constellationImplementationDocFile), true);
assert.equal(existsSync(passFixtureFile), true);
assert.equal(existsSync(blockedFixtureFile), true);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-session-perspective-panel-fixture-surface-design"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register the session perspective panel fixture surface design smoke",
);

assertDesignDoc();
assertReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-session-perspective-panel-fixture-surface-design",
);

function assertDesignDoc() {
  assertContainsAll(docText, [
    "Perspective Codex Former Session Perspective Panel Fixture Surface Design v0.1",
    "Purpose",
    "Why Follows PR #503",
    "Product Thesis",
    "Relationship to Constellation Preview",
    "Fixture Inputs And Scenarios",
    "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json",
    "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json",
    "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md",
    "Session Header",
    "Formation Timeline",
    "Status Card",
    "Evidence / Provenance Strip",
    "Warning / Blocking Summary",
    "Authority Boundary Box",
    "Action Guidance",
    "Constellation Handoff Preview",
    "Scenario A: Not prepared",
    "Scenario B: Prepared, waiting for returned Codex candidate",
    "Scenario C: PASS with follow-up",
    "Scenario D: BLOCKED",
    "Display Density Policy",
    "PASS with follow-up Panel Behavior",
    "BLOCKED Panel Behavior",
    "Not Prepared Panel Behavior",
    "Waiting For Candidate Panel Behavior",
    "Accessibility And Keyboard Plan",
    "Browser/Computer-Use Validation Plan",
    "Privacy And Redaction",
    "Authority Boundary",
    "Future Implementation Sequence",
    "Add read-only Codex Session Perspective Panel fixture implementation",
    "Conclusion",
    "PASS with follow-up",
  ]);

  assertContainsAll(docText, [
    "This PR is design-only.",
    "implements no UI",
    "adds no route",
    "runtime browser surface",
    "accepted Augnes state",
    "proof/evidence/readiness records",
    "provider/model calls",
    "Codex SDK calls",
    "DB writes",
    "GitHub mutations",
    "clipboard automation",
    "approvals",
    "merges",
    "deploys",
    "Core decisions",
  ]);

  assertContainsAll(docText, [
    "source_input_hash",
    "source_prompt_hash",
    "metadata_match",
    "candidate_count",
    "review_only",
    "non_committed",
    "advisory_only",
    "no_accepted_state",
    "no_db_write",
    "no_provider_call",
    "no_codex_sdk_call",
    "no_github_mutation",
    "no_core_decision",
    "no raw unsafe/private markers",
    "no external network/provider/Codex/GitHub/DB traffic",
  ]);
}

function assertReport() {
  assertContainsAll(reportText, [
    "Summary",
    "Why Follows PR #503",
    "Design Scope",
    "Relationship to Constellation Preview",
    "Fixture Scenarios",
    "Panel Regions",
    "PASS with follow-up Panel Behavior",
    "BLOCKED Panel Behavior",
    "Not Prepared Panel Behavior",
    "Waiting For Candidate Panel Behavior",
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
      `session panel public docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  const publicText = `${docText}\n${reportText}`;
  for (const phrase of [
    "does not implement UI",
    "adds no route",
    "no runtime browser surface",
    "no DB persistence",
    "no provider/model calls",
    "no Codex SDK calls",
    "no GitHub mutation",
    "no clipboard automation",
  ]) {
    assert(
      publicText.includes(phrase),
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
      `session panel smoke must not introduce forbidden implementation surface ${snippet}`,
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
      `session panel fixture surface design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `session panel design must stay docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `session panel design must not touch runtime, UI, DB, app, component, or schema surfaces: ${changedFile}`,
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

function assertContainsAll(text, requiredPhrases) {
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
