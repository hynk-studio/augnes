import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const observationDocPath = "docs/AUGNES_CODEX_FIELD_FIRST_RESULT_PARSER_DOGFOOD_OBSERVATION_V0_1.md";
const templateDocPath = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
const normalizerDocPath = "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [observationDocPath, templateDocPath, normalizerDocPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const observationDoc = readFileSync(observationDocPath, "utf8");
const templateDoc = readFileSync(templateDocPath, "utf8");
const normalizerDoc = readFileSync(normalizerDocPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:codex-field-first-result-parser-dogfood-observation-v0-1"],
  "node scripts/smoke-codex-field-first-result-parser-dogfood-observation-v0-1.mjs",
  "package.json must expose the field-first parser dogfood observation smoke script",
);

assertObservationDoc();
await assertObservationMatchesNormalizerOutput();
assertNoForbiddenAuthorityPatterns(`${observationDoc}\n\n${templatePointer(templateDoc)}\n\n${normalizerPointer(normalizerDoc)}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "codex-field-first-result-parser-dogfood-observation-v0-1",
      observation_doc_present: true,
      template_reference_present: true,
      normalizer_doc_reference_present: true,
      sample_report_reused: true,
      normalizer_output_matches_observation: true,
      field_first_report_context_preview_only: true,
      no_invented_authority_checked: true,
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
    /^# Augnes Codex Field-first Result Parser Dogfood Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Source Template",
    "## Source Parser Docs",
    "## Run Mode",
    "## Explicit Statement Of What Was Not Run",
    "## Report Text Used",
    "## Paste Normalizer Outcome",
    "## Review Behavior Expectation",
    "## Improvement Assessment",
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
    "`ffc7d8a`",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md",
    "Run mode: deterministic field-first parser observation.",
    "No live Codex closeout session was run.",
    "No automatic report generation was added or invoked.",
    "No automatic Codex execution was added or invoked.",
    "No proof/evidence rows were written.",
    "No work status was closed or changed.",
    "No event rows were created or mutated.",
    "No Augnes state was committed or rejected.",
    "No App/MCP tools were added.",
    "No Research / Paper / Knowledge Accumulation surface was implemented.",
    "The `work_loop_readonly` Developer Mode tool surface was not widened.",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(requiredText)), `observation doc must include ${requiredText}`);
  }

  assert.equal(
    countMatches(observationDoc, /Selected next PR candidate:/g),
    1,
    "observation doc must choose exactly one selected next PR candidate",
  );
  assert.match(
    observationDoc,
    /Selected next PR candidate: add Core Handoff current task only compact\s+subsection\./,
    "observation doc must select the Core Handoff current-task-only subsection",
  );
  assert.match(
    observationDoc,
    /This PR does not implement the selected next PR candidate\./,
    "observation doc must not implement the selected next PR candidate",
  );

  for (const noInvention of [
    "not proof/evidence rows",
    "not a live host observation",
    "not event mutation evidence",
    "not work close/status mutation evidence",
    "not state decision evidence",
    "not automatic close authority",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(noInvention)), `observation doc must include ${noInvention}`);
  }

  for (const boundary of [
    "no automatic report generation",
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
    assert.match(observationDoc, looseTextPattern(boundary), `observation doc must include boundary ${boundary}`);
  }

  assert.match(
    runbook,
    /AUGNES_CODEX_FIELD_FIRST_RESULT_PARSER_DOGFOOD_OBSERVATION_V0_1\.md/,
    "runbook must point to the field-first parser observation",
  );
}

async function assertObservationMatchesNormalizerOutput() {
  const templateSample = extractFencedBlockAfterHeading(templateDoc, "### Filled Sample Report For AG-DOGFOOD-RESEARCH-001");
  const observationSample = extractFencedBlockAfterHeading(observationDoc, "## Report Text Used");
  assert.equal(observationSample, templateSample, "observation report text must match the template sample exactly");

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

  const preview = buildCodexResultPasteNormalizerPreview({ topLevelPasteText: templateSample });
  assert.equal(extractBacktickValueAfterLabel(observationDoc, "normalizer_status"), preview.status);
  assert.deepEqual(extractBacktickListAfterMarker(observationDoc, "detected_fields:"), preview.detected_fields);
  assert.equal(extractBacktickValueAfterLabel(observationDoc, "work_id"), preview.candidate.work_id);
  assert.equal(extractBacktickValueAfterLabel(observationDoc, "scope"), preview.candidate.scope);
  assert.equal(extractBacktickValueAfterLabel(observationDoc, "result_status"), preview.candidate.result_status);
  assert.deepEqual(extractBacktickListAfterMarker(observationDoc, "changed_files:"), preview.candidate.changed_files);
  assert.deepEqual(extractBacktickListAfterMarker(observationDoc, "verification_commands:"), preview.candidate.verification_commands);
  assert.deepEqual(extractBacktickListAfterMarker(observationDoc, "verification_results:"), preview.candidate.verification_results);
  assert.deepEqual(extractBacktickListAfterMarker(observationDoc, "skipped_checks:"), preview.candidate.skipped_checks);
  assert.deepEqual(extractBacktickListAfterMarker(observationDoc, "remaining_caveats:"), preview.candidate.remaining_caveats);
  assert.deepEqual(
    extractBacktickListAfterMarker(observationDoc, "ambiguous_combined_section_lines:"),
    preview.ambiguous_combined_section_lines,
  );
  assert.deepEqual(extractFieldFirstContext(observationDoc), preview.field_first_report_context);
  assert.match(
    observationDoc,
    new RegExp(escapeRegExp(preview.candidate.authority_boundary_statement ?? "")),
    "observation doc must include extracted authority boundary statement",
  );

  assert.equal(preview.candidate.pr_url, undefined, "normalizer must not invent PR URL");
  assert.equal(preview.candidate.pr_number, undefined, "normalizer must not invent PR number");
  for (const inventedField of [
    "proof_evidence_rows_written",
    "live_host_observation",
    "event_rows_created_or_mutated",
    "work_status_changed",
    "state_committed_or_rejected",
    "event_ids",
    "close_status",
    "state_decision",
  ]) {
    assert.equal(
      Object.hasOwn(preview.candidate, inventedField),
      false,
      `normalizer candidate must not invent ${inventedField}`,
    );
  }

  assert.equal(
    preview.field_first_report_context.live_host_observation,
    "not run - no live MCP Inspector or ChatGPT Developer Mode session was started",
    "field_first_report_context must preserve the not-run host context",
  );
  assert.equal(
    preview.field_first_report_context.proof_evidence_rows_written,
    "No proof/evidence rows written.",
    "field_first_report_context must preserve no proof/evidence write context",
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

function extractBacktickValueAfterLabel(source, label) {
  const match = source.match(new RegExp(`^${escapeRegExp(label)}:\\s+` + "`([^`]+)`", "m"));
  assert.ok(match, `${label} must have a backtick value`);
  return match[1];
}

function extractBacktickListAfterMarker(source, marker) {
  const markerWithList = `${marker}\n\n`;
  const markerIndex = source.indexOf(markerWithList);
  assert.notEqual(markerIndex, -1, `${marker} must exist`);
  const afterMarker = source.slice(markerIndex + markerWithList.length);
  const lines = afterMarker.split(/\r?\n/);
  const values = [];
  let sawList = false;
  for (const line of lines) {
    if (!line.trim()) {
      if (sawList) break;
      continue;
    }
    const item = line.match(/^\s*-\s+`([^`]+)`\s*$/);
    if (!item) {
      if (sawList) break;
      continue;
    }
    sawList = true;
    values.push(item[1]);
  }
  assert.ok(values.length > 0, `${marker} must have a backtick list`);
  return values;
}

function extractFieldFirstContext(source) {
  const marker = "field_first_report_context:\n\n";
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, "field_first_report_context block must exist");
  const afterMarker = source.slice(markerIndex + marker.length);
  const lines = afterMarker.split(/\r?\n/);
  const context = {};
  for (const line of lines) {
    if (!line.trim()) break;
    const item = line.match(/^\s*-\s+`([^`]+)`:\s+`([^`]*)`\s*$/);
    if (!item) break;
    context[item[1]] = item[2] === "null" ? null : item[2];
  }
  assert.deepEqual(Object.keys(context), [
    "live_host_observation",
    "proof_evidence_rows_written",
    "event_rows_created_or_mutated",
    "work_status_changed",
    "state_committed_or_rejected",
    "next_recommended_step",
  ]);
  return context;
}

function templatePointer(source) {
  const marker = "AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1000), markerIndex + 1800);
}

function normalizerPointer(source) {
  const marker = "field-first snake_case labels";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1000), markerIndex + 2200);
}

function runbookPointer(source) {
  const marker = "AUGNES_CODEX_FIELD_FIRST_RESULT_PARSER_DOGFOOD_OBSERVATION_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1200), markerIndex + 1200);
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

function looseTextPattern(value) {
  return new RegExp(value.split(/\s+/).map(escapeRegExp).join("\\s+"));
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}
