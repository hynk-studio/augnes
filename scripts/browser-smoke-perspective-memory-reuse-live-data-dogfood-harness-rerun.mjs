import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-14-perspective-memory-reuse-live-data-dogfood-harness-rerun.md";
const routePath = "/cockpit/perspective/memory-items/reuse";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-harness-rerun/augnes.db";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");

assertIncludesAll(report, [
  "Perspective Memory Reuse Live-Data Harness Rerun Browser Validation",
  "PR #558 was merged into `main`",
  "npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes --db-path",
  "--yes` refusal check: passed",
  "symlink/path safety boundary",
  tempDbPath,
  routePath,
  "route loads: yes",
  "seeded rows visible: yes",
  "selected count 2: yes",
  "packet JSON had `missing_memory_item_ids: []`",
  "Codex Memory Brief generated: yes",
  "copy buttons present: yes",
  "forbidden-control absence: yes",
  "no unexpected external requests: yes",
  "1280px, 768px, and 390px viewports had no horizontal overflow",
  "Runtime stopped: yes",
  "No listener status: no process remained listening on TCP port 3000",
  "Temp DB remains for audit: yes",
  "No product/helper code changed",
]);

console.log("PASS browser:perspective-memory-reuse-live-data-dogfood-harness-rerun");

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeWhitespace(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeWhitespace(snippet)),
      `browser report must include: ${snippet}`,
    );
  }
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
