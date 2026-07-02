#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
  repoRoot,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const packageJsonFile = "package.json";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const runtimeHelperFile =
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs";
const smokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs";

const allowedChangedFiles = [
  packageJsonFile,
  shrinkDoc,
  runtimeHelperFile,
  smokeFile,
];

const textByFile = loadTextByFile([
  packageJsonFile,
  shrinkDoc,
  runtimeHelperFile,
  smokeFile,
]);

const packageJsonText = textByFile.get(packageJsonFile);
const shrinkDocText = textByFile.get(shrinkDoc);
const runtimeHelperText = textByFile.get(runtimeHelperFile);
const smokeText = textByFile.get(smokeFile);

assertPackageScript({
  packageJsonText,
  scriptName: "runtime:agent-workplane-legacy-cockpit-check-v0-1",
  expectedCommand:
    "node scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
});
assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1",
  expectedCommand:
    "node scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
});

assertContainsAll(runtimeHelperText, [
  "process.env.BASE_URL",
  "http://127.0.0.1:3000",
  'await fetchHtmlRoute("/workbench")',
  'await fetchHtmlRoute("/cockpit")',
  "GET /workbench expected HTTP 200",
  "GET /cockpit expected HTTP 200",
  'data-workplane-panel-id="legacy_cockpit_compatibility"',
  'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
  'data-workplane-legacy-cockpit-route="/cockpit"',
  "Legacy Cockpit route split",
  "Compatibility pointer",
  "six-tab-cockpit",
  "cockpit-shell",
  "cockpit-tab-nav",
  "cockpit-tab-panel",
  "Legacy Cockpit compatibility route",
  "retained Legacy Cockpit compatibility route",
  "PASS runtime:agent-workplane-legacy-cockpit-runtime-check-v0-1",
]);
assertNoRuntimeAuthority(runtimeHelperText, runtimeHelperFile);

assertContainsAll(shrinkDocText, [
  "## Runtime Verification",
  "### Required Commands",
  "AUGNES_DB_PATH=/tmp/augnes-runtime-check.db npm run dev -- --port 3000",
  "npm run runtime:agent-workplane-legacy-cockpit-check-v0-1",
  "npm run smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1",
  "### Expected Output",
  "PASS runtime:agent-workplane-legacy-cockpit-runtime-check-v0-1",
  "### Failure Conditions",
  "/workbench returns any status other than HTTP 200.",
  "/cockpit returns any status other than HTTP 200.",
  "No authority changes",
]);
assertNoAuthorityEndpointText(shrinkDocText, shrinkDoc);
assertNoStaticSmokeRuntimeCalls(smokeText, smokeFile);

const changedFilesBoundary = assertVerificationOnlyChangedFiles();
assertNoForbiddenAuthorityPaths(changedFilesBoundary.files);

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-legacy-cockpit-runtime-check-v0-1",
      pass: true,
      package_scripts_checked: true,
      runtime_helper_checked: true,
      docs_runtime_verification_checked: true,
      no_authority_changes_checked: true,
      changed_files_boundary: changedFilesBoundary,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1");

function assertVerificationOnlyChangedFiles() {
  const baseRef = findFirstExistingRef([
    process.env.AUGNES_CHANGED_FILES_BASE_REF,
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    "codex/legacy-cockpit-shrink-v0-1",
    "origin/codex/legacy-cockpit-shrink-v0-1",
  ]);

  const baseFiles = baseRef
    ? collectGitFiles(["diff", "--name-only", `${baseRef}...HEAD`])
    : [];
  const workingTreeFiles = collectGitFiles(["diff", "--name-only", "HEAD"]);
  const stagedFiles = collectGitFiles(["diff", "--cached", "--name-only"]);
  const untrackedFiles = collectGitFiles(["ls-files", "--others", "--exclude-standard"]);
  const files = uniqueSorted([
    ...baseFiles,
    ...workingTreeFiles,
    ...stagedFiles,
    ...untrackedFiles,
  ]);

  if (baseRef) {
    const allowed = new Set(allowedChangedFiles);
    for (const file of files) {
      assert(
        allowed.has(file),
        `Unexpected changed file for runtime verification-only PR: ${file}`,
      );
    }
  }

  return {
    checked: Boolean(baseRef),
    skipped: !baseRef,
    skip_reason: baseRef
      ? null
      : "changed-file boundary skipped because route-split base ref was unavailable",
    base_ref: baseRef,
    files,
  };
}

function findFirstExistingRef(refs) {
  return refs.filter(Boolean).find((ref) => {
    try {
      execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], {
        cwd: repoRoot,
        stdio: "ignore",
      });
      return true;
    } catch {
      return false;
    }
  });
}

function collectGitFiles(args) {
  try {
    return parseGitFileList(
      execFileSync("git", args, {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    return [];
  }
}

function parseGitFileList(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertNoRuntimeAuthority(text, label) {
  const forbiddenPatterns = [
    /\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b/,
    /\bwriteFile\b|\bwriteFileSync\b|\bappendFile\b|\bappendFileSync\b/,
    /\bexecFile\b|\bspawn\b|\bchild_process\b/,
    /\bapi\.openai\.com\b|\bapi\.github\.com\b|@octokit|OpenAI/i,
    /\bexecuteCodex\b|\bcreatePullRequest\b|\bmergePullRequest\b/i,
    /\btickAutonomyRun\b|\brunAutonomySchedulerWatch\b|\brunDueAutonomyRunsOnce\b/,
    /\binsert into\b|\bupdate\s+\w+\s+set\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${label} must not add authority behavior`);
  }
}

function assertNoStaticSmokeAuthority(text, label) {
  assert(
    !/\bwriteFile\b|\bwriteFileSync\b|\bappendFile\b|\bappendFileSync\b/.test(
      text,
    ),
    `${label} must not write product/runtime files`,
  );
}

function assertNoAuthorityEndpointText(text, label) {
  const forbiddenPatterns = [
    /\bapi\.openai\.com\b/i,
    /\bapi\.github\.com\b/i,
    /@octokit/i,
    /\bcreatePullRequest\b|\bmergePullRequest\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${label} must not add external authority endpoints`);
  }
}

function assertNoStaticSmokeRuntimeCalls(text, label) {
  assertNoStaticSmokeAuthority(text, label);
  assert(!/\bfetch\s*\(/.test(text), `${label} must not call live routes`);
}

function assertNoForbiddenAuthorityPaths(files) {
  const forbiddenPathPatterns = [
    /^app\/api\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(proof|evidence|memory|persistence)(\/|$)/i,
    /(^|\/)(provider|providers|openai|github|codex|runner|scheduler)(\/|$)/i,
  ];

  for (const file of files) {
    for (const pattern of forbiddenPathPatterns) {
      assert(!pattern.test(file), `Forbidden authority path changed: ${file}`);
    }
  }
}
