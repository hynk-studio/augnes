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
import surfaceSnapshots from "../lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";

const {
  assertCodexFormerLocalAdapterManifest,
  hashCodexFormerLocalAdapterContent,
  validateCodexFormerLocalAdapterSourceInput,
} = localAdapter;
const { buildCodexFormerLocalAdapterSurfaceSnapshots } = surfaceSnapshots;

const defaultSessionPanelFileName =
  "codex-former-local-adapter-session-panel-snapshot.json";
const defaultInboxItemFileName =
  "codex-former-local-adapter-inbox-item-snapshot.json";
const defaultSummaryFileName =
  "codex-former-local-adapter-snapshot-summary.json";

const valueRequiredOptions = new Set([
  "manifest",
  "out-dir",
  "source-input",
  "preflight-summary",
  "prepare-execution-summary",
  "generated-at",
  "session-panel-out",
  "inbox-item-out",
  "summary-out",
]);

export function runLocalAdapterSurfaceSnapshotsCli(argv) {
  const options = parseOptions(argv);
  if (!hasText(options.manifest)) {
    throw new Error("local adapter snapshots require --manifest <path>");
  }
  if (!hasText(options["out-dir"])) {
    throw new Error("local adapter snapshots require --out-dir <path>");
  }

  const manifestPath = String(options.manifest);
  const manifestReadPath = resolve(manifestPath);
  if (!existsSync(manifestReadPath)) {
    throw new Error(`manifest file does not exist: ${manifestReadPath}`);
  }
  const outDir = resolve(String(options["out-dir"]));
  ensureDirectoryPath(outDir, "--out-dir");

  const sessionPanelSnapshotPath = options["session-panel-out"]
    ? String(options["session-panel-out"])
    : resolve(outDir, defaultSessionPanelFileName);
  const inboxItemSnapshotPath = options["inbox-item-out"]
    ? String(options["inbox-item-out"])
    : resolve(outDir, defaultInboxItemFileName);
  const summaryPath = options["summary-out"]
    ? String(options["summary-out"])
    : resolve(outDir, defaultSummaryFileName);
  const sessionPanelSnapshotWritePath = resolve(sessionPanelSnapshotPath);
  const inboxItemSnapshotWritePath = resolve(inboxItemSnapshotPath);
  const summaryWritePath = resolve(summaryPath);
  ensureDistinctPaths([
    ["--session-panel-out", sessionPanelSnapshotWritePath],
    ["--inbox-item-out", inboxItemSnapshotWritePath],
    ["--summary-out", summaryWritePath],
  ]);
  ensureWritableFilePath(sessionPanelSnapshotWritePath, "--session-panel-out");
  ensureWritableFilePath(inboxItemSnapshotWritePath, "--inbox-item-out");
  ensureWritableFilePath(summaryWritePath, "--summary-out");

  const manifestText = readFile(manifestReadPath, "manifest");
  const manifest = assertCodexFormerLocalAdapterManifest(
    parseJson(manifestText, "manifest file"),
  );
  const manifestHash = hashCodexFormerLocalAdapterContent(manifestText);

  const sourceInputPayload = options["source-input"]
    ? readSourceInput(String(options["source-input"]))
    : {
        sourceInput: null,
        sourceInputPath: null,
        sourceInputHash: null,
      };
  const preflightPayload = options["preflight-summary"]
    ? readPreflightSummary(String(options["preflight-summary"]))
    : {
        preflightSummary: null,
        preflightSummaryPath: null,
        preflightSummaryHash: null,
      };
  const prepareExecutionPayload = options["prepare-execution-summary"]
    ? readPrepareExecutionSummary(String(options["prepare-execution-summary"]))
    : {
        prepareExecutionSummary: null,
        prepareExecutionSummaryPath: null,
        prepareExecutionSummaryHash: null,
      };

  const result = buildCodexFormerLocalAdapterSurfaceSnapshots({
    manifest,
    manifestPath,
    manifestHash,
    sessionPanelSnapshotPath,
    inboxItemSnapshotPath,
    sourceInput: sourceInputPayload.sourceInput,
    sourceInputPath: sourceInputPayload.sourceInputPath,
    sourceInputHash: sourceInputPayload.sourceInputHash,
    preflightSummary: preflightPayload.preflightSummary,
    preflightSummaryPath: preflightPayload.preflightSummaryPath,
    preflightSummaryHash: preflightPayload.preflightSummaryHash,
    prepareExecutionSummary: prepareExecutionPayload.prepareExecutionSummary,
    prepareExecutionSummaryPath:
      prepareExecutionPayload.prepareExecutionSummaryPath,
    prepareExecutionSummaryHash:
      prepareExecutionPayload.prepareExecutionSummaryHash,
    generatedAtOverride: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : null,
  });

  writeTextFile(sessionPanelSnapshotWritePath, result.sessionPanelSnapshotJson);
  writeTextFile(inboxItemSnapshotWritePath, result.inboxItemSnapshotJson);
  writeTextFile(summaryWritePath, result.snapshotSummaryJson);

  const summary = {
    mode: "local-adapter-surface-snapshots",
    session_panel_snapshot_path: sessionPanelSnapshotPath,
    inbox_item_snapshot_path: inboxItemSnapshotPath,
    summary_path: summaryPath,
    snapshot_state: result.snapshotState,
    manifest_hash: result.snapshotSummary.manifest_hash,
    source_input_hash: result.snapshotSummary.source_input_hash ?? "none",
    prepare_execution_summary_hash:
      result.snapshotSummary.prepare_execution_summary_hash ?? "none",
    authority_boundary: "review-only local-only non-authorizing",
  };
  printSummary(summary);
  return result;
}

function readSourceInput(sourceInputPath) {
  const sourceInputReadPath = resolve(sourceInputPath);
  const sourceInputText = readFile(sourceInputReadPath, "source input");
  const sourceInput = parseJson(sourceInputText, "source input file");
  const validation = validateCodexFormerLocalAdapterSourceInput(sourceInput);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
  return {
    sourceInput,
    sourceInputPath,
    sourceInputHash: hashCodexFormerLocalAdapterContent(sourceInputText),
  };
}

function readPreflightSummary(preflightSummaryPath) {
  const preflightSummaryReadPath = resolve(preflightSummaryPath);
  const preflightSummaryText = readFile(
    preflightSummaryReadPath,
    "preflight summary",
  );
  return {
    preflightSummary: parseJson(
      preflightSummaryText,
      "preflight summary file",
    ),
    preflightSummaryPath,
    preflightSummaryHash:
      hashCodexFormerLocalAdapterContent(preflightSummaryText),
  };
}

function readPrepareExecutionSummary(prepareExecutionSummaryPath) {
  const prepareExecutionSummaryReadPath = resolve(prepareExecutionSummaryPath);
  const prepareExecutionSummaryText = readFile(
    prepareExecutionSummaryReadPath,
    "prepare execution summary",
  );
  return {
    prepareExecutionSummary: parseJson(
      prepareExecutionSummaryText,
      "prepare execution summary file",
    ),
    prepareExecutionSummaryPath,
    prepareExecutionSummaryHash:
      hashCodexFormerLocalAdapterContent(prepareExecutionSummaryText),
  };
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

function printSummary(summary) {
  console.log(`mode=${summary.mode}`);
  console.log(
    `session_panel_snapshot_path=${summary.session_panel_snapshot_path}`,
  );
  console.log(`inbox_item_snapshot_path=${summary.inbox_item_snapshot_path}`);
  console.log(`summary_path=${summary.summary_path}`);
  console.log(`snapshot_state=${summary.snapshot_state}`);
  console.log(`manifest_hash=${summary.manifest_hash}`);
  console.log(`source_input_hash=${summary.source_input_hash}`);
  console.log(
    `prepare_execution_summary_hash=${summary.prepare_execution_summary_hash}`,
  );
  console.log(`authority_boundary=${summary.authority_boundary}`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runLocalAdapterSurfaceSnapshotsCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
