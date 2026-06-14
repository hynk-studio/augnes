import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const reportFile =
  "reports/dogfood/2026-06-14-perspective-memory-reuse-quality-review-dogfood.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(reportFile, "utf8");

assertStaticFilesAndScript();
assertDogfoodReport();

console.log("PASS smoke:perspective-memory-reuse-quality-review-dogfood-report");

function assertStaticFilesAndScript() {
  assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-memory-reuse-quality-review-dogfood-report"
    ],
    "node scripts/smoke-perspective-memory-reuse-quality-review-dogfood-report.mjs",
  );
}

function assertDogfoodReport() {
  assertIncludesAll(reportText, [
    "# Dogfood Perspective Memory Reuse Quality Review v0.1",
    "PR #561 is the prerequisite",
    "perspective-memory-item:reuse-live-data-accepted",
    "perspective-memory-item:reuse-live-data-follow-up",
    "why_selected",
    "reuse_boundary",
    "\"validation_state\": \"PASS\"",
    "\"relevance_review_state\": \"reviewable\"",
    "\"validation_state\": \"PASS with follow-up\"",
    "\"relevance_review_state\": \"needs_operator_review\"",
    "\"stale_or_misleading_risk\": \"needs_operator_review\"",
    "aggregate_summary",
    "Operator review required before treating reuse as high-quality.",
    "no semantic truth claim",
    "no persistence/storage",
    "no DB schema",
    "no provider/model",
    "no OpenAI API",
    "no MCP tool",
    "no Codex SDK",
    "no GitHub mutation",
    "no Augnes state commit/reject authority",
    "quality review persistence",
    "No product/helper/UI code changed",
    "Next recommended PR",
    "thin read-only UI panel",
    "Do not add quality review persistence unless repeated dogfood produces a concrete product reason.",
  ]);
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(text.includes(snippet), `expected report to include ${snippet}`);
  }
}
