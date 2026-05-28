import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const pluginRoot = "plugins/augnes-operator";
const pluginJsonPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
const marketplacePath = ".agents/plugins/marketplace.json";
const approvedSkills = [
  "augnes-read-brief",
  "augnes-implementation-slice",
  "augnes-record-evidence",
  "augnes-closeout-proof",
  "augnes-authority-audit",
];

const pluginJson = readJson(pluginJsonPath);
assert.equal(pluginJson.name, "augnes-operator");
assert.equal(pluginJson.skills, "./skills/");
assert.equal(pluginJson.mcpServers, undefined, "plugin scaffold must not include MCP config");
assert.equal(pluginJson.apps, undefined, "plugin scaffold must not include app mappings");
assert.match(
  pluginJson.description,
  /Augnes workflow harness for Codex preflight, bounded implementation, evidence reporting, proof-only closeout, and authority audit/,
);

const marketplaceJson = readJson(marketplacePath);
assert.equal(marketplaceJson.name, "augnes-local");
assert.ok(Array.isArray(marketplaceJson.plugins), "marketplace plugins must be an array");
const marketplaceEntry = marketplaceJson.plugins.find((entry) => entry.name === "augnes-operator");
assert.ok(marketplaceEntry, "marketplace must include augnes-operator");
assert.deepEqual(marketplaceEntry.source, {
  source: "local",
  path: "./plugins/augnes-operator",
});
assert.equal(marketplaceEntry.policy?.installation, "AVAILABLE");
assert.equal(marketplaceEntry.policy?.authentication, "ON_INSTALL");

assert.equal(existsSync(path.join(pluginRoot, ".mcp.json")), false, "plugin scaffold must not contain .mcp.json");
assert.equal(existsSync(path.join(pluginRoot, ".app.json")), false, "plugin scaffold must not contain .app.json");
assert.equal(existsSync(path.join(pluginRoot, "apps")), false, "plugin scaffold must not contain app mappings");
const hooksPresent = existsSync(path.join(pluginRoot, "hooks"));

const pluginFiles = listFiles(pluginRoot)
  .filter((filePath) => !filePath.startsWith(path.join(pluginRoot, "hooks") + path.sep))
  .concat([marketplacePath]);
const combinedText = pluginFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n\n");

for (const skillName of approvedSkills) {
  const skillPath = path.join(pluginRoot, "skills", skillName, "SKILL.md");
  assert.ok(existsSync(skillPath), `${skillPath} must exist`);
  const skillText = readFileSync(skillPath, "utf8");
  const frontmatterName = skillText.match(/^---\nname:\s*([a-z0-9-]+)\n/m)?.[1];
  assert.equal(frontmatterName, skillName, `${skillName} frontmatter name must match`);
}

assertNoSecretPlaceholders(combinedText);
assertNoUnsafeMergeAuthorityGrant(combinedText);
assertNoActiveExternalCalls(combinedText);
assert.match(
  combinedText,
  /Proof is not approval|proof from approval|Evidence rows are verification material\. They are not approval/i,
  "plugin files should preserve proof/evidence approval boundary language",
);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-operator-plugin-scaffold",
      plugin_json_valid: true,
      marketplace_json_valid: true,
      marketplace_source: marketplaceEntry.source,
      packaged_skills: approvedSkills,
      hooks_present: hooksPresent,
      hooks_covered_by: hooksPresent ? "smoke:augnes-operator-plugin-hooks" : null,
      mcp_config_absent: true,
      app_mapping_absent: true,
      authority_boundary_preserved: true,
      external_call_configs_absent: true,
    },
    null,
    2,
  ),
);

function readJson(filePath) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function listFiles(root) {
  const output = [];
  for (const entry of readdirSync(root)) {
    const entryPath = path.join(root, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      output.push(...listFiles(entryPath));
    } else if (stat.isFile()) {
      output.push(entryPath);
    }
  }
  return output;
}

function assertNoSecretPlaceholders(text) {
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\bghp_[A-Za-z0-9_]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\b(?:OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)=\S+/,
  ];
  for (const pattern of secretPatterns) {
    assert.doesNotMatch(text, pattern, `plugin scaffold contains secret-like pattern ${pattern}`);
  }
}

function assertNoUnsafeMergeAuthorityGrant(text) {
  const clauses = text
    .replace(/\s+/g, " ")
    .split(/[.;!?]/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    assert.equal(
      hasUnsafeMergeAuthorityClaim(clause),
      false,
      `plugin scaffold appears to grant Codex merge authority: ${clause}`,
    );
  }
}

function hasUnsafeMergeAuthorityClaim(clause) {
  const unsafePatterns = [
    /\bcodex\b.{0,80}\b(merged|auto-merged)\b/i,
    /\bcodex\b.{0,80}\benabled\s+auto-merge\b/i,
    /\bcodex\b.{0,40}\b(can|may)\s+merge\b/i,
    /\bcodex\b.{0,80}\b(can|may)\s+enable\s+auto-merge\b/i,
    /\bcodex\b.{0,80}\bis\s+(allowed|permitted)\s+to\s+(merge|enable\s+auto-merge)\b/i,
    /\bcodex\b.{0,80}\bhas\s+permission\s+to\s+(merge|enable\s+auto-merge)\b/i,
    /\bcodex\b.{0,80}\b(owns|has|claimed|claims|claiming|was\s+granted|is\s+granted)\s+merge\s+authority\b/i,
    /\bgrant(?:s|ed|ing)?\b.{0,80}\bcodex\b.{0,80}\bmerge\s+authority\b/i,
    /\bmerged\s+by\s+codex\b/i,
    /\bauto-merge\s+enabled\s+by\s+codex\b/i,
    /\bauto-merge\s+was\s+enabled\s+by\s+codex\b/i,
  ];

  if (!unsafePatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedMergeAuthorityBoundary(clause);
}

function isNegatedMergeAuthorityBoundary(clause) {
  const negatedCodexAction =
    /\bcodex\b.{0,80}\b(must\s+never|never|must\s+not|may\s+not|does\s+not|do\s+not|doesn't|cannot|can't|can\s+not|should\s+not|is\s+not|is\s+not\s+allowed|is\s+not\s+permitted|has\s+no\s+permission)\b.{0,80}\b(merge|auto-merge|merge\s+authority)\b/i;
  const negatedGrant =
    /\b(does\s+not|do\s+not|doesn't|must\s+not|may\s+not|never|cannot|can't|can\s+not|should\s+not|without|no)\b.{0,80}\b(grant|claim|enable|merge|own|have|permission|allow|permit)\b.{0,80}\bcodex\b.{0,80}\b(merge\s+authority|auto-merge|merge)\b/i;
  const noMergeAuthority =
    /\b(no|not)\b.{0,40}\bcodex\b.{0,80}\b(merge\s+authority|authority)\b/i;

  return negatedCodexAction.test(clause) || negatedGrant.test(clause) || noMergeAuthority.test(clause);
}

function assertNoActiveExternalCalls(text) {
  const activeCallPatterns = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bcurl\s+(-[A-Za-z]+\s+)*https?:\/\//,
    /\bwget\s+https?:\/\//,
    /\bapi\.openai\.com\b/,
    /\bapi\.github\.com\b/,
    /\bgh\s+(api|pr|issue|repo)\b/,
    /\bnpm\s+run\s+codex:record-completion-proof\s*&&/,
  ];
  for (const pattern of activeCallPatterns) {
    assert.doesNotMatch(text, pattern, `plugin scaffold contains active external-call pattern ${pattern}`);
  }
}
