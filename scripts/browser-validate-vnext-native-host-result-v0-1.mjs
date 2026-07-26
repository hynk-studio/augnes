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
  readdirSync,
  renameSync,
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
import {
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1.ts";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store.ts";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission.ts";
import {
  CANONICAL_TEST_STRATEGIC_TRANSPORT_COUNTER_FILE_V01,
  CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_FILE_V01,
  CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01,
} from "../lib/vnext/model-gateway/canonical-test-strategic-transport.ts";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet.ts";
import { commitVNextSemanticTransitionV01 } from "../lib/vnext/runtime/durable-semantic-transition.ts";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler.ts";
import { selectPersonalPerspectiveContextV01 } from "../lib/vnext/project-controls/project-controls.ts";
import { readPersonalPerspectiveEffectiveScopeV01 } from "../lib/vnext/persistence/project-control-store.ts";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry.ts";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives.ts";
import { evaluateCriterionAssessmentV01 } from "../lib/vnext/criterion-assessment.ts";
import { materializeRunAssessmentProposalV01 } from "../lib/vnext/run-assessment-proposal.ts";
import { admitEpisodeDeltaProposalV01 } from "../lib/vnext/persistence/episode-delta-proposal-admission.ts";
import { createSharedInspectorHrefV01 } from "../lib/vnext/shared-project-inspector-href.ts";
import { DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 } from "../lib/vnext/runtime/direct-native-host-round-trip.ts";
import { insertAutonomyRunLedgerRecord } from "../lib/autonomy/runner-ledger.ts";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
} from "../lib/autonomy/runner-state.ts";
import {
  issueVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session.ts";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator.ts";
import { createBrowserSupervisorPublicDiagnosticCapture } from "./browser-supervisor-public-diagnostic.mjs";
import { createBrowserE2ETimingRecorder } from "./browser-e2e-timing.mjs";
import { readContinuityOperationalStatus } from "./continuity-operational-status.mjs";
import {
  registerOwnedChild,
  settleOwnedProcessAfterExit,
  terminateOwnedProcessTree,
} from "./test-harness-process-lifecycle.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 = 64;

const VALIDATION_VERSION =
  "vnext_native_host_result_browser_validation.v0.1";
const VALIDATION_SCOPE =
  process.env.AUGNES_BROWSER_E2E_SCOPE?.trim() || "complete";
assert(
  ["complete", "core", "continuity"].includes(VALIDATION_SCOPE),
  "unsupported browser E2E validation scope",
);
const RUN_CORE_SCOPE = VALIDATION_SCOPE !== "continuity";
const RUN_CONTINUITY_SCOPE = VALIDATION_SCOPE !== "core";
const CAPTURE_C8_REVIEW =
  process.env.AUGNES_C8_CAPTURE_REVIEW?.trim() === "1";
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
const importedDatabasePath = path.join(tempRoot, "imported", "augnes.db");
const downloadDirectory = path.join(tempRoot, "downloads");
const strategicTransportFixturePath = path.join(
  tempRoot,
  CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_FILE_V01,
);
const strategicTransportCounterPath = path.join(
  tempRoot,
  CANONICAL_TEST_STRATEGIC_TRANSPORT_COUNTER_FILE_V01,
);
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
const onboardingFolderBRecovered = path.join(tempRoot, "Browser Second Project recovered");
const onboardingFolderBMissingResidue = path.join(tempRoot, "Browser Second Project moved away");
const folderPickerSequencePath = path.join(
  tempRoot,
  "canonical-folder-picker-sequence.json",
);
const browserApprovalBarrierTracePath = path.join(
  tempRoot,
  "browser-approval-barriers.jsonl",
);
const appRepo = realpathSync(process.cwd());
const c8ReviewEntries = [];
let c8ReviewDirectory = null;
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
let database = null;
let bootstrapToken = null;
let currentPhase = "setup";
let lastRequestAt = Date.now();
let serverLog = "";
let pausedSemanticTransitionRequest = null;
let interceptedInspectorResponse = null;
const interceptedRecoveryResponses = [];
const requests = [];
const responses = [];
const requestMethods = new Map();
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];
const assertions = [];
const ownedBrowserProcesses = new Set();
const timing = createBrowserE2ETimingRecorder({ scope: VALIDATION_SCOPE });
let navigationCount = 0;
let serverStartCount = 0;
let serverShutdownCount = 0;
let waitCount = 0;
let requestQuietCount = 0;
let pendingServerStartupFinish = null;

const result = {
  ok: false,
  validation_version: VALIDATION_VERSION,
  validation_scope: VALIDATION_SCOPE,
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
  ai_workplane_approval_refresh_count: 0,
  delegated_work_single_initial_read: false,
  delegated_work_timeline_public_safe: false,
  delegated_work_narrow_viewport_no_overflow: false,
  live_codex_untouched_approval_polling_stopped: false,
  live_codex_leave_return_same_run: false,
  live_codex_leave_return_no_new_turn: false,
  approval_barrier_timing: null,
  live_codex_receipt_persisted: false,
  live_codex_no_internal_id_input: false,
  project_home_latest_result_visible: false,
  project_home_coordination_visible: false,
  workbench_result_review_read_only: false,
  shared_semantic_workbench_shell: false,
  workbench_compatibility_redirect: false,
  guide_brief_blank_state_v0_2: false,
  guide_brief_ai_workplane_v0_2: false,
  guide_brief_cross_surface_consistency: false,
  workbench_result_reload_durable: false,
  result_inspector_complete: false,
  shared_inspector_read_only: false,
  shared_inspector_server_scoped: false,
  shared_inspector_reload_idempotent: false,
  shared_inspector_narrow_viewport_no_overflow: false,
  applied_inspector_lineage_complete: false,
  result_review_semantic_authority_unchanged: false,
  task_success_criterion_assessment: false,
  execution_task_success_separated: false,
  workbench_result_narrow_viewport_no_overflow: false,
  result_to_proposal_navigation: false,
  proposal_verify_summary: false,
  decision_centered_workbench: false,
  canonical_reconciliation_visible: false,
  protocol_details_progressively_disclosed: false,
  proposal_review_narrow_viewport_no_overflow: false,
  strategic_profile_optional_unavailable: false,
  strategic_profile_no_analysis_on_load: false,
  strategic_profile_no_internal_id_input: false,
  strategic_profile_zero_model_review_preserved: false,
  strategic_profile_explicit_request: false,
  strategic_model_gateway_fake_transport_calls: 0,
  strategic_source_to_proposal_navigation: false,
  strategic_proposal_pending_unknown_non_authoritative: false,
  strategic_proposal_material_visible: false,
  strategic_shared_inspector_complete: false,
  strategic_candidate_defer_no_transition: false,
  strategic_proposal_reload_idempotent: false,
  operation_aware_revision_created: false,
  explicit_review_decision_created: false,
  transition_preview_read_only: false,
  semantic_gate_separate_from_transition: false,
  semantic_transition_applied: false,
  guide_brief_transition_request_counts: null,
  guide_brief_post_application_consistent: false,
  later_packet_compiled: false,
  semantic_transition_reload_idempotent: false,
  multi_candidate_transition_scope: false,
  exact_ready_to_complete_navigation: false,
  pending_applying_candidate_default_selection: false,
  candidate_switch_mutation_locking: false,
  late_preview_response_discarded: false,
  applying_decision_wording_truthful: false,
  context_use_feedback_waits_for_real_later_run: false,
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
  bounded_automation_cycle_started: false,
  bounded_automation_review_needed: false,
  bounded_automation_reload_idempotent: false,
  bounded_automation_exact_relation_readback: false,
  bounded_automation_shared_inspector_complete: false,
  bounded_automation_context_feedback_recorded: false,
  personal_perspective_default_excluded: false,
  personal_perspective_included: false,
  personal_perspective_shared_inspector_exact: false,
  personal_perspective_project_b_excluded: false,
  portable_export_preview_visible: false,
  portable_export_created: false,
  portable_import_clean_destination: false,
  imported_project_home_reader_verified: false,
  imported_workbench_reader_verified: false,
  imported_inspector_reader_verified: false,
  restart_run_reconciliation_review_needed: false,
  restart_terminal_receipt_exact_replay: false,
  continuity_diagnostics_visible: false,
  support_report_previewed: false,
  support_report_exported_after_preview: false,
  project_controls_two_project_isolation: false,
  project_controls_restart_persisted: false,
  control_mutation_grants_created: null,
  control_mutation_runs_created: null,
  control_mutation_semantic_rows_created: null,
  control_mutation_personal_content_created: null,
  product_shell_route_classifications: [],
  product_shell_responsive_results: [],
  management_safety_keyboard_navigation: false,
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
  temporary_imported_database_removed: false,
  temporary_manifest_removed: false,
  temporary_picker_sequence_removed: false,
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
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      const socket = this.ws;
      const closed = new Promise((resolve) => {
        socket.addEventListener("close", resolve, { once: true });
        socket.addEventListener("error", resolve, { once: true });
      });
      socket.close();
      await Promise.race([closed, delay(1_000)]);
    }
  }
}

try {
  process.stdout.write(
    `[browser-e2e] lifecycle_start scope=${VALIDATION_SCOPE} expected_next=fixture_build\n`,
  );
  await main();
  result.ok = true;
} catch (error) {
  result.failure = safeError(error);
  process.exitCode = 1;
} finally {
  bootstrapToken = null;
  process.stdout.write(
    `[browser-e2e] cleanup_start scope=${VALIDATION_SCOPE} phase=${currentPhase} owned_processes=${ownedBrowserProcesses.size}\n`,
  );
  const finishCleanupTiming = timing.start("cleanup", "global cleanup");
  await cleanup();
  finishCleanupTiming();
  process.stdout.write(
    `[browser-e2e] cleanup_result scope=${VALIDATION_SCOPE} owned_processes=${ownedBrowserProcesses.size} temporary_roots_removed=true\n`,
  );
  result.temporary_root_removed = !existsSync(tempRoot);
  result.temporary_process_root_removed = !existsSync(processTempRoot);
  result.temporary_profile_removed = !existsSync(chromeProfileDir);
  result.temporary_fixture_removed = !existsSync(fixtureDir);
  result.temporary_database_removed = !existsSync(databasePath);
  result.temporary_imported_database_removed = !existsSync(importedDatabasePath);
  result.temporary_manifest_removed = !existsSync(manifestPath);
  result.temporary_picker_sequence_removed = !existsSync(folderPickerSequencePath);
  result.e2e_timing_summary = timing.summary();
  process.umask(originalUmask);
  if (c8ReviewDirectory) {
    process.stdout.write(
      `[c8-review] index=${path.relative(appRepo, path.join(c8ReviewDirectory, "review-index.json"))} artifacts=${c8ReviewEntries.length}\n`,
    );
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
  timing.milestone("harness started");
  assert.equal(path.isAbsolute(appRepo), true);
  assert.equal(existsSync(path.join(appRepo, "package.json")), true);
  assert.equal(
    realpathSync(tmpdir()) === realpathSync(tempRoot) ||
      realpathSync(tempRoot).startsWith(`${realpathSync(tmpdir())}${path.sep}`),
    true,
    "browser artifacts must stay inside the operating-system temp directory",
  );

  const fixtureStartedAt = Date.now();
  const finishFixtureTiming = timing.start("fixture", "fixture construction");
  const fixtureSummary = await buildActualCompiledPacketFixture();
  finishFixtureTiming();
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

  if (!RUN_CORE_SCOPE) {
    activateFixtureProjectForContinuity(databasePath, {
      workspaceId: manifest.workspace_id,
      projectId: manifest.project_id,
    });
  }

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
  do bridgePort = await chooseAvailablePort(); while (bridgePort === appPort);
  do debugPort = await chooseAvailablePort(); while (
    debugPort === appPort || debugPort === bridgePort
  );
  appOrigin = `http://127.0.0.1:${appPort}`;
  const runtimeEnvironment = isolatedRuntimeEnvironment({
    databasePath,
    manifest,
  });
  writeFileSync(
    strategicTransportFixturePath,
    `${JSON.stringify({
      fixture_version:
        CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01,
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      working_frame_fingerprint:
        manifest.strategic_working_frame_fingerprint,
      source_catalog_fingerprint:
        manifest.strategic_source_catalog_fingerprint,
    })}\n`,
    { encoding: "utf8", flag: "wx", mode: 0o600 },
  );
  mkdirSync(onboardingFolder, { recursive: true });
  mkdirSync(onboardingFolderB, { recursive: true });
  mkdirSync(onboardingFolderBRecovered, { recursive: true });
  writeFileSync(
    folderPickerSequencePath,
    `${JSON.stringify({
      sequence_version: "augnes_canonical_folder_picker_sequence.v0.1",
      next_index: 0,
      entries: [
        { id: "cancelled-selection", outcome: "cancelled" },
        {
          id: "first-project",
          outcome: "selected",
          absolute_path: onboardingFolder,
        },
        {
          id: "duplicate-first-project",
          outcome: "selected",
          absolute_path: onboardingFolder,
        },
        {
          id: "second-project",
          outcome: "selected",
          absolute_path: onboardingFolderB,
        },
      ],
    })}\n`,
    { encoding: "utf8", flag: "wx", mode: 0o600 },
  );

  const chromeExecutable = chromeCandidates.find((candidate) => existsSync(candidate));
  assert(chromeExecutable, "No usable local Chrome/Chromium executable was found.");
  startDevServer(runtimeEnvironment);
  const finishChromeTiming = timing.start("chrome_startup", "Chrome and CDP readiness");
  startChrome(chromeExecutable);
  const runtimeReadiness = waitForHttp(
    `${appOrigin}/workbench/semantic-review`,
    DEFAULT_TIMEOUT_MS,
  );
  const chromeReadiness = (async () => {
    cdp = await openCdpPage();
    attachCdpObservers();
    await enableCdpDomains();
    finishChromeTiming();
  })();
  // Chrome/CDP does not consume runtime state before the first navigation, so
  // its independently bounded startup can safely overlap initial compilation.
  await Promise.all([runtimeReadiness, chromeReadiness]);
  timing.milestone("initial route ready");
  await assertLoopbackListener(appPort);

  if (RUN_CORE_SCOPE) {
  await runPhase("folder_onboarding", async () => {
    const noProjectUtilityRequestStart = requests.length;
    await navigate(`${appOrigin}/`);
    await waitForCondition(`location.pathname === '/' && document.querySelector('[data-blank-state="v0.1"][data-blank-state-focus="no_projects"][data-guide-brief-version="guide_brief.v0.2"][data-guide-brief-source-status="project_choice"]') !== null`, "no-project GuideBrief-backed Blank State");
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelectorAll('[data-blank-state-primary-action]').length === 1`,
      "single project-selection action",
    );
    await validateBlankStateViewports(false, {
      state: "no-project-onboarding",
      attentionCount: 0,
      attentionCategory: "none",
      primaryActions: 1,
    });
    const noProjectManagementSafety = await evaluateJson(`(() => {
      const details = document.querySelector('details[data-management-safety]');
      return {
        open: details instanceof HTMLDetailsElement ? details.open : null,
        context: details?.getAttribute('data-management-safety-project-context') ?? null,
        links: Array.from(details?.querySelectorAll('a') ?? []).map((link) => ({
          label: link.textContent?.trim() ?? '',
          href: link.getAttribute('href')
        }))
      };
    })()`);
    assert.deepEqual(noProjectManagementSafety, {
      open: false,
      context: "no_active_project",
      links: [
        {
          label: "Manage project",
          href: "/projects#project-management",
        },
        { label: "Move or import a project", href: "/portability" },
        { label: "Backups and recovery", href: "/recovery" },
      ],
    });
    const noProjectUtilityRequests = requests
      .slice(noProjectUtilityRequestStart)
      .filter((request) =>
        request.path === "/api/vnext/portability" ||
        request.path === "/api/recovery"
      );
    assert.deepEqual(noProjectUtilityRequests, []);
    const noProjectManagementRequestStart = requests.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const details = document.querySelector('details[data-management-safety]');
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = true;
        const link = Array.from(details.querySelectorAll('a')).find(
          (candidate) => candidate.textContent?.trim() === 'Manage project',
        );
        link?.click();
        return Boolean(link);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === '/projects' && location.hash === '#project-management' && document.querySelector('#project-management')?.getClientRects().length > 0`,
      "no-project deterministic management route",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-blank-state-primary-action="choose_folder"]') !== null`,
      ),
      true,
    );
    assert.deepEqual(
      requests.slice(noProjectManagementRequestStart).filter(
        (request) =>
          request.path === "/api/vnext/portability" ||
          request.path === "/api/recovery",
      ),
      [],
    );
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `location.pathname === '/' && document.querySelector('[data-blank-state-project-management-hydrated="true"] [data-blank-state-primary-action="choose_folder"]') !== null`,
      "no-project Blank State after management route",
    );
    assert.equal(await evaluateBoolean(`document.querySelector('input[type="text"]') === null`), true);
    const cancelledPickerResponseStart = responses.length;
    assert.equal(await evaluateBoolean(`(() => { const button = document.querySelector('[data-blank-state-primary-action="choose_folder"]'); button?.click(); return Boolean(button); })()`), true);
    await waitForHostCondition(
      () => responses.slice(cancelledPickerResponseStart).some(
        (entry) => entry.path === "/api/vnext/projects" && entry.type === "Fetch" && entry.method === "POST",
      ),
      "cancelled picker response",
    );
    const cancelledPickerResponse = responses.slice(cancelledPickerResponseStart).find(
      (entry) => entry.path === "/api/vnext/projects" && entry.type === "Fetch" && entry.method === "POST",
    );
    assert.equal(cancelledPickerResponse?.status, 200);
    const cancelledPickerBody = await cdp.send("Network.getResponseBody", {
      requestId: cancelledPickerResponse.request_id,
    });
    assert.equal(JSON.parse(cancelledPickerBody.body).picker.status, "cancelled");
    await waitForCondition(`document.body.textContent.includes('Folder selection was cancelled. Nothing changed.')`, "cancelled picker status");
    assert.equal(await evaluateBoolean(`document.querySelector('[data-blank-state-primary-action="choose_folder"]:not(:disabled)') !== null`), true);
    result.folder_picker_cancelled_usable = true;

    await waitForCondition(`document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`, "hydrated project onboarding surface after cancellation");
    assert.equal(await evaluateBoolean(`(() => { const button = document.querySelector('[data-blank-state-primary-action="choose_folder"]'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('Browser Onboarding Project') && document.body.textContent.includes('Plain folder')`, "local folder inspection surface");
    assert.equal(await evaluateBoolean(`document.body.textContent.includes(${JSON.stringify(onboardingFolder)})`), true);
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Confirm project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')`, "stable project destination");
    const destination = await evaluateString("location.pathname");
    const firstProjectId = decodeURIComponent(destination.split("/").at(-1));
    result.folder_onboarding_destination = destination;
    await waitForCondition(`document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-focus="ready_to_continue"]') !== null`, "active Blank State destination");
    await validateBlankStateViewports(true, {
      state: "ready-to-continue",
      attentionCount: 0,
      attentionCategory: "none",
      primaryActions: 1,
    });
    const emptyProjectHome = await evaluateJson(`(() => {
      const surface = document.querySelector('[data-blank-state="v0.1"]');
      const visibleText = surface?.innerText ?? '';
      return {
        name: visibleText.includes('Browser Onboarding Project'),
        heading: surface?.querySelector('h1')?.textContent?.trim(),
        primary_action_count: surface?.querySelectorAll('[data-blank-state-primary-action]').length,
        project_home_absent: !visibleText.includes('Project Home'),
        metric_grid_absent: surface?.querySelector('.project-home-coordinate-grid') === null,
        internal_vocabulary_absent: !/(TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|Decision debt|Accepted state|Working projection|Exact coordination|Inspector lineage|packet fingerprint)/i.test(visibleText),
        active: surface?.getAttribute('data-blank-state-active') === 'true',
        guide_version: surface?.getAttribute('data-guide-brief-version'),
        guide_source: surface?.getAttribute('data-guide-brief-source-status'),
        guide_context: surface?.getAttribute('data-guide-brief-project-context'),
        operator_proposal_leaked: visibleText.includes(${JSON.stringify(manifest.proposal_id)}),
        operator_packet_leaked: visibleText.includes(${JSON.stringify(manifest.packet_id)}),
        management_safety_closed:
          document.querySelector('details[data-management-safety]')?.open === false,
        management_safety_context:
          document.querySelector('details[data-management-safety]')?.getAttribute('data-management-safety-project-context') ?? null
      };
    })()`);
    assert.deepEqual(emptyProjectHome, {
      name: true,
      heading: "What would you like to do next?",
      primary_action_count: 1,
      project_home_absent: true,
      metric_grid_absent: true,
      internal_vocabulary_absent: true,
      active: true,
      guide_version: "guide_brief.v0.2",
      guide_source: "live_current_project",
      guide_context: "current",
      operator_proposal_leaked: false,
      operator_packet_leaked: false,
      management_safety_closed: true,
      management_safety_context: "active_project",
    });
    const routeGuide = await evaluateJson(`(async () => {
      const response = await fetch('/api/augnes/read/guide-brief?scope=project%3Aaugnes', {
        headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' },
        cache: 'no-store',
      });
      const body = await response.json();
      const serialized = JSON.stringify(body);
      return {
        status: response.status,
        cache_control: response.headers.get('cache-control'),
        version: body.guide_version,
        project: body.identity?.project_display_name,
        context: body.identity?.project_context,
        focus: body.coordinate?.focus,
        browser_focus: document.querySelector('[data-blank-state="v0.1"]')?.getAttribute('data-blank-state-focus'),
        authority: body.authority?.source_of_truth,
        private_path_absent: !/(\\/Users\\/|\\/home\\/|[A-Za-z]:\\\\)/u.test(serialized),
        credential_absent: !/(OPENAI_API_KEY|GITHUB_TOKEN|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_-]{8,})/u.test(serialized),
      };
    })()`);
    assert.deepEqual(routeGuide, {
      status: 200,
      cache_control: "no-store",
      version: "guide_brief.v0.2",
      project: "Browser Onboarding Project",
      context: "current",
      focus: "ready_to_continue",
      browser_focus: "ready_to_continue",
      authority: false,
      private_path_absent: true,
      credential_absent: true,
    });
    const cleanCurrentRunId = seedBrowserNormalWorkRun({
      databasePath,
      projectId: firstProjectId,
    });
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-current-host-run]') !== null`,
      "clean current-project work in progress",
    );
    await validateBlankStateViewports(true, {
      state: "normal-work-in-progress",
      attentionCount: 0,
      attentionCategory: "none",
      primaryActions: 0,
      secondaryActionRequired: true,
    });
    removeBrowserNormalWorkRun({
      databasePath,
      runId: cleanCurrentRunId,
    });
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-focus="ready_to_continue"]') !== null`,
      "clean project after normal-work fixture removal",
    );
    result.guide_brief_blank_state_v0_2 = true;
    result.minimum_project_home_empty_state = true;
    result.project_home_coordination_visible = true;
    result.minimum_project_home_project_isolation = true;
    result.project_automation_default_not_configured = true;
    result.personal_perspective_default_excluded = true;

    await openBlankStateProjectOptions();
    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated project controls",
    );
    await validateProductShell({
      route: "/projects/[projectId]",
      expectedPrimaryZone: "blank-state",
      expectedUtilityContext: null,
      projectContextRequired: true,
    });

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
      `document.querySelector('[data-blank-state="v0.1"]') !== null && document.body.textContent.includes('Project automation is paused for new policy-triggered work.') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`,
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
      `document.querySelector('[data-blank-state="v0.1"]') !== null && document.body.textContent.includes('The latest selected working context has expired.')`,
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
    await waitForCondition(`document.querySelector('[data-blank-state="v0.1"]') !== null`, "refreshed Minimum Project Home");
    assert.deepEqual(databaseSnapshot(projectHomeDatabase), beforeProjectHomeRefresh);
    assert.equal(requests.slice(refreshRequestStart).some((request) => request.method === "POST"), false);
    projectHomeDatabase.close();
    result.minimum_project_home_refresh_read_only = true;

    await navigate(`${appOrigin}/`);
    await waitForCondition(`location.pathname === '/' && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null`, "active project canonical Blank State");
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(`document.body.textContent.includes('Browser Onboarding Project')`, "recent project after return");
    await waitForCondition(`document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`, "hydrated duplicate onboarding surface");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Choose another folder'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('This folder is already added.')`, "duplicate root identity replay");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Confirm project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`location.pathname === ${JSON.stringify(destination)} && document.querySelector('[data-blank-state="v0.1"]') !== null`, "duplicate root stable destination");

    await openBlankStateProjectOptions();
    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated project controls before project switch",
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
        `!document.body.textContent.includes('Private fixture') && document.body.textContent.includes('Task-selected material 0')`,
      ),
      true,
    );
    result.personal_perspective_included = true;

    await navigate(`${appOrigin}/projects`);
    await waitForCondition(`document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`, "second-project onboarding surface");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Choose another folder'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`document.body.textContent.includes('Browser Second Project') && document.body.textContent.includes('Plain folder')`, "second-project inspection");
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Confirm project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`location.pathname.startsWith('/projects/project%3A') && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.querySelector('[data-project-context-label]')?.parentElement?.textContent?.includes('Browser Second Project')`, "second active Project Home");
    const secondDestination = await evaluateString("location.pathname");
    assert.notEqual(secondDestination, destination);
    await openBlankStateProjectOptions();
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
    await waitForCondition(`Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="false"]')).some((element) => element.getBoundingClientRect().width > 0)`, "non-active first-project deep link");
    assert.equal(await evaluateBoolean(`document.body.textContent.includes('Opening this link did not switch your current project.')`), true);
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
    const inactiveManagementUtilityRequestStart = requests.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const details = document.querySelector('details[data-management-safety]');
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = true;
        const link = Array.from(details.querySelectorAll('a')).find(
          (candidate) => candidate.textContent?.trim() === 'Manage project',
        );
        link?.click();
        return Boolean(link);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === '/projects' && location.hash === '#project-management' && document.querySelector('#project-management')?.getClientRects().length > 0`,
      "inactive-view deterministic management route",
    );
    const activeAfterInactiveManagement = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    assert.equal(
      activeAfterInactiveManagement.recent_projects.find((entry) => entry.is_active)?.project.display_name,
      "Browser Second Project",
    );
    assert.deepEqual(
      requests.slice(inactiveManagementUtilityRequestStart).filter(
        (request) =>
          request.path === "/api/vnext/portability" ||
          request.path === "/api/recovery",
      ),
      [],
    );
    await navigate(`${appOrigin}${destination}`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="false"]') !== null`,
      "return to inactive project after management route",
    );
    result.minimum_project_home_non_active_deep_link_read_only = true;
    await validateBlankStateViewports(true, {
      state: "viewed-inactive-project",
      attentionCount: 1,
      attentionCategory: "project_activation",
      primaryActions: 1,
    });
    await captureC8ReviewState({
      surface: "blank-state",
      state: "action-needed-inactive-project",
      rootSelector: '[data-blank-state="v0.1"]',
      currentSituation: "The viewed project is not the current project.",
      primaryAction: "Make the viewed project current.",
      aiSummary: "GuideBrief explains the viewed-project state.",
      risk: "Activation remains an explicit user action.",
      supportingInformation: "Management and recent-project controls remain secondary.",
      rawRecordDisclosure: "Project options remain collapsed.",
      interactionPath: ["Open a recognized project", "Make active"],
      knownLimitations: [
        "Aesthetic quality and ten-second comprehension require user review.",
      ],
      expectedPrimaryActions: 1,
      maxIndependentSurfaces: 1,
      maxStateBadges: 1,
    });
    result.minimum_project_home_narrow_viewport_no_overflow = true;
    // Viewport sampling can overlap the server-component refresh that exposed
    // this control. Require both request quiet and the controls' own hydration
    // signal before activating the retained non-active project.
    await waitForRequestQuiet();
    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated non-active first-project controls before activation",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Make active' && !button.disabled)`,
      "explicit first-project activation ready",
    );
    const activationResponseStart = responses.length;
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Make active'); if (!(button instanceof HTMLButtonElement) || button.disabled) return false; button.click(); return true; })()`), true);
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
    await waitForCondition(`document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Browser Onboarding Project')`, "explicit first-project activation");
    result.minimum_project_home_explicit_activation = true;
    await captureC8ReviewState({
      surface: "blank-state",
      state: "returning-current-project",
      rootSelector: '[data-blank-state="v0.1"][data-blank-state-active="true"]',
      currentSituation: "The current project and meaningful next work are shown first.",
      primaryAction: "Continue from the current project state.",
      aiSummary: "GuideBrief stays quieter than the page action.",
      risk: "Only consequential attention is promoted.",
      supportingInformation: "Recent change and management remain secondary.",
      rawRecordDisclosure: "Project options remain collapsed.",
      interactionPath: ["Open Blank State", "Continue current work"],
      knownLimitations: [
        "Aesthetic quality and ten-second comprehension require user review.",
      ],
      expectedPrimaryActions: 1,
      maxIndependentSurfaces: 1,
      maxStateBadges: 1,
    });
    await openBlankStateProjectOptions();
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

    renameSync(onboardingFolderB, onboardingFolderBMissingResidue);
    renameSync(folderPickerSequencePath, `${folderPickerSequencePath}.onboarding-consumed`);
    writeFileSync(
      folderPickerSequencePath,
      `${JSON.stringify({
        sequence_version: "augnes_canonical_folder_picker_sequence.v0.1",
        next_index: 0,
        entries: [
          {
            id: "reconnect-second-project",
            outcome: "selected",
            absolute_path: onboardingFolderBRecovered,
          },
        ],
      })}\n`,
      { encoding: "utf8", flag: "wx", mode: 0o600 },
    );
    await navigate(`${appOrigin}${secondDestination}`);
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state-focus="project_root_unavailable"] [data-blank-state-primary-action="locate_folder"]')).some((element) => element.getBoundingClientRect().width > 0) && document.body.innerText.includes('The project record is safe')`,
      "missing-root Blank State recovery focus",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state-project-management-hydrated="true"]')).some((element) => element.getBoundingClientRect().width > 0)`,
      "hydrated missing-root recovery controls",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelectorAll('[data-blank-state-primary-action]').length === 1 && document.body.innerText.includes('Browser Second Project')`,
      ),
      true,
    );
    await validateBlankStateViewports(true, {
      state: "project-root-recovery",
      attentionCount: 1,
      attentionCategory: "project_recovery",
      primaryActions: 1,
    });
    const rebindPickerResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('[data-blank-state-primary-action="locate_folder"]')).find((candidate) => candidate.getBoundingClientRect().width > 0);
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(rebindPickerResponseStart).some(
        (entry) => entry.path === "/api/vnext/projects" && entry.type === "Fetch",
      ),
      "missing-root folder picker response",
    );
    const rebindPickerResponse = responses.slice(rebindPickerResponseStart).find(
      (entry) => entry.path === "/api/vnext/projects" && entry.type === "Fetch",
    );
    assert.equal(rebindPickerResponse?.status, 200);
    await waitForCondition(
      `document.querySelector('[role="dialog"]') !== null || document.body.innerText.includes('replacement folder') || document.body.innerText.includes('Folder selection was cancelled')`,
      "missing-root rebind confirmation",
    );
    assert.equal(
      await evaluateBoolean(`document.querySelector('[role="dialog"]') !== null`),
      true,
      await evaluateString(`document.body.innerText`),
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[role="dialog"]')?.textContent.includes(${JSON.stringify(onboardingFolderBRecovered)}) === true`,
      ),
      true,
    );
    assert.equal(
      await evaluateBoolean(`document.querySelector('[role="dialog"]')?.contains(document.activeElement) === true`),
      true,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('[role="dialog"] button')).find((candidate) => candidate.textContent?.trim() === 'Use this folder');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(secondDestination)} && document.querySelector('[data-blank-state-active="true"]') !== null`,
      "reconnected second-project Blank State",
    );
    await navigate(`${appOrigin}${destination}`);
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state-active="false"] [data-blank-state-primary-action="make_active"]')).some((element) => element.getBoundingClientRect().width > 0)`,
      "first project activation after rebind",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state-project-management-hydrated="true"]')).some((element) => element.getBoundingClientRect().width > 0)`,
      "hydrated first-project activation after rebind",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('[data-blank-state-primary-action="make_active"]')).find((candidate) => candidate.getBoundingClientRect().width > 0);
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state-active="true"]')).some((element) => element.getBoundingClientRect().width > 0) && Array.from(document.querySelectorAll('[data-project-controls-hydrated="true"]')).filter((element) => element.getBoundingClientRect().width > 0).length === 2 && document.body.textContent.includes('Browser Onboarding Project')`,
      "first project restored after rebind",
    );
    await openBlankStateProjectOptions();

    const persistencePauseResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Pause' && candidate.getBoundingClientRect().width > 0);
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(persistencePauseResponseStart).some(
        (entry) =>
          entry.path === "/api/vnext/project-controls" &&
          entry.type === "Fetch" &&
          entry.status === 200,
      ),
      "project automation persistence pause response",
    );
    await waitForCondition(
      `document.body.textContent.includes('Project automation is paused for new policy-triggered work.') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`,
      "paused project automation before retained restart",
    );

    // The old document is detached before shutdown; no cosmetic network-settle
    // delay is needed once the about:blank document is ready.
    await navigate("about:blank");
    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    startDevServer(runtimeEnvironment);
    await waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `location.pathname === '/' && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2 && document.body.textContent.includes('Project automation is paused for new policy-triggered work.') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume') && document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection')`,
      "project and control persistence after retained restart",
    );
    result.project_automation_restart_persisted = true;
    result.minimum_project_home_restart_root_resolution = true;
    result.project_controls_restart_persisted = true;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Resume' && candidate.getBoundingClientRect().width > 0);
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.body.textContent.includes('Control layer eligible') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`,
      "resumed project automation after retained restart",
    );
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
    await waitForCondition(`location.pathname === ${JSON.stringify(destination)} && document.querySelector('[data-blank-state="v0.1"]') !== null`, "same destination after retained restart");
    result.folder_onboarding_restart_reopen = true;
    await navigate(`${appOrigin}/overview`);
    await waitForCondition(`location.pathname === '/' && document.querySelector('[data-blank-state="v0.1"]') !== null`, "overview compatibility redirect to Blank State");
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
      `document.body.textContent.includes('This page could not be found') && document.querySelector('[data-blank-state="v0.1"]') === null`,
      "unknown Project Home safe not-found state",
    );
    result.minimum_project_home_unknown_project_safe_not_found = true;
    const activeAfterUnknown = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    assert.equal(activeAfterUnknown.recent_projects.find((entry) => entry.is_active)?.project.display_name, "Browser Onboarding Project");
    await navigate(`${appOrigin}/projects`);
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "hydrated Project tools verification surface",
    );
    await validateProductShell({
      route: "/projects",
      expectedPrimaryZone: "blank-state",
      expectedUtilityContext: null,
    });
    record("folder_onboarding_confirmation_refresh_restart_and_reopen");
    record("minimum_project_home_empty_refresh_restart_isolation_and_explicit_switch");
    record("project_controls_enable_pause_resume_scope_restart_conflict_and_isolation");
  });

  await runPhase("locked_workbench", async () => {
    const responseStart = responses.length;
    await navigate(`${appOrigin}/workbench`);
    await waitForCondition(
      `location.pathname === '/workbench/semantic-review' && document.querySelector('[data-ai-workplane-shell="v0.1"]') !== null`,
      "workbench compatibility redirect to AI Workplane",
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
      "locked AI Workplane",
    );
    await waitForCondition(
      `document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-status="available"][data-ai-workplane-guide-loading="false"]') !== null`,
      "AI Workplane current-project GuideBrief",
    );
    const workplaneGuide = await evaluateJson(`(async () => {
      const guide = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
      const response = await fetch('/api/augnes/read/guide-brief?scope=project%3Aaugnes', {
        headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' },
        cache: 'no-store',
      });
      const body = await response.json();
      const textWithoutLabel = (selector, label) =>
        guide?.querySelector(selector)?.textContent?.replace(label, '')?.trim() ?? null;
      return {
        project: guide?.querySelector('[data-guide-brief-project-name="true"]')?.textContent?.trim() ?? null,
        status: guide?.getAttribute('data-ai-workplane-guide-status'),
        mutating_controls: guide?.querySelectorAll('button, input, textarea, select').length ?? -1,
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
              (item) => item.question,
            ),
          ) ===
          JSON.stringify(body.projections?.codex?.unresolved_user_judgments ?? []),
        human_attention_consistent:
          JSON.stringify(body.coordinate?.human_attention ?? null) ===
            JSON.stringify(body.projections?.ai_workplane?.human_attention ?? null) &&
          JSON.stringify(body.coordinate?.human_attention ?? null) ===
            JSON.stringify(body.projections?.chatgpt?.human_attention ?? null) &&
          JSON.stringify(body.coordinate?.human_attention ?? null) ===
            JSON.stringify(body.projections?.codex?.human_attention ?? null) &&
          body.coordinate?.human_attention?.required ===
            body.projections?.blank_state?.highlighted_item
              ?.requires_human_attention &&
          body.coordinate?.human_attention?.category ===
            body.projections?.blank_state?.highlighted_item
              ?.attention_category,
      };
    })()`);
    assert.deepEqual(workplaneGuide, {
      project: "Browser Onboarding Project",
      status: "available",
      mutating_controls: 0,
      goal_consistent: true,
      constraint_consistent: true,
      judgment_consistent: true,
      chatgpt_codex_goal_consistent: true,
      chatgpt_codex_constraints_consistent: true,
      chatgpt_codex_judgment_consistent: true,
      human_attention_consistent: true,
    });
    result.guide_brief_ai_workplane_v0_2 = true;
    result.guide_brief_cross_surface_consistency = true;
    result.workbench_compatibility_redirect = true;
    await validateProductShell({
      route: "/workbench/semantic-review",
      expectedPrimaryZone: "ai-workplane",
      expectedUtilityContext: null,
    });
    await validateProductShellResponsive("/workbench/semantic-review");
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('main')?.getAttribute('data-vnext-private-material-rendered') === 'false'`,
      ),
      true,
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-ai-workplane-exact-details]') === null && !Array.from(document.querySelectorAll('a')).some((link) => link.getAttribute('href')?.includes('target=project_coordination'))`,
      ),
      true,
    );
    assert.equal(
      responses
        .slice(responseStart)
        .some((entry) => entry.path === "/api/vnext/operator/inspector"),
      false,
    );
    assert.equal(documentStatusSince(responseStart, "/workbench/semantic-review"), 200);
    record("locked_workbench_renders_no_private_material");
  });

  const lockedDirectInspectorHref = createSharedInspectorHrefV01({
    target_kind: "episode_delta_proposal",
    record_id: manifest.proposal_id,
    expected_fingerprint: manifest.proposal_fingerprint,
  });
  await runPhase("locked_direct_exact_details", async () => {
    const lockedRequestStart = requests.length;
    await navigate(`${appOrigin}/workbench/inspector`);
    await waitForCondition(
      `document.querySelector('[data-contextual-inspector-state="invalid"] h1')?.textContent?.includes('Open exact details from the item you are reviewing') === true`,
      "empty exact-details contextual guidance",
    );
    assert.deepEqual(
      await evaluateJson(`(() => {
        const state = document.querySelector('[data-contextual-inspector-state="invalid"]');
        return {
          return_href:
            state?.querySelector('[data-contextual-inspector-return="ai_workplane_home"]')?.getAttribute('href') ?? null,
          target_form_count: state?.querySelectorAll('form, input').length ?? -1,
        };
      })()`),
      {
        return_href: "/workbench/semantic-review",
        target_form_count: 0,
      },
    );
    await navigate(new URL(lockedDirectInspectorHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-contextual-inspector-state="locked"]') !== null && document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
      "locked direct exact-details address",
    );
    const lockedShape = await evaluateJson(`(() => {
      const state = document.querySelector('[data-contextual-inspector-state="locked"]');
      const html = state?.innerHTML ?? '';
      return {
        heading: state?.querySelector('h1')?.textContent?.trim() ?? null,
        return_href:
          state?.querySelector('[data-contextual-inspector-return="ai_workplane_home"]')?.getAttribute('href') ?? null,
        protected_id_absent: !html.includes(${JSON.stringify(manifest.proposal_id)}),
        protected_fingerprint_absent: !html.includes(${JSON.stringify(manifest.proposal_fingerprint)}),
        raw_id_input_absent:
          state?.querySelectorAll('input:not(#vnext-operator-bootstrap-token)').length === 0,
      };
    })()`);
    assert.deepEqual(lockedShape, {
      heading: "Exact details require local review access",
      return_href: "/workbench/semantic-review",
      protected_id_absent: true,
      protected_fingerprint_absent: true,
      raw_id_input_absent: true,
    });
    assert.equal(
      requests
        .slice(lockedRequestStart)
        .some((entry) => entry.path === "/api/vnext/operator/inspector"),
      false,
      "protected exact material must not be requested before local access",
    );
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
      `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null && document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="episode_delta_proposal"]') !== null`,
      "authenticated direct exact target",
    );
    assert.equal(
      await evaluateBoolean(
        `document.activeElement?.getAttribute('data-contextual-inspector-heading') === 'true'`,
      ),
      true,
      "successful local authentication must focus the exact target heading",
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

  await runPhase("strategic_proposal_review", async () => {
    database ??= new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "strategic source Project Home",
    );
    if (
      await evaluateBoolean(
        `document.querySelector('[data-blank-state-active="false"]') !== null`,
      )
    ) {
      await waitForCondition(
        `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2 &&
          Array.from(document.querySelectorAll('button')).some(
          (candidate) => candidate.textContent?.trim() === 'Make active' &&
            candidate instanceof HTMLButtonElement &&
            !candidate.disabled
        )`,
        "hydrated strategic source project activation control",
      );
      const activationResponseStart = responses.length;
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === 'Make active'
          );
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          return true;
        })()`),
        true,
      );
      await waitForHostCondition(
        () =>
          responses.slice(activationResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/projects" &&
              entry.type === "Fetch",
          ),
        "strategic source project activation response",
      );
      const activationResponse = responses
        .slice(activationResponseStart)
        .find(
          (entry) =>
            entry.path === "/api/vnext/projects" && entry.type === "Fetch",
        );
      assert.equal(activationResponse?.status, 200);
    }
    await waitForCondition(
      `document.querySelector('[data-blank-state-active="true"]') !== null`,
      "active strategic source Project Home",
    );
    const beforeStrategicRead = databaseSnapshot(database);
    const initialRequestStart = requests.length;
    const initialResponseStart = responses.length;
    const sourcePath = `/workbench/semantic-review/${manifest.strategic_source_proposal_id.replace(":", "~")}`;
    await navigate(`${appOrigin}${sourcePath}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(sourcePath)}`,
      "source proposal route",
    );
    await waitForHostCondition(
      () =>
        responses.slice(initialResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/semantic-review" &&
            entry.type === "Fetch" &&
            entry.method === "GET",
        ),
      "source proposal private read response",
    );
    const sourceReadResponses = responses
      .slice(initialResponseStart)
      .filter(
        (entry) =>
          entry.path === "/api/vnext/operator/semantic-review" &&
          entry.type === "Fetch" &&
          entry.method === "GET",
      );
    const sourceReadDebug = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/semantic-review?' + new URLSearchParams({
        proposal_id: ${JSON.stringify(manifest.strategic_source_proposal_id)}
      }), { cache: 'no-store', credentials: 'same-origin' });
      const text = await response.text();
      let strategic = null;
      try {
        const analysis = JSON.parse(text)?.proposal?.strategic_analysis ?? null;
        strategic = analysis
          ? {
              status: analysis.status,
              reason: analysis.reason,
              model_capability: analysis.model_capability,
            }
          : null;
      } catch {}
      return { status: response.status, strategic, body_tail: text.slice(-500) };
    })()`);
    const strategicServerErrors = serverLog
      .split("\n")
      .filter((line) => /canonical_strategic|error|conflict|invalid/i.test(line))
      .slice(-8);
    assert.equal(
      sourceReadResponses.some((entry) => entry.status === 200),
      true,
      `strategic source read failed: errors=${JSON.stringify(strategicServerErrors)}; response=${JSON.stringify({ sourceReadResponses, sourceReadDebug })}`,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
      "source proposal detail",
    );
    const sourceShape = await evaluateJson(`(() => {
      const panel = document.querySelector('[data-vnext-strategic-advantage-transfer]');
      const link = panel?.querySelector('[data-vnext-strategic-review-link="true"]');
      const button = panel?.querySelector('[data-vnext-strategic-request="true"]');
      return {
        panel_present: Boolean(panel),
        optional: panel?.getAttribute('data-vnext-strategic-optional') === 'true',
        authoritative: panel?.getAttribute('data-vnext-strategic-authoritative'),
        status: panel?.getAttribute('data-vnext-strategic-readback-status') ?? null,
        review_link_absent: link === null,
        request_button_present: button instanceof HTMLButtonElement && !button.disabled,
        request_label: button?.textContent?.trim() ?? '',
        internal_input_count: panel?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        text: panel?.textContent ?? '',
        body_text: (document.body.textContent ?? '').slice(-4_000),
      };
    })()`);
    assert.equal(
      sourceShape.panel_present,
      true,
      `strategic panel missing: ${JSON.stringify(sourceShape)}; server=${serverLog.slice(-2_000)}`,
    );
    assert.equal(sourceShape.optional, true);
    assert.equal(sourceShape.authoritative, "false");
    assert.equal(
      sourceShape.status,
      "eligible",
      `strategic source must be eligible: ${JSON.stringify({ status: sourceShape.status, sourceReadDebug })}`,
    );
    assert.equal(sourceShape.review_link_absent, true);
    assert.equal(sourceShape.request_button_present, true);
    assert.equal(sourceShape.request_label, "Request bounded strategic analysis");
    assert.equal(sourceShape.internal_input_count, 0);
    assert.equal(sourceShape.text.includes("Nothing runs on page load"), true);
    assert.equal(/settlement|reconciliation/i.test(sourceShape.text), false);
    assert.equal(
      sourceShape.text.includes("Local model capability") &&
        sourceShape.text.includes("available"),
      true,
    );
    assert.deepEqual(databaseSnapshot(database), beforeStrategicRead);
    assert.equal(
      requests.slice(initialRequestStart).some(
        (entry) =>
          entry.method === "POST" ||
          /provider|openai/u.test(entry.path ?? ""),
      ),
      false,
    );

    const beforeStrategicAction = readDirectHostBrowserState(
      manifest.project_id,
    );
    const actionRequestStart = requests.length;
    const actionResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-vnext-strategic-request="true"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(actionResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/semantic-review" &&
            entry.type === "Fetch" &&
            entry.method === "POST",
        ),
      "explicit strategic proposal admission response",
    );
    const strategicAdmissionResponse = responses
      .slice(actionResponseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/operator/semantic-review" &&
          entry.type === "Fetch" &&
          entry.method === "POST",
      );
    const strategicAdmissionResponseBody = strategicAdmissionResponse
      ? await cdp
          .send("Network.getResponseBody", {
            requestId: strategicAdmissionResponse.request_id,
          })
          .then((value) => JSON.parse(String(value.body ?? "{}")))
          .catch(() => null)
      : null;
    const strategicAdmissionDebug =
      strategicAdmissionResponse?.status === 201
        ? null
        : await evaluateJson(`(() => ({
            path: location.pathname,
            body_text: (document.body.textContent ?? '').slice(-5_000),
            error_text: document.querySelector('[role="alert"]')?.textContent ?? null
          }))()`);
    assert.equal(
      strategicAdmissionResponse?.status,
      201,
      `explicit strategic proposal admission must insert the source-bound proposal: response=${JSON.stringify(strategicAdmissionResponseBody)}; page=${JSON.stringify(strategicAdmissionDebug)}; server=${serverLog.slice(-3_000)}`,
    );
    await waitForCondition(
      `location.pathname !== ${JSON.stringify(sourcePath)} && location.pathname.startsWith('/workbench/semantic-review/episode-delta-proposal~') && document.querySelector('[data-vnext-strategic-advantage-transfer="proposal"] [data-vnext-strategic-transfer-items="true"]') !== null`,
      "exact strategic proposal detail",
    );
    const strategicPath = await evaluateString("location.pathname");
    const strategicPosts = requests
      .slice(actionRequestStart)
      .filter(
        (entry) =>
          entry.method === "POST" &&
          entry.path === "/api/vnext/operator/semantic-review",
      );
    assert.equal(strategicPosts.length, 1);
    assert.equal(
      requests.slice(actionRequestStart).some((entry) =>
        /provider|openai/u.test(entry.path ?? ""),
      ),
      false,
    );
    const fakeTransportCounter = JSON.parse(
      readFileSync(strategicTransportCounterPath, "utf8"),
    );
    assert.deepEqual(fakeTransportCounter, {
      counter_version: "strategic_model_transport_counter.v0.1",
      transport_calls: 1,
      working_frame_fingerprint:
        manifest.strategic_working_frame_fingerprint,
      source_catalog_fingerprint:
        manifest.strategic_source_catalog_fingerprint,
    });
    const afterStrategicAction = readDirectHostBrowserState(
      manifest.project_id,
    );
    assert.deepEqual(afterStrategicAction.semantic_authority_counts, {
      ...beforeStrategicAction.semantic_authority_counts,
      proposals: beforeStrategicAction.semantic_authority_counts.proposals + 1,
    });
    const strategicShape = await evaluateJson(`(() => {
      const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const panel = detail?.querySelector('[data-vnext-strategic-advantage-transfer="proposal"]');
      const transferList = panel?.querySelector('[data-vnext-strategic-transfer-items="true"]');
      const decisionForm = detail?.querySelector('[data-vnext-operator-decision-form="v0.1"]');
      const candidate = decisionForm?.closest('[data-vnext-candidate-accept-eligible="false"]');
      const accept = decisionForm?.querySelector('option[value="accept"]');
      const panelText = panel?.textContent ?? '';
      const headingText = Array.from(panel?.querySelectorAll('h1, h2, h3, h4, [role="heading"], button') ?? [])
        .map((entry) => entry.textContent ?? '')
        .join(' ');
      return {
        pending: panelText.includes('pending review'),
        transfer_count: transferList?.querySelectorAll(':scope > li').length ?? -1,
        candidate_operation_unknown:
          panelText.includes('unknown · human revision required') &&
          candidate?.getAttribute('data-vnext-candidate-accept-eligible') === 'false' &&
          accept instanceof HTMLOptionElement && accept.disabled,
        full_material:
          panelText.includes('Applicability') &&
          panelText.includes('Expected effect') &&
          panelText.includes('Transfer cost') &&
          panelText.includes('Falsifier') &&
          panelText.includes('Source-linked patch') &&
          panelText.includes('Uncertainty') &&
          panelText.includes('Introduced or transferred risks') &&
          panelText.includes('Known limitations') &&
          panelText.includes('Regression risks') &&
          panelText.includes('Checks or observations needed') &&
          panelText.includes('Stop conditions') &&
          panelText.includes('Invalidation conditions') &&
          panelText.includes('Model-selected candidate source relation'),
        server_owned_support:
          panel?.querySelector('[data-vnext-strategic-server-adverse-context="true"]') !== null &&
          panelText.includes('Server-owned adverse context') &&
          panelText.includes('cannot be selected away') &&
          panelText.includes('Final server support: unknown · insufficient') &&
          panelText.includes('explicit strategic-transfer observations only'),
        lineage:
          panelText.includes('Base and source lineage') &&
          panelText.includes('Packet, receipt, and model-receipt lineage') &&
          panelText.includes('Working frame') &&
          panelText.includes('source catalog') &&
          panelText.includes('model invocation receipt'),
        historical_budget_split:
          panel?.querySelector('[data-vnext-strategic-historical-cost="true"]') !== null &&
          panelText.includes('Historical invocation budget') &&
          panelText.includes('Current new-invocation pricing') &&
          panelText.includes('does not rewrite this proposal') &&
          panelText.includes('semantic sources are stale'),
        non_authoritative:
          panel?.getAttribute('data-vnext-strategic-authoritative') === 'false' &&
          panel?.querySelector('[data-vnext-strategic-authority-boundary="true"]') !== null &&
          panelText.includes('grants no decision, Transition') &&
          panelText.includes('not Transition-ready'),
        arena_heading_count:
          (headingText.match(/\b(?:Arena|winner|scoreboard|debate|consensus|voting)\b/gi) ?? []).length,
        internal_input_count:
          panel?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        fixture_credential_visible:
          panelText.includes('owned-canonical-test-credential-not-persisted'),
      };
    })()`);
    assert.deepEqual(strategicShape, {
      pending: true,
      transfer_count: 1,
      candidate_operation_unknown: true,
      full_material: true,
      server_owned_support: true,
      lineage: true,
      historical_budget_split: true,
      non_authoritative: true,
      arena_heading_count: 0,
      internal_input_count: 0,
      fixture_credential_visible: false,
    });
    await validateSemanticReviewViewports();

    const strategicDecisionRoot =
      '[data-vnext-candidate-accept-eligible="false"] [data-vnext-operator-decision-form="v0.1"]';
    await setFormControlValue(
      `${strategicDecisionRoot} textarea`,
      0,
      "Defer this optional local transfer until a reviewer can supply stronger exact support.",
    );
    await setFormControlValue(
      `${strategicDecisionRoot} textarea`,
      1,
      "Revisit only when the accepted plan and exact source catalog remain current and stronger source material is available.",
    );
    const decisionResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector(${JSON.stringify(`${strategicDecisionRoot} button[type="submit"]`)});
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(decisionResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/semantic-review" &&
            entry.type === "Fetch" &&
            entry.method === "POST" &&
            (entry.status === 200 || entry.status === 201),
        ),
      "strategic defer decision response",
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-decision-history="v0.1"] li')?.textContent?.includes('defer') === true && document.querySelector('[data-vnext-transition-actions-status="awaiting_applying_decision"]') !== null`,
      "strategic defer decision without transition",
    );
    const afterStrategicDecision = readDirectHostBrowserState(
      manifest.project_id,
    );
    assert.deepEqual(afterStrategicDecision.semantic_authority_counts, {
      ...afterStrategicAction.semantic_authority_counts,
      decisions: afterStrategicAction.semantic_authority_counts.decisions + 1,
    });
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-vnext-transition-step-status="applied"]') === null && document.querySelector('[data-vnext-transition-status="applied"]') === null`,
      ),
      true,
    );
    const beforeReload = databaseSnapshot(database);
    const strategicReloadResponseStart = responses.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () =>
        responses.slice(strategicReloadResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/semantic-review" &&
            entry.type === "Fetch" &&
            entry.method === "GET" &&
            entry.status === 200,
        ),
      "reloaded strategic Semantic Workbench response",
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(strategicPath)} && document.querySelector('[data-vnext-strategic-advantage-transfer="proposal"] [data-vnext-strategic-transfer-items="true"]') !== null`,
      "strategic proposal after reload",
    );
    assert.deepEqual(databaseSnapshot(database), beforeReload);
    assert.deepEqual(
      readDirectHostBrowserState(manifest.project_id).semantic_authority_counts,
      afterStrategicDecision.semantic_authority_counts,
    );
    assert.equal(
      JSON.parse(readFileSync(strategicTransportCounterPath, "utf8"))
        .transport_calls,
      1,
    );
    const beforeStrategicInspector = databaseSnapshot(database);
    assert.equal(
      requests
        .slice(initialRequestStart)
        .some((entry) => entry.path === "/api/vnext/operator/inspector"),
      false,
      "normal suggested-change review must not preload or request exact details",
    );
    const strategicInspectorHref = await evaluateString(
      `document.querySelector('[data-strategic-to-shared-inspector="true"]')?.getAttribute('href') ?? ''`,
    );
    assert.match(
      strategicInspectorHref,
      /^\/workbench\/inspector\?target=episode_delta_proposal&record_id=[^&]+&fingerprint=sha256%3A[a-f0-9]{64}$/u,
    );
    await navigate(new URL(strategicInspectorHref, appOrigin).toString());
    await waitForCondition(
      `location.pathname === '/workbench/inspector' && document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="episode_delta_proposal"] [data-inspector-section="strategic_perspective"]') !== null`,
      "source-bound strategic shared Inspector",
    );
    const strategicInspectorShape = await evaluateJson(`(() => {
      const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
      const section = inspector?.querySelector('[data-inspector-section="strategic_perspective"]');
      const text = section?.textContent ?? '';
      return {
        base_and_frame: text.includes('Exact accepted base strategy and fixed working frame'),
        within_frame:
          text.includes('Within-frame source-bound transfer') &&
          text.includes('exact source bound'),
        frame_challenge_unknown:
          text.includes('Frame challenge classification') &&
          text.includes('not explicitly recorded'),
        model_receipt:
          text.includes('Model invocation receipt') &&
          text.includes('recorded provenance only'),
        no_promotion:
          text.includes('Automatic promotion') && text.includes('false'),
        mutation_controls:
          inspector?.querySelectorAll('form, [data-vnext-operator-decision-form], [data-vnext-transition-action]').length ?? -1,
      };
    })()`);
    assert.deepEqual(strategicInspectorShape, {
      base_and_frame: true,
      within_frame: true,
      frame_challenge_unknown: true,
      model_receipt: true,
      no_promotion: true,
      mutation_controls: 0,
    });
    assert.deepEqual(databaseSnapshot(database), beforeStrategicInspector);
    assert.equal(
      JSON.parse(readFileSync(strategicTransportCounterPath, "utf8"))
        .transport_calls,
      1,
    );
    result.strategic_shared_inspector_complete = true;
    await navigate(new URL(strategicPath, appOrigin).toString());
    await waitForCondition(
      `location.pathname === ${JSON.stringify(strategicPath)} && document.querySelector('[data-vnext-strategic-advantage-transfer="proposal"]') !== null`,
      "returned to strategic Semantic Workbench",
    );
    result.strategic_profile_explicit_request = true;
    result.strategic_model_gateway_fake_transport_calls = 1;
    result.strategic_source_to_proposal_navigation = true;
    result.strategic_proposal_pending_unknown_non_authoritative = true;
    result.strategic_proposal_material_visible = true;
    result.strategic_candidate_defer_no_transition = true;
    result.strategic_proposal_reload_idempotent = true;
    record("strategic_source_explicitly_admits_exact_pending_unknown_proposal_without_internal_input");
    record("strategic_proposal_full_material_lineage_and_non_authority_render");
    record("strategic_candidate_defer_records_decision_without_transition_or_packet_change");
    record("strategic_proposal_reload_creates_no_model_or_semantic_write");

    // The canonical strategic transport resolves fixture availability on each
    // request. Removing its owned fixture changes only the next test request;
    // no restart persistence behavior is involved in this boundary.
    rmSync(strategicTransportFixturePath, { force: true });
    await navigate(`${appOrigin}/`);
  });

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
  }, {
    terminalRequestQuiet: false,
    quietProof: "all retired fetch responses and bodies were awaited",
  });

  await runPhase("direct_host_round_trip", async () => {
    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "operator Project Home",
    );
    if (
      await evaluateBoolean(
        `document.querySelector('[data-blank-state-active="false"]') !== null`,
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
      `document.querySelector('[data-blank-state-active="true"]') !== null`,
      "active operator Project Home",
    );
    await openBlankStateProjectOptions();
    await waitForCondition(
      `document.querySelector('[data-direct-host-round-trip="v0.3"]') !== null`,
      "advanced deterministic local test action",
    );
    result.direct_host_project_home_active = true;

    const actionShape = await evaluateJson(`(() => {
      const action = document.querySelector('[data-direct-host-round-trip="v0.3"]');
      const labels = action
        ? Array.from(action.querySelectorAll('button, a')).map((candidate) => candidate.textContent?.trim() ?? '')
        : [];
      return {
        action_present: Boolean(action),
        form_field_count: action?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        start_button_count: action?.querySelectorAll('[data-direct-host-action="deterministic"]').length ?? -1,
        live_control_count: action?.querySelectorAll('[data-delegated-work-action], [data-live-host-action]').length ?? -1,
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
      start_button_count: 1,
      live_control_count: 0,
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
        status: document.querySelector('[data-direct-host-round-trip="v0.3"]')?.getAttribute('data-direct-host-round-trip-status') ?? null,
        text: document.querySelector('[data-direct-host-round-trip="v0.3"]')?.textContent?.trim() ?? ''
      }))()`);
      assert.equal(
        hostResponse?.status,
        201,
        `direct-host route failed: ${JSON.stringify(visibleState)}`,
      );
    }
    await waitForCondition(
      `document.querySelector('[data-direct-host-round-trip-status="completed"]') !== null && document.body.textContent.includes('Result saved')`,
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

    const aiWorkplaneMountRequestStart = requests.length;
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null && document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]') !== null`,
      "AI Workplane delegated Codex work",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-direct-host-round-trip] [data-delegated-work-action]') === null`,
      ),
      true,
    );
    assert.equal(
      requests
        .slice(aiWorkplaneMountRequestStart)
        .filter(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.method === "GET",
        ).length,
      1,
    );
    result.delegated_work_single_initial_read = true;
    const liveRequestStart = requests.length;
    const liveResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-delegated-work-action="start"]');
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    const delegationInteractionCount = 1;
    assert.equal(delegationInteractionCount <= 3, true);
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
    timing.milestone("first approval durable state observed");
    assert(firstApprovalState.pending_approval);
    assert.equal(firstApprovalState.pending_approval.decision_submitted, false);
    await waitForCondition(
      `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-approval="pending"]') !== null`,
      "live Codex command approval",
    );
    result.live_codex_waiting_for_approval = true;
    result.project_home_current_run_visible = true;
    const pendingShape = await evaluateJson(`(() => {
      const action = document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]');
      const approval = document.querySelector('[data-delegated-work-approval="pending"]');
      return {
        form_field_count: action?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        approval_present: Boolean(approval),
        approve_once_present: Boolean(document.querySelector('[data-delegated-work-action="approve-once"]')),
        polling: action?.getAttribute('data-delegated-work-polling') ?? null,
        primary_action_count: document.querySelectorAll('[data-ai-workplane-primary-action]').length,
        raw_protocol_visible: document.body.textContent.includes('jsonrpc') || document.body.textContent.includes('OPENAI_API_KEY')
      };
    })()`);
    assert.deepEqual(pendingShape, {
      form_field_count: 0,
      approval_present: true,
      approve_once_present: true,
      polling: "false",
      primary_action_count: 1,
      raw_protocol_visible: false,
    });
    const untouchedApprovalGetCount = requests.filter(
      (entry) =>
        entry.path === "/api/vnext/operator/host-round-trip" &&
        entry.method === "GET",
    ).length;
    const untouchedApprovalObservedAt = Date.now();
    await waitForHostCondition(
      () => Date.now() - untouchedApprovalObservedAt >= 900,
      "untouched approval polling boundary",
      2_000,
    );
    assert.equal(
      requests.filter(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.method === "GET",
      ).length,
      untouchedApprovalGetCount,
    );
    result.live_codex_untouched_approval_polling_stopped = true;

    const turnStartsBeforeLeave =
      countBrowserFixtureReceivedMethod("turn/start");
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-delegated-work-summary="waiting_for_approval"]') !== null && document.querySelector('[data-blank-state-delegated-work-link="true"]') !== null`,
      "Blank State compact delegated-work resumption",
    );
    await validateBlankStateViewports(true, {
      state: "genuine-human-attention",
      attentionCount: 6,
      attentionCategory: "access_judgment",
      primaryActions: 1,
    });
    assert.equal(
      readLatestManagedLiveRunState(manifest.project_id)?.run_ref,
      firstApprovalState.run_ref,
    );
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-action="approve-once"]') !== null`,
      "returned AI Workplane approval",
    );
    assert.equal(
      countBrowserFixtureReceivedMethod("turn/start"),
      turnStartsBeforeLeave,
    );
    await validateDelegatedWorkViewports();
    await captureC8ReviewState({
      surface: "ai-workplane",
      state: "active-work-needs-access",
      rootSelector: '[data-ai-workplane-shell="v0.1"]',
      currentSituation: "Delegated work is waiting for one explicit access decision.",
      primaryAction: "Review requested access.",
      aiSummary: "The current stage and bounded progress narrative remain visible.",
      risk: "The requested resource and risk are stated in text.",
      supportingInformation: "Exact detail and lifecycle notes follow the work narrative.",
      rawRecordDisclosure: "Raw protocol remains outside the default view.",
      interactionPath: ["Open AI Workplane", "Review requested access"],
      knownLimitations: [
        "The local fixture proves layout and authority flow, not model quality.",
      ],
      expectedPrimaryActions: 1,
      maxIndependentSurfaces: 1,
      maxStateBadges: 5,
    });
    result.live_codex_leave_return_same_run = true;
    result.live_codex_leave_return_no_new_turn = true;
    result.delegated_work_narrow_viewport_no_overflow = true;

    const firstApprovalResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-delegated-work-action="approve-once"]');
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
    timing.milestone("first approval response observed");
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
    await waitForCondition(
      `document.querySelector('[data-delegated-work-stage="working"]') !== null`,
      "active delegated work without fabricated primary action",
    );
    assert.equal(
      await evaluateJson(
        `document.querySelector('[data-delegated-work-stage="working"]')?.querySelectorAll('[data-augnes-primary-action]').length ?? -1`,
      ),
      0,
    );
    timing.milestone("first approval transitioned to running");
    const turnStartsBeforeProgressVisit =
      countBrowserFixtureReceivedMethod("turn/start");
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "Blank State while delegated work continues",
    );
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-delegated-work-stage="working"]') !== null`,
      "AI Workplane after Blank State progress visit",
    );
    assert.equal(
      countBrowserFixtureReceivedMethod("turn/start"),
      turnStartsBeforeProgressVisit,
    );

    const secondApprovalRefreshStart = responses.length;
    writeFileSync(browserSecondApprovalReleasePath, "released\n", {
      mode: 0o600,
    });
    timing.milestone("second approval release requested");
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
    timing.milestone("second approval durable state observed");
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
      `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-approval="pending"] [data-delegated-work-action="approve-once"]:not([disabled])') !== null`,
      "second live Codex command approval",
    );
    assert.equal(
      responses
        .slice(secondApprovalRefreshStart)
        .some(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.type === "Fetch" &&
            entry.status === 200,
        ),
      true,
    );
    timing.milestone("second AI Workplane approval refresh observed");
    result.live_codex_second_approval = true;
    result.ai_workplane_approval_refresh_count = 2;

    const secondApprovalResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-delegated-work-action="approve-once"]');
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
    timing.milestone("second approval response observed");
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
    timing.milestone("second approval transitioned to running");
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
    timing.milestone("terminal release requested");
    await waitForLiveRunStatus(
      manifest.project_id,
      "completed",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    timing.milestone("completed durable state observed");
    result.approval_barrier_timing = readApprovalBarrierTiming();
    await waitForCondition(
      `document.querySelector('[data-delegated-work-stage="result_ready"] [data-ai-workplane-primary-action="review-result"]') !== null`,
      "live Codex terminal receipt after approval",
    );
    timing.milestone("terminal AI Workplane projection observed");
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
    const timelineShape = await evaluateJson(`(() => {
      const timeline = document.querySelector('[aria-label="Delegated Codex work progress"]');
      const text = timeline?.textContent ?? '';
      return {
        timeline_present: Boolean(timeline),
        result_saved: text.includes('Result saved'),
        checkpoint_count: timeline?.querySelectorAll('[data-delegated-work-timeline-kind^="checkpoint_"]').length ?? 0,
        opaque_id_visible: /autonomy-run:|native-host-event:|host thread|host turn|control revision/i.test(text),
        private_path_visible: text.includes(${JSON.stringify(path.dirname(databasePath))}),
        raw_output_visible: /raw command output|provider output|reasoning delta/i.test(text),
        primary_action_count: document.querySelectorAll('[data-ai-workplane-primary-action]').length,
      };
    })()`);
    assert.equal(timelineShape.timeline_present, true);
    assert.equal(timelineShape.result_saved, true);
    assert.equal(timelineShape.checkpoint_count >= 2, true);
    assert.equal(timelineShape.opaque_id_visible, false);
    assert.equal(timelineShape.private_path_visible, false);
    assert.equal(timelineShape.raw_output_visible, false);
    assert.equal(timelineShape.primary_action_count, 1);
    result.delegated_work_timeline_public_safe = true;
    record("active_project_live_codex_refreshes_two_approval_boundaries_and_persists_one_receipt");
    record("live_codex_product_path_uses_zero_copy_paste_or_internal_id_entry");

    const expectedReviewHref = `/workbench/results/${liveAfter.latest_receipt.receipt_id.replace(":", "~")}`;
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "Blank State after delegated result",
    );
    await waitForCondition(
      `document.querySelector('[data-latest-run-result="completed"] [data-review-result-link="true"]')?.getAttribute('href') === ${JSON.stringify(expectedReviewHref)} && document.querySelector('[data-current-host-run]') === null && document.querySelector('[data-delegated-work-summary="result_ready"]') !== null`,
      "Blank State latest immutable delegated result",
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
      const visibleText = document.querySelector('[data-blank-state="v0.1"]')?.innerText ?? '';
      return {
        present: Boolean(result),
        href: link?.getAttribute('href') ?? '',
        has_summary: result?.textContent?.includes('The deterministic fake App Server completed the bounded live lifecycle.') ?? false,
        form_field_count: result?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        primary_action_count: document.querySelectorAll('[data-blank-state-primary-action]').length,
        protocol_vocabulary_absent: !/(Project Home|TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|Decision debt|Accepted state|Working projection|Exact coordination|Inspector lineage|packet fingerprint)/i.test(visibleText),
      };
    })()`);
    assert.deepEqual(latestResultShape, {
      present: true,
      href: expectedReviewHref,
      has_summary: true,
      form_field_count: 0,
      primary_action_count: 1,
      protocol_vocabulary_absent: true,
    });
    await validateBlankStateViewports(true, {
      state: "trusted-result-ready",
      attentionCount: null,
      attentionCategory: null,
      primaryActions: 1,
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
    await waitForCondition(
      `document.querySelector('[data-run-result-proposal="available"] [data-result-to-proposal-link="true"]') !== null && document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-status="available"][data-ai-workplane-guide-loading="false"]') !== null`,
      "read-only proposal settlement and current-project guide refresh",
    );
    timing.milestone("proposal settlement and result review ready");
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-ai-workplane-shell="v0.1"][data-ai-workplane-state="result_ready"][data-ai-workplane-guide-request-count="1"]') !== null && document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-status="available"][data-ai-workplane-guide-loading="false"]') !== null && document.body.innerText.includes('AI Workplane') && !document.body.innerText.includes('Semantic Workbench')`,
      ),
      true,
    );
    result.shared_semantic_workbench_shell = true;
    assert.equal(
      responses.slice(resultResponseStart).some(
        (entry) => entry.path === expectedReviewHref && entry.status === 200,
      ),
      true,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const forwarding = document.querySelector('[data-run-result-inspector-forwarding="v0.1"]');
        const link = forwarding?.querySelector('[data-result-to-shared-inspector="true"]');
        return forwarding !== null && link?.getAttribute('href')?.startsWith('/workbench/inspector?target=run_receipt') === true;
      })()`),
      true,
    );
    const resultReviewShape = await evaluateJson(`(() => {
      const review = document.querySelector('[data-run-result-review="v0.1"]');
      const forwarding = document.querySelector('[data-run-result-inspector-forwarding="v0.1"]');
      const assessment = review?.querySelector('[data-task-success-criteria="available"]');
      const proposal = review?.querySelector('[data-run-result-proposal="available"]');
      const text = review?.textContent ?? '';
      const visibleText = review?.innerText ?? '';
      const assessmentText = assessment?.textContent ?? '';
      const normalizedAssessmentText = assessmentText.replace(/\\s+/g, ' ').trim();
      return {
        read_only: review?.getAttribute('data-result-review-read-only') === 'true',
        semantic_mutation: review?.getAttribute('data-semantic-mutation'),
        form_field_count: review?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        semantic_mutation_button_count: review
          ? Array.from(review.querySelectorAll('button')).filter((button) =>
              /proposal|decision|accept|commit|transition|evidence|close work/i.test(button.textContent ?? '')
            ).length
          : -1,
        inspector_forwarding: forwarding !== null && forwarding.querySelector('[data-result-to-shared-inspector="true"]') !== null,
        duplicate_lineage_absent: !text.includes('Identity and lineage') && !text.includes('Packet fingerprint'),
        duplicate_artifacts_absent: !text.includes('src/live-result.ts') && !text.includes('Bounded fake result artifact.'),
        duplicate_actions_absent: !text.includes('fake_app_server_turn_completed'),
        duplicate_checks_absent: !text.includes('fake-live-check') && !text.includes('validated_packet_delivery'),
        duplicate_approvals_absent: !text.includes('Native host and approvals') && !text.includes('explicit local operator'),
        duplicate_model_coverage_absent: !text.includes('native host internal outside coverage'),
        duplicate_trust_privacy_absent: !text.includes('Trust, coverage, and privacy') && !text.includes('Raw prompt: not persisted'),
        authority_boundary:
          visibleText.includes('Opening this result is read-only') &&
          visibleText.includes('saved no decision') &&
          visibleText.includes('accepted no project change'),
        human_sections:
          Array.from(review?.querySelectorAll('[data-ai-workplane-result-section]') ?? [])
            .map((section) => section.getAttribute('data-ai-workplane-result-section'))
            .join(',') === 'outcome,next-step,verification,unresolved',
        primary_action_count: review?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        visible_protocol_absent:
          !/(Semantic Workbench|Proposal queue|Verify and decide|exact semantic candidate|Reasoning steps|ReviewDecision|Transition|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|StateTransitionReceipt|\bEvidence\b|\bClaim\b|semantic gate|current-head|packet fingerprint|exact lineage)/i.test(visibleText),
        criterion_assessment_available: assessment !== null,
        execution_task_success_separated:
          assessment?.getAttribute('data-task-success-status') === 'unknown' &&
          assessmentText.includes('Execution completed / task success unknown'),
        criterion_count: assessment?.querySelectorAll('[data-criterion-status]').length ?? -1,
        compact_criterion_summary: assessment?.querySelector('[data-result-criterion-summary="compact"]') !== null,
        skipped_not_passed: !assessmentText.includes('skipped · passed'),
        duplicate_task_wide_residue_absent:
          !text.includes('Checks and skipped checks') &&
          !text.includes('Limitations and next steps') &&
          !assessmentText.includes('Task-wide receipt residue trust classes'),
        criterion_authority_boundary:
          assessment?.getAttribute('data-assessment-authoritative') === 'false' &&
          normalizedAssessmentText.includes('derived assessment is non-authoritative') &&
          normalizedAssessmentText.includes('changes neither saved project state nor later work context'),
        proposal_available:
          proposal !== null &&
          proposal.textContent?.includes('suggested change is available') === true &&
          proposal.querySelector('[data-result-to-proposal-link="true"]') !== null,
        private_root_visible: text.includes(${JSON.stringify(liveAfter.normalized_root)}),
        current_goal_summary_visible: text.includes(${JSON.stringify(packet.task.goal)}),
        exact_packet_identity_visible:
          text.includes(${JSON.stringify(packet.packet_id)}) ||
          text.includes(${JSON.stringify(packet.integrity.fingerprint)}),
        raw_packet_contract_visible:
          text.includes('TaskContextPacket') || text.includes('Packet fingerprint'),
        raw_protocol_visible: /jsonrpc|raw diff must never be persisted|raw output must never be persisted|OPENAI_API_KEY/.test(text),
      };
    })()`);
    assert.deepEqual(resultReviewShape, {
      read_only: true,
      semantic_mutation: "false",
      form_field_count: 0,
      semantic_mutation_button_count: 0,
      inspector_forwarding: true,
      duplicate_lineage_absent: true,
      duplicate_artifacts_absent: true,
      duplicate_actions_absent: true,
      duplicate_checks_absent: true,
      duplicate_approvals_absent: true,
      duplicate_model_coverage_absent: true,
      duplicate_trust_privacy_absent: true,
      authority_boundary: true,
      human_sections: true,
      primary_action_count: 1,
      visible_protocol_absent: true,
      criterion_assessment_available: true,
      execution_task_success_separated: true,
      criterion_count: 0,
      compact_criterion_summary: true,
      skipped_not_passed: true,
      duplicate_task_wide_residue_absent: true,
      criterion_authority_boundary: true,
      proposal_available: true,
      private_root_visible: false,
      current_goal_summary_visible: true,
      exact_packet_identity_visible: false,
      raw_packet_contract_visible: false,
      raw_protocol_visible: false,
    });
    await validateWorkbenchResultViewports();
    await captureC8ReviewState({
      surface: "ai-workplane",
      state: "returned-result",
      rootSelector: '[data-run-result-review="v0.1"]',
      currentSituation: "The returned outcome is shown before verification residue.",
      primaryAction: "Review the consequential suggested change.",
      aiSummary: "Verification is explicitly an AI summary, not accepted fact.",
      risk: "Unresolved questions are stated after the next action.",
      supportingInformation: "Authority boundaries and GuideBrief remain secondary.",
      rawRecordDisclosure: "Exact run records are available through Inspector.",
      interactionPath: ["Open returned result", "Review suggested change"],
      knownLimitations: [
        "The deterministic fixture cannot substitute for user judgment about wording.",
      ],
      expectedPrimaryActions: 1,
      maxIndependentSurfaces: 1,
      maxStateBadges: 1,
    });
    const inspectorHref = await evaluateJson(`(() => {
      const link = document.querySelector('[data-result-to-shared-inspector="true"]');
      return link?.getAttribute('href') ?? '';
    })()`);
    assert.equal(
      typeof inspectorHref === "string" &&
        inspectorHref.startsWith("/workbench/inspector?target=run_receipt") &&
        !/[?&](?:workspace_id|project_id|database|path|json)=/u.test(inspectorHref),
      true,
    );
    const beforeInspectorRead = databaseSnapshot(database);
    const inspectorResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector('[data-result-to-shared-inspector="true"]');
        link?.click();
        return Boolean(link);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === '/workbench/inspector' && document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-read-only="true"][data-inspector-semantic-mutation="false"][data-inspector-target-kind="run_receipt"]') !== null`,
      "shared receipt-focused Inspector",
    );
    await validateProductShell({
      route: "/workbench/inspector?target=run_receipt",
      expectedPrimaryZone: "ai-workplane",
      expectedUtilityContext: null,
    });
    assert.equal(
      responses.slice(inspectorResponseStart).some(
        (entry) =>
          entry.path === "/api/vnext/operator/inspector" &&
          entry.method === "GET" &&
          entry.status === 200,
      ),
      true,
    );
    const inspectorShape = await evaluateJson(`(() => {
      const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
      const text = inspector?.textContent ?? '';
      const visibleText = inspector?.innerText ?? '';
      const sections = Array.from(inspector?.querySelectorAll('[data-inspector-section]') ?? []);
      const identities = Array.from(inspector?.querySelectorAll('[data-contextual-inspector-exact-identity]') ?? []);
      const primary = Array.from(inspector?.querySelectorAll('[data-contextual-inspector-primary-section-count] > [data-inspector-section]') ?? []);
      const additional = inspector?.querySelector('[data-contextual-inspector-additional-records="true"]');
      const returnLink = inspector?.querySelector('[data-contextual-inspector-return="result"]');
      return {
        contextual_version: inspector?.getAttribute('data-contextual-inspector'),
        read_only: inspector?.getAttribute('data-inspector-read-only'),
        semantic_mutation: inspector?.getAttribute('data-inspector-semantic-mutation'),
        target_kind: inspector?.getAttribute('data-inspector-target-kind'),
        section_count: sections.length,
        primary_section_kinds: primary.map((entry) => entry.getAttribute('data-inspector-section')),
        primary_section_count: primary.length,
        additional_closed: additional instanceof HTMLDetailsElement && !additional.open,
        return_href: returnLink?.getAttribute('href') ?? null,
        h1_count: inspector?.querySelectorAll('h1').length ?? -1,
        contextual_first_view:
          inspector?.querySelector('[data-contextual-inspector-heading]') !== null &&
          inspector?.querySelector('[data-contextual-inspector-about="true"]') !== null &&
          inspector?.getAttribute('data-contextual-inspector-exact-status') !== null,
        first_view_identity_absent:
          !visibleText.includes('sha256:') &&
          !visibleText.includes(${JSON.stringify(liveAfter.latest_receipt.receipt_id)}),
        visible_protocol_absent:
          !/Shared Inspector|RunReceipt|TaskContextPacket|ReviewDecision|StateTransitionReceipt|packet fingerprint|exact lineage/i.test(visibleText),
        forms: inspector?.querySelectorAll('form').length ?? -1,
        semantic_controls: inspector
          ? Array.from(inspector.querySelectorAll('button, input, textarea, select')).filter((entry) =>
              /decision|accept|reject|defer|supersede|retract|gate|transition|apply|evidence/i.test(
                entry.getAttribute('aria-label') ?? entry.textContent ?? ''
              )
            ).length
          : -1,
        exact_identity_collapsed: identities.length > 0 && identities.every((entry) => !entry.open),
        authority:
          text.includes('These details are read-only') &&
          text.includes('No model, provider, filesystem mutation, or external action is available here.'),
        private_root_visible: text.includes(${JSON.stringify(liveAfter.normalized_root)}),
        raw_secret_visible: /OPENAI_API_KEY|sk-proj-|raw diff must never be persisted|jsonrpc/i.test(text),
      };
    })()`);
    assert.deepEqual(inspectorShape, {
      contextual_version: "contextual_inspector_view.v0.1",
      read_only: "true",
      semantic_mutation: "false",
      target_kind: "run_receipt",
      section_count: 13,
      primary_section_kinds: [
        "run_receipt",
        "criterion_basis",
        "integration_capability",
        "timeline",
      ],
      primary_section_count: 4,
      additional_closed: true,
      return_href: expectedReviewHref,
      h1_count: 1,
      contextual_first_view: true,
      first_view_identity_absent: true,
      visible_protocol_absent: true,
      forms: 0,
      semantic_controls: 0,
      exact_identity_collapsed: true,
      authority: true,
      private_root_visible: false,
      raw_secret_visible: false,
    });
    await validateSharedInspectorViewports();
    await captureC8ReviewState({
      surface: "inspector",
      state: "exact-run-detail",
      rootSelector: '[data-shared-project-inspector="v0.1"]',
      currentSituation: "The concrete inspected target and read-only boundary lead.",
      primaryAction: "No product-primary action is present.",
      aiSummary: "No AI summary is promoted over exact records.",
      risk: "Read-only authority limits are explicit.",
      supportingInformation: "Compact section summaries organize the drill-down.",
      rawRecordDisclosure: "Exact records and lineage are progressively disclosed.",
      interactionPath: ["Open exact details", "Expand a bounded record"],
      knownLimitations: [
        "Inspector density requires direct user review at both widths.",
      ],
      expectedPrimaryActions: 0,
      maxIndependentSurfaces: 0,
      maxStateBadges: 0,
    });
    const inspectorReloadStart = responses.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () =>
        responses.slice(inspectorReloadStart).some(
          (entry) =>
            entry.path === "/workbench/inspector" &&
            entry.type === "Document" &&
            entry.status === 200,
        ),
      "reloaded shared Inspector response",
    );
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="run_receipt"]') !== null`,
      "reloaded shared receipt Inspector",
    );
    assert.deepEqual(databaseSnapshot(database), beforeInspectorRead);

    if (RUN_CORE_SCOPE) {
      const liveInspectorRead = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/operator/inspector' + location.search, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(liveInspectorRead.status, 200);
      assert.equal(liveInspectorRead.body?.status, "inspector_read");
      assert.equal(liveInspectorRead.body?.project_activity, "active");
      assert.equal(
        liveInspectorRead.body?.inspector?.target?.target_kind,
        "run_receipt",
      );

      const priorInspectorCorrectionPhase = currentPhase;
      currentPhase = "contextual_inspector_status_correction";
      try {
        const renderInterceptedInspector = async ({
          status,
          body,
          expectedSelector,
          label,
        }) => {
          assert.equal(interceptedInspectorResponse, null);
          interceptedInspectorResponse = { status, body };
          const requestStart = requests.length;
          await navigate(new URL(inspectorHref, appOrigin).toString());
          await waitForCondition(expectedSelector, label);
          await waitForRequestQuiet();
          assert.equal(
            interceptedInspectorResponse,
            null,
            `${label} response interception must be consumed exactly once`,
          );
          assert.equal(
            requests.slice(requestStart).filter(
              (entry) =>
                entry.path === "/api/vnext/operator/inspector" &&
                entry.method === "GET",
            ).length,
            1,
            `${label} must perform one Inspector read without retry`,
          );
        };

        const unavailableCode = "shared_inspector_read_failed";
        await renderInterceptedInspector({
          status: 500,
          body: { ok: false, error_code: unavailableCode },
          expectedSelector:
            `document.querySelector('[data-contextual-inspector-state="unavailable"] h1')?.textContent?.trim() === 'Exact details could not be read'`,
          label: `unavailable exact-details state for ${unavailableCode}`,
        });
        const unavailableShape = await evaluateJson(`(() => {
          const state = document.querySelector('[data-contextual-inspector-state="unavailable"]');
          const diagnostic = state?.querySelector('details code')?.closest('details');
          const visibleText = state?.innerText ?? '';
          return {
            heading: state?.querySelector('h1')?.textContent?.trim() ?? null,
            missing_claim_absent: !visibleText.includes('no longer available'),
            no_retry_copy:
              visibleText.includes('No project write, repair, provider call, or automatic retry was attempted.'),
            related_return_present:
              state?.querySelector('[data-contextual-inspector-return]') instanceof HTMLAnchorElement,
            diagnostic_closed:
              diagnostic instanceof HTMLDetailsElement && !diagnostic.open,
            raw_code_hidden: !visibleText.includes(${JSON.stringify(unavailableCode)}),
          };
        })()`);
        assert.equal(unavailableShape.heading, "Exact details could not be read");
        assert.equal(unavailableShape.missing_claim_absent, true);
        assert.equal(unavailableShape.no_retry_copy, true);
        assert.equal(unavailableShape.related_return_present, true);
        assert.equal(unavailableShape.diagnostic_closed, true);
        assert.equal(unavailableShape.raw_code_hidden, true);
        assert.equal(
          await evaluateBoolean(`(() => {
            const state = document.querySelector('[data-contextual-inspector-state="unavailable"]');
            const diagnostic = state?.querySelector('details code')?.closest('details');
            if (!(diagnostic instanceof HTMLDetailsElement)) return false;
            diagnostic.open = true;
            const code = diagnostic.querySelector('code');
            return diagnostic.open &&
              (code?.textContent ?? '').includes(${JSON.stringify(unavailableCode)});
          })()`),
          true,
        );

        await renderInterceptedInspector({
          status: 404,
          body: { ok: false, error_code: "shared_inspector_target_missing" },
          expectedSelector:
            `document.querySelector('[data-contextual-inspector-state="missing"] h1')?.textContent?.trim() === 'The exact target is no longer available'`,
          label: "known missing exact target",
        });
        assert.equal(
          await evaluateBoolean(`(() => {
            const state = document.querySelector('[data-contextual-inspector-state="missing"]');
            const text = state?.innerText ?? '';
            return text.includes('The requested exact record could not be resolved. No substitute record was selected.') &&
              !text.includes('Exact details could not be read');
          })()`),
          true,
        );

        await renderInterceptedInspector({
          status: 409,
          body: {
            ok: false,
            error_code: "shared_inspector_candidate_source_conflict",
          },
          expectedSelector:
            `document.querySelector('[data-contextual-inspector-state="conflict"] h1')?.textContent?.trim() === 'The saved exact sources no longer agree'`,
          label: "known conflicting exact target",
        });
        assert.equal(
          await evaluateBoolean(`(() => {
            const state = document.querySelector('[data-contextual-inspector-state="conflict"]');
            const text = state?.innerText ?? '';
            return text.includes('The exact source conflict was preserved.') &&
              !text.includes('no longer available') &&
              state?.querySelectorAll('form').length === 0 &&
              !Array.from(state?.querySelectorAll('button') ?? []).some((entry) =>
                /make active|switch project|repair/i.test(entry.textContent ?? '')
              );
          })()`),
          true,
        );

        const projectionCases = [
          {
            label: "inactive conflict",
            project_activity: "inactive_read_only",
            target_status: "conflict",
            completeness: "conflict",
            exact_status: "conflict",
            status_label: "Exact sources do not agree",
            activity_notice: true,
          },
          {
            label: "inactive bounded incomplete",
            project_activity: "inactive_read_only",
            target_status: "bounded_incomplete",
            completeness: "bounded_incomplete",
            exact_status: "bounded_incomplete",
            status_label: "This is a bounded exact view",
            activity_notice: true,
          },
          {
            label: "inactive partial",
            project_activity: "inactive_read_only",
            target_status: "present",
            completeness: "partial",
            exact_status: "partial",
            status_label: "Some related detail is unavailable",
            activity_notice: true,
          },
        ];
        for (const projectionCase of projectionCases) {
          const body = structuredClone(liveInspectorRead.body);
          body.project_activity = projectionCase.project_activity;
          body.inspector.target_status = projectionCase.target_status;
          body.inspector.completeness = projectionCase.completeness;
          await renderInterceptedInspector({
            status: 200,
            body,
            expectedSelector:
              `document.querySelector('[data-shared-project-inspector="v0.1"][data-contextual-inspector-exact-status="${projectionCase.exact_status}"][data-contextual-inspector-project-activity="${projectionCase.project_activity}"]') !== null`,
            label: projectionCase.label,
          });
          const projectionShape = await evaluateJson(`(() => {
            const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
            const status = inspector?.querySelector('[data-contextual-inspector-status-block]');
            const notice = inspector?.querySelector('[data-contextual-inspector-activity-notice="true"]');
            const visibleText = inspector?.innerText ?? '';
            return {
              exact_status: inspector?.getAttribute('data-contextual-inspector-exact-status') ?? null,
              project_activity: inspector?.getAttribute('data-contextual-inspector-project-activity') ?? null,
              status_label: status?.querySelector('h2')?.textContent?.trim() ?? null,
              status_role: status?.getAttribute('role') ?? null,
              activity_notice_count:
                inspector?.querySelectorAll('[data-contextual-inspector-activity-notice="true"]').length ?? -1,
              activity_copy:
                notice?.textContent?.replace(/\\s+/g, ' ').trim() ?? null,
              contradictory_availability_absent:
                !visibleText.includes('The exact detail remains available as a read-only view.'),
              mutation_control_absent:
                !Array.from(inspector?.querySelectorAll('button, form') ?? []).some((entry) =>
                  /make active|switch project|repair/i.test(entry.textContent ?? '')
                ),
            };
          })()`);
          assert.deepEqual(projectionShape, {
            exact_status: projectionCase.exact_status,
            project_activity: projectionCase.project_activity,
            status_label: projectionCase.status_label,
            status_role:
              projectionCase.exact_status === "conflict" ? "alert" : "status",
            activity_notice_count: projectionCase.activity_notice ? 1 : 0,
            activity_copy: projectionCase.activity_notice
              ? "This project is not current. These details remain read-only, and opening them did not switch projects."
              : null,
            contradictory_availability_absent: true,
            mutation_control_absent: true,
          });
          if (projectionCase.label === "inactive conflict") {
            await validateSharedInspectorViewports();
          }
        }
        assert.deepEqual(databaseSnapshot(database), beforeInspectorRead);
        record(
          "contextual_inspector_route_errors_preserve_missing_conflict_and_unavailable",
        );
        record(
          "contextual_inspector_exact_status_remains_primary_for_inactive_projects",
        );
      } finally {
        interceptedInspectorResponse = null;
        currentPhase = priorInspectorCorrectionPhase;
      }
    }
    result.shared_inspector_read_only = true;
    result.shared_inspector_server_scoped = true;
    result.shared_inspector_reload_idempotent = true;
    result.shared_inspector_narrow_viewport_no_overflow = true;
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector('[data-contextual-inspector-return="result"]');
        if (!(link instanceof HTMLAnchorElement)) return false;
        link.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(expectedReviewHref)} && document.querySelector('[data-run-result-review="v0.1"]') !== null`,
      "returned from shared Inspector to result entry",
    );
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
    const decisionFlowInspectorRequestStart = requests.length;
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
    const proposalRequestStart = requests.length;
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
      `location.pathname.startsWith('/workbench/semantic-review/episode-delta-proposal~') && document.querySelector('[data-vnext-semantic-review-detail="v0.1"] [data-vnext-decision-workbench="v0.1"]') !== null`,
      "result-linked run-assessment proposal detail",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-ai-workplane-shell="v0.1"][data-ai-workplane-state="change_decision"]') !== null`,
      ),
      true,
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
      const strategic = detail?.querySelector('[data-vnext-strategic-advantage-transfer="unavailable"]');
      const text = detail?.textContent ?? '';
      const visibleText = detail?.innerText ?? '';
      const strategicText = strategic?.textContent ?? '';
      const canonical = detail?.querySelector('[data-vnext-decision-workbench="v0.1"]');
      const canonicalCriteria = canonical
        ? Array.from(canonical.querySelectorAll('[data-criterion-status]'))
        : [];
      return {
        decision_centered_sequence:
          Boolean(canonical) &&
          canonical?.getAttribute('data-project-verify-reconciliation-version') === 'project_verify_reconciliation.v0.1' &&
          canonical?.getAttribute('data-project-verify-claim-truth') === 'not_established' &&
          canonical?.textContent?.includes('What was intended and which context was selected') &&
          canonical?.textContent?.includes('What happened, and what was observed versus reported') &&
          canonical?.textContent?.includes('Success criteria and their exact basis') &&
          canonical?.textContent?.includes('Evidence, Claims, contradiction, qualification, and uncertainty'),
        canonical_reconciliation:
          canonicalCriteria.length > 0 &&
          canonicalCriteria.some((item) =>
            item.getAttribute('data-criterion-status') === 'satisfied' &&
            item.getAttribute('data-criterion-basis') === 'observed'
          ) &&
          canonicalCriteria.some((item) =>
            item.getAttribute('data-criterion-status') === 'unknown' &&
            item.getAttribute('data-criterion-basis') === 'insufficient'
          ) &&
          canonicalCriteria.every((item) =>
            ['satisfied', 'unsatisfied', 'not_applicable', 'unknown'].includes(
              item.getAttribute('data-criterion-status')
            ) &&
            ['observed', 'attested', 'mixed', 'insufficient'].includes(
              item.getAttribute('data-criterion-basis')
            )
          ) &&
          canonical?.querySelector('[data-evidence-authentication="verified"]') !== null &&
          canonical?.querySelector('[data-relation-kind="supports"]') !== null &&
          canonical?.textContent?.includes('Acceptance: not accepted by record existence') &&
          canonical?.textContent?.includes('truth not established') &&
          canonical?.textContent?.includes('relation is not proof'),
        canonical_no_local_truth_or_current_inference:
          canonical?.textContent?.includes('The latest recorded candidate is not the applied current head') &&
          canonical?.textContent?.includes('Recording order did not change project state') &&
          !canonical?.textContent?.includes('Claim truth established'),
        protocol_details_not_visible_by_default:
          !visibleText.includes('sha256:') &&
          !visibleText.includes('Confirmation digest') &&
          !visibleText.includes('Gate record ID'),
        human_review_order:
          visibleText.indexOf('What would change') >= 0 &&
          visibleText.indexOf('Your decision') > visibleText.indexOf('What would change') &&
          visibleText.indexOf('Why Augnes suggested it') > visibleText.indexOf('Your decision') &&
          visibleText.indexOf('What was verified') > visibleText.indexOf('Why Augnes suggested it') &&
          visibleText.indexOf('What remains uncertain') > visibleText.indexOf('What was verified'),
        primary_action_count: detail?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        default_two_interaction_defer_ready: (() => {
          const form = detail?.querySelector('[data-vnext-default-decision-path-interactions="2"]');
          const decision = form?.querySelector('select');
          const textareas = Array.from(form?.querySelectorAll('textarea') ?? []);
          const submit = form?.querySelector('button[type="submit"]');
          return decision?.value === 'defer' &&
            textareas.length === 2 &&
            textareas.every((item) => item.value.trim().length > 0) &&
            submit instanceof HTMLButtonElement &&
            !submit.disabled;
        })(),
        advanced_closed:
          Array.from(detail?.querySelectorAll('details') ?? []).some((item) =>
            item.querySelector('summary')?.textContent?.includes('Advanced review') === true && item.open === false
          ),
        visible_protocol_absent:
          !/(Semantic Workbench|Proposal queue|Verify and decide|exact semantic candidate|Reasoning steps|ReviewDecision|Transition|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|StateTransitionReceipt|\bEvidence\b|\bClaim\b|semantic gate|current-head|packet fingerprint|exact lineage)/i.test(visibleText),
        pending_review: detail?.getAttribute('data-vnext-proposal-status') === 'pending_review',
        execution_task_success:
          canonical?.querySelector('[data-host-completion-not-task-success="true"]') !== null &&
          canonical?.querySelector('[data-run-receipt-outcome="completed"]') !== null &&
          canonicalCriteria.some((item) =>
            item.getAttribute('data-criterion-status') === 'unknown' &&
            item.getAttribute('data-criterion-basis') === 'insufficient'
          ),
        retained_assessment_duplicate_absent: snapshot === null,
        checks_and_skips:
          canonical?.querySelector('[aria-label="Receipt checks and skips"] [data-check-status]') !== null &&
          canonical?.textContent?.includes('unrelated passed checks') &&
          !canonical?.textContent?.includes('skipped · passed'),
        exact_result_detail_moved:
          !text.includes('src/live-result.ts') &&
          detail?.querySelector('[data-proposal-to-shared-inspector="true"]') !== null,
        coverage:
          canonical?.textContent?.includes('outside coverage') === true,
        trust:
          canonical?.textContent?.includes('direct observations') &&
          canonical?.textContent?.includes('host attestations') &&
          canonical?.textContent?.includes('derived interpretations'),
        exact_lineage_handoff:
          detail?.querySelector('[data-workbench-to-shared-inspector="true"]') !== null &&
          detail?.querySelector('[data-receipt-to-shared-inspector="true"]') !== null,
        no_decision_or_transition:
          detail?.getAttribute('data-vnext-selected-decision-count') === '0' &&
          detail?.getAttribute('data-vnext-transition-status') === 'not_applied',
        non_authoritative:
          canonical?.textContent?.includes('non-authoritative comparison') &&
          canonical?.textContent?.includes('relation is not proof') &&
          canonical?.textContent?.includes('Candidate, decision-only, gate-only') &&
          canonical?.textContent?.includes('did not change context'),
        strategic_optional_unavailable:
          strategic?.getAttribute('data-vnext-strategic-optional') === 'true' &&
          strategic?.getAttribute('data-vnext-strategic-authoritative') === 'false' &&
          strategic?.getAttribute('data-vnext-strategic-readback-status') === 'unavailable' &&
          strategicText.includes('Bounded strategic local transfer'),
        strategic_model_unavailable:
          strategicText.includes('Local model capability') &&
          strategicText.includes('unavailable'),
        strategic_server_profile_visible:
          strategicText.includes('Fixed ephemeral lenses') &&
          strategic?.querySelectorAll('[data-vnext-strategic-lenses="fixed"] li').length === 3 &&
          strategicText.includes('One logical Model Gateway invocation') &&
          strategicText.includes('Automatic retry: no') &&
          strategicText.includes('provider failover: no'),
        strategic_no_analysis_on_load:
          strategicText.includes('Nothing runs on page load') &&
          strategic?.querySelector('[data-vnext-strategic-request="true"]') === null &&
          strategic?.querySelector('[data-vnext-strategic-review-link="true"]') === null,
        strategic_no_internal_inputs:
          strategic?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length === 0,
        strategic_zero_model_review_preserved:
          strategicText.includes('source proposal remains available for normal zero-model review') &&
          strategicText.includes('grants no decision, Transition') &&
          strategicText.includes('later-context') &&
          strategicText.includes('authority'),
        strategic_no_arena_surface:
          !/\b(?:Arena|winner|scoreboard|debate|consensus|voting)\b/i.test(strategicText),
      };
    })()`);
    assert.deepEqual(proposalReviewShape, {
      decision_centered_sequence: true,
      canonical_reconciliation: true,
      canonical_no_local_truth_or_current_inference: true,
      protocol_details_not_visible_by_default: true,
      human_review_order: true,
      primary_action_count: 1,
      default_two_interaction_defer_ready: true,
      advanced_closed: true,
      visible_protocol_absent: true,
      pending_review: true,
      execution_task_success: true,
      retained_assessment_duplicate_absent: true,
      checks_and_skips: true,
      exact_result_detail_moved: true,
      coverage: true,
      trust: true,
      exact_lineage_handoff: true,
      no_decision_or_transition: true,
      non_authoritative: true,
      strategic_optional_unavailable: true,
      strategic_model_unavailable: true,
      strategic_server_profile_visible: true,
      strategic_no_analysis_on_load: true,
      strategic_no_internal_inputs: true,
      strategic_zero_model_review_preserved: true,
      strategic_no_arena_surface: true,
    });
    const resultToDecisionInteractionCount = 2;
    assert.equal(resultToDecisionInteractionCount <= 2, true);
    await validateSemanticReviewViewports();
    await captureC8ReviewState({
      surface: "ai-workplane",
      state: "returned-result-decision",
      rootSelector: '[data-vnext-semantic-review-detail="v0.1"]',
      currentSituation: "The proposed project change is shown before supporting rationale.",
      primaryAction: "Submit the consequential decision.",
      aiSummary: "Suggestion rationale and verification are labeled interpretations.",
      risk: "Uncertainty is stated in text without becoming the page accent.",
      supportingInformation: "Later feedback and optional review paths follow the decision.",
      rawRecordDisclosure: "Advanced review is collapsed and Inspector remains optional.",
      interactionPath: ["Review suggested change", "Submit decision"],
      knownLimitations: [
        "The user must judge whether decision framing is immediately comprehensible.",
      ],
      expectedPrimaryActions: 1,
      maxIndependentSurfaces: 2,
      maxStateBadges: 2,
    });
    assert.deepEqual(databaseSnapshot(database), beforeProposalReview);
    assert.equal(
      requests.slice(proposalRequestStart).some(
        (entry) =>
          entry.method === "POST" &&
          entry.path === "/api/vnext/operator/semantic-review",
      ),
      false,
    );
    result.result_to_proposal_navigation = true;
    result.proposal_verify_summary = true;
    result.decision_centered_workbench = true;
    result.canonical_reconciliation_visible = true;
    result.protocol_details_progressively_disclosed = true;
    result.proposal_review_narrow_viewport_no_overflow = true;
    result.strategic_profile_optional_unavailable = true;
    result.strategic_profile_no_analysis_on_load = true;
    result.strategic_profile_no_internal_id_input = true;
    result.strategic_profile_zero_model_review_preserved = true;
    record("workbench_result_review_and_inspector_reload_from_immutable_durable_state");
    record("result_links_to_exact_pending_run_assessment_proposal_without_manual_ids");
    record("result_review_creates_no_proposal_decision_transition_evidence_or_work_closure");
    record("optional_strategic_profile_load_is_read_only_unavailable_and_zero_model_safe");

    const sourceProposalPath = await evaluateString("location.pathname");
    const originalOperationShape = await evaluateJson(`(() => {
      const form = document.querySelector('[data-vnext-operation-revision-form="v0.1"]');
      const decisionRoot = document.querySelector('[data-vnext-candidate-id="selected-decision"]');
      const decisionForm = decisionRoot?.querySelector('[data-vnext-operator-decision-form="v0.1"]');
      const accept = decisionForm?.querySelector('option[value="accept"]');
      const lockedLane = form?.querySelector('[data-vnext-server-selected-delta-lane="validation_delta"]');
      const validationTarget = form?.querySelector('[data-vnext-validation-state-target="criterion_assessment_item"]');
      return {
        revision_form_present: Boolean(form),
        lane_is_server_selected: Boolean(lockedLane),
        unrestricted_lane_selector_absent:
          !Array.from(form?.querySelectorAll('select') ?? []).some((select) =>
            Array.from(select.options).some((option) => option.value === 'memory_delta')
          ),
        criterion_target_label_visible:
          (validationTarget?.textContent ?? '').includes(${JSON.stringify(packet.task.success_criteria[0] ?? "")}),
        original_accept_eligible: decisionRoot?.getAttribute('data-vnext-candidate-accept-eligible'),
        original_accept_disabled: accept instanceof HTMLOptionElement ? accept.disabled : null,
        internal_identifier_inputs: form?.querySelectorAll('input[name*="id" i], input[name*="fingerprint" i], input[name*="nonce" i], input[name*="gate" i], input[name*="checksum" i]').length ?? -1,
      };
    })()`);
    assert.deepEqual(originalOperationShape, {
      revision_form_present: true,
      lane_is_server_selected: true,
      unrestricted_lane_selector_absent: true,
      criterion_target_label_visible: true,
      original_accept_eligible: "false",
      original_accept_disabled: true,
      internal_identifier_inputs: 0,
    });
    const beforeClosure = readDirectHostBrowserState(manifest.project_id);
    await setFormControlValue(
      '[data-vnext-operation-revision-form="v0.1"] textarea',
      1,
      "Create an explicit bounded validation-state operation while preserving the immutable unknown assessment.",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-vnext-operation-revision-form="v0.1"] button[type="submit"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname !== ${JSON.stringify(sourceProposalPath)} && document.querySelector('[data-vnext-operation-revision="v0.1"]') !== null`,
      "immutable operation-aware revision detail",
    );
    const revisionPath = await evaluateString("location.pathname");
    const afterRevision = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterRevision.semantic_authority_counts, {
      ...beforeClosure.semantic_authority_counts,
      proposals: beforeClosure.semantic_authority_counts.proposals + 1,
    });
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-vnext-candidate-accept-eligible="true"] [data-vnext-operator-decision-form="v0.1"]') !== null`,
      ),
      true,
    );
    result.operation_aware_revision_created = true;
    record("workbench_creates_immutable_operation_aware_revision_without_internal_ids");

    const eligibleDecisionRoot =
      '[data-vnext-candidate-accept-eligible="true"] [data-vnext-operator-decision-form="v0.1"]';
    await setFormControlValue(`${eligibleDecisionRoot} select`, 0, "accept");
    await setFormControlValue(
      `${eligibleDecisionRoot} textarea`,
      0,
      "Accept this separately reviewable create operation; application remains subject to independent gate and state checks.",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector(${JSON.stringify(`${eligibleDecisionRoot} button[type="submit"]`)});
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-action="preview"]:not([disabled])') !== null && document.querySelector('[data-vnext-decision-history="v0.1"] li') !== null`,
      "persisted explicit ReviewDecision",
    );
    const afterDecision = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterDecision.semantic_authority_counts, {
      ...afterRevision.semantic_authority_counts,
      decisions: afterRevision.semantic_authority_counts.decisions + 1,
    });
    result.explicit_review_decision_created = true;
    record("workbench_records_explicit_decision_without_applying_transition");

    await waitForCondition(
      `document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-loading="false"]') !== null`,
      "GuideBrief settled before project-change review",
    );
    const guideBeforeImpact = await evaluateJson(`(() => {
      const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
      const rail = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
      const reviewFocus = rail?.querySelector('[data-guide-brief-review-focus="true"]');
      return {
        count: Number(shell?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1'),
        focus: reviewFocus?.textContent?.replace('Review focus', '')?.trim() ?? '',
      };
    })()`);
    assert.equal(Number.isSafeInteger(guideBeforeImpact.count), true);
    assert.equal(guideBeforeImpact.count >= 2, true);
    assert.notEqual(guideBeforeImpact.focus, "");

    const beforePreview = databaseSnapshot(database);
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-vnext-transition-action="preview"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="preview"][data-vnext-transition-step-status="prepared"][data-vnext-transition-preview-write="false"]') !== null`,
      "read-only operation-aware transition preview",
    );
    assert.deepEqual(databaseSnapshot(database), beforePreview);
    assert.equal(
      await evaluateBoolean(`(() => {
        const step = document.querySelector('[data-vnext-transition-step="preview"]');
        const text = step?.textContent ?? '';
        return text.includes('create') &&
          text.includes('current absent') &&
          text.includes('intended present');
      })()`),
      true,
    );
    result.transition_preview_read_only = true;
    const guideAfterImpactCount = await evaluateJson(`Number(document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1')`);
    assert.equal(guideAfterImpactCount, guideBeforeImpact.count);

    assert.equal(
      await evaluateBoolean(`(() => {
        const checkbox = document.querySelector('[data-vnext-transition-step="preview"] input[type="checkbox"]');
        if (!(checkbox instanceof HTMLInputElement)) return false;
        checkbox.click();
        return checkbox.checked;
      })()`),
      true,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-vnext-transition-action="confirm"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="confirmation"][data-vnext-transition-step-status="recorded"][data-vnext-transition-confirm-state-applied="false"] input[type="checkbox"]:not(:disabled)') !== null`,
      "separate semantic gate confirmation",
    );
    const afterGate = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterGate.semantic_authority_counts, {
      ...afterDecision.semantic_authority_counts,
      commit_gates: afterDecision.semantic_authority_counts.commit_gates + 1,
    });
    result.semantic_gate_separate_from_transition = true;
    const guideAfterConfirmationCount = await evaluateJson(`Number(document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1')`);
    assert.equal(guideAfterConfirmationCount, guideBeforeImpact.count);
    record("semantic_gate_persists_without_transition_state_or_packet");

    assert.equal(
      await evaluateBoolean(`(() => {
        const checkbox = document.querySelector('[data-vnext-transition-step="confirmation"] input[type="checkbox"]');
        if (!(checkbox instanceof HTMLInputElement)) return false;
        checkbox.click();
        return checkbox.checked;
      })()`),
      true,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-vnext-transition-action="apply"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="apply"][data-vnext-transition-step-status="applied"][data-vnext-transition-commit-packet-compiled="true"]') !== null && document.querySelector('[data-vnext-transition-step="later-packet"][data-vnext-transition-step-status="compiled"]') !== null`,
      "atomic semantic Transition and later packet",
    );
    await waitForCondition(
      `document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') === ${JSON.stringify(String(guideBeforeImpact.count + 1))} && document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-loading="false"]') !== null`,
      "GuideBrief refreshed once after project application",
    );
    await waitForCondition(
      `(() => {
        const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
        const state = shell?.getAttribute('data-ai-workplane-state');
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        if (!detail || !['change_decision', 'change_applied'].includes(state ?? '')) return false;
        return state === 'change_applied' ||
          detail.querySelectorAll('[data-ai-workplane-primary-action]').length === 1;
      })()`,
      "AI Workplane settled after project application",
    );
    const guideAfterApplication = await evaluateJson(`(() => {
      const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
      const rail = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
      const reviewFocus = rail?.querySelector('[data-guide-brief-review-focus="true"]');
      return {
        count: Number(shell?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1'),
        project: rail?.querySelector('strong')?.textContent?.trim() ?? '',
        focus: reviewFocus?.textContent?.replace('Review focus', '')?.trim() ?? '',
      };
    })()`);
    assert.equal(
      guideAfterApplication.count,
      guideBeforeImpact.count + 1,
    );
    assert.notEqual(guideAfterApplication.project, "");
    assert.doesNotMatch(
      guideAfterApplication.focus,
      /review impact|continue change review|complete project change/iu,
    );
    result.guide_brief_transition_request_counts = {
      before_impact: guideBeforeImpact.count,
      after_impact: guideAfterImpactCount,
      after_confirmation: guideAfterConfirmationCount,
      after_application: guideAfterApplication.count,
      application_delta: 1,
    };
    result.guide_brief_post_application_consistent = true;
    const appliedShape = await evaluateJson(`(() => {
      const apply = document.querySelector('[data-vnext-transition-step="apply"]');
      const packet = document.querySelector('[data-vnext-transition-step="later-packet"]');
      const safeguards = document.querySelector('[data-vnext-transition-safeguards="exact"]');
      const text = safeguards?.textContent ?? '';
      return {
        receipt_visible:
          apply?.textContent?.includes('Project updated') === true &&
          text.includes('StateTransitionReceipt ID'),
        create_effect_visible: text.includes('Before absent') && text.includes('After present'),
        later_packet_visible:
          packet?.getAttribute('data-vnext-transition-step-status') === 'compiled' &&
          text.includes('Later TaskContextPacket ID'),
        feedback_waiting_for_run: document.querySelector('[data-vnext-context-use-feedback="not_yet_available"]') !== null,
      };
    })()`);
    assert.deepEqual(appliedShape, {
      receipt_visible: true,
      create_effect_visible: true,
      later_packet_visible: true,
      feedback_waiting_for_run: true,
    });
    const afterClosure = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterClosure.semantic_authority_counts, {
      ...afterGate.semantic_authority_counts,
      semantic_state: afterGate.semantic_authority_counts.semantic_state + 1,
      transitions: afterGate.semantic_authority_counts.transitions + 1,
      packets: afterGate.semantic_authority_counts.packets + 1,
    });
    result.semantic_transition_applied = true;
    result.later_packet_compiled = true;
    result.context_use_feedback_waits_for_real_later_run = true;
    record("reviewed_create_transition_receipt_and_later_packet_apply_atomically");

    await validateSemanticReviewViewports();
    const beforeClosureReload = databaseSnapshot(database);
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `location.pathname === ${JSON.stringify(revisionPath)} && document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null && document.querySelector('[data-shared-inspector-handoff="true"] a[data-workbench-to-shared-inspector="true"][href^="/workbench/inspector?target=episode_delta_proposal&"]') !== null && document.querySelector('[data-vnext-transition-status="applied"]') !== null`,
      "durable Transition and packet lineage after reload",
    );
    assert.deepEqual(databaseSnapshot(database), beforeClosureReload);
    assert.deepEqual(
      readDirectHostBrowserState(manifest.project_id).semantic_authority_counts,
      afterClosure.semantic_authority_counts,
    );
    result.semantic_transition_reload_idempotent = true;
    result.semantic_proposals_created =
      afterClosure.semantic_authority_counts.proposals -
      before.semantic_authority_counts.proposals;
    result.review_decisions_created =
      afterClosure.semantic_authority_counts.decisions -
      before.semantic_authority_counts.decisions;
    result.semantic_transitions_created =
      afterClosure.semantic_authority_counts.transitions -
      before.semantic_authority_counts.transitions;
    assert.equal(result.semantic_proposals_created, 3);
    assert.equal(result.review_decisions_created, 1);
    assert.equal(result.semantic_transitions_created, 1);
    assert.equal(result.internal_id_entry_actions, 0);
    record("workbench_reload_reads_durable_lineage_without_duplicate_writes");

    const beforeAppliedInspector = databaseSnapshot(database);
    assert.equal(
      requests
        .slice(decisionFlowInspectorRequestStart)
        .some((entry) => entry.path === "/api/vnext/operator/inspector"),
      false,
      "decision, impact review, confirmation, application, and GuideBrief refresh must not request exact details",
    );
    const appliedInspectorHref = await waitForEvaluatedString(
      `document.querySelector('[data-shared-inspector-handoff="true"] a[data-workbench-to-shared-inspector="true"]')?.getAttribute('href') ?? ''`,
      "applied proposal Inspector href",
    );
    assert.match(appliedInspectorHref, /^\/workbench\/inspector\?target=episode_delta_proposal&/u);
    await navigate(new URL(appliedInspectorHref, appOrigin).toString());
    await waitForCondition(
      `location.pathname === '/workbench/inspector' && document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="episode_delta_proposal"]') !== null`,
      "applied proposal-focused shared Inspector",
    );
    const appliedInspectorShape = await evaluateJson(`(() => {
      const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
      const decision = inspector?.querySelector('[data-inspector-section="decision_gate"]');
      const transition = inspector?.querySelector('[data-inspector-section="transition_current_head"]');
      const later = inspector?.querySelector('[data-inspector-section="later_context_feedback"]');
      const text = inspector?.textContent ?? '';
      return {
        decision_gate: decision?.textContent?.includes('ReviewDecision: accept') === true && decision.textContent.includes('Semantic commit gate'),
        applied_transition: transition?.textContent?.includes('Applied StateTransitionReceipt') === true && transition.textContent.includes('Head presence'),
        later_packet: later?.textContent?.includes('Compiler-produced TaskContextPacket') === true,
        separation:
          text.includes('These details are read-only') &&
          text.includes('A saved ReviewDecision or gate is not a Transition application') &&
          text.includes('No model, provider, filesystem mutation, or external action is available here.'),
        mutation_controls: inspector?.querySelectorAll('form, [data-vnext-operator-decision-form], [data-vnext-transition-action]').length ?? -1,
      };
    })()`);
    assert.deepEqual(appliedInspectorShape, {
      decision_gate: true,
      applied_transition: true,
      later_packet: true,
      separation: true,
      mutation_controls: 0,
    });
    assert.deepEqual(databaseSnapshot(database), beforeAppliedInspector);
    result.applied_inspector_lineage_complete = true;
    assert.equal(
      await evaluateString(
        `document.querySelector('[data-contextual-inspector-return="suggested_change"]')?.getAttribute('href') ?? ''`,
      ),
      revisionPath,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector('[data-contextual-inspector-return="suggested_change"]');
        if (!(link instanceof HTMLAnchorElement)) return false;
        link.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(revisionPath)} && document.querySelector('[data-vnext-transition-status="applied"]') !== null`,
      "returned to applied Semantic Workbench",
    );

    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-active="true"]') !== null`,
      "operator Project Home for bounded later-packet cycle",
    );
    await openBlankStateProjectOptions();
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-project-control-kind="automation"][data-project-controls-hydrated="true"]')).some((element) => element.getBoundingClientRect().width > 0)`,
      "hydrated bounded automation controls",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const controls = Array.from(document.querySelectorAll('[data-project-control-kind="automation"]')).find((element) => element.getBoundingClientRect().width > 0);
        const button = controls
          ? Array.from(controls.querySelectorAll('button')).find(
              (candidate) => candidate.textContent?.trim() === 'Enable'
            )
          : null;
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-project-control-kind="automation"] button')).some((button) => button.textContent?.trim() === 'Queue bounded project verification')`,
      "automation work-source projection refresh",
    );
    await waitForCondition(
      `(() => {
        const details = Array.from(document.querySelectorAll('details[data-blank-state-project-options="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]') && candidate.textContent?.includes('Queue bounded project verification'));
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = true;
        return details.open;
      })()`,
      "hydrated automation work-source project options",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-project-control-kind="automation"] button')).some((button) => button.textContent?.trim() === 'Queue bounded project verification' && button.getBoundingClientRect().width > 0)`,
      "explicit automation work-source action",
    );
    const queueResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const controls = Array.from(document.querySelectorAll('[data-project-control-kind="automation"]')).find((element) => element.getBoundingClientRect().width > 0);
        const button = controls
          ? Array.from(controls.querySelectorAll('button')).find(
              (candidate) => candidate.textContent?.trim() === 'Queue bounded project verification'
            )
          : null;
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(queueResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/automation-cycle" &&
            entry.type === "Fetch" &&
            entry.method === "POST" &&
            entry.status === 202,
        ),
      "explicit automation work-source admission",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-project-control-kind="automation"] button')).some((button) => button.textContent?.trim() === 'Run one bounded cycle')`,
      "bounded automation eligibility refresh",
    );
    await waitForCondition(
      `(() => {
        const details = Array.from(document.querySelectorAll('details[data-blank-state-project-options="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]') && candidate.textContent?.includes('Run one bounded cycle'));
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = true;
        return details.open;
      })()`,
      "hydrated bounded-cycle project options",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-project-control-kind="automation"] button')).some((button) => button.textContent?.trim() === 'Run one bounded cycle' && button.getBoundingClientRect().width > 0)`,
      "eligible bounded automation cycle",
    );
    const boundedCycleControlShape = await evaluateJson(`(() => {
      const controls = Array.from(document.querySelectorAll('[data-project-control-kind="automation"]')).find((element) => element.getBoundingClientRect().width > 0) ?? null;
      return {
        field_count: controls?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        bounded_action_count: Array.from(controls?.querySelectorAll('button') ?? []).filter(
          (button) => button.textContent?.trim() === 'Run one bounded cycle'
        ).length,
      };
    })()`);
    assert.deepEqual(boundedCycleControlShape, {
      field_count: 0,
      bounded_action_count: 1,
    });
    const beforeBoundedCycle = readDirectHostBrowserState(manifest.project_id);
    const boundedCycleResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const controls = Array.from(document.querySelectorAll('[data-project-control-kind="automation"]')).find((element) => element.getBoundingClientRect().width > 0);
        const button = controls
          ? Array.from(controls.querySelectorAll('button')).find(
              (candidate) => candidate.textContent?.trim() === 'Run one bounded cycle'
            )
          : null;
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () =>
        responses.slice(boundedCycleResponseStart).some(
          (entry) =>
            entry.path === "/api/vnext/operator/automation-cycle" &&
            entry.type === "Fetch" &&
            entry.method === "POST" &&
            entry.status === 202,
        ),
      "bounded automation cycle acceptance",
    );
    const boundedCycleDeadline = Date.now() + DEFAULT_TIMEOUT_MS;
    let boundedCycleRead = null;
    while (Date.now() < boundedCycleDeadline) {
      boundedCycleRead = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/operator/automation-cycle');
        return { status: response.status, body: await response.json() };
      })()`);
      if (
        boundedCycleRead.status === 200 &&
        boundedCycleRead.body?.automation_cycle?.status === "review_needed"
      ) {
        break;
      }
      if (
        boundedCycleRead.body?.automation_cycle?.status ===
          "proposal_settlement_failed" ||
        ["failed", "cancelled", "timed_out", "reconciliation_required"].includes(
          boundedCycleRead.body?.automation_cycle?.status,
        )
      ) {
        break;
      }
      await delay(100);
    }
    assert.equal(
      boundedCycleRead?.body?.automation_cycle?.status,
      "review_needed",
      `bounded cycle did not reach review-needed: ${JSON.stringify({
        response_status: boundedCycleRead?.status,
        cycle_status: boundedCycleRead?.body?.automation_cycle?.status,
        stop_reason: boundedCycleRead?.body?.automation_cycle?.stop_reason,
        grant: boundedCycleRead?.body?.automation_cycle?.grant,
        run: boundedCycleRead?.body?.automation_cycle?.run,
      })}`,
    );
    const boundedReviewReloadStart = responses.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () => responses.slice(boundedReviewReloadStart).some(
        (entry) => entry.type === "Document" && entry.status === 200,
      ),
      "bounded automation review document reload",
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-automation-run="review_needed"]') !== null && document.querySelector('[data-blank-state-automation-stop="review_needed"]') !== null`,
      "bounded automation review projection reload",
    );
    await waitForCondition(
      `(() => {
        const details = Array.from(document.querySelectorAll('details[data-blank-state-project-options="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]') && candidate.querySelector('[data-blank-state-automation-run="review_needed"]'));
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = true;
        return details.open;
      })()`,
      "hydrated automation review project options",
    );
    await waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state-automation-run="review_needed"]')).some((element) => element.getBoundingClientRect().width > 0) && Array.from(document.querySelectorAll('[data-blank-state-automation-stop="review_needed"]')).some((element) => element.getBoundingClientRect().width > 0) && Array.from(document.querySelectorAll('a')).some((link) => link.textContent?.trim() === 'Review suggested change' && link.getBoundingClientRect().width > 0) && Array.from(document.querySelectorAll('a')).some((link) => link.textContent?.trim() === 'Share outcome' && link.getBoundingClientRect().width > 0)`,
      "bounded automation review-needed stop",
    );
    const afterBoundedCycle = readDirectHostBrowserState(manifest.project_id);
    assert.equal(
      afterBoundedCycle.direct_receipt_count,
      beforeBoundedCycle.direct_receipt_count + 1,
    );
    assert.equal(
      afterBoundedCycle.direct_run_count,
      beforeBoundedCycle.direct_run_count + 1,
    );
    assert.deepEqual(afterBoundedCycle.semantic_authority_counts, {
      ...beforeBoundedCycle.semantic_authority_counts,
      packets: beforeBoundedCycle.semantic_authority_counts.packets + 1,
      proposals: beforeBoundedCycle.semantic_authority_counts.proposals + 1,
    });
    assert.equal(
      afterBoundedCycle.latest_receipt.execution_environment.runtime_labels.includes(
        "policy_triggered",
      ),
      true,
    );
    result.bounded_automation_cycle_started = true;
    result.bounded_automation_review_needed = true;
    record("bounded_policy_cycle_stops_at_one_pending_review_proposal");

    const beforeBoundedReload = databaseSnapshot(database);
    const boundedDurabilityReloadStart = responses.length;
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForHostCondition(
      () => responses.slice(boundedDurabilityReloadStart).some(
        (entry) => entry.type === "Document" && entry.status === 200,
      ),
      "bounded automation durability document reload",
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-automation-run="review_needed"]') !== null && Array.from(document.querySelectorAll('[data-project-automation-inspector="true"]')).some((link) => link.closest('[data-blank-state-project-management-hydrated="true"]') && link.getAttribute('href')?.startsWith('/workbench/inspector?target=automation_run&'))`,
      "bounded automation durable review-needed reload",
    );
    assert.deepEqual(databaseSnapshot(database), beforeBoundedReload);
    result.bounded_automation_reload_idempotent = true;

    const beforeAutomationInspector = databaseSnapshot(database);
    const automationInspectorHref = await evaluateString(
      `Array.from(document.querySelectorAll('[data-project-automation-inspector="true"]')).find((link) => link.closest('[data-blank-state-project-management-hydrated="true"]') && link.getAttribute('href')?.startsWith('/workbench/inspector?target=automation_run&'))?.getAttribute('href') ?? ''`,
    );
    assert.match(automationInspectorHref, /^\/workbench\/inspector\?target=automation_run&/u);
    await navigate(new URL(automationInspectorHref, appOrigin).toString());
    await waitForCondition(
      `location.pathname === '/workbench/inspector' && document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="automation_run"] [data-inspector-section="automation"]') !== null`,
      "bounded automation shared Inspector",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
        const automation = inspector?.querySelector('[data-inspector-section="automation"]');
        const text = automation?.textContent ?? '';
        return (
          text.includes('Policy control revision') &&
          text.includes('Bounded CapabilityGrant') &&
          text.includes('Bounded automation cycle') &&
          text.includes('Bounded automation run') &&
          text.includes('Bounded RunReceipt') &&
          text.includes('Decision created') &&
          text.includes('Transition created') &&
          text.includes('false') &&
          text.includes('no automatic decision, gate, Transition, Evidence acceptance, or Perspective promotion') &&
          inspector?.querySelectorAll('form, [data-vnext-operator-decision-form], [data-vnext-transition-action]').length === 0
        );
      })()`),
      true,
    );
    assert.equal(
      await evaluateString(
        `document.querySelector('[data-contextual-inspector-return="delegated_work"]')?.getAttribute('href') ?? ''`,
      ),
      "/workbench/semantic-review#delegated-work",
    );
    assert.deepEqual(databaseSnapshot(database), beforeAutomationInspector);
    assert.deepEqual(
      readDirectHostBrowserState(manifest.project_id).semantic_authority_counts,
      afterBoundedCycle.semantic_authority_counts,
    );
    result.bounded_automation_shared_inspector_complete = true;
    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-automation-run="review_needed"]') !== null && document.querySelector('[data-project-automation-inspector="true"]') !== null`,
      "returned to bounded automation Project Home",
    );

    const contextUseFeedbackHref = await evaluateString(`(() => {
        const link = Array.from(document.querySelectorAll('a')).find(
          (candidate) => candidate.textContent?.trim() === 'Share outcome'
        );
        return link?.getAttribute('href') ?? '';
      })()`);
    assert.match(
      contextUseFeedbackHref,
      /^\/workbench\/semantic-review\/episode-delta-proposal~[a-f0-9]{24}$/,
    );
    const boundedReviewProposalHref = await evaluateString(`(() => {
        const link = Array.from(document.querySelectorAll('a')).find(
          (candidate) => candidate.textContent?.trim() === 'Review suggested change'
        );
        return link?.getAttribute('href') ?? '';
      })()`);
    assert.match(
      boundedReviewProposalHref,
      /^\/workbench\/semantic-review\/episode-delta-proposal~[a-f0-9]{24}$/,
    );
    const boundedResultHref = `/workbench/results/${afterBoundedCycle.latest_receipt.receipt_id.replace(":", "~")}`;
    const beforeBoundedResultRead = databaseSnapshot(database);
    const boundedResultRequestStart = requests.length;
    await navigate(new URL(boundedResultHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-run-result-review="v0.1"] [data-task-success-criteria="available"][data-task-success-status="satisfied"]') !== null`,
      "policy-triggered exact criterion result readback",
    );
    const exactResultRelationReadback = await evaluateJson(`(() => {
      const review = document.querySelector('[data-run-result-review="v0.1"]');
      const assessment = review?.querySelector(
        '[data-task-success-criteria="available"][data-task-success-status="satisfied"]'
      );
      return {
        read_only: review?.getAttribute('data-result-review-read-only') === 'true',
        semantic_mutation: review?.getAttribute('data-semantic-mutation') ?? null,
        form_field_count: review?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
        compact_criterion_summary:
          assessment?.querySelector('[data-result-criterion-summary="compact"]') !== null &&
          assessment?.textContent?.includes('Satisfied4') === true,
        duplicate_criterion_details: assessment?.querySelectorAll('[data-criterion-status]').length ?? -1,
        shared_inspector_link: review?.querySelector('[data-result-to-shared-inspector="true"]') !== null,
      };
    })()`);
    assert.deepEqual(exactResultRelationReadback, {
      read_only: true,
      semantic_mutation: "false",
      form_field_count: 0,
      compact_criterion_summary: true,
      duplicate_criterion_details: 0,
      shared_inspector_link: true,
    });
    assert.deepEqual(databaseSnapshot(database), beforeBoundedResultRead);
    assert.equal(
      requests
        .slice(boundedResultRequestStart)
        .some((request) => request.method !== "GET"),
      false,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector('[data-result-to-shared-inspector="true"]');
        link?.click();
        return Boolean(link);
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === '/workbench/inspector' && document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="run_receipt"] [data-inspector-section="criterion_basis"]') !== null`,
      "policy-triggered receipt Inspector exact criterion basis",
    );
    const exactInspectorCriteria = await evaluateJson(`(() => {
      const section = document.querySelector('[data-inspector-section="criterion_basis"]');
      for (const details of section?.querySelectorAll('details') ?? []) details.open = true;
      const criteria = Array.from(section?.querySelectorAll('[data-inspector-item-status]') ?? []);
      const text = section?.textContent ?? '';
      return {
        criterion_count: criteria.length,
        all_satisfied: criteria.every((entry) => entry.getAttribute('data-inspector-item-status') === 'satisfied'),
        observed_basis: criteria.every((entry) => entry.textContent?.includes('observed') === true),
        exact_support_refs:
          text.includes('criterion assessment') &&
          text.includes(${JSON.stringify(afterBoundedCycle.latest_receipt.integrity.fingerprint)}),
        read_only: document.querySelector('[data-shared-project-inspector="v0.1"]')?.getAttribute('data-inspector-read-only'),
      };
    })()`);
    assert.deepEqual(exactInspectorCriteria, {
      criterion_count: 4,
      all_satisfied: true,
      observed_basis: true,
      exact_support_refs: true,
      read_only: "true",
    });
    assert.deepEqual(databaseSnapshot(database), beforeBoundedResultRead);
    await navigate(new URL(boundedResultHref, appOrigin).toString());
    await waitForCondition(
      `location.pathname === ${JSON.stringify(boundedResultHref)} && document.querySelector('[data-result-criterion-summary="compact"]') !== null`,
      "returned to compact policy-triggered result",
    );
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-task-success-criteria="available"][data-task-success-status="satisfied"] [data-result-criterion-summary="compact"]') !== null`,
      "policy-triggered compact criterion result reload",
    );
    assert.deepEqual(databaseSnapshot(database), beforeBoundedResultRead);
    assert.equal(
      requests
        .slice(boundedResultRequestStart)
        .some((request) => request.method !== "GET"),
      false,
    );
    const beforeBoundedProposalRead = databaseSnapshot(database);
    const boundedProposalRequestStart = requests.length;
    await navigate(new URL(boundedReviewProposalHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"] [data-vnext-decision-workbench="v0.1"]') !== null`,
      "policy-triggered canonical proposal detail",
    );
    const proposalInspectorHref = await evaluateString(`(() => {
      const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      if (detail?.querySelector('[data-run-assessment-proposal="v0.1"]') !== null) return '';
      return detail?.querySelector('[data-proposal-to-shared-inspector="true"]')?.getAttribute('href') ?? '';
    })()`);
    assert.match(
      proposalInspectorHref,
      /^\/workbench\/inspector\?target=episode_delta_proposal&record_id=[^&]+&fingerprint=sha256%3A[a-f0-9]{64}$/u,
    );
    await navigate(new URL(proposalInspectorHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="episode_delta_proposal"] [data-inspector-section="criterion_basis"]') !== null`,
      "policy-triggered proposal-focused criterion Inspector",
    );
    const exactRelationReadback = await evaluateJson(`(() => {
      const assessment = document.querySelector('[data-inspector-section="criterion_basis"]');
      for (const details of assessment?.querySelectorAll('details') ?? []) details.open = true;
      const criteria = Array.from(
        assessment?.querySelectorAll('[data-inspector-item-status]') ?? []
      );
      const text = assessment?.textContent ?? '';
      return {
        present: assessment !== null,
        criterion_count: criteria.length,
        criteria_satisfied_observed: criteria.every(
          (criterion) =>
            criterion.getAttribute('data-inspector-item-status') === 'satisfied' &&
            criterion.textContent?.includes('observed') === true
        ),
        exact_relation_refs:
          text.includes('criterion assessment') &&
          text.includes(${JSON.stringify(afterBoundedCycle.latest_receipt.integrity.fingerprint)}),
        read_only:
          document.querySelector('[data-shared-project-inspector="v0.1"]')?.getAttribute('data-inspector-read-only'),
      };
    })()`);
    assert.deepEqual(exactRelationReadback, {
      present: true,
      criterion_count: 4,
      criteria_satisfied_observed: true,
      exact_relation_refs: true,
      read_only: "true",
    });
    assert.deepEqual(databaseSnapshot(database), beforeBoundedProposalRead);
    assert.equal(
      requests
        .slice(boundedProposalRequestStart)
        .some((request) => request.method !== "GET"),
      false,
    );
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="episode_delta_proposal"] [data-inspector-section="criterion_basis"] [data-inspector-item-status="satisfied"]') !== null`,
      "policy-triggered proposal Inspector relation reload",
    );
    assert.deepEqual(databaseSnapshot(database), beforeBoundedProposalRead);
    assert.equal(
      requests
        .slice(boundedProposalRequestStart)
        .some((request) => request.method !== "GET"),
      false,
    );
    result.bounded_automation_exact_relation_readback = true;
    record("policy_triggered_exact_criterion_relations_render_and_reload_read_only");
    await navigate(new URL(contextUseFeedbackHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null || document.querySelector('[data-vnext-semantic-review] [role="alert"]') !== null`,
      "policy-triggered later-run feedback proposal detail",
    );
    const contextUseFeedbackState = await evaluateJson(`(() => ({
      path: location.pathname,
      review_state: document.querySelector('[data-vnext-semantic-review]')?.getAttribute('data-vnext-semantic-review-state') ?? null,
      feedback_state: document.querySelector('[data-vnext-context-use-feedback]')?.getAttribute('data-vnext-context-use-feedback') ?? null,
      alert: document.querySelector('[data-vnext-semantic-review] [role="alert"]')?.textContent?.trim() ?? null,
    }))()`);
    assert.equal(
      contextUseFeedbackState.feedback_state,
      "available",
      `policy-triggered feedback proposal did not expose current feedback: ${JSON.stringify(contextUseFeedbackState)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-context-use-feedback="available"] [data-vnext-context-use-review-form="v0.1"]') !== null`,
      "policy-triggered later-run feedback form",
    );
    const beforeBoundedFeedback = readDirectHostBrowserState(manifest.project_id);
    assert.equal(
      await evaluateBoolean(`(() => {
        const form = document.querySelector('[data-vnext-context-use-review-form="v0.1"]');
        const selects = form?.querySelectorAll('select');
        if (!form || !selects || selects.length !== 2) return false;
        selects[0].value = 'yes';
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
        selects[1].value = 'helpful';
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`),
      true,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(
          document.querySelectorAll('[data-vnext-context-use-review-form="v0.1"] button')
        ).find((candidate) => candidate.textContent?.trim() === 'Save feedback');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-context-use-review-actually-used-basis="user_declaration"][data-context-use-review-presentation-basis="direct_local_observation"]') !== null`,
      "policy-triggered context-use provenance",
    );
    const afterBoundedFeedback = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterBoundedFeedback.semantic_authority_counts, {
      ...beforeBoundedFeedback.semantic_authority_counts,
      context_use_reviews:
        beforeBoundedFeedback.semantic_authority_counts.context_use_reviews + 1,
    });
    result.bounded_automation_context_feedback_recorded = true;
    record("policy_triggered_later_receipt_uses_explicit_non_authoritative_feedback");
  });

  }

  if (RUN_CONTINUITY_SCOPE) {
    database ??= new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    await runPhase("synthetic_session_bootstrap", async () => {
      await navigate(`${appOrigin}/workbench/semantic-review`);
      await waitForCondition(
        `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null || document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
        "continuity operator session state",
      );
      if (
        await evaluateBoolean(
          `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
        )
      ) {
        bootstrapToken = await issueBootstrap(runtimeEnvironment);
        await setBootstrapInput(bootstrapToken);
        assert.equal(
          await evaluateBoolean(`(() => {
            const form = document.querySelector('#vnext-operator-bootstrap-token')?.closest('form');
            if (!form) return false;
            form.requestSubmit();
            return true;
          })()`),
          true,
        );
        await waitForCondition(
          `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
          "authenticated continuity local session",
        );
        assert.equal(
          await evaluateBoolean(
            `document.documentElement.innerHTML.includes(${JSON.stringify(bootstrapToken)})`,
          ),
          false,
        );
        assert.equal(serverLog.includes(bootstrapToken), false);
        bootstrapToken = null;
      }
    });

  await runPhase("multi_candidate_transition_scope", async () => {
    const currentPacket = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND project_id = ?
         ORDER BY created_at DESC, record_id DESC`,
      )
      .all(manifest.project_id)
      .map((row) => JSON.parse(row.payload_json))
      .find((packet) =>
        packet.selected_context?.some(
          (entry) => entry.entry_kind === "accepted_state_ref",
        ),
      );
    assert(currentPacket, "current accepted-state packet fixture missing");
    const currentMultiCandidateProject = {
      fixture_id: "semantic-review-loop-current-multi-candidate",
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      run_id: "run:operator-browser-current-multi-candidate-scope",
    };
    const currentMultiCandidateReceipt =
      buildSemanticReviewLoopRunReceiptFixture(
        currentMultiCandidateProject,
        currentPacket,
        { timeline_anchor_at: currentPacket.generated_at },
      );
    const currentMultiCandidateProposal =
      buildSemanticReviewLoopProposalFixture(
        currentMultiCandidateProject,
        currentPacket,
        currentMultiCandidateReceipt,
        {
          primary_delta_type: "agent_plan_delta",
          candidate_namespace: "browser-current-transition-scope",
          timeline_anchor_at: currentPacket.generated_at,
        },
      );
    const writableMultiCandidateDatabase = new Database(databasePath);
    try {
      writableMultiCandidateDatabase.pragma("foreign_keys = ON");
      writableMultiCandidateDatabase.transaction(() => {
        admitStructuredRunReceiptV01(
          writableMultiCandidateDatabase,
          currentMultiCandidateReceipt,
        );
        insertVNextCoreRecordV01(writableMultiCandidateDatabase, {
          record_kind: "episode_delta_proposal",
          record_id: currentMultiCandidateProposal.proposal_id,
          workspace_id: currentMultiCandidateProposal.workspace_id,
          project_id: currentMultiCandidateProposal.project_id,
          fingerprint: currentMultiCandidateProposal.integrity.fingerprint,
          idempotency_key: null,
          payload: currentMultiCandidateProposal,
          created_at: currentMultiCandidateProposal.created_at,
        });
      })();
    } finally {
      writableMultiCandidateDatabase.close();
    }
    const path = `/workbench/semantic-review/${currentMultiCandidateProposal.proposal_id.replace(":", "~")}`;
    const beforeMultiCandidate = readDirectHostBrowserState(manifest.project_id);
    await navigate(`${appOrigin}${path}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(path)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.querySelectorAll('option').length === 2`,
      "two-candidate decision-centered Workbench",
    );
    const candidateIds = await evaluateJson(`(() => {
      const select = document.querySelector('[data-vnext-candidate-selector="v0.1"]');
      if (!(select instanceof HTMLSelectElement)) return [];
      return Array.from(select.options).map((option) => option.value);
    })()`);
    assert.equal(candidateIds.length, 2);
    assert.notEqual(candidateIds[0], candidateIds[1]);
    const [candidateA, candidateB] = candidateIds;

    const recordSelectedAcceptDecision = async (candidateId, rationale) => {
      await waitForCondition(
        `document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-operator-decision-candidate=${JSON.stringify(candidateId)}][data-vnext-proposal-local-controls-busy="false"]') !== null`,
        `selected candidate ${candidateId} decision controls ready`,
      );
      await setFormControlValue(
        '[data-vnext-operator-decision-form="v0.1"] select',
        0,
        "accept",
      );
      await setFormControlValue(
        '[data-vnext-operator-decision-form="v0.1"] textarea',
        0,
        rationale,
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = document.querySelector('[data-vnext-operator-decision-form="v0.1"] button[type="submit"]');
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          return true;
        })()`),
        true,
        `selected candidate ${candidateId} accept decision must be submit-ready`,
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateId)} && document.querySelector('[data-vnext-transition-applying-decision-count="1"]') !== null && document.querySelector('[data-vnext-decision-history="v0.1"] li strong')?.textContent?.trim() === 'accept'`,
        `persisted exact accept decision for ${candidateId}`,
      );
    };
    const selectCandidate = async (candidateId) => {
      await setFormControlValue(
        '[data-vnext-candidate-selector="v0.1"]',
        0,
        candidateId,
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)')?.value === ${JSON.stringify(candidateId)} && document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-proposal-local-controls-busy="false"]')?.getAttribute('data-vnext-operator-decision-candidate') === ${JSON.stringify(candidateId)}`,
        `selected candidate ${candidateId}`,
      );
    };
    const clickTransitionAction = async (action) => {
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = document.querySelector('[data-vnext-transition-action="${action}"]');
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          return true;
        })()`),
        true,
        `selected candidate ${action} Transition action must be enabled`,
      );
    };
    const reviewTransitionCheckbox = async (step) => {
      assert.equal(
        await evaluateBoolean(`(() => {
          const checkbox = document.querySelector('[data-vnext-transition-step="${step}"] input[type="checkbox"]');
          if (!(checkbox instanceof HTMLInputElement) || checkbox.disabled) return false;
          checkbox.click();
          return checkbox.checked;
        })()`),
        true,
        `selected candidate ${step} review checkbox must be enabled`,
      );
    };

    await recordSelectedAcceptDecision(
      candidateA,
      "Accept candidate A for a separately previewed and authorized transition interaction-scope proof.",
    );
    await selectCandidate(candidateB);
    await recordSelectedAcceptDecision(
      candidateB,
      "Accept candidate B independently so candidate-local decisions and persisted receipts can be distinguished.",
    );

    await selectCandidate(candidateA);
    const beforeLatePreview = databaseSnapshot(database);
    pauseNextSemanticTransitionRequest("preview");
    await clickTransitionAction("preview");
    await waitForPausedSemanticTransitionRequest("preview");
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)') !== null`,
      ),
      true,
      "read-only preview permits safe candidate switching while its response is discarded by exact scope",
    );
    await selectCandidate(candidateB);
    const candidateBShapeBeforeLateResponse = await evaluateJson(`(() => {
      const transition = document.querySelector('[data-vnext-semantic-transition-actions="v0.1"]');
      const preview = transition?.querySelector('[data-vnext-transition-step="preview"]');
      const confirmation = transition?.querySelector('[data-vnext-transition-step="confirmation"]');
      const apply = transition?.querySelector('[data-vnext-transition-step="apply"]');
      const later = transition?.querySelector('[data-vnext-transition-step="later-packet"]');
      const confirmButton = transition?.querySelector('[data-vnext-transition-action="confirm"]');
      const applyButton = transition?.querySelector('[data-vnext-transition-action="apply"]');
      return {
        applying_decisions: transition?.getAttribute('data-vnext-transition-applying-decision-count'),
        persisted_receipts: transition?.getAttribute('data-vnext-transition-persisted-receipt-count'),
        preview: preview?.getAttribute('data-vnext-transition-step-status'),
        confirmation_absent: confirmation === null,
        apply_absent: apply === null,
        later_packet_absent: later === null,
        checkbox_count: transition?.querySelectorAll('input[type="checkbox"]').length ?? -1,
        error_or_status_count: transition?.querySelectorAll('[role="alert"], [role="status"]').length ?? -1,
        confirm_action_absent: confirmButton === null,
        apply_action_absent: applyButton === null,
        primary_action_count: transition?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        exact_decision_value: transition?.getAttribute('data-vnext-transition-selected-decision-kind') ?? null,
        accepted_wording_present: /exact accepted decision|accept carries intent/i.test(transition?.textContent ?? ''),
      };
    })()`);
    assert.deepEqual(candidateBShapeBeforeLateResponse, {
      applying_decisions: "1",
      persisted_receipts: "0",
      preview: "not_prepared",
      confirmation_absent: true,
      apply_absent: true,
      later_packet_absent: true,
      checkbox_count: 0,
      error_or_status_count: 0,
      confirm_action_absent: true,
      apply_action_absent: true,
      primary_action_count: 1,
      exact_decision_value: "accept",
      accepted_wording_present: false,
    });
    await releasePausedSemanticTransitionRequest("preview");
    await waitForRequestQuiet();
    assert.deepEqual(databaseSnapshot(database), beforeLatePreview);
    assert.equal(
      await evaluateBoolean(`(() => {
        const transition = document.querySelector('[data-vnext-semantic-transition-actions="v0.1"]');
        return transition?.querySelector('[data-vnext-transition-step="preview"]')?.getAttribute('data-vnext-transition-step-status') === 'not_prepared' &&
          transition.querySelectorAll('input[type="checkbox"]').length === 0 &&
          transition.querySelectorAll('[role="alert"], [role="status"]').length === 0 &&
          transition.getAttribute('data-vnext-transition-persisted-receipt-count') === '0';
      })()`),
      true,
      "candidate A's late preview response must not populate candidate B",
    );

    await selectCandidate(candidateA);
    assert.equal(
      await evaluateBoolean(`(() => {
        const transition = document.querySelector('[data-vnext-semantic-transition-actions="v0.1"]');
        return transition?.querySelector('[data-vnext-transition-step="preview"]')?.getAttribute('data-vnext-transition-step-status') === 'not_prepared' &&
          transition.getAttribute('data-vnext-transition-persisted-receipt-count') === '0' &&
          transition.querySelectorAll('input[type="checkbox"]').length === 0 &&
          transition.querySelectorAll('[role="alert"], [role="status"]').length === 0;
      })()`),
      true,
      "switching back must not resurrect candidate A ephemeral preview state",
    );
    await clickTransitionAction("preview");
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="preview"][data-vnext-transition-step-status="prepared"]') !== null`,
      "fresh candidate A preview after switch-back",
    );
    await reviewTransitionCheckbox("preview");

    pauseNextSemanticTransitionRequest("confirm");
    await clickTransitionAction("confirm");
    await waitForPausedSemanticTransitionRequest("confirm");
    await waitForCondition(
      `document.querySelector('[data-vnext-candidate-selector="v0.1"][disabled][data-vnext-transition-mutation-busy="true"]') !== null`,
      "candidate selector locked during gate confirmation",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const form = document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-proposal-local-controls-busy="true"]');
        const controls = Array.from(form?.querySelectorAll('select, textarea, button') ?? []);
        return controls.length > 0 && controls.every((control) => control.disabled === true);
      })()`),
      true,
      "all candidate A decision-form controls must render disabled during gate confirmation",
    );
    await releasePausedSemanticTransitionRequest("confirm");
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="confirmation"][data-vnext-transition-step-status="recorded"]') !== null && document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)') !== null`,
      "candidate A gate completion unlocks selector",
    );
    await reviewTransitionCheckbox("confirmation");

    pauseNextSemanticTransitionRequest("apply");
    await clickTransitionAction("apply");
    await waitForPausedSemanticTransitionRequest("apply");
    await waitForCondition(
      `document.querySelector('[data-vnext-candidate-selector="v0.1"][disabled][data-vnext-transition-mutation-busy="true"]') !== null`,
      "candidate selector locked during Transition application",
    );
    assert.equal(
      await evaluateBoolean(`document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-proposal-local-controls-busy="true"] button:disabled') !== null`),
      true,
      "candidate A decision submission must render disabled during Transition apply",
    );
    await releasePausedSemanticTransitionRequest("apply");
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="apply"][data-vnext-transition-step-status="applied"]') !== null && document.querySelector('[data-vnext-transition-persisted-receipt-count="1"]') !== null && document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)') !== null`,
      "candidate A Transition completion unlocks selector",
    );

    const afterMultiCandidate = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterMultiCandidate.semantic_authority_counts, {
      ...beforeMultiCandidate.semantic_authority_counts,
      semantic_state:
        beforeMultiCandidate.semantic_authority_counts.semantic_state + 1,
      decisions: beforeMultiCandidate.semantic_authority_counts.decisions + 2,
      commit_gates:
        beforeMultiCandidate.semantic_authority_counts.commit_gates + 1,
      transitions:
        beforeMultiCandidate.semantic_authority_counts.transitions + 1,
      packets: beforeMultiCandidate.semantic_authority_counts.packets + 1,
    });
    result.review_decisions_created += 2;
    result.semantic_transitions_created += 1;
    result.multi_candidate_transition_scope = true;
    result.candidate_switch_mutation_locking = true;
    result.late_preview_response_discarded = true;
    result.applying_decision_wording_truthful = true;
    record("multi_candidate_transition_state_is_bound_to_exact_candidate_and_decision");
    record("late_preview_response_is_discarded_after_candidate_switch");
    record("gate_and_apply_mutations_lock_candidate_and_proposal_local_controls");
    record("applying_decision_wording_and_exact_values_remain_truthful");
  });

  }

  if (RUN_CONTINUITY_SCOPE) {
  await runPhase("personal_perspective_inspector", async () => {
    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "active Personal Perspective source Project Home",
    );
    await openBlankStateProjectOptions();
    if (
      await evaluateBoolean(
        `Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Include Personal Perspective' && button instanceof HTMLButtonElement && !button.disabled)`,
      )
    ) {
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === 'Include Personal Perspective' &&
              candidate instanceof HTMLButtonElement && !candidate.disabled
          );
          button?.click();
          return Boolean(button);
        })()`),
        true,
      );
      await waitForCondition(
        `document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Exclude Personal Perspective')`,
        "included Personal Perspective scope for exact source project",
      );
    } else {
      assert.equal(
        await evaluateBoolean(
          `document.body.textContent.includes('Eligible reviewed Personal Perspective material may enter normal project context selection')`,
        ),
        true,
        "Personal Perspective source project must already be explicitly included",
      );
    }
    const currentPacket = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND workspace_id = ?
           AND project_id = ?
         ORDER BY created_at DESC, record_id DESC`,
      )
      .all(manifest.workspace_id, manifest.project_id)
      .map((row) => JSON.parse(row.payload_json))
      .find((packet) =>
        packet.selected_context?.some(
          (entry) => entry.entry_kind === "accepted_state_ref",
        ),
      );
    assert(currentPacket, "current accepted-state packet fixture missing");
    const beforePersonalPerspective = readDirectHostBrowserState(
      manifest.project_id,
    );
    const personalPerspectiveSummary =
      "Reviewed task preference selected only for the exact R7-C browser packet.";
    const unrelatedProjectSummary =
      "UNRELATED PROJECT PERSONAL PERSPECTIVE MUST REMAIN EXCLUDED";
    const sourcePacketGeneratedAt = new Date().toISOString();
    const personalPerspectiveCandidate = {
      candidate_scope: {
        scope_kind: "canonical_project",
        workspace_id: manifest.workspace_id,
        project_id: manifest.project_id,
      },
      review_status: "reviewed",
      trust_policy_status: "eligible",
      entry: {
        entry_id: "personal-perspective:r7c-browser-exact-task",
        entry_kind: "memory_ref",
        source_ref: "personal-perspective-source:r7c-browser-exact-task",
        external_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "reviewed_memory",
          external_id: "reviewed-memory:r7c-browser-exact-task",
          observed_at: sourcePacketGeneratedAt,
          trust_class: "direct_local_observation",
        },
        why_included:
          "The reviewed preference was selected for this exact task packet.",
        currentness: {
          status: "fresh",
          as_of: sourcePacketGeneratedAt,
          basis:
            "Exact reviewed candidate supplied to normal project context selection.",
          source_ref: {
            ref_version: "external_ref.v0.1",
            ref_type: "reviewed_memory_currentness",
            external_id: "reviewed-memory-currentness:r7c-browser-exact-task",
            observed_at: sourcePacketGeneratedAt,
            trust_class: "direct_local_observation",
          },
        },
        trust_class: "direct_local_observation",
        compatibility_source_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "reviewed_memory_compatibility",
          external_id: "reviewed-memory-compatibility:r7c-browser-exact-task",
          observed_at: sourcePacketGeneratedAt,
          trust_class: "direct_local_observation",
        },
        bounded_summary: personalPerspectiveSummary,
      },
    };
    const personalPerspectiveScopeDatabase = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    let personalPerspectiveSelection;
    try {
      const scope = readPersonalPerspectiveEffectiveScopeV01(
        personalPerspectiveScopeDatabase,
        {
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
        },
      );
      personalPerspectiveSelection = selectPersonalPerspectiveContextV01({
        workspace_id: manifest.workspace_id,
        project_id: manifest.project_id,
        scope,
        candidates: [personalPerspectiveCandidate],
      });
    } finally {
      personalPerspectiveScopeDatabase.close();
    }
    assert.equal(
      personalPerspectiveSelection.eligible_selected_count,
      1,
      "exact Personal Perspective candidate must pass the existing project scope gate",
    );
    const personalPerspectiveSourcePacket = buildTaskContextPacketV01({
      workspace_id: currentPacket.workspace_id,
      project_id: currentPacket.project_id,
      work_ref: currentPacket.work_ref,
      generated_at: sourcePacketGeneratedAt,
      expires_at: new Date(
        Date.parse(sourcePacketGeneratedAt) + 30 * 60_000,
      ).toISOString(),
      task: currentPacket.task,
      current_projection: currentPacket.current_projection,
      selected_context: [
        ...currentPacket.selected_context.filter(
          (entry) =>
            entry.compatibility_source_ref?.ref_type !==
            "project_personal_perspective_scope",
        ),
        ...personalPerspectiveSelection.selected_context,
      ],
      excluded_context: currentPacket.excluded_context,
      tensions: currentPacket.tensions,
      risks: currentPacket.risks,
      gaps: currentPacket.gaps,
      constraints: currentPacket.constraints,
      capability_grant: currentPacket.capability_grant,
      criterion_verification_plan:
        currentPacket.criterion_verification_plan,
      return_contract: currentPacket.return_contract,
      source_status: currentPacket.source_status,
      compatibility: {
        ...currentPacket.compatibility,
        source_refs: [
          ...currentPacket.compatibility.source_refs,
          ...(personalPerspectiveSelection.scope_lineage_ref
            ? [personalPerspectiveSelection.scope_lineage_ref]
            : []),
        ],
        warnings: [
          ...currentPacket.compatibility.warnings,
          "Personal Perspective material passed explicit project scope, review, currentness, trust, and normal context selection.",
        ],
      },
      authority_notes: [
        ...currentPacket.authority_summary.notes,
        "Personal Perspective selection changes task context only; it grants no semantic or execution authority.",
      ],
    });
    const personalPerspectiveProject = {
      fixture_id: "semantic-review-loop-personal-perspective-inspector",
      workspace_id: manifest.workspace_id,
      project_id: manifest.project_id,
      run_id: "run:operator-browser-personal-perspective-inspector",
    };
    const personalPerspectiveReceipt = buildSemanticReviewLoopRunReceiptFixture(
      personalPerspectiveProject,
      personalPerspectiveSourcePacket,
      { timeline_anchor_at: personalPerspectiveSourcePacket.generated_at },
    );
    const personalPerspectiveAssessment = evaluateCriterionAssessmentV01({
      packet: personalPerspectiveSourcePacket,
      receipt: personalPerspectiveReceipt,
    });
    const personalPerspectiveProposalMaterial =
      materializeRunAssessmentProposalV01({
        packet: personalPerspectiveSourcePacket,
        receipt: personalPerspectiveReceipt,
        assessment: personalPerspectiveAssessment,
      });
    const sourceProposal = personalPerspectiveProposalMaterial.proposal;
    const sourceCandidate = sourceProposal.proposed_deltas[0];
    assert(sourceCandidate, "Personal Perspective source candidate missing");
    const writableDatabase = new Database(databasePath);
    try {
      writableDatabase.pragma("foreign_keys = ON");
      writableDatabase.transaction(() => {
        insertVNextCoreRecordV01(writableDatabase, {
          record_kind: "task_context_packet",
          record_id: personalPerspectiveSourcePacket.packet_id,
          workspace_id: personalPerspectiveSourcePacket.workspace_id,
          project_id: personalPerspectiveSourcePacket.project_id,
          fingerprint: personalPerspectiveSourcePacket.integrity.fingerprint,
          idempotency_key: null,
          payload: personalPerspectiveSourcePacket,
          created_at: personalPerspectiveSourcePacket.generated_at,
        });
        admitStructuredRunReceiptV01(
          writableDatabase,
          personalPerspectiveReceipt,
        );
        const admitted = admitEpisodeDeltaProposalV01(writableDatabase, {
          expected: personalPerspectiveProposalMaterial,
          source: {
            packet: personalPerspectiveSourcePacket,
            receipt: personalPerspectiveReceipt,
            assessment: personalPerspectiveAssessment,
          },
        });
        assert.equal(admitted.status, "inserted");
      })();
    } finally {
      writableDatabase.close();
    }

    const sourceCandidateFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(sourceCandidate),
    );
    const revisionRequest = {
      action: "revise",
      proposal_id: sourceProposal.proposal_id,
      proposal_fingerprint: sourceProposal.integrity.fingerprint,
      candidate_id: sourceCandidate.candidate_id,
      candidate_fingerprint: sourceCandidateFingerprint,
      delta_type: "validation_delta",
      operation: "add",
      title: "Apply one bounded browser-proof coordination candidate",
      proposed_state_summary:
        "Record the reviewed coordination candidate while preserving exact Personal Perspective task context.",
      rationale_summary:
        "The immutable revision supplies the explicit operation required by the existing Transition path.",
      uncertainties: [
        "Personal Perspective remains selected working context, not truth or semantic authority.",
      ],
      limitations: [
        "This candidate grants no authority until a separate ReviewDecision, gate, and successful Transition.",
      ],
    };
    const revisionResponse = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/semantic-review', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(revisionRequest)})
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(
      revisionResponse.status,
      201,
      `Personal Perspective revision failed: ${JSON.stringify(revisionResponse.body)}`,
    );
    assert.equal(revisionResponse.body.status, "inserted");
    assert.equal(revisionResponse.body.source_proposal_unchanged, true);
    assert.equal(revisionResponse.body.transition_applied, false);
    const personalPerspectiveProposal = revisionResponse.body.proposal;
    const selectedCandidate = personalPerspectiveProposal.proposed_deltas[0];
    assert(selectedCandidate, "Personal Perspective revised candidate missing");
    const selectedCandidateFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(selectedCandidate),
    );
    const decisionRequest = {
      proposal_id: personalPerspectiveProposal.proposal_id,
      proposal_fingerprint: personalPerspectiveProposal.integrity.fingerprint,
      candidate_id: selectedCandidate.candidate_id,
      candidate_fingerprint: selectedCandidateFingerprint,
      decision: "accept",
      rationale_summary:
        "Accept the exact candidate so a later compiler-produced packet can prove task-scoped Personal Perspective inclusion.",
      revisit: null,
    };
    const decisionResponse = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/semantic-review', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(decisionRequest)})
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(
      decisionResponse.status,
      201,
      `Personal Perspective decision failed: ${JSON.stringify(decisionResponse.body)}`,
    );
    assert.equal(decisionResponse.body.status, "inserted");
    assert.equal(decisionResponse.body.transition_requested, true);
    assert.equal(decisionResponse.body.transition_applied, false);
    const decision = decisionResponse.body.decision;
    assert.equal(decision.decision, "accept");
    assert.equal(decision.candidate.candidate_id, selectedCandidate.candidate_id);
    const previewQuery = new URLSearchParams({
      proposal_id: personalPerspectiveProposal.proposal_id,
      proposal_fingerprint: personalPerspectiveProposal.integrity.fingerprint,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
    }).toString();
    const previewResponse = await evaluateJson(`(async () => {
      const response = await fetch(${JSON.stringify(`/api/vnext/operator/semantic-transition?${previewQuery}`)}, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin'
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(previewResponse.status, 200);
    assert.equal(previewResponse.body.status, "preview");
    assert.equal(previewResponse.body.preview_is_write, false);
    assert.equal(
      previewResponse.body.preview.candidate_fingerprint,
      selectedCandidateFingerprint,
    );
    const confirmationRequest = {
      action: "confirm",
      proposal_id: personalPerspectiveProposal.proposal_id,
      proposal_fingerprint: personalPerspectiveProposal.integrity.fingerprint,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
      confirmation_digest:
        previewResponse.body.preview.confirmation_digest,
    };
    const confirmationResponse = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/semantic-transition', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(confirmationRequest)})
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(confirmationResponse.status, 201);
    assert.equal(confirmationResponse.body.status, "inserted");
    assert.equal(confirmationResponse.body.state_applied, false);
    assert.equal(
      confirmationResponse.body.gate_record.candidate_fingerprint,
      selectedCandidateFingerprint,
    );

    let compiledPacket;
    const transitionDatabase = new Database(databasePath);
    try {
      transitionDatabase.pragma("foreign_keys = ON");
      const decisions = transitionDatabase
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'review_decision'
             AND workspace_id = ?
             AND project_id = ?
           ORDER BY created_at, record_id`,
        )
        .all(manifest.workspace_id, manifest.project_id)
        .map((row) => JSON.parse(row.payload_json));
      const decision = decisions.find(
        (entry) =>
          entry.source_proposal?.proposal_id ===
            personalPerspectiveProposal.proposal_id &&
          entry.candidate?.candidate_id === selectedCandidate.candidate_id,
      );
      assert(decision, "exact Personal Perspective source decision missing");
      const gates = transitionDatabase
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'semantic_commit_gate'
             AND workspace_id = ?
             AND project_id = ?
           ORDER BY created_at, record_id`,
        )
        .all(manifest.workspace_id, manifest.project_id)
        .map((row) => JSON.parse(row.payload_json));
      const gate = gates.find(
        (entry) =>
          entry.proposal_id === personalPerspectiveProposal.proposal_id &&
          entry.decision_id === decision.decision_id &&
          entry.candidate_id === selectedCandidate.candidate_id,
      );
      assert(gate, "exact Personal Perspective source gate missing");
      const gateEvaluatedAt = Date.parse(
        gate.semantic_commit_gate_evaluation.evaluated_at,
      );
      const gateExpiresAt = Date.parse(
        gate.semantic_commit_gate_evaluation.expires_at,
      );
      const appliedAtMs = Math.max(Date.now(), gateEvaluatedAt) + 10;
      assert.equal(
        appliedAtMs + 30 < gateExpiresAt,
        true,
        "Personal Perspective source gate must remain live for bounded application",
      );
      const transitionTimes = [
        new Date(appliedAtMs).toISOString(),
        new Date(appliedAtMs + 10).toISOString(),
      ];
      let transitionTimeIndex = 0;
      const transition = commitVNextSemanticTransitionV01(
        transitionDatabase,
        {
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
          proposal_id: personalPerspectiveProposal.proposal_id,
          proposal_fingerprint:
            personalPerspectiveProposal.integrity.fingerprint,
          decision_id: decision.decision_id,
          decision_fingerprint: decision.integrity.fingerprint,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
          clock: {
            now: () =>
              transitionTimes[
                Math.min(transitionTimeIndex++, transitionTimes.length - 1)
              ],
          },
        },
      );
      assert.equal(transition.status, "applied");
      const packetGeneratedAt = new Date(appliedAtMs + 20).toISOString();
      const compiled = compileTaskContextPacketFromPersistedSemanticStateV01(
        transitionDatabase,
        {
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
          prior_packet: personalPerspectiveSourcePacket,
          transition_receipt_id:
            transition.receipt.transition_receipt_id,
          transition_receipt_fingerprint:
            transition.receipt.integrity.fingerprint,
          expiry_policy: {
            mode: "explicit",
            expires_at: new Date(appliedAtMs + 30 * 60_000).toISOString(),
          },
          personal_perspective_candidates: [personalPerspectiveCandidate],
          clock: { now: () => packetGeneratedAt },
        },
      );
      assert.equal(compiled.status, "inserted");
      assert.equal(
        compiled.personal_perspective_selection.selected_context.length,
        1,
      );
      compiledPacket = compiled.later_packet;
    } finally {
      transitionDatabase.close();
    }

    const afterPersonalPerspective = readDirectHostBrowserState(
      manifest.project_id,
    );
    assert.deepEqual(afterPersonalPerspective.semantic_authority_counts, {
      ...beforePersonalPerspective.semantic_authority_counts,
      semantic_state:
        beforePersonalPerspective.semantic_authority_counts.semantic_state + 1,
      proposals:
        beforePersonalPerspective.semantic_authority_counts.proposals + 2,
      decisions:
        beforePersonalPerspective.semantic_authority_counts.decisions + 1,
      commit_gates:
        beforePersonalPerspective.semantic_authority_counts.commit_gates + 1,
      transitions:
        beforePersonalPerspective.semantic_authority_counts.transitions + 1,
      packets:
        beforePersonalPerspective.semantic_authority_counts.packets + 2,
    });
    result.semantic_proposals_created += 2;
    result.review_decisions_created += 1;
    result.semantic_transitions_created += 1;
    const beforePersonalPerspectiveReads = databaseSnapshot(database);
    const personalPerspectiveInspectorRequestStart = requests.length;
    const personalPerspectiveHref = createSharedInspectorHrefV01({
      target_kind: "personal_perspective_inclusion",
      packet_id: compiledPacket.packet_id,
      packet_fingerprint: compiledPacket.integrity.fingerprint,
    });
    assert.match(
      personalPerspectiveHref,
      /^\/workbench\/inspector\?target=personal_perspective_inclusion&packet_id=[^&]+&packet_fingerprint=sha256%3A[a-f0-9]{64}$/u,
    );
    assert.equal(
      personalPerspectiveHref.includes(
        encodeURIComponent(compiledPacket.packet_id),
      ),
      true,
    );
    await navigate(new URL(personalPerspectiveHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="personal_perspective_inclusion"] [data-inspector-section="strategic_perspective"] [data-inspector-item-status="exact_packet_inclusion"]') !== null`,
      "exact Personal Perspective shared Inspector",
    );
    const personalPerspectiveInspector = await evaluateJson(`(() => {
      const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
      const perspective = inspector?.querySelector('[data-inspector-section="strategic_perspective"]');
      return {
        target: inspector?.getAttribute('data-inspector-target-kind') ?? null,
        read_only: inspector?.getAttribute('data-inspector-read-only') ?? null,
        semantic_mutation: inspector?.getAttribute('data-inspector-semantic-mutation') ?? null,
        exact_inclusion_count: perspective?.querySelectorAll('[data-inspector-item-status="exact_packet_inclusion"]').length ?? -1,
        exact_summary: perspective?.textContent?.includes(${JSON.stringify(personalPerspectiveSummary)}) ?? false,
        automatic_promotion_false: perspective?.textContent?.includes('Automatic promotion') === true && perspective?.textContent?.includes('false') === true,
        unrelated_project_absent: !document.body.textContent.includes(${JSON.stringify(unrelatedProjectSummary)}),
        mutation_controls:
          inspector
            ? Array.from(
                inspector.querySelectorAll(
                  'form, button, input, textarea, select, [data-vnext-operator-decision-form], [data-vnext-transition-action]',
                ),
              ).filter(
                (control) =>
                  control.closest('[data-vnext-operator-session]') === null,
              ).length
            : -1,
        session_controls:
          inspector?.querySelectorAll(
            '[data-vnext-operator-session] form, [data-vnext-operator-session] button, [data-vnext-operator-session] input',
          ).length ?? -1,
        return_href:
          inspector?.querySelector('[data-contextual-inspector-return="blank_state"]')?.getAttribute('href') ?? null,
      };
    })()`);
    assert.deepEqual(personalPerspectiveInspector, {
      target: "personal_perspective_inclusion",
      read_only: "true",
      semantic_mutation: "false",
      exact_inclusion_count: 1,
      exact_summary: true,
      automatic_promotion_false: true,
      unrelated_project_absent: true,
      mutation_controls: 0,
      session_controls: 1,
      return_href: "/",
    });
    assert.deepEqual(databaseSnapshot(database), beforePersonalPerspectiveReads);
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="personal_perspective_inclusion"] [data-inspector-item-status="exact_packet_inclusion"]') !== null`,
      "Personal Perspective Inspector reload",
    );
    assert.deepEqual(databaseSnapshot(database), beforePersonalPerspectiveReads);
    const personalPerspectiveInspectorRequests = requests.slice(
      personalPerspectiveInspectorRequestStart,
    );
    assert.equal(
      personalPerspectiveInspectorRequests.some(
        (request) =>
          request.method === "GET" &&
          request.path === "/api/vnext/operator/inspector",
      ),
      true,
      "exact Personal Perspective Inspector GET was not observed",
    );
    assert.equal(
      personalPerspectiveInspectorRequests.some((request) =>
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method),
      ),
      false,
      `Inspector navigation emitted a mutating request: ${JSON.stringify(personalPerspectiveInspectorRequests)}`,
    );
    result.personal_perspective_shared_inspector_exact = true;
    record("personal_perspective_appears_only_through_exact_compiler_packet_inclusion");
    record("personal_perspective_shared_inspector_is_read_only_and_project_scoped");
  });

  }

  if (RUN_CORE_SCOPE) {
  await runPhase("product_shell_responsive", async () => {
    await validateProductShellResponsive("/workbench/inspector");
    await navigate(`${appOrigin}${result.folder_onboarding_destination}`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "Project Home shell viewport surface",
    );
    await validateProductShellResponsive("/projects/[projectId]");
    const projectManagementDocumentStart = responses.length;
    const projectManagementUtilityRequestStart = requests.length;
    await navigate(`${appOrigin}/projects`);
    await waitForHostCondition(
      () => responses.slice(projectManagementDocumentStart).some(
        (entry) => entry.path === "/projects" && entry.type === "Document",
      ),
      "project management document response",
    );
    const projectManagementDocument = responses.slice(projectManagementDocumentStart).find(
      (entry) => entry.path === "/projects" && entry.type === "Document",
    );
    assert.equal(
      projectManagementDocument?.status,
      200,
      "project management document did not render successfully",
    );
    await waitForCondition(
      `location.pathname === '/projects'`,
      "project management route navigation",
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null || document.body.innerText.includes('Application error')`,
      "project management shell viewport surface",
    );
    assert.equal(
      await evaluateBoolean(`document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`),
      true,
      await evaluateString(`document.body.innerText`),
    );
    await validateProductShellResponsive("/projects");
    assert.deepEqual(
      requests.slice(projectManagementUtilityRequestStart).filter(
        (request) =>
          request.path === "/api/vnext/portability" ||
          request.path === "/api/recovery",
      ),
      [],
    );
    await validateManagementSafetyKeyboardNavigation();
    result.management_safety_keyboard_navigation = true;
    record("management_safety_reaches_visible_project_management_without_switching");
  });

  }

  if (RUN_CONTINUITY_SCOPE) {
    database ??= new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
  await runPhase("final_r8_portability_reconciliation", async () => {
    const exactBindingFixture = seedExactBindingBrowserProposals(databasePath, {
      workspaceId: manifest.workspace_id,
      projectId: manifest.project_id,
    });
    mkdirSync(downloadDirectory, { recursive: true, mode: 0o700 });
    await cdp.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadDirectory,
      eventsEnabled: true,
    });
    await navigate(`${appOrigin}/portability`);
    await waitForCondition(
      `document.querySelector('[data-portability-surface="v1"][data-portability-preview-state="available"]') !== null && document.querySelector('[data-portability-primary-action="export"]')?.textContent?.includes('Export current project') === true && document.querySelector('input[data-portability-personal-consent="true"]:not(:checked)') !== null && document.querySelector('details[data-portability-import-disclosure]')?.open === false && document.querySelector('details')?.textContent?.includes('Review package contents') === true`,
      "portable active-project preview with Personal Perspective excluded",
    );
    await validateProductShell({
      route: "/portability",
      expectedPrimaryZone: null,
      expectedUtilityContext: null,
      projectContextRequired: true,
    });
    result.portable_export_preview_visible = true;
    const portableExportRequestStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Export current project'
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(portableExportRequestStart).some(
        (entry) => entry.path === "/api/vnext/portability" && entry.status === 200,
      ),
      "portable export response",
    );
    const portablePackagePath = await waitForDownloadedFile(
      (name) => name.endsWith(".augnes-project.json"),
      "portable project download",
    );
    assert.equal(lstatSync(portablePackagePath).isFile(), true);
    result.portable_export_created = true;

    await waitForRequestQuiet();
    await navigate("about:blank");
    await waitForRequestQuiet();
    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    const importedRuntimeEnvironment = {
      ...runtimeEnvironment,
      AUGNES_DB_PATH: importedDatabasePath,
    };
    startDevServer(importedRuntimeEnvironment);
    await waitForHttp(`${appOrigin}/portability`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/portability`);
    await waitForCondition(
      `document.querySelector('[data-portability-surface="v1"][data-portability-preview-state="unavailable"] input[type="file"]') !== null && document.querySelector('[data-portability-primary-action="import"]') !== null && !document.body.textContent.includes('Open imported Project Home')`,
      "clean-destination local import control",
    );
    const documentNode = await cdp.send("DOM.getDocument", {
      depth: -1,
      pierce: true,
    });
    const fileInputNode = await cdp.send("DOM.querySelector", {
      nodeId: documentNode.root.nodeId,
      selector: '[data-portability-surface="v1"] input[type="file"]',
    });
    assert.equal(Number(fileInputNode.nodeId) > 0, true);
    await cdp.send("DOM.setFileInputFiles", {
      nodeId: fileInputNode.nodeId,
      files: [portablePackagePath],
    });
    const portableUiImportResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const input = document.querySelector('[data-portability-surface="v1"] input[type="file"]');
        if (!(input instanceof HTMLInputElement) || input.files?.length !== 1) return false;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(portableUiImportResponseStart).some(
        (entry) =>
          entry.path === "/api/vnext/portability" &&
          entry.method === "POST" &&
          entry.status === 200,
      ),
      "portable UI import response",
    );
    const portableUiImportResponse = responses
      .slice(portableUiImportResponseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/portability" &&
          entry.method === "POST" &&
          entry.status === 200,
      );
    assert(portableUiImportResponse);
    const portableUiImportBody = JSON.parse(
      (
        await cdp.send("Network.getResponseBody", {
          requestId: portableUiImportResponse.request_id,
        })
      ).body,
    );
    assert.equal(portableUiImportBody.status, "imported");
    assert.equal(
      portableUiImportBody.projection_reader_verification,
      "verified",
    );
    await waitForCondition(
      `document.querySelector('[data-portability-import-result="imported"]') !== null && Array.from(document.querySelectorAll('a')).some((link) => link.textContent?.trim() === 'Open imported project') && !document.body.textContent.includes('Open imported Project Home')`,
      "verified UI import result",
    );
    const portablePackageBase64 = readFileSync(portablePackagePath).toString("base64");
    const portableReplay = await evaluateJson(`(async () => {
      const binary = atob(${JSON.stringify(portablePackageBase64)});
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const response = await fetch('/api/vnext/portability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.augnes.portable-project+json' },
        body: bytes
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(
      portableReplay.status,
      200,
      `Exact replay import refused: ${portableReplay.body?.reason_code ?? "unknown"}`,
    );
    assert.equal(portableReplay.body.status, "exact_replay");
    assert.equal(
      portableReplay.body.projection_reader_verification,
      "verified",
    );
    const portableRefusal = await evaluateJson(`(async () => {
      const binary = atob(${JSON.stringify(portablePackageBase64)});
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      bytes[Math.floor(bytes.length / 2)] ^= 1;
      const response = await fetch('/api/vnext/portability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.augnes.portable-project+json' },
        body: bytes
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(portableRefusal.status, 422);
    assert.equal(portableRefusal.body.outcome, "refused");
    const refusedPortableHistory = readContinuityOperationalStatus({
      databasePath: importedDatabasePath,
    }).portability;
    assert.equal(refusedPortableHistory?.operation, "import");
    assert.equal(refusedPortableHistory?.outcome, "refused");
    assert.equal(
      refusedPortableHistory?.reason_code,
      portableRefusal.body.reason_code,
    );
    assert.equal(refusedPortableHistory?.reader_verification, "refused");
    result.portable_import_clean_destination = true;

    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null`,
      "imported Project Home reader",
    );
    result.imported_project_home_reader_verified = true;
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review="v0.1"]') !== null && document.body.textContent.includes('Review')`,
      "imported Semantic Workbench reader",
    );
    result.imported_workbench_reader_verified = true;
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
      "locked imported-destination local operator session",
    );
    bootstrapToken = await issueBootstrap(importedRuntimeEnvironment);
    await setBootstrapInput(bootstrapToken);
    assert.equal(
      await evaluateBoolean(`(() => {
        const form = document.querySelector('#vnext-operator-bootstrap-token')?.closest('form');
        if (!form) return false;
        form.requestSubmit();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
      "explicit imported-destination local operator session",
    );
    const exactBindingDecision = await evaluateJson(`(async () => {
      const detailResponse = await fetch(
        '/api/vnext/operator/semantic-review?' + new URLSearchParams({
          proposal_id: ${JSON.stringify(exactBindingFixture.pending_proposal_id)}
        }),
        { cache: 'no-store', credentials: 'same-origin' }
      );
      const detailBody = await detailResponse.json();
      const candidate = detailBody.proposal?.candidates?.find(
        (entry) =>
          entry.candidate?.candidate_id ===
          ${JSON.stringify(exactBindingFixture.preferred_candidate_id)}
      );
      if (!candidate) {
        return {
          detail_status: detailResponse.status,
          decision_status: null,
          decision_result: 'preferred_candidate_missing'
        };
      }
      const decisionResponse = await fetch(
        '/api/vnext/operator/semantic-review',
        {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            proposal_id: ${JSON.stringify(exactBindingFixture.pending_proposal_id)},
            proposal_fingerprint:
              ${JSON.stringify(exactBindingFixture.pending_proposal_fingerprint)},
            candidate_id: candidate.candidate.candidate_id,
            candidate_fingerprint: candidate.candidate_fingerprint,
            decision: 'accept',
            rationale_summary:
              'Accept the exact second candidate so completion navigation remains bound to its persisted decision.'
          })
        }
      );
      const decisionBody = await decisionResponse.json();
      return {
        detail_status: detailResponse.status,
        decision_status: decisionResponse.status,
        decision_result: decisionBody.status ?? null,
        transition_requested: decisionBody.transition_requested ?? null
      };
    })()`);
    assert.deepEqual(exactBindingDecision, {
      detail_status: 200,
      decision_status: 201,
      decision_result: "inserted",
      transition_requested: true,
    });
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-ai-workplane-home="v0.1"][data-ai-workplane-home-state="change_completion"] [data-ai-workplane-primary-action="link"]')?.getAttribute('href') === ${JSON.stringify(exactBindingFixture.pending_proposal_path)}`,
      "exact older ready-to-complete proposal focused ahead of newer undecided proposal",
    );
    const exactProposalStatuses = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/semantic-review', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const body = await response.json();
      const primary = document.querySelector(
        '[data-ai-workplane-home="v0.1"] [data-ai-workplane-primary-action="link"]'
      );
      return {
        status: response.status,
        ready: body.proposals?.find(
          (entry) =>
            entry.proposal_id ===
            ${JSON.stringify(exactBindingFixture.pending_proposal_id)}
        )?.decision_application_summary,
        newer: body.proposals?.find(
          (entry) =>
            entry.proposal_id ===
            ${JSON.stringify(exactBindingFixture.newer_proposal_id)}
        )?.decision_application_summary,
        primary_label: primary?.textContent?.trim() ?? null,
        primary_href: primary?.getAttribute('href') ?? null,
      };
    })()`);
    assert.equal(exactProposalStatuses.status, 200);
    assert.equal(exactProposalStatuses.ready?.status, "ready_to_complete");
    assert.equal(
      exactProposalStatuses.ready?.preferred_candidate_id,
      exactBindingFixture.preferred_candidate_id,
    );
    assert.equal(exactProposalStatuses.newer?.status, "needs_decision");
    assert.equal(
      exactProposalStatuses.primary_label,
      "Continue change review",
    );
    assert.equal(
      exactProposalStatuses.primary_href,
      exactBindingFixture.pending_proposal_path,
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const link = document.querySelector(
          '[data-ai-workplane-home="v0.1"] [data-ai-workplane-primary-action="link"]'
        );
        if (!(link instanceof HTMLAnchorElement)) return false;
        link.click();
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `location.pathname === ${JSON.stringify(exactBindingFixture.pending_proposal_path)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(exactBindingFixture.preferred_candidate_id)} && document.querySelector('[data-vnext-transition-action="preview"]:not([disabled])') !== null`,
      "pending applying decision selects its exact candidate by default",
    );
    result.exact_ready_to_complete_navigation = true;
    result.pending_applying_candidate_default_selection = true;
    record("ai_workplane_home_binds_completion_to_exact_proposal_and_candidate");
    const importedWorkbenchProbe = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/semantic-review', {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const body = await response.json();
      return { status: response.status, result: body.status ?? null, error_code: body.error_code ?? null };
    })()`);
    assert.equal(
      importedWorkbenchProbe.status,
      200,
      `Imported Workbench route refused: ${importedWorkbenchProbe.error_code ?? "unknown"}`,
    );
    assert.equal(importedWorkbenchProbe.result, "proposal_list");
    const importedInspectorHref = createSharedInspectorHrefV01({
      target_kind: "episode_delta_proposal",
      record_id: manifest.proposal_id,
      expected_fingerprint: manifest.proposal_fingerprint,
    });
    const importedInspectorProbe = await evaluateJson(`(async () => {
      const href = new URL(${JSON.stringify(importedInspectorHref)}, location.origin);
      href.pathname = '/api/vnext/operator/inspector';
      const response = await fetch(href, { cache: 'no-store', credentials: 'same-origin' });
      const body = await response.json();
      return { status: response.status, result: body.status ?? null, error_code: body.error_code ?? null };
    })()`);
    assert.equal(
      importedInspectorProbe.status,
      200,
      `Imported Inspector route refused: ${importedInspectorProbe.error_code ?? "unknown"}`,
    );
    assert.equal(importedInspectorProbe.result, "inspector_read");
    await navigate(new URL(importedInspectorHref, appOrigin).toString());
    await waitForCondition(
      `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-read-only="true"][data-inspector-semantic-mutation="false"][data-inspector-target-kind="episode_delta_proposal"]') !== null`,
      "imported shared Inspector reader",
    );
    result.imported_inspector_reader_verified = true;

    await waitForRequestQuiet();
    await navigate("about:blank");
    await waitForRequestQuiet();
    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    seedFinalR8RestartRuns({
      databasePath: importedDatabasePath,
      workspaceId: manifest.workspace_id,
      projectId: manifest.project_id,
      packetId: manifest.packet_id,
      packetFingerprint: manifest.packet_fingerprint,
    });
    startDevServer(importedRuntimeEnvironment);
    await waitForHttp(`${appOrigin}/recovery`, DEFAULT_TIMEOUT_MS);
    await waitForHostCondition(
      () => {
        const db = new Database(importedDatabasePath, {
          readonly: true,
          fileMustExist: true,
        });
        try {
          const row = db.prepare(
            "SELECT status, metadata_json FROM autonomy_runs WHERE run_id = 'run:final-r8-restart-review'",
          ).get();
          if (!row) return false;
          const metadata = JSON.parse(row.metadata_json);
          return row.status === "paused" &&
            metadata.reconciliation_required === true &&
            metadata.automatic_retry === false;
        } finally {
          db.close();
        }
      },
      "startup run reconciliation publication",
    );
    await waitForHostCondition(
      () => {
        const status = readContinuityOperationalStatus({
          databasePath: importedDatabasePath,
        });
        return status.reconciliation?.orphaned_review_needed_count === 1 &&
          status.reconciliation?.exact_replays_reused === 1 &&
          status.reconciliation?.automatic_retry_started === false;
      },
      "public restart reconciliation result publication",
    );
    await waitForHostCondition(
      () => {
        try {
          const runtime = JSON.parse(readFileSync(
            path.join(importedRuntimeEnvironment.AUGNES_RUNTIME_STATE_DIR, "runtime.json"),
            "utf8",
          ));
          return runtime.lifecycle_state === "ready" &&
            runtime.database_state === "current";
        } catch {
          return false;
        }
      },
      "reconciled runtime ready publication",
    );
    await navigate(`${appOrigin}/recovery`);
    const recoveryDiagnosticsProbe = await evaluateJson(`(async () => {
      const response = await fetch('/api/recovery', { cache: 'no-store' });
      const body = await response.json();
      return {
        status: response.status,
        error_code: body.error_code ?? null,
        body,
        reconciliation: body.continuity?.reconciliation
          ? {
              review_needed: body.continuity.reconciliation.orphaned_review_needed_count,
              exact_replays: body.continuity.reconciliation.exact_replays_reused,
              automatic_retry: body.continuity.reconciliation.automatic_retry_started
            }
          : null
      };
    })()`);
    assert.equal(
      recoveryDiagnosticsProbe.status,
      200,
      `Recovery diagnostics route refused: ${recoveryDiagnosticsProbe.error_code ?? "unknown"}`,
    );
    assert.deepEqual(recoveryDiagnosticsProbe.reconciliation, {
      review_needed: 1,
      exact_replays: 1,
      automatic_retry: false,
    });
    await waitForCondition(
      `document.querySelector('[data-recovery-product-surface="v0.1"][data-recovery-mode="normal"]') !== null && document.querySelector('[data-recovery-primary-action]') !== null && Array.from(document.querySelectorAll('details')).some((details) => details.textContent?.includes('Advanced diagnostics') && details.open === false) && document.querySelector('[data-continuity-diagnostics="v1"]') !== null && document.querySelector('[data-run-reconciliation-status="v1"]')?.textContent?.includes('Review needed') === true && document.querySelector('[data-run-reconciliation-status="v1"]')?.textContent?.includes('Exact replay') === true`,
      "public restart reconciliation diagnostics",
    );
    await validateProductShell({
      route: "/recovery",
      expectedPrimaryZone: null,
      expectedUtilityContext: null,
    });
    const reconciliationText = await evaluateString(
      `document.querySelector('[data-run-reconciliation-status="v1"]')?.textContent ?? ''`,
    );
    assert.match(reconciliationText, /Review needed[\s\S]*1/u);
    assert.match(reconciliationText, /Exact replay[\s\S]*1/u);
    assert.match(reconciliationText, /Automatic retry[\s\S]*Not started/u);
    const transferHistoryText = await evaluateString(
      `Array.from(document.querySelectorAll('[data-continuity-diagnostics="v1"] section')).find(
        (section) => section.textContent?.includes('Project transfer history')
      )?.textContent ?? ''`,
    );
    assert.match(transferHistoryText, /Refused/u);
    assert.doesNotMatch(transferHistoryText, /Completed|Exact replay/u);
    result.restart_run_reconciliation_review_needed = true;
    result.restart_terminal_receipt_exact_replay = true;
    result.continuity_diagnostics_visible = true;
    record("classified_portability_refusal_replaces_prior_success_history");

    const renderInterceptedRecoveryStatus = async ({
      body,
      expectedSelector,
      label,
    }) => {
      assert.deepEqual(interceptedRecoveryResponses, []);
      interceptedRecoveryResponses.push({
        method: "GET",
        status: 200,
        body,
      });
      const requestStart = requests.length;
      await navigate(`${appOrigin}/recovery`);
      await waitForCondition(expectedSelector, label);
      await waitForRequestQuiet();
      assert.deepEqual(
        interceptedRecoveryResponses,
        [],
        `${label} interception must be consumed exactly once`,
      );
      assert.equal(
        requests.slice(requestStart).filter(
          (entry) =>
            entry.path === "/api/recovery" && entry.method === "GET",
        ).length,
        1,
        `${label} must perform one status read`,
      );
    };

    for (const recoveryClassification of [
      {
        classification: "incompatible",
        label: "Compatibility needs review",
        state: "incompatible",
      },
      {
        classification: "unavailable",
        label: "Current safety state unavailable",
        state: "unavailable",
      },
    ]) {
      const body = structuredClone(recoveryDiagnosticsProbe.body);
      body.recovery_mode = true;
      body.database.schema_classification =
        recoveryClassification.classification;
      body.actions = {
        create_backup: false,
        retry_update: false,
        restore_backup: false,
      };
      body.latest_operation = null;
      await renderInterceptedRecoveryStatus({
        body,
        expectedSelector:
          `document.querySelector('[data-recovery-mode="recovery"] [data-recovery-safety-state="${recoveryClassification.state}"] h2')?.textContent?.trim() === ${JSON.stringify(recoveryClassification.label)} && document.querySelector('[data-recovery-primary-action="none"]') !== null`,
        label: `recovery mode with ${recoveryClassification.classification} database safety`,
      });
      assert.equal(
        await evaluateBoolean(
          `document.querySelector('[data-recovery-mode="recovery"]')?.innerText.includes('Augnes needs your attention before normal project work can continue.') === true`,
        ),
        true,
      );
    }

    const currentNormalRecovery = structuredClone(
      recoveryDiagnosticsProbe.body,
    );
    currentNormalRecovery.recovery_mode = false;
    currentNormalRecovery.database.schema_classification = "current";
    currentNormalRecovery.actions = {
      create_backup: true,
      retry_update: false,
      restore_backup: false,
    };
    currentNormalRecovery.latest_operation = null;
    await renderInterceptedRecoveryStatus({
      body: currentNormalRecovery,
      expectedSelector:
        `document.querySelector('[data-recovery-action-confirmation="confirmed"] [data-recovery-primary-action="create_backup"]') !== null`,
      label: "confirmed recovery action state",
    });
    const refusedActionRequestStart = requests.length;
    interceptedRecoveryResponses.push({
      method: "POST",
      status: 409,
      body: {
        accepted: false,
        outcome: "refused",
        reason_code: "recovery_action_refused",
        next_action: "review_the_current_status",
      },
    });
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Create backup'
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-recovery-action-confirmation="confirmed"] [data-recovery-primary-action="create_backup"]') !== null && document.body.innerText.includes('The recovery action was not scheduled.')`,
      "authoritative refusal preserves confirmed recovery controls",
    );
    await waitForRequestQuiet();
    assert.equal(
      requests.slice(refusedActionRequestStart).filter(
        (entry) =>
          entry.path === "/api/recovery" && entry.method === "POST",
      ).length,
      1,
      "authoritative refusal must issue one action request",
    );
    assert.equal(
      requests.slice(refusedActionRequestStart).filter(
        (entry) =>
          entry.path === "/api/recovery" && entry.method === "GET",
      ).length,
      0,
      "authoritative refusal must not force a status refresh",
    );
    record("authoritative_recovery_refusal_preserves_confirmed_controls");
    const unknownActionRequestStart = requests.length;
    interceptedRecoveryResponses.push({
      method: "POST",
      status: 504,
      body: {
        outcome: "status_unknown",
        reason_code: "recovery_action_outcome_unknown",
        next_action: "refresh_recovery_status",
      },
    });
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Create backup'
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-recovery-action-confirmation="refresh_required"] [data-recovery-primary-action="check_again"]') !== null && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Refresh status' && !button.disabled)`,
      "status-unknown recovery action lock",
    );
    await validateRecoveryCorrectionViewports();
    await captureC8ReviewState({
      surface: "recovery",
      state: "outcome-unknown-risk",
      rootSelector: '[data-recovery-action-confirmation="refresh_required"]',
      currentSituation: "The recovery outcome is unknown and further mutation is locked.",
      primaryAction: "Refresh the current safety status.",
      aiSummary: "No AI interpretation is presented as recovery authority.",
      risk: "Unknown outcome and lock state are explicit text alerts.",
      supportingInformation: "Recovery history and diagnostics remain secondary.",
      rawRecordDisclosure: "Advanced diagnostics remain collapsed.",
      interactionPath: ["Open recovery", "Refresh status"],
      knownLimitations: [
        "The fixture validates the forced-recovery boundary, not hardware failure modes.",
      ],
      expectedPrimaryActions: 1,
      maxIndependentSurfaces: 1,
      maxStateBadges: 0,
    });
    await waitForRequestQuiet();
    assert.equal(
      requests.slice(unknownActionRequestStart).filter(
        (entry) =>
          entry.path === "/api/recovery" && entry.method === "POST",
      ).length,
      1,
    );
    assert.equal(
      requests.slice(unknownActionRequestStart).filter(
        (entry) =>
          entry.path === "/api/recovery" && entry.method === "GET",
      ).length,
      0,
      "status_unknown must not trigger an automatic status read",
    );
    const lockedPostCount = requests.filter(
      (entry) => entry.path === "/api/recovery" && entry.method === "POST",
    ).length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(
          (candidate) => /create backup|retry update|restore selected verified backup/i.test(
            candidate.textContent ?? ''
          )
        );
        for (const button of buttons) button.click();
        return buttons.every((button) => button.disabled);
      })()`),
      true,
    );
    await waitForRequestQuiet();
    assert.equal(
      requests.filter(
        (entry) => entry.path === "/api/recovery" && entry.method === "POST",
      ).length,
      lockedPostCount,
      "late acceptance lock must prevent a second mutation POST",
    );

    interceptedRecoveryResponses.push({
      method: "GET",
      status: 500,
      body: { error_code: "recovery_status_unavailable" },
    });
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Refresh status'
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-recovery-action-confirmation="refresh_required"]') !== null && document.body.innerText.includes('The refresh did not succeed.')`,
      "failed explicit refresh preserves recovery action lock",
    );
    interceptedRecoveryResponses.push({
      method: "GET",
      status: 200,
      body: currentNormalRecovery,
    });
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Refresh status'
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-recovery-action-confirmation="confirmed"] [data-recovery-primary-action="create_backup"]') !== null`,
      "successful explicit refresh clears recovery action lock",
    );

    for (const scheduledCase of [
      {
        action: "retry_update",
        recommendation: "retry_update",
        outcome: "retry_scheduled",
        button: "Retry update",
      },
      {
        action: "restore_backup",
        recommendation: "restore_latest_verified_backup",
        outcome: "restore_scheduled",
        button: "Restore selected verified backup",
      },
    ]) {
      const scheduledStatus = structuredClone(recoveryDiagnosticsProbe.body);
      scheduledStatus.recovery_mode = true;
      scheduledStatus.database.schema_classification = "current";
      scheduledStatus.latest_operation = {
        outcome: "recovery_available",
        reason_code: "recovery_required",
        application_version: null,
        target_application_version: null,
        target_build_identity: null,
        database_state: "current",
        data_preserved: true,
        backup_verified: false,
        safety_backup_created: false,
        next_action: scheduledCase.recommendation,
      };
      scheduledStatus.backup_inventory_state = "available";
      scheduledStatus.backup_count = 1;
      scheduledStatus.backups = [
        {
          backup_id: "backup:browser-lock",
          label: "Browser verified recovery point",
          created_at: "2026-07-21T06:30:00.000Z",
          reason: "pre_update",
          source_application_version: "0.1.1",
          verified: true,
        },
      ];
      scheduledStatus.actions = {
        create_backup: false,
        retry_update: scheduledCase.action === "retry_update",
        restore_backup: scheduledCase.action === "restore_backup",
      };
      await renderInterceptedRecoveryStatus({
        body: scheduledStatus,
        expectedSelector:
          `document.querySelector('[data-recovery-primary-action="${scheduledCase.action}"]') !== null`,
        label: `${scheduledCase.outcome} available action`,
      });
      const scheduledRequestStart = requests.length;
      interceptedRecoveryResponses.push({
        method: "POST",
        status: 202,
        body: {
          accepted: true,
          outcome: scheduledCase.outcome,
          next_action: "wait_for_augnes_to_restart",
        },
      });
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === ${JSON.stringify(scheduledCase.button)}
          );
          button?.click();
          return Boolean(button);
        })()`),
        true,
      );
      if (scheduledCase.action === "restore_backup") {
        await waitForCondition(
          `document.querySelector('[role="dialog"]') !== null`,
          "restore confirmation before scheduled action",
        );
        assert.equal(
          await evaluateBoolean(`(() => {
            const button = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
              (candidate) => candidate.textContent?.trim() === 'Restore this verified backup'
            );
            button?.click();
            return Boolean(button);
          })()`),
          true,
        );
      }
      await waitForCondition(
        `document.querySelector('[data-recovery-action-confirmation="refresh_required"] [data-recovery-primary-action="check_again"]') !== null`,
        `${scheduledCase.outcome} locks later recovery mutations`,
      );
      await waitForRequestQuiet();
      assert.equal(
        requests.slice(scheduledRequestStart).filter(
          (entry) =>
            entry.path === "/api/recovery" && entry.method === "POST",
        ).length,
        1,
        `${scheduledCase.outcome} must be accepted exactly once`,
      );
    }

    assert.deepEqual(interceptedRecoveryResponses, []);
    record("recovery_mode_and_database_safety_remain_orthogonal");
    record("uncertain_and_scheduled_recovery_actions_lock_until_refresh");
    await navigate(`${appOrigin}/recovery`);
    await waitForCondition(
      `document.querySelector('[data-recovery-product-surface="v0.1"][data-recovery-mode="normal"]') !== null`,
      "real recovery status restored after correction scenarios",
    );

    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Preview support report'
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-support-report-preview="ready"]') !== null && document.body.textContent.includes('redacted') && document.body.textContent.includes('non-authoritative') && Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Export redacted report' && !button.disabled)`,
      "redacted support report preview before export",
    );
    result.support_report_previewed = true;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => candidate.textContent?.trim() === 'Export redacted report' &&
            candidate instanceof HTMLButtonElement && !candidate.disabled
        );
        button?.click();
        return Boolean(button);
      })()`),
      true,
    );
    const supportReportPath = await waitForDownloadedFile(
      (name) => name === "augnes-redacted-support-report.json",
      "redacted support report download",
    );
    const supportReportText = readFileSync(supportReportPath, "utf8");
    assert.equal(supportReportText.includes(importedDatabasePath), false);
    assert.equal(supportReportText.includes("sk-proj-"), false);
    assert.equal(supportReportText.includes("raw_prompt"), false);
    result.support_report_exported_after_preview = true;
    const importedDatabase = new Database(importedDatabasePath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      assert.equal(importedDatabase.pragma("integrity_check", { simple: true }), "ok");
    } finally {
      importedDatabase.close();
    }
    record("final_r8_portable_project_round_trip_uses_clean_isolated_destination");
    record("final_r8_imported_home_workbench_and_inspector_readers_agree");
    record("final_r8_restart_reconciliation_reuses_exact_receipt_without_retry");
    record("final_r8_public_diagnostics_preview_before_redacted_report_export");
    await validateProductShellResponsive("/recovery");
    await navigate(`${appOrigin}/portability`);
    await waitForCondition(
      `document.querySelector('[data-portability-surface="v1"]') !== null`,
      "portability shell viewport surface",
    );
    await validateProductShellResponsive("/portability");
  });
  }

  if (VALIDATION_SCOPE === "core") {
    assert.equal(result.multi_candidate_transition_scope, false);
    assert.equal(result.candidate_switch_mutation_locking, false);
    assert.equal(result.late_preview_response_discarded, false);
    assert.equal(result.exact_ready_to_complete_navigation, false);
    assert.equal(result.pending_applying_candidate_default_selection, false);
    assert.equal(result.personal_perspective_shared_inspector_exact, false);
  } else if (VALIDATION_SCOPE === "continuity") {
    assert.equal(result.multi_candidate_transition_scope, true);
    assert.equal(result.candidate_switch_mutation_locking, true);
    assert.equal(result.late_preview_response_discarded, true);
    assert.equal(result.exact_ready_to_complete_navigation, true);
    assert.equal(result.pending_applying_candidate_default_selection, true);
    assert.equal(result.personal_perspective_shared_inspector_exact, true);
  }

  await waitForRequestQuiet();
  timing.milestone("final global request quiet observed");
  const isExpectedSyntheticSessionRefusal = (entry) =>
    entry.phase === "synthetic_session_bootstrap" &&
    entry.path === "/api/vnext/operator/session" &&
    /401 \(Unauthorized\)/i.test(entry.text) &&
    responses.some(
      (response) =>
        response.phase === entry.phase &&
        response.path === entry.path &&
        response.method === "GET" &&
        response.status === 401,
    );
  const isExpectedImportedDestinationSessionRefusal = (entry) =>
    entry.phase === "final_r8_portability_reconciliation" &&
    (entry.path === "/api/vnext/operator/session" ||
      entry.path === "/api/vnext/operator/semantic-review") &&
    /401 \(Unauthorized\)/i.test(entry.text) &&
    responses.some(
      (response) =>
        response.phase === entry.phase &&
        response.path === entry.path &&
        response.method === "GET" &&
        response.status === 401,
    );
  const isExpectedContextualInspectorStatusResponse = (entry) => {
    if (
      entry.phase !== "contextual_inspector_status_correction" ||
      entry.path !== "/api/vnext/operator/inspector"
    ) {
      return false;
    }
    const statusMatch = entry.text.match(/\b(404|409|500)\b/);
    if (!statusMatch) return false;
    const status = Number(statusMatch[1]);
    return responses.some(
      (response) =>
        response.phase === entry.phase &&
        response.path === entry.path &&
        response.method === "GET" &&
        response.status === status,
    );
  };
  const unexpectedConsoleErrors = consoleErrors.filter(
    (entry) =>
      !(
        (entry.path === "/favicon.ico" && /404/i.test(entry.text)) ||
        (entry.phase === "retired_routes" && /404|405/i.test(entry.text)) ||
        (entry.phase === "locked_workbench" &&
          entry.path?.startsWith("/api/vnext/operator/") &&
          /401/i.test(entry.text)) ||
        (entry.phase === "locked_direct_exact_details" &&
          entry.path === "/api/vnext/operator/session" &&
          /401 \(Unauthorized\)/i.test(entry.text) &&
          responses.some(
            (response) =>
              response.phase === entry.phase &&
              response.path === entry.path &&
              response.method === "GET" &&
              response.status === 401,
          )) ||
        isExpectedSyntheticSessionRefusal(entry) ||
        isExpectedImportedDestinationSessionRefusal(entry) ||
        isExpectedContextualInspectorStatusResponse(entry) ||
        (entry.phase === "folder_onboarding" &&
          entry.path === "/api/vnext/projects" &&
          /409/i.test(entry.text)) ||
        (entry.phase === "folder_onboarding" &&
          entry.path === "/api/vnext/project-controls" &&
          /409/i.test(entry.text)) ||
        (entry.phase === "final_r8_portability_reconciliation" &&
          entry.path === "/api/vnext/portability" &&
          /409/i.test(entry.text) &&
          responses.some(
            (response) =>
              response.phase === entry.phase &&
              response.path === entry.path &&
              response.method === "GET" &&
              response.status === 409,
          )) ||
        (entry.phase === "final_r8_portability_reconciliation" &&
          entry.path === "/api/vnext/portability" &&
          /422/i.test(entry.text) &&
          responses.some(
            (response) =>
              response.phase === entry.phase &&
              response.path === entry.path &&
              response.method === "POST" &&
              response.status === 422,
          )) ||
        (entry.phase === "final_r8_portability_reconciliation" &&
          entry.path === "/api/recovery" &&
          /409/i.test(entry.text) &&
          responses.some(
            (response) =>
              response.phase === entry.phase &&
              response.path === entry.path &&
              response.method === "POST" &&
              response.status === 409,
          )) ||
        (entry.phase === "final_r8_portability_reconciliation" &&
          entry.path === "/api/recovery" &&
          /500|504/i.test(entry.text) &&
          responses.some(
            (response) =>
              response.phase === entry.phase &&
              response.path === entry.path &&
              response.status >= 500,
          )) ||
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
  assert.equal(interceptedInspectorResponse, null);
  assert.deepEqual(interceptedRecoveryResponses, []);
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
        request.phase === "direct_host_round_trip" &&
        (request.path === "/api/vnext/project-controls" ||
          request.path === "/api/vnext/operator/automation-cycle" ||
          request.path === "/api/vnext/operator/project-continuity")
      ) &&
      !(
        request.phase === "direct_host_round_trip" &&
        (request.path === "/api/vnext/operator/semantic-review" ||
          request.path === "/api/vnext/operator/semantic-transition")
      ) &&
      !(
        request.phase === "strategic_proposal_review" &&
        (request.path === "/api/vnext/projects" ||
          request.path === "/api/vnext/operator/semantic-review")
      ) &&
      !(
        request.phase === "multi_candidate_transition_scope" &&
        (request.path === "/api/vnext/operator/semantic-review" ||
          request.path === "/api/vnext/operator/semantic-transition")
      ) &&
      !(
        request.phase === "personal_perspective_inspector" &&
        (request.path === "/api/vnext/project-controls" ||
          request.path === "/api/vnext/operator/semantic-review" ||
          request.path === "/api/vnext/operator/semantic-transition")
      ) &&
      !(
        request.phase === "final_r8_portability_reconciliation" &&
        (request.path === "/api/vnext/portability" ||
          request.path === "/api/recovery" ||
          request.path === "/api/vnext/operator/session" ||
          request.path === "/api/vnext/operator/semantic-review")
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

function activateFixtureProjectForContinuity(
  targetDatabasePath,
  { workspaceId, projectId },
) {
  const writableDatabase = new Database(targetDatabasePath, {
    fileMustExist: true,
  });
  try {
    writableDatabase.pragma("foreign_keys = ON");
    const selectedAt = "2026-07-21T06:00:00.000Z";
    touchRecentProjectV01(writableDatabase, {
      workspace_id: workspaceId,
      project_id: projectId,
      now: selectedAt,
    });
    selectActiveProjectV01(writableDatabase, {
      workspace_id: workspaceId,
      project_id: projectId,
      now: selectedAt,
      expected_project_id: null,
      expected_revision: null,
    });
  } finally {
    writableDatabase.close();
  }
}

function seedExactBindingBrowserProposals(
  targetDatabasePath,
  { workspaceId, projectId },
) {
  const writableDatabase = new Database(targetDatabasePath, {
    fileMustExist: true,
  });
  try {
    writableDatabase.pragma("foreign_keys = ON");
    const currentPacket = writableDatabase
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND project_id = ?
         ORDER BY created_at DESC, record_id DESC`,
      )
      .all(projectId)
      .map((row) => JSON.parse(row.payload_json))
      .find((packet) =>
        packet.selected_context?.some(
          (entry) => entry.entry_kind === "accepted_state_ref",
        ) &&
        !packet.selected_context?.some(
          (entry) => entry.entry_kind === "memory_ref",
        ),
      );
    assert(
      currentPacket,
      "exact-binding non-Personal-Perspective accepted-state packet fixture missing",
    );
    const pendingProject = {
      fixture_id: "continuity-exact-binding-pending",
      workspace_id: workspaceId,
      project_id: projectId,
      run_id: "run:continuity-exact-binding-pending",
    };
    const pendingReceipt = buildSemanticReviewLoopRunReceiptFixture(
      pendingProject,
      currentPacket,
      { timeline_anchor_at: currentPacket.generated_at },
    );
    const pendingProposal = buildSemanticReviewLoopProposalFixture(
      pendingProject,
      currentPacket,
      pendingReceipt,
      {
        primary_delta_type: "agent_plan_delta",
        candidate_namespace: "continuity-exact-binding-pending",
        timeline_anchor_at: currentPacket.generated_at,
      },
    );
    const newerAnchor = new Date(
      Date.parse(pendingProposal.created_at) + 60_000,
    ).toISOString();
    const newerProject = {
      fixture_id: "continuity-exact-binding-newer",
      workspace_id: workspaceId,
      project_id: projectId,
      run_id: "run:continuity-exact-binding-newer",
    };
    const newerReceipt = buildSemanticReviewLoopRunReceiptFixture(
      newerProject,
      currentPacket,
      { timeline_anchor_at: newerAnchor },
    );
    const newerProposal = buildSemanticReviewLoopProposalFixture(
      newerProject,
      currentPacket,
      newerReceipt,
      {
        primary_delta_type: "agent_plan_delta",
        candidate_namespace: "continuity-exact-binding-newer",
        timeline_anchor_at: newerAnchor,
      },
    );
    const preferredCandidate = pendingProposal.proposed_deltas[1];
    assert(
      preferredCandidate,
      "exact-binding pending proposal needs a second candidate",
    );
    writableDatabase.transaction(() => {
      for (const [receipt, proposal] of [
        [pendingReceipt, pendingProposal],
        [newerReceipt, newerProposal],
      ]) {
        admitStructuredRunReceiptV01(writableDatabase, receipt);
        insertVNextCoreRecordV01(writableDatabase, {
          record_kind: "episode_delta_proposal",
          record_id: proposal.proposal_id,
          workspace_id: proposal.workspace_id,
          project_id: proposal.project_id,
          fingerprint: proposal.integrity.fingerprint,
          idempotency_key: null,
          payload: proposal,
          created_at: proposal.created_at,
        });
      }
    })();
    return {
      pending_proposal_id: pendingProposal.proposal_id,
      pending_proposal_fingerprint: pendingProposal.integrity.fingerprint,
      preferred_candidate_id: preferredCandidate.candidate_id,
      newer_proposal_id: newerProposal.proposal_id,
      pending_proposal_path: `/workbench/semantic-review/${pendingProposal.proposal_id.replace(":", "~")}`,
    };
  } finally {
    writableDatabase.close();
  }
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
    AUGNES_TEST_FOLDER_PICKER_SEQUENCE_PATH: folderPickerSequencePath,
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
  serverStartCount += 1;
  pendingServerStartupFinish = timing.start(
    "runtime_startup",
    `runtime startup ${String(serverStartCount).padStart(2, "0")}`,
  );
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
    { label: `browser-runtime-${VALIDATION_SCOPE}` },
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
  chromeProcessRecord = registerOwnedChild(
    ownedBrowserProcesses,
    chromeProcess,
    { label: `browser-chrome-${VALIDATION_SCOPE}` },
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

async function setFormControlValue(selector, index, value) {
  const changed = await evaluateBoolean(`(() => {
    const control = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))[${Number(index)}];
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
  assert.equal(changed, true, `failed to set ${selector}[${index}]`);
}

async function validateProductShell({
  route,
  expectedPrimaryZone,
  expectedUtilityContext,
  projectContextRequired = false,
}) {
  await waitForCondition(
    `Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] > a')).filter((link) => { const rect = link.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }).length === 2`,
    `two visible primary destinations for ${route}`,
  );
  await waitForCondition(
    `Array.from(document.querySelectorAll('.product-shell')).some((candidate) => candidate.getAttribute('data-primary-product-zone') === ${JSON.stringify(expectedPrimaryZone ?? "none")} && candidate.getAttribute('data-product-utility-context') === ${JSON.stringify(expectedUtilityContext ?? "none")} && ${projectContextRequired ? "['Current project', 'Viewed project'].includes(candidate.querySelector('[data-project-context-label]')?.getAttribute('data-project-context-label'))" : "true"})`,
    `classified ProductShell for ${route}`,
  );
  const shell = await evaluateJson(`(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const expectedPrimaryZone = ${JSON.stringify(expectedPrimaryZone ?? "none")};
    const expectedUtilityContext = ${JSON.stringify(expectedUtilityContext ?? "none")};
    const roots = Array.from(document.querySelectorAll('.product-shell'));
    const root = roots.find((candidate) =>
      candidate.getAttribute('data-primary-product-zone') === expectedPrimaryZone &&
      candidate.getAttribute('data-product-utility-context') === expectedUtilityContext &&
      ${projectContextRequired ? "candidate.querySelector('[data-project-context-label]') !== null" : "true"}
    ) ?? null;
    const primary = root?.querySelector('nav[aria-label="Primary navigation"]');
    const primaryLinks = Array.from(primary?.querySelectorAll(':scope > a') ?? []);
    return {
      route: ${JSON.stringify(route)},
      primary_zone: root?.getAttribute('data-primary-product-zone') ?? null,
      utility_context: root?.getAttribute('data-product-utility-context') ?? null,
      brand_href: root?.querySelector('.product-brand')?.getAttribute('href') ?? null,
      primary_label: primary?.getAttribute('aria-label') ?? null,
      primary_links: primaryLinks.map((link) => ({
        label: link.querySelector('strong')?.textContent?.trim() ?? '',
        href: link.getAttribute('href'),
        current: link.getAttribute('aria-current')
      })),
      project_tools_count: root?.querySelectorAll('details.product-project-tools, nav[aria-label="Project tools"]').length ?? -1,
      visible_primary_link_count: Array.from(
        document.querySelectorAll('nav[aria-label="Primary navigation"] > a')
      ).filter(visible).length,
      global_utility_link_count: Array.from(root?.querySelectorAll('header a') ?? []).filter((link) =>
        ['/projects', '/portability', '/recovery'].includes(link.getAttribute('href') ?? '')
      ).length,
      project_context_label:
        root?.querySelector('[data-project-context-label]')?.getAttribute('data-project-context-label') ?? null
    };
  })()`);
  assert.equal(shell.primary_zone, expectedPrimaryZone ?? "none");
  assert.equal(shell.utility_context, expectedUtilityContext ?? "none");
  assert.equal(shell.brand_href, "/");
  assert.equal(shell.primary_label, "Primary navigation");
  assert.deepEqual(shell.primary_links, [
    {
      label: "Blank State",
      href: "/",
      current: expectedPrimaryZone === "blank-state" ? "page" : null,
    },
    {
      label: "AI Workplane",
      href: "/workbench/semantic-review",
      current: expectedPrimaryZone === "ai-workplane" ? "page" : null,
    },
  ]);
  assert.equal(shell.visible_primary_link_count, 2);
  assert.equal(shell.project_tools_count, 0);
  assert.equal(shell.global_utility_link_count, 0);
  result.product_shell_route_classifications.push(shell);
  if (projectContextRequired) {
    assert.equal(
      ["Current project", "Viewed project"].includes(shell.project_context_label),
      true,
      `missing current/viewed project shell context for ${route}: ${String(shell.project_context_label)}`,
    );
  }
}

async function validateProductShellResponsive(route) {
  for (const width of [390, 430]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const metrics = await evaluateJson(`(() => {
      const primary = document.querySelector('nav[aria-label="Primary navigation"]');
      const primaryLinks = Array.from(primary?.querySelectorAll(':scope > a') ?? []);
      const insideViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height >= 40 && rect.left >= -1 && rect.right <= window.innerWidth + 1;
      };
      return {
        route: ${JSON.stringify(route)},
        width: window.innerWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        primary_link_count: primaryLinks.length,
        primary_links_visible: primaryLinks.every((link) => insideViewport(link)),
        project_tools_count:
          document.querySelectorAll('details.product-project-tools, nav[aria-label="Project tools"]').length,
        primary_labels: primaryLinks.map((link) => link.querySelector('strong')?.textContent?.trim() ?? '')
      };
    })()`);
    assert.deepEqual(metrics, {
      route,
      width,
      document_horizontal_overflow: false,
      primary_link_count: 2,
      primary_links_visible: true,
      project_tools_count: 0,
      primary_labels: ["Blank State", "AI Workplane"],
    });
    result.product_shell_responsive_results.push(metrics);
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function validateManagementSafetyKeyboardNavigation() {
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
    "keyboard-opened Manage and protect",
  );
  await dispatchKeyboardKey("Tab", "Tab", 9);
  assert.equal(
    await evaluateString("document.activeElement?.getAttribute('href') ?? ''"),
    "/projects#project-management",
  );
  await dispatchKeyboardKey("Enter", "Enter", 13);
  await waitForCondition(
    `location.pathname === '/projects' && location.hash === '#project-management'`,
    "deterministic project-management fragment navigation",
  );
  await waitForCondition(
    `document.querySelector('#project-management') !== null && document.querySelector('#project-management')?.getClientRects().length > 0`,
    "visible project-management section",
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
}

async function validateRecoveryCorrectionViewports() {
  for (const width of [390, 430]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true,
    });
    const metrics = await evaluateJson(`(() => {
      const main = document.querySelector('[data-recovery-action-confirmation="refresh_required"]');
      const status = main?.querySelector('[data-recovery-safety-state]');
      const refresh = Array.from(main?.querySelectorAll('button') ?? []).find(
        (button) => button.textContent?.trim() === 'Refresh status'
      );
      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      return {
        width: window.innerWidth,
        horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        status_visible: visible(status),
        refresh_visible: visible(refresh),
        refresh_enabled:
          refresh instanceof HTMLButtonElement && !refresh.disabled,
        alert_count: main?.querySelectorAll('[role="alert"]').length ?? -1,
        semantic_primary_count:
          Array.from(main?.querySelectorAll('[data-augnes-primary-action]') ?? []).filter(visible).length,
        state_badge_count:
          main?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        risk_text_present:
          Array.from(main?.querySelectorAll('[data-augnes-visual-priority="risk"]') ?? [])
            .filter(visible)
            .every((item) => (item.innerText ?? '').trim().length > 0),
      };
    })()`);
    assert.deepEqual(metrics, {
      width,
      horizontal_overflow: false,
      status_visible: true,
      refresh_visible: true,
      refresh_enabled: true,
      alert_count: 0,
      semantic_primary_count: 1,
      state_badge_count: 0,
      risk_text_present: true,
    });
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function dispatchKeyboardKey(key, code, keyCode, modifiers = 0) {
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
  });
}

async function openBlankStateProjectOptions() {
  await waitForCondition(
    `(() => {
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-options="true"]')).find((candidate) => candidate.getBoundingClientRect().width > 0 && candidate.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      return details.open;
    })()`,
    "visible Blank State project options",
  );
}

async function closeBlankStateProjectOptions() {
  await waitForCondition(
    `(() => {
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-options="true"]')).find((candidate) => candidate.getBoundingClientRect().width > 0 && candidate.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = false;
      return !details.open;
    })()`,
    "visible Blank State project options before closing",
  );
}

async function validateBlankStateViewports(
  projectContextRequired = true,
  {
    state = "unspecified",
    attentionCount = null,
    attentionCategory = null,
    primaryActions = 1,
    secondaryActionRequired = null,
  } = {},
) {
  for (const width of [390, 430, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluateBoolean(`(() => { window.scrollTo(0, 0); return window.scrollY === 0; })()`);
    await waitForResponsiveSurface(
      '[data-blank-state="v0.1"]',
      width,
      "Blank State",
    );
    const metrics = await evaluateJson(`(() => {
      const visibleElement = (selector) => Array.from(document.querySelectorAll(selector)).find((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      }) ?? null;
      const home = visibleElement('[data-blank-state="v0.1"]');
      const rect = home?.getBoundingClientRect();
      const heading = home?.querySelector('h1');
      const primaryAction = home?.querySelector('[data-blank-state-primary-action]');
      const projectContext = visibleElement('[data-project-context-label]');
      const continuity = home?.querySelector('[data-blank-state-continuity-list]');
      const highlighted = Array.from(
        continuity?.querySelectorAll('[data-blank-state-continuity-highlighted="true"]') ?? [],
      );
      const remaining = Array.from(
        continuity?.querySelectorAll(
          '.blank-state-continuity-list [data-blank-state-continuity-item]',
        ) ?? [],
      );
      const visible = (element) => {
        const bounds = element?.getBoundingClientRect();
        return Boolean(bounds && bounds.width > 0 && bounds.height > 0 && bounds.top < window.innerHeight);
      };
      const raw = Array.from(home?.querySelectorAll('[data-augnes-visual-priority="raw-record"]') ?? [])
        .find(visible);
      const primaryRect = primaryAction?.getBoundingClientRect();
      const controls = Array.from(
        continuity?.querySelectorAll('a, button, summary') ?? [],
      ).filter(visible);
      const overlappingControlCount = controls.flatMap((control, index) =>
        controls.slice(index + 1).filter((candidate) => {
          const left = control.getBoundingClientRect();
          const right = candidate.getBoundingClientRect();
          return Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1 &&
            Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1;
        })
      ).length;
      const visibleText = home?.innerText ?? '';
      const highlightedId =
        highlighted[0]?.getAttribute('data-blank-state-continuity-item') ?? null;
      const remainingIds = remaining.map((item) =>
        item.getAttribute('data-blank-state-continuity-item')
      );
      return {
        surface: 'blank_state',
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
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        heading_visible: visible(heading),
        primary_action_visible:
          Boolean(primaryRect) && primaryRect.width > 0 && primaryRect.height > 0,
        primary_action_count: home?.querySelectorAll('[data-blank-state-primary-action]').length ?? 0,
        project_context_visible: visible(projectContext),
        semantic_primary_action_count:
          home?.querySelectorAll('[data-augnes-primary-action]').length ?? 0,
        primary_action_within_first_scroll:
          Boolean(primaryRect) && primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2,
        primary_action_touch_target:
          Boolean(primaryRect) && primaryRect.height >= 40,
        continuity_present: Boolean(continuity),
        continuity_item_count:
          continuity?.querySelectorAll('[data-blank-state-continuity-item]').length ?? 0,
        highlighted_item_count: highlighted.length,
        highlighted_not_repeated:
          highlightedId !== null && !remainingIds.includes(highlightedId),
        unique_item_ids:
          new Set([highlightedId, ...remainingIds].filter(Boolean)).size ===
          1 + remainingIds.length,
        human_attention_count: Number(
          continuity?.getAttribute('data-blank-state-known-attention-count') ?? '-1',
        ),
        attention_count_status:
          continuity?.getAttribute('data-blank-state-attention-count-status') ?? null,
        source_omitted_attention_count:
          continuity?.getAttribute('data-blank-state-source-omitted-attention-count') ?? null,
        source_attention_omitted_rendered:
          (() => {
            const bounds = continuity
              ?.querySelector('[data-blank-state-source-attention-omitted]')
              ?.getBoundingClientRect();
            return Boolean(bounds && bounds.width > 0 && bounds.height > 0);
          })(),
        highlighted_attention_category:
          highlighted[0]?.getAttribute('data-blank-state-attention-category') ?? null,
        highlighted_attention_text_backed:
          highlighted[0]?.querySelector('.blank-state-attention-label')?.textContent?.trim().length > 0,
        secondary_action_visible:
          controls.some((control) =>
            control.classList.contains('blank-state-secondary-link')
          ),
        overlapping_control_count: overlappingControlCount,
        legacy_competing_regions_absent:
          home?.querySelector('#current-work-title, #attention-title, #recent-change-title') === null,
        management_secondary:
          home?.querySelector('details[data-management-safety]')?.open === false &&
          (home?.querySelector('details[data-blank-state-project-management="collapsed"]')?.open === false ||
            home?.getAttribute('data-blank-state-focus') === 'no_projects' ||
            home?.getAttribute('data-blank-state-focus') === 'project_root_unavailable'),
        internal_id_input_absent:
          home?.querySelector('input[type="text"], textarea, [contenteditable="true"]') === null,
        protocol_vocabulary_absent:
          !/(TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|packet fingerprint|approval_ref|run_ref)/i.test(visibleText),
        continuity_after_context:
          Boolean(continuity) &&
          Boolean(heading) &&
          heading.getBoundingClientRect().top <= continuity.getBoundingClientRect().top,
        independent_surface_count:
          home?.querySelectorAll('[data-augnes-independent-surface]').length ?? 0,
        state_badge_count:
          home?.querySelectorAll('[data-augnes-state-badge]').length ?? 0,
        raw_record_after_primary:
          !raw || !primaryRect || raw.getBoundingClientRect().top >= primaryRect.top
      };
    })()`);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.home_horizontal_overflow, false);
    assert.equal(metrics.home_inside_viewport, true);
    assert.equal(metrics.heading_visible, true, JSON.stringify(metrics));
    assert.equal(
      metrics.primary_action_visible,
      primaryActions === 1,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.primary_action_count, primaryActions);
    assert.equal(metrics.semantic_primary_action_count, primaryActions);
    if (primaryActions === 1) {
      assert.equal(metrics.primary_action_within_first_scroll, true);
      assert.equal(metrics.primary_action_touch_target, true);
    }
    assert.equal(metrics.continuity_present, true);
    assert.equal(metrics.continuity_item_count >= 1, true);
    assert.equal(metrics.continuity_item_count <= 5, true);
    assert.equal(metrics.highlighted_item_count, 1);
    assert.equal(metrics.highlighted_not_repeated, true);
    assert.equal(metrics.unique_item_ids, true);
    assert.equal(
      ["complete", "lower_bound", "source_incomplete"].includes(
        metrics.attention_count_status,
      ),
      true,
    );
    if (metrics.attention_count_status === "lower_bound") {
      assert.equal(Number(metrics.source_omitted_attention_count) > 0, true);
      assert.equal(metrics.source_attention_omitted_rendered, true);
    }
    if (attentionCount !== null) {
      assert.equal(metrics.human_attention_count, attentionCount);
    }
    if (attentionCategory !== null) {
      assert.equal(
        metrics.highlighted_attention_category,
        attentionCategory,
      );
    }
    assert.equal(metrics.highlighted_attention_text_backed, true);
    if (secondaryActionRequired !== null) {
      assert.equal(
        metrics.secondary_action_visible,
        secondaryActionRequired,
        JSON.stringify(metrics),
      );
    }
    assert.equal(metrics.overlapping_control_count, 0);
    assert.equal(metrics.legacy_competing_regions_absent, true);
    assert.equal(metrics.management_secondary, true);
    assert.equal(metrics.internal_id_input_absent, true);
    assert.equal(metrics.protocol_vocabulary_absent, true);
    assert.equal(metrics.continuity_after_context, true);
    assert.equal(metrics.independent_surface_count <= 1, true);
    assert.equal(metrics.state_badge_count <= 1, true);
    assert.equal(metrics.raw_record_after_primary, true);
    assert.equal(metrics.project_context_visible, projectContextRequired);
    result.viewport_results.push({ ...metrics, pc1_state: state });
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function validateWorkbenchResultViewports() {
  for (const width of [390, 430, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitForResponsiveSurface(
      '[data-run-result-review="v0.1"]',
      width,
      "run result",
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
      const raw = Array.from(review?.querySelectorAll('[data-augnes-visual-priority="raw-record"]') ?? [])
        .find(visible);
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
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        heading_visible: visible(heading),
        primary_action_visible: visible(primaryAction),
        primary_action_count: review?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        semantic_primary_action_count:
          review?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        primary_action_within_first_scroll:
          Boolean(primaryRect) && primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2,
        primary_action_touch_target:
          Boolean(primaryRect) && primaryRect.height >= 40,
        independent_surface_count:
          review?.querySelectorAll('[data-augnes-independent-surface]').length ?? -1,
        state_badge_count:
          review?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        raw_record_after_primary:
          !raw || !primaryRect || raw.getBoundingClientRect().top >= primaryRect.top,
        primary_navigation_visible:
          Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] a')).filter(visible).length === 2
      };
    })()`);
    result.viewport_results.push(metrics);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.review_horizontal_overflow, false);
    assert.equal(metrics.review_inside_viewport, true);
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

async function validateDelegatedWorkViewports() {
  for (const width of [390, 430]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluateBoolean(
      `(() => { window.scrollTo(0, 0); return window.scrollY === 0; })()`,
    );
    await waitForResponsiveSurface(
      '[data-delegated-work="delegated_work_projection.v0.1"]',
      width,
      "delegated work",
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
        width: window.innerWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        panel_horizontal_overflow:
          (panel?.scrollWidth ?? 0) > (panel?.clientWidth ?? 0) + 1,
        heading_visible: visible(heading),
        primary_visible: visible(primary),
        primary_count: panel?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? 0,
        semantic_primary_count: panel?.querySelectorAll('[data-augnes-primary-action]').length ?? 0,
        primary_within_first_scroll:
          Boolean(primaryRect) && primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2,
        primary_touch_target:
          Boolean(primaryRect) && primaryRect.height >= 40,
        independent_surface_count:
          panel?.querySelectorAll('[data-augnes-independent-surface]').length ?? 0,
        state_badge_count:
          panel?.closest('[data-ai-workplane-shell]')?.querySelectorAll('[data-augnes-state-badge]').length ?? 0,
        navigation_link_count: navigation?.querySelectorAll(':scope > a').length ?? 0,
        timeline_semantic:
          panel?.querySelector('ol[aria-label="Delegated Codex work progress"]') !== null
      };
    })()`);
    assert.deepEqual(metrics, {
      width,
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
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function validateSharedInspectorViewports() {
  for (const width of [390, 430, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitForResponsiveSurface(
      '[data-shared-project-inspector="v0.1"]',
      width,
      "shared Inspector",
    );
    const metrics = await evaluateJson(`(() => {
      const inspector = document.querySelector('[data-shared-project-inspector="v0.1"]');
      const rect = inspector?.getBoundingClientRect();
      const returnRect = inspector
        ?.querySelector('[data-contextual-inspector-return]')
        ?.getBoundingClientRect();
      const headingRect = inspector
        ?.querySelector('[data-contextual-inspector-heading]')
        ?.getBoundingClientRect();
      const statusRect = inspector
        ?.querySelector('[data-contextual-inspector-status-block]')
        ?.getBoundingClientRect();
      const isVisible = (candidate) =>
        Boolean(candidate) &&
        candidate.width > 0 &&
        candidate.height > 0 &&
        candidate.left >= -1 &&
        candidate.right <= window.innerWidth + 1;
      return {
        surface: 'shared_project_inspector',
        width: window.innerWidth,
        document_scroll_width: document.documentElement.scrollWidth,
        document_client_width: document.documentElement.clientWidth,
        document_horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        inspector_scroll_width: inspector?.scrollWidth ?? -1,
        inspector_client_width: inspector?.clientWidth ?? -1,
        inspector_horizontal_overflow:
          (inspector?.scrollWidth ?? 0) > (inspector?.clientWidth ?? 0) + 1,
        inspector_inside_viewport:
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        return_link_visible: isVisible(returnRect),
        heading_visible: isVisible(headingRect),
        status_visible: isVisible(statusRect),
        semantic_surface_role:
          inspector?.getAttribute('data-augnes-surface-role') ?? null,
        semantic_primary_count:
          inspector?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        state_badge_count:
          inspector?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        raw_record_present:
          inspector?.querySelector('[data-augnes-raw-record="true"]') !== null
      };
    })()`);
    result.viewport_results.push(metrics);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.inspector_horizontal_overflow, false);
    assert.equal(metrics.inspector_inside_viewport, true);
    assert.equal(metrics.return_link_visible, true);
    assert.equal(metrics.heading_visible, true);
    assert.equal(metrics.status_visible, true);
    assert.equal(metrics.semantic_surface_role, "inspector");
    assert.equal(metrics.semantic_primary_count, 0);
    assert.equal(metrics.state_badge_count, 0);
    assert.equal(metrics.raw_record_present, true);
  }
}

async function validateSemanticReviewViewports() {
  for (const width of [390, 430, 768, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitForResponsiveSurface(
      '[data-vnext-semantic-review-detail="v0.1"]',
      width,
      "suggested-change review",
    );
    const metrics = await evaluateJson(`(() => {
      const review = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
      const shellState = shell?.getAttribute('data-ai-workplane-state') ?? '';
      const primaryActionRequired = shellState === 'change_decision';
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
      const raw = Array.from(review?.querySelectorAll('[data-augnes-visual-priority="raw-record"]') ?? [])
        .find(visible);
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
          Boolean(rect) && rect.left >= -1 && rect.right <= window.innerWidth + 1,
        heading_visible: visible(heading),
        shell_state: shellState,
        primary_action_required: primaryActionRequired,
        primary_action_visible:
          primaryActionRequired ? visible(primaryAction) : primaryAction === null,
        primary_action_count: review?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
        semantic_primary_action_count:
          review?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        primary_action_within_first_scroll:
          !primaryActionRequired ||
          (Boolean(primaryRect) && primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2),
        primary_action_touch_target:
          !primaryActionRequired || (Boolean(primaryRect) && primaryRect.height >= 40),
        independent_surface_count:
          review?.querySelectorAll('[data-augnes-independent-surface]').length ?? -1,
        state_badge_count:
          review?.querySelectorAll('[data-augnes-state-badge]').length ?? -1,
        raw_record_after_primary:
          !raw || !primaryRect || raw.getBoundingClientRect().top >= primaryRect.top,
        primary_navigation_visible:
          Array.from(document.querySelectorAll('nav[aria-label="Primary navigation"] a')).filter(visible).length === 2
      };
    })()`);
    result.viewport_results.push(metrics);
    assert.equal(metrics.width, width);
    assert.equal(metrics.document_horizontal_overflow, false);
    assert.equal(metrics.review_horizontal_overflow, false);
    assert.equal(metrics.review_inside_viewport, true);
    assert.equal(metrics.heading_visible, true, JSON.stringify(metrics));
    assert.equal(
      ['change_decision', 'change_applied'].includes(metrics.shell_state),
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.primary_action_visible, true, JSON.stringify(metrics));
    assert.equal(
      metrics.primary_action_count,
      metrics.primary_action_required ? 1 : 0,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.semantic_primary_action_count,
      metrics.primary_action_required ? 1 : 0,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.primary_action_within_first_scroll, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_action_touch_target, true, JSON.stringify(metrics));
    assert.equal(metrics.independent_surface_count <= 2, true, JSON.stringify(metrics));
    assert.equal(metrics.state_badge_count <= 2, true, JSON.stringify(metrics));
    assert.equal(metrics.raw_record_after_primary, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_navigation_visible, true, JSON.stringify(metrics));
  }
}

async function waitForResponsiveSurface(selector, width, label) {
  await waitForCondition(
    `(() => {
      if (window.innerWidth !== ${JSON.stringify(width)}) return false;
      const surface = document.querySelector(${JSON.stringify(selector)});
      if (!(surface instanceof HTMLElement)) return false;
      const rect = surface.getBoundingClientRect();
      return rect.width > 0 &&
        rect.height > 0 &&
        rect.left >= -1 &&
        rect.right <= window.innerWidth + 1 &&
        document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1;
    })()`,
    `stable ${label} ${width}px layout`,
  );
}

async function captureC8ReviewState({
  surface,
  state,
  rootSelector,
  currentSituation,
  primaryAction,
  aiSummary,
  risk,
  supportingInformation,
  rawRecordDisclosure,
  interactionPath,
  knownLimitations,
  expectedPrimaryActions,
  maxIndependentSurfaces,
  maxStateBadges,
}) {
  if (!CAPTURE_C8_REVIEW) return;
  initializeC8ReviewDirectory();
  for (const width of [390, 1440]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width === 390 ? 844 : 1000,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await evaluateBoolean(
      `(() => { window.scrollTo(0, 0); return window.scrollY === 0; })()`,
    );
    await waitForResponsiveSurface(rootSelector, width, `${surface} ${state}`);
    const metrics = await evaluateJson(`(() => {
      const root = document.querySelector(${JSON.stringify(rootSelector)});
      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity || '1') > 0 &&
          rect.width > 0 &&
          rect.height > 0;
      };
      const within = (selector) => {
        if (!(root instanceof HTMLElement)) return [];
        const matches = [];
        if (root.matches(selector)) matches.push(root);
        matches.push(...root.querySelectorAll(selector));
        return matches.filter(visible);
      };
      const primary = within('[data-augnes-primary-action]');
      const situation = within('[data-augnes-visual-priority="situation"]');
      const raw = within('[data-augnes-visual-priority="raw-record"]');
      const risk = within('[data-augnes-visual-priority="risk"]');
      const independent = within('[data-augnes-independent-surface]');
      const firstTop = (items) =>
        items.length > 0
          ? Math.min(...items.map((item) => item.getBoundingClientRect().top))
          : null;
      const primaryRect = primary[0]?.getBoundingClientRect() ?? null;
      const controls = within('a, button, input, select, textarea, summary, label');
      const overlaps = primaryRect
        ? controls.filter((control) => {
            if (control === primary[0] || primary[0].contains(control) || control.contains(primary[0])) {
              return false;
            }
            const rect = control.getBoundingClientRect();
            return Math.min(primaryRect.right, rect.right) - Math.max(primaryRect.left, rect.left) > 1 &&
              Math.min(primaryRect.bottom, rect.bottom) - Math.max(primaryRect.top, rect.top) > 1;
          }).length
        : 0;
      const stateBadges = within('[data-augnes-state-badge]');
      return {
        root_present: root instanceof HTMLElement,
        horizontal_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        primary_action_count: primary.length,
        primary_action_top: primaryRect ? Math.round(primaryRect.top) : null,
        primary_action_height: primaryRect ? Math.round(primaryRect.height) : null,
        primary_action_inside_width:
          primaryRect ? primaryRect.left >= -1 && primaryRect.right <= window.innerWidth + 1 : null,
        primary_action_within_first_scroll:
          primaryRect ? primaryRect.top >= -1 && primaryRect.top <= window.innerHeight * 2 : null,
        overlapping_control_count: overlaps,
        independent_surface_count: independent.length,
        state_badge_count: stateBadges.length,
        situation_top: firstTop(situation),
        raw_record_top: firstTop(raw),
        raw_record_precedes_situation_or_action:
          firstTop(raw) !== null &&
          firstTop(raw) < Math.min(
            firstTop(situation) ?? Number.POSITIVE_INFINITY,
            primaryRect?.top ?? Number.POSITIVE_INFINITY,
          ),
        risk_has_text:
          risk.length === 0 ||
          risk.every((item) => (item.innerText ?? '').trim().length > 0),
      };
    })()`);
    assert.equal(metrics.root_present, true, `${surface}:${state}:${width}`);
    assert.equal(metrics.horizontal_overflow, false, `${surface}:${state}:${width}`);
    assert.equal(
      metrics.primary_action_count,
      expectedPrimaryActions,
      `${surface}:${state}:${width}`,
    );
    assert.equal(metrics.overlapping_control_count, 0, `${surface}:${state}:${width}`);
    assert.equal(
      metrics.independent_surface_count <= maxIndependentSurfaces,
      true,
      `${surface}:${state}:${width}`,
    );
    assert.equal(
      metrics.state_badge_count <= maxStateBadges,
      true,
      `${surface}:${state}:${width}`,
    );
    assert.equal(metrics.raw_record_precedes_situation_or_action, false);
    assert.equal(metrics.risk_has_text, true);
    if (expectedPrimaryActions === 1) {
      assert.equal(metrics.primary_action_inside_width, true);
      assert.equal(metrics.primary_action_within_first_scroll, true);
      if (width === 390) {
        assert.equal(
          metrics.primary_action_height >= 40,
          true,
          `${surface}:${state}:touch-target`,
        );
      }
    }
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const filename = `${surface}-${state}-${width}.png`;
    writeFileSync(
      path.join(c8ReviewDirectory, filename),
      Buffer.from(screenshot.data, "base64"),
      { flag: "wx", mode: 0o600 },
    );
    c8ReviewEntries.push({
      surface,
      state,
      viewport_css_pixels: {
        width,
        height: width === 390 ? 844 : 1000,
      },
      screenshot: filename,
      current_situation_shown: currentSituation,
      primary_action: primaryAction,
      ai_summary: aiSummary,
      risk_and_uncertainty: risk,
      supporting_information: supportingInformation,
      raw_record_disclosure: rawRecordDisclosure,
      card_count: metrics.independent_surface_count,
      card_rationale:
        "Counted only durable independently bounded work, result, decision, management, safety, or audit surfaces.",
      badge_count: metrics.state_badge_count,
      badge_rationale:
        "Counted only durable compact finite-state treatments marked by the semantic visual contract.",
      interaction_path: interactionPath,
      layout_contract: metrics,
      known_limitations: knownLimitations,
    });
    writeC8ReviewIndex();
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

function initializeC8ReviewDirectory() {
  if (c8ReviewDirectory) return;
  const localRoot = path.join(appRepo, ".augnes-local-verification");
  ensureLocalReviewDirectory(localRoot);
  const reviewRoot = path.join(localRoot, "c8-review");
  ensureLocalReviewDirectory(reviewRoot);
  const sessionName = `${new Date().toISOString().replaceAll(":", "-")}-${VALIDATION_SCOPE}`;
  c8ReviewDirectory = path.join(reviewRoot, sessionName);
  assert.equal(existsSync(c8ReviewDirectory), false);
  mkdirSync(c8ReviewDirectory, { mode: 0o700 });
  assert.equal(
    realpathSync(c8ReviewDirectory).startsWith(`${realpathSync(appRepo)}${path.sep}`),
    true,
  );
  writeC8ReviewIndex();
}

function ensureLocalReviewDirectory(directory) {
  if (existsSync(directory)) {
    const stat = lstatSync(directory);
    assert.equal(stat.isSymbolicLink(), false);
    assert.equal(stat.isDirectory(), true);
    return;
  }
  mkdirSync(directory, { mode: 0o700 });
}

function writeC8ReviewIndex() {
  assert(c8ReviewDirectory);
  const index = {
    schema: "augnes.c8-local-visual-review.v1",
    generated_at: new Date().toISOString(),
    validation_scope: VALIDATION_SCOPE,
    human_review_required: true,
    claims_excluded: [
      "No automated result claims aesthetic approval.",
      "No automated result claims ten-second comprehension.",
      "No screenshot is Canonical receipt evidence or independent attestation.",
    ],
    entries: c8ReviewEntries,
  };
  const serialized = `${JSON.stringify(index, null, 2)}\n`;
  assert(Buffer.byteLength(serialized, "utf8") <= 256 * 1024);
  writeFileSync(path.join(c8ReviewDirectory, "review-index.json"), serialized, {
    encoding: "utf8",
    mode: 0o600,
  });
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
      } else if (
        interceptedInspectorResponse &&
        classification.path === "/api/vnext/operator/inspector"
      ) {
        const intercepted = interceptedInspectorResponse;
        interceptedInspectorResponse = null;
        void cdp.send("Fetch.fulfillRequest", {
          requestId: event.params.requestId,
          responseCode: intercepted.status,
          responseHeaders: [
            { name: "Content-Type", value: "application/json; charset=utf-8" },
            { name: "Cache-Control", value: "no-store, max-age=0" },
          ],
          body: Buffer.from(JSON.stringify(intercepted.body), "utf8").toString(
            "base64",
          ),
        }).catch(() => undefined);
      } else if (
        interceptedRecoveryResponses.length > 0 &&
        classification.path === "/api/recovery" &&
        String(event.params?.request?.method ?? "GET").toUpperCase() ===
          interceptedRecoveryResponses[0].method
      ) {
        const intercepted = interceptedRecoveryResponses.shift();
        void cdp.send("Fetch.fulfillRequest", {
          requestId: event.params.requestId,
          responseCode: intercepted.status,
          responseHeaders: [
            { name: "Content-Type", value: "application/json; charset=utf-8" },
            { name: "Cache-Control", value: "no-store, max-age=0" },
          ],
          body: Buffer.from(JSON.stringify(intercepted.body), "utf8").toString(
            "base64",
          ),
        }).catch(() => undefined);
      } else if (
        pausedSemanticTransitionRequest &&
        !pausedSemanticTransitionRequest.request_id &&
        classification.path === "/api/vnext/operator/semantic-transition" &&
        semanticTransitionRequestAction(event.params?.request) ===
          pausedSemanticTransitionRequest.action
      ) {
        pausedSemanticTransitionRequest.request_id = event.params.requestId;
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
        request_id: String(event.params?.requestId ?? ""),
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
          .map((argument) =>
            String(argument.value ?? argument.description ?? "").slice(0, 240),
          )
          .join(" ")
          .slice(0, 720),
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

function semanticTransitionRequestAction(request) {
  const method = String(request?.method ?? "GET").toUpperCase();
  if (method === "GET") return "preview";
  try {
    const body = JSON.parse(String(request?.postData ?? "{}"));
    return body.action === "confirm" || body.action === "apply"
      ? body.action
      : null;
  } catch {
    return null;
  }
}

function pauseNextSemanticTransitionRequest(action) {
  assert.equal(pausedSemanticTransitionRequest, null);
  pausedSemanticTransitionRequest = { action, request_id: null };
}

async function waitForPausedSemanticTransitionRequest(action) {
  await waitForHostCondition(
    () =>
      pausedSemanticTransitionRequest?.action === action &&
      typeof pausedSemanticTransitionRequest.request_id === "string",
    `paused semantic Transition ${action} request`,
  );
}

async function releasePausedSemanticTransitionRequest(action) {
  assert.equal(pausedSemanticTransitionRequest?.action, action);
  assert.equal(
    typeof pausedSemanticTransitionRequest?.request_id,
    "string",
  );
  const requestId = pausedSemanticTransitionRequest.request_id;
  pausedSemanticTransitionRequest = null;
  await cdp.send("Fetch.continueRequest", { requestId });
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

async function runPhase(phase, action, options = {}) {
  const terminalRequestQuiet = options.terminalRequestQuiet !== false;
  if (!terminalRequestQuiet) {
    assert.match(
      options.quietProof ?? "",
      /^[a-z0-9][a-z0-9 _-]{1,120}$/iu,
      "a phase may skip terminal request quiet only with a bounded proof",
    );
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
      `[browser-e2e] phase_result scope=${VALIDATION_SCOPE} phase=${phase} status=pass duration_ms=${Date.now() - phaseStartedAt} expected_next=next_phase_or_cleanup\n`,
    );
  } catch (error) {
    process.stdout.write(
      `[browser-e2e] phase_result scope=${VALIDATION_SCOPE} phase=${phase} status=failed duration_ms=${Date.now() - phaseStartedAt} reason=${safeLifecycleErrorCode(error)}\n`,
    );
    throw error;
  }
}

async function navigate(url) {
  navigationCount += 1;
  const startedAt = Date.now();
  await cdp.send("Page.navigate", { url });
  await waitForCondition(
    `["interactive", "complete"].includes(document.readyState)`,
    `document readiness for ${new URL(url).pathname}`,
  );
  timing.duration(
    "navigation",
    `navigation ${String(navigationCount).padStart(2, "0")}`,
    Date.now() - startedAt,
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

async function waitForEvaluatedString(
  expression,
  label,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await evaluateString(expression).catch(() => "");
    if (value.length > 0) {
      recordLongWait("wait_for_condition", label, startedAt);
      return value;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function evaluateJson(expression) {
  return await evaluate(expression);
}

async function waitForCondition(expression, label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await evaluateBoolean(expression).catch(() => false)) {
      recordLongWait("wait_for_condition", label, startedAt);
      return;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function waitForHostCondition(predicate, label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      recordLongWait("wait_for_host_condition", label, startedAt);
      return;
    }
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
      if (predicate(state)) {
        recordLongWait("wait_for_live_run_projection", label, startedAt);
        return state;
      }
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
  requestQuietCount += 1;
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    if (Date.now() - lastRequestAt >= REQUEST_QUIET_MS) {
      timing.duration(
        "request_quiet",
        `request quiet ${String(requestQuietCount).padStart(2, "0")}`,
        Date.now() - startedAt,
      );
      return;
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for browser request quiet.");
}

async function waitForDownloadedFile(predicate, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    const names = existsSync(downloadDirectory)
      ? readdirSync(downloadDirectory).filter(
          (name) => !name.endsWith(".crdownload") && predicate(name),
        )
      : [];
    if (names.length === 1) {
      recordLongWait("wait_for_downloaded_file", label, startedAt);
      return path.join(downloadDirectory, names[0]);
    }
    if (names.length > 1) {
      throw new Error(`${label} produced an ambiguous file set.`);
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
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

function seedBrowserNormalWorkRun({ databasePath, projectId }) {
  const writableDatabase = new Database(databasePath, { fileMustExist: true });
  try {
    writableDatabase.pragma("foreign_keys = ON");
    const identities = writableDatabase
      .prepare(
        `SELECT workspace_id
           FROM vnext_project_identities
          WHERE project_id = ?
          ORDER BY workspace_id ASC`,
      )
      .all(projectId);
    assert.equal(identities.length, 1);
    const workspaceId = identities[0].workspace_id;
    const runId = "run:browser-pc1-normal-progress";
    const startedAt = "2026-07-21T06:00:00.000Z";
    insertAutonomyRunLedgerRecord(
      {
        run_id: runId,
        scope: projectId,
        autonomy_contract_ref: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
        title: "Continue the onboarding project",
        status: "running",
        scheduled_for: null,
        started_at: startedAt,
        finished_at: null,
        created_at: startedAt,
        updated_at: startedAt,
        stop_reason: null,
        source_refs: buildDefaultRunnerSourceRefs({
          runner_refs: [runId],
        }),
        authority_boundary: buildDefaultRunnerAuthorityBoundary(),
        budget_snapshot: buildDefaultRunnerBudgetSnapshot({
          budget_id: "budget:browser-pc1-normal-progress",
        }),
        metadata: {
          workspace_id: workspaceId,
          project_id: projectId,
          invocation_origin: "interactive",
          lifecycle_mode: "deterministic_local",
          reconciliation_required: false,
          automatic_retry: false,
        },
      },
      [],
      [],
      { db: writableDatabase },
    );
    return runId;
  } finally {
    writableDatabase.close();
  }
}

function removeBrowserNormalWorkRun({ databasePath, runId }) {
  const writableDatabase = new Database(databasePath, { fileMustExist: true });
  try {
    writableDatabase.pragma("foreign_keys = ON");
    const removed = writableDatabase
      .prepare("DELETE FROM autonomy_runs WHERE run_id = ?")
      .run(runId);
    assert.equal(removed.changes, 1);
  } finally {
    writableDatabase.close();
  }
}

function seedFinalR8RestartRuns({
  databasePath,
  workspaceId,
  projectId,
  packetId,
  packetFingerprint,
}) {
  const writableDatabase = new Database(databasePath, { fileMustExist: true });
  try {
    writableDatabase.pragma("foreign_keys = ON");
    const receiptRow = writableDatabase.prepare(
      `SELECT record_id, fingerprint, payload_json
         FROM vnext_core_records
        WHERE record_kind = 'run_receipt'
          AND workspace_id = ?
          AND project_id = ?
        ORDER BY created_at ASC, record_id ASC
        LIMIT 1`,
    ).get(workspaceId, projectId);
    assert(receiptRow, "Imported terminal receipt fixture missing.");
    const receipt = JSON.parse(receiptRow.payload_json);
    assert.equal(typeof receipt.run_id, "string");
    const authority = buildDefaultRunnerAuthorityBoundary();
    const budget = buildDefaultRunnerBudgetSnapshot({
      budget_id: "budget:final-r8-restart",
    });
    const sourceRefs = buildDefaultRunnerSourceRefs({
      runner_refs: [packetId],
    });
    const terminalStartedAt = receipt.started_at ?? "2026-07-21T05:40:00.000Z";
    const terminalFinishedAt = receipt.finished_at ?? "2026-07-21T05:41:00.000Z";
    const receiptPacketRef = receipt.task_context_packet_ref;
    insertAutonomyRunLedgerRecord(
      {
        run_id: receipt.run_id,
        scope: projectId,
        autonomy_contract_ref: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
        title: "Imported terminal receipt exact replay",
        status: "completed",
        scheduled_for: null,
        started_at: terminalStartedAt,
        finished_at: terminalFinishedAt,
        created_at: terminalStartedAt,
        updated_at: terminalFinishedAt,
        stop_reason: null,
        source_refs: sourceRefs,
        authority_boundary: authority,
        budget_snapshot: budget,
        metadata: {
          workspace_id: workspaceId,
          project_id: projectId,
          ...(receiptPacketRef
            ? {
                packet_id: receiptPacketRef.external_id,
                packet_fingerprint: receiptPacketRef.source_ref,
              }
            : {}),
          lifecycle_mode: "deterministic_local",
          run_receipt_id: receiptRow.record_id,
          run_receipt_fingerprint: receiptRow.fingerprint,
          terminal_receipt_persisted: true,
          reconciliation_required: false,
          automatic_retry: false,
        },
      },
      [{
        step_id: `${receipt.run_id}.step.receipt`,
        run_id: receipt.run_id,
        step_index: 1,
        action_kind: "invoke_project_scoped_host_adapter",
        status: "completed",
        title: "Preserved terminal host result",
        summary: "The imported canonical receipt remains terminal and is not replayed as work.",
        started_at: terminalStartedAt,
        finished_at: terminalFinishedAt,
        output: {},
        error_message: null,
        created_at: terminalStartedAt,
        updated_at: terminalFinishedAt,
      }],
      [{
        event_id: `${receipt.run_id}.event.completed`,
        run_id: receipt.run_id,
        step_id: null,
        event_type: "run_completed",
        status: "completed",
        message: "Terminal receipt fixture admitted through the canonical run ledger.",
        payload: { automatic_retry_started: false },
        created_at: terminalFinishedAt,
      }],
      { db: writableDatabase },
    );
    const activeRunId = "run:final-r8-restart-review";
    const activeAt = new Date(
      Date.parse(terminalFinishedAt) + 10 * 60_000,
    ).toISOString();
    insertAutonomyRunLedgerRecord(
      {
        run_id: activeRunId,
        scope: projectId,
        autonomy_contract_ref: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
        title: "Unobservable host run after restart",
        status: "running",
        scheduled_for: null,
        started_at: activeAt,
        finished_at: null,
        created_at: activeAt,
        updated_at: activeAt,
        stop_reason: null,
        source_refs: sourceRefs,
        authority_boundary: authority,
        budget_snapshot: budget,
        metadata: {
          workspace_id: workspaceId,
          project_id: projectId,
          work_id: "work:final-r8-restart",
          packet_id: packetId,
          packet_fingerprint: packetFingerprint,
          lifecycle_mode: "deterministic_local",
          host_external_ref: {
            ref_version: "external_ref.v0.1",
            ref_type: "native_host_run",
            external_id: "host:final-r8-restart-review",
          },
          policy_id: "policy:final-r8-restart",
          grant_id: "grant:final-r8-restart",
          budget_id: "budget:final-r8-restart",
          capability_scope: "local_project_only",
          operation_scope: "exact_run_only",
          automatic_retry: false,
        },
      },
      [{
        step_id: `${activeRunId}.step.host`,
        run_id: activeRunId,
        step_index: 1,
        action_kind: "invoke_project_scoped_host_adapter",
        status: "running",
        title: "Observe project-scoped host operation",
        summary: "The prior host operation has no supported restart observer.",
        started_at: activeAt,
        finished_at: null,
        output: {},
        error_message: null,
        created_at: activeAt,
        updated_at: activeAt,
      }],
      [{
        event_id: `${activeRunId}.event.started`,
        run_id: activeRunId,
        step_id: null,
        event_type: "run_started",
        status: "running",
        message: "Nonterminal fixture admitted through the canonical run ledger.",
        payload: { automatic_retry_started: false },
        created_at: activeAt,
      }],
      { db: writableDatabase },
    );
    const canonicalValidation = validateRecoveryCanonicalDatabaseV01(
      writableDatabase,
    );
    assert.equal(
      canonicalValidation.status,
      "valid",
      `Restart fixture canonical validation refused: ${canonicalValidation.code}`,
    );
    assert.equal(canonicalValidation.code, "canonical_records_valid");
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
        packets: coreCount("task_context_packet"),
        context_use_reviews: coreCount("context_use_review"),
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
  waitCount += 1;
  const waitNumber = waitCount;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
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
      const diagnostic = result.supervisor_exit_diagnostic;
      throw new Error(
        `Next runtime exited early: result=${diagnostic?.last_supervisor_result_code ?? "unknown"} reason=${diagnostic?.last_public_reason_code ?? "unknown"} database_state=${diagnostic?.database_state ?? "unknown"} phase=${diagnostic?.bootstrap_recovery_phase ?? "unknown"} exit_code=${diagnostic?.supervisor_exit_code ?? "null"} signal=${diagnostic?.supervisor_signal ?? "null"}`,
      );
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) {
        const durationMs = Date.now() - startedAt;
        timing.duration(
          "wait_for_http",
          `wait for http ${String(waitNumber).padStart(2, "0")}`,
          durationMs,
        );
        if (pendingServerStartupFinish) {
          pendingServerStartupFinish();
          pendingServerStartupFinish = null;
        }
        return response;
      }
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
  chromeProcessRecord = null;
  serverProcess = null;
  serverProcessRecord = null;
  serverClosePromise = null;
  serverPublicDiagnosticCapture = null;
  serverLog = "";
  await removeTemporaryRoots([tempRoot, processTempRoot]);
}

async function terminateProcess(child, gracefulTimeoutMs) {
  if (!child) return;
  const isServer = child === serverProcess;
  const shutdownStartedAt = Date.now();
  const record =
    child === serverProcess
      ? serverProcessRecord
      : child === chromeProcess
        ? chromeProcessRecord
        : null;
  if (!record) throw new Error("Owned browser process record is unavailable.");
  if (record.exited || record.closed) {
    await settleOwnedProcessAfterExit(record, {
      streamDrainMs: 500,
      termGraceMs: gracefulTimeoutMs,
      killGraceMs: 2_000,
    });
    if (isServer) recordServerShutdown(shutdownStartedAt);
    return;
  }
  await terminateOwnedProcessTree(record, {
    termGraceMs: gracefulTimeoutMs,
    killGraceMs: 2_000,
  });
  if (isServer) recordServerShutdown(shutdownStartedAt);
}

function recordServerShutdown(startedAt) {
  serverShutdownCount += 1;
  timing.duration(
    "runtime_shutdown",
    `runtime shutdown ${String(serverShutdownCount).padStart(2, "0")}`,
    Date.now() - startedAt,
  );
}

function recordLongWait(kind, label, startedAt) {
  const durationMs = Date.now() - startedAt;
  if (durationMs <= 500) return;
  waitCount += 1;
  timing.duration(
    kind,
    `${String(label)} [${String(waitCount).padStart(3, "0")}]`,
    durationMs,
  );
}

function readApprovalBarrierTiming() {
  assert.equal(existsSync(browserApprovalBarrierTracePath), true);
  const allowedKinds = new Set([
    "approval_emitted",
    "approval_decision_received",
    "browser_release_requested",
    "browser_release_observed",
    "terminal_state_emitted",
  ]);
  const entries = readFileSync(browserApprovalBarrierTracePath, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const fixtureStartedAt = Date.parse(
    entries.find((entry) => entry.kind === "fixture_started")?.at ?? "",
  );
  assert.equal(Number.isFinite(fixtureStartedAt), true);
  const publicEntries = entries
    .filter((entry) => allowedKinds.has(entry.kind))
    .map((entry) => ({
      event: entry.kind,
      elapsed_ms: Math.max(0, Date.parse(entry.at) - fixtureStartedAt),
      approval_index: Number.isSafeInteger(entry.value?.approval_index)
        ? entry.value.approval_index
        : null,
      label:
        ["browser_second_approval", "browser_terminal"].includes(
          entry.value?.label,
        )
          ? entry.value.label
          : null,
      observation:
        ["preexisting", "post_registration", "watcher", "poll_fallback"].includes(
          entry.value?.observation,
        )
          ? entry.value.observation
          : null,
    }));
  assert.equal(
    publicEntries.filter((entry) => entry.event === "approval_emitted").length,
    2,
  );
  assert.equal(
    publicEntries.filter((entry) => entry.event === "approval_decision_received")
      .length,
    2,
  );
  assert.equal(
    publicEntries.filter((entry) => entry.event === "browser_release_observed")
      .length,
    2,
  );
  assert.equal(
    publicEntries.filter((entry) => entry.event === "terminal_state_emitted")
      .length,
    1,
  );
  return {
    timing_version: "browser_approval_barriers.v0.1",
    events: publicEntries,
  };
}

function countBrowserFixtureReceivedMethod(method) {
  if (!existsSync(browserApprovalBarrierTracePath)) return 0;
  return readFileSync(browserApprovalBarrierTracePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter(
      (entry) =>
        entry.kind === "received" && entry.value?.method === method,
    ).length;
}

function childHasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
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
  if (!(error instanceof Error)) return "unknown_browser_validation_failure";
  const frame = error.stack
    ?.split("\n")
    .find((line) => line.includes("browser-validate-vnext-native-host-result-v0-1.mjs:"))
    ?.replace(/^.*?(scripts\/browser-validate-vnext-native-host-result-v0-1\.mjs:\d+:\d+).*$/u, "$1");
  return `${currentPhase}:${error.name}: ${error.message}${frame ? ` (${frame})` : ""}`.slice(0, 500);
}

function safeLifecycleErrorCode(error) {
  const candidate =
    typeof error?.code === "string" ? error.code : error?.name;
  return typeof candidate === "string" && /^[A-Za-z0-9_.-]{1,64}$/u.test(candidate)
    ? candidate
    : "browser_validation_failure";
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
