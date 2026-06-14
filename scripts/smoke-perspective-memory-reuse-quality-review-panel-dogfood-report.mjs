import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const browserReportFile =
  "reports/browser/2026-06-14-perspective-memory-reuse-quality-review-panel-dogfood.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-reuse-quality-review-panel-dogfood.mjs";
const reportSmokeFile =
  "scripts/smoke-perspective-memory-reuse-quality-review-panel-dogfood-report.mjs";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-quality-review-panel-dogfood/augnes.db";
const routePath = "/cockpit/perspective/memory-items/reuse";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(browserReportFile, "utf8");

assertStaticFilesAndScripts();
assertReportContract();
assertBoundary();

console.log("PASS smoke:perspective-memory-reuse-quality-review-panel-dogfood-report");

function assertStaticFilesAndScripts() {
  for (const file of [browserReportFile, browserSmokeFile, reportSmokeFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts[
      "browser:perspective-memory-reuse-quality-review-panel-dogfood"
    ],
    "node scripts/browser-smoke-perspective-memory-reuse-quality-review-panel-dogfood.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-memory-reuse-quality-review-panel-dogfood-report"
    ],
    "node scripts/smoke-perspective-memory-reuse-quality-review-panel-dogfood-report.mjs",
  );
}

function assertReportContract() {
  assertIncludesAll(reportText, [
    "Perspective Memory Reuse Quality Review Panel Dogfood",
    "PR #563 was merged into `main`",
    "Seed harness command:",
    "perspective:memory-reuse-live-data-dogfood-seed",
    tempDbPath,
    routePath,
    "route loaded: yes",
    "seeded rows visible: yes",
    "perspective-memory-item:reuse-live-data-accepted",
    "perspective-memory-item:reuse-live-data-follow-up",
    "quality review panel rendered: yes",
    "dogfood_route_status: not_applicable",
    "quality_review_preview_state: needs_operator_review",
    "PASS seeded item rendered as mechanically reviewable",
    "PASS-with-follow-up seeded item rendered as needing operator review",
    "why_selected",
    "reuse_boundary",
    "mechanical checks only",
    "no semantic truth claim",
    "existing structured packet JSON remained available: yes",
    "existing Codex Memory Brief remained available: yes",
    "existing brief metadata remained visible: yes",
    "Forbidden-Control Absence",
    "Runtime stopped: yes",
    "No listener status",
    "Cleanup Status",
    "Verification",
    "Skipped Checks With Concrete Reasons",
    "Next recommended PR",
    "No product/helper/UI code changed",
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
    "Product/helper/UI code changes skipped because browser/report validation was sufficient and no blocker was found.",
    "This PR does not add runtime authority, DB schema changes, migrations beyond existing setup/seed paths, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes outside explicit temp DB seed dogfood setup, reuse packet persistence, return binding persistence, quality review persistence, product boundary creation, automatic synthesis, automatic memory creation outside explicit seed setup, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority.",
    "Do not add quality review persistence",
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
