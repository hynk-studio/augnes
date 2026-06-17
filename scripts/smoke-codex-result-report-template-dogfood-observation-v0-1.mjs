import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const observationDocPath = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_DOGFOOD_OBSERVATION_V0_1.md";
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
  packageJson.scripts?.["smoke:codex-result-report-template-dogfood-observation-v0-1"],
  "node scripts/smoke-codex-result-report-template-dogfood-observation-v0-1.mjs",
  "package.json must expose the result report template dogfood observation smoke script",
);

assertObservationDoc();
await assertObservationMatchesNormalizerOutput();
assertNoForbiddenAuthorityPatterns(`${observationDoc}\n\n${templatePointer(templateDoc)}\n\n${normalizerPointer(normalizerDoc)}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-report-template-dogfood-observation-v0-1",
      observation_doc_present: true,
      source_template_referenced: true,
      source_normalizer_doc_referenced: true,
      live_closeout_skip_explicit: true,
      normalizer_output_matches_observation: true,
      no_invented_authority_checked: true,
      exactly_one_next_pr_candidate_selected: true,
      snake_case_parser_candidate_selected: true,
      field_first_parser_follow_up_checked: true,
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
    /^# Augnes Codex Result Report Template Dogfood Observation v0\.1$/m,
    "observation doc must have the expected title",
  );

  for (const heading of [
    "## Date",
    "## Baseline Commit",
    "## Source Template",
    "## Source Normalizer Docs",
    "## Run Mode",
    "## Explicit Statement Of What Was Not Run",
    "## Report Text Used",
    "## Paste Normalizer Outcome",
    "## Result Review Expectation",
    "## No-invention Checks",
    "## Template Usefulness Assessment",
    "## Candidate Next PR Selection",
    "## Field-first Parser Follow-up",
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
    "`67e7e2c`",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md",
    "Run mode: deterministic sample-template observation.",
    "Actual live Codex closeout: skipped.",
    "No live Codex closeout session was run.",
    "No automatic report generation was added or invoked.",
    "No automatic Codex execution was added or invoked.",
    "No proof/evidence rows were written.",
    "No work status was closed or changed.",
    "No event rows were created or mutated.",
    "No Augnes state was committed or rejected.",
    "No App/MCP tools were added.",
    "No Research / Paper / Knowledge Accumulation surface was implemented.",
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
    /Selected next PR candidate: teach paste normalizer to parse field-first\s+snake_case report labels directly\./,
    "observation doc must select direct field-first snake_case parsing",
  );
  assert.match(
    observationDoc,
    /Direct field-first parser support: skipped because this PR only observes that\s+it should be the next PR\./,
    "observation doc must not implement direct parser support",
  );
  assert.match(
    observationDoc,
    /later PR implements the selected follow-up by teaching the paste normalizer to\s+parse field-first snake_case report labels directly\./,
    "observation doc must preserve the historical observation and acknowledge the follow-up parser PR",
  );
  assert.match(
    observationDoc,
    /expected to expose `ambiguous_combined_section_lines` and\s+`field_first_report_context` directly/,
    "observation doc must name the new direct parser preview fields",
  );

  for (const noInvention of [
    "no proof/evidence rows invented: confirmed",
    "no PR URL/number invented: confirmed",
    "no live host observation invented: confirmed",
    "no event IDs invented: confirmed",
    "no close status invented: confirmed",
    "no state decision invented: confirmed",
  ]) {
    assert.match(observationDoc, new RegExp(escapeRegExp(noInvention)), `observation doc must include ${noInvention}`);
  }

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
    assert.match(observationDoc, looseTextPattern(boundary), `observation doc must include boundary ${boundary}`);
  }

  assert.match(runbook, /AUGNES_CODEX_RESULT_REPORT_TEMPLATE_DOGFOOD_OBSERVATION_V0_1\.md/, "runbook must point to the observation");
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
  const observedStatus = extractBacktickValueAfterLabel(observationDoc, "normalizer_status");
  assert.equal(observedStatus, preview.status, "observation status must match actual normalizer status");

  const observedDetectedFields = extractBacktickListAfterMarker(observationDoc, "detected_fields:");
  if (/## Field-first Parser Follow-up/.test(observationDoc)) {
    for (const observedField of observedDetectedFields) {
      assert.ok(
        preview.detected_fields.includes(observedField),
        `historical observed field ${observedField} must still be present in current normalizer output`,
      );
    }
    assert.ok(
      preview.detected_fields.includes("ambiguous_combined_section_lines"),
      "current normalizer output must include direct ambiguous_combined_section_lines detection",
    );
    assert.ok(
      preview.detected_fields.includes("field_first_report_context"),
      "current normalizer output must include field_first_report_context detection",
    );
  } else {
    assert.deepEqual(observedDetectedFields, preview.detected_fields, "observation detected_fields must match actual normalizer output");
  }

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

function templatePointer(source) {
  const marker = "AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1000), markerIndex + 1800);
}

function normalizerPointer(source) {
  const marker = "AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1000), markerIndex + 1800);
}

function runbookPointer(source) {
  const marker = "AUGNES_CODEX_RESULT_REPORT_TEMPLATE_DOGFOOD_OBSERVATION_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1000), markerIndex + 1800);
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

function looseTextPattern(value) {
  return new RegExp(value.split(/\s+/).map(escapeRegExp).join("\\s+"));
}
