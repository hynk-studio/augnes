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

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";
const surfaceSnapshotsLibFile =
  "lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-prepare-orchestration.mjs";
const surfaceSnapshotsCliFile =
  "scripts/perspective-codex-former-local-adapter-surface-snapshots.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution.mjs";
const surfaceSnapshotsSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-surface-snapshots.mjs";
const dryRunSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.mjs";
const hardeningSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-dry-run-hardening.mjs";
const executionHardeningSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution-hardening.mjs";
const prepareOutputSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-output-snapshots.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_V0_1.md";
const executionHardeningDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_HARDENING_V0_1.md";
const prepareOutputDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_OUTPUT_SNAPSHOTS_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-execution.md";
const executionHardeningReportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-execution-hardening.md";
const prepareOutputReportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-output-snapshots.md";
const fixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json";
const sessionPreparedFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json";
const inboxPreparedFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json";
const preparedSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-output-snapshot-summary.json";
const sourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preflightSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json";
const manifestFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const generatedAt = "2026-06-11T00:00:00.000Z";
const helperOutDir = "/tmp/augnes-codex-former-local-adapter-prepare-execution";
const dryRunSummaryOut =
  "/tmp/augnes-codex-former-local-adapter-prepare-execution-dry-run-summary.json";
const executionSummaryOut =
  "/tmp/augnes-codex-former-local-adapter-prepare-execution-summary.json";
const tmpRoot = "/tmp/augnes-codex-former-local-adapter-prepare-execution-smoke";
const rejectionDir = join(tmpRoot, "rejections");

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const dryRunSmokeText = readFileSync(dryRunSmokeFile, "utf8");
const hardeningSmokeText = readFileSync(hardeningSmokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const fixtureText = readFileSync(fixtureFile, "utf8");
const fixture = JSON.parse(fixtureText);
const sourceInputText = readFileSync(sourceInputFixtureFile, "utf8");
const preflightSummaryText = readFileSync(preflightSummaryFixtureFile, "utf8");
const preflightSummary = JSON.parse(preflightSummaryText);
const manifestText = readFileSync(manifestFixtureFile, "utf8");

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
const summary = runExecutionHappyPath();
runRejectionCoverage();
assertExecutionSummaryShape(summary);
assertHelperOutputs(summary);
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-prepare-execution",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:prepare"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-execution"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    libFile,
    surfaceSnapshotsLibFile,
    cliFile,
    surfaceSnapshotsCliFile,
    smokeFile,
    surfaceSnapshotsSmokeFile,
    executionHardeningSmokeFile,
    docFile,
    executionHardeningDocFile,
    reportFile,
    executionHardeningReportFile,
    fixtureFile,
    sourceInputFixtureFile,
    preflightSummaryFixtureFile,
    manifestFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "codex_former_local_adapter_prepare_execution_summary.v0.1",
    "prepare-orchestration-execution",
    "buildCodexFormerLocalAdapterPrepareExecutionContext",
    "buildCodexFormerLocalAdapterPrepareExecutionSummary",
    "validateCodexFormerLocalAdapterPrepareExecutionInput",
    "prepare execution helper_command_argv_hash does not match reconstructed argv",
    "prepare execution source_input_path must exactly match dry-run summary source_input_path",
    "prepare execution preflight_summary_path must exactly match dry-run summary preflight_summary_path",
    "prepare execution helper_out_dir must exactly match dry-run summary helper_out_dir",
    "prepare_helper_executed true is operational provenance only",
  ]);
  assertIncludesAll(cliText, [
    "--execute",
    "--dry-run",
    "prepare orchestration cannot use --dry-run and --execute together",
    "prepare orchestration requires exactly one of --dry-run or --execute",
    "prepare execution requires --",
    "spawnSync",
    "shell: false",
    "perspective:codex-former:capture-packet",
    "prepare.prepare_execution_summary_out must not be inside helper out-dir",
    "codex-former-copyable-prompt.txt",
    "codex-former-capture-return-envelope-template.txt",
    "codex-former-capture-metadata.json",
    "execution_result=",
    "buildCodexFormerLocalAdapterPrepareHelperRunSummary",
    "buildCodexFormerLocalAdapterPrepareExecutionLogSummary",
    "discoverCodexFormerLocalAdapterPrepareOutputs",
  ]);
}

function runExecutionHappyPath() {
  rmSync(tmpRoot, { recursive: true, force: true });
  rmSync(helperOutDir, { recursive: true, force: true });
  rmSync(dryRunSummaryOut, { force: true });
  rmSync(executionSummaryOut, { force: true });
  mkdirSync(tmpRoot, { recursive: true });

  const dryRunStdout = runCli([
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
    dryRunSummaryOut,
  ]);
  assertIncludesAll(dryRunStdout, [
    "mode=prepare-orchestration-dry-run",
    `helper_out_dir=${helperOutDir}`,
    "helper_exit_status=not_run",
  ]);
  assert.equal(
    existsSync(helperOutDir),
    false,
    "dry-run must not create the helper output directory",
  );

  const executeStdout = runCli([
    "--execute",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--dry-run-summary",
    dryRunSummaryOut,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    helperOutDir,
    "--generated-at",
    generatedAt,
    "--prepare-execution-summary-out",
    executionSummaryOut,
  ]);
  assertIncludesAll(executeStdout, [
    "mode=prepare-orchestration-execution",
    "helper_exit_status=success",
    "helper_exit_code=0",
    "output_discovery_status=complete",
    "execution_result=success",
    "authority_boundary=review-only local-only non-authorizing",
  ]);
  assert.equal(
    readFileSync(executionSummaryOut, "utf8"),
    fixtureText,
    "execution summary output must match committed deterministic fixture",
  );
  return JSON.parse(readFileSync(executionSummaryOut, "utf8"));
}

function runRejectionCoverage() {
  mkdirSync(rejectionDir, { recursive: true });
  const gateOutDir = join(tmpRoot, "gate-out-dir");
  const gateDryRunSummary = join(tmpRoot, "gate-dry-run-summary.json");
  rmSync(gateOutDir, { recursive: true, force: true });
  runCli([
    "--dry-run",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    gateOutDir,
    "--generated-at",
    generatedAt,
    "--prepare-summary-out",
    gateDryRunSummary,
  ]);
  assert.equal(
    existsSync(gateOutDir),
    false,
    "gate dry-run must not create helper output directory",
  );
  const gateDryRun = JSON.parse(readFileSync(gateDryRunSummary, "utf8"));

  assertIncludesAll(
    expectCliFailure([
      "--execute",
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      gateOutDir,
    ]),
    ["prepare execution requires --dry-run-summary <path>"],
  );
  assertIncludesAll(
    expectCliFailure(["--dry-run", "--execute"]),
    ["cannot use --dry-run and --execute together"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--out-dir",
      gateOutDir,
    ]),
    ["requires exactly one of --dry-run or --execute"],
  );
  assertIncludesAll(expectCliFailure(["--execute", "true"]), [
    "option --execute does not accept a value",
  ]);
  assertIncludesAll(expectCliFailure(["--execute", "--command", "echo"]), [
    "unknown option: --command",
  ]);

  const staleDryRunPath = join(rejectionDir, "stale-dry-run.json");
  writeJson(staleDryRunPath, {
    ...gateDryRun,
    helper_out_dir: join(tmpRoot, "different-out-dir"),
  });
  assertIncludesAll(
    expectExecutionFailure({ dryRunSummary: staleDryRunPath, outDir: gateOutDir }),
    ["helper_out_dir must exactly match dry-run summary"],
  );

  const argvHashMismatchPath = join(rejectionDir, "argv-hash-mismatch.json");
  writeJson(argvHashMismatchPath, {
    ...gateDryRun,
    helper_command_argv_hash: "0".repeat(64),
  });
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: argvHashMismatchPath,
      outDir: gateOutDir,
    }),
    ["helper_command_argv_hash does not match reconstructed argv"],
  );

  const sourceHashMismatchPath = join(rejectionDir, "source-hash-mismatch.json");
  writeJson(sourceHashMismatchPath, {
    ...gateDryRun,
    source_input_hash: "0".repeat(64),
  });
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: sourceHashMismatchPath,
      outDir: gateOutDir,
    }),
    ["dry-run summary source_input_hash does not match source input bytes"],
  );

  const badPreflightPath = join(rejectionDir, "bad-preflight.json");
  writeJson(badPreflightPath, {
    ...preflightSummary,
    source_input_hash: "0".repeat(64),
  });
  const badPreflightDryRunPath = join(
    rejectionDir,
    "bad-preflight-dry-run.json",
  );
  writeJson(badPreflightDryRunPath, {
    ...gateDryRun,
    preflight_summary_path: badPreflightPath,
  });
  assertIncludesAll(
    expectExecutionFailure({
      preflightSummary: badPreflightPath,
      dryRunSummary: badPreflightDryRunPath,
      outDir: gateOutDir,
    }),
    ["preflight summary source_input_hash does not match source input bytes"],
  );

  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      extraArgs: ["--expected-source-input-hash", "1".repeat(64)],
    }),
    ["expected_source_input_hash does not match source input bytes"],
  );
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      extraArgs: ["--expected-helper-command-argv-hash", "2".repeat(64)],
    }),
    ["expected_helper_command_argv_hash does not match reconstructed argv"],
  );

  const existingFileOutDir = join(rejectionDir, "existing-file-out-dir");
  writeFileSync(existingFileOutDir, "file", "utf8");
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: existingFileOutDir,
    }),
    ["option --out-dir must not point to an existing file"],
  );
  const nonEmptyOutDir = join(rejectionDir, "non-empty-out-dir");
  mkdirSync(nonEmptyOutDir, { recursive: true });
  writeFileSync(join(nonEmptyOutDir, "existing.txt"), "existing", "utf8");
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: nonEmptyOutDir,
    }),
    ["prepare.out_dir must not be a non-empty directory"],
  );
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      summaryOut: join(gateOutDir, "summary.json"),
    }),
    ["prepare_execution_summary_out must not be inside helper out-dir"],
  );
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      summaryOut: sourceInputFixtureFile,
    }),
    ["output paths must be distinct"],
  );
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      summaryOut: gateDryRunSummary,
    }),
    ["output paths must be distinct"],
  );
}

function assertExecutionSummaryShape(summary) {
  assert.equal(
    summary.prepare_execution_summary_version,
    "codex_former_local_adapter_prepare_execution_summary.v0.1",
  );
  assert.equal(summary.mode, "prepare-orchestration-execution");
  assert.equal(summary.generated_at, generatedAt);
  assert.equal(summary.source_input_hash, hashText(sourceInputText));
  assert.equal(summary.preflight_summary_hash, hashText(preflightSummaryText));
  assert.equal(summary.manifest_hash, hashText(manifestText));
  assert.equal(summary.helper_command_kind, "existing_capture_helper_prepare");
  assert.deepEqual(summary.helper_command_argv.slice(0, 4), [
    "npm",
    "run",
    "perspective:codex-former:capture-packet",
    "--",
  ]);
  assert.equal(summary.helper_exit_status, "success");
  assert.equal(summary.helper_exit_code, 0);
  assert.equal(summary.output_discovery_status, "complete");
  assert.equal(summary.execution_result, "success");
  assert.equal(summary.failure_kind, null);
  assert.equal(summary.helper_invocation_attempted, true);
  assert.equal(summary.helper_process_started, true);
  assert.equal(summary.authority_flags.prepare_helper_executed, true);
  assert.equal(summary.helper_metadata_checks.metadata_parse_status, "parsed");
  assert.equal(summary.helper_metadata_checks.source_input_hash_match, true);
  assert.equal(summary.helper_metadata_checks.generated_at_match, true);
  assert.equal(summary.helper_metadata_checks.prompt_hash_match, "not_comparable");
  assert.deepEqual(summary.output_discovery_caveats, []);
  for (const key of [
    "validate_helper_executed",
    "network_calls",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "db_writes",
    "clipboard_automation",
    "accepted_state_created",
    "review_decision_created",
    "surface_export_created",
    "core_decision",
  ]) {
    assert.equal(summary.authority_flags[key], false, `${key} must be false`);
  }
  for (const logSummary of [
    summary.helper_stdout_summary,
    summary.helper_stderr_summary,
  ]) {
    assert(logSummary.included_line_count <= logSummary.max_lines);
    assert(logSummary.lines.join("").length <= logSummary.max_chars);
    assert.equal(typeof logSummary.truncated, "boolean");
    assert.equal(typeof logSummary.unsafe_marker_omitted, "boolean");
    assert(Array.isArray(logSummary.normalized_lines));
    assert(Array.isArray(logSummary.line_events));
    assert.equal(typeof logSummary.npm_wrapper_line_count, "number");
    assert.equal(typeof logSummary.helper_kv_line_count, "number");
  }
}

function assertHelperOutputs(summary) {
  for (const [pathField, hashField, sizeField] of [
    ["prompt_path", "prompt_hash", "prompt_size_bytes"],
    [
      "return_envelope_template_path",
      "return_envelope_template_hash",
      "return_envelope_template_size_bytes",
    ],
    ["helper_metadata_path", "helper_metadata_hash", "helper_metadata_size_bytes"],
  ]) {
    const outputPath = summary.helper_output_paths[pathField];
    assert(hasText(outputPath), `${pathField} must be present`);
    assert.equal(existsSync(outputPath), true, `${outputPath} must exist`);
    const bytes = readFileSync(outputPath);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      summary.helper_output_hashes[hashField],
      `${hashField} must match exact file bytes`,
    );
    assert.equal(
      statSync(outputPath).size,
      summary.helper_output_sizes[sizeField],
      `${sizeField} must match exact file size`,
    );
  }
  assert.equal(summary.helper_output_paths.manual_copy_packet_path, null);
  assert.equal(summary.helper_output_paths.former_input_packet_path, null);
  assert.equal(summary.helper_output_hashes.manual_copy_packet_hash, null);
  assert.equal(summary.helper_output_hashes.former_input_packet_hash, null);
  assert(hasText(summary.helper_output_refs.manual_copy_packet_ref));
  assert(hasText(summary.helper_output_refs.former_input_packet_ref));
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #515",
    "Implementation Scope",
    "Execution Mode Scope",
    "Required Inputs",
    "Dry-Run Equivalence Gate",
    "CLI Usage",
    "Output Directory Policy",
    "Helper Invocation",
    "Bounded stdout/stderr Policy",
    "Helper Output Discovery",
    "Execution Summary Contract",
    "Success Behavior",
    "Failure Behavior",
    "Deterministic Fixture",
    "State Mapping to Surfaces",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Future Work",
    "Recommended Next PR",
    "PASS with follow-up",
    "execution runs only",
    "It does not call Codex",
    "no validate helper",
    "no provider/model API",
    "no GitHub API",
    "no network",
    "no DB",
    "no persistence",
    "no clipboard automation",
    "no accepted state",
    "no review decision",
    "no surface export",
    "no UI/routes/browser surface",
    "operational provenance only",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #515",
    "Implementation Scope",
    "Execution Mode Behavior",
    "Dry-Run Equivalence Gate",
    "CLI Usage",
    "Helper Invocation",
    "Output Discovery",
    "Execution Summary Fixture",
    "Success and Failure Behavior",
    "Bounded Logs / Redaction",
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
    "perspective:codex-former:validate-capture",
    "app/",
    "components/",
  ]) {
    assert.equal(
      runtimeText.includes(snippet),
      false,
      `runtime implementation must not introduce forbidden surface ${snippet}`,
    );
  }
  assert(runtimeText.includes("spawnSync"), "execution may use spawnSync");
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
    "no validate helper",
    "no review decision",
    "no persistence",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    surfaceSnapshotsLibFile,
    cliFile,
    surfaceSnapshotsCliFile,
    smokeFile,
    surfaceSnapshotsSmokeFile,
    dryRunSmokeFile,
    hardeningSmokeFile,
    executionHardeningSmokeFile,
    prepareOutputSmokeFile,
    docFile,
    executionHardeningDocFile,
    prepareOutputDocFile,
    reportFile,
    executionHardeningReportFile,
    prepareOutputReportFile,
    fixtureFile,
    sessionPreparedFixtureFile,
    inboxPreparedFixtureFile,
    preparedSummaryFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `prepare execution changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `prepare execution must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `prepare execution must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
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

function expectExecutionFailure({
  preflightSummary = preflightSummaryFixtureFile,
  dryRunSummary,
  outDir,
  summaryOut = join(rejectionDir, "execution-summary.json"),
  extraArgs = [],
}) {
  return expectCliFailure([
    "--execute",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummary,
    "--dry-run-summary",
    dryRunSummary,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    outDir,
    "--generated-at",
    generatedAt,
    "--prepare-execution-summary-out",
    summaryOut,
    ...extraArgs,
  ]);
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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}
