import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const observationDocPath = "docs/AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md";
const bootstrapDocPath = "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md";
const scenarioPackPath = "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md";
const resultReportTemplatePath = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [
  observationDocPath,
  bootstrapDocPath,
  scenarioPackPath,
  resultReportTemplatePath,
  runbookPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observationDoc = readFileSync(observationDocPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:research-work-user-happy-path-observation-v0-1"],
  "node scripts/smoke-research-work-user-happy-path-observation-v0-1.mjs",
  "package.json must expose the research work user happy path observation smoke",
);

assertObservationDoc();
assertRunbookPointer();
assertNoForbiddenAuthorityPatterns(`${observationDoc}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "research-work-user-happy-path-observation-v0-1",
      observation_doc_present: true,
      ag_dogfood_research_reference: true,
      worker_bootstrap_reference: true,
      codex_next_work_reference: true,
      scenario_pack_reference: true,
      result_report_template_reference: true,
      codex_result_text_paste_reference: true,
      user_facing_happy_path_steps_checked: true,
      user_friction_assessment_checked: true,
      codex_worker_friction_assessment_checked: true,
      result_return_friction_assessment_checked: true,
      live_work_picker_brief_run_state_checked: true,
      exactly_one_next_pr_candidate_selected: true,
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
    /^# Augnes Research Work User Happy Path Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Scenario Purpose",
    "## User Role",
    "## Run Mode",
    "## Explicit Statement Of What Was Not Run",
    "## User-Facing Happy Path",
    "## User-Facing Questions Answered",
    "## User Friction Assessment",
    "## Codex Worker Friction Assessment",
    "## Result Return Friction Assessment",
    "## What Became Clear",
    "## What Remains Confusing",
    "## Candidate Next PR Selection",
    "## Why Selected",
    "## Why Other Candidates Are Deferred",
    "## Authority Boundaries",
    "## Skipped Checks And Concrete Reasons",
    "## Remaining Caveats",
    "## Next Recommended Step",
  ]) {
    assert.match(observationDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `doc must include ${heading}`);
  }

  for (const requiredText of [
    "2026-06-17",
    "`da683ce`",
    "AG-DOGFOOD-RESEARCH-001",
    "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md",
    "npm run codex:next-work",
    "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "codexResultText",
    "codexResultPaste",
    "Run mode: deterministic observation.",
    "Live Work Picker / Work Brief was skipped.",
    "runtime_not_configured",
    "source",
    "repo_seed_fallback",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(requiredText)), `doc must include ${requiredText}`);
  }

  for (const step of [
    "### Step 1: User finds research work",
    "### Step 2: User opens Work Brief / Work Contract Card",
    "### Step 3: User copies Core Handoff or uses Codex bootstrap",
    "### Step 4: Codex identifies AG-DOGFOOD-RESEARCH-001 through codex:next-work",
    "### Step 5: Codex produces and returns result report",
    "### Step 6: User pastes result through codexResultText / codexResultPaste",
    "### Step 7: Augnes preview review expectation",
  ]) {
    assert.match(observationDoc, new RegExp(`^${escapeRegExp(step)}$`, "m"), `doc must include ${step}`);
  }

  for (const happyPathText of [
    "find research work",
    "open Work Brief / Work Contract Card",
    "copy Core Handoff or use Codex bootstrap",
    "Core Handoff is preferred",
    "Codex returns result report",
    "Codex produces and returns result report",
    "paste result for Augnes preview review",
    "preview-only",
    "Can the user tell which research work item to pick?",
    "Can the user tell what the next action is?",
    "Can the user tell whether Codex should use Core Handoff or `codex:next-work`?",
    "Can the user tell where Codex result output should be pasted?",
    "Can the user understand that the review is preview-only?",
    "Can the user tell what is not implemented yet?",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(happyPathText)), `doc must include ${happyPathText}`);
  }

  assert.equal(
    countMatches(observationDoc, /Selected next PR candidate:/g),
    1,
    "observation doc must choose exactly one selected next PR candidate",
  );
  assert.match(
    observationDoc,
    /Selected next PR candidate: live Work Picker \/ Work Brief observation for\s+`AG-DOGFOOD-RESEARCH-001` with a local temp runtime and no product-surface\s+expansion\./,
    "observation doc must select the live Work Picker / Work Brief observation follow-up",
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
    /AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1\.md/,
    "runbook must point to the observation doc",
  );
  assert.match(
    runbook,
    /smoke:research-work-user-happy-path-observation-v0-1/,
    "runbook must point to the observation smoke",
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
  const marker = "AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md";
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
