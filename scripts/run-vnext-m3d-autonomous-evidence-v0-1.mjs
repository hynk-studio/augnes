#!/usr/bin/env node

import {
  runM3dAutonomousEvidenceV01,
} from "./lib/m3d-autonomous-evidence-runner-v0-1.mjs";
import { fileURLToPath } from "node:url";
import { validateAbsolutePathInputV01 } from "./lib/m3d-evidence-runner-path-policy-v0-1.mjs";

export async function runM3dAutonomousEvidenceCliV01(
  argv,
  dependencies = {},
) {
  const executeRunner =
    dependencies.executeRunner ?? runM3dAutonomousEvidenceV01;
  const stdout = dependencies.stdout ?? process.stdout;
  try {
    const options = parseM3dAutonomousEvidenceCliArgumentsV01(argv);
    const result = await executeRunner(options);
    if (options.json) stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else stdout.write(`${result.runner_version}: ${result.verdict} (${result.phase})\n`);
    return result.verdict === "ABORTED" || result.verdict === "HOLD" ? 1 : 0;
  } catch (error) {
    const reasonCode = typeof error?.reasonCode === "string" ? error.reasonCode : "malformed_invocation";
    stdout.write(`${JSON.stringify({
      runner_version: "vnext_m3d_autonomous_evidence_runner.v0.1",
      verdict: "ABORTED",
      phase: "RUNNER_QUALIFICATION",
      chain_id: null,
      reason_codes: [reasonCode],
    }, null, 2)}\n`);
    return 2;
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await runM3dAutonomousEvidenceCliV01(
    process.argv.slice(2),
  );
}

export function parseM3dAutonomousEvidenceCliArgumentsV01(argv) {
  const output = { mode: "full", json: false };
  const values = new Map([
    ["--canonical-checkout-root", "canonicalCheckoutRoot"],
    ["--run-root", "runRoot"],
    ["--execution-repo", "executionRepo"],
    ["--runtime-root", "runtimeRoot"],
    ["--evidence-root", "evidenceRoot"],
    ["--working-db-path", "workingDbPath"],
    ["--browser-executable", "browserExecutable"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      output.json = true;
      continue;
    }
    if (argument === "--dry-run" || argument === "--qualify-only") {
      if (output.mode !== "full") throw invocationError();
      output.mode = argument.slice(2);
      continue;
    }
    const key = values.get(argument);
    if (!key || index + 1 >= argv.length || argv[index + 1].startsWith("--")) {
      throw invocationError();
    }
    output[key] = validateAbsolutePathInputV01(argv[index + 1]);
    index += 1;
  }
  if (!output.canonicalCheckoutRoot || !output.runRoot) throw invocationError();
  return output;
}

function invocationError() {
  const error = new Error("Malformed runner invocation.");
  error.reasonCode = "malformed_invocation";
  return error;
}
