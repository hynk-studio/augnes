import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile =
  "docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_MANUAL_USAGE_NOTE_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-handoff-draft-manual-usage-note.md";
const smokeFile =
  "scripts/smoke-perspective-codex-handoff-draft-manual-usage-note.mjs";
const scopeReadabilityDocFile =
  "docs/PERSPECTIVE_CODEX_HANDOFF_EXPECTED_FILE_SCOPE_READABILITY_V0_1.md";
const packetDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md";
const dogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md";
const realDocsEvalDocFile =
  "docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_REAL_DOCS_TASK_EVAL_V0_1.md";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";

const allowedChangedFiles = new Set([
  packageFile,
  docFile,
  reportFile,
  smokeFile,
  scopeReadabilityDocFile,
  packetDocFile,
  dogfoodDocFile,
  realDocsEvalDocFile,
  laneDocFile,
  "scripts/smoke-perspective-codex-handoff-expected-file-scope-readability.mjs",
  "scripts/smoke-perspective-codex-handoff-draft-real-docs-task-eval.mjs",
  "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs",
  "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs",
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs",
  "scripts/smoke-perspective-candidate-briefing-preview.mjs",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs",
  "scripts/smoke-perspective-formation-lane-v0-1.mjs",
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-handoff-draft-manual-usage-note"],
  `node ${smokeFile}`,
  "package.json must register smoke:perspective-codex-handoff-draft-manual-usage-note",
);

const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertDoc();
assertReport();
assertNoForbiddenRawPrivateMarkers();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-handoff-draft-manual-usage-note");

function assertDoc() {
  assertContainsAll(docText, [
    "manual usage note",
    "future user-started Codex task",
    "ready_to_copy",
    "needs_scope",
    "needs_revision_first",
    "blocked",
    "none",
    "review before pasting",
    "does not execute Codex",
    "no merge",
    "no approval",
    "no GitHub mutation",
    "no background work",
    "PR-centered workflow",
    "Codex codes/tests/opens PR",
    "ChatGPT reviews",
    "user decides merge",
    "expected_file_scope",
    "full list remains the scope",
    "omitted_files",
    "required checks",
    "forbidden files",
    "forbidden surfaces",
    "skipped-check policy",
    "quick checklist",
    "Add copy-ready checklist to Codex handoff draft text",
  ]);
}

function assertReport() {
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #472",
    "Usage Problem Addressed",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "What Is Not Implemented",
    "Tests Run",
    "Skipped Checks",
    "Evaluation Conclusion",
    "Add copy-ready checklist to Codex handoff draft text",
  ]);
}

function assertNoForbiddenRawPrivateMarkers() {
  const scannedOutputs = [
    [docFile, docText],
    [reportFile, reportText],
  ];
  const forbiddenMarkers = [
    ["raw", "pasted", "text"].join("_"),
    ["raw", "source", "payload"].join("_"),
    ["raw", "candidate", "payload"].join("_"),
    ["private", "payload"].join("_"),
    ["provider", "payload"].join("_"),
    ["oauth", "token"].join("_"),
    ["api", "key"].join("_"),
    ["billing", "payload"].join("_"),
    ["hidden", "reasoning"].join("_"),
    ["generated", "model", "payload"].join("_"),
    ["sec", "ret"].join(""),
  ];

  for (const [file, text] of scannedOutputs) {
    for (const marker of forbiddenMarkers) {
      assert.equal(
        text.includes(marker),
        false,
        `${file} must not include forbidden raw/private marker: ${marker}`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Codex handoff draft manual usage note changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Codex handoff draft manual usage note must not change forbidden surfaces: ${changedFile}`,
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
      "Codex handoff draft manual usage note smoke collected no changed files",
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
    "Unable to collect base diff for Codex handoff draft manual usage note smoke",
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

function assertContainsAll(text, snippets, label = "source") {
  const normalizedText = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalize(snippet)),
      `Expected ${label} to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}
