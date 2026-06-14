import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-14-perspective-memory-reuse-live-data-dogfood.md";
const routePath = "/cockpit/perspective/memory-items/reuse";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");

assertIncludesAll(report, [
  "Perspective Memory Reuse Live-Data Dogfood Browser Validation",
  "PR #556 was merged into `main`",
  "seeded persisted memory rows",
  tempDbPath,
  routePath,
  "route loads: yes",
  "seeded rows visible: yes",
  "selected count reached 2",
  "task title entered",
  "task description entered",
  "why_selected entered",
  "reuse_boundary entered",
  "structured packet JSON generated: yes",
  "structured packet JSON includes selected seeded item IDs: yes",
  "Codex Memory Brief generated: yes",
  "Codex Memory Brief includes task title: yes",
  "Codex Memory Brief includes memory titles: yes",
  "Codex Memory Brief includes why relevant notes derived from why_selected: yes",
  "Codex Memory Brief includes boundary notes derived from reuse_boundary: yes",
  "Codex Memory Brief includes Return Expectations: yes",
  "copy buttons present: yes",
  "Forbidden-Control Absence",
  "data-augnes-create-perspective-memory-item",
  "data-augnes-create-core-decision",
  "data-augnes-auto-inject-runtime",
  "data-augnes-provider-model-enrich",
  "data-augnes-github-mutation",
  "1280px, 768px, and 390px viewports had no horizontal overflow",
  "Runtime stopped: yes",
  "No listener status: no process remained listening on TCP port 3000",
  "Temp DB remains for audit: yes",
  "No product/helper code changed",
]);

console.log("PASS browser:perspective-memory-reuse-live-data-dogfood");

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
