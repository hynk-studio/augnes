import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const reportFile =
  "reports/dogfood/2026-06-14-perspective-memory-reuse-intake-dogfood.md";
const reportSmokeFile =
  "scripts/smoke-perspective-memory-reuse-intake-dogfood-report.mjs";
const tempDbPath =
  "/tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db";
const taskString =
  "Review whether Perspective Memory Reuse Intake v0.1 produces a useful Codex Memory Brief for the next bounded Augnes development slice, and identify any ranking, warning copy, no-match, or compact-brief friction.";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(reportFile, "utf8");

assertStaticFilesAndScripts();
assertDogfoodReport();
assertBoundary();

console.log("PASS smoke:perspective-memory-reuse-intake-dogfood-report");

function assertStaticFilesAndScripts() {
  for (const file of [reportFile, reportSmokeFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-intake-dogfood-report"],
    "node scripts/smoke-perspective-memory-reuse-intake-dogfood-report.mjs",
  );
}

function assertDogfoodReport() {
  assertIncludesAll(reportText, [
    "# Dogfood Perspective Memory Reuse Intake v0.1",
    "PR #565 was merged into `main`",
    "PASS with follow-up",
    "npm run perspective:memory-reuse-intake",
    tempDbPath,
    taskString,
    "selected_item_count: 3",
    "candidate_source.total_items_read: 5",
    "perspective-memory-item:compact-brief-guidance-accepted",
    "perspective-memory-item:intake-command-v0-1-accepted",
    "perspective-memory-item:intake-warning-copy-reviewing",
    "perspective-memory-item:superseded-no-match-copy-sketch",
    "perspective-memory-item:deprecated-storage-first-intake-sketch",
    "why_selected",
    "Matched task keywords",
    "reuse_boundary",
    "Reuse only as bounded Augnes prior context",
    "Codex Memory Brief",
    "quality_review_preview_summary",
    "preview_state: needs_operator_review",
    "compact_brief_recommended: true",
    "large_selection_warning: true",
    "Warning behavior was correct",
    "Did the command avoid opening the reuse workspace manually? Yes.",
    "Did it select plausible memory items? Yes, with ranking caveat.",
    "Did no-match or low-match output need better copy? Yes.",
    "Did this reveal any reason for storage/persistence? No.",
    "`--brief` output",
    "paste-ready",
    "No-Match Probe",
    "Verification",
    "Skipped Checks With Concrete Reasons",
    "Next recommended PR",
    "Perspective Memory Reuse Intake v0.2 ranking and copy polish",
    "Do not add storage or persistence",
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
    "no Augnes state commit/reject authority",
    "no runtime authority",
    "no setup/prepare polish",
    "no proof/evidence writes",
    "no perspective-memory persistence writes",
    "no reuse packet persistence",
    "no return binding persistence",
    "no quality review persistence",
    "no product boundary creation",
    "no automatic synthesis",
    "no default/user DB writes",
    "no hidden background daemons",
    "Default/user DB validation skipped because this dogfood required an explicit known DB path",
    "Browser/runtime validation skipped because this is a local CLI intake command",
    "MCP bridge startup skipped because the command must not require bridge behavior",
    "Provider/model checks skipped because the boundary prohibits provider/model calls.",
    "OpenAI API calls skipped because the boundary prohibits OpenAI API calls.",
    "Codex SDK execution skipped because the boundary prohibits Codex SDK execution.",
    "GitHub mutation from scripts skipped because scripts must not mutate GitHub.",
    "Product/helper/CLI code changes skipped because dogfood did not reveal a blocker",
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
