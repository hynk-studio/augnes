import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-orchestration-design.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-orchestration-design.mjs";
const localAdapterDesignDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md";
const manifestToSourceInputDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_TO_SOURCE_INPUT_V0_1.md";
const preflightHardeningDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_HARDENING_V0_1.md";
const surfaceSnapshotsDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOTS_V0_1.md";
const captureHelperFile = "scripts/perspective-codex-former-capture-helper.mjs";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");

assertPackageScript();
assertFilesExist();
assertDesignDoc();
assertReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-prepare-orchestration-design",
);

function assertPackageScript() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-orchestration-design"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the prepare orchestration design smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    docFile,
    reportFile,
    smokeFile,
    localAdapterDesignDocFile,
    manifestToSourceInputDocFile,
    preflightHardeningDocFile,
    surfaceSnapshotsDocFile,
    captureHelperFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertDesignDoc() {
  assertIncludesAll(docText, [
    "Why Follows PR #511",
    localAdapterDesignDocFile,
    manifestToSourceInputDocFile,
    preflightHardeningDocFile,
    surfaceSnapshotsDocFile,
    captureHelperFile,
    "prepare orchestration mode",
    "Stage A. Input Readiness Check",
    "Stage B. Prepare Command Construction",
    "Stage C. Prepare Helper Execution",
    "Stage D. Prepare Output Discovery",
    "Stage E. Adapter Prepare Summary",
    "Stage F. Surface Snapshot Handoff",
    "require source input path",
    "require source input preflight summary path",
    "require preflight status passed",
    "npm run perspective:codex-former:capture-packet",
    "Prepare Summary Contract",
    "codex_former_local_adapter_prepare_summary.v0.1",
    "Source input preflight failed",
    "Preflight passed, prepare not run",
    "Prepare succeeded",
    "Prepare failed",
    "Returned candidate present",
    "Validation And Rejection Behavior",
    "CLI Design",
    "Browser/Computer-Use Validation Plan",
    "Privacy/Redaction",
    "Authority Boundary",
    "design-only",
    "no prepare orchestration implementation",
    "no CLI prepare behavior",
    "no validate orchestration",
    "no surface export",
    "no UI",
    "no route",
    "no runtime browser surface",
    "no Codex call",
    "no Codex SDK",
    "no provider/model API",
    "no GitHub API",
    "no network",
    "no DB write",
    "no persistence",
    "no clipboard automation",
    "no accepted Augnes state",
    "no proof/evidence/readiness creation",
    "no review decision records",
    "no accept/promote/reject actions",
    "no approval/merge/deploy/Core decision",
    "no live Codex capture",
    "no runtime fixture mutation",
    "Add local Codex adapter prepare orchestration dry-run implementation",
    "PASS with follow-up",
  ]);
}

function assertReport() {
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #511",
    "Design Scope",
    "Relationship to Existing Adapter Modes",
    "Prepare Orchestration Stages",
    "Inputs and Outputs",
    "Prepare Summary Contract",
    "State Mapping to Surfaces",
    "Validation and Rejection Behavior",
    "CLI Design",
    "Browser/Computer-Use Validation Plan",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}`;
  for (const marker of [
    ["hidden", "reasoning"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["oauth", "token"].join("_"),
    ["sk", "proj"].join("-") + "-",
    ["gh", "p_"].join(""),
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public docs/reports must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
	  const changedImplementationText = smokeText;
	  for (const snippet of [
	    ["fetch", "("].join(""),
	    ["XML", "Http", "Request"].join(""),
	    ["responses", "create"].join("."),
	    ["openai", "chat"].join("."),
	    ["navigator", "clipboard"].join("."),
	    ["better", "sqlite3"].join("-"),
	    ["createClient", "("].join(""),
	    ["graphql", "("].join(""),
	    ["record", "Proof"].join(""),
	    ["create", "Evidence"].join(""),
	    ["commit", "State", "Update"].join(""),
	    ["perspective:codex-former:capture", "packet"].join("-") + " --",
	    ["perspective:codex-former:validate", "capture"].join("-"),
	  ]) {
    assert.equal(
      changedImplementationText.includes(snippet),
      false,
      `smoke implementation must not introduce forbidden runtime surface ${snippet}`,
    );
  }
  assertIncludesAll(`${docText}\n${reportText}`, [
    "no provider/model",
    "no Codex SDK",
    "no GitHub",
    "no network",
    "no DB",
    "no UI",
    "no prepare orchestration implementation",
    "no validate orchestration",
    "no accepted",
    "no review decision",
    "no persistence",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    docFile,
    reportFile,
    smokeFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `prepare orchestration design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/"),
      `prepare orchestration design must stay docs/report/smoke/package only: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeText(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeText(snippet)),
      `expected text to include: ${snippet}`,
    );
  }
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
