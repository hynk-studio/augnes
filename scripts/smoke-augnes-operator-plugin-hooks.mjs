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
assertHookContext(sessionStart.json, "SessionStart", /Read AGENTS\.md/);
assert.match(sessionStart.json.hookSpecificOutput.additionalContext, /never merge PRs/);

const malformedSessionStart = spawnSync(process.execPath, [path.join(hooksRoot, "session_start.mjs")], {
  input: "{not json",
  encoding: "utf8",
});
assert.equal(malformedSessionStart.status, 0);
assert.doesNotThrow(() => JSON.parse(malformedSessionStart.stdout));
const malformedSessionStartJson = JSON.parse(malformedSessionStart.stdout);
assert.match(malformedSessionStartJson.systemMessage, /malformed/);
assertHookContext(malformedSessionStartJson, "SessionStart", /Read AGENTS\.md/);

assertPreToolDenies("gh pr merge 262 --auto", /merge PRs/);
assertPreToolDenies("gh api graphql -f query='mutation { enablePullRequestAutoMerge(input: {}) { clientMutationId } }'", /auto-merge mutation/);
assertPreToolDenies("curl https://api.github.com/repos/Aurna-code/augnes/pulls/123/merge", /remote merge/);
assertPreToolDenies('node -e "fetch(\\"/api/publication-readiness-checks/123/publish/github-pr-comment\\")"', /remote merge/);
assertPreToolDenies("enable auto-merge for this PR", /enable auto-merge/);
assertPreToolDenies("Codex enabled auto-merge", /enable auto-merge/);
assertPreToolDenies("git push --force origin branch", /force-pushing/);
assertPreToolDenies("cat .env", /secret reads/);
assertPreToolDenies("npm run codex:record-completion", /legacy codex:record-completion/);
assertPreToolDenies("npm run codex:record-completion-proof", /requires CODEX_WORK_ID/);
assertPreToolDenies("npm run codex:record-evidence", /requires CODEX_WORK_ID/);

assertPreToolAllows("npm run codex:closeout-preflight");
assertPreToolAllows("npm run typecheck");
const proofOnlyPreTool = assertPreToolAllows("npm run codex:record-completion-proof", { CODEX_WORK_ID: "AG-123" });
assertHookContext(proofOnlyPreTool.json, "PreToolUse", /proof-only closeout/);

const evidencePreTool = assertPreToolAllows("npm run codex:record-evidence", { CODEX_WORK_ID: "AG-123" });
assertHookContext(evidencePreTool.json, "PreToolUse", /evidence rows/);

const inlineProofPreTool = assertPreToolAllows("CODEX_WORK_ID=AG-123 npm run codex:record-completion-proof");
assertHookContext(inlineProofPreTool.json, "PreToolUse", /proof-only closeout/);

const inlineEvidencePreTool = assertPreToolAllows("CODEX_WORK_ID=AG-123 npm run codex:record-evidence");
assertHookContext(inlineEvidencePreTool.json, "PreToolUse", /evidence rows/);

const envInlineProofPreTool = assertPreToolAllows("env CODEX_WORK_ID=AG-123 npm run codex:record-completion-proof");
assertHookContext(envInlineProofPreTool.json, "PreToolUse", /proof-only closeout/);

assertPreToolAllows('echo "Codex must never enable auto-merge."');
assertPreToolAllows('grep "never enable auto-merge" docs/CODEX_AUGNES_OPERATOR_HOOKS_V0_1.md');
assertPreToolAllowsInput("apply_patch", { patch: '*** Begin Patch\n*** Update File: docs/example.md\n+Codex must never enable auto-merge.\n*** End Patch' });
assertPreToolAllowsInput("Write", { file_path: "docs/example.md", content: "This PR does not enable auto-merge." });
assertPreToolAllowsInput("Edit", { file_path: "docs/example.md", old_string: "old", new_string: "No Codex auto-merge authority is granted." });

const postTypecheckPass = runHook("post_tool_use_review.mjs", {
  hook_event_name: "PostToolUse",
  tool_name: "Bash",
  tool_input: { command: "npm run typecheck" },
  tool_response: { stdout: "Process exited with code 0" },
});
assertHookContext(postTypecheckPass.json, "PostToolUse", /verification appears to have passed/);

const postSmokePass = runHook("post_tool_use_review.mjs", {
  hook_event_name: "PostToolUse",
  tool_name: "Bash",
  tool_input: { command: "npm run smoke:augnes-operator-plugin-hooks" },
  tool_response: { stdout: "passed" },
});
assertHookContext(postSmokePass.json, "PostToolUse", /verification appears to have passed/);

const postFailure = runHook("post_tool_use_review.mjs", {
  hook_event_name: "PostToolUse",
  tool_name: "Bash",
  tool_input: { command: "npm run typecheck" },
  tool_response: { stderr: "Process exited with code 2\nerror TS1234" },
});
assertHookContext(postFailure.json, "PostToolUse", /summarize the failure/i);

const stopMissingCloseout = runHook("stop_closeout_guard.mjs", {
  hook_event_name: "Stop",
  last_assistant_message: "Done.",
});
assert.equal(stopMissingCloseout.json.decision, "block");
assert.match(stopMissingCloseout.json.reason, /Summary, Files changed/);
assert.equal(stopMissingCloseout.json.hookSpecificOutput, undefined);

const stopAlreadyActive = runHook("stop_closeout_guard.mjs", {
  hook_event_name: "Stop",
  stop_hook_active: true,
  last_assistant_message: "Done.",
});
assert.equal(stopAlreadyActive.json.decision, undefined);
assert.equal(stopAlreadyActive.json.additionalContext, undefined);
assert.match(stopAlreadyActive.json.systemMessage, /already active/);

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
assert.equal(stopMergeClaim.json.hookSpecificOutput, undefined);

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
  return assertPreToolAllowsInput("Bash", { command }, env, command);
}

function assertPreToolAllowsInput(toolName, toolInput, env = {}, label = JSON.stringify(toolInput)) {
  const result = runHook(
    "pre_tool_use_policy.mjs",
    {
      hook_event_name: "PreToolUse",
      tool_name: toolName,
      tool_input: toolInput,
    },
    env,
  );
  assert.equal(result.status, 0);
  assert.notEqual(result.json.hookSpecificOutput?.permissionDecision, "deny", `${label} should not be denied`);
  return result;
}

function assertHookContext(output, eventName, contextPattern) {
  assert.equal(output.hookSpecificOutput?.hookEventName, eventName);
  assert.match(output.hookSpecificOutput?.additionalContext ?? "", contextPattern);
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
