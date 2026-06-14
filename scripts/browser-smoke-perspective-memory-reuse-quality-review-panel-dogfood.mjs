import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-14-perspective-memory-reuse-quality-review-panel-dogfood.md";
const routePath = "/cockpit/perspective/memory-items/reuse";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-quality-review-panel-dogfood/augnes.db";
const seededItemIds = [
  "perspective-memory-item:reuse-live-data-accepted",
  "perspective-memory-item:reuse-live-data-follow-up",
];

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");

assertIncludesAll(report, [
  "Perspective Memory Reuse Quality Review Panel Dogfood",
  "PR #563 was merged into `main`",
  "Seed harness command:",
  "perspective:memory-reuse-live-data-dogfood-seed",
  tempDbPath,
  routePath,
  "route loaded: yes",
  "seeded rows visible: yes",
  "selected count reached `2`",
  "quality review panel rendered: yes",
  "dogfood_route_status: not_applicable",
  "quality_review_preview_state: needs_operator_review",
  "PASS seeded item rendered as mechanically reviewable",
  "PASS-with-follow-up seeded item rendered as needing operator review",
  "has_why_selected: yes",
  "has_reuse_boundary: yes",
  "compact_brief_recommended: yes",
  "large_selection_warning: no",
  "mechanical checks only",
  "no semantic truth claim",
  "existing structured packet JSON remained available: yes",
  "existing Codex Memory Brief remained available: yes",
  "existing brief metadata remained visible: yes",
  "Forbidden-Control Absence",
  "no unexpected external requests: yes",
  "Runtime stopped: yes",
  "No listener status: no process remained listening on TCP port 3000",
  "Cleanup Status",
  "Verification",
  "Skipped Checks With Concrete Reasons",
  "Next recommended PR",
  "No product/helper/UI code changed",
]);

assertIncludesAll(report, seededItemIds);
assertIncludesAll(report, [
  "data-augnes-create-perspective-memory-item",
  "data-augnes-send-to-core",
  "data-augnes-create-core-decision",
  "data-augnes-auto-inject-runtime",
  "data-augnes-auto-promote",
  "data-augnes-provider-model-enrich",
  "data-augnes-github-mutation",
  "data-augnes-commit-state-entry",
  "data-augnes-create-quality-review",
  "data-augnes-persist-quality-review",
  "data-augnes-write-quality-review",
  "data-augnes-quality-review-storage",
]);

console.log("PASS browser:perspective-memory-reuse-quality-review-panel-dogfood");

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
