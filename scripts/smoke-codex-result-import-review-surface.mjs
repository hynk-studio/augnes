import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";

for (const filePath of [serverPath, widgetPath, runbookPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");

const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
assert.match(workBriefBlock, /annotations:\s*bridgeReadAnnotations/, "result import must stay on the read-only work brief tool");
assert.match(workBriefBlock, /codexResult:\s*CodexResultImportInputSchema\.optional\(\)/, "work brief tool must accept codexResult");
assert.match(workBriefBlock, /codexResultInput:\s*CodexResultImportInputSchema\.optional\(\)/, "work brief tool must accept codexResultInput");
assert.match(workBriefBlock, /codex_result:\s*CodexResultImportInputSchema\.optional\(\)/, "work brief tool must accept codex_result");
assert.match(workBriefBlock, /codexResultText:\s*z\.string\(\)\.min\(1\)\.optional\(\)/, "work brief tool must accept codexResultText paste input");
assert.match(workBriefBlock, /codex_result_text:\s*z\.string\(\)\.min\(1\)\.optional\(\)/, "work brief tool must accept codex_result_text paste input");
assert.match(workBriefBlock, /codexResultPaste:\s*z\.string\(\)\.min\(1\)\.optional\(\)/, "work brief tool must accept codexResultPaste input");
assert.match(workBriefBlock, /codex_result_paste:\s*z\.string\(\)\.min\(1\)\.optional\(\)/, "work brief tool must accept codex_result_paste input");
assert.match(workBriefBlock, /codex_result_import_input_shape/, "structured content must expose result import input shape");
assert.match(workBriefBlock, /codex_result_import_review_surface/, "structured content must expose result import review surface");
assert.match(workBriefBlock, /codex_result_paste_normalizer_preview/, "structured content must expose the paste normalizer preview");
assert.match(workBriefBlock, /normalized_codex_result_candidate/, "structured content must expose the normalized candidate");
assert.doesNotMatch(workBriefBlock, /annotations:\s*bridgeWriteAnnotations/, "result import must not be write annotated");

for (const expected of [
  "CODEX_RESULT_IMPORT_INPUT_SHAPE",
  "CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_TEXT",
  "normalizeCodexResultPasteInput",
  "buildCodexResultPasteNormalizerPreview",
  "mergeCodexResultInputWithPasteCandidate",
  "normalizeSkippedCheckResultObjects",
  "provided_result_input_fields",
  "missing_result_input_fields",
  "reported_verification_commands",
  "remaining_caveats",
  "suggested_next_action",
  "user_provided_input",
  "additional_verification_needed",
  "result_incomplete_blocked",
  "new_handoff_needed",
  "close_done",
]) {
  assert.match(server, new RegExp(escapeRegExp(expected)), `server must include ${expected}`);
}

assert.match(
  server,
  /return `\$\{label\}: \$\{detail\.join\(" "\)\}`/,
  "structured skipped-check objects must preserve both skipped-check name and reason",
);
assert.doesNotMatch(
  server,
  /stringArrayFromResultObjects\(inputSkippedValue,\s*\["check",\s*"summary",\s*"reason"\]\)/,
  "structured skipped-check normalization must not keep first-field-only behavior",
);
assert.match(
  server,
  /reportedOrInferredResultStatus === "completed" && reviewRecommendation === "ready_for_human_review"/,
  "suggested_result_status must only become completed after Augnes review readiness is satisfied",
);
assert.doesNotMatch(
  server,
  /const suggestedResultStatus[\s\S]{0,120}resultPayload\.suggestedResultStatus \?\?/,
  "suggested_result_status must not blindly prefer Codex-reported status before review gaps",
);

for (const expected of [
  "No Codex result payload is attached; no changed files, verification results, PR URLs, proof IDs, evidence IDs, screenshots, findings, or host observations were invented.",
  "Skipped checks with concrete reasons or an explicit none-skipped statement.",
  "Skipped check needs a concrete reason",
  "Codex result review packet has partial attached result input; missing fields are surfaced for bounded human review.",
]) {
  assert.match(server, new RegExp(escapeRegExp(expected)), `server must preserve honest result review text: ${expected}`);
}

for (const expected of [
  "Codex result import",
  "What was provided",
  "Missing result input",
  "Expected vs actual",
  "Verification review",
  "Skipped checks",
  "Remaining caveats",
  "Suggested next action",
  "What this screen does not do",
  "Codex result paste helper",
  "Normalized result candidate",
  "Detected fields",
  "Needs human review",
  "What this helper does not do",
]) {
  assert.match(widget, new RegExp(escapeRegExp(expected)), `widget must render ${expected}`);
}

assert.match(runbook, /codexResult/, "runbook must document codexResult input");
assert.match(runbook, /codexResultText/, "runbook must document top-level raw paste input");
assert.match(runbook, /raw_result_text/, "runbook must document structured raw paste input");
assert.match(runbook, /Explicit structured fields override parsed fields/, "runbook must document structured precedence");
assert.match(runbook, /user-provided only/i, "runbook must document user-provided result input");
assert.match(runbook, /Partial result input is reviewable but remains partial/i, "runbook must document partial input behavior");
assert.match(runbook, /Structured `skipped_checks` objects preserve concrete reasons/, "runbook must document structured skipped-check reason preservation");
assert.match(runbook, /`suggested_result_status` is Augnes's review-derived status/, "runbook must document review-derived status behavior");
assert.match(runbook, /No GitHub PR data\s+is\s+fetched from the App\/MCP server/i, "runbook must preserve no-fetch boundary");

const featureSource = [
  extractFunction(server, "normalizeCodexResultPasteInput"),
  extractFunction(server, "buildCodexResultPasteNormalizerPreview"),
  extractFunction(server, "mergeCodexResultInputWithPasteCandidate"),
  extractFunction(server, "resultReviewPayloadFromBrief"),
  extractFunction(server, "buildCodexResultReviewPacketPreview"),
  extractFunction(server, "finalHandoffCodexResultReviewPacketPreflightCheck"),
  extractFunction(widget, "normalizeCodexResultPasteNormalizerPreview"),
  extractFunction(widget, "renderCodexResultPasteNormalizerPreview"),
  extractFunction(widget, "normalizeCodexResultReviewPacket"),
  extractFunction(widget, "renderCodexResultReviewPacketPreview"),
  extractFunction(widget, "codexResultReviewPacketPreflightCheck"),
  workBriefBlock,
].join("\n\n");

assertNoForbiddenFeatureAuthority(featureSource);

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-import-review-surface",
      read_only_tool_input_present: true,
      no_result_state_explicit: true,
      structured_result_preview_supported: true,
      paste_normalizer_preview_supported: true,
      paste_normalizer_stays_on_read_only_work_brief: true,
      partial_result_warnings_present: true,
      skipped_check_reason_required: true,
      structured_skipped_check_reason_preserved: true,
      suggested_result_status_review_derived: true,
      suggested_next_action_present: true,
      widget_result_import_section_present: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function extractToolBlock(source, toolName) {
  const registrationPattern = new RegExp(`registerAppTool\\(\\s*server,\\s*"${escapeRegExp(toolName)}"`);
  const registration = registrationPattern.exec(source);
  assert.ok(registration, `${toolName} tool registration must exist`);
  const start = registration.index;
  const nextMatch = [...source.slice(start + "registerAppTool(".length).matchAll(/registerAppTool\(/g)][0];
  const next = nextMatch ? start + "registerAppTool(".length + nextMatch.index : source.length;
  return source.slice(start, next);
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

function assertNoForbiddenFeatureAuthority(source) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexec\s*\(/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bGITHUB_TOKEN\b/,
    /\bOPENAI_API_KEY\b/,
    /\bcreatePullRequest\b/i,
    /\bcreateBranch\b/i,
    /\bsubmitReview\b/i,
    /\bmerge\b.{0,20}\(/i,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\bcommitStateUpdate\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bprovider\b.{0,20}\(/i,
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `result import/review feature must not add forbidden authority: ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
