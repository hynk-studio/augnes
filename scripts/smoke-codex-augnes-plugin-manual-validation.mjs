import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  doc: "docs/CODEX_AUGNES_PLUGIN_MANUAL_VALIDATION.md",
  report: "reports/2026-06-15-codex-augnes-plugin-manual-validation-capture.md",
  packageJson: "package.json",
  smoke: "scripts/smoke-codex-augnes-plugin-manual-validation.mjs",
};

const docText = readText(files.doc);
const reportText = readText(files.report);
const packageJson = JSON.parse(readText(files.packageJson));
const smokeSource = readText(files.smoke);

assertRequiredSections();
assertStarterPrompts();
assertDocRequiredTerms();
assertNonGoals();
assertReportCoverage();
assertForbiddenPluginArtifactsAbsent();
assertPackageScript();
assertSmokeIsReadOnly();

console.log("PASS smoke:codex-augnes-plugin-manual-validation");

function assertRequiredSections() {
  assertIncludesAll(docText, [
    "## Purpose",
    "## Prerequisites",
    "## Static Checks Before Manual Validation",
    "## Codex Restart / Discovery Steps",
    "## Plugin Surface Checks",
    "## Starter Prompt Checks",
    "## Skill Routing Checks",
    "## Installer Dry-Run Behavior Checks",
    "## /hooks Trust Caveat Checks",
    "## Memory Fallback Checks",
    "## Pass/Fail Capture Template",
    "## Known Limitations",
    "## Non-Goals",
  ]);

  assertIncludesAll(reportText, [
    "## Summary",
    "## Files Changed",
    "## Validation Checklist Added",
    "## Expected Manual Validation Result Format",
    "## Verification",
    "## Skipped Checks",
    "## Remaining Caveats",
    "## Next Recommended PR",
  ]);
}

function assertStarterPrompts() {
  assertIncludesAll(docText, [
    "Codex야 Augnes 설치해줘",
    "Codex야 Augnes 쓰자",
    "Augnes memory 보고 시작해",
    "Augnes reuse 켜줘",
    "Augnes context 붙여서 작업해줘",
    "아그네스 설치해줘",
    "아그네스 쓰자",
  ]);
}

function assertDocRequiredTerms() {
  assertIncludesAll(docText, [
    "augnes-codex",
    "Codex restart",
    "plugin surface",
    "starter prompts",
    "Skill routing",
    "dry-run",
    "--yes",
    "/hooks review/trust",
    "manual",
    "static smoke does not prove real hook loading or trust",
    "perspective:memory-reuse-intake",
    "--brief",
    "~/.codex",
  ]);
}

function assertNonGoals() {
  const nonGoals = sectionText(docText, "Non-Goals");
  assertIncludesAll(nonGoals, [
    "no plugin-bundled hooks",
    "no managed hooks",
    "no MCP",
    "no provider/model/OpenAI config",
    "no storage/persistence",
    "no Codex SDK",
    "no GitHub mutation",
    "no automatic memory item creation",
    "no real installer commands",
    "no real ~/.codex writes",
  ]);
}

function assertReportCoverage() {
  assertIncludesAll(reportText, [
    "docs/report/static-smoke only",
    "Validation Checklist Added",
    "Expected Manual Validation Result Format",
    "npm run smoke:codex-augnes-plugin-manual-validation",
    "Manual Codex app/plugin-surface validation",
    "static smoke",
    "real installer commands",
    "real `~/.codex` writes",
    "Only fix concrete friction found during manual Codex app validation",
    "Do not start plugin-bundled hook work until manual validation shows that hook discovery/review is the actual bottleneck",
  ]);
}

function assertForbiddenPluginArtifactsAbsent() {
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
    packageJson.scripts["smoke:codex-augnes-plugin-manual-validation"],
    "node scripts/smoke-codex-augnes-plugin-manual-validation.mjs",
  );
}

function assertSmokeIsReadOnly() {
  assert.doesNotMatch(smokeSource, /\bos\.homedir\s*\(/, "smoke must not inspect real home");
  assert.doesNotMatch(smokeSource, /process\.env\.HOME/, "smoke must not inspect HOME");
  for (const token of [
    "write" + "FileSync",
    "append" + "FileSync",
    "mkdir" + "Sync",
    "rm" + "Sync",
    "rename" + "Sync",
    "copy" + "FileSync",
    "spawn" + "Sync",
    "exec" + "FileSync",
    "exec" + "Sync",
  ]) {
    assert.equal(smokeSource.includes(token), false, `smoke must not reference ${token}`);
  }
}

function sectionText(text, heading) {
  const match = text.match(
    new RegExp(`(?:^|\\n)## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n## |$)`),
  );
  assert.ok(match, `Missing section ${heading}`);
  return match[1];
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
