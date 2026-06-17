import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [serverPath, widgetPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:core-handoff-current-task-compact-section"],
  "node scripts/smoke-core-handoff-current-task-compact-section.mjs",
  "package.json must expose the Core Handoff compact-section smoke script",
);

const coreJsonBlockBuilder = extractFunction(server, "buildCoreCodexHandoffJsonBlock");
const coreTextBuilder = extractFunction(server, "buildCoreCodexHandoffText");
const corePacketBuilder = extractFunction(server, "buildCoreCodexHandoffPacket");
const currentTaskBuilder = extractFunction(server, "buildCoreCurrentTaskOnly");
const finalTextBuilder = extractFunction(server, "buildFinalCodexHandoffText");
const widgetFallbackBuilder = extractFunction(widget, "composeFallbackCoreHandoffText");
const widgetCopyRenderer = extractFunction(widget, "renderCopyableHandoffPacket");

for (const source of [server, coreJsonBlockBuilder, coreTextBuilder, corePacketBuilder, currentTaskBuilder]) {
  assert.match(source, /core_current_task_only/, "Core source must include core_current_task_only");
}

for (const requiredText of [
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
  assert.match(coreTextBuilder, new RegExp(escapeRegExp(requiredText)), `Core text builder must include ${requiredText}`);
  assert.match(widgetFallbackBuilder, new RegExp(escapeRegExp(requiredText)), `widget fallback Core text must include ${requiredText}`);
}

assert.match(server, /docs\/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1\.md/, "server must define the reusable result report template path");
assert.match(server, /codexResultText \/ codexResultPaste/, "server must define the manual paste return path");
assert.match(coreTextBuilder, /currentTask\.result_report_template/, "Core text builder must print the current-task report template field");
assert.match(coreTextBuilder, /currentTask\.next_return_path/, "Core text builder must print the current-task result return path");
assert.match(
  widgetFallbackBuilder,
  /docs\/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1\.md/,
  "widget fallback Core text must include the result report template path",
);
assert.match(widgetFallbackBuilder, /codexResultText \/ codexResultPaste/, "widget fallback Core text must include the manual paste return path");

for (const boundary of [
  "no Codex execution from App/MCP",
  "no proof/evidence write unless separately authorized",
  "no work close/status mutation",
  "no event/state mutation",
  "no GitHub review/merge/publish/retry/replay/deploy",
]) {
  assert.match(server, new RegExp(escapeRegExp(boundary)), `server compact boundary must include ${boundary}`);
  assert.match(widgetFallbackBuilder, new RegExp(escapeRegExp(boundary)), `widget fallback compact boundary must include ${boundary}`);
}

for (const structuredKey of [
  "work_id",
  "scope",
  "title",
  "current_task",
  "expected_files",
  "expected_checks",
  "stop_conditions",
  "authority_boundary_summary",
  "result_report_template",
  "next_return_path",
]) {
  assert.match(currentTaskBuilder, new RegExp(escapeRegExp(structuredKey)), `current-task builder must include ${structuredKey}`);
  assert.match(coreJsonBlockBuilder, /core_current_task_only/, "Core JSON builder must expose the compact object");
}

for (const delimiter of ["BEGIN_AUGNES_CODEX_HANDOFF_JSON", "END_AUGNES_CODEX_HANDOFF_JSON"]) {
  assert.match(server, new RegExp(escapeRegExp(delimiter)), `server source must preserve ${delimiter}`);
  assert.match(widgetFallbackBuilder, new RegExp(escapeRegExp(delimiter)), `widget fallback must preserve ${delimiter}`);
}
assert.match(coreTextBuilder, /CODEX_HANDOFF_JSON_BEGIN/, "Core text builder must preserve shared JSON begin delimiter");
assert.match(coreTextBuilder, /CODEX_HANDOFF_JSON_END/, "Core text builder must preserve shared JSON end delimiter");
assert.match(finalTextBuilder, /CODEX_HANDOFF_JSON_BEGIN/, "Final handoff text builder must preserve shared JSON begin delimiter");
assert.match(finalTextBuilder, /CODEX_HANDOFF_JSON_END/, "Final handoff text builder must preserve shared JSON end delimiter");

for (const requiredDocText of [
  "Current task only",
  "copied text only",
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "codexResultText",
  "codexResultPaste",
  "does not execute Codex",
  "does not add App/MCP tools",
]) {
  assert.match(runbook, new RegExp(escapeRegExp(requiredDocText)), `runbook must document ${requiredDocText}`);
}
assert.match(runbook, /broader\s+Core\s+Handoff context remains below/, "runbook must document that broader Core Handoff context remains below");

assert.match(corePacketBuilder, /buildCoreCurrentTaskOnly\(packetBase\)/, "Core packet must derive compact object from existing packet data");
assert.match(coreTextBuilder, /No expected files are listed in the work brief\./, "Core text must preserve missing expected-files fallback");
assert.match(coreTextBuilder, /No expected checks are listed in the work brief\./, "Core text must preserve missing expected-checks fallback");
assert.match(coreTextBuilder, /No stop conditions listed\./, "Core text must preserve missing stop-condition fallback");
assert.match(server, /copyable_core_handoff_text: coreCodexHandoffPacket\.copyable_handoff_text/, "Core copy text alias must remain present");
assert.match(server, /final_codex_handoff_packet: finalCodexHandoffPacket/, "Final handoff packet must remain present");
assert.match(server, /full_codex_handoff_packet: finalCodexHandoffPacket/, "Full handoff alias must remain present");
assert.match(widgetCopyRenderer, /Copy Codex Handoff/, "widget must keep Core copy button label");
assert.match(widgetCopyRenderer, /Copy Full Context/, "widget must keep Full Context copy button label");

assertNoForbiddenAuthorityPatterns([
  coreJsonBlockBuilder,
  coreTextBuilder,
  corePacketBuilder,
  currentTaskBuilder,
  finalTextBuilder,
  widgetFallbackBuilder,
  widgetCopyRenderer,
  runbook,
].join("\n\n"));

console.log(
  JSON.stringify(
    {
      smoke: "core-handoff-current-task-compact-section",
      core_current_task_only_present: true,
      compact_text_section_present: true,
      manual_result_return_path_present: true,
      result_report_template_referenced: true,
      json_delimiters_preserved: true,
      final_and_full_handoff_behavior_preserved: true,
      authority_boundaries_present: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

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
    assert.doesNotMatch(source, pattern, `feature source must not include forbidden authority pattern ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
