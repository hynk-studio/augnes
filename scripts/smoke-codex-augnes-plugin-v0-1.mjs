import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  pluginJson: "plugins/augnes-codex/.codex-plugin/plugin.json",
  pluginRoot: "plugins/augnes-codex",
  packagedSkill: "plugins/augnes-codex/skills/augnes-codex/SKILL.md",
  sourceSkill: ".agents/skills/augnes-codex/SKILL.md",
  docs: "docs/CODEX_AUGNES_PLUGIN_V0_1.md",
  validationDoc: "docs/CODEX_AUGNES_PLUGIN_VALIDATION.md",
  readme: "plugins/augnes-codex/README.md",
  report: "reports/2026-06-15-codex-augnes-plugin-v0-1.md",
  installSurfaceReport:
    "reports/2026-06-15-codex-augnes-plugin-install-surface-polish.md",
  marketplace: ".agents/plugins/marketplace.json",
  smoke: "scripts/smoke-codex-augnes-plugin-v0-1.mjs",
  packageJson: "package.json",
};

const pluginJson = readJson(files.pluginJson);
const packagedSkill = readText(files.packagedSkill);
const sourceSkill = readText(files.sourceSkill);
const docsText = readText(files.docs);
const validationDocText = readText(files.validationDoc);
const readmeText = readText(files.readme);
const reportText = readText(files.report);
const installSurfaceReportText = readText(files.installSurfaceReport);
const marketplaceJson = readJson(files.marketplace);
const smokeSource = readText(files.smoke);
const packageJson = readJson(files.packageJson);
const frontMatter = parseFrontMatter(packagedSkill);

assertPluginManifest();
assertPackagedSkill();
assertDocs();
assertValidationDoc();
assertReadme();
assertMarketplace();
assertReport();
assertPackageScript();
assertSmokeIsReadOnly();

console.log("PASS smoke:codex-augnes-plugin-v0-1");

function assertPluginManifest() {
  assert.equal(pluginJson.name, "augnes-codex");
  assert.ok(pluginJson.version, "plugin version must exist");
  assert.ok(pluginJson.description, "plugin description must exist");
  assert.match(pluginJson.description, /Augnes/i);
  assert.match(pluginJson.description, /Codex/i);
  assert.match(pluginJson.description, /memory|reuse/i);
  assert.equal(pluginJson.skills, "./skills/");
  assert.equal(pluginJson.hooks, undefined, "plugin must not add hooks");
  assert.equal(pluginJson.mcpServers, undefined, "plugin must not add MCP servers");
  assert.equal(pluginJson.apps, undefined, "plugin must not add app mappings");

  const pluginInterface = pluginJson.interface;
  assert.ok(pluginInterface, "plugin interface metadata must exist");
  assert.ok(pluginInterface.displayName, "interface.displayName must exist");
  assert.ok(pluginInterface.shortDescription, "interface.shortDescription must exist");
  assert.ok(pluginInterface.longDescription, "interface.longDescription must exist");
  assert.ok(pluginInterface.developerName, "interface.developerName must exist");
  assert.ok(pluginInterface.category, "interface.category must exist");
  assert.ok(
    Array.isArray(pluginInterface.capabilities) && pluginInterface.capabilities.length > 0,
    "interface.capabilities must be a non-empty array",
  );
  assert.ok(pluginInterface.defaultPrompt, "interface.defaultPrompt must exist");

  const defaultPromptText = defaultPromptToText(pluginInterface.defaultPrompt);
  assertIncludesAll(defaultPromptText, [
    "Codex야 Augnes 설치해줘",
    "Codex야 Augnes 쓰자",
    "Augnes memory 보고 시작해",
    "Augnes reuse 켜줘",
    "Augnes context 붙여서 작업해줘",
    "아그네스 설치해줘",
    "아그네스 쓰자",
  ]);

  const manifestCopy = JSON.stringify(pluginJson);
  assertIncludesAll(manifestCopy, [
    "guided setup and reuse onboarding",
    "dry-run",
    "--yes",
    "/hooks trust",
    "Hook trust remains manual",
    "memory-reuse fallback",
  ]);
  assertForbiddenPhrasesAbsent(manifestCopy, [
    "automatic " + "trust",
    "automates " + "/hooks trust",
    "proves " + "real hook loading",
    "always injected",
    "mutates " + "~/.codex",
  ]);

  assert.equal(
    existsSync(`${files.pluginRoot}/.mcp.json`),
    false,
    "plugin root must not contain .mcp.json",
  );
  assert.equal(
    existsSync(`${files.pluginRoot}/hooks/hooks.json`),
    false,
    "plugin root must not contain hooks/hooks.json",
  );
}

function assertPackagedSkill() {
  assert.equal(frontMatter.name, "augnes-codex");
  assert.ok(frontMatter.description, "packaged skill description must exist");
  assertIncludesAll(`${frontMatter.description}\n${packagedSkill}`, [
    "Augnes install",
    "Augnes setup",
    "Augnes use",
    "Augnes memory",
    "Augnes reuse",
    "Augnes context",
    "Augnes 설치",
    "Augnes 쓰자",
    "Augnes 기억",
    "Augnes 컨텍스트",
    "Augnes 보고 시작",
    "아그네스 설치",
    "아그네스 쓰자",
    "codex:install-augnes-reuse-hook",
    "codex:uninstall-augnes-reuse-hook",
    "dry-run",
    "--yes",
    "/hooks",
    "trust",
    "perspective:memory-reuse-intake",
    "--brief",
    "smoke does not prove real Codex hook loading or `/hooks` trust",
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
  ]);

  assertIncludesAll(sourceSkill, [
    "name: augnes-codex",
    "codex:install-augnes-reuse-hook",
    "perspective:memory-reuse-intake",
  ]);
}

function assertDocs() {
  assertIncludesAll(docsText, [
    "Skill",
    "Plugin",
    "hook installer",
    "/hooks` review/trust",
    "Smoke tests do not prove real hook loading or trust",
    "npm run perspective:memory-reuse-intake -- --task \"<task>\" --brief",
    "Non-Goals",
    "no managed hook",
    "no plugin-bundled runtime hook",
    "no MCP server",
    "no provider/model calls",
    "no storage/persistence",
    "no Codex SDK",
    "no GitHub mutation behavior",
    "no automatic Augnes memory item creation",
    "no real `~/.codex` writes in smoke",
    "no claim that `/hooks` trust is automated",
  ]);
}

function assertValidationDoc() {
  assertIncludesAll(validationDocText, [
    "npm run smoke:codex-augnes-plugin-v0-1",
    "npm run smoke:codex-augnes-skill-v0-1",
    "git diff --check",
    "yaml",
    "PyYAML",
    "Manual Codex App Validation",
    "restart Codex",
    "Confirm `augnes-codex` appears",
    "Static smoke does not prove real hook loading/trust",
    "Do not write to real `~/.codex` during automated validation",
    "npm run perspective:memory-reuse-intake -- --task \"<task>\" --brief",
  ]);
}

function assertReadme() {
  assertIncludesAll(readmeText, [
    "## Starter Prompts",
    "## What The Plugin Does",
    "## What It Does Not Do",
    "## Validation Notes",
    "Codex야 Augnes 설치해줘",
    "Codex야 Augnes 쓰자",
    "Augnes memory 보고 시작해",
    "Augnes reuse 켜줘",
    "Augnes context 붙여서 작업해줘",
    "아그네스 설치",
    "아그네스 쓰자",
    "The plugin packages the skill",
    "The existing user-level hook installer remains the setup mechanism",
    "Dry-run should happen first",
    "Real install requires explicit approval plus `--yes`",
    "/hooks` review/trust remains manual",
    "Static smoke does not prove real hook loading or trust",
    "npm run perspective:memory-reuse-intake -- --task \"<task>\" --brief",
  ]);
}

function assertMarketplace() {
  assert.equal(marketplaceJson.name, "augnes-local");
  assert.equal(marketplaceJson.interface?.displayName, "Augnes Local");
  assert.ok(Array.isArray(marketplaceJson.plugins), "marketplace plugins must be an array");
  const entry = marketplaceJson.plugins.find((plugin) => plugin.name === "augnes-codex");
  assert.ok(entry, "marketplace must expose augnes-codex");
  assert.deepEqual(entry.source, {
    source: "local",
    path: "./plugins/augnes-codex",
  });
  assert.equal(entry.policy?.installation, "AVAILABLE");
  assert.equal(entry.policy?.authentication, "ON_INSTALL");
  assert.equal(entry.category, "Productivity");
}

function assertReport() {
  assertIncludesAll(reportText, [
    "# Codex Augnes Plugin v0.1 Report",
    "## Summary",
    "## Files Changed",
    "## Why Plugin Follows Skill v0.1",
    "## Repo Convention Used",
    "## Marketplace Behavior",
    "## Verification",
    "## Skipped Checks",
    "## Remaining Caveats",
    "## Authority Boundary",
    "## Next Recommended PR",
  ]);

  assertIncludesAll(installSurfaceReportText, [
    "# Codex Augnes Plugin Install Surface Polish",
    "## Summary",
    "## Files Changed",
    "## Manifest Metadata Added",
    "## Validation Doc Added",
    "## Verification",
    "## Skipped Checks",
    "## Remaining Caveats",
    "## Next Recommended PR",
    "## Authority Boundary",
  ]);
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:codex-augnes-plugin-v0-1"],
    "node scripts/smoke-codex-augnes-plugin-v0-1.mjs",
  );
}

function assertSmokeIsReadOnly() {
  assert.doesNotMatch(smokeSource, /\bos\.homedir\s*\(/, "smoke must not inspect real home");
  assert.doesNotMatch(smokeSource, /process\.env\.HOME/, "smoke must not inspect HOME");
  const installerScript = "codex:" + "install-augnes-reuse-hook";
  assert.equal(smokeSource.includes(`${installerScript} -- --yes`), false);
  assert.equal(smokeSource.includes(`${installerScript} -- --dry-run`), false);
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

function readJson(filePath) {
  return JSON.parse(readText(filePath));
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

function assertForbiddenPhrasesAbsent(text, forbiddenValues) {
  const normalizedText = normalizeWhitespace(text).toLowerCase();
  for (const forbidden of forbiddenValues) {
    assert.equal(
      normalizedText.includes(normalizeWhitespace(forbidden).toLowerCase()),
      false,
      `Expected text not to include ${forbidden}`,
    );
  }
}

function defaultPromptToText(defaultPrompt) {
  if (Array.isArray(defaultPrompt)) {
    return defaultPrompt.join("\n");
  }
  return String(defaultPrompt);
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
