import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-execution-design.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution-design.mjs";
const prepareDesignDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md";
const dryRunDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md";
const dryRunHardeningDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_DRY_RUN_HARDENING_V0_1.md";
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
  "PASS smoke:perspective-codex-former-local-adapter-prepare-execution-design",
);

function assertPackageScript() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-execution-design"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the prepare execution design smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    docFile,
    reportFile,
    smokeFile,
    prepareDesignDocFile,
    dryRunDocFile,
    dryRunHardeningDocFile,
    surfaceSnapshotsDocFile,
    captureHelperFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertDesignDoc() {
  assertIncludesAll(docText, [
    "Why Follows PR #514",
    dryRunHardeningDocFile,
    dryRunDocFile,
    prepareDesignDocFile,
    captureHelperFile,
    "prepare orchestration execution mode",
    "design-only",
    "no prepare execution implementation",
    "no execution CLI behavior",
    "Product Thesis",
    "Relationship To Existing Modes",
    "Execution Prerequisites",
    "Stage A. Load And Verify Inputs",
    "Stage B. Reconstruct Command Argv",
    "Stage C. Prepare Output Directory Reservation",
    "Stage D. Execute Existing Helper Prepare Command",
    "Stage E. Discover Helper Outputs",
    "Stage F. Write Adapter Prepare Execution Summary",
    "Stage G. Optional Future Snapshot Handoff",
    "Dry-Run To Execution Equivalence",
    "Execution Summary Contract",
    "codex_former_local_adapter_prepare_execution_summary.v0.1",
    "prepare-orchestration-execution",
    "Output Discovery Policy",
    "Failure Handling And Cleanup Policy",
    "Logging And Redaction Policy",
    "CLI Design",
    "--execute --source-input <path>",
    "`--execute` and `--dry-run` must not be allowed together",
    "must not accept a caller-supplied arbitrary command",
    "State Mapping To Surfaces",
    "Verification Strategy",
    "Browser/Computer-Use Validation Plan",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "prepare_helper_executed",
    "operational provenance, not authority, not acceptance, and not validation",
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
    "no validate orchestration",
    "no surface export",
    "no UI implementation",
    "no capture helper behavior modification",
    "Add local Codex adapter prepare orchestration execution implementation",
    "PASS with follow-up",
  ]);
}

function assertReport() {
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #514",
    "Design Scope",
    "Product Thesis",
    "Relationship to Existing Modes",
    "Execution Prerequisites",
    "Execution Stages",
    "Execution Summary Contract",
    "Dry-Run to Execution Equivalence",
    "Output Discovery Policy",
    "Failure Handling and Cleanup Policy",
    "Logging and Redaction Policy",
    "CLI Design",
    "State Mapping to Surfaces",
    "Verification Strategy",
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
  ]) {
    assert.equal(
      smokeText.includes(snippet),
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
    "no prepare execution implementation",
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
      `prepare execution design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/"),
      `prepare execution design must stay docs/report/smoke/package only: ${changedFile}`,
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

function assertIncludesAll(text, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      text.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}
