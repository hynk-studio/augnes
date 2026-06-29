#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const sliceName = "promotion_readiness_copy_ia_clarity_v0_1";
const validationVersion = "promotion_readiness_copy_ia_clarity.v0.1";
const homeRoute = "/";
const hubRoute = "/perspective/promotion";
const packetRoute = "/perspective/promotion/readiness-packet";
const reportPath =
  "reports/browser/2026-06-29-promotion-readiness-copy-ia-clarity.md";
const artifactDir = path.join(
  tmpdir(),
  `augnes-promotion-readiness-copy-ia-clarity-v0-1-${process.pid}`,
);
const chromeProfileDir = path.join(artifactDir, "chrome-profile");
const localHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const requestQuietMs = 700;
const defaultTimeoutMs = 25_000;
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

const scopedSurfaces = [
  {
    id: "home_entrypoint",
    route: homeRoute,
    selector: '[data-testid="promotion-readiness-review-hub-cockpit-entrypoint"]',
    requiredCopy: [
      "Promotion readiness review",
      "Human review prep",
      "Read/display-only",
      "Not promotion approval",
      "Open read/display promotion review hub",
      "human_signoff_completed: false",
      "human_review_still_required: true",
    ],
    allowedLinks: [
      {
        label: "Open read/display promotion review hub",
        href: hubRoute,
      },
    ],
  },
  {
    id: "promotion_review_hub",
    route: hubRoute,
    selector: '[data-testid="promotion-readiness-review-hub"]',
    requiredCopy: [
      "Review preparation, not promotion approval",
      "This hub only links to read/display surfaces",
      "No promotion decision is written here",
      "No product-write or release happens here",
      "Human review still required",
    ],
    allowedLinks: [
      {
        label: "Open read/display readiness packet",
        href: packetRoute,
      },
    ],
  },
  {
    id: "readiness_packet",
    route: packetRoute,
    selector: '[data-testid="promotion-readiness-packet-panel"]',
    requiredCopy: [
      "Static/symbolic read-display preview",
      "This is not live promotion readiness",
      "Use this to prepare human review, not to approve promotion",
      "Readiness is not promotion",
      "Validation pass is not truth/proof/approval/product readiness",
      "human_signoff_completed",
      "false",
      "human_review_still_required",
      "true",
    ],
    allowedLinks: [],
  },
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
let appOrigin = null;
let browserExecutablePath = null;
let devServerProcess = null;
let chromeProcess = null;
let cdp = null;
let currentPhase = "setup";
let lastRequestAt = Date.now();
let browserVersion = "unknown";

const requestLog = [];
const responseLog = [];
const failedRequests = [];
const consoleMessages = [];
const pageErrors = [];
const assertions = [];

const state = {
  surfaces: {},
  navigation: {},
  scoped_action_controls: {},
  request_summary: {
    request_count: 0,
    response_count: 0,
    failed_request_count: 0,
    external_request_count: 0,
    api_request_count: 0,
    home_cockpit_api_noise_count: 0,
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
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for CDP method ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify({ id, method, params }));
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
  process.stdout.write(`${JSON.stringify(publicJsonSummary(), null, 2)}\n`);
}

async function main() {
  rmSync(artifactDir, { recursive: true, force: true });
  await mkdir(artifactDir, { recursive: true });

  selectedPort = await chooseAvailablePort();
  debugPort = await chooseAvailablePort();
  appOrigin = `http://127.0.0.1:${selectedPort}`;
  browserExecutablePath = findBrowserExecutablePath();
  if (!browserExecutablePath) throw new Error("No usable system Chrome/Chromium executable was found.");

  startDevServer();
  for (const route of [homeRoute, hubRoute, packetRoute]) {
    await waitForHttp(`${appOrigin}${route}`, defaultTimeoutMs);
  }

  startChrome();
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();

  for (const surface of scopedSurfaces) await validateSurface(surface);

  await runPhase("network_boundary", async () => {
    await waitForRequestQuiet();
    assertRequestBoundary();
  });

  const failed = assertions.filter((assertion) => !assertion.passed);
  state.final_status = failed.length === 0 ? "pass" : "fail";
  if (failed.length > 0) {
    throw new Error(`Browser validation failed: ${failed.map((item) => item.id).join(", ")}`);
  }
}

async function validateSurface(surface) {
  await runPhase(`${surface.id}_page_load`, async () => {
    await navigate(`${appOrigin}${surface.route}`);
    await waitForSelector(surface.selector, `${surface.id} scoped surface`);
    state.surfaces[surface.id] = {
      route: surface.route,
      page_loaded: true,
      missing_copy: [],
    };
    recordAssertion(`${surface.id}_page_load`, true, `${surface.id} route loaded.`);
  });

  await runPhase(`${surface.id}_copy`, async () => {
    const visibleText = await scopedText(surface.selector);
    const normalizedVisibleText = normalizeForSearch(visibleText);
    const missing = surface.requiredCopy.filter(
      (phrase) => !normalizedVisibleText.includes(normalizeForSearch(phrase)),
    );
    state.surfaces[surface.id].missing_copy = missing;
    recordAssertion(
      `${surface.id}_copy_visible`,
      missing.length === 0,
      `${surface.id} required copy was visible.`,
      { required_count: surface.requiredCopy.length, missing },
    );
  });

  await runPhase(`${surface.id}_navigation_and_controls`, async () => {
    const linkSummary = await readScopedLinks(surface.selector);
    const controlSummary = await readScopedActionControls(surface.selector, surface.allowedLinks);
    const linkAssertions = surface.allowedLinks.map((allowedLink) => {
      const matches = linkSummary.filter(
        (link) =>
          link.href_attr === allowedLink.href &&
          link.path_name === allowedLink.href &&
          link.same_origin === true &&
          link.external === false &&
          link.api_target === false &&
          link.role !== "button" &&
          link.has_click_handler === false &&
          link.label === allowedLink.label &&
          !forbiddenActionLabelPatterns.some((pattern) => pattern.test(link.label)),
      );
      return {
        label: allowedLink.label,
        href: allowedLink.href,
        match_count: matches.length,
      };
    });
    const allAllowedLinksPresent = linkAssertions.every((item) => item.match_count === 1);
    const noExtraLinks = linkSummary.length === surface.allowedLinks.length;

    state.navigation[surface.id] = {
      link_count: linkSummary.length,
      allowed_links: linkAssertions,
      no_extra_links: noExtraLinks,
    };
    state.scoped_action_controls[surface.id] = controlSummary;

    recordAssertion(
      `${surface.id}_allowed_navigation_links`,
      allAllowedLinksPresent && noExtraLinks,
      `${surface.id} allowed navigation links are safe normal internal anchors.`,
      { linkAssertions, observed_link_count: linkSummary.length },
    );
    recordAssertion(
      `${surface.id}_no_unsafe_action_controls`,
      controlSummary.disallowed_control_count === 0 && controlSummary.action_like_link_count === 0,
      `${surface.id} has no unsafe action controls.`,
      controlSummary,
    );
  });
}

async function waitForSelector(selector, description) {
  await waitForCondition(
    `Boolean(document.querySelector(${JSON.stringify(selector)}))`,
    defaultTimeoutMs,
    description,
  );
}

async function scopedText(selector) {
  return evaluateString(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    return root?.innerText ?? "";
  })()`);
}

async function readScopedLinks(selector) {
  return evaluateJson(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    if (!root) return [];
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getAttribute("aria-hidden") !== "true" &&
        rect.width >= 0 &&
        rect.height >= 0;
    };
    return Array.from(root.querySelectorAll("a[href]"))
      .filter(isVisible)
      .map((element) => {
        const url = new URL(element.href, location.href);
        return {
          label: (element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim(),
          href_attr: element.getAttribute("href") || "",
          path_name: url.pathname,
          same_origin: url.origin === location.origin,
          external: url.origin !== location.origin,
          api_target: url.pathname.startsWith("/api/"),
          role: element.getAttribute("role") || "",
          has_click_handler: element.hasAttribute("onclick") || typeof element.onclick === "function"
        };
      });
  })()`);
}

async function readScopedActionControls(selector, allowedLinks) {
  const controls = await evaluateJson(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    if (!root) return [];
    const selector = [
      "button",
      "form",
      "input",
      "select",
      "textarea",
      "a[href]",
      "[role='button']",
      "[role='menuitem']",
      "[role='switch']",
      "[role='checkbox']",
      "[role='radio']",
      "[role='tab']",
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
    return Array.from(root.querySelectorAll(selector))
      .filter(isVisible)
      .map((element) => {
        const tag = element.tagName.toLowerCase();
        const url = tag === "a" ? new URL(element.href, location.href) : null;
        return {
          tag,
          role: element.getAttribute("role") || "",
          label: [
            element.getAttribute("aria-label") || "",
            element.getAttribute("title") || "",
            element.value || "",
            element.innerText || element.textContent || ""
          ].join(" ").replace(/\\s+/g, " ").trim().slice(0, 180),
          href_attr: tag === "a" ? element.getAttribute("href") || "" : "",
          path_name: url ? url.pathname : "",
          same_origin: url ? url.origin === location.origin : true,
          external: url ? url.origin !== location.origin : false,
          api_target: url ? url.pathname.startsWith("/api/") : false,
          has_click_handler: element.hasAttribute("onclick") || typeof element.onclick === "function"
        };
      });
  })()`);
  const allowedNavigationControls = controls.filter((control) =>
    allowedLinks.some(
      (allowedLink) =>
        control.tag === "a" &&
        control.href_attr === allowedLink.href &&
        control.path_name === allowedLink.href &&
        control.same_origin === true &&
        control.external === false &&
        control.api_target === false &&
        control.role !== "button" &&
        control.has_click_handler === false &&
        control.label === allowedLink.label &&
        !forbiddenActionLabelPatterns.some((pattern) => pattern.test(control.label)),
    ),
  );
  const disallowedControls = controls.filter((control) => !allowedNavigationControls.includes(control));
  const actionLikeLinks = controls.filter(
    (control) =>
      control.tag === "a" &&
      (control.external ||
        control.api_target ||
        control.role === "button" ||
        control.has_click_handler ||
        !allowedLinks.some(
          (allowedLink) =>
            control.href_attr === allowedLink.href && control.label === allowedLink.label,
        ) ||
        forbiddenActionLabelPatterns.some((pattern) => pattern.test(control.label))),
  );
  return {
    control_count: controls.length,
    allowed_navigation_link_count: allowedNavigationControls.length,
    disallowed_control_count: disallowedControls.length,
    action_like_link_count: actionLikeLinks.length,
    disallowed_labels: disallowedControls.map((control) => control.label).filter(Boolean),
    action_like_link_labels: actionLikeLinks.map((control) => control.label).filter(Boolean),
  };
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
    home_cockpit_api_noise_count: apiRequests.filter((request) => request.phase?.startsWith("home_entrypoint")).length,
    forbidden_method_count: writeMethodRequests.length,
    forbidden_route_count: forbiddenRouteRequests.length,
    local_loopback_request_count: requestLog.filter((request) => request.is_loopback).length,
  };

  recordAssertion(
    "no_forbidden_methods",
    writeMethodRequests.length === 0,
    "No POST/PUT/PATCH/DELETE requests were observed.",
    { forbidden_method_count: writeMethodRequests.length },
  );
  recordAssertion(
    "no_forbidden_routes",
    forbiddenRouteRequests.length === 0,
    "No forbidden write/promotion/product/release/proof/evidence/provider/source/retrieval routes were observed.",
    { forbidden_route_count: forbiddenRouteRequests.length },
  );
  recordAssertion(
    "no_external_requests",
    externalRequests.length === 0,
    "No non-loopback external requests were observed.",
    { external_request_count: externalRequests.length },
  );
  recordAssertion(
    "no_failed_requests",
    failedRequests.length === 0,
    "No failed browser requests were observed.",
    { failed_request_count: failedRequests.length },
  );
}

function attachCdpObservers() {
  cdp.onEvent((payload) => {
    if (payload.method === "Network.requestWillBeSent") {
      const request = payload.params.request;
      const parsed = safeParseUrl(request.url);
      const pathName = parsed?.pathname ?? "";
      const isLoopback = parsed ? localHostnames.has(parsed.hostname) : false;
      const isExternal = parsed ? !isLoopback : false;
      const forbiddenReasons = parsed
        ? forbiddenRouteMatchers
            .filter((matcher) => matcher.matches(pathName))
            .map((matcher) => matcher.id)
        : ["unparseable_url"];
      requestLog.push({
        phase: currentPhase,
        method: request.method,
        path: pathName,
        type: payload.params.type,
        is_loopback: isLoopback,
        is_external: isExternal,
        forbidden_reasons: forbiddenReasons,
      });
      lastRequestAt = Date.now();
    }
    if (payload.method === "Network.responseReceived") {
      const parsed = safeParseUrl(payload.params.response.url);
      responseLog.push({
        phase: currentPhase,
        path: parsed?.pathname ?? "",
        status: payload.params.response.status,
        type: payload.params.type,
      });
      lastRequestAt = Date.now();
    }
    if (payload.method === "Network.loadingFailed") {
      failedRequests.push({
        phase: currentPhase,
        type: payload.params.type,
        error_text: payload.params.errorText,
        canceled: payload.params.canceled,
      });
      lastRequestAt = Date.now();
    }
    if (payload.method === "Runtime.consoleAPICalled") {
      consoleMessages.push({
        phase: currentPhase,
        type: payload.params.type,
      });
    }
    if (payload.method === "Runtime.exceptionThrown") {
      pageErrors.push({
        phase: currentPhase,
        description: payload.params.exceptionDetails?.text ?? "Runtime exception",
      });
    }
  });
}

async function enableCdpDomains() {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Log.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function navigate(url) {
  await cdp.send("Page.navigate", { url });
  await waitForCondition("document.readyState === 'complete'", defaultTimeoutMs, `page load ${url}`);
}

async function evaluateString(expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return String(result.result?.value ?? "");
}

async function evaluateJson(expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value ?? null;
}

async function waitForCondition(expression, timeoutMs, description) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await evaluateString(`Boolean(${expression})`);
    if (value === "true") return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function waitForRequestQuiet() {
  const start = Date.now();
  while (Date.now() - start < defaultTimeoutMs) {
    if (Date.now() - lastRequestAt >= requestQuietMs) return;
    await delay(100);
  }
}

async function chooseAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = address.port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function startDevServer() {
  devServerProcess = spawn(
    "npm",
    ["run", "dev", "--", "--port", String(selectedPort)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        OPENAI_API_KEY: "",
        AUGNES_DB_PATH:
          process.env.AUGNES_DB_PATH ||
          path.join(tmpdir(), `augnes-copy-ia-clarity-${process.pid}.db`),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function startChrome() {
  chromeProcess = spawn(
    browserExecutablePath,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${chromeProfileDir}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
}

async function openCdpPage() {
  const version = await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  browserVersion = version.Browser ?? "unknown";
  const response = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(appOrigin + homeRoute)}`,
    { method: "PUT" },
  );
  if (!response.ok) throw new Error(`Failed to open DevTools page: ${response.status}`);
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();
  return client;
}

async function waitForJson(url) {
  const start = Date.now();
  let lastError = null;
  while (Date.now() - start < defaultTimeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  let lastError = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function findBrowserExecutablePath() {
  return systemBrowserExecutableCandidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function runPhase(phase, fn) {
  const previous = currentPhase;
  currentPhase = phase;
  try {
    await fn();
  } finally {
    currentPhase = previous;
  }
}

function recordAssertion(id, passed, message, details = {}) {
  assertions.push({ id, passed, message, details });
}

function normalizeForSearch(value) {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function safeParseUrl(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanup() {
  if (cdp) await cdp.close().catch(() => {});
  if (chromeProcess) chromeProcess.kill("SIGTERM");
  if (devServerProcess) devServerProcess.kill("SIGTERM");
  await delay(200);
  rmSync(artifactDir, { recursive: true, force: true });
}

function finalizeState() {
  if (state.final_status !== "pass") {
    const failed = assertions.filter((assertion) => !assertion.passed);
    if (failed.length === 0 && state.failure === null) state.final_status = "pass";
  }
}

function publicJsonSummary() {
  return {
    slice_name: sliceName,
    validation_version: validationVersion,
    final_status: state.final_status,
    routes_tested: [homeRoute, hubRoute, packetRoute],
    browser_cdp: browserVersion,
    report_path: reportPath,
    assertion_count: assertions.length,
    failed_assertion_count: assertions.filter((assertion) => !assertion.passed).length,
    request_summary: state.request_summary,
    human_signoff_completed: false,
    human_review_still_required: true,
  };
}

function renderMarkdownReport() {
  const failed = assertions.filter((assertion) => !assertion.passed);
  const passed = assertions.filter((assertion) => assertion.passed);
  return `# Promotion Readiness Copy IA Clarity Browser Validation

Slice name: ${sliceName}

Validation date: 2026-06-29

Routes tested:

- \`${homeRoute}\`
- \`${hubRoute}\`
- \`${packetRoute}\`

## Browser/CDP Method Summary

Used a local Next dev server and system Chrome controlled through Chrome
DevTools Protocol. The validator captured request metadata only. It did not
capture raw request bodies, raw response bodies, raw HAR, screenshots, raw
route responses, or browser dumps.

Browser/CDP: ${browserVersion}

## Human Spot Review Basis

Human spot review classification: pass_with_copy_risk

Observed issues addressed:

- Home entrypoint discoverability FAIL
- Hub hierarchy/blocked authority visibility RISK
- Static/symbolic preview meaning RISK
- Validation warning density RISK

## Copy/IA Changes Validated

copy/IA only: true

- home entrypoint clarity
- hub first-judgment hierarchy
- readiness packet static/symbolic preview clarity
- dense boundary copy kept but summarized

## Home Entrypoint Clarity Assertions

${surfaceReport("home_entrypoint")}

## Hub Hierarchy Assertions

${surfaceReport("promotion_review_hub")}

## Readiness Packet Static/Symbolic Clarity Assertions

${surfaceReport("readiness_packet")}

## Navigation Link Assertion Summary

${navigationReport()}

## Scoped No-Action-Controls Result

${controlsReport()}

## Network/Request Boundary Summary

- requests observed: ${state.request_summary.request_count}
- responses observed: ${state.request_summary.response_count}
- failed requests: ${state.request_summary.failed_request_count}
- non-loopback external requests: ${state.request_summary.external_request_count}
- API requests observed: ${state.request_summary.api_request_count}
- existing home cockpit API noise: ${state.request_summary.home_cockpit_api_noise_count}
- forbidden method requests: ${state.request_summary.forbidden_method_count}
- forbidden route requests: ${state.request_summary.forbidden_route_count}
- local loopback requests: ${state.request_summary.local_loopback_request_count}

## Existing Home Cockpit API Noise Summary

Existing home cockpit read-only API noise is allowed only as route metadata and
is not attributed to the promotion readiness copy/IA surfaces. No raw request
bodies, raw response bodies, or raw route responses were captured.

## Screenshot Policy

No screenshots were written into the repository. No screenshots are embedded in
this report.

## Known Warnings

Local dev-server browser runs may emit standard React DevTools console info.
Those messages do not change the copy/IA authority boundary.

## Human Signoff Status

human_signoff_completed: false

## Human Review Still Required

human_review_still_required: true

## Authority Boundary

This validation denies product authority, promotion execution, promotion
decision write, promotion decision store usage/write, promotion decision
controls, proof/evidence creation, durable Perspective state apply, Formation
Receipt write, product-write, accepted evidence ref write, product ID
allocation, GitHub actuation, release execution, live provider validation,
source fetching/retrieval expansion, broad all-route audit instrumentation, API
write routes, DB schema/migrations, raw artifact copying, screenshot embedding,
private local path inclusion, and release authority.

## Final Recommendation

Rerun human spot review on copy clarity. Do not recommend promotion execution,
product-write, or release.

## Final Status

${state.final_status}

Passed assertions: ${passed.length}

Failed assertions: ${failed.length}
`;
}

function surfaceReport(surfaceId) {
  const surface = state.surfaces[surfaceId] ?? {};
  const missing = surface.missing_copy ?? [];
  return [
    `- route: \`${surface.route ?? "unknown"}\``,
    `- page loaded: ${surface.page_loaded === true}`,
    `- missing required copy count: ${missing.length}`,
    missing.length ? `- missing required copy: ${missing.join(", ")}` : "- missing required copy: none",
  ].join("\n");
}

function navigationReport() {
  return Object.entries(state.navigation)
    .map(([surfaceId, summary]) => {
      const links = summary.allowed_links
        .map((link) => `  - ${link.label} -> \`${link.href}\` match_count=${link.match_count}`)
        .join("\n");
      return `- ${surfaceId}: observed_links=${summary.link_count}; no_extra_links=${summary.no_extra_links}\n${links || "  - no links expected"}`;
    })
    .join("\n");
}

function controlsReport() {
  return Object.entries(state.scoped_action_controls)
    .map(
      ([surfaceId, summary]) =>
        `- ${surfaceId}: controls=${summary.control_count}; allowed_navigation_links=${summary.allowed_navigation_link_count}; disallowed_controls=${summary.disallowed_control_count}; action_like_links=${summary.action_like_link_count}`,
    )
    .join("\n");
}

function safeError(error) {
  return {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
  };
}
