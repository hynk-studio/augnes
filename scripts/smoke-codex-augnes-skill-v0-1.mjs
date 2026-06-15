import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  skill: ".agents/skills/augnes-codex/SKILL.md",
  docs: "docs/CODEX_AUGNES_SKILL_V0_1.md",
  report: "reports/2026-06-15-codex-augnes-skill-v0-1.md",
  smoke: "scripts/smoke-codex-augnes-skill-v0-1.mjs",
  packageJson: "package.json",
};

const skillText = readText(files.skill);
const docsText = readText(files.docs);
const reportText = readText(files.report);
const smokeSource = readText(files.smoke);
const packageJson = JSON.parse(readText(files.packageJson));
const frontMatter = parseFrontMatter(skillText);

assertFrontMatter();
assertTriggerCoverage();
assertInstallerAndFallbackCoverage();
assertBoundaryCoverage();
assertDocsAndReport();
assertPackageScript();
assertSmokeDoesNotMutateRealCodex();

console.log("PASS smoke:codex-augnes-skill-v0-1");

function assertFrontMatter() {
  assert.equal(frontMatter.name, "augnes-codex", "skill name must be augnes-codex");
  assert.ok(frontMatter.description, "skill description must exist");
  assert.ok(
    frontMatter.description.startsWith("Augnes install, Augnes setup"),
    "description must start with important trigger terms",
  );
}

function assertTriggerCoverage() {
  assertIncludesAll(`${frontMatter.description}\n${skillText}\n${docsText}\n${reportText}`, [
    "Augnes install",
    "Augnes setup",
    "Augnes use",
    "Augnes memory",
    "Augnes reuse",
    "Augnes context",
    "Augnes 설치",
    "Augnes 쓰자",
    "Augnes memory",
    "Augnes reuse",
    "Augnes 기억",
    "Augnes 컨텍스트",
    "Augnes 보고 시작",
    "아그네스 설치",
    "아그네스 쓰자",
    "Codex야 Augnes 설치해줘",
    "Codex야 Augnes 쓰자",
    "Augnes memory 보고 시작해",
    "Augnes reuse 켜줘",
  ]);
}

function assertInstallerAndFallbackCoverage() {
  assertIncludesAll(skillText, [
    "codex:install-augnes-reuse-hook",
    "codex:uninstall-augnes-reuse-hook",
    "--yes",
    "dry-run",
    "/hooks",
    "trust",
    "perspective:memory-reuse-intake",
    "--brief",
  ]);
}

function assertBoundaryCoverage() {
  assertIncludesAll(skillText, [
    "storage",
    "persistence",
    "provider",
    "model",
    "OpenAI",
    "MCP",
    "Codex SDK",
    "GitHub mutation",
    "automatic Augnes memory item creation",
    "managed enterprise hooks",
    "large hook filter rewrites",
    "plugin packaging",
    "smoke does not prove real Codex hook loading or `/hooks` trust",
  ]);
}

function assertDocsAndReport() {
  assertIncludesAll(docsText, [
    "Skill / Plugin should be the first thing the user feels",
    "Hook / Installer",
    "Perspective Memory Reuse Intake",
    "No plugin packaging is added in this PR",
    "npm run codex:install-augnes-reuse-hook -- --dry-run",
    "npm run codex:install-augnes-reuse-hook -- --yes",
    "npm run codex:uninstall-augnes-reuse-hook -- --yes",
    "/hooks` review/trust remains necessary",
    "Smoke tests do not prove real Codex hook loading or",
    "npm run perspective:memory-reuse-intake -- --task \"<task>\" --brief",
    "real `~/.codex` writes in smoke",
    "automatic memory item creation",
    "provider/model calls",
    "OpenAI provider configuration",
    "MCP tool calls or MCP config",
    "Codex SDK execution",
    "GitHub mutation",
    "storage or persistence work",
  ]);

  assertIncludesAll(reportText, [
    "# Codex Augnes Skill v0.1 Report",
    "## Summary",
    "## Files Changed",
    "## Trigger Phrases Covered",
    "## Installer Dependency",
    "PR #570 merged",
    "codex:install-augnes-reuse-hook",
    "codex:uninstall-augnes-reuse-hook",
    "perspective:memory-reuse-intake",
    "## Verification",
    "npm run smoke:codex-augnes-skill-v0-1",
    "## Skipped Checks",
    "Real `/hooks` trust/loading check skipped",
    "Real `~/.codex` write check skipped",
    "## Remaining Caveats",
    "smoke does not prove real Codex hook loading or",
    "## Authority Boundary",
    "No runtime behavior, storage, persistence, provider/model calls",
    "plugin packaging",
    "Augnes Codex Plugin v0.1",
  ]);
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:codex-augnes-skill-v0-1"],
    "node scripts/smoke-codex-augnes-skill-v0-1.mjs",
  );
}

function assertSmokeDoesNotMutateRealCodex() {
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

function parseFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "skill must include YAML front matter");

  const fields = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!fieldMatch) {
      continue;
    }
    fields[fieldMatch[1]] = fieldMatch[2].replace(/^["']|["']$/g, "");
  }
  return fields;
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
