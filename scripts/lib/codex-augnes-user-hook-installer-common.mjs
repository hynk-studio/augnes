import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export const INSTALLER_VERSION = "0.1";
export const INSTALLER_ID = "codex-augnes-user-hook-installer-v0.1";
export const HOOK_ID = "augnes-reuse-intake-user-prompt-submit";
export const INSTALLED_SCRIPT_NAME = "augnes-reuse-intake-user-prompt-submit.mjs";
export const METADATA_FILE_NAME = "metadata.json";
export const USER_HOOK_STATUS_MESSAGE = "Preparing Augnes reuse context (user-level)";
export const TRUST_REMINDER =
  "Reminder: open /hooks in an interactive Codex CLI/TUI session and trust the non-managed hook before it can run.";

export function parseInstallerArgs(argv, { requireRepoRoot = false } = {}) {
  const options = {
    yes: false,
    dryRunFlag: false,
    repoRoot: "",
    targetHome: os.homedir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--yes") {
      options.yes = true;
    } else if (arg === "--dry-run") {
      options.dryRunFlag = true;
    } else if (arg === "--repo-root") {
      options.repoRoot = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--target-home") {
      options.targetHome = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.yes && options.dryRunFlag) {
    throw new Error("Use either --yes or --dry-run, not both.");
  }

  options.mode = options.yes ? "write" : "dry-run";
  options.dryRun = !options.yes;
  options.targetHome = path.resolve(options.targetHome);
  if (options.repoRoot) options.repoRoot = path.resolve(options.repoRoot);
  if (requireRepoRoot && !options.repoRoot) options.repoRoot = resolveRepoRootFromGit();
  return options;
}

export function printInstallerHelp(kind) {
  const command =
    kind === "install"
      ? "npm run codex:install-augnes-reuse-hook -- [--yes] [--dry-run] [--target-home <path>] [--repo-root <path>]"
      : "npm run codex:uninstall-augnes-reuse-hook -- [--yes] [--dry-run] [--target-home <path>]";
  console.log(`# Codex Augnes User-Level Reuse Hook ${kind}`);
  console.log("");
  console.log(command);
  console.log("");
  console.log("Default mode is dry-run. Real user-level writes require --yes.");
}

export function installUserHook(options) {
  const repoRoot = options.repoRoot || resolveRepoRootFromGit();
  assertAugnesRepo(repoRoot);

  const paths = buildInstallPaths(options.targetHome);
  const hookSource = buildUserLevelHookSource(repoRoot);
  const hookPlan = buildHooksJsonInstallPlan(paths, readHooksJsonIfPresent(paths.hooksFile));
  const summary = {
    tool: "codex-augnes-user-hook-installer",
    version: INSTALLER_VERSION,
    mode: options.dryRun ? "dry-run" : "write",
    target_home: paths.targetHome,
    target_hooks_file: paths.hooksFile,
    installed_hook_script_path: paths.installedScript,
    metadata_file: paths.metadataFile,
    repo_root: repoRoot,
    hook_entry_status: hookPlan.status,
    dry_run: options.dryRun,
    wrote_files: false,
    backup_path: null,
    trust_review_required: true,
    trust_reminder: TRUST_REMINDER,
  };

  if (!options.dryRun) {
    mkdirSync(paths.augnesDir, { recursive: true });
    if (existsSync(paths.hooksFile)) {
      summary.backup_path = backupFile(paths.hooksFile);
    }
    writeFileSync(paths.installedScript, hookSource, { encoding: "utf8", mode: 0o755 });
    writeFileSync(paths.metadataFile, `${JSON.stringify(buildMetadata(repoRoot, paths, hookSource), null, 2)}\n`);
    writeFileSync(paths.hooksFile, `${JSON.stringify(hookPlan.nextHooksJson, null, 2)}\n`);
    summary.wrote_files = true;
  }

  return summary;
}

export function uninstallUserHook(options) {
  const paths = buildInstallPaths(options.targetHome);
  const currentHooksJson = readHooksJsonIfPresent(paths.hooksFile);
  const hookPlan = buildHooksJsonUninstallPlan(currentHooksJson);
  const scriptRemoval = planScriptRemoval(paths);
  const summary = {
    tool: "codex-augnes-user-hook-uninstaller",
    version: INSTALLER_VERSION,
    mode: options.dryRun ? "dry-run" : "write",
    target_home: paths.targetHome,
    target_hooks_file: paths.hooksFile,
    installed_hook_script_path: paths.installedScript,
    metadata_file: paths.metadataFile,
    hook_entry_status: hookPlan.status,
    script_removal_status: scriptRemoval.status,
    dry_run: options.dryRun,
    wrote_files: false,
    backup_path: null,
    trust_review_required: true,
    trust_reminder: TRUST_REMINDER,
  };

  if (!options.dryRun) {
    if (existsSync(paths.hooksFile)) {
      summary.backup_path = backupFile(paths.hooksFile);
      writeFileSync(paths.hooksFile, `${JSON.stringify(hookPlan.nextHooksJson, null, 2)}\n`);
      summary.wrote_files = true;
    }
    if (scriptRemoval.removeScript) {
      rmSync(paths.installedScript, { force: true });
      summary.wrote_files = true;
    }
    if (scriptRemoval.removeMetadata) {
      rmSync(paths.metadataFile, { force: true });
      summary.wrote_files = true;
    }
  }

  return summary;
}

export function printSummary(summary) {
  console.log(`# ${summary.tool}`);
  console.log("");
  console.log(`mode: ${summary.mode}`);
  console.log(`target_home: ${summary.target_home}`);
  console.log(`target_hooks_file: ${summary.target_hooks_file}`);
  console.log(`installed_hook_script_path: ${summary.installed_hook_script_path}`);
  console.log(`hook_entry_status: ${summary.hook_entry_status}`);
  if (summary.script_removal_status) {
    console.log(`script_removal_status: ${summary.script_removal_status}`);
  }
  console.log(`wrote_files: ${summary.wrote_files}`);
  if (summary.backup_path) console.log(`backup_path: ${summary.backup_path}`);
  console.log(summary.trust_reminder);
  console.log("");
  console.log("Summary JSON:");
  console.log(JSON.stringify(summary, null, 2));
}

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function resolveRepoRootFromGit() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error("Unable to resolve repo root with git rev-parse --show-toplevel.");
  }
  return result.stdout.trim();
}

function assertAugnesRepo(repoRoot) {
  const packageJson = readJson(path.join(repoRoot, "package.json"), "package.json");
  const agentsText = safeRead(path.join(repoRoot, "AGENTS.md"));
  const gitRemoteText = readGitRemoteText(repoRoot);
  const hasRepoMarker =
    gitRemoteText.includes("hynk-studio/augnes") ||
    gitRemoteText.includes("Aurna-code/augnes");
  const hasAgentsMarker =
    agentsText.includes("Codex Operating Contract For Augnes") ||
    agentsText.includes("Codex Augnes Reuse Hook v0.1");

  if (packageJson.name !== "augnes") {
    throw new Error("Refusing install: package.json name is not augnes.");
  }
  if (typeof packageJson.scripts?.["perspective:memory-reuse-intake"] !== "string") {
    throw new Error("Refusing install: perspective:memory-reuse-intake script is missing.");
  }
  if (!hasAgentsMarker) {
    throw new Error("Refusing install: AGENTS.md Augnes marker is missing.");
  }
  if (!hasRepoMarker) {
    throw new Error("Refusing install: git remote does not contain hynk-studio/augnes or Aurna-code/augnes.");
  }
}

function buildInstallPaths(targetHome) {
  const targetCodexDir = path.join(targetHome, ".codex");
  const augnesDir = path.join(targetCodexDir, "augnes");
  return {
    targetHome,
    targetCodexDir,
    augnesDir,
    hooksFile: path.join(targetCodexDir, "hooks.json"),
    installedScript: path.join(augnesDir, INSTALLED_SCRIPT_NAME),
    metadataFile: path.join(augnesDir, METADATA_FILE_NAME),
  };
}

function buildUserLevelHookSource(repoRoot) {
  const sourcePath = path.join(
    repoRoot,
    ".codex",
    "hooks",
    "augnes-reuse-intake-user-prompt-submit.mjs",
  );
  let source = readFileSync(sourcePath, "utf8");
  source = source.replace(
    "Injected by the project-local Codex UserPromptSubmit hook before implementation.",
    "Injected by the user-level Codex UserPromptSubmit hook before implementation.",
  );
  source = source.replace(
    `    const gitConfig = safeRead(path.join(repoRoot, ".git", "config"));
    const hasRepoMarker =
      gitConfig.includes("hynk-studio/augnes") ||
      gitConfig.includes("Aurna-code/augnes");`,
    `    const gitRemoteText = readGitRemoteText(repoRoot);
    const hasRepoMarker =
      gitRemoteText.includes("hynk-studio/augnes") ||
      gitRemoteText.includes("Aurna-code/augnes");`,
  );
  source = source.replace(
    "\nfunction safeRead(filePath) {",
    `\nfunction readGitRemoteText(repoRoot) {
  try {
    const result = spawnSync("git", ["remote", "-v"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 3_000,
    });
    if (result.status !== 0) return "";
    return result.stdout.trim();
  } catch {
    return "";
  }
}
\nfunction safeRead(filePath) {`,
  );
  return source;
}

function buildHooksJsonInstallPlan(paths, currentHooksJson) {
  const current = normalizeHooksJson(currentHooksJson);
  const cleaned = removeAugnesHookEntries(current);
  const nextHooksJson = cloneJson(cleaned.value);
  const userPromptSubmit = Array.isArray(nextHooksJson.hooks.UserPromptSubmit)
    ? nextHooksJson.hooks.UserPromptSubmit
    : [];
  userPromptSubmit.push({
    hooks: [
      {
        type: "command",
        command: buildHookCommand(paths.installedScript),
        timeout: 30,
        statusMessage: USER_HOOK_STATUS_MESSAGE,
      },
    ],
  });
  nextHooksJson.hooks.UserPromptSubmit = userPromptSubmit;

  let status = "added";
  if (cleaned.removedCount > 0) status = "updated";
  if (jsonStableStringify(current) === jsonStableStringify(nextHooksJson)) status = "unchanged";
  return { status, nextHooksJson };
}

function buildHooksJsonUninstallPlan(currentHooksJson) {
  const current = normalizeHooksJson(currentHooksJson);
  const cleaned = removeAugnesHookEntries(current);
  return {
    status: cleaned.removedCount > 0 ? "removed" : "missing",
    nextHooksJson: cleaned.value,
  };
}

function normalizeHooksJson(value) {
  const normalized = value && typeof value === "object" && !Array.isArray(value)
    ? cloneJson(value)
    : {};
  if (!normalized.hooks || typeof normalized.hooks !== "object" || Array.isArray(normalized.hooks)) {
    normalized.hooks = {};
  }
  return normalized;
}

function removeAugnesHookEntries(hooksJson) {
  const next = cloneJson(hooksJson);
  const groups = Array.isArray(next.hooks.UserPromptSubmit)
    ? next.hooks.UserPromptSubmit
    : [];
  let removedCount = 0;
  const keptGroups = [];

  for (const group of groups) {
    if (!group || typeof group !== "object") {
      keptGroups.push(group);
      continue;
    }
    const originalHooks = Array.isArray(group.hooks) ? group.hooks : [];
    const keptHooks = originalHooks.filter((hook) => {
      const remove = isAugnesHookHandler(hook);
      if (remove) removedCount += 1;
      return !remove;
    });
    if (keptHooks.length > 0 || originalHooks.length === 0) {
      keptGroups.push({ ...group, hooks: keptHooks });
    }
  }

  if (keptGroups.length > 0) {
    next.hooks.UserPromptSubmit = keptGroups;
  } else {
    delete next.hooks.UserPromptSubmit;
  }
  return { value: next, removedCount };
}

function isAugnesHookHandler(hook) {
  if (!hook || typeof hook !== "object") return false;
  const command = typeof hook.command === "string" ? hook.command : "";
  const statusMessage = typeof hook.statusMessage === "string" ? hook.statusMessage : "";
  return (
    command.includes(`.codex/augnes/${INSTALLED_SCRIPT_NAME}`) ||
    command.includes(`.codex\\augnes\\${INSTALLED_SCRIPT_NAME}`) ||
    statusMessage === USER_HOOK_STATUS_MESSAGE
  );
}

function buildHookCommand(installedScriptPath) {
  return `node ${JSON.stringify(installedScriptPath)}`;
}

function planScriptRemoval(paths) {
  if (!existsSync(paths.installedScript)) {
    return { status: "script_missing", removeScript: false, removeMetadata: false };
  }
  const metadata = readMetadata(paths.metadataFile);
  const installedByThisTool =
    metadata?.installed_by === INSTALLER_ID &&
    path.resolve(metadata.installed_script_path || "") === path.resolve(paths.installedScript);
  if (!installedByThisTool) {
    return {
      status: "script_left_metadata_missing_or_unmatched",
      removeScript: false,
      removeMetadata: false,
    };
  }
  return { status: "script_removed", removeScript: true, removeMetadata: true };
}

function buildMetadata(repoRoot, paths, hookSource) {
  const sourcePath = path.join(
    repoRoot,
    ".codex",
    "hooks",
    "augnes-reuse-intake-user-prompt-submit.mjs",
  );
  return {
    installed_by: INSTALLER_ID,
    hook_id: HOOK_ID,
    installed_at: new Date().toISOString(),
    repo_root: repoRoot,
    source_script_path: sourcePath,
    source_script_sha256: sha256(readFileSync(sourcePath, "utf8")),
    installed_script_path: paths.installedScript,
    installed_script_sha256: sha256(hookSource),
    trust_review_required: true,
    trust_review_command: "/hooks",
  };
}

function backupFile(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "").replace("Z", "Z");
  const backupPath = `${filePath}.backup-${timestamp}`;
  copyFileSync(filePath, backupPath);
  return backupPath;
}

function readHooksJsonIfPresent(filePath) {
  if (!existsSync(filePath)) return {};
  return readJson(filePath, "hooks.json");
}

function readMetadata(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readGitRemoteText(repoRoot) {
  try {
    const result = spawnSync("git", ["remote", "-v"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 3_000,
    });
    if (result.status !== 0) return "";
    return result.stdout.trim();
  } catch {
    return "";
  }
}

function readJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read ${label} at ${filePath}: ${error.message}`);
  }
}

function safeRead(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function jsonStableStringify(value) {
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
