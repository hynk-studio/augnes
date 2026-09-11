import { readProjectRunResultDetailV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import { defineAuthoredSuccessorTaskV01, prepareAuthoredSuccessorHandoffV01 } from "../lib/vnext/runtime/authored-successor-task";
import { assertAuthoredSuccessorInventoryV01, readAuthoredSuccessorDefinitionV01, normalizeAuthoredSuccessorTaskV01 } from "../lib/vnext/authored-successor-task";
import { validateRunReceiptV01 } from "../lib/vnext/run-receipt";
import { createRecordedCodexAppServerAdapterV01 } from "./codex-app-server-observation-recorder";
import { assertNativeHostResultV01, assertNativeHostPublicTextV01 } from "../lib/vnext/native-host/native-host-contract";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

import Database from "better-sqlite3";
import { readAutonomyRunLedgerRecord, updateAutonomyRunLedgerFields } from "../lib/autonomy/runner-ledger";
import { LiveNativeHostRunServiceV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import { createCodexAppServerAdapterV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import { createCodexScopedTaskV01, createCodexFeasibilityWindowV01, createPersistedCodexFeasibilityContinuationV01, readCodexScopedSnapshotV01, releaseCodexScopedTaskV01 } from "../lib/vnext/native-host/codex-scoped-task";
import { buildTaskStartGuideBriefCodexProjectionV02 } from "../lib/vnext/guide-brief/project-guide-brief";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, normalizeSelectedWorkSources, readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
import { SELECTED_WORK_SOURCE_LABELS } from "../types/vnext/project-work-revision";
import { recallRetainedWorkSources, resolveRetainedWorkSources } from "../lib/intake/retained-work-source-recall";

import {
  insertVNextCoreRecordV01,
  listVNextCoreRecordsV01,
  type VNextCoreRecordKindV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
  parseAndValidatePortableProjectV01,
} from "../lib/vnext/portability/portable-project";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { readProjectHomeProjectionV01 } from "../lib/vnext/project-home/project-home-projection";
import { buildProjectGuideBriefV02 } from "../lib/vnext/guide-brief/project-guide-brief";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  createTaskContextPacketFingerprintV01,
  deriveTaskContextPacketIdV01,
  validateTaskContextPacketV01,
} from "../lib/vnext/task-context-packet";
import {
  buildInitialProjectWorkTaskContextPacketV01,
  inspectInitialProjectWorkPacketLineageV01,
  normalizeInitialProjectWorkDefinitionV01,
} from "../lib/vnext/runtime/initial-project-work-context";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  revokeVNextLocalOperatorSessionByIdV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  defineInitialProjectWorkV01,
  readProjectWorkInitializationV01,
} from "../lib/vnext/runtime/project-work-initialization";
import {
  readProjectWorkRevisionEligibilityV01,
  revisePreExecutionProjectWorkV01,
} from "../lib/vnext/runtime/project-work-revision";
import {
  buildPreExecutionProjectWorkRevisionPacketV01,
  inspectPreExecutionProjectWorkRevisionChainV01,
} from "../lib/vnext/runtime/pre-execution-project-work-revision";
import { compileTaskContextPacketFromPersistedSemanticStateV01, VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  buildDirectNativeHostRunIdentityV01,
  admitPersistedHostTaskContextPacketV01,
  runDirectNativeHostRoundTripV01,
  shouldAttachNativeHostTaskStartGuideV01,
  type PersistedHostPacketAdmissionV01,
} from "../lib/vnext/runtime/direct-native-host-round-trip";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { recordVNextOperatorPilotProposalRevisionV01 } from "../lib/vnext/runtime/operator-pilot-proposal-revision";
import { readVNextOperatorPilotSemanticReviewV01, recordVNextOperatorPilotReviewDecisionV01 } from "../lib/vnext/runtime/operator-pilot-review-material";
import { prepareVNextOperatorPilotSemanticCommitPreviewV01, confirmVNextOperatorPilotSemanticCommitV01, applyVNextOperatorPilotReviewedSemanticTransitionV01 } from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision";
import { inspectVNextOperatorPilotPacketLineageV01, projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { NativeHostRequestV01 } from "../types/vnext/native-host-adapter";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import type { RunReceiptV01 } from "../types/vnext/run-receipt";
import {
  INITIAL_PROJECT_WORK_LIMITS_V01,
  type DefineInitialProjectWorkRequestV01,
  type ProjectWorkDefinitionV01,
} from "../types/vnext/project-work-initialization";
import type { RevisePreExecutionProjectWorkRequestV01 } from "../types/vnext/project-work-revision";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { issueVNextLocalReviewAccessV01 } from "./issue-vnext-local-review-access";

const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-first-work-"));
const T0 = "2026-08-01T00:00:00.000Z";
const T1 = "2026-08-01T00:00:01.000Z";
const T2 = "2026-08-01T00:00:02.000Z";

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const initializationStarted = performance.now();
  try {
    if (process.argv.includes("--result-admission-only")) { await assertResultAdmissionV01(); return; }
    if (process.argv.includes("--scoped-host-only") || scopedInterruptionPoint()) {
      await assertScopedNativeHostConnectionV01();
      return;
    }
    if (process.argv.includes("--executed-follow-up-only")) {
      await assertExecutedReviewedFollowUpV01();
      await assertResultAdmissionV01();
      return;
    }
    if (process.argv.includes("--successor-handoff-only")) {
      await assertPersistedScopedContinuationV01(["handoff"]);
      return;
    }
    if (process.argv.includes("--persisted-continuation-only")) {
      await assertPersistedScopedContinuationV01();
      return;
    }
    assertNormalizationAndCompilerV01();
    assertNativeHostRunIdentityCompatibilityV01();
    assertInitializationReadPolicyV01();
    assertLocalReviewAccessIssuanceV01();
    assertMutationAndReplayV01();
    assertRevisionMutationAndReplayV01();
    assertExactSuccessorReplayHistoryBoundaryV01();
    assertRevisionRecoveryRefusalsV01();
    assertRevisionLimitV01();
    assertMutationRefusalsAndRollbackV01();
    assertInitialWorkPortabilityV01();
    assertRevisionPortabilityAndRecoveryV01();
    await assertSelectedSourceNextWorkV01();
    await assertRetainedSourceRecallV01();
    await assertSeparateNativeHostStartV01();
    await assertRevisedNativeHostStartV01();
    console.log(JSON.stringify({ initialization_ms: performance.now() - initializationStarted, scoped_cases: 0 }));
    console.log(JSON.stringify({
      status: "pass",
      contract: "project_work_initialization.v0.1",
      states: [
        "not_defined",
        "defined_initial_work",
        "existing_history_without_current_packet",
        "unavailable",
      ],
      korean_and_unicode: true,
      exact_replay: true,
      revision_exact_replay: true,
      revision_exact_successor_replay_requires_zero_history: true,
      revision_append_only: true,
      revision_stale_cas_refused: true,
      revision_branch_and_missing_prior_refused: true,
      revision_limit_refused_without_write: true,
      authenticated_transaction: true,
      save_execution_started: false,
      separate_native_host_start: true,
      revised_native_host_start: true,
      portability_round_trip: true,
      fake_transition_created: false,
      schema_migration_added: false,
    }, null, 2));
  } finally {
    rmSync(ROOT, { recursive: true, force: true });
  }
}

// Fixed credential-free App Server transport; the adapter parser, direct
// executor, result validator and durable receipt/proposal producers are real.
async function assertResultAdmissionV01(): Promise<void> {
  for (const scenario of ["label_free", "labels", "labels_skipped", "private_summary", "private_check", "private_command", "private_skipped",
    "private_array", "credential", "final_root", "unknown_field", "capture_failure", "observer_failure"] as const) {
    const fixture = createFixtureV01(`result-admission-${scenario}`);
    const output = path.join(ROOT, `capture-${scenario}`); mkdirSync(output);
    const home = path.join(output, "home"); mkdirSync(home);
    const trace = path.join(output, "trace.jsonl"), cleanup = path.join(output, "cleanup"), network = path.join(output, "network");
    const pids = new Set<number>();
    let sessionId: string | undefined;
    const observations: import("../lib/vnext/native-host/codex-app-server-adapter").CodexAppServerAdapterObservationV01[] = [];
    let request: NativeHostRequestV01 | undefined;
    const now = timestampSequenceV01("2026-08-01T00:00:04.000Z");
    const recorded = createRecordedCodexAppServerAdapterV01({ directory: output, stage: 2,
      adapter_options: { now,
        launch: { command: process.execPath, prefix_args: [path.resolve("scripts/fixtures/fake-codex-app-server.mjs")],
          environment: { NODE_ENV: "test", HOME: home, CODEX_HOME: home, TMPDIR: output, PATH: process.env.PATH,
            FAKE_CODEX_SCENARIO: "result_admission", FAKE_CODEX_RESULT_CASE: scenario,
            FAKE_CODEX_TRACE_PATH: trace, FAKE_CODEX_CLEANUP_MARKER_PATH: cleanup, FAKE_CODEX_NETWORK_COUNT_PATH: network } },
        observe: event => {
          observations.push(event);
          if (event.kind === "spawned" && event.process_id) pids.add(event.process_id);
          if (event.kind === "turn_started" && scenario === "capture_failure") {
            rmSync(path.join(output, "events.jsonl")); mkdirSync(path.join(output, "events.jsonl"));
          }
          if (event.kind === "result_admission_rejected" && scenario === "observer_failure")
            throw new Error("SYNTHETIC_ADMISSION_OBSERVER_FAILURE");
        },
      } });
    try {
      const defined = defineInitialProjectWorkV01(fixture.db, { config: fixture.config,
        credential: authenticatedSessionV01(fixture, "admission"), request: requestV01(fixture, {
          goal: "Compare the bounded synthetic calibration artifact and preserve uncertainty.",
          success_criteria: ["Return a bounded comparison"], non_goals: ["No later experiment or semantic acceptance"],
        }), clock: fixedClock(T2) });
      const credential = credentialFromCookieV01(defined.session_admission.cookie_value); sessionId = credential.session_id;
      const invoke = () => runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive",
        operator_mutation: { credential, clock: fixedClock("2026-08-01T00:00:04.000Z") } }, {
        adapter: recorded.adapter, now, lifecycle_mode: "managed_live", live_host_egress_authorized: true,
        timeout_ms: 10_000, stop_settle_timeout_ms: 3_000,
        on_invocation_admitted: observed => { request = observed.request; },
      });
      if (scenario === "observer_failure") {
        await assert.rejects(invoke(), errorCode("direct_host_stop_unconfirmed"));
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 10 }).length, 0);
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 0);
        assert(request);
        const run = readAutonomyRunLedgerRecord(request.run_id, { db: fixture.db });
        assert.equal(run?.status, "paused");
        assert.equal(run?.metadata.reconciliation_required, true);
        assert.equal(observations.some(event => event.kind === "terminal_observed" && event.public_reason === "completed"), true);
        assert.equal(observations.some(event => event.kind === "settled"), true, "Observer failure does not prevent cleanup/readback attempt");
        assert.equal(recorded.closeCapture().result_admission_diagnostic_written, true);
        assert.equal(readFileSync(cleanup, "utf8"), "settled\n");
        assert.equal(readFileSync(network, "utf8"), "0\n");
        const capture = readFileSync(path.join(output, "events.jsonl"), "utf8");
        assert(!capture.includes("RESULT_ADMISSION_PRIVATE_SENTINEL"));
        assert(!capture.includes("SYNTHETIC_ADMISSION_OBSERVER_FAILURE"));
        for (const pid of pids) assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
        console.log(JSON.stringify({ result_admission_owner: { scenario, expected_observer_failure: true, receipt_count: 0, native_completed: true, cleanup: "settled" } }));
        continue;
      }
      const result = await invoke();
      recorded.closeCapture();
      const traceRows = readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line));
      const turnInput = traceRows.find(row => row.kind === "received" && row.value.method === "turn/start");
      assert.equal(turnInput?.value.result_guidance_rendered_and_schema, true);
      assert.equal(turnInput?.value.result_guidance_nested_schema, true);
      const captureText = scenario === "capture_failure" ? "" : readFileSync(path.join(output, "events.jsonl"), "utf8");
      const diskObservations = captureText.trim() ? captureText.trim().split("\n").map(line => JSON.parse(line)) : [];
      const diagnostic = diskObservations.find(event => event.kind === "result_admission_rejected")?.result_admission_diagnostic;
      const expectedCompleted = scenario === "labels" || scenario === "label_free" || scenario === "labels_skipped";
      const ownerResult = { scenario, host_outcome: result.host_result?.outcome,
        public_stop_reason: result.host_result?.public_stop_reason, verification: result.receipt.verification.status,
        native_completed: observations.some(event => event.kind === "terminal_observed" && event.public_reason === "completed"),
        receipt_persisted: listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 10 }).length,
        proposal_status: result.proposal.status, admission_diagnostic: diagnostic ?? null, capture: recorded.readCaptureStatus(),
        owned_processes_settled: [...pids].every(pid => { try { process.kill(pid, 0); return false; } catch { return true; } }),
        network_requests: readFileSync(network, "utf8").trim(), cleanup: readFileSync(cleanup, "utf8").trim() };
      console.log(JSON.stringify({ result_admission_owner: ownerResult }));
      assert.equal(ownerResult.native_completed, true);
      assert.equal(ownerResult.host_outcome, expectedCompleted ? "completed" : "failed");
      assert.equal(ownerResult.verification, expectedCompleted && scenario !== "labels_skipped" ? "passed" : "partial");
      assert(request);
      assert.equal(readAutonomyRunLedgerRecord(request.run_id, { db: fixture.db })?.metadata.reconciliation_required, false);
      assert.equal(recorded.readCaptureStatus().failed_terminal_diagnostic_written, false, "No failed native terminal is invented");
      if (scenario === "capture_failure") {
        assert.equal(recorded.readCaptureStatus().capture_failure, "artifact_write_failed");
        assert.equal(recorded.readCaptureStatus().result_admission_diagnostic_written, false);
      } else if (expectedCompleted) {
        assert.equal(diagnostic, undefined);
        assert.equal(result.host_result!.checks.find(check => check.check_id === "calibration_b_comparison")?.status, "passed");
        assert(result.receipt.attestations.some(item => item.summary.includes("reference=12")));
        assert(!result.receipt.observations.some(item => /reference=12|comparison attested/u.test(item.summary)), "Model text stays attested");
        assert.equal(assertNativeHostResultV01(request, result.host_result!).summary, result.host_result!.summary);
        if (scenario === "labels") {
          // Exercise both final result and receipt privacy readers independently
          // of parser prechecks. Mutations stay in test input, never in the DB.
          for (const value of ["B: read /private/synthetic/forbidden", "B: C:private.txt", "B: file:///private/synthetic/forbidden"]) {
            assert.throws(() => assertNativeHostResultV01(request!, { ...result.host_result!, summary: value }), /absolute_path_forbidden/);
            const receipt = structuredClone(result.receipt); receipt.result_summary.summary = value;
            assert(validateRunReceiptV01(receipt).errors.some(issue => issue.code === "absolute_local_path_forbidden"));
          }
          const receipt = structuredClone(result.receipt); receipt.commands[0]!.command_id = "C: private.txt";
          assert(validateRunReceiptV01(receipt).errors.some(issue => issue.code === "absolute_local_path_forbidden"), "Identifiers are not prose");
        }
      } else {
        const fields: Record<string, string> = { private_summary: "summary", private_check: "checks[].summary",
          private_command: "commands[].summary", private_skipped: "skipped_checks[].reason", private_array: "uncertainty[]",
          credential: "summary", final_root: "artifacts[].artifact_ref.external_id", unknown_field: "unknown" };
        const diagnosticEvent = diskObservations.find(event => event.kind === "result_admission_rejected");
        assert.equal(diagnosticEvent.run_id, request.run_id);
        assert.equal(typeof diagnosticEvent.thread_id, "string"); assert.equal(typeof diagnosticEvent.turn_id, "string");
        assert.equal(diskObservations.filter(event => event.kind === "result_admission_rejected").length, 1);
        assert.deepEqual(diagnostic, { gate: scenario === "final_root" ? "native_result_validation" : "structured_result_parsing",
          field: fields[scenario], rule_family: scenario === "credential" ? "raw_material" : scenario === "unknown_field" ? "shape_or_bound" : "path_disclosure",
          code: scenario === "credential" ? "native_host_result_raw_material_forbidden" : scenario === "unknown_field" ? "codex_structured_result_shape_invalid" : "native_host_result_absolute_path_forbidden" });
        assert.equal(result.host_result!.checks.some(check => check.check_id === "calibration_b_comparison"), false);
        assert.equal(result.host_result!.summary.includes("reference=12"), false);
      }
      const retained = JSON.stringify({ records: listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt", "episode_delta_proposal"], limit: 128 }),
        run: readAutonomyRunLedgerRecord(request.run_id, { db: fixture.db }) }) + captureText + readFileSync(trace, "utf8") + readFileSync(path.join(output, "adapter-capture-status.json"), "utf8");
      for (const value of ["RESULT_ADMISSION_PRIVATE_SENTINEL", "RESULT_ADMISSION_CREDENTIAL_SENTINEL", "RESULT_ADMISSION_UNKNOWN_KEY_SENTINEL",
        "B: read /private/synthetic/RESULT_ADMISSION_PRIVATE_SENTINEL", "B: api_key=RESULT_ADMISSION_CREDENTIAL_SENTINEL", request.root_scope.canonical_root + "/RESULT_ADMISSION_PRIVATE_SENTINEL"]) {
        assert(!retained.includes(value));
        assert(!retained.includes(createHash("sha256").update(value).digest("hex")), "No value-derived diagnostic hash");
      }
      assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["review_decision", "state_transition_receipt"], limit: 10 }).length, 0);
      const statusOnDisk = JSON.parse(readFileSync(path.join(output, "adapter-capture-status.json"), "utf8"));
      assert.deepEqual(statusOnDisk, recorded.readCaptureStatus());
      assert.equal(ownerResult.receipt_persisted, 1);
      assert.equal(ownerResult.proposal_status, "available");
      assert.equal(ownerResult.owned_processes_settled, true);
      assert.equal(ownerResult.network_requests, "0"); assert.equal(ownerResult.cleanup, "settled");
      assertNativeHostPublicTextV01(result.host_result!.summary);
    } finally {
      recorded.closeCapture();
      if (sessionId) assert(revokeVNextLocalOperatorSessionByIdV01(fixture.db, { config: fixture.config, session_id: sessionId, clock: fixedClock("2026-08-01T00:01:00.000Z") }).revoked_at);
      fixture.db.close(); assert.equal(fixture.db.open, false);
    }
  }
}

// Test-only fault injection: deliberately prevent child-local finally cleanup.
// The existing parent child-runner must time out, settle the tree and reclaim
// its already-owned resource root. No production scope handle is reconstructed.
function scopedInterruptionPoint(): string | undefined {
  if (process.argv.includes("--interrupt-scoped-after-snapshot")) return "snapshot";
  if (process.argv.includes("--interrupt-scoped-after-host")) return "host";
}
function interruptScopedFixture(point: string, snapshotRoot: string, pid?: number): void {
  if (scopedInterruptionPoint() !== point) return;
  console.log(JSON.stringify({ scoped_interruption: point, snapshot_root: snapshotRoot, fake_host_pid: pid ?? null }));
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
}

async function assertScopedNativeHostConnectionV01(): Promise<void> {
  for (const scenario of ["success", "cwd_alias", "cwd_relative", "cwd_source", "cwd_other_snapshot",
    "cwd_outside", "cwd_traversal", "cwd_invalid", "cwd_duplicate", "cwd_conflict",
    "default_success", "default_outside", "prestart_source", "running_source", "snapshot_corruption"] as const) {
    if (scopedInterruptionPoint() && scenario !== "success") break;
    const timing: Record<string, number> = {};
    const caseStarted = performance.now();
    let mark = caseStarted;
    const mismatch = scenario === "prestart_source";
    const scoped = !scenario.startsWith("default_");
    const commandItems = !["prestart_source", "running_source", "snapshot_corruption"].includes(scenario);
    const rejectedCwd = ["cwd_source", "cwd_other_snapshot", "cwd_outside", "cwd_traversal", "cwd_invalid", "default_outside"].includes(scenario);
    const rejectedEvent = rejectedCwd || scenario === "cwd_conflict";
    const name = `scoped-${scenario}`;
    const fixture = createFixtureV01(name, false, true, true);
    timing.fixture_ms = performance.now() - mark; mark = performance.now();
    let service: LiveNativeHostRunServiceV01 | null = null;
    let snapshotRoot: string | undefined;
    const scopes: Awaited<ReturnType<typeof createCodexScopedTaskV01>>[] = [];
    const processes = new Set<number>();
    let sessionId: string | undefined;
    try {
      const taskFile = path.join(fixture.root, "TASK.txt");
      writeFileSync(taskFile, "Synthetic scoped native result check.\n");
      const defined = defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config, credential: authenticatedSessionV01(fixture, "scoped"),
        request: requestV01(fixture), clock: fixedClock(T2),
      });
      const scopeInput = { stage: 1 as const, canonical_root: fixture.root,
        packet_id: defined.packet.packet_id, packet_fingerprint: defined.packet.integrity.fingerprint,
        guide_brief_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(buildTaskStartGuideBriefCodexProjectionV02({ packet: defined.packet, project_name: `First work ${name}` }))),
        files: [{ relative_path: "TASK.txt", sha256: createHash("sha256").update(readFileSync(taskFile)).digest("hex") }],
      };
      const scope = await createCodexScopedTaskV01(scopeInput); scopes.push(scope);
      const snapshot = readCodexScopedSnapshotV01(scope); snapshotRoot = snapshot.root;
      assert.notEqual(snapshotRoot, fixture.root);
      timing.preparation_ms = performance.now() - mark; mark = performance.now();
      interruptScopedFixture("snapshot", snapshotRoot);
      let commandCwd = scoped ? snapshot.root : fixture.root;
      if (scenario === "cwd_source") commandCwd = fixture.root;
      if (scenario === "cwd_outside" || scenario === "default_outside") commandCwd = ROOT;
      if (scenario === "cwd_traversal") commandCwd = `${snapshot.root}/../outside`;
      if (scenario === "cwd_invalid") commandCwd = "C:\\outside";
      if (scenario === "cwd_relative") commandCwd = ".";
      if (scenario === "cwd_alias") {
        // macOS /var aliases /private/var. Other platforms retain the canonical
        // path spelling; their existing path-owner cases run separately.
        commandCwd = process.platform === "darwin" ? snapshot.root.replace(/^\/private\/var\//u, "/var/") : snapshot.root + "/.";
        assert.equal(realpathSync(commandCwd), snapshot.root);
      }
      if (scenario === "cwd_other_snapshot") {
        const other = await createCodexScopedTaskV01(scopeInput); scopes.push(other);
        commandCwd = readCodexScopedSnapshotV01(other).root;
        assert.notEqual(commandCwd, snapshot.root);
        // Neither a forged handle nor another genuine scope can replace the
        // service's producing binding. Capability reads launch no host.
        assert.throws(() => new LiveNativeHostRunServiceV01({
          scoped_task: { scope: { ...scope }, window: createCodexFeasibilityWindowV01() },
        }).readCapabilityContractV01(), /scope_not_source_owned/);
        assert.throws(() => new LiveNativeHostRunServiceV01({
          scoped_task: { scope, window: createCodexFeasibilityWindowV01() },
          adapter_factory: () => createCodexAppServerAdapterV01({ scoped_task: other }),
        }).readCapabilityContractV01(), /scoped_adapter/);
      }
      const hostHome = path.join(ROOT, `${name}-home`); mkdirSync(hostHome);
      const trace = path.join(ROOT, `${name}-trace.jsonl`);
      const cleanup = path.join(ROOT, `${name}-cleanup`);
      const window = createCodexFeasibilityWindowV01();
      service = new LiveNativeHostRunServiceV01({ now: timestampSequenceV01("2026-08-01T00:00:04.000Z"),
        ...(scoped ? { scoped_task: { scope, window } } : {}), timeout_ms: 10_000, stop_settle_timeout_ms: 3_000,
        adapter_factory: bound => createCodexAppServerAdapterV01({ scoped_task: bound,
          observe: observation => {
            if (observation.kind === "spawned" && observation.process_id) {
              processes.add(observation.process_id);
            }
            if (observation.kind !== "turn_started") return;
            interruptScopedFixture("host", snapshot.root, [...processes][0]);
            if (scenario === "running_source") writeFileSync(taskFile, "Synthetic source drift after turn submission.\n");
            if (scenario === "snapshot_corruption") {
              // Independent controller-side corruption tests detection, not an
              // authorized worker writer or a hostile-host prevention claim.
              const file = path.join(snapshot.root, "TASK.txt");
              chmodSync(file, 0o600); writeFileSync(file, "Synthetic snapshot corruption.\n");
            }
          }, launch: {
          command: process.execPath, prefix_args: [path.join(process.cwd(), "scripts/fixtures/fake-codex-app-server.mjs")],
          environment: { NODE_ENV: "test", HOME: hostHome, CODEX_HOME: hostHome, PATH: process.env.PATH,
            FAKE_CODEX_SCENARIO: commandItems ? (scoped ? "scoped_command_cwd" : "command_cwd") : "scoped_success",
            FAKE_CODEX_COMMAND_CWD: commandCwd,
            FAKE_CODEX_COMMAND_TERMINAL: rejectedEvent ? "withhold" : "complete",
            FAKE_CODEX_COMMAND_REPLAY: scenario === "cwd_duplicate" ? "duplicate" : scenario === "cwd_conflict" ? "conflict" : "none",
            FAKE_CODEX_TRACE_PATH: trace, FAKE_CODEX_CLEANUP_MARKER_PATH: cleanup },
        } }),
      });
      if (mismatch) writeFileSync(taskFile, "Synthetic drift after admission preparation.\n");
      const credential = credentialFromCookieV01(defined.session_admission.cookie_value);
      sessionId = credential.session_id;
      const start = () => service!.start({ config: fixture.config, mode: "interactive", operator_mutation: { credential, clock: fixedClock("2026-08-01T00:00:04.000Z") } });
      timing.adapter_setup_ms = performance.now() - mark; mark = performance.now();
      if (mismatch) await assert.rejects(start(), /direct_host_scoped_snapshot_admission_changed/);
      const started = mismatch ? null : await start();
      timing.start_ms = performance.now() - mark; mark = performance.now();
      timing.poll_count = 0; timing.poll_read_ms = 0; timing.poll_wait_ms = 0;
      const deadline = performance.now() + 10_000;
      let projection = started?.projection ?? service.read(fixture.config);
      while (!["completed", "failed", "paused", "blocked", "cancelled", "timed_out"].includes(projection.status)) {
        assert(performance.now() < deadline, "scoped service must settle within its existing limit");
        const waitStart = performance.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        timing.poll_wait_ms += performance.now() - waitStart;
        const readStart = performance.now(); projection = service.read(fixture.config);
        timing.poll_read_ms += performance.now() - readStart; timing.poll_count += 1;
      }
      timing.execution_settlement_ms = performance.now() - mark; mark = performance.now();
      if (mismatch) {
        assert.notEqual(projection.status, "completed");
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 10 }).length, 0);
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 0);
        assert.equal(readdirSync(ROOT).includes(path.basename(trace)), false, "Refused source must not spawn even the fake host");
      } else {
        if (commandItems) {
          const run = readAutonomyRunLedgerRecord(projection.run_ref!, { db: fixture.db });
          const checkpoints = run?.events.flatMap(event => event.payload?.checkpoint ? [event.payload.checkpoint] : []) ?? [];
          console.log(JSON.stringify({ check: "scoped_completed_command_cwd", scenario, status: projection.status,
            reason: projection.public_reason, source_snapshot_distinct: snapshot.root !== fixture.root,
            checkpoints }));
          assert.equal(checkpoints.length, 2, "Rejected/replayed observations must not erase or duplicate checkpoints");
          assert.equal(run?.metadata.root_kind, "plain_folder");
        }
        const receipts = listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 10 });
        if (rejectedEvent) {
          assert.equal(projection.status, "paused");
          assert.equal(projection.reconciliation_required, true);
          assert.equal(projection.public_reason, scenario === "cwd_conflict" ? "codex_item_event_conflict" : "codex_approval_path_outside_root");
          assert.equal(receipts.length, 0);
          assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 0);
        } else {
          assert.equal(projection.status, scenario === "running_source" ? "blocked" : scenario === "snapshot_corruption" ? "failed" : "completed");
          assert.equal(receipts.length, 1);
          const receipt = receipts[0]!.payload as RunReceiptV01;
          const run = readAutonomyRunLedgerRecord(projection.run_ref!, { db: fixture.db })!;
          assert(receipt.task_context_packet_ref);
          assert.equal(receipt.task_context_packet_ref.external_id, defined.packet.packet_id);
          const originalRootRef = receipt.source_refs.find(ref => ref.ref_type === "project_root_scope");
          assert.equal(originalRootRef?.external_id, fixture.project_id);
          assert.equal(originalRootRef?.source_ref, run.metadata.root_fingerprint);
          const durable = canonicalizeProtocolValueV01(receipts);
          if (scoped) {
            const observation = receipt.observations.find(value => value.observation_kind === "source_bound_input_snapshot");
            assert(observation);
            assert(observation.source_refs.some(ref => ref.ref_type === "native_host_input_snapshot" && ref.external_id === snapshot.fingerprint));
            assert(observation.source_refs.some(ref => ref.ref_type === "native_host_input_request_binding" && /^sha256:[a-f0-9]{64}$/u.test(ref.external_id)));
            assert(observation.source_refs.some(ref => ref.ref_type === "project_root_scope" && ref.source_ref === originalRootRef?.source_ref));
            assert(durable.includes(snapshot.fingerprint));
            assert(durable.includes("trusted_local_read_snapshot.v0.1"));
            assert(durable.includes('snapshot valid: ' + (scenario !== "snapshot_corruption")));
            assert(durable.includes('original source current at return: ' + (scenario !== "running_source")));
            assert(durable.includes('host outcome before input validation: completed'));
          }
          assert(durable.includes(defined.packet.packet_id));
          assert(!durable.includes(snapshot.root), "physical execution path is local binding, not a portable project root");
          if (commandItems) {
            assert(durable.includes("snapshot-command-item"));
            assert(durable.includes("host_command_item_completed"));
          }
          assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 1);
        }
        assert.equal(readFileSync(cleanup, "utf8"), "settled\n");
        const rows = readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line));
        if (commandItems) {
          const commandRows = rows.filter(row => row.kind === "command_cwd_items");
          assert.equal(commandRows.length, 1);
          assert.equal(commandRows[0].value.cwd, commandCwd, "Protocol item must retain the explicit cwd under test");
        }
        for (const row of rows.filter(row => row.kind === "received" && ["thread/start", "turn/start"].includes(row.value.method)))
          assert.equal(row.value.cwd, scoped ? snapshot.root : fixture.root);
      }
      assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["state_transition_receipt"], limit: 10 }).length, 0);
      if (scoped) await assert.rejects(service.start({ config: fixture.config, mode: "interactive", operator_mutation: { credential } }), /window_start_refused/);
    } finally {
      timing.assertions_ms = performance.now() - mark; mark = performance.now();
      try {
        await service?.shutdown();
        timing.service_shutdown_ms = performance.now() - mark; mark = performance.now();
        for (const scope of scopes) await releaseCodexScopedTaskV01(scope);
        timing.scope_release_ms = performance.now() - mark; mark = performance.now();
        if (snapshotRoot) assert.equal(existsSync(snapshotRoot), false);
        for (const pid of processes) assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
        if (sessionId) assert(revokeVNextLocalOperatorSessionByIdV01(fixture.db, { config: fixture.config, session_id: sessionId, clock: fixedClock("2026-08-01T00:01:00.000Z") }).revoked_at);
      } finally {
        fixture.db.close(); assert.equal(fixture.db.open, false);
        timing.session_db_cleanup_ms = performance.now() - mark;
        timing.total_ms = performance.now() - caseStarted;
        console.log(JSON.stringify({ scoped_case_timing: scenario, ...timing }));
      }
    }
  }
  console.log("scoped disposable service: fake App Server command items exercise the real adapter/service, authenticated synthetic admission, receipt/proposal and source/snapshot lineage; cwd aliases/default parity/replay pass; source/foreign snapshot/outside/traversal/forged binding/conflict refuse; checkpoints retained; source drift blocks and snapshot corruption invalidates; processes/sessions/DBs/snapshots settled; model calls=0; no actual task-command execution claimed");
}

async function assertExecutedReviewedFollowUpV01(): Promise<void> {
  const fixture = createFixtureV01("executed-reviewed-follow-up", false, true);
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => { fetchCalls += 1; throw new Error("p51_live_network_forbidden"); }) as typeof fetch;
  const counts = () => fixture.db.prepare("SELECT record_kind, COUNT(*) AS count FROM vnext_core_records WHERE project_id = ? GROUP BY record_kind ORDER BY record_kind").all(fixture.project_id);
  const history = () => fixture.db.prepare("SELECT record_id, payload_json FROM vnext_core_records WHERE project_id = ? ORDER BY record_id").all(fixture.project_id) as { record_id: string; payload_json: string }[];
  const started = performance.now();
  // These are inputs, fixed before execution. Neither a result nor the later
  // operator correction exists in the starting project.
  writeFileSync(path.join(fixture.root, "bench.json"), JSON.stringify({ X: { measured: 7, limit: 5 }, Y: { measured: null } }));
  writeFileSync(path.join(fixture.root, "calibration-B.json"), JSON.stringify({ reference: 5, expected: 5 }));
  const correction = "Post-result user correction: X exceeded its limit only in the cold-start sample. Reject the explanation that A always fails; preserve the X reading. Y is untested, not prohibited. The cause remains uncertain. Defer Y until calibration B is checked; revisit after B. Next check: compare B's reference with its expected value.";
  const requests: NativeHostRequestV01[] = [];
  const actions: string[] = [];
  function adapter(check: "X" | "B") {
    const base = createDeterministicCodexAdapterV01({ now: timestampSequenceV01(check === "X" ? "2026-08-01T00:00:05.000Z" : "2026-08-01T00:00:15.000Z"), observe: ({ request }) => requests.push(structuredClone(request)) });
    return { ...base, invoke(request: NativeHostRequestV01, control: Parameters<typeof base.invoke>[1]) {
      const handle = base.invoke(request, control);
      const result = handle.result.then((result) => {
        if (check === "X") {
          const data = JSON.parse(readFileSync(path.join(fixture.root, "bench.json"), "utf8"));
          assert.equal(data.Y.measured, null);
          actions.push("read_X_sample");
          return { ...result, summary: `X measured ${data.X.measured} against limit ${data.X.limit}; Y was not measured. The cause is unknown.`,
            checks: [...result.checks, { check_id: "cold_start_X", required: false, status: data.X.measured <= data.X.limit ? "passed" as const : "failed" as const, summary: "Only the cold-start X sample was compared with its limit." }],
            uncertainty: ["The X result does not establish the cause or Y behavior."], proposed_next_steps: ["Review the X result and choose a bounded next check."] };
        }
        assert.equal(request.packet.selected_context.filter((entry) => entry.entry_kind === "accepted_state_ref" && entry.bounded_summary === correction).length, 1, "The next deterministic consumer requires the reviewed correction");
        const data = JSON.parse(readFileSync(path.join(fixture.root, "calibration-B.json"), "utf8"));
        actions.push("compare_calibration_B");
        return { ...result, summary: `Calibration B reference ${data.reference} equals expected ${data.expected}. Y remains untested.`,
          checks: [...result.checks, { check_id: "calibration_B", required: false, status: data.reference === data.expected ? "passed" as const : "failed" as const, summary: "The local calibration reference was compared with its expected value." }],
          uncertainty: ["This calibration check does not establish Y behavior."], proposed_next_steps: ["Review B before separately authorizing a Y test."] };
      });
      const settled = result.then(() => undefined, () => undefined);
      return { ...handle, result, settled };
    } };
  }
  try {
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config, credential: authenticatedSessionV01(fixture, "p51"),
      request: requestV01(fixture, { goal: "Investigate A under cold-start X and condition Y, preserving uncertainty and choosing one next check", success_criteria: ["Distinguish measured conditions from untested conditions and review the next check"], non_goals: ["No live model, external data or automatic Y test"] }), clock: fixedClock(T2),
    });
    let credential = credentialFromCookieV01(initial.session_admission.cookie_value);
    const notes = [buildSelectedWorkSourceEntry(fixture, { source: "Synthetic bench protocol, revision 1", observed_at: "2026-08-01T00:00:00.000Z", provenance: "user_declaration", label: "Open question", text: "X is the cold-start sample in bench.json; Y has no reading. Calibration B is a separate input. Determine what is known before choosing the next check." }),
      buildSelectedWorkSourceEntry(fixture, { source: "Unverified explanation candidate, revision 1", observed_at: null, provenance: "derived_interpretation", label: "Unclassified / needs review", text: "Hypothesis: if A fails in X, A might fail in all conditions. This explanation is unverified." })];
    const comparison = compareSelectedWorkSources(initial.packet, notes);
    const selected = revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential,
      request: { ...revisionRequestV01(fixture, initial.packet, "initial_user_defined", initial.definition), selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint }, clock: fixedClock("2026-08-01T00:00:03.000Z") });
    credential = credentialFromCookieV01(selected.session_admission.cookie_value);
    assert.equal(JSON.stringify(history()).includes(correction), false);
    const preparationMs = performance.now() - started;
    const executionStarted = performance.now();
    const first = await runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive", operator_mutation: { credential, clock: fixedClock("2026-08-01T00:00:04.000Z") } }, { adapter: adapter("X"), now: timestampSequenceV01("2026-08-01T00:00:04.000Z") });
    const executionMs = performance.now() - executionStarted;
    credential = credentialFromCookieV01(first.session_admission!.cookie_value);
    assert.equal(first.status, "inserted");
    assert.equal(first.proposal.status, "available");
    assert.equal(first.receipt.execution.status, "completed");
    assert.match(first.receipt.result_summary.summary, /X measured 7 against limit 5; Y was not measured/u);
    assert.deepEqual(actions, ["read_X_sample"]);
    assert.equal(requests.length, 1);
    assert.deepEqual(readSelectedWorkSources(requests[0]!.packet), comparison.entries);
    const afterExecution = fixture.db.serialize();
    assert.throws(() => revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential,
      request: revisionRequestV01(fixture, selected.packet, "pre_execution_user_revision", selected.definition), clock: fixedClock("2026-08-01T00:00:06.000Z") }), /work_revision_execution_started/u);
    assert(afterExecution.equals(fixture.db.serialize()), "Execution does not reopen the pre-execution editor");
    const source = listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 1 })[0]!.payload as EpisodeDeltaProposalV01;
    const beforeReview = history();
    const readBefore = fixture.db.serialize();
    const detail = readVNextOperatorPilotSemanticReviewV01(fixture.db, { config: fixture.config, proposal_id: source.proposal_id, authenticated_session_id: credential.session_id });
    assert(readBefore.equals(fixture.db.serialize()));
    assert.equal(source.source_assessment!.comparison.task_success_status, "unknown");
    const sourceCandidate = detail.candidates[0]!;
    assert.equal(sourceCandidate.candidate.operation, "unknown");
    const reviewStarted = performance.now();
    const revisionRequest = { action: "revise", proposal_id: source.proposal_id, proposal_fingerprint: source.integrity.fingerprint,
      candidate_id: sourceCandidate.candidate.candidate_id, candidate_fingerprint: sourceCandidate.candidate_fingerprint,
      delta_type: "validation_delta", operation: "add", title: "Preserve conditional X result and check B before revisiting Y", proposed_state_summary: correction,
      rationale_summary: "The executed X reading does not justify a global failure explanation. This is a user-authored validation follow-up, not evidence that Y passed or failed.", uncertainties: ["The cause and Y behavior remain unknown."], limitations: ["Acceptance records only this reviewed validation state; it does not execute Y."] };
    const beforeSourceDrift = fixture.db.serialize();
    assert.throws(() => recordVNextOperatorPilotProposalRevisionV01(fixture.db, { config: fixture.config, credential, request: { ...revisionRequest, proposal_fingerprint: `sha256:${"0".repeat(64)}` }, clock: fixedClock("2026-08-01T00:00:07.000Z") }), /operator_pilot_revision_proposal_conflict/u);
    assert(beforeSourceDrift.equals(fixture.db.serialize()), "Changed proposal binding refuses without writes");
    const revised = recordVNextOperatorPilotProposalRevisionV01(fixture.db, { config: fixture.config, credential, request: revisionRequest, clock: fixedClock("2026-08-01T00:00:07.000Z") });
    credential = credentialFromCookieV01(revised.session_cookie.value);
    const afterRevision = counts();
    const replay = recordVNextOperatorPilotProposalRevisionV01(fixture.db, { config: fixture.config, credential, request: revisionRequest, clock: fixedClock("2026-08-01T00:00:07.000Z") });
    credential = credentialFromCookieV01(replay.session_cookie.value);
    assert.equal(replay.status, "exact_replay");
    assert.deepEqual(counts(), afterRevision);
    assert.deepEqual(revised.proposal.observations, source.observations);
    assert.deepEqual(revised.proposal.attestations, source.attestations);
    assert.deepEqual(revised.proposal.inferences, source.inferences);
    assert.deepEqual(revised.proposal.source_assessment, source.source_assessment);
    assert.deepEqual(revised.proposal.run_receipt_refs, source.run_receipt_refs);
    assert.equal(revised.proposal.run_receipt_refs[0]!.external_id, first.receipt.receipt_id);
    assert.equal(revised.proposal.operation_revision!.authored_by_ref.trust_class, "user_declaration");
    const candidate = revised.proposal.proposed_deltas.find((candidate) => candidate.candidate_id === revised.proposal.operation_revision!.revised_candidate.candidate_id)!;
    const decisionRequest = { proposal_id: revised.proposal.proposal_id, proposal_fingerprint: revised.proposal.integrity.fingerprint, candidate_id: candidate.candidate_id,
      candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate), decision: "accept", rationale_summary: "Accept the conditional validation follow-up. Y is still deferred and no test is authorized by this decision." };
    const accepted = recordVNextOperatorPilotReviewDecisionV01(fixture.db, { config: fixture.config, credential, request: decisionRequest, clock: fixedClock("2026-08-01T00:00:08.000Z") });
    credential = credentialFromCookieV01(accepted.session_cookie.value);
    const binding = { proposal_id: revised.proposal.proposal_id, proposal_fingerprint: revised.proposal.integrity.fingerprint, decision_id: accepted.decision.decision_id, decision_fingerprint: accepted.decision.integrity.fingerprint };
    const previewBefore = fixture.db.serialize();
    const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(fixture.db, { config: fixture.config, credential, request: binding, clock: fixedClock("2026-08-01T00:00:09.000Z") });
    assert(previewBefore.equals(fixture.db.serialize()), "Transition preview writes nothing");
    const gate = confirmVNextOperatorPilotSemanticCommitV01(fixture.db, { config: fixture.config, credential, request: { ...binding, confirmation_digest: preview.preview.confirmation_digest }, preview_binding_cookie: preview.preview_binding_cookie, clock: fixedClock("2026-08-01T00:00:10.000Z") });
    credential = credentialFromCookieV01(gate.session_admission.cookie_value);
    assert.equal(countProjectPacketsV01(fixture), 2);
    const reviewMs = performance.now() - reviewStarted;
    const writerStarted = performance.now();
    const applyRequest = { ...binding, gate_record_id: gate.gate_record.gate_record_id, gate_record_fingerprint: gate.gate_record.integrity.fingerprint, prior_packet_id: selected.packet.packet_id, prior_packet_fingerprint: selected.packet.integrity.fingerprint };
    const applied = applyVNextOperatorPilotReviewedSemanticTransitionV01(fixture.db, { config: fixture.config, credential, request: applyRequest, clock: fixedClock("2026-08-01T00:00:11.000Z") });
    credential = credentialFromCookieV01(applied.session_admission.cookie_value);
    const writerMs = performance.now() - writerStarted;
    assert.equal(applied.status, "applied");
    assert.equal(applied.transition_receipt.source_proposal.proposal_id, revised.proposal.proposal_id);
    assert.equal(applied.transition_receipt.source_decision.decision_id, accepted.decision.decision_id);
    const effectCounts = counts();
    const applyReplay = applyVNextOperatorPilotReviewedSemanticTransitionV01(fixture.db, { config: fixture.config, credential, request: applyRequest, clock: fixedClock("2026-08-01T00:00:12.000Z") });
    credential = credentialFromCookieV01(applyReplay.session_admission.cookie_value);
    assert.equal(applyReplay.status, "exact_replay");
    assert.deepEqual(counts(), effectCounts);
    assert.deepEqual(history().filter((row) => beforeReview.some((prior) => row.record_id === prior.record_id)), beforeReview);
    const readStarted = performance.now();
    // Reopen the file on disk. This proves production reconstruction, not cold
    // model-session isolation. No expected packet is supplied to the reader.
    fixture.db.close();
    fixture.db = new Database(fixture.config.database_path);
    const freshBefore = fixture.db.serialize();
    const continuity = projectVNextOperatorPilotContinuityV01(fixture.db, { config: fixture.config, clock: fixedClock("2026-08-01T00:00:13.000Z") });
    const current = continuity.latest_compiled_packet!;
    assert.equal(current.lineage_kind, "semantic_transition");
    const admitted = await admitPersistedHostTaskContextPacketV01(fixture.db, { config: fixture.config, packet_id: current.packet_id, packet_fingerprint: current.packet_fingerprint, evaluated_at: "2026-08-01T00:00:13.000Z" });
    assert.deepEqual(admitted.packet.task, selected.packet.task);
    assert.deepEqual(admitted.packet.work_ref, selected.packet.work_ref);
    assert.deepEqual(readSelectedWorkSources(admitted.packet), comparison.entries);
    const correctionEntries = admitted.packet.selected_context.filter((entry) => entry.entry_kind === "accepted_state_ref" && entry.bounded_summary === correction);
    assert.equal(correctionEntries.length, 1);
    assert.equal(correctionEntries[0]!.compatibility_source_ref?.external_id, applied.transition_receipt.transition_receipt_id);
    assert.equal(correctionEntries[0]!.compatibility_source_ref?.source_ref, applied.transition_receipt.integrity.fingerprint);
    assert.deepEqual(correctionEntries[0]!.currentness.source_ref, applied.transition_receipt.effects[0]!.after_application_observation_ref);
    assert(admitted.packet.compatibility.source_refs.some((ref) => ref.external_id === applied.transition_receipt.transition_receipt_id && ref.source_ref === applied.transition_receipt.integrity.fingerprint));
    await assert.rejects(() => admitPersistedHostTaskContextPacketV01(fixture.db, { config: fixture.config, packet_id: selected.packet.packet_id, packet_fingerprint: selected.packet.integrity.fingerprint, evaluated_at: "2026-08-01T00:00:13.000Z" }), /direct_host_packet_stale/u);
    assert(freshBefore.equals(fixture.db.serialize()), "Fresh read and stale refusal write nothing");
    const freshReadMs = performance.now() - readStarted;
    const nextStarted = performance.now();
    const next = await runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive", operator_mutation: { credential, clock: fixedClock("2026-08-01T00:00:14.000Z") } }, { adapter: adapter("B"), now: timestampSequenceV01("2026-08-01T00:00:14.000Z") });
    const nextMs = performance.now() - nextStarted;
    credential = credentialFromCookieV01(next.session_admission!.cookie_value);
    assert.equal(next.status, "inserted");
    assert.equal(requests.length, 2);
    assert.notEqual(requests[1]!.request_id, requests[0]!.request_id);
    assert.notEqual(next.receipt.run_id, first.receipt.run_id);
    assert.deepEqual(requests[1]!.packet, admitted.packet);
    assert.deepEqual(actions, ["read_X_sample", "compare_calibration_B"]);
    assert.match(next.receipt.result_summary.summary, /Calibration B reference 5 equals expected 5. Y remains untested/u);
    const beforeRunReplay = counts();
    const nextReplay = await runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive", operator_mutation: { credential, clock: fixedClock("2026-08-01T00:00:17.000Z") } }, { adapter: adapter("B"), now: timestampSequenceV01("2026-08-01T00:00:17.000Z") });
    assert.equal(nextReplay.status, "exact_replay");
    assert.deepEqual(counts(), beforeRunReplay);
    assert.equal(requests.length, 2);
    assert.deepEqual(history().filter((row) => beforeReview.some((prior) => row.record_id === prior.record_id)), beforeReview);
    assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["context_use_review"], limit: 1 }).length, 0);
    assert.deepEqual(counts(), [
      { record_kind: "episode_delta_proposal", count: 3 }, { record_kind: "review_decision", count: 1 },
      { record_kind: "run_receipt", count: 2 }, { record_kind: "semantic_commit_gate", count: 1 },
      { record_kind: "semantic_state", count: 1 }, { record_kind: "state_transition_receipt", count: 1 },
      { record_kind: "task_context_packet", count: 3 },
    ]);
    const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
    assert.equal(recovery.status, "valid", recovery.code);
    assert.equal(fetchCalls, 0);
    const text = canonicalizeProtocolValueV01(admitted.packet);
    console.log(JSON.stringify({ fixture: "executed_reviewed_follow_up", status: "pass", preparation_ms: preparationMs, execution_ms: executionMs, review_ms: reviewMs, successor_writer_ms: writerMs, fresh_preparation_ms: freshReadMs, next_execution_ms: nextMs,
      packet_characters: [...text].length, packet_utf8_bytes: Buffer.byteLength(text), packet_estimated_tokens: admitted.packet.constraints.context_budget.estimated_tokens,
      returned_selected_entries: admitted.packet.selected_context.length, actions, requests: requests.map((request) => ({ request_id: request.request_id, run_id: request.run_id, packet_id: request.packet.packet_id, packet_fingerprint: request.packet.integrity.fingerprint })),
      record_counts: counts(), live_provider_calls: 0, billed_tokens: 0, disk_io_measured: false, human_burden_measured: false, local_context_use_probe_required: false, application_reconstruction: true, cold_model_isolation: false }));
  } finally { if (fixture.db.open) fixture.db.close(); globalThis.fetch = originalFetch; }
}

// Synthetic X is produced by the normal round-trip with a deterministic
// adapter, then its DB is closed/reopened. B uses protocol-faithful fake App
// Server command items through the production scoped adapter and service.
// These are model-free substitutions, not observed native task-file reads.
async function assertPersistedScopedContinuationV01(scenarios: readonly string[] = ["complete", "expired_review", "repeat_arm", "auth_refused", "missing_transition",
  "expired_start", "wrong_scope", "failed_B", "wrong_context", "wrong_prior", "superseded", "request_refusal"]): Promise<void> {
  for (const scenario of scenarios) {
    const started = performance.now();
    const wallBase = Date.now() - 60_000;
    const wall = (seconds: number) => new Date(wallBase + seconds * 1_000).toISOString();
    const name = `persisted-${scenario}`;
    const fixture = createFixtureV01(name, false, true, true);
    let coordinator: Awaited<ReturnType<typeof createPersistedCodexFeasibilityContinuationV01>> | undefined;
    let service: LiveNativeHostRunServiceV01 | undefined;
    const scopes: Awaited<ReturnType<typeof createCodexScopedTaskV01>>[] = [];
    const processes = new Set<number>();
    let sessionId: string | undefined;
    let time = 0, fakeLaunches = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error("continuation_test_network_forbidden"); }) as typeof fetch;
    try {
      const file = path.join(fixture.root, "sample.txt");
      writeFileSync(file, "Synthetic sample 9; reference 4. Later calibration is separate.\n");
      const files = [{ relative_path: "sample.txt", sha256: createHash("sha256").update(readFileSync(file)).digest("hex") }];
      if (scenario === "handoff") {
        for (const [relative_path, content] of [["TASK.md", "Read only TASK.md, sample.txt and notes.md. Compare recorded X with its reference. Stop after X; do not read calibration-B.json."], ["notes.md", "X is a bounded recorded sample; cause unknown. Y untested."]]) {
          writeFileSync(path.join(fixture.root, relative_path!), content!);
          files.push({ relative_path: relative_path!, sha256: createHash("sha256").update(content!).digest("hex") });
        }
      }
      const bootstrap = issueVNextLocalOperatorBootstrapV01(fixture.db, { config: fixture.config, clock: fixedClock(wall(0)) });
      const session = consumeVNextLocalOperatorBootstrapV01(fixture.db, { config: fixture.config, bootstrap_token: bootstrap.bootstrap_token, clock: fixedClock(wall(1)) });
      const initial = defineInitialProjectWorkV01(fixture.db, { config: fixture.config, credential: session.credential,
        request: requestV01(fixture, { goal: scenario === "handoff" ? readFileSync(path.join(fixture.root, "TASK.md"), "utf8") : "Review a bounded sample and choose a calibration follow-up", success_criteria: [scenario === "handoff" ? "Fulfil TASK.md and stop after X." : "Compare the recorded sample with its reference"], non_goals: ["No unmeasured-condition execution"] }), clock: fixedClock(wall(2)) });
      let credential = credentialFromCookieV01(initial.session_admission.cookie_value); sessionId = credential.session_id;
      let xInvocations = 0;
      let originalRequest: NativeHostRequestV01 | undefined;
      const base = createDeterministicCodexAdapterV01({ now: timestampSequenceV01(wall(4)) });
      const first = await runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive", operator_mutation: { credential, clock: fixedClock(wall(4)) } }, {
        adapter: { ...base, invoke(request, control) {
          xInvocations += 1;
          originalRequest = structuredClone(request);
          const handle = base.invoke(request, control);
          const result = handle.result.then(value => ({ ...value, summary: "The recorded sample exceeds its reference. Other conditions remain unknown.",
            checks: [...value.checks, { check_id: "recorded_sample", required: true, status: "failed" as const, summary: "Recorded sample exceeds reference." }] }));
          return { ...handle, result, settled: result.then(() => undefined, () => undefined) };
        } }, now: timestampSequenceV01(wall(4)),
      });
      credential = credentialFromCookieV01(first.session_admission!.cookie_value);
      assert.equal(first.receipt.execution.status, "completed"); assert.equal(first.receipt.verification.status, "failed");
      assert.equal(first.proposal.status, "available");
      const original = listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 1 })[0]!.payload as EpisodeDeltaProposalV01;
      const historical = canonicalizeProtocolValueV01({ receipt: first.receipt, proposal: original });
      const originalCandidate = original.proposed_deltas[0]!;
      assert.equal(originalCandidate.operation, "unknown");
      const originalDecision = { proposal_id: original.proposal_id, proposal_fingerprint: original.integrity.fingerprint,
        candidate_id: originalCandidate.candidate_id, candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(originalCandidate), decision: "accept", rationale_summary: "Synthetic acceptance must still refuse unknown operation." };
      assert.throws(() => recordVNextOperatorPilotReviewDecisionV01(fixture.db, { config: fixture.config, credential, request: originalDecision, clock: fixedClock(wall(6)) }), /pilot_candidate_operation_not_transitionable/);
      // The original runner no longer owns this persisted DB. No old window,
      // fake finish(true), row transplant, or X replay prepares the continuation.
      fixture.db.close(); fixture.db = new Database(fixture.config.database_path);
      const input = { config: fixture.config, receipt_id: first.receipt.receipt_id, proposal_id: original.proposal_id };
      if (scenario === "complete") {
        await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, { ...input, receipt_id: "run-receipt:missing" }), /receipt_missing/);
        await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, { ...input, proposal_id: "episode-delta-proposal:missing" }), /proposal/);
        await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, { ...input, config: { ...fixture.config, project_id: "project:unrelated" } }), /receipt_missing/);
        const run = readAutonomyRunLedgerRecord(first.receipt.run_id, { db: fixture.db })!;
        for (const bad of [{ status: "paused" as const, metadata: { ...run.metadata, reconciliation_required: true } },
          { metadata: { ...run.metadata, terminal_receipt_persisted: false } },
          { metadata: { ...run.metadata, adapter_version: "unrelated-producer" } }]) {
          updateAutonomyRunLedgerFields(run.run_id, bad, { db: fixture.db });
          await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, input), /predecessor|producer|receipt/);
          updateAutonomyRunLedgerFields(run.run_id, { status: run.status, metadata: run.metadata }, { db: fixture.db });
        }
        const moved = fixture.root + "-moved";
        renameSync(fixture.root, moved); mkdirSync(fixture.root);
        try { await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, input), /producer_identity/); }
        finally { rmSync(fixture.root, { recursive: true }); renameSync(moved, fixture.root); }
      }
      const readBefore = fixture.db.serialize();
      coordinator = await createPersistedCodexFeasibilityContinuationV01(fixture.db, input, () => time);
      assert(readBefore.equals(fixture.db.serialize()), "Continuation preparation is read-only");
      const rival = scenario === "complete" ? await createPersistedCodexFeasibilityContinuationV01(fixture.db, input, () => time) : undefined;
      assert.equal(coordinator.predecessor.verification_status, "failed");
      assert.deepEqual(coordinator.window.snapshot(), { attempts: 0, active: false, stopped: false, remaining_window_ms: null });
      assert.equal(existsSync(coordinator.disposition_path), false, "Read-only preparation does not arm or claim");
      const revisionRequest = { action: "revise", ...originalDecision, delta_type: "validation_delta", operation: "add", title: "Clarify sample scope and defer the next condition",
        proposed_state_summary: "User-declared sampling condition limits the interpretation. Keep the failed reading and uncertainty; compare calibration before revisiting untested conditions.",
        rationale_summary: "Synthetic delegated declaration, not an observed condition or contemporaneous human inspection.", uncertainties: ["Cause remains unknown."], limitations: ["No further condition is executed by acceptance."] };
      // Remove Decision-only keys: the normal strict revision parser remains in control.
      const { decision: _decision, ...revision } = revisionRequest;
      time = 1_000;
      if (scenario === "auth_refused") {
        assert.throws(() => coordinator!.revise({ credential: { ...credential, session_id: "session:forged" }, request: revision, clock: fixedClock(wall(7)) }), /session/);
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 1);
        assert.equal(coordinator.window.snapshot().attempts, 0);
        continue;
      }
      const revised = coordinator.revise({ credential, request: revision, clock: { now() {
        assert.equal(coordinator!.window.snapshot().remaining_window_ms, 600_000, "Armed before normal semantic writer clock/authentication is invoked");
        assert.equal(JSON.parse(readFileSync(coordinator!.disposition_path, "utf8").split("\n")[0]!).kind, "armed");
        return wall(7);
      } } });
      credential = credentialFromCookieV01(revised.session_cookie.value);
      assert.deepEqual(revised.proposal.source_assessment, original.source_assessment);
      assert.deepEqual(revised.proposal.observations, original.observations);
      assert.deepEqual(revised.proposal.attestations, original.attestations);
      assert.deepEqual(revised.proposal.inferences, original.inferences);
      assert.equal(revised.proposal.operation_revision!.authored_by_ref.trust_class, "user_declaration");
      await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, input), /disposition_exists/);
      if (rival) {
        const journal = readFileSync(coordinator.disposition_path, "utf8");
        assert.throws(() => rival.revise({ credential, request: revision }), /disposition_refused/);
        assert.equal(readFileSync(coordinator.disposition_path, "utf8"), journal, "Losing exclusive claim cannot append to the winner");
      }
      if (scenario === "repeat_arm") {
        time += 40_000;
        assert.throws(() => coordinator!.revise({ credential, request: revision }), /revision_already_recorded/);
        assert.equal(coordinator.window.snapshot().remaining_window_ms, 560_000);
        assert.equal(coordinator.window.snapshot().stopped, true);
        continue;
      }
      const candidate = revised.proposal.proposed_deltas.find(c => c.candidate_id === revised.proposal.operation_revision!.revised_candidate.candidate_id)!;
      const decisionRequest = { proposal_id: revised.proposal.proposal_id, proposal_fingerprint: revised.proposal.integrity.fingerprint,
        candidate_id: candidate.candidate_id, candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate), decision: "accept", rationale_summary: "Accept only the synthetic declaration; no execution grant." };
      if (scenario === "expired_review") {
        time += 600_000;
        assert.throws(() => coordinator!.decide({ credential, request: decisionRequest }), /continuation_window_unavailable/);
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["review_decision"], limit: 10 }).length, 0);
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 2, "Committed revision prefix survives expiry");
        await coordinator.close(); coordinator = undefined;
        fixture.db.close(); fixture.db = new Database(fixture.config.database_path);
        await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, input), /disposition_exists/, "A restarted reader cannot renew the retained disposition");
        continue;
      }
      time += 2_000;
      const accepted = coordinator.decide({ credential, request: decisionRequest, clock: fixedClock(wall(8)) });
      credential = credentialFromCookieV01(accepted.session_cookie.value);
      const binding = { proposal_id: revised.proposal.proposal_id, proposal_fingerprint: revised.proposal.integrity.fingerprint,
        decision_id: accepted.decision.decision_id, decision_fingerprint: accepted.decision.integrity.fingerprint };
      assert.throws(() => coordinator!.preview({ credential, request: { ...binding, decision_id: "review-decision:unrelated" } }), /decision_source/);
      const preview = coordinator.preview({ credential, request: binding, clock: fixedClock(wall(9)) });
      if (scenario === "missing_transition") {
        await assert.rejects(coordinator.prepareStage2({ files }), /transition_required/);
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["state_transition_receipt"], limit: 10 }).length, 0);
        assert.equal(coordinator.window.snapshot().attempts, 0);
        continue;
      }
      const gate = coordinator.confirm({ credential, request: { ...binding, confirmation_digest: preview.preview.confirmation_digest }, preview_binding_cookie: preview.preview_binding_cookie, clock: fixedClock(wall(10)) });
      credential = credentialFromCookieV01(gate.session_admission.cookie_value);
      if (scenario === "wrong_prior") {
        assert.throws(() => coordinator!.apply({ credential, request: { ...binding, gate_record_id: gate.gate_record.gate_record_id, gate_record_fingerprint: gate.gate_record.integrity.fingerprint,
          prior_packet_id: "task-context-packet:unrelated", prior_packet_fingerprint: initial.packet.integrity.fingerprint }, clock: fixedClock(wall(11)) }), /prior_packet/);
        assert.equal(coordinator.window.snapshot().attempts, 0);
        continue;
      }
      const applied = coordinator.apply({ credential, request: { ...binding, gate_record_id: gate.gate_record.gate_record_id, gate_record_fingerprint: gate.gate_record.integrity.fingerprint,
        prior_packet_id: initial.packet.packet_id, prior_packet_fingerprint: initial.packet.integrity.fingerprint }, clock: fixedClock(wall(11)) });
      credential = credentialFromCookieV01(applied.session_admission.cookie_value);
      assert.equal(applied.status, "applied");
      assert.notEqual(applied.later_packet.packet_id, initial.packet.packet_id);
      assert.deepEqual(applied.later_packet.work_ref, initial.packet.work_ref);
      if (scenario === "superseded") {
        // A separate normal compilation supersedes the exact later packet
        // retained by this coordinator; an applied Decision alone cannot admit B.
        const later = compileTaskContextPacketFromPersistedSemanticStateV01(fixture.db, {
          workspace_id: fixture.workspace_id, project_id: fixture.project_id, prior_packet: initial.packet,
          transition_receipt_id: applied.transition_receipt.transition_receipt_id,
          transition_receipt_fingerprint: applied.transition_receipt.integrity.fingerprint,
          expiry_policy: { mode: "reuse_prior" }, clock: fixedClock(wall(13)),
        });
        assert.notEqual(later.later_packet.packet_id, applied.later_packet.packet_id);
        await assert.rejects(coordinator.prepareStage2({ files }), /transition_superseded/);
        continue;
      }
      if (scenario === "wrong_context") {
        const other = getOrCreateCanonicalProjectForLocalRootV01(fixture.db, { workspace_id: fixture.workspace_id,
          local_root: normalizeLocalProjectRootRefV01(ROOT, { base_path: ROOT }), display_name: "Other synthetic project" });
        const selection = readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!;
        selectActiveProjectV01(fixture.db, { workspace_id: fixture.workspace_id, project_id: other.project.project_id,
          expected_project_id: selection.project_id, expected_revision: selection.selection_revision, now: wall(12) });
        await assert.rejects(coordinator.prepareStage2({ files }), /project_not_active/);
        continue;
      }
      if (scenario === "handoff") {
        const content = '{"calibration":3,"reference":3}\n';
        writeFileSync(path.join(fixture.root, "calibration-B.json"), content);
        files.push({ relative_path: "calibration-B.json", sha256: createHash("sha256").update(content).digest("hex") });
      }
      const laterPacketId = applied.later_packet.packet_id;
      // Returned material is detached from the coordinator's retained authority.
      applied.later_packet.packet_id = initial.packet.packet_id;
      applied.transition_receipt.source_decision.decision_id = "decision:unrelated";
      const prepared = await coordinator.prepareStage2({ files }); scopes.push(prepared.scope);
      const snapshot = readCodexScopedSnapshotV01(prepared.scope);
      assert.equal(prepared.admission.packet.packet_id, laterPacketId);
      assert(prepared.admission.packet.selected_context.some(entry => entry.bounded_summary === revision.proposed_state_summary));
      assert.equal(coordinator.window.snapshot().attempts, 0);
      assert.equal(coordinator.window.snapshot().remaining_window_ms, 598_000, "Review, compilation and scope creation do not reset the clock");
      assert.throws(() => new LiveNativeHostRunServiceV01({ scoped_task: { scope: prepared.scope, window: { ...prepared.window } } }).readCapabilityContractV01(), /window_not_source_owned|scope/);
      if (scenario === "expired_start") {
        time = 601_000;
        assert.throws(() => prepared.window.begin(prepared.scope, 180_000, 10_000), /window_expired|window_start_refused/);
        assert.equal(fakeLaunches, 0);
        continue;
      }
      if (scenario === "wrong_scope") {
        const other = await createCodexScopedTaskV01({ stage: 2, canonical_root: fixture.root,
          packet_id: laterPacketId, packet_fingerprint: prepared.admission.packet.integrity.fingerprint,
          guide_brief_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(prepared.guide)), files }); scopes.push(other);
        assert.throws(() => prepared.window.begin(other, 180_000, 10_000), /window_start_refused/);
        assert.throws(() => prepared.window.begin(prepared.scope, 180_000, 10_000), /window_start_refused/);
        continue;
      }
      if (scenario === "request_refusal") {
        time = 590_999; // 600s from arming, less the unchanged 10s reserve.
        const attempt = prepared.window.begin(prepared.scope, 999_999, 99_999);
        assert.equal(attempt.timeout_ms, 1); assert.equal(attempt.stop_settle_timeout_ms, 10_000);
        await assert.rejects(attempt.before_invoke(originalRequest!), /request_lineage|snapshot_request_binding_missing/, "A reused X packet cannot become B");
        await assert.rejects(attempt.before_invoke({ ...originalRequest!, packet: prepared.admission.packet,
          root_scope: { ...prepared.admission.root_scope, canonical_root: ROOT } }), /request_lineage|snapshot_request_binding_missing/);
        time += 1;
        await assert.rejects(attempt.before_invoke(originalRequest!), /window_expired/);
        // Local disposition failure cannot replace a settled host result.
        // Retain the file, obstruct its exact name, and require cleanup reporting.
        renameSync(coordinator.disposition_path, coordinator.disposition_path + ".retained");
        mkdirSync(coordinator.disposition_path);
        assert.doesNotThrow(() => attempt.finish(false));
        await assert.rejects(coordinator.close(), /disposition_refused/);
        assert.equal(existsSync(snapshot.root), false);
        coordinator = undefined;
        await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, input), /direct_host_packet_stale/);
        continue;
      }
      const hostHome = path.join(ROOT, `${name}-home`); mkdirSync(hostHome);
      const trace = path.join(ROOT, `${name}-trace.jsonl`), cleanup = path.join(ROOT, `${name}-cleanup`);
      let adapter: ReturnType<typeof createCodexAppServerAdapterV01> | undefined;
      service = new LiveNativeHostRunServiceV01({ scoped_task: prepared, now: timestampSequenceV01(wall(12)),
        timeout_ms: 10_000, stop_settle_timeout_ms: 3_000,
        adapter_factory: scope => adapter ??= createCodexAppServerAdapterV01({ scoped_task: scope,
          observe: observation => { if (observation.kind === "spawned" && observation.process_id) { fakeLaunches += 1; processes.add(observation.process_id); } },
          launch: { command: process.execPath, prefix_args: [path.join(process.cwd(), "scripts/fixtures/fake-codex-app-server.mjs")],
            environment: { NODE_ENV: "test", HOME: hostHome, CODEX_HOME: hostHome, PATH: process.env.PATH,
              FAKE_CODEX_SCENARIO: "scoped_command_cwd", FAKE_CODEX_SCOPED_RESULT_KIND: scenario === "handoff" ? "x_only" : undefined, FAKE_CODEX_COMMAND_CWD: scenario === "failed_B" ? fixture.root : snapshot.root,
              FAKE_CODEX_COMMAND_TERMINAL: scenario === "failed_B" ? "withhold" : "complete", FAKE_CODEX_TRACE_PATH: trace, FAKE_CODEX_CLEANUP_MARKER_PATH: cleanup } } }),
      });
      const startInput = { config: fixture.config, mode: "interactive" as const, operator_mutation: { credential, clock: fixedClock(wall(12)) } };
      const pending = service.start(startInput);
      await assert.rejects(service.start(startInput), /window_start_refused/);
      const startedResult = await pending;
      if (startedResult.session_admission) credential = credentialFromCookieV01(startedResult.session_admission.cookie_value);
      const deadline = performance.now() + 10_000;
      let projection = service.read(fixture.config);
      while (!["completed", "failed", "paused", "blocked", "cancelled", "timed_out"].includes(projection.status)) {
        assert(performance.now() < deadline, "Synthetic continuation must settle");
        await new Promise(resolve => setTimeout(resolve, 10)); projection = service.read(fixture.config);
      }
      assert.equal(projection.status, scenario === "failed_B" ? "paused" : "completed");
      assert.equal(projection.reconciliation_required, scenario === "failed_B");
      assert.notEqual(projection.run_ref, first.receipt.run_id);
      const run = readAutonomyRunLedgerRecord(projection.run_ref!, { db: fixture.db })!;
      assert.equal(run.events.filter(event => event.payload?.checkpoint).length, 2);
      const receipts = listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 10 }).map(row => row.payload as RunReceiptV01);
      assert.equal(receipts.length, scenario === "failed_B" ? 1 : 2);
      if (scenario === "complete") {
        const receipt = receipts.find(row => row.run_id === projection.run_ref)!;
        assert.equal(receipt.execution.status, "completed"); assert.equal(receipt.task_context_packet_ref?.external_id, laterPacketId);
        assert(receipt.source_refs.some(ref => ref.ref_type === "project_root_scope" && ref.source_ref === coordinator!.predecessor.root_fingerprint));
        assert(receipt.observations.some(observation => observation.observation_kind === "source_bound_input_snapshot" && observation.source_refs.some(ref => ref.external_id === snapshot.fingerprint)));
        assert.equal(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["episode_delta_proposal"], limit: 10 }).length, 3);
      }
      if (scenario === "handoff") {
        assert.deepEqual(prepared.admission.packet.task, initial.packet.task);
        assert.equal(prepared.guide.current_goal, initial.packet.task.goal);
        assert(readCodexScopedSnapshotV01(prepared.scope).files.some(file => file.relative_path === "calibration-B.json"));
        assert(prepared.admission.packet.selected_context.some(entry => entry.bounded_summary === revision.proposed_state_summary));
        console.log(JSON.stringify({ handoff_baseline: "X-only active task survives accepted B context and four-file snapshot", task: prepared.admission.packet.task, native_status: projection.status, consumed_attempts: coordinator.window.snapshot().attempts, b_readiness: false }));
      }
      assert.equal(xInvocations, 1, "No replay of the synthetic predecessor");
      assert.equal(fakeLaunches, 1); assert.equal(coordinator.window.snapshot().attempts, 1);
      await assert.rejects(service.start(startInput), /window_start_refused/);
      const rows = readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line));
      assert.equal(rows.filter(row => row.kind === "received" && row.value.method === "turn/start").length, 1);
      assert.equal(readFileSync(cleanup, "utf8"), "settled\n");
      const originalReceipt = receipts.find(row => row.receipt_id === first.receipt.receipt_id)!;
      const source = readVNextOperatorPilotSemanticReviewV01(fixture.db, { config: fixture.config, proposal_id: original.proposal_id, authenticated_session_id: null }).proposal;
      assert.equal(canonicalizeProtocolValueV01({ receipt: originalReceipt, proposal: source }), historical);
      if (scenario === "handoff") {
        const laterReceipt = receipts.find(r => r.run_id === projection.run_ref)!;
        const oldDispositionPath = coordinator.disposition_path;
        await service.shutdown(); service = undefined;
        await coordinator.close();
        const consumedDisposition = readFileSync(oldDispositionPath, "utf8");
        assert.equal(coordinator.window.snapshot().attempts, 1);
        const semanticPrefix = listVNextCoreRecordsV01(fixture.db, { ...fixture,
          record_kinds: ["episode_delta_proposal", "review_decision", "state_transition_receipt", "run_receipt"], limit: 100 });
        await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, { config: fixture.config,
          packet_id: prepared.admission.packet.packet_id, packet_fingerprint: prepared.admission.packet.integrity.fingerprint }), /authored_definition_required/);
        assert.equal(fakeLaunches, 1, "An X-only task plus B context does not admit an authored B handoff");
        const handoffRequest = { action: "define_authored_successor_task" as const,
          expected_current_packet_id: prepared.admission.packet.packet_id,
          expected_current_packet_fingerprint: prepared.admission.packet.integrity.fingerprint,
          expected_latest_receipt_id: laterReceipt.receipt_id, expected_latest_receipt_fingerprint: laterReceipt.integrity.fingerprint,
          expected_active_selection_revision: readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!.selection_revision,
          expected_root_fingerprint: prepared.admission.root_scope.root_fingerprint,
          definition: { objective: "Read calibration-B.json and compare its calibration value with its reference. Report both values, their difference and comparison. Preserve the accepted declared-sample scope and uncertainty for X; do not repeat X.",
            checks: [{ check_id: "calibration_comparison_completed", criterion: "Compare the calibration artifact with its task reference and report the comparison, whether matching or not." }],
            stop_conditions: ["Stop after the calibration comparison.", "Leave Y untested and deferred.", "Do not repeat X, write files, use network or accept another proposal."],
            approved_instruction_hashes: [],
            materials: files.map(f => ({ ...f, role: f.relative_path === "calibration-B.json" ? "task_data" as const : "historical_material" as const })) } };
        for (const request of [{ ...handoffRequest, expected_root_fingerprint: `sha256:${"0".repeat(64)}` },
          { ...handoffRequest, expected_latest_receipt_id: first.receipt.receipt_id, expected_latest_receipt_fingerprint: first.receipt.integrity.fingerprint }]) {
          await assert.rejects(defineAuthoredSuccessorTaskV01(fixture.db, { config: fixture.config, credential, request, clock: { now: () => new Date().toISOString() } }), /root_changed|predecessor_unsettled_or_mismatched/);
        }
        await assert.rejects(defineAuthoredSuccessorTaskV01(fixture.db, { config: fixture.config, credential: { ...credential, session_id: "session:forged" }, request: handoffRequest, clock: { now: () => new Date().toISOString() } }), /session/);
        const authored = await defineAuthoredSuccessorTaskV01(fixture.db, { config: fixture.config, credential, request: handoffRequest, clock: { now: () => new Date().toISOString() } });
        credential = credentialFromCookieV01(authored.session_admission.cookie_value);
        assert.equal(authored.status, "inserted"); assert.equal(authored.execution_authority_granted, false); assert.equal(authored.semantic_transition_created, false);
        assert.notDeepEqual(authored.packet.work_ref, initial.packet.work_ref);
        assert.notEqual(authored.packet.packet_id, prepared.admission.packet.packet_id);
        assert.equal(canonicalizeProtocolValueV01(listVNextCoreRecordsV01(fixture.db, { ...fixture,
          record_kinds: ["episode_delta_proposal", "review_decision", "state_transition_receipt", "run_receipt"], limit: 100 })), canonicalizeProtocolValueV01(semanticPrefix), "Task authorship never reapplies clarification or accepts the later proposal");
        assert.equal(readFileSync(oldDispositionPath, "utf8"), consumedDisposition);
        await assert.rejects(defineAuthoredSuccessorTaskV01(fixture.db, { config: fixture.config, credential, request: handoffRequest, clock: { now: () => new Date().toISOString() } }), /superseded|stale|current_packet_changed/);
        await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db, input), /superseded|stale|later_run|disposition/);
        const laterProposal = readProjectRunResultDetailV01(fixture.db, { ...fixture, receipt_id: laterReceipt.receipt_id }).proposal;
        assert.equal(laterProposal.status, "available");
        if (laterProposal.status === "available") await assert.rejects(createPersistedCodexFeasibilityContinuationV01(fixture.db,
          { config: fixture.config, receipt_id: laterReceipt.receipt_id, proposal_id: laterProposal.proposal_id }), /superseded|stale/);
        const packetBinding = { config: fixture.config, packet_id: authored.packet.packet_id, packet_fingerprint: authored.packet.integrity.fingerprint };
        const bPath = path.join(fixture.root, "calibration-B.json"), approvedB = readFileSync(bPath);
        writeFileSync(bPath, '{"unapproved":true}');
        try { await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, packetBinding), /stage_hash_changed/); }
        finally { writeFileSync(bPath, approvedB); }
        const movedRoot = fixture.root + "-task-moved";
        renameSync(fixture.root, movedRoot); mkdirSync(fixture.root);
        try { await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, packetBinding), /root_changed/); }
        finally { rmSync(fixture.root, { recursive: true }); renameSync(movedRoot, fixture.root); }
        await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, { ...packetBinding, packet_fingerprint: `sha256:${"0".repeat(64)}` }), /fingerprint_mismatch/);
        const beforeFakeCalls = processes.size;
        const successor = await prepareAuthoredSuccessorHandoffV01(fixture.db, { config: fixture.config,
          packet_id: authored.packet.packet_id, packet_fingerprint: authored.packet.integrity.fingerprint }); scopes.push(successor.scope);
        assert.equal(processes.size, beforeFakeCalls, "Preparation and consistency checks cannot invoke a worker");
        assert.equal(successor.execution_window_created, false);
        const successorSnapshot = readCodexScopedSnapshotV01(successor.scope);
        assert.deepEqual(successorSnapshot.files, files.filter(f => f.relative_path === "calibration-B.json"));
        assert.equal(readFileSync(path.join(successorSnapshot.root, "calibration-B.json"), "utf8"), readFileSync(path.join(fixture.root, "calibration-B.json"), "utf8"));
        assert.equal(existsSync(path.join(successorSnapshot.root, "TASK.md")), false);
        const currentDefinition = readAuthoredSuccessorDefinitionV01(successor.admission.packet);
        assert.deepEqual(currentDefinition, normalizeAuthoredSuccessorTaskV01(handoffRequest.definition));
        assert.equal(successor.guide.current_goal, currentDefinition.objective);
        assert.deepEqual(successor.admission.packet.selected_context.filter(e => e.entry_kind === "accepted_state_ref"), prepared.admission.packet.selected_context.filter(e => e.entry_kind === "accepted_state_ref"));
        const transitionRefs = prepared.admission.packet.compatibility.source_refs.filter(r => r.ref_type === "state_transition_receipt");
        assert(transitionRefs.length > 0);
        for (const r of transitionRefs) assert(successor.admission.packet.compatibility.source_refs.some(v => canonicalizeProtocolValueV01(v) === canonicalizeProtocolValueV01(r)));
        assert.throws(() => assertAuthoredSuccessorInventoryV01(authored.packet, { files, historical_files: [], approved_instruction_hashes: [] }), /inventory_role_conflict/);
        await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, { config: fixture.config,
          packet_id: authored.packet.packet_id, packet_fingerprint: authored.packet.integrity.fingerprint,
          approved_instruction_files: [{ path: file, sha256: files[0]!.sha256 }] }), /instruction_hashes_changed/);
        const successorTrace = path.join(ROOT, `${name}-successor-trace.jsonl`);
        const successorHome = path.join(ROOT, `${name}-successor-home`); mkdirSync(successorHome);
        let successorFakeLaunches = 0;
        const successorAdapter = createCodexAppServerAdapterV01({ scoped_task: successor.scope,
          observe: observation => { if (observation.kind === "spawned" && observation.process_id) { successorFakeLaunches += 1; processes.add(observation.process_id); } },
          launch: { command: process.execPath, prefix_args: [path.join(process.cwd(), "scripts/fixtures/fake-codex-app-server.mjs")],
            environment: { NODE_ENV: "test", HOME: successorHome, CODEX_HOME: successorHome, PATH: process.env.PATH,
              FAKE_CODEX_SCENARIO: "scoped_command_cwd", FAKE_CODEX_COMMAND_CWD: successorSnapshot.root, FAKE_CODEX_SCOPED_RESULT_KIND: "x_only",
              FAKE_CODEX_TRACE_PATH: successorTrace } } });
        const runsBeforeRefusal = listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 100 });
        await assert.rejects(runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive",
          operator_mutation: { credential, clock: { now: () => new Date().toISOString() } } }, { adapter: base, now: () => new Date().toISOString() }), /authored_successor_scope_required/);
        await assert.rejects(runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive",
          operator_mutation: { credential, clock: { now: () => new Date().toISOString() } } }, { adapter: base, scoped_task: successor.scope, now: () => new Date().toISOString() }), /adapter_binding_missing/);
        assert.equal(successorFakeLaunches, 0);
        assert.deepEqual(listVNextCoreRecordsV01(fixture.db, { ...fixture, record_kinds: ["run_receipt"], limit: 100 }), runsBeforeRefusal);
        let finalRequest: NativeHostRequestV01 | undefined;
        // Explicit synthetic executor seam, no feasibility window renewal. Its
        // fixed answer deliberately lacks the calibration check. Request capture,
        // not a B-looking fake answer, is the positive handoff evidence.
        const next = await runDirectNativeHostRoundTripV01(fixture.db, { config: fixture.config, mode: "interactive",
          operator_mutation: { credential, clock: { now: () => new Date().toISOString() } } }, { adapter: successorAdapter, scoped_task: successor.scope,
          before_adapter_invoke: async request => { finalRequest = structuredClone(request); }, now: () => new Date().toISOString(), timeout_ms: 10_000, stop_settle_timeout_ms: 3_000 });
        credential = credentialFromCookieV01(next.session_admission!.cookie_value);
        assert(finalRequest); assert.deepEqual(finalRequest.packet, successor.admission.packet);
        assert.deepEqual(finalRequest.guide_brief, successor.guide);
        const sent = readFileSync(successorTrace, "utf8").trim().split("\n").map(line => JSON.parse(line)).find(row => row.kind === "received" && row.value.method === "turn/start")!.value;
        assert(!canonicalizeProtocolValueV01(finalRequest.packet).includes(initial.packet.task.goal), "The historical X instruction is not active in the successor request");
        assert.equal(readProjectWorkInitializationV01(fixture.db, fixture).state, "defined_successor_work");
        assert.equal(successorFakeLaunches, 1);
        assert.equal(sent.packet_payload_sha256, createProtocolSha256V01(canonicalizeProtocolValueV01(finalRequest.packet)));
        assert.equal(sent.packet_fingerprint, authored.packet.integrity.fingerprint);
        assert.equal(sent.cwd, successorSnapshot.root); assert.equal(sent.guide_before_task_context_packet, true);
        assert.equal(next.receipt.execution.status, "completed"); assert.notEqual(next.receipt.verification.status, "passed");
        assert(next.receipt.verification.required_check_ids.includes("calibration_comparison_completed"));
        assert(next.receipt.skipped_checks.some(c => c.check_id === "calibration_comparison_completed"));
        assert.equal(readFileSync(oldDispositionPath, "utf8"), consumedDisposition);
        // A settled authored task can be followed by another explicit authored
        // task without changing accepted context or replaying its Transition.
        const beforeSecond = listVNextCoreRecordsV01(fixture.db, { ...fixture,
          record_kinds: ["episode_delta_proposal", "review_decision", "state_transition_receipt", "run_receipt"], limit: 100 });
        const second = await defineAuthoredSuccessorTaskV01(fixture.db, { config: fixture.config, credential,
          request: { ...handoffRequest, expected_current_packet_id: authored.packet.packet_id,
            expected_current_packet_fingerprint: authored.packet.integrity.fingerprint,
            expected_latest_receipt_id: next.receipt.receipt_id,
            expected_latest_receipt_fingerprint: next.receipt.integrity.fingerprint,
            definition: { ...handoffRequest.definition, objective: "Check calibration-B.json against its reference in a new explicitly authored task. Preserve the accepted X scope and uncertainty; leave Y untested." } },
          clock: { now: () => new Date().toISOString() } });
        credential = credentialFromCookieV01(second.session_admission.cookie_value);
        const secondBinding = { config: fixture.config, packet_id: second.packet.packet_id, packet_fingerprint: second.packet.integrity.fingerprint };
        const secondLineage = inspectVNextOperatorPilotPacketLineageV01(fixture.db, secondBinding);
        const secondContinuity = projectVNextOperatorPilotContinuityV01(fixture.db, { config: fixture.config });
        const secondInitialization = readProjectWorkInitializationV01(fixture.db, fixture);
        console.log(JSON.stringify({ consecutive_successor: { first: authored.packet.packet_id, settled_receipt: next.receipt.receipt_id,
          second: second.packet.packet_id, inserted: second.status, projection_current: secondLineage.projection_current,
          continuity_currentness: secondContinuity.packet_currentness, initialization: secondInitialization.state } }));
        assert.equal(secondLineage.projection_current, true, "The newest authored successor inherits accepted-context validity, not its predecessor's supersession");
        assert.equal(secondContinuity.latest_compiled_packet?.packet_id, second.packet.packet_id);
        assert.equal(secondContinuity.packet_currentness, "fresh");
        assert.equal(secondInitialization.state, "defined_successor_work");
        assert.equal(secondInitialization.current_packet?.packet_id, second.packet.packet_id);
        const secondHandoff = await prepareAuthoredSuccessorHandoffV01(fixture.db, secondBinding); scopes.push(secondHandoff.scope);
        assert.deepEqual(secondHandoff.admission.packet, second.packet);
        assert.equal(secondHandoff.guide.current_goal, second.packet.task.goal);
        assert.equal(secondHandoff.execution_authority_granted, false);
        assert.equal(secondHandoff.execution_window_created, false);
        assert.notDeepEqual(second.packet.work_ref, authored.packet.work_ref);
        assert.deepEqual(second.packet.selected_context.filter(e => e.entry_kind === "accepted_state_ref"),
          prepared.admission.packet.selected_context.filter(e => e.entry_kind === "accepted_state_ref"));
        assert.deepEqual(second.packet.compatibility.source_refs.filter(r => r.ref_type === "state_transition_receipt"), transitionRefs);
        for (const old of [initial.packet, prepared.admission.packet, authored.packet]) {
          await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, { config: fixture.config,
            packet_id: old.packet_id, packet_fingerprint: old.integrity.fingerprint }), /stale|superseded/);
        }
        const firstLineage = inspectVNextOperatorPilotPacketLineageV01(fixture.db, packetBinding);
        assert.equal(firstLineage.lineage_kind, "authored_successor_task");
        assert(firstLineage.lineage_kind === "authored_successor_task");
        assert.equal(firstLineage.inherited_context_current, true);
        assert.equal(firstLineage.projection_current, false);
        await assert.rejects(defineAuthoredSuccessorTaskV01(fixture.db, { config: fixture.config, credential,
          request: { ...handoffRequest, expected_current_packet_id: authored.packet.packet_id,
            expected_current_packet_fingerprint: authored.packet.integrity.fingerprint,
            expected_latest_receipt_id: next.receipt.receipt_id, expected_latest_receipt_fingerprint: next.receipt.integrity.fingerprint } }), /stale|superseded/);
        await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, { ...secondBinding,
          packet_fingerprint: authored.packet.integrity.fingerprint }), /fingerprint_mismatch/);
        assert.deepEqual(listVNextCoreRecordsV01(fixture.db, { ...fixture,
          record_kinds: ["episode_delta_proposal", "review_decision", "state_transition_receipt", "run_receipt"], limit: 100 }), beforeSecond);
        assert.equal(readFileSync(oldDispositionPath, "utf8"), consumedDisposition);
        const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
        assert.equal(recovery.status, "valid", recovery.code);
        const portable = parseAndValidatePortableProjectV01(exportActivePortableProjectV01(fixture.db,
          { include_personal_perspective: false }).bytes);
        for (const packet of [authored.packet, second.packet]) assert(portable.records.some(r => r.record_id === packet.packet_id));
        assert(portable.operator_provenance_sessions.some(s => s.session_id === sessionId));
        // Separate negative: genuinely revise the selected accepted state via
        // normal review/Transition owners. Task supersession must not hide this
        // semantic drift. This does not prepare S2 or accept its result.
        assert(laterProposal.status === "available");
        const driftSource = readVNextOperatorPilotSemanticReviewV01(fixture.db, { config: fixture.config,
          proposal_id: laterProposal.proposal_id, authenticated_session_id: credential.session_id });
        const driftCandidate = driftSource.candidates[0]!;
        const driftRevision = recordVNextOperatorPilotProposalRevisionV01(fixture.db, { config: fixture.config, credential,
          request: { ...revision, proposal_id: driftSource.proposal.proposal_id, proposal_fingerprint: driftSource.proposal_fingerprint,
            candidate_id: driftCandidate.candidate.candidate_id, candidate_fingerprint: driftCandidate.candidate_fingerprint,
            operation: "revise", proposed_state_summary: "A separate synthetic user declaration changes the previously selected state." } });
        credential = credentialFromCookieV01(driftRevision.session_cookie.value);
        const driftDelta = driftRevision.proposal.proposed_deltas[0]!;
        const driftDecision = recordVNextOperatorPilotReviewDecisionV01(fixture.db, { config: fixture.config, credential,
          request: { ...decisionRequest, proposal_id: driftRevision.proposal.proposal_id, proposal_fingerprint: driftRevision.proposal.integrity.fingerprint,
            candidate_id: driftDelta.candidate_id, candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(driftDelta) } });
        credential = credentialFromCookieV01(driftDecision.session_cookie.value);
        const driftBinding = { proposal_id: driftRevision.proposal.proposal_id, proposal_fingerprint: driftRevision.proposal.integrity.fingerprint,
          decision_id: driftDecision.decision.decision_id, decision_fingerprint: driftDecision.decision.integrity.fingerprint };
        const driftPreview = prepareVNextOperatorPilotSemanticCommitPreviewV01(fixture.db, { config: fixture.config, credential, request: driftBinding });
        const driftGate = confirmVNextOperatorPilotSemanticCommitV01(fixture.db, { config: fixture.config, credential,
          request: { ...driftBinding, confirmation_digest: driftPreview.preview.confirmation_digest }, preview_binding_cookie: driftPreview.preview_binding_cookie });
        credential = credentialFromCookieV01(driftGate.session_admission.cookie_value);
        const driftApplied = applyVNextOperatorPilotReviewedSemanticTransitionV01(fixture.db, { config: fixture.config, credential,
          request: { ...driftBinding, gate_record_id: driftGate.gate_record.gate_record_id, gate_record_fingerprint: driftGate.gate_record.integrity.fingerprint,
            prior_packet_id: prepared.admission.packet.packet_id, prior_packet_fingerprint: prepared.admission.packet.integrity.fingerprint } });
        credential = credentialFromCookieV01(driftApplied.session_admission.cookie_value);
        assert.equal(driftApplied.status, "applied");
        const staleSecond = inspectVNextOperatorPilotPacketLineageV01(fixture.db, secondBinding);
        assert(staleSecond.lineage_kind === "authored_successor_task");
        assert.equal(staleSecond.inherited_context_current, false);
        assert.equal(staleSecond.projection_current, false);
        await assert.rejects(prepareAuthoredSuccessorHandoffV01(fixture.db, secondBinding), /direct_host_packet_stale/);
        assert.equal(successorFakeLaunches, 1, "S2 admission and stale refusal launch no worker");
        assert.equal(readFileSync(oldDispositionPath, "utf8"), consumedDisposition);
        console.log(JSON.stringify({ consecutive_successor_checks: "passed", historical_admission: "refused", changed_accepted_context: "refused",
          recovery_and_portable: "valid", semantic_prefix_unchanged_by_authorship: true, second_worker_launches: 0 }));
        console.log(JSON.stringify({ authored_successor: "passed", old_allowance: "consumed_unchanged", task_goal: finalRequest.packet.task.goal,
          task_checks: finalRequest.packet.constraints.required_checks, snapshot_files: successorSnapshot.files.map(f => f.relative_path),
          serialized_packet_sha256: sent.packet_payload_sha256, native_only_result_verification: next.receipt.verification.status, successor_fake_launches: successorFakeLaunches,
          real_worker_execution: false, fixed_fake_transport: true }));
      }
    } finally {
      try { await service?.shutdown(); }
      finally {
        try { await coordinator?.close(); }
        finally {
          try {
            for (const scope of scopes) await releaseCodexScopedTaskV01(scope);
            for (const pid of processes) assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
            if (sessionId) assert(revokeVNextLocalOperatorSessionByIdV01(fixture.db, { config: fixture.config, session_id: sessionId, clock: fixedClock(scenario === "handoff" ? new Date().toISOString() : wall(60)) }).revoked_at);
          } finally { if (fixture.db.open) fixture.db.close(); globalThis.fetch = originalFetch; }
        }
      }
      console.log(JSON.stringify({ persisted_continuation: scenario, elapsed_ms: performance.now() - started, fake_host_launches: fakeLaunches, model_calls: 0 }));
    }
  }
}

async function assertRetainedSourceRecallV01(): Promise<void> {
  const preparationStarted = performance.now();
  const fixture = createFixtureV01("retained-source-recall");
  const sizes = (value: unknown) => {
    const text = canonicalizeProtocolValueV01(value);
    return { characters: [...text].length, utf8_bytes: Buffer.byteLength(text, "utf8") };
  };
  const packetRows = (db: Database.Database) => db.prepare("SELECT record_id, payload_json FROM vnext_core_records WHERE record_kind = 'task_context_packet' ORDER BY record_id").all() as { record_id: string; payload_json: string }[];
  try {
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config, credential: authenticatedSessionV01(fixture, "recall"),
      request: requestV01(fixture, { goal: "Investigate valve leakage under X and Y", success_criteria: ["Preserve test conditions and unresolved anomalies"], non_goals: [] }), clock: fixedClock(T2),
    });
    let credential = credentialFromCookieV01(initial.session_admission.cookie_value);
    let packet = initial.packet;
    let tick = 3;
    const notes = [
      { text: "Observation: A leaked under cold-start condition X. Y was not tested. The pressure anomaly remains unexplained.", provenance: "imported_unverified", label: "Unclassified / needs review" },
      { text: "Rejected explanation: A always fails. That generalization goes beyond the X observation; Y and exception Z remain untested.", provenance: "derived_interpretation", label: "Rejection reason" },
      { text: "User correction: reject A only under X. Y is untested, not forbidden. The original leak observation must remain.", provenance: "user_declaration", label: "Changed assumption / user correction" },
      { text: "Unresolved anomaly: does pressure Z explain the leak? There is no answer yet.", provenance: "user_declaration", label: "Open question" },
      { text: "Defer Y until fixture B is available; revisit when B arrives. Next check: compare cold start X and Y with B.", provenance: "user_declaration", label: "Deferred item / revisit condition" },
    ].map((note, index) => buildSelectedWorkSourceEntry(fixture, { ...note,
      source: "Valve bench leak investigation, revision 1", observed_at: `2026-07-31T12:00:0${index}.000Z` }));
    function write(entries: typeof notes, goal: string) {
      const comparison = compareSelectedWorkSources(packet, entries);
      const result = revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential,
        request: { ...revisionRequestV01(fixture, packet, packet === initial.packet ? "initial_user_defined" : "pre_execution_user_revision", { ...packet.task, goal }),
          selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint },
        clock: fixedClock(`2026-08-01T00:00:${String(tick++).padStart(2, "0")}.000Z`) });
      credential = credentialFromCookieV01(result.session_admission.cookie_value);
      packet = result.packet;
      return result;
    }
    write(notes, packet.task.goal);
    const original = packet;
    write(notes, "Review the valve leak conditions before changing task selection");
    const preparedMs = performance.now() - preparationStarted;
    const preparationBytes = packetRows(fixture.db);
    const observations: unknown[] = [];
    let handoffPreparationMs = 0;
    for (let boundary = 1; boundary <= 5; boundary += 1) {
      const handoffStarted = performance.now();
      // New task selection deliberately omits the original notes. This is not
      // source retirement, semantic rejection, automatic cooling or deletion.
      const unrelated = buildSelectedWorkSourceEntry(fixture, {
        source: `Valve display layout note ${boundary}`, observed_at: null, provenance: "user_declaration",
        label: "New candidate", text: `Bulk display spacing ${boundary}: ${"한".repeat(1_800)}`,
      });
      const changedCondition = buildSelectedWorkSourceEntry(fixture, {
        source: "Valve bench leak investigation, revision 2", observed_at: "2026-07-31T12:01:00.000Z", provenance: "user_declaration",
        label: "Changed assumption / user correction", text: "User correction: X now includes warm-up W. Y is still untested; compare this changed condition with the earlier cold-start observation.",
      });
      const smallUnrelated = buildSelectedWorkSourceEntry(fixture, {
        source: `Valve display alignment ${boundary}`, observed_at: `2026-08-01T00:00:0${boundary}.000Z`, provenance: "user_declaration",
        label: "Next check", text: `Check display alignment ${boundary}; this says nothing about fluid behavior.`,
      });
      write(boundary === 2 ? [unrelated, smallUnrelated, changedCondition] : [unrelated, smallUnrelated], `Review display spacing at handoff ${boundary}`);
      handoffPreparationMs += performance.now() - handoffStarted;
      assert(readSelectedWorkSources(packet).every((entry) => !notes.some((note) => note.entry_id === entry.entry_id)));
      if (![1, 3, 5].includes(boundary)) continue;
      const connectionStarted = performance.now();
      const cold = new Database(fixture.db.serialize());
      const coldConnectionMs = performance.now() - connectionStarted;
      try {
        const snapshot = cold.serialize();
        const lookupStarted = performance.now();
        const chain = inspectPreExecutionProjectWorkRevisionChainV01(cold, fixture);
        const lookup = recallRetainedWorkSources(chain, "valve leak");
        const lookupMs = performance.now() - lookupStarted;
        assert.deepEqual(lookup, recallRetainedWorkSources(chain, "LEAK valve valve"));
        assert.equal(lookup.returned_entries, boundary === 1 ? 5 : 6);
        assert.equal(lookup.truncated, false);
        assert(lookup.results.every((hit) => hit.selection === "historical_not_selected"));
        for (const note of notes) {
          const hit = lookup.results.find((hit) => hit.entry.entry_id === note.entry_id)!;
          assert.deepEqual(hit.entry, note);
          assert.equal(hit.source.packet_id, original.packet_id);
          assert.equal(hit.source.packet_fingerprint, original.integrity.fingerprint);
          assert.equal(hit.first_recorded_at, original.generated_at);
          assert.equal(hit.packet_occurrences, 2, "Two carried copies are one exact excerpt");
          assert.equal(hit.entry.currentness.status, "unknown");
        }
        assert.deepEqual(lookup.results.slice(0, 5).map((hit) => hit.entry), notes);
        const noMatch = recallRetainedWorkSources(chain, "unobserved acoustic measurement");
        assert.equal(noMatch.matching_entries, 0);
        assert.equal(noMatch.scanned_packets, chain.packets.length);
        assert.throws(() => recallRetainedWorkSources(chain, ""), /retained_source_query_invalid/u);
        assert.throws(() => recallRetainedWorkSources(chain, "x".repeat(161)), /retained_source_query_invalid/u);
        assert.throws(() => recallRetainedWorkSources(chain, "a b c d e f g h i"), /retained_source_query_invalid/u);
        assert.throws(() => resolveRetainedWorkSources(chain, [{ ...lookup.results[0]!.source, packet_id: "packet:foreign" }]), /retained_source_changed_or_unavailable/u);
        assert.throws(() => resolveRetainedWorkSources(chain, [{ ...lookup.results[0]!.source, source_fingerprint: `sha256:${"0".repeat(64)}` }]), /retained_source_changed_or_unavailable/u);
        assert.throws(() => resolveRetainedWorkSources(chain, [{ ...lookup.results[0]!.source, entry_id: "malformed" }]), /selected_source_context_invalid/u);
        const comparisonStarted = performance.now();
        const selected = resolveRetainedWorkSources(chain, lookup.results.map((hit) => hit.source));
        const comparison = compareSelectedWorkSources(packet, selected.entries, selected.refs);
        const comparisonMs = performance.now() - comparisonStarted;
        assert.deepEqual(comparison, compareSelectedWorkSources(packet, [...selected.entries].reverse(), [...selected.refs].reverse()));
        assert(comparison.rows.every((row) => row.comparison === "new_source_material_review_needed"));
        assert(snapshot.equals(cold.serialize()), "Cold lookup, comparison and refusals write nothing");

        // Matched direct-read/good-note baseline: same retained chain and cutoff,
        // with no answer ID supplied. Manual selection cost is not simulated.
        const baselineStarted = performance.now();
        const baselineDb = new Database(fixture.db.serialize());
        let directNotes: ReturnType<typeof readSelectedWorkSources>;
        let directInput: unknown;
        try {
          const directChain = inspectPreExecutionProjectWorkRevisionChainV01(baselineDb, fixture);
          directInput = directChain.packets;
          const byId = new Map(directChain.packets.flatMap(readSelectedWorkSources).map((entry) => [entry.entry_id, entry]));
          directNotes = [...byId.values()].filter((entry) => `${entry.compatibility_source_ref!.external_id} ${entry.bounded_summary}`.toLowerCase().includes("leak"));
        } finally { baselineDb.close(); }
        const baselineReadMs = performance.now() - baselineStarted;
        const goodNoteStarted = performance.now();
        const goodNote = { current_work: packet.task, notes: directNotes! };
        const goodNoteSize = sizes(goodNote);
        const goodNoteMs = performance.now() - goodNoteStarted;
        assert.deepEqual(new Set(directNotes!.map((entry) => entry.entry_id)), new Set(comparison.entries.map((entry) => entry.entry_id)));

        const request = { ...revisionRequestV01(fixture, packet, "pre_execution_user_revision", { ...packet.task, goal: "Return to valve leak conditions before choosing the next check" }),
          selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, retained_source_refs: comparison.retained_source_refs };
        assert.throws(() => revisePreExecutionProjectWorkV01(cold, { config: fixture.config, credential,
          request: { ...request, selected_source_context: [] }, clock: fixedClock("2026-08-01T00:00:20.000Z") }), /retained_source_selection_changed/u);
        assert.throws(() => revisePreExecutionProjectWorkV01(cold, { config: fixture.config, credential,
          request: { ...request, expected_active_selection_revision: 999 }, clock: fixedClock("2026-08-01T00:00:20.000Z") }), /work_revision_active_selection_conflict/u);
        assert(snapshot.equals(cold.serialize()));
        const retainedBytes = packetRows(cold);
        const writeStarted = performance.now();
        const saved = revisePreExecutionProjectWorkV01(cold, { config: fixture.config, credential, request, clock: fixedClock("2026-08-01T00:00:20.000Z") });
        const writerMs = performance.now() - writeStarted;
        const replay = revisePreExecutionProjectWorkV01(cold, { config: fixture.config, credential: credentialFromCookieV01(saved.session_admission.cookie_value), request, clock: fixedClock("2026-08-01T00:00:20.000Z") });
        assert.equal(replay.status, "exact_replay");
        assert.equal(packetRows(cold).length, retainedBytes.length + 1);
        const historicalIds = new Set(retainedBytes.map((row) => row.record_id));
        assert.deepEqual(packetRows(cold).filter((row) => historicalIds.has(row.record_id)), retainedBytes);
        assert.equal(saved.transition_created, false);
        assert.equal(saved.review_decision_created, false);
        assert.equal(saved.execution_started, false);
        const fresh = new Database(cold.serialize());
        let consumerMs = 0;
        try {
          const before = fresh.serialize();
          const consumerStarted = performance.now();
          const admission = await admitPersistedHostTaskContextPacketV01(fresh, { config: fixture.config,
            packet_id: saved.packet.packet_id, packet_fingerprint: saved.packet.integrity.fingerprint, evaluated_at: "2026-08-01T00:00:21.000Z" });
          consumerMs = performance.now() - consumerStarted;
          assert.deepEqual(readSelectedWorkSources(admission.packet), comparison.entries);
          assert(before.equals(fresh.serialize()));
          await assert.rejects(() => admitPersistedHostTaskContextPacketV01(fresh, { config: fixture.config,
            packet_id: original.packet_id, packet_fingerprint: original.integrity.fingerprint, evaluated_at: "2026-08-01T00:00:21.000Z" }), /direct_host_packet_stale/u);
          if (boundary === 5) {
            const requests: NativeHostRequestV01[] = [];
            const run = await runDirectNativeHostRoundTripV01(fresh, { config: fixture.config, mode: "interactive",
              operator_mutation: { credential: credentialFromCookieV01(replay.session_admission.cookie_value), clock: fixedClock("2026-08-01T00:00:21.000Z") } },
            { now: timestampSequenceV01("2026-08-01T00:00:21.000Z"), on_invocation_admitted: (observed) => requests.push(observed.request) });
            assert.equal(run.status, "inserted");
            assert.equal(requests.length, 1);
            assert.deepEqual(readSelectedWorkSources(requests[0]!.packet), comparison.entries);
            for (const entry of comparison.entries) assert(requests[0]!.packet_lineage.selected_context_refs.some((ref) => canonicalizeProtocolValueV01(ref) === canonicalizeProtocolValueV01(entry.external_ref)));
            const recovery = validateRecoveryCanonicalDatabaseV01(fresh);
            assert.equal(recovery.status, "valid", recovery.code);
          }
        } finally { fresh.close(); }
        observations.push({ boundary, handoff_preparation_cumulative_ms: handoffPreparationMs, cold_connection_ms: coldConnectionMs,
          retained_packets: retainedBytes.length, active_notes_before: readSelectedWorkSources(packet).length,
          recalled_notes_absent_before: comparison.entries.length, query: sizes("valve leak"), lookup_ms: lookupMs, comparison_ms: comparisonMs,
          writer_ms: writerMs, consumer_ms: consumerMs, direct_read_ms: baselineReadMs, direct_read_input: sizes(directInput),
          good_note_preparation_ms: goodNoteMs, good_note: goodNoteSize, lookup_results: sizes(lookup.results),
          retained_entry_occurrences: lookup.scanned_entry_occurrences, retained_entry_utf8_bytes: lookup.scanned_entry_utf8_bytes,
          active_material: sizes(readSelectedWorkSources(packet)), next_consumer: sizes(saved.packet),
          next_consumer_estimated_tokens: saved.packet.constraints.context_budget.estimated_tokens,
          next_consumer_selected_entries: saved.packet.selected_context.length, writer_core_records_added: 1 });
      } finally { cold.close(); }
    }
    const chain = inspectPreExecutionProjectWorkRevisionChainV01(fixture.db, fixture);
    const countLimited = recallRetainedWorkSources(chain, "valve");
    assert.equal(countLimited.returned_entries, 8);
    assert(countLimited.omitted_matching_entries > 0);
    const byteLimited = recallRetainedWorkSources(chain, "bulk");
    assert.equal(byteLimited.matching_entries, 5);
    assert(byteLimited.returned_entries < 5 && byteLimited.truncated);
    assert.equal(byteLimited.result_utf8_bytes, sizes(byteLimited.results).utf8_bytes);
    assert(byteLimited.results.every((hit) => hit.entry.bounded_summary!.endsWith("한".repeat(1_800))));
    const result = recallRetainedWorkSources(chain, "valve leak");
    const selection = resolveRetainedWorkSources(chain, result.results.map((hit) => hit.source));
    const comparison = compareSelectedWorkSources(packet, selection.entries, selection.refs);
    const staleRequest = { ...revisionRequestV01(fixture, packet, "pre_execution_user_revision", packet.task),
      selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, retained_source_refs: selection.refs };
    const historicalBytes = packetRows(fixture.db);
    for (const sql of [
      "DELETE FROM vnext_core_records WHERE record_id = ?",
      "UPDATE vnext_core_records SET payload_json = '{}' WHERE record_id = ?",
      `UPDATE vnext_core_records SET fingerprint = 'sha256:${"0".repeat(64)}' WHERE record_id = ?`,
      "UPDATE vnext_core_records SET project_id = 'project:foreign' WHERE record_id = ?",
    ]) {
      fixture.db.exec("SAVEPOINT retained_source_fault");
      assert.throws(() => fixture.db.prepare(sql).run(original.packet_id), /vnext_core_records_immutable/u);
      // Fault injection only in this disposable savepoint. Restore the exact
      // owner triggers before readers run, so refusal tests exercise source
      // integrity rather than missing-schema checks.
      const triggers = fixture.db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND name IN ('trg_vnext_core_records_immutable_update', 'trg_vnext_core_records_immutable_delete')").all() as { name: string; sql: string }[];
      assert.equal(triggers.length, 2);
      for (const trigger of triggers) fixture.db.exec(`DROP TRIGGER ${trigger.name}`);
      fixture.db.prepare(sql).run(original.packet_id);
      for (const trigger of triggers) fixture.db.exec(trigger.sql);
      const broken = fixture.db.serialize();
      assert.throws(() => inspectPreExecutionProjectWorkRevisionChainV01(fixture.db, fixture));
      // A fresh connection verifies writer refusal after the lookup, outside the
      // fault-injection savepoint; the refusal itself leaves it byte-identical.
      const missing = new Database(broken);
      try {
        assert.throws(() => revisePreExecutionProjectWorkV01(missing, { config: fixture.config, credential, request: staleRequest, clock: fixedClock("2026-08-01T00:00:20.000Z") }));
        assert(broken.equals(missing.serialize()));
      } finally { missing.close(); }
      assert(broken.equals(fixture.db.serialize()));
      fixture.db.exec("ROLLBACK TO retained_source_fault; RELEASE retained_source_fault");
    }
    assert.deepEqual(packetRows(fixture.db), historicalBytes);
    write(readSelectedWorkSources(packet), "A changed current question requires a fresh historical comparison");
    const beforeStale = fixture.db.serialize();
    assert.throws(() => revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential, request: staleRequest, clock: fixedClock("2026-08-01T00:00:20.000Z") }), /work_revision_current_packet_changed/u);
    assert(beforeStale.equals(fixture.db.serialize()));
    assert.deepEqual(packetRows(fixture.db).filter((row) => preparationBytes.some((prior) => prior.record_id === row.record_id)), preparationBytes);
    // The boundary-5 actual-request branch above owns the representative full
    // recovery check. This branch exercises the normal portable end path.
    const exported = exportActivePortableProjectV01(fixture.db, { include_personal_perspective: false, exported_at: "2026-08-01T00:00:25.000Z" });
    const portable = parseAndValidatePortableProjectV01(exported.bytes);
    assert.equal(portable.records.length, packetRows(fixture.db).length);
    const importedDb = new Database(":memory:");
    try {
      importedDb.pragma("foreign_keys = ON");
      applyCanonicalDatabaseMigrations(importedDb);
      const destinationRoot = path.join(ROOT, "recall-portable");
      mkdirSync(destinationRoot, { recursive: true });
      const imported = importPortableProjectV01(importedDb, { bytes: exported.bytes, destination_root_base: destinationRoot, imported_at: "2026-08-01T00:00:26.000Z" });
      assert.equal(imported.status, "imported");
      assert.deepEqual(packetRows(importedDb), packetRows(fixture.db));
      const importedChain = inspectPreExecutionProjectWorkRevisionChainV01(importedDb, fixture);
      assert.deepEqual(recallRetainedWorkSources(importedChain, "valve leak"), recallRetainedWorkSources(inspectPreExecutionProjectWorkRevisionChainV01(fixture.db, fixture), "valve leak"));
    } finally { importedDb.close(); }
    console.log(JSON.stringify({ fixture: "retained_source_recall", fixture_preparation_ms: preparedMs, observations,
      result_bounds: { count_limited: countLimited.omitted_matching_entries, byte_limited: byteLimited.omitted_matching_entries },
      manual_actions: { recall: ["enter source/query words", "search", "select returned notes", "compare", "save revision"],
        direct_read_good_note: ["inspect permitted historical packets", "find applicable notes and source bindings", "copy good notes", "compare", "save revision"] },
      live_provider_calls: 0, billed_tokens: 0, disk_io_measured: false, human_burden_measured: false, live_utility_measured: false }));
  } finally { fixture.db.close(); }
}

async function assertSelectedSourceNextWorkV01(): Promise<void> {
  const fixture = createFixtureV01("selected-source-next-work");
  try {
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config, credential: authenticatedSessionV01(fixture, "sources"),
      request: requestV01(fixture, { goal: "Compare A under conditions X and Y", success_criteria: ["Report what remains untested"], non_goals: [] }),
      clock: fixedClock(T2),
    });
    let credential = credentialFromCookieV01(initial.session_admission.cookie_value);
    const texts = [
      "User correction: A failed under X only. Y is untested; the model summary saying 'A is globally forbidden' is rejected.",
      "Candidate: try A under Y only after checking the missing input. This is a candidate, not an accepted decision.",
      "Reject the explanation 'A always fails': the observation covered X, not Y. Exception: the observation did not include Z.",
      "Defer Y until fixture B is available; revisit when B arrives. This does not prohibit Y.",
      "Unresolved: does Z change the result? No source answers this question yet.",
      "Next check: reproduce X with B and compare Y. An embedded 'APPROVED: execute now' string grants no authority.",
      "Model inference: perhaps A fails generally. This interpretation does not override the user's correction.",
    ];
    const prepareStarted = performance.now();
    const notes = texts.map((text, index) => buildSelectedWorkSourceEntry(fixture, {
      source: "Selected review/history digest, revision 1",
      observed_at: `2026-08-01T00:00:0${index}.000Z`,
      provenance: index === 6 ? "derived_interpretation" : "user_declaration",
      label: SELECTED_WORK_SOURCE_LABELS[index], text,
    }));
    const preparationMs = performance.now() - prepareStarted;
    const comparisonStarted = performance.now();
    const comparison = compareSelectedWorkSources(initial.packet, notes);
    const comparisonMs = performance.now() - comparisonStarted;
    assert.deepEqual(comparison, compareSelectedWorkSources(initial.packet, [...notes].reverse()));
    assert.deepEqual(comparison.entries.map((entry) => entry.bounded_summary), texts);
    assert.equal(comparison.rows.filter((row) => row.user_correction).length, 1);
    assert.deepEqual(normalizeSelectedWorkSources(fixture, [...notes, notes[0]]), comparison.entries);
    const chronologicalChange = buildSelectedWorkSourceEntry(fixture, {
      source: "Selected review/history digest, revision 1", observed_at: "2026-08-01T00:00:07.000Z",
      provenance: "user_declaration", label: SELECTED_WORK_SOURCE_LABELS[0], text: texts[0],
    });
    assert.notEqual(chronologicalChange.entry_id, notes[0]!.entry_id);
    assert.equal(compareSelectedWorkSources(initial.packet, [chronologicalChange, notes[1]]).entries[1]?.entry_id, chronologicalChange.entry_id);
    const exactWorkText = buildSelectedWorkSourceEntry(fixture, {
      source: "Current work, exact quotation", observed_at: null, provenance: "user_declaration",
      label: SELECTED_WORK_SOURCE_LABELS[6], text: initial.packet.task.goal,
    });
    assert.equal(compareSelectedWorkSources(initial.packet, [exactWorkText]).rows[0]?.comparison, "reconfirmed_work_text");
    assert.throws(() => normalizeSelectedWorkSources({ ...fixture, project_id: "project:foreign" }, notes), /selected_source_context_invalid/u);
    assert.throws(() => normalizeSelectedWorkSources(fixture, [{ ...notes[0], source_ref: "sha256:bad" }]), /selected_source_context_invalid/u);
    assert.throws(() => normalizeSelectedWorkSources(fixture, [...notes, chronologicalChange, chronologicalChange]), /task_context_mandatory_selection_budget_exceeded/u);
    assert.throws(() => buildSelectedWorkSourceEntry(fixture, { source: "", text: "missing source", observed_at: null, provenance: "user_declaration", label: SELECTED_WORK_SOURCE_LABELS[0] }), /selected_source_context_invalid/u);
    assert.throws(() => normalizeSelectedWorkSources(fixture, texts.map((_, index) => buildSelectedWorkSourceEntry(fixture, {
      source: `Budget note ${index}`, observed_at: null, provenance: "user_declaration", label: SELECTED_WORK_SOURCE_LABELS[index], text: "한".repeat(2_000),
    }))), /selected_source_context_budget_exceeded/u);

    const beforeComparison = fixture.db.serialize();
    compareSelectedWorkSources(initial.packet, notes);
    assert(beforeComparison.equals(fixture.db.serialize()), "Comparison must perform zero writes");
    const baselineStarted = performance.now();
    const baselineAdmission = await admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config, packet_id: initial.packet.packet_id,
      packet_fingerprint: initial.packet.integrity.fingerprint, evaluated_at: "2026-08-01T00:00:08.000Z",
    });
    const baselineRetrievalMs = performance.now() - baselineStarted;
    // Same source information supplied as a direct-read/good-note handoff.
    // String preparation is measured separately from the real packet read;
    // this baseline has no persistent association or replay/currentness check.
    const goodNoteStarted = performance.now();
    const goodNoteBaseline = canonicalizeProtocolValueV01({
      current_work: baselineAdmission.packet.task,
      notes: comparison.entries.map((entry) => ({
        source: entry.compatibility_source_ref!.external_id,
        observed_at: entry.external_ref!.observed_at,
        provenance: entry.trust_class, label: entry.why_included, text: entry.bounded_summary,
      })),
    });
    const goodNotePreparationMs = performance.now() - goodNoteStarted;
    const measurements: unknown[] = [];
    let packet = initial.packet;
    let oldRequest: RevisePreExecutionProjectWorkRequestV01 | null = null;
    for (let boundary = 1; boundary <= 5; boundary += 1) {
      const sourceComparison = compareSelectedWorkSources(packet, notes);
      const request: RevisePreExecutionProjectWorkRequestV01 = {
        ...revisionRequestV01(fixture, packet, boundary === 1 ? "initial_user_defined" : "pre_execution_user_revision",
          { ...packet.task, non_goals: [`Do not execute during handoff ${boundary}`] }),
        selected_source_context: sourceComparison.entries,
        expected_source_comparison: sourceComparison.fingerprint,
      };
      const writeTime = `2026-08-01T00:00:${10 + boundary}.000Z`;
      const writeStarted = performance.now();
      const revised = revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential, request, clock: fixedClock(writeTime) });
      const writeMs = performance.now() - writeStarted;
      assert.equal(revised.status, "inserted");
      credential = credentialFromCookieV01(revised.session_admission.cookie_value);
      const beforeReplayCount = countProjectPacketsV01(fixture);
      const replay = revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential, request: structuredClone(request), clock: fixedClock(writeTime) });
      assert.equal(replay.status, "exact_replay");
      credential = credentialFromCookieV01(replay.session_admission.cookie_value);
      assert.equal(countProjectPacketsV01(fixture), beforeReplayCount);
      assert.equal(revised.review_decision_created, false);
      assert.equal(revised.transition_created, false);
      assert.equal(revised.execution_started, false);
      if (boundary === 1) oldRequest = structuredClone(request);
      packet = revised.packet;
      assert.deepEqual(readSelectedWorkSources(packet), comparison.entries);
      assert(compareSelectedWorkSources(packet, notes).rows.every((row) => row.comparison === "reconfirmed_selected_material"));
      if ([1, 3, 5].includes(boundary)) {
        // A fresh connection invokes the real persisted native-host preparation
        // reader. No adapter or test double copies the notes into its result.
        const readDb = new Database(fixture.db.serialize());
        try {
          const before = readDb.serialize();
          const started = performance.now();
          const admission = await admitPersistedHostTaskContextPacketV01(readDb, {
            config: fixture.config, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint,
            evaluated_at: "2026-08-01T00:00:20.000Z",
          });
          const elapsedMs = performance.now() - started;
          assert.deepEqual(readSelectedWorkSources(admission.packet), comparison.entries);
          for (const text of texts) assert(admission.packet.selected_context.some((entry) => entry.bounded_summary === text));
          assert(before.equals(readDb.serialize()), "Production preparation must perform zero writes");
          measurements.push({ boundary, preparation_write_ms: writeMs, retrieval_ms: elapsedMs, packet_characters: [...canonicalizeProtocolValueV01(admission.packet)].length,
            packet_utf8_bytes: Buffer.byteLength(canonicalizeProtocolValueV01(admission.packet)),
            packet_estimated_tokens: admission.packet.constraints.context_budget.estimated_tokens,
            returned_selected_entries: admission.packet.selected_context.length, project_packet_records: countProjectPacketsV01(fixture) });
        } finally { readDb.close(); }
      }
    }
    const beforeStale = fixture.db.serialize();
    assert.throws(() => revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config, credential, request: oldRequest, clock: fixedClock("2026-08-01T00:00:21.000Z"),
    }), /work_revision_source_comparison_changed/u);
    assert(beforeStale.equals(fixture.db.serialize()));
    const changedNote = buildSelectedWorkSourceEntry(fixture, { source: "Selected review/history digest, revision 2", observed_at: null,
      provenance: "user_declaration", label: SELECTED_WORK_SOURCE_LABELS[0], text: texts[0] + " New condition W now applies." });
    const staleSourceRequest = { ...revisionRequestV01(fixture, packet, "pre_execution_user_revision", packet.task),
      selected_source_context: [changedNote], expected_source_comparison: compareSelectedWorkSources(packet, notes).fingerprint };
    assert.throws(() => revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential, request: staleSourceRequest,
      clock: fixedClock("2026-08-01T00:00:21.000Z") }), /work_revision_source_comparison_changed/u);
    assert(beforeStale.equals(fixture.db.serialize()));

    const freshSourceComparison = compareSelectedWorkSources(packet, [changedNote]);
    assert.equal(freshSourceComparison.rows[0]?.comparison, "new_source_material_review_needed");
    const sameLocatorChange = buildSelectedWorkSourceEntry(fixture, { source: "Selected review/history digest, revision 1", observed_at: null,
      provenance: "user_declaration", label: SELECTED_WORK_SOURCE_LABELS[0], text: texts[0] + " New condition W now applies." });
    assert.equal(compareSelectedWorkSources(packet, [sameLocatorChange]).rows[0]?.comparison, "changed_source_material_review_needed");
    const sourceRevision = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config, credential,
      request: { ...staleSourceRequest, expected_source_comparison: freshSourceComparison.fingerprint },
      clock: fixedClock("2026-08-01T00:00:22.000Z"),
    });
    assert.equal(sourceRevision.status, "inserted");
    credential = credentialFromCookieV01(sourceRevision.session_admission.cookie_value);
    packet = sourceRevision.packet;
    const changedAdmission = await admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint,
      evaluated_at: "2026-08-01T00:00:23.000Z",
    });
    assert.deepEqual(readSelectedWorkSources(changedAdmission.packet), [changedNote]);

    // Explicit exclusion uses the same append-only writer. Historical source
    // packets remain historical and cannot resurrect notes in the current tip.
    const withdrawalComparison = compareSelectedWorkSources(packet, []);
    assert.equal(withdrawalComparison.unselected_previous.length, 1);
    const withdrawn = revisePreExecutionProjectWorkV01(fixture.db, { config: fixture.config, credential,
      request: { ...revisionRequestV01(fixture, packet, "pre_execution_user_revision", packet.task),
        selected_source_context: [], expected_source_comparison: withdrawalComparison.fingerprint },
      clock: fixedClock("2026-08-01T00:00:24.000Z"),
    });
    const withdrawnAdmission = await admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config, packet_id: withdrawn.packet.packet_id, packet_fingerprint: withdrawn.packet.integrity.fingerprint,
      evaluated_at: "2026-08-01T00:00:25.000Z",
    });
    assert.deepEqual(readSelectedWorkSources(withdrawnAdmission.packet), []);
    await assert.rejects(() => admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint,
      evaluated_at: "2026-08-01T00:00:25.000Z",
    }), /direct_host_packet_stale/u);
    assert.equal(countProjectPacketsV01(fixture), 8);
    assert.deepEqual(fixture.db.prepare("SELECT record_kind, COUNT(*) AS count FROM vnext_core_records WHERE project_id = ? GROUP BY record_kind").all(fixture.project_id),
      [{ record_kind: "task_context_packet", count: 8 }]);
    const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
    assert.equal(recovery.status, "valid", recovery.code);
    console.log(JSON.stringify({ fixture: "selected_source_next_work", preparation_ms: preparationMs, comparison_ms: comparisonMs,
      direct_read_baseline_ms: baselineRetrievalMs, direct_read_baseline_packet_bytes: Buffer.byteLength(canonicalizeProtocolValueV01(baselineAdmission.packet)),
      good_note_baseline_preparation_ms: goodNotePreparationMs, good_note_baseline_characters: [...goodNoteBaseline].length,
      good_note_baseline_utf8_bytes: Buffer.byteLength(goodNoteBaseline),
      source_note_characters: texts.reduce((sum, text) => sum + [...text].length, 0),
      source_note_utf8_bytes: texts.reduce((sum, text) => sum + Buffer.byteLength(text), 0), source_notes: notes.length, measurements,
      disk_io_measured: false, live_model_calls: 0, human_burden_measured: false }));
  } finally { fixture.db.close(); }
}

function assertLocalReviewAccessIssuanceV01(): void {
  const fixture = createFixtureV01("local-review-access");
  try {
    const issued = issueVNextLocalReviewAccessV01(fixture.db, {
      database_path: "/tmp/augnes-local-review-access.db",
      clock: fixedClock(T0),
    });
    assert.equal(issued.config.workspace_id, fixture.workspace_id);
    assert.equal(issued.config.project_id, fixture.project_id);
    assert.equal(issued.config.operator_id, "operator:local-review");
    const consumed = consumeVNextLocalOperatorBootstrapV01(fixture.db, {
      config: issued.config,
      bootstrap_token: issued.bootstrap.bootstrap_token,
      clock: fixedClock(T1),
    });
    assert.equal(consumed.session.authenticated, true);
    assert.equal(consumed.session.project_id, fixture.project_id);
  } finally {
    fixture.db.close();
  }
}

function assertInitialWorkPortabilityV01(): void {
  const source = createFixtureV01("portable-source");
  const destination = new Database(":memory:");
  const destinationBase = path.join(ROOT, "portable-destination");
  mkdirSync(destinationBase, { recursive: true });
  try {
    const inserted = defineInitialProjectWorkV01(source.db, {
      config: source.config,
      credential: authenticatedSessionV01(source, "portable"),
      request: requestV01(source, {
        goal: "포터블 첫 목표를 보존한다",
        success_criteria: ["Goal and criteria survive import", "초기 계보가 유지된다"],
        non_goals: ["자동 실행하지 않는다"],
      }),
      clock: fixedClock(T2),
    });
    const exported = exportActivePortableProjectV01(source.db, {
      include_personal_perspective: false,
      exported_at: "2026-08-01T00:00:03.000Z",
    });
    const parsed = parseAndValidatePortableProjectV01(exported.bytes);
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.operator_provenance_sessions.length, 1);
    assert.equal(new TextDecoder().decode(exported.bytes).includes(source.root), false);
    destination.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(destination);
    const imported = importPortableProjectV01(destination, {
      bytes: exported.bytes,
      destination_root_base: destinationBase,
      imported_at: "2026-08-01T00:00:04.000Z",
    });
    assert.equal(imported.status, "imported");
    const initialization = readProjectWorkInitializationV01(destination, {
      workspace_id: source.workspace_id,
      project_id: source.project_id,
    });
    assert.equal(initialization.state, "defined_initial_work");
    assert.deepEqual(initialization.current_work, inserted.definition);
    assert.equal(initialization.current_packet?.packet_id, inserted.packet.packet_id);
    assert.equal(
      importPortableProjectV01(destination, {
        bytes: exported.bytes,
        destination_root_base: destinationBase,
        imported_at: "2026-08-01T00:00:05.000Z",
      }).status,
      "exact_replay",
    );
    assert.equal(
      (destination.prepare("SELECT COUNT(*) AS count FROM autonomy_runs").get() as { count: number }).count,
      0,
    );
  } finally {
    source.db.close();
    destination.close();
  }
}

function assertNormalizationAndCompilerV01(): void {
  const normalized = normalizeInitialProjectWorkDefinitionV01({
    goal: "  첫 목표를 명확하게 완성한다  ",
    success_criteria: [" 결과가 검증된다 ", "결과가 검증된다", "영문 output works"],
    non_goals: [" 배포하지 않는다 ", ""],
  });
  assert.deepEqual(normalized, {
    goal: "첫 목표를 명확하게 완성한다",
    success_criteria: ["결과가 검증된다", "영문 output works"],
    non_goals: ["배포하지 않는다"],
  });
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "",
      success_criteria: ["done"],
      non_goals: [],
    }),
    errorCode("first_work_goal_invalid"),
  );
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "goal",
      success_criteria: [],
      non_goals: [],
    }),
    errorCode("first_work_success_criteria_invalid"),
  );
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "🙂".repeat(2_001),
      success_criteria: ["done"],
      non_goals: [],
    }),
    errorCode("first_work_goal_invalid"),
  );
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "가".repeat(2_000),
      success_criteria: Array.from({ length: 12 }, (_, index) =>
        `${index}${"나".repeat(497)}`,
      ),
      non_goals: [],
    }),
    errorCode("first_work_definition_too_large"),
  );

  const rocketDefinition = normalizeInitialProjectWorkDefinitionV01({
    goal: "🚀".repeat(2_000),
    success_criteria: ["The complete Unicode goal remains executable"],
    non_goals: [],
  });
  const maximalAscii = definitionAtCanonicalBytesV01(
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
    "ascii",
  );
  const maximalMixed = definitionAtCanonicalBytesV01(
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
    "mixed",
  );
  for (const definition of [rocketDefinition, maximalAscii, maximalMixed]) {
    const normalizedBoundary = normalizeInitialProjectWorkDefinitionV01({
      goal: definition.goal,
      success_criteria: definition.success_criteria,
      non_goals: definition.non_goals,
    });
    const builtBoundary = buildInitialProjectWorkTaskContextPacketV01({
      workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
      project_id: "project:22222222-2222-4222-8222-222222222222",
      operator_id: "operator:first-work-boundary",
      session_id: "local-operator-session:boundary",
      expected_active_selection_revision: 1,
      definition: normalizedBoundary,
      generated_at: T2,
    });
    assert.equal(
      validateTaskContextPacketV01(builtBoundary.packet, {
        evaluated_at: T2,
      }).status,
      "valid",
    );
  }
  assert.equal(maximalAscii.goal.length, 2_000);
  assert.equal(maximalAscii.success_criteria.length, 12);
  assert(maximalAscii.non_goals.length > 0);
  assert.equal(
    Buffer.byteLength(canonicalizeProtocolValueV01(maximalAscii), "utf8"),
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
  );
  assert.equal(
    Buffer.byteLength(canonicalizeProtocolValueV01(maximalMixed), "utf8"),
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
  );
  assert.throws(
    () =>
      normalizeInitialProjectWorkDefinitionV01({
        ...maximalAscii,
        non_goals: [
          ...maximalAscii.non_goals.slice(0, -1),
          `${maximalAscii.non_goals.at(-1)}x`,
        ],
      }),
    errorCode("first_work_definition_too_large"),
  );

  const one = buildInitialProjectWorkTaskContextPacketV01({
    workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
    project_id: "project:22222222-2222-4222-8222-222222222222",
    operator_id: "operator:first-work-test",
    session_id: "local-operator-session:test",
    expected_active_selection_revision: 1,
    definition: normalized,
    generated_at: T2,
  });
  const two = buildInitialProjectWorkTaskContextPacketV01({
    workspace_id: one.packet.workspace_id,
    project_id: one.packet.project_id,
    operator_id: "operator:first-work-test",
    session_id: "local-operator-session:later-request",
    expected_active_selection_revision: 1,
    definition: normalized,
    generated_at: "2026-08-01T00:00:10.000Z",
  });
  assert.equal(one.lineage.idempotency_key, two.lineage.idempotency_key);
  assert.equal(validateTaskContextPacketV01(one.packet, { evaluated_at: T2 }).status, "valid");
  assert.deepEqual(one.packet.task, normalized);
  assert.equal(one.packet.capability_grant, null);
  assert.deepEqual(one.packet.constraints.required_checks, []);
  assert.deepEqual(one.packet.return_contract.expected_artifacts, []);
  assert(one.packet.current_projection);
  assert.equal(one.packet.current_projection.canonical_state, false);
  assert.equal(one.packet.current_projection.projection_only, true);
  assert.equal(
    one.packet.selected_context.some((entry) => entry.entry_kind === "accepted_state_ref"),
    false,
  );
  const serialized = canonicalizeProtocolValueV01(one.packet);
  assert.equal(serialized.includes(ROOT), false);
  assert.equal(/credential|cookie|hidden_reasoning|transcript|provider_output/u.test(serialized), false);
}

function assertRevisionPortabilityAndRecoveryV01(): void {
  const source = createFixtureV01("revision-portable-source");
  const destination = new Database(":memory:");
  const destinationBase = path.join(ROOT, "revision-portable-destination");
  mkdirSync(destinationBase, { recursive: true });
  try {
    const initial = defineInitialProjectWorkV01(source.db, {
      config: source.config,
      credential: authenticatedSessionV01(source, "portable-revision"),
      request: requestV01(source),
      clock: fixedClock(T2),
    });
    const revised = revisePreExecutionProjectWorkV01(source.db, {
      config: source.config,
      credential: credentialFromCookieV01(initial.session_admission.cookie_value),
      request: revisionRequestV01(
        source,
        initial.packet,
        "initial_user_defined",
        {
          goal: "Imported revised goal remains current",
          success_criteria: ["Revision lineage survives export and import"],
          non_goals: ["Do not start during import"],
        },
      ),
      clock: fixedClock("2026-08-01T00:00:03.000Z"),
    });
    const exported = exportActivePortableProjectV01(source.db, {
      include_personal_perspective: false,
      exported_at: "2026-08-01T00:00:04.000Z",
    });
    const parsed = parseAndValidatePortableProjectV01(exported.bytes);
    assert.equal(parsed.records.length, 2);
    assert.equal(parsed.operator_provenance_sessions.length, 1);
    destination.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(destination);
    const imported = importPortableProjectV01(destination, {
      bytes: exported.bytes,
      destination_root_base: destinationBase,
      imported_at: "2026-08-01T00:00:05.000Z",
    });
    assert.equal(imported.status, "imported");
    const importedInitialization = readProjectWorkInitializationV01(
      destination,
      source.config,
    );
    assert.equal(importedInitialization.state, "defined_revised_work");
    assert.deepEqual(importedInitialization.current_work, revised.definition);
    assert.equal(
      importedInitialization.current_packet?.packet_id,
      revised.packet.packet_id,
    );
    const recovered = validateRecoveryCanonicalDatabaseV01(destination);
    assert.equal(recovered.status, "valid", recovered.code);
    const destinationFixture: FixtureV01 = {
      db: destination,
      root: path.join(
        destinationBase,
        source.project_id.slice("project:".length),
      ),
      workspace_id: source.workspace_id,
      project_id: source.project_id,
      config: {
        ...source.config,
        operator_id: "operator:revision-portable-destination",
        database_path: ":memory:",
      },
    };
    const destinationCredential = authenticatedSessionV01(
      destinationFixture,
      "new-local-session",
    );
    const importedRevision = revisePreExecutionProjectWorkV01(destination, {
      config: destinationFixture.config,
      credential: destinationCredential,
      request: revisionRequestV01(
        destinationFixture,
        revised.packet,
        "pre_execution_user_revision",
        {
          goal: "Destination-local revision after import",
          success_criteria: ["A new authenticated local session admits it"],
          non_goals: [],
        },
      ),
      clock: fixedClock("2026-08-01T00:00:07.000Z"),
    });
    assert.equal(importedRevision.status, "inserted");
    assert.equal(
      inspectPreExecutionProjectWorkRevisionChainV01(
        destination,
        destinationFixture.config,
      ).revision_count,
      2,
    );
  } finally {
    source.db.close();
    destination.close();
  }
}

function assertNativeHostRunIdentityCompatibilityV01(): void {
  assert.equal(
    shouldAttachNativeHostTaskStartGuideV01({
      adapter: { provider_egress: "forbidden" },
      resume_existing_run: false,
    }),
    false,
  );
  assert.equal(
    shouldAttachNativeHostTaskStartGuideV01({
      adapter: { provider_egress: "native_host_managed" },
      resume_existing_run: false,
    }),
    true,
  );
  assert.equal(
    shouldAttachNativeHostTaskStartGuideV01({
      adapter: { provider_egress: "native_host_managed" },
      resume_existing_run: true,
    }),
    false,
  );
  const ref = (refType: string, externalId: string) => ({
    ref_version: "external_ref.v0.1" as const,
    ref_type: refType,
    external_id: externalId,
    trust_class: "derived_interpretation" as const,
    observed_at: T1,
    source_ref: createProtocolSha256V01(externalId),
    compatibility_namespace: "identity-golden.v0.1",
  });
  const transitionRef = ref(
    "state_transition_receipt",
    "transition:identity-golden",
  );
  const baseAdmission = {
    admission_version: "persisted_host_packet_admission.v0.1",
    packet: {
      packet_id: "task-context-packet:identity-golden",
      integrity: {
        fingerprint: createProtocolSha256V01("packet:identity-golden"),
      },
    } as TaskContextPacketV01,
    packet_ref: ref("task_context_packet", "task-context-packet:identity-golden"),
    work_ref: ref("work", "work:identity-golden"),
    task_ref: ref("task", "task:identity-golden"),
    packet_lineage: {
      lineage_kind: "semantic_transition",
      source_transition_receipt_ref: transitionRef,
    },
    root_scope: {
      canonical_root: "/identity-golden-root",
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: createProtocolSha256V01("root:identity-golden"),
      physical_root_identity: {
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: createProtocolSha256V01(
          "/identity-golden-root",
        ),
        device: "101",
        inode: "202",
      },
      root_scope_ref: ref("project_root_scope", "root:identity-golden"),
      repository_ref: null,
      selected_worktree_ref: null,
    },
  } satisfies PersistedHostPacketAdmissionV01;
  const config = {
    enabled: true as const,
    workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
    project_id: "project:22222222-2222-4222-8222-222222222222",
    operator_id: "operator:identity-golden",
    database_path: ":memory:",
  };
  const adapter = createDeterministicCodexAdapterV01();
  const transition = buildDirectNativeHostRunIdentityV01({
    config,
    mode: "interactive",
    admission: baseAdmission,
    adapter,
    automation_context: null,
  });
  assert.deepEqual(transition, {
    run_id: "host-run:91e4f4dd44b89028e09acdcc",
    request_id: "host-request:91e4f4dd44b89028e09acdcc",
    idempotency_key:
      "sha256:91e4f4dd44b89028e09acdcca3de36aea562db72f2dfc558b06ae9b7bf189d7e",
  });
  const initial = buildDirectNativeHostRunIdentityV01({
    config,
    mode: "interactive",
    admission: {
      ...baseAdmission,
      packet_lineage: {
        lineage_kind: "initial_user_defined",
        first_work_definition_ref: ref(
          "first_work_definition",
          "first-work-definition:identity-golden",
        ),
        first_work_request_ref: ref(
          "first_work_request",
          "first-work-request:identity-golden",
        ),
        operator_action_ref: ref(
          "local_operator_session_action",
          "operator-action:identity-golden",
        ),
      },
    },
    adapter,
    automation_context: null,
  });
  assert.deepEqual(initial, {
    run_id: "host-run:1a06eb237240a656aac42dc0",
    request_id: "host-request:1a06eb237240a656aac42dc0",
    idempotency_key:
      "sha256:1a06eb237240a656aac42dc044a1b95d9228a556e200e49290cac8f140299059",
  });
  assert.notEqual(initial.idempotency_key, transition.idempotency_key);
}

function assertInitializationReadPolicyV01(): void {
  for (const kind of ["plain", "git"] as const) {
    const fixture = createFixtureV01(`new-${kind}`, kind === "git");
    try {
      const initialization = readProjectWorkInitializationV01(fixture.db, fixture.config);
      assert.equal(initialization.state, "not_defined");
      assert.equal(initialization.mutation_eligible, true);
    } finally {
      fixture.db.close();
    }
  }

  for (const recordKind of [
    "run_receipt",
    "episode_delta_proposal",
    "review_decision",
    "state_transition_receipt",
  ] as const) {
    const fixture = createFixtureV01(`history-${recordKind}`);
    try {
      insertHistoryRecordV01(fixture, recordKind);
      assert.equal(
        readProjectWorkInitializationV01(fixture.db, fixture.config).state,
        "existing_history_without_current_packet",
      );
    } finally {
      fixture.db.close();
    }
  }

  const runFixture = createFixtureV01("run-history");
  try {
    insertManagedRunV01(runFixture, {
      run_id: "run:first-work-history",
      scope: runFixture.project_id,
      metadata_json: "{}",
    });
    assert.equal(
      readProjectWorkInitializationV01(runFixture.db, runFixture.config).state,
      "existing_history_without_current_packet",
    );
  } finally {
    runFixture.db.close();
  }

  for (const [name, metadata] of [
    ["null-metadata", { workspace_id: null, project_id: null }],
    [
      "contradictory-metadata",
      { workspace_id: "workspace:other", project_id: "project:other" },
    ],
  ] as const) {
    const fixture = createFixtureV01(`run-${name}`);
    try {
      insertManagedRunV01(fixture, {
        run_id: `run:${name}`,
        scope: fixture.project_id,
        metadata_json: JSON.stringify(metadata),
      });
      assert.equal(
        readProjectWorkInitializationV01(fixture.db, fixture.config).state,
        "existing_history_without_current_packet",
      );
    } finally {
      fixture.db.close();
    }
  }

  const conflictFixture = createFixtureV01("run-metadata-scope-conflict");
  try {
    insertManagedRunV01(conflictFixture, {
      run_id: "run:metadata-scope-conflict",
      scope: "project:other-scope",
      metadata_json: JSON.stringify({
        workspace_id: conflictFixture.workspace_id,
        project_id: conflictFixture.project_id,
      }),
    });
    assert.equal(
      readProjectWorkInitializationV01(
        conflictFixture.db,
        conflictFixture.config,
      ).state,
      "unavailable",
    );
  } finally {
    conflictFixture.db.close();
  }

  const malformedFixture = createFixtureV01("run-malformed-metadata");
  try {
    insertManagedRunV01(malformedFixture, {
      run_id: "run:malformed-metadata",
      scope: "project:unrelated",
      metadata_json: "{not-json",
    });
    assert.equal(
      readProjectWorkInitializationV01(
        malformedFixture.db,
        malformedFixture.config,
      ).state,
      "unavailable",
    );
  } finally {
    malformedFixture.db.close();
  }

  const unrelatedFixture = createFixtureV01("run-unrelated");
  try {
    insertManagedRunV01(unrelatedFixture, {
      run_id: "run:unrelated",
      scope: "project:unrelated",
      metadata_json: JSON.stringify({
        workspace_id: "workspace:unrelated",
        project_id: "project:unrelated",
      }),
    });
    assert.equal(
      readProjectWorkInitializationV01(
        unrelatedFixture.db,
        unrelatedFixture.config,
      ).state,
      "not_defined",
    );
  } finally {
    unrelatedFixture.db.close();
  }

  const semanticFixture = createFixtureV01("semantic-history");
  try {
    semanticFixture.db.prepare(
      `INSERT INTO vnext_semantic_target_heads (
        workspace_id, project_id, target_key, revision, presence,
        current_state_fingerprint, source_transition_receipt_id,
        source_transition_receipt_fingerprint, updated_at
      ) VALUES (?, ?, ?, 1, 'absent', NULL, ?, ?, ?)`,
    ).run(
      semanticFixture.workspace_id,
      semanticFixture.project_id,
      createProtocolSha256V01("goal:historical"),
      "transition:historical",
      createProtocolSha256V01("historical-transition"),
      T1,
    );
    assert.equal(
      readProjectWorkInitializationV01(semanticFixture.db, semanticFixture.config).state,
      "existing_history_without_current_packet",
    );
  } finally {
    semanticFixture.db.close();
  }

  const rootFixture = createFixtureV01("root-unavailable");
  try {
    const unavailable = readProjectWorkInitializationV01(
      rootFixture.db,
      rootFixture.config,
      { root_available: () => false },
    );
    assert.equal(unavailable.state, "unavailable");
    assert.equal(unavailable.reason, "root_unavailable");
  } finally {
    rootFixture.db.close();
  }

  const sourceFixture = createFixtureV01("source-unavailable");
  try {
    sourceFixture.db.exec("DROP TABLE vnext_core_records");
    assert.equal(
      readProjectWorkInitializationV01(sourceFixture.db, sourceFixture.config).state,
      "unavailable",
    );
  } finally {
    sourceFixture.db.close();
  }
}

function assertMutationAndReplayV01(): void {
  const fixture = createFixtureV01("insert-and-replay");
  try {
    const beforeFiles = readdirSync(fixture.root);
    const session = authenticatedSessionV01(fixture, "insert");
    const request = requestV01(fixture, {
      goal: "한국어 첫 목표를 완성한다",
      success_criteria: ["  동작이 검증된다 ", "영문 criterion passes", "동작이 검증된다"],
      non_goals: ["배포하지 않는다"],
    });
    const inserted = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: session,
      request,
      clock: fixedClock(T2),
    });
    assert.equal(inserted.status, "inserted");
    assert.equal(inserted.execution_started, false);
    assert.equal(inserted.run_created, false);
    assert.equal(inserted.provider_called, false);
    assert.equal(inserted.project_files_written, false);
    assert.equal(inserted.proposal_created, false);
    assert.equal(inserted.review_decision_created, false);
    assert.equal(inserted.transition_created, false);
    assert.equal(inserted.semantic_state_changed, false);
    assert.deepEqual(readdirSync(fixture.root), beforeFiles);
    assert.equal(
      listVNextCoreRecordsV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        record_kinds: [
          "task_context_packet",
          "episode_delta_proposal",
          "review_decision",
          "state_transition_receipt",
          "run_receipt",
        ],
        limit: 32,
      }).length,
      1,
    );
    const state = readProjectWorkInitializationV01(fixture.db, fixture.config);
    assert.equal(state.state, "defined_initial_work");
    assert.equal(state.current_work?.goal, "한국어 첫 목표를 완성한다");
    assert.deepEqual(state.current_work?.success_criteria, [
      "동작이 검증된다",
      "영문 criterion passes",
    ]);
    const lineage = inspectInitialProjectWorkPacketLineageV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      packet: inserted.packet,
    });
    assert.equal(lineage.lineage_kind, "initial_user_defined");
    assert.equal(lineage.projection_current, true);
    assert.equal(lineage.definition_ref.trust_class, "user_declaration");
    assert.equal(lineage.operator_action_ref.trust_class, "direct_local_observation");

    const replay = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(inserted.session_admission.cookie_value),
      request,
      clock: fixedClock("2026-08-01T00:00:03.000Z"),
    });
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.packet.packet_id, inserted.packet.packet_id);
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential: credentialFromCookieV01(replay.session_admission.cookie_value),
        request: { ...request, goal: "A different first goal" },
        clock: fixedClock("2026-08-01T00:00:04.000Z"),
      }),
      errorCode("first_work_already_defined"),
    );

    const altered = structuredClone(inserted.packet);
    altered.compatibility.source_refs = altered.compatibility.source_refs.filter(
      (ref) => ref.ref_type !== "first_work_definition",
    );
    assert.throws(
      () => inspectInitialProjectWorkPacketLineageV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        packet: altered,
      }),
      errorCode("initial_project_work_lineage_ref_invalid"),
    );
    const accepted = structuredClone(inserted.packet);
    accepted.selected_context[0]!.entry_kind = "accepted_state_ref";
    assert.throws(
      () => inspectInitialProjectWorkPacketLineageV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        packet: accepted,
      }),
      errorCode("initial_project_work_packet_binding_invalid"),
    );
  } finally {
    fixture.db.close();
  }

  for (const [name, boundary] of [
    [
      "rocket",
      normalizeInitialProjectWorkDefinitionV01({
        goal: "🚀".repeat(2_000),
        success_criteria: ["The complete Unicode goal remains executable"],
        non_goals: [],
      }),
    ],
    [
      "ascii",
      definitionAtCanonicalBytesV01(
        INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
        "ascii",
      ),
    ],
    [
      "mixed",
      definitionAtCanonicalBytesV01(
        INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
        "mixed",
      ),
    ],
  ] as const) {
    const boundaryFixture = createFixtureV01(`boundary-insert-${name}`);
    try {
      const request = requestV01(boundaryFixture, boundary);
      const inserted = defineInitialProjectWorkV01(boundaryFixture.db, {
        config: boundaryFixture.config,
        credential: authenticatedSessionV01(boundaryFixture, `boundary-${name}`),
        request,
        clock: fixedClock(T2),
      });
      assert.equal(inserted.status, "inserted");
      assert.deepEqual(inserted.definition, boundary);
      const replay = defineInitialProjectWorkV01(boundaryFixture.db, {
        config: boundaryFixture.config,
        credential: credentialFromCookieV01(
          inserted.session_admission.cookie_value,
        ),
        request,
        clock: fixedClock("2026-08-01T00:00:03.000Z"),
      });
      assert.equal(replay.status, "exact_replay");
      assert.equal(replay.packet.packet_id, inserted.packet.packet_id);
    } finally {
      boundaryFixture.db.close();
    }
  }
}

function definitionAtCanonicalBytesV01(
  targetBytes: number,
  variant: "ascii" | "mixed",
): ProjectWorkDefinitionV01 {
  const goal =
    variant === "ascii"
      ? "g".repeat(2_000)
      : `${"한글".repeat(500)}${"g".repeat(500)}`;
  const successCriteria = Array.from({ length: 12 }, (_, index) => {
    const prefix = `criterion-${String(index).padStart(2, "0")}:`;
    return `${prefix}${"c".repeat(500 - prefix.length)}`;
  });
  const nonGoals: string[] = [];
  const value = (): ProjectWorkDefinitionV01 => ({
    goal,
    success_criteria: successCriteria,
    non_goals: [...nonGoals],
  });
  while (
    Buffer.byteLength(canonicalizeProtocolValueV01(value()), "utf8") <
    targetBytes
  ) {
    const current = nonGoals.at(-1);
    if (current === undefined || [...current].length >= 500) {
      const prefix = `non-goal-${String(nonGoals.length).padStart(2, "0")}:`;
      nonGoals.push(prefix);
    } else {
      nonGoals[nonGoals.length - 1] = `${current}n`;
    }
    const bytes = Buffer.byteLength(
      canonicalizeProtocolValueV01(value()),
      "utf8",
    );
    if (bytes > targetBytes) {
      throw new Error(`unable_to_construct_exact_definition:${bytes}`);
    }
  }
  return value();
}

function assertRevisionMutationAndReplayV01(): void {
  const fixture = createFixtureV01("revision-insert-and-replay");
  try {
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "revision"),
      request: requestV01(fixture, {
        goal: "Initial unstarted goal",
        success_criteria: ["Initial criterion"],
        non_goals: [],
      }),
      clock: fixedClock(T2),
    });
    const initialEligibility = readProjectWorkRevisionEligibilityV01(
      fixture.db,
      fixture.config,
    );
    assert.equal(initialEligibility.status, "eligible_initial_packet");
    assert.equal(initialEligibility.revision_count, 0);
    const firstDefinition = {
      goal: "수정된 첫 목표를 안전하게 실행한다",
      success_criteria: ["Korean revision is current", "혼합 Unicode 🚀 works"],
      non_goals: ["배포하지 않는다"],
    };
    const firstRequest = revisionRequestV01(
      fixture,
      initial.packet,
      "initial_user_defined",
      firstDefinition,
    );
    const first = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(
        initial.session_admission.cookie_value,
      ),
      request: firstRequest,
      clock: fixedClock("2026-08-01T00:00:03.000Z"),
    });
    assert.equal(first.status, "inserted");
    assert.equal(first.run_created, false);
    assert.equal(first.execution_started, false);
    assert.equal(first.transition_created, false);
    assert.equal(first.semantic_state_changed, false);
    assert.notEqual(first.packet.packet_id, initial.packet.packet_id);
    assert.equal(
      (fixture.db
        .prepare("SELECT COUNT(*) AS count FROM autonomy_runs")
        .get() as { count: number }).count,
      0,
    );
    const concurrentReplay = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(
        first.session_admission.cookie_value,
      ),
      request: firstRequest,
      clock: fixedClock("2026-08-01T00:00:03.500Z"),
    });
    assert.equal(concurrentReplay.status, "exact_replay");
    assert.equal(concurrentReplay.packet.packet_id, first.packet.packet_id);
    assert.equal(concurrentReplay.run_created, false);
    assert.equal(concurrentReplay.execution_started, false);
    let current = readProjectWorkInitializationV01(fixture.db, fixture.config);
    assert.equal(current.state, "defined_revised_work");
    assert.deepEqual(current.current_work, first.definition);
    assert.equal(
      current.current_packet?.lineage_kind,
      "pre_execution_user_revision",
    );
    assert.equal(current.revision_eligibility.status, "eligible_revised_packet");

    const replay = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(
        concurrentReplay.session_admission.cookie_value,
      ),
      request: revisionRequestV01(
        fixture,
        first.packet,
        "pre_execution_user_revision",
        firstDefinition,
      ),
      clock: fixedClock("2026-08-01T00:00:04.000Z"),
    });
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.packet.packet_id, first.packet.packet_id);
    assert.equal(
      listVNextCoreRecordsV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        record_kinds: ["task_context_packet"],
        limit: 8,
      }).length,
      2,
    );

    const secondDefinition = {
      goal: "Second revised goal is the only current goal",
      success_criteria: ["Second revision is selected", "Start uses revision two"],
      non_goals: [],
    };
    const second = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(replay.session_admission.cookie_value),
      request: revisionRequestV01(
        fixture,
        first.packet,
        "pre_execution_user_revision",
        secondDefinition,
      ),
      clock: fixedClock("2026-08-01T00:00:05.000Z"),
    });
    assert.equal(second.status, "inserted");
    const chain = inspectPreExecutionProjectWorkRevisionChainV01(
      fixture.db,
      fixture.config,
    );
    assert.equal(chain.revision_count, 2);
    assert.equal(chain.tip_packet.packet_id, second.packet.packet_id);
    assert.deepEqual(chain.packet_ids, [
      initial.packet.packet_id,
      first.packet.packet_id,
      second.packet.packet_id,
    ]);
    assert.throws(
      () =>
        revisePreExecutionProjectWorkV01(fixture.db, {
          config: fixture.config,
          credential: credentialFromCookieV01(
            second.session_admission.cookie_value,
          ),
          request: {
            ...firstRequest,
            goal: "A different stale request must not win",
          },
          clock: fixedClock("2026-08-01T00:00:06.000Z"),
        }),
      errorCode("work_revision_current_packet_changed"),
    );
    current = readProjectWorkInitializationV01(fixture.db, fixture.config);
    assert.equal(current.current_work?.goal, secondDefinition.goal);
    assert.equal(
      listVNextCoreRecordsV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        record_kinds: ["task_context_packet"],
        limit: 8,
      }).length,
      3,
    );
  } finally {
    fixture.db.close();
  }
}

function assertExactSuccessorReplayHistoryBoundaryV01(): void {
  const cases: Array<{
    name: string;
    expected_code:
      | "work_revision_execution_started"
      | "work_revision_history_changed"
      | "work_revision_current_packet_changed";
    add_history: (fixture: FixtureV01, tip: TaskContextPacketV01) => void;
  }> = [
    ...["queued", "running", "waiting_for_approval", "completed"].map(
      (status) => ({
        name: `run-${status}`,
        expected_code: "work_revision_execution_started" as const,
        add_history: (fixture: FixtureV01) =>
          insertManagedRunV01(fixture, {
            run_id: `run:exact-successor-${status}`,
            scope: fixture.project_id,
            status,
            metadata_json: JSON.stringify({
              workspace_id: fixture.workspace_id,
              project_id: fixture.project_id,
            }),
            created_at: "2026-08-01T00:00:04.000Z",
          }),
      }),
    ),
    ...[
      "run_receipt",
      "episode_delta_proposal",
      "review_decision",
      "semantic_commit_gate",
      "state_transition_receipt",
      "semantic_state",
    ].map((recordKind) => ({
      name: `core-${recordKind}`,
      expected_code: "work_revision_history_changed" as const,
      add_history: (fixture: FixtureV01) =>
        insertHistoryRecordV01(
          fixture,
          recordKind as VNextCoreRecordKindV01,
          "2026-08-01T00:00:04.000Z",
        ),
    })),
    {
      name: "semantic-state-entry",
      expected_code: "work_revision_current_packet_changed",
      add_history: (fixture) => insertSemanticStateEntryV01(fixture),
    },
    {
      name: "semantic-target-head",
      expected_code: "work_revision_current_packet_changed",
      add_history: (fixture) => insertSemanticTargetHeadV01(fixture),
    },
    {
      name: "semantic-successor-packet",
      expected_code: "work_revision_current_packet_changed",
      add_history: (fixture, tip) =>
        insertSemanticSuccessorPacketV01(fixture, tip),
    },
  ];

  for (const historyCase of cases) {
    const fixture = createFixtureV01(
      `exact-successor-history-${historyCase.name}`,
    );
    try {
      const initial = defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential: authenticatedSessionV01(fixture, historyCase.name),
        request: requestV01(fixture),
        clock: fixedClock(T2),
      });
      const definition = {
        goal: `Exact successor ${historyCase.name}`,
        success_criteria: ["Replay is permitted only before work history"],
        non_goals: [],
      };
      const staleRequest = revisionRequestV01(
        fixture,
        initial.packet,
        "initial_user_defined",
        definition,
      );
      const inserted = revisePreExecutionProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential: credentialFromCookieV01(
          initial.session_admission.cookie_value,
        ),
        request: staleRequest,
        clock: fixedClock("2026-08-01T00:00:03.000Z"),
      });
      const packetCount = countProjectPacketsV01(fixture);
      historyCase.add_history(fixture, inserted.packet);
      assert.throws(
        () =>
          revisePreExecutionProjectWorkV01(fixture.db, {
            config: fixture.config,
            credential: credentialFromCookieV01(
              inserted.session_admission.cookie_value,
            ),
            request: staleRequest,
            clock: fixedClock("2026-08-01T00:00:05.000Z"),
          }),
        errorCode(historyCase.expected_code),
        historyCase.name,
      );
      assert.equal(
        countProjectPacketsV01(fixture),
        packetCount + (historyCase.name === "semantic-successor-packet" ? 1 : 0),
        `${historyCase.name} wrote an additional revision packet`,
      );
    } finally {
      fixture.db.close();
    }
  }
}

function assertRevisionRecoveryRefusalsV01(): void {
  const branch = createFixtureV01("revision-recovery-branch");
  try {
    const initial = defineInitialProjectWorkV01(branch.db, {
      config: branch.config,
      credential: authenticatedSessionV01(branch, "branch-initial"),
      request: requestV01(branch),
      clock: fixedClock(T2),
    });
    revisePreExecutionProjectWorkV01(branch.db, {
      config: branch.config,
      credential: credentialFromCookieV01(initial.session_admission.cookie_value),
      request: revisionRequestV01(
        branch,
        initial.packet,
        "initial_user_defined",
        {
          goal: "Valid first branch",
          success_criteria: ["One successor exists"],
          non_goals: [],
        },
      ),
      clock: fixedClock("2026-08-01T00:00:03.000Z"),
    });
    const branchCredential = authenticatedSessionV01(
      branch,
      "branch-conflict",
    );
    const built = buildPreExecutionProjectWorkRevisionPacketV01({
      request: revisionRequestV01(
        branch,
        initial.packet,
        "initial_user_defined",
        {
          goal: "Conflicting first branch",
          success_criteria: ["Recovery refuses ambiguity"],
          non_goals: [],
        },
      ),
      operator_id: branch.config.operator_id,
      session_id: branchCredential.session_id,
      revision_number: 1,
      definition: {
        goal: "Conflicting first branch",
        success_criteria: ["Recovery refuses ambiguity"],
        non_goals: [],
      },
      prior_packet: initial.packet,
      origin_first_work_definition_ref:
        inspectInitialProjectWorkPacketLineageV01(branch.db, {
          workspace_id: branch.workspace_id,
          project_id: branch.project_id,
          packet: initial.packet,
        }).definition_ref,
      generated_at: "2026-08-01T00:00:04.000Z",
    });
    insertVNextCoreRecordV01(branch.db, {
      record_kind: "task_context_packet",
      record_id: built.packet.packet_id,
      workspace_id: branch.workspace_id,
      project_id: branch.project_id,
      fingerprint: built.packet.integrity.fingerprint,
      idempotency_key: built.lineage.idempotency_key,
      payload: built.packet,
      created_at: built.packet.generated_at,
    });
    assert.throws(
      () =>
        inspectPreExecutionProjectWorkRevisionChainV01(branch.db, branch.config),
      errorCode("work_revision_branch_invalid"),
    );
    assert.equal(
      validateRecoveryCanonicalDatabaseV01(branch.db).status,
      "invalid",
    );
  } finally {
    branch.db.close();
  }

  const missing = createFixtureV01("revision-recovery-missing-prior");
  try {
    const credential = authenticatedSessionV01(missing, "missing-initial");
    const initialDefinition = normalizeInitialProjectWorkDefinitionV01(
      requestV01(missing),
    );
    const selection = readActiveProjectSelectionV01(
      missing.db,
      missing.workspace_id,
    )!;
    const initial = buildInitialProjectWorkTaskContextPacketV01({
      workspace_id: missing.workspace_id,
      project_id: missing.project_id,
      operator_id: missing.config.operator_id,
      session_id: credential.session_id,
      expected_active_selection_revision: selection.selection_revision,
      definition: initialDefinition,
      generated_at: T2,
    });
    const definition = {
      goal: "Revision whose prior is unavailable",
      success_criteria: ["Recovery refuses the incomplete chain"],
      non_goals: [],
    };
    const revision = buildPreExecutionProjectWorkRevisionPacketV01({
      request: revisionRequestV01(
        missing,
        initial.packet,
        "initial_user_defined",
        definition,
      ),
      operator_id: missing.config.operator_id,
      session_id: credential.session_id,
      revision_number: 1,
      definition,
      prior_packet: initial.packet,
      origin_first_work_definition_ref: initial.lineage.definition_ref,
      generated_at: "2026-08-01T00:00:03.000Z",
    });
    insertVNextCoreRecordV01(missing.db, {
      record_kind: "task_context_packet",
      record_id: revision.packet.packet_id,
      workspace_id: missing.workspace_id,
      project_id: missing.project_id,
      fingerprint: revision.packet.integrity.fingerprint,
      idempotency_key: revision.lineage.idempotency_key,
      payload: revision.packet,
      created_at: revision.packet.generated_at,
    });
    assert.equal(
      validateRecoveryCanonicalDatabaseV01(missing.db).status,
      "invalid",
    );
  } finally {
    missing.db.close();
  }
}

function assertRevisionLimitV01(): void {
  const fixture = createFixtureV01("revision-limit");
  try {
    const initialCredential = authenticatedSessionV01(fixture, "limit");
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: initialCredential,
      request: requestV01(fixture),
      clock: fixedClock(T2),
    });
    const originFirstWorkDefinitionRef =
      inspectInitialProjectWorkPacketLineageV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        packet: initial.packet,
      }).definition_ref;
    let currentPacket = initial.packet;
    let currentLineage:
      | "initial_user_defined"
      | "pre_execution_user_revision" = "initial_user_defined";
    let lastRevisionRequest: RevisePreExecutionProjectWorkRequestV01 | null = null;
    const credential = credentialFromCookieV01(
      initial.session_admission.cookie_value,
    );
    // Build the canonical 32-packet fixture directly so this boundary test does
    // not re-run the full authenticated chain inspection after every prefix.
    // The mutation owner is still exercised for the actual limit refusal below.
    for (let index = 1; index <= 32; index += 1) {
      const definition = {
        goal: `Bounded revision ${index}`,
        success_criteria: [`Revision ${index} is the exact linear tip`],
        non_goals: [],
      };
      const generatedAt = new Date(
        Date.parse(T2) + index * 1_000,
      ).toISOString();
      const revisionRequest = revisionRequestV01(
        fixture,
        currentPacket,
        currentLineage,
        definition,
      );
      const revised = buildPreExecutionProjectWorkRevisionPacketV01({
        request: revisionRequest,
        operator_id: fixture.config.operator_id,
        session_id: initialCredential.session_id,
        revision_number: index,
        definition,
        prior_packet: currentPacket,
        origin_first_work_definition_ref: originFirstWorkDefinitionRef,
        generated_at: generatedAt,
      });
      insertVNextCoreRecordV01(fixture.db, {
        record_kind: "task_context_packet",
        record_id: revised.packet.packet_id,
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        fingerprint: revised.packet.integrity.fingerprint,
        idempotency_key: revised.lineage.idempotency_key,
        payload: revised.packet,
        created_at: generatedAt,
      });
      currentPacket = revised.packet;
      currentLineage = "pre_execution_user_revision";
      lastRevisionRequest = revisionRequest;
    }
    const eligibility = readProjectWorkRevisionEligibilityV01(
      fixture.db,
      fixture.config,
    );
    assert.equal(eligibility.status, "revision_limit_reached");
    assert.equal(eligibility.revision_count, 32);
    assert(lastRevisionRequest);
    const limitReplay = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential,
      request: lastRevisionRequest,
      clock: fixedClock("2026-08-01T00:00:34.500Z"),
    });
    assert.equal(limitReplay.status, "exact_replay");
    assert.equal(limitReplay.packet.packet_id, currentPacket.packet_id);
    assert.equal(limitReplay.run_created, false);
    assert.equal(limitReplay.execution_started, false);
    assert.throws(
      () =>
        revisePreExecutionProjectWorkV01(fixture.db, {
          config: fixture.config,
          credential: credentialFromCookieV01(
            limitReplay.session_admission.cookie_value,
          ),
          request: revisionRequestV01(
            fixture,
            currentPacket,
            currentLineage,
            {
              goal: "Revision 33 must be refused",
              success_criteria: ["No packet is written"],
              non_goals: [],
            },
          ),
          clock: fixedClock("2026-08-01T00:00:35.000Z"),
        }),
      errorCode("work_revision_limit_reached"),
    );
    assert.equal(
      listVNextCoreRecordsV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        record_kinds: ["task_context_packet"],
        limit: 64,
      }).length,
      33,
    );
    const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
    assert.equal(recovery.status, "valid", recovery.code);
  } finally {
    fixture.db.close();
  }
}

function assertMutationRefusalsAndRollbackV01(): void {
  const fixture = createFixtureV01("rollback");
  try {
    const credential = authenticatedSessionV01(fixture, "rollback");
    const request = requestV01(fixture);
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request: { ...request, expected_active_selection_revision: 999 },
        clock: fixedClock(T2),
      }),
      errorCode("first_work_active_selection_conflict"),
    );
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request,
        clock: fixedClock(T2),
      }, { root_available: () => false }),
      errorCode("first_work_root_unavailable"),
    );
    fixture.db.exec(
      `CREATE TRIGGER test_first_work_rollback
       BEFORE INSERT ON vnext_core_records
       WHEN NEW.record_kind = 'task_context_packet'
       BEGIN SELECT RAISE(ABORT, 'test_first_work_rollback'); END`,
    );
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request,
        clock: fixedClock(T2),
      }),
      errorCode("first_work_write_failed"),
    );
    assert.equal(readProjectWorkInitializationV01(fixture.db, fixture.config).state, "not_defined");
    fixture.db.exec("DROP TRIGGER test_first_work_rollback");
    const retry = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential,
      request,
      clock: fixedClock(T2),
    });
    assert.equal(retry.status, "inserted");
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request,
        clock: fixedClock(T2),
      }),
      errorCode("operator_action_nonce_invalid"),
    );
  } finally {
    fixture.db.close();
  }

  const isolation = createFixtureV01("isolation");
  try {
    const otherRoot = path.join(ROOT, "isolation-other");
    mkdirSync(otherRoot, { recursive: true });
    const other = getOrCreateCanonicalProjectForLocalRootV01(isolation.db, {
      workspace_id: isolation.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(otherRoot, {
        base_path: ROOT,
      }),
      display_name: "Other",
    });
    assert.equal(
      readProjectWorkInitializationV01(isolation.db, {
        workspace_id: isolation.workspace_id,
        project_id: other.project.project_id,
      }).mutation_eligible,
      false,
    );
    const current = readActiveProjectSelectionV01(isolation.db, isolation.workspace_id)!;
    selectActiveProjectV01(isolation.db, {
      workspace_id: isolation.workspace_id,
      project_id: other.project.project_id,
      expected_project_id: isolation.project_id,
      expected_revision: current.selection_revision,
      now: T2,
    });
    const credential = authenticatedSessionV01(isolation, "inactive");
    assert.throws(
      () => defineInitialProjectWorkV01(isolation.db, {
        config: isolation.config,
        credential,
        request: requestV01(isolation),
        clock: fixedClock("2026-08-01T00:00:03.000Z"),
      }),
      errorCode("first_work_active_selection_conflict"),
    );
    assert.equal(
      readProjectWorkInitializationV01(isolation.db, {
        workspace_id: isolation.workspace_id,
        project_id: other.project.project_id,
      }).state,
      "not_defined",
    );
  } finally {
    isolation.db.close();
  }

  const genesisHistory = createFixtureV01("genesis-history");
  try {
    insertManagedRunV01(genesisHistory, {
      run_id: "run:genesis-history",
      scope: genesisHistory.project_id,
      metadata_json: "{}",
    });
    assert.throws(
      () =>
        defineInitialProjectWorkV01(genesisHistory.db, {
          config: genesisHistory.config,
          credential: authenticatedSessionV01(genesisHistory, "history"),
          request: requestV01(genesisHistory),
          clock: fixedClock(T2),
        }),
      errorCode("first_work_state_changed"),
    );
    assert.equal(
      listVNextCoreRecordsV01(genesisHistory.db, {
        workspace_id: genesisHistory.workspace_id,
        project_id: genesisHistory.project_id,
        record_kinds: ["task_context_packet"],
        limit: 1,
      }).length,
      0,
    );
  } finally {
    genesisHistory.db.close();
  }

  const recoveryHistory = createFixtureV01("recovery-genesis-history");
  try {
    defineInitialProjectWorkV01(recoveryHistory.db, {
      config: recoveryHistory.config,
      credential: authenticatedSessionV01(recoveryHistory, "recovery"),
      request: requestV01(recoveryHistory),
      clock: fixedClock(T2),
    });
    insertManagedRunV01(recoveryHistory, {
      run_id: "run:predated-genesis-history",
      scope: recoveryHistory.project_id,
      metadata_json: "{}",
      created_at: T1,
    });
    assert.equal(
      validateRecoveryCanonicalDatabaseV01(recoveryHistory.db).status,
      "invalid",
    );
  } finally {
    recoveryHistory.db.close();
  }
}

async function assertSeparateNativeHostStartV01(): Promise<void> {
  const fixture = createFixtureV01("native-host-start");
  try {
    const beforeFiles = readdirSync(fixture.root);
    const inserted = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "host"),
      request: requestV01(fixture, {
        goal: "Execute the explicitly saved first goal",
        success_criteria: ["The bounded host returns a structured result"],
        non_goals: ["Do not deploy"],
      }),
      clock: fixedClock(T2),
    });
    assert.equal(
      (fixture.db.prepare("SELECT COUNT(*) AS count FROM autonomy_runs").get() as { count: number }).count,
      0,
    );
    const projectHome = await readProjectHomeProjectionV01(
      fixture.db,
      fixture.config,
      {
        now: () => "2026-08-01T00:00:03.000Z",
        read_root_availability: async () => "available",
        read_capability_statuses: () => [],
        operator_config: fixture.config,
      },
    );
    assert.equal(projectHome.coordination.task_frame.goal, inserted.definition.goal);
    assert.deepEqual(
      projectHome.coordination.task_frame.success_criteria,
      inserted.definition.success_criteria,
    );
    const initialization = readProjectWorkInitializationV01(fixture.db, fixture.config);
    const guide = buildProjectGuideBriefV02({
      source: {
        route_mode: "canonical",
        requested_project_id: null,
        active_project_id: fixture.project_id,
        recent_projects: [],
        projection: projectHome,
        project_resolution: "resolved",
        direct_host_round_trip_available: true,
        delegated_work: null,
        work_initialization: initialization,
      },
      generated_at: "2026-08-01T00:00:03.000Z",
    });
    assert.equal(guide.coordinate.goal, inserted.definition.goal);
    const admission = await admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config,
      packet_id: inserted.packet.packet_id,
      packet_fingerprint: inserted.packet.integrity.fingerprint,
      evaluated_at: "2026-08-01T00:00:03.000Z",
    });
    assert.equal(admission.packet_lineage.lineage_kind, "initial_user_defined");
    const requests: NativeHostRequestV01[] = [];
    const times = timestampSequenceV01("2026-08-01T00:00:03.000Z");
    const result = await runDirectNativeHostRoundTripV01(
      fixture.db,
      {
        config: fixture.config,
        mode: "interactive",
        operator_mutation: {
          credential: credentialFromCookieV01(inserted.session_admission.cookie_value),
          clock: fixedClock("2026-08-01T00:00:03.000Z"),
        },
      },
      {
        now: times,
        on_invocation_admitted: (observed) => {
          requests.push(observed.request);
        },
      },
    );
    assert.equal(result.status, "inserted");
    assert.equal(requests.length, 1);
    const request = requests[0]!;
    assert("lineage_kind" in request.packet_lineage);
    assert.equal(request.packet_lineage.lineage_kind, "initial_user_defined");
    assert.equal("source_transition_receipt_ref" in request.packet_lineage, false);
    assert.deepEqual(Object.keys(request.packet_lineage).sort(), [
      "first_work_definition_ref",
      "first_work_request_ref",
      "lineage_kind",
      "operator_action_ref",
      "packet_source_refs",
      "selected_context_refs",
    ]);
    assert.equal(request.guide_brief, undefined);
    assert.equal(
      result.receipt.external_refs.some((ref) => ref.ref_type === "first_work_definition"),
      true,
    );
    assert.equal(result.transition_created, false);
    assert.equal(result.decision_created, false);
    assert.equal(result.semantic_state_changed, false);
    assert.equal(result.proposal.status, "available");
    assert.deepEqual(readdirSync(fixture.root), beforeFiles);
    const continuity = projectVNextOperatorPilotContinuityV01(fixture.db, {
      config: fixture.config,
      clock: fixedClock("2026-08-01T00:00:20.000Z"),
    });
    assert.equal(continuity.latest_compiled_packet?.lineage_kind, "initial_user_defined");
    const proposalRecord = listVNextCoreRecordsV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      record_kinds: ["episode_delta_proposal"],
      limit: 1,
    })[0]!;
    const proposal = proposalRecord.payload as EpisodeDeltaProposalV01;
    readVNextOperatorPilotProposalDurableLineageV01(fixture.db, {
      config: fixture.config,
      proposal,
      clock: fixedClock("2026-08-01T00:00:20.000Z"),
    });
    readSharedProjectInspectorV01(fixture.db, {
      config: fixture.config,
      authenticated_session_id: "session:first-work-recovery",
      observed_at: "2026-08-01T00:00:20.000Z",
      target: {
        target_kind: "episode_delta_proposal",
        record_id: proposal.proposal_id,
        expected_fingerprint: proposal.integrity.fingerprint,
      },
    });
    const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
    assert.equal(recovery.status, "valid", recovery.code);
  } finally {
    fixture.db.close();
  }
}

async function assertRevisedNativeHostStartV01(): Promise<void> {
  const fixture = createFixtureV01("revised-native-host-start");
  try {
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "revised-host"),
      request: requestV01(fixture, {
        goal: "Old goal must not execute",
        success_criteria: ["Initial context is append-only"],
        non_goals: [],
      }),
      clock: fixedClock(T2),
    });
    const initialAdmission = await admitPersistedHostTaskContextPacketV01(
      fixture.db,
      {
        config: fixture.config,
        packet_id: initial.packet.packet_id,
        packet_fingerprint: initial.packet.integrity.fingerprint,
        evaluated_at: "2026-08-01T00:00:03.000Z",
      },
    );
    const initialIdentity = buildDirectNativeHostRunIdentityV01({
      config: fixture.config,
      mode: "interactive",
      admission: initialAdmission,
      adapter: createDeterministicCodexAdapterV01(),
      automation_context: null,
    });
    const revisedDefinition = {
      goal: "Execute the exact revised packet",
      success_criteria: ["The host request carries the revised goal"],
      non_goals: ["Do not fabricate a Transition receipt"],
    };
    const sourceComparison = compareSelectedWorkSources(initial.packet, [
      buildSelectedWorkSourceEntry(fixture, {
        source: "Selected result discussion, revision 2",
        observed_at: null,
        provenance: "user_declaration",
        label: "Changed assumption / user correction",
        text: "Correction: reject A only under X, not under untested Y. Defer Y until B arrives; Z is unresolved. Next check: compare X and Y with B.",
      }),
    ]);
    const revised = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(initial.session_admission.cookie_value),
      request: {
        ...revisionRequestV01(fixture, initial.packet, "initial_user_defined", revisedDefinition),
        selected_source_context: sourceComparison.entries,
        expected_source_comparison: sourceComparison.fingerprint,
      },
      clock: fixedClock("2026-08-01T00:00:03.000Z"),
    });
    const projectHome = await readProjectHomeProjectionV01(
      fixture.db,
      fixture.config,
      {
        now: () => "2026-08-01T00:00:04.000Z",
        read_root_availability: async () => "available",
        read_capability_statuses: () => [],
        operator_config: fixture.config,
      },
    );
    assert.equal(
      projectHome.coordination.task_frame.goal,
      revisedDefinition.goal,
    );
    assert.equal(
      projectHome.coordination.task_frame.goal === initial.definition.goal,
      false,
    );
    const initialization = readProjectWorkInitializationV01(
      fixture.db,
      fixture.config,
    );
    const guide = buildProjectGuideBriefV02({
      source: {
        route_mode: "canonical",
        requested_project_id: null,
        active_project_id: fixture.project_id,
        recent_projects: [],
        projection: projectHome,
        project_resolution: "resolved",
        direct_host_round_trip_available: true,
        delegated_work: null,
        work_initialization: initialization,
      },
      generated_at: "2026-08-01T00:00:04.000Z",
    });
    assert.equal(guide.coordinate.goal, revisedDefinition.goal);
    const admission = await admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config,
      packet_id: revised.packet.packet_id,
      packet_fingerprint: revised.packet.integrity.fingerprint,
      evaluated_at: "2026-08-01T00:00:04.000Z",
    });
    assert.equal(
      admission.packet_lineage.lineage_kind,
      "pre_execution_user_revision",
    );
    const revisedIdentity = buildDirectNativeHostRunIdentityV01({
      config: fixture.config,
      mode: "interactive",
      admission,
      adapter: createDeterministicCodexAdapterV01(),
      automation_context: null,
    });
    assert.notEqual(revisedIdentity.run_id, initialIdentity.run_id);
    const requests: NativeHostRequestV01[] = [];
    const result = await runDirectNativeHostRoundTripV01(
      fixture.db,
      {
        config: fixture.config,
        mode: "interactive",
        operator_mutation: {
          credential: credentialFromCookieV01(
            revised.session_admission.cookie_value,
          ),
          clock: fixedClock("2026-08-01T00:00:04.000Z"),
        },
      },
      {
        now: timestampSequenceV01("2026-08-01T00:00:04.000Z"),
        on_invocation_admitted: (observed) => requests.push(observed.request),
      },
    );
    assert.equal(result.status, "inserted");
    assert.equal(requests.length, 1);
    assert.equal(requests[0]!.packet.task.goal, revisedDefinition.goal);
    assert.deepEqual(readSelectedWorkSources(requests[0]!.packet), sourceComparison.entries);
    assert(requests[0]!.packet_lineage.selected_context_refs.some((ref) =>
      ref.source_ref === sourceComparison.entries[0]!.source_ref));
    assert("lineage_kind" in requests[0]!.packet_lineage);
    assert.equal(
      requests[0]!.packet_lineage.lineage_kind,
      "pre_execution_user_revision",
    );
    assert.deepEqual(Object.keys(requests[0]!.packet_lineage).sort(), [
      "immediate_prior_packet_ref",
      "lineage_kind",
      "operator_action_ref",
      "origin_first_work_definition_ref",
      "packet_source_refs",
      "selected_context_refs",
      "work_definition_revision_ref",
      "work_revision_request_ref",
    ]);
    assert.equal(
      result.receipt.external_refs.some(
        (ref) => ref.ref_type === "work_definition_revision",
      ),
      true,
    );
    assert.equal(result.transition_created, false);
    assert.equal(result.semantic_state_changed, false);
    assert.equal(
      readProjectWorkRevisionEligibilityV01(fixture.db, fixture.config).status,
      "blocked_execution_started",
    );
    const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
    assert.equal(recovery.status, "valid", recovery.code);
  } finally {
    fixture.db.close();
  }
}

interface FixtureV01 {
  db: Database.Database;
  root: string;
  workspace_id: string;
  project_id: string;
  config: VNextLocalOperatorPilotConfigV01;
}

function insertManagedRunV01(
  fixture: FixtureV01,
  input: {
    run_id: string;
    scope: string;
    status?: string;
    metadata_json: string;
    created_at?: string;
  },
): void {
  const createdAt = input.created_at ?? T1;
  fixture.db
    .prepare(
      `INSERT INTO autonomy_runs (
        run_id, scope, title, status, created_at, updated_at,
        source_refs_json, authority_boundary_json, budget_snapshot_json,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, '[]', '{}', '{}', ?)`,
    )
    .run(
      input.run_id,
      input.scope,
      "Historical managed work",
      input.status ?? "completed",
      createdAt,
      createdAt,
      input.metadata_json,
    );
}

function createFixtureV01(name: string, git = false, disk = false, canonicalRoot = false): FixtureV01 {
  const root = path.join(canonicalRoot ? realpathSync(ROOT) : ROOT, name);
  mkdirSync(root, { recursive: true });
  if (git) mkdirSync(path.join(root, ".git"));
  const databasePath = disk ? path.join(ROOT, `${name}.db`) : ":memory:";
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const registration = getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: ROOT }),
    display_name: `First work ${name}`,
  });
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: T0,
  });
  return {
    db,
    root,
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    config: {
      enabled: true,
      workspace_id: workspace.workspace_id,
      project_id: registration.project.project_id,
      operator_id: `operator:first-work:${name}`,
      database_path: databasePath,
    },
  };
}

function authenticatedSessionV01(
  fixture: FixtureV01,
  suffix: string,
): VNextLocalOperatorSessionCredentialV01 {
  const config = { ...fixture.config, operator_id: `${fixture.config.operator_id}:${suffix}` };
  fixture.config.operator_id = config.operator_id;
  const issue = issueVNextLocalOperatorBootstrapV01(fixture.db, {
    config,
    clock: fixedClock(T0),
  });
  return consumeVNextLocalOperatorBootstrapV01(fixture.db, {
    config,
    bootstrap_token: issue.bootstrap_token,
    clock: fixedClock(T1),
  }).credential;
}

function requestV01(
  fixture: FixtureV01,
  definition: Pick<
    DefineInitialProjectWorkRequestV01,
    "goal" | "success_criteria" | "non_goals"
  > = {
    goal: "Define one bounded first project goal",
    success_criteria: ["The exact result is verified"],
    non_goals: [],
  },
): DefineInitialProjectWorkRequestV01 {
  const selection = readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!;
  return {
    action: "define_initial_project_work",
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    expected_active_project_id: fixture.project_id,
    expected_active_selection_revision: selection.selection_revision,
    expected_initialization_state: "not_defined",
    ...definition,
  };
}

function revisionRequestV01(
  fixture: FixtureV01,
  currentPacket: TaskContextPacketV01,
  currentLineageKind:
    | "initial_user_defined"
    | "pre_execution_user_revision",
  definition: ProjectWorkDefinitionV01,
): RevisePreExecutionProjectWorkRequestV01 {
  const selection = readActiveProjectSelectionV01(
    fixture.db,
    fixture.workspace_id,
  )!;
  return {
    action: "revise_pre_execution_project_work",
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    expected_active_project_id: fixture.project_id,
    expected_active_selection_revision: selection.selection_revision,
    expected_current_packet_id: currentPacket.packet_id,
    expected_current_packet_fingerprint:
      currentPacket.integrity.fingerprint,
    expected_current_lineage_kind: currentLineageKind,
    ...definition,
  };
}

function insertHistoryRecordV01(
  fixture: FixtureV01,
  recordKind: VNextCoreRecordKindV01,
  createdAt = T1,
): void {
  const payload = { historical: recordKind, workspace_id: fixture.workspace_id, project_id: fixture.project_id };
  insertVNextCoreRecordV01(fixture.db, {
    record_kind: recordKind,
    record_id: `${recordKind}:historical`,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(payload)),
    idempotency_key: null,
    payload,
    created_at: createdAt,
  });
}

function countProjectPacketsV01(fixture: FixtureV01): number {
  return listVNextCoreRecordsV01(fixture.db, {
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    record_kinds: ["task_context_packet"],
    limit: 128,
  }).length;
}

function insertSemanticStateEntryV01(fixture: FixtureV01): void {
  const fingerprint = createProtocolSha256V01("semantic-state-entry");
  fixture.db.prepare(
    `INSERT INTO vnext_semantic_state_entries (
      workspace_id, project_id, presence, target_key, target_ref_json,
      state_ref_json, current_state_fingerprint, bounded_state_summary,
      source_proposal_id, source_proposal_fingerprint,
      source_candidate_id, source_candidate_fingerprint,
      source_transition_receipt_id, source_transition_receipt_fingerprint,
      revision, updated_at
    ) VALUES (?, ?, 'present', ?, '{}', '{}', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
  ).run(
    fixture.workspace_id,
    fixture.project_id,
    createProtocolSha256V01("semantic-state-target"),
    fingerprint,
    "Semantic state exists",
    "proposal:semantic-state",
    fingerprint,
    "candidate:semantic-state",
    fingerprint,
    "transition:semantic-state",
    fingerprint,
    "2026-08-01T00:00:04.000Z",
  );
}

function insertSemanticTargetHeadV01(fixture: FixtureV01): void {
  fixture.db.prepare(
    `INSERT INTO vnext_semantic_target_heads (
      workspace_id, project_id, target_key, revision, presence,
      current_state_fingerprint, source_transition_receipt_id,
      source_transition_receipt_fingerprint, updated_at
    ) VALUES (?, ?, ?, 1, 'absent', NULL, ?, ?, ?)`,
  ).run(
    fixture.workspace_id,
    fixture.project_id,
    createProtocolSha256V01("semantic-head-target"),
    "transition:semantic-head",
    createProtocolSha256V01("semantic-head-transition"),
    "2026-08-01T00:00:04.000Z",
  );
}

function insertSemanticSuccessorPacketV01(
  fixture: FixtureV01,
  prior: TaskContextPacketV01,
): void {
  const packet = structuredClone(prior);
  packet.generated_at = "2026-08-01T00:00:04.000Z";
  packet.compatibility.source_contracts = [
    ...new Set([
      ...packet.compatibility.source_contracts,
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    ]),
  ].sort();
  packet.constraints.context_budget.estimated_tokens =
    (packet.constraints.context_budget.estimated_tokens ?? 0) + 12;
  packet.packet_id = deriveTaskContextPacketIdV01(packet);
  packet.integrity.fingerprint = createTaskContextPacketFingerprintV01(packet);
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: packet.generated_at,
  });
  assert.equal(validation.status, "valid", JSON.stringify(validation));
  insertVNextCoreRecordV01(fixture.db, {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    fingerprint: packet.integrity.fingerprint,
    idempotency_key: createProtocolSha256V01("semantic-successor"),
    payload: packet,
    created_at: packet.generated_at,
  });
}

function credentialFromCookieV01(value: string): VNextLocalOperatorSessionCredentialV01 {
  return readVNextLocalOperatorCredentialFromRequestV01(
    new Request("http://127.0.0.1/api/vnext/operator/project-continuity", {
      headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}` },
    }),
  );
}

function fixedClock(timestamp: string) {
  return { now: () => timestamp };
}

function timestampSequenceV01(start: string): () => string {
  let value = Date.parse(start);
  return () => {
    const next = new Date(value).toISOString();
    value += 100;
    return next;
  };
}

function errorCode(code: string): (error: unknown) => boolean {
  return (error) =>
    Boolean(error && typeof error === "object" && "code" in error && error.code === code);
}
