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
} from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";

import {
  TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  buildTaskContextPacketHandoffHrefV01,
  decodeTaskContextPacketHandoffSlugV01,
} from "../lib/vnext/task-context-packet-handoff.ts";
import {
  TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  genericCliBuilderInputFixture,
} from "../fixtures/vnext/protocol/task-context-packet-v0-1.ts";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store.ts";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet.ts";

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
const processTempRoot = mkdtempSync(path.join(tmpdir(), "ag-e2e-"));
const fixtureDir = path.join(tempRoot, "fixture");
const chromeProfileDir = path.join(tempRoot, "chrome-profile");
const manifestPath = path.join(
  fixtureDir,
  "operator-pilot-browser-fixture.json",
);
const databasePath = path.join(fixtureDir, "operator-pilot.db");
const onboardingFolder = path.join(tempRoot, "Browser Onboarding Project");
const onboardingFolderB = path.join(tempRoot, "Browser Second Project");
const appRepo = realpathSync(process.cwd());
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
  fixture_source: "disposable_operator_pilot_compile_result",
  app_repo: appRepo,
  proposal_id: null,
  proposal_fingerprint: null,
  packet_id: null,
  packet_fingerprint: null,
  handoff_href: null,
  document_status: null,
  handoff_api_status: null,
  project_home_exact_href: false,
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
  overview_compatibility_reachable: false,
  proposal_list_document_status: null,
  proposal_detail_document_status: null,
  workbench_lineage_status: null,
  workbench_exact_persisted_lineage: false,
  workbench_exact_handoff_href: false,
  workbench_refresh_read_only: false,
  viewport_results: [],
  viewport_warnings: [],
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

  const fixtureSummary = await exportActualCompiledPacketFixture();
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.fixture_version, "vnext_operator_pilot_browser_fixture.v0.1");
  assert.equal(manifest.credential_material_included, false);
  assert.equal(manifest.external_identity_authenticated, false);
  assert.equal(manifest.semantic_authority_granted, false);
  assert.deepEqual(
    manifest.database_identity,
    databaseFileIdentityV01(databasePath),
  );
  assert.equal(manifest.database_binding, "copied_fixture");
  assert.equal(manifest.database_file, path.basename(databasePath));
  assert.equal(fixtureSummary.status, "pass");
  assert.equal(fixtureSummary.default_database_accessed, false);
  assert.equal(fixtureSummary.external_network_calls, 0);
  assert.equal(fixtureSummary.browser_fixture_export?.exported, true);
  assert.deepEqual(fixtureSummary.full_loop_proposal, {
    proposal_id: manifest.proposal_id,
    proposal_fingerprint: manifest.proposal_fingerprint,
  });
  assert.equal(fixtureSummary.full_loop_anchors?.later_packet_id, manifest.packet_id);
  assert.equal(
    fixtureSummary.full_loop_anchors?.later_packet_fingerprint,
    manifest.packet_fingerprint,
  );
  assert.equal(
    fixtureSummary.full_loop_anchors?.transition_receipt_id,
    manifest.transition_receipt_id,
  );
  assert.equal(
    fixtureSummary.full_loop_anchors?.later_run_receipt_id,
    manifest.later_result_receipt_id,
  );
  assert.equal(
    fixtureSummary.full_loop_anchors?.context_use_review_id,
    manifest.context_use_review_id,
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

  result.proposal_id = manifest.proposal_id;
  result.proposal_fingerprint = manifest.proposal_fingerprint;
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

  await runPhase("project_home", async () => {
    await navigate(`${appOrigin}/overview`);
    await waitForCondition(
      `document.querySelector('[data-vnext-project-continuity="loaded"]') !== null`,
      "loaded Project Home continuity",
    );
    result.overview_compatibility_reachable = true;
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

  let proposalHref = null;
  await runPhase("proposal_list", async () => {
    const responseStart = responses.length;
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-list="v0.1"]') !== null`,
      "Semantic Workbench proposal list",
    );
    result.proposal_list_document_status = documentStatusSince(
      responseStart,
      "/workbench/semantic-review",
    );
    assert.equal(result.proposal_list_document_status, 200);
    proposalHref = await evaluateString(`(() => {
      const card = Array.from(document.querySelectorAll('[data-vnext-proposal-id]')).find(
        (candidate) => candidate.getAttribute('data-vnext-proposal-id') === ${JSON.stringify(manifest.proposal_id)}
      );
      return card?.querySelector('a[href]')?.getAttribute('href') ?? '';
    })()`);
    assert.match(proposalHref, /^\/workbench\/semantic-review\//);
    record("actual_proposal_detail_href_followed_from_workbench_dom");
  });

  let workbenchHandoffHref = null;
  let proposalPathname = null;
  await runPhase("proposal_durable_lineage", async () => {
    proposalPathname = new URL(proposalHref, appOrigin).pathname;
    const responseStart = responses.length;
    await navigate(`${appOrigin}${proposalHref}`);
    await waitForCondition(
      `document.querySelector('[data-vnext-durable-lineage="v0.1"][data-vnext-lineage-status="reviewed"]') !== null`,
      "reviewed Workbench durable lineage",
    );
    result.proposal_detail_document_status = documentStatusSince(
      responseStart,
      proposalPathname,
    );
    assert.equal(result.proposal_detail_document_status, 200);
    const lineageState = await evaluateJson(`(() => {
      const panel = document.querySelector('[data-vnext-durable-lineage="v0.1"]');
      const text = panel?.textContent ?? '';
      const exactLink = Array.from(panel?.querySelectorAll('a[href]') ?? []).find(
        (candidate) => candidate.textContent?.trim() === 'Open exact packet handoff'
      );
      return {
        status: panel?.getAttribute('data-vnext-lineage-status') ?? '',
        packet_id: panel?.getAttribute('data-vnext-lineage-packet-id') ?? '',
        later_result_id: panel?.getAttribute('data-vnext-lineage-later-result-id') ?? '',
        context_review_id: panel?.getAttribute('data-vnext-lineage-context-review-id') ?? '',
        exact_handoff_href: exactLink?.getAttribute('href') ?? '',
        proposal_present: (document.body?.innerText ?? '').includes(${JSON.stringify(manifest.proposal_id)}) && (document.body?.innerText ?? '').includes(${JSON.stringify(manifest.proposal_fingerprint)}),
        transition_present: text.includes(${JSON.stringify(manifest.transition_receipt_id)}) && text.includes(${JSON.stringify(manifest.transition_receipt_fingerprint)}),
        packet_present: text.includes(${JSON.stringify(manifest.packet_id)}) && text.includes(${JSON.stringify(manifest.packet_fingerprint)}),
        result_present: text.includes(${JSON.stringify(manifest.later_result_receipt_id)}) && text.includes(${JSON.stringify(manifest.later_result_receipt_fingerprint)}),
        review_present: text.includes(${JSON.stringify(manifest.context_use_review_id)}) && text.includes(${JSON.stringify(manifest.context_use_review_fingerprint)}),
        credential_names_present: /bootstrap_token_hash|session_token_hash|action_nonce_hash/.test(document.documentElement.innerHTML)
      };
    })()`);
    assert.deepEqual(lineageState, {
      status: "reviewed",
      packet_id: manifest.packet_id,
      later_result_id: manifest.later_result_receipt_id,
      context_review_id: manifest.context_use_review_id,
      exact_handoff_href: handoffHref,
      proposal_present: true,
      transition_present: true,
      packet_present: true,
      result_present: true,
      review_present: true,
      credential_names_present: false,
    });
    workbenchHandoffHref = lineageState.exact_handoff_href;
    result.workbench_lineage_status = lineageState.status;
    result.workbench_exact_persisted_lineage = true;
    result.workbench_exact_handoff_href = true;
    record("workbench_renders_exact_persisted_m3d_durable_lineage");
  });

  database = new Database(databasePath, { readonly: true, fileMustExist: true });
  await validateProposalViewports();
  const beforeWorkbenchRefresh = databaseSnapshot(database);
  const workbenchRequestStart = requests.length;
  const workbenchResponseStart = responses.length;
  await runPhase("proposal_read_only_refresh", async () => {
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () =>
        responses
          .slice(workbenchResponseStart)
          .some(
            (entry) =>
              entry.path === proposalPathname &&
              entry.type === "Document" &&
              entry.status === 200,
          ),
      "refreshed proposal document response",
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-durable-lineage="v0.1"][data-vnext-lineage-status="reviewed"]') !== null`,
      "refreshed Workbench durable lineage",
    );
  });
  assert.deepEqual(databaseSnapshot(database), beforeWorkbenchRefresh);
  assert.equal(
    requests
      .slice(workbenchRequestStart)
      .some((request) => request.method === "POST"),
    false,
  );
  result.workbench_refresh_read_only = true;
  record("workbench_lineage_refresh_is_get_only_and_database_stable");

  await runPhase("canonical_handoff_navigation", async () => {
    const responseStart = responses.length;
    assert.equal(workbenchHandoffHref, handoffHref);
    await navigate(`${appOrigin}${workbenchHandoffHref}`);
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
          /409/i.test(entry.text)) ||
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
    process.execPath,
    ["--import", "tsx", "scripts/smoke-vnext-operator-pilot-v0-1.ts"],
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
    `operator-pilot fixture export failed with exit ${completed.code}: ${completed.stderr.trim() || "no public error output"}`,
  );
  const jsonStart = completed.stdout.indexOf("{\n");
  assert(jsonStart >= 0, "operator-pilot smoke summary missing");
  return JSON.parse(completed.stdout.slice(jsonStart));
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
  assert.equal(
    completed.code,
    0,
    `bootstrap issuance failed: ${completed.stderr.trim() || "no public error output"}`,
  );
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

async function validateProposalViewports() {
  for (const width of [390, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await delay(100);
    const metrics = await evaluateJson(`(() => {
      const panel = document.querySelector('[data-vnext-durable-lineage="v0.1"]');
      const rect = panel?.getBoundingClientRect();
      return {
        width: window.innerWidth,
        document_scroll_width: document.documentElement.scrollWidth,
        document_client_width: document.documentElement.clientWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        panel_scroll_width: panel?.scrollWidth ?? -1,
        panel_client_width: panel?.clientWidth ?? -1,
        panel_horizontal_overflow:
          (panel?.scrollWidth ?? 0) > (panel?.clientWidth ?? 0) + 1,
        panel_inside_viewport:
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        credential_names_present:
          /bootstrap_token_hash|session_token_hash|action_nonce_hash/.test(document.documentElement.innerHTML)
      };
    })()`);
    assert.equal(metrics.width, width);
    assert.equal(metrics.panel_horizontal_overflow, false);
    assert.equal(metrics.panel_inside_viewport, true);
    assert.equal(metrics.credential_names_present, false);
    result.viewport_results.push(metrics);
    if (metrics.document_horizontal_overflow) {
      result.viewport_warnings.push({
        width,
        warning:
          "Known proposal-detail document overflow remains outside the durable-lineage panel; the new panel itself has no horizontal overflow.",
      });
    }
  }
  record("workbench_lineage_panel_fits_390_768_and_1440_viewports");
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
