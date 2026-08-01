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
import { readPersonalPerspectiveEffectiveScopeV01 } from "../lib/vnext/persistence/project-control-store.ts";
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

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 = 64;

const VALIDATION_VERSION =
  "vnext_native_host_result_browser_validation.v0.1";
const VALIDATION_SCOPE =
  process.env.AUGNES_BROWSER_E2E_SCOPE?.trim() || "complete";
assert(
  ["complete", "core", "continuity", "cux6b"].includes(VALIDATION_SCOPE),
  "unsupported browser E2E validation scope",
);
const RUN_CUX6B_ONLY = VALIDATION_SCOPE === "cux6b";
const RUN_CORE_SCOPE = VALIDATION_SCOPE !== "continuity";
const RUN_CONTINUITY_SCOPE =
  VALIDATION_SCOPE !== "core" && !RUN_CUX6B_ONLY;
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
const POSITIVE_LOCKED_SESSION_REFUSAL_TOKEN =
  "expected:positive-project-missing-session";
const STALE_MIXED_SESSION_REFUSAL_TOKEN =
  "expected:mixed-project-stale-session";
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
let lastObserverActivityAt = Date.now();
let serverLog = "";
let pausedSemanticTransitionRequest = null;
let interceptedInspectorResponse = null;
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
  selected_work_timeline_first: false,
  selected_work_timeline_state_coverage: [],
  selected_work_timeline_candidate_switching: false,
  guide_brief_same_candidate_material_reset: false,
  guide_brief_highlighted_relationship_agreement: false,
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
  folder_picker_cancelled_usable: false,
  folder_onboarding_destination: null,
  first_work_setup_state: false,
  first_work_locked_operator_state: false,
  first_work_composer_validation: false,
  first_work_saved_without_execution: false,
  first_work_goal_cross_surface: false,
  first_work_reload_persisted: false,
  first_work_start_eligible: false,
  first_work_explicit_start_admitted: false,
  first_work_browser_viewports: false,
  project_context_repeat_activation: false,
  project_context_keyboard_activation: false,
  project_context_emphasized_owner: false,
  project_recovery_context_passive: false,
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
  expected_refusal_accounting_complete: false,
  expected_stale_session_refusal_response_count: 0,
  expected_stale_session_refusal_log_count: 0,
  expected_refusal_duplicate_delivery_count: 0,
  authenticated_session_recovery_response_count: 0,
  expected_refusal_accounting_summary: null,
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
  let firstProjectId = null;
  let onboardingEditedProjectName = null;
  let validateExactLaterOutcomeV01 = null;
  let mixedReturnTarget = null;
  // Continuity intentionally skips the core-owned bounded-automation UI that
  // captures this exclusion identity. Keep its assertion exact by binding the
  // transferred fixture's deterministic generic validation proposal instead.
  let mixedGenericValidationProposalId =
    RUN_CONTINUITY_SCOPE && !RUN_CORE_SCOPE
      ? manifest.strategic_source_proposal_id
      : null;
  let mixedBoundedAutomationPacketTarget = null;
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

  if (RUN_CORE_SCOPE) {
  await runPhase("folder_onboarding", async () => {
    const noProjectUtilityRequestStart = requests.length;
    await navigate(`${appOrigin}/`);
    await waitForCondition(`location.pathname === '/' && document.querySelector('[data-blank-state="v0.1"][data-blank-state-focus="no_projects"][data-guide-brief-version="guide_brief.v0.2"][data-guide-brief-source-status="project_choice"]') !== null`, "no-project GuideBrief-backed Blank State");
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelectorAll('[data-blank-state-primary-action]').length === 1`,
      "single project-selection action",
    );
    const onboardingComposition = await evaluateJson(`(() => {
      const home = document.querySelector('[data-blank-state="v0.1"]');
      const launcher = document.querySelector(
        '[data-continuities-guidebrief-launcher="true"]'
      );
      return {
        presentation: home?.getAttribute('data-blank-state-presentation'),
        title: home?.querySelector('h1')?.textContent?.trim(),
        tagline: home?.querySelector('.continuities-tagline')?.textContent?.trim(),
        onboarding_title:
          home?.querySelector('#project-management-title')?.textContent?.trim(),
        onboarding_copy:
          home?.querySelector('#local-project-onboarding-description')?.textContent?.replace(/\\s+/g, ' ').trim(),
        supporting_copy:
          home?.querySelector('#local-project-onboarding-support')?.textContent?.replace(/\\s+/g, ' ').trim(),
        choose_label:
          home?.querySelector('[data-blank-state-primary-action="choose_folder"]')?.textContent?.trim(),
        search_absent:
          home?.querySelector('[data-continuities-filter="shown-items"]') === null,
        stream_absent:
          home?.querySelector('[data-blank-state-continuity-list]') === null,
        temporal_absent:
          home?.querySelector('[data-continuities-temporal-context]') === null,
        recommendation_absent:
          !home?.innerText.includes('Recommended next'),
        launcher_outside_main: Boolean(launcher) && !home?.contains(launcher),
        launcher_in_rail:
          launcher?.closest('.product-navigation-rail') !== null,
        launcher_outside_primary_navigation:
          launcher?.closest('nav[aria-label="Primary navigation"]') === null,
      };
    })()`);
    assert.deepEqual(onboardingComposition, {
      presentation: "local_project_onboarding",
      title: "Continuities",
      tagline: "Work and perspective you carry forward.",
      onboarding_title: "Open a local project folder",
      onboarding_copy:
        "Select an existing folder on this computer. Augnes links it as the local project root; this step does not upload the folder.",
      supporting_copy: "Use a regular folder or a Git repository.",
      choose_label: "Choose a folder",
      search_absent: true,
      stream_absent: true,
      temporal_absent: true,
      recommendation_absent: true,
      launcher_outside_main: true,
      launcher_in_rail: true,
      launcher_outside_primary_navigation: true,
    });
    await validateBlankStateViewports(false, {
      state: "no-project-onboarding",
      attentionCount: 0,
      attentionCategory: "none",
      primaryActions: 1,
    });
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-management-safety], [data-blank-state-project-settings-recovery]') === null`,
      ),
      true,
    );
    const noProjectUtilityRequests = requests
      .slice(noProjectUtilityRequestStart)
      .filter((request) =>
        request.path === "/api/vnext/portability" ||
        request.path === "/api/recovery"
      );
    assert.deepEqual(noProjectUtilityRequests, []);
    assert.equal(
      await evaluateBoolean(`(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        return inputs.length === 1 &&
          inputs[0]?.getAttribute('name') === 'guidebrief-question';
      })()`),
      true,
    );
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
    onboardingEditedProjectName = "처음 이어지는 Browser Onboarding Project";
    assert.equal(
      await evaluateString(`document.querySelector('input[name="project-display-name"]')?.value ?? ''`),
      "Browser Onboarding Project",
      "new-project name must be prefilled from the inspected basename",
    );
    assert.equal(
      await evaluateBoolean(`document.body.textContent.includes('The Augnes project name does not rename the local folder.') && document.body.textContent.includes(${JSON.stringify(onboardingFolder)})`),
      true,
    );
    await setFormControlValue('input[name="project-display-name"]', 0, "");
    await waitForCondition(
      `document.querySelector('[data-blank-state-primary-action="confirm_folder"]')?.disabled === true && document.body.textContent.includes('Enter a project name.')`,
      "invalid onboarding name blocks confirmation",
    );
    await setFormControlValue(
      'input[name="project-display-name"]',
      0,
      onboardingEditedProjectName,
    );
    await waitForCondition(
      `document.querySelector('input[name="project-display-name"]')?.value === ${JSON.stringify(onboardingEditedProjectName)} && document.querySelector('[data-blank-state-primary-action="confirm_folder"]:not(:disabled)')?.textContent?.trim() === 'Add project'`,
      "edited project name before Add project",
    );
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Add project'); button?.click(); return Boolean(button); })()`), true);
    await waitForCondition(`location.pathname.startsWith('/projects/project%3A') || location.pathname.startsWith('/projects/project:')`, "stable project destination");
    const destination = await evaluateString("location.pathname");
    firstProjectId = decodeURIComponent(destination.split("/").at(-1));
    result.folder_onboarding_destination = destination;
    await waitForCondition(`document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-focus="first_work_not_defined"]') !== null`, "active first-work setup destination");
    await waitForCondition(
      `document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes(${JSON.stringify(onboardingEditedProjectName)}) === true`,
      "edited onboarding name reaches ProductShell",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === false`,
      ),
      true,
      "project settings must remain closed by default",
    );
    assert.equal(await evaluateBoolean(`(() => {
      const link = document.querySelector('a[data-project-context-label="Current project"]');
      if (!(link instanceof HTMLAnchorElement)) return false;
      link.click();
      return true;
    })()`), true);
    await waitForCondition(
      `location.hash === '#project-settings' && (() => {
        const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
        const input = details?.querySelector('input[name="current-project-display-name"]');
        return details?.open === true && [details.querySelector(':scope > summary'), input].includes(document.activeElement);
      })()`,
      "current-project context opens and focuses project settings",
    );
    assert.equal(await evaluateBoolean(`(() => {
      const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
      if (!(details instanceof HTMLDetailsElement) || location.hash !== '#project-settings') return false;
      details.open = false;
      const link = document.querySelector('a[data-project-context-label="Current project"]');
      if (!(link instanceof HTMLAnchorElement)) return false;
      link.focus();
      return document.activeElement === link && location.hash === '#project-settings';
    })()`), true);
    await dispatchKeyboardKey("Enter", "Enter", 13);
    await waitForCondition(
      `location.hash === '#project-settings' && (() => {
        const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
        const input = details?.querySelector('input[name="current-project-display-name"]');
        return details?.open === true && [details.querySelector(':scope > summary'), input].includes(document.activeElement);
      })()`,
      "same-hash keyboard activation reopens and refocuses project settings",
    );
    result.project_context_repeat_activation = true;
    result.project_context_keyboard_activation = true;
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('[data-project-identity-management="true"]') !== null && document.querySelector('input[name="current-project-display-name"]')?.value === ${JSON.stringify(onboardingEditedProjectName)} && document.querySelector('[data-project-name-save="true"]')?.disabled === true && document.body.textContent.includes('Renaming the Augnes project does not rename the local folder.')`,
      ),
      true,
    );
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      0,
      "",
    );
    await waitForCondition(
      `document.querySelector('[data-project-name-save="true"]')?.disabled === true && document.body.textContent.includes('Enter a project name.')`,
      "invalid rename remains disabled",
    );
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      0,
      onboardingEditedProjectName,
    );
    const staleRenameSnapshot = await evaluateJson(`(async () => {
      const recent = await (await fetch('/api/vnext/projects')).json();
      const active = recent.recent_projects.find((entry) => entry.is_active);
      const response = await fetch('/api/vnext/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          project_id: active.project.project_id,
          expected_active_project_id: active.active_project_id,
          expected_active_selection_revision: active.active_selection_revision,
          expected_current_display_name: active.project.display_name,
          requested_display_name: 'Stale rename source'
        })
      });
      return { status: response.status, active };
    })()`);
    assert.equal(staleRenameSnapshot.status, 200);
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      0,
      "Stale UI rename",
    );
    assert.equal(await evaluateBoolean(`(() => {
      const save = document.querySelector('[data-project-name-save="true"]');
      if (!(save instanceof HTMLButtonElement) || save.disabled) return false;
      save.click();
      return true;
    })()`), true);
    await waitForCondition(
      `document.body.textContent.includes('The project name changed in another view. Refresh and try again.')`,
      "stale rename conflict is public and actionable",
    );
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelector('input[name="current-project-display-name"]')?.value === 'Stale rename source'`,
      "stale rename source refresh",
    );
    const longKoreanProjectName = `장기 연속성 프로젝트 ${"가".repeat(72)} English continuity`;
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      0,
      longKoreanProjectName,
    );
    await waitForCondition(
      `document.querySelector('input[name="current-project-display-name"]')?.value === ${JSON.stringify(longKoreanProjectName)} && document.querySelector('[data-project-name-save="true"]')?.disabled === false`,
      "long Korean project name is ready to save",
    );
    assert.equal(await evaluateBoolean(`(() => {
      const save = document.querySelector('[data-project-name-save="true"]');
      if (!(save instanceof HTMLButtonElement) || save.disabled) return false;
      save.click();
      return true;
    })()`), true);
    await waitForCondition(
      `location.hash === '#project-settings' && document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null && document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes(${JSON.stringify(longKoreanProjectName)}) === true && Array.from(document.querySelectorAll('.recent-project-list strong')).some((entry) => entry.textContent?.trim() === ${JSON.stringify(longKoreanProjectName)})`,
      "successful long Korean project rename",
    );
    const recentAfterLongRename = await evaluateJson(`(async () => await (await fetch('/api/vnext/projects')).json())()`);
    assert.equal(
      recentAfterLongRename.recent_projects.find((entry) => entry.is_active)?.project.display_name,
      longKoreanProjectName,
    );
    assert.equal(
      recentAfterLongRename.recent_projects.find((entry) => entry.is_active)?.local_root.normalized_path,
      onboardingFolder,
      "rename must not change the local root",
    );
    await setFormControlValue(
      'input[name="current-project-display-name"]',
      0,
      "Browser Onboarding Project",
    );
    await waitForCondition(
      `document.querySelector('input[name="current-project-display-name"]')?.value === 'Browser Onboarding Project' && document.querySelector('[data-project-name-save="true"]')?.disabled === false`,
      "restored project name is ready to save",
    );
    assert.equal(await evaluateBoolean(`(() => {
      const save = document.querySelector('[data-project-name-save="true"]');
      if (!(save instanceof HTMLButtonElement) || save.disabled) return false;
      save.click();
      return true;
    })()`), true);
    await waitForCondition(
      `document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes('Browser Onboarding Project') === true && document.querySelector('input[name="current-project-display-name"]')?.value === 'Browser Onboarding Project'`,
      "project name restored for retained lifecycle coverage",
    );
    await evaluateBoolean(`(() => {
      const details = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
      if (details instanceof HTMLDetailsElement) details.open = false;
      history.replaceState(null, '', location.pathname);
      return true;
    })()`);
    result.project_name_onboarding_prefill_and_edit = true;
    result.project_name_invalid_blocked = true;
    result.project_name_stale_conflict_visible = true;
    result.project_name_long_korean_propagated = true;
    result.project_context_opens_settings = true;
    if (RUN_CUX6B_ONLY) {
      await validateBlankStateViewports(true, {
        state: "first-work-not-defined",
        attentionCount: 0,
        attentionCategory: "none",
        primaryActions: 1,
        verifyConversationReload: true,
      });
    }
    const emptyProjectHome = await evaluateJson(`(() => {
      const surface = document.querySelector('[data-blank-state="v0.1"]');
      const visibleText = surface?.innerText ?? '';
      return {
        name:
          document.querySelector('[data-project-context-label="Current project"]')?.textContent?.includes('Browser Onboarding Project') === true,
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
          document.querySelector('details[data-blank-state-project-settings-recovery="true"]')?.open === false,
        management_safety_context:
          document.querySelector('[data-management-safety]')?.getAttribute('data-management-safety-project-context') ?? null
      };
    })()`);
    assert.deepEqual(emptyProjectHome, {
      name: true,
      heading: "Continuities",
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
      focus: "first_work_not_defined",
      browser_focus: "first_work_not_defined",
      authority: false,
      private_path_absent: true,
      credential_absent: true,
    });

    const firstWorkGoal =
      "새 프로젝트의 첫 작업 목표를 실제 소스와 검증 결과에 맞춰 완성하고 English success criteria와 사용자 권한 경계를 함께 보존한다. ".repeat(2).trim();
    const firstWorkCriteria = [
      "Continuities와 AI Workplane이 저장된 실제 목표를 동일하게 보여 준다.",
      "Saving the definition creates no run and explicit Start Codex work remains separate.",
    ];
    const firstWorkNonGoals = [
      "프로젝트 파일 자동 변경",
      "Automatic provider or model selection",
    ];
    const firstWorkCoreBefore = readFirstWorkBrowserState(firstProjectId);
    assert.deepEqual(firstWorkCoreBefore, {
      packets: 0,
      receipts: 0,
      proposals: 0,
      decisions: 0,
      transitions: 0,
      semantic_state: 0,
      runs: 0,
    });
    result.first_work_setup_state = true;

    if (RUN_CUX6B_ONLY) {
    await navigate("about:blank");
    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    const firstWorkStrategicFixtureHoldPath = path.join(
      tempRoot,
      "strategic-model-transport-fixture-v0-1.first-work-disabled",
    );
    renameSync(
      strategicTransportFixturePath,
      firstWorkStrategicFixtureHoldPath,
    );
    runtimeEnvironment.AUGNES_VNEXT_OPERATOR_PROJECT_ID = firstProjectId;
    startDevServer(runtimeEnvironment);
    await waitForHttp(`${appOrigin}/workbench/semantic-review`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/workbench/semantic-review#first-work`);
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="locked"]') !== null && document.querySelector('[data-first-work-composer]') === null`,
      "locked first-work operator state",
    );
    result.first_work_locked_operator_state = true;

    bootstrapToken = await issueBootstrap(runtimeEnvironment);
    await setBootstrapInput(bootstrapToken);
    await waitForCondition(
      `document.querySelector('#vnext-operator-bootstrap-token')?.value.length > 0 && !document.querySelector('#vnext-operator-bootstrap-token')?.closest('form')?.querySelector('button[type="submit"]')?.disabled`,
      "enabled first-work bootstrap submit control",
    );
    const firstWorkBootstrapResponseStart = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const form = document.querySelector('#vnext-operator-bootstrap-token')?.closest('form');
        if (!(form instanceof HTMLFormElement)) return false;
        form.requestSubmit();
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(firstWorkBootstrapResponseStart).some(
        (entry) =>
          entry.path === "/api/vnext/operator/session" &&
          entry.method === "POST",
      ),
      "first-work bootstrap response",
    );
    const firstWorkBootstrapResponse = responses
      .slice(firstWorkBootstrapResponseStart)
      .find(
        (entry) =>
          entry.path === "/api/vnext/operator/session" &&
          entry.method === "POST",
      );
    assert.equal(
      firstWorkBootstrapResponse?.status,
      200,
      `first-work bootstrap refused with status ${firstWorkBootstrapResponse?.status ?? "missing"}`,
    );
    await waitForCondition(
      `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
      "authenticated first-work operator session",
    );
    const firstWorkAuthenticatedRead = await evaluateJson(`(async () => {
      const [continuityResponse, reviewResponse] = await Promise.all([
        fetch('/api/vnext/operator/project-continuity', { cache: 'no-store' }),
        fetch('/api/vnext/operator/semantic-review', { cache: 'no-store' }),
      ]);
      const continuityText = await continuityResponse.text();
      const reviewText = await reviewResponse.text();
      const parse = (value) => {
        try { return JSON.parse(value); } catch { return null; }
      };
      const continuity = parse(continuityText);
      const review = parse(reviewText);
      if (!review) {
        const errorIndex = reviewText.search(/(?:Error|ReferenceError|TypeError):/u);
        throw new Error(
          'semantic-review read failed status=' + reviewResponse.status +
          ' body=' + reviewText.slice(
            errorIndex >= 0 ? errorIndex : 0,
            (errorIndex >= 0 ? errorIndex : 0) + 2200,
          )
        );
      }
      return {
        continuity_status: continuityResponse.status,
        continuity_state: continuity.work_initialization?.state ?? null,
        continuity_project: continuity.project?.project_id ?? null,
        review_status: reviewResponse.status,
        review_state: review?.work_initialization?.state ??
          review?.view?.work_initialization?.state ??
          review?.project_continuity?.work_initialization?.state ?? null,
        review_preview: review ? null : reviewText.slice(0, 240),
        composer_present: document.querySelector('[data-first-work-composer]') !== null,
        visible_error: document.querySelector('[role="alert"]')?.textContent?.trim() ?? null,
      };
    })()`);
    assert.deepEqual(firstWorkAuthenticatedRead, {
      continuity_status: 200,
      continuity_state: "not_defined",
      continuity_project: firstProjectId,
      review_status: 200,
      review_state: "not_defined",
      review_preview: null,
      composer_present: true,
      visible_error: null,
    });
    await waitForCondition(
      `document.querySelector('[data-first-work-composer="project_work_initialization.v0.1"][data-first-work-state="not_defined"]') !== null`,
      "authenticated first-work composer",
    );
    await waitForCondition(
      `document.activeElement?.id === 'first-work-goal'`,
      "first-work goal focus",
    );
    bootstrapToken = null;
    assert.equal(
      await evaluateBoolean(`document.querySelector('[data-first-work-action="save"]')?.disabled === true`),
      true,
      "empty first-work definition must not be saveable",
    );
    await setFormControlValue('textarea[name="first-work-goal"]', 0, firstWorkGoal);
    await waitForCondition(
      `document.body.textContent.includes('Add at least one success criterion.') && document.querySelector('[data-first-work-action="save"]')?.disabled === true`,
      "missing first-work success criteria",
    );
    await setFormControlValue('textarea[name="first-work-goal"]', 0, "");
    await setFormControlValue(
      'textarea[name="first-work-success-criteria"]',
      0,
      firstWorkCriteria.join("\n"),
    );
    await waitForCondition(
      `document.body.textContent.includes('Enter the project goal before saving.') && document.querySelector('[data-first-work-action="save"]')?.disabled === true`,
      "missing first-work goal",
    );
    await setFormControlValue('textarea[name="first-work-goal"]', 0, firstWorkGoal);
    await setFormControlValue(
      'textarea[name="first-work-non-goals"]',
      0,
      firstWorkNonGoals.join("\n"),
    );
    await waitForCondition(
      `document.querySelector('[data-first-work-action="save"]:not(:disabled)') !== null`,
      "valid Korean and English first-work definition",
    );
    await validateFirstWorkComposerViewports();
    assert.equal(
      await evaluateBoolean(`(() => {
        const goal = document.querySelector('textarea[name="first-work-goal"]');
        const criteria = document.querySelector('textarea[name="first-work-success-criteria"]');
        const nonGoals = document.querySelector('textarea[name="first-work-non-goals"]');
        const save = document.querySelector('[data-first-work-action="save"]');
        return [goal, criteria, nonGoals, save].every((control) => control instanceof HTMLElement) &&
          goal.compareDocumentPosition(criteria) & Node.DOCUMENT_POSITION_FOLLOWING &&
          criteria.compareDocumentPosition(nonGoals) & Node.DOCUMENT_POSITION_FOLLOWING &&
          nonGoals.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING;
      })()`),
      true,
      "first-work keyboard order follows goal, criteria, non-goals, save",
    );
    result.first_work_composer_validation = true;

    const firstWorkResponseStart = responses.length;
    const firstWorkRequestStart = requests.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const form = document.querySelector('[data-first-work-composer] form');
        if (!(form instanceof HTMLFormElement)) return false;
        form.requestSubmit();
        form.requestSubmit();
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(firstWorkResponseStart).some(
        (entry) =>
          entry.path === "/api/vnext/operator/project-continuity" &&
          entry.method === "POST" &&
          entry.status === 201,
      ),
      "first-work save response",
    );
    const firstWorkResponse = responses.slice(firstWorkResponseStart).find(
      (entry) =>
        entry.path === "/api/vnext/operator/project-continuity" &&
        entry.method === "POST",
    );
    assert(firstWorkResponse, "The first-work mutation response was not observed.");
    const firstWorkResponseBody = await cdp.send("Network.getResponseBody", {
      requestId: firstWorkResponse.request_id,
    });
    const firstWorkSaved = JSON.parse(firstWorkResponseBody.body);
    assert.deepEqual(
      {
        status: firstWorkSaved.status,
        run_created: firstWorkSaved.run_created,
        execution_started: firstWorkSaved.execution_started,
        provider_called: firstWorkSaved.provider_called,
        project_files_written: firstWorkSaved.project_files_written,
        proposal_created: firstWorkSaved.proposal_created,
        review_decision_created: firstWorkSaved.review_decision_created,
        transition_created: firstWorkSaved.transition_created,
        semantic_state_changed: firstWorkSaved.semantic_state_changed,
      },
      {
        status: "inserted",
        run_created: false,
        execution_started: false,
        provider_called: false,
        project_files_written: false,
        proposal_created: false,
        review_decision_created: false,
        transition_created: false,
        semantic_state_changed: false,
      },
    );
    assert.equal(
      requests.slice(firstWorkRequestStart).filter(
        (entry) =>
          entry.path === "/api/vnext/operator/project-continuity" &&
          entry.method === "POST",
      ).length,
      1,
      "double submit must be admitted once by the existing mutation lock",
    );
    await waitForCondition(
      `document.querySelector('[data-first-work-composer]') === null && document.body.textContent.includes('First work defined. No execution has started.') && document.querySelector('[data-delegated-work-action="start"]:not(:disabled)')?.textContent?.trim() === 'Start Codex work'`,
      "first work saved without execution and separate start available",
    );
    const firstWorkCoreAfterSave = readFirstWorkBrowserState(firstProjectId);
    assert.deepEqual(firstWorkCoreAfterSave, {
      packets: 1,
      receipts: 0,
      proposals: 0,
      decisions: 0,
      transitions: 0,
      semantic_state: 0,
      runs: 0,
    });
    assert.equal(
      await evaluateBoolean(`document.querySelector('[data-delegated-work]')?.textContent?.includes(${JSON.stringify(firstWorkGoal)}) === true`),
      true,
      "AI Workplane must show the exact saved goal",
    );
    result.first_work_saved_without_execution = true;
    result.first_work_start_eligible = true;

    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null && document.querySelector('[data-first-work-composer]') === null && document.querySelector('[data-delegated-work-action="start"]:not(:disabled)') !== null && document.body.textContent.includes(${JSON.stringify(firstWorkGoal)})`,
      "first-work definition survives refresh",
    );
    result.first_work_reload_persisted = true;
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]')?.textContent?.includes(${JSON.stringify(firstWorkGoal)}) === true && document.querySelector('[data-blank-state-focus="first_work_not_defined"]') === null`,
      "Continuities shows the saved first-work goal",
    );
    const savedGuide = await evaluateJson(`(async () => {
      const body = await (await fetch('/api/augnes/read/guide-brief?scope=project%3Aaugnes', {
        headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' },
        cache: 'no-store',
      })).json();
      return {
        coordinate_goal: body.coordinate?.goal ?? null,
        chatgpt_goal: body.projections?.chatgpt?.goal ?? null,
        workplane_goal: body.projections?.ai_workplane?.current_goal ?? null,
        codex_goal: body.projections?.codex?.current_goal ?? null,
      };
    })()`);
    for (const [surface, goal] of Object.entries(savedGuide)) {
      assert.equal(
        goal,
        firstWorkGoal,
        `${surface} must preserve the exact saved first-work goal`,
      );
    }
    result.first_work_goal_cross_surface = true;

    await navigate(`${appOrigin}/workbench/semantic-review`);
    await waitForCondition(
      `document.querySelector('[data-delegated-work-action="start"]:not(:disabled)') !== null`,
      "separate first-work host start action",
    );
    const firstWorkStartResponse = responses.length;
    assert.equal(
      await evaluateBoolean(`(() => {
        const button = document.querySelector('[data-delegated-work-action="start"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await waitForHostCondition(
      () => responses.slice(firstWorkStartResponse).some(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.method === "POST" &&
          entry.status === 202,
      ),
      "initial packet live host admission",
    );
    const firstWorkLiveState = await waitForLiveRunStatus(
      firstProjectId,
      "waiting_for_approval",
      LIVE_HOST_APPROVAL_TIMEOUT_MS,
    );
    assert.equal(firstWorkLiveState.packet_lineage_kind, "initial_user_defined");
    assert.equal(firstWorkLiveState.source_transition_receipt_id, null);
    assert.match(firstWorkLiveState.first_work_definition_id, /^first-work-definition:/u);
    await waitForCondition(
      `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-action="cancel"]:not(:disabled)') !== null`,
      "initial packet start reaches admitted live state",
    );
    result.first_work_explicit_start_admitted = true;

    await navigate("about:blank");
    await cdp.send("Network.clearBrowserCookies");
    await terminateProcess(serverProcess, 15_000);
    serverProcess = null;
    removeBrowserNormalWorkRun({
      databasePath,
      runId: firstWorkLiveState.run_ref,
    });
    rmSync(browserApprovalBarrierTracePath, { force: true });
    runtimeEnvironment.AUGNES_VNEXT_OPERATOR_PROJECT_ID = manifest.project_id;
    renameSync(
      firstWorkStrategicFixtureHoldPath,
      strategicTransportFixturePath,
    );
    startDevServer(runtimeEnvironment);
    await waitForHttp(`${appOrigin}/`, DEFAULT_TIMEOUT_MS);
    await navigate(`${appOrigin}/`);
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]')?.textContent?.includes(${JSON.stringify(firstWorkGoal)}) === true`,
      "first-work goal persists after runtime restart",
    );
    result.first_work_browser_viewports = true;
    return;
    }

    const seededFirstWork = seedInitialProjectWorkForCoreV01({
      databasePath,
      manifest,
      projectId: firstProjectId,
      goal: firstWorkGoal,
      successCriteria: firstWorkCriteria,
      nonGoals: firstWorkNonGoals,
    });
    assert.equal(seededFirstWork.status, "inserted");
    assert.equal(seededFirstWork.execution_started, false);
    assert.equal(seededFirstWork.run_created, false);
    assert.equal(seededFirstWork.provider_called, false);
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]')?.textContent?.includes(${JSON.stringify(firstWorkGoal)}) === true`,
      "directly seeded first-work definition visible before retained core flow",
    );

    const cleanCurrentRunId = seedBrowserNormalWorkRun({
      databasePath,
      projectId: firstProjectId,
    });
    {
      const readableDatabase = new Database(databasePath, {
        readonly: true,
        fileMustExist: true,
      });
      try {
        assert.equal(
          readProjectRunResultOverviewV01(readableDatabase, {
            workspace_id: manifest.workspace_id,
            project_id: firstProjectId,
          }).current_run?.run_ref,
          cleanCurrentRunId,
        );
      } finally {
        readableDatabase.close();
      }
    }
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "reloaded first-work project after seeding normal work",
    );
    const seededRunSurface = await evaluateJson(`(() => ({
      focus: document.querySelector('[data-blank-state="v0.1"]')?.getAttribute('data-blank-state-focus') ?? null,
      current_run: document.querySelector('[data-current-host-run]')?.getAttribute('data-current-host-run') ?? null,
      text: document.querySelector('[data-blank-state="v0.1"]')?.textContent?.slice(0, 500) ?? null,
    }))()`);
    assert.equal(
      seededRunSurface.current_run,
      "running",
      `Seeded current run was not projected: ${JSON.stringify(seededRunSurface)}`,
    );
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
      "defined first work remains current after normal-work fixture removal",
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
      `document.querySelector('[data-blank-state="v0.1"]') !== null`,
      "expired selected working context surface reload",
    );
    const expiredContextSurface = await evaluateJson(`(() => ({
      focus: document.querySelector('[data-blank-state="v0.1"]')?.getAttribute('data-blank-state-focus') ?? null,
      text: document.querySelector('[data-blank-state="v0.1"]')?.textContent?.slice(0, 900) ?? null,
    }))()`);
    assert.equal(
      expiredContextSurface.focus,
      "work_instructions_unavailable",
      `Expired current context did not fail closed: ${JSON.stringify(expiredContextSurface)}`,
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-focus="work_instructions_unavailable"]') !== null && document.body.textContent.includes('Current work instructions are unavailable') && document.body.textContent.includes('durable work history')`,
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
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Reopen project'); button?.click(); return Boolean(button); })()`), true);
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
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === 'Add project'); button?.click(); return Boolean(button); })()`), true);
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
    const secondProjectGuideAnswer =
      await openGuideBriefConversationAndAnswerSuggestedQuestion();
    assert.equal(secondProjectGuideAnswer.answer_count, 1);

    await navigate(`${appOrigin}${destination}`);
    await waitForCondition(`Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="false"]')).some((element) => element.getBoundingClientRect().width > 0)`, "non-active first-project deep link");
    await waitForCondition(
      `(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return conversation?.getAttribute(
          'data-guidebrief-conversation-scope'
        ) !== ${JSON.stringify(secondProjectGuideAnswer.scope)} &&
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) === 'false' &&
          conversation.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length === 0;
      })()`,
      "GuideBrief conversation resets immediately for an explicitly viewed project",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const home = document.querySelector(
          '[data-blank-state="v0.1"][data-blank-state-presentation="viewed_project_inactive"]'
        );
        return Boolean(home) &&
          document.body.textContent.includes(
            'Opening this link did not switch your current project.'
          ) &&
          home.querySelectorAll(
            '[data-blank-state-primary-action="make_active"]'
          ).length === 1 &&
          home.querySelector(
            'details[data-management-safety], [data-project-controls-hydrated="true"]'
          ) === null;
      })()`),
      true,
    );
    const activeAfterDeepLink = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    assert.equal(activeAfterDeepLink.recent_projects.find((entry) => entry.is_active)?.project.display_name, "Browser Second Project");
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
      supportingInformation: "Project identity and activation guidance remain focused.",
      rawRecordDisclosure: "Active-only project controls remain absent.",
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
    // this control. Require request quiet and the action's own enabled state
    // before activating the retained non-active project.
    await waitForRequestQuiet();
    await waitForCondition(
      `Array.from(document.querySelectorAll('button[data-blank-state-primary-action="make_active"]')).some((button) => button.getBoundingClientRect().width > 0 && !button.disabled)`,
      "explicit first-project activation ready",
    );
    await waitForCondition(
      `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
      "hydrated strategic source project activation",
    );
    const activationResponseStart = responses.length;
    assert.equal(await evaluateBoolean(`(() => { const button = Array.from(document.querySelectorAll('button[data-blank-state-primary-action="make_active"]')).find((candidate) => candidate.getBoundingClientRect().width > 0); if (!(button instanceof HTMLButtonElement) || button.disabled) return false; button.click(); return true; })()`), true);
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
      interactionPath: ["Open Continuities", "Continue current work"],
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

    await navigate(`${appOrigin}${secondDestination}`);
    const activateSecondForRecovery = await evaluateJson(`(async () => {
      const currentResponse = await fetch('/api/vnext/projects');
      const current = await currentResponse.json();
      const active = current.recent_projects.find((entry) => entry.is_active);
      const response = await fetch('/api/vnext/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          project_id: ${JSON.stringify(secondProjectId)},
          expected_project_id: active?.active_project_id ?? null,
          expected_revision: active?.active_selection_revision ?? null,
        }),
      });
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(activateSecondForRecovery.status, 200);
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Browser Second Project')`,
      "second project active before root recovery",
    );
    const activeBeforeRootRecovery = await evaluateJson(`(async () => {
      const response = await fetch('/api/vnext/projects');
      return await response.json();
    })()`);
    assert.equal(
      activeBeforeRootRecovery.recent_projects.find((entry) => entry.is_active)
        ?.project.project_id,
      secondProjectId,
    );

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
    const recoveryProjectContext = await evaluateJson(`(() => {
        const context = document.querySelector('[data-project-context-label="Current project"]');
        const locateActions = Array.from(
          document.querySelectorAll('[data-blank-state-primary-action="locate_folder"]')
        ).filter((candidate) => candidate.getBoundingClientRect().width > 0);
        return {
          context_tag: context?.tagName ?? null,
          context_matches_control: context?.matches('a, button') ?? null,
          nested_context_controls: context?.querySelectorAll('a, button').length ?? -1,
          context_href: context?.getAttribute('href') ?? null,
          nonexistent_settings_actions: document.querySelectorAll(
            'a[data-project-context-label="Current project"][href*="#project-settings"], button[data-project-context-label="Current project"]'
          ).length,
          settings_targets: document.querySelectorAll('#project-settings').length,
          management_owners: document.querySelectorAll(
            '[data-project-settings-owner], [data-project-identity-management], [data-blank-state-project-settings-recovery]'
          ).length,
          locate_action_count: locateActions.length,
          locate_action_tag: locateActions[0]?.tagName ?? null,
          semantic_primary_action_count: document.querySelectorAll(
            '[data-augnes-primary-action]'
          ).length,
        };
      })()`);
    assert.deepEqual(
      recoveryProjectContext,
      {
        context_tag: "P",
        context_matches_control: false,
        nested_context_controls: 0,
        context_href: null,
        nonexistent_settings_actions: 0,
        settings_targets: 0,
        management_owners: 0,
        locate_action_count: 1,
        locate_action_tag: "BUTTON",
        semantic_primary_action_count: 1,
      },
      "root-recovery Current project context must stay passive without a settings owner",
    );
    result.project_recovery_context_passive = true;
    await validateBlankStateViewports(true, {
      state: "project-root-recovery",
      attentionCount: 1,
      attentionCategory: "project_recovery",
      primaryActions: 1,
      primaryActionMinimumHeight: 44,
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
    timing.milestone("retained runtime ready within 45 second bound");
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

  if (RUN_CUX6B_ONLY) {
    await assertFocusedFirstWorkBrowserResultV01();
    return;
  }

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
    assert.equal(await evaluateBoolean(`(() => {
      const link = document.querySelector('a[data-project-context-label="Current project"]');
      if (!(link instanceof HTMLAnchorElement) || !link.textContent?.includes('Browser Onboarding Project')) return false;
      link.click();
      return true;
    })()`), true);
    await waitForCondition(
      `location.pathname === '/' && location.hash === '#project-settings' && (() => {
        const settings = document.querySelector('details[data-blank-state-project-settings-recovery="true"]');
        return settings?.open === true && settings.querySelector(':scope > summary') === document.activeElement;
      })()`,
      "AI Workplane current-project context returns to focused project settings",
    );
    result.ai_workplane_project_context_opens_settings = true;
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
        `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
        "hydrated strategic proposal source project activation",
      );
      const strategicProjectPath =
        `/projects/${encodeURIComponent(manifest.project_id)}`;
      const activationTarget = await evaluateJson(`(() => {
        const roots = Array.from(
          document.querySelectorAll(
            '[data-blank-state="v0.1"][data-blank-state-project-management-hydrated="true"]'
          )
        );
        const root = roots.length === 1 ? roots[0] : null;
        const buttons = root
          ? Array.from(
              root.querySelectorAll(
                'button[data-blank-state-primary-action="make_active"]'
              )
            ).filter((candidate) => {
              const rect = candidate.getBoundingClientRect();
              return (
                candidate instanceof HTMLButtonElement &&
                candidate.isConnected &&
                !candidate.disabled &&
                rect.width > 0 &&
                rect.height > 0
              );
            })
          : [];
        const button = buttons.length === 1 ? buttons[0] : null;
        const rect = button?.getBoundingClientRect() ?? null;
        const x = rect ? rect.left + rect.width / 2 : null;
        const y = rect ? rect.top + rect.height / 2 : null;
        const pointOwner =
          x !== null && y !== null ? document.elementFromPoint(x, y) : null;
        const routeProjectId =
          location.pathname.startsWith('/projects/')
            ? decodeURIComponent(location.pathname.slice('/projects/'.length))
            : null;
        return {
          actual_path: location.pathname,
          route_project_id: routeProjectId,
          root_count: roots.length,
          action_owner_count: buttons.length,
          target_connected: button?.isConnected ?? false,
          target_disabled:
            button instanceof HTMLButtonElement ? button.disabled : null,
          point_owner_is_target:
            button !== null &&
            (pointOwner === button || button.contains(pointOwner)),
          x,
          y,
        };
      })()`);
      assert.equal(activationTarget.actual_path, strategicProjectPath);
      assert.equal(activationTarget.route_project_id, manifest.project_id);
      assert.equal(activationTarget.root_count, 1);
      assert.equal(activationTarget.action_owner_count, 1);
      assert.equal(activationTarget.target_connected, true);
      assert.equal(activationTarget.target_disabled, false);
      assert.equal(activationTarget.point_owner_is_target, true);
      assert.equal(Number.isFinite(activationTarget.x), true);
      assert.equal(Number.isFinite(activationTarget.y), true);
      const activationControlStateBefore = readProjectControlState(
        manifest.project_id,
      );
      const activationRequestStart = requests.length;
      const activationResponseStart = responses.length;
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: activationTarget.x,
        y: activationTarget.y,
      });
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: activationTarget.x,
        y: activationTarget.y,
        button: "left",
        clickCount: 1,
      });
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: activationTarget.x,
        y: activationTarget.y,
        button: "left",
        clickCount: 1,
      });
      await waitForHostCondition(
        () =>
          requests.slice(activationRequestStart).some(
            (entry) =>
              entry.method === "POST" &&
              entry.path === "/api/vnext/projects" &&
              entry.type === "Fetch" &&
              requestJsonBody(entry)?.action === "open" &&
              requestJsonBody(entry)?.project_id === manifest.project_id,
          ),
        "strategic source project activation request",
      );
      const activationRequest = requests
        .slice(activationRequestStart)
        .find(
          (entry) =>
            entry.method === "POST" &&
            entry.path === "/api/vnext/projects" &&
            entry.type === "Fetch" &&
            requestJsonBody(entry)?.action === "open" &&
            requestJsonBody(entry)?.project_id === manifest.project_id,
        );
      assert(activationRequest);
      await waitForHostCondition(
        () =>
          responses.slice(activationResponseStart).some(
            (entry) =>
              entry.request_id === activationRequest.request_id &&
              entry.method === "POST" &&
              entry.path === "/api/vnext/projects" &&
              entry.type === "Fetch",
          ),
        "strategic source project activation response",
      );
      const activationResponse = responses
        .slice(activationResponseStart)
        .find(
          (entry) =>
            entry.request_id === activationRequest.request_id &&
            entry.method === "POST" &&
            entry.path === "/api/vnext/projects" &&
            entry.type === "Fetch",
        );
      assert.equal(activationResponse?.status, 200);
      const activationControlStateAfter = readProjectControlState(
        manifest.project_id,
      );
      assert.equal(
        activationControlStateAfter.active?.project_id,
        manifest.project_id,
      );
      assert.equal(
        activationControlStateAfter.active?.selection_revision,
        Number(activationControlStateBefore.active?.selection_revision) + 1,
      );
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
      `document.querySelector('[data-vnext-decision-history="v0.1"] li')?.textContent?.includes('defer') === true && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="deferred_until_condition"]') !== null && document.querySelector('[data-vnext-semantic-transition-actions="v0.1"]') === null`,
      "strategic defer decision without transition",
    );
    await validateSemanticReviewViewports();
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
          const button = Array.from(
            document.querySelectorAll('button[data-blank-state-primary-action="make_active"]')
          ).find(
            (candidate) => candidate.getBoundingClientRect().width > 0
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
        human_review_order: (() => {
          const identity = detail?.querySelector('[aria-labelledby="what-would-change-title"]');
          const timeline = detail?.querySelector('[data-selected-work-timeline-items]');
          const currentPosition = timeline?.querySelector('[data-selected-work-next-step]');
          const decision = detail?.querySelector('#selected-work-decision');
          const relationships = detail?.querySelector('#selected-work-relationships');
          const support = detail?.querySelector('#selected-work-support');
          return Boolean(identity && timeline && currentPosition && decision && relationships && support) &&
            Boolean(identity.compareDocumentPosition(timeline) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(timeline.compareDocumentPosition(decision) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(decision.compareDocumentPosition(relationships) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(relationships.compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            currentPosition.textContent?.includes('Current position') === true &&
            currentPosition.textContent?.includes('What happens next') === true;
        })(),
        timeline_first:
          detail?.getAttribute('data-selected-work-timeline') === 'selected_work_timeline.v0.1' &&
          detail?.querySelector('[aria-label="Selected work meaningful timeline"]') !== null &&
          detail?.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1 &&
          detail?.querySelector('[data-selected-work-next-step="review_focused"]') !== null,
        timeline_non_authoritative:
          detail?.querySelector('[data-selected-work-projection-only="true"][data-selected-work-semantic-authority="false"]') !== null &&
          Array.from(detail?.querySelectorAll('[data-selected-work-timeline-item]') ?? []).every(
            (item) => item.getAttribute('data-selected-work-timeline-authority') === 'false'
          ),
        relationship_support_question: (() => {
          const relationships = detail?.querySelector(
            '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
          );
          const selector = relationships?.querySelector(
            '[data-selected-work-relationship-question-selector="true"]'
          );
          const connections = relationships?.querySelectorAll(
            '[data-selected-work-relationship-connection]'
          );
          return relationships?.getAttribute(
            'data-selected-work-relationship-question'
          ) === 'support_and_source' &&
            selector instanceof HTMLSelectElement &&
            selector.value === 'support_and_source' &&
            selector.options.length > 0 &&
            selector.options.length <= 4 &&
            (connections?.length ?? 0) > 0 &&
            (connections?.length ?? 0) <= 6 &&
            relationships.querySelectorAll(
              '[data-selected-work-relationship-highlighted="true"]'
            ).length === 1;
        })(),
        relationship_partial_or_unavailable:
          ['partial', 'unavailable', 'conflicted'].includes(
            detail?.querySelector('[data-selected-work-relationships]')?.getAttribute(
              'data-selected-work-relationship-answer'
            ) ?? ''
          ) &&
          detail?.querySelector(
            '[data-selected-work-relationship-incomplete="true"], [data-selected-work-relationship-unavailable="true"]'
          ) !== null,
        relationship_public_boundary: (() => {
          const relationships = detail?.querySelector(
            '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
          );
          const relationshipText = relationships?.innerText ?? '';
          return relationships?.getAttribute(
            'data-selected-work-relationship-semantic-authority'
          ) === 'false' &&
            relationships?.getAttribute(
              'data-selected-work-relationship-timeline-owner'
            ) === 'true' &&
            relationships?.querySelector(
              '[data-ai-workplane-primary-action], canvas, [data-graph-control]'
            ) === null &&
            !/(sha256:|episode-delta-proposal:|review-decision:|state-transition-receipt:|TaskContextPacket|RunReceipt)/i.test(
              relationshipText
            );
        })(),
        one_default_timeline_surface:
          detail?.querySelectorAll('[data-augnes-independent-surface]').length === 1 &&
          detail?.querySelectorAll('[data-augnes-state-badge]').length === 0,
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
      timeline_first: true,
      timeline_non_authoritative: true,
      relationship_support_question: true,
      relationship_partial_or_unavailable: true,
      relationship_public_boundary: true,
      one_default_timeline_surface: true,
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
      maxIndependentSurfaces: 1,
      maxStateBadges: 1,
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
    assert.equal(
      await evaluateBoolean(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        const relationships = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        const selector = relationships?.querySelector(
          '[data-selected-work-relationship-question-selector="true"]'
        );
        const highlighted = relationships?.querySelectorAll(
          '[data-selected-work-relationship-highlighted="true"]'
        );
        return detail?.getAttribute('data-selected-work-current-stage') === 'awaiting_application' &&
          relationships?.getAttribute('data-selected-work-relationship-question') === 'candidate_and_decision' &&
          selector instanceof HTMLSelectElement &&
          selector.value === 'candidate_and_decision' &&
          highlighted?.length === 1 &&
          relationships.querySelectorAll('[data-ai-workplane-primary-action]').length === 0 &&
          detail.querySelectorAll('[data-ai-workplane-primary-action]').length === 1;
      })()`),
      true,
      "accepted selected decision must explain its exact connection without owning another primary action",
    );
    record("selected_work_relationship_explains_awaiting_application_decision");
    await validateSemanticReviewViewports();

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
    await validateSemanticReviewViewports();

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
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="project_updated"]') !== null && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
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
      const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const timeline = detail?.querySelector('[data-selected-work-timeline-items]');
      const current = timeline?.querySelector('[data-selected-work-timeline-current="true"]');
      const advanced = Array.from(detail?.querySelectorAll('details') ?? []).find(
        (item) => item.querySelector(':scope > summary')?.textContent?.includes('Advanced review')
      );
      return {
        timeline_project_updated:
          detail?.getAttribute('data-selected-work-current-stage') === 'project_updated' &&
          current?.textContent?.includes('Project updated') === true,
        one_current_position:
          timeline?.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1,
        no_competing_transition_panel:
          detail?.querySelector('[data-vnext-semantic-transition-actions="v0.1"]') === null,
        relationship_project_change:
          detail?.querySelector(
            '[data-selected-work-relationships="selected_work_relationships.v0.1"][data-selected-work-relationship-question="decision_and_project_change"]'
          ) !== null &&
          detail?.querySelectorAll(
            '[data-selected-work-relationship-highlighted="true"]'
          ).length === 1 &&
          detail?.querySelector(
            '[data-selected-work-relationship-basis="authorized_project_change"]'
          ) !== null,
        exact_material_optional:
          advanced instanceof HTMLDetailsElement &&
          advanced.open === false &&
          detail?.querySelector('[data-workbench-to-shared-inspector="true"]') !== null,
        feedback_waiting_for_run: document.querySelector('[data-vnext-context-use-feedback="not_yet_available"]') !== null,
      };
    })()`);
    assert.deepEqual(appliedShape, {
      timeline_project_updated: true,
      one_current_position: true,
      no_competing_transition_panel: true,
      relationship_project_change: true,
      exact_material_optional: true,
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
    record("selected_work_relationship_explains_exact_project_update");

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

    validateExactLaterOutcomeV01 = async () => {
      const exactLaterProposalId =
        revisionPath.split("/").at(-1)?.replace("~", ":") ?? "";
      const exactLaterProposalRow = database
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'episode_delta_proposal'
             AND project_id = ?
             AND record_id = ?`,
        )
        .get(manifest.project_id, exactLaterProposalId);
      assert(exactLaterProposalRow, "applied proposal fixture missing");
      const exactLaterProposal = JSON.parse(exactLaterProposalRow.payload_json);
      const exactLaterLineage =
        readVNextOperatorPilotProposalDurableLineageV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(runtimeEnvironment),
          proposal: exactLaterProposal,
        });
      const exactLaterChains = exactLaterLineage.chains.filter(
        (chain) =>
          chain.stage_status === "packet_compiled" &&
          chain.compiled_packet !== null,
      );
      assert.equal(
        exactLaterChains.length,
        1,
        "selected applied proposal must expose one exact compiled-packet chain",
      );
      const exactLaterPacketBinding = exactLaterChains[0]?.compiled_packet;
      assert(exactLaterPacketBinding, "applied Transition packet binding missing");
      const exactLaterPacketRow = database
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'task_context_packet'
             AND project_id = ?
             AND record_id = ?
             AND fingerprint = ?`,
        )
        .get(
          manifest.project_id,
          exactLaterPacketBinding.packet_id,
          exactLaterPacketBinding.packet_fingerprint,
      );
      assert(exactLaterPacketRow, "applied Transition packet fixture missing");
      const exactLaterPacket = JSON.parse(exactLaterPacketRow.payload_json);
      const continuityBeforeExactLater =
        projectVNextOperatorPilotContinuityV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(runtimeEnvironment),
        });
      const priorContextUseRecordedAt =
        continuityBeforeExactLater.latest_context_use_receipt?.recorded_at ??
        exactLaterPacket.generated_at;
      const exactLaterAnchorAt = new Date(
        Math.max(
          Date.parse(exactLaterPacket.generated_at),
          Date.parse(priorContextUseRecordedAt),
        ) + 1_000,
      ).toISOString();
      const exactLaterReceiptSeed =
        buildSemanticReviewLoopRunReceiptFixture(
          {
            fixture_id: "pc3-exact-later-outcome",
            workspace_id: manifest.workspace_id,
            project_id: manifest.project_id,
            run_id: "run:operator-browser-pc3-exact-later-outcome",
          },
          exactLaterPacket,
          { timeline_anchor_at: exactLaterAnchorAt },
        );
      const exactLaterReceiptInput = structuredClone(exactLaterReceiptSeed);
      delete exactLaterReceiptInput.receipt_version;
      delete exactLaterReceiptInput.receipt_id;
      delete exactLaterReceiptInput.trust_summary;
      delete exactLaterReceiptInput.authority_summary;
      delete exactLaterReceiptInput.idempotency_key;
      delete exactLaterReceiptInput.integrity;
      exactLaterReceiptInput.compatibility.source_contracts.push(
        VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01,
      );
      const exactLaterTransitionRef = {
        ref_version: "external_ref.v0.1",
        ref_type: "state_transition_receipt",
        external_id: exactLaterChains[0].transition.receipt_id,
        trust_class: "direct_local_observation",
        observed_at: exactLaterPacket.generated_at,
        source_ref: exactLaterChains[0].transition.receipt_fingerprint,
        compatibility_namespace:
          "augnes.vnext.state-transition-receipt.v0.1",
      };
      exactLaterReceiptInput.external_refs.push(exactLaterTransitionRef);
      exactLaterReceiptInput.source_refs.push(exactLaterTransitionRef);
      exactLaterReceiptInput.checks.push({
        check_id: "validated_packet_delivery",
        required: false,
        status: "passed",
        basis: "observed",
        summary:
          "The synthetic later-run fixture presented the exact compiled packet.",
        source_refs: [
          ...exactLaterReceiptInput.checks[0].source_refs,
        ],
      });
      exactLaterReceiptInput.authority_notes =
        exactLaterReceiptSeed.authority_summary.notes;
      const exactLaterReceipt = buildRunReceiptV01(exactLaterReceiptInput);
      const exactLaterWriter = new Database(databasePath);
      try {
        exactLaterWriter.pragma("foreign_keys = ON");
        admitStructuredRunReceiptV01(exactLaterWriter, exactLaterReceipt);
      } finally {
        exactLaterWriter.close();
      }
      const exactLaterContinuity = projectVNextOperatorPilotContinuityV01(
        database,
        {
          config: readVNextLocalOperatorPilotConfigV01(runtimeEnvironment),
        },
      );
      assert.deepEqual(
        exactLaterContinuity.latest_compiled_packet,
        continuityBeforeExactLater.latest_compiled_packet,
        "recording later use of an exact older packet must not replace the newer compiled-packet projection",
      );
      assert.notEqual(
        exactLaterContinuity.latest_compiled_packet?.packet_id,
        exactLaterPacket.packet_id,
        "the selected Transition packet must be older than the actual latest compiled packet",
      );
      assert.equal(
        exactLaterReceipt.task_context_packet_ref?.external_id,
        exactLaterPacket.packet_id,
        "the negative receipt must remain bound to the older packet ID",
      );
      assert.equal(
        exactLaterReceipt.task_context_packet_ref?.source_ref,
        exactLaterPacket.integrity.fingerprint,
        "the negative receipt must remain bound to the older packet fingerprint",
      );
      assert.notEqual(
        exactLaterContinuity.latest_context_use_receipt?.receipt_id,
        exactLaterReceipt.receipt_id,
        "an older packet-bound receipt must not become latest continuity",
      );
      if (exactLaterContinuity.latest_context_use_receipt) {
        assert.equal(
          exactLaterContinuity.latest_context_use_receipt
            .task_context_packet_id,
          exactLaterContinuity.latest_compiled_packet?.packet_id,
          "the retained latest receipt must bind the actual latest packet ID",
        );
        assert.equal(
          exactLaterContinuity.latest_context_use_receipt
            .task_context_packet_fingerprint,
          exactLaterContinuity.latest_compiled_packet?.packet_fingerprint,
          "the retained latest receipt must bind the actual latest packet fingerprint",
        );
      }
      record("older_packet_bound_later_result_is_not_latest_continuity");

      const mixedLatestPacketRow = database
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'task_context_packet'
             AND project_id = ?
             AND record_id = ?
             AND fingerprint = ?`,
        )
        .get(
          manifest.project_id,
          exactLaterContinuity.latest_compiled_packet?.packet_id,
          exactLaterContinuity.latest_compiled_packet?.packet_fingerprint,
        );
      assert(
        mixedLatestPacketRow,
        "mixed-lineage latest compiled packet missing",
      );
      const mixedLatestPacket = JSON.parse(
        mixedLatestPacketRow.payload_json,
      );
      assert(
        mixedBoundedAutomationPacketTarget,
        "the exact bounded-automation packet must be captured before later mixed-project Transitions",
      );
      const mixedBoundedAutomationPacketRow = database
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'task_context_packet'
             AND project_id = ?
             AND record_id = ?
             AND fingerprint = ?`,
        )
        .get(
          manifest.project_id,
          mixedBoundedAutomationPacketTarget.packet_id,
          mixedBoundedAutomationPacketTarget.packet_fingerprint,
        );
      assert(
        mixedBoundedAutomationPacketRow,
        "captured mixed bounded-automation packet missing",
      );
      const mixedBoundedAutomationPacket = JSON.parse(
        mixedBoundedAutomationPacketRow.payload_json,
      );
      assert.equal(
        mixedBoundedAutomationPacket.compatibility.source_contracts.includes(
          "vnext_bounded_automation_context_compiler.v0.1",
        ),
        true,
        "the exact captured mixed packet must preserve its bounded-automation class",
      );
      assert.equal(
        exactLaterLineage.chains.some(
          (chain) =>
            chain.compiled_packet?.packet_id ===
              mixedBoundedAutomationPacket.packet_id &&
            chain.compiled_packet?.packet_fingerprint ===
              mixedBoundedAutomationPacket.integrity.fingerprint,
        ),
        false,
        "a bounded-automation packet must remain excluded from workbench durable lineage",
      );
      result.bounded_automation_packet_excluded_from_workbench_lineage = true;
      record("bounded_automation_packet_excluded_from_workbench_lineage");

      assert.equal(existsSync(folderPickerSequencePath), true);
      renameSync(
        folderPickerSequencePath,
        `${folderPickerSequencePath}.reconnect-consumed`,
      );
      writeFileSync(
        folderPickerSequencePath,
        `${JSON.stringify({
          sequence_version:
            "augnes_canonical_folder_picker_sequence.v0.1",
          next_index: 0,
          entries: [
            {
              id: "positive-lineage-project",
              outcome: "selected",
              absolute_path: positiveLineageProjectRoot,
            },
          ],
        })}\n`,
        { encoding: "utf8", flag: "wx", mode: 0o600 },
      );
      await navigate(`${appOrigin}/projects`);
      await waitForCondition(
        `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
        "positive-lineage project onboarding surface",
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === 'Choose another folder'
          );
          if (!(button instanceof HTMLButtonElement) || button.disabled) {
            return false;
          }
          button.click();
          return true;
        })()`),
        true,
        "the positive-lineage project must use the normal folder picker",
      );
      await waitForCondition(
        `document.body.textContent.includes('Browser Positive Lineage Project') && document.body.textContent.includes('Plain folder')`,
        "positive-lineage project inspection",
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === 'Add project'
          );
          if (!(button instanceof HTMLButtonElement) || button.disabled) {
            return false;
          }
          button.click();
          return true;
        })()`),
        true,
        "the positive-lineage project confirmation must remain explicit",
      );
      await waitForCondition(
        `location.pathname.startsWith('/projects/project%3A') && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Browser Positive Lineage Project')`,
        "positive-lineage active project",
      );
      const positiveProjectDestination =
        await evaluateString("location.pathname");
      const positiveProjectId = decodeURIComponent(
        positiveProjectDestination.split("/").at(-1),
      );
      assert.notEqual(positiveProjectId, manifest.project_id);

      const positiveFixtureProject = {
        fixture_id: "pc3-positive-later-outcome",
        workspace_id: manifest.workspace_id,
        project_id: positiveProjectId,
        run_id: "run:pc3-positive-bootstrap-source",
      };
      const positivePacketTemplate =
        buildSemanticReviewLoopTaskContextPacketFixture(
          positiveFixtureProject,
          { data_classification: "public_safe" },
        );
      const {
        packet_version: _positivePacketVersion,
        packet_id: _positivePacketId,
        authority_summary: positivePacketAuthority,
        integrity: _positivePacketIntegrity,
        ...positivePacketInput
      } = positivePacketTemplate;
      const positivePriorGeneratedAt = new Date(
        Date.now() - 1_000,
      ).toISOString();
      const positivePriorPacket = buildTaskContextPacketV01({
        ...positivePacketInput,
        generated_at: positivePriorGeneratedAt,
        expires_at: new Date(
          Date.parse(positivePriorGeneratedAt) + 2 * 60 * 60_000,
        ).toISOString(),
        selected_context: positivePacketInput.selected_context.map(
          (entry) => ({
            ...entry,
            currentness: {
              ...entry.currentness,
              as_of: positivePriorGeneratedAt,
            },
          }),
        ),
        source_status: {
          ...positivePacketInput.source_status,
          currentness: {
            ...positivePacketInput.source_status.currentness,
            as_of: positivePriorGeneratedAt,
          },
        },
        authority_notes: positivePacketAuthority.notes,
      });
      assert.equal(
        positivePriorPacket.workspace_id,
        manifest.workspace_id,
      );
      assert.equal(positivePriorPacket.project_id, positiveProjectId);
      assert.equal(
        positivePriorPacket.compatibility.source_contracts.includes(
          "generic_cli.task_input.v0.1",
        ),
        true,
      );
      assert.equal(
        positivePriorPacket.compatibility.source_contracts.includes(
          "vnext_bounded_automation_context_compiler.v0.1",
        ),
        false,
        "the positive project must fail before inheriting bounded-automation packet class",
      );
      assert.equal(
        positivePriorPacket.compatibility.source_contracts.includes(
          "vnext_persisted_semantic_context_compiler.v0.1",
        ),
        false,
        "the generic positive prior packet must not impersonate a compiler-produced packet",
      );
      const positiveBootstrapReceipt =
        buildSemanticReviewLoopRunReceiptFixture(
          positiveFixtureProject,
          positivePriorPacket,
          { timeline_anchor_at: positivePriorGeneratedAt },
        );
      const positiveBootstrapProposal =
        buildSemanticReviewLoopProposalFixture(
          positiveFixtureProject,
          positivePriorPacket,
          positiveBootstrapReceipt,
          {
            primary_delta_type: "agent_plan_delta",
            candidate_namespace: "pc3-positive-bootstrap",
            timeline_anchor_at: positivePriorGeneratedAt,
          },
        );
      const positivePriorWriter = new Database(databasePath, {
        fileMustExist: true,
      });
      try {
        positivePriorWriter.pragma("foreign_keys = ON");
        positivePriorWriter.transaction(() => {
          const packetWrite = insertVNextCoreRecordV01(
            positivePriorWriter,
            {
              record_kind: "task_context_packet",
              record_id: positivePriorPacket.packet_id,
              workspace_id: positivePriorPacket.workspace_id,
              project_id: positivePriorPacket.project_id,
              fingerprint: positivePriorPacket.integrity.fingerprint,
              idempotency_key: null,
              payload: positivePriorPacket,
              created_at: positivePriorPacket.generated_at,
            },
          );
          assert.equal(packetWrite.status, "inserted");
          const receiptAdmission = admitStructuredRunReceiptV01(
            positivePriorWriter,
            positiveBootstrapReceipt,
          );
          assert.equal(receiptAdmission.status, "inserted");
          const proposalWrite = insertVNextCoreRecordV01(
            positivePriorWriter,
            {
              record_kind: "episode_delta_proposal",
              record_id: positiveBootstrapProposal.proposal_id,
              workspace_id: positiveBootstrapProposal.workspace_id,
              project_id: positiveBootstrapProposal.project_id,
              fingerprint:
                positiveBootstrapProposal.integrity.fingerprint,
              idempotency_key: null,
              payload: positiveBootstrapProposal,
              created_at: positiveBootstrapProposal.created_at,
            },
          );
          assert.equal(proposalWrite.status, "inserted");
        })();
      } finally {
        positivePriorWriter.close();
      }
      result.positive_generic_prior_packet_seeded = true;
      record("positive_generic_prior_packet_seeded");
      result.positive_bootstrap_proposal_admitted = true;
      record("positive_bootstrap_proposal_admitted");

      const positiveRuntimeEnvironment = {
        ...runtimeEnvironment,
        AUGNES_VNEXT_OPERATOR_PROJECT_ID: positiveProjectId,
      };
      const mixedSessionLogout = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/operator/session', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' })
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(mixedSessionLogout.status, 200);
      assert.equal(mixedSessionLogout.body.ok, true);
      assert.equal(mixedSessionLogout.body.status, "revoked");
      registerExpectedSessionRefusal({
        tokenId: POSITIVE_LOCKED_SESSION_REFUSAL_TOKEN,
        status: 401,
        chromeLogText:
          "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
      });
      await navigate("about:blank");
      await terminateProcess(serverProcess, 15_000);
      serverProcess = null;
      startDevServer(positiveRuntimeEnvironment);
      await waitForHttp(
        `${appOrigin}/workbench/semantic-review`,
        DEFAULT_TIMEOUT_MS,
      );
      await navigate(`${appOrigin}/workbench/semantic-review`);
      await waitForCondition(
        `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
        "locked positive-lineage operator session",
      );
      bootstrapToken = await issueBootstrap(positiveRuntimeEnvironment);
      await setBootstrapInput(bootstrapToken);
      assert.equal(
        await evaluateBoolean(`(() => {
          const form = document.querySelector(
            '#vnext-operator-bootstrap-token'
          )?.closest('form');
          if (!form) return false;
          form.requestSubmit();
          return true;
        })()`),
        true,
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
        "authenticated positive-lineage operator session",
      );
      assert.equal(
        await evaluateBoolean(
          `document.documentElement.innerHTML.includes(${JSON.stringify(
            bootstrapToken,
          )})`,
        ),
        false,
      );
      assert.equal(serverLog.includes(bootstrapToken), false);
      bootstrapToken = null;
      const positiveSessionRecovery = await readAuthenticatedSessionInBrowser();
      assert.equal(positiveSessionRecovery.status, 200);
      assert.equal(positiveSessionRecovery.body.ok, true);
      assert.equal(positiveSessionRecovery.body.status, "authenticated");
      await waitForExpectedRefusalSettlement(
        POSITIVE_LOCKED_SESSION_REFUSAL_TOKEN,
        "positive-project missing-session refusal and recovery",
      );

      const beforePositiveTransition =
        readDirectHostBrowserState(positiveProjectId);
      const positiveProposal = positiveBootstrapProposal;
      const positiveProposalPath = `/workbench/semantic-review/${positiveProposal.proposal_id.replace(
        ":",
        "~",
      )}`;
      await navigate(`${appOrigin}${positiveProposalPath}`);
      await waitForCondition(
        `location.pathname === ${JSON.stringify(positiveProposalPath)} && document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null`,
        "admitted positive bootstrap proposal detail",
      );
      const positiveDetailResponse = await evaluateJson(`(async () => {
        const response = await fetch(
          '/api/vnext/operator/semantic-review?' + new URLSearchParams({
            proposal_id: ${JSON.stringify(positiveProposal.proposal_id)}
          }),
          { cache: 'no-store', credentials: 'same-origin' }
        );
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(
        positiveDetailResponse.status,
        200,
        `positive bootstrap detail failed: ${JSON.stringify(
          positiveDetailResponse.body,
        )}`,
      );
      assert.equal(
        positiveDetailResponse.body.proposal?.proposal?.proposal_id,
        positiveProposal.proposal_id,
      );
      assert.equal(
        positiveDetailResponse.body.proposal?.proposal?.integrity?.fingerprint,
        positiveProposal.integrity.fingerprint,
      );
      const positiveSelectedCandidate =
        positiveDetailResponse.body.proposal?.candidates?.find(
          (entry) =>
            entry.pilot_admission?.decision_allowed?.accept === true,
        );
      assert(
        positiveSelectedCandidate,
        "positive bootstrap requires one exactly admitted accept candidate",
      );
      const positiveCandidate = positiveSelectedCandidate.candidate;
      const positiveCandidateBinding = {
        candidate_id: positiveCandidate.candidate_id,
        candidate_fingerprint:
          positiveSelectedCandidate.candidate_fingerprint,
      };
      assert.equal(
        createEpisodeDeltaCandidateFingerprintV01(positiveCandidate),
        positiveCandidateBinding.candidate_fingerprint,
        "positive bootstrap candidate fingerprint must remain exact",
      );
      const positiveDecisionRequest = {
        proposal_id: positiveProposal.proposal_id,
        proposal_fingerprint: positiveProposal.integrity.fingerprint,
        candidate_id: positiveCandidateBinding.candidate_id,
        candidate_fingerprint:
          positiveCandidateBinding.candidate_fingerprint,
        decision: "accept",
        rationale_summary:
          "Accept the exact positive bootstrap candidate so an ordinary reviewed Transition can compile the first eligible project packet.",
        revisit: null,
      };
      const positiveDecisionResponse = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/operator/semantic-review', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(${JSON.stringify(positiveDecisionRequest)})
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(
        positiveDecisionResponse.status,
        201,
        `positive bootstrap decision failed: ${JSON.stringify(
          positiveDecisionResponse.body,
        )}`,
      );
      assert.equal(positiveDecisionResponse.body.status, "inserted");
      assert.equal(positiveDecisionResponse.body.transition_requested, true);
      assert.equal(positiveDecisionResponse.body.transition_applied, false);
      const positiveDecision = positiveDecisionResponse.body.decision;
      assert.equal(positiveDecision.decision, "accept");
      assert.equal(
        positiveDecision.candidate.candidate_id,
        positiveCandidateBinding.candidate_id,
      );
      assert.equal(
        positiveDecision.candidate.candidate_fingerprint,
        positiveCandidateBinding.candidate_fingerprint,
      );
      const positiveDecisionBinding = {
        proposal_id: positiveProposal.proposal_id,
        proposal_fingerprint: positiveProposal.integrity.fingerprint,
        decision_id: positiveDecision.decision_id,
        decision_fingerprint: positiveDecision.integrity.fingerprint,
      };
      const positivePreviewQuery = new URLSearchParams(
        positiveDecisionBinding,
      ).toString();
      const positivePreviewResponse = await evaluateJson(`(async () => {
        const response = await fetch(
          ${JSON.stringify(
            `/api/vnext/operator/semantic-transition?${positivePreviewQuery}`,
          )},
          {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin'
          }
        );
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(
        positivePreviewResponse.status,
        200,
        `positive bootstrap preview failed: ${JSON.stringify(
          positivePreviewResponse.body,
        )}`,
      );
      assert.equal(positivePreviewResponse.body.status, "preview");
      assert.equal(positivePreviewResponse.body.preview_is_write, false);
      assert.equal(
        positivePreviewResponse.body.preview.candidate_fingerprint,
        positiveCandidateBinding.candidate_fingerprint,
      );
      const positiveConfirmationRequest = {
        action: "confirm",
        ...positiveDecisionBinding,
        confirmation_digest:
          positivePreviewResponse.body.preview.confirmation_digest,
      };
      const positiveConfirmationResponse = await evaluateJson(`(async () => {
        const response = await fetch(
          '/api/vnext/operator/semantic-transition',
          {
            method: 'POST',
            cache: 'no-store',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(${JSON.stringify(
              positiveConfirmationRequest,
            )})
          }
        );
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(
        positiveConfirmationResponse.status,
        201,
        `positive bootstrap confirmation failed: ${JSON.stringify(
          positiveConfirmationResponse.body,
        )}`,
      );
      assert.equal(positiveConfirmationResponse.body.status, "inserted");
      assert.equal(positiveConfirmationResponse.body.state_applied, false);
      const positiveGate = positiveConfirmationResponse.body.gate_record;
      assert.equal(
        positiveGate.candidate_fingerprint,
        positiveCandidateBinding.candidate_fingerprint,
      );
      const positiveApplyRequest = {
        action: "apply",
        ...positiveDecisionBinding,
        gate_record_id: positiveGate.gate_record_id,
        gate_record_fingerprint: positiveGate.integrity.fingerprint,
        prior_packet_id: positivePriorPacket.packet_id,
        prior_packet_fingerprint:
          positivePriorPacket.integrity.fingerprint,
      };
      const positiveApplyResponse = await evaluateJson(`(async () => {
        const response = await fetch(
          '/api/vnext/operator/semantic-transition',
          {
            method: 'POST',
            cache: 'no-store',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(${JSON.stringify(positiveApplyRequest)})
          }
        );
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(
        positiveApplyResponse.status,
        201,
        `positive bootstrap application failed: ${JSON.stringify(
          positiveApplyResponse.body,
        )}`,
      );
      assert.equal(positiveApplyResponse.body.status, "applied");
      assert.equal(positiveApplyResponse.body.packet_compiled, true);
      const positiveTransitionReceipt =
        positiveApplyResponse.body.transition_receipt;
      const positiveLaterPacket = positiveApplyResponse.body.later_packet;
      assert(positiveTransitionReceipt);
      assert(positiveLaterPacket);
      assert.equal(
        positiveTransitionReceipt.source_proposal.proposal_id,
        positiveProposal.proposal_id,
      );
      assert.equal(
        positiveTransitionReceipt.source_proposal.proposal_fingerprint,
        positiveProposal.integrity.fingerprint,
      );
      assert.equal(
        positiveTransitionReceipt.source_decision.decision_id,
        positiveDecision.decision_id,
      );
      assert.equal(
        positiveTransitionReceipt.source_decision.decision_fingerprint,
        positiveDecision.integrity.fingerprint,
      );
      assert.equal(
        positiveTransitionReceipt.source_candidate.candidate_id,
        positiveCandidateBinding.candidate_id,
      );
      assert.equal(
        positiveTransitionReceipt.source_candidate.candidate_fingerprint,
        positiveCandidateBinding.candidate_fingerprint,
      );
      assert.equal(positiveLaterPacket.workspace_id, manifest.workspace_id);
      assert.equal(positiveLaterPacket.project_id, positiveProjectId);
      assert.equal(
        positiveLaterPacket.compatibility.source_contracts.includes(
          "vnext_persisted_semantic_context_compiler.v0.1",
        ),
        true,
      );
      assert.equal(
        positiveLaterPacket.compatibility.source_contracts.includes(
          "vnext_bounded_automation_context_compiler.v0.1",
        ),
        false,
        "the real positive Transition packet must remain eligible for workbench durable lineage",
      );
      assert.equal(
        positiveLaterPacket.compatibility.source_refs.some(
          (ref) =>
            ref.ref_type === "task_context_packet" &&
            ref.external_id === positivePriorPacket.packet_id &&
            ref.source_ref ===
              positivePriorPacket.integrity.fingerprint,
        ),
        true,
        "the real positive Transition packet must bind the exact generic prior packet",
      );
      assert.equal(
        positiveLaterPacket.compatibility.source_refs.some(
          (ref) =>
            ref.ref_type === "state_transition_receipt" &&
            ref.external_id ===
              positiveTransitionReceipt.transition_receipt_id &&
            ref.source_ref ===
              positiveTransitionReceipt.integrity.fingerprint,
        ),
        true,
        "the real positive Transition packet must bind the exact authorized Transition",
      );
      result.positive_transition_compiled_eligible_packet = true;
      record("positive_transition_compiled_eligible_packet");

      await navigate(`${appOrigin}${positiveProposalPath}`);
      await waitForCondition(
        `location.pathname === ${JSON.stringify(positiveProposalPath)} && document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null && document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled) option[value=${JSON.stringify(
          positiveCandidateBinding.candidate_id,
        )}]') !== null`,
        "positive bootstrap candidate selector after Transition",
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const selector = document.querySelector(
            '[data-vnext-candidate-selector="v0.1"]'
          );
          if (!(selector instanceof HTMLSelectElement) || selector.disabled) {
            return false;
          }
          selector.value = ${JSON.stringify(
            positiveCandidateBinding.candidate_id,
          )};
          selector.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()`),
        true,
        "the positive applied candidate must remain explicitly selectable",
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(
          positiveCandidateBinding.candidate_id,
        )} && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="project_updated"]') !== null && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
        "positive bootstrap Transition application",
      );
      const afterPositiveTransition =
        readDirectHostBrowserState(positiveProjectId);
      assert.deepEqual(afterPositiveTransition.semantic_authority_counts, {
        ...beforePositiveTransition.semantic_authority_counts,
        semantic_state:
          beforePositiveTransition.semantic_authority_counts.semantic_state + 1,
        decisions:
          beforePositiveTransition.semantic_authority_counts.decisions + 1,
        commit_gates:
          beforePositiveTransition.semantic_authority_counts.commit_gates + 1,
        transitions:
          beforePositiveTransition.semantic_authority_counts.transitions + 1,
        packets:
          beforePositiveTransition.semantic_authority_counts.packets + 1,
      });

      const positiveLineage =
        readVNextOperatorPilotProposalDurableLineageV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(
            positiveRuntimeEnvironment,
          ),
          proposal: positiveProposal,
        });
      assert.equal(positiveLineage.overall_status, "packet_compiled");
      assert.equal(
        positiveLineage.proposal_id,
        positiveProposal.proposal_id,
        "dedicated latest-packet lineage must preserve the exact proposal ID",
      );
      assert.equal(
        positiveLineage.proposal_fingerprint,
        positiveProposal.integrity.fingerprint,
        "dedicated latest-packet lineage must preserve the exact proposal fingerprint",
      );
      const positiveChains = positiveLineage.chains.filter(
        (chain) =>
          chain.stage_status === "packet_compiled" &&
          chain.compiled_packet !== null &&
          chain.transition.receipt_id ===
            positiveTransitionReceipt.transition_receipt_id &&
          chain.transition.receipt_fingerprint ===
            positiveTransitionReceipt.integrity.fingerprint &&
          chain.transition.decision_id ===
            positiveDecision.decision_id &&
          chain.transition.decision_fingerprint ===
            positiveDecision.integrity.fingerprint &&
          chain.transition.candidate_id ===
            positiveCandidateBinding.candidate_id &&
          chain.transition.candidate_fingerprint ===
            positiveCandidateBinding.candidate_fingerprint,
      );
      assert.equal(
        positiveChains.length,
        1,
        "dedicated latest-packet proposal must expose one exact applied chain",
      );
      const positiveChain = positiveChains[0];
      assert.equal(
        positiveChain?.transition.candidate_id,
        positiveCandidateBinding.candidate_id,
        "dedicated latest-packet Transition must preserve the exact candidate ID",
      );
      assert.equal(
        positiveChain?.transition.candidate_fingerprint,
        positiveCandidateBinding.candidate_fingerprint,
        "dedicated latest-packet Transition must preserve the exact candidate fingerprint",
      );
      assert.equal(
        positiveChain?.transition.decision_id,
        positiveDecision.decision_id,
        "dedicated latest-packet Transition must preserve the exact decision ID",
      );
      assert.equal(
        positiveChain?.transition.decision_fingerprint,
        positiveDecision.integrity.fingerprint,
        "dedicated latest-packet Transition must preserve the exact decision fingerprint",
      );
      assert.equal(
        positiveChain?.transition.receipt_id,
        positiveTransitionReceipt.transition_receipt_id,
        "dedicated latest-packet lineage must preserve the exact Transition receipt ID",
      );
      assert.equal(
        positiveChain?.transition.receipt_fingerprint,
        positiveTransitionReceipt.integrity.fingerprint,
        "dedicated latest-packet lineage must preserve the exact Transition receipt fingerprint",
      );
      const positivePacketBinding = positiveChain?.compiled_packet;
      assert(
        positivePacketBinding,
        "dedicated latest-packet compiled packet binding missing",
      );
      const positivePacketRow = database
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'task_context_packet'
             AND project_id = ?
             AND record_id = ?
             AND fingerprint = ?`,
        )
        .get(
          positiveProjectId,
          positivePacketBinding.packet_id,
          positivePacketBinding.packet_fingerprint,
        );
      assert(
        positivePacketRow,
        "dedicated latest-packet compiled packet missing",
      );
      const positivePacket = JSON.parse(positivePacketRow.payload_json);
      assert.equal(positivePacket.packet_id, positiveLaterPacket.packet_id);
      assert.equal(
        positivePacket.integrity.fingerprint,
        positiveLaterPacket.integrity.fingerprint,
      );
      assert.equal(positivePacket.workspace_id, manifest.workspace_id);
      assert.equal(positivePacket.project_id, positiveProjectId);
      assert.equal(
        positivePacket.compatibility.source_contracts.includes(
          "vnext_persisted_semantic_context_compiler.v0.1",
        ),
        true,
      );
      assert.equal(
        positivePacket.compatibility.source_contracts.includes(
          "vnext_bounded_automation_context_compiler.v0.1",
        ),
        false,
        "the positive Transition packet must remain eligible for workbench durable lineage",
      );
      assert.equal(
        positivePacket.compatibility.source_refs.some(
          (ref) =>
            ref.ref_type === "task_context_packet" &&
            ref.external_id === positivePriorPacket.packet_id &&
            ref.source_ref ===
              positivePriorPacket.integrity.fingerprint,
        ),
        true,
        "the positive packet must retain its exact same-project prior-packet lineage",
      );
      assert.equal(
        positivePacket.compatibility.source_refs.some(
          (ref) =>
            ref.ref_type === "state_transition_receipt" &&
            ref.external_id === positiveChain?.transition.receipt_id &&
            ref.source_ref ===
              positiveChain?.transition.receipt_fingerprint,
        ),
        true,
        "the positive packet must retain its exact Transition lineage",
      );
      assert.equal(positiveChain?.compiled_packet?.projection_current, true);
      const positiveContinuityBeforeLater =
        projectVNextOperatorPilotContinuityV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(
            positiveRuntimeEnvironment,
          ),
        });
      assert.equal(
        positiveContinuityBeforeLater.latest_compiled_packet?.packet_id,
        positivePacket.packet_id,
        "positive later-result intake requires the exact selected packet to be latest",
      );
      assert.equal(
        positiveContinuityBeforeLater.latest_compiled_packet
          ?.packet_fingerprint,
        positivePacket.integrity.fingerprint,
        "positive later-result intake requires the latest packet fingerprint to remain exact",
      );
      assert.equal(
        positiveContinuityBeforeLater.packet_currentness,
        "fresh",
        "the positive compiled packet must be fresh before the first real host action",
      );
      assert.equal(
        positiveContinuityBeforeLater.latest_context_use_receipt,
        null,
        "a newly compiled latest packet must not inherit an older packet receipt",
      );
      result.positive_latest_compiled_packet_precondition_passed = true;
      record("positive_latest_compiled_packet_precondition_passed");
      result.positive_proposal_has_one_packet_compiled_chain = true;
      record("positive_proposal_has_one_packet_compiled_chain");

      await navigate(`${appOrigin}${positiveProjectDestination}`);
      await waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Browser Positive Lineage Project')`,
        "positive-lineage project before real later-result intake",
      );
      await openBlankStateProjectOptions();
      await waitForCondition(
        `document.querySelector('[data-direct-host-round-trip="v0.3"] [data-direct-host-action="deterministic"]:not(:disabled)') !== null`,
        "positive-lineage real later-result action",
      );
      const positiveLaterBefore =
        readDirectHostBrowserState(positiveProjectId);
      const positiveLaterResponseStart = responses.length;
      assert.equal(
        await evaluateBoolean(`(() => {
          const button = document.querySelector(
            '[data-direct-host-round-trip="v0.3"] [data-direct-host-action="deterministic"]'
          );
          if (!(button instanceof HTMLButtonElement) || button.disabled) {
            return false;
          }
          button.click();
          return true;
        })()`),
        true,
        "the positive later result must use the real interactive host path",
      );
      await waitForHostCondition(
        () =>
          responses.slice(positiveLaterResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/host-round-trip" &&
              entry.type === "Fetch" &&
              entry.method === "POST",
          ),
        "positive-lineage later host result",
      );
      const positiveLaterResponse = responses
        .slice(positiveLaterResponseStart)
        .find(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.type === "Fetch" &&
            entry.method === "POST",
        );
      assert.equal(positiveLaterResponse?.status, 201);
      await waitForCondition(
        `document.querySelector('[data-direct-host-round-trip-status="completed"]') !== null && document.body.textContent.includes('Result saved')`,
        "positive-lineage real later result",
      );
      const positiveLaterAfter =
        readDirectHostBrowserState(positiveProjectId);
      assert.equal(
        positiveLaterAfter.direct_receipt_count,
        positiveLaterBefore.direct_receipt_count + 1,
      );
      assert.equal(
        positiveLaterAfter.semantic_authority_counts.packets,
        positiveLaterBefore.semantic_authority_counts.packets,
        "the first real positive host action must not compile another packet",
      );
      const positiveLaterReceipt = positiveLaterAfter.latest_receipt;
      assert(
        positiveLaterReceipt,
        "positive latest-packet real later receipt missing",
      );
      assert.equal(
        positiveLaterReceipt.task_context_packet_ref?.external_id,
        positivePacket.packet_id,
      );
      assert.equal(
        positiveLaterReceipt.task_context_packet_ref?.source_ref,
        positivePacket.integrity.fingerprint,
      );
      assert.equal(
        positiveLaterReceipt.compatibility.source_contracts.includes(
          VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01,
        ),
        true,
      );
      assert.equal(
        positiveLaterReceipt.source_refs.some(
          (ref) =>
            ref.ref_type === "state_transition_receipt" &&
            ref.external_id === positiveChain.transition.receipt_id &&
            ref.source_ref ===
              positiveChain.transition.receipt_fingerprint,
        ),
        true,
        "the real later receipt must retain the exact selected Transition binding",
      );
      result.positive_first_real_host_action_used_latest_packet = true;
      record("positive_first_real_host_action_used_latest_packet");
      const positiveContinuityAfterLater =
        projectVNextOperatorPilotContinuityV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(
            positiveRuntimeEnvironment,
          ),
        });
      assert.deepEqual(
        positiveContinuityAfterLater.latest_compiled_packet,
        positiveContinuityBeforeLater.latest_compiled_packet,
        "later-result intake must not create or select another packet",
      );
      assert.equal(
        positiveContinuityAfterLater.latest_context_use_receipt?.receipt_id,
        positiveLaterReceipt.receipt_id,
        "the real continuity producer must recognize the exact latest-packet receipt ID",
      );
      assert.equal(
        positiveContinuityAfterLater.latest_context_use_receipt
          ?.receipt_fingerprint,
        positiveLaterReceipt.integrity.fingerprint,
        "the real continuity producer must recognize the exact latest-packet receipt fingerprint",
      );
      assert.equal(
        positiveContinuityAfterLater.latest_context_use_receipt
          ?.task_context_packet_id,
        positivePacket.packet_id,
        "the real continuity producer must retain the exact latest packet ID",
      );
      assert.equal(
        positiveContinuityAfterLater.latest_context_use_receipt
          ?.task_context_packet_fingerprint,
        positivePacket.integrity.fingerprint,
        "the real continuity producer must retain the exact latest packet fingerprint",
      );
      assert.equal(
        positiveContinuityAfterLater.latest_context_use_review_status,
        null,
        "the positive latest-packet result must remain unreviewed before Browser feedback",
      );
      result.positive_latest_packet_bound_result_recognized = true;
      record("positive_latest_packet_bound_result_recognized");

      await navigate(`${appOrigin}${positiveProposalPath}`);
      await waitForCondition(
        `location.pathname === ${JSON.stringify(positiveProposalPath)} && document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null`,
        "reloaded dedicated latest-packet proposal detail",
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled) option[value=${JSON.stringify(
          positiveCandidateBinding.candidate_id,
        )}]') !== null`,
        "dedicated latest-packet candidate selector",
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const selector = document.querySelector(
            '[data-vnext-candidate-selector="v0.1"]'
          );
          if (!(selector instanceof HTMLSelectElement) || selector.disabled) {
            return false;
          }
          selector.value = ${JSON.stringify(
            positiveCandidateBinding.candidate_id,
          )};
          selector.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()`),
        true,
        "the positive later outcome must remain scoped to the exact applied candidate",
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="later_outcome_available"]') !== null`,
        "exact latest-packet candidate later-outcome timeline",
      );
      const positiveLaterBrowserShape = await evaluateJson(`(() => {
        const detail = document.querySelector(
          '[data-vnext-semantic-review-detail="v0.1"]'
        );
        const feedback = detail?.querySelector(
          '[data-vnext-context-use-feedback]'
        );
        const relationships = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        const relationshipText = relationships?.textContent ?? '';
        return {
          stage: detail?.getAttribute('data-selected-work-current-stage') ?? null,
          feedback:
            feedback?.getAttribute('data-vnext-context-use-feedback') ?? null,
          form:
            feedback?.querySelector(
              '[data-vnext-context-use-review-form="v0.1"]'
            ) !== null,
          question:
            relationships?.getAttribute(
              'data-selected-work-relationship-question'
            ) ?? null,
          highlighted_count:
            relationships?.querySelectorAll(
              '[data-selected-work-relationship-highlighted="true"]'
            ).length ?? -1,
          exact_later_basis:
            relationships?.querySelector(
              '[data-selected-work-relationship-kind="used_by_later_work"][data-selected-work-relationship-basis="later_outcome"][data-selected-work-relationship-support="exact"]'
            ) !== null,
          reviewed_connection_absent:
            relationships?.querySelector(
              '[data-selected-work-relationship-kind="reviewed_by_later_feedback"]'
            ) === null,
          raw_protocol_copy_absent:
            !/(sha256:|episode-delta-proposal:|review-decision:|state-transition-receipt:|task-context-packet:|run-receipt:|TaskContextPacket|RunReceipt)/i.test(
              relationshipText
            ),
          primary_action_count:
            detail?.querySelectorAll('[data-ai-workplane-primary-action]')
              .length ?? -1,
        };
      })()`);
      assert.deepEqual(
        positiveLaterBrowserShape,
        {
          stage: "later_outcome_available",
          feedback: "available",
          form: true,
          question: "project_change_and_later_outcome",
          highlighted_count: 1,
          exact_later_basis: true,
          reviewed_connection_absent: true,
          raw_protocol_copy_absent: true,
          primary_action_count: 0,
        },
        "the dedicated exact Transition later run must remain bounded and optional",
      );
      result.positive_later_outcome_relationship_is_exact = true;
      record("positive_later_outcome_relationship_is_exact");
      await validateSemanticReviewViewports();
      const beforePositiveLaterFeedback =
        readDirectHostBrowserState(positiveProjectId);
      const positiveLaterFeedbackRequestStart = requests.length;
      assert.equal(
        await evaluateBoolean(`(() => {
          const form = document.querySelector('[data-vnext-context-use-review-form="v0.1"]');
          const selects = form?.querySelectorAll('select');
          if (!form || !selects || selects.length !== 2) return false;
          selects[0].value = 'yes';
          selects[0].dispatchEvent(new Event('change', { bubbles: true }));
          selects[1].value = 'helpful';
          selects[1].dispatchEvent(new Event('change', { bubbles: true }));
          const button = Array.from(form.querySelectorAll('button')).find(
            (candidate) => candidate.textContent?.trim() === 'Save feedback'
          );
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          return true;
        })()`),
        true,
      );
      await waitForHostCondition(
        () =>
          readDirectHostBrowserState(positiveProjectId)
            .semantic_authority_counts.context_use_reviews ===
          beforePositiveLaterFeedback.semantic_authority_counts
            .context_use_reviews +
            1,
        "exact latest-packet later-result feedback admission",
      );
      const positiveLaterFeedbackRequests = requests
        .slice(positiveLaterFeedbackRequestStart)
        .filter(
          (request) =>
            request.phase === "multi_candidate_transition_scope" &&
            request.method === "POST" &&
            request.path ===
              "/api/vnext/operator/project-continuity" &&
            requestJsonBody(request)?.action ===
              "record_context_use_review",
        );
      assert.equal(positiveLaterFeedbackRequests.length, 1);
      const positiveLaterFeedbackRequest =
        positiveLaterFeedbackRequests[0];
      assert.deepEqual(requestJsonBody(positiveLaterFeedbackRequest), {
        action: "record_context_use_review",
        later_run_receipt_id: positiveLaterReceipt.receipt_id,
        later_run_receipt_fingerprint:
          positiveLaterReceipt.integrity.fingerprint,
        actually_used: "yes",
        assessment: "helpful",
        correction_summaries: [],
        notes: [],
        metrics: {
          wrong_context_correction_count: 0,
          repeated_explanation_estimate: null,
          missing_critical_context_count: 0,
          context_refs_used_count: 1,
        },
      });
      expectedPositiveContextUseReviewRequestId =
        positiveLaterFeedbackRequest.request_id;
      const positiveReviewedContinuity =
        projectVNextOperatorPilotContinuityV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(
            positiveRuntimeEnvironment,
          ),
        });
      assert.equal(
        positiveReviewedContinuity.latest_context_use_review_status
          ?.later_task_run_receipt_id,
        positiveLaterReceipt.receipt_id,
        "the real continuity producer must bind feedback to the exact latest-packet later result",
      );
      assert.equal(
        positiveReviewedContinuity.latest_context_use_review_status
          ?.later_task_run_receipt_fingerprint,
        positiveLaterReceipt.integrity.fingerprint,
        "the real continuity producer must preserve the exact reviewed receipt fingerprint",
      );
      assert.equal(
        positiveReviewedContinuity.latest_context_use_receipt
          ?.task_context_packet_id,
        positivePacket.packet_id,
        "the reviewed later result must remain bound to the exact latest packet ID",
      );
      assert.equal(
        positiveReviewedContinuity.latest_context_use_receipt
          ?.task_context_packet_fingerprint,
        positivePacket.integrity.fingerprint,
        "the reviewed later result must remain bound to the exact latest packet fingerprint",
      );
      const positiveReviewRows = database
        .prepare(
          `SELECT payload_json
           FROM vnext_core_records
           WHERE record_kind = 'context_use_review'
             AND project_id = ?`,
        )
        .all(positiveProjectId)
        .map((row) => JSON.parse(row.payload_json))
        .filter(
          (review) =>
            review.later_task_run_receipt?.receipt_id ===
              positiveLaterReceipt.receipt_id &&
            review.later_task_run_receipt?.receipt_fingerprint ===
              positiveLaterReceipt.integrity.fingerprint,
        );
      assert.equal(
        positiveReviewRows.length,
        1,
        "the positive review must bind one exact later receipt",
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled) option[value=${JSON.stringify(
          positiveCandidateBinding.candidate_id,
        )}]') !== null`,
        "exact reviewed latest-packet candidate selector",
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const selector = document.querySelector(
            '[data-vnext-candidate-selector="v0.1"]'
          );
          if (!(selector instanceof HTMLSelectElement) || selector.disabled) {
            return false;
          }
          selector.value = ${JSON.stringify(
            positiveCandidateBinding.candidate_id,
          )};
          selector.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()`),
        true,
        "the reviewed latest-packet outcome must remain scoped to the exact applied candidate",
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="later_outcome_reviewed"] [data-context-use-review-actually-used-basis="user_declaration"][data-context-use-review-presentation-basis]') !== null`,
        "exact latest-packet later-result feedback provenance",
      );
      assert.equal(
        await evaluateBoolean(`(() => {
          const detail = document.querySelector(
            '[data-vnext-semantic-review-detail="v0.1"]'
          );
          const relationships = detail?.querySelector(
            '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
          );
          return detail?.getAttribute(
              'data-selected-work-primary-action-owner'
            ) === 'candidate_selection' &&
            detail.querySelectorAll('[data-ai-workplane-primary-action]')
              .length === 1 &&
            relationships?.getAttribute(
              'data-selected-work-relationship-question'
            ) === 'project_change_and_later_outcome' &&
            relationships.querySelectorAll(
              '[data-selected-work-relationship-highlighted="true"]'
            ).length === 1 &&
            relationships.querySelector(
              '[data-selected-work-relationship-kind="reviewed_by_later_feedback"][data-selected-work-relationship-basis="later_outcome"][data-selected-work-relationship-support="exact"]'
            ) !== null;
        })()`),
        true,
        "the exact later-result review must preserve one exact feedback connection and one action owner",
      );
      const afterPositiveLaterFeedback =
        readDirectHostBrowserState(positiveProjectId);
      assert.deepEqual(afterPositiveLaterFeedback.semantic_authority_counts, {
        ...beforePositiveLaterFeedback.semantic_authority_counts,
        context_use_reviews:
          beforePositiveLaterFeedback.semantic_authority_counts
            .context_use_reviews + 1,
      });
      record("selected_work_relationship_exposes_exact_later_feedback_review");
      await validateSemanticReviewViewports();

      const positiveActiveSnapshot = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/projects', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin'
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(positiveActiveSnapshot.status, 200);
      assert.equal(positiveActiveSnapshot.body.ok, true);
      const positiveRecentProjects =
        positiveActiveSnapshot.body.recent_projects;
      assert(Array.isArray(positiveRecentProjects));
      const positiveActiveEntries = positiveRecentProjects.filter(
        (entry) => entry.is_active,
      );
      assert.equal(
        positiveActiveEntries.length,
        1,
        "the positive project snapshot must expose exactly one active project",
      );
      const positiveActiveEntry = positiveActiveEntries[0];
      const mixedBeforeRestore = positiveRecentProjects.find(
        (entry) => entry.project?.project_id === manifest.project_id,
      );
      const positiveBeforeRestore = positiveRecentProjects.find(
        (entry) => entry.project?.project_id === positiveProjectId,
      );
      assert(mixedBeforeRestore, "mixed project must remain registered");
      assert(positiveBeforeRestore, "positive project must remain registered");
      assert.equal(
        positiveActiveEntry.project.project_id,
        positiveProjectId,
      );
      assert.equal(
        positiveActiveEntry.active_project_id,
        positiveProjectId,
      );
      assert.equal(
        positiveBeforeRestore.root_availability,
        "available",
      );
      assert.equal(mixedBeforeRestore.root_availability, "available");
      const positiveActiveProjectId = positiveProjectId;
      const positiveActiveRevision =
        positiveActiveEntry.active_selection_revision;
      assert.equal(
        Number.isSafeInteger(positiveActiveRevision) &&
          positiveActiveRevision > 0,
        true,
        "the positive active-project revision must be a positive safe integer",
      );
      record("positive_project_active_snapshot_read");

      const mixedOpenResponse = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/projects', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'open',
            project_id: ${JSON.stringify(manifest.project_id)},
            expected_project_id: ${JSON.stringify(positiveActiveProjectId)},
            expected_revision: ${JSON.stringify(positiveActiveRevision)}
          })
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(
        mixedOpenResponse.status,
        200,
        `mixed project open failed: ${JSON.stringify(
          mixedOpenResponse.body,
        )}`,
      );
      assert.equal(mixedOpenResponse.body.ok, true);
      const mixedOpenResult = mixedOpenResponse.body.result;
      assert.equal(mixedOpenResult.project.project_id, manifest.project_id);
      assert.equal(mixedOpenResult.selection.project_id, manifest.project_id);
      assert.equal(
        mixedOpenResult.selection.workspace_id,
        manifest.workspace_id,
      );
      assert.equal(
        mixedOpenResult.selection.selection_revision,
        positiveActiveRevision + 1,
      );
      assert.notEqual(
        parseStrictIsoTimestampV01(
          mixedOpenResult.selection.selected_at,
        ),
        null,
        "mixed project activation must expose an exact protocol timestamp",
      );
      assert.equal(
        mixedOpenResult.destination,
        `/projects/${encodeURIComponent(manifest.project_id)}`,
      );
      record("mixed_project_open_mutation_succeeded");

      const mixedActiveReadback = await evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/projects', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin'
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(mixedActiveReadback.status, 200);
      assert.equal(mixedActiveReadback.body.ok, true);
      const restoredRecentProjects =
        mixedActiveReadback.body.recent_projects;
      assert(Array.isArray(restoredRecentProjects));
      assert.equal(
        restoredRecentProjects.length,
        positiveRecentProjects.length,
        "project activation must not remove a recent project",
      );
      const restoredActiveEntries = restoredRecentProjects.filter(
        (entry) => entry.is_active,
      );
      assert.equal(
        restoredActiveEntries.length,
        1,
        "mixed project readback must expose exactly one active project",
      );
      const restoredMixedEntry = restoredRecentProjects.find(
        (entry) => entry.project?.project_id === manifest.project_id,
      );
      const restoredPositiveEntry = restoredRecentProjects.find(
        (entry) => entry.project?.project_id === positiveProjectId,
      );
      assert(restoredMixedEntry);
      assert(restoredPositiveEntry);
      assert.equal(restoredMixedEntry.is_active, true);
      assert.equal(restoredPositiveEntry.is_active, false);
      assert.equal(
        restoredActiveEntries[0].project.project_id,
        manifest.project_id,
      );
      assert.equal(
        restoredActiveEntries[0].active_project_id,
        manifest.project_id,
      );
      assert.equal(
        restoredActiveEntries[0].active_selection_revision,
        mixedOpenResult.selection.selection_revision,
      );
      assert.equal(restoredMixedEntry.root_availability, "available");
      assert.equal(restoredPositiveEntry.root_availability, "available");
      assert.deepEqual(
        restoredMixedEntry.project,
        mixedBeforeRestore.project,
        "mixed project identity must not change during activation",
      );
      assert.deepEqual(
        restoredMixedEntry.local_root,
        mixedBeforeRestore.local_root,
        "mixed project root must not be rebound during activation",
      );
      assert.deepEqual(
        restoredPositiveEntry.project,
        positiveBeforeRestore.project,
        "positive project identity must remain registered",
      );
      assert.deepEqual(
        restoredPositiveEntry.local_root,
        positiveBeforeRestore.local_root,
        "positive project root must not be rebound during mixed activation",
      );
      record("mixed_project_active_readback_confirmed");
      assert(
        mixedReturnTarget,
        "the exact mixed return target must be captured before positive-project work",
      );
      assert.equal(
        mixedReturnTarget.workspace_id,
        manifest.workspace_id,
      );
      assert.equal(
        mixedReturnTarget.project_id,
        manifest.project_id,
      );
      assert.notEqual(
        mixedGenericValidationProposalId,
        mixedReturnTarget.proposal_id,
        "the generic validation proposal must remain excluded after mixed-project restoration",
      );

      await navigate(`${appOrigin}${mixedOpenResult.destination}`);
      await waitForCondition(
        `location.pathname === ${JSON.stringify(
          mixedOpenResult.destination,
        )} && document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null`,
        "mixed-lineage project active after production open",
      );
      await navigate("about:blank");
      await terminateProcess(serverProcess, 15_000);
      serverProcess = null;
      startDevServer(runtimeEnvironment);
      await waitForHttp(
        `${appOrigin}/workbench/semantic-review`,
        DEFAULT_TIMEOUT_MS,
      );
      registerExpectedSessionRefusal({
        tokenId: STALE_MIXED_SESSION_REFUSAL_TOKEN,
        status: 403,
        chromeLogText:
          "Failed to load resource: the server responded with a status of 403 (Forbidden)",
      });
      await navigate(`${appOrigin}/workbench/semantic-review`);
      await waitForCondition(
        `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
        "locked mixed-lineage operator session after positive project",
      );
      bootstrapToken = await issueBootstrap(runtimeEnvironment);
      await setBootstrapInput(bootstrapToken);
      assert.equal(
        await evaluateBoolean(`(() => {
          const form = document.querySelector(
            '#vnext-operator-bootstrap-token'
          )?.closest('form');
          if (!form) return false;
          form.requestSubmit();
          return true;
        })()`),
        true,
      );
      await waitForCondition(
        `document.querySelector('[data-vnext-operator-session="authenticated"]') !== null`,
        "reauthenticated mixed-lineage operator session",
      );
      assert.equal(
        await evaluateBoolean(
          `document.documentElement.innerHTML.includes(${JSON.stringify(
            bootstrapToken,
          )})`,
        ),
        false,
      );
      assert.equal(serverLog.includes(bootstrapToken), false);
      bootstrapToken = null;

      const mixedReturnRouteReadback = await evaluateJson(`(async () => {
        const [sessionResponse, detailResponse, projectsResponse] =
          await Promise.all([
          fetch('/api/vnext/operator/session', {
            cache: 'no-store',
            credentials: 'same-origin'
          }),
          fetch(
            '/api/vnext/operator/semantic-review?' + new URLSearchParams({
              proposal_id: ${JSON.stringify(
                mixedReturnTarget.proposal_id,
              )}
            }),
            { cache: 'no-store', credentials: 'same-origin' }
          ),
          fetch('/api/vnext/projects', {
            cache: 'no-store',
            credentials: 'same-origin'
          })
        ]);
        const sessionBody = await sessionResponse.json();
        const detailBody = await detailResponse.json();
        const projectsBody = await projectsResponse.json();
        return {
          session_status: sessionResponse.status,
          session: sessionBody,
          detail_status: detailResponse.status,
          detail: detailBody,
          projects_status: projectsResponse.status,
          projects: projectsBody
        };
      })()`);
      assert.equal(mixedReturnRouteReadback.session_status, 200);
      assert.equal(mixedReturnRouteReadback.session.ok, true);
      assert.equal(
        mixedReturnRouteReadback.session.status,
        "authenticated",
      );
      const mixedReturnCurrentSessionId =
        mixedReturnRouteReadback.session.session?.session_id;
      assert.equal(typeof mixedReturnCurrentSessionId, "string");
      assert.notEqual(
        mixedReturnCurrentSessionId,
        mixedReturnTarget.unapplied_candidate
          .decision_session_id,
        "the restored mixed runtime must authenticate a new local operator session",
      );
      await waitForExpectedRefusalSettlement(
        STALE_MIXED_SESSION_REFUSAL_TOKEN,
        "mixed-project stale-session refusal and recovery",
      );
      assert.equal(mixedReturnRouteReadback.detail_status, 200);
      assert.equal(mixedReturnRouteReadback.projects_status, 200);
      assert.equal(mixedReturnRouteReadback.detail.ok, true);
      assert.equal(mixedReturnRouteReadback.projects.ok, true);
      assert.equal(
        mixedReturnRouteReadback.detail.project.workspace_id,
        mixedReturnTarget.workspace_id,
      );
      assert.equal(
        mixedReturnRouteReadback.detail.project.project_id,
        mixedReturnTarget.project_id,
      );
      const mixedReturnRead =
        mixedReturnRouteReadback.detail.proposal;
      assert.equal(
        mixedReturnRead.proposal.proposal_id,
        mixedReturnTarget.proposal_id,
      );
      assert.equal(
        mixedReturnRead.proposal.integrity.fingerprint,
        mixedReturnTarget.proposal_fingerprint,
      );
      const exactMixedReturnCandidate = (binding) =>
        mixedReturnRead.candidates.find(
          (candidate) =>
            candidate.candidate.candidate_id ===
              binding.candidate_id &&
            candidate.candidate_fingerprint ===
              binding.candidate_fingerprint,
        ) ?? null;
      const mixedAppliedCandidate = exactMixedReturnCandidate(
        mixedReturnTarget.applied_candidate,
      );
      const mixedUnappliedCandidate = exactMixedReturnCandidate(
        mixedReturnTarget.unapplied_candidate,
      );
      assert(mixedAppliedCandidate);
      assert(mixedUnappliedCandidate);
      const exactMixedReturnDecisionEntry = (binding) =>
        mixedReturnRead.decision_history.find(
          (entry) =>
            entry.status === "valid" &&
            entry.pilot_session_bound &&
            entry.decision.source_proposal.proposal_id ===
              mixedReturnTarget.proposal_id &&
            entry.decision.source_proposal.proposal_fingerprint ===
              mixedReturnTarget.proposal_fingerprint &&
            entry.decision.candidate.candidate_id ===
              binding.candidate_id &&
            entry.decision.candidate.candidate_fingerprint ===
              binding.candidate_fingerprint &&
            entry.decision.decision_id === binding.decision_id &&
            entry.decision.integrity.fingerprint ===
              binding.decision_fingerprint,
        ) ?? null;
      const mixedAppliedDecisionEntry =
        exactMixedReturnDecisionEntry(
          mixedReturnTarget.applied_candidate,
        );
      const mixedUnappliedDecisionEntry =
        exactMixedReturnDecisionEntry(
          mixedReturnTarget.unapplied_candidate,
        );
      assert(mixedAppliedDecisionEntry);
      assert(mixedUnappliedDecisionEntry);
      const mixedAppliedReceipt =
        mixedReturnRead.transition_receipts.find(
          (receipt) =>
            receipt.source_proposal.proposal_id ===
              mixedReturnTarget.proposal_id &&
            receipt.source_proposal.proposal_fingerprint ===
              mixedReturnTarget.proposal_fingerprint &&
            receipt.source_candidate.candidate_id ===
              mixedReturnTarget.applied_candidate.candidate_id &&
            receipt.source_candidate.candidate_fingerprint ===
              mixedReturnTarget.applied_candidate
                .candidate_fingerprint &&
            receipt.source_decision.decision_id ===
              mixedReturnTarget.applied_candidate.decision_id &&
            receipt.source_decision.decision_fingerprint ===
              mixedReturnTarget.applied_candidate
                .decision_fingerprint &&
            receipt.transition_receipt_id ===
              mixedReturnTarget.applied_candidate
                .transition_receipt_id &&
            receipt.integrity.fingerprint ===
              mixedReturnTarget.applied_candidate
                .transition_receipt_fingerprint,
        ) ?? null;
      assert(
        mixedAppliedReceipt,
        "the applied mixed candidate must retain its exact durable Transition proof",
      );
      assert.equal(
        mixedReturnRead.transition_receipts.some(
          (receipt) =>
            receipt.source_proposal.proposal_id ===
              mixedReturnTarget.proposal_id &&
            receipt.source_proposal.proposal_fingerprint ===
              mixedReturnTarget.proposal_fingerprint &&
            receipt.source_candidate.candidate_id ===
              mixedReturnTarget.unapplied_candidate.candidate_id &&
            receipt.source_candidate.candidate_fingerprint ===
              mixedReturnTarget.unapplied_candidate
                .candidate_fingerprint &&
            receipt.source_decision.decision_id ===
              mixedReturnTarget.unapplied_candidate.decision_id &&
            receipt.source_decision.decision_fingerprint ===
              mixedReturnTarget.unapplied_candidate
                .decision_fingerprint,
        ),
        false,
        "the unapplied mixed candidate must not acquire another candidate's receipt",
      );
      assert.equal(mixedUnappliedDecisionEntry.status, "valid");
      assert.equal(
        mixedUnappliedDecisionEntry.pilot_session_bound,
        true,
      );
      assert.equal(
        mixedUnappliedDecisionEntry.session_id,
        mixedReturnTarget.unapplied_candidate
          .decision_session_id,
      );
      assert.equal(
        mixedUnappliedDecisionEntry.pilot_actionable,
        false,
        "the prior-session applying decision must not retain current-session Transition authority",
      );
      const mixedDetailActiveEntries =
        mixedReturnRouteReadback.projects.recent_projects.filter(
          (entry) => entry.is_active,
        );
      assert.equal(mixedDetailActiveEntries.length, 1);
      assert.equal(
        mixedDetailActiveEntries[0].project.project_id,
        manifest.project_id,
      );
      assert.equal(
        mixedDetailActiveEntries[0].active_selection_revision,
        mixedOpenResult.selection.selection_revision,
      );
      const positiveRouteIdentifiers = [
        positiveProposal.proposal_id,
        positiveProposal.integrity.fingerprint,
        positiveCandidateBinding.candidate_id,
        positiveCandidateBinding.candidate_fingerprint,
        positiveDecision.decision_id,
        positiveDecision.integrity.fingerprint,
        positiveTransitionReceipt.transition_receipt_id,
        positiveTransitionReceipt.integrity.fingerprint,
        positivePacket.packet_id,
        positivePacket.integrity.fingerprint,
        positiveLaterReceipt.receipt_id,
        positiveLaterReceipt.integrity.fingerprint,
        positiveReviewRows[0]?.review_id,
        positiveReviewRows[0]?.integrity?.fingerprint,
      ].filter(Boolean);
      const mixedReturnRoutePayload = JSON.stringify(
        mixedReturnRead,
      );
      assert.equal(
        positiveRouteIdentifiers.some((identifier) =>
          mixedReturnRoutePayload.includes(identifier),
        ),
        false,
        "the exact mixed proposal read must exclude every positive-project binding",
      );
      assert.equal(
        mixedReturnRoutePayload.includes(
          mixedGenericValidationProposalId,
        ),
        false,
        "the generic validation proposal must not appear in the captured multi-candidate read",
      );

      const mixedReturnPath =
        `/workbench/semantic-review/${mixedReturnTarget.proposal_id.replace(
          ":",
          "~",
        )}`;
      await navigate(`${appOrigin}${mixedReturnPath}`);
      await waitForCondition(
        `location.pathname === ${JSON.stringify(
          mixedReturnPath,
        )} && document.querySelector('[data-vnext-semantic-review-state="authenticated_loaded"]') !== null && document.querySelector('[data-ai-workplane-shell="v0.1"]') !== null && document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
        "exact captured mixed proposal detail after session restart",
      );
      record("mixed_project_detail_reloaded_after_activation");

      const selectMixedReturnCandidate = async (
        binding,
        expectedStage,
      ) => {
        await waitForCondition(
          `document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled) option[value=${JSON.stringify(
            binding.candidate_id,
          )}]') !== null`,
          `mixed return candidate ${binding.candidate_id} option`,
        );
        assert.equal(
          await evaluateBoolean(`(() => {
            const selector = document.querySelector(
              '[data-vnext-candidate-selector="v0.1"]'
            );
            if (
              !(selector instanceof HTMLSelectElement) ||
              selector.disabled
            ) {
              return false;
            }
            selector.value = ${JSON.stringify(binding.candidate_id)};
            selector.dispatchEvent(
              new Event('change', { bubbles: true })
            );
            return true;
          })()`),
          true,
        );
        await waitForCondition(
          `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(
            binding.candidate_id,
          )} && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage=${JSON.stringify(
            expectedStage,
          )}]') !== null && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
          `mixed return candidate ${binding.candidate_id} ${expectedStage}`,
        );
      };

      const mixedAppliedTimeline = buildSelectedWorkTimelineV01({
        read: mixedReturnRead,
        selected_candidate: mixedAppliedCandidate,
      });
      assert.equal(
        mixedAppliedTimeline.current_position.stage,
        "project_updated",
      );
      await selectMixedReturnCandidate(
        mixedReturnTarget.applied_candidate,
        "project_updated",
      );
      const mixedAppliedReturnShape = await evaluateJson(`(() => {
        const detail = document.querySelector(
          '[data-vnext-semantic-review-detail="v0.1"]'
        );
        const relationships = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        const relationshipText = relationships?.textContent ?? '';
        const normalCopy = detail?.innerText ?? '';
        const positiveIdentifiers = ${JSON.stringify(
          positiveRouteIdentifiers,
        )};
        return {
          selected_candidate:
            detail?.querySelector(
              '[data-vnext-candidate-selector="v0.1"]'
            )?.value ?? null,
          stage:
            detail?.getAttribute('data-selected-work-current-stage') ?? null,
          primary_action_owner:
            detail?.getAttribute(
              'data-selected-work-primary-action-owner'
            ) ?? null,
          question:
            relationships?.getAttribute(
              'data-selected-work-relationship-question'
            ) ?? null,
          highlight_count:
            relationships?.querySelectorAll(
              '[data-selected-work-relationship-highlighted="true"]'
            ).length ?? -1,
          authorized_change:
            relationships?.querySelector(
              '[data-selected-work-relationship-kind="applied_as"][data-selected-work-relationship-basis="authorized_project_change"][data-selected-work-relationship-highlighted="true"]'
            ) !== null,
          positive_project_copy_absent:
            !relationshipText.includes('Browser Positive Lineage Project') &&
            !relationshipText.includes(${JSON.stringify(
              positiveCandidate.title,
            )}) &&
            positiveIdentifiers.every(
              (identifier) => !normalCopy.includes(identifier)
            ),
          raw_protocol_copy_absent:
            !/(sha256:|episode-delta-proposal:|review-decision:|state-transition-receipt:|task-context-packet:|run-receipt:|TaskContextPacket|RunReceipt)/i.test(
              normalCopy
            ),
          primary_action_count:
            detail?.querySelectorAll(
              '[data-ai-workplane-primary-action]'
            ).length ?? -1,
        };
      })()`);
      assert.deepEqual(mixedAppliedReturnShape, {
        selected_candidate:
          mixedReturnTarget.applied_candidate.candidate_id,
        stage: "project_updated",
        primary_action_owner: "candidate_selection",
        question: "decision_and_project_change",
        highlight_count: 1,
        authorized_change: true,
        positive_project_copy_absent: true,
        raw_protocol_copy_absent: true,
        primary_action_count: 1,
      });
      record("mixed_applied_candidate_survives_session_restart");

      const mixedUnappliedTimeline =
        buildSelectedWorkTimelineV01({
          read: mixedReturnRead,
          selected_candidate: mixedUnappliedCandidate,
        });
      assert.equal(
        mixedUnappliedTimeline.current_position.stage,
        "decision_recorded",
      );
      assert.equal(
        mixedUnappliedTimeline.current_position
          .primary_action_owner,
        "decision",
      );
      await selectMixedReturnCandidate(
        mixedReturnTarget.unapplied_candidate,
        "decision_recorded",
      );
      const mixedUnappliedReturnShape = await evaluateJson(`(() => {
        const detail = document.querySelector(
          '[data-vnext-semantic-review-detail="v0.1"]'
        );
        const relationships = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        const normalCopy = detail?.innerText ?? '';
        const relationshipText = relationships?.innerText ?? '';
        const positiveIdentifiers = ${JSON.stringify(
          positiveRouteIdentifiers,
        )};
        return {
          selected_candidate:
            detail?.querySelector(
              '[data-vnext-candidate-selector="v0.1"]'
            )?.value ?? null,
          stage:
            detail?.getAttribute(
              'data-selected-work-current-stage'
            ) ?? null,
          primary_action_owner:
            detail?.getAttribute(
              'data-selected-work-primary-action-owner'
            ) ?? null,
          question:
            relationships?.getAttribute(
              'data-selected-work-relationship-question'
            ) ?? null,
          highlighted_count:
            relationships?.querySelectorAll(
              '[data-selected-work-relationship-highlighted="true"]'
            ).length ?? -1,
          historical_decision:
            relationships?.querySelector(
              '[data-selected-work-relationship-kind="decided_by"][data-selected-work-relationship-basis="user_decision"]'
            ) !== null &&
            detail?.querySelector(
              '[data-vnext-decision-history="v0.1"]'
            ) !== null,
          current_review_required:
            /current review required/i.test(normalCopy),
          transition_actions_absent:
            detail?.querySelector(
              '[data-vnext-semantic-transition-actions="v0.1"]'
            ) === null,
          transition_blocked_absent:
            !normalCopy.includes('Project update blocked'),
          applied_candidate_answer_absent:
            !relationshipText.includes(
              ${JSON.stringify(
                mixedAppliedCandidate.candidate.title,
              )}
            ),
          positive_project_copy_absent:
            !relationshipText.includes('Browser Positive Lineage Project') &&
            !relationshipText.includes(${JSON.stringify(
              positiveCandidate.title,
            )}) &&
            positiveIdentifiers.every(
              (identifier) => !normalCopy.includes(identifier)
            ),
          raw_protocol_copy_absent:
            !/(sha256:|episode-delta-proposal:|review-decision:|state-transition-receipt:|task-context-packet:|run-receipt:|TaskContextPacket|RunReceipt)/i.test(
              normalCopy
            ),
          primary_action_count:
            detail?.querySelectorAll(
              '[data-ai-workplane-primary-action]'
            ).length ?? -1,
        };
      })()`);
      assert.deepEqual(mixedUnappliedReturnShape, {
        selected_candidate:
          mixedReturnTarget.unapplied_candidate.candidate_id,
        stage: "decision_recorded",
        primary_action_owner: "decision",
        question: "candidate_and_decision",
        highlighted_count: 1,
        historical_decision: true,
        current_review_required: true,
        transition_actions_absent: true,
        transition_blocked_absent: true,
        applied_candidate_answer_absent: true,
        positive_project_copy_absent: true,
        raw_protocol_copy_absent: true,
        primary_action_count: 1,
      });
      record("mixed_unapplied_candidate_loses_current_session_actionability");
      record("mixed_prior_session_decision_remains_visible");
      record("mixed_return_relationships_rebuilt_without_positive_leak");
      const mixedContinuityAfterPositive =
        projectVNextOperatorPilotContinuityV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(runtimeEnvironment),
        });
      assert.equal(
        mixedContinuityAfterPositive.latest_compiled_packet?.packet_id,
        mixedLatestPacket.packet_id,
      );
      assert.equal(
        mixedContinuityAfterPositive.latest_compiled_packet
          ?.packet_fingerprint,
        mixedLatestPacket.integrity.fingerprint,
      );
      assert.notEqual(
        mixedContinuityAfterPositive.latest_context_use_receipt?.receipt_id,
        exactLaterReceipt.receipt_id,
        "the mixed project must retain the older-packet negative contract",
      );
      assert.equal(
        exactLaterLineage.chains.some(
          (chain) =>
            chain.compiled_packet?.packet_id ===
              mixedBoundedAutomationPacket.packet_id &&
            chain.compiled_packet?.packet_fingerprint ===
              mixedBoundedAutomationPacket.integrity.fingerprint,
        ),
        false,
        "the mixed bounded-automation packet must remain excluded after project restoration",
      );
      const positiveContinuityAfterReturn =
        projectVNextOperatorPilotContinuityV01(database, {
          config: readVNextLocalOperatorPilotConfigV01(
            positiveRuntimeEnvironment,
          ),
        });
      assert.equal(
        positiveContinuityAfterReturn.latest_compiled_packet?.packet_id,
        positivePacket.packet_id,
      );
      assert.equal(
        positiveContinuityAfterReturn.latest_context_use_receipt?.receipt_id,
        positiveLaterReceipt.receipt_id,
      );
      assert.equal(
        positiveContinuityAfterReturn.latest_context_use_review_status
          ?.later_task_run_receipt_id,
        positiveLaterReceipt.receipt_id,
      );
      result.positive_and_mixed_projects_remain_isolated = true;
      record("positive_and_mixed_projects_remain_isolated");
    };

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
        const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]') && candidate.textContent?.includes('Queue bounded project verification'));
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
        const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]') && candidate.textContent?.includes('Run one bounded cycle'));
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
        const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]') && candidate.querySelector('[data-blank-state-automation-run="review_needed"]'));
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
    const boundedAutomationContinuity =
      projectVNextOperatorPilotContinuityV01(database, {
        config: readVNextLocalOperatorPilotConfigV01(runtimeEnvironment),
      });
    assert(
      boundedAutomationContinuity.latest_compiled_packet,
      "bounded automation must expose its exact current compiled packet",
    );
    const boundedAutomationPacketRow = database
      .prepare(
        `SELECT payload_json
         FROM vnext_core_records
         WHERE record_kind = 'task_context_packet'
           AND project_id = ?
           AND record_id = ?
           AND fingerprint = ?`,
      )
      .get(
        manifest.project_id,
        boundedAutomationContinuity.latest_compiled_packet.packet_id,
        boundedAutomationContinuity.latest_compiled_packet
          .packet_fingerprint,
      );
    assert(
      boundedAutomationPacketRow,
      "bounded automation current packet missing",
    );
    const boundedAutomationPacket = JSON.parse(
      boundedAutomationPacketRow.payload_json,
    );
    assert.equal(
      boundedAutomationPacket.compatibility.source_contracts.includes(
        "vnext_bounded_automation_context_compiler.v0.1",
      ),
      true,
      "the captured mixed packet must carry the bounded-automation compiler contract",
    );
    mixedBoundedAutomationPacketTarget = {
      packet_id: boundedAutomationPacket.packet_id,
      packet_fingerprint:
        boundedAutomationPacket.integrity.fingerprint,
    };
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
    mixedGenericValidationProposalId =
      boundedReviewProposalHref.split("/").at(-1)?.replace("~", ":") ??
      null;
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
      "project-level later-run feedback form",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        const relationships = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        return !['later_outcome_available', 'later_outcome_reviewed'].includes(
            detail?.getAttribute('data-selected-work-current-stage') ?? ''
          ) &&
          relationships?.querySelector(
            '[data-selected-work-relationship-kind="used_by_later_work"]'
          ) === null &&
          relationships?.querySelector(
            '[data-selected-work-relationship-kind="reviewed_by_later_feedback"]'
          ) === null;
      })()`),
      true,
      "a later result from a newer independently compiled packet must not attach to the selected Transition timeline",
    );
    record("selected_work_relationship_suppresses_newer_packet_without_exact_transition_lineage");
    await validateSemanticReviewViewports();
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
    assert.equal(
      await evaluateBoolean(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        const relationships = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        return !['later_outcome_available', 'later_outcome_reviewed'].includes(
            detail?.getAttribute('data-selected-work-current-stage') ?? ''
          ) &&
          relationships?.querySelector(
            '[data-selected-work-relationship-kind="used_by_later_work"], [data-selected-work-relationship-kind="reviewed_by_later_feedback"]'
          ) === null;
      })()`),
      true,
      "feedback about a newer independently compiled packet must not retroactively attach to the selected Transition",
    );
    record("selected_work_relationship_keeps_mismatched_packet_feedback_out_of_selected_timeline");
    await validateSemanticReviewViewports();
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

  if (RUN_CONTINUITY_SCOPE || RUN_CORE_SCOPE) {
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
    const blockedAfterApplicationProject = {
      ...currentMultiCandidateProject,
      fixture_id: "semantic-review-loop-blocked-after-application",
      run_id: "run:operator-browser-blocked-after-application",
    };
    const blockedAfterApplicationReceipt =
      buildSemanticReviewLoopRunReceiptFixture(
        blockedAfterApplicationProject,
        currentPacket,
        { timeline_anchor_at: currentPacket.generated_at },
      );
    const blockedAfterApplicationProposal =
      buildSemanticReviewLoopProposalFixture(
        blockedAfterApplicationProject,
        currentPacket,
        blockedAfterApplicationReceipt,
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
        admitStructuredRunReceiptV01(
          writableMultiCandidateDatabase,
          blockedAfterApplicationReceipt,
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
        insertVNextCoreRecordV01(writableMultiCandidateDatabase, {
          record_kind: "episode_delta_proposal",
          record_id: blockedAfterApplicationProposal.proposal_id,
          workspace_id: blockedAfterApplicationProposal.workspace_id,
          project_id: blockedAfterApplicationProposal.project_id,
          fingerprint: blockedAfterApplicationProposal.integrity.fingerprint,
          idempotency_key: null,
          payload: blockedAfterApplicationProposal,
          created_at: blockedAfterApplicationProposal.created_at,
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
    const candidateOptions = await evaluateJson(`(() => {
      const select = document.querySelector('[data-vnext-candidate-selector="v0.1"]');
      if (!(select instanceof HTMLSelectElement)) return [];
      return Array.from(select.options).map((option) => ({
        candidate_id: option.value,
        title: option.textContent?.split(' · ')[0]?.trim() ?? '',
      }));
    })()`);
    const candidateIds = candidateOptions.map((option) => option.candidate_id);
    assert.equal(candidateIds.length, 2);
    assert.notEqual(candidateIds[0], candidateIds[1]);
    const [candidateA, candidateB] = candidateIds;
    const candidateATitle = candidateOptions[0].title;
    const candidateBTitle = candidateOptions[1].title;
    assert.notEqual(candidateATitle, candidateBTitle);
    const candidateARecord =
      currentMultiCandidateProposal.proposed_deltas.find(
        (candidate) => candidate.candidate_id === candidateA,
      );
    const candidateBRecord =
      currentMultiCandidateProposal.proposed_deltas.find(
        (candidate) => candidate.candidate_id === candidateB,
      );
    assert(candidateARecord, "candidate A fixture missing");
    assert(candidateBRecord, "candidate B fixture missing");
    const candidateAFingerprint =
      createEpisodeDeltaCandidateFingerprintV01(candidateARecord);
    const candidateBFingerprint =
      createEpisodeDeltaCandidateFingerprintV01(candidateBRecord);

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
    const selectCandidate = async (
      candidateId,
      { expectedStage = null } = {},
    ) => {
      await setFormControlValue(
        '[data-vnext-candidate-selector="v0.1"]',
        0,
        candidateId,
      );
      await waitForCondition(
        `(() => {
          const selector = document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)');
          const selectedTitle = document.querySelector('[data-vnext-candidate-id="selected"] h3')?.textContent?.trim() ?? '';
          const optionLabel = selector instanceof HTMLSelectElement
            ? selector.options[selector.selectedIndex]?.textContent?.trim() ?? ''
            : '';
          return selector?.value === ${JSON.stringify(candidateId)} &&
            optionLabel.startsWith(selectedTitle);
        })()`,
        `selected candidate ${candidateId}`,
      );
      if (expectedStage) {
        await waitForCondition(
          `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage=${JSON.stringify(expectedStage)}] [data-selected-work-timeline-current="true"]') !== null && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
          `selected candidate ${candidateId} ${expectedStage} current position`,
        );
      } else {
        await waitForCondition(
          `document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-proposal-local-controls-busy="false"]')?.getAttribute('data-vnext-operator-decision-candidate') === ${JSON.stringify(candidateId)}`,
          `selected candidate ${candidateId} decision controls`,
        );
      }
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

    const beforeDecisionPreparation = databaseSnapshot(database);
    const decisionPreparationRequestStart = requests.length;
    await openGuideBriefConversationAndAnswerSuggestedQuestion();
    await submitGuideBriefInteractionCommand(
      "Prepare an accept decision.",
    );
    await waitForCondition(
      `(() => {
        const form = document.querySelector(
          '[data-vnext-operator-decision-form="v0.1"]'
        );
        const select = form?.querySelector('select');
        const rationale = form?.querySelector('textarea');
        const submit = form?.querySelector('button[type="submit"]');
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return select instanceof HTMLSelectElement &&
          select.value === 'accept' &&
          rationale instanceof HTMLTextAreaElement &&
          rationale.value === '' &&
          submit instanceof HTMLButtonElement &&
          submit.disabled &&
          document.activeElement === select &&
          conversation?.querySelector(
            '[data-guidebrief-interaction-outcome="handed_off"][data-guidebrief-interaction-durable-state-changed="false"]'
          ) !== null;
      })()`,
      "GuideBrief prepares the exact applying decision in the existing owner",
    );
    assert.deepEqual(
      databaseSnapshot(database),
      beforeDecisionPreparation,
      "GuideBrief decision preparation must not write a decision or project state",
    );
    assert.equal(
      requests.slice(decisionPreparationRequestStart).length,
      0,
      "GuideBrief decision preparation must perform zero network requests",
    );
    await submitGuideBriefInteractionCommand(
      "Take me to the current action.",
    );
    await waitForCondition(
      `(() => {
        const form = document.querySelector(
          '[data-vnext-operator-decision-form="v0.1"]'
        );
        const select = form?.querySelector('select');
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return select instanceof HTMLSelectElement &&
          document.activeElement === select &&
          conversation?.querySelector(
            '[data-guidebrief-interaction-outcome="handed_off"]'
          ) !== null &&
          document.querySelectorAll('[data-ai-workplane-primary-action]').length === 1;
      })()`,
      "GuideBrief focuses but does not activate the existing current action",
    );
    await submitGuideBriefInteractionCommand("Open advanced review.");
    await waitForCondition(
      `(() => {
        const advanced = document.querySelector(
          'details#selected-work-advanced'
        );
        const summary = advanced?.querySelector(':scope > summary');
        return advanced instanceof HTMLDetailsElement &&
          advanced.open &&
          summary instanceof HTMLElement &&
          document.activeElement === summary &&
          document.querySelector(
            '[data-guidebrief-interaction-outcome="completed"]'
          ) !== null;
      })()`,
      "GuideBrief opens and focuses the existing Advanced owner",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const advanced = document.querySelector(
          'details#selected-work-advanced'
        );
        if (!(advanced instanceof HTMLDetailsElement)) return false;
        advanced.open = false;
        return !advanced.open;
      })()`),
      true,
      "Advanced review must be closed before the partial-utterance refusal proof",
    );
    await submitGuideBriefInteractionCommand(
      "Open advanced review and merge the PR.",
    );
    await waitForCondition(
      `document.querySelector('[data-guidebrief-interaction-plan="unsupported"]') !== null && document.querySelector('details#selected-work-advanced:not([open])') !== null`,
      "GuideBrief refuses a supported action with a forbidden tail without invoking its owner",
    );
    await submitGuideBriefInteractionCommand("Apply this.");
    await waitForCondition(
      `document.querySelector('[data-guidebrief-interaction-plan="unsupported"]') !== null`,
      "GuideBrief refuses an unsupported mutation command",
    );
    await submitGuideBriefInteractionCommand("Show the blocker.");
    await waitForCondition(
      `document.querySelector('[data-guidebrief-interaction-plan="unavailable"]') !== null`,
      "GuideBrief refuses an unavailable relationship question",
    );
    assert.deepEqual(
      databaseSnapshot(database),
      beforeDecisionPreparation,
      "unsupported GuideBrief mutation command must leave durable state unchanged",
    );
    assert.equal(
      requests.slice(decisionPreparationRequestStart).length,
      0,
      "bounded Decision, focus, Advanced, and refusal interactions perform zero network requests",
    );
    result.guide_brief_decision_preparation_zero_write = true;
    result.guide_brief_current_action_focus_only = true;
    result.guide_brief_advanced_owner_handoff = true;
    result.guide_brief_mutation_refusal = true;
    result.guide_brief_unavailable_relationship_refusal = true;
    record("guidebrief_decision_preparation_has_zero_submit_and_zero_network");
    record("guidebrief_current_action_focus_does_not_activate_owner");
    record("guidebrief_advanced_review_uses_existing_disclosure_owner");
    record("guidebrief_partial_utterance_does_not_invoke_supported_owner");
    record("guidebrief_unsupported_mutation_command_is_refused");
    record("guidebrief_unavailable_relationship_question_is_refused");

    await recordSelectedAcceptDecision(
      candidateA,
      "Accept candidate A for a separately previewed and authorized transition interaction-scope proof.",
    );
    await selectCandidate(candidateB);
    await recordSelectedAcceptDecision(
      candidateB,
      "Accept candidate B independently so candidate-local decisions and persisted receipts can be distinguished.",
    );

    const blockedAfterApplicationPath =
      `/workbench/semantic-review/${blockedAfterApplicationProposal.proposal_id.replace(":", "~")}`;
    await navigate(`${appOrigin}${blockedAfterApplicationPath}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(blockedAfterApplicationPath)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateA)}`,
      "same-target proposal before competing project application",
    );
    await recordSelectedAcceptDecision(
      candidateA,
      "Accept the same exact target before another authorized project update makes this saved decision stale.",
    );
    await navigate(`${appOrigin}${path}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(path)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.querySelectorAll('option').length === 2`,
      "return to exact multi-candidate review",
    );
    await selectCandidate(candidateA);
    const beforeRelationshipQuestion = databaseSnapshot(database);
    await submitGuideBriefInteractionCommand(
      "Show the source connection.",
    );
    await waitForCondition(
      `document.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"][data-selected-work-relationship-question="support_and_source"]') !== null`,
      "GuideBrief delegates the exact source question to the existing PC3 owner",
    );
    assert.deepEqual(
      databaseSnapshot(database),
      beforeRelationshipQuestion,
      "relationship-question selection must remain projection-local UI state",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return conversation?.getAttribute(
          'data-guidebrief-conversation-active-answer'
        ) === 'false' &&
          conversation.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length === 0;
      })()`),
      true,
      "relationship selection must synchronously discard the old interaction presentation",
    );
    result.guide_brief_relationship_selection_owner_reused = true;
    record("guidebrief_relationship_selection_reuses_pc3_owner");
    const candidateAGuideAnswer =
      await openGuideBriefConversationAndAnswerSuggestedQuestion();
    assert.equal(candidateAGuideAnswer.answer_count, 1);
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
    await waitForCondition(
      `(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return conversation?.getAttribute(
          'data-guidebrief-conversation-scope'
        ) !== ${JSON.stringify(candidateAGuideAnswer.scope)} &&
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) === 'false' &&
          conversation.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length === 0;
      })()`,
      "GuideBrief conversation resets immediately for a different exact candidate scope",
    );
    const candidateBShapeBeforeLateResponse = await evaluateJson(`(() => {
      const transition = document.querySelector('[data-vnext-semantic-transition-actions="v0.1"]');
      const preview = transition?.querySelector('[data-vnext-transition-step="preview"]');
      const confirmation = transition?.querySelector('[data-vnext-transition-step="confirmation"]');
      const apply = transition?.querySelector('[data-vnext-transition-step="apply"]');
      const later = transition?.querySelector('[data-vnext-transition-step="later-packet"]');
      const confirmButton = transition?.querySelector('[data-vnext-transition-action="confirm"]');
      const applyButton = transition?.querySelector('[data-vnext-transition-action="apply"]');
      const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const timeline = detail?.querySelector('[data-selected-work-timeline-items]');
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
        timeline_selected_title:
          detail?.querySelector('[data-vnext-candidate-id="selected"] h3')?.textContent?.trim() ?? null,
        timeline_stage: detail?.getAttribute('data-selected-work-current-stage') ?? null,
        timeline_current_count:
          timeline?.querySelectorAll('[data-selected-work-timeline-current="true"]').length ?? -1,
        relationship_question:
          detail?.querySelector('[data-selected-work-relationships]')?.getAttribute(
            'data-selected-work-relationship-question'
          ) ?? null,
        relationship_highlight_count:
          detail?.querySelectorAll(
            '[data-selected-work-relationship-highlighted="true"]'
          ).length ?? -1,
        relationship_connection_count:
          detail?.querySelectorAll(
            '[data-selected-work-relationship-connection]'
          ).length ?? -1,
        relationship_primary_action_count:
          detail?.querySelector(
            '[data-selected-work-relationships]'
          )?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
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
      timeline_selected_title: candidateBTitle,
      timeline_stage: "awaiting_application",
      timeline_current_count: 1,
      relationship_question: "candidate_and_decision",
      relationship_highlight_count: 1,
      relationship_connection_count: 1,
      relationship_primary_action_count: 0,
    });
    result.selected_work_timeline_candidate_switching = true;
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
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        return transition?.querySelector('[data-vnext-transition-step="preview"]')?.getAttribute('data-vnext-transition-step-status') === 'not_prepared' &&
          transition.getAttribute('data-vnext-transition-persisted-receipt-count') === '0' &&
          transition.querySelectorAll('input[type="checkbox"]').length === 0 &&
          transition.querySelectorAll('[role="alert"], [role="status"]').length === 0 &&
          detail?.getAttribute('data-selected-work-current-stage') === 'awaiting_application' &&
          detail.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1 &&
          detail.querySelector('[data-vnext-candidate-id="selected"] h3')?.textContent?.trim() === ${JSON.stringify(candidateATitle)} &&
          detail.querySelector('[data-selected-work-relationships]')?.getAttribute('data-selected-work-relationship-question') === 'candidate_and_decision' &&
          detail.querySelectorAll('[data-selected-work-relationship-highlighted="true"]').length === 1;
      })()`),
      true,
      "switching back must rebuild candidate A's deterministic relationship default without resurrecting cross-scope question or preview state",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const selector = document.querySelector(
          '[data-selected-work-relationship-question-selector="true"]'
        );
        if (!(selector instanceof HTMLSelectElement)) return false;
        if (!Array.from(selector.options).some(
          (option) => option.value === 'support_and_source'
        )) return false;
        selector.value = 'support_and_source';
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`),
      true,
      "candidate A must permit a fresh projection-local support question after returning to its scope",
    );
    await waitForCondition(
      `document.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"][data-selected-work-relationship-question="support_and_source"]') !== null`,
      "candidate A fresh relationship question after switch-back",
    );
    const proposalARelationshipCopy = await evaluateJson(`(() => {
      const relationships = document.querySelector(
        '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
      );
      const selector = relationships?.querySelector(
        '[data-selected-work-relationship-question-selector="true"]'
      );
      const highlighted = relationships?.querySelector(
        '[data-selected-work-relationship-highlighted="true"]'
      );
      return {
        selected_option:
          selector instanceof HTMLSelectElement ? selector.value : null,
        highlighted_copy: highlighted?.textContent?.trim() ?? null,
        highlighted_kind:
          highlighted?.getAttribute('data-selected-work-relationship-kind') ?? null,
        highlighted_basis:
          highlighted?.getAttribute('data-selected-work-relationship-basis') ?? null,
      };
    })()`);
    assert.equal(proposalARelationshipCopy.selected_option, "support_and_source");
    assert.equal(
      typeof proposalARelationshipCopy.highlighted_copy === "string" &&
        proposalARelationshipCopy.highlighted_copy.length > 0,
      true,
      "proposal A must render an exact support answer before leaving its scope",
    );
    const candidateABeforeApplicationGuideAnswer =
      await askGuideBriefConversationQuestion("How is this connected?");
    assert.equal(
      candidateABeforeApplicationGuideAnswer.intent,
      "relationship_explanation",
    );
    assert.equal(
      typeof candidateABeforeApplicationGuideAnswer.direct_answer ===
          "string" &&
        proposalARelationshipCopy.highlighted_copy.includes(
          candidateABeforeApplicationGuideAnswer.direct_answer,
        ),
      true,
      "PC4 visible relationship answer must use the PC3-highlighted connection",
    );
    result.guide_brief_highlighted_relationship_agreement = true;
    const guideBriefPreviewRequestStart = requests.length;
    await submitGuideBriefInteractionCommand(
      "Take me to the current action.",
    );
    await waitForCondition(
      `(() => {
        const preview = document.querySelector(
          '[data-vnext-transition-action="preview"]'
        );
        return preview instanceof HTMLButtonElement &&
          document.activeElement === preview &&
          document.querySelector(
            '[data-guidebrief-interaction-outcome="handed_off"]'
          ) !== null;
      })()`,
      "pre-preview current action focuses the existing read-only preview owner without activating it",
    );
    assert.equal(
      requests.slice(guideBriefPreviewRequestStart).length,
      0,
      "focusing the pre-preview current action must issue no request",
    );
    record("guidebrief_pre_preview_current_action_focus_only");
    await waitForCondition(
      `(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        const details = conversation?.querySelector(':scope > details');
        if (!(details instanceof HTMLDetailsElement)) return false;
        details.open = true;
        return Array.from(
          conversation.querySelectorAll(
            '[aria-label="Interactions supported by current owners"] button'
          )
        ).some(
          (button) =>
            button.textContent?.trim() ===
              'Show what would change before applying' &&
            button instanceof HTMLButtonElement &&
            !button.disabled
        );
      })()`,
      "GuideBrief advertises the exact current Transition preview owner",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const advanced = document.querySelector(
          'details#selected-work-advanced'
        );
        if (!(advanced instanceof HTMLDetailsElement)) return false;
        advanced.open = false;
        return !advanced.open;
      })()`),
      true,
      "Advanced owner must begin closed for the host single-flight proof",
    );
    pauseNextSemanticTransitionRequest("preview");
    assert.equal(
      await evaluateBoolean(`(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        const button = Array.from(
          conversation?.querySelectorAll(
            '[aria-label="Interactions supported by current owners"] button'
          ) ?? []
        ).find(
          (candidate) =>
            candidate.textContent?.trim() ===
            'Show what would change before applying'
        );
        if (!(button instanceof HTMLButtonElement) || button.disabled) {
          return false;
        }
        button.click();
        button.click();
        return true;
      })()`),
      true,
      "double activation must still invoke one owner preview",
    );
    await waitForPausedSemanticTransitionRequest("preview");
    await waitForCondition(
      `(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return conversation?.getAttribute(
          'data-guidebrief-interaction-in-flight'
        ) === 'true' &&
          !Array.from(
            conversation.querySelectorAll(
              '[aria-label="Interactions supported by current owners"] button'
            )
          ).some(
            (button) =>
              button.textContent?.trim() ===
                'Show what would change before applying'
          );
      })()`,
      "Transition preview snapshot changes while the mounted host remains in flight",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        const input = conversation?.querySelector(
          'input[name="guidebrief-question"]'
        );
        const form = input?.closest('form');
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;
        if (!(input instanceof HTMLInputElement) ||
            !(form instanceof HTMLFormElement) ||
            !setter) {
          return false;
        }
        setter.call(input, 'Open advanced review.');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        form.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
        return true;
      })()`),
      true,
      "a second bounded action is submitted while the original owner read remains pending",
    );
    assert.equal(
      await evaluateBoolean(
        `document.querySelector('details#selected-work-advanced:not([open])') !== null`,
      ),
      true,
      "snapshot refresh must not permit a second owner adapter while preview is pending",
    );
    await releasePausedSemanticTransitionRequest("preview");
    await waitForCondition(
      `document.querySelector('[data-vnext-transition-step="preview"][data-vnext-transition-step-status="prepared"]') !== null`,
      "GuideBrief-prepared candidate A preview after switch-back",
    );
    const guideBriefPreviewRequests = requests.slice(
      guideBriefPreviewRequestStart,
    ).filter(
      (request) =>
        request.path === "/api/vnext/operator/semantic-transition",
    );
    assert.deepEqual(
      guideBriefPreviewRequests.map((request) => request.method),
      ["GET"],
      "GuideBrief Transition preparation must issue one preview GET and zero POST",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const transition = document.querySelector(
          '[data-vnext-semantic-transition-actions="v0.1"]'
        );
        return transition?.querySelector(
          '[data-vnext-transition-step="preview"][data-vnext-transition-step-status="prepared"]'
        ) !== null &&
          transition.querySelector(
            '[data-vnext-transition-step="confirmation"][data-vnext-transition-step-status="recorded"]'
          ) === null &&
          transition.querySelector(
            '[data-vnext-transition-step="apply"][data-vnext-transition-step-status="applied"]'
          ) === null;
      })()`),
      true,
      "GuideBrief preview preparation performs no confirmation or application",
    );
    await submitGuideBriefInteractionCommand(
      "Take me to the current action.",
    );
    await waitForCondition(
      `(() => {
        const checkbox = document.querySelector(
          '[data-vnext-transition-step="preview"] input[type="checkbox"]'
        );
        return checkbox instanceof HTMLInputElement &&
          document.activeElement === checkbox &&
          !checkbox.checked &&
          document.querySelector(
            '[data-guidebrief-interaction-outcome="handed_off"]'
          ) !== null;
      })()`,
      "post-preview current action focuses the owner-selected review prerequisite without activating it",
    );
    result.guide_brief_transition_preview_get_count = 1;
    result.guide_brief_transition_preview_post_count = 0;
    result.guide_brief_transition_preview_double_activation_count = 1;
    record("guidebrief_transition_preview_one_get_zero_post");
    record("guidebrief_transition_preview_duplicate_activation_executes_once");
    record("guidebrief_host_single_flight_survives_snapshot_change");
    record("guidebrief_post_preview_current_action_focuses_owner_prerequisite");
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
    await submitGuideBriefInteractionCommand(
      "Take me to the current action.",
    );
    await waitForCondition(
      `(() => {
        const review = document.querySelector(
          '[data-vnext-transition-step="confirmation"] input[type="checkbox"]'
        );
        return review instanceof HTMLInputElement &&
          document.activeElement === review &&
          !review.checked &&
          document.querySelector(
            '[data-guidebrief-interaction-outcome="handed_off"]'
          ) !== null;
      })()`,
      "post-confirmation current action focuses the owner-selected review prerequisite without applying",
    );
    record("guidebrief_post_confirmation_current_action_focus_only");
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
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="project_updated"]') !== null && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1 && document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)') !== null`,
      "candidate A Transition completion unlocks selector",
    );
    await waitForCondition(
      `(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return conversation?.getAttribute(
          'data-guidebrief-conversation-scope'
        ) !== ${JSON.stringify(candidateABeforeApplicationGuideAnswer.scope)} &&
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) === 'false' &&
          conversation.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length === 0;
      })()`,
      "GuideBrief conversation clears an answer when same-candidate current material changes",
    );
    result.guide_brief_same_candidate_material_reset = true;
    record("guidebrief_same_candidate_material_change_clears_stale_answer");
    record("guidebrief_relationship_answer_matches_pc3_highlight");

    const afterMultiCandidate = readDirectHostBrowserState(manifest.project_id);
    assert.deepEqual(afterMultiCandidate.semantic_authority_counts, {
      ...beforeMultiCandidate.semantic_authority_counts,
      semantic_state:
        beforeMultiCandidate.semantic_authority_counts.semantic_state + 1,
      decisions: beforeMultiCandidate.semantic_authority_counts.decisions + 3,
      commit_gates:
        beforeMultiCandidate.semantic_authority_counts.commit_gates + 1,
      transitions:
        beforeMultiCandidate.semantic_authority_counts.transitions + 1,
      packets: beforeMultiCandidate.semantic_authority_counts.packets + 1,
    });
    result.review_decisions_created += 3;
    result.semantic_transitions_created += 1;
    result.multi_candidate_transition_scope = true;
    result.candidate_switch_mutation_locking = true;
    result.late_preview_response_discarded = true;
    result.applying_decision_wording_truthful = true;
    record("multi_candidate_transition_state_is_bound_to_exact_candidate_and_decision");
    record("late_preview_response_is_discarded_after_candidate_switch");
    record("gate_and_apply_mutations_lock_candidate_and_proposal_local_controls");
    record("applying_decision_wording_and_exact_values_remain_truthful");

    const beforeGuideBriefInspector = databaseSnapshot(database);
    const guideBriefInspectorRequestStart = requests.length;
    await submitGuideBriefInteractionCommand("Open exact details.");
    await waitForCondition(
      `location.pathname === '/workbench/inspector' && new URLSearchParams(location.search).get('target') === 'episode_delta_proposal'`,
      "GuideBrief opens only the exact registered selected-work Inspector destination",
    );
    const guideBriefInspectorRequests = requests.slice(
      guideBriefInspectorRequestStart,
    );
    assert.equal(
      guideBriefInspectorRequests.some(
        (request) =>
          request.method !== "GET" &&
          request.method !== "HEAD",
      ),
      false,
      "GuideBrief Inspector handoff must issue no mutating request",
    );
    assert.deepEqual(
      databaseSnapshot(database),
      beforeGuideBriefInspector,
      "GuideBrief Inspector handoff must remain read-only",
    );
    result.guide_brief_exact_inspector_registered_destination = true;
    record("guidebrief_inspector_uses_registered_exact_destination_only");

    await navigate(`${appOrigin}${blockedAfterApplicationPath}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(blockedAfterApplicationPath)} && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="transition_blocked"]') !== null`,
      "same-target accepted decision blocked after competing project update",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        const timeline = detail?.querySelector('[data-selected-work-timeline-items]');
        const relationships = detail?.querySelector('[data-selected-work-relationships]');
        const selector = relationships?.querySelector(
          '[data-selected-work-relationship-question-selector="true"]'
        );
        const highlighted = relationships?.querySelector(
          '[data-selected-work-relationship-highlighted="true"]'
        );
        const visibleText = detail?.innerText ?? '';
        return timeline?.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1 &&
          visibleText.includes('Project update blocked') &&
          visibleText.includes('project update') &&
          relationships?.getAttribute('data-selected-work-relationship-question') === 'blocker_and_conflict' &&
          selector instanceof HTMLSelectElement &&
          selector.value === 'blocker_and_conflict' &&
          detail.querySelectorAll('[data-selected-work-relationship-highlighted="true"]').length === 1 &&
          detail.querySelector('[data-selected-work-relationship-kind="blocked_by"]') !== null &&
          highlighted?.getAttribute('data-selected-work-relationship-basis') === 'blocker_or_conflict' &&
          highlighted?.textContent?.includes('A current safeguard blocks this project update') === true &&
          relationships?.textContent?.includes(${JSON.stringify(proposalARelationshipCopy.highlighted_copy)}) === false &&
          detail.querySelector('[data-selected-work-relationships] [data-ai-workplane-primary-action]') === null &&
          detail?.querySelectorAll('[data-ai-workplane-primary-action]').length <= 1;
      })()`),
      true,
      "blocked timeline must identify one current position without fabricating application",
    );
    const proposalBRelationshipCopy = await evaluateJson(`(() => {
      const relationships = document.querySelector(
        '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
      );
      const highlighted = relationships?.querySelector(
        '[data-selected-work-relationship-highlighted="true"]'
      );
      return {
        highlighted_copy: highlighted?.textContent?.trim() ?? null,
        highlighted_kind:
          highlighted?.getAttribute('data-selected-work-relationship-kind') ?? null,
        highlighted_basis:
          highlighted?.getAttribute('data-selected-work-relationship-basis') ?? null,
      };
    })()`);
    assert.deepEqual(
      {
        copy_present:
          typeof proposalBRelationshipCopy.highlighted_copy === "string" &&
          proposalBRelationshipCopy.highlighted_copy.length > 0,
        kind: proposalBRelationshipCopy.highlighted_kind,
        basis: proposalBRelationshipCopy.highlighted_basis,
      },
      {
        copy_present: true,
        kind: "blocked_by",
        basis: "blocker_or_conflict",
      },
      "proposal B must preserve its exact blocker relationship evidence",
    );
    await validateSemanticReviewViewports();
    await navigate(`${appOrigin}${path}`);
    await waitForCondition(
      `location.pathname === ${JSON.stringify(path)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateB)} && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="awaiting_application"]') !== null && document.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"][data-selected-work-relationship-question="candidate_and_decision"]') !== null`,
      "return navigation respects proposal A actionable candidate policy",
    );
    const returnedProposalBinding = await evaluateJson(`(async () => {
      const response = await fetch(
        '/api/vnext/operator/semantic-review?' + new URLSearchParams({
          proposal_id: ${JSON.stringify(currentMultiCandidateProposal.proposal_id)}
        }),
        { cache: 'no-store', credentials: 'same-origin' }
      );
      const body = await response.json();
      const proposal = body.proposal?.proposal ?? null;
      const candidates = body.proposal?.candidates ?? [];
      const candidateARead = candidates.find(
        (entry) => entry.candidate?.candidate_id === ${JSON.stringify(candidateA)}
      );
      const candidateBRead = candidates.find(
        (entry) => entry.candidate?.candidate_id === ${JSON.stringify(candidateB)}
      );
      const transitionA = (body.proposal?.transition_receipts ?? []).find(
        (receipt) =>
          receipt.source_proposal?.proposal_id === proposal?.proposal_id &&
          receipt.source_proposal?.proposal_fingerprint ===
            proposal?.integrity?.fingerprint &&
          receipt.source_candidate?.candidate_id ===
            candidateARead?.candidate?.candidate_id &&
          receipt.source_candidate?.candidate_fingerprint ===
            candidateARead?.candidate_fingerprint
      );
      const decisionA = (body.proposal?.decision_history ?? []).find(
        (entry) =>
          entry.status === 'valid' &&
          entry.decision?.decision_id ===
            transitionA?.source_decision?.decision_id &&
          entry.decision?.integrity?.fingerprint ===
            transitionA?.source_decision?.decision_fingerprint &&
          entry.decision?.candidate?.candidate_id ===
            candidateARead?.candidate?.candidate_id &&
          entry.decision?.candidate?.candidate_fingerprint ===
            candidateARead?.candidate_fingerprint
      );
      return {
        status: response.status,
        proposal_id: proposal?.proposal_id ?? null,
        proposal_fingerprint: proposal?.integrity?.fingerprint ?? null,
        candidate_a_id: candidateARead?.candidate?.candidate_id ?? null,
        candidate_a_fingerprint:
          candidateARead?.candidate_fingerprint ?? null,
        candidate_b_id: candidateBRead?.candidate?.candidate_id ?? null,
        candidate_b_fingerprint:
          candidateBRead?.candidate_fingerprint ?? null,
        candidate_a_exact_decision_transition_chain:
          Boolean(transitionA && decisionA),
      };
    })()`);
    assert.deepEqual(returnedProposalBinding, {
      status: 200,
      proposal_id: currentMultiCandidateProposal.proposal_id,
      proposal_fingerprint:
        currentMultiCandidateProposal.integrity.fingerprint,
      candidate_a_id: candidateA,
      candidate_a_fingerprint: candidateAFingerprint,
      candidate_b_id: candidateB,
      candidate_b_fingerprint: candidateBFingerprint,
      candidate_a_exact_decision_transition_chain: true,
    });
    const returnedCandidateBShape = await evaluateJson(`(() => {
      const detail = document.querySelector(
        '[data-vnext-semantic-review-detail="v0.1"]'
      );
      const candidateSelector = detail?.querySelector(
        '[data-vnext-candidate-selector="v0.1"]'
      );
      const relationships = detail?.querySelector(
        '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
      );
      const relationshipSelector = relationships?.querySelector(
        '[data-selected-work-relationship-question-selector="true"]'
      );
      const highlighted = relationships?.querySelector(
        '[data-selected-work-relationship-highlighted="true"]'
      );
      const relationshipText = relationships?.innerText ?? '';
      return {
        selected_candidate:
          candidateSelector instanceof HTMLSelectElement
            ? candidateSelector.value
            : null,
        selected_title:
          detail?.querySelector('[data-vnext-candidate-id="selected"] h3')
            ?.textContent?.trim() ?? null,
        stage: detail?.getAttribute('data-selected-work-current-stage') ?? null,
        current_count:
          detail?.querySelectorAll(
            '[data-selected-work-timeline-current="true"]'
          ).length ?? -1,
        question:
          relationships?.getAttribute(
            'data-selected-work-relationship-question'
          ) ?? null,
        selected_question:
          relationshipSelector instanceof HTMLSelectElement
            ? relationshipSelector.value
            : null,
        highlighted_count:
          relationships?.querySelectorAll(
            '[data-selected-work-relationship-highlighted="true"]'
          ).length ?? -1,
        highlighted_copy: highlighted?.textContent?.trim() ?? null,
        highlighted_kind:
          highlighted?.getAttribute(
            'data-selected-work-relationship-kind'
          ) ?? null,
        highlighted_basis:
          highlighted?.getAttribute(
            'data-selected-work-relationship-basis'
          ) ?? null,
        proposal_a_support_absent:
          !relationshipText.includes(
            ${JSON.stringify(proposalARelationshipCopy.highlighted_copy)}
          ),
        proposal_b_blocker_absent:
          !relationshipText.includes(
            ${JSON.stringify(proposalBRelationshipCopy.highlighted_copy)}
          ) &&
          !relationshipText.includes('A current safeguard blocks this project update'),
        primary_action_count:
          detail?.querySelectorAll('[data-ai-workplane-primary-action]')
            .length ?? -1,
      };
    })()`);
    assert.deepEqual(returnedCandidateBShape, {
      selected_candidate: candidateB,
      selected_title: candidateBTitle,
      stage: "awaiting_application",
      current_count: 1,
      question: "candidate_and_decision",
      selected_question: "candidate_and_decision",
      highlighted_count: 1,
      highlighted_copy: returnedCandidateBShape.highlighted_copy,
      highlighted_kind: "decided_by",
      highlighted_basis: "user_decision",
      proposal_a_support_absent: true,
      proposal_b_blocker_absent: true,
      primary_action_count: 1,
    });
    assert.equal(
      typeof returnedCandidateBShape.highlighted_copy === "string" &&
        returnedCandidateBShape.highlighted_copy.length > 0,
      true,
      "proposal A candidate B must render its exact decision relationship",
    );
    await selectCandidate(candidateA, { expectedStage: "project_updated" });
    const returnedCandidateAShape = await evaluateJson(`(() => {
        const relationships = document.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        const detail = document.querySelector(
          '[data-vnext-semantic-review-detail="v0.1"]'
        );
        const candidateSelector = detail?.querySelector(
          '[data-vnext-candidate-selector="v0.1"]'
        );
        const selector = relationships?.querySelector(
          '[data-selected-work-relationship-question-selector="true"]'
        );
        const highlighted = relationships?.querySelector(
          '[data-selected-work-relationship-highlighted="true"]'
        );
        const relationshipText = relationships?.innerText ?? '';
        return {
          selected_candidate:
            candidateSelector instanceof HTMLSelectElement
              ? candidateSelector.value
              : null,
          selected_title:
            detail?.querySelector('[data-vnext-candidate-id="selected"] h3')
              ?.textContent?.trim() ?? null,
          stage:
            detail?.getAttribute('data-selected-work-current-stage') ?? null,
          primary_action_owner:
            detail?.getAttribute(
              'data-selected-work-primary-action-owner'
            ) ?? null,
          current_count:
            detail?.querySelectorAll(
              '[data-selected-work-timeline-current="true"]'
            ).length ?? -1,
          question:
            relationships?.getAttribute(
              'data-selected-work-relationship-question'
            ) ?? null,
          selected_question:
            selector instanceof HTMLSelectElement ? selector.value : null,
          highlighted_count:
            relationships?.querySelectorAll(
              '[data-selected-work-relationship-highlighted="true"]'
            ).length ?? -1,
          highlighted_copy: highlighted?.textContent?.trim() ?? null,
          highlighted_kind:
            highlighted?.getAttribute(
              'data-selected-work-relationship-kind'
            ) ?? null,
          highlighted_basis:
            highlighted?.getAttribute(
              'data-selected-work-relationship-basis'
            ) ?? null,
          proposal_a_support_absent:
            !relationshipText.includes(
              ${JSON.stringify(proposalARelationshipCopy.highlighted_copy)}
            ),
          proposal_b_blocker_absent:
            !relationshipText.includes(
              ${JSON.stringify(proposalBRelationshipCopy.highlighted_copy)}
            ) &&
            !relationshipText.includes(
              'A current safeguard blocks this project update'
            ),
          candidate_b_answer_absent:
            !relationshipText.includes(
              ${JSON.stringify(returnedCandidateBShape.highlighted_copy)}
            ),
          raw_protocol_copy_absent:
            !/(sha256:|episode-delta-proposal:|review-decision:|state-transition-receipt:|TaskContextPacket|RunReceipt)/i.test(
              relationshipText
            ),
          primary_action_count:
            detail?.querySelectorAll('[data-ai-workplane-primary-action]')
              .length ?? -1,
          review_next_change_label:
            detail?.querySelector(
              '[data-vnext-review-next-change="true"][data-ai-workplane-primary-action="review-next-change"]'
            )?.textContent?.trim() ?? null,
        };
      })()`);
    const expectedReturnedCandidateAShape = {
      selected_candidate: candidateA,
      selected_title: candidateATitle,
      stage: "project_updated",
      primary_action_owner: "candidate_selection",
      current_count: 1,
      question: "decision_and_project_change",
      selected_question: "decision_and_project_change",
      highlighted_count: 1,
      highlighted_copy: returnedCandidateAShape.highlighted_copy,
      highlighted_kind: "applied_as",
      highlighted_basis: "authorized_project_change",
      proposal_a_support_absent: true,
      proposal_b_blocker_absent: true,
      candidate_b_answer_absent: true,
      raw_protocol_copy_absent: true,
      primary_action_count: 1,
      review_next_change_label: "Review next change",
    };
    assert.deepEqual(
      returnedCandidateAShape,
      expectedReturnedCandidateAShape,
      "returning to proposal A must rebuild from its current deterministic default without restoring the prior support selection",
    );
    assert.equal(
      typeof returnedCandidateAShape.highlighted_copy === "string" &&
        returnedCandidateAShape.highlighted_copy.length > 0,
      true,
      "proposal A candidate A must render its exact decision-to-project-update relationship",
    );
    await submitGuideBriefInteractionCommand(
      "Take me to the current action.",
    );
    await waitForCondition(
      `(() => {
        const next = document.querySelector(
          '[data-vnext-review-next-change="true"]'
        );
        const selector = document.querySelector(
          '[data-vnext-candidate-selector="v0.1"]'
        );
        return next instanceof HTMLButtonElement &&
          document.activeElement === next &&
          selector?.value === ${JSON.stringify(candidateA)} &&
          document.querySelector(
            '[data-guidebrief-interaction-outcome="handed_off"]'
          ) !== null;
      })()`,
      "candidate-selection current action focuses the exact existing control without changing candidate",
    );
    record("guidebrief_candidate_selection_current_action_focus_only");
    await submitGuideBriefInteractionCommand("Show the next change.");
    await waitForCondition(
      `(() => {
        const detail = document.querySelector(
          '[data-vnext-semantic-review-detail="v0.1"]'
        );
        const selector = detail?.querySelector(
          '[data-vnext-candidate-selector="v0.1"]'
        );
        const relationship = detail?.querySelector(
          '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
        );
        return location.pathname === ${JSON.stringify(path)} &&
          selector?.value === ${JSON.stringify(candidateB)} &&
          detail?.getAttribute('data-selected-work-current-stage') ===
            'awaiting_application' &&
          detail?.getAttribute('data-selected-work-primary-action-owner') ===
            'transition' &&
          relationship?.getAttribute(
            'data-selected-work-relationship-question'
          ) === 'candidate_and_decision' &&
          detail?.querySelectorAll(
            '[data-selected-work-timeline-current="true"]'
          ).length === 1 &&
          detail?.querySelectorAll(
            '[data-ai-workplane-primary-action]'
          ).length === 1;
      })()`,
      "Review next change selects candidate B exact current state",
    );
    assert.equal(
      await evaluateBoolean(`(() => {
        const conversation = document.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return conversation?.getAttribute(
          'data-guidebrief-conversation-active-answer'
        ) === 'false' &&
          conversation.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length === 0;
      })()`),
      true,
      "next-candidate selection must discard the consumed prior-scope interaction",
    );
    const reviewNextCandidateShape = await evaluateJson(`(() => {
      const detail = document.querySelector(
        '[data-vnext-semantic-review-detail="v0.1"]'
      );
      const candidateSelector = detail?.querySelector(
        '[data-vnext-candidate-selector="v0.1"]'
      );
      const relationships = detail?.querySelector(
        '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
      );
      const relationshipSelector = relationships?.querySelector(
        '[data-selected-work-relationship-question-selector="true"]'
      );
      const highlighted = relationships?.querySelector(
        '[data-selected-work-relationship-highlighted="true"]'
      );
      const relationshipText = relationships?.innerText ?? '';
      return {
        path: location.pathname,
        selected_candidate:
          candidateSelector instanceof HTMLSelectElement
            ? candidateSelector.value
            : null,
        selected_title:
          detail?.querySelector('[data-vnext-candidate-id="selected"] h3')
            ?.textContent?.trim() ?? null,
        stage:
          detail?.getAttribute('data-selected-work-current-stage') ?? null,
        primary_action_owner:
          detail?.getAttribute(
            'data-selected-work-primary-action-owner'
          ) ?? null,
        current_count:
          detail?.querySelectorAll(
            '[data-selected-work-timeline-current="true"]'
          ).length ?? -1,
        question:
          relationships?.getAttribute(
            'data-selected-work-relationship-question'
          ) ?? null,
        selected_question:
          relationshipSelector instanceof HTMLSelectElement
            ? relationshipSelector.value
            : null,
        highlighted_count:
          relationships?.querySelectorAll(
            '[data-selected-work-relationship-highlighted="true"]'
          ).length ?? -1,
        highlighted_copy: highlighted?.textContent?.trim() ?? null,
        highlighted_kind:
          highlighted?.getAttribute(
            'data-selected-work-relationship-kind'
          ) ?? null,
        highlighted_basis:
          highlighted?.getAttribute(
            'data-selected-work-relationship-basis'
          ) ?? null,
        candidate_a_answer_absent:
          !relationshipText.includes(
            ${JSON.stringify(returnedCandidateAShape.highlighted_copy)}
          ),
        proposal_b_blocker_absent:
          !relationshipText.includes(
            ${JSON.stringify(proposalBRelationshipCopy.highlighted_copy)}
          ),
        primary_action_count:
          detail?.querySelectorAll('[data-ai-workplane-primary-action]')
            .length ?? -1,
      };
    })()`);
    assert.deepEqual(reviewNextCandidateShape, {
      path,
      selected_candidate: candidateB,
      selected_title: candidateBTitle,
      stage: "awaiting_application",
      primary_action_owner: "transition",
      current_count: 1,
      question: "candidate_and_decision",
      selected_question: "candidate_and_decision",
      highlighted_count: 1,
      highlighted_copy: reviewNextCandidateShape.highlighted_copy,
      highlighted_kind: "decided_by",
      highlighted_basis: "user_decision",
      candidate_a_answer_absent: true,
      proposal_b_blocker_absent: true,
      primary_action_count: 1,
    });
    assert.equal(
      typeof reviewNextCandidateShape.highlighted_copy === "string" &&
        reviewNextCandidateShape.highlighted_copy.length > 0,
      true,
      "Review next change must rebuild candidate B's exact relationship answer",
    );
    result.guide_brief_next_candidate_owner_reused = true;
    record("guidebrief_next_candidate_selection_reuses_pc2_owner");
    const mixedReturnCaptureResponse = await evaluateJson(`(async () => {
      const response = await fetch(
        '/api/vnext/operator/semantic-review?' + new URLSearchParams({
          proposal_id: ${JSON.stringify(
            currentMultiCandidateProposal.proposal_id,
          )}
        }),
        { cache: 'no-store', credentials: 'same-origin' }
      );
      return { status: response.status, body: await response.json() };
    })()`);
    assert.equal(mixedReturnCaptureResponse.status, 200);
    assert.equal(mixedReturnCaptureResponse.body.ok, true);
    const mixedReturnRead = mixedReturnCaptureResponse.body.proposal;
    assert.equal(
      mixedReturnCaptureResponse.body.project.workspace_id,
      currentMultiCandidateProposal.workspace_id,
    );
    assert.equal(
      mixedReturnCaptureResponse.body.project.project_id,
      currentMultiCandidateProposal.project_id,
    );
    assert.equal(
      mixedReturnRead.proposal.proposal_id,
      currentMultiCandidateProposal.proposal_id,
    );
    assert.equal(
      mixedReturnRead.proposal.integrity.fingerprint,
      currentMultiCandidateProposal.integrity.fingerprint,
    );
    const mixedReturnCandidateTimelines = mixedReturnRead.candidates.map(
      (candidate) => ({
        candidate,
        timeline: buildSelectedWorkTimelineV01({
          read: mixedReturnRead,
          selected_candidate: candidate,
        }),
      }),
    );
    const mixedReturnAppliedCandidates =
      mixedReturnCandidateTimelines.filter(
        (entry) =>
          entry.timeline.current_position.stage === "project_updated",
      );
    assert.equal(
      mixedReturnAppliedCandidates.length,
      1,
      "the exact mutated proposal must expose one durably applied candidate",
    );
    const mixedReturnAppliedCandidate =
      mixedReturnAppliedCandidates[0].candidate;
    const mixedReturnAppliedReceipts =
      mixedReturnRead.transition_receipts.filter(
        (receipt) =>
          receipt.source_proposal.proposal_id ===
            mixedReturnRead.proposal.proposal_id &&
          receipt.source_proposal.proposal_fingerprint ===
            mixedReturnRead.proposal.integrity.fingerprint &&
          receipt.source_candidate.candidate_id ===
            mixedReturnAppliedCandidate.candidate.candidate_id &&
          receipt.source_candidate.candidate_fingerprint ===
            mixedReturnAppliedCandidate.candidate_fingerprint,
      );
    assert.equal(
      mixedReturnAppliedReceipts.length,
      1,
      "the applied candidate must retain one exact Transition receipt",
    );
    const mixedReturnAppliedReceipt =
      mixedReturnAppliedReceipts[0];
    const mixedReturnAppliedDecisionEntries =
      mixedReturnRead.decision_history.filter(
        (entry) =>
          entry.status === "valid" &&
          entry.pilot_session_bound &&
          entry.decision.source_proposal.proposal_id ===
            mixedReturnRead.proposal.proposal_id &&
          entry.decision.source_proposal.proposal_fingerprint ===
            mixedReturnRead.proposal.integrity.fingerprint &&
          entry.decision.candidate.candidate_id ===
            mixedReturnAppliedCandidate.candidate.candidate_id &&
          entry.decision.candidate.candidate_fingerprint ===
            mixedReturnAppliedCandidate.candidate_fingerprint &&
          entry.decision.decision_id ===
            mixedReturnAppliedReceipt.source_decision.decision_id &&
          entry.decision.integrity.fingerprint ===
            mixedReturnAppliedReceipt.source_decision
              .decision_fingerprint,
      );
    assert.equal(
      mixedReturnAppliedDecisionEntries.length,
      1,
      "the applied candidate receipt must bind one exact decision",
    );
    const mixedReturnAppliedDecisionEntry =
      mixedReturnAppliedDecisionEntries[0];
    const mixedReturnUnappliedCandidates =
      mixedReturnCandidateTimelines.flatMap(({ candidate, timeline }) => {
        if (
          candidate.candidate.candidate_id ===
            mixedReturnAppliedCandidate.candidate.candidate_id &&
          candidate.candidate_fingerprint ===
            mixedReturnAppliedCandidate.candidate_fingerprint
        ) {
          return [];
        }
        const applyingEntries =
          mixedReturnRead.decision_history.filter(
            (entry) =>
              entry.status === "valid" &&
              entry.pilot_session_bound &&
              entry.pilot_actionable &&
              ["accept", "supersede", "retract"].includes(
                entry.decision.decision,
              ) &&
              entry.decision.source_proposal.proposal_id ===
                mixedReturnRead.proposal.proposal_id &&
              entry.decision.source_proposal
                .proposal_fingerprint ===
                mixedReturnRead.proposal.integrity.fingerprint &&
              entry.decision.candidate.candidate_id ===
                candidate.candidate.candidate_id &&
              entry.decision.candidate.candidate_fingerprint ===
                candidate.candidate_fingerprint &&
              entry.decision.requested_transition_intent !== null &&
              entry.decision.requested_transition_intent.applied ===
                false,
          );
        const matchingReceipts =
          mixedReturnRead.transition_receipts.filter(
            (receipt) =>
              applyingEntries.some(
                (entry) =>
                  receipt.source_proposal.proposal_id ===
                    mixedReturnRead.proposal.proposal_id &&
                  receipt.source_proposal.proposal_fingerprint ===
                    mixedReturnRead.proposal.integrity.fingerprint &&
                  receipt.source_candidate.candidate_id ===
                    candidate.candidate.candidate_id &&
                  receipt.source_candidate.candidate_fingerprint ===
                    candidate.candidate_fingerprint &&
                  receipt.source_decision.decision_id ===
                    entry.decision.decision_id &&
                  receipt.source_decision.decision_fingerprint ===
                    entry.decision.integrity.fingerprint,
              ),
          );
        return applyingEntries.length === 1 &&
          matchingReceipts.length === 0
          ? [{
              candidate,
              timeline,
              decision_entry: applyingEntries[0],
            }]
          : [];
      });
    assert.equal(
      mixedReturnUnappliedCandidates.length,
      1,
      "the exact mutated proposal must expose one unapplied applying decision",
    );
    const mixedReturnUnapplied =
      mixedReturnUnappliedCandidates[0];
    assert.equal(
      mixedReturnUnapplied.timeline.current_position.stage,
      "awaiting_application",
      "the captured unapplied candidate must remain same-session actionable before restart",
    );
    assert.equal(
      proposalBRelationshipCopy.highlighted_basis,
      "blocker_or_conflict",
      "the separate same-session transition-blocked regression must pass before return-target capture",
    );
    mixedReturnTarget = {
      workspace_id: mixedReturnRead.proposal.workspace_id,
      project_id: mixedReturnRead.proposal.project_id,
      proposal_id: mixedReturnRead.proposal.proposal_id,
      proposal_fingerprint:
        mixedReturnRead.proposal.integrity.fingerprint,
      applied_candidate: {
        candidate_id:
          mixedReturnAppliedCandidate.candidate.candidate_id,
        candidate_fingerprint:
          mixedReturnAppliedCandidate.candidate_fingerprint,
        decision_id:
          mixedReturnAppliedDecisionEntry.decision.decision_id,
        decision_fingerprint:
          mixedReturnAppliedDecisionEntry.decision.integrity
            .fingerprint,
        transition_receipt_id:
          mixedReturnAppliedReceipt.transition_receipt_id,
        transition_receipt_fingerprint:
          mixedReturnAppliedReceipt.integrity.fingerprint,
      },
      unapplied_candidate: {
        candidate_id:
          mixedReturnUnapplied.candidate.candidate.candidate_id,
        candidate_fingerprint:
          mixedReturnUnapplied.candidate.candidate_fingerprint,
        decision_id:
          mixedReturnUnapplied.decision_entry.decision.decision_id,
        decision_fingerprint:
          mixedReturnUnapplied.decision_entry.decision.integrity
            .fingerprint,
        decision_session_id:
          mixedReturnUnapplied.decision_entry.session_id,
      },
    };
    assert(mixedGenericValidationProposalId);
    assert.notEqual(
      mixedGenericValidationProposalId,
      mixedReturnTarget.proposal_id,
      "the generic validation proposal must not become the mixed return target",
    );
    record("mixed_return_target_captured_from_exact_mutated_proposal");
    record("generic_validation_proposal_excluded_as_return_target");
    record("selected_work_relationship_questions_remain_candidate_local");
    record("selected_work_relationship_questions_remain_exact_proposal_local");
    record("selected_work_relationship_return_navigation_rebuilds_default");
    record("selected_work_candidate_selection_owner_renders_exact_action");
    record("selected_work_relationship_explains_exact_transition_blocker");
    record("selected_work_timeline_exposes_exact_post_decision_application_blocker");
    if (RUN_CORE_SCOPE) {
      assert.equal(
        typeof validateExactLaterOutcomeV01,
        "function",
        "the exact later-outcome return fixture must be available after target capture",
      );
      await validateExactLaterOutcomeV01();
    }
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
    assert.equal(
      await evaluateBoolean(`(() => {
        const owner = document.querySelector('#project-settings[data-project-settings-owner="emphasized"][data-project-identity-management="true"]');
        return owner !== null && owner.getClientRects().length > 0 && document.querySelectorAll('#project-settings').length === 1 && document.querySelector('details#project-settings') === null;
      })()`),
      true,
      "emphasized project management must expose one visible Project identity target",
    );
    assert.equal(await evaluateBoolean(`(() => {
      const link = document.querySelector('a[data-project-context-label="Current project"]');
      if (!(link instanceof HTMLAnchorElement)) return false;
      link.focus();
      return document.activeElement === link;
    })()`), true);
    await dispatchKeyboardKey("Enter", "Enter", 13);
    await waitForCondition(
      `location.pathname === '/projects' && location.hash === '#project-settings' && document.querySelector('#project-settings input[name="current-project-display-name"]') === document.activeElement`,
      "emphasized current-project context focuses visible Project identity",
    );
    result.project_context_emphasized_owner = true;
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
    assert.equal(result.multi_candidate_transition_scope, true);
    assert.equal(result.candidate_switch_mutation_locking, true);
    assert.equal(result.late_preview_response_discarded, true);
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
  if (RUN_CORE_SCOPE) {
    assert.equal(expectedRefusalAccountingActive, true);
    finalizedExpectedRefusalReport =
      expectedRefusalAccounting.finalize();
    const staleRefusal = finalizedExpectedRefusalReport.tokens.find(
      (token) => token.token_id === STALE_MIXED_SESSION_REFUSAL_TOKEN,
    );
    assert(staleRefusal);
    assert.equal(staleRefusal.refusal.response_count, 1);
    assert.equal(staleRefusal.refusal.status, 403);
    assert.equal(staleRefusal.chrome_log.expected_count, 1);
    assert.notEqual(
      staleRefusal.refusal.request_id,
      staleRefusal.recovery.request_id,
    );
    assert.notEqual(
      staleRefusal.refusal.request_id,
      staleRefusal.authenticated.request_id,
    );
    result.expected_refusal_accounting_complete =
      finalizedExpectedRefusalReport.ok;
    result.expected_stale_session_refusal_response_count =
      staleRefusal.refusal.response_count;
    result.expected_stale_session_refusal_log_count =
      staleRefusal.chrome_log.expected_count;
    result.expected_refusal_duplicate_delivery_count =
      finalizedExpectedRefusalReport.duplicate_deliveries.length;
    result.authenticated_session_recovery_response_count =
      staleRefusal.authenticated.response_count;
    result.expected_refusal_accounting_summary = {
      raw_console_events_preserved: true,
      classified_console_event_count:
        finalizedExpectedRefusalReport.classified_console_indexes.length,
      tokens: finalizedExpectedRefusalReport.tokens,
      duplicate_deliveries:
        finalizedExpectedRefusalReport.duplicate_deliveries,
      event_ledger: finalizedExpectedRefusalReport.event_ledger,
    };
    record("expected_refusal_accounting_tracks_exact_request_identity");
    record("stale_session_refusal_recovers_as_separate_authenticated_request");
    record("raw_console_events_preserved_for_global_audit");
    process.stdout.write(
      `[browser-e2e] expected_refusal_result ${JSON.stringify({
        token_id: staleRefusal.token_id,
        refusal_request_id: staleRefusal.refusal.request_id,
        refusal_response_count: staleRefusal.refusal.response_count,
        chrome_log_count: staleRefusal.chrome_log.expected_count,
        chrome_log_request_id: staleRefusal.chrome_log.network_request_id,
        chrome_log_correlation: staleRefusal.chrome_log.correlation,
        recovery_request_id: staleRefusal.recovery.request_id,
        authenticated_request_id: staleRefusal.authenticated.request_id,
        event_sequence: finalizedExpectedRefusalReport.event_ledger
          .filter((event) => event.token_id === staleRefusal.token_id)
          .map((event) => ({
            sequence: event.sequence,
            event_name: event.event_name,
            request_id: event.request_id,
            log_network_request_id: event.log_network_request_id,
            phase_started: event.phase_started,
            phase_observed: event.phase_observed,
            disposition: event.disposition,
          })),
      })}\n`,
    );
  } else {
    assert.equal(expectedRefusalAccountingActive, false);
  }
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
  const expectedFixtureLogoutRequests = RUN_CORE_SCOPE
    ? requests.filter(
        (request) =>
          request.phase === "multi_candidate_transition_scope" &&
          request.method === "POST" &&
          request.path === "/api/vnext/operator/session" &&
          sessionMutationAction(request) === "logout",
      )
    : [];
  assert.equal(expectedFixtureLogoutRequests.length, RUN_CORE_SCOPE ? 1 : 0);
  const expectedRecoveryRequestIds = new Set(
    (finalizedExpectedRefusalReport?.tokens ?? []).map(
      (token) => token.recovery.request_id,
    ),
  );
  const expectedRecoveryRequests = requests.filter(
    (request) =>
      expectedRecoveryRequestIds.has(request.request_id) &&
      request.phase === "multi_candidate_transition_scope" &&
      request.method === "POST" &&
      request.path === "/api/vnext/operator/session" &&
      sessionMutationAction(request) === "bootstrap",
  );
  assert.equal(
    expectedRecoveryRequests.length,
    expectedRecoveryRequestIds.size,
  );
  const expectedPositiveContextUseReviewRequests = RUN_CORE_SCOPE
    ? requests.filter(
        (request) =>
          request.request_id ===
            expectedPositiveContextUseReviewRequestId &&
          request.phase === "multi_candidate_transition_scope" &&
          request.method === "POST" &&
          request.path ===
            "/api/vnext/operator/project-continuity" &&
          requestJsonBody(request)?.action ===
            "record_context_use_review",
      )
    : [];
  assert.equal(
    expectedPositiveContextUseReviewRequests.length,
    RUN_CORE_SCOPE ? 1 : 0,
  );
  const expectedHarnessMutations = new Set([
    ...expectedFixtureLogoutRequests,
    ...expectedRecoveryRequests,
    ...expectedPositiveContextUseReviewRequests,
  ]);
  const postBootstrapMutations = requests.filter(
    (request) =>
      request.method === "POST" &&
      !expectedHarnessMutations.has(request) &&
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
        request.phase === "folder_onboarding" &&
        (request.path === "/api/vnext/operator/session" ||
          request.path === "/api/vnext/operator/project-continuity" ||
          request.path === "/api/vnext/operator/host-round-trip")
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
          request.path === "/api/vnext/operator/semantic-transition" ||
          request.path === "/api/vnext/operator/host-round-trip" ||
          request.path === "/api/vnext/projects")
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

function seedInitialProjectWorkForCoreV01({
  databasePath,
  manifest,
  projectId,
  goal,
  successCriteria,
  nonGoals,
}) {
  const config = readVNextLocalOperatorPilotConfigV01({
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: manifest.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: projectId,
    AUGNES_VNEXT_OPERATOR_ID: manifest.operator_id,
    AUGNES_DB_PATH: databasePath,
  });
  const writableDatabase = openVNextLocalOperatorDatabaseV01(config);
  try {
    const active = readActiveProjectSelectionV01(
      writableDatabase,
      manifest.workspace_id,
    );
    assert.equal(active?.project_id, projectId);
    assert.equal(Number.isSafeInteger(active?.selection_revision), true);
    const issuedAt = new Date().toISOString();
    const consumedAt = new Date(Date.parse(issuedAt) + 1).toISOString();
    const definedAt = new Date(Date.parse(issuedAt) + 2).toISOString();
    const issued = issueVNextLocalOperatorBootstrapV01(writableDatabase, {
      config,
      clock: { now: () => issuedAt },
    });
    const session = consumeVNextLocalOperatorBootstrapV01(writableDatabase, {
      config,
      bootstrap_token: issued.bootstrap_token,
      clock: { now: () => consumedAt },
    });
    return defineInitialProjectWorkV01(writableDatabase, {
      config,
      credential: session.credential,
      request: {
        action: "define_initial_project_work",
        workspace_id: manifest.workspace_id,
        project_id: projectId,
        expected_active_project_id: projectId,
        expected_active_selection_revision: active.selection_revision,
        expected_initialization_state: "not_defined",
        goal,
        success_criteria: successCriteria,
        non_goals: nonGoals,
      },
      clock: { now: () => definedAt },
    });
  } finally {
    writableDatabase.close();
  }
}

async function assertFocusedFirstWorkBrowserResultV01() {
  await waitForRequestQuiet();
  timing.milestone("focused first-work global request quiet observed");
  for (const key of [
    "first_work_setup_state",
    "first_work_locked_operator_state",
    "first_work_composer_validation",
    "first_work_saved_without_execution",
    "first_work_goal_cross_surface",
    "first_work_reload_persisted",
    "first_work_start_eligible",
    "first_work_explicit_start_admitted",
    "first_work_browser_viewports",
  ]) {
    assert.equal(result[key], true, `${key} must be proven by the CUX6B shard`);
  }
  const hasBoundedResponse = (entry, statuses) =>
    responses.some(
      (response) =>
        response.phase === entry.phase &&
        response.path === entry.path &&
        response.method === "GET" &&
        statuses.includes(response.status),
    );
  const unexpectedFocusedConsoleErrors = consoleErrors.filter(
    (entry) =>
      !(
        entry.path === "/favicon.ico" &&
        /404/u.test(entry.text) &&
        hasBoundedResponse(entry, [404])
      ) &&
      !(
        entry.phase === "folder_onboarding" &&
        [
          "/api/vnext/operator/session",
          "/api/vnext/operator/semantic-review",
          "/api/vnext/operator/project-continuity",
        ].includes(entry.path) &&
        /401 \(Unauthorized\)/u.test(entry.text) &&
        hasBoundedResponse(entry, [401])
      ) &&
      !(
        entry.phase === "folder_onboarding" &&
        ["/api/vnext/projects", "/api/vnext/project-controls"].includes(
          entry.path,
        ) &&
        /409 \(Conflict\)/u.test(entry.text) &&
        responses.some(
          (response) =>
            response.phase === entry.phase &&
            response.path === entry.path &&
            response.status === 409,
        )
      ) &&
      !(
        entry.phase === "folder_onboarding" &&
        entry.path?.startsWith("/_next/") &&
        entry.text.includes("ERR_INCOMPLETE_CHUNKED_ENCODING")
      ) &&
      !(
        entry.phase === "folder_onboarding" &&
        /^\/_next\/static\/webpack\/webpack\.[a-f0-9]+\.hot-update\.js$/u.test(
          entry.path ?? "",
        ) &&
        entry.text.includes("ERR_CONNECTION_REFUSED")
      ) &&
      !(
        entry.phase === "folder_onboarding" &&
        entry.path?.endsWith(
          "/next/dist/client/dev/hot-reloader/app/web-socket.js",
        ) &&
        entry.text.includes("/_next/webpack-hmr") &&
        entry.text.includes("ERR_CONNECTION_REFUSED")
      ),
  );
  const unexpectedFocusedFailedRequests = failedRequests.filter(
    (entry) =>
      entry.error_text !== "net::ERR_ABORTED" &&
      !(
        entry.phase === "folder_onboarding" &&
        entry.error_text === "net::ERR_INCOMPLETE_CHUNKED_ENCODING"
      ),
  );
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(unexpectedFocusedConsoleErrors, []);
  assert.deepEqual(unexpectedFocusedFailedRequests, []);
  assert.deepEqual(externalRequests, []);
  assert.equal(interceptedInspectorResponse, null);
  assert.deepEqual(interceptedRecoveryResponses, []);
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    assert.equal(
      readableDatabase.pragma("integrity_check", { simple: true }),
      "ok",
    );
  } finally {
    readableDatabase.close();
  }
  result.unexpected_external_request_count = 0;
  result.unexpected_console_error_count = 0;
  result.provider_or_external_network_call = false;
  result.default_database_accessed = false;
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

async function validateFirstWorkComposerViewports() {
  const viewports = [
    { width: 1440, height: 1000 },
    { width: 1280, height: 900 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
  ];
  for (const { width, height } of viewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluateBoolean(
      `(() => { window.scrollTo(0, 0); return window.scrollY === 0; })()`,
    );
    await waitForResponsiveSurface(
      '[data-first-work-composer="project_work_initialization.v0.1"]',
      width,
      "first-work composer",
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
        document_overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        composer_overflow:
          (composer?.scrollWidth ?? 0) > (composer?.clientWidth ?? 0) + 1,
        composer_inside_viewport: (() => {
          const rect = composer?.getBoundingClientRect();
          return Boolean(rect && rect.left >= -1 && rect.right <= window.innerWidth + 1);
        })(),
        controls_visible: controls.length === 4 && controls.every(visible),
        controls_minimum_size:
          window.innerWidth > 900 || controls.every((control) => {
            const rect = control.getBoundingClientRect();
            return rect.width >= 44 && rect.height >= 44;
          }),
        collision_count: intersections,
        primary_action_count:
          composer?.querySelectorAll('[data-augnes-primary-action]').length ?? -1,
        navigation_link_count:
          document.querySelectorAll('nav[aria-label="Primary navigation"] > a').length,
        labels_exact:
          Array.from(form?.querySelectorAll('label') ?? []).map((label) => label.textContent?.trim()).join('|') ===
          'Goal|Success criteria|Out of scope',
        protocol_copy_absent:
          !/(TaskContextPacket|RunReceipt|packet fingerprint|session id|operator nonce|first_work_definition)/i.test(text),
        visible_development_overlay_absent:
          Array.from(document.querySelectorAll('nextjs-portal')).every((portal) => {
            const rect = portal.getBoundingClientRect();
            return rect.width === 0 || rect.height === 0;
          }),
      };
    })()`);
    result.viewport_results.push(metrics);
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
  }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
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
      label: "Continuities",
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
      primary_labels: ["Continuities", "AI Workplane"],
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
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      const options = details.querySelector('[data-blank-state-project-options="true"]');
      return details.open && options?.getBoundingClientRect().width > 0;
    })()`,
    "visible Blank State project options",
  );
}

async function closeBlankStateProjectOptions() {
  await waitForCondition(
    `(() => {
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((candidate) => candidate.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = false;
      return !details.open;
    })()`,
    "visible Blank State project options before closing",
  );
}

async function ensureBlankStateGuideBriefVisible() {
  await waitForCondition(
    `(() => {
      const visibleConversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      if (visibleConversation) return true;
      const launcher = Array.from(
        document.querySelectorAll('[data-continuities-guidebrief-launcher="true"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      if (!(launcher instanceof HTMLButtonElement)) return false;
      launcher.click();
      return false;
    })()`,
    "open the contextual GuideBrief dialog",
  );
}

async function openGuideBriefConversationAndAnswerSuggestedQuestion() {
  await ensureBlankStateGuideBriefVisible();
  await waitForCondition(
    `(() => {
      const conversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      const details = conversation?.querySelector(':scope > details');
      const presentation = conversation?.getAttribute(
        'data-guidebrief-conversation-presentation'
      );
      if (
          (!(details instanceof HTMLDetailsElement) &&
            presentation !== 'embedded') ||
          conversation?.getAttribute(
            'data-guidebrief-conversation-hydrated'
          ) !== 'true') return false;
      if (details instanceof HTMLDetailsElement) details.open = true;
      if (conversation?.getAttribute('data-guidebrief-conversation-active-answer') !== 'true') {
        const suggestion = conversation.querySelector(
          '[aria-label="Questions supported by current sources"] button'
        );
        if (!(suggestion instanceof HTMLButtonElement)) return false;
        suggestion.click();
      }
      return true;
    })()`,
    "open GuideBrief conversation and ask a source-supported question",
  );
  await waitForCondition(
    `(() => {
      const conversations = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).filter((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      return conversations.length === 1 &&
        conversations[0]?.getAttribute('data-guidebrief-conversation-active-answer') === 'true' &&
        conversations[0]?.querySelectorAll('[data-guidebrief-conversation-answer]').length === 1;
    })()`,
    "one active GuideBrief conversation answer",
  );
  return evaluateJson(`(() => {
    const conversation = Array.from(
      document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
    ).find((candidate) => {
      const bounds = candidate.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    const answer = conversation?.querySelector('[data-guidebrief-conversation-answer]');
    return {
      scope: conversation?.getAttribute('data-guidebrief-conversation-scope') ?? null,
      availability:
        answer?.getAttribute('data-guidebrief-conversation-answer') ?? null,
      intent:
        answer?.getAttribute('data-guidebrief-conversation-intent') ?? null,
      answer_count:
        conversation?.querySelectorAll('[data-guidebrief-conversation-answer]').length ?? -1,
    };
  })()`);
}

async function askGuideBriefConversationQuestion(question) {
  await ensureBlankStateGuideBriefVisible();
  await waitForCondition(
    `(() => {
      const conversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      const details = conversation?.querySelector(':scope > details');
      const presentation = conversation?.getAttribute(
        'data-guidebrief-conversation-presentation'
      );
      const input = conversation?.querySelector('input[name="guidebrief-question"]');
      const submit = conversation?.querySelector('form button[type="submit"]');
      if (
          (!(details instanceof HTMLDetailsElement) &&
            presentation !== 'embedded') ||
          !(input instanceof HTMLInputElement) ||
          !(submit instanceof HTMLButtonElement) ||
          conversation?.getAttribute(
            'data-guidebrief-conversation-hydrated'
          ) !== 'true') return false;
      if (details instanceof HTMLDetailsElement) details.open = true;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      if (!setter) return false;
      setter.call(input, ${JSON.stringify(question)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
    `enter GuideBrief question ${question}`,
  );
  await waitForCondition(
    `(() => {
      const conversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      const submit = conversation?.querySelector('form button[type="submit"]');
      if (!(submit instanceof HTMLButtonElement) || submit.disabled) return false;
      submit.click();
      return true;
    })()`,
    `submit GuideBrief question ${question}`,
  );
  await waitForCondition(
    `(() => {
      const conversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      const answerCount =
        conversation?.querySelectorAll('[data-guidebrief-conversation-answer]').length ?? 0;
      const interactionCount =
        conversation?.querySelectorAll(
          '[data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
        ).length ?? 0;
      return conversation?.getAttribute('data-guidebrief-conversation-active-answer') === 'true' &&
        answerCount + interactionCount === 1;
    })()`,
    `GuideBrief answer for ${question}`,
  );
  return evaluateJson(`(() => {
    const conversation = Array.from(
      document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
    ).find((candidate) => {
      const bounds = candidate.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    const answer = conversation?.querySelector('[data-guidebrief-conversation-answer]');
    const interaction = conversation?.querySelector(
      '[data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
    );
    return {
      scope: conversation?.getAttribute('data-guidebrief-conversation-scope') ?? null,
      availability:
        answer?.getAttribute('data-guidebrief-conversation-answer') ?? null,
      intent:
        answer?.getAttribute('data-guidebrief-conversation-intent') ?? null,
      answer_count:
        conversation?.querySelectorAll('[data-guidebrief-conversation-answer]').length ?? -1,
      presentation_count:
        conversation?.querySelectorAll(
          '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
        ).length ?? -1,
      interaction_status:
        interaction?.getAttribute('data-guidebrief-interaction-plan') ??
        interaction?.getAttribute('data-guidebrief-interaction-outcome') ??
        null,
      direct_answer:
        answer?.querySelector('.answerHeader strong, strong')?.textContent?.trim() ??
        null,
      public_text:
        answer?.textContent?.trim() ??
        interaction?.textContent?.trim() ??
        '',
    };
  })()`);
}

async function submitGuideBriefInteractionCommand(command) {
  await ensureBlankStateGuideBriefVisible();
  await waitForCondition(
    `(() => {
      const conversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      const details = conversation?.querySelector(':scope > details');
      const presentation = conversation?.getAttribute(
        'data-guidebrief-conversation-presentation'
      );
      const input = conversation?.querySelector('input[name="guidebrief-question"]');
      if (
          (!(details instanceof HTMLDetailsElement) &&
            presentation !== 'embedded') ||
          !(input instanceof HTMLInputElement) ||
          conversation?.getAttribute('data-guidebrief-conversation-hydrated') !== 'true' ||
          conversation?.getAttribute('data-guidebrief-interaction') !== 'bounded-browser-v0.1') {
        return false;
      }
      if (details instanceof HTMLDetailsElement) details.open = true;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      if (!setter) return false;
      setter.call(input, ${JSON.stringify(command)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return input.value === ${JSON.stringify(command)};
    })()`,
    `enter bounded GuideBrief interaction ${command}`,
  );
  assert.equal(
    await evaluateBoolean(`(() => {
      const conversation = Array.from(
        document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
      ).find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      });
      const submit = conversation?.querySelector('form button[type="submit"]');
      if (!(submit instanceof HTMLButtonElement) || submit.disabled) return false;
      submit.click();
      return true;
    })()`),
    true,
    `bounded GuideBrief interaction ${command} must submit once`,
  );
}

async function validateBlankStateViewports(
  projectContextRequired = true,
  {
    state = "unspecified",
    attentionCount = null,
    attentionCategory = null,
    primaryActions = 1,
    primaryActionMinimumHeight = 40,
    secondaryActionRequired = null,
    verifyConversationReload = false,
  } = {},
) {
  for (const width of [390, 430, 1280, 1440]) {
    const height =
      width === 390 ? 844 : width === 430 ? 932 : width === 1280 ? 900 : 1000;
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluateBoolean(`(() => { window.scrollTo(0, 0); return window.scrollY === 0; })()`);
    await waitForResponsiveSurface(
      '[data-blank-state="v0.1"]',
      width,
      "Continuities",
    );
    await openGuideBriefConversationAndAnswerSuggestedQuestion();
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
      const rendered = (element) => {
        const bounds = element?.getBoundingClientRect();
        return Boolean(bounds && bounds.width > 0 && bounds.height > 0);
      };
      const raw = Array.from(home?.querySelectorAll('[data-augnes-visual-priority="raw-record"]') ?? [])
        .find(visible);
      const primaryRect = primaryAction?.getBoundingClientRect();
      const controls = Array.from(
        continuity?.querySelectorAll('a, button, summary') ?? [],
      ).filter(rendered);
      const mobileTouchTargets = Array.from(
        document.querySelectorAll(
          '.product-skip-link, .product-brand, a.product-project-context--action, .continuities-item-details > summary, a.continuities-temporal-title, .blank-state-project-settings-content a, .blank-state-project-settings-content button, .blank-state-project-settings-content input, .blank-state-project-settings-content summary'
        )
      ).filter(rendered);
      const conversation = home?.querySelector(
        '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
      );
      const conversationDisclosure =
        conversation?.querySelector(':scope > details');
      const conversationControls = Array.from(
        conversation?.querySelectorAll('a, button, input, summary') ?? [],
      ).filter(visible);
      const conversationRect = conversation?.getBoundingClientRect();
      const guideLauncher = visibleElement(
        '[data-continuities-guidebrief-launcher="true"]'
      );
      const projectPanel = home?.querySelector('#project-management');
      const onboardingLabel = projectPanel?.querySelector(
        '.blank-state-region-label'
      );
      const onboardingTitle = projectPanel?.querySelector(
        '#project-management-title'
      );
      const onboardingDescription = projectPanel?.querySelector(
        '#local-project-onboarding-description'
      );
      const onboardingSupport = projectPanel?.querySelector(
        '#local-project-onboarding-support'
      );
      const onboardingCancellation = projectPanel?.querySelector(
        '#local-project-onboarding-cancellation'
      );
      const onboardingAction = projectPanel?.querySelector(
        '[data-blank-state-primary-action="choose_folder"]'
      );
      const projectContextRect = projectContext?.getBoundingClientRect();
      const navigationRail = visibleElement('.product-navigation-rail');
      const navigationRailRect = navigationRail?.getBoundingClientRect();
      const settings = home?.querySelector(
        'details[data-blank-state-project-settings-recovery="true"]'
      );
      const settingsSummary = settings?.querySelector(':scope > summary');
      const settingsRect = settings?.getBoundingClientRect();
      const temporal = home?.querySelector(
        '[data-continuities-temporal-context]'
      );
      const temporalRect = temporal?.getBoundingClientRect();
      const temporalLinks = Array.from(
        temporal?.querySelectorAll('a.continuities-temporal-title') ?? []
      );
      const temporalTimes = Array.from(
        temporal?.querySelectorAll('time') ?? []
      );
      const temporalRecentItems = Array.from(
        temporal?.querySelectorAll('.continuities-temporal-group:last-child li') ?? []
      );
      const pinnedNavigation = visibleElement(
        '.continuity-pins-navigation, .continuity-pins-mobile'
      );
      const pinnedNavigationRect = pinnedNavigation?.getBoundingClientRect();
      const guideLauncherRect = guideLauncher?.getBoundingClientRect();
      const continuityRect = continuity?.getBoundingClientRect();
      const productShell = home?.closest(
        '.product-shell[data-primary-product-zone="blank-state"]'
      );
      const firstContinuityItem = continuity?.querySelector(
        '[data-blank-state-continuity-item]'
      );
      const firstControl = home?.querySelector(
        '.continuities-filter input, .continuities-filter-chips button'
      );
      const guideDialog = home?.querySelector(
        'dialog[data-continuities-guidebrief-dialog="true"]'
      );
      const materialSignature = (element) => {
        if (!(element instanceof HTMLElement)) return null;
        const style = getComputedStyle(element);
        return [
          style.backgroundColor,
          style.backgroundImage,
          style.borderTopColor,
          style.boxShadow,
        ].join('|');
      };
      const expectedMaterialSurfaces =
        home?.getAttribute('data-blank-state-presentation') ===
        'active_continuities'
          ? home?.getAttribute('data-blank-state-focus') ===
            'first_work_not_defined'
            ? [
                productShell,
                navigationRail,
                firstContinuityItem,
                guideDialog,
              ]
            : [
              productShell,
              navigationRail,
              firstContinuityItem,
              temporal,
              firstControl,
              guideDialog,
            ]
          : [
              productShell,
              navigationRail,
              projectPanel ?? projectContext,
              guideDialog,
            ];
      const renderedMaterialSurfaces = expectedMaterialSurfaces.filter(
        rendered
      );
      const materialSignatures = renderedMaterialSurfaces
        .map(materialSignature)
        .filter(Boolean);
      const attentionItems = Array.from(
        continuity?.querySelectorAll(
          '[data-blank-state-human-attention="true"]'
        ) ?? []
      );
      const moreContextSummaries = Array.from(
        continuity?.querySelectorAll('.continuities-item-details > summary') ??
          []
      );
      const bounds = (element) => element?.getBoundingClientRect() ?? null;
      const intersects = (left, right) =>
        Boolean(left && right) &&
        Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1 &&
        Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1;
      const conversationOverlaps = conversationControls.flatMap(
        (control, index) =>
          conversationControls.slice(index + 1).filter((candidate) => {
            const left = control.getBoundingClientRect();
            const right = candidate.getBoundingClientRect();
            return Math.min(left.right, right.right) -
                Math.max(left.left, right.left) > 1 &&
              Math.min(left.bottom, right.bottom) -
                Math.max(left.top, right.top) > 1;
          }),
      ).length;
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
        presentation:
          home?.getAttribute('data-blank-state-presentation') ?? null,
        focus: home?.getAttribute('data-blank-state-focus') ?? null,
        width: window.innerWidth,
        height: window.innerHeight,
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
          Boolean(primaryRect) &&
          primaryRect.height >= ${primaryActionMinimumHeight},
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
          home?.getAttribute('data-blank-state-presentation') ===
              'active_continuities'
            ? settings instanceof HTMLDetailsElement &&
              settings.open === false &&
              home?.querySelectorAll(
                ':scope > details.blank-state-disclosure'
              ).length === 1 &&
              settingsSummary?.textContent?.trim() ===
                'Project settings and recovery'
            : home?.querySelector(
                '[data-blank-state-project-settings-recovery], [data-management-safety], [data-blank-state-project-options]'
              ) === null,
        management_collapsed_height:
          settingsRect ? Math.round(settingsRect.height) : null,
        management_summary_touch_target:
          !settingsSummary || settingsSummary.getBoundingClientRect().height >= 44,
        mobile_touch_targets_minimum_size:
          window.innerWidth > 900 ||
          mobileTouchTargets.every((control) => {
            const bounds = control.getBoundingClientRect();
            return bounds.width >= 44 && bounds.height >= 44;
          }),
        management_surface_not_black:
          !settings ||
          !['rgb(0, 0, 0)', 'rgba(0, 0, 0, 0)'].includes(
            getComputedStyle(settings).backgroundColor
          ),
        onboarding_compact_order:
          home?.getAttribute('data-blank-state-presentation') !==
            'local_project_onboarding' ||
          (() => {
            const labelRect = bounds(onboardingLabel);
            const titleRect = bounds(onboardingTitle);
            const descriptionRect = bounds(onboardingDescription);
            const supportRect = bounds(onboardingSupport);
            const cancellationRect = bounds(onboardingCancellation);
            const actionRect = bounds(onboardingAction);
            if (
              !labelRect ||
              !titleRect ||
              !descriptionRect ||
              !supportRect ||
              !cancellationRect ||
              !actionRect
            ) return false;
            const titleToDescription =
              descriptionRect.top - titleRect.bottom;
            const contentHeight = actionRect.bottom - labelRect.top;
            return (
              labelRect.bottom <= titleRect.top + 12 &&
              titleRect.bottom < descriptionRect.top &&
              titleToDescription >= 20 &&
              titleToDescription <= 40 &&
              descriptionRect.bottom <= supportRect.top &&
              supportRect.bottom <= cancellationRect.top &&
              cancellationRect.bottom < actionRect.top &&
              actionRect.height >= 44 &&
              actionRect.bottom <= projectPanel.getBoundingClientRect().bottom &&
              projectPanel.getBoundingClientRect().height - contentHeight <= 92 &&
              projectPanel.getBoundingClientRect().bottom - actionRect.bottom >=
                (window.innerWidth <= 900 ? 20 : 24) &&
              projectPanel.getBoundingClientRect().bottom - actionRect.bottom <= 44
            );
          })(),
        onboarding_panel_height:
          projectPanel ? Math.round(projectPanel.getBoundingClientRect().height) : null,
        onboarding_vertical_metrics:
          home?.getAttribute('data-blank-state-presentation') ===
            'local_project_onboarding'
            ? (() => {
                const labelRect = bounds(onboardingLabel);
                const titleRect = bounds(onboardingTitle);
                const descriptionRect = bounds(onboardingDescription);
                const supportRect = bounds(onboardingSupport);
                const cancellationRect = bounds(onboardingCancellation);
                const actionRect = bounds(onboardingAction);
                const panelRect = bounds(projectPanel);
                return {
                  label_to_title:
                    labelRect && titleRect
                      ? Math.round(titleRect.top - labelRect.bottom)
                      : null,
                  title_to_description:
                    titleRect && descriptionRect
                      ? Math.round(descriptionRect.top - titleRect.bottom)
                      : null,
                  description_to_support:
                    descriptionRect && supportRect
                      ? Math.round(supportRect.top - descriptionRect.bottom)
                      : null,
                  support_to_cancellation:
                    supportRect && cancellationRect
                      ? Math.round(cancellationRect.top - supportRect.bottom)
                      : null,
                  cancellation_to_action:
                    cancellationRect && actionRect
                      ? Math.round(actionRect.top - cancellationRect.bottom)
                      : null,
                  action_to_panel_bottom:
                    actionRect && panelRect
                      ? Math.round(panelRect.bottom - actionRect.bottom)
                      : null,
                  content_height:
                    labelRect && actionRect
                      ? Math.round(actionRect.bottom - labelRect.top)
                      : null,
                };
              })()
            : null,
        onboarding_main_rail_nonoverlap:
          !projectPanel ||
          !navigationRail ||
          !intersects(projectPanel.getBoundingClientRect(), navigationRailRect),
        neutral_project_context_content_driven:
          projectContext?.classList.contains('product-project-context--neutral') !== true ||
          window.innerWidth <= 900 ||
          Boolean(projectContextRect && projectContextRect.width <= 240),
        temporal_inside_viewport:
          !temporalRect ||
          (temporalRect.left >= -1 && temporalRect.right <= window.innerWidth + 1),
        temporal_links_unadorned_until_interaction:
          temporalLinks.every((link) => {
            const style = getComputedStyle(link);
            return (
              style.textDecorationLine === 'none' &&
              style.webkitLineClamp === '2' &&
              link.getAttribute('title') === link.textContent?.trim()
            );
          }),
        temporal_timestamps_separate:
          temporalTimes.every((time) => {
            const title = time.parentElement?.querySelector(
              '.continuities-temporal-title'
            );
            return (
              getComputedStyle(time).display === 'block' &&
              !intersects(bounds(title), bounds(time))
            );
          }),
        temporal_recent_items_separated:
          window.innerWidth <= 900 ||
          temporalRecentItems.every((item, index) => {
            if (index === 0) return true;
            const previous = temporalRecentItems[index - 1];
            return (
              item.getBoundingClientRect().top -
                previous.getBoundingClientRect().bottom >=
              10
            );
          }),
        continuity_copy_action_nonoverlap:
          Array.from(
            continuity?.querySelectorAll('[data-blank-state-continuity-item]') ?? []
          ).every((item) =>
            !intersects(
              bounds(item.querySelector('.continuities-item-copy')),
              bounds(item.querySelector('.continuities-item-entry'))
            )
          ),
        recommendation_action_nonoverlap:
          highlighted.every((item) =>
            !intersects(
              bounds(item.querySelector('.continuities-recommendation-label')),
              bounds(item.querySelector('.continuities-item-entry'))
            )
          ),
        temporal_stream_nonoverlap:
          !intersects(temporalRect, continuityRect),
        pinned_guide_nonoverlap:
          !intersects(pinnedNavigationRect, guideLauncherRect),
        material_surface_count: renderedMaterialSurfaces.length,
        material_signature_count: materialSignatures.length,
        material_unique_count: new Set(materialSignatures).size,
        material_surfaces_differentiated:
          home?.getAttribute('data-blank-state-focus') ===
          'first_work_not_defined'
            ? materialSignatures.length === renderedMaterialSurfaces.length &&
              materialSignatures.length >= 3 &&
              new Set(materialSignatures).size >= 2
            : materialSignatures.length === renderedMaterialSurfaces.length &&
              materialSignatures.length >=
                (home?.getAttribute('data-blank-state-presentation') ===
                'active_continuities'
                  ? 5
                  : 3) &&
              new Set(materialSignatures).size === materialSignatures.length,
        attention_material_bounded:
          attentionItems.every((item) => {
            const style = getComputedStyle(item);
            const action = item.querySelector(
              '.blank-state-primary-action, .blank-state-secondary-link'
            );
            const actionStyle = action ? getComputedStyle(action) : null;
            return (
              style.borderLeftColor !== style.borderRightColor &&
              style.borderRightColor === style.borderBottomColor &&
              (!actionStyle ||
                !actionStyle.backgroundImage.includes('214, 160, 75'))
            );
          }),
        continuity_titles_preserve_full_text:
          Array.from(
            continuity?.querySelectorAll('[data-blank-state-continuity-item]') ??
              []
          ).every((item) => {
            const title = item.querySelector('h3');
            const state = item.querySelector('.blank-state-continuity-state');
            return (
              title?.getAttribute('title') === title?.textContent?.trim() &&
              state?.getAttribute('title') === state?.textContent?.trim()
            );
          }),
        more_context_default_secondary:
          moreContextSummaries.every((summary) => {
            const style = getComputedStyle(summary);
            return (
              summary !== document.activeElement &&
              summary.hasAttribute('aria-selected') === false &&
              style.outlineStyle === 'none'
            );
          }),
        desktop_guide_not_fixed:
          window.innerWidth <= 900 ||
          !guideLauncher ||
          !guideLauncher.closest('.continuities-guide-launcher') ||
          getComputedStyle(
            guideLauncher.closest('.continuities-guide-launcher')
          ).position !== 'fixed',
        augnes_owned_lower_left_overlay_absent:
          Array.from(document.body.querySelectorAll('*')).every((element) => {
            if (
              element.closest('nextjs-portal') ||
              element.classList.contains('product-skip-link')
            ) return true;
            const elementRect = element.getBoundingClientRect();
            if (
              elementRect.width <= 0 ||
              elementRect.height <= 0 ||
              getComputedStyle(element).position !== 'fixed' ||
              elementRect.left >= 80 ||
              elementRect.bottom <= window.innerHeight - 80
            ) return true;
            return element.textContent?.trim() !== 'N';
          }),
        next_development_portal_present:
          document.querySelector('nextjs-portal') !== null,
        internal_id_input_absent:
          Array.from(
            home?.querySelectorAll(
              'input[type="text"], input[type="search"], textarea, [contenteditable="true"]'
            ) ?? [],
          ).every(
            (control) =>
              control instanceof HTMLInputElement &&
              (
                control.name === 'guidebrief-question' ||
                control.name === 'current-project-display-name' ||
                control.getAttribute('data-continuities-filter') === 'shown-items'
              ) &&
              !/(?:^|[-_])(id|fingerprint|nonce|ttl)(?:$|[-_])/i.test(
                [control.name, control.id, control.placeholder].join(' ')
              ),
          ),
        continuities_title_exact:
          heading?.textContent?.trim() === 'Continuities',
        continuities_tagline_exact:
          home?.querySelector('.continuities-tagline')?.textContent?.trim() ===
            'Work and perspective you carry forward.',
        shown_continuities_filter_present:
          home?.querySelector(
            'input[type="search"][data-continuities-filter="shown-items"]'
          ) !== null,
        temporal_context_present:
          home?.querySelector(
            '[data-continuities-temporal-context="continuities_temporal_context.v0.1"]'
          ) !== null,
        highlighted_is_recommendation_not_selection:
          highlighted[0]?.getAttribute('data-continuities-recommended') ===
            'true' &&
          highlighted[0]?.hasAttribute('aria-selected') === false,
        guide_dialog_modal:
          (() => {
            const dialog = home?.querySelector(
              'dialog[data-continuities-guidebrief-dialog="true"]'
            );
            return dialog instanceof HTMLDialogElement &&
              dialog.open &&
              dialog.matches(':modal') &&
              dialog.contains(document.activeElement);
          })(),
        guide_launcher_expanded:
          guideLauncher?.getAttribute('aria-expanded') === 'true',
        guide_launcher_outside_primary_navigation:
          guideLauncher?.closest('nav[aria-label="Primary navigation"]') ===
            null,
        guide_launcher_in_mobile_or_desktop_shell:
          guideLauncher?.closest('.product-navigation-rail') !== null,
        conversation_present:
          conversation?.getAttribute('data-guidebrief-conversation-surface') ===
            'blank_state',
        conversation_open:
          conversation?.getAttribute(
            'data-guidebrief-conversation-presentation'
          ) === 'embedded' ||
          (
            conversationDisclosure instanceof HTMLDetailsElement &&
            conversationDisclosure.open
          ),
        conversation_secondary:
          conversation?.querySelector('[data-augnes-primary-action]') === null &&
          conversation?.querySelector('[data-blank-state-primary-action]') === null &&
          conversation?.hasAttribute('data-augnes-independent-surface') === false,
        conversation_question_input_count:
          conversation?.querySelectorAll(
            'input[name="guidebrief-question"][type="text"]'
          ).length ?? -1,
        conversation_suggestion_count:
          conversation?.querySelectorAll(
            '[aria-label="Questions supported by current sources"] button'
          ).length ?? -1,
        conversation_interaction_host:
          conversation?.getAttribute('data-guidebrief-interaction') ===
            'bounded-browser-v0.1',
        conversation_interaction_suggestion_count:
          conversation?.querySelectorAll(
            '[aria-label="Interactions supported by current owners"] button'
          ).length ?? -1,
        conversation_answer_count:
          conversation?.querySelectorAll(
            '[data-guidebrief-conversation-answer]'
          ).length ?? -1,
        conversation_active_answer:
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) === 'true',
        conversation_scope_present:
          (conversation?.getAttribute(
            'data-guidebrief-conversation-scope'
          )?.length ?? 0) > 0,
        conversation_controls_minimum_size:
          conversationControls.every((control) => {
            const bounds = control.getBoundingClientRect();
            return bounds.width >= 44 && bounds.height >= 44;
          }),
        conversation_overlapping_control_count: conversationOverlaps,
        conversation_inside_viewport:
          Boolean(conversationRect) &&
          conversationRect.left >= -1 &&
          conversationRect.right <= window.innerWidth + 1,
        conversation_after_continuity:
          Boolean(continuity && conversation) &&
          Boolean(
            continuity.compareDocumentPosition(conversation) &
              Node.DOCUMENT_POSITION_FOLLOWING
          ),
        conversation_no_duplicate_timeline_or_relationship:
          conversation?.querySelector(
            '[data-selected-work-timeline], [data-selected-work-relationships]'
          ) === null,
        conversation_public_copy_safe:
          !/(TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|packet fingerprint|sha256:|proposal-candidate:|nonce|TTL|database path)/i.test(
            conversation?.innerText ?? ''
          ),
        conversation_boundary_textual:
          conversation?.textContent?.includes(
            'This surface does not save a decision'
          ) === true,
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
    result.viewport_results.push({ ...metrics, pc1_state: state });
    const activePresentation =
      metrics.presentation === "active_continuities";
    const firstWorkSetup = metrics.focus === "first_work_not_defined";
    const metricMessage = (name) => `${name}:${JSON.stringify(metrics)}`;
    assert.equal(metrics.width, width);
    assert.equal(metrics.height, height);
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
    assert.equal(metrics.continuity_present, activePresentation);
    if (activePresentation) {
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
    } else {
      assert.equal(metrics.continuity_item_count, 0);
      assert.equal(metrics.highlighted_item_count, 0);
    }
    assert.equal(metrics.overlapping_control_count, 0);
    assert.equal(metrics.legacy_competing_regions_absent, true);
    assert.equal(metrics.management_secondary, true);
    assert.equal(metrics.management_summary_touch_target, true);
    assert.equal(
      metrics.mobile_touch_targets_minimum_size,
      true,
      metricMessage("mobile_touch_targets_minimum_size"),
    );
    assert.equal(metrics.management_surface_not_black, true);
    if (activePresentation) {
      assert.equal(
        metrics.management_collapsed_height <= 60,
        true,
        JSON.stringify(metrics),
      );
    } else {
      assert.equal(metrics.management_collapsed_height, null);
    }
    assert.equal(
      metrics.onboarding_compact_order,
      true,
      metricMessage("onboarding_compact_order"),
    );
    if (
      metrics.presentation === "local_project_onboarding" &&
      metrics.width > 900
    ) {
      assert.equal(
        metrics.onboarding_panel_height <= 350,
        true,
        metricMessage("onboarding_panel_height"),
      );
    }
    assert.equal(metrics.onboarding_main_rail_nonoverlap, true);
    assert.equal(
      metrics.neutral_project_context_content_driven,
      true,
      metricMessage("neutral_project_context_content_driven"),
    );
    assert.equal(
      metrics.temporal_inside_viewport,
      true,
      metricMessage("temporal_inside_viewport"),
    );
    assert.equal(
      metrics.temporal_links_unadorned_until_interaction,
      true,
      metricMessage("temporal_links_unadorned_until_interaction"),
    );
    assert.equal(
      metrics.temporal_timestamps_separate,
      true,
      metricMessage("temporal_timestamps_separate"),
    );
    assert.equal(
      metrics.temporal_recent_items_separated,
      true,
      metricMessage("temporal_recent_items_separated"),
    );
    assert.equal(
      metrics.continuity_copy_action_nonoverlap,
      true,
      metricMessage("continuity_copy_action_nonoverlap"),
    );
    assert.equal(
      metrics.recommendation_action_nonoverlap,
      true,
      metricMessage("recommendation_action_nonoverlap"),
    );
    assert.equal(
      metrics.temporal_stream_nonoverlap,
      true,
      metricMessage("temporal_stream_nonoverlap"),
    );
    assert.equal(
      metrics.pinned_guide_nonoverlap,
      true,
      metricMessage("pinned_guide_nonoverlap"),
    );
    assert.equal(
      metrics.material_surfaces_differentiated,
      true,
      metricMessage("material_surfaces_differentiated"),
    );
    assert.equal(
      metrics.attention_material_bounded,
      true,
      metricMessage("attention_material_bounded"),
    );
    assert.equal(
      metrics.continuity_titles_preserve_full_text,
      true,
      metricMessage("continuity_titles_preserve_full_text"),
    );
    assert.equal(
      metrics.more_context_default_secondary,
      true,
      metricMessage("more_context_default_secondary"),
    );
    assert.equal(
      metrics.desktop_guide_not_fixed,
      true,
      metricMessage("desktop_guide_not_fixed"),
    );
    assert.equal(
      metrics.augnes_owned_lower_left_overlay_absent,
      true,
      metricMessage("augnes_owned_lower_left_overlay_absent"),
    );
    assert.equal(metrics.internal_id_input_absent, true);
    assert.equal(metrics.continuities_title_exact, true, JSON.stringify(metrics));
    assert.equal(metrics.continuities_tagline_exact, true, JSON.stringify(metrics));
    assert.equal(
      metrics.shown_continuities_filter_present,
      activePresentation && !firstWorkSetup,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.temporal_context_present,
      activePresentation && !firstWorkSetup,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.highlighted_is_recommendation_not_selection,
      activePresentation,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.guide_dialog_modal, true, JSON.stringify(metrics));
    assert.equal(metrics.guide_launcher_expanded, true, JSON.stringify(metrics));
    assert.equal(
      metrics.guide_launcher_outside_primary_navigation,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.guide_launcher_in_mobile_or_desktop_shell,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.conversation_present, true, JSON.stringify(metrics));
    assert.equal(metrics.conversation_open, true, JSON.stringify(metrics));
    assert.equal(metrics.conversation_secondary, true, JSON.stringify(metrics));
    assert.equal(
      metrics.conversation_question_input_count,
      1,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_suggestion_count >= 3 &&
        metrics.conversation_suggestion_count <= 5,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.conversation_interaction_host, true);
    assert.equal(
      metrics.conversation_interaction_suggestion_count >= 0 &&
        metrics.conversation_interaction_suggestion_count <= 1,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.conversation_answer_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.conversation_active_answer, true, JSON.stringify(metrics));
    assert.equal(metrics.conversation_scope_present, true, JSON.stringify(metrics));
    assert.equal(
      metrics.conversation_controls_minimum_size,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_overlapping_control_count,
      0,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_inside_viewport,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_after_continuity,
      activePresentation,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_no_duplicate_timeline_or_relationship,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_public_copy_safe,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_boundary_textual,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.protocol_vocabulary_absent, true);
    assert.equal(
      metrics.continuity_after_context,
      activePresentation,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.independent_surface_count <= 1, true);
    assert.equal(metrics.state_badge_count <= 1, true);
    assert.equal(metrics.raw_record_after_primary, true);
    assert.equal(metrics.project_context_visible, projectContextRequired);
  }
  if (verifyConversationReload) {
    const beforeReload = await evaluateJson(`(() => {
      const home = document.querySelector('[data-blank-state="v0.1"]');
      const conversation = home?.querySelector(
        '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
      );
      return {
        project_context:
          home?.getAttribute('data-guide-brief-project-context') ?? null,
        scope:
          conversation?.getAttribute('data-guidebrief-conversation-scope') ??
          null,
        active_answer:
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) ?? null,
      };
    })()`);
    assert.equal(beforeReload.active_answer, "true");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(
      `(() => {
        const home = document.querySelector('[data-blank-state="v0.1"]');
        const conversation = home?.querySelector(
          '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
        );
        return home?.getAttribute('data-guide-brief-project-context') ===
            ${JSON.stringify(beforeReload.project_context)} &&
          conversation?.getAttribute('data-guidebrief-conversation-scope') ===
            ${JSON.stringify(beforeReload.scope)} &&
          conversation?.getAttribute(
            'data-guidebrief-conversation-hydrated'
          ) === 'true' &&
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) === 'false' &&
          conversation.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length === 0;
      })()`,
      "GuideBrief conversation reload clears ephemeral turns without changing project meaning",
    );
    const unsupported = await askGuideBriefConversationQuestion(
      "Write a haiku about the repository.",
    );
    assert.deepEqual(
      {
        interaction_status: unsupported.interaction_status,
        presentation_count: unsupported.presentation_count,
      },
      {
        interaction_status: "unsupported",
        presentation_count: 1,
      },
    );
    const ambiguous = await askGuideBriefConversationQuestion("Why?");
    assert.deepEqual(
      {
        interaction_status: ambiguous.interaction_status,
        presentation_count: ambiguous.presentation_count,
      },
      {
        interaction_status: "ambiguous",
        presentation_count: 1,
      },
    );
    result.viewport_results.push({
      surface: "guidebrief_conversation_reload",
      scope_preserved: ambiguous.scope === beforeReload.scope,
      ephemeral_answer_cleared: true,
      unsupported_question_honest: true,
      ambiguous_follow_up_honest: true,
      one_answer_at_a_time: ambiguous.presentation_count === 1,
    });
  }
  await evaluateBoolean(`(() => {
    const conversation = Array.from(
      document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
    ).find((candidate) => {
      const bounds = candidate.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    const details = conversation?.querySelector(':scope > details');
    const presentation = conversation?.getAttribute(
      'data-guidebrief-conversation-presentation'
    );
    if (
      !(details instanceof HTMLDetailsElement) &&
      presentation !== 'embedded'
    ) return false;
    if (details instanceof HTMLDetailsElement) details.open = false;
    const close = document.querySelector(
      '[data-continuities-guidebrief-close="true"]'
    );
    if (close instanceof HTMLButtonElement) close.click();
    return true;
  })()`);
  await waitForCondition(
    `(() => {
      const dialog = document.querySelector(
        'dialog[data-continuities-guidebrief-dialog="true"]'
      );
      if (!(dialog instanceof HTMLDialogElement)) return true;
      const launcher = document.querySelector(
        '[data-continuities-guidebrief-launcher="true"]'
      );
      return !dialog.open && document.activeElement === launcher;
    })()`,
    "GuideBrief dialog closes and returns focus",
  );
  const moreContextPresent = await evaluateBoolean(`(() =>
    document.querySelector('.continuities-item-details > summary') !== null
  )()`);
  if (moreContextPresent) {
    assert.equal(
      await evaluateBoolean(`(() => {
        const summary = document.querySelector(
          '.continuities-item-details > summary'
        );
        const item = summary?.closest('[data-blank-state-continuity-item]');
        const previous = item?.querySelector(
          '.blank-state-primary-action, .blank-state-secondary-link'
        );
        if (!(summary instanceof HTMLElement) ||
            !(previous instanceof HTMLElement)) return false;
        previous.focus();
        return document.activeElement === previous;
      })()`),
      true,
      "More context needs a preceding source-owned action for keyboard focus validation",
    );
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    const moreContextFocus = await evaluateJson(`(() => {
      const summary = document.querySelector(
        '.continuities-item-details > summary'
      );
      const style =
        summary instanceof HTMLElement ? getComputedStyle(summary) : null;
      return {
        focused: summary === document.activeElement,
        outline_style: style?.outlineStyle ?? null,
        outline_width: style?.outlineWidth ?? null,
        aria_selected_absent:
          summary instanceof HTMLElement &&
          summary.hasAttribute('aria-selected') === false,
      };
    })()`);
    assert.equal(
      moreContextFocus.focused &&
        moreContextFocus.outline_style === "solid" &&
        moreContextFocus.outline_width === "3px" &&
        moreContextFocus.aria_selected_absent,
      true,
      `more_context_keyboard_focus_visible:${JSON.stringify(moreContextFocus)}`,
    );
    result.viewport_results.push({
      surface: "blank_state_more_context_focus",
      more_context_keyboard_focus_visible: true,
      aria_selected_absent: true,
    });
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
    await openGuideBriefConversationAndAnswerSuggestedQuestion();
    const metrics = await evaluateJson(`(() => {
      const review = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
      const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
      const shellState = shell?.getAttribute('data-ai-workplane-state') ?? '';
      const actionOwner = review?.getAttribute('data-selected-work-primary-action-owner') ?? 'none';
      const primaryActionRequired =
        actionOwner === 'decision' ||
        actionOwner === 'transition' ||
        actionOwner === 'candidate_selection';
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
      const visibleText = review?.innerText ?? '';
      const timeline = review?.querySelector('[data-selected-work-timeline-items]');
      const identity = review?.querySelector(':scope > section:first-child');
      const current = timeline?.querySelector('[data-selected-work-timeline-current="true"]');
      const next = timeline?.querySelector('[data-selected-work-next-step]');
      const relationships = review?.querySelector(
        '[data-selected-work-relationships="selected_work_relationships.v0.1"]'
      );
      const relationshipSelector = relationships?.querySelector(
        '[data-selected-work-relationship-question-selector="true"]'
      );
      const relationshipAnswer = relationships?.querySelector(
        '[data-selected-work-relationship-answer-region="true"]'
      );
      const relationshipConnections = Array.from(
        relationships?.querySelectorAll('[data-selected-work-relationship-connection]') ?? []
      );
      const relationshipHighlights = relationshipConnections.filter(
        (connection) =>
          connection.getAttribute('data-selected-work-relationship-highlighted') === 'true'
      );
      const relationshipRect = relationships?.getBoundingClientRect();
      const conversation = review?.querySelector(
        '[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]'
      );
      const conversationDisclosure =
        conversation?.querySelector(':scope > details');
      const conversationControls = Array.from(
        conversation?.querySelectorAll('a, button, input, summary') ?? []
      ).filter(visible);
      const conversationRect = conversation?.getBoundingClientRect();
      const conversationOverlaps = conversationControls.flatMap(
        (control, index) =>
          conversationControls.slice(index + 1).filter((candidate) => {
            const left = control.getBoundingClientRect();
            const right = candidate.getBoundingClientRect();
            return Math.min(left.right, right.right) -
                Math.max(left.left, right.left) > 1 &&
              Math.min(left.bottom, right.bottom) -
                Math.max(left.top, right.top) > 1;
          })
      ).length;
      const advanced = Array.from(review?.querySelectorAll('details') ?? []).find(
        (item) => item.querySelector(':scope > summary')?.textContent?.includes('Advanced review')
      );
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
        timeline_version: review?.getAttribute('data-selected-work-timeline'),
        timeline_current_stage: review?.getAttribute('data-selected-work-current-stage'),
        timeline_action_owner: actionOwner,
        timeline_item_count: timeline?.querySelectorAll('[data-selected-work-timeline-item]').length ?? -1,
        timeline_current_count: timeline?.querySelectorAll('[data-selected-work-timeline-current="true"]').length ?? -1,
        timeline_first_reading_path:
          Boolean(identity && timeline) &&
          Boolean(identity.compareDocumentPosition(timeline) & Node.DOCUMENT_POSITION_FOLLOWING),
        current_position_textual:
          Boolean(current?.textContent?.trim()) &&
          Boolean(next?.textContent?.includes('What happens next')),
        chronology_text_backed:
          Boolean(current?.textContent?.includes('Current')) &&
          current?.getAttribute('aria-current') === 'step',
        relationship_present: Boolean(relationships && relationshipAnswer),
        relationship_selected_question_count:
          relationshipSelector instanceof HTMLSelectElement &&
          relationshipSelector.selectedOptions.length === 1
            ? 1
            : 0,
        relationship_question_count:
          relationshipSelector instanceof HTMLSelectElement
            ? relationshipSelector.options.length
            : 0,
        relationship_connection_count: relationshipConnections.length,
        relationship_highlight_count: relationshipHighlights.length,
        relationship_answer_availability:
          relationships?.getAttribute('data-selected-work-relationship-answer') ?? null,
        relationship_bounded:
          relationshipConnections.length <= 6 &&
          relationshipHighlights.length <= 1,
        relationship_text_backed:
          relationshipConnections.every(
            (connection) =>
              connection.textContent?.includes('Why it matters now') === true
          ),
        relationship_non_authoritative:
          relationships?.getAttribute(
            'data-selected-work-relationship-projection-only'
          ) === 'true' &&
          relationships?.getAttribute(
            'data-selected-work-relationship-semantic-authority'
          ) === 'false' &&
          relationships?.getAttribute(
            'data-selected-work-relationship-timeline-owner'
          ) === 'true' &&
          relationshipConnections.every(
            (connection) =>
              connection.getAttribute(
                'data-selected-work-relationship-authority'
              ) === 'false'
          ),
        relationship_after_timeline:
          Boolean(timeline && relationships) &&
          Boolean(
            timeline.compareDocumentPosition(relationships) &
              Node.DOCUMENT_POSITION_FOLLOWING
          ),
        relationship_before_advanced:
          Boolean(relationships && advanced) &&
          Boolean(
            relationships.compareDocumentPosition(advanced) &
              Node.DOCUMENT_POSITION_FOLLOWING
          ),
        relationship_inside_viewport:
          Boolean(relationshipRect) &&
          relationshipRect.left >= -1 &&
          relationshipRect.right <= window.innerWidth + 1,
        relationship_no_primary_action:
          relationships?.querySelector('[data-ai-workplane-primary-action]') === null,
        relationship_no_chronology_authority:
          relationships?.querySelector(
            '[data-selected-work-timeline-current], [data-selected-work-next-step]'
          ) === null,
        relationship_no_graph_controls:
          relationships?.querySelector(
            'canvas, svg, [data-relationship-node], [data-relationship-edge], [data-graph-control]'
          ) === null &&
          !/\b(?:pan|zoom|force layout|graph editor)\b/i.test(
            relationships?.textContent ?? ''
          ),
        conversation_present:
          conversation?.getAttribute('data-guidebrief-conversation-surface') ===
            'ai_workplane',
        conversation_open:
          conversation?.getAttribute(
            'data-guidebrief-conversation-presentation'
          ) === 'embedded' ||
          (
            conversationDisclosure instanceof HTMLDetailsElement &&
            conversationDisclosure.open
          ),
        conversation_secondary:
          conversation?.querySelector('[data-ai-workplane-primary-action]') === null &&
          conversation?.querySelector('[data-augnes-primary-action]') === null &&
          conversation?.hasAttribute('data-augnes-independent-surface') === false,
        conversation_question_input_count:
          conversation?.querySelectorAll(
            'input[name="guidebrief-question"][type="text"]'
          ).length ?? -1,
        conversation_suggestion_count:
          conversation?.querySelectorAll(
            '[aria-label="Questions supported by current sources"] button'
          ).length ?? -1,
        conversation_interaction_host:
          conversation?.getAttribute('data-guidebrief-interaction') ===
            'bounded-browser-v0.1',
        conversation_interaction_suggestion_count:
          conversation?.querySelectorAll(
            '[aria-label="Interactions supported by current owners"] button'
          ).length ?? -1,
        conversation_presentation_count:
          conversation?.querySelectorAll(
            '[data-guidebrief-conversation-answer], [data-guidebrief-interaction-plan], [data-guidebrief-interaction-outcome]'
          ).length ?? -1,
        conversation_answer_count:
          conversation?.querySelectorAll(
            '[data-guidebrief-conversation-answer]'
          ).length ?? -1,
        conversation_active_answer:
          conversation?.getAttribute(
            'data-guidebrief-conversation-active-answer'
          ) === 'true',
        conversation_scope_present:
          (conversation?.getAttribute(
            'data-guidebrief-conversation-scope'
          )?.length ?? 0) > 0,
        conversation_controls_minimum_size:
          conversationControls.every((control) => {
            const bounds = control.getBoundingClientRect();
            return bounds.width >= 40 && bounds.height >= 40;
          }),
        conversation_overlapping_control_count: conversationOverlaps,
        conversation_inside_viewport:
          Boolean(conversationRect) &&
          conversationRect.left >= -1 &&
          conversationRect.right <= window.innerWidth + 1,
        conversation_after_relationship:
          Boolean(relationships && conversation) &&
          Boolean(
            relationships.compareDocumentPosition(conversation) &
              Node.DOCUMENT_POSITION_FOLLOWING
          ),
        conversation_before_advanced:
          Boolean(conversation && advanced) &&
          Boolean(
            conversation.compareDocumentPosition(advanced) &
              Node.DOCUMENT_POSITION_FOLLOWING
          ),
        conversation_no_duplicate_timeline_or_relationship:
          conversation?.querySelector(
            '[data-selected-work-timeline], [data-selected-work-relationships]'
          ) === null,
        conversation_public_copy_safe:
          !/(TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|packet fingerprint|sha256:|proposal-candidate:|nonce|TTL|database path)/i.test(
            conversation?.innerText ?? ''
          ),
        conversation_boundary_textual:
          conversation?.textContent?.includes(
            'This surface does not save a decision'
          ) === true,
        advanced_optional: advanced instanceof HTMLDetailsElement && advanced.open === false,
        protocol_vocabulary_absent:
          !/(ReviewDecision|StateTransitionReceipt|EpisodeDeltaProposal|CriterionAssessment|semantic gate|packet fingerprint)/i.test(visibleText),
        protocol_vocabulary_matches:
          visibleText.match(/ReviewDecision|StateTransitionReceipt|EpisodeDeltaProposal|CriterionAssessment|semantic gate|packet fingerprint/gi) ?? [],
        raw_id_absent:
          !/(episode-delta-proposal:|review-decision:|state-transition-receipt:|sha256:)/i.test(visibleText),
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
          Array.from(review?.querySelectorAll('[data-augnes-independent-surface]') ?? []).filter(visible).length,
        state_badge_count:
          Array.from(review?.querySelectorAll('[data-augnes-state-badge]') ?? []).filter(visible).length,
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
      ['change_decision', 'change_completion', 'change_applied'].includes(metrics.shell_state),
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.timeline_version, "selected_work_timeline.v0.1", JSON.stringify(metrics));
    assert.equal(metrics.timeline_item_count > 0 && metrics.timeline_item_count <= 8, true, JSON.stringify(metrics));
    assert.equal(metrics.timeline_current_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.timeline_first_reading_path, true, JSON.stringify(metrics));
    assert.equal(metrics.current_position_textual, true, JSON.stringify(metrics));
    assert.equal(metrics.chronology_text_backed, true, JSON.stringify(metrics));
    assert.equal(metrics.relationship_present, true, JSON.stringify(metrics));
    assert.equal(
      metrics.relationship_selected_question_count,
      metrics.relationship_question_count > 0 ? 1 : 0,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.relationship_question_count > 0 &&
        metrics.relationship_question_count <= 4,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.relationship_bounded, true, JSON.stringify(metrics));
    assert.equal(
      metrics.relationship_answer_availability === "unavailable"
        ? metrics.relationship_highlight_count === 0
        : metrics.relationship_highlight_count === 1,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.relationship_connection_count > 0 ||
        metrics.relationship_answer_availability === "unavailable",
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.relationship_text_backed, true, JSON.stringify(metrics));
    assert.equal(
      metrics.relationship_non_authoritative,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.relationship_after_timeline, true, JSON.stringify(metrics));
    assert.equal(metrics.relationship_before_advanced, true, JSON.stringify(metrics));
    assert.equal(
      metrics.relationship_inside_viewport,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.relationship_no_primary_action,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.relationship_no_chronology_authority,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.relationship_no_graph_controls,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.conversation_present, true, JSON.stringify(metrics));
    assert.equal(metrics.conversation_open, true, JSON.stringify(metrics));
    assert.equal(metrics.conversation_secondary, true, JSON.stringify(metrics));
    assert.equal(
      metrics.conversation_question_input_count,
      1,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_suggestion_count >= 3 &&
        metrics.conversation_suggestion_count <= 5,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.conversation_interaction_host, true);
    assert.equal(
      metrics.conversation_interaction_suggestion_count >= 2 &&
        metrics.conversation_interaction_suggestion_count <= 8,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_presentation_count,
      1,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.conversation_answer_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.conversation_active_answer, true, JSON.stringify(metrics));
    assert.equal(metrics.conversation_scope_present, true, JSON.stringify(metrics));
    assert.equal(
      metrics.conversation_controls_minimum_size,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_overlapping_control_count,
      0,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_inside_viewport,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_after_relationship,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_before_advanced,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_no_duplicate_timeline_or_relationship,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_public_copy_safe,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(
      metrics.conversation_boundary_textual,
      true,
      JSON.stringify(metrics),
    );
    assert.equal(metrics.advanced_optional, true, JSON.stringify(metrics));
    assert.equal(
      metrics.protocol_vocabulary_absent,
      true,
      JSON.stringify({
        protocol_vocabulary_matches: metrics.protocol_vocabulary_matches,
        ...metrics,
      }),
    );
    assert.equal(metrics.raw_id_absent, true, JSON.stringify(metrics));
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
    assert.equal(metrics.primary_action_touch_target, true, JSON.stringify(metrics));
    assert.equal(metrics.independent_surface_count, 1, JSON.stringify(metrics));
    assert.equal(metrics.state_badge_count <= 1, true, JSON.stringify(metrics));
    assert.equal(metrics.raw_record_after_primary, true, JSON.stringify(metrics));
    assert.equal(metrics.primary_navigation_visible, true, JSON.stringify(metrics));
    result.selected_work_timeline_first = true;
    if (
      !result.selected_work_timeline_state_coverage.includes(
        metrics.timeline_current_stage,
      )
    ) {
      result.selected_work_timeline_state_coverage.push(
        metrics.timeline_current_stage,
      );
    }
  }
  await evaluateBoolean(`(() => {
    const conversation = Array.from(
      document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')
    ).find((candidate) => {
      const bounds = candidate.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0;
    });
    const details = conversation?.querySelector(':scope > details');
    if (!(details instanceof HTMLDetailsElement)) return false;
    details.open = false;
    return true;
  })()`);
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

function sessionMutationAction(request) {
  if (
    request?.method !== "POST" ||
    request?.path !== "/api/vnext/operator/session"
  ) {
    return null;
  }
  const body = requestJsonBody(request);
  return body?.action === "bootstrap" || body?.action === "logout"
    ? body.action
    : null;
}

function requestJsonBody(request) {
  if (typeof request?.post_data !== "string") return null;
  try {
    const body = JSON.parse(request.post_data);
    return body && typeof body === "object" ? body : null;
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

function registerExpectedSessionRefusal({
  tokenId,
  status,
  chromeLogText,
}) {
  expectedRefusalRequestLifecycles.clear();
  expectedRefusalAccountingPhases.add(currentPhase);
  expectedRefusalAccounting.register({
    token_id: tokenId,
    phase: currentPhase,
    refusal: {
      method: "GET",
      path: "/api/vnext/operator/session",
      status,
      chrome_log_text: chromeLogText,
    },
    recovery: {
      method: "POST",
      path: "/api/vnext/operator/session",
      status: 200,
    },
    authenticated: {
      method: "GET",
      path: "/api/vnext/operator/session",
      status: 200,
    },
  });
  expectedRefusalAccountingActive = true;
}

async function readAuthenticatedSessionInBrowser() {
  return evaluateJson(`(async () => {
    const response = await fetch('/api/vnext/operator/session', {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    return { status: response.status, body: await response.json() };
  })()`);
}

async function waitForExpectedRefusalSettlement(tokenId, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    expectedRefusalAccounting.assertHealthy();
    if (Date.now() - lastObserverActivityAt >= REQUEST_QUIET_MS) {
      if (expectedRefusalAccounting.isSettled(tokenId)) {
        recordLongWait(
          "wait_for_expected_refusal_settlement",
          label,
          startedAt,
        );
        return;
      }
      expectedRefusalAccounting.finalize();
    }
    await delay(100);
  }
  expectedRefusalAccounting.finalize();
  throw new Error(`Timed out waiting for ${label}.`);
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
    const latestPacket = writableDatabase
      .prepare(
        `SELECT created_at
           FROM vnext_core_records
          WHERE workspace_id = ? AND project_id = ?
            AND record_kind = 'task_context_packet'
          ORDER BY created_at DESC, record_id DESC
          LIMIT 1`,
      )
      .get(project.workspace_id, project.project_id);
    const generatedAt = latestPacket
      ? new Date(Date.parse(latestPacket.created_at) + 1).toISOString()
      : TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT;
    const expiresAt = latestPacket
      ? new Date(Date.parse(generatedAt) + 1).toISOString()
      : TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT;
    const input = structuredClone(genericCliBuilderInputFixture);
    const currentness = structuredClone(input.source_status.currentness);
    input.workspace_id = project.workspace_id;
    input.project_id = project.project_id;
    input.generated_at = generatedAt;
    input.expires_at = expiresAt;
    input.current_projection = {
      projection_kind: "current_working_perspective",
      projection_only: true,
      canonical_state: false,
      perspective_ref: "perspective:browser-expired-context",
      bounded_summary: marker,
      as_of: generatedAt,
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
    const latestPacket = writableDatabase
      .prepare(
        `SELECT created_at
           FROM vnext_core_records
          WHERE workspace_id = ? AND project_id = ?
            AND record_kind = 'task_context_packet'
          ORDER BY created_at DESC, record_id DESC
          LIMIT 1`,
      )
      .get(workspaceId, projectId);
    const startedAt = latestPacket
      ? new Date(Date.parse(latestPacket.created_at) + 1_000).toISOString()
      : "2026-07-21T06:00:00.000Z";
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

function readFirstWorkBrowserState(projectId) {
  const readableDatabase = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const coreCount = (recordKind) =>
      Number(
        readableDatabase
          .prepare(
            `SELECT COUNT(*) AS count
             FROM vnext_core_records
             WHERE project_id = ? AND record_kind = ?`,
          )
          .get(projectId, recordKind).count,
      );
    return {
      packets: coreCount("task_context_packet"),
      receipts: coreCount("run_receipt"),
      proposals: coreCount("episode_delta_proposal"),
      decisions: coreCount("review_decision"),
      transitions: coreCount("state_transition_receipt"),
      semantic_state: Number(
        readableDatabase
          .prepare(
            `SELECT COUNT(*) AS count
             FROM vnext_semantic_state_entries
             WHERE project_id = ?`,
          )
          .get(projectId).count,
      ),
      runs: Number(
        readableDatabase
          .prepare(
            `SELECT COUNT(*) AS count FROM autonomy_runs WHERE scope = ?`,
          )
          .get(projectId).count,
      ),
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
      packet_lineage_kind:
        typeof metadata.packet_lineage_kind === "string"
          ? metadata.packet_lineage_kind
          : null,
      source_transition_receipt_id:
        typeof metadata.source_transition_receipt_id === "string"
          ? metadata.source_transition_receipt_id
          : null,
      first_work_definition_id:
        typeof metadata.first_work_definition_id === "string"
          ? metadata.first_work_definition_id
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
