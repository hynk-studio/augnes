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
import prepareOrchestration from "../lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";

const {
  buildCodexFormerLocalAdapterPrepareExecutionLogSummary,
  buildCodexFormerLocalAdapterPrepareExecutionOutcome,
  buildCodexFormerLocalAdapterPrepareExecutionSummary,
  buildCodexFormerLocalAdapterPrepareHelperRunSummary,
  discoverCodexFormerLocalAdapterPrepareOutputs,
} = prepareOrchestration;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";
const surfaceSnapshotsLibFile =
  "lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-prepare-orchestration.mjs";
const surfaceSnapshotsCliFile =
  "scripts/perspective-codex-former-local-adapter-surface-snapshots.mjs";
const executionSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution.mjs";
const surfaceSnapshotsSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-surface-snapshots.mjs";
const dryRunSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.mjs";
const dryRunHardeningSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-dry-run-hardening.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution-hardening.mjs";
const prepareOutputSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-output-snapshots.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_HARDENING_V0_1.md";
const prepareOutputDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_OUTPUT_SNAPSHOTS_V0_1.md";
const reportFile =
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
const tmpRoot =
  "/tmp/augnes-codex-former-local-adapter-prepare-execution-hardening-smoke";
const rejectionDir = join(tmpRoot, "rejections");

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const executionSmokeText = readFileSync(executionSmokeFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
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
const happy = runHappyPath();
assertHappyPathSemantics(happy);
assertPureOutcomeSemantics(happy);
assertLogNormalization();
assertOutputDiscoveryHardening(happy);
runDryRunEquivalenceRejections();
runCliModeHardening();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-prepare-execution-hardening",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:prepare"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-execution-hardening"
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
    executionSmokeFile,
    surfaceSnapshotsSmokeFile,
    dryRunSmokeFile,
    dryRunHardeningSmokeFile,
    smokeFile,
    docFile,
    reportFile,
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
    "helper_invocation_attempted",
    "helper_process_started",
    "execution_result",
    "helper_spawn_failed",
    "summary_write_failed",
    "buildCodexFormerLocalAdapterPrepareExecutionOutcome",
    "buildCodexFormerLocalAdapterPrepareHelperRunSummary",
    "buildCodexFormerLocalAdapterPrepareExecutionLogSummary",
    "discoverCodexFormerLocalAdapterPrepareOutputs",
    "helper_metadata_checks",
    "prompt_hash_match",
    "metadata_parse_status",
    "output_discovery_caveats",
    "npm_wrapper_line_count",
    "helper_kv_line_count",
    "normalized_lines",
    "line_events",
  ]);
  assertIncludesAll(cliText, [
    "collectHelperOutputFiles",
    "buildCodexFormerLocalAdapterPrepareHelperRunSummary",
    "buildCodexFormerLocalAdapterPrepareExecutionLogSummary",
    "discoverCodexFormerLocalAdapterPrepareOutputs",
    "execution_result=",
    "shell: false",
  ]);
}

function runHappyPath() {
  rmSync(tmpRoot, { recursive: true, force: true });
  rmSync(helperOutDir, { recursive: true, force: true });
  rmSync(dryRunSummaryOut, { force: true });
  rmSync(executionSummaryOut, { force: true });
  mkdirSync(tmpRoot, { recursive: true });
  runCli([
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
  assert.equal(
    existsSync(helperOutDir),
    false,
    "helper output directory is created only for execution",
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
    "execution_result=success",
    "output_discovery_status=complete",
  ]);
  assert.equal(
    readFileSync(executionSummaryOut, "utf8"),
    fixtureText,
    "execution summary output must match committed deterministic fixture",
  );
  assert.equal(existsSync(helperOutDir), true, "helper output is preserved");
  return JSON.parse(readFileSync(executionSummaryOut, "utf8"));
}

function assertHappyPathSemantics(summary) {
  assert.equal(summary.helper_invocation_attempted, true);
  assert.equal(summary.helper_process_started, true);
  assert.equal(summary.authority_flags.prepare_helper_executed, true);
  assert.equal(summary.authority_flags.validate_helper_executed, false);
  assert.equal(summary.execution_result, "success");
  assert.equal(summary.failure_kind, null);
  assert.equal(summary.helper_exit_status, "success");
  assert.equal(summary.helper_exit_code, 0);
  assert.equal(summary.output_discovery_status, "complete");
  assert.equal(summary.helper_metadata_checks.metadata_parse_status, "parsed");
  assert.equal(summary.helper_metadata_checks.source_input_hash_match, true);
  assert.equal(summary.helper_metadata_checks.generated_at_match, true);
  assert.equal(summary.helper_metadata_checks.prompt_hash_match, "not_comparable");
  assert.equal(summary.output_discovery_caveats.length, 0);
  assert.equal(summary.helper_stdout_summary.npm_wrapper_line_count, 2);
  assert(summary.helper_stdout_summary.helper_kv_line_count >= 8);
  assert(summary.helper_stdout_summary.normalized_lines.includes("[npm-wrapper]"));
  for (const key of [
    "accepted_state_created",
    "review_decision_created",
    "proof_evidence_readiness_created",
    "surface_export_created",
    "network_calls",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "db_writes",
    "clipboard_automation",
    "core_decision",
  ]) {
    assert.equal(summary.authority_flags[key], false, `${key} must be false`);
  }
}

function assertPureOutcomeSemantics(happy) {
  const spawnFailed = buildCodexFormerLocalAdapterPrepareHelperRunSummary({
    helperInvocationAttempted: true,
    helperExitCode: null,
    stdout: "",
    stderr: "spawn failed",
    spawnErrorName: "ENOENT",
  });
  const failedDiscovery = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: "failed",
    helperOutDir: helperOutDir,
    sourceInputHash: happy.source_input_hash,
    generatedAt,
    files: { prompt: null, returnEnvelopeTemplate: null, metadata: null },
  });
  const spawnOutcome = buildCodexFormerLocalAdapterPrepareExecutionOutcome({
    helperRunSummary: spawnFailed,
    outputDiscoveryStatus: failedDiscovery.status,
  });
  assert.deepEqual(spawnOutcome, {
    execution_result: "invocation_failed",
    failure_kind: "helper_spawn_failed",
    prepare_helper_executed: false,
  });
  const spawnSummary = buildCodexFormerLocalAdapterPrepareExecutionSummary({
    context: buildContextFromHappySummary(happy),
    helperRunSummary: spawnFailed,
    helperStdoutSummary: buildCodexFormerLocalAdapterPrepareExecutionLogSummary(""),
    helperStderrSummary:
      buildCodexFormerLocalAdapterPrepareExecutionLogSummary("spawn failed"),
    outputDiscovery: failedDiscovery,
  }).summary;
  assert.equal(spawnSummary.execution_result, "invocation_failed");
  assert.equal(spawnSummary.failure_kind, "helper_spawn_failed");
  assert.equal(spawnSummary.authority_flags.prepare_helper_executed, false);

  const nonZero = buildCodexFormerLocalAdapterPrepareHelperRunSummary({
    helperInvocationAttempted: true,
    helperExitCode: 17,
    stdout: "mode=prepare",
    stderr: "helper failed",
  });
  const helperFailedOutcome = buildCodexFormerLocalAdapterPrepareExecutionOutcome({
    helperRunSummary: nonZero,
    outputDiscoveryStatus: failedDiscovery.status,
  });
  assert.deepEqual(helperFailedOutcome, {
    execution_result: "helper_failed",
    failure_kind: "helper_exit_nonzero",
    prepare_helper_executed: true,
  });
  const helperFailedSummary = buildCodexFormerLocalAdapterPrepareExecutionSummary({
    context: buildContextFromHappySummary(happy),
    helperRunSummary: nonZero,
    helperStdoutSummary:
      buildCodexFormerLocalAdapterPrepareExecutionLogSummary(nonZero.stdout),
    helperStderrSummary:
      buildCodexFormerLocalAdapterPrepareExecutionLogSummary(nonZero.stderr),
    outputDiscovery: failedDiscovery,
  }).summary;
  assert.equal(helperFailedSummary.execution_result, "helper_failed");
  assert.equal(helperFailedSummary.failure_kind, "helper_exit_nonzero");
  assert.equal(helperFailedSummary.authority_flags.prepare_helper_executed, true);
}

function assertLogNormalization() {
  const unsafeMarker = ["access", "token"].join("_");
  const summary = buildCodexFormerLocalAdapterPrepareExecutionLogSummary(
    [
      "",
      "> npm wrapper line",
      "mode=prepare",
      `omit ${unsafeMarker} value`,
      "other text that is intentionally long",
    ].join("\n"),
    { maxLines: 3, maxChars: 200 },
  );
  assert.equal(summary.line_count, 5);
  assert.equal(summary.included_line_count, 3);
  assert.equal(summary.truncated, true);
  assert.equal(summary.unsafe_marker_omitted, true);
  assert.equal(summary.npm_wrapper_line_count, 1);
  assert.equal(summary.helper_kv_line_count, 1);
  assert(summary.normalized_lines.includes("[npm-wrapper]"));
  assert(summary.line_events.some((event) => event.category === "omitted_unsafe"));
  assert.equal(summary.lines.join("\n").includes(unsafeMarker), false);

  const charBounded = buildCodexFormerLocalAdapterPrepareExecutionLogSummary(
    "mode=prepare\nabcdefghijklmnopqrstuvwxyz",
    { maxLines: 10, maxChars: 18 },
  );
  assert.equal(charBounded.truncated, true);
  assert(charBounded.lines.join("").length <= charBounded.max_chars);
}

function assertOutputDiscoveryHardening(happy) {
  const files = readCurrentHelperFiles();
  const completeDiscovery = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: "success",
    helperOutDir,
    sourceInputHash: happy.source_input_hash,
    generatedAt,
    files,
  });
  assert.equal(completeDiscovery.status, "complete");
  assert.equal(completeDiscovery.metadata_checks.source_input_hash_match, true);

  const missingMetadata = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: "success",
    helperOutDir,
    sourceInputHash: happy.source_input_hash,
    generatedAt,
    files: { ...files, metadata: null },
  });
  assert.equal(missingMetadata.status, "incomplete");
  assert.equal(missingMetadata.metadata_checks.metadata_parse_status, "missing");

  const missingPrompt = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: "success",
    helperOutDir,
    sourceInputHash: happy.source_input_hash,
    generatedAt,
    files: { ...files, prompt: null },
  });
  assert.equal(missingPrompt.status, "incomplete");
  assert.equal(missingPrompt.metadata_checks.prompt_hash_match, "not_present");

  const invalidMetadata = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: "success",
    helperOutDir,
    sourceInputHash: happy.source_input_hash,
    generatedAt,
    files: {
      ...files,
      metadata: { ...files.metadata, text: "{ nope" },
    },
  });
  assert.equal(invalidMetadata.status, "incomplete");
  assert.equal(invalidMetadata.metadata_checks.metadata_parse_status, "invalid_json");

  const mismatchedMetadataValue = JSON.parse(files.metadata.text);
  mismatchedMetadataValue.source_input_hash = "0".repeat(64);
  const mismatch = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: "success",
    helperOutDir,
    sourceInputHash: happy.source_input_hash,
    generatedAt,
    files: {
      ...files,
      metadata: {
        ...files.metadata,
        text: `${JSON.stringify(mismatchedMetadataValue, null, 2)}\n`,
      },
    },
  });
  assert.equal(mismatch.status, "incomplete");
  assert.equal(mismatch.metadata_checks.source_input_hash_match, false);
}

function runDryRunEquivalenceRejections() {
  mkdirSync(rejectionDir, { recursive: true });
  const gateOutDir = join(tmpRoot, "gate-out-dir");
  const gateDryRunSummary = join(rejectionDir, "gate-dry-run-summary.json");
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
  const dryRun = JSON.parse(readFileSync(gateDryRunSummary, "utf8"));
  for (const [name, patch, expected] of [
    ["dry-run-false", { dry_run: false }, "dry_run must be true"],
    [
      "helper-ran",
      { helper_exit_status: "success" },
      "helper_exit_status must be not_run",
    ],
    [
      "readiness-false",
      {
        execution_readiness: {
          ...dryRun.execution_readiness,
          ready_for_prepare_execution: false,
          status: "not_ready",
          blockers: ["not ready"],
        },
      },
      "ready_for_prepare_execution must be true",
    ],
    [
      "source-path-mismatch",
      { source_input_path: "reports/fixtures/other.json" },
      "source_input_path must exactly match dry-run summary",
    ],
    [
      "preflight-path-mismatch",
      { preflight_summary_path: "reports/fixtures/other-preflight.json" },
      "preflight_summary_path must exactly match dry-run summary",
    ],
    [
      "manifest-path-mismatch",
      { manifest_path: "reports/fixtures/other-manifest.json" },
      "manifest_path must exactly match dry-run summary",
    ],
    [
      "generated-at-mismatch",
      { generated_at: "2026-06-11T00:00:01.000Z" },
      "generated_at must match dry-run summary",
    ],
  ]) {
    const path = join(rejectionDir, `${name}.json`);
    writeJson(path, { ...dryRun, ...patch });
    assertIncludesAll(
      expectExecutionFailure({ dryRunSummary: path, outDir: gateOutDir }),
      [expected],
    );
  }
}

function runCliModeHardening() {
  mkdirSync(rejectionDir, { recursive: true });
  const gateOutDir = join(tmpRoot, "mode-gate-out-dir");
  const gateDryRunSummary = join(rejectionDir, "mode-gate-dry-run-summary.json");
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

  assertIncludesAll(expectCliFailure(["--execute", "--dry-run"]), [
    "cannot use --dry-run and --execute together",
  ]);
  assertIncludesAll(expectCliFailure(["--source-input", sourceInputFixtureFile]), [
    "requires exactly one of --dry-run or --execute",
  ]);
  assertIncludesAll(expectCliFailure(["--execute", "--command", "echo"]), [
    "unknown option: --command",
  ]);
  for (const option of [
    "--provider",
    "--github-token",
    "--db-path",
    "--network",
    "--validate",
  ]) {
    assertIncludesAll(expectCliFailure(["--execute", option, "x"]), [
      `unknown option: ${option}`,
    ]);
  }
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      extraArgs: ["--bounded-log-lines", "0"],
    }),
    ["bounded-log-lines must be an integer from 1 to 200"],
  );
  assertIncludesAll(
    expectExecutionFailure({
      dryRunSummary: gateDryRunSummary,
      outDir: gateOutDir,
      extraArgs: ["--bounded-log-lines", "201"],
    }),
    ["bounded-log-lines must be an integer from 1 to 200"],
  );

  const nonEmptyOutDir = join(rejectionDir, "mode-non-empty-out-dir");
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

  const boundedOutDir = join(tmpRoot, "bounded-out-dir");
  const boundedDryRunSummary = join(rejectionDir, "bounded-dry-run-summary.json");
  const boundedExecutionSummary = join(rejectionDir, "bounded-execution-summary.json");
  rmSync(boundedOutDir, { recursive: true, force: true });
  runCli([
    "--dry-run",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    boundedOutDir,
    "--generated-at",
    generatedAt,
    "--prepare-summary-out",
    boundedDryRunSummary,
  ]);
  runCli([
    "--execute",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--dry-run-summary",
    boundedDryRunSummary,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    boundedOutDir,
    "--generated-at",
    generatedAt,
    "--prepare-execution-summary-out",
    boundedExecutionSummary,
    "--bounded-log-lines",
    "4",
  ]);
  const boundedSummary = JSON.parse(
    readFileSync(boundedExecutionSummary, "utf8"),
  );
  assert.equal(boundedSummary.helper_stdout_summary.max_lines, 4);
  assert(
    boundedSummary.helper_stdout_summary.included_line_count <= 4,
    "bounded-log-lines must change included_line_count deterministically",
  );

  const noSummaryOut = join(tmpRoot, "no-summary-out-dir");
  const noSummaryDryRun = join(rejectionDir, "no-summary-dry-run-summary.json");
  rmSync(noSummaryOut, { recursive: true, force: true });
  rmSync(executionSummaryOut, { force: true });
  runCli([
    "--dry-run",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    noSummaryOut,
    "--generated-at",
    generatedAt,
    "--prepare-summary-out",
    noSummaryDryRun,
  ]);
  runCli([
    "--execute",
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--dry-run-summary",
    noSummaryDryRun,
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    noSummaryOut,
    "--generated-at",
    generatedAt,
    "--bounded-log-lines",
    "4",
  ]);
  assert.equal(
    existsSync(executionSummaryOut),
    false,
    "omitting prepare-execution-summary-out must not write the deterministic summary path",
  );
  assert.equal(existsSync(noSummaryOut), true, "no automatic cleanup");
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #516",
    "Hardening Scope",
    "Execution Outcome Semantics",
    "Helper Invocation Provenance",
    "Bounded Log Normalization",
    "Output Discovery Hardening",
    "Dry-Run Equivalence Hardening",
    "Summary Write and Failure Behavior",
    "CLI and Mode Hardening",
    "Fixture Impact",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Prepare-output snapshots for Session Panel and Inbox",
    "Validate orchestration design",
    "PASS/BLOCKED validate-summary modeling",
    "PASS with follow-up",
    "no validate helper",
    "no Codex call",
    "no Codex SDK",
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
    "Why Follows PR #516",
    "Hardening Scope",
    "Execution Outcome Semantics",
    "Helper Invocation Provenance",
    "Bounded Log Normalization",
    "Output Discovery Hardening",
    "Dry-Run Equivalence Hardening",
    "Summary Write and Failure Behavior",
    "CLI and Mode Hardening",
    "Fixture Impact",
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
    executionSmokeFile,
    surfaceSnapshotsSmokeFile,
    dryRunSmokeFile,
    dryRunHardeningSmokeFile,
    smokeFile,
    prepareOutputSmokeFile,
    docFile,
    prepareOutputDocFile,
    reportFile,
    prepareOutputReportFile,
    fixtureFile,
    sessionPreparedFixtureFile,
    inboxPreparedFixtureFile,
    preparedSummaryFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `prepare execution hardening changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `prepare execution hardening must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `prepare execution hardening must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
    );
  }
}

function buildContextFromHappySummary(summary) {
  return {
    generatedAt: summary.generated_at,
    sourceInputPath: summary.source_input_path,
    sourceInputHash: summary.source_input_hash,
    preflightSummaryPath: summary.preflight_summary_path,
    preflightSummaryHash: summary.preflight_summary_hash,
    dryRunSummaryPath: summary.dry_run_summary_path,
    dryRunSummaryHash: summary.dry_run_summary_hash,
    manifestPath: summary.manifest_path,
    manifestHash: summary.manifest_hash,
    helperOutDir: summary.helper_out_dir,
    helperCommandArgv: summary.helper_command_argv,
    helperCommandArgvHash: summary.helper_command_argv_hash,
    dryRunSummary: {
      execution_readiness: summary.execution_readiness_snapshot,
    },
  };
}

function readCurrentHelperFiles() {
  return {
    prompt: readSnapshot(
      join(helperOutDir, "codex-former-copyable-prompt.txt"),
    ),
    returnEnvelopeTemplate: readSnapshot(
      join(helperOutDir, "codex-former-capture-return-envelope-template.txt"),
    ),
    metadata: readSnapshot(
      join(helperOutDir, "codex-former-capture-metadata.json"),
    ),
  };
}

function readSnapshot(path) {
  return {
    path,
    text: readFileSync(path, "utf8"),
    size_bytes: statSync(path).size,
  };
}

function expectExecutionFailure({
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
    preflightSummaryFixtureFile,
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
