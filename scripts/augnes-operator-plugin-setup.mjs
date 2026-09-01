#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REVIEWED_OPERATOR_PLUGIN_VERSION = "0.5.0";
const MARKETPLACE_NAME = "augnes-local";
const PLUGIN_ID = `augnes-operator@${MARKETPLACE_NAME}`;
const REVIEWED_SKILLS = Object.freeze([
  "augnes-autonomy-contract",
  "augnes-closeout-proof",
  "augnes-codex-surface-ops",
  "augnes-guidebrief-handoff",
  "augnes-live-repository-continuity",
  "augnes-read-brief",
  "augnes-record-evidence",
]);
const REVIEWED_FILES = Object.freeze([
  ".codex-plugin/plugin.json",
  ".mcp.json",
  "mcp/companion-proxy.mjs",
  "mcp/companion-service-core.mjs",
  "skills/augnes-autonomy-contract/SKILL.md",
  "skills/augnes-closeout-proof/SKILL.md",
  "skills/augnes-codex-surface-ops/SKILL.md",
  "skills/augnes-guidebrief-handoff/SKILL.md",
  "skills/augnes-live-repository-continuity/SKILL.md",
  "skills/augnes-read-brief/SKILL.md",
  "skills/augnes-record-evidence/SKILL.md",
]);
const repositoryRoot = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
);

export function verifyOperatorPluginCache({
  cacheRoot,
  installedPath,
  sourceRoot = path.join(repositoryRoot, "plugins", "augnes-operator"),
} = {}) {
  const expectedRoot = path.join(
    cacheRoot,
    MARKETPLACE_NAME,
    "augnes-operator",
  );
  const expectedInstalledPath = path.join(
    expectedRoot,
    REVIEWED_OPERATOR_PLUGIN_VERSION,
  );
  if (
    realpathSync(installedPath) !== realpathSync(expectedInstalledPath) ||
    realpathSync(sourceRoot) === realpathSync(installedPath)
  ) {
    throw setupError("operator_plugin_cache_path_invalid");
  }
  const cachedVersions = readdirSync(expectedRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(cachedVersions) !== JSON.stringify([REVIEWED_OPERATOR_PLUGIN_VERSION])) {
    throw setupError("operator_plugin_stale_cache_present");
  }
  assertNoDefaultHookConfig(sourceRoot);
  assertNoDefaultHookConfig(expectedInstalledPath);
  assertReviewedSkillInventory(sourceRoot);
  assertReviewedSkillInventory(expectedInstalledPath);
  for (const relativePath of REVIEWED_FILES) {
    const source = safeRegularFile(sourceRoot, relativePath);
    const cached = safeRegularFile(expectedInstalledPath, relativePath);
    if (fileHash(source) !== fileHash(cached)) {
      throw setupError("operator_plugin_cache_content_mismatch");
    }
  }
  const manifest = JSON.parse(readFileSync(
    path.join(expectedInstalledPath, ".codex-plugin", "plugin.json"),
    "utf8",
  ));
  if (
    manifest.version !== REVIEWED_OPERATOR_PLUGIN_VERSION ||
    Object.hasOwn(manifest, "hooks") ||
    !manifest.interface?.defaultPrompt?.includes("augnes_companion_lifecycle_status") ||
    !manifest.interface?.defaultPrompt?.includes("augnes_start_companion_service") ||
    !manifest.interface?.defaultPrompt?.includes("augnes_resume_repository")
  ) {
    throw setupError("operator_plugin_cache_manifest_invalid");
  }
  return {
    plugin_id: PLUGIN_ID,
    version: REVIEWED_OPERATOR_PLUGIN_VERSION,
    cache_locator:
      `${MARKETPLACE_NAME}/augnes-operator/${REVIEWED_OPERATOR_PLUGIN_VERSION}`,
    reviewed_files_verified: REVIEWED_FILES.length,
    stale_cache_versions: 0,
  };
}

function assertNoDefaultHookConfig(root) {
  if (existsSync(path.join(root, "hooks", "hooks.json"))) {
    throw setupError("operator_plugin_default_hooks_present");
  }
}

function assertReviewedSkillInventory(root) {
  const skillRoot = path.join(root, "skills");
  const actual = readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) =>
      entry.isDirectory() &&
      !entry.isSymbolicLink() &&
      existsSync(path.join(skillRoot, entry.name, "SKILL.md")),
    )
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(actual) !== JSON.stringify(REVIEWED_SKILLS)) {
    throw setupError("operator_plugin_skill_inventory_invalid");
  }
}

export function runOperatorPluginSetup({
  runCodex = runCodexCommand,
  cacheRoot = path.join(os.homedir(), ".codex", "plugins", "cache"),
} = {}) {
  let marketplaces = parseJsonCommand(
    runCodex(["plugin", "marketplace", "list", "--json"]),
    "operator_plugin_marketplace_list_failed",
  );
  let marketplace = marketplaces.marketplaces?.find(
    (candidate) => candidate.name === MARKETPLACE_NAME,
  );
  if (!marketplace) {
    parseJsonCommand(
      runCodex(["plugin", "marketplace", "add", repositoryRoot, "--json"]),
      "operator_plugin_marketplace_add_failed",
    );
    marketplaces = parseJsonCommand(
      runCodex(["plugin", "marketplace", "list", "--json"]),
      "operator_plugin_marketplace_list_failed",
    );
    marketplace = marketplaces.marketplaces?.find(
      (candidate) => candidate.name === MARKETPLACE_NAME,
    );
  }
  if (!marketplace || realpathSync(marketplace.root) !== repositoryRoot) {
    throw setupError("operator_plugin_marketplace_conflict");
  }
  const installed = parseJsonCommand(
    runCodex(["plugin", "add", PLUGIN_ID, "--json"]),
    "operator_plugin_install_failed",
  );
  if (
    installed.pluginId !== PLUGIN_ID ||
    installed.version !== REVIEWED_OPERATOR_PLUGIN_VERSION ||
    typeof installed.installedPath !== "string"
  ) {
    throw setupError("operator_plugin_effective_version_invalid");
  }
  return verifyOperatorPluginCache({
    cacheRoot,
    installedPath: installed.installedPath,
  });
}

function runCodexCommand(args) {
  return spawnSync("codex", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function parseJsonCommand(result, code) {
  if (result?.status !== 0) throw setupError(code);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw setupError(code);
  }
}

function safeRegularFile(root, relativePath) {
  const candidate = path.join(root, ...relativePath.split("/"));
  const stats = lstatSync(candidate);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw setupError("operator_plugin_cache_file_invalid");
  }
  return candidate;
}

function fileHash(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function setupError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

if (
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  try {
    const result = runOperatorPluginSetup();
    process.stdout.write(`${JSON.stringify({
      result: "pass",
      effective_plugin: result,
      credentials_exposed: false,
    }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({
      result: "failure",
      reason: error?.code ?? "operator_plugin_setup_failed",
      credentials_exposed: false,
    })}\n`);
    process.exitCode = 1;
  }
}
