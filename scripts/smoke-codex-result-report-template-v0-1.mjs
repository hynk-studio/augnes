import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const templateDocPath = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
const normalizerDocPath = "docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const serverPath = "apps/augnes_apps/src/server.ts";
const packagePath = "package.json";

for (const filePath of [templateDocPath, normalizerDocPath, runbookPath, serverPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const templateDoc = readFileSync(templateDocPath, "utf8");
const normalizerDoc = readFileSync(normalizerDocPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:codex-result-report-template-v0-1"],
  "node scripts/smoke-codex-result-report-template-v0-1.mjs",
  "package.json must expose the Codex result report template smoke script",
);

assertTemplateDoc();
await assertSampleReportNormalizerBehavior();
assertNoForbiddenAuthorityPatterns(`${templateDoc}\n\n${normalizerDocPointer(normalizerDoc)}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-report-template-v0-1",
      template_doc_present: true,
      required_report_sections_present: true,
      optional_fields_present: true,
      explicit_none_examples_present: true,
      ag_dogfood_sample_report_present: true,
      sample_normalizer_extraction_checked: true,
      no_invented_authority_checked: true,
      preview_only_authority_boundaries_checked: true,
      forbidden_feature_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertTemplateDoc() {
  assert.match(
    templateDoc,
    /^# Augnes Codex Result Report Template v0\.1$/m,
    "template doc must have the expected title",
  );

  for (const heading of [
    "## Purpose",
    "## When To Use",
    "## Required Report Sections",
    "## Optional Fields",
    "## Copyable Template",
    "## Field Definitions",
    "## Examples",
    "## Expected Paste Normalizer Behavior",
    "## Authority Boundary Statement",
    "## Skipped Checks Policy",
    "## What This Template Does Not Authorize",
    "## Next Recommended Step",
  ]) {
    assert.match(templateDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `template doc must include ${heading}`);
  }

  for (const requiredField of [
    "summary",
    "work_id",
    "scope",
    "result_status",
    "changed_files",
    "verification_commands",
    "verification_results",
    "skipped_checks",
    "remaining_caveats",
    "ambiguous_combined_section_lines",
    "authority_boundary_statement",
    "next_recommended_step",
  ]) {
    assert.match(templateDoc, new RegExp(`\\b${escapeRegExp(requiredField)}\\b`), `template doc must include ${requiredField}`);
  }

  for (const optionalField of [
    "pr_url",
    "pr_number",
    "live_host_observation",
    "proof_evidence_rows_written",
    "event_rows_created_or_mutated",
    "work_status_changed",
    "state_committed_or_rejected",
  ]) {
    assert.match(templateDoc, new RegExp(`\\b${escapeRegExp(optionalField)}\\b`), `template doc must include optional field ${optionalField}`);
  }

  for (const explicitNoneText of [
    "No skipped checks.",
    "No remaining caveats.",
    "No ambiguous combined-section lines.",
  ]) {
    assert.match(templateDoc, new RegExp(escapeRegExp(explicitNoneText)), `template doc must include ${explicitNoneText}`);
  }

  const sampleReport = extractFencedBlockAfterHeading(templateDoc, "### Filled Sample Report For AG-DOGFOOD-RESEARCH-001");
  assert.match(sampleReport, /work_id: AG-DOGFOOD-RESEARCH-001/, "sample report must include AG-DOGFOOD-RESEARCH-001");
  assert.match(sampleReport, /scope: project:augnes/, "sample report must include project:augnes");
  assert.match(sampleReport, /result_status: completed/, "sample report must report completed status");
  assert.match(sampleReport, /No proof\/evidence rows written\./, "sample report must say no proof/evidence rows were written");
  assert.match(sampleReport, /Live host observation skipped because/, "sample report must include concrete skipped live host reason");
  assert.match(sampleReport, /Augnes review may remain conservative/, "sample report must say review may remain conservative");
  assert.match(sampleReport, /Operator follow-up noted in transcript\./, "sample report must include ambiguous combined-section line");

  for (const expectedExtractionField of [
    "work_id",
    "scope",
    "result_status",
    "changed_files",
    "verification_commands",
    "verification_results",
    "skipped_checks",
    "remaining_caveats",
    "ambiguous_combined_section_lines",
    "authority_boundary_statement",
  ]) {
    assert.match(
      sectionText(templateDoc, "## Expected Paste Normalizer Behavior"),
      new RegExp(escapeRegExp(expectedExtractionField)),
      `expected normalizer behavior must mention ${expectedExtractionField}`,
    );
  }

  for (const noInvented of [
    "verification",
    "proof/evidence rows",
    "PR URLs",
    "host observations",
    "event IDs",
    "close status",
    "state decisions",
  ]) {
    assert.match(
      sectionText(templateDoc, "## Expected Paste Normalizer Behavior"),
      new RegExp(escapeRegExp(noInvented)),
      `expected normalizer behavior must say Augnes must not invent ${noInvented}`,
    );
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
    assert.match(templateDoc, looseTextPattern(boundary), `template doc must include boundary ${boundary}`);
  }

  assert.match(normalizerDoc, /AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1\.md/, "normalizer doc must point to the template");
  assert.match(runbook, /AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1\.md/, "runbook must point to the template");
}

async function assertSampleReportNormalizerBehavior() {
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

  const sampleReport = extractFencedBlockAfterHeading(templateDoc, "### Filled Sample Report For AG-DOGFOOD-RESEARCH-001");
  const preview = buildCodexResultPasteNormalizerPreview({ topLevelPasteText: sampleReport });

  assert.equal(preview.normalizer_type, "codex_result_paste_normalizer_preview");
  assert.equal(preview.status, "ambiguous", "sample should remain ambiguous because it includes a combined-section warning");
  assert.equal(preview.candidate.work_id, "AG-DOGFOOD-RESEARCH-001");
  assert.equal(preview.candidate.scope, "project:augnes");
  assert.equal(preview.candidate.result_status, "completed");
  assert.equal(preview.candidate.pr_url, undefined, "sample must not invent a PR URL");
  assert.equal(preview.candidate.pr_number, undefined, "sample must not invent a PR number");
  assert.deepEqual(preview.candidate.changed_files, [
    "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
    "scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
    "package.json",
    "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
  ]);
  assert.ok(
    preview.candidate.verification_commands?.includes("node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs passed"),
    "sample must extract the scenario-pack smoke command",
  );
  assert.ok(
    preview.candidate.verification_commands?.includes("git diff --check passed"),
    "sample must extract the diff-check command",
  );
  assert.ok(
    preview.candidate.verification_results?.includes("node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs passed"),
    "sample must extract the scenario-pack smoke result",
  );
  assert.ok(
    preview.candidate.verification_results?.includes("git diff --check passed"),
    "sample must extract the diff-check result",
  );
  assert.deepEqual(preview.candidate.skipped_checks, [
    "Live host observation skipped because no live MCP Inspector or ChatGPT Developer Mode session was started",
  ]);
  assert.deepEqual(preview.candidate.remaining_caveats, [
    "Augnes review may remain conservative because one combined skipped-check/caveat line requires human classification",
  ]);
  assert.deepEqual(preview.ambiguous_combined_section_lines, ["Operator follow-up noted in transcript"]);
  assert.match(
    preview.candidate.authority_boundary_statement ?? "",
    /reusable preview-only Codex result report template/,
    "sample must extract authority boundary statement",
  );

  const candidateRecord = preview.candidate;
  for (const inventedField of [
    "proof_evidence_rows_written",
    "live_host_observation",
    "event_rows_created_or_mutated",
    "work_status_changed",
    "state_committed_or_rejected",
  ]) {
    assert.equal(
      Object.hasOwn(candidateRecord, inventedField),
      false,
      `normalizer candidate must not invent ${inventedField}`,
    );
  }
  assert.match(sampleReport, /proof_evidence_rows_written: No proof\/evidence rows written\./);
  assert.match(sampleReport, /live_host_observation: not run - no live MCP Inspector or ChatGPT Developer Mode session was started/);
  assert.match(sampleReport, /work_status_changed: No work close\/status mutation\./);
  assert.match(sampleReport, /state_committed_or_rejected: No state commit\/reject\./);
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

function sectionText(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `${heading} must exist`);
  const nextHeading = source.slice(start + heading.length).match(/\n##\s+/);
  return nextHeading ? source.slice(start, start + heading.length + nextHeading.index) : source.slice(start);
}

function normalizerDocPointer(source) {
  const marker = "AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 1000), markerIndex + 1800);
}

function runbookPointer(source) {
  const marker = "AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looseTextPattern(value) {
  return new RegExp(value.split(/\s+/).map(escapeRegExp).join("\\s+"));
}
