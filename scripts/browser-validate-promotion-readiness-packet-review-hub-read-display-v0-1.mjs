#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const sliceName = "promotion_readiness_packet_review_hub_read_display_v0_1";
const validationVersion = "promotion_readiness_packet_review_hub_read_display.v0.1";
const routeTested = "/perspective/promotion";
const linkedRouteTested = "/perspective/promotion/readiness-packet";
const allowedNavigationLabel = "Open read/display readiness packet";
const reportPath =
  "reports/browser/2026-06-29-promotion-readiness-packet-review-hub-read-display.md";
const artifactDir = path.join(
  tmpdir(),
  `augnes-promotion-readiness-review-hub-read-display-v0-1-${process.pid}`,
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
  "Promotion readiness review hub",
  "Read/display-only",
  "Readiness is not promotion",
  "Validation pass is not truth/proof/approval/product readiness",
  "Browser validation is not human review",
  "human_signoff_completed: false",
  "human_review_still_required: true",
  "promotion_execution: false",
  "promotion_decision_write: false",
  "product_write: false",
  "proof_or_evidence_creation: false",
  "durable_state_apply: false",
  "formation_receipt_write: false",
  "accepted_evidence_ref_write: false",
  "product_id_allocation: false",
  "Basis refs: PR #856, PR #857, PR #858, PR #859, PR #860, PR #861",
  "Existing readiness packet route: /perspective/promotion/readiness-packet",
  "Open read/display readiness packet",
  "Available read/display surfaces",
  "Blocked authority actions",
  "Next non-authority review steps",
  "What this hub cannot do",
];

const requiredSections = [
  "Available read/display surfaces",
  "Basis refs",
  "Status flags",
  "Blocked authority actions",
  "Next non-authority review steps",
  "What this hub cannot do",
];

const destinationRequiredCopy = [
  "Promotion Readiness Packet Read/Display",
  "Readiness is not promotion",
  "Validation pass is not truth/proof/approval/product readiness",
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
    id: "api_route_call_from_static_hub_ui",
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
let appOrigin = null;
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
  destination_page_loaded: false,
  visible_assertions: {
    required_count: requiredVisibleCopy.length,
    missing: [],
  },
  navigation_link: {
    allowed_link_count: 0,
    safe_href: false,
    safe_label: false,
    role_button: false,
    click_handler: false,
    external: false,
  },
  action_controls: {
    disallowed_control_count: 0,
    action_like_link_count: 0,
    hub_allowed_navigation_link_count: 0,
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
  appOrigin = `http://127.0.0.1:${selectedPort}`;

  browserExecutablePath = findBrowserExecutablePath();
  if (!browserExecutablePath) {
    throw new Error("No usable system Chrome/Chromium executable was found.");
  }

  startDevServer();
  await waitForHttp(`${appOrigin}${routeTested}`, defaultTimeoutMs);

  startChrome();
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();
  await validateReviewHub();

  const failed = assertions.filter((assertion) => !assertion.passed);
  state.final_status = failed.length === 0 ? "pass" : "fail";
  if (failed.length > 0) {
    throw new Error(`Browser validation failed: ${failed.map((item) => item.id).join(", ")}`);
  }
}

async function validateReviewHub() {
  await runPhase("page_load", async () => {
    await setViewport({ width: 1440, height: 1200, mobile: false });
    await navigate(`${appOrigin}${routeTested}`);
    await waitForText("Promotion readiness review hub");
    state.page_loaded = true;
    recordAssertion("page_load", true, "Route loaded and required hub heading was visible.");
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
      "All required review hub visible copy assertions were present.",
      {
        required_count: requiredVisibleCopy.length,
        missing_count: missing.length,
        missing,
      },
    );
    const missingSections = requiredSections.filter(
      (phrase) => !normalizedVisibleText.includes(normalizeForSearch(phrase)),
    );
    recordAssertion(
      "required_sections",
      missingSections.length === 0,
      "All required review hub sections were visible.",
      { required_count: requiredSections.length, missing: missingSections },
    );
  });

  await runPhase("navigation_link", async () => {
    const linkSummary = await readNavigationLinks();
    const allowedLinks = linkSummary.filter((link) => link.href_attr === linkedRouteTested);
    const primaryLink = allowedLinks[0] ?? null;
    const actionLikeAllowedLabels = allowedLinks.filter((link) =>
      forbiddenActionLabelPatterns.some((pattern) => pattern.test(link.label)),
    );
    state.navigation_link.allowed_link_count = allowedLinks.length;
    state.navigation_link.safe_href =
      allowedLinks.length === 1 &&
      primaryLink?.path_name === linkedRouteTested &&
      primaryLink?.same_origin === true &&
      primaryLink?.api_target === false;
    state.navigation_link.safe_label =
      allowedLinks.length === 1 &&
      primaryLink?.label === allowedNavigationLabel &&
      actionLikeAllowedLabels.length === 0;
    state.navigation_link.role_button = allowedLinks.some((link) => link.role === "button");
    state.navigation_link.click_handler = allowedLinks.some((link) => link.has_click_handler);
    state.navigation_link.external = allowedLinks.some((link) => link.external);

    recordAssertion(
      "read_only_navigation_link_exists",
      allowedLinks.length === 1,
      "Exactly one read/display navigation link to the readiness packet route was present.",
      { allowed_link_count: allowedLinks.length },
    );
    recordAssertion(
      "navigation_link_safe_href",
      state.navigation_link.safe_href,
      "The allowed navigation link used only the internal readiness packet route.",
      { href: primaryLink?.href_attr ?? null, path_name: primaryLink?.path_name ?? null },
    );
    recordAssertion(
      "navigation_link_safe_label",
      state.navigation_link.safe_label,
      "The allowed navigation link label avoided approval/action/write wording.",
      { label: primaryLink?.label ?? null },
    );
    recordAssertion(
      "navigation_link_not_role_button",
      !state.navigation_link.role_button,
      "The allowed navigation link did not use role=button.",
    );
    recordAssertion(
      "navigation_link_no_click_handler",
      !state.navigation_link.click_handler,
      "The allowed navigation link had no click handler.",
    );
    recordAssertion(
      "navigation_link_not_external",
      !state.navigation_link.external,
      "The allowed navigation link did not point to an external URL.",
    );
  });

  await runPhase("hub_no_action_controls", async () => {
    const actionSummary = await readActionControls({ allowReviewHubNavigationLink: true });
    recordNoActionAssertions(actionSummary, "hub");
  });

  await runPhase("destination_navigation", async () => {
    const clicked = await evaluateBoolean(`(() => {
      const link = document.querySelector('a[href=${JSON.stringify(linkedRouteTested)}]');
      if (!link) return false;
      link.click();
      return true;
    })()`);
    recordAssertion(
      "destination_link_clicked",
      clicked,
      "The allowed read/display navigation link was used for destination navigation.",
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(linkedRouteTested)}`,
      defaultTimeoutMs,
      `location ${linkedRouteTested}`,
    );
    await waitForReadyState();
    for (const phrase of destinationRequiredCopy) await waitForText(phrase);
    state.destination_page_loaded = true;
    recordAssertion(
      "destination_page_load",
      true,
      "The linked readiness packet page loaded and exposed required read/display copy.",
      { required_count: destinationRequiredCopy.length },
    );
  });

  await runPhase("destination_no_action_controls", async () => {
    const actionSummary = await readActionControls({ allowReviewHubNavigationLink: false });
    recordNoActionAssertions(actionSummary, "destination");
  });

  await runPhase("network_boundary", async () => {
    await waitForRequestQuiet();
    assertRequestBoundary();
  });
}

async function readNavigationLinks() {
  return evaluateJson(`(() => {
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getAttribute("aria-hidden") !== "true" &&
        rect.width >= 0 &&
        rect.height >= 0;
    };
    return Array.from(document.querySelectorAll("a[href]"))
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

async function readActionControls({ allowReviewHubNavigationLink }) {
  const controls = await evaluateJson(`(() => {
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
    return Array.from(document.body.querySelectorAll(selector))
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
          ].join(" ").replace(/\\s+/g, " ").trim().slice(0, 160),
          href_attr: tag === "a" ? element.getAttribute("href") || "" : "",
          path_name: url ? url.pathname : "",
          same_origin: url ? url.origin === location.origin : true,
          external: url ? url.origin !== location.origin : false,
          api_target: url ? url.pathname.startsWith("/api/") : false,
          has_click_handler: element.hasAttribute("onclick") || typeof element.onclick === "function"
        };
      });
  })()`);
  const allowedNavigationControls = controls.filter(
    (control) =>
      allowReviewHubNavigationLink &&
      control.tag === "a" &&
      control.href_attr === linkedRouteTested &&
      control.path_name === linkedRouteTested &&
      control.same_origin === true &&
      control.external === false &&
      control.api_target === false &&
      control.role !== "button" &&
      control.has_click_handler === false &&
      control.label === allowedNavigationLabel &&
      !forbiddenActionLabelPatterns.some((pattern) => pattern.test(control.label)),
  );
  const disallowedControls = controls.filter((control) => !allowedNavigationControls.includes(control));
  const actionLikeLinks = controls.filter(
    (control) =>
      control.tag === "a" &&
      (control.external ||
        control.api_target ||
        control.role === "button" ||
        control.has_click_handler ||
        control.href_attr !== linkedRouteTested ||
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

function recordNoActionAssertions(actionSummary, scope) {
  state.action_controls.disallowed_control_count += actionSummary.disallowed_control_count;
  state.action_controls.action_like_link_count += actionSummary.action_like_link_count;
  state.action_controls.hub_allowed_navigation_link_count +=
    actionSummary.allowed_navigation_link_count;
  recordAssertion(
    `${scope}_no_buttons_forms_inputs_click_or_role_controls`,
    actionSummary.disallowed_control_count === 0,
    `${scope} rendered no buttons, forms, inputs, click handlers, or role-based action controls beyond the allowed read/display navigation link.`,
    {
      disallowed_control_count: actionSummary.disallowed_control_count,
      allowed_navigation_link_count: actionSummary.allowed_navigation_link_count,
      labels: actionSummary.disallowed_labels,
    },
  );
  recordAssertion(
    `${scope}_no_action_like_links`,
    actionSummary.action_like_link_count === 0,
    `${scope} rendered no action-like links or unsafe navigation targets.`,
    {
      action_like_link_count: actionSummary.action_like_link_count,
      labels: actionSummary.action_like_link_labels,
    },
  );
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
    "no_api_calls_from_static_hub_ui",
    apiRequests.length === 0,
    "The static review hub UI made no /api calls.",
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
  const navigationStatus =
    state.navigation_link.allowed_link_count === 1 &&
    state.navigation_link.safe_href &&
    state.navigation_link.safe_label &&
    !state.navigation_link.role_button &&
    !state.navigation_link.click_handler &&
    !state.navigation_link.external
      ? "pass; one internal read/display navigation link to the readiness packet was observed"
      : "fail; navigation link assertion did not satisfy the read/display-only policy";
  const noActionStatus =
    state.action_controls.disallowed_control_count === 0 &&
    state.action_controls.action_like_link_count === 0
      ? "pass; no buttons, forms, inputs, click handlers, role-based action controls, or unsafe links observed"
      : "fail; disallowed controls or unsafe links observed";
  const requestSummary = state.request_summary;
  const knownWarnings =
    requestSummary.failed_request_count === 0
      ? "None beyond expected local dev-server page asset traffic."
      : "Local failed request metadata was observed; no raw browser dump or response body is included.";
  const finalStatus =
    state.final_status === "pass"
      ? "pass; browser/static validation remains non-authoritative"
      : "fail; see assertion summary";

  return `# Promotion Readiness Packet Review Hub Read/Display Browser Validation

Slice name: \`${sliceName}\`

Validation date: 2026-06-29

Route tested: \`${routeTested}\`

Linked route tested: \`${linkedRouteTested}\`

## Browser/CDP Method Summary

Local Next dev server on an ephemeral loopback port; headless Chrome controlled
through Chrome DevTools Protocol. Enabled Page, Runtime, Network, and Log CDP
domains. Captured request metadata only.

## Page Load Result

${state.page_loaded ? "pass; route loaded and rendered the promotion readiness review hub." : "fail; route did not complete the required page-load assertion."}

## Visible Copy Assertions Summary

${visibleStatus}. Human signoff status remains false, and human review still
required remains true. Readiness is not promotion. Validation pass is not
truth/proof/approval/product readiness. Browser validation is not human
review.

## Navigation Link Assertion Summary

${navigationStatus}. The link text was \`${allowedNavigationLabel}\`, the href
was \`${linkedRouteTested}\`, role=button was absent, no click handler was
observed, and no external or API target was used.

## Destination Navigation Result

${state.destination_page_loaded ? "pass; the allowed navigation link loaded the readiness packet route and required destination read/display copy was visible." : "fail; destination route did not complete required navigation assertions."}

## No-Action-Controls Result

${noActionStatus}. Blocked-action explanatory text remains allowed only as
read/display content.

## Network/Request Boundary Summary

pass criteria: local loopback/dev-server assets only, no static hub UI API
calls, and browser request metadata only. Observed request count:
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

Screenshot generation was skipped because DOM, visible text, navigation, and
CDP network metadata assertions were sufficient for this static validation. No
screenshots were committed or embedded. If local screenshots are generated
later, report them only as
\`<PROMOTION_READINESS_REVIEW_HUB_DESKTOP_SCREENSHOT_ARTIFACT>\` and
\`<PROMOTION_READINESS_REVIEW_HUB_MOBILE_SCREENSHOT_ARTIFACT>\`.

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

## Forbidden Capabilities

This read/display validation adds no approval, promotion, product-write,
release, proof/evidence, durable state, provider, source-fetch, retrieval,
GitHub, database, or API write capability. The readiness packet link is
navigation only, not approval or promotion.

## Final Recommendation

Browser/static validation complete. Proceed only to the next read/display
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
    linked_route_tested: linkedRouteTested,
    browser_cdp_method: "local_next_dev_server_plus_headless_chrome_cdp",
    page_load_result: state.page_loaded ? "pass" : "fail",
    visible_assertions: {
      required_count: requiredVisibleCopy.length,
      missing_count: state.visible_assertions.missing.length,
    },
    navigation_link_assertions: {
      allowed_link_count: state.navigation_link.allowed_link_count,
      safe_href: state.navigation_link.safe_href,
      safe_label: state.navigation_link.safe_label,
      role_button: state.navigation_link.role_button,
      click_handler: state.navigation_link.click_handler,
      external: state.navigation_link.external,
    },
    destination_navigation_result: state.destination_page_loaded ? "pass" : "fail",
    no_action_controls_result:
      state.action_controls.disallowed_control_count === 0 &&
      state.action_controls.action_like_link_count === 0
        ? "pass"
        : "fail",
    network_request_boundary: state.request_summary,
    screenshot_policy: "skipped_no_screenshots_generated_or_committed",
    report_path: reportPath,
    human_signoff_completed: false,
    human_review_still_required: true,
    readiness_is_not_promotion: true,
    validation_pass_is_not_truth_proof_approval_product_readiness: true,
    browser_validation_is_not_human_review: true,
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
  env.AUGNES_DB_PATH = path.join(artifactDir, "unused-static-review-hub-validation.sqlite");
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
  throw new Error("Timed out waiting for local HTTP readiness.");
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
