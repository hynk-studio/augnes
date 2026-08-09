#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  openVNextLocalOperatorDatabaseV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session.ts";
import {
  createRepositoryExecutionDecisionRequestV01,
} from "../lib/vnext/repository-execution/repository-execution.ts";
import { createBrowserSupervisorPublicDiagnosticCapture } from "./browser-supervisor-public-diagnostic.mjs";
import { createBrowserE2ETimingRecorder } from "./browser-e2e-timing.mjs";
import {
  PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
  admitExpiredProjectContextPresentationV1,
  admitProjectExperienceRenderedStateV1,
  buildProjectExperienceBrowserFixtureV1,
} from "./project-experience-browser-fixture-v1.ts";
import {
  assertProjectExperienceFinalSuccessV1,
  createDetailedFieldCompletionOwnerV1,
  loadProjectExperienceResultContractV1,
} from "./project-experience-result-contract-v1.mjs";
import {
  registerOwnedChild,
  settleOwnedProcessAfterExit,
  terminateOwnedProcessTree,
} from "./test-harness-process-lifecycle.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const VALIDATION_VERSION = "project_experience_browser_validation.v1";
const VALIDATION_SCOPE = "project-experience";
const REAL_PROVIDER_ACCEPTANCE =
  process.env.AUGNES_GUIDEBRIEF_REAL_PROVIDER_ACCEPTANCE === "1";
assert(
  ["project-experience"].includes(VALIDATION_SCOPE),
  "unsupported project experience Browser scope",
);
const DEFAULT_TIMEOUT_MS = 45_000;
const REQUEST_QUIET_MS = 500;
const REFERENCE_BROWSER_BOUND_MS = 480_000;
const ACCEPTANCE_BOUND_MS = 360_000;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const originalUmask = process.umask(0o077);
const startedAt = Date.now();
const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-project-experience-browser-v1-"),
);
const canonicalOwnedTempRoot =
  process.env.AUGNES_CANONICAL_TEMP_ROOT?.trim() ?? null;
const processTempRoot = canonicalOwnedTempRoot
  ? canonicalOwnedTempRoot
  : mkdtempSync(path.join(tmpdir(), "ag-project-experience-"));
const fixtureRoot = path.join(tempRoot, "fixture-v1");
const chromeProfileDir = path.join(tempRoot, "chrome-profile");
const downloadDirectory = path.join(tempRoot, "downloads");
const runtimeStateDirectory = path.join(tempRoot, "runtime-state");
const disposableHome = path.join(tempRoot, "home");
const onboardingFolder = path.join(
  tempRoot,
  "Project Experience Alpha with a deliberately long local folder name",
  "이어지는 작업과 공백을 보존하는 폴더",
  "Exact local repository",
);
const onboardingFolderB = path.join(tempRoot, "Project Experience Beta");
const onboardingFolderBRecovered = path.join(
  tempRoot,
  "Project Experience Beta recovery with a deliberately long moved path",
  "옮겨진 기존 프로젝트 폴더",
);
const nonExactDeclaredPath = process.platform === "win32"
  ? path.join(tempRoot, "not-an-exact-local-folder.txt")
  : "/dev";
const nonExactDeclaredErrorCode = process.platform === "win32"
  ? "selection_not_directory"
  : "physical_identity_ambiguous";
const nonExactDeclaredPublicCopy = process.platform === "win32"
  ? "That path points to a file, not a folder."
  : "Augnes cannot determine one exact local folder for that path.";
const folderPickerSequencePath = path.join(
  tempRoot,
  "project-experience-folder-picker-sequence.json",
);
const providerEgressObservationPath = path.join(
  tempRoot,
  "provider-egress-observations.jsonl",
);
const providerEgressObserverImportPath = path.join(
  tempRoot,
  "provider-egress-observer-import.mjs",
);
const appRepo = path.resolve(process.cwd());
const runtimeSupervisor = path.join(
  appRepo,
  "scripts",
  "augnes-runtime-supervisor.mjs",
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
let bridgePort = null;
let debugPort = null;
let appOrigin = null;
let serverProcess = null;
let serverProcessRecord = null;
let serverClosePromise = null;
let serverPublicDiagnosticCapture = null;
let chromeProcess = null;
let chromeProcessRecord = null;
let cdp = null;
let currentPhase = "setup";
let serverLog = "";
let lastObserverActivityAt = Date.now();
let navigationCount = 0;
let requestQuietCount = 0;
let waitCount = 0;
let runtimeStartCount = 0;
let runtimeShutdownCount = 0;
let runtimeProviderCredentialEnabled = REAL_PROVIDER_ACCEPTANCE;
const requests = [];
const responses = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];
const pausedGuideBriefInterpretationRequests = [];
const semanticMarkers = [];
const viewportResults = [];
const viewportWarnings = [];
const productShellRouteClassifications = [];
const productShellResponsiveResults = [];
const ownedBrowserProcesses = new Set();
const timing = createBrowserE2ETimingRecorder({ scope: VALIDATION_SCOPE });
const detailedFieldContract = loadProjectExperienceResultContractV1();
const detailedFieldCompletionOwner =
  createDetailedFieldCompletionOwnerV1(detailedFieldContract);

const result = {
  ok: false,
  validation_version: VALIDATION_VERSION,
  validation_mode: REAL_PROVIDER_ACCEPTANCE
    ? "real_provider_acceptance"
    : "canonical_no_provider",
  owner: "project_experience",
  fixture_version: null,
  fixture_fingerprint: null,
  fixture_source_database_sha256: null,
  fixture_writable_seed_sha256: null,
  detailed_field_count: detailedFieldContract.field_ids.length,
  detailed_marker_count: detailedFieldContract.marker_ids.length,
  completed_detailed_field_ids: [],
  completed_detailed_field_fingerprint: null,
  semantic_markers: [],
  folder_picker_cancelled_usable: false,
  picker_pending_path_switch: false,
  declared_path_invalid_retained: false,
  declared_path_non_exact_refused_retained: false,
  declared_path_shared_review: false,
  declared_path_keyboard_focus: false,
  declared_path_responsive_review: false,
  declared_path_existing_project_reopen: false,
  declared_path_public_copy: false,
  folder_onboarding_destination: null,
  project_context_repeat_activation: false,
  project_context_keyboard_activation: false,
  project_name_onboarding_prefill_and_edit: false,
  project_name_invalid_blocked: false,
  project_name_stale_conflict_visible: false,
  stale_abandonment_new_session_preserved: false,
  project_name_long_korean_propagated: false,
  project_context_opens_settings: false,
  folder_onboarding_restart_reopen: false,
  folder_onboarding_stale_active_conflict: false,
  guide_brief_blank_state_v0_2: false,
  guide_brief_model_interpretation_browser: false,
  guide_brief_real_provider_acceptance: null,
  project_home_coordination_visible: false,
  project_recovery_context_passive: false,
  project_recovery_entry_parity: false,
  project_recovery_pending_path_switch: false,
  project_recovery_cancel_and_retry: false,
  project_recovery_declared_path_retained: false,
  project_recovery_non_exact_refused: false,
  project_recovery_fresh_session_established: false,
  project_recovery_no_plaintext_bootstrap_exposed: false,
  project_recovery_request_scoped_authority_only: false,
  project_recovery_fresh_rebind_completed: false,
  project_recovery_same_candidate_prepare_reordering_safe: false,
  project_recovery_terminal_cookie_cleared: false,
  project_recovery_retry_cookie_budget_bounded: false,
  project_recovery_final_after_retry_stress: false,
  project_recovery_general_decision_cookie_preserved: false,
  project_recovery_native_and_declared_review: false,
  project_recovery_responsive_review: false,
  project_recovery_no_mutation_before_confirmation: false,
  project_recovery_same_project_rebind: false,
  project_recovery_public_copy: false,
  minimum_project_home_empty_state: false,
  minimum_project_home_expired_context_withheld: false,
  minimum_project_home_refresh_read_only: false,
  minimum_project_home_non_active_deep_link_read_only: false,
  minimum_project_home_explicit_activation: false,
  minimum_project_home_project_isolation: false,
  minimum_project_home_unknown_project_status: null,
  minimum_project_home_unknown_project_safe_not_found: false,
  guide_brief_ai_workplane_v0_2: false,
  guide_brief_cross_surface_consistency: false,
  workbench_compatibility_redirect: false,
  ai_workplane_project_context_opens_settings: false,
  retired_route_statuses: {},
  retired_routes_non_mutating: false,
  first_work_browser_viewports: false,
  repository_decision_browser_confirmation: false,
  delegated_work_narrow_viewport_no_overflow: false,
  shared_inspector_narrow_viewport_no_overflow: false,
  workbench_result_narrow_viewport_no_overflow: false,
  proposal_review_narrow_viewport_no_overflow: false,
  minimum_project_home_narrow_viewport_no_overflow: false,
  project_context_emphasized_owner: false,
  product_shell_route_classifications: [],
  product_shell_responsive_results: [],
  management_safety_keyboard_navigation: false,
  viewport_results: [],
  viewport_warnings: [],
  route_collection: [],
  viewport_collection: [],
  unexpected_external_request_count: 0,
  unexpected_console_failure_count: 0,
  unexpected_page_failure_count: 0,
  unexpected_request_failure_count: 0,
  known_harness_console_warning_count: 0,
  credential_private_material_boundary: false,
  default_database_isolated: false,
  provider_or_external_network_call: false,
  semantic_proposal_created: false,
  review_decision_created: false,
  transition_created: false,
  work_closure_created: false,
  native_host_execution_started: false,
  resource_ownership: [
    "writable_database",
    "runtime_state_directory",
    "runtime_supervisor_process_tree",
    "application_listener_port",
    "bridge_debug_ports",
    "browser_process",
    "cdp_session",
    "browser_profile",
    "temporary_root",
    "project_roots",
    "download_directory",
    "shard_local_operator_session",
    "folder_picker_file_signal",
    "request_response_console_ledgers",
    "owned_streams",
  ],
  cleanup_complete: false,
  owned_streams_settled: false,
  owned_process_residue_count: null,
  listener_residue_count: null,
  temporary_root_removed: false,
  temporary_process_root_removed: false,
  temporary_profile_removed: false,
  temporary_database_removed: false,
  temporary_fixture_removed: false,
  temporary_picker_sequence_removed: false,
  runtime_shutdown_complete: false,
  chrome_cdp_shutdown_complete: false,
  total_duration_ms: null,
  reference_headroom_ms: null,
  acceptance_bound_ms: ACCEPTANCE_BOUND_MS,
  request_response_console_ledger_summary: null,
  supervisor_exit_diagnostic: null,
  e2e_timing_summary: null,
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
        () => reject(new Error("cdp_open_timeout")),
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
          reject(new Error("cdp_open_failed"));
        },
        { once: true },
      );
    });
  }

  async close() {
    if (!this.ws) return;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("cdp_closed"));
    }
    this.pending.clear();
    this.ws.close();
    this.ws = null;
  }

  on(handler) {
    this.handlers.add(handler);
  }

  async send(method, params = {}) {
    assert(this.ws, "cdp_not_open");
    const id = this.nextId;
    this.nextId += 1;
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`cdp_command_timeout:${method}`));
      }, DEFAULT_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

let functionalExecutionSucceeded = false;
try {
  await main();
  functionalExecutionSucceeded = true;
} catch (error) {
  result.failure = safeError(error);
  process.exitCode = 1;
} finally {
  process.stdout.write(
    `[browser-e2e] cleanup_start scope=${VALIDATION_SCOPE} phase=${currentPhase} owned_processes=${ownedBrowserProcesses.size}\n`,
  );
  const finishCleanupTiming = timing.start("cleanup", "global cleanup");
  try {
    await cleanup();
    result.cleanup_complete = true;
  } catch (error) {
    if (!result.failure) {
      result.failure = safeError(error);
    }
    process.exitCode = 1;
  } finally {
    finishCleanupTiming();
  }
  result.owned_streams_settled = ownedBrowserProcesses.size === 0;
  result.owned_process_residue_count = ownedBrowserProcesses.size;
  try {
    result.listener_residue_count = await listenerResidueCount();
  } catch (error) {
    if (!result.failure) {
      result.failure = safeError(error);
    }
    process.exitCode = 1;
  }
  result.temporary_root_removed = !existsSync(tempRoot);
  result.temporary_process_root_removed = !existsSync(processTempRoot);
  result.temporary_profile_removed = !existsSync(chromeProfileDir);
  result.temporary_database_removed = !existsSync(
    path.join(fixtureRoot, "writable", "project-experience.db"),
  );
  result.temporary_fixture_removed = !existsSync(fixtureRoot);
  result.temporary_picker_sequence_removed = !existsSync(
    folderPickerSequencePath,
  );
  result.runtime_shutdown_complete = serverProcess === null;
  result.chrome_cdp_shutdown_complete =
    chromeProcess === null && cdp === null;
  result.semantic_markers = semanticMarkers;
  result.completed_detailed_field_ids =
    detailedFieldCompletionOwner.completedIds();
  result.completed_detailed_field_fingerprint =
    detailedFieldCompletionOwner.completedFingerprint();
  result.product_shell_route_classifications =
    productShellRouteClassifications;
  result.product_shell_responsive_results = productShellResponsiveResults;
  result.viewport_results = viewportResults;
  result.viewport_warnings = viewportWarnings;
  result.route_collection = [
    ...new Set(requests.map((entry) => entry.path).filter(Boolean)),
  ].sort();
  result.viewport_collection = viewportResults.map((entry) => ({
    surface: entry.surface,
    width: entry.width,
    height: entry.height ?? null,
  }));
  result.request_response_console_ledger_summary = {
    request_count: requests.length,
    response_count: responses.length,
    raw_console_error_count: consoleErrors.length,
    page_error_count: pageErrors.length,
    failed_request_count: failedRequests.length,
  };
  result.e2e_timing_summary = timing.summary();
  result.total_duration_ms = Date.now() - startedAt;
  result.reference_headroom_ms = Math.max(
    0,
    REFERENCE_BROWSER_BOUND_MS - result.total_duration_ms,
  );
  try {
    const finalizationResult = JSON.parse(JSON.stringify(result));
    assertProjectExperienceFinalSuccessV1({
      result: finalizationResult,
      contract: detailedFieldContract,
      completion_owner: detailedFieldCompletionOwner,
      functional_execution_succeeded: functionalExecutionSucceeded,
    });
    result.ok = true;
  } catch (error) {
    result.ok = false;
    if (!result.failure) {
      result.failure = safeError(error);
    }
    process.exitCode = 1;
  }
  process.umask(originalUmask);
  process.stdout.write(
    `[browser-e2e] cleanup_result scope=${VALIDATION_SCOPE} owned_processes=${ownedBrowserProcesses.size} listener_residue=${result.listener_residue_count}\n`,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
  timing.milestone("project experience harness started");
  if (REAL_PROVIDER_ACCEPTANCE) {
    assert.equal(
      typeof process.env.OPENAI_API_KEY === "string" &&
        process.env.OPENAI_API_KEY.trim().length > 0,
      true,
      "guidebrief_real_provider_credential_missing",
    );
  }
  assert.equal(path.isAbsolute(appRepo), true);
  assert.equal(existsSync(path.join(appRepo, "package.json")), true);
  for (const directory of [
    fixtureRoot,
    downloadDirectory,
    runtimeStateDirectory,
    disposableHome,
    onboardingFolder,
    onboardingFolderB,
    processTempRoot,
  ]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  if (REAL_PROVIDER_ACCEPTANCE) {
    writeFileSync(
      providerEgressObserverImportPath,
      [
        `import { appendFileSync } from "node:fs";`,
        `process.env.AUGNES_PROVIDER_EGRESS_OBSERVATION_PATH = ${JSON.stringify(providerEgressObservationPath)};`,
        `if (process.env.AUGNES_RUNTIME_CHILD_ROLE === "ui") appendFileSync(process.env.AUGNES_PROVIDER_EGRESS_OBSERVATION_PATH, JSON.stringify({ observation_version: "provider_egress_observation.v0.1", purpose: "guidebrief_interpretation", status: process.env.OPENAI_API_KEY ? "runtime_ready" : "runtime_unavailable", response_status: null }) + "\\n", { encoding: "utf8", mode: 0o600 });`,
        `await import(${JSON.stringify(
          pathToFileURL(
            path.join(appRepo, "scripts", "provider-egress-observer.mjs"),
          ).href,
        )});`,
        "",
      ].join("\n"),
      { encoding: "utf8", flag: "wx", mode: 0o600 },
    );
  }
  mkdirSync(path.join(onboardingFolder, ".git"), {
    recursive: true,
    mode: 0o700,
  });
  writeFileSync(
    path.join(onboardingFolder, ".git", "config"),
    "[core]\n  bare = false\n",
    { encoding: "utf8", mode: 0o600 },
  );
  writeFileSync(
    path.join(onboardingFolderB, "existing-project-content.txt"),
    "LPX2 recovery must not change this project file.\n",
    { encoding: "utf8", mode: 0o600 },
  );
  if (process.platform === "win32") {
    writeFileSync(
      nonExactDeclaredPath,
      "This platform fixture is deliberately not a local folder.\n",
      { encoding: "utf8", mode: 0o600 },
    );
  }
  writeFolderPickerSequence([
    { id: "cancelled-selection", outcome: "cancelled" },
    {
      id: "pending-selection",
      outcome: "pending_until_abort",
    },
    {
      id: "project-beta",
      outcome: "selected",
      absolute_path: onboardingFolderB,
    },
  ]);

  const finishFixtureTiming = timing.start("fixture", "fixture construction");
  const fixture = await buildProjectExperienceBrowserFixtureV1({
    output_directory: fixtureRoot,
    reference_time: new Date().toISOString(),
  });
  finishFixtureTiming();
  const manifest = fixture.manifest;
  assert.equal(manifest.fixture_version, PROJECT_EXPERIENCE_FIXTURE_VERSION_V1);
  assert.equal(manifest.source_bound, true);
  assert.equal(manifest.presentation_only, true);
  assert.equal(manifest.execution_capable, false);
  assert.equal(manifest.external_network_calls, 0);
  assert.equal(manifest.provider_calls, 0);
  assert.equal(manifest.credential_material_included, false);
  assert.equal(manifest.semantic_authority_granted, false);
  assert.equal(manifest.execution_authority_granted, false);
  result.fixture_version = manifest.fixture_version;
  result.fixture_fingerprint = manifest.fixture_fingerprint;
  result.fixture_source_database_sha256 = manifest.source_database_sha256;
  result.fixture_writable_seed_sha256 = manifest.writable_seed_sha256;
  result.default_database_isolated =
    path.resolve(fixture.writable_database_path) !==
      path.resolve(process.env.AUGNES_DB_PATH ?? "") &&
    path.resolve(fixture.writable_database_path) !==
      path.resolve(appRepo, "data", "augnes.db");
  assert.equal(result.default_database_isolated, true);
  let semanticAuthorityBaseline = semanticAuthorityCounts(
    fixture.writable_database_path,
  );

  appPort = await chooseAvailablePort();
  do bridgePort = await chooseAvailablePort(); while (bridgePort === appPort);
  do debugPort = await chooseAvailablePort(); while (
    debugPort === appPort || debugPort === bridgePort
  );
  appOrigin = `http://127.0.0.1:${appPort}`;
  const chromeExecutable = chromeCandidates.find((candidate) =>
    existsSync(candidate),
  );
  assert(chromeExecutable, "chrome_executable_missing");
  startRuntime(fixture.writable_database_path, manifest, manifest.project_id);
  startChrome(chromeExecutable);
  await Promise.all([
    waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS),
    openCdpPage(),
  ]);
  timing.milestone("project experience initial route ready");
  await assertLoopbackListener(appPort);

  let projectAlphaId;
  let projectAlphaDestination;
  let projectBetaId;
  let projectBetaDestination;
  let blankStateGuideProjection;

  await runPhase("project_onboarding_and_naming", async () => {
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-focus="no_projects"]') !== null && document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "project onboarding surface",
    );
    const noProjectShape = await evaluateJson(`(() => {
      const home = document.querySelector('[data-blank-state="v0.1"]');
      const text = home?.innerText ?? '';
      return {
        presentation: home?.getAttribute('data-blank-state-presentation'),
        title: home?.querySelector('h1')?.textContent?.trim(),
        primary_actions: home?.querySelectorAll('[data-blank-state-primary-action]').length,
        navigation_links: document.querySelectorAll('nav[aria-label="Primary navigation"] > a').length,
        private_material_absent: !/(sha256:|episode-delta-proposal:|task-context-packet:|bootstrap token)/i.test(text)
      };
    })()`);
    assert.deepEqual(noProjectShape, {
      presentation: "local_project_onboarding",
      title: "Continuities",
      primary_actions: 1,
      navigation_links: 2,
      private_material_absent: true,
    });
    const cancelledPickerResponseStart = responses.length;
    await clickSelector('[data-blank-state-primary-action="choose_folder"]');
    await waitForCondition(
      `document.body.textContent.includes('Folder selection was cancelled. Nothing changed.') && document.querySelector('[data-blank-state-primary-action="choose_folder"]:not(:disabled)') !== null`,
      "cancelled folder picker remains usable",
    );
    const cancelledPickerResponse = responses
      .slice(cancelledPickerResponseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/projects" &&
          entry.type === "Fetch" &&
          entry.method === "POST",
      );
    assert.equal(cancelledPickerResponse?.status, 200);
    const cancelledPickerBody = await cdp.send("Network.getResponseBody", {
      requestId: cancelledPickerResponse.request_id,
    });
    assert.equal(JSON.parse(cancelledPickerBody.body).picker.status, "cancelled");
    result.folder_picker_cancelled_usable = true;
    completeDetailedField("folder_picker_cancelled_usable");

    await clickSelector('[data-blank-state-primary-action="choose_folder"]');
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="choose_folder"]')?.textContent?.includes('Waiting for folder picker') === true && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Enter the folder path instead')`,
      "pending picker exposes path fallback",
    );
    await waitForFolderPickerSequenceIndex(2);
    await clickButtonByText("Enter the folder path instead");
    await waitForCondition(
      `document.querySelector('input[name="local-project-declared-path"]') === document.activeElement`,
      "path entry focus after pending picker abandonment",
    );
    result.picker_pending_path_switch = true;
    completeDetailedField("picker_pending_path_switch");
    result.declared_path_keyboard_focus = true;
    completeDetailedField("declared_path_keyboard_focus");
    const invalidDeclaredPath = path.join(tempRoot, "Folder that does not exist");
    await setFormControlValue(
      'input[name="local-project-declared-path"]',
      invalidDeclaredPath,
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="local-project-declared-path"]')?.value === ${JSON.stringify(invalidDeclaredPath)} && document.body.textContent.includes('That folder could not be found. Check the path and try again.')`,
      "invalid declared path remains editable",
    );
    result.declared_path_invalid_retained = true;
    completeDetailedField("declared_path_invalid_retained");
    const nonExactRequestOffset = requests.length;
    await setFormControlValue(
      'input[name="local-project-declared-path"]',
      nonExactDeclaredPath,
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    const nonExactResponse = await waitForObservedResponse(
      "/api/vnext/projects",
      "POST",
      nonExactRequestOffset,
    );
    assert.equal(nonExactResponse.status, 422);
    const nonExactResponseBody = JSON.parse((await cdp.send(
      "Network.getResponseBody",
      { requestId: nonExactResponse.request_id },
    )).body);
    assert.equal(nonExactResponseBody.error_code, nonExactDeclaredErrorCode);
    assert.equal(
      /(fingerprint|node scope|physical id|cookie|nonce|credential)/iu.test(
        JSON.stringify(nonExactResponseBody),
      ),
      false,
    );
    await waitForCondition(
      `document.querySelector('input[name="local-project-declared-path"]')?.value === ${JSON.stringify(nonExactDeclaredPath)} && document.body.textContent.includes(${JSON.stringify(nonExactDeclaredPublicCopy)}) && document.querySelector('.project-inspection') === null && document.querySelector('[data-blank-state-primary-action="confirm_folder"]') === null`,
      "non-exact declared path remains editable without review",
    );
    const nonExactCookies = await cdp.send("Network.getAllCookies");
    assert.equal(
      nonExactCookies.cookies.some(
        (cookie) => cookie.name === "augnes_local_project_onboarding_v01",
      ),
      false,
      "non-exact preparation must not issue an onboarding session cookie",
    );
    result.declared_path_non_exact_refused_retained = true;
    completeDetailedField("declared_path_non_exact_refused_retained");
    await setFormControlValue(
      'input[name="local-project-declared-path"]',
      onboardingFolder,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const input = document.querySelector('input[name="local-project-declared-path"]');
        if (!(input instanceof HTMLInputElement)) return false;
        input.focus();
        return document.activeElement === input;
      })()`),
      true,
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="project-display-name"]')?.value === 'Exact local repository'`,
      "declared path shared review",
    );
    assert.equal(
      await evaluateBoolean(
        `(() => {
          const review = document.querySelector('.project-inspection');
          const text = review?.textContent ?? '';
          return text.includes('The Augnes project name does not rename the local folder.') &&
            text.includes(${JSON.stringify(onboardingFolder)}) &&
            text.includes('Git repository') &&
            text.includes('No remote configured') &&
            text.includes('Connecting this folder does not run Codex or change any files.') &&
            review?.querySelectorAll('[data-augnes-primary-action]').length === 1 &&
            !/(nonce|fingerprint|physical identity|database|CAS|token)/i.test(text);
        })()`,
      ),
      true,
    );
    result.declared_path_shared_review = true;
    completeDetailedField("declared_path_shared_review");
    result.declared_path_public_copy = true;
    completeDetailedField("declared_path_public_copy");
    await validateDeclaredPathReviewViewports();
    result.declared_path_responsive_review = true;
    completeDetailedField("declared_path_responsive_review");
    const retainedNameAfterCancel = "Retained through immediate cancel";
    await setFormControlValue(
      'input[name="project-display-name"]',
      retainedNameAfterCancel,
    );
    await clickButtonByText("Cancel", ".project-inspection");
    await waitForCondition(
      `document.querySelector('.project-inspection') === null && Array.from(document.querySelectorAll('#project-management button')).some((button) => button.textContent?.trim() === 'Enter the folder path instead')`,
      "cancelled review returns to connection entry",
    );
    await clickButtonByText("Enter the folder path instead", "#project-management");
    await waitForCondition(
      `document.querySelector('input[name="local-project-declared-path"]') === document.activeElement && document.querySelector('input[name="local-project-declared-path"]')?.value === ${JSON.stringify(onboardingFolder)}`,
      "cancelled review preserves declared path",
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="project-display-name"]')?.value === ${JSON.stringify(retainedNameAfterCancel)}`,
      "new review survives prior abandonment response",
    );
    await waitForRequestQuiet();
    const cancelRaceCookies = await cdp.send("Network.getAllCookies");
    const currentOnboardingCookie = cancelRaceCookies.cookies.find(
      (cookie) =>
        cookie.name === "augnes_local_project_onboarding_v01" &&
        cookie.path === "/api/vnext/projects" &&
        cookie.httpOnly === true &&
        cookie.sameSite === "Strict",
    );
    assert(
      currentOnboardingCookie,
      "the newer onboarding session must remain after the prior abandonment settles",
    );
    assert.equal(
      serverLog.includes(currentOnboardingCookie.value),
      false,
      "onboarding credentials must remain absent from ordinary logs",
    );
    result.stale_abandonment_new_session_preserved = true;
    completeDetailedField("stale_abandonment_new_session_preserved");
    await clickButtonByText("Cancel", ".project-inspection");
    await waitForCondition(
      `document.querySelector('.project-inspection') === null && Array.from(document.querySelectorAll('#project-management button')).some((button) => button.textContent?.trim() === 'Enter the folder path instead')`,
      "second cancelled review returns to connection entry",
    );
    await clickButtonByText("Enter the folder path instead", "#project-management");
    await setFormControlValue(
      'input[name="local-project-declared-path"]',
      nonExactDeclaredPath,
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="local-project-declared-path"]')?.value === ${JSON.stringify(nonExactDeclaredPath)} && document.body.textContent.includes(${JSON.stringify(nonExactDeclaredPublicCopy)}) && document.querySelector('.project-inspection') === null`,
      "non-exact retry retains path after named review",
    );
    await setFormControlValue(
      'input[name="local-project-declared-path"]',
      onboardingFolder,
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="project-display-name"]')?.value === ${JSON.stringify(retainedNameAfterCancel)}`,
      "non-exact refusal preserves the entered project name",
    );
    await setFormControlValue('input[name="project-display-name"]', "");
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="confirm_folder"]')?.disabled === true && document.body.textContent.includes('Enter a project name.')`,
      "invalid onboarding name refusal",
    );
    const editedName = "처음 이어지는 Project Experience Alpha";
    await setFormControlValue(
      'input[name="project-display-name"]',
      editedName,
    );
    const confirmRequestOffset = requests.length;
    await clickSelector('[data-blank-state-primary-action="confirm_folder"]');
    const confirmResponse = await waitForObservedResponse(
      "/api/vnext/projects",
      "POST",
      confirmRequestOffset,
    );
    if (confirmResponse.status !== 200) {
      const confirmResponseBody = JSON.parse(
        (
          await cdp.send("Network.getResponseBody", {
            requestId: confirmResponse.request_id,
          })
        ).body,
      );
      throw new Error(
        `project_confirmation_failed:${confirmResponse.status}:${publicToken(confirmResponseBody.error_code ?? "unknown")}`,
      );
    }
    await waitForCondition(
      `location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')`,
      "canonical project destination",
    );
    projectAlphaDestination = await evaluateString("location.pathname");
    projectAlphaId = decodeURIComponent(projectAlphaDestination.split("/").at(-1));
    assert.match(projectAlphaId, /^project:/u);
    result.folder_onboarding_destination = projectAlphaDestination;
    completeDetailedField("folder_onboarding_destination");
    await waitForCondition(
      `document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes(${JSON.stringify(editedName)}) === true`,
      "edited project name propagation",
    );

    await clickSelector('a[data-project-context-label="Current project"]');
    await waitForCondition(
      `location.hash === '#project-settings' && (() => { const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]'); const input = details?.querySelector('input[name="current-project-display-name"]'); return details?.open === true && [details.querySelector(':scope > summary'), input].includes(document.activeElement); })()`,
      "project settings entry",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = false;
        const link = document.querySelector('a[data-project-context-label="Current project"]');
        if (!(link instanceof HTMLAnchorElement)) return false;
        link.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `location.hash === '#project-settings' && (() => { const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]'); const input = details?.querySelector('input[name="current-project-display-name"]'); return details?.open === true && [details.querySelector(':scope > summary'), input].includes(document.activeElement); })()`,
      "repeat project context activation",
    );
    result.project_context_repeat_activation = true;
    completeDetailedField("project_context_repeat_activation");
    assert.equal(
      await evaluateBoolean(`(() => {
        const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = false;
        const link = document.querySelector('a[data-project-context-label="Current project"]');
        if (!(link instanceof HTMLAnchorElement)) return false;
        link.focus();
        return document.activeElement === link;
      })()`),
      true,
    );
    await dispatchKeyboardKey("Enter", "Enter", 13);
    await waitForCondition(
      `location.hash === '#project-settings' && (() => { const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]'); const input = details?.querySelector('input[name="current-project-display-name"]'); return details?.open === true && [details.querySelector(':scope > summary'), input].includes(document.activeElement); })()`,
      "keyboard project context activation",
    );
    result.project_context_keyboard_activation = true;
    completeDetailedField("project_context_keyboard_activation");
    result.project_context_opens_settings = true;
    completeDetailedField("project_context_opens_settings");

    await setFormControlValue('input[name="current-project-display-name"]', "");
    await waitForCondition(
      `document.querySelector('[data-project-name-save="true"]')?.disabled === true && document.body.textContent.includes('Enter a project name.')`,
      "invalid project rename refusal",
    );
    result.project_name_invalid_blocked = true;
    completeDetailedField("project_name_invalid_blocked");
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      editedName,
    );
    const staleRename = await browserFetchJson("/api/vnext/projects", {
      method: "POST",
      prepareExpression: `await (async () => {
        const recent = await (await fetch('/api/vnext/projects')).json();
        window.__projectExperienceRecent = recent.recent_projects;
      })()`,
      explicitBody: {
        action: "rename",
        project_id: projectAlphaId,
        requested_display_name: "Stale rename source",
      },
      deriveActiveConflictBody: true,
    });
    assert.equal(staleRename.status, 200);
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      "Stale UI rename",
    );
    await clickSelector('[data-project-name-save="true"]');
    await waitForCondition(
      `document.body.textContent.includes('The project name changed in another view. Refresh and try again.')`,
      "stale project naming conflict",
    );
    result.project_name_stale_conflict_visible = true;
    completeDetailedField("project_name_stale_conflict_visible");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelector('input[name="current-project-display-name"]')?.value === 'Stale rename source'`,
      "stale naming source refresh",
    );
    const longKoreanName = `장기 연속성 프로젝트 ${"가".repeat(72)} English continuity`;
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      longKoreanName,
    );
    await waitForCondition(
      `document.querySelector('input[name="current-project-display-name"]')?.value === ${JSON.stringify(longKoreanName)} && document.querySelector('[data-project-name-save="true"]')?.disabled === false`,
      "long Korean project name ready to save",
    );
    await clickSelector('[data-project-name-save="true"]');
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelector('input[name="current-project-display-name"]')?.value === ${JSON.stringify(longKoreanName)} && document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes(${JSON.stringify(longKoreanName)}) === true`,
      "long Korean project name propagation",
    );
    const recentAfterLongRename = await readRecentProjectsInBrowser();
    const activeAfterLongRename = recentAfterLongRename.recent_projects.find(
      (entry) => entry.is_active,
    );
    assert.equal(activeAfterLongRename?.project.display_name, longKoreanName);
    assert.equal(
      activeAfterLongRename?.local_root.normalized_path,
      onboardingFolder,
      "rename must not change the local root",
    );
    result.project_name_long_korean_propagated = true;
    completeDetailedField("project_name_long_korean_propagated");
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      "Project Experience Alpha",
    );
    await waitForCondition(
      `document.querySelector('[data-project-name-save="true"]')?.disabled === false`,
      "restored project name ready to save",
    );
    await clickSelector('[data-project-name-save="true"]');
    await waitForCondition(
      `document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes('Project Experience Alpha') === true && document.querySelector('input[name="current-project-display-name"]')?.value === 'Project Experience Alpha'`,
      "restored project name",
    );
    await evaluateBoolean(`(() => {
      const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
      if (details instanceof HTMLDetailsElement) details.open = false;
      history.replaceState(null, '', location.pathname);
      return true;
    })()`);
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Enter the folder path instead')`,
      "existing project connection controls",
    );
    await clickButtonByText("Enter the folder path instead", "#project-management");
    await setFormControlValue(
      'input[name="local-project-declared-path"]',
      onboardingFolder,
    );
    await clickSelector('[data-blank-state-primary-action="review_folder_path"]');
    await waitForCondition(
      `Array.from(document.querySelectorAll('#project-management button')).some((button) => button.textContent?.trim() === 'Open project') && document.querySelector('#project-management')?.textContent?.includes('already connected') === true`,
      "existing declared project review",
    );
    const beforeDeclaredReopen = await readRecentProjectsInBrowser();
    assert.equal(beforeDeclaredReopen.recent_projects.length, 1);
    await clickButtonByText("Open project", "#project-management");
    await waitForCondition(
      `location.hash === '' && (location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')) && document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === false && document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes('Project Experience Alpha') === true`,
      "existing declared project reopened",
    );
    const afterDeclaredReopen = await readRecentProjectsInBrowser();
    assert.equal(afterDeclaredReopen.recent_projects.length, 1);
    assert.equal(
      afterDeclaredReopen.recent_projects[0].project.project_id,
      projectAlphaId,
    );
    assert.equal(
      afterDeclaredReopen.recent_projects[0].local_root.normalized_path,
      onboardingFolder,
      "an existing alias-free project must retain its canonical root",
    );
    result.declared_path_existing_project_reopen = true;
    completeDetailedField("declared_path_existing_project_reopen");
    result.project_name_onboarding_prefill_and_edit = true;
    completeDetailedField("project_name_onboarding_prefill_and_edit");

    const emptyState = await evaluateJson(`(() => {
      const home = document.querySelector('[data-blank-state="v0.1"]');
      const text = home?.innerText ?? '';
      return {
        name: document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes('Project Experience Alpha') === true,
        heading: home?.querySelector('h1')?.textContent?.trim(),
        primary_action_count: home?.querySelectorAll('[data-blank-state-primary-action]').length,
        project_home_absent: !text.includes('Project Home'),
        metric_grid_absent: home?.querySelector('.project-home-coordinate-grid') === null,
        internal_vocabulary_absent: !/(TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|Decision debt|Accepted state|Working projection|Exact coordination|Inspector lineage|packet fingerprint)/i.test(text),
        active: home?.getAttribute('data-blank-state-active') === 'true',
        focus: home?.getAttribute('data-blank-state-focus'),
        guide_version: home?.getAttribute('data-guide-brief-version'),
        guide_source: home?.getAttribute('data-guide-brief-source-status'),
        project_context: home?.getAttribute('data-guide-brief-project-context'),
        proposal_absent: !text.includes(${JSON.stringify(manifest.rendered_state_inputs.proposal_review.proposal_id)}),
        packet_absent: !text.includes('task-context-packet:'),
        management_safety_closed: document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === false,
        management_safety_context: document.querySelector('[data-management-safety]')?.getAttribute('data-management-safety-project-context') ?? null
      };
    })()`);
    assert.deepEqual(emptyState, {
      name: true,
      heading: "Continuities",
      primary_action_count: 1,
      project_home_absent: true,
      metric_grid_absent: true,
      internal_vocabulary_absent: true,
      active: true,
      focus: "first_work_not_defined",
      guide_version: "guide_brief.v0.2",
      guide_source: "live_current_project",
      project_context: "current",
      proposal_absent: true,
      packet_absent: true,
      management_safety_closed: true,
      management_safety_context: "active_project",
    });
    const guideRead = await evaluateJson(`(async () => {
      const response = await fetch('/api/augnes/read/guide-brief?scope=project%3Aaugnes', {
        headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' },
        cache: 'no-store'
      });
      const body = await response.json();
      const serialized = JSON.stringify(body);
      return {
        status: response.status,
        cache_control: response.headers.get('cache-control'),
        version: body.guide_version,
        project_id: body.identity?.project_id,
        project: body.identity?.project_display_name,
        context: body.identity?.project_context,
        focus: body.coordinate?.focus,
        browser_focus: document.querySelector('[data-blank-state="v0.1"]')?.getAttribute('data-blank-state-focus'),
        authority: body.authority?.source_of_truth,
        private_path_absent: !/(\\/Users\\/|\\/home\\/|[A-Za-z]:\\\\)/u.test(serialized),
        credential_absent: !/(OPENAI_API_KEY|GITHUB_TOKEN|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_-]{8,})/u.test(serialized),
        projection_identity: {
          identity: {
            project_id: body.identity?.project_id ?? null,
            project_display_name: body.identity?.project_display_name ?? null,
            project_context: body.identity?.project_context ?? null
          },
          coordinate_goal: body.coordinate?.goal ?? null,
          coordinate_human_attention: body.coordinate?.human_attention ?? null,
          blank_state_highlighted_item: body.projections?.blank_state?.highlighted_item ?? null,
          ai_workplane: body.projections?.ai_workplane ?? null,
          chatgpt: body.projections?.chatgpt ?? null,
          codex: body.projections?.codex ?? null
        }
      };
    })()`);
    assert.equal(guideRead.status, 200);
    assert.equal(guideRead.cache_control, "no-store");
    assert.equal(guideRead.version, "guide_brief.v0.2");
    assert.equal(guideRead.project_id, projectAlphaId);
    assert.equal(guideRead.project, "Project Experience Alpha");
    assert.equal(guideRead.context, "current");
    assert.equal(guideRead.focus, "first_work_not_defined");
    assert.equal(guideRead.browser_focus, "first_work_not_defined");
    assert.equal(guideRead.authority, false);
    assert.equal(guideRead.private_path_absent, true);
    assert.equal(guideRead.credential_absent, true);
    blankStateGuideProjection = guideRead.projection_identity;
    result.guide_brief_blank_state_v0_2 = true;
    completeDetailedField("guide_brief_blank_state_v0_2");
    result.minimum_project_home_empty_state = true;
    completeDetailedField("minimum_project_home_empty_state");
    result.project_home_coordination_visible = true;
    completeDetailedField("project_home_coordination_visible");
    result.minimum_project_home_project_isolation = true;
    completeDetailedField("minimum_project_home_project_isolation");
    await validateProjectHomeViewports("first-work-not-defined");
    await validateProductShell({
      route: "/projects/[projectId]",
      primaryZone: "blank-state",
      projectContextRequired: true,
    });
    await validateProductShellResponsive("/projects/[projectId]");
    record("folder_onboarding_confirmation_refresh_restart_and_reopen");
    record("declared_path_fallback_review_connect_and_existing_reopen");
  });

  await runPhase("guidebrief_model_interpretation", async () => {
    await navigate(`${appOrigin}${projectAlphaDestination}`);
    await waitForCondition(
      `document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"][data-guidebrief-conversation-hydrated="true"]') !== null`,
      "mounted GuideBrief conversation",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const conversation = document.querySelector('[data-guidebrief-conversation]');
        if (!(conversation instanceof HTMLElement)) return false;
        const details = conversation.querySelector('details');
        if (details instanceof HTMLDetailsElement) details.open = true;
        return details instanceof HTMLDetailsElement ||
          conversation.getAttribute('data-guidebrief-conversation-presentation') === 'embedded';
      })()`),
      true,
    );
    const databaseBefore = databaseSnapshot(fixture.writable_database_path);
    const semanticBefore = semanticAuthorityCounts(
      fixture.writable_database_path,
    );

    if (REAL_PROVIDER_ACCEPTANCE) {
      result.guide_brief_real_provider_acceptance =
        await runRealProviderGuideBriefAcceptance({
          database_path: fixture.writable_database_path,
          manifest,
          project_id: manifest.project_id,
          project_destination: projectAlphaDestination,
          database_before: databaseBefore,
          semantic_before: semanticBefore,
        });
      result.guide_brief_model_interpretation_browser = true;
      completeDetailedField("guide_brief_model_interpretation_browser");
      record("guidebrief_model_interpretation_remains_deterministic_answer_only");
      return;
    }

    await submitGuideBriefDeterministicUtterance("What is happening now?");
    const deterministicAnswer = await evaluateString(
      `document.querySelector('[data-guidebrief-conversation-answer] strong')?.textContent?.trim() ?? ''`,
    );
    assert.equal(deterministicAnswer.length > 0, true);
    assert.equal(
      await evaluateString(
        `document.querySelector('[data-guidebrief-conversation-answer]')?.getAttribute('data-guidebrief-answer-model-assisted') ?? ''`,
      ),
      "false",
    );

    const korean = await submitGuideBriefUtteranceForPausedInterpretation(
      "현재 작업의 흐름을 평범하게 설명해 줄 수 있나요?",
    );
    const pausedBeforeDoubleSubmit =
      pausedGuideBriefInterpretationRequests.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const form = document.querySelector('[data-guidebrief-conversation] form');
        if (!(form instanceof HTMLFormElement)) return false;
        form.requestSubmit();
        return true;
      })()`),
      true,
    );
    await delay(50);
    assert.equal(
      pausedGuideBriefInterpretationRequests.length,
      pausedBeforeDoubleSubmit,
    );
    await fulfillGuideBriefInterpretation(
      korean,
      "resolved",
      "current_situation",
    );
    await waitForCondition(
      `document.querySelector('[data-guidebrief-conversation-answer][data-guidebrief-answer-model-assisted="true"]') !== null`,
      "Korean model-assisted question match",
    );
    assert.equal(
      await evaluateString(
        `document.querySelector('[data-guidebrief-conversation-answer] strong')?.textContent?.trim() ?? ''`,
      ),
      deterministicAnswer,
    );

    const english = await submitGuideBriefUtteranceForPausedInterpretation(
      "Could you explain the present position of this current work in ordinary terms?",
    );
    await fulfillGuideBriefInterpretation(
      english,
      "resolved",
      "current_situation",
    );
    await waitForCondition(
      `document.querySelector('[data-guidebrief-conversation-answer][data-guidebrief-answer-model-assisted="true"]') !== null`,
      "English model-assisted question match",
    );
    assert.equal(
      await evaluateString(
        `document.querySelector('[data-guidebrief-conversation-answer] strong')?.textContent?.trim() ?? ''`,
      ),
      deterministicAnswer,
    );

    for (const [utterance, status] of [
      ["현재 위치를 다른 말로 설명해 줄 수 있나요?", "unavailable"],
      ["Could you restate the current position more plainly?", "timed_out"],
      ["지금 상황을 다른 표현으로 알려줄 수 있나요?", "invalid"],
    ]) {
      const paused = await submitGuideBriefUtteranceForPausedInterpretation(
        utterance,
      );
      await fulfillGuideBriefInterpretation(paused, status);
      await waitForCondition(
        `document.querySelector('[data-guidebrief-interpretation-outcome="${status}"]') !== null`,
        `GuideBrief ${status} fallback`,
      );
      assert.equal(
        await evaluateBoolean(
          `document.querySelector('[data-guidebrief-conversation-answer]') === null && document.querySelector('[data-guidebrief-conversation] [aria-label="Questions supported by current sources"]') !== null`,
        ),
        true,
      );
    }

    const routeCallsBeforeActions =
      pausedGuideBriefInterpretationRequests.length;
    await submitGuideBriefDeterministicUtterance("prepare an accept decision");
    assert.equal(
      pausedGuideBriefInterpretationRequests.length,
      routeCallsBeforeActions,
    );
    await submitGuideBriefDeterministicUtterance(
      "What is happening now and prepare an accept decision",
    );
    assert.equal(
      pausedGuideBriefInterpretationRequests.length,
      routeCallsBeforeActions,
    );
    for (const actionRequest of [
      "Could you please show the next change?",
      "지금 이 변경을 적용해 줄 수 있어?",
    ]) {
      const actionResult =
        await submitGuideBriefActionRequestWithoutInterpretation(actionRequest);
      assert.deepEqual(actionResult, {
        loopback_calls: 0,
        provider_calls: 0,
        unsupported: true,
        model_assisted_answer: false,
        interaction_outcome_created: false,
      });
    }

    await submitGuideBriefDeterministicUtterance("What is happening now?");
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 1280, height: 900 },
      { width: 1440, height: 1000 },
    ]) {
      await setViewport(width, height);
      const layout = await evaluateJson(`(() => {
        const conversation = document.querySelector('[data-guidebrief-conversation]');
        const form = conversation?.querySelector('form');
        const controls = Array.from(form?.querySelectorAll('input, button') ?? []);
        const overlap = controls.length === 2 && (() => {
          const left = controls[0].getBoundingClientRect();
          const right = controls[1].getBoundingClientRect();
          return Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1 &&
            Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1;
        })();
        const text = conversation?.innerText ?? '';
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          document_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          conversation_overflow: (conversation?.scrollWidth ?? 0) > (conversation?.clientWidth ?? 0) + 1,
          control_overlap: Boolean(overlap),
          submit_count: conversation?.querySelectorAll('button[type="submit"]').length ?? 0,
          private_material_absent:
            !/project:[0-9a-f-]{36}/iu.test(text) &&
            !/q_[a-f0-9]{32}/iu.test(text) &&
            !text.includes('/Users/') &&
            !['sha256:', 'OPENAI', 'GPT-', 'model_gateway', 'candidate_token']
              .some((marker) => text.includes(marker)),
          transcript_copy_visible: text.includes('No conversation transcript is stored')
        };
      })()`);
      assert.deepEqual(layout, {
        width,
        height,
        document_overflow: false,
        conversation_overflow: false,
        control_overlap: false,
        submit_count: 1,
        private_material_absent: true,
        transcript_copy_visible: true,
      });
    }

    const late = await submitGuideBriefUtteranceForPausedInterpretation(
      "현재 작업 위치를 조금 다르게 설명해 줄래?",
    );
    await cdp.send("Page.navigate", {
      url: `${appOrigin}/workbench`,
    });
    await waitForCondition(
      `location.pathname === '/workbench/semantic-review'`,
      "GuideBrief interpretation host unmounted",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-guidebrief-conversation-answer][data-guidebrief-answer-model-assisted="true"]') === null`,
      ),
      true,
    );
    assert.equal(
      pausedGuideBriefInterpretationRequests.some(
        (entry) => entry.request_id === late.request_id,
      ),
      true,
    );
    await navigate(`${appOrigin}${projectAlphaDestination}`);
    assert.deepEqual(
      databaseSnapshot(fixture.writable_database_path),
      databaseBefore,
    );
    assert.deepEqual(
      semanticAuthorityCounts(fixture.writable_database_path),
      semanticBefore,
    );
    result.guide_brief_model_interpretation_browser = true;
    completeDetailedField("guide_brief_model_interpretation_browser");
    record("guidebrief_model_interpretation_remains_deterministic_answer_only");
  });

  await runPhase("project_shell_and_locked_entry", async () => {
    await navigate(`${appOrigin}/workbench`);
    await waitForCondition(
      `location.pathname === '/workbench/semantic-review' && document.querySelector('[data-vnext-operator-session="locked"]') !== null && document.querySelector('[data-ai-workplane-shell="v0.1"]') !== null`,
      "locked AI Workplane compatibility entry",
    );
    await waitForCondition(
      `document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-status="available"]') !== null`,
      "locked AI Workplane GuideBrief",
    );
    const workplaneGuide = await evaluateJson(`(async () => {
      const main = document.querySelector('main');
      const guide = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
      const text = main?.innerText ?? '';
      const response = await fetch('/api/augnes/read/guide-brief?scope=project%3Aaugnes', {
        headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' },
        cache: 'no-store'
      });
      const body = await response.json();
      const textWithoutLabel = (selector, label) =>
        guide?.querySelector(selector)?.textContent?.replace(label, '')?.trim() ?? null;
      return {
        private_material_rendered: main?.getAttribute('data-vnext-private-material-rendered'),
        project: guide?.querySelector('[data-guide-brief-project-name="true"]')?.textContent?.trim(),
        status: guide?.getAttribute('data-ai-workplane-guide-status'),
        guide_controls: guide?.querySelectorAll('button, input, textarea, select').length,
        exact_detail_absent: document.querySelector('[data-ai-workplane-exact-details]') === null,
        private_identity_absent: !/(sha256:|episode-delta-proposal:|task-context-packet:)/i.test(text),
        goal_consistent:
          textWithoutLabel('[data-guide-brief-core-goal="true"]', 'Goal') ===
          body.projections?.ai_workplane?.current_goal,
        constraint_consistent:
          textWithoutLabel('[data-guide-brief-core-constraint="true"]', 'Important constraint') ===
          (body.projections?.ai_workplane?.important_constraints?.[0] ?? null),
        judgment_consistent:
          textWithoutLabel('[data-guide-brief-core-judgment="true"]', 'Needs judgment') ===
          (body.projections?.ai_workplane?.unresolved_user_judgments?.[0] ??
            body.projections?.ai_workplane?.material_blocker_or_judgment ??
            null),
        chatgpt_codex_goal_consistent:
          body.projections?.chatgpt?.goal === body.projections?.codex?.current_goal,
        chatgpt_codex_constraints_consistent:
          JSON.stringify(body.projections?.chatgpt?.constraints ?? []) ===
          JSON.stringify(body.projections?.codex?.constraints ?? []),
        chatgpt_codex_judgment_consistent:
          JSON.stringify(
            (body.projections?.chatgpt?.needs_user_judgment ?? []).map(
              (item) => item.question
            )
          ) === JSON.stringify(body.projections?.codex?.unresolved_user_judgments ?? []),
        human_attention_consistent:
          JSON.stringify(body.coordinate?.human_attention ?? null) ===
            JSON.stringify(body.projections?.ai_workplane?.human_attention ?? null) &&
          JSON.stringify(body.coordinate?.human_attention ?? null) ===
            JSON.stringify(body.projections?.chatgpt?.human_attention ?? null) &&
          JSON.stringify(body.coordinate?.human_attention ?? null) ===
            JSON.stringify(body.projections?.codex?.human_attention ?? null) &&
          body.coordinate?.human_attention?.required ===
            body.projections?.blank_state?.highlighted_item?.requires_human_attention &&
          body.coordinate?.human_attention?.category ===
            body.projections?.blank_state?.highlighted_item?.attention_category,
        projection_identity: {
          identity: {
            project_id: body.identity?.project_id ?? null,
            project_display_name: body.identity?.project_display_name ?? null,
            project_context: body.identity?.project_context ?? null
          },
          coordinate_goal: body.coordinate?.goal ?? null,
          coordinate_human_attention: body.coordinate?.human_attention ?? null,
          blank_state_highlighted_item: body.projections?.blank_state?.highlighted_item ?? null,
          ai_workplane: body.projections?.ai_workplane ?? null,
          chatgpt: body.projections?.chatgpt ?? null,
          codex: body.projections?.codex ?? null
        }
      };
    })()`);
    assert.deepEqual(workplaneGuide.projection_identity, blankStateGuideProjection);
    assert.deepEqual(
      {
        private_material_rendered: workplaneGuide.private_material_rendered,
        project: workplaneGuide.project,
        status: workplaneGuide.status,
        guide_controls: workplaneGuide.guide_controls,
        exact_detail_absent: workplaneGuide.exact_detail_absent,
        private_identity_absent: workplaneGuide.private_identity_absent,
        goal_consistent: workplaneGuide.goal_consistent,
        constraint_consistent: workplaneGuide.constraint_consistent,
        judgment_consistent: workplaneGuide.judgment_consistent,
        chatgpt_codex_goal_consistent:
          workplaneGuide.chatgpt_codex_goal_consistent,
        chatgpt_codex_constraints_consistent:
          workplaneGuide.chatgpt_codex_constraints_consistent,
        chatgpt_codex_judgment_consistent:
          workplaneGuide.chatgpt_codex_judgment_consistent,
        human_attention_consistent: workplaneGuide.human_attention_consistent,
      },
      {
      private_material_rendered: "false",
      project: "Project Experience Alpha",
      status: "available",
      guide_controls: 0,
      exact_detail_absent: true,
      private_identity_absent: true,
      goal_consistent: true,
      constraint_consistent: true,
      judgment_consistent: true,
      chatgpt_codex_goal_consistent: true,
      chatgpt_codex_constraints_consistent: true,
      chatgpt_codex_judgment_consistent: true,
      human_attention_consistent: true,
      },
    );
    result.guide_brief_ai_workplane_v0_2 = true;
    completeDetailedField("guide_brief_ai_workplane_v0_2");
    result.guide_brief_cross_surface_consistency = true;
    completeDetailedField("guide_brief_cross_surface_consistency");
    result.workbench_compatibility_redirect = true;
    completeDetailedField("workbench_compatibility_redirect");
    await validateProductShell({
      route: "/workbench/semantic-review",
      primaryZone: "ai-workplane",
      projectContextRequired: true,
    });
    await validateProductShellResponsive("/workbench/semantic-review");
    await clickSelector('a[data-project-context-label="Current project"]');
    await waitForCondition(
      `location.pathname === '/' && location.hash === '#project-settings' && (() => { const settings = document.querySelector('details[data-blank-state-project-settings-recovery="true"]'); return settings?.open === true && settings.querySelector(':scope > summary') === document.activeElement; })()`,
      "AI Workplane project settings return",
    );
    result.ai_workplane_project_context_opens_settings = true;
    completeDetailedField("ai_workplane_project_context_opens_settings");

    await navigate(`${appOrigin}/workbench/inspector`);
    await waitForCondition(
      `document.querySelector('[data-contextual-inspector-state="invalid"]') !== null && document.querySelectorAll('[data-contextual-inspector-state="invalid"] form, [data-contextual-inspector-state="invalid"] input').length === 0`,
      "empty exact detail guidance",
    );
    await navigate(
      new URL(
        manifest.rendered_state_inputs.inspector.href,
        appOrigin,
      ).toString(),
    );
    await waitForCondition(
      `document.querySelector('[data-contextual-inspector-state="locked"]') !== null && document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
      "locked exact detail target",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const state = document.querySelector('[data-contextual-inspector-state="locked"]');
        const html = state?.innerHTML ?? '';
        return state?.querySelector('h1')?.textContent?.trim() === 'Exact details require local review access' &&
          !html.includes(${JSON.stringify(manifest.rendered_state_inputs.proposal_review.proposal_id)}) &&
          !html.includes(${JSON.stringify(manifest.rendered_state_inputs.proposal_review.proposal_fingerprint)}) &&
          state.querySelectorAll('input:not(#vnext-operator-bootstrap-token)').length === 0;
      })()`),
      true,
    );
    record("locked_workbench_renders_no_private_material");
  });

  await runPhase("responsive_first_work_presentation", async () => {
    await restartRuntime(
      fixture.writable_database_path,
      manifest,
      projectAlphaId,
    );
    await navigate(`${appOrigin}/workbench/semantic-review#first-work`);
    await authenticateCurrentPage(
      fixture.writable_database_path,
      manifest,
      projectAlphaId,
    );
    await waitForCondition(
      `document.querySelector('[data-first-work-composer="project_work_initialization.v0.1"][data-first-work-state="not_defined"]') !== null`,
      "first-work presentation fixture",
    );
    await validateFirstWorkComposerViewports();
    result.first_work_browser_viewports = true;
    completeDetailedField("first_work_browser_viewports");
    await proveRepositoryDecisionBrowserConfirmation(
      fixture.writable_database_path,
      manifest,
      projectAlphaId,
    );
    result.repository_decision_browser_confirmation = true;
    await cdp.send("Network.clearBrowserCookies");
  });

  await runPhase("project_home_lifecycle_presentation", async () => {
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "project management surface",
    );
    await clickSelector('[data-blank-state-primary-action="choose_folder"]');
    await waitForCondition(
      `document.querySelector('input[name="project-display-name"]')?.value === 'Project Experience Beta'`,
      "second project inspection",
    );
    await clickSelector('[data-blank-state-primary-action="confirm_folder"]');
    await waitForCondition(
      `(location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')) && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Project Experience Beta')`,
      "second active project",
    );
    projectBetaDestination = await evaluateString("location.pathname");
    projectBetaId = decodeURIComponent(projectBetaDestination.split("/").at(-1));
    assert.notEqual(projectBetaId, projectAlphaId);

    const activeBeforeDeepLink = await readRecentProjectsInBrowser();
    assert.equal(
      activeBeforeDeepLink.recent_projects.find((entry) => entry.is_active)
        ?.project.project_id,
      projectBetaId,
    );
    await navigate(`${appOrigin}${projectAlphaDestination}`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="false"][data-blank-state-presentation="viewed_project_inactive"]') !== null && document.querySelector('[data-blank-state-primary-action="make_active"]') !== null`,
      "viewed inactive project",
    );
    const activeAfterDeepLink = await readRecentProjectsInBrowser();
    assert.equal(
      activeAfterDeepLink.recent_projects.find((entry) => entry.is_active)
        ?.project.project_id,
      projectBetaId,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const home = document.querySelector('[data-blank-state="v0.1"][data-blank-state-presentation="viewed_project_inactive"]');
        const conversation = document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]');
        return Boolean(home) &&
          document.body.textContent.includes('Opening this link did not switch your current project.') &&
          home.querySelectorAll('[data-blank-state-primary-action="make_active"]').length === 1 &&
          home.querySelector('details[data-management-safety], [data-project-controls-hydrated="true"]') === null &&
          conversation?.getAttribute('data-guidebrief-conversation-active-answer') === 'false' &&
          conversation.querySelectorAll('[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]').length === 0;
      })()`),
      true,
    );
    result.minimum_project_home_non_active_deep_link_read_only = true;
    completeDetailedField("minimum_project_home_non_active_deep_link_read_only");
    await waitForRequestQuiet();
    await validateProjectHomeViewports("viewed-inactive-project");
    result.minimum_project_home_narrow_viewport_no_overflow = true;
    completeDetailedField("minimum_project_home_narrow_viewport_no_overflow");
    await waitForRequestQuiet();
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && Array.from(document.querySelectorAll('button[data-blank-state-primary-action="make_active"]')).some((button) => button.getBoundingClientRect().width > 0 && !button.disabled)`,
      "explicit project activation ready",
    );
    const activationResponseStart = responses.length;
    await clickSelector('[data-blank-state-primary-action="make_active"]');
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Project Experience Alpha')`,
      "explicit project activation",
    );
    assert.equal(
      responses
        .slice(activationResponseStart)
        .some(
          (entry) =>
            entry.path === "/api/vnext/projects" &&
            entry.method === "POST" &&
            entry.status === 200,
        ),
      true,
    );
    result.minimum_project_home_explicit_activation = true;
    completeDetailedField("minimum_project_home_explicit_activation");

    const expiredMarker = "PROJECT EXPERIENCE EXPIRED CONTEXT MUST STAY HIDDEN";
    admitExpiredProjectContextPresentationV1({
      database_path: fixture.writable_database_path,
      project_id: projectAlphaId,
      marker: expiredMarker,
    });
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-focus="work_instructions_unavailable"]') !== null && document.body.textContent.includes('Current work instructions are unavailable')`,
      "expired project context withheld",
    );
    assert.equal(
      await evaluateBoolean(
        `!document.body.textContent.includes(${JSON.stringify(expiredMarker)}) && !document.body.textContent.includes('perspective:project-experience-expired-context-v1')`,
      ),
      true,
    );
    result.minimum_project_home_expired_context_withheld = true;
    completeDetailedField("minimum_project_home_expired_context_withheld");
    const beforeRefresh = databaseSnapshot(fixture.writable_database_path);
    const refreshRequestIndex = requests.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "read-only project home refresh",
    );
    assert.deepEqual(
      databaseSnapshot(fixture.writable_database_path),
      beforeRefresh,
    );
    assert.equal(
      requests
        .slice(refreshRequestIndex)
        .some((entry) => entry.method === "POST"),
      false,
    );
    result.minimum_project_home_refresh_read_only = true;
    completeDetailedField("minimum_project_home_refresh_read_only");

    const activateBeta = await openProjectInBrowser(projectBetaId);
    assert.equal(activateBeta.status, 200);
    mkdirSync(path.dirname(onboardingFolderBRecovered), {
      recursive: true,
      mode: 0o700,
    });
    renameSync(onboardingFolderB, onboardingFolderBRecovered);
    renameSync(folderPickerSequencePath, `${folderPickerSequencePath}.consumed`);
    writeFolderPickerSequence([
      {
        id: "project-beta-recovery-cancel-pending",
        outcome: "pending_until_abort",
      },
      {
        id: "project-beta-recovery-switch-pending",
        outcome: "pending_until_abort",
      },
      {
        id: "project-beta-recovery-native",
        outcome: "selected",
        absolute_path: onboardingFolderBRecovered,
      },
    ]);
    await restartRuntime(
      fixture.writable_database_path,
      manifest,
      projectBetaId,
    );
    const recoveryCookiesBefore = await cdp.send("Network.getAllCookies");
    assert.equal(
      recoveryCookiesBefore.cookies.some((cookie) =>
        cookie.name === "augnes_vnext_operator_session_v01" ||
        cookie.name === "augnes_vnext_repository_decision_session_v01" ||
        cookie.name.startsWith("augnes_vnext_recovery_decision_")
      ),
      false,
      "fresh recovery must begin without operator or decision cookies",
    );
    await navigate(`${appOrigin}${projectBetaDestination}`);
    await waitForCondition(
      `document.querySelector('[data-blank-state-focus="project_root_unavailable"] [data-blank-state-primary-action="locate_folder"]') !== null && document.body.textContent.includes('The project record is safe')`,
      "project recovery presentation",
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && Array.from(document.querySelectorAll('[data-blank-state-primary-action="locate_folder"]')).some((button) => button.getBoundingClientRect().width > 0 && !button.disabled)`,
      "project recovery controls ready",
    );
    const sameCandidateRecoveryProbe = await evaluateJson(`(async () => {
      const recentResponse = await fetch('/api/vnext/projects', { cache: 'no-store' });
      const recent = await recentResponse.json();
      const entry = recent.recent_projects.find((candidate) =>
        candidate.project.project_id === ${JSON.stringify(projectBetaId)}
      );
      const post = async (body) => {
        const response = await fetch('/api/vnext/projects', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store'
        });
        return { status: response.status, body: await response.json() };
      };
      const declared = await post({
        action: 'declare_recovery_path',
        path: ${JSON.stringify(onboardingFolderBRecovered)},
        project_id: entry.project.project_id,
        expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
        expected_old_baseline_fingerprint: entry.physical_root_baseline_fingerprint,
        expected_active_project_id: entry.active_project_id,
        expected_active_selection_revision: entry.active_selection_revision
      });
      const common = {
        action: 'prepare_repository_execution_rebind_confirmation',
        project_id: entry.project.project_id,
        selection_token: declared.body.picker.selection_token,
        inspection_fingerprint: declared.body.picker.inspection.inspection_fingerprint,
        expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
        expected_old_baseline_fingerprint: entry.physical_root_baseline_fingerprint
      };
      const [first, second] = await Promise.all([post(common), post(common)]);
      window.__lpx2SameCandidateRecoveryProbe = {
        project_id: entry.project.project_id,
        selection_token: declared.body.picker.selection_token
      };
      return {
        declared_status: declared.status,
        first_status: first.status,
        second_status: second.status,
        same_request: first.body.decision_request_fingerprint === second.body.decision_request_fingerprint,
        same_challenge: first.body.confirmation.challenge_fingerprint === second.body.confirmation.challenge_fingerprint,
        private_response_material: /vnext_(?:bootstrap|session)_v01|session_secret|action_nonce|cookie_value/iu.test(JSON.stringify([first.body, second.body]))
      };
    })()`);
    assert.deepEqual(sameCandidateRecoveryProbe, {
      declared_status: 200,
      first_status: 200,
      second_status: 200,
      same_request: true,
      same_challenge: true,
      private_response_material: false,
    });
    const sameCandidateCookies = await cdp.send("Network.getAllCookies");
    const sameCandidateRecoveryCookies = sameCandidateCookies.cookies.filter(
      (cookie) => cookie.name.startsWith("augnes_vnext_recovery_decision_"),
    );
    assert.equal(sameCandidateRecoveryCookies.length, 1);
    assert.equal(sameCandidateRecoveryCookies[0].httpOnly, true);
    assert.equal(sameCandidateRecoveryCookies[0].sameSite, "Strict");
    const recoveryCookiePairCharacters =
      sameCandidateRecoveryCookies[0].name.length +
      sameCandidateRecoveryCookies[0].value.length + 1;
    assert(recoveryCookiePairCharacters < 4096);
    assert(recoveryCookiePairCharacters * 32 > 4096);
    const sameCandidateSessionDatabase = new Database(
      fixture.writable_database_path,
      { readonly: true, fileMustExist: true },
    );
    try {
      assert.equal(
        sameCandidateSessionDatabase.prepare(
          `SELECT COUNT(*) AS count FROM vnext_local_operator_sessions
            WHERE project_id = ?
              AND operator_id = 'operator:local-project-recovery'
              AND revoked_at IS NULL`,
        ).pluck().get(projectBetaId),
        1,
      );
    } finally {
      sameCandidateSessionDatabase.close();
    }
    result.project_recovery_same_candidate_prepare_reordering_safe = true;
    completeDetailedField(
      "project_recovery_same_candidate_prepare_reordering_safe",
    );
    const sameCandidateAbandoned = await evaluateJson(`(async () => {
      const owned = window.__lpx2SameCandidateRecoveryProbe;
      const response = await fetch('/api/vnext/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'abandon_recovery_selection',
          project_id: owned.project_id,
          selection_token: owned.selection_token
        }),
        cache: 'no-store'
      });
      delete window.__lpx2SameCandidateRecoveryProbe;
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(sameCandidateAbandoned.status, 200);
    const afterSameCandidateAbandon = await cdp.send("Network.getAllCookies");
    assert.equal(
      afterSameCandidateAbandon.cookies.some((cookie) =>
        cookie.name.startsWith("augnes_vnext_recovery_decision_")
      ),
      false,
    );
    result.project_recovery_terminal_cookie_cleared = true;
    completeDetailedField("project_recovery_terminal_cookie_cleared");
    const retryStress = await evaluateJson(`(async () => {
      const post = async (body) => {
        const response = await fetch('/api/vnext/projects', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store'
        });
        return { status: response.status, body: await response.json() };
      };
      const statuses = [];
      for (let index = 0; index < 32; index += 1) {
        const recentResponse = await fetch('/api/vnext/projects', { cache: 'no-store' });
        const recent = await recentResponse.json();
        const entry = recent.recent_projects.find((candidate) =>
          candidate.project.project_id === ${JSON.stringify(projectBetaId)}
        );
        const declared = await post({
          action: 'declare_recovery_path',
          path: ${JSON.stringify(onboardingFolderBRecovered)},
          project_id: entry.project.project_id,
          expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
          expected_old_baseline_fingerprint: entry.physical_root_baseline_fingerprint,
          expected_active_project_id: entry.active_project_id,
          expected_active_selection_revision: entry.active_selection_revision
        });
        const prepared = await post({
          action: 'prepare_repository_execution_rebind_confirmation',
          project_id: entry.project.project_id,
          selection_token: declared.body.picker.selection_token,
          inspection_fingerprint: declared.body.picker.inspection.inspection_fingerprint,
          expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
          expected_old_baseline_fingerprint: entry.physical_root_baseline_fingerprint
        });
        const abandoned = await post({
          action: 'abandon_recovery_selection',
          project_id: entry.project.project_id,
          selection_token: declared.body.picker.selection_token
        });
        statuses.push([declared.status, prepared.status, abandoned.status]);
      }
      return {
        attempts: statuses.length,
        all_ok: statuses.every((entry) => entry.every((status) => status === 200))
      };
    })()`);
    assert.deepEqual(retryStress, { attempts: 32, all_ok: true });
    const afterRetryStressCookies = await cdp.send("Network.getAllCookies");
    assert.equal(
      afterRetryStressCookies.cookies.some((cookie) =>
        cookie.name.startsWith("augnes_vnext_recovery_decision_")
      ),
      false,
    );
    result.project_recovery_retry_cookie_budget_bounded = true;
    completeDetailedField("project_recovery_retry_cookie_budget_bounded");
    const recoveryContext = await evaluateJson(`(() => {
      const context = document.querySelector('[data-project-context-label="Current project"]');
      return {
        tag: context?.tagName,
        interactive: context?.matches('a, button'),
        settings_targets: document.querySelectorAll('#project-settings').length,
        primary_actions: document.querySelectorAll('[data-augnes-primary-action]').length,
        locate_actions: document.querySelectorAll('[data-blank-state-primary-action="locate_folder"]').length
      };
    })()`);
    assert.deepEqual(recoveryContext, {
      tag: "P",
      interactive: false,
      settings_targets: 0,
      primary_actions: 1,
      locate_actions: 1,
    });
    result.project_recovery_context_passive = true;
    completeDetailedField("project_recovery_context_passive");
    const recoveryStateBeforeInspection = projectRecoveryDatabaseState(
      fixture.writable_database_path,
      projectBetaId,
    );
    assert.equal(recoveryStateBeforeInspection.recent_count, 2);
    assert.equal(
      recoveryStateBeforeInspection.root.normalized_root,
      onboardingFolderB,
    );
    await waitForRequestQuiet();
    await clickSelectorByMouse(
      '[data-blank-state-primary-action="locate_folder"]',
    );
    await waitForCondition(
      `document.querySelector('[data-project-recovery="verified-folder-selection.v0.1"]') !== null && document.body.textContent.includes('Locate folder for Project Experience Beta') && document.body.textContent.includes(${JSON.stringify(onboardingFolderB)}) && Array.from(document.querySelectorAll('#project-recovery button')).some((button) => button.textContent?.trim() === 'Enter the folder path instead')`,
      "project recovery entry",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const recovery = document.querySelector('#project-recovery');
        const text = recovery?.innerText ?? '';
        return recovery?.querySelectorAll('[data-augnes-primary-action]').length === 1 &&
          text.includes('The project record and its stored history remain in Augnes.') &&
          text.includes('Nothing changes until you confirm a reviewed folder.') &&
          text.includes('computer running Augnes') &&
          text.includes('The folder is not uploaded.') &&
          !/(candidate purpose|fingerprint|physical id|node scope|CAS|nonce|credential|database)/i.test(text);
      })()`),
      true,
    );
    result.project_recovery_entry_parity = true;
    completeDetailedField("project_recovery_entry_parity");
    result.project_recovery_public_copy = true;
    completeDetailedField("project_recovery_public_copy");

    const recoveryFailedRequestOffset = failedRequests.length;
    await clickSelector('[data-blank-state-primary-action="choose_recovery_folder"]');
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="choose_recovery_folder"]')?.textContent?.includes('Waiting for folder picker') === true && Array.from(document.querySelectorAll('#project-recovery button')).some((button) => button.textContent?.trim() === 'Cancel attempt')`,
      "recovery picker pending cancel",
    );
    await waitForFolderPickerSequenceIndex(1);
    await clickButtonByText("Cancel attempt", "#project-recovery");
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="choose_recovery_folder"]:not(:disabled)') !== null`,
      "recovery picker attempt cancelled",
    );
    await clickSelector('[data-blank-state-primary-action="choose_recovery_folder"]');
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="choose_recovery_folder"]')?.textContent?.includes('Waiting for folder picker') === true`,
      "second recovery picker pending",
    );
    await waitForFolderPickerSequenceIndex(2);
    await clickButtonByText("Enter the folder path instead", "#project-recovery");
    await waitForCondition(
      `document.querySelector('input[name="local-project-recovery-path"]') === document.activeElement`,
      "recovery pending picker switches to path entry",
    );
    result.project_recovery_pending_path_switch = true;
    completeDetailedField("project_recovery_pending_path_switch");

    await waitForRequestQuiet();
    assert.deepEqual(
      failedRequests.slice(recoveryFailedRequestOffset).map((entry) => ({
        path: entry.path,
        error_text: entry.error_text,
      })),
      [
        { path: "/api/vnext/projects", error_text: "net::ERR_ABORTED" },
        { path: "/api/vnext/projects", error_text: "net::ERR_ABORTED" },
      ],
      "exactly the two user-abandoned recovery picker requests may abort",
    );
    await clickButtonByText("Choose a folder instead", "#project-recovery");
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="choose_recovery_folder"]:not(:disabled)') !== null`,
      "recovery picker mode restored",
    );
    const nativeRecoveryRequestOffset = requests.length;
    await clickSelector('[data-blank-state-primary-action="choose_recovery_folder"]');
    const nativeRecoveryResponse = await waitForObservedResponse(
      "/api/vnext/projects",
      "POST",
      nativeRecoveryRequestOffset,
    );
    const nativeRecoveryBody = JSON.parse((await cdp.send(
      "Network.getResponseBody",
      { requestId: nativeRecoveryResponse.request_id },
    )).body);
    assert.equal(
      nativeRecoveryResponse.status,
      200,
      `native_recovery_failed:${publicToken(nativeRecoveryBody.error_code ?? "unknown")}`,
    );
    assert.equal(nativeRecoveryBody.picker?.status, "selected");
    await waitForCondition(
      `document.querySelector('.project-recovery-review')?.textContent?.includes(${JSON.stringify(onboardingFolderBRecovered)}) === true && Array.from(document.querySelectorAll('.project-recovery-review button')).some((button) => button.textContent?.trim() === 'Use this folder')`,
      "native recovery review",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const review = document.querySelector('.project-recovery-review');
        const text = review?.innerText ?? '';
        return review?.querySelectorAll('[data-augnes-primary-action]').length === 1 &&
          text.includes('Project Experience Beta') &&
          text.includes(${JSON.stringify(onboardingFolderB)}) &&
          text.includes(${JSON.stringify(onboardingFolderBRecovered)}) &&
          text.includes('Plain folder') &&
          text.includes('Not a repository') &&
          text.includes('The saved folder will change to the selected folder.') &&
          text.includes('The project name and stored history remain unchanged.') &&
          text.includes('This step does not run Codex or change project files.') &&
          !/(candidate purpose|fingerprint|physical id|node scope|CAS|nonce|credential|database)/i.test(text);
      })()`),
      true,
    );
    await validateProjectRecoveryViewports();
    result.project_recovery_responsive_review = true;
    completeDetailedField("project_recovery_responsive_review");
    await clickButtonByText("Cancel", ".project-recovery-review");
    await waitForCondition(
      `document.querySelector('.project-recovery-review') === null && document.querySelector('[data-blank-state-primary-action="choose_recovery_folder"]:not(:disabled)') !== null`,
      "native recovery review cancelled",
    );
    await clickButtonByText("Enter the folder path instead", "#project-recovery");
    const invalidRecoveryPath = path.join(tempRoot, "missing recovery folder");
    await setFormControlValue(
      'input[name="local-project-recovery-path"]',
      invalidRecoveryPath,
    );
    await clickSelector('[data-blank-state-primary-action="review_recovery_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="local-project-recovery-path"]')?.value === ${JSON.stringify(invalidRecoveryPath)} && document.body.textContent.includes('That folder could not be found. Check the path and try again.') && document.querySelector('.project-recovery-review') === null`,
      "invalid recovery path retained",
    );
    result.project_recovery_declared_path_retained = true;
    completeDetailedField("project_recovery_declared_path_retained");
    await setFormControlValue(
      'input[name="local-project-recovery-path"]',
      nonExactDeclaredPath,
    );
    await clickSelector('[data-blank-state-primary-action="review_recovery_folder_path"]');
    await waitForCondition(
      `document.querySelector('input[name="local-project-recovery-path"]')?.value === ${JSON.stringify(nonExactDeclaredPath)} && document.body.textContent.includes(${JSON.stringify(nonExactDeclaredPublicCopy)}) && document.querySelector('.project-recovery-review') === null && document.querySelector('[data-blank-state-primary-action="confirm_recovery_folder"]') === null`,
      "non-exact recovery path refused before review",
    );
    result.project_recovery_non_exact_refused = true;
    completeDetailedField("project_recovery_non_exact_refused");
    await setFormControlValue(
      'input[name="local-project-recovery-path"]',
      onboardingFolderBRecovered,
    );
    await clickSelector('[data-blank-state-primary-action="review_recovery_folder_path"]');
    await waitForCondition(
      `document.querySelector('.project-recovery-review')?.textContent?.includes(${JSON.stringify(onboardingFolderBRecovered)}) === true && Array.from(document.querySelectorAll('.project-recovery-review button')).some((button) => button.textContent?.trim() === 'Use this folder')`,
      "declared recovery review",
    );
    await clickButtonByText("Cancel", ".project-recovery-review");
    await waitForCondition(
      `document.querySelector('input[name="local-project-recovery-path"]') === document.activeElement && document.querySelector('input[name="local-project-recovery-path"]')?.value === ${JSON.stringify(onboardingFolderBRecovered)}`,
      "recovery review cancel preserves declared path and focus",
    );
    await clickSelector('[data-blank-state-primary-action="review_recovery_folder_path"]');
    await waitForCondition(
      `document.querySelector('.project-recovery-review')?.textContent?.includes(${JSON.stringify(onboardingFolderBRecovered)}) === true && Array.from(document.querySelectorAll('.project-recovery-review button')).some((button) => button.textContent?.trim() === 'Use this folder')`,
      "recovery review immediate retry",
    );
    await waitForRequestQuiet();
    assert.deepEqual(
      projectRecoveryDatabaseState(
        fixture.writable_database_path,
        projectBetaId,
      ),
      recoveryStateBeforeInspection,
      "recovery inspection, cancellation, and review must not mutate canonical state",
    );
    result.project_recovery_cancel_and_retry = true;
    completeDetailedField("project_recovery_cancel_and_retry");
    result.project_recovery_native_and_declared_review = true;
    completeDetailedField("project_recovery_native_and_declared_review");
    result.project_recovery_no_mutation_before_confirmation = true;
    completeDetailedField("project_recovery_no_mutation_before_confirmation");

    const freshRecoveryRequestOffset = requests.length;
    await clickButtonByTextByMouse("Use this folder", ".project-recovery-review");
    await waitForCondition(
      `location.pathname === ${JSON.stringify(projectBetaDestination)} && document.querySelector('.project-recovery-review') === null && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "project root rebound",
    );
    await waitForRequestQuiet();
    const freshRecoveryRequests = requests.filter((entry, index) =>
      index >= freshRecoveryRequestOffset &&
      entry.path === "/api/vnext/projects" &&
      entry.method === "POST"
    );
    assert.equal(freshRecoveryRequests.length, 2);
    for (const recoveryRequest of freshRecoveryRequests) {
      const response = responses.find(
        (entry) => entry.request_id === recoveryRequest.request_id,
      );
      assert.equal(response?.status, 200);
    }
    assert.equal(
      await evaluateBoolean(`(() => {
        const publicText = document.documentElement.innerHTML;
        return !/vnext_(?:bootstrap|session)_v01|session_secret|action_nonce|cookie_value/iu.test(publicText) &&
          !document.cookie.includes('augnes_vnext_recovery_decision_');
      })()`),
      true,
    );
    const recoveryCookiesAfter = await cdp.send("Network.getAllCookies");
    const recoveryScopedCookies = recoveryCookiesAfter.cookies.filter(
      (cookie) => cookie.name.startsWith("augnes_vnext_recovery_decision_"),
    );
    assert.equal(recoveryScopedCookies.length, 0);
    assert.equal(
      recoveryCookiesAfter.cookies.some((cookie) =>
        cookie.name === "augnes_vnext_operator_session_v01" ||
        cookie.name === "augnes_vnext_repository_decision_session_v01"
      ),
      false,
    );
    const recoverySessionDatabase = new Database(
      fixture.writable_database_path,
      { readonly: true, fileMustExist: true },
    );
    try {
      const recoverySessionRows = recoverySessionDatabase.prepare(
        `SELECT operator_id, revoked_at FROM vnext_local_operator_sessions
          WHERE project_id = ? AND operator_id = 'operator:local-project-recovery'`,
      ).all(projectBetaId);
      assert.equal(recoverySessionRows.length, 1);
      assert.equal(typeof recoverySessionRows[0].revoked_at, "string");
    } finally {
      recoverySessionDatabase.close();
    }
    result.project_recovery_fresh_session_established = true;
    completeDetailedField("project_recovery_fresh_session_established");
    result.project_recovery_no_plaintext_bootstrap_exposed = true;
    completeDetailedField("project_recovery_no_plaintext_bootstrap_exposed");
    result.project_recovery_request_scoped_authority_only = true;
    completeDetailedField("project_recovery_request_scoped_authority_only");
    const recoveryStateAfterConfirmation = projectRecoveryDatabaseState(
      fixture.writable_database_path,
      projectBetaId,
    );
    assert.equal(
      recoveryStateAfterConfirmation.project_count,
      recoveryStateBeforeInspection.project_count,
      "recovery must not create another canonical project",
    );
    assert.equal(
      recoveryStateAfterConfirmation.recent_count,
      recoveryStateBeforeInspection.recent_count,
      "recovery must not create another recent project",
    );
    assert.equal(recoveryStateAfterConfirmation.project.project_id, projectBetaId);
    assert.equal(
      recoveryStateAfterConfirmation.project.display_name,
      recoveryStateBeforeInspection.project.display_name,
    );
    assert.equal(
      recoveryStateAfterConfirmation.root.normalized_root,
      onboardingFolderBRecovered,
    );
    assert.equal(recoveryStateAfterConfirmation.baselines.length, 1);
    assert.equal(
      recoveryStateAfterConfirmation.baselines[0].baseline_fingerprint ===
        recoveryStateBeforeInspection.baselines[0].baseline_fingerprint,
      false,
    );
    assert.equal(
      readFileSync(
        path.join(onboardingFolderBRecovered, "existing-project-content.txt"),
        "utf8",
      ),
      "LPX2 recovery must not change this project file.\n",
    );
    result.project_recovery_same_project_rebind = true;
    completeDetailedField("project_recovery_same_project_rebind");
    result.project_recovery_fresh_rebind_completed = true;
    completeDetailedField("project_recovery_fresh_rebind_completed");
    result.project_recovery_final_after_retry_stress = true;
    completeDetailedField("project_recovery_final_after_retry_stress");

    const activateAlpha = await openProjectInBrowser(projectAlphaId);
    assert.equal(activateAlpha.status, 200);
    await restartRuntime(
      fixture.writable_database_path,
      manifest,
      projectAlphaId,
    );
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Project Experience Alpha')`,
      "project reopen after runtime restart",
    );
    await navigate(`${appOrigin}${projectAlphaDestination}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(projectAlphaDestination)} && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null`,
      "same project destination after runtime restart",
    );
    const recent = await readRecentProjectsInBrowser();
    const alpha = recent.recent_projects.find(
      (entry) => entry.project.project_id === projectAlphaId,
    );
    assert(alpha);
    const firstOpen = await browserFetchJson("/api/vnext/projects", {
      method: "POST",
      explicitBody: {
        action: "open",
        project_id: projectAlphaId,
        expected_project_id: alpha.active_project_id,
        expected_revision: alpha.active_selection_revision,
      },
    });
    assert.equal(firstOpen.status, 200);
    const staleOpen = await browserFetchJson("/api/vnext/projects", {
      method: "POST",
      explicitBody: {
        action: "open",
        project_id: projectAlphaId,
        expected_project_id: alpha.active_project_id,
        expected_revision: alpha.active_selection_revision,
      },
    });
    assert.equal(staleOpen.status, 409);
    assert.equal(staleOpen.body.error_code, "active_selection_conflict");
    result.folder_onboarding_stale_active_conflict = true;
    completeDetailedField("folder_onboarding_stale_active_conflict");
    result.folder_onboarding_restart_reopen = true;
    completeDetailedField("folder_onboarding_restart_reopen");

    const unknownResponseIndex = responses.length;
    await navigate(`${appOrigin}/projects/project%3Aunknown-project-experience`);
    await waitForCondition(
      `document.body.textContent.includes('This page could not be found') && document.querySelector('[data-blank-state="v0.1"]') === null`,
      "unknown project safe not-found",
    );
    result.minimum_project_home_unknown_project_status = documentStatusSince(
      unknownResponseIndex,
      "/projects/project%3Aunknown-project-experience",
    );
    assert.equal(result.minimum_project_home_unknown_project_status, 200);
    completeDetailedField("minimum_project_home_unknown_project_status");
    result.minimum_project_home_unknown_project_safe_not_found = true;
    completeDetailedField("minimum_project_home_unknown_project_safe_not_found");
    const activeAfterUnknown = await readRecentProjectsInBrowser();
    assert.equal(
      activeAfterUnknown.recent_projects.find((entry) => entry.is_active)
        ?.project.project_id,
      projectAlphaId,
    );
    record("verified_folder_path_recovery_preserves_project_continuity");
    record("minimum_project_home_empty_refresh_restart_isolation_and_explicit_switch");
  });

  await runPhase("rendered_state_responsive_matrix", async () => {
    await navigate("about:blank");
    await terminateRuntime();
    const beforeRenderedStateAdmission = semanticAuthorityBaseline;
    admitProjectExperienceRenderedStateV1({
      database_path: fixture.writable_database_path,
      manifest,
      admitted_at: new Date().toISOString(),
    });
    const afterRenderedStateAdmission = semanticAuthorityCounts(
      fixture.writable_database_path,
    );
    assert.deepEqual(afterRenderedStateAdmission, {
      ...beforeRenderedStateAdmission,
      episode_delta_proposal:
        beforeRenderedStateAdmission.episode_delta_proposal +
        manifest.rendered_state_inputs.proposal_list_supplements.length,
    });
    semanticAuthorityBaseline = afterRenderedStateAdmission;
    startRuntime(
      fixture.writable_database_path,
      manifest,
      manifest.project_id,
    );
    await waitForHttp(`${appOrigin}/workbench/semantic-review`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await authenticateCurrentPage(
      fixture.writable_database_path,
      manifest,
      manifest.project_id,
    );
    const generalDecisionCookiesBeforeRecoveryClear = await cdp.send(
      "Network.getAllCookies",
    );
    const generalDecisionCookieBeforeRecoveryClear =
      generalDecisionCookiesBeforeRecoveryClear.cookies.find(
        (cookie) =>
          cookie.name ===
            "augnes_vnext_repository_decision_session_v01" &&
          cookie.path === "/api/vnext/projects",
      );
    assert(generalDecisionCookieBeforeRecoveryClear);
    const staleRecoveryCookieClear = await browserFetchJson(
      "/api/vnext/projects",
      {
        method: "POST",
        explicitBody: {
          action: "abandon_recovery_selection",
          project_id: manifest.project_id,
          selection_token: "browser-general-session-preservation-candidate",
        },
      },
    );
    assert.equal(staleRecoveryCookieClear.status, 200);
    const generalDecisionCookiesAfterRecoveryClear = await cdp.send(
      "Network.getAllCookies",
    );
    const generalDecisionCookieAfterRecoveryClear =
      generalDecisionCookiesAfterRecoveryClear.cookies.find(
        (cookie) =>
          cookie.name ===
            "augnes_vnext_repository_decision_session_v01" &&
          cookie.path === "/api/vnext/projects",
      );
    assert(generalDecisionCookieAfterRecoveryClear);
    assert.equal(
      generalDecisionCookieAfterRecoveryClear.value,
      generalDecisionCookieBeforeRecoveryClear.value,
    );
    assert.equal(
      generalDecisionCookiesAfterRecoveryClear.cookies.some((cookie) =>
        cookie.name.startsWith("augnes_vnext_recovery_decision_")
      ),
      false,
    );
    result.project_recovery_general_decision_cookie_preserved = true;
    completeDetailedField(
      "project_recovery_general_decision_cookie_preserved",
    );
    await waitForCondition(
      `document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]') !== null`,
      "delegated work presentation fixture",
    );
    await validateDelegatedWorkViewports();
    result.delegated_work_narrow_viewport_no_overflow = true;
    completeDetailedField("delegated_work_narrow_viewport_no_overflow");

    await navigate(
      `${appOrigin}${manifest.rendered_state_inputs.result_ready.review_href}`,
    );
    await waitForCondition(
      `document.querySelector('[data-run-result-review="v0.1"]') !== null`,
      "result-ready presentation fixture",
    );
    await validateResultViewports();
    result.workbench_result_narrow_viewport_no_overflow = true;
    completeDetailedField("workbench_result_narrow_viewport_no_overflow");

    await navigate(
      `${appOrigin}${manifest.rendered_state_inputs.proposal_review.review_href}`,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
      "proposal-review presentation fixture",
    );
    await validateProposalViewports();
    result.proposal_review_narrow_viewport_no_overflow = true;
    completeDetailedField("proposal_review_narrow_viewport_no_overflow");

    await navigate(
      new URL(manifest.rendered_state_inputs.inspector.href, appOrigin).toString(),
    );
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"]') !== null`,
      "Inspector presentation fixture",
    );
    await validateInspectorViewports();
    result.shared_inspector_narrow_viewport_no_overflow = true;
    completeDetailedField("shared_inspector_narrow_viewport_no_overflow");
    await validateProductShell({
      route: "/workbench/inspector",
      primaryZone: "ai-workplane",
      projectContextRequired: false,
    });
    await validateProductShellResponsive("/workbench/inspector");

    await navigate(`${appOrigin}/projects`);
    await waitForCondition(
      `document.querySelector('#project-settings[data-project-settings-owner="emphasized"][data-project-identity-management="true"]') !== null`,
      "emphasized project identity owner",
    );
    result.project_context_emphasized_owner = true;
    completeDetailedField("project_context_emphasized_owner");
    await validateProductShell({
      route: "/projects",
      primaryZone: "blank-state",
      projectContextRequired: true,
    });
    await validateProductShellResponsive("/projects");
    await validateManagementSafetyKeyboardNavigation();
    result.management_safety_keyboard_navigation = true;
    completeDetailedField("management_safety_keyboard_navigation");
    assert.equal(productShellRouteClassifications.length, 4);
    result.product_shell_route_classifications =
      productShellRouteClassifications;
    completeDetailedField("product_shell_route_classifications");
    assert.equal(productShellResponsiveResults.length, 8);
    result.product_shell_responsive_results =
      productShellResponsiveResults;
    completeDetailedField("product_shell_responsive_results");
    assert.equal(viewportResults.length, 30);
    result.viewport_results = viewportResults;
    completeDetailedField("viewport_results");
    assert.deepEqual(viewportWarnings, []);
    result.viewport_warnings = viewportWarnings;
    completeDetailedField("viewport_warnings");
    record("management_safety_reaches_visible_project_management_without_switching");
  });

  await runPhase("retired_route_safety", async () => {
    const before = databaseSnapshot(fixture.writable_database_path);
    const retiredRequests = [
      {
        name: "packet_handoff_api",
        path: "/api/vnext/operator/packet-handoff?packet_id=retired&packet_fingerprint=retired",
        method: "GET",
      },
      {
        name: "later_result_api",
        path: "/api/vnext/operator/later-result",
        method: "POST",
        body: { result_text: "retired result must not be admitted" },
      },
      {
        name: "result_report_api",
        path: "/api/intake/codex-result-report/records",
        method: "POST",
        body: { result_text: "retired report must not be admitted" },
      },
      {
        name: "handoff_capsule_api",
        path: "/api/augnes/read/handoff-capsule?scope=project%3Aaugnes",
        method: "GET",
      },
      {
        name: "launch_card_api",
        path: "/api/augnes/read/codex-launch-card?scope=project%3Aaugnes",
        method: "GET",
      },
      {
        name: "handoff_generate_api",
        path: "/api/handoffs/generate",
        method: "POST",
        body: { work_id: "AG-001" },
      },
      {
        name: "handoff_review_api",
        path: "/api/handoffs/review",
        method: "POST",
        body: { result_summary: "retired review must not be admitted" },
      },
      {
        name: "packet_export_api",
        path: "/api/workplane/handoff-packet-copy-exports",
        method: "POST",
        body: { packet_text: "retired packet must not be admitted" },
      },
      {
        name: "packet_handoff_page",
        path: "/workbench/semantic-review/packet-handoff/retired",
        method: "GET",
      },
    ];
    const retiredStatuses = await evaluateJson(`(async () => {
      const matrix = ${JSON.stringify(retiredRequests)};
      const result = {};
      for (const entry of matrix) {
        const response = await fetch(entry.path, {
          method: entry.method,
          redirect: 'manual',
          headers: entry.body ? { 'content-type': 'application/json' } : undefined,
          body: entry.body ? JSON.stringify(entry.body) : undefined
        });
        const text = await response.text();
        result[entry.name] = {
          status: response.status,
          redirected: response.status >= 300 && response.status < 400,
          private_material:
            text.includes(${JSON.stringify(manifest.rendered_state_inputs.proposal_review.proposal_id)}) ||
            text.includes(${JSON.stringify(manifest.rendered_state_inputs.proposal_review.proposal_fingerprint)}) ||
            text.includes(${JSON.stringify(path.dirname(fixture.writable_database_path))}) ||
            /(sha256:|task-context-packet:|episode-delta-proposal:|bootstrap token)/i.test(text)
        };
      }
      return result;
    })()`);
    const publicStatuses = {};
    for (const [name, entry] of Object.entries(retiredStatuses)) {
      assert.equal([404, 405].includes(entry.status), true, name);
      assert.equal(entry.redirected, false, name);
      assert.equal(entry.private_material, false, name);
      publicStatuses[name] = entry.status;
    }
    assert.deepEqual(databaseSnapshot(fixture.writable_database_path), before);
    result.retired_route_statuses = publicStatuses;
    completeDetailedField("retired_route_statuses");
    result.retired_routes_non_mutating = true;
    completeDetailedField("retired_routes_non_mutating");
    record("retired_native_host_transport_routes_return_non_mutating_404");
  }, {
    terminalRequestQuiet: false,
    quietProof: "all retired responses and bodies awaited",
  });

  await runPhase("project_experience_global_boundaries", async () => {
    await waitForRequestQuiet();
    const knownHarnessConsoleWarnings = consoleErrors.filter(
      expectedManagementSafetyHydrationWarning,
    );
    const unexpectedConsoleErrors = consoleErrors.filter(
      (entry) => !expectedConsoleError(entry),
    );
    const unexpectedFailedRequests = failedRequests.filter(
      (entry) => !expectedFailedRequest(entry),
    );
    assert.deepEqual(pageErrors, []);
    assert.equal(knownHarnessConsoleWarnings.length <= 1, true);
    assert.deepEqual(unexpectedConsoleErrors, []);
    assert.deepEqual(unexpectedFailedRequests, []);
    assert.deepEqual(externalRequests, []);
    assert.equal(
      serverLog.includes(onboardingFolder),
      false,
      "the declared local path must not enter ordinary runtime logs",
    );
    assert.equal(
      serverLog.includes(onboardingFolderB) ||
        serverLog.includes(onboardingFolderBRecovered),
      false,
      "recovery paths must not enter ordinary runtime logs",
    );
    detailedFieldCompletionOwner.assertExact();
    assert.deepEqual(
      new Set(semanticMarkers),
      new Set(detailedFieldContract.marker_ids),
    );
    assert.equal(
      requests.some((entry) => {
        const requestPath = entry.path ?? "";
        if (/automation-cycle|strategic-analysis|model-gateway/iu.test(requestPath)) {
          return true;
        }
        return (
          /host-round-trip/iu.test(requestPath) && entry.method !== "GET"
        );
      }),
      false,
    );
    const database = new Database(fixture.writable_database_path, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    } finally {
      database.close();
    }
    assert.deepEqual(
      semanticAuthorityCounts(fixture.writable_database_path),
      semanticAuthorityBaseline,
    );
    result.unexpected_external_request_count = externalRequests.length;
    result.unexpected_console_failure_count = unexpectedConsoleErrors.length;
    result.unexpected_page_failure_count = pageErrors.length;
    result.unexpected_request_failure_count = unexpectedFailedRequests.length;
    result.known_harness_console_warning_count =
      knownHarnessConsoleWarnings.length;
    result.credential_private_material_boundary =
      !/(vnext_bootstrap_v01\.|OPENAI_API_KEY|GITHUB_TOKEN|sk-|ghp_)/iu.test(
        serverLog,
      );
    if (REAL_PROVIDER_ACCEPTANCE) {
      assert.deepEqual(result.guide_brief_real_provider_acceptance, {
        deterministic_question_loopback_calls: 0,
        deterministic_question_provider_calls: 0,
        action_request_loopback_calls: 0,
        action_request_provider_calls: 0,
        action_request_unsupported: true,
        action_request_model_assisted_answer: false,
        korean_interpretation_loopback_calls: 1,
        korean_interpretation_provider_calls: 1,
        english_interpretation_loopback_calls: 1,
        english_interpretation_provider_calls: 1,
        provider_egress_started: 2,
        provider_egress_completed: 2,
        provider_unavailable_loopback_calls: 1,
        provider_unavailable_provider_calls: 0,
        deterministic_answer_ownership: true,
        provider_answer_prose_used: false,
        semantic_authority_changed: false,
        durable_database_changed: false,
        transcript_persisted: false,
      });
    }
    result.provider_or_external_network_call = REAL_PROVIDER_ACCEPTANCE;
    result.semantic_proposal_created = false;
    result.review_decision_created = false;
    result.transition_created = false;
    result.work_closure_created = false;
    result.native_host_execution_started = false;
  });
}

async function runPhase(phase, action, options = {}) {
  const terminalRequestQuiet = options.terminalRequestQuiet !== false;
  if (!terminalRequestQuiet) {
    assert.match(options.quietProof ?? "", /^[a-z0-9][a-z0-9 _-]{1,120}$/iu);
  }
  const phaseStartedAt = Date.now();
  currentPhase = phase;
  process.stdout.write(
    `[browser-e2e] phase_start scope=${VALIDATION_SCOPE} phase=${phase} expected_next=phase_completion\n`,
  );
  try {
    await action();
    if (terminalRequestQuiet) await waitForRequestQuiet();
    timing.duration("phase", phase, Date.now() - phaseStartedAt);
    process.stdout.write(
      `[browser-e2e] phase_result scope=${VALIDATION_SCOPE} phase=${phase} status=pass duration_ms=${Date.now() - phaseStartedAt}\n`,
    );
  } catch (error) {
    timing.duration("phase", phase, Date.now() - phaseStartedAt, "fail");
    process.stdout.write(
      `[browser-e2e] phase_result scope=${VALIDATION_SCOPE} phase=${phase} status=failed reason=${safeLifecycleErrorCode(error)}\n`,
    );
    throw error;
  }
}

function startRuntime(databasePath, manifest, projectId) {
  runtimeStartCount += 1;
  const finishRuntimeStartup = timing.start(
    "runtime_startup",
    `runtime startup ${String(runtimeStartCount).padStart(2, "0")}`,
  );
  const environment = runtimeEnvironment(databasePath, manifest, projectId);
  const publicDiagnosticCapture =
    createBrowserSupervisorPublicDiagnosticCapture();
  serverPublicDiagnosticCapture = publicDiagnosticCapture;
  serverProcess = spawn(
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
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  serverProcessRecord = registerOwnedChild(
    ownedBrowserProcesses,
    serverProcess,
    { label: `browser-runtime-${VALIDATION_SCOPE}-${runtimeStartCount}` },
  );
  serverClosePromise = new Promise((resolve) => {
    serverProcess.once("close", (code, signal) => {
      publicDiagnosticCapture.flush();
      resolve({ code, signal });
    });
  });
  serverProcess.stdout.on("data", (chunk) => {
    const output = chunk.toString("utf8");
    serverLog = `${serverLog}${output}`.slice(-128 * 1024);
    publicDiagnosticCapture.append(output);
  });
  serverProcess.stderr.on("data", (chunk) => {
    serverLog = `${serverLog}${chunk.toString("utf8")}`.slice(-128 * 1024);
  });
  serverProcess.once("spawn", () => finishRuntimeStartup());
}

function startChrome(executable) {
  const finishChromeStartup = timing.start(
    "chrome_startup",
    "Chrome and CDP startup",
  );
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
  chromeProcessRecord = registerOwnedChild(
    ownedBrowserProcesses,
    chromeProcess,
    { label: `browser-chrome-${VALIDATION_SCOPE}` },
  );
  chromeProcess.once("spawn", () => finishChromeStartup());
}

async function openCdpPage() {
  const versionUrl = `http://127.0.0.1:${debugPort}/json/version`;
  const started = Date.now();
  let webSocketUrl = null;
  while (Date.now() - started < DEFAULT_TIMEOUT_MS) {
    try {
      const response = await fetch(versionUrl);
      if (response.ok) {
        const body = await response.json();
        webSocketUrl = body.webSocketDebuggerUrl;
        if (webSocketUrl) break;
      }
    } catch {
      // Chrome is still starting on the loopback debug listener.
    }
    await delay(100);
  }
  assert(webSocketUrl, "chrome_debug_endpoint_unavailable");
  const browserClient = new CdpClient(webSocketUrl);
  await browserClient.open();
  const targets = await browserClient.send("Target.getTargets");
  const pageTarget = targets.targetInfos.find(
    (target) => target.type === "page",
  );
  assert(pageTarget, "chrome_page_target_missing");
  const attached = await browserClient.send("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  });
  const sessionId = attached.sessionId;
  const pageClient = {
    on(handler) {
      browserClient.on((payload) => {
        if (payload.sessionId === sessionId) handler(payload);
      });
    },
    async send(method, params = {}) {
      const id = browserClient.nextId;
      browserClient.nextId += 1;
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          browserClient.pending.delete(id);
          reject(new Error(`cdp_command_timeout:${method}`));
        }, DEFAULT_TIMEOUT_MS);
        browserClient.pending.set(id, { resolve, reject, timeout });
        browserClient.ws.send(
          JSON.stringify({ id, method, params, sessionId }),
        );
      });
    },
    async close() {
      await browserClient.close();
    },
  };
  cdp = pageClient;
  attachCdpObservers();
  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Network.enable"),
    ...(REAL_PROVIDER_ACCEPTANCE
      ? []
      : [
          cdp.send("Fetch.enable", {
            patterns: [
              {
                urlPattern: "*/api/augnes/guide-brief/interpretation",
                requestStage: "Request",
              },
            ],
          }),
        ]),
  ]);
}

function attachCdpObservers() {
  cdp.on((payload) => {
    const params = payload.params ?? {};
    if (payload.method === "Network.requestWillBeSent") {
      lastObserverActivityAt = Date.now();
      const classified = classifyUrl(params.request?.url);
      const request = {
        request_id: params.requestId,
        phase: currentPhase,
        path: classified.path,
        external: classified.external,
        method: params.request?.method ?? null,
      };
      requests.push(request);
      if (classified.external) externalRequests.push(request);
    } else if (payload.method === "Fetch.requestPaused") {
      const classified = classifyUrl(params.request?.url);
      if (
        classified.path === "/api/augnes/guide-brief/interpretation"
      ) {
        pausedGuideBriefInterpretationRequests.push({
          request_id: params.requestId,
          post_data: params.request?.postData ?? null,
        });
      } else {
        void cdp.send("Fetch.continueRequest", {
          requestId: params.requestId,
        });
      }
    } else if (payload.method === "Network.responseReceived") {
      lastObserverActivityAt = Date.now();
      const classified = classifyUrl(params.response?.url);
      responses.push({
        request_id: params.requestId,
        phase: currentPhase,
        path: classified.path,
        method:
          requests.find((entry) => entry.request_id === params.requestId)
            ?.method ?? null,
        status: params.response?.status ?? null,
        type: params.type ?? null,
      });
    } else if (payload.method === "Runtime.consoleAPICalled") {
      lastObserverActivityAt = Date.now();
      if (params.type === "error") {
        consoleErrors.push({
          phase: currentPhase,
          text: params.args
            ?.map((entry) => entry.value ?? entry.description ?? "")
            .join(" "),
          path: null,
        });
      }
    } else if (payload.method === "Runtime.exceptionThrown") {
      pageErrors.push({
        phase: currentPhase,
        text: params.exceptionDetails?.text ?? "page_exception",
      });
    } else if (payload.method === "Network.loadingFailed") {
      lastObserverActivityAt = Date.now();
      const request = requests.find(
        (entry) => entry.request_id === params.requestId,
      );
      failedRequests.push({
        phase: currentPhase,
        path: request?.path ?? null,
        error_text: params.errorText ?? "request_failed",
      });
    }
  });
}

async function restartRuntime(databasePath, manifest, projectId) {
  await navigate("about:blank");
  await cdp.send("Network.clearBrowserCookies");
  await terminateRuntime();
  startRuntime(databasePath, manifest, projectId);
  await waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS);
}

async function terminateRuntime() {
  if (!serverProcess) return;
  const shutdownStartedAt = Date.now();
  await terminateProcess(serverProcess, serverProcessRecord, 15_000);
  timing.duration(
    "runtime_shutdown",
    `runtime shutdown ${String(runtimeShutdownCount + 1).padStart(2, "0")}`,
    Date.now() - shutdownStartedAt,
  );
  runtimeShutdownCount += 1;
  serverProcess = null;
  serverProcessRecord = null;
  serverClosePromise = null;
  serverPublicDiagnosticCapture = null;
}

async function authenticateCurrentPage(databasePath, manifest, projectId) {
  const environment = runtimeEnvironment(databasePath, manifest, projectId);
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const database = openVNextLocalOperatorDatabaseV01(config);
  let bootstrapToken;
  try {
    bootstrapToken = issueVNextLocalOperatorBootstrapV01(database, {
      config,
    }).bootstrap_token;
  } finally {
    database.close();
  }
  assert.match(bootstrapToken, /^vnext_bootstrap_v01\./u);
  await waitForCondition(
    `document.querySelector('#vnext-operator-bootstrap-token') !== null`,
    "local review access input",
  );
  await setFormControlValue(
    "#vnext-operator-bootstrap-token",
    bootstrapToken,
  );
  const submitted = await evaluateBoolean(`(() => {
    const form = document.querySelector('#vnext-operator-bootstrap-token')?.closest('form');
    if (!(form instanceof HTMLFormElement)) return false;
    form.requestSubmit();
    return true;
  })()`);
  if (!submitted) throw new Error("operator_bootstrap_submit_missing");
  await waitForCondition(
    `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
    "shard-local authenticated presentation session",
  );
  assert.equal(
    await evaluateBoolean(
      `!document.documentElement.innerHTML.includes(${JSON.stringify(bootstrapToken)})`,
    ),
    true,
  );
  assert.equal(serverLog.includes(bootstrapToken), false);
  bootstrapToken = null;
}

async function proveRepositoryDecisionBrowserConfirmation(
  databasePath,
  manifest,
  projectId,
) {
  const browserCookies = await cdp.send("Network.getAllCookies");
  const decisionCookie = browserCookies.cookies.find(
    (cookie) =>
      cookie.name === "augnes_vnext_repository_decision_session_v01" &&
      cookie.path === "/api/vnext/projects" &&
      cookie.httpOnly === true &&
      cookie.sameSite === "Strict",
  );
  assert(decisionCookie, "repository_decision_browser_cookie_missing");
  assert.equal(
    JSON.stringify(runtimeEnvironment(databasePath, manifest, projectId))
      .includes(decisionCookie.value),
    false,
  );
  assert.equal(serverLog.includes(decisionCookie.value), false);
  assert.equal(
    await evaluateBoolean(
      `!document.documentElement.innerHTML.includes(${JSON.stringify(decisionCookie.value)})`,
    ),
    true,
  );
  const database = new Database(databasePath);
  let requestFingerprint;
  let nonceHashBefore;
  try {
    const request = createRepositoryExecutionDecisionRequestV01(database, {
      action: "revoke_attachment",
      workspace_id: manifest.workspace_id,
      project_id: projectId,
      expected_state: {
        attachment_id: "attachment:project-experience-browser-proof",
        expected_binding_fingerprint: `sha256:${"b".repeat(64)}`,
      },
    });
    requestFingerprint = request.request_fingerprint;
    nonceHashBefore = database.prepare(
      `SELECT decision_action_nonce_hash FROM vnext_local_operator_sessions
       WHERE workspace_id = ? AND project_id = ? AND operator_id = ?
         AND revoked_at IS NULL
       ORDER BY issued_at DESC LIMIT 1`,
    ).pluck().get(manifest.workspace_id, projectId, manifest.operator_id);
    assert.equal(typeof nonceHashBefore, "string");
  } finally {
    database.close();
  }

  await navigate(`${appOrigin}/#project-settings`);
  await waitForCondition(
    `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelector('[data-repository-execution-decision-confirm="true"]') !== null`,
    "repository decision Browser confirmation button",
  );
  assert.equal(
    await evaluateBoolean(
      `!document.cookie.includes('augnes_vnext_repository_decision_session_v01=')`,
    ),
    true,
    "the Browser decision capability must remain HttpOnly",
  );
  const projectRequestOffset = requests.length;
  await clickSelector('[data-repository-execution-decision-confirm="true"]');
  const firstProjectResponse = await waitForObservedResponse(
    "/api/vnext/projects",
    "POST",
    projectRequestOffset,
  );
  assert.equal(firstProjectResponse.status, 200);
  const secondProjectResponse = await waitForObservedResponse(
    "/api/vnext/projects",
    "POST",
    firstProjectResponse.request_offset + 1,
  );
  assert.equal(secondProjectResponse.status, 200);
  await waitForCondition(
    `document.querySelector('[data-repository-execution-decision-status="granted"]') !== null || document.querySelector('[data-project-message-tone="error"]') !== null`,
    "repository decision confirmation result",
  );
  const confirmationState = await evaluateString(`JSON.stringify({
    granted: document.querySelector('[data-repository-execution-decision-status="granted"]') !== null,
    message: document.querySelector('[data-project-message-tone]')?.textContent?.trim() ?? null
  })`);
  assert.deepEqual(
    JSON.parse(confirmationState),
    {
      granted: true,
      message: "Decision confirmed. Augnes can finish the exact requested repository change.",
    },
    JSON.stringify({
      project_requests: requests.filter(
        (entry) => entry.phase === currentPhase &&
          entry.path === "/api/vnext/projects",
      ),
      project_responses: responses.filter(
        (entry) => entry.phase === currentPhase &&
          entry.path === "/api/vnext/projects",
      ),
    }),
  );
  assert.equal(
    await evaluateBoolean(
      `document.querySelector('[data-repository-execution-decision-confirm="true"]') === null`,
    ),
    true,
  );

  const verified = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const decision = verified.prepare(
      `SELECT status, confirmation_source, grant_fingerprint
       FROM vnext_repository_execution_decision_requests
       WHERE request_fingerprint = ?`,
    ).get(requestFingerprint);
    assert.equal(decision?.status, "granted");
    assert.equal(decision?.confirmation_source, "browser_same_origin_button");
    assert.match(decision?.grant_fingerprint ?? "", /^sha256:[a-f0-9]{64}$/u);
    const nonceHashAfter = verified.prepare(
      `SELECT decision_action_nonce_hash FROM vnext_local_operator_sessions
       WHERE workspace_id = ? AND project_id = ? AND operator_id = ?
         AND revoked_at IS NULL
       ORDER BY issued_at DESC LIMIT 1`,
    ).pluck().get(manifest.workspace_id, projectId, manifest.operator_id);
    assert.equal(typeof nonceHashAfter, "string");
    assert.notEqual(nonceHashAfter, nonceHashBefore);
  } finally {
    verified.close();
  }
}

async function waitForObservedResponse(pathname, method, requestOffset) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    const requestOffsetFound = requests.findIndex(
      (entry, index) =>
        index >= requestOffset &&
        entry.path === pathname &&
        entry.method === method,
    );
    if (requestOffsetFound >= 0) {
      const request = requests[requestOffsetFound];
      const response = responses.find(
        (entry) => entry.request_id === request.request_id,
      );
      if (response) {
        return { ...response, request_offset: requestOffsetFound };
      }
    }
    await delay(100);
  }
  throw new Error(`observed_response_timeout:${publicToken(pathname)}`);
}

function runtimeEnvironment(databasePath, manifest, projectId) {
  const environment = {
    ...minimalProcessEnvironment(),
    HOME: disposableHome,
    USERPROFILE: disposableHome,
    TMPDIR: processTempRoot,
    TMP: processTempRoot,
    TEMP: processTempRoot,
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_RUNTIME_STATE_DIR: runtimeStateDirectory,
    AUGNES_DB_PATH: databasePath,
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: tempRoot,
    AUGNES_TEST_FOLDER_PICKER_SEQUENCE_PATH: folderPickerSequencePath,
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: manifest.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: projectId,
    AUGNES_VNEXT_OPERATOR_ID: manifest.operator_id,
  };
  if (REAL_PROVIDER_ACCEPTANCE) {
    environment.AUGNES_CANONICAL_TEST_NODE_IMPORT =
      providerEgressObserverImportPath;
    if (runtimeProviderCredentialEnabled) {
      environment.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    }
  }
  return environment;
}

function minimalProcessEnvironment() {
  return Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SHELL", "TERM"]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]]),
  );
}

function writeFolderPickerSequence(entries) {
  writeFileSync(
    folderPickerSequencePath,
    `${JSON.stringify({
      sequence_version: "augnes_canonical_folder_picker_sequence.v0.1",
      next_index: 0,
      entries,
    })}\n`,
    { encoding: "utf8", flag: "wx", mode: 0o600 },
  );
}

async function waitForFolderPickerSequenceIndex(expectedIndex) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    try {
      const sequence = JSON.parse(
        readFileSync(folderPickerSequencePath, "utf8"),
      );
      if (sequence.next_index === expectedIndex) return;
    } catch {
      // The server owns the bounded atomic claim while the file is absent.
    }
    await delay(100);
  }
  throw new Error(`folder_picker_sequence_claim_timeout:${expectedIndex}`);
}

async function navigate(url) {
  navigationCount += 1;
  const navigationStartedAt = Date.now();
  await cdp.send("Page.navigate", { url });
  await waitForCondition(
    `["interactive", "complete"].includes(document.readyState)`,
    `document readiness ${navigationCount}`,
  );
  timing.duration(
    "navigation",
    `navigation ${String(navigationCount).padStart(2, "0")}`,
    Date.now() - navigationStartedAt,
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
      `browser_evaluation_failed:${
        response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text ??
        "exception"
      }`,
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
  const conditionStartedAt = Date.now();
  while (Date.now() - conditionStartedAt < timeoutMs) {
    if (await evaluateBoolean(expression).catch(() => false)) {
      recordLongWait("wait_for_condition", label, conditionStartedAt);
      return;
    }
    await delay(100);
  }
  throw new Error(`condition_timeout:${publicToken(label)}`);
}

async function waitForRequestQuiet() {
  requestQuietCount += 1;
  const quietStartedAt = Date.now();
  while (Date.now() - quietStartedAt < DEFAULT_TIMEOUT_MS) {
    if (Date.now() - lastObserverActivityAt >= REQUEST_QUIET_MS) {
      timing.duration(
        "request_quiet",
        `request quiet ${String(requestQuietCount).padStart(2, "0")}`,
        Date.now() - quietStartedAt,
      );
      return;
    }
    await delay(100);
  }
  throw new Error("request_quiet_timeout");
}

async function waitForHttp(url, timeoutMs) {
  waitCount += 1;
  const httpStartedAt = Date.now();
  while (Date.now() - httpStartedAt < timeoutMs) {
    if (serverProcess && childHasExited(serverProcess)) {
      const closed = await Promise.race([
        serverClosePromise ?? Promise.resolve(null),
        delay(1_000).then(() => null),
      ]);
      result.supervisor_exit_diagnostic =
        serverPublicDiagnosticCapture?.diagnostic({
          supervisorExitCode: closed?.code ?? serverProcess.exitCode,
          supervisorSignal: closed?.signal ?? serverProcess.signalCode,
        }) ?? null;
      throw new Error(
        `runtime_exited_early:${result.supervisor_exit_diagnostic?.last_public_reason_code ?? "unknown"}`,
      );
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) {
        recordLongWait("wait_for_http", "loopback runtime", httpStartedAt);
        return response;
      }
    } catch {
      // The loopback runtime is still compiling.
    }
    await delay(200);
  }
  throw new Error("runtime_http_timeout");
}

async function clickSelector(selector, optional = false) {
  const clicked = await evaluateBoolean(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement) || element.matches(':disabled')) return false;
    element.click();
    return true;
  })()`);
  if (!optional) assert.equal(clicked, true, `click_failed:${selector}`);
  return clicked;
}

async function clickButtonByText(text, rootSelector = "body") {
  const clicked = await evaluateBoolean(`(() => {
    const root = document.querySelector(${JSON.stringify(rootSelector)});
    const button = Array.from(root?.querySelectorAll('button') ?? []).find(
      (candidate) => candidate.textContent?.trim() === ${JSON.stringify(text)}
    );
    if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
    button.click();
    return true;
  })()`);
  assert.equal(clicked, true, `button_missing:${text}`);
}

async function clickSelectorByMouse(selector) {
  const point = await evaluateJson(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement) || element.matches(':disabled')) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  assert(point, `click_target_missing:${selector}`);
  await dispatchMouseClick(point.x, point.y);
}

async function clickButtonByTextByMouse(text, rootSelector = "body") {
  const point = await evaluateJson(`(() => {
    const root = document.querySelector(${JSON.stringify(rootSelector)});
    const button = Array.from(root?.querySelectorAll('button') ?? []).find(
      (candidate) => candidate.textContent?.trim() === ${JSON.stringify(text)}
    );
    if (!(button instanceof HTMLButtonElement) || button.disabled) return null;
    const rect = button.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  assert(point, `button_missing:${text}`);
  await dispatchMouseClick(point.x, point.y);
}

async function setFormControlValue(selector, value) {
  const changed = await evaluateBoolean(`(() => {
    const control = document.querySelector(${JSON.stringify(selector)});
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return false;
    const prototype = control instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : control instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLSelectElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (!setter) return false;
    setter.call(control, ${JSON.stringify(value)});
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    return true;
  })()`);
  assert.equal(changed, true, `form_control_missing:${selector}`);
}

async function browserFetchJson(pathname, options = {}) {
  const value = await evaluateJson(`(async () => {
    ${options.prepareExpression ?? ""}
    let body = ${JSON.stringify(options.explicitBody ?? null)};
    if (${options.deriveActiveConflictBody === true}) {
      const active = window.__projectExperienceRecent?.find((entry) => entry.is_active);
      body = {
        ...body,
        expected_active_project_id: active?.active_project_id ?? null,
        expected_active_selection_revision: active?.active_selection_revision ?? null,
        expected_current_display_name: active?.project?.display_name ?? null
      };
    }
    const response = await fetch(${JSON.stringify(pathname)}, {
      method: ${JSON.stringify(options.method ?? "GET")},
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });
    return { status: response.status, body: await response.json() };
  })()`);
  return value;
}

async function submitGuideBriefUtteranceForPausedInterpretation(utterance) {
  const offset = pausedGuideBriefInterpretationRequests.length;
  await setFormControlValue(
    'input[name="guidebrief-question"]',
    utterance,
  );
  await clickButtonByText("Ask or act", '[data-guidebrief-conversation]');
  const started = Date.now();
  while (Date.now() - started < DEFAULT_TIMEOUT_MS) {
    if (pausedGuideBriefInterpretationRequests.length > offset) {
      const paused = pausedGuideBriefInterpretationRequests[offset];
      const body = JSON.parse(paused.post_data ?? "null");
      assert.equal(body.utterance, utterance);
      assert.equal(body.request_version, "guidebrief_interpretation_request.v0.1");
      assert.equal(Array.isArray(body.available_intents), true);
      assert.equal(body.available_intents.length > 0, true);
      assert.equal(
        await evaluateBoolean(
          `document.querySelector('[data-guidebrief-conversation] button[type="submit"]')?.disabled === true && document.querySelector('[data-guidebrief-conversation]')?.getAttribute('data-guidebrief-interpretation') === 'pending'`,
        ),
        true,
      );
      return paused;
    }
    await delay(25);
  }
  throw new Error("guidebrief_interpretation_request_timeout");
}

async function runRealProviderGuideBriefAcceptance(input) {
  const providerBefore = providerEgressObservations();
  assert.equal(latestProviderRuntimeStatus(providerBefore), "runtime_ready");
  const routeCallsBefore = guideBriefInterpretationRouteCount();

  await submitGuideBriefDeterministicUtterance("What is happening now?");
  const deterministicAnswer = await evaluateString(
    `document.querySelector('[data-guidebrief-conversation-answer] strong')?.textContent?.trim() ?? ''`,
  );
  assert.equal(deterministicAnswer.length > 0, true);
  assert.equal(guideBriefInterpretationRouteCount(), routeCallsBefore);
  assert.equal(providerEgressStartedCount(), providerStartedCount(providerBefore));

  const actionRequest =
    await submitGuideBriefActionRequestWithoutInterpretation(
      "Could you please show the next change?",
    );
  assert.deepEqual(actionRequest, {
    loopback_calls: 0,
    provider_calls: 0,
    unsupported: true,
    model_assisted_answer: false,
    interaction_outcome_created: false,
  });

  const korean = await submitGuideBriefRealProviderUtterance(
    "지금 무슨 상황인지 평범한 말로 설명해 줄 수 있나요?",
  );
  assert.equal(korean.answer, deterministicAnswer);
  assert.equal(korean.model_assisted, true);
  assert.equal(korean.route_calls, 1);
  assert.equal(
    providerEgressStartedCount(),
    providerStartedCount(providerBefore) + 1,
  );

  const english = await submitGuideBriefRealProviderUtterance(
    "Could you explain what is happening currently in ordinary terms?",
  );
  assert.equal(english.answer, deterministicAnswer);
  assert.equal(english.model_assisted, true);
  assert.equal(english.route_calls, 1);
  assert.equal(
    providerEgressStartedCount(),
    providerStartedCount(providerBefore) + 2,
  );
  assert.equal(
    providerEgressCompletedCount(),
    providerCompletedCount(providerBefore) + 2,
  );

  const publicText = await evaluateString(
    `document.querySelector('[data-guidebrief-conversation]')?.innerText ?? ''`,
  );
  assert.equal(/q_[a-f0-9]{32}/iu.test(publicText), false);
  assert.equal(
    ["OPENAI", "GPT-", "model_gateway", "candidate_token", "/Users/"]
      .some((marker) => publicText.includes(marker)),
    false,
  );

  const providerCallsBeforeUnavailable = providerEgressStartedCount();
  runtimeProviderCredentialEnabled = false;
  await restartRuntime(input.database_path, input.manifest, input.project_id);
  await navigate(`${appOrigin}${input.project_destination}`);
  await waitForCondition(
    `document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"][data-guidebrief-conversation-hydrated="true"]') !== null`,
    "GuideBrief after provider-unavailable restart",
  );
  assert.equal(
    latestProviderRuntimeStatus(providerEgressObservations()),
    "runtime_unavailable",
  );
  const routeOffset = guideBriefInterpretationRouteCount();
  await setFormControlValue(
    'input[name="guidebrief-question"]',
    "현재 작업의 위치를 다른 말로 알려줄 수 있나요?",
  );
  await clickButtonByText("Ask or act", '[data-guidebrief-conversation]');
  await waitForCondition(
    `document.querySelector('[data-guidebrief-interpretation-outcome="unavailable"]') !== null`,
    "real-provider unavailable deterministic fallback",
  );
  assert.equal(guideBriefInterpretationRouteCount(), routeOffset + 1);
  assert.equal(providerEgressStartedCount(), providerCallsBeforeUnavailable);
  await submitGuideBriefDeterministicUtterance("What is happening now?");
  assert.equal(
    await evaluateString(
      `document.querySelector('[data-guidebrief-conversation-answer] strong')?.textContent?.trim() ?? ''`,
    ),
    deterministicAnswer,
  );

  assert.deepEqual(databaseSnapshot(input.database_path), input.database_before);
  assert.deepEqual(
    semanticAuthorityCounts(input.database_path),
    input.semantic_before,
  );
  const providerAfter = providerEgressObservations();
  return {
    deterministic_question_loopback_calls: 0,
    deterministic_question_provider_calls: 0,
    action_request_loopback_calls: actionRequest.loopback_calls,
    action_request_provider_calls: actionRequest.provider_calls,
    action_request_unsupported: actionRequest.unsupported,
    action_request_model_assisted_answer:
      actionRequest.model_assisted_answer,
    korean_interpretation_loopback_calls: korean.route_calls,
    korean_interpretation_provider_calls: 1,
    english_interpretation_loopback_calls: english.route_calls,
    english_interpretation_provider_calls: 1,
    provider_egress_started:
      providerStartedCount(providerAfter) - providerStartedCount(providerBefore),
    provider_egress_completed:
      providerCompletedCount(providerAfter) -
      providerCompletedCount(providerBefore),
    provider_unavailable_loopback_calls: 1,
    provider_unavailable_provider_calls: 0,
    deterministic_answer_ownership: true,
    provider_answer_prose_used: false,
    semantic_authority_changed: false,
    durable_database_changed: false,
    transcript_persisted: false,
  };
}

async function submitGuideBriefRealProviderUtterance(utterance) {
  const routeOffset = guideBriefInterpretationRouteCount();
  const requestOffset = requests.length;
  const providerOffset = providerEgressStartedCount();
  await setFormControlValue(
    'input[name="guidebrief-question"]',
    utterance,
  );
  await clickButtonByText("Ask or act", '[data-guidebrief-conversation]');
  await waitForCondition(
    `document.querySelector('[data-guidebrief-conversation-answer][data-guidebrief-answer-model-assisted="true"]') !== null || document.querySelector('[data-guidebrief-interpretation-outcome]') !== null`,
    "real-provider GuideBrief interpretation result",
  );
  const outcome = await evaluateString(
    `document.querySelector('[data-guidebrief-interpretation-outcome]')?.getAttribute('data-guidebrief-interpretation-outcome') ?? ''`,
  );
  if (outcome) {
    const routeRequest = requests
      .slice(requestOffset)
      .find(
        (entry) =>
          entry.path === "/api/augnes/guide-brief/interpretation" &&
          entry.method === "POST",
      );
    const routeResponse = routeRequest
      ? responses.find((entry) => entry.request_id === routeRequest.request_id)
      : null;
    throw new Error(
      `real_provider_interpretation_${outcome}:loopback_${routeResponse?.status ?? "unknown"}:provider_starts_${providerEgressStartedCount() - providerOffset}`,
    );
  }
  return {
    answer: await evaluateString(
      `document.querySelector('[data-guidebrief-conversation-answer] strong')?.textContent?.trim() ?? ''`,
    ),
    model_assisted:
      (await evaluateString(
        `document.querySelector('[data-guidebrief-conversation-answer]')?.getAttribute('data-guidebrief-answer-model-assisted') ?? ''`,
      )) === "true",
    route_calls: guideBriefInterpretationRouteCount() - routeOffset,
  };
}

function guideBriefInterpretationRouteCount() {
  return requests.filter(
    (entry) =>
      entry.path === "/api/augnes/guide-brief/interpretation" &&
      entry.method === "POST",
  ).length;
}

function providerEgressObservations() {
  if (!existsSync(providerEgressObservationPath)) return [];
  const text = readFileSync(providerEgressObservationPath, "utf8").trim();
  if (!text) return [];
  return text.split("\n").map((line) => {
    const entry = JSON.parse(line);
    assert.deepEqual(Object.keys(entry).sort(), [
      "observation_version",
      "purpose",
      "response_status",
      "status",
    ]);
    assert.equal(
      entry.observation_version,
      "provider_egress_observation.v0.1",
    );
    assert.equal(entry.purpose, "guidebrief_interpretation");
    assert.equal(
      [
        "started",
        "completed",
        "cancelled",
        "failed",
        "runtime_ready",
        "runtime_unavailable",
      ].includes(entry.status),
      true,
    );
    return entry;
  });
}

function latestProviderRuntimeStatus(observations) {
  return observations
    .filter((entry) =>
      ["runtime_ready", "runtime_unavailable"].includes(entry.status),
    )
    .at(-1)?.status ?? null;
}

function providerStartedCount(observations) {
  return observations.filter((entry) => entry.status === "started").length;
}

function providerCompletedCount(observations) {
  return observations.filter((entry) => entry.status === "completed").length;
}

function providerEgressStartedCount() {
  return providerStartedCount(providerEgressObservations());
}

function providerEgressCompletedCount() {
  return providerCompletedCount(providerEgressObservations());
}

async function fulfillGuideBriefInterpretation(paused, status, intent = null) {
  await cdp.send("Fetch.fulfillRequest", {
    requestId: paused.request_id,
    responseCode: 200,
    responseHeaders: [
      { name: "content-type", value: "application/json" },
      { name: "cache-control", value: "no-store" },
      {
        name: "x-augnes-guidebrief-interpretation",
        value: "bounded-v0.1",
      },
    ],
    body: Buffer.from(
      JSON.stringify({
        result_version: "guidebrief_interpretation_result.v0.1",
        status,
        intent,
        model_assisted: status === "resolved",
        no_answer_prose_returned: true,
        durable_state_changed: false,
      }),
      "utf8",
    ).toString("base64"),
  });
}

async function submitGuideBriefDeterministicUtterance(utterance) {
  const pausedBefore = pausedGuideBriefInterpretationRequests.length;
  await setFormControlValue(
    'input[name="guidebrief-question"]',
    utterance,
  );
  await clickButtonByText("Ask or act", '[data-guidebrief-conversation]');
  await waitForCondition(
    `document.querySelector('[data-guidebrief-conversation-answer]') !== null || document.querySelector('[data-guidebrief-interaction-plan]') !== null`,
    "deterministic GuideBrief utterance result",
  );
  assert.equal(pausedGuideBriefInterpretationRequests.length, pausedBefore);
}

async function submitGuideBriefActionRequestWithoutInterpretation(utterance) {
  const routeBefore = guideBriefInterpretationRouteCount();
  const pausedBefore = pausedGuideBriefInterpretationRequests.length;
  const providerBefore = providerEgressStartedCount();
  await setFormControlValue(
    'input[name="guidebrief-question"]',
    utterance,
  );
  await clickButtonByText("Ask or act", '[data-guidebrief-conversation]');
  await waitForCondition(
    `document.querySelector('[data-guidebrief-interaction-plan="unsupported"] strong')?.textContent?.trim() === 'That request is outside the bounded current-work interaction family.'`,
    "polite action request remains deterministic unsupported",
  );
  await waitForRequestQuiet();
  const publicState = await evaluateJson(`(() => ({
    unsupported: document.querySelector('[data-guidebrief-interaction-plan="unsupported"]') !== null,
    model_assisted_answer: document.querySelector('[data-guidebrief-conversation-answer][data-guidebrief-answer-model-assisted="true"]') !== null,
    interaction_outcome_created: document.querySelector('[data-guidebrief-interaction-outcome]') !== null
  }))()`);
  assert.equal(guideBriefInterpretationRouteCount(), routeBefore);
  assert.equal(pausedGuideBriefInterpretationRequests.length, pausedBefore);
  assert.equal(providerEgressStartedCount(), providerBefore);
  return {
    loopback_calls: guideBriefInterpretationRouteCount() - routeBefore,
    provider_calls: providerEgressStartedCount() - providerBefore,
    ...publicState,
  };
}

async function readRecentProjectsInBrowser() {
  const response = await browserFetchJson("/api/vnext/projects");
  assert.equal(response.status, 200);
  return response.body;
}

async function openProjectInBrowser(projectId) {
  const recent = await readRecentProjectsInBrowser();
  const active = recent.recent_projects.find((entry) => entry.is_active);
  return await browserFetchJson("/api/vnext/projects", {
    method: "POST",
    explicitBody: {
      action: "open",
      project_id: projectId,
      expected_project_id: active?.active_project_id ?? null,
      expected_revision: active?.active_selection_revision ?? null,
    },
  });
}

async function validateFirstWorkComposerViewports() {
  for (const { width, height } of [
    { width: 1440, height: 1000 },
    { width: 1280, height: 900 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
  ]) {
    await setViewport(width, height);
    await waitForCondition(
      `document.querySelector('[data-first-work-composer="project_work_initialization.v0.1"]') !== null && window.innerWidth === ${width}`,
      "first-work composer responsive surface",
    );
    const metrics = await evaluateJson(`(() => {
      const composer = document.querySelector('[data-first-work-composer]');
      const form = composer?.querySelector('form');
      const controls = Array.from(form?.querySelectorAll('textarea, button') ?? []);
      const visible = (element) => {
        const rect = element?.getBoundingClientRect();
        return Boolean(rect && rect.width > 0 && rect.height > 0);
      };
      const intersections = controls.flatMap((control, index) =>
        controls.slice(index + 1).filter((candidate) => {
          const left = control.getBoundingClientRect();
          const right = candidate.getBoundingClientRect();
          return Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1 &&
            Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1;
        })
      ).length;
      const text = composer?.innerText ?? '';
      return {
        surface: 'first_work_composer',
        width: window.innerWidth,
        height: window.innerHeight,
        document_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        composer_overflow: (composer?.scrollWidth ?? 0) > (composer?.clientWidth ?? 0) + 1,
        composer_inside_viewport: (() => {
          const rect = composer?.getBoundingClientRect();
          return Boolean(rect && rect.left >= -1 && rect.right <= window.innerWidth + 1);
        })(),
        controls_visible: controls.length === 4 && controls.every(visible),
        controls_minimum_size: window.innerWidth > 900 || controls.every((control) => {
          const rect = control.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        }),
        collision_count: intersections,
        primary_action_count: composer?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        navigation_link_count: document.querySelectorAll('nav[aria-label="Primary navigation"] > a').length,
        labels_exact: Array.from(form?.querySelectorAll('label') ?? []).map((label) => label.textContent?.trim()).join('|') === 'Goal|Success criteria|Out of scope',
        protocol_copy_absent: !/(TaskContextPacket|RunReceipt|packet fingerprint|session id|operator nonce|first_work_definition)/i.test(text),
        visible_development_overlay_absent: Array.from(document.querySelectorAll('nextjs-portal')).every((portal) => {
          const rect = portal.getBoundingClientRect();
          return rect.width === 0 || rect.height === 0;
        })
      };
    })()`);
    assert.deepEqual(metrics, {
      surface: "first_work_composer",
      width,
      height,
      document_overflow: false,
      composer_overflow: false,
      composer_inside_viewport: true,
      controls_visible: true,
      controls_minimum_size: true,
      collision_count: 0,
      primary_action_count: 1,
      navigation_link_count: 2,
      labels_exact: true,
      protocol_copy_absent: true,
      visible_development_overlay_absent: true,
    });
    viewportResults.push(metrics);
  }
  await setViewport(1440, 1000);
}

async function validateDeclaredPathReviewViewports() {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 1280, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await setViewport(width, height);
    await waitForCondition(
      `document.querySelector('.project-inspection') !== null && window.innerWidth === ${width}`,
      "declared path responsive review",
    );
    const metrics = await evaluateJson(`(() => {
      const management = document.querySelector('#project-management');
      const review = management?.querySelector('.project-inspection');
      const pathValue = review?.querySelector('.project-inspection-path');
      const controls = Array.from(review?.querySelectorAll('button, input') ?? []);
      const text = review?.textContent ?? '';
      const inside = (element) => {
        const rect = element?.getBoundingClientRect();
        return Boolean(rect && rect.left >= -1 && rect.right <= window.innerWidth + 1);
      };
      return {
        document_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        management_overflow: (management?.scrollWidth ?? 0) > (management?.clientWidth ?? 0) + 1,
        review_inside_viewport: inside(review),
        path_inside_review: Boolean(pathValue) && (pathValue.scrollWidth ?? 0) <= (review?.scrollWidth ?? 0),
        controls_minimum_size: controls.every((control) => {
          const rect = control.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        }),
        primary_action_count: review?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        long_path_visible: text.includes(${JSON.stringify(onboardingFolder)}),
        public_copy_only: !/(nonce|fingerprint|physical identity|database|CAS|token)/i.test(text),
      };
    })()`);
    assert.deepEqual(metrics, {
      document_overflow: false,
      management_overflow: false,
      review_inside_viewport: true,
      path_inside_review: true,
      controls_minimum_size: true,
      primary_action_count: 1,
      long_path_visible: true,
      public_copy_only: true,
    });
  }
  await setViewport(1440, 1000);
}

async function validateProjectRecoveryViewports() {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 1280, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await setViewport(width, height);
    await waitForCondition(
      `document.querySelector('.project-recovery-review') !== null && window.innerWidth === ${width}`,
      "project recovery responsive review",
    );
    const metrics = await evaluateJson(`(() => {
      const management = document.querySelector('#project-recovery');
      const review = management?.querySelector('.project-recovery-review');
      const paths = Array.from(review?.querySelectorAll('.project-inspection-path') ?? []);
      const controls = Array.from(review?.querySelectorAll('button, input') ?? []);
      const text = review?.textContent ?? '';
      const rect = review?.getBoundingClientRect();
      return {
        surface: 'project_recovery_review',
        width: window.innerWidth,
        height: window.innerHeight,
        document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        management_horizontal_overflow: (management?.scrollWidth ?? 0) > (management?.clientWidth ?? 0) + 1,
        inside_viewport: Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        bounded_paths: paths.length === 2 && paths.every((entry) => (entry.scrollWidth ?? 0) <= (review?.scrollWidth ?? 0)),
        controls_minimum_size: controls.every((control) => {
          const controlRect = control.getBoundingClientRect();
          return controlRect.width >= 44 && controlRect.height >= 44;
        }),
        primary_action_count: review?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        exact_paths_visible: text.includes(${JSON.stringify(onboardingFolderB)}) && text.includes(${JSON.stringify(onboardingFolderBRecovered)}),
        public_copy_only: !/(candidate purpose|fingerprint|physical id|node scope|CAS|nonce|credential|database)/i.test(text),
      };
    })()`);
    assert.deepEqual(metrics, {
      surface: "project_recovery_review",
      width,
      height,
      document_horizontal_overflow: false,
      management_horizontal_overflow: false,
      inside_viewport: true,
      bounded_paths: true,
      controls_minimum_size: true,
      primary_action_count: 1,
      exact_paths_visible: true,
      public_copy_only: true,
    });
    viewportResults.push(metrics);
  }
  await setViewport(1440, 1000);
}

async function validateProjectHomeViewports(state) {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 1280, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await setViewport(width, height);
    const metrics = await responsiveMetrics(
      `project_home_${state}`,
      '[data-blank-state="v0.1"]',
      true,
    );
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.surface_horizontal_overflow, false);
    assert.equal(metrics.inside_viewport, true);
    assert.equal(metrics.primary_navigation_count, 2);
    assert.equal(metrics.minimum_control_size, true);
    viewportResults.push(metrics);
  }
  await setViewport(1440, 1000);
}

async function validateDelegatedWorkViewports() {
  for (const width of [390, 430]) {
    await setViewport(width, 1000);
    await waitForCondition(
      `document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]') !== null && window.innerWidth === ${width}`,
      "delegated work responsive surface",
    );
    const metrics = await evaluateJson(`(() => {
      const panel = document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]');
      const heading = panel?.querySelector('h2');
      const primary = panel?.querySelector('[data-ai-workplane-primary-action]');
      const navigation = document.querySelector('nav[aria-label="Primary navigation"]');
      const visible = (element) => {
        const rect = element?.getBoundingClientRect();
        return Boolean(rect && rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight);
      };
      const primaryRect = primary?.getBoundingClientRect();
      return {
        surface: 'delegated_work',
        width: window.innerWidth,
        height: window.innerHeight,
        document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        panel_horizontal_overflow: (panel?.scrollWidth ?? 0) > (panel?.clientWidth ?? 0) + 1,
        heading_visible: visible(heading),
        primary_visible: visible(primary),
        primary_count: panel?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? 0,
        semantic_primary_count: panel?.querySelectorAll('[data-augnes-primary-action]').length ?? 0,
        primary_within_first_scroll: Boolean(primaryRect) && primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2,
        primary_touch_target: Boolean(primaryRect) && primaryRect.height >= 40,
        independent_surface_count: panel?.querySelectorAll('[data-augnes-independent-surface]').length ?? 0,
        state_badge_count: panel?.closest('[data-ai-workplane-shell]')?.querySelectorAll('[data-augnes-state-badge]').length ?? 0,
        navigation_link_count: navigation?.querySelectorAll(':scope > a').length ?? 0,
        timeline_semantic: panel?.querySelector('ol[aria-label="Delegated Codex work progress"]') !== null
      };
    })()`);
    assert.deepEqual(metrics, {
      surface: "delegated_work",
      width,
      height: 1000,
      document_horizontal_overflow: false,
      panel_horizontal_overflow: false,
      heading_visible: true,
      primary_visible: true,
      primary_count: 1,
      semantic_primary_count: 1,
      primary_within_first_scroll: true,
      primary_touch_target: true,
      independent_surface_count: 0,
      state_badge_count: 5,
      navigation_link_count: 2,
      timeline_semantic: true,
    });
    viewportResults.push(metrics);
  }
  await setViewport(1440, 1000);
}

async function validateResultViewports() {
  for (const width of [390, 430, 768, 1440]) {
    await setViewport(width, 1000);
    await waitForCondition(
      `document.querySelector('[data-run-result-review="v0.1"]') !== null && window.innerWidth === ${width}`,
      "run result responsive surface",
    );
    const metrics = await evaluateJson(`(() => {
      const review = document.querySelector('[data-run-result-review="v0.1"]');
      const shell = review?.querySelector('[data-ai-workplane-shell="v0.1"]');
      const heading = shell?.querySelector('h1');
      const primaryAction = review?.querySelector('[data-ai-workplane-primary-action]');
      const rect = review?.getBoundingClientRect();
      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const elementRect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && elementRect.width > 0 && elementRect.height > 0;
      };
      const primaryRect = primaryAction?.getBoundingClientRect();
      const raw = Array.from(review?.querySelectorAll('[data-augnes-visual-priority="raw-record"]') ?? []).find(visible);
      return {
        surface: 'workbench_run_result',
        width: window.innerWidth,
        height: window.innerHeight,
        document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        surface_horizontal_overflow: (review?.scrollWidth ?? 0) > (review?.clientWidth ?? 0) + 1,
        inside_viewport: Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        heading_visible: visible(heading),
        primary_action_visible: visible(primaryAction),
        primary_action_count: review?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        semantic_primary_action_count: review?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        primary_action_within_first_scroll: Boolean(primaryRect) && primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2,
        primary_action_touch_target: Boolean(primaryRect) && primaryRect.height >= 40,
        independent_surface_count: review?.querySelectorAll('[data-augnes-independent-surface]').length ?? -1,
        state_badge_count: review?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        raw_record_after_primary: !raw || !primaryRect || raw.getBoundingClientRect().top >= primaryRect.top,
        primary_navigation_visible: Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] a')).filter(visible).length === 2
      };
    })()`);
    viewportResults.push(metrics);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.surface_horizontal_overflow, false);
    assert.equal(metrics.inside_viewport, true);
    assert.equal(metrics.heading_visible, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_visible, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.semantic_primary_action_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_within_first_scroll, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_touch_target, true, JSON.stringify(metrics));
    assert.equal(metrics.independent_surface_count <= 1, true, JSON.stringify(metrics));
    assert.equal(metrics.state_badge_count <= 1, true, JSON.stringify(metrics));
    assert.equal(metrics.raw_record_after_primary, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_navigation_visible, true, JSON.stringify(metrics));
  }
}

async function validateProposalViewports() {
  for (const width of [390, 430, 768, 1440]) {
    await setViewport(width, 1000);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null && window.innerWidth === ${width}`,
      "proposal review responsive surface",
    );
    const metrics = await evaluateJson(`(() => {
      const review = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
      const heading = shell?.querySelector('h1');
      const actionOwner = review?.getAttribute('data-selected-work-primary-action-owner') ?? 'none';
      const primaryActionRequired = ['decision', 'transition', 'candidate_selection'].includes(actionOwner);
      const primaryAction = review?.querySelector('[data-ai-workplane-primary-action]');
      const rect = review?.getBoundingClientRect();
      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const elementRect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && elementRect.width > 0 && elementRect.height > 0;
      };
      const primaryRect = primaryAction?.getBoundingClientRect();
      const raw = Array.from(review?.querySelectorAll('[data-augnes-visual-priority="raw-record"]') ?? []).find(visible);
      return {
        surface: 'proposal_review',
        width: window.innerWidth,
        height: window.innerHeight,
        document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        surface_horizontal_overflow: (review?.scrollWidth ?? 0) > (review?.clientWidth ?? 0) + 1,
        inside_viewport: Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        heading_visible: visible(heading),
        action_owner: actionOwner,
        primary_action_required: primaryActionRequired,
        primary_action_visible: !primaryActionRequired || visible(primaryAction),
        primary_action_count: review?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        primary_action_touch_target: !primaryActionRequired || (Boolean(primaryRect) && primaryRect.height >= 40),
        independent_surface_count: review?.querySelectorAll('[data-augnes-independent-surface]').length ?? -1,
        state_badge_count: review?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        raw_record_after_primary: !raw || !primaryRect || raw.getBoundingClientRect().top >= primaryRect.top,
        primary_navigation_visible: Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] a')).filter(visible).length === 2
      };
    })()`);
    viewportResults.push(metrics);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.surface_horizontal_overflow, false);
    assert.equal(metrics.inside_viewport, true);
    assert.equal(metrics.heading_visible, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_required, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_visible, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_touch_target, true, JSON.stringify(metrics));
    assert.equal(metrics.independent_surface_count <= 1, true, JSON.stringify(metrics));
    assert.equal(metrics.state_badge_count <= 1, true, JSON.stringify(metrics));
    assert.equal(metrics.raw_record_after_primary, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_navigation_visible, true, JSON.stringify(metrics));
  }
}

async function validateInspectorViewports() {
  for (const width of [390, 430, 768, 1440]) {
    await setViewport(width, 1000);
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"]') !== null && window.innerWidth === ${width}`,
      "shared Inspector responsive surface",
    );
    const metrics = await evaluateJson(`(() => {
      const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
      const rect = inspector?.getBoundingClientRect();
      const returnRect = inspector?.querySelector('[data-contextual-inspector-return]')?.getBoundingClientRect();
      const headingRect = inspector?.querySelector('[data-contextual-inspector-heading]')?.getBoundingClientRect();
      const statusRect = inspector?.querySelector('[data-contextual-inspector-status-block]')?.getBoundingClientRect();
      const visible = (candidate) => Boolean(candidate) && candidate.width > 0 && candidate.height > 0 && candidate.left >= -1 && candidate.right <= window.innerWidth + 1;
      return {
        surface: 'shared_project_inspector',
        width: window.innerWidth,
        height: window.innerHeight,
        document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        surface_horizontal_overflow: (inspector?.scrollWidth ?? 0) > (inspector?.clientWidth ?? 0) + 1,
        inside_viewport: Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        return_link_visible: visible(returnRect),
        heading_visible: visible(headingRect),
        status_visible: visible(statusRect),
        semantic_surface_role: inspector?.getAttribute('data-augnes-surface-role') ?? null,
        semantic_primary_count: inspector?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        state_badge_count: inspector?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        raw_record_present: inspector?.querySelector('[data-augnes-raw-record="true"]') !== null
      };
    })()`);
    viewportResults.push(metrics);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.surface_horizontal_overflow, false);
    assert.equal(metrics.inside_viewport, true);
    assert.equal(metrics.return_link_visible, true);
    assert.equal(metrics.heading_visible, true);
    assert.equal(metrics.status_visible, true);
    assert.equal(metrics.semantic_surface_role, "inspector");
    assert.equal(metrics.semantic_primary_count, 0);
    assert.equal(metrics.state_badge_count, 0);
    assert.equal(metrics.raw_record_present, true);
  }
}

async function responsiveMetrics(surface, selector, primaryActionExpected) {
  await waitForCondition(
    `document.querySelector(${JSON.stringify(selector)}) !== null`,
    `${surface} responsive surface`,
  );
  return await evaluateJson(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    const rect = root?.getBoundingClientRect();
    const controls = Array.from(root?.querySelectorAll('a, button, input, textarea, select, summary') ?? []).filter((control) => {
      const bounds = control.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    const primary = root?.querySelector('[data-augnes-primary-action], [data-ai-workplane-primary-action], [data-blank-state-primary-action]');
    return {
      surface: ${JSON.stringify(surface)},
      width: window.innerWidth,
      height: window.innerHeight,
      document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      surface_horizontal_overflow: (root?.scrollWidth ?? 0) > (root?.clientWidth ?? 0) + 1,
      inside_viewport: Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
      primary_navigation_count: document.querySelectorAll('nav[aria-label="Primary navigation"] > a').length,
      primary_action_count: root?.querySelectorAll('[data-augnes-primary-action], [data-ai-workplane-primary-action], [data-blank-state-primary-action]').length ?? -1,
      primary_action_requirement_met: ${primaryActionExpected} ? Boolean(primary) : true,
      minimum_control_size: window.innerWidth > 900 || controls.every((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.width >= 40 && bounds.height >= 40;
      })
    };
  })()`);
}

async function validateProductShell({ route, primaryZone, projectContextRequired }) {
  await waitForCondition(
    `Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] > a')).filter((link) => { const rect = link.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }).length === 2`,
    `two visible primary destinations for ${route}`,
  );
  await waitForCondition(
    `Array.from(document.querySelectorAll('.product-shell')).some((candidate) => candidate.getAttribute('data-primary-product-zone') === ${JSON.stringify(primaryZone)} && candidate.getAttribute('data-product-utility-context') === 'none' && ${projectContextRequired ? "['Current project', 'Viewed project'].includes(candidate.querySelector('[data-project-context-label]')?.getAttribute('data-project-context-label'))" : "true"})`,
    `classified ProductShell for ${route}`,
  );
  const shell = await evaluateJson(`(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const roots = Array.from(document.querySelectorAll('.product-shell'));
    const root = roots.find((candidate) =>
      candidate.getAttribute('data-primary-product-zone') === ${JSON.stringify(primaryZone)} &&
      candidate.getAttribute('data-product-utility-context') === 'none' &&
      ${projectContextRequired ? "candidate.querySelector('[data-project-context-label]') !== null" : "true"}
    ) ?? null;
    const primary = root?.querySelector('nav[aria-label="Primary navigation"]');
    const primaryLinks = Array.from(primary?.querySelectorAll(':scope > a') ?? []);
    return {
      route: ${JSON.stringify(route)},
      primary_zone: root?.getAttribute('data-primary-product-zone'),
      utility_context: root?.getAttribute('data-product-utility-context'),
      brand_href: root?.querySelector('.product-brand')?.getAttribute('href') ?? null,
      primary_label: primary?.getAttribute('aria-label') ?? null,
      primary_links: primaryLinks.map((link) => ({
        label: link.querySelector('strong')?.textContent?.trim() ?? '',
        href: link.getAttribute('href'),
        current: link.getAttribute('aria-current')
      })),
      project_tools_count: root?.querySelectorAll('details.product-project-tools, nav[aria-label="Project tools"]').length ?? -1,
      visible_primary_link_count: Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] > a')).filter(visible).length,
      global_utility_link_count: Array.from(root?.querySelectorAll('header a') ?? []).filter((link) => ['/projects', '/portability', '/recovery'].includes(link.getAttribute('href') ?? '')).length,
      project_context_label: root?.querySelector('[data-project-context-label]')?.getAttribute('data-project-context-label') ?? null
    };
  })()`);
  assert.equal(shell.primary_zone, primaryZone);
  assert.equal(shell.utility_context, "none");
  assert.equal(shell.brand_href, "/");
  assert.equal(shell.primary_label, "Primary navigation");
  assert.deepEqual(shell.primary_links, [
    {
      label: "Continuities",
      href: "/",
      current: primaryZone === "blank-state" ? "page" : null,
    },
    {
      label: "AI Workplane",
      href: "/workbench/semantic-review",
      current: primaryZone === "ai-workplane" ? "page" : null,
    },
  ]);
  assert.equal(shell.visible_primary_link_count, 2);
  assert.equal(shell.project_tools_count, 0);
  assert.equal(shell.global_utility_link_count, 0);
  if (projectContextRequired) {
    assert.equal(
      ["Current project", "Viewed project"].includes(
        shell.project_context_label,
      ),
      true,
    );
  }
  productShellRouteClassifications.push(shell);
}

async function validateProductShellResponsive(route) {
  for (const width of [390, 430]) {
    await setViewport(width, 1000);
    const metrics = await evaluateJson(`(() => {
      const links = Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] > a'));
      return {
        route: ${JSON.stringify(route)},
        width: window.innerWidth,
        document_horizontal_overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        primary_link_count: links.length,
        primary_links_visible: links.every((link) => {
          const rect = link.getBoundingClientRect();
          return rect.width > 0 && rect.height >= 40 && rect.left >= -1 && rect.right <= window.innerWidth + 1;
        }),
        project_tools_count: document.querySelectorAll('details.product-project-tools, nav[aria-label="Project tools"]').length,
        primary_labels: links.map((link) => link.querySelector('strong')?.textContent?.trim())
      };
    })()`);
    assert.deepEqual(metrics, {
      route,
      width,
      document_horizontal_overflow: false,
      primary_link_count: 2,
      primary_links_visible: true,
      project_tools_count: 0,
      primary_labels: ["Continuities", "AI Workplane"],
    });
    productShellResponsiveResults.push(metrics);
  }
  await setViewport(1440, 1000);
}

async function validateManagementSafetyKeyboardNavigation() {
  await waitForRequestQuiet();
  const activeProjectName = await evaluateString(
    "document.querySelector('.blank-state-project-context strong')?.textContent?.trim() ?? ''",
  );
  assert.equal(
    await evaluateBoolean(`(() => {
      const summary = document.querySelector('details[data-management-safety] > summary');
      if (!(summary instanceof HTMLElement)) return false;
      summary.focus();
      return document.activeElement === summary;
    })()`),
    true,
  );
  await dispatchKeyboardKey(" ", "Space", 32);
  await waitForCondition(
    `document.querySelector('details[data-management-safety]')?.open === true`,
    "management safety disclosure",
  );
  await dispatchKeyboardKey("Tab", "Tab", 9);
  assert.equal(
    await evaluateString("document.activeElement?.getAttribute('href') ?? ''"),
    "/projects#project-management",
  );
  assert.equal(
    await evaluateBoolean(`(() => {
      const details = document.querySelector('details[data-management-safety]');
      const link = document.activeElement;
      if (!(details instanceof HTMLDetailsElement) || !(link instanceof HTMLAnchorElement) || !details.open) {
        return false;
      }
      link.addEventListener('click', () => {
        details.open = false;
        document.documentElement.dataset.managementKeyboardClickObserved = 'true';
      }, { once: true });
      return true;
    })()`),
    true,
  );
  await dispatchKeyboardKey("Enter", "Enter", 13);
  await waitForCondition(
    `location.pathname === '/projects' && location.hash === '#project-management'`,
    "keyboard project management destination",
  );
  await waitForCondition(
    `document.querySelector('#project-management') !== null && document.querySelector('#project-management')?.getClientRects().length > 0`,
    "visible project management section",
  );
  assert.equal(
    await evaluateString(
      "document.querySelector('.blank-state-project-context strong')?.textContent?.trim() ?? ''",
    ),
    activeProjectName,
  );
  assert.equal(
    await evaluateBoolean(
      `document.querySelector('#project-management')?.closest('details:not([open])') === null`,
    ),
    true,
  );
  assert.equal(
    await evaluateBoolean(
      `document.documentElement.dataset.managementKeyboardClickObserved === 'true' && document.querySelector('details[data-management-safety]')?.open === false`,
    ),
    true,
  );
}

async function setViewport(width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluateBoolean(
    `(() => { window.scrollTo(0, 0); return window.scrollY === 0; })()`,
  );
}

async function dispatchMouseClick(x, y) {
  try {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
  } catch (error) {
    if (!/Inspected target navigated or closed/u.test(String(error?.message))) {
      throw error;
    }
  }
}

async function dispatchKeyboardKey(key, code, keyCode) {
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
  });
}

function databaseSnapshot(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const tables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((entry) => entry.name);
    const rows = Object.fromEntries(
      tables.map((table) => {
        const serialized = database
          .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
          .all()
          .map((entry) => JSON.stringify(entry))
          .sort();
        return [
          table,
          {
            count: serialized.length,
            row_hash: createHash("sha256")
              .update(JSON.stringify(serialized))
              .digest("hex"),
          },
        ];
      }),
    );
    return {
      integrity_check: database.pragma("integrity_check", { simple: true }),
      table_row_hash: createHash("sha256")
        .update(JSON.stringify(rows))
        .digest("hex"),
      rows,
    };
  } finally {
    database.close();
  }
}

function projectRecoveryDatabaseState(databasePath, projectId) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const project = database.prepare(
      "SELECT * FROM vnext_project_identities WHERE project_id = ?",
    ).get(projectId);
    const root = database.prepare(
      "SELECT * FROM vnext_project_root_bindings WHERE project_id = ?",
    ).get(projectId);
    assert(project, "recovery_project_identity_missing");
    assert(root, "recovery_project_root_missing");
    return {
      project_count: database.prepare(
        "SELECT COUNT(*) AS count FROM vnext_project_identities",
      ).get().count,
      recent_count: database.prepare(
        "SELECT COUNT(*) AS count FROM vnext_recent_projects",
      ).get().count,
      project,
      root,
      baselines: database.prepare(
        `SELECT * FROM vnext_physical_root_baselines
         WHERE project_id = ? ORDER BY node_scope_fingerprint`,
      ).all(projectId),
      attachments: database.prepare(
        `SELECT attachment_id, lifecycle, consumed_run_id
         FROM vnext_repository_execution_attachments
         WHERE project_id = ? ORDER BY attachment_id`,
      ).all(projectId),
      active: database.prepare(
        "SELECT * FROM vnext_active_project_selections",
      ).all(),
      decisions: database.prepare(
        `SELECT action, status, expected_state_fingerprint
         FROM vnext_repository_execution_decision_requests
         WHERE project_id = ? ORDER BY requested_at, request_fingerprint`,
      ).all(projectId),
    };
  } finally {
    database.close();
  }
}

function semanticAuthorityCounts(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const counts = Object.fromEntries(
      [
        "episode_delta_proposal",
        "review_decision",
        "state_transition_receipt",
      ].map((recordKind) => [
        recordKind,
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = ?",
          )
          .get(recordKind).count,
      ]),
    );
    const workClosures = database
      .prepare(
        "SELECT COUNT(*) AS count FROM work_events WHERE lower(event_type) LIKE '%clos%'",
      )
      .get().count;
    return { ...counts, work_closures: workClosures };
  } finally {
    database.close();
  }
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function documentStatusSince(startIndex, pathname) {
  return (
    responses
      .slice(startIndex)
      .find((entry) => entry.path === pathname && entry.type === "Document")
      ?.status ?? null
  );
}

function expectedConsoleError(entry) {
  if (expectedManagementSafetyHydrationWarning(entry)) return true;
  const expectedStatus = [
    [401, "Unauthorized"],
    [404, "Not Found"],
    [405, "Method Not Allowed"],
    [409, "Conflict"],
  ].find(([status, label]) =>
    entry.text.includes(`${status} (${label})`),
  )?.[0];
  if (!Number.isInteger(expectedStatus)) return false;
  return responses.some(
    (response) =>
      response.phase === entry.phase &&
      response.status === expectedStatus &&
      expectedStatusResponseIdentity(response),
  );
}

function expectedStatusResponseIdentity(response) {
  if (
    response.status === 409 &&
    ["project_onboarding_and_naming", "project_home_lifecycle_presentation"].includes(
      response.phase,
    )
  ) {
    return response.path === "/api/vnext/projects" && response.method === "POST";
  }
  if (
    response.status === 401 &&
    ["project_shell_and_locked_entry", "rendered_state_responsive_matrix"].includes(
      response.phase,
    )
  ) {
    return [
      "/api/vnext/operator/session",
      "/api/vnext/operator/host-round-trip",
      "/api/vnext/operator/inspector",
      "/api/vnext/operator/semantic-review",
    ].includes(response.path);
  }
  if (
    [404, 405].includes(response.status) &&
    response.phase === "retired_route_safety"
  ) {
    return [
      "/api/vnext/operator/packet-handoff",
      "/api/vnext/operator/later-result",
      "/api/intake/codex-result-report/records",
      "/api/augnes/read/handoff-capsule",
      "/api/augnes/read/codex-launch-card",
      "/api/handoffs/generate",
      "/api/handoffs/review",
      "/api/workplane/handoff-packet-copy-exports",
      "/workbench/semantic-review/packet-handoff/retired",
    ].includes(response.path);
  }
  return false;
}

function expectedFailedRequest(entry) {
  if (
    [
      "project_onboarding_and_naming",
      "project_home_lifecycle_presentation",
    ].includes(entry.phase) &&
    entry.path === "/api/vnext/projects" &&
    entry.error_text === "net::ERR_ABORTED"
  ) {
    return true;
  }
  if (
    entry.path === "/_next/webpack-hmr" &&
    ["net::ERR_ABORTED", "net::ERR_CONNECTION_REFUSED"].includes(
      entry.error_text,
    )
  ) {
    return true;
  }
  if (
    !["net::ERR_ABORTED", "net::ERR_INCOMPLETE_CHUNKED_ENCODING"].includes(
      entry.error_text,
    )
  ) {
    return false;
  }
  const phasePaths = {
    project_onboarding_and_naming: ["/", "/projects"],
    guidebrief_model_interpretation: [
      "/workbench",
      "/workbench/semantic-review",
      "/api/augnes/guide-brief/interpretation",
    ],
    project_shell_and_locked_entry: ["/workbench", "/workbench/semantic-review", "/workbench/inspector"],
    responsive_first_work_presentation: ["/workbench/semantic-review"],
    project_home_lifecycle_presentation: ["/", "/projects"],
    rendered_state_responsive_matrix: ["/workbench/semantic-review", "/workbench/inspector", "/projects"],
  };
  return (phasePaths[entry.phase] ?? []).some(
    (expectedPath) =>
      entry.path === expectedPath ||
      (expectedPath === "/projects" && entry.path?.startsWith("/projects/")),
  );
}

function expectedManagementSafetyHydrationWarning(entry) {
  return (
    entry.phase === "rendered_state_responsive_matrix" &&
    entry.text.includes(
      "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.",
    ) &&
    entry.text.includes('data-management-safety="management_safety_view.v0.1"') &&
    entry.text.includes('-                                 open=""')
  );
}

function classifyUrl(value) {
  try {
    const url = new URL(value);
    const networkProtocol = ["http:", "https:", "ws:", "wss:"].includes(
      url.protocol,
    );
    const local = LOCAL_HOSTNAMES.has(url.hostname);
    return {
      external: networkProtocol && !local,
      path: url.pathname,
    };
  } catch {
    return { external: false, path: null };
  }
}

async function assertLoopbackListener(port) {
  assert(serverProcess);
  assert.equal(serverProcess.spawnargs.includes("127.0.0.1"), true);
  assert.equal(serverProcess.spawnargs.includes("0.0.0.0"), false);
  assert.equal(await canConnectToListener("127.0.0.1", port), true);
  const nonLoopbackAddresses = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter(
      (entry) =>
        entry.family === "IPv4" &&
        !entry.internal &&
        entry.address !== "127.0.0.1",
    )
    .map((entry) => entry.address);
  for (const address of nonLoopbackAddresses) {
    assert.equal(await canConnectToListener(address, port), false);
  }
}

async function canConnectToListener(host, port) {
  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (connected) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(connected);
    };
    socket.setTimeout(1_000, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function chooseAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("loopback_port_allocation_failed"));
      });
    });
  });
}

async function terminateProcess(child, ownedRecord, gracefulTimeoutMs) {
  if (!child) return;
  assert(ownedRecord, "owned_process_record_missing");
  const streamStartedAt = Date.now();
  if (ownedRecord.exited || ownedRecord.closed) {
    await settleOwnedProcessAfterExit(ownedRecord, {
      streamDrainMs: 500,
      termGraceMs: gracefulTimeoutMs,
      killGraceMs: 2_000,
    });
  } else {
    await terminateOwnedProcessTree(ownedRecord, {
      termGraceMs: gracefulTimeoutMs,
      killGraceMs: 2_000,
    });
  }
  timing.duration(
    "stream_settlement",
    "owned child stream settlement",
    Date.now() - streamStartedAt,
  );
}

async function cleanup() {
  const chromeShutdownStartedAt = Date.now();
  if (cdp) await cdp.close().catch(() => undefined);
  cdp = null;
  await terminateProcess(chromeProcess, chromeProcessRecord, 2_000);
  chromeProcess = null;
  chromeProcessRecord = null;
  timing.duration(
    "chrome_cdp_shutdown",
    "Chrome and CDP shutdown",
    Date.now() - chromeShutdownStartedAt,
  );
  await terminateRuntime();
  serverLog = "";
  rmSync(tempRoot, { recursive: true, force: true });
  if (processTempRoot !== tempRoot) {
    rmSync(processTempRoot, { recursive: true, force: true });
  }
}

async function listenerResidueCount() {
  let count = 0;
  for (const port of [appPort, bridgePort, debugPort].filter(Number.isInteger)) {
    if (await canConnectToListener("127.0.0.1", port)) count += 1;
  }
  return count;
}

function childHasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function recordLongWait(kind, label, startedAt) {
  const durationMs = Date.now() - startedAt;
  if (durationMs <= 500) return;
  timing.duration(
    kind,
    `${publicToken(label)} ${String(waitCount + 1).padStart(3, "0")}`,
    durationMs,
  );
  waitCount += 1;
}

function record(id) {
  assert.equal(semanticMarkers.includes(id), false, `duplicate_marker:${id}`);
  semanticMarkers.push(id);
}

function completeDetailedField(id) {
  detailedFieldCompletionOwner.complete(id);
}

function safeError(error) {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : "unknown_failure";
  return `${currentPhase}:${name}:${message}`
    .replaceAll(tempRoot, "<temporary-root>")
    .replaceAll(processTempRoot, "<process-root>")
    .replaceAll(appRepo, "<repository-root>")
    .slice(0, 500);
}

function safeLifecycleErrorCode(error) {
  const candidate =
    typeof error?.code === "string" ? error.code : error?.name;
  return typeof candidate === "string" && /^[A-Za-z0-9_.-]{1,64}$/u.test(candidate)
    ? candidate
    : "project_experience_browser_failure";
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
