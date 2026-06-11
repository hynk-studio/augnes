import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
import prepareOrchestration from "../lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts";

const {
  assertCodexFormerLocalAdapterManifest,
  assertCodexFormerLocalAdapterSourceInput,
  hashCodexFormerLocalAdapterContent,
} = localAdapter;
const { buildCodexFormerLocalAdapterPrepareDryRunSummary } =
  prepareOrchestration;

const valueRequiredOptions = new Set([
  "source-input",
  "preflight-summary",
  "out-dir",
  "generated-at",
  "prepare-summary-out",
  "manifest",
  "expected-source-input-hash",
]);

const booleanOptions = new Set(["dry-run"]);

export function runLocalAdapterPrepareOrchestrationCli(argv) {
  const options = parseOptions(argv);
  if (options["dry-run"] !== true) {
    throw new Error("prepare orchestration currently supports --dry-run only");
  }
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
  ensureOutDirShape(helperOutDirPath, "--out-dir");

  const prepareSummaryPath = hasText(options["prepare-summary-out"])
    ? String(options["prepare-summary-out"])
    : null;
  const prepareSummaryWritePath = prepareSummaryPath
    ? resolve(prepareSummaryPath)
    : null;
  if (prepareSummaryWritePath) {
    ensureWritableFilePath(prepareSummaryWritePath, "--prepare-summary-out");
    ensureDistinctPaths([
      ["--source-input", sourceInputReadPath],
      ["--preflight-summary", preflightSummaryReadPath],
      ["--prepare-summary-out", prepareSummaryWritePath],
    ]);
  }

  const sourceInputText = readFile(sourceInputReadPath, "source input");
  const sourceInput = assertCodexFormerLocalAdapterSourceInput(
    parseJson(sourceInputText, "source input file"),
  );
  const sourceInputHash =
    hashCodexFormerLocalAdapterContent(sourceInputText);

  const preflightSummaryText = readFile(
    preflightSummaryReadPath,
    "preflight summary",
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
  });

  if (prepareSummaryWritePath) {
    writeTextFile(prepareSummaryWritePath, result.summaryJson);
  }

  printSummary(result.summary, prepareSummaryPath);
  return result;
}

function readManifest(manifestPath) {
  const manifestReadPath = resolve(manifestPath);
  const manifestText = readFile(manifestReadPath, "manifest");
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
        throw new Error("option --dry-run does not accept a value");
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

function ensureOutDirShape(path, optionLabel) {
  if (existsSync(path) && !statSync(path).isDirectory()) {
    throw new Error(`option ${optionLabel} must not point to an existing file`);
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

function printSummary(summary, prepareSummaryPath) {
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
