import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const packageFile = "package.json";
const installScript = "scripts/codex-install-augnes-reuse-hook.mjs";
const uninstallScript = "scripts/codex-uninstall-augnes-reuse-hook.mjs";
const commonScript = "scripts/lib/codex-augnes-user-hook-installer-common.mjs";
const smokeFile = "scripts/smoke-codex-augnes-user-hook-installer.mjs";
const docsFile = "docs/CODEX_AUGNES_USER_HOOK_INSTALLER_V0_1.md";
const reportFile = "reports/2026-06-14-codex-augnes-user-hook-installer.md";
const installedScriptRelative = ".codex/augnes/augnes-reuse-intake-user-prompt-submit.mjs";
const metadataRelative = ".codex/augnes/metadata.json";
const hooksRelative = ".codex/hooks.json";

const packageJson = readJson(packageFile);
const installSource = readText(installScript);
const uninstallSource = readText(uninstallScript);
const commonSource = readText(commonScript);
const docsText = readText(docsFile);
const reportText = readText(reportFile);

assertStaticFilesAndPackageScripts();
assertInstallerStaticSource();
assertDocsAndReport();
assertInstallerAndUninstallerWithTempHome();

console.log("PASS smoke:codex-augnes-user-hook-installer");

function assertStaticFilesAndPackageScripts() {
  for (const filePath of [
    installScript,
    uninstallScript,
    commonScript,
    smokeFile,
    docsFile,
    reportFile,
  ]) {
    assert.equal(existsSync(filePath), true, `${filePath} must exist`);
  }
  assert.equal(
    packageJson.scripts["codex:install-augnes-reuse-hook"],
    "node scripts/codex-install-augnes-reuse-hook.mjs",
  );
  assert.equal(
    packageJson.scripts["codex:uninstall-augnes-reuse-hook"],
    "node scripts/codex-uninstall-augnes-reuse-hook.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:codex-augnes-user-hook-installer"],
    "node scripts/smoke-codex-augnes-user-hook-installer.mjs",
  );
}

function assertInstallerStaticSource() {
  assertIncludesAll(`${installSource}\n${uninstallSource}\n${commonSource}`, [
    "--target-home",
    "--repo-root",
    "--yes",
    "--dry-run",
    ".codex/augnes",
    "augnes-reuse-intake-user-prompt-submit.mjs",
    "metadata.json",
    ".backup-",
    "hynk-studio/augnes",
    "Aurna-code/augnes",
    "perspective:memory-reuse-intake",
    "Codex Operating Contract For Augnes",
    "Codex Augnes Reuse Hook v0.1",
    "Reminder: open /hooks",
    "USER_HOOK_STATUS_MESSAGE",
    "removeAugnesHookEntries",
    "keptGroups",
  ]);

  assertNoForbiddenInstallerSource(commonSource);
}

function assertDocsAndReport() {
  assertIncludesAll(docsText, [
    "# Codex Augnes User-Level Reuse Hook Installer v0.1",
    "## Purpose",
    "## Why User-Level Instead Of Project-Local",
    "## Install",
    "npm run codex:install-augnes-reuse-hook",
    "--dry-run",
    "--yes",
    "--target-home",
    "npm run codex:uninstall-augnes-reuse-hook",
    "~/.codex/hooks.json",
    "~/.codex/augnes/augnes-reuse-intake-user-prompt-submit.mjs",
    "Unrelated hooks are preserved",
    "/hooks",
    "real Codex hook loading/trust remains unverified by smoke",
    "Boundary",
    "Rollback",
  ]);

  assertIncludesAll(reportText, [
    "# Codex Augnes User-Level Reuse Hook Installer v0.1 Report",
    "## Summary",
    "## Environment facts from feasibility probe",
    "## Why user-level/global hook installer is the next direction",
    "## Files changed",
    "## Installer behavior",
    "## Uninstaller behavior",
    "## Temp-home smoke behavior",
    "## Hook placement decision",
    "## Trust behavior caveat",
    "## Boundary",
    "## Verification",
    "## Skipped checks with concrete reasons",
    "## Next recommended PR",
    "Static feasibility only",
    "real Codex hook trust/loading remains unverified",
  ]);
}

function assertInstallerAndUninstallerWithTempHome() {
  const tempHome = mkdtempSync(path.join(os.tmpdir(), "augnes-user-hook-installer-smoke-"));
  const hooksFile = path.join(tempHome, hooksRelative);
  const installedScript = path.join(tempHome, installedScriptRelative);
  const metadataFile = path.join(tempHome, metadataRelative);

  try {
    const dryRun = runNode(installScript, ["--target-home", tempHome]);
    assert.equal(dryRun.status, 0);
    assertIncludesAll(dryRun.stdout, [
      "mode: dry-run",
      "target_hooks_file:",
      hooksFile,
      "wrote_files: false",
      "Reminder: open /hooks",
    ]);
    assert.equal(existsSync(path.join(tempHome, ".codex")), false, "install dry-run must perform no writes");

    seedUnrelatedHooks(hooksFile);
    const beforeInstall = readText(hooksFile);
    const install = runNode(installScript, [
      "--yes",
      "--target-home",
      tempHome,
      "--repo-root",
      process.cwd(),
    ]);
    assert.equal(install.status, 0);
    assertIncludesAll(install.stdout, [
      "mode: write",
      "hook_entry_status: added",
      "wrote_files: true",
      "Reminder: open /hooks",
    ]);
    assert.equal(existsSync(hooksFile), true, "install --yes must write temp hooks.json");
    assert.equal(existsSync(installedScript), true, "install --yes must copy the hook script");
    assert.equal(existsSync(metadataFile), true, "install --yes must write install metadata");

    const installedHooks = readJson(hooksFile);
    assert.equal(countAugnesUserPromptHooks(installedHooks), 1);
    assertUnrelatedHooksPreserved(installedHooks);
    const augnesHandler = findAugnesUserPromptHook(installedHooks);
    assert.ok(
      augnesHandler.command.includes(installedScript),
      "installed hook command must point to copied temp-home script",
    );
    assert.equal(augnesHandler.type, "command");
    assert.equal(augnesHandler.timeout, 30);

    const installedScriptText = readText(installedScript);
    assertInstalledHookStaticChecks(installedScriptText);
    assertInstalledHookFixtureExecution(installedScript, tempHome);

    const secondInstall = runNode(installScript, [
      "--yes",
      "--target-home",
      tempHome,
      "--repo-root",
      process.cwd(),
    ]);
    assert.equal(secondInstall.status, 0);
    const secondHooks = readJson(hooksFile);
    assert.equal(countAugnesUserPromptHooks(secondHooks), 1, "second install must not duplicate Augnes hook");
    assertUnrelatedHooksPreserved(secondHooks);

    const beforeUninstallDryRun = readText(hooksFile);
    const uninstallDryRun = runNode(uninstallScript, ["--target-home", tempHome]);
    assert.equal(uninstallDryRun.status, 0);
    assertIncludesAll(uninstallDryRun.stdout, [
      "mode: dry-run",
      "hook_entry_status: removed",
      "wrote_files: false",
    ]);
    assert.equal(readText(hooksFile), beforeUninstallDryRun, "uninstall dry-run must not change hooks.json");
    assert.equal(existsSync(installedScript), true, "uninstall dry-run must not remove installed script");

    const uninstall = runNode(uninstallScript, ["--yes", "--target-home", tempHome]);
    assert.equal(uninstall.status, 0);
    assertIncludesAll(uninstall.stdout, [
      "mode: write",
      "hook_entry_status: removed",
      "script_removal_status: script_removed",
      "wrote_files: true",
    ]);
    const uninstalledHooks = readJson(hooksFile);
    assert.equal(countAugnesUserPromptHooks(uninstalledHooks), 0);
    assertUnrelatedHooksPreserved(uninstalledHooks);
    assert.equal(existsSync(installedScript), false, "uninstall --yes must remove installer-owned script");
    assert.equal(existsSync(metadataFile), false, "uninstall --yes must remove installer-owned metadata");
    assert.equal(existsSync(path.join(tempHome, ".codex")), true, "uninstall must not remove temp .codex");

    assert.equal(beforeInstall, readText(hooksFile), "real install/uninstall should restore unrelated JSON");
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
}

function assertInstalledHookStaticChecks(source) {
  assertIncludesAll(source, [
    "readFileSync(0, \"utf8\")",
    "JSON.parse",
    "input.prompt",
    "hook_event_name",
    "UserPromptSubmit",
    "hookSpecificOutput",
    "additionalContext",
    "perspective:memory-reuse-intake",
    "hynk-studio/augnes",
    "Aurna-code/augnes",
    "packageJson.name === \"augnes\"",
    "Codex Operating Contract For Augnes",
    "Codex Augnes Reuse Hook v0.1",
    "no augnes memory",
    "skip augnes reuse",
    "skip memory intake",
    "do not run reuse intake",
    "containsReuseBriefMarker",
    "promptLooksLikeDevelopmentTask",
    "MAX_CONTEXT_CHARS",
    "buildCompactedContext",
    "delete env.OPENAI_API_KEY",
    "delete env.GITHUB_TOKEN",
    "delete env.GH_TOKEN",
    "Codex Augnes Reuse Context",
    "Generated Codex Memory Brief",
    "Selected Memory IDs",
    "why_selected",
    "reuse_boundary",
    "quality_review_preview_summary",
    "Authority Boundary",
    "Closeout Expectations",
    "user-level Codex UserPromptSubmit hook",
  ]);
  assertNoForbiddenHookRuntimeMarkers(source);
}

function assertInstalledHookFixtureExecution(installedScript, tempHome) {
  const env = {
    ...process.env,
    AUGNES_DB_PATH: path.join(tempHome, "missing-reuse-smoke.db"),
    AUGNES_REUSE_HOOK_CONTEXT_MAX_CHARS: "12000",
  };
  const active = runHook(installedScript, {
    hook_event_name: "UserPromptSubmit",
    cwd: process.cwd(),
    prompt: "Add a small Augnes user-level reuse hook installer follow-up",
  }, env);
  assert.equal(active.status, 0);
  assert.ok(
    active.stdout === "" || active.stdout.includes("Codex Augnes Reuse Context"),
    "direct fixture execution should produce additionalContext/fail-open/no-match context or skip without failure",
  );
  if (active.stdout.trim()) {
    const parsed = JSON.parse(active.stdout);
    assert.equal(parsed.continue, true);
    assert.equal(parsed.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    assertIncludesAll(parsed.hookSpecificOutput.additionalContext, [
      "Codex Augnes Reuse Context",
      "quality_review_preview_summary",
      "Authority Boundary",
    ]);
  }

  const outside = runHook(installedScript, {
    hook_event_name: "UserPromptSubmit",
    cwd: os.tmpdir(),
    prompt: "Add a small Augnes user-level reuse hook installer follow-up",
  }, env);
  assert.equal(outside.status, 0);
  assert.equal(outside.stdout, "");

  const optOut = runHook(installedScript, {
    hook_event_name: "UserPromptSubmit",
    cwd: process.cwd(),
    prompt: "Add a small Augnes user-level reuse hook installer follow-up, skip augnes reuse",
  }, env);
  assert.equal(optOut.status, 0);
  assert.equal(optOut.stdout, "");

  const casual = runHook(installedScript, {
    hook_event_name: "UserPromptSubmit",
    cwd: process.cwd(),
    prompt: "thanks",
  }, env);
  assert.equal(casual.status, 0);
  assert.equal(casual.stdout, "");

  const malformed = spawnSync(process.execPath, [installedScript], {
    cwd: process.cwd(),
    input: "{not json",
    encoding: "utf8",
    env,
    timeout: 60_000,
  });
  assert.equal(malformed.status, 0);
  assert.equal(malformed.stdout, "");
}

function runHook(installedScript, payload, env) {
  return spawnSync(process.execPath, [installedScript], {
    cwd: process.cwd(),
    input: JSON.stringify(payload),
    encoding: "utf8",
    env,
    timeout: 60_000,
  });
}

function seedUnrelatedHooks(hooksFile) {
  const hooksDir = path.dirname(hooksFile);
  writeFileSyncRecursive(hooksFile, `${JSON.stringify({
    hooks: {
      PostToolUse: [
        {
          matcher: "Bash",
          hooks: [
            {
              type: "command",
              command: "node unrelated-post-tool-use.mjs",
              timeout: 1,
              statusMessage: "Unrelated PostToolUse hook",
            },
          ],
        },
      ],
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: "command",
              command: "node unrelated-user-prompt-submit.mjs",
              timeout: 1,
              statusMessage: "Unrelated UserPromptSubmit hook",
            },
          ],
        },
      ],
    },
  }, null, 2)}\n`, hooksDir);
}

function writeFileSyncRecursive(filePath, text, dirPath) {
  mkdirSync(dirPath, { recursive: true });
  writeFileSync(filePath, text, "utf8");
}

function assertUnrelatedHooksPreserved(hooksJson) {
  const postToolHooks = hooksJson.hooks?.PostToolUse?.[0]?.hooks ?? [];
  assert.ok(
    postToolHooks.some((hook) => hook.command === "node unrelated-post-tool-use.mjs"),
    "unrelated PostToolUse hook must be preserved",
  );
  const userPromptHooks = hooksJson.hooks?.UserPromptSubmit?.flatMap((group) => group.hooks ?? []) ?? [];
  assert.ok(
    userPromptHooks.some((hook) => hook.command === "node unrelated-user-prompt-submit.mjs"),
    "unrelated UserPromptSubmit hook must be preserved",
  );
}

function countAugnesUserPromptHooks(hooksJson) {
  return (hooksJson.hooks?.UserPromptSubmit ?? [])
    .flatMap((group) => group.hooks ?? [])
    .filter(isAugnesHookHandler).length;
}

function findAugnesUserPromptHook(hooksJson) {
  return (hooksJson.hooks?.UserPromptSubmit ?? [])
    .flatMap((group) => group.hooks ?? [])
    .find(isAugnesHookHandler);
}

function isAugnesHookHandler(hook) {
  return (
    hook?.statusMessage === "Preparing Augnes reuse context (user-level)" ||
    String(hook?.command ?? "").includes(installedScriptRelative)
  );
}

function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 120_000,
  });
}

function assertNoForbiddenInstallerSource(source) {
  const forbiddenPatterns = [
    /\bapi\.openai\.com\b/,
    /\bapi\.github\.com\b/,
    /\bfrom\s+["']@openai\/codex/i,
    /\bfrom\s+["']openai["']/i,
    /\bCodexSDK\b/,
    /\bcallMcpTool\b/i,
    /\bMcpClient\b/,
    /\bgh\s+(api|pr|issue|repo|auth)\b/,
    /\bdb:reset\b/,
    /\bdb:migrate\b/,
    /\bdemo:seed\b/,
    /\bnext\s+dev\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `installer contains forbidden marker ${pattern}`);
  }
}

function assertNoForbiddenHookRuntimeMarkers(source) {
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
    assert.doesNotMatch(source, pattern, `installed hook contains forbidden runtime marker ${pattern}`);
  }
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function readText(filePath) {
  assert.equal(existsSync(filePath), true, `${filePath} must exist`);
  return readFileSync(filePath, "utf8");
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeWhitespace(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeWhitespace(snippet)),
      `expected text to include ${snippet}`,
    );
  }
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
