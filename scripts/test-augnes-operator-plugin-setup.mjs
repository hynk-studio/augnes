#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  REVIEWED_OPERATOR_PLUGIN_VERSION,
  runOperatorPluginSetup,
} from "./augnes-operator-plugin-setup.mjs";

const repositoryRoot = process.cwd();
const sourceRoot = path.join(repositoryRoot, "plugins", "augnes-operator");
const root = mkdtempSync(path.join(os.tmpdir(), "augnes-plugin-setup-"));
const cacheRoot = path.join(root, "cache");
const operatorCache = path.join(cacheRoot, "augnes-local", "augnes-operator");
const staleCache = path.join(operatorCache, "0.3.0");
const currentCache = path.join(operatorCache, REVIEWED_OPERATOR_PLUGIN_VERSION);

try {
  cpSync(sourceRoot, staleCache, { recursive: true });
  let addCalls = 0;
  const exactRunner = (args) => {
    if (args.join(" ") === "plugin marketplace list --json") {
      return commandResult({
        marketplaces: [{ name: "augnes-local", root: repositoryRoot }],
      });
    }
    if (args.join(" ") === "plugin add augnes-operator@augnes-local --json") {
      addCalls += 1;
      rmSync(operatorCache, { recursive: true, force: true });
      cpSync(sourceRoot, currentCache, { recursive: true });
      return commandResult({
        pluginId: "augnes-operator@augnes-local",
        version: REVIEWED_OPERATOR_PLUGIN_VERSION,
        installedPath: currentCache,
      });
    }
    return { status: 1, stdout: "", stderr: "unexpected" };
  };
  const verified = runOperatorPluginSetup({ runCodex: exactRunner, cacheRoot });
  assert.equal(addCalls, 1);
  assert.equal(verified.version, "0.4.0");
  assert.equal(verified.stale_cache_versions, 0);
  assert.equal(verified.reviewed_files_verified, 6);

  rmSync(operatorCache, { recursive: true, force: true });
  cpSync(sourceRoot, staleCache, { recursive: true });
  cpSync(sourceRoot, currentCache, { recursive: true });
  const staleRunner = (args) => args[1] === "marketplace"
    ? commandResult({ marketplaces: [{ name: "augnes-local", root: repositoryRoot }] })
    : commandResult({
        pluginId: "augnes-operator@augnes-local",
        version: "0.4.0",
        installedPath: currentCache,
      });
  assert.throws(
    () => runOperatorPluginSetup({ runCodex: staleRunner, cacheRoot }),
    (error) => error?.code === "operator_plugin_stale_cache_present",
  );

  const trackedCache = spawnSync("git", ["ls-files", "*plugins/cache*"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(trackedCache.status, 0);
  assert.equal(trackedCache.stdout.trim(), "");
  console.log(JSON.stringify({
    status: "pass",
    reviewed_plugin_version: "0.4.0",
    stale_0_3_0_refused: true,
    proxy_skill_hook_prompt_same_cache_version: true,
    committed_plugin_cache_files: 0,
    real_provider_calls: 0,
  }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}

function commandResult(value) {
  return { status: 0, stdout: JSON.stringify(value), stderr: "" };
}
