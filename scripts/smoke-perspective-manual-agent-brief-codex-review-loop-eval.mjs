import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-manual-agent-brief-codex-review-loop.mjs";
const smokeFile =
  "scripts/smoke-perspective-manual-agent-brief-codex-review-loop-eval.mjs";
const docFile =
  "docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_EVAL_V0_1.md";
const reportFile =
  "reports/2026-06-07-perspective-manual-agent-brief-codex-review-loop-eval.md";
const packetArtifactFile =
  "reports/dogfood/2026-06-07-perspective-manual-agent-brief-codex-review-loop-packet.md";
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
const docText = readFileSync(docFile, "utf8");
const dogfoodScriptText = readFileSync(dogfoodScriptFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const {
  PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT,
  buildPerspectiveManualAgentBriefCodexReviewLoopDogfood,
  getPerspectiveManualAgentBriefCodexReviewLoopForbiddenMarkers,
  getPerspectiveManualAgentBriefCodexReviewLoopForbiddenValues,
  runPerspectiveManualAgentBriefCodexReviewLoopDogfood,
} = await import("./dogfood-perspective-manual-agent-brief-codex-review-loop.mjs");
const { buildPerspectiveAgentBriefSourcePreview } = await import(
  "../lib/readonly-api/perspective-agent-brief.ts"
);

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  packetArtifactFile,
  handoffDogfoodSmokeFile,
  manualIngressContextSmokeFile,
  readSurfaceSmokeFile,
  localManualSmokeFile,
  ingressModelSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
  "lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts",
  "docs/PERSPECTIVE_AGENT_BRIEF_HANDOFF_COPY_REFINE_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-handoff-copy-refine.md",
  "scripts/smoke-perspective-agent-brief-handoff-copy-refine.mjs",
  "lib/perspective-ingest/perspective-agent-brief-codex-prompt-template.ts",
  "scripts/dogfood-perspective-reviewed-manual-agent-brief-codex-template.mjs",
  "scripts/smoke-perspective-reviewed-manual-agent-brief-codex-template.mjs",
  "docs/PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md",
  "reports/dogfood/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md",
  "scripts/dogfood-perspective-reviewed-codex-template-mock-pr-task.mjs",
  "scripts/smoke-perspective-reviewed-codex-template-mock-pr-eval.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_EVAL_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-mock-pr-eval.md",
  "reports/dogfood/2026-06-07-perspective-reviewed-codex-template-mock-pr-task.md",
  "scripts/smoke-perspective-reviewed-codex-template-copy-refine.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_COPY_REFINE_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-copy-refine.md",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_FIRST_REAL_DOCS_PR_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-first-real-docs-pr.md",
  "scripts/smoke-perspective-reviewed-codex-template-first-real-docs-pr.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_PROMOTION_PATH_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-promotion-path.md",
  "scripts/smoke-perspective-reviewed-codex-template-promotion-path.mjs",
]);

assert.equal(
  packageJson.scripts["dogfood:perspective-manual-agent-brief-codex-review-loop"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-manual-agent-brief-codex-review-loop",
);
assert.equal(
  packageJson.scripts["smoke:perspective-manual-agent-brief-codex-review-loop-eval"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-manual-agent-brief-codex-review-loop-eval",
);

for (const file of [dogfoodScriptFile, smokeFile, docFile]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Manual Agent Brief Codex Review Loop Eval v0.1",
  "evaluates the manual Agent Brief handoff packet in a Codex review loop",
  "follows PR #454",
  "report/dogfood only",
  "does not execute Codex",
  "call GitHub",
  "add routes",
  "add UI",
  "persist anything",
  "human-reviewed copy/paste",
  "Codex codes, tests, and opens a PR",
  "ChatGPT reviews the PR",
  "The user decides whether to merge",
  "Evaluation criteria",
  "Raw-value exclusion",
  "Add reviewed manual Agent Brief packet template for Codex prompts",
]);

assertContainsAll(dogfoodScriptText, [
  "buildPerspectiveManualAgentBriefCodexReviewLoopDogfood",
  "runPerspectiveManualAgentBriefCodexReviewLoopDogfood",
  "Perspective Agent Brief Handoff",
  "codex_handoff",
  "human should review before copying into Codex",
  "Codex should open a PR, not merge",
  "Codex may code, test, and open a PR only when the surrounding prompt explicitly scopes that task.",
  "Packet does not grant Codex execution authority by itself.",
  "Judgment:",
]);

const dogfood = runPerspectiveManualAgentBriefCodexReviewLoopDogfood();
const rebuiltDogfood = buildPerspectiveManualAgentBriefCodexReviewLoopDogfood();
assert.equal(
  rebuiltDogfood.evaluation.judgment,
  "PASS",
  "dogfood builder should produce a PASS judgment",
);

assert.equal(existsSync(reportFile), true, "evaluation report must exist");
assert.equal(existsSync(packetArtifactFile), true, "dogfood packet artifact must exist");

const reportText = readFileSync(reportFile, "utf8");
const packetArtifactText = readFileSync(packetArtifactFile, "utf8");

assertContainsAll(packetArtifactText, [
  "Perspective Agent Brief Handoff",
  "Audience: codex_handoff",
  "Purpose",
  "Selected Material",
  "Spatial Context",
  "Temporal Context",
  "Ingress Context",
  "Handoff Constraints",
  "Authority",
  "Exclusions",
  "human should review",
  "Codex should open a PR, not merge",
  "manual_pasted_text",
  "user_provided_local",
  "episode_candidate",
  "accepted_for_preview",
  "preview ready",
  "local/read-only",
  "Summary: omitted for manual ingress packet.",
  "user-approved Codex PR workflow",
  "code, test, and open a PR",
  "surrounding prompt explicitly scopes",
  "packet does not grant",
  "No merge/deploy/publish authority.",
  "ChatGPT reviews the PR.",
  "User decides whether to merge.",
]);
assert.equal(
  packetArtifactText.includes("- Do not execute Codex."),
  false,
  "dogfood artifact must not include the ambiguous standalone Codex execution ban",
);

assert.equal(
  packetArtifactText.includes(PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT),
  false,
  "artifact must not include raw manual input verbatim",
);

for (const forbiddenValue of getPerspectiveManualAgentBriefCodexReviewLoopForbiddenValues(
  dogfood.preview,
)) {
  assert.equal(
    packetArtifactText.includes(forbiddenValue),
    false,
    `artifact must not include forbidden raw/candidate value: ${forbiddenValue}`,
  );
}

for (const forbiddenMarker of getPerspectiveManualAgentBriefCodexReviewLoopForbiddenMarkers()) {
  assert.equal(
    packetArtifactText.includes(forbiddenMarker),
    false,
    `artifact must not include forbidden marker: ${forbiddenMarker}`,
  );
}

assertContainsAll(reportText, [
  "Judgment: PASS",
  "Scope clarity",
  "Authority clarity",
  "Raw-value exclusion",
  "Codex review-loop usefulness",
  "Recommended Next Implementation PR",
  "Add reviewed manual Agent Brief packet template for Codex prompts",
]);

const chatGptPreview = buildPerspectiveAgentBriefSourcePreview({
  source: "sample:chatgpt",
});
assert.equal(
  chatGptPreview.constellation.nodes.length,
  7,
  "sample ChatGPT node count must remain stable",
);
assert.equal(
  chatGptPreview.constellation.edges.length,
  8,
  "sample ChatGPT edge count must remain stable",
);
assert.equal(
  chatGptPreview.unresolved_tensions.length,
  2,
  "sample ChatGPT tension count must remain stable",
);

assert.equal(
  cockpitText.includes("perspective-manual-agent-brief-codex-review-loop"),
  false,
  "product UI must not expose the dogfood packet artifact",
);
assert.equal(
  cockpitText.includes("Perspective Manual Agent Brief Codex Review Loop"),
  false,
  "product UI must not render dogfood evaluation copy",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `Codex review loop eval changed an out-of-scope file: ${changedFile}`,
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
    `Codex review loop eval must not change forbidden surfaces: ${changedFile}`,
  );
}

assertNoRuntimePlumbingInChangedFiles();

console.log("PASS perspective manual Agent Brief Codex review loop eval smoke");

function assertNoRuntimePlumbingInChangedFiles() {
  const forbiddenMarkers =
    getPerspectiveManualAgentBriefCodexReviewLoopForbiddenMarkers().filter(
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
    dogfoodScriptFile,
    smokeFile,
    docFile,
    reportFile,
    packetArtifactFile,
  ];

  for (const changedFile of filesToScan) {
    const text = existsSync(changedFile) ? readFileSync(changedFile, "utf8") : "";
    for (const forbiddenMarker of forbiddenMarkers) {
      assert.equal(
        text.includes(forbiddenMarker),
        false,
        `${changedFile} must not add runtime/provider/token plumbing: ${forbiddenMarker}`,
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
