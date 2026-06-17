import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const scenarioDocPath = "docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md";
const packagePath = "package.json";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";

for (const filePath of [scenarioDocPath, packagePath, runbookPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const scenarioDoc = readFileSync(scenarioDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const runbook = readFileSync(runbookPath, "utf8");

assert.equal(
  packageJson.scripts?.["smoke:codex-self-opinion-dogfood-scenario"],
  "node scripts/smoke-codex-self-opinion-dogfood-scenario.mjs",
  "package.json must expose the Codex self-opinion dogfood smoke script",
);

assertScenarioDoc();
assertSampleSelfOpinionReport();
assertNoForbiddenAuthorityPatterns(`${scenarioDoc}\n\n${selfOpinionRunbookNote(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "codex-self-opinion-dogfood-scenario",
      scenario_doc_present: true,
      scenario_and_observation_inputs_referenced: true,
      evaluation_questions_present: true,
      output_shape_present: true,
      sample_self_opinion_report_present: true,
      sample_criticisms_count_checked: true,
      sample_next_pr_candidates_count_checked: true,
      sample_non_automation_boundaries_count_checked: true,
      advisory_only_boundary_checked: true,
      future_manual_return_path_checked: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertScenarioDoc() {
  assert.match(
    scenarioDoc,
    /^# Augnes Codex Self-opinion Dogfood Scenario v0\.1$/m,
    "scenario doc must have the expected title",
  );

  for (const heading of [
    "## Purpose",
    "## Scenario ID",
    "## Inputs Codex Should Read",
    "## What Codex Should Evaluate",
    "## Required Output Shape",
    "## Sample Self-opinion Report",
    "## Expected Review Behavior",
    "## How To Feed It Back Into Augnes",
    "## Authority Boundaries",
    "## Skipped Checks Policy",
    "## What This Scenario Does Not Test",
    "## Next Recommended Step",
  ]) {
    assert.match(scenarioDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `scenario doc must include ${heading}`);
  }

  assert.match(scenarioDoc, /CODEX_SELF_OPINION_DOGFOOD_V0_1/, "scenario doc must include scenario ID");

  for (const inputPath of [
    "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md",
    "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md",
    "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
    "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(inputPath)), `scenario doc must reference ${inputPath}`);
  }

  for (const question of [
    "Was the handoff packet enough to understand the task?",
    "Were expected files and checks concrete enough?",
    "Was it clear what not to do?",
    "Was result reporting back to Augnes easy?",
    "Did the paste normalizer align with how Codex naturally writes closeout reports?",
    "Where did Codex feel tempted to over-automate?",
    "Which boundaries should remain non-automated?",
    "What would improve the Core Handoff packet?",
    "What would improve the result report template?",
    "What should the next research / paper / knowledge accumulation surface prioritize?",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(question)), `scenario doc must include evaluation question: ${question}`);
  }

  for (const field of [
    "worker_perspective_summary",
    "handoff_clarity_rating",
    "result_return_friction_rating",
    "over_automation_risks",
    "non_automation_boundaries_to_preserve",
    "handoff_packet_improvements",
    "result_report_template_improvements",
    "research_accumulation_surface_recommendations",
    "concrete_next_pr_candidates",
    "authority_boundary_statement",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(field)), `scenario doc must include output field ${field}`);
  }

  assert.match(scenarioDoc, /self-opinion artifact is advisory review input only/i, "scenario doc must say advisory review input only");
  assert.match(scenarioDoc, /The self-opinion is review input only\./, "scenario doc must repeat review-input-only behavior");
  assert.match(scenarioDoc, /It must not become proof\/evidence\./, "scenario doc must say not proof/evidence");
  assert.match(scenarioDoc, /It must not become a state commit\./, "scenario doc must say not state commit");
  assert.match(scenarioDoc, /It must not become work closure\./, "scenario doc must say not work closure");
  assert.match(scenarioDoc, /It must not become a GitHub review\./, "scenario doc must say not GitHub review");
  assert.match(scenarioDoc, /It must not become merge approval\./, "scenario doc must say not merge approval");
  assert.match(scenarioDoc, /It must not become product truth\./, "scenario doc must say not product truth");

  assert.match(
    scenarioDoc,
    /through `codexResultText`\s+or `codexResultPaste`/s,
    "scenario doc must include future manual codexResultText/codexResultPaste return path",
  );
  assert.match(scenarioDoc, /This PR does not add an automatic return path\./, "scenario doc must reject automatic return path");

  for (const boundary of [
    "no automatic GitHub fetch",
    "no proof/evidence write",
    "no work close/status mutation",
    "no event creation/mutation",
    "no state commit/reject",
    "no Codex execution from App/MCP",
    "no shell execution from App/MCP",
    "no provider/OpenAI calls",
    "no branch/PR creation from App/MCP code",
    "no PR review submission",
    "no merge/publish/retry/replay/deploy controls",
    "no DB migration",
    "no new user-facing App/MCP tools",
    "no widening of the work_loop_readonly Developer Mode tool surface",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(boundary)), `scenario doc must include boundary ${boundary}`);
  }

  for (const skippedPolicy of [
    "If no live Codex self-opinion session is actually run",
    "If no live MCP Inspector / ChatGPT Developer Mode session is started",
    "Do not claim proof/evidence rows were written",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(skippedPolicy)), `scenario doc must include skipped policy ${skippedPolicy}`);
  }

  for (const nonTested of [
    "Live Codex execution.",
    "Automatic self-opinion generation.",
    "The actual Research / Paper / Knowledge Accumulation product surface.",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(nonTested)), `scenario doc must include non-test ${nonTested}`);
  }
}

function assertSampleSelfOpinionReport() {
  const sampleReport = extractFencedBlockAfterHeading(scenarioDoc, "## Sample Self-opinion Report");
  for (const sampleField of [
    "worker_perspective_summary:",
    "handoff_clarity_rating:",
    "result_return_friction_rating:",
    "useful_criticisms:",
    "over_automation_risks:",
    "non_automation_boundaries_to_preserve:",
    "handoff_packet_improvements:",
    "result_report_template_improvements:",
    "research_accumulation_surface_recommendations:",
    "concrete_next_pr_candidates:",
    "authority_boundary_statement:",
  ]) {
    assert.match(sampleReport, new RegExp(escapeRegExp(sampleField)), `sample report must include ${sampleField}`);
  }

  assert.ok(countMatches(sampleReport, /- Criticism:/g) >= 3, "sample report must include at least 3 useful criticisms");
  assert.ok(countMatches(sampleReport, /- PR candidate:/g) >= 3, "sample report must include at least 3 concrete next PR candidates");
  assert.ok(countMatches(sampleReport, /- Boundary:/g) >= 3, "sample report must include at least 3 non-automation boundaries");

  assert.match(sampleReport, /This self-opinion is advisory only\./, "sample report must explicitly say advisory only");
  assert.match(sampleReport, /not proof\/evidence/, "sample report must say not proof/evidence");
  assert.match(sampleReport, /not a state\s+commit/s, "sample report must say not state commit");
  assert.match(sampleReport, /not work closure/, "sample report must say not work closure");
  assert.match(sampleReport, /not a GitHub review/, "sample report must say not GitHub review");
  assert.match(sampleReport, /not merge approval/, "sample report must say not merge approval");
  assert.match(sampleReport, /not\s+product truth/s, "sample report must say not product truth");
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
  const marker = "AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 800), markerIndex + 1200);
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
