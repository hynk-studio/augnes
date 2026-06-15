import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  report: "reports/2026-06-15-codex-augnes-self-test-dogfood.md",
  packageJson: "package.json",
  smoke: "scripts/smoke-codex-augnes-self-test-dogfood.mjs",
};

const report = readText(files.report);
const packageJson = JSON.parse(readText(files.packageJson));
const smokeSource = readText(files.smoke);

assertReportSections();
assertPromptCoverage();
assertMemoryFallbackCoverage();
assertConstraintCoverage();
assertManualValidationAndPersistenceCoverage();
assertForbiddenRuntimeArtifactsAbsent();
assertPackageScript();
assertSmokeIsReadOnly();

console.log("PASS smoke:codex-augnes-self-test-dogfood");

function assertReportSections() {
  assertIncludesAll(report, [
    "## Summary",
    "## Base Branch And Dependency On #574",
    "## Files Inspected",
    "## Static Verification Results",
    "## Perspective Memory Reuse Intake Fallback Results",
    "## English Trigger Self-Test Results",
    "## Korean Trigger Self-Test Results",
    "## Constraint Disclosure Self-Test Results",
    "## User-Liftable Constraints Observed",
    "## Non-Liftable Constraints Observed",
    "## Manual Codex App/Plugin Validation Result Or Unavailable Note",
    "## Fixes Made, If Any",
    "## Skipped Checks With Reasons",
    "## Remaining Caveats",
    "## Next Recommended PR",
  ]);
}

function assertPromptCoverage() {
  assertIncludesAll(report, [
    "Use Augnes for this task",
    "Set up Augnes in Codex",
    "Start with Augnes memory",
    "Review this PR with Augnes context",
    "Enable Augnes reuse",
    "Use Augnes context before editing",
    "Codex야 Augnes 설치해줘",
    "Codex야 Augnes 쓰자",
    "Augnes memory 보고 시작해",
    "Augnes reuse 켜줘",
    "Augnes context 붙여서 작업해줘",
    "아그네스 설치해줘",
    "아그네스 쓰자",
  ]);
}

function assertMemoryFallbackCoverage() {
  assertIncludesAll(report, [
    "Perspective Memory Reuse Intake",
    "perspective:memory-reuse-intake",
    "--brief",
    "persisted memory items selected: no",
    "selected memory IDs: none",
    "why_selected",
    "reuse_boundary",
    "quality_review_preview_summary",
    "store_read_zero_items",
    "This self-test does not require success only when persisted items exist.",
  ]);
}

function assertConstraintCoverage() {
  assertIncludesAll(report, [
    "user-liftable constraints",
    "non-liftable Codex/platform constraints",
    "/hooks review/trust remains manual",
    "static smoke cannot prove real hook loading or trust",
    "Plugin install does not prove real hook loading or trust",
    "--dangerously-bypass-hook-trust",
    "not used",
    "Real `~/.codex` writes",
    "real `~/.codex` writes",
    "dry-run-first installer behavior",
    "real install requires explicit `--yes`",
  ]);
}

function assertManualValidationAndPersistenceCoverage() {
  assertIncludesAll(report, [
    "Manual Codex app/plugin validation unavailable in this environment.",
    "did not restart Codex",
    "does not fake that validation",
    "zero persisted-item result is a valid self-test result",
    "No persisted perspective-memory items selected.",
    "Run actual manual Codex app/plugin validation if unavailable here.",
  ]);
}

function assertForbiddenRuntimeArtifactsAbsent() {
  for (const path of [
    "plugins/augnes-codex/hooks/hooks.json",
    "plugins/augnes-codex/hooks",
    "plugins/augnes-codex/.mcp.json",
  ]) {
    assert.equal(existsSync(path), false, `${path} must not exist`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:codex-augnes-self-test-dogfood"],
    "node scripts/smoke-codex-augnes-self-test-dogfood.mjs",
  );
}

function assertSmokeIsReadOnly() {
  assert.doesNotMatch(smokeSource, /process\.env\.HOME/, "smoke must not inspect HOME");
  assert.doesNotMatch(smokeSource, /\bos\.homedir\s*\(/, "smoke must not inspect real home");
  for (const token of [
    "write" + "FileSync",
    "append" + "FileSync",
    "mkdir" + "Sync",
    "rm" + "Sync",
    "rename" + "Sync",
    "copy" + "FileSync",
    "exec" + "Sync",
    "spawn" + "Sync",
  ]) {
    assert.equal(smokeSource.includes(token), false, `smoke must not reference ${token}`);
  }
}

function readText(filePath) {
  assert.equal(existsSync(filePath), true, `${filePath} must exist`);
  return readFileSync(filePath, "utf8");
}

function assertIncludesAll(text, expectedValues) {
  const normalizedText = normalizeWhitespace(text);
  for (const expected of expectedValues) {
    assert.ok(
      normalizedText.includes(normalizeWhitespace(expected)),
      `Expected text to include ${expected}`,
    );
  }
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
