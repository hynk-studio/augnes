import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const require = createRequire(import.meta.url);

const VALIDATION_NAME =
  "research-candidate-manual-note-lane-browser-validation";
const VALIDATION_VERSION = "v0.1";
const ARTIFACT_DIR = "/tmp/augnes-manual-note-lane-validation-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const DESKTOP_SCREENSHOT_PATH = path.join(ARTIFACT_DIR, "desktop.png");
const MOBILE_SCREENSHOT_PATH = path.join(ARTIFACT_DIR, "mobile-390.png");
const CONTRACT_TEST_REPORT_PATH =
  "/tmp/augnes-disabled-write-adapter-contract-tests-v0-1/report.json";
const TRANSACTION_PLAN_REPORT_PATH =
  "/tmp/augnes-disabled-write-adapter-transaction-plan-v0-1/report.json";
const PRODUCT_WRITE_DESIGN_REVIEW_REPORT_PATH =
  "/tmp/augnes-product-write-design-review-v0-1/report.json";
const TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-prototype-design-v0-1/report.json";
const TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_REPORT_PATH =
  "/tmp/augnes-single-claim-write-prototype-v0-1/report.json";
const TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-review-v0-1/report.json";
const TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-contract-tests-v0-1/report.json";
const SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json";
const SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json";
const SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json";
const SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json";
const SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json";
const SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json";
const SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json";
const SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json";
const DEFAULT_PORT = 3000;
const ROUTE_HASH = "#research-candidate-manual-note-preview-panel";
const PANEL_SELECTOR = "#research-candidate-manual-note-preview-panel";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const REQUEST_QUIET_MS = 800;
const DEFAULT_TIMEOUT_MS = 15_000;
const PROVIDER_KEY_ENV_NAME = ["OPENAI", "API", "KEY"].join("_");

const SYSTEM_BROWSER_EXECUTABLE_CANDIDATES = [
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

const PRESERVED_BOUNDARIES = [
  "no product behavior change",
  "no route contract change",
  "no schema change",
  "no migration script invocation",
  "no repo schema or migration code changes",
  "temp DB may be initialized only by existing app runtime schema bootstrap",
  "no seed/reset behavior",
  "no dependency addition",
  "provider API key environment unset for the launched app",
  "no provider/OpenAI call",
  "no retrieval/RAG/source fetching",
  "no proof/evidence write",
  "no Perspective promotion",
  "no canonical graph write",
  "no work item creation",
  "no approval/publication workflow creation",
  "no review/promote/reject/defer workflow creation",
  "no raw manual note persistence",
  "no browser persistence",
  "no packet history persistence",
  "no checklist persistence",
  "no external handoff/email/slack/webhook/share",
  "no new top-level state machine",
];

function createInitialReport() {
  const timestamp = new Date().toISOString();
  return {
    validation_name: VALIDATION_NAME,
    validation_version: VALIDATION_VERSION,
    timestamp,
    app_url: null,
    db_path: null,
    artifact_dir: ARTIFACT_DIR,
    browser_executable_path: null,
    browser_probe_paths: SYSTEM_BROWSER_EXECUTABLE_CANDIDATES,
    provider_api_key_env_unset_for_app: true,
    browser_backed_method: {
      attempted_order: [
        "repo self-contained browser validator",
        "Playwright Chromium with system Chrome/Chromium executable",
      ],
      selected: null,
      unavailable_reason: null,
    },
    network_observation_scope: {
      observed_surface:
        "browser-backed page request, response, console, pageerror, and requestfailed events",
      external_request_counts:
        "browser-observed only; this is not server-side outbound network instrumentation",
      forbidden_request_counts:
        "browser-observed only; this is not server-side outbound network instrumentation",
    },
    route_action_observations: {
      phases: [],
      manual_note_requests_by_phase: {},
    },
    request_response_summary: {
      observed_surface: "browser_page_playwright_events",
      count_scope:
        "Browser-observed page requests/responses/failures only; server-side outbound network calls are not instrumented by this validator.",
      request_count: 0,
      response_count: 0,
      failed_request_count: 0,
      external_request_count: 0,
      forbidden_request_count: 0,
      manual_note_route_counts: {},
      status_counts: {},
      external_requests: [],
      forbidden_requests: [],
      failed_requests: [],
    },
    external_request_count: 0,
    forbidden_request_count: 0,
    console_pageerror_failure_summary: {
      console_count: 0,
      console_error_count: 0,
      console_warning_count: 0,
      pageerror_count: 0,
      failed_request_count: 0,
      console_messages: [],
      pageerrors: [],
      failed_requests: [],
    },
    local_parse_api_request_assertion_result: null,
    request_classification_self_check_result: null,
    runtime_route_assertion_result: null,
    dry_run_plan_assertion_result: null,
    candidate_review_design_assertion_result: null,
    disabled_adapter_readiness_assertion_result: null,
    disabled_adapter_temp_harness_assertion_result: null,
    contract_tests_artifact_note: null,
    transaction_plan_artifact_note: null,
    product_write_design_review_artifact_note: null,
    temp_db_single_claim_prototype_design_artifact_note: null,
    temp_db_single_claim_write_prototype_artifact_note: null,
    temp_db_single_claim_result_review_artifact_note: null,
    temp_db_single_claim_result_contract_tests_artifact_note: null,
    single_claim_product_write_gate_design_artifact_note: null,
    single_claim_temp_to_product_bridge_design_artifact_note: null,
    single_claim_temp_to_product_disabled_bridge_skeleton_artifact_note: null,
    single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_artifact_note:
      null,
    single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_artifact_note:
      null,
    single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note:
      null,
    single_claim_product_write_authority_contract_bundle_artifact_note: null,
    single_claim_product_write_disabled_adapter_skeleton_artifact_note: null,
    two_draft_transition_assertion_result: null,
    storage_boundary_inspection_result: null,
    mobile_layout_assertion_result: null,
    screenshot_paths: {
      desktop: DESKTOP_SCREENSHOT_PATH,
      mobile_390: MOBILE_SCREENSHOT_PATH,
    },
    assertions: [],
    preserved_boundaries: PRESERVED_BOUNDARIES,
    dev_server: {
      started: false,
      port: null,
      process_id: null,
      stdout_tail: [],
      stderr_tail: [],
      terminated: false,
    },
    cleanup: {
      browser_closed: false,
      dev_server_terminated: false,
    },
    final_status: "fail",
    failure: null,
  };
}

const report = createInitialReport();
const requestLog = [];
const responseLog = [];
const consoleLog = [];
const pageErrors = [];
const failedRequests = [];
let currentPhase = "setup";
let browser = null;
let context = null;
let page = null;
let serverProcess = null;
let selectedPort = null;
let appUrl = null;
let dbPath = null;

async function main() {
  await mkdir(ARTIFACT_DIR, { recursive: true });

  selectedPort = await chooseAvailablePort();
  appUrl = `http://localhost:${selectedPort}/${ROUTE_HASH}`;
  dbPath = path.join(
    ARTIFACT_DIR,
    `augnes-manual-note-lane-${Date.now()}.db`,
  );
  report.app_url = appUrl;
  report.db_path = dbPath;
  report.dev_server.port = selectedPort;

  report.request_classification_self_check_result =
    runObservedUrlClassificationSelfCheck(selectedPort);
  recordAssertion(
    "request_classification_effective_port_self_check",
    report.request_classification_self_check_result.passed,
    "Observed URL classification treats local app requests as same-origin only when the effective port matches the selected app port.",
    report.request_classification_self_check_result,
  );

  const playwright = await loadPlaywright();
  const browserExecutablePath = findBrowserExecutablePath();
  report.browser_executable_path = browserExecutablePath;
  report.browser_backed_method.selected =
    "Playwright Chromium using system Chrome/Chromium executable";

  serverProcess = startDevServer({ port: selectedPort, dbPath });
  await waitForServerReady(`http://localhost:${selectedPort}/`);

  browser = await playwright.chromium.launch({
    executablePath: browserExecutablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: `http://localhost:${selectedPort}`,
  }).catch(() => undefined);
  page = await context.newPage();
  attachPageObservers(page, selectedPort);

  await validateOperatorFlow(page);
  report.contract_tests_artifact_note = buildContractTestsArtifactNote();
  const contractTestRouteRequests = requestLog.filter((request) =>
    /disabled-write-adapter-contract-tests|contract-test/i.test(request.path ?? ""),
  );
  recordAssertion(
    "contract_tests_fixture_only_no_browser_route",
    contractTestRouteRequests.length === 0,
    "Fixture-only disabled write adapter contract tests added no browser-observed route behavior.",
    {
      contract_test_route_request_count: contractTestRouteRequests.length,
      artifact_note: report.contract_tests_artifact_note,
    },
  );
  report.transaction_plan_artifact_note = buildTransactionPlanArtifactNote();
  const transactionPlanRouteRequests = requestLog.filter((request) =>
    /disabled-write-adapter-transaction|transaction-plan|abort-result/i.test(
      request.path ?? "",
    ),
  );
  recordAssertion(
    "transaction_plan_fixture_only_no_browser_route",
    transactionPlanRouteRequests.length === 0,
    "Disabled write adapter transaction-plan artifacts added no browser-observed route behavior.",
    {
      transaction_plan_route_request_count: transactionPlanRouteRequests.length,
      artifact_note: report.transaction_plan_artifact_note,
    },
  );
  report.product_write_design_review_artifact_note =
    buildProductWriteDesignReviewArtifactNote();
  const productWriteDesignReviewRouteRequests = requestLog.filter((request) =>
    /product-write-design-review|product-write-design|write-design-review/i.test(
      request.path ?? "",
    ),
  );
  recordAssertion(
    "product_write_design_review_no_browser_route",
    productWriteDesignReviewRouteRequests.length === 0,
    "Product-write design review artifacts added no browser-observed route behavior.",
    {
      product_write_design_review_route_request_count:
        productWriteDesignReviewRouteRequests.length,
      artifact_note: report.product_write_design_review_artifact_note,
    },
  );
  report.temp_db_single_claim_prototype_design_artifact_note =
    buildTempDbSingleClaimPrototypeDesignArtifactNote();
  const tempDbSingleClaimPrototypeDesignRouteRequests = requestLog.filter((request) =>
    /temp-db-single-claim|single-claim-prototype|claim-write-prototype/i.test(
      request.path ?? "",
    ),
  );
  recordAssertion(
    "temp_db_single_claim_prototype_design_no_browser_route",
    tempDbSingleClaimPrototypeDesignRouteRequests.length === 0,
    "Temp DB single-claim prototype design artifacts added no browser-observed route behavior.",
    {
      temp_db_single_claim_prototype_design_route_request_count:
        tempDbSingleClaimPrototypeDesignRouteRequests.length,
      artifact_note:
        report.temp_db_single_claim_prototype_design_artifact_note,
    },
  );
  report.temp_db_single_claim_write_prototype_artifact_note =
    buildTempDbSingleClaimWritePrototypeArtifactNote();
  const tempDbSingleClaimWritePrototypeRouteRequests = requestLog.filter(
    (request) =>
      /temp-db-single-claim-write|single-claim-write-prototype|write-prototype-harness/i.test(
        request.path ?? "",
      ),
  );
  recordAssertion(
    "temp_db_single_claim_write_prototype_no_browser_route",
    tempDbSingleClaimWritePrototypeRouteRequests.length === 0,
    "Temp DB single-claim write prototype harness added no browser-observed route behavior.",
    {
      temp_db_single_claim_write_prototype_route_request_count:
        tempDbSingleClaimWritePrototypeRouteRequests.length,
      artifact_note: report.temp_db_single_claim_write_prototype_artifact_note,
    },
  );
  report.temp_db_single_claim_result_review_artifact_note =
    buildTempDbSingleClaimResultReviewArtifactNote();
  const tempDbSingleClaimResultReviewRouteRequests = requestLog.filter((request) =>
    /temp-db-single-claim-result-review|single-claim-result-review|result-review/i.test(
      request.path ?? "",
    ),
  );
  recordAssertion(
    "temp_db_single_claim_result_review_no_browser_route",
    tempDbSingleClaimResultReviewRouteRequests.length === 0,
    "Temp DB single-claim result review artifacts added no browser-observed route behavior.",
    {
      temp_db_single_claim_result_review_route_request_count:
        tempDbSingleClaimResultReviewRouteRequests.length,
      artifact_note: report.temp_db_single_claim_result_review_artifact_note,
    },
  );
  report.temp_db_single_claim_result_contract_tests_artifact_note =
    buildTempDbSingleClaimResultContractTestsArtifactNote();
  const tempDbSingleClaimResultContractTestsRouteRequests = requestLog.filter(
    (request) =>
      /temp-db-single-claim-result-contract|single-claim-result-contract|result-contract-tests/i.test(
        request.path ?? "",
      ),
  );
  recordAssertion(
    "temp_db_single_claim_result_contract_tests_no_browser_route",
    tempDbSingleClaimResultContractTestsRouteRequests.length === 0,
    "Temp DB single-claim result contract tests added no browser-observed route behavior.",
    {
      temp_db_single_claim_result_contract_tests_route_request_count:
        tempDbSingleClaimResultContractTestsRouteRequests.length,
      artifact_note:
        report.temp_db_single_claim_result_contract_tests_artifact_note,
    },
  );
  report.single_claim_product_write_gate_design_artifact_note =
    buildSingleClaimProductWriteGateDesignArtifactNote();
  const singleClaimProductWriteGateDesignRouteRequests = requestLog.filter(
    (request) =>
      /single-claim-product-write-gate|product-write-gate-design|single-claim-temp-to-product-bridge/i.test(
        request.path ?? "",
      ),
  );
  recordAssertion(
    "single_claim_product_write_gate_design_no_browser_route",
    singleClaimProductWriteGateDesignRouteRequests.length === 0,
    "Single-claim product write gate design artifacts added no browser-observed route behavior.",
    {
      single_claim_product_write_gate_design_route_request_count:
        singleClaimProductWriteGateDesignRouteRequests.length,
      artifact_note: report.single_claim_product_write_gate_design_artifact_note,
    },
  );
  report.single_claim_temp_to_product_bridge_design_artifact_note =
    buildSingleClaimTempToProductBridgeDesignArtifactNote();
  const singleClaimTempToProductBridgeDesignRouteRequests = requestLog.filter(
    (request) =>
      /single-claim-temp-to-product-bridge|temp-to-product-bridge-design/i.test(
        request.path ?? "",
      ),
  );
  recordAssertion(
    "single_claim_temp_to_product_bridge_design_no_browser_route",
    singleClaimTempToProductBridgeDesignRouteRequests.length === 0,
    "Single-claim temp-to-product bridge design artifacts added no browser-observed route behavior.",
    {
      single_claim_temp_to_product_bridge_design_route_request_count:
        singleClaimTempToProductBridgeDesignRouteRequests.length,
      artifact_note:
        report.single_claim_temp_to_product_bridge_design_artifact_note,
    },
  );
  report.single_claim_temp_to_product_disabled_bridge_skeleton_artifact_note =
    buildSingleClaimTempToProductDisabledBridgeSkeletonArtifactNote();
  const singleClaimTempToProductDisabledBridgeSkeletonRouteRequests =
    requestLog.filter((request) =>
      /single-claim-temp-to-product-disabled-bridge|disabled-bridge-skeleton/i.test(
        request.path ?? "",
      ),
    );
  recordAssertion(
    "single_claim_temp_to_product_disabled_bridge_skeleton_no_browser_route",
    singleClaimTempToProductDisabledBridgeSkeletonRouteRequests.length === 0,
    "Single-claim temp-to-product disabled bridge skeleton artifacts added no browser-observed route behavior.",
    {
      single_claim_temp_to_product_disabled_bridge_skeleton_route_request_count:
        singleClaimTempToProductDisabledBridgeSkeletonRouteRequests.length,
      artifact_note:
        report.single_claim_temp_to_product_disabled_bridge_skeleton_artifact_note,
    },
  );
  report.single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_artifact_note =
    buildSingleClaimTempToProductDisabledBridgeSkeletonContractTestsArtifactNote();
  const singleClaimTempToProductDisabledBridgeSkeletonContractTestsRouteRequests =
    requestLog.filter((request) =>
      /single-claim-temp-to-product-disabled-bridge-skeleton-contract|disabled-bridge-skeleton-contract-tests/i.test(
        request.path ?? "",
      ),
    );
  recordAssertion(
    "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_no_browser_route",
    singleClaimTempToProductDisabledBridgeSkeletonContractTestsRouteRequests.length ===
      0,
    "Single-claim temp-to-product disabled bridge skeleton contract-test artifacts added no browser-observed route behavior.",
    {
      single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_route_request_count:
        singleClaimTempToProductDisabledBridgeSkeletonContractTestsRouteRequests.length,
      artifact_note:
        report
          .single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_artifact_note,
    },
  );
  report.single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_artifact_note =
    buildSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanArtifactNote();
  const singleClaimTempToProductDisabledBridgeDryRunTransactionPlanRouteRequests =
    requestLog.filter((request) =>
      /single-claim-temp-to-product-disabled-bridge-dry-run|dry-run-transaction-plan/i.test(
        request.path ?? "",
      ),
    );
  recordAssertion(
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_no_browser_route",
    singleClaimTempToProductDisabledBridgeDryRunTransactionPlanRouteRequests.length ===
      0,
    "Single-claim temp-to-product disabled bridge dry-run transaction-plan artifacts added no browser-observed route behavior.",
    {
      single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_route_request_count:
        singleClaimTempToProductDisabledBridgeDryRunTransactionPlanRouteRequests.length,
      artifact_note:
        report
          .single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_artifact_note,
    },
  );
  report.single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note =
    buildSingleClaimTempToProductDisabledBridgeDryRunTransactionHarnessArtifactNote();
  const singleClaimTempToProductDisabledBridgeDryRunTransactionHarnessRouteRequests =
    requestLog.filter((request) =>
      /single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness|dry-run-transaction-harness/i.test(
        request.path ?? "",
      ),
    );
  recordAssertion(
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_no_browser_route",
    singleClaimTempToProductDisabledBridgeDryRunTransactionHarnessRouteRequests.length ===
      0,
    "Single-claim temp-to-product disabled bridge dry-run transaction-harness artifacts added no browser-observed route behavior.",
    {
      single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_route_request_count:
        singleClaimTempToProductDisabledBridgeDryRunTransactionHarnessRouteRequests.length,
      artifact_note:
        report
          .single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note,
    },
  );
  report.single_claim_product_write_authority_contract_bundle_artifact_note =
    buildSingleClaimProductWriteAuthorityContractBundleArtifactNote();
  const singleClaimProductWriteAuthorityContractBundleRouteRequests =
    requestLog.filter((request) =>
      /single-claim-product-write-authority-contract|product-write-authority-contract-bundle/i.test(
        request.path ?? "",
      ),
    );
  recordAssertion(
    "single_claim_product_write_authority_contract_bundle_no_browser_route",
    singleClaimProductWriteAuthorityContractBundleRouteRequests.length === 0,
    "Single-claim product write authority contract bundle artifacts added no browser-observed route behavior.",
    {
      single_claim_product_write_authority_contract_bundle_route_request_count:
        singleClaimProductWriteAuthorityContractBundleRouteRequests.length,
      artifact_note:
        report.single_claim_product_write_authority_contract_bundle_artifact_note,
    },
  );
  report.single_claim_product_write_disabled_adapter_skeleton_artifact_note =
    buildSingleClaimProductWriteDisabledAdapterSkeletonArtifactNote();
  const singleClaimProductWriteDisabledAdapterSkeletonRouteRequests =
    requestLog.filter((request) =>
      /single-claim-product-write-disabled-adapter|product-write-disabled-adapter-skeleton/i.test(
        request.path ?? "",
      ),
    );
  recordAssertion(
    "single_claim_product_write_disabled_adapter_skeleton_no_browser_route",
    singleClaimProductWriteDisabledAdapterSkeletonRouteRequests.length === 0,
    "Single-claim product write disabled adapter skeleton artifacts added no browser-observed route behavior.",
    {
      single_claim_product_write_disabled_adapter_skeleton_route_request_count:
        singleClaimProductWriteDisabledAdapterSkeletonRouteRequests.length,
      artifact_note:
        report.single_claim_product_write_disabled_adapter_skeleton_artifact_note,
    },
  );
  report.storage_boundary_inspection_result = inspectStorageBoundary(dbPath);
  recordAssertion(
    "storage_boundary_inspection",
    report.storage_boundary_inspection_result.passed,
    "Temp DB keeps manual-note preview storage inside expected non-canonical tables.",
    report.storage_boundary_inspection_result,
  );

  finalizeSummaries();
  const failed = report.assertions.filter((assertion) => !assertion.passed);
  report.final_status = failed.length === 0 ? "pass" : "fail";
  if (failed.length > 0) {
    throw new Error(
      `Validation failed: ${failed.map((assertion) => assertion.id).join(", ")}`,
    );
  }
}

async function validateOperatorFlow(page) {
  await runPhase("page_load", "Open manual-note preview lane", async () => {
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(PANEL_SELECTOR, {
      state: "visible",
      timeout: DEFAULT_TIMEOUT_MS,
    });
    const panel = page.locator(PANEL_SELECTOR);
    await panel.scrollIntoViewIfNeeded();
    await waitForRequestQuiet();
    await assertVisible(panel.getByRole("heading", {
      name: "Cockpit Manual Pasted Note Preview",
    }), "panel_heading_visible", "Manual-note preview panel heading is visible.");
    await assertVisible(panel.getByRole("button", { name: "Use sample note" }), "sample_button_visible", "Sample note button is visible.");
    await assertVisible(panel.getByRole("button", { name: "Parse locally" }), "local_parse_button_visible", "Local parse button is visible.");
  });

  const panel = page.locator(PANEL_SELECTOR);
  await runPhase("prepare_sample_a", "Load sample note A", async () => {
    await panel.getByRole("button", { name: "Use sample note" }).click();
    await panel.getByLabel("Operator preview label").fill("Validation draft A");
    const text = await panel.getByLabel("Manual note text").inputValue();
    recordAssertion(
      "sample_note_loaded",
      text.includes("Research Question:"),
      "Sample note loaded into the manual note textarea.",
      { text_length: text.length },
    );
  });

  const localParseRequestCountBefore = countResearchCandidateApiRequests();
  await runPhase("local_parse", "Parse sample locally", async () => {
    await panel.getByRole("button", { name: "Parse locally" }).click();
    await waitForText(panel, "Parser authority");
    await waitForText(panel, "Local parser execution remains available.");
    await waitForRequestQuiet();
  });
  const localParseApiRequestCount =
    countResearchCandidateApiRequests() - localParseRequestCountBefore;
  report.local_parse_api_request_assertion_result = {
    passed: localParseApiRequestCount === 0,
    research_candidate_api_request_delta: localParseApiRequestCount,
    phase: "local_parse",
  };
  recordAssertion(
    "local_parse_zero_research_candidate_api_requests",
    report.local_parse_api_request_assertion_result.passed,
    "Local deterministic parse made zero Research Candidate API requests.",
    report.local_parse_api_request_assertion_result,
  );

  const createA = await runPhase("runtime_create_draft_a", "Create runtime preview draft A", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "POST",
      routeKind: "create",
      action: () =>
        panel
          .getByRole("button", { name: "Create runtime preview draft" })
          .click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "Validation draft A");
    recordAssertion(
      "runtime_preview_draft_create_a",
      response.status() === 201 && body?.ok === true && body?.persisted_preview_draft === true,
      "Runtime preview draft A was created through the same-origin runtime route.",
      {
        status: response.status(),
        preview_draft_id: body?.preview_draft_id ?? null,
      },
    );
    return body;
  });
  const draftAId = createA.preview_draft_id;

  await runPhase("refresh_draft_list", "Refresh recent draft list", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "list",
      action: () =>
        panel.getByRole("button", { name: "Refresh preview drafts" }).click(),
    });
    const body = await safeResponseJson(response);
    recordAssertion(
      "recent_draft_list_refresh",
      response.status() === 200 && body?.ok === true && Array.isArray(body.items),
      "Recent runtime preview draft list refreshed successfully.",
      { status: response.status(), count: body?.count ?? null },
    );
  });

  await runPhase("draft_list_controls", "Exercise list filters, sort, and limit", async () => {
    await selectAndWaitForList(panel, "Lifecycle filter", "all");
    await selectAndWaitForList(panel, "Sort order", "created_asc");
    await selectAndWaitForList(panel, "Warning filter", "without_warnings");
    await selectAndWaitForList(panel, "Candidate filter", "with_candidates");
    await selectAndWaitForList(panel, "Limit selector", "25");
    await selectAndWaitForList(panel, "Sort order", "created_desc");
    await selectAndWaitForList(panel, "Warning filter", "all");
    await selectAndWaitForList(panel, "Candidate filter", "all");
    await selectAndWaitForList(panel, "Lifecycle filter", "active");
    await selectAndWaitForList(panel, "Limit selector", "10");
    await waitForText(panel, "Validation draft A");
    recordAssertion(
      "draft_list_controls_usable",
      true,
      "List lifecycle, sort, warning, candidate, and limit controls remained usable.",
      { reset_lifecycle: "active", reset_sort: "created_desc", reset_limit: 10 },
    );
  });

  await openDraftByLabel(panel, "Validation draft A", "open_draft_a");
  await updateDraftLabel({
    panel,
    currentLabel: "Validation draft A",
    nextLabel: "Validation draft A relabeled",
    assertionId: "label_save_a",
  });
  await updateDraftLabel({
    panel,
    currentLabel: "Validation draft A relabeled",
    nextLabel: "",
    assertionId: "label_clear_a",
    expectedVisibleText: "Untitled preview draft",
  });

  await runPhase("load_activity_a", "Load draft A activity", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "activity",
      action: () => panel.getByRole("button", { name: "Load activity" }).click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "Label cleared");
    recordAssertion(
      "activity_readout_a",
      response.status() === 200 && body?.ok === true && body.count >= 1,
      "Draft A activity readout loaded create/label lifecycle metadata.",
      { status: response.status(), count: body?.count ?? null },
    );
  });

  let preflightA = null;
  await runPhase("run_preflight_a", "Run draft A promotion readiness preflight", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "preflight",
      action: () => panel.getByRole("button", { name: "Run preflight" }).click(),
    });
    preflightA = await safeResponseJson(response);
    await waitForText(panel, "readiness_status");
    await assertVisible(panel.locator(".manual-note-gate-explanations"), "gate_explanations_visible", "Gate explanations rendered after preflight.");
    recordAssertion(
      "promotion_readiness_preflight_a",
      response.status() === 200 && preflightA?.ok === true,
      "Draft A promotion readiness preflight loaded without starting promotion.",
      {
        status: response.status(),
        readiness_status: preflightA?.readiness_status ?? null,
        gate_count: preflightA?.gate_results?.length ?? null,
      },
    );
  });

  await runPhase("run_dry_run_plan_a", "Generate no-write dry-run plan A", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "dry_run_plan",
      action: () =>
        panel
          .getByRole("button", { name: "Generate no-write dry-run plan" })
          .click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "dry_run_status");
    await waitForText(panel, "This is not promotion.");
    await waitForText(panel, "Blocked side effects");
    await panel.getByRole("button", { name: "Copy Markdown dry-run plan" }).click();
    const copyFeedback = await waitForLocalCopyFeedback(panel, {
      fallbackLabel: "Manual dry-run plan copy fallback",
      fallbackSelector: ".manual-note-readiness-copy-packet-fallback",
      successText: "Markdown dry-run plan copied locally to clipboard.",
    });
    report.dry_run_plan_assertion_result = {
      passed:
        response.status() === 200 &&
        body?.ok === true &&
        ["blocked", "needs_operator_review", "plan_ready"].includes(
          body?.dry_run_status,
        ) &&
        body?.runtime_boundary?.dry_run_plan_persisted === false &&
        body?.runtime_boundary?.proof_or_evidence_writes === false &&
        body?.runtime_boundary?.canonical_graph_write === false &&
        body?.runtime_boundary?.work_item_creation === false &&
        body?.runtime_boundary?.provider_or_openai_calls === false &&
        body?.runtime_boundary?.retrieval_or_rag === false &&
        body?.runtime_boundary?.source_fetching === false &&
        copyFeedback.passed,
      status: response.status(),
      dry_run_status: body?.dry_run_status ?? null,
      copy_feedback: copyFeedback,
      runtime_boundary: body?.runtime_boundary ?? null,
    };
    recordAssertion(
      "promotion_dry_run_plan_a",
      report.dry_run_plan_assertion_result.passed,
      "Draft A no-write promotion dry-run plan loaded via same-origin route and local Markdown copy/fallback worked.",
      report.dry_run_plan_assertion_result,
    );
  });

  await runPhase(
    "candidate_review_design_a",
    "Build/copy local candidate review and authority design packets A",
    async () => {
      const beforeApiRequestCount = countResearchCandidateApiRequests();
      await waitForText(panel, "Dry-run candidate review and authority design");
      await waitForText(panel, "Selections are not persisted.");
      await waitForText(panel, "Selections do not grant write authority.");
      await panel
        .getByRole("button", { name: "Select all dry-run candidates" })
        .click();
      await panel
        .getByRole("button", {
          name: "Build selected candidate review packet",
        })
        .click();
      await waitForText(panel, "Selected candidate review packet");
      await waitForText(panel, "Unresolved authority requirements");
      await panel
        .getByRole("button", {
          name: "Build authority-gated design packet",
        })
        .click();
      await waitForText(panel, "Authority-gated actual promotion design packet");
      await waitForText(panel, "Proposed write contract");
      await waitForText(panel, "Idempotency design");
      await waitForText(panel, "Rollback design");
      await waitForText(panel, "Review audit design");
      await waitForText(panel, "Source evidence authority design");
      await waitForText(panel, "Execution boundary");

      await panel
        .getByRole("button", { name: "Copy selected review Markdown" })
        .click();
      const reviewCopyFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual review or design packet copy fallback",
        successText: "Selected review Markdown copied locally to clipboard.",
      });

      await panel
        .getByRole("button", { name: "Copy authority design JSON" })
        .click();
      const designCopyFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual review or design packet copy fallback",
        successText: "Authority design JSON copied locally to clipboard.",
      });
      const afterApiRequestCount = countResearchCandidateApiRequests();

      report.candidate_review_design_assertion_result = {
        passed:
          afterApiRequestCount === beforeApiRequestCount &&
          reviewCopyFeedback.passed &&
          designCopyFeedback.passed,
        no_new_research_candidate_api_requests:
          afterApiRequestCount === beforeApiRequestCount,
        review_copy_feedback: reviewCopyFeedback,
        design_copy_feedback: designCopyFeedback,
      };
      recordAssertion(
        "candidate_review_design_a",
        report.candidate_review_design_assertion_result.passed,
        "Draft A local-only candidate review/design packet selection, build, and copy/fallback worked without a new API route.",
        report.candidate_review_design_assertion_result,
      );
    },
  );

  await runPhase(
    "disabled_adapter_readiness_a",
    "Check/copy disabled adapter readiness A",
    async () => {
      const response = await clickAndWaitForManualNoteResponse({
        method: "POST",
        routeKind: "disabled_adapter_readiness",
        action: () =>
          panel
            .getByRole("button", { name: "Check disabled adapter readiness" })
            .click(),
      });
      const body = await safeResponseJson(response);
      await waitForText(panel, "Disabled adapter readiness");
      await waitForText(panel, "adapter_status");
      await waitForText(panel, "disabled_by_default");
      await waitForText(panel, "write_execution_status");
      await waitForText(panel, "not_executable");

      await panel
        .getByRole("button", { name: "Copy disabled adapter Markdown" })
        .click();
      const markdownCopyFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual disabled adapter copy fallback",
        successText: "Disabled adapter Markdown copied locally to clipboard.",
      });
      await panel
        .getByRole("button", { name: "Copy disabled adapter JSON" })
        .click();
      const jsonCopyFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual disabled adapter copy fallback",
        successText: "Disabled adapter JSON copied locally to clipboard.",
      });

      const disabledRouteRequests = requestLog.filter(
        (request) =>
          request.phase === "disabled_adapter_readiness_a" &&
          request.manual_note_route?.kind === "disabled_adapter_readiness",
      );
      const actualWriteRouteRequests = requestLog.filter((request) =>
        isActualPromotionWriteRoutePath(request.path),
      );

      report.disabled_adapter_readiness_assertion_result = {
        passed:
          response.status() === 200 &&
          body?.ok === true &&
          body.preview_draft_id === draftAId &&
          body.adapter_status === "disabled_by_default" &&
          body.write_execution_status === "not_executable" &&
          body.disabled_write_contract?.actual_write_route_added === true &&
          body.disabled_write_contract?.actual_write_route_enabled === false &&
          body.disabled_write_contract?.write_execution_enabled === false &&
          body.disabled_write_contract?.normal_product_write_enabled === false &&
          body.execution_boundary?.proof_or_evidence_writes === false &&
          body.execution_boundary?.perspective_or_canonical_writes === false &&
          body.execution_boundary?.canonical_graph_write === false &&
          body.execution_boundary?.work_item_creation === false &&
          body.execution_boundary?.provider_or_openai_calls === false &&
          body.execution_boundary?.retrieval_or_rag === false &&
          body.execution_boundary?.source_fetching === false &&
          body.execution_boundary?.external_handoff_sent === false &&
          body.execution_boundary?.adapter_readiness_persisted === false &&
          body.execution_boundary?.browser_persistence === false &&
          disabledRouteRequests.length === 1 &&
          disabledRouteRequests.every((request) => !request.is_external) &&
          actualWriteRouteRequests.length === 0 &&
          markdownCopyFeedback.passed &&
          jsonCopyFeedback.passed,
        status: response.status(),
        adapter_status: body?.adapter_status ?? null,
        write_execution_status: body?.write_execution_status ?? null,
        disabled_route_request_count: disabledRouteRequests.length,
        disabled_route_requests_same_origin: disabledRouteRequests.every(
          (request) => !request.is_external,
        ),
        actual_write_route_request_count: actualWriteRouteRequests.length,
        markdown_copy_feedback: markdownCopyFeedback,
        json_copy_feedback: jsonCopyFeedback,
        disabled_write_contract: body?.disabled_write_contract ?? null,
        execution_boundary: body?.execution_boundary ?? null,
      };
      recordAssertion(
        "disabled_adapter_readiness_a",
        report.disabled_adapter_readiness_assertion_result.passed,
        "Draft A disabled adapter readiness route returned a non-executable no-write envelope and local copy/fallback worked.",
        report.disabled_adapter_readiness_assertion_result,
      );
    },
  );

  await runPhase(
    "disabled_adapter_temp_harness_a",
    "Review disabled adapter contract and build temp harness A",
    async () => {
      const beforeApiRequestCount = countResearchCandidateApiRequests();
      await panel
        .getByRole("button", { name: "Review disabled adapter contract" })
        .click();
      await waitForText(panel, "Contract review");
      await waitForText(panel, "contract_status");
      await waitForText(panel, "ready_for_temp_harness");
      await waitForText(panel, "Required contract checks");
      await waitForText(panel, "Contract gaps");
      await waitForText(panel, "Preserved boundaries");

      await panel
        .getByRole("button", { name: "Build temp harness simulation" })
        .click();
      await waitForText(panel, "Temp harness simulation");
      await waitForText(panel, "harness_status");
      await waitForText(panel, "temp_harness_ready");
      await waitForText(panel, "execution_mode");
      await waitForText(panel, "temp_non_product_simulation");
      await waitForText(panel, "product_write_mode");
      await waitForText(panel, "Simulated write intent counts");
      await waitForText(panel, "Temp harness boundary");

      await panel
        .getByRole("button", { name: "Copy contract review Markdown" })
        .click();
      const contractMarkdownFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual temp harness copy fallback",
        successText: "Contract review Markdown copied locally to clipboard.",
      });
      await panel
        .getByRole("button", { name: "Copy contract review JSON" })
        .click();
      const contractJsonFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual temp harness copy fallback",
        successText: "Contract review JSON copied locally to clipboard.",
      });
      await panel
        .getByRole("button", { name: "Copy temp harness Markdown" })
        .click();
      const harnessMarkdownFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual temp harness copy fallback",
        successText: "Temp harness Markdown copied locally to clipboard.",
      });
      await panel
        .getByRole("button", { name: "Copy temp harness JSON" })
        .click();
      const harnessJsonFeedback = await waitForLocalCopyFeedback(panel, {
        fallbackLabel: "Manual temp harness copy fallback",
        successText: "Temp harness JSON copied locally to clipboard.",
      });

      const afterApiRequestCount = countResearchCandidateApiRequests();
      const actualWriteRouteRequests = requestLog.filter((request) =>
        isActualPromotionWriteRoutePath(request.path),
      );
      const tempHarnessRouteRequests = requestLog.filter((request) =>
        request.path.startsWith("/api/") &&
        /disabled-adapter-temp-harness|manual-note-disabled-adapter-temp-harness|contract-review|temp-harness/.test(
          request.path,
        ),
      );

      report.disabled_adapter_temp_harness_assertion_result = {
        passed:
          afterApiRequestCount === beforeApiRequestCount &&
          tempHarnessRouteRequests.length === 0 &&
          actualWriteRouteRequests.length === 0 &&
          contractMarkdownFeedback.passed &&
          contractJsonFeedback.passed &&
          harnessMarkdownFeedback.passed &&
          harnessJsonFeedback.passed,
        no_new_research_candidate_api_requests:
          afterApiRequestCount === beforeApiRequestCount,
        temp_harness_route_request_count: tempHarnessRouteRequests.length,
        actual_write_route_request_count: actualWriteRouteRequests.length,
        contract_markdown_copy_feedback: contractMarkdownFeedback,
        contract_json_copy_feedback: contractJsonFeedback,
        harness_markdown_copy_feedback: harnessMarkdownFeedback,
        harness_json_copy_feedback: harnessJsonFeedback,
      };
      recordAssertion(
        "disabled_adapter_temp_harness_a",
        report.disabled_adapter_temp_harness_assertion_result.passed,
        "Draft A local-only contract review/temp harness simulation and copy/fallback worked without a new API route or product write route.",
        report.disabled_adapter_temp_harness_assertion_result,
      );
    },
  );

  await runPhase("copy_packet_a", "Generate/copy readiness packet A", async () => {
    await waitForText(panel, "Packet freshness status");
    await waitForText(panel, "No packet copied yet");
    await panel.getByRole("button", { name: "Copy human review packet" }).click();
    await waitForText(panel, "Current");
    const fallbackVisible = await panel
      .locator(".manual-note-readiness-copy-packet-fallback")
      .isVisible()
      .catch(() => false);
    recordAssertion(
      "readiness_copy_packet_a",
      true,
      "Readiness packet was generated and marked current; fallback is acceptable when clipboard is unavailable.",
      { fallback_visible: fallbackVisible },
    );
  });

  await runPhase("packet_review_workspace_a", "Exercise packet review workspace A", async () => {
    await panel.getByRole("radio", { name: "JSON" }).check();
    await panel.getByRole("radio", { name: "Full" }).check();
    await panel.getByRole("radio", { name: "Block" }).check();
    await panel.getByRole("radio", { name: "Warning" }).check();
    await panel.getByRole("radio", { name: "Pass" }).check();
    await panel.getByRole("radio", { name: "All" }).check();
    const boundaryCheckbox = panel
      .locator(".manual-note-readiness-packet-review-sections label")
      .filter({ hasText: "boundary" })
      .locator("input");
    await boundaryCheckbox.uncheck();
    await waitForText(panel, "preview_is_filtered");
    await boundaryCheckbox.check();
    await panel.getByRole("radio", { name: "Markdown" }).check();
    await panel.getByRole("radio", { name: "Summary" }).check();
    recordAssertion(
      "packet_review_workspace_controls_a",
      true,
      "Packet review workspace Markdown/JSON, Summary/Full, gate filters, and section visibility controls worked.",
      { final_format: "markdown", final_detail: "summary", final_gate_filter: "all" },
    );
  });

  await runPhase("local_packet_checklist_a", "Exercise local packet checklist A", async () => {
    const checklist = panel.locator(".manual-note-local-packet-review-checklist");
    await assertVisible(checklist, "local_packet_checklist_visible", "Local packet review checklist rendered.");
    const firstCheckbox = checklist.locator("input[type='checkbox']").first();
    await firstCheckbox.check();
    await checklist.getByLabel("Local packet review notes").fill("Local-only browser validation note.");
    await waitForText(checklist, "in_progress");
    await checklist.getByRole("button", { name: "Reset local checklist" }).click();
    await waitForText(checklist, "no_checklist_started");
    recordAssertion(
      "local_packet_checklist_a",
      true,
      "Local packet review checklist can be checked, noted, and reset without persistence routes.",
      { status_after_reset: "no_checklist_started" },
    );
  });

  await page.screenshot({ path: DESKTOP_SCREENSHOT_PATH, fullPage: true });

  await updateDraftLabel({
    panel,
    currentLabel: "Untitled preview draft",
    nextLabel: "Validation draft A stale marker",
    assertionId: "packet_stale_after_label_change_a",
    expectedVisibleText: "Stale",
  });
  await waitForText(panel, "Copy a fresh packet before using it for review.");

  await runPhase("dry_run_plan_cleared_after_label_change_a", "Confirm label change clears dry-run plan A", async () => {
    const dryRunSection = panel.locator(".manual-note-promotion-dry-run-plan");
    await assertVisible(dryRunSection, "dry_run_plan_section_still_visible_after_label_change", "Dry-run readout shell remains visible after label change.");
    const generateVisible = await dryRunSection
      .getByRole("button", { name: "Generate no-write dry-run plan" })
      .isVisible()
      .catch(() => false);
    const statusVisible = await dryRunSection
      .getByText("dry_run_status", { exact: false })
      .isVisible()
      .catch(() => false);
    const disabledReadoutVisible = await panel
      .locator(".manual-note-disabled-promotion-write-adapter-readout")
      .isVisible()
      .catch(() => false);
    const tempHarnessReadoutVisible = await panel
      .locator(".manual-note-disabled-adapter-temp-harness-readout")
      .isVisible()
      .catch(() => false);
    recordAssertion(
      "dry_run_plan_cleared_after_label_change_a",
      generateVisible &&
        !statusVisible &&
        !disabledReadoutVisible &&
        !tempHarnessReadoutVisible,
      "Label save/clear on the current draft cleared the previously generated dry-run plan and dependent disabled adapter/temp harness readout.",
      {
        generate_visible: generateVisible,
        dry_run_status_visible: statusVisible,
        disabled_adapter_readout_visible: disabledReadoutVisible,
        temp_harness_readout_visible: tempHarnessReadoutVisible,
      },
    );
  });

  let discardedPreflight = null;
  await runPhase("discard_draft_a", "Discard draft A and confirm preflight blocks", async () => {
    const card = getDraftCard(panel, "Validation draft A stale marker");
    await card.getByRole("button", { name: "Discard preview draft" }).click();
    await waitForText(card, "Confirm discard preview draft");
    const response = await clickAndWaitForManualNoteResponse({
      method: "POST",
      routeKind: "discard",
      action: () =>
        card.getByRole("button", { name: "Confirm discard preview draft" }).click(),
    });
    const discardBody = await safeResponseJson(response);
    await waitForText(panel, "Discarded preview draft");
    const preflightResponse = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "preflight",
      action: () =>
        panel.getByRole("button", { name: /Refresh preflight|Run preflight/ }).click(),
    });
    discardedPreflight = await safeResponseJson(preflightResponse);
    await waitForText(panel, "Blocked");
    recordAssertion(
      "discarded_draft_preflight_blocked_a",
      response.status() === 200 &&
        discardBody?.ok === true &&
        preflightResponse.status() === 200 &&
        discardedPreflight?.ok === true &&
        discardedPreflight.readiness_status === "blocked",
      "Discarded draft preflight returned the expected blocked state.",
      {
        discard_status: response.status(),
        preflight_status: preflightResponse.status(),
        readiness_status: discardedPreflight?.readiness_status ?? null,
      },
    );
  });

  const createB = await runPhase("runtime_create_draft_b", "Create runtime preview draft B", async () => {
    await panel.getByLabel("Operator preview label").fill("Validation draft B");
    const response = await clickAndWaitForManualNoteResponse({
      method: "POST",
      routeKind: "create",
      action: () =>
        panel
          .getByRole("button", { name: "Create runtime preview draft" })
          .click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "Validation draft B");
    recordAssertion(
      "runtime_preview_draft_create_b",
      response.status() === 201 && body?.ok === true && body.preview_draft_id !== draftAId,
      "Runtime preview draft B was created separately from draft A.",
      {
        status: response.status(),
        preview_draft_id: body?.preview_draft_id ?? null,
        draft_a_id: draftAId,
      },
    );
    return body;
  });

  await openDraftByLabel(panel, "Validation draft B", "open_draft_b");
  report.two_draft_transition_assertion_result = await assertTwoDraftStateDidNotLeak(panel, {
    draftAId,
    draftBId: createB.preview_draft_id,
  });
  recordAssertion(
    "two_draft_transition_no_leak",
    report.two_draft_transition_assertion_result.passed,
    "Draft A activity/preflight/copy state did not leak into opened draft B.",
    report.two_draft_transition_assertion_result,
  );

  await runPhase("load_activity_b", "Load draft B activity", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "activity",
      action: () => panel.getByRole("button", { name: "Load activity" }).click(),
    });
    const body = await safeResponseJson(response);
    recordAssertion(
      "activity_readout_b",
      response.status() === 200 && body?.ok === true,
      "Draft B activity readout loaded for the opened draft.",
      { status: response.status(), count: body?.count ?? null },
    );
  });

  await runPhase("run_preflight_b", "Run draft B preflight and copy packet", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "preflight",
      action: () => panel.getByRole("button", { name: "Run preflight" }).click(),
    });
    const body = await safeResponseJson(response);
    await panel.getByRole("button", { name: "Copy JSON packet" }).click();
    await waitForText(panel, "Current");
    recordAssertion(
      "preflight_copy_b",
      response.status() === 200 && body?.ok === true,
      "Draft B preflight and local JSON packet generation worked independently.",
      { status: response.status(), readiness_status: body?.readiness_status ?? null },
    );
  });

  await runPhase("run_dry_run_plan_b", "Generate no-write dry-run plan B", async () => {
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "dry_run_plan",
      action: () =>
        panel
          .getByRole("button", { name: "Generate no-write dry-run plan" })
          .click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "dry_run_status");
    recordAssertion(
      "promotion_dry_run_plan_b",
      response.status() === 200 &&
        body?.ok === true &&
        body.preview_draft_id === createB.preview_draft_id,
      "Draft B dry-run plan loaded independently after draft switch.",
      {
        status: response.status(),
        preview_draft_id: body?.preview_draft_id ?? null,
        draft_b_id: createB.preview_draft_id,
      },
    );
  });

  await runPhase(
    "candidate_review_design_no_leak_b",
    "Confirm draft A review/design copy state does not leak under draft B",
    async () => {
      await waitForText(panel, "Dry-run candidate review and authority design");
      const staleFallbackVisible = await panel
        .getByLabel("Manual review or design packet copy fallback")
        .isVisible()
        .catch(() => false);
      const staleReviewMessageVisible = await panel
        .getByText("Selected review Markdown copied locally to clipboard.", {
          exact: false,
        })
        .isVisible()
        .catch(() => false);
      const staleDesignMessageVisible = await panel
        .getByText("Authority design JSON copied locally to clipboard.", {
          exact: false,
        })
        .isVisible()
        .catch(() => false);
      const selectedReviewPacketVisible = await panel
        .locator(".manual-note-dry-run-candidate-review-design")
        .getByRole("heading", { name: "Selected candidate review packet" })
        .isVisible()
        .catch(() => false);
      const authorityDesignPacketVisible = await panel
        .locator(".manual-note-dry-run-candidate-review-design")
        .getByRole("heading", {
          name: "Authority-gated actual promotion design packet",
        })
        .isVisible()
        .catch(() => false);
      const staleDisabledFallbackVisible = await panel
        .getByLabel("Manual disabled adapter copy fallback")
        .isVisible()
        .catch(() => false);
      const staleDisabledMessageVisible = await panel
        .getByText("Disabled adapter JSON copied locally to clipboard.", {
          exact: false,
        })
        .isVisible()
        .catch(() => false);
      const staleTempHarnessFallbackVisible = await panel
        .getByLabel("Manual temp harness copy fallback")
        .isVisible()
        .catch(() => false);
      const staleTempHarnessMessageVisible = await panel
        .getByText("Temp harness JSON copied locally to clipboard.", {
          exact: false,
        })
        .isVisible()
        .catch(() => false);
      const disabledAdapterReadoutVisible = await panel
        .locator(".manual-note-disabled-promotion-write-adapter-readout")
        .isVisible()
        .catch(() => false);
      const tempHarnessReadoutVisible = await panel
        .locator(".manual-note-disabled-adapter-temp-harness-readout")
        .isVisible()
        .catch(() => false);

      const passed =
        !staleFallbackVisible &&
        !staleReviewMessageVisible &&
        !staleDesignMessageVisible &&
        !selectedReviewPacketVisible &&
        !authorityDesignPacketVisible &&
        !staleDisabledFallbackVisible &&
        !staleDisabledMessageVisible &&
        !disabledAdapterReadoutVisible &&
        !staleTempHarnessFallbackVisible &&
        !staleTempHarnessMessageVisible &&
        !tempHarnessReadoutVisible;
      report.candidate_review_design_assertion_result = {
        ...(report.candidate_review_design_assertion_result ?? {}),
        stale_state_transition_passed: passed,
        stale_fallback_visible_under_draft_b: staleFallbackVisible,
        stale_review_message_visible_under_draft_b: staleReviewMessageVisible,
        stale_design_message_visible_under_draft_b: staleDesignMessageVisible,
        selected_review_packet_visible_under_draft_b: selectedReviewPacketVisible,
        authority_design_packet_visible_under_draft_b:
          authorityDesignPacketVisible,
        stale_disabled_fallback_visible_under_draft_b:
          staleDisabledFallbackVisible,
        stale_disabled_message_visible_under_draft_b:
          staleDisabledMessageVisible,
        stale_temp_harness_fallback_visible_under_draft_b:
          staleTempHarnessFallbackVisible,
        stale_temp_harness_message_visible_under_draft_b:
          staleTempHarnessMessageVisible,
        disabled_adapter_readout_visible_under_draft_b:
          disabledAdapterReadoutVisible,
        temp_harness_readout_visible_under_draft_b: tempHarnessReadoutVisible,
        passed:
          Boolean(report.candidate_review_design_assertion_result?.passed) &&
          passed,
      };
      report.disabled_adapter_readiness_assertion_result = {
        ...(report.disabled_adapter_readiness_assertion_result ?? {}),
        stale_state_transition_passed: passed,
        stale_disabled_fallback_visible_under_draft_b:
          staleDisabledFallbackVisible,
        stale_disabled_message_visible_under_draft_b:
          staleDisabledMessageVisible,
        stale_temp_harness_fallback_visible_under_draft_b:
          staleTempHarnessFallbackVisible,
        stale_temp_harness_message_visible_under_draft_b:
          staleTempHarnessMessageVisible,
        disabled_adapter_readout_visible_under_draft_b:
          disabledAdapterReadoutVisible,
        temp_harness_readout_visible_under_draft_b: tempHarnessReadoutVisible,
        passed:
          Boolean(report.disabled_adapter_readiness_assertion_result?.passed) &&
          passed,
      };
      report.disabled_adapter_temp_harness_assertion_result = {
        ...(report.disabled_adapter_temp_harness_assertion_result ?? {}),
        stale_state_transition_passed: passed,
        stale_temp_harness_fallback_visible_under_draft_b:
          staleTempHarnessFallbackVisible,
        stale_temp_harness_message_visible_under_draft_b:
          staleTempHarnessMessageVisible,
        temp_harness_readout_visible_under_draft_b: tempHarnessReadoutVisible,
        passed:
          Boolean(report.disabled_adapter_temp_harness_assertion_result?.passed) &&
          passed,
      };
      recordAssertion(
        "candidate_review_design_no_leak_b",
        passed,
        "Draft B dry-run plan did not show draft A selected packet fallback/message/state.",
        report.candidate_review_design_assertion_result,
      );
    },
  );

  await runPhase("clear_runtime_result", "Clear runtime result state", async () => {
    const card = getDraftCard(panel, "Validation draft B");
    await card.getByRole("button", { name: "Discard preview draft" }).click();
    await waitForText(card, "Confirm discard preview draft");
    await card.getByRole("button", { name: "Edit label" }).click();
    await panel.getByRole("button", { name: "Clear runtime result" }).click();
    await waitForText(panel, "No preview result is selected yet.");
    const stillVisible = await anyVisible(panel, [
      ".manual-note-preview-draft-activity",
      ".manual-note-promotion-readiness",
      ".manual-note-promotion-dry-run-plan",
      ".manual-note-dry-run-candidate-review-design",
      ".manual-note-disabled-promotion-write-adapter-readout",
      ".manual-note-disabled-adapter-temp-harness-readout",
      ".manual-note-readiness-copy-packet",
      ".manual-note-preview-draft-label-edit",
    ]);
    const confirmStillVisible = await panel
      .getByRole("button", { name: "Confirm discard preview draft" })
      .isVisible()
      .catch(() => false);
    recordAssertion(
      "clear_runtime_result_clears_hook_owned_state",
      !stillVisible && !confirmStillVisible,
      "Clear runtime result cleared opened/activity/preflight/label/confirm-discard/copy-adjacent state.",
      { stale_runtime_surface_visible: stillVisible, confirm_discard_visible: confirmStillVisible },
    );
  });

  await runPhase("clear_local_note", "Clear local note state", async () => {
    await panel.getByLabel("Operator preview label").fill("Validation draft C clear local");
    const response = await clickAndWaitForManualNoteResponse({
      method: "POST",
      routeKind: "create",
      action: () =>
        panel
          .getByRole("button", { name: "Create runtime preview draft" })
          .click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "Runtime authority");
    await panel.getByRole("button", { name: "Clear local note" }).click();
    const textValue = await panel.getByLabel("Manual note text").inputValue();
    const labelValue = await panel.getByLabel("Operator preview label").inputValue();
    await waitForText(panel, "No preview result is selected yet.");
    const runtimeSurfaceVisible = await anyVisible(panel, [
      ".manual-note-preview-draft-activity",
      ".manual-note-promotion-readiness",
      ".manual-note-promotion-dry-run-plan",
      ".manual-note-dry-run-candidate-review-design",
      ".manual-note-disabled-promotion-write-adapter-readout",
      ".manual-note-disabled-adapter-temp-harness-readout",
      ".manual-note-readiness-copy-packet",
    ]);
    recordAssertion(
      "clear_local_note_clears_local_and_runtime_state",
      response.status() === 201 &&
        body?.ok === true &&
        textValue === "" &&
        labelValue === "" &&
        !runtimeSurfaceVisible,
      "Clear local note cleared local input and runtime-owned display state.",
      {
        create_status: response.status(),
        text_length_after_clear: textValue.length,
        label_length_after_clear: labelValue.length,
        runtime_surface_visible: runtimeSurfaceVisible,
      },
    );
  });

  await runPhase("mobile_390_layout", "Validate 390px mobile layout", async () => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.locator(PANEL_SELECTOR).scrollIntoViewIfNeeded();
    await assertVisible(panel.getByRole("heading", {
      name: "Cockpit Manual Pasted Note Preview",
    }), "mobile_panel_reachable", "Manual-note panel remains reachable at 390px.");
    const overflow = await page.locator(PANEL_SELECTOR).evaluate((element) => {
      const viewportWidth = window.innerWidth;
      const descendants = Array.from(element.querySelectorAll("*"));
      const overflowingDescendants = descendants
        .filter((node) => {
          const style = window.getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden") {
            return false;
          }
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -4 || rect.right > viewportWidth + 4);
        })
        .slice(0, 8)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            tag: node.tagName.toLowerCase(),
            class_name: node.getAttribute("class"),
            text: (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        });

      return {
        viewport_width: viewportWidth,
        document_scroll_width: document.documentElement.scrollWidth,
        panel_client_width: element.clientWidth,
        panel_scroll_width: element.scrollWidth,
        overflowing_descendants: overflowingDescendants,
      };
    });
    await page.screenshot({ path: MOBILE_SCREENSHOT_PATH, fullPage: true });
    report.mobile_layout_assertion_result = {
      passed:
        overflow.panel_scroll_width <= overflow.panel_client_width + 4 &&
        overflow.overflowing_descendants.length === 0,
      ...overflow,
      document_overflow_observed:
        overflow.document_scroll_width > overflow.viewport_width + 4,
    };
    recordAssertion(
      "mobile_390_no_obvious_horizontal_overflow",
      report.mobile_layout_assertion_result.passed,
      "Manual-note lane container has no obvious horizontal overflow at 390px.",
      report.mobile_layout_assertion_result,
    );
  });

  report.runtime_route_assertion_result = assertRuntimeRouteUsage();
  recordAssertion(
    "runtime_route_usage_after_actions",
    report.runtime_route_assertion_result.passed,
    "Manual-note same-origin runtime routes were observed only during expected startup/read/action phases.",
    report.runtime_route_assertion_result,
  );

  finalizeSummaries();
  recordAssertion(
    "external_request_count_zero",
    report.external_request_count === 0,
    "Browser-observed external request count is zero.",
    {
      external_request_count: report.external_request_count,
      count_scope: report.network_observation_scope.external_request_counts,
    },
  );
  recordAssertion(
    "forbidden_request_count_zero",
    report.forbidden_request_count === 0,
    "Browser-observed Provider/OpenAI/retrieval/RAG/source-fetch request count is zero.",
    {
      forbidden_request_count: report.forbidden_request_count,
      count_scope: report.network_observation_scope.forbidden_request_counts,
    },
  );
  recordAssertion(
    "console_pageerror_request_failure_clean",
    report.console_pageerror_failure_summary.actionable_console_error_count === 0 &&
      report.console_pageerror_failure_summary.pageerror_count === 0 &&
      report.console_pageerror_failure_summary.failed_request_count === 0,
    "No actionable console errors, pageerror events, or failed requests were observed; known non-manual-note dev startup console noise is recorded separately.",
    report.console_pageerror_failure_summary,
  );
}

async function openDraftByLabel(panel, label, phaseId) {
  await runPhase(phaseId, `Open stored draft ${label}`, async () => {
    const card = getDraftCard(panel, label);
    await assertVisible(card, `${phaseId}_card_visible`, `Draft card ${label} is visible.`);
    const response = await clickAndWaitForManualNoteResponse({
      method: "GET",
      routeKind: "open",
      action: () => card.getByRole("button", { name: "Open preview draft" }).click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, "Stored draft authority");
    recordAssertion(
      `${phaseId}_stored_draft_open`,
      response.status() === 200 && body?.ok === true,
      `Stored draft ${label} opened from persisted preview JSON.`,
      {
        status: response.status(),
        preview_draft_id: body?.draft?.preview_draft_id ?? null,
        lifecycle_status: body?.lifecycle_status ?? null,
      },
    );
  });
}

async function updateDraftLabel({
  panel,
  currentLabel,
  nextLabel,
  assertionId,
  expectedVisibleText = nextLabel,
}) {
  await runPhase(assertionId, `Update draft label from ${currentLabel}`, async () => {
    const card = getDraftCard(panel, currentLabel);
    await card.getByRole("button", { name: "Edit label" }).click();
    const input = card.locator(".manual-note-preview-draft-label-edit input");
    await input.fill(nextLabel);
    const response = await clickAndWaitForManualNoteResponse({
      method: "PATCH",
      routeKind: "label",
      action: () => card.getByRole("button", { name: "Save label" }).click(),
    });
    const body = await safeResponseJson(response);
    await waitForText(panel, expectedVisibleText);
    recordAssertion(
      assertionId,
      response.status() === 200 &&
        body?.ok === true &&
        (nextLabel ? body.operator_note_label === nextLabel : body.operator_note_label === null),
      nextLabel
        ? "Draft label save route updated operator-facing metadata."
        : "Draft label clear route cleared operator-facing metadata.",
      {
        status: response.status(),
        operator_note_label: body?.operator_note_label ?? null,
      },
    );
  });
}

async function assertTwoDraftStateDidNotLeak(panel, { draftAId, draftBId }) {
  const activityLoadVisible = await panel
    .getByRole("button", { name: "Load activity" })
    .isVisible()
    .catch(() => false);
  const refreshActivityVisible = await panel
    .getByRole("button", { name: "Refresh activity" })
    .isVisible()
    .catch(() => false);
  const runPreflightVisible = await panel
    .getByRole("button", { name: "Run preflight" })
    .isVisible()
    .catch(() => false);
  const refreshPreflightVisible = await panel
    .getByRole("button", { name: "Refresh preflight" })
    .isVisible()
    .catch(() => false);
  const copyPacketVisible = await panel
    .locator(".manual-note-readiness-copy-packet")
    .isVisible()
    .catch(() => false);
  const generateDryRunVisible = await panel
    .getByRole("button", { name: "Generate no-write dry-run plan" })
    .isVisible()
    .catch(() => false);
  const dryRunStatusVisible = await panel
    .locator(".manual-note-promotion-dry-run-plan")
    .getByText("dry_run_status", { exact: false })
    .isVisible()
    .catch(() => false);
  const result = {
    passed:
      Boolean(draftAId) &&
      Boolean(draftBId) &&
      draftAId !== draftBId &&
      activityLoadVisible &&
      !refreshActivityVisible &&
      runPreflightVisible &&
      !refreshPreflightVisible &&
      !copyPacketVisible &&
      generateDryRunVisible &&
      !dryRunStatusVisible,
    draft_a_id: draftAId,
    draft_b_id: draftBId,
    activity_load_visible: activityLoadVisible,
    refresh_activity_visible: refreshActivityVisible,
    run_preflight_visible: runPreflightVisible,
    refresh_preflight_visible: refreshPreflightVisible,
    copy_packet_visible_before_b_preflight: copyPacketVisible,
    generate_dry_run_visible: generateDryRunVisible,
    dry_run_status_visible_before_b_generation: dryRunStatusVisible,
  };
  return result;
}

function getDraftCard(panel, label) {
  return panel.locator(".manual-note-preview-draft-card").filter({ hasText: label }).first();
}

async function selectAndWaitForList(panel, label, value) {
  const select = panel
    .locator(".manual-note-preview-drafts-actions label")
    .filter({ hasText: label })
    .locator("select");
  const currentValue = await select.inputValue();
  if (currentValue === String(value)) return;
  await clickAndWaitForManualNoteResponse({
    method: "GET",
    routeKind: "list",
    action: () => select.selectOption(String(value)),
  });
}

async function clickAndWaitForManualNoteResponse({ method, routeKind, action }) {
  const responsePromise = page.waitForResponse((response) => {
    const route = classifyManualNoteRoute(response.url());
    return (
      route?.kind === routeKind &&
      response.request().method().toUpperCase() === method
    );
  }, { timeout: DEFAULT_TIMEOUT_MS });
  const [response] = await Promise.all([responsePromise, action()]);
  return response;
}

async function safeResponseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function assertVisible(locator, id, summary) {
  await locator.waitFor({ state: "visible", timeout: DEFAULT_TIMEOUT_MS });
  const visible = await locator.isVisible();
  recordAssertion(id, visible, summary, {});
}

async function waitForText(root, text) {
  await root.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout: DEFAULT_TIMEOUT_MS,
  });
}

async function waitForLocalCopyFeedback(root, {
  fallbackLabel,
  fallbackSelector = null,
  successText,
}) {
  const startedAt = Date.now();
  let fallbackVisible = false;
  let successVisible = false;
  while (Date.now() - startedAt < 3_000) {
    fallbackVisible = fallbackSelector
      ? await root.locator(fallbackSelector).isVisible().catch(() => false)
      : await root.getByLabel(fallbackLabel).isVisible().catch(() => false);
    successVisible = await root
      .getByText(successText, { exact: false })
      .isVisible()
      .catch(() => false);
    if (fallbackVisible || successVisible) break;
    await sleep(100);
  }

  return {
    passed: fallbackVisible || successVisible,
    fallback_label: fallbackLabel,
    fallback_visible: fallbackVisible,
    success_text: successText,
    success_visible: successVisible,
  };
}

function buildContractTestsArtifactNote() {
  const reportExists = existsSync(CONTRACT_TEST_REPORT_PATH);
  return {
    report_path: CONTRACT_TEST_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Fixture-only disabled write adapter contract test report was present before or during browser validation; browser flow does not execute fixture tests."
      : "Fixture-only disabled write adapter contract test report was not present; browser flow does not execute fixture tests.",
  };
}

function buildTransactionPlanArtifactNote() {
  const reportExists = existsSync(TRANSACTION_PLAN_REPORT_PATH);
  return {
    report_path: TRANSACTION_PLAN_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Disabled write adapter transaction-plan report was present before or during browser validation; browser flow does not execute transaction-plan artifacts."
      : "Disabled write adapter transaction-plan report was not present; browser flow does not execute transaction-plan artifacts.",
  };
}

function buildProductWriteDesignReviewArtifactNote() {
  const reportExists = existsSync(PRODUCT_WRITE_DESIGN_REVIEW_REPORT_PATH);
  return {
    report_path: PRODUCT_WRITE_DESIGN_REVIEW_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Product-write design review report was present before or during browser validation; browser flow does not execute design-review artifacts."
      : "Product-write design review report was not present; browser flow does not execute design-review artifacts.",
  };
}

function buildTempDbSingleClaimPrototypeDesignArtifactNote() {
  const reportExists = existsSync(TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_REPORT_PATH);
  return {
    report_path: TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Temp DB single-claim prototype design report was present before or during browser validation; browser flow does not execute prototype design artifacts."
      : "Temp DB single-claim prototype design report was not present; browser flow does not execute prototype design artifacts.",
  };
}

function buildTempDbSingleClaimWritePrototypeArtifactNote() {
  const reportExists = existsSync(TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_REPORT_PATH);
  return {
    report_path: TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Temp DB single-claim write prototype harness report was present before or during browser validation; browser flow does not execute non-UI harness artifacts."
      : "Temp DB single-claim write prototype harness report was not present; browser flow does not execute non-UI harness artifacts.",
  };
}

function buildTempDbSingleClaimResultReviewArtifactNote() {
  const reportExists = existsSync(TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_REPORT_PATH);
  return {
    report_path: TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Temp DB single-claim result review report was present before or during browser validation; browser flow does not execute non-UI result-review artifacts."
      : "Temp DB single-claim result review report was not present; browser flow does not execute non-UI result-review artifacts.",
  };
}

function buildTempDbSingleClaimResultContractTestsArtifactNote() {
  const reportExists = existsSync(
    TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_REPORT_PATH,
  );
  return {
    report_path: TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Temp DB single-claim result contract-test report was present before or during browser validation; browser flow does not execute non-UI fixture contract-test artifacts."
      : "Temp DB single-claim result contract-test report was not present; browser flow does not execute non-UI fixture contract-test artifacts.",
  };
}

function buildSingleClaimProductWriteGateDesignArtifactNote() {
  const reportExists = existsSync(SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH);
  return {
    report_path: SINGLE_CLAIM_PRODUCT_WRITE_GATE_DESIGN_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim product write gate design report was present before or during browser validation; browser flow does not execute non-UI gate-design artifacts."
      : "Single-claim product write gate design report was not present; browser flow does not execute non-UI gate-design artifacts.",
  };
}

function buildSingleClaimTempToProductBridgeDesignArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_REPORT_PATH,
  );
  return {
    report_path: SINGLE_CLAIM_TEMP_TO_PRODUCT_BRIDGE_DESIGN_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim temp-to-product bridge design report was present before or during browser validation; browser flow does not execute non-UI bridge-design artifacts."
      : "Single-claim temp-to-product bridge design report was not present; browser flow does not execute non-UI bridge-design artifacts.",
  };
}

function buildSingleClaimTempToProductDisabledBridgeSkeletonArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_REPORT_PATH,
  );
  return {
    report_path:
      SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim temp-to-product disabled bridge skeleton report was present before or during browser validation; browser flow does not execute non-UI disabled bridge skeleton artifacts."
      : "Single-claim temp-to-product disabled bridge skeleton report was not present; browser flow does not execute non-UI disabled bridge skeleton artifacts.",
  };
}

function buildSingleClaimTempToProductDisabledBridgeSkeletonContractTestsArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_REPORT_PATH,
  );
  return {
    report_path:
      SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim temp-to-product disabled bridge skeleton contract-test report was present before or during browser validation; browser flow does not execute non-UI fixture contract-test artifacts."
      : "Single-claim temp-to-product disabled bridge skeleton contract-test report was not present; browser flow does not execute non-UI fixture contract-test artifacts.",
  };
}

function buildSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_REPORT_PATH,
  );
  return {
    report_path:
      SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim temp-to-product disabled bridge dry-run transaction-plan report was present before or during browser validation; browser flow does not execute non-UI dry-run transaction-plan artifacts."
      : "Single-claim temp-to-product disabled bridge dry-run transaction-plan report was not present; browser flow does not execute non-UI dry-run transaction-plan artifacts.",
  };
}

function buildSingleClaimTempToProductDisabledBridgeDryRunTransactionHarnessArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_REPORT_PATH,
  );
  return {
    report_path:
      SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim temp-to-product disabled bridge dry-run transaction-harness report was present before or during browser validation; browser flow does not execute non-UI dry-run transaction-harness artifacts."
      : "Single-claim temp-to-product disabled bridge dry-run transaction-harness report was not present; browser flow does not execute non-UI dry-run transaction-harness artifacts.",
  };
}

function buildSingleClaimProductWriteAuthorityContractBundleArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_REPORT_PATH,
  );
  return {
    report_path: SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim product write authority contract bundle report was present before or during browser validation; browser flow does not execute non-UI authority contract bundle artifacts."
      : "Single-claim product write authority contract bundle report was not present; browser flow does not execute non-UI authority contract bundle artifacts.",
  };
}

function buildSingleClaimProductWriteDisabledAdapterSkeletonArtifactNote() {
  const reportExists = existsSync(
    SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
  );
  return {
    report_path: SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
    report_exists: reportExists,
    note: reportExists
      ? "Single-claim product write disabled adapter skeleton report was present before or during browser validation; browser flow does not execute non-UI disabled adapter skeleton artifacts."
      : "Single-claim product write disabled adapter skeleton report was not present; browser flow does not execute non-UI disabled adapter skeleton artifacts.",
  };
}

async function anyVisible(root, selectors) {
  for (const selector of selectors) {
    const visible = await root.locator(selector).isVisible().catch(() => false);
    if (visible) return true;
  }
  return false;
}

async function runPhase(id, label, fn) {
  const previousPhase = currentPhase;
  const startRequestCount = requestLog.length;
  const startResponseCount = responseLog.length;
  const phaseRecord = {
    id,
    label,
    started_at: new Date().toISOString(),
    completed_at: null,
    status: "running",
    request_delta: 0,
    response_delta: 0,
    manual_note_requests: [],
  };
  report.route_action_observations.phases.push(phaseRecord);
  currentPhase = id;
  try {
    const result = await fn();
    await waitForRequestQuiet();
    phaseRecord.status = "passed";
    return result;
  } catch (error) {
    phaseRecord.status = "failed";
    phaseRecord.error = serializeError(error);
    throw error;
  } finally {
    phaseRecord.completed_at = new Date().toISOString();
    phaseRecord.request_delta = requestLog.length - startRequestCount;
    phaseRecord.response_delta = responseLog.length - startResponseCount;
    phaseRecord.manual_note_requests = requestLog
      .slice(startRequestCount)
      .filter((request) => request.manual_note_route)
      .map((request) => ({
        method: request.method,
        path: request.path,
        route_kind: request.manual_note_route.kind,
      }));
    currentPhase = previousPhase;
  }
}

function recordAssertion(id, passed, summary, details = {}) {
  const existingIndex = report.assertions.findIndex(
    (assertion) => assertion.id === id,
  );
  const assertion = {
    id,
    passed: Boolean(passed),
    summary,
    details,
  };
  if (existingIndex >= 0) {
    report.assertions[existingIndex] = assertion;
  } else {
    report.assertions.push(assertion);
  }
}

function attachPageObservers(page, port) {
  page.on("request", (request) => {
    const parsed = parseObservedUrl(request.url(), port);
    const manualNoteRoute = classifyManualNoteRoute(request.url());
    requestLog.push({
      phase: currentPhase,
      method: request.method(),
      url: redactUrl(request.url()),
      path: parsed.path,
      resource_type: request.resourceType(),
      is_external: parsed.isExternal,
      is_forbidden: parsed.isForbidden,
      manual_note_route: manualNoteRoute,
    });
  });

  page.on("response", (response) => {
    const parsed = parseObservedUrl(response.url(), port);
    const manualNoteRoute = classifyManualNoteRoute(response.url());
    responseLog.push({
      phase: currentPhase,
      method: response.request().method(),
      url: redactUrl(response.url()),
      path: parsed.path,
      status: response.status(),
      is_external: parsed.isExternal,
      is_forbidden: parsed.isForbidden,
      manual_note_route: manualNoteRoute,
    });
  });

  page.on("requestfailed", (request) => {
    const parsed = parseObservedUrl(request.url(), port);
    failedRequests.push({
      phase: currentPhase,
      method: request.method(),
      url: redactUrl(request.url()),
      path: parsed.path,
      failure: request.failure()?.errorText ?? "unknown request failure",
      is_external: parsed.isExternal,
      is_forbidden: parsed.isForbidden,
    });
  });

  page.on("console", (message) => {
    consoleLog.push({
      phase: currentPhase,
      type: message.type(),
      text: message.text().slice(0, 500),
      location: message.location(),
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push({
      phase: currentPhase,
      message: error.message,
      stack: error.stack?.slice(0, 1200) ?? null,
    });
  });
}

function parseObservedUrl(value, port) {
  try {
    const url = new URL(value);
    const protocol = url.protocol.replace(":", "");
    const pathWithSearch = `${url.pathname}${url.search}`;
    const isNetworkProtocol = ["http", "https", "ws", "wss"].includes(protocol);
    const isLocalHost = LOCAL_HOSTNAMES.has(url.hostname);
    const effectivePort = getEffectivePort(url);
    const isExternal =
      isNetworkProtocol && (!isLocalHost || effectivePort !== port);
    const lower = value.toLowerCase();
    const isForbidden =
      isNetworkProtocol &&
      /openai|provider|retrieval|\/rag\b|source-fetch|source_fetch|fetch-source|embedding|vector|crawler|scrape/.test(
        lower,
      );
    return {
      protocol,
      path: pathWithSearch,
      effectivePort,
      isExternal,
      isForbidden,
    };
  } catch {
    return {
      protocol: "unknown",
      path: value,
      effectivePort: null,
      isExternal: false,
      isForbidden: false,
    };
  }
}

function getEffectivePort(url) {
  if (url.port) return Number(url.port);
  const protocol = url.protocol.replace(":", "");
  if (protocol === "http" || protocol === "ws") return 80;
  if (protocol === "https" || protocol === "wss") return 443;
  return null;
}

function runObservedUrlClassificationSelfCheck(port) {
  const cases = [
    {
      id: "localhost_explicit_selected_port_not_external",
      url: `http://localhost:${port}/api/research-candidate-review/manual-note-preview`,
      expected_external: false,
      expected_forbidden: false,
    },
    {
      id: "loopback_explicit_selected_port_not_external",
      url: `http://127.0.0.1:${port}/api/research-candidate-review/manual-note-preview`,
      expected_external: false,
      expected_forbidden: false,
    },
    {
      id: "localhost_default_http_port_external_when_selected_port_is_not_80",
      url: "http://localhost/api/research-candidate-review/manual-note-preview",
      expected_external: port !== 80,
      expected_forbidden: false,
    },
    {
      id: "localhost_ollama_port_external",
      url: "http://localhost:11434/v1/chat/completions",
      expected_external: true,
      expected_forbidden: false,
    },
    {
      id: "openai_external_and_forbidden",
      url: "https://api.openai.com/v1/chat/completions",
      expected_external: true,
      expected_forbidden: true,
    },
    {
      id: "file_url_not_external",
      url: "file:///tmp/augnes-manual-note-lane-validation-v0-1/report.json",
      expected_external: false,
      expected_forbidden: false,
    },
    {
      id: "about_url_not_external",
      url: "about:blank",
      expected_external: false,
      expected_forbidden: false,
    },
    {
      id: "data_url_not_external",
      url: "data:text/plain,ok",
      expected_external: false,
      expected_forbidden: false,
    },
  ];
  const results = cases.map((testCase) => {
    const parsed = parseObservedUrl(testCase.url, port);
    return {
      ...testCase,
      actual_external: parsed.isExternal,
      actual_forbidden: parsed.isForbidden,
      effective_port: parsed.effectivePort,
      passed:
        parsed.isExternal === testCase.expected_external &&
        parsed.isForbidden === testCase.expected_forbidden,
    };
  });
  return {
    passed: results.every((result) => result.passed),
    selected_port: port,
    cases: results,
  };
}

function classifyManualNoteRoute(value) {
  try {
    const url = new URL(value);
    const pathName = url.pathname;
    if (pathName === "/api/research-candidate-review/manual-note-preview") {
      return { kind: "create", path: pathName };
    }
    if (
      pathName ===
      "/api/research-candidate-review/manual-note-preview-drafts"
    ) {
      return { kind: "list", path: `${pathName}${url.search}` };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\/label$/.test(
        pathName,
      )
    ) {
      return { kind: "label", path: pathName };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\/activity$/.test(
        pathName,
      )
    ) {
      return { kind: "activity", path: pathName };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\/promotion-readiness$/.test(
        pathName,
      )
    ) {
      return { kind: "preflight", path: pathName };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\/promotion-dry-run-plan$/.test(
        pathName,
      )
    ) {
      return { kind: "dry_run_plan", path: pathName };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\/disabled-promotion-write-adapter-readiness$/.test(
        pathName,
      )
    ) {
      return { kind: "disabled_adapter_readiness", path: pathName };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\/discard$/.test(
        pathName,
      )
    ) {
      return { kind: "discard", path: pathName };
    }
    if (
      /\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+$/.test(
        pathName,
      )
    ) {
      return { kind: "open", path: pathName };
    }
    return null;
  } catch {
    return null;
  }
}

function countResearchCandidateApiRequests() {
  return requestLog.filter((request) =>
    request.path.startsWith("/api/research-candidate-review"),
  ).length;
}

function isActualPromotionWriteRoutePath(pathValue) {
  if (
    !/\/api\/research-candidate-review\/manual-note-preview-drafts\/[^/]+\//.test(
      pathValue,
    )
  ) {
    return false;
  }
  if (
    /\/promotion-readiness(?:$|[/?])|\/promotion-dry-run-plan(?:$|[/?])|\/disabled-promotion-write-adapter-readiness(?:$|[/?])/.test(
      pathValue,
    )
  ) {
    return false;
  }
  return /\/(?:promotion|promote|actual-promotion|promotion-write-adapter|write-adapter)(?:$|[/?-])/.test(
    pathValue,
  );
}

function assertRuntimeRouteUsage() {
  const allowedKindsByPhase = {
    page_load: new Set(["list"]),
    runtime_create_draft_a: new Set(["create", "list"]),
    refresh_draft_list: new Set(["list"]),
    draft_list_controls: new Set(["list"]),
    open_draft_a: new Set(["open"]),
    label_save_a: new Set(["label", "list"]),
    label_clear_a: new Set(["label", "list"]),
    load_activity_a: new Set(["activity"]),
    run_preflight_a: new Set(["preflight"]),
    run_dry_run_plan_a: new Set(["dry_run_plan"]),
    candidate_review_design_a: new Set([]),
    disabled_adapter_readiness_a: new Set(["disabled_adapter_readiness"]),
    disabled_adapter_temp_harness_a: new Set([]),
    packet_stale_after_label_change_a: new Set([
      "label",
      "list",
      "activity",
      "preflight",
    ]),
    discard_draft_a: new Set(["discard", "list", "activity", "preflight"]),
    runtime_create_draft_b: new Set(["create", "list"]),
    open_draft_b: new Set(["open"]),
    load_activity_b: new Set(["activity"]),
    run_preflight_b: new Set(["preflight"]),
    run_dry_run_plan_b: new Set(["dry_run_plan"]),
    candidate_review_design_no_leak_b: new Set([]),
    clear_local_note: new Set(["create", "list"]),
  };
  const manualRequests = requestLog.filter((request) => request.manual_note_route);
  const unexpected = manualRequests.filter((request) => {
    const allowedKinds = allowedKindsByPhase[request.phase];
    return !allowedKinds?.has(request.manual_note_route.kind);
  });
  const nonSameOrigin = manualRequests.filter((request) => request.is_external);
  const byPhase = {};
  for (const request of manualRequests) {
    byPhase[request.phase] ??= {};
    byPhase[request.phase][request.manual_note_route.kind] =
      (byPhase[request.phase][request.manual_note_route.kind] ?? 0) + 1;
  }
  report.route_action_observations.manual_note_requests_by_phase = byPhase;
  return {
    passed: unexpected.length === 0 && nonSameOrigin.length === 0,
    manual_note_request_count: manualRequests.length,
    allowed_startup_readiness_list_request: byPhase.page_load?.list ?? 0,
    requests_by_phase: byPhase,
    unexpected_requests: unexpected,
    non_same_origin_requests: nonSameOrigin,
  };
}

function inspectStorageBoundary(dbFilePath) {
  const base = {
    passed: false,
    db_path: dbFilePath,
    db_exists: existsSync(dbFilePath),
    draft_count: 0,
    discard_count: 0,
    activity_count: 0,
    raw_manual_note_text_stored_count: null,
    forbidden_manual_note_columns: [],
    canonical_perspective_id_non_null_count: null,
    proof_id_non_null_count: null,
    evidence_id_non_null_count: null,
    work_item_id_non_null_count: null,
    packet_history_tables: [],
    checklist_persistence_tables: [],
    adapter_contract_review_persistence_tables: [],
    temp_harness_persistence_tables: [],
    tables: [],
  };

  if (!base.db_exists) {
    base.reason = "Temp DB file was not created.";
    return base;
  }

  let Database;
  try {
    Database = require("better-sqlite3");
  } catch (error) {
    base.reason = "better-sqlite3 could not be loaded for DB inspection.";
    base.error = serializeError(error);
    return base;
  }

  const db = new Database(dbFilePath, { readonly: true, fileMustExist: true });
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    base.tables = tables;
    base.packet_history_tables = tables.filter((name) =>
      /manual_note.*packet.*history|packet.*history|readiness_packet_history/i.test(
        name,
      ),
    );
    base.checklist_persistence_tables = tables.filter((name) =>
      /manual_note.*checklist|packet_review_checklist|local_packet_review/i.test(
        name,
      ),
    );
    base.adapter_contract_review_persistence_tables = tables.filter((name) =>
      /adapter.*contract.*review|contract.*review.*adapter|disabled_adapter_contract/i.test(
        name,
      ),
    );
    base.temp_harness_persistence_tables = tables.filter((name) =>
      /temp.*harness|harness.*execution|adapter.*harness/i.test(name),
    );

    if (tables.includes("research_candidate_manual_note_preview_drafts")) {
      base.draft_count = db
        .prepare("SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_drafts")
        .get().count;
      base.raw_manual_note_text_stored_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_drafts WHERE manual_note_text_stored != 0",
        )
        .get().count;
      base.canonical_perspective_id_non_null_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_drafts WHERE canonical_perspective_id IS NOT NULL",
        )
        .get().count;
      base.proof_id_non_null_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_drafts WHERE proof_id IS NOT NULL",
        )
        .get().count;
      base.evidence_id_non_null_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_drafts WHERE evidence_id IS NOT NULL",
        )
        .get().count;
      base.work_item_id_non_null_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_drafts WHERE work_item_id IS NOT NULL",
        )
        .get().count;
      base.forbidden_manual_note_columns = db
        .prepare(
          "PRAGMA table_info(research_candidate_manual_note_preview_drafts)",
        )
        .all()
        .map((row) => row.name)
        .filter((name) =>
          /(^|_)manual_note_text$|raw_manual_note_text|manual_note_body/i.test(
            name,
          ),
        );
    }

    if (
      tables.includes(
        "research_candidate_manual_note_preview_draft_discards",
      )
    ) {
      base.discard_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_draft_discards",
        )
        .get().count;
    }

    if (
      tables.includes(
        "research_candidate_manual_note_preview_draft_activities",
      )
    ) {
      base.activity_count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM research_candidate_manual_note_preview_draft_activities",
        )
        .get().count;
    }

    base.passed =
      base.draft_count >= 2 &&
      base.raw_manual_note_text_stored_count === 0 &&
      base.forbidden_manual_note_columns.length === 0 &&
      base.canonical_perspective_id_non_null_count === 0 &&
      base.proof_id_non_null_count === 0 &&
      base.evidence_id_non_null_count === 0 &&
      base.work_item_id_non_null_count === 0 &&
      base.packet_history_tables.length === 0 &&
      base.checklist_persistence_tables.length === 0 &&
      base.adapter_contract_review_persistence_tables.length === 0 &&
      base.temp_harness_persistence_tables.length === 0;
    return base;
  } finally {
    db.close();
  }
}

function finalizeSummaries() {
  const externalRequests = requestLog.filter((request) => request.is_external);
  const forbiddenRequests = requestLog.filter((request) => request.is_forbidden);
  const manualNoteRouteCounts = {};
  const statusCounts = {};
  const consoleErrors = consoleLog.filter((entry) => entry.type === "error");
  const ignoredConsoleMessages = consoleLog.filter(
    isKnownNonManualNoteDevConsoleMessage,
  );
  const actionableConsoleErrors = consoleErrors.filter(
    (entry) => !isKnownNonManualNoteDevConsoleMessage(entry),
  );

  for (const request of requestLog) {
    if (request.manual_note_route) {
      manualNoteRouteCounts[request.manual_note_route.kind] =
        (manualNoteRouteCounts[request.manual_note_route.kind] ?? 0) + 1;
    }
  }
  for (const response of responseLog) {
    statusCounts[response.status] = (statusCounts[response.status] ?? 0) + 1;
  }

  report.request_response_summary = {
    observed_surface: "browser_page_playwright_events",
    count_scope:
      "Browser-observed page requests/responses/failures only; server-side outbound network calls are not instrumented by this validator.",
    request_count: requestLog.length,
    response_count: responseLog.length,
    failed_request_count: failedRequests.length,
    external_request_count: externalRequests.length,
    forbidden_request_count: forbiddenRequests.length,
    manual_note_route_counts: manualNoteRouteCounts,
    status_counts: statusCounts,
    external_requests: externalRequests,
    forbidden_requests: forbiddenRequests,
    failed_requests: failedRequests,
  };
  report.external_request_count = externalRequests.length;
  report.forbidden_request_count = forbiddenRequests.length;
  report.console_pageerror_failure_summary = {
    console_count: consoleLog.length,
    console_error_count: consoleErrors.length,
    actionable_console_error_count: actionableConsoleErrors.length,
    console_warning_count: consoleLog.filter((entry) => entry.type === "warning").length,
    ignored_dev_startup_console_count: ignoredConsoleMessages.length,
    pageerror_count: pageErrors.length,
    failed_request_count: failedRequests.length,
    console_messages: consoleLog,
    ignored_dev_startup_console_messages: ignoredConsoleMessages,
    actionable_console_errors: actionableConsoleErrors,
    pageerrors: pageErrors,
    failed_requests: failedRequests,
  };
}

function isKnownNonManualNoteDevConsoleMessage(entry) {
  const url = entry.location?.url ?? "";
  if (
    entry.type === "info" &&
    entry.text.includes("Download the React DevTools")
  ) {
    return true;
  }
  if (
    entry.type === "log" &&
    (entry.text.includes("[HMR]") || entry.text.includes("[Fast Refresh]"))
  ) {
    return true;
  }
  if (
    entry.type !== "error" ||
    !entry.text.includes("Failed to load resource")
  ) {
    return false;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/favicon.ico") return true;
    return [
      "/api/perspective/snapshot",
      "/api/events",
      "/api/mailbox/summary",
    ].includes(parsed.pathname);
  } catch {
    return false;
  }
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    report.browser_backed_method.selected = null;
    report.browser_backed_method.unavailable_reason =
      "Playwright import failed; no repo-supported alternate browser-backed driver is implemented inside this self-contained validator.";
    throw new Error(
      [
        "No usable browser-backed validation method is available in this execution environment.",
        "The self-contained repo validator attempted Playwright first and does not add browser automation dependencies.",
        "Run this validator where `import('playwright')` resolves with a system Chrome/Chromium executable, or use an equivalent external browser/CDP validation path and record that result separately.",
        `Original error: ${error.code ?? error.message}`,
      ].join(" "),
    );
  }
}

function findBrowserExecutablePath() {
  for (const candidate of SYSTEM_BROWSER_EXECUTABLE_CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }

  report.browser_backed_method.unavailable_reason =
    "No system Chrome/Chromium executable was found for the self-contained browser-backed validator.";
  throw new Error(
    [
      "No system Chrome/Chromium executable was found.",
      "Set AUGNES_BROWSER_EXECUTABLE_PATH to a Chrome/Chromium executable or install Chrome/Chromium.",
      `Probed: ${SYSTEM_BROWSER_EXECUTABLE_CANDIDATES.join(", ")}`,
    ].join(" "),
  );
}

async function chooseAvailablePort() {
  const preferred = parsePort(
    process.env.AUGNES_BROWSER_VALIDATION_PORT,
    DEFAULT_PORT,
  );
  for (let port = preferred; port < preferred + 40; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(
    `No available local port found from ${preferred} through ${preferred + 39}.`,
  );
}

function parsePort(value, fallback) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `AUGNES_BROWSER_VALIDATION_PORT must be an integer TCP port, got ${value}.`,
    );
  }
  return parsed;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

function startDevServer({ port, dbPath }) {
  const env = { ...process.env };
  delete env[PROVIDER_KEY_ENV_NAME];
  env.AUGNES_DB_PATH = dbPath;
  env.NEXT_TELEMETRY_DISABLED = "1";

  const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  report.dev_server.started = true;
  report.dev_server.process_id = child.pid ?? null;

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => appendTail(report.dev_server.stdout_tail, chunk));
  child.stderr.on("data", (chunk) => appendTail(report.dev_server.stderr_tail, chunk));

  return child;
}

async function waitForServerReady(url) {
  const startedAt = Date.now();
  const timeoutMs = 60_000;
  while (Date.now() - startedAt < timeoutMs) {
    if (serverProcess.exitCode !== null) {
      throw new Error(
        `Dev server exited before becoming ready with code ${serverProcess.exitCode}.`,
      );
    }
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.status < 500) return;
    } catch {
      // Keep polling until timeout.
    }
    await sleep(500);
  }
  throw new Error(`Dev server did not become ready within ${timeoutMs}ms.`);
}

async function waitForRequestQuiet() {
  const startedAt = Date.now();
  let lastCount = requestLog.length + responseLog.length + failedRequests.length;
  let lastChangeAt = Date.now();
  while (Date.now() - startedAt < 8_000) {
    const count = requestLog.length + responseLog.length + failedRequests.length;
    if (count !== lastCount) {
      lastCount = count;
      lastChangeAt = Date.now();
    }
    if (Date.now() - lastChangeAt >= REQUEST_QUIET_MS) return;
    await sleep(100);
  }
}

function appendTail(target, chunk) {
  const lines = String(chunk).split(/\r?\n/).filter(Boolean);
  target.push(...lines);
  while (target.length > 80) target.shift();
}

async function cleanup() {
  if (page) {
    await page.close().catch(() => undefined);
  }
  if (context) {
    await context.close().catch(() => undefined);
  }
  if (browser) {
    await browser.close().catch(() => undefined);
    report.cleanup.browser_closed = true;
  }
  if (serverProcess) {
    await terminateChild(serverProcess);
    report.cleanup.dev_server_terminated = true;
    report.dev_server.terminated = true;
  }
}

async function terminateChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([
    once(child, "exit").then(() => true),
    sleep(5_000).then(() => false),
  ]);
  if (!exited && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit").catch(() => undefined);
  }
}

function recordCleanupFailure(error) {
  const cleanupError = serializeError(error);
  report.cleanup.error = cleanupError;
  report.final_status = "fail";
  const validationError = report.failure;
  report.failure = {
    name: validationError
      ? "ValidationAndCleanupError"
      : "CleanupError",
    message: validationError
      ? `${validationError.message} Cleanup also failed: ${cleanupError.message}`
      : `Cleanup failed: ${cleanupError.message}`,
    stack: validationError?.stack ?? cleanupError.stack,
    validation_error: validationError,
    cleanup_error: cleanupError,
  };
  process.exitCode = 1;
}

function redactUrl(value) {
  return value.replace(/([?&](?:token|key|secret|api_key)=)[^&]+/gi, "$1[redacted]");
}

function serializeError(error) {
  return {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
    stack: error?.stack?.slice(0, 2000) ?? null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  await main();
} catch (error) {
  report.failure = serializeError(error);
  finalizeSummaries();
  report.final_status = "fail";
  process.exitCode = 1;
  console.error(report.failure.message);
} finally {
  await cleanup().catch((error) => {
    recordCleanupFailure(error);
  });
  try {
    finalizeSummaries();
    await mkdir(ARTIFACT_DIR, { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Report written to ${REPORT_PATH}`);
  } catch (error) {
    report.final_status = "fail";
    report.failure = {
      name: "ReportWriteError",
      message: `Failed to write report: ${error.message}`,
      stack: error.stack?.slice(0, 2000) ?? null,
      validation_error: report.failure,
    };
    console.error(`Failed to write report: ${error.message}`);
    process.exitCode = 1;
  }
  if (report.final_status === "pass") {
    console.log(`PASS ${VALIDATION_NAME} ${VALIDATION_VERSION}`);
  } else {
    console.error(`FAIL ${VALIDATION_NAME} ${VALIDATION_VERSION}`);
  }
}
