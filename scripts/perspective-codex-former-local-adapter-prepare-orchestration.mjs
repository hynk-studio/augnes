import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
import prepareOrchestration from "../lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";

const {
  assertCodexFormerLocalAdapterManifest,
  assertCodexFormerLocalAdapterSourceInput,
  hashCodexFormerLocalAdapterContent,
} = localAdapter;
const {
  buildCodexFormerLocalAdapterPrepareDryRunSummary,
  buildCodexFormerLocalAdapterPrepareExecutionContext,
  buildCodexFormerLocalAdapterPrepareExecutionLogSummary,
  buildCodexFormerLocalAdapterPrepareExecutionSummary,
  buildCodexFormerLocalAdapterPrepareHelperRunSummary,
  discoverCodexFormerLocalAdapterPrepareOutputs,
} = prepareOrchestration;

const valueRequiredOptions = new Set([
  "source-input",
  "preflight-summary",
  "dry-run-summary",
  "out-dir",
  "generated-at",
  "prepare-summary-out",
  "prepare-execution-summary-out",
  "manifest",
  "expected-source-input-hash",
  "expected-helper-command-argv-hash",
  "bounded-log-lines",
]);

const booleanOptions = new Set(["dry-run", "execute"]);
const dryRunOnlyOptions = new Set(["prepare-summary-out"]);
const executeOnlyOptions = new Set([
  "dry-run-summary",
  "prepare-execution-summary-out",
  "expected-helper-command-argv-hash",
  "bounded-log-lines",
]);
const captureHelperPackageScript = "perspective:codex-former:capture-packet";
const captureHelperScriptPath = "scripts/perspective-codex-former-capture-helper.mjs";
const defaultBoundedLogLines = 40;
const defaultBoundedLogChars = 4000;

const helperOutputFileNames = {
  prompt: "codex-former-copyable-prompt.txt",
  returnEnvelopeTemplate: "codex-former-capture-return-envelope-template.txt",
  metadata: "codex-former-capture-metadata.json",
};

export function runLocalAdapterPrepareOrchestrationCli(argv) {
  const options = parseOptions(argv);
  const dryRun = options["dry-run"] === true;
  const execute = options.execute === true;
  if (dryRun && execute) {
    throw new Error("prepare orchestration cannot use --dry-run and --execute together");
  }
  if (!dryRun && !execute) {
    throw new Error("prepare orchestration requires exactly one of --dry-run or --execute");
  }
  if (dryRun) {
    rejectModeSpecificOptions(options, executeOnlyOptions, "--dry-run");
    return runDryRun(options);
  }

  rejectModeSpecificOptions(options, dryRunOnlyOptions, "--execute");
  return runExecute(options);
}

function runDryRun(options) {
  for (const optionName of ["source-input", "preflight-summary", "out-dir"]) {
    if (!hasText(options[optionName])) {
      throw new Error(`prepare dry-run requires --${optionName} <path>`);
    }
  }

  const sourceInputPath = String(options["source-input"]);
  const sourceInputReadPath = resolve(sourceInputPath);
  const preflightSummaryPath = String(options["preflight-summary"]);
  const preflightSummaryReadPath = resolve(preflightSummaryPath);
  const helperOutDir = String(options["out-dir"]);
  const helperOutDirPath = resolve(helperOutDir);
  const helperOutDirStatus = inspectOutDirShape(helperOutDirPath, "--out-dir");

  const prepareSummaryPath = hasText(options["prepare-summary-out"])
    ? String(options["prepare-summary-out"])
    : null;
  const prepareSummaryWritePath = prepareSummaryPath
    ? resolve(prepareSummaryPath)
    : null;
  if (prepareSummaryWritePath) {
    ensureWritableFilePath(prepareSummaryWritePath, "--prepare-summary-out");
    if (isInsideOrEqual(helperOutDirPath, prepareSummaryWritePath)) {
      throw new Error("prepare.prepare_summary_out must not be inside helper out-dir");
    }
    ensureDistinctPaths([
      ["--source-input", sourceInputReadPath],
      ["--preflight-summary", preflightSummaryReadPath],
      ...(hasText(options.manifest)
        ? [["--manifest", resolve(String(options.manifest))]]
        : []),
      ["--prepare-summary-out", prepareSummaryWritePath],
    ]);
  }

  const sourceInputText = readFile(sourceInputReadPath, "prepare.source_input_path");
  const sourceInput = assertCodexFormerLocalAdapterSourceInput(
    parseJson(sourceInputText, "source input file"),
  );
  const sourceInputHash = hashCodexFormerLocalAdapterContent(sourceInputText);

  const preflightSummaryText = readFile(
    preflightSummaryReadPath,
    "prepare.preflight_summary_path",
  );
  const preflightSummary = parseJson(
    preflightSummaryText,
    "preflight summary file",
  );

  const manifestPayload = hasText(options.manifest)
    ? readManifest(String(options.manifest))
    : {
        manifest: null,
        manifestPath: null,
        manifestHash: null,
      };

  const result = buildCodexFormerLocalAdapterPrepareDryRunSummary({
    sourceInput,
    sourceInputPath,
    sourceInputHash,
    preflightSummary,
    preflightSummaryPath,
    helperOutDir,
    generatedAtOverride: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : null,
    manifest: manifestPayload.manifest,
    manifestPath: manifestPayload.manifestPath,
    manifestHash: manifestPayload.manifestHash,
    expectedSourceInputHash: hasText(options["expected-source-input-hash"])
      ? String(options["expected-source-input-hash"])
      : null,
    helperAvailability: readHelperAvailability(),
    helperOutDirStatus,
    prepareSummaryOutsideHelperOutDir: prepareSummaryWritePath
      ? !isInsideOrEqual(helperOutDirPath, prepareSummaryWritePath)
      : true,
  });

  if (prepareSummaryWritePath) {
    writeTextFile(prepareSummaryWritePath, result.summaryJson);
  }

  printDryRunSummary(result.summary, prepareSummaryPath);
  return result;
}

function runExecute(options) {
  for (const optionName of [
    "source-input",
    "preflight-summary",
    "dry-run-summary",
    "out-dir",
  ]) {
    if (!hasText(options[optionName])) {
      throw new Error(`prepare execution requires --${optionName} <path>`);
    }
  }

  const sourceInputPath = String(options["source-input"]);
  const sourceInputReadPath = resolve(sourceInputPath);
  const preflightSummaryPath = String(options["preflight-summary"]);
  const preflightSummaryReadPath = resolve(preflightSummaryPath);
  const dryRunSummaryPath = String(options["dry-run-summary"]);
  const dryRunSummaryReadPath = resolve(dryRunSummaryPath);
  const helperOutDir = String(options["out-dir"]);
  const helperOutDirPath = resolve(helperOutDir);
  inspectOutDirShape(helperOutDirPath, "--out-dir");

  const executionSummaryPath = hasText(options["prepare-execution-summary-out"])
    ? String(options["prepare-execution-summary-out"])
    : null;
  const executionSummaryWritePath = executionSummaryPath
    ? resolve(executionSummaryPath)
    : null;
  if (executionSummaryWritePath) {
    ensureWritableFilePath(
      executionSummaryWritePath,
      "--prepare-execution-summary-out",
    );
    if (isInsideOrEqual(helperOutDirPath, executionSummaryWritePath)) {
      throw new Error(
        "prepare.prepare_execution_summary_out must not be inside helper out-dir",
      );
    }
    ensureDistinctPaths([
      ["--source-input", sourceInputReadPath],
      ["--preflight-summary", preflightSummaryReadPath],
      ["--dry-run-summary", dryRunSummaryReadPath],
      ...(hasText(options.manifest)
        ? [["--manifest", resolve(String(options.manifest))]]
        : []),
      ["--prepare-execution-summary-out", executionSummaryWritePath],
    ]);
  }

  const sourceInputText = readFile(sourceInputReadPath, "prepare.source_input_path");
  const sourceInput = assertCodexFormerLocalAdapterSourceInput(
    parseJson(sourceInputText, "source input file"),
  );
  const sourceInputHash = hashCodexFormerLocalAdapterContent(sourceInputText);
  const preflightSummaryText = readFile(
    preflightSummaryReadPath,
    "prepare.preflight_summary_path",
  );
  const preflightSummary = parseJson(
    preflightSummaryText,
    "preflight summary file",
  );
  const preflightSummaryHash =
    hashCodexFormerLocalAdapterContent(preflightSummaryText);
  const dryRunSummaryText = readFile(
    dryRunSummaryReadPath,
    "prepare.dry_run_summary_path",
  );
  const dryRunSummary = parseJson(dryRunSummaryText, "dry-run summary file");
  const dryRunSummaryHash =
    hashCodexFormerLocalAdapterContent(dryRunSummaryText);
  const manifestPayload = hasText(options.manifest)
    ? readManifest(String(options.manifest))
    : {
        manifest: null,
        manifestPath: null,
        manifestHash: null,
      };
  const boundedLogLines = parseBoundedLogLines(options["bounded-log-lines"]);

  const context = buildCodexFormerLocalAdapterPrepareExecutionContext({
    sourceInput,
    sourceInputPath,
    sourceInputHash,
    preflightSummary,
    preflightSummaryPath,
    preflightSummaryHash,
    dryRunSummary,
    dryRunSummaryPath,
    dryRunSummaryHash,
    helperOutDir,
    generatedAtOverride: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : null,
    manifest: manifestPayload.manifest,
    manifestPath: manifestPayload.manifestPath,
    manifestHash: manifestPayload.manifestHash,
    expectedSourceInputHash: hasText(options["expected-source-input-hash"])
      ? String(options["expected-source-input-hash"])
      : null,
    expectedHelperCommandArgvHash: hasText(
      options["expected-helper-command-argv-hash"],
    )
      ? String(options["expected-helper-command-argv-hash"])
      : null,
  });

  reserveHelperOutDirForExecution(helperOutDirPath);
  const helperRun = runCaptureHelperPrepare(context.helperCommandArgv);
  const outputDiscovery = discoverCodexFormerLocalAdapterPrepareOutputs({
    helperExitStatus: helperRun.helper_exit_status,
    helperOutDir,
    sourceInputHash,
    generatedAt: context.generatedAt,
    files: collectHelperOutputFiles(helperOutDirPath),
  });
  const result = buildCodexFormerLocalAdapterPrepareExecutionSummary({
    context,
    helperRunSummary: helperRun,
    helperStdoutSummary: buildCodexFormerLocalAdapterPrepareExecutionLogSummary(helperRun.stdout, {
      maxLines: boundedLogLines,
      maxChars: defaultBoundedLogChars,
    }),
    helperStderrSummary: buildCodexFormerLocalAdapterPrepareExecutionLogSummary(helperRun.stderr, {
      maxLines: boundedLogLines,
      maxChars: defaultBoundedLogChars,
    }),
    outputDiscovery,
  });

  if (executionSummaryWritePath) {
    writeTextFile(executionSummaryWritePath, result.summaryJson);
  }

  printExecutionSummary(result.summary, executionSummaryPath);
  if (result.summary.helper_exit_status === "failed") {
    throw new Error("prepare execution helper exited non-zero");
  }
  if (result.summary.output_discovery_status === "incomplete") {
    throw new Error("prepare execution output discovery incomplete");
  }
  return result;
}

function readManifest(manifestPath) {
  const manifestReadPath = resolve(manifestPath);
  const manifestText = readFile(manifestReadPath, "prepare.manifest_path");
  const manifest = assertCodexFormerLocalAdapterManifest(
    parseJson(manifestText, "manifest file"),
  );
  return {
    manifest,
    manifestPath,
    manifestHash: hashCodexFormerLocalAdapterContent(manifestText),
  };
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error("unexpected positional argument");
    }
    const key = arg.slice(2);
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      throw new Error(`duplicate option: --${key}`);
    }
    if (booleanOptions.has(key)) {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        throw new Error(`option --${key} does not accept a value`);
      }
      options[key] = true;
      continue;
    }
    if (!valueRequiredOptions.has(key)) {
      throw new Error(`unknown option: --${key}`);
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--") || !hasText(next)) {
      throw new Error(`option --${key} requires a value`);
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function rejectModeSpecificOptions(options, modeSpecificOptions, modeLabel) {
  for (const optionName of modeSpecificOptions) {
    if (Object.prototype.hasOwnProperty.call(options, optionName)) {
      throw new Error(`option --${optionName} is not supported with ${modeLabel}`);
    }
  }
}

function readFile(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} file does not exist: ${path}`);
  }
  if (statSync(path).isDirectory()) {
    throw new Error(`${label} path must not be a directory`);
  }
  return readFileSync(path, "utf8");
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function writeTextFile(path, text) {
  ensureWritableFilePath(path, "output path");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function inspectOutDirShape(path, optionLabel) {
  if (existsSync(path) && !statSync(path).isDirectory()) {
    throw new Error(`option ${optionLabel} must not point to an existing file`);
  }
  if (existsSync(path) && readdirSync(path).length > 0) {
    throw new Error("prepare.out_dir must not be a non-empty directory");
  }
  return {
    existsAsFile: false,
    existsAsNonEmptyDirectory: false,
    createdByDryRun: false,
  };
}

function reserveHelperOutDirForExecution(path) {
  mkdirSync(path, { recursive: true });
  if (!statSync(path).isDirectory()) {
    throw new Error("prepare.out_dir must be a directory before helper execution");
  }
  if (readdirSync(path).length > 0) {
    throw new Error("prepare.out_dir must be empty before helper execution");
  }
}

function ensureWritableFilePath(path, optionLabel) {
  if (existsSync(path) && statSync(path).isDirectory()) {
    throw new Error(`option ${optionLabel} must not point to a directory`);
  }
}

function ensureDistinctPaths(entries) {
  const seen = new Map();
  for (const [optionLabel, path] of entries) {
    if (seen.has(path)) {
      throw new Error(
        `output paths must be distinct: ${seen.get(path)} and ${optionLabel}`,
      );
    }
    seen.set(path, optionLabel);
  }
}

function isInsideOrEqual(parentPath, childPath) {
  const relativePath = relative(parentPath, childPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !isAbsolute(relativePath))
  );
}

function runCaptureHelperPrepare(helperCommandArgv) {
  const child = spawnSync(helperCommandArgv[0], helperCommandArgv.slice(1), {
    encoding: "utf8",
    shell: false,
  });
  const stderrParts = [];
  if (child.stderr) stderrParts.push(child.stderr);
  if (child.error) {
    stderrParts.push(`spawn_error=${child.error.name}`);
  }
  return buildCodexFormerLocalAdapterPrepareHelperRunSummary({
    helperInvocationAttempted: true,
    helperExitCode: typeof child.status === "number" ? child.status : null,
    stdout: child.stdout ?? "",
    stderr: stderrParts.join("\n"),
    spawnErrorName: child.error?.name ?? null,
  });
}

function collectHelperOutputFiles(helperOutDirPath) {
  return {
    prompt: readOutputFileSnapshot(
      resolve(helperOutDirPath, helperOutputFileNames.prompt),
    ),
    returnEnvelopeTemplate: readOutputFileSnapshot(
      resolve(helperOutDirPath, helperOutputFileNames.returnEnvelopeTemplate),
    ),
    metadata: readOutputFileSnapshot(
      resolve(helperOutDirPath, helperOutputFileNames.metadata),
    ),
  };
}

function readOutputFileSnapshot(path) {
  if (!existsSync(path) || statSync(path).isDirectory()) {
    return null;
  }
  return {
    path,
    text: readFileSync(path, "utf8"),
    size_bytes: statSync(path).size,
  };
}

function parseBoundedLogLines(value) {
  if (!hasText(value)) return defaultBoundedLogLines;
  const parsed = Number(String(value));
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
    throw new Error("option --bounded-log-lines must be an integer from 1 to 200");
  }
  return parsed;
}

function readHelperAvailability() {
  const packageJsonPath = resolve("package.json");
  let packageScriptPresent = false;
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageScriptPresent = Boolean(
      packageJson?.scripts?.[captureHelperPackageScript],
    );
  } catch {
    packageScriptPresent = false;
  }
  const helperReadPath = resolve(captureHelperScriptPath);
  const scriptPresent = existsSync(helperReadPath);
  const scriptIsFile = scriptPresent && statSync(helperReadPath).isFile();
  return {
    packageScriptPresent,
    scriptPath: captureHelperScriptPath,
    scriptPresent,
    scriptIsFile,
  };
}

function printDryRunSummary(summary, prepareSummaryPath) {
  console.log(`mode=${summary.mode}`);
  console.log(`source_input_path=${summary.source_input_path}`);
  console.log(`preflight_summary_path=${summary.preflight_summary_path}`);
  if (prepareSummaryPath) {
    console.log(`prepare_summary_path=${prepareSummaryPath}`);
  }
  if (summary.manifest_hash) {
    console.log(`manifest_hash=${summary.manifest_hash}`);
  }
  console.log(`source_input_hash=${summary.source_input_hash}`);
  console.log(`preflight_status=${summary.preflight_status}`);
  console.log(`helper_out_dir=${summary.helper_out_dir}`);
  console.log(`helper_exit_status=${summary.helper_exit_status}`);
  console.log("authority_boundary=review-only local-only non-authorizing");
}

function printExecutionSummary(summary, executionSummaryPath) {
  console.log(`mode=${summary.mode}`);
  console.log(`source_input_path=${summary.source_input_path}`);
  console.log(`preflight_summary_path=${summary.preflight_summary_path}`);
  console.log(`dry_run_summary_path=${summary.dry_run_summary_path}`);
  if (executionSummaryPath) {
    console.log(`prepare_execution_summary_path=${executionSummaryPath}`);
  }
  if (summary.manifest_hash) {
    console.log(`manifest_hash=${summary.manifest_hash}`);
  }
  console.log(`source_input_hash=${summary.source_input_hash}`);
  console.log(`helper_out_dir=${summary.helper_out_dir}`);
  console.log(`helper_exit_status=${summary.helper_exit_status}`);
  console.log(`helper_exit_code=${summary.helper_exit_code}`);
  console.log(`output_discovery_status=${summary.output_discovery_status}`);
  console.log(`execution_result=${summary.execution_result}`);
  console.log("authority_boundary=review-only local-only non-authorizing");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runLocalAdapterPrepareOrchestrationCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
