import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";

const {
  assertCodexFormerLocalAdapterManifest,
  buildCodexFormerSourceInputFromLocalAdapterManifest,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
} = localAdapter;

const defaultSourceInputFileName = "codex-former-local-adapter-source-input.json";
const defaultMetadataFileName = "codex-former-local-adapter-metadata.json";

export function runLocalAdapterManifestToSourceInputCli(argv) {
  const options = parseOptions(argv);
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
  const sourceInputPath = options["source-input-out"]
    ? resolve(String(options["source-input-out"]))
    : resolve(outDir, defaultSourceInputFileName);
  const metadataPath = options["metadata-out"]
    ? resolve(String(options["metadata-out"]))
    : resolve(outDir, defaultMetadataFileName);
  const summaryPath = options["summary-out"]
    ? resolve(String(options["summary-out"]))
    : null;

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

function writeTextFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
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
