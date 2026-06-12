import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import validateResultSnapshots from "../lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots.ts";

const {
  buildCodexFormerLocalAdapterValidateResultSnapshots,
  hashCodexFormerLocalAdapterValidateResultSnapshotContent,
} = validateResultSnapshots;

const defaultOutputFileNames = {
  sessionPass:
    "2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json",
  sessionPassWithFollowUp:
    "2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json",
  sessionBlocked:
    "2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json",
  inboxPass:
    "2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json",
  inboxPassWithFollowUp:
    "2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json",
  inboxBlocked:
    "2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json",
  snapshotSummary:
    "2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json",
};

const optionToOutputKey = {
  "session-pass-out": "sessionPass",
  "session-pass-with-follow-up-out": "sessionPassWithFollowUp",
  "session-blocked-out": "sessionBlocked",
  "inbox-pass-out": "inboxPass",
  "inbox-pass-with-follow-up-out": "inboxPassWithFollowUp",
  "inbox-blocked-out": "inboxBlocked",
  "summary-out": "snapshotSummary",
};

const valueRequiredOptions = new Set([
  "pass-summary",
  "pass-with-follow-up-summary",
  "blocked-summary",
  "out-dir",
  "generated-at",
  ...Object.keys(optionToOutputKey),
]);

export function runLocalAdapterValidateResultSnapshotsCli(argv) {
  const options = parseOptions(argv);
  for (const optionName of [
    "pass-summary",
    "pass-with-follow-up-summary",
    "blocked-summary",
    "out-dir",
  ]) {
    if (!hasText(options[optionName])) {
      throw new Error(
        `validate result snapshots require --${optionName} <path>`,
      );
    }
  }

  const outDir = resolve(String(options["out-dir"]));
  ensureDirectoryPath(outDir, "--out-dir");
  const outputPaths = buildOutputPaths(options, outDir);
  const writePaths = Object.fromEntries(
    Object.entries(outputPaths).map(([key, value]) => [key, resolve(value)]),
  );
  ensureDistinctPaths(Object.entries(writePaths));
  for (const [key, path] of Object.entries(writePaths)) {
    ensureWritableFilePath(path, key);
  }

  const input = {
    generatedAt: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : new Date().toISOString(),
    passSummary: readSummary(String(options["pass-summary"]), "PASS summary"),
    passWithFollowUpSummary: readSummary(
      String(options["pass-with-follow-up-summary"]),
      "PASS with follow-up summary",
    ),
    blockedSummary: readSummary(
      String(options["blocked-summary"]),
      "BLOCKED summary",
    ),
    outputPaths,
  };

  const result = buildCodexFormerLocalAdapterValidateResultSnapshots(input);
  writeTextFile(writePaths.sessionPass, result.json.sessionPass);
  writeTextFile(
    writePaths.sessionPassWithFollowUp,
    result.json.sessionPassWithFollowUp,
  );
  writeTextFile(writePaths.sessionBlocked, result.json.sessionBlocked);
  writeTextFile(writePaths.inboxPass, result.json.inboxPass);
  writeTextFile(
    writePaths.inboxPassWithFollowUp,
    result.json.inboxPassWithFollowUp,
  );
  writeTextFile(writePaths.inboxBlocked, result.json.inboxBlocked);
  writeTextFile(writePaths.snapshotSummary, result.json.snapshotSummary);

  printSummary({
    mode: result.snapshotSummary.mode,
    session_panel_snapshot_count: 3,
    inbox_item_count: 3,
    snapshot_summary_path: outputPaths.snapshotSummary,
    covered_result_states:
      result.snapshotSummary.covered_result_states.join(","),
    authority_boundary: "review-only local-only non-authorizing",
  });
  return result;
}

function buildOutputPaths(options, outDir) {
  const outputPaths = {};
  for (const [key, fileName] of Object.entries(defaultOutputFileNames)) {
    outputPaths[key] = resolve(outDir, fileName);
  }
  for (const [optionName, key] of Object.entries(optionToOutputKey)) {
    if (hasText(options[optionName])) {
      outputPaths[key] = String(options[optionName]);
    }
  }
  return outputPaths;
}

function readSummary(path, label) {
  const readPath = resolve(path);
  const text = readLocalFile(readPath, label);
  return {
    path,
    hash: hashCodexFormerLocalAdapterValidateResultSnapshotContent(text),
    summary: parseJson(text, `${label} file`),
  };
}

function readLocalFile(path, label) {
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
  for (const [key, path] of entries) {
    if (seen.has(path)) {
      throw new Error(
        `output paths must be distinct: ${seen.get(path)} and ${key}`,
      );
    }
    seen.set(path, key);
  }
}

function printSummary(summary) {
  console.log(`mode=${summary.mode}`);
  console.log(`session_panel_snapshot_count=${summary.session_panel_snapshot_count}`);
  console.log(`inbox_item_count=${summary.inbox_item_count}`);
  console.log(`snapshot_summary_path=${summary.snapshot_summary_path}`);
  console.log(`covered_result_states=${summary.covered_result_states}`);
  console.log(`authority_boundary=${summary.authority_boundary}`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runLocalAdapterValidateResultSnapshotsCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
