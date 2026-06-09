import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-next-handoff-draft.mjs";
const codexDraftBuilderFile =
  "lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts";
const smokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md";
const copyRefineReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-copy-refine.md";
const artifactFile =
  "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const draftPacketDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md";
const userJudgmentDocFile =
  "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const draftPacketSmokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs";
const userJudgmentSmokeFile =
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs";
const briefingPreviewSmokeFile =
  "scripts/smoke-perspective-candidate-briefing-preview.mjs";
const candidateSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const inputBundleSmokeFile =
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs";
const laneSmokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  codexDraftBuilderFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  copyRefineReportFile,
  artifactFile,
  "docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_REAL_DOCS_TASK_EVAL_V0_1.md",
  "reports/2026-06-09-perspective-codex-handoff-draft-real-docs-task-eval.md",
  "scripts/smoke-perspective-codex-handoff-draft-real-docs-task-eval.mjs",
  draftPacketDocFile,
  userJudgmentDocFile,
  laneDocFile,
  draftPacketSmokeFile,
  userJudgmentSmokeFile,
  briefingPreviewSmokeFile,
  candidateSmokeFile,
  inputBundleSmokeFile,
  laneSmokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodScriptText = readFileSync(dogfoodScriptFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const draftPacketDocText = readFileSync(draftPacketDocFile, "utf8");
const laneDocText = readFileSync(laneDocFile, "utf8");

const {
  buildPerspectiveCodexNextHandoffDraftDogfood,
  runPerspectiveCodexNextHandoffDraftDogfood,
} = await import("./dogfood-perspective-codex-next-handoff-draft.mjs");

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);

assert.equal(
  packageJson.scripts["dogfood:perspective-codex-next-handoff-draft"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-codex-next-handoff-draft",
);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-next-handoff-draft-dogfood"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-next-handoff-draft-dogfood",
);

assertDogfoodScriptBoundary();
assertDocsAndReport();

const dogfood = runPerspectiveCodexNextHandoffDraftDogfood();
const rebuiltDogfood = buildPerspectiveCodexNextHandoffDraftDogfood();
assert.equal(
  dogfood.artifact,
  rebuiltDogfood.artifact,
  "dogfood artifact generation must be deterministic",
);
assert.equal(
  dogfood.evaluation.judgment,
  "PASS",
  "dogfood evaluation must pass",
);
assert.equal(existsSync(artifactFile), true, "dogfood artifact must exist");

const artifactText = readFileSync(artifactFile, "utf8");
assert.equal(
  artifactText,
  dogfood.artifact,
  "written dogfood artifact must match generated artifact",
);

assertArtifactCoverage(artifactText);
assertReadyToCopySection(artifactText);
assertContrastSections(artifactText);
assertNoForbiddenArtifactText(artifactText);
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-next-handoff-draft-dogfood");

function assertDogfoodScriptBoundary() {
  assertContainsAll(dogfoodScriptText, [
    "buildPerspectiveFormationInputBundle",
    "buildPerspectiveCandidateFromFormationInputBundle",
    "buildChatGptPerspectiveCandidateBriefingPreview",
    "buildManualChatGptUserJudgmentCapturePacket",
    "buildCodexNextHandoffDraftPacketFromUserJudgment",
    "buildPerspectiveCodexNextHandoffDraftDogfood",
    "runPerspectiveCodexNextHandoffDraftDogfood",
    "writeFileSync",
    "ready_to_copy",
    "needs_scope",
    "needs_revision_first",
    "blocked",
    "none",
  ]);

  for (const forbiddenMarker of [
    ["read", "File"].join(""),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    ["Date", "now"].join("."),
    ["new", "Date"].join(" "),
    "api.github.com",
    "api.openai.com",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      dogfoodScriptText.includes(forbiddenMarker),
      false,
      `${dogfoodScriptFile} must remain deterministic and local-only`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "local dogfood report after PR #468",
    "full pure local manual loop",
    "deterministic dogfood output",
    "does not execute Codex",
    "does not mutate GitHub",
    "does not implement routes",
    "does not implement UI",
    "does not implement DB",
    "does not implement persistence",
    "does not implement OAuth",
    "does not implement provider calls",
    "does not implement ChatGPT Apps",
    "does not implement Codex plugin",
    "does not implement Codex SDK",
    "does not implement proof/evidence/readiness writes",
    "evaluates whether the copyable handoff text is human-usable",
    "ready_to_copy separate from execution",
    "contrast cases visible",
    "under-scoped expected_files",
    "Follow-Up Evaluation",
    "real docs-only Codex task evaluates",
    "Refine expected-file scope readability for Codex handoff drafts",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #468",
    "Dogfood Scenarios",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "What Is Not Implemented",
    "Tests Run",
    "Skipped Checks",
    "Blockers or Risks",
    "Dogfood Evaluation Conclusion",
    "Evaluate Codex handoff draft in a real docs-only Codex task",
  ]);
  assertContainsAll(draftPacketDocText, [
    "Dogfooded By",
    "PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1",
    "non-executing draft material",
  ]);
  assertContainsAll(laneDocText, [
    "PR G: local Codex handoff draft dogfood report",
    "deterministic local dogfood/report validation slice",
    "PR H: Refine Codex handoff draft copy from dogfood findings",
  ]);
}

function assertArtifactCoverage(text) {
  assertContainsAll(text, [
    "# Perspective Codex Next-Handoff Draft Packet Dogfood",
    "Fixed generated timestamp: 2026-06-09T00:00:00.000Z",
    "Formation Input Bundle",
    "Perspective Candidate",
    "ChatGPT Briefing Preview",
    "User Judgment Capture Packet",
    "Codex Next-Handoff Draft Packet",
    "perspective_codex_next_handoff_draft_packet.v0.1",
    "ready_to_copy",
    "needs_scope",
    "needs_revision_first",
    "blocked",
    "draft only",
    "draft prompt for a future user-started Codex task",
    "Review it before pasting into Codex",
    "does not execute Codex",
    "user explicitly starts a Codex task",
    "PR-centered workflow",
    "ChatGPT reviews",
    "user decides merge",
    "no GitHub mutation",
    "no approval",
    "no merge",
    "no Core decision",
    "Conclusion: PASS",
  ]);
}

function assertReadyToCopySection(text) {
  const section = sectionBetween(
    text,
    "## Ready-to-copy Draft",
    "## Contrast Cases",
  );
  assertContainsAll(section, [
    "draft_status: ready_to_copy",
    "source judgment packet id",
    "source candidate id",
    "task goal",
    "expected files",
    "required checks",
    "forbidden files",
    "forbidden surfaces",
    "skipped-check policy",
    "Copyable Codex Handoff Text",
    "draft prompt for a future user-started Codex task",
    "Review it before pasting into Codex",
    "does not execute Codex",
    "no merge",
    "approval",
    "GitHub mutation",
    "PR-centered workflow",
    "ChatGPT reviews",
    "user decides merge",
  ]);
  assertReadyExpectedFiles(section);
}

function assertReadyExpectedFiles(section) {
  const requiredExpectedFiles = [
    "scripts/dogfood-perspective-codex-next-handoff-draft.mjs",
    "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs",
    "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md",
    "reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md",
    "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md",
    "package.json",
    "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md",
    "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md",
    "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md",
    "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs",
    "scripts/smoke-perspective-user-judgment-capture-packet.mjs",
    "scripts/smoke-perspective-candidate-briefing-preview.mjs",
    "scripts/smoke-perspective-candidate-builder-fixture.mjs",
    "scripts/smoke-perspective-formation-input-bundle-builder.mjs",
    "scripts/smoke-perspective-formation-lane-v0-1.mjs",
    "scripts/smoke-perspective-agent-brief-read-surface.mjs",
    "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
  ];

  assertContainsAll(section, requiredExpectedFiles);
}

function assertContrastSections(text) {
  const contrastSection = sectionBetween(
    text,
    "## Contrast Cases",
    "## Evaluation",
  );

  for (const label of [
    "needs_scope",
    "needs_revision_first",
    "blocked",
    "none",
  ]) {
    const section = sectionBetween(
      contrastSection,
      `### Contrast: ${label}`,
      nextContrastHeading(label),
    );
    assert.match(section, new RegExp(`draft_status: ${label}`));
    assert.equal(
      section.includes("draft_status: ready_to_copy"),
      false,
      `${label} contrast must not look copy-ready`,
    );
  }
}

function nextContrastHeading(label) {
  if (label === "needs_scope") return "### Contrast: needs_revision_first";
  if (label === "needs_revision_first") return "### Contrast: blocked";
  if (label === "blocked") return "### Contrast: none";
  return "";
}

function assertNoForbiddenArtifactText(text) {
  for (const forbiddenMarker of [
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "api_key",
    "billing_payload",
    "hidden_reasoning",
    "generated_model_payload",
    "secret",
    "approval granted",
    "merge approved",
    "execute background work",
  ]) {
    assert.equal(
      text.includes(forbiddenMarker),
      false,
      `dogfood artifact must not include forbidden marker: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex next-handoff draft dogfood changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective Codex next-handoff draft dogfood must not change forbidden surfaces: ${changedFile}`,
    );
  }
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
      "Perspective Codex next-handoff draft dogfood smoke collected no changed files",
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

  const localMainFiles = gitLinesStrict(["diff", "--name-only", "main...HEAD"]);
  if (localMainFiles) {
    return localMainFiles;
  }

  const originMergeBase = gitLineStrict(["merge-base", "HEAD", "origin/main"]);
  if (originMergeBase) {
    const originMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${originMergeBase}...HEAD`,
    ]);
    if (originMergeBaseFiles) {
      return originMergeBaseFiles;
    }
  }

  const localMergeBase = gitLineStrict(["merge-base", "HEAD", "main"]);
  if (localMergeBase) {
    const localMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${localMergeBase}...HEAD`,
    ]);
    if (localMergeBaseFiles) {
      return localMergeBaseFiles;
    }
  }

  throw new Error(
    "Unable to collect base diff for Perspective Codex next-handoff draft dogfood smoke",
  );
}

function gitLinesOrEmpty(args) {
  return gitLinesStrict(args) ?? [];
}

function gitLinesStrict(args) {
  const output = tryGitOutput(args);
  return output === null ? null : parseGitLines(output);
}

function gitLineStrict(args) {
  const lines = gitLinesStrict(args);
  return lines?.[0] ?? null;
}

function isCommittedBranch() {
  return gitLineStrict(["rev-parse", "--verify", "HEAD"]) !== null;
}

function tryGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sectionBetween(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);
  assert.notEqual(startIndex, -1, `Expected section marker: ${startMarker}`);
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, contentStart) : -1;
  return text.slice(contentStart, endIndex === -1 ? undefined : endIndex);
}

function assertContainsAll(text, snippets) {
  const normalizedText = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
