import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REAL_TRANSCRIPT_CAPTURE_INSTRUCTIONS_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-real-transcript-capture-instructions.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const transcriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md";
const transcriptDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-transcript.md";
const transcriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const transcriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const promptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const pipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const pipelineDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const realTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs";
const realTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs";
const realTranscriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const realTranscriptDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md";
const draftSchemaAlignmentHelperFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts";
const draftSchemaAlignmentDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-draft-schema-alignment.mjs";
const draftSchemaAlignmentSmokeFile =
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs";
const draftSchemaAlignmentDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md";
const draftSchemaAlignmentReportFile =
  "reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md";
const canonicalPromptContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const canonicalPromptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const canonicalPromptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md";
const canonicalPromptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md";
const refinedPromptRealTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedPromptRealTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedPromptRealTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const refinedPromptRealTranscriptReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md";
const secondRefinedTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-second-refined-transcript.mjs";
const secondRefinedTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs";
const secondRefinedTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SECOND_REFINED_TRANSCRIPT_DOGFOOD_V0_1.md";
const secondRefinedTranscriptReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-second-refined-transcript.md";
const provenanceStaleWordingDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingSmokeFile =
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md";
const provenanceStaleWordingReportFile =
  "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md";
const refinedFindingsContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md";
const refinedFindingsContractReportFile =
  "reports/2026-06-09-perspective-codex-former-refined-findings-contract.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  manualCopyPacketFile,
  docFile,
  reportFile,
  smokeFile,
  promptContractFile,
  transcriptDogfoodDocFile,
  transcriptDogfoodReportFile,
  transcriptDogfoodScriptFile,
  transcriptDogfoodSmokeFile,
  manualCopyPacketSmokeFile,
  promptContractSmokeFile,
  pipelineSmokeFile,
  pipelineDogfoodSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  realTranscriptDogfoodScriptFile,
  realTranscriptDogfoodSmokeFile,
  realTranscriptDogfoodDocFile,
  realTranscriptDogfoodReportFile,
  draftSchemaAlignmentHelperFile,
  draftSchemaAlignmentDogfoodScriptFile,
  draftSchemaAlignmentSmokeFile,
  draftSchemaAlignmentDocFile,
  draftSchemaAlignmentReportFile,
  canonicalPromptContractDogfoodScriptFile,
  canonicalPromptContractSmokeFile,
  canonicalPromptContractDocFile,
  canonicalPromptContractReportFile,
  refinedPromptRealTranscriptDogfoodScriptFile,
  refinedPromptRealTranscriptSmokeFile,
  refinedPromptRealTranscriptDocFile,
  refinedPromptRealTranscriptReportFile,
  secondRefinedTranscriptDogfoodScriptFile,
  secondRefinedTranscriptSmokeFile,
  secondRefinedTranscriptDocFile,
  secondRefinedTranscriptReportFile,
  provenanceStaleWordingDogfoodScriptFile,
  provenanceStaleWordingSmokeFile,
  provenanceStaleWordingDocFile,
  provenanceStaleWordingReportFile,
  refinedFindingsContractDogfoodScriptFile,
  refinedFindingsContractSmokeFile,
  refinedFindingsContractDocFile,
  refinedFindingsContractReportFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const transcriptDogfoodDocText = readFileSync(
  transcriptDogfoodDocFile,
  "utf8",
);
const transcriptDogfoodReportText = readFileSync(
  transcriptDogfoodReportFile,
  "utf8",
);

assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-real-transcript-capture-instructions"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-real-transcript-capture-instructions",
);

assertDocAndReport();
assertForbiddenMarkerPolicyUsesSplitForms();
assertNoRawUnsafeMarkersInArtifacts();
assertNoForbiddenSurfaces();
assertTranscriptDogfoodNextStepReferences();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-real-transcript-capture-instructions");

function assertDocAndReport() {
  assertContainsAll(docText, [
    "Perspective Codex Former Real Transcript Capture Instructions v0.1",
    "PR #481",
    "does not capture a real transcript",
    "Preconditions",
    "Capture Method A: Manual Sanitized Copy",
    "Capture Method B: Browser/Computer-Use Assisted Capture",
    "Capture Method C: No Transcript Available",
    "Required Real Transcript Fixture Fields",
    "Forbidden Transcript Content",
    "Review Gates",
    "Extraction And Validation Procedure",
    "evaluateCodexPerspectiveCandidateDraftPromptContractFit",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "{ candidate, guidance_context }",
    "Not run: this PR only adds capture instructions",
    "Dogfood manual Codex former draft copy packet with a captured real transcript",
    "PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md",
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Real Transcript Capture Instructions",
    "PASS with follow-up",
    "What #481 Enabled",
    "What #481 Blocked On",
    "Manual Capture Method",
    "Browser/Computer-Use Assisted Capture Method",
    "What Must Be Redacted",
    "Required Fixture Fields",
    "Review Gates",
    "Extraction And Validation",
    "Why This Is Still Not Codex Execution",
    "Why This Is Still Not Authority",
    "Browser/Computer-Use Validation",
    "does not actually capture a transcript",
    "Dogfood manual Codex former draft copy packet with a captured real transcript",
    "2026-06-09-perspective-codex-former-manual-copy-real-transcript.md",
  ]);
}

function assertForbiddenMarkerPolicyUsesSplitForms() {
  assertContainsAll(docText, [
    "`billing` + `_payload`",
    "`token` + `_payload`",
    "`oauth` + `_payload`",
    "`raw_source` + `_payload`",
    "`raw_candidate` + `_payload`",
    "`raw_private` + `_payload`",
    "`private` + `_payload`",
    "`provider` + `_payload`",
    "`oauth` + `_token`",
    "`access` + `_token`",
    "`refresh` + `_token`",
    "`api` + `_key`",
    "`hidden` + `_reasoning`",
    "`generated_model` + `_payload`",
    "`sk-proj` + `-`",
    "`ghp` + `_`",
    "`gho` + `_`",
    "`ghu` + `_`",
    "`ghs` + `_`",
    "`ghr` + `_`",
    "`secr` + `et`",
  ]);
}

function assertTranscriptDogfoodNextStepReferences() {
  assertContainsAll(transcriptDogfoodDocText, [
    "Perspective Codex Former Real Transcript Capture Instructions v0.1",
    "Dogfood manual Codex former draft copy packet with a captured real transcript",
  ]);
  assertContainsAll(transcriptDogfoodReportText, [
    "Perspective Codex Former Real Transcript Capture Instructions v0.1",
    "Dogfood manual Codex former draft copy packet with a captured real transcript",
  ]);
}

function assertNoRawUnsafeMarkersInArtifacts() {
  assertNoUnsafeMarkerText("capture instructions doc", docText);
  assertNoUnsafeMarkerText("capture instructions report", reportText);
}

function assertNoForbiddenSurfaces() {
  for (const [label, text] of [
    ["doc", docText],
    ["report", reportText],
    ["smoke", smokeText],
  ]) {
    for (const forbidden of [
      ["process", "env"].join("."),
      ["fetch", "("].join(""),
      ["api.github", ".com"].join(""),
      ["api.openai", ".com"].join(""),
      ["OPENAI", "_API_KEY"].join(""),
      ["GITHUB", "_TOKEN"].join(""),
      ["navigator", ".clipboard"].join(""),
      ["app", "/api/"].join(""),
      ["pris", "ma"].join(""),
      ["migr", "ations"].join(""),
    ]) {
      assert.equal(
        text.includes(forbidden),
        false,
        `${label} must not introduce forbidden surface ${forbidden}`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Real transcript capture instructions changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith(["app", "/api/"].join("")) &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith(["migr", "ations/"].join("")) &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Real transcript capture instructions must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertContainsAll(value, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `Expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function assertNoUnsafeMarkerText(label, value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const forbiddenMarker of [
    ["billing", "_payload"].join(""),
    ["token", "_payload"].join(""),
    ["oauth", "_payload"].join(""),
    ["raw_pasted", "_text"].join(""),
    ["raw_source", "_payload"].join(""),
    ["raw_candidate", "_payload"].join(""),
    ["raw_private", "_payload"].join(""),
    ["private", "_payload"].join(""),
    ["provider", "_payload"].join(""),
    ["oauth", "_token"].join(""),
    ["access", "_token"].join(""),
    ["refresh", "_token"].join(""),
    ["api", "_key"].join(""),
    ["hidden", "_reasoning"].join(""),
    ["generated_model", "_payload"].join(""),
    ["sk-proj", "-"].join(""),
    ["ghp", "_"].join(""),
    ["gho", "_"].join(""),
    ["ghu", "_"].join(""),
    ["ghs", "_"].join(""),
    ["ghr", "_"].join(""),
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `${label} must not include unsafe marker: ${forbiddenMarker}`,
    );
  }
  assert.equal(
    new RegExp(`\\b${["secr", "et"].join("")}\\b`, "i").test(serialized),
    false,
    `${label} must not include unsafe marker: ${["secr", "et"].join("")}`,
  );
}

function collectChangedFiles() {
  const workingTreeFiles = gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
  const branchFiles = collectBranchChangedFiles();
  const untrackedFiles = gitLinesOrEmpty([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  const changedFiles = Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);

  if (changedFiles.length === 0 && isCommittedBranch()) {
    throw new Error(
      "Real transcript capture instructions smoke collected no changed files",
    );
  }

  return changedFiles;
}

function collectBranchChangedFiles() {
  const originMainFiles = gitLinesStrict([
    "diff",
    "--name-only",
    "origin/main...HEAD",
  ]);
  if (originMainFiles) {
    return originMainFiles;
  }

  return gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
}

function isCommittedBranch() {
  try {
    execFileSync("git", ["rev-parse", "--verify", "HEAD^"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function gitLinesStrict(args) {
  return parseGitLines(
    execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function gitLinesOrEmpty(args) {
  try {
    return gitLinesStrict(args);
  } catch {
    return [];
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
