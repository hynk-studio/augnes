import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const reportFile = "reports/2026-06-08-perspective-formation-lane-v0-1.md";
const smokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  docFile,
  reportFile,
  smokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-reviewed-codex-template-promotion-path.mjs",
  "scripts/smoke-perspective-reviewed-manual-agent-brief-codex-template.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-formation-lane-v0-1"],
  `node ${smokeFile}`,
  "package.json must register smoke:perspective-formation-lane-v0-1",
);

const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertContainsAll(docText, [
  "docs/smoke/package-pointer only",
  "docs/report/smoke/package-only",
  "non-runtime",
  "non-authoritative",
  "design/boundary",
  "Augnes turns Codex work traces into reviewable Perspective Candidates",
  "AGENTS.md",
  "docs/AUTHORITY_MATRIX.md",
  "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
  "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
  "docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md",
  "docs/PERSPECTIVE_AGENT_BRIEF_HANDOFF_COPY_REFINE_V0_1.md",
  "docs/PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_V0_1.md",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_PROMOTION_PATH_V0_1.md",
]);

assertContainsAll(docText, [
  "codex_worker",
  "codex_perspective_former",
  "augnes_core",
  "chatgpt_review_surface",
  "user_decision_authority",
]);

assertContainsAll(docText, [
  "Formation Input Bundle",
  "Perspective Candidate",
  "status: perspective_candidate",
  "authority: non_committed",
  "evidence pointers",
  "unresolved tensions",
  "skipped checks with concrete reasons",
  "user/Core decision",
]);

assertContainsAll(docText, [
  "no runtime route",
  "no DB schema",
  "no persistence",
  "no provider/model/API calls",
  "no OAuth/source ingress",
  "no proof/evidence/readiness writes",
  "no Codex SDK execution",
  "no merge/publish/approval authority",
]);

assertContainsAll(docText, [
  "PR A: docs/smoke lane definition",
  "PR B: pure local formation input bundle builder",
  "PR C: deterministic perspective candidate builder fixture",
  "PR D: ChatGPT briefing surface preview",
  "PR E: Core-gated accept/reject/supersede route, only after explicit approval",
]);

assertContainsAll(reportText, [
  "Summary",
  "Why This Follows Current Repo Direction",
  "Files Changed",
  "Authority Boundary",
  "Validation Plan",
  "What Is Not Implemented",
  "Add pure local Perspective Formation Input Bundle builder",
]);

assertNoRuntimePlumbingInChangedFiles();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-formation-lane-v0-1");

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Formation Lane changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("persistence") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db"),
      `Perspective Formation Lane must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertNoRuntimePlumbingInChangedFiles() {
  const forbiddenMarkers = [
    ["fetch", "("].join(""),
    ["process", "env"].join("."),
    ["GITHUB", "TOKEN"].join("_"),
    ["OPENAI", "API", "KEY"].join("_"),
    ["api", "github", "com"].join("."),
    ["api", "openai", "com"].join("."),
    ["use", "server"].join(" "),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["client", "secret"].join("_"),
    ["CREATE", "TABLE"].join(" "),
    ["ALTER", "TABLE"].join(" "),
  ];
  const filesToScan = [docFile, reportFile, smokeFile, packageFile];

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
      "Perspective Formation Lane boundary smoke collected no changed files",
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
    "Unable to collect base diff for Perspective Formation Lane boundary smoke",
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
