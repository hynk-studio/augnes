import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const browserReportFile =
  "reports/browser/2026-06-14-perspective-memory-reuse-live-data-dogfood.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-reuse-live-data-dogfood.mjs";
const reportSmokeFile =
  "scripts/smoke-perspective-memory-reuse-live-data-dogfood-report.mjs";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db";
const routePath = "/cockpit/perspective/memory-items/reuse";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(browserReportFile, "utf8");

assertStaticFilesAndScripts();
assertReportContract();
assertBoundary();

console.log("PASS smoke:perspective-memory-reuse-live-data-dogfood-report");

function assertStaticFilesAndScripts() {
  for (const file of [browserReportFile, browserSmokeFile, reportSmokeFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["browser:perspective-memory-reuse-live-data-dogfood"],
    "node scripts/browser-smoke-perspective-memory-reuse-live-data-dogfood.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-live-data-dogfood-report"],
    "node scripts/smoke-perspective-memory-reuse-live-data-dogfood-report.mjs",
  );
}

function assertReportContract() {
  assertIncludesAll(reportText, [
    "Perspective Memory Reuse Live-Data Dogfood Browser Validation",
    "PR #556 was merged into `main`",
    "seeded persisted memory rows",
    tempDbPath,
    routePath,
    "route loads: yes",
    "seeded rows visible: yes",
    "task title entered",
    "task description entered",
    "why_selected",
    "reuse_boundary",
    "structured packet JSON",
    "Codex Memory Brief",
    "copy buttons present: yes",
    "Forbidden-Control Absence",
    "Runtime stopped: yes",
    "No listener status",
    "Verification",
    "Skipped Checks With Concrete Reasons",
    "Remaining Friction",
    "Next Recommended PR",
    "No product/helper code changed",
    "Do not add a persisted return binding table yet",
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
    "This PR does not add runtime authority, DB schema changes, migrations beyond existing setup/seed paths, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, Augnes MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes outside the explicit seeded temp DB dogfood setup, reuse packet persistence, return binding persistence, product boundary creation beyond fixture/seed requirements, automatic synthesis, automatic memory creation outside the explicit seed setup, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.",
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
