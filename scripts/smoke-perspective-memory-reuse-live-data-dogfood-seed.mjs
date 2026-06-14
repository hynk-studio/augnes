import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const seedScriptFile =
  "scripts/perspective-memory-reuse-live-data-dogfood-seed.mjs";
const smokeFile =
  "scripts/smoke-perspective-memory-reuse-live-data-dogfood-seed.mjs";
const docFile =
  "docs/PERSPECTIVE_MEMORY_REUSE_LIVE_DATA_DOGFOOD_HARNESS_V0_1.md";
const reportFile =
  "reports/2026-06-14-perspective-memory-reuse-live-data-dogfood-harness.md";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db";
const routePath = "/cockpit/perspective/memory-items/reuse";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const seedScriptText = readFileSync(seedScriptFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertStaticFilesAndPackageScripts();
assertSeedScriptContract();
assertDocsAndReport();

console.log("PASS smoke:perspective-memory-reuse-live-data-dogfood-seed");

function assertStaticFilesAndPackageScripts() {
  for (const file of [seedScriptFile, smokeFile, docFile, reportFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
  assert.equal(
    packageJson.scripts["perspective:memory-reuse-live-data-dogfood-seed"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/perspective-memory-reuse-live-data-dogfood-seed.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-live-data-dogfood-seed"],
    "node scripts/smoke-perspective-memory-reuse-live-data-dogfood-seed.mjs",
  );
}

function assertSeedScriptContract() {
  assertIncludesAll(seedScriptText, [
    "DEFAULT_TEMP_DB_PATH",
    tempDbPath,
    "--yes",
    "refusing to reset or seed without --yes",
    "refused DB path outside /tmp",
    "process.env.AUGNES_DB_PATH = dbPath",
    "assertTempDbPathSafety(dbPath)",
    "lstatSync",
    "realpathSync",
    "rejectSymlinkIfPresent",
    "SQLite artifact path",
    "DB parent path component must not be a symlink",
    "DB parent realpath escapes temp root",
    "resetDatabase",
    "createPerspectiveMemoryProductPersistenceBoundaryRecord",
    "createPerspectiveMemoryItemFromBoundaryRecord",
    "Seeded item IDs:",
    "perspective-memory-item:reuse-live-data-accepted",
    "perspective-memory-item:reuse-live-data-follow-up",
    "Next runtime command:",
    "env -u OPENAI_API_KEY AUGNES_DB_PATH=",
    routePath,
    "This harness does not start runtime, MCP bridge, MCP tools, provider/model calls, OpenAI API, Codex SDK, or GitHub mutation.",
  ]);
  assertNoIncludes(seedScriptText, [
    "data/augnes.db",
    "homedir",
    ".codex/config.toml",
    "child_process",
    "spawn(",
    "exec(",
    "mcp_bridge",
    "startMcp",
    "callTool",
    "providerModel",
    "new OpenAI",
    "openai.chat",
    "OPENAI_API_KEY:",
    "@openai/codex",
    "Codex(",
    "new Octokit",
    "@octokit",
    "gh pr",
    "fetch(\"https://api.github.com",
  ]);
}

function assertDocsAndReport() {
  for (const text of [docText, reportText]) {
    assertIncludesAll(text, [
      "PR #557",
      "manual seed setup is friction",
      tempDbPath,
      routePath,
      "--yes",
      "does not start runtime",
      "does not start MCP bridge",
      "does not call MCP tools",
      "does not run provider/model calls",
      "does not use OpenAI API",
      "does not use Codex SDK",
      "does not mutate GitHub from scripts",
      "does not use default/user DB paths",
      "does not add DB schema or migrations",
      "symlinked DB/artifact paths",
      "parent path escapes",
      "prior setup/prepare work",
      "does not justify a persisted return binding table",
    ]);
  }
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeWhitespace(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeWhitespace(snippet)),
      `expected text to include: ${snippet}`,
    );
  }
}

function assertNoIncludes(text, forbiddenSnippets) {
  for (const snippet of forbiddenSnippets) {
    assert.equal(
      text.includes(snippet),
      false,
      `expected text not to include: ${snippet}`,
    );
  }
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
