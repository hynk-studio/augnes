import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const reportFile =
  "reports/dogfood/2026-06-14-codex-augnes-reuse-hook-dogfood.md";
const smokeFile = "scripts/smoke-codex-augnes-reuse-hook-dogfood-report.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFile(reportFile);

assertStaticFilesAndScripts();
assertReportShape();
assertRequiredDogfoodResults();
assertBoundary();

console.log("PASS smoke:codex-augnes-reuse-hook-dogfood-report");

function assertStaticFilesAndScripts() {
  for (const file of [reportFile, smokeFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:codex-augnes-reuse-hook-dogfood-report"],
    "node scripts/smoke-codex-augnes-reuse-hook-dogfood-report.mjs",
  );
}

function assertReportShape() {
  assertIncludesAll(reportText, [
    "# Dogfood Codex Augnes Reuse Hook v0.1",
    "## Summary",
    "## Environment",
    "## Prerequisite / PR #568 merge check",
    "## Hook trust review",
    "## Real Codex session result",
    "## Fallback fixture execution result, if used",
    "## Root cwd prompt result",
    "## Nested cwd prompt result",
    "## Opt-out prompt result",
    "## Casual prompt result",
    "## Duplicate-context prompt result",
    "## Korean prompt result",
    "## Fail-open result",
    "## Additional context quality",
    "## Boundary",
    "## Verification",
    "## Skipped checks with concrete reasons",
    "## Cleanup status",
    "## Remaining friction",
    "## Next recommended PR",
  ]);
}

function assertRequiredDogfoodResults() {
  assertIncludesAll(reportText, [
    "PR #568 was merged into `main`",
    "Merge pull request #568",
    ".codex/hooks.json",
    ".codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs",
    "UserPromptSubmit",
    "/hooks",
    "interactive `/hooks` trust review",
    "not real Codex session validation",
    "Real Codex hook execution was not observed",
    "Codex Augnes Reuse Context",
    "Generated Codex Memory Brief",
    "Selected Memory IDs",
    "selected_item_count: 0",
    "selected memory IDs",
    "why_selected",
    "reuse_boundary",
    "quality_review_preview_summary",
    "warnings",
    "Warnings",
    "Authority Boundary",
    "Closeout Expectations",
    "additionalContext",
    "12000",
    "4548",
    "4068",
    "No-Match Guidance",
    "no_match_state: store_read_zero_items",
    "root cwd",
    "nested cwd",
    "apps/augnes_apps",
    "git root detection",
    "skip augnes reuse",
    "thanks",
    "Duplicate brief detection skipped injection",
    "Augnes reuse hook dogfood 보고서 추가해줘",
    "Korean/non-English prompt filtering remains",
    "Perspective Memory Reuse Intake failed open: spawnSync npm ENOENT",
    "Did the hook make Codex use Augnes memory by default?",
    "No storage/persistence is needed",
    "hook trust/copy/filter dogfood polish",
    "package script wiring",
    "smoke:codex-augnes-reuse-hook-dogfood-report",
  ]);
}

function assertBoundary() {
  assertIncludesAll(reportText, [
    "This PR is dogfood/report/smoke/package only.",
    "no provider/model calls",
    "no OpenAI API calls",
    "no MCP tool calls",
    "no Codex SDK execution",
    "no GitHub mutation from scripts",
    "no persistence writes",
    "no DB schema or migration",
    "no automatic memory creation",
    "no memory item mutation",
    "no runtime startup",
    "no MCP bridge startup",
    "no reuse packet persistence",
    "no return binding persistence",
    "no quality review persistence",
    "no product boundary creation",
    "no automatic synthesis",
    "no default/user DB writes",
    "no hidden background daemons",
    "no Augnes state commit/reject authority",
    "no proof/evidence writes",
    "no setup/prepare polish",
    "no hook/product/helper code changes",
    "Real Codex `/hooks` trust review skipped because",
    "Browser/runtime validation skipped because",
    "MCP bridge startup skipped because",
    "Provider/model checks skipped because",
    "OpenAI API calls skipped because",
    "Codex SDK execution skipped because",
    "GitHub mutation from scripts skipped because",
    "Product/helper/hook code changes skipped because",
  ]);
}

function readFile(filePath) {
  assert.equal(existsSync(filePath), true, `${filePath} must exist`);
  return readFileSync(filePath, "utf8");
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
