import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const files = {
  agents: "AGENTS.md",
  hooksJson: ".codex/hooks.json",
  hookScript: ".codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs",
  smoke: "scripts/smoke-codex-augnes-reuse-hook.mjs",
  docs: "docs/CODEX_AUGNES_REUSE_HOOK_V0_1.md",
  report: "reports/2026-06-14-codex-augnes-reuse-hook.md",
  packageJson: "package.json",
};

const packageJson = readJson(files.packageJson);
const agentsText = readText(files.agents);
const hooksJson = readJson(files.hooksJson);
const hookSource = readText(files.hookScript);
const docsText = readText(files.docs);
const reportText = readText(files.report);

assertStaticFiles();
assertAgentsGuidance();
assertHookConfig();
assertHookSource();
assertDocsAndReport();
assertPackageScript();
assertHookExecution();

console.log(
  JSON.stringify(
    {
      smoke: "codex-augnes-reuse-hook",
      user_prompt_submit_hook_configured: true,
      hook_reads_stdin_json: true,
      hook_injects_additional_context: true,
      fail_open_behavior_verified: true,
      opt_out_and_skip_filters_verified: true,
      max_context_compaction_static_guard: true,
      trust_review_docs_verified: true,
      no_storage_persistence_or_provider_calls: true,
    },
    null,
    2,
  ),
);

function assertStaticFiles() {
  for (const [name, filePath] of Object.entries(files)) {
    assert.equal(existsSync(filePath), true, `${name} must exist at ${filePath}`);
  }
}

function assertAgentsGuidance() {
  assertIncludesAll(agentsText, [
    "## Codex Augnes Reuse Hook v0.1",
    "Perspective Memory Reuse Intake",
    "Use the resulting Codex Memory Brief as task context",
    "Preserve `why_selected` and `reuse_boundary`",
    "quality review warnings as operator-review signals",
    "Do not add storage, persistence, DB schema, provider/model calls, OpenAI API",
    "calls, MCP tool calls, Codex SDK execution, GitHub mutation",
    "Report changed files, verification, skipped checks with concrete reasons, and",
    "remaining friction",
  ]);
}

function assertHookConfig() {
  assert.ok(hooksJson.hooks, ".codex/hooks.json must define hooks");
  assert.ok(
    Array.isArray(hooksJson.hooks.UserPromptSubmit),
    "UserPromptSubmit hook must be configured",
  );
  const command = hooksJson.hooks.UserPromptSubmit[0]?.hooks?.[0]?.command ?? "";
  assert.equal(hooksJson.hooks.UserPromptSubmit[0].hooks[0].type, "command");
  assert.match(command, /node/);
  assert.match(command, /git rev-parse --show-toplevel/);
  assert.match(
    command,
    /\.codex\/hooks\/augnes-reuse-intake-user-prompt-submit\.mjs/,
  );
}

function assertHookSource() {
  assertIncludesAll(hookSource, [
    "readFileSync(0, \"utf8\")",
    "JSON.parse",
    "input.prompt",
    "hook_event_name",
    "UserPromptSubmit",
    "hookSpecificOutput",
    "additionalContext",
    "continue: true",
    "perspective:memory-reuse-intake",
    "\"--task\"",
    "\"--json\"",
    "spawnSync(",
    "process.exit(0)",
    "no augnes memory",
    "skip augnes reuse",
    "skip memory intake",
    "do not run reuse intake",
    "containsReuseBriefMarker",
    "promptLooksLikeDevelopmentTask",
    "appearsToBeAugnesRepo",
    "MAX_CONTEXT_CHARS",
    "12_000",
    "buildCompactedContext",
    "Hook compacted the injected context",
    "Preserved selected memory IDs",
    "Preserved why_selected",
    "Preserved reuse_boundary",
    "Preserved quality review warning summary",
    "Preserved authority boundary",
    "quality_review_preview_summary",
    "Authority Boundary",
    "storage, persistence, DB schema, provider/model calls, OpenAI API calls, MCP tool calls, Codex SDK execution, GitHub mutation",
  ]);

  assertNoForbiddenHookMarkers(hookSource);
}

function assertDocsAndReport() {
  assertIncludesAll(docsText, [
    "# Codex Augnes Reuse Hook v0.1",
    "project-local `UserPromptSubmit` hook",
    "`perspective:memory-reuse-intake`",
    "`additionalContext`",
    "hooks require Codex hook trust review",
    "`/hooks`",
    "no augnes memory",
    "skip augnes reuse",
    "skip memory intake",
    "do not run reuse intake",
    "fail-open",
    "no-match",
    "No storage or persistence",
    "No provider/model calls",
    "No OpenAI API calls",
    "No MCP tool calls",
    "No Codex SDK execution",
    "No GitHub mutation",
    "npm run smoke:codex-augnes-reuse-hook",
  ]);

  assertIncludesAll(reportText, [
    "# Codex Augnes Reuse Hook v0.1 Report",
    "## Summary",
    "## Files changed",
    "## User-facing goal",
    "## Hook behavior",
    "## AGENTS.md behavior",
    "## Trust/review note",
    "## Failure behavior",
    "## Boundary",
    "## Verification",
    "## Skipped checks with concrete reasons",
    "## Next recommended PR",
    "hooks require Codex hook trust review",
    "fail-open",
    "No storage or persistence",
  ]);
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:codex-augnes-reuse-hook"],
    "node scripts/smoke-codex-augnes-reuse-hook.mjs",
  );
}

function assertHookExecution() {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "augnes-reuse-hook-smoke-"));
  try {
    const missingDbPath = path.join(tempDir, "missing.db");
    const env = {
      ...process.env,
      AUGNES_DB_PATH: missingDbPath,
      AUGNES_REUSE_HOOK_CONTEXT_MAX_CHARS: "12000",
    };

    const active = runHook(
      {
        hook_event_name: "UserPromptSubmit",
        cwd: process.cwd(),
        prompt: "Add a small Augnes reuse intake follow-up",
        session_id: "smoke",
        turn_id: "smoke",
        permission_mode: "default",
        model: "smoke",
      },
      env,
    );
    assert.equal(active.status, 0);
    assert.ok(active.stdout.trim(), "development prompt should inject context");
    const parsed = JSON.parse(active.stdout);
    assert.equal(parsed.continue, true);
    assert.equal(parsed.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    assertIncludesAll(parsed.hookSpecificOutput.additionalContext, [
      "# Codex Augnes Reuse Context",
      "Add a small Augnes reuse intake follow-up",
      "quality_review_preview_summary",
      "Boundary Reminders",
    ]);

    const optOut = runHook(
      {
        hook_event_name: "UserPromptSubmit",
        cwd: process.cwd(),
        prompt: "Add a small Augnes reuse intake follow-up, skip augnes reuse",
      },
      env,
    );
    assert.equal(optOut.status, 0);
    assert.equal(optOut.stdout, "");

    const casual = runHook(
      {
        hook_event_name: "UserPromptSubmit",
        cwd: process.cwd(),
        prompt: "thanks",
      },
      env,
    );
    assert.equal(casual.status, 0);
    assert.equal(casual.stdout, "");

    const nonAugnes = runHook(
      {
        hook_event_name: "UserPromptSubmit",
        cwd: os.tmpdir(),
        prompt: "Add a small Augnes reuse intake follow-up",
      },
      env,
    );
    assert.equal(nonAugnes.status, 0);
    assert.equal(nonAugnes.stdout, "");

    const malformed = spawnSync(process.execPath, [files.hookScript], {
      cwd: process.cwd(),
      input: "{not json",
      encoding: "utf8",
      env,
    });
    assert.equal(malformed.status, 0);
    assert.equal(malformed.stdout, "");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function runHook(payload, env) {
  return spawnSync(process.execPath, [files.hookScript], {
    cwd: process.cwd(),
    input: JSON.stringify(payload),
    encoding: "utf8",
    env,
    timeout: 60_000,
  });
}

function assertNoForbiddenHookMarkers(source) {
  const forbiddenPatterns = [
    /\bf[et]{2}ch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bapi\.openai\.com\b/,
    /\bapi\.github\.com\b/,
    /\bfrom\s+["']@openai\/codex/i,
    /\bfrom\s+["']openai["']/i,
    /\bCodexSDK\b/,
    /\bcallMcpTool\b/i,
    /\bMcpClient\b/,
    /\bgh\s+(api|pr|issue|repo|auth)\b/,
    /\bwriteFileSync\s*\(/,
    /\bappendFileSync\s*\(/,
    /\bmkdirSync\s*\(/,
    /\brmSync\s*\(/,
    /\bcreatePerspectiveMemoryItem\b/,
    /\bupdatePerspectiveMemoryItemStatusInStore\b/,
    /\bcreateProductPersistenceBoundaryRecord\b/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+\s+SET\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bdb:reset\b/,
    /\bdb:migrate\b/,
    /\bdemo:seed\b/,
    /\bnext\s+dev\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `hook source contains forbidden marker ${pattern}`);
  }
}

function readJson(filePath) {
  assert.equal(existsSync(filePath), true, `${filePath} must exist`);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  assert.equal(existsSync(filePath), true, `${filePath} must exist`);
  return readFileSync(filePath, "utf8");
}

function assertIncludesAll(text, expectedValues) {
  for (const expected of expectedValues) {
    assert.ok(text.includes(expected), `Expected text to include ${expected}`);
  }
}
