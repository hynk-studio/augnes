#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const validationName =
  "final-rag-answer-review-memory-operator-browser-validation";
const validationVersion =
  "final_rag_answer_review_memory_operator_browser_validation.v0.1";
const artifactDir =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const desktopScreenshotPath = path.join(artifactDir, "desktop.png");
const mobileScreenshotPath = path.join(artifactDir, "mobile-390.png");
const chromeProfileDir = path.join(artifactDir, "chrome-profile");
const pagePath = "/research-retrieval/final-rag-answer/review-memory";
const localHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const requestQuietMs = 500;
const defaultTimeoutMs = 20_000;
const seededRoot = `.tmp/research-candidate-review-memory/final-rag-answer-review-memory-operator-browser-validation-v0-1-${process.pid}`;
const seededReviewMemoryDbPath = `${seededRoot}/review-memory.sqlite`;
const reviewRecordId =
  "review-memory:final-rag-answer:operator-browser-validation-v0-1";
const answerCandidateRef =
  "final-rag-answer-candidate:operator-browser-validation-v0-1";
const sourceRef = "source-ref:operator-browser-validation-public-source-v0-1";

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

const boundaryNotes = [
  "Review Memory is not truth.",
  "Review Memory is not proof.",
  "Review Memory is not accepted evidence.",
  "Review Memory is not durable Perspective state.",
  "Final answer candidate remains candidate-only.",
  "Source refs are lineage pointers, not proof.",
  "This UI is read/display only.",
  "Smoke/CI pass is not truth.",
];

const preservedBoundaries = [
  "browser validation only",
  "no new runtime authority",
  "no new API route",
  "no new UI behavior",
  "no DB schema change",
  "seeded Review Memory DB write is test setup only",
  "UI uses existing Review Memory GET routes only",
  "UI makes no POST calls",
  "no Review Memory write from UI",
  "no final answer generation",
  "no provider call",
  "no prompt sending",
  "no retrieval execution",
  "no source fetch",
  "no retrieval index write",
  "no promotion execution",
  "no promotion decision write",
  "no promotion decision store write",
  "no proof/evidence creation",
  "no durable state mutation",
  "no Formation Receipt write",
  "no product-write",
  "no accepted evidence ref write",
  "no product ID allocation",
  "no Git/GitHub/release execution",
  "browser pass is not truth",
];

const forbiddenRouteMatchers = [
  {
    id: "final_rag_answer_generation_route",
    matches: (pathName) => pathName === "/api/research-retrieval/final-rag-answer",
  },
  {
    id: "final_rag_answer_review_memory_binding_route",
    matches: (pathName) =>
      pathName === "/api/research-retrieval/final-rag-answer/review-memory",
  },
  {
    id: "promotion_readiness_packet_route",
    matches: (pathName) =>
      pathName === "/api/perspective/promotion/readiness-packet",
  },
  {
    id: "research_retrieval_api_route",
    matches: (pathName) => pathName.startsWith("/api/research-retrieval/"),
  },
  {
    id: "product_write_route",
    matches: (pathName) => pathName.startsWith("/api/product-write"),
  },
  {
    id: "provider_route",
    matches: (pathName) =>
      pathName.startsWith("/api/research-candidate-review/provider-extraction") ||
      /provider|openai/i.test(pathName),
  },
  {
    id: "retrieval_rebuild_or_search_route",
    matches: (pathName) =>
      /\/api\/.*(?:retrieval|index).*(?:rebuild|search|query)/i.test(pathName),
  },
  {
    id: "source_fetch_route",
    matches: (pathName) =>
      /\/api\/.*(?:source).*(?:fetch|crawl|intake)/i.test(pathName),
  },
  {
    id: "github_route",
    matches: (pathName) => /\/api\/.*github/i.test(pathName),
  },
  {
    id: "release_route",
    matches: (pathName) => /\/api\/.*release/i.test(pathName),
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
        const { resolve, reject } = this.pending.get(payload.id);
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
      for (const { reject } of this.pending.values()) reject(event);
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

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = { id, method, params };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

const report = createInitialReport();

try {
  await main();
} catch (error) {
  report.failure = safeError(error);
  report.final_status = "fail";
  throw error;
} finally {
  await cleanup();
  finalizeReport();
  await mkdir(artifactDir, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  await seedReviewMemoryDb();

  selectedPort = await chooseAvailablePort();
  debugPort = await chooseAvailablePort();
  appUrl = `http://127.0.0.1:${selectedPort}${pagePath}`;
  report.app_url = appUrl;
  report.seeded_review_memory_db_path = seededReviewMemoryDbPath;

  browserExecutablePath = findBrowserExecutablePath();
  if (!browserExecutablePath) {
    report.browser_unavailable_reason =
      `No usable browser executable found. Probed: ${systemBrowserExecutableCandidates.join(", ")}`;
    throw new Error(report.browser_unavailable_reason);
  }
  report.browser_executable_path = browserExecutablePath;

  startDevServer();
  await waitForHttp(appUrl, defaultTimeoutMs);
  report.dev_server_started = true;

  startChrome();
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();

  await validateOperatorPath();

  const failedAssertions = report.assertions.filter((assertion) => !assertion.passed);
  report.final_status = failedAssertions.length === 0 ? "pass" : "fail";
  if (failedAssertions.length > 0) {
    throw new Error(
      `Browser validation failed: ${failedAssertions
        .map((assertion) => assertion.id)
        .join(", ")}`,
    );
  }
}

async function seedReviewMemoryDb() {
  rmSync(seededRoot, { recursive: true, force: true });
  await mkdir(path.dirname(seededReviewMemoryDbPath), { recursive: true });
  const store = await import(
    pathToFileURL("lib/research-candidate-review/review-memory-db-store.ts").href
  );
  const db = new Database(seededReviewMemoryDbPath);
  try {
    const createdAt = new Date("2026-06-29T00:00:00.000Z").toISOString();
    const record = {
      contract_version: "research_candidate_review_memory_contract.v0.1",
      scope: "project:augnes",
      review_record_id: reviewRecordId,
      record_kind: "candidate_review_snapshot",
      lifecycle_state: "active",
      review_decision: "keep_for_review",
      review_action: "save_review_note",
      candidate_refs: [
        answerCandidateRef,
        "answer-request:operator-browser-validation-v0-1",
        "rag-context-preview:operator-browser-validation-v0-1",
      ],
      source_refs: [
        {
          source_surface: "manual_source_ref",
          source_ref: sourceRef,
          source_version: "final_rag_answer_generation_candidate_review.v0.1",
          public_safe: true,
        },
      ],
      related_record_refs: ["rag-context-preview:operator-browser-validation-v0-1"],
      reviewer_actor: "operator:browser-validation",
      reviewer_note_summary:
        "Public-safe operator note summary for browser validation only.",
      bounded_summary:
        "Final answer candidate ref final-rag-answer-candidate:operator-browser-validation-v0-1. Candidate-only browser validation summary. Review Memory is not truth, proof, accepted evidence, durable state, promotion, or product-write authority.",
      boundary_acknowledgements: [
        "final_answer_candidate_not_truth",
        "final_answer_candidate_not_proof",
        "final_answer_candidate_not_accepted_evidence",
        "final_answer_candidate_not_promotion",
        "final_answer_candidate_not_product",
        "review_memory_not_truth",
        "review_memory_not_proof",
        "review_memory_not_accepted_evidence",
        "review_memory_not_durable_state",
        "source_refs_are_lineage_not_proof",
        "product_write_not_executed",
      ],
      privacy_report: {
        privacy_class: "public_safe",
        public_safe: true,
        raw_conversation_included: false,
        hidden_reasoning_included: false,
        raw_source_body_included: false,
        raw_candidate_payload_included: false,
        raw_provider_output_included: false,
        provider_thread_run_session_ids_included: false,
        private_urls_included: false,
        local_private_paths_included: false,
        secrets_included: false,
        raw_db_rows_included: false,
        raw_browser_dump_included: false,
        blocked_reason_codes: [],
      },
      authority_boundary: {
        ...store.createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
        route_now: false,
        ui_now: false,
      },
      reason_codes: [
        "final_rag_answer_candidate_review_memory_binding_v0_1",
        "final_rag_answer_review_memory_operator_browser_validation_v0_1",
        "source_refs_are_lineage_not_proof",
        "review_memory_not_truth",
        "review_memory_not_proof",
        "smoke_pass_not_truth",
      ],
      created_at: createdAt,
      updated_at: createdAt,
    };
    const result = store.createResearchCandidateReviewRecordV01(record, db);
    if (!["created", "idempotent_existing"].includes(result.status)) {
      throw new Error(`Seed Review Memory record failed: ${result.status}`);
    }
    const activityResult = store.appendResearchCandidateReviewRecordActivityV01(
      {
        activity_id: `${reviewRecordId}:activity:operator-browser-validation`,
        review_record_id: reviewRecordId,
        activity_kind: "review_record_activity_appended",
        actor_ref: "operator:browser-validation",
        summary: "Public-safe browser validation activity history entry.",
        reason_codes: [
          "final_rag_answer_review_memory_operator_browser_validation_v0_1",
          "review_memory_not_truth",
          "source_refs_are_lineage_not_proof",
        ],
        created_at: new Date("2026-06-29T00:01:00.000Z").toISOString(),
      },
      db,
    );
    if (activityResult.status !== "activity_appended") {
      throw new Error(`Seed activity failed: ${activityResult.status}`);
    }
    report.seeded_review_memory_record = {
      review_record_id: reviewRecordId,
      record_kind: "candidate_review_snapshot",
      source_ref: sourceRef,
      candidate_ref: answerCandidateRef,
      seed_write_test_setup_only: true,
    };
  } finally {
    db.close();
  }
}

async function validateOperatorPath() {
  await runPhase("page_load", async () => {
    await setViewport({ width: 1440, height: 1200, mobile: false });
    await navigate(appUrl);
    await waitForText("Final Answer Candidate Review Memory Records");
    report.page_loaded = true;
    const panelRendered = await evaluateBoolean(
      `Boolean(document.querySelector('[data-augnes-surface="final-answer-candidate-review-ui-binding"]'))`,
    );
    report.panel_rendered = panelRendered;
    recordAssertion(
      "panel_rendered",
      panelRendered,
      "FinalRagAnswerReviewMemoryPanel rendered on the existing page.",
    );
    const noteResults = [];
    for (const note of boundaryNotes) {
      const visible = await textVisible(note);
      noteResults.push({ note, visible });
    }
    report.boundary_notes_visible = noteResults.every((item) => item.visible);
    recordAssertion(
      "boundary_notes_visible",
      report.boundary_notes_visible,
      "Required non-authority boundary notes are visible.",
      { notes: noteResults },
    );
  });

  await runPhase("invalid_db_path_block_before_fetch", async () => {
    const before = countReviewMemoryApiRequests();
    await setInputValue("final-answer-review-memory-db-path", "tmp/research-candidate-review-memory/invalid-path.txt");
    await clickButton("List matching records");
    await waitForText("invalid_db_path");
    await waitForRequestQuiet();
    const after = countReviewMemoryApiRequests();
    report.invalid_db_path_blocked_before_fetch = after === before;
    recordAssertion(
      "invalid_db_path_blocked_before_fetch",
      report.invalid_db_path_blocked_before_fetch,
      "Invalid DB path is blocked in the UI before a fetch.",
      { before, after },
    );
  });

  await runPhase("private_raw_filter_block_before_fetch", async () => {
    await setInputValue("final-answer-review-memory-db-path", seededReviewMemoryDbPath);
    const before = countReviewMemoryApiRequests();
    await setInputValue("final-answer-candidate-filter", "raw_provider_output");
    await waitForText("blocked_private_or_raw_payload");
    await delay(200);
    const after = countReviewMemoryApiRequests();
    report.private_raw_filter_blocked_before_fetch = after === before;
    recordAssertion(
      "private_raw_filter_blocked_before_fetch",
      report.private_raw_filter_blocked_before_fetch,
      "Private/raw filter text is blocked in the UI before a fetch.",
      { before, after },
    );
  });

  await runPhase("list_records", async () => {
    await setInputValue("final-answer-review-memory-db-path", seededReviewMemoryDbPath);
    await setInputValue("final-answer-candidate-filter", "");
    await setInputValue("final-answer-source-filter", "");
    await clickButton("List matching records");
    await waitForText(reviewRecordId);
    await waitForText("final answer candidate review memory");
    await waitForRequestQuiet();
    report.db_path_entered = await inputValueEquals(
      "final-answer-review-memory-db-path",
      seededReviewMemoryDbPath,
    );
    report.list_action_completed = await textVisible(reviewRecordId);
    recordAssertion(
      "list_action_completed",
      report.db_path_entered && report.list_action_completed,
      "Seeded final answer candidate Review Memory record is listed from existing GET route.",
      { review_record_id: reviewRecordId },
    );
  });

  await runPhase("open_selected_record", async () => {
    await clickRecordButton(reviewRecordId);
    await waitForText("candidate_refs");
    await waitForText(answerCandidateRef);
    await waitForText("source_refs");
    await waitForText(sourceRef);
    await waitForRequestQuiet();
    report.selected_record_opened = true;
    recordAssertion(
      "selected_record_opened",
      true,
      "Selected record detail loaded through existing Review Memory GET route.",
    );
  });

  await runPhase("load_activity_history", async () => {
    await clickButton("Load activity history");
    await waitForText("Public-safe browser validation activity history entry.");
    await waitForRequestQuiet();
    report.activity_history_loaded = true;
    recordAssertion(
      "activity_history_loaded",
      true,
      "Activity history loaded through existing Review Memory activity GET route.",
    );
  });

  await runPhase("copy_bounded_packet", async () => {
    await clickButton("Copy bounded packet");
    await waitForText("packet_kind: final_answer_candidate_review_memory_read_only");
    const packetText = await evaluateString(
      `document.querySelector('[aria-label="Copied bounded packet"] pre')?.innerText ?? ""`,
    );
    const nonAuthority =
      packetText.includes("review_memory_is_truth: false") &&
      packetText.includes("review_memory_is_proof: false") &&
      packetText.includes("read_display_only_ui_now: true") &&
      packetText.includes("product_write_now: false") &&
      packetText.includes("accepted_evidence_ref_write_now: false");
    report.bounded_packet_preview_created = nonAuthority;
    recordAssertion(
      "bounded_packet_preview_created",
      nonAuthority,
      "Copied bounded packet preview is non-authoritative.",
      { packet_length: packetText.length },
    );
  });

  await runPhase("screenshots", async () => {
    await captureScreenshot(desktopScreenshotPath);
    await setViewport({ width: 390, height: 960, mobile: true });
    await captureScreenshot(mobileScreenshotPath);
    report.screenshot_paths = {
      desktop: desktopScreenshotPath,
      mobile_390: mobileScreenshotPath,
    };
    recordAssertion(
      "screenshots_created",
      existsSync(desktopScreenshotPath) && existsSync(mobileScreenshotPath),
      "Desktop and mobile screenshots were captured under /tmp.",
      report.screenshot_paths,
    );
  });

  assertRequestBoundary();
}

function assertRequestBoundary() {
  const forbiddenRequests = requestLog.filter((request) => request.forbidden_reasons.length > 0);
  const externalRequests = requestLog.filter((request) => request.is_external);
  const postRequests = requestLog.filter((request) => request.method === "POST");
  const allowedReviewMemoryRequests = requestLog.filter((request) =>
    request.path?.startsWith("/api/research-candidate-review/review-records"),
  );

  report.forbidden_request_count = forbiddenRequests.length;
  report.external_request_count = externalRequests.length;
  report.failed_request_count = failedRequests.length;
  const relevantConsoleErrors = consoleMessages.filter(
    (entry) => entry.type === "error" && !isIgnorableConsoleError(entry),
  );
  const ignoredConsoleErrors = consoleMessages.filter(
    (entry) => entry.type === "error" && isIgnorableConsoleError(entry),
  );
  report.console_error_count = relevantConsoleErrors.length;
  report.ignored_console_error_count = ignoredConsoleErrors.length;
  report.pageerror_count = pageErrors.length;

  recordAssertion("no_post_calls", postRequests.length === 0, "Browser UI made no POST requests.", {
    post_request_count: postRequests.length,
  });
  recordAssertion(
    "no_forbidden_route_calls",
    forbiddenRequests.length === 0,
    "Browser UI did not call final-answer, binding, readiness, provider, retrieval, product-write, GitHub, or release routes.",
    { forbidden_requests: forbiddenRequests },
  );
  recordAssertion(
    "no_external_requests",
    externalRequests.length === 0,
    "Browser UI made no external non-localhost requests.",
    { external_requests: externalRequests },
  );
  recordAssertion(
    "review_memory_get_routes_only_for_api",
    allowedReviewMemoryRequests.every((request) => request.method === "GET"),
    "Observed API requests were existing Review Memory GET routes only.",
    { allowed_review_memory_request_count: allowedReviewMemoryRequests.length },
  );
  recordAssertion("no_page_errors", pageErrors.length === 0, "No browser page errors were observed.", {
    page_errors: pageErrors,
  });
  recordAssertion(
    "no_console_errors",
    report.console_error_count === 0,
    "No relevant browser console errors were observed.",
    { console_errors: relevantConsoleErrors, ignored_console_errors: ignoredConsoleErrors },
  );
}

function createInitialReport() {
  return {
    validation_name: validationName,
    validation_version: validationVersion,
    timestamp: new Date().toISOString(),
    app_url: null,
    artifact_dir: artifactDir,
    screenshot_paths: {
      desktop: desktopScreenshotPath,
      mobile_390: mobileScreenshotPath,
    },
    browser_executable_path: null,
    browser_probe_paths: systemBrowserExecutableCandidates,
    browser_unavailable_reason: null,
    browser_backed_method: {
      selected: "Chrome DevTools Protocol with system Chrome/Chromium",
      dependency_addition_required: false,
    },
    network_observation_note:
      "This validator observes browser/page network events only; it is not server-side outbound network instrumentation.",
    dev_server_started: false,
    dev_server_terminated: false,
    seeded_review_memory_db_path: null,
    seeded_review_memory_record: null,
    page_loaded: false,
    panel_rendered: false,
    boundary_notes_visible: false,
    db_path_entered: false,
    list_action_completed: false,
    selected_record_opened: false,
    activity_history_loaded: false,
    bounded_packet_preview_created: false,
    invalid_db_path_blocked_before_fetch: false,
    private_raw_filter_blocked_before_fetch: false,
    request_response_summary: {
      observed_surface: "browser_page_cdp_events",
      request_count: 0,
      response_count: 0,
      failed_request_count: 0,
      external_request_count: 0,
      forbidden_request_count: 0,
      requests: [],
      forbidden_requests: [],
      external_requests: [],
      responses_by_status: {},
      allowed_api_routes: [
        "GET /api/research-candidate-review/review-records",
        "GET /api/research-candidate-review/review-records/[review_record_id]",
        "GET /api/research-candidate-review/review-records/[review_record_id]/activity",
      ],
    },
    forbidden_request_count: 0,
    external_request_count: 0,
    console_error_count: 0,
    pageerror_count: 0,
    failed_request_count: 0,
    assertions: [],
    preserved_boundaries: preservedBoundaries,
    final_status: "fail",
    failure: null,
  };
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
      const classified = classifyRequest(request.url, request.method);
      requestLog.push({
        phase: currentPhase,
        method: request.method,
        url: classified.safe_url,
        path: classified.path,
        resource_type: event.params?.type ?? "unknown",
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
        url: classified.safe_url,
        path: classified.path,
        status: response.status,
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.loadingFailed") {
      const errorText = String(event.params?.errorText ?? "request_failed");
      const type = String(event.params?.type ?? "unknown");
      if (type === "WebSocket") return;
      failedRequests.push({
        phase: currentPhase,
        type,
        error_text: errorText.slice(0, 180),
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
          .slice(0, 400),
      });
      return;
    }
    if (event.method === "Runtime.exceptionThrown") {
      pageErrors.push({
        phase: currentPhase,
        text: String(event.params?.exceptionDetails?.text ?? "exception").slice(0, 400),
      });
      return;
    }
    if (event.method === "Log.entryAdded") {
      const entry = event.params?.entry;
      if (entry?.level === "error") {
        consoleMessages.push({
          phase: currentPhase,
          type: "error",
          text: String(entry.text ?? "log_error").slice(0, 400),
        });
      }
    }
  });
}

function classifyRequest(urlValue, method = "GET") {
  let url = null;
  try {
    url = new URL(urlValue);
  } catch {
    return {
      safe_url: "non_url_request",
      path: null,
      is_external: false,
      forbidden_reasons: [],
    };
  }
  const isHttp = ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
  const isLocal = localHostnames.has(url.hostname);
  const pathName = url.pathname;
  const forbiddenReasons = [];
  if (isHttp && !isLocal) forbiddenReasons.push("external_non_localhost_url");
  if (method === "POST") forbiddenReasons.push("post_route_call_now");
  if (pathName.startsWith("/api/")) {
    const allowedReviewMemoryGet =
      method === "GET" &&
      /^\/api\/research-candidate-review\/review-records(?:\/[^/]+(?:\/activity)?)?$/.test(
        pathName,
      );
    if (!allowedReviewMemoryGet) forbiddenReasons.push("api_route_not_allowed_for_ui");
  }
  for (const matcher of forbiddenRouteMatchers) {
    if (matcher.matches(pathName)) forbiddenReasons.push(matcher.id);
  }
  return {
    safe_url: `${url.protocol}//${url.host}${pathName}`,
    path: pathName,
    is_external: isHttp && !isLocal,
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

async function setInputValue(id, value) {
  await evaluate(
    `(() => {
      const input = document.getElementById(${JSON.stringify(id)});
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()`,
  );
}

async function clickButton(label) {
  const clicked = await evaluateBoolean(
    `(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(label)});
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Button not found: ${label}`);
}

async function clickRecordButton(recordId) {
  const clicked = await evaluateBoolean(
    `(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent.includes(${JSON.stringify(recordId)}));
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Record button not found: ${recordId}`);
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

async function textVisible(text) {
  return evaluateBoolean(
    `Boolean(document.body && document.body.innerText.includes(${JSON.stringify(text)}))`,
  );
}

async function inputValueEquals(id, value) {
  return evaluateBoolean(
    `document.getElementById(${JSON.stringify(id)})?.value === ${JSON.stringify(value)}`,
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
    throw new Error(
      `Runtime.evaluate failed: ${response.exceptionDetails.text ?? "exception"}`,
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

async function captureScreenshot(filePath) {
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  if (!screenshot.data) throw new Error("Chrome did not return screenshot data.");
  await writeFile(filePath, Buffer.from(screenshot.data, "base64"));
}

async function waitForRequestQuiet() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < defaultTimeoutMs) {
    if (Date.now() - lastRequestAt >= requestQuietMs) return;
    await delay(100);
  }
}

function countReviewMemoryApiRequests() {
  return requestLog.filter((request) =>
    request.path?.startsWith("/api/research-candidate-review/review-records"),
  ).length;
}

function recordAssertion(id, passed, description, details = {}) {
  report.assertions.push({ id, passed: Boolean(passed), description, details });
}

function finalizeReport() {
  const responsesByStatus = {};
  for (const response of responseLog) {
    responsesByStatus[response.status] = (responsesByStatus[response.status] ?? 0) + 1;
  }
  const forbiddenRequests = requestLog.filter((request) => request.forbidden_reasons.length > 0);
  const externalRequests = requestLog.filter((request) => request.is_external);
  report.request_response_summary = {
    ...report.request_response_summary,
    request_count: requestLog.length,
    response_count: responseLog.length,
    failed_request_count: failedRequests.length,
    external_request_count: externalRequests.length,
    forbidden_request_count: forbiddenRequests.length,
    requests: requestLog.slice(0, 100),
    forbidden_requests: forbiddenRequests,
    external_requests: externalRequests,
    responses_by_status: responsesByStatus,
  };
  report.forbidden_request_count = forbiddenRequests.length;
  report.external_request_count = externalRequests.length;
  report.failed_request_count = failedRequests.length;
  report.console_error_count = consoleMessages.filter((entry) => entry.type === "error").length;
  report.console_error_count = consoleMessages.filter(
    (entry) => entry.type === "error" && !isIgnorableConsoleError(entry),
  ).length;
  report.ignored_console_error_count = consoleMessages.filter(
    (entry) => entry.type === "error" && isIgnorableConsoleError(entry),
  ).length;
  report.pageerror_count = pageErrors.length;
}

function isIgnorableConsoleError(entry) {
  if (!/Failed to load resource: the server responded with a status of 404/i.test(entry.text)) {
    return false;
  }
  return responseLog.some(
    (response) =>
      response.path === "/favicon.ico" &&
      response.status === 404 &&
      response.phase === entry.phase,
  );
}

function startDevServer() {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  env.AUGNES_DB_PATH = path.join(
    artifactDir,
    "unused-app-runtime-db-for-browser-validation.sqlite",
  );
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
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  devServerProcess.stdout?.on("data", (chunk) => {
    report.dev_server_stdout_tail = tailAppend(
      report.dev_server_stdout_tail,
      chunk.toString(),
    );
  });
  devServerProcess.stderr?.on("data", (chunk) => {
    report.dev_server_stderr_tail = tailAppend(
      report.dev_server_stderr_tail,
      chunk.toString(),
    );
  });
  devServerProcess.on("exit", (code, signal) => {
    report.dev_server_exit = { code, signal };
  });
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
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  chromeProcess.stdout?.on("data", (chunk) => {
    report.chrome_stdout_tail = tailAppend(report.chrome_stdout_tail, chunk.toString());
  });
  chromeProcess.stderr?.on("data", (chunk) => {
    report.chrome_stderr_tail = tailAppend(report.chrome_stderr_tail, chunk.toString());
  });
  chromeProcess.on("exit", (code, signal) => {
    report.chrome_exit = { code, signal };
  });
}

async function cleanup() {
  if (cdp) {
    await cdp.close().catch(() => undefined);
  }
  if (chromeProcess && !chromeProcess.killed) {
    chromeProcess.kill("SIGTERM");
  }
  if (devServerProcess && !devServerProcess.killed) {
    devServerProcess.kill("SIGTERM");
  }
  await delay(300);
  if (chromeProcess && !chromeProcess.killed) {
    chromeProcess.kill("SIGKILL");
  }
  if (devServerProcess && !devServerProcess.killed) {
    devServerProcess.kill("SIGKILL");
  }
  report.dev_server_terminated = Boolean(devServerProcess);
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
  throw new Error(`Timed out waiting for ${url}`);
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

function tailAppend(existing = [], text) {
  return [...existing, ...text.split("\n").filter(Boolean)].slice(-20);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeError(error) {
  return {
    name: error?.name ?? "Error",
    message: String(error?.message ?? error).slice(0, 1000),
  };
}
