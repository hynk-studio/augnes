import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import net from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";

import {
  openVNextLocalOperatorDatabaseV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session.ts";
import { createBrowserSupervisorPublicDiagnosticCapture } from "./browser-supervisor-public-diagnostic.mjs";
import { createBrowserE2ETimingRecorder } from "./browser-e2e-timing.mjs";
import { createOperatorRequestFailureEvidenceV1 } from "./operator-execution-result-contract-v1.mjs";
import {
  registerOwnedChild,
  settleOwnedProcessAfterExit,
  terminateOwnedProcessTree,
} from "./test-harness-process-lifecycle.mjs";

const DEFAULT_TIMEOUT_MS = 45_000;
const REQUEST_QUIET_MS = 500;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export async function createOperatorExecutionBrowserLifecycleV1({
  child_id,
  database_path,
  manifest,
  project_id,
  temp_root,
  process_temp_root,
  environment = {},
}) {
  assert.match(
    child_id,
    /^(?:operator-(?:review-control|native-host-execution|multi-candidate)|cross-boundary-golden)$/u,
  );
  assert.equal(path.isAbsolute(database_path), true);
  assert.equal(path.isAbsolute(temp_root), true);
  assert.equal(path.isAbsolute(process_temp_root), true);
  const appRepo = path.resolve(process.cwd());
  const runtimeSupervisor = path.join(appRepo, "scripts", "augnes-runtime-supervisor.mjs");
  const profileDirectory = path.join(temp_root, "chrome-profile");
  const runtimeStateDirectory = path.join(temp_root, "runtime-state");
  const disposableHome = path.join(temp_root, "home");
  const downloadDirectory = path.join(temp_root, "downloads");
  for (const directory of [
    profileDirectory,
    runtimeStateDirectory,
    disposableHome,
    downloadDirectory,
    process_temp_root,
  ]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  const ports = [];
  while (ports.length < 3) {
    const candidate = await chooseAvailablePort();
    if (!ports.includes(candidate)) ports.push(candidate);
  }
  const [appPort, bridgePort, debugPort] = ports;
  const appOrigin = `http://127.0.0.1:${appPort}`;
  const timing = createBrowserE2ETimingRecorder({ scope: child_id });
  const requests = [];
  const responses = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];
  const failedRequestDeliveriesById = new Map();
  const inFlightDocumentRequestIds = new Set();
  const externalRequests = [];
  const ownedProcesses = new Set();
  let currentPhase = "setup";
  let lastObserverActivityAt = Date.now();
  let runtimeProcess = null;
  let runtimeRecord = null;
  let runtimeClosePromise = null;
  let runtimeDiagnostic = null;
  let runtimeLog = "";
  let chromeProcess = null;
  let chromeRecord = null;
  let cdp = null;
  let runtimeStartCount = 0;
  let runtimeShutdownCount = 0;
  let navigationCount = 0;
  let waitCount = 0;
  let quietCount = 0;
  let failedRequestDeliverySequence = 0;
  let pausedSemanticTransition = null;
  let pausedGuideBriefInterpretation = null;
  let activeRuntimeProjectId = project_id;

  const requestForId = (requestId) => {
    for (let index = requests.length - 1; index >= 0; index -= 1) {
      if (requests[index].request_id === requestId) return requests[index];
    }
    return null;
  };

  const responseForId = (requestId) => {
    for (let index = responses.length - 1; index >= 0; index -= 1) {
      if (responses[index].request_id === requestId) return responses[index];
    }
    return null;
  };

  const runtimeEnvironment = (activeProjectId = project_id) => ({
    ...minimalProcessEnvironment(),
    HOME: disposableHome,
    USERPROFILE: disposableHome,
    TMPDIR: process_temp_root,
    TMP: process_temp_root,
    TEMP: process_temp_root,
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_RUNTIME_STATE_DIR: runtimeStateDirectory,
    AUGNES_DB_PATH: database_path,
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: temp_root,
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: manifest.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: activeProjectId,
    AUGNES_VNEXT_OPERATOR_ID: manifest.operator_id,
    ...environment,
  });

  const startRuntime = (activeProjectId = project_id) => {
    activeRuntimeProjectId = activeProjectId;
    runtimeStartCount += 1;
    const finish = timing.start(
      "runtime_startup",
      `runtime startup ${String(runtimeStartCount).padStart(2, "0")}`,
    );
    const capture = createBrowserSupervisorPublicDiagnosticCapture();
    runtimeDiagnostic = capture;
    runtimeProcess = spawn(
      process.execPath,
      [
        runtimeSupervisor,
        "start",
        "--webpack",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(appPort),
        "--bridge-port",
        String(bridgePort),
      ],
      {
        cwd: appRepo,
        env: runtimeEnvironment(activeProjectId),
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      },
    );
    runtimeRecord = registerOwnedChild(ownedProcesses, runtimeProcess, {
      label: `${child_id}-runtime-${runtimeStartCount}`,
    });
    runtimeClosePromise = new Promise((resolve) => {
      runtimeProcess.once("close", (code, signal) => {
        capture.flush();
        resolve({ code, signal });
      });
    });
    runtimeProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      runtimeLog = `${runtimeLog}${text}`.slice(-128 * 1024);
      capture.append(text);
    });
    runtimeProcess.stderr.on("data", (chunk) => {
      runtimeLog = `${runtimeLog}${chunk.toString("utf8")}`.slice(-128 * 1024);
    });
    runtimeProcess.once("spawn", finish);
  };

  const startChrome = () => {
    const candidates = [
      process.env.AUGNES_BROWSER_EXECUTABLE_PATH,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ].filter(Boolean);
    const executable = candidates.find((candidate) => existsSync(candidate));
    assert(executable, "operator_browser_chrome_missing");
    const finish = timing.start("chrome_startup", "Chrome and CDP startup");
    chromeProcess = spawn(
      executable,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-pings",
        "--password-store=basic",
        "--use-mock-keychain",
        "--remote-debugging-address=127.0.0.1",
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profileDirectory}`,
        `--download-default-directory=${downloadDirectory}`,
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "ignore"], detached: true },
    );
    chromeRecord = registerOwnedChild(ownedProcesses, chromeProcess, {
      label: `${child_id}-chrome`,
    });
    chromeProcess.once("spawn", finish);
  };

  const openCdp = async () => {
    const started = Date.now();
    let webSocketUrl = null;
    while (Date.now() - started < DEFAULT_TIMEOUT_MS) {
      try {
        const response = await fetch(
          `http://127.0.0.1:${debugPort}/json/version`,
        );
        if (response.ok) {
          webSocketUrl = (await response.json()).webSocketDebuggerUrl;
          if (webSocketUrl) break;
        }
      } catch {
        // Chrome is still starting on the owned loopback port.
      }
      await delay(100);
    }
    assert(webSocketUrl, "operator_browser_cdp_endpoint_missing");
    const browserClient = new CdpClient(webSocketUrl);
    await browserClient.open();
    const targets = await browserClient.send("Target.getTargets");
    const page = targets.targetInfos.find((entry) => entry.type === "page");
    assert(page, "operator_browser_page_target_missing");
    const attached = await browserClient.send("Target.attachToTarget", {
      targetId: page.targetId,
      flatten: true,
    });
    cdp = browserClient.session(attached.sessionId);
    attachObservers();
    await Promise.all([
      cdp.send("Page.enable"),
      cdp.send("Runtime.enable"),
      cdp.send("Network.enable"),
      cdp.send("Log.enable"),
      cdp.send("Fetch.enable", {
        patterns: [
          { urlPattern: "*/api/vnext/operator/semantic-transition*" },
          { urlPattern: "*/api/augnes/guide-brief/interpretation" },
          {
            urlPattern: "*/api/vnext/operator/guide-brief/interpretation",
          },
        ],
      }),
    ]);
  };

  const attachObservers = () => {
    cdp.on((payload) => {
      const params = payload.params ?? {};
      if (payload.method === "Network.requestWillBeSent") {
        lastObserverActivityAt = Date.now();
        if (params.type === "Document") {
          inFlightDocumentRequestIds.add(params.requestId);
        }
        const classified = classifyUrl(params.request?.url);
        const entry = {
          request_id: params.requestId,
          phase: currentPhase,
          navigation_epoch: navigationCount,
          path: classified.path,
          external: classified.external,
          method: params.request?.method ?? null,
          post_data: params.request?.postData ?? null,
          type: params.type ?? null,
        };
        requests.push(entry);
        if (classified.external) externalRequests.push(entry);
      } else if (payload.method === "Network.responseReceived") {
        lastObserverActivityAt = Date.now();
        const classified = classifyUrl(params.response?.url);
        const request = requestForId(params.requestId);
        responses.push({
          request_id: params.requestId,
          phase: request?.phase ?? currentPhase,
          path: classified.path,
          method: request?.method ?? null,
          status: params.response?.status ?? null,
          type: params.type ?? null,
          body_classification: null,
        });
      } else if (payload.method === "Network.loadingFinished") {
        inFlightDocumentRequestIds.delete(params.requestId);
        const response = responseForId(params.requestId);
        if (response?.path === "/api/vnext/operator/inspector") {
          void cdp
            .send("Network.getResponseBody", { requestId: params.requestId })
            .then((body) => {
              response.body_classification = classifyInspectorResponseBody(
                body?.body ?? "",
                body?.base64Encoded === true,
              );
              lastObserverActivityAt = Date.now();
            })
            .catch(() => {
              response.body_classification = {
                classification: "body_unavailable",
              };
              lastObserverActivityAt = Date.now();
            });
        }
      } else if (payload.method === "Runtime.consoleAPICalled") {
        lastObserverActivityAt = Date.now();
        if (params.type === "error") {
          consoleErrors.push({
            phase: currentPhase,
            text: params.args
              ?.map((entry) => entry.value ?? entry.description ?? "")
              .join(" "),
          });
        }
      } else if (payload.method === "Log.entryAdded") {
        lastObserverActivityAt = Date.now();
        const request = requestForId(params.entry?.networkRequestId);
        if (params.entry?.level === "error") {
          consoleErrors.push({
            phase: request?.phase ?? currentPhase,
            text: params.entry?.text ?? "log_entry",
            network_request_id: params.entry?.networkRequestId ?? null,
          });
        } else if (params.entry?.level === "warning") {
          consoleWarnings.push({
            phase: request?.phase ?? currentPhase,
            text: params.entry?.text ?? "log_warning",
            network_request_id: params.entry?.networkRequestId ?? null,
          });
        }
      } else if (payload.method === "Runtime.exceptionThrown") {
        pageErrors.push({
          phase: currentPhase,
          text: params.exceptionDetails?.text ?? "page_exception",
        });
      } else if (payload.method === "Network.loadingFailed") {
        lastObserverActivityAt = Date.now();
        inFlightDocumentRequestIds.delete(params.requestId);
        const request = requestForId(params.requestId);
        const response = responseForId(params.requestId);
        const requestId = String(params.requestId ?? "request-id-unavailable");
        const deliveries = failedRequestDeliveriesById.get(requestId) ?? [];
        const deliveryCardinality = deliveries.length + 1;
        failedRequestDeliverySequence += 1;
        for (const priorDelivery of deliveries) {
          priorDelivery.delivery_cardinality = deliveryCardinality;
          priorDelivery.duplicate_delivery_count = deliveryCardinality - 1;
        }
        const failure = createOperatorRequestFailureEvidenceV1({
          request_id: requestId,
          method: request?.method ?? response?.method ?? "UNKNOWN",
          path: request?.path ?? response?.path ?? null,
          initiating_phase: request?.phase ?? currentPhase,
          observation_phase: currentPhase,
          error_text: params.errorText ?? "request_failed",
          response_status: response?.status ?? null,
          response_classification:
            response?.body_classification?.classification ?? null,
          error_code:
            params.blockedReason ??
            params.corsErrorStatus?.corsError ??
            response?.body_classification?.error_code ??
            null,
          navigation_epoch: request?.navigation_epoch ?? navigationCount,
          delivery_sequence: failedRequestDeliverySequence,
          delivery_cardinality: deliveryCardinality,
          request_type: request?.type ?? response?.type ?? null,
          private_roots: [temp_root, process_temp_root, appRepo],
        });
        deliveries.push(failure);
        failedRequestDeliveriesById.set(requestId, deliveries);
        failedRequests.push(failure);
      } else if (payload.method === "Fetch.requestPaused") {
        const classified = classifyUrl(params.request?.url);
        if (
          [
            "/api/augnes/guide-brief/interpretation",
            "/api/vnext/operator/guide-brief/interpretation",
          ].includes(classified.path)
        ) {
          if (
            pausedGuideBriefInterpretation !== null &&
            pausedGuideBriefInterpretation.request_id === null
          ) {
            pausedGuideBriefInterpretation.request_id = params.requestId;
            pausedGuideBriefInterpretation.post_data =
              params.request?.postData ?? null;
          } else {
            void cdp.send("Fetch.continueRequest", {
              requestId: params.requestId,
            });
          }
          return;
        }
        const action = semanticTransitionAction(params.request);
        if (
          pausedSemanticTransition?.action === action &&
          pausedSemanticTransition.request_id === null
        ) {
          pausedSemanticTransition.request_id = params.requestId;
        } else {
          void cdp.send("Fetch.continueRequest", {
            requestId: params.requestId,
          });
        }
      }
    });
  };

  const start = async () => {
    timing.milestone("operator child startup");
    startRuntime(project_id);
    startChrome();
    try {
      await Promise.all([waitForHttp(`${appOrigin}/`), openCdp()]);
    } catch (error) {
      const diagnostic = runtimeDiagnostic?.diagnostic({
        supervisorExitCode: runtimeProcess?.exitCode ?? null,
        supervisorSignal: runtimeProcess?.signalCode ?? null,
      });
      throw new Error(
        `${error instanceof Error ? error.message : "operator_runtime_start_failed"}:supervisor=${publicToken(diagnostic?.last_supervisor_result_code ?? "none")}:reason=${publicToken(diagnostic?.last_public_reason_code ?? "none")}:database=${publicToken(diagnostic?.database_state ?? "none")}:child_exit=${Number.isInteger(diagnostic?.child_exit_code) ? diagnostic.child_exit_code : "none"}`,
      );
    }
    await assertLoopbackListener(appPort, runtimeProcess);
    timing.milestone("operator child route ready");
  };

  const runPhase = async (phase, action, options = {}) => {
    assert.match(phase, /^[a-z0-9][a-z0-9_]{1,80}$/u);
    currentPhase = phase;
    const started = Date.now();
    process.stdout.write(
      `[browser-e2e] phase_start scope=${child_id} phase=${phase} expected_next=phase_completion\n`,
    );
    try {
      await action();
      if (options.request_quiet !== false) await waitForRequestQuiet();
      timing.duration("phase", phase, Date.now() - started);
      process.stdout.write(
        `[browser-e2e] phase_result scope=${child_id} phase=${phase} status=pass duration_ms=${Date.now() - started}\n`,
      );
    } catch (error) {
      timing.duration("phase", phase, Date.now() - started, "fail");
      process.stdout.write(
        `[browser-e2e] phase_result scope=${child_id} phase=${phase} status=failed\n`,
      );
      throw error;
    }
  };

  const navigate = async (url) => {
    navigationCount += 1;
    const started = Date.now();
    await cdp.send("Page.navigate", { url });
    await waitForCondition(
      `["interactive", "complete"].includes(document.readyState)`,
      `document readiness ${navigationCount}`,
    );
    timing.duration(
      "navigation",
      `navigation ${String(navigationCount).padStart(2, "0")}`,
      Date.now() - started,
    );
  };

  const evaluate = async (expression) => {
    const response = await cdp.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(
        `operator_browser_evaluation_failed:${
          response.exceptionDetails.exception?.description ??
          response.exceptionDetails.text ??
          "exception"
        }`,
      );
    }
    return response.result?.value;
  };

  const waitForCondition = async (
    expression,
    label,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await evaluate(expression).catch(() => false)) {
        recordWait("wait_for_condition", label, started);
        return;
      }
      await delay(100);
    }
    throw new Error(`operator_condition_timeout:${publicToken(label)}`);
  };

  const waitForHostCondition = async (
    predicate,
    label,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await predicate()) {
        recordWait("wait_for_host_condition", label, started);
        return;
      }
      await delay(100);
    }
    throw new Error(`operator_host_condition_timeout:${publicToken(label)}`);
  };

  const waitForRequestQuiet = async () => {
    quietCount += 1;
    const started = Date.now();
    while (Date.now() - started < DEFAULT_TIMEOUT_MS) {
      if (
        inFlightDocumentRequestIds.size === 0 &&
        Date.now() - lastObserverActivityAt >= REQUEST_QUIET_MS
      ) {
        timing.duration(
          "request_quiet",
          `request quiet ${String(quietCount).padStart(2, "0")}`,
          Date.now() - started,
        );
        return;
      }
      await delay(100);
    }
    throw new Error("operator_request_quiet_timeout");
  };

  const setFormControlValue = async (selector, value, index = 0) => {
    assert.equal(
      await evaluate(`(() => {
        const controls = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
        const control = controls[${JSON.stringify(index)}];
        if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return false;
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value')?.set;
        setter?.call(control, ${JSON.stringify(value)});
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`),
      true,
    );
  };

  const authenticate = async ({ audit_bootstrap_replay = false } = {}) => {
    const config = readVNextLocalOperatorPilotConfigV01(
      runtimeEnvironment(activeRuntimeProjectId),
    );
    const database = openVNextLocalOperatorDatabaseV01(config);
    let token;
    try {
      token = issueVNextLocalOperatorBootstrapV01(database, { config })
        .bootstrap_token;
    } finally {
      database.close();
    }
    assert.match(token, /^vnext_bootstrap_v01\./u);
    await waitForCondition(
      `document.querySelector('#vnext-operator-bootstrap-token') !== null`,
      "operator bootstrap input",
    );
    await setFormControlValue("#vnext-operator-bootstrap-token", token);
    assert.equal(
      await evaluate(`(() => {
        const form = document.querySelector('#vnext-operator-bootstrap-token')?.closest('form');
        if (!(form instanceof HTMLFormElement)) return false;
        form.requestSubmit();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
      "operator authenticated session",
    );
    const privateBoundary =
      (await evaluate(
        `!document.documentElement.innerHTML.includes(${JSON.stringify(token)})`,
      )) === true && !runtimeLog.includes(token);
    if (audit_bootstrap_replay) {
      const replay = await evaluate(`(async () => {
        const replayResponse = await fetch('/api/vnext/operator/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ action: 'bootstrap', bootstrap_token: ${JSON.stringify(token)} })
        });
        const sessionResponse = await fetch('/api/vnext/operator/session', {
          method: 'GET', cache: 'no-store', credentials: 'same-origin'
        });
        return {
          replay_status: replayResponse.status,
          replay_body: await replayResponse.json(),
          session_status: sessionResponse.status,
          session_body: await sessionResponse.json(),
          token_in_dom: document.documentElement.innerHTML.includes(${JSON.stringify(token)})
        };
      })()`);
      assert.equal(replay.replay_status, 409);
      assert.equal(replay.replay_body?.error_code, "operator_bootstrap_consumed");
      assert.equal(replay.replay_body?.semantic_authority_granted, false);
      assert.equal(replay.session_status, 200);
      assert.equal(replay.session_body?.status, "authenticated");
      assert.equal(replay.session_body?.semantic_authority_granted, false);
      assert.equal(replay.token_in_dom, false);
      assert.equal(JSON.stringify(replay.session_body).includes(token), false);
    }
    token = null;
    return privateBoundary;
  };

  const restartRuntime = async (activeProjectId = project_id) => {
    await navigate("about:blank");
    await cdp.send("Network.clearBrowserCookies");
    await terminateRuntime();
    startRuntime(activeProjectId);
    await waitForHttp(`${appOrigin}/`);
  };

  const restartRuntimePreservingBrowserSession = async (
    activeProjectId = project_id,
  ) => {
    await navigate("about:blank");
    await terminateRuntime();
    startRuntime(activeProjectId);
    await waitForHttp(`${appOrigin}/`);
  };

  const pauseNextSemanticTransitionRequest = (action) => {
    assert.equal(pausedSemanticTransition, null);
    assert.equal(["preview", "confirm", "apply"].includes(action), true);
    pausedSemanticTransition = { action, request_id: null };
  };

  const waitForPausedSemanticTransitionRequest = async (action) => {
    await waitForHostCondition(
      () =>
        pausedSemanticTransition?.action === action &&
        typeof pausedSemanticTransition.request_id === "string",
      `paused semantic transition ${action}`,
    );
  };

  const releasePausedSemanticTransitionRequest = async (action) => {
    assert.equal(pausedSemanticTransition?.action, action);
    assert.equal(typeof pausedSemanticTransition?.request_id, "string");
    const requestId = pausedSemanticTransition.request_id;
    pausedSemanticTransition = null;
    await cdp.send("Fetch.continueRequest", { requestId });
  };

  const pauseNextGuideBriefInterpretationRequest = () => {
    assert.equal(pausedGuideBriefInterpretation, null);
    pausedGuideBriefInterpretation = {
      request_id: null,
      post_data: null,
    };
  };

  const waitForPausedGuideBriefInterpretationRequest = async () => {
    await waitForHostCondition(
      () => typeof pausedGuideBriefInterpretation?.request_id === "string",
      "paused GuideBrief interpretation",
    );
    return {
      request_id: pausedGuideBriefInterpretation.request_id,
      post_data: pausedGuideBriefInterpretation.post_data,
    };
  };

  const fulfillPausedGuideBriefInterpretationRequest = async (body) => {
    assert.equal(typeof pausedGuideBriefInterpretation?.request_id, "string");
    const requestId = pausedGuideBriefInterpretation.request_id;
    pausedGuideBriefInterpretation = null;
    await cdp.send("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [
        { name: "content-type", value: "application/json" },
        { name: "cache-control", value: "no-store" },
        {
          name: "x-augnes-guidebrief-interpretation",
          value: "bounded-v0.3",
        },
      ],
      body: Buffer.from(JSON.stringify(body), "utf8").toString("base64"),
    });
  };

  const terminateRuntime = async () => {
    if (!runtimeProcess) return;
    const started = Date.now();
    const runtimeStreamSettlementDuration = await terminateProcess(
      runtimeProcess,
      runtimeRecord,
      15_000,
    );
    timing.duration(
      "stream_settlement",
      "runtime owned stream settlement",
      runtimeStreamSettlementDuration,
    );
    timing.duration(
      "runtime_shutdown",
      `runtime shutdown ${String(runtimeShutdownCount + 1).padStart(2, "0")}`,
      Date.now() - started,
    );
    runtimeShutdownCount += 1;
    runtimeProcess = null;
    runtimeRecord = null;
    runtimeClosePromise = null;
    runtimeDiagnostic = null;
  };

  const cleanup = async () => {
    currentPhase = "cleanup";
    const chromeStarted = Date.now();
    if (cdp) await cdp.close().catch(() => undefined);
    cdp = null;
    const chromeStreamSettlementDuration = await terminateProcess(
      chromeProcess,
      chromeRecord,
      2_000,
    );
    timing.duration(
      "stream_settlement",
      "Chrome owned stream settlement",
      chromeStreamSettlementDuration,
    );
    chromeProcess = null;
    chromeRecord = null;
    timing.duration(
      "chrome_cdp_shutdown",
      "Chrome and CDP shutdown",
      Date.now() - chromeStarted,
    );
    await terminateRuntime();
    runtimeLog = "";
    rmSync(temp_root, { recursive: true, force: true });
    if (process_temp_root !== temp_root) {
      rmSync(process_temp_root, { recursive: true, force: true });
    }
  };

  const evidence = async () => ({
    app_origin: appOrigin,
    requests,
    responses,
    console_errors: consoleErrors,
    console_warnings: consoleWarnings,
    page_errors: pageErrors,
    failed_requests: failedRequests,
    external_requests: externalRequests,
    timing_summary: timing.summary(),
    owned_process_residue_count: ownedProcesses.size,
    listener_residue_count: await listenerResidueCount([
      appPort,
      bridgePort,
      debugPort,
    ]),
    runtime_shutdown_complete: runtimeProcess === null,
    chrome_cdp_shutdown_complete: chromeProcess === null && cdp === null,
    profile_removed: !existsSync(profileDirectory),
    runtime_state_removed: !existsSync(runtimeStateDirectory),
    download_directory_removed: !existsSync(downloadDirectory),
    supervisor_exit_diagnostic:
      runtimeDiagnostic?.diagnostic({
        supervisorExitCode: runtimeProcess?.exitCode ?? null,
        supervisorSignal: runtimeProcess?.signalCode ?? null,
      }) ?? null,
  });

  function recordWait(kind, label, started) {
    const duration = Date.now() - started;
    if (duration <= 500) return;
    waitCount += 1;
    timing.duration(
      kind,
      `${publicToken(label)} ${String(waitCount).padStart(3, "0")}`,
      duration,
    );
  }

  const recordFixtureConstruction = (duration) => {
    timing.duration(
      "fixture_construction",
      "operator fixture construction",
      duration,
    );
  };

  const recordGlobalCleanup = (duration) => {
    timing.duration("global_cleanup", "operator global cleanup", duration);
  };

  return Object.freeze({
    child_id,
    app_origin: appOrigin,
    database_path,
    profile_directory: profileDirectory,
    runtime_state_directory: runtimeStateDirectory,
    download_directory: downloadDirectory,
    ports: Object.freeze({ app: appPort, bridge: bridgePort, debug: debugPort }),
    requests,
    responses,
    console_errors: consoleErrors,
    console_warnings: consoleWarnings,
    page_errors: pageErrors,
    failed_requests: failedRequests,
    external_requests: externalRequests,
    start,
    runPhase,
    navigate,
    evaluate,
    evaluateBoolean: async (expression) => Boolean(await evaluate(expression)),
    evaluateString: async (expression) => {
      const value = await evaluate(expression);
      return typeof value === "string" ? value : "";
    },
    evaluateJson: evaluate,
    waitForCondition,
    waitForHostCondition,
    waitForRequestQuiet,
    setFormControlValue,
    authenticate,
    pauseNextSemanticTransitionRequest,
    waitForPausedSemanticTransitionRequest,
    releasePausedSemanticTransitionRequest,
    pauseNextGuideBriefInterpretationRequest,
    waitForPausedGuideBriefInterpretationRequest,
    fulfillPausedGuideBriefInterpretationRequest,
    restartRuntime,
    restartRuntimePreservingBrowserSession,
    terminateRuntime,
    cleanup,
    evidence,
    recordFixtureConstruction,
    recordGlobalCleanup,
    runtimeEnvironment,
    serverLog: () => runtimeLog,
    cdp: () => cdp,
  });
}

function semanticTransitionAction(request) {
  const method = String(request?.method ?? "GET").toUpperCase();
  if (method === "GET") return "preview";
  try {
    const body = JSON.parse(String(request?.postData ?? "{}"));
    return ["confirm", "apply"].includes(body.action) ? body.action : null;
  } catch {
    return null;
  }
}

function classifyInspectorResponseBody(body, base64Encoded) {
  try {
    const text = base64Encoded
      ? Buffer.from(body, "base64").toString("utf8")
      : String(body);
    const parsed = JSON.parse(text);
    if (parsed?.status === "inspector_read" && parsed?.inspector) {
      return {
        classification: "inspector_read",
        status: "inspector_read",
        project_activity: parsed.project_activity ?? null,
        target_kind: parsed.inspector.target?.target_kind ?? null,
        target_status: parsed.inspector.target_status ?? null,
        completeness: parsed.inspector.completeness ?? null,
      };
    }
    return {
      classification: "inspector_error",
      error_code:
        typeof parsed?.error_code === "string" ? parsed.error_code : null,
    };
  } catch {
    return { classification: "body_unparseable" };
  }
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Set();
    this.ws = null;
  }

  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener("message", (message) => {
      const payload = JSON.parse(message.data);
      if (payload.id && this.pending.has(payload.id)) {
        const pending = this.pending.get(payload.id);
        clearTimeout(pending.timeout);
        this.pending.delete(payload.id);
        if (payload.error) pending.reject(new Error(payload.error.message));
        else pending.resolve(payload.result ?? {});
        return;
      }
      for (const handler of this.handlers) handler(payload);
    });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("operator_cdp_open_timeout")),
        DEFAULT_TIMEOUT_MS,
      );
      this.ws.addEventListener(
        "open",
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
      this.ws.addEventListener(
        "error",
        () => {
          clearTimeout(timeout);
          reject(new Error("operator_cdp_open_failed"));
        },
        { once: true },
      );
    });
  }

  send(method, params = {}, sessionId = null) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`operator_cdp_command_timeout:${method}`));
      }, DEFAULT_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws.send(
        JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }),
      );
    });
  }

  session(sessionId) {
    return {
      on: (handler) => {
        this.handlers.add((payload) => {
          if (payload.sessionId === sessionId) handler(payload);
        });
      },
      send: (method, params = {}) => this.send(method, params, sessionId),
      close: () => this.close(),
    };
  }

  async close() {
    if (!this.ws) return;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("operator_cdp_closed"));
    }
    this.pending.clear();
    this.ws.close();
    this.ws = null;
  }
}

function minimalProcessEnvironment() {
  return Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SHELL", "TERM"]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]]),
  );
}

async function waitForHttp(url) {
  const started = Date.now();
  while (Date.now() - started < DEFAULT_TIMEOUT_MS) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return response;
    } catch {
      // Runtime is still starting.
    }
    await delay(100);
  }
  throw new Error("operator_runtime_http_timeout");
}

async function terminateProcess(child, record, gracefulTimeoutMs) {
  if (!child) return 0;
  assert(record, "operator_owned_process_record_missing");
  const started = Date.now();
  if (record.exited || record.closed) {
    await settleOwnedProcessAfterExit(record, {
      streamDrainMs: 500,
      termGraceMs: gracefulTimeoutMs,
      killGraceMs: 2_000,
    });
  } else {
    await terminateOwnedProcessTree(record, {
      termGraceMs: gracefulTimeoutMs,
      killGraceMs: 2_000,
    });
  }
  return Date.now() - started;
}

function classifyUrl(value) {
  try {
    const url = new URL(value);
    const network = ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
    return {
      external: network && !LOCAL_HOSTNAMES.has(url.hostname),
      path: url.pathname,
    };
  } catch {
    return { external: false, path: null };
  }
}

async function assertLoopbackListener(port, child) {
  assert(child);
  assert.equal(child.spawnargs.includes("127.0.0.1"), true);
  assert.equal(await canConnect("127.0.0.1", port), true);
  const addresses = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);
  for (const address of addresses) {
    assert.equal(await canConnect(address, port), false);
  }
}

async function listenerResidueCount(ports) {
  let count = 0;
  for (const port of ports) {
    if (await canConnect("127.0.0.1", port)) count += 1;
  }
  return count;
}

async function canConnect(host, port) {
  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1_000, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function chooseAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("operator_loopback_port_allocation_failed"));
      });
    });
  });
}

function publicToken(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 64);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createOperatorChildTemporaryRootsV1(childId) {
  const safe = childId.replace(/[^a-z0-9-]/gu, "-");
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), `augnes-${safe}-v1-`),
  );
  const canonicalRoot = process.env.AUGNES_CANONICAL_TEMP_ROOT?.trim();
  const processRoot = canonicalRoot
    ? path.resolve(canonicalRoot)
    : mkdtempSync(path.join(tmpdir(), `ag-${safe}-`));
  return { temporary_root: temporaryRoot, process_root: processRoot };
}
