import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

/** Engineering isolation, installed only in the disposable evidence processes. */
export function guardWorkflowCostProcess(root) {
  const network = installZeroNetworkGuard();
  const originals = new Map(), commands = [];
  for (const method of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) {
    originals.set(method, childProcess[method]);
    childProcess[method] = () => { commands.push(method); throw new Error("workflow_cost_process_execution_forbidden"); };
  }
  syncBuiltinESMExports();
  const observation = { restricted_path: process.env.PATH === path.join(root, "bin"), private_home: process.env.HOME === path.join(root, "home"),
    codex_executable_on_path: existsSync(path.join(process.env.PATH, "codex")),
    codex_auth_in_home: existsSync(path.join(process.env.HOME, ".codex", "auth.json")),
    provider_environment_keys: Object.keys(process.env).filter(k => /^(OPENAI|ANTHROPIC|CODEX)_/u.test(k)),
    enforcement: "private HOME, restricted PATH/environment, blocked Node network and subprocess APIs; not a hostile-code or whole-filesystem sandbox" };
  assert.equal(observation.restricted_path, true); assert.equal(observation.private_home, true);
  assert.equal(observation.codex_executable_on_path, false); assert.equal(observation.codex_auth_in_home, false);
  assert.deepEqual(observation.provider_environment_keys, []);
  return { observation, finish() {
    network.restore(); for (const [method, original] of originals) childProcess[method] = original;
    syncBuiltinESMExports(); assert.deepEqual(network.attempts, []); assert.deepEqual(commands, []);
    return { ...observation, network_attempts: 0, subprocess_attempts: 0 };
  } };
}
