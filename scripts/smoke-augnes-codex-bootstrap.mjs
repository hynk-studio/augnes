import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = {
  doc: "docs/AUGNES_CODEX_BOOTSTRAP_V0_1.md",
  bootstrap: "scripts/augnes-codex-bootstrap.mjs",
  smoke: "scripts/smoke-augnes-codex-bootstrap.mjs",
  configExample: ".codex/config.toml.example",
  pluginInstall: "plugins/augnes-operator/INSTALL.md",
  report: "reports/2026-06-14-augnes-codex-bootstrap.md",
  packageJson: "package.json",
};

for (const [name, filePath] of Object.entries(files)) {
  assert.ok(existsSync(filePath), `${name} file must exist at ${filePath}`);
}

const packageJson = JSON.parse(readFileSync(files.packageJson, "utf8"));
assert.equal(packageJson.scripts["augnes:codex-bootstrap"], "node scripts/augnes-codex-bootstrap.mjs");
assert.equal(packageJson.scripts["smoke:augnes-codex-bootstrap"], "node scripts/smoke-augnes-codex-bootstrap.mjs");

const bootstrapSource = readFileSync(files.bootstrap, "utf8");
const docText = readFileSync(files.doc, "utf8");
const configExample = readFileSync(files.configExample, "utf8");
const pluginInstall = readFileSync(files.pluginInstall, "utf8");
const reportText = readFileSync(files.report, "utf8");

for (const expected of [
  "README.md",
  "AGENTS.md",
  "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
  "plugins/augnes-operator/.codex-plugin/plugin.json",
  "apps/augnes_apps/package.json",
  ".codex/config.toml.example",
  "npm install",
  "npm run db:reset",
  "npm run db:migrate",
  "npm run demo:seed",
  "env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
  "npm --prefix apps/augnes_apps install",
  "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
]) {
  assert.ok(bootstrapSource.includes(expected), `bootstrap source should include ${expected}`);
}

for (const pattern of [
  /spawnSync\(\s*["']npm["']\s*,\s*\[\s*["']install["']/,
  /spawnSync\(\s*["']npm["']\s*,\s*\[\s*["']run["']\s*,\s*["']db:/,
  /spawnSync\(\s*["']npm["']\s*,\s*\[\s*["']run["']\s*,\s*["']dev["']/,
  /spawnSync\(\s*["']gh["']/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bapi\.openai\.com\b/,
  /\bapi\.github\.com\b/,
  /\bCodexSDK\b/,
  /\bprocess\.env\.OPENAI_API_KEY\b/,
  /readFileSync\([^)]*\.env/,
  /writeFileSync\([^)]*~\/\.codex\/config\.toml/,
]) {
  assert.doesNotMatch(bootstrapSource, pattern, `bootstrap must not contain active forbidden pattern ${pattern}`);
}

const bootstrapRun = spawnSync(process.execPath, [files.bootstrap], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
assert.equal(
  bootstrapRun.status,
  0,
  `bootstrap script should pass in this repo\nstdout:\n${bootstrapRun.stdout}\nstderr:\n${bootstrapRun.stderr}`,
);

for (const expected of [
  "# Augnes Codex Bootstrap v0.1",
  "## Recommended Local Setup Commands",
  "## Recommended MCP Bridge Setup Commands",
  "does not install packages, migrate databases, read secrets, call providers, call GitHub, or write user-level Codex config",
  "Candidate acceptance, memory persistence, proof/evidence writes, DB writes, schema changes, provider calls, Codex SDK execution, GitHub mutation",
]) {
  assert.ok(bootstrapRun.stdout.includes(expected), `bootstrap output should include ${expected}`);
}

assertConfigExample(configExample);
assertPluginInstallGuide(pluginInstall);
assertBootstrapDoc(docText);
assertReport(reportText);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-codex-bootstrap",
      package_scripts_valid: true,
      bootstrap_run_passed: true,
      config_example_valid: true,
      plugin_install_guide_valid: true,
      docs_cover_install_modes: true,
      proposal_section_present: true,
      boundary_preserved: true,
    },
    null,
    2,
  ),
);

function assertConfigExample(text) {
  assert.ok(text.includes("[mcp_servers.augnes_local_bridge]"), "config example should define local bridge MCP entry");
  assert.ok(text.includes('url = "http://localhost:8787/mcp"'), "config example should point to local bridge URL");
  assert.ok(text.includes("This repository script never writes ~/.codex/config.toml"));
  assert.ok(text.includes("Do not put secrets in this file."));
  assert.ok(text.includes("AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000"));
  assert.doesNotMatch(text, /\bsk-[A-Za-z0-9_-]{20,}\b/);
  assert.doesNotMatch(text, /\bghp_[A-Za-z0-9_]{20,}\b/);
  assert.doesNotMatch(text, /\b(?:OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)=\S+/);
}

function assertPluginInstallGuide(text) {
  for (const expected of [
    "plugins/augnes-operator/.codex-plugin/plugin.json",
    ".agents/plugins/marketplace.json",
    "plugins/augnes-operator/skills/",
    "plugins/augnes-operator/hooks/",
    "npm run smoke:augnes-operator-plugin-scaffold",
    "npm run smoke:augnes-operator-plugin-hooks",
    "does not write user-level Codex",
  ]) {
    assert.ok(text.includes(expected), `plugin install guide should include ${expected}`);
  }

  for (const pattern of [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bcurl\s+(-[A-Za-z]+\s+)*https?:\/\//,
    /\bwget\s+https?:\/\//,
    /\bapi\.openai\.com\b/,
    /\bapi\.github\.com\b/,
    /\bgh\s+(api|pr|issue|repo)\b/,
    /\b(?:OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)=\S+/,
  ]) {
    assert.doesNotMatch(text, pattern, `plugin install guide must not contain ${pattern}`);
  }
}

function assertBootstrapDoc(text) {
  for (const expected of [
    "Install Mode 1: Repo-native Codex Use",
    "Install Mode 2: Local Codex plus Augnes MCP Bridge",
    "Install Mode 3: augnes-operator Plugin, Skills, and Hooks",
    "Codex-access improvement proposals",
    "One-command install / doctor command",
    "Bootstrap report output that Codex can paste into PR bodies",
    "Local runtime health check endpoint or CLI check",
    "MCP bridge readiness check",
    "Codex-friendly Work Contract Card or task card",
    "Machine-readable Augnes capability manifest",
    "Simplified \"read context\" command for Codex",
    "Plugin install guide hardening",
    "Codex hook improvements",
    "Devcontainer or reproducible environment option",
    "GitHub Codespaces / remote environment option",
    "Returned-envelope intake automation follow-up",
    "Generated .codex config examples",
    "Better skipped-check and missing-runtime diagnostics",
    "Browser/computer-use verification runbook",
    "PR body template for Augnes Codex tasks",
    "Command aliases that reduce long env var boilerplate",
    "Safe setup without OPENAI_API_KEY",
    "Explicit \"what Codex can do / cannot do\" card",
    "runtime behavior no; DB/schema no; API routes no; MCP config no",
    "secret handling yes",
  ]) {
    assert.ok(text.includes(expected), `bootstrap doc should include ${expected}`);
  }

  for (const rank of ["P0", "P1", "P2", "P3"]) {
    assert.match(text, new RegExp(`### ${rank}-`), `bootstrap doc should include ${rank} proposals`);
  }
}

function assertReport(text) {
  for (const expected of [
    "## Summary",
    "## Files changed",
    "## Bootstrap behavior",
    "## Codex-access improvement proposals",
    "## Boundary",
    "## Verification plan",
    "## Skipped checks",
    "This PR adds bootstrap docs/scripts only",
    "does not add runtime authority, DB",
    "One-command install / doctor command",
    "Secret-backed remote bootstrap automation",
  ]) {
    assert.ok(text.includes(expected), `report should include ${expected}`);
  }
}
