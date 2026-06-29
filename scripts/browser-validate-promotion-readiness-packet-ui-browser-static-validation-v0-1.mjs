#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const sliceName = "promotion_readiness_packet_ui_browser_static_validation_v0_1";
const validationVersion = "promotion_readiness_packet_ui_browser_static_validation.v0.1";
const routeTested = "/perspective/promotion/readiness-packet";
const reportPath =
  "reports/browser/2026-06-29-promotion-readiness-packet-ui-browser-static-validation.md";
const artifactDir = path.join(
  tmpdir(),
  `augnes-promotion-readiness-packet-ui-browser-static-validation-v0-1-${process.pid}`,
);
const chromeProfileDir = path.join(artifactDir, "chrome-profile");
const localHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const requestQuietMs = 500;
const defaultTimeoutMs = 20_000;
const forbiddenMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const systemBrowserExecutableCandidates = [
  process.env.AUGNES_BROWSER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const requiredVisibleCopy = [
  "Promotion Readiness Packet Read/Display",
  "Promotion Readiness Packet Read/Display Binding",
  "Readiness is not promotion",
  "Validation pass is not truth/proof/approval/product readiness",
  "human_signoff_completed",
  "false",
  "human_review_still_required",
  "true",
  "promotion_execution",
  "promotion_decision_write",
  "product_write",
  "proof_or_evidence_creation",
  "durable_state_apply",
  "formation_receipt_write",
  "accepted_evidence_ref_write",
  "product_id_allocation",
  "readiness summary",
  "source/basis refs",
  "blocking items",
  "missing prerequisites",
  "public-safe evidence summary",
  "boundary summary",
  "next allowed non-authority actions",
  "blocked authority actions",
  "PR #856",
  "PR #857",
  "PR #858",
  "PR #859",
  "No action controls",
];

const forbiddenActionLabelPatterns = [
  /\bapprove\b/i,
  /\bpromote\b/i,
  /\bpublish\b/i,
  /\brelease\b/i,
  /\bwrite\b/i,
  /\bcommit\b/i,
  /\baccept\b/i,
  /\bsend\b/i,
  /execute\s+promotion/i,
  /create\s+proof/i,
  /create\s+evidence/i,
  /product[-\s]?write/i,
  /create\s+formation\s+receipt/i,
  /allocate\s+product\s+id/i,
];

const forbiddenRouteMatchers = [
  {
    id: "api_route_call_from_static_ui",
    matches: (pathName) => pathName.startsWith("/api/"),
  },
  {
    id: "promotion_decision_or_execution_route",
    matches: (pathName) =>
      /^\/api\/.*(?:promotion.*(?:decision|execute|execution)|promote)/i.test(pathName),
  },
  {
    id: "product_write_route",
    matches: (pathName) => /^\/api\/.*product[-_]?write/i.test(pathName),
  },
  {
    id: "proof_or_evidence_route",
    matches: (pathName) => /^\/api\/.*(?:proof|evidence)/i.test(pathName),
  },
  {
    id: "formation_receipt_write_route",
    matches: (pathName) => /^\/api\/.*formation[-_]?receipt/i.test(pathName),
  },
  {
    id: "github_route",
    matches: (pathName) => /^\/api\/.*github/i.test(pathName),
  },
  {
    id: "release_route",
    matches: (pathName) => /^\/api\/.*release/i.test(pathName),
  },
  {
    id: "provider_route",
    matches: (pathName) => /^\/api\/.*(?:provider|openai)/i.test(pathName),
  },
  {
    id: "source_fetch_route",
    matches: (pathName) => /^\/api\/.*source.*(?:fetch|crawl|intake)/i.test(pathName),
  },
  {
    id: "retrieval_expansion_route",
    matches: (pathName) => /^\/api\/.*(?:retrieval|index).*(?:rebuild|search|query)/i.test(pathName),
  },
];

let selectedPort = null;
let debugPort = null;
let appUrl = null;
let browserExecutablePath = null;
let devServerProcess = null;
let chromeProcess = null;
let cdp = null;
let currentPhase = "setup";
let lastRequestAt = Date.now();

const requestLog = [];
const responseLog = [];
const failedRequests = [];
const consoleMessages = [];
const pageErrors = [];
const assertions = [];

const state = {
  page_loaded: false,
  visible_assertions: {
    required_count: requiredVisibleCopy.length,
    missing: [],
  },
  action_controls: {
    control_count: 0,
    action_like_control_count: 0,
  },
  request_summary: {
    request_count: 0,
    response_count: 0,
    failed_request_count: 0,
    external_request_count: 0,
    api_request_count: 0,
    forbidden_method_count: 0,
    forbidden_route_count: 0,
    local_loopback_request_count: 0,
  },
  final_status: "fail",
  failure: null,
};

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.eventHandlers = new Set();
    this.waiters = [];
    this.ws = null;
  }

  async open() {
    this.ws = new WebSocket(this.webSocketUrl);
    this.ws.addEventListener("message", (message) => {
      const payload = JSON.parse(message.data);
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject, timeout } = this.pending.get(payload.id);
        clearTimeout(timeout);
        this.pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result ?? {});
        return;
      }
      for (const handler of this.eventHandlers) handler(payload);
      for (const waiter of [...this.waiters]) {
        if (payload.method === waiter.method) {
          clearTimeout(waiter.timeout);
          this.waiters.splice(this.waiters.indexOf(waiter), 1);
          waiter.resolve(payload);
        }
      }
    });
    this.ws.addEventListener("error", (event) => {
      for (const { reject, timeout } of this.pending.values()) {
        clearTimeout(timeout);
        reject(event);
      }
      this.pending.clear();
    });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Timed out opening DevTools WebSocket.")),
        defaultTimeoutMs,
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
        (event) => {
          clearTimeout(timeout);
          reject(event);
        },
        { once: true },
      );
    });
  }

  send(method, params = {}, timeoutMs = defaultTimeoutMs) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = { id, method, params };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for CDP method ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify(payload));
    });
  }

  waitForEvent(method, timeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = {
        method,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.waiters.splice(this.waiters.indexOf(waiter), 1);
          reject(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  onEvent(handler) {
    this.eventHandlers.add(handler);
  }

  async close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
  }
}

try {
  await main();
} catch (error) {
  state.failure = safeError(error);
  state.final_status = "fail";
  throw error;
} finally {
  await cleanup();
  finalizeState();
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, renderMarkdownReport(), "utf8");
  const summary = publicJsonSummary();
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function main() {
  rmSync(artifactDir, { recursive: true, force: true });
  await mkdir(artifactDir, { recursive: true });

  selectedPort = await chooseAvailablePort();
  debugPort = await chooseAvailablePort();
  appUrl = `http://127.0.0.1:${selectedPort}${routeTested}`;

  browserExecutablePath = findBrowserExecutablePath();
  if (!browserExecutablePath) {
    throw new Error("No usable system Chrome/Chromium executable was found.");
  }

  startDevServer();
  await waitForHttp(appUrl, defaultTimeoutMs);

  startChrome();
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();
  await validateStaticUi();

  const failed = assertions.filter((assertion) => !assertion.passed);
  state.final_status = failed.length === 0 ? "pass" : "fail";
  if (failed.length > 0) {
    throw new Error(`Browser validation failed: ${failed.map((item) => item.id).join(", ")}`);
  }
}

async function validateStaticUi() {
  await runPhase("page_load", async () => {
    await setViewport({ width: 1440, height: 1200, mobile: false });
    await navigate(appUrl);
    await waitForText("Promotion Readiness Packet Read/Display");
    state.page_loaded = true;
    recordAssertion("page_load", true, "Route loaded and required page heading was visible.");
  });

  await runPhase("visible_copy", async () => {
    const visibleText = await evaluateString("document.body?.innerText ?? ''");
    const normalizedVisibleText = normalizeForSearch(visibleText);
    const missing = requiredVisibleCopy.filter(
      (phrase) => !normalizedVisibleText.includes(normalizeForSearch(phrase)),
    );
    state.visible_assertions.missing = missing;
    recordAssertion(
      "required_visible_copy",
      missing.length === 0,
      "All required read/display visible copy assertions were present.",
      {
        required_count: requiredVisibleCopy.length,
        missing_count: missing.length,
        missing,
      },
    );
    const statusPairs = await evaluateJson(`(() => {
      const grid = document.querySelector('[aria-label="Read/display status flags"]');
      if (!grid) return [];
      return Array.from(grid.children).map((item) => ({
        label: item.querySelector("span")?.innerText?.trim() ?? "",
        value: item.querySelector("code")?.innerText?.trim() ?? ""
      }));
    })()`);
    const humanSignoffFalse = statusPairs.some(
      (item) => item.label === "human_signoff_completed" && item.value === "false",
    );
    const humanReviewRequired = statusPairs.some(
      (item) => item.label === "human_review_still_required" && item.value === "true",
    );
    recordAssertion(
      "human_review_flags_visible",
      humanSignoffFalse && humanReviewRequired,
      "Visible UI still indicates human_signoff_completed false and human_review_still_required true.",
    );
  });

  await runPhase("no_action_controls", async () => {
    const controls = await evaluateJson(`(() => {
      const selector = [
        "button",
        "form",
        "input",
        "select",
        "textarea",
        "a[href]",
        "[role='button']",
        "[role='link']",
        "[role='menuitem']",
        "[onclick]"
      ].join(",");
      const isVisible = (element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getAttribute("aria-hidden") !== "true" &&
          rect.width >= 0 &&
          rect.height >= 0;
      };
      return Array.from(document.body.querySelectorAll(selector))
        .filter(isVisible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute("role") || "",
          label: [
            element.getAttribute("aria-label") || "",
            element.getAttribute("title") || "",
            element.value || "",
            element.innerText || element.textContent || ""
          ].join(" ").replace(/\\s+/g, " ").trim().slice(0, 160),
          href: element.tagName.toLowerCase() === "a" ? "link_present" : ""
        }));
    })()`);
    const actionLikeControls = controls.filter((control) =>
      forbiddenActionLabelPatterns.some((pattern) => pattern.test(control.label)),
    );
    state.action_controls.control_count = controls.length;
    state.action_controls.action_like_control_count = actionLikeControls.length;
    recordAssertion(
      "no_buttons_forms_links_or_click_controls",
      controls.length === 0,
      "No button/form/input/link/click-action controls were present.",
      { control_count: controls.length },
    );
    recordAssertion(
      "no_forbidden_action_affordance_labels",
      actionLikeControls.length === 0,
      "No action-like controls used approve/promote/publish/release/write/commit/accept/send/proof/evidence/product-write labels.",
      {
        action_like_control_count: actionLikeControls.length,
        labels: actionLikeControls.map((control) => control.label),
      },
    );
  });

  await runPhase("network_boundary", async () => {
    await waitForRequestQuiet();
    assertRequestBoundary();
  });
}

function assertRequestBoundary() {
  const writeMethodRequests = requestLog.filter((request) => forbiddenMethods.has(request.method));
  const apiRequests = requestLog.filter((request) => request.path?.startsWith("/api/"));
  const externalRequests = requestLog.filter((request) => request.is_external);
  const forbiddenRouteRequests = requestLog.filter(
    (request) => request.forbidden_reasons.length > 0,
  );

  state.request_summary = {
    request_count: requestLog.length,
    response_count: responseLog.length,
    failed_request_count: failedRequests.length,
    external_request_count: externalRequests.length,
    api_request_count: apiRequests.length,
    forbidden_method_count: writeMethodRequests.length,
    forbidden_route_count: forbiddenRouteRequests.length,
    local_loopback_request_count: requestLog.filter((request) => request.is_local_loopback).length,
  };

  recordAssertion(
    "no_post_put_patch_delete_requests",
    writeMethodRequests.length === 0,
    "No POST, PUT, PATCH, or DELETE browser requests were observed.",
    { forbidden_method_count: writeMethodRequests.length },
  );
  recordAssertion(
    "no_api_calls_from_static_ui",
    apiRequests.length === 0,
    "The static read/display UI made no /api calls.",
    { api_request_count: apiRequests.length },
  );
  recordAssertion(
    "no_forbidden_route_calls",
    forbiddenRouteRequests.length === 0,
    "No promotion decision, product-write, proof/evidence, Formation Receipt, GitHub, release, provider, source-fetch, or retrieval expansion routes were observed.",
    { forbidden_route_count: forbiddenRouteRequests.length },
  );
  recordAssertion(
    "no_external_non_loopback_requests",
    externalRequests.length === 0,
    "No external non-loopback browser requests were observed.",
    { external_request_count: externalRequests.length },
  );
}

async function openCdpPage() {
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, defaultTimeoutMs);
  const newTargetResponse = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?about:blank`,
    { method: "PUT" },
  );
  if (!newTargetResponse.ok) {
    throw new Error(`Chrome target creation failed: ${newTargetResponse.status}`);
  }
  const target = await newTargetResponse.json();
  if (!target.webSocketDebuggerUrl) {
    throw new Error("Chrome target did not expose a DevTools WebSocket URL.");
  }
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();
  return client;
}

async function enableCdpDomains() {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Log.enable");
}

function attachCdpObservers() {
  cdp.onEvent((event) => {
    if (event.method === "Network.requestWillBeSent") {
      const request = event.params?.request ?? {};
      const method = String(request.method ?? "GET").toUpperCase();
      const classified = classifyRequest(request.url, method);
      requestLog.push({
        phase: currentPhase,
        method,
        path: classified.path,
        resource_type: event.params?.type ?? "unknown",
        is_local_loopback: classified.is_local_loopback,
        is_external: classified.is_external,
        forbidden_reasons: classified.forbidden_reasons,
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.responseReceived") {
      const response = event.params?.response ?? {};
      const classified = classifyRequest(response.url, "GET");
      responseLog.push({
        phase: currentPhase,
        path: classified.path,
        status: response.status,
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.loadingFailed") {
      const type = String(event.params?.type ?? "unknown");
      if (type === "WebSocket") return;
      failedRequests.push({
        phase: currentPhase,
        type,
        error_text: String(event.params?.errorText ?? "request_failed").slice(0, 160),
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Runtime.consoleAPICalled") {
      consoleMessages.push({
        phase: currentPhase,
        type: event.params?.type ?? "unknown",
        text: (event.params?.args ?? [])
          .map((arg) => String(arg.value ?? arg.description ?? ""))
          .join(" ")
          .slice(0, 240),
      });
      return;
    }
    if (event.method === "Runtime.exceptionThrown") {
      pageErrors.push({
        phase: currentPhase,
        text: String(event.params?.exceptionDetails?.text ?? "exception").slice(0, 240),
      });
      return;
    }
    if (event.method === "Log.entryAdded") {
      const entry = event.params?.entry;
      if (entry?.level === "error") {
        consoleMessages.push({
          phase: currentPhase,
          type: "error",
          text: String(entry.text ?? "log_error").slice(0, 240),
        });
      }
    }
  });
}

function classifyRequest(urlValue, method) {
  let url = null;
  try {
    url = new URL(urlValue);
  } catch {
    return {
      path: null,
      is_local_loopback: false,
      is_external: false,
      forbidden_reasons: [],
    };
  }
  const isHttp = ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
  const isLocalLoopback = isHttp && localHostnames.has(url.hostname);
  const pathName = url.pathname;
  const forbiddenReasons = [];
  if (isHttp && !isLocalLoopback) forbiddenReasons.push("external_non_loopback_request");
  if (forbiddenMethods.has(method.toUpperCase())) {
    forbiddenReasons.push("forbidden_write_method");
  }
  for (const matcher of forbiddenRouteMatchers) {
    if (matcher.matches(pathName)) forbiddenReasons.push(matcher.id);
  }
  return {
    path: pathName,
    is_local_loopback: isLocalLoopback,
    is_external: isHttp && !isLocalLoopback,
    forbidden_reasons: [...new Set(forbiddenReasons)],
  };
}

async function runPhase(phase, action) {
  currentPhase = phase;
  await action();
  await waitForRequestQuiet();
}

async function navigate(url) {
  await cdp.send("Page.navigate", { url });
  await cdp.waitForEvent("Page.loadEventFired", defaultTimeoutMs).catch(() => undefined);
  await waitForReadyState();
}

async function setViewport({ width, height, mobile }) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}

async function waitForReadyState() {
  await waitForCondition(
    `["interactive", "complete"].includes(document.readyState)`,
    defaultTimeoutMs,
    "document readyState",
  );
}

async function waitForText(text) {
  await waitForCondition(
    `document.body && document.body.innerText.includes(${JSON.stringify(text)})`,
    defaultTimeoutMs,
    `text ${text}`,
  );
}

async function waitForCondition(expression, timeoutMs, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await evaluateBoolean(expression).catch(() => false)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(`Runtime.evaluate failed: ${response.exceptionDetails.text ?? "exception"}`);
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
  const value = await evaluate(expression);
  return Array.isArray(value) || (value && typeof value === "object") ? value : [];
}

function recordAssertion(id, passed, description, details = {}) {
  assertions.push({ id, passed: Boolean(passed), description, details });
}

function finalizeState() {
  const writeMethodRequests = requestLog.filter((request) => forbiddenMethods.has(request.method));
  const apiRequests = requestLog.filter((request) => request.path?.startsWith("/api/"));
  const externalRequests = requestLog.filter((request) => request.is_external);
  const forbiddenRouteRequests = requestLog.filter(
    (request) => request.forbidden_reasons.length > 0,
  );
  state.request_summary = {
    request_count: requestLog.length,
    response_count: responseLog.length,
    failed_request_count: failedRequests.length,
    external_request_count: externalRequests.length,
    api_request_count: apiRequests.length,
    forbidden_method_count: writeMethodRequests.length,
    forbidden_route_count: forbiddenRouteRequests.length,
    local_loopback_request_count: requestLog.filter((request) => request.is_local_loopback).length,
  };
}

function renderMarkdownReport() {
  const passedAssertions = assertions.filter((assertion) => assertion.passed).length;
  const failedAssertions = assertions.filter((assertion) => !assertion.passed);
  const visibleStatus =
    state.visible_assertions.missing.length === 0
      ? `pass; ${requiredVisibleCopy.length} required visible copy assertions present`
      : `fail; missing ${state.visible_assertions.missing.length} required visible copy assertions`;
  const noActionStatus =
    state.action_controls.control_count === 0 && state.action_controls.action_like_control_count === 0
      ? "pass; no buttons, forms, links, click handlers, or action-like affordances observed"
      : "fail; action controls or action-like affordances observed";
  const requestSummary = state.request_summary;
  const knownWarnings =
    requestSummary.failed_request_count === 0
      ? "None beyond expected local dev-server page asset traffic."
      : "Local failed request metadata was observed; no raw browser dump or response body is included.";
  const finalStatus =
    state.final_status === "pass"
      ? "pass; browser/static validation remains non-authoritative"
      : "fail; see assertion summary";

  return `# Promotion Readiness Packet UI Browser Static Validation

Slice name: \`${sliceName}\`

Validation date: 2026-06-29

Route tested: \`${routeTested}\`

## Browser/CDP Method Summary

Local Next dev server on an ephemeral loopback port; headless Chrome controlled
through Chrome DevTools Protocol. Enabled Page, Runtime, Network, and Log CDP
domains. Captured request metadata only.

## Page Load Result

${state.page_loaded ? "pass; route loaded and rendered the promotion readiness packet read/display panel." : "fail; route did not complete the required page-load assertion."}

## Visible Copy Assertions Summary

${visibleStatus}. Human signoff status remains false, and human review still
required remains true. Readiness is not promotion. Validation pass is not
truth/proof/approval/product readiness.

## No-Action-Controls Result

${noActionStatus}. Blocked-action explanatory text remains allowed only as
read/display content.

## Network/Request Boundary Summary

pass criteria: local loopback/dev-server assets only, no static UI API calls,
and browser request metadata only. Observed request count:
${requestSummary.request_count}; local loopback request count:
${requestSummary.local_loopback_request_count}; API request count:
${requestSummary.api_request_count}.

## Forbidden Method Summary

${requestSummary.forbidden_method_count === 0 ? "pass" : "fail"}; observed POST/PUT/PATCH/DELETE request count:
${requestSummary.forbidden_method_count}.

## Forbidden Route Summary

${requestSummary.forbidden_route_count === 0 ? "pass" : "fail"}; observed forbidden route count:
${requestSummary.forbidden_route_count}. Forbidden route families include
promotion decision, product-write, proof/evidence, Formation Receipt write,
GitHub, release, provider, source-fetch, and retrieval expansion routes.

## External Request Summary

${requestSummary.external_request_count === 0 ? "pass" : "fail"}; observed non-loopback external request count:
${requestSummary.external_request_count}.

## Screenshot Policy

Screenshot generation was skipped because DOM, visible text, and CDP network
metadata assertions were sufficient for this static validation. No screenshots
were committed or embedded. If local screenshots are generated later, report
them only as \`<PROMOTION_READINESS_PACKET_UI_DESKTOP_SCREENSHOT_ARTIFACT>\`
and \`<PROMOTION_READINESS_PACKET_UI_MOBILE_SCREENSHOT_ARTIFACT>\`.

## Known Warnings

${knownWarnings}

## Human Signoff Status

human_signoff_completed: false

## Human Review Still Required

human_review_still_required: true

## Authority Boundary

This validation does not perform human review and does not claim human
signoff. It denies product authority, promotion execution, promotion decision
write, promotion decision store usage/write, promotion decision controls,
proof/evidence creation, durable Perspective state apply, Formation Receipt
write, product-write, accepted evidence ref write, product ID allocation,
GitHub actuation, release execution, live provider validation, source
fetching/retrieval expansion, broad all-route audit instrumentation, API write
routes, DB schema/migrations, raw artifact copying, screenshot embedding,
private local path inclusion, and release authority.

## Final Recommendation

Use a narrow usability follow-up only if browser validation finds
readability/comprehension issues. Otherwise proceed to the next read/display
usability slice or pause for human spot review. Do not recommend promotion
execution, product-write, or release.

## Final Status

${finalStatus}. Assertions passed: ${passedAssertions}; assertions failed:
${failedAssertions.length}.
`;
}

function publicJsonSummary() {
  return {
    slice_name: sliceName,
    validation_version: validationVersion,
    route_tested: routeTested,
    browser_cdp_method: "local_next_dev_server_plus_headless_chrome_cdp",
    page_load_result: state.page_loaded ? "pass" : "fail",
    visible_assertions: {
      required_count: requiredVisibleCopy.length,
      missing_count: state.visible_assertions.missing.length,
    },
    no_action_controls_result:
      state.action_controls.control_count === 0 && state.action_controls.action_like_control_count === 0
        ? "pass"
        : "fail",
    network_request_boundary: state.request_summary,
    screenshot_policy: "skipped_no_screenshots_generated_or_committed",
    report_path: reportPath,
    human_signoff_completed: false,
    human_review_still_required: true,
    readiness_is_not_promotion: true,
    validation_pass_is_not_truth_proof_approval_product_readiness: true,
    final_status: state.final_status,
  };
}

function startDevServer() {
  const env = { ...process.env };
  for (const key of [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GITHUB_TOKEN",
    "GH_TOKEN",
  ]) {
    delete env[key];
  }
  env.AUGNES_DB_PATH = path.join(artifactDir, "unused-static-ui-validation.sqlite");
  devServerProcess = spawn(
    "npm",
    [
      "run",
      "dev",
      "--",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(selectedPort),
    ],
    {
      cwd: process.cwd(),
      env,
      stdio: ["ignore", "ignore", "ignore"],
    },
  );
}

function startChrome() {
  rmSync(chromeProfileDir, { recursive: true, force: true });
  chromeProcess = spawn(
    browserExecutablePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-extensions",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${chromeProfileDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
}

async function cleanup() {
  if (cdp) await cdp.close().catch(() => undefined);
  if (chromeProcess && !chromeProcess.killed) chromeProcess.kill("SIGTERM");
  if (devServerProcess && !devServerProcess.killed) devServerProcess.kill("SIGTERM");
  await delay(300);
  if (chromeProcess && !chromeProcess.killed) chromeProcess.kill("SIGKILL");
  if (devServerProcess && !devServerProcess.killed) devServerProcess.kill("SIGKILL");
}

async function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.status < 500) return response;
    } catch {
      await delay(200);
    }
  }
  throw new Error(`Timed out waiting for local HTTP readiness.`);
}

async function waitForRequestQuiet() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < defaultTimeoutMs) {
    if (Date.now() - lastRequestAt >= requestQuietMs) return;
    await delay(100);
  }
}

async function chooseAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("Unable to allocate local port."));
      });
    });
  });
}

function findBrowserExecutablePath() {
  return systemBrowserExecutableCandidates.find((candidate) => existsSync(candidate)) ?? null;
}

function normalizeForSearch(value) {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeError(error) {
  return {
    name: error?.name ?? "Error",
    message: String(error?.message ?? error).slice(0, 500),
  };
}
