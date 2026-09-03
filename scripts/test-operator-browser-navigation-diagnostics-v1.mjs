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
import { correlateOperatorDocumentResponseV1 } from "./operator-execution-browser-lifecycle-v1.mjs";

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

assertExactDocumentCorrelation();

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
  assertSupervisorDiagnostic(httpError.result);
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
  assertSupervisorDiagnostic(missingBootstrap.result);
  assertSanitized(missingBootstrap);
  assertCompleteCleanup(missingBootstrap.result);

  const missingDocumentResponse = await runScenario(
    "document-response-missing",
  );
  assert.equal(missingDocumentResponse.exit.code, 1);
  assert.match(
    missingDocumentResponse.result.failure,
    /operator_browser_navigation_failure:document_response_missing:route_workbench_result/u,
  );
  assert.doesNotMatch(
    missingDocumentResponse.result.failure,
    /operator_condition_timeout/u,
  );
  assert.deepEqual(missingDocumentResponse.result.browser_failure_diagnostic, {
    diagnostic_version: "operator_browser_failure_diagnostic.v1",
    category: "document_response_missing",
    route: "workbench_result",
    http_status: null,
    detail: null,
  });
  assertSupervisorDiagnostic(missingDocumentResponse.result);
  assertSanitized(missingDocumentResponse);
  assertCompleteCleanup(missingDocumentResponse.result);

  assert.equal(ownedProcesses.size, 0);
  summary = {
    status: "pass",
    contract: "operator_browser_navigation_diagnostics.v1",
    exact_document_correlation: {
      final_correlated_status: 500,
      foreign_loader_frame_phase_epoch_rejected: true,
    },
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
      same_document_navigation_preserved: true,
      cleanup_complete: missingBootstrap.result.cleanup_complete,
    },
    document_response_missing: {
      failure_category:
        missingDocumentResponse.result.browser_failure_diagnostic.category,
      stale_document_response_rejected: true,
      cleanup_complete: missingDocumentResponse.result.cleanup_complete,
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

function assertExactDocumentCorrelation() {
  const expected = {
    request_id: "request-final",
    frame_id: "frame-target",
    loader_id: "loader-target",
    phase: "browser_navigation_diagnostics",
    navigation_epoch: 7,
    path: "/workbench/results/final",
    status: 500,
    type: "Document",
  };
  const responses = [
    { ...expected, request_id: "before-start", status: 418 },
    { ...expected, loader_id: "loader-foreign", status: 401 },
    { ...expected, frame_id: "frame-foreign", status: 402 },
    { ...expected, phase: "foreign_phase", status: 403 },
    { ...expected, navigation_epoch: 6, status: 404 },
    { ...expected, type: "XHR", status: 405 },
    { ...expected, request_id: "request-redirect", status: 302 },
    expected,
  ];
  assert.equal(
    correlateOperatorDocumentResponseV1({
      responses,
      response_start: 1,
      navigation_epoch: 7,
      phase: "browser_navigation_diagnostics",
      loader_id: "loader-target",
      frame_id: "frame-target",
    }),
    expected,
  );
  assert.equal(
    correlateOperatorDocumentResponseV1({
      responses: responses.slice(0, 6),
      response_start: 1,
      navigation_epoch: 7,
      phase: "browser_navigation_diagnostics",
      loader_id: "loader-target",
      frame_id: "frame-target",
    }),
    null,
  );
}

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

function assertSupervisorDiagnostic(result) {
  assert.equal(
    result.supervisor_exit_diagnostic?.diagnostic_version,
    "operator_browser_supervisor_diagnostic.v1",
  );
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
  assert.equal(
    /augnes-operator-review-control-v1-[^\s"']+\/chrome-profile/u.test(
      publicOutput,
    ),
    false,
    "profile_path_exposed",
  );
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
  environment.PATH = [path.dirname(process.execPath), environment.PATH]
    .filter(Boolean)
    .join(path.delimiter);
  return environment;
}
