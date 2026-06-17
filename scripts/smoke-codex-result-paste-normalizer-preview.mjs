import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const notePath = "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md";
const packagePath = "package.json";

for (const filePath of [serverPath, widgetPath, runbookPath, notePath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const note = readFileSync(notePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:codex-result-paste-normalizer-preview"],
  "node scripts/smoke-codex-result-paste-normalizer-preview.mjs",
  "package.json must expose the paste normalizer smoke script",
);

const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
for (const alias of ["codexResultText", "codex_result_text", "codexResultPaste", "codex_result_paste"]) {
  assert.match(workBriefBlock, new RegExp(`${alias}:\\s*z\\.string\\(\\)\\.min\\(1\\)\\.optional\\(\\)`), `work brief inputSchema must accept ${alias}`);
}

const schemaBlock = extractConstBlock(server, "CodexResultImportInputSchema");
for (const alias of [
  "raw_result_text",
  "rawResultText",
  "pasted_result_text",
  "pastedResultText",
  "pr_body_text",
  "prBodyText",
  "closeout_text",
  "closeoutText",
]) {
  assert.match(schemaBlock, new RegExp(`${alias}:\\s*z\\.string\\(\\)\\.min\\(1\\)\\.optional\\(\\)`), `structured input schema must accept ${alias}`);
}

for (const key of [
  "codex_result_paste_normalizer_preview",
  "codex_result_normalizer_preview",
  "normalized_codex_result_candidate",
  "ambiguous_combined_section_lines",
  "field_first_report_context",
]) {
  assert.match(server, new RegExp(escapeRegExp(key)), `server must expose ${key}`);
}

for (const label of [
  "Codex result paste helper",
  "Normalized result candidate",
  "Detected fields",
  "Needs human review",
  "Ambiguous combined lines",
  "Field-first report context",
  "What this helper does not do",
]) {
  assert.match(widget, new RegExp(escapeRegExp(label)), `widget must render ${label}`);
}

for (const [pattern, description] of [
  [/existing structured `codexResult` \/ `codexResultInput` \/ `codex_result`[\s\S]*path still works/i, "structured result path still works"],
  [/Explicit structured fields override parsed fields\./, "structured precedence"],
  [/Partial extraction remains partial\./, "partial extraction remains partial"],
  [/Combined closeout sections[\s\S]*split conservatively/i, "combined sections split conservatively"],
  [/ambiguous_combined_section_lines/, "ambiguous combined lines exposed"],
  [/helper does not fetch GitHub/i, "no GitHub fetch boundary"],
]) {
  assert.match(`${runbook}\n${note}`, pattern, `docs must include ${description}`);
}

const requireFromSmoke = createRequire(import.meta.url);
const { tsImport } = requireFromSmoke("../apps/augnes_apps/node_modules/tsx/dist/esm/api/index.cjs");
const serverModule = await tsImport(
  new URL("../apps/augnes_apps/src/server.ts", import.meta.url).href,
  import.meta.url,
);

const {
  buildCodexResultPasteNormalizerPreview,
  mergeCodexResultInputWithPasteCandidate,
  normalizeCodexResultPasteInput,
} = serverModule;

assert.equal(typeof buildCodexResultPasteNormalizerPreview, "function", "server must export buildCodexResultPasteNormalizerPreview");
assert.equal(typeof mergeCodexResultInputWithPasteCandidate, "function", "server must export mergeCodexResultInputWithPasteCandidate");
assert.equal(typeof normalizeCodexResultPasteInput, "function", "server must export normalizeCodexResultPasteInput");

const sampleCloseoutText = `
Summary
Completed the preview-only Codex result paste normalizer.

Work ID: AG-123
Scope: project:augnes
Result status: completed
PR: https://github.com/hynk-studio/augnes/pull/777

Files changed
- apps/augnes_apps/src/server.ts
- apps/augnes_apps/public/console-widget.html
- scripts/smoke-codex-result-paste-normalizer-preview.mjs

Verification
- npm run typecheck passed
- node scripts/smoke-codex-result-paste-normalizer-preview.mjs passed

Skipped checks
- ChatGPT Developer Mode live observation: no Developer Mode tunnel/session available.

Remaining caveats
- Live ChatGPT Developer Mode validation remains manual.

Authority boundary statement
This PR adds a preview-only deterministic paste normalizer and no proof/evidence write, work close/status mutation, event mutation, Codex execution, shell execution, provider/OpenAI call, PR review submission, merge, publish, retry, replay, deploy, or DB migration.

Next recommended step
Human review of the candidate.
`;

const preview = buildCodexResultPasteNormalizerPreview({ topLevelPasteText: sampleCloseoutText });
assert.equal(preview.normalizer_type, "codex_result_paste_normalizer_preview");
assert.equal(preview.status, "candidate_ready");
assert.equal(preview.source, "top_level_paste");
assert.equal(preview.candidate.work_id, "AG-123");
assert.equal(preview.candidate.scope, "project:augnes");
assert.equal(preview.candidate.pr_url, "https://github.com/hynk-studio/augnes/pull/777");
assert.equal(preview.candidate.pr_number, "777");
assert.deepEqual(preview.candidate.changed_files, [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/public/console-widget.html",
  "scripts/smoke-codex-result-paste-normalizer-preview.mjs",
]);
assert.ok(preview.candidate.verification_commands?.includes("npm run typecheck passed"), "sample must extract a verification command");
assert.ok(preview.candidate.verification_results?.some((line) => /passed/.test(line)), "sample must extract a verification result");
assert.ok(
  preview.candidate.skipped_checks?.some((line) => /no Developer Mode tunnel\/session available/.test(line)),
  "sample must preserve skipped-check concrete reason",
);
assert.ok(
  preview.candidate.remaining_caveats?.some((line) => /Live ChatGPT Developer Mode validation remains manual/.test(line)),
  "sample must extract remaining caveats",
);
assert.match(preview.candidate.authority_boundary_statement ?? "", /preview-only deterministic paste normalizer/);
assert.doesNotMatch(preview.candidate.authority_boundary_statement ?? "", /Next recommended step/);
assert.equal(preview.candidate.result_status, "completed");

const mergeResult = mergeCodexResultInputWithPasteCandidate(
  {
    work_id: "AG-STRUCTURED",
    changed_files: ["docs/STRUCTURED.md"],
    verification_results: ["npm run existing-smoke passed"],
  },
  preview.candidate,
);
assert.equal(mergeResult.mergedInput.work_id, "AG-STRUCTURED", "structured work_id must win");
assert.deepEqual(mergeResult.mergedInput.changed_files, ["docs/STRUCTURED.md"], "structured changed_files must win");
assert.deepEqual(mergeResult.mergedInput.verification_results, ["npm run existing-smoke passed"], "structured verification_results must win");
assert.ok(mergeResult.mergedInput.scope, "paste candidate may fill missing scope");
assert.ok(mergeResult.filledFields.includes("scope"), "merge must expose fields filled from paste");
assert.ok(mergeResult.structuredFieldsPreserved.includes("work_id"), "merge must expose preserved structured fields");
assert.ok(
  mergeResult.conflictWarnings.some((warning) => /Structured work_id was preserved/.test(warning)),
  "merge must surface structured/paste conflicts",
);

const conflictPreview = buildCodexResultPasteNormalizerPreview({
  structuredInput: { raw_result_text: "Work ID: AG-RAW\nSkipped checks: none\nRemaining caveats: none" },
  topLevelPasteText: sampleCloseoutText,
});
assert.equal(conflictPreview.status, "ambiguous", "different top-level and structured raw text must be ambiguous");
assert.ok(conflictPreview.conflict_warnings.some((warning) => /differ/.test(warning)), "raw text conflict must be surfaced");

const nonePreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Summary: completed.
Skipped checks: none
Remaining caveats: none
Authority boundary statement: Preview-only; no writes.
`,
});
assert.deepEqual(nonePreview.candidate.skipped_checks, ["No skipped checks."], "explicit none-skipped statement must be preserved");
assert.deepEqual(nonePreview.candidate.remaining_caveats, ["No remaining caveats."], "explicit none-remaining statement must be preserved");

const partialPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: "Summary\nImplemented a small copy tweak.",
});
assert.equal(partialPreview.status, "partial_candidate", "missing fields must remain partial");
assert.equal(partialPreview.candidate.changed_files, undefined, "missing changed files must not be invented");
assert.equal(partialPreview.candidate.verification_results, undefined, "missing verification results must not be invented");
assert.ok(partialPreview.extraction_warnings.length >= 4, "missing fields must surface extraction warnings");

const combinedSplitPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Skipped checks and caveats
- Live ChatGPT Developer Mode validation skipped because no tunnel/session was available.
- Parser output remains a candidate only and needs human review.
`,
});
assert.deepEqual(
  combinedSplitPreview.candidate.skipped_checks,
  ["Live ChatGPT Developer Mode validation skipped because no tunnel/session was available"],
  "combined section must classify clear skipped validation into skipped_checks",
);
assert.deepEqual(
  combinedSplitPreview.candidate.remaining_caveats,
  ["Parser output remains a candidate only and needs human review"],
  "combined section must classify clear caveat into remaining_caveats",
);
assert.ok(
  !combinedSplitPreview.candidate.skipped_checks.some((line) => combinedSplitPreview.candidate.remaining_caveats.includes(line)),
  "combined section lines must not be duplicated across skipped_checks and remaining_caveats",
);

const combinedNoneSkippedPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Skipped checks and caveats
- Skipped checks: none
- Remaining caveat: Live host validation remains manual.
`,
});
assert.deepEqual(combinedNoneSkippedPreview.candidate.skipped_checks, ["No skipped checks."], "combined none-skipped signal must be preserved");
assert.deepEqual(
  combinedNoneSkippedPreview.candidate.remaining_caveats,
  ["Remaining caveat: Live host validation remains manual"],
  "combined section must keep real caveat when skipped checks are explicitly none",
);

const combinedNoneRemainingPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Skipped validation and caveats
- No remaining caveats.
- Copy Full Context read-back skipped because no trusted host session was available.
`,
});
assert.deepEqual(combinedNoneRemainingPreview.candidate.remaining_caveats, ["No remaining caveats."], "combined none-remaining signal must be preserved");
assert.deepEqual(
  combinedNoneRemainingPreview.candidate.skipped_checks,
  ["Copy Full Context read-back skipped because no trusted host session was available"],
  "combined section must keep skipped check when remaining caveats are explicitly none",
);

const combinedAmbiguousPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Caveats and skipped checks
- Operator follow-up noted in transcript.
`,
});
assert.equal(combinedAmbiguousPreview.candidate.skipped_checks, undefined, "ambiguous combined line must not become skipped_checks");
assert.equal(combinedAmbiguousPreview.candidate.remaining_caveats, undefined, "ambiguous combined line must not become remaining_caveats");
assert.deepEqual(
  combinedAmbiguousPreview.ambiguous_combined_section_lines,
  ["Operator follow-up noted in transcript"],
  "ambiguous combined line must be exposed for human classification",
);
assert.ok(
  combinedAmbiguousPreview.extraction_warnings.some((warning) => /Operator follow-up noted in transcript/.test(warning)),
  "ambiguous combined line must be surfaced in extraction warnings",
);

const singlePurposeSkippedPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Skipped checks
- Operator follow-up noted in transcript.
`,
});
assert.deepEqual(
  singlePurposeSkippedPreview.candidate.skipped_checks,
  ["Operator follow-up noted in transcript"],
  "single-purpose skipped section must preserve current behavior",
);

const singlePurposeCaveatPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
Remaining caveats
- Operator follow-up noted in transcript.
`,
});
assert.deepEqual(
  singlePurposeCaveatPreview.candidate.remaining_caveats,
  ["Operator follow-up noted in transcript"],
  "single-purpose caveats section must preserve current behavior",
);

const fieldFirstPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
summary: Field-first label parser smoke.
work_id: AG-FIELD-FIRST-001
scope: project:augnes
result_status: completed
pr_url: not opened
pr_number: not applicable
live_host_observation: not run - no live host session was started
proof_evidence_rows_written: No proof/evidence rows written.
event_rows_created_or_mutated: No event rows created or mutated.
work_status_changed: No work close/status mutation.
state_committed_or_rejected: No state commit/reject.
changed_files:
- apps/augnes_apps/src/server.ts
- docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md
verification_commands:
- npm run smoke:codex-result-paste-normalizer-preview
- git diff --check
verification_results:
- npm run smoke:codex-result-paste-normalizer-preview passed
- git diff --check passed
skipped_checks:
- Live host observation skipped because no live host session was started.
remaining_caveats:
- Result review remains preview-only.
ambiguous_combined_section_lines:
- Operator follow-up noted in transcript.
authority_boundary_statement: Preview-only parser/read-model change; no proof/evidence write, no work close/status mutation, no event creation/mutation, and no state commit/reject.
next_recommended_step: Human review of field-first parser output.
`,
});
assert.equal(fieldFirstPreview.status, "ambiguous", "field-first ambiguous lines must keep the preview conservative");
assert.equal(fieldFirstPreview.candidate.work_id, "AG-FIELD-FIRST-001");
assert.equal(fieldFirstPreview.candidate.scope, "project:augnes");
assert.equal(fieldFirstPreview.candidate.result_status, "completed");
assert.equal(fieldFirstPreview.candidate.pr_url, undefined, "field-first pr_url: not opened must not become a PR URL");
assert.equal(fieldFirstPreview.candidate.pr_number, undefined, "field-first pr_number: not applicable must not become a PR number");
assert.deepEqual(fieldFirstPreview.candidate.changed_files, [
  "apps/augnes_apps/src/server.ts",
  "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md",
]);
assert.deepEqual(fieldFirstPreview.candidate.verification_commands, [
  "npm run smoke:codex-result-paste-normalizer-preview",
  "git diff --check",
]);
assert.deepEqual(fieldFirstPreview.candidate.verification_results, [
  "npm run smoke:codex-result-paste-normalizer-preview passed",
  "git diff --check passed",
]);
assert.deepEqual(fieldFirstPreview.candidate.skipped_checks, [
  "Live host observation skipped because no live host session was started",
]);
assert.deepEqual(fieldFirstPreview.candidate.remaining_caveats, ["Result review remains preview-only"]);
assert.deepEqual(fieldFirstPreview.ambiguous_combined_section_lines, ["Operator follow-up noted in transcript"]);
assert.equal(
  fieldFirstPreview.field_first_report_context.live_host_observation,
  "not run - no live host session was started",
);
assert.equal(
  fieldFirstPreview.field_first_report_context.proof_evidence_rows_written,
  "No proof/evidence rows written.",
);
assert.equal(
  fieldFirstPreview.field_first_report_context.event_rows_created_or_mutated,
  "No event rows created or mutated.",
);
assert.equal(
  fieldFirstPreview.field_first_report_context.work_status_changed,
  "No work close/status mutation.",
);
assert.equal(
  fieldFirstPreview.field_first_report_context.state_committed_or_rejected,
  "No state commit/reject.",
);
assert.equal(
  fieldFirstPreview.field_first_report_context.next_recommended_step,
  "Human review of field-first parser output.",
);
assert.match(fieldFirstPreview.candidate.authority_boundary_statement ?? "", /Preview-only parser\/read-model change/);
for (const inventedField of [
  "proof_evidence_rows_written",
  "live_host_observation",
  "event_rows_created_or_mutated",
  "work_status_changed",
  "state_committed_or_rejected",
]) {
  assert.equal(
    Object.hasOwn(fieldFirstPreview.candidate, inventedField),
    false,
    `field-first parser must not add ${inventedField} to the result candidate`,
  );
}

const fieldFirstConflictPreview = buildCodexResultPasteNormalizerPreview({
  topLevelPasteText: `
work_id: AG-FIELD-FIRST-CONFLICT
scope: project:augnes
result_status: completed
changed_files:
- docs/FIELD_FIRST.md

Changed files
- docs/SECTION_HEADING.md

verification_results:
- npm run smoke:codex-result-paste-normalizer-preview passed
authority_boundary_statement: Preview-only parser conflict smoke; no write authority.
`,
});
assert.deepEqual(
  fieldFirstConflictPreview.candidate.changed_files,
  ["docs/FIELD_FIRST.md"],
  "field-first list value must win over conflicting section-heading extraction",
);
assert.ok(
  fieldFirstConflictPreview.extraction_warnings.some((warning) => /Field-first changed_files was used/.test(warning)),
  "field-first/section conflict must be surfaced as an extraction warning",
);

assert.deepEqual(
  normalizeCodexResultPasteInput({ structuredInput: { closeoutText: sampleCloseoutText } }).source,
  "structured_input_raw_text",
  "structured raw aliases must be recognized",
);

const featureSource = [
  extractFunction(server, "normalizeCodexResultPasteInput"),
  extractFunction(server, "buildCodexResultPasteNormalizerPreview"),
  extractFunction(server, "mergeCodexResultInputWithPasteCandidate"),
  extractFunction(server, "classifyCodexResultCombinedSectionLine"),
  extractFunction(server, "splitCodexResultCombinedSectionEntries"),
  extractFunction(server, "combinedSectionLineClassificationReason"),
  extractFunction(server, "parseCodexResultFieldFirstLabels"),
  extractFunction(server, "parseCodexResultFieldFirstList"),
  extractFunction(server, "extractCodexResultFieldFirstCandidate"),
  extractFunction(server, "mergeCodexResultFieldFirstCandidate"),
  extractFunction(widget, "normalizeCodexResultPasteNormalizerPreview"),
  extractFunction(widget, "renderCodexResultPasteNormalizerPreview"),
  workBriefBlock,
].join("\n\n");
assertNoForbiddenFeatureAuthority(featureSource);

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-paste-normalizer-preview",
      top_level_paste_aliases_present: true,
      structured_raw_aliases_present: true,
      normalizer_preview_keys_present: true,
      sample_closeout_parsed: true,
      structured_fields_override_paste: true,
      conflict_warnings_surfaced: true,
      skipped_check_reasons_preserved: true,
      explicit_none_signals_detected: true,
      combined_section_split_checked: true,
      combined_none_skipped_checked: true,
      combined_none_remaining_checked: true,
      ambiguous_combined_lines_checked: true,
      field_first_report_labels_checked: true,
      field_first_section_conflict_checked: true,
      single_purpose_sections_unchanged: true,
      missing_fields_remain_partial: true,
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

function extractConstBlock(source, constName) {
  const marker = `const ${constName}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${constName} must exist`);
  const end = source.indexOf("type ", start);
  return source.slice(start, end === -1 ? source.length : end);
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
