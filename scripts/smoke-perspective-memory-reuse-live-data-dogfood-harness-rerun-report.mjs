import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const browserReportFile =
  "reports/browser/2026-06-14-perspective-memory-reuse-live-data-dogfood-harness-rerun.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-reuse-live-data-dogfood-harness-rerun.mjs";
const reportSmokeFile =
  "scripts/smoke-perspective-memory-reuse-live-data-dogfood-harness-rerun-report.mjs";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db";
const routePath = "/cockpit/perspective/memory-items/reuse";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(browserReportFile, "utf8");

assertStaticFilesAndScripts();
assertReportContract();
assertBoundary();

console.log("PASS smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report");

function assertStaticFilesAndScripts() {
  for (const file of [browserReportFile, browserSmokeFile, reportSmokeFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["browser:perspective-memory-reuse-live-data-dogfood-harness-rerun"],
    "node scripts/browser-smoke-perspective-memory-reuse-live-data-dogfood-harness-rerun.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report"],
    "node scripts/smoke-perspective-memory-reuse-live-data-dogfood-harness-rerun-report.mjs",
  );
}

function assertReportContract() {
  assertIncludesAll(reportText, [
    "Perspective Memory Reuse Live-Data Harness Rerun Browser Validation",
    "PR #558 was merged into `main`",
    "npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes --db-path",
    "--yes` refusal check: passed",
    "symlink/path safety boundary",
    tempDbPath,
    "perspective-memory-item:reuse-live-data-accepted",
    "perspective-memory-item:reuse-live-data-follow-up",
    routePath,
    "route loads: yes",
    "seeded rows visible: yes",
    "selected count 2: yes",
    "packet JSON had `missing_memory_item_ids: []`",
    "Codex Memory Brief generated: yes",
    "copy buttons present: yes",
    "forbidden-control absence: yes",
    "Runtime stopped: yes",
    "No listener status: no process remained listening on TCP port 3000",
    "Verification",
    "Skipped Checks With Concrete Reasons",
    "Next Recommended PR",
    "compact Codex Memory Brief metadata",
    "No product/helper code changed",
  ]);
}

function assertBoundary() {
  assertIncludesAll(reportText, [
    "Default/user DB validation skipped because this PR must not use default/user DB paths.",
    "MCP bridge startup skipped because route reuse validation did not need bridge behavior.",
    "Provider/model checks skipped because the boundary prohibits provider/model calls.",
    "OpenAI API calls skipped because the boundary prohibits OpenAI API calls.",
    "Codex SDK execution skipped because the boundary prohibits Codex SDK execution.",
    "GitHub mutation from scripts skipped because scripts must not mutate GitHub.",
    "This PR does not add runtime authority, DB schema changes, migrations beyond existing setup/seed paths, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes outside explicit temp DB seed dogfood setup, reuse packet persistence, return binding persistence, product boundary creation beyond deterministic seed fixture requirements, automatic synthesis, automatic memory creation outside explicit seed setup, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.",
  ]);
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeWhitespace(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeWhitespace(snippet)),
      `expected report to include ${snippet}`,
    );
  }
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
