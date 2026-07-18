#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";

import {
  TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  genericCliBuilderInputFixture,
} from "../fixtures/vnext/protocol/task-context-packet-v0-1.ts";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store.ts";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet.ts";
import {
  issueVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session.ts";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 = 64;

const VALIDATION_VERSION =
  "vnext_native_host_result_browser_validation.v0.1";
const DEFAULT_TIMEOUT_MS = 45_000;
// Current-head CI exposed that a DOM-only wait can expire while refresh churn
// masks the supervised run's durable state. Observe that lifecycle explicitly,
// with a bounded allowance below the outer E2E limit, before asserting the UI.
const LIVE_HOST_APPROVAL_TIMEOUT_MS = 90_000;
// The deterministic production-seam fixture builder completed locally in
// 13,620 ms. Keep its child bound below the outer E2E lifecycle.
const OPERATOR_FIXTURE_EXPORT_TIMEOUT_MS = 45_000;
const REQUEST_QUIET_MS = 500;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const originalUmask = process.umask(0o077);
const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-vnext-native-host-result-browser-v0-1-"),
);
const canonicalOwnedTempRoot =
  process.env.AUGNES_CANONICAL_TEMP_ROOT?.trim() ?? null;
const processTempRoot = canonicalOwnedTempRoot
  ? realpathSync(canonicalOwnedTempRoot)
  : mkdtempSync(path.join(tmpdir(), "ag-e2e-"));
const fixtureDir = path.join(tempRoot, "fixture");
const chromeProfileDir = path.join(tempRoot, "chrome-profile");
const manifestPath = path.join(
  fixtureDir,
  "operator-pilot-browser-fixture.json",
);
const databasePath = path.join(fixtureDir, "operator-pilot.db");
const browserSecondApprovalReleasePath = path.join(
  tempRoot,
  "browser-second-approval.release",
);
const browserTerminalReleasePath = path.join(
  tempRoot,
  "browser-terminal.release",
);
const onboardingFolder = path.join(tempRoot, "Browser Onboarding Project");
const onboardingFolderB = path.join(tempRoot, "Browser Second Project");
const appRepo = realpathSync(process.cwd());
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
const requestMethods = new Map();
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];
const assertions = [];

const result = {
  ok: false,
  validation_version: VALIDATION_VERSION,
  fixture_source: "deterministic_production_seam_builder",
  fixture_generation_duration_ms: null,
  app_repo: appRepo,
  proposal_id: null,
  proposal_fingerprint: null,
  packet_id: null,
  packet_fingerprint: null,
  active_packet_id: null,
  active_packet_fingerprint: null,
  direct_host_project_home_active: false,
  direct_host_request_body_empty: false,
  direct_host_receipt_persisted: false,
  direct_host_packet_bound: false,
  direct_host_no_copy_paste: false,
  direct_host_status: null,
  live_codex_status: null,
  live_codex_waiting_for_approval: false,
  project_home_current_run_visible: false,
  live_codex_approved_once: false,
  live_codex_second_approval: false,
  project_home_approval_refresh_count: 0,
  live_codex_receipt_persisted: false,
  live_codex_no_internal_id_input: false,
  project_home_latest_result_visible: false,
  workbench_result_review_read_only: false,
  workbench_result_reload_durable: false,
  result_inspector_complete: false,
  result_review_semantic_authority_unchanged: false,
  task_success_criterion_assessment: false,
  execution_task_success_separated: false,
  workbench_result_narrow_viewport_no_overflow: false,
  result_to_proposal_navigation: false,
  proposal_assessment_snapshot: false,
  proposal_review_narrow_viewport_no_overflow: false,
  folder_picker_cancelled_usable: false,
  folder_onboarding_destination: null,
  folder_onboarding_restart_reopen: false,
  folder_onboarding_stale_active_conflict: false,
  minimum_project_home_empty_state: false,
  minimum_project_home_expired_context_withheld: false,
  minimum_project_home_refresh_read_only: false,
  minimum_project_home_restart_root_resolution: false,
  minimum_project_home_non_active_deep_link_read_only: false,
  minimum_project_home_explicit_activation: false,
  minimum_project_home_project_isolation: false,
  minimum_project_home_narrow_viewport_no_overflow: false,
  minimum_project_home_unknown_project_status: null,
  minimum_project_home_unknown_project_safe_not_found: false,
  project_automation_default_not_configured: false,
  project_automation_enabled: false,
  project_automation_paused: false,
  project_automation_resumed: false,
  project_automation_policy_summary_visible: false,
  project_automation_stale_conflict_visible: false,
  project_automation_restart_persisted: false,
  personal_perspective_default_excluded: false,
  personal_perspective_included: false,
  personal_perspective_project_b_excluded: false,
  project_controls_two_project_isolation: false,
  project_controls_restart_persisted: false,
  control_mutation_grants_created: null,
  control_mutation_runs_created: null,
  control_mutation_semantic_rows_created: null,
  control_mutation_personal_content_created: null,
  viewport_results: [],
  viewport_warnings: [],
  packet_copy_actions: 0,
  handoff_capsule_copy_actions: 0,
  core_handoff_copy_actions: 0,
  launch_card_copy_actions: 0,
  result_paste_actions: 0,
  result_report_textarea_interactions: 0,
  native_host_clipboard_calls: 0,
  internal_id_entry_actions: 0,
  semantic_proposals_created: 0,
  review_decisions_created: 0,
  semantic_transitions_created: 0,
  work_closures_created: 0,
  retired_route_statuses: {},
  retired_routes_non_mutating: false,
  unexpected_external_request_count: 0,
  unexpected_console_error_count: 0,
  credential_material_in_dom: false,
  credential_material_in_server_log: false,
  default_database_accessed: false,
  provider_or_external_network_call: false,
  temporary_root_removed: false,
  temporary_process_root_removed: false,
  temporary_profile_removed: false,
  temporary_fixture_removed: false,
  temporary_database_removed: false,
  temporary_manifest_removed: false,
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
  result.temporary_root_removed = !existsSync(tempRoot);
  result.temporary_process_root_removed = !existsSync(processTempRoot);
  result.temporary_profile_removed = !existsSync(chromeProfileDir);
  result.temporary_fixture_removed = !existsSync(fixtureDir);
  result.temporary_database_removed = !existsSync(databasePath);
  result.temporary_manifest_removed = !existsSync(manifestPath);
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

  const fixtureStartedAt = Date.now();
  const fixtureSummary = await buildActualCompiledPacketFixture();
  result.fixture_generation_duration_ms = Date.now() - fixtureStartedAt;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.fixture_version, "vnext_operator_pilot_browser_fixture.v0.1");
  assert.equal(manifest.credential_material_included, false);
  assert.equal(manifest.external_identity_authenticated, false);
  assert.equal(manifest.semantic_authority_granted, false);
  assert.deepEqual(
    manifest.database_identity,
    databaseFileIdentityV01(databasePath),
  );
  assert.equal(manifest.database_binding, "deterministic_production_fixture");
  assert.equal(manifest.database_file, path.basename(databasePath));
  assert.equal(fixtureSummary.status, "pass");
  assert.equal(fixtureSummary.default_database_accessed, false);
  assert.equal(fixtureSummary.external_network_calls, 0);
  assert.equal(fixtureSummary.provider_calls, 0);
  assert.equal(fixtureSummary.persisted_lineage_status, "packet_compiled");
  assert.equal(
    fixtureSummary.artifact_ownership,
    "transferred_to_browser_harness",
  );
  assert.equal(fixtureSummary.credential_material_included, false);
  assert.equal(fixtureSummary.private_absolute_path_in_manifest, false);
  result.default_database_accessed = fixtureSummary.default_database_accessed;

  const activePacketId = manifest.packet_id;
  const activePacketFingerprint = manifest.packet_fingerprint;

  result.proposal_id = manifest.proposal_id;
  result.proposal_fingerprint = manifest.proposal_fingerprint;
  result.packet_id = manifest.packet_id;
  result.packet_fingerprint = manifest.packet_fingerprint;
  result.active_packet_id = activePacketId;
  result.active_packet_fingerprint = activePacketFingerprint;
  record("actual_compile_result_uses_canonical_packet_identity");

  appPort = await chooseAvailablePort();
  debugPort = await chooseAvailablePort();
  appOrigin = `http://127.0.0.1:${appPort}`;
  const runtimeEnvironment = isolatedRuntimeEnvironment({
    databasePath,
    manifest,
  });
  mkdirSync(onboardingFolder, { recursive: true });
  mkdirSync(onboardingFolderB, { recursive: true });

  startDevServer({ ...runtimeEnvironment, AUGNES_TEST_FOLDER_PICKER_OUTCOME: "cancelled" });
  await waitForHttp(`${appOrigin}/workbench/semantic-review`, DEFAULT_TIMEOUT_MS);
  await assertLoopbackListener(appPort);

  const chromeExecutable = chromeCandidates.find((candidate) => existsSync(candidate));
  assert(chromeExecutable, "No usable local Chrome/Chromium executable was found.");
  startChrome(chromeExecutable);
  cdp = await openCdpPage();
  attachCdpObservers();
  await enableCdpDomains();

  await runPhase("folder_onboarding", async () => {
    await navigate(`${appOrigin}/`);
    await waitForCondition(`location.pathname === '/projects'`, "no-active-project root resolution");
    await waitForCondition(
      `document.querySelector('[data-project-onboarding-hydrated="true"]') !== null && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Choose folder')`,
      "Choose folder action",
    );
    assert.equal(await evaluateBoolean(`document.querySelector('input[type="text"]') === null`), true);
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Choose folder'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('Folder selection was cancelled. Nothing changed.')`, "cancelled picker status");
    assert.equal(await evaluateBoolean(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Choose folder' && !button.disabled)`), true);
    result.folder_picker_cancelled_usable = true;

    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    startDevServer(runtimeEnvironment);
    await waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/`);
    await waitForCondition(`document.querySelector('[data-project-onboarding-hydrated="true"]') !== null`, "hydrated project onboarding surface");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Choose folder'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('Browser Onboarding Project') && document.body.textContent.includes('Plain folder')`, "local folder inspection surface");
    assert.equal(await evaluateBoolean(`document.body.textContent.includes(${JSON.stringify(onboardingFolder)})`), true);
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Confirm project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')`, "stable project destination");
    const destination = await evaluateString("location.pathname");
    result.folder_onboarding_destination = destination;
    await waitForCondition(`document.querySelector('[data-project-home="v0.1"]') !== null`, "Minimum Project Home destination");
    const emptyProjectHome = await evaluateJson(`(() => ({
      name: document.body.textContent.includes('Browser Onboarding Project'),
      root: document.body.textContent.includes(${JSON.stringify(onboardingFolder)}),
      accepted_empty: document.body.textContent.includes('No approved project state has been committed for this project.'),
      perspective_empty: document.body.textContent.includes('No canonical project-scoped Perspective or selected working projection exists yet.'),
      attention_empty: document.body.textContent.includes('No project-scoped decisions currently need attention.'),
      activity_empty: document.body.textContent.includes('No meaningful project activity has been recorded yet.'),
      automation_not_configured: document.body.textContent.includes('Project automation is not configured.'),
      personal_perspective_not_configured: document.body.textContent.includes('No project-specific choice has been made. Personal Perspective is excluded by default.'),
      capability_count: document.querySelectorAll('.project-home-capabilities > li').length,
      next_move_count: document.querySelectorAll('.project-home-next-moves > li').length,
      active: document.querySelector('[data-project-home-active="true"]') !== null,
      operator_proposal_leaked: document.body.textContent.includes(${JSON.stringify(manifest.proposal_id)}),
      operator_packet_leaked: document.body.textContent.includes(${JSON.stringify(manifest.packet_id)})
    }))()`);
    assert.deepEqual(emptyProjectHome, {
      name: true,
      root: true,
      accepted_empty: true,
      perspective_empty: true,
      attention_empty: true,
      activity_empty: true,
      automation_not_configured: true,
      personal_perspective_not_configured: true,
      capability_count: 5,
      next_move_count: 3,
      active: true,
      operator_proposal_leaked: false,
      operator_packet_leaked: false,
    });
    result.minimum_project_home_empty_state = true;
    result.minimum_project_home_project_isolation = true;
    result.project_automation_default_not_configured = true;
    result.personal_perspective_default_excluded = true;

    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated project controls",
    );

    const controlAuthorityBaseline = readControlAuthorityCounts();
    const enableResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Enable');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(enableResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/project-controls" &&
            entry.type === "Fetch",
        ),
      "project automation enable response",
    );
    const enableResponse = responses
      .slice(enableResponseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/project-controls" &&
          entry.type === "Fetch",
      );
    assert.equal(enableResponse?.status, 200);
    await waitForCondition(
      `Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`,
      "enabled project automation",
    );
    assert.equal(
      await evaluateBoolean(
        `document.body.textContent.includes('Control layer eligible') && document.body.textContent.includes('Admission grant required')`,
      ),
      true,
    );
    assert.equal(
      await evaluateBoolean(
        `document.body.textContent.includes('Bounded project automation') && document.body.textContent.includes('One automated run at a time') && document.body.textContent.includes('No automatic retry') && document.body.textContent.includes('Review required before semantic change') && document.body.textContent.includes('External actions not authorized') && document.body.textContent.includes('No scheduler connected')`,
      ),
      true,
    );
    result.project_automation_enabled = true;
    result.project_automation_policy_summary_visible = true;

    const firstProjectId = decodeURIComponent(destination.split("/").at(-1));
    const enabledSnapshot = readProjectControlState(firstProjectId);
    assert.equal(enabledSnapshot.automation?.revision, 1);
    const directPause = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/project-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause_automation',
          project_id: ${JSON.stringify(firstProjectId)},
          expected_active_project_id: ${JSON.stringify(enabledSnapshot.active.project_id)},
          expected_active_selection_revision: ${JSON.stringify(enabledSnapshot.active.selection_revision)},
          expected_control_revision: ${JSON.stringify(enabledSnapshot.automation.revision)}
        })
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(directPause.status, 200);
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Pause');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.body.textContent.includes('Automation settings changed in another view. Refresh and try again.')`,
      "visible stale automation conflict",
    );
    result.project_automation_stale_conflict_visible = true;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-project-home="v0.1"]') !== null && document.body.textContent.includes('Project automation is paused for new policy-triggered work.') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`,
      "paused automation after stale-page refresh",
    );
    result.project_automation_paused = true;

    const pausedDatabase = new Database(databasePath, { readonly: true, fileMustExist: true });
    const pausedRefreshSnapshot = databaseSnapshot(pausedDatabase);
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.body.textContent.includes('Project automation is paused for new policy-triggered work.')`,
      "paused automation refresh persistence",
    );
    assert.deepEqual(databaseSnapshot(pausedDatabase), pausedRefreshSnapshot);
    pausedDatabase.close();

    const expiredContextMarker = "BROWSER EXPIRED SELECTED WORKING CONTEXT";
    seedExpiredProjectHomePacket({
      projectId: decodeURIComponent(destination.split("/").at(-1)),
      marker: expiredContextMarker,
    });
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-project-home="v0.1"]') !== null && document.body.textContent.includes('The latest selected working context has expired.')`,
      "expired selected working context unavailable state",
    );
    assert.equal(
      await evaluateBoolean(
        `!document.body.textContent.includes(${JSON.stringify(expiredContextMarker)}) && !document.body.textContent.includes('perspective:browser-expired-context')`,
      ),
      true,
    );
    result.minimum_project_home_expired_context_withheld = true;

    const projectHomeDatabase = new Database(databasePath, { readonly: true, fileMustExist: true });
    const beforeProjectHomeRefresh = databaseSnapshot(projectHomeDatabase);
    const refreshRequestStart = requests.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(`document.querySelector('[data-project-home="v0.1"]') !== null`, "refreshed Minimum Project Home");
    assert.deepEqual(databaseSnapshot(projectHomeDatabase), beforeProjectHomeRefresh);
    assert.equal(requests.slice(refreshRequestStart).some((request) => request.method === "POST"), false);
    projectHomeDatabase.close();
    result.minimum_project_home_refresh_read_only = true;

    await navigate(`${appOrigin}/`);
    await waitForCondition(`location.pathname === ${JSON.stringify(destination)} && document.querySelector('[data-project-home="v0.1"]') !== null`, "active project root resolution");
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(`document.body.textContent.includes('Browser Onboarding Project')`, "recent project after return");
    await waitForCondition(`document.querySelector('[data-project-onboarding-hydrated="true"]') !== null`, "hydrated duplicate onboarding surface");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Choose folder'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('This folder is already added.')`, "duplicate root identity replay");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Confirm project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`location.pathname === ${JSON.stringify(destination)}`, "duplicate root stable destination");
    await navigate(`${appOrigin}/projects`);

    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    startDevServer(runtimeEnvironment);
    await waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/`);
    await waitForCondition(`location.pathname === ${JSON.stringify(destination)} && document.querySelector('[data-project-home="v0.1"]') !== null`, "active Project Home after restart");
    assert.equal(
      await evaluateBoolean(
        `document.body.textContent.includes('Project automation is paused for new policy-triggered work.') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`,
      ),
      true,
    );
    result.project_automation_restart_persisted = true;
    result.minimum_project_home_restart_root_resolution = true;

    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated project controls after restart",
    );

    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Resume');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.body.textContent.includes('Control layer eligible') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`,
      "resumed project automation",
    );
    result.project_automation_resumed = true;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Include Personal Perspective');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Exclude Personal Perspective')`,
      "included Personal Perspective scope",
    );
    assert.equal(
      await evaluateBoolean(
        `!document.body.textContent.includes('Private fixture') && document.body.textContent.includes('Eligible selected material 0')`,
      ),
      true,
    );
    result.personal_perspective_included = true;
    const recentAfterRestart = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    const reopened = recentAfterRestart.recent_projects.find((entry) => entry.project.display_name === 'Browser Onboarding Project');
    assert(reopened);
    const openResponse = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', project_id: ${JSON.stringify(reopened.project.project_id)}, expected_project_id: ${JSON.stringify(reopened.active_project_id)}, expected_revision: ${JSON.stringify(reopened.active_selection_revision)} })
      });
      return await response.json();
    })()`);
    assert.equal(openResponse.result.destination, destination);
    const staleOpenResponse = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', project_id: ${JSON.stringify(reopened.project.project_id)}, expected_project_id: ${JSON.stringify(reopened.active_project_id)}, expected_revision: ${JSON.stringify(reopened.active_selection_revision)} })
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(staleOpenResponse.status, 409);
    assert.equal(staleOpenResponse.body.error_code, "active_selection_conflict");
    result.folder_onboarding_stale_active_conflict = true;
    await navigate(`${appOrigin}${destination}`);
    await waitForCondition(`location.pathname === ${JSON.stringify(destination)} && document.querySelector('[data-project-home="v0.1"]') !== null`, "same destination after restart");
    result.folder_onboarding_restart_reopen = true;

    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    startDevServer({
      ...runtimeEnvironment,
      AUGNES_TEST_FOLDER_PICKER_PATH: onboardingFolderB,
    });
    await waitForHttp(`${appOrigin}/projects`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(`document.querySelector('[data-project-onboarding-hydrated="true"]') !== null`, "second-project onboarding surface");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Choose folder'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('Browser Second Project') && document.body.textContent.includes('Plain folder')`, "second-project inspection");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Confirm project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.querySelector('[data-project-home="v0.1"][data-project-home-active="true"]') !== null && document.body.textContent.includes('Browser Second Project')`, "second active Project Home");
    const secondDestination = await evaluateString("location.pathname");
    assert.notEqual(secondDestination, destination);
    assert.equal(
      await evaluateBoolean(
        `document.body.textContent.includes('Project automation is not configured.') && document.body.textContent.includes('No project-specific choice has been made. Personal Perspective is excluded by default.')`,
      ),
      true,
    );
    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated second-project controls",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter((candidate) => candidate.textContent?.trim() === 'Exclude Personal Perspective');
        buttons[0]?.click();
        return buttons.length > 0;
      })()`),
      true,
    );
    await waitForCondition(
      `document.body.textContent.includes("Personal Perspective is explicitly excluded from this project's context selection.") && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Include Personal Perspective')`,
      "second-project explicit Personal Perspective exclusion",
    );
    result.personal_perspective_project_b_excluded = true;
    const activeBeforeDeepLink = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    const activeSecond = activeBeforeDeepLink.recent_projects.find((entry) => entry.is_active);
    assert.equal(activeSecond?.project.display_name, "Browser Second Project");

    await navigate(`${appOrigin}${destination}`);
    await waitForCondition(`document.querySelector('[data-project-home="v0.1"][data-project-home-active="false"]') !== null`, "non-active first-project deep link");
    assert.equal(await evaluateBoolean(`document.body.textContent.includes('This is not the active project')`), true);
    assert.equal(
      await evaluateBoolean(
        `document.body.textContent.includes('Control layer eligible') && document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection') && document.body.textContent.includes('Make this project active before changing its controls.')`,
      ),
      true,
    );
    const activeAfterDeepLink = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    assert.equal(activeAfterDeepLink.recent_projects.find((entry) => entry.is_active)?.project.display_name, "Browser Second Project");
    result.minimum_project_home_non_active_deep_link_read_only = true;
    await validateProjectHomeViewports();
    result.minimum_project_home_narrow_viewport_no_overflow = true;
    await delay(750);
    const activationResponseStart = responses.length;
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Make active'); button?.click(); return Boolean(button); })()`), true);
    await waitForHostCondition(
      () => responses.slice(activationResponseStart).some(
        (entry) => entry.path === "/api/vnext/projects" && entry.type === "Fetch",
      ),
      "explicit first-project activation response",
    );
    const activationResponse = responses.slice(activationResponseStart).find(
      (entry) => entry.path === "/api/vnext/projects" && entry.type === "Fetch",
    );
    assert.equal(activationResponse?.status, 200);
    await waitForCondition(`document.querySelector('[data-project-home="v0.1"][data-project-home-active="true"]') !== null && document.body.textContent.includes('Browser Onboarding Project')`, "explicit first-project activation");
    result.minimum_project_home_explicit_activation = true;
    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated first-project controls after activation",
    );
    assert.equal(
      await evaluateBoolean(
        `document.body.textContent.includes('Control layer eligible') && document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection')`,
      ),
      true,
    );
    const secondProjectId = decodeURIComponent(secondDestination.split("/").at(-1));
    const firstControlState = readProjectControlState(firstProjectId);
    const secondControlState = readProjectControlState(secondProjectId);
    assert.equal(firstControlState.automation?.enabled, 1);
    assert.equal(firstControlState.automation?.paused, 0);
    assert.equal(firstControlState.personal_perspective?.selection, "included");
    assert.equal(secondControlState.automation, null);
    assert.equal(secondControlState.personal_perspective?.selection, "excluded");
    result.project_controls_two_project_isolation = true;

    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    startDevServer({
      ...runtimeEnvironment,
      AUGNES_TEST_FOLDER_PICKER_PATH: onboardingFolderB,
    });
    await waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(destination)} && document.body.textContent.includes('Control layer eligible') && document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection')`,
      "project controls after final restart",
    );
    result.project_controls_restart_persisted = true;
    const controlAuthorityAfter = readControlAuthorityCounts();
    result.control_mutation_grants_created =
      controlAuthorityAfter.grants - controlAuthorityBaseline.grants;
    result.control_mutation_runs_created =
      controlAuthorityAfter.runs - controlAuthorityBaseline.runs;
    result.control_mutation_semantic_rows_created =
      controlAuthorityAfter.semantic_rows - controlAuthorityBaseline.semantic_rows;
    result.control_mutation_personal_content_created =
      controlAuthorityAfter.personal_content - controlAuthorityBaseline.personal_content;
    assert.equal(result.control_mutation_grants_created, 0);
    assert.equal(result.control_mutation_runs_created, 0);
    assert.equal(result.control_mutation_semantic_rows_created, 0);
    assert.equal(result.control_mutation_personal_content_created, 0);
    const unknownResponseStart = responses.length;
    await navigate(`${appOrigin}/projects/project%3Aunknown-project-home`);
    await waitForHostCondition(
      () => responses.slice(unknownResponseStart).some(
        (entry) => entry.path === "/projects/project%3Aunknown-project-home" && entry.type === "Document",
      ),
      "unknown Project Home response",
    );
    result.minimum_project_home_unknown_project_status = documentStatusSince(
      unknownResponseStart,
      "/projects/project%3Aunknown-project-home",
    );
    await waitForCondition(
      `document.body.textContent.includes('This page could not be found') && document.querySelector('[data-project-home="v0.1"]') === null`,
      "unknown Project Home safe not-found state",
    );
    result.minimum_project_home_unknown_project_safe_not_found = true;
    const activeAfterUnknown = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    assert.equal(activeAfterUnknown.recent_projects.find((entry) => entry.is_active)?.project.display_name, "Browser Onboarding Project");
    record("folder_onboarding_confirmation_refresh_restart_and_reopen");
    record("minimum_project_home_empty_refresh_restart_isolation_and_explicit_switch");
    record("project_controls_enable_pause_resume_scope_restart_conflict_and_isolation");
  });

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

  await runPhase("retired_routes", async () => {
    database ??= new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    const beforeRetiredRequests = databaseSnapshot(database);
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
        body: { result_text: "retired result text must not be admitted" },
      },
      {
        name: "result_report_api",
        path: "/api/intake/codex-result-report/records",
        method: "POST",
        body: { result_text: "retired report text must not be admitted" },
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
        body: { packet_text: "retired packet transport must not be admitted" },
      },
      {
        name: "packet_handoff_page",
        path: "/workbench/semantic-review/packet-handoff/retired",
        method: "GET",
      },
    ];
    const retiredResults = await evaluateJson(`(async () => {
      const requests = ${JSON.stringify(retiredRequests)};
      const results = {};
      for (const request of requests) {
        const response = await fetch(request.path, {
          method: request.method,
          redirect: 'manual',
          headers: request.body ? { 'content-type': 'application/json' } : undefined,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
        const responseText = await response.text();
        results[request.name] = {
          status: response.status,
          redirected: response.type === 'opaqueredirect' || response.status >= 300 && response.status < 400,
          private_material: responseText.includes(${JSON.stringify(manifest.packet_id)}) ||
            responseText.includes(${JSON.stringify(manifest.packet_fingerprint)}) ||
            responseText.includes(${JSON.stringify(path.dirname(databasePath))}),
        };
      }
      return results;
    })()`);
    for (const [name, retired] of Object.entries(retiredResults)) {
      assert.equal(
        [404, 405].includes(retired.status),
        true,
        `${name} must be absent or method-inaccessible`,
      );
      assert.equal(retired.redirected, false, `${name} must not redirect`);
      assert.equal(retired.private_material, false, `${name} exposed private material`);
      result.retired_route_statuses[name] = retired.status;
    }
    assert.deepEqual(databaseSnapshot(database), beforeRetiredRequests);
    result.retired_routes_non_mutating = true;
    record("retired_native_host_transport_routes_return_non_mutating_404");
  });

  await runPhase("direct_host_round_trip", async () => {
    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-project-home="v0.1"]') !== null`,
      "operator Project Home",
    );
    if (
      await evaluateBoolean(
        `document.querySelector('[data-project-home-active="false"]') !== null`,
      )
    ) {
      await delay(750);
      const activationResponseStart = responses.length;
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === 'Make active'
          );
          button?.click();
          return Boolean(button);
        })()`),
        true,
      );
      await waitForHostCondition(
        () =>
          responses.slice(activationResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/projects" &&
              entry.type === "Fetch" &&
              entry.status === 200,
          ),
        "operator project activation response",
      );
    }
    await waitForCondition(
      `document.querySelector('[data-project-home-active="true"]') !== null`,
      "active operator Project Home",
    );
    await waitForCondition(
      `document.querySelector('[data-direct-host-round-trip="v0.2"][data-direct-host-round-trip-hydrated="true"]') !== null`,
      "operator Project Home direct-host action",
    );
    result.direct_host_project_home_active = true;

    const actionShape = await evaluateJson(`(() => {
      const action = document.querySelector('[data-direct-host-round-trip="v0.2"]');
      const labels = action
        ? Array.from(action.querySelectorAll('button, a')).map((candidate) => candidate.textContent?.trim() ?? '')
        : [];
      return {
        action_present: Boolean(action),
        form_field_count: action?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        start_button_count: action?.querySelectorAll('[data-direct-host-action="deterministic"], [data-live-host-action="start"]').length ?? -1,
        copy_or_paste_action: labels.some((label) => /copy|paste/i.test(label)),
        retired_control_count: Array.from(document.querySelectorAll('button, a')).filter((candidate) =>
          /copy taskcontextpacket|handoff capsule|core handoff|launch card|paste result|result report/i.test(candidate.textContent ?? '')
        ).length,
        result_textarea_count: document.querySelectorAll('textarea[name*="result" i], textarea[data-result-report], [data-result-paste]').length,
      };
    })()`);
    assert.deepEqual(actionShape, {
      action_present: true,
      form_field_count: 0,
      start_button_count: 2,
      copy_or_paste_action: false,
      retired_control_count: 0,
      result_textarea_count: 0,
    });
    result.direct_host_no_copy_paste = true;

    const before = readDirectHostBrowserState(manifest.project_id);
    const requestStart = requests.length;
    const responseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-direct-host-action="deterministic"]');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(responseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.type === "Fetch" &&
            entry.method === "POST",
        ),
      "direct-host route response",
    );
    const hostResponse = responses
      .slice(responseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.type === "Fetch" &&
          entry.method === "POST",
      );
    result.direct_host_status = hostResponse?.status ?? null;
    if (hostResponse?.status !== 201) {
      const visibleState = await evaluateJson(`(() => ({
        status: document.querySelector('[data-direct-host-round-trip="v0.2"]')?.getAttribute('data-direct-host-round-trip-status') ?? null,
        text: document.querySelector('[data-direct-host-round-trip="v0.2"]')?.textContent?.trim() ?? ''
      }))()`);
      assert.equal(
        hostResponse?.status,
        201,
        `direct-host route failed: ${JSON.stringify(visibleState)}`,
      );
    }
    await waitForCondition(
      `document.querySelector('[data-direct-host-round-trip-status="completed"]') !== null && document.body.textContent.includes('RunReceipt persisted')`,
      "completed direct-host round trip",
    );
    const hostRequest = requests
      .slice(requestStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.method === "POST",
      );
    assert(hostRequest, "The Project Home action did not issue the host request.");
    assert.equal(hostRequest.post_data, "{}");
    assert.equal(hostResponse?.status, 201);
    result.direct_host_request_body_empty = true;

    const after = readDirectHostBrowserState(manifest.project_id);
    assert.equal(after.direct_receipt_count, before.direct_receipt_count + 1);
    assert.equal(after.direct_run_count, before.direct_run_count + 1);
    assert.deepEqual(after.semantic_authority_counts, {
      ...before.semantic_authority_counts,
      proposals: before.semantic_authority_counts.proposals + 1,
    });
    assert(after.latest_receipt, "The direct structured RunReceipt was not persisted.");
    const receipt = after.latest_receipt;
    const packet = after.packet;
    assert(packet, "The exact persisted TaskContextPacket was not found.");
    assert.equal(receipt.workspace_id, manifest.workspace_id);
    assert.equal(receipt.project_id, manifest.project_id);
    assert.equal(receipt.task_context_packet_ref?.external_id, activePacketId);
    assert.equal(
      receipt.task_context_packet_ref?.source_ref,
      activePacketFingerprint,
    );
    assert.equal(
      receipt.work_ref?.external_id,
      typeof packet.work_ref === "string"
        ? packet.work_ref
        : packet.work_ref?.external_id,
    );
    assert.equal(
      receipt.compatibility.external_refs.some(
        (ref) =>
          ref.ref_type === "task_definition" &&
          ref.external_id === `${activePacketId}:task`,
      ),
      true,
    );
    assert.equal(
      receipt.source_refs.some(
        (ref) =>
          ref.ref_type === "state_transition_receipt" &&
          ref.external_id === manifest.transition_receipt_id &&
          ref.source_ref === manifest.transition_receipt_fingerprint,
      ),
      true,
    );
    assert.equal(
      receipt.compatibility.external_refs.some(
        (ref) =>
          ref.ref_type === "project_root_scope" &&
          ref.external_id === manifest.project_id &&
          /^sha256:[a-f0-9]{64}$/.test(ref.source_ref ?? ""),
      ),
      true,
    );
    assert.equal(
      receipt.compatibility.source_contracts.includes(
        "direct_native_host_round_trip.v0.1",
      ),
      true,
    );
    assert.equal(
      receipt.execution_environment.runtime_labels.includes("interactive"),
      true,
    );
    assert.equal(receipt.result_summary.outcome, "completed");
    assert.equal(receipt.privacy_egress.raw_prompt_persisted, false);
    assert.equal(receipt.privacy_egress.raw_output_persisted, false);
    assert.equal(receipt.privacy_egress.raw_transcript_persisted, false);
    assert.equal(receipt.privacy_egress.secret_material_persisted, false);
    assert.equal(JSON.stringify(receipt).includes(after.normalized_root), false);
    for (const [key, value] of Object.entries(receipt.authority_summary)) {
      if (key !== "notes") assert.equal(value, false, key);
    }
    result.direct_host_receipt_persisted = true;
    result.direct_host_packet_bound = true;
    record("active_project_direct_host_round_trip_persists_exact_packet_receipt");
    record("direct_host_round_trip_has_zero_copy_paste_or_internal_id_input");

    const liveProjectHomePath = await evaluateString("location.pathname");
    const liveRequestStart = requests.length;
    const liveResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-live-host-action="start"]');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(liveResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.type === "Fetch" &&
            entry.status === 202,
      ),
      "live Codex start acceptance",
    );
    const firstApprovalState = await waitForLiveRunStatus(
      manifest.project_id,
      "waiting_for_approval",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    assert(firstApprovalState.pending_approval);
    assert.equal(firstApprovalState.pending_approval.decision_submitted, false);
    await waitForCondition(
      `document.querySelector('[data-live-host-status="waiting_for_approval"] [data-live-host-approval="pending"]') !== null`,
      "live Codex command approval",
    );
    await waitForCondition(
      `document.querySelector('[data-current-host-run="waiting_for_approval"]') !== null`,
      "Project Home current nonterminal run",
    );
    await waitForHostCondition(
      () =>
        responses.slice(liveResponseStart).some(
          (entry) =>
            entry.path === liveProjectHomePath &&
            entry.type === "Fetch" &&
            entry.status === 200,
        ),
      "Project Home first approval server refresh",
    );
    result.live_codex_waiting_for_approval = true;
    result.project_home_current_run_visible = true;
    const pendingShape = await evaluateJson(`(() => {
      const action = document.querySelector('[data-direct-host-round-trip="v0.2"]');
      const approval = document.querySelector('[data-live-host-approval="pending"]');
      return {
        form_field_count: action?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        approval_present: Boolean(approval),
        approve_once_present: Boolean(document.querySelector('[data-live-host-action="approve-once"]')),
        raw_protocol_visible: document.body.textContent.includes('jsonrpc') || document.body.textContent.includes('OPENAI_API_KEY')
      };
    })()`);
    assert.deepEqual(pendingShape, {
      form_field_count: 0,
      approval_present: true,
      approve_once_present: true,
      raw_protocol_visible: false,
    });

    const firstApprovalResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-live-host-action="approve-once"]');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(firstApprovalResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.type === "Fetch" &&
            entry.status === 200,
      ),
      "live Codex first one-shot approval response",
    );
    const runningAfterFirstApproval = await waitForLiveRunStatus(
      manifest.project_id,
      "running",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    assert.equal(runningAfterFirstApproval.run_ref, firstApprovalState.run_ref);
    assert.equal(runningAfterFirstApproval.pending_approval, null);
    assert(
      runningAfterFirstApproval.control_revision >
        firstApprovalState.control_revision,
    );

    const secondApprovalRefreshStart = responses.length;
    writeFileSync(browserSecondApprovalReleasePath, "released\n", {
      mode: 0o600,
    });
    const secondApprovalState = await waitForLiveRunProjection(
      manifest.project_id,
      (state) =>
        state?.status === "waiting_for_approval" &&
        state.pending_approval !== null &&
        state.pending_approval.approval_ref !==
          firstApprovalState.pending_approval?.approval_ref,
      "second distinct approval",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    assert(secondApprovalState.pending_approval);
    assert.equal(secondApprovalState.run_ref, firstApprovalState.run_ref);
    assert.notEqual(
      secondApprovalState.pending_approval.approval_ref,
      firstApprovalState.pending_approval.approval_ref,
    );
    assert(
      secondApprovalState.control_revision >
        firstApprovalState.control_revision,
    );
    assert(
      secondApprovalState.pending_approval.control_revision >
        firstApprovalState.pending_approval.control_revision,
    );
    await waitForCondition(
      `document.querySelector('[data-live-host-status="waiting_for_approval"] [data-live-host-approval="pending"] [data-live-host-action="approve-once"]:not([disabled])') !== null`,
      "second live Codex command approval",
    );
    await waitForHostCondition(
      () =>
        responses.slice(secondApprovalRefreshStart).some(
          (entry) =>
            entry.path === liveProjectHomePath &&
            entry.type === "Fetch" &&
            entry.status === 200,
        ),
      "Project Home second approval server refresh",
    );
    result.live_codex_second_approval = true;
    result.project_home_approval_refresh_count = 2;

    const secondApprovalResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-live-host-action="approve-once"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(secondApprovalResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.type === "Fetch" &&
            entry.status === 200,
        ),
      "live Codex second one-shot approval response",
    );
    const runningAfterSecondApproval = await waitForLiveRunStatus(
      manifest.project_id,
      "running",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    assert.equal(runningAfterSecondApproval.run_ref, firstApprovalState.run_ref);
    assert.equal(runningAfterSecondApproval.pending_approval, null);
    assert(
      runningAfterSecondApproval.control_revision >
        secondApprovalState.control_revision,
    );
    const latestApprovalIssuedAtMs = assertLiveApprovalReceiptBindings({
      projectId: manifest.project_id,
      workspaceId: manifest.workspace_id,
      runRef: runningAfterSecondApproval.run_ref,
      packetId: activePacketId,
      packetFingerprint: activePacketFingerprint,
      expectedApprovalCount: 2,
    });
    await waitForHostCondition(
      () => Date.now() >= latestApprovalIssuedAtMs,
      "receipt clock after both durable approval requests",
    );
    writeFileSync(browserTerminalReleasePath, "released\n", { mode: 0o600 });
    await waitForLiveRunStatus(
      manifest.project_id,
      "completed",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    await waitForCondition(
      `document.querySelector('[data-live-host-status="completed"] [data-live-host-receipt="persisted"]') !== null`,
      "live Codex terminal receipt after approval",
    );
    result.live_codex_status = "completed";
    result.live_codex_approved_once = true;

    const liveRequests = requests
      .slice(liveRequestStart)
      .filter(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.method === "POST",
      );
    assert.equal(liveRequests.length, 3);
    assert.deepEqual(JSON.parse(liveRequests[0].post_data), {
      action: "start_live",
    });
    const approvalBodies = liveRequests
      .slice(1)
      .map((request) => JSON.parse(request.post_data));
    for (const approvalBody of approvalBodies) {
      assert.deepEqual(Object.keys(approvalBody).sort(), [
        "action",
        "approval_ref",
        "control_revision",
        "run_ref",
      ]);
      assert.equal(approvalBody.action, "approve_once");
      assert.equal(
        ["packet_json", "handoff_text", "result_text", "result_paste"].some(
          (key) => Object.hasOwn(approvalBody, key),
        ),
        false,
      );
    }
    assert.notEqual(
      approvalBodies[0].approval_ref,
      approvalBodies[1].approval_ref,
    );
    assert(
      approvalBodies[1].control_revision >
        approvalBodies[0].control_revision,
    );
    result.live_codex_no_internal_id_input = true;

    const liveAfter = readDirectHostBrowserState(manifest.project_id);
    assert.equal(
      liveAfter.direct_receipt_count,
      after.direct_receipt_count + 1,
    );
    assert.equal(liveAfter.direct_run_count, after.direct_run_count + 1);
    assert.deepEqual(liveAfter.semantic_authority_counts, {
      ...after.semantic_authority_counts,
      proposals: after.semantic_authority_counts.proposals + 1,
    });
    assert(liveAfter.latest_receipt);
    assert.equal(liveAfter.latest_receipt.result_summary.outcome, "completed");
    assert.equal(liveAfter.latest_receipt.privacy_egress.egress_status, "occurred");
    assert.equal(liveAfter.latest_receipt.privacy_egress.raw_prompt_persisted, false);
    assert.equal(liveAfter.latest_receipt.privacy_egress.raw_transcript_persisted, false);
    assert.equal(liveAfter.latest_receipt.model_invocations.length, 0);
    assert.equal(
      JSON.stringify(liveAfter.latest_receipt).includes(liveAfter.normalized_root),
      false,
    );
    result.live_codex_receipt_persisted = true;
    record("active_project_live_codex_refreshes_two_approval_boundaries_and_persists_one_receipt");
    record("live_codex_product_path_uses_zero_copy_paste_or_internal_id_entry");

    const expectedReviewHref = `/workbench/results/${liveAfter.latest_receipt.receipt_id.replace(":", "~")}`;
    await waitForCondition(
      `document.querySelector('[data-latest-run-result="completed"] [data-review-result-link="true"]')?.getAttribute('href') === ${JSON.stringify(expectedReviewHref)} && document.querySelector('[data-current-host-run]') === null`,
      "Project Home latest immutable terminal result",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-current-host-run]') === null`,
      ),
      true,
    );
    const latestResultShape = await evaluateJson(`(() => {
      const result = document.querySelector('[data-latest-run-result="completed"]');
      const link = result?.querySelector('[data-review-result-link="true"]');
      return {
        present: Boolean(result),
        href: link?.getAttribute('href') ?? '',
        has_summary: result?.textContent?.includes('The deterministic fake App Server completed the bounded live lifecycle.') ?? false,
        form_field_count: result?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
      };
    })()`);
    assert.deepEqual(latestResultShape, {
      present: true,
      href: expectedReviewHref,
      has_summary: true,
      form_field_count: 0,
    });
    result.project_home_latest_result_visible = true;
    record("project_home_distinguishes_latest_terminal_result_with_server_generated_review_link");

    database ??= new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    const beforeResultReview = databaseSnapshot(database);
    const resultResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector('[data-review-result-link="true"]');
        link?.click();
        return Boolean(link);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(expectedReviewHref)} && document.querySelector('[data-run-result-review="v0.1"][data-result-review-read-only="true"][data-semantic-mutation="false"]') !== null`,
      "read-only Workbench result review",
    );
    assert.equal(
      responses.slice(resultResponseStart).some(
        (entry) => entry.path === expectedReviewHref && entry.status === 200,
      ),
      true,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const inspector = document.querySelector('[data-run-result-inspector="v0.1"]');
        if (!(inspector instanceof HTMLDetailsElement)) return false;
        inspector.open = true;
        return inspector.open;
      })()`),
      true,
    );
    const resultReviewShape = await evaluateJson(`(() => {
      const review = document.querySelector('[data-run-result-review="v0.1"]');
      const inspector = document.querySelector('[data-run-result-inspector="v0.1"]');
      const assessment = review?.querySelector('[data-task-success-criteria="available"]');
      const proposal = review?.querySelector('[data-run-result-proposal="available"]');
      const criterionItems = assessment
        ? Array.from(assessment.querySelectorAll('[data-criterion-status]'))
        : [];
      const criterionDrilldowns = assessment
        ? Array.from(assessment.querySelectorAll('[data-criterion-source-drilldown="true"]'))
        : [];
      for (const drilldown of criterionDrilldowns) {
        if (drilldown instanceof HTMLDetailsElement) drilldown.open = true;
      }
      const text = review?.textContent ?? '';
      const assessmentText = assessment?.textContent ?? '';
      return {
        read_only: review?.getAttribute('data-result-review-read-only') === 'true',
        semantic_mutation: review?.getAttribute('data-semantic-mutation'),
        form_field_count: review?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        semantic_mutation_button_count: review
          ? Array.from(review.querySelectorAll('button')).filter((button) =>
              /proposal|decision|accept|commit|transition|evidence|close work/i.test(button.textContent ?? '')
            ).length
          : -1,
        inspector_open: inspector instanceof HTMLDetailsElement && inspector.open,
        lineage: text.includes('Identity and lineage') && text.includes('Packet fingerprint'),
        changes: text.includes('src/live-result.ts') && text.includes('Bounded fake result artifact.'),
        actions: text.includes('fake_app_server_turn_completed'),
        checks: text.includes('fake-live-check') && text.includes('validated_packet_delivery'),
        approvals: text.includes('Native host and approvals') && text.includes('explicit local operator'),
        model_coverage: text.includes('native host internal outside coverage'),
        trust_privacy: text.includes('Trust, coverage, and privacy') && text.includes('Raw prompt: not persisted'),
        authority_boundary: text.includes('No EpisodeDeltaProposal, ReviewDecision, semantic transition, Evidence acceptance, semantic state change, or work closure was created'),
        criterion_assessment_available: assessment !== null,
        execution_task_success_separated:
          assessment?.getAttribute('data-task-success-status') === 'unknown' &&
          assessmentText.includes('Execution completed / task success unknown'),
        criterion_count: criterionItems.length,
        criteria_unknown_insufficient: criterionItems.every(
          (item) =>
            item.getAttribute('data-criterion-status') === 'unknown' &&
            item.getAttribute('data-criterion-basis') === 'insufficient',
        ),
        criterion_source_counts: criterionItems.every((item) => {
          const sourceCountText = item.querySelector('small')?.textContent ?? '';
          return (
            sourceCountText.includes('0 supporting refs') &&
            sourceCountText.includes('0 opposing refs') &&
            sourceCountText.includes('0 criterion-specific missing refs')
          );
        }),
        criterion_source_drilldown:
          criterionDrilldowns.length === criterionItems.length &&
          criterionDrilldowns.every(
            (entry) => entry instanceof HTMLDetailsElement && entry.open,
          ),
        skipped_not_passed:
          assessmentText.includes('was skipped') &&
          !assessmentText.includes('skipped · passed'),
        task_wide_residue_visible:
          text.includes('Checks and skipped checks') &&
          text.includes('required · skipped') &&
          text.includes('Limitations and next steps') &&
          text.includes('No live provider was called') &&
          text.includes('Trust, coverage, and privacy') &&
          text.includes('native host internal outside coverage') &&
          assessmentText.includes('Task-wide receipt residue trust classes') &&
          assessmentText.includes('Task-wide operation coverage') &&
          assessmentText.includes('Task-wide receipt uncertainty'),
        unsupported_unavailable:
          assessment?.querySelector('[data-coverage-level="outside_coverage"]')?.textContent?.includes('unsupported / unavailable') === true,
        criterion_trust_distinct:
          assessmentText.includes('direct local observation') &&
          assessmentText.includes('verified external observation') &&
          assessmentText.includes('host attestation') &&
          assessmentText.includes('provider report') &&
          assessmentText.includes('derived interpretation'),
        criterion_authority_boundary:
          assessment?.getAttribute('data-assessment-authoritative') === 'false' &&
          assessmentText.includes('derived and non-authoritative') &&
          assessmentText.includes('creates no Evidence') &&
          assessmentText.includes('changes neither semantic state nor later context'),
        proposal_available:
          proposal !== null &&
          proposal.textContent?.includes('pending review') === true &&
          proposal.querySelector('[data-result-to-proposal-link="true"]') !== null,
        private_root_visible: text.includes(${JSON.stringify(liveAfter.normalized_root)}),
        packet_rendering_visible: text.includes(${JSON.stringify(packet.task.goal)}),
        raw_protocol_visible: /jsonrpc|raw diff must never be persisted|raw output must never be persisted|OPENAI_API_KEY/.test(text),
      };
    })()`);
    assert.deepEqual(resultReviewShape, {
      read_only: true,
      semantic_mutation: "false",
      form_field_count: 0,
      semantic_mutation_button_count: 0,
      inspector_open: true,
      lineage: true,
      changes: true,
      actions: true,
      checks: true,
      approvals: true,
      model_coverage: true,
      trust_privacy: true,
      authority_boundary: true,
      criterion_assessment_available: true,
      execution_task_success_separated: true,
      criterion_count: packet.task.success_criteria.length,
      criteria_unknown_insufficient: true,
      criterion_source_counts: true,
      criterion_source_drilldown: true,
      skipped_not_passed: true,
      task_wide_residue_visible: true,
      unsupported_unavailable: true,
      criterion_trust_distinct: true,
      criterion_authority_boundary: true,
      proposal_available: true,
      private_root_visible: false,
      packet_rendering_visible: false,
      raw_protocol_visible: false,
    });
    await validateWorkbenchResultViewports();
    result.workbench_result_review_read_only = true;
    result.result_inspector_complete = true;
    result.task_success_criterion_assessment = true;
    result.execution_task_success_separated = true;
    result.workbench_result_narrow_viewport_no_overflow = true;

    const reloadResponseStart = responses.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () =>
        responses.slice(reloadResponseStart).some(
          (entry) =>
            entry.path === expectedReviewHref &&
            entry.type === "Document" &&
            entry.status === 200,
        ),
      "reloaded durable Workbench result response",
    );
    await waitForCondition(
      `document.querySelector('[data-run-result-review="v0.1"][data-result-review-read-only="true"]') !== null`,
      "reloaded durable Workbench result",
    );
    assert.deepEqual(databaseSnapshot(database), beforeResultReview);
    assert.deepEqual(
      readDirectHostBrowserState(manifest.project_id).semantic_authority_counts,
      liveAfter.semantic_authority_counts,
    );
    result.workbench_result_reload_durable = true;
    result.result_review_semantic_authority_unchanged = true;
    result.native_host_clipboard_calls = await evaluateJson(
      "globalThis.__augnesNativeHostClipboardCalls ?? 0",
    );
    assert.equal(result.native_host_clipboard_calls, 0);
    result.semantic_proposals_created =
      liveAfter.semantic_authority_counts.proposals -
      before.semantic_authority_counts.proposals;
    result.review_decisions_created =
      liveAfter.semantic_authority_counts.decisions -
      before.semantic_authority_counts.decisions;
    result.semantic_transitions_created =
      liveAfter.semantic_authority_counts.transitions -
      before.semantic_authority_counts.transitions;
    assert.equal(result.semantic_proposals_created, 2);
    assert.equal(result.review_decisions_created, 0);
    assert.equal(result.semantic_transitions_created, 0);
    assert.equal(result.work_closures_created, 0);
    const beforeProposalReview = databaseSnapshot(database);
    const proposalNavigationStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector('[data-result-to-proposal-link="true"]');
        link?.click();
        return Boolean(link);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname.startsWith('/workbench/semantic-review/episode-delta-proposal~') && document.querySelector('[data-vnext-semantic-review-detail="v0.1"] [data-run-assessment-proposal="v0.1"]') !== null`,
      "result-linked run-assessment proposal detail",
    );
    assert.equal(
      responses.slice(proposalNavigationStart).some(
        (entry) =>
          entry.path.startsWith("/workbench/semantic-review/episode-delta-proposal~") &&
          entry.status === 200,
      ),
      true,
    );
    const proposalReviewShape = await evaluateJson(`(() => {
      const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const snapshot = detail?.querySelector('[data-run-assessment-proposal="v0.1"]');
      const criteria = snapshot
        ? Array.from(snapshot.querySelectorAll('[data-criterion-status]'))
        : [];
      const text = detail?.textContent ?? '';
      const snapshotText = snapshot?.textContent ?? '';
      return {
        pending_review: text.includes('pending_review'),
        execution_task_success:
          snapshot?.getAttribute('data-task-success-status') === 'unknown' &&
          snapshotText.includes('Execution completed / task success unknown'),
        criteria_unknown_insufficient:
          criteria.length === ${packet.task.success_criteria.length} &&
          criteria.every((item) =>
            item.getAttribute('data-criterion-status') === 'unknown' &&
            item.getAttribute('data-criterion-basis') === 'insufficient'
          ),
        criterion_refs_empty:
          criteria.every((item) => {
            const value = item.querySelector('small')?.textContent ?? '';
            return value.includes('0 supporting refs') &&
              value.includes('0 opposing refs') &&
              value.includes('0 criterion-specific missing refs');
          }),
        checks_and_skips:
          snapshotText.includes('fake-live-check') &&
          snapshotText.includes('skipped') &&
          !snapshotText.includes('skipped · passed'),
        artifacts: snapshotText.includes('src/live-result.ts'),
        coverage:
          snapshot?.querySelector('[data-coverage-level="outside_coverage"]')?.textContent?.includes('unsupported / unavailable') === true,
        trust:
          snapshotText.includes('Direct observations') &&
          snapshotText.includes('Host attestations') &&
          snapshotText.includes('Derived interpretations'),
        exact_lineage:
          snapshotText.includes('Exact packet') &&
          snapshotText.includes('Exact receipt') &&
          snapshotText.includes('Exact run'),
        no_decision_or_transition:
          text.includes('No ReviewDecision is persisted for this proposal') &&
          text.includes('not_applied'),
        non_authoritative:
          snapshot?.getAttribute('data-assessment-authoritative') === 'false' &&
          snapshotText.includes('creates no Evidence acceptance') &&
          snapshotText.includes('later-context change'),
      };
    })()`);
    assert.deepEqual(proposalReviewShape, {
      pending_review: true,
      execution_task_success: true,
      criteria_unknown_insufficient: true,
      criterion_refs_empty: true,
      checks_and_skips: true,
      artifacts: true,
      coverage: true,
      trust: true,
      exact_lineage: true,
      no_decision_or_transition: true,
      non_authoritative: true,
    });
    await validateSemanticReviewViewports();
    assert.deepEqual(databaseSnapshot(database), beforeProposalReview);
    result.result_to_proposal_navigation = true;
    result.proposal_assessment_snapshot = true;
    result.proposal_review_narrow_viewport_no_overflow = true;
    record("workbench_result_review_and_inspector_reload_from_immutable_durable_state");
    record("result_links_to_exact_pending_run_assessment_proposal_without_manual_ids");
    record("result_review_creates_no_proposal_decision_transition_evidence_or_work_closure");
  });

  const unexpectedConsoleErrors = consoleErrors.filter(
    (entry) =>
      !(
        (entry.path === "/favicon.ico" && /404/i.test(entry.text)) ||
        (entry.phase === "retired_routes" && /404|405/i.test(entry.text)) ||
        (entry.phase === "locked_workbench" &&
          entry.path?.startsWith("/api/vnext/operator/") &&
          /401/i.test(entry.text)) ||
        (entry.phase === "folder_onboarding" &&
          entry.path === "/api/vnext/projects" &&
          /409/i.test(entry.text)) ||
        (entry.phase === "folder_onboarding" &&
          entry.path === "/api/vnext/project-controls" &&
          /409/i.test(entry.text)) ||
        (entry.phase === "folder_onboarding" &&
          entry.path?.startsWith("/_next/") &&
          entry.text.includes("ERR_INCOMPLETE_CHUNKED_ENCODING")) ||
        (entry.phase === "folder_onboarding" &&
          /^\/_next\/static\/webpack\/webpack\.[a-f0-9]+\.hot-update\.js$/.test(
            entry.path ?? "",
          ) &&
          entry.text.includes("ERR_CONNECTION_REFUSED")) ||
        (entry.phase === "folder_onboarding" &&
          entry.path?.endsWith("/next/dist/client/dev/hot-reloader/app/web-socket.js") &&
          entry.text.includes("/_next/webpack-hmr") &&
          entry.text.includes("ERR_CONNECTION_REFUSED"))
      ),
  );
  const unexpectedFailedRequests = failedRequests.filter(
    (entry) =>
      entry.error_text !== "net::ERR_ABORTED" &&
      !(
        entry.phase === "folder_onboarding" &&
        entry.error_text === "net::ERR_INCOMPLETE_CHUNKED_ENCODING"
      ),
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
      ) &&
      !(
        request.phase === "folder_onboarding" &&
        request.path === "/api/vnext/projects"
      ) &&
      !(
        request.phase === "folder_onboarding" &&
        request.path === "/api/vnext/project-controls"
      ) &&
      !(
        request.phase === "direct_host_round_trip" &&
        request.path === "/api/vnext/projects"
      ) &&
      !(
        request.phase === "direct_host_round_trip" &&
        request.path === "/api/vnext/operator/host-round-trip"
      ) &&
      !(
        request.phase === "retired_routes" &&
        result.retired_routes_non_mutating === true
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

async function buildActualCompiledPacketFixture() {
  const completed = await runCapture(
    process.execPath,
    [
      "--import",
      "tsx",
      "scripts/build-vnext-operator-browser-fixture-v0-1.ts",
      fixtureDir,
      new Date().toISOString(),
    ],
    {
      cwd: process.cwd(),
      env: minimalProcessEnvironment(),
      timeoutMs: OPERATOR_FIXTURE_EXPORT_TIMEOUT_MS,
    },
  );
  assert.equal(
    completed.code,
    0,
    `operator browser fixture builder failed with exit ${completed.code}: ${completed.stderr.trim() || "no public error output"}`,
  );
  const summaryLine = completed.stdout.trim().split("\n").at(-1);
  assert(summaryLine, "operator browser fixture summary missing");
  return JSON.parse(summaryLine);
}

function databaseFileIdentityV01(databasePath) {
  const canonicalPath = realpathSync(databasePath);
  const entry = lstatSync(canonicalPath);
  assert.equal(entry.isSymbolicLink(), false);
  assert.equal(entry.isFile(), true);
  return {
    canonical_path_sha256: `sha256:${createHash("sha256")
      .update(canonicalPath)
      .digest("hex")}`,
    device: String(entry.dev),
    inode: String(entry.ino),
  };
}

function isolatedRuntimeEnvironment({ databasePath, manifest }) {
  const disposableHome = path.join(tempRoot, "home");
  mkdirSync(disposableHome, { recursive: true, mode: 0o700 });
  return {
    ...minimalProcessEnvironment(),
    HOME: disposableHome,
    USERPROFILE: disposableHome,
    TMPDIR: processTempRoot,
    TMP: processTempRoot,
    TEMP: processTempRoot,
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_RUNTIME_STATE_DIR: path.join(tempRoot, "runtime-state"),
    AUGNES_DB_PATH: databasePath,
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: tempRoot,
    AUGNES_TEST_FOLDER_PICKER_PATH: onboardingFolder,
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
    process.execPath,
    [
      runtimeSupervisor,
      "start",
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
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const writableDatabase = openVNextLocalOperatorDatabaseV01(config);
  try {
    const token = issueVNextLocalOperatorBootstrapV01(writableDatabase, {
      config,
    }).bootstrap_token;
    assert.match(token, /^vnext_bootstrap_v01\./);
    return token;
  } finally {
    writableDatabase.close();
  }
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

async function validateProjectHomeViewports() {
  for (const width of [390, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(100);
    const metrics = await evaluateJson(`(() => {
      const home = document.querySelector('[data-project-home="v0.1"]');
      const rect = home?.getBoundingClientRect();
      return {
        surface: 'minimum_project_home',
        width: window.innerWidth,
        document_scroll_width: document.documentElement.scrollWidth,
        document_client_width: document.documentElement.clientWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        home_scroll_width: home?.scrollWidth ?? -1,
        home_client_width: home?.clientWidth ?? -1,
        home_horizontal_overflow:
          (home?.scrollWidth ?? 0) > (home?.clientWidth ?? 0) + 1,
        home_inside_viewport:
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1
      };
    })()`);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.home_horizontal_overflow, false);
    assert.equal(metrics.home_inside_viewport, true);
    result.viewport_results.push(metrics);
  }
}

async function validateWorkbenchResultViewports() {
  for (const width of [390, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(100);
    const metrics = await evaluateJson(`(() => {
      const review = document.querySelector('[data-run-result-review="v0.1"]');
      const rect = review?.getBoundingClientRect();
      return {
        surface: 'workbench_run_result',
        width: window.innerWidth,
        document_scroll_width: document.documentElement.scrollWidth,
        document_client_width: document.documentElement.clientWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        review_scroll_width: review?.scrollWidth ?? -1,
        review_client_width: review?.clientWidth ?? -1,
        review_horizontal_overflow:
          (review?.scrollWidth ?? 0) > (review?.clientWidth ?? 0) + 1,
        review_inside_viewport:
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1
      };
    })()`);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.review_horizontal_overflow, false);
    assert.equal(metrics.review_inside_viewport, true);
    result.viewport_results.push(metrics);
  }
}

async function validateSemanticReviewViewports() {
  for (const width of [390, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(100);
    const metrics = await evaluateJson(`(() => {
      const review = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const rect = review?.getBoundingClientRect();
      return {
        surface: 'workbench_run_assessment_proposal',
        width: window.innerWidth,
        document_scroll_width: document.documentElement.scrollWidth,
        document_client_width: document.documentElement.clientWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        review_scroll_width: review?.scrollWidth ?? -1,
        review_client_width: review?.clientWidth ?? -1,
        review_horizontal_overflow:
          (review?.scrollWidth ?? 0) > (review?.clientWidth ?? 0) + 1,
        review_inside_viewport:
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1
      };
    })()`);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.review_horizontal_overflow, false);
    assert.equal(metrics.review_inside_viewport, true);
    result.viewport_results.push(metrics);
  }
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
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `(() => {
      let persistedCalls = 0;
      try {
        persistedCalls = Number(sessionStorage.getItem('__augnesNativeHostClipboardCalls') ?? '0');
      } catch {}
      globalThis.__augnesNativeHostClipboardCalls = persistedCalls;
      const clipboard = navigator.clipboard;
      if (!clipboard || typeof clipboard.writeText !== "function") return;
      const originalWriteText = clipboard.writeText.bind(clipboard);
      clipboard.writeText = async (...args) => {
        globalThis.__augnesNativeHostClipboardCalls += 1;
        try {
          sessionStorage.setItem('__augnesNativeHostClipboardCalls', String(globalThis.__augnesNativeHostClipboardCalls));
        } catch {}
        return originalWriteText(...args);
      };
    })();`,
  });
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
      const method = String(request.method ?? "GET").toUpperCase();
      requestMethods.set(String(event.params?.requestId ?? ""), method);
      requests.push({
        phase: currentPhase,
        method,
        path: classification.path,
        type: String(event.params?.type ?? "unknown"),
        post_data:
          typeof request.postData === "string" ? request.postData : null,
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
        method:
          requestMethods.get(String(event.params?.requestId ?? "")) ?? null,
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.loadingFailed") {
      requestMethods.delete(String(event.params?.requestId ?? ""));
      if (String(event.params?.type ?? "") === "WebSocket") return;
      failedRequests.push({
        phase: currentPhase,
        error_text: String(event.params?.errorText ?? "request_failed"),
      });
      lastRequestAt = Date.now();
      return;
    }
    if (event.method === "Network.loadingFinished") {
      requestMethods.delete(String(event.params?.requestId ?? ""));
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

async function waitForLiveRunStatus(projectId, expectedStatus, timeoutMs) {
  return waitForLiveRunProjection(
    projectId,
    (state) => state?.status === expectedStatus,
    `durable live Codex status ${expectedStatus}`,
    timeoutMs,
  );
}

async function waitForLiveRunProjection(
  projectId,
  predicate,
  label,
  timeoutMs,
) {
  const startedAt = Date.now();
  let lastStatus = "not_recorded";
  let lastReason = "not_recorded";
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const state = readLatestManagedLiveRunState(projectId);
      lastStatus = state?.status ?? "not_recorded";
      lastReason = state?.public_reason ?? "not_recorded";
      if (predicate(state)) return state;
      if (
        state?.reconciliation_required === true ||
        [
          "paused",
          "blocked",
          "completed",
          "failed",
          "cancelled",
          "timed_out",
        ].includes(lastStatus)
      ) {
        throw new Error(
          `Live Codex run reached ${lastStatus} (${lastReason}) before ${label}.`,
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Live Codex run reached ")
      ) {
        throw error;
      }
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      if (!["SQLITE_BUSY", "SQLITE_LOCKED"].includes(errorCode)) {
        throw new Error("Durable live Codex status could not be read safely.");
      }
    }
    await delay(100);
  }
  throw new Error(
    `Timed out waiting for ${label}; last status ${lastStatus} (${lastReason}).`,
  );
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

function seedExpiredProjectHomePacket({ projectId, marker }) {
  const writableDatabase = new Database(databasePath);
  try {
    writableDatabase.pragma("foreign_keys = ON");
    const project = writableDatabase
      .prepare(
        "SELECT workspace_id, project_id FROM vnext_project_identities WHERE project_id = ?",
      )
      .get(projectId);
    assert(project, "Browser Project Home fixture project must exist.");
    const input = structuredClone(genericCliBuilderInputFixture);
    const currentness = structuredClone(input.source_status.currentness);
    input.workspace_id = project.workspace_id;
    input.project_id = project.project_id;
    input.generated_at = TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT;
    input.expires_at = TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT;
    input.current_projection = {
      projection_kind: "current_working_perspective",
      projection_only: true,
      canonical_state: false,
      perspective_ref: "perspective:browser-expired-context",
      bounded_summary: marker,
      as_of: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
      items: [
        {
          item_kind: "frame",
          summary: marker,
          source_refs: ["source:browser-expired-context"],
          external_refs: [],
          currentness,
        },
      ],
      source_refs: ["source:browser-expired-context"],
      external_refs: [],
      currentness,
      warnings: [],
    };
    input.gaps = [];
    const packet = buildTaskContextPacketV01(input);
    insertVNextCoreRecordV01(writableDatabase, {
      record_kind: "task_context_packet",
      record_id: packet.packet_id,
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      fingerprint: packet.integrity.fingerprint,
      idempotency_key: null,
      payload: packet,
      created_at: packet.generated_at,
    });
  } finally {
    writableDatabase.close();
  }
}

function readProjectControlState(projectId) {
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const project = readableDatabase
      .prepare(
        "SELECT workspace_id, project_id FROM vnext_project_identities WHERE project_id = ?",
      )
      .get(projectId);
    assert(project, "Browser project-control fixture project must exist.");
    return {
      active: readableDatabase
        .prepare(
          "SELECT project_id, selection_revision FROM vnext_active_project_selections WHERE workspace_id = ?",
        )
        .get(project.workspace_id),
      automation:
        readableDatabase
          .prepare(
            "SELECT enabled, paused, revision FROM vnext_project_automation_controls WHERE workspace_id = ? AND project_id = ?",
          )
          .get(project.workspace_id, project.project_id) ?? null,
      personal_perspective:
        readableDatabase
          .prepare(
            "SELECT selection, revision FROM vnext_project_personal_perspective_scopes WHERE workspace_id = ? AND project_id = ?",
          )
          .get(project.workspace_id, project.project_id) ?? null,
    };
  } finally {
    readableDatabase.close();
  }
}

function readControlAuthorityCounts() {
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const count = (table, where = "") => {
      const exists = readableDatabase
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get(table);
      if (!exists) return 0;
      return Number(
        readableDatabase
          .prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)} ${where}`)
          .get().count,
      );
    };
    return {
      grants: count("autonomy_delegation_grants"),
      runs: count("vnext_core_records", "WHERE record_kind = 'run_receipt'") +
        count("autonomy_runs"),
      semantic_rows: count("vnext_semantic_state_entries"),
      personal_content: count("perspective_memory_items"),
    };
  } finally {
    readableDatabase.close();
  }
}

function readDirectHostBrowserState(projectId) {
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const receiptRows = readableDatabase
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'run_receipt'
           AND project_id = ?
         ORDER BY created_at ASC, record_id ASC`,
      )
      .all(projectId);
    const directReceipts = receiptRows
      .map((row) => JSON.parse(row.payload_json))
      .filter((receipt) =>
        receipt.compatibility?.source_contracts?.includes(
          "direct_native_host_round_trip.v0.1",
        ),
      );
    const packetRow = readableDatabase
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND record_id = ?
           AND project_id = ?`,
      )
      .get(result.active_packet_id ?? result.packet_id, projectId);
    const root = readableDatabase
      .prepare(
        `SELECT normalized_root
         FROM vnext_project_root_bindings
         WHERE project_id = ?`,
      )
      .get(projectId);
    const coreCount = (recordKind) =>
      Number(
        readableDatabase
          .prepare(
            `SELECT COUNT(*) AS count
             FROM vnext_core_records
             WHERE record_kind = ? AND project_id = ?`,
          )
          .get(recordKind, projectId).count,
      );
    const semanticStateCount = Number(
      readableDatabase
        .prepare(
          `SELECT COUNT(*) AS count
           FROM vnext_semantic_state_entries
           WHERE project_id = ?`,
        )
        .get(projectId).count,
    );
    return {
      direct_receipt_count: directReceipts.length,
      direct_run_count: Number(
        readableDatabase
          .prepare(
            `SELECT COUNT(*) AS count
             FROM autonomy_runs
             WHERE scope = ?
               AND autonomy_contract_ref = 'direct_native_host_round_trip.v0.1'`,
          )
          .get(projectId).count,
      ),
      semantic_authority_counts: {
        semantic_state: semanticStateCount,
        proposals: coreCount("episode_delta_proposal"),
        decisions: coreCount("review_decision"),
        commit_gates: coreCount("semantic_commit_gate"),
        transitions: coreCount("state_transition_receipt"),
      },
      latest_receipt: directReceipts.at(-1) ?? null,
      packet: packetRow ? JSON.parse(packetRow.payload_json) : null,
      normalized_root: String(root?.normalized_root ?? ""),
    };
  } finally {
    readableDatabase.close();
  }
}

function readLatestManagedLiveRunState(projectId) {
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const row = readableDatabase
      .prepare(
        `SELECT run_id, status, stop_reason, metadata_json
         FROM autonomy_runs
         WHERE scope = ?
           AND autonomy_contract_ref = 'direct_native_host_round_trip.v0.1'
           AND json_extract(metadata_json, '$.lifecycle_mode') = 'managed_live'
         ORDER BY created_at DESC, run_id DESC
         LIMIT 1`,
      )
      .get(projectId);
    if (!row) return null;
    const metadata = JSON.parse(row.metadata_json);
    const pendingApproval =
      metadata.pending_approval &&
      typeof metadata.pending_approval === "object" &&
      !Array.isArray(metadata.pending_approval)
        ? metadata.pending_approval
        : null;
    return {
      run_ref: String(row.run_id),
      status: String(row.status),
      control_revision: Number(metadata.control_revision ?? 0),
      reconciliation_required: metadata.reconciliation_required === true,
      public_reason:
        typeof metadata.public_reason === "string"
          ? metadata.public_reason
          : typeof row.stop_reason === "string"
            ? row.stop_reason
            : null,
      pending_approval: pendingApproval
        ? {
            approval_ref: String(pendingApproval.approval_id ?? ""),
            control_revision: Number(pendingApproval.control_revision ?? 0),
            decision_submitted: pendingApproval.decision_submitted === true,
          }
        : null,
      receipt_ref:
        typeof metadata.run_receipt_id === "string"
          ? metadata.run_receipt_id
          : null,
    };
  } finally {
    readableDatabase.close();
  }
}

function assertLiveApprovalReceiptBindings({
  projectId,
  workspaceId,
  runRef,
  packetId,
  packetFingerprint,
  expectedApprovalCount,
}) {
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const row = readableDatabase
      .prepare(
        `SELECT metadata_json
         FROM autonomy_runs
         WHERE run_id = ?
           AND scope = ?
           AND autonomy_contract_ref = 'direct_native_host_round_trip.v0.1'`,
      )
      .get(runRef, projectId);
    assert(row, "The repeated-approval run must remain project scoped.");
    const metadata = JSON.parse(row.metadata_json);
    const approvalRequests = Array.isArray(metadata.approval_requests)
      ? metadata.approval_requests
      : [];
    assert.equal(approvalRequests.length, expectedApprovalCount);
    assert(metadata.host_thread_ref);
    assert(metadata.host_turn_ref);
    let latestIssuedAtMs = 0;
    for (const request of approvalRequests) {
      assert.equal(request.workspace_id, workspaceId);
      assert.equal(request.project_id, projectId);
      assert.equal(request.run_id, runRef);
      assert.equal(request.packet_id, packetId);
      assert.equal(request.packet_fingerprint, packetFingerprint);
      assert.deepEqual(request.host_thread_ref, metadata.host_thread_ref);
      assert.deepEqual(request.host_turn_ref, metadata.host_turn_ref);
      const issuedAtMs = Date.parse(request.issued_at);
      assert.equal(Number.isFinite(issuedAtMs), true);
      latestIssuedAtMs = Math.max(latestIssuedAtMs, issuedAtMs);
    }
    return latestIssuedAtMs;
  } finally {
    readableDatabase.close();
  }
}

function databaseSnapshot(db) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
  const rows = Object.fromEntries(
    tables.map((table) => {
      const serialized = db
        .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
        .all()
        .map((row) => JSON.stringify(row))
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
  const canonical = JSON.stringify(rows);
  return {
    data_version: db.pragma("data_version", { simple: true }),
    integrity_check: db.pragma("integrity_check", { simple: true }),
    table_row_hash: createHash("sha256").update(canonical).digest("hex"),
    rows,
  };
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
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
    assert.equal(
      await canConnectToListener(address, port),
      false,
      `Next runtime unexpectedly accepted a non-loopback connection at ${address}:${port}`,
    );
  }
  record("next_runtime_listener_is_loopback_only");
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
  await terminateProcess(chromeProcess, 2_000);
  await terminateProcess(serverProcess, 15_000);
  chromeProcess = null;
  serverProcess = null;
  serverLog = "";
  await removeTemporaryRoots([tempRoot, processTempRoot]);
}

async function terminateProcess(child, gracefulTimeoutMs) {
  if (!child || childHasExited(child)) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await waitForChildExit(child, gracefulTimeoutMs);
  if (!childHasExited(child)) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
    await waitForChildExit(child, 2_000);
  }
}

function childHasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForChildExit(child, timeoutMs) {
  if (childHasExited(child)) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      child.off("exit", finish);
      resolve();
    };
    const timeout = setTimeout(finish, timeoutMs);
    child.once("exit", finish);
  });
}

async function removeTemporaryRoots(roots) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
    await delay(100);
  }
  for (const root of roots) rmSync(root, { recursive: true, force: true });
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
