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

const { hashCodexFormerLocalAdapterContent } = localAdapter;
const {
  buildCodexFormerLocalAdapterPrepareCommandArgv,
  buildCodexFormerLocalAdapterPrepareDryRunSummary,
  validateCodexFormerLocalAdapterPrepareDryRunInput,
} = prepareOrchestration;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";
const sourceInputLibFile =
  "lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-prepare-orchestration.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.md";
const dryRunFixtureFile =
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
const helperOutDir = "/tmp/augnes-codex-former-local-adapter-prepare-dry-run";
const tmpRoot = "/tmp/augnes-codex-former-local-adapter-prepare-dry-run-smoke";
const summaryOut = join(tmpRoot, "prepare-summary.json");
const rejectionDir = join(tmpRoot, "rejections");

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const sourceInputLibText = readFileSync(sourceInputLibFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const fixtureText = readFileSync(dryRunFixtureFile, "utf8");
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
runDryRunSuccess();
assertCommittedFixture();
runRejectionCoverage();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run",
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
    `${expectedTsxCommand} ${smokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    libFile,
    sourceInputLibFile,
    cliFile,
    smokeFile,
    docFile,
    designDocFile,
    reportFile,
    dryRunFixtureFile,
    manifestFixtureFile,
    sourceInputFixtureFile,
    preflightSummaryFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "codex_former_local_adapter_prepare_summary.v0.1",
    "prepare-orchestration-dry-run",
    "existing_capture_helper_prepare",
    "buildCodexFormerLocalAdapterPrepareDryRunSummary",
    "validateCodexFormerLocalAdapterPrepareDryRunInput",
    "assertCodexFormerLocalAdapterPreparePreflightSummary",
    "buildCodexFormerLocalAdapterPrepareCommandArgv",
    "stableStringifyCodexFormerLocalAdapterPrepareJson",
    "prepare_helper_executed",
    "validate_helper_executed",
    "surface_export_created",
  ]);
  assertIncludesAll(cliText, [
    "--dry-run",
    "prepare orchestration currently supports --dry-run only",
    "option --dry-run does not accept a value",
    "mode=${summary.mode}",
    "preflight_status=",
    "helper_exit_status=",
    "review-only local-only non-authorizing",
  ]);
  assertIncludesAll(sourceInputLibText, [
    "validateCodexFormerLocalAdapterSourceInput",
    "validateCodexFormerLocalAdapterManifest",
    "hashCodexFormerLocalAdapterContent",
  ]);
}

function runDryRunSuccess() {
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
    `prepare_summary_path=${summaryOut}`,
    `manifest_hash=${hashText(manifestText)}`,
    `source_input_hash=${hashText(sourceInputText)}`,
    "preflight_status=passed",
    `helper_out_dir=${helperOutDir}`,
    "helper_exit_status=not_run",
    "authority_boundary=review-only local-only non-authorizing",
  ]);

  const generatedSummaryText = readFileSync(summaryOut, "utf8");
  assert.equal(
    generatedSummaryText,
    fixtureText,
    "dry-run output must match the committed deterministic fixture",
  );
  assert.equal(
    existsSync(helperOutDir),
    false,
    "dry-run must not create the helper out-dir",
  );
  for (const helperOutputPath of Object.values(fixture.helper_output_paths)) {
    assert.equal(helperOutputPath, null);
  }
  for (const helperOutputHash of Object.values(fixture.helper_output_hashes)) {
    assert.equal(helperOutputHash, null);
  }

  const built = buildCodexFormerLocalAdapterPrepareDryRunSummary({
    sourceInput,
    sourceInputPath: sourceInputFixtureFile,
    sourceInputHash: hashCodexFormerLocalAdapterContent(sourceInputText),
    preflightSummary,
    preflightSummaryPath: preflightSummaryFixtureFile,
    helperOutDir,
    generatedAtOverride: generatedAt,
    manifest,
    manifestPath: manifestFixtureFile,
    manifestHash: hashCodexFormerLocalAdapterContent(manifestText),
  });
  assert.equal(built.summaryJson, fixtureText);
  assert.deepEqual(
    buildCodexFormerLocalAdapterPrepareCommandArgv({
      generatedAt,
      helperOutDir,
      sourceInputPath: sourceInputFixtureFile,
    }),
    fixture.helper_command_argv,
  );
  assert.deepEqual(
    validateCodexFormerLocalAdapterPrepareDryRunInput({
      sourceInput,
      sourceInputPath: sourceInputFixtureFile,
      sourceInputHash: hashText(sourceInputText),
      preflightSummary,
      preflightSummaryPath: preflightSummaryFixtureFile,
      helperOutDir,
      manifest,
      manifestPath: manifestFixtureFile,
      manifestHash: hashText(manifestText),
    }),
    { valid: true, errors: [] },
  );
}

function assertCommittedFixture() {
  assert.equal(
    fixture.prepare_summary_version,
    "codex_former_local_adapter_prepare_summary.v0.1",
  );
  assert.equal(fixture.mode, "prepare-orchestration-dry-run");
  assert.equal(fixture.dry_run, true);
  assert.equal(fixture.helper_exit_status, "not_run");
  assert.equal(fixture.helper_command_kind, "existing_capture_helper_prepare");
  assert(Array.isArray(fixture.helper_command_argv));
  assert.deepEqual(fixture.helper_command_argv.slice(0, 4), [
    "npm",
    "run",
    "perspective:codex-former:capture-packet",
    "--",
  ]);
  assert.equal(fixture.source_input_hash, hashText(sourceInputText));
  assert.equal(fixture.source_input_hash, preflightSummary.source_input_hash);
  assert.equal(fixture.preflight_status, "passed");
  assert.equal(fixture.manifest_hash, hashText(manifestText));
  for (const [key, value] of Object.entries(fixture.authority_flags)) {
    assert.equal(value, false, `${key} must be false`);
  }
  assert.equal(fixture.authority_flags.prepare_helper_executed, false);
  assert.equal(fixture.authority_flags.validate_helper_executed, false);
  assert.equal(fixture.authority_flags.surface_export_created, false);
  assert.equal(fixture.authority_flags.network_calls, false);
}

function runRejectionCoverage() {
  mkdirSync(rejectionDir, { recursive: true });
  assertIncludesAll(
    expectCliFailure([
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
    ]),
    ["prepare orchestration currently supports --dry-run only"],
  );
  assertIncludesAll(expectCliFailure(["--dry-run", "true"]), [
    "option --dry-run does not accept a value",
  ]);
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
    ]),
    ["prepare dry-run requires --source-input <path>"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      join(rejectionDir, "missing-source-input.json"),
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
    ]),
    ["source input file does not exist"],
  );

  const invalidSourceInputPath = join(rejectionDir, "invalid-source-input.json");
  writeJson(invalidSourceInputPath, {
    ...sourceInput,
    tests_checks_run: [
      {
        ...sourceInput.tests_checks_run[0],
        status: "skipped",
      },
    ],
  });
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      invalidSourceInputPath,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
    ]),
    ["source_input.tests_checks_run[0].status must be passed or failed"],
  );

  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--out-dir",
      helperOutDir,
    ]),
    ["prepare dry-run requires --preflight-summary <path>"],
  );
  const invalidPreflightPath = join(rejectionDir, "invalid-preflight.json");
  writeFileSync(invalidPreflightPath, "{ nope", "utf8");
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      invalidPreflightPath,
      "--out-dir",
      helperOutDir,
    ]),
    ["preflight summary file is not valid JSON"],
  );

  const failedPreflightPath = join(rejectionDir, "failed-preflight.json");
  writeJson(failedPreflightPath, {
    ...preflightSummary,
    status: "failed",
    errors: ["bounded preflight failure"],
  });
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      failedPreflightPath,
      "--out-dir",
      helperOutDir,
    ]),
    ["prepare preflight summary status must be passed"],
  );

  const mismatchPreflightPath = join(rejectionDir, "mismatch-preflight.json");
  writeJson(mismatchPreflightPath, {
    ...preflightSummary,
    source_input_hash: "0".repeat(64),
  });
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      mismatchPreflightPath,
      "--out-dir",
      helperOutDir,
    ]),
    ["source_input_hash does not match source input bytes"],
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
      "--expected-source-input-hash",
      "1".repeat(64),
    ]),
    ["expected source input hash does not match source input bytes"],
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

  const summaryDirectory = join(rejectionDir, "summary-directory");
  mkdirSync(summaryDirectory, { recursive: true });
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
      summaryDirectory,
    ]),
    ["option --prepare-summary-out must not point to a directory"],
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
  assertIncludesAll(expectCliFailure(["--banana", "value"]), [
    "unknown option: --banana",
  ]);
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      helperOutDir,
    ]),
    ["duplicate option: --source-input"],
  );
  assertIncludesAll(expectCliFailure(["--source-input"]), [
    "option --source-input requires a value",
  ]);

  const invalidManifestPath = join(rejectionDir, "invalid-manifest.json");
  writeJson(invalidManifestPath, {
    ...manifest,
    adapter_manifest_version: "unsupported",
  });
  assertIncludesAll(
    expectCliFailure([
      "--dry-run",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--manifest",
      invalidManifestPath,
      "--out-dir",
      helperOutDir,
    ]),
    ["manifest adapter_manifest_version"],
  );

  const unsafeSourceInputPath = join(rejectionDir, "unsafe-source-input.json");
  const unsafeMarker = ["access", "token"].join("_");
  writeJson(unsafeSourceInputPath, {
    ...sourceInput,
    changed_files_summary: unsafeMarker,
  });
  const unsafeOutput = expectCliFailure([
    "--dry-run",
    "--source-input",
    unsafeSourceInputPath,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--out-dir",
    helperOutDir,
  ]);
  assertIncludesAll(unsafeOutput, ["unsafe marker category"]);
  assert.equal(
    unsafeOutput.includes(unsafeMarker),
    false,
    "unsafe value must not be echoed in diagnostics",
  );

  const unsafePreflightPath = join(rejectionDir, "unsafe-preflight.json");
  writeJson(unsafePreflightPath, {
    ...preflightSummary,
    source_input_path: unsafeMarker,
  });
  const unsafePreflightOutput = expectCliFailure([
    "--dry-run",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    unsafePreflightPath,
    "--out-dir",
    helperOutDir,
  ]);
  assertIncludesAll(unsafePreflightOutput, ["unsafe marker category"]);
  assert.equal(
    unsafePreflightOutput.includes(unsafeMarker),
    false,
    "unsafe preflight value must not be echoed in diagnostics",
  );
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #512",
    "Dry-Run Scope",
    "CLI Usage",
    "Required Inputs",
    "Optional Inputs",
    "Input Validation",
    "Constructed Helper Command",
    "Prepare Dry-Run Summary Contract",
    "Deterministic Fixture",
    "Path Handling",
    "generated_at / Hash Behavior",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Prepare orchestration execution implementation",
    "Prepare-output snapshots for Session Panel and Inbox states",
    "Validate orchestration design",
    "PASS/BLOCKED validate-summary modeling",
    "Harden local Codex adapter prepare orchestration dry-run",
    "PASS with follow-up",
    "Dry-run does not execute helper",
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
    "Why Follows PR #512",
    "Implementation Scope",
    "Dry-Run Behavior",
    "CLI Usage",
    "Input Validation",
    "Constructed Helper Command",
    "Prepare Summary Fixture",
    "Path Handling",
    "generated_at / Hash Behavior",
    "Privacy/Redaction Handling",
    "Authority Boundary",
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
	    "node:child_process",
	    ["execFile", "Sync"].join(""),
	    ["execFile", "("].join(""),
	    ["spawn", "("].join(""),
    "perspective-codex-former-capture-helper",
    "perspective:codex-former:validate-capture",
  ]) {
    assert.equal(
      runtimeText.includes(snippet),
      false,
      `runtime implementation must not introduce forbidden surface ${snippet}`,
    );
  }
  assertIncludesAll(`${docText}\n${reportText}\n${smokeText}`, [
    "no UI",
    "no route",
    "no accepted",
    "no provider/model",
    "no Codex SDK",
    "no GitHub",
    "no network",
    "no DB",
    "no clipboard",
    "no prepare helper execution",
    "no validate helper execution",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    smokeFile,
    docFile,
    reportFile,
    dryRunFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `prepare orchestration dry-run changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `prepare orchestration dry-run must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `prepare orchestration dry-run must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
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
