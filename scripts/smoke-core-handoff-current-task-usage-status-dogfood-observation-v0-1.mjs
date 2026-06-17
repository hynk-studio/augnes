import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const observationPath = "docs/AUGNES_CORE_HANDOFF_CURRENT_TASK_USAGE_STATUS_DOGFOOD_OBSERVATION_V0_1.md";
const serverPath = "apps/augnes_apps/src/server.ts";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const workLoopSmokePath = "scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs";
const packagePath = "package.json";

for (const filePath of [observationPath, serverPath, runbookPath, workLoopSmokePath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observation = readFileSync(observationPath, "utf8");
const server = readFileSync(serverPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const workLoopSmoke = readFileSync(workLoopSmokePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const normalizedObservation = normalizeWhitespace(observation);

assert.equal(
  packageJson.scripts?.["smoke:core-handoff-current-task-usage-status-dogfood-observation-v0-1"],
  "node scripts/smoke-core-handoff-current-task-usage-status-dogfood-observation-v0-1.mjs",
  "package.json must expose the usage-status dogfood observation smoke",
);

for (const heading of [
  "# Augnes Core Handoff Current Task Usage Status Dogfood Observation v0.1",
  "## Date",
  "## Baseline Commit",
  "## Source Behavior",
  "## Run Mode",
  "## Explicit Statement Of What Was Not Run",
  "## Work Item / Fixture Used",
  "## Compact Section Excerpt",
  "## core_current_task_only Structured Object Observed",
  "## Implementation-ready Interpretation",
  "## Missing-anchor Fallback Interpretation",
  "## Dogfood Assessment",
  "## Candidate Next PR Selection",
  "## Why Selected",
  "## Why Other Candidates Are Deferred",
  "## Authority Boundaries",
  "## Skipped Checks And Concrete Reasons",
  "## Remaining Caveats",
  "## Next Recommended Step",
]) {
  assert.match(observation, new RegExp(escapeRegExp(heading)), `observation doc must include ${heading}`);
}

for (const requiredText of [
  "PR #614",
  "Core usage",
  "Implementation anchors",
  "core_current_task_only",
  "core_usage",
  "implementation_anchor_status",
  "implementation_anchor_count",
  "implementation_anchor_summary",
  "full_context_required_before_implementation",
  "deterministic Core Handoff usage-status observation",
  "No live Codex session was run.",
  "No live MCP Inspector session was started.",
  "No ChatGPT Developer Mode session was started.",
  "AG-006",
  "implementation_ready",
  "planning only / full context needed",
  "Full Context needed",
  "no invented implementation target",
  "does not grant automatic implementation authority",
  "broader Core usage and implementation anchors sections remain useful",
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "codexResultText / codexResultPaste",
  "no blocking compact-handoff issue was observed",
]) {
  assert.match(observation, new RegExp(escapeRegExp(requiredText), "i"), `observation doc must include ${requiredText}`);
}

const selectedCandidateMatches = observation.match(/Selected next PR candidate:/g) ?? [];
assert.equal(selectedCandidateMatches.length, 1, "observation must select exactly one next PR candidate");
assert.match(
  observation,
  /Selected next PR candidate:\s+Add preview-only Research Accumulation Scenario Pack\s+doc\/smoke\./,
  "selected next PR candidate must be Research Accumulation Scenario Pack doc/smoke",
);
assert.doesNotMatch(
  observation,
  /a blocking compact-handoff issue was observed/i,
  "observation must not document an affirmative compact-handoff blocker",
);

for (const authorityBoundary of [
  "no automatic Codex execution",
  "no automatic report generation",
  "no automatic GitHub fetch",
  "no proof/evidence write",
  "no work close/status mutation",
  "no event creation/mutation",
  "no state commit/reject",
  "no shell execution from App/MCP",
  "no provider/OpenAI calls",
  "no branch/PR creation from App/MCP code",
  "no PR review submission",
  "no merge/publish/retry/replay/deploy controls",
  "no DB migration",
  "no new user-facing App/MCP tools",
  "no widening of the work_loop_readonly Developer Mode tool surface",
]) {
  assert.match(
    normalizedObservation,
    new RegExp(escapeRegExp(authorityBoundary), "i"),
    `observation doc must preserve authority boundary: ${authorityBoundary}`,
  );
}

for (const sourceKey of [
  "core_usage",
  "implementation_anchor_status",
  "implementation_anchor_count",
  "implementation_anchor_summary",
  "full_context_required_before_implementation",
]) {
  assert.match(server, new RegExp(escapeRegExp(sourceKey)), `server source must still include ${sourceKey}`);
  assert.match(workLoopSmoke, new RegExp(escapeRegExp(sourceKey)), `work-loop smoke fixture must still include ${sourceKey}`);
}

for (const sourceText of [
  "Core usage:",
  "Implementation anchors:",
  "planning only / full context needed",
  "none attached; open Full Context before implementation.",
]) {
  assert.match(server, new RegExp(escapeRegExp(sourceText)), `server source must still include ${sourceText}`);
}

for (const fixtureText of [
  "Core usage: implementation_ready",
  "Implementation anchors: 2 attached; Implementation file/schema anchors are attached in Core; confirm them with codex:read-brief before editing.",
  "implementation_anchor_status: \"attached\"",
  "implementation_anchor_count: 2",
  "full_context_required_before_implementation: false",
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "Paste through codexResultText / codexResultPaste for preview review.",
]) {
  assert.match(workLoopSmoke, new RegExp(escapeRegExp(fixtureText)), `AG-006 fixture must still include ${fixtureText}`);
}

for (const observationText of [
  "Core usage: implementation_ready",
  "Implementation anchors: 2 attached; Implementation file/schema anchors are attached in Core; confirm them with codex:read-brief before editing.",
  "\"implementation_anchor_status\": \"attached\"",
  "\"implementation_anchor_count\": 2",
  "\"full_context_required_before_implementation\": false",
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "Paste through codexResultText / codexResultPaste for preview review.",
]) {
  assert.match(observation, new RegExp(escapeRegExp(observationText)), `observation doc must record ${observationText}`);
}

for (const delimiter of ["BEGIN_AUGNES_CODEX_HANDOFF_JSON", "END_AUGNES_CODEX_HANDOFF_JSON"]) {
  assert.match(workLoopSmoke, new RegExp(escapeRegExp(delimiter)), `work-loop fixture must preserve ${delimiter}`);
}
assert.match(observation, /separate Full Context copy path/, "observation doc must record the separate Full Context copy path");

assert.match(
  runbook,
  /AUGNES_CORE_HANDOFF_CURRENT_TASK_USAGE_STATUS_DOGFOOD_OBSERVATION_V0_1\.md/,
  "runbook must point to the usage-status dogfood observation",
);
assert.match(
  runbook,
  /Research Accumulation Scenario Pack doc\/smoke/,
  "runbook pointer must record the selected next narrow pass",
);

assertNoForbiddenAuthorityPatterns([observation, runbook].join("\n\n"));

console.log(
  JSON.stringify(
    {
      smoke: "core-handoff-current-task-usage-status-dogfood-observation-v0-1",
      observation_doc_present: true,
      source_behavior_referenced: true,
      live_sessions_skipped_honestly: true,
      implementation_ready_interpretation_present: true,
      missing_anchor_fallback_present: true,
      selected_next_pr_candidate: "Add preview-only Research Accumulation Scenario Pack doc/smoke",
      authority_boundaries_present: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertNoForbiddenAuthorityPatterns(source) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile\s*\(/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bGITHUB_TOKEN\b/,
    /\bOPENAI_API_KEY\b/,
    /\bcreatePullRequest\b/i,
    /\bcreateBranch\b/i,
    /\bsubmitReview\b/i,
    /\bmerge\s*\(/i,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\bcommitStateUpdate\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `feature/doc source must not include forbidden authority pattern ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ");
}
