import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  sourceSkill: ".agents/skills/augnes-codex/SKILL.md",
  packagedSkill: "plugins/augnes-codex/skills/augnes-codex/SKILL.md",
  pluginJson: "plugins/augnes-codex/.codex-plugin/plugin.json",
  readme: "plugins/augnes-codex/README.md",
  skillDoc: "docs/CODEX_AUGNES_SKILL_V0_1.md",
  pluginDoc: "docs/CODEX_AUGNES_PLUGIN_V0_1.md",
  validationDoc: "docs/CODEX_AUGNES_PLUGIN_VALIDATION.md",
  manualValidationDoc: "docs/CODEX_AUGNES_PLUGIN_MANUAL_VALIDATION.md",
  report: "reports/2026-06-15-codex-augnes-english-triggers-liftable-constraints.md",
  packageJson: "package.json",
  smoke: "scripts/smoke-codex-augnes-english-triggers-liftable-constraints.mjs",
};

const sourceSkill = readText(files.sourceSkill);
const packagedSkill = readText(files.packagedSkill);
const pluginJson = JSON.parse(readText(files.pluginJson));
const readme = readText(files.readme);
const skillDoc = readText(files.skillDoc);
const pluginDoc = readText(files.pluginDoc);
const validationDoc = readText(files.validationDoc);
const manualValidationDoc = readText(files.manualValidationDoc);
const report = readText(files.report);
const packageJson = JSON.parse(readText(files.packageJson));
const smokeSource = readText(files.smoke);

const englishTriggers = [
  "Use Augnes",
  "Set up Augnes",
  "Install Augnes",
  "Enable Augnes reuse",
  "Start with Augnes memory",
  "Start from Augnes memories",
  "Use Augnes memory",
  "Use Augnes context",
  "Review this PR with Augnes context",
  "Work with Augnes memory",
  "Start this task with Augnes",
];

const englishStarterPrompts = [
  "Use Augnes for this task",
  "Set up Augnes in Codex",
  "Start with Augnes memory",
  "Review this PR with Augnes context",
  "Enable Augnes reuse",
  "Use Augnes context before editing",
];

const koreanTriggers = [
  "Codex야 Augnes 설치해줘",
  "Codex야 Augnes 쓰자",
  "Augnes memory 보고 시작해",
  "Augnes reuse 켜줘",
  "Augnes context 붙여서 작업해줘",
  "아그네스 설치해줘",
  "아그네스 쓰자",
];

const constraintTerms = [
  "Default constraints",
  "user-liftable",
  "non-liftable",
  "/hooks review/trust remains manual",
  "plugin install does not prove real hook loading",
  "static smoke cannot prove real hook loading or trust",
  "--yes",
  "real ~/.codex write",
  "storage/persistence",
  "provider/model",
  "OpenAI config",
  "MCP",
  "Codex SDK",
  "GitHub mutation",
  "automatic memory item creation",
  "explicit user scope",
  "not use --dangerously-bypass-hook-trust as normal UX",
];

assertSkillTriggerCoverage();
assertSkillConstraintCoverage();
assertManifestPromptsAndBoundaries();
assertReadmeAndDocs();
assertReport();
assertForbiddenRuntimeArtifactsAbsent();
assertPackageScript();
assertSmokeIsReadOnly();

console.log("PASS smoke:codex-augnes-english-triggers-liftable-constraints");

function assertSkillTriggerCoverage() {
  for (const text of [sourceSkill, packagedSkill]) {
    assertIncludesAll(text, englishTriggers);
    assertIncludesAll(text, koreanTriggers);
  }
}

function assertSkillConstraintCoverage() {
  for (const text of [sourceSkill, packagedSkill]) {
    assertIncludesAll(text, constraintTerms);
    assertIncludesAll(text, [
      "no real `~/.codex` write unless explicitly authorized",
      "memory brief is read-only/context-only by default",
      "no plugin-bundled hook implementation by default",
      "Codex command approvals and safety behavior remain in force",
      "Codex must not claim it can remove `/hooks` trust",
    ]);
  }
}

function assertManifestPromptsAndBoundaries() {
  assert.equal(pluginJson.name, "augnes-codex");
  assert.equal(pluginJson.hooks, undefined, "plugin manifest must not add hooks");
  assert.equal(pluginJson.mcpServers, undefined, "plugin manifest must not add mcpServers");
  assert.equal(pluginJson.apps, undefined, "plugin manifest must not add apps");

  const defaultPromptText = defaultPromptToText(pluginJson.interface?.defaultPrompt);
  assertIncludesAll(defaultPromptText, englishStarterPrompts);
  assertIncludesAll(defaultPromptText, koreanTriggers);

  assertIncludesAll(JSON.stringify(pluginJson), [
    "English and Korean",
    "user-liftable default constraints",
    "non-liftable /hooks trust review",
    "does not write to ~/.codex",
    "MCP",
    "provider/model",
    "storage",
    "persistence",
    "Codex SDK",
    "GitHub mutation",
    "automatic memory item creation",
  ]);
}

function assertReadmeAndDocs() {
  const docsCombined = [
    readme,
    skillDoc,
    pluginDoc,
    validationDoc,
    manualValidationDoc,
  ].join("\n");

  assertIncludesAll(docsCombined, englishTriggers);
  assertIncludesAll(docsCombined, englishStarterPrompts);
  assertIncludesAll(docsCombined, koreanTriggers);
  assertIncludesAll(docsCombined, constraintTerms);
  assertIncludesAll(docsCombined, [
    "Codex handles the English prompt as an Augnes Skill trigger",
    "Codex explains user-liftable constraints at Augnes use start",
    "distinguishes user-liftable defaults from non-liftable Codex/platform constraints",
    "Codex can proceed with `--yes` real install only when explicitly scoped",
    "Codex does not claim `/hooks` trust can be removed",
    "Codex does not use `--dangerously-bypass-hook-trust` as normal UX",
    "The user can explicitly authorize real install with `--yes`",
    "explicitly allow real `~/.codex` write for hook install",
    "explicitly scope storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub mutation work into a PR",
    "Plugin install does not prove real hook loading or trust",
    "Static smoke does not prove real hook loading or trust",
  ]);
}

function assertReport() {
  assertIncludesAll(report, [
    "## Summary",
    "## Files Changed",
    "## English Trigger Coverage",
    "## Constraint Disclosure Model",
    "## User-Liftable Constraints",
    "## Non-Liftable Codex/Platform Constraints",
    "## Verification",
    "## Skipped Checks",
    "## Remaining Caveats",
    "## Next Recommended PR",
    "Run actual manual Codex app validation for Korean and English Augnes prompts",
  ]);
  assertIncludesAll(report, englishTriggers);
  assertIncludesAll(report, englishStarterPrompts);
  assertIncludesAll(report, constraintTerms);
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
    packageJson.scripts["smoke:codex-augnes-english-triggers-liftable-constraints"],
    "node scripts/smoke-codex-augnes-english-triggers-liftable-constraints.mjs",
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

function defaultPromptToText(defaultPrompt) {
  if (Array.isArray(defaultPrompt)) {
    return defaultPrompt.join("\n");
  }
  return String(defaultPrompt ?? "");
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
