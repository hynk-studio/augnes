import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import surfaceIntegration from "../lib/perspective-ingest/codex-former-local-adapter-snapshot-surface-integration.ts";

const {
  buildLocalAdapterSnapshotSurfaceIntegration,
  hashLocalAdapterSurfaceIntegrationContent,
} = surfaceIntegration;

const defaultSessionViewModelsFileName =
  "codex-former-local-adapter-session-panel-surface-view-models.json";
const defaultInboxViewModelsFileName =
  "codex-former-local-adapter-inbox-surface-view-models.json";
const defaultReadinessFileName =
  "codex-former-local-adapter-snapshot-surface-integration-readiness.json";

const valueRequiredOptions = new Set([
  "session-not-ready",
  "session-waiting",
  "session-prepared",
  "inbox-not-ready",
  "inbox-waiting",
  "inbox-prepared",
  "out-dir",
  "generated-at",
  "session-view-models-out",
  "inbox-view-models-out",
  "readiness-out",
]);

export function runLocalAdapterSnapshotSurfaceIntegrationCli(argv) {
  const options = parseOptions(argv);
  for (const optionName of [
    "session-not-ready",
    "session-waiting",
    "session-prepared",
    "inbox-not-ready",
    "inbox-waiting",
    "inbox-prepared",
    "out-dir",
  ]) {
    if (!hasText(options[optionName])) {
      throw new Error(
        `local adapter snapshot surface integration requires --${optionName} <path>`,
      );
    }
  }

  const outDir = resolve(String(options["out-dir"]));
  ensureDirectoryPath(outDir, "--out-dir");
  const sessionViewModelsPath = options["session-view-models-out"]
    ? String(options["session-view-models-out"])
    : resolve(outDir, defaultSessionViewModelsFileName);
  const inboxViewModelsPath = options["inbox-view-models-out"]
    ? String(options["inbox-view-models-out"])
    : resolve(outDir, defaultInboxViewModelsFileName);
  const readinessPath = options["readiness-out"]
    ? String(options["readiness-out"])
    : resolve(outDir, defaultReadinessFileName);
  const sessionViewModelsWritePath = resolve(sessionViewModelsPath);
  const inboxViewModelsWritePath = resolve(inboxViewModelsPath);
  const readinessWritePath = resolve(readinessPath);

  ensureDistinctPaths([
    ["--session-view-models-out", sessionViewModelsWritePath],
    ["--inbox-view-models-out", inboxViewModelsWritePath],
    ["--readiness-out", readinessWritePath],
  ]);
  for (const [label, path] of [
    ["--session-view-models-out", sessionViewModelsWritePath],
    ["--inbox-view-models-out", inboxViewModelsWritePath],
    ["--readiness-out", readinessWritePath],
  ]) {
    ensureWritableFilePath(path, label);
  }

  const input = {
    generatedAt: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : "2026-06-11T00:00:00.000Z",
    sessionViewModelsPath,
    inboxViewModelsPath,
    readinessPath,
    sessionSnapshots: {
      notReady: readSnapshotSource(
        String(options["session-not-ready"]),
        "session not_ready snapshot",
      ),
      waiting: readSnapshotSource(
        String(options["session-waiting"]),
        "session waiting snapshot",
      ),
      prepared: readSnapshotSource(
        String(options["session-prepared"]),
        "session prepared snapshot",
      ),
    },
    inboxSnapshots: {
      notReady: readSnapshotSource(
        String(options["inbox-not-ready"]),
        "inbox not_ready snapshot",
      ),
      waiting: readSnapshotSource(
        String(options["inbox-waiting"]),
        "inbox waiting snapshot",
      ),
      prepared: readSnapshotSource(
        String(options["inbox-prepared"]),
        "inbox prepared snapshot",
      ),
    },
  };

  const result = buildLocalAdapterSnapshotSurfaceIntegration(input);
  writeTextFile(sessionViewModelsWritePath, result.sessionViewModelsJson);
  writeTextFile(inboxViewModelsWritePath, result.inboxViewModelsJson);
  writeTextFile(readinessWritePath, result.readinessJson);

  printSummary({
    mode: "local-adapter-snapshot-surface-integration",
    session_view_models_path: sessionViewModelsPath,
    inbox_view_models_path: inboxViewModelsPath,
    readiness_path: readinessPath,
    readiness_status: result.readiness.status,
    default_session_scenario_id: result.sessionViewModels.default_scenario_id,
    default_selected_item_id: result.inboxViewModels.default_selected_item_id,
    authority_boundary: "read-only local-only non-authorizing",
  });
  return result;
}

function readSnapshotSource(path, label) {
  const readPath = resolve(path);
  const text = readFile(readPath, label);
  return {
    path,
    hash: hashLocalAdapterSurfaceIntegrationContent(text),
    snapshot: parseJson(text, `${label} file`),
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
  console.log(`session_view_models_path=${summary.session_view_models_path}`);
  console.log(`inbox_view_models_path=${summary.inbox_view_models_path}`);
  console.log(`readiness_path=${summary.readiness_path}`);
  console.log(`readiness_status=${summary.readiness_status}`);
  console.log(`default_session_scenario_id=${summary.default_session_scenario_id}`);
  console.log(`default_selected_item_id=${summary.default_selected_item_id}`);
  console.log(`authority_boundary=${summary.authority_boundary}`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runLocalAdapterSnapshotSurfaceIntegrationCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
