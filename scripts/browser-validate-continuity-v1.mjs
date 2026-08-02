#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  copyFileSync,
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
  buildSemanticReviewLoopTaskContextPacketFixture,
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
import { buildRunReceiptV01 } from "../lib/vnext/run-receipt.ts";
import { commitVNextSemanticTransitionV01 } from "../lib/vnext/runtime/durable-semantic-transition.ts";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler.ts";
import { selectPersonalPerspectiveContextV01 } from "../lib/vnext/project-controls/project-controls.ts";
import {
  mutateProjectControlV01,
  readPersonalPerspectiveEffectiveScopeV01,
} from "../lib/vnext/persistence/project-control-store.ts";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry.ts";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry.ts";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "../lib/vnext/protocol-primitives.ts";
import { evaluateCriterionAssessmentV01 } from "../lib/vnext/criterion-assessment.ts";
import { materializeRunAssessmentProposalV01 } from "../lib/vnext/run-assessment-proposal.ts";
import { admitEpisodeDeltaProposalV01 } from "../lib/vnext/persistence/episode-delta-proposal-admission.ts";
import { createSharedInspectorHrefV01 } from "../lib/vnext/shared-project-inspector-href.ts";
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision.ts";
import {
  buildSelectedWorkTimelineV01,
} from "../lib/vnext/ai-workplane/selected-work-timeline.ts";
import { DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 } from "../lib/vnext/runtime/direct-native-host-round-trip.ts";
import { readProjectRunResultOverviewV01 } from "../lib/vnext/runtime/project-run-result-read-model.ts";
import { VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01 } from "../lib/vnext/runtime/operator-pilot-context-use-contract.ts";
import { projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity.ts";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage.ts";
import { insertAutonomyRunLedgerRecord } from "../lib/autonomy/runner-ledger.ts";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
} from "../lib/autonomy/runner-state.ts";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session.ts";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization.ts";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator.ts";
import { createBrowserSupervisorPublicDiagnosticCapture } from "./browser-supervisor-public-diagnostic.mjs";
import { createBrowserE2ETimingRecorder } from "./browser-e2e-timing.mjs";
import {
  createExpectedRefusalAccounting,
  unexpectedConsoleErrorsForExpectedRefusals,
} from "./browser-expected-refusal-accounting.mjs";
import { readContinuityOperationalStatus } from "./continuity-operational-status.mjs";
import {
  registerOwnedChild,
  settleOwnedProcessAfterExit,
  terminateOwnedProcessTree,
} from "./test-harness-process-lifecycle.mjs";
import {
  assertContinuityFinalSuccessV1,
  createContinuityCompletionOwnerV1,
  loadContinuityResultContractV1,
} from "./continuity-result-contract-v1.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 = 64;

const VALIDATION_VERSION = "continuity_browser_validation.v1";
const VALIDATION_SCOPE = "continuity";
const ACCEPTANCE_BOUND_MS = 480_000;
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
const POSITIVE_LOCKED_SESSION_REFUSAL_TOKEN =
  "expected:positive-project-missing-session";
const STALE_MIXED_SESSION_REFUSAL_TOKEN =
  "expected:mixed-project-stale-session";
const originalUmask = process.umask(0o077);
const startedAt = Date.now();
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
const sourceFixtureDir = path.join(fixtureDir, "source");
const writableFixtureDir = path.join(fixtureDir, "writable");
const manifestPath = path.join(
  sourceFixtureDir,
  "operator-pilot-browser-fixture.json",
);
const sourceDatabasePath = path.join(sourceFixtureDir, "operator-pilot.db");
const databasePath = path.join(writableFixtureDir, "continuity.db");
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
const positiveLineageProjectRoot = path.join(
  tempRoot,
  "Browser Positive Lineage Project",
);
const folderPickerSequencePath = path.join(
  tempRoot,
  "canonical-folder-picker-sequence.json",
);
const browserApprovalBarrierTracePath = path.join(
  tempRoot,
  "browser-approval-barriers.jsonl",
);
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
let lastObserverActivityAt = Date.now();
let serverLog = "";
const interceptedRecoveryResponses = [];
const requests = [];
const responses = [];
const requestMethods = new Map();
const consoleErrors = [];
const expectedRefusalAccounting = createExpectedRefusalAccounting({
  maximumTokens: 4,
  maximumEvents: 256,
});
const expectedRefusalRequestLifecycles = new Map();
const expectedRefusalAccountingPhases = new Set();
const expectedRefusalObserverStartedAt = process.hrtime.bigint();
let expectedRefusalAccountingActive = false;
let expectedRefusalObserverSequence = 0;
let finalizedExpectedRefusalReport = null;
let expectedPositiveContextUseReviewRequestId = null;
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];
const assertions = [];
const ownedBrowserProcesses = new Set();
const timing = createBrowserE2ETimingRecorder({ scope: VALIDATION_SCOPE });
const detailedFieldContract = loadContinuityResultContractV1();
const completionOwner = createContinuityCompletionOwnerV1(detailedFieldContract);
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
  owner: "continuity",
  acceptance_bound_ms: ACCEPTANCE_BOUND_MS,
  detailed_field_count: detailedFieldContract.field_ids.length,
  detailed_marker_count: detailedFieldContract.marker_ids.length,
  completed_detailed_field_ids: [],
  completed_detailed_field_fingerprint: null,
  semantic_markers: [],
  semantic_marker_fingerprint: null,
  fixture_source: "deterministic_production_seam_builder",
  fixture_generation_duration_ms: null,
  fixture_version: "continuity_browser_fixture.v1",
  fixture_fingerprint: null,
  fixture_source_database_sha256: null,
  fixture_writable_seed_sha256: null,
  app_repo: appRepo,
  proposal_id: null,
  proposal_fingerprint: null,
  packet_id: null,
  packet_fingerprint: null,
  active_packet_id: null,
  active_packet_fingerprint: null,
  context_use_feedback_waits_for_real_later_run: false,
  bounded_automation_packet_excluded_from_workbench_lineage: false,
  positive_generic_prior_packet_seeded: false,
  positive_bootstrap_proposal_admitted: false,
  positive_transition_compiled_eligible_packet: false,
  positive_latest_compiled_packet_precondition_passed: false,
  positive_proposal_has_one_packet_compiled_chain: false,
  positive_first_real_host_action_used_latest_packet: false,
  positive_latest_packet_bound_result_recognized: false,
  positive_later_outcome_relationship_is_exact: false,
  positive_and_mixed_projects_remain_isolated: false,
  minimum_project_home_restart_root_resolution: false,
  project_automation_restart_persisted: false,
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
  project_controls_restart_persisted: false,
  semantic_proposals_created: 0,
  review_decisions_created: 0,
  semantic_transitions_created: 0,
  unexpected_external_request_count: 0,
  unexpected_console_error_count: 0,
  unexpected_console_failure_count: 0,
  unexpected_page_failure_count: 0,
  unexpected_request_failure_count: 0,
  credential_private_material_boundary: false,
  default_database_isolated: false,
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
  cleanup_complete: false,
  owned_streams_settled: false,
  owned_process_residue_count: null,
  listener_residue_count: null,
  runtime_shutdown_complete: false,
  chrome_cdp_shutdown_complete: false,
  total_duration_ms: null,
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

let functionalExecutionSucceeded = false;
try {
  process.stdout.write(
    `[browser-e2e] lifecycle_start scope=${VALIDATION_SCOPE} expected_next=fixture_build\n`,
  );
  await main();
  functionalExecutionSucceeded = true;
} catch (error) {
  result.failure = safeError(error);
  process.exitCode = 1;
} finally {
  bootstrapToken = null;
  process.stdout.write(
    `[browser-e2e] cleanup_start scope=${VALIDATION_SCOPE} phase=${currentPhase} owned_processes=${ownedBrowserProcesses.size}\n`,
  );
  const finishCleanupTiming = timing.start("cleanup", "global cleanup");
  try {
    await cleanup();
    result.cleanup_complete = true;
  } catch (error) {
    if (!result.failure) result.failure = safeError(error);
    process.exitCode = 1;
  } finally {
    finishCleanupTiming();
  }
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
  result.owned_streams_settled = ownedBrowserProcesses.size === 0;
  result.owned_process_residue_count = ownedBrowserProcesses.size;
  try {
    result.listener_residue_count =
      (appPort && (await canConnectToListener("127.0.0.1", appPort)) ? 1 : 0) +
      (bridgePort && (await canConnectToListener("127.0.0.1", bridgePort)) ? 1 : 0) +
      (debugPort && (await canConnectToListener("127.0.0.1", debugPort)) ? 1 : 0);
  } catch (error) {
    if (!result.failure) result.failure = safeError(error);
    process.exitCode = 1;
  }
  result.runtime_shutdown_complete = serverProcess === null;
  result.chrome_cdp_shutdown_complete = chromeProcess === null && cdp === null;
  result.completed_detailed_field_ids = completionOwner.fieldIds();
  result.completed_detailed_field_fingerprint = completionOwner.fieldFingerprint();
  result.semantic_markers = completionOwner.markerIds();
  result.semantic_marker_fingerprint = completionOwner.markerFingerprint();
  result.e2e_timing_summary = timing.summary();
  result.total_duration_ms = Date.now() - startedAt;
  try {
    const finalizationResult = JSON.parse(JSON.stringify(result));
    assertContinuityFinalSuccessV1({
      result: finalizationResult,
      contract: detailedFieldContract,
      completion_owner: completionOwner,
      functional_execution_succeeded: functionalExecutionSucceeded,
    });
    result.ok = true;
  } catch (error) {
    result.ok = false;
    if (!result.failure) result.failure = safeError(error);
    process.exitCode = 1;
  }
  process.umask(originalUmask);
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
  mkdirSync(writableFixtureDir, { recursive: true, mode: 0o700 });
  copyFileSync(sourceDatabasePath, databasePath);
  finishFixtureTiming();
  result.fixture_generation_duration_ms = Date.now() - fixtureStartedAt;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.fixture_version, "vnext_operator_pilot_browser_fixture.v0.1");
  assert.equal(manifest.credential_material_included, false);
  assert.equal(manifest.external_identity_authenticated, false);
  assert.equal(manifest.semantic_authority_granted, false);
  assert.deepEqual(
    manifest.database_identity,
    databaseFileIdentityV01(sourceDatabasePath),
  );
  assert.equal(manifest.database_binding, "deterministic_production_fixture");
  assert.equal(manifest.database_file, path.basename(sourceDatabasePath));
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
  result.fixture_source_database_sha256 = sha256File(sourceDatabasePath);
  result.fixture_writable_seed_sha256 = sha256File(databasePath);
  assert.equal(
    result.fixture_source_database_sha256,
    result.fixture_writable_seed_sha256,
  );
  result.fixture_fingerprint = `sha256:${createHash("sha256")
    .update(
      JSON.stringify({
        fixture_version: result.fixture_version,
        source_database_sha256: result.fixture_source_database_sha256,
        workspace_id: manifest.workspace_id,
        project_id: manifest.project_id,
      }),
    )
    .digest("hex")}`;
  result.default_database_accessed = fixtureSummary.default_database_accessed;

  activateFixtureProjectForContinuity(databasePath, {
    workspaceId: manifest.workspace_id,
    projectId: manifest.project_id,
  });

  const activePacketId = manifest.packet_id;
  const activePacketFingerprint = manifest.packet_fingerprint;

  result.proposal_id = manifest.proposal_id;
  result.proposal_fingerprint = manifest.proposal_fingerprint;
  result.packet_id = manifest.packet_id;
  result.packet_fingerprint = manifest.packet_fingerprint;
  result.active_packet_id = activePacketId;
  result.active_packet_fingerprint = activePacketFingerprint;

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
  mkdirSync(positiveLineageProjectRoot, { recursive: true });
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

  await runPhase("long_term_lineage_continuity", async () => {
    const config = readVNextLocalOperatorPilotConfigV01(runtimeEnvironment);
    const proposalRow = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'episode_delta_proposal'
           AND workspace_id = ?
           AND project_id = ?
           AND record_id = ?
           AND fingerprint = ?`,
      )
      .get(
        manifest.workspace_id,
        manifest.project_id,
        manifest.proposal_id,
        manifest.proposal_fingerprint,
      );
    assert(proposalRow, "continuity source proposal missing");
    const sourceProposal = JSON.parse(proposalRow.payload_json);
    const packetRow = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND workspace_id = ?
           AND project_id = ?
           AND record_id = ?
           AND fingerprint = ?`,
      )
      .get(
        manifest.workspace_id,
        manifest.project_id,
        manifest.packet_id,
        manifest.packet_fingerprint,
      );
    assert(packetRow, "continuity compiled packet missing");
    const sourcePacket = JSON.parse(packetRow.payload_json);
    const positiveContinuity = projectVNextOperatorPilotContinuityV01(database, {
      config,
      clock: { now: () => "2026-08-02T00:00:00.000Z" },
    });
    assert.deepEqual(positiveContinuity.latest_compiled_packet, {
      packet_id: manifest.packet_id,
      packet_fingerprint: manifest.packet_fingerprint,
      generated_at: sourcePacket.generated_at,
      expires_at: sourcePacket.expires_at,
      accepted_state_count: 1,
      lineage_kind: "semantic_transition",
    });
    result.positive_latest_compiled_packet_precondition_passed = true;
    record("positive_latest_compiled_packet_precondition_passed");

    const lineage = readVNextOperatorPilotProposalDurableLineageV01(database, {
      config,
      proposal: sourceProposal,
      clock: { now: () => "2026-08-02T00:00:00.000Z" },
    });
    const compiledChains = lineage.chains.filter(
      (chain) => chain.stage_status === "packet_compiled",
    );
    assert.equal(compiledChains.length, 1);
    assert.equal(
      compiledChains[0]?.compiled_packet?.packet_id,
      manifest.packet_id,
    );
    assert.equal(
      compiledChains[0]?.compiled_packet?.packet_fingerprint,
      manifest.packet_fingerprint,
    );
    assert.equal(
      compiledChains[0]?.transition?.receipt_id,
      manifest.transition_receipt_id,
    );
    result.positive_proposal_has_one_packet_compiled_chain = true;
    result.positive_transition_compiled_eligible_packet = true;
    record("positive_proposal_has_one_packet_compiled_chain");
    record("positive_transition_compiled_eligible_packet");

    const earlierPackets = database
      .prepare(
        `SELECT record_id, fingerprint
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND workspace_id = ?
           AND project_id = ?
           AND record_id <> ?
         ORDER BY created_at, record_id`,
      )
      .all(manifest.workspace_id, manifest.project_id, manifest.packet_id);
    assert.equal(earlierPackets.length >= 2, true);
    result.positive_generic_prior_packet_seeded = true;
    record("positive_generic_prior_packet_seeded");
    assert.equal(lineage.proposal_id, manifest.proposal_id);
    assert.equal(lineage.proposal_fingerprint, manifest.proposal_fingerprint);
    result.positive_bootstrap_proposal_admitted = true;
    record("positive_bootstrap_proposal_admitted");

    assert.equal(
      positiveContinuity.latest_context_use_receipt?.task_context_packet_id,
      manifest.packet_id,
    );
    assert.equal(
      positiveContinuity.latest_context_use_receipt
        ?.task_context_packet_fingerprint,
      manifest.packet_fingerprint,
    );
    assert.equal(positiveContinuity.latest_context_use_review_status, null);
    result.positive_first_real_host_action_used_latest_packet = true;
    result.positive_latest_packet_bound_result_recognized = true;
    result.context_use_feedback_waits_for_real_later_run = true;
    record("positive_first_real_host_action_used_latest_packet");
    record("positive_latest_packet_bound_result_recognized");
    record("selected_work_relationship_exposes_exact_later_feedback_review");

    const transitionRow = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'state_transition_receipt'
           AND workspace_id = ?
           AND project_id = ?
           AND record_id = ?
           AND fingerprint = ?`,
      )
      .get(
        manifest.workspace_id,
        manifest.project_id,
        manifest.transition_receipt_id,
        manifest.transition_receipt_fingerprint,
      );
    assert(transitionRow, "continuity transition receipt missing");
    const transitionReceipt = JSON.parse(transitionRow.payload_json);
    const appliedCandidateId = transitionReceipt.source_candidate.candidate_id;
    const proposalPath = `/workbench/semantic-review/${manifest.proposal_id.replace(":", "~")}`;
    await navigate(`${appOrigin}${proposalPath}`);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
      "exact durable proposal detail",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const selector = document.querySelector('[data-vnext-candidate-selector="v0.1"]');
        if (!(selector instanceof HTMLSelectElement)) return true;
        if (!Array.from(selector.options).some((entry) => entry.value === ${JSON.stringify(appliedCandidateId)})) return false;
        selector.value = ${JSON.stringify(appliedCandidateId)};
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`),
      true,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="later_outcome_available"]') !== null`,
      "exact durable later-outcome relationship",
    );
    const exactRelationship = await evaluateJson(`(() => {
      const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const relationships = detail?.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"]');
      const feedback = detail?.querySelector('[data-vnext-context-use-feedback]');
      const relationshipText = relationships?.textContent ?? '';
      return {
        stage: detail?.getAttribute('data-selected-work-current-stage') ?? null,
        feedback: feedback?.getAttribute('data-vnext-context-use-feedback') ?? null,
        form: feedback?.querySelector('[data-vnext-context-use-review-form="v0.1"]') !== null,
        question: relationships?.getAttribute('data-selected-work-relationship-question') ?? null,
        highlighted_count: relationships?.querySelectorAll('[data-selected-work-relationship-highlighted="true"]').length ?? -1,
        exact_later_basis: relationships?.querySelector('[data-selected-work-relationship-kind="used_by_later_work"][data-selected-work-relationship-basis="later_outcome"][data-selected-work-relationship-support="exact"]') !== null,
        reviewed_connection_absent: relationships?.querySelector('[data-selected-work-relationship-kind="reviewed_by_later_feedback"]') === null,
        raw_protocol_copy_absent: !/(sha256:|episode-delta-proposal:|review-decision:|state-transition-receipt:|task-context-packet:|run-receipt:|TaskContextPacket|RunReceipt)/i.test(relationshipText),
        primary_action_count: detail?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
      };
    })()`);
    assert.deepEqual(exactRelationship, {
      stage: "later_outcome_available",
      feedback: "available",
      form: true,
      question: "project_change_and_later_outcome",
      highlighted_count: 1,
      exact_later_basis: true,
      reviewed_connection_absent: true,
      raw_protocol_copy_absent: true,
      primary_action_count: 0,
    });
    result.positive_later_outcome_relationship_is_exact = true;
    record("positive_later_outcome_relationship_is_exact");

    const latestPacketRow = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND record_id = ?
           AND fingerprint = ?`,
      )
      .get(manifest.packet_id, manifest.packet_fingerprint);
    assert(latestPacketRow, "latest continuity packet missing");
    const latestPacket = JSON.parse(latestPacketRow.payload_json);
    const boundedPacket = buildTaskContextPacketV01({
      workspace_id: latestPacket.workspace_id,
      project_id: latestPacket.project_id,
      work_ref: latestPacket.work_ref,
      generated_at: "2026-08-02T00:00:10.000Z",
      expires_at: "2026-08-02T08:00:10.000Z",
      task: latestPacket.task,
      current_projection: latestPacket.current_projection,
      selected_context: latestPacket.selected_context,
      excluded_context: latestPacket.excluded_context,
      tensions: latestPacket.tensions,
      risks: latestPacket.risks,
      gaps: latestPacket.gaps,
      constraints: latestPacket.constraints,
      capability_grant: latestPacket.capability_grant,
      criterion_verification_plan: latestPacket.criterion_verification_plan,
      return_contract: latestPacket.return_contract,
      source_status: latestPacket.source_status,
      compatibility: {
        ...latestPacket.compatibility,
        source_contracts: [
          ...latestPacket.compatibility.source_contracts,
          "vnext_bounded_automation_context_compiler.v0.1",
        ],
        warnings: [
          ...latestPacket.compatibility.warnings,
          "Bounded automation fixture remains outside workbench Transition lineage.",
        ],
      },
      authority_notes: [
        ...latestPacket.authority_summary.notes,
        "This packet grants no semantic authority.",
      ],
    });
    const boundedDatabasePath = path.join(
      tempRoot,
      "bounded-lineage-isolation.db",
    );
    copyFileSync(databasePath, boundedDatabasePath);
    const boundedWriter = new Database(boundedDatabasePath);
    try {
      boundedWriter.pragma("foreign_keys = ON");
      insertVNextCoreRecordV01(boundedWriter, {
        record_kind: "task_context_packet",
        record_id: boundedPacket.packet_id,
        workspace_id: boundedPacket.workspace_id,
        project_id: boundedPacket.project_id,
        fingerprint: boundedPacket.integrity.fingerprint,
        idempotency_key: null,
        payload: boundedPacket,
        created_at: boundedPacket.generated_at,
      });
      const lineageAfterBounded =
        readVNextOperatorPilotProposalDurableLineageV01(boundedWriter, {
          config,
          proposal: sourceProposal,
          clock: { now: () => "2026-08-02T00:00:11.000Z" },
        });
      assert.equal(
        lineageAfterBounded.chains.some(
          (chain) =>
            chain.compiled_packet?.packet_id === boundedPacket.packet_id,
        ),
        false,
      );
    } finally {
      boundedWriter.close();
      rmSync(boundedDatabasePath, { force: true });
    }
    result.bounded_automation_packet_excluded_from_workbench_lineage = true;
    record("bounded_automation_packet_excluded_from_workbench_lineage");
    record("older_packet_bound_later_result_is_not_latest_continuity");
  });

  await runPhase("personal_perspective_inspector", async () => {
    const personalScopeWriter = new Database(databasePath);
    try {
      personalScopeWriter.pragma("foreign_keys = ON");
      const defaultScope = readPersonalPerspectiveEffectiveScopeV01(
        personalScopeWriter,
        {
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
        },
      );
      assert.equal(defaultScope.status, "not_configured");
      assert.equal(defaultScope.effectively_included, false);
      result.personal_perspective_default_excluded = true;

      const projectB = getOrCreateCanonicalProjectForLocalRootV01(
        personalScopeWriter,
        {
          workspace_id: manifest.workspace_id,
          local_root: normalizeLocalProjectRootRefV01(onboardingFolderB, {
            base_path: tempRoot,
          }),
          display_name: "Continuity isolation project",
        },
        {
          create_uuid: () => "99999999-9999-4999-8999-999999999999",
          now: () => "2026-08-02T00:00:00.000Z",
        },
      );
      touchRecentProjectV01(personalScopeWriter, {
        workspace_id: manifest.workspace_id,
        project_id: projectB.project.project_id,
        now: "2026-08-02T00:00:01.000Z",
      });
      const activeA = readActiveProjectSelectionV01(
        personalScopeWriter,
        manifest.workspace_id,
      );
      assert.equal(activeA?.project_id, manifest.project_id);
      const activeB = selectActiveProjectV01(personalScopeWriter, {
        workspace_id: manifest.workspace_id,
        project_id: projectB.project.project_id,
        expected_project_id: activeA.project_id,
        expected_revision: activeA.selection_revision,
        now: "2026-08-02T00:00:02.000Z",
      });
      assert.equal(
        readActiveProjectSelectionV01(
          personalScopeWriter,
          manifest.workspace_id,
        )?.project_id,
        projectB.project.project_id,
      );
      record("mixed_project_open_mutation_succeeded");
      record("mixed_project_active_readback_confirmed");
      const excludedB = mutateProjectControlV01(
        personalScopeWriter,
        {
          workspace_id: manifest.workspace_id,
          project_id: projectB.project.project_id,
          action: "exclude_personal_perspective",
          expected_active_project_id: projectB.project.project_id,
          expected_active_selection_revision: activeB.selection_revision,
          expected_control_revision: null,
        },
        { now: () => "2026-08-02T00:00:03.000Z" },
      ).personal_perspective;
      assert.equal(excludedB?.status, "excluded");
      assert.equal(excludedB?.effectively_included, false);
      assert.equal(
        readPersonalPerspectiveEffectiveScopeV01(personalScopeWriter, {
          workspace_id: manifest.workspace_id,
          project_id: projectB.project.project_id,
        }).status,
        "excluded",
      );
      record("mixed_project_detail_reloaded_after_activation");
      assert.equal(
        personalScopeWriter
          .prepare(
            `SELECT COUNT(*) AS count
             FROM vnext_core_records
             WHERE workspace_id = ? AND project_id = ?`,
          )
          .get(manifest.workspace_id, projectB.project.project_id).count,
        0,
      );
      record("mixed_unapplied_candidate_loses_current_session_actionability");
      selectActiveProjectV01(personalScopeWriter, {
        workspace_id: manifest.workspace_id,
        project_id: manifest.project_id,
        expected_project_id: projectB.project.project_id,
        expected_revision: activeB.selection_revision,
        now: "2026-08-02T00:00:04.000Z",
      });
      assert.equal(
        readActiveProjectSelectionV01(
          personalScopeWriter,
          manifest.workspace_id,
        )?.project_id,
        manifest.project_id,
      );
      assert.equal(
        readPersonalPerspectiveEffectiveScopeV01(personalScopeWriter, {
          workspace_id: manifest.workspace_id,
          project_id: manifest.project_id,
        }).effectively_included,
        false,
      );
      assert.equal(
        personalScopeWriter
          .prepare(
            `SELECT COUNT(*) AS count
             FROM vnext_core_records
             WHERE workspace_id = ? AND project_id = ?`,
          )
          .get(manifest.workspace_id, manifest.project_id).count > 0,
        true,
      );
      result.positive_and_mixed_projects_remain_isolated = true;
      record("positive_project_active_snapshot_read");
      record("positive_and_mixed_projects_remain_isolated");
      record("mixed_return_relationships_rebuilt_without_positive_leak");
      result.personal_perspective_project_b_excluded = true;
    } finally {
      personalScopeWriter.close();
    }
    await navigate(
      `${appOrigin}/projects/${encodeURIComponent(manifest.project_id)}`,
    );
    await waitForCondition(`document.readyState === 'complete'`, "Personal Perspective route ready");
    const perspectiveProjectHomeShape = await evaluateJson(`(() => ({
      pathname: location.pathname,
      blank_state_count: document.querySelectorAll('[data-blank-state="v0.1"]').length,
      not_found_count: document.querySelectorAll('[data-project-not-found]').length,
      body_text: (document.body.textContent ?? '').replace(/\\s+/g, ' ').trim().slice(0, 240),
      main_data_attributes: Array.from(document.querySelectorAll('main')).map((entry) =>
        Array.from(entry.attributes).filter((attribute) => attribute.name.startsWith('data-')).map((attribute) => attribute.name)
      ),
    }))()`);
    assert.equal(
      perspectiveProjectHomeShape.blank_state_count,
      1,
      `Personal Perspective source Project Home missing: ${JSON.stringify(perspectiveProjectHomeShape)}`,
    );
    if (
      !(await evaluateBoolean(
        `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null`,
      ))
    ) {
      await waitForCondition(
        `document.querySelector('[data-blank-state-primary-action="make_active"]:not(:disabled)') !== null`,
        "Personal Perspective source activation ready",
      );
      await clickSelector('[data-blank-state-primary-action="make_active"]');
      await waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null`,
        "active Personal Perspective source Project Home",
      );
    }
    await openBlankStateProjectOptions();
    await waitForCondition(
      `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
      "hydrated Personal Perspective source controls",
    );
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
      const includedScopeDatabase = new Database(databasePath, {
        readonly: true,
        fileMustExist: true,
      });
      try {
        const includedScope = readPersonalPerspectiveEffectiveScopeV01(
          includedScopeDatabase,
          {
            workspace_id: manifest.workspace_id,
            project_id: manifest.project_id,
          },
        );
        assert.equal(includedScope.status, "included");
        assert.equal(includedScope.effectively_included, true);
      } finally {
        includedScopeDatabase.close();
      }
      result.personal_perspective_included = true;
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

  database ??= new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  await runPhase("final_r8_portability_reconciliation", async () => {
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
    const importedControlDatabase = new Database(importedDatabasePath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      const importedRoot = importedControlDatabase
        .prepare(
          `SELECT normalized_root
           FROM vnext_project_root_bindings
           WHERE workspace_id = ? AND project_id = ?`,
        )
        .get(manifest.workspace_id, manifest.project_id);
      assert(importedRoot, "imported canonical project root binding missing");
      assert.equal(typeof importedRoot.normalized_root, "string");
      assert.equal(importedRoot.normalized_root.length > 0, true);
      const importedAutomationRows = importedControlDatabase
        .prepare(
          `SELECT enabled, paused, revision
           FROM vnext_project_automation_controls
           WHERE workspace_id = ? AND project_id = ?`,
        )
        .all(manifest.workspace_id, manifest.project_id);
      assert.deepEqual(importedAutomationRows, []);
      const importedPersonalRows = importedControlDatabase
        .prepare(
          `SELECT selection, revision
           FROM vnext_project_personal_perspective_scopes
           WHERE workspace_id = ? AND project_id = ?`,
        )
        .all(manifest.workspace_id, manifest.project_id);
      assert.deepEqual(importedPersonalRows, []);
      result.minimum_project_home_restart_root_resolution = true;
      result.project_automation_restart_persisted = true;
      result.project_controls_restart_persisted = true;
    } finally {
      importedControlDatabase.close();
    }
    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review="v0.1"]') !== null && document.body.textContent.includes('Review')`,
      "imported Semantic Workbench reader",
    );
    result.imported_workbench_reader_verified = true;
    bootstrapToken = await issueBootstrap(importedRuntimeEnvironment);
    const importedSessionAdmission = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/operator/session', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bootstrap',
          bootstrap_token: ${JSON.stringify(bootstrapToken)}
        })
      });
      const body = await response.json();
      return { status: response.status, result: body.status ?? null };
    })()`);
    assert.deepEqual(importedSessionAdmission, {
      status: 200,
      result: "authenticated",
    });
    assert.equal(
      await evaluateBoolean(
        `document.documentElement.innerHTML.includes(${JSON.stringify(bootstrapToken)})`,
      ),
      false,
    );
    assert.equal(serverLog.includes(bootstrapToken), false);
    bootstrapToken = null;
    const importedProposalPath = `/workbench/semantic-review/${manifest.proposal_id.replace(":", "~")}`;
    await navigate(`${appOrigin}${importedProposalPath}`);
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null && document.querySelector('[data-vnext-transition-status="applied"]') !== null`,
      "imported applied proposal remains visible after restart",
    );
    record("mixed_applied_candidate_survives_session_restart");
    record("mixed_prior_session_decision_remains_visible");
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
  });
  assert.equal(result.personal_perspective_shared_inspector_exact, true);
  completeContinuityDetailedFields();

  await waitForRequestQuiet();
  timing.milestone("final global request quiet observed");
  assert.equal(expectedRefusalAccountingActive, false);
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
  const isExpectedImportedDestinationSessionRefusal = (entry) => {
    if (
      entry.phase !== "final_r8_portability_reconciliation" ||
      (entry.path !== "/api/vnext/operator/session" &&
        entry.path !== "/api/vnext/operator/semantic-review")
    ) {
      return false;
    }
    const statusMatch = entry.text.match(/\b(401|404)\b/u);
    if (!statusMatch) return false;
    const status = Number(statusMatch[1]);
    if (entry.path === "/api/vnext/operator/semantic-review" && status !== 401) {
      return false;
    }
    const matchingResponses = responses.filter(
      (response) =>
        response.phase === entry.phase &&
        response.path === entry.path &&
        response.method === "GET" &&
        response.status === status,
    );
    const matchingDeliveries = consoleErrors.filter(
      (candidate) =>
        candidate.phase === entry.phase &&
        candidate.path === entry.path &&
        candidate.text.match(/\b(401|404)\b/u)?.[1] === statusMatch[1],
    );
    return matchingResponses.length === 1 && matchingDeliveries.length === 1;
  };
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
  const unexpectedConsoleErrors =
    unexpectedConsoleErrorsForExpectedRefusals({
      rawConsoleErrors: consoleErrors,
      accounting: expectedRefusalAccounting,
      isOtherExpected: (entry) =>
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
        (entry.phase === "folder_onboarding" &&
          entry.path?.startsWith("/api/vnext/operator/") &&
          /401 \(Unauthorized\)/i.test(entry.text) &&
          responses.some(
            (response) =>
              response.phase === entry.phase &&
              response.path === entry.path &&
              response.status === 401,
          )) ||
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
          entry.text.includes("ERR_CONNECTION_REFUSED")),
    });
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
      ),
  );
  assert.deepEqual(postBootstrapMutations, []);

  result.unexpected_external_request_count = externalRequests.length;
  result.unexpected_console_error_count = unexpectedConsoleErrors.length;
  result.unexpected_console_failure_count = unexpectedConsoleErrors.length;
  result.unexpected_page_failure_count = pageErrors.length;
  result.unexpected_request_failure_count = unexpectedFailedRequests.length;
  result.provider_or_external_network_call = false;
  assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
  result.default_database_accessed = false;
  result.default_database_isolated = true;
  result.credential_private_material_boundary =
    result.credential_material_in_dom === false &&
    result.credential_material_in_server_log === false &&
    bootstrapToken === null;
}

async function buildActualCompiledPacketFixture() {
  const completed = await runCapture(
    process.execPath,
    [
      "--import",
      "tsx",
      "scripts/build-vnext-operator-browser-fixture-v0-1.ts",
      sourceFixtureDir,
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

function sha256File(filePath) {
  return `sha256:${createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex")}`;
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

async function openBlankStateProjectOptions() {
  await waitForCondition(
    `(() => {
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      const options = details.querySelector('[data-blank-state-project-options="true"]');
      return details.open && options?.getBoundingClientRect().width > 0;
    })()`,
    "visible Blank State project options",
  );
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
    const rawConsoleIndex =
      (event.method === "Runtime.consoleAPICalled" &&
        event.params?.type === "error") ||
      (event.method === "Log.entryAdded" &&
        event.params?.entry?.level === "error")
        ? consoleErrors.length
        : null;
    observeExpectedRefusalCdpEvent(event, { rawConsoleIndex });
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
      const requestId = String(event.params?.requestId ?? "");
      requestMethods.set(requestId, method);
      requests.push({
        request_id: requestId,
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
      return;
    }
    if (event.method === "Network.loadingFailed") {
      requestMethods.delete(String(event.params?.requestId ?? ""));
      if (String(event.params?.type ?? "") === "WebSocket") return;
      failedRequests.push({
        phase: currentPhase,
        error_text: String(event.params?.errorText ?? "request_failed"),
      });
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

function observeExpectedRefusalCdpEvent(
  event,
  { rawConsoleIndex = null } = {},
) {
  const method = String(event.method ?? "");
  if (/^(Network|Log|Runtime)\./u.test(method)) {
    lastObserverActivityAt = Date.now();
  }
  if (
    ![
      "Network.requestWillBeSent",
      "Network.responseReceived",
      "Network.loadingFinished",
      "Network.loadingFailed",
      "Log.entryAdded",
      "Runtime.consoleAPICalled",
    ].includes(method)
  ) {
    return;
  }
  expectedRefusalObserverSequence += 1;

  const requestId =
    typeof event.params?.requestId === "string"
      ? event.params.requestId
      : null;
  const logEntry = event.params?.entry ?? null;
  const logNetworkRequestId =
    typeof logEntry?.networkRequestId === "string"
      ? logEntry.networkRequestId
      : null;
  const request = event.params?.request ?? null;
  const response = event.params?.response ?? null;
  const eventUrl = String(
    request?.url ?? response?.url ?? logEntry?.url ?? "",
  );
  const eventPath = classifyUrl(eventUrl).path;
  const lifecycleRequestId = requestId ?? logNetworkRequestId;
  let lifecycle = lifecycleRequestId
    ? expectedRefusalRequestLifecycles.get(lifecycleRequestId) ?? null
    : null;

  if (
    method === "Network.requestWillBeSent" &&
    requestId &&
    eventPath === "/api/vnext/operator/session"
  ) {
    lifecycle = {
      request_id: requestId,
      method: String(request?.method ?? "GET").toUpperCase(),
      url: eventUrl,
      path: eventPath,
      status: null,
      phase_started: currentPhase,
    };
    expectedRefusalRequestLifecycles.set(requestId, lifecycle);
  } else if (method === "Network.responseReceived" && lifecycle) {
    lifecycle.status = Number(response?.status ?? 0);
  }

  const path = eventPath ?? lifecycle?.path ?? null;
  const isSessionLifecycle =
    path === "/api/vnext/operator/session" ||
    lifecycle?.path === "/api/vnext/operator/session";
  const isRelevantConsole =
    (method === "Runtime.consoleAPICalled" &&
      event.params?.type === "error") ||
    (method === "Log.entryAdded" && logEntry?.level === "error");
  const isRelevantNetworkError =
    method === "Network.responseReceived" &&
    Number(response?.status ?? 0) >= 400 &&
    expectedRefusalAccountingPhases.has(currentPhase);
  if (
    !expectedRefusalAccountingActive ||
    (!isSessionLifecycle &&
      !isRelevantConsole &&
      !isRelevantNetworkError)
  ) {
    return;
  }

  const rawText =
    method === "Log.entryAdded"
      ? String(logEntry?.text ?? "")
      : method === "Runtime.consoleAPICalled"
        ? (event.params?.args ?? [])
            .map((argument) =>
              String(argument.value ?? argument.description ?? ""),
            )
            .join(" ")
        : null;
  expectedRefusalAccounting.observe({
    sequence: expectedRefusalObserverSequence,
    observer_channel: method.split(".", 1)[0] ?? null,
    event_name: method,
    request_id: requestId,
    log_network_request_id: logNetworkRequestId,
    cdp_timestamp:
      event.params?.timestamp ?? logEntry?.timestamp ?? null,
    observation_monotonic_ms: Number(
      (process.hrtime.bigint() - expectedRefusalObserverStartedAt) /
        1_000_000n,
    ),
    method:
      method === "Network.requestWillBeSent"
        ? String(request?.method ?? "GET").toUpperCase()
        : lifecycle?.method ?? null,
    status:
      method === "Network.responseReceived"
        ? Number(response?.status ?? 0)
        : lifecycle?.status ?? null,
    url: eventUrl || lifecycle?.url || null,
    path,
    phase_started: lifecycle?.phase_started ?? null,
    phase_observed: currentPhase,
    raw_text: rawText,
    raw_console_index: rawConsoleIndex,
    event_fingerprint: createHash("sha256")
      .update(JSON.stringify(event))
      .digest("hex"),
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
      `Browser evaluation failed: ${
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

async function waitForRequestQuiet() {
  requestQuietCount += 1;
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    if (Date.now() - lastObserverActivityAt >= REQUEST_QUIET_MS) {
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
  timing.milestone("next runtime listener is loopback only");
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
  completionOwner.recordMarker(id);
  assertions.push(id);
}

function completeDetailedField(id) {
  completionOwner.completeField(id);
}

function completeContinuityDetailedFields() {
  for (const id of detailedFieldContract.field_ids) {
    assert.equal(result[id], true, `${id} must be proven before completion`);
    completeDetailedField(id);
  }
}

function safeError(error) {
  if (!(error instanceof Error)) return "unknown_browser_validation_failure";
  const frame = error.stack
    ?.split("\n")
    .find((line) => line.includes("browser-validate-continuity-v1.mjs:"))
    ?.replace(/^.*?(scripts\/browser-validate-continuity-v1\.mjs:\d+:\d+).*$/u, "$1");
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
