#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const sliceName = "promotion_readiness_review_hub_cockpit_entrypoint_v0_1";
const validationVersion = "promotion_readiness_review_hub_cockpit_entrypoint.v0.1";
const homeRouteTested = "/";
const linkedRouteTested = "/perspective/promotion";
const downstreamRouteTested = "/perspective/promotion/readiness-packet";
const entrypointTestId = "promotion-readiness-review-hub-cockpit-entrypoint";
const perspectiveOverviewSelector = "#perspective-human-overview";
const workbenchIntroSelector = "#perspective-agent-diagnostic-workbench";
const allowedNavigationLabel = "Open read/display promotion review hub";
const reportPath =
  "reports/browser/2026-06-29-promotion-readiness-review-hub-cockpit-entrypoint.md";
const artifactDir = path.join(
  tmpdir(),
  `augnes-promotion-readiness-cockpit-entrypoint-v0-1-${process.pid}`,
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

const requiredVisibleCopy = [
  "Promotion readiness review",
  "Read/display-only review-prep lane",
  "Secondary Perspective cockpit lane",
  "primary Augnes surface",
  "Open read/display promotion review hub",
  "/perspective/promotion",
  "/perspective/promotion/readiness-packet",
  "Readiness is not promotion",
  "Validation pass is not truth/proof/approval/product readiness",
  "Browser validation is not human review",
  "human_signoff_completed: false",
  "human_review_still_required: true",
  "Human review prep",
  "Read/display-only",
  "Not promotion approval",
  "No action controls",
  "Navigation-only route",
  "packet route",
];

const requiredSections = [
  "Read/display-only review-prep lane",
  "Promotion readiness review",
  "No action controls",
  "Navigation-only route",
];

const requiredHumanOverviewCopy = [
  "Perspective overview",
  "Perspective / Constellation overview",
  "Augnes is showing the current project shape",
  "Start with the constellation: it shows the current project shape, tensions, and next review surfaces.",
  "Detailed agent and diagnostic panels are supporting workbench material, not the first human reading path.",
  "Promotion readiness is a secondary read/display review-prep lane, not approval.",
  "Human review still required",
  "Project constellation",
  "Constellation preview",
  "Agent / diagnostic workbench",
];

const destinationRequiredCopy = [
  "Promotion readiness review hub",
  "Read/display-only",
  "Readiness is not promotion",
  "Validation pass is not truth/proof/approval/product readiness",
  "Open read/display readiness packet",
];

const downstreamRequiredCopy = [
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
  downstream_page_loaded: false,
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
  scoped_action_controls: {
    disallowed_control_count: 0,
    action_like_link_count: 0,
    allowed_navigation_link_count: 0,
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
  await waitForHttp(`${appOrigin}${homeRouteTested}`, defaultTimeoutMs);
  await waitForHttp(`${appOrigin}${linkedRouteTested}`, defaultTimeoutMs);
  await waitForHttp(`${appOrigin}${downstreamRouteTested}`, defaultTimeoutMs);

  startChrome();
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();
  await validateCockpitEntrypoint();

  const failed = assertions.filter((assertion) => !assertion.passed);
  state.final_status = failed.length === 0 ? "pass" : "fail";
  if (failed.length > 0) {
    throw new Error(`Browser validation failed: ${failed.map((item) => item.id).join(", ")}`);
  }
}

async function validateCockpitEntrypoint() {
  await runPhase("home_page_load", async () => {
    await setViewport({ width: 1440, height: 1200, mobile: false });
    await navigate(`${appOrigin}${homeRouteTested}`);
    await waitForSelector(perspectiveOverviewSelector, "Perspective human overview");
    await waitForEntrypoint();
    state.page_loaded = true;
    recordAssertion(
      "page_load",
      true,
      "Home route loaded and Perspective overview plus entrypoint containers were visible.",
    );
  });

  await runPhase("human_overview_order", async () => {
    const orderSummary = await readHumanOverviewOrder();
    const overviewText = normalizeForSearch(orderSummary.overview_text ?? "");
    const missingOverviewCopy = requiredHumanOverviewCopy.filter(
      (phrase) => !overviewText.includes(normalizeForSearch(phrase)),
    );
    recordAssertion(
      "human_overview_required_copy",
      missingOverviewCopy.length === 0,
      "Human-facing Perspective overview copy was visible before the promotion readiness entrypoint.",
      { required_count: requiredHumanOverviewCopy.length, missing: missingOverviewCopy },
    );
    recordAssertion(
      "human_overview_before_promotion_entrypoint",
      orderSummary.overview_before_entrypoint === true,
      "Perspective overview appears before the promotion readiness entrypoint in DOM order.",
      orderSummary,
    );
    recordAssertion(
      "constellation_copy_before_promotion_copy",
      orderSummary.constellation_copy_before_promotion_copy === true,
      "Constellation orientation copy appears before promotion readiness copy in reading order.",
      orderSummary,
    );
    recordAssertion(
      "workbench_intro_below_human_orientation",
      orderSummary.overview_before_workbench === true &&
        orderSummary.entrypoint_before_workbench === true,
      "Agent/diagnostic workbench material is structurally below the human orientation layer and secondary promotion lane.",
      orderSummary,
    );
  });

  await runPhase("entrypoint_visible_copy", async () => {
    const visibleText = await entrypointText();
    const normalizedVisibleText = normalizeForSearch(visibleText);
    const missing = requiredVisibleCopy.filter(
      (phrase) => !normalizedVisibleText.includes(normalizeForSearch(phrase)),
    );
    state.visible_assertions.missing = missing;
    recordAssertion(
      "entrypoint_required_visible_copy",
      missing.length === 0,
      "All required cockpit entrypoint visible copy assertions were present.",
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
      "entrypoint_required_sections",
      missingSections.length === 0,
      "All required cockpit entrypoint sections were visible.",
      { required_count: requiredSections.length, missing: missingSections },
    );
  });

  await runPhase("entrypoint_navigation_link", async () => {
    const linkSummary = await readEntrypointLinks();
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
      "Exactly one read/display navigation link to the promotion review hub was present inside the entrypoint.",
      { allowed_link_count: allowedLinks.length },
    );
    recordAssertion(
      "navigation_link_safe_href",
      state.navigation_link.safe_href,
      "The allowed navigation link used only the internal promotion review hub route.",
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

  await runPhase("entrypoint_scoped_no_action_controls", async () => {
    const actionSummary = await readScopedActionControls();
    state.scoped_action_controls.disallowed_control_count = actionSummary.disallowed_control_count;
    state.scoped_action_controls.action_like_link_count = actionSummary.action_like_link_count;
    state.scoped_action_controls.allowed_navigation_link_count =
      actionSummary.allowed_navigation_link_count;
    recordAssertion(
      "entrypoint_no_buttons_forms_inputs_click_or_role_controls",
      actionSummary.disallowed_control_count === 0,
      "The new entrypoint rendered no buttons, forms, inputs, click handlers, or role-based action controls beyond the allowed read/display navigation link.",
      {
        disallowed_control_count: actionSummary.disallowed_control_count,
        allowed_navigation_link_count: actionSummary.allowed_navigation_link_count,
        labels: actionSummary.disallowed_labels,
      },
    );
    recordAssertion(
      "entrypoint_no_action_like_links",
      actionSummary.action_like_link_count === 0,
      "The new entrypoint rendered no action-like links or unsafe navigation targets.",
      {
        action_like_link_count: actionSummary.action_like_link_count,
        labels: actionSummary.action_like_link_labels,
      },
    );
  });

  await runPhase("destination_navigation", async () => {
    const linkHref = await evaluateString(`(() => {
      const root = document.querySelector('[data-testid=${JSON.stringify(entrypointTestId)}]');
      const link = root?.querySelector('a[href=${JSON.stringify(linkedRouteTested)}]');
      return link?.href ?? "";
    })()`);
    const assigned = linkHref === `${appOrigin}${linkedRouteTested}`;
    recordAssertion(
      "destination_link_href_used",
      assigned,
      "The allowed read/display navigation link href was used for destination navigation.",
    );
    if (!assigned) throw new Error("Allowed entrypoint navigation link did not resolve safely.");
    await navigate(`${appOrigin}${linkedRouteTested}`);
    await reloadPage();
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
      "The linked promotion review hub page loaded and exposed required read/display copy.",
      { required_count: destinationRequiredCopy.length },
    );
  });

  await runPhase("downstream_navigation", async () => {
    const linkHref = await evaluateString(`(() => {
      const link = document.querySelector('a[href=${JSON.stringify(downstreamRouteTested)}]');
      return link?.href ?? "";
    })()`);
    const assigned = linkHref === `${appOrigin}${downstreamRouteTested}`;
    recordAssertion(
      "downstream_link_href_used",
      assigned,
      "The downstream readiness packet navigation link href was used after reaching the promotion review hub.",
    );
    if (!assigned) throw new Error("Downstream navigation link did not resolve safely.");
    await navigate(`${appOrigin}${downstreamRouteTested}`);
    await reloadPage();
    await waitForCondition(
      `location.pathname === ${JSON.stringify(downstreamRouteTested)}`,
      defaultTimeoutMs,
      `location ${downstreamRouteTested}`,
    );
    await waitForReadyState();
    for (const phrase of downstreamRequiredCopy) await waitForText(phrase);
    state.downstream_page_loaded = true;
    recordAssertion(
      "downstream_page_load",
      true,
      "The downstream readiness packet page loaded and still showed read/display no-action copy.",
      { required_count: downstreamRequiredCopy.length },
    );
  });

  await runPhase("network_boundary", async () => {
    await waitForRequestQuiet();
    assertRequestBoundary();
  });
}

async function waitForEntrypoint() {
  await waitForCondition(
    `Boolean(document.querySelector('[data-testid=${JSON.stringify(entrypointTestId)}]'))`,
    defaultTimeoutMs,
    "promotion readiness cockpit entrypoint container",
  );
}

async function waitForSelector(selector, description) {
  await waitForCondition(
    `Boolean(document.querySelector(${JSON.stringify(selector)}))`,
    defaultTimeoutMs,
    description,
  );
}

async function readHumanOverviewOrder() {
  return evaluateJson(`(() => {
    const overview = document.querySelector(${JSON.stringify(perspectiveOverviewSelector)});
    const entrypoint = document.querySelector('[data-testid=${JSON.stringify(entrypointTestId)}]');
    const workbench = document.querySelector(${JSON.stringify(workbenchIntroSelector)});
    const bodyText = (document.body?.innerText || "").replace(/\\s+/g, " ").trim();
    const compareBefore = (first, second) =>
      Boolean(first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING));
    const textIndex = (phrase) => bodyText.toLowerCase().indexOf(phrase.toLowerCase());
    const constellationIndex = textIndex("Start with the constellation");
    const promotionIndex = textIndex("Promotion readiness review");
    return {
      overview_exists: Boolean(overview),
      entrypoint_exists: Boolean(entrypoint),
      workbench_intro_exists: Boolean(workbench),
      overview_text: (overview?.innerText || "").replace(/\\s+/g, " ").trim(),
      overview_before_entrypoint: compareBefore(overview, entrypoint),
      overview_before_workbench: compareBefore(overview, workbench),
      entrypoint_before_workbench: compareBefore(entrypoint, workbench),
      constellation_copy_index: constellationIndex,
      promotion_copy_index: promotionIndex,
      constellation_copy_before_promotion_copy:
        constellationIndex >= 0 && promotionIndex >= 0 && constellationIndex < promotionIndex,
    };
  })()`);
}

async function entrypointText() {
  return evaluateString(`(() => {
    const root = document.querySelector('[data-testid=${JSON.stringify(entrypointTestId)}]');
    return root?.innerText ?? "";
  })()`);
}

async function readEntrypointLinks() {
  return evaluateJson(`(() => {
    const root = document.querySelector('[data-testid=${JSON.stringify(entrypointTestId)}]');
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

async function readScopedActionControls() {
  const controls = await evaluateJson(`(() => {
    const root = document.querySelector('[data-testid=${JSON.stringify(entrypointTestId)}]');
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
    "No POST, PUT, PATCH, or DELETE browser requests were observed on the tested path.",
    { forbidden_method_count: writeMethodRequests.length },
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

async function reloadPage() {
  await cdp.send("Page.reload", { ignoreCache: true });
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
  const normalizedText = normalizeForSearch(text);
  await waitForCondition(
    `document.body && (document.body.innerText || "").replace(/\\s+/g, " ").trim().toLowerCase().includes(${JSON.stringify(normalizedText)})`,
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
      ? `pass; ${requiredVisibleCopy.length} required entrypoint visible copy assertions present`
      : `fail; missing ${state.visible_assertions.missing.length} required entrypoint visible copy assertions`;
  const navigationStatus =
    state.navigation_link.allowed_link_count === 1 &&
    state.navigation_link.safe_href &&
    state.navigation_link.safe_label &&
    !state.navigation_link.role_button &&
    !state.navigation_link.click_handler &&
    !state.navigation_link.external
      ? "pass; one internal read/display navigation link to the promotion review hub was observed"
      : "fail; navigation link assertion did not satisfy the read/display-only policy";
  const noActionStatus =
    state.scoped_action_controls.disallowed_control_count === 0 &&
    state.scoped_action_controls.action_like_link_count === 0
      ? "pass; scoped entrypoint rendered no buttons, forms, inputs, click handlers, role-based action controls, or unsafe links"
      : "fail; scoped entrypoint rendered disallowed controls or unsafe links";
  const requestSummary = state.request_summary;
  const knownWarnings =
    requestSummary.failed_request_count === 0
      ? "None beyond expected local dev-server page asset traffic and existing home read-only request metadata."
      : "Local failed request metadata was observed; no raw browser dump or response body is included.";
  const finalStatus =
    state.final_status === "pass"
      ? "pass; browser/static validation remains non-authoritative"
      : "fail; see assertion summary";

  return `# Promotion Readiness Review Hub Cockpit Entrypoint Browser Validation

Slice name: \`${sliceName}\`

Validation date: 2026-06-29

Home/cockpit route tested: \`${homeRouteTested}\`

Linked route tested: \`${linkedRouteTested}\`

Optional downstream route tested: \`${downstreamRouteTested}\`

## Browser/CDP Method Summary

Local Next dev server on an ephemeral loopback port; headless Chrome controlled
through Chrome DevTools Protocol. Enabled Page, Runtime, Network, and Log CDP
domains. Pre-warmed the home, linked hub, and downstream read/display routes
over loopback before opening Chrome to avoid first-hit route compilation
timing. Captured request metadata only. Existing home read-only API calls were
allowed as metadata, while write methods, forbidden route families, and
external requests remained forbidden.

## Page Load Result

${state.page_loaded ? "pass; home route loaded and rendered the scoped promotion readiness review entrypoint." : "fail; home route did not complete the required page-load assertion."}

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

${state.destination_page_loaded ? "pass; the allowed navigation link loaded the promotion review hub and required destination read/display copy was visible." : "fail; destination route did not complete required navigation assertions."}

Downstream route result: ${state.downstream_page_loaded ? "pass; the downstream readiness packet route loaded and still showed No action controls." : "fail or skipped; downstream readiness packet route did not complete required assertions."}

## Scoped No-Action-Controls Result

${noActionStatus}. The scoped container was
\`data-testid=\"${entrypointTestId}\"\`. Existing unrelated cockpit controls
were outside this assertion scope.

## Network/Request Boundary Summary

pass criteria: local loopback/dev-server assets and existing home read-only API
metadata only, no write-method requests, no forbidden route families, no
external requests, and browser request metadata only. Observed request count:
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

Screenshot generation was skipped because DOM, visible text, scoped controls,
navigation, and CDP network metadata assertions were sufficient for this static
validation. No screenshots were committed or embedded. If local screenshots are
generated later, report them only as
\`<PROMOTION_READINESS_COCKPIT_ENTRYPOINT_DESKTOP_SCREENSHOT_ARTIFACT>\` and
\`<PROMOTION_READINESS_COCKPIT_ENTRYPOINT_MOBILE_SCREENSHOT_ARTIFACT>\`.

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

This read/display validation adds no approval, promotion execution,
promotion decision write, product-write, release, proof/evidence, durable
state, provider, source-fetch, retrieval, GitHub, database, or API write
capability. The /perspective/promotion link is navigation only, not approval,
promotion, write, or release.

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
    home_route_tested: homeRouteTested,
    linked_route_tested: linkedRouteTested,
    downstream_route_tested: downstreamRouteTested,
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
    downstream_navigation_result: state.downstream_page_loaded ? "pass" : "fail",
    scoped_no_action_controls_result:
      state.scoped_action_controls.disallowed_control_count === 0 &&
      state.scoped_action_controls.action_like_link_count === 0
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
  env.AUGNES_DB_PATH = path.join(artifactDir, "unused-static-cockpit-entrypoint-validation.sqlite");
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
