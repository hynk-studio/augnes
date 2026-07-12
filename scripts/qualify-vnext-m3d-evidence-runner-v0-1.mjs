#!/usr/bin/env node

import {
  M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
  qualifyM3dEvidenceRunnerV01,
  writeQualificationReceiptV01,
} from "./lib/m3d-evidence-runner-qualification-v0-1.mjs";
import { validateAbsolutePathInputV01 } from "./lib/m3d-evidence-runner-path-policy-v0-1.mjs";

try {
  const options = parseArguments(process.argv.slice(2));
  const receipt = await qualifyM3dEvidenceRunnerV01(options);
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  if (options.output) {
    writeQualificationReceiptV01({
      receipt,
      serializedReceipt: serialized,
      outputPath: options.output,
      runtimeRoot: options.runtimeRoot,
      evidenceRoot: options.evidenceRoot,
      workingDbPath: options.workingDbPath,
      canonicalCheckoutRoot: options.canonicalCheckoutRoot,
    });
  }
  if (options.json) {
    process.stdout.write(serialized);
  } else {
    const reasons = receipt.reason_codes.length
      ? ` (${receipt.reason_codes.join(",")})`
      : "";
    process.stdout.write(
      `${receipt.qualification_version}: ${receipt.status}${reasons}\n`,
    );
  }
  process.exitCode = receipt.status === "qualified" ? 0 : exitCodeFor(receipt);
} catch (error) {
  const reasonCode = publicReasonCode(error);
  const failure = {
    qualification_version: M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
    status: "unqualified",
    reason_code: reasonCode,
    public_summary: publicSummary(reasonCode),
    semantic_execution_started: false,
    database_opened: false,
    default_database_inspected: false,
    credential_material_included: false,
  };
  process.stdout.write(`${JSON.stringify(failure, null, 2)}\n`);
  process.exitCode = 2;
}

function parseArguments(argv) {
  const options = { json: false };
  const valueOptions = new Map([
    ["--mode", "mode"],
    ["--repo-root", "repoRoot"],
    ["--runtime-root", "runtimeRoot"],
    ["--evidence-root", "evidenceRoot"],
    ["--working-db-path", "workingDbPath"],
    ["--canonical-checkout-root", "canonicalCheckoutRoot"],
    ["--browser-executable", "browserExecutable"],
    ["--output", "output"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    const key = valueOptions.get(argument);
    if (!key || index + 1 >= argv.length || argv[index + 1].startsWith("--")) {
      throw invocationError();
    }
    options[key] = argv[index + 1];
    index += 1;
  }
  for (const required of [
    "mode",
    "repoRoot",
    "runtimeRoot",
    "evidenceRoot",
    "workingDbPath",
    "canonicalCheckoutRoot",
  ]) {
    if (typeof options[required] !== "string" || !options[required]) {
      throw invocationError();
    }
  }
  if (options.mode !== "portable" && options.mode !== "local_full") {
    throw invocationError();
  }
  for (const key of [
    "repoRoot",
    "runtimeRoot",
    "evidenceRoot",
    "workingDbPath",
    "canonicalCheckoutRoot",
    "browserExecutable",
    "output",
  ]) {
    if (options[key]) validateAbsolutePathInputV01(options[key]);
  }
  return options;
}

function exitCodeFor(receipt) {
  return receipt.reason_codes.includes("unsupported_platform") ? 2 : 1;
}

function invocationError() {
  const error = new Error("Malformed qualification invocation.");
  error.reasonCode = "malformed_invocation";
  return error;
}

function publicReasonCode(error) {
  if (typeof error?.reasonCode === "string") return error.reasonCode;
  return "malformed_invocation";
}

function publicSummary(reasonCode) {
  if (reasonCode === "path_input_invalid") {
    return "A path argument is invalid or not absolute.";
  }
  return "The qualification invocation is malformed or unsupported.";
}
