import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const promptTemplateBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief-codex-prompt-template.ts";
const handoffPacketBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-reviewed-manual-agent-brief-codex-template.mjs";
const smokeFile =
  "scripts/smoke-perspective-reviewed-manual-agent-brief-codex-template.mjs";
const docFile =
  "docs/PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_V0_1.md";
const reportFile =
  "reports/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md";
const artifactFile =
  "reports/dogfood/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md";
const copyRefineSmokeFile =
  "scripts/smoke-perspective-agent-brief-handoff-copy-refine.mjs";
const reviewLoopSmokeFile =
  "scripts/smoke-perspective-manual-agent-brief-codex-review-loop-eval.mjs";
const handoffDogfoodSmokeFile =
  "scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs";
const manualIngressContextSmokeFile =
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs";
const readSurfaceSmokeFile =
  "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const localManualSmokeFile =
  "scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs";
const ingressModelSmokeFile =
  "scripts/smoke-perspective-ingress-admission-model.mjs";
const projectionBuildersSmokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const cockpitFile = "components/augnes-cockpit.tsx";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const promptTemplateBuilderText = readFileSync(
  promptTemplateBuilderFile,
  "utf8",
);
const docText = readFileSync(docFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const { buildPerspectiveAgentBrief } = await import(
  "../lib/perspective-ingest/perspective-agent-brief.ts"
);
const { buildPerspectiveAgentBriefCodexPromptTemplate } = await import(
  "../lib/perspective-ingest/perspective-agent-brief-codex-prompt-template.ts"
);
const { buildPerspectiveAgentBriefHandoffPacket } = await import(
  "../lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts"
);
const { buildPerspectiveIngestLocalPreviewReadResponse } = await import(
  "../lib/readonly-api/perspective-ingest-local-preview.ts"
);
const { buildPerspectiveAgentBriefSourcePreview } = await import(
  "../lib/readonly-api/perspective-agent-brief.ts"
);
const {
  PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_INPUT,
  buildPerspectiveReviewedManualAgentBriefCodexTemplateDogfood,
  getPerspectiveReviewedManualAgentBriefCodexTemplateForbiddenMarkers,
  getPerspectiveReviewedManualAgentBriefCodexTemplateForbiddenValues,
  runPerspectiveReviewedManualAgentBriefCodexTemplateDogfood,
} = await import(
  "./dogfood-perspective-reviewed-manual-agent-brief-codex-template.mjs"
);

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  promptTemplateBuilderFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  artifactFile,
  copyRefineSmokeFile,
  reviewLoopSmokeFile,
  handoffDogfoodSmokeFile,
  manualIngressContextSmokeFile,
  readSurfaceSmokeFile,
  localManualSmokeFile,
  ingressModelSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
  "scripts/dogfood-perspective-reviewed-codex-template-mock-pr-task.mjs",
  "scripts/smoke-perspective-reviewed-codex-template-mock-pr-eval.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_EVAL_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-mock-pr-eval.md",
  "reports/dogfood/2026-06-07-perspective-reviewed-codex-template-mock-pr-task.md",
]);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-reviewed-manual-agent-brief-codex-template"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-reviewed-manual-agent-brief-codex-template",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-reviewed-manual-agent-brief-codex-template"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-reviewed-manual-agent-brief-codex-template",
);

for (const file of [
  promptTemplateBuilderFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(promptTemplateBuilderText, [
  "PerspectiveAgentBriefCodexPromptTemplateV0",
  "BuildPerspectiveAgentBriefCodexPromptTemplateInput",
  "buildPerspectiveAgentBriefCodexPromptTemplate",
  "perspective_agent_brief_codex_prompt_template.v0.1",
  "Perspective Agent Brief Codex prompt templates require a codex_handoff packet.",
  "Use this as a user-approved scoped Codex PR task.",
  "Codex May",
  "Codex Must Not",
  "Review Chain",
  "Source Packet",
]);
for (const forbidden of [
  "JSON.stringify(packet",
  "JSON.stringify(brief",
  "JSON.stringify(ingress",
  "JSON.stringify(",
]) {
  assert.equal(
    promptTemplateBuilderText.includes(forbidden),
    false,
    `${promptTemplateBuilderFile} must not serialize raw packet or brief objects: ${forbidden}`,
  );
}

assertContainsAll(docText, [
  "# Perspective Reviewed Manual Agent Brief Codex Template v0.1",
  "reviewed Codex prompt template builder",
  "follows PR #456",
  "human-reviewed copy/paste",
  "does not execute Codex",
  "call GitHub",
  "add routes",
  "add UI",
  "PR-Centered Workflow",
  "Codex codes, tests, and opens a PR",
  "ChatGPT reviews the PR",
  "The user decides whether to merge",
  "Codex May",
  "Codex Must Not",
  "Source Packet Inclusion",
  "Raw-Value Exclusions",
  "Evaluate reviewed Codex prompt template with a mock PR task",
]);

const dogfood = runPerspectiveReviewedManualAgentBriefCodexTemplateDogfood();
const rebuiltDogfood =
  buildPerspectiveReviewedManualAgentBriefCodexTemplateDogfood();
assert.equal(
  rebuiltDogfood.evaluation.judgment,
  "PASS",
  "dogfood builder should produce a PASS judgment",
);

assert.equal(existsSync(artifactFile), true, "dogfood artifact must exist");
assert.equal(existsSync(reportFile), true, "validation report must exist");

const artifactText = readFileSync(artifactFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertContainsAll(artifactText, [
  "perspective_agent_brief_codex_prompt_template.v0.1",
  "Use this as a user-approved scoped Codex PR task",
  "Codex May",
  "Codex Must Not",
  "Review Chain",
  "Codex codes/tests/opens PR",
  "ChatGPT reviews PR",
  "User decides whether to merge",
  "Source Packet",
  "Audience: codex_handoff",
  "Summary: omitted for manual ingress packet.",
  "manual_pasted_text",
  "user_provided_local",
  "accepted_for_preview",
  "local/read-only",
]);
assertNoForbiddenDogfoodText(artifactText, dogfood.preview);

assertContainsAll(reportText, [
  "Judgment: PASS",
  "Prompt Template Shape",
  "Safety / Exclusion Checks",
  "Review-loop Workflow Checks",
  "Recommended Next Implementation PR",
  "Evaluate reviewed Codex prompt template with a mock PR task",
]);

const generatedAt = "2026-06-08T00:00:00.000Z";
const manualPreview = buildPerspectiveIngestLocalPreviewReadResponse({
  generatedAt,
  request: {
    input_kind: "manual:pasted_text",
    source_label: "Reviewed Codex template smoke",
    input_text: [
      "Intent: Smoke a reviewed Codex prompt template.",
      "Concept: The template wraps a codex_handoff packet.",
      "Decision: Reject non-codex handoff packets.",
      "Work: Check template shape and exclusions.",
      "Validation: Run the reviewed template smoke.",
      "Evidence: reviewed-codex-template-smoke",
    ].join("\n"),
  },
});
const manualBrief = buildPerspectiveAgentBrief({
  preview: manualPreview,
  scope_mode: "whole_constellation",
  scope_label: "Whole Constellation",
});
const chatGptReviewPacket = buildPerspectiveAgentBriefHandoffPacket({
  brief: manualBrief,
  audience: "chatgpt_review",
  generated_at: generatedAt,
});
assert.throws(
  () =>
    buildPerspectiveAgentBriefCodexPromptTemplate({
      packet: chatGptReviewPacket,
      generated_at: generatedAt,
    }),
  /codex_handoff packet/,
  "builder must reject non-codex_handoff packet audience",
);

const samplePreview = buildPerspectiveAgentBriefSourcePreview({
  source: "sample:chatgpt",
});
assert.equal(
  samplePreview.constellation.nodes.length,
  7,
  "sample ChatGPT node count must remain stable",
);
assert.equal(
  samplePreview.constellation.edges.length,
  8,
  "sample ChatGPT edge count must remain stable",
);
assert.equal(
  samplePreview.unresolved_tensions.length,
  2,
  "sample ChatGPT tension count must remain stable",
);

assert.equal(
  cockpitText.includes("perspective_agent_brief_codex_prompt_template"),
  false,
  "product UI must not expose the reviewed Codex prompt template",
);
assert.equal(
  cockpitText.includes("Reviewed Manual Agent Brief Codex Template"),
  false,
  "product UI must not render reviewed Codex template dogfood copy",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

assertChangedFileBoundary();
assertNoRuntimePlumbingInChangedFiles();

console.log(
  "PASS smoke:perspective-reviewed-manual-agent-brief-codex-template",
);

function assertNoForbiddenDogfoodText(text, preview) {
  assert.equal(
    text.includes(PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_INPUT),
    false,
    "prompt artifact must not include raw manual input verbatim",
  );

  for (const forbiddenValue of getPerspectiveReviewedManualAgentBriefCodexTemplateForbiddenValues(
    preview,
  )) {
    assert.equal(
      text.includes(forbiddenValue),
      false,
      `prompt artifact must not include forbidden raw/candidate value: ${forbiddenValue}`,
    );
  }

  for (const forbiddenMarker of getPerspectiveReviewedManualAgentBriefCodexTemplateForbiddenMarkers()) {
    assert.equal(
      text.includes(forbiddenMarker),
      false,
      `prompt artifact must not include forbidden marker: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `reviewed Codex template changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("app/globals.css") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.includes("persistence") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("codex-execution") &&
        !changedFile.includes("oauth"),
      `reviewed Codex template must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertNoRuntimePlumbingInChangedFiles() {
  const forbiddenMarkers =
    getPerspectiveReviewedManualAgentBriefCodexTemplateForbiddenMarkers().filter(
      (marker) =>
        ![
          ["input", "text"].join("_"),
          "\"ingress_admission\"",
          "\"brief_version\"",
          "\"candidate_id\"",
          "\"source_ref\"",
          "\"pointer_refs\"",
          "\"actor_refs\"",
          "\"consent_ref\"",
          "\"bounded_summary\"",
          "Perspective Handoff Packet",
          "Graph nodes:",
          "Graph edges:",
          "OAuth token",
          "billing marker",
        ].includes(marker),
    );
  const filesToScan = [
    promptTemplateBuilderFile,
    dogfoodScriptFile,
    smokeFile,
    docFile,
    reportFile,
    artifactFile,
  ];

  for (const file of filesToScan) {
    const text = existsSync(file) ? readFileSync(file, "utf8") : "";
    for (const forbiddenMarker of forbiddenMarkers) {
      assert.equal(
        text.includes(forbiddenMarker),
        false,
        `${file} must not add runtime/provider/token plumbing: ${forbiddenMarker}`,
      );
    }
  }
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
