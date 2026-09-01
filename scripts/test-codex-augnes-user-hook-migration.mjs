#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  installUserHook,
  uninstallUserHook,
} from "./lib/codex-augnes-user-hook-installer-common.mjs";

const repositoryRoot = process.cwd();
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "augnes-user-hook-contract-"));
const targetHome = path.join(tempRoot, "home");
const codexDir = path.join(targetHome, ".codex");
const hooksFile = path.join(codexDir, "hooks.json");
const installedScript = path.join(
  codexDir,
  "augnes",
  "augnes-reuse-intake-user-prompt-submit.mjs",
);
const metadataFile = path.join(codexDir, "augnes", "metadata.json");
const initialHooks = {
  hooks: {
    UserPromptSubmit: [
      {
        hooks: [
          {
            type: "command",
            command:
              'node "/Users/example/.codex/augnes/augnes-reuse-intake-user-prompt-submit.mjs"',
            timeout: 30,
            statusMessage: "Preparing Augnes reuse context (user-level)",
          },
        ],
      },
      {
        matcher: "unrelated",
        hooks: [
          {
            type: "command",
            command: "node /tmp/unrelated-hook.mjs",
            timeout: 10,
            statusMessage: "Unrelated hook",
          },
        ],
      },
    ],
  },
};

try {
  const projectHooks = JSON.parse(readFileSync(
    path.join(repositoryRoot, ".codex", "hooks.json"),
    "utf8",
  ));
  assert.equal(
    Object.hasOwn(projectHooks.hooks, "UserPromptSubmit"),
    false,
  );

  mkdirSync(codexDir, { recursive: true });
  writeFileSync(hooksFile, `${JSON.stringify(initialHooks, null, 2)}\n`);

  const dryRunInstall = installUserHook({
    repoRoot: repositoryRoot,
    targetHome,
    dryRun: true,
  });
  assert.equal(dryRunInstall.mode, "dry-run");
  assert.equal(dryRunInstall.hook_entry_status, "updated");
  assert.equal(dryRunInstall.wrote_files, false);
  assert.deepEqual(JSON.parse(readFileSync(hooksFile, "utf8")), initialHooks);

  const installed = installUserHook({
    repoRoot: repositoryRoot,
    targetHome,
    dryRun: false,
  });
  assert.equal(installed.mode, "write");
  assert.equal(installed.hook_entry_status, "updated");
  assert.equal(installed.wrote_files, true);
  assert.equal(existsSync(installedScript), true);
  assert.equal(existsSync(metadataFile), true);

  const installedSource = readFileSync(installedScript, "utf8");
  assert.match(installedSource, /EXPLICIT_REUSE_INTENT_PATTERNS/u);
  assert.doesNotMatch(installedSource, /DEVELOPMENT_TASK_PATTERNS/u);
  assert.doesNotMatch(installedSource, /Aurna-code\/augnes/u);
  assert.match(installedSource, /Injected by the user-level Codex UserPromptSubmit hook/u);

  const configured = JSON.parse(readFileSync(hooksFile, "utf8"));
  const handlers = configured.hooks.UserPromptSubmit.flatMap(
    (group) => group.hooks,
  );
  assert.equal(handlers.length, 2);
  assert.equal(
    handlers.filter((hook) =>
      hook.statusMessage === "Preparing Augnes reuse context (user-level)"
    ).length,
    1,
  );
  assert.equal(
    handlers.filter((hook) => hook.statusMessage === "Unrelated hook").length,
    1,
  );

  const genericDevelopmentPrompts = [
    "Fix the Codex script and review the pull request.",
    "Audit the current source and inspect the Perspective memory reuse matcher.",
  ];
  for (const prompt of genericDevelopmentPrompts) {
    assert.equal(
      runInstalledHook(installedScript, {
        hook_event_name: "UserPromptSubmit",
        cwd: repositoryRoot,
        prompt,
      }),
      "",
      `generic development prompt must not inject reuse context: ${prompt}`,
    );
  }

  const explicitOutput = JSON.parse(runInstalledHook(installedScript, {
    hook_event_name: "UserPromptSubmit",
    cwd: repositoryRoot,
    prompt: "Use Augnes memory for this task",
  }, { fakeNpm: true }));
  assert.equal(
    explicitOutput.hookSpecificOutput?.hookEventName,
    "UserPromptSubmit",
  );
  assert.match(
    explicitOutput.hookSpecificOutput?.additionalContext ?? "",
    /Codex Augnes Reuse Context/u,
  );

  const koreanReusePrompts = [
    "아그네스 메모리 사용해",
    "아그네스 기억 보고 시작해",
  ];
  for (const prompt of koreanReusePrompts) {
    const output = JSON.parse(runInstalledHook(installedScript, {
      hook_event_name: "UserPromptSubmit",
      cwd: repositoryRoot,
      prompt,
    }, { fakeNpm: true }));
    assert.equal(
      output.hookSpecificOutput?.hookEventName,
      "UserPromptSubmit",
    );
    assert.match(
      output.hookSpecificOutput?.additionalContext ?? "",
      /Codex Augnes Reuse Context/u,
    );
  }

  const beforeDryRunUninstall = readFileSync(hooksFile, "utf8");
  const dryRunUninstall = uninstallUserHook({
    targetHome,
    dryRun: true,
  });
  assert.equal(dryRunUninstall.hook_entry_status, "removed");
  assert.equal(dryRunUninstall.script_removal_status, "script_removed");
  assert.equal(readFileSync(hooksFile, "utf8"), beforeDryRunUninstall);
  assert.equal(existsSync(installedScript), true);

  const uninstalled = uninstallUserHook({
    targetHome,
    dryRun: false,
  });
  assert.equal(uninstalled.hook_entry_status, "removed");
  assert.equal(uninstalled.script_removal_status, "script_removed");
  assert.equal(existsSync(installedScript), false);
  assert.equal(existsSync(metadataFile), false);

  const afterUninstall = JSON.parse(readFileSync(hooksFile, "utf8"));
  const remainingHandlers = afterUninstall.hooks.UserPromptSubmit.flatMap(
    (group) => group.hooks,
  );
  assert.deepEqual(
    remainingHandlers.map((hook) => hook.statusMessage),
    ["Unrelated hook"],
  );
  assert.equal(
    readdirSync(codexDir).some((name) =>
      name.startsWith("hooks.json.backup-")
    ),
    true,
  );

  console.log(JSON.stringify({
    test: "codex-augnes-user-hook-migration",
    status: "pass",
    project_default_user_prompt_submit_absent: true,
    generic_source_first_prompt_injection: false,
    generic_development_prompts_refused: genericDevelopmentPrompts.length,
    explicit_reuse_prompt_supported: true,
    explicit_korean_reuse_prompts_supported: koreanReusePrompts.length,
    legacy_entry_updated: true,
    unrelated_user_hooks_preserved: true,
    installer_owned_files_removed: true,
    user_home_mutated: false,
  }, null, 2));
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

function runInstalledHook(scriptPath, input, { fakeNpm = false } = {}) {
  const env = { ...process.env };
  if (fakeNpm) {
    const fakeBin = path.join(tempRoot, "fake-bin");
    mkdirSync(fakeBin, { recursive: true });
    const fakeNpmPath = path.join(fakeBin, "npm");
    writeFileSync(
      fakeNpmPath,
      `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  suggested_memory_items: [],
  codex_memory_brief: "# Codex Memory Brief\\n\\nExplicit fixture context.",
  warnings: [],
  quality_review_preview_summary: { preview_state: "reviewable" },
  selection_guidance: {
    no_match_state: "not_applicable",
    no_match_message: null
  },
  authority_boundary: { deterministic_local_intake: true }
}));
`,
      { mode: 0o755 },
    );
    env.PATH = `${fakeBin}:${env.PATH ?? ""}`;
  }
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env,
    input: JSON.stringify(input),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  return result.stdout;
}
