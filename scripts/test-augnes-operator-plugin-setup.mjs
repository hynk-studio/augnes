#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  REVIEWED_OPERATOR_PLUGIN_VERSION,
  runOperatorPluginSetup,
  verifyOperatorPluginCache,
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
  assert.equal(verified.reviewed_files_verified, 5);
  verifyNoPluginLifecycleHooks(sourceRoot);
  verifyNoPluginLifecycleHooks(currentCache);
  verifyProjectHooks();

  mkdirSync(path.join(currentCache, "hooks"), { recursive: true });
  writeFileSync(path.join(currentCache, "hooks", "hooks.json"), "{\"hooks\":{}}\n");
  assert.throws(
    () => verifyOperatorPluginCache({ cacheRoot, installedPath: currentCache }),
    (error) => error?.code === "operator_plugin_default_hooks_present",
  );
  rmSync(path.join(currentCache, "hooks", "hooks.json"));

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
    plugin_default_hooks_absent: true,
    project_local_hooks_verified: true,
    stop_continuation_absent: true,
    structured_verification_status_only: true,
    committed_plugin_cache_files: 0,
    real_provider_calls: 0,
  }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}

function commandResult(value) {
  return { status: 0, stdout: JSON.stringify(value), stderr: "" };
}

function verifyNoPluginLifecycleHooks(pluginRoot) {
  assert.equal(existsSync(path.join(pluginRoot, "hooks", "hooks.json")), false);
  const manifest = JSON.parse(readFileSync(
    path.join(pluginRoot, ".codex-plugin", "plugin.json"),
    "utf8",
  ));
  assert.equal(Object.hasOwn(manifest, "hooks"), false);
}

function verifyProjectHooks() {
  const config = JSON.parse(readFileSync(path.join(repositoryRoot, ".codex", "hooks.json"), "utf8"));
  assert.deepEqual(Object.keys(config.hooks).sort(), [
    "PostToolUse",
    "PreToolUse",
    "SessionStart",
    "UserPromptSubmit",
  ]);
  assert.equal(Object.hasOwn(config.hooks, "Stop"), false);
  assert.equal(config.hooks.PreToolUse[0].matcher, "Bash");
  assert.equal(config.hooks.PostToolUse[0].matcher, "Bash");

  const commands = Object.values(config.hooks).flatMap((groups) =>
    groups.flatMap((group) => group.hooks.map((hook) => hook.command)),
  );
  assert.equal(commands.length, 4);
  for (const command of commands) {
    assert.match(command, /^node "\$\(git rev-parse --show-toplevel\)\/\.codex\/hooks\/[a-z0-9-]+\.mjs"$/u);
    assert.equal(command.includes("$PLUGIN_ROOT"), false);
    assert.equal(command.includes("/Users/"), false);
  }

  const sessionOutput = runProjectHook("augnes-operator-session-start.mjs", {
    hook_event_name: "SessionStart",
  });
  assert.equal(sessionOutput.hookSpecificOutput?.hookEventName, "SessionStart");
  assert.match(sessionOutput.hookSpecificOutput?.additionalContext ?? "", /Augnes operator guardrails/u);

  assert.deepEqual(runProjectHook("augnes-operator-pre-tool-use-policy.mjs", {
    hook_event_name: "PreToolUse",
    tool_name: "apply_patch",
    tool_input: { patch: "documentation containing gh pr merge" },
  }), {});
  for (const command of [
    "printf '%s\\n' 'example; gh pr merge 123'",
    "printf '%s\\n' \"example && gh pr merge 123\"",
    "printf '%s\\n' 'example || git push --force'",
    "rg -n 'foo; gh pr merge' docs",
    "rg -n 'gh pr merge' docs",
    "printf '%s\\n' 'gh pr ready'",
    "printf '%s\\n' \"example\\; gh pr merge 123\"",
    "printf '%s\\n' example\\; gh pr merge 123",
    "printf '%s\\n' example\\&\\& gh pr ready 123",
    "printf '%s\\n' example\\|\\| git push --force origin HEAD",
    "printf '%s\\n' 'quoted multiline\ngh pr merge 123'",
    "printf '%s\\n' escaped\\\nnewline gh pr merge 123",
  ]) {
    assert.deepEqual(runProjectHook("augnes-operator-pre-tool-use-policy.mjs", {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command },
    }), {}, `quoted or escaped command text must remain advisory: ${JSON.stringify(command)}`);
  }
  for (const command of [
    "gh pr merge 123",
    "echo ok; gh pr merge 123",
    "echo ok && gh pr ready 123",
    "npm test || git push --force origin HEAD",
    "echo ok\ngh pr merge 123",
    "gh api -X POST repos/hynk-studio/augnes/pulls/123/merge",
    "cat .env.local",
    "printenv OPENAI_API_KEY",
  ]) {
    assert.equal(runProjectHook("augnes-operator-pre-tool-use-policy.mjs", {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command },
    }).hookSpecificOutput?.permissionDecision, "deny", `direct command must be denied: ${JSON.stringify(command)}`);
  }

  assert.deepEqual(runProjectHook("augnes-operator-post-tool-use-review.mjs", {
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: { command: "sed -n '1,80p' docs/example.md" },
    tool_response: { exit_code: 0, output: "Process exited with code 1; failure" },
  }), {});
  assert.deepEqual(runProjectHook("augnes-operator-post-tool-use-review.mjs", {
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: { command: "npm run typecheck" },
    tool_response: "Process exited with code 1",
  }), {});
  assert.match(runProjectHook("augnes-operator-post-tool-use-review.mjs", {
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: { command: "npm run typecheck" },
    tool_response: { exit_code: 0, output: "fixture says failure" },
  }).hookSpecificOutput?.additionalContext ?? "", /verification pass/u);
  assert.match(runProjectHook("augnes-operator-post-tool-use-review.mjs", {
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: { command: "npm run verify:local:quick" },
    tool_response: { exit_code: 1, output: "" },
  }).hookSpecificOutput?.additionalContext ?? "", /verification failure/u);
}

function runProjectHook(file, input) {
  const result = spawnSync(
    process.execPath,
    [path.join(repositoryRoot, ".codex", "hooks", file)],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      input: JSON.stringify(input),
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}
