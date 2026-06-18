import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const guidePath = "docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md";
const packagePath = "package.json";

for (const filePath of [serverPath, widgetPath, guidePath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const guide = readFileSync(guidePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:boundary-copy-diet-v0-1"],
  "node scripts/smoke-boundary-copy-diet-v0-1.mjs",
  "package.json must expose the boundary copy diet smoke",
);

for (const required of [
  "BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF",
  "compactBoundaryCopy",
  "capability_class",
  "default_boundary_summary",
  "diagnostics_available",
  "boundary_diagnostics",
  "detailed_boundary_text",
  "diagnostics_boundary_text",
  "docs/AUTHORITY_MATRIX.md#read-only-response-sections",
]) {
  assert.match(server, new RegExp(escapeRegExp(required)), `server must include ${required}`);
}

for (const [label, pattern] of [
  ["Work Picker compact boundary", /boundary_text:\s*\[WORK_PICKER_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Work Contract compact boundary", /authority_boundary_text:\s*\[WORK_CONTRACT_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Codex Handoff compact boundary", /boundary_text:\s*\[CODEX_HANDOFF_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Core Handoff compact boundary", /authority_boundaries:\s*\[CORE_HANDOFF_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Final Handoff compact boundary", /authority_boundaries:\s*\[CODEX_HANDOFF_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Result Review compact boundary", /boundary_text:\s*\[CODEX_RESULT_REVIEW_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Paste Normalizer compact boundary", /boundary_text:\s*\[CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Result Closure compact boundary", /boundary_text:\s*\[RESULT_REVIEW_CLOSURE_BOUNDARY_COPY\.default_boundary_summary\]/],
  ["Execution Request compact non-authority", /non_authorities:\s*\[CODEX_EXECUTION_REQUEST_BOUNDARY_COPY\.default_boundary_summary\]/],
]) {
  assert.match(server, pattern, `${label} must use a compact default summary`);
}

for (const [label, pattern] of [
  ["Work Picker details retained", /detailedBoundaryText:\s*WORK_PICKER_CARD_BOUNDARY_TEXT/],
  ["Work Contract details retained", /detailedBoundaryText:\s*WORK_CONTRACT_CARD_BOUNDARY_TEXT/],
  ["Codex Handoff details retained", /detailedBoundaryText:\s*CODEX_HANDOFF_PREVIEW_BOUNDARY_TEXT/],
  ["Core Handoff details retained", /detailedBoundaryText:\s*CORE_HANDOFF_AUTHORITY_BOUNDARIES/],
  ["PR checklist details retained", /detailedBoundaryText:\s*PR_BODY_CHECKLIST_BOUNDARY_TEXT/],
  ["PR checklist forbidden details retained", /detailedForbiddenActions:\s*PR_BODY_CHECKLIST_FORBIDDEN_CLAIMS/],
  ["Result Review details retained", /detailedBoundaryText:\s*CODEX_RESULT_REVIEW_PACKET_BOUNDARY_TEXT/],
  ["Paste Normalizer details retained", /detailedBoundaryText:\s*CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_TEXT/],
  ["Result Closure details retained", /detailedBoundaryText:\s*RESULT_REVIEW_CLOSURE_PREVIEW_BOUNDARY_TEXT/],
  ["Execution Request details retained", /detailedBoundaryText:\s*CODEX_EXECUTION_REQUEST_PREVIEW_BOUNDARY_TEXT/],
  ["Execution Request non-authority details retained", /detailedNonAuthorities:\s*CODEX_EXECUTION_REQUEST_PREVIEW_NON_AUTHORITIES/],
]) {
  assert.match(server, pattern, `${label} must stay machine-readable in diagnostics`);
}

const defaultServerSource = [
  extractFunction(server, "buildCopyableHandoffText"),
  extractFunction(server, "buildCoreCodexHandoffText"),
  extractFunction(server, "buildFinalCodexHandoffText"),
  extractFunction(server, "describeWorkContractCard"),
  extractFunction(server, "describeCodexHandoffPreview"),
  extractFunction(server, "describeFinalCodexHandoffPacket"),
  extractFunction(server, "buildCodexExecutionRequestPreview"),
  extractFunction(server, "buildResultReviewClosurePreview"),
  extractFunction(server, "describeResultReviewClosurePreview"),
].join("\n\n");

const defaultWidgetSource = [
  extractFunction(widget, "normalizeWorkPickerCard"),
  extractFunction(widget, "normalizeWorkContractCard"),
  extractFunction(widget, "normalizeCodexHandoffPreview"),
  extractFunction(widget, "prBodyChecklistBoundaryText"),
  extractFunction(widget, "prBodyChecklistForbiddenClaims"),
  extractFunction(widget, "codexResultReviewBoundaryText"),
  extractFunction(widget, "codexResultPasteNormalizerBoundaryText"),
  extractFunction(widget, "resultReviewClosureBoundaryText"),
  extractFunction(widget, "coreAuthorityBoundaryText"),
  extractFunction(widget, "codexExecutionRequestNonAuthorities"),
  extractFunction(widget, "normalizeCodexExecutionRequestPreview"),
  extractFunction(widget, "renderCodexExecutionRequestPreview"),
  extractFunction(widget, "renderPrBodyChecklistPreview"),
  extractFunction(widget, "renderCodexResultReviewPacketPreview"),
  extractFunction(widget, "renderResultReviewClosurePreview"),
  extractFunction(widget, "renderFinalCodexHandoffPacket"),
].join("\n\n");

for (const [label, source] of [
  ["server default handoff/product source", defaultServerSource],
  ["widget default rendered source", defaultWidgetSource],
]) {
  assertNoLongRepeatedBoundaryLists(source, label);
  assertNoPositiveAuthorityGrant(source, label);
}

assert.match(
  guide,
  /Default App\/MCP cards now use compact capability summaries\./,
  "guide must document compact default capability summaries",
);
assert.match(
  guide,
  /Detailed boundary\s+text stays available in diagnostics\/debug fields and Authority Matrix refs\./,
  "guide must document detailed boundary diagnostics without expanding another boundary essay",
);

const requireFromSmoke = createRequire(import.meta.url);
const { tsImport } = requireFromSmoke("../apps/augnes_apps/node_modules/tsx/dist/esm/api/index.cjs");
const serverModule = await tsImport(
  new URL("../apps/augnes_apps/src/server.ts", import.meta.url).href,
  import.meta.url,
);
const { buildCodexResultPasteNormalizerPreview } = serverModule;
assert.equal(typeof buildCodexResultPasteNormalizerPreview, "function");

const normalizerPreview = buildCodexResultPasteNormalizerPreview({});
assert.deepEqual(
  normalizerPreview.boundary_text,
  ["Preview-only parser for pasted Codex reports. It extracts candidate fields for human review."],
  "paste normalizer default boundary_text must be compact",
);
assert.equal(normalizerPreview.diagnostics_available, true);
assert.equal(normalizerPreview.authority_matrix_ref, "docs/AUTHORITY_MATRIX.md#read-only-response-sections");
assert.ok(
  normalizerPreview.boundary_diagnostics.detailed_boundary_text.some((line) =>
    /No Codex execution, shell execution/.test(line)
  ),
  "paste normalizer detailed boundary text must remain available in diagnostics",
);

console.log(
  JSON.stringify(
    {
      smoke: "boundary-copy-diet-v0-1",
      compact_boundary_helper_present: true,
      targeted_default_boundaries_compact: true,
      detailed_boundary_diagnostics_retained: true,
      default_product_copy_long_lists_absent: true,
      positive_authority_grants_absent: true,
      docs_note_present: true,
      exported_normalizer_compact_boundary_checked: true,
    },
    null,
    2,
  ),
);

function assertNoLongRepeatedBoundaryLists(source, label) {
  for (const forbiddenLongCopy of [
    "This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge.",
    "This preview cannot record evidence.",
    "This preview cannot record proof.",
    "This preview cannot approve, publish, retry, replay, or externally post.",
    "No GitHub comments, review submissions, approvals, change requests, labels, status updates, merges",
    "No Codex execution, shell execution, provider call, OpenAI call, branch/PR creation",
    "No work close.",
    "No work status update.",
    "No event creation.",
    "No proof/evidence write.",
    "Do not claim proof/evidence rows, screenshots, host observations, GitHub PR creation",
  ]) {
    assert.doesNotMatch(
      source,
      new RegExp(escapeRegExp(forbiddenLongCopy)),
      `${label} must not expose long repeated boundary copy by default: ${forbiddenLongCopy}`,
    );
  }
}

function assertNoPositiveAuthorityGrant(source, label) {
  const grantPatterns = [
    /\bexecute Codex\b/gi,
    /\brecord proof\b/gi,
    /\brecord evidence\b/gi,
    /\bapprove\b/gi,
    /\bpublish\b/gi,
    /\bmerge\b/gi,
    /\bdeploy\b/gi,
    /\bcreate PR\b/gi,
  ];
  for (const pattern of grantPatterns) {
    for (const match of source.matchAll(pattern)) {
      const index = match.index ?? 0;
      const context = source.slice(Math.max(0, index - 90), Math.min(source.length, index + 110));
      assert.ok(
        isNegatedDiagnosticOrExternal(context),
        `${label} contains possible positive authority grant "${match[0]}" without negation/diagnostic context: ${context}`,
      );
    }
  }
}

function isNegatedDiagnosticOrExternal(context) {
  return /\b(no|not|does not|do not|cannot|without|outside|remain outside|stays outside|preview-only|read-only|diagnostics|external evidence|detailed authority limits|does_not_)\b/i.test(context);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
