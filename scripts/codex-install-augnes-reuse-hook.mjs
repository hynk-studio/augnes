#!/usr/bin/env node
import {
  installUserHook,
  parseInstallerArgs,
  printInstallerHelp,
  printSummary,
} from "./lib/codex-augnes-user-hook-installer-common.mjs";

try {
  const options = parseInstallerArgs(process.argv.slice(2), { requireRepoRoot: true });
  if (options.help) {
    printInstallerHelp("install");
    process.exit(0);
  }
  const summary = installUserHook(options);
  printSummary(summary);
} catch (error) {
  console.error(`codex:install-augnes-reuse-hook failed: ${error.message}`);
  process.exit(1);
}
