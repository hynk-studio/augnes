#!/usr/bin/env node

import {
  runM3dAutonomousEvidenceV01,
} from "./lib/m3d-autonomous-evidence-runner-v0-1.mjs";
import { validateAbsolutePathInputV01 } from "./lib/m3d-evidence-runner-path-policy-v0-1.mjs";

try {
  const options = parseArguments(process.argv.slice(2));
  const result = await runM3dAutonomousEvidenceV01(options);
  if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${result.runner_version}: ${result.verdict} (${result.phase})\n`);
  process.exitCode = result.verdict === "ABORTED" || result.verdict === "HOLD" ? 1 : 0;
} catch (error) {
  const reasonCode = typeof error?.reasonCode === "string" ? error.reasonCode : "malformed_invocation";
  process.stdout.write(`${JSON.stringify({
    runner_version: "vnext_m3d_autonomous_evidence_runner.v0.1",
    verdict: "ABORTED",
    phase: "RUNNER_QUALIFICATION",
    chain_id: null,
    reason_codes: [reasonCode],
  }, null, 2)}\n`);
  process.exitCode = 2;
}

function parseArguments(argv) {
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
