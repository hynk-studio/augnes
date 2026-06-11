import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
import prepareOrchestration from "../lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";

const {
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
} = localAdapter;
const {
  buildCodexFormerLocalAdapterPrepareDryRunSummary,
  validateCodexFormerLocalAdapterPrepareDryRunInput,
} = prepareOrchestration;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-prepare-orchestration.mjs";
const dryRunSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-dry-run-hardening.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_DRY_RUN_HARDENING_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-dry-run-hardening.md";
const dryRunDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md";
const fixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json";
const manifestFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json";
const sourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preflightSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const generatedAt = "2026-06-11T00:00:00.000Z";
const alternateGeneratedAt = "2026-06-11T00:00:01.000Z";
const helperOutDir = "/tmp/augnes-codex-former-local-adapter-prepare-dry-run";
const tmpRoot = "/tmp/augnes-codex-former-local-adapter-prepare-hardening-smoke";
const summaryOut = join(tmpRoot, "prepare-summary.json");
const rejectionDir = join(tmpRoot, "rejections");

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const fixtureText = readFileSync(fixtureFile, "utf8");
const fixture = JSON.parse(fixtureText);
const manifestText = readFileSync(manifestFixtureFile, "utf8");
const manifest = JSON.parse(manifestText);
const sourceInputText = readFileSync(sourceInputFixtureFile, "utf8");
const sourceInput = JSON.parse(sourceInputText);
const preflightSummaryText = readFileSync(preflightSummaryFixtureFile, "utf8");
const preflightSummary = JSON.parse(preflightSummaryText);

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
runDryRunHappyPath();
assertExecutionReadiness();
assertCommandArgvFingerprint();
runPathRejectionCoverage();
runManifestConsistencyCoverage();
runPureReadinessFailures();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-prepare-dry-run-hardening",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:prepare"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run"
    ],
    `${expectedTsxCommand} ${dryRunSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-dry-run-hardening"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    libFile,
    cliFile,
    dryRunSmokeFile,
    smokeFile,
    docFile,
    reportFile,
    dryRunDocFile,
    fixtureFile,
    manifestFixtureFile,
    sourceInputFixtureFile,
    preflightSummaryFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "execution_readiness",
    "ready_for_prepare_execution",
    "helper_command_argv_hash",
    "source_input_hash_matches_preflight",
    "helper_package_script_present",
    "helper_script_present",
    "prepare_summary_outside_helper_out_dir",
    "prepare.manifest.work_id must match source_input.work_id",
    "prepare.manifest.changed_files must match source_input.changed_files exactly",
  ]);
  assertIncludesAll(cliText, [
    "prepare.prepare_summary_out must not be inside helper out-dir",
    "prepare.out_dir must not be a non-empty directory",
    "perspective:codex-former:capture-packet",
    "scripts/perspective-codex-former-capture-helper.mjs",
    "readHelperAvailability",
  ]);
}

function runDryRunHappyPath() {
  rmSync(tmpRoot, { recursive: true, force: true });
  rmSync(helperOutDir, { recursive: true, force: true });
  mkdirSync(tmpRoot, { recursive: true });
  const stdout = runCli([
    "--dry-run",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    helperOutDir,
    "--generated-at",
    generatedAt,
    "--prepare-summary-out",
    summaryOut,
  ]);
  assertIncludesAll(stdout, [
    "mode=prepare-orchestration-dry-run",
    `source_input_path=${sourceInputFixtureFile}`,
    `preflight_summary_path=${preflightSummaryFixtureFile}`,
    `source_input_hash=${hashText(sourceInputText)}`,
    "preflight_status=passed",
    `helper_out_dir=${helperOutDir}`,
    "helper_exit_status=not_run",
    "authority_boundary=review-only local-only non-authorizing",
  ]);
  assert.equal(readFileSync(summaryOut, "utf8"), fixtureText);
  assert.equal(existsSync(helperOutDir), false, "dry-run must not create --out-dir");
  for (const value of Object.values(fixture.helper_output_paths)) {
    assert.equal(value, null, "dry-run must not create helper output paths");
  }
}

function assertExecutionReadiness() {
  assert(fixture.execution_readiness, "execution_readiness must exist");
  assert.equal(fixture.execution_readiness.ready_for_prepare_execution, true);
  assert.equal(fixture.execution_readiness.status, "ready");
  assert.deepEqual(fixture.execution_readiness.blockers, []);
  assert(
    fixture.execution_readiness.warnings.some((warning) =>
      warning.includes("not permission to execute automatically"),
    ),
  );
  const ids = fixture.execution_readiness.checked_requirements.map(
    (item) => item.id,
  );
  for (const id of [
    "source_input_valid",
    "source_input_hash_matches_preflight",
    "preflight_summary_valid",
    "preflight_status_passed",
    "helper_package_script_present",
    "helper_script_present",
    "helper_command_argv_constructed",
    "helper_out_dir_not_created_by_dry_run",
    "helper_out_dir_not_existing_file",
    "helper_out_dir_not_non_empty_directory",
    "prepare_summary_outside_helper_out_dir",
    "no_forbidden_authority_behavior",
    "no_helper_execution",
  ]) {
    assert(ids.includes(id), `execution_readiness missing ${id}`);
  }
  for (const item of fixture.execution_readiness.checked_requirements) {
    assert.equal(item.status, "passed", `${item.id} should pass in fixture`);
  }
  assert(
    fixture.execution_readiness.checked_requirements.find(
      (item) => item.id === "helper_package_script_present",
    ),
  );
  assert(
    fixture.execution_readiness.checked_requirements.find(
      (item) => item.id === "helper_script_present",
    ),
  );
}

function assertCommandArgvFingerprint() {
  assert(Array.isArray(fixture.helper_command_argv));
  for (const part of [
    "npm",
    "run",
    "perspective:codex-former:capture-packet",
    "--",
    "--out-dir",
    "--source-input",
    "--generated-at",
  ]) {
    assert(
      fixture.helper_command_argv.includes(part),
      `helper argv must include ${part}`,
    );
  }
  assert.equal(
    fixture.helper_command_argv_hash,
    hashText(stableStringifyCodexFormerLocalAdapterJson(fixture.helper_command_argv)),
  );
  const changed = buildCodexFormerLocalAdapterPrepareDryRunSummary({
    sourceInput,
    sourceInputPath: sourceInputFixtureFile,
    sourceInputHash: hashCodexFormerLocalAdapterContent(sourceInputText),
    preflightSummary,
    preflightSummaryPath: preflightSummaryFixtureFile,
    helperOutDir,
    generatedAtOverride: alternateGeneratedAt,
    manifest,
    manifestPath: manifestFixtureFile,
    manifestHash: hashCodexFormerLocalAdapterContent(manifestText),
  }).summary;
  assert.notEqual(
    changed.helper_command_argv_hash,
    fixture.helper_command_argv_hash,
    "changing generated_at should change argv hash",
  );
}

function runPathRejectionCoverage() {
  mkdirSync(rejectionDir, { recursive: true });
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--manifest",
      manifestFixtureFile,
      "--out-dir",
      helperOutDir,
      "--prepare-summary-out",
      join(helperOutDir, "prepare-summary.json"),
    ]),
    ["prepare.prepare_summary_out must not be inside helper out-dir"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
      "--prepare-summary-out",
      helperOutDir,
    ]),
    ["prepare.prepare_summary_out must not be inside helper out-dir"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
      "--prepare-summary-out",
      sourceInputFixtureFile,
    ]),
    ["output paths must be distinct"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
      "--prepare-summary-out",
      preflightSummaryFixtureFile,
    ]),
    ["output paths must be distinct"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--manifest",
      manifestFixtureFile,
      "--out-dir",
      helperOutDir,
      "--prepare-summary-out",
      manifestFixtureFile,
    ]),
    ["output paths must be distinct"],
  );

  const existingFileOutDir = join(rejectionDir, "existing-file-out-dir");
  writeFileSync(existingFileOutDir, "file", "utf8");
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      existingFileOutDir,
    ]),
    ["option --out-dir must not point to an existing file"],
  );
  const nonEmptyOutDir = join(rejectionDir, "non-empty-out-dir");
  mkdirSync(nonEmptyOutDir, { recursive: true });
  writeFileSync(join(nonEmptyOutDir, "existing.txt"), "existing", "utf8");
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      nonEmptyOutDir,
    ]),
    ["prepare.out_dir must not be a non-empty directory"],
  );
  assert.equal(
    existsSync(join(tmpRoot, "absent-helper-out-dir")),
    false,
    "absent out-dir starts absent",
  );
  runCli([
    "--dry-run",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--out-dir",
    join(tmpRoot, "absent-helper-out-dir"),
  ]);
  assert.equal(
    existsSync(join(tmpRoot, "absent-helper-out-dir")),
    false,
    "absent out-dir remains absent after dry-run",
  );
}

function runManifestConsistencyCoverage() {
  const cases = [
    [
      "manifest-work-id-mismatch.json",
      { work_id: "AG-mismatched-work-id" },
      "prepare.manifest.work_id must match source_input.work_id",
    ],
    [
      "manifest-scope-mismatch.json",
      { scope: "project:other" },
      "prepare.manifest.scope must match source_input.scope",
    ],
    [
      "manifest-changed-files-mismatch.json",
      { changed_files: [...manifest.changed_files, "docs/extra.md"] },
      "prepare.manifest.changed_files must match source_input.changed_files exactly",
    ],
    [
      "manifest-source-pr-refs-mismatch.json",
      { source_pr_refs: ["pr:hynk-studio/augnes#999"] },
      "prepare.manifest.source_pr_refs must match source_input.source_pr_refs exactly",
    ],
  ];
  for (const [fileName, patch, expected] of cases) {
    const path = join(rejectionDir, fileName);
    writeJson(path, { ...manifest, ...patch });
    assertIncludesAll(
      expectCliFailure([
        "--dry-run",
        "--source-input",
        sourceInputFixtureFile,
        "--preflight-summary",
        preflightSummaryFixtureFile,
        "--manifest",
        path,
        "--out-dir",
        helperOutDir,
      ]),
      [expected],
    );
  }
}

function runPureReadinessFailures() {
  const packageMissing = validateCodexFormerLocalAdapterPrepareDryRunInput({
    sourceInput,
    sourceInputPath: sourceInputFixtureFile,
    sourceInputHash: hashText(sourceInputText),
    preflightSummary,
    preflightSummaryPath: preflightSummaryFixtureFile,
    helperOutDir,
    helperAvailability: {
      packageScriptPresent: false,
      scriptPath: "scripts/perspective-codex-former-capture-helper.mjs",
      scriptPresent: true,
      scriptIsFile: true,
    },
  });
  assert(
    packageMissing.errors.includes("prepare.helper.package_script is missing"),
  );
  const scriptMissing = validateCodexFormerLocalAdapterPrepareDryRunInput({
    sourceInput,
    sourceInputPath: sourceInputFixtureFile,
    sourceInputHash: hashText(sourceInputText),
    preflightSummary,
    preflightSummaryPath: preflightSummaryFixtureFile,
    helperOutDir,
    helperAvailability: {
      packageScriptPresent: true,
      scriptPath: "scripts/perspective-codex-former-capture-helper.mjs",
      scriptPresent: false,
      scriptIsFile: false,
    },
  });
  assert(scriptMissing.errors.includes("prepare.helper.script_path is missing"));
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #513",
    "Hardening Scope",
    "Output Path Hardening",
    "Execution-Readiness Contract",
    "Command Argv Fingerprint",
    "Helper Availability Checks",
    "Manifest Consistency Checks",
    "Diagnostics",
    "Fixture Impact",
    "CLI Usage",
    "Path Handling",
    "generated_at / Hash Behavior",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Prepare orchestration execution design",
    "Prepare orchestration execution implementation after design",
    "Prepare-output snapshots",
    "Validate orchestration design",
    "Design local Codex adapter prepare orchestration execution mode",
    "PASS with follow-up",
    "Dry-run does not execute helper",
    "execution_readiness is not permission to execute automatically",
    "no prepare helper execution",
    "no validate helper execution",
    "no Codex call",
    "no Codex SDK",
    "no provider/model API",
    "no GitHub API",
    "no network",
    "no DB",
    "no persistence",
    "no clipboard automation",
    "no accepted state",
    "no proof/evidence/readiness",
    "no review decision",
    "no UI/routes/browser surface",
    "no surface export",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #513",
    "Hardening Scope",
    "Output Path Hardening",
    "Execution-Readiness Contract",
    "Command Argv Fingerprint",
    "Helper Availability Checks",
    "Manifest Consistency Checks",
    "Diagnostics",
    "Fixture Impact",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = [docText, reportText, fixtureText].join("\n");
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
      `public docs/reports/fixtures must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  const runtimeText = `${libText}\n${cliText}`;
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
    "perspective:codex-former:validate-capture",
  ]) {
    assert.equal(
      runtimeText.includes(snippet),
      false,
      `runtime implementation must not introduce forbidden surface ${snippet}`,
    );
  }
  assertIncludesAll(`${docText}\n${reportText}\n${smokeText}`, [
    "no provider/model",
    "no Codex SDK",
    "no GitHub",
    "no network",
    "no DB",
    "no UI",
    "no prepare helper execution",
    "no validate helper execution",
    "no accepted",
    "no review decision",
    "no persistence",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    dryRunSmokeFile,
    smokeFile,
    docFile,
    reportFile,
    fixtureFile,
    "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_V0_1.md",
    "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_HARDENING_V0_1.md",
    "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-execution.md",
    "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-execution-hardening.md",
    "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json",
    "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution.mjs",
    "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution-hardening.mjs",
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `prepare dry-run hardening changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `prepare dry-run hardening must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `prepare dry-run hardening must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
    );
  }
}

function runCli(args) {
  return execFileSync(
    "npm",
    ["run", "perspective:codex-former:local-adapter:prepare", "--", ...args],
    { encoding: "utf8" },
  );
}

function expectCliFailure(args) {
  try {
    runCli(args);
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  assert.fail(`expected CLI failure for ${args.join(" ")}`);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hashText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(
      text.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function collectChangedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .filter((file) => existsSync(file) && !statSync(file).isDirectory());
  return [...new Set([...tracked, ...untracked])].sort();
}
