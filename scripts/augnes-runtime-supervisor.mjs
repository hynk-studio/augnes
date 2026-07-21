#!/usr/bin/env node

import { lstatSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

function sourceCheckoutLayoutPresent(root) {
  try {
    return [
      "next.config.ts",
      "scripts/build-with-isolated-db.mjs",
      "apps/augnes_apps/src/server.ts",
    ].every((relativePath) => {
      const stats = lstatSync(path.join(root, relativePath));
      return stats.isFile() && !stats.isSymbolicLink();
    });
  } catch {
    return false;
  }
}

function pathEntryPresent(root, relativePath) {
  try {
    lstatSync(path.join(root, relativePath));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    return true;
  }
}

function packagedRuntimeLayoutPresent(root) {
  return [
    "server.js",
    "augnes.mjs",
    "bridge/dist/server.mjs",
  ].some((relativePath) => pathEntryPresent(root, relativePath));
}

export async function runRuntimeSupervisorEntry(argv = process.argv.slice(2)) {
  if (
    pathEntryPresent(repositoryRoot, "augnes-package.json") ||
    packagedRuntimeLayoutPresent(repositoryRoot) ||
    !sourceCheckoutLayoutPresent(repositoryRoot)
  ) {
    const { runDistributableLauncher } = await import(
      "./distributable-package-launcher.mjs"
    );
    return runDistributableLauncher(argv);
  }
  const { runRuntimeSupervisorCli } = await import(
    "./augnes-runtime-supervisor-core.mjs"
  );
  return runRuntimeSupervisorCli(argv);
}

if (
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  process.exitCode = await runRuntimeSupervisorEntry();
}
