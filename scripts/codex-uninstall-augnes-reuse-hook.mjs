#!/usr/bin/env node
import {
  parseInstallerArgs,
  printInstallerHelp,
  printSummary,
  uninstallUserHook,
} from "./lib/codex-augnes-user-hook-installer-common.mjs";

try {
  const options = parseInstallerArgs(process.argv.slice(2));
  if (options.help) {
    printInstallerHelp("uninstall");
    process.exit(0);
  }
  const summary = uninstallUserHook(options);
  printSummary(summary);
} catch (error) {
  console.error(`codex:uninstall-augnes-reuse-hook failed: ${error.message}`);
  process.exit(1);
}
