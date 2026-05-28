import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const pluginRoot = "plugins/augnes-operator";
const hooksRoot = path.join(pluginRoot, "hooks");
const hooksJsonPath = path.join(hooksRoot, "hooks.json");
const pluginJsonPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
const hookScripts = {
  SessionStart: "session_start.mjs",
  PreToolUse: "pre_tool_use_policy.mjs",
  PostToolUse: "post_tool_use_review.mjs",
  Stop: "stop_closeout_guard.mjs",
};

const hooksJson = readJson(hooksJsonPath);
const pluginJson = readJson(pluginJsonPath);
assert.ok(hooksJson.hooks && typeof hooksJson.hooks === "object", "hooks.json must contain hooks object");

if (pluginJson.hooks !== undefined) {
  assert.equal(pluginJson.hooks, "./hooks/hooks.json", "explicit plugin hook path should point to ./hooks/hooks.json");
}

for (const eventName of Object.keys(hookScripts)) {
  assert.ok(Array.isArray(hooksJson.hooks[eventName]), `${eventName} hook must be configured`);
}
assert.equal(hooksJson.hooks.PermissionRequest, undefined, "PermissionRequest must not be configured in PR 5");
assert.equal(hooksJson.hooks.UserPromptSubmit, undefined, "UserPromptSubmit must not be configured in PR 5");
assert.equal(hooksJson.hooks.SessionStart[0]?.matcher, "startup|resume");
assert.equal(hooksJson.hooks.PreToolUse[0]?.matcher, "Bash|apply_patch|Edit|Write|mcp__.*");
assert.equal(hooksJson.hooks.PostToolUse[0]?.matcher, "Bash|apply_patch|Edit|Write|mcp__.*");
assert.equal(hooksJson.hooks.Stop[0]?.matcher, undefined);

for (const [eventName, scriptName] of Object.entries(hookScripts)) {
  const scriptPath = path.join(hooksRoot, scriptName);
  assert.ok(existsSync(scriptPath), `${scriptPath} must exist`);
  const hookEntry = hooksJson.hooks[eventName][0].hooks[0];
  assert.equal(hookEntry.type, "command");
  assert.match(hookEntry.command, /git rev-parse --show-toplevel/);
  assert.match(hookEntry.command, new RegExp(escapeRegExp(`plugins/augnes-operator/hooks/${scriptName}`)));
  assert.equal(hookEntry.timeout, 30);
  assert.ok(typeof hookEntry.statusMessage === "string" && hookEntry.statusMessage.length > 0);
}

for (const scriptName of Object.values(hookScripts)) {
  const source = readFileSync(path.join(hooksRoot, scriptName), "utf8");
  assertNoExternalCalls(source, scriptName);
  assertNoMutationExecution(source, scriptName);
}

const sessionStart = runHook("session_start.mjs", { hook_event_name: "SessionStart" });
assert.equal(sessionStart.status, 0);
assert.match(sessionStart.json.additionalContext, /Read AGENTS\.md/);
assert.match(sessionStart.json.additionalContext, /never merge PRs/);
assert.equal(sessionStart.json.hookSpecificOutput, undefined);

const malformedSessionStart = spawnSync(process.execPath, [path.join(hooksRoot, "session_start.mjs")], {
  input: "{not json",
  encoding: "utf8",
});
assert.equal(malformedSessionStart.status, 0);
assert.doesNotThrow(() => JSON.parse(malformedSessionStart.stdout));
assert.match(JSON.parse(malformedSessionStart.stdout).systemMessage, /malformed/);

assertPreToolDenies("gh pr merge 262", /merge PRs/);
assertPreToolDenies("git push --force origin branch", /force-pushing/);
assertPreToolDenies("cat .env", /secret reads/);
assertPreToolDenies("npm run codex:record-completion", /legacy codex:record-completion/);

assertPreToolAllows("npm run codex:closeout-preflight");
assertPreToolAllows("npm run typecheck");
assertPreToolAllows("npm run codex:record-completion-proof", { CODEX_WORK_ID: "AG-123" });

const postTypecheckPass = runHook("post_tool_use_review.mjs", {
  hook_event_name: "PostToolUse",
  tool_name: "Bash",
  tool_input: { command: "npm run typecheck" },
  tool_response: { stdout: "Process exited with code 0" },
});
assert.match(postTypecheckPass.json.additionalContext, /verification appears to have passed/);

const postSmokePass = runHook("post_tool_use_review.mjs", {
  hook_event_name: "PostToolUse",
  tool_name: "Bash",
  tool_input: { command: "npm run smoke:augnes-operator-plugin-hooks" },
  tool_response: { stdout: "passed" },
});
assert.match(postSmokePass.json.additionalContext, /verification appears to have passed/);

const postFailure = runHook("post_tool_use_review.mjs", {
  hook_event_name: "PostToolUse",
  tool_name: "Bash",
  tool_input: { command: "npm run typecheck" },
  tool_response: { stderr: "Process exited with code 2\nerror TS1234" },
});
assert.match(postFailure.json.additionalContext, /summarize the failure/i);

const stopMissingCloseout = runHook("stop_closeout_guard.mjs", {
  hook_event_name: "Stop",
  last_assistant_message: "Done.",
});
assert.equal(stopMissingCloseout.json.decision, "block");
assert.match(stopMissingCloseout.json.reason, /Summary, Files changed/);

const stopAlreadyActive = runHook("stop_closeout_guard.mjs", {
  hook_event_name: "Stop",
  stop_hook_active: true,
  last_assistant_message: "Done.",
});
assert.equal(stopAlreadyActive.json.decision, undefined);
assert.match(stopAlreadyActive.json.additionalContext, /already active/);

const stopMergeClaim = runHook("stop_closeout_guard.mjs", {
  hook_event_name: "Stop",
  last_assistant_message: [
    "Summary\nDone.",
    "Files changed\n- example",
    "Authority boundary statement\nCodex can merge PRs.",
    "Verification\n- npm run typecheck passed.",
    "Skipped checks\n- none.",
    "Proof-only closeout status or skipped reason\nSkipped: missing CODEX_WORK_ID.",
  ].join("\n\n"),
});
assert.equal(stopMergeClaim.json.decision, "block");
assert.match(stopMergeClaim.json.reason, /merge-authority language/);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-operator-plugin-hooks",
      hook_events: Object.keys(hookScripts),
      permission_request_absent: true,
      user_prompt_submit_absent: true,
      command_paths_git_root_resolved: true,
      scripts_local_deterministic: true,
      pre_tool_use_denials_verified: true,
      closeout_guard_verified: true,
    },
    null,
    2,
  ),
);

function assertPreToolDenies(command, reasonPattern) {
  const result = runHook("pre_tool_use_policy.mjs", {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command },
  });
  assert.equal(result.status, 0);
  assert.equal(result.json.hookSpecificOutput?.permissionDecision, "deny", `${command} should be denied`);
  assert.match(result.json.hookSpecificOutput.permissionDecisionReason, reasonPattern);
}

function assertPreToolAllows(command, env = {}) {
  const result = runHook(
    "pre_tool_use_policy.mjs",
    {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command },
    },
    env,
  );
  assert.equal(result.status, 0);
  assert.notEqual(result.json.hookSpecificOutput?.permissionDecision, "deny", `${command} should not be denied`);
}

function runHook(scriptName, payload, env = {}) {
  const result = spawnSync(process.execPath, [path.join(hooksRoot, scriptName)], {
    input: JSON.stringify(payload),
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${scriptName} did not return valid JSON.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}\n${error}`);
  }
  return { ...result, json };
}

function readJson(filePath) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertNoExternalCalls(source, scriptName) {
  const forbiddenPatterns = [
    /from\s+["']node:(?:child_process|http|https|net|dns|dgram|tls)["']/,
    /require\(["']node:(?:child_process|http|https|net|dns|dgram|tls)["']\)/,
    /\b(?:spawn|spawnSync|exec|execFile|execSync|execFileSync)\s*\(/,
    /\bf[et]{2}ch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bapi\.openai\.com\b/,
    /\bapi\.github\.com\b/,
    /\blocalhost:3000\b/,
    /\b127\.0\.0\.1:3000\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${scriptName} contains forbidden external-call pattern ${pattern}`);
  }
}

function assertNoMutationExecution(source, scriptName) {
  const executionPatterns = [
    /\bnpm\s+run\s+codex:record-evidence\s*["'`)]/,
    /\bnpm\s+run\s+codex:record-completion-proof\s*["'`)]/,
    /\bgh\s+pr\s+merge\s*["'`)]/,
    /\benable\s+auto-merge\s*["'`)]/,
  ];
  for (const pattern of executionPatterns) {
    assert.doesNotMatch(source, pattern, `${scriptName} appears to execute forbidden mutation ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
