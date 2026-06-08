import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-reviewed-codex-template-mock-pr-task.mjs";
const smokeFile =
  "scripts/smoke-perspective-reviewed-codex-template-mock-pr-eval.mjs";
const docFile =
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_EVAL_V0_1.md";
const reportFile =
  "reports/2026-06-07-perspective-reviewed-codex-template-mock-pr-eval.md";
const artifactFile =
  "reports/dogfood/2026-06-07-perspective-reviewed-codex-template-mock-pr-task.md";
const reviewedTemplateSmokeFile =
  "scripts/smoke-perspective-reviewed-manual-agent-brief-codex-template.mjs";
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
const docText = readFileSync(docFile, "utf8");
const dogfoodScriptText = readFileSync(dogfoodScriptFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const {
  PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_INPUT,
  buildPerspectiveReviewedCodexTemplateMockPrTaskDogfood,
  getPerspectiveReviewedCodexTemplateMockPrForbiddenMarkers,
  getPerspectiveReviewedCodexTemplateMockPrForbiddenValues,
  runPerspectiveReviewedCodexTemplateMockPrTaskDogfood,
} = await import(
  "./dogfood-perspective-reviewed-codex-template-mock-pr-task.mjs"
);

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  artifactFile,
  reviewedTemplateSmokeFile,
  copyRefineSmokeFile,
  reviewLoopSmokeFile,
  handoffDogfoodSmokeFile,
  manualIngressContextSmokeFile,
  readSurfaceSmokeFile,
  localManualSmokeFile,
  ingressModelSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
  "lib/perspective-ingest/perspective-agent-brief-codex-prompt-template.ts",
  "scripts/dogfood-perspective-reviewed-manual-agent-brief-codex-template.mjs",
  "scripts/smoke-perspective-reviewed-codex-template-copy-refine.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_COPY_REFINE_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-copy-refine.md",
  "reports/dogfood/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md",
  "reports/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_FIRST_REAL_DOCS_PR_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-first-real-docs-pr.md",
  "scripts/smoke-perspective-reviewed-codex-template-first-real-docs-pr.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_PROMOTION_PATH_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-promotion-path.md",
  "scripts/smoke-perspective-reviewed-codex-template-promotion-path.mjs",
]);

assert.equal(
  packageJson.scripts["dogfood:perspective-reviewed-codex-template-mock-pr-task"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-reviewed-codex-template-mock-pr-task",
);
assert.equal(
  packageJson.scripts["smoke:perspective-reviewed-codex-template-mock-pr-eval"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-reviewed-codex-template-mock-pr-eval",
);

for (const file of [dogfoodScriptFile, smokeFile, docFile]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Reviewed Codex Template Mock PR Eval v0.1",
  "evaluates the reviewed Codex prompt template using a mock PR task",
  "follows PR #457",
  "dogfood/report-only",
  "does not execute Codex",
  "call GitHub",
  "add routes",
  "add UI",
  "persist anything",
  "does not implement the mock task in product code",
  "generated artifacts for human review",
  "Codex codes/tests/opens PR only in a real user-approved scoped run",
  "ChatGPT reviews the PR",
  "The user decides whether to merge",
  "Mock PR Task Design",
  "Evaluation Criteria",
  "Raw-Value Exclusions",
  "Refine reviewed Codex prompt template from mock PR findings",
]);

assertContainsAll(dogfoodScriptText, [
  "buildPerspectiveReviewedCodexTemplateMockPrTaskDogfood",
  "runPerspectiveReviewedCodexTemplateMockPrTaskDogfood",
  "PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_TASK_SCOPE",
  "mock PR plan",
  "No real PR opened.",
  "No GitHub call.",
  "Judgment:",
]);

const dogfood = runPerspectiveReviewedCodexTemplateMockPrTaskDogfood();
const rebuiltDogfood = buildPerspectiveReviewedCodexTemplateMockPrTaskDogfood();
assert.equal(
  rebuiltDogfood.evaluation.judgment,
  "PASS",
  "mock PR dogfood builder should produce a PASS judgment",
);

assert.equal(existsSync(artifactFile), true, "dogfood artifact must exist");
assert.equal(existsSync(reportFile), true, "evaluation report must exist");

const artifactText = readFileSync(artifactFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertContainsAll(artifactText, [
  "mock evaluation artifact",
  "not a real Codex run",
  "No real PR opened",
  "No GitHub call",
  "Whole Constellation reviewed Codex prompt template",
  "Selected Node reviewed Codex prompt template",
  "Mock Codex interpretation",
  "Mock PR plan",
  "Expected changed files",
  "Test plan",
  "Risks",
  "PR body outline",
  "Codex codes/tests/opens PR",
  "ChatGPT reviews the PR",
  "User decides whether to merge",
  "Summary: omitted for manual ingress packet.",
  "manual_pasted_text",
  "user_provided_local",
  "accepted_for_preview",
  "local/read-only",
]);
assertNoForbiddenArtifactText(artifactText, dogfood.preview);

assertContainsAll(reportText, [
  "Judgment: PASS",
  "Prompt task clarity",
  "PR-centered workflow clarity",
  "Authority and runtime boundaries",
  "Raw-value exclusion",
  "Mock PR usefulness",
  "Recommended Next Implementation PR",
  "Refine reviewed Codex prompt template from mock PR findings",
]);

assert.equal(
  cockpitText.includes("perspective-reviewed-codex-template-mock-pr-task"),
  false,
  "product UI must not expose the mock PR task artifact",
);
assert.equal(
  cockpitText.includes("Perspective Reviewed Codex Template Mock PR"),
  false,
  "product UI must not render mock PR evaluation copy",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

assertChangedFileBoundary();
assertNoRuntimePlumbingInChangedFiles();

console.log("PASS smoke:perspective-reviewed-codex-template-mock-pr-eval");

function assertNoForbiddenArtifactText(text, preview) {
  assert.equal(
    text.includes(PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_INPUT),
    false,
    "mock artifact must not include raw manual input verbatim",
  );

  for (const forbiddenValue of getPerspectiveReviewedCodexTemplateMockPrForbiddenValues(
    preview,
  )) {
    assert.equal(
      text.includes(forbiddenValue),
      false,
      `mock artifact must not include forbidden raw/candidate value: ${forbiddenValue}`,
    );
  }

  for (const forbiddenMarker of getPerspectiveReviewedCodexTemplateMockPrForbiddenMarkers()) {
    assert.equal(
      text.includes(forbiddenMarker),
      false,
      `mock artifact must not include forbidden marker: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `mock PR eval changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("app/globals.css") &&
        (!changedFile.startsWith("lib/") ||
          changedFile ===
            "lib/perspective-ingest/perspective-agent-brief-codex-prompt-template.ts") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.includes("persistence") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("codex-execution") &&
        !changedFile.includes("oauth"),
      `mock PR eval must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertNoRuntimePlumbingInChangedFiles() {
  const forbiddenMarkers =
    getPerspectiveReviewedCodexTemplateMockPrForbiddenMarkers().filter(
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
          ["git", "push"].join(" "),
          ["git", "create", "pr"].join("-"),
          ["::", "git", "-"].join(""),
          ["real", "PR", "was", "opened"].join(" "),
          ["real", "pull", "request", "was", "opened"].join(" "),
        ].includes(marker),
    );
  const filesToScan = [
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
