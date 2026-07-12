#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  buildTaskContextPacketHandoffHrefV01,
  decodeTaskContextPacketHandoffSlugV01,
} from "../lib/vnext/task-context-packet-handoff.ts";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const VALIDATION_VERSION =
  "vnext_task_context_packet_handoff_browser_validation.v0.1";
const DEFAULT_TIMEOUT_MS = 45_000;
const REQUEST_QUIET_MS = 500;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const originalUmask = process.umask(0o077);
const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-vnext-packet-handoff-browser-v0-1-"),
);
const fixtureDir = path.join(tempRoot, "fixture");
const chromeProfileDir = path.join(tempRoot, "chrome-profile");
const appRepo = realpathSync(
  process.env.AUGNES_BROWSER_APP_REPO?.trim() || process.cwd(),
);
const chromeCandidates = [
  process.env.AUGNES_BROWSER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

let appPort = null;
let debugPort = null;
let appOrigin = null;
let serverProcess = null;
let chromeProcess = null;
let cdp = null;
let database = null;
let bootstrapToken = null;
let currentPhase = "setup";
let lastRequestAt = Date.now();
let serverLog = "";
const requests = [];
const responses = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];
const assertions = [];

const result = {
  ok: false,
  validation_version: VALIDATION_VERSION,
  fixture_source: "actual_vnext_operator_pilot_compile_result",
  app_repo: appRepo,
  packet_id: null,
  packet_fingerprint: null,
  handoff_href: null,
  document_status: null,
  handoff_api_status: null,
  project_home_exact_href: false,
  refresh_read_only: false,
  malformed_slug_statuses: {},
  missing_fingerprint_private_material_rendered: null,
  wrong_fingerprint_private_material_rendered: null,
  unexpected_external_request_count: 0,
  unexpected_console_error_count: 0,
  credential_material_in_dom: false,
  credential_material_in_server_log: false,
  default_database_accessed: false,
  provider_or_external_network_call: false,
  temporary_profile_removed: false,
  temporary_fixture_removed: false,
  failure: null,
};

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Set();
    this.ws = null;
  }

  async open() {
    this.ws = new WebSocket(this.webSocketUrl);
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
        () => reject(new Error("Timed out opening the Chrome CDP connection.")),
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
        (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        { once: true },
      );
    });
  }

  send(method, params = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for CDP method ${method}.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  onEvent(handler) {
    this.handlers.add(handler);
  }

  async close() {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.resolve({});
    }
    this.pending.clear();
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close();
  }
}

try {
  await main();
  result.ok = true;
} catch (error) {
  result.failure = safeError(error);
  process.exitCode = 1;
} finally {
  bootstrapToken = null;
  await cleanup();
  result.temporary_profile_removed = !existsSync(chromeProfileDir);
  result.temporary_fixture_removed = !existsSync(fixtureDir);
  process.umask(originalUmask);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
  assert.equal(path.isAbsolute(appRepo), true);
  assert.equal(existsSync(path.join(appRepo, "package.json")), true);
  assert.equal(
    realpathSync(tmpdir()) === realpathSync(tempRoot) ||
      realpathSync(tempRoot).startsWith(`${realpathSync(tmpdir())}${path.sep}`),
    true,
    "browser artifacts must stay inside the operating-system temp directory",
  );

  const fixtureSummary = await exportActualCompiledPacketFixture();
  const manifestPath = path.join(
    fixtureDir,
    "operator-pilot-browser-fixture.json",
  );
  const databasePath = path.join(fixtureDir, "operator-pilot.db");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.fixture_version, "vnext_operator_pilot_browser_fixture.v0.1");
  assert.equal(manifest.credential_material_included, false);
  assert.equal(manifest.external_identity_authenticated, false);
  assert.equal(manifest.semantic_authority_granted, false);
  assert.equal(fixtureSummary.status, "pass");
  assert.equal(fixtureSummary.default_database_accessed, false);
  assert.equal(fixtureSummary.external_network_calls, 0);
  assert.equal(fixtureSummary.browser_fixture_export?.exported, true);
  assert.equal(fixtureSummary.full_loop_anchors?.later_packet_id, manifest.packet_id);
  assert.equal(
    fixtureSummary.full_loop_anchors?.later_packet_fingerprint,
    manifest.packet_fingerprint,
  );
  result.default_database_accessed = fixtureSummary.default_database_accessed;

  const handoffHref = buildTaskContextPacketHandoffHrefV01({
    packet_id: manifest.packet_id,
    packet_fingerprint: manifest.packet_fingerprint,
  });
  assert.equal(handoffHref, manifest.handoff_href);
  const parsedHandoffUrl = new URL(handoffHref, "http://127.0.0.1");
  const handoffSlug = parsedHandoffUrl.pathname.split("/").at(-1);
  assert.equal(decodeTaskContextPacketHandoffSlugV01(handoffSlug), manifest.packet_id);
  assert.equal(
    manifest.packet_id.slice("task-context-packet:".length).length,
    TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  );
  record("actual_compile_result_uses_shared_canonical_handoff_href");

  result.packet_id = manifest.packet_id;
  result.packet_fingerprint = manifest.packet_fingerprint;
  result.handoff_href = handoffHref;

  appPort = await chooseAvailablePort();
  debugPort = await chooseAvailablePort();
  appOrigin = `http://127.0.0.1:${appPort}`;
  const runtimeEnvironment = isolatedRuntimeEnvironment({
    databasePath,
    manifest,
  });

  startDevServer(runtimeEnvironment);
  await waitForHttp(`${appOrigin}/workbench/semantic-review`, DEFAULT_TIMEOUT_MS);
  await assertLoopbackListener(appPort);

  const chromeExecutable = chromeCandidates.find((candidate) => existsSync(candidate));
  assert(chromeExecutable, "No usable local Chrome/Chromium executable was found.");
  startChrome(chromeExecutable);
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();

  await runPhase("locked_workbench", async () => {
    const responseStart = responses.length;
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
      "locked Semantic Workbench",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('main')?.getAttribute('data-vnext-private-material-rendered') === 'false'`,
      ),
      true,
    );
    assert.equal(documentStatusSince(responseStart, "/workbench/semantic-review"), 200);
    record("locked_workbench_renders_no_private_material");
  });

  bootstrapToken = await issueBootstrap(runtimeEnvironment);
  await runPhase("synthetic_session_bootstrap", async () => {
    await setBootstrapInput(bootstrapToken);
    await waitForCondition(
      `document.querySelector('#vnext-operator-bootstrap-token')?.value.length > 0 && !document.querySelector('#vnext-operator-bootstrap-token')?.closest('form')?.querySelector('button[type="submit"]')?.disabled`,
      "enabled bootstrap submit control",
    );
    const submitted = await evaluateBoolean(`(() => {
      const form = document.querySelector('#vnext-operator-bootstrap-token')?.closest('form');
      if (!form) return false;
      form.requestSubmit();
      return true;
    })()`);
    assert.equal(submitted, true);
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
      "authenticated synthetic local session",
    );
    const credentialInDom = await evaluateBoolean(
      `document.documentElement.innerHTML.includes(${JSON.stringify(bootstrapToken)})`,
    );
    const credentialInServerLog = serverLog.includes(bootstrapToken);
    result.credential_material_in_dom = credentialInDom;
    result.credential_material_in_server_log = credentialInServerLog;
    assert.equal(credentialInDom, false);
    assert.equal(credentialInServerLog, false);
    record("bootstrap_token_absent_from_dom_and_server_log");
  });
  bootstrapToken = null;

  await runPhase("project_home", async () => {
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-vnext-project-continuity="loaded"]') !== null`,
      "loaded Project Home continuity",
    );
    const exactHref = await evaluateString(`(() => {
      const link = Array.from(document.querySelectorAll('a[href]')).find(
        (candidate) => candidate.textContent?.trim() === 'Open exact packet handoff'
      );
      return link?.getAttribute('href') ?? '';
    })()`);
    result.project_home_exact_href = exactHref === handoffHref;
    if (result.project_home_exact_href) {
      record("project_home_emits_exact_compiled_packet_handoff_href");
    }
  });

  await runPhase("canonical_handoff_navigation", async () => {
    const responseStart = responses.length;
    await navigate(`${appOrigin}${handoffHref}`);
    await waitForHostCondition(
      () =>
        responses
          .slice(responseStart)
          .some(
            (entry) =>
              entry.path === parsedHandoffUrl.pathname && entry.type === "Document",
          ),
      "canonical handoff document response",
    );
    result.document_status = documentStatusSince(
      responseStart,
      parsedHandoffUrl.pathname,
    );
    assert.equal(result.document_status, 200);
    assert.equal(result.project_home_exact_href, true);
    await waitForCondition(
      `document.querySelector('[data-vnext-packet-handoff-loaded="true"]') !== null`,
      "loaded packet handoff surface",
    );
    const pageState = await evaluateJson(`(() => ({
      loaded: document.querySelector('[data-vnext-packet-handoff-loaded="true"]') !== null,
      private_material: document.querySelector('main')?.getAttribute('data-vnext-private-material-rendered'),
      packet_id_present: document.body?.innerText.includes(${JSON.stringify(manifest.packet_id)}) ?? false,
      packet_fingerprint_present: document.body?.innerText.includes(${JSON.stringify(manifest.packet_fingerprint)}) ?? false
    }))()`);
    assert.deepEqual(pageState, {
      loaded: true,
      private_material: "true",
      packet_id_present: true,
      packet_fingerprint_present: true,
    });
    const handoffApiResponse = responses
      .slice(responseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/operator/packet-handoff" &&
          entry.status === 200,
      );
    assert(handoffApiResponse, "The exact authenticated handoff API read did not succeed.");
    result.handoff_api_status = handoffApiResponse.status;
    record("canonical_generated_packet_renders_through_page_and_api");
  });

  database = new Database(databasePath, { readonly: true, fileMustExist: true });
  const beforeRefresh = databaseSnapshot(database);
  const requestStart = requests.length;
  const responseStart = responses.length;
  await runPhase("read_only_refresh", async () => {
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () =>
        responses
          .slice(responseStart)
          .some(
            (entry) =>
              entry.path === parsedHandoffUrl.pathname &&
              entry.type === "Document" &&
              entry.status === 200,
          ),
      "refreshed handoff document response",
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-packet-handoff-loaded="true"]') !== null`,
      "refreshed packet handoff surface",
    );
  });
  const afterRefresh = databaseSnapshot(database);
  assert.deepEqual(afterRefresh, beforeRefresh);
  assert.equal(
    requests.slice(requestStart).some((request) => request.method === "POST"),
    false,
  );
  result.refresh_read_only = true;
  record("handoff_refresh_is_get_only_and_database_stable");

  await validateMalformedSlugs(handoffSlug, manifest.packet_id);
  await validateMissingAndWrongFingerprint({ handoffSlug, manifest });

  const unexpectedConsoleErrors = consoleErrors.filter(
    (entry) =>
      !(
        (entry.path === "/favicon.ico" && /404/i.test(entry.text)) ||
        (entry.phase === "locked_workbench" &&
          entry.path?.startsWith("/api/vnext/operator/") &&
          /401/i.test(entry.text)) ||
        (entry.phase === "wrong_fingerprint" &&
          entry.path === "/api/vnext/operator/packet-handoff" &&
          /409/i.test(entry.text))
      ),
  );
  const unexpectedFailedRequests = failedRequests.filter(
    (entry) => entry.error_text !== "net::ERR_ABORTED",
  );
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(unexpectedConsoleErrors, []);
  assert.deepEqual(unexpectedFailedRequests, []);
  assert.deepEqual(externalRequests, []);
  assert.equal(
    requests.some(
      (request) =>
        request.path?.startsWith("/api/") &&
        /provider|openai|native-host/i.test(request.path),
    ),
    false,
  );
  const postBootstrapMutations = requests.filter(
    (request) =>
      request.method === "POST" &&
      !(
        request.phase === "synthetic_session_bootstrap" &&
        request.path === "/api/vnext/operator/session"
      ),
  );
  assert.deepEqual(postBootstrapMutations, []);

  result.unexpected_external_request_count = externalRequests.length;
  result.unexpected_console_error_count = unexpectedConsoleErrors.length;
  result.provider_or_external_network_call = false;
  assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
  result.default_database_accessed = false;
  record("browser_network_console_credential_and_integrity_boundaries_hold");
}

async function exportActualCompiledPacketFixture() {
  const completed = await runCapture(
    "npm",
    ["run", "smoke:vnext-operator-pilot-v0-1"],
    {
      cwd: process.cwd(),
      env: {
        ...minimalProcessEnvironment(),
        AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR: fixtureDir,
      },
      timeoutMs: 180_000,
    },
  );
  assert.equal(
    completed.code,
    0,
    `operator-pilot fixture export failed with exit ${completed.code}`,
  );
  const jsonStart = completed.stdout.indexOf("{\n");
  assert(jsonStart >= 0, "operator-pilot smoke summary missing");
  return JSON.parse(completed.stdout.slice(jsonStart));
}

function isolatedRuntimeEnvironment({ databasePath, manifest }) {
  return {
    ...minimalProcessEnvironment(),
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_DB_PATH: databasePath,
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: manifest.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: manifest.project_id,
    AUGNES_VNEXT_OPERATOR_ID: manifest.operator_id,
  };
}

function minimalProcessEnvironment() {
  return Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SHELL", "TERM"]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]]),
  );
}

function startDevServer(environment) {
  serverProcess = spawn(
    "npm",
    [
      "run",
      "dev",
      "--",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(appPort),
    ],
    {
      cwd: appRepo,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  for (const stream of [serverProcess.stdout, serverProcess.stderr]) {
    stream.on("data", (chunk) => {
      serverLog = `${serverLog}${chunk.toString("utf8")}`.slice(-128 * 1024);
    });
  }
}

function startChrome(executable) {
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
      `--user-data-dir=${chromeProfileDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"], detached: true },
  );
}

async function issueBootstrap(environment) {
  const completed = await runCapture(
    "npm",
    ["run", "vnext:operator-pilot", "--", "issue-session"],
    { cwd: appRepo, env: environment, timeoutMs: DEFAULT_TIMEOUT_MS },
  );
  assert.equal(completed.code, 0, "bootstrap issuance failed");
  const lines = completed.stdout.trimEnd().split("\n");
  const markerIndex = lines.indexOf(
    "Augnes vNext local operator bootstrap token (shown once):",
  );
  assert(markerIndex >= 0, "bootstrap marker missing from CLI output");
  const token = lines[markerIndex + 1] ?? "";
  assert.match(token, /^vnext_bootstrap_v01\./);
  return token;
}

async function setBootstrapInput(token) {
  const changed = await evaluateBoolean(`(() => {
    const input = document.querySelector('#vnext-operator-bootstrap-token');
    if (!(input instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) return false;
    setter.call(input, ${JSON.stringify(token)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  assert.equal(changed, true);
}

async function validateMalformedSlugs(canonicalSlug, packetId) {
  const suffix = packetId.slice("task-context-packet:".length);
  const malformed = {
    suffix_22: `task-context-packet~${suffix.slice(0, 22)}`,
    suffix_24: `task-context-packet~${suffix}a`,
    suffix_25: `task-context-packet~${suffix}aa`,
    uppercase_hex: `task-context-packet~${suffix.toUpperCase()}`,
    wrong_prefix: `wrong-prefix~${suffix}`,
    raw_colon_segment: packetId,
    extra_separator: `task-context-packet~~${suffix}`,
    trailing_material: `${canonicalSlug}-extra`,
  };
  for (const [label, slug] of Object.entries(malformed)) {
    const response = await fetch(
      `${appOrigin}/workbench/semantic-review/packet-handoff/${slug}`,
      { redirect: "manual" },
    );
    result.malformed_slug_statuses[label] = response.status;
    assert.equal(response.status, 404, `${label} must remain a 404`);
  }
  record("malformed_22_24_25_uppercase_prefix_colon_and_separator_slugs_rejected");
}

async function validateMissingAndWrongFingerprint({ handoffSlug, manifest }) {
  await runPhase("missing_fingerprint", async () => {
    const requestStart = requests.length;
    await navigate(
      `${appOrigin}/workbench/semantic-review/packet-handoff/${handoffSlug}`,
    );
    await waitForCondition(
      `document.querySelector('main')?.getAttribute('data-vnext-packet-handoff-state') === 'invalid_binding'`,
      "missing-fingerprint closed surface",
    );
    const privateMaterial = await evaluateString(
      `document.querySelector('main')?.getAttribute('data-vnext-private-material-rendered') ?? ''`,
    );
    assert.equal(privateMaterial, "false");
    assert.equal(
      requests
        .slice(requestStart)
        .some((request) => request.path === "/api/vnext/operator/packet-handoff"),
      false,
    );
    result.missing_fingerprint_private_material_rendered = false;
  });
  record("missing_fingerprint_exposes_no_private_packet_material");

  await runPhase("wrong_fingerprint", async () => {
    const responseStart = responses.length;
    const wrongFingerprint = `sha256:${"f".repeat(64)}`;
    await navigate(
      `${appOrigin}/workbench/semantic-review/packet-handoff/${handoffSlug}?packet_fingerprint=${encodeURIComponent(
        wrongFingerprint,
      )}`,
    );
    await waitForCondition(
      `['error', 'disabled'].includes(document.querySelector('main')?.getAttribute('data-vnext-packet-handoff-state'))`,
      "wrong-fingerprint closed surface",
    );
    const privateMaterial = await evaluateString(
      `document.querySelector('main')?.getAttribute('data-vnext-private-material-rendered') ?? ''`,
    );
    assert.equal(privateMaterial, "false");
    assert.equal(
      await evaluateBoolean(
        `document.body?.innerText.includes(${JSON.stringify(manifest.packet_id)}) ?? false`,
      ),
      false,
    );
    const response = responses
      .slice(responseStart)
      .find((entry) => entry.path === "/api/vnext/operator/packet-handoff");
    assert(response && response.status >= 400);
    result.wrong_fingerprint_private_material_rendered = false;
  });
  record("wrong_packet_fingerprint_fails_closed");
}

async function openCdpPage() {
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, DEFAULT_TIMEOUT_MS);
  const response = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?about:blank`,
    { method: "PUT" },
  );
  assert.equal(response.ok, true);
  const target = await response.json();
  assert(target.webSocketDebuggerUrl);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();
  return client;
}

async function enableCdpDomains() {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Log.enable");
  await cdp.send("Fetch.enable", {
    patterns: [{ urlPattern: "*", requestStage: "Request" }],
  });
}

function attachCdpObservers() {
  cdp.onEvent((event) => {
    if (event.method === "Fetch.requestPaused") {
      const url = String(event.params?.request?.url ?? "");
      const classification = classifyUrl(url);
      if (classification.external) {
        externalRequests.push({ phase: currentPhase, path: classification.path });
        void cdp.send("Fetch.failRequest", {
          requestId: event.params.requestId,
          errorReason: "BlockedByClient",
        }).catch(() => undefined);
      } else {
        void cdp.send("Fetch.continueRequest", {
          requestId: event.params.requestId,
        }).catch(() => undefined);
      }
      return;
    }
    if (event.method === "Network.requestWillBeSent") {
      const request = event.params?.request ?? {};
      const classification = classifyUrl(String(request.url ?? ""));
      requests.push({
        phase: currentPhase,
        method: String(request.method ?? "GET").toUpperCase(),
        path: classification.path,
        type: String(event.params?.type ?? "unknown"),
      });
      if (classification.external) {
        externalRequests.push({ phase: currentPhase, path: classification.path });
      }
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.responseReceived") {
      const response = event.params?.response ?? {};
      const classification = classifyUrl(String(response.url ?? ""));
      responses.push({
        phase: currentPhase,
        path: classification.path,
        status: Number(response.status ?? 0),
        type: String(event.params?.type ?? "unknown"),
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.loadingFailed") {
      if (String(event.params?.type ?? "") === "WebSocket") return;
      failedRequests.push({
        phase: currentPhase,
        error_text: String(event.params?.errorText ?? "request_failed"),
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Runtime.exceptionThrown") {
      pageErrors.push({ phase: currentPhase });
      return;
    }
    if (event.method === "Runtime.consoleAPICalled") {
      if (event.params?.type !== "error") return;
      consoleErrors.push({
        phase: currentPhase,
        path: null,
        text: (event.params?.args ?? [])
          .map((argument) => String(argument.value ?? argument.description ?? ""))
          .join(" ")
          .slice(0, 240),
      });
      return;
    }
    if (event.method === "Log.entryAdded" && event.params?.entry?.level === "error") {
      const classification = classifyUrl(String(event.params.entry.url ?? ""));
      consoleErrors.push({
        phase: currentPhase,
        path: classification.path,
        text: String(event.params.entry.text ?? "log_error").slice(0, 240),
      });
    }
  });
}

function classifyUrl(value) {
  try {
    const url = new URL(value);
    const networkProtocol = ["http:", "https:", "ws:", "wss:"].includes(
      url.protocol,
    );
    const local = networkProtocol && LOCAL_HOSTNAMES.has(url.hostname);
    return {
      external: networkProtocol && !local,
      path: url.pathname,
    };
  } catch {
    return { external: false, path: null };
  }
}

async function runPhase(phase, action) {
  currentPhase = phase;
  await action();
  await waitForRequestQuiet();
}

async function navigate(url) {
  await cdp.send("Page.navigate", { url });
  await waitForCondition(
    `["interactive", "complete"].includes(document.readyState)`,
    `document readiness for ${new URL(url).pathname}`,
  );
}

async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(
      `Browser evaluation failed: ${response.exceptionDetails.text ?? "exception"}`,
    );
  }
  return response.result?.value;
}

async function evaluateBoolean(expression) {
  return Boolean(await evaluate(expression));
}

async function evaluateString(expression) {
  const value = await evaluate(expression);
  return typeof value === "string" ? value : "";
}

async function evaluateJson(expression) {
  return await evaluate(expression);
}

async function waitForCondition(expression, label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await evaluateBoolean(expression).catch(() => false)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function waitForHostCondition(predicate, label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function waitForRequestQuiet() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    if (Date.now() - lastRequestAt >= REQUEST_QUIET_MS) return;
    await delay(100);
  }
  throw new Error("Timed out waiting for browser request quiet.");
}

function documentStatusSince(startIndex, pathname) {
  return (
    responses
      .slice(startIndex)
      .find((entry) => entry.path === pathname && entry.type === "Document")
      ?.status ?? null
  );
}

function databaseSnapshot(db) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
  const counts = Object.fromEntries(
    tables.map((table) => [
      table,
      db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get()
        .count,
    ]),
  );
  const canonical = JSON.stringify(counts);
  return {
    data_version: db.pragma("data_version", { simple: true }),
    integrity_check: db.pragma("integrity_check", { simple: true }),
    table_count_hash: createHash("sha256").update(canonical).digest("hex"),
    counts,
  };
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function assertLoopbackListener(port) {
  const completed = await runCapture(
    "lsof",
    ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"],
    { cwd: appRepo, env: minimalProcessEnvironment(), timeoutMs: 10_000 },
  );
  assert.equal(completed.code, 0);
  assert.match(completed.stdout, new RegExp(`127\\.0\\.0\\.1:${port}\\s+\\(LISTEN\\)`));
  assert.doesNotMatch(completed.stdout, new RegExp(`\\*:${port}\\s+\\(LISTEN\\)`));
  record("next_runtime_listener_is_loopback_only");
}

async function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (serverProcess?.exitCode !== null && serverProcess?.exitCode !== undefined) {
      throw new Error(`Next runtime exited early with code ${serverProcess.exitCode}.`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return response;
    } catch {
      // The loopback runtime may still be compiling.
    }
    await delay(200);
  }
  throw new Error("Timed out waiting for the loopback runtime.");
}

async function chooseAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("Unable to allocate a loopback port."));
      });
    });
  });
}

async function runCapture(command, args, { cwd, env, timeoutMs }) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout = `${stdout}${chunk.toString("utf8")}`.slice(-512 * 1024);
    });
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk.toString("utf8")}`.slice(-128 * 1024);
    });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out.`));
    }, timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

async function cleanup() {
  if (database) {
    database.close();
    database = null;
  }
  if (cdp) await cdp.close().catch(() => undefined);
  cdp = null;
  await terminateProcess(chromeProcess);
  await terminateProcess(serverProcess);
  chromeProcess = null;
  serverProcess = null;
  serverLog = "";
  rmSync(tempRoot, { recursive: true, force: true });
}

async function terminateProcess(child) {
  if (!child || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(1_000),
  ]);
  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

function record(id) {
  assertions.push(id);
}

function safeError(error) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`.slice(0, 500)
    : "unknown_browser_validation_failure";
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
