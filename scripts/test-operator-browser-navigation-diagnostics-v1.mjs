#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  cleanupOwnedProcesses,
  registerOwnedChild,
  waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";
import {
  acquireCompanionServiceMaintenance,
  releaseCompanionServiceMaintenance,
} from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const validationScript = path.join(
  repoRoot,
  "scripts",
  "browser-validate-operator-review-control-v1.mjs",
);
const ownedProcesses = new Set();
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const SENSITIVE_MARKERS = Object.freeze([
  "raw-sensitive-runtime-document",
  "vnext_bootstrap_v01.sensitive-document-token",
  "sk-proj-sensitive-document-key",
  "/Users/private-operator/runtime-error",
]);
let serviceMaintenance = null;
let serviceMaintenanceRelease = null;
let summary = null;

try {
  serviceMaintenance = await acquireCompanionServiceMaintenance({
    repositoryRoot: repoRoot,
    operationId: `operator-browser-navigation-diagnostics:${process.pid}`,
    joinAncestorLease: true,
  });
  const httpError = await runScenario("http-error-document");
  assert.equal(httpError.exit.code, 1);
  assert.match(
    httpError.result.failure,
    /operator_browser_navigation_failure:http_error_document:status_500:route_workbench_result/u,
  );
  assert.doesNotMatch(
    httpError.result.failure,
    /operator_condition_timeout:operator_bootstrap_input/u,
  );
  assert.deepEqual(httpError.result.browser_failure_diagnostic, {
    diagnostic_version: "operator_browser_failure_diagnostic.v1",
    category: "http_error_document",
    route: "workbench_result",
    http_status: 500,
    detail: null,
  });
  assert.equal(
    httpError.result.supervisor_exit_diagnostic?.diagnostic_version,
    "operator_browser_supervisor_diagnostic.v1",
  );
  assertSanitized(httpError);
  assertCompleteCleanup(httpError.result);

  const missingBootstrap = await runScenario(
    "successful-document-missing-bootstrap",
  );
  assert.equal(missingBootstrap.exit.code, 1);
  assert.match(
    missingBootstrap.result.failure,
    /operator_condition_timeout:operator_bootstrap_input/u,
  );
  assert.doesNotMatch(missingBootstrap.result.failure, /http_error_document/u);
  assert.deepEqual(missingBootstrap.result.browser_failure_diagnostic, {
    diagnostic_version: "operator_browser_failure_diagnostic.v1",
    category: "expected_selector_missing_on_successful_document",
    route: "workbench_result",
    http_status: 200,
    detail: "operator_bootstrap_input",
  });
  assert.equal(
    missingBootstrap.result.supervisor_exit_diagnostic?.diagnostic_version,
    "operator_browser_supervisor_diagnostic.v1",
  );
  assertSanitized(missingBootstrap);
  assertCompleteCleanup(missingBootstrap.result);

  assert.equal(ownedProcesses.size, 0);
  summary = {
    status: "pass",
    contract: "operator_browser_navigation_diagnostics.v1",
    http_error_document: {
      failure_category: httpError.result.browser_failure_diagnostic.category,
      http_status: httpError.result.browser_failure_diagnostic.http_status,
      bootstrap_timeout_reported: false,
      cleanup_complete: httpError.result.cleanup_complete,
    },
    successful_document_missing_bootstrap: {
      failure_category:
        missingBootstrap.result.browser_failure_diagnostic.category,
      http_status:
        missingBootstrap.result.browser_failure_diagnostic.http_status,
      cleanup_complete: missingBootstrap.result.cleanup_complete,
    },
    diagnostic_sanitization: "pass",
    provider_calls: 0,
    repository_task_calls: 0,
    remaining_owned_processes: ownedProcesses.size,
  };
} finally {
  await cleanupOwnedProcesses(ownedProcesses, {
    termGraceMs: 5_000,
    killGraceMs: 5_000,
  });
  if (serviceMaintenance) {
    serviceMaintenanceRelease = await releaseCompanionServiceMaintenance({
      repositoryRoot: repoRoot,
      lease: serviceMaintenance.lease,
    });
  }
}

assert(summary, "operator_browser_navigation_diagnostic_summary_missing");
assert.equal(ownedProcesses.size, 0);
assert.equal(
  serviceMaintenance?.acquired === false ||
    serviceMaintenanceRelease?.released === true,
  true,
);
process.stdout.write(
  `${JSON.stringify({
    ...summary,
    companion_service_maintenance: {
      before: serviceMaintenance?.before ?? null,
      after: serviceMaintenanceRelease?.after ?? null,
      release_completed:
        serviceMaintenance?.acquired === false ||
        serviceMaintenanceRelease?.released === true,
    },
  })}\n`,
);

async function runScenario(scenario) {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", validationScript, scenario],
    {
      cwd: repoRoot,
      env: focusedEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  const record = registerOwnedChild(ownedProcesses, child, {
    label: `operator-browser-navigation-diagnostic-${scenario}`,
  });
  const stdout = boundedCapture(child.stdout);
  const stderr = boundedCapture(child.stderr);
  const exit = await waitForOwnedProcessExit(record, 180_000, {
    termGraceMs: 10_000,
    killGraceMs: 5_000,
  });
  assert.equal(stdout.overflowed(), false, `${scenario}:stdout_overflow`);
  assert.equal(stderr.overflowed(), false, `${scenario}:stderr_overflow`);
  return {
    exit,
    stdout: stdout.value(),
    stderr: stderr.value(),
    result: parseFinalResult(stdout.value()),
  };
}

function boundedCapture(stream) {
  let output = "";
  let overflow = false;
  stream.on("data", (chunk) => {
    output += chunk.toString("utf8");
    if (Buffer.byteLength(output, "utf8") > MAX_OUTPUT_BYTES) {
      overflow = true;
      output = output.slice(-MAX_OUTPUT_BYTES);
    }
  });
  return {
    overflowed: () => overflow,
    value: () => output,
  };
}

function parseFinalResult(stdout) {
  const marker =
    "[browser-e2e] cleanup_result scope=operator-review-control ";
  const markerIndex = stdout.lastIndexOf(marker);
  assert.notEqual(markerIndex, -1, "operator_cleanup_result_missing");
  const jsonStart = stdout.indexOf("\n{", markerIndex);
  assert.notEqual(jsonStart, -1, "operator_final_result_missing");
  return JSON.parse(stdout.slice(jsonStart + 1).trim());
}

function assertCompleteCleanup(result) {
  assert.equal(result.cleanup_complete, true);
  assert.equal(result.owned_streams_settled, true);
  assert.equal(result.owned_process_residue_count, 0);
  assert.equal(result.listener_residue_count, 0);
  assert.equal(result.runtime_shutdown_complete, true);
  assert.equal(result.chrome_cdp_shutdown_complete, true);
  assert.equal(result.temporary_root_removed, true);
  assert.equal(result.temporary_process_root_removed, true);
  assert.equal(result.temporary_profile_removed, true);
  assert.equal(result.temporary_database_removed, true);
  assert.equal(result.temporary_fixture_removed, true);
  assert.equal(result.temporary_signal_removed, true);
  assert.equal(result.temporary_transport_removed, true);
  assert.equal(result.forbidden_effect_zero_evidence?.provider_calls, 0);
}

function assertSanitized(observation) {
  const publicOutput = `${observation.stdout}\n${observation.stderr}`;
  for (const marker of SENSITIVE_MARKERS) {
    assert.equal(publicOutput.includes(marker), false, `sensitive_marker:${marker}`);
  }
  const diagnostic = JSON.stringify({
    browser: observation.result.browser_failure_diagnostic,
    supervisor: observation.result.supervisor_exit_diagnostic,
  });
  assert.equal(/vnext_(?:bootstrap|session|action)_v01\./u.test(diagnostic), false);
  assert.equal(/(?:OPENAI_API_KEY|GITHUB_TOKEN|sk-|ghp_)/u.test(diagnostic), false);
  assert.equal(/\/(?:Users|home)\/[A-Za-z0-9._-]+\//u.test(diagnostic), false);
  assert.equal(/raw-sensitive-runtime-document/u.test(diagnostic), false);
}

function focusedEnvironment() {
  const environment = Object.fromEntries(
    [
      "PATH",
      "HOME",
      "TMPDIR",
      "LANG",
      "LC_ALL",
      "SHELL",
      "TERM",
      "AUGNES_BROWSER_EXECUTABLE_PATH",
    ]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]]),
  );
  environment.PATH = [
    path.dirname(process.execPath),
    environment.PATH,
  ].filter(Boolean).join(path.delimiter);
  return environment;
}
