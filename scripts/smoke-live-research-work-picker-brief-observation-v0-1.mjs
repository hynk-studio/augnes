import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const observationDocPath = "docs/AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md";
const priorObservationPath = "docs/AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md";
const bootstrapDocPath = "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [observationDocPath, priorObservationPath, bootstrapDocPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observationDoc = readFileSync(observationDocPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:live-research-work-picker-brief-observation-v0-1"],
  "node scripts/smoke-live-research-work-picker-brief-observation-v0-1.mjs",
  "package.json must expose the live research Work Picker / Brief observation smoke",
);

assertObservationDoc();
assertRunbookPointer();
assertNoForbiddenAuthorityPatterns(`${observationDoc}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "live-research-work-picker-brief-observation-v0-1",
      observation_doc_present: true,
      ag_dogfood_research_reference: true,
      prior_happy_path_reference: true,
      worker_bootstrap_reference: true,
      codex_next_work_reference: true,
      codex_result_text_paste_reference: true,
      run_mode_and_runtime_setup_checked: true,
      work_picker_observed_or_skipped_checked: true,
      work_brief_opened_or_skipped_checked: true,
      core_handoff_visible_or_skipped_checked: true,
      preview_no_write_boundary_visible_or_skipped_checked: true,
      final_ux_polish_decision_checked: true,
      exactly_one_next_recommended_step_section: true,
      authority_boundaries_present: true,
      forbidden_authority_patterns_absent: true,
      package_script_checked: true,
      runbook_pointer_checked: true,
    },
    null,
    2,
  ),
);

function assertObservationDoc() {
  assert.match(
    observationDoc,
    /^# Augnes Live Research Work Picker Brief Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Scenario Purpose",
    "## Run Mode",
    "## Runtime Setup Attempted",
    "## Commands Run",
    "## Live URL Or Host Used",
    "## Whether Work Picker Was Observed",
    "## Whether AG-DOGFOOD-RESEARCH-001 Was Visible",
    "## Whether Work Brief / Work Contract Card Was Opened",
    "## Whether Core Handoff Path Was Visible",
    "## Whether codex:next-work Fallback Was Checked",
    "## Whether codexResultText / codexResultPaste Result Return Path Was Visible",
    "## Whether Preview-only / No-write Boundary Was Visible",
    "## User/operator Friction Findings",
    "## Codex Worker Friction Findings",
    "## Result Return Friction Findings",
    "## What Passed",
    "## What Failed",
    "## What Was Skipped",
    "## Remaining Caveats",
    "## Authority Boundaries",
    "## Final UX Polish Decision",
    "## Next Recommended Step",
  ]) {
    assert.match(observationDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `doc must include ${heading}`);
  }

  for (const requiredText of [
    "2026-06-17",
    "`8651387`",
    "AG-DOGFOOD-RESEARCH-001",
    "docs/AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md",
    "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md",
    "npm run codex:next-work",
    "codexResultText",
    "codexResultPaste",
    "Run mode: live local-runtime observation",
    "Runtime setup succeeded",
    "Work Picker was observed",
    "Work Brief / Work Contract Card was opened",
    "Core Handoff path was visible",
    "Preview-only / no-write boundary was visible",
    "No blocking live-path issue found; pause general UX polish and proceed to",
    "Pause general UX polish and proceed to Research Accumulation preparation.",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(requiredText)), `doc must include ${requiredText}`);
  }

  assert.equal(
    countMatches(observationDoc, /^## Next Recommended Step$/gm),
    1,
    "observation doc must choose exactly one next recommended step section",
  );
  assert.match(
    observationDoc,
    /## Next Recommended Step\s+Pause general UX polish and proceed to Research Accumulation preparation\./,
    "next recommended step must be Research Accumulation preparation when no blocker is found",
  );

  for (const boundary of [
    "no paper ingestion",
    "no paper fetching",
    "no provider/OpenAI calls",
    "no embeddings/RAG/vector search",
    "no DB migration",
    "no durable research state write",
    "no proof/evidence write",
    "no work close/status mutation",
    "no event creation/mutation",
    "no state commit/reject",
    "no automatic Codex execution",
    "no automatic GitHub fetch/review/merge/publish",
    "no App/MCP tools",
    "no work_loop_readonly widening",
  ]) {
    assert.match(observationDoc, looseTextPattern(boundary), `doc must include authority boundary ${boundary}`);
  }
}

function assertRunbookPointer() {
  assert.match(
    runbook,
    /AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1\.md/,
    "runbook must point to the live observation doc",
  );
  assert.match(
    runbook,
    /smoke:live-research-work-picker-brief-observation-v0-1/,
    "runbook must point to the live observation smoke",
  );
}

function assertNoForbiddenAuthorityPatterns(source) {
  const exactNeedles = [
    ["child", "_process"],
    ["spawn", "("],
    ["exec", "("],
    ["execFile", "("],
    ["api.github", ".com"],
    ["api.openai", ".com"],
    ["GITHUB", "_TOKEN"],
    ["OPENAI", "_API_KEY"],
    ["create", "PullRequest"],
    ["create", "Branch"],
    ["submit", "Review"],
    ["merge", "("],
    ["record", "-proof"],
    ["record", "-evidence"],
    ["commit", "StateUpdate"],
    ["fetch", "("],
    ["XML", "HttpRequest"],
    ["Web", "Socket"],
    ["Event", "Source"],
  ].map((parts) => parts.join(""));
  const sqlNeedles = [
    ["CREATE", " TABLE"],
    ["ALTER", " TABLE"],
    ["INSERT", " INTO"],
  ].map((parts) => parts.join(""));

  for (const needle of exactNeedles) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(needle), "i"), `doc/runbook source must not contain ${needle}`);
  }
  for (const needle of sqlNeedles) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(needle), "i"), `doc/runbook source must not contain ${needle}`);
  }
}

function runbookPointer(source) {
  const marker = "AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 900), markerIndex + 1200);
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looseTextPattern(value) {
  return new RegExp(value.split(/\s+/).map(escapeRegExp).join("\\s+"));
}
