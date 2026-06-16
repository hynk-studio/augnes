import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const scenarioDocPath = "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md";
const demoSeedPath = "scripts/demo-seed.mjs";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";

for (const filePath of [scenarioDocPath, demoSeedPath, runbookPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const scenarioDoc = readFileSync(scenarioDocPath, "utf8");
const demoSeed = readFileSync(demoSeedPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const workItemBlock = extractObjectContainingMarker(demoSeed, 'workId: "AG-DOGFOOD-RESEARCH-001"');

const EXPECTED_FILES = [
  "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
  "scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
  "package.json",
  "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
];

const EXPECTED_CHECKS = [
  "node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
  "git diff --check",
];

const AUTHORITY_BOUNDARY_PHRASES = [
  "no Codex execution from App/MCP",
  "no shell execution from App/MCP",
  "no provider/OpenAI calls from App/MCP",
  "no automatic GitHub fetch",
  "no proof/evidence writes",
  "no event creation/mutation",
  "no work close/status mutation",
  "no state commit/reject",
  "no branch/PR creation from App/MCP code",
  "no PR review submission",
  "no merge/publish/retry/replay/deploy controls",
  "no new user-facing App/MCP tools",
  "no widening of the `work_loop_readonly` Developer Mode tool surface",
];

assertScenarioDoc();
assertSeedWorkItem();
await assertSampleNormalizerBehavior();
assertNoForbiddenAuthorityPatterns(`${scenarioDoc}\n\n${workItemBlock}\n\n${dogfoodRunbookNote(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-augnes-codex-flow-dogfood-scenario",
      scenario_doc_present: true,
      seed_work_item_present: true,
      operator_path_checked: true,
      sample_codex_final_report_checked: true,
      result_return_path_checked: true,
      expected_normalizer_behavior_checked: true,
      expected_files_and_checks_checked: true,
      preview_only_authority_boundaries_checked: true,
      sample_report_normalizer_classification_checked: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertScenarioDoc() {
  assert.match(
    scenarioDoc,
    /^# Augnes ChatGPT-Augnes-Codex Flow Dogfood Scenario v0\.1$/m,
    "scenario doc must have the expected title",
  );
  for (const heading of [
    "## Purpose",
    "## Scenario ID",
    "## Work Item ID",
    "## What This Scenario Tests",
    "## Operator Path",
    "## Expected Visible Surfaces",
    "## Codex Task Payload",
    "## Sample Codex Final Report Text",
    "## Expected Normalizer Outcome",
    "## Authority Boundaries",
    "## Skipped Checks Policy",
    "## What This Scenario Does Not Test",
    "## Follow-up Scenario",
  ]) {
    assert.match(scenarioDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `scenario doc must include ${heading}`);
  }

  assert.match(scenarioDoc, /CHATGPT_AUGNES_CODEX_RESEARCH_DOGFOOD_V0_1/, "scenario doc must name the scenario ID");
  assert.match(scenarioDoc, /AG-DOGFOOD-RESEARCH-001/, "scenario doc must name the work item ID");
  assert.match(
    scenarioDoc,
    /Research \/ Paper \/ Knowledge Accumulation/,
    "scenario doc must target the research/paper/knowledge accumulation direction",
  );

  for (const operatorPathPhrase of [
    "Start local runtime with a seeded DB",
    "AUGNES_APP_TOOL_SURFACE=work_loop_readonly",
    "ChatGPT Developer Mode connector or MCP Inspector",
    "augnes_list_work_items",
    "project:augnes",
    "augnes_get_work_brief",
    "Copy Core Codex Handoff",
    "Paste the Core handoff into a separate Codex session",
    "Paste Codex final report text back through `codexResultText` or",
    "`codexResultPaste`",
    "Result Closure recommendation",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(operatorPathPhrase)), `operator path must include ${operatorPathPhrase}`);
  }

  for (const surface of [
    "Work Picker",
    "Work Contract Card",
    "Core Handoff",
    "Codex result paste helper",
    "Work result review",
    "Work Event Spine / Inspector",
    "Result Closure",
  ]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(surface)), `scenario doc must include visible surface ${surface}`);
  }

  const sampleReport = extractFencedBlockAfterHeading(scenarioDoc, "## Sample Codex Final Report Text");
  for (const samplePhrase of [
    "Files changed",
    "Verification",
    "Skipped checks and caveats",
    "Live ChatGPT Developer Mode Work Contract Card observation skipped because no tunnel/session was available.",
    "Parser output remains a candidate only and needs human review.",
    "Operator follow-up noted in transcript.",
    "Authority boundary statement",
    "Result status",
    "completed",
  ]) {
    assert.match(sampleReport, new RegExp(escapeRegExp(samplePhrase)), `sample final report must include ${samplePhrase}`);
  }

  assert.match(
    scenarioDoc,
    /codexResultText` or\s+`codexResultPaste/s,
    "scenario doc must include the raw result-return paste path",
  );

  for (const key of ["skipped_checks", "remaining_caveats", "ambiguous_combined_section_lines"]) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(key)), `scenario doc must describe ${key}`);
  }
  assert.match(scenarioDoc, /No combined-section line is duplicated/, "scenario doc must require no duplicate assignment");
  assert.match(scenarioDoc, /does not invent verification/, "scenario doc must require no invented verification");

  for (const expectedFile of EXPECTED_FILES) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(expectedFile)), `scenario doc must include expected file ${expectedFile}`);
  }
  for (const expectedCheck of EXPECTED_CHECKS) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(expectedCheck)), `scenario doc must include expected check ${expectedCheck}`);
  }
  for (const boundary of AUTHORITY_BOUNDARY_PHRASES) {
    assert.match(scenarioDoc, new RegExp(escapeRegExp(boundary)), `scenario doc must include boundary ${boundary}`);
  }
  assert.match(
    scenarioDoc,
    /Codex self-opinion dogfood scenario/,
    "scenario doc must mention the later self-opinion scenario without implementing it",
  );
}

function assertSeedWorkItem() {
  assert.match(workItemBlock, /workId:\s*"AG-DOGFOOD-RESEARCH-001"/, "demo seed must include the dogfood work item");
  assert.match(workItemBlock, /status:\s*"in_progress"/, "dogfood work item must use an active status");
  assert.match(workItemBlock, /priority:\s*"normal"/, "dogfood work item must not displace priority now work");
  assert.match(workItemBlock, /Research \/ Paper \/ Knowledge Accumulation/, "dogfood work item summary must target the research direction");
  assert.match(workItemBlock, /codexResultText or codexResultPaste/, "dogfood work item must point to the result-return path");

  for (const stateKey of [
    "research.accumulation.preview",
    "research.paper_knowledge_surface",
    "integration.chatgpt_app",
  ]) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(stateKey)), `dogfood work item must include state key ${stateKey}`);
  }
  for (const expectedFile of EXPECTED_FILES) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(expectedFile)), `dogfood work item must include expected file ${expectedFile}`);
  }
  for (const expectedCheck of EXPECTED_CHECKS) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(expectedCheck)), `dogfood work item must include expected check ${expectedCheck}`);
  }
  for (const boundary of AUTHORITY_BOUNDARY_PHRASES.slice(0, 11)) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(boundary)), `dogfood work item must include boundary ${boundary}`);
  }
}

async function assertSampleNormalizerBehavior() {
  const requireFromSmoke = createRequire(import.meta.url);
  const { tsImport } = requireFromSmoke("../apps/augnes_apps/node_modules/tsx/dist/esm/api/index.cjs");
  const serverModule = await tsImport(
    new URL("../apps/augnes_apps/src/server.ts", import.meta.url).href,
    import.meta.url,
  );
  const { buildCodexResultPasteNormalizerPreview } = serverModule;
  assert.equal(
    typeof buildCodexResultPasteNormalizerPreview,
    "function",
    "server must export buildCodexResultPasteNormalizerPreview",
  );

  const sampleReport = extractFencedBlockAfterHeading(scenarioDoc, "## Sample Codex Final Report Text");
  const preview = buildCodexResultPasteNormalizerPreview({ topLevelPasteText: sampleReport });

  assert.equal(preview.normalizer_type, "codex_result_paste_normalizer_preview");
  assert.ok(
    ["candidate_ready", "partial_candidate", "ambiguous"].includes(preview.status),
    "sample report must yield a normalizer candidate or expected ambiguous human-review warning",
  );
  assert.equal(preview.candidate.work_id, "AG-DOGFOOD-RESEARCH-001");
  assert.equal(preview.candidate.scope, "project:augnes");
  assert.equal(preview.candidate.result_status, "completed");

  for (const expectedFile of EXPECTED_FILES) {
    assert.ok(
      preview.candidate.changed_files?.includes(expectedFile),
      `sample report must extract changed file ${expectedFile}`,
    );
  }
  assert.ok(
    preview.candidate.verification_results?.some((line) => /smoke-research-accumulation-scenario-pack-v0-1\.mjs passed/.test(line)),
    "sample report must extract the smoke verification result",
  );
  assert.ok(
    preview.candidate.verification_results?.some((line) => /git diff --check passed/.test(line)),
    "sample report must extract the diff check verification result",
  );
  assert.ok(
    !preview.candidate.verification_results?.some((line) => /npm run typecheck/.test(line)),
    "sample report must not invent unreported verification",
  );

  assert.ok(
    preview.candidate.skipped_checks?.some((line) => /Work Contract Card observation skipped/.test(line)),
    "clear skipped validation line must become skipped_checks",
  );
  assert.ok(
    preview.candidate.remaining_caveats?.some((line) => /Parser output remains a candidate only/.test(line)),
    "clear caveat line must become remaining_caveats",
  );
  assert.ok(
    preview.ambiguous_combined_section_lines?.some((line) => /Operator follow-up noted in transcript/.test(line)),
    "ambiguous combined line must remain human-review warning",
  );

  const duplicateCombinedLines = (preview.candidate.skipped_checks ?? []).filter((line) =>
    (preview.candidate.remaining_caveats ?? []).includes(line),
  );
  assert.deepEqual(duplicateCombinedLines, [], "combined lines must not be duplicated between skipped_checks and remaining_caveats");
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

function extractObjectContainingMarker(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} must exist`);
  const objectStart = source.lastIndexOf("{", markerIndex);
  assert.notEqual(objectStart, -1, `${marker} must be inside an object`);
  let depth = 0;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }
  throw new Error(`${marker} object did not terminate`);
}

function dogfoodRunbookNote(source) {
  const marker = "AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 600), markerIndex + 600);
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
    assert.doesNotMatch(source, pattern, `feature source must not include forbidden authority pattern ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
