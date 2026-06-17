import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const observationDocPath = "docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_RUN_OBSERVATION_V0_1.md";
const scenarioDocPath = "docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md";
const dogfoodScenarioDocPath = "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md";
const dogfoodObservationDocPath = "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [
  observationDocPath,
  scenarioDocPath,
  dogfoodScenarioDocPath,
  dogfoodObservationDocPath,
  runbookPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observationDoc = readFileSync(observationDocPath, "utf8");
const scenarioDoc = readFileSync(scenarioDocPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:codex-self-opinion-dogfood-run-observation"],
  "node scripts/smoke-codex-self-opinion-dogfood-run-observation.mjs",
  "package.json must expose the Codex self-opinion run observation smoke script",
);

assertObservationDoc();
assertCopiedSampleReportMatchesScenario();
assertNoForbiddenAuthorityPatterns(`${observationDoc}\n\n${scenarioDoc}\n\n${selfOpinionRunbookNote(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "codex-self-opinion-dogfood-run-observation",
      observation_doc_present: true,
      source_scenario_referenced: true,
      prior_dogfood_artifacts_referenced: true,
      deterministic_sample_run_disclosed: true,
      advisory_only_interpretation_present: true,
      extracted_findings_counts_checked: true,
      exactly_one_next_pr_candidate_selected: true,
      deferred_candidates_explained: true,
      manual_return_path_present: true,
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
    /^# Augnes Codex Self-opinion Dogfood Run Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Source Scenario",
    "## Source Inputs",
    "## Run Mode",
    "## Explicit Statement Of What Was Not Run",
    "## Self-opinion Report Used",
    "## Extracted Findings",
    "## Advisory-only Interpretation",
    "## Candidate Next PR Selection",
    "## Why That Next PR Is Selected",
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
    "`f43c273`",
    "docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md",
    "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md",
    "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md",
    "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
    "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md",
    "Run mode: deterministic sample-run observation.",
    "Actual separate Codex session: not run.",
    "not live Codex feedback",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(requiredText)), `observation doc must include ${requiredText}`);
  }
  assert.match(
    observationDoc,
    /No separate user-started Codex\s+self-opinion output was available/,
    "observation doc must say no separate user-started Codex self-opinion output was available",
  );

  for (const notRun of [
    "No live Codex self-opinion session was run.",
    "No live Codex runner was added or invoked.",
    "No App/MCP tool was added.",
    "No App/MCP tool executed Codex.",
    "No live MCP Inspector session was started.",
    "No ChatGPT Developer Mode session was started.",
    "No provider/OpenAI call was made.",
    "No automatic GitHub fetch was performed.",
    "No proof/evidence rows were written.",
    "No Augnes state was mutated.",
    "No GitHub review or comment was submitted.",
    "No Research / Paper / Knowledge Accumulation surface was implemented.",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(notRun)), `observation doc must state ${notRun}`);
  }

  for (const findingHeading of [
    "### Handoff Clarity",
    "### Result Return Friction",
    "### Useful Criticisms",
    "### Over-automation Risks",
    "### Non-automation Boundaries To Preserve",
    "### Handoff Packet Improvements",
    "### Result Report Template Improvements",
    "### Research Accumulation Surface Recommendations",
    "### Concrete Next PR Candidates",
  ]) {
    assert.match(
      observationDoc,
      new RegExp(`^${escapeRegExp(findingHeading)}$`, "m"),
      `observation doc must include extracted finding ${findingHeading}`,
    );
  }

  assert.match(observationDoc, /Handoff clarity rating: `4\/5`/, "observation doc must include handoff clarity rating");
  assert.match(observationDoc, /Result return friction rating: `3\/5`/, "observation doc must include result return friction rating");
  assert.ok(countMatches(observationDoc, /- Criticism:/g) >= 3, "observation doc must include at least 3 useful criticisms");
  assert.ok(countMatches(observationDoc, /- Risk:/g) >= 3, "observation doc must include at least 3 over-automation risks");
  assert.ok(countMatches(observationDoc, /- Boundary:/g) >= 3, "observation doc must include at least 3 non-automation boundaries");
  assert.ok(countMatches(observationDoc, /- PR candidate:/g) >= 3, "observation doc must include at least 3 concrete next PR candidates");

  for (const advisoryText of [
    "The self-opinion is advisory review input only.",
    "It is not proof/evidence.",
    "It is not product truth.",
    "It is not a state commit.",
    "It is not work closure.",
    "It is not a GitHub review.",
    "It is not merge approval.",
    "It is not durable state.",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(advisoryText)), `observation doc must include advisory text ${advisoryText}`);
  }

  assert.equal(
    countMatches(observationDoc, /Selected next PR candidate:/g),
    1,
    "observation doc must choose exactly one selected next PR candidate",
  );
  assert.match(
    observationDoc,
    /Selected next PR candidate: Add a reusable Codex result report template/,
    "observation doc must select the reusable Codex result report template",
  );
  assert.ok(
    countMatches(observationDoc, /- Deferred candidate:/g) >= 2,
    "observation doc must explain why other candidates are deferred",
  );

  assert.match(
    observationDoc,
    /manual `codexResultText` \/ `codexResultPaste` path/,
    "observation doc must include manual codexResultText/codexResultPaste return path",
  );
  assert.match(
    observationDoc,
    /Manual `codexResultText` \/ `codexResultPaste` review remains the return path/,
    "observation doc must include remaining-caveat return path",
  );

  for (const boundary of [
    "no automatic Codex execution",
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
    assert.match(observationDoc, new RegExp(escapeRegExp(boundary)), `observation doc must include boundary ${boundary}`);
  }

  for (const skippedReason of [
    "Live Codex self-opinion session: skipped because no separate user-started",
    "Live Codex runner: skipped because this PR must not add automatic Codex",
    "Live MCP Inspector / ChatGPT Developer Mode observation: skipped because no",
    "Provider/OpenAI calls: skipped because this PR must not call providers.",
    "Proof/evidence rows: none were written because this PR has no write path.",
    "Augnes state mutation: none was performed because this PR is documentation",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(skippedReason)), `observation doc must include skipped reason ${skippedReason}`);
  }
}

function assertCopiedSampleReportMatchesScenario() {
  const scenarioSample = extractFencedBlockAfterHeading(scenarioDoc, "## Sample Self-opinion Report");
  const observationSample = extractFencedBlockAfterHeading(observationDoc, "## Self-opinion Report Used");
  assert.equal(
    observationSample,
    scenarioSample,
    "observation sample report must match the scenario sample report exactly",
  );
}

function extractFencedBlockAfterHeading(source, heading) {
  const headingIndex = source.indexOf(heading);
  assert.notEqual(headingIndex, -1, `${heading} must exist`);
  const blockStart = source.indexOf("```text", headingIndex);
  assert.notEqual(blockStart, -1, `${heading} must be followed by a text code block`);
  const contentStart = source.indexOf("\n", blockStart);
  assert.notEqual(contentStart, -1, `${heading} code block must have content`);
  const blockEnd = source.indexOf("```", contentStart + 1);
  assert.notEqual(blockEnd, -1, `${heading} code block must close`);
  return source.slice(contentStart + 1, blockEnd).trim();
}

function selfOpinionRunbookNote(source) {
  const marker = "AUGNES_CODEX_SELF_OPINION_DOGFOOD";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 800), markerIndex + 1800);
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

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
