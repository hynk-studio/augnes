import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
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
  buildCodexFormerLocalAdapterPrepareExecutionSummary,
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
  const helperExitStatus = helperRun.exitCode === 0 ? "success" : "failed";
  const outputDiscovery = discoverHelperOutputs({
    helperExitStatus,
    helperOutDirPath,
    sourceInputHash,
    generatedAt: context.generatedAt,
  });
  const result = buildCodexFormerLocalAdapterPrepareExecutionSummary({
    context,
    helperExitStatus,
    helperExitCode: helperRun.exitCode,
    helperStdoutSummary: buildBoundedLogSummary(helperRun.stdout, {
      maxLines: boundedLogLines,
      maxChars: defaultBoundedLogChars,
    }),
    helperStderrSummary: buildBoundedLogSummary(helperRun.stderr, {
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
  return {
    exitCode: typeof child.status === "number" ? child.status : null,
    stdout: child.stdout ?? "",
    stderr: stderrParts.join("\n"),
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

function buildBoundedLogSummary(text, { maxLines, maxChars }) {
  const rawText = typeof text === "string" ? text : "";
  const rawLines = rawText.length > 0 ? rawText.split(/\r?\n/) : [];
  if (rawLines.at(-1) === "") rawLines.pop();
  const lines = [];
  let charCount = 0;
  let truncated = false;
  let unsafeMarkerOmitted = false;

  for (const line of rawLines) {
    if (containsUnsafeMarkerCategory(line)) {
      unsafeMarkerOmitted = true;
      truncated = true;
      continue;
    }
    if (lines.length >= maxLines) {
      truncated = true;
      continue;
    }
    const remainingChars = maxChars - charCount;
    if (remainingChars <= 0) {
      truncated = true;
      continue;
    }
    if (line.length > remainingChars) {
      lines.push(`${line.slice(0, Math.max(0, remainingChars - 12))}[truncated]`);
      charCount = maxChars;
      truncated = true;
      continue;
    }
    lines.push(line);
    charCount += line.length;
  }

  return {
    line_count: rawLines.length,
    included_line_count: lines.length,
    truncated,
    omitted_line_count: rawLines.length - lines.length,
    unsafe_marker_omitted: unsafeMarkerOmitted,
    max_lines: maxLines,
    max_chars: maxChars,
    lines,
  };
}

function discoverHelperOutputs({
  helperExitStatus,
  helperOutDirPath,
  sourceInputHash,
  generatedAt,
}) {
  const paths = emptyOutputPaths();
  const refs = {
    manual_copy_packet_ref: null,
    former_input_packet_ref: null,
  };
  const hashes = emptyOutputHashes();
  const sizes = emptyOutputSizes();
  const caveats = [];
  const knownMetadataPath = resolve(helperOutDirPath, helperOutputFileNames.metadata);
  const knownPromptPath = resolve(helperOutDirPath, helperOutputFileNames.prompt);
  const knownReturnEnvelopePath = resolve(
    helperOutDirPath,
    helperOutputFileNames.returnEnvelopeTemplate,
  );
  const metadataInfo = readJsonFileInfoIfPresent(knownMetadataPath);
  const metadata = metadataInfo.value;

  const promptCandidatePath =
    stringOrNull(metadata?.output_paths?.copyable_prompt_path) ?? knownPromptPath;
  const returnEnvelopeCandidatePath =
    stringOrNull(metadata?.output_paths?.capture_return_envelope_template_path) ??
    knownReturnEnvelopePath;
  const metadataCandidatePath =
    stringOrNull(metadata?.output_paths?.metadata_path) ?? knownMetadataPath;

  const promptInfo = readFileInfoIfPresent(promptCandidatePath);
  const returnEnvelopeInfo = readFileInfoIfPresent(returnEnvelopeCandidatePath);
  const helperMetadataInfo = readFileInfoIfPresent(metadataCandidatePath);

  if (promptInfo) {
    paths.prompt_path = promptCandidatePath;
    hashes.prompt_hash = promptInfo.hash;
    sizes.prompt_size_bytes = promptInfo.sizeBytes;
  } else {
    caveats.push("copyable prompt output was missing");
  }
  if (returnEnvelopeInfo) {
    paths.return_envelope_template_path = returnEnvelopeCandidatePath;
    hashes.return_envelope_template_hash = returnEnvelopeInfo.hash;
    sizes.return_envelope_template_size_bytes = returnEnvelopeInfo.sizeBytes;
  } else {
    caveats.push("return envelope template output was missing");
  }
  if (helperMetadataInfo) {
    paths.helper_metadata_path = metadataCandidatePath;
    hashes.helper_metadata_hash = helperMetadataInfo.hash;
    sizes.helper_metadata_size_bytes = helperMetadataInfo.sizeBytes;
  } else {
    caveats.push("helper metadata output was missing");
  }

  if (!metadata) {
    caveats.push("helper metadata could not be parsed");
  } else {
    refs.manual_copy_packet_ref = boundedSafeRef(
      metadata.source_manual_copy_packet_id,
      "source_manual_copy_packet_id",
      caveats,
    );
    refs.former_input_packet_ref = boundedSafeRef(
      metadata.source_former_input_packet_id,
      "source_former_input_packet_id",
      caveats,
    );
    if (metadata.source_input_hash !== sourceInputHash) {
      caveats.push("helper metadata source_input_hash did not match source input bytes");
    }
    if (metadata.generated_at !== generatedAt) {
      caveats.push("helper metadata generated_at did not match execution generated_at");
    }
    if (metadata.capture_source_kind !== "bounded_source_input_file") {
      caveats.push("helper metadata capture_source_kind was not bounded_source_input_file");
    }
    if (!hasText(metadata.source_prompt_hash)) {
      caveats.push("helper metadata source_prompt_hash was missing");
    }
    if (!isNonAuthorizingHelperMetadata(metadata.authority_boundary)) {
      caveats.push("helper metadata authority_boundary was missing or not non-authorizing");
    }
  }

  const complete =
    helperExitStatus === "success" &&
    Boolean(
      metadata &&
        paths.prompt_path &&
        paths.return_envelope_template_path &&
        paths.helper_metadata_path &&
        hashes.prompt_hash &&
        hashes.return_envelope_template_hash &&
        hashes.helper_metadata_hash &&
        refs.manual_copy_packet_ref &&
        refs.former_input_packet_ref,
    ) &&
    caveats.length === 0;

  return {
    status: helperExitStatus === "failed" ? "failed" : complete ? "complete" : "incomplete",
    paths,
    refs,
    hashes,
    sizes,
    caveats,
  };
}

function readJsonFileInfoIfPresent(path) {
  const info = readFileInfoIfPresent(path);
  if (!info) return { value: null, info: null };
  try {
    return {
      value: JSON.parse(info.text),
      info,
    };
  } catch {
    return {
      value: null,
      info,
    };
  }
}

function readFileInfoIfPresent(path) {
  if (!hasText(path) || !existsSync(path) || statSync(path).isDirectory()) {
    return null;
  }
  const text = readFileSync(path, "utf8");
  return {
    text,
    hash: hashCodexFormerLocalAdapterContent(text),
    sizeBytes: statSync(path).size,
  };
}

function emptyOutputPaths() {
  return {
    manual_copy_packet_path: null,
    former_input_packet_path: null,
    prompt_path: null,
    return_envelope_template_path: null,
    helper_metadata_path: null,
  };
}

function emptyOutputHashes() {
  return {
    manual_copy_packet_hash: null,
    former_input_packet_hash: null,
    prompt_hash: null,
    return_envelope_template_hash: null,
    helper_metadata_hash: null,
  };
}

function emptyOutputSizes() {
  return {
    manual_copy_packet_size_bytes: null,
    former_input_packet_size_bytes: null,
    prompt_size_bytes: null,
    return_envelope_template_size_bytes: null,
    helper_metadata_size_bytes: null,
  };
}

function boundedSafeRef(value, label, caveats) {
  if (!hasText(value)) {
    caveats.push(`helper metadata ${label} was missing`);
    return null;
  }
  if (containsUnsafeMarkerCategory(value)) {
    caveats.push(`helper metadata ${label} contained an unsafe marker category`);
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed.length > 240) {
    caveats.push(`helper metadata ${label} was bounded to 240 characters`);
    return trimmed.slice(0, 240);
  }
  return trimmed;
}

function isNonAuthorizingHelperMetadata(authorityBoundary) {
  return (
    authorityBoundary &&
    authorityBoundary.output_is_draft_review_material_only === true &&
    authorityBoundary.accepted_augnes_state === false &&
    authorityBoundary.proof_evidence_readiness_records === false &&
    authorityBoundary.provider_model_api_calls === false &&
    authorityBoundary.codex_sdk_calls === false &&
    authorityBoundary.codex_execution === false &&
    authorityBoundary.db_writes === false &&
    authorityBoundary.runtime_routes === false &&
    authorityBoundary.ui === false &&
    authorityBoundary.clipboard_automation === false &&
    authorityBoundary.github_mutation === false &&
    authorityBoundary.approval_merge_publish_core_decision === false
  );
}

function stringOrNull(value) {
  return hasText(value) ? String(value) : null;
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
  console.log("authority_boundary=review-only local-only non-authorizing");
}

function containsUnsafeMarkerCategory(value) {
  const lowered = String(value ?? "").toLowerCase();
  const exactMarkers = [
    ["private", "payload"].join("_"),
    ["provider", "payload"].join("_"),
    ["raw", "source", "payload"].join("_"),
    ["raw", "candidate", "payload"].join("_"),
    ["raw", "private", "payload"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["oauth", "token"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["hidden", "reasoning"].join("_"),
  ];
  const prefixMarkers = [
    ["sk", "proj"].join("-") + "-",
    ["gh", "p_"].join(""),
  ];
  const phraseMarkers = [
    "raw diff",
    "raw diffs",
    "raw pr diff",
    "raw review payload",
    "raw page dump",
    "provider log",
    "provider logs",
    "hidden reasoning",
    "account data",
    "raw screenshot",
    "raw screenshots",
    "screenshot payload",
    "screenshots included",
    "screenshot included",
    "unrelated private",
    "private payload",
    "provider payload",
    "raw source payload",
    "raw candidate payload",
    "raw private payload",
  ];
  const tokenBoundaryMarkers = ["cookie", "cookies", "token", "tokens", "secret", "secrets"];
  return (
    exactMarkers.some((marker) => includesExactMarker(lowered, marker)) ||
    prefixMarkers.some((marker) => lowered.includes(marker)) ||
    phraseMarkers.some((marker) => lowered.includes(marker)) ||
    tokenBoundaryMarkers.some((marker) => includesWordBoundaryMarker(lowered, marker))
  );
}

function includesExactMarker(value, marker) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, "i").test(
    value,
  );
}

function includesWordBoundaryMarker(value, marker) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`\\b${escaped}\\b`, "i").test(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
