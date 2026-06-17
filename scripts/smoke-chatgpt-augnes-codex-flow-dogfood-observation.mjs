import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const observationDocPath = "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md";
const scenarioDocPath = "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [observationDocPath, scenarioDocPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observationDoc = readFileSync(observationDocPath, "utf8");
const scenarioDoc = readFileSync(scenarioDocPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:chatgpt-augnes-codex-flow-dogfood-observation"],
  "node scripts/smoke-chatgpt-augnes-codex-flow-dogfood-observation.mjs",
  "package.json must expose the dogfood observation smoke script",
);

assertObservationDoc();
await assertSampleNormalizerStillMatchesObservation();
assertNoForbiddenAuthorityPatterns(`${observationDoc}\n\n${scenarioDoc}\n\n${dogfoodRunbookNote(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-augnes-codex-flow-dogfood-observation",
      observation_doc_present: true,
      scenario_reference_present: true,
      work_item_reference_present: true,
      live_host_skip_explicit: true,
      normalizer_expected_fields_documented: true,
      sample_normalizer_behavior_checked: true,
      conservative_closure_documented: true,
      no_unclaimed_authority_documented: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertObservationDoc() {
  assert.match(
    observationDoc,
    /^# Augnes ChatGPT-Augnes-Codex Flow Dogfood Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Scenario ID",
    "## Work Item ID",
    "## Runtime / Bridge / Host Path Used",
    "## Work Picker Result",
    "## Work Brief / Work Contract Result",
    "## Paste Normalizer Observation",
    "## Result Review / Closure Behavior",
    "## Authority Boundaries",
    "## Skipped Checks And Concrete Reasons",
    "## Remaining Caveats",
    "## Next Recommended Step",
  ]) {
    assert.match(observationDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `observation doc must include ${heading}`);
  }

  for (const requiredText of [
    "2026-06-17",
    "`80ce120`",
    "CHATGPT_AUGNES_CODEX_RESEARCH_DOGFOOD_V0_1",
    "AG-DOGFOOD-RESEARCH-001",
    "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md",
    "expected_files_count: 4",
    "expected_checks_count: 2",
    "needs_result_input",
    "codexResultText",
    "codexResultPaste",
    "work_loop_readonly",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(requiredText)), `observation doc must include ${requiredText}`);
  }
  assert.match(
    observationDoc,
    /`AG-006` remained `recommended_work_id`/,
    "observation doc must record that AG-006 remained recommended",
  );

  for (const key of [
    "work_id",
    "scope",
    "result_status",
    "changed_files",
    "verification_results",
    "skipped_checks",
    "remaining_caveats",
    "authority_boundary_statement",
    "ambiguous_combined_section_lines",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(key)), `observation doc must include detected field ${key}`);
  }

  assert.match(
    observationDoc,
    /Live MCP Inspector observation: skipped because no live connector\/tunnel or\s+Inspector session was started/s,
    "observation doc must explicitly skip live MCP Inspector with reason",
  );
  assert.match(
    observationDoc,
    /Live ChatGPT Developer Mode observation: skipped because no live connector,\s+tunnel, or host session was started/s,
    "observation doc must explicitly skip live Developer Mode with reason",
  );
  assert.doesNotMatch(
    observationDoc,
    /Live (?:MCP Inspector|ChatGPT Developer Mode).*?(?:passed|completed|observed live)/i,
    "observation doc must not claim live host success",
  );

  for (const expectedFile of [
    "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
    "scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
    "package.json",
    "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(expectedFile)), `observation doc must include expected file ${expectedFile}`);
  }
  for (const expectedCheck of [
    "node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
    "git diff --check",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(expectedCheck)), `observation doc must include expected check ${expectedCheck}`);
  }

  assert.match(observationDoc, /normalizer status was `ambiguous`/, "observation doc must record ambiguous normalizer status");
  assert.match(observationDoc, /review recommendation: `needs_revision`/, "observation doc must record review recommendation");
  assert.match(observationDoc, /suggested next action: `follow_up_fix_needed`/, "observation doc must record suggested next action");
  assert.match(observationDoc, /closure recommendation: `follow_up_fix_needed`/, "observation doc must record closure recommendation");
  assert.match(observationDoc, /suggested result status: `partial`/, "observation doc must record review-derived partial status");
  assert.match(observationDoc, /one combined skipped-check\/caveat line required human classification/, "observation doc must explain conservative closure");

  for (const noClaim of [
    "No proof/evidence rows were written.",
    "No event rows were created or mutated.",
    "No work status was closed or updated.",
    "No state was committed or rejected.",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(noClaim)), `observation doc must state ${noClaim}`);
  }

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
    "no widening of the `work_loop_readonly` Developer Mode tool surface",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(boundary)), `observation doc must include boundary ${boundary}`);
  }

  assert.match(
    observationDoc,
    /Codex self-opinion scenario is not implemented in this PR/,
    "observation doc must not implement the self-opinion scenario",
  );
}

async function assertSampleNormalizerStillMatchesObservation() {
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

  assert.equal(preview.status, "ambiguous", "sample report should remain ambiguous for human review");
  assert.equal(preview.candidate.work_id, "AG-DOGFOOD-RESEARCH-001");
  assert.equal(preview.candidate.scope, "project:augnes");
  assert.equal(preview.candidate.result_status, "completed");
  assert.deepEqual(preview.candidate.skipped_checks, [
    "Live ChatGPT Developer Mode Work Contract Card observation skipped because no tunnel/session was available",
  ]);
  assert.deepEqual(preview.candidate.remaining_caveats, [
    "Parser output remains a candidate only and needs human review",
  ]);
  assert.deepEqual(preview.ambiguous_combined_section_lines, [
    "Operator follow-up noted in transcript",
  ]);

  const duplicateCombinedLines = (preview.candidate.skipped_checks ?? []).filter((line) =>
    (preview.candidate.remaining_caveats ?? []).includes(line),
  );
  assert.deepEqual(duplicateCombinedLines, [], "combined lines must not be duplicated across skipped/caveat fields");

  assert.ok(
    preview.candidate.verification_results?.includes("node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs passed"),
    "sample must still extract the scenario-pack smoke verification",
  );
  assert.ok(
    preview.candidate.verification_results?.includes("git diff --check passed"),
    "sample must still extract diff-check verification",
  );
  assert.doesNotMatch(
    JSON.stringify(preview.candidate),
    /proof row|evidence row|host observation invented/i,
    "sample candidate must not invent proof/evidence or host observations",
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

function dogfoodRunbookNote(source) {
  const marker = "AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD";
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
