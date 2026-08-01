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

import {
  openVNextLocalOperatorDatabaseV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session.ts";
import { createBrowserSupervisorPublicDiagnosticCapture } from "./browser-supervisor-public-diagnostic.mjs";
import { createBrowserE2ETimingRecorder } from "./browser-e2e-timing.mjs";
import {
  PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
  admitExpiredProjectContextPresentationV1,
  admitProjectExperienceRenderedStateV1,
  buildProjectExperienceBrowserFixtureV1,
} from "./project-experience-browser-fixture-v1.ts";
import {
  registerOwnedChild,
  settleOwnedProcessAfterExit,
  terminateOwnedProcessTree,
} from "./test-harness-process-lifecycle.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const VALIDATION_VERSION = "project_experience_browser_validation.v1";
const VALIDATION_SCOPE = "project-experience";
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
const onboardingFolder = path.join(tempRoot, "Project Experience Alpha");
const onboardingFolderB = path.join(tempRoot, "Project Experience Beta");
const onboardingFolderBRecovered = path.join(
  tempRoot,
  "Project Experience Beta recovered",
);
const onboardingFolderBMissing = path.join(
  tempRoot,
  "Project Experience Beta moved",
);
const folderPickerSequencePath = path.join(
  tempRoot,
  "project-experience-folder-picker-sequence.json",
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
let detailedAssertionCount = 0;
const requests = [];
const responses = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];
const semanticMarkers = [];
const viewportResults = [];
const viewportWarnings = [];
const productShellRouteClassifications = [];
const productShellResponsiveResults = [];
const ownedBrowserProcesses = new Set();
const timing = createBrowserE2ETimingRecorder({ scope: VALIDATION_SCOPE });

const result = {
  ok: false,
  validation_version: VALIDATION_VERSION,
  owner: "project_experience",
  fixture_version: null,
  fixture_fingerprint: null,
  fixture_source_database_sha256: null,
  fixture_writable_seed_sha256: null,
  detailed_field_count: 40,
  detailed_marker_count: 5,
  semantic_markers: [],
  folder_picker_cancelled_usable: false,
  folder_onboarding_destination: null,
  project_context_repeat_activation: false,
  project_context_keyboard_activation: false,
  project_name_onboarding_prefill_and_edit: false,
  project_name_invalid_blocked: false,
  project_name_stale_conflict_visible: false,
  project_name_long_korean_propagated: false,
  project_context_opens_settings: false,
  folder_onboarding_restart_reopen: false,
  folder_onboarding_stale_active_conflict: false,
  guide_brief_blank_state_v0_2: false,
  project_home_coordination_visible: false,
  project_recovery_context_passive: false,
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

try {
  await main();
  result.ok = true;
} catch (error) {
  result.failure = safeError(error);
  process.exitCode = 1;
} finally {
  process.stdout.write(
    `[browser-e2e] cleanup_start scope=${VALIDATION_SCOPE} phase=${currentPhase} owned_processes=${ownedBrowserProcesses.size}\n`,
  );
  const finishCleanupTiming = timing.start("cleanup", "global cleanup");
  await cleanup();
  finishCleanupTiming();
  result.cleanup_complete = true;
  result.owned_streams_settled = ownedBrowserProcesses.size === 0;
  result.owned_process_residue_count = ownedBrowserProcesses.size;
  result.listener_residue_count = await listenerResidueCount();
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
  process.umask(originalUmask);
  process.stdout.write(
    `[browser-e2e] cleanup_result scope=${VALIDATION_SCOPE} owned_processes=${ownedBrowserProcesses.size} listener_residue=${result.listener_residue_count}\n`,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
  timing.milestone("project experience harness started");
  assert.equal(path.isAbsolute(appRepo), true);
  assert.equal(existsSync(path.join(appRepo, "package.json")), true);
  for (const directory of [
    fixtureRoot,
    downloadDirectory,
    runtimeStateDirectory,
    disposableHome,
    onboardingFolder,
    onboardingFolderB,
    onboardingFolderBRecovered,
    processTempRoot,
  ]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  writeFolderPickerSequence([
    { id: "cancelled-selection", outcome: "cancelled" },
    {
      id: "project-alpha",
      outcome: "selected",
      absolute_path: onboardingFolder,
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
  const semanticAuthorityBaseline = semanticAuthorityCounts(
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
    await clickSelector('[data-blank-state-primary-action="choose_folder"]');
    await waitForCondition(
      `document.body.textContent.includes('Folder selection was cancelled. Nothing changed.') && document.querySelector('[data-blank-state-primary-action="choose_folder"]:not(:disabled)') !== null`,
      "cancelled folder picker remains usable",
    );
    result.folder_picker_cancelled_usable = true;
    detailedAssertionCount += 1;

    await clickSelector('[data-blank-state-primary-action="choose_folder"]');
    await waitForCondition(
      `document.querySelector('input[name="project-display-name"]')?.value === 'Project Experience Alpha'`,
      "project name prefill",
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
    await clickSelector('[data-blank-state-primary-action="confirm_folder"]');
    await waitForCondition(
      `location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')`,
      "canonical project destination",
    );
    projectAlphaDestination = await evaluateString("location.pathname");
    projectAlphaId = decodeURIComponent(projectAlphaDestination.split("/").at(-1));
    assert.match(projectAlphaId, /^project:/u);
    result.folder_onboarding_destination = projectAlphaDestination;
    detailedAssertionCount += 1;
    await waitForCondition(
      `document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes(${JSON.stringify(editedName)}) === true`,
      "edited project name propagation",
    );

    await clickSelector('a[data-project-context-label="Current project"]');
    await waitForCondition(
      `location.hash === '#project-settings' && document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === true`,
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
      `document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === true`,
      "repeat project context activation",
    );
    result.project_context_repeat_activation = true;
    detailedAssertionCount += 1;
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
      `document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === true`,
      "keyboard project context activation",
    );
    result.project_context_keyboard_activation = true;
    detailedAssertionCount += 1;
    result.project_context_opens_settings = true;
    detailedAssertionCount += 1;

    await setFormControlValue('input[name="current-project-display-name"]', "");
    await waitForCondition(
      `document.querySelector('[data-project-name-save="true"]')?.disabled === true && document.body.textContent.includes('Enter a project name.')`,
      "invalid project rename refusal",
    );
    result.project_name_invalid_blocked = true;
    detailedAssertionCount += 1;
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
    detailedAssertionCount += 1;
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
    result.project_name_long_korean_propagated = true;
    detailedAssertionCount += 1;
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
      `document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes('Project Experience Alpha') === true`,
      "restored project name",
    );
    result.project_name_onboarding_prefill_and_edit = true;
    detailedAssertionCount += 1;

    const emptyState = await evaluateJson(`(() => {
      const home = document.querySelector('[data-blank-state="v0.1"]');
      const text = home?.innerText ?? '';
      return {
        active: home?.getAttribute('data-blank-state-active'),
        focus: home?.getAttribute('data-blank-state-focus'),
        guide_version: home?.getAttribute('data-guide-brief-version'),
        guide_source: home?.getAttribute('data-guide-brief-source-status'),
        project_context: home?.getAttribute('data-guide-brief-project-context'),
        proposal_absent: !text.includes(${JSON.stringify(manifest.rendered_state_inputs.proposal_review.proposal_id)}),
        packet_absent: !text.includes('task-context-packet:'),
        primary_actions: home?.querySelectorAll('[data-blank-state-primary-action]').length
      };
    })()`);
    assert.deepEqual(emptyState, {
      active: "true",
      focus: "first_work_not_defined",
      guide_version: "guide_brief.v0.2",
      guide_source: "live_current_project",
      project_context: "current",
      proposal_absent: true,
      packet_absent: true,
      primary_actions: 1,
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
        version: body.guide_version,
        project: body.identity?.project_display_name,
        context: body.identity?.project_context,
        focus: body.coordinate?.focus,
        authority: body.authority?.source_of_truth,
        private_material_absent: !/(OPENAI_API_KEY|GITHUB_TOKEN|sk-|ghp_|sha256:)/i.test(serialized)
      };
    })()`);
    assert.deepEqual(guideRead, {
      status: 200,
      version: "guide_brief.v0.2",
      project: "Project Experience Alpha",
      context: "current",
      focus: "first_work_not_defined",
      authority: false,
      private_material_absent: true,
    });
    result.guide_brief_blank_state_v0_2 = true;
    detailedAssertionCount += 1;
    result.minimum_project_home_empty_state = true;
    detailedAssertionCount += 1;
    result.project_home_coordination_visible = true;
    detailedAssertionCount += 1;
    result.minimum_project_home_project_isolation = true;
    detailedAssertionCount += 1;
    await validateProjectHomeViewports("first-work-not-defined");
    result.minimum_project_home_narrow_viewport_no_overflow = true;
    detailedAssertionCount += 1;
    record("folder_onboarding_confirmation_refresh_restart_and_reopen");
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
    const lockedShape = await evaluateJson(`(() => {
      const main = document.querySelector('main');
      const guide = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
      const text = main?.innerText ?? '';
      return {
        private_material_rendered: main?.getAttribute('data-vnext-private-material-rendered'),
        project: guide?.querySelector('[data-guide-brief-project-name="true"]')?.textContent?.trim(),
        guide_controls: guide?.querySelectorAll('button, input, textarea, select').length,
        exact_detail_absent: document.querySelector('[data-ai-workplane-exact-details]') === null,
        private_identity_absent: !/(sha256:|episode-delta-proposal:|task-context-packet:)/i.test(text)
      };
    })()`);
    assert.deepEqual(lockedShape, {
      private_material_rendered: "false",
      project: "Project Experience Alpha",
      guide_controls: 0,
      exact_detail_absent: true,
      private_identity_absent: true,
    });
    result.guide_brief_ai_workplane_v0_2 = true;
    detailedAssertionCount += 1;
    result.guide_brief_cross_surface_consistency = true;
    detailedAssertionCount += 1;
    result.workbench_compatibility_redirect = true;
    detailedAssertionCount += 1;
    await validateProductShell({
      route: "/workbench/semantic-review",
      primaryZone: "ai-workplane",
      projectContextRequired: true,
    });
    await validateProductShellResponsive("/workbench/semantic-review");
    await clickSelector('a[data-project-context-label="Current project"]');
    await waitForCondition(
      `location.pathname === '/' && location.hash === '#project-settings' && document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === true`,
      "AI Workplane project settings return",
    );
    result.ai_workplane_project_context_opens_settings = true;
    detailedAssertionCount += 1;

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
    detailedAssertionCount += 1;
    await cdp.send("Network.clearBrowserCookies");
  });

  await runPhase("project_home_lifecycle_presentation", async () => {
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "project management surface",
    );
    await clickButtonByText("Choose another folder");
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
    result.minimum_project_home_non_active_deep_link_read_only = true;
    detailedAssertionCount += 1;
    await waitForRequestQuiet();
    await validateProjectHomeViewports("viewed-inactive-project");
    await waitForRequestQuiet();
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && Array.from(document.querySelectorAll('button[data-blank-state-primary-action="make_active"]')).some((button) => button.getBoundingClientRect().width > 0 && !button.disabled)`,
      "explicit project activation ready",
    );
    await clickSelector('[data-blank-state-primary-action="make_active"]');
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Project Experience Alpha')`,
      "explicit project activation",
    );
    result.minimum_project_home_explicit_activation = true;
    detailedAssertionCount += 1;

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
    detailedAssertionCount += 1;
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
    detailedAssertionCount += 1;

    const activateBeta = await openProjectInBrowser(projectBetaId);
    assert.equal(activateBeta.status, 200);
    renameSync(onboardingFolderB, onboardingFolderBMissing);
    renameSync(folderPickerSequencePath, `${folderPickerSequencePath}.consumed`);
    writeFolderPickerSequence([
      {
        id: "project-beta-recovery",
        outcome: "selected",
        absolute_path: onboardingFolderBRecovered,
      },
    ]);
    await navigate(`${appOrigin}${projectBetaDestination}`);
    await waitForCondition(
      `document.querySelector('[data-blank-state-focus="project_root_unavailable"] [data-blank-state-primary-action="locate_folder"]') !== null && document.body.textContent.includes('The project record is safe')`,
      "project recovery presentation",
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && Array.from(document.querySelectorAll('[data-blank-state-primary-action="locate_folder"]')).some((button) => button.getBoundingClientRect().width > 0 && !button.disabled)`,
      "project recovery controls ready",
    );
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
    detailedAssertionCount += 1;
    await waitForRequestQuiet();
    await clickSelectorByMouse(
      '[data-blank-state-primary-action="locate_folder"]',
    );
    await waitForCondition(
      `document.querySelector('[role="dialog"]') !== null && document.querySelector('[role="dialog"]')?.textContent.includes('Project Experience Beta recovered') === true`,
      "project root rebind confirmation",
    );
    await clickButtonByTextByMouse("Use this folder", '[role="dialog"]');
    await waitForCondition(
      `location.pathname === ${JSON.stringify(projectBetaDestination)} && document.querySelector('[role="dialog"]') === null && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "project root rebound",
    );
    await waitForRequestQuiet();

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
    detailedAssertionCount += 1;
    result.folder_onboarding_restart_reopen = true;
    detailedAssertionCount += 1;

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
    detailedAssertionCount += 1;
    result.minimum_project_home_unknown_project_safe_not_found = true;
    detailedAssertionCount += 1;
    const activeAfterUnknown = await readRecentProjectsInBrowser();
    assert.equal(
      activeAfterUnknown.recent_projects.find((entry) => entry.is_active)
        ?.project.project_id,
      projectAlphaId,
    );
    record("minimum_project_home_empty_refresh_restart_isolation_and_explicit_switch");
  });

  await runPhase("rendered_state_responsive_matrix", async () => {
    await navigate("about:blank");
    await terminateRuntime();
    admitProjectExperienceRenderedStateV1({
      database_path: fixture.writable_database_path,
      manifest,
      admitted_at: new Date().toISOString(),
    });
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
    await waitForCondition(
      `document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]') !== null`,
      "delegated work presentation fixture",
    );
    await validateDelegatedWorkViewports();
    result.delegated_work_narrow_viewport_no_overflow = true;
    detailedAssertionCount += 1;

    await navigate(
      `${appOrigin}${manifest.rendered_state_inputs.result_ready.review_href}`,
    );
    await waitForCondition(
      `document.querySelector('[data-run-result-review="v0.1"]') !== null`,
      "result-ready presentation fixture",
    );
    await validateResultViewports();
    result.workbench_result_narrow_viewport_no_overflow = true;
    detailedAssertionCount += 1;

    await navigate(
      `${appOrigin}${manifest.rendered_state_inputs.proposal_review.review_href}`,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
      "proposal-review presentation fixture",
    );
    await validateProposalViewports();
    result.proposal_review_narrow_viewport_no_overflow = true;
    detailedAssertionCount += 1;

    await navigate(
      new URL(manifest.rendered_state_inputs.inspector.href, appOrigin).toString(),
    );
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"]') !== null`,
      "Inspector presentation fixture",
    );
    await validateInspectorViewports();
    result.shared_inspector_narrow_viewport_no_overflow = true;
    detailedAssertionCount += 1;
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
    detailedAssertionCount += 1;
    await validateProductShell({
      route: "/projects",
      primaryZone: "blank-state",
      projectContextRequired: true,
    });
    await validateProductShellResponsive("/projects");
    await validateManagementSafetyKeyboardNavigation();
    result.management_safety_keyboard_navigation = true;
    detailedAssertionCount += 1;
    assert.equal(productShellRouteClassifications.length, 3);
    result.product_shell_route_classifications =
      productShellRouteClassifications;
    detailedAssertionCount += 1;
    assert.equal(productShellResponsiveResults.length, 6);
    result.product_shell_responsive_results =
      productShellResponsiveResults;
    detailedAssertionCount += 1;
    assert.equal(viewportResults.length, 26);
    result.viewport_results = viewportResults;
    detailedAssertionCount += 1;
    assert.deepEqual(viewportWarnings, []);
    result.viewport_warnings = viewportWarnings;
    detailedAssertionCount += 1;
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
          private_material: /(sha256:|task-context-packet:|episode-delta-proposal:|bootstrap token)/i.test(text)
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
    detailedAssertionCount += 1;
    result.retired_routes_non_mutating = true;
    detailedAssertionCount += 1;
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
      (entry) =>
        entry.error_text !== "net::ERR_ABORTED" &&
        entry.error_text !== "net::ERR_INCOMPLETE_CHUNKED_ENCODING" &&
        !entry.path?.includes("/_next/webpack-hmr"),
    );
    assert.deepEqual(pageErrors, []);
    assert.equal(knownHarnessConsoleWarnings.length <= 1, true);
    assert.deepEqual(unexpectedConsoleErrors, []);
    assert.deepEqual(unexpectedFailedRequests, []);
    assert.deepEqual(externalRequests, []);
    assert.equal(detailedAssertionCount, 40);
    assert.equal(semanticMarkers.length, 5);
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
    result.known_harness_console_warning_count =
      knownHarnessConsoleWarnings.length;
    result.credential_private_material_boundary =
      !/(vnext_bootstrap_v01\.|OPENAI_API_KEY|GITHUB_TOKEN|sk-|ghp_)/iu.test(
        serverLog,
      );
    result.provider_or_external_network_call = false;
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

function runtimeEnvironment(databasePath, manifest, projectId) {
  return {
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
    const metrics = await responsiveMetrics(
      "first_work_composer",
      '[data-first-work-composer="project_work_initialization.v0.1"]',
      true,
    );
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.surface_horizontal_overflow, false);
    assert.equal(metrics.inside_viewport, true);
    assert.equal(metrics.primary_navigation_count, 2);
    assert.equal(metrics.primary_action_count, 1);
    assert.equal(metrics.minimum_control_size, true);
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
    const metrics = await responsiveMetrics(
      "delegated_work",
      '[data-delegated-work="delegated_work_projection.v0.1"]',
      true,
    );
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.surface_horizontal_overflow, false);
    assert.equal(metrics.primary_navigation_count, 2);
    assert.equal(metrics.minimum_control_size, true);
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
    `document.querySelector('.product-shell[data-primary-product-zone=${JSON.stringify(primaryZone)}]') !== null && document.querySelectorAll('nav[aria-label="Primary navigation"] > a').length === 2`,
    `${route} ProductShell`,
  );
  const shell = await evaluateJson(`(() => {
    const root = document.querySelector('.product-shell[data-primary-product-zone=${JSON.stringify(primaryZone)}]');
    const links = Array.from(root?.querySelectorAll('nav[aria-label="Primary navigation"] > a') ?? []);
    return {
      route: ${JSON.stringify(route)},
      primary_zone: root?.getAttribute('data-primary-product-zone'),
      utility_context: root?.getAttribute('data-product-utility-context'),
      labels: links.map((link) => link.querySelector('strong')?.textContent?.trim()),
      hrefs: links.map((link) => link.getAttribute('href')),
      current_count: links.filter((link) => link.getAttribute('aria-current') === 'page').length,
      project_context: root?.querySelector('[data-project-context-label]')?.getAttribute('data-project-context-label') ?? null,
      global_utility_links: Array.from(root?.querySelectorAll('header a') ?? []).filter((link) => ['/projects', '/portability', '/recovery'].includes(link.getAttribute('href') ?? '')).length
    };
  })()`);
  assert.deepEqual(shell.labels, ["Continuities", "AI Workplane"]);
  assert.deepEqual(shell.hrefs, ["/", "/workbench/semantic-review"]);
  assert.equal(shell.primary_zone, primaryZone);
  assert.equal(shell.utility_context, "none");
  assert.equal(shell.current_count, 1);
  assert.equal(shell.global_utility_links, 0);
  if (projectContextRequired) {
    assert.equal(
      ["Current project", "Viewed project"].includes(shell.project_context),
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
        primary_labels: links.map((link) => link.querySelector('strong')?.textContent?.trim())
      };
    })()`);
    assert.deepEqual(metrics, {
      route,
      width,
      document_horizontal_overflow: false,
      primary_link_count: 2,
      primary_links_visible: true,
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
  if (/favicon\.ico|401 \(Unauthorized\)|404 \(Not Found\)|409 \(Conflict\)/iu.test(entry.text)) {
    return true;
  }
  if (/ERR_INCOMPLETE_CHUNKED_ENCODING|ERR_CONNECTION_REFUSED|webpack-hmr/iu.test(entry.text)) {
    return true;
  }
  return false;
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
