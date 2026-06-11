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

const {
  assertCodexFormerLocalAdapterManifest,
  buildCodexFormerLocalAdapterSourceInputPreflightSummary,
  buildCodexFormerSourceInputFromLocalAdapterManifest,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
  validateCodexFormerLocalAdapterSourceInput,
} = localAdapter;

const defaultSourceInputFileName = "codex-former-local-adapter-source-input.json";
const defaultMetadataFileName = "codex-former-local-adapter-metadata.json";
const valueRequiredOptions = new Set([
  "manifest",
  "out-dir",
  "generated-at",
  "source-input-out",
  "metadata-out",
  "summary-out",
  "preflight-source-input",
]);
const preflightIncompatibleOptions = [
  "manifest",
  "out-dir",
  "generated-at",
  "source-input-out",
  "metadata-out",
];

export function runLocalAdapterManifestToSourceInputCli(argv) {
  const options = parseOptions(argv);
  if (hasText(options["preflight-source-input"])) {
    return runSourceInputPreflight(options);
  }
  if (!hasText(options.manifest)) {
    throw new Error("local adapter requires --manifest <path>");
  }
  if (!hasText(options["out-dir"])) {
    throw new Error("local adapter requires --out-dir <path>");
  }

  const manifestPath = resolve(String(options.manifest));
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest file does not exist: ${manifestPath}`);
  }
  const outDir = resolve(String(options["out-dir"]));
  ensureDirectoryPath(outDir, "--out-dir");
  const sourceInputPath = options["source-input-out"]
    ? resolve(String(options["source-input-out"]))
    : resolve(outDir, defaultSourceInputFileName);
  const metadataPath = options["metadata-out"]
    ? resolve(String(options["metadata-out"]))
    : resolve(outDir, defaultMetadataFileName);
  const summaryPath = options["summary-out"]
    ? resolve(String(options["summary-out"]))
    : null;
  ensureDistinctPaths([
    ["--source-input-out", sourceInputPath],
    ["--metadata-out", metadataPath],
    ...(summaryPath ? [["--summary-out", summaryPath]] : []),
  ]);
  ensureWritableFilePath(sourceInputPath, "--source-input-out");
  ensureWritableFilePath(metadataPath, "--metadata-out");
  if (summaryPath) ensureWritableFilePath(summaryPath, "--summary-out");

  const manifestText = readFileSync(manifestPath, "utf8");
  let parsedManifest;
  try {
    parsedManifest = JSON.parse(manifestText);
  } catch (error) {
    throw new Error(`manifest file is not valid JSON: ${error}`);
  }
  const manifest = assertCodexFormerLocalAdapterManifest(parsedManifest);
  const manifestHash = hashCodexFormerLocalAdapterContent(manifestText);
  const result = buildCodexFormerSourceInputFromLocalAdapterManifest({
    manifest,
    manifestHash,
    manifestPath,
    sourceInputPath,
    generatedAtOverride: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : null,
  });

  writeTextFile(sourceInputPath, result.sourceInputJson);
  writeTextFile(metadataPath, result.metadataJson);

  const summary = {
    mode: "manifest-to-source-input",
    source_input_path: sourceInputPath,
    metadata_path: metadataPath,
    manifest_hash: result.metadata.manifest_hash,
    source_input_hash: result.metadata.source_input_hash,
    work_id: result.sourceInput.work_id,
    readiness_status: result.sourceInput.readiness.status,
    authority_boundary: "review-only local-only non-authorizing",
  };
  if (summaryPath) {
    writeTextFile(summaryPath, stableStringifyCodexFormerLocalAdapterJson(summary));
  }

  printSummary(summary, summaryPath);
  return result;
}

function runSourceInputPreflight(options) {
  for (const optionName of preflightIncompatibleOptions) {
    if (hasText(options[optionName])) {
      throw new Error(
        `option --${optionName} cannot be used with --preflight-source-input`,
      );
    }
  }
  const sourceInputPath = resolve(String(options["preflight-source-input"]));
  if (!existsSync(sourceInputPath)) {
    throw new Error(`source input file does not exist: ${sourceInputPath}`);
  }
  const summaryPath = options["summary-out"]
    ? resolve(String(options["summary-out"]))
    : null;
  if (summaryPath) {
    ensureWritableFilePath(summaryPath, "--summary-out");
    ensureDistinctPaths([
      ["--preflight-source-input", sourceInputPath],
      ["--summary-out", summaryPath],
    ]);
  }

  const sourceInputText = readFileSync(sourceInputPath, "utf8");
  const sourceInputHash = hashCodexFormerLocalAdapterContent(sourceInputText);
  let parsedSourceInput;
  let errors = [];
  try {
    parsedSourceInput = JSON.parse(sourceInputText);
  } catch {
    errors = ["source input file is not valid JSON"];
  }
  if (errors.length === 0) {
    const validation = validateCodexFormerLocalAdapterSourceInput(
      parsedSourceInput,
    );
    errors = validation.errors;
  }

  const summary = buildCodexFormerLocalAdapterSourceInputPreflightSummary({
    sourceInput: parsedSourceInput,
    sourceInputPath,
    sourceInputHash,
    errors,
  });
  if (summaryPath) {
    writeTextFile(
      summaryPath,
      stableStringifyCodexFormerLocalAdapterJson(summary),
    );
  }
  printPreflightSummary(summary, summaryPath);
  if (summary.status !== "passed") {
    throw new Error(summary.errors.join("; "));
  }
  return summary;
}

function writeTextFile(path, text) {
  ensureWritableFilePath(path, "output path");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error("unexpected positional argument");
    }
    const key = arg.slice(2);
    if (!valueRequiredOptions.has(key)) {
      throw new Error(`unknown option: --${key}`);
    }
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      throw new Error(`duplicate option: --${key}`);
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

function ensureDirectoryPath(path, optionLabel) {
  if (existsSync(path) && !statSync(path).isDirectory()) {
    throw new Error(`option ${optionLabel} must point to a directory`);
  }
  mkdirSync(path, { recursive: true });
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

function printSummary(summary, summaryPath) {
  console.log(`mode=${summary.mode}`);
  console.log(`source_input_path=${summary.source_input_path}`);
  console.log(`metadata_path=${summary.metadata_path}`);
  if (summaryPath) {
    console.log(`summary_path=${summaryPath}`);
  }
  console.log(`manifest_hash=${summary.manifest_hash}`);
  console.log(`source_input_hash=${summary.source_input_hash}`);
  console.log(`work_id=${summary.work_id}`);
  console.log(`readiness_status=${summary.readiness_status}`);
  console.log(`authority_boundary=${summary.authority_boundary}`);
}

function printPreflightSummary(summary, summaryPath) {
  console.log(`mode=${summary.mode}`);
  console.log(`source_input_path=${summary.source_input_path}`);
  if (summaryPath) {
    console.log(`summary_path=${summaryPath}`);
  }
  console.log(`source_input_hash=${summary.source_input_hash}`);
  console.log(`preflight_status=${summary.status}`);
  console.log("authority_boundary=review-only local-only non-authorizing");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runLocalAdapterManifestToSourceInputCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
