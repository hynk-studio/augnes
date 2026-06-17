import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const observationDocPath = "docs/AUGNES_CORE_HANDOFF_CURRENT_TASK_DOGFOOD_OBSERVATION_V0_1.md";
const resultTemplatePath = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
const serverPath = "apps/augnes_apps/src/server.ts";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const workLoopSmokePath = "scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs";
const packagePath = "package.json";

for (const filePath of [observationDocPath, resultTemplatePath, serverPath, runbookPath, workLoopSmokePath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observationDoc = readFileSync(observationDocPath, "utf8");
const server = readFileSync(serverPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const workLoopSmoke = readFileSync(workLoopSmokePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:core-handoff-current-task-dogfood-observation-v0-1"],
  "node scripts/smoke-core-handoff-current-task-dogfood-observation-v0-1.mjs",
  "package.json must expose the Core Handoff current-task dogfood observation smoke script",
);

assertObservationDoc();
assertSourceBehaviorStillPresent();
assertNoForbiddenAuthorityPatterns(
  [
    observationDoc,
    runbookPointer(runbook),
  ].join("\n\n"),
);

console.log(
  JSON.stringify(
    {
      smoke: "core-handoff-current-task-dogfood-observation-v0-1",
      observation_doc_present: true,
      current_task_only_referenced: true,
      core_current_task_only_referenced: true,
      result_report_template_referenced: true,
      manual_return_path_referenced: true,
      live_run_skips_explicit: true,
      compact_subsection_fields_documented: true,
      broader_context_preservation_documented: true,
      exactly_one_next_pr_candidate_selected: true,
      authority_boundaries_present: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertObservationDoc() {
  assert.match(
    observationDoc,
    /^# Augnes Core Handoff Current Task Dogfood Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Source Behavior",
    "## Run Mode",
    "## Explicit Statement Of What Was Not Run",
    "## Work Item / Fixture Used",
    "## Core Handoff Text Used",
    "## core_current_task_only Structured Object Observed",
    "## Compact Subsection Checks",
    "## Broader Context Preservation",
    "## Dogfood Assessment",
    "## Candidate Next PR Selection",
    "## Why Selected",
    "## Why Other Candidates Are Deferred",
    "## Authority Boundaries",
    "## Skipped Checks And Concrete Reasons",
    "## Remaining Caveats",
    "## Next Recommended Step",
  ]) {
    assert.match(observationDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `observation doc must include ${heading}`);
  }

  for (const requiredText of [
    "2026-06-17",
    "`d49a3ce`",
    "Core Handoff current task only compact subsection from PR #612",
    "Run mode: deterministic Core Handoff copy observation.",
    "No live Codex session was run.",
    "No live MCP Inspector session was started.",
    "No ChatGPT Developer Mode session was started.",
    "No `npm run codex:read-brief` runtime brief was run.",
    "AG-006",
    "Current task only",
    "core_current_task_only",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "codexResultText / codexResultPaste",
    "implementation_ready",
    "lib/coordination-events.ts",
    "app/api/work/[work_id]/brief/route.ts",
    "No implementation file/schema anchors are attached in Core",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(requiredText)), `observation doc must include ${requiredText}`);
  }

  for (const compactField of [
    "Work ID",
    "Scope",
    "Task",
    "Expected files",
    "Expected checks",
    "Stop if",
    "Authority boundary",
    "Return result using",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(compactField)), `observation doc must document ${compactField}`);
  }

  for (const broaderContext of [
    "Immediate task context",
    "Core usage",
    "Implementation anchors",
    "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
    "END_AUGNES_CODEX_HANDOFF_JSON",
    "Full Context copy path remains separate",
    "Copy Full Context",
    "full_codex_handoff_packet",
    "copyable_full_handoff_text",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(broaderContext)), `observation doc must document broader context: ${broaderContext}`);
  }

  assert.equal(
    countMatches(observationDoc, /Selected next PR candidate:/g),
    1,
    "observation doc must choose exactly one selected next PR candidate",
  );
  assert.match(
    observationDoc,
    /Selected next PR candidate: add Core usage \/ implementation anchor status line\s+to Current task only\./,
    "observation doc must select the Core usage / implementation anchor status follow-up",
  );
  assert.match(
    observationDoc,
    /not implementing the\s+next research surface artifact/,
    "observation doc must defer the research scenario pack follow-up",
  );
  assert.match(
    observationDoc,
    /no live MCP Inspector \/ ChatGPT Developer Mode host was available/,
    "observation doc must defer live Developer Mode observation with a concrete reason",
  );

  for (const boundary of [
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
    assert.match(observationDoc, looseTextPattern(boundary), `observation doc must include boundary ${boundary}`);
  }
}

function assertSourceBehaviorStillPresent() {
  const coreTextBuilder = extractFunction(server, "buildCoreCodexHandoffText");
  const coreJsonBlockBuilder = extractFunction(server, "buildCoreCodexHandoffJsonBlock");

  assert.match(server, /core_current_task_only: coreCodexHandoffPacket\.core_current_task_only/, "work brief structured content must expose core_current_task_only");
  assert.match(coreJsonBlockBuilder, /core_current_task_only: packet\.core_current_task_only/, "Core JSON must expose core_current_task_only");
  for (const compactLabel of [
    "Current task only",
    "Work ID:",
    "Scope:",
    "Task:",
    "Expected files:",
    "Expected checks:",
    "Stop if:",
    "Authority boundary:",
    "Return result using:",
  ]) {
    assert.match(coreTextBuilder, new RegExp(escapeRegExp(compactLabel)), `Core text builder must still emit ${compactLabel}`);
  }
  assert.match(server, /docs\/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1\.md/, "server must still reference the result report template");
  assert.match(server, /codexResultText \/ codexResultPaste/, "server must still reference the manual result return path");
  assert.match(server, /full_codex_handoff_packet: finalCodexHandoffPacket/, "Full Context packet alias must remain separate");
  assert.match(server, /copyable_full_handoff_text: finalCodexHandoffPacket\.copyable_handoff_text/, "Full Context copy text must remain separate");

  for (const fixtureText of [
    "AG-006",
    "implementation_ready",
    "Verify the preview-only ChatGPT-Codex work loop snapshot.",
    "core_current_task_only",
    "Current task only",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "codexResultText / codexResultPaste",
    "lib/coordination-events.ts",
    "app/api/work/[work_id]/brief/route.ts",
  ]) {
    assert.match(workLoopSmoke, new RegExp(escapeRegExp(fixtureText)), `work-loop smoke fixture must include ${fixtureText}`);
  }

  assert.match(
    runbook,
    /AUGNES_CORE_HANDOFF_CURRENT_TASK_DOGFOOD_OBSERVATION_V0_1\.md/,
    "runbook must point to the Core Handoff current-task dogfood observation",
  );
}

function extractFunction(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const signatureEnd = source.indexOf(")", start);
  assert.notEqual(signatureEnd, -1, `${name} must have a parameter list`);
  const openBrace = source.indexOf("{", signatureEnd);
  assert.notEqual(openBrace, -1, `${name} must have a body`);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${name} body did not terminate`);
}

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

function runbookPointer(source) {
  const marker = "AUGNES_CORE_HANDOFF_CURRENT_TASK_DOGFOOD_OBSERVATION_V0_1.md";
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, "runbook pointer must exist");
  return source.slice(Math.max(0, markerIndex - 700), markerIndex + 700);
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function looseTextPattern(value) {
  return new RegExp(value.trim().split(/\s+/).map(escapeRegExp).join("\\s+"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
